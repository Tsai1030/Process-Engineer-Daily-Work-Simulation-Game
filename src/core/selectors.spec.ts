import { describe, expect, test } from 'bun:test';
import { buildTestState, contentWith, defined, testContent } from '../../test/fixtures';
import type { ChapterId, GameState } from '../model';
import { isoToDayIndex } from '../utils/date';
import { InvariantError } from '../utils/errors';
import {
  affinityTier,
  isWindPeriod,
  linAffinity,
  machineStatus,
  maxStamina,
  mindRecoveryMultiplier,
  onCallTonight,
  ownedMachineHealthAvg,
  presentationMood,
  timeOfDay,
  yieldIndex,
} from './selectors';

function stateWith(mutate: (s: GameState) => void): GameState {
  const state = buildTestState();
  mutate(state);
  return state;
}

// 02 T01～T03（fixtures 的 stamina 規則：base 100、divisor 2、cap 10、grind 10）
describe('maxStamina', () => {
  test.each([
    { healthDebt: 0, exercise: 0, work: 'steady', expected: 100 },
    { healthDebt: 37, exercise: 0, work: 'steady', expected: 82 },
    { healthDebt: 85, exercise: 12, work: 'grind', expected: 58 },
    { healthDebt: 0, exercise: -3, work: 'steady', expected: 100 },
  ] as const)(
    'healthDebt $healthDebt, exercise $exercise, policy $work → $expected',
    ({ healthDebt, exercise, work, expected }) => {
      const state = stateWith((s) => {
        s.stats.healthDebt = healthDebt;
        s.counters['cnt.sys_exercise_bonus'] = exercise;
        s.policy = { work, life: 'rest' };
      });
      expect(maxStamina(state, testContent)).toBe(expected);
    },
  );
});

// 02 T04
describe('mindRecoveryMultiplier', () => {
  test.each([
    [59, 1],
    [60, 1.3],
    [25, 0.7],
    [26, 1],
  ])('lifeSatisfaction %d → %d', (lifeSatisfaction, expected) => {
    const state = stateWith((s) => {
      s.stats.lifeSatisfaction = lifeSatisfaction;
    });
    expect(mindRecoveryMultiplier(state, testContent)).toBe(expected);
  });
});

// 02 T09
describe('linAffinity', () => {
  test.each([
    [30, -40, 'hostile'],
    [50, 0, 'neutral'],
    [70, 40, 'trusted'],
    [90, 80, 'bonded'],
  ] as const)('bossFavor %d → affinity %d (%s)', (bossFavor, affinity, tier) => {
    expect([linAffinity(bossFavor), affinityTier(linAffinity(bossFavor))]).toEqual([affinity, tier]);
  });
});

describe('affinityTier', () => {
  test.each([
    [-40, 'hostile'],
    [-39.5, 'cold'],
    [-0.5, 'cold'],
    [0, 'neutral'],
    [39.9, 'neutral'],
    [40, 'trusted'],
    [79.9, 'trusted'],
    [80, 'bonded'],
  ] as const)('affinity %d → %s', (affinity, expected) => {
    expect(affinityTier(affinity)).toBe(expected);
  });
});

// 01 §15 的 19／20／39／40 邊界，加上快轉衰減會產生的小數
describe('machineStatus', () => {
  test.each([
    [19, 'down'],
    [19.99, 'down'],
    [20, 'warn'],
    [39, 'warn'],
    [39.99, 'warn'],
    [40, 'run'],
  ] as const)('health %d → %s', (health, expected) => {
    expect(machineStatus(health, testContent.balance.machines)).toBe(expected);
  });
});

describe('timeOfDay', () => {
  test.each([
    [0, 'night'],
    [329, 'night'],
    [330, 'dawn'],
    [419, 'dawn'],
    [420, 'day'],
    [1049, 'day'],
    [1050, 'dusk'],
    [1139, 'dusk'],
    [1140, 'night'],
    [1439, 'night'],
  ] as const)('minute %d → %s', (minute, expected) => {
    expect(timeOfDay(minute)).toBe(expected);
  });
});

describe('ownedMachineHealthAvg and yieldIndex', () => {
  test('owned machines 45 and 80 (mc.test03 excluded) → avg 62.5, office yield 96.3, fab_bay null', () => {
    const state = buildTestState();
    expect([
      ownedMachineHealthAvg(state, testContent),
      yieldIndex(state, testContent, 'scn.office'),
      yieldIndex(state, testContent, 'scn.fab_bay'),
    ]).toEqual([62.5, 96.3, null]);
  });

  test('no owned machine throws InvariantError', () => {
    const content = contentWith({
      machines: Object.fromEntries(
        Object.entries(testContent.machines).map(([id, def]) => [id, { ...def, ownedByPlayer: false }]),
      ),
    });
    expect(() => ownedMachineHealthAvg(buildTestState(), content)).toThrow(InvariantError);
  });
});

// D78；考績日 2028-01-12 ＝ 317，風向期 42 天
describe('isWindPeriod', () => {
  test.each([
    ['passed', 274, false],
    ['passed', 275, true],
    ['passed', 316, true],
    ['passed', 317, false],
    ['pending', 300, false],
  ] as const)('probation %s, dayIndex %d → %s', (probation, dayIndex, expected) => {
    expect(isoToDayIndex('2028-01-12')).toBe(317);
    const state = stateWith((s) => {
      s.career.probation = probation;
      s.time.dayIndex = dayIndex;
    });
    expect(isWindPeriod(state, testContent)).toBe(expected);
  });
});

// D79、02 T30；rotationSaturday 3 → 2027-08-21 是第 3 個星期六（8/16～8/22）
describe('onCallTonight', () => {
  test.each([
    ['ch3', 170, true],
    ['ch3', 175, false],
    ['ch1', 44, false],
  ] as const)('chapter %s, dayIndex %d → %s', (chapter, dayIndex, expected) => {
    const state = stateWith((s) => {
      s.time.chapter = chapter as ChapterId;
      s.time.dayIndex = dayIndex;
    });
    expect(onCallTonight(state, testContent)).toBe(expected);
  });

  test('key day flagged onCall is on call in the prologue', () => {
    const content = contentWith({
      keyDays: {
        ...testContent.keyDays,
        'kd.test_start': { ...defined(testContent.keyDays['kd.test_start'], 'kd'), onCall: true },
      },
    });
    const state = stateWith((s) => {
      s.time.currentKeyDay = { id: 'kd.test_start', kind: 'scripted' };
      s.time.chapter = 'prologue';
    });
    expect(onCallTonight(state, content)).toBe(true);
  });
});

describe('presentationMood', () => {
  test.each([
    [{ mind: 70, stop: true }, 'calm'],
    [{ mind: 15, stop: false }, 'warning'],
    [{ mind: 15.5, stop: false }, 'low'],
    [{ mind: 35, stop: false }, 'low'],
    [{ mind: 35.5, stop: false }, 'normal'],
  ] as const)('%o → %s', ({ mind, stop }, expected) => {
    const state = stateWith((s) => {
      s.stats.mind = mind;
      s.flags['flag.sys_stop_sequence_active'] = stop;
    });
    expect(presentationMood(state, testContent)).toBe(expected);
  });
});
