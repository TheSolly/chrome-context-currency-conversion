// Enhanced Popup Script for Currency Converter Extension
// Handles modern settings UI and user preferences

import {
  getPopularCurrencies,
  getAllCurrencies,
  getCurrencyByCode,
  getCurrenciesByRegion,
  formatCurrencyOption,
  DEFAULT_SETTINGS,
  FEATURES,
  getCurrencyStats,
  CurrencyPreferences,
  validateCurrencySelection,
  CURRENCY_REGIONS
} from '/utils/currency-data.js';

// Phase 3, Task 3.3: Enhanced Settings Management
import { settingsManager } from '/utils/settings-manager.js';

// Phase 4, Task 4.1: API Integration
import { apiConfigManager } from '/utils/api-config-manager.js';
import { initializeDefaultConfig } from '/utils/default-config.js';

// Phase 5, Task 5.3: Accessibility Features
import { accessibilityManager } from '../utils/accessibility-manager.js';

// Phase 7, Task 7.1: Freemium Model Implementation
import { getSubscriptionManager } from '/utils/subscription-manager-v2.js';

// Phase 6, Task 6.2: Conversion History
let currentActiveTab = 'settings';

// State management
let currentSettings = { ...DEFAULT_SETTINGS };
let subscriptionManager = null; // Subscription manager instance
let userPlan = 'FREE'; // Current user plan
const currencyPreferences = new CurrencyPreferences(); // Enhanced Task 3.2
const currencyStats = getCurrencyStats(); // Enhanced Task 3.2

// Enhanced error handling and persistence for Chrome extension environment
const pendingSettingsOperations = new Set();

// Track and wait for all pending operations before popup closes
async function waitForPendingOperations() {
  if (pendingSettingsOperations.size > 0) {
    console.log(
      `⏳ Waiting for ${pendingSettingsOperations.size} pending operations...`
    );
    const operations = Array.from(pendingSettingsOperations);
    await Promise.all(operations);
    console.log('✅ All pending operations completed');
  }
}

// Enhanced settings update with operation tracking
async function updateSettingWithTracking(key, value) {
  const operationId = `${key}_${Date.now()}`;
  console.log(`🔄 Starting tracked operation: ${operationId}`);

  const operation = (async () => {
    try {
      // Update the setting with retry logic
      await settingsManager.updateSetting(key, value);

      // Verify the setting was saved by re-reading it
      const verification = await settingsManager.getSettings();
      if (verification[key] !== value) {
        console.warn(`⚠️ Setting verification failed for ${key}, retrying...`);
        await settingsManager.updateSetting(key, value);

        // Second verification
        const secondVerification = await settingsManager.getSettings();
        if (secondVerification[key] !== value) {
          throw new Error(`Failed to persist setting ${key} after retry`);
        }
      }

      // Notify background service worker about settings change
      try {
        await chrome.runtime.sendMessage({
          action: 'reloadSettings'
        });
        console.log(
          `📤 Notified background service worker about ${key} change`
        );
      } catch (error) {
        console.warn('⚠️ Failed to notify background service worker:', error);
        // Don't throw here as the setting was saved successfully
      }

      console.log(`✅ Completed tracked operation: ${operationId}`);
    } catch (error) {
      console.error(`❌ Failed tracked operation: ${operationId}`, error);
      throw error;
    }
  })();

  pendingSettingsOperations.add(operation);

  try {
    await operation;
  } finally {
    pendingSettingsOperations.delete(operation);
  }
}

// Listen for popup close events to ensure operations complete
window.addEventListener('beforeunload', async event => {
  if (pendingSettingsOperations.size > 0) {
    event.preventDefault();
    event.returnValue = 'Settings are being saved...';
    await waitForPendingOperations();
  }
});

// Also handle visibility change (when popup loses focus)
document.addEventListener('visibilitychange', async () => {
  if (document.hidden && pendingSettingsOperations.size > 0) {
    await waitForPendingOperations();
  }
});

document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  console.log('🎨 Enhanced Currency Converter popup loaded');

  try {
    // Phase 3, Task 3.3: Initialize Settings Manager
    await settingsManager.initialize();
    currentSettings = await settingsManager.getSettings();

    console.log('📋 Loaded settings:', currentSettings);

    // Phase 7, Task 7.1: Initialize Subscription Manager
    try {
      subscriptionManager = getSubscriptionManager();
      await subscriptionManager.initialize();

      const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
      userPlan = subscriptionInfo.plan;

      console.log('💎 Subscription initialized:', subscriptionInfo);
    } catch (subscriptionError) {
      console.error(
        '⚠️ Subscription initialization failed:',
        subscriptionError
      );
      userPlan = 'FREE'; // Fallback to free plan
    }

    // Load user statistics
    await loadUserStats();

    // Enhanced Task 3.2 - Load currency preferences
    await currencyPreferences.load();

    // Initialize UI components
    await updateUIWithCurrentSettings();
    updateFeatureAccess();

    // Enhanced Task 3.2 - Setup advanced features
    setupAdvancedSearch();
    updateFavoritesDisplay();
    updateCurrencyStats();
    updateRegionalDisplay();
    setupRegionalNavigation();

    // Phase 4, Task 4.1: Initialize API Configuration
    try {
      const apiContainer =
        document.querySelector('.popup-container') || document.body;
      apiConfigManager.init(apiContainer);

      // Initialize default configuration
      await initializeDefaultConfig();
    } catch (apiError) {
      console.error(
        '⚠️ API configuration failed, continuing without it:',
        apiError
      );
    }

    // Phase 5, Task 5.3: Initialize Accessibility Features
    try {
      await accessibilityManager.initializeForPopup();
      console.log('♿ Accessibility features initialized');
    } catch (accessibilityError) {
      console.error(
        '⚠️ Accessibility initialization failed:',
        accessibilityError
      );
    }

    // Set up event listeners
    setupEventListeners();

    // Phase 6, Task 6.2: Initialize tab navigation and conversion history
    initializeTabNavigation();
    setupHistoryFilters();
    await initializeConversionHistory();

    // Phase 6, Task 6.3: Initialize rate alerts functionality
    initializeAlerts();

    console.log('✅ Enhanced popup initialization complete (Task 3.2)');
  } catch (error) {
    console.error('❌ Failed to initialize popup:', error);
    showStatus('Failed to load settings', 'error');
  }
}

function setupEventListeners() {
  // Currency selectors
  document
    .getElementById('baseCurrency')
    .addEventListener('change', handleCurrencyChange);
  document
    .getElementById('secondaryCurrency')
    .addEventListener('change', handleCurrencyChange);

  // Toggle switches
  setupToggleSwitch('showConfidence');
  setupToggleSwitch('autoConvert');
  setupToggleSwitch('showNotifications');

  // Precision selector
  document
    .getElementById('precision')
    .addEventListener('change', async event => {
      await settingsManager.updateSetting(
        'precision',
        parseInt(event.target.value)
      );
      currentSettings = await settingsManager.getSettings();
    });

  // Action buttons
  document
    .getElementById('saveSettings')
    .addEventListener('click', saveSettings);
  document
    .getElementById('resetSettings')
    .addEventListener('click', resetSettings);
  document
    .getElementById('addCurrency')
    .addEventListener('click', showAddCurrencyDialog);

  // Phase 3, Task 3.3: Enhanced Settings Management
  document
    .getElementById('exportSettings')
    .addEventListener('click', exportSettings);
  document
    .getElementById('importSettings')
    .addEventListener('click', importSettings);
  document
    .getElementById('settingsStats')
    .addEventListener('click', toggleSettingsStats);
  document
    .getElementById('importFileInput')
    .addEventListener('change', handleImportFile);

  // Premium and footer links
  document
    .getElementById('upgradePremium')
    .addEventListener('click', handleUpgrade);
  document.getElementById('rateUs').addEventListener('click', handleRateUs);
  document.getElementById('support').addEventListener('click', handleSupport);
  document.getElementById('help').addEventListener('click', handleHelp);

  // Phase 7, Task 7.1: Subscription Management Event Listeners
  setupSubscriptionEventListeners();

  // Setup conversion testing currency selectors
  setupConversionTestingCurrencies();

  // Phase 6, Task 6.2: Setup new functionality
  setupAddFavoriteForm();
  setupHistoryManagement();

  // Phase 6, Task 6.3: Initialize alerts functionality
  initializeAlerts();
}

// Phase 6, Task 6.3: Initialize rate alerts functionality
function initializeAlerts() {
  // Set up rate alerts UI and event listeners
  // This would connect to the rate alerts manager
  console.log('📊 Rate alerts initialized');
}

function populateCurrencySelectors() {
  const popularCurrencies = getPopularCurrencies();
  const allCurrencies = getAllCurrencies();

  // Populate base currency selector
  const baseCurrencySelect = document.getElementById('baseCurrency');
  baseCurrencySelect.innerHTML = '';

  // Add popular currencies first
  const popularGroup = document.createElement('optgroup');
  popularGroup.label = 'Popular Currencies';
  popularCurrencies.forEach(currency => {
    const option = document.createElement('option');
    option.value = currency.code;
    option.textContent = formatCurrencyOption(currency);
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
      option.textContent = formatCurrencyOption(currency);
      otherGroup.appendChild(option);
    });
  baseCurrencySelect.appendChild(otherGroup);

  // Clone for secondary currency
  const secondaryCurrencySelect = document.getElementById('secondaryCurrency');
  secondaryCurrencySelect.innerHTML = baseCurrencySelect.innerHTML;

  // Set current values
  baseCurrencySelect.value = currentSettings.baseCurrency;
  secondaryCurrencySelect.value = currentSettings.secondaryCurrency;
}

