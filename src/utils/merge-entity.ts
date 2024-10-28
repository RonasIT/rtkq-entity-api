import { mergeWith } from 'lodash';
import { BaseEntity } from '../models';
import { EntityPartial } from '../types';

function overrideArrayField<TValue>(objValue: TValue, srcValue: TValue): TValue | undefined {
  if (Array.isArray(objValue)) {
    return srcValue as TValue;
  }
}

/**
 * Merge the given `entity` with the given `patch` object.
 *
 * If the object in the `entity` has a field with the same name as a field in
 * the `patch`, the value of that field in the `entity` will be overridden
 * with the value from the `patch`. If the field in the `entity` has a type
 * of array, the value of that field in the `entity` will be replaced with
 * the value from the `patch`.
 *
 * @param {BaseEntity} entity The entity to be merged.
 * @param {EntityPartial<BaseEntity>} patch The patch object.
 * @returns {BaseEntity} The merged entity.
 */
export const mergeEntity = <TEntity extends BaseEntity>(entity: TEntity, patch: EntityPartial<TEntity>): TEntity => {
  return mergeWith(entity, patch, overrideArrayField);
};
