import { BaseQueryFn, createApi, CreateApiOptions, EndpointDefinitions } from '@reduxjs/toolkit/query/react';
import { SetOptional } from 'type-fest';
import { BaseQueryFunction } from './create-axios-base-query';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
/**
 * Creates a function that creates RTK Query API with common options.
 *
 * @template T - Options for RTK Query API `createApi`.
 * @param {T} commonCreateApiOptions - common options for RTK Query API `createApi`, requires `baseQuery` function.
 * @returns {function} - A function that creates RTK Query API with
 * `commonCreateApiOptions` and additional options passed in arguments.
 */
export const createApiCreator = <
  T extends Partial<Parameters<typeof createApi>[0]> & {
    baseQuery: BaseQueryFunction | BaseQueryFn;
  },
>(
  commonCreateApiOptions: T,
) => {
  /**
   * Creates RTK Query API with common options and additional options passed in arguments.
   *
   * @template BaseQuery - Base query function.
   * @template Definitions - Endpoint definitions.
   * @template ReducerPath - Reducer path.
   * @template TagTypes - Tag types.
   * @param {SetOptional<CreateApiOptions<BaseQuery, Definitions, ReducerPath, TagTypes>, 'baseQuery'>} createApiOptions - Options for RTK Query API.
   * @returns {ReturnType<typeof createApi>} - Created RTK Query API.
   */
  return <
    BaseQuery extends (typeof commonCreateApiOptions)['baseQuery'],
    Definitions extends EndpointDefinitions,
    ReducerPath extends string = 'api',
    TagTypes extends string = never,
  >(
    createApiOptions: SetOptional<CreateApiOptions<BaseQuery, Definitions, ReducerPath, TagTypes>, 'baseQuery'>,
  ) => {
    if (!commonCreateApiOptions.baseQuery && !createApiOptions.baseQuery) {
      throw new Error('Passing baseQuery is required in createApiCreator. Either pass it in commonOptions or in args');
    }

    return createApi({
      ...commonCreateApiOptions,
      ...createApiOptions
    } as CreateApiOptions<BaseQuery, Definitions, ReducerPath, TagTypes>);
  };
};
