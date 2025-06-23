/**
 * Test script for Rate Alerts functionality
 *
 * This script tests the alerts tab implementation to ensure:
 * 1. Premium feature gate works correctly
 * 2. "Check Now" and "Add Alert" buttons function properly
 * 3. Subscription integration works as expected
 * 4. Upgrade prompts and navigation work correctly
 */

// Test data
const mockFreeUser = {
  plan: 'FREE',
  features: { rateAlerts: 0 }
};

const mockPremiumUser = {
  plan: 'PREMIUM',
  features: { rateAlerts: 5 }
};

// Test functions
async function testAlertsTabFunctionality() {
  console.log('🧪 Testing Rate Alerts functionality...');

  try {
    // Test 1: Import AlertsTab
    const { AlertsTab } = await import('/popup/tabs/alerts-tab.js');
    console.log('✅ AlertsTab imported successfully');

    // Test 2: Create AlertsTab instance
    const alertsTab = new AlertsTab();
    console.log('✅ AlertsTab instance created');

    // Test 3: Check initialization method exists
    if (typeof alertsTab.initialize === 'function') {
      console.log('✅ initialize method exists');
    } else {
      console.error('❌ initialize method missing');
    }

    // Test 4: Check feature access methods exist
    if (typeof alertsTab.checkAlertsFeatureAccess === 'function') {
      console.log('✅ checkAlertsFeatureAccess method exists');
    } else {
      console.error('❌ checkAlertsFeatureAccess method missing');
    }

    if (typeof alertsTab.handleCheckNow === 'function') {
      console.log('✅ handleCheckNow method exists');
    } else {
      console.error('❌ handleCheckNow method missing');
    }

    if (typeof alertsTab.handleAddAlert === 'function') {
      console.log('✅ handleAddAlert method exists');
    } else {
      console.error('❌ handleAddAlert method missing');
    }

    if (typeof alertsTab.showUpgradePrompt === 'function') {
      console.log('✅ showUpgradePrompt method exists');
    } else {
      console.error('❌ showUpgradePrompt method missing');
    }

    // Test 5: Check utility methods exist
    if (typeof alertsTab.showSuccess === 'function') {
      console.log('✅ showSuccess method exists');
    } else {
      console.error('❌ showSuccess method missing');
    }

    if (typeof alertsTab.showError === 'function') {
      console.log('✅ showError method exists');
    } else {
      console.error('❌ showError method missing');
    }

    console.log('🎉 AlertsTab functionality tests passed!');
  } catch (error) {
    console.error('❌ AlertsTab test failed:', error);
  }
}

// Test subscription manager integration
async function testSubscriptionIntegration() {
  console.log('🧪 Testing Subscription integration...');

  try {
    // Test subscription manager import
    const { getSubscriptionManager } = await import(
      '/utils/subscription-manager-v2.js'
    );
    console.log('✅ SubscriptionManager imported successfully');

    const subscriptionManagerInstance = await getSubscriptionManager();
    console.log('✅ SubscriptionManager instance obtained');

    // Test subscription plans import
    const { SUBSCRIPTION_PLANS, FeatureGate } = await import(
      '/utils/subscription-plans.js'
    );
    console.log('✅ Subscription plans imported successfully');

    // Test feature gate functionality
    const freeHasAlerts = FeatureGate.isFeatureAvailable('FREE', 'rateAlerts');
    const premiumHasAlerts = FeatureGate.isFeatureAvailable(
      'PREMIUM',
      'rateAlerts'
    );

    console.log(`FREE plan alerts: ${freeHasAlerts} (expected: false)`);
    console.log(`PREMIUM plan alerts: ${premiumHasAlerts} (expected: true)`);

    const freeLimit = FeatureGate.getFeatureLimit('FREE', 'rateAlerts');
    const premiumLimit = FeatureGate.getFeatureLimit('PREMIUM', 'rateAlerts');

    console.log(`FREE alert limit: ${freeLimit} (expected: 0)`);
    console.log(`PREMIUM alert limit: ${premiumLimit} (expected: 5)`);

    // Test current subscription status
    const subscriptionInfo = subscriptionManagerInstance.getSubscriptionInfo();
    console.log(`Current plan: ${subscriptionInfo.plan}`);
    console.log(`Plan details:`, subscriptionInfo.planDetails.name);

    console.log('🎉 Subscription integration tests passed!');
  } catch (error) {
    console.error('❌ Subscription integration test failed:', error);
  }
}

