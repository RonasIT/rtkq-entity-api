import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { RootState } from '@reduxjs/toolkit/query';

export type LifecycleApi<ReducerPath extends string = string> = {
  dispatch: ThunkDispatch<any, any, UnknownAction>;
  getState(): RootState<any, any, ReducerPath>;
  extra: unknown;
  requestId: string;
};
