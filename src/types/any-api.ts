import { Api, BaseQueryFn } from '@reduxjs/toolkit/query';

export type AnyApi = Api<BaseQueryFn, any, string, string>;
