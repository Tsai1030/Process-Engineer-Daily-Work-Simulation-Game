import { describe, expect, it } from 'bun:test';
import { BoxGeometry, type EventDispatcher, Group, Mesh, MeshBasicMaterial, MeshToonMaterial, Texture } from 'three';
import { createResourceTracker } from './resource_tracker';
import { createToonKit } from './toon_kit';

type Disposable = EventDispatcher<{ dispose: object }>;

function countDisposals(resources: Disposable[]): number[] {
  const counts = resources.map(() => 0);
  for (const [index, resource] of resources.entries()) {
    resource.addEventListener('dispose', () => {
      counts[index] = (counts[index] ?? 0) + 1;
    });
  }
  return counts;
}

function markShared(resource: { userData: object }): void {
  Object.assign(resource.userData, { shared: true });
}

function buildScene(): { root: Group; owned: Disposable[]; shared: Disposable[] } {
  const geometry = new BoxGeometry();
  const texture = new Texture();
  const textured = new MeshBasicMaterial({ map: texture });
  const sharedGeometry = new BoxGeometry();
  const sharedTexture = new Texture();
  const sharedMaterial = new MeshToonMaterial({ map: sharedTexture });
  markShared(sharedGeometry);
  markShared(sharedTexture);
  markShared(sharedMaterial);
  const root = new Group();
  root.add(new Mesh(geometry, textured), new Mesh(geometry, sharedMaterial), new Mesh(sharedGeometry, textured));
  return { root, owned: [geometry, textured, texture], shared: [sharedGeometry, sharedMaterial, sharedTexture] };
}

describe('createResourceTracker', () => {
  it('trackObject registers each unique geometry, material and texture once and skips shared ones', () => {
    const tracker = createResourceTracker();
    tracker.trackObject(buildScene().root);
    expect(tracker.size).toEqual(3);
  });

  it('dispose releases every owned resource exactly once and never a shared one, even when called twice', () => {
    const tracker = createResourceTracker();
    const { root, owned, shared } = buildScene();
    const ownedCounts = countDisposals(owned);
    const sharedCounts = countDisposals(shared);
    tracker.trackObject(root);
    tracker.dispose();
    tracker.dispose();
    expect({ ownedCounts, sharedCounts, size: tracker.size }).toEqual({
      ownedCounts: [1, 1, 1],
      sharedCounts: [0, 0, 0],
      size: 0,
    });
  });

  it('a scene built from the toon kit tracks nothing and leaves every kit resource alive', () => {
    const kit = createToonKit();
    const group = new Group();
    const body = kit.box(group, [1, 1, 1], 0xff0000, [0, 0, 0], 0.05);
    const hull = body.getObjectByName('outline') as Mesh;
    const material = body.material as MeshToonMaterial;
    const kitResources: Disposable[] = [
      material,
      body.geometry,
      hull.geometry,
      kit.outlineMaterial,
      material.gradientMap as Texture,
    ];
    const counts = countDisposals(kitResources);
    const tracker = createResourceTracker();
    tracker.trackObject(group);
    const sizeBefore = tracker.size;
    tracker.dispose();
    expect({ sizeBefore, counts }).toEqual({ sizeBefore: 0, counts: [0, 0, 0, 0, 0] });
  });

  it('track returns the resource for inline use', () => {
    const texture = new Texture();
    expect(createResourceTracker().track(texture)).toBe(texture);
  });
});