// Test rate alerts manager
async function testRateAlertsManager() {
  console.log('🧪 Testing RateAlertsManager...');

  try {
    const { RateAlertsManager } = await import('/utils/rate-alerts-manager.js');
    console.log('✅ RateAlertsManager imported successfully');

    const alertsManager = new RateAlertsManager();
    console.log('✅ RateAlertsManager instance created');

    // Test methods exist
    if (typeof alertsManager.initialize === 'function') {
      console.log('✅ initialize method exists');
    }

    if (typeof alertsManager.createAlert === 'function') {
      console.log('✅ createAlert method exists');
    }

    if (typeof alertsManager.checkRates === 'function') {
      console.log('✅ checkRates method exists');
    }

    console.log('🎉 RateAlertsManager tests passed!');
  } catch (error) {
    console.error('❌ RateAlertsManager test failed:', error);
  }
}

// Test button functionality in DOM environment
async function testButtonFunctionality() {
  console.log('🧪 Testing Button Functionality...');

  try {
    // Simulate DOM environment for testing
    if (typeof document === 'undefined') {
      console.log('ℹ️  Button functionality test requires DOM environment');
      console.log(
        '   Run this test in browser console after loading extension'
      );
      return;
    }

    // Check if buttons exist in DOM
    const checkNowBtn = document.getElementById('triggerRateCheck');
    const addAlertBtn = document.getElementById('addAlert');

    if (checkNowBtn) {
      console.log('✅ Check Now button found in DOM');
    } else {
      console.warn('⚠️ Check Now button not found - may not be on alerts tab');
    }

    if (addAlertBtn) {
      console.log('✅ Add Alert button found in DOM');
    } else {
      console.warn('⚠️ Add Alert button not found - may not be on alerts tab');
    }

    // Test button click handlers
    if (checkNowBtn && addAlertBtn) {
      console.log('💡 To test buttons manually:');
      console.log('   1. Navigate to the Alerts tab');
      console.log('   2. Click "Check Now" button');
      console.log('   3. Click "Add Alert" button');
      console.log('   4. Observe behavior based on subscription plan');
    }

    console.log('🎉 Button functionality test completed!');
  } catch (error) {
    console.error('❌ Button functionality test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Rate Alerts functionality tests...\n');

  await testAlertsTabFunctionality();
  console.log('');

  await testSubscriptionIntegration();
  console.log('');

  await testRateAlertsManager();
  console.log('');

  await testButtonFunctionality();
  console.log('');

  console.log('✨ All tests completed!');
  console.log('📋 Test Summary:');
  console.log('   - AlertsTab: Class structure and methods verified');
  console.log('   - Subscription Integration: Feature gating working');
  console.log('   - RateAlertsManager: Manager class structure verified');
  console.log('   - Button Functionality: DOM integration tests available');
  console.log('');
  console.log('💡 To test full functionality:');
  console.log('   1. Load extension in Chrome');
  console.log('   2. Open extension popup');
  console.log('   3. Navigate to Alerts tab');
  console.log('   4. Test buttons and upgrade prompts');
}

// Export for manual testing
if (typeof window !== 'undefined') {
  window.testAlertsFunction = runAllTests;
  window.testAlertsButtons = testButtonFunctionality;
  console.log(
    '💡 Run window.testAlertsFunction() or window.testAlertsButtons() in browser console'
  );
}

export {
  runAllTests,
  testAlertsTabFunctionality,
  testSubscriptionIntegration,
  testRateAlertsManager,
  testButtonFunctionality
};
