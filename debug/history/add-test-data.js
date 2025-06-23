// Add test conversion history data directly in Chrome extension environment
// This can be run in the popup console or background service worker

async function addTestHistoryData() {
  console.log('🔍 Adding test conversion history data...');

  try {
    // Import conversion history manager
    const { ConversionHistory } = await import('/utils/conversion-history.js');
    const history = new ConversionHistory();

    // Initialize
    await history.initialize();

    // Add sample conversions with different timestamps
    const conversions = [
      {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        originalAmount: 100,
        convertedAmount: 85.5,
        exchangeRate: 0.855,
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // Yesterday
        source: 'context-menu',
        confidence: 0.95,
        webpage: 'example.com'
      },
      {
        fromCurrency: 'EUR',
        toCurrency: 'GBP',
        originalAmount: 50,
        convertedAmount: 43.25,
        exchangeRate: 0.865,
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        source: 'manual',
        confidence: 0.87
      },
      {
        fromCurrency: 'USD',
        toCurrency: 'JPY',
        originalAmount: 200,
        convertedAmount: 29800,
        exchangeRate: 149.0,
        timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        source: 'popup',
        confidence: 0.92
      },
      {
        fromCurrency: 'GBP',
        toCurrency: 'USD',
        originalAmount: 75,
        convertedAmount: 94.5,
        exchangeRate: 1.26,
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last week
        source: 'context-menu',
        confidence: 0.78,
        webpage: 'shopping-site.com'
      },
      {
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        originalAmount: 150,
        convertedAmount: 165,
        exchangeRate: 1.1,
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        source: 'api',
        confidence: 0.99
      },
      {
        fromCurrency: 'CAD',
        toCurrency: 'USD',
        originalAmount: 1000,
        convertedAmount: 740,
        exchangeRate: 0.74,
        timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago (recent)
        source: 'context-menu',
        confidence: 0.94,
        webpage: 'news-website.com'
      },
      {
        fromCurrency: 'USD',
        toCurrency: 'GBP',
        originalAmount: 2000,
        convertedAmount: 1487,
        exchangeRate: 0.7435,
        timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago (matches screenshot)
        source: 'context-menu',
        confidence: 0.96,
        webpage: 'financial-news.com'
      }
    ];

    // Add all conversions
    for (const conversion of conversions) {
      await history.addConversion(conversion);
    }

    console.log(
      `✅ Added ${conversions.length} test conversions successfully!`
    );

    // Display summary
    const stats = history.getStats();
    console.log('📊 Current statistics:');
    console.log(`Total conversions: ${stats.totalConversions}`);
    console.log(`Today's conversions: ${stats.todayConversions}`);
    console.log(
      `Popular pairs: ${history
        .getPopularPairs(3)
        .map(p => `${p.from}→${p.to}`)
        .join(', ')}`
    );

    // Reload current tab if it's the history tab
    if (window.tabManager && window.tabManager.currentTab === 'history') {
      await window.tabManager.tabs.history.refresh();
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to add test data:', error);
    return false;
  }
}

// Make function available globally
window.addTestHistoryData = addTestHistoryData;

console.log(
  '📋 Test history data function loaded. Run addTestHistoryData() to add sample data.'
);
