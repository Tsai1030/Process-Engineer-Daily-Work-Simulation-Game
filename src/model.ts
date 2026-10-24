// src/model.ts — 統一資料模型（對映 CLAUDE.md 的 model.py）

/* ================================================================
 * 1. 識別碼（模板字面型別，防止不同種類的 ID 混用；命名規則見 §8.3）
 * ================================================================ */
export type EventId = `ev.${string}`;
export type CharacterId = `chr.${string}`;
export type FlagId = `flag.${string}`;
export type CounterId = `cnt.${string}`;
export type SeedId = `seed.${string}`;
export type EndingId = `end.${string}`;
export type TextId = `t.${string}`;
export type LocationId = `loc.${string}`;
export type SceneId = `scn.${string}`;
export type HotspotId = `hs.${string}`;
export type MachineId = `mc.${string}`;
export type TaskId = `task.${string}`;
export type KeyDayId = `kd.${string}`;
export type LifeActionId = `act.${string}`;
export type ResumeId = `res.${string}`;
export type ModifierId = `mod.${string}`;
export type PhoneThreadId = `thread.${string}`;
/** 事件內的局部 ID：節點 n_xxx、選項 c_xxx */
export type NodeId = string;
export type ChoiceId = string;
/** 'YYYY-MM-DD' */
export type IsoDate = string;
/** 'HH:MM'（24 小時制） */
export type ClockTime = string;

export type ChapterId = 'prologue' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'finale';
export type Pronoun = 'he' | 'she' | 'neutral';

/* ================================================================
 * 2. 數值（GDD §4：可見 6 項／半可見／隱藏 9 項）
 * ================================================================ */
export const VISIBLE_STAT_IDS = ['stamina', 'mind', 'skill', 'bossFavor', 'favor', 'money'] as const;
export const HIDDEN_STAT_IDS = [
  'healthDebt',
  'blame',
  'scheming',
  'conscience',
  'lifeSatisfaction',
  'network',
  'visibility',
  'goldenHandcuffs',
  'evidence',
] as const;
/** 體力、精神、專業、主管好感、同事人情（0～5 枚）、存款（NT$，可為負） */
export type VisibleStatId = (typeof VISIBLE_STAT_IDS)[number];
/** 健康債、背鍋值、心機、良心、生活滿足、人脈網、能見度、金手銬、證據包 */
export type HiddenStatId = (typeof HIDDEN_STAT_IDS)[number];
export type StatId = VisibleStatId | HiddenStatId;
export type Stats = Record<StatId, number>;

export interface StatRule {
  min: number | null;
  /** 'maxStamina'＝依 GDD §4.4 衍生公式動態計算 */
  max: number | 'maxStamina' | null;
  initial: number;
  visibility: 'visible' | 'hidden';
  /** true：套用後四捨五入成整數（人情、存款、金手銬、證據） */
  integer: boolean;
  /** HUD「危」的門檻（GDD §4.1：35） */
  lowLine: number | null;
  /** 超過上限時的溢出轉換（GDD §4.1：人情溢出 → 人脈網 +3／枚） */
  overflowTo: { stat: StatId; perUnit: number } | null;
}

/** 半可見數值：不直接顯示數字，由 core/selectors.ts 衍生 */
export type AffinityTier = 'hostile' | 'cold' | 'neutral' | 'trusted' | 'bonded';
export type ReviewWind = 'smile' | 'flat' | 'frown';
/** 燈號：run 綠、warn 黃（注意，GDD §4.2）、down 紅；門檻在 balance.machines（02 §1.10） */
export type MachineStatus = 'run' | 'warn' | 'down';
export type PresentationMood = 'normal' | 'low' | 'warning' | 'calm';

/* ================================================================
 * 3. 時間（GDD §2.2、§2.6、§3）
 * ================================================================ */
/** 關鍵日的時段；KeyDayDef.phases 決定當天實際走哪些 */
export type DayPhase = 'wake' | 'commute' | 'gowning' | 'briefing' | 'shift' | 'clockOut' | 'evening' | 'sleep';
export type KeyDayKind = 'scripted' | 'conditional' | 'character' | 'interrupt';
export type FastForwardGranularity = 'week' | 'month';

export interface TimeState {
  /** 0 ＝ 2027-03-01（星期一）。「入職第 N 天」＝ dayIndex + 1 */
  dayIndex: number;
  /** 0～1439 */
  minuteOfDay: number;
  chapter: ChapterId;
  keyDaysPlayed: number;
  currentKeyDay: { id: KeyDayId; kind: KeyDayKind } | null;
}

/** 事件與伏筆的求值時機 */
export type Checkpoint =
  | 'dayStart'
  | 'wake'
  | 'commute'
  | 'briefing'
  | 'shiftStart'
  | 'clock'
  | 'location'
  | 'clockOut'
  | 'evening'
  | 'sleep'
  | 'fastForwardSegment'
  | 'monthEnd'
  | 'review'
  | 'afterEffects';

export interface DateWindow {
  from: IsoDate;
  to: IsoDate;
}

/* ================================================================
 * 4. 條件與數值運算式（可序列化；求值器見 §5.3）
 * ================================================================ */
export type Cmp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
export type RankId = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5';
export type Grade = 'P' | 'M+' | 'M' | 'M-' | 'D' | 'X';
export type ReviewKind = 'probation' | 'midYear' | 'annual';
export type ProbationStatus = 'pending' | 'passed' | 'retakePending' | 'failed';

export type Condition =
  | { all: readonly Condition[] }
  | { any: readonly Condition[] }
  | { not: Condition }
  | { stat: StatId; cmp: Cmp; value: number }
  | { affinity: CharacterId; cmp: Cmp; value: number }
  | { affinityTier: CharacterId; atLeast: AffinityTier }
  | { flag: FlagId; is?: boolean }
  | { counter: CounterId; cmp: Cmp; value: number }
  | { dateBetween: DateWindow }
  | { timeBetween: { from: ClockTime; to: ClockTime } }
  | { weekdayIn: readonly (0 | 1 | 2 | 3 | 4 | 5 | 6)[] }
  | { chapterIn: readonly ChapterId[] }
  | { resume: ResumeId }
  | { pronoun: Pronoun }
  | { rank: RankId; cmp: Cmp }
  | { lastReview: ReviewKind; gradeIn: readonly Grade[] }
  | { probation: ProbationStatus }
  | { eventSeen: EventId }
  | { choiceMade: { event: EventId; choice: ChoiceId } }
  | { machine: MachineId; cmp: Cmp; value: number }
  | { location: LocationId }
  | { windPeriod: boolean }
  | { onCallTonight: boolean }
  | { expr: NumExpr; cmp: Cmp; value: number };

export type NumExpr =
  | number
  | { stat: StatId }
  | { affinityOf: CharacterId }
  | { counterOf: CounterId }
  | { machineHealth: MachineId }
  | { ownedMachineHealthAvg: true }
  | { sum: readonly NumExpr[] }
  | { product: readonly NumExpr[] }
  | { min: readonly NumExpr[] }
  | { max: readonly NumExpr[] }
  | { clamp: NumExpr; lo: number; hi: number }
  | { if: Condition; then: NumExpr; else: NumExpr };

/* ================================================================
 * 5. 效果（可序列化；求值器見 §5.3）
 * ================================================================ */
export type Effect =
  | { op: 'stat'; stat: StatId; delta: NumExpr }
  | { op: 'setStat'; stat: StatId; value: NumExpr }
  | { op: 'affinity'; character: CharacterId; delta: number }
  | { op: 'flag'; flag: FlagId; value: boolean }
  | { op: 'counter'; counter: CounterId; delta: number }
  | { op: 'machine'; machine: MachineId; healthDelta: number }
  | { op: 'plantSeed'; seed: SeedId }
  | { op: 'cancelSeed'; seed: SeedId }
  | { op: 'blackBook'; entry: BlackBookEntryDef }
  | { op: 'modifier'; modifier: ModifierDef }
  /** 'today' 在今天沒有 shift、shift 已結束或快轉中時自動改成 'nextKeyDay'（02 §6.8） */
  | { op: 'addTask'; task: TaskId; when: 'today' | 'nextKeyDay' }
  | { op: 'advanceTime'; minutes: number }
  /** 改寫 EconomyState（02 §7.6）；改住處當天收新住處第 1 個月房租並更新 housingSinceDay */
  | {
      op: 'economy';
      housing?: HousingId;
      commute?: EconomyState['commute'];
      filialAmount?: EconomyState['filialAmount'];
    }
  | { op: 'phone'; thread: PhoneThreadId; message: PhoneMessageDef }
  | { op: 'queueEvent'; event: EventId; when: 'afterCurrent' | 'nextCheckpoint' | 'nextKeyDay' }
  | { op: 'ending'; ending: EndingId }
  | { op: 'when'; if: Condition; then: readonly Effect[]; else?: readonly Effect[] }
  | { op: 'chance'; p: NumExpr; then: readonly Effect[]; else?: readonly Effect[] };

