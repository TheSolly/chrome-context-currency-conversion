import { describe, it, expect } from 'vitest';
import { ExchangeRateService } from '../../utils/api-service.js';

describe('ExchangeRateService.shouldNotRetry (v1.1.1 quota guard)', () => {
  const svc = new ExchangeRateService();

  it('does NOT retry on quota / rate-limit / 429 / auth errors', () => {
    const messages = [
      'HTTP 429: Too Many Requests',
      'API Error: quota-reached',
      'API rate limit exceeded. Please try again later.',
      'API Error: inactive-account',
      'API key not configured',
      'Unauthorized'
    ];
    for (const m of messages) {
      expect(svc.shouldNotRetry(new Error(m))).toBe(true);
    }
  });

  it('still retries on transient / unknown errors', () => {
    const messages = [
      'HTTP 500: Internal Server Error',
      'HTTP 503: Service Unavailable',
      'Failed to fetch',
      'NetworkError when attempting to fetch resource'
    ];
    for (const m of messages) {
      expect(svc.shouldNotRetry(new Error(m))).toBe(false);
    }
  });
});
