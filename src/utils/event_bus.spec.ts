import { describe, expect, test } from 'bun:test';
import { createEventBus } from './event_bus';

type Events = { ping: number; pong: string };

describe('createEventBus', () => {
  test('calls listeners of one type in subscription order with the payload', () => {
    const bus = createEventBus<Events>();
    const calls: string[] = [];
    bus.on('ping', (payload) => calls.push(`first:${payload}`));
    bus.on('ping', (payload) => calls.push(`second:${payload}`));
    bus.on('pong', (payload) => calls.push(`pong:${payload}`));
    bus.emit('ping', 7);
    expect(calls).toEqual(['first:7', 'second:7']);
  });

  test('an unsubscribed listener is not called again', () => {
    const bus = createEventBus<Events>();
    const calls: number[] = [];
    const off = bus.on('ping', (payload) => calls.push(payload));
    bus.emit('ping', 1);
    off();
    bus.emit('ping', 2);
    expect(calls).toEqual([1]);
  });

  test('a listener added during emit waits for the next emit', () => {
    const bus = createEventBus<Events>();
    const calls: string[] = [];
    bus.on('ping', () => {
      calls.push('first');
      bus.on('ping', () => calls.push('late'));
    });
    bus.emit('ping', 1);
    const afterFirstEmit = calls.length;
    bus.emit('ping', 2);
    expect([afterFirstEmit, calls.length]).toEqual([1, 3]);
  });

  test('a throwing listener propagates and stops later listeners', () => {
    const bus = createEventBus<Events>();
    const later: number[] = [];
    bus.on('ping', () => {
      throw new Error('x');
    });
    bus.on('ping', (payload) => later.push(payload));
    expect(() => bus.emit('ping', 1)).toThrow('x');
    expect(later).toEqual([]);
  });
});
