import { Texture } from 'three';
import { createNewGame } from '../src/core/new_game';
import type {
  CharacterAppearance,
  CharacterDef,
  ContentBundle,
  CounterId,
  DayPhase,
  EventDef,
  FlagDef,
  FlagId,
  GameState,
  HoldLotCaseDef,
  HoldLotCaseId,
  HoldLotNote,
  KeyDayDef,
  MachineDef,
  MinigameContext,
  OnCallScenarioDef,
  OnCallScenarioId,
  PolicyDef,
  RankDef,
  StatId,
  StatRule,
  TextId,
} from '../src/model';
import type { CanvasTextureFactory } from '../src/render/canvas_textures';

export const TEST_SEED = 1;

const ALL_PHASES: readonly DayPhase[] = [
  'wake',
  'commute',
  'gowning',
  'briefing',
  'shift',
  'clockOut',
  'evening',
  'sleep',
];

function statRule(initial: number, overrides: Partial<StatRule> = {}): StatRule {
  return {
    min: 0,
    max: 100,
    initial,
    visibility: 'hidden',
    integer: false,
    lowLine: null,
    overflowTo: null,
    ...overrides,
  };
}

// 02 §1.1
const stats: Record<StatId, StatRule> = {
  stamina: statRule(80, { max: 'maxStamina', visibility: 'visible', lowLine: 35 }),
  mind: statRule(70, { visibility: 'visible', lowLine: 35 }),
  skill: statRule(22, { visibility: 'visible' }),
  bossFavor: statRule(50, { visibility: 'visible' }),
  favor: statRule(3, { max: 5, visibility: 'visible', integer: true, overflowTo: { stat: 'network', perUnit: 3 } }),
  money: statRule(60000, { min: null, max: null, visibility: 'visible', integer: true }),
  healthDebt: statRule(0),
  blame: statRule(0),
  scheming: statRule(10),
  conscience: statRule(70),
  lifeSatisfaction: statRule(50),
  network: statRule(12),
  visibility: statRule(20),
  goldenHandcuffs: statRule(0, { max: 5, integer: true }),
  evidence: statRule(0, { max: 10, integer: true }),
};

const CLEANROOM_APPEARANCE: CharacterAppearance = {
  outfit: 'cleanroom',
  skinTone: '#fde7cf',
  hairColor: '#0a0a0a',
  hairStyle: 'short',
  topColor: '#e9eef2',
  bottomColor: '#3a3f4a',
  badgeColor: '#9aa3ad',
  heightScale: 1,
  glasses: false,
  modelRef: null,
};

function character(slug: string, isDirectBoss: boolean, expression: string, initialAffinity: number): CharacterDef {
  return {
    id: `chr.${slug}`,
    name: `t.test.chr.${slug}.name`,
    role: `t.test.chr.${slug}.role`,
    hasPortrait: true,
    expressions: [expression],
    defaultExpression: expression,
    initialAffinity,
    isDirectBoss,
    appearance: { fab: CLEANROOM_APPEARANCE, outside: CLEANROOM_APPEARANCE },
  };
}

function keyDay(overrides: Partial<KeyDayDef> & Pick<KeyDayDef, 'id'>): KeyDayDef {
  return {
    date: null,
    kind: 'scripted',
    chapter: 'prologue',
    title: 't.test.kd',
    variant: 'full',
    phases: ALL_PHASES,
    events: [],
    tasks: [],
    onCall: false,
    ...overrides,
  };
}

function eventDef(
  overrides: Partial<EventDef> & Pick<EventDef, 'id' | 'category' | 'trigger' | 'start' | 'nodes'>,
): EventDef {
  return {
    gddRef: null,
    chapters: ['prologue'],
    tags: [],
    repeatable: false,
    overflow: 'drop',
    presentation: 'scene',
    scene: 'scn.office',
    gameMinutes: 5,
    sourceRefs: [],
    ...overrides,
  };
}

