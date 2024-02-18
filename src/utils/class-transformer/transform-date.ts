import { Transform } from 'class-transformer';
import { DateTime } from 'luxon';

export function TransformDate(
  options: { dateOnly?: boolean; format?: string } = {},
): (target: any, key: string) => void {
  const { dateOnly, format } = options;

  const toPlain = Transform(
    ({ value }) => {
      if (DateTime.isDateTime(value)) {
        const utcValue = value.toUTC();

        return format ? utcValue.toFormat(format) : dateOnly ? value.toISODate() : utcValue.toISO();
      }

      return value;
    },
    { toPlainOnly: true },
  );

  const toClass = Transform(
    ({ value }) => (value ? (format ? DateTime.fromFormat(value, format) : DateTime.fromISO(value)) : value),
    { toClassOnly: true },
  );

  return (target: any, key: string): void => {
    toPlain(target, key);
    toClass(target, key);
  };
}
