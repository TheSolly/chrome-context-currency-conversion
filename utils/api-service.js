/**
 * Currency API Service
 * Handles currency conversion with multiple API providers and fallback mechanisms
 */

/**
 * Fetch wrapper for Chrome extension environment
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function safeFetch(url, options = {}) {
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
      registered: { requests: 100000, period: 'month' },
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
}

/**
 * Currency Exchange Rate Service
 * Manages API calls with fallback mechanisms and caching
 */
export class CurrencyApiService {
  constructor() {
    this.apiKeyManager = new ApiKeyManager();
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
    this.requestQueue = [];
    this.isProcessing = false;
  }

  /**
   * Get exchange rate between two currencies
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<Object>} Exchange rate data
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    const cacheKey = `${fromCurrency}-${toCurrency}`;

    // Check cache first
    const cachedRate = this.getCachedRate(cacheKey);
    if (cachedRate) {
      console.log(`📦 Using cached rate for ${fromCurrency} → ${toCurrency}`);
      return cachedRate;
    }

    // Try each API provider in priority order
    const providers = Object.keys(API_PROVIDERS).sort(
      (a, b) => API_PROVIDERS[a].priority - API_PROVIDERS[b].priority
    );

    for (const provider of providers) {
      try {
        console.log(
          `🔄 Trying ${API_PROVIDERS[provider].name} for ${fromCurrency} → ${toCurrency}`
        );
        const rate = await this.fetchFromProvider(
          provider,
          fromCurrency,
          toCurrency
        );

        if (rate) {
          // Cache successful result
          this.cacheRate(cacheKey, rate);
          return rate;
        }
      } catch (error) {
        console.warn(
          `⚠️ ${API_PROVIDERS[provider].name} failed:`,
          error.message
        );
        continue; // Try next provider
      }
    }

    throw new Error(
      'All API providers failed. Please check your internet connection and API keys.'
    );
  }

  /**
   * Fetch exchange rate from specific provider
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
   * Fetch from ExchangeRate-API (with API key)
   */
  async fetchFromExchangeRateApi(fromCurrency, toCurrency) {
    const apiKey = await this.apiKeyManager.getApiKey('EXCHANGERATE_API');
    if (!apiKey) {
      throw new Error('ExchangeRate-API key not configured');
    }

    const url = `${API_PROVIDERS.EXCHANGERATE_API.baseUrl}/${apiKey}/latest/${fromCurrency}`;
    const response = await safeFetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.result === 'error') {
      throw new Error(`API Error: ${data['error-type']}`);
    }

    if (!data.conversion_rates || !data.conversion_rates[toCurrency]) {
      throw new Error(`Rate not available for ${fromCurrency} → ${toCurrency}`);
    }

    return {
      rate: data.conversion_rates[toCurrency],
      source: 'ExchangeRate-API',
      timestamp: new Date().toISOString(),
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
   */ async fetchFromAlphaVantage(fromCurrency, toCurrency) {
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
   * Cache exchange rate data
   */
  cacheRate(cacheKey, rateData) {
    this.cache.set(cacheKey, {
      ...rateData,
      cachedAt: Date.now()
    });
  }

  /**
   * Get cached exchange rate if still valid
   */ getCachedRate(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.cachedAt > this.cacheExpiry;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * Clear all cached rates
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Exchange rate cache cleared');
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      cacheSize: this.cache.size,
      cacheExpiry: this.cacheExpiry,
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
