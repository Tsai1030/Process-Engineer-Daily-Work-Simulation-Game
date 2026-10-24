import { describe, expect, it } from 'bun:test';
import { BoxGeometry, type EventDispatcher, Group, Mesh, MeshBasicMaterial, MeshToonMaterial, Texture } from 'three';
import { createResourceTracker } from './resource_tracker';

function buildScene(): { root: Group; resources: EventDispatcher<{ dispose: object }>[] } {
  const geometry = new BoxGeometry();
  const texture = new Texture();
  const textured = new MeshBasicMaterial({ map: texture });
  const shared = new MeshToonMaterial();
  Object.assign(shared.userData, { shared: true });
  const root = new Group();
  root.add(new Mesh(geometry, textured), new Mesh(geometry, shared));
  return { root, resources: [geometry, textured, texture] };
}

describe('createResourceTracker', () => {
  it('trackObject registers each unique geometry, material and texture once and skips shared ones', () => {
    const tracker = createResourceTracker();
    tracker.trackObject(buildScene().root);
    expect(tracker.size).toEqual(3);
  });

  it('dispose releases every resource exactly once even when called twice', () => {
    const tracker = createResourceTracker();
    const { root, resources } = buildScene();
    const counts = [0, 0, 0];
    for (const [index, resource] of resources.entries()) {
      resource.addEventListener('dispose', () => {
        counts[index] = (counts[index] ?? 0) + 1;
      });
    }
    tracker.trackObject(root);
    tracker.dispose();
    tracker.dispose();
    expect({ counts, size: tracker.size }).toEqual({ counts: [1, 1, 1], size: 0 });
  });

  it('track returns the resource for inline use', () => {
    const texture = new Texture();
    expect(createResourceTracker().track(texture)).toBe(texture);
  });
});