export type ModifierDef =
  | {
      id: ModifierId;
      kind: 'statGain';
      stat: StatId;
      positiveMultiplier: number;
      negativeMultiplier: number;
      durationDays: number | null;
    }
  | { id: ModifierId; kind: 'eventTagWeight'; tag: string; multiplier: number; durationDays: number | null }
  /** offset 正數＝更難；resolveDifficulty() 把加總夾限在 ±2（03 §1.3） */
  | {
      id: ModifierId;
      kind: 'minigameDifficulty';
      minigame: MinigameId | 'all';
      offset: number;
      durationDays: number | null;
    };
export type ActiveModifier = ModifierDef & { appliedDay: number; expiresDay: number | null };

/** 一次效果套用後「實際」變化的量（夾限後），給 UI 浮字與統計 */
export interface StatDelta {
  stat: StatId;
  delta: number;
}

/* ================================================================
 * 6. 事件、選項、節點、伏筆、觸發（GDD §5、§6）
 * ================================================================ */
/** GDD §6.1 代號：X、M、T、C、S、R、m */
export type EventCategory = 'crisis' | 'main' | 'condition' | 'character' | 'seasonal' | 'random' | 'micro';
/** GDD §5.2 的 10 種＋「專業解」＋「沉默」（§16 D19） */
export type ChoiceType =
  | 'endure'
  | 'refuse'
  | 'coordinate'
  | 'shiftBlame'
  | 'please'
  | 'slack'
  | 'evidence'
  | 'escalate'
  | 'playDumb'
  | 'outburst'
  | 'expertise'
  | 'silence';

export type EventTrigger =
  /** 只能由 KeyDayDef.events 排入 */
  | { kind: 'scripted' }
  | { kind: 'condition'; checkpoint: Checkpoint; when: Condition; window?: DateWindow; promotesKeyDay?: boolean }
  | { kind: 'clock'; at: ClockTime; chance: NumExpr; when?: Condition }
  | { kind: 'location'; location: LocationId; firstVisitOnly: boolean; when?: Condition }
  | { kind: 'randomPool'; weight: NumExpr; when?: Condition }
  | { kind: 'micro'; weight: NumExpr; when?: Condition }
  /** 只能由伏筆觸發 */
  | { kind: 'seed' }
  /** 只能由其他事件的 queueEvent 觸發 */
  | { kind: 'sub' };

export interface EventDef {
  id: EventId;
  /** GDD §6.4 事件總表的編號；子事件或補充事件為 null */
  gddRef: number | null;
  category: EventCategory;
  chapters: readonly ChapterId[];
  /** 給修正器與志向權重用，例如 'blame'、'politics'、'overtime' */
  tags: readonly string[];
  trigger: EventTrigger;
  /** 同類別內的次序，數字大者優先，預設 0 */
  priority?: number;
  repeatable: boolean;
  /** 日常隨機事件的冷卻群組；預設等於事件 ID（GDD §6.3：隔 3 個關鍵日） */
  cooldownGroup?: string;
  /** 當天名額滿時的處置 */
  overflow: 'nextKeyDay' | 'micro' | 'drop';
  /** 可以打斷快轉，變成插播關鍵日（危機事件） */
  interruptsFastForward?: boolean;
  /** scene：完整對話演出；micro：手機一鍵選擇 */
  presentation: 'scene' | 'micro';
  /** 主要場景（v1.2 審查回合 1 R1-D：必填；v1.3 N2：班中觸發時若玩家不在此場景，事件以 phone 節點開場、在玩家所在場景演出，§6.4）；只有 presentation 'micro'（手機呈現）可以是 null */
  scene: SceneId | null;
  /** 事件結束後扣除的遊戲時間（對話中時鐘暫停，GDD §2.2） */
  gameMinutes: number;
  start: NodeId;
  nodes: Readonly<Record<NodeId, EventNode>>;
  seeds?: readonly SeedDef[];
  /** GDD §4.6 的平衡檢查設定（§13.5） */
  balance?: { mode: 'core'; choices: readonly ChoiceId[]; waiver?: { reason: string; issue: string } };
  /** P1「這是真的」：出處，例如 '〔WS §2-1〕' */
  sourceRefs: readonly string[];
}

export type Speaker = CharacterId | 'narrator' | 'player' | 'inner';
export interface TextVariant {
  when: Condition;
  text: TextId;
}
export type TextRef = TextId | { variants: readonly TextVariant[]; fallback: TextId };
export interface PortraitRef {
  character: CharacterId;
  expression: string;
}

/** 演出提示：由 render（鏡頭）、ui（特效）、audio 解讀；04 規格書擴充清單 */
export type CameraShotId =
  | 'default'
  | 'puaLowAngle'
  | 'dilemmaSway'
  | 'handheld'
  | 'quake'
  | 'praisePullBack'
  | 'closeUp'
  | 'topDownDesk';
export type ScreenFx =
  | 'speedLines'
  | 'dots'
  | 'alert'
  | 'radialBackdrop'
  | 'desaturate'
  | 'shakeDialog'
  | 'inkBlots'
  /** 被肯定（GDD §12.1，04 §3.5） */
  | 'warmGlow'
  | 'sparkleDots';
/** 04 §10.3 的 20 個音效配方 */
export type SfxId =
  | 'beepAlarm'
  | 'chirp'
  | 'vibrate'
  | 'stamp'
  | 'tsk'
  | 'huh'
  | 'slap'
  | 'heartbeat'
  | 'rumble'
  | 'stingPraise'
  | 'uiTap'
  | 'cardLocked'
  | 'countdownTick'
  | 'pageTurn'
  | 'softRing'
  | 'airShower'
  | 'whoosh'
  | 'ding'
  | 'doorSlide'
  | 'coinPop';
export type BgmMode = 'normal' | 'lowpass' | 'crisis' | 'silent';
export interface StagingCue {
  camera?: CameraShotId;
  fx?: readonly ScreenFx[];
  sfx?: SfxId;
  /** SFX 字卡（例：「嗶——嗶——!!」） */
  sfxCard?: { main: TextId; sub?: TextId };
  bgm?: BgmMode;
}

export interface Choice {
  id: ChoiceId;
  label: TextId;
  type: ChoiceType;
  /** 不符合時顯示為鎖卡（GDD §5.1 介面規則） */
  requires?: Condition;
  /** 鎖卡上的條件說明；簡單數值門檻可省略（自動產生「需要專業 45」） */
  lockedHint?: TextId;
  /** 預設 false：鎖卡也要顯示（重玩動機） */
  hiddenWhenLocked?: boolean;
  effects: readonly Effect[];
  next: NodeId | null;
}

export interface PhoneMessageDef {
  from: Speaker;
  text: TextId;
  kind: 'chat' | 'call' | 'forumPost' | 'system';
}

export type EventNode =
  | { kind: 'line'; speaker: Speaker; text: TextRef; portrait?: PortraitRef; stage?: StagingCue; next: NodeId | null }
  | { kind: 'phone'; thread: PhoneThreadId; messages: readonly PhoneMessageDef[]; next: NodeId | null }
  | {
      kind: 'choice';
      prompt?: TextRef;
      choices: readonly Choice[];
      countdown?: { seconds: number; onTimeout: Choice };
      stage?: StagingCue;
    }
  /** portrait：結果框旁的立繪換表情（04 §9.13，例：範例一「貳」林課長 displeased） */
  | { kind: 'result'; text: TextRef; rumor?: TextId; portrait?: PortraitRef; next: NodeId | null }
  | { kind: 'effects'; effects: readonly Effect[]; next: NodeId | null }
  | { kind: 'branch'; cases: readonly { when: Condition; next: NodeId }[]; otherwise: NodeId }
  | { kind: 'roll'; outcomes: readonly { weight: NumExpr; next: NodeId }[] }
  | {
      kind: 'minigame';
      minigame: MinigameId;
      preset: string;
      next: { success: NodeId; partial?: NodeId; fail: NodeId };
    }
  | { kind: 'end' };

/** 伏筆（GDD §5.3：id、觸發窗口、條件、機率、結果事件） */
export interface SeedDef {
  id: SeedId;
  /** 相對於埋下當天的天數窗口（含兩端） */
  window: { minDays: number; maxDays: number };
  /** 在哪些檢查點求值；包含 'fastForwardSegment' 才能在快轉中觸發 */
  checkpoints: readonly Checkpoint[];
  when?: Condition;
  /** 只擲一次：窗口內第一次「條件成立」的檢查點擲骰，沒中就消失 */
  chance: NumExpr;
  outcome: { event: EventId } | { effects: readonly Effect[] };
  /** 窗口結束時條件都沒成立才套用 */
  onExpire?: readonly Effect[];
  /** 佇列滿 8 個時，最低權重中最舊的先失效 */
  weight: 1 | 2 | 3 | 4 | 5;
}
export interface PendingSeed {
  seed: SeedId;
  /** null＝由小遊戲的 outcome.effects 埋下（例：任務進入的 Hold Lot，03 §5.6）；同 ID 已在佇列時不重複加入（§7.5） */
  sourceEvent: EventId | null;
  plantedDay: number;
  eligibleFromDay: number;
  expiresDay: number;
  weight: number;
}

