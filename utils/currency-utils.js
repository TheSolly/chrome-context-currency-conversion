// Utility functions for Currency Converter Extension

/**
 * Currency data and helper functions
 */

// Comprehensive list of supported currencies
export const CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  CNY: { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  SEK: { name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  MXN: { name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  TRY: { name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  ZAR: { name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  BRL: { name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  KRW: { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  RUB: { name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  PLN: { name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  CZK: { name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  HUF: { name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
  ILS: { name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
  THB: { name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  PHP: { name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  IDR: { name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  VND: { name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  // Additional currencies for enhanced support
  DKK: { name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  BGN: { name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬' },
  RON: { name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴' },
  HRK: { name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷' },
  UAH: { name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦' },
  EGP: { name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬' },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  SAR: { name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  QAR: { name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦' },
  KWD: { name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
  BHD: { name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭' },
  OMR: { name: 'Omani Rial', symbol: '﷼', flag: '🇴🇲' },
  JOD: { name: 'Jordanian Dinar', symbol: 'د.ا', flag: '🇯🇴' },
  LBP: { name: 'Lebanese Pound', symbol: 'ل.ل', flag: '🇱🇧' }
};

// Cryptocurrency definitions for Smart Currency Detection - Phase 6, Task 6.1
export const CRYPTOCURRENCIES = {
  BTC: { name: 'Bitcoin', symbol: '₿', flag: '🟠', decimals: 8 },
  ETH: { name: 'Ethereum', symbol: 'Ξ', flag: '🔷', decimals: 18 },
  LTC: { name: 'Litecoin', symbol: 'Ł', flag: '⚪', decimals: 8 },
  ADA: { name: 'Cardano', symbol: 'ADA', flag: '🔵', decimals: 6 },
  DOT: { name: 'Polkadot', symbol: 'DOT', flag: '🟣', decimals: 10 },
  XRP: { name: 'Ripple', symbol: 'XRP', flag: '🔵', decimals: 6 },
  SOL: { name: 'Solana', symbol: 'SOL', flag: '🟣', decimals: 9 },
  MATIC: { name: 'Polygon', symbol: 'MATIC', flag: '🟣', decimals: 18 }
};

// Combined currencies including cryptocurrencies
export const ALL_CURRENCIES = { ...CURRENCIES, ...CRYPTOCURRENCIES };

// Popular currencies (for quick access)
export const POPULAR_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY'
];

/**
 * Format currency amount with proper symbols and locale
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - ISO currency code
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback formatting
    const currency = CURRENCIES[currencyCode];
    const symbol = currency ? currency.symbol : currencyCode;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Parse currency amount from text
 * @param {string} text - Text containing currency amount
 * @returns {object|null} Parsed currency info or null
 */
export function parseCurrencyFromText(text) {
  // Remove extra whitespace
  text = text.trim();

  // Currency patterns (more comprehensive)
  const patterns = [
    // Symbol first: $100, €50, £75
    /^([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)$/,

    // Amount first: 100$, 50€, 75£
    /^(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)\s*([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])$/,

    // Code after: 100 USD, 50 EUR
    /^(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)\s+([A-Z]{3})$/,

    // Code before: USD 100, EUR 50
    /^([A-Z]{3})\s+(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)$/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let amount, currency;

      if (pattern.source.startsWith('^([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])')) {
        // Symbol first
        currency = symbolToCurrencyCode(match[1]);
        amount = parseFloat(match[2].replace(/,/g, ''));
      } else if (pattern.source.includes('([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])$')) {
        // Amount first
        amount = parseFloat(match[1].replace(/,/g, ''));
        currency = symbolToCurrencyCode(match[2]);
      } else if (pattern.source.includes('([A-Z]{3})$')) {
        // Code after
        amount = parseFloat(match[1].replace(/,/g, ''));
        currency = match[2];
      } else {
        // Code before
        currency = match[1];
        amount = parseFloat(match[2].replace(/,/g, ''));
      }

      if (currency && !isNaN(amount) && amount > 0) {
        return {
          amount: amount,
          currency: currency,
          originalText: text
        };
      }
    }
  }

  return null;
}

/**
 * Convert currency symbol to currency code
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
 * Validate currency code
 * @param {string} code - Currency code to validate
 * @returns {boolean} True if valid
 */
export function isValidCurrencyCode(code) {
  return CURRENCIES.hasOwnProperty(code.toUpperCase());
}

/**
 * Get currency display name
 * @param {string} code - Currency code
 * @returns {string} Display name
 */
export function getCurrencyDisplayName(code) {
  const currency = CURRENCIES[code.toUpperCase()];
  return currency ? `${code} - ${currency.name}` : code;
}

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
 * Storage utilities
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
 * Currency pattern testing utilities for Task 2.1
 */
export const TEST_CASES = {
  // Symbol format tests
  symbols: [
    '$430',
    '430$',
    '€500',
    '500€',
    '£75',
    '¥1000',
    'A$50',
    'C$75',
    'HK$100',
    'S$200',
    'NZ$150',
    '₹2000',
    '₽500',
    '₩50000',
    '฿1500',
    'R$300',
    'R150',
    'RM250',
    'zł100',
    'Kč500',
    'Ft1000',
    '$1,234.56',
    '€1.234,56',
    '£12,345.67'
  ],

  // Code format tests
  codes: [
    '430 USD',
    '500 EUR',
    '75 GBP',
    '1000 JPY',
    '50 AUD',
    '75 CAD',
    '100 CHF',
    '200 CNY',
    '1,234.56 USD',
    '1.234,56 EUR',
    '12,345 JPY'
  ],

  // Code first format tests
  codesFirst: [
    'USD 430',
    'EUR 500',
    'GBP 75',
    'JPY 1000',
    'AUD 50',
    'CAD 75',
    'CHF 100',
    'CNY 200'
  ],

  // Word format tests
  words: [
    '100 dollars',
    '50 euros',
    '75 pounds',
    '1000 yen',
    '200 yuan',
    '500 pesos',
    '2000 rupees',
    '50000 won',
    '500 rubles',
    '100 francs',
    '250 krona',
    '150 zloty'
  ],

  // Word first format tests
  wordsFirst: [
    'dollars 100',
    'euros 50',
    'pounds 75',
    'yen 1000',
    'yuan 200',
    'pesos 500',
    'rupees 2000',
    'won 50000'
  ],

  // Edge cases
  edgeCases: [
    '$0.99',
    '€1.000.000',
    '¥100,000',
    'USD 0.01',
    '1,23 EUR',
    '1.23 USD',
    '1 234,56 EUR',
    '$1 000 000'
  ],

  // Invalid cases (should not match)
  invalid: [
    'abc123',
    '123abc',
    'USD',
    '$',
    '€',
    '123.456.789',
    'dollar',
    'euro'
  ]
};

/**
 * Test currency detection patterns
 */
export function testCurrencyDetection(detectFunction) {
  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Test all categories
  Object.keys(TEST_CASES).forEach(category => {
    if (category === 'invalid') {
      // Invalid cases should return null
      TEST_CASES[category].forEach(testCase => {
        const result = detectFunction(testCase);
        if (result === null) {
          results.passed++;
          results.details.push({
            testCase,
            category,
            status: 'PASS',
            result: null
          });
        } else {
          results.failed++;
          results.details.push({
            testCase,
            category,
            status: 'FAIL',
            result,
            expected: null
          });
        }
      });
    } else {
      // Valid cases should return currency info
      TEST_CASES[category].forEach(testCase => {
        const result = detectFunction(testCase);
        if (result && result.amount && result.currency) {
          results.passed++;
          results.details.push({ testCase, category, status: 'PASS', result });
        } else {
          results.failed++;
          results.details.push({
            testCase,
            category,
            status: 'FAIL',
            result,
            expected: 'currency object'
          });
        }
      });
    }
  });

  return results;
}

/**
 * Parse multiple currencies from text - Phase 6, Task 6.1: Smart Currency Detection
 * Enhanced to handle complex formats and multiple currencies in single selection
 * @param {string} text - Text containing currency amounts
 * @returns {Array} Array of parsed currency objects
 */
export function parseMultipleCurrenciesFromText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Use smart currency detector for enhanced detection
  if (typeof window !== 'undefined' && window.smartCurrencyDetector) {
    return window.smartCurrencyDetector.detectCurrencies(text);
  }

  // Fallback to basic detection if smart detector not available
  const currencies = [];
  const basicResult = parseCurrencyFromText(text);

  if (basicResult) {
    currencies.push({
      ...basicResult,
      confidence: 0.8,
      type: 'basic',
      range: { start: 0, end: text.length }
    });
  }

  return currencies;
}

/**
 * Enhanced currency parsing with support for complex number formats
 * Phase 6, Task 6.1: Handle formats like 1,234.56, 1.234,56
 * @param {string} text - Text containing currency amount
 * @returns {object|null} Parsed currency info or null
 */
export function parseEnhancedCurrencyFromText(text) {
  // Remove extra whitespace
  text = text.trim();

  // Enhanced currency patterns supporting complex formats
  const enhancedPatterns = [
    // European format with symbol: €1.234,56
    /^([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])\s*(\d{1,3}(?:\.\d{3})*,\d{1,4})$/,

    // US format with symbol: $1,234.56
    /^([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])\s*(\d{1,3}(?:,\d{3})*\.\d{1,4})$/,

    // European format amount first: 1.234,56€
    /^(\d{1,3}(?:\.\d{3})*,\d{1,4})\s*([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])$/,

    // US format amount first: 1,234.56$
    /^(\d{1,3}(?:,\d{3})*\.\d{1,4})\s*([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])$/,

    // Swiss format with apostrophe: CHF 1'234.56
    /^([A-Z]{3})\s+(\d{1,3}(?:'\d{3})*(?:\.\d{1,4})?)$/,

    // Indian numbering system: ₹1,23,456.78
    /^([₹$])\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*(?:\.\d{1,4})?)$/,

    // Scientific notation: $1.23e6
    /^([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])\s*(\d+(?:\.\d+)?[eE][+-]?\d+)$/,

    // Cryptocurrency patterns: 1.5 BTC, ₿0.005
    /^(\d+(?:\.\d+)?)\s+(BTC|ETH|LTC|ADA|DOT|XRP|SOL|MATIC)$/i,
    /^([₿Ξ])\s*(\d+(?:\.\d+)?)$/,

    // Original patterns for backward compatibility
    /^([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)$/,
    /^(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)\s*([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])$/,
    /^(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)\s+([A-Z]{3})$/,
    /^([A-Z]{3})\s+(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)$/
  ];

  for (const pattern of enhancedPatterns) {
    const match = text.match(pattern);
    if (match) {
      const result = parseEnhancedMatch(match, pattern, text);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Parse enhanced match with smart number parsing
 */
function parseEnhancedMatch(match, pattern, originalText) {
  let amount, currency;
  const patternStr = pattern.source;

  // Determine pattern type and extract data
  if (patternStr.includes('(?:.d{3})*,d{1,4}')) {
    // European format: 1.234,56
    if (patternStr.startsWith('^([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])')) {
      currency = enhancedSymbolToCurrencyCode(match[1]);
      amount = parseFloat(match[2].replace(/\./g, '').replace(',', '.'));
    } else {
      amount = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      currency = enhancedSymbolToCurrencyCode(match[2]);
    }
  } else if (patternStr.includes('(?:,d{3})*.d{1,4}')) {
    // US format: 1,234.56
    if (patternStr.startsWith('^([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])')) {
      currency = enhancedSymbolToCurrencyCode(match[1]);
      amount = parseFloat(match[2].replace(/,/g, ''));
    } else {
      amount = parseFloat(match[1].replace(/,/g, ''));
      currency = enhancedSymbolToCurrencyCode(match[2]);
    }
  } else if (patternStr.includes("(?:'d{3})*")) {
    // Swiss format: 1'234.56
    currency = match[1];
    amount = parseFloat(match[2].replace(/'/g, ''));
  } else if (patternStr.includes('(?:,d{2})*(?:,d{3})*')) {
    // Indian format: 1,23,456.78
    currency = enhancedSymbolToCurrencyCode(match[1]);
    amount = parseFloat(match[2].replace(/,/g, ''));
  } else if (patternStr.includes('[eE][+-]?d+')) {
    // Scientific notation
    currency = enhancedSymbolToCurrencyCode(match[1]);
    amount = parseFloat(match[2]);
  } else if (patternStr.includes('(BTC|ETH|LTC|ADA|DOT|XRP|SOL|MATIC)')) {
    // Cryptocurrency with code
    amount = parseFloat(match[1]);
    currency = match[2].toUpperCase();
  } else if (patternStr.includes('[₿Ξ]')) {
    // Cryptocurrency with symbol
    currency = enhancedSymbolToCurrencyCode(match[1]);
    amount = parseFloat(match[2]);
  } else {
    // Standard patterns
    if (patternStr.includes('([A-Z]{3})$')) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      currency = match[2];
    } else if (patternStr.startsWith('^([A-Z]{3})')) {
      currency = match[1];
      amount = parseFloat(match[2].replace(/,/g, ''));
    } else if (patternStr.startsWith('^([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿$])')) {
      currency = enhancedSymbolToCurrencyCode(match[1]);
      amount = parseFloat(match[2].replace(/,/g, ''));
    } else {
      amount = parseFloat(match[1].replace(/,/g, ''));
      currency = enhancedSymbolToCurrencyCode(match[2]);
    }
  }

  if (currency && !isNaN(amount) && amount > 0) {
    return {
      amount: amount,
      currency: currency,
      originalText: originalText,
      confidence: 0.9,
      type: 'enhanced'
    };
  }

  return null;
}

/**
 * Enhanced symbol to currency code mapping including cryptocurrencies
 */
function enhancedSymbolToCurrencyCode(symbol) {
  const enhancedSymbolMap = {
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
    // Cryptocurrency symbols
    '₿': 'BTC',
    Ξ: 'ETH',
    Ł: 'LTC'
  };

  return enhancedSymbolMap[symbol] || 'USD';
}
