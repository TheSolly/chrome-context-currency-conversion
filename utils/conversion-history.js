/* eslint-disable indent */
// Phase 6, Task 6.2: Conversion History Management
// Comprehensive system for storing, managing, and analyzing conversion history

/**
 * Conversion History Manager
 * Handles storage and retrieval of conversion history, favorites, and analytics
 */
export class ConversionHistory {
  constructor() {
    this.STORAGE_KEYS = {
      HISTORY: 'conversionHistory',
      FAVORITES: 'conversionFavorites',
      STATS: 'conversionStats'
    };

    this.MAX_HISTORY_ENTRIES = 1000;
    this.MAX_FAVORITES = 50;

    // Initialize data structures
    this.history = [];
    this.favorites = [];
    this.stats = this.getDefaultStats();

    // Check if Chrome APIs are available
    this.chromeApisAvailable =
      typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

    if (!this.chromeApisAvailable) {
      console.warn(
        '⚠️ Chrome storage APIs not available, using localStorage fallback'
      );
    }
  }

  /**
   * Initialize the conversion history system
   */
  async initialize() {
    console.log('📚 Initializing Conversion History Manager');

    try {
      await this.loadHistory();
      await this.loadFavorites();
      await this.loadStats();
      console.log('✅ Conversion History Manager initialized successfully');
      return true;
    } catch (error) {
      console.error(
        '❌ Failed to initialize Conversion History Manager:',
        error
      );
      return false;
    }
  }

  /**
   * Get default statistics structure
   */
  getDefaultStats() {
    return {
      totalConversions: 0,
      todayConversions: 0,
      lastConversionDate: null,
      mostUsedFromCurrency: null,
      mostUsedToCurrency: null,
      mostUsedPair: null,
      averageAmountConverted: 0,
      totalAmountConverted: 0,
      currencyUsageCount: {},
      pairUsageCount: {},
      dailyStats: {},
      weeklyStats: {},
      monthlyStats: {}
    };
  }

  /**
   * Add a new conversion to history
   */
  async addConversion({
    fromCurrency,
    toCurrency,
    originalAmount,
    convertedAmount,
    exchangeRate,
    timestamp = Date.now(),
    source = 'context-menu',
    confidence = null,
    webpage = null
  }) {
    const conversion = {
      id: this.generateConversionId(),
      fromCurrency,
      toCurrency,
      originalAmount: parseFloat(originalAmount),
      convertedAmount: parseFloat(convertedAmount),
      exchangeRate: parseFloat(exchangeRate),
      timestamp,
      source,
      confidence,
      webpage,
      date: new Date(timestamp).toISOString().split('T')[0] // YYYY-MM-DD
    };

    // Add to history
    this.history.unshift(conversion);

    // Trim history if it exceeds max size
    if (this.history.length > this.MAX_HISTORY_ENTRIES) {
      this.history = this.history.slice(0, this.MAX_HISTORY_ENTRIES);
    }

    // Update statistics
    this.updateStats(conversion);

    // Save to storage
    await this.saveHistory();
    await this.saveStats();

    console.log('📝 Added conversion to history:', conversion);
    return conversion;
  }

  /**
   * Get conversion history with optional filters
   */
  getHistory({
    limit = 50,
    fromCurrency = null,
    toCurrency = null,
    dateFrom = null,
    dateTo = null,
    source = null,
    minAmount = null,
    maxAmount = null
  } = {}) {
    let filtered = [...this.history];

    // Apply filters
    if (fromCurrency) {
      filtered = filtered.filter(c => c.fromCurrency === fromCurrency);
    }

    if (toCurrency) {
      filtered = filtered.filter(c => c.toCurrency === toCurrency);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom).getTime();
      filtered = filtered.filter(c => c.timestamp >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo).getTime();
      filtered = filtered.filter(c => c.timestamp <= toDate);
    }

    if (source) {
      filtered = filtered.filter(c => c.source === source);
    }

    if (minAmount !== null) {
      filtered = filtered.filter(c => c.originalAmount >= minAmount);
    }

    if (maxAmount !== null) {
      filtered = filtered.filter(c => c.originalAmount <= maxAmount);
    }

