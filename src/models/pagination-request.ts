import { Expose } from 'class-transformer';
import { LiteralUnion } from 'type-fest';
import { BaseOrderBy } from '../types';
import { TransformBoolean } from '../utils';
import { EntityRequest } from './entity-request';

export class PaginationRequest<
  TRelation extends string = string,
  TOrderBy extends string = LiteralUnion<BaseOrderBy, string>,
  TWithCount extends string = string,
  TWithAvg extends string = string
> extends EntityRequest<TRelation, TWithCount, TWithAvg> {
  @Expose()
  public query?: string;

  @Expose()
  public page?: number;

  @Expose({ name: 'per_page' })
  public perPage?: number;

  @TransformBoolean()
  @Expose()
  public all?: boolean;

  @Expose({ name: 'order_by' })
  public orderBy?: TOrderBy | Array<TOrderBy>;

  @TransformBoolean()
  @Expose()
  public desc?: boolean;

  constructor(request: Partial<PaginationRequest<TRelation, TOrderBy, TWithCount, TWithAvg>>) {
    super(request);
    Object.assign(this, request);
  }
}
