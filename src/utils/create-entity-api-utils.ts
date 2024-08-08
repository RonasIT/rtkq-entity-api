import { PatchCollection } from '@reduxjs/toolkit/dist/query/core/buildThunks.d';
import { ClassConstructor } from 'class-transformer';
import { merge } from 'lodash';
import { EntityTagID } from '../enums';
import { BaseEntity, EntityRequest, PaginationRequest, PaginationResponse } from '../models';
import {
  EntityApi,
  EntityApiUtils,
  EntityMutationEndpointName,
  EntityPartial,
  EntityQueryEndpointName
} from '../types';
import { createEntityInstance } from './create-entity-instance';

/**
 * Creates entity API utilities in addition to existing RTKQ utils.
 *
 * @template TEntity - The entity model class constructor.
 * @template TSearchRequest - The search request class constructor. Defaults to PaginationRequest.
 * @template TEntityRequest - The get request class constructor. Defaults to EntityRequest.
 * @template TSearchResponse - The search response class constructor. Defaults to PaginationResponse.
 * @param {Object} options - The options for creating entity API utilities.
 * @param {EntityApi<TEntity, TSearchRequest, TEntityRequest, TSearchResponse, Array<EntityMutationEndpointName>>} options.api - The entity API to add utils.
 * @param {ClassConstructor<TSearchRequest> | typeof PaginationRequest} [options.entitySearchRequestConstructor=PaginationRequest] - The entity search request constructor.
 * @param {ClassConstructor<TEntityRequest> | typeof EntityRequest} [options.entityGetRequestConstructor=EntityRequest] - The entity get request constructor.
 * @returns {EntityApiUtils<TEntity, TSearchRequest, TEntityRequest>} The entity API utilities.
 */
export const createEntityApiUtils = <
  TEntity extends BaseEntity,
  TSearchResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
  TSearchRequest extends PaginationRequest = PaginationRequest,
  TEntityRequest extends EntityRequest = EntityRequest,
