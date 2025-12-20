/**
 * Settings Tab - Main Coordinator
 * Orchestrates all settings-related functionality using decomposed modules
 */

import {
  DEFAULT_SETTINGS,
  getCurrencyStats,
  CurrencyPreferences
} from '/utils/currency-data.js';
import { settingsManager } from '/utils/settings-manager.js';
import { AdSettingsComponent } from '../ad-settings-component.js';
import { getSubscriptionManager } from '/utils/subscription-manager-v2.js';

// Import decomposed modules
import {
  populateCurrencySelectors,
  populateAdditionalCurrencies,
  validateCurrencyChange,
  canAddCurrency,
  showAddCurrencyDialog
} from './currency-config.js';

import {
  initializeToggleSwitches,
  updateToggleState,
  setupAllToggleSwitches
} from './preferences.js';

import {
  setupConversionTestingCurrencies,
  setupTestConversionButton
} from './test-conversion.js';

import {
  initializeSecurityFeatures,
  setupSecurityEventListeners
} from './security-settings.js';

import { setupPrivacyEventListeners } from './privacy-settings.js';

/**
 * Settings Tab class - coordinates all settings functionality
 */
export class SettingsTab {
  constructor() {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.currencyPreferences = new CurrencyPreferences();
    this.currencyStats = getCurrencyStats();
    this.pendingSettingsOperations = new Set();
    this.adSettingsComponent = new AdSettingsComponent();
    this.initialized = false;
    this.subscriptionManager = null;
    this.currentDialog = null;
  }

  /**
   * Initialize the settings tab
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      this.currentSettings = await settingsManager.getSettings();
      this.subscriptionManager = await getSubscriptionManager();
      this.setupEventListeners();
      await this.adSettingsComponent.initialize();
      this.initialized = true;
      console.log('Settings tab initialized');
    } catch (error) {
      console.error('Failed to initialize settings tab:', error);
      throw error;
    }
  }

  /**
   * Load content for the settings tab
   */
  async loadContent() {
    console.log('Loading settings tab content...');
    try {
      this.currentSettings = await settingsManager.getSettings();
      await this.updateUIWithCurrentSettings();
      initializeToggleSwitches(this.currentSettings, updateToggleState);
      this.updateCurrencyStats();
      await this.updateConversionCount();

      const adSettingsSection = document.getElementById('adSettingsSection');
      if (adSettingsSection) {
        adSettingsSection.style.display = this.adSettingsComponent.isVisible()
          ? 'block'
          : 'none';
      }

      console.log('Settings content loaded');
    } catch (error) {
      console.error('Failed to load settings content:', error);
    }
  }

  /**
   * Update today's conversion count display
   * Reads directly from storage for accurate count
   */
  async updateConversionCount() {
    try {
      // Read directly from storage to get accurate count
      const result = await chrome.storage.local.get(['conversionHistory']);
      const history = result.conversionHistory || [];

      // Count today's conversions using local date
      const today = new Date().toDateString();
      const todayCount = history.filter(entry => {
        const entryDate = new Date(entry.timestamp).toDateString();
        return entryDate === today;
      }).length;

      const countElement = document.getElementById('conversionCount');
      if (countElement) {
        countElement.textContent = todayCount;
      }
    } catch (error) {
      console.warn('Failed to load conversion count:', error);
    }
  }

  /**
   * Setup event listeners for settings controls
   */
  setupEventListeners() {
    // Currency selectors
    document
      .getElementById('baseCurrency')
      ?.addEventListener('change', e => this.handleCurrencyChange(e));
    document
      .getElementById('secondaryCurrency')
      ?.addEventListener('change', e => this.handleCurrencyChange(e));

    // Toggle switches
    setupAllToggleSwitches(this.currentSettings, async (id, value) => {
      await this.updateSettingWithTracking(id, value);
      this.currentSettings = await settingsManager.getSettings();
    });

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
      ?.addEventListener('click', () => this.saveSettings());
    document
      .getElementById('resetSettings')
      ?.addEventListener('click', () => this.resetSettings());
    document
      .getElementById('addCurrency')
      ?.addEventListener('click', () => this.handleAddCurrency());

    // Settings stats toggle
    document
      .getElementById('settingsStats')
      ?.addEventListener('click', () => this.toggleSettingsStats());

    // Test conversion
    setupConversionTestingCurrencies(this.currentSettings);
    setupTestConversionButton({
      subscriptionManager: this.subscriptionManager,
      showStatus: (msg, type) => this.showStatus(msg, type)
    });

    // Security
    setupSecurityEventListeners({
      showStatus: (msg, type) => this.showStatus(msg, type),
      showDialog: content => this.showDialog(content)
    });

    // Privacy
    setupPrivacyEventListeners({
      showStatus: (msg, type) => this.showStatus(msg, type),
      showDialog: content => this.showDialog(content),
      onDataChange: () => this.loadContent()
    });

    // Initialize security features
    initializeSecurityFeatures(msg => this.showStatus(msg, 'error'));
  }

