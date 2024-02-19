import { Expose } from 'class-transformer';
import { LiteralUnion } from 'type-fest';
import { BaseOrderBy } from '../types';
import { TransformBoolean, TransformRelations } from '../utils';

export class PaginationRequest<
  TRelation extends string = string,
  TOrderBy extends string = LiteralUnion<BaseOrderBy, string>,
  TWithCount extends string = string,
> {
  @Expose()
  public query?: string;

  @Expose()
  public page?: number;

  @Expose({ name: 'per_page' })
  public perPage?: number;

  @TransformBoolean()
  @Expose()
  public all?: boolean;

  @TransformRelations()
  @Expose({ name: 'with' })
  public relations?: Array<TRelation>;

  @TransformRelations()
  @Expose({ name: 'with_count' })
  public withCount?: Array<TWithCount>;

  @Expose({ name: 'order_by' })
  public orderBy?: TOrderBy | Array<TOrderBy>;

  @TransformBoolean()
  @Expose()
  public desc?: boolean;

  constructor(request: Partial<PaginationRequest<TRelation, TOrderBy, TWithCount>>) {
    Object.assign(this, request);
  }
}
