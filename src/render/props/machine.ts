import { Group, Mesh, MeshBasicMaterial, type Object3D, PlaneGeometry, type Texture } from 'three';
import type { MachineStatus, MotionPolicy } from '../../model';
import type { CanvasTextureFactory } from '../canvas_textures';
import { PALETTE } from '../look';
import type { ToonKit } from '../toon_kit';

export interface PropHandle<S> {
  readonly root: Object3D;
  setState(state: S): void;
  tick(dtSec: number, elapsedSec: number, motion: MotionPolicy): void;
  dispose(): void;
}

const BLINK_HZ = 1.7;
const BLINK_BRIGHT_FRACTION = 0.5;

const LAMPS = [
  { key: 'green', name: 'lamp_green', on: PALETTE.lampGreenOn, off: PALETTE.lampGreenOff, y: 3.34 },
  { key: 'yellow', name: 'lamp_yellow', on: PALETTE.lampYellowOn, off: PALETTE.lampYellowOff, y: 3.54 },
  { key: 'red', name: 'lamp_red', on: PALETTE.lampRedOn, off: PALETTE.lampRedOff, y: 3.74 },
] as const;
const LIT_LAMP: Record<MachineStatus, (typeof LAMPS)[number]['key']> = { run: 'green', warn: 'yellow', down: 'red' };

export function createEtchMachine(
  kit: ToonKit,
  textures: CanvasTextureFactory,
  params: { label: string; facing: 1 | -1; initial: MachineStatus },
): PropHandle<MachineStatus> {
  const { label, facing } = params;
  const dir = facing;
  const fx = facing * 1.2;
  const root = new Group();
  root.name = `machine:${label}`;

  const staticParts = [
    kit.box(root, [2.4, 2.7, 3.2], PALETTE.toolBody, [0, 1.35, 0], 0.05),
    kit.box(root, [2.44, 0.28, 3.24], PALETTE.toolBand, [0, 2.8, 0], 0.04),
    kit.box(root, [2.44, 0.3, 3.24], PALETTE.toolBand, [0, 0.15, 0], 0.04),
    kit.box(root, [0.08, 1.4, 1.3], PALETTE.toolDoor, [fx + dir * 0.04, 1.1, -0.85], 0.03),
    kit.box(root, [0.1, 0.5, 0.06], PALETTE.toolBlack, [fx + dir * 0.1, 1.1, -0.3], 0.02),
    kit.box(root, [0.14, 0.8, 1.25], PALETTE.toolBlack, [fx + dir * 0.07, 1.7, 0.75], 0.04),
    kit.cylinder(root, [0.035, 0.035], 0.4, PALETTE.toolBlack, [dir * 0.9, 3.1, 1.3], 0.03),
  ];
  for (const part of staticParts) part.userData['static'] = true;

  const ownedGeometries: PlaneGeometry[] = [];
  const ownedMaterials: MeshBasicMaterial[] = [];
  const facingY = (dir * Math.PI) / 2;

  function addPlane(
    name: string,
    width: number,
    height: number,
    material: MeshBasicMaterial,
    at: [number, number, number],
  ) {
    const geometry = new PlaneGeometry(width, height);
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.rotation.y = facingY;
    mesh.position.set(...at);
    root.add(mesh);
    ownedGeometries.push(geometry);
    ownedMaterials.push(material);
    return mesh;
  }

  const screenMaterial = new MeshBasicMaterial();
  addPlane('screen', 1.1, 0.68, screenMaterial, [fx + dir * 0.15, 1.7, 0.75]);
  const signTexture = textures.sign(label);
  addPlane('sign', 1.2, 0.3, new MeshBasicMaterial({ map: signTexture }), [fx + dir * 0.04, 2.4, 0.75]);

  const lampMaterials = Object.fromEntries(
    LAMPS.map((lamp) => {
      const material = new MeshBasicMaterial({ color: lamp.off });
      const mesh = kit.cylinder(root, [0.12, 0.12], 0.17, PALETTE.toolBlack, [dir * 0.9, lamp.y, 1.3], 0.03);
      mesh.material = material;
      mesh.name = lamp.name;
      ownedMaterials.push(material);
      return [lamp.key, material];
    }),
  ) as Record<(typeof LAMPS)[number]['key'], MeshBasicMaterial>;

  const screenTextures = new Map<string, Texture>();
  function screenTexture(status: MachineStatus, inverted: boolean): Texture {
    const key = `${status}|${inverted}`;
    let texture = screenTextures.get(key);
    if (!texture) {
      texture = textures.screen(label, status, inverted);
      screenTextures.set(key, texture);
    }
    return texture;
  }

  let status = params.initial;
  let brightPhase = true;

  function applyView(): void {
    const lit = LIT_LAMP[status];
    for (const lamp of LAMPS) {
      const isLit = lamp.key === lit && (lamp.key !== 'red' || brightPhase);
      lampMaterials[lamp.key].color.setHex(isLit ? lamp.on : lamp.off);
    }
    screenMaterial.map = screenTexture(status, status === 'down' && !brightPhase);
    screenMaterial.needsUpdate = true;
  }

  applyView();

  return {
    root,
    setState(next) {
      status = next;
      brightPhase = true;
      if (next === 'down') screenTexture('down', true);
      applyView();
    },
    tick(_dtSec, elapsedSec, motion) {
      if (status !== 'down') return;
      const t = motion.reduced ? 0 : elapsedSec;
      const bright = (t * BLINK_HZ) % 1 < BLINK_BRIGHT_FRACTION;
      if (bright === brightPhase) return;
      brightPhase = bright;
      applyView();
    },
    dispose() {
      for (const geometry of ownedGeometries) geometry.dispose();
      for (const material of ownedMaterials) material.dispose();
      signTexture.dispose();
      for (const texture of screenTextures.values()) texture.dispose();
    },
  };
}
