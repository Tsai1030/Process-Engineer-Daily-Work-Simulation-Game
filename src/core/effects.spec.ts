import { describe, expect, test } from 'bun:test';
import { buildTestState, defined, TEST_SEED, testContent } from '../../test/fixtures';
import type { ActiveModifier, Effect, GameState, ModifierDef, PhoneMessage } from '../model';
import { InvariantError } from '../utils/errors';
import { applyEffects } from './effects';
import { createRng } from './rng';

// 02 §8.4：delta ≥8 才會被生死之交擋下
const SHIELDED_BLAME = 8;
const UNSHIELDED_BLAME = SHIELDED_BLAME - 1;
const BONDED_AFFINITY = 85;
// 2028-01-12 考績日前 42 天內（D78）
const WIND_PERIOD_DAY = 300;
const RNG_STATE_AFTER_ONE_DRAW_FROM_SEED_1 = 1831565814;

function run(state: GameState, effects: readonly Effect[], seed = TEST_SEED) {
  const draft = structuredClone(state);
  const rng = createRng(seed);
  const result = applyEffects(draft, effects, { content: testContent, rng, sourceEvent: null });
  return { result, state: draft, rngState: rng.getState() };
}

function stateWith(mutate: (state: GameState) => void, base: GameState = buildTestState()): GameState {
  const state = structuredClone(base);
  mutate(state);
  return state;
}

function inWindPeriod(state: GameState): void {
  state.career.probation = 'passed';
  state.time.dayIndex = WIND_PERIOD_DAY;
}

function bossFavorGain(
  id: ActiveModifier['id'],
  positiveMultiplier: number,
  expiresDay: number | null,
): ActiveModifier {
  return {
    id,
    kind: 'statGain',
    stat: 'bossFavor',
    positiveMultiplier,
    negativeMultiplier: 1,
    durationDays: null,
    appliedDay: 0,
    expiresDay,
  };
}

