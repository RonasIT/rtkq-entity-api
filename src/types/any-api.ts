import { Api, BaseQueryFn } from '@reduxjs/toolkit/dist/query/index.d';

export type AnyApi = Api<BaseQueryFn, any, string, string>;
