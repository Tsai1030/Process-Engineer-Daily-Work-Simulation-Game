import type { CampaignDef, KeyDayDef, KeyDayId } from '../model';

// 章節日期見 GDD §3.1（D85）；keyDayTarget 見 02 §14.4；期滿結局在 Stage 5 加
export const campaign = {
  startDate: '2027-03-01',
  termEndDate: '2028-02-29',
  chapters: [
    {
      id: 'prologue',
      title: 't.chapter.prologue',
      from: '2027-03-01',
      to: '2027-03-05',
      fastForward: 'week',
      keyDays: [],
    },
    { id: 'ch1', title: 't.chapter.ch1', from: '2027-03-08', to: '2027-04-16', fastForward: 'week', keyDays: [] },
    { id: 'ch2', title: 't.chapter.ch2', from: '2027-04-19', to: '2027-05-31', fastForward: 'week', keyDays: [] },
    { id: 'ch3', title: 't.chapter.ch3', from: '2027-06-01', to: '2028-02-29', fastForward: 'month', keyDays: [] },
  ],
  keyDayTarget: { min: 21, max: 21 },
  termEndings: [],
  templates: { conditional: 'kd.cond_public_execution', interrupt: 'kd.tpl_interrupt' },
} satisfies CampaignDef;

// kd.tpl_interrupt 見 02 §5.8；kd.cond_public_execution 見 02 §2.7、§6.6
export const keyDays = {
  'kd.tpl_interrupt': {
    id: 'kd.tpl_interrupt',
    date: null,
    kind: 'interrupt',
    chapter: null,
    title: 't.kd.tpl_interrupt',
    variant: 'short',
    phases: ['shift', 'sleep'],
    shiftWindow: { from: '20:00', to: '23:59' },
    endShiftWhenEventsDone: true,
    events: [],
    tasks: [],
    onCall: true,
  },
  'kd.cond_public_execution': {
    id: 'kd.cond_public_execution',
    date: null,
    kind: 'conditional',
    chapter: 'ch1',
    title: 't.kd.cond_public_execution',
    variant: 'short',
    phases: ['briefing'],
    events: [],
    tasks: [],
    onCall: false,
  },
} satisfies Record<KeyDayId, KeyDayDef>;
