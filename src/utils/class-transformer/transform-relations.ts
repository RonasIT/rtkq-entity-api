import { Transform } from 'class-transformer';
import { uniq } from 'lodash';

function normalizeRelations(value: Array<string>, delimiter = '.'): Array<string> {
  return uniq(
    value.filter(
      (relation) => !value.find((r) => r.includes(delimiter) && r.includes(relation) && r.length > relation.length),
    ),
  ).sort();
}

export function TransformRelations(
  { delimiter }: { delimiter: string } = { delimiter: '.' },
): (target: any, key: string) => void {
  const toPlain = Transform(({ value }) => (Array.isArray(value) ? normalizeRelations(value, delimiter) : value), {
    toPlainOnly: true
  });

  const toClass = Transform(({ value }) => (Array.isArray(value) ? normalizeRelations(value, delimiter) : value), {
    toClassOnly: true
  });

  return (target: any, key: string) => {
    toPlain(target, key);
    toClass(target, key);
  };
}
