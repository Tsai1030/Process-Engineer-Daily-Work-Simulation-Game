import { type Material, Mesh, type Object3D, Sprite } from 'three';

export interface ResourceTracker {
  track<T extends { dispose(): void }>(resource: T): T;
  /** 走訪 root：Mesh／Sprite 的 geometry、material（陣列也算）、material 上所有 Texture 型別的屬性；跳過 userData['shared'] === true 的資源 */
  trackObject(root: Object3D): void;
  /** 每個資源剛好 dispose 一次，然後清空；重複呼叫沒有作用 */
  dispose(): void;
  readonly size: number;
}

interface Disposable {
  dispose(): void;
  userData?: Record<string, unknown>;
}

function isShared(userData: object | undefined): boolean {
  return (userData as { shared?: boolean } | undefined)?.shared === true;
}

function isTexture(value: unknown): value is Disposable {
  return typeof value === 'object' && value !== null && (value as { isTexture?: boolean }).isTexture === true;
}

export function createResourceTracker(): ResourceTracker {
  const resources = new Set<{ dispose(): void }>();

  function trackUnlessShared(resource: Disposable): void {
    if (!isShared(resource.userData)) resources.add(resource);
  }

  function trackMaterial(material: Material): void {
    if (isShared(material.userData)) return;
    resources.add(material);
    for (const value of Object.values(material)) {
      if (isTexture(value)) trackUnlessShared(value);
    }
  }

  return {
    track<T extends { dispose(): void }>(resource: T): T {
      resources.add(resource);
      return resource;
    },
    trackObject(root) {
      root.traverse((object) => {
        if (object instanceof Mesh) trackUnlessShared(object.geometry);
        if (!(object instanceof Mesh) && !(object instanceof Sprite)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(trackMaterial);
      });
    },
    dispose() {
      const pending = [...resources];
      resources.clear();
      for (const resource of pending) resource.dispose();
    },
    get size() {
      return resources.size;
    },
  };
}