/** 黑歷史本（GDD §5.3：最多 12 筆，權重 1～5） */
export interface BlackBookEntryDef {
  text: TextId;
  weight: 1 | 2 | 3 | 4 | 5;
  polarity: 'negative' | 'positive';
  /** 考績時才判斷；例：範例一「主管好感 <50 才引用」 */
  citeWhen?: Condition;
}
export interface BlackBookEntry extends BlackBookEntryDef {
  id: string;
  dayIndex: number;
  sourceEvent: EventId;
}

/* ================================================================
 * 7. 角色與關係（GDD §7.4、§7.5）
 * ================================================================ */
/** 便服人物的髮型（04 §6.4） */
export type HairStyle = 'short' | 'slick' | 'spiky' | 'ponytail' | 'curly' | 'perm' | 'long' | 'swept' | 'bob';
export interface CharacterAppearance {
  outfit: 'cleanroom' | 'casual' | 'office';
  skinTone: string;
  hairColor: string;
  hairStyle: HairStyle;
  /** 便服上衣、下身顏色（無塵衣版忽略） */
  topColor: string;
  bottomColor: string;
  /** 無塵衣頭罩上的彩色名牌顏色（GDD §12.2） */
  badgeColor: string;
  heightScale: number;
  glasses: boolean;
  /** 未來換成 glTF 時的資產鍵（Stage 6）；MVP 一律 null */
  modelRef: string | null;
}

export interface CharacterDef {
  id: CharacterId;
  name: TextId;
  role: TextId;
  hasPortrait: boolean;
  /** 立繪表情差分的 ID，例如 'fakeSmileGlare'、'displeased' */
  expressions: readonly string[];
  defaultExpression: string;
  initialAffinity: number;
  /** true：此角色的好感就是 bossFavor（GDD §4.2），不得對他使用 affinity 效果 */
  isDirectBoss: boolean;
  appearance: Readonly<Record<'fab' | 'outside', CharacterAppearance>>;
}

export interface RelationshipState {
  /** −100～100；isDirectBoss 的角色不存這裡，改由 stats.bossFavor 換算 */
  affinity: number;
  lastInteractionDay: number | null;
  /** GDD §7.5：信任段落每章可免一次人情消耗 */
  coordinateWaiverUsedIn: ChapterId | null;
}

/* ================================================================
 * 8. 小遊戲（03 規格書填入各自的 Params；共通介面在本區與「行為契約」區）
 * ================================================================ */
export type WecoRule = 'beyond3Sigma' | 'run7' | 'trend6' | 'twoOfThree2Sigma';
/** 半夜電話的情境（03 §6.4）；#20 的事件台詞指定 particleHigh */
export type OnCallScenarioId = 'chamberPressure' | 'particleHigh' | 'rfReflected' | 'robotStuck' | 'epdMiss';
export interface MinigameParamsMap {
  'mg.gowning': {
    mode: 'tutorial' | 'qte' | 'auto';
    variants: readonly ('tornSuit' | 'wrongGloveSize')[];
    timeLimitSec: number;
  };
  'mg.spc': {
    variant: 'chart' | 'logTrace';
    charts: 1 | 2 | 3;
    rules: readonly WecoRule[];
    pointIntervalMs: number;
    noise: number;
    durationSec: number;
    /** 教學暫停、不扣誤判（03 §4.10） */
    tutorial: boolean;
  };
  'mg.hold_lot': {
    cards: number;
    ambiguity: 0 | 1 | 2;
    qTimePressure: boolean;
    /** 固定教學案例、阿哲講解 */
    tutorial: boolean;
    /** 這一局能不能打給阿哲（另需 context.favor ≥1） */
    consult: boolean;
  };
  'mg.oncall': {
    stepsRequired: number;
    timeLimitSec: number;
    blurByStamina: boolean;
    /** 新訓模擬：不糊字、情境固定 */
    tutorial: boolean;
    scenario: OnCallScenarioId | 'random';
  };
}
export type MinigameId = keyof MinigameParamsMap;

export interface MinigamePreset<K extends MinigameId> {
  params: MinigameParamsMap[K];
  /** 結束後固定扣除的遊戲時間（GDD §8 各節；範例一的偵查變體是 5 分）；本局額外時間見 MinigameOutcome.gameMinutes */
  gameMinutes: number;
  /** 體力成本（02 §1.9 定案）；小遊戲任務的 TaskDef.staminaCost 必須是 0 */
  staminaCost: number;
}
/*
 * v1.2（審查回合 1 R1-B）：需要業界審核的領域資料（OCAP 小卡、Hold Lot 案例、半夜電話的情境／正確順序／危險指令）
 * 是內容資料，放在 content/minigames.ts 的 rules；core/minigames/ 不得寫死。審核後的修改只動內容（與引用真實內容的測試期望值）。
 */
export interface SpcOcapRules {
  /** OCAP 小卡：每條違規的正確處置（03 §4.6） */
  byRule: Readonly<Record<WecoRule, SpcOcapAction>>;
  /** 已經 OOS 時，不論哪種違規的正確處置 */
  afterOos: SpcOcapAction;
}
export interface HoldLotMeasurementDef {
  label: TextId;
  unit: string;
  /** uniform 抽樣範圍；null＝文字說明列（例：「異常片都在 chamber B」），value 記 0、UI 只顯示 label */
  range: readonly [number, number] | null;
  specLow: number | null;
  specHigh: number | null;
  status: 'ok' | 'ooc' | 'oos';
  /** true：只在 ambiguity 0 顯示 */
  ambiguity0Only: boolean;
}
export interface HoldLotCaseDef {
  stage: 'ADI' | 'AEI';
  /** ambiguity ≥ 此值時才進入案例池（03 §5.5） */
  minAmbiguity: 0 | 1 | 2;
  station: TextId;
  description: TextId;
  measurements: readonly HoldLotMeasurementDef[];
  waferPattern: 'allOk' | 'allBad' | 'everyFourth' | 'scattered';
  qTimeMinutes: readonly [number, number];
  /** ambiguity 2 的 Q-time 範圍；省略＝同 qTimeMinutes */
  qTimeMinutesAtAmbiguity2?: readonly [number, number];
  /** 每種處置的價值 0～100；恰好一個 100（最佳處置） */
  payoffs: Readonly<Record<HoldLotDisposition, number>>;
  /** 放行這個案例算「錯誤放行」 */
  releaseIsBad: boolean;
  /** 報廢這個案例算「過度報廢」 */
  scrapIsOver: boolean;
  notes: { helpful: HoldLotNote; neutral: HoldLotNote; misleading: HoldLotNote | null };
}
export interface OnCallScenarioDef {
  machine: MachineId;
  transcript: readonly { text: TextId; key: boolean }[];
  /** 正確順序；長度必須等於使用它的預設組的 stepsRequired */
  correct: readonly OnCallCommandId[];
  dangerous: readonly OnCallCommandId[];
}
export interface MinigameRulesMap {
  /** 著裝順序屬於遊戲規則，不在審核清單（03 §3.4 GOWN_ORDER） */
  'mg.gowning': null;
  'mg.spc': { ocap: SpcOcapRules };
  'mg.hold_lot': { cases: Readonly<Record<HoldLotCaseId, HoldLotCaseDef>>; tutorialCase: HoldLotCaseId };
  'mg.oncall': {
    scenarios: Readonly<Record<OnCallScenarioId, OnCallScenarioDef>>;
    /** params.scenario 是 'random' 時依此陣列抽 */
    randomPool: readonly OnCallScenarioId[];
    tutorialScenario: OnCallScenarioId;
    /** 填充用的中性指令 */
    neutralCommands: readonly OnCallCommandId[];
  };
}
export interface MinigameContent<K extends MinigameId> {
  presets: Readonly<Record<string, MinigamePreset<K>>>;
  /** 時段進入點（著裝、半夜電話）依章節選的預設組（03 §2.4） */
  chapterDefaults?: Partial<Record<ChapterId, string>>;
  /** v1.2 R1-B：領域資料；minigame_host 交給 MinigameLogic.create() */
  rules: MinigameRulesMap[K];
}
export type MinigameContentMap = { [K in MinigameId]: MinigameContent<K> };

export interface MinigameContext {
  chapter: ChapterId;
  /** 體力 ≤20（GDD §8 共通規則） */
  fatigued: boolean;
  /** 精神 ≤35 */
  stressed: boolean;
  /** 履歷等帶來的容錯加成（例：技術員轉職 SPC +1） */
  tolerance: number;
  /** 修正器加總（正數＝更難） */
  difficultyOffset: number;
  /** 由主 RNG 分出的種子；小遊戲內部的隨機不影響主序列 */
  seed: number;
  /** 開局當下的體力（半夜電話的糊字比例，GDD §8.12） */
  stamina: number;
  /** 開局當下的專業（完整版 Recipe 的 DOE 輔助門檻） */
  skill: number;
  /** 開局當下的同事人情枚數（Hold Lot「打給阿哲」需要 ≥1） */
  favor: number;
}

