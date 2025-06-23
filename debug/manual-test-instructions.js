/**
 * Manual Test Instructions for Conversion Tracking
 * Phase 9, Task 9.4 Implementation Verification
 */

console.log('🧪 Manual Conversion Tracking Test Instructions');
console.log('==========================================\n');

console.log('📝 SETTINGS TAB TESTS:');
console.log('1. Open Settings Tab');
console.log('2. Change Base Currency - should track "settingsUpdates"');
console.log('3. Change Secondary Currency - should track "settingsUpdates"');
console.log('4. Add Additional Currency - should track "currencyCount"');
console.log('5. Perform Test Conversion - should track "dailyConversions"');
console.log('');

console.log('📚 HISTORY TAB TESTS:');
console.log('1. Open History Tab');
console.log(
  '2. Click Repeat Conversion button (🔄) - should track "dailyConversions"'
);
console.log('3. Check that new conversion appears in history');
console.log('4. Verify conversion is added to conversion history storage');
console.log('');

console.log('💎 PREMIUM TAB TESTS:');
console.log('1. Open Premium/Subscription Tab');
console.log('2. Check Usage Statistics show real data:');
console.log('   - Daily Conversions: should show actual count');
console.log('   - Currency Pairs: should show actual unique currencies used');
console.log('   - History Entries: should show actual history count');
console.log('3. Perform some conversions and refresh tab');
console.log('4. Verify usage stats update in real-time');
console.log('');

console.log('🔄 BACKGROUND SCRIPT TESTS:');
console.log('1. Right-click on a currency amount on any webpage');
console.log('2. Select "Convert to [Currency]" from context menu');
console.log('3. Check that conversion is tracked in:');
console.log('   - Subscription usage (dailyConversions)');
console.log('   - Conversion history');
console.log('');

console.log('✅ VERIFICATION COMMANDS:');
console.log('Run these in browser console to verify tracking:');
console.log('');

// Test commands
const testCommands = `
// Check subscription usage stats
const { getSubscriptionManager } = await import('/utils/subscription-manager-v2.js');
const sm = await getSubscriptionManager();
const stats = await sm.getRealUsageStats();
console.log('Real Usage Stats:', stats);

// Check conversion history
const { ConversionHistory } = await import('/utils/conversion-history.js');
const ch = new ConversionHistory();
await ch.initialize();
console.log('Today Conversions:', ch.getTodayConversions().length);
console.log('Total Conversions:', ch.stats.totalConversions);

// Check storage directly
chrome.storage.local.get(['usageTracking', 'conversionHistory'], (result) => {
  console.log('Storage Data:', result);
});
`;

console.log(testCommands);

console.log('🎯 EXPECTED BEHAVIOR:');
console.log('- All conversions should be tracked in subscription usage');
console.log('- All conversions should be saved to conversion history');
console.log('- Premium tab should show real usage data, not always 0');
console.log('- Usage limits should be enforced based on subscription plan');
