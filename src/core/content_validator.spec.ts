import { describe, expect, test } from 'bun:test';
import { defined, testContent } from '../../test/fixtures';
import type { ContentBundle, ContentIssue, EventNode, TaskDef } from '../model';
import { validateContent } from './content_validator';

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
type MutableContent = Mutable<ContentBundle>;
type NodeOfKind<K extends EventNode['kind']> = Mutable<Extract<EventNode, { kind: K }>>;

interface Case {
  name: string;
  mutate: (content: MutableContent) => void;
  expected: ContentIssue[];
}

function eventOf(content: MutableContent) {
  return defined(content.events['ev.test_scripted'], 'ev.test_scripted');
}

function nodeOf<K extends EventNode['kind']>(content: MutableContent, nodeId: string, kind: K): NodeOfKind<K> {
  const node = defined(eventOf(content).nodes[nodeId], nodeId);
  if (node.kind !== kind) {
    throw new Error(`Unexpected node kind: node=${nodeId} kind=${node.kind} expected=${kind}`);
  }
  return node as NodeOfKind<K>;
}

function lineOf(content: MutableContent) {
  return nodeOf(content, 'n_line', 'line');
}

function choiceOf(content: MutableContent, index: number) {
  return defined(nodeOf(content, 'n_choice', 'choice').choices[index], `choices[${index}]`);
}

function resultOf(content: MutableContent) {
  return nodeOf(content, 'n_result', 'result');
}

function taskOf(content: MutableContent): Mutable<TaskDef> {
  return defined(content.tasks['task.test_spc'], 'task.test_spc');
}

