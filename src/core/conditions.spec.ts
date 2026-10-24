import { describe, expect, test } from 'bun:test';
import { buildTestState, testContent } from '../../test/fixtures';
import type { Condition, DeepReadonly, GameState, NumExpr, ReviewRecord } from '../model';
import { InvariantError } from '../utils/errors';
import { type EvalContext, evaluateCondition, evaluateNumber } from './conditions';

// GDD §5.4：「專業 ≥45」解鎖「先調 log」選項
const SKILL_GATE = 45;
const JUST_BELOW_GATE = SKILL_GATE - 1;
const FRACTION_ABOVE_GATE = SKILL_GATE + 0.5;
const HIGH_SKILL = 90;
const TALLY_THRESHOLD = 2;
const TALLY_ABOVE_THRESHOLD = TALLY_THRESHOLD + 1;

const skillGate: Condition = { stat: 'skill', cmp: 'gte', value: SKILL_GATE };
const ctxOf = (state: DeepReadonly<GameState>): EvalContext => ({ state, content: testContent });
const SKILL_GATE_CASES: readonly [number, boolean][] = [
  [JUST_BELOW_GATE, false],
  [SKILL_GATE, true],
  [FRACTION_ABOVE_GATE, true],
];

describe('evaluateCondition', () => {
  test.each(SKILL_GATE_CASES)('a gte-45 skill gate evaluates skill %p as %p', (skill, expected) => {
    const state = buildTestState({ stats: { skill } });
    expect(evaluateCondition(skillGate, ctxOf(state))).toBe(expected);
  });

  test('an empty all is true and an empty any is false', () => {
    const ctx = ctxOf(buildTestState());
    expect([evaluateCondition({ all: [] }, ctx), evaluateCondition({ any: [] }, ctx)]).toEqual([true, false]);
  });

  test('double negation gives the same result as the original for every fixture condition and state', () => {
    const conditions: readonly Condition[] = [
      skillGate,
      { flag: 'flag.test_switch' },
      { counter: 'cnt.test_tally', cmp: 'gt', value: TALLY_THRESHOLD },
      { any: [skillGate, { flag: 'flag.test_switch', is: false }] },
    ];
    const states = [
      buildTestState(),
      buildTestState({
        stats: { skill: HIGH_SKILL },
        flags: { 'flag.test_switch': true },
        counters: { 'cnt.test_tally': TALLY_ABOVE_THRESHOLD },
      }),
    ];
    const mismatches = conditions.flatMap((condition, conditionIndex) =>
      states.flatMap((state, stateIndex) => {
        const ctx = ctxOf(state);
        const same = evaluateCondition({ not: { not: condition } }, ctx) === evaluateCondition(condition, ctx);
        return same ? [] : [{ conditionIndex, stateIndex }];
      }),
    );
    expect(mismatches).toEqual([]);
  });
});

const ROOKIE_FLAG = 'flag.test_switch';
// 02 T29：25% ＋（100 − 負責機台平均）× 0.3% ＋ 菜鳥 10%；平均 60 非菜鳥 → 0.37；平均 20 菜鳥 → 0.59
const RING_CHANCE: NumExpr = {
  clamp: {
    sum: [
      0.25,
      { product: [{ sum: [100, { product: [-1, { ownedMachineHealthAvg: true }] }] }, 0.003] },
      // biome-ignore lint/suspicious/noThenProperty: NumExpr's if node is spelled then/else by the model
      { if: { flag: ROOKIE_FLAG }, then: 0.1, else: 0 },
    ],
  },
  lo: 0,
  hi: 1,
};

