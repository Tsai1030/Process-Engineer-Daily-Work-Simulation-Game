import { InvariantError } from './errors';

export function clamp(value: number, lo: number, hi: number): number {
  if (lo > hi) {
    throw new InvariantError(`Invalid clamp bounds: lo=${lo} hi=${hi}`);
  }
  return Math.min(hi, Math.max(lo, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
