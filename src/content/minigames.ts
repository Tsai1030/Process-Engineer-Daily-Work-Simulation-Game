import type {
  HoldLotCaseDef,
  HoldLotCaseId,
  HoldLotMeasurementDef,
  HoldLotNote,
  MinigameContentMap,
  OnCallScenarioId,
  TextId,
} from '../model';

const ALL_RULES = ['beyond3Sigma', 'run7', 'trend6', 'twoOfThree2Sigma'] as const;

// TODO #1 Stage 3 依 03 §5.5、§6.4 填入量測列、留言與逐句台詞
const PENDING_NOTE: HoldLotNote = { from: 'technician', text: 't.mg.hold_lot.note.pending', misleading: false };
const HOLD_LOT_MEASUREMENTS: Readonly<Record<HoldLotCaseId, readonly HoldLotMeasurementDef[]>> = {
  flier: [],
  adiCdHigh: [],
  underEtch: [],
  overEtch: [],
  partialChamber: [],
  unknownDefect: [],
};
const HOLD_LOT_NOTES: Readonly<Record<HoldLotCaseId, HoldLotCaseDef['notes']>> = {
  flier: { helpful: PENDING_NOTE, neutral: PENDING_NOTE, misleading: null },
  adiCdHigh: { helpful: PENDING_NOTE, neutral: PENDING_NOTE, misleading: null },
  underEtch: { helpful: PENDING_NOTE, neutral: PENDING_NOTE, misleading: null },
  overEtch: { helpful: PENDING_NOTE, neutral: PENDING_NOTE, misleading: null },
  partialChamber: { helpful: PENDING_NOTE, neutral: PENDING_NOTE, misleading: null },
  unknownDefect: { helpful: PENDING_NOTE, neutral: PENDING_NOTE, misleading: null },
};
const ONCALL_TRANSCRIPTS: Readonly<Record<OnCallScenarioId, readonly { text: TextId; key: boolean }[]>> = {
  chamberPressure: [],
  particleHigh: [],
  rfReflected: [],
  robotStuck: [],
  epdMiss: [],
};

