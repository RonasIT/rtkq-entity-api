import { RawAxiosRequestHeaders } from 'axios';
import { isBrowserPlatform } from './is-browser-platform';

export type RequestContext = { req: { headers: RawAxiosRequestHeaders } };

export const prepareServerSideRequestHeaders = ({
  extra: context
}: {
  extra: RequestContext;
}): RawAxiosRequestHeaders => {
  if (!isBrowserPlatform() && context && 'req' in context && context.req?.headers?.cookie) {
    return {
      Cookie: context.req.headers.cookie
    };
  }

  return {};
};
