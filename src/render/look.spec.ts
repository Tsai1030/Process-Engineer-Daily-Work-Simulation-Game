import { describe, expect, test } from 'bun:test';
import type { PresentationMood, SceneId } from '../model';
import { LIGHT_RIGS, type LightRigInput, legacyToPhysical, outlineFor, selectLightRig } from './look';

// 04 §2.8 的預先手算值（誤差 ±0.5）
const LEGACY_CASES = [
  { name: 'hemisphere 0.8', intensity: 0.8, light: { kind: 'hemisphere' }, expected: 1.92 },
  { name: 'directional 0.85', intensity: 0.85, light: { kind: 'directional' }, expected: 2.2 },
  {
    name: 'red bright 3.2',
    intensity: 3.2,
    light: { kind: 'point', legacyDistance: 16, refDistance: 2, decay: 1 },
    expected: 60.6,
  },
  {
    name: 'red dark 1.1',
    intensity: 1.1,
    light: { kind: 'point', legacyDistance: 16, refDistance: 2, decay: 1 },
    expected: 5.78,
  },
  {
    name: 'red initial 2.6',
    intensity: 2.6,
    light: { kind: 'point', legacyDistance: 16, refDistance: 2, decay: 1 },
    expected: 38.3,
  },
  {
    name: 'photo yellow 2.3',
    intensity: 2.3,
    light: { kind: 'point', legacyDistance: 26, refDistance: 5, decay: 1 },
    expected: 61.5,
  },
] as const;

describe('legacyToPhysical', () => {
  test.each([...LEGACY_CASES])('$name converts to about $expected', ({ intensity, light, expected }) => {
    expect(legacyToPhysical(intensity, light)).toBeCloseTo(expected, 0);
  });
});

const baseInput = (scene: SceneId, overrides: Partial<LightRigInput> = {}): LightRigInput => ({
  scene,
  mood: 'normal' as PresentationMood,
  anyMachineDown: false,
  zone: null,
  daylight: 'day',
  ...overrides,
});

const SELECT_CASES = [
  { row: '1 calm', input: baseInput('scn.room', { mood: 'calm' }), expected: 'calmPaper' },
  {
    row: '2 photo zone',
    input: baseInput('scn.fab_bay', { zone: 'photo', anyMachineDown: true }),
    expected: 'photoAmber',
  },
  {
    row: '3 bay with down machine at night',
    input: baseInput('scn.fab_bay', { zone: 'bay', anyMachineDown: true, daylight: 'night' }),
    expected: 'bayAlarm',
  },
  {
    row: '4 bay night',
    input: baseInput('scn.fab_bay', { zone: 'bay', daylight: 'night' }),
    expected: 'bayNight',
  },
  { row: '5 bay day', input: baseInput('scn.fab_bay', { zone: 'bay' }), expected: 'bayDay' },
  { row: '6 gowning', input: baseInput('scn.gowning_room'), expected: 'gowningWhite' },
  {
    row: '7 office night',
    input: baseInput('scn.office', { daylight: 'night' }),
    expected: 'officeNight',
  },
  { row: '8 office day', input: baseInput('scn.office'), expected: 'officeDay' },
  { row: '9 2.5D scene', input: baseInput('scn.room'), expected: null },
] as const;

describe('selectLightRig', () => {
  test.each([...SELECT_CASES])('decision row $row selects $expected', ({ input, expected }) => {
    expect(selectLightRig(input)).toBe(expected);
  });
});

const OUTLINE_CASES = [
  { longest: 0.119, expected: 0.015 },
  { longest: 0.12, expected: 0.03 },
  { longest: 0.399, expected: 0.03 },
  { longest: 0.4, expected: 0.04 },
  { longest: 1.499, expected: 0.04 },
  { longest: 1.5, expected: 0.05 },
] as const;

describe('outlineFor', () => {
  test.each([...OUTLINE_CASES])('longest edge $longest gives $expected', ({ longest, expected }) => {
    expect(outlineFor([longest, 0.01, 0.01])).toBe(expected);
  });
});

describe('LIGHT_RIGS', () => {
  test('every rig with fog uses its background colour, except the two sample-valued rigs', () => {
    const mismatched = Object.entries(LIGHT_RIGS)
      .filter(([, rig]) => rig.fog !== null && rig.fog.color !== rig.background)
      .map(([id]) => id);
    expect(mismatched).toEqual(['bayAlarm', 'photoAmber']);
  });
});
