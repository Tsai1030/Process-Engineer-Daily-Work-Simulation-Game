import type { PerspectiveCamera, Scene } from 'three';
import type { MotionPolicy, QualityTier, SceneId, SceneSnapshot } from '../model';
import { RenderError } from '../utils/errors';
import type { Logger } from '../utils/logger';
import type { CanvasTextureFactory } from './canvas_textures';
import { createResourceTracker, type ResourceTracker } from './resource_tracker';
import type { ToonKit } from './toon_kit';

// 01 §9.3 的 Stage 1 子集（D83）：沒有 navigation、characters；多了 textures、logger
export interface SceneModule {
  readonly id: SceneId;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  enter(snapshot: SceneSnapshot): void;
  update(snapshot: SceneSnapshot): void;
  tick(dtSec: number, elapsedSec: number, motion: MotionPolicy): void;
  exit(): void;
  dispose(): void;
}

export interface SceneBuildContext {
  kit: ToonKit;
  tracker: ResourceTracker;
  textures: CanvasTextureFactory;
  quality: QualityTier;
  logger: Logger;
}

export type SceneFactory = (ctx: SceneBuildContext) => SceneModule;

export interface SceneManager {
  show(snapshot: SceneSnapshot): SceneModule;
  current(): SceneModule | null;
  disposeAll(): void;
}

// Stage 1 只有一個 3D 場景，不快取；LRU 與淡入淡出在 Stage 3 加（01 §9.3）
export function createSceneManager(
  factories: Readonly<Partial<Record<SceneId, SceneFactory>>>,
  ctx: Omit<SceneBuildContext, 'tracker'>,
): SceneManager {
  let active: SceneModule | null = null;

  function release(): void {
    if (!active) return;
    active.exit();
    active.dispose();
    active = null;
  }

  return {
    show(snapshot) {
      if (active?.id === snapshot.scene) {
        active.update(snapshot);
        return active;
      }
      const factory = factories[snapshot.scene];
      if (!factory) throw new RenderError('sceneBuild', `no factory: scene=${snapshot.scene}`);
      release();
      const built = factory({ ...ctx, tracker: createResourceTracker() });
      active = built;
      built.enter(snapshot);
      return built;
    },
    current: () => active,
    disposeAll: release,
  };
}
