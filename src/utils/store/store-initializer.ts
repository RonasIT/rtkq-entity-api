import {
  Action,
  configureStore,
  Reducer,
  StateFromReducersMapObject,
  Store as ToolkitStore,
  Middleware,
  EnhancedStore,
  StoreEnhancer
} from '@reduxjs/toolkit';
import { OmitIndexSignature } from 'type-fest';

export type AppStateFromRootReducer<TRootReducer> = StateFromReducersMapObject<OmitIndexSignature<TRootReducer>>;

export type AppToolkitStore<TRootReducer> = ToolkitStore<AppStateFromRootReducer<TRootReducer>, Action, Middleware>;

export type CreateStoreInitializerArgs<T extends object> = {
  rootReducer: Reducer<T>;
  middlewares?: Array<Middleware>;
  enhancers?: Array<StoreEnhancer>;
};

export function createStoreInitializer<State extends object>({
  rootReducer,
  middlewares = [],
  enhancers = []
}: CreateStoreInitializerArgs<State>) {
  return function initStore(context?: unknown): EnhancedStore<State> {
    const store = configureStore({
      reducer: rootReducer as unknown as Reducer<State>,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware({
          serializableCheck: false,
          thunk: { extraArgument: context }
        }).concat(middlewares),
      enhancers: (getDefaultEnhancers) => getDefaultEnhancers().concat(enhancers)
    });

    return store;
  };
}
