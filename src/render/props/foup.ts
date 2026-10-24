import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { PALETTE } from '../look';
import type { ToonKit } from '../toon_kit';
import type { PropHandle } from './machine';

const TAG_SIZE = { normal: [0.12, 0.08], hold: [0.2, 0.14] } as const;
const TAG_COLOR = { normal: PALETTE.holdTagWhite, hold: PALETTE.holdTagRed } as const;

export function createFoup(kit: ToonKit): PropHandle<'normal' | 'hold'> {
  const root = new Group();
  root.name = 'foup';
  kit.box(root, [0.46, 0.4, 0.46], PALETTE.foupShell, [0, 0, 0], 0.04);
  kit.box(root, [0.34, 0.06, 0.12], PALETTE.foupHandle, [0, 0.25, 0], 0.03);
  kit.box(root, [0.4, 0.3, 0.02], PALETTE.foupDoor, [0, -0.02, 0.24], 0.02);

  const tagMaterial = new MeshBasicMaterial({ color: TAG_COLOR.normal });
  const tag = new Mesh(new PlaneGeometry(...TAG_SIZE.normal), tagMaterial);
  tag.name = 'hold_tag';
  tag.position.set(0.12, 0.08, 0.255);
  root.add(tag);

  return {
    root,
    setState(state) {
      tag.geometry.dispose();
      tag.geometry = new PlaneGeometry(...TAG_SIZE[state]);
      tagMaterial.color.setHex(TAG_COLOR[state]);
    },
    tick() {
      // no animation
    },
    dispose() {
      tag.geometry.dispose();
      tagMaterial.dispose();
    },
  };
}
