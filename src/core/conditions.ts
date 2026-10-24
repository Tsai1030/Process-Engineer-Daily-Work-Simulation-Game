import type {
  CharacterId,
  Cmp,
  Condition,
  ContentBundle,
  DeepReadonly,
  GameState,
  MachineId,
  NumExpr,
  RankId,
} from '../model';
import { clockToMinutes, isoToDayIndex, weekdayOf } from '../utils/date';
import { InvariantError } from '../utils/errors';
import { clamp } from '../utils/math';
import { affinityTier, isWindPeriod, linAffinity, onCallTonight, ownedMachineHealthAvg } from './selectors';

export interface EvalContext {
  readonly state: DeepReadonly<GameState>;
  readonly content: ContentBundle;
}

const FLOAT_TOLERANCE = 1e-9;
const RANK_ORDER: readonly RankId[] = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
const TIER_ORDER = ['hostile', 'cold', 'neutral', 'trusted', 'bonded'] as const;

function compare(actual: number, cmp: Cmp, expected: number): boolean {
  switch (cmp) {
    case 'eq':
      return Math.abs(actual - expected) < FLOAT_TOLERANCE;
    case 'neq':
      return Math.abs(actual - expected) >= FLOAT_TOLERANCE;
    case 'gt':
      return actual > expected;
    case 'gte':
      return actual >= expected;
    case 'lt':
      return actual < expected;
    case 'lte':
      return actual <= expected;
    default: {
      const unhandled: never = cmp;
      throw new InvariantError(`Unhandled comparison: cmp=${String(unhandled)}`);
    }
  }
}

function affinityOfCharacter(id: CharacterId, ctx: EvalContext): number {
  const character = ctx.content.characters[id];
  if (character === undefined) {
    throw new InvariantError(`Unknown character: character=${id}`);
  }
  if (character.isDirectBoss) {
    return linAffinity(ctx.state.stats.bossFavor);
  }
  const relationship = ctx.state.relationships[id];
  if (relationship === undefined) {
    throw new InvariantError(`Unknown character: character=${id}`);
  }
  return relationship.affinity;
}

function healthOfMachine(id: MachineId, ctx: EvalContext): number {
  const machine = ctx.state.machines[id];
  if (machine === undefined) {
    throw new InvariantError(`Unknown machine: machine=${id}`);
  }
  return machine.health;
}

function isTimeBetween(minuteOfDay: number, from: number, to: number): boolean {
  if (from <= to) return minuteOfDay >= from && minuteOfDay <= to;
  return minuteOfDay >= from || minuteOfDay <= to;
}

export function evaluateCondition(condition: Condition, ctx: EvalContext): boolean {
  const { state, content } = ctx;
  if ('all' in condition) return condition.all.every((child) => evaluateCondition(child, ctx));
  if ('any' in condition) return condition.any.some((child) => evaluateCondition(child, ctx));
  if ('not' in condition) return !evaluateCondition(condition.not, ctx);
  if ('stat' in condition) return compare(state.stats[condition.stat], condition.cmp, condition.value);
  if ('affinity' in condition) {
    return compare(affinityOfCharacter(condition.affinity, ctx), condition.cmp, condition.value);
  }
  if ('affinityTier' in condition) {
    const tier = affinityTier(affinityOfCharacter(condition.affinityTier, ctx));
    return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(condition.atLeast);
  }
  if ('flag' in condition) return (state.flags[condition.flag] ?? false) === (condition.is ?? true);
  if ('counter' in condition) return compare(state.counters[condition.counter] ?? 0, condition.cmp, condition.value);
  if ('dateBetween' in condition) {
    const today = state.time.dayIndex;
    return today >= isoToDayIndex(condition.dateBetween.from) && today <= isoToDayIndex(condition.dateBetween.to);
  }
  if ('timeBetween' in condition) {
    const { from, to } = condition.timeBetween;
    return isTimeBetween(state.time.minuteOfDay, clockToMinutes(from), clockToMinutes(to));
  }
  if ('weekdayIn' in condition) return condition.weekdayIn.includes(weekdayOf(state.time.dayIndex));
  if ('chapterIn' in condition) return condition.chapterIn.includes(state.time.chapter);
  if ('resume' in condition) return state.player.resume === condition.resume;
  if ('pronoun' in condition) return state.player.pronoun === condition.pronoun;
  if ('rank' in condition) {
    return compare(RANK_ORDER.indexOf(state.career.rank), condition.cmp, RANK_ORDER.indexOf(condition.rank));
  }
  if ('lastReview' in condition) {
    const latest = state.career.reviews.findLast((review) => review.kind === condition.lastReview);
    return latest?.grade != null && condition.gradeIn.includes(latest.grade);
  }
  if ('probation' in condition) return state.career.probation === condition.probation;
  if ('eventSeen' in condition) return state.events.seen[condition.eventSeen] !== undefined;
  if ('choiceMade' in condition) {
    return state.events.seen[condition.choiceMade.event]?.lastChoice === condition.choiceMade.choice;
  }
  if ('machine' in condition) return compare(healthOfMachine(condition.machine, ctx), condition.cmp, condition.value);
  if ('location' in condition) return state.location === condition.location;
  if ('windPeriod' in condition) return isWindPeriod(state, content) === condition.windPeriod;
  if ('onCallTonight' in condition) return onCallTonight(state, content) === condition.onCallTonight;
  if ('expr' in condition) return compare(evaluateNumber(condition.expr, ctx), condition.cmp, condition.value);
  const unhandled: never = condition;
  throw new InvariantError(`Unhandled condition: condition=${JSON.stringify(unhandled)}`);
}

export function evaluateNumber(expr: NumExpr, ctx: EvalContext): number {
  if (typeof expr === 'number') return expr;
  const values = (list: readonly NumExpr[]): number[] => list.map((child) => evaluateNumber(child, ctx));
  if ('stat' in expr) return ctx.state.stats[expr.stat];
  if ('affinityOf' in expr) return affinityOfCharacter(expr.affinityOf, ctx);
  if ('counterOf' in expr) return ctx.state.counters[expr.counterOf] ?? 0;
  if ('machineHealth' in expr) return healthOfMachine(expr.machineHealth, ctx);
  if ('ownedMachineHealthAvg' in expr) return ownedMachineHealthAvg(ctx.state, ctx.content);
  if ('sum' in expr) return values(expr.sum).reduce((total, value) => total + value, 0);
  if ('product' in expr) return values(expr.product).reduce((total, value) => total * value, 1);
  if ('min' in expr || 'max' in expr) {
    const picked = values('min' in expr ? expr.min : expr.max);
    if (picked.length === 0) {
      throw new InvariantError('Empty min/max expression');
    }
    return 'min' in expr ? Math.min(...picked) : Math.max(...picked);
  }
  if ('clamp' in expr) return clamp(evaluateNumber(expr.clamp, ctx), expr.lo, expr.hi);
  if ('if' in expr) {
    return evaluateNumber(evaluateCondition(expr.if, ctx) ? expr.then : expr.else, ctx);
  }
  const unhandled: never = expr;
  throw new InvariantError(`Unhandled number expression: expr=${JSON.stringify(unhandled)}`);
}
