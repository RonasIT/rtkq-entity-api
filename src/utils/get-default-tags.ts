import { TagDescription } from '@reduxjs/toolkit/query';
import { EntityTagID } from '../enums';
import { BaseEntity, PaginationResponse } from '../models';

/**
 * Returns default tags for entity api for response.
 *
 * @param {PaginationResponse<TEntity> | TEntity} id - Response for search multiple or get single entity.
 * @param {Function} getEntityId - A custom function to get entity id. By default entity 'id' field is used.
 * @returns {ReadonlyArray<TagDescription<string>>} Result tags. The EntityTagID.LIST is used for entity list.
 */
export function getEntityTags<TEntity extends BaseEntity>(
  entityName: string,
  response?: PaginationResponse<TEntity> | TEntity,
  customGetEntityId?: (entity: TEntity) => string | number,
): ReadonlyArray<TagDescription<string>> {
  const getEntityId = customGetEntityId || ((item) => item.id);

  if (!response) return [entityName];

  if ('data' in response) {
    return [
      { type: entityName, id: EntityTagID.LIST },
      ...response.data.map((item) => ({ type: entityName, id: getEntityId(item) })),
    ];
  } else {
    return [{ type: entityName, id: response.id }];
  }
}
