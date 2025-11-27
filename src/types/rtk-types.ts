// NOTE: This file contains types that are not exported by @reduxjs/toolkit but are used in the package
import { TypedMutationOnQueryStarted } from '@reduxjs/toolkit/query';
import { Draft, Patch } from 'immer';
import { BaseEntity } from '../models';
import { BaseQueryFunction } from '../utils';
import { EntityPartial } from './entity-partial';

export type LifecycleApi<
  TResult extends BaseEntity | EntityPartial<BaseEntity> | void,
  TArg,
  TBaseQueryFunction extends BaseQueryFunction = BaseQueryFunction,
> =
  // @ts-expect-error - TypedMutationOnQueryStarted is not exported by @reduxjs/toolkit
  Parameters<TypedMutationOnQueryStarted<TResult, TArg, TBaseQueryFunction>>[1];

export type PatchCollection = {
  patches: Array<Patch>;
  inversePatches: Array<Patch>;
  undo: () => void;
};

export type MaybeDrafted<T> = T | Draft<T>;
