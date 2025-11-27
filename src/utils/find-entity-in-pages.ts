import { Draft } from 'immer';
import { BaseEntity, PaginationResponse } from '../models';

export const findEntityInPages = <
  TEntity extends BaseEntity,
  TSearchResponse extends PaginationResponse<TEntity> = PaginationResponse<TEntity>,
>(
  pages: Array<TSearchResponse> | Draft<Array<TSearchResponse>>,
  entityId: unknown,
): { pageIndex: number; itemIndex: number } => {
  let itemIndex = -1;

  const pageIndex = pages.findIndex((page) => {
    const foundItemIndex = page.data.findIndex((item: { id: unknown }) => item.id === entityId);

    if (itemIndex !== -1) {
      itemIndex = foundItemIndex;

      return true;
    }

    return false;
  });

  return { itemIndex, pageIndex };
};
