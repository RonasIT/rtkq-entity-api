import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { RefetchConfigOptions, SubscriptionOptions } from '@reduxjs/toolkit/dist/query/core/apiState.d';
import { range, set } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
    set(entityApi, getPreservedHookName(hookName), entityApi[hookName]);
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
    const [isRefetchingLastPage, setIsRefetchingLastPage] = useState<boolean>(false);
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

    const fetchPage = useCallback(
      (pageNumber: number) => {
        return dispatch(
          entityApi.endpoints.searchInfinite.initiate(
            { ...latestSearchRequest, page: pageNumber },
            { forceRefetch: true },
          ),
        );
      },
      [entityApi, latestSearchRequest],
    );

    const fetchNextPage = useCallback(() => {
      if (hasNextPage && !isFetching) {
        setIsFetchingNextPage(true);
        fetchPage((maxFetchedPage || 1) + 1);
      }
    }, [hasNextPage, isFetching, maxFetchedPage, fetchPage]);

    const fetchPreviousPage = useCallback(() => {
      if (hasPreviousPage && !isFetching) {
        setIsFetchingPreviousPage(true);
        fetchPage(minPage - 1);
      }
    }, [minPage, isFetching, hasPreviousPage, fetchPage]);

    const refetchAllPages = useCallback(async () => {
      setIsRefetching(true);

      for (const pageNumber of range(minPage, pagination.currentPage + 1)) {
        await fetchPage(pageNumber);
      }

      setIsRefetching(false);
    }, [minPage, pagination?.currentPage, fetchPage]);

    const refetchLastPage = useCallback(() => {
      if (maxFetchedPage) {
        setIsRefetchingLastPage(true);
        fetchPage(maxFetchedPage);
      }
    }, [maxFetchedPage, fetchPage]);

    const refetch = useCallback(() => {
      setIsRefetching(true);

      return restEndpointData.refetch();
    }, [restEndpointData.refetch]);

    useEffect(() => {
      if (!isFetching) {
        setIsRefetching(false);
        setIsFetchingNextPage(false);
        setIsFetchingPreviousPage(false);
        setIsRefetchingLastPage(false);
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
      isRefetchingLastPage,
      hasNextPage,
      hasPreviousPage,
      fetchNextPage,
      fetchPreviousPage,
      refetch,
      refetchLastPage,
      refetchAllPages
    };

    return result;
  };
