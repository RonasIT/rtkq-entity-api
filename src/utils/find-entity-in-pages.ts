// export const findEntityInPages = (
//   pages: Array<any>,
//   entityId: unknown,
// ): { pageIndex: number; itemIndex: number } | null => {
//   let existingItemIndex = -1;

//   const existingPageIndex = pages.findIndex((page) => {
//     const itemIndex = page.data.findIndex((item: { id: unkown }) => item.id === entityId);

//     if (itemIndex !== -1) {
//       existingItemIndex = itemIndex;

//       return true;
//     }

//     return false;
//   });
// };
