/**
 * Secure API Key Manager
 * Phase 9, Task 9.1: Secure API key storage and management
 * Provides secure storage and validation for API keys
 */

/* global fetch */

import { securityManager } from './security-manager.js';

export class SecureApiKeyManager {
  constructor() {
    this.STORAGE_PREFIX = 'secure_api_';
    this.KEY_VALIDATION = {
      EXCHANGERATE_API: {
        pattern: /^[a-f0-9]{24}$/,
        length: 24,
        description: 'ExchangeRate-API key (24 hex characters)'
      },
      FIXER_IO: {
        pattern: /^[a-f0-9]{32}$/,
        length: 32,
        description: 'Fixer.io key (32 hex characters)'
      },
      CURRENCYLAYER: {
        pattern: /^[a-f0-9]{32}$/,
        length: 32,
        description: 'CurrencyLayer key (32 hex characters)'
      },
      OPENEXCHANGERATES: {
        pattern: /^[a-f0-9]{32}$/,
        length: 32,
        description: 'Open Exchange Rates key (32 hex characters)'
      }
    };
    this.initialized = false;
  }

  /**
   * Initialize the secure API key manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('🔐 Initializing SecureApiKeyManager...');

      // Ensure security manager is initialized first
      if (!securityManager.initialized) {
        throw new Error('Security manager must be initialized first');
      }

      // Initialize any encryption keys or secure storage if needed
      // This is where we could set up additional security measures

      this.initialized = true;
      console.log('✅ SecureApiKeyManager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SecureApiKeyManager:', error);
      throw error;
    }
  }

  /**
   * Check if the manager is initialized
   * @private
   * @throws {Error} If not initialized
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('SecureApiKeyManager must be initialized before use');
    }
  }

  /**
   * Validate API key format
   * @param {string} provider - API provider name
   * @param {string} apiKey - API key to validate
   * @returns {Object} Validation result
   */
  validateApiKey(provider, apiKey) {
    const validation = securityManager.validateInput(apiKey, {
      type: 'api_key',
      required: true,
      maxLength: 100
    });

    if (!validation.isValid) {
      return validation;
    }

    const providerConfig = this.KEY_VALIDATION[provider.toUpperCase()];
    if (!providerConfig) {
      validation.isValid = false;
      validation.errors.push('Unknown API provider');
      return validation;
    }

    if (!providerConfig.pattern.test(apiKey)) {
      validation.isValid = false;
      validation.errors.push(
        `Invalid ${provider} API key format. Expected: ${providerConfig.description}`
      );
    }

    return validation;
  }

