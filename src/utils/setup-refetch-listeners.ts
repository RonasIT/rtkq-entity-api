import { Dispatch } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppState, Platform } from 'react-native';
import type { addEventListener, fetch, NetInfoState } from '@react-native-community/netinfo';

export function setupRefetchListeners(
  storeDispatch: Dispatch,
  options: { refetchOnReconnect?: boolean; refetchOnFocus?: boolean } = {
    refetchOnReconnect: true,
    refetchOnFocus: true,
  },
): () => void {
  return setupListeners(storeDispatch, (dispatch, actions) => {
    if (!Platform?.OS || Platform.OS === 'web') {
      throw new Error(
        'The \'setupRefetchListeners\' utility is intended for use with React Native. For web please use \'setupListeners\' from  @reduxjs/toolkit/query.',
      );
    }

    let NetInfo: {
      addEventListener: typeof addEventListener;
      fetch: typeof fetch;
    };

    try {
      NetInfo = require('@react-native-community/netinfo');
    } catch (error) {
      throw new Error(
        'To use \'refetchOnReconnect\' and \'refetchOnFocus\' you must setup @react-native-community/netinfo package.',
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
