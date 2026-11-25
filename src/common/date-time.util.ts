export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && endA > startB;
}
