/**
 * History Tab - Handles conversion history functionality
 */

/* global Blob, URL */

export class HistoryTab {
  constructor() {
    this.initialized = false;
    this.conversionHistory = null;
  }

  /**
   * Initialize the history tab
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Import history manager dynamically
      const { ConversionHistory } = await import(
        '/utils/conversion-history.js'
      );
      this.conversionHistory = new ConversionHistory();

      // Setup event listeners
      this.setupEventListeners();

      this.initialized = true;
      console.log('✅ History tab initialized');
    } catch (error) {
      console.error('❌ Failed to initialize history tab:', error);
      throw error;
    }
  }

  /**
   * Load content for the history tab
   */
  async loadContent() {
    try {
      console.log('📋 Loading history content...');

      // Load history data
      const historyData = await this.conversionHistory.getHistory();
      const stats = await this.conversionHistory.getStats();
      const popularPairs = await this.conversionHistory.getPopularPairs();

      // Display content
      this.displayHistoryItems(historyData);
      this.updateHistoryStats(stats);
      this.displayPopularPairs(popularPairs);

      console.log('📋 History content loaded');
    } catch (error) {
      console.error('❌ Failed to load history content:', error);
      this.showError('Failed to load conversion history');
    }
  }

  /**
   * Setup event listeners for history functionality
   */
  setupEventListeners() {
    // History filter buttons
    this.setupHistoryFilters();

    // History management buttons
    this.setupHistoryManagement();
  }

  /**
   * Setup history filter buttons
   */
  setupHistoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        // Update active state
        filterButtons.forEach(b => b.classList.remove('filter-active'));
        btn.classList.add('filter-active');

        // Apply filter
        const filter = btn.id.replace('filter', '').toLowerCase();
        await this.applyHistoryFilter(filter);
      });
    });
  }

  /**
   * Setup history management buttons
   */
  setupHistoryManagement() {
    const exportBtn = document.getElementById('exportHistory');
    const clearBtn = document.getElementById('clearHistory');

    exportBtn?.addEventListener('click', this.exportHistory.bind(this));
    clearBtn?.addEventListener('click', this.clearHistory.bind(this));
  }

  /**
   * Display history items in the list
   */
  displayHistoryItems(historyItems) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    if (!historyItems || historyItems.length === 0) {
      historyList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <p>No conversion history found</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = historyItems
      .map(item => this.createHistoryItemHTML(item))
      .join('');

    // Add event listeners for favorite buttons
    historyList.querySelectorAll('.add-to-favorites-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fromCurrency = btn.dataset.from;
        const toCurrency = btn.dataset.to;
        this.addToFavoritesFromHistory(fromCurrency, toCurrency);
      });
    });
  }

  /**
   * Create HTML for a history item
   */
  createHistoryItemHTML(item) {
    return `
      <div class="history-item" data-id="${item.id}">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">
              ${this.formatAmount(item.fromAmount)} ${item.fromCurrency} → ${this.formatAmount(item.toAmount)} ${item.toCurrency}
            </div>
            <div class="text-xs text-gray-500">
              Rate: 1 ${item.fromCurrency} = ${this.formatAmount(item.rate)} ${item.toCurrency}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">
              ${this.formatTimestamp(item.timestamp)}
            </span>
            <button 
              class="add-to-favorites-btn text-gray-400 hover:text-yellow-500 transition-colors"
              data-from="${item.fromCurrency}"
              data-to="${item.toCurrency}"
              title="Add to favorites"
            >
              ⭐
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update history statistics display
   */
  updateHistoryStats(stats) {
    const totalElement = document.getElementById('totalConversions');
    const weekElement = document.getElementById('weekConversions');
    const countElement = document.getElementById('conversionCount');

    if (totalElement) totalElement.textContent = stats.total || 0;
    if (weekElement) weekElement.textContent = stats.thisWeek || 0;
    if (countElement) countElement.textContent = stats.total || 0;
  }

  /**
   * Display popular currency pairs
   */
  displayPopularPairs(popularPairs) {
    const container = document.getElementById('popularPairs');
    if (!container) return;

    if (!popularPairs || popularPairs.length === 0) {
      container.innerHTML =
        '<p class="text-xs text-gray-500">No popular pairs yet</p>';
      return;
    }

    container.innerHTML = popularPairs
      .slice(0, 3)
      .map(
        pair => `
        <div class="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
          <span>${pair.fromCurrency} → ${pair.toCurrency}</span>
          <span class="text-gray-500">${pair.count} times</span>
        </div>
      `
      )
      .join('');
  }

  /**
   * Apply history filter
   */
  async applyHistoryFilter(filter) {
    try {
      let filteredHistory;

      switch (filter) {
        case 'today':
          filteredHistory =
            await this.conversionHistory.getHistoryByDate('today');
          break;
        case 'week':
          filteredHistory =
            await this.conversionHistory.getHistoryByDate('week');
          break;
        case 'month':
          filteredHistory =
            await this.conversionHistory.getHistoryByDate('month');
          break;
        default:
          filteredHistory = await this.conversionHistory.getHistory();
      }

      this.displayHistoryItems(filteredHistory);
    } catch (error) {
      console.error('❌ Failed to apply history filter:', error);
    }
  }

  /**
   * Export conversion history
   */
  async exportHistory() {
    try {
      const history = await this.conversionHistory.getHistory();
      const blob = new Blob([JSON.stringify(history, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `conversion-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showSuccess('History exported successfully');
    } catch (error) {
      console.error('❌ Failed to export history:', error);
      this.showError('Failed to export history');
    }
  }

  /**
   * Clear conversion history
   */
  async clearHistory() {
    const confirmed = confirm(
      'Are you sure you want to clear all conversion history? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await this.conversionHistory.clearHistory();
      await this.loadContent();
      this.showSuccess('History cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear history:', error);
      this.showError('Failed to clear history');
    }
  }

  /**
   * Add currency pair to favorites from history
   */
  async addToFavoritesFromHistory(fromCurrency, toCurrency) {
    try {
      // This would interact with the favorites system
      // For now, just show a success message
      this.showSuccess(`Added ${fromCurrency} → ${toCurrency} to favorites`);

      // Emit event to notify other tabs
      this.emitGlobalEvent('favoriteAdded', { fromCurrency, toCurrency });
    } catch (error) {
      console.error('❌ Failed to add to favorites:', error);
      this.showError('Failed to add to favorites');
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(parseFloat(amount));
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showStatusMessage(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showStatusMessage(message, 'error');
  }

  /**
   * Show status message
   */
  showStatusMessage(message, type = 'success', duration = 3000) {
    const statusDiv = document.getElementById('statusMessage');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
    }`;

    statusDiv.classList.remove('hidden');

    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, duration);
  }

  /**
   * Emit global event to other tabs
   */
  emitGlobalEvent(eventType, data) {
    // This would be handled by the tab manager
    if (window.tabManager) {
      window.tabManager.handleGlobalEvent(eventType, data);
    }
  }

  /**
   * Handle global events from other tabs
   */
  handleGlobalEvent(eventType, _data) {
    switch (eventType) {
      case 'conversionAdded':
        // Refresh history when new conversion is added
        this.loadContent();
        break;
      case 'settingsChanged':
        // React to settings changes if needed
        break;
    }
  }

  /**
   * Refresh the tab content
   */
  async refresh() {
    await this.loadContent();
  }
}
