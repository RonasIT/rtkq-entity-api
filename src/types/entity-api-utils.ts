import { TagDescription } from '@reduxjs/toolkit/query';
import { BaseEntity, EntityRequest, PaginationRequest } from '../models';
import { EntityPartial } from './entity-partial';
import { LifecycleApi, PatchCollection } from './rtk-types';

export type EntityApiUtils<
  TEntity extends BaseEntity,
  TSearchRequest extends PaginationRequest = PaginationRequest,
  TEntityRequest extends EntityRequest = EntityRequest,
> = {
  /**
   * Patches data of an entity in all queries where it is present.
   *
   * @method patchEntityQueries
   * @param {EntityPartial<TEntity>} entityData - The entity data.
   * @param {Object} endpointLifecycle - The endpoint lifecycle.
   * @param {Function} endpointLifecycle.dispatch - The dispatch function.
   * @param {Function} endpointLifecycle.getState - The getState function.
   * @param {Object} [options={}] - The options.
   * @param {boolean} [options.shouldRefetchEntity=false] - Whether to refetch the entity.
   * @param {Array<TagDescription>} [options.tags] - The tags.
   * @returns {Promise<Array<PatchCollection>>} The patch results.
   */
  patchEntityQueries: (
    entityData: EntityPartial<TEntity>,
    endpointLifecycle: Pick<LifecycleApi<TEntity, TEntity>, 'dispatch' | 'getState'>,
    options?: { shouldRefetchEntity?: boolean; tags?: ReadonlyArray<TagDescription<string>> },
  ) => Promise<Array<PatchCollection>>;
  /**
   * Fetches single entity data using `GET /{baseEndpoint}/{id}` with optional params.
   * May be useful in combination with other utilities when customizing `onQueryStarted` behavior.
   *
   * @method patchEntityQueries
   * @param {TEntity['id']} id - The ID of the entity.
   * @param {TEntityRequest} params - The entity request parameters.
   * @param {Object} endpointLifecycle - The endpoint lifecycle.
   * @param {Function} dispatchOptions.dispatch - The dispatch function.
   * @returns {Promise<TEntity>} The fetched entity.
   */
  fetchEntity: (
    id: TEntity['id'],
    params: TSearchRequest | TEntityRequest,
    endpointLifecycle: Pick<LifecycleApi<TEntity, TSearchRequest | TEntityRequest>, 'dispatch'>,
  ) => Promise<TEntity>;
  /**
   * Clears entity queries related to the provided ID. Can be useful to perform pessimistic/optimistic deletion.
   *
   * @param {string} id - The ID of the entity.
   * @param {Object} endpointLifecycle - The endpoint lifecycle.
   * @param {Function} dispatchOptions.dispatch - The dispatch function.
   * @param {Function} dispatchOptions.getState - The getState function.
   * @param {Object} [options={}] - The options.
   * @param {Array<TagDescription>} [options.tags] - The tags of queries to clear.
   * @returns {Promise<Array<PatchCollection>>} The patch results.
   */
  clearEntityQueries: (
    entityId: TEntity['id'],
    endpointLifecycle: Pick<LifecycleApi<void, EntityPartial<TEntity> | TEntity['id']>, 'dispatch' | 'getState'>,
    options?: { tags?: ReadonlyArray<TagDescription<string>> },
  ) => Promise<Array<PatchCollection>>;
  /**
   * Handles entity update.
   * Uses patchEntityQueries under hood and intended to be used in `onQueryStarted` callback to perform optimistic/pessimistic update of entity data in queries connected by tags.
   * If `optimistic` flag is set to true, it performs optimistic patching.
   *
   * @param {EntityPartial<TEntity> | TEntity['id']} arg - The entity data or id.
   * @param {Object} endpointLifecycle - The endpoint lifecycle.
   * @param {Object} endpointLifecycle.dispatch - The dispatch function.
   * @param {Object} endpointLifecycle.getState - The getState function.
   * @param {Object} [options] - The options.
   * @param {boolean} [options.optimistic=false] - Whether to perform optimistic patching.
   * @param {boolean} [options.shouldRefetchEntity=false] - Whether to refetch the entity.
   * @param {Array<TagDescription>} [options.tags] - The tags.
   * @returns {Promise<void>}
   */
  handleEntityUpdate: (
    arg: EntityPartial<TEntity> | TEntity['id'],
    endpointLifecycle: LifecycleApi<EntityPartial<TEntity>, EntityPartial<TEntity> | TEntity['id']>,
    options?: {
      optimistic?: boolean;
      shouldRefetchEntity?: boolean;
      tags?: ReadonlyArray<TagDescription<string>>;
    },
  ) => void | Promise<void>;
  /**
   * Handles entity deletion.
   * Uses `clearEntityQueries` internally and intended to be used in `onQueryStarted` callback to perform optimistic/pessimistic entity delete from search-like queries connected by tags.
   * If `optimistic` flag is set to true, it performs optimistic deleting.
   *
   * @param {TEntity['id']} id - The ID of the entity.
   * @param {Object} endpointLifecycle - The endpoint lifecycle.
   * @param {Object} endpointLifecycle.dispatch - The dispatch function.
   * @param {Object} endpointLifecycle.getState - The getState function.
   * @param {Object} [options] - The options.
   * @param {boolean} [options.optimistic=false] - Whether to perform optimistic deleting.
   * @param {Array<TagDescription>} [options.tags] - The tags of queries to delete.
   * @returns {Promise<void>} The promise.
   */
  handleEntityDelete: (
    arg: TEntity['id'],
    endpointLifecycle: LifecycleApi<void, TEntity['id']>,
    options?: { optimistic?: boolean; tags?: ReadonlyArray<TagDescription<string>> },
  ) => void | Promise<void>;
};
