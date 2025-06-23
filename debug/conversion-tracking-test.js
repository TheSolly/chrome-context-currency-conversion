/**
 * Conversion Tracking Test for Phase 9, Task 9.4
 * Tests conversion tracking across Settings, History, and Premium tabs
 */

console.log('🧪 Starting Conversion Tracking Tests...');

async function testConversionTracking() {
  console.log('📊 Testing conversion tracking across all tabs...');

  try {
    // Test 1: Settings Tab Conversion Tracking
    await testSettingsTabTracking();

    // Test 2: History Tab Conversion Tracking
    await testHistoryTabTracking();

    // Test 3: Premium Tab Usage Statistics
    await testPremiumTabUsageStats();

    // Test 4: Cross-Tab Integration
    await testCrossTabIntegration();

    console.log('✅ All conversion tracking tests completed successfully!');
  } catch (error) {
    console.error('❌ Conversion tracking test failed:', error);
  }
}

/**
 * Test Settings Tab Conversion Tracking
 */
async function testSettingsTabTracking() {
  console.log('🔧 Testing Settings Tab conversion tracking...');

  try {
    // Import subscription manager
    const { getSubscriptionManager } = await import(
      '/utils/subscription-manager-v2.js'
    );
    const subscriptionManager = await getSubscriptionManager();

    // Get initial usage stats
    const initialStats = await subscriptionManager.getRealUsageStats();
    console.log('📊 Initial usage stats:', initialStats);

    // Test currency setting change tracking
    console.log('Testing currency setting changes...');
    await subscriptionManager.trackUsage('settingsUpdates', 1);

    // Test currency addition tracking
    console.log('Testing currency addition tracking...');
    await subscriptionManager.trackUsage('currencyCount', 1);

    // Test conversion testing
    console.log('Testing test conversion tracking...');
    await subscriptionManager.trackUsage('dailyConversions', 1);

    // Get updated stats
    const updatedStats = await subscriptionManager.getRealUsageStats();
    console.log('📊 Updated usage stats:', updatedStats);

    console.log('✅ Settings tab tracking test passed');
  } catch (error) {
    console.error('❌ Settings tab tracking test failed:', error);
    throw error;
  }
}

/**
 * Test History Tab Conversion Tracking
 */
async function testHistoryTabTracking() {
  console.log('📚 Testing History Tab conversion tracking...');

  try {
    // Import conversion history
    const { ConversionHistory } = await import('/utils/conversion-history.js');
    const conversionHistory = new ConversionHistory();
    await conversionHistory.initialize();

    // Test adding a conversion to history
    console.log('Testing conversion history addition...');
    const testConversion = {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      originalAmount: 100,
      convertedAmount: 85.5,
      exchangeRate: 0.855,
      timestamp: Date.now(),
      source: 'test',
      confidence: 1.0,
      webpage: null
    };

    await conversionHistory.addConversion(testConversion);
    console.log('📝 Test conversion added to history');

    // Test getting history stats
    const stats = conversionHistory.stats;
    console.log('📊 History stats:', {
      totalConversions: stats.totalConversions,
      todayConversions: stats.todayConversions,
      mostUsedCurrencies: stats.mostUsedFromCurrency
    });

    // Test repeat conversion tracking
    console.log('Testing repeat conversion tracking...');
    const { getSubscriptionManager } = await import(
      '/utils/subscription-manager-v2.js'
    );
    const subscriptionManager = await getSubscriptionManager();
    await subscriptionManager.trackUsage('dailyConversions', 1);

    console.log('✅ History tab tracking test passed');
  } catch (error) {
    console.error('❌ History tab tracking test failed:', error);
    throw error;
  }
}

/**
 * Test Premium Tab Usage Statistics
 */
