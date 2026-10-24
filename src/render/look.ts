import type { PresentationMood, QualityTier, SceneId } from '../model';

export const PALETTE = {
  floorTile: 0xd8d6cc,
  floorHole: 0x1b1b1b,
  wallPanel: 0xefede6,
  ceiling: 0x3a3a3f,
  ceilingLamp: 0xffe6e0,
  ffuGrid: 0xc9c7c0,
  pillar: 0x111111,
  railSteel: 0x2d2d33,
  photoWall: 0xffd21a,
  photoCeiling: 0xe0a800,
  photoFloor: 0xf2b800,
  photoGlass: 0xffe14d,
  photoTool: 0x2a2a2a,
  photoToolTop: 0x111111,
  hazardYellow: 0xffd400,
  hazardBlack: 0x000000,
  toolBody: 0xe9e6df,
  toolBand: 0x2b2b2e,
  toolDoor: 0xcfcac0,
  toolBlack: 0x111111,
  screenBg: 0x0d1114,
  screenRun: 0x2bd45a,
  screenWarn: 0xffd400,
  screenDown: 0xe60012,
  lampGreenOn: 0x38ff6a,
  lampYellowOn: 0xffe600,
  lampRedOn: 0xff2020,
  lampGreenOff: 0x0e3a1a,
  lampYellowOff: 0x4a4000,
  lampRedOff: 0x4a0a0a,
  ohtBody: 0xfafafa,
  ohtStripe: 0xe60012,
  foupShell: 0xcfe6ff,
  foupHandle: 0xff8a00,
  foupDoor: 0x7fa8d0,
  suit: 0xf7f7f2,
  suitBoot: 0xe0e0da,
  glove: 0x2a6fe0,
  eyeBand: 0x1d2a3a,
  mask: 0xffffff,
  lanyard: 0xe60012,
  holdTagRed: 0xe60012,
  holdTagYellow: 0xffd400,
  holdTagWhite: 0xffffff,
  stocker: 0xdcdad2,
  stockerWindow: 0x9fb8c9,
  wrapPlastic: 0xe8f1f5,
  gowningTile: 0xe6edf2,
  benchBlue: 0x2a6fe0,
  steel: 0xb9bec4,
  mirrorSilver: 0xd5dde3,
  officeFloor: 0x8c9196,
  officeWall: 0xf1f3ee,
  desk: 0xd8d2c4,
  deskDark: 0x4a4a4f,
  monitorBezel: 0x161616,
  chair: 0x2b2f3a,
  whiteboard: 0xfdfdfb,
  plant: 0x3d8a4f,
  cardboard: 0xc9a77a,
  tapeYellow: 0xffd400,
  skinS1: 0xfde7cf,
  skinS2: 0xf6d6b8,
  skinS3: 0xeac29e,
  skinS4: 0xd9a77f,
  ink: 0x0a0a0a,
  paper: 0xfffdf4,
  grey: 0xd9d6cc,
  shadowBlob: 0x000000,
  outline: 0x000000,
} as const;

export const OUTLINE_T = { L: 0.05, M: 0.04, S: 0.03, XS: 0.015 } as const;

export function outlineFor(size: readonly [number, number, number]): number {
  const longest = Math.max(size[0], size[1], size[2]);
  if (longest >= 1.5) return OUTLINE_T.L;
  if (longest >= 0.4) return OUTLINE_T.M;
  if (longest >= 0.12) return OUTLINE_T.S;
  return OUTLINE_T.XS;
}

export const PIXEL_RATIO_CAP: Readonly<Record<QualityTier, number>> = {
  high: 2,
  medium: 1.5,
  low: 1,
};

/** 把 r128 傳統模式的光源強度，換算成 0.186 物理模式下「看起來一樣」的強度 */
export function legacyToPhysical(
  legacyIntensity: number,
  light:
    | { kind: 'hemisphere' | 'directional' }
    | { kind: 'point'; legacyDistance: number; refDistance: number; decay: number },
): number {
  const gammaToLinear = (x: number): number => x ** 2.2;
  if (light.kind !== 'point') return Math.PI * gammaToLinear(legacyIntensity);
  const d = light.refDistance;
  const legacyFalloff = Math.max(0, 1 - d / light.legacyDistance);
  const cutoffWindow = Math.max(0, 1 - (d / light.legacyDistance) ** 4) ** 2;
  const physicalFalloff = cutoffWindow / Math.max(d ** light.decay, 0.01);
  return (Math.PI * gammaToLinear(legacyIntensity * legacyFalloff)) / physicalFalloff;
}

// 04 §2.4 校準表（方案 A 起始值）；行尾註解為範例（r128）舊值
export const CALIBRATION = {
  scheme: 'A',
  gradientSteps: [23, 96, 255], // r128 [85, 165, 255]，sRGB 解碼後的線性值
  hemisphere: 1.92, // r128 0.8，π × 0.8^2.2
  directional: 2.2, // r128 0.85，π × 0.85^2.2
  alarmBright: 60.6, // r128 3.2，參考距離 2.0 m
  alarmDark: 5.78, // r128 1.1，參考距離 2.0 m
  alarmInitial: 38.3, // r128 2.6，參考距離 2.0 m
  photoBase: 61.5, // r128 2.3，參考距離 5.0 m
  photoAmplitude: 8.8, // r128 ±0.15
  pointDecay: 1, // r128 預設 decay 1
} as const;

export type LightRigId =
  | 'bayDay'
  | 'bayNight'
  | 'bayAlarm'
  | 'photoAmber'
  | 'gowningWhite'
  | 'officeDay'
  | 'officeNight'
  | 'calmPaper';
