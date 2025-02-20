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
): () => void {
  return setupListeners(storeDispatch, (dispatch, actions) => {
    let ReactNative: { AppState: RNAppState; Platform: RNPlatform };

    let NetInfo: {
      addEventListener: typeof addEventListener;
      fetch: typeof fetch;
    };

    try {
      NetInfo = require('@react-native-community/netinfo');
      ReactNative = require('react-native');
    } catch (error) {
      throw new Error(
        'To use \'refetchOnReconnect\' and \'refetchOnFocus\' you must setup @react-native-community/netinfo and react-native package.',
      );
    }

    const { AppState, Platform } = ReactNative;

    if (!Platform?.OS || Platform.OS === 'web') {
      throw new Error(
        'The \'setupRefetchListeners\' utility is intended for use with React Native. For non React Native apps please use \'setupListeners\' from  @reduxjs/toolkit/query.',
      );
    }

    const unsubscribeHandlers: Array<() => void> = [];

    if (options.refetchOnFocus) {
      const { remove: appStateUnsubscribe } = AppState.addEventListener('change', async (state) => {
        const { isConnected, isInternetReachable } = await NetInfo.fetch();
        const hasConnection = isConnected && isInternetReachable;

        if (hasConnection) {
          dispatch(state === 'active' ? actions.onFocus() : actions.onFocusLost());
        }
      });

      unsubscribeHandlers.push(appStateUnsubscribe);
    }

    if (options.refetchOnReconnect) {
      const netInfoUnsubscribe = NetInfo.addEventListener(({ isConnected, isInternetReachable }: NetInfoState) => {
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
