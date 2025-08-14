import { Dispatch } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import type { addEventListener, fetch, NetInfoState } from '@react-native-community/netinfo';
import type { AppState as RNAppState, Platform as RNPlatform } from 'react-native';

export function setupRefetchListeners(
  storeDispatch: Dispatch,
  options: { refetchOnReconnect?: boolean; refetchOnFocus?: boolean } = {
    refetchOnReconnect: true,
    refetchOnFocus: true,
  },
  netInfoRef: {
    fetch: typeof fetch;
    addEventListener: typeof addEventListener;
  },
  reactNativeRef: {
    AppState: RNAppState;
    Platform: RNPlatform;
  },
): () => void {
  return setupListeners(storeDispatch, (dispatch, actions) => {
    const { AppState, Platform } = reactNativeRef;

    if (!Platform?.OS || Platform.OS === 'web') {
      throw new Error(
        'The \'setupRefetchListeners\' utility is intended for use with React Native. For non React Native apps please use \'setupListeners\' from  @reduxjs/toolkit/query.',
      );
    }

    const unsubscribeHandlers: Array<() => void> = [];

    if (options.refetchOnFocus) {
      const { remove: appStateUnsubscribe } = AppState.addEventListener('change', async (state) => {
        const { isConnected, isInternetReachable } = await netInfoRef.fetch();
        const hasConnection = isConnected && isInternetReachable;

        if (hasConnection) {
          dispatch(state === 'active' ? actions.onFocus() : actions.onFocusLost());
        }
      });

      unsubscribeHandlers.push(appStateUnsubscribe);
    }

    if (options.refetchOnReconnect) {
      const netInfoUnsubscribe = netInfoRef.addEventListener(({ isConnected, isInternetReachable }: NetInfoState) => {
        const hasConnection = !!(isConnected && isInternetReachable);

        dispatch(hasConnection ? actions.onOnline() : actions.onOffline());
      });

      unsubscribeHandlers.push(netInfoUnsubscribe);
    }

    return (): void => {
      unsubscribeHandlers.forEach((handleUnsubscribe) => handleUnsubscribe?.());
    };
  });
}
