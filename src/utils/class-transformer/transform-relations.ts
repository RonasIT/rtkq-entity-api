import { Transform } from 'class-transformer';
import { uniq } from 'lodash';

function normalizeRelations(relations: Array<string>, delimiter = '.'): Array<string> {
  return uniq(
    relations.filter(
      (relation) => !relations.find((otherRelation) => {
          const relationSegments = relation.split(delimiter);
          const otherRelationSegments = otherRelation.split(delimiter);

          return (
            otherRelationSegments.length > relationSegments.length &&
            relationSegments.every((segment, index) => otherRelationSegments[index] === segment)
          );
        }),
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
