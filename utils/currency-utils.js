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