function populateAdditionalCurrencies() {
  const container = document.getElementById('additionalCurrencies');
  container.innerHTML = '';

  currentSettings.additionalCurrencies.forEach((currencyCode, index) => {
    const currency = getCurrencyByCode(currencyCode);
    if (currency) {
      const currencyItem = createCurrencyItem(currency, index);
      container.appendChild(currencyItem);
    }
  });
}

function createCurrencyItem(currency, index) {
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
  item.querySelector('.remove-currency').addEventListener('click', async () => {
    await removeCurrency(index);
  });

  return item;
}

function setupToggleSwitch(elementId) {
  const toggle = document.getElementById(elementId);

  toggle.addEventListener('click', async () => {
    if (toggle.disabled) {
      return;
    }

    const isEnabled = toggle.classList.contains('enabled');
    const newValue = !isEnabled;
    updateToggleState(toggle, newValue);

    // Update settings through SettingsManager with tracking
    await updateSettingWithTracking(elementId, newValue);
    currentSettings = await settingsManager.getSettings();
  });

  // Set initial state
  const initialValue = currentSettings[elementId];
  updateToggleState(toggle, initialValue);
}

function updateToggleState(toggle, enabled) {
  const thumb = toggle.querySelector('.toggle-thumb');

  if (enabled) {
    toggle.classList.add('enabled');
    thumb.classList.add('enabled');
    toggle.setAttribute('aria-checked', 'true');
  } else {
    toggle.classList.remove('enabled');
    thumb.classList.remove('enabled');
    toggle.setAttribute('aria-checked', 'false');
  }
}

// Removed - replaced with settingsManager.initialize() in initializePopup()

async function loadUserStats() {
  try {
    const stats = await chrome.storage.local.get([
      'conversionCount',
      'userPlan'
    ]);

    // Update conversion count
    const countElement = document.getElementById('conversionCount');
    countElement.textContent = stats.conversionCount || 0;

    // Update currency stats display (Enhanced Task 3.2)
    updateCurrencyStatsDisplay();

    // Update user plan
    userPlan = stats.userPlan || 'FREE';
  } catch (error) {
    console.error('❌ Failed to load user stats:', error);
  }
}

async function handleCurrencyChange(event) {
  const { id, value } = event.target;

  console.log(`🔄 Currency change detected: ${id} = ${value}`);

  // Prevent selecting the same currency for both base and secondary
  if (id === 'baseCurrency' && value === currentSettings.secondaryCurrency) {
    showStatus('Base and secondary currencies cannot be the same', 'error');
    event.target.value = currentSettings.baseCurrency;
    return;
  }

  if (id === 'secondaryCurrency' && value === currentSettings.baseCurrency) {
    showStatus('Base and secondary currencies cannot be the same', 'error');
    event.target.value = currentSettings.secondaryCurrency;
    return;
  }

  // Update settings through SettingsManager with tracking
  await updateSettingWithTracking(id, value);
  currentSettings = await settingsManager.getSettings();
  console.log(
    `✅ Settings updated, new secondaryCurrency: ${currentSettings.secondaryCurrency}`
  );
}

async function saveSettings() {
  try {
    // Wait for any pending operations to complete first
    await waitForPendingOperations();

    // Phase 3, Task 3.3: Use SettingsManager for saving
    await settingsManager.saveSettings();

    // Notify background service worker about settings change
    try {
      await chrome.runtime.sendMessage({
        action: 'reloadSettings'
      });
      console.log('📤 Notified background service worker about settings save');
    } catch (error) {
      console.warn('⚠️ Failed to notify background service worker:', error);
      // Don't throw here as the setting was saved successfully
    }

    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('❌ Failed to save settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

// Removed - replaced with settingsManager.saveSettings() calls

async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    try {
      // Phase 3, Task 3.3: Use SettingsManager for reset
      await settingsManager.resetToDefaults();
      currentSettings = await settingsManager.getSettings();

      // Update UI
      await updateUIWithCurrentSettings();

      showStatus('Settings reset to defaults!', 'success');
    } catch (error) {
      console.error('❌ Failed to reset settings:', error);
      showStatus('Failed to reset settings', 'error');
    }
  }
}

function showAddCurrencyDialog() {
  // Simple implementation - in a real app, this would be a modal
  const availableCurrencies = getAllCurrencies().filter(
    currency =>
      !currentSettings.additionalCurrencies.includes(currency.code) &&
      currency.code !== currentSettings.baseCurrency &&
      currency.code !== currentSettings.secondaryCurrency
  );

  if (availableCurrencies.length === 0) {
    showStatus('No more currencies available', 'error');
    return;
  }

  const currencyCode = prompt('Enter currency code (e.g., GBP):');
  if (currencyCode) {
    const currency = getCurrencyByCode(currencyCode.toUpperCase());
    if (
      currency &&
      !currentSettings.additionalCurrencies.includes(currency.code)
    ) {
      addCurrency(currency.code).catch(error => {
        console.error('Failed to add currency:', error);
        showStatus('Failed to add currency', 'error');
      });
    } else {
      showStatus('Invalid or duplicate currency code', 'error');
    }
  }
}

async function addCurrency(currencyCode) {
  const maxCurrencies = FEATURES[userPlan].maxCurrencies;

  if (currentSettings.additionalCurrencies.length >= maxCurrencies) {
    showStatus(`Maximum ${maxCurrencies} currencies allowed`, 'error');
    return;
  }

  const newAdditionalCurrencies = [
    ...currentSettings.additionalCurrencies,
    currencyCode
  ];
  await updateSettingWithTracking(
    'additionalCurrencies',
    newAdditionalCurrencies
  );
  currentSettings = await settingsManager.getSettings();
  populateAdditionalCurrencies();
  updateFeatureAccess();
}

async function removeCurrency(index) {
  const newAdditionalCurrencies = [...currentSettings.additionalCurrencies];
  newAdditionalCurrencies.splice(index, 1);
  await updateSettingWithTracking(
    'additionalCurrencies',
    newAdditionalCurrencies
  );
  currentSettings = await settingsManager.getSettings();
  populateAdditionalCurrencies();
  updateFeatureAccess();
}

function showStatus(message, type = 'info') {
  const statusElement = document.getElementById('statusMessage');

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

// Enhanced Task 3.2 - Currency Stats Display
function updateCurrencyStatsDisplay() {
  try {
    // Update total currencies count in the interface if element exists
    const totalElement = document.getElementById('totalCurrencies');
    if (totalElement) {
      totalElement.textContent = currencyStats.total;
    }

    // Update popular currencies count
    const popularElement = document.getElementById('popularCurrencies');
    if (popularElement) {
      popularElement.textContent = currencyStats.popular;
    }

    // Update regions count
    const regionsElement = document.getElementById('totalRegions');
    if (regionsElement) {
      regionsElement.textContent = currencyStats.regions;
    }

    console.log('📊 Currency Stats Updated:', currencyStats);
  } catch (error) {
    console.error('❌ Failed to update currency stats:', error);
  }
}

// Enhanced Task 3.2 - Advanced Search Setup
function setupAdvancedSearch() {
  console.log('🔍 Setting up advanced search functionality');

  // Add search functionality for currency selectors
  const selectors = ['baseCurrency', 'secondaryCurrency'];

  selectors.forEach(selectorId => {
    const select = document.getElementById(selectorId);
    if (select) {
      // Add search capabilities (basic implementation)
      select.addEventListener('focus', () => {
        console.log(`🎯 Focus on ${selectorId} - enhanced search available`);
      });
    }
  });

  // Setup region-based filtering
  setupRegionalSearchFilters();
}

function setupRegionalSearchFilters() {
  // Basic implementation for regional filtering
  console.log('🌍 Regional search filters ready');
}

// Enhanced Task 3.2 - New UI functions
function updateCurrencyStats() {
  const stats = getCurrencyStats();
  const favoritesCount = currencyPreferences.getFavorites().length;

  document.getElementById('totalCurrencies').textContent = stats.total;
  document.getElementById('popularCurrencies').textContent = stats.popular;
  document.getElementById('totalRegions').textContent = stats.regions;
  document.getElementById('favoriteCount').textContent = favoritesCount;

  // Update region stats
  const regionStatsContainer = document.getElementById('regionStats');
  regionStatsContainer.innerHTML = '';

  Object.entries(stats.regionStats).forEach(([regionKey, regionInfo]) => {
    const tag = document.createElement('span');
    tag.className = 'region-tag';
    tag.innerHTML = `${CURRENCY_REGIONS[regionKey]?.flag || '🌐'} ${regionInfo.count}`;
    regionStatsContainer.appendChild(tag);
  });
}

function updateRegionalDisplay() {
  // Update region buttons with current counts
  Object.keys(CURRENCY_REGIONS).forEach(regionKey => {
    const currencies = getCurrenciesByRegion(regionKey);
    const countElement = document.getElementById(`${regionKey}Count`);
    if (countElement) {
      countElement.textContent = `${currencies.length} currencies`;
    }
  });
}

function setupRegionalNavigation() {
  // Add click handlers for region buttons
  document.querySelectorAll('.region-button').forEach(button => {
    button.addEventListener('click', () => {
      const region = button.dataset.region;
      showRegionalCurrencies(region);
    });
  });
}

function showRegionalCurrencies(region) {
  const currencies = getCurrenciesByRegion(region);
  const regionInfo = CURRENCY_REGIONS[region];

  console.log(
    `📍 Showing ${regionInfo.name} currencies:`,
    currencies.map(c => c.code)
  );

  // Could implement a modal or expanded view here
  // For now, just log the information
  showStatus(
    `${regionInfo.flag} ${regionInfo.name}: ${currencies.length} currencies available`,
    'info'
  );
}

async function updateFavoritesDisplay() {
  const favoritesContainer = document.getElementById('favoritesList');
  const recentContainer = document.getElementById('recentlyUsed');

  const favorites = currencyPreferences.getFavorites();
  const recentlyUsed = currencyPreferences.getRecentlyUsed();

  // Display favorites
  favoritesContainer.innerHTML = '';
  if (favorites.length === 0) {
    favoritesContainer.innerHTML =
      '<div class="text-sm text-gray-500 italic">No favorites yet. Add currencies by clicking the star icon.</div>';
  } else {
    favorites.forEach(code => {
      const currency = getCurrencyByCode(code);
      if (currency) {
        const favoriteItem = createFavoriteItem(currency);
        favoritesContainer.appendChild(favoriteItem);
      }
    });
  }

  // Display recently used
  recentContainer.innerHTML = '';
  recentlyUsed.forEach(code => {
    const currency = getCurrencyByCode(code);
    if (currency) {
      const recentItem = document.createElement('span');
      recentItem.className = 'recent-currency';
      recentItem.innerHTML = `${currency.flag} ${code}`;
      recentItem.addEventListener('click', () => {
        // Quick select this currency
        document.getElementById('baseCurrency').value = code;
        handleCurrencyChange();
      });
      recentContainer.appendChild(recentItem);
    }
  });
}

function createFavoriteItem(currency) {
  const div = document.createElement('div');
  div.className = 'favorite-item';

  const info = document.createElement('div');
  info.innerHTML = `${currency.flag} <strong>${currency.code}</strong> - ${currency.name}`;

  const removeBtn = document.createElement('span');
  removeBtn.className = 'favorite-remove';
  removeBtn.innerHTML = '✕';
  removeBtn.title = 'Remove from favorites';
  removeBtn.addEventListener('click', () => removeFromFavorites(currency.code));

  div.appendChild(info);
  div.appendChild(removeBtn);

  return div;
}

// Enhanced Task 3.2 - Currency Validation with User Feedback
function validateAndUpdateSettings() {
  const validation = validateCurrencySelection(
    currentSettings.baseCurrency,
    currentSettings.secondaryCurrency,
    currentSettings.additionalCurrencies
  );

  if (!validation.valid) {
    validation.errors.forEach(error => {
      showStatus(error, 'error');
    });
    return false;
  }

  if (validation.warnings.length > 0) {
    validation.warnings.forEach(warning => {
      console.warn('⚠️ Currency Warning:', warning);
    });
  }

  return true;
}

// Enhanced Task 3.2 - Favorites Management
async function addToFavorites(currencyCode) {
  try {
    currencyPreferences.addToFavorites(currencyCode);
    await currencyPreferences.save();
    showStatus(`Added ${currencyCode} to favorites`, 'success');
    updateFavoritesDisplay();
  } catch (error) {
    console.error('❌ Failed to add to favorites:', error);
    showStatus('Failed to add to favorites', 'error');
  }
}

async function removeFromFavorites(currencyCode) {
  try {
    currencyPreferences.removeFromFavorites(currencyCode);
    await currencyPreferences.save();
    showStatus(`Removed ${currencyCode} from favorites`, 'success');
    updateFavoritesDisplay();
  } catch (error) {
    console.error('❌ Failed to remove from favorites:', error);
    showStatus('Failed to remove from favorites', 'error');
  }
}

// Phase 3, Task 3.3: Enhanced Settings Management Functions

async function exportSettings() {
  try {
    const exportData = await settingsManager.exportSettings();

    // Create download using data URL
    const dataUrl =
      'data:application/json;charset=utf-8,' + encodeURIComponent(exportData);
    const filename = `currency-converter-settings-${
      new Date().toISOString().split('T')[0]
    }.json`;

    // Create temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    showStatus('Settings exported successfully!', 'success');
  } catch (error) {
    console.error('❌ Failed to export settings:', error);
    showStatus('Failed to export settings', 'error');
  }
}

function importSettings() {
  document.getElementById('importFileInput').click();
}

async function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const success = await settingsManager.importSettings(text);

    if (success) {
      currentSettings = await settingsManager.getSettings();

      // Update UI with imported settings
      await updateUIWithCurrentSettings();

      showStatus('Settings imported successfully!', 'success');
    } else {
      showStatus('Invalid settings file format', 'error');
    }
  } catch (error) {
    console.error('❌ Failed to import settings:', error);
    showStatus('Failed to import settings', 'error');
  }

  // Reset file input
  event.target.value = '';
}

