import { SerializedError } from '@reduxjs/toolkit';
import { BaseQueryApi, BaseQueryFn } from '@reduxjs/toolkit/dist/query/index.d';
import { MaybePromise } from '@reduxjs/toolkit/dist/query/tsHelpers.d';
import { AxiosError, AxiosInstance, AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
import { Axios as AxiosObservable } from 'axios-observable';
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
    } catch (error) {
      if (!(error as AxiosError)?.isAxiosError) {
        throw error;
      }

      const axiosError = error as AxiosError<{ error?: string; message?: string }>;

      return {
        error: {
          code: String(axiosError.response?.status),
          message: axiosError.response?.data?.message || axiosError.response?.data?.error,
          data: axiosError.response?.data
        },
        meta: axiosError.response
      };
    }
  };
};
