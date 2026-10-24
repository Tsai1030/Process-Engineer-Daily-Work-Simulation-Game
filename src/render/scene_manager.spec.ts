import { describe, expect, test } from 'bun:test';
import { PerspectiveCamera, Scene } from 'three';
import { createFakeTextureFactory } from '../../test/fixtures';
import type { SceneId, SceneSnapshot } from '../model';
import { createMemoryLogger } from '../utils/logger';
import type { ResourceTracker } from './resource_tracker';
import { createSceneManager, type SceneFactory } from './scene_manager';
import { createToonKit } from './toon_kit';

const FAB: SceneId = 'scn.fab_bay';
const OFFICE: SceneId = 'scn.office';

function snapshotOf(scene: SceneId): SceneSnapshot {
  return {
    scene,
    mood: 'normal',
    timeOfDay: 'day',
    machines: {},
    actors: [],
    highlightHotspots: [],
    yieldIndex: null,
    focusActor: null,
    playerSpeedScale: 1,
    phoneGlow: false,
  };
}

function recordingFactory(id: SceneId, calls: string[]): SceneFactory {
  return () => {
    calls.push(`build:${id}`);
    return {
      id,
      scene: new Scene(),
      camera: new PerspectiveCamera(),
      enter: () => calls.push(`enter:${id}`),
      update: () => calls.push(`update:${id}`),
      tick: () => undefined,
      exit: () => calls.push(`exit:${id}`),
      dispose: () => calls.push(`dispose:${id}`),
    };
  };
}

function newManager() {
  const calls: string[] = [];
  const manager = createSceneManager(
    { [FAB]: recordingFactory(FAB, calls), [OFFICE]: recordingFactory(OFFICE, calls) },
    { kit: createToonKit(), textures: createFakeTextureFactory(), quality: 'high', logger: createMemoryLogger() },
  );
  return { calls, manager };
}

describe('createSceneManager', () => {
  test('showing the same scene twice builds it once and then only updates', () => {
    const { calls, manager } = newManager();
    manager.show(snapshotOf(FAB));
    manager.show(snapshotOf(FAB));
    expect(calls).toEqual(['build:scn.fab_bay', 'enter:scn.fab_bay', 'update:scn.fab_bay']);
  });

  test('switching scenes exits and disposes the previous one before building the next', () => {
    const { calls, manager } = newManager();
    manager.show(snapshotOf(FAB));
    manager.show(snapshotOf(OFFICE));
    expect(calls).toEqual([
      'build:scn.fab_bay',
      'enter:scn.fab_bay',
      'exit:scn.fab_bay',
      'dispose:scn.fab_bay',
      'build:scn.office',
      'enter:scn.office',
    ]);
  });

  test('an unregistered scene fails with a render error', () => {
    const { manager } = newManager();
    expect(() => manager.show(snapshotOf('scn.nope'))).toThrow(
      'Render failed: kind=sceneBuild detail=no factory: scene=scn.nope',
    );
  });

  test('disposeAll releases the current scene', () => {
    const { calls, manager } = newManager();
    manager.show(snapshotOf(FAB));
    manager.disposeAll();
    expect({ current: manager.current(), last: calls.at(-1) }).toEqual({ current: null, last: 'dispose:scn.fab_bay' });
  });

  test('every build gets a tracker of its own', () => {
    const trackers: ResourceTracker[] = [];
    const spy: SceneFactory = (ctx) => {
      trackers.push(ctx.tracker);
      return recordingFactory(FAB, [])(ctx);
    };
    const manager = createSceneManager(
      { [FAB]: spy, [OFFICE]: spy },
      { kit: createToonKit(), textures: createFakeTextureFactory(), quality: 'high', logger: createMemoryLogger() },
    );
    manager.show(snapshotOf(FAB));
    manager.show(snapshotOf(OFFICE));
    expect(new Set(trackers).size).toEqual(2);
  });
});
