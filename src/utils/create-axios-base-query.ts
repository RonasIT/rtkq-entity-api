import { SerializedError } from '@reduxjs/toolkit';
import { BaseQueryApi, BaseQueryFn } from '@reduxjs/toolkit/dist/query';
import { MaybePromise } from '@reduxjs/toolkit/dist/query/tsHelpers';
import { AxiosError, AxiosInstance, AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
import AxiosObservable from 'axios-observable';
import { merge } from 'lodash';
import { lastValueFrom } from 'rxjs';

export type BaseQueryFunction = BaseQueryFn<AxiosRequestConfig, unknown, SerializedError & Partial<AxiosError>>;

export type AxiosBaseQueryArgs = {
  getHttpClient: (api: BaseQueryApi & { extra?: any }) => AxiosObservable | AxiosInstance;
  prepareHeaders?: (api: BaseQueryApi & { extra?: any }) => MaybePromise<RawAxiosRequestHeaders>;
};

export const createAxiosBaseQuery = ({ getHttpClient, prepareHeaders }: AxiosBaseQueryArgs): BaseQueryFunction => {
  return async (requestConfig, api: BaseQueryApi) => {
    const extraHeaders: RawAxiosRequestHeaders = prepareHeaders
      ? await prepareHeaders(api as BaseQueryApi & { extra?: any })
      : {};

    requestConfig.headers = merge(requestConfig.headers || {}, extraHeaders);
    const httpClient = getHttpClient(api as BaseQueryApi & { extra?: any });

    try {
      const response =
        httpClient instanceof AxiosObservable
          ? await lastValueFrom(httpClient.request(requestConfig))
          : await httpClient.request(requestConfig);

      return {
        data: response.data,
        meta: response
      };
    } catch (axiosError) {
      const error = axiosError as AxiosError<{ error?: string; message?: string }>;

      return {
        error: {
          code: String(error.response?.status),
          message: error.response?.data?.message || error.response?.data?.error,
          data: error.response?.data
        },
        meta: error.response
      };
    }
  };
};
