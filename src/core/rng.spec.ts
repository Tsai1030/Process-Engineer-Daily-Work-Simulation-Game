import { describe, expect, test } from 'bun:test';
import { InvariantError } from '../utils/errors';
import { createRng, type Rng } from './rng';

// 公開的 mulberry32 演算法在 state=1 時的前三個 uint32 輸出（以參考實作另外算出）
const MULBERRY32_STATE_1_REFERENCE = [2693262067, 11749833, 2265367787];
const RUN_SEED = 20270301;
const WARMUP_DRAWS = 17;
const SAMPLE_DRAWS = 64;
const DISTRIBUTION_DRAWS = 2000;

const draw = <T>(count: number, next: () => T): T[] => Array.from({ length: count }, next);
const inclusiveRange = (min: number, max: number): number[] => Array.from({ length: max - min + 1 }, (_, i) => min + i);

describe('createRng', () => {
  test('state 1 reproduces the published mulberry32 reference outputs', () => {
    const rng = createRng(1);
    expect(draw(MULBERRY32_STATE_1_REFERENCE.length, () => rng.nextUint32())).toEqual(MULBERRY32_STATE_1_REFERENCE);
  });

  test('a rng recreated from a mid-run state continues with the identical sequence', () => {
    const original = createRng(RUN_SEED);
    draw(WARMUP_DRAWS, () => original.next());
    const snapshot = original.getState();
    const expected = draw(SAMPLE_DRAWS, () => original.next());
    const restored = createRng(snapshot);
    expect(draw(SAMPLE_DRAWS, () => restored.next())).toEqual(expected);
  });
});

describe('Rng.int', () => {
  test.each([
    [0, 0],
    [1, 6],
    [-3, 3],
  ])('int(%p, %p) yields exactly every value of the inclusive range over many draws', (min, max) => {
    const rng = createRng(RUN_SEED);
    const seen = [...new Set(draw(DISTRIBUTION_DRAWS, () => rng.int(min, max)))].sort((a, b) => a - b);
    expect(seen).toEqual(inclusiveRange(min, max));
  });
});

// 下列預期值都由 state=1 的參考輸出推得（以獨立的參考實作另外算過）：
// 第一個 uint32 ＝ 2693262067 → next() ＝ 2693262067 / 2^32 ≈ 0.62707
// 抽一次之後 state ＝ (1 + 0x6d2b79f5) mod 2^32 ＝ 1831565814
const STATE_AFTER_ONE_DRAW_FROM_1 = 1831565814;
const FIRST_UINT32_FROM_1 = 2693262067;

describe('Rng draws from state 1', () => {
  test('every primitive consumes exactly one step and maps the first output as specified', () => {
    const outcomes = [
      (r: Rng) => r.int(1, 6), // 1 + floor(0.627 × 6) = 4
      (r: Rng) => r.chance(0.6), // 0.627 < 0.6 → false
      (r: Rng) => r.chance(0.7), // 0.627 < 0.7 → true
      (r: Rng) =>
        r.pickWeighted([
          { item: 'a', weight: 1 },
          { item: 'b', weight: 1 },
          { item: 'c', weight: 2 },
        ]), // 0.627 × 4 = 2.51 → 'c'
      (r: Rng) =>
        r.pickWeighted([
          { item: 'a', weight: 0 },
          { item: 'b', weight: -1 },
        ]), // 全部 ≤0 → null
      (r: Rng) => r.forkSeed(),
    ].map((draw) => {
      const rng = createRng(1);
      return { value: draw(rng), state: rng.getState() };
    });
    expect(outcomes).toEqual([
      { value: 4, state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: false, state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: true, state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: 'c', state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: null, state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: FIRST_UINT32_FROM_1, state: STATE_AFTER_ONE_DRAW_FROM_1 },
    ]);
  });
});

describe('createRng input checks', () => {
  // Review Focus 5：損壞的 rngState 不能默默變成另一串亂數
  test.each([-1, 1.5, 4294967296, Number.NaN])('rejects the state %p', (state) => {
    expect(() => createRng(state)).toThrow(InvariantError);
  });
  test('accepts the largest uint32 state', () => {
    expect(createRng(4294967295).getState()).toBe(4294967295);
  });
  test('rejects an empty int range', () => {
    expect(() => createRng(1).int(3, 1)).toThrow(InvariantError);
  });
});
