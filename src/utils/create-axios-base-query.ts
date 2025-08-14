import { SerializedError } from '@reduxjs/toolkit';
import { BaseQueryApi, BaseQueryFn } from '@reduxjs/toolkit/dist/query/index.d';
import { MaybePromise } from '@reduxjs/toolkit/src/query/tsHelpers';
import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, RawAxiosRequestHeaders } from 'axios';
import { merge } from 'lodash';

export type BaseQueryFunction = BaseQueryFn<
  AxiosRequestConfig,
  unknown,
  SerializedError & Partial<AxiosError>,
  object,
  AxiosResponse
>;

export type AxiosBaseQueryArgs = {
  getHttpClient: (api: BaseQueryApi & { extra?: any }) => AxiosInstance;
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
      const response = await httpClient.request(requestConfig);

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