describe('applyEffects stat pipeline', () => {
  // 02 T05：生活滿足 70 → 精神回復 ×1.3，只放大正值
  test('mind recovery multiplier scales gains but not losses', () => {
    const state = buildTestState({ stats: { lifeSatisfaction: 70, mind: 50 } });
    const gain = run(state, [{ op: 'stat', stat: 'mind', delta: 10 }]).result.deltas;
    const loss = run(state, [{ op: 'stat', stat: 'mind', delta: -10 }]).result.deltas;
    expect([gain, loss]).toEqual([[{ stat: 'mind', delta: 13 }], [{ stat: 'mind', delta: -10 }]]);
  });

  // 02 T06：風向期 bossFavor 正負都 ×1.5
  test('wind period multiplies boss favor gains and losses by 1.5', () => {
    const state = stateWith(inWindPeriod);
    const gain = run(state, [{ op: 'stat', stat: 'bossFavor', delta: 8 }]);
    const loss = run(state, [{ op: 'stat', stat: 'bossFavor', delta: -12 }]);
    expect({
      gain: gain.result.deltas,
      gainValue: gain.state.stats.bossFavor,
      loss: loss.result.deltas,
      lossValue: loss.state.stats.bossFavor,
    }).toEqual({
      gain: [{ stat: 'bossFavor', delta: 12 }],
      gainValue: 62,
      loss: [{ stat: 'bossFavor', delta: -18 }],
      lossValue: 32,
    });
  });

  // 02 T07：人情 5 再 +1 → 人情不變、人脈網 +3，0 變化不記錄
  test('favor overflow converts to network and records only the real change', () => {
    const { result, state } = run(buildTestState({ stats: { favor: 5, network: 12 } }), [
      { op: 'stat', stat: 'favor', delta: 1 },
    ]);
    expect({ deltas: result.deltas, favor: state.stats.favor, network: state.stats.network }).toEqual({
      deltas: [{ stat: 'network', delta: 3 }],
      favor: 5,
      network: 15,
    });
  });

  // 02 T08
  test('negative skill deltas are ignored', () => {
    const { result, state } = run(buildTestState({ stats: { skill: 30 } }), [{ op: 'stat', stat: 'skill', delta: -5 }]);
    expect({ deltas: result.deltas, skill: state.stats.skill }).toEqual({ deltas: [], skill: 30 });
  });

  test('stamina is capped by maxStamina', () => {
    const { result, state } = run(buildTestState({ stats: { healthDebt: 37, stamina: 80 } }), [
      { op: 'stat', stat: 'stamina', delta: 10 },
    ]);
    expect({ deltas: result.deltas, stamina: state.stats.stamina }).toEqual({
      deltas: [{ stat: 'stamina', delta: 2 }],
      stamina: 82,
    });
  });

  // Review Focus 1（D72）
  test('a stamina gain never lowers stamina that already sits above a reduced maximum', () => {
    const { result, state } = run(buildTestState({ stats: { healthDebt: 20, stamina: 95 } }), [
      { op: 'stat', stat: 'stamina', delta: 10 },
    ]);
    expect({ deltas: result.deltas, stamina: state.stats.stamina }).toEqual({ deltas: [], stamina: 95 });
  });

  test('statGain modifiers multiply, and expired ones are ignored', () => {
    const state = stateWith((s) => {
      s.modifiers = [
        bossFavorGain('mod.test_a', 0.7, 10),
        bossFavorGain('mod.test_b', 0.5, null),
        bossFavorGain('mod.test_c', 0.1, -1),
      ];
    });
    const gain = run(state, [{ op: 'stat', stat: 'bossFavor', delta: 10 }]).result.deltas;
    const loss = run(state, [{ op: 'stat', stat: 'bossFavor', delta: -10 }]).result.deltas;
    expect([gain, loss]).toEqual([[{ stat: 'bossFavor', delta: 3.5 }], [{ stat: 'bossFavor', delta: -10 }]]);
  });

  test('integer stats round after clamping', () => {
    const favor = run(buildTestState({ stats: { favor: 3 } }), [{ op: 'stat', stat: 'favor', delta: 0.6 }]);
    const money = run(buildTestState({ stats: { money: 60000 } }), [{ op: 'stat', stat: 'money', delta: 0.4 }]);
    expect({
      favorDeltas: favor.result.deltas,
      favor: favor.state.stats.favor,
      moneyDeltas: money.result.deltas,
      money: money.state.stats.money,
    }).toEqual({ favorDeltas: [{ stat: 'favor', delta: 1 }], favor: 4, moneyDeltas: [], money: 60000 });
  });

  test('setStat clamps without modifiers or overflow', () => {
    const state = stateWith((s) => {
      inWindPeriod(s);
      s.stats.bossFavor = 50;
      s.stats.favor = 3;
      s.stats.network = 12;
      s.modifiers = [bossFavorGain('mod.test_b', 0.5, null)];
    });
    const { result, state: after } = run(state, [
      { op: 'setStat', stat: 'bossFavor', value: 70 },
      { op: 'setStat', stat: 'favor', value: 9 },
    ]);
    expect({
      deltas: result.deltas,
      bossFavor: after.stats.bossFavor,
      favor: after.stats.favor,
      network: after.stats.network,
    }).toEqual({
      deltas: [
        { stat: 'bossFavor', delta: 20 },
        { stat: 'favor', delta: 2 },
      ],
      bossFavor: 70,
      favor: 5,
      network: 12,
    });
  });
});

describe('applyEffects chance', () => {
  // 01 §5.3.3-4：每個 chance 一定剛好消耗一次 RNG
  test.each([0, 0.5, 1, 1.5])('a chance with p=%p advances the rng by exactly one step', (p) => {
    const { rngState } = run(
      buildTestState(),
      [{ op: 'chance', p, then: [{ op: 'flag', flag: 'flag.test_switch', value: true }] }],
      1,
    );
    expect(rngState).toBe(RNG_STATE_AFTER_ONE_DRAW_FROM_SEED_1);
  });

  test('the branch follows the first draw: 0.627 is below 0.7 but not below 0.6', () => {
    const branch = (p: number): Effect => ({
      op: 'chance',
      p,
      then: [{ op: 'flag', flag: 'flag.test_switch', value: true }],
      else: [{ op: 'counter', counter: 'cnt.test_tally', delta: 1 }],
    });
    const high = run(buildTestState(), [branch(0.7)], 1).state;
    const low = run(buildTestState(), [branch(0.6)], 1).state;
    expect({
      high: { flag: high.flags['flag.test_switch'], tally: high.counters['cnt.test_tally'] },
      low: { flag: low.flags['flag.test_switch'], tally: low.counters['cnt.test_tally'] },
    }).toEqual({ high: { flag: true, tally: undefined }, low: { flag: undefined, tally: 1 } });
  });
});

