import { createApi } from '@reduxjs/toolkit/query/react';
import { ClassConstructor, instanceToPlain, plainToInstance } from 'class-transformer';
import { omit, pickBy } from 'lodash';
import { EntityTagID } from './enums';
import { BaseEntity, EntityRequest, PaginationRequest, PaginationResponse } from './models';
import { Pagination } from './models/pagination';
import { EntityApi, EntityEndpointName, EntityPartial } from './types';
import {
  BaseQueryFunction,
  createApiCreator,
  createEntityApiUtils,
  createEntityInstance,
  prepareRequestParams
} from './utils';

export function createEntityApi<
  TEntity extends BaseEntity,
  TSearchRequest extends PaginationRequest = PaginationRequest,
  TEntityRequest extends EntityRequest = EntityRequest,
  TSearchResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
  TOmitEndpoints extends Readonly<Array<EntityEndpointName>> = never,
>({
  omitEndpoints,
  ...options
}: {
  entityName: string;
  baseEndpoint: string;
  baseApiCreator?: ReturnType<typeof createApiCreator>;
  baseQuery?: BaseQueryFunction;
  entityConstructor: ClassConstructor<TEntity>;
  entitySearchRequestConstructor?: ClassConstructor<TSearchRequest>;
  entityGetRequestConstructor?: ClassConstructor<TEntityRequest>;
  entitySearchResponseConstructor?: ClassConstructor<TSearchResponse>;
  omitEndpoints?: TOmitEndpoints;
  getEntityId?: (entity: TEntity) => string | number;
  getCurrentPage?: (pagination: Pagination, request: TSearchRequest) => number;
}): EntityApi<TEntity, TSearchRequest, TEntityRequest, TSearchResponse, typeof omitEndpoints> {
  const {
    entityName,
    baseEndpoint,
    baseApiCreator,
    baseQuery,
    entityConstructor,
    entitySearchRequestConstructor = PaginationRequest,
    entityGetRequestConstructor = EntityRequest,
    entitySearchResponseConstructor = PaginationResponse,
    getEntityId = (item) => item.id,
    getCurrentPage = (pagination) => pagination.currentPage
  } = options;

  if (!baseQuery && !baseApiCreator) {
    throw new Error('Passing "baseQuery" or "baseApiCreator" is required in when using "createEntityAPI"!');
  }

  const initApi = (baseApiCreator as typeof createApi) || createApi;

  const api = initApi({
    reducerPath: entityName,
    baseQuery: baseQuery as BaseQueryFunction,
    tagTypes: [entityName, EntityTagID.LIST],
    endpoints: (builder) => {
      const endpoints = {
        create: builder.mutation<TEntity, Partial<TEntity>>({
          query: (params) => {
            let formattedParams;

            if (params instanceof FormData) {
              formattedParams = params;
            } else {
              const request = createEntityInstance(entityConstructor, params, { fromInstancePartial: true });
              const files = pickBy(params, (value) => value instanceof File);

              formattedParams = {
                ...instanceToPlain(request),
                ...files
              };
            }

            return {
              method: 'post',
              url: baseEndpoint,
              data: formattedParams
            };
          },
          async onQueryStarted(...args) {
            await entityApiUtils.handleEntityCreate(...args);
          },
          transformResponse: (response: object) => createEntityInstance<TEntity>(entityConstructor, response)
        }),

        search: builder.query<TSearchResponse, TSearchRequest>({
          query: (params) => {
            return {
              method: 'get',
              url: baseEndpoint,
              params: prepareRequestParams(params, entitySearchRequestConstructor)
            };
          },
          serializeQueryArgs: ({ queryArgs }) => prepareRequestParams(queryArgs, entitySearchRequestConstructor),
          async onQueryStarted(...args) {
            await entityApiUtils.handleEntitySearch(...args);
          },
          transformResponse: (response) => {
            const { data, pagination } = plainToInstance(entitySearchResponseConstructor, response);

            return {
              pagination,
              data: data.map((item) => createEntityInstance<TEntity>(entityConstructor, item))
            } as TSearchResponse;
          },
          providesTags: (result) => result?.data
              ? [
                  { type: entityName, id: EntityTagID.LIST },
                  ...result.data.map((item) => ({ type: entityName, id: getEntityId(item) }))
                ]
              : [entityName]
        }),

        searchInfinite: builder.query<TSearchResponse & { minPage?: number }, TSearchRequest>({
          query: (params) => {
            return {
              method: 'get',
              url: baseEndpoint,
              params: prepareRequestParams(params, entitySearchRequestConstructor)
            };
          },
          serializeQueryArgs: ({ queryArgs }) => {
            return prepareRequestParams(omit(queryArgs, ['page']) as TSearchRequest, entitySearchRequestConstructor);
          },
          forceRefetch: ({ currentArg, previousArg }) => currentArg?.page !== previousArg?.page,
          async onQueryStarted(...args) {
            await entityApiUtils.handleEntitySearch(...args);
          },
          transformResponse: (response, _, request) => {
            const { data, pagination } = plainToInstance(entitySearchResponseConstructor, response);

            return {
              minPage: pagination.currentPage,
              data: data.map((item) => createEntityInstance<TEntity>(entityConstructor, item)),
              pagination: { ...pagination, currentPage: getCurrentPage(pagination, request) }
            } as TSearchResponse & { minPage?: number };
          },
          providesTags: (result) => result?.data
              ? [
                  { type: entityName, id: EntityTagID.LIST },
                  ...result.data.map((item) => ({ type: entityName, id: getEntityId(item) }))
                ]
              : [entityName],
          merge: (cache, response) => {
            if (
              response.pagination.currentPage === 1 &&
              cache.pagination.currentPage === response.pagination.currentPage
            ) {
              cache.data = response.data;
              cache.pagination = response.pagination;
            } else {
              const fetchedItemsIDs = response.data.map((item) => getEntityId(item));
              cache.data = cache.data.filter((item) => !fetchedItemsIDs.includes(getEntityId(item)));

              if (cache.minPage && response.pagination.currentPage <= cache.minPage) {
                cache.data.unshift(...response.data);
                cache.minPage = response.pagination.currentPage;
              } else {
                cache.data.push(...response.data);
                cache.pagination = response.pagination;
              }
            }
          }
        }),

        get: builder.query<TEntity, { id: TEntity['id']; params?: TEntityRequest }>({
          query: ({ id, params }) => {
            return {
              method: 'get',
              url: `${baseEndpoint}/${id}`,
              params: prepareRequestParams(params, entityGetRequestConstructor)
            };
          },
          serializeQueryArgs: ({ queryArgs: { id, params } }) => {
            const request = prepareRequestParams(params, entityGetRequestConstructor);

            return { id, params: request };
          },
          transformResponse: (response: object) => createEntityInstance<TEntity>(entityConstructor, response),
          providesTags: (result) => (result ? [{ type: entityName, id: result.id }] : [entityName])
        }),

        update: builder.mutation<EntityPartial<TEntity>, EntityPartial<TEntity>>({
          query: (params) => {
            const updatedEntity = createEntityInstance(entityConstructor, params, {
              fromInstancePartial: true
            }) as TEntity;
            const request = instanceToPlain(updatedEntity);

            return {
              method: 'put',
              url: `${baseEndpoint}/${request.id}`,
              data: request
            };
          },
          async onQueryStarted(arg, api) {
            await entityApiUtils.handleEntityUpdate(arg, { ...api, optimistic: false });
          },
          transformResponse: (response: object | undefined, _error, arg) => response
              ? createEntityInstance<TEntity>(entityConstructor, response)
              : (createEntityInstance(entityConstructor, arg, { fromInstancePartial: true }) as TEntity)
        }),

        delete: builder.mutation<void, number>({
          query: (id) => ({
            method: 'delete',
            url: `${baseEndpoint}/${id}`
          }),
          async onQueryStarted(arg, api) {
            await entityApiUtils.handleEntityDelete(arg, { ...api, optimistic: false });
          }
        })
      };

      return omit(endpoints, omitEndpoints || []);
    }
  });

  const entityApiUtils = createEntityApiUtils({
    api: api as unknown as EntityApi<TEntity, TSearchRequest, TEntityRequest, TSearchResponse>,
    entityGetRequestConstructor,
    entitySearchRequestConstructor
  });

  Object.assign(api.util, entityApiUtils);

  return api as unknown as EntityApi<TEntity, TSearchRequest, TEntityRequest, TSearchResponse, typeof omitEndpoints>;
}
