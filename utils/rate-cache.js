// v1.1.0 Performance & Caching: Durable exchange-rate cache
//
// A single source of truth for cached exchange rates, backed solely by
// chrome.storage.local. Stores the FULL per-base conversion table returned by
// the API, so one network call serves every target currency for that base.
//
// Service-worker safe: no localStorage / window usage (unlike the retired
// ConversionCache). The TTL and offline thresholds are read from user settings
// at call time, so changing them in the popup takes effect immediately.

import { settingsManager } from './settings-manager.js';

const KEY_PREFIX = 'rate_table_';
// Pre-1.1.0 cache keys, removed on upgrade by migrateLegacy().
const LEGACY_PREFIX = 'exchange_rate_cache_';

// Fallbacks if settings are unavailable (mirror DEFAULT_SETTINGS).
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
const DEFAULT_OFFLINE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Durable per-base exchange-rate cache.
 */
export class RateCache {
  /**
   * @param {Object} [deps]
   * @param {Function} [deps.getSettings] - Override settings source (used in tests).
   */
  constructor({ getSettings } = {}) {
    this._getSettings =
      getSettings ||
      (() => {
        try {
          return settingsManager.getSettings();
        } catch {
          return {};
        }
      });

    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Resolve runtime config from settings with safe fallbacks.
   * @returns {{ttl: number, offlineMaxAge: number, offlineEnabled: boolean}}
   */
  getConfig() {
    const s = this._getSettings() || {};
    const ttl = Number.isFinite(s.cacheTimeout) ? s.cacheTimeout : DEFAULT_TTL;
    const offlineMaxAge = Number.isFinite(s.offlineMaxAgeMs)
      ? s.offlineMaxAgeMs
      : DEFAULT_OFFLINE_MAX_AGE;
    const offlineEnabled = s.enableOfflineMode !== false; // default true
    return { ttl, offlineMaxAge, offlineEnabled };
  }

  keyFor(base) {
    return `${KEY_PREFIX}${String(base).toUpperCase()}`;
  }

  /** True if chrome.storage.local is usable in this context. */
  get available() {
    return (
      typeof chrome !== 'undefined' &&
      !!chrome.storage &&
      !!chrome.storage.local
    );
  }

  /**
   * Get the stored rate table for a base currency (regardless of freshness).
   * @param {string} base - Base currency code
   * @returns {Promise<Object|null>}
   */
  async getRateTable(base) {
    if (!this.available) {
      return null;
    }
    const key = this.keyFor(base);
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      console.warn('⚠️ RateCache.getRateTable failed:', error);
      return null;
    }
  }

  /**
   * Store the full conversion table for a base currency.
   * @param {string} base - Base currency code
   * @param {Object} rates - Map of target code -> rate
   * @param {string} [source] - API provider name
   * @returns {Promise<boolean>}
   */
  async setRateTable(base, rates, source = 'unknown') {
    if (!this.available) {
      return false;
    }
    if (!rates || typeof rates !== 'object') {
      return false;
    }

    const { ttl } = this.getConfig();
    const fetchedAt = Date.now();
    const table = {
      base: String(base).toUpperCase(),
      rates,
      source,
      fetchedAt,
      expiresAt: fetchedAt + ttl
    };

    try {
      await chrome.storage.local.set({ [this.keyFor(base)]: table });
      return true;
    } catch (error) {
      console.warn('⚠️ RateCache.setRateTable failed:', error);
      return false;
    }
  }

  /**
   * Resolve a single exchange rate from the cache.
   * Fresh tables are always served. Stale tables are served only when
   * allowStale is set (offline fallback) and the table is within offlineMaxAge.
   * @param {string} from - Source currency code
   * @param {string} to - Target currency code
   * @param {Object} [opts]
   * @param {boolean} [opts.allowStale] - Permit serving an expired table
   * @returns {Promise<{rate:number, cached:boolean, offline:boolean, stale:boolean, fetchedAt:number, source:string}|null>}
   */
  async getRate(from, to, { allowStale = false } = {}) {
    const table = await this.getRateTable(from);
    if (!table || !table.rates) {
      this.stats.misses++;
      return null;
    }

    const toCode = String(to).toUpperCase();
    const rate = table.rates[toCode];
    if (typeof rate !== 'number') {
      // Partial table (e.g. from a single-pair fallback provider) — treat as miss.
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const { offlineMaxAge } = this.getConfig();
    const age = now - table.fetchedAt;
    const stale = now > table.expiresAt;

    if (stale) {
      if (!allowStale || age > offlineMaxAge) {
        this.stats.misses++;
        return null;
      }
      this.stats.hits++;
      return {
        rate,
        cached: true,
        offline: true,
        stale: true,
        fetchedAt: table.fetchedAt,
        source: table.source
      };
    }

    this.stats.hits++;
    return {
      rate,
      cached: true,
      offline: false,
      stale: false,
      fetchedAt: table.fetchedAt,
      source: table.source
    };
  }

  /**
   * List base currencies that currently have a cached table.
   * Used by the background-refresh alarm to keep warm tables fresh.
   * @returns {Promise<string[]>}
   */
  async getCachedBases() {
    if (!this.available) {
      return [];
    }
    try {
      const all = await chrome.storage.local.get(null);
      return Object.keys(all)
        .filter(k => k.startsWith(KEY_PREFIX))
        .map(k => k.slice(KEY_PREFIX.length));
    } catch (error) {
      console.warn('⚠️ RateCache.getCachedBases failed:', error);
      return [];
    }
  }

  /**
   * Remove all cached rate tables.
   * @returns {Promise<void>}
   */
  async clear() {
    if (!this.available) {
      return;
    }
    try {
      const all = await chrome.storage.local.get(null);
      const keys = Object.keys(all).filter(k => k.startsWith(KEY_PREFIX));
      if (keys.length) {
        await chrome.storage.local.remove(keys);
      }
      console.log(`🗑️ Cleared ${keys.length} cached rate tables`);
    } catch (error) {
      console.warn('⚠️ RateCache.clear failed:', error);
    }
  }

  /**
   * One-time cleanup of pre-1.1.0 cache artifacts.
   * @returns {Promise<void>}
   */
  async migrateLegacy() {
    if (this.available) {
      try {
        const all = await chrome.storage.local.get(null);
        const keys = Object.keys(all).filter(k => k.startsWith(LEGACY_PREFIX));
        if (keys.length) {
          await chrome.storage.local.remove(keys);
          console.log(`🧹 Removed ${keys.length} legacy cache entries`);
        }
      } catch (error) {
        console.warn('⚠️ RateCache.migrateLegacy (storage) failed:', error);
      }
    }

    // Retired ConversionCache persisted to localStorage in popup/content contexts.
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('currency_conversion_cache');
        localStorage.removeItem('currency_conversion_frequent');
      } catch {
        // Non-critical
      }
    }
  }

  /**
   * Cache hit/miss statistics for this session.
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate =
      total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0.0';
    return { ...this.stats, total, hitRate: `${hitRate}%` };
  }
}

// Shared singleton used by the rest of the extension.
export const rateCache = new RateCache();