export type MinigameAction<I> = { type: 'tick'; dtMs: number } | { type: 'input'; input: I };

export interface MinigameOutcome {
  minigame: MinigameId;
  /** 0～100 整數，計入 KPI（GDD §4.4；權重與排除清單見 02 §1.9） */
  score: number;
  result: 'success' | 'partial' | 'fail';
  /** 本局**額外**消耗的遊戲分鐘；core 扣除 preset.gameMinutes ＋ outcome.gameMinutes（例：退回重穿 +10、我進去看 +90） */
  gameMinutes: number;
  /**
   * 小遊戲機制本身的效果（旗標、計數器、伏筆）；**不含** op: 'stat'。
   * 數值變化由 02 的 deriveMinigameEffects(outcome, context) 從 facts 換算（core/minigame_rewards.ts）
   */
  effects: readonly Effect[];
  /** 給換算、事件分支與統計用的事實，鍵表見 03 各節 X.6；教學局一律帶 tutorial: true（著裝用 mode） */
  facts: Readonly<Record<string, number | boolean | string>>;
}

/* ---- 8a. 各小遊戲的 State／Input（03 §3.4、§4.4、§5.4、§6.4；純資料，ui/minigames 依此畫面與送輸入） ---- */
export type GownItem = 'mask' | 'hairNet' | 'hood' | 'boots' | 'suit' | 'gloves';
export type GownDecoy = 'streetShoes' | 'jacket';
export type GloveAction = 'wearAnyway' | 'doubleGlove' | 'swapToM';
export type SuitRegion = 'leftSleeve' | 'rightSleeve' | 'chest' | 'back' | 'leftLeg' | 'rightLeg';
export type GowningPrompt =
  /** 已穿 step 件，問下一件 */
  | { kind: 'nextItem'; step: number; options: readonly (GownItem | GownDecoy)[]; correct: number; windowMs: number }
  /** 拿到的手套盒尺寸不對（主角固定 M） */
  | { kind: 'gloveSize'; boxSize: 'S' | 'L'; options: readonly GloveAction[]; correct: number; windowMs: number }
  /** 6 個區域中有一處破洞 */
  | { kind: 'tornSuit'; options: readonly SuitRegion[]; correct: number; windowMs: number }
  | { kind: 'airShower'; requiredMs: number; windowMs: number };
export interface GowningState {
  mode: 'tutorial' | 'qte' | 'auto';
  phase: 'dressing' | 'airShower' | 'prompt' | 'done';
  shelf: readonly GownItem[];
  worn: number;
  stepMistaken: boolean;
  prompts: readonly GowningPrompt[];
  promptIndex: number;
  promptElapsedMs: number;
  handsUp: boolean;
  spinCreditDeg: number;
  showerProgressMs: number;
  showerRequiredMs: number;
  mistakes: number;
  particleBumps: readonly number[];
  tornSuit: 'none' | 'found' | 'missed';
  gloveSize: 'none' | 'correct' | 'wrong';
  reGowned: boolean;
  elapsedMs: number;
  softLimitMs: number;
  staleInputs: number;
}
export type GowningInput =
  | { kind: 'pick'; item: GownItem }
  | { kind: 'answer'; option: number }
  | { kind: 'hands'; up: boolean }
  /** 角度絕對值（≥0、有限值） */
  | { kind: 'spin'; degrees: number };

export type SpcOcapAction = 'holdLot' | 'holdTool' | 'monitor';
export type SpcTiming = 'timely' | 'late' | 'afterOos' | 'missed';
export interface SpcAnomaly {
  id: number;
  rule: WecoRule;
  start: number;
  detectIndex: number;
  oosIndex: number;
  ocap: SpcOcapAction;
}
export interface SpcChart {
  label: TextId;
  unit: string;
  machine: MachineId;
  mean: number;
  sigma: number;
  /** 全部點（含歷史點），單位是 σ */
  z: readonly number[];
  anomalies: readonly SpcAnomaly[];
}
export interface SpcFlag {
  chart: number;
  index: number;
  atIndex: number;
  rule: WecoRule;
  ocap: SpcOcapAction;
  /** null＝誤判 */
  anomalyId: number | null;
  timing: SpcTiming | null;
  ruleCorrect: boolean;
  ocapCorrect: boolean;
}
export interface SpcGhost {
  id: number;
  chart: number;
  showAtMs: number;
  hideAtMs: number;
  z: number;
}
export interface SpcChartState {
  variant: 'chart';
  tutorial: boolean;
  rules: readonly WecoRule[];
  /** v1.2 R1-B：create() 從 MinigameRulesMap['mg.spc'] 複製；送出判定與 OCAP 小卡顯示都讀這裡 */
  ocap: SpcOcapRules;
  charts: readonly SpcChart[];
  historyCount: number;
  totalPoints: number;
  intervalMs: number;
  catchWindow: number;
  scrollMs: number;
  emitted: number;
  pending: { chart: number; index: number; atIndex: number; rule: WecoRule | null } | null;
  flags: readonly SpcFlag[];
  lostAnomalyIds: readonly number[];
  ghosts: readonly SpcGhost[];
  ghostFlags: number;
  falseFlags: number;
  tutorialHold: boolean;
  phase: 'running' | 'done';
  staleInputs: number;
}
export type LogTraceDiagnosis = 'gaugeDrift' | 'chamberLeak' | 'mfcUnstable';
export interface LogTraceChannel {
  label: TextId;
  unit: string;
  values: readonly number[];
}
export interface SpcLogTraceState {
  variant: 'logTrace';
  tutorial: boolean;
  channels: readonly LogTraceChannel[];
  truth: LogTraceDiagnosis;
  truthWindow: { from: number; to: number };
  decoyWindow: { from: number; to: number } | null;
  step: 'mark' | 'crossCheck' | 'diagnose' | 'done';
  marked: { from: number; to: number } | null;
  crossChecks: readonly (boolean | null)[];
  diagnosis: LogTraceDiagnosis | null;
  elapsedMs: number;
  limitMs: number;
  staleInputs: number;
}
export type SpcState = SpcChartState | SpcLogTraceState;
export type SpcInput =
  | { kind: 'select'; chart: number; index: number }
  | { kind: 'selectGhost'; ghost: number }
  | { kind: 'classify'; rule: WecoRule }
  | { kind: 'ocap'; action: SpcOcapAction }
  | { kind: 'cancel' }
  | { kind: 'markWindow'; from: number; to: number }
  | { kind: 'crossCheck'; channel: 1 | 2; follows: boolean }
  | { kind: 'diagnose'; diagnosis: LogTraceDiagnosis };

export type HoldLotCaseId = 'flier' | 'adiCdHigh' | 'underEtch' | 'overEtch' | 'partialChamber' | 'unknownDefect';
export type HoldLotDisposition = 'release' | 'rework' | 'scrap' | 'split' | 'fa';
export type HoldLotPriority = 'hot' | 'normal' | 'engineering';
export type WaferMark = 'ok' | 'bad' | 'unknown';
export interface HoldLotMeasurement {
  label: TextId;
  value: number;
  unit: string;
  specLow: number | null;
  specHigh: number | null;
  status: 'ok' | 'ooc' | 'oos';
}
export interface HoldLotNote {
  from: 'technician' | 'mfg' | 'customer';
  text: TextId;
  misleading: boolean;
}
export interface HoldLotCard {
  /** 例 'QJ27A0193'（純顯示，不是 ID 型別） */
  lotId: string;
  caseId: HoldLotCaseId;
  machine: MachineId;
  stage: 'ADI' | 'AEI';
  station: TextId;
  description: TextId;
  measurements: readonly HoldLotMeasurement[];
  /** 25 片 */
  waferMap: readonly WaferMark[];
  qTimeMinutes: number;
  priority: HoldLotPriority;
  notes: readonly HoldLotNote[];
}
export interface HoldLotDecision {
  lotId: string;
  caseId: HoldLotCaseId;
  chosen: HoldLotDisposition | null;
  effective: HoldLotDisposition;
  value: number;
  badRelease: boolean;
  overScrap: boolean;
  qTimeExpired: boolean;
}
export interface HoldLotState {
  tutorial: boolean;
  consultAllowed: boolean;
  qTimePressure: boolean;
  cards: readonly HoldLotCard[];
  /** v1.2 R1-B：create() 從 MinigameRulesMap['mg.hold_lot'].cases 複製；判定與阿哲的建議讀這裡（UI 不得顯示） */
  caseRules: Readonly<Record<HoldLotCaseId, HoldLotCaseDef>>;
  current: number;
  qTimeLeftMs: number;
  msPerQMinute: number;
  decisions: readonly HoldLotDecision[];
  consultUsed: boolean;
  consultHint: { card: number; disposition: HoldLotDisposition } | null;
  phase: 'deciding' | 'done';
  elapsedMs: number;
  staleInputs: number;
}
export type HoldLotInput = { kind: 'decide'; disposition: HoldLotDisposition } | { kind: 'consult' };

