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

// Phase 6, Task 6.2: Conversion History
let currentActiveTab = 'settings';

// State management
let currentSettings = { ...DEFAULT_SETTINGS };
let userPlan = 'FREE'; // TODO: Implement plan detection
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

  // Setup conversion testing currency selectors
  setupConversionTestingCurrencies();

  // Phase 6, Task 6.2: Setup new functionality
  setupAddFavoriteForm();
  setupHistoryManagement();
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

function updateFeatureAccess() {
  const features = FEATURES[userPlan];

  // Update additional currencies limit
  const maxCurrencies = features.maxCurrencies;
  const currentCount = currentSettings.additionalCurrencies.length;

  const addButton = document.getElementById('addCurrency');
  if (currentCount >= maxCurrencies) {
    addButton.disabled = true;
    addButton.textContent = `Maximum ${maxCurrencies} currencies`;
    addButton.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    // Re-enable the button when under the limit
    addButton.disabled = false;
    addButton.textContent = '+ Add Currency';
    addButton.classList.remove('opacity-50', 'cursor-not-allowed');
  }

  // Update premium features
  const premiumFeatures = ['autoConvert', 'showNotifications'];
  premiumFeatures.forEach(featureId => {
    const element = document.getElementById(featureId);
    if (userPlan !== 'PREMIUM') {
      element.disabled = true;
      element.classList.add('opacity-50', 'cursor-not-allowed');
    }
  });
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
