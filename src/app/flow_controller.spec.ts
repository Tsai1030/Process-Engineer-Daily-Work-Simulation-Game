import { describe, expect, test } from 'bun:test';
import { buildTestState, testContent } from '../../test/fixtures';
import type { GameState, SceneSnapshot } from '../model';
import { toSceneSnapshot } from './flow_controller';

// fixtures: T-01/T-02/T-03 起始健康 45/80/10；門檻 yellowBelow 40、redBelow 20；warningMindAtOrBelow 15
const WARN_HEALTH = 30;
const LOW_MIND = 10;
const EVENING_MINUTE = 20 * 60;

function eveningStateWithWornTool(): GameState {
  const base = buildTestState({ stats: { mind: LOW_MIND } });
  return {
    ...base,
    time: { ...base.time, minuteOfDay: EVENING_MINUTE },
    machines: { ...base.machines, 'mc.test01': { health: WARN_HEALTH } },
  };
}

describe('toSceneSnapshot', () => {
  test('assembles the Stage 1 fab bay snapshot from selectors: warning mood, night, run/warn/down lights by health', () => {
    const expected: SceneSnapshot = {
      scene: 'scn.fab_bay',
      mood: 'warning',
      timeOfDay: 'night',
      machines: {
        'mc.test01': { label: 'T-01', status: 'warn' },
        'mc.test02': { label: 'T-02', status: 'run' },
        'mc.test03': { label: 'T-03', status: 'down' },
      },
      actors: [],
      highlightHotspots: [],
      yieldIndex: null,
      focusActor: null,
      playerSpeedScale: 1,
      phoneGlow: false,
    };
    expect(toSceneSnapshot(eveningStateWithWornTool(), testContent)).toEqual(expected);
  });

  test('throws when a content machine has no runtime state', () => {
    const base = buildTestState();
    const { 'mc.test02': _dropped, ...rest } = base.machines;
    expect(() => toSceneSnapshot({ ...base, machines: rest }, testContent)).toThrow(
      'Machine state missing: machine=mc.test02',
    );
  });
});
