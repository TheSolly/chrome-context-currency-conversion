/**
 * Settings Tab - Handles all settings-related functionality
 * Phase 9, Task 9.1: Enhanced with security features
 */

/* global Blob, URL */

import {
  getPopularCurrencies,
  getAllCurrencies,
  getCurrencyByCode,
  DEFAULT_SETTINGS,
  getCurrencyStats,
  CurrencyPreferences
} from '/utils/currency-data.js';
import { settingsManager } from '/utils/settings-manager.js';
import { AdSettingsComponent } from './ad-settings-component.js';
// Phase 9, Task 9.1: Import security managers
import { securityManager } from '/utils/security-manager.js';
import { secureApiKeyManager } from '/utils/secure-api-key-manager.js';
// Phase 9, Task 9.2: Import privacy manager
import { privacyManager } from '/utils/privacy-manager.js';

export class SettingsTab {
  constructor() {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.currencyPreferences = new CurrencyPreferences();
    this.currencyStats = getCurrencyStats();
    this.pendingSettingsOperations = new Set();
    this.adSettingsComponent = new AdSettingsComponent();
    this.initialized = false;
  }

  /**
   * Initialize the settings tab
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load current settings
      this.currentSettings = await settingsManager.getSettings();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize ad settings component
      await this.adSettingsComponent.initialize();

      this.initialized = true;
      console.log('✅ Settings tab initialized');
    } catch (error) {
      console.error('❌ Failed to initialize settings tab:', error);
      throw error;
    }
  }

  /**
   * Load content for the settings tab
   */
  async loadContent() {
    try {
      // Ensure we have the latest settings
      this.currentSettings = await settingsManager.getSettings();

      // Update UI with current settings
      await this.updateUIWithCurrentSettings();

      // Update ad settings component visibility
      const adSettingsSection = document.getElementById('adSettingsSection');
      if (adSettingsSection) {
        adSettingsSection.style.display = this.adSettingsComponent.isVisible()
          ? 'block'
          : 'none';
      }

      console.log('📋 Settings content loaded');
    } catch (error) {
      console.error('❌ Failed to load settings content:', error);
    }
  }

  /**
   * Setup event listeners for settings controls
   */
  setupEventListeners() {
    // Currency selectors
    document
      .getElementById('baseCurrency')
      ?.addEventListener('change', this.handleCurrencyChange.bind(this));
    document
      .getElementById('secondaryCurrency')
      ?.addEventListener('change', this.handleCurrencyChange.bind(this));

    // Toggle switches
    this.setupToggleSwitch('showConfidence');
    this.setupToggleSwitch('autoConvert');
    this.setupToggleSwitch('showNotifications');

    // Precision selector
    document
      .getElementById('precision')
      ?.addEventListener('change', async event => {
        await this.updateSettingWithTracking(
          'precision',
          parseInt(event.target.value, 10)
        );
      });

    // Action buttons
    document
      .getElementById('saveSettings')
      ?.addEventListener('click', this.saveSettings.bind(this));
    document
      .getElementById('resetSettings')
      ?.addEventListener('click', this.resetSettings.bind(this));
    document
      .getElementById('addCurrency')
      ?.addEventListener('click', this.showAddCurrencyDialog.bind(this));

    // Enhanced Settings Management
    document
      .getElementById('exportSettings')
      ?.addEventListener('click', this.exportSettings.bind(this));
    document
      .getElementById('importSettings')
      ?.addEventListener('click', this.importSettings.bind(this));
    document
      .getElementById('settingsStats')
      ?.addEventListener('click', this.toggleSettingsStats.bind(this));
    document
      .getElementById('importFileInput')
      ?.addEventListener('change', this.handleImportFile.bind(this));

    // Phase 9, Task 9.1: Security-related event listeners
    document
      .getElementById('manageApiKeys')
      ?.addEventListener('click', this.showApiKeyManager.bind(this));
    document
      .getElementById('clearSecurityLogs')
      ?.addEventListener('click', this.clearSecurityLogs.bind(this));
    document
      .getElementById('exportSecurityData')
      ?.addEventListener('click', this.exportSecurityData.bind(this));

    // Phase 9, Task 9.2: Privacy-related event listeners
    document
      .getElementById('privacyMode')
      ?.addEventListener('change', this.togglePrivacyMode.bind(this));
    document
      .getElementById('updateConsent')
      ?.addEventListener('click', this.updateConsentPreferences.bind(this));
    document
      .getElementById('exportAllData')
      ?.addEventListener('click', this.exportAllData.bind(this));
    document
      .getElementById('exportDataCSV')
      ?.addEventListener('click', this.exportDataAsCSV.bind(this));
    document
      .getElementById('deleteSelectedData')
      ?.addEventListener('click', this.deleteSelectedData.bind(this));
    document
      .getElementById('deleteAllData')
      ?.addEventListener('click', this.deleteAllData.bind(this));
    document
      .getElementById('viewPrivacyPolicy')
      ?.addEventListener('click', this.viewPrivacyPolicy.bind(this));
    document
      .getElementById('showGdprRights')
      ?.addEventListener('click', this.showGdprRights.bind(this));
    document
      .getElementById('runDataCleanup')
      ?.addEventListener('click', this.runDataCleanup.bind(this));

    // Setup conversion testing
    this.setupConversionTestingCurrencies();

    // Phase 9, Task 9.1: Initialize security features
    this.initializeSecurityFeatures();
  }

