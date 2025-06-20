import { SerializedError } from '@reduxjs/toolkit';
import { BaseQueryApi, BaseQueryFn } from '@reduxjs/toolkit/dist/query/index.d';
import { MaybePromise } from '@reduxjs/toolkit/src/query/tsHelpers';
import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, RawAxiosRequestHeaders } from 'axios';
import { merge } from 'lodash';
// TODO: Drop support for axios-observable in next major version
import type { Axios as AxiosObservableInstance } from 'axios-observable';
import type { lastValueFrom as lastValueFromType } from 'rxjs';

export type BaseQueryFunction = BaseQueryFn<
  AxiosRequestConfig,
  unknown,
  SerializedError & Partial<AxiosError>,
  object,
  AxiosResponse
>;

export type AxiosBaseQueryArgs = {
  getHttpClient: (api: BaseQueryApi & { extra?: any }) => AxiosObservableInstance | AxiosInstance;
  prepareHeaders?: (api: BaseQueryApi & { extra?: any }) => MaybePromise<RawAxiosRequestHeaders>;
};

export const createAxiosBaseQuery = ({ getHttpClient, prepareHeaders }: AxiosBaseQueryArgs): BaseQueryFunction => {
  const isDevEnvironment = (typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.NODE_ENV === 'development';
  let isDeprecationWarningShown = false;

  return async (requestConfig, api: BaseQueryApi) => {
    const extraHeaders: RawAxiosRequestHeaders = prepareHeaders
      ? await prepareHeaders(api as BaseQueryApi & { extra?: any })
      : {};

    requestConfig.headers = merge(requestConfig.headers || {}, extraHeaders);
    const httpClient = getHttpClient(api as BaseQueryApi & { extra?: any });

    try {
      const AxiosObservable = require('axios-observable').Axios as typeof AxiosObservableInstance;
      const usesAxiosObservable = httpClient instanceof AxiosObservable;
      const lastValueFrom = require('rxjs').lastValueFrom as typeof lastValueFromType;

      if (!isDeprecationWarningShown && usesAxiosObservable && isDevEnvironment) {
        isDeprecationWarningShown = true;
        console.warn(
          'Support of Axios Observable is deprecated and will be removed in the next major version. Please use Axios instead.',
        );
      }

      const response = usesAxiosObservable
        ? await lastValueFrom(httpClient.request(requestConfig))
        : await httpClient.request(requestConfig);

      return {
        data: response.data,
        meta: response,
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
          data: axiosError.response?.data,
        },
        meta: axiosError.response,
      };
    }
  };
};
