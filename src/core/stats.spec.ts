import { describe, expect, test } from 'bun:test';
import type { Condition, Effect, NumExpr } from '../model';
import { scaleEffects } from './stats';

const QUARTER = 0.25;
const HALF = 0.5;
const FAST_FORWARD = { positiveOnly: false };
const LIFE_ACTION = { positiveOnly: true };

const SWITCH: Condition = { flag: 'flag.test_switch' };

function chanceOf(p: NumExpr, thenEffects: Effect[], elseEffects?: Effect[]): Effect {
  const base = { op: 'chance', p, then: thenEffects } as const;
  return elseEffects === undefined ? base : { ...base, else: elseEffects };
}

function whenOf(thenEffects: Effect[], elseEffects?: Effect[]): Effect {
  const base = { op: 'when', if: SWITCH, then: thenEffects } as const;
  return elseEffects === undefined ? base : { ...base, else: elseEffects };
}

describe('scaleEffects', () => {
  // 02 T10：「穩」月效果 × 0.25
  test('week fraction scales every top-level constant delta', () => {
    const steady: readonly Effect[] = [
      { op: 'stat', stat: 'skill', delta: 2 },
      { op: 'stat', stat: 'bossFavor', delta: 1 },
      { op: 'stat', stat: 'mind', delta: -3 },
      { op: 'stat', stat: 'healthDebt', delta: 2 },
    ];
    expect(scaleEffects(steady, QUARTER, FAST_FORWARD)).toEqual([
      { op: 'stat', stat: 'skill', delta: 0.5 },
      { op: 'stat', stat: 'bossFavor', delta: 0.25 },
      { op: 'stat', stat: 'mind', delta: -0.75 },
      { op: 'stat', stat: 'healthDebt', delta: 0.5 },
    ]);
  });

  test('affinity and counter constants scale by the fraction', () => {
    const effects: readonly Effect[] = [
      { op: 'affinity', character: 'chr.azhe', delta: 4 },
      { op: 'counter', counter: 'cnt.test_tally', delta: -2 },
    ];
    expect(scaleEffects(effects, HALF, FAST_FORWARD)).toEqual([
      { op: 'affinity', character: 'chr.azhe', delta: 2 },
      { op: 'counter', counter: 'cnt.test_tally', delta: -1 },
    ]);
  });

  // 02 T11：chance 的機率縮放、內層 +1 不縮放
  test('chance probability scales but its inner effects do not', () => {
    const favor: Effect = { op: 'stat', stat: 'bossFavor', delta: 1 };
    expect(scaleEffects([chanceOf(0.5, [favor])], QUARTER, FAST_FORWARD)).toEqual([chanceOf(0.125, [favor])]);
  });

  test('chance probability never exceeds 1', () => {
    const favor: Effect = { op: 'stat', stat: 'bossFavor', delta: 1 };
    const expression = { stat: 'mind' } as const;
    expect(scaleEffects([chanceOf(0.8, [favor]), chanceOf(expression, [favor])], 2, FAST_FORWARD)).toEqual([
      chanceOf(1, [favor]),
      chanceOf({ min: [{ product: [expression, 2] }, 1] }, [favor]),
    ]);
  });

  test('chance keeps its else branch unscaled', () => {
    const mind: Effect = { op: 'stat', stat: 'mind', delta: -4 };
    expect(scaleEffects([chanceOf(0.5, [], [mind])], HALF, FAST_FORWARD)).toEqual([chanceOf(0.25, [], [mind])]);
  });

  test('expression deltas are wrapped in a product', () => {
    expect(scaleEffects([{ op: 'stat', stat: 'skill', delta: { stat: 'mind' } }], HALF, FAST_FORWARD)).toEqual([
      { op: 'stat', stat: 'skill', delta: { product: [{ stat: 'mind' }, HALF] } },
    ]);
  });

  test('when branches are scaled as if they were top level', () => {
    const effect = whenOf(
      [{ op: 'stat', stat: 'skill', delta: 4 }],
      [{ op: 'counter', counter: 'cnt.test_tally', delta: 2 }],
    );
    expect(scaleEffects([effect], HALF, FAST_FORWARD)).toEqual([
      whenOf([{ op: 'stat', stat: 'skill', delta: 2 }], [{ op: 'counter', counter: 'cnt.test_tally', delta: 1 }]),
    ]);
  });

  test('when without an else branch stays without one', () => {
    const effect = whenOf([]);
    expect(scaleEffects([effect], HALF, FAST_FORWARD)).toEqual([effect]);
  });

  test('ops outside the scaling table pass through unchanged', () => {
    const untouched: Effect[] = [
      { op: 'flag', flag: 'flag.test_switch', value: true },
      { op: 'phone', thread: 'thread.etch_group', message: { from: 'chr.azhe', text: 't.test.chapter', kind: 'chat' } },
      {
        op: 'modifier',
        modifier: {
          id: 'mod.test',
          kind: 'statGain',
          stat: 'skill',
          positiveMultiplier: 2,
          negativeMultiplier: 1,
          durationDays: 3,
        },
      },
    ];
    expect(scaleEffects(untouched, QUARTER, FAST_FORWARD)).toEqual(untouched);
  });

  // 02 T12：生活行動減半只縮正值
  test('positiveOnly halves only positive top-level stat and affinity constants', () => {
    const mind6: Effect = { op: 'stat', stat: 'mind', delta: 6 };
    const effects: Effect[] = [
      mind6,
      { op: 'stat', stat: 'stamina', delta: -5 },
      { op: 'affinity', character: 'chr.azhe', delta: 4 },
      { op: 'counter', counter: 'cnt.test_tally', delta: 2 },
      chanceOf(0.5, [mind6]),
    ];
    expect(scaleEffects(effects, HALF, LIFE_ACTION)).toEqual([
      { op: 'stat', stat: 'mind', delta: 3 },
      { op: 'stat', stat: 'stamina', delta: -5 },
      { op: 'affinity', character: 'chr.azhe', delta: 2 },
      { op: 'counter', counter: 'cnt.test_tally', delta: 2 },
      chanceOf(0.5, [mind6]),
    ]);
  });

  test('positiveOnly leaves expression deltas and when branches alone', () => {
    const effects: Effect[] = [
      { op: 'stat', stat: 'skill', delta: { stat: 'mind' } },
      whenOf([{ op: 'stat', stat: 'skill', delta: 4 }]),
    ];
    expect(scaleEffects(effects, HALF, LIFE_ACTION)).toEqual(effects);
  });

  test('does not mutate its input', () => {
    const effects: Effect[] = [
      { op: 'stat', stat: 'skill', delta: 2 },
      whenOf([{ op: 'stat', stat: 'mind', delta: 4 }]),
      chanceOf(0.5, []),
    ];
    const before = structuredClone(effects);
    scaleEffects(effects, HALF, FAST_FORWARD);
    expect(effects).toEqual(before);
  });
});
