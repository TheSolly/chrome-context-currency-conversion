#!/usr/bin/env node

const CURRENCY_PATTERNS = {
  symbolsSuffix:
    /([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)\s*(A\$|C\$|HK\$|NZ\$|S\$|US\$|R\$|\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿|kr|zł|Kč|Ft|฿|RM)/gi
};

const SYMBOL_TO_CODE = {
  $: 'USD',
  '€': 'EUR'
};

function parseAmount(amountStr) {
  return parseFloat(amountStr);
}

function normalizeCurrencySymbol(symbol) {
  return symbol.trim().replace(/\s+/g, '');
}

function testSuffixPattern(text) {
  console.log(`Testing: "${text}"`);

  CURRENCY_PATTERNS.symbolsSuffix.lastIndex = 0;
  const symbolSuffixMatch = CURRENCY_PATTERNS.symbolsSuffix.exec(text);

  console.log('Match result:', symbolSuffixMatch);

  if (symbolSuffixMatch) {
    const amount = parseAmount(symbolSuffixMatch[1]);
    const symbol = normalizeCurrencySymbol(symbolSuffixMatch[2]);
    const currency = SYMBOL_TO_CODE[symbol] || 'USD';

    console.log('Amount:', amount);
    console.log('Symbol:', symbol);
    console.log('Currency:', currency);
    console.log('Is valid amount?', !isNaN(amount) && amount > 0);

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

  return null;
}

console.log('=== Testing 430$ ===');
const result1 = testSuffixPattern('430$');
console.log('Final result:', result1);

console.log('\n=== Testing 500€ ===');
const result2 = testSuffixPattern('500€');
console.log('Final result:', result2);
