import {
  type CharacterId,
  type ContentBundle,
  type CounterId,
  type FlagId,
  type GameState,
  HIDDEN_STAT_IDS,
  type MachineId,
  type MachineState,
  type PlayerProfile,
  type RelationshipState,
  type StatId,
  type Stats,
  VISIBLE_STAT_IDS,
} from '../model';
import { clockToMinutes, isoToDayIndex } from '../utils/date';
import { InvariantError } from '../utils/errors';

const MAX_SEED = 4294967295;
const STAT_IDS: readonly StatId[] = [...VISIBLE_STAT_IDS, ...HIDDEN_STAT_IDS];

export function createNewGame(profile: PlayerProfile, content: ContentBundle, seed: number): GameState {
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new InvariantError(`Invalid seed: value=${seed}`);
  }
  const resume = content.resumes[profile.resume];
  if (resume === undefined) {
    throw new InvariantError(`Unknown resume: resume=${profile.resume}`);
  }
  const firstChapter = content.campaign.chapters[0];
  if (firstChapter === undefined) {
    throw new InvariantError('Campaign has no chapters');
  }

  const stats = {} as Stats;
  for (const stat of STAT_IDS) {
    stats[stat] = resume.initialStats[stat] ?? content.stats[stat].initial;
  }

  const relationships: Record<CharacterId, RelationshipState> = {};
  for (const character of Object.values(content.characters)) {
    if (!character.isDirectBoss) {
      relationships[character.id] = {
        affinity: character.initialAffinity + (resume.initialAffinity[character.id] ?? 0),
        lastInteractionDay: null,
        coordinateWaiverUsedIn: null,
      };
    }
  }

  const flags: Record<FlagId, boolean> = {};
  for (const flag of resume.initialFlags) {
    flags[flag] = true;
  }

  const counters: Record<CounterId, number> = { 'cnt.wip_pressure': content.balance.wip.initial };

  const machines: Record<MachineId, MachineState> = {};
  for (const machine of Object.values(content.machines)) {
    machines[machine.id] = { health: machine.initialHealth };
  }

  const startKeyDay = Object.values(content.keyDays).find((keyDay) => keyDay.date === content.campaign.startDate);
  const rank = content.ranks.Q1;

  return {
    runId: `run-${seed}`,
    seed,
    rngState: seed,
    player: profile,
    time: {
      dayIndex: isoToDayIndex(content.campaign.startDate),
      minuteOfDay: clockToMinutes(content.balance.sleep.wakeAt),
      chapter: firstChapter.id,
      keyDaysPlayed: 0,
      currentKeyDay: startKeyDay === undefined ? null : { id: startKeyDay.id, kind: startKeyDay.kind },
    },
    flow: { kind: 'keyDay', phase: 'wake' },
    stats,
    modifiers: [],
    relationships,
    career: {
      rank: 'Q1',
      monthlySalary: rank.monthlySalary,
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
    // 02 §7.6：通勤與孝親金的預設
    economy: {
      housing: 'dorm',
      housingSinceDay: 0,
      commute: 'shuttle',
      filialAmount: 10000,
      monthLedger: [],
      payslips: [],
      totalIncome: 0,
    },
    flags,
    counters,
    machines,
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
    choiceTally: {
      endure: 0,
      refuse: 0,
      coordinate: 0,
      shiftBlame: 0,
      please: 0,
      slack: 0,
      evidence: 0,
      escalate: 0,
      playDumb: 0,
      outburst: 0,
      expertise: 0,
      silence: 0,
    },
    policy: null,
    phone: { messages: [] },
    location: null,
    runStats: { overtimeHours: 0, wokenUpCount: 0, onTimeLeaves: 0 },
    interaction: null,
    endingResult: null,
  };
}
