import {
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  PointLight,
  Scene,
  Vector3,
} from 'three';
import type { MachineId, MachineStatus, SceneSnapshot } from '../../model';
import { InvariantError } from '../../utils/errors';
import { CALIBRATION, LIGHT_RIGS, type LightRig, PALETTE, selectLightRig } from '../look';
import { createFabShell } from '../props/fab_shell';
import { createEtchMachine, type PropHandle } from '../props/machine';
import { createOht } from '../props/oht';
import type { SceneFactory } from '../scene_manager';
import type { ToonKit } from '../toon_kit';

// 04 §4.2 範例值；右側 ET-07～10 在 Stage 1 一律 run（D83）
export const FAB_BAY_MACHINES: {
  readonly left: readonly { id: MachineId; label: string; z: number }[];
  readonly right: readonly { label: string; z: number }[];
} = {
  left: [
    { id: 'mc.et03', label: 'ET-03', z: 2 },
    { id: 'mc.et04', label: 'ET-04', z: -2 },
    { id: 'mc.et05', label: 'ET-05', z: -6 },
    { id: 'mc.et06', label: 'ET-06', z: -10 },
  ],
  right: [
    { label: 'ET-07', z: 0 },
    { label: 'ET-08', z: -4 },
    { label: 'ET-09', z: -8 },
    { label: 'ET-10', z: -12 },
  ],
};

const LEFT = { x: -4.6, facing: 1 } as const;
const RIGHT = { x: 4.6, facing: -1 } as const;
// 04 §4.2 down 機台的紅燈錨點：機台中心 ＋ (facing × 1.5, 3.4, 0.4)
const ALARM_OFFSET = { x: 1.5, y: 3.4, z: 0.4 } as const;
// 04 §3.2 bayAlarm：工作比 50%
const ALARM_DUTY = 0.5;
const HERO = { position: [-2.45, 0, 2.3], yaw: -1.0, scale: 1.18, headPitch: 0.28 } as const;
// 範例構圖（04 §4.2 鏡頭預設表）
const CAMERA = {
  fov: 54,
  near: 0.1,
  far: 120,
  position: [3.1, 0.6, 8.6],
  target: [-1.5, 2.0, 0.6],
  roll: 0.11,
} as const;

interface BayMachine {
  readonly id: MachineId;
  readonly handle: PropHandle<MachineStatus>;
  readonly center: Vector3;
  readonly alarmAnchor: Vector3;
  status: MachineStatus;
}

// 範例 L580-600 的主角部件與姿勢；Stage 3 由 chibi_builder 取代
function createCalibrationHero(kit: ToonKit): { root: Group; head: Group } {
  const root = new Group();
  root.name = 'calibration_hero';
  root.position.set(...HERO.position);
  root.rotation.y = HERO.yaw;
  root.scale.setScalar(HERO.scale);
  for (const x of [-0.12, 0.12]) {
    kit.box(root, [0.2, 0.14, 0.34], PALETTE.suitBoot, [x, 0.07, 0.04], 0.03);
    kit.cylinder(root, [0.095, 0.1], 0.8, PALETTE.suit, [x, 0.54, 0], 0.03);
  }

  const torso = new Group();
  torso.position.set(0, 0.95, 0);
  torso.rotation.x = 0.14;
  root.add(torso);
  kit.cylinder(torso, [0.21, 0.27], 0.72, PALETTE.suit, [0, 0.25, 0], 0.03);
  kit.box(torso, [0.04, 0.6, 0.02], PALETTE.glove, [0, 0.25, 0.27], 0.01);

  for (const arm of [
    { x: 0.3, pitch: -1.05, roll: 0 },
    { x: -0.3, pitch: 0.1, roll: -0.08 },
  ]) {
    const group = new Group();
    group.position.set(arm.x, 0.52, 0);
    group.rotation.set(arm.pitch, 0, arm.roll);
    torso.add(group);
    kit.cylinder(group, [0.07, 0.075], 0.55, PALETTE.suit, [0, -0.28, 0], 0.03);
    kit.sphere(group, 0.085, PALETTE.glove, [0, -0.6, 0], 0.03);
  }

  const head = new Group();
  head.position.set(0, 0.88, 0.02);
  head.rotation.x = HERO.headPitch;
  torso.add(head);
  kit.sphere(head, 0.2, PALETTE.suit, [0, 0.12, 0], 0.03);
  kit.sphere(head, 0.13, PALETTE.heroSkin, [0, 0.1, 0.1], 0.02);
  kit.box(head, [0.3, 0.07, 0.06], PALETTE.eyeBand, [0, 0.17, 0.17], 0.02);
  kit.box(head, [0.26, 0.11, 0.07], PALETTE.mask, [0, 0.04, 0.17], 0.02);
  kit.box(torso, [0.03, 0.3, 0.02], PALETTE.lanyard, [0.16, 0.45, 0.25], 0.01);
  return { root, head };
}

