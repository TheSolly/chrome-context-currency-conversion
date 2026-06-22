import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateCache } from '../../utils/rate-cache.js';

const TTL = 60 * 60 * 1000; // 1 hour
const OFFLINE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const T0 = 1_700_000_000_000;

function makeCache(overrides = {}) {
  return new RateCache({
    getSettings: () => ({
      cacheTimeout: TTL,
      offlineMaxAgeMs: OFFLINE_MAX_AGE,
      enableOfflineMode: true,
      ...overrides
    })
  });
}

describe('RateCache', () => {
  beforeEach(() => {
    globalThis.__resetChromeStorage();
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and reads a full rate table with TTL-derived expiry', async () => {
    const cache = makeCache();
    await cache.setRateTable('USD', { EUR: 0.9, GBP: 0.8 }, 'TestAPI');

    const table = await cache.getRateTable('USD');
    expect(table.base).toBe('USD');
    expect(table.rates.EUR).toBe(0.9);
    expect(table.fetchedAt).toBe(T0);
    expect(table.expiresAt).toBe(T0 + TTL);
  });

  it('resolves a direct rate as a fresh cache hit', async () => {
    const cache = makeCache();
    await cache.setRateTable('USD', { EUR: 0.9 }, 'TestAPI');

    const r = await cache.getRate('USD', 'EUR');
    expect(r).toMatchObject({
      rate: 0.9,
      cached: true,
      offline: false,
      stale: false
    });
  });

  it('normalizes currency casing', async () => {
    const cache = makeCache();
    await cache.setRateTable('usd', { EUR: 0.9 }, 'TestAPI');
    const r = await cache.getRate('usd', 'eur');
    expect(r?.rate).toBe(0.9);
  });

  it('returns null for a target missing from a partial table', async () => {
    const cache = makeCache();
    await cache.setRateTable('USD', { EUR: 0.9 }, 'TestAPI');
    expect(await cache.getRate('USD', 'JPY')).toBeNull();
  });

  it('treats an expired table as a miss for fresh reads', async () => {
    const cache = makeCache();
    await cache.setRateTable('USD', { EUR: 0.9 }, 'TestAPI');

    vi.setSystemTime(T0 + TTL + 1);
    expect(await cache.getRate('USD', 'EUR')).toBeNull();
  });

  it('serves a stale table offline when within offlineMaxAge', async () => {
    const cache = makeCache();
    await cache.setRateTable('USD', { EUR: 0.9 }, 'TestAPI');

    vi.setSystemTime(T0 + TTL + 1000);
    const r = await cache.getRate('USD', 'EUR', { allowStale: true });
    expect(r).toMatchObject({
      rate: 0.9,
      cached: true,
      offline: true,
      stale: true
    });
  });

  it('refuses a stale table older than offlineMaxAge', async () => {
    const cache = makeCache();
    await cache.setRateTable('USD', { EUR: 0.9 }, 'TestAPI');

    vi.setSystemTime(T0 + OFFLINE_MAX_AGE + 1);
    expect(await cache.getRate('USD', 'EUR', { allowStale: true })).toBeNull();
  });

  it('derives expiry from the configured cacheTimeout', async () => {
    const cache = makeCache({ cacheTimeout: 15 * 60 * 1000 });
    await cache.setRateTable('USD', { EUR: 0.9 }, 'TestAPI');

    const table = await cache.getRateTable('USD');
    expect(table.expiresAt).toBe(T0 + 15 * 60 * 1000);
  });

  it('lists cached bases and clears them', async () => {
    const cache = makeCache();
    await cache.setRateTable('USD', { EUR: 0.9 }, 'TestAPI');
    await cache.setRateTable('EUR', { USD: 1.1 }, 'TestAPI');

    expect((await cache.getCachedBases()).sort()).toEqual(['EUR', 'USD']);

    await cache.clear();
    expect(await cache.getCachedBases()).toEqual([]);
  });

  it('removes legacy cache keys on migrateLegacy without touching others', async () => {
    await chrome.storage.local.set({
      'exchange_rate_cache_USD-EUR': { rate: 0.9 },
      'exchange_rate_cache_offline_USD-EUR': { rate: 0.9 },
      keep_me: 1
    });

    const cache = makeCache();
    await cache.migrateLegacy();

    const all = await chrome.storage.local.get(null);
    expect(all['exchange_rate_cache_USD-EUR']).toBeUndefined();
    expect(all['exchange_rate_cache_offline_USD-EUR']).toBeUndefined();
    expect(all.keep_me).toBe(1);
  });

  it('tracks hit/miss statistics', async () => {
    const cache = makeCache();
    await cache.setRateTable('USD', { EUR: 0.9 }, 'TestAPI');

    await cache.getRate('USD', 'EUR'); // hit
    await cache.getRate('USD', 'JPY'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('50.0%');
  });
});
