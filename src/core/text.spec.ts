import { describe, expect, test } from 'bun:test';
import { buildTestState, contentWith, testContent } from '../../test/fixtures';
import type { GameState, Pronoun, TextRef } from '../model';
import { InvariantError } from '../utils/errors';
import type { EvalContext } from './conditions';
import { resolveText, type TextVars } from './text';

const content = contentWith({
  text: {
    ...testContent.text,
    't.test.greet': '{name}你好',
    't.test.pron': '{pronoun}來了',
    't.test.date': '{date} 值班夜先走',
    't.test.grade': '等第 {grade}',
    't.test.bad': '{nmae}',
  },
});

function contextFor(name: string, pronoun: Pronoun): EvalContext {
  const base = buildTestState();
  const state: GameState = { ...base, player: { ...base.player, name, pronoun } };
  return { state, content };
}

const PLAYER_NAME = '小明';
const JUNE_13 = 104;
const sheVariants: TextRef = {
  variants: [{ when: { pronoun: 'she' }, text: 't.test.pron' }],
  fallback: 't.test.greet',
};

describe('resolveText', () => {
  test.each<[string, TextRef, Pronoun, TextVars | undefined, string]>([
    ['name placeholder', 't.test.greet', 'neutral', undefined, '小明你好'],
    ['pronoun he', 't.test.pron', 'he', undefined, '他來了'],
    ['pronoun she', 't.test.pron', 'she', undefined, '她來了'],
    ['pronoun neutral', 't.test.pron', 'neutral', undefined, 'TA來了'],
    ['date placeholder', 't.test.date', 'neutral', { date: JUNE_13 }, '6/13 值班夜先走'],
    ['grade placeholder', 't.test.grade', 'neutral', { grade: 'M+' }, '等第 M+'],
    ['matching variant', sheVariants, 'she', undefined, '她來了'],
    ['fallback when no variant matches', sheVariants, 'neutral', undefined, '小明你好'],
  ])('%s', (_label, ref, pronoun, vars, expected) => {
    expect(resolveText(ref, contextFor(PLAYER_NAME, pronoun), vars)).toEqual(expected);
  });

  // Review Focus 3：取代後的字串不再掃描
  test('a player name containing placeholders is shown verbatim', () => {
    expect(resolveText('t.test.greet', contextFor('{date}{name}', 'neutral'))).toEqual('{date}{name}你好');
  });

  test('an unknown text id throws', () => {
    expect(() => resolveText('t.test.missing', contextFor(PLAYER_NAME, 'neutral'))).toThrow(
      new InvariantError('Unknown text: text=t.test.missing'),
    );
  });

  test('a placeholder without its variable throws', () => {
    expect(() => resolveText('t.test.date', contextFor(PLAYER_NAME, 'neutral'))).toThrow(
      new InvariantError('Missing text variable: text=t.test.date variable=date'),
    );
  });

  test('an unknown placeholder throws', () => {
    expect(() => resolveText('t.test.bad', contextFor(PLAYER_NAME, 'neutral'))).toThrow(
      new InvariantError('Unknown placeholder: text=t.test.bad placeholder={nmae}'),
    );
  });
});
