/**
 * History Tab - Handles conversion history functionality
 */

/* global Blob, URL */

export class HistoryTab {
  constructor() {
    this.initialized = false;
    this.conversionHistory = null;
    // Phase 9, Task 9.4: Add subscription manager for conversion tracking
    this.subscriptionManager = null;
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

      // Phase 9, Task 9.4: Initialize subscription manager for tracking
      const { getSubscriptionManager } = await import(
        '/utils/subscription-manager-v2.js'
      );
      this.subscriptionManager = await getSubscriptionManager();

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

      // Initialize history manager if not already done
      await this.conversionHistory.initialize();

      // Load history data
      const historyData = this.conversionHistory.getHistory({ limit: 50 });
      const stats = this.conversionHistory.getStats();
      const popularPairs = this.conversionHistory.getPopularPairs(5);

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

    // Add event listeners for action buttons
    historyList.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fromCurrency = btn.dataset.from;
        const toCurrency = btn.dataset.to;
        this.addToFavoritesFromHistory(fromCurrency, toCurrency);
      });
    });

    // Add event listeners for copy buttons
    historyList.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = btn.dataset.amount;
        const currency = btn.dataset.currency;
        this.copyToClipboard(`${amount} ${currency}`);
      });
    });

    // Phase 9, Task 9.4: Add event listeners for repeat conversion buttons
    historyList.querySelectorAll('.repeat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fromCurrency = btn.dataset.from;
        const toCurrency = btn.dataset.to;
        const amount = parseFloat(btn.dataset.amount);
        this.repeatConversion(fromCurrency, toCurrency, amount);
      });
    });
  }

  /**
   * Create HTML for a history item
   */
  createHistoryItemHTML(item) {
    // Get source icon
    const sourceIcon = this.getSourceIcon(item.source);

    return `
      <div class="history-item" data-id="${item.id}">
        <div class="history-item-left">
          <div class="conversion-summary">
            <span class="original-amount">
              ${this.formatAmount(item.originalAmount)} ${item.fromCurrency}
            </span>
            <span class="arrow">→</span>
            <span class="converted-amount">
              <strong>${this.formatAmount(item.convertedAmount)} ${item.toCurrency}</strong>
            </span>
          </div>
          <div class="rate-info">
            <span class="rate-text">Rate: 1 ${item.fromCurrency} = ${this.formatAmount(item.exchangeRate)} ${item.toCurrency}</span>
            ${sourceIcon}
          </div>
        </div>
        <div class="history-item-right">
          <div class="history-actions">
            <button 
              class="action-btn favorite-btn"
              data-from="${item.fromCurrency}"
              data-to="${item.toCurrency}"
              title="Add to favorites"
            >
              <span class="icon">⭐</span>
            </button>
            <button 
              class="action-btn copy-btn"
              data-amount="${item.convertedAmount}"
              data-currency="${item.toCurrency}"
              title="Copy result"
            >
              <span class="icon">📋</span>
            </button>
            <button 
              class="action-btn repeat-btn"
              data-from="${item.fromCurrency}"
              data-to="${item.toCurrency}"
              data-amount="${item.originalAmount}"
              title="Repeat this conversion"
            >
              <span class="icon">🔄</span>
            </button>
          </div>
          <div class="timestamp">
            ${this.formatTimestamp(item.timestamp)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get source icon for history item
   */
  getSourceIcon(source) {
    const icons = {
      'context-menu':
        '<span class="source-icon" title="Context Menu">🖱️</span>',
      manual: '<span class="source-icon" title="Manual Entry">✏️</span>',
      api: '<span class="source-icon" title="API Call">🔗</span>',
      popup: '<span class="source-icon" title="Popup">🎚️</span>'
    };
    return (
      icons[source] || '<span class="source-icon" title="Unknown">❓</span>'
    );
  }

  /**
   * Get confidence level badge
   */
  getConfidenceLevel(confidence) {
    if (!confidence) return '';

    if (confidence >= 0.9) {
      return '<span class="confidence-badge high" title="High Confidence">🟢</span>';
    } else if (confidence >= 0.7) {
      return '<span class="confidence-badge medium" title="Medium Confidence">🟡</span>';
    } else {
      return '<span class="confidence-badge low" title="Low Confidence">🔴</span>';
    }
  }

  /**
   * Update history statistics display
   */
  updateHistoryStats(stats) {
    const totalElement = document.getElementById('totalConversions');
    const weekElement = document.getElementById('weekConversions');
    const countElement = document.getElementById('conversionCount');

    // Calculate this week's conversions
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekCount = Object.entries(stats.dailyStats || {})
      .filter(([dateStr]) => {
        const date = new Date(dateStr);
        return date >= thisWeekStart;
      })
      .reduce((sum, [, dayStats]) => sum + (dayStats.count || 0), 0);

    if (totalElement) totalElement.textContent = stats.totalConversions || 0;
    if (weekElement) weekElement.textContent = thisWeekCount || 0;
    if (countElement) countElement.textContent = stats.totalConversions || 0;
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
          <span>${pair.from} → ${pair.to}</span>
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
          filteredHistory = this.conversionHistory.getTodayConversions();
          break;
        case 'week': {
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          filteredHistory = this.conversionHistory.getHistory({
            dateFrom: weekAgo,
            limit: 50
          });
          break;
        }
        case 'month': {
          const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          filteredHistory = this.conversionHistory.getHistory({
            dateFrom: monthAgo,
            limit: 50
          });
          break;
        }
        default: // 'all'
          filteredHistory = this.conversionHistory.getHistory({ limit: 50 });
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
      const historyData = this.conversionHistory.exportHistory();
      const blob = new Blob([historyData], {
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
      await this.conversionHistory.clearHistory('history');
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
      await this.conversionHistory.addToFavorites(fromCurrency, toCurrency);
      this.showSuccess(`Added ${fromCurrency} → ${toCurrency} to favorites`);

      // Emit event to notify other tabs
      this.emitGlobalEvent('favoriteAdded', { fromCurrency, toCurrency });
    } catch (error) {
      console.error('❌ Failed to add to favorites:', error);
      // Show specific error message if it's a duplicate
      const errorMessage = error.message.includes('already in favorites')
        ? `${fromCurrency} → ${toCurrency} is already in favorites`
        : 'Failed to add to favorites';
      this.showError(errorMessage);
    }
  }

  /**
   * Phase 9, Task 9.4: Repeat a conversion from history with tracking
   */
  async repeatConversion(fromCurrency, toCurrency, amount) {
    try {
      // Check subscription limits before performing repeat conversion
      if (this.subscriptionManager) {
        const canConvert = this.subscriptionManager.canPerformAction(
          'dailyConversions',
          1
        );
        if (!canConvert.allowed) {
          this.showError(
            `Cannot repeat conversion: ${canConvert.reason === 'limit_exceeded' ? 'daily limit reached' : 'feature not available'}`
          );
          return;
        }
      }

      this.showSuccess('Repeating conversion...');

      // Import API service dynamically
      const { exchangeRateService } = await import('/utils/api-service.js');

      // Get current exchange rate
      const rateData = await exchangeRateService.getExchangeRate(
        fromCurrency,
        toCurrency
      );

      if (!rateData || !rateData.rate) {
        throw new Error('Failed to get current exchange rate');
      }

      const convertedAmount = amount * rateData.rate;

      // Track the repeat conversion
      if (this.subscriptionManager) {
        await this.subscriptionManager.trackUsage('dailyConversions', 1);
        console.log('📊 Repeat conversion tracked for subscription');
      }

      // Add to conversion history
      await this.conversionHistory.addConversion({
        fromCurrency,
        toCurrency,
        originalAmount: amount,
        convertedAmount,
        exchangeRate: rateData.rate,
        timestamp: Date.now(),
        source: 'history-repeat',
        confidence: 1.0,
        webpage: null
      });

      // Show result
      this.showSuccess(
        `${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency} (Current rate: ${rateData.rate.toFixed(4)})`
      );

      // Refresh the history display to show the new conversion
      await this.loadContent();
    } catch (error) {
      console.error('❌ Repeat conversion failed:', error);
      this.showError(`Repeat conversion failed: ${error.message}`);
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
    // Create or get status container
    let statusContainer = document.getElementById('historyStatus');
    if (!statusContainer) {
      statusContainer = document.createElement('div');
      statusContainer.id = 'historyStatus';
      statusContainer.className = 'fixed top-4 right-4 z-50';
      document.body.appendChild(statusContainer);
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `px-4 py-2 rounded-lg text-white text-sm font-medium mb-2 transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    messageEl.textContent = message;

    // Add to container
    statusContainer.appendChild(messageEl);

    // Auto remove after duration
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
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

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      if (
        typeof window !== 'undefined' &&
        window.navigator &&
        window.navigator.clipboard &&
        window.isSecureContext
      ) {
        await window.navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      this.showSuccess(`Copied ${text} to clipboard`);
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      this.showError('Failed to copy to clipboard');
    }
  }
}
