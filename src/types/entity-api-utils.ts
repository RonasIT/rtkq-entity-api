import { PatchCollection } from '@reduxjs/toolkit/dist/query/core/buildThunks.d';
import {
  LifecycleApi,
  MutationLifecycleApi,
  QueryLifecycleApi
} from '@reduxjs/toolkit/dist/query/endpointDefinitions.d';
import { BaseEntity, EntityRequest, PaginationRequest, PaginationResponse } from '../models';
import { BaseQueryFunction } from '../utils/create-axios-base-query';
import { EntityPartial } from './entity-partial';

export type EntityApiUtils<
  TEntity extends BaseEntity,
  TSearchRequest extends PaginationRequest = PaginationRequest,
  TEntityRequest extends EntityRequest = EntityRequest,
> = {
  patchEntityQueries: (
    entityData: EntityPartial<TEntity>,
    endpointLifecycle: Pick<LifecycleApi, 'dispatch' | 'getState'>,
    shouldRefetchEntity?: boolean,
  ) => Promise<Array<PatchCollection>>;
  fetchEntity: (
    id: TEntity['id'],
    params: TSearchRequest | TEntityRequest,
    dispatch: LifecycleApi['dispatch'],
  ) => Promise<TEntity>;
  clearEntityQueries: (
    entityId: TEntity['id'],
    endpointLifecycle: Pick<LifecycleApi, 'dispatch' | 'getState'>,
  ) => Promise<Array<PatchCollection>>;
  handleEntityCreate: (
    arg: Partial<TEntity>,
    endpointLifecycle: MutationLifecycleApi<typeof arg, BaseQueryFunction, TEntity | void, string>,
  ) => void | Promise<void>;
  handleEntitySearch: (
    arg: TSearchRequest,
    endpointLifecycle: {
      shouldUpsertEntityQueries?: boolean;
    } & QueryLifecycleApi<typeof arg, BaseQueryFunction, PaginationResponse<TEntity>, string>,
  ) => void | Promise<void>;
  handleEntityUpdate: (
    arg: EntityPartial<TEntity> | TEntity['id'],
    endpointLifecycle: {
      optimistic?: boolean;
      shouldRefetchEntity?: boolean;
    } & MutationLifecycleApi<typeof arg, BaseQueryFunction, EntityPartial<TEntity> | void, string>,
  ) => void | Promise<void>;
  handleEntityDelete: (
    arg: TEntity['id'],
    endpointLifecycle: { optimistic?: boolean } & MutationLifecycleApi<typeof arg, BaseQueryFunction, void, string>,
  ) => void | Promise<void>;
};
