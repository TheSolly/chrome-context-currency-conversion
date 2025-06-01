/**
 * Currency Conversion Utilities
 * Task 4.3: Conversion Logic - Formatting and calculation functions
 */

/**
 * Format converted amount with appropriate precision and currency symbol
 * @param {number} amount - Converted amount
 * @param {string} currencyCode - Target currency code
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted amount string
 */
export function formatConvertedAmount(amount, currencyCode, locale = 'en-US') {
  try {
    // Use Intl.NumberFormat for proper localization
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: amount >= 1 ? 2 : 4,
      maximumFractionDigits: amount >= 1000 ? 2 : amount >= 1 ? 3 : 4
    }).format(amount);
  } catch (error) {
    console.warn(
      `⚠️ Currency formatting failed for ${currencyCode}:`,
      error.message
    );

    // Fallback formatting if currency not supported
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF',
      CNY: '¥',
      INR: '₹',
      RUB: '₽',
      KRW: '₩',
      BRL: 'R$',
      MXN: '$',
      ZAR: 'R',
      SEK: 'kr',
      NOK: 'kr',
      DKK: 'kr',
      PLN: 'zł',
      CZK: 'Kč',
      HUF: 'Ft',
      THB: '฿',
      MYR: 'RM',
      SGD: 'S$',
      HKD: 'HK$',
      NZD: 'NZ$',
      ILS: '₪',
      TRY: '₺',
      EGP: '£'
    };

    const symbol = symbols[currencyCode] || currencyCode;
    const decimals = amount >= 1000 ? 2 : amount >= 1 ? 3 : 4;
    return `${symbol}${amount.toFixed(decimals)}`;
  }
}

/**
 * Format exchange rate for display with appropriate precision
 * @param {number} rate - Exchange rate
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {string} Formatted rate string
 */
export function formatExchangeRate(rate, fromCurrency = '', toCurrency = '') {
  let formatted;

  if (rate >= 1000) {
    formatted = rate.toFixed(0);
  } else if (rate >= 100) {
    formatted = rate.toFixed(2);
  } else if (rate >= 1) {
    formatted = rate.toFixed(4);
  } else {
    formatted = rate.toFixed(6);
  }

  // Add currency context if provided
  if (fromCurrency && toCurrency) {
    return `1 ${fromCurrency} = ${formatted} ${toCurrency}`;
  }

  return formatted;
}

/**
 * Calculate conversion with proper precision handling
 * @param {number} amount - Original amount
 * @param {number} rate - Exchange rate
 * @returns {number} Converted amount with appropriate precision
 */
export function calculatePreciseConversion(amount, rate) {
  const result = amount * rate;

  // Apply precision based on the converted amount size
  if (result >= 1000) {
    return Math.round(result * 100) / 100; // 2 decimal places
  } else if (result >= 1) {
    return Math.round(result * 1000) / 1000; // 3 decimal places
  } else {
    return Math.round(result * 10000) / 10000; // 4 decimal places
  }
}

/**
 * Format conversion timestamp for display
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @param {boolean} includeDate - Whether to include date (default: false)
 * @returns {string} Formatted timestamp
 */
export function formatConversionTimestamp(timestamp, includeDate = false) {
  try {
    const date = timestamp ? new Date(timestamp) : new Date();

    if (isNaN(date.getTime())) {
      throw new Error('Invalid timestamp');
    }

    if (includeDate) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    console.warn('⚠️ Timestamp formatting failed:', error.message);
    return new Date().toLocaleTimeString();
  }
}

/**
 * Get appropriate decimal places for currency display
 * @param {number} amount - Amount to check
 * @param {string} currencyCode - Currency code (for special cases)
 * @returns {number} Number of decimal places
 */
export function getDecimalPlaces(amount, currencyCode = '') {
  // Special cases for certain currencies
  const zeroDecimalCurrencies = [
    'JPY',
    'KRW',
    'VND',
    'CLP',
    'PYG',
    'XOF',
    'XAF'
  ];
  if (zeroDecimalCurrencies.includes(currencyCode)) {
    return 0;
  }

  // Standard decimal place logic based on amount
  if (amount >= 1000) {
    return 2;
  } else if (amount >= 1) {
    return 3;
  } else {
    return 4;
  }
}

/**
 * Calculate percentage change between amounts
 * @param {number} originalAmount - Original amount
 * @param {number} convertedAmount - Converted amount
 * @returns {Object} Percentage change info
 */
export function calculatePercentageChange(originalAmount, convertedAmount) {
  const change = convertedAmount - originalAmount;
  const percentageChange = (change / originalAmount) * 100;

  return {
    change: Math.round(change * 100) / 100,
    percentage: Math.round(percentageChange * 100) / 100,
    isIncrease: change > 0,
    isDecrease: change < 0,
    isEqual: Math.abs(change) < 0.01
  };
}

/**
 * Validate conversion input parameters
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Object} Validation result
 */
export function validateConversionInput(amount, fromCurrency, toCurrency) {
  const errors = [];

  // Validate amount
  if (!amount || isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (amount > 1000000000) {
    errors.push('Amount is too large for conversion');
  }

  // Validate currency codes
  if (
    !fromCurrency ||
    typeof fromCurrency !== 'string' ||
    fromCurrency.length !== 3
  ) {
    errors.push('From currency must be a valid 3-letter code');
  }

  if (
    !toCurrency ||
    typeof toCurrency !== 'string' ||
    toCurrency.length !== 3
  ) {
    errors.push('To currency must be a valid 3-letter code');
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedFromCurrency:
      fromCurrency && typeof fromCurrency === 'string'
        ? fromCurrency.toUpperCase()
        : null,
    normalizedToCurrency:
      toCurrency && typeof toCurrency === 'string'
        ? toCurrency.toUpperCase()
        : null
  };
}

/**
 * Create a formatted conversion summary
 * @param {Object} conversionResult - Result from ExchangeRateService
 * @returns {Object} Formatted conversion summary object
 */
export function createConversionSummary(conversionResult) {
  const {
    originalAmount,
    convertedAmount,
    fromCurrency,
    toCurrency,
    rate,
    source,
    timestamp,
    cached,
    offline
  } = conversionResult;

  const formattedOriginal = formatConvertedAmount(originalAmount, fromCurrency);
  const formattedConverted = formatConvertedAmount(convertedAmount, toCurrency);
  const formattedRate = formatExchangeRate(rate, fromCurrency, toCurrency);
  const formattedTime = formatConversionTimestamp(timestamp);

  // Create source information
  const sourceInfo = [];
  if (cached) {
    sourceInfo.push('cached');
  }
  if (offline) {
    sourceInfo.push('offline');
  }

  const sourceString =
    sourceInfo.length > 0 ? `${source} (${sourceInfo.join(', ')})` : source;

  return {
    formattedAmount: formattedConverted,
    formattedRate: formattedRate,
    source: sourceString,
    conversionTime: formattedTime,
    originalText: formattedOriginal
  };
}

// Export all functions for external use
export const ConversionUtils = {
  formatConvertedAmount,
  formatExchangeRate,
  calculatePreciseConversion,
  formatConversionTimestamp,
  getDecimalPlaces,
  calculatePercentageChange,
  validateConversionInput,
  createConversionSummary
};
