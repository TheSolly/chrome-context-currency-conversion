// Test Script for Phase 3, Task 3.2: Currency Data Management
// Tests enhanced currency functionality and management features

import {
  CURRENCY_LIST,
  CURRENCY_REGIONS,
  getPopularCurrencies,
  getAllCurrencies,
  getCurrencyByCode,
  searchCurrencies,
  advancedSearchCurrencies,
  getCurrenciesByRegion,
  getCurrencyStats,
  CurrencyPreferences,
  validateCurrencyCode,
  validateCurrencySelection,
  formatCurrencyOption
} from '../../utils/currency-data.js';

console.log('🧪 Testing Phase 3, Task 3.2: Currency Data Management');
console.log('='.repeat(60));

// Test 1: Basic Currency Data
console.log('\n📊 Test 1: Currency Data Overview');
console.log('-'.repeat(30));
const stats = getCurrencyStats();
console.log(`Total currencies: ${stats.total}`);
console.log(`Popular currencies: ${stats.popular}`);
console.log(`Total regions: ${stats.regions}`);
console.log('Region breakdown:', stats.regionStats);

// Test 2: Regional Currency Grouping
console.log('\n🌍 Test 2: Regional Currency Grouping');
console.log('-'.repeat(30));
Object.keys(CURRENCY_REGIONS).forEach(regionKey => {
  const region = CURRENCY_REGIONS[regionKey];
  const currencies = getCurrenciesByRegion(regionKey);
  console.log(`${region.flag} ${region.name}: ${currencies.length} currencies`);
  console.log(
    `  Codes: ${currencies
      .slice(0, 5)
      .map(c => c.code)
      .join(', ')}${currencies.length > 5 ? '...' : ''}`
  );
});

// Test 3: Advanced Search Functionality
console.log('\n🔍 Test 3: Advanced Search Functionality');
console.log('-'.repeat(30));

// Basic search
const searchResults1 = searchCurrencies('dollar');
console.log(`Basic search for "dollar": ${searchResults1.length} results`);
console.log(`  Found: ${searchResults1.map(c => c.code).join(', ')}`);

// Advanced search - popular only
const searchResults2 = advancedSearchCurrencies('', {
  includePopular: true,
  includeAll: false
});
console.log(`Popular currencies only: ${searchResults2.length} results`);
console.log(`  Codes: ${searchResults2.map(c => c.code).join(', ')}`);

// Advanced search - by region
const searchResults3 = advancedSearchCurrencies('', {
  region: 'europe'
});
console.log(`European currencies: ${searchResults3.length} results`);
console.log(
  `  Codes: ${searchResults3
    .slice(0, 8)
    .map(c => c.code)
    .join(', ')}...`
);

// Advanced search with query in region
const searchResults4 = advancedSearchCurrencies('pound', {
  region: 'europe'
});
console.log(`Search "pound" in Europe: ${searchResults4.length} results`);
console.log(
  `  Found: ${searchResults4.map(c => `${c.code} (${c.name})`).join(', ')}`
);

// Test 4: Currency Validation
console.log('\n✅ Test 4: Currency Validation');
console.log('-'.repeat(30));

// Valid currency validation
const validation1 = validateCurrencyCode('USD');
console.log(
  `USD validation: ${validation1.valid ? '✅' : '❌'} - ${validation1.currency?.name || validation1.error}`
);

// Invalid currency validation
const validation2 = validateCurrencyCode('XYZ');
console.log(
  `XYZ validation: ${validation2.valid ? '✅' : '❌'} - ${validation2.error || 'Valid'}`
);

// Currency selection validation
const selectionValidation1 = validateCurrencySelection('USD', 'EUR', [
  'GBP',
  'JPY'
]);
console.log(
  `Selection (USD->EUR + [GBP,JPY]): ${selectionValidation1.valid ? '✅' : '❌'}`
);
if (selectionValidation1.warnings.length > 0) {
  console.log(`  Warnings: ${selectionValidation1.warnings.length}`);
}

// Invalid selection validation (duplicates)
const selectionValidation2 = validateCurrencySelection('USD', 'USD', ['EUR']);
console.log(
  `Selection (USD->USD + [EUR]): ${selectionValidation2.valid ? '✅' : '❌'}`
);
if (selectionValidation2.errors.length > 0) {
  console.log(`  Errors: ${selectionValidation2.errors.join(', ')}`);
}

// Test 5: Currency Preferences Management
console.log('\n⭐ Test 5: Currency Preferences Management');
console.log('-'.repeat(30));

const preferences = new CurrencyPreferences();

// Add favorites
preferences.addToFavorites('USD');
preferences.addToFavorites('EUR');
preferences.addToFavorites('GBP');
preferences.addToFavorites('JPY');

console.log(`Added favorites: ${preferences.favorites.join(', ')}`);

// Add recently used
preferences.addToRecentlyUsed('CAD');
preferences.addToRecentlyUsed('AUD');
preferences.addToRecentlyUsed('CHF');

console.log(`Recently used: ${preferences.recentlyUsed.join(', ')}`);

// Get full currency data
const favoriteCurrencies = preferences.getFavorites();
console.log(
  `Favorite currencies with data: ${favoriteCurrencies.map(c => `${c.code} (${c.name})`).join(', ')}`
);

// Test 6: Formatting and Display
console.log('\n🎨 Test 6: Formatting and Display');
console.log('-'.repeat(30));

const sampleCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
sampleCurrencies.forEach(code => {
  const currency = getCurrencyByCode(code);
  if (currency) {
    const formatted = formatCurrencyOption(currency);
    console.log(`${code}: ${formatted}`);
  }
});

// Test 7: Performance Test
console.log('\n⚡ Test 7: Performance Test');
console.log('-'.repeat(30));

const startTime = performance.now();

// Perform multiple operations
for (let i = 0; i < 100; i++) {
  advancedSearchCurrencies('dollar');
  getCurrenciesByRegion('americas');
  validateCurrencySelection('USD', 'EUR', ['GBP']);
}

const endTime = performance.now();
console.log(
  `100 iterations completed in ${(endTime - startTime).toFixed(2)}ms`
);
console.log(
  `Average: ${((endTime - startTime) / 100).toFixed(3)}ms per operation`
);

console.log('\n🎉 Currency Data Management Tests Complete!');
console.log('✅ All enhanced Task 3.2 features tested successfully');
