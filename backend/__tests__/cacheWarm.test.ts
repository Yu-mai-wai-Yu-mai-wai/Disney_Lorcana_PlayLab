import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { connectMock, ctorMock } = vi.hoisted(() => ({ connectMock: vi.fn(), ctorMock: vi.fn() }));
vi.mock('ioredis', () => ({
  default: class {
    constructor(opts: any) {
      ctorMock(opts);
    }
    on() {
      return this;
    }
    connect = connectMock;
    disconnect() {}
  },
}));

import { warmCache, getRedisClient, resetRedisClientForTest } from '../shared/cache';

// Bug seen on AWS: the client was created and connected lazily on the first request, and with
// enableOfflineQueue=false that first request (per process) failed silently. With 2 instances x N workers
// the leaderboard kept answering MISS. The connection must be open before the first request arrives.
describe('cache connects at start-up (TC-CACHE-001..)', () => {
  beforeEach(() => {
    resetRedisClientForTest();
    connectMock.mockReset().mockResolvedValue(undefined);
    ctorMock.mockReset();
    process.env.CACHE_ENDPOINT = 'cache.internal:6379';
  });
  afterEach(() => {
    delete process.env.CACHE_ENDPOINT;
    resetRedisClientForTest();
  });

  it('TC-CACHE-001 warmCache() opens the connection immediately, before any get/set', () => {
    warmCache();
    expect(ctorMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('TC-CACHE-002 later getRedisClient() calls reuse the same client and do not reconnect', () => {
    warmCache();
    const a = getRedisClient();
    const b = getRedisClient();
    expect(a).toBe(b);
    expect(ctorMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('TC-CACHE-003 no CACHE_ENDPOINT: warmCache() does nothing and does not throw', () => {
    delete process.env.CACHE_ENDPOINT;
    expect(() => warmCache()).not.toThrow();
    expect(ctorMock).not.toHaveBeenCalled();
  });

  it('TC-CACHE-004 a failing connect is swallowed (leaderboard falls back to DynamoDB)', async () => {
    connectMock.mockRejectedValue(new Error('ECONNREFUSED'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => warmCache()).not.toThrow();
    await Promise.resolve();
  });
});
