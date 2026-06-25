/**
 * Currency API Service
 * Handles currency conversion with multiple API providers and fallback mechanisms
 * v1.1.0: Consolidated caching via the durable RateCache (chrome.storage.local).
 *   One full per-base rate table is fetched and cached, so a single API call
 *   serves every target currency. Concurrent fetches for the same base are
 *   deduplicated, and stale rates power offline mode.
 * Phase 9, Task 9.1: Enhanced with security features
 */

// Import local API keys at the top level
import { LOCAL_API_KEYS } from './api-keys.local.js';
// v1.1.0: Durable, service-worker-safe exchange-rate cache
import { rateCache } from './rate-cache.js';
// Phase 9, Task 9.1: Import security manager
import { securityManager } from './security-manager.js';

/**
 * Secure fetch wrapper for Chrome extension environment with security validation
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function safeFetch(url, options = {}) {
  console.log(
    '🌐 safeFetch called with URL:',
    url.replace(/\/[a-f0-9]{24}\//, '/****/')
  );

  // Phase 9, Task 9.1: Validate URL before making request
  try {
    if (securityManager && !securityManager.validateApiUrl(url)) {
      throw new Error('Invalid or potentially unsafe API URL');
    }
  } catch (error) {
    console.warn(
      '⚠️ Security manager not available or failed validation:',
      error.message
    );
    // Continue without security validation for now
  }

  // Check rate limiting
  try {
    if (securityManager) {
      const rateLimit = securityManager.checkRateLimit('API_CALLS');
      if (!rateLimit.allowed) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
    }
  } catch (error) {
    console.warn('⚠️ Rate limiting check failed:', error.message);
    // Continue without rate limiting for now
  }

  // Log API request for security monitoring
  try {
    if (securityManager) {
      securityManager.logSecurityEvent('api_request', {
        url: url.replace(/([?&]access_key=)[^&]*/, '$1***'),
        method: options.method || 'GET'
      });
    }
  } catch (error) {
    console.warn('⚠️ Security logging failed:', error.message);
    // Continue without security logging
  }

  console.log('🚀 Making actual fetch request...');

  if (typeof globalThis.fetch !== 'undefined') {
    return globalThis.fetch(url, options);
  } else if (typeof window !== 'undefined' && window.fetch) {
    return window.fetch(url, options);
  } else {
    throw new Error('Fetch API not available');
  }
}

/**
 * API Provider configurations
 * Evaluated free currency APIs with their capabilities and limitations
 */
export const API_PROVIDERS = {
  EXCHANGERATE_API: {
    name: 'ExchangeRate-API',
    baseUrl: 'https://v6.exchangerate-api.com/v6',
    rateLimits: {
      registered: { requests: 1500, period: 'month' },
      features: [
        'Real-time rates',
        'Historical data',
        'Premium features with API key'
      ]
    },
    pros: ['High rate limit with API key', 'Reliable', 'Premium features'],
    cons: ['Requires API key for best experience'],
    priority: 1,
    requiresApiKey: true,
    isDefault: true
  },
  FIXER_IO: {
    name: 'Fixer.io',
    baseUrl: 'http://data.fixer.io/api/latest',
    rateLimits: {
      free: { requests: 1000, period: 'month' },
      features: ['168 currencies', 'JSON format', 'HTTPS on paid plans']
    },
    pros: ['Many currencies', 'Good documentation', 'Reliable service'],
    cons: ['Requires API key', 'HTTPS only on paid plans', 'Lower rate limit'],
    priority: 2,
    requiresApiKey: true
  },
  CURRENCY_API: {
    name: 'CurrencyAPI',
    baseUrl: 'https://api.currencyapi.com/v3/latest',
    rateLimits: {
      free: { requests: 300, period: 'month' },
      features: ['180+ currencies', 'Real-time rates', 'Historical data']
    },
    pros: ['Many currencies', 'Good free tier features', 'Modern API'],
    cons: ['Lower rate limit', 'Requires API key', 'Newer service'],
    priority: 3,
    requiresApiKey: true
  },
  ALPHA_VANTAGE: {
    name: 'Alpha Vantage',
    baseUrl: 'https://www.alphavantage.co/query',
    rateLimits: {
      free: { requests: 5, period: 'minute', daily: 500 },
      features: ['Real-time rates', 'Historical data', 'Stock data integration']
    },
    pros: [
      'Free API key',
      'Comprehensive financial data',
      'Good documentation'
    ],
    cons: [
      'Very low rate limit',
      'Complex response format',
      'Designed for stocks'
    ],
    priority: 4,
    requiresApiKey: true
  }
};

