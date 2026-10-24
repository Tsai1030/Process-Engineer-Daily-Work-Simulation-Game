import { isWindPeriod, maxStamina } from '../core/selectors';
import { resolveText } from '../core/text';
import type { ContentBundle, DeepReadonly, GameState, TextId } from '../model';
import { dayIndexToIso, minutesToClock, weekdayOf } from '../utils/date';

const WEEKDAY_CHARS = '一二三四五六日';
const MINUS_SIGN = '−';
const CLOCK_STEP_MINUTES = 5;
const NIGHT_START_MINUTE = 22 * 60;
const NIGHT_END_MINUTE = 6 * 60;

export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'NT$ 0';
  const digits = Math.abs(rounded).toLocaleString('en-US');
  return `NT$ ${rounded < 0 ? MINUS_SIGN : ''}${digits}`;
}

export function formatDateLabel(dayIndex: number): string {
  return `${dayIndexToIso(dayIndex).replaceAll('-', '/')}（${WEEKDAY_CHARS[weekdayOf(dayIndex)]}）`;
}

export function formatClock(minuteOfDay: number): string {
  return minutesToClock(minuteOfDay - (minuteOfDay % CLOCK_STEP_MINUTES));
}

export function isNightShift(minuteOfDay: number): boolean {
  return minuteOfDay >= NIGHT_START_MINUTE || minuteOfDay < NIGHT_END_MINUTE;
}

export function formatDayCount(dayIndex: number): string {
  return `入職第 ${dayIndex + 1} 天`;
}

export interface HudView {
  dateLabel: string;
  nightLabel: string | null;
  clock: string;
  dayCount: string;
  rankLine: string;
  company: string;
  windFlag: string | null;
}

export interface StatRowView {
  stat: 'stamina' | 'mind' | 'skill' | 'bossFavor';
  label: string;
  value: number;
  max: number;
  low: boolean;
  lostCapPct: number;
}

export interface StatsPanelView {
  title: string;
  ariaLabel: string;
  rows: readonly StatRowView[];
  favor: { label: string; count: number; slots: number };
  money: { label: string; text: string };
}

const ROW_STATS = [
  ['stamina', 't.ui.stat.stamina'],
  ['mind', 't.ui.stat.mind'],
  ['skill', 't.ui.stat.skill'],
  ['bossFavor', 't.ui.stat.boss_favor'],
] as const;

export function hudView(state: DeepReadonly<GameState>, content: ContentBundle): HudView {
  const ctx = { state, content };
  const { dayIndex, minuteOfDay } = state.time;
  const rankTitle = resolveText(content.ranks[state.career.rank].title, ctx);
  return {
    dateLabel: formatDateLabel(dayIndex),
    nightLabel: isNightShift(minuteOfDay) ? resolveText('t.ui.hud.night_shift', ctx) : null,
    clock: formatClock(minuteOfDay),
    dayCount: formatDayCount(dayIndex),
    rankLine: `${rankTitle} · ${resolveText('t.ui.hud.department', ctx)}`,
    company: resolveText('t.ui.hud.company', ctx),
    windFlag: isWindPeriod(state, content) ? resolveText('t.ui.hud.wind_flag', ctx) : null,
  };
}

export function statsPanelView(state: DeepReadonly<GameState>, content: ContentBundle): StatsPanelView {
  const ctx = { state, content };
  const text = (id: TextId): string => resolveText(id, ctx);
  const rows = ROW_STATS.map(([stat, labelId]): StatRowView => {
    const rule = content.stats[stat];
    const stored = state.stats[stat];
    const max = rule.max === 'maxStamina' ? maxStamina(state, content) : (rule.max ?? 100);
    return {
      stat,
      label: text(labelId),
      value: Math.round(stored),
      max,
      low: rule.lowLine !== null && stored <= rule.lowLine,
      lostCapPct: stat === 'stamina' ? 100 - max : 0,
    };
  });
  return {
    title: text('t.ui.stats.title'),
    ariaLabel: text('t.ui.stats.aria'),
    rows,
    favor: {
      label: text('t.ui.stat.favor'),
      count: Math.round(state.stats.favor),
      slots: content.stats.favor.max as number,
    },
    money: { label: text('t.ui.stat.money'), text: formatMoney(state.stats.money) },
  };
}
