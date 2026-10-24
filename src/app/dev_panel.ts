export const DEV_PANEL_MARKER = '__FAB7_DEV_PANEL__';

// scripts/check_dist.ts relies on this side effect so the marker survives tree-shaking in any bundle containing the panel
document.documentElement.dataset['devPanel'] = DEV_PANEL_MARKER;
