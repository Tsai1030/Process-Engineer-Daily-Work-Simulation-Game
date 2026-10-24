import type { Effect, NumExpr } from '../model';

export interface ScaleOptions {
  /** true：只縮放正值（生活行動減半）；false：正負都縮放（快轉比例） */
  positiveOnly: boolean;
}

function scaleDelta(delta: number, factor: number, options: ScaleOptions): number {
  return options.positiveOnly && delta <= 0 ? delta : delta * factor;
}

function scaleProbability(p: NumExpr, factor: number): NumExpr {
  if (typeof p === 'number') {
    return Math.min(1, p * factor);
  }
  return { min: [{ product: [p, factor] }, 1] };
}

function scaleOne(effect: Effect, factor: number, options: ScaleOptions): Effect {
  switch (effect.op) {
    case 'stat':
      if (typeof effect.delta !== 'number') {
        return options.positiveOnly ? effect : { ...effect, delta: { product: [effect.delta, factor] } };
      }
      return { ...effect, delta: scaleDelta(effect.delta, factor, options) };
    case 'affinity':
      return { ...effect, delta: scaleDelta(effect.delta, factor, options) };
    case 'counter':
      return options.positiveOnly ? effect : { ...effect, delta: effect.delta * factor };
    case 'chance':
      return options.positiveOnly ? effect : { ...effect, p: scaleProbability(effect.p, factor) };
    case 'when':
      return options.positiveOnly ? effect : scaleWhen(effect, factor, options);
    default:
      return effect;
  }
}

function scaleWhen(effect: Extract<Effect, { op: 'when' }>, factor: number, options: ScaleOptions): Effect {
  // biome-ignore lint/suspicious/noThenProperty: when branches are spelled then/else by the model
  const scaled = { ...effect, then: scaleEffects(effect.then, factor, options) };
  return effect.else === undefined ? scaled : { ...scaled, else: scaleEffects(effect.else, factor, options) };
}

/** 回傳新的效果陣列；規則見 02 §5.4「快轉的效果縮放」，其餘 op 原樣（D82） */
export function scaleEffects(effects: readonly Effect[], factor: number, options: ScaleOptions): Effect[] {
  return effects.map((effect) => scaleOne(effect, factor, options));
}