export type FabZone = 'bay' | 'photo';

export interface LightRigInput {
  scene: SceneId;
  mood: PresentationMood;
  anyMachineDown: boolean;
  zone: FabZone | null;
  daylight: 'day' | 'night';
}

export interface LightRig {
  hemisphere: { sky: number; ground: number; intensity: number };
  directional: { color: number; intensity: number; position: readonly [number, number, number] };
  alarm: { color: number; bright: number; dark: number; hz: number; distance: number } | null;
  photo: {
    color: number;
    base: number;
    amplitude: number;
    distance: number;
    position: readonly [number, number, number];
  } | null;
  screen: { color: number; intensity: number; distance: number } | null;
  background: number;
  fog: { color: number; near: number; far: number } | null;
  lampPanel: number | null;
}

const SUN_POSITION = [4, 9, 7] as const;
const WINDOW_POSITION = [-8, 6, 2] as const;

const ALARM = {
  color: 0xff1a1a,
  bright: CALIBRATION.alarmBright,
  dark: CALIBRATION.alarmDark,
  hz: 1.7,
  distance: 16,
} as const;

const PHOTO = {
  color: 0xffd000,
  base: CALIBRATION.photoBase,
  amplitude: CALIBRATION.photoAmplitude,
  distance: 26,
  position: [0, 3.5, -22],
} as const;

export const LIGHT_RIGS: Readonly<Record<LightRigId, LightRig>> = {
  bayDay: {
    hemisphere: { sky: 0xf2f4ff, ground: 0x6b6f7a, intensity: 2.49 },
    directional: { color: 0xfff6ea, intensity: 1.67, position: SUN_POSITION },
    alarm: null,
    photo: PHOTO,
    screen: null,
    background: 0xdfe3e6,
    fog: { color: 0xdfe3e6, near: 24, far: 80 },
    lampPanel: 0xf4f6ff,
  },
  bayAlarm: {
    hemisphere: { sky: 0xffb4aa, ground: 0x38090e, intensity: CALIBRATION.hemisphere },
    directional: { color: 0xffe2dc, intensity: CALIBRATION.directional, position: SUN_POSITION },
    alarm: ALARM,
    photo: PHOTO,
    screen: null,
    background: 0x24050a,
    fog: { color: 0x2a0508, near: 18, far: 72 },
    lampPanel: 0xffe6e0,
  },
  bayNight: {
    hemisphere: { sky: 0xe6ecff, ground: 0x2c3140, intensity: 1.92 },
    directional: { color: 0xdfe6ff, intensity: 1.02, position: SUN_POSITION },
    alarm: null,
    photo: PHOTO,
    screen: null,
    background: 0x1e2430,
    fog: { color: 0x1e2430, near: 14, far: 60 },
    lampPanel: 0xd0d8ec,
  },
  photoAmber: {
    hemisphere: { sky: 0xffc040, ground: 0x4a3000, intensity: 1.43 },
    directional: { color: 0xffd27a, intensity: 0.684, position: SUN_POSITION },
    alarm: ALARM,
    photo: PHOTO,
    screen: null,
    background: 0x2b2000,
    fog: { color: 0x3a2c05, near: 10, far: 40 },
    lampPanel: null,
  },
  gowningWhite: {
    hemisphere: { sky: 0xffffff, ground: 0x9aa3ad, intensity: 3.14 },
    directional: { color: 0xffffff, intensity: 1.43, position: [3, 8, 5] },
    alarm: null,
    photo: null,
    screen: null,
    background: 0xeef3f6,
    fog: null,
    lampPanel: 0xffffff,
  },
  officeDay: {
    hemisphere: { sky: 0xf1f8ee, ground: 0x8b8f80, intensity: 2.2 },
    directional: { color: 0xf4ffe9, intensity: 1.43, position: WINDOW_POSITION },
    alarm: null,
    photo: null,
    screen: null,
    background: 0x9cc3e6,
    fog: null,
    lampPanel: 0xeef7e8,
  },
  officeNight: {
    hemisphere: { sky: 0x1d2333, ground: 0x0a0c12, intensity: 0.312 },
    directional: { color: 0xffffff, intensity: 0, position: WINDOW_POSITION },
    alarm: null,
    photo: null,
    screen: { color: 0xbcd6ff, intensity: 5.16, distance: 6 },
    background: 0x0b1020,
    fog: { color: 0x0b1020, near: 8, far: 22 },
    lampPanel: 0x2a3040,
  },
  calmPaper: {
    hemisphere: { sky: 0xffffff, ground: 0xe9e4d6, intensity: 3.14 },
    directional: { color: 0xffffff, intensity: 0, position: SUN_POSITION },
    alarm: null,
    photo: null,
    screen: null,
    background: 0xf4efe3,
    fog: { color: 0xf4efe3, near: 4, far: 26 },
    lampPanel: null,
  },
};

/** null means a 2.5D scene: BackdropSpec decides the rig (04 3.1 row 9) */
export function selectLightRig(input: LightRigInput): LightRigId | null {
  if (input.mood === 'calm') return 'calmPaper';
  if (input.scene === 'scn.fab_bay') {
    if (input.zone === 'photo') return 'photoAmber';
    if (input.anyMachineDown) return 'bayAlarm';
    return input.daylight === 'night' ? 'bayNight' : 'bayDay';
  }
  if (input.scene === 'scn.gowning_room') return 'gowningWhite';
  if (input.scene === 'scn.office') {
    return input.daylight === 'night' ? 'officeNight' : 'officeDay';
  }
  return null;
}
