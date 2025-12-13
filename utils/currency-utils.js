/**
 * Currency Utils - Legacy Re-export File
 *
 * @deprecated This file is deprecated. Import from currency-data.js instead.
 *
 * MIGRATION GUIDE:
 * - CURRENCIES, CRYPTOCURRENCIES, ALL_CURRENCIES → import from '/utils/currency-data.js'
 * - formatCurrency → import from '/utils/conversion-utils.js' (formatConvertedAmount)
 * - For parsing, use SmartCurrencyDetector from '/utils/smart-currency-detector.js'
 */

// Re-export currency data for backwards compatibility
export {
  CURRENCIES,
  CRYPTOCURRENCIES,
  ALL_CURRENCIES,
  POPULAR_CURRENCY_CODES,
  isValidCurrencyCode
} from './currency-data.js';

// Re-export formatting utilities from conversion-utils
export { formatConvertedAmount as formatCurrency } from './conversion-utils.js';

/**
 * Storage utilities
 * @deprecated Use chrome.storage directly or settingsManager
 */
export const storage = {
  async get(keys) {
    return new Promise(resolve => {
      chrome.storage.sync.get(keys, resolve);
    });
  },

  async set(data) {
    return new Promise(resolve => {
      chrome.storage.sync.set(data, resolve);
    });
  },

  async remove(keys) {
    return new Promise(resolve => {
      chrome.storage.sync.remove(keys, resolve);
    });
  }
};

/**
 * Logger utility
 * @deprecated Use console directly with appropriate guards
 */
export const logger = {
  log: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Currency Converter] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(`[Currency Converter] ERROR: ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[Currency Converter] WARNING: ${message}`, ...args);
  }
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Convert currency symbol to currency code
 * @deprecated Use SmartCurrencyDetector.symbolToCurrencyCode instead
 * @param {string} symbol - Currency symbol
 * @returns {string} Currency code
 */
export function symbolToCurrencyCode(symbol) {
  const symbolMap = {
    $: 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    '₽': 'RUB',
    '¢': 'USD',
    '₩': 'KRW',
    '₦': 'NGN',
    '₪': 'ILS',
    '₨': 'PKR',
    '₫': 'VND',
    '₱': 'PHP',
    '₡': 'CRC',
    '₲': 'PYG',
    '₴': 'UAH',
    '₵': 'GHS',
    '₸': 'KZT',
    '₺': 'TRY',
    '₾': 'GEL',
    '₿': 'BTC'
  };
  return symbolMap[symbol] || 'USD';
}

/**
 * Get currency display name
 * @deprecated Use getCurrencyDisplayName from currency-data.js instead
 * @param {string} code - Currency code
 * @returns {string} Display name
 */
export { getCurrencyDisplayName } from './currency-data.js';
