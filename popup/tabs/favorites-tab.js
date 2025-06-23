/**
 * Favorites Tab - Handles favorite currency pairs functionality
 */

export class FavoritesTab {
  constructor() {
    this.initialized = false;
    this.conversionHistory = null;
  }

  /**
   * Initialize the favorites tab
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Import required modules
      const { ConversionHistory } = await import(
        '/utils/conversion-history.js'
      );
      this.conversionHistory = new ConversionHistory();

      // Setup event listeners
      this.setupEventListeners();

      this.initialized = true;
      console.log('✅ Favorites tab initialized');
    } catch (error) {
      console.error('❌ Failed to initialize favorites tab:', error);
      throw error;
    }
  }

  /**
   * Load content for the favorites tab
   */
  async loadContent() {
    try {
      console.log('📋 Loading favorites content...');

      // Load favorites data
      const favorites = await this.conversionHistory.getFavorites();

      // Display content
      this.displayFavoriteItems(favorites);
      this.setupFavoriteQuickConvert(favorites);

      console.log('📋 Favorites content loaded');
    } catch (error) {
      console.error('❌ Failed to load favorites content:', error);
      this.showError('Failed to load favorites');
    }
  }

  /**
   * Setup event listeners for favorites functionality
   */
  setupEventListeners() {
    // Add favorite form
    this.setupAddFavoriteForm();
  }

  /**
   * Setup add favorite form
   */
  setupAddFavoriteForm() {
    const addBtn = document.getElementById('addFavorite');
    const form = document.getElementById('addFavoriteForm');
    const saveBtn = document.getElementById('saveFavorite');
    const cancelBtn = document.getElementById('cancelFavorite');

    // Populate currency selectors
    const fromSelect = document.getElementById('favFromCurrency');
    const toSelect = document.getElementById('favToCurrency');

    if (fromSelect && toSelect) {
      this.populateCurrencySelector(fromSelect);
      this.populateCurrencySelector(toSelect);
    }

    addBtn?.addEventListener('click', () => {
      if (form) {
        form.classList.remove('hidden');
      }
    });

    cancelBtn?.addEventListener('click', () => {
      if (form) {
        form.classList.add('hidden');
      }
      this.clearFavoriteForm();
    });

    saveBtn?.addEventListener('click', async () => {
      await this.saveFavorite();
    });
  }

  /**
   * Populate a currency selector with options
   */
  async populateCurrencySelector(select) {
    try {
      // Import currency data
      const { getPopularCurrencies, getAllCurrencies } = await import(
        '/utils/currency-data.js'
      );

      const popularCurrencies = getPopularCurrencies();
      const allCurrencies = getAllCurrencies();

      select.innerHTML = '<option value="">Select currency...</option>';

      // Add popular currencies first
      const popularGroup = document.createElement('optgroup');
      popularGroup.label = 'Popular Currencies';
      popularCurrencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = `${currency.flag} ${currency.code} - ${currency.name}`;
        popularGroup.appendChild(option);
      });
      select.appendChild(popularGroup);

