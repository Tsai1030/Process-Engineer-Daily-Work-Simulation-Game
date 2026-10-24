import type {
  CharacterId,
  ContentBundle,
  CounterId,
  DomainEvent,
  Effect,
  EventId,
  GameState,
  HousingId,
  MachineId,
  ModifierDef,
  PhoneMessage,
  PhoneMessageDef,
  PhoneThreadId,
  StatDelta,
  StatId,
  StatRule,
} from '../model';
import { InvariantError } from '../utils/errors';
import { clamp } from '../utils/math';
import { type EvalContext, evaluateCondition, evaluateNumber } from './conditions';
import type { Rng } from './rng';
import { affinityTier, isWindPeriod, maxStamina, mindRecoveryMultiplier } from './selectors';

export interface EffectContext {
  readonly content: ContentBundle;
  readonly rng: Rng;
  readonly sourceEvent: EventId | null;
}
export interface EffectResult {
  deltas: StatDelta[];
  domainEvents: DomainEvent[];
}

// D77：依此順序破平手
const BONDED_HELPERS: readonly CharacterId[] = ['chr.azhe', 'chr.xiaoqing', 'chr.haoge', 'chr.meiling', 'chr.vivian'];
const BONDED_HELP_MIN_BLAME = 8;
const BONDED_HELP_THREAD: PhoneThreadId = 'thread.etch_group';
const AFFINITY_MIN = -100;
const AFFINITY_MAX = 100;
const MACHINE_HEALTH_MIN = 0;
const MACHINE_HEALTH_MAX = 100;
// D74
const COUNTER_BOUNDS: Readonly<Record<CounterId, { min: number; max: number }>> = {
  'cnt.wip_pressure': { min: 0, max: 100 },
  'cnt.sys_exercise_bonus': { min: 0, max: 10 },
};

/** 在 draft（step() 的副本）上就地修改；回傳實際變化 */
export function applyEffects(draft: GameState, effects: readonly Effect[], ctx: EffectContext): EffectResult {
  const result: EffectResult = { deltas: [], domainEvents: [] };
  applyList(draft, effects, ctx, result);
  return result;
}

function applyList(draft: GameState, effects: readonly Effect[], ctx: EffectContext, result: EffectResult): void {
  for (const effect of effects) {
    applyEffect(draft, effect, ctx, result);
  }
}

function applyEffect(draft: GameState, effect: Effect, ctx: EffectContext, result: EffectResult): void {
  const evalCtx: EvalContext = { state: draft, content: ctx.content };
  switch (effect.op) {
    case 'stat':
      applyStat(draft, effect.stat, evaluateNumber(effect.delta, evalCtx), ctx.content, result);
      return;
    case 'setStat':
      setStat(draft, effect.stat, evaluateNumber(effect.value, evalCtx), ctx.content, result);
      return;
    case 'affinity':
      applyAffinity(draft, effect.character, effect.delta, ctx.content);
      return;
    case 'flag':
      draft.flags[effect.flag] = effect.value;
      return;
    case 'counter':
      applyCounter(draft, effect.counter, effect.delta);
      return;
    case 'machine':
      applyMachine(draft, effect.machine, effect.healthDelta);
      return;
    case 'modifier':
      applyModifier(draft, effect.modifier);
      return;
    case 'economy':
      applyEconomy(draft, effect, ctx.content, result);
      return;
    case 'phone':
      pushPhoneMessage(draft, effect.thread, effect.message, result);
      return;
    case 'when':
      applyList(draft, evaluateCondition(effect.if, evalCtx) ? effect.then : (effect.else ?? []), ctx, result);
      return;
    case 'chance': {
      const p = clamp(evaluateNumber(effect.p, evalCtx), 0, 1);
      applyList(draft, ctx.rng.chance(p) ? effect.then : (effect.else ?? []), ctx, result);
      return;
    }
    // D71
    case 'plantSeed':
    case 'cancelSeed':
    case 'blackBook':
    case 'queueEvent':
    case 'ending':
    case 'addTask':
    case 'advanceTime':
      throw new InvariantError(
        `Effect op not implemented until Stage 2: op=${effect.op} source=${ctx.sourceEvent ?? 'none'}`,
      );
    default: {
      const unhandled: never = effect;
      throw new InvariantError(`Unhandled effect op: effect=${JSON.stringify(unhandled)}`);
    }
  }
}