async function toggleSettingsStats() {
  const panel = document.getElementById('settingsStatsPanel');
  const isHidden = panel.classList.contains('hidden');

  if (isHidden) {
    try {
      const stats = await settingsManager.getStatistics();
      if (stats) {
        document.getElementById('settingsVersion').textContent = stats.version;
        document.getElementById('installDate').textContent = stats.installDate
          ? new Date(stats.installDate).toLocaleDateString()
          : 'Unknown';
        document.getElementById('lastSync').textContent = stats.lastSync
          ? new Date(stats.lastSync).toLocaleString()
          : 'Never';
        document.getElementById('storageUsed').textContent =
          `${stats.storageUsed} bytes`;
      }
      panel.classList.remove('hidden');
    } catch (error) {
      console.error('❌ Failed to load settings stats:', error);
      showStatus('Failed to load statistics', 'error');
    }
  } else {
    panel.classList.add('hidden');
  }
}

// Event handlers
function handleUpgrade() {
  chrome.tabs.create({ url: 'https://example.com/premium' });
}

function handleRateUs() {
  chrome.tabs.create({
    url: 'https://chrome.google.com/webstore/category/extensions'
  });
}

function handleSupport() {
  chrome.tabs.create({ url: 'mailto:support@currencyconverter.com' });
}

function handleHelp() {
  chrome.tabs.create({ url: 'https://example.com/help' });
}

async function updateUIWithCurrentSettings() {
  // Ensure we have the latest settings
  currentSettings = await settingsManager.getSettings();

  // Update currency selectors
  populateCurrencySelectors();
  populateAdditionalCurrencies();

  // Update toggles and selects
  Object.keys(currentSettings).forEach(key => {
    const element = document.getElementById(key);
    if (element && element.classList.contains('toggle-switch')) {
      updateToggleState(element, currentSettings[key]);
    } else if (element && element.tagName === 'SELECT') {
      element.value = currentSettings[key];
    }
  });
}

// Phase 5, Task 5.1: Conversion Testing Functions

/**
 * Setup currency selectors for conversion testing
 */
function setupConversionTestingCurrencies() {
  const popularCurrencies = getPopularCurrencies();
  const allCurrencies = getAllCurrencies();

  // Populate test currency selectors
  const fromSelect = document.getElementById('testFromCurrency');
  const toSelect = document.getElementById('testToCurrency');

  [fromSelect, toSelect].forEach(select => {
    select.innerHTML = '';

    // Add popular currencies first
    const popularGroup = document.createElement('optgroup');
    popularGroup.label = 'Popular Currencies';
    popularCurrencies.forEach(currency => {
      const option = document.createElement('option');
      option.value = currency.code;
      option.textContent = formatCurrencyOption(currency);
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
        option.textContent = formatCurrencyOption(currency);
        otherGroup.appendChild(option);
      });
    select.appendChild(otherGroup);
  });

  // Set default values
  fromSelect.value = currentSettings.baseCurrency || 'USD';
  toSelect.value = currentSettings.secondaryCurrency || 'EUR';
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

// Phase 6, Task 6.2: Tab Navigation Functions

/**
 * Initialize tab navigation
 */
function initializeTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetPanelId = button.getAttribute('aria-controls');
      switchTab(targetPanelId);
    });

    // Keyboard navigation
    button.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const targetPanelId = button.getAttribute('aria-controls');
        switchTab(targetPanelId);
      }
    });
  });

  // Set initial active tab
  switchTab('settingsPanel');
}

/**
 * Switch to a specific tab
 */
function switchTab(targetPanelId) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Update buttons
  tabButtons.forEach(button => {
    const isActive = button.getAttribute('aria-controls') === targetPanelId;
    button.classList.toggle('tab-active', isActive);
    button.setAttribute('aria-selected', isActive.toString());
    button.tabIndex = isActive ? 0 : -1;
  });

  // Update panels
  tabPanels.forEach(panel => {
    const isActive = panel.id === targetPanelId;
    panel.classList.toggle('hidden', !isActive);
  });

  // Update current active tab
  currentActiveTab = targetPanelId.replace('Panel', '');

  // Load content for specific tabs
  if (targetPanelId === 'historyPanel') {
    loadHistoryContent();
  } else if (targetPanelId === 'favoritesPanel') {
    loadFavoritesContent();
  } else if (targetPanelId === 'alertsPanel') {
    loadAlertsContent();
  }
}