function policy<P extends string>(id: P): PolicyDef<P> {
  return { id, label: 't.test.policy', description: 't.test.policy', monthlyEffects: [], overtimeHoursPerMonth: 0 };
}

function rank(id: RankDef['id'], monthlySalary: number, allowance: number, overtimeEligible: boolean): RankDef {
  return { id, title: 't.test.rank', monthlySalary, overtimeEligible, allowance };
}

function machine(slug: string, label: string, ownedByPlayer: boolean, initialHealth: number): MachineDef {
  return { id: `mc.${slug}`, label, location: 'loc.test_bay', hotspot: 'hs.test_tool', ownedByPlayer, initialHealth };
}

function runFlag(description: string): FlagDef {
  return { description, scope: 'run' };
}

const NOTE: HoldLotNote = { from: 'technician', text: 't.test.mg.note', misleading: false };
const HOLD_LOT_CASE: HoldLotCaseDef = {
  stage: 'AEI',
  minAmbiguity: 0,
  station: 't.test.mg.station',
  description: 't.test.mg.case',
  measurements: [],
  waferPattern: 'allOk',
  qTimeMinutes: [60, 120],
  payoffs: { release: 100, rework: 0, scrap: 0, split: 0, fa: 0 },
  releaseIsBad: false,
  scrapIsOver: true,
  notes: { helpful: NOTE, neutral: NOTE, misleading: null },
};
const ONCALL_SCENARIO: OnCallScenarioDef = {
  machine: 'mc.test01',
  transcript: [],
  correct: ['checkAlarm', 'abortWafer', 'holdTool'],
  dangerous: ['resetContinue'],
};

const TEXT: Record<TextId, string> = {
  't.test.chapter': '測試章節',
  't.test.kd': '測試關鍵日',
  't.test.chr.lin.name': '林課長',
  't.test.chr.lin.role': '直屬主管',
  't.test.chr.azhe.name': '阿哲',
  't.test.chr.azhe.role': '前輩',
  't.test.chr.meiling.name': '美玲姐',
  't.test.chr.meiling.role': '同事',
  't.test.resume': '測試履歷',
  't.ev.test_scripted.line': '測試台詞',
  't.ev.test_scripted.c_yes': '忍耐',
  't.ev.test_scripted.c_no': '拒絕',
  't.ev.test_scripted.result': '測試結果',
  't.ev.test_seeded.msg': '伏筆訊息',
  't.test.ending': '測試結局',
  't.test.policy': '測試方針',
  't.test.rank': '測試職等',
  't.test.mg.station': '測試站點',
  't.test.mg.case': '測試案例',
  't.test.mg.note': '測試留言',
  't.test.loc': '測試機台區',
  't.test.task': '測試任務',
  't.sys.bonded_help.azhe': '阿哲幫你擋下了這件事',
  't.sys.bonded_help.meiling': '美玲姐幫你擋下了這件事',
  't.ui.hud.department': '測試課',
  't.ui.hud.company': '測試公司',
  't.ui.hud.night_shift': '夜班',
  't.ui.hud.wind_flag': '風向期',
  't.ui.stats.title': '新人狀態表',
  't.ui.stats.aria': '角色數值',
  't.sys.pronoun.he': '他',
  't.sys.pronoun.she': '她',
  't.sys.pronoun.neutral': 'TA',
  't.ui.stat.stamina': '體力',
  't.ui.stat.mind': '精神',
  't.ui.stat.skill': '專業',
  't.ui.stat.boss_favor': '主管好感',
  't.ui.stat.favor': '同事人情',
  't.ui.stat.money': '存款',
};

