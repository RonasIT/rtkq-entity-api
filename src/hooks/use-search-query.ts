import { RefetchConfigOptions, SubscriptionOptions } from '@reduxjs/toolkit/dist/query/core/apiState.d';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { BaseEntity, PaginationRequest, PaginationResponse } from '../models';
import { EntityApi, EntityMutationEndpointName } from '../types';

export const useSearchQuery = <
  TEntity extends BaseEntity,
  TRequest extends PaginationRequest,
  TResponse extends PaginationResponse<TEntity>,
>(
  entityApi: EntityApi<TEntity, TRequest, any, TResponse, Array<EntityMutationEndpointName>>,
  initialParams?: TRequest,
  queryOptions?: SubscriptionOptions & RefetchConfigOptions & { skip?: boolean },
): typeof result => {
  const [isRefetching, setIsRefetching] = useState(false);
  const [searchRequest, setSearchRequest] = useState<TRequest>(initialParams as TRequest);
  const [searchOptions, setSearchOptions] = useState(queryOptions);
  const { refetch, isFetching, ...restEndpointData } = entityApi.useSearchQuery(searchRequest, searchOptions);

  const handleRefetch = (): void => {
    setIsRefetching(true);
    refetch();
  };

  useEffect(() => {
    if (!isFetching) {
      setIsRefetching(false);
    }
  }, [isFetching]);

  useEffect(() => {
    if (!isEqual(queryOptions, searchOptions)) {
      setSearchOptions(queryOptions);
    }
  }, [queryOptions]);

  const result = {
    ...restEndpointData,
    isFetching,
    isRefetching,
    refetch: handleRefetch,
    searchRequest,
    setSearchRequest
  };

  return result;
};
