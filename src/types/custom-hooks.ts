import { BaseEntity, PaginationRequest, PaginationResponse } from '../models';
import { createInfiniteQueryHook } from '../utils';

export type EntityApiCustomHooks<
  TEntity extends BaseEntity = BaseEntity,
  TSearchRequest extends PaginationRequest = PaginationRequest,
  TSearchResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
> = {
  /**
   * @deprecated This hook will be removed. Instead, use 'useSearchPaginatedInfiniteQuery' hook in your entity API
   */
  useSearchInfiniteQuery: ReturnType<typeof createInfiniteQueryHook<TEntity, TSearchRequest, TSearchResponse>>;
};
