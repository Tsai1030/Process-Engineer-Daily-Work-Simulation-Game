import { NoToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';
import type { MotionPolicy, QualityTier, SceneId, SceneSnapshot } from '../model';
import { InvariantError } from '../utils/errors';
import type { Logger } from '../utils/logger';
import { clamp } from '../utils/math';
import { createCanvasTextureFactory } from './canvas_textures';
import { PIXEL_RATIO_CAP } from './look';
import { createSceneManager, type SceneFactory } from './scene_manager';
import { createFabBayScene } from './scenes/fab_bay';
import { createToonKit } from './toon_kit';

// 01 §9.2 的 Stage 1 子集（D83）
export interface RenderHost {
  readonly mode: 'webgl' | 'none';
  apply(snapshot: SceneSnapshot): Promise<void>;
  setMotion(policy: MotionPolicy): void;
  renderFrame(dtMs: number): void;
  dispose(): void;
}

export interface CameraFraming {
  aspect: number;
  fov: number;
  offsetY: number;
}

// 範例 resize()（L620-628）與 04 §7 構圖位移
const FRAMING = {
  referenceHalfFovDeg: 32,
  minFov: 54,
  maxFov: 84,
  narrowBelowPx: 760,
  narrowShift: 0.2,
  wideShift: 0.12,
} as const;
// 01 §9.7 L1：觸控＋螢幕寬 ≤760px 判定為手機
const MOBILE_MAX_WIDTH = 760;
// 04 §2.1 CanvasTexture anisotropy
const ANISOTROPY: Readonly<Record<QualityTier, number>> = { high: 4, medium: 2, low: 1 };
const SCENE_FACTORIES: Readonly<Partial<Record<SceneId, SceneFactory>>> = { 'scn.fab_bay': createFabBayScene };
const DEG = Math.PI / 180;

export function cameraFraming(width: number, height: number): CameraFraming {
  const aspect = width / height;
  const fitted = (2 * Math.atan(Math.tan(FRAMING.referenceHalfFovDeg * DEG) / aspect)) / DEG;
  const shift = width < FRAMING.narrowBelowPx ? FRAMING.narrowShift : FRAMING.wideShift;
  return { aspect, fov: clamp(fitted, FRAMING.minFov, FRAMING.maxFov), offsetY: height * shift };
}

function resolveTier(win: Window, quality: QualityTier | 'auto'): QualityTier {
  if (quality !== 'auto') return quality;
  return win.matchMedia('(pointer: coarse)').matches && win.innerWidth <= MOBILE_MAX_WIDTH ? 'medium' : 'high';
}

// L4 的 CSS 靜態背景在 Stage 3（01 §9.7）
function createInertHost(): RenderHost {
  return {
    mode: 'none',
    apply: () => Promise.resolve(),
    setMotion: () => undefined,
    renderFrame: () => undefined,
    dispose: () => undefined,
  };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createRenderHost(
  doc: Document,
  options: { logger: Logger; quality: QualityTier | 'auto' },
): RenderHost {
  const win = doc.defaultView;
  if (win === null) throw new InvariantError('Render host needs a window: document has no defaultView');
  const canvas = doc.getElementById('scene');
  if (!(canvas instanceof win.HTMLCanvasElement)) throw new InvariantError('Render canvas missing: id=scene');
  const logger = options.logger.child('render');
  const tier = resolveTier(win, options.quality);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: tier === 'high',
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    logger.warn(`webgl unavailable: detail=${describeError(error)}`);
    doc.body.dataset['render'] = 'none';
    return createInertHost();
  }
  renderer.outputColorSpace = SRGBColorSpace;
  // 04 §2.1：tone mapping 會把三階色塊壓扁
  renderer.toneMapping = NoToneMapping;
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, PIXEL_RATIO_CAP[tier]));
  doc.body.dataset['render'] = 'webgl';

  const kit = createToonKit();
  const textures = createCanvasTextureFactory(doc, { anisotropy: ANISOTROPY[tier] });
  const scenes = createSceneManager(SCENE_FACTORIES, { kit, textures, quality: tier, logger });
  let motion: MotionPolicy = { reduced: false };
  let lastSnapshot: SceneSnapshot | null = null;
  let paused = false;
  let elapsedMs = 0;

  const fit = (): void => {
    const width = win.innerWidth;
    const height = win.innerHeight;
    renderer.setSize(width, height, false);
    const camera = scenes.current()?.camera;
    if (!camera) return;
    const framing = cameraFraming(width, height);
    camera.aspect = framing.aspect;
    camera.fov = framing.fov;
    camera.setViewOffset(width, height, 0, framing.offsetY, width, height);
    camera.updateProjectionMatrix();
  };

  function onContextLost(event: Event): void {
    event.preventDefault();
    paused = true;
    doc.body.dataset['render'] = 'lost';
    logger.warn('webgl context lost');
  }

  // 01 §9.3：丟掉全部快取並用最後一份快照重建；5 分鐘內兩次改 L4 在 Stage 3
  function onContextRestored(): void {
    scenes.disposeAll();
    if (lastSnapshot) scenes.show(lastSnapshot);
    fit();
    paused = false;
    doc.body.dataset['render'] = 'webgl';
    logger.info(`webgl context restored: scene=${lastSnapshot?.scene ?? 'none'}`);
  }

  win.addEventListener('resize', fit);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  fit();

  return {
    mode: 'webgl',
    // async：show() 丟出的錯變成 rejection。setSize 會重配並清空繪圖緩衝，所以只在換了場景（相機）時 fit
    async apply(snapshot) {
      lastSnapshot = snapshot;
      const shownBefore = scenes.current();
      if (scenes.show(snapshot) !== shownBefore) fit();
    },
    setMotion(policy) {
      motion = policy;
    },
    renderFrame(dtMs) {
      const active = scenes.current();
      if (paused || !active) return;
      elapsedMs += dtMs;
      active.tick(dtMs / 1000, elapsedMs / 1000, motion);
      renderer.render(active.scene, active.camera);
    },
    dispose() {
      win.removeEventListener('resize', fit);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      scenes.disposeAll();
      kit.dispose();
      renderer.dispose();
    },
  };
}
