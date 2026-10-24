import type { ContentBundle, ContentIssue, EventDef, EventNode, MinigameContentMap, NodeId } from '../model';

type RegistryField =
  | 'keyDays'
  | 'characters'
  | 'resumes'
  | 'events'
  | 'endings'
  | 'lifeActions'
  | 'locations'
  | 'machines'
  | 'tasks'
  | 'flags'
  | 'counters'
  | 'text';
type DeclaredPrefix =
  | 'ev'
  | 'chr'
  | 'flag'
  | 'cnt'
  | 'seed'
  | 'end'
  | 't'
  | 'loc'
  | 'mc'
  | 'task'
  | 'kd'
  | 'act'
  | 'res'
  | 'mod';
type ReferencePrefix = DeclaredPrefix | 'hs';

interface Definition {
  id: string;
  value: unknown;
  registry: RegistryField | null;
}
interface Located {
  path: string;
  value: string;
}
interface Reference extends Located {
  prefix: ReferencePrefix;
}
interface Edge {
  path: string;
  target: NodeId;
}
type Declarations = Readonly<Record<ReferencePrefix, ReadonlySet<string>>>;
type PresetNames = ReadonlyMap<string, ReadonlySet<string>>;

const REGISTRY_PREFIX: Readonly<Record<RegistryField, DeclaredPrefix>> = {
  keyDays: 'kd',
  characters: 'chr',
  resumes: 'res',
  events: 'ev',
  endings: 'end',
  lifeActions: 'act',
  locations: 'loc',
  machines: 'mc',
  tasks: 'task',
  flags: 'flag',
  counters: 'cnt',
  text: 't',
};

// 01 §8.3
const ID_PATTERNS: Readonly<Record<DeclaredPrefix, RegExp>> = {
  ev: /^ev\.[a-z0-9]+(_[a-z0-9]+)*$/,
  end: /^end\.e[0-9]{2}[a-z]*_[a-z0-9_]+$/,
  t: /^t\.[a-z0-9_]+(\.[a-z0-9_]+)+$/,
  chr: /^chr\.[a-z0-9_]+$/,
  flag: /^flag\.[a-z0-9_]+$/,
  cnt: /^cnt\.[a-z0-9_]+$/,
  seed: /^seed\.[a-z0-9_]+$/,
  loc: /^loc\.[a-z0-9_]+$/,
  mc: /^mc\.[a-z0-9_]+$/,
  task: /^task\.[a-z0-9_]+$/,
  kd: /^kd\.[a-z0-9_]+$/,
  act: /^act\.[a-z0-9_]+$/,
  res: /^res\.[a-z0-9_]+$/,
  mod: /^mod\.[a-z0-9_]+$/,
};
const NODE_ID = /^n_[a-z0-9_]+$/;
const CHOICE_ID = /^c_[a-z0-9_]+$/;

const REFERENCE_KINDS: Readonly<Record<ReferencePrefix, string>> = {
  ev: 'event',
  chr: 'character',
  flag: 'flag',
  cnt: 'counter',
  seed: 'seed',
  end: 'ending',
  t: 'text',
  loc: 'location',
  hs: 'hotspot',
  mc: 'machine',
  task: 'task',
  kd: 'key day',
  act: 'life action',
  res: 'resume',
  mod: 'modifier',
};
const REFERENCE = /^(ev|chr|flag|cnt|seed|end|t|loc|hs|mc|task|kd|act|res|mod)\./;
const SEED_DECLARATION_PATH = /^seeds\[\d+\]\.id$/;
const SOURCE_REFS_PATH = /^sourceRefs(\[\d+\])?$/;

// D81：這些前綴的台詞由程式碼引用，內容裡找不到參照是正常的
const CODE_TEXT_PREFIXES = ['t.ui.', 't.mg.', 't.sys.'];
const ALLOWED_PLACEHOLDERS: ReadonlySet<string> = new Set(['name', 'pronoun', 'date', 'grade']);
const PLACEHOLDER = /\{([^{}]*)\}/g;

function errorIssue(id: string, path: string, message: string): ContentIssue {
  return { severity: 'error', id, path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRegistryField(field: string): field is RegistryField {
  return Object.hasOwn(REGISTRY_PREFIX, field);
}

function isReferencePrefix(prefix: string): prefix is ReferencePrefix {
  return Object.hasOwn(REFERENCE_KINDS, prefix);
}

function fieldOf(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function childPath(path: string, key: string): string {
  return path === '' ? key : `${path}.${key}`;
}

function forEachNode(value: unknown, path: string, visit: (node: unknown, path: string) => void): void {
  visit(value, path);
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) forEachNode(item, `${path}[${index}]`, visit);
  } else if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) forEachNode(child, childPath(path, key), visit);
  }
}

