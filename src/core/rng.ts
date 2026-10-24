import { InvariantError } from '../utils/errors';

const UINT32_SPAN = 4294967296;
const MAX_UINT32 = 4294967295;
const MULBERRY32_INCREMENT = 0x6d2b79f5;

export interface Rng {
  /** [0, 1) */
  next(): number;
  nextUint32(): number;
  /** 含兩端 */
  int(min: number, max: number): number;
  /** 一定消耗一次 */
  chance(p: number): boolean;
  /** 一定消耗一次；全部權重 ≤0 時回傳 null */
  pickWeighted<T>(items: readonly { item: T; weight: number }[]): T | null;
  /** 回傳給子系統（小遊戲、NPC 考績模擬）用的種子；消耗一次 */
  forkSeed(): number;
  getState(): number;
}

/** mulberry32；state 是 uint32。新遊戲用種子當 state，讀檔用存下的 rngState */
export function createRng(state: number): Rng {
  if (!Number.isInteger(state) || state < 0 || state > MAX_UINT32) {
    throw new InvariantError(`Invalid rng state: value=${state}`);
  }

  let a = state;

  const nextUint32 = (): number => {
    a = (a + MULBERRY32_INCREMENT) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };

  const next = (): number => nextUint32() / UINT32_SPAN;

  return {
    next,
    nextUint32,
    int: (min, max) => {
      if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
        throw new InvariantError(`Invalid int range: min=${min} max=${max}`);
      }
      return min + Math.floor(next() * (max - min + 1));
    },
    chance: (p) => next() < p,
    pickWeighted: <T>(items: readonly { item: T; weight: number }[]): T | null => {
      const roll = next();
      const total = items.reduce((sum, entry) => sum + Math.max(entry.weight, 0), 0);
      if (total <= 0) {
        return null;
      }
      const target = roll * total;
      let cumulative = 0;
      let chosen: T | null = null;
      for (const entry of items) {
        if (entry.weight <= 0) {
          continue;
        }
        cumulative += entry.weight;
        chosen = entry.item;
        if (target < cumulative) {
          break;
        }
      }
      return chosen;
    },
    forkSeed: nextUint32,
    getState: () => a >>> 0,
  };
}