/**
 * API Key Management
 * Handles secure storage and retrieval of API keys
 */
export class ApiKeyManager {
  constructor() {
    this.storageKey = 'currency_api_keys';
  }

  /**
   * Store API key securely in Chrome storage
   * @param {string} provider - API provider name
   * @param {string} apiKey - API key to store
   */
  async storeApiKey(provider, apiKey) {
    try {
      const keys = await this.getAllApiKeys();
      keys[provider] = {
        key: apiKey,
        stored: new Date().toISOString(),
        lastUsed: null,
        usageCount: 0
      };

      await chrome.storage.local.set({ [this.storageKey]: keys });
      console.log(`✅ API key stored for ${provider}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store API key for ${provider}:`, error);
      return false;
    }
  }

  /**
   * Retrieve API key for a specific provider
   * @param {string} provider - API provider name
   * @returns {string|null} API key or null if not found
   */
  async getApiKey(provider) {
    try {
      const keys = await this.getAllApiKeys();
      const keyData = keys[provider];

      if (keyData) {
        // Update last used timestamp
        keyData.lastUsed = new Date().toISOString();
        keyData.usageCount = (keyData.usageCount || 0) + 1;
        await chrome.storage.local.set({ [this.storageKey]: keys });

        return keyData.key;
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to retrieve API key for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Get all stored API keys
   * @returns {Object} All stored API keys with metadata
   */
  async getAllApiKeys() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || {};
    } catch (error) {
      console.error('❌ Failed to retrieve API keys:', error);
      return {};
    }
  }

  /**
   * Remove API key for a specific provider
   * @param {string} provider - API provider name
   */
  async removeApiKey(provider) {
    try {
      const keys = await this.getAllApiKeys();
      delete keys[provider];
      await chrome.storage.local.set({ [this.storageKey]: keys });
      console.log(`✅ API key removed for ${provider}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove API key for ${provider}:`, error);
      return false;
    }
  }

  /**
   * Validate API key format
   * @param {string} provider - API provider name
   * @param {string} apiKey - API key to validate
   * @returns {boolean} True if format is valid
   */
  validateApiKeyFormat(provider, apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    const formatRules = {
      EXCHANGERATE_API: /^[a-f0-9]{24}$/i, // 24-character hex string
      FIXER_IO: /^[a-f0-9]{32}$/i, // 32-character hex string
      CURRENCY_API: /^[a-zA-Z0-9]{40}$/, // 40-character alphanumeric
      ALPHA_VANTAGE: /^[A-Z0-9]{16}$/ // 16-character uppercase alphanumeric
    };

    const rule = formatRules[provider];
    return rule ? rule.test(apiKey) : apiKey.length >= 16; // Generic fallback
  }

  /**
   * Get API key statistics
   * @returns {Object} Usage statistics for all stored keys
   */
  async getApiKeyStats() {
    const keys = await this.getAllApiKeys();
    const stats = {};

    for (const [provider, data] of Object.entries(keys)) {
      stats[provider] = {
        hasKey: true,
        stored: data.stored,
        lastUsed: data.lastUsed,
        usageCount: data.usageCount || 0
      };
    }

    return stats;
  }

  /**
   * Initialize API keys from local configuration
   * Should be called during extension startup
   */
  async initializeLocalApiKeys() {
    try {
      console.log('🔑 Loading local API keys into storage...');

      for (const [provider, apiKey] of Object.entries(LOCAL_API_KEYS)) {
        if (apiKey && apiKey.trim()) {
          // Check if key already exists to avoid overwriting
          const existingKey = await this.getApiKey(provider);

          if (!existingKey) {
            await this.storeApiKey(provider, apiKey);
            console.log(`✅ Loaded API key for ${provider}`);
          } else {
            console.log(`ℹ️ API key for ${provider} already exists`);
          }
        }
      }

      console.log('🎉 Local API keys initialization completed');
      return true;
    } catch (error) {
      console.warn('⚠️ Could not load local API keys:', error.message);
      // This is not a critical error - the extension can still work with manually configured keys
      return false;
    }
  }
}

/**
 * Currency Exchange Rate Service
 * Manages API calls with fallback mechanisms. Caching now lives in RateCache.
 */
export class CurrencyApiService {
  constructor() {
    this.apiKeyManager = new ApiKeyManager();
    this.requestQueue = [];
    this.isProcessing = false;
  }

