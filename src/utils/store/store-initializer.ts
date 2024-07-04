import { configureStore, Reducer, Middleware, EnhancedStore, StoreEnhancer } from '@reduxjs/toolkit';

type CreateStoreInitializerArgs<T extends object> = {
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