// Phase 6, Task 6.2: History Management Functions

/**
 * Initialize conversion history integration
 */
async function initializeConversionHistory() {
  try {
    console.log('📚 Initializing conversion history integration');

    // Test connection to background script
    const response = await chrome.runtime.sendMessage({
      action: 'getConversionStats'
    });

    if (response && response.success) {
      console.log('✅ Conversion history connection established');
      updateHistoryStats(response.stats);
    }
  } catch (error) {
    console.error('❌ Failed to initialize conversion history:', error);
  }
}

/**
 * Load and display history content
 */
async function loadHistoryContent() {
  try {
    const historyResponse = await chrome.runtime.sendMessage({
      action: 'getHistory',
      filter: getActiveHistoryFilter()
    });

    if (historyResponse && historyResponse.success) {
      displayHistoryItems(historyResponse.history);
    }

    const statsResponse = await chrome.runtime.sendMessage({
      action: 'getConversionStats'
    });

    if (statsResponse && statsResponse.success) {
      updateHistoryStats(statsResponse.stats);
      displayPopularPairs(statsResponse.stats.popularPairs);
    }
  } catch (error) {
    console.error('❌ Failed to load history content:', error);
  }
}

/**
 * Display history items in the list
 */
function displayHistoryItems(historyItems) {
  const historyList = document.getElementById('historyList');

  if (!historyItems || historyItems.length === 0) {
    historyList.innerHTML = `
      <div class="text-center text-gray-500 text-sm py-8">
        No conversions yet
      </div>
    `;
    return;
  }

  historyList.innerHTML = historyItems
    .map(
      item => `
    <div class="history-item" data-id="${item.id}">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-900">
            ${formatAmount(item.fromAmount)} ${item.fromCurrency} → ${formatAmount(item.toAmount)} ${item.toCurrency}
          </div>
          <div class="text-xs text-gray-500">
            Rate: 1 ${item.fromCurrency} = ${formatAmount(item.rate)} ${item.toCurrency}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">
            ${formatTimestamp(item.timestamp)}
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
  `
    )
    .join('');

  // Add event listeners for favorite buttons
  historyList.querySelectorAll('.add-to-favorites-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fromCurrency = btn.dataset.from;
      const toCurrency = btn.dataset.to;
      addToFavoritesFromHistory(fromCurrency, toCurrency);
    });
  });
}

/**
 * Update history statistics display
 */
function updateHistoryStats(stats) {
  const totalElement = document.getElementById('totalConversions');
  const weekElement = document.getElementById('weekConversions');
  const countElement = document.getElementById('conversionCount');

  if (totalElement) {
    totalElement.textContent = stats.totalConversions || 0;
  }
  if (weekElement) {
    weekElement.textContent = stats.weekConversions || 0;
  }
  if (countElement) {
    countElement.textContent = stats.todayConversions || 0;
  }
}

/**
 * Display popular currency pairs
 */
function displayPopularPairs(popularPairs) {
  const container = document.getElementById('popularPairs');

  if (!popularPairs || popularPairs.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-gray-500">
        No popular pairs yet
      </div>
    `;
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
 * Get the currently active history filter
 */
function getActiveHistoryFilter() {
  const activeFilter = document.querySelector('.filter-btn.filter-active');
  return activeFilter
    ? activeFilter.id.replace('filter', '').toLowerCase()
    : 'all';
}

/**
 * Setup history filter buttons
 */
function setupHistoryFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active filter
      filterButtons.forEach(b => b.classList.remove('filter-active'));
      btn.classList.add('filter-active');

      // Reload history with new filter
      if (currentActiveTab === 'history') {
        loadHistoryContent();
      }
    });
  });
}

/**
 * Add a currency pair to favorites from history
 */
async function addToFavoritesFromHistory(fromCurrency, toCurrency) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'addToFavorites',
      favorite: {
        fromCurrency,
        toCurrency,
        label: `${fromCurrency} to ${toCurrency}`
      }
    });

    if (response && response.success) {
      showStatusMessage('Added to favorites!', 'success');
      if (currentActiveTab === 'favorites') {
        loadFavoritesContent();
      }
    }
  } catch (error) {
    console.error('❌ Failed to add to favorites:', error);
    showStatusMessage('Failed to add to favorites', 'error');
  }
}

// Phase 6, Task 6.2: Favorites Management Functions

/**
 * Load and display favorites content
 */
async function loadFavoritesContent() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getFavorites'
    });

    if (response && response.success) {
      displayFavoriteItems(response.favorites);
      setupFavoriteQuickConvert(response.favorites);
    }
  } catch (error) {
    console.error('❌ Failed to load favorites content:', error);
  }
}

/**
 * Display favorite items
 */
function displayFavoriteItems(favorites) {
  const favoritesList = document.getElementById('favoritesList');

  if (!favorites || favorites.length === 0) {
    favoritesList.innerHTML = `
      <div class="text-center text-gray-500 text-sm py-8">
        No favorites yet. Add your frequently used conversions for quick access!
      </div>
    `;
    return;
  }

  favoritesList.innerHTML = favorites
    .map(
      fav => `
    <div class="favorite-item" data-id="${fav.id}">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-900">
            ${fav.fromCurrency} → ${fav.toCurrency}
            ${fav.amount ? ` (${formatAmount(fav.amount)})` : ''}
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
  `
    )
    .join('');

  // Add event listeners
  favoritesList.querySelectorAll('.remove-favorite-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFavorite(btn.dataset.id);
    });
  });

  favoritesList.querySelectorAll('.quick-convert-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      performQuickConvert(btn.dataset.from, btn.dataset.to, btn.dataset.amount);
    });
  });
}

/**
 * Setup quick convert buttons for favorites
 */
function setupFavoriteQuickConvert(favorites) {
  const container = document.getElementById('quickConvertButtons');

  if (!favorites || favorites.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-gray-500">
        Add some favorites first
      </div>
    `;
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
      const amount = document.getElementById('quickConvertAmount').value;
      if (amount) {
        performQuickConvert(btn.dataset.from, btn.dataset.to, amount);
      }
    });
  });
}

/**
 * Remove a favorite
 */
async function removeFavorite(favoriteId) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'removeFromFavorites',
      favoriteId
    });

    if (response && response.success) {
      showStatusMessage('Removed from favorites', 'success');
      loadFavoritesContent();
    }
  } catch (error) {
    console.error('❌ Failed to remove favorite:', error);
    showStatusMessage('Failed to remove favorite', 'error');
  }
}

/**
 * Perform a quick conversion
 */
async function performQuickConvert(fromCurrency, toCurrency, amount) {
  if (!amount) {
    showStatusMessage('Please enter an amount', 'error');
    return;
  }

  try {
    // Use the existing conversion service
    const response = await chrome.runtime.sendMessage({
      action: 'convertCurrency',
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount)
    });

    if (response && response.success) {
      const result = `${formatAmount(amount)} ${fromCurrency} = ${formatAmount(response.convertedAmount)} ${toCurrency}`;
      showStatusMessage(result, 'success', 5000);

      // Refresh history if on history tab
      if (currentActiveTab === 'history') {
        setTimeout(() => loadHistoryContent(), 1000);
      }
    }
  } catch (error) {
    console.error('❌ Quick conversion failed:', error);
    showStatusMessage('Conversion failed', 'error');
  }
}

// Phase 6, Task 6.2: Utility Functions

/**
 * Format amount for display
 */
