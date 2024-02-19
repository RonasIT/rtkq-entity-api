import { produce } from 'immer';
import { merge } from 'lodash';

export const immutableMerge = <TInitial, TPatch = TInitial>(initial: TInitial, patch: TPatch): TInitial => {
  return produce(initial, (draft) => merge(draft, patch));
};