  /**
   * Update settings with operation tracking
   */
  async updateSettingWithTracking(key, value) {
    const operationId = `${key}_${Date.now()}`;
    console.log(`Starting tracked operation: ${operationId}`);

    const operation = (async () => {
      try {
        await settingsManager.updateSetting(key, value);
        console.log(`Setting updated: ${key} = ${value}`);
        return true;
      } catch (error) {
        console.error(`Failed to update setting ${key}:`, error);
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
    console.log(`Currency change detected: ${id} = ${value}`);

    const validation = validateCurrencyChange(id, value, this.currentSettings);
    if (!validation.valid) {
      this.showStatus(validation.error, 'error');
      event.target.value = this.currentSettings[id];
      return;
    }

    await this.updateSettingWithTracking(id, value);
    this.currentSettings = await settingsManager.getSettings();

    if (this.subscriptionManager) {
      try {
        await this.subscriptionManager.trackUsage('settingsUpdates', 1);
      } catch (error) {
        console.warn('Failed to track currency setting change:', error);
      }
    }

    if (value && !this.currencyPreferences.getFavorites().includes(value)) {
      await this.addToFavorites(value);
    }
  }

  /**
   * Handle add currency button click
   */
  handleAddCurrency() {
    const result = showAddCurrencyDialog(this.currentSettings, code =>
      this.addCurrency(code)
    );
    if (result.error) {
      this.showStatus(result.error, 'info');
    }
  }

  /**
   * Add currency to additional currencies
   */
  async addCurrency(currencyCode) {
    const check = canAddCurrency(
      currencyCode,
      this.currentSettings,
      this.subscriptionManager
    );
    if (!check.allowed) {
      this.showStatus(check.error, 'error');
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

    if (this.subscriptionManager) {
      try {
        await this.subscriptionManager.trackUsage('currencyCount', 1);
      } catch (error) {
        console.warn('Failed to track currency addition:', error);
      }
    }

    populateAdditionalCurrencies(this.currentSettings, index =>
      this.removeCurrency(index)
    );
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
    populateAdditionalCurrencies(this.currentSettings, i =>
      this.removeCurrency(i)
    );
    this.showStatus(`Removed ${removedCurrency} successfully`, 'success');
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      await settingsManager.saveSettings(this.currentSettings);
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
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
        console.error('Failed to reset settings:', error);
        this.showStatus('Failed to reset settings', 'error');
      }
    }
  }

  /**
   * Update UI with current settings
   */
  async updateUIWithCurrentSettings() {
    populateCurrencySelectors(this.currentSettings);
    populateAdditionalCurrencies(this.currentSettings, index =>
      this.removeCurrency(index)
    );

    Object.keys(this.currentSettings).forEach(key => {
      const element = document.getElementById(key);
      if (!element) return;

      if (element.type === 'checkbox') {
        element.checked = this.currentSettings[key];
      } else if (element.classList?.contains('toggle-switch')) {
        updateToggleState(element, this.currentSettings[key]);
      } else if (element.tagName === 'SELECT') {
        element.value = this.currentSettings[key];
      }
    });
  }

  /**
   * Update currency stats display
   */
  updateCurrencyStats() {
    const stats = getCurrencyStats();
    const favoritesCount = this.currencyPreferences.getFavorites().length;

    const elements = {
      totalCurrencies: stats.total,
      popularCurrencies: stats.popular,
      totalRegions: stats.regions,
      favoriteCount: favoritesCount
    };

    Object.entries(elements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  }

  /**
   * Toggle settings stats panel visibility
   */
  toggleSettingsStats() {
    const panel = document.getElementById('settingsStatsPanel');
    if (panel) {
      panel.classList.toggle('hidden');
    }
  }

  /**
   * Add currency to favorites
   */
  async addToFavorites(currencyCode) {
    try {
      this.currencyPreferences.addToFavorites(currencyCode);
      await this.currencyPreferences.save();
      console.log(`Added ${currencyCode} to favorites`);
    } catch (error) {
      console.error(`Failed to add ${currencyCode} to favorites:`, error);
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className =
      'fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';

    const colors = {
      success: ['bg-green-500', 'text-white'],
      error: ['bg-red-500', 'text-white'],
      info: ['bg-blue-500', 'text-white'],
      warning: ['bg-yellow-500', 'text-white']
    };

    statusElement.classList.add(...(colors[type] || colors.info));
    statusElement.classList.remove('hidden');

    setTimeout(() => {
      statusElement.classList.add('hidden');
    }, 3000);
  }

  /**
   * Show dialog
   */
  showDialog(content) {
    const dialog = document.createElement('div');
    dialog.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        ${content}
      </div>
    `;

    // Handle close button
    dialog.querySelectorAll('.close-dialog').forEach(btn => {
      btn.addEventListener('click', () => {
        document.body.removeChild(dialog);
        this.currentDialog = null;
      });
    });

    // Click outside to close
    dialog.addEventListener('click', e => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
        this.currentDialog = null;
      }
    });

    document.body.appendChild(dialog);
    this.currentDialog = dialog;
  }

  /**
   * Close dialog
   */
  closeDialog() {
    if (this.currentDialog) {
      this.currentDialog.remove();
      this.currentDialog = null;
    }
  }

  /**
   * Update settings (called from external components)
   */
  async updateSettings(newSettings) {
    this.currentSettings = { ...this.currentSettings, ...newSettings };
    await this.saveSettings();
  }
}