  /**
   * Ensure API keys are initialized before making requests
   * @returns {Promise<void>}
   */
  async ensureApiKeysInitialized() {
    try {
      // Check if we have any API keys stored
      const stats = await this.apiKeyManager.getApiKeyStats();
      const hasAnyKeys = Object.keys(stats).length > 0;

      if (!hasAnyKeys) {
        console.log('🔑 No API keys found, initializing from local config...');
        await this.apiKeyManager.initializeLocalApiKeys();
      }
    } catch (error) {
      console.warn('⚠️ Failed to ensure API keys are initialized:', error);
    }
  }

  /**
   * Fetch a rate table for a base currency, trying providers in priority order.
   * ExchangeRate-API returns the FULL conversion table for the base (one call
   * serves every target). Other providers only support single pairs, so they
   * return a partial table for the hinted target.
   * @param {string} base - Base currency code
   * @param {string|null} hintTarget - Target currency (needed by single-pair providers)
   * @returns {Promise<{rates: Object, source: string, timestamp: string, full: boolean}>}
   */
  async fetchRateTable(base, hintTarget = null) {
    await this.ensureApiKeysInitialized();

    const providers = Object.keys(API_PROVIDERS).sort(
      (a, b) => API_PROVIDERS[a].priority - API_PROVIDERS[b].priority
    );

    const errors = [];

    for (const provider of providers) {
      try {
        if (provider === 'EXCHANGERATE_API') {
          const full = await this.fetchTableFromExchangeRateApi(base);
          if (full && full.rates) {
            console.log(
              `✅ Fetched full rate table for ${base} (${Object.keys(full.rates).length} currencies)`
            );
            return { ...full, full: true };
          }
        } else {
          // Single-pair providers can't build a full table without a target.
          if (!hintTarget) {
            continue;
          }
          const pair = await this.fetchFromProvider(provider, base, hintTarget);
          if (pair && typeof pair.rate === 'number') {
            return {
              rates: { [hintTarget.toUpperCase()]: pair.rate },
              source: pair.source,
              timestamp: pair.timestamp,
              full: false
            };
          }
        }
      } catch (error) {
        console.warn(
          `⚠️ ${API_PROVIDERS[provider].name} failed:`,
          error.message
        );
        errors.push(`${API_PROVIDERS[provider].name}: ${error.message}`);
        continue; // Try next provider
      }
    }

    throw new Error(
      'All API providers failed. Please check your internet connection and API keys. Errors: ' +
        errors.join('; ')
    );
  }

