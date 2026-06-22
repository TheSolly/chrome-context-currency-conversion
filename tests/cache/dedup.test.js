import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExchangeRateService } from '../../utils/api-service.js';

describe('ExchangeRateService request deduplication', () => {
  beforeEach(() => {
    globalThis.__resetChromeStorage();
  });

  it('coalesces concurrent fetches for the same base into one API call', async () => {
    const svc = new ExchangeRateService();
    const spy = vi.fn(async () => ({
      rates: { EUR: 0.9, GBP: 0.8 },
      source: 'TestAPI',
      timestamp: new Date(0).toISOString(),
      full: true
    }));
    svc.apiService.fetchRateTable = spy;

    const [a, b, c] = await Promise.all([
      svc.fetchRateTable('USD'),
      svc.fetchRateTable('USD'),
      svc.fetchRateTable('USD')
    ]);

    // One network call served all three concurrent requests.
    expect(spy).toHaveBeenCalledTimes(1);
    expect(a.rates.EUR).toBe(0.9);
    expect(b.rates.GBP).toBe(0.8);
    expect(c.source).toBe('TestAPI');
  });

  it('fetches separately for different bases', async () => {
    const svc = new ExchangeRateService();
    const spy = vi.fn(async () => ({
      rates: { X: 1 },
      source: 'TestAPI',
      timestamp: new Date(0).toISOString(),
      full: true
    }));
    svc.apiService.fetchRateTable = spy;

    await Promise.all([svc.fetchRateTable('USD'), svc.fetchRateTable('EUR')]);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('clears the in-flight entry after completion so later calls refetch', async () => {
    const svc = new ExchangeRateService();
    const spy = vi.fn(async () => ({
      rates: { EUR: 0.9 },
      source: 'TestAPI',
      timestamp: new Date(0).toISOString(),
      full: true
    }));
    svc.apiService.fetchRateTable = spy;

    await svc.fetchRateTable('USD');
    expect(svc.inFlight.size).toBe(0);

    await svc.fetchRateTable('USD');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
