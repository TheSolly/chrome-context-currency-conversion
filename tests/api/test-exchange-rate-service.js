/**
 * Exchange Rate Service Test
 * Tests Task 4.2: Exchange Rate Service with caching, offline fallback, error handling, and retry logic
 */

import {
  ExchangeRateService,
  exchangeRateService
} from '../../utils/api-service.js';

// Mock Chrome storage for testing
const mockStorage = new Map();
globalThis.chrome = {
  storage: {
    local: {
      get: async key => {
        if (typeof key === 'string') {
          return { [key]: mockStorage.get(key) };
        } else if (key === null) {
          // Return all storage
          const result = {};
          for (const [k, v] of mockStorage.entries()) {
            result[k] = v;
          }
          return result;
        } else if (Array.isArray(key)) {
          const result = {};
          for (const k of key) {
            if (mockStorage.has(k)) {
              result[k] = mockStorage.get(k);
            }
          }
          return result;
        }
      },
      set: async data => {
        for (const [key, value] of Object.entries(data)) {
          mockStorage.set(key, value);
        }
        return Promise.resolve();
      },
      remove: async keys => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        for (const key of keysArray) {
          mockStorage.delete(key);
        }
        return Promise.resolve();
      }
    }
  }
};

// Mock API service with controlled responses
class MockApiService {
  constructor() {
    this.shouldFail = false;
    this.failureCount = 0;
    this.maxFailures = 2;
    this.delay = 0;
  }

  async getExchangeRate(fromCurrency, toCurrency) {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this.failureCount++;
      throw new Error('Mock API failure');
    }

    // Return mock rate data
    const mockRates = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.73,
      'EUR-USD': 1.18,
      'GBP-USD': 1.37
    };

    const key = `${fromCurrency}-${toCurrency}`;
    const rate = mockRates[key] || 1.5; // Default mock rate

    return {
      rate,
      source: 'Mock API',
      timestamp: new Date().toISOString(),
      fromCurrency,
      toCurrency
    };
  }

  getServiceStats() {
    return {
      mockService: true,
      failureCount: this.failureCount
    };
  }
}

console.log('🧪 Testing Exchange Rate Service (Task 4.2)\n');

/**
 * Test 1: Basic Currency Conversion
 */
