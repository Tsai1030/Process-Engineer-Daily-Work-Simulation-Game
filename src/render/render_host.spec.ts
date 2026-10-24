import { describe, expect, test } from 'bun:test';
import { cameraFraming } from './render_host';

// 範例 resize()：fov = clamp(2·atan(tan 32° / aspect), 54, 84)；寬 <760 下移 20%，否則 12%
const FRAMING_CASES = [
  { name: 'wide 1600x900 clamps to the 54 degree floor', width: 1600, height: 900, fov: 54, offsetY: 108 },
  { name: 'square 1000x1000 keeps the unclamped 64 degrees', width: 1000, height: 1000, fov: 64, offsetY: 120 },
  { name: 'portrait 390x844 clamps to the 84 degree ceiling', width: 390, height: 844, fov: 84, offsetY: 168.8 },
  { name: 'width 759 is narrow and shifts 20 percent', width: 759, height: 1000, fov: 78.93, offsetY: 200 },
  { name: 'width 760 is wide and shifts 12 percent', width: 760, height: 1000, fov: 78.85, offsetY: 120 },
] as const;

describe('cameraFraming', () => {
  for (const c of FRAMING_CASES) {
    test(`${c.name}: aspect, fov and vertical view offset`, () => {
      const framing = cameraFraming(c.width, c.height);
      expect({
        aspect: framing.aspect,
        fov: Math.round(framing.fov * 100) / 100,
        offsetY: Math.round(framing.offsetY * 10) / 10,
      }).toEqual({ aspect: c.width / c.height, fov: c.fov, offsetY: c.offsetY });
    });
  }
});
