import type {
  AffinityTier,
  BalanceRules,
  ChapterId,
  ContentBundle,
  DeepReadonly,
  GameState,
  IsoDate,
  MachineStatus,
  PresentationMood,
  SceneId,
  TimeOfDay,
} from '../model';
import { dayIndexToIso, isoToDayIndex, weekdayOf } from '../utils/date';
import { InvariantError } from '../utils/errors';
import { round1 } from '../utils/math';

const CHAPTER_ORDER: readonly string[] = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'finale'];
const SATURDAY = 5;
const DAYS_PER_WEEK = 7;

export function maxStamina(state: DeepReadonly<GameState>, content: ContentBundle): number {
  const rules = content.balance.stamina;
  const debtPenalty = Math.floor(state.stats.healthDebt / rules.healthDebtDivisor);
  const exercise = Math.min(rules.exerciseCap, Math.max(0, state.counters['cnt.sys_exercise_bonus'] ?? 0));
  const grind = state.policy?.work === 'grind' ? rules.grindPenalty : 0;
  return rules.base - debtPenalty + exercise - grind;
}

export function mindRecoveryMultiplier(state: DeepReadonly<GameState>, content: ContentBundle): number {
  const rules = content.balance.mindRecovery;
  const satisfaction = state.stats.lifeSatisfaction;
  if (satisfaction >= rules.highAtOrAbove) return rules.highMultiplier;
  if (satisfaction <= rules.lowAtOrBelow) return rules.lowMultiplier;
  return 1;
}

export function linAffinity(bossFavor: number): number {
  return bossFavor * 2 - 100;
}

export function affinityTier(affinity: number): AffinityTier {
  if (affinity <= -40) return 'hostile';
  if (affinity < 0) return 'cold';
  if (affinity < 40) return 'neutral';
  if (affinity < 80) return 'trusted';
  return 'bonded';
}

export function machineStatus(health: number, rules: BalanceRules['machines']): MachineStatus {
  if (health >= rules.yellowBelow) return 'run';
  if (health >= rules.redBelow) return 'warn';
  return 'down';
}

export function ownedMachineHealthAvg(state: DeepReadonly<GameState>, content: ContentBundle): number {
  const healths = Object.values(content.machines)
    .filter((machine) => machine.ownedByPlayer)
    .map((machine) => state.machines[machine.id]?.health ?? machine.initialHealth);
  if (healths.length === 0) {
    throw new InvariantError('No owned machines: ownedByPlayer=0');
  }
  return healths.reduce((sum, health) => sum + health, 0) / healths.length;
}

export function timeOfDay(minuteOfDay: number): TimeOfDay {
  if (minuteOfDay >= 330 && minuteOfDay < 420) return 'dawn';
  if (minuteOfDay >= 420 && minuteOfDay < 1050) return 'day';
  if (minuteOfDay >= 1050 && minuteOfDay < 1140) return 'dusk';
  return 'night';
}

export function yieldIndex(state: DeepReadonly<GameState>, content: ContentBundle, scene: SceneId): number | null {
  if (scene !== 'scn.office') return null;
  return round1(90 + ownedMachineHealthAvg(state, content) / 10);
}

// D78：試用期考核不算風向期
export function isWindPeriod(state: DeepReadonly<GameState>, content: ContentBundle): boolean {
  const today = state.time.dayIndex;
  const reviewDays = Object.values(content.keyDays)
    .filter((keyDay) => keyDay.variant === 'review' && keyDay.date !== null)
    .map((keyDay) => isoToDayIndex(keyDay.date as IsoDate))
    .filter((reviewDay) => reviewDay > today);
  if (reviewDays.length === 0) return false;
  if (state.career.probation === 'pending' || state.career.probation === 'retakePending') return false;
  return Math.min(...reviewDays) - content.review.windPeriodDays <= today;
}

function isAtOrAfterChapter3(chapter: ChapterId): boolean {
  return CHAPTER_ORDER.indexOf(chapter) >= CHAPTER_ORDER.indexOf('ch3');
}

// 週一～週日的週；用本週六自己的月份算它是第幾個星期六
function isInRotationWeek(today: number, rotationSaturday: number): boolean {
  const saturday = today - weekdayOf(today) + SATURDAY;
  const saturdayDayOfMonth = Number(dayIndexToIso(saturday).slice(8));
  return Math.floor((saturdayDayOfMonth - 1) / DAYS_PER_WEEK) + 1 === rotationSaturday;
}

// D79
export function onCallTonight(state: DeepReadonly<GameState>, content: ContentBundle): boolean {
  const current = state.time.currentKeyDay;
  if (current !== null && content.keyDays[current.id]?.onCall === true) return true;
  if (!isAtOrAfterChapter3(state.time.chapter)) return false;
  return isInRotationWeek(state.time.dayIndex, content.balance.onCall.rotationSaturday);
}

export function presentationMood(state: DeepReadonly<GameState>, content: ContentBundle): PresentationMood {
  if (state.flags['flag.sys_stop_sequence_active'] === true) return 'calm';
  const { warningMindAtOrBelow, lowMindAtOrBelow } = content.balance.safety;
  if (state.stats.mind <= warningMindAtOrBelow) return 'warning';
  if (state.stats.mind <= lowMindAtOrBelow) return 'low';
  return 'normal';
}
