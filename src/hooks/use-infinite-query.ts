import { UnknownAction, ThunkDispatch } from '@reduxjs/toolkit';
import { RefetchConfigOptions, SubscriptionOptions } from '@reduxjs/toolkit/dist/query/core/apiState.d';
import { omit, range } from 'lodash';
import { SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BaseEntity, PaginationRequest, PaginationResponse } from '../models';
import { EntityApi, EntityMutationEndpointName } from '../types';

export const useInfiniteQuery = <
  TEntity extends BaseEntity,
  TRequest extends PaginationRequest,
  TPaginationResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
>(
  entityApi: Pick<
    EntityApi<TEntity, TRequest, any, TPaginationResponse, Array<EntityMutationEndpointName>>,
    'useSearchInfiniteQuery' | 'endpoints' | 'util'
  >,
  initialParams?: TRequest,
  queryOptions?: Partial<SubscriptionOptions & RefetchConfigOptions & { skip?: boolean }>,
  utilities: { checkHasNextPage?: (paginationResponse?: PaginationResponse<TEntity>) => boolean } = {},
): typeof result => {
  const dispatch: ThunkDispatch<any, any, UnknownAction> = useDispatch();
  const [searchRequest, setSearchRequest] = useState<TRequest>(initialParams as TRequest);
  const [searchOptions, setSearchOptions] = useState(queryOptions);
  const { data, isFetching, ...restEndpointData } = entityApi.useSearchInfiniteQuery(searchRequest, searchOptions);
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

  const changeSearchRequest = useCallback(
    (setSearchRequestAction: SetStateAction<TRequest>) => {
      setSearchRequest(setSearchRequestAction);
      setSearchOptions(queryOptions);
    },
    [queryOptions],
  );

  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setIsFetchingNextPage(true);
      changeSearchRequest(({ page = 1, ...rest }) => ({ ...rest, page: page + 1 }) as TRequest);
    }
  }, [hasNextPage, isFetching]);

  const fetchPreviousPage = useCallback(() => {
    if (hasPreviousPage && !isFetching) {
      setIsFetchingPreviousPage(true);
      dispatch(
        entityApi.endpoints.searchInfinite.initiate({
          ...searchRequest,
          page: minPage - 1
        }),
      );
    }
  }, [minPage, isFetching, hasPreviousPage, searchRequest, entityApi]);

  const refetchAllPages = useCallback(async () => {
    setIsRefetching(true);

    for (const pageNumber of range(minPage, pagination.currentPage)) {
      await dispatch(entityApi.endpoints.searchInfinite.initiate({ ...searchRequest, page: pageNumber }));
    }
  }, [minPage, pagination, searchRequest, entityApi]);

  const refetchPage = useCallback(
    async ({ page, withDataReset }: { page: number; withDataReset?: boolean }) => {
      if (withDataReset) {
        dispatch(
          entityApi.util.updateQueryData('searchInfinite', omit(searchRequest, 'page') as TRequest, (draft) => {
            draft.data = [];
            draft.minPage = page;
            draft.pagination.currentPage = page;
          }),
        );
        changeSearchRequest(({ ...rest }) => ({ ...rest, page }));
      }

      return dispatch(
        entityApi.endpoints.searchInfinite.initiate({ ...searchRequest, page: 1 }, { forceRefetch: true }),
      );
    },
    [searchRequest, entityApi],
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
    searchRequest,
    setSearchRequest: changeSearchRequest,
    fetchNextPage,
    fetchPreviousPage,
    refetch,
    refetchPage,
    refetchAllPages
  };

  return result;
};
