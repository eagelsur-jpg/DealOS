import { describe, it, expect, vi } from 'vitest';
import { InMemoryCacheStore, RedisCacheStore } from '../dist/cache.js';
describe('cache and shared rate limit', () => {
  it('expires local cache values', async () => {
    vi.useFakeTimers();
    const cache = new InMemoryCacheStore();
    await cache.set('entry', { value: 1 }, 1);
    expect(await cache.get('entry')).toEqual({ value: 1 });
    vi.advanceTimersByTime(1001);
    expect(await cache.get('entry')).toBeNull();
    vi.useRealTimers();
  });
  it('uses one atomic Redis operation with a TTL for the rate bucket', async () => {
    const evalFn = vi.fn().mockResolvedValue(2);
    const cache = new RedisCacheStore({ get: vi.fn(), set: vi.fn(), del: vi.fn(), eval: evalFn });
    expect(await cache.consumeRateLimit('redirect', 60000)).toBe(2);
    expect(evalFn.mock.calls[0].slice(1)).toEqual([1, 'dealos:rate:redirect', 60000]);
    expect(evalFn.mock.calls[0][0]).toContain('PEXPIRE');
  });
});
