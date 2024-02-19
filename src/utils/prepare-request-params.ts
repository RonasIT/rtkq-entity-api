import { ClassConstructor, instanceToPlain } from 'class-transformer';

export function prepareRequestParams<TRequest>(
  params: Partial<TRequest> = {},
  requestConstructor: ClassConstructor<TRequest>,
): Record<string, any> {
  const request = new requestConstructor(params || {}) as TRequest;

  return instanceToPlain(request, { excludeExtraneousValues: true, exposeUnsetFields: false });
}
