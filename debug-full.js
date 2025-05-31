#!/usr/bin/env node

const CURRENCY_PATTERNS = {
  symbols:
    /(A\$|C\$|HK\$|NZ\$|S\$|US\$|R\$|\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿|kr|zł|Kč|Ft|฿|RM)\s*([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)/gi,
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

function detectCurrency(text) {
  console.log(`\n=== Detecting: "${text}" ===`);

  // Try symbol prefix patterns first (e.g., $100, €50)
  CURRENCY_PATTERNS.symbols.lastIndex = 0;
  const symbolMatch = CURRENCY_PATTERNS.symbols.exec(text);
  console.log('Symbol prefix match:', symbolMatch);

  if (symbolMatch) {
    const symbol = normalizeCurrencySymbol(symbolMatch[1]);
    const amount = parseAmount(symbolMatch[2]);
    const currency = SYMBOL_TO_CODE[symbol] || 'USD';

    if (!isNaN(amount) && amount > 0) {
      const result = {
        amount: amount,
        currency: currency,
        originalText: symbolMatch[0],
        format: 'symbol',
        confidence: 0.9
      };
      console.log('Returning symbol result:', result);
      return result;
    }
  }

  // Try symbol suffix patterns (e.g., 100$, 50€)
  CURRENCY_PATTERNS.symbolsSuffix.lastIndex = 0;
  const symbolSuffixMatch = CURRENCY_PATTERNS.symbolsSuffix.exec(text);
  console.log('Symbol suffix match:', symbolSuffixMatch);

  if (symbolSuffixMatch) {
    const amount = parseAmount(symbolSuffixMatch[1]);
    const symbol = normalizeCurrencySymbol(symbolSuffixMatch[2]);
    const currency = SYMBOL_TO_CODE[symbol] || 'USD';

    if (!isNaN(amount) && amount > 0) {
      const result = {
        amount: amount,
        currency: currency,
        originalText: symbolSuffixMatch[0],
        format: 'symbolSuffix',
        confidence: 0.85
      };
      console.log('Returning suffix result:', result);
      return result;
    }
  }

  console.log('No matches found');
  return null;
}

// Test the problematic cases
detectCurrency('430$');
detectCurrency('500€');