function formatAmount(amount) {
  if (!amount) {
    return '0';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(parseFloat(amount));
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
}

/**
 * Show status message to user
 */
function showStatusMessage(message, type = 'success', duration = 3000) {
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

// Phase 6, Task 6.2: Add Favorite Form Functions

/**
 * Setup add favorite form
 */
function setupAddFavoriteForm() {
  const addBtn = document.getElementById('addFavorite');
  const form = document.getElementById('addFavoriteForm');
  const saveBtn = document.getElementById('saveFavorite');
  const cancelBtn = document.getElementById('cancelFavorite');

  // Populate currency selectors
  const fromSelect = document.getElementById('favFromCurrency');
  const toSelect = document.getElementById('favToCurrency');

  populateCurrencySelector(fromSelect);
  populateCurrencySelector(toSelect);

  addBtn.addEventListener('click', () => {
    form.classList.remove('hidden');
    addBtn.classList.add('hidden');
  });

  cancelBtn.addEventListener('click', () => {
    form.classList.add('hidden');
    addBtn.classList.remove('hidden');
    clearFavoriteForm();
  });

  saveBtn.addEventListener('click', async () => {
    await saveFavorite();
  });
}

/**
 * Populate a currency selector with options
 */
function populateCurrencySelector(select) {
  const popularCurrencies = getPopularCurrencies();
  const allCurrencies = getAllCurrencies();

  select.innerHTML = '<option value="">Select currency...</option>';

  // Add popular currencies first
  const popularGroup = document.createElement('optgroup');
  popularGroup.label = 'Popular Currencies';
  popularCurrencies.forEach(currency => {
    const option = document.createElement('option');
    option.value = currency.code;
    option.textContent = formatCurrencyOption(currency);
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
      option.textContent = formatCurrencyOption(currency);
      otherGroup.appendChild(option);
    });
  select.appendChild(otherGroup);
}

/**
 * Save a new favorite
 */
async function saveFavorite() {
  const fromCurrency = document.getElementById('favFromCurrency').value;
  const toCurrency = document.getElementById('favToCurrency').value;
  const amount = document.getElementById('favAmount').value;
  const label = document.getElementById('favLabel').value;

  if (!fromCurrency || !toCurrency) {
    showStatusMessage('Please select both currencies', 'error');
    return;
  }

  if (fromCurrency === toCurrency) {
    showStatusMessage('From and To currencies must be different', 'error');
    return;
  }

  try {
    const favorite = {
      fromCurrency,
      toCurrency,
      amount: amount ? parseFloat(amount) : null,
      label: label || `${fromCurrency} to ${toCurrency}`
    };

    const response = await chrome.runtime.sendMessage({
      action: 'addToFavorites',
      favorite
    });

    if (response && response.success) {
      showStatusMessage('Favorite saved!', 'success');
      clearFavoriteForm();
      document.getElementById('addFavoriteForm').classList.add('hidden');
      document.getElementById('addFavorite').classList.remove('hidden');
      loadFavoritesContent();
    }
  } catch (error) {
    console.error('❌ Failed to save favorite:', error);
    showStatusMessage('Failed to save favorite', 'error');
  }
}

/**
 * Clear the add favorite form
 */
function clearFavoriteForm() {
  document.getElementById('favFromCurrency').value = '';
  document.getElementById('favToCurrency').value = '';
  document.getElementById('favAmount').value = '';
  document.getElementById('favLabel').value = '';
}

// Phase 6, Task 6.2: History Management Functions

/**
 * Setup history management buttons
 */
function setupHistoryManagement() {
  const exportBtn = document.getElementById('exportHistory');
  const clearBtn = document.getElementById('clearHistory');

  exportBtn.addEventListener('click', exportHistory);
  clearBtn.addEventListener('click', clearHistory);
}

/**
 * Export conversion history
 */
async function exportHistory() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'exportHistory'
    });
    if (response && response.success) {
      // Create and download the export file
      const blob = new window.Blob([response.data], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `currency-conversion-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showStatusMessage('History exported successfully!', 'success');
    }
  } catch (error) {
    console.error('❌ Failed to export history:', error);
    showStatusMessage('Failed to export history', 'error');
  }
}

/**
 * Clear conversion history
 */
async function clearHistory() {
  if (
    !confirm(
      'Are you sure you want to clear all conversion history? This cannot be undone.'
    )
  ) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'clearHistory'
    });

    if (response && response.success) {
      showStatusMessage('History cleared successfully!', 'success');
      loadHistoryContent();
    }
  } catch (error) {
    console.error('❌ Failed to clear history:', error);
    showStatusMessage('Failed to clear history', 'error');
  }
}

// Phase 6, Task 6.3: Rate Alerts & Notifications Implementation

/**
 * Load and display alerts content
 */
async function loadAlertsContent() {
  try {
    // Load alerts from background
    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'getAlerts'
    });

    if (response && response.success) {
      displayAlerts(response.alerts || []);
      await loadAlertSettings();
      await loadAlertHistory();
      await loadTrendAnalysis();
    } else {
      console.error('Failed to load alerts:', response?.error);
      showStatusMessage('Failed to load alerts', 'error');
    }
  } catch (error) {
    console.error('❌ Failed to load alerts content:', error);
    showStatusMessage('Error loading alerts', 'error');
  }
}

/**
 * Display alerts in the UI
 */
function displayAlerts(alerts) {
  const alertsList = document.getElementById('alertsList');
  const alertsEmpty = document.getElementById('alertsEmpty');

  if (!alerts || alerts.length === 0) {
    alertsList.innerHTML = '';
    alertsEmpty.classList.remove('hidden');
    return;
  }

  alertsEmpty.classList.add('hidden');

  alertsList.innerHTML = alerts
    .map(
      alert => `
    <div class="alert-item p-3 border rounded-lg ${alert.isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50'}" data-alert-id="${alert.id}">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center space-x-2">
            <span class="font-medium">${alert.fromCurrency} → ${alert.toCurrency}</span>
            <span class="px-2 py-1 text-xs rounded ${alert.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
              ${alert.isActive ? 'Active' : 'Inactive'}
            </span>
            <span class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
              ${alert.type}
            </span>
          </div>
          <div class="mt-1 text-sm text-gray-600">
            Target: ${formatTargetRate(alert)}
          </div>
          <div class="mt-1 text-xs text-gray-500">
            Created: ${new Date(alert.createdAt).toLocaleDateString()}
            ${alert.lastTriggered ? `• Last triggered: ${new Date(alert.lastTriggered).toLocaleDateString()}` : ''}
          </div>
        </div>
        <div class="flex space-x-2">
          <button class="edit-alert-btn text-blue-600 hover:text-blue-800 text-sm" data-alert-id="${alert.id}">
            Edit
          </button>
          <button class="toggle-alert-btn text-${alert.isActive ? 'orange' : 'green'}-600 hover:text-${alert.isActive ? 'orange' : 'green'}-800 text-sm" data-alert-id="${alert.id}">
            ${alert.isActive ? 'Pause' : 'Activate'}
          </button>
          <button class="delete-alert-btn text-red-600 hover:text-red-800 text-sm" data-alert-id="${alert.id}">
            Delete
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  // Add event listeners to alert action buttons
  setupAlertActionListeners();
}

/**
 * Format target rate display
 */
function formatTargetRate(alert) {
  if (alert.type === 'above') {
    return `Above ${alert.targetRate}`;
  } else if (alert.type === 'below') {
    return `Below ${alert.targetRate}`;
  } else if (alert.type === 'change') {
    return `${alert.targetRate > 0 ? '+' : ''}${alert.targetRate}% change`;
  }
  return alert.targetRate;
}

/**
 * Setup event listeners for alert actions
 */
function setupAlertActionListeners() {
  // Edit alert buttons
  document.querySelectorAll('.edit-alert-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const alertId = e.target.getAttribute('data-alert-id');
      editAlert(alertId);
    });
  });

  // Toggle alert buttons
  document.querySelectorAll('.toggle-alert-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const alertId = e.target.getAttribute('data-alert-id');
      await toggleAlert(alertId);
    });
  });

  // Delete alert buttons
  document.querySelectorAll('.delete-alert-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const alertId = e.target.getAttribute('data-alert-id');
      await deleteAlert(alertId);
    });
  });
}

/**
 * Setup new alert form
 */
function setupNewAlertForm() {
  const newAlertForm = document.getElementById('newAlertForm');

  if (newAlertForm) {
    newAlertForm.addEventListener('submit', async e => {
      e.preventDefault();
      await createNewAlert();
    });
  }

  // Populate currency selectors for alerts
  populateAlertCurrencySelectors();

  // Setup alert type change listener
  const alertTypeSelect = document.getElementById('alertType');
  if (alertTypeSelect) {
    alertTypeSelect.addEventListener('change', updateAlertTargetInput);
  }
}

/**
 * Populate currency selectors for alerts
 */
function populateAlertCurrencySelectors() {
  const fromCurrencySelect = document.getElementById('alertFromCurrency');
  const toCurrencySelect = document.getElementById('alertToCurrency');

  if (!fromCurrencySelect || !toCurrencySelect) {
    return;
  }

  const popularCurrencies = getPopularCurrencies();
  const allCurrencies = getAllCurrencies();

  [fromCurrencySelect, toCurrencySelect].forEach(select => {
    select.innerHTML = '';

    // Add popular currencies
    const popularGroup = document.createElement('optgroup');
    popularGroup.label = 'Popular Currencies';
    popularCurrencies.forEach(currency => {
      const option = document.createElement('option');
      option.value = currency.code;
      option.textContent = formatCurrencyOption(currency);
      popularGroup.appendChild(option);
    });
    select.appendChild(popularGroup);

    // Add all currencies
    const allGroup = document.createElement('optgroup');
    allGroup.label = 'All Currencies';
    allCurrencies
      .filter(c => !c.popular)
      .forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = formatCurrencyOption(currency);
        allGroup.appendChild(option);
      });
    select.appendChild(allGroup);
  });

  // Set default values from current settings
  fromCurrencySelect.value = currentSettings.baseCurrency || 'USD';
  toCurrencySelect.value = currentSettings.secondaryCurrency || 'EUR';
}

/**
 * Update alert target input based on alert type
 */
function updateAlertTargetInput() {
  const alertType = document.getElementById('alertType')?.value;
  const targetLabel = document.getElementById('alertTargetLabel');
  const targetInput = document.getElementById('alertTargetRate');

  if (!targetLabel || !targetInput) {
    return;
  }

  switch (alertType) {
    case 'above':
      targetLabel.textContent = 'Target Rate (above):';
      targetInput.placeholder = 'e.g., 1.20';
      targetInput.step = '0.0001';
      targetInput.min = '0';
      break;
    case 'below':
      targetLabel.textContent = 'Target Rate (below):';
      targetInput.placeholder = 'e.g., 1.15';
      targetInput.step = '0.0001';
      targetInput.min = '0';
      break;
    case 'change':
      targetLabel.textContent = 'Percentage Change:';
      targetInput.placeholder = 'e.g., 5 for +5% or -3 for -3%';
      targetInput.step = '0.1';
      targetInput.removeAttribute('min');
      break;
  }
}

