import type { MachineId, MachineStatus } from '../model';

export const DEV_PANEL_MARKER = '__FAB7_DEV_PANEL__';

// scripts/check_dist.ts relies on this side effect so the marker survives tree-shaking in any bundle containing the panel
document.documentElement.dataset['devPanel'] = DEV_PANEL_MARKER;

export interface CalibrationOverrides {
  machines: Readonly<Partial<Record<MachineId, MachineStatus>>>;
  hideUi: boolean;
}

// 04 §2.4 並排校準：機台燈號照範例畫面（D87）
const CALIBRATION_MACHINES: Readonly<Partial<Record<MachineId, MachineStatus>>> = {
  'mc.et03': 'down',
  'mc.et04': 'run',
  'mc.et05': 'run',
  'mc.et06': 'warn',
};

export function calibrationOverrides(win: Window): CalibrationOverrides | null {
  if (new URLSearchParams(win.location.search).get('calib') !== '1') return null;
  return { machines: CALIBRATION_MACHINES, hideUi: true };
}
