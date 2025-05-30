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
  VND: { name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' }
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