/** 1 章、2 個關鍵日、3 個事件、1 種履歷；與真實內容分開維護（01 §13.2） */
export const testContent: ContentBundle = {
  stats,
  campaign: {
    startDate: '2027-03-01',
    termEndDate: '2028-02-29',
    chapters: [
      {
        id: 'prologue',
        title: 't.test.chapter',
        from: '2027-03-01',
        to: '2028-02-29',
        fastForward: 'week',
        keyDays: ['kd.test_start', 'kd.test_review'],
      },
    ],
    keyDayTarget: { min: 2, max: 2 },
    termEndings: ['end.e99_test'],
    templates: { conditional: 'kd.test_template', interrupt: 'kd.test_template' },
  },
  keyDays: {
    'kd.test_start': keyDay({
      id: 'kd.test_start',
      date: '2027-03-01',
      events: [{ event: 'ev.test_scripted', checkpoint: 'shiftStart' }],
      tasks: ['task.test_spc'],
    }),
    'kd.test_review': keyDay({ id: 'kd.test_review', date: '2028-01-12', variant: 'review' }),
    'kd.test_template': keyDay({
      id: 'kd.test_template',
      kind: 'conditional',
      chapter: null,
      variant: 'short',
      phases: ['briefing'],
    }),
  },
  characters: {
    'chr.lin': character('lin', true, 'fakeSmileGlare', 0),
    'chr.azhe': character('azhe', false, 'neutral', 10),
    'chr.meiling': character('meiling', false, 'neutral', 10),
  },
  resumes: {
    'res.test': {
      id: 'res.test',
      label: 't.test.resume',
      description: 't.test.resume',
      initialStats: { skill: 30 },
      initialAffinity: { 'chr.azhe': 5 },
      initialFlags: ['flag.test_onboarded'],
      minigameTolerance: {},
    },
  },
  events: {
    'ev.test_scripted': eventDef({
      id: 'ev.test_scripted',
      category: 'main',
      trigger: { kind: 'scripted' },
      scene: 'scn.fab_bay',
      gameMinutes: 20,
      start: 'n_line',
      nodes: {
        n_line: { kind: 'line', speaker: 'narrator', text: 't.ev.test_scripted.line', next: 'n_choice' },
        n_choice: {
          kind: 'choice',
          choices: [
            {
              id: 'c_yes',
              label: 't.ev.test_scripted.c_yes',
              type: 'endure',
              effects: [
                { op: 'stat', stat: 'skill', delta: 2 },
                { op: 'plantSeed', seed: 'seed.test_followup' },
              ],
              next: 'n_result',
            },
            {
              id: 'c_no',
              label: 't.ev.test_scripted.c_no',
              type: 'refuse',
              effects: [{ op: 'stat', stat: 'mind', delta: -3 }],
              next: 'n_result',
            },
          ],
        },
        n_result: { kind: 'result', text: 't.ev.test_scripted.result', next: null },
      },
      seeds: [
        {
          id: 'seed.test_followup',
          window: { minDays: 1, maxDays: 3 },
          checkpoints: ['briefing'],
          chance: 1,
          outcome: { event: 'ev.test_seeded' },
          weight: 1,
        },
      ],
      sourceRefs: ['〔test〕'],
    }),
    'ev.test_seeded': eventDef({
      id: 'ev.test_seeded',
      category: 'condition',
      trigger: { kind: 'seed' },
      start: 'n_msg',
      nodes: {
        n_msg: {
          kind: 'phone',
          thread: 'thread.test',
          messages: [{ from: 'chr.azhe', text: 't.ev.test_seeded.msg', kind: 'chat' }],
          next: null,
        },
      },
    }),
    'ev.test_micro': eventDef({
      id: 'ev.test_micro',
      category: 'micro',
      trigger: { kind: 'micro', weight: 1 },
      presentation: 'micro',
      scene: null,
      gameMinutes: 0,
      repeatable: true,
      start: 'n_tally',
      nodes: {
        n_tally: { kind: 'effects', effects: [{ op: 'counter', counter: 'cnt.test_tally', delta: 1 }], next: null },
      },
    }),
  },
  endings: {
    'end.e99_test': {
      id: 'end.e99_test',
      name: 't.test.ending',
      card: 't.test.ending',
      panels: ['t.test.ending'],
      tone: 'neutral',
      timing: 'term',
      condition: { all: [] },
      palette: 'firstYear',
      showHelpCard: false,
    },
  },
  minigames: {
    'mg.gowning': {
      chapterDefaults: { prologue: 'basic' },
      presets: {
        basic: { params: { mode: 'qte', variants: [], timeLimitSec: 10 }, gameMinutes: 15, staminaCost: 0 },
      },
      rules: null,
    },
    'mg.spc': {
      presets: {
        basic: {
          params: {
            variant: 'chart',
            charts: 1,
            rules: ['beyond3Sigma'],
            pointIntervalMs: 800,
            noise: 0,
            durationSec: 40,
            tutorial: false,
          },
          gameMinutes: 30,
          staminaCost: 4,
        },
      },
      // 03 §7.1
      rules: {
        ocap: {
          byRule: { beyond3Sigma: 'holdLot', run7: 'holdTool', trend6: 'holdTool', twoOfThree2Sigma: 'monitor' },
          afterOos: 'holdTool',
        },
      },
    },
    'mg.hold_lot': {
      presets: {
        basic: {
          params: { cards: 1, ambiguity: 0, qTimePressure: false, tutorial: false, consult: false },
          gameMinutes: 15,
          staminaCost: 3,
        },
      },
      rules: {
        tutorialCase: 'adiCdHigh',
        cases: {
          flier: HOLD_LOT_CASE,
          adiCdHigh: HOLD_LOT_CASE,
          underEtch: HOLD_LOT_CASE,
          overEtch: HOLD_LOT_CASE,
          partialChamber: HOLD_LOT_CASE,
          unknownDefect: HOLD_LOT_CASE,
        } satisfies Record<HoldLotCaseId, HoldLotCaseDef>,
      },
    },
    'mg.oncall': {
      presets: {
        basic: {
          params: { stepsRequired: 3, timeLimitSec: 60, blurByStamina: false, tutorial: false, scenario: 'random' },
          gameMinutes: 20,
          staminaCost: 0,
        },
      },
      rules: {
        scenarios: {
          chamberPressure: ONCALL_SCENARIO,
          particleHigh: ONCALL_SCENARIO,
          rfReflected: ONCALL_SCENARIO,
          robotStuck: ONCALL_SCENARIO,
          epdMiss: ONCALL_SCENARIO,
        } satisfies Record<OnCallScenarioId, OnCallScenarioDef>,
        randomPool: ['chamberPressure'],
        tutorialScenario: 'chamberPressure',
        neutralCommands: ['waitMorning'],
      },
    },
  },
  workPolicies: { grind: policy('grind'), steady: policy('steady'), save: policy('save'), learn: policy('learn') },
  lifePolicies: {
    rest: policy('rest'),
    partner: policy('partner'),
    family: policy('family'),
    social: policy('social'),
    exercise: policy('exercise'),
    saveMoney: policy('saveMoney'),
  },
  lifeActions: {},
  ranks: {
    Q1: rank('Q1', 58000, 0, true),
    Q2: rank('Q2', 66000, 0, true),
    Q3: rank('Q3', 78000, 6000, false),
    Q4: rank('Q4', 92000, 9000, false),
    Q5: rank('Q5', 0, 0, false),
  },
  // 02 §14.2
  economy: {
    withholdingRate: 0.08,
    bonusWithholdingRate: 0.1,
    overtimeHourly: 400,
    onCallWeekly: 500,
    onCallPerCall: 300,
    quarterlyBonusSalaryMonths: 3.5,
    yearEndSalaryMonths: 2,
    rent: {
      dorm: [
        { fromMonth: 1, amount: 0 },
        { fromMonth: 3, amount: 3000 },
      ],
      sharedRoom: [{ fromMonth: 1, amount: 8500 }],
      flatShare: [{ fromMonth: 1, amount: 6000 }],
    },
    monthlyCosts: { food: 9000, phone: 3500, insurance: 2500, transport: { shuttle: 0, scooter: 1500 } },
    calendarDays: { rent: 1, salary: 5, filial: 10 },
    filialAffinityPerMonth: { 0: -6, 5000: -2, 10000: 2, 20000: 6 },
    creditInterestMonthly: 0.015,
    yearEndHalfGrades: ['D', 'X'],
    yearEndPayDate: { month: 1, day: 20 },
    dormMoveOutMonth: 4,
    declaredOvertimePenalty: { aboveHours: 46, effects: [] },
    promotionRaise: 1.08,
  },
  // 02 §14.3
  review: {
    psWeights: { kpi: 0.35, bossFavor: 0.3, visibility: 0.15, blameInverse: 0.2 },
    kpiWeights: { minigames: 0.6, line: 0.4 },
    teamSize: 10,
    peerPsRange: { min: 45, max: 80 },
    quota: [
      { grade: 'P', count: 1 },
      { grade: 'M+', count: 2 },
      { grade: 'M', count: 4 },
      { grade: 'M-', count: 2 },
      { grade: 'D', count: 1 },
    ],
    scrapBelowPs: 40,
    allClearPs: 55,
    raisePct: { P: 0.1, 'M+': 0.07, M: 0.04, 'M-': 0.02, D: 0, X: 0 },
    bonusMultiplier: { P: 1.5, 'M+': 1.2, M: 1, 'M-': 0.85, D: 0.6, X: 0 },
    windPeriodDays: 42,
    windBossFavorMultiplier: 1.5,
    blackBookCiteCount: 3,
    blackBookRecencyDecayPerMonth: 0.85,
    blameDecayFactorAfterReview: 0.6,
    peers: [],
    blackBookPsFactor: 0.75,
    blackBookPsClamp: { min: -8, max: 4 },
    defaultMinigameKpi: 60,
    salaryRoundTo: 100,
    probation: {
      certificationPass: 60,
      skillMin: 30,
      skillMinWeakFoundation: 35,
      bossFavorMin: 25,
      retakeFavorAtLeast: 2,
      retakeFavorCost: 2,
      retakeEffects: [],
    },
    appeal: {
      base: 0.25,
      perEvidence: 0.1,
      cap: 0.75,
      skillBonusAtOrAbove: 60,
      skillBonus: 0.1,
      windowDays: { min: 20, max: 50 },
    },
    pip: { weeks: 4, failsToDismiss: 2, weeklySuccess: 0.5, successEffects: [], failEffects: [], liftEffects: [] },
    pipBlameAtOrAbove: 85,
    xGradesToDismiss: 2,
    majorViolationsToDismiss: 2,
    unansweredOnCallWarning: { count: 3, blameAtOrAbove: 50 },
  },
  // 02 §14.1
  balance: {
    clock: { realMsPerGameMinute: 150, hotspotMoveMinutes: 3 },
    overtimePerHour: [],
    overtimeBossFavorDailyCap: 4,
    takeHomeEffects: [],
    maxPendingSeeds: 8,
    maxBlackBookEntries: 12,
    perKeyDayCaps: { dialogue: 2, crisis: 1 },
    maxNonScriptedKeyDaysPerMonth: 2,
    maxInterruptsPerMonth: 1,
    microEventsPerSegment: { min: 0, max: 2 },
    randomEventDailyChance: 0.35,
    randomCooldownKeyDays: 3,
    safety: {
      careMindAtOrBelow: 15,
      careStaminaAtOrBelow: 20,
      warningMindAtOrBelow: 15,
      lowMindAtOrBelow: 35,
      promptAlwaysAtOrBelowMind: 5,
      leaveDays: 30,
      shortLeaveDays: 14,
      leaveEffects: [],
      shortLeaveEffects: [],
    },
    choiceWeights: {
      stamina: 1,
      mind: 1.2,
      bossFavor: 1,
      skill: 1.5,
      favor: 8,
      moneyPerThousand: 1,
      healthDebt: -1.5,
      blame: -1,
      scheming: 0.3,
      conscience: 0.3,
      lifeSatisfaction: 0.8,
      network: 0.8,
      visibility: 0.4,
      goldenHandcuffs: -6,
      evidence: 6,
    },
    statPolarity: {
      stamina: 1,
      mind: 1,
      skill: 1,
      bossFavor: 1,
      favor: 1,
      money: 1,
      healthDebt: -1,
      blame: -1,
      scheming: 1,
      conscience: 1,
      lifeSatisfaction: 1,
      network: 1,
      visibility: 1,
      goldenHandcuffs: -1,
      evidence: 1,
    },
    spreadFloor: 10,
    maxCoreChoiceSpread: 0.2,
    maxVisibleDeltaPerChoice: 20,
    maxVisibleNetPerKeyDay: 35,
    valuation: {
      affinityPerPoint: 0.4,
      affinityOverrides: {},
      ownedMachineHealthPerPoint: 0.1,
      blackBookPerWeight: 0.8,
      conditionalFactor: 0.5,
      minigameSuccessRate: 0.6,
      minigameResultValues: {
        'mg.spc': { success: 3, fail: -8.6 },
        'mg.spc:logTrace': { success: 0, fail: 0 },
        'mg.hold_lot': { success: 2.5, fail: -10 },
        'mg.oncall': { success: 1.5, fail: -9 },
        'mg.gowning': { success: 0, fail: 0 },
      },
      taskValue: -4,
      thresholdCardMarginRatio: 0.25,
      costFloor: 0.5,
      dominanceEpsilon: 0.01,
      maxEventDepth: 2,
      economyHorizonMonths: 6,
      counterValues: {},
      flagValues: {},
      modifierValues: {},
    },
    minigameRewards: [],
    minigameKpi: { excluded: [], excludedPresets: [], autoDoneSample: 60, unfinishedSample: 40 },
    workday: {
      workdayStamina: -25,
      onTimeEffects: [],
      unfinishedTaskEffects: [],
      overtimeIdleSkillPerHour: 1,
      takeHomeBedtime: '00:30',
      lunchAt: '12:00',
      wrapUpAt: '16:30',
      shiftDefault: { from: '08:30', to: '17:30' },
      earlyArrivalMinutes: 10,
      regownMinutes: 15,
    },
    sleep: { fullRecovery: 45, fullSleepHours: 7, wakeAt: '06:30', defaultBedtime: '23:00', calledFactor: 0.5 },
    onCall: {
      baseChance: 0.25,
      perMissingHealth: 0.003,
      rookieBonus: 0.1,
      rookieChance: 0.3,
      secondCallFactor: 0.5,
      ringEffects: [],
      fastForwardRingEffects: [],
      rotationSaturday: 3,
    },
    fastForward: {
      arrivalStaminaBase: 80,
      weekSingleSegmentMaxDays: 10,
      monthMergeBelowDays: 10,
      tinySegmentMaxDays: 3,
      maxMicroPerSegment: 4,
      grindHealthDebt: { base: 6, step: 6, cap: 24 },
      mindWarningHealthDebtPerMonth: 4,
    },
    stamina: { base: 100, healthDebtDivisor: 2, exerciseCap: 10, grindPenalty: 10 },
    mindRecovery: {
      highAtOrAbove: 60,
      highMultiplier: 1.3,
      lowAtOrBelow: 25,
      lowMultiplier: 0.7,
      lifeActionHalfAtOrBelow: 10,
    },
    thresholds: {
      healthDebt: { checkup: 30, bodyAlarm: 60, finalWarning: 85, hospital: 100 },
      blackoutEffects: [],
      borrowBelow: -50000,
      borrowAmount: 60000,
      borrowMomAffinity: -15,
    },
    machines: {
      autoPmBelow: 40,
      autoPmGain: 30,
      yellowBelow: 40,
      redBelow: 20,
      decayByWorkPolicy: { grind: 4, steady: 6, learn: 7, save: 9 },
    },
    wip: { initial: 40, monthlyRelief: -15, redMachineMonthly: 5, meltdownAt: 60 },
    relationships: { decayAbove: 40, decayAfterDays: 90, decay: -5, hostilePeerPenalty: -4, hostilePeerFloor: -12 },
  },
  locations: {
    'loc.test_bay': {
      id: 'loc.test_bay',
      name: 't.test.loc',
      scene: 'scn.fab_bay',
      mode: '3d',
      cleanroom: true,
      staminaPerHour: 0,
      hotspots: ['hs.test_tool'],
    },
  },
  machines: {
    'mc.test01': machine('test01', 'T-01', true, 45),
    'mc.test02': machine('test02', 'T-02', true, 80),
    'mc.test03': machine('test03', 'T-03', false, 10),
  },
  tasks: {
    'task.test_spc': {
      id: 'task.test_spc',
      title: 't.test.task',
      location: 'loc.test_bay',
      hotspot: 'hs.test_tool',
      action: { kind: 'minigame', minigame: 'mg.spc', preset: 'basic' },
      staminaCost: 0,
      autoCompletable: true,
    },
  },
  flags: {
    'flag.test_switch': runFlag('Free switch for unit tests'),
    'flag.test_onboarded': runFlag('Set by the test resume at the start of a run'),
    'flag.sys_bonded_help_azhe': runFlag('Azhe has already taken a blame for the player'),
    'flag.sys_bonded_help_meiling': runFlag('Meiling has already taken a blame for the player'),
    'flag.sys_stop_sequence_active': runFlag('The stop-sequence modifier is currently active'),
  },
  counters: {
    'cnt.test_tally': 'Free counter for unit tests',
    'cnt.wip_pressure': 'WIP pressure of the line',
    'cnt.sys_exercise_bonus': 'Accumulated exercise stamina bonus',
  },
  text: TEXT,
};