/**
 * Create a new alert
 */
async function createNewAlert() {
  try {
    const form = document.getElementById('newAlertForm');

    const alertData = {
      fromCurrency: form.elements.fromCurrency.value,
      toCurrency: form.elements.toCurrency.value,
      type: form.elements.alertType.value,
      targetRate: parseFloat(form.elements.targetRate.value),
      label:
        form.elements.alertLabel.value ||
        `${form.elements.fromCurrency.value} → ${form.elements.toCurrency.value}`
    };

    // Validate input
    if (
      !alertData.fromCurrency ||
      !alertData.toCurrency ||
      !alertData.type ||
      isNaN(alertData.targetRate)
    ) {
      showStatusMessage('Please fill in all required fields', 'error');
      return;
    }

    if (alertData.fromCurrency === alertData.toCurrency) {
      showStatusMessage('From and To currencies must be different', 'error');
      return;
    }

    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'createAlert',
      alertData
    });

    if (response && response.success) {
      showStatusMessage('Alert created successfully!', 'success');
      form.reset();
      await loadAlertsContent(); // Refresh the alerts list
    } else {
      showStatusMessage(response?.error || 'Failed to create alert', 'error');
    }
  } catch (error) {
    console.error('❌ Failed to create alert:', error);
    showStatusMessage('Failed to create alert', 'error');
  }
}

/**
 * Edit an existing alert
 */
async function editAlert(alertId) {
  try {
    // Get current alert data
    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'getAlert',
      alertId
    });

    if (response && response.success && response.alert) {
      const alert = response.alert;

      // Populate form with current data
      document.getElementById('alertFromCurrency').value = alert.fromCurrency;
      document.getElementById('alertToCurrency').value = alert.toCurrency;
      document.getElementById('alertType').value = alert.type;
      document.getElementById('alertTargetRate').value = alert.targetRate;
      document.getElementById('alertLabel').value = alert.label;

      updateAlertTargetInput();

      // Change form to edit mode
      const form = document.getElementById('newAlertForm');
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Update Alert';
      submitBtn.dataset.editId = alertId;

      // Add cancel button
      if (!document.getElementById('cancelEditBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className =
          'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600';
        cancelBtn.addEventListener('click', cancelEditAlert);
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
      }

      // Update form handler
      form.onsubmit = async e => {
        e.preventDefault();
        await updateAlert(alertId);
      };

      // Scroll to form
      form.scrollIntoView({ behavior: 'smooth' });
    } else {
      showStatusMessage('Failed to load alert data', 'error');
    }
  } catch (error) {
    console.error('❌ Failed to edit alert:', error);
    showStatusMessage('Failed to edit alert', 'error');
  }
}

/**
 * Update an existing alert
 */
async function updateAlert(alertId) {
  try {
    const form = document.getElementById('newAlertForm');

    const alertData = {
      fromCurrency: form.elements.fromCurrency.value,
      toCurrency: form.elements.toCurrency.value,
      type: form.elements.alertType.value,
      targetRate: parseFloat(form.elements.targetRate.value),
      label: form.elements.alertLabel.value
    };

    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'updateAlert',
      alertId,
      alertData
    });

    if (response && response.success) {
      showStatusMessage('Alert updated successfully!', 'success');
      cancelEditAlert();
      await loadAlertsContent();
    } else {
      showStatusMessage(response?.error || 'Failed to update alert', 'error');
    }
  } catch (error) {
    console.error('❌ Failed to update alert:', error);
    showStatusMessage('Failed to update alert', 'error');
  }
}

/**
 * Cancel alert editing
 */
function cancelEditAlert() {
  const form = document.getElementById('newAlertForm');
  form.reset();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Create Alert';
  delete submitBtn.dataset.editId;

  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) {
    cancelBtn.remove();
  }

  // Restore original form handler
  form.onsubmit = async e => {
    e.preventDefault();
    await createNewAlert();
  };
}

/**
 * Toggle alert active state
 */
async function toggleAlert(alertId) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'toggleAlert',
      alertId
    });

    if (response && response.success) {
      showStatusMessage('Alert status updated!', 'success');
      await loadAlertsContent();
    } else {
      showStatusMessage(response?.error || 'Failed to toggle alert', 'error');
    }
  } catch (error) {
    console.error('❌ Failed to toggle alert:', error);
    showStatusMessage('Failed to toggle alert', 'error');
  }
}

/**
 * Delete an alert
 */
async function deleteAlert(alertId) {
  if (!confirm('Are you sure you want to delete this alert?')) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'deleteAlert',
      alertId
    });

    if (response && response.success) {
      showStatusMessage('Alert deleted successfully!', 'success');
      await loadAlertsContent();
    } else {
      showStatusMessage(response?.error || 'Failed to delete alert', 'error');
    }
  } catch (error) {
    console.error('❌ Failed to delete alert:', error);
    showStatusMessage('Failed to delete alert', 'error');
  }
}

/**
 * Load and display alert settings
 */
async function loadAlertSettings() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'getSettings'
    });

    if (response && response.success) {
      const settings = response.settings;

      // Update UI with current settings
      document.getElementById('enableNotifications').checked =
        settings.enableNotifications;
      document.getElementById('enableSounds').checked = settings.enableSounds;
      document.getElementById('enableDailySummary').checked =
        settings.enableDailySummary;
      document.getElementById('enableWeeklySummary').checked =
        settings.enableWeeklySummary;
      document.getElementById('checkInterval').value = settings.checkInterval;
      document.getElementById('maxAlertsPerDay').value =
        settings.maxAlertsPerDay;
    }
  } catch (error) {
    console.error('❌ Failed to load alert settings:', error);
  }
}

/**
 * Save alert settings
 */
async function saveAlertSettings() {
  try {
    const settings = {
      enableNotifications: document.getElementById('enableNotifications')
        .checked,
      enableSounds: document.getElementById('enableSounds').checked,
      enableDailySummary: document.getElementById('enableDailySummary').checked,
      enableWeeklySummary: document.getElementById('enableWeeklySummary')
        .checked,
      checkInterval: parseInt(document.getElementById('checkInterval').value),
      maxAlertsPerDay: parseInt(
        document.getElementById('maxAlertsPerDay').value
      )
    };

    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'updateSettings',
      settings
    });

    if (response && response.success) {
      showStatusMessage('Alert settings saved!', 'success');
    } else {
      showStatusMessage(response?.error || 'Failed to save settings', 'error');
    }
  } catch (error) {
    console.error('❌ Failed to save alert settings:', error);
    showStatusMessage('Failed to save settings', 'error');
  }
}

/**
 * Load and display alert history
 */
async function loadAlertHistory() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'getHistory'
    });

    if (response && response.success) {
      displayAlertHistory(response.history || []);
    }
  } catch (error) {
    console.error('❌ Failed to load alert history:', error);
  }
}

/**
 * Display alert history
 */
function displayAlertHistory(history) {
  const historyContainer = document.getElementById('alertHistoryList');

  if (!history || history.length === 0) {
    historyContainer.innerHTML =
      '<p class="text-gray-500 text-center py-4">No alert history yet</p>';
    return;
  }

  historyContainer.innerHTML = history
    .slice(0, 10)
    .map(
      item => `
    <div class="history-item p-3 border-b border-gray-200 last:border-b-0">
      <div class="flex justify-between items-start">
        <div>
          <div class="font-medium text-sm">${item.fromCurrency} → ${item.toCurrency}</div>
          <div class="text-xs text-gray-600">Rate: ${item.rate} (Target: ${item.targetRate})</div>
          <div class="text-xs text-gray-500">${new Date(item.triggeredAt).toLocaleString()}</div>
        </div>
        <span class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
          ${item.alertType}
        </span>
      </div>
    </div>
  `
    )
    .join('');
}

/**
 * Load and display trend analysis
 */
async function loadTrendAnalysis() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'rateAlerts',
      subAction: 'getTrendAnalysis'
    });

    if (response && response.success) {
      displayTrendAnalysis(response.trends || {});
    }
  } catch (error) {
    console.error('❌ Failed to load trend analysis:', error);
  }
}

/**
 * Display trend analysis
 */
