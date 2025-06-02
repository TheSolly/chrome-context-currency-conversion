/* eslint-disable indent */
// Smart Currency Detection System - Phase 6, Task 6.1
// Enhanced ML-based currency detection with advanced pattern recognition

import { CURRENCIES } from './currency-utils.js';

/**
 * Smart Currency Detector Class
 * Implements ML-like pattern recognition for complex currency formats
 */
export class SmartCurrencyDetector {
  constructor() {
    this.cryptoPatterns = this.initializeCryptoPatterns();
    this.complexNumberPatterns = this.initializeComplexPatterns();
    this.confidenceThreshold = 0.7;
    this.debugMode = false;
  }

  /**
   * Initialize cryptocurrency patterns
   */
  initializeCryptoPatterns() {
    return {
      BTC: {
        symbols: ['₿', 'BTC', 'Bitcoin', 'bitcoin'],
        patterns: [
          /(\d+(?:\.\d{1,8})?)\s*(?:₿|BTC|Bitcoin|bitcoin)/gi,
          /(?:₿|BTC|Bitcoin|bitcoin)\s*(\d+(?:\.\d{1,8})?)/gi
        ],
        name: 'Bitcoin',
        decimals: 8
      },
      ETH: {
        symbols: ['Ξ', 'ETH', 'Ethereum', 'ethereum'],
        patterns: [
          /(\d+(?:\.\d{1,18})?)\s*(?:Ξ|ETH|Ethereum|ethereum)/gi,
          /(?:Ξ|ETH|Ethereum|ethereum)\s*(\d+(?:\.\d{1,18})?)/gi
        ],
        name: 'Ethereum',
        decimals: 18
      },
      LTC: {
        symbols: ['Ł', 'LTC', 'Litecoin', 'litecoin'],
        patterns: [
          /(\d+(?:\.\d{1,8})?)\s*(?:Ł|LTC|Litecoin|litecoin)/gi,
          /(?:Ł|LTC|Litecoin|litecoin)\s*(\d+(?:\.\d{1,8})?)/gi
        ],
        name: 'Litecoin',
        decimals: 8
      },
      ADA: {
        symbols: ['ADA', 'Cardano', 'cardano'],
        patterns: [
          /(\d+(?:\.\d{1,6})?)\s*(?:ADA|Cardano|cardano)/gi,
          /(?:ADA|Cardano|cardano)\s*(\d+(?:\.\d{1,6})?)/gi
        ],
        name: 'Cardano',
        decimals: 6
      },
      DOT: {
        symbols: ['DOT', 'Polkadot', 'polkadot'],
        patterns: [
          /(\d+(?:\.\d{1,10})?)\s*(?:DOT|Polkadot|polkadot)/gi,
          /(?:DOT|Polkadot|polkadot)\s*(\d+(?:\.\d{1,10})?)/gi
        ],
        name: 'Polkadot',
        decimals: 10
      }
    };
  }

