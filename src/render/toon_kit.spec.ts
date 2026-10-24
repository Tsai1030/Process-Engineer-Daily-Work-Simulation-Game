import { describe, expect, it } from 'bun:test';
import { type BoxGeometry, Group, type Mesh, NearestFilter, NoColorSpace, RedFormat, type Texture } from 'three';
import { createToonKit } from './toon_kit';

type Shared = { shared?: boolean };

function boxParameters(mesh: Mesh): { width: number; height: number; depth: number } {
  const { width, height, depth } = (mesh.geometry as BoxGeometry).parameters;
  return { width, height, depth };
}

describe('createToonKit', () => {
  it('the gradient map holds the linearized three steps as an unfiltered red data texture', () => {
    const map = createToonKit().material(0xffffff).gradientMap as Texture;
    expect({
      steps: Array.from((map.image as { data: Uint8Array }).data),
      format: map.format,
      min: map.minFilter,
      mag: map.magFilter,
      mips: map.generateMipmaps,
      space: map.colorSpace,
    }).toEqual({
      steps: [23, 96, 255],
      format: RedFormat,
      min: NearestFilter,
      mag: NearestFilter,
      mips: false,
      space: NoColorSpace,
    });
  });

  it('materials are cached by colour, map and side', () => {
    const kit = createToonKit();
    const a = kit.material(0xff0000);
    expect([
      a === kit.material(0xff0000),
      a === kit.material(0xff0000, { doubleSided: true }),
      a === kit.material(0x00ff00),
    ]).toEqual([true, false, false]);
  });

  it('box adds a body and a hull grown by the outline on every side', () => {
    const kit = createToonKit();
    const group = new Group();
    const mesh = kit.box(group, [2, 1, 0.5], 0xff0000, [1, 2, 3], 0.05);
    const outline = mesh.getObjectByName('outline') as Mesh;
    const hull = boxParameters(outline);
    expect({
      inParent: group.children.includes(mesh),
      position: mesh.position.toArray(),
      body: boxParameters(mesh),
      hullMaterialIsShared: outline.material === kit.outlineMaterial,
    }).toEqual({
      inParent: true,
      position: [1, 2, 3],
      body: { width: 2, height: 1, depth: 0.5 },
      hullMaterialIsShared: true,
    });
    expect([hull.width, hull.height, hull.depth].map((v) => Number(v.toFixed(6)))).toEqual([2.1, 1.1, 0.6]);
  });

  it('the default outline follows outlineFor', () => {
    const kit = createToonKit();
    const mesh = kit.box(new Group(), [0.3, 0.2, 0.1], 0xff0000, [0, 0, 0]);
    const hull = boxParameters(mesh.getObjectByName('outline') as Mesh);
    expect(Number(hull.width.toFixed(6))).toEqual(0.36);
  });

  it('outline 0 builds no hull', () => {
    const mesh = createToonKit().box(new Group(), [1, 1, 1], 0xff0000, [0, 0, 0], 0);
    expect(mesh.getObjectByName('outline')).toBeUndefined();
  });

  it('kit resources are marked shared so scene trackers skip them', () => {
    const mesh = createToonKit().box(new Group(), [1, 1, 1], 0xff0000, [0, 0, 0]);
    expect([
      (mesh.material as { userData: Shared }).userData.shared,
      (mesh.geometry.userData as Shared).shared,
    ]).toEqual([true, true]);
  });

  it('the vertex colour material is a single white instance with vertex colours', () => {
    const kit = createToonKit();
    const material = kit.vertexColorMaterial();
    expect({
      same: material === kit.vertexColorMaterial(),
      vertexColors: material.vertexColors,
      hex: material.color.getHex(),
    }).toEqual({ same: true, vertexColors: true, hex: 0xffffff });
  });
});