// 顏色與距離由光組決定（04 §3.2）；光源數量固定，換光組不增減光源
function pointLight(name: string, position?: readonly [number, number, number]): PointLight {
  const light = new PointLight(0xffffff, 0, 0, CALIBRATION.pointDecay);
  light.name = name;
  if (position) light.position.set(...position);
  return light;
}

export const createFabBayScene: SceneFactory = (ctx) => {
  const { kit, tracker, textures } = ctx;
  const logger = ctx.logger.child('fab_bay');
  const scene = new Scene();
  scene.name = 'scn.fab_bay';
  const background = new Color();
  scene.background = background;

  const shell = createFabShell(kit, textures);
  scene.add(shell.root);
  tracker.track(shell);

  function placeMachine(label: string, side: typeof LEFT | typeof RIGHT, z: number): PropHandle<MachineStatus> {
    const handle = createEtchMachine(kit, textures, { label, facing: side.facing, initial: 'run' });
    handle.root.position.set(side.x, 0, z);
    scene.add(handle.root);
    tracker.track(handle);
    return handle;
  }

  const bay: BayMachine[] = FAB_BAY_MACHINES.left.map(({ id, label, z }) => ({
    id,
    handle: placeMachine(label, LEFT, z),
    center: new Vector3(LEFT.x, 0, z),
    alarmAnchor: new Vector3(LEFT.x + LEFT.facing * ALARM_OFFSET.x, ALARM_OFFSET.y, z + ALARM_OFFSET.z),
    status: 'run',
  }));
  const scenery = FAB_BAY_MACHINES.right.map(({ label, z }) => placeMachine(label, RIGHT, z));

  const oht = createOht(kit);
  scene.add(oht.root);
  tracker.track(oht);

  const hero = createCalibrationHero(kit);
  scene.add(hero.root);

  const hemisphere = new HemisphereLight();
  hemisphere.name = 'hemisphere_light';
  const sun = new DirectionalLight();
  sun.name = 'sun_light';
  const alarmLight = pointLight('alarm_light');
  const photoLight = pointLight('photo_light', [0, 3.5, -22]);
  const stagingLight = pointLight('staging_light');
  scene.add(hemisphere, sun, alarmLight, photoLight, stagingLight);

  const camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  camera.position.set(...CAMERA.position);
  camera.up.set(Math.sin(CAMERA.roll), Math.cos(CAMERA.roll), 0);
  camera.lookAt(...CAMERA.target);

  tracker.trackObject(scene);

  const warnedMissing = new Set<MachineId>();
  let rig: LightRig = LIGHT_RIGS.bayDay;
  let alarmActive = false;

  function readStatus(snapshot: SceneSnapshot, id: MachineId): MachineStatus {
    const status = snapshot.machines[id]?.status;
    if (status) return status;
    if (!warnedMissing.has(id)) {
      warnedMissing.add(id);
      logger.warn(`machine missing from snapshot: machine=${id}`);
    }
    return 'run';
  }

  function nearestDownMachine(): BayMachine | null {
    const [heroX, , heroZ] = HERO.position;
    const distance = (machine: BayMachine) => (machine.center.x - heroX) ** 2 + (machine.center.z - heroZ) ** 2;
    const down = bay.filter((machine) => machine.status === 'down');
    return down.reduce<BayMachine | null>(
      (best, next) => (best && distance(best) <= distance(next) ? best : next),
      null,
    );
  }

  function applyRig(next: LightRig): void {
    rig = next;
    hemisphere.color.setHex(next.hemisphere.sky);
    hemisphere.groundColor.setHex(next.hemisphere.ground);
    hemisphere.intensity = next.hemisphere.intensity;
    sun.color.setHex(next.directional.color);
    sun.intensity = next.directional.intensity;
    sun.position.set(...next.directional.position);
    background.setHex(next.background);
    if (!next.fog) scene.fog = null;
    else if (scene.fog instanceof Fog) {
      scene.fog.color.setHex(next.fog.color);
      scene.fog.near = next.fog.near;
      scene.fog.far = next.fog.far;
    } else scene.fog = new Fog(next.fog.color, next.fog.near, next.fog.far);
    if (next.lampPanel !== null) shell.setState(next.lampPanel);
    if (next.photo) {
      photoLight.color.setHex(next.photo.color);
      photoLight.distance = next.photo.distance;
      photoLight.position.set(...next.photo.position);
    }
    if (next.alarm) alarmLight.color.setHex(next.alarm.color);
  }

  function syncMachines(snapshot: SceneSnapshot): void {
    for (const machine of bay) {
      const status = readStatus(snapshot, machine.id);
      if (status === machine.status) continue;
      machine.status = status;
      machine.handle.setState(status);
    }
  }

  function apply(snapshot: SceneSnapshot): void {
    syncMachines(snapshot);
    const anchor = nearestDownMachine();
    const rigId = selectLightRig({
      scene: 'scn.fab_bay',
      mood: snapshot.mood,
      anyMachineDown: anchor !== null,
      zone: 'bay',
      daylight: snapshot.timeOfDay === 'night' ? 'night' : 'day',
    });
    if (!rigId) throw new InvariantError(`Light rig missing for 3D scene: scene=scn.fab_bay mood=${snapshot.mood}`);
    applyRig(LIGHT_RIGS[rigId]);
    const wasActive = alarmActive;
    alarmActive = anchor !== null && rig.alarm !== null;
    if (anchor) alarmLight.position.copy(anchor.alarmAnchor);
    // 範例在第一幀之前的紅燈強度；下一次 tick 就換成閃爍相位
    if (alarmActive && !wasActive) alarmLight.intensity = CALIBRATION.alarmInitial;
    if (!alarmActive) alarmLight.intensity = 0;
  }

  const animated: readonly PropHandle<unknown>[] = [...bay.map((machine) => machine.handle), ...scenery, oht];

  return {
    id: 'scn.fab_bay',
    scene,
    camera,
    enter: apply,
    update: apply,
    tick(dtSec, elapsedSec, motion) {
      const t = motion.reduced ? 0 : elapsedSec;
      for (const prop of animated) prop.tick(dtSec, elapsedSec, motion);
      photoLight.intensity = rig.photo ? rig.photo.base + rig.photo.amplitude * Math.sin(t * 2) : 0;
      if (alarmActive && rig.alarm) {
        alarmLight.intensity = (t * rig.alarm.hz) % 1 < ALARM_DUTY ? rig.alarm.bright : rig.alarm.dark;
        alarmLight.distance = rig.alarm.distance;
      } else alarmLight.intensity = 0;
      hero.root.position.y = Math.sin(t * 1.6) * 0.012;
      hero.head.rotation.x = HERO.headPitch + Math.sin(t * 1.1) * 0.04;
    },
    exit() {
      // Stage 1 沒有離場演出；淡出在 Stage 3 由 scene_manager 處理
    },
    dispose() {
      tracker.dispose();
    },
  };
};