export type OnCallCommandId =
  | 'checkAlarm'
  | 'abortWafer'
  | 'holdTool'
  | 'holdLots'
  | 'holdLot'
  | 'runMonitor'
  | 'stopLoad'
  | 'checkMatch'
  | 'callEE'
  | 'dontTouch'
  | 'measureDepth'
  | 'waitMorning'
  | 'rebootTool'
  | 'resetContinue'
  | 'releaseContinue'
  | 'seasoningRelease'
  | 'manualRemove'
  | 'switchTimeMode';
export interface OnCallLine {
  text: TextId;
  key: boolean;
  blurred: boolean;
}
export interface OnCallState {
  tutorial: boolean;
  scenario: OnCallScenarioId;
  /** v1.2 R1-B：create() 從 MinigameRulesMap['mg.oncall'].scenarios 複製；評估讀這裡（UI 不得顯示正解） */
  scenarioDef: OnCallScenarioDef;
  machine: MachineId;
  caller: CharacterId;
  transcript: readonly OnCallLine[];
  commands: readonly OnCallCommandId[];
  plan: readonly OnCallCommandId[];
  stepsRequired: number;
  blurredAtStart: number;
  repeats: number;
  elapsedMs: number;
  limitMs: number;
  ending: 'none' | 'submitted' | 'wentIn' | 'timedOut';
  phase: 'listening' | 'done';
  staleInputs: number;
}
export type OnCallInput =
  | { kind: 'toggle'; command: OnCallCommandId }
  | { kind: 'clearPlan' }
  | { kind: 'repeat' }
  | { kind: 'submit' }
  | { kind: 'goIn' };

export interface MinigameStateMap {
  'mg.gowning': GowningState;
  'mg.spc': SpcState;
  'mg.hold_lot': HoldLotState;
  'mg.oncall': OnCallState;
}
export interface MinigameInputMap {
  'mg.gowning': GowningInput;
  'mg.spc': SpcInput;
  'mg.hold_lot': HoldLotInput;
  'mg.oncall': OnCallInput;
}

/* ================================================================
 * 9. 職涯、考績、經濟（GDD §9）
 * ================================================================ */
export interface RankDef {
  id: RankId;
  title: TextId;
  monthlySalary: number;
  overtimeEligible: boolean;
  /** Q3 以上的專業津貼（責任制） */
  allowance: number;
}

export interface ReviewRecord {
  kind: ReviewKind;
  dayIndex: number;
  kpi: number;
  /** 考績單的 KPI 欄位（04 §9.16）：小遊戲平均、產線 KPI、扣分 */
  kpiBreakdown: { minigames: number; line: number; penalty: number };
  /** 這次等第決定的分紅倍率（考績單顯示用；生效值在 CareerState.bonusMultiplier） */
  bonusMultiplier: number;
  /** 考績積分 PS（GDD §4.4） */
  ps: number;
  grade: Grade | null;
  passed: boolean | null;
  /** 1＝課內第一 */
  teamRank: number | null;
  citedEntries: readonly string[];
  raisePct: number;
}

export interface CareerState {
  rank: RankId;
  monthlySalary: number;
  probation: ProbationStatus;
  certificationScore: number | null;
  /** 本考核期的小遊戲成績 */
  kpiSamples: number[];
  reviews: ReviewRecord[];
  /** 下一次季分紅倍率（等第決定） */
  bonusMultiplier: number;
  overtimeHoursThisMonth: number;
  overtimeHoursDeclaredThisMonth: number;
  /** GDD §2.2：加班換來的主管好感當天上限 +4 */
  bossFavorFromOvertimeToday: number;
  onCallThisWeek: boolean;
  onCallCallsThisMonth: number;
}

export interface ReviewRules {
  psWeights: { kpi: number; bossFavor: number; visibility: number; blameInverse: number };
  kpiWeights: { minigames: number; line: number };
  teamSize: number;
  peerPsRange: { min: number; max: number };
  quota: readonly { grade: Exclude<Grade, 'X'>; count: number }[];
  scrapBelowPs: number;
  allClearPs: number;
  raisePct: Readonly<Record<Grade, number>>;
  bonusMultiplier: Readonly<Record<Grade, number>>;
  windPeriodDays: number;
  windBossFavorMultiplier: number;
  blackBookCiteCount: number;
  blackBookRecencyDecayPerMonth: number;
  blameDecayFactorAfterReview: number;
  /** 課內 9 位 NPC 的 PS 基準與浮動（02 §7.4） */
  peers: readonly PeerDef[];
  /** 黑歷史本對 PS 的修正：Σ(±weight × 新近度) × factor，夾限（02 §9.3） */
  blackBookPsFactor: number;
  blackBookPsClamp: { min: number; max: number };
  /** 本考核期沒有小遊戲樣本時的平均值 */
  defaultMinigameKpi: number;
  /** 調薪與升等月薪取整的單位（100 元；薪資相關唯一的取整常數） */
  salaryRoundTo: number;
  probation: {
    certificationPass: number;
    skillMin: number;
    skillMinWeakFoundation: number;
    bossFavorMin: number;
    retakeFavorAtLeast: number;
    retakeFavorCost: number;
    retakeEffects: readonly Effect[];
  };
  /** 申訴（範例五「貳」）：p ＝ min(base ＋ perEvidence × evidence, cap) ＋ (skill ≥ skillBonusAtOrAbove ? skillBonus : 0) */
  appeal: {
    base: number;
    perEvidence: number;
    cap: number;
    skillBonusAtOrAbove: number;
    skillBonus: number;
    windowDays: { min: number; max: number };
  };
  pip: {
    weeks: number;
    failsToDismiss: number;
    weeklySuccess: NumExpr;
    successEffects: readonly Effect[];
    failEffects: readonly Effect[];
    liftEffects: readonly Effect[];
  };
  pipBlameAtOrAbove: number;
  xGradesToDismiss: number;
  majorViolationsToDismiss: number;
  unansweredOnCallWarning: { count: number; blameAtOrAbove: number };
}
export interface PeerDef {
  id: string;
  name: TextId;
  base: number;
  spread: number;
}

export type HousingId = 'dorm' | 'sharedRoom' | 'flatShare';
export type LedgerKind =
  | 'salary'
  | 'overtime'
  | 'onCall'
  | 'bonus'
  | 'yearEnd'
  | 'rent'
  | 'food'
  | 'transport'
  | 'phone'
  | 'insurance'
  | 'filial'
  | 'action'
  | 'interest'
  | 'withholding';
export interface LedgerLine {
  dayIndex: number;
  kind: LedgerKind;
  amount: number;
}
export interface Payslip {
  /** 'YYYY-MM' */
  month: string;
  rank: RankId;
  base: number;
  overtime: number;
  onCall: number;
  bonus: number;
  allowance: number;
  withholding: number;
  net: number;
}
export interface EconomyState {
  housing: HousingId;
  housingSinceDay: number;
  commute: 'shuttle' | 'scooter';
  filialAmount: 0 | 5000 | 10000 | 20000;
  monthLedger: LedgerLine[];
  payslips: Payslip[];
  totalIncome: number;
}
export interface EconomyRules {
  withholdingRate: number;
  bonusWithholdingRate: number;
  overtimeHourly: number;
  onCallWeekly: number;
  onCallPerCall: number;
  quarterlyBonusSalaryMonths: number;
  yearEndSalaryMonths: number;
  rent: Readonly<Record<HousingId, readonly { fromMonth: number; amount: number }[]>>;
  monthlyCosts: {
    food: number;
    phone: number;
    insurance: number;
    transport: Readonly<Record<EconomyState['commute'], number>>;
  };
  calendarDays: { rent: number; salary: number; filial: number };
  filialAffinityPerMonth: Readonly<Record<EconomyState['filialAmount'], number>>;
  creditInterestMonthly: number;
  /** 年終只發一半的等第（D、X） */
  yearEndHalfGrades: readonly Grade[];
  /** 1 月 20 日（02 §7.5） */
  yearEndPayDate: { month: number; day: number };
  /** 宿舍第幾個月必須搬走 */
  dormMoveOutMonth: number;
  /** 申報 >46 小時 → bossFavor −5（02 §7.7） */
  declaredOvertimePenalty: { aboveHours: number; effects: readonly Effect[] };
  /** 升等月薪 ＝ max(新職等底薪, 取整到 review.salaryRoundTo(目前月薪 × promotionRaise)) */
  promotionRaise: number;
}

/* ================================================================
 * 10. 方針、生活行動、履歷、世界物件
 * ================================================================ */