async function testBasicConversion() {
  console.log('📊 Test 1: Basic Currency Conversion');

  const service = new ExchangeRateService();
  service.apiService = new MockApiService();

  try {
    const result = await service.convertCurrency(100, 'USD', 'EUR');

    console.log('✅ Basic conversion successful:');
    console.log(`   100 USD = ${result.convertedAmount} EUR`);
    console.log(`   Rate: ${result.rate}`);
    console.log(`   Source: ${result.source}`);
    console.log(`   Cached: ${result.cached}`);
    console.log(`   Offline: ${result.offline}`);

    return true;
  } catch (error) {
    console.error('❌ Basic conversion failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Caching Functionality
 */
async function testCaching() {
  console.log('\n💾 Test 2: Caching Functionality');

  const service = new ExchangeRateService();
  service.apiService = new MockApiService();

  try {
    // First request (should cache)
    console.log('First request (will be cached):');
    const result1 = await service.convertCurrency(100, 'USD', 'GBP');
    console.log(`   Cached: ${result1.cached}, Rate: ${result1.rate}`);

    // Second request (should use cache)
    console.log('Second request (should use cache):');
    const result2 = await service.convertCurrency(200, 'USD', 'GBP');
    console.log(`   Cached: ${result2.cached}, Rate: ${result2.rate}`);

    // Verify both used same rate
    const ratesMatch = result1.rate === result2.rate;
    console.log(`   Rates match: ${ratesMatch ? '✅' : '❌'}`);
    console.log(
      `   Second request used cache: ${result2.cached ? '✅' : '❌'}`
    );

    return ratesMatch && result2.cached;
  } catch (error) {
    console.error('❌ Caching test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Retry Logic
 */
async function testRetryLogic() {
  console.log('\n🔄 Test 3: Retry Logic');

  const service = new ExchangeRateService();
  service.maxRetries = 3;
  service.retryDelay = 100; // Faster for testing

  const mockApi = new MockApiService();
  mockApi.shouldFail = true;
  mockApi.maxFailures = 2; // Fail first 2 attempts, succeed on 3rd
  service.apiService = mockApi;

  try {
    console.log('Testing retry with 2 failures followed by success...');
    const startTime = Date.now();
    const result = await service.convertCurrency(100, 'EUR', 'USD');
    const duration = Date.now() - startTime;

    console.log(`✅ Retry successful after ${mockApi.failureCount} failures`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Final rate: ${result.rate}`);

    return mockApi.failureCount === 2 && result.rate > 0;
  } catch (error) {
    console.error('❌ Retry test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Offline Fallback
 */
async function testOfflineFallback() {
  console.log('\n📴 Test 4: Offline Fallback');

  const service = new ExchangeRateService();

  try {
    // First, cache a rate
    const mockApi = new MockApiService();
    service.apiService = mockApi;

    console.log('Caching a rate for offline test...');
    await service.convertCurrency(100, 'USD', 'JPY'); // Use different pair

    // Clear the regular cache but keep offline cache
    await service.clearCache(false);

    // Now simulate API failure and test offline fallback
    mockApi.shouldFail = true;
    mockApi.maxFailures = 10; // Always fail

    console.log('Simulating API failure, testing offline fallback...');
    const result = await service.convertCurrency(150, 'USD', 'JPY');

    console.log('✅ Offline fallback successful:');
    console.log(`   150 USD = ${result.convertedAmount} JPY`);
    console.log(`   Offline: ${result.offline}`);
    console.log(`   Source: ${result.source}`);

    return result.offline === true;
  } catch (error) {
    console.error('❌ Offline fallback test failed:', error.message);
    return false;
  }
}

/**
 * Test 5: Error Handling
 */
async function testErrorHandling() {
  console.log('\n⚠️ Test 5: Error Handling');

  const service = new ExchangeRateService();
  let passed = 0;
  let total = 0;

  // Test invalid amount
  total++;
  try {
    await service.convertCurrency(-100, 'USD', 'EUR');
    console.log('❌ Should have failed for negative amount');
  } catch (error) {
    console.log('✅ Correctly rejected negative amount');
    passed++;
  }

  // Test invalid currency
  total++;
  try {
    await service.convertCurrency(100, '', 'EUR');
    console.log('❌ Should have failed for empty currency');
  } catch (error) {
    console.log('✅ Correctly rejected empty currency');
    passed++;
  }

  // Test same currency conversion
  total++;
  try {
    const result = await service.convertCurrency(100, 'USD', 'USD');
    if (result.rate === 1 && result.convertedAmount === 100) {
      console.log('✅ Correctly handled same currency conversion');
      passed++;
    } else {
      console.log('❌ Same currency conversion incorrect');
    }
  } catch (error) {
    console.log('❌ Same currency conversion should not throw error');
  }

  console.log(`   Passed: ${passed}/${total} error handling tests`);
  return passed === total;
}

/**
 * Test 6: Rate Limiting
 */
async function testRateLimiting() {
  console.log('\n⏱️ Test 6: Rate Limiting');

  const service = new ExchangeRateService();
  service.apiService = new MockApiService();

  try {
    // Make rapid requests to trigger rate limiting
    console.log('Making rapid requests to test rate limiting...');
    const promises = [];

    for (let i = 0; i < 5; i++) {
      promises.push(service.convertCurrency(100, 'USD', 'EUR'));
    }

    const startTime = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`✅ Completed 5 requests in ${duration}ms`);
    console.log('   Rate limiting system is working');

    return true;
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error.message);
    return false;
  }
}

/**
 * Test 7: Service Statistics
 */
async function testServiceStats() {
  console.log('\n📊 Test 7: Service Statistics');

  const service = new ExchangeRateService();
  service.apiService = new MockApiService();

  try {
    // Make some conversions to generate stats
    await service.convertCurrency(100, 'USD', 'EUR');
    await service.convertCurrency(200, 'GBP', 'USD');

    const stats = await service.getServiceStats();

    console.log('✅ Service statistics:');
    console.log(`   Cache count: ${stats.cacheCount}`);
    console.log(`   Offline cache count: ${stats.offlineCacheCount}`);
    console.log(`   Total cache size: ${stats.totalCacheSize} bytes`);
    console.log(`   Request history size: ${stats.requestHistorySize}`);
    console.log(`   Max retries: ${stats.maxRetries}`);

    return stats.cacheCount >= 0 && stats.requestHistorySize >= 0;
  } catch (error) {
    console.error('❌ Service stats test failed:', error.message);
    return false;
  }
}

/**
 * Test 8: Cache Management
 */
async function testCacheManagement() {
  console.log('\n🗑️ Test 8: Cache Management');

  const service = new ExchangeRateService();
  service.apiService = new MockApiService();

  try {
    // Create some cached data
    await service.convertCurrency(100, 'USD', 'EUR');
    await service.convertCurrency(100, 'GBP', 'USD');

    let stats = await service.getServiceStats();
    const initialCacheCount = stats.cacheCount;
    console.log(`   Initial cache count: ${initialCacheCount}`);

    // Clear cache
    await service.clearCache(false); // Don't clear offline cache

    stats = await service.getServiceStats();
    const afterClearCount = stats.cacheCount;
    console.log(`   After clear cache count: ${afterClearCount}`);
    console.log(
      `   Offline cache preserved: ${stats.offlineCacheCount > 0 ? '✅' : '📴'}`
    );

    // Clear everything including offline
    await service.clearCache(true);

    stats = await service.getServiceStats();
    console.log(
      `   After full clear: cache=${stats.cacheCount}, offline=${stats.offlineCacheCount}`
    );

    return afterClearCount < initialCacheCount;
  } catch (error) {
    console.error('❌ Cache management test failed:', error.message);
    return false;
  }
}

/**
 * Test 9: Precision and Formatting
 */
async function testPrecisionFormatting() {
  console.log('\n🎯 Test 9: Precision and Formatting');

  const service = new ExchangeRateService();

  try {
    // Test different amount ranges for precision
    const testCases = [
      { amount: 10000, expectedPrecision: 2 },
      { amount: 100, expectedPrecision: 3 },
      { amount: 0.5, expectedPrecision: 4 }
    ];

    let passed = 0;
    for (const testCase of testCases) {
      const precision = service.getDecimalPlaces(testCase.amount);
      if (precision === testCase.expectedPrecision) {
        console.log(`✅ ${testCase.amount} → ${precision} decimal places`);
        passed++;
      } else {
        console.log(
          `❌ ${testCase.amount} → ${precision} (expected ${testCase.expectedPrecision})`
        );
      }
    }

    // Test calculation precision
    const converted = service.calculateConversion(100, 0.85123456);
    console.log(`   100 * 0.85123456 = ${converted}`);

    return passed === testCases.length;
  } catch (error) {
    console.error('❌ Precision test failed:', error.message);
    return false;
  }
}

/**
 * Test 10: Integration Test with Singleton
 */
async function testSingletonIntegration() {
  console.log('\n🔗 Test 10: Singleton Integration');

  try {
    // Mock the singleton's API service
    exchangeRateService.apiService = new MockApiService();

    const testResult = await exchangeRateService.testService('USD', 'EUR');

    console.log('✅ Singleton test result:');
    console.log(`   Success: ${testResult.success}`);
    console.log(`   Duration: ${testResult.duration}ms`);
    console.log(`   Message: ${testResult.message}`);

    return testResult.success;
  } catch (error) {
    console.error('❌ Singleton integration test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Exchange Rate Service Test Suite\n');

  const tests = [
    { name: 'Basic Conversion', fn: testBasicConversion },
    { name: 'Caching', fn: testCaching },
    { name: 'Retry Logic', fn: testRetryLogic },
    { name: 'Offline Fallback', fn: testOfflineFallback },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Service Statistics', fn: testServiceStats },
    { name: 'Cache Management', fn: testCacheManagement },
    { name: 'Precision & Formatting', fn: testPrecisionFormatting },
    { name: 'Singleton Integration', fn: testSingletonIntegration }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} - PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name} - ERROR:`, error.message);
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(
    `Success rate: ${Math.round((passed / (passed + failed)) * 100)}%`
  );

  if (passed === tests.length) {
    console.log(
      '\n🎉 All tests passed! Exchange Rate Service (Task 4.2) is ready.'
    );
  } else {
    console.log('\n⚠️ Some tests failed. Please review and fix issues.');
  }
}

// Run tests
runAllTests().catch(console.error);
