import type { ResumeDef, ResumeId } from '../model';

// 02 §1.2
export const resumes = {
  'res.beiwan_materials': {
    id: 'res.beiwan_materials',
    label: 't.res.beiwan_materials.label',
    description: 't.res.beiwan_materials.description',
    initialStats: { skill: 25, bossFavor: 50, favor: 2, money: 60000, network: 15 },
    initialAffinity: {},
    initialFlags: [],
    minigameTolerance: {},
  },
  'res.lujiang_electronics': {
    id: 'res.lujiang_electronics',
    label: 't.res.lujiang_electronics.label',
    description: 't.res.lujiang_electronics.description',
    initialStats: { skill: 18, bossFavor: 55, favor: 3, money: 45000, network: 10, scheming: 15 },
    initialAffinity: {},
    initialFlags: [],
    minigameTolerance: {},
  },
  'res.technician_transfer': {
    id: 'res.technician_transfer',
    label: 't.res.technician_transfer.label',
    description: 't.res.technician_transfer.description',
    initialStats: { skill: 22, bossFavor: 50, favor: 4, money: 260000, network: 10 },
    initialAffinity: { 'chr.meiling': 30 },
    initialFlags: ['flag.ex_operator'],
    minigameTolerance: { 'mg.spc': 1 },
  },
} satisfies Record<ResumeId, ResumeDef>;
