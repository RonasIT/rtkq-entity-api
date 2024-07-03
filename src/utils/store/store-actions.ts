import { createAction } from '@reduxjs/toolkit';

export class StoreActions {
  public static init = createAction('appState/init');
}