      // Add all other currencies
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = 'All Currencies';
      allCurrencies
        .filter(c => !c.popular)
        .forEach(currency => {
          const option = document.createElement('option');
          option.value = currency.code;
          option.textContent = `${currency.flag} ${currency.code} - ${currency.name}`;
          otherGroup.appendChild(option);
        });
      select.appendChild(otherGroup);
    } catch (error) {
      console.error('❌ Failed to populate currency selector:', error);
    }
  }

  /**
   * Display favorite items
   */
  displayFavoriteItems(favorites) {
    const favoritesList = document.getElementById('favoritesList');
    if (!favoritesList) {
      return;
    }

    if (!favorites || favorites.length === 0) {
      favoritesList.innerHTML = `
        <div class="favorites-empty-state">
          <div class="favorites-empty-icon">⭐</div>
          <div class="favorites-empty-title">No favorites added yet</div>
          <div class="favorites-empty-description">
            Click "Add" to save your frequently used currency conversions for quick access
          </div>
        </div>
      `;
      return;
    }

    favoritesList.innerHTML = favorites
      .map(fav => this.createFavoriteItemHTML(fav))
      .join('');

    // Add event listeners
    favoritesList.querySelectorAll('.favorite-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const favoriteId = btn.dataset.id;
        this.removeFavorite(favoriteId);
      });
    });

    favoritesList.querySelectorAll('.favorite-convert-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fromCurrency = btn.dataset.from;
        const toCurrency = btn.dataset.to;
        const amount = btn.dataset.amount;
        this.performQuickConvert(fromCurrency, toCurrency, amount);
      });
    });
  }

  /**
   * Create HTML for a favorite item
   */
  createFavoriteItemHTML(fav) {
    return `
      <div class="favorite-item" data-id="${fav.id}">
        <div class="favorite-item-header">
          <div class="favorite-pair">
            <span class="currency-from">${fav.fromCurrency}</span>
            <span class="arrow">→</span>
            <span class="currency-to">${fav.toCurrency}</span>
          </div>
          <div class="favorite-item-actions">
            <button 
              class="favorite-convert-btn"
              data-from="${fav.fromCurrency}"
              data-to="${fav.toCurrency}"
              data-amount="${fav.amount || ''}"
              title="Convert ${fav.fromCurrency} to ${fav.toCurrency}"
            >
              Convert
            </button>
            <button 
              class="favorite-remove-btn"
              data-id="${fav.id}"
              title="Remove from favorites"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="favorite-item-details">
          ${fav.amount ? `Default amount: ${this.formatAmount(fav.amount)} ${fav.fromCurrency}` : 'No default amount'}
          ${fav.label ? ` • ${fav.label}` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Setup quick convert buttons for favorites
   */
  setupFavoriteQuickConvert(favorites) {
    const container = document.getElementById('quickConvertButtons');
    if (!container) {
      return;
    }

    if (!favorites || favorites.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-gray-500">
          <p class="text-xs">No favorites available for quick convert</p>
          <p class="text-xs mt-1">Add some favorites first!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = favorites
      .map(
        fav => `
        <button 
          class="quick-convert-pair-btn"
          data-from="${fav.fromCurrency}"
          data-to="${fav.toCurrency}"
          title="Quick convert using ${fav.fromCurrency} to ${fav.toCurrency}"
        >
          <div class="flex justify-between items-center">
            <span>
              <span class="currency-from">${fav.fromCurrency}</span>
              <span class="arrow">→</span>
              <span class="currency-to">${fav.toCurrency}</span>
            </span>
            ${fav.label ? `<span class="text-xs text-gray-500">${fav.label}</span>` : ''}
          </div>
        </button>
      `
      )
      .join('');

    // Add event listeners
    container.querySelectorAll('.quick-convert-pair-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fromCurrency = btn.dataset.from;
        const toCurrency = btn.dataset.to;

        // Get the amount from the input field
        const amountInput = document.getElementById('quickConvertAmount');
        const amount = amountInput?.value;

        if (!amount || parseFloat(amount) <= 0) {
          this.showError('Please enter a valid amount first');
          amountInput?.focus();
          return;
        }

        this.performQuickConvert(fromCurrency, toCurrency, amount);
      });
    });
  }

  /**
   * Save a new favorite
   */
  async saveFavorite() {
    const fromCurrency = document.getElementById('favFromCurrency')?.value;
    const toCurrency = document.getElementById('favToCurrency')?.value;
    const amount = document.getElementById('favAmount')?.value;
    const label = document.getElementById('favLabel')?.value;

    if (!fromCurrency || !toCurrency) {
      this.showError('Please select both currencies');
      return;
    }

    if (fromCurrency === toCurrency) {
      this.showError('Source and target currencies cannot be the same');
      return;
    }

    try {
      await this.conversionHistory.addToFavorites(
        fromCurrency,
        toCurrency,
        amount,
        label
      );

      // Hide form and clear
      const form = document.getElementById('addFavoriteForm');
      if (form) {
        form.classList.add('hidden');
      }
      this.clearFavoriteForm();

      // Reload content
      await this.loadContent();

      this.showSuccess('Favorite added successfully');
    } catch (error) {
      console.error('❌ Failed to save favorite:', error);
      this.showError(`Failed to save favorite: ${error.message}`);
    }
  }

  /**
   * Clear the add favorite form
   */
  clearFavoriteForm() {
    const fromSelect = document.getElementById('favFromCurrency');
    const toSelect = document.getElementById('favToCurrency');
    const amountInput = document.getElementById('favAmount');
    const labelInput = document.getElementById('favLabel');

    if (fromSelect) fromSelect.value = '';
    if (toSelect) toSelect.value = '';
    if (amountInput) amountInput.value = '';
    if (labelInput) labelInput.value = '';
  }

  /**
   * Remove a favorite
   */
  async removeFavorite(favoriteId) {
    try {
      await this.conversionHistory.removeFromFavorites(favoriteId);
      await this.loadContent();
      this.showSuccess('Favorite removed successfully');
    } catch (error) {
      console.error('❌ Failed to remove favorite:', error);
      this.showError('Failed to remove favorite');
    }
  }

  /**
   * Perform a quick conversion
   */
  async performQuickConvert(fromCurrency, toCurrency, amount) {
    if (!amount) {
      // Check if there's an amount in the quick convert input
      const quickConvertAmount =
        document.getElementById('quickConvertAmount')?.value;
      if (quickConvertAmount) {
        amount = quickConvertAmount;
      } else {
        amount = prompt(`Enter amount in ${fromCurrency}:`);
        if (!amount) return;
      }
    }

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        this.showError('Please enter a valid amount');
        return;
      }

      // Show loading state
      this.showSuccess(
        `Converting ${numAmount} ${fromCurrency} to ${toCurrency}...`
      );

      // Import and use the API service
      const { ApiService } = await import('/utils/api-service.js');
      const apiService = new ApiService();

      // Perform the actual conversion
      const result = await apiService.convertCurrency(
        numAmount,
        fromCurrency,
        toCurrency
      );

      if (result && result.success) {
        // Show the conversion result
        this.showConversionResult(
          numAmount,
          fromCurrency,
          result.convertedAmount,
          toCurrency,
          result.rate
        );

        // Add to history
        const { ConversionHistory } = await import(
          '/utils/conversion-history.js'
        );
        const history = new ConversionHistory();
        await history.addConversion({
          fromCurrency,
          toCurrency,
          originalAmount: numAmount,
          convertedAmount: result.convertedAmount,
          rate: result.rate,
          source: result.source || 'favorites'
        });

        // Clear the quick convert input
        const quickConvertInput = document.getElementById('quickConvertAmount');
        if (quickConvertInput) {
          quickConvertInput.value = '';
        }
      } else {
        this.showError(result?.error || 'Conversion failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to perform quick convert:', error);
      this.showError(
        'Conversion failed. Please check your internet connection and try again.'
      );
    }
  }

  /**
   * Show conversion result with formatted display
   */
  showConversionResult(
    originalAmount,
    fromCurrency,
    convertedAmount,
    toCurrency,
    rate
  ) {
    // Import formatting utilities
    import('/utils/conversion-utils.js')
      .then(({ formatConvertedAmount, formatExchangeRate }) => {
        const formattedOriginal = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4
        }).format(originalAmount);

        const formattedConverted = formatConvertedAmount(
          convertedAmount,
          toCurrency
        );
        const formattedRate = formatExchangeRate(
          rate,
          fromCurrency,
          toCurrency
        );

        const resultMessage = `${formattedOriginal} ${fromCurrency} = ${formattedConverted}\n(${formattedRate})`;

        // Show success message with conversion result
        this.showStatusMessage(resultMessage, 'success', 5000);

        // Also show a more detailed result in a custom popup
        this.showConversionPopup(
          originalAmount,
          fromCurrency,
          convertedAmount,
          toCurrency,
          rate
        );
      })
      .catch(() => {
        // Fallback formatting
        const resultMessage = `${originalAmount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}\n(Rate: ${rate.toFixed(4)})`;
        this.showStatusMessage(resultMessage, 'success', 5000);
      });
  }

  /**
   * Show detailed conversion result in a popup
   */
  showConversionPopup(
    originalAmount,
    fromCurrency,
    convertedAmount,
    toCurrency,
    rate
  ) {
    // Create a temporary popup div
    const popup = document.createElement('div');
    popup.className =
      'conversion-result-popup fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-sm';
    popup.innerHTML = `
      <div class="conversion-result-content">
        <div class="conversion-result-title">Conversion Result</div>
        <div class="conversion-result-display">
          <div class="conversion-result-from">${originalAmount} ${fromCurrency}</div>
          <div class="conversion-result-equals">=</div>
          <div class="conversion-result-to">${convertedAmount.toFixed(2)} ${toCurrency}</div>
        </div>
        <div class="conversion-result-rate">
          Exchange Rate: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}
        </div>
        <button id="closeConversionPopup" class="conversion-result-close">
          Close
        </button>
      </div>
    `;

    // Add to document
    document.body.appendChild(popup);

    // Close button functionality
    document
      .getElementById('closeConversionPopup')
      .addEventListener('click', () => {
        document.body.removeChild(popup);
      });

    // Close on click outside
    popup.addEventListener('click', e => {
      if (e.target === popup) {
        document.body.removeChild(popup);
      }
    });

    // Auto-close after 15 seconds
    setTimeout(() => {
      if (document.body.contains(popup)) {
        document.body.removeChild(popup);
      }
    }, 15000);
  }

  /**
   * Format amount for display
   */
  formatAmount(amount) {
    if (!amount) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(parseFloat(amount));
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
    if (!statusDiv) {
      return;
    }

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
      case 'favoriteAdded':
        // Refresh favorites when new favorite is added from other tabs
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