describe('applyEffects bonded blame shield (02 section 8.4, T62)', () => {
  test('a bonded coworker absorbs the first big blame once and leaves a phone message', () => {
    const state = stateWith((s) => {
      defined(s.relationships['chr.meiling'], 'meiling').affinity = BONDED_AFFINITY;
      defined(s.relationships['chr.azhe'], 'azhe').affinity = BONDED_AFFINITY;
    });
    const blame: Effect[] = [{ op: 'stat', stat: 'blame', delta: SHIELDED_BLAME }];
    const first = run(state, blame);
    const second = run(first.state, blame);
    const third = run(second.state, blame);
    const message: PhoneMessage = {
      from: 'chr.azhe',
      text: 't.sys.bonded_help.azhe',
      kind: 'chat',
      thread: 'thread.etch_group',
      dayIndex: 0,
      minuteOfDay: 390,
      read: false,
    };
    expect({
      first: {
        result: first.result,
        flag: first.state.flags['flag.sys_bonded_help_azhe'],
        messages: first.state.phone.messages,
      },
      second: { deltas: second.result.deltas, flag: second.state.flags['flag.sys_bonded_help_meiling'] },
      third: { deltas: third.result.deltas, blame: third.state.stats.blame },
    }).toEqual({
      first: {
        result: { deltas: [], domainEvents: [{ type: 'phoneMessage', message }] },
        flag: true,
        messages: [message],
      },
      second: { deltas: [], flag: true },
      third: { deltas: [{ stat: 'blame', delta: SHIELDED_BLAME }], blame: SHIELDED_BLAME },
    });
  });

  test('blame below 8 is never shielded', () => {
    const state = stateWith((s) => {
      defined(s.relationships['chr.azhe'], 'azhe').affinity = BONDED_AFFINITY;
    });
    const { result } = run(state, [{ op: 'stat', stat: 'blame', delta: UNSHIELDED_BLAME }]);
    expect(result).toEqual({ deltas: [{ stat: 'blame', delta: UNSHIELDED_BLAME }], domainEvents: [] });
  });
});

