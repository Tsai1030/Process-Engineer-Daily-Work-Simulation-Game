import { Group } from 'three';
import { PALETTE } from '../look';
import type { ToonKit } from '../toon_kit';
import { createFoup } from './foup';
import type { PropHandle } from './machine';

const HANGER_Z = [8, 2, -4, -10] as const;
const CAR_SPEED = 2.6;
const CAR_START_Z = 8;
const CAR_LOOP_LENGTH = 44;
const CAR_REDUCED_Z = -2;

export function createOht(kit: ToonKit): PropHandle<null> {
  const root = new Group();
  root.name = 'oht';

  const rail = kit.box(root, [0.28, 0.22, 70], PALETTE.railSteel, [0, 5.62, -14], 0.04);
  rail.userData['static'] = true;
  for (const z of HANGER_Z) {
    const hanger = kit.box(root, [0.12, 0.4, 0.12], PALETTE.railSteel, [0, 5.82, z], 0.03);
    hanger.name = 'oht_hanger';
    hanger.userData['static'] = true;
  }

  const car = new Group();
  car.name = 'oht_car';
  root.add(car);
  kit.box(car, [0.9, 0.34, 1.7], PALETTE.ohtBody, [0, 5.2, 0], 0.05);
  kit.box(car, [0.92, 0.1, 0.5], PALETTE.ohtStripe, [0, 5.2, 0.55], 0.03);
  kit.box(car, [0.08, 0.5, 0.08], PALETTE.toolBlack, [-0.26, 4.8, 0], 0.02);
  kit.box(car, [0.08, 0.5, 0.08], PALETTE.toolBlack, [0.26, 4.8, 0], 0.02);
  kit.box(car, [0.7, 0.12, 0.7], PALETTE.railSteel, [0, 4.5, 0], 0.04);
  const foup = createFoup(kit);
  foup.root.position.set(0, 4.15, 0);
  car.add(foup.root);
  car.position.z = CAR_START_Z;

  return {
    root,
    setState() {
      // the car has no state
    },
    tick(_dtSec, elapsedSec, motion) {
      car.position.z = motion.reduced ? CAR_REDUCED_Z : CAR_START_Z - ((elapsedSec * CAR_SPEED) % CAR_LOOP_LENGTH);
    },
    dispose() {
      foup.dispose();
    },
  };
}
