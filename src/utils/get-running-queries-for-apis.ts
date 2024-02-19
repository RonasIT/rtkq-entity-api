import { UnknownAction, Store } from '@reduxjs/toolkit';
import { castArray } from 'lodash';
import { AnyApi } from '../types';

export const getRunningQueriesForAPIs = <TApi extends Pick<AnyApi, 'util'>>(
  store: Store<any>,
  apis: TApi | Array<TApi>,
): Promise<Array<UnknownAction>> => {
  const thunks = castArray(apis).flatMap(
    (api) => store.dispatch<any>(api.util.getRunningQueriesThunk()) as Array<UnknownAction>,
  );

  return Promise.all(thunks);
};
