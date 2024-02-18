import { Expose, Type } from 'class-transformer';
import { BaseEntity } from './base-entity';
import { Pagination } from './pagination';

export class PaginationResponse<TEntity extends BaseEntity = BaseEntity> {
  @Expose({ toClassOnly: true })
  public data: Array<TEntity>;

  @Expose({ name: 'meta' })
  @Type(() => Pagination)
  public pagination: Pagination;
}