  /**
   * Initialize complex number format patterns
   */
  initializeComplexPatterns() {
    return {
      // European format: 1.234,56 (thousands separator: ., decimal: ,)
      european: {
        pattern: /(\d{1,3}(?:\.\d{3})*,\d{1,4})/g,
        parse: match => parseFloat(match.replace(/\./g, '').replace(',', '.'))
      },
      // US format: 1,234.56 (thousands separator: ,, decimal: .)
      us: {
        pattern: /(\d{1,3}(?:,\d{3})*\.\d{1,4})/g,
        parse: match => parseFloat(match.replace(/,/g, ''))
      },
      // Indian format: 1,23,456.78 (lakhs and crores system)
      indian: {
        pattern: /(\d{1,2}(?:,\d{2})*(?:,\d{3})*(?:\.\d{1,4})?)/g,
        parse: match => parseFloat(match.replace(/,/g, ''))
      },
      // Swiss format: 1'234.56 (apostrophe as thousands separator)
      swiss: {
        pattern: /(\d{1,3}(?:'\d{3})*(?:\.\d{1,4})?)/g,
        parse: match => parseFloat(match.replace(/'/g, ''))
      },
      // Scientific notation: 1.23e6, 1.23E+6
      scientific: {
        pattern: /(\d+(?:\.\d+)?[eE][+-]?\d+)/g,
        parse: match => parseFloat(match)
      }
    };
  }

  /**
   * Main detection method - analyzes text for currency amounts
   * @param {string} text - Text to analyze
   * @returns {Array} Array of detected currency objects
   */
  detectCurrencies(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const detectedCurrencies = [];
    const processedRanges = []; // Track processed text ranges to avoid duplicates

    // 1. Traditional currency detection
    const traditionalResults = this.detectTraditionalCurrencies(text);
    traditionalResults.forEach(result => {
      detectedCurrencies.push(result);
      processedRanges.push(result.range);
    });

    // 2. Cryptocurrency detection
    const cryptoResults = this.detectCryptocurrencies(text);
    cryptoResults.forEach(result => {
      if (!this.overlapsWithRange(result.range, processedRanges)) {
        detectedCurrencies.push(result);
        processedRanges.push(result.range);
      }
    });

    // 3. Complex number format detection
    const complexResults = this.detectComplexFormats(text);
    complexResults.forEach(result => {
      if (!this.overlapsWithRange(result.range, processedRanges)) {
        detectedCurrencies.push(result);
        processedRanges.push(result.range);
      }
    });

    // 4. Context-based currency inference
    const contextResults = this.inferCurrencyFromContext(text, processedRanges);
    contextResults.forEach(result => {
      if (!this.overlapsWithRange(result.range, processedRanges)) {
        detectedCurrencies.push(result);
      }
    });

    // Sort by confidence score and position
    return detectedCurrencies
      .filter(currency => currency.confidence >= this.confidenceThreshold)
      .sort((a, b) => {
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        return a.range.start - b.range.start;
      });
  }

  /**
   * Detect traditional fiat currencies
   */
  detectTraditionalCurrencies(text) {
    const results = [];

    // Enhanced patterns for traditional currencies
    const patterns = [
      // Symbol before amount: $1,234.56, €1.234,56
      {
        regex:
          /([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾$])\s*(\d+(?:[,.']\d{3})*(?:[,.]?\d{1,4})?)/g,
        type: 'symbol_before',
        confidence: 0.9
      },
      // Amount before symbol: 1,234.56$, 1.234,56€
      {
        regex:
          /(\d+(?:[,.']\d{3})*(?:[,.]?\d{1,4})?)\s*([€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾$])/g,
        type: 'symbol_after',
        confidence: 0.85
      },
      // Currency code after: 1,234.56 USD, 1.234,56 EUR
      {
        regex: /(\d{1,3}(?:[,.']\d{3})*(?:[,.]?\d{1,4})?)\s+([A-Z]{3})\b/g,
        type: 'code_after',
        confidence: 0.8
      },
      // Currency code before: USD 1,234.56, EUR 1.234,56
      {
        regex: /\b([A-Z]{3})\s+(\d{1,3}(?:[,.']\d{3})*(?:[,.]?\d{1,4})?)/g,
        type: 'code_before',
        confidence: 0.8
      }
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        const result = this.parseTraditionalMatch(match, pattern, text);
        if (result) {
          results.push(result);
        }
      }
    });

    return results;
  }

  /**
   * Parse traditional currency match
   */
  parseTraditionalMatch(match, pattern, _text) {
    let currency, amountStr, currencyStr;
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;

    switch (pattern.type) {
      case 'symbol_before':
        currencyStr = match[1];
        amountStr = match[2];
        currency = this.symbolToCurrencyCode(currencyStr);
        break;
      case 'symbol_after':
        amountStr = match[1];
        currencyStr = match[2];
        currency = this.symbolToCurrencyCode(currencyStr);
        break;
      case 'code_after':
        amountStr = match[1];
        currencyStr = match[2];
        currency = currencyStr.toUpperCase();
        break;
      case 'code_before':
        currencyStr = match[1];
        amountStr = match[2];
        currency = currencyStr.toUpperCase();
        break;
    }

    // Parse amount with smart number detection
    const amount = this.parseSmartNumber(amountStr);

    // Validate currency and amount
    if (
      currency &&
      !isNaN(amount) &&
      amount > 0 &&
      this.isValidCurrency(currency)
    ) {
      return {
        amount: amount,
        currency: currency,
        originalText: match[0],
        confidence: pattern.confidence,
        type: 'traditional',
        range: { start: startIndex, end: endIndex },
        amountFormat: this.detectNumberFormat(amountStr)
      };
    }

    return null;
  }

  /**
   * Detect cryptocurrencies
   */
  detectCryptocurrencies(text) {
    const results = [];

    Object.entries(this.cryptoPatterns).forEach(([code, crypto]) => {
      crypto.patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const amount = parseFloat(match[1]);
          if (!isNaN(amount) && amount > 0) {
            results.push({
              amount: amount,
              currency: code,
              originalText: match[0],
              confidence: 0.95,
              type: 'cryptocurrency',
              range: { start: match.index, end: match.index + match[0].length },
              decimals: crypto.decimals,
              name: crypto.name
            });
          }
        }
      });
    });

    return results;
  }

  /**
   * Detect complex number formats
   */
  detectComplexFormats(text) {
    const results = [];

    // Look for standalone numbers that might be currencies
    Object.entries(this.complexNumberPatterns).forEach(([format, config]) => {
      let match;
      while ((match = config.pattern.exec(text)) !== null) {
        const amount = config.parse(match[1]);
        if (!isNaN(amount) && amount > 0) {
          // Try to infer currency from surrounding context
          const contextCurrency = this.inferCurrencyFromSurroundingText(
            text,
            match.index
          );

          if (contextCurrency) {
            results.push({
              amount: amount,
              currency: contextCurrency.currency,
              originalText: match[0],
              confidence: contextCurrency.confidence * 0.7, // Reduced confidence for inferred
              type: 'complex_format',
              format: format,
              range: { start: match.index, end: match.index + match[0].length }
            });
          }
        }
      }
    });

    return results;
  }

  /**
   * Infer currency from context around numbers
   */
  inferCurrencyFromContext(text, excludeRanges) {
    const results = [];

    // Look for standalone numbers that might be currencies
    const numberPattern = /\b(\d{1,3}(?:[,.']\d{3})*(?:[,.]?\d{1,4})?)\b/g;
    let match;

    while ((match = numberPattern.exec(text)) !== null) {
      const range = { start: match.index, end: match.index + match[0].length };

      // Skip if already processed
      if (this.overlapsWithRange(range, excludeRanges)) {
        continue;
      }

      const amount = this.parseSmartNumber(match[1]);
      if (isNaN(amount) || amount <= 0) {
        continue;
      }

      // Look for currency indicators in surrounding text
      const contextCurrency = this.inferCurrencyFromSurroundingText(
        text,
        match.index
      );

      if (
        contextCurrency &&
        contextCurrency.confidence >= this.confidenceThreshold
      ) {
        results.push({
          amount: amount,
          currency: contextCurrency.currency,
          originalText: match[0],
          confidence: contextCurrency.confidence * 0.6, // Lower confidence for context-based
          type: 'context_inferred',
          range: range,
          contextClue: contextCurrency.clue
        });
      }
    }

    return results;
  }

  /**
   * Infer currency from surrounding text context
   */
  inferCurrencyFromSurroundingText(text, position) {
    const contextRadius = 50; // Characters to look around the position
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(text.length, position + contextRadius);
    const context = text.substring(start, end).toLowerCase();

    // Country/region indicators
    const locationCurrencyMap = {
      usa: 'USD',
      america: 'USD',
      dollar: 'USD',
      usd: 'USD',
      europe: 'EUR',
      euro: 'EUR',
      eur: 'EUR',
      uk: 'GBP',
      britain: 'GBP',
      pound: 'GBP',
      gbp: 'GBP',
      japan: 'JPY',
      yen: 'JPY',
      jpy: 'JPY',
      canada: 'CAD',
      cad: 'CAD',
      australia: 'AUD',
      aud: 'AUD',
      china: 'CNY',
      yuan: 'CNY',
      cny: 'CNY',
      india: 'INR',
      rupee: 'INR',
      inr: 'INR'
    };

    // Business context indicators
    const businessContextMap = {
      price: 0.8,
      cost: 0.8,
      pay: 0.7,
      buy: 0.7,
      sell: 0.7,
      revenue: 0.9,
      profit: 0.9,
      loss: 0.8,
      budget: 0.8,
      invoice: 0.9,
      receipt: 0.9,
      bill: 0.8,
      fee: 0.8
    };

    // Check for location/currency indicators
    for (const [indicator, currency] of Object.entries(locationCurrencyMap)) {
      if (context.includes(indicator)) {
        return {
          currency: currency,
          confidence: 0.7,
          clue: indicator
        };
      }
    }

    // Check for business context
    let maxBusinessConfidence = 0;
    let businessClue = '';
    for (const [indicator, confidence] of Object.entries(businessContextMap)) {
      if (context.includes(indicator) && confidence > maxBusinessConfidence) {
        maxBusinessConfidence = confidence;
        businessClue = indicator;
      }
    }

    if (maxBusinessConfidence > 0) {
      // Default to USD for business contexts without specific currency
      return {
        currency: 'USD',
        confidence: maxBusinessConfidence * 0.6,
        clue: businessClue
      };
    }

    return null;
  }

  /**
   * Smart number parsing that handles various formats
   */
  parseSmartNumber(numberStr) {
    if (!numberStr) {
      return NaN;
    }

    // Remove leading/trailing whitespace
    numberStr = numberStr.trim();

    // Determine the format based on patterns
    const hasCommaDecimal = /\d,\d{1,2}$/.test(numberStr); // Ends with comma and 1-2 digits
    const hasDotThousands = /\d\.\d{3}/.test(numberStr); // Has dot followed by exactly 3 digits

    if (hasCommaDecimal && hasDotThousands) {
      // European format: 1.234,56
      return parseFloat(numberStr.replace(/\./g, '').replace(',', '.'));
    } else if (hasCommaDecimal && !hasDotThousands) {
      // Just comma decimal: 1234,56
      return parseFloat(numberStr.replace(',', '.'));
    } else {
      // US format or simple number: 1,234.56 or 1234.56
      return parseFloat(numberStr.replace(/,/g, ''));
    }
  }

  /**
   * Detect number format type
   */
  detectNumberFormat(numberStr) {
    if (/\d\.\d{3}.*,\d/.test(numberStr)) {
      return 'european';
    }
    if (/\d,\d{3}.*\.\d/.test(numberStr)) {
      return 'us';
    }
    if (/\d'\d{3}/.test(numberStr)) {
      return 'swiss';
    }
    if (/\d{1,2}(?:,\d{2})*,\d{3}/.test(numberStr)) {
      return 'indian';
    }
    return 'standard';
  }

  /**
   * Convert currency symbol to currency code
   */
  symbolToCurrencyCode(symbol) {
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
      '₿': 'BTC',
      Ξ: 'ETH',
      Ł: 'LTC'
    };
    return symbolMap[symbol] || null;
  }

  /**
   * Check if currency code is valid
   */
  isValidCurrency(code) {
    return (
      CURRENCIES.hasOwnProperty(code) ||
      this.cryptoPatterns.hasOwnProperty(code)
    );
  }

  /**
   * Check if a range overlaps with any existing ranges
   */
  overlapsWithRange(newRange, existingRanges) {
    return existingRanges.some(
      range => !(newRange.end <= range.start || newRange.start >= range.end)
    );
  }

  /**
   * Enable debug mode for detailed logging
   */
  enableDebugMode() {
    this.debugMode = true;
  }

  /**
   * Set confidence threshold for detection
   */
  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Get detection statistics
   */
  getDetectionStats(text) {
    const results = this.detectCurrencies(text);
    return {
      totalDetected: results.length,
      byType: results.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {}),
      averageConfidence:
        results.length > 0
          ? results.reduce((sum, curr) => sum + curr.confidence, 0) /
            results.length
          : 0,
      currencies: [...new Set(results.map(r => r.currency))]
    };
  }
}

// Export singleton instance
export const smartCurrencyDetector = new SmartCurrencyDetector();