// 01 §5.3.3-2、02 §1.3
function applyStat(draft: GameState, stat: StatId, delta: number, content: ContentBundle, result: EffectResult): void {
  const adjusted = adjustStatDelta(draft, stat, delta, content, result);
  const excess = addClamped(draft, stat, adjusted, content, result);
  const overflow = content.stats[stat].overflowTo;
  if (overflow !== null && excess > 0) {
    addClamped(draft, overflow.stat, excess * overflow.perUnit, content, result);
  }
}

function adjustStatDelta(
  draft: GameState,
  stat: StatId,
  delta: number,
  content: ContentBundle,
  result: EffectResult,
): number {
  const modified = delta * statGainMultiplier(draft, stat, delta);
  if (stat === 'mind' && modified > 0) return modified * mindRecoveryMultiplier(draft, content);
  if (stat === 'skill' && modified < 0) return 0;
  if (stat === 'blame' && modified >= BONDED_HELP_MIN_BLAME && takeBondedHelp(draft, result)) return 0;
  if (stat === 'bossFavor' && isWindPeriod(draft, content)) return modified * content.review.windBossFavorMultiplier;
  return modified;
}

// D75：expiresDay 當天仍生效
function statGainMultiplier(draft: GameState, stat: StatId, delta: number): number {
  const today = draft.time.dayIndex;
  return draft.modifiers
    .filter((modifier) => modifier.expiresDay === null || today <= modifier.expiresDay)
    .reduce((product, modifier) => {
      if (modifier.kind !== 'statGain' || modifier.stat !== stat) return product;
      return product * (delta > 0 ? modifier.positiveMultiplier : modifier.negativeMultiplier);
    }, 1);
}

/** D72：結果不越過原值往反方向走；回傳因上限沒加上去的量（溢出用） */
function addClamped(
  draft: GameState,
  stat: StatId,
  delta: number,
  content: ContentBundle,
  result: EffectResult,
): number {
  const rule = content.stats[stat];
  const before = draft.stats[stat];
  const { min, max } = statBounds(draft, rule, content);
  const raw = before + delta;
  const clamped = delta >= 0 ? Math.max(before, Math.min(raw, max)) : Math.min(before, Math.max(raw, min));
  writeStat(draft, stat, clamped, rule, result);
  return raw - clamped;
}

// D73
function setStat(draft: GameState, stat: StatId, value: number, content: ContentBundle, result: EffectResult): void {
  const rule = content.stats[stat];
  const { min, max } = statBounds(draft, rule, content);
  writeStat(draft, stat, clamp(value, min, max), rule, result);
}

function statBounds(draft: GameState, rule: StatRule, content: ContentBundle): { min: number; max: number } {
  const max = rule.max === 'maxStamina' ? maxStamina(draft, content) : (rule.max ?? Number.POSITIVE_INFINITY);
  return { min: rule.min ?? Number.NEGATIVE_INFINITY, max };
}

function writeStat(draft: GameState, stat: StatId, value: number, rule: StatRule, result: EffectResult): void {
  const before = draft.stats[stat];
  const after = rule.integer ? Math.round(value) : value;
  draft.stats[stat] = after;
  if (after !== before) {
    result.deltas.push({ stat, delta: after - before });
  }
}

// 02 §8.4、D77
function takeBondedHelp(draft: GameState, result: EffectResult): boolean {
  const helper = bondedHelper(draft);
  if (helper === null) return false;
  const slug = helper.slice('chr.'.length);
  draft.flags[`flag.sys_bonded_help_${slug}`] = true;
  pushPhoneMessage(
    draft,
    BONDED_HELP_THREAD,
    { from: helper, text: `t.sys.bonded_help.${slug}`, kind: 'chat' },
    result,
  );
  return true;
}

