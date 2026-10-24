import { describe, expect, test } from 'bun:test';
import { buildTestState, testContent } from '../../test/fixtures';
import {
  formatClock,
  formatDateLabel,
  formatDayCount,
  formatMoney,
  hudView,
  isNightShift,
  statsPanelView,
} from './view_models';

describe('formatMoney', () => {
  // Review Focus 2：存款可以是負數（02 §1.1 沒有下限）
  test.each([
    [48200, 'NT$ 48,200'],
    [0, 'NT$ 0'],
    [-1200, 'NT$ −1,200'],
    [1234567.6, 'NT$ 1,234,568'],
    [-0.4, 'NT$ 0'],
  ])('%p reads %p', (amount, text) => {
    expect(formatMoney(amount)).toBe(text);
  });
});

describe('formatDateLabel', () => {
  test.each([
    [0, '2027/03/01（一）'],
    [104, '2027/06/13（日）'],
    [365, '2028/02/29（二）'],
  ])('day %p reads %p', (day, text) => {
    expect(formatDateLabel(day)).toBe(text);
  });
});

describe('formatClock', () => {
  test.each([
    [0, '00:00'],
    [390, '06:30'],
    [1367, '22:45'],
    [1439, '23:55'],
  ])('minute %p shows %p', (minute, text) => {
    expect(formatClock(minute)).toBe(text);
  });
});

describe('isNightShift', () => {
  test.each([
    [1319, false],
    [1320, true],
    [359, true],
    [360, false],
  ])('minute %p is night shift: %p', (minute, night) => {
    expect(isNightShift(minute)).toBe(night);
  });
});

describe('formatDayCount', () => {
  test.each([
    [0, '入職第 1 天'],
    [104, '入職第 105 天'],
  ])('day %p reads %p', (day, text) => {
    expect(formatDayCount(day)).toBe(text);
  });
});

describe('hudView', () => {
  test('the opening morning shows date, clock, day count and rank without night or wind marks', () => {
    expect(hudView(buildTestState(), testContent)).toEqual({
      dateLabel: '2027/03/01（一）',
      nightLabel: null,
      clock: '06:30',
      dayCount: '入職第 1 天',
      rankLine: '測試職等 · 測試課',
      company: '測試公司',
      windFlag: null,
    });
  });

  test('the wind period and night shift add their labels', () => {
    const base = buildTestState();
    const state = {
      ...base,
      career: { ...base.career, probation: 'passed' as const },
      time: { ...base.time, dayIndex: 300, minuteOfDay: 1367 },
    };
    expect(hudView(state, testContent)).toMatchObject({ nightLabel: '夜班', windFlag: '風向期', clock: '22:45' });
  });
});

describe('statsPanelView', () => {
  test('rows compare stored values with the low line and show the lost stamina cap', () => {
    const view = statsPanelView(buildTestState({ stats: { stamina: 35, mind: 35.4, healthDebt: 20 } }), testContent);
    expect(view.rows).toEqual([
      { stat: 'stamina', label: '體力', value: 35, max: 90, low: true, lostCapPct: 10 },
      { stat: 'mind', label: '精神', value: 35, max: 100, low: false, lostCapPct: 0 }, // 35.4 > 35：顯示 35 但不是「危」（02 §0.2）
      { stat: 'skill', label: '專業', value: 30, max: 100, low: false, lostCapPct: 0 },
      { stat: 'bossFavor', label: '主管好感', value: 50, max: 100, low: false, lostCapPct: 0 },
    ]);
  });

  test('favor coins and money come from the stat rules and formatter', () => {
    expect(statsPanelView(buildTestState(), testContent)).toMatchObject({
      title: '新人狀態表',
      ariaLabel: '角色數值',
      favor: { label: '同事人情', count: 3, slots: 5 },
      money: { label: '存款', text: 'NT$ 60,000' },
    });
  });
});
