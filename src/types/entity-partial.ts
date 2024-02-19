import { BaseEntity } from '../models';

export type EntityPartial<TEntity extends BaseEntity = BaseEntity> = { id: TEntity['id'] } & Partial<TEntity>;