function bondedHelper(draft: GameState): CharacterId | null {
  const candidates = BONDED_HELPERS.flatMap((id) => {
    const relationship = draft.relationships[id];
    const available =
      relationship !== undefined &&
      affinityTier(relationship.affinity) === 'bonded' &&
      draft.flags[`flag.sys_bonded_help_${id.slice('chr.'.length)}`] !== true;
    return available ? [{ id, affinity: relationship.affinity }] : [];
  });
  const best = candidates.reduce<(typeof candidates)[number] | null>(
    (top, candidate) => (top === null || candidate.affinity > top.affinity ? candidate : top),
    null,
  );
  return best?.id ?? null;
}

function applyAffinity(draft: GameState, character: CharacterId, delta: number, content: ContentBundle): void {
  if (content.characters[character]?.isDirectBoss === true) {
    throw new InvariantError(`Affinity effect on direct boss: character=${character}`);
  }
  const relationship = draft.relationships[character];
  if (relationship === undefined) {
    throw new InvariantError(`Unknown character: character=${character}`);
  }
  relationship.affinity = clamp(relationship.affinity + delta, AFFINITY_MIN, AFFINITY_MAX);
  relationship.lastInteractionDay = draft.time.dayIndex;
}

function applyCounter(draft: GameState, counter: CounterId, delta: number): void {
  const value = (draft.counters[counter] ?? 0) + delta;
  const bounds = COUNTER_BOUNDS[counter];
  draft.counters[counter] = bounds === undefined ? value : clamp(value, bounds.min, bounds.max);
}

function applyMachine(draft: GameState, machineId: MachineId, healthDelta: number): void {
  const machine = draft.machines[machineId];
  if (machine === undefined) {
    throw new InvariantError(`Unknown machine: machine=${machineId}`);
  }
  machine.health = clamp(machine.health + healthDelta, MACHINE_HEALTH_MIN, MACHINE_HEALTH_MAX);
}

// D75：同 ID 以新取代舊
function applyModifier(draft: GameState, modifier: ModifierDef): void {
  const today = draft.time.dayIndex;
  const expiresDay = modifier.durationDays === null ? null : today + modifier.durationDays;
  draft.modifiers = draft.modifiers.filter((active) => active.id !== modifier.id);
  draft.modifiers.push({ ...modifier, appliedDay: today, expiresDay });
}

function applyEconomy(
  draft: GameState,
  effect: Extract<Effect, { op: 'economy' }>,
  content: ContentBundle,
  result: EffectResult,
): void {
  if (effect.commute !== undefined) draft.economy.commute = effect.commute;
  if (effect.filialAmount !== undefined) draft.economy.filialAmount = effect.filialAmount;
  if (effect.housing !== undefined && effect.housing !== draft.economy.housing) {
    moveHousing(draft, effect.housing, content, result);
  }
}

// D76
function moveHousing(draft: GameState, housing: HousingId, content: ContentBundle, result: EffectResult): void {
  const rent = firstMonthRent(housing, content);
  const today = draft.time.dayIndex;
  writeStat(draft, 'money', draft.stats.money - rent, content.stats.money, result);
  // 0 - rent：宿舍 0 元房租不寫成 -0
  draft.economy.monthLedger.push({ dayIndex: today, kind: 'rent', amount: 0 - rent });
  draft.economy.housing = housing;
  draft.economy.housingSinceDay = today;
}

function firstMonthRent(housing: HousingId, content: ContentBundle): number {
  const step = content.economy.rent[housing].filter((entry) => entry.fromMonth <= 1).at(-1);
  if (step === undefined) {
    throw new InvariantError(`Missing first-month rent: housing=${housing}`);
  }
  return step.amount;
}

function pushPhoneMessage(
  draft: GameState,
  thread: PhoneThreadId,
  message: PhoneMessageDef,
  result: EffectResult,
): void {
  const entry: PhoneMessage = {
    ...message,
    thread,
    dayIndex: draft.time.dayIndex,
    minuteOfDay: draft.time.minuteOfDay,
    read: false,
  };
  draft.phone.messages.push(entry);
  result.domainEvents.push({ type: 'phoneMessage', message: { ...entry } });
}
