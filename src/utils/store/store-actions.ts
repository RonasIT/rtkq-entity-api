import { createAction } from '@reduxjs/toolkit';

/**
 * Common redux actions, related to an application lifecycle.
 */
export const storeActions = {
  /**
   * A Redux action created for performing actions at the start of the application's lifecycle. It should be dispatched on mount of root application component.
   *
   * @see https://redux-toolkit.js.org/api/createAction#usage
   * @type {import('@reduxjs/toolkit').PayloadActionCreator<void, string, never, string>}
   */
  init: createAction('appState/init'),
};