    // Return limited results
    return filtered.slice(0, limit);
  }

  /**
   * Get recent conversions (last 24 hours)
   */
  getRecentConversions(limit = 10) {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    return this.getHistory({
      limit,
      dateFrom: yesterday
    });
  }

  /**
   * Get today's conversions
   */
  getTodayConversions() {
    const today = new Date().toISOString().split('T')[0];
    return this.history.filter(c => c.date === today);
  }

  /**
   * Add conversion to favorites
   */
  async addToFavorites(fromCurrency, toCurrency, amount = null, label = null) {
    const favorite = {
      id: this.generateFavoriteId(),
      fromCurrency,
      toCurrency,
      amount: amount ? parseFloat(amount) : null,
      label: label || `${fromCurrency} → ${toCurrency}`,
      createdAt: Date.now(),
      usageCount: 0,
      lastUsed: null
    };

    // Check if already exists
    const existing = this.favorites.find(
      f =>
        f.fromCurrency === fromCurrency &&
        f.toCurrency === toCurrency &&
        f.amount === favorite.amount
    );

    if (existing) {
      throw new Error('This conversion is already in favorites');
    }

    // Add to favorites
    this.favorites.unshift(favorite);

    // Trim favorites if it exceeds max size
    if (this.favorites.length > this.MAX_FAVORITES) {
      this.favorites = this.favorites.slice(0, this.MAX_FAVORITES);
    }

    await this.saveFavorites();
    console.log('⭐ Added to favorites:', favorite);
    return favorite;
  }

  /**
   * Remove from favorites
   */
  async removeFromFavorites(favoriteId) {
    const index = this.favorites.findIndex(f => f.id === favoriteId);
    if (index === -1) {
      throw new Error('Favorite not found');
    }

    const removed = this.favorites.splice(index, 1)[0];
    await this.saveFavorites();
    console.log('🗑️ Removed from favorites:', removed);
    return removed;
  }

  /**
   * Get favorites with optional sorting
   */
  getFavorites(sortBy = 'createdAt') {
    const sorted = [...this.favorites];

    switch (sortBy) {
      case 'usageCount':
        sorted.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'lastUsed':
        sorted.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.label.localeCompare(b.label));
        break;
      default: // createdAt
        sorted.sort((a, b) => b.createdAt - a.createdAt);
    }

    return sorted;
  }

  /**
   * Update favorite usage when used
   */
  async updateFavoriteUsage(favoriteId) {
    const favorite = this.favorites.find(f => f.id === favoriteId);
    if (favorite) {
      favorite.usageCount++;
      favorite.lastUsed = Date.now();
      await this.saveFavorites();
    }
  }

  /**
   * Get conversion statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get popular currency pairs
   */
  getPopularPairs(limit = 10) {
    const pairs = Object.entries(this.stats.pairUsageCount)
      .map(([pair, count]) => {
        const [from, to] = pair.split('→');
        return { from, to, count, pair };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return pairs;
  }

  /**
   * Export conversion history
   */
  exportHistory(format = 'json') {
    const exportData = {
      history: this.history,
      favorites: this.favorites,
      stats: this.stats,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV();
      case 'json':
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }

  /**
   * Export to CSV format
   */
  exportToCSV() {
    const headers = [
      'Date',
      'Time',
      'From Currency',
      'To Currency',
      'Original Amount',
      'Converted Amount',
      'Exchange Rate',
      'Source',
      'Confidence',
      'Webpage'
    ];

    const rows = this.history.map(conversion => {
      const date = new Date(conversion.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        conversion.fromCurrency,
        conversion.toCurrency,
        conversion.originalAmount,
        conversion.convertedAmount,
        conversion.exchangeRate,
        conversion.source,
        conversion.confidence || '',
        conversion.webpage || ''
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Import conversion history
   */
  async importHistory(data, mergeMode = 'append') {
    try {
      const importData = typeof data === 'string' ? JSON.parse(data) : data;

      if (mergeMode === 'replace') {
        this.history = importData.history || [];
        this.favorites = importData.favorites || [];
        // Don't replace stats in replace mode, merge them instead
        this.mergeStats(importData.stats || {});
      } else {
        // append
        // Merge history (avoid duplicates by ID)
        const existingIds = new Set(this.history.map(h => h.id));
        const newHistory = (importData.history || []).filter(
          h => !existingIds.has(h.id)
        );
        this.history = [...this.history, ...newHistory];

        // Merge favorites (avoid duplicates)
        const existingFavIds = new Set(this.favorites.map(f => f.id));
        const newFavorites = (importData.favorites || []).filter(
          f => !existingFavIds.has(f.id)
        );
        this.favorites = [...this.favorites, ...newFavorites];

        // Merge stats
        this.mergeStats(importData.stats || {});
      }

      // Trim to limits
      if (this.history.length > this.MAX_HISTORY_ENTRIES) {
        this.history = this.history
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.MAX_HISTORY_ENTRIES);
      }

      if (this.favorites.length > this.MAX_FAVORITES) {
        this.favorites = this.favorites
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, this.MAX_FAVORITES);
      }

      // Save everything
      await this.saveHistory();
      await this.saveFavorites();
      await this.saveStats();

      console.log('📥 Successfully imported conversion history');
      return true;
    } catch (error) {
      console.error('❌ Failed to import conversion history:', error);
      throw error;
    }
  }

  /**
   * Clear all history data
   */
  async clearHistory(type = 'all') {
    switch (type) {
      case 'history':
        this.history = [];
        await this.saveHistory();
        break;
      case 'favorites':
        this.favorites = [];
        await this.saveFavorites();
        break;
      case 'stats':
        this.stats = this.getDefaultStats();
        await this.saveStats();
        break;
      case 'all':
      default:
        this.history = [];
        this.favorites = [];
        this.stats = this.getDefaultStats();
        await this.saveHistory();
        await this.saveFavorites();
        await this.saveStats();
    }

    console.log(`🗑️ Cleared ${type} data`);
  }

  // Private methods

  /**
   * Generate unique conversion ID
   */
  generateConversionId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique favorite ID
   */
  generateFavoriteId() {
    return `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update statistics with new conversion
   */
  updateStats(conversion) {
    const today = conversion.date;

    // Update basic stats
    this.stats.totalConversions++;
    this.stats.lastConversionDate = conversion.timestamp;
    this.stats.totalAmountConverted += conversion.originalAmount;
    this.stats.averageAmountConverted =
      this.stats.totalAmountConverted / this.stats.totalConversions;

    // Update currency usage count
    this.stats.currencyUsageCount[conversion.fromCurrency] =
      (this.stats.currencyUsageCount[conversion.fromCurrency] || 0) + 1;
    this.stats.currencyUsageCount[conversion.toCurrency] =
      (this.stats.currencyUsageCount[conversion.toCurrency] || 0) + 1;

    // Update pair usage count
    const pair = `${conversion.fromCurrency}→${conversion.toCurrency}`;
    this.stats.pairUsageCount[pair] =
      (this.stats.pairUsageCount[pair] || 0) + 1;

    // Update most used currencies and pairs
    this.updateMostUsed();

    // Update daily stats
    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = {
        count: 0,
        totalAmount: 0,
        currencies: new Set()
      };
    }
    this.stats.dailyStats[today].count++;
    this.stats.dailyStats[today].totalAmount += conversion.originalAmount;
    this.stats.dailyStats[today].currencies.add(conversion.fromCurrency);
    this.stats.dailyStats[today].currencies.add(conversion.toCurrency);

    // Update today's conversion count
    this.stats.todayConversions = this.stats.dailyStats[today].count;
  }

  /**
   * Update most used currencies and pairs
   */
  updateMostUsed() {
    // Most used from currency
    const fromCurrencies = Object.entries(this.stats.currencyUsageCount);
    if (fromCurrencies.length > 0) {
      this.stats.mostUsedFromCurrency = fromCurrencies.sort(
        ([, a], [, b]) => b - a
      )[0][0];
    }

    // Most used to currency
    const toCurrencies = Object.entries(this.stats.currencyUsageCount);
    if (toCurrencies.length > 0) {
      this.stats.mostUsedToCurrency = toCurrencies.sort(
        ([, a], [, b]) => b - a
      )[0][0];
    }

    // Most used pair
    const pairs = Object.entries(this.stats.pairUsageCount);
    if (pairs.length > 0) {
      this.stats.mostUsedPair = pairs.sort(([, a], [, b]) => b - a)[0][0];
    }
  }

  /**
   * Merge statistics from imported data
   */
  mergeStats(importedStats) {
    this.stats.totalConversions += importedStats.totalConversions || 0;
    this.stats.totalAmountConverted += importedStats.totalAmountConverted || 0;

    if (this.stats.totalConversions > 0) {
      this.stats.averageAmountConverted =
        this.stats.totalAmountConverted / this.stats.totalConversions;
    }

    // Merge currency usage counts
    for (const [currency, count] of Object.entries(
      importedStats.currencyUsageCount || {}
    )) {
      this.stats.currencyUsageCount[currency] =
        (this.stats.currencyUsageCount[currency] || 0) + count;
    }

    // Merge pair usage counts
    for (const [pair, count] of Object.entries(
      importedStats.pairUsageCount || {}
    )) {
      this.stats.pairUsageCount[pair] =
        (this.stats.pairUsageCount[pair] || 0) + count;
    }

    // Update most used items
    this.updateMostUsed();
  }

  /**
   * Load history from storage
   */
  async loadHistory() {
    try {
      let result;
      if (this.chromeApisAvailable) {
        result = await chrome.storage.local.get(this.STORAGE_KEYS.HISTORY);
        this.history = result[this.STORAGE_KEYS.HISTORY] || [];
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
        this.history = stored ? JSON.parse(stored) : [];
      }
      console.log(`📚 Loaded ${this.history.length} history entries`);
    } catch (error) {
      console.error('❌ Failed to load history:', error);
      this.history = [];
    }
  }

  /**
   * Save history to storage
   */
  async saveHistory() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.HISTORY]: this.history
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.HISTORY,
          JSON.stringify(this.history)
        );
      }
      console.log(`💾 Saved ${this.history.length} history entries`);
    } catch (error) {
      console.error('❌ Failed to save history:', error);
    }
  }

  /**
   * Load favorites from storage
   */
  async loadFavorites() {
    try {
      let result;
      if (this.chromeApisAvailable) {
        result = await chrome.storage.local.get(this.STORAGE_KEYS.FAVORITES);
        this.favorites = result[this.STORAGE_KEYS.FAVORITES] || [];
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.FAVORITES);
        this.favorites = stored ? JSON.parse(stored) : [];
      }
      console.log(`⭐ Loaded ${this.favorites.length} favorites`);
    } catch (error) {
      console.error('❌ Failed to load favorites:', error);
      this.favorites = [];
    }
  }

  /**
   * Save favorites to storage
   */
  async saveFavorites() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.FAVORITES]: this.favorites
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.FAVORITES,
          JSON.stringify(this.favorites)
        );
      }
      console.log(`💾 Saved ${this.favorites.length} favorites`);
    } catch (error) {
      console.error('❌ Failed to save favorites:', error);
    }
  }

  /**
   * Load stats from storage
   */
  async loadStats() {
    try {
      let result;
      if (this.chromeApisAvailable) {
        result = await chrome.storage.local.get(this.STORAGE_KEYS.STATS);
        this.stats = {
          ...this.getDefaultStats(),
          ...result[this.STORAGE_KEYS.STATS]
        };
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.STATS);
        this.stats = stored
          ? { ...this.getDefaultStats(), ...JSON.parse(stored) }
          : this.getDefaultStats();
      }

      // Update today's conversion count
      const today = new Date().toISOString().split('T')[0];
      this.stats.todayConversions = this.stats.dailyStats[today]?.count || 0;

      console.log('📊 Loaded conversion statistics');
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
      this.stats = this.getDefaultStats();
    }
  }

  /**
   * Save stats to storage
   */
  async saveStats() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.STATS]: this.stats
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.STATS,
          JSON.stringify(this.stats)
        );
      }
      console.log('💾 Saved conversion statistics');
    } catch (error) {
      console.error('❌ Failed to save stats:', error);
    }
  }
}

// Create and export singleton instance
export const conversionHistory = new ConversionHistory();