>(options: {
  api: EntityApi<TEntity, TSearchRequest, TEntityRequest, TSearchResponse, Array<EntityMutationEndpointName>>;
  entitySearchRequestConstructor?: ClassConstructor<TSearchRequest> | typeof PaginationRequest;
  entityGetRequestConstructor?: ClassConstructor<TEntityRequest> | typeof EntityRequest;
}): EntityApiUtils<TEntity, TSearchRequest, TEntityRequest> => {
  const { entitySearchRequestConstructor = PaginationRequest, entityGetRequestConstructor = EntityRequest } = options;
  const api = options.api as EntityApi<
    TEntity,
    TSearchRequest,
    TEntityRequest,
    TSearchResponse,
    Array<EntityMutationEndpointName>
  >;
  const entityName = api.reducerPath;

  /**
   * The entity API utilities.
   * @type {EntityApiUtils<TEntity, TSearchRequest, TEntityRequest>}
   */
  const entityApiUtils: EntityApiUtils<TEntity, TSearchRequest, TEntityRequest> = {
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
    fetchEntity: async (id, params, { dispatch }) => {
      const entityRequest = createEntityInstance<TEntityRequest>(
        entityGetRequestConstructor as ClassConstructor<TEntityRequest>,
        params,
        {
          convertFromInstance: entitySearchRequestConstructor as ClassConstructor<TSearchRequest>
        },
      );

      return await dispatch(api.endpoints.get.initiate({ id, params: entityRequest }, { forceRefetch: true })).unwrap();
    },
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
    patchEntityQueries: async (entityData, { dispatch, getState }, options = {}) => {
      const { shouldRefetchEntity, tags } = options;
      const patchResults: Array<PatchCollection> = [];

      if (!entityData?.id) {
        return patchResults;
      }

      const cachedQueries = api.util.selectInvalidatedBy(
        getState(),
        tags || [
          { type: entityName, id: entityData.id },
          // TODO: Remove selecting all lists once issue is fixed: https://github.com/reduxjs/redux-toolkit/issues/3583
          { type: entityName, id: EntityTagID.LIST }
        ],
      );

      for (const { endpointName, originalArgs } of cachedQueries) {
        const existingEntity = shouldRefetchEntity
          ? await entityApiUtils.fetchEntity(entityData.id, originalArgs?.params || originalArgs, { dispatch })
          : entityData;

        const action = api.util.updateQueryData(
          endpointName as EntityQueryEndpointName,
          originalArgs as any,
          (endpointData) => {
            if ('data' in endpointData && Array.isArray(endpointData.data)) {
              const existingItemIndex = endpointData.data.findIndex((item) => item.id === entityData.id);

              if (existingItemIndex > -1) {
                endpointData.data[existingItemIndex] = merge(endpointData.data[existingItemIndex], existingEntity);
              }
            } else {
              merge(endpointData, existingEntity);
            }
          },
        );

        const patchResult = dispatch(action);
        patchResults.push(patchResult);
      }

      return patchResults;
    },
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
    clearEntityQueries: async (id, { dispatch, getState }, { tags } = {}) => {
      const patchResults: Array<PatchCollection> = [];

      if (!id) {
        return patchResults;
      }

      const cachedQueries = api.util.selectInvalidatedBy(
        getState(),
        tags || [
          { type: entityName, id },
          // TODO: Remove selecting all lists once issue is fixed: https://github.com/reduxjs/redux-toolkit/issues/3583
          { type: entityName, id: EntityTagID.LIST }
        ],
      );

      for (const { endpointName, originalArgs } of cachedQueries) {
        const action = api.util.updateQueryData(
          endpointName as EntityQueryEndpointName,
          originalArgs as any,
          (endpointData) => {
            if ('data' in endpointData && Array.isArray(endpointData.data)) {
              const existingItemIndex = endpointData.data.findIndex((item) => item.id === id);

              if (existingItemIndex > -1) {
                endpointData.data.splice(existingItemIndex, 1);
                endpointData.pagination.total--;
              }
            }
          },
        );

        const patchResult = dispatch(action);
        patchResults.push(patchResult);
      }

      return patchResults;
    },
    /**
     * @deprecated This utility will be removed. Please use 'util.upsertQueryData' if you need to prefill entity query.
     */
    handleEntityCreate: async (_args, { dispatch, queryFulfilled }) => {
      const { data: createdEntity } = await queryFulfilled;

      if (createdEntity?.id) {
        await dispatch(api.util.upsertQueryData('get', { id: createdEntity.id }, createdEntity));
      }
    },
    /**
     * @deprecated This utility will be removed. Please use 'util.upsertQueryData' if you need to prefill entity query.
     */
    handleEntitySearch: async (request, { shouldUpsertEntityQueries = false, dispatch, queryFulfilled }) => {
      if (!shouldUpsertEntityQueries) {
        return;
      }

      const { data: response } = await queryFulfilled;

      const entityRequest = createEntityInstance<TEntityRequest>(
        entityGetRequestConstructor as ClassConstructor<TEntityRequest>,
        request,
        { convertFromInstance: entitySearchRequestConstructor as ClassConstructor<TSearchRequest> },
      );

      for (const entity of response.data) {
        dispatch(api.util.upsertQueryData('get', { id: entity.id, params: entityRequest }, entity));
      }
    },
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
    handleEntityUpdate: async (arg, { dispatch, queryFulfilled, getState }, options) => {
      const { optimistic = false, shouldRefetchEntity = false, tags } = options || {};
      const itemPatch = typeof arg === 'object' && arg.id ? arg : ({ id: arg } as EntityPartial<TEntity>);

      if (optimistic) {
        const patches = await entityApiUtils.patchEntityQueries(
          itemPatch,
          { dispatch, getState },
          { shouldRefetchEntity, tags },
        );

        queryFulfilled.catch(() => {
          patches.forEach((patch) => {
            patch.undo();
          });
        });
      } else {
        const updatedEntityData = (await queryFulfilled).data;

        await entityApiUtils.patchEntityQueries(
          updatedEntityData || itemPatch,
          { dispatch, getState },
          { shouldRefetchEntity, tags },
        );
      }
    },
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
    handleEntityDelete: async (id, { dispatch, queryFulfilled, getState }, options) => {
      const { optimistic, tags } = options || {};

      if (optimistic) {
        const patches = await entityApiUtils.clearEntityQueries(id, { dispatch, getState }, { tags });

        queryFulfilled.catch(() => {
          patches.forEach((patch) => {
            patch.undo();
          });
        });
      } else {
        await queryFulfilled;

        await entityApiUtils.clearEntityQueries(id, { dispatch, getState }, { tags });
      }
    }
  };

  return entityApiUtils;
};