export type WorkPolicyId = 'grind' | 'steady' | 'save' | 'learn';
export type LifePolicyId = 'rest' | 'partner' | 'family' | 'social' | 'exercise' | 'saveMoney';
export interface PolicyDef<P extends string> {
  id: P;
  label: TextId;
  description: TextId;
  /** 每月效果；週快轉時由 fast_forward 依 1/4 比例套用（GDD §2.3） */
  monthlyEffects: readonly Effect[];
  overtimeHoursPerMonth: number;
}
export interface LifeActionDef {
  id: LifeActionId;
  label: TextId;
  requires?: Condition;
  effects: readonly Effect[];
  chapters: readonly ChapterId[];
}
export interface ResumeDef {
  id: ResumeId;
  label: TextId;
  description: TextId;
  initialStats: Partial<Record<StatId, number>>;
  initialAffinity: Partial<Record<CharacterId, number>>;
  initialFlags: readonly FlagId[];
  minigameTolerance: Partial<Record<MinigameId, number>>;
}
export interface LocationDef {
  id: LocationId;
  name: TextId;
  scene: SceneId;
  mode: '3d' | '2.5d';
  cleanroom: boolean;
  /** GDD §4.1：黃光區每小時體力額外 −3 */
  staminaPerHour: number;
  hotspots: readonly HotspotId[];
}
export interface MachineDef {
  id: MachineId;
  label: string;
  location: LocationId;
  hotspot: HotspotId;
  ownedByPlayer: boolean;
  initialHealth: number;
}
export interface MachineState {
  health: number;
}
export interface TaskDef {
  id: TaskId;
  title: TextId;
  location: LocationId;
  hotspot: HotspotId;
  action: { kind: 'minigame'; minigame: MinigameId; preset: string } | { kind: 'event'; event: EventId };
  staminaCost: number;
  /** GDD §2.2：加班 1 小時可自動完成 1 項 */
  autoCompletable: boolean;
}
export interface TaskState {
  task: TaskId;
  status: 'todo' | 'done' | 'autoDone' | 'failed';
}

/* ================================================================
 * 11. 劇本結構：章節、關鍵日、戰役
 * ================================================================ */
export interface KeyDayEventSlot {
  event: EventId;
  checkpoint: Checkpoint;
  at?: ClockTime;
}
export interface KeyDayDef {
  id: KeyDayId;
  /** null＝範本（條件、角色線、插播關鍵日套用） */
  date: IsoDate | null;
  kind: KeyDayKind;
  chapter: ChapterId | null;
  title: TextId;
  variant: 'full' | 'short' | 'offsite' | 'review';
  phases: readonly DayPhase[];
  /** 班中時段的起訖；預設 08:30～17:30 */
  shiftWindow?: { from: ClockTime; to: ClockTime };
  /** true：排定事件都結束後直接進入下一個時段（例：值班夜） */
  endShiftWhenEventsDone?: boolean;
  scenes?: Partial<Record<DayPhase, SceneId>>;
  events: readonly KeyDayEventSlot[];
  tasks: readonly TaskId[];
  onCall: boolean;
}
export interface ChapterDef {
  id: ChapterId;
  title: TextId;
  from: IsoDate;
  to: IsoDate;
  fastForward: FastForwardGranularity;
  keyDays: readonly KeyDayId[];
}
export interface CampaignDef {
  startDate: IsoDate;
  /** MVP：2028-02-29；完整版：2030-02-28 */
  termEndDate: IsoDate;
  chapters: readonly ChapterDef[];
  keyDayTarget: { min: number; max: number };
  /** 期滿結局依序判定，取第一個成立者；最後一個必須無條件（保底） */
  termEndings: readonly EndingId[];
  templates: { conditional: KeyDayId; interrupt: KeyDayId };
}

/* ================================================================
 * 12. 結局（GDD §10）
 * ================================================================ */
export interface EndingDef {
  id: EndingId;
  name: TextId;
  tone: 'good' | 'bitter' | 'bad' | 'neutral' | 'absurd' | 'sensitive';
  timing: 'midway' | 'term';
  /** midway：每次 afterEffects 檢查點監看；term：期滿依序判定 */
  condition: Condition;
  /** 隱藏結局覆蓋規則（GDD §10.1-3） */
  replaces?: readonly EndingId[];
  panels: readonly TextId[];
  card: TextId;
  palette: EndingPalette;
  showHelpCard: boolean;
}
/** 結局畫面調色（04 §9.23）；tone 'sensitive' 必須用 'rest'。完整版新增結局時擴充 */
export type EndingPalette = 'firstYear' | 'badgeErased' | 'pip' | 'normalLife' | 'hospital' | 'rest';
export interface RunStats {
  overtimeHours: number;
  wokenUpCount: number;
  onTimeLeaves: number;
}
export interface EndingResult {
  ending: EndingId;
  dayIndex: number;
  stats: Stats;
  runStats: RunStats;
  totalIncome: number;
  choiceTally: Record<ChoiceType, number>;
  blackBook: readonly BlackBookEntry[];
}

/* ================================================================
 * 13. 遊戲流程與互動（狀態機見 §6）
 * ================================================================ */
export type FastForwardStage = 'policy' | 'montage' | 'micro' | 'settlement';
export type GameFlow =
  | { kind: 'keyDay'; phase: DayPhase }
  | {
      kind: 'fastForward';
      stage: FastForwardStage;
      granularity: FastForwardGranularity;
      segmentEndDay: number;
      targetDay: number;
    }
  | { kind: 'ending'; ending: EndingId };

export interface StatChip {
  stat: VisibleStatId;
  delta: number;
  label: string;
}
export interface ChoiceCardView {
  id: ChoiceId;
  /** 0→壹、1→貳、2→參、3→肆 */
  index: number;
  title: string;
  type: ChoiceType;
  locked: boolean;
  lockedHint: string | null;
  thresholdStamp: boolean;
  /** 信任段落協調免人情（02 §8.4）：chips 已扣掉人情，卡片蓋「免人情」小章（04 §9.11） */
  favorWaived: boolean;
  chips: readonly StatChip[];
}
export interface PhoneMessageView {
  from: string;
  text: string;
  kind: PhoneMessageDef['kind'];
}
/** core 已經把文字、chip、鎖卡算好；UI 只負責畫 */
export type EventView =
  | {
      kind: 'line';
      speaker: Speaker;
      speakerName: string;
      text: string;
      portrait: PortraitRef | null;
      stage: StagingCue | null;
    }
  | { kind: 'phone'; thread: PhoneThreadId; messages: readonly PhoneMessageView[] }
  | {
      kind: 'choice';
      prompt: string | null;
      cards: readonly ChoiceCardView[];
      countdownSec: number | null;
      stage: StagingCue | null;
    }
  | { kind: 'result'; text: string; chips: readonly StatChip[]; rumor: string | null; portrait: PortraitRef | null }
  | { kind: 'minigame'; minigame: MinigameId; preset: string; context: MinigameContext };

/** 呈現契約：app 把 GameState 轉成這份快照交給 render（render 不讀 core，§4.2）；欄位的算法見 §9.2 */
export type CharacterClip = 'idle' | 'walk' | 'talk' | 'crouch' | 'tired' | 'point' | 'bow' | 'armsUp';
/** 05:30～07:00 dawn、07:00～17:30 day、17:30～19:00 dusk、其他 night（04 §3.1） */
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export interface SceneActor {
  actor: CharacterId | 'player';
  spot: string;
  outfit: CharacterAppearance['outfit'];
  clip: CharacterClip;
}
export interface SceneSnapshot {
  scene: SceneId;
  mood: PresentationMood;
  timeOfDay: TimeOfDay;
  machines: Record<MachineId, { label: string; status: MachineStatus }>;
  actors: SceneActor[];
  highlightHotspots: HotspotId[];
  /** 辦公室大螢幕的良率指數（0～100，一位小數）；不在辦公室時 null */
  yieldIndex: number | null;
  /** 目前台詞的說話者（puaLowAngle、closeUp 拍誰） */
  focusActor: CharacterId | 'player' | null;
  /** 體力 ≤20 → 0.7（GDD §4.1），否則 1 */
  playerSpeedScale: number;
  /** 凌晨工作機來電：房間只剩手機冷白光 */
  phoneGlow: boolean;
}
export type NavigationMode = 'free' | 'hotspot' | 'none';
export type QualityTier = 'high' | 'medium' | 'low';
/** ui/motion.ts 產生，app 傳給 render 與 ui 的動畫 */
export interface MotionPolicy {
  reduced: boolean;
}

export interface EventRun {
  event: EventId;
  node: NodeId;
  lastChoice: ChoiceId | null;
  lastDeltas: StatDelta[];
  view: EventView;
}
export type DocumentKind = 'reviewSheet' | 'payslip';
export type Interaction =
  | { kind: 'event'; run: EventRun }
  | { kind: 'task'; task: TaskId; context: MinigameContext }
  /** 時段進入的小遊戲（著裝、半夜電話，03 §2.4）；預設組依 chapterDefaults 選 */
  | { kind: 'minigame'; source: 'gowning' | 'onCall'; minigame: MinigameId; preset: string; context: MinigameContext }
  | { kind: 'clockOutCard' }
  /** chips 由 core 依 §7.8 的 chip 規則算好（只取最上層、可見數值、常數 delta） */
  | { kind: 'eveningActions'; options: readonly { action: LifeActionId; chips: readonly StatChip[] }[] }
  | { kind: 'document'; document: DocumentKind; index: number }
  | { kind: 'phone'; thread: PhoneThreadId | null };