function definitionsOf(content: ContentBundle): Definition[] {
  const fields: [string, unknown][] = Object.entries(content);
  return fields.flatMap(([field, value]): Definition[] => {
    if (!isRegistryField(field)) return [{ id: field, value, registry: null }];
    const entries: [string, unknown][] = isRecord(value) ? Object.entries(value) : [];
    return entries.map(([id, entry]) => ({ id, value: entry, registry: field }));
  });
}

function modifierDeclarations(value: unknown): Located[] {
  const found: Located[] = [];
  forEachNode(value, '', (node, path) => {
    const id = fieldOf(fieldOf(node, 'modifier'), 'id');
    if (fieldOf(node, 'op') === 'modifier' && typeof id === 'string') {
      found.push({ path: childPath(path, 'modifier.id'), value: id });
    }
  });
  return found;
}

function collectDeclarations(content: ContentBundle, definitions: readonly Definition[]): Declarations {
  const keys = (record: object): ReadonlySet<string> => new Set(Object.keys(record));
  return {
    ev: keys(content.events),
    chr: keys(content.characters),
    flag: keys(content.flags),
    cnt: keys(content.counters),
    seed: new Set(Object.values(content.events).flatMap((event) => (event.seeds ?? []).map((seed) => seed.id))),
    end: keys(content.endings),
    t: keys(content.text),
    loc: keys(content.locations),
    hs: new Set(Object.values(content.locations).flatMap((location) => location.hotspots)),
    mc: keys(content.machines),
    task: keys(content.tasks),
    kd: keys(content.keyDays),
    act: keys(content.lifeActions),
    res: keys(content.resumes),
    mod: new Set(definitions.flatMap((definition) => modifierDeclarations(definition.value).map((m) => m.value))),
  };
}

function presetNamesOf(minigames: MinigameContentMap): PresetNames {
  return new Map(Object.entries(minigames).map(([minigame, game]) => [minigame, new Set(Object.keys(game.presets))]));
}

function invalidIds(id: string, candidates: readonly Located[], pattern: RegExp): ContentIssue[] {
  return candidates
    .filter((candidate) => !pattern.test(candidate.value))
    .map((candidate) => errorIssue(id, candidate.path, `invalid id format: '${candidate.value}'`));
}

function registryIdIssues(definition: Definition): ContentIssue[] {
  if (definition.registry === null) return [];
  const pattern = ID_PATTERNS[REGISTRY_PREFIX[definition.registry]];
  const issues = invalidIds(definition.id, [{ path: 'id', value: definition.id }], pattern);
  const ownId = fieldOf(definition.value, 'id');
  if (typeof ownId === 'string' && ownId !== definition.id) {
    issues.push(errorIssue(definition.id, 'id', `id does not match key: id=${ownId}`));
  }
  return issues;
}

function choiceIdsOf(nodeId: NodeId, node: EventNode): Located[] {
  if (node.kind !== 'choice') return [];
  const choices = node.choices.map((choice, index) => ({
    path: `nodes.${nodeId}.choices[${index}].id`,
    value: choice.id,
  }));
  const onTimeout = node.countdown?.onTimeout;
  return onTimeout === undefined
    ? choices
    : [...choices, { path: `nodes.${nodeId}.countdown.onTimeout.id`, value: onTimeout.id }];
}

function eventIdIssues(eventId: string, event: EventDef): ContentIssue[] {
  const nodes = Object.entries(event.nodes);
  const nodeIds = nodes.map(([nodeId]) => ({ path: `nodes.${nodeId}`, value: nodeId }));
  const seedIds = (event.seeds ?? []).map((seed, index) => ({ path: `seeds[${index}].id`, value: seed.id }));
  return [
    ...invalidIds(eventId, nodeIds, NODE_ID),
    ...invalidIds(
      eventId,
      nodes.flatMap(([nodeId, node]) => choiceIdsOf(nodeId, node)),
      CHOICE_ID,
    ),
    ...invalidIds(eventId, seedIds, ID_PATTERNS.seed),
  ];
}

function idIssues(definition: Definition, events: ReadonlyMap<string, EventDef>): ContentIssue[] {
  const event = definition.registry === 'events' ? events.get(definition.id) : undefined;
  return [
    ...registryIdIssues(definition),
    ...(event === undefined ? [] : eventIdIssues(definition.id, event)),
    ...invalidIds(definition.id, modifierDeclarations(definition.value), ID_PATTERNS.mod),
  ];
}

