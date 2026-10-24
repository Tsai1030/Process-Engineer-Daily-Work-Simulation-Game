export interface EventBus<M extends Record<string, unknown>> {
  on<K extends keyof M>(type: K, listener: (payload: M[K]) => void): () => void;
  emit<K extends keyof M>(type: K, payload: M[K]): void;
}

export function createEventBus<M extends Record<string, unknown>>(): EventBus<M> {
  const listeners = new Map<keyof M, ((payload: never) => void)[]>();
  return {
    on(type, listener) {
      const current = listeners.get(type) ?? [];
      listeners.set(type, [...current, listener]);
      return () => {
        const remaining = (listeners.get(type) ?? []).filter((candidate) => candidate !== listener);
        listeners.set(type, remaining);
      };
    },
    emit(type, payload) {
      for (const listener of listeners.get(type) ?? []) {
        listener(payload as never);
      }
    },
  };
}
