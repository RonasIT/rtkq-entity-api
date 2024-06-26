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

  const entityApiUtils: EntityApiUtils<TEntity, TSearchRequest, TEntityRequest> = {
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
    handleEntityUpdate: async (arg, { dispatch, queryFulfilled, getState }, options) => {
      const { optimistic, shouldRefetchEntity, tags } = options || {};
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
