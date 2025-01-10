import { Expose } from 'class-transformer';
import { TransformRelations } from '../utils/class-transformer';

export class EntityRequest<
  TRelation extends string = string,
  TWithCount extends string = string,
  TWithAvg extends string = string,
> {
  @TransformRelations()
  @Expose({ name: 'with' })
  public relations?: Array<TRelation>;

  @TransformRelations()
  @Expose({ name: 'with_count' })
  public withCount?: Array<TWithCount>;

  @TransformRelations()
  @Expose({ name: 'with_avg' })
  public withAvg?: Array<TWithAvg>;

  constructor(params?: Partial<EntityRequest<TRelation, TWithCount, TWithAvg>>) {
    Object.assign(this, params);
  }
}
