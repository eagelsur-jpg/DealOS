import { formatISO, isAfter, isBefore, parseISO } from 'date-fns';

export const toIsoDate = (date: Date): string => formatISO(date);

export const parseIsoDate = (value: string): Date => parseISO(value);

export const isDateInRange = (date: Date, start: Date | null, end: Date | null): boolean => {
  if (start && isBefore(date, start)) {
    return false;
  }

  if (end && isAfter(date, end)) {
    return false;
  }

  return true;
};
