/**
 * Debug script to test the favorites functionality
 * Run this in the browser console on the extension popup
 */

// Test favorites functionality
async function testFavoritesFunctionality() {
  console.log('🧪 Testing Favorites Functionality...');

  try {
    // Test 1: Import and initialize ConversionHistory
    console.log('1️⃣ Testing ConversionHistory import and initialization...');
    const { ConversionHistory } = await import('/utils/conversion-history.js');
    const conversionHistory = new ConversionHistory();
    await conversionHistory.initialize();
    console.log('✅ ConversionHistory initialized successfully');

    // Test 2: Test addToFavorites method
    console.log('2️⃣ Testing addToFavorites method...');
    const testFavorite = await conversionHistory.addToFavorites(
      'USD',
      'EUR',
      100,
      'Test Favorite'
    );
    console.log('✅ addToFavorites works:', testFavorite);

    // Test 3: Test getFavorites method
    console.log('3️⃣ Testing getFavorites method...');
    const favorites = conversionHistory.getFavorites();
    console.log('✅ getFavorites works:', favorites);

    // Test 4: Test removeFromFavorites method
    console.log('4️⃣ Testing removeFromFavorites method...');
    if (favorites.length > 0) {
      await conversionHistory.removeFromFavorites(favorites[0].id);
      console.log('✅ removeFromFavorites works');
    }

    // Test 5: Test FavoritesTab initialization
    console.log('5️⃣ Testing FavoritesTab initialization...');
    const { FavoritesTab } = await import('/popup/tabs/favorites-tab.js');
    const favoritesTab = new FavoritesTab();
    await favoritesTab.initialize();
    console.log('✅ FavoritesTab initialized successfully');

    // Test 6: Test settings tab favorites display
    console.log('6️⃣ Testing settings tab favorites display...');
    const { SettingsTab } = await import('/popup/tabs/settings-tab.js');
    const settingsTab = new SettingsTab();
    await settingsTab.initialize();
    await settingsTab.updateFavoritesCurrencies();
    console.log('✅ Settings tab favorites display works');

    console.log('🎉 All favorites functionality tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Favorites functionality test failed:', error);
    return false;
  }
}

// Add some sample data for testing
async function addSampleFavorites() {
  console.log('📝 Adding sample favorites for testing...');

  try {
    const { ConversionHistory } = await import('/utils/conversion-history.js');
    const conversionHistory = new ConversionHistory();
    await conversionHistory.initialize();

    const sampleFavorites = [
      { from: 'USD', to: 'EUR', amount: 1000, label: 'Monthly Salary' },
      { from: 'GBP', to: 'USD', amount: null, label: 'UK to US' },
      { from: 'EUR', to: 'EGP', amount: 500, label: 'Europe to Egypt' }
    ];

    for (const fav of sampleFavorites) {
      try {
        await conversionHistory.addToFavorites(
          fav.from,
          fav.to,
          fav.amount,
          fav.label
        );
        console.log(`✅ Added: ${fav.from} → ${fav.to}`);
      } catch (error) {
        if (error.message.includes('already in favorites')) {
          console.log(`ℹ️ Already exists: ${fav.from} → ${fav.to}`);
        } else {
          console.error(`❌ Failed to add ${fav.from} → ${fav.to}:`, error);
        }
      }
    }

    console.log('📝 Sample favorites added successfully');
  } catch (error) {
    console.error('❌ Failed to add sample favorites:', error);
  }
}

// Clear all favorites for testing
async function clearAllFavorites() {
  console.log('🗑️ Clearing all favorites...');

  try {
    const { ConversionHistory } = await import('/utils/conversion-history.js');
    const conversionHistory = new ConversionHistory();
    await conversionHistory.initialize();

    const favorites = conversionHistory.getFavorites();
    for (const fav of favorites) {
      await conversionHistory.removeFromFavorites(fav.id);
    }

    console.log('🗑️ All favorites cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear favorites:', error);
  }
}

// Check if running in browser or Node.js
const isBrowser = typeof window !== 'undefined';
const isNode =
  typeof process !== 'undefined' && process.versions && process.versions.node;

if (isBrowser) {
  // Export functions for browser console use
  window.testFavoritesFunctionality = testFavoritesFunctionality;
  window.addSampleFavorites = addSampleFavorites;
  window.clearAllFavorites = clearAllFavorites;

  console.log('🚀 Favorites debug script loaded. Available functions:');
  console.log('  - testFavoritesFunctionality() - Run all tests');
  console.log('  - addSampleFavorites() - Add sample data');
  console.log('  - clearAllFavorites() - Clear all favorites');
} else if (isNode) {
  // Node.js environment - run tests automatically
  console.log('🚀 Running in Node.js environment...');
  console.log('⚠️  Note: This script is designed for browser testing.');
  console.log(
    '🔧 For Node.js testing, please use the dedicated test files in /tests directory.'
  );
  console.log('');
  console.log('📋 Available test files:');
  console.log('  - tests/settings/test-comprehensive.js');
  console.log('  - tests/currency/test-conversion-logic.js');
  console.log('  - tests/api/test-exchange-rate-service.js');
  console.log('');
  console.log('🌐 To test favorites functionality:');
  console.log('  1. Load the extension in Chrome (chrome://extensions/)');
  console.log('  2. Open the extension popup');
  console.log('  3. Open browser console (F12)');
  console.log('  4. Copy and paste this script into the console');
  console.log('  5. Run: testFavoritesFunctionality()');
}
