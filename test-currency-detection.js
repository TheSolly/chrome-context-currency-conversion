#!/usr/bin/env node

/**
 * Test script for currency detection patterns - Task 2.1
 * Run with: node test-currency-detection.js
 */

// Import currency detection function (simplified for testing)
const CURRENCY_PATTERNS = {
  // Symbol prefix: $100, €50, £75, ¥1000, etc.
  symbols:
    /(A\$|C\$|HK\$|NZ\$|S\$|US\$|R\$|\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿|kr|zł|Kč|Ft|฿|RM)\s*([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)/gi,

  // South African Rand (special case for R without $)
  randSymbol: /\bR\s*([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)/gi,

  // Symbol suffix: 100$, 50€, 75£, 1000¥, etc.
  symbolsSuffix:
    /([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)\s*(A\$|C\$|HK\$|NZ\$|S\$|US\$|R\$|\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿|kr|zł|Kč|Ft|฿|RM)/gi,

  // Code suffix: 100 USD, 50 EUR, etc.
  codes:
    /([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)\s+(USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|SEK|NZD|MXN|SGD|HKD|NOK|TRY|ZAR|BRL|INR|KRW|RUB|PLN|CZK|HUF|ILS|THB|PHP|MYR|IDR|VND|DKK|BGN|RON|HRK|UAH|EGP|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP)\b/gi,

  // Code prefix: USD 100, EUR 50, etc.
  codesFirst:
    /(USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|SEK|NZD|MXN|SGD|HKD|NOK|TRY|ZAR|BRL|INR|KRW|RUB|PLN|CZK|HUF|ILS|THB|PHP|MYR|IDR|VND|DKK|BGN|RON|HRK|UAH|EGP|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP)\s+([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)/gi,

  // Word suffix: 100 dollars, 50 euros, etc.
  words:
    /([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)\s+(dollars?|euros?|pounds?|yen|yuan|pesos?|rupees?|won|rubles?|francs?|krona|krone|zloty|shekel|baht|ringgit|rand)\b/gi,

  // Word prefix: dollars 100, euros 50, etc.
  wordsFirst:
    /(dollars?|euros?|pounds?|yen|yuan|pesos?|rupees?|won|rubles?|francs?|krona|krone|zloty|shekel|baht|ringgit|rand)\s+([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)/gi
};

const SYMBOL_TO_CODE = {
  $: 'USD',
  US$: 'USD',
  A$: 'AUD',
  C$: 'CAD',
  NZ$: 'NZD',
  S$: 'SGD',
  HK$: 'HKD',
  R$: 'BRL',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  kr: 'SEK',
  '₹': 'INR',
  '₽': 'RUB',
  '₩': 'KRW',
  '₪': 'ILS',
  '₫': 'VND',
  '₱': 'PHP',
  '₺': 'TRY',
  zł: 'PLN',
  Kč: 'CZK',
  Ft: 'HUF',
  '฿': 'THB',
  RM: 'MYR',
  '¢': 'USD'
};

const WORD_TO_CODE = {
  dollars: 'USD',
  dollar: 'USD',
  euros: 'EUR',
  euro: 'EUR',
  pounds: 'GBP',
  pound: 'GBP',
  yen: 'JPY',
  yuan: 'CNY',
  pesos: 'MXN',
  peso: 'MXN',
  rupees: 'INR',
  rupee: 'INR',
  won: 'KRW',
  rubles: 'RUB',
  ruble: 'RUB',
  francs: 'CHF',
  franc: 'CHF',
  krona: 'SEK',
  krone: 'NOK',
  zloty: 'PLN',
  shekel: 'ILS',
  baht: 'THB',
  ringgit: 'MYR',
  rand: 'ZAR'
};

// Test currency detection function
function detectCurrency(text) {
  function parseAmount(amountStr) {
    const cleanAmount = amountStr.replace(/\s/g, '');
    if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
      const lastComma = cleanAmount.lastIndexOf(',');
      const lastPeriod = cleanAmount.lastIndexOf('.');
      if (lastComma > lastPeriod) {
        return parseFloat(cleanAmount.replace(/\./g, '').replace(',', '.'));
      } else {
        return parseFloat(cleanAmount.replace(/,/g, ''));
      }
    } else if (cleanAmount.includes(',')) {
      const parts = cleanAmount.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        return parseFloat(cleanAmount.replace(',', '.'));
      } else {
        return parseFloat(cleanAmount.replace(/,/g, ''));
      }
    } else {
      return parseFloat(cleanAmount);
    }
  }

  function normalizeCurrencySymbol(symbol) {
    return symbol.trim().replace(/\s+/g, '');
  }

  // Try symbol prefix patterns first (e.g., $100, €50)
  CURRENCY_PATTERNS.symbols.lastIndex = 0;
  const symbolMatch = CURRENCY_PATTERNS.symbols.exec(text);
  if (symbolMatch) {
    const symbol = normalizeCurrencySymbol(symbolMatch[1]);
    const amount = parseAmount(symbolMatch[2]);
    const currency = SYMBOL_TO_CODE[symbol] || 'USD';

    if (!isNaN(amount) && amount > 0) {
      return {
        amount: amount,
        currency: currency,
        originalText: symbolMatch[0],
        format: 'symbol',
        confidence: 0.9
      };
    }
  }

  // Try symbol suffix patterns (e.g., 100$, 50€)
  CURRENCY_PATTERNS.symbolsSuffix.lastIndex = 0;
  const symbolSuffixMatch = CURRENCY_PATTERNS.symbolsSuffix.exec(text);
  if (symbolSuffixMatch) {
    const amount = parseAmount(symbolSuffixMatch[1]);
    const symbol = normalizeCurrencySymbol(symbolSuffixMatch[2]);
    const currency = SYMBOL_TO_CODE[symbol] || 'USD';

    if (!isNaN(amount) && amount > 0) {
      return {
        amount: amount,
        currency: currency,
        originalText: symbolSuffixMatch[0],
        format: 'symbolSuffix',
        confidence: 0.85
      };
    }
  }

  // Try Rand symbol pattern (special case for "R 150")
  CURRENCY_PATTERNS.randSymbol.lastIndex = 0;
  const randMatch = CURRENCY_PATTERNS.randSymbol.exec(text);
  if (randMatch) {
    const amount = parseAmount(randMatch[1]);

    if (!isNaN(amount) && amount > 0) {
      return {
        amount: amount,
        currency: 'ZAR',
        originalText: randMatch[0],
        format: 'randSymbol',
        confidence: 0.8
      };
    }
  }

  // Try other patterns...
  const patterns = [
    {
      regex: CURRENCY_PATTERNS.codesFirst,
      format: 'codeFirst',
      confidence: 0.85
    },
    { regex: CURRENCY_PATTERNS.codes, format: 'code', confidence: 0.85 },
    {
      regex: CURRENCY_PATTERNS.wordsFirst,
      format: 'wordFirst',
      confidence: 0.7
    },
    { regex: CURRENCY_PATTERNS.words, format: 'word', confidence: 0.7 }
  ];

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    const match = pattern.regex.exec(text);
    if (match) {
      let currency, amount;

      if (pattern.format.includes('code')) {
        if (pattern.format === 'codeFirst') {
          currency = match[1].toUpperCase();
          amount = parseAmount(match[2]);
        } else {
          amount = parseAmount(match[1]);
          currency = match[2].toUpperCase();
        }
      } else if (pattern.format.includes('word')) {
        if (pattern.format === 'wordFirst') {
          const word = match[1].toLowerCase();
          currency = WORD_TO_CODE[word];
          amount = parseAmount(match[2]);
        } else {
          amount = parseAmount(match[1]);
          const word = match[2].toLowerCase();
          currency = WORD_TO_CODE[word];
        }
      }

      if (currency && !isNaN(amount) && amount > 0) {
        return {
          amount: amount,
          currency: currency,
          originalText: match[0],
          format: pattern.format,
          confidence: pattern.confidence
        };
      }
    }
  }

  return null;
}

// Test cases
const testCases = [
  // Symbol format tests
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
  'R150', // South African Rand
  '$1,234.56',
  '€1.234,56',
  '£12,345.67',

  // Code format tests
  '430 USD',
  '500 EUR',
  '75 GBP',
  '1000 JPY',
  'USD 430',
  'EUR 500',
  'GBP 75',
  'JPY 1000',

  // Word format tests
  '100 dollars',
  '50 euros',
  '75 pounds',
  '1000 yen',
  'dollars 100',
  'euros 50',
  'pounds 75',

  // Edge cases
  '$0.99',
  '¥100,000',
  'USD 0.01',

  // Invalid cases
  'abc123',
  '123abc',
  'USD',
  '$',
  '€'
];

console.log('🧪 Testing Enhanced Currency Detection Patterns (Task 2.1)\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = detectCurrency(testCase);
  const isValid = result !== null;
  const shouldBeValid = !['abc123', '123abc', 'USD', '$', '€'].includes(
    testCase
  );

  if (isValid === shouldBeValid) {
    passed++;
    console.log(
      `✅ ${index + 1}. "${testCase}" → ${isValid ? `${result.amount} ${result.currency} (${result.format})` : 'No match'}`
    );
  } else {
    failed++;
    console.log(
      `❌ ${index + 1}. "${testCase}" → Expected ${shouldBeValid ? 'match' : 'no match'}, got ${isValid ? 'match' : 'no match'}`
    );
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
console.log(`Success rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log(
    '🎉 All tests passed! Currency detection patterns are working correctly.'
  );
} else {
  console.log('⚠️  Some tests failed. Pattern improvements may be needed.');
}
