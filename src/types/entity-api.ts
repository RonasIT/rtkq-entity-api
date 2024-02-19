import { coreModuleName } from '@reduxjs/toolkit/dist/query/core/module.d';
import {
  EndpointBuilder,
  EndpointDefinitions,
  UpdateDefinitions
} from '@reduxjs/toolkit/dist/query/endpointDefinitions.d';
import { reactHooksModuleName } from '@reduxjs/toolkit/dist/query/react/module.d';
import { NoInfer } from '@reduxjs/toolkit/dist/tsHelpers.d';
import { Api, MutationDefinition, QueryDefinition } from '@reduxjs/toolkit/query/react';
import { BaseEntity, EntityRequest, PaginationRequest, PaginationResponse } from '../models';
import { BaseQueryFunction } from '../utils';
import { EntityApiUtils } from './entity-api-utils';
import { EntityPartial } from './entity-partial';

export type EntityEndpointsDefinitions<
  TEntity extends BaseEntity,
  TSearchRequest extends object = PaginationRequest,
  TEntityRequest extends object = EntityRequest,
  TSearchResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
> = {
  create: MutationDefinition<Partial<TEntity>, BaseQueryFunction, string, TEntity>;
  search: QueryDefinition<TSearchRequest, BaseQueryFunction, string, TSearchResponse>;
  searchInfinite: QueryDefinition<TSearchRequest, BaseQueryFunction, string, TSearchResponse & { minPage?: number }>;
  get: QueryDefinition<{ id: TEntity['id']; params?: TEntityRequest }, BaseQueryFunction, string, TEntity>;
  update: MutationDefinition<EntityPartial<TEntity>, BaseQueryFunction, string, EntityPartial<TEntity>>;
  delete: MutationDefinition<number, BaseQueryFunction, string, void>;
};

export type EntityApi<
  TEntity extends BaseEntity,
  TSearchRequest extends object = PaginationRequest,
  TEntityRequest extends object = EntityRequest,
  TSearchResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
  TOmitEndpoints extends Readonly<Array<EntityEndpointName>> | void = never,
  TEndpointDefinitions extends Partial<
    EntityEndpointsDefinitions<TEntity, TSearchRequest, TEntityRequest, TSearchResponse>
  > = Omit<
    EntityEndpointsDefinitions<TEntity, TSearchRequest, TEntityRequest, TSearchResponse>,
    TOmitEndpoints extends Readonly<Array<EntityEndpointName>> ? TOmitEndpoints[number] : never
  >,
> = Omit<
  Api<BaseQueryFunction, TEndpointDefinitions, string, string, typeof coreModuleName | typeof reactHooksModuleName>,
  'injectEndpoints' | 'enhanceEndpoints'
> & {
  injectEndpoints<TNewDefinitions extends EndpointDefinitions>(_: {
    endpoints: (build: EndpointBuilder<BaseQueryFunction, string, string>) => TNewDefinitions;
    overrideExisting?: boolean;
  }): EntityApi<
    TEntity,
    TSearchRequest,
    TEntityRequest,
    TSearchResponse,
    TOmitEndpoints,
    TEndpointDefinitions & TNewDefinitions
  >;

  enhanceEndpoints<TNewTagTypes extends string = never, TNewDefinitions extends EndpointDefinitions = never>(_: {
    addTagTypes?: Array<TNewTagTypes>;
    endpoints?: UpdateDefinitions<
      TEndpointDefinitions,
      string | NoInfer<TNewTagTypes>,
      TNewDefinitions
    > extends infer TNewDefinitions
      ? {
          [K in keyof TNewDefinitions]?: Partial<TNewDefinitions[K]> | ((definition: TNewDefinitions[K]) => void);
        }
      : never;
  }): EntityApi<
    TEntity,
    TSearchRequest,
    TEntityRequest,
    TSearchResponse,
    TOmitEndpoints,
    TEndpointDefinitions & TNewDefinitions
  >;
} & { util: EntityApiUtils<TEntity, TSearchRequest> };

export type EntityEndpointName = keyof EntityEndpointsDefinitions<BaseEntity>;
export type EntityQueryEndpointName = Exclude<EntityEndpointName, 'create' | 'update' | 'delete'>;
export type EntityMutationEndpointName = Exclude<EntityEndpointName, EntityQueryEndpointName>;
