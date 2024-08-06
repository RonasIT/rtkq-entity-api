import { Expose, Type } from 'class-transformer';
import { immerable } from 'immer';
import { DateTime } from 'luxon';
import { TransformDate } from '../utils/class-transformer';

/**
 * Base class for used with API entities.
 *
 * @template TID - The type of the entity ID.
 */
export abstract class BaseEntity<TID = string | number> {
  public [immerable] = true;

  @Expose()
  public id: TID;

  @Expose({ name: 'created_at' })
  @Type(() => DateTime)
  @TransformDate()
  public createdAt: DateTime;

  @Expose({ name: 'updated_at' })
  @Type(() => DateTime)
  @TransformDate()
  public updatedAt?: DateTime;

  @Expose({ name: 'deleted_at' })
  @Type(() => DateTime)
  @TransformDate()
  public deletedAt?: DateTime;

  constructor(model: Partial<BaseEntity> = {}) {
    Object.assign(this, model);
  }
}
