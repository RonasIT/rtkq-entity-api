import { BaseQueryFn, createApi, CreateApiOptions, EndpointDefinitions } from '@reduxjs/toolkit/query/react';
import { SetOptional } from 'type-fest';
import { BaseQueryFunction } from './create-axios-base-query';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createApiCreator = <
  T extends Partial<Parameters<typeof createApi>[0]> & {
    baseQuery: BaseQueryFunction | BaseQueryFn;
  },
>(
  commonCreateApiOptions: T,
) => {
  return <
    BaseQuery extends (typeof commonCreateApiOptions)['baseQuery'],
    Definitions extends EndpointDefinitions,
    ReducerPath extends string = 'api',
    TagTypes extends string = never,
  >(
    createApiOptions: SetOptional<CreateApiOptions<BaseQuery, Definitions, ReducerPath, TagTypes>, 'baseQuery'>,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
