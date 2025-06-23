/**
 * Node.js compatible test for favorites functionality
 * Tests the ConversionHistory class methods in isolation
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock Chrome APIs for Node.js testing
globalThis.chrome = {
  storage: {
    local: {
      data: {},
      async get(keys) {
        if (typeof keys === 'string') {
          return { [keys]: this.data[keys] };
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            result[key] = this.data[key];
          });
          return result;
        }
        return this.data;
      },
      async set(items) {
        Object.assign(this.data, items);
      },
      async clear() {
        this.data = {};
      }
    }
  }
};

// Test utilities
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Running: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
    } catch (error) {
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error.message}`);
      this.failed++;
    }
  }

  summary() {
    const total = this.passed + this.failed;
    console.log('');
    console.log('📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(
      `Success Rate: ${total > 0 ? Math.round((this.passed / total) * 100) : 0}%`
    );

    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check the output above for details.');
    }
  }
}

async function runFavoritesTests() {
  console.log('🚀 Starting Favorites Functionality Tests (Node.js)');
  console.log('====================================================');

  const runner = new TestRunner();

  try {
    // Import the ConversionHistory class
    const utilsPath = join(__dirname, '../../utils/conversion-history.js');
    const { ConversionHistory } = await import(utilsPath);

    await runner.test('ConversionHistory Initialization', async () => {
      const conversionHistory = new ConversionHistory();
      await conversionHistory.initialize();

      if (!conversionHistory.favorites) {
        throw new Error('Favorites array not initialized');
      }
      if (!Array.isArray(conversionHistory.favorites)) {
        throw new Error('Favorites is not an array');
      }
    });

    await runner.test('Add Favorite - Valid Input', async () => {
      const conversionHistory = new ConversionHistory();
      await conversionHistory.initialize();

      const result = await conversionHistory.addToFavorites(
        'USD',
        'EUR',
        100,
        'Test Favorite'
      );

      if (!result) {
        throw new Error('addToFavorites did not return a result');
      }
      if (result.fromCurrency !== 'USD' || result.toCurrency !== 'EUR') {
        throw new Error('Favorite not saved with correct currencies');
      }
      if (result.amount !== 100) {
        throw new Error('Favorite not saved with correct amount');
      }
      if (result.label !== 'Test Favorite') {
        throw new Error('Favorite not saved with correct label');
      }
    });

    await runner.test('Get Favorites', async () => {
      const conversionHistory = new ConversionHistory();
      await conversionHistory.initialize();

      await conversionHistory.addToFavorites('GBP', 'USD', null, 'UK to US');
      const favorites = conversionHistory.getFavorites();

      if (!Array.isArray(favorites)) {
        throw new Error('getFavorites did not return an array');
      }
      if (favorites.length === 0) {
        throw new Error('No favorites returned');
      }

      const found = favorites.find(
        f => f.fromCurrency === 'GBP' && f.toCurrency === 'USD'
      );
      if (!found) {
        throw new Error('Added favorite not found in favorites list');
      }
    });

    await runner.test('Remove Favorite', async () => {
      const conversionHistory = new ConversionHistory();
      await conversionHistory.initialize();

      const added = await conversionHistory.addToFavorites(
        'EUR',
        'JPY',
        500,
        'Euro to Yen'
      );
      const initialFavorites = conversionHistory.getFavorites();
      const initialCount = initialFavorites.length;

      await conversionHistory.removeFromFavorites(added.id);
      const finalFavorites = conversionHistory.getFavorites();

      if (finalFavorites.length !== initialCount - 1) {
        throw new Error('Favorite was not removed properly');
      }

      const stillExists = finalFavorites.find(f => f.id === added.id);
      if (stillExists) {
        throw new Error('Favorite still exists after removal');
      }
    });

    await runner.test('Duplicate Prevention', async () => {
      const conversionHistory = new ConversionHistory();
      await conversionHistory.initialize();

      await conversionHistory.addToFavorites(
        'CAD',
        'AUD',
        250,
        'Canada to Australia'
      );

      try {
        await conversionHistory.addToFavorites('CAD', 'AUD', 250, 'Duplicate');
        throw new Error('Duplicate favorite was allowed to be added');
      } catch (error) {
        if (!error.message.includes('already in favorites')) {
          throw new Error(
            'Wrong error message for duplicate: ' + error.message
          );
        }
        // Expected error - test passes
      }
    });

    await runner.test('Favorites Persistence', async () => {
      // Test 1: Add favorite and check persistence
      const conversionHistory1 = new ConversionHistory();
      await conversionHistory1.initialize();
      await conversionHistory1.addToFavorites(
        'SEK',
        'NOK',
        1000,
        'Swedish to Norwegian'
      );

      // Test 2: Create new instance and check if favorite persists
      const conversionHistory2 = new ConversionHistory();
      await conversionHistory2.initialize();
      const favorites = conversionHistory2.getFavorites();

      const found = favorites.find(
        f => f.fromCurrency === 'SEK' && f.toCurrency === 'NOK'
      );
      if (!found) {
        throw new Error('Favorite did not persist across instances');
      }
    });

    await runner.test('Max Favorites Limit', async () => {
      const conversionHistory = new ConversionHistory();
      await conversionHistory.initialize();

      // Clear existing favorites
      const existing = conversionHistory.getFavorites();
      for (const fav of existing) {
        await conversionHistory.removeFromFavorites(fav.id);
      }

      // Add favorites up to the limit
      const maxLimit = conversionHistory.MAX_FAVORITES;
      for (let i = 0; i < maxLimit + 5; i++) {
        await conversionHistory.addToFavorites(
          `CUR${i}`,
          'USD',
          i * 10,
          `Test ${i}`
        );
      }

      const finalFavorites = conversionHistory.getFavorites();
      if (finalFavorites.length > maxLimit) {
        throw new Error(
          `Favorites exceeded max limit: ${finalFavorites.length} > ${maxLimit}`
        );
      }
    });
  } catch (importError) {
    console.error('❌ Failed to import ConversionHistory:', importError);
    console.error(
      'Make sure the utils/conversion-history.js file exists and exports ConversionHistory'
    );
  }

  runner.summary();
  return runner.failed === 0;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFavoritesTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error running tests:', error);
      process.exit(1);
    });
}

export { runFavoritesTests };
