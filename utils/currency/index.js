/**
 * Currency Module - Consolidated Exports
 *
 * This barrel file provides organized exports for all currency-related functionality.
 *
 * DATA:
 * - CURRENCY_LIST: Array of currency objects with full details
 * - CURRENCIES: Object for O(1) currency lookup by code
 * - CURRENCY_REGIONS: Currencies grouped by region
 * - CRYPTOCURRENCIES: Cryptocurrency definitions
 * - ALL_CURRENCIES: Combined fiat and crypto currencies
 *
 * UTILITIES:
 * - CurrencyPreferences: User preferences class
 * - SmartCurrencyDetector: ML-like currency detection
 * - Formatting functions: Format amounts, rates, timestamps
 *
 * SETTINGS:
 * - DEFAULT_SETTINGS: Extension default settings
 * - FEATURES: Feature flags for free/premium tiers
 */

// ============================================
// CURRENCY DATA EXPORTS
// ============================================

export {
  // Data constants
  CURRENCY_LIST,
  CURRENCY_REGIONS,
  CURRENCIES,
  CRYPTOCURRENCIES,
  ALL_CURRENCIES,
  POPULAR_CURRENCY_CODES,
  DEFAULT_SETTINGS,
  FEATURES,
  // Data functions
  getPopularCurrencies,
  getAllCurrencies,
  getCurrencyByCode,
  searchCurrencies,
  advancedSearchCurrencies,
  getCurrenciesByRegion,
  getCurrencyStats,
  formatCurrencyOption,
  // Validation functions
  validateCurrencyCode,
  validateCurrencySelection,
  isValidCurrencyCode,
  getCurrencyDisplayName,
  // Preferences class
  CurrencyPreferences
} from '../currency-data.js';

// ============================================
// CURRENCY DETECTION EXPORTS
// ============================================

export {
  SmartCurrencyDetector,
  smartCurrencyDetector
} from '../smart-currency-detector.js';

// ============================================
// CONVERSION UTILITIES EXPORTS
// ============================================

export {
  formatConvertedAmount,
  formatExchangeRate,
  calculatePreciseConversion,
  formatConversionTimestamp,
  getDecimalPlaces,
  calculatePercentageChange,
  validateConversionInput,
  createConversionSummary,
  ConversionUtils
} from '../conversion-utils.js';

// ============================================
// CONVENIENCE ALIASES
// ============================================

// Alias formatConvertedAmount as formatCurrency for convenience
export { formatConvertedAmount as formatCurrency } from '../conversion-utils.js';