function isDeclarationOrProse(definition: Definition, path: string, modifierIdPaths: ReadonlySet<string>): boolean {
  if (modifierIdPaths.has(path) || SOURCE_REFS_PATH.test(path)) return true;
  switch (definition.registry) {
    case null:
      return false;
    case 'events':
      return path === 'id' || SEED_DECLARATION_PATH.test(path);
    case 'flags':
      return path === 'id' || path === 'description';
    default:
      return path === 'id';
  }
}

function asReference(candidate: Located): Reference[] {
  const prefix = REFERENCE.exec(candidate.value)?.[1];
  return prefix !== undefined && isReferencePrefix(prefix) ? [{ ...candidate, prefix }] : [];
}

function referencesIn(definition: Definition): Reference[] {
  if (definition.registry === 'text' || definition.registry === 'counters') return [];
  const modifierIdPaths = new Set(modifierDeclarations(definition.value).map((m) => m.path));
  const candidates: Located[] = [];
  forEachNode(definition.value, '', (node, path) => {
    if (typeof node === 'string' && !isDeclarationOrProse(definition, path, modifierIdPaths)) {
      candidates.push({ path, value: node });
    }
    if (isRecord(node)) {
      for (const key of Object.keys(node)) candidates.push({ path: childPath(path, key), value: key });
    }
  });
  return candidates.flatMap(asReference);
}

function unknownReferenceIssues(
  id: string,
  references: readonly Reference[],
  declarations: Declarations,
): ContentIssue[] {
  return references
    .filter((reference) => !declarations[reference.prefix].has(reference.value))
    .map((reference) =>
      errorIssue(id, reference.path, `unknown ${REFERENCE_KINDS[reference.prefix]} '${reference.value}'`),
    );
}

function unknownPreset(id: string, path: string, presets: PresetNames, minigame: string, preset: string) {
  return presets.get(minigame)?.has(preset) === true
    ? []
    : [errorIssue(id, path, `unknown preset '${minigame}/${preset}'`)];
}

function chapterDefaultIssues(minigames: MinigameContentMap, presets: PresetNames): ContentIssue[] {
  return Object.entries(minigames).flatMap(([minigame, game]) =>
    Object.entries(game.chapterDefaults ?? {}).flatMap(([chapter, preset]) =>
      preset === undefined
        ? []
        : unknownPreset('minigames', `${minigame}.chapterDefaults.${chapter}`, presets, minigame, preset),
    ),
  );
}

function presetIssues(definition: Definition, content: ContentBundle, presets: PresetNames): ContentIssue[] {
  const issues: ContentIssue[] = [];
  forEachNode(definition.value, '', (node, path) => {
    const minigame = fieldOf(node, 'minigame');
    const preset = fieldOf(node, 'preset');
    if (fieldOf(node, 'kind') === 'minigame' && typeof minigame === 'string' && typeof preset === 'string') {
      issues.push(...unknownPreset(definition.id, childPath(path, 'preset'), presets, minigame, preset));
    }
  });
  if (definition.registry === null && definition.id === 'minigames') {
    issues.push(...chapterDefaultIssues(content.minigames, presets));
  }
  return issues;
}

function edge(path: string, target: NodeId | null | undefined): Edge[] {
  return target === null || target === undefined ? [] : [{ path, target }];
}

function edgesOf(nodeId: NodeId, node: EventNode): Edge[] {
  const at = (suffix: string) => `nodes.${nodeId}.${suffix}`;
  switch (node.kind) {
    case 'line':
    case 'phone':
    case 'result':
    case 'effects':
      return edge(at('next'), node.next);
    case 'choice':
      return [
        ...node.choices.flatMap((choice, index) => edge(at(`choices[${index}].next`), choice.next)),
        ...edge(at('countdown.onTimeout.next'), node.countdown?.onTimeout.next),
      ];
    case 'branch':
      return [
        ...node.cases.flatMap((branchCase, index) => edge(at(`cases[${index}].next`), branchCase.next)),
        ...edge(at('otherwise'), node.otherwise),
      ];
    case 'roll':
      return node.outcomes.flatMap((outcome, index) => edge(at(`outcomes[${index}].next`), outcome.next));
    case 'minigame':
      return [
        ...edge(at('next.success'), node.next.success),
        ...edge(at('next.partial'), node.next.partial),
        ...edge(at('next.fail'), node.next.fail),
      ];
    case 'end':
      return [];
  }
}

function exploreFromStart(start: NodeId, edges: ReadonlyMap<NodeId, readonly Edge[]>) {
  const reached = new Set<NodeId>();
  const onPath = new Set<NodeId>();
  const backEdges: Edge[] = [];
  const visit = (nodeId: NodeId): void => {
    reached.add(nodeId);
    onPath.add(nodeId);
    for (const next of edges.get(nodeId) ?? []) {
      if (onPath.has(next.target)) backEdges.push(next);
      else if (!reached.has(next.target) && edges.has(next.target)) visit(next.target);
    }
    onPath.delete(nodeId);
  };
  visit(start);
  return { reached, firstBackEdge: backEdges[0] };
}

