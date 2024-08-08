import {
  configureStore,
  Reducer,
  Middleware,
  EnhancedStore,
  StoreEnhancer,
  StateFromReducersMapObject
} from '@reduxjs/toolkit';
import { OmitIndexSignature } from 'type-fest';

/**
 * Represents AppState type.
 *
 * @template TRootReducer - The root reducer object.
 */
export type AppStateFromRootReducer<TRootReducer> = StateFromReducersMapObject<OmitIndexSignature<TRootReducer>>;

type CreateStoreInitializerArgs<T extends object> = {
  rootReducer: Reducer<T>;
  middlewares?: Array<Middleware>;
  enhancers?: Array<StoreEnhancer>;
};

/**
 * Utility that creates a function, initializing a store for an application.
 *
 * @template State - The type of the application state.
 * @param {CreateStoreInitializerArgs<State>} args - The arguments for creating the store.
 * @param {Reducer<State>} args.rootReducer - The root reducer function.
 * @param {Array<Middleware>} [args.middlewares=[]] - The middlewares for the store.
 * @param {Array<StoreEnhancer>} [args.enhancers=[]] - The enhancers for the store.
 * @returns {(context?: unknown) => EnhancedStore<State>} - The function to initialize the store.
 */
export function createStoreInitializer<State extends object>({
  rootReducer,
  middlewares = [],
  enhancers = []
}: CreateStoreInitializerArgs<State>) {
  /**
   * Initializes the Redux store.
   *
   * @param {unknown} [context] - The context for the store.
   * @returns {EnhancedStore<State>} - The initialized store.
   */
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
