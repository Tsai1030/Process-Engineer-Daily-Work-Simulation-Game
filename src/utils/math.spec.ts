import { describe, expect, test } from 'bun:test';
import { InvariantError } from './errors';
import { clamp, lerp, round1 } from './math';

describe('clamp', () => {
  test.each([
    [5, 0, 3, 3],
    [-1, 0, 3, 0],
    [2, 0, 3, 2],
    [3, 0, 3, 3],
  ])('clamp(%p, %p, %p) is %p', (value, lo, hi, expected) => {
    expect(clamp(value, lo, hi)).toBe(expected);
  });
  test('rejects inverted bounds', () => {
    expect(() => clamp(1, 3, 0)).toThrow(InvariantError);
  });
});

describe('lerp', () => {
  test.each([
    [0, 10, 0, 0],
    [0, 10, 1, 10],
    [0, 10, 0.25, 2.5],
    [4, -4, 0.5, 0],
  ])('lerp(%p, %p, %p) is %p', (a, b, t, expected) => {
    expect(lerp(a, b, t)).toBe(expected);
  });
});

describe('round1', () => {
  // 96.75 and 96.25 are exact in binary (Task 7 yield index); -1.25 pins Math.round's .5 toward +infinity
  test.each([
    [96.75, 96.8],
    [96.25, 96.3],
    [90, 90],
    [-1.25, -1.2],
    [0.04, 0],
  ])('round1(%p) is %p', (value, expected) => {
    expect(round1(value)).toBe(expected);
  });
});