  /**
   * Update settings with operation tracking
   */
  async updateSettingWithTracking(key, value) {
    const operationId = `${key}_${Date.now()}`;
    console.log(`🔄 Starting tracked operation: ${operationId}`);

    const operation = (async () => {
      try {
        await settingsManager.updateSetting(key, value);
        console.log(`✅ Setting updated: ${key} = ${value}`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to update setting ${key}:`, error);
        throw error;
      }
    })();

    this.pendingSettingsOperations.add(operation);

    try {
      await operation;
      return true;
    } finally {
      this.pendingSettingsOperations.delete(operation);
    }
  }

  /**
   * Handle currency selector changes
   */
  async handleCurrencyChange(event) {
    const { id, value } = event.target;
    console.log(`🔄 Currency change detected: ${id} = ${value}`);

    // Prevent selecting the same currency for both base and secondary
    if (
      id === 'baseCurrency' &&
      value === this.currentSettings.secondaryCurrency
    ) {
      this.showStatus(
        'Base and secondary currencies cannot be the same',
        'error'
      );
      event.target.value = this.currentSettings.baseCurrency;
      return;
    }

    if (
      id === 'secondaryCurrency' &&
      value === this.currentSettings.baseCurrency
    ) {
      this.showStatus(
        'Base and secondary currencies cannot be the same',
        'error'
      );
      event.target.value = this.currentSettings.secondaryCurrency;
      return;
    }

    // Update settings through SettingsManager with tracking
    await this.updateSettingWithTracking(id, value);
    this.currentSettings = await settingsManager.getSettings();

    // Add selected currency to favorites automatically (if not already there)
    if (
      value &&
      this.currencyPreferences.getFavorites().indexOf(value) === -1
    ) {
      await this.addToFavorites(value);
    }

    console.log(
      `✅ Settings updated, new secondaryCurrency: ${this.currentSettings.secondaryCurrency}`
    );
  }

  /**
   * Setup toggle switch functionality
   */
  setupToggleSwitch(elementId) {
    const toggle = document.getElementById(elementId);
    if (!toggle) return;

    toggle.addEventListener('click', async () => {
      const currentValue = this.currentSettings[elementId];
      const newValue = !currentValue;

      await this.updateSettingWithTracking(elementId, newValue);
      this.currentSettings = await settingsManager.getSettings();
      this.updateToggleState(toggle, newValue);
    });

    // Set initial state
    const initialValue = this.currentSettings[elementId];
    this.updateToggleState(toggle, initialValue);
  }

  /**
   * Update toggle visual state
   */
  updateToggleState(toggle, enabled) {
    const thumb = toggle.querySelector('.toggle-thumb');

    if (enabled) {
      toggle.classList.add('bg-primary-600');
      toggle.classList.remove('bg-gray-200');
      if (thumb) {
        thumb.classList.add('translate-x-5');
        thumb.classList.remove('translate-x-0');
      }
    } else {
      toggle.classList.remove('bg-primary-600');
      toggle.classList.add('bg-gray-200');
      if (thumb) {
        thumb.classList.remove('translate-x-5');
        thumb.classList.add('translate-x-0');
      }
    }
  }

  /**
   * Populate currency selectors
   */
  populateCurrencySelectors() {
    const popularCurrencies = getPopularCurrencies();
    const allCurrencies = getAllCurrencies();

    // Populate base currency selector
    const baseCurrencySelect = document.getElementById('baseCurrency');
    if (!baseCurrencySelect) return;

    baseCurrencySelect.innerHTML = '';

    // Add popular currencies first
    const popularGroup = document.createElement('optgroup');
    popularGroup.label = 'Popular Currencies';
    popularCurrencies.forEach(currency => {
      const option = document.createElement('option');
      option.value = currency.code;
      option.textContent = `${currency.flag} ${currency.code} - ${currency.name}`;
      popularGroup.appendChild(option);
    });
    baseCurrencySelect.appendChild(popularGroup);

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
    baseCurrencySelect.appendChild(otherGroup);

    // Clone for secondary currency
    const secondaryCurrencySelect =
      document.getElementById('secondaryCurrency');
    if (secondaryCurrencySelect) {
      secondaryCurrencySelect.innerHTML = baseCurrencySelect.innerHTML;
    }

    // Set current values
    baseCurrencySelect.value = this.currentSettings.baseCurrency;
    if (secondaryCurrencySelect) {
      secondaryCurrencySelect.value = this.currentSettings.secondaryCurrency;
    }
  }

  /**
   * Populate additional currencies display
   */
  populateAdditionalCurrencies() {
    const container = document.getElementById('additionalCurrencies');
    if (!container) return;

    container.innerHTML = '';

    this.currentSettings.additionalCurrencies.forEach((currencyCode, index) => {
      const currency = getCurrencyByCode(currencyCode);
      if (currency) {
        const item = this.createCurrencyItem(currency, index);
        container.appendChild(item);
      }
    });
  }

  /**
   * Create currency item element
   */
  createCurrencyItem(currency, index) {
    const item = document.createElement('div');
    item.className =
      'flex items-center justify-between p-2 bg-gray-50 rounded-lg';

    item.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-sm">${currency.flag}</span>
        <span class="text-sm font-medium">${currency.code}</span>
        <span class="text-xs text-gray-500">${currency.name}</span>
      </div>
      <button class="remove-currency text-gray-400 hover:text-red-500 transition-colors" data-index="${index}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;

    // Add remove functionality
    item
      .querySelector('.remove-currency')
      .addEventListener('click', async () => {
        await this.removeCurrency(index);
      });

    return item;
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      await settingsManager.saveSettings(this.currentSettings);
      this.showStatus('Settings saved successfully!', 'success');
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await settingsManager.resetToDefaults();
        this.currentSettings = await settingsManager.getSettings();
        await this.updateUIWithCurrentSettings();
        this.showStatus('Settings reset to defaults', 'success');
      } catch (error) {
        console.error('❌ Failed to reset settings:', error);
        this.showStatus('Failed to reset settings', 'error');
      }
    }
  }

  /**
   * Show add currency dialog
   */
  showAddCurrencyDialog() {
    const availableCurrencies = getAllCurrencies().filter(
      currency =>
        !this.currentSettings.additionalCurrencies.includes(currency.code) &&
        currency.code !== this.currentSettings.baseCurrency &&
        currency.code !== this.currentSettings.secondaryCurrency
    );

    if (availableCurrencies.length === 0) {
      this.showStatus('All currencies are already added', 'info');
      return;
    }

    const currencyCode = prompt('Enter currency code (e.g., GBP):');
    if (currencyCode) {
      this.addCurrency(currencyCode.toUpperCase());
    }
  }

  /**
   * Add currency to additional currencies
   */
  async addCurrency(currencyCode) {
    const currency = getCurrencyByCode(currencyCode);
    if (!currency) {
      this.showStatus('Invalid currency code', 'error');
      return;
    }

    if (this.currentSettings.additionalCurrencies.includes(currencyCode)) {
      this.showStatus('Currency already added', 'error');
      return;
    }

    const newAdditionalCurrencies = [
      ...this.currentSettings.additionalCurrencies,
      currencyCode
    ];
    await this.updateSettingWithTracking(
      'additionalCurrencies',
      newAdditionalCurrencies
    );
    this.currentSettings = await settingsManager.getSettings();
    this.populateAdditionalCurrencies();
    this.showStatus(`Added ${currencyCode} successfully`, 'success');
  }

  /**
   * Remove currency from additional currencies
   */
  async removeCurrency(index) {
    const newAdditionalCurrencies = [
      ...this.currentSettings.additionalCurrencies
    ];
    const removedCurrency = newAdditionalCurrencies.splice(index, 1)[0];
    await this.updateSettingWithTracking(
      'additionalCurrencies',
      newAdditionalCurrencies
    );
    this.currentSettings = await settingsManager.getSettings();
    this.populateAdditionalCurrencies();
    this.showStatus(`Removed ${removedCurrency} successfully`, 'success');
  }

  /**
   * Export settings
   */
  async exportSettings() {
    try {
      const settings = await settingsManager.exportSettings();
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `currency-converter-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showStatus('Settings exported successfully', 'success');
    } catch (error) {
      console.error('❌ Failed to export settings:', error);
      this.showStatus('Failed to export settings', 'error');
    }
  }

  /**
   * Import settings
   */
  importSettings() {
    const input = document.getElementById('importFileInput');
    if (input) {
      input.click();
    }
  }

  /**
   * Handle import file selection
   */
  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);

      await settingsManager.importSettings(importedSettings);
      this.currentSettings = await settingsManager.getSettings();
      await this.updateUIWithCurrentSettings();

      this.showStatus('Settings imported successfully', 'success');
    } catch (error) {
      console.error('❌ Failed to import settings:', error);
      this.showStatus('Failed to import settings', 'error');
    }

    // Reset file input
    event.target.value = '';
  }

