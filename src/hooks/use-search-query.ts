import { RefetchConfigOptions, SubscriptionOptions } from '@reduxjs/toolkit/dist/query/core/apiState.d';
import { useEffect, useState } from 'react';
import { BaseEntity, PaginationRequest } from '../models';
import { EntityApi, EntityMutationEndpointName } from '../types';

export const useSearchQuery = <TEntity extends BaseEntity, TRequest extends PaginationRequest>(
  entityApi: EntityApi<TEntity, TRequest, any, Array<EntityMutationEndpointName>>,
  initialParams?: TRequest,
  queryOptions?: SubscriptionOptions & RefetchConfigOptions & { skip?: boolean },
): typeof result => {
  const [isRefetching, setIsRefetching] = useState(false);
  const [searchRequest, setSearchRequest] = useState<TRequest>(initialParams as TRequest);
  const { refetch, isFetching, ...restEndpointData } = entityApi.useSearchQuery(searchRequest, queryOptions);

  const handleRefetch = (): void => {
    setIsRefetching(true);
    refetch();
  };

  useEffect(() => {
    if (!isFetching) {
      setIsRefetching(false);
    }
  }, [isFetching]);

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