export interface TestStateOverrides {
  stats?: Partial<Record<StatId, number>>;
  /** FlagId／CounterId 是模板字面索引，本來就允許只給一部分鍵；不要包 Partial，否則值會帶 undefined */
  flags?: Record<FlagId, boolean>;
  counters?: Record<CounterId, number>;
}

export function buildTestState(overrides: TestStateOverrides = {}): GameState {
  const base = createNewGame(
    { name: '測試員', pronoun: 'neutral', resume: 'res.test', look: 'a' },
    testContent,
    TEST_SEED,
  );
  return {
    ...base,
    stats: { ...base.stats, ...overrides.stats },
    flags: { ...base.flags, ...overrides.flags },
    counters: { ...base.counters, ...overrides.counters },
  };
}

/** 小遊戲單元測試共用（03 §2.9）：第三章、不疲勞、不壓力、無容錯與修正、體力 80、專業 40、人情 2 */
export function minigameContextFor(overrides: Partial<MinigameContext> = {}): MinigameContext {
  return {
    chapter: 'ch3',
    fatigued: false,
    stressed: false,
    tolerance: 0,
    difficultyOffset: 0,
    seed: TEST_SEED,
    stamina: 80,
    skill: 40,
    favor: 2,
    ...overrides,
  };
}

/** 在測試裡取 Record 的值；不存在就丟 Error（noUncheckedIndexedAccess 下取代 `!`） */
export function defined<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Expected a defined value: label=${label}`);
  }
  return value;
}

/** 只覆寫最上層欄位的內容副本 */
export function contentWith(patch: Partial<ContentBundle>): ContentBundle {
  return { ...testContent, ...patch };
}

export function createFakeTextureFactory(): CanvasTextureFactory & { readonly created: readonly Texture[] } {
  const created: Texture[] = [];
  const make = (name: string): Texture => {
    const texture = new Texture();
    texture.name = name;
    created.push(texture);
    return texture;
  };
  return {
    created,
    floor: () => make('floor'),
    wall: () => make('wall'),
    hazard: () => make('hazard'),
    photoSign: () => make('photoSign'),
    screen: (label, status, inverted) => make(`screen:${label}:${status}:${inverted}`),
    sign: (label) => make(`sign:${label}`),
  };
}