export interface QueuedEvent {
  event: EventId;
  checkpoint: Checkpoint;
  at?: ClockTime;
  source: 'scripted' | 'trigger' | 'seed' | 'sub' | 'deferred';
}
export interface PendingKeyDay {
  dayIndex: number;
  kind: KeyDayKind;
  event: EventId;
  template: KeyDayId;
}
export interface EventHistory {
  seen: Record<EventId, { count: number; lastDay: number; lastChoice: ChoiceId | null }>;
  /** 冷卻群組 → 上次觸發時的 keyDaysPlayed */
  cooldowns: Record<string, number>;
  queue: QueuedEvent[];
  deferred: QueuedEvent[];
  pendingKeyDays: PendingKeyDay[];
  /** 'YYYY-MM' → 次數（GDD §2.6、§2.3） */
  nonScriptedKeyDaysByMonth: Record<string, number>;
  interruptsByMonth: Record<string, number>;
  today: { dialogue: number; crisis: number };
  locationsVisited: LocationId[];
}

export interface PhoneMessage extends PhoneMessageDef {
  thread: PhoneThreadId;
  dayIndex: number;
  minuteOfDay: number;
  read: boolean;
}
/** look：主角頭像外型 A（短髮）／B（鮑伯頭），建角時選（04 §8.3） */
export interface PlayerProfile {
  name: string;
  pronoun: Pronoun;
  resume: ResumeId;
  look: 'a' | 'b';
}

/* ================================================================
 * 14. 遊戲狀態（存檔的主體）
 * ================================================================ */
export interface GameState {
  runId: string;
  seed: number;
  rngState: number;
  player: PlayerProfile;
  time: TimeState;
  flow: GameFlow;
  stats: Stats;
  modifiers: ActiveModifier[];
  relationships: Record<CharacterId, RelationshipState>;
  career: CareerState;
  economy: EconomyState;
  flags: Record<FlagId, boolean>;
  counters: Record<CounterId, number>;
  machines: Record<MachineId, MachineState>;
  tasks: TaskState[];
  events: EventHistory;
  seeds: PendingSeed[];
  blackBook: BlackBookEntry[];
  choiceTally: Record<ChoiceType, number>;
  policy: { work: WorkPolicyId; life: LifePolicyId } | null;
  phone: { messages: PhoneMessage[] };
  location: LocationId | null;
  runStats: RunStats;
  interaction: Interaction | null;
  endingResult: EndingResult | null;
}

export type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

/* ================================================================
 * 15. 指令與領域事件（UI／app → core；core → UI／render／audio）
 * ================================================================ */
export type GameCommand =
  /** 對話下一句、結果框繼續、文件頁關閉 */
  | { type: 'advance' }
  | { type: 'choose'; choice: ChoiceId }
  /** 倒數結束（GDD §5.1-6：自動選沉默）或微事件 5 秒未選 */
  | { type: 'timeout' }
  /** 由 app 依 balance.clock.realMsPerGameMinute 換算後送入 */
  | { type: 'advanceClock'; minutes: number }
  | { type: 'enterLocation'; location: LocationId }
  | { type: 'interact'; hotspot: HotspotId }
  /** 任務全部完成後的「提早收尾」：時鐘跳到 16:30 檢查點，再到下班 */
  | { type: 'wrapUpShift' }
  | { type: 'finishMinigame'; outcome: MinigameOutcome }
  | { type: 'clockOut'; mode: 'onTime' }
  | { type: 'clockOut'; mode: 'overtime'; hours: 1 | 2 | 3 | 4 | 5 }
  | { type: 'clockOut'; mode: 'takeHome' }
  | { type: 'pickLifeAction'; action: LifeActionId }
  | { type: 'setPolicy'; work: WorkPolicyId; life: LifePolicyId }
  | { type: 'openPhone'; thread: PhoneThreadId | null }
  | { type: 'closePhone' }
  /** MVP：手機「人生」App 的離職（E21 入口） */
  | { type: 'resign' };

export type DomainEvent =
  | { type: 'flowChanged'; from: GameFlow; to: GameFlow }
  | { type: 'interactionChanged'; interaction: Interaction | null }
  | {
      type: 'statsChanged';
      deltas: readonly StatDelta[];
      source: EventId | 'clock' | 'policy' | 'economy' | 'minigame' | 'review';
    }
  | { type: 'staging'; cue: StagingCue }
  | { type: 'clockTick'; dayIndex: number; minuteOfDay: number }
  | { type: 'phoneMessage'; message: PhoneMessage }
  | { type: 'sceneRequested'; scene: SceneId }
  | { type: 'autosaveRequested'; reason: 'keyDayStart' | 'fastForwardStart' | 'reviewDone' }
  | { type: 'endingReached'; result: EndingResult };

/* ================================================================
 * 16. 內容總包（core 透過參數取得；不直接 import content/）
 * ================================================================ */
export interface BalanceRules {
  clock: { realMsPerGameMinute: number; hotspotMoveMinutes: number };
  overtimePerHour: readonly Effect[];
  overtimeBossFavorDailyCap: number;
  takeHomeEffects: readonly Effect[];
  maxPendingSeeds: number;
  maxBlackBookEntries: number;
  perKeyDayCaps: { dialogue: number; crisis: number };
  maxNonScriptedKeyDaysPerMonth: number;
  maxInterruptsPerMonth: number;
  microEventsPerSegment: { min: number; max: number };
  randomEventDailyChance: number;
  randomCooldownKeyDays: number;
  safety: SafetyRules;
  /** GDD §4.6 的權重，含隱藏數值（02 §3.3） */
  choiceWeights: Readonly<Partial<Record<StatId, number>>> & { moneyPerThousand: number };
  /** 支配檢查用：1＝越高越好，−1＝越低越好（健康債、背鍋值、金手銬） */
  statPolarity: Readonly<Record<StatId, 1 | -1>>;
  spreadFloor: number;
  /** 0.20（02 §3.2；GDD 寫 0.15） */
  maxCoreChoiceSpread: number;
  maxVisibleDeltaPerChoice: number;
  maxVisibleNetPerKeyDay: number;
  /** 期望價值估算的常數（02 §3.3～§3.4） */
  valuation: ValuationRules;
  /** 小遊戲 facts → 效果的換算表（02 §1.9） */
  minigameRewards: readonly MinigameRewardRule[];
  minigameKpi: MinigameKpiRules;
  workday: WorkdayRules;
  sleep: SleepRules;
  onCall: OnCallRules;
  fastForward: FastForwardRules;
  stamina: StaminaRules;
  mindRecovery: MindRecoveryRules;
  thresholds: ThresholdRules;
  machines: MachineRules;
  wip: WipRules;
  relationships: RelationshipRules;
}

/* ---- 16a. BalanceRules 的子結構（數值見 02 §14.1） ---- */
export interface SafetyRules {
  careMindAtOrBelow: number;
  careStaminaAtOrBelow: number;
  warningMindAtOrBelow: number;
  lowMindAtOrBelow: number;
  /** 精神 ≤ 此值時快轉安全提示每次都出現（不受每月一次限制） */
  promptAlwaysAtOrBelowMind: number;
  leaveDays: number;
  shortLeaveDays: number;
  leaveEffects: readonly Effect[];
  shortLeaveEffects: readonly Effect[];
}
export interface ValuationRules {
  affinityPerPoint: number;
  affinityOverrides: Readonly<Partial<Record<CharacterId, number>>>;
  ownedMachineHealthPerPoint: number;
  blackBookPerWeight: number;
  conditionalFactor: number;
  minigameSuccessRate: number;
  /** 'mg.spc:logTrace' 是 SPC logTrace 變體的獨立一列 */
  minigameResultValues: Readonly<Record<MinigameId | 'mg.spc:logTrace', { success: number; fail: number }>>;
  taskValue: number;
  thresholdCardMarginRatio: number;
  /** 「至少一項扣分」的門檻（元件價值 ≤ −costFloor） */
  costFloor: number;
  dominanceEpsilon: number;
  maxEventDepth: number;
  /** v1.2 R1-E：economy 效果的估值月數（每月 NT$ 變動 × 月數 ÷ 1,000，02 §3.4）；初版 6 */
  economyHorizonMonths: number;
  counterValues: Readonly<Record<CounterId, number>>;
  flagValues: Readonly<Record<FlagId, number>>;
  modifierValues: Readonly<Record<ModifierId, number>>;
}
export type MinigameRewardWhen =
  | { fact: string; gte: number }
  | { fact: string; is: boolean | string }
  | { result: MinigameOutcome['result'] }
  | { source: 'event' | 'task' | 'gowning' | 'onCall' };
