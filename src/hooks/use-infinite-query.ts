import { UnknownAction, ThunkDispatch } from '@reduxjs/toolkit';
import { RefetchConfigOptions, SubscriptionOptions } from '@reduxjs/toolkit/dist/query/core/apiState.d';
import { omit, range } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BaseEntity, PaginationRequest } from '../models';
import { Pagination } from '../models/pagination';
import { EntityApi, EntityMutationEndpointName } from '../types';

export const useInfiniteQuery = <TEntity extends BaseEntity, TRequest extends PaginationRequest>(
  entityApi: Pick<
    EntityApi<TEntity, TRequest, any, Array<EntityMutationEndpointName>>,
    'useSearchInfiniteQuery' | 'endpoints' | 'util'
  >,
  initialParams?: TRequest,
  queryOptions?: SubscriptionOptions & RefetchConfigOptions & { skip?: boolean },
): typeof result => {
  const dispatch: ThunkDispatch<any, any, UnknownAction> = useDispatch();
  const [searchRequest, setSearchRequest] = useState<TRequest>(initialParams as TRequest);
  const { data, isFetching, ...restEndpointData } = entityApi.useSearchInfiniteQuery(searchRequest, queryOptions);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [isFetchingPreviousPage, setIsFetchingPreviousPage] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const { items, pagination, minPage, hasNextPage, hasPreviousPage } = useMemo(() => {
    const items = data?.data || [];
    const pagination = data?.pagination as Pagination;
    const minPage = data?.minPage || data?.pagination.currentPage || 1;

    return {
      minPage,
      hasPreviousPage: minPage > 1,
      hasNextPage: pagination?.currentPage < pagination?.lastPage,
      data,
      items,
      pagination
    };
  }, [data]);

  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setIsFetchingNextPage(true);
      setSearchRequest(({ page = 1, ...rest }) => ({ ...rest, page: page + 1 }) as TRequest);
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

    for (const pageNumber of range(minPage, pagination.currentPage + 1)) {
      await dispatch(
        entityApi.endpoints.searchInfinite.initiate({ ...searchRequest, page: pageNumber }, { forceRefetch: true }),
      );
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
        setSearchRequest(({ ...rest }) => ({ ...rest, page }));
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
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isRefetching,
    hasNextPage,
    hasPreviousPage,
    searchRequest,
    setSearchRequest,
    fetchNextPage,
    fetchPreviousPage,
    refetch,
    refetchPage,
    refetchAllPages
  };

  return result;
};
