import dayjs, { Dayjs } from 'dayjs';

export function formatDob(date: Dayjs | null): string {
  return date ? date.format('YYYY-MM-DD') : '';
}

export function isValidDob(date: Dayjs | null): boolean {
  return date !== null && date.isValid();
}

export { dayjs };