describe('applyEffects other ops', () => {
  test('affinity clamps at 100 and stamps the interaction day', () => {
    const state = stateWith((s) => {
      defined(s.relationships['chr.azhe'], 'azhe').affinity = 15;
    });
    const { result, state: after } = run(state, [{ op: 'affinity', character: 'chr.azhe', delta: 90 }]);
    expect({ deltas: result.deltas, azhe: after.relationships['chr.azhe'] }).toEqual({
      deltas: [],
      azhe: { affinity: 100, lastInteractionDay: 0, coordinateWaiverUsedIn: null },
    });
  });

  test('affinity on the direct boss fails fast', () => {
    expect(() => run(buildTestState(), [{ op: 'affinity', character: 'chr.lin', delta: 5 }])).toThrow(
      new InvariantError('Affinity effect on direct boss: character=chr.lin'),
    );
  });

  test('counters clamp only wip pressure and the exercise bonus', () => {
    const state = buildTestState({ counters: { 'cnt.wip_pressure': 95, 'cnt.sys_exercise_bonus': 9 } });
    const { counters } = run(state, [
      { op: 'counter', counter: 'cnt.wip_pressure', delta: 10 },
      { op: 'counter', counter: 'cnt.sys_exercise_bonus', delta: 2 },
      { op: 'counter', counter: 'cnt.test_tally', delta: -3 },
    ]).state;
    expect(counters).toEqual({ 'cnt.wip_pressure': 100, 'cnt.sys_exercise_bonus': 10, 'cnt.test_tally': -3 });
  });

  test('machine health clamps to 0..100', () => {
    const up = run(buildTestState(), [{ op: 'machine', machine: 'mc.test01', healthDelta: 70 }]).state;
    const down = run(buildTestState(), [{ op: 'machine', machine: 'mc.test01', healthDelta: -200 }]).state;
    expect([up.machines['mc.test01'], down.machines['mc.test01']]).toEqual([{ health: 100 }, { health: 0 }]);
  });

  test('an unknown machine fails fast', () => {
    expect(() => run(buildTestState(), [{ op: 'machine', machine: 'mc.nope', healthDelta: 1 }])).toThrow(
      new InvariantError('Unknown machine: machine=mc.nope'),
    );
  });

  test('re-applying a modifier with the same id replaces the old one', () => {
    const modifier: ModifierDef = {
      id: 'mod.test_gain',
      kind: 'statGain',
      stat: 'mind',
      positiveMultiplier: 2,
      negativeMultiplier: 1,
      durationDays: 3,
    };
    const first = run(buildTestState(), [{ op: 'modifier', modifier }]).state;
    const later = stateWith((s) => {
      s.time.dayIndex = 5;
    }, first);
    expect(run(later, [{ op: 'modifier', modifier }]).state.modifiers).toEqual([
      { ...modifier, appliedDay: 5, expiresDay: 8 },
    ]);
  });

  test('a modifier without a duration never expires', () => {
    const modifier: ModifierDef = {
      id: 'mod.test_forever',
      kind: 'eventTagWeight',
      tag: 'test',
      multiplier: 2,
      durationDays: null,
    };
    expect(run(buildTestState(), [{ op: 'modifier', modifier }]).state.modifiers).toEqual([
      { ...modifier, appliedDay: 0, expiresDay: null },
    ]);
  });

  test('moving from the dorm to a shared room charges the first month rent once', () => {
    const moved = run(buildTestState({ stats: { money: 60000 } }), [{ op: 'economy', housing: 'sharedRoom' }]);
    const later = stateWith((s) => {
      s.time.dayIndex = 40;
    }, moved.state);
    const again = run(later, [{ op: 'economy', housing: 'sharedRoom' }]);
    expect({
      deltas: moved.result.deltas,
      money: moved.state.stats.money,
      economy: moved.state.economy,
      againDeltas: again.result.deltas,
      againEconomy: again.state.economy,
    }).toEqual({
      deltas: [{ stat: 'money', delta: -8500 }],
      money: 51500,
      economy: {
        ...buildTestState().economy,
        housing: 'sharedRoom',
        housingSinceDay: 0,
        monthLedger: [{ dayIndex: 0, kind: 'rent', amount: -8500 }],
      },
      againDeltas: [],
      againEconomy: moved.state.economy,
    });
  });

  test('economy writes commute and filial amount directly', () => {
    const { economy } = run(buildTestState(), [{ op: 'economy', filialAmount: 20000, commute: 'scooter' }]).state;
    expect(economy).toEqual({ ...buildTestState().economy, filialAmount: 20000, commute: 'scooter' });
  });

  test.each([
    { flag: true, tally: 1 },
    { flag: false, tally: -1 },
  ])('when with flag=$flag runs only the matching branch and leaves the tally at $tally', ({ flag, tally }) => {
    const { counters } = run(buildTestState({ flags: { 'flag.test_switch': flag } }), [
      {
        op: 'when',
        if: { flag: 'flag.test_switch' },
        then: [{ op: 'counter', counter: 'cnt.test_tally', delta: 1 }],
        else: [{ op: 'counter', counter: 'cnt.test_tally', delta: -1 }],
      },
    ]).state;
    expect(counters['cnt.test_tally']).toBe(tally);
  });

  test('a false when without else changes nothing', () => {
    const state = buildTestState();
    const { result, state: after } = run(state, [
      { op: 'when', if: { flag: 'flag.test_switch' }, then: [{ op: 'stat', stat: 'mind', delta: 5 }] },
    ]);
    expect({ result, after }).toEqual({ result: { deltas: [], domainEvents: [] }, after: state });
  });

  test('a phone effect stores the message and announces it once', () => {
    const { result, state } = run(buildTestState(), [
      { op: 'phone', thread: 'thread.test', message: { from: 'chr.azhe', text: 't.ev.test_seeded.msg', kind: 'chat' } },
    ]);
    const message: PhoneMessage = {
      from: 'chr.azhe',
      text: 't.ev.test_seeded.msg',
      kind: 'chat',
      thread: 'thread.test',
      dayIndex: 0,
      minuteOfDay: 390,
      read: false,
    };
    expect({ result, messages: state.phone.messages }).toEqual({
      result: { deltas: [], domainEvents: [{ type: 'phoneMessage', message }] },
      messages: [message],
    });
  });

  test('applyEffects only changes the draft it is given', () => {
    const state = buildTestState();
    const snapshot = structuredClone(state);
    const draft = structuredClone(state);
    applyEffects(draft, [{ op: 'stat', stat: 'mind', delta: -5 }], {
      content: testContent,
      rng: createRng(TEST_SEED),
      sourceEvent: null,
    });
    expect({ input: state, draftMind: draft.stats.mind }).toEqual({
      input: snapshot,
      draftMind: snapshot.stats.mind - 5,
    });
  });
});

describe('applyEffects stage 2 ops', () => {
  test.each([
    { op: 'plantSeed', seed: 'seed.test_followup' },
    { op: 'cancelSeed', seed: 'seed.test_followup' },
    { op: 'blackBook', entry: { text: 't.test.ending', weight: 1, polarity: 'negative' } },
    { op: 'queueEvent', event: 'ev.test_micro', when: 'afterCurrent' },
    { op: 'ending', ending: 'end.e99_test' },
    { op: 'addTask', task: 'task.test_spc', when: 'today' },
    { op: 'advanceTime', minutes: 10 },
  ] as const)('%p fails fast until its Stage 2 module exists', (effect) => {
    expect(() => run(buildTestState(), [effect])).toThrow(
      `Effect op not implemented until Stage 2: op=${effect.op} source=none`,
    );
  });
});