describe('evaluateNumber', () => {
  test.each([
    { health: [60, 60], rookie: false, expected: 0.37 },
    { health: [20, 20], rookie: true, expected: 0.59 },
  ])(
    'the GDD 8.12 ring chance with owned health $health and rookie $rookie is $expected',
    ({ health, rookie, expected }) => {
      const state = buildTestState({ flags: { [ROOKIE_FLAG]: rookie } });
      state.machines['mc.test01'] = { health: health[0] ?? 0 };
      state.machines['mc.test02'] = { health: health[1] ?? 0 };
      expect(evaluateNumber(RING_CHANCE, ctxOf(state))).toBeCloseTo(expected, 10);
    },
  );

  test('empty sum is 0 and empty product is 1', () => {
    const ctx = ctxOf(buildTestState());
    expect([evaluateNumber({ sum: [] }, ctx), evaluateNumber({ product: [] }, ctx)]).toEqual([0, 1]);
  });

  test.each([{ min: [] }, { max: [] }] as const)('an empty %p fails fast', (expr) => {
    expect(() => evaluateNumber(expr, ctxOf(buildTestState()))).toThrow(InvariantError);
  });

  test('min, max and the leaf readers return the picked value', () => {
    const state = buildTestState({ stats: { skill: 30 }, counters: { 'cnt.test_tally': 7 } });
    const ctx = ctxOf(state);
    expect([
      evaluateNumber({ min: [5, { stat: 'skill' }, 9] }, ctx),
      evaluateNumber({ max: [5, { stat: 'skill' }, 9] }, ctx),
      evaluateNumber({ counterOf: 'cnt.test_tally' }, ctx),
      evaluateNumber({ machineHealth: 'mc.test01' }, ctx),
    ]).toEqual([5, 30, 7, 45]);
  });

  test('affinityOf reads the boss favor line for the direct boss and the relationship for others', () => {
    const state = buildTestState({ stats: { bossFavor: 30 } });
    state.relationships['chr.azhe'] = { affinity: 12, lastInteractionDay: null, coordinateWaiverUsedIn: null };
    const ctx = ctxOf(state);
    expect([evaluateNumber({ affinityOf: 'chr.lin' }, ctx), evaluateNumber({ affinityOf: 'chr.azhe' }, ctx)]).toEqual([
      -40, 12,
    ]);
  });
});

const REVIEW: ReviewRecord = {
  kind: 'annual',
  dayIndex: 10,
  kpi: 70,
  kpiBreakdown: { minigames: 70, line: 70, penalty: 0 },
  bonusMultiplier: 1,
  ps: 70,
  grade: 'M',
  passed: true,
  teamRank: 1,
  citedEntries: [],
  raisePct: 0,
};

interface NodeCase {
  name: string;
  setup?: (state: GameState) => void;
  condition: Condition;
  expected: boolean;
}

const dayIs = (dayIndex: number) => (state: GameState) => {
  state.time.dayIndex = dayIndex;
};
const minuteIs = (minuteOfDay: number) => (state: GameState) => {
  state.time.minuteOfDay = minuteOfDay;
};
const affinityIs = (id: `chr.${string}`, affinity: number) => (state: GameState) => {
  state.relationships[id] = { affinity, lastInteractionDay: null, coordinateWaiverUsedIn: null };
};
const bossFavorIs = (bossFavor: number) => (state: GameState) => {
  state.stats.bossFavor = bossFavor;
};
const chapterIs = (chapter: GameState['time']['chapter']) => (state: GameState) => {
  state.time.chapter = chapter;
};
const reviewsAre =
  (...records: ReviewRecord[]) =>
  (state: GameState) => {
    state.career.reviews.push(...records);
  };
const scriptedSeen = (state: GameState) => {
  state.events.seen['ev.test_scripted'] = { count: 1, lastDay: 0, lastChoice: 'c_yes' };
};
const locationIs = (location: GameState['location']) => (state: GameState) => {
  state.location = location;
};
const windPeriodSetup = (state: GameState) => {
  state.career.probation = 'passed';
  state.time.dayIndex = 300;
};

const TIME_BETWEEN_CASES: readonly (readonly [number, boolean])[] = [
  [1380, true],
  [359, true],
  [360, true],
  [361, false],
  [1319, false],
];

