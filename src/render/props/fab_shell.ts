import {
  BoxGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  type Texture,
} from 'three';
import type { CanvasTextureFactory } from '../canvas_textures';
import { PALETTE } from '../look';
import type { ToonKit } from '../toon_kit';
import type { PropHandle } from './machine';

const FLOOR_REPEAT = [24, 100] as const;
const WALL_REPEAT = [7, 1] as const;
const HAZARD_REPEAT = [16, 1] as const;
const LAMP_PANEL_X = [-3, 3] as const;
const LAMP_PANEL_Z = [8, 3, -2, -7, -12] as const;
const GATE_POST_X = [-6, -2.4, 2.4, 6] as const;

export function createFabShell(kit: ToonKit, textures: CanvasTextureFactory): PropHandle<number> {
  const root = new Group();
  root.name = 'fab_shell';
  const ownedGeometries: PlaneGeometry[] = [];
  const ownedBoxes: BoxGeometry[] = [];
  const ownedMaterials: Material[] = [];
  const ownedTextures: Texture[] = [];

  function plane(
    size: [number, number],
    material: Material,
    at: [number, number, number],
    rotation: { x?: number; y?: number } = {},
  ): Mesh {
    const geometry = new PlaneGeometry(...size);
    ownedGeometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.rotation.set(rotation.x ?? 0, rotation.y ?? 0, 0);
    mesh.position.set(...at);
    root.add(mesh);
    return mesh;
  }

  function basic(parameters: ConstructorParameters<typeof MeshBasicMaterial>[0]): MeshBasicMaterial {
    const material = new MeshBasicMaterial(parameters);
    ownedMaterials.push(material);
    return material;
  }

  function texture<T extends Texture>(created: T, repeat?: readonly [number, number]): T {
    if (repeat) created.repeat.set(...repeat);
    ownedTextures.push(created);
    return created;
  }

  plane([13, 100], kit.material(0xffffff, { map: texture(textures.floor(), FLOOR_REPEAT) }), [0, 0, -30], {
    x: -Math.PI / 2,
  });

  const wallMaterial = kit.material(0xffffff, { map: texture(textures.wall(), WALL_REPEAT), doubleSided: true });
  for (const side of [-1, 1]) {
    plane([28, 6], wallMaterial, [side * 6.2, 3, -2], { y: (-side * Math.PI) / 2 });
    kit.box(root, [0.1, 0.1, 40], PALETTE.hazardYellow, [side * 3.15, 0.04, -8], 0.02);
  }

  plane([13, 60], kit.material(PALETTE.ceiling, { doubleSided: true }), [0, 6, -14], { x: Math.PI / 2 });

  const lampPanelMaterial = basic({ color: PALETTE.ceilingLamp });
  const lampPanelGeometry = new BoxGeometry(0.9, 0.05, 3);
  ownedBoxes.push(lampPanelGeometry);
  for (const x of LAMP_PANEL_X) {
    for (const z of LAMP_PANEL_Z) {
      const panel = new Mesh(lampPanelGeometry, lampPanelMaterial);
      panel.name = 'lamp_panel';
      panel.position.set(x, 5.96, z);
      root.add(panel);
    }
  }

  const photoWallMaterial = basic({ color: PALETTE.photoWall, side: DoubleSide });
  plane([16, 6], photoWallMaterial, [-6.2, 3, -24], { y: Math.PI / 2 });
  plane([16, 6], photoWallMaterial, [6.2, 3, -24], { y: -Math.PI / 2 });
  plane([13, 6], photoWallMaterial, [0, 3, -32]);
  plane([13, 16], basic({ color: PALETTE.photoCeiling, side: DoubleSide }), [0, 6, -24], { x: Math.PI / 2 });
  plane([13, 16], basic({ color: PALETTE.photoFloor }), [0, 0.02, -24], { x: -Math.PI / 2 });
  plane([13, 0.8], basic({ map: texture(textures.hazard(), HAZARD_REPEAT) }), [0, 0.04, -16.4], { x: -Math.PI / 2 });

  for (const x of GATE_POST_X) kit.box(root, [0.3, 6, 0.3], PALETTE.pillar, [x, 3, -16], 0.04);
  kit.box(root, [13, 0.3, 0.3], PALETTE.pillar, [0, 5.85, -16], 0.04);

  const glassMaterial = basic({ color: PALETTE.photoGlass, transparent: true, opacity: 0.22, side: DoubleSide });
  for (const x of [-4.2, 4.2]) plane([3.4, 5.6], glassMaterial, [x, 2.9, -16]);

  [-4.4, 4.4].forEach((x, i) => {
    kit.box(root, [2.2, 2.6, 2.6], PALETTE.photoTool, [x, 1.3, -21 - i * 4], 0.05);
    kit.box(root, [1.6, 0.5, 1.8], PALETTE.photoToolTop, [x, 2.85, -21 - i * 4], 0.05);
  });

  plane([4, 1], basic({ map: texture(textures.photoSign()) }), [0, 5.1, -15.8]);

  return {
    root,
    setState(color) {
      lampPanelMaterial.color.setHex(color);
    },
    tick() {
      // no animation
    },
    dispose() {
      for (const geometry of [...ownedGeometries, ...ownedBoxes]) geometry.dispose();
      for (const material of ownedMaterials) material.dispose();
      for (const owned of ownedTextures) owned.dispose();
    },
  };
}
