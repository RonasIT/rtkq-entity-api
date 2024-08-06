import { createAction } from '@reduxjs/toolkit';

//TODO где оставлять JSDoc в данном случае?
/**
 * Redux actions related to the store.
 *
 * @see https://redux-toolkit.js.org/api/createAction
 * @property init - A Redux action created for performing actions at the start of the application's lifecycle. It should be dispatched on mount of root application component.
 */
export const storeActions = {
  /**
   * A Redux action created for performing actions at the start of the application's lifecycle. It should be dispatched on mount of root application component.
   *
   * @see https://redux-toolkit.js.org/api/createAction#usage
   * @type {import('@reduxjs/toolkit').PayloadActionCreator<void, string, never, string>}
   */
  init: createAction('appState/init')
};
