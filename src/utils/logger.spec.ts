import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { InvariantError } from './errors';
import { createConsoleLogger, createMemoryLogger } from './logger';

const CONSOLE_METHODS = ['debug', 'info', 'warn', 'error'] as const;
const spies: { mockRestore(): void }[] = [];

beforeEach(() => {
  for (const method of CONSOLE_METHODS) {
    spies.push(spyOn(console, method).mockImplementation(() => undefined));
  }
});

afterEach(() => {
  for (const spy of spies.splice(0)) {
    spy.mockRestore();
  }
});

describe('createConsoleLogger', () => {
  const options = { level: 'warn', now: () => 'T', ringSize: 10 } as const;

  test('drops messages below the level and timestamps the rest', () => {
    const logger = createConsoleLogger(options).child('scheduler');
    logger.info('a');
    logger.warn('event deferred: event=ev.x');
    logger.error('boom', new Error('disk'));
    expect(logger.recent()).toEqual([
      'T warn [scheduler] event deferred: event=ev.x',
      'T error [scheduler] boom cause=disk',
    ]);
  });

  test('keeps only the newest ringSize lines', () => {
    const logger = createConsoleLogger({ ...options, ringSize: 2 });
    logger.warn('1');
    logger.warn('2');
    logger.warn('3');
    expect(logger.recent()).toEqual(['T warn 2', 'T warn 3']);
  });

  test('nested children stack their module prefixes', () => {
    const logger = createConsoleLogger(options);
    logger.child('a').child('b').warn('x');
    expect(logger.recent()).toEqual(['T warn [a] [b] x']);
  });

  test('strict mode rejects a multi-line message', () => {
    const logger = createConsoleLogger({ ...options, strictSingleLine: true });
    expect(() => logger.warn('a\nb')).toThrow(InvariantError);
  });

  test('strict mode folds newlines in a multi-line cause instead of throwing', () => {
    const logger = createConsoleLogger({ ...options, strictSingleLine: true });
    logger.error('save failed: slot=1', new Error('quota exceeded\r\n  at write\n  at save'));
    expect(logger.recent()).toEqual(['T error save failed: slot=1 cause=quota exceeded⏎  at write⏎  at save']);
  });

  test('strict mode still rejects a multi-line error message that has a cause', () => {
    const logger = createConsoleLogger({ ...options, strictSingleLine: true });
    expect(() => logger.error('save\nfailed', new Error('disk'))).toThrow(InvariantError);
  });

  test('lenient mode folds newlines into the return symbol', () => {
    const logger = createConsoleLogger(options);
    logger.warn('a\r\nb\nc');
    expect(logger.recent()).toEqual(['T warn a⏎b⏎c']);
  });
});

describe('createMemoryLogger', () => {
  test('records every level without a timestamp', () => {
    const logger = createMemoryLogger();
    logger.debug('d');
    logger.child('ui').info('i');
    expect(logger.lines).toEqual(['debug d', 'info [ui] i']);
  });

  test('folds a multi-line cause into one line', () => {
    const logger = createMemoryLogger();
    logger.error('render failed', 'shader\nlog');
    expect(logger.lines).toEqual(['error render failed cause=shader⏎log']);
  });

  test('is always strict', () => {
    expect(() => createMemoryLogger().info('x\ny')).toThrow(InvariantError);
  });
});