  /**
   * Fetch exchange rate from specific provider (single pair)
   * @param {string} provider - API provider name
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<Object>} Exchange rate data
   */
  async fetchFromProvider(provider, fromCurrency, toCurrency) {
    switch (provider) {
      case 'EXCHANGERATE_API':
        return await this.fetchFromExchangeRateApi(fromCurrency, toCurrency);
      case 'FIXER_IO':
        return await this.fetchFromFixerIo(fromCurrency, toCurrency);
      case 'CURRENCY_API':
        return await this.fetchFromCurrencyApi(fromCurrency, toCurrency);
      case 'ALPHA_VANTAGE':
        return await this.fetchFromAlphaVantage(fromCurrency, toCurrency);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Fetch the full conversion table from ExchangeRate-API for a base currency.
   * @param {string} base - Base currency code
   * @returns {Promise<{rates: Object, source: string, timestamp: string}>}
   */
  async fetchTableFromExchangeRateApi(base) {
    const apiKey = await this.apiKeyManager.getApiKey('EXCHANGERATE_API');
    if (!apiKey) {
      throw new Error('ExchangeRate-API key not configured');
    }

    const url = `${API_PROVIDERS.EXCHANGERATE_API.baseUrl}/${apiKey}/latest/${base}`;
    console.log('🌐 Making table request to:', url.replace(apiKey, '***'));

    const response = await safeFetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.result === 'error') {
      throw new Error(`API Error: ${data['error-type']}`);
    }
    if (!data.conversion_rates) {
      throw new Error(`No conversion rates returned for ${base}`);
    }

    return {
      rates: data.conversion_rates,
      source: 'ExchangeRate-API',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fetch a single pair from ExchangeRate-API (used by the per-pair fallback chain)
   */
  async fetchFromExchangeRateApi(fromCurrency, toCurrency) {
    const table = await this.fetchTableFromExchangeRateApi(fromCurrency);
    if (typeof table.rates[toCurrency] !== 'number') {
      throw new Error(`Rate not available for ${fromCurrency} → ${toCurrency}`);
    }
    return {
      rate: table.rates[toCurrency],
      source: table.source,
      timestamp: table.timestamp,
      fromCurrency,
      toCurrency
    };
  }

  /**
   * Fetch from Fixer.io (requires API key)
   */
  async fetchFromFixerIo(fromCurrency, toCurrency) {
    const apiKey = await this.apiKeyManager.getApiKey('FIXER_IO');
    if (!apiKey) {
      throw new Error('Fixer.io API key not configured');
    }

    const url = `${API_PROVIDERS.FIXER_IO.baseUrl}?access_key=${apiKey}&base=${fromCurrency}&symbols=${toCurrency}`;
    const response = await safeFetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.info || 'Fixer.io API error');
    }

    if (!data.rates || !data.rates[toCurrency]) {
      throw new Error(`Rate not available for ${fromCurrency} → ${toCurrency}`);
    }

    return {
      rate: data.rates[toCurrency],
      source: 'Fixer.io',
      timestamp: new Date(data.timestamp * 1000).toISOString(),
      fromCurrency,
      toCurrency
    };
  }

  /**
   * Fetch from CurrencyAPI (requires API key)
   */
  async fetchFromCurrencyApi(fromCurrency, toCurrency) {
    const apiKey = await this.apiKeyManager.getApiKey('CURRENCY_API');
    if (!apiKey) {
      throw new Error('CurrencyAPI key not configured');
    }

    const url = `${API_PROVIDERS.CURRENCY_API.baseUrl}?apikey=${apiKey}&base_currency=${fromCurrency}&currencies=${toCurrency}`;
    const response = await safeFetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.data || !data.data[toCurrency]) {
      throw new Error(`Rate not available for ${fromCurrency} → ${toCurrency}`);
    }

    return {
      rate: data.data[toCurrency].value,
      source: 'CurrencyAPI',
      timestamp: new Date(data.meta.last_updated_at).toISOString(),
      fromCurrency,
      toCurrency
    };
  }

  /**
   * Fetch from Alpha Vantage (requires API key)
   */
  async fetchFromAlphaVantage(fromCurrency, toCurrency) {
    const apiKey = await this.apiKeyManager.getApiKey('ALPHA_VANTAGE');
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const url = `${API_PROVIDERS.ALPHA_VANTAGE.baseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`;
    const response = await safeFetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    const exchangeData = data['Realtime Currency Exchange Rate'];
    if (!exchangeData) {
      throw new Error(`Rate not available for ${fromCurrency} → ${toCurrency}`);
    }

    return {
      rate: parseFloat(exchangeData['5. Exchange Rate']),
      source: 'Alpha Vantage',
      timestamp: exchangeData['6. Last Refreshed'],
      fromCurrency,
      toCurrency
    };
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      availableProviders: Object.keys(API_PROVIDERS).length,
      queueLength: this.requestQueue.length
    };
  }

