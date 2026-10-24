import { describe, expect, test } from 'bun:test';
import { clockToMinutes, dayIndexToIso, formatMonthDay, isoToDayIndex, minutesToClock, weekdayOf } from './date';
import { InvariantError } from './errors';

// 預期值以 Date.UTC 另外算出：(Date.UTC(y, m − 1, d) − Date.UTC(2027, 2, 1)) ÷ 86 400 000
const CALENDAR: readonly (readonly [string, number, ReturnType<typeof weekdayOf>])[] = [
  ['2027-03-01', 0, 0],
  ['2027-06-13', 104, 6], // 01 §15：值班夜是星期日
  ['2027-09-09', 192, 3], // 02 T73
  ['2028-01-12', 317, 2], // 02 §7.4 年度考績
  ['2028-02-29', 365, 1], // 01 §15：MVP 期滿日
  ['2030-02-28', 1095, 3], // 完整版期滿日
];
const LAST_FULL_GAME_DAY = 1095;
// Review Focus 4：手打錯的日期必須立刻失敗，不能被 Date.UTC 滾到隔壁日期
const INVALID_ISO = ['2027-02-30', '2027-6-13', '2027-13-01', '2027-06-13T00:00', ''];
const CLOCKS: readonly (readonly [string, number])[] = [
  ['00:00', 0],
  ['06:30', 390],
  ['22:47', 1367],
  ['23:59', 1439],
];
const INVALID_CLOCKS = ['24:00', '7:00', '12:60', ''];

describe('isoToDayIndex', () => {
  test.each(CALENDAR)('%p is day index %p', (iso, dayIndex) => {
    expect(isoToDayIndex(iso)).toBe(dayIndex);
  });
  test.each(INVALID_ISO)('rejects %p instead of rolling it over to a neighbouring date', (iso) => {
    expect(() => isoToDayIndex(iso)).toThrow(InvariantError);
  });
});

describe('dayIndexToIso', () => {
  test('round-trips every day of the full three-year game', () => {
    const mismatches = Array.from({ length: LAST_FULL_GAME_DAY + 1 }, (_, day) => day).filter(
      (day) => isoToDayIndex(dayIndexToIso(day)) !== day,
    );
    expect(mismatches).toEqual([]);
  });
  test.each([-1, 1.5, Number.NaN])('rejects the non-integer or negative day index %p', (day) => {
    expect(() => dayIndexToIso(day)).toThrow(InvariantError);
  });
});

describe('weekdayOf', () => {
  test.each(CALENDAR)('%p (day %p) falls on weekday %p where 0 is Monday', (_iso, dayIndex, weekday) => {
    expect(weekdayOf(dayIndex)).toBe(weekday);
  });
});

describe('clockToMinutes and minutesToClock', () => {
  test.each(CLOCKS)('%p is minute %p and back', (clock, minutes) => {
    expect([clockToMinutes(clock), minutesToClock(minutes)]).toEqual([minutes, clock]);
  });
  test.each(INVALID_CLOCKS)('rejects the clock string %p', (clock) => {
    expect(() => clockToMinutes(clock)).toThrow(InvariantError);
  });
  test.each([-1, 1440, 12.5])('rejects the minute of day %p', (minute) => {
    expect(() => minutesToClock(minute)).toThrow(InvariantError);
  });
});

describe('formatMonthDay', () => {
  test.each([
    [0, '3/1'],
    [104, '6/13'],
    [365, '2/29'],
  ])('day %p reads %p', (day, text) => {
    expect(formatMonthDay(day)).toBe(text);
  });
});
