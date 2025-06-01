/**
 * Default API Configuration
 * Pre-configured settings for the currency extension
 */

import { apiKeyManager } from './api-service.js';
import { LOCAL_API_KEYS } from './api-keys.local.js';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  // Primary API provider (user's registered account)
  PRIMARY_PROVIDER: 'EXCHANGERATE_API',

  // Default API keys are loaded from environment or user setup
  // Never commit actual API keys to the repository
  DEFAULT_API_KEYS: {
    // This will be set during runtime from secure sources
    EXCHANGERATE_API: null
  }
};

/**
 * Initialize default API configuration
 * Sets up the primary API key if none exists
 */
export async function initializeDefaultConfig() {
  try {
    // Check if ExchangeRate-API key is already configured
    const existingKey = await apiKeyManager.getApiKey('EXCHANGERATE_API');

    if (!existingKey) {
      // Try to load API keys from local file (not committed to git)
      try {
        if (
          LOCAL_API_KEYS.EXCHANGERATE_API &&
          LOCAL_API_KEYS.EXCHANGERATE_API !== 'your-actual-api-key-here'
        ) {
          await apiKeyManager.storeApiKey(
            'EXCHANGERATE_API',
            LOCAL_API_KEYS.EXCHANGERATE_API
          );
          console.log(
            '✅ Default ExchangeRate-API key configured from local file'
          );
          return true;
        }
      } catch {
        console.log(
          'ℹ️ No local API keys file found - user will need to configure manually'
        );
      }

      // If no local keys available, user will need to configure manually
      console.log(
        '⚠️ No API key configured - please set up your ExchangeRate-API key in settings'
      );
      return false;
    }

    console.log('✅ ExchangeRate-API key already configured');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize default config:', error);
    return false;
  }
}

/**
 * Setup instructions for users
 */
export const SETUP_INSTRUCTIONS = {
  EXCHANGERATE_API: {
    title: 'ExchangeRate-API (Primary Provider)',
    description:
      'Pre-configured with developer account. High rate limits and reliable service.',
    steps: [
      'No setup required - already configured!',
      'Optional: Replace with your own API key if you have one',
      'Get your own key at: https://app.exchangerate-api.com/sign-up'
    ],
    isDefault: true
  },
  FIXER_IO: {
    title: 'Fixer.io (Backup Provider)',
    description: 'Optional backup service with 1,000 free requests/month.',
    steps: [
      'Visit https://fixer.io and create a free account',
      'Copy your API key from the dashboard',
      'Enter the key in the API configuration below'
    ]
  },
  CURRENCY_API: {
    title: 'CurrencyAPI (Additional Backup)',
    description: 'Another backup option with 300 free requests/month.',
    steps: [
      'Visit https://currencyapi.com and sign up',
      'Get your API key from the dashboard',
      'Add the key below for additional redundancy'
    ]
  },
  ALPHA_VANTAGE: {
    title: 'Alpha Vantage (Last Resort)',
    description: 'Financial data provider with very limited free tier.',
    steps: [
      'Visit https://www.alphavantage.co and get a free API key',
      'Note: Only 5 requests per minute on free tier',
      'Best used as emergency backup only'
    ]
  }
};
