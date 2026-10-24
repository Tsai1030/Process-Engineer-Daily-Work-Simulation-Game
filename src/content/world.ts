import type { LocationDef, LocationId, MachineDef, MachineId, TaskDef, TaskId } from '../model';

// 04 §4.2；黃光區的 staminaPerHour 是 GDD §4.1 每小時額外扣的體力
export const locations = {
  'loc.etch_bay': {
    id: 'loc.etch_bay',
    name: 't.loc.etch_bay',
    scene: 'scn.fab_bay',
    mode: '3d',
    cleanroom: true,
    staminaPerHour: 0,
    hotspots: [
      'hs.et03',
      'hs.et04',
      'hs.et05',
      'hs.et06',
      'hs.bay_terminal',
      'hs.bay_board',
      'hs.bay_phone',
      'hs.bay_exit',
      'hs.photo_gate',
    ],
  },
  'loc.photo_area': {
    id: 'loc.photo_area',
    name: 't.loc.photo_area',
    scene: 'scn.fab_bay',
    mode: '3d',
    cleanroom: true,
    staminaPerHour: 3,
    hotspots: [],
  },
} satisfies Record<LocationId, LocationDef>;

// 02 §1.10
export const machines = {
  'mc.et03': {
    id: 'mc.et03',
    label: 'ET-03',
    location: 'loc.etch_bay',
    hotspot: 'hs.et03',
    ownedByPlayer: true,
    initialHealth: 45,
  },
  'mc.et04': {
    id: 'mc.et04',
    label: 'ET-04',
    location: 'loc.etch_bay',
    hotspot: 'hs.et04',
    ownedByPlayer: true,
    initialHealth: 70,
  },
  'mc.et05': {
    id: 'mc.et05',
    label: 'ET-05',
    location: 'loc.etch_bay',
    hotspot: 'hs.et05',
    ownedByPlayer: true,
    initialHealth: 75,
  },
  'mc.et06': {
    id: 'mc.et06',
    label: 'ET-06',
    location: 'loc.etch_bay',
    hotspot: 'hs.et06',
    ownedByPlayer: true,
    initialHealth: 80,
  },
} satisfies Record<MachineId, MachineDef>;

export const tasks = {} satisfies Record<TaskId, TaskDef>;
