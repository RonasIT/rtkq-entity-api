import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { RefetchConfigOptions, SubscriptionOptions } from '@reduxjs/toolkit/dist/query/core/apiState.d';
import { omit, range, set } from 'lodash';
import { SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BaseEntity, PaginationRequest, PaginationResponse } from '../models';
import { EntityApi, EntityApiCustomHooks, EntityMutationEndpointName } from '../types';

export const createEntityApiHooks = <
  TEntity extends BaseEntity,
  TRequest extends PaginationRequest,
  TPaginationResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
>(
  entityApi: Pick<
    EntityApi<TEntity, TRequest, any, TPaginationResponse, Array<EntityMutationEndpointName>>,
    'useSearchInfiniteQuery' | 'endpoints' | 'util'
  >,
): EntityApiCustomHooks<TEntity, TRequest, TPaginationResponse> => {
  const entityApiHooks = {
    useSearchInfiniteQuery: createInfiniteQueryHook(entityApi)
  };

  // NOTE: Preserve original hooks to extend them
  Object.keys(entityApiHooks).forEach((key) => {
    const hookName = key as keyof EntityApiCustomHooks;
    set(entityApi, getPreservedHookName(hookName), entityApiHooks[hookName]);
  });

  return entityApiHooks;
};

export const getPreservedHookName = (name: keyof EntityApiCustomHooks): typeof name => {
  return `${name}Original` as typeof name;
};

export const createInfiniteQueryHook =
  <
    TEntity extends BaseEntity,
    TRequest extends PaginationRequest,
    TPaginationResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
  >(
    entityApi: Pick<
      EntityApi<TEntity, TRequest, any, TPaginationResponse, Array<EntityMutationEndpointName>>,
      'useSearchInfiniteQuery' | 'endpoints' | 'util'
    >,
  ) => (
    searchRequest: TRequest = {} as TRequest,
    queryOptions: Partial<SubscriptionOptions & RefetchConfigOptions & { skip?: boolean }> = {},
    utilities: { checkHasNextPage?: (paginationResponse?: PaginationResponse<TEntity>) => boolean } = {},
  ): typeof result => {
    const dispatch: ThunkDispatch<any, any, UnknownAction> = useDispatch();
    const { data, isFetching, ...restEndpointData } = entityApi[getPreservedHookName('useSearchInfiniteQuery')](
      searchRequest as TRequest,
      queryOptions,
    );
    const latestSearchRequest = restEndpointData.originalArgs || searchRequest;
    const maxFetchedPage = data?.pagination?.currentPage;

    const [isRefetching, setIsRefetching] = useState<boolean>(false);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [isFetchingPreviousPage, setIsFetchingPreviousPage] = useState(false);
    const { checkHasNextPage } = utilities;

    const { items, pagination, minPage, hasNextPage, hasPreviousPage } = useMemo(() => {
      const items = data?.data || [];
      const pagination = data?.pagination as TPaginationResponse['pagination'];
      const minPage = data?.minPage || data?.pagination.currentPage || 1;

      return {
        minPage,
        hasPreviousPage: minPage > 1,
        hasNextPage: checkHasNextPage?.(data) || pagination?.currentPage < pagination?.lastPage,
        data,
        items,
        pagination
      };
    }, [data]);

    const setSearchRequest = useCallback(
      (newRequest: SetStateAction<TRequest>) => {
        const request =
          typeof newRequest === 'function' ? newRequest((latestSearchRequest as TRequest) || {}) : newRequest;

        dispatch(entityApi.endpoints.searchInfinite.initiate(request, { forceRefetch: true }));
      },
      [entityApi, latestSearchRequest],
    );

    const fetchNextPage = useCallback(() => {
      if (hasNextPage && !isFetching) {
        setIsFetchingNextPage(true);
        setSearchRequest((currentRequest) => ({ ...currentRequest, page: (maxFetchedPage || 1) + 1 }));
      }
    }, [hasNextPage, isFetching, maxFetchedPage, setSearchRequest]);

    const fetchPreviousPage = useCallback(() => {
      if (hasPreviousPage && !isFetching) {
        setIsFetchingPreviousPage(true);
        setSearchRequest((currentRequest) => ({ ...currentRequest, page: minPage - 1 }));
      }
    }, [minPage, isFetching, hasPreviousPage, entityApi, setSearchRequest]);

    const refetchAllPages = useCallback(async () => {
      setIsRefetching(true);

      for (const pageNumber of range(minPage, pagination.currentPage + 1)) {
        await dispatch(entityApi.endpoints.searchInfinite.initiate({ ...latestSearchRequest, page: pageNumber }));
      }

      setIsRefetching(false);
    }, [minPage, pagination, latestSearchRequest, entityApi]);

    const refetchPage = useCallback(
      async ({ page, withDataReset }: { page: number; withDataReset?: boolean }) => {
        if (withDataReset) {
          dispatch(
            entityApi.util.updateQueryData('searchInfinite', omit(latestSearchRequest, 'page') as TRequest, (draft) => {
              draft.data = [];
              draft.minPage = page;
              draft.pagination.currentPage = page;
            }),
          );
          setSearchRequest(({ ...rest }) => ({ ...rest, page }));
        }

        return dispatch(
          entityApi.endpoints.searchInfinite.initiate({ ...latestSearchRequest, page: 1 }, { forceRefetch: true }),
        );
      },
      [entityApi, latestSearchRequest],
    );

    const refetch = useCallback(() => {
      setIsRefetching(true);

      return refetchPage({ page: 1, withDataReset: true });
    }, [refetchPage]);

    useEffect(() => {
      if (!isFetching) {
        setIsRefetching(false);
        setIsFetchingNextPage(false);
        setIsFetchingPreviousPage(false);
      }
    }, [isFetching]);

    const result = {
      ...restEndpointData,
      data: items,
      pagination,
      isFetching,
      isFetchingNextPage,
      isFetchingPreviousPage,
      isRefetching,
      hasNextPage,
      hasPreviousPage,
      fetchNextPage,
      fetchPreviousPage,
      refetch,
      refetchPage,
      refetchAllPages
    };

    return result;
  };
