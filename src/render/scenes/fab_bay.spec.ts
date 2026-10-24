import { describe, expect, test } from 'bun:test';
import type { Fog, Light, Mesh, MeshBasicMaterial, Object3D } from 'three';
import { createFakeTextureFactory, defined } from '../../../test/fixtures';
import type { MachineId, MachineStatus, SceneSnapshot, TimeOfDay } from '../../model';
import { createMemoryLogger } from '../../utils/logger';
import { PALETTE } from '../look';
import { createResourceTracker } from '../resource_tracker';
import { createToonKit } from '../toon_kit';
import { createFabBayScene } from './fab_bay';

// 04 §4.2 預算表
const BUDGET = { triangles: 60000, textures: 32 } as const;
const MOVING = { reduced: false } as const;
const STILL = { reduced: true } as const;
const BAY_MACHINES = [
  ['mc.et03', 'ET-03'],
  ['mc.et04', 'ET-04'],
  ['mc.et05', 'ET-05'],
  ['mc.et06', 'ET-06'],
] as const;

function snapshotWith(
  statuses: Partial<Record<MachineId, MachineStatus>>,
  timeOfDay: TimeOfDay = 'day',
): SceneSnapshot {
  const machines: SceneSnapshot['machines'] = {};
  for (const [id, label] of BAY_MACHINES) machines[id] = { label, status: statuses[id] ?? 'run' };
  return {
    scene: 'scn.fab_bay',
    mood: 'normal',
    timeOfDay,
    machines,
    actors: [],
    highlightHotspots: [],
    yieldIndex: null,
    focusActor: null,
    playerSpeedScale: 1,
    phoneGlow: false,
  };
}

function build() {
  const kit = createToonKit();
  const tracker = createResourceTracker();
  const textures = createFakeTextureFactory();
  const logger = createMemoryLogger();
  const module = createFabBayScene({ kit, tracker, textures, quality: 'high', logger });
  const light = (name: string): Light => defined(module.scene.getObjectByName(name), name) as Light;
  return { module, kit, tracker, textures, logger, light };
}

function triangles(root: Object3D): number {
  let total = 0;
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    const { index, attributes } = mesh.geometry;
    total += (index ? index.count : (attributes['position']?.count ?? 0)) / 3;
  });
  return total;
}

function backgroundHex(root: Object3D & { background: unknown }): number {
  return (root.background as { getHex(): number }).getHex();
}

function litLamp(root: Object3D, label: string): string {
  const machine = defined(root.getObjectByName(`machine:${label}`), label);
  const lamps = [
    ['green', PALETTE.lampGreenOn],
    ['yellow', PALETTE.lampYellowOn],
    ['red', PALETTE.lampRedOn],
  ] as const;
  const lit = lamps.filter(([key, on]) => {
    const lamp = defined(machine.getObjectByName(`lamp_${key}`), key) as Mesh;
    return (lamp.material as MeshBasicMaterial).color.getHex() === on;
  });
  return lit.map(([key]) => key).join('+');
}

function lightCount(root: Object3D): number {
  let count = 0;
  root.traverse((node) => {
    if ((node as Light).isLight) count++;
  });
  return count;
}

