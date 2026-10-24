import { describe, expect, test } from 'bun:test';
import type { Mesh, MeshBasicMaterial, Object3D, PlaneGeometry } from 'three';
import { createFakeTextureFactory, defined } from '../../../test/fixtures';
import { PALETTE } from '../look';
import { createToonKit } from '../toon_kit';
import { createFabShell } from './fab_shell';
import { createFoup } from './foup';
import { createEtchMachine } from './machine';
import { createOht } from './oht';

// 01 §9.5
const TRIANGLE_BUDGET = { machine: 1200, foup: 150, ohtCar: 300, fabShell: 2000 } as const;
const MOVING = { reduced: false } as const;
const STILL = { reduced: true } as const;

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

function meshNamed(root: Object3D, name: string): Mesh {
  return defined(root.getObjectByName(name), name) as Mesh;
}

function basicMaterial(root: Object3D, name: string): MeshBasicMaterial {
  return meshNamed(root, name).material as MeshBasicMaterial;
}

function screenMapName(root: Object3D): string {
  return basicMaterial(root, 'screen').map?.name ?? '';
}

function lampColors(root: Object3D): number[] {
  return ['lamp_green', 'lamp_yellow', 'lamp_red'].map((name) => basicMaterial(root, name).color.getHex());
}

function newMachine(facing: 1 | -1 = 1) {
  const textures = createFakeTextureFactory();
  const machine = createEtchMachine(createToonKit(), textures, { label: 'ET-03', facing, initial: 'run' });
  return { machine, textures };
}

describe('prop triangle budgets', () => {
  test('every Stage 1 prop stays within its budget from spec 01 section 9.5', () => {
    const kit = createToonKit();
    const textures = createFakeTextureFactory();
    const oht = createOht(kit);
    const measured = {
      machine: triangles(createEtchMachine(kit, textures, { label: 'ET-03', facing: 1, initial: 'down' }).root),
      foup: triangles(createFoup(kit).root),
      ohtCar: triangles(defined(oht.root.getObjectByName('oht_car'), 'oht_car')),
      fabShell: triangles(createFabShell(kit, textures).root),
    };
    const over = Object.entries(measured).filter(
      ([key, count]) => count > TRIANGLE_BUDGET[key as keyof typeof TRIANGLE_BUDGET],
    );
    expect(over).toEqual([]);
  });
});

describe('createEtchMachine', () => {
  test.each([
    ['run', [PALETTE.lampGreenOn, PALETTE.lampYellowOff, PALETTE.lampRedOff], 'screen:ET-03:run:false'],
    ['warn', [PALETTE.lampGreenOff, PALETTE.lampYellowOn, PALETTE.lampRedOff], 'screen:ET-03:warn:false'],
    ['down', [PALETTE.lampGreenOff, PALETTE.lampYellowOff, PALETTE.lampRedOn], 'screen:ET-03:down:false'],
  ] as const)('status %p lights %p and shows %p at the start of the blink cycle', (status, lamps, screen) => {
    const { machine } = newMachine();
    machine.setState(status);
    machine.tick(0.016, 0, MOVING);
    expect({ lamps: lampColors(machine.root), screen: screenMapName(machine.root) }).toEqual({
      lamps: [...lamps],
      screen,
    });
  });

  test('a down machine blinks at 1.7 Hz and holds the bright phase under reduced motion', () => {
    const { machine } = newMachine();
    machine.setState('down');
    machine.tick(0.016, 0.3, MOVING);
    const dark = { red: lampColors(machine.root)[2], screen: screenMapName(machine.root) };
    machine.tick(0.016, 0.3, STILL);
    const held = { red: lampColors(machine.root)[2], screen: screenMapName(machine.root) };
    expect({ dark, held }).toEqual({
      dark: { red: PALETTE.lampRedOff, screen: 'screen:ET-03:down:true' },
      held: { red: PALETTE.lampRedOn, screen: 'screen:ET-03:down:false' },
    });
  });

  test('switching back and forth reuses one screen texture per status', () => {
    const { machine, textures } = newMachine();
    for (const status of ['down', 'run', 'down'] as const) {
      machine.setState(status);
      machine.tick(0.016, 0.3, MOVING);
    }
    const names = textures.created.map((texture) => texture.name).filter((name) => name.startsWith('screen:ET-03:'));
    expect(names.sort()).toEqual(['screen:ET-03:down:false', 'screen:ET-03:down:true', 'screen:ET-03:run:false']);
  });

  test('the screen sits on the side the machine faces', () => {
    const screenX = (facing: 1 | -1) => meshNamed(newMachine(facing).machine.root, 'screen').position.x;
    expect(screenX(1)).toBeCloseTo(1.35);
    expect(screenX(-1)).toBeCloseTo(-1.35);
  });
});

describe('createFoup', () => {
  test('a held FOUP shows the larger red tag and a normal one the small white tag', () => {
    const foup = createFoup(createToonKit());
    const tag = () => {
      const mesh = meshNamed(foup.root, 'hold_tag');
      const { width, height } = (mesh.geometry as PlaneGeometry).parameters;
      return { width, height, color: (mesh.material as MeshBasicMaterial).color.getHex() };
    };
    const initial = tag();
    foup.setState('hold');
    const held = tag();
    foup.setState('normal');
    expect([initial, held, tag()]).toEqual([
      { width: 0.12, height: 0.08, color: PALETTE.holdTagWhite },
      { width: 0.2, height: 0.14, color: PALETTE.holdTagRed },
      { width: 0.12, height: 0.08, color: PALETTE.holdTagWhite },
    ]);
  });
});

describe('createOht', () => {
  test.each([
    [0, MOVING, 8],
    [10, MOVING, -18],
    [10, STILL, -2],
  ] as const)('at %ps with %p the car sits at z=%p', (elapsed, motion, z) => {
    const oht = createOht(createToonKit());
    oht.tick(0.016, elapsed, motion);
    expect(meshNamed(oht.root, 'oht_car').position.z).toBeCloseTo(z);
  });

  test('four hangers hold the rail at the example z positions', () => {
    const zs = createOht(createToonKit()).root.children.filter((child) => child.name === 'oht_hanger');
    expect(zs.map((hanger) => hanger.position.z)).toEqual([8, 2, -4, -10]);
  });
});

describe('createFabShell', () => {
  test('setState recolours the one lamp panel material shared by all ten panels', () => {
    const shell = createFabShell(createToonKit(), createFakeTextureFactory());
    shell.setState(0x123456);
    const panels = shell.root.children.filter((child) => child.name === 'lamp_panel') as Mesh[];
    expect({
      count: panels.length,
      colors: [...new Set(panels.map((p) => (p.material as MeshBasicMaterial).color.getHex()))],
    }).toEqual({
      count: 10,
      colors: [0x123456],
    });
  });
});
