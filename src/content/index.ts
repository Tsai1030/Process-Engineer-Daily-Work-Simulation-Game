import type { ContentBundle } from '../model';
import { balance } from './balance';
import { campaign, keyDays } from './campaign';
import { characters } from './characters';
import { economy, ranks, review, stats } from './economy';
import { counters, flags } from './flags';
import { minigames } from './minigames';
import { lifeActions, lifePolicies, workPolicies } from './policies';
import { resumes } from './resumes';
import { characterText } from './text/characters';
import { minigameText } from './text/minigames';
import { uiText } from './text/ui';
import { locations, machines, tasks } from './world';

// D68：content 只能 import type model，所以重複台詞丟一般 Error 而不是 ContentError
function mergeTexts(sources: readonly Readonly<Record<string, string>>[]): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const source of sources) {
    for (const [id, line] of Object.entries(source)) {
      if (Object.hasOwn(merged, id)) {
        throw new Error(`Duplicate text id: id=${id}`);
      }
      merged[id] = line;
    }
  }
  return merged;
}

export const content: ContentBundle = {
  campaign,
  keyDays,
  stats,
  characters,
  resumes,
  events: {},
  endings: {},
  minigames,
  workPolicies,
  lifePolicies,
  lifeActions,
  ranks,
  economy,
  review,
  balance,
  locations,
  machines,
  tasks,
  flags,
  counters,
  text: mergeTexts([uiText, characterText, minigameText]),
};
