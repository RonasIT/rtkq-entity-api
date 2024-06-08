import { BaseEntity, PaginationRequest, PaginationResponse } from '../models';
import { createInfiniteQueryHook } from '../utils';

export type EntityApiCustomHooks<
  TEntity extends BaseEntity = BaseEntity,
  TSearchRequest extends PaginationRequest = PaginationRequest,
  TSearchResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
> = {
  useSearchInfiniteQuery: ReturnType<typeof createInfiniteQueryHook<TEntity, TSearchRequest, TSearchResponse>>;
};
