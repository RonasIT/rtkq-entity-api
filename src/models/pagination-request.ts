import { Expose } from 'class-transformer';
import { TransformBoolean, TransformRelations } from '../utils/class-transformer';

export class PaginationRequest<
  TRelation extends string = string,
  TOrderBy extends string = string,
  TWithCount extends string = string,
  TWithAvg extends string = string,
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

  @TransformRelations()
  @Expose({ name: 'with_avg' })
  public withAvg?: Array<TWithAvg>;

  @Expose({ name: 'order_by' })
  public orderBy?: TOrderBy | Array<TOrderBy>;

  @TransformBoolean()
  @Expose()
  public desc?: boolean;

  constructor(request: Partial<PaginationRequest<TRelation, TOrderBy, TWithCount, TWithAvg>>) {
    Object.assign(this, request);
  }
}
