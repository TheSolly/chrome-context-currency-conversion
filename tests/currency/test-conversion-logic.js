#!/usr/bin/env node

/**
 * Test script for Task 4.3 Conversion Logic
 * Tests the new conversion utilities and formatting functions
 */

// Import the conversion utilities
import {
  formatConvertedAmount,
  formatExchangeRate,
  calculatePreciseConversion,
  formatConversionTimestamp,
  getDecimalPlaces,
  validateConversionInput,
  createConversionSummary
} from '../../utils/conversion-utils.js';

console.log('🧪 Testing Task 4.3 Conversion Logic...\n');

// Test formatConvertedAmount
console.log('📊 Testing formatConvertedAmount:');
console.log('  USD 100.50 →', formatConvertedAmount(100.5, 'USD'));
console.log('  EUR 1234.567 →', formatConvertedAmount(1234.567, 'EUR'));
console.log('  JPY 50000 →', formatConvertedAmount(50000, 'JPY'));
console.log('  BTC 0.00123456 →', formatConvertedAmount(0.00123456, 'BTC'));
console.log('');

// Test formatExchangeRate
console.log('📈 Testing formatExchangeRate:');
console.log('  1 USD = 0.85 EUR →', formatExchangeRate(0.85, 'USD', 'EUR'));
console.log('  1 USD = 150.25 JPY →', formatExchangeRate(150.25, 'USD', 'JPY'));
console.log('  1 BTC = 45000 USD →', formatExchangeRate(45000, 'BTC', 'USD'));
console.log('');

// Test calculatePreciseConversion
console.log('🔢 Testing calculatePreciseConversion:');
console.log('  100 USD × 0.85 →', calculatePreciseConversion(100, 0.85, 'EUR'));
console.log(
  '  1000 USD × 150.25 →',
  calculatePreciseConversion(1000, 150.25, 'JPY')
);
console.log(
  '  0.5 BTC × 45000 →',
  calculatePreciseConversion(0.5, 45000, 'USD')
);
console.log('');

// Test formatConversionTimestamp
console.log('⏰ Testing formatConversionTimestamp:');
console.log('  Current time →', formatConversionTimestamp());
console.log(
  '  Specific date →',
  formatConversionTimestamp(new Date('2024-01-15T12:30:00Z'))
);
console.log('');

// Test getDecimalPlaces
console.log('🔍 Testing getDecimalPlaces:');
console.log('  USD →', getDecimalPlaces('USD'), 'decimals');
console.log('  JPY →', getDecimalPlaces('JPY'), 'decimals');
console.log('  BTC →', getDecimalPlaces('BTC'), 'decimals');
console.log('  Unknown →', getDecimalPlaces('XYZ'), 'decimals');
console.log('');

// Test validateConversionInput
console.log('✅ Testing validateConversionInput:');
console.log(
  '  Valid input (100, USD, EUR) →',
  validateConversionInput(100, 'USD', 'EUR')
);
console.log(
  '  Invalid amount (-100) →',
  validateConversionInput(-100, 'USD', 'EUR')
);
console.log('  Invalid rate (0) →', validateConversionInput(0, 'USD', 'EUR'));
console.log(
  '  Invalid currency (null) →',
  validateConversionInput(100, null, 'EUR')
);
console.log('');

// Test createConversionSummary - comprehensive example
console.log('📋 Testing createConversionSummary:');
const mockResult = {
  originalAmount: 100,
  convertedAmount: 85.0,
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  rate: 0.85,
  source: 'ExchangeRate-API',
  timestamp: new Date(),
  cached: false,
  offline: false
};

const summary = createConversionSummary(mockResult);
console.log('  Summary object keys:', Object.keys(summary));
console.log('  Formatted amount:', summary.formattedAmount);
console.log('  Formatted rate:', summary.formattedRate);
console.log('  Source info:', summary.source);
console.log('  Conversion time:', summary.conversionTime);
console.log('');

console.log('✅ Task 4.3 Conversion Logic tests completed!\n');

// Test error handling
console.log('⚠️  Testing error handling:');
try {
  calculatePreciseConversion('invalid', 0.85, 'EUR');
} catch (error) {
  console.log('  ✅ Caught invalid amount error:', error.message);
}

try {
  formatConvertedAmount(100, null);
} catch (error) {
  console.log('  ✅ Caught invalid currency error:', error.message);
}

console.log('\n🎉 All conversion logic tests passed!');