function reachabilityIssues(eventId: string, start: NodeId, edges: ReadonlyMap<NodeId, readonly Edge[]>) {
  const { reached, firstBackEdge } = exploreFromStart(start, edges);
  const unreachable = [...edges.keys()]
    .filter((nodeId) => !reached.has(nodeId))
    .map((nodeId) => errorIssue(eventId, `nodes.${nodeId}`, 'node unreachable from start'));
  return firstBackEdge === undefined
    ? unreachable
    : [...unreachable, errorIssue(eventId, firstBackEdge.path, `node graph cycle back to '${firstBackEdge.target}'`)];
}

function nodeGraphIssues(eventId: string, event: EventDef): ContentIssue[] {
  const nodes = Object.entries(event.nodes);
  const edges = new Map(nodes.map(([nodeId, node]) => [nodeId, edgesOf(nodeId, node)]));
  const startExists = edges.has(event.start);
  const missingStart = startExists ? [] : [errorIssue(eventId, 'start', `unknown node '${event.start}'`)];
  const danglingEdges = [...edges.values()]
    .flat()
    .filter((next) => !edges.has(next.target))
    .map((next) => errorIssue(eventId, next.path, `unknown node '${next.target}'`));
  const emptyChoices = nodes
    .filter(([, node]) => node.kind === 'choice' && node.choices.length === 0)
    .map(([nodeId]) => errorIssue(eventId, `nodes.${nodeId}.choices`, 'choice node has no choices'));
  return [
    ...missingStart,
    ...danglingEdges,
    ...emptyChoices,
    ...(startExists ? reachabilityIssues(eventId, event.start, edges) : []),
  ];
}

function textIssues(text: ContentBundle['text'], referencedTexts: ReadonlySet<string>): ContentIssue[] {
  return Object.entries(text).flatMap(([id, template]) => {
    const orphan = !referencedTexts.has(id) && !CODE_TEXT_PREFIXES.some((prefix) => id.startsWith(prefix));
    const badPlaceholders = [...template.matchAll(PLACEHOLDER)]
      .filter((match) => !ALLOWED_PLACEHOLDERS.has(match[1] ?? ''))
      .map((match) => errorIssue(id, 'text', `unknown placeholder '${match[0]}'`));
    return orphan
      ? [errorIssue(id, 'text', 'orphan text: not referenced by any content'), ...badPlaceholders]
      : badPlaceholders;
  });
}

// 01 §8.6 數值方向（02/CR-15）：專業不降、小遊戲任務不另扣體力
function statDirectionIssues(definition: Definition): ContentIssue[] {
  const issues: ContentIssue[] = [];
  forEachNode(definition.value, '', (node, path) => {
    const delta = fieldOf(node, 'delta');
    if (fieldOf(node, 'op') === 'stat' && fieldOf(node, 'stat') === 'skill' && typeof delta === 'number' && delta < 0) {
      issues.push(errorIssue(definition.id, childPath(path, 'delta'), `negative skill delta: delta=${delta}`));
    }
  });
  const isMinigameTask =
    definition.registry === 'tasks' && fieldOf(fieldOf(definition.value, 'action'), 'kind') === 'minigame';
  const staminaCost = fieldOf(definition.value, 'staminaCost');
  if (isMinigameTask && staminaCost !== 0) {
    const message = `minigame task must not cost stamina: staminaCost=${String(staminaCost)}`;
    issues.push(errorIssue(definition.id, 'staminaCost', message));
  }
  return issues;
}

export function validateContent(content: ContentBundle): ContentIssue[] {
  const definitions = definitionsOf(content);
  const events = new Map<string, EventDef>(Object.entries(content.events));
  const declarations = collectDeclarations(content, definitions);
  const presets = presetNamesOf(content.minigames);
  const scanned = definitions.map((definition) => ({ definition, references: referencesIn(definition) }));
  const referencedTexts = new Set(
    scanned.flatMap(({ references }) => references.filter((r) => r.prefix === 't').map((r) => r.value)),
  );
  return [
    ...definitions.flatMap((definition) => idIssues(definition, events)),
    ...scanned.flatMap(({ definition, references }) => [
      ...unknownReferenceIssues(definition.id, references, declarations),
      ...presetIssues(definition, content, presets),
    ]),
    ...[...events].flatMap(([eventId, event]) => nodeGraphIssues(eventId, event)),
    ...textIssues(content.text, referencedTexts),
    ...definitions.flatMap(statDirectionIssues),
  ];
}
