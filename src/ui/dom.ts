export interface Component<P> {
  readonly el: HTMLElement;
  update(props: P): void;
  destroy(): void;
}

export type Child = Node | string | null | false;
export type Attrs = Readonly<Record<string, string | number | boolean | EventListener | undefined>>;

function applyAttr(el: HTMLElement, name: string, value: Attrs[string]): void {
  if (value === undefined || value === false) return;
  if (typeof value === 'function') {
    if (name.startsWith('on')) el.addEventListener(name.slice(2).toLowerCase(), value);
    return;
  }
  el.setAttribute(name, value === true ? '' : String(value));
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) applyAttr(el, name, value);
  for (const child of children) {
    if (child === null || child === false) continue;
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

export function replaceChildrenKeyed<T>(
  parent: HTMLElement,
  items: readonly T[],
  key: (item: T) => string,
  create: (item: T) => Component<T>,
  live: Map<string, Component<T>>,
): void {
  const wanted = new Set(items.map(key));
  for (const [id, component] of live) {
    if (wanted.has(id)) continue;
    component.destroy();
    component.el.remove();
    live.delete(id);
  }
  items.forEach((item, index) => {
    const id = key(item);
    let component = live.get(id);
    if (component === undefined) {
      component = create(item);
      live.set(id, component);
    }
    component.update(item);
    if (parent.children[index] !== component.el) parent.insertBefore(component.el, parent.children[index] ?? null);
  });
}
