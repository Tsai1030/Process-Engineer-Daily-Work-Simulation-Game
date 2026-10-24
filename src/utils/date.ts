import type { ClockTime, IsoDate } from '../model';
import { InvariantError } from './errors';

const MS_PER_DAY = 86_400_000;
const MINUTES_PER_DAY = 1440;
const DAY_ZERO_UTC = Date.UTC(2027, 2, 1);
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function assertDayIndex(dayIndex: number): void {
  if (!Number.isInteger(dayIndex) || dayIndex < 0) {
    throw new InvariantError(`Invalid day index: value=${dayIndex}`);
  }
}

function utcDateOf(dayIndex: number): Date {
  assertDayIndex(dayIndex);
  return new Date(DAY_ZERO_UTC + dayIndex * MS_PER_DAY);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function dayIndexToIso(dayIndex: number): IsoDate {
  const date = utcDateOf(dayIndex);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function isoToDayIndex(iso: IsoDate): number {
  if (!ISO_PATTERN.test(iso)) {
    throw new InvariantError(`Invalid ISO date: value=${iso}`);
  }
  const [year, month, day] = iso.split('-').map(Number);
  const dayIndex = Math.round(
    (Date.UTC(year as number, (month as number) - 1, day as number) - DAY_ZERO_UTC) / MS_PER_DAY,
  );
  if (dayIndex < 0 || dayIndexToIso(dayIndex) !== iso) {
    throw new InvariantError(`Invalid ISO date: value=${iso}`);
  }
  return dayIndex;
}

export function weekdayOf(dayIndex: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  assertDayIndex(dayIndex);
  return (dayIndex % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function clockToMinutes(clock: ClockTime): number {
  const match = CLOCK_PATTERN.exec(clock);
  if (match === null) {
    throw new InvariantError(`Invalid clock time: value=${clock}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToClock(minuteOfDay: number): ClockTime {
  if (!Number.isInteger(minuteOfDay) || minuteOfDay < 0 || minuteOfDay >= MINUTES_PER_DAY) {
    throw new InvariantError(`Invalid minute of day: value=${minuteOfDay}`);
  }
  return `${pad2(Math.floor(minuteOfDay / 60))}:${pad2(minuteOfDay % 60)}`;
}

export function formatMonthDay(dayIndex: number): string {
  const date = utcDateOf(dayIndex);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}
