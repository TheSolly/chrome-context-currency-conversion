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
        <div class="text-center py-8 text-gray-500">
          <p>No favorites added yet</p>
          <p class="text-xs mt-2">Click "Add Favorite" to get started</p>
        </div>
      `;
      return;
    }

    favoritesList.innerHTML = favorites
      .map(fav => this.createFavoriteItemHTML(fav))
      .join('');

    // Add event listeners
    favoritesList.querySelectorAll('.remove-favorite-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const favoriteId = btn.dataset.id;
        this.removeFavorite(favoriteId);
      });
    });

    favoritesList.querySelectorAll('.quick-convert-btn').forEach(btn => {
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
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">
              ${fav.fromCurrency} → ${fav.toCurrency}
              ${fav.amount ? ` (${this.formatAmount(fav.amount)})` : ''}
            </div>
            ${fav.label ? `<div class="text-xs text-gray-500">${fav.label}</div>` : ''}
          </div>
          <div class="flex items-center gap-2">
            <button 
              class="quick-convert-btn text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
              data-from="${fav.fromCurrency}"
              data-to="${fav.toCurrency}"
              data-amount="${fav.amount || ''}"
            >
              Convert
            </button>
            <button 
              class="remove-favorite-btn text-gray-400 hover:text-red-500 transition-colors"
              data-id="${fav.id}"
              title="Remove from favorites"
            >
              ✕
            </button>
          </div>
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
      container.innerHTML =
        '<p class="text-xs text-gray-500">No favorites available</p>';
      return;
    }

    container.innerHTML = favorites
      .map(
        fav => `
        <button 
          class="quick-convert-pair-btn w-full text-left text-xs p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          data-from="${fav.fromCurrency}"
          data-to="${fav.toCurrency}"
        >
          ${fav.fromCurrency} → ${fav.toCurrency}
          ${fav.label ? ` (${fav.label})` : ''}
        </button>
      `
      )
      .join('');

    // Add event listeners
    container.querySelectorAll('.quick-convert-pair-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fromCurrency = btn.dataset.from;
        const toCurrency = btn.dataset.to;
        this.performQuickConvert(fromCurrency, toCurrency);
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
      const favorite = {
        id: Date.now().toString(),
        fromCurrency,
        toCurrency,
        amount: amount || null,
        label: label || null,
        createdAt: new Date().toISOString()
      };

      await this.conversionHistory.addFavorite(favorite);

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
      this.showError('Failed to save favorite');
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
      await this.conversionHistory.removeFavorite(favoriteId);
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
      amount = prompt(`Enter amount in ${fromCurrency}:`);
      if (!amount) return;
    }

    try {
      // This would trigger a conversion
      this.showSuccess(
        `Converting ${amount} ${fromCurrency} to ${toCurrency}...`
      );

      // Emit event to notify other components
      this.emitGlobalEvent('conversionRequested', {
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount)
      });
    } catch (error) {
      console.error('❌ Failed to perform quick convert:', error);
      this.showError('Failed to perform conversion');
    }
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