describe('createFabBayScene', () => {
  test('the calibration frame stays within the fab bay budget', () => {
    const { module, textures } = build();
    module.enter(snapshotWith({ 'mc.et03': 'down', 'mc.et06': 'warn' }));
    module.tick(0.016, 0.3, MOVING);
    const n = triangles(module.scene);
    const m = textures.created.length;
    expect({ trianglesOver: n > BUDGET.triangles, texturesOver: m > BUDGET.textures }).toEqual({
      trianglesOver: false,
      texturesOver: false,
    });
  });

  test('a down ET-03 puts the alarm light at the sample anchor with the calibrated phases', () => {
    const { module, light } = build();
    module.enter(snapshotWith({ 'mc.et03': 'down' }));
    const intensities: number[] = [];
    for (const [elapsed, motion] of [
      [0, MOVING],
      [0.3, MOVING],
      [0.3, STILL],
    ] as const) {
      module.tick(0, elapsed, motion);
      intensities.push(light('alarm_light').intensity);
    }
    const position = light('alarm_light').position.toArray();
    expect(intensities).toEqual([60.6, 5.78, 60.6]);
    for (const [index, expected] of [-3.1, 3.4, 2.4].entries()) expect(position[index]).toBeCloseTo(expected);
    expect(backgroundHex(module.scene)).toEqual(0x24050a);
  });

  test('ET-05 down moves the alarm anchor to its own machine', () => {
    const { module, light } = build();
    module.enter(snapshotWith({ 'mc.et05': 'down' }));
    const position = light('alarm_light').position.toArray();
    for (const [index, expected] of [-3.1, 3.4, -5.6].entries()) expect(position[index]).toBeCloseTo(expected);
  });

  test('all machines running uses the day rig and no alarm light', () => {
    const { module, light } = build();
    module.enter(snapshotWith({}));
    module.tick(0, 0, MOVING);
    const fog = module.scene.fog as Fog;
    expect({
      background: backgroundHex(module.scene),
      alarm: light('alarm_light').intensity,
      fog: [fog.near, fog.far],
    }).toEqual({ background: 0xdfe3e6, alarm: 0, fog: [24, 80] });
  });

  test('night without alarms uses the night rig', () => {
    const { module } = build();
    module.enter(snapshotWith({}, 'night'));
    expect(backgroundHex(module.scene)).toEqual(0x1e2430);
  });

  test('a calm mood switches to the paper rig and darkens the photo light', () => {
    const { module, light } = build();
    module.enter({ ...snapshotWith({}), mood: 'calm' });
    module.tick(0, 1, MOVING);
    expect({ background: backgroundHex(module.scene), photo: light('photo_light').intensity }).toEqual({
      background: 0xf4efe3,
      photo: 0,
    });
  });

  test('the photo light breathes around its calibrated base', () => {
    const { module, light } = build();
    module.enter(snapshotWith({}));
    const elapsed = 0.4;
    module.tick(0, elapsed, MOVING);
    expect(light('photo_light').intensity).toBeCloseTo(61.5 + 8.8 * Math.sin(elapsed * 2));
  });

  test('switching rigs keeps the same five lights', () => {
    const { module } = build();
    module.enter(snapshotWith({}));
    const before = lightCount(module.scene);
    module.update(snapshotWith({ 'mc.et03': 'down' }, 'night'));
    expect([before, lightCount(module.scene)]).toEqual([5, 5]);
  });

  test('snapshot statuses reach the bay machines and the far side keeps running', () => {
    const { module } = build();
    module.enter(snapshotWith({ 'mc.et03': 'down', 'mc.et06': 'warn' }));
    module.update(snapshotWith({ 'mc.et03': 'run', 'mc.et04': 'warn', 'mc.et06': 'warn' }));
    const labels = ['ET-03', 'ET-04', 'ET-05', 'ET-06', 'ET-07', 'ET-08', 'ET-09', 'ET-10'];
    expect(labels.map((label) => litLamp(module.scene, label))).toEqual([
      'green',
      'yellow',
      'green',
      'yellow',
      'green',
      'green',
      'green',
      'green',
    ]);
  });

  test('a snapshot missing a bay machine warns once per machine', () => {
    const { module, logger } = build();
    const snapshot = snapshotWith({});
    delete snapshot.machines['mc.et06'];
    module.enter(snapshot);
    module.update(snapshot);
    expect(logger.lines).toEqual(['warn [fab_bay] machine missing from snapshot: machine=mc.et06']);
  });

  test('dispose releases every scene texture but keeps the shared kit', () => {
    const { module, kit, textures } = build();
    module.enter(snapshotWith({ 'mc.et03': 'down' }));
    const disposed = new Set<unknown>();
    const watched = [...textures.created, kit.outlineMaterial];
    for (const resource of watched) resource.addEventListener('dispose', () => disposed.add(resource));
    module.dispose();
    expect({
      undisposedTextures: textures.created.filter((texture) => !disposed.has(texture)).map((t) => t.name),
      outlineDisposed: disposed.has(kit.outlineMaterial),
    }).toEqual({ undisposedTextures: [], outlineDisposed: false });
  });
});
