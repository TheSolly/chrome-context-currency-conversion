#!/usr/bin/env node

// Debug script to test conversion history functionality

// Mock Chrome APIs
globalThis.chrome = {
  storage: {
    local: {
      get: keys => {
        console.log('📖 Chrome local get called with keys:', keys);
        return Promise.resolve({});
      },
      set: data => {
        console.log('💾 Chrome local set called with data:', data);
        return Promise.resolve();
      }
    }
  }
};

// Import ConversionHistory
import { ConversionHistory } from '../../utils/conversion-history.js';

async function debugHistoryData() {
  console.log('🔍 Testing conversion history functionality...\n');

  try {
    // Create fresh instance
    console.log('1️⃣ Creating new ConversionHistory instance...');
    const history = new ConversionHistory();

    // Initialize
    console.log('\n2️⃣ Initializing ConversionHistory...');
    await history.initialize();

    // Add some sample conversions
    console.log('\n3️⃣ Adding sample conversions...');

    // Add conversion from yesterday
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    await history.addConversion({
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      originalAmount: 100,
      convertedAmount: 85.5,
      exchangeRate: 0.855,
      timestamp: yesterday,
      source: 'context-menu'
    });

    // Add conversion from today
    await history.addConversion({
      fromCurrency: 'EUR',
      toCurrency: 'GBP',
      originalAmount: 50,
      convertedAmount: 43.25,
      exchangeRate: 0.865,
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      source: 'context-menu'
    });

    // Add another conversion today
    await history.addConversion({
      fromCurrency: 'USD',
      toCurrency: 'JPY',
      originalAmount: 200,
      convertedAmount: 29800,
      exchangeRate: 149.0,
      timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
      source: 'context-menu'
    });

    // Add conversion from last week
    const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
    await history.addConversion({
      fromCurrency: 'GBP',
      toCurrency: 'USD',
      originalAmount: 75,
      convertedAmount: 94.5,
      exchangeRate: 1.26,
      timestamp: lastWeek,
      source: 'context-menu'
    });

    // Test getting all history
    console.log('\n4️⃣ Getting all history...');
    const allHistory = history.getHistory({ limit: 10 });
    console.log(`Found ${allHistory.length} conversions`);
    allHistory.forEach((conversion, index) => {
      console.log(
        `${index + 1}. ${conversion.originalAmount} ${conversion.fromCurrency} → ${conversion.convertedAmount} ${conversion.toCurrency} (${new Date(conversion.timestamp).toLocaleString()})`
      );
    });

    // Test today's conversions
    console.log("\n5️⃣ Getting today's conversions...");
    const todayConversions = history.getTodayConversions();
    console.log(`Today's conversions: ${todayConversions.length}`);

    // Test stats
    console.log('\n6️⃣ Getting statistics...');
    const stats = history.getStats();
    console.log('Total conversions:', stats.totalConversions);
    console.log('Today conversions:', stats.todayConversions);
    console.log('Most used from currency:', stats.mostUsedFromCurrency);
    console.log('Most used to currency:', stats.mostUsedToCurrency);
    console.log('Most used pair:', stats.mostUsedPair);

    // Test popular pairs
    console.log('\n7️⃣ Getting popular pairs...');
    const popularPairs = history.getPopularPairs(5);
    console.log(`Popular pairs: ${popularPairs.length}`);
    popularPairs.forEach((pair, index) => {
      console.log(
        `${index + 1}. ${pair.from} → ${pair.to} (${pair.count} times)`
      );
    });

    // Test date filtering
    console.log('\n8️⃣ Testing date filtering...');
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeekHistory = history.getHistory({
      dateFrom: weekAgo,
      limit: 10
    });
    console.log(`This week's conversions: ${thisWeekHistory.length}`);

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the debug test
debugHistoryData();