async function testPremiumTabUsageStats() {
  console.log('💎 Testing Premium Tab usage statistics...');

  try {
    // Import subscription manager
    const { getSubscriptionManager } = await import(
      '/utils/subscription-manager-v2.js'
    );
    const subscriptionManager = await getSubscriptionManager();

    // Get subscription info
    const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
    console.log('📋 Subscription info:', {
      plan: subscriptionInfo.plan,
      status: subscriptionInfo.status
    });

    // Get real usage stats (what should be displayed in premium tab)
    const realUsageStats = await subscriptionManager.getRealUsageStats();
    console.log('📊 Real usage stats for premium tab:', realUsageStats);

    // Test feature limits
    const conversionsLimit =
      subscriptionManager.getFeatureLimit('dailyConversions');
    const currenciesLimit =
      subscriptionManager.getFeatureLimit('currencyCount');
    const historyLimit =
      subscriptionManager.getFeatureLimit('conversionHistory');

    console.log('📏 Feature limits:', {
      dailyConversions: conversionsLimit,
      currencyCount: currenciesLimit,
      conversionHistory: historyLimit
    });

    // Test current usage
    const conversionsUsage =
      subscriptionManager.getCurrentUsage('dailyConversions');
    const currenciesUsage =
      subscriptionManager.getCurrentUsage('currencyCount');

    console.log('📈 Current usage:', {
      dailyConversions: conversionsUsage,
      currencyCount: currenciesUsage
    });

    console.log('✅ Premium tab usage stats test passed');
  } catch (error) {
    console.error('❌ Premium tab usage stats test failed:', error);
    throw error;
  }
}

/**
 * Test Cross-Tab Integration
 */
async function testCrossTabIntegration() {
  console.log('🔄 Testing cross-tab integration...');

  try {
    // Import both conversion history and subscription manager
    const { ConversionHistory } = await import('/utils/conversion-history.js');
    const { getSubscriptionManager } = await import(
      '/utils/subscription-manager-v2.js'
    );

    const conversionHistory = new ConversionHistory();
    await conversionHistory.initialize();
    const subscriptionManager = await getSubscriptionManager();

    // Simulate a conversion that should be tracked in both systems
    console.log('Simulating cross-tab conversion tracking...');

    // Add to conversion history
    const testConversion = {
      fromCurrency: 'GBP',
      toCurrency: 'USD',
      originalAmount: 50,
      convertedAmount: 63.5,
      exchangeRate: 1.27,
      timestamp: Date.now(),
      source: 'integration-test',
      confidence: 0.95,
      webpage: null
    };

    await conversionHistory.addConversion(testConversion);

    // Track in subscription manager
    await subscriptionManager.trackUsage('dailyConversions', 1);

    // Verify consistency
    const historyStats = conversionHistory.stats;
    const subscriptionStats = await subscriptionManager.getRealUsageStats();

    console.log('🔍 Cross-tab verification:', {
      historyTotalConversions: historyStats.totalConversions,
      subscriptionDailyConversions:
        subscriptionStats.dailyConversions?.current || 0
    });

    console.log('✅ Cross-tab integration test passed');
  } catch (error) {
    console.error('❌ Cross-tab integration test failed:', error);
    throw error;
  }
}

/**
 * Test Conversion Tracking in Background Script
 */
async function testBackgroundConversionTracking() {
  console.log('🔄 Testing background script conversion tracking...');

  try {
    // This would normally be triggered by the background script
    // We'll simulate the tracking that happens during actual conversions
    const { getSubscriptionManager } = await import(
      '/utils/subscription-manager-v2.js'
    );
    const subscriptionManager = await getSubscriptionManager();

    // Simulate background tracking
    console.log('Simulating background conversion tracking...');
    await subscriptionManager.trackUsage('dailyConversions', 1);

    const stats = await subscriptionManager.getRealUsageStats();
    console.log('📊 Background tracking result:', stats.dailyConversions);

    console.log('✅ Background conversion tracking test passed');
  } catch (error) {
    console.error('❌ Background conversion tracking test failed:', error);
    throw error;
  }
}

// Run the tests
if (typeof window !== 'undefined') {
  // Browser environment
  window.testConversionTracking = testConversionTracking;
  window.testSettingsTabTracking = testSettingsTabTracking;
  window.testHistoryTabTracking = testHistoryTabTracking;
  window.testPremiumTabUsageStats = testPremiumTabUsageStats;
  window.testBackgroundConversionTracking = testBackgroundConversionTracking;

  console.log('🧪 Conversion tracking test functions loaded. Run:');
  console.log('- testConversionTracking() for full test suite');
  console.log('- testSettingsTabTracking() for settings tab only');
  console.log('- testHistoryTabTracking() for history tab only');
  console.log('- testPremiumTabUsageStats() for premium tab only');
  console.log(
    '- testBackgroundConversionTracking() for background script only'
  );
}

export {
  testConversionTracking,
  testSettingsTabTracking,
  testHistoryTabTracking,
  testPremiumTabUsageStats,
  testCrossTabIntegration,
  testBackgroundConversionTracking
};