export interface MinigameRewardRule {
  minigame: MinigameId;
  /** 例：'chart'／'logTrace'（SPC 的 facts.variant）；省略＝全部 */
  variant?: string;
  /** 全部成立才套用 */
  when: readonly MinigameRewardWhen[];
  effects: readonly Effect[];
  /** 依 fact 的整數值重複套用 effects，最多 cap 次 */
  perUnit?: { fact: string; cap: number };
}
export interface MinigameKpiRules {
  excluded: readonly MinigameId[];
  excludedPresets: readonly string[];
  autoDoneSample: number;
  unfinishedSample: number;
}
export interface WorkdayRules {
  /** full／review 關鍵日的下班疲勞（−25） */
  workdayStamina: number;
  onTimeEffects: readonly Effect[];
  /** 每個未完成任務 */
  unfinishedTaskEffects: readonly Effect[];
  overtimeIdleSkillPerHour: number;
  takeHomeBedtime: ClockTime;
  lunchAt: ClockTime;
  wrapUpAt: ClockTime;
  shiftDefault: { from: ClockTime; to: ClockTime };
  earlyArrivalMinutes: number;
  /** v1.2 R1-D：班中離開無塵室再進入的時間成本（自動著裝，§6.5-10）；初版 15 */
  regownMinutes: number;
}
export interface SleepRules {
  fullRecovery: number;
  fullSleepHours: number;
  wakeAt: ClockTime;
  defaultBedtime: ClockTime;
  calledFactor: number;
}
export interface OnCallRules {
  baseChance: number;
  perMissingHealth: number;
  rookieBonus: number;
  rookieChance: number;
  /** 同一晚第 2 通的機率倍率（範例六） */
  secondCallFactor: number;
  ringEffects: readonly Effect[];
  fastForwardRingEffects: readonly Effect[];
  /** 輪值週＝每月第幾個星期六所在的那一週 */
  rotationSaturday: number;
}
export interface FastForwardRules {
  arrivalStaminaBase: number;
  weekSingleSegmentMaxDays: number;
  monthMergeBelowDays: number;
  tinySegmentMaxDays: number;
  maxMicroPerSegment: number;
  /** 「拚」的健康債：min(cap, base ＋ step × ⌊連續月數⌋)（02 §5.5） */
  grindHealthDebt: { base: number; step: number; cap: number };
  mindWarningHealthDebtPerMonth: number;
}
export interface StaminaRules {
  base: number;
  healthDebtDivisor: number;
  exerciseCap: number;
  grindPenalty: number;
}
export interface MindRecoveryRules {
  highAtOrAbove: number;
  highMultiplier: number;
  lowAtOrBelow: number;
  lowMultiplier: number;
  /** 生活滿足 ≤ 此值時夜間行動的正值效果 ×0.5 */
  lifeActionHalfAtOrBelow: number;
}
export interface ThresholdRules {
  /** 健康債門檻：健檢紅字 30、身體警告 60、醫生最後警告 85、E13 100 */
  healthDebt: { checkup: number; bodyAlarm: number; finalWarning: number; hospital: number };
  blackoutEffects: readonly Effect[];
  borrowBelow: number;
  borrowAmount: number;
  borrowMomAffinity: number;
}
export interface MachineRules {
  autoPmBelow: number;
  autoPmGain: number;
  /** health < yellowBelow → warn；< redBelow → down */
  yellowBelow: number;
  redBelow: number;
  decayByWorkPolicy: Readonly<Record<WorkPolicyId, number>>;
}
export interface WipRules {
  initial: number;
  monthlyRelief: number;
  redMachineMonthly: number;
  meltdownAt: number;
}
export interface RelationshipRules {
  decayAbove: number;
  decayAfterDays: number;
  decay: number;
  hostilePeerPenalty: number;
  hostilePeerFloor: number;
}

export interface ContentBundle {
  campaign: CampaignDef;
  keyDays: Readonly<Record<KeyDayId, KeyDayDef>>;
  stats: Readonly<Record<StatId, StatRule>>;
  characters: Readonly<Record<CharacterId, CharacterDef>>;
  resumes: Readonly<Record<ResumeId, ResumeDef>>;
  events: Readonly<Record<EventId, EventDef>>;
  endings: Readonly<Record<EndingId, EndingDef>>;
  minigames: MinigameContentMap;
  workPolicies: Readonly<Record<WorkPolicyId, PolicyDef<WorkPolicyId>>>;
  lifePolicies: Readonly<Record<LifePolicyId, PolicyDef<LifePolicyId>>>;
  lifeActions: Readonly<Record<LifeActionId, LifeActionDef>>;
  ranks: Readonly<Record<RankId, RankDef>>;
  economy: EconomyRules;
  review: ReviewRules;
  balance: BalanceRules;
  locations: Readonly<Record<LocationId, LocationDef>>;
  machines: Readonly<Record<MachineId, MachineDef>>;
  tasks: Readonly<Record<TaskId, TaskDef>>;
  flags: Readonly<Record<FlagId, FlagDef>>;
  counters: Readonly<Record<CounterId, string>>;
  text: Readonly<Record<TextId, string>>;
}
/** 旗標登錄表：防打錯字；scope 'keyDay' 的旗標在每個關鍵日結束時自動清除 */
export interface FlagDef {
  description: string;
  scope: 'run' | 'keyDay';
}

/** 內容驗證結果（core 產生、utils/errors 攜帶、ui 錯誤頁顯示） */
export interface ContentIssue {
  severity: 'error' | 'warning';
  /** 出問題的定義 ID，例 'ev.et03_down' */
  id: string;
  /** 欄位路徑，例 'nodes.n_choice.choices[2].requires.all[1].flag' */
  path: string;
  message: string;
}

/* ================================================================
 * 17. 存檔（§11）
 * ================================================================ */
export const SAVE_SCHEMA_VERSION = 1;
export type SaveSlotId = 'auto' | 'slot1' | 'slot2' | 'slot3';
export interface SaveSummary {
  playerName: string;
  chapter: ChapterId;
  dayIndex: number;
  rank: RankId;
  keyDaysPlayed: number;
}
export interface SaveData {
  format: 'fab7-save';
  schemaVersion: number;
  /** 內容總包的 FNV-1a 雜湊；不同時要做內容參照檢查 */
  contentVersion: string;
  slot: SaveSlotId;
  /** 現實時間 ISO 字串（由注入的 now() 產生） */
  savedAt: string;
  summary: SaveSummary;
  /** state 的 JSON 字串的 FNV-1a 雜湊（偵測截斷與手改） */
  checksum: string;
  state: GameState;
}
export interface MetaData {
  format: 'fab7-meta';
  schemaVersion: number;
  endingsSeen: EndingId[];
  runsCompleted: number;
  contentNoticeAcknowledged: boolean;
}
export interface SettingsData {
  format: 'fab7-settings';
  schemaVersion: number;
  reduceMotion: 'system' | 'on' | 'off';
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  /** 危機倒數與微事件預設倒數的倍率（無障礙，§10.6） */
  countdownScale: 1 | 1.5 | 2;
  /** 設定頁一開始就能開；flag.gowning_tutorial_done 之後才生效（教學不會被跳過，03 §3.10） */
  autoGowning: boolean;
  navigation: 'auto' | 'free' | 'hotspot';
  quality: 'auto' | 'high' | 'medium' | 'low';
  colorAssist: boolean;
  phantomVibration: boolean;
  masterVolume: number;
  /** 文字大小（04 §11.2）；以下四個欄位在 v1 就存在（尚未發佈，不需要遷移） */
  textScale: 1 | 1.15 | 1.3;
  bgmVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
}
export type SaveErrorKind =
  | 'parse'
  | 'format'
  | 'checksum'
  | 'versionTooNew'
  | 'migrationFailed'
  | 'shape'
  | 'contentMismatch'
  | 'writeFailed'
  | 'storageUnavailable';

/* ================================================================
 * 18. 行為契約（非資料；下游規格書共用）
 * ================================================================ */
export interface GameSession {
  getState(): DeepReadonly<GameState>;
  dispatch(command: GameCommand): void;
  subscribe(listener: (state: DeepReadonly<GameState>, events: readonly DomainEvent[]) => void): () => void;
}

/**
 * 03 規格書的每個小遊戲都實作這個介面；邏輯是純函式，畫面在 ui/minigames/。
 * registry：{ [K in MinigameId]: MinigameLogic<K, MinigameStateMap[K], MinigameInputMap[K]> }
 */
export interface MinigameLogic<K extends MinigameId, S, I> {
  readonly id: K;
  /** v1.2 R1-B：rules 是 content.minigames[K].rules（領域資料，不寫死在邏輯） */
  create(params: MinigameParamsMap[K], context: MinigameContext, rules: MinigameRulesMap[K]): S;
  update(state: S, action: MinigameAction<I>): S;
  isFinished(state: S): boolean;
  finish(state: S): MinigameOutcome;
}
