import type { ContentBundle, Grade, TextId, TextRef } from '../model';
import { formatMonthDay } from '../utils/date';
import { InvariantError } from '../utils/errors';
import { type EvalContext, evaluateCondition } from './conditions';

export interface TextVars {
  date?: number;
  grade?: Grade;
}

const PLACEHOLDER = /\{([a-z]+)\}/g;

function pickTextId(ref: TextRef, ctx: EvalContext): TextId {
  if (typeof ref === 'string') return ref;
  const variant = ref.variants.find((candidate) => evaluateCondition(candidate.when, ctx));
  return variant === undefined ? ref.fallback : variant.text;
}

function requireVar<T>(value: T | undefined, id: TextId, variable: string): T {
  if (value === undefined) {
    throw new InvariantError(`Missing text variable: text=${id} variable=${variable}`);
  }
  return value;
}

function lookupTemplate(content: ContentBundle, id: TextId): string {
  const template = content.text[id];
  if (template === undefined) {
    throw new InvariantError(`Unknown text: text=${id}`);
  }
  return template;
}

export function resolveText(ref: TextRef, ctx: EvalContext, vars: TextVars = {}): string {
  const id = pickTextId(ref, ctx);
  const template = lookupTemplate(ctx.content, id);
  const { player } = ctx.state;
  return template.replace(PLACEHOLDER, (_match, name: string) => {
    switch (name) {
      case 'name':
        return player.name;
      case 'pronoun':
        return lookupTemplate(ctx.content, `t.sys.pronoun.${player.pronoun}`);
      case 'date':
        return formatMonthDay(requireVar(vars.date, id, name));
      case 'grade':
        return requireVar(vars.grade, id, name);
      default:
        throw new InvariantError(`Unknown placeholder: text=${id} placeholder={${name}}`);
    }
  });
}
