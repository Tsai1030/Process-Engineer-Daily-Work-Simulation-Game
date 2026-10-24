import {
  BackSide,
  BoxGeometry,
  type BufferGeometry,
  Color,
  type ColorRepresentation,
  CylinderGeometry,
  DataTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  NoColorSpace,
  type Object3D,
  RedFormat,
  SphereGeometry,
  type Texture,
} from 'three';
import { CALIBRATION, outlineFor, PALETTE } from './look';

export type OutlineStrategy = 'hull' | 'normalExtrude';

export const GRADIENT_STEPS = new Uint8Array(CALIBRATION.gradientSteps);

type Vec3 = [number, number, number];

export interface ToonKit {
  material(color: ColorRepresentation, options?: { map?: Texture; doubleSided?: boolean }): MeshToonMaterial;
  vertexColorMaterial(): MeshToonMaterial;
  readonly outlineMaterial: MeshBasicMaterial;
  box(parent: Object3D, size: Vec3, color: ColorRepresentation | MeshToonMaterial, at: Vec3, outline?: number): Mesh;
  cylinder(
    parent: Object3D,
    radii: [number, number],
    height: number,
    color: ColorRepresentation | MeshToonMaterial,
    at: Vec3,
    outline?: number,
  ): Mesh;
  sphere(
    parent: Object3D,
    radius: number,
    color: ColorRepresentation | MeshToonMaterial,
    at: Vec3,
    outline?: number,
  ): Mesh;
  dispose(): void;
}

function markShared(resource: { userData: object }): void {
  Object.assign(resource.userData, { shared: true });
}

const CYLINDER_SEGMENTS = 16;
const SPHERE_SEGMENTS: [number, number] = [18, 14];

export function createToonKit(): ToonKit {
  const gradient = new DataTexture(GRADIENT_STEPS, GRADIENT_STEPS.length, 1, RedFormat);
  gradient.minFilter = NearestFilter;
  gradient.magFilter = NearestFilter;
  gradient.generateMipmaps = false;
  gradient.colorSpace = NoColorSpace;
  gradient.needsUpdate = true;

  const outlineMaterial = new MeshBasicMaterial({ color: PALETTE.outline, side: BackSide });
  markShared(outlineMaterial);

  const materials = new Map<string, MeshToonMaterial>();
  const geometries = new Map<string, BufferGeometry>();
  let vertexColors: MeshToonMaterial | null = null;

  function createMaterial(parameters: ConstructorParameters<typeof MeshToonMaterial>[0]) {
    const created = new MeshToonMaterial({ ...parameters, gradientMap: gradient });
    markShared(created);
    return created;
  }

  function material(
    color: ColorRepresentation,
    options: { map?: Texture; doubleSided?: boolean } = {},
  ): MeshToonMaterial {
    const { map, doubleSided = false } = options;
    const key = `${new Color(color).getHexString()}|${map?.uuid ?? ''}|${doubleSided ? 'double' : 'front'}`;
    let cached = materials.get(key);
    if (!cached) {
      cached = createMaterial({ color, map: map ?? null, ...(doubleSided ? { side: DoubleSide } : {}) });
      materials.set(key, cached);
    }
    return cached;
  }

  function geometry(key: string, create: () => BufferGeometry): BufferGeometry {
    let cached = geometries.get(key);
    if (!cached) {
      cached = create();
      markShared(cached);
      geometries.set(key, cached);
    }
    return cached;
  }

  function addBody(
    parent: Object3D,
    body: BufferGeometry,
    hull: BufferGeometry | null,
    color: ColorRepresentation | MeshToonMaterial,
    at: Vec3,
  ): Mesh {
    const mesh = new Mesh(body, color instanceof MeshToonMaterial ? color : material(color));
    mesh.position.set(...at);
    if (hull) {
      const shell = new Mesh(hull, outlineMaterial);
      shell.name = 'outline';
      mesh.add(shell);
    }
    parent.add(mesh);
    return mesh;
  }

  return {
    material,
    vertexColorMaterial() {
      vertexColors ??= createMaterial({ vertexColors: true, color: 0xffffff });
      return vertexColors;
    },
    outlineMaterial,
    box(parent, [w, h, d], color, at, outline = outlineFor([w, h, d])) {
      const body = geometry(`box|${w}|${h}|${d}`, () => new BoxGeometry(w, h, d));
      const t = outline;
      const hull =
        t === 0
          ? null
          : geometry(
              `box|${w + 2 * t}|${h + 2 * t}|${d + 2 * t}`,
              () => new BoxGeometry(w + 2 * t, h + 2 * t, d + 2 * t),
            );
      return addBody(parent, body, hull, color, at);
    },
    cylinder(parent, [rTop, rBottom], height, color, at, outline) {
      const widest = 2 * Math.max(rTop, rBottom);
      const t = outline ?? outlineFor([widest, height, widest]);
      const body = geometry(
        `cyl|${rTop}|${rBottom}|${height}`,
        () => new CylinderGeometry(rTop, rBottom, height, CYLINDER_SEGMENTS),
      );
      const hull =
        t === 0
          ? null
          : geometry(
              `cyl|${rTop + t}|${rBottom + t}|${height + 2 * t}`,
              () => new CylinderGeometry(rTop + t, rBottom + t, height + 2 * t, CYLINDER_SEGMENTS),
            );
      return addBody(parent, body, hull, color, at);
    },
    sphere(parent, radius, color, at, outline) {
      const t = outline ?? outlineFor([2 * radius, 2 * radius, 2 * radius]);
      const body = geometry(`sph|${radius}`, () => new SphereGeometry(radius, ...SPHERE_SEGMENTS));
      const hull =
        t === 0 ? null : geometry(`sph|${radius + t}`, () => new SphereGeometry(radius + t, ...SPHERE_SEGMENTS));
      return addBody(parent, body, hull, color, at);
    },
    dispose() {
      for (const cached of materials.values()) cached.dispose();
      materials.clear();
      vertexColors?.dispose();
      vertexColors = null;
      for (const cached of geometries.values()) cached.dispose();
      geometries.clear();
      outlineMaterial.dispose();
      gradient.dispose();
    },
  };
}