function displayTrendAnalysis(trends) {
  const trendsContainer = document.getElementById('trendAnalysisList');

  if (!trends || Object.keys(trends).length === 0) {
    trendsContainer.innerHTML =
      '<p class="text-gray-500 text-center py-4">No trend data available yet</p>';
    return;
  }

  trendsContainer.innerHTML = Object.entries(trends)
    .map(([pair, data]) => {
      const [from, to] = pair.split('-');
      const trend = data.trend || 0;
      const trendClass =
        trend > 0
          ? 'text-green-600'
          : trend < 0
            ? 'text-red-600'
            : 'text-gray-600';
      const trendIcon = trend > 0 ? '↗️' : trend < 0 ? '↘️' : '➡️';

      return `
      <div class="trend-item p-3 border rounded-lg">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-medium">${from} → ${to}</div>
            <div class="text-sm text-gray-600">
              Current: ${data.currentRate || 'N/A'}
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center space-x-1 ${trendClass}">
              <span>${trendIcon}</span>
              <span class="font-medium">${trend > 0 ? '+' : ''}${trend.toFixed(2)}%</span>
            </div>
            <div class="text-xs text-gray-500">
              ${data.dataPoints || 0} data points
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

/**
 * Setup alert settings event listeners
 */
function setupAlertSettings() {
  // Settings form
  const settingsForm = document.getElementById('alertSettingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async e => {
      e.preventDefault();
      await saveAlertSettings();
    });
  }

  // Individual setting changes
  [
    'enableNotifications',
    'enableSounds',
    'enableDailySummary',
    'enableWeeklySummary'
  ].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', saveAlertSettings);
    }
  });

  ['checkInterval', 'maxAlertsPerDay'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', saveAlertSettings);
    }
  });
}

// ============================================================================
// Phase 7, Task 7.1: Subscription Management Functions
// ============================================================================

/**
 * Setup subscription-related event listeners
 */
function setupSubscriptionEventListeners() {
  // Upgrade buttons
  const upgradeToPremium = document.getElementById('upgradeToPremium');
  const upgradeToPro = document.getElementById('upgradeToPro');

  if (upgradeToPremium) {
    upgradeToPremium.addEventListener('click', () =>
      handlePlanUpgrade('PREMIUM')
    );
  }

  if (upgradeToPro) {
    upgradeToPro.addEventListener('click', () => handlePlanUpgrade('PRO'));
  }

  // Donation buttons
  const donate5 = document.getElementById('donate5');
  const donate10 = document.getElementById('donate10');
  const donate25 = document.getElementById('donate25');

  if (donate5) {
    donate5.addEventListener('click', () => handleDonation(5));
  }
  if (donate10) {
    donate10.addEventListener('click', () => handleDonation(10));
  }
  if (donate25) {
    donate25.addEventListener('click', () => handleDonation(25));
  }

  // Subscription management
  const cancelSubscription = document.getElementById('cancelSubscription');
  if (cancelSubscription) {
    cancelSubscription.addEventListener('click', handleCancelSubscription);
  }

  // Add event listener for tab switching to subscription
  const subscriptionTab = document.querySelector(
    '[aria-controls="subscriptionPanel"]'
  );
  if (subscriptionTab) {
    subscriptionTab.addEventListener('click', () => {
      loadSubscriptionContent();
    });
  }
}

/**
 * Load and update subscription panel content
 */
async function loadSubscriptionContent() {
  if (!subscriptionManager) {
    console.error('Subscription manager not initialized');
    return;
  }

  try {
    // Get current subscription info
    const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
    const usageStats = subscriptionInfo.usageStats;
    const planDetails = subscriptionInfo.planDetails;

    // Update plan header
    updateCurrentPlanDisplay(planDetails);

    // Update usage statistics
    updateUsageDisplay(usageStats);

    // Update feature comparison
    updateFeatureComparison(planDetails);

    // Update payment providers
    await updatePaymentProviders();

    // Update subscription management section
    updateSubscriptionManagement(subscriptionInfo);

    // Check for usage warnings
    checkAndDisplayUsageWarnings();
  } catch (error) {
    console.error('Failed to load subscription content:', error);
    showStatusMessage('Failed to load subscription information', 'error');
  }
}

/**
 * Update current plan display
 */
function updateCurrentPlanDisplay(planDetails) {
  const planNameEl = document.getElementById('currentPlanName');
  const planDescEl = document.getElementById('currentPlanDescription');
  const planPriceEl = document.getElementById('currentPlanPrice');
  const planIntervalEl = document.getElementById('currentPlanInterval');

  if (planNameEl) {
    planNameEl.textContent = planDetails.name;
  }
  if (planDescEl) {
    planDescEl.textContent =
      planDetails.id === 'free'
        ? 'Basic features with limited usage'
        : planDetails.id === 'premium'
          ? 'Perfect for regular users'
          : 'For power users & businesses';
  }
  if (planPriceEl) {
    planPriceEl.textContent =
      planDetails.price === 0 ? '$0' : `$${planDetails.price}`;
  }
  if (planIntervalEl) {
    planIntervalEl.textContent = planDetails.interval || 'forever';
  }
}

/**
 * Update usage statistics display
 */
function updateUsageDisplay(usageStats) {
  // Daily conversions
  const conversionsUsage = document.getElementById('conversionsUsage');
  const conversionsProgress = document.getElementById('conversionsProgress');

  if (conversionsUsage && usageStats.dailyConversions) {
    const stats = usageStats.dailyConversions;
    conversionsUsage.textContent = `${stats.current} / ${stats.limit === 999999 ? '∞' : stats.limit}`;

    if (conversionsProgress) {
      conversionsProgress.style.width = `${Math.min(stats.percentage, 100)}%`;

      // Change color based on usage
      if (stats.percentage >= 90) {
        conversionsProgress.className =
          'bg-red-600 h-2 rounded-full transition-all duration-300';
      } else if (stats.percentage >= 70) {
        conversionsProgress.className =
          'bg-yellow-600 h-2 rounded-full transition-all duration-300';
      } else {
        conversionsProgress.className =
          'bg-primary-600 h-2 rounded-full transition-all duration-300';
      }
    }
  }

  // Currency pairs
  const currenciesUsage = document.getElementById('currenciesUsage');
  const currenciesProgress = document.getElementById('currenciesProgress');

  if (currenciesUsage && usageStats.currencyCount) {
    const stats = usageStats.currencyCount;
    currenciesUsage.textContent = `${stats.current} / ${stats.limit === 999 ? '∞' : stats.limit}`;

    if (currenciesProgress) {
      currenciesProgress.style.width = `${Math.min(stats.percentage, 100)}%`;
    }
  }

  // History entries
  const historyUsage = document.getElementById('historyUsage');
  const historyProgress = document.getElementById('historyProgress');

  if (historyUsage && usageStats.conversionHistory) {
    const stats = usageStats.conversionHistory;
    historyUsage.textContent = `${stats.current} / ${stats.limit === 999999 ? '∞' : stats.limit}`;

    if (historyProgress) {
      historyProgress.style.width = `${Math.min(stats.percentage, 100)}%`;
    }
  }
}

/**
 * Update feature comparison based on current plan
 */
function updateFeatureComparison(planDetails) {
  const comparisonEl = document.getElementById('featureComparison');
  if (!comparisonEl) {
    return;
  }

  const features = planDetails.features;

  comparisonEl.innerHTML = `
    <div class="flex items-center justify-between py-2 border-b border-gray-100">
      <span class="text-sm text-gray-700">Daily Conversions</span>
      <span class="text-sm font-medium text-gray-900">
        ${features.dailyConversions === 999999 ? 'Unlimited' : features.dailyConversions}
      </span>
    </div>
    <div class="flex items-center justify-between py-2 border-b border-gray-100">
      <span class="text-sm text-gray-700">Currency Pairs</span>
      <span class="text-sm font-medium text-gray-900">
        ${features.currencyCount === 999 ? 'Unlimited' : features.currencyCount}
      </span>
    </div>
    <div class="flex items-center justify-between py-2 border-b border-gray-100">
      <span class="text-sm text-gray-700">Rate Updates</span>
      <span class="text-sm font-medium text-gray-900">
        ${features.rateUpdates.charAt(0).toUpperCase() + features.rateUpdates.slice(1)}
      </span>
    </div>
    <div class="flex items-center justify-between py-2 border-b border-gray-100">
      <span class="text-sm text-gray-700">History</span>
      <span class="text-sm font-medium text-gray-900">
        ${features.conversionHistory === 999999 ? 'Unlimited' : features.conversionHistory + ' entries'}
      </span>
    </div>
    <div class="flex items-center justify-between py-2">
      <span class="text-sm text-gray-700">Rate Alerts</span>
      <span class="text-sm font-medium ${features.rateAlerts > 0 ? 'text-green-600' : 'text-red-600'}">
        ${features.rateAlerts > 0 ? `${features.rateAlerts} alerts` : '❌ Not available'}
      </span>
    </div>
  `;
}

/**
 * Update payment providers list
 */
async function updatePaymentProviders() {
  if (!subscriptionManager) {
    return;
  }

  const providersContainer = document.getElementById('paymentProviders');
  if (!providersContainer) {
    return;
  }

  try {
    const availableProviders =
      subscriptionManager.getAvailablePaymentProviders();

    if (availableProviders.length === 0) {
      providersContainer.innerHTML =
        '<p class="text-sm text-gray-500">No payment providers available for your region.</p>';
      return;
    }

    providersContainer.innerHTML = availableProviders
      .map(
        provider => `
      <div class="payment-provider-option">
        <input 
          type="radio" 
          id="provider_${provider.id}" 
          name="paymentProvider" 
          value="${provider.id}"
          class="mr-2"
        >
        <label for="provider_${provider.id}" class="text-sm font-medium">
          ${provider.name}
        </label>
      </div>
    `
      )
      .join('');

    // Select the first provider by default
    const firstProvider = document.querySelector(
      'input[name="paymentProvider"]'
    );
    if (firstProvider) {
      firstProvider.checked = true;
    }
  } catch (error) {
    console.error('Failed to load payment providers:', error);
    providersContainer.innerHTML =
      '<p class="text-sm text-red-500">Failed to load payment options.</p>';
  }
}

/**
 * Update subscription management section
 */
function updateSubscriptionManagement(subscriptionInfo) {
  const managementSection = document.getElementById('subscriptionManagement');
  const upgradeSection = document.getElementById('upgradeSection');

  if (!managementSection || !upgradeSection) {
    return;
  }

  if (subscriptionInfo.plan === 'FREE') {
    // Show upgrade options, hide management
    managementSection.classList.add('hidden');
    upgradeSection.classList.remove('hidden');
  } else {
    // Show management, hide upgrade options for current plan
    managementSection.classList.remove('hidden');

    // Update management info
    const statusEl = document.getElementById('subscriptionStatus');
    const nextBillingEl = document.getElementById('nextBilling');
    const paymentMethodEl = document.getElementById('paymentMethod');

    if (statusEl) {
      statusEl.textContent = subscriptionInfo.status || 'Active';
      statusEl.className =
        subscriptionInfo.status === 'active'
          ? 'text-sm font-medium text-green-600'
          : 'text-sm font-medium text-red-600';
    }

    if (nextBillingEl) {
      nextBillingEl.textContent = subscriptionInfo.endDate
        ? new Date(subscriptionInfo.endDate).toLocaleDateString()
        : '-';
    }

    if (paymentMethodEl) {
      paymentMethodEl.textContent = subscriptionInfo.paymentProvider || '-';
    }

    // Filter upgrade options
    const availableUpgrades = subscriptionInfo.availableUpgrades;
    if (availableUpgrades.length === 0) {
      upgradeSection.classList.add('hidden');
    } else {
      // Hide current plan upgrade button
      if (subscriptionInfo.plan === 'PREMIUM') {
        const premiumBtn = document.getElementById('upgradeToPremium');
        if (premiumBtn) {
          premiumBtn.closest('.plan-card').style.display = 'none';
        }
      }
    }
  }
}

/**
 * Check and display usage warnings
 */
function checkAndDisplayUsageWarnings() {
  if (!subscriptionManager) {
    return;
  }

  const warnings = subscriptionManager.getUsageWarnings();

  if (warnings.length > 0) {
    // Show warning notification
    const warningHtml = warnings
      .map(
        warning => `
      <div class="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
        <p class="text-sm text-yellow-800">
          ⚠️ <strong>${warning.feature}</strong>: ${warning.percentage}% used 
          (${warning.current}/${warning.limit})
        </p>
        ${
          warning.upgradeNeeded
            ? `
          <p class="text-xs text-yellow-700 mt-1">
            Consider upgrading to ${warning.upgradeNeeded} for more capacity.
          </p>
        `
            : ''
        }
      </div>
    `
      )
      .join('');

    // Insert warning at the top of subscription panel
    const subscriptionPanel = document.getElementById('subscriptionPanel');
    if (subscriptionPanel) {
      const existingWarning =
        subscriptionPanel.querySelector('.usage-warnings');
      if (existingWarning) {
        existingWarning.remove();
      }

      const warningDiv = document.createElement('div');
      warningDiv.className = 'usage-warnings';
      warningDiv.innerHTML = warningHtml;
      subscriptionPanel.insertBefore(warningDiv, subscriptionPanel.firstChild);
    }
  }
}

/**
 * Handle plan upgrade
 */
async function handlePlanUpgrade(planId) {
  if (!subscriptionManager) {
    showStatusMessage('Subscription system not available', 'error');
    return;
  }

  try {
    // Show payment section
    const paymentSection = document.getElementById('paymentSection');
    if (paymentSection) {
      paymentSection.classList.remove('hidden');
    }

    // Get selected payment provider
    const selectedProvider = document.querySelector(
      'input[name="paymentProvider"]:checked'
    );
    if (!selectedProvider) {
      showStatusMessage('Please select a payment method', 'error');
      return;
    }

    // Show loading state
    const upgradeBtn =
      planId === 'PREMIUM'
        ? document.getElementById('upgradeToPremium')
        : document.getElementById('upgradeToPro');

    if (upgradeBtn) {
      const originalText = upgradeBtn.textContent;
      upgradeBtn.textContent = 'Processing...';
      upgradeBtn.disabled = true;

      try {
        // Collect user info (you might want a form for this)
        const userInfo = {
          email: 'user@example.com', // In real app, get from user input
          firstName: 'User',
          lastName: 'Name'
        };

        const result = await subscriptionManager.upgradeSubscription(
          planId,
          selectedProvider.value,
          userInfo
        );

        if (result.success) {
          showStatusMessage(`Successfully upgraded to ${planId}!`, 'success');

          // Refresh subscription content
          await loadSubscriptionContent();

          // Update feature access across the app
          updateFeatureAccess();
        } else {
          throw new Error(result.error || 'Upgrade failed');
        }
      } finally {
        upgradeBtn.textContent = originalText;
        upgradeBtn.disabled = false;
      }
    }
  } catch (error) {
    console.error('Plan upgrade failed:', error);
    showStatusMessage('Upgrade failed: ' + error.message, 'error');
  }
}

/**
 * Handle donation
 */
async function handleDonation(amount) {
  if (!subscriptionManager) {
    showStatusMessage('Payment system not available', 'error');
    return;
  }

  try {
    // Get available payment providers
    const providers = subscriptionManager.getAvailablePaymentProviders();
    if (providers.length === 0) {
      showStatusMessage('No payment methods available', 'error');
      return;
    }

    // Use the first available provider for donation
    const result = await subscriptionManager.processOneTimePayment(
      amount,
      'USD',
      `Currency Converter Extension Donation - $${amount}`,
      providers[0].id
    );

    if (result.success) {
      showStatusMessage(`Thank you for your $${amount} donation!`, 'success');
    } else {
      throw new Error(result.error || 'Donation failed');
    }
  } catch (error) {
    console.error('Donation failed:', error);
    showStatusMessage('Donation failed: ' + error.message, 'error');
  }
}

/**
 * Handle subscription cancellation
 */
async function handleCancelSubscription() {
  if (!subscriptionManager) {
    showStatusMessage('Subscription system not available', 'error');
    return;
  }

  // Confirm cancellation
  const confirmed = confirm(
    'Are you sure you want to cancel your subscription? You will lose access to premium features.'
  );
  if (!confirmed) {
    return;
  }

  try {
    const result = await subscriptionManager.cancelSubscription();

    if (result.success) {
      showStatusMessage('Subscription cancelled successfully', 'success');

      // Refresh subscription content
      await loadSubscriptionContent();

      // Update feature access
      updateFeatureAccess();
    } else {
      throw new Error(result.error || 'Cancellation failed');
    }
  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    showStatusMessage('Cancellation failed: ' + error.message, 'error');
  }
}

/**
 * Update feature access throughout the app based on current subscription
 */
function updateFeatureAccess() {
  if (!subscriptionManager) {
    return;
  }

  const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
  const features = subscriptionInfo.planDetails.features;

  // Update feature badges and limitations in UI
  const featureBadges = document.querySelectorAll('.feature-badge');
  featureBadges.forEach(badge => {
    const feature = badge.dataset.feature;
    if (feature && features[feature] !== undefined) {
      const limit = features[feature];
      if (typeof limit === 'number' && limit < 999) {
        badge.textContent = `${subscriptionInfo.plan}: ${limit} max`;
      } else if (typeof limit === 'boolean') {
        badge.textContent = limit
          ? `${subscriptionInfo.plan}: Available`
          : 'Premium only';
      } else {
        badge.textContent = `${subscriptionInfo.plan}: ${limit}`;
      }
    }
  });

  // Update currency limit display
  const currencySection = document.getElementById('additionalCurrencies');
  if (currencySection) {
    const addButton = document.getElementById('addCurrency');
    const currentCount = document.querySelectorAll('.currency-item').length;
    const limit = features.currencyCount;

    if (addButton) {
      if (currentCount >= limit && limit < 999) {
        addButton.disabled = true;
        addButton.textContent = `Limit reached (${limit})`;
      } else {
        addButton.disabled = false;
        addButton.textContent = '+ Add Currency';
      }
    }
  }

  console.log(`🔐 Feature access updated for ${subscriptionInfo.plan} plan`);
}

/**
 * Check feature access before performing actions
 */
function checkFeatureAccess(featureName, amount = 1) {
  if (!subscriptionManager) {
    return { allowed: false, reason: 'Subscription system not available' };
  }

  return subscriptionManager.canPerformAction(featureName, amount);
}

/**
 * Track feature usage
 */
async function trackFeatureUsage(featureName, amount = 1) {
  if (subscriptionManager) {
    await subscriptionManager.trackUsage(featureName, amount);

    // Update usage display if subscription panel is visible
    const subscriptionPanel = document.getElementById('subscriptionPanel');
    if (subscriptionPanel && !subscriptionPanel.classList.contains('hidden')) {
      await loadSubscriptionContent();
    }
  }
}

// Initialize subscription content when tab is first opened
document.addEventListener('DOMContentLoaded', () => {
  // Load subscription content when tab becomes active
  const observer = new window.MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'class'
      ) {
        const subscriptionPanel = document.getElementById('subscriptionPanel');
        if (
          subscriptionPanel &&
          !subscriptionPanel.classList.contains('hidden')
        ) {
          loadSubscriptionContent();
        }
      }
    });
  });

  const subscriptionPanel = document.getElementById('subscriptionPanel');
  if (subscriptionPanel) {
    observer.observe(subscriptionPanel, { attributes: true });
  }
});
