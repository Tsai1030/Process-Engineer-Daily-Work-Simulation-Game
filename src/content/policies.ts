import type { LifeActionDef, LifeActionId, LifePolicyId, PolicyDef, WorkPolicyId } from '../model';

// 02 §5.4；「拚」的健康債遞增與休養／運動歸零連拚月數由 fast_forward 依 02 §5.5 處理；「省」的下班被叫住見 D91
export const workPolicies = {
  grind: {
    id: 'grind',
    label: 't.policy.grind.label',
    description: 't.policy.grind.description',
    monthlyEffects: [
      { op: 'stat', stat: 'skill', delta: 4 },
      { op: 'stat', stat: 'bossFavor', delta: 6 },
      { op: 'stat', stat: 'visibility', delta: 5 },
      { op: 'stat', stat: 'mind', delta: -10 },
      { op: 'stat', stat: 'lifeSatisfaction', delta: -8 },
    ],
    overtimeHoursPerMonth: 44,
  },
  steady: {
    id: 'steady',
    label: 't.policy.steady.label',
    description: 't.policy.steady.description',
    monthlyEffects: [
      { op: 'stat', stat: 'skill', delta: 2 },
      { op: 'stat', stat: 'bossFavor', delta: 1 },
      { op: 'stat', stat: 'mind', delta: -3 },
      { op: 'stat', stat: 'healthDebt', delta: 2 },
    ],
    overtimeHoursPerMonth: 18,
  },
  save: {
    id: 'save',
    label: 't.policy.save.label',
    description: 't.policy.save.description',
    monthlyEffects: [
      { op: 'stat', stat: 'mind', delta: 5 },
      { op: 'stat', stat: 'lifeSatisfaction', delta: 6 },
      { op: 'stat', stat: 'bossFavor', delta: -5 },
      { op: 'stat', stat: 'visibility', delta: -4 },
    ],
    overtimeHoursPerMonth: 0,
  },
  learn: {
    id: 'learn',
    label: 't.policy.learn.label',
    description: 't.policy.learn.description',
    monthlyEffects: [
      { op: 'stat', stat: 'skill', delta: 3 },
      { op: 'stat', stat: 'network', delta: 3 },
      { op: 'stat', stat: 'stamina', delta: -5 },
      { op: 'stat', stat: 'mind', delta: -2 },
      { op: 'stat', stat: 'lifeSatisfaction', delta: -2 },
      { op: 'stat', stat: 'money', delta: -3000 },
    ],
    overtimeHoursPerMonth: 8,
  },
} satisfies Record<WorkPolicyId, PolicyDef<WorkPolicyId>>;

export const lifePolicies = {
  rest: {
    id: 'rest',
    label: 't.policy.rest.label',
    description: 't.policy.rest.description',
    monthlyEffects: [
      { op: 'stat', stat: 'healthDebt', delta: -4 },
      { op: 'stat', stat: 'mind', delta: 6 },
    ],
    overtimeHoursPerMonth: 0,
  },
  partner: {
    id: 'partner',
    label: 't.policy.partner.label',
    description: 't.policy.partner.description',
    monthlyEffects: [
      { op: 'affinity', character: 'chr.aan', delta: 8 },
      { op: 'stat', stat: 'lifeSatisfaction', delta: 6 },
      { op: 'stat', stat: 'money', delta: -6000 },
    ],
    overtimeHoursPerMonth: 0,
  },
  family: {
    id: 'family',
    label: 't.policy.family.label',
    description: 't.policy.family.description',
    monthlyEffects: [
      { op: 'affinity', character: 'chr.mom', delta: 8 },
      { op: 'stat', stat: 'lifeSatisfaction', delta: 3 },
      { op: 'stat', stat: 'money', delta: -3000 },
    ],
    overtimeHoursPerMonth: 0,
  },
  social: {
    id: 'social',
    label: 't.policy.social.label',
    description: 't.policy.social.description',
    monthlyEffects: [
      {
        op: 'chance',
        p: 1,
        then: [
          {
            op: 'chance',
            p: 0.2,
            then: [{ op: 'affinity', character: 'chr.azhe', delta: 6 }],
            else: [
              {
                op: 'chance',
                p: 0.25,
                then: [{ op: 'affinity', character: 'chr.xiaoqing', delta: 6 }],
                else: [
                  {
                    op: 'chance',
                    p: 0.3333333333333333,
                    then: [{ op: 'affinity', character: 'chr.haoge', delta: 6 }],
                    else: [
                      {
                        op: 'chance',
                        p: 0.5,
                        then: [{ op: 'affinity', character: 'chr.meiling', delta: 6 }],
                        else: [{ op: 'affinity', character: 'chr.vivian', delta: 6 }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { op: 'chance', p: 0.5, then: [{ op: 'stat', stat: 'favor', delta: 1 }] },
      { op: 'stat', stat: 'money', delta: -2500 },
    ],
    overtimeHoursPerMonth: 0,
  },
  exercise: {
    id: 'exercise',
    label: 't.policy.exercise.label',
    description: 't.policy.exercise.description',
    monthlyEffects: [
      { op: 'stat', stat: 'healthDebt', delta: -6 },
      { op: 'counter', counter: 'cnt.sys_exercise_bonus', delta: 2 },
      { op: 'stat', stat: 'mind', delta: 2 },
    ],
    overtimeHoursPerMonth: 0,
  },
  saveMoney: {
    id: 'saveMoney',
    label: 't.policy.save_money.label',
    description: 't.policy.save_money.description',
    monthlyEffects: [
      { op: 'stat', stat: 'money', delta: 5000 },
      { op: 'stat', stat: 'lifeSatisfaction', delta: -4 },
    ],
    overtimeHoursPerMonth: 0,
  },
} satisfies Record<LifePolicyId, PolicyDef<LifePolicyId>>;

export const lifeActions = {} satisfies Record<LifeActionId, LifeActionDef>;
