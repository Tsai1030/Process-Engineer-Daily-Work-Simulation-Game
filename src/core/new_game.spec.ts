import { describe, expect, test } from 'bun:test';
import { TEST_SEED, testContent } from '../../test/fixtures';
import type { ChoiceType, GameState, PlayerProfile } from '../model';
import { InvariantError } from '../utils/errors';
import { createNewGame } from './new_game';

const PROFILE: PlayerProfile = { name: '測試員', pronoun: 'neutral', resume: 'res.test', look: 'a' };
const CHOICE_TYPES: readonly ChoiceType[] = [
  'endure',
  'refuse',
  'coordinate',
  'shiftBlame',
  'please',
  'slack',
  'evidence',
  'escalate',
  'playDumb',
  'outburst',
  'expertise',
  'silence',
];
// 預期值逐欄手寫：02 §1.1 的 initial、res.test 覆寫專業 30、阿哲基礎 10 ＋ 履歷 5、06:30 ＝ 390 分、ET 健康照 fixtures
const EXPECTED: GameState = {
  runId: 'run-1',
  seed: TEST_SEED,
  rngState: TEST_SEED,
  player: PROFILE,
  time: {
    dayIndex: 0,
    minuteOfDay: 390,
    chapter: 'prologue',
    keyDaysPlayed: 0,
    currentKeyDay: { id: 'kd.test_start', kind: 'scripted' },
  },
  flow: { kind: 'keyDay', phase: 'wake' },
  stats: {
    stamina: 80,
    mind: 70,
    skill: 30,
    bossFavor: 50,
    favor: 3,
    money: 60000,
    healthDebt: 0,
    blame: 0,
    scheming: 10,
    conscience: 70,
    lifeSatisfaction: 50,
    network: 12,
    visibility: 20,
    goldenHandcuffs: 0,
    evidence: 0,
  },
  modifiers: [],
  relationships: {
    'chr.azhe': { affinity: 15, lastInteractionDay: null, coordinateWaiverUsedIn: null },
    'chr.meiling': { affinity: 10, lastInteractionDay: null, coordinateWaiverUsedIn: null },
  },
  career: {
    rank: 'Q1',
    monthlySalary: 58000,
    probation: 'pending',
    certificationScore: null,
    kpiSamples: [],
    reviews: [],
    bonusMultiplier: 1,
    overtimeHoursThisMonth: 0,
    overtimeHoursDeclaredThisMonth: 0,
    bossFavorFromOvertimeToday: 0,
    onCallThisWeek: false,
    onCallCallsThisMonth: 0,
  },
  economy: {
    housing: 'dorm',
    housingSinceDay: 0,
    commute: 'shuttle',
    filialAmount: 10000,
    monthLedger: [],
    payslips: [],
    totalIncome: 0,
  },
  flags: { 'flag.test_onboarded': true },
  counters: { 'cnt.wip_pressure': 40 },
  machines: { 'mc.test01': { health: 45 }, 'mc.test02': { health: 80 }, 'mc.test03': { health: 10 } },
  tasks: [],
  events: {
    seen: {},
    cooldowns: {},
    queue: [],
    deferred: [],
    pendingKeyDays: [],
    nonScriptedKeyDaysByMonth: {},
    interruptsByMonth: {},
    today: { dialogue: 0, crisis: 0 },
    locationsVisited: [],
  },
  seeds: [],
  blackBook: [],
  choiceTally: Object.fromEntries(CHOICE_TYPES.map((type) => [type, 0])) as Record<ChoiceType, number>,
  policy: null,
  phone: { messages: [] },
  location: null,
  runStats: { overtimeHours: 0, wokenUpCount: 0, onTimeLeaves: 0 },
  interaction: null,
  endingResult: null,
};
const INVALID_SEEDS = [-1, 1.5, 4294967296];

describe('createNewGame', () => {
  test('builds the complete opening state from stat rules, resume, characters, machines and balance', () => {
    expect(createNewGame(PROFILE, testContent, TEST_SEED)).toEqual(EXPECTED);
  });
  test('the opening state survives a JSON round trip unchanged', () => {
    const state = createNewGame(PROFILE, testContent, TEST_SEED);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
  test.each(INVALID_SEEDS)('rejects the seed %p', (seed) => {
    expect(() => createNewGame(PROFILE, testContent, seed)).toThrow(InvariantError);
  });
  test('rejects an unknown resume with its id in the message', () => {
    expect(() => createNewGame({ ...PROFILE, resume: 'res.nope' }, testContent, TEST_SEED)).toThrow(
      'Unknown resume: resume=res.nope',
    );
  });
});