  /**
   * Toggle settings stats panel
   */
  async toggleSettingsStats() {
    const panel = document.getElementById('settingsStatsPanel');
    if (!panel) return;

    const isHidden = panel.classList.contains('hidden');

    if (isHidden) {
      this.updateCurrencyStats();
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  }

  /**
   * Update currency stats display
   */
  updateCurrencyStats() {
    const stats = getCurrencyStats();
    const favoritesCount = this.currencyPreferences.getFavorites().length;

    const totalElement = document.getElementById('totalCurrencies');
    const popularElement = document.getElementById('popularCurrencies');
    const regionsElement = document.getElementById('totalRegions');
    const favoriteElement = document.getElementById('favoriteCount');

    if (totalElement) totalElement.textContent = stats.total;
    if (popularElement) popularElement.textContent = stats.popular;
    if (regionsElement) regionsElement.textContent = stats.regions;
    if (favoriteElement) favoriteElement.textContent = favoritesCount;
  }

  /**
   * Setup conversion testing currencies
   */
  setupConversionTestingCurrencies() {
    const popularCurrencies = getPopularCurrencies();
    const allCurrencies = getAllCurrencies();

    const fromSelect = document.getElementById('testFromCurrency');
    const toSelect = document.getElementById('testToCurrency');

    if (!fromSelect || !toSelect) return;

    [fromSelect, toSelect].forEach(select => {
      select.innerHTML = '';

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
    });

    // Set default values
    fromSelect.value = this.currentSettings.baseCurrency || 'USD';
    toSelect.value = this.currentSettings.secondaryCurrency || 'EUR';
  }

  /**
   * Update UI with current settings
   */
  async updateUIWithCurrentSettings() {
    // Update currency selectors
    this.populateCurrencySelectors();
    this.populateAdditionalCurrencies();

    // Update toggles and selects
    Object.keys(this.currentSettings).forEach(key => {
      const element = document.getElementById(key);
      if (!element) return;

      if (element.type === 'checkbox') {
        element.checked = this.currentSettings[key];
      } else if (element.classList?.contains('toggle')) {
        this.updateToggleState(element, this.currentSettings[key]);
      } else if (element.tagName === 'SELECT') {
        element.value = this.currentSettings[key];
      }
    });
  }

  /**
   * Add currency to favorites
   */
  async addToFavorites(currencyCode) {
    try {
      this.currencyPreferences.addToFavorites(currencyCode);
      await this.currencyPreferences.save();
      console.log(`✅ Added ${currencyCode} to favorites`);
    } catch (error) {
      console.error(`❌ Failed to add ${currencyCode} to favorites:`, error);
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) return;

    // Update message and styling
    statusElement.textContent = message;
    statusElement.className =
      'fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';

    if (type === 'success') {
      statusElement.classList.add('bg-green-500', 'text-white');
    } else if (type === 'error') {
      statusElement.classList.add('bg-red-500', 'text-white');
    } else {
      statusElement.classList.add('bg-blue-500', 'text-white');
    }

    // Show and hide
    statusElement.classList.remove('hidden');
    setTimeout(() => {
      statusElement.classList.add('hidden');
    }, 3000);
  }

  /**
   * Update settings (called from external components)
   */
  async updateSettings(newSettings) {
    this.currentSettings = { ...this.currentSettings, ...newSettings };
    await this.saveSettings();
    await this.render();
  }

  // Phase 9, Task 9.1: Security Methods

  /**
   * Initialize security features
   */
  async initializeSecurityFeatures() {
    try {
      await this.updateSecurityStats();
      await this.updateApiKeyStatus();
      await this.updateRateLimitStatus();
      console.log('✅ Security features initialized');
    } catch (error) {
      console.error('❌ Failed to initialize security features:', error);
    }
  }

  /**
   * Update security statistics display
   */
  async updateSecurityStats() {
    try {
      // Get API key count
      const providerStatus = await secureApiKeyManager.getProviderStatus();
      const encryptedKeyCount = Object.values(providerStatus).filter(
        status => status.hasKey
      ).length;

      // Get security events count
      const securityLogs = await chrome.storage.local.get('securityLogs');
      const eventsCount = securityLogs.securityLogs?.length || 0;

      // Update UI
      const encryptedCountEl = document.getElementById('encryptedDataCount');
      if (encryptedCountEl) {
        encryptedCountEl.textContent = encryptedKeyCount;
      }

      const eventsCountEl = document.getElementById('securityEventsCount');
      if (eventsCountEl) {
        eventsCountEl.textContent = eventsCount;
      }

      // Update security status
      const statusEl = document.getElementById('securityStatus');
      if (statusEl) {
        if (encryptedKeyCount > 0 && eventsCount < 10) {
          statusEl.textContent = 'Secure';
          statusEl.className = 'text-xs text-green-600 font-medium';
        } else if (eventsCount >= 10) {
          statusEl.textContent = 'Check Logs';
          statusEl.className = 'text-xs text-yellow-600 font-medium';
        } else {
          statusEl.textContent = 'Basic';
          statusEl.className = 'text-xs text-blue-600 font-medium';
        }
      }
    } catch (error) {
      console.error('Failed to update security stats:', error);
    }
  }

  /**
   * Update API key status display
   */
  async updateApiKeyStatus() {
    try {
      const providerStatus = await secureApiKeyManager.getProviderStatus();
      const statusContainer = document.getElementById('apiKeyStatus');

      if (!statusContainer) return;

      statusContainer.innerHTML = '';

      for (const [provider, status] of Object.entries(providerStatus)) {
        const statusEl = document.createElement('div');
        statusEl.className = 'flex items-center justify-between text-xs';
        const providerName = provider.toLowerCase().replace('_', ' ');
        const statusIcon = status.hasKey ? '✅' : '❌';
        const maskedKey = status.hasKey
          ? await secureApiKeyManager.getMaskedApiKey(provider)
          : 'Not configured';

        statusEl.innerHTML = `
          <span>${statusIcon} ${providerName}</span>
          <span class="text-gray-500 font-mono">${maskedKey || 'None'}</span>
        `;

        statusContainer.appendChild(statusEl);
      }
    } catch (error) {
      console.error('Failed to update API key status:', error);
    }
  }

  /**
   * Update rate limiting status
   */
  async updateRateLimitStatus() {
    try {
      const apiCallsLimit = securityManager.checkRateLimit('API_CALLS');
      const settingsLimit = securityManager.checkRateLimit('SETTINGS_UPDATES');

      const apiCallsEl = document.getElementById('apiCallsRemaining');
      if (apiCallsEl) {
        apiCallsEl.textContent = `${apiCallsLimit.remaining || 0}/100`;
      }

      const settingsEl = document.getElementById('settingsUpdatesRemaining');
      if (settingsEl) {
        settingsEl.textContent = `${settingsLimit.remaining || 0}/20`;
      }
    } catch (error) {
      console.error('Failed to update rate limit status:', error);
    }
  }

  /**
   * Show API key manager dialog
   */
  async showApiKeyManager() {
    try {
      const providers = await secureApiKeyManager.getProviderStatus();

      let dialogContent = `
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">API Key Management</h3>
          <div class="space-y-3">
      `;

      for (const [provider, status] of Object.entries(providers)) {
        const providerName = provider.toLowerCase().replace('_', ' ');
        const maskedKey = status.hasKey
          ? await secureApiKeyManager.getMaskedApiKey(provider)
          : 'Not configured';

        dialogContent += `
          <div class="border p-3 rounded">
            <div class="flex justify-between items-center mb-2">
              <strong>${providerName}</strong>
              <span class="text-xs ${status.hasKey ? 'text-green-600' : 'text-red-600'}">
                ${status.hasKey ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div class="text-xs text-gray-600 mb-2">${status.description}</div>
            <div class="text-xs font-mono bg-gray-100 p-1 rounded">${maskedKey}</div>
            <div class="mt-2 space-x-2">
              <button onclick="this.editApiKey('${provider}')" class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                ${status.hasKey ? 'Update' : 'Add'} Key
              </button>
              ${
                status.hasKey
                  ? `
                <button onclick="this.removeApiKey('${provider}')" class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                  Remove
                </button>
                <button onclick="this.testApiKey('${provider}')" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  Test
                </button>
              `
                  : ''
              }
            </div>
          </div>
        `;
      }

      dialogContent += `
          </div>
          <div class="flex justify-end space-x-2">
            <button onclick="this.closeDialog()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded">
              Close
            </button>
          </div>
        </div>
      `;

      this.showDialog(dialogContent);
    } catch (error) {
      console.error('Failed to show API key manager:', error);
      this.showStatus('Failed to load API key manager', 'error');
    }
  }

  /**
   * Clear security logs
   */
  async clearSecurityLogs() {
    try {
      await chrome.storage.local.remove('securityLogs');
      securityManager.logSecurityEvent('security_logs_cleared');
      await this.updateSecurityStats();
      this.showStatus('Security logs cleared', 'success');
    } catch (error) {
      console.error('Failed to clear security logs:', error);
      this.showStatus('Failed to clear security logs', 'error');
    }
  }

  /**
   * Export security data
   */
  async exportSecurityData() {
    try {
      const securityLogs = await chrome.storage.local.get('securityLogs');
      const providerStatus = await secureApiKeyManager.getProviderStatus();

      const securityData = {
        exportDate: new Date().toISOString(),
        providerStatus: Object.fromEntries(
          Object.entries(providerStatus).map(([provider, status]) => [
            provider,
            { hasKey: status.hasKey, description: status.description }
          ])
        ),
        securityEvents: securityLogs.securityLogs || [],
        rateLimitStatus: {
          apiCalls: securityManager.checkRateLimit('API_CALLS'),
          settingsUpdates: securityManager.checkRateLimit('SETTINGS_UPDATES')
        }
      };

      const blob = new Blob([JSON.stringify(securityData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `currency-converter-security-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.showStatus('Security data exported', 'success');
    } catch (error) {
      console.error('Failed to export security data:', error);
      this.showStatus('Failed to export security data', 'error');
    }
  }

  /**
   * Show dialog utility method
   */
  showDialog(content) {
    // Simple dialog implementation - you might want to enhance this
    const dialog = document.createElement('div');
    dialog.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        ${content}
      </div>
    `;

    document.body.appendChild(dialog);

    // Store reference for removal
    this.currentDialog = dialog;
  }

  /**
   * Close dialog utility method
   */
  closeDialog() {
    if (this.currentDialog) {
      this.currentDialog.remove();
      this.currentDialog = null;
    }
  }

  // ======================
  // PHASE 9, TASK 9.2: PRIVACY COMPLIANCE METHODS
  // ======================

  /**
   * Toggle privacy mode
   */
  async togglePrivacyMode(event) {
    try {
      const enabled = event.target.checked;

      if (enabled) {
        // Enable privacy mode - minimize data collection
        await privacyManager.minimizeDataCollection();
        this.showStatus(
          'Privacy mode enabled - data collection minimized',
          'success'
        );
      } else {
        // Disable privacy mode - restore default settings
        await privacyManager.loadPrivacySettings();
        this.showStatus('Privacy mode disabled', 'success');
      }

      // Update privacy dashboard
      await this.updatePrivacyDashboard();
    } catch (error) {
      console.error('Failed to toggle privacy mode:', error);
      this.showStatus('Failed to update privacy mode', 'error');
    }
  }

  /**
   * View privacy policy
   */
  async viewPrivacyPolicy() {
    try {
      const privacyPolicyContent = await this.getPrivacyPolicyContent();

      this.showDialog(`
        <div class="privacy-policy-dialog">
          <h3 class="text-lg font-semibold mb-4 text-gray-800">Privacy Policy</h3>
          <div class="privacy-policy-content max-h-96 overflow-y-auto text-sm text-gray-600 mb-4">
            ${privacyPolicyContent}
          </div>
          <div class="flex justify-end gap-2">
            <button onclick="this.closest('.fixed').remove()" 
                    class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Close
            </button>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Failed to load privacy policy:', error);
      this.showStatus('Failed to load privacy policy', 'error');
    }
  }

  /**
   * Get privacy policy content (summary for dialog)
   */
  async getPrivacyPolicyContent() {
    return `
      <h4 class="font-semibold mb-2">Data We Collect</h4>
      <ul class="list-disc pl-4 mb-4">
        <li>Currency preferences and settings</li>
        <li>Conversion history (optional, user controlled)</li>
        <li>Usage analytics (optional, with consent)</li>
        <li>Error logs (essential, automatically deleted after 7 days)</li>
      </ul>
      
      <h4 class="font-semibold mb-2">Your Rights (GDPR Compliance)</h4>
      <ul class="list-disc pl-4 mb-4">
        <li><strong>Right to Access:</strong> Export all your data</li>
        <li><strong>Right to Erasure:</strong> Delete your data</li>
        <li><strong>Right to Rectification:</strong> Modify your data</li>
        <li><strong>Right to Portability:</strong> Export in multiple formats</li>
        <li><strong>Right to Object:</strong> Opt out of data collection</li>
      </ul>
      
      <h4 class="font-semibold mb-2">Data Security</h4>
      <ul class="list-disc pl-4 mb-4">
        <li>All data stored locally on your device</li>
        <li>API keys encrypted with industry-standard encryption</li>
        <li>No personal data shared with third parties</li>
        <li>Automatic data cleanup based on retention periods</li>
      </ul>
      
      <p class="text-xs text-gray-500 mt-4">
        For the complete privacy policy, visit the extension settings → Privacy & Data section.
      </p>
    `;
  }

  /**
   * Update privacy dashboard with current status
   */
  async updatePrivacyDashboard() {
    try {
      const dashboard = await privacyManager.getPrivacyDashboard();

      // Update consent status
      const consentStatus = document.getElementById('consentStatus');
      if (consentStatus) {
        consentStatus.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full ${dashboard.consentStatus.given ? 'bg-green-500' : 'bg-red-500'}"></span>
            <span class="text-sm">
              ${dashboard.consentStatus.given ? 'Consent Given' : 'Consent Required'}
              ${dashboard.consentStatus.date ? `(${new Date(dashboard.consentStatus.date).toLocaleDateString()})` : ''}
            </span>
          </div>
        `;
      }

      // Update data categories count
      const dataCategoriesCount = document.getElementById(
        'dataCategoriesCount'
      );
      if (dataCategoriesCount) {
        const totalData = Object.values(dashboard.dataCategories).reduce(
          (sum, count) => sum + count,
          0
        );
        dataCategoriesCount.textContent = totalData;
      }

      // Update retention status
      const retentionInfo = document.getElementById('retentionInfo');
      if (retentionInfo) {
        retentionInfo.innerHTML = `
          <div class="text-xs text-gray-600">
            <div>History: ${dashboard.retentionStatus.conversionHistory} days</div>
            <div>Analytics: ${dashboard.retentionStatus.usageAnalytics} days</div>
            <div>Logs: ${dashboard.retentionStatus.errorLogs} days</div>
          </div>
        `;
      }

      // Update recent privacy activity
      const recentActivity = document.getElementById('recentPrivacyActivity');
      if (recentActivity && dashboard.recentActivity) {
        recentActivity.innerHTML = dashboard.recentActivity
          .slice(0, 3)
          .map(
            activity => `
            <div class="text-xs text-gray-500 mb-1">
              ${activity.action} - ${new Date(activity.timestamp).toLocaleString()}
            </div>
          `
          )
          .join('');
      }
    } catch (error) {
      console.error('Failed to update privacy dashboard:', error);
    }
  }

  /**
   * Handle data export request
   */
  async exportAllData() {
    try {
      this.showStatus('Exporting data...', 'info');

      // Export data using privacy manager
      const exportData = await privacyManager.exportUserData(null, 'json');

      // Create download
      const blob = new Blob([exportData], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `currency-converter-data-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.showStatus('Data exported successfully', 'success');
      await this.updatePrivacyDashboard();
    } catch (error) {
      console.error('Failed to export data:', error);
      this.showStatus('Failed to export data', 'error');
    }
  }

  /**
   * Handle data export in CSV format
   */
  async exportDataAsCSV() {
    try {
      this.showStatus('Exporting data as CSV...', 'info');

      const exportData = await privacyManager.exportUserData(null, 'csv');

      const blob = new Blob([exportData], {
        type: 'text/csv'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `currency-converter-data-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      this.showStatus('CSV data exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export CSV data:', error);
      this.showStatus('Failed to export CSV data', 'error');
    }
  }

  /**
   * Handle selective data deletion
   */
  async deleteSelectedData() {
    try {
      const dataTypes = [];

      // Check which data types user wants to delete
      if (document.getElementById('deleteHistory')?.checked) {
        dataTypes.push('conversionHistory');
      }
      if (document.getElementById('deleteFavorites')?.checked) {
        dataTypes.push('favorites');
      }
      if (document.getElementById('deleteSettings')?.checked) {
        dataTypes.push('settings');
      }
      if (document.getElementById('deleteAnalytics')?.checked) {
        dataTypes.push('usageStatistics');
      }

      if (dataTypes.length === 0) {
        this.showStatus('Please select data types to delete', 'warning');
        return;
      }

      // Confirm deletion
      if (
        !confirm(
          `Are you sure you want to delete the selected data types? This action cannot be undone.\n\nData types to delete:\n${dataTypes.join(', ')}`
        )
      ) {
        return;
      }

      this.showStatus('Deleting selected data...', 'info');

      // Delete data using privacy manager
      const deletionResult = await privacyManager.deleteUserData(
        dataTypes,
        true
      );

      // Show results
      const successCount = Object.values(deletionResult).filter(
        result => result.success
      ).length;
      const totalCount = Object.keys(deletionResult).length;

      if (successCount === totalCount) {
        this.showStatus(
          `Successfully deleted ${successCount} data types`,
          'success'
        );
      } else {
        this.showStatus(
          `Deleted ${successCount}/${totalCount} data types (some failed)`,
          'warning'
        );
      }

      // Update dashboard and reload content
      await this.updatePrivacyDashboard();
      await this.loadContent();
    } catch (error) {
      console.error('Failed to delete selected data:', error);
      this.showStatus('Failed to delete selected data', 'error');
    }
  }

  /**
   * Handle complete data deletion (Right to be Forgotten)
   */
  async deleteAllData() {
    try {
      // Show warning dialog
      const confirmed = confirm(
        '⚠️ DELETE ALL DATA WARNING ⚠️\n\n' +
          'This will permanently delete ALL your data including:\n' +
          '• All settings and preferences\n' +
          '• Conversion history and favorites\n' +
          '• Usage analytics and logs\n' +
          '• API keys and security data\n\n' +
          'This action CANNOT be undone!\n\n' +
          'Are you absolutely sure you want to proceed?'
      );

      if (!confirmed) {
        return;
      }

      // Second confirmation
      const finalConfirm = confirm(
        'FINAL CONFIRMATION\n\n' +
          'Type "DELETE ALL" in the next dialog to confirm complete data deletion.'
      );

      if (!finalConfirm) {
        return;
      }

      const userInput = prompt('Type "DELETE ALL" to confirm:');
      if (userInput !== 'DELETE ALL') {
        this.showStatus(
          'Data deletion cancelled - incorrect confirmation',
          'info'
        );
        return;
      }

      this.showStatus('Deleting all data...', 'info');

      // Delete all data using privacy manager
      await privacyManager.deleteUserData(
        Object.values(privacyManager.DATA_TYPES),
        true
      );

      // Also clear extension storage
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();

      this.showStatus('All data deleted successfully', 'success');

      // Show completion message
      setTimeout(() => {
        /* global alert */
        alert(
          '✅ All data has been permanently deleted.\n\nThe extension will reload with default settings.'
        );
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Failed to delete all data:', error);
      this.showStatus('Failed to delete all data', 'error');
    }
  }

  /**
   * Update consent preferences
   */
  async updateConsentPreferences() {
    try {
      const preferences = {
        analytics:
          document.getElementById('consentAnalytics')?.checked || false,
        personalization:
          document.getElementById('consentPersonalization')?.checked || false,
        marketing: document.getElementById('consentMarketing')?.checked || false
      };

      await privacyManager.updateConsentPreferences(preferences);

      this.showStatus('Consent preferences updated', 'success');
      await this.updatePrivacyDashboard();
    } catch (error) {
      console.error('Failed to update consent preferences:', error);
      this.showStatus('Failed to update consent preferences', 'error');
    }
  }

  /**
   * Run data retention cleanup
   */
  async runDataCleanup() {
    try {
      this.showStatus('Running data cleanup...', 'info');

      const cleanupResult = await privacyManager.enforceDataRetention();

      if (cleanupResult) {
        const deletedCount = cleanupResult.deletedData.length;
        const retainedCount = cleanupResult.retainedData.length;

        this.showStatus(
          `Data cleanup completed - ${deletedCount} items deleted, ${retainedCount} items retained`,
          'success'
        );
      } else {
        this.showStatus('Data cleanup completed', 'success');
      }

      await this.updatePrivacyDashboard();
    } catch (error) {
      console.error('Failed to run data cleanup:', error);
      this.showStatus('Failed to run data cleanup', 'error');
    }
  }

  /**
   * Show GDPR rights information
   */
  showGdprRights() {
    this.showDialog(`
      <div class="gdpr-rights-dialog">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">Your Privacy Rights (GDPR)</h3>
        
        <div class="space-y-4 max-h-96 overflow-y-auto">
          <div class="border-l-4 border-blue-500 pl-4">
            <h4 class="font-semibold text-blue-800">Right to Access</h4>
            <p class="text-sm text-gray-600 mt-1">
              You can view and export all data we have about you.
            </p>
          </div>
          
          <div class="border-l-4 border-green-500 pl-4">
            <h4 class="font-semibold text-green-800">Right to Rectification</h4>
            <p class="text-sm text-gray-600 mt-1">
              You can modify or correct your personal data at any time.
            </p>
          </div>
          
          <div class="border-l-4 border-red-500 pl-4">
            <h4 class="font-semibold text-red-800">Right to Erasure ("Right to be Forgotten")</h4>
            <p class="text-sm text-gray-600 mt-1">
              You can request deletion of your personal data.
            </p>
          </div>
          
          <div class="border-l-4 border-purple-500 pl-4">
            <h4 class="font-semibold text-purple-800">Right to Data Portability</h4>
            <p class="text-sm text-gray-600 mt-1">
              You can export your data in standard formats (JSON, CSV, XML).
            </p>
          </div>
          
          <div class="border-l-4 border-yellow-500 pl-4">
            <h4 class="font-semibold text-yellow-800">Right to Restrict Processing</h4>
            <p class="text-sm text-gray-600 mt-1">
              You can limit how we process your data using privacy mode.
            </p>
          </div>
          
          <div class="border-l-4 border-gray-500 pl-4">
            <h4 class="font-semibold text-gray-800">Right to Object</h4>
            <p class="text-sm text-gray-600 mt-1">
              You can opt out of data collection for analytics and marketing.
            </p>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button onclick="this.closest('.fixed').remove()" 
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            I Understand
          </button>
        </div>
      </div>
    `);
  }
}