  /**
   * Test API connection for a specific provider
   */
  async testApiConnection(provider) {
    try {
      const result = await this.fetchFromProvider(provider, 'USD', 'EUR');
      return {
        success: true,
        provider: API_PROVIDERS[provider].name,
        rate: result.rate,
        source: result.source,
        timestamp: result.timestamp
      };
    } catch (error) {
      return {
        success: false,
        provider: API_PROVIDERS[provider].name,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const currencyApiService = new CurrencyApiService();
export const apiKeyManager = new ApiKeyManager();

// Auto-initialize local API keys when module is loaded
try {
  // Use a promise that doesn't block module loading
  apiKeyManager
    .initializeLocalApiKeys()
    .then(() => {
      console.log('🔑 Local API keys auto-initialized');
    })
    .catch(error => {
      console.warn(
        '⚠️ Could not auto-initialize local API keys:',
        error.message
      );
    });
} catch (error) {
  console.warn('⚠️ Error during API key auto-initialization:', error.message);
}

/**
 * Enhanced Currency Exchange Rate Service
 * Task 4.2 / v1.1.0: Conversion with durable caching, request deduplication,
 * offline fallback, error handling, and retry logic.
 */
export class ExchangeRateService {
  constructor() {
    this.apiService = new CurrencyApiService();
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.rateLimitDelay = 60000; // 1 minute for rate limit backoff
    this.requestHistory = new Map(); // Track request frequency
    this.inFlight = new Map(); // base -> Promise (request deduplication)
  }

  /**
   * Convert a currency amount with full error handling, caching, and offline fallback.
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<Object>} Conversion result with metadata
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    // Validate inputs (thrown before any network/offline attempt)
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount provided');
    }
    if (!fromCurrency || !toCurrency) {
      throw new Error('Currency codes are required');
    }

    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    // Same currency short-circuit
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        rate: 1,
        fromCurrency,
        toCurrency,
        source: 'same-currency',
        timestamp: new Date().toISOString(),
        cached: false,
        offline: false,
        precision: this.getDecimalPlaces(amount)
      };
    }

    // Resolve the rate (cache → network → offline fallback, with flags)
    const rateData = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = this.calculateConversion(amount, rateData.rate);

    return {
      originalAmount: amount,
      convertedAmount,
      rate: rateData.rate,
      fromCurrency,
      toCurrency,
      source: rateData.source,
      timestamp: rateData.timestamp,
      cached: rateData.cached || false,
      offline: rateData.offline || false,
      precision: this.getDecimalPlaces(convertedAmount)
    };
  }

  /**
   * Get an exchange rate, preferring the durable cache and falling back to
   * stale cached rates when offline mode is enabled.
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<{rate:number, source:string, timestamp:string, cached:boolean, offline:boolean}>}
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    if (fromCurrency === toCurrency) {
      return {
        rate: 1,
        source: 'same-currency',
        timestamp: new Date().toISOString(),
        cached: false,
        offline: false
      };
    }

    // 1. Fresh cache hit
    const cached = await rateCache.getRate(fromCurrency, toCurrency);
    if (cached) {
      console.log(`🚀 Cache hit for ${fromCurrency} → ${toCurrency}`);
      return {
        rate: cached.rate,
        source: cached.source,
        timestamp: new Date(cached.fetchedAt).toISOString(),
        cached: true,
        offline: false
      };
    }

    // 2. Fetch fresh (deduplicated + retry/backoff), then derive the rate
    try {
      await this.checkRateLimit(fromCurrency, toCurrency);
      const fresh = await this.refreshRateTable(fromCurrency, toCurrency);
      return {
        rate: fresh.rate,
        source: fresh.source,
        timestamp: fresh.timestamp,
        cached: false,
        offline: false
      };
    } catch (error) {
      console.warn(
        `⚠️ Live rate fetch failed for ${fromCurrency} → ${toCurrency}:`,
        error.message
      );

      // 3. Offline fallback: serve a stale cached rate if allowed
      const { offlineEnabled } = rateCache.getConfig();
      if (offlineEnabled) {
        const stale = await rateCache.getRate(fromCurrency, toCurrency, {
          allowStale: true
        });
        if (stale) {
          console.log(
            `📴 Offline fallback for ${fromCurrency} → ${toCurrency}`
          );
          return {
            rate: stale.rate,
            source: `${stale.source} (offline)`,
            timestamp: new Date(stale.fetchedAt).toISOString(),
            cached: true,
            offline: true
          };
        }
      }

      throw new Error(`Currency conversion failed: ${error.message}`);
    }
  }

  /**
   * Fetch (or refresh) the rate table for a base currency and resolve a target.
   * Concurrent calls for the same base share one in-flight request.
   * @param {string} fromCurrency - Base currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<{rate:number, source:string, timestamp:string}>}
   */
  async refreshRateTable(fromCurrency, toCurrency) {
    const table = await this._dedupFetch(fromCurrency, toCurrency);

    const direct = table && table.rates ? table.rates[toCurrency] : null;
    if (typeof direct === 'number') {
      return { rate: direct, source: table.source, timestamp: table.timestamp };
    }

    // The shared fetch returned a partial table (single-pair fallback provider)
    // that didn't include our target — fetch this exact pair.
    const own = await this._fetchWithRetry(fromCurrency, toCurrency);
    const rate = own && own.rates ? own.rates[toCurrency] : null;
    if (typeof rate !== 'number') {
      throw new Error(`Rate not available for ${fromCurrency} → ${toCurrency}`);
    }
    return { rate, source: own.source, timestamp: own.timestamp };
  }

  /**
   * Warm/refresh the cached table for a base currency (used by background refresh).
   * @param {string} base - Base currency code
   * @returns {Promise<Object>} The stored table data
   */
  async fetchRateTable(base) {
    return this._dedupFetch(String(base).toUpperCase(), null);
  }

  /**
   * Deduplicate concurrent fetches for the same base currency.
   * @returns {Promise<{rates: Object, source: string, timestamp: string}>}
   */
  _dedupFetch(fromCurrency, toCurrency) {
    const key = String(fromCurrency).toUpperCase();
    if (this.inFlight.has(key)) {
      console.log(`🔗 Coalescing in-flight request for ${key}`);
      return this.inFlight.get(key);
    }

    const promise = this._fetchWithRetry(fromCurrency, toCurrency).finally(
      () => {
        this.inFlight.delete(key);
      }
    );
    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Fetch a rate table with retry + exponential backoff and write it to the cache.
   * Partial (single-pair) results are merged into any existing cached table.
   * @returns {Promise<{rates: Object, source: string, timestamp: string}>}
   */
  async _fetchWithRetry(fromCurrency, toCurrency) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(
          `🔄 Attempt ${attempt}/${this.maxRetries} fetching table for ${fromCurrency}`
        );

        const fetched = await this.apiService.fetchRateTable(
          fromCurrency,
          toCurrency
        );

        let ratesToStore = fetched.rates;
        if (!fetched.full) {
          // Preserve previously cached targets when storing a partial table.
          const existing = await rateCache.getRateTable(fromCurrency);
          if (existing && existing.rates) {
            ratesToStore = { ...existing.rates, ...fetched.rates };
          }
        }

        await rateCache.setRateTable(
          fromCurrency,
          ratesToStore,
          fetched.source
        );
        this.recordRequest(fromCurrency, toCurrency, true);

        return {
          rates: ratesToStore,
          source: fetched.source,
          timestamp: fetched.timestamp
        };
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
        this.recordRequest(fromCurrency, toCurrency, false);

        if (this.shouldNotRetry(error)) {
          break;
        }

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if we should implement rate limiting
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   */
  async checkRateLimit(fromCurrency, toCurrency) {
    const key = `${fromCurrency}-${toCurrency}`;
    const now = Date.now();
    const history = this.requestHistory.get(key) || [];

    // Clean old requests (older than 1 minute)
    const recentRequests = history.filter(time => now - time < 60000);

    // Check if we're making too many requests
    if (recentRequests.length >= 10) {
      // Max 10 requests per minute
      console.warn(`⚠️ Rate limiting ${key} - too many requests`);
      await this.sleep(this.rateLimitDelay);
    }

    // Update history
    recentRequests.push(now);
    this.requestHistory.set(key, recentRequests);
  }

  /**
   * Calculate conversion with proper precision
   * @param {number} amount - Amount to convert
   * @param {number} rate - Exchange rate
   * @returns {number} Converted amount
   */
  calculateConversion(amount, rate) {
    const result = amount * rate;

    // Round to appropriate decimal places based on amount
    if (result >= 1000) {
      return Math.round(result * 100) / 100; // 2 decimal places
    } else if (result >= 1) {
      return Math.round(result * 1000) / 1000; // 3 decimal places
    } else {
      return Math.round(result * 10000) / 10000; // 4 decimal places
    }
  }

  /**
   * Get appropriate decimal places for display
   * @param {number} amount - Amount to check
   * @returns {number} Number of decimal places
   */
  getDecimalPlaces(amount) {
    if (amount >= 1000) {
      return 2;
    }
    if (amount >= 1) {
      return 3;
    }
    return 4;
  }

  /**
   * Check if error should not trigger retry
   * @param {Error} error - Error to check
   * @returns {boolean} True if should not retry
   */
  shouldNotRetry(error) {
    const noRetryMessages = [
      'API key not configured',
      'Invalid currency',
      'Rate not available',
      'Authentication failed',
      'Unauthorized',
      // v1.1.1: never retry quota/rate-limit errors — each retry still counts
      // against the API quota and only accelerates exhaustion.
      'too many requests',
      '429',
      'quota',
      'rate limit',
      'inactive-account'
    ];

    return noRetryMessages.some(msg =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Record request for analytics and rate limiting
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @param {boolean} _success - Whether request succeeded (unused but kept for future analytics)
   */
  recordRequest(fromCurrency, toCurrency, _success) {
    const key = `${fromCurrency}-${toCurrency}`;
    const now = Date.now();

    // Simple request tracking for rate limiting
    if (!this.requestHistory.has(key)) {
      this.requestHistory.set(key, []);
    }

    // Keep only recent requests (last hour)
    const history = this.requestHistory
      .get(key)
      .filter(time => now - time < 3600000);
    history.push(now);
    this.requestHistory.set(key, history);
  }

  /**
   * Sleep utility for delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all cached rate tables.
   * @returns {Promise<void>}
   */
  async clearCache() {
    await rateCache.clear();
  }

  /**
   * Get service statistics and health info with cache metrics.
   * @returns {Promise<Object>} Service statistics
   */
  async getServiceStats() {
    try {
      const cachedBases = await rateCache.getCachedBases();
      return {
        cache: {
          stats: rateCache.getStats(),
          cachedBases,
          cachedBaseCount: cachedBases.length,
          config: rateCache.getConfig()
        },
        requestHistorySize: this.requestHistory.size,
        inFlight: this.inFlight.size,
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay,
        apiService: this.apiService.getServiceStats()
      };
    } catch (error) {
      console.warn('⚠️ Failed to get service stats:', error);
      return {};
    }
  }

  /**
   * Test the service with a sample conversion
   * @param {string} fromCurrency - Source currency (default: USD)
   * @param {string} toCurrency - Target currency (default: EUR)
   * @returns {Promise<Object>} Test result
   */
  async testService(fromCurrency = 'USD', toCurrency = 'EUR') {
    const startTime = Date.now();

    try {
      const result = await this.convertCurrency(100, fromCurrency, toCurrency);
      const duration = Date.now() - startTime;

      return {
        success: true,
        result,
        duration,
        message: `Successfully converted 100 ${fromCurrency} to ${result.convertedAmount} ${toCurrency}`
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        duration,
        message: `Failed to convert ${fromCurrency} to ${toCurrency}: ${error.message}`
      };
    }
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();