  /**
   * Securely store API key
   * @param {string} provider - API provider name
   * @param {string} apiKey - API key to store
   * @returns {Promise<boolean>} Success status
   */
  async storeApiKey(provider, apiKey) {
    try {
      this._ensureInitialized();

      // Validate the API key first
      const validation = this.validateApiKey(provider, apiKey);
      if (!validation.isValid) {
        console.warn('API key validation failed:', validation.errors);
        return false;
      }

      // Check rate limiting
      const rateLimit = securityManager.checkRateLimit('SETTINGS_UPDATES');
      if (!rateLimit.allowed) {
        console.warn('Rate limit exceeded for API key storage');
        return false;
      }

      const storageKey = `${this.STORAGE_PREFIX}${provider.toLowerCase()}`;
      const success = await securityManager.secureStore(
        storageKey,
        validation.sanitized,
        true // sensitive data
      );

      if (success) {
        securityManager.logSecurityEvent('api_key_stored', {
          provider,
          keyLength: apiKey.length
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to store API key:', error);
      securityManager.logSecurityEvent('api_key_store_failed', {
        provider,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Securely retrieve API key
   * @param {string} provider - API provider name
   * @returns {Promise<string|null>} API key or null if not found
   */
  async getApiKey(provider) {
    try {
      this._ensureInitialized();

      const storageKey = `${this.STORAGE_PREFIX}${provider.toLowerCase()}`;
      const apiKey = await securityManager.secureRetrieve(storageKey, true);

      if (apiKey) {
        // Re-validate stored key
        const validation = this.validateApiKey(provider, apiKey);
        if (!validation.isValid) {
          console.warn('Stored API key is invalid, removing it');
          await this.removeApiKey(provider);
          return null;
        }
      }

      return apiKey;
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  /**
   * Remove API key
   * @param {string} provider - API provider name
   * @returns {Promise<boolean>} Success status
   */
  async removeApiKey(provider) {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${provider.toLowerCase()}`;
      await chrome.storage.local.remove(storageKey);

      securityManager.logSecurityEvent('api_key_removed', { provider });
      return true;
    } catch (error) {
      console.error('Failed to remove API key:', error);
      return false;
    }
  }

  /**
   * Get all available API providers with their status
   * @returns {Promise<Object>} Provider status information
   */
  async getProviderStatus() {
    const providers = {};

    for (const provider of Object.keys(this.KEY_VALIDATION)) {
      const apiKey = await this.getApiKey(provider);
      providers[provider] = {
        hasKey: !!apiKey,
        keyLength: apiKey ? apiKey.length : 0,
        description: this.KEY_VALIDATION[provider].description
      };
    }

    return providers;
  }

  /**
   * Test API key by making a simple request
   * @param {string} provider - API provider name
   * @param {string} apiKey - API key to test
   * @returns {Promise<Object>} Test result
   */
  async testApiKey(provider, apiKey) {
    const result = {
      isValid: false,
      error: null,
      response: null
    };

    try {
      // Validate format first
      const validation = this.validateApiKey(provider, apiKey);
      if (!validation.isValid) {
        result.error = validation.errors.join(', ');
        return result;
      }

      // Check rate limiting
      const rateLimit = securityManager.checkRateLimit('API_CALLS');
      if (!rateLimit.allowed) {
        result.error = 'Rate limit exceeded. Please try again later.';
        return result;
      }

      // Test API endpoints based on provider
      const testEndpoints = {
        EXCHANGERATE_API: `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
        FIXER_IO: `https://data.fixer.io/api/latest?access_key=${apiKey}&base=USD&symbols=EUR`,
        CURRENCYLAYER: `https://api.currencylayer.com/live?access_key=${apiKey}&currencies=EUR&source=USD`,
        OPENEXCHANGERATES: `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=USD&symbols=EUR`
      };

      const endpoint = testEndpoints[provider.toUpperCase()];
      if (!endpoint) {
        result.error = 'Unknown provider';
        return result;
      }

      // Validate URL before making request
      if (!securityManager.validateApiUrl(endpoint)) {
        result.error = 'Invalid API URL';
        return result;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Currency-Converter-Extension/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        result.isValid = true;
        result.response = data;

        securityManager.logSecurityEvent('api_key_test_success', {
          provider,
          status: response.status
        });
      } else {
        result.error = `API request failed: ${response.status} ${response.statusText}`;
        securityManager.logSecurityEvent('api_key_test_failed', {
          provider,
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      result.error = `Network error: ${error.message}`;
      securityManager.logSecurityEvent('api_key_test_error', {
        provider,
        error: error.message
      });
    }

    return result;
  }

  /**
   * Rotate API key (remove old, store new)
   * @param {string} provider - API provider name
   * @param {string} newApiKey - New API key
   * @returns {Promise<boolean>} Success status
   */
  async rotateApiKey(provider, newApiKey) {
    try {
      // Test new key first
      const testResult = await this.testApiKey(provider, newApiKey);
      if (!testResult.isValid) {
        console.warn('New API key test failed:', testResult.error);
        return false;
      }

      // Remove old key and store new one
      await this.removeApiKey(provider);
      const success = await this.storeApiKey(provider, newApiKey);

      if (success) {
        securityManager.logSecurityEvent('api_key_rotated', { provider });
      }

      return success;
    } catch (error) {
      console.error('API key rotation failed:', error);
      return false;
    }
  }

  /**
   * Get masked API key for display purposes
   * @param {string} provider - API provider name
   * @returns {Promise<string>} Masked API key
   */
  async getMaskedApiKey(provider) {
    try {
      const apiKey = await this.getApiKey(provider);
      if (!apiKey) return null;

      if (apiKey.length <= 8) {
        return '*'.repeat(apiKey.length);
      }

      const start = apiKey.substring(0, 4);
      const end = apiKey.substring(apiKey.length - 4);
      const middle = '*'.repeat(apiKey.length - 8);

      return `${start}${middle}${end}`;
    } catch (error) {
      console.error('Failed to get masked API key:', error);
      return null;
    }
  }

  /**
   * Clear all API keys (for logout/reset)
   * @returns {Promise<boolean>} Success status
   */
  async clearAllApiKeys() {
    try {
      const providers = Object.keys(this.KEY_VALIDATION);
      const promises = providers.map(provider => this.removeApiKey(provider));

      await Promise.all(promises);

      securityManager.logSecurityEvent('all_api_keys_cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear all API keys:', error);
      return false;
    }
  }
}

// Create singleton instance
export const secureApiKeyManager = new SecureApiKeyManager();