describe('validateContent', () => {
  test('the test fixture content has no issues', () => {
    expect(validateContent(testContent)).toEqual([]);
  });

  test.each<Case>([
    {
      name: 'unknown flag in a choice requirement',
      mutate: (c) => {
        choiceOf(c, 0).requires = { flag: 'flag.test_switc' };
      },
      expected: [
        {
          severity: 'error',
          id: 'ev.test_scripted',
          path: 'nodes.n_choice.choices[0].requires.flag',
          message: "unknown flag 'flag.test_switc'",
        },
      ],
    },
    {
      name: 'unreachable node',
      mutate: (c) => {
        const event = eventOf(c);
        event.nodes = { ...event.nodes, n_orphan: { kind: 'end' } };
      },
      expected: [
        { severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_orphan', message: 'node unreachable from start' },
      ],
    },
    {
      name: 'cycle',
      mutate: (c) => {
        resultOf(c).next = 'n_line';
      },
      expected: [
        {
          severity: 'error',
          id: 'ev.test_scripted',
          path: 'nodes.n_result.next',
          message: "node graph cycle back to 'n_line'",
        },
      ],
    },
    {
      name: 'orphan text',
      mutate: (c) => {
        c.text['t.test.unused'] = '沒有人用';
      },
      expected: [
        { severity: 'error', id: 't.test.unused', path: 'text', message: 'orphan text: not referenced by any content' },
      ],
    },
    {
      name: 'negative skill effect',
      mutate: (c) => {
        choiceOf(c, 1).effects = [{ op: 'stat', stat: 'skill', delta: -5 }];
      },
      expected: [
        {
          severity: 'error',
          id: 'ev.test_scripted',
          path: 'nodes.n_choice.choices[1].effects[0].delta',
          message: 'negative skill delta: delta=-5',
        },
      ],
    },
    {
      name: 'unknown node target',
      mutate: (c) => {
        lineOf(c).next = 'n_missing';
      },
      expected: [
        { severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_line.next', message: "unknown node 'n_missing'" },
        { severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_choice', message: 'node unreachable from start' },
        { severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_result', message: 'node unreachable from start' },
      ],
    },
    {
      name: 'unknown preset',
      mutate: (c) => {
        taskOf(c).action = { kind: 'minigame', minigame: 'mg.spc', preset: 'nope' };
      },
      expected: [
        { severity: 'error', id: 'task.test_spc', path: 'action.preset', message: "unknown preset 'mg.spc/nope'" },
      ],
    },
    {
      name: 'bad placeholder',
      mutate: (c) => {
        c.text['t.ev.test_scripted.line'] = '你好 {nmae}';
      },
      expected: [
        { severity: 'error', id: 't.ev.test_scripted.line', path: 'text', message: "unknown placeholder '{nmae}'" },
      ],
    },
    {
      name: 'key and id disagree',
      mutate: (c) => {
        taskOf(c).id = 'task.other';
      },
      expected: [
        { severity: 'error', id: 'task.test_spc', path: 'id', message: 'id does not match key: id=task.other' },
      ],
    },
    {
      name: 'malformed event id in a reference',
      mutate: (c) => {
        defined(c.keyDays['kd.test_start'], 'kd').events = [{ event: 'ev.Test', checkpoint: 'shiftStart' }];
      },
      expected: [
        { severity: 'error', id: 'kd.test_start', path: 'events[0].event', message: "unknown event 'ev.Test'" },
      ],
    },
    {
      name: 'minigame task with a stamina cost',
      mutate: (c) => {
        taskOf(c).staminaCost = 4;
      },
      expected: [
        {
          severity: 'error',
          id: 'task.test_spc',
          path: 'staminaCost',
          message: 'minigame task must not cost stamina: staminaCost=4',
        },
      ],
    },
    {
      name: 'malformed registry key',
      mutate: (c) => {
        c.flags['flag.Bad'] = { description: 'Capitalised on purpose', scope: 'run' };
      },
      expected: [{ severity: 'error', id: 'flag.Bad', path: 'id', message: "invalid id format: 'flag.Bad'" }],
    },
    {
      name: 'malformed node key',
      mutate: (c) => {
        lineOf(c).next = 'n_Mid';
        const event = eventOf(c);
        event.nodes = {
          ...event.nodes,
          n_Mid: { kind: 'line', speaker: 'narrator', text: 't.ev.test_scripted.line', next: 'n_choice' },
        };
      },
      expected: [
        { severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_Mid', message: "invalid id format: 'n_Mid'" },
      ],
    },
    {
      name: 'malformed choice id',
      mutate: (c) => {
        choiceOf(c, 0).id = 'c-yes';
      },
      expected: [
        {
          severity: 'error',
          id: 'ev.test_scripted',
          path: 'nodes.n_choice.choices[0].id',
          message: "invalid id format: 'c-yes'",
        },
      ],
    },
    {
      name: 'malformed seed id leaves its planting effect dangling',
      mutate: (c) => {
        defined(eventOf(c).seeds?.[0], 'seeds[0]').id = 'seed.Followup';
      },
      expected: [
        {
          severity: 'error',
          id: 'ev.test_scripted',
          path: 'seeds[0].id',
          message: "invalid id format: 'seed.Followup'",
        },
        {
          severity: 'error',
          id: 'ev.test_scripted',
          path: 'nodes.n_choice.choices[0].effects[1].seed',
          message: "unknown seed 'seed.test_followup'",
        },
      ],
    },
    {
      name: 'malformed modifier id',
      mutate: (c) => {
        choiceOf(c, 1).effects.push({
          op: 'modifier',
          modifier: { id: 'mod.Bad', kind: 'eventTagWeight', tag: 'office', multiplier: 1, durationDays: null },
        });
      },
      expected: [
        {
          severity: 'error',
          id: 'ev.test_scripted',
          path: 'nodes.n_choice.choices[1].effects[1].modifier.id',
          message: "invalid id format: 'mod.Bad'",
        },
      ],
    },
    {
      name: 'unknown modifier used as an object key',
      mutate: (c) => {
        c.balance.valuation.modifierValues = { 'mod.missing': 1 };
      },
      expected: [
        {
          severity: 'error',
          id: 'balance',
          path: 'valuation.modifierValues.mod.missing',
          message: "unknown modifier 'mod.missing'",
        },
      ],
    },
    {
      name: 'unknown hotspot',
      mutate: (c) => {
        taskOf(c).hotspot = 'hs.nowhere';
      },
      expected: [{ severity: 'error', id: 'task.test_spc', path: 'hotspot', message: "unknown hotspot 'hs.nowhere'" }],
    },
    {
      name: 'unknown chapter default preset',
      mutate: (c) => {
        c.minigames['mg.gowning'].chapterDefaults = { prologue: 'advanced' };
      },
      expected: [
        {
          severity: 'error',
          id: 'minigames',
          path: 'mg.gowning.chapterDefaults.prologue',
          message: "unknown preset 'mg.gowning/advanced'",
        },
      ],
    },
    {
      name: 'flag description that looks like an id',
      mutate: (c) => {
        defined(c.flags['flag.test_switch'], 'flag').description = 'flag.not_a_reference';
      },
      expected: [],
    },
    {
      name: 'missing start node',
      mutate: (c) => {
        eventOf(c).start = 'n_begin';
      },
      expected: [{ severity: 'error', id: 'ev.test_scripted', path: 'start', message: "unknown node 'n_begin'" }],
    },
    {
      name: 'choice node without choices',
      mutate: (c) => {
        nodeOf(c, 'n_choice', 'choice').choices = [];
      },
      expected: [
        {
          severity: 'error',
          id: 'ev.test_scripted',
          path: 'nodes.n_choice.choices',
          message: 'choice node has no choices',
        },
        { severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_result', message: 'node unreachable from start' },
        {
          severity: 'error',
          id: 't.ev.test_scripted.c_yes',
          path: 'text',
          message: 'orphan text: not referenced by any content',
        },
        {
          severity: 'error',
          id: 't.ev.test_scripted.c_no',
          path: 'text',
          message: 'orphan text: not referenced by any content',
        },
      ],
    },
    {
      name: 'every allowed placeholder',
      mutate: (c) => {
        c.text['t.ev.test_scripted.line'] = '{name}和{pronoun}在{date}拿到{grade}';
      },
      expected: [],
    },
  ])('$name', ({ mutate, expected }) => {
    const content = structuredClone(testContent) as MutableContent;
    mutate(content);
    expect(validateContent(content)).toEqual(expected);
  });
});
