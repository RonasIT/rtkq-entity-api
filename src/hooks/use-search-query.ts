import { SubscriptionOptions } from '@reduxjs/toolkit/query';
import { RefetchConfigOptions } from '@reduxjs/toolkit/src/query/core/apiState';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { BaseEntity, PaginationRequest, PaginationResponse } from '../models';
import { EntityApi, EntityMutationEndpointName } from '../types';

/**
 * @deprecated This hook will be removed. Instead, use 'useSearchQuery' hook in your entity API directly
 */
export const useSearchQuery = <
  TEntity extends BaseEntity,
  TRequest extends PaginationRequest,
  TResponse extends PaginationResponse<TEntity>,
>(
  entityApi: Pick<
    EntityApi<TEntity, TRequest, any, TResponse, Array<EntityMutationEndpointName>>,
    'endpoints' | 'util'
  >,
  initialParams?: TRequest,
  queryOptions?: SubscriptionOptions & RefetchConfigOptions & { skip?: boolean },
): typeof result => {
  const [isRefetching, setIsRefetching] = useState(false);
  const [searchRequest, setSearchRequest] = useState<TRequest>(initialParams as TRequest);
  const [searchOptions, setSearchOptions] = useState(queryOptions);
  const { refetch, isFetching, ...restEndpointData } = (
    entityApi as EntityApi<TEntity, TRequest, any, TResponse>
  ).useSearchQuery(searchRequest, searchOptions);

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