const NODE_CASES: NodeCase[] = [
  {
    name: 'boss affinity at the lte -40 edge',
    setup: bossFavorIs(30),
    condition: { affinity: 'chr.lin', cmp: 'lte', value: -40 },
    expected: true,
  },
  {
    name: 'boss affinity just above the edge',
    setup: bossFavorIs(31),
    condition: { affinity: 'chr.lin', cmp: 'lte', value: -40 },
    expected: false,
  },
  {
    name: 'affinityTier trusted at 40',
    setup: affinityIs('chr.azhe', 40),
    condition: { affinityTier: 'chr.azhe', atLeast: 'trusted' },
    expected: true,
  },
  {
    name: 'affinityTier trusted at 39',
    setup: affinityIs('chr.azhe', 39),
    condition: { affinityTier: 'chr.azhe', atLeast: 'trusted' },
    expected: false,
  },
  { name: 'an unset flag is false', condition: { flag: 'flag.test_switch' }, expected: false },
  { name: 'an unset flag matches is:false', condition: { flag: 'flag.test_switch', is: false }, expected: true },
  { name: 'an unset counter is 0', condition: { counter: 'cnt.test_tally', cmp: 'eq', value: 0 }, expected: true },
  {
    name: 'dateBetween on its only day',
    setup: dayIs(0),
    condition: { dateBetween: { from: '2027-03-01', to: '2027-03-01' } },
    expected: true,
  },
  {
    name: 'dateBetween the day after',
    setup: dayIs(1),
    condition: { dateBetween: { from: '2027-03-01', to: '2027-03-01' } },
    expected: false,
  },
  ...TIME_BETWEEN_CASES.map(
    ([minute, expected]): NodeCase => ({
      name: `timeBetween across midnight at minute ${minute}`,
      setup: minuteIs(minute),
      condition: { timeBetween: { from: '22:00', to: '06:00' } },
      expected,
    }),
  ),
  { name: 'weekdayIn saturday on day 104', setup: dayIs(104), condition: { weekdayIn: [6] }, expected: true },
  { name: 'weekdayIn saturday on day 105', setup: dayIs(105), condition: { weekdayIn: [6] }, expected: false },
  { name: 'chapterIn matches ch3', setup: chapterIs('ch3'), condition: { chapterIn: ['ch3'] }, expected: true },
  { name: 'chapterIn rejects prologue', condition: { chapterIn: ['ch3'] }, expected: false },
  { name: 'resume matches', condition: { resume: 'res.test' }, expected: true },
  { name: 'pronoun differs from neutral', condition: { pronoun: 'she' }, expected: false },
  { name: 'rank Q1 is lt Q2', condition: { rank: 'Q2', cmp: 'lt' }, expected: true },
  { name: 'rank Q1 is not gt Q1', condition: { rank: 'Q1', cmp: 'gt' }, expected: false },
  { name: 'lastReview without records', condition: { lastReview: 'annual', gradeIn: ['M', 'M-'] }, expected: false },
  {
    name: 'lastReview with a matching grade',
    setup: reviewsAre(REVIEW),
    condition: { lastReview: 'annual', gradeIn: ['M', 'M-'] },
    expected: true,
  },
  {
    name: 'lastReview uses only the latest record',
    setup: reviewsAre(REVIEW, { ...REVIEW, grade: 'D' }),
    condition: { lastReview: 'annual', gradeIn: ['M'] },
    expected: false,
  },
  { name: 'probation pending', condition: { probation: 'pending' }, expected: true },
  { name: 'eventSeen before seeing it', condition: { eventSeen: 'ev.test_scripted' }, expected: false },
  {
    name: 'eventSeen after seeing it',
    setup: scriptedSeen,
    condition: { eventSeen: 'ev.test_scripted' },
    expected: true,
  },
  {
    name: 'choiceMade the chosen option',
    setup: scriptedSeen,
    condition: { choiceMade: { event: 'ev.test_scripted', choice: 'c_yes' } },
    expected: true,
  },
  {
    name: 'choiceMade another option',
    setup: scriptedSeen,
    condition: { choiceMade: { event: 'ev.test_scripted', choice: 'c_no' } },
    expected: false,
  },
  { name: 'machine health 45 is lt 50', condition: { machine: 'mc.test01', cmp: 'lt', value: 50 }, expected: true },
  { name: 'location null', setup: locationIs(null), condition: { location: 'loc.test_bay' }, expected: false },
  {
    name: 'location matches',
    setup: locationIs('loc.test_bay'),
    condition: { location: 'loc.test_bay' },
    expected: true,
  },
  {
    name: 'windPeriod after probation near a review',
    setup: windPeriodSetup,
    condition: { windPeriod: true },
    expected: true,
  },
  {
    name: 'expr eq tolerates float error',
    condition: { expr: { sum: [0.1, 0.2] }, cmp: 'eq', value: 0.3 },
    expected: true,
  },
];

describe('evaluateCondition node semantics', () => {
  test.each(NODE_CASES)('$name evaluates to $expected', ({ setup, condition, expected }) => {
    const state = buildTestState();
    setup?.(state);
    expect(evaluateCondition(condition, ctxOf(state))).toBe(expected);
  });

  test('an unknown character fails fast', () => {
    const condition: Condition = { affinity: 'chr.nobody', cmp: 'gt', value: 0 };
    expect(() => evaluateCondition(condition, ctxOf(buildTestState()))).toThrow(InvariantError);
  });

  test('an unknown machine fails fast', () => {
    const condition: Condition = { machine: 'mc.nobody', cmp: 'gt', value: 0 };
    expect(() => evaluateCondition(condition, ctxOf(buildTestState()))).toThrow(InvariantError);
  });
});
