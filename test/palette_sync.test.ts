import { describe, expect, test } from 'bun:test';
import { PALETTE } from '../src/render/look';

const css = await Bun.file('src/ui/styles/tokens.css').text();
const cssColor = (name: string): number | null => {
  const match = css.match(new RegExp(`${name}:\\s*#([0-9a-fA-F]{6})\\s*;`));
  return match?.[1] === undefined ? null : Number.parseInt(match[1], 16);
};
const PAIRS = [
  ['--ink', 'ink'],
  ['--paper', 'paper'],
  ['--grey', 'grey'],
  ['--red', 'holdTagRed'],
  ['--yellow', 'hazardYellow'],
  ['--glove', 'glove'],
  ['--amber', 'photoWall'],
  ['--screen-run', 'screenRun'],
  ['--screen-warn', 'screenWarn'],
  ['--screen-down', 'screenDown'],
] as const;

describe('palette sync between tokens.css and render/look.ts', () => {
  test.each(PAIRS)('%p equals PALETTE.%p', (cssName, paletteKey) => {
    expect(cssColor(cssName)).toBe(PALETTE[paletteKey]);
  });
});
