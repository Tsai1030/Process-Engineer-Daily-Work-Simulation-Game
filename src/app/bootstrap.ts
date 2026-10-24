import '../ui/styles/tokens.css';
import '../ui/styles/comic.css';
import { content } from '../content';
import { validateContent } from '../core/content_validator';
import { createNewGame } from '../core/new_game';
import type { GameState, PlayerProfile, SceneSnapshot } from '../model';
import { createRenderHost, type RenderHost } from '../render/render_host';
import { createHud } from '../ui/components/hud';
import { createStatsPanel } from '../ui/components/stats_panel';
import { h } from '../ui/dom';
import { hudView, statsPanelView } from '../ui/view_models';
import { ContentError, InvariantError } from '../utils/errors';
import { createConsoleLogger } from '../utils/logger';
import { toSceneSnapshot } from './flow_controller';

// Stage 1 預覽用的固定角色；建角頁在後續 stage
const PREVIEW_PROFILE: PlayerProfile = { name: '新人', pronoun: 'neutral', resume: 'res.beiwan_materials', look: 'a' };
// 01 §6.6：分頁切回來時不讓一幀跳太遠
const MAX_FRAME_MS = 250;

async function loadCalibrationOverrides(win: Window) {
  if (import.meta.env.DEV) return (await import('./dev_panel')).calibrationOverrides(win);
  return null;
}

type Calibration = Awaited<ReturnType<typeof loadCalibrationOverrides>>;

function withCalibration(snapshot: SceneSnapshot, calibration: Calibration): SceneSnapshot {
  if (calibration === null) return snapshot;
  const machines = { ...snapshot.machines };
  for (const def of Object.values(content.machines)) {
    const status = calibration.machines[def.id];
    const current = machines[def.id];
    if (status !== undefined && current !== undefined) machines[def.id] = { ...current, status };
  }
  return { ...snapshot, machines };
}

function startRenderLoop(win: Window, render: RenderHost): void {
  let last = win.performance.now();
  const frame = (now: number): void => {
    render.renderFrame(Math.max(0, Math.min(MAX_FRAME_MS, now - last)));
    last = now;
    win.requestAnimationFrame(frame);
  };
  win.requestAnimationFrame(frame);
}

function mountUi(doc: Document, state: GameState): void {
  const root = doc.getElementById('ui');
  if (root === null) throw new InvariantError('UI mount failed: #ui element is missing');
  const hud = createHud();
  const stats = createStatsPanel();
  hud.update(hudView(state, content));
  stats.update(statsPanelView(state, content));
  root.append(h('div', { class: 'top' }, hud.el, stats.el));
}

export async function bootstrap(doc: Document): Promise<void> {
  const win = doc.defaultView;
  if (win === null) throw new InvariantError('Bootstrap failed: document has no window');
  doc.body.dataset['stage'] = '1';
  const logger = createConsoleLogger({
    level: import.meta.env.DEV ? 'debug' : 'warn',
    now: () => new Date().toISOString(),
    ringSize: 200,
    strictSingleLine: import.meta.env.DEV,
  });

  // D67：只有 error 擋啟動，warning 不阻擋
  const issues = validateContent(content);
  const errors = issues.filter((issue) => issue.severity === 'error');
  if (errors.length > 0) throw ContentError.fromIssues(errors);
  logger.debug(`content validated: errors=0 warnings=${issues.length}`);

  const seed = win.crypto.getRandomValues(new Uint32Array(1))[0];
  if (seed === undefined) throw new InvariantError('Seed generation failed: crypto returned no value');
  const state = createNewGame(PREVIEW_PROFILE, content, seed);
  const calibration = await loadCalibrationOverrides(win);

  const render = createRenderHost(doc, { logger, quality: 'auto' });
  render.setMotion({ reduced: win.matchMedia('(prefers-reduced-motion: reduce)').matches });
  await render.apply(withCalibration(toSceneSnapshot(state, content), calibration));
  if (calibration?.hideUi !== true) mountUi(doc, state);
  logger.info(`bootstrap ready: render=${render.mode} seed=${seed} calibration=${calibration !== null}`);
  startRenderLoop(win, render);
}