export const minigames: MinigameContentMap = {
  'mg.gowning': {
    // CR-3：時段進入點依章節選預設組；flag.gowning_tutorial_done 為假時一律用 'tutorial'
    chapterDefaults: { prologue: 'dailyCh1', ch1: 'dailyCh1', ch2: 'dailyCh2', ch3: 'dailyCh3' },
    presets: {
      tutorial: { params: { mode: 'tutorial', variants: [], timeLimitSec: 90 }, gameMinutes: 15, staminaCost: 0 },
      dailyCh1: { params: { mode: 'qte', variants: [], timeLimitSec: 10 }, gameMinutes: 15, staminaCost: 0 },
      dailyCh2: {
        params: { mode: 'qte', variants: ['wrongGloveSize'], timeLimitSec: 12 },
        gameMinutes: 15,
        staminaCost: 0,
      },
      dailyCh3: {
        params: { mode: 'qte', variants: ['tornSuit', 'wrongGloveSize'], timeLimitSec: 13 },
        gameMinutes: 15,
        staminaCost: 0,
      },
      regown: { params: { mode: 'qte', variants: [], timeLimitSec: 10 }, gameMinutes: 15, staminaCost: 2 },
    },
    rules: null,
  },
  'mg.spc': {
    presets: {
      tutorial: {
        params: {
          variant: 'chart',
          charts: 1,
          rules: ['beyond3Sigma'],
          pointIntervalMs: 800,
          noise: 0,
          durationSec: 40,
          tutorial: true,
        },
        gameMinutes: 30,
        staminaCost: 3,
      },
      ch2: {
        params: {
          variant: 'chart',
          charts: 1,
          rules: ['beyond3Sigma', 'run7'],
          pointIntervalMs: 800,
          noise: 0.15,
          durationSec: 40,
          tutorial: false,
        },
        gameMinutes: 30,
        staminaCost: 4,
      },
      certification: {
        params: {
          variant: 'chart',
          charts: 1,
          rules: ['beyond3Sigma', 'run7'],
          pointIntervalMs: 800,
          noise: 0.2,
          durationSec: 50,
          tutorial: false,
        },
        gameMinutes: 30,
        staminaCost: 4,
      },
      ch3: {
        params: {
          variant: 'chart',
          charts: 1,
          rules: ALL_RULES,
          pointIntervalMs: 800,
          noise: 0.4,
          durationSec: 40,
          tutorial: false,
        },
        gameMinutes: 30,
        staminaCost: 5,
      },
      logTraceShort: {
        params: {
          variant: 'logTrace',
          charts: 3,
          rules: [],
          pointIntervalMs: 0,
          noise: 0.3,
          durationSec: 75,
          tutorial: false,
        },
        gameMinutes: 5,
        staminaCost: 0,
      },
    },
    // OCAP 小卡（§4.6）：業界審核項目
    rules: {
      ocap: {
        byRule: { beyond3Sigma: 'holdLot', run7: 'holdTool', trend6: 'holdTool', twoOfThree2Sigma: 'monitor' },
        afterOos: 'holdTool',
      },
    },
  },
  'mg.hold_lot': {
    presets: {
      tutorial: {
        params: { cards: 1, ambiguity: 0, qTimePressure: false, tutorial: true, consult: false },
        gameMinutes: 15,
        staminaCost: 3,
      },
      ch2: {
        params: { cards: 1, ambiguity: 0, qTimePressure: true, tutorial: false, consult: true },
        gameMinutes: 15,
        staminaCost: 3,
      },
      ch3: {
        params: { cards: 2, ambiguity: 1, qTimePressure: true, tutorial: false, consult: true },
        gameMinutes: 30,
        staminaCost: 6,
      },
      burstQuake: {
        params: { cards: 3, ambiguity: 1, qTimePressure: true, tutorial: false, consult: true },
        gameMinutes: 45,
        staminaCost: 9,
      },
      burstDuty: {
        params: { cards: 4, ambiguity: 2, qTimePressure: true, tutorial: false, consult: true },
        gameMinutes: 60,
        staminaCost: 12,
      },
    },
    // Hold Lot 案例（§5.5、§5.6）：業界審核項目（蝕刻不可逆：ADI 可重工、AEI 不足可補蝕、過蝕只能報廢）
    rules: {
      tutorialCase: 'adiCdHigh',
      cases: {
        flier: {
          stage: 'AEI',
          minAmbiguity: 0,
          station: 't.mg.hold_lot.station.aei',
          description: 't.mg.hold_lot.case.flier',
          measurements: HOLD_LOT_MEASUREMENTS.flier,
          waferPattern: 'allOk',
          qTimeMinutes: [120, 300],
          payoffs: { release: 100, rework: 0, scrap: 0, split: 30, fa: 50 },
          releaseIsBad: false,
          scrapIsOver: true,
          notes: HOLD_LOT_NOTES.flier,
        },
        adiCdHigh: {
          stage: 'ADI',
          minAmbiguity: 0,
          station: 't.mg.hold_lot.station.adi',
          description: 't.mg.hold_lot.case.adi_cd_high',
          measurements: HOLD_LOT_MEASUREMENTS.adiCdHigh,
          waferPattern: 'allBad',
          qTimeMinutes: [150, 300],
          payoffs: { release: 0, rework: 100, scrap: 0, split: 20, fa: 40 },
          releaseIsBad: true,
          scrapIsOver: true,
          notes: HOLD_LOT_NOTES.adiCdHigh,
        },
        underEtch: {
          stage: 'AEI',
          minAmbiguity: 0,
          station: 't.mg.hold_lot.station.aei',
          description: 't.mg.hold_lot.case.under_etch',
          measurements: HOLD_LOT_MEASUREMENTS.underEtch,
          waferPattern: 'allBad',
          qTimeMinutes: [90, 200],
          payoffs: { release: 0, rework: 100, scrap: 20, split: 30, fa: 50 },
          releaseIsBad: true,
          scrapIsOver: true,
          notes: HOLD_LOT_NOTES.underEtch,
        },
        overEtch: {
          stage: 'AEI',
          minAmbiguity: 0,
          station: 't.mg.hold_lot.station.aei',
          description: 't.mg.hold_lot.case.over_etch',
          measurements: HOLD_LOT_MEASUREMENTS.overEtch,
          waferPattern: 'allBad',
          qTimeMinutes: [60, 240],
          payoffs: { release: 0, rework: 0, scrap: 100, split: 20, fa: 60 },
          releaseIsBad: true,
          scrapIsOver: false,
          notes: HOLD_LOT_NOTES.overEtch,
        },
        partialChamber: {
          stage: 'AEI',
          minAmbiguity: 1,
          station: 't.mg.hold_lot.station.aei',
          description: 't.mg.hold_lot.case.partial_chamber',
          measurements: HOLD_LOT_MEASUREMENTS.partialChamber,
          waferPattern: 'everyFourth',
          qTimeMinutes: [120, 300],
          payoffs: { release: 0, rework: 0, scrap: 30, split: 100, fa: 60 },
          releaseIsBad: true,
          scrapIsOver: true,
          notes: HOLD_LOT_NOTES.partialChamber,
        },
        unknownDefect: {
          stage: 'AEI',
          minAmbiguity: 1,
          station: 't.mg.hold_lot.station.aei',
          description: 't.mg.hold_lot.case.unknown_defect',
          measurements: HOLD_LOT_MEASUREMENTS.unknownDefect,
          waferPattern: 'scattered',
          qTimeMinutes: [280, 480],
          qTimeMinutesAtAmbiguity2: [280, 400],
          payoffs: { release: 0, rework: 10, scrap: 40, split: 50, fa: 100 },
          releaseIsBad: true,
          scrapIsOver: true,
          notes: HOLD_LOT_NOTES.unknownDefect,
        },
      },
    },
  },
  'mg.oncall': {
    // CR-3：sleep 時段的電話依章節選預設組（MVP 只有第三章會響）
    chapterDefaults: { ch3: 'night' },
    presets: {
      drill: {
        params: {
          stepsRequired: 3,
          timeLimitSec: 90,
          blurByStamina: false,
          tutorial: true,
          scenario: 'chamberPressure',
        },
        gameMinutes: 20,
        staminaCost: 2,
      },
      night: {
        params: { stepsRequired: 3, timeLimitSec: 60, blurByStamina: true, tutorial: false, scenario: 'random' },
        gameMinutes: 20,
        staminaCost: 0,
      },
      corridor: {
        params: { stepsRequired: 3, timeLimitSec: 45, blurByStamina: false, tutorial: false, scenario: 'particleHigh' },
        gameMinutes: 15,
        staminaCost: 0,
      },
    },
    // 半夜電話情境（§6.4）：業界審核項目（正確處置順序、危險指令）
    rules: {
      tutorialScenario: 'chamberPressure',
      randomPool: ['chamberPressure', 'particleHigh', 'rfReflected', 'robotStuck', 'epdMiss'],
      neutralCommands: ['waitMorning', 'rebootTool'],
      scenarios: {
        chamberPressure: {
          machine: 'mc.et03',
          transcript: ONCALL_TRANSCRIPTS.chamberPressure,
          correct: ['checkAlarm', 'abortWafer', 'holdTool'],
          dangerous: ['resetContinue'],
        },
        particleHigh: {
          machine: 'mc.et04',
          transcript: ONCALL_TRANSCRIPTS.particleHigh,
          correct: ['holdTool', 'holdLots', 'runMonitor'],
          dangerous: ['releaseContinue', 'seasoningRelease'],
        },
        rfReflected: {
          machine: 'mc.et05',
          transcript: ONCALL_TRANSCRIPTS.rfReflected,
          correct: ['stopLoad', 'checkMatch', 'callEE'],
          dangerous: ['resetContinue'],
        },
        robotStuck: {
          machine: 'mc.et06',
          transcript: ONCALL_TRANSCRIPTS.robotStuck,
          correct: ['dontTouch', 'holdTool', 'callEE'],
          dangerous: ['manualRemove'],
        },
        epdMiss: {
          machine: 'mc.et04',
          transcript: ONCALL_TRANSCRIPTS.epdMiss,
          correct: ['holdLot', 'measureDepth', 'holdTool'],
          dangerous: ['switchTimeMode'],
        },
      },
    },
  },
};
