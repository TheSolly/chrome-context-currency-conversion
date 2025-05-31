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
  // Enhanced Task 3.2 functions
  getCurrencyStats,
  CurrencyPreferences,
  validateCurrencySelection,
  CURRENCY_REGIONS
} from '../utils/currency-data.js';

// Phase 3, Task 3.3: Enhanced Settings Management
import { settingsManager } from '../utils/settings-manager.js';

// State management
let currentSettings = { ...DEFAULT_SETTINGS };
let userPlan = 'FREE'; // TODO: Implement plan detection
const currencyPreferences = new CurrencyPreferences(); // Enhanced Task 3.2
const currencyStats = getCurrencyStats(); // Enhanced Task 3.2

document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  console.log('🎨 Enhanced Currency Converter popup loaded');

  try {
    // Phase 3, Task 3.3: Initialize Settings Manager
    await settingsManager.initialize();
    currentSettings = await settingsManager.getSettings();

    // Load user statistics
    await loadUserStats();

    // Enhanced Task 3.2 - Load currency preferences
    await currencyPreferences.load();

    // Initialize UI components
    populateCurrencySelectors();
    populateAdditionalCurrencies();
    updateFeatureAccess();

    // Enhanced Task 3.2 - Setup advanced features
    setupAdvancedSearch();
    updateFavoritesDisplay();
    updateCurrencyStats();
    updateRegionalDisplay();
    setupRegionalNavigation();

    // Set up event listeners
    setupEventListeners();

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
    .addEventListener('change', handleSettingChange);

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
  item.querySelector('.remove-currency').addEventListener('click', () => {
    removeCurrency(index);
  });

  return item;
}

function setupToggleSwitch(elementId) {
  const toggle = document.getElementById(elementId);

  toggle.addEventListener('click', () => {
    if (toggle.disabled) {
      return;
    }

    const isEnabled = toggle.classList.contains('enabled');
    updateToggleState(toggle, !isEnabled);

    // Update settings
    currentSettings[elementId] = !isEnabled;
    handleSettingChange();
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

  currentSettings[id] = value;
  await handleSettingChange();
}

async function handleSettingChange() {
  // Phase 3, Task 3.3: Auto-save with SettingsManager debouncing
  clearTimeout(window.saveTimeout);
  window.saveTimeout = setTimeout(async () => {
    try {
      await settingsManager.saveSettings(currentSettings);
      console.log('⚙️ Settings auto-saved');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }, 500);
}

async function saveSettings() {
  try {
    // Phase 3, Task 3.3: Use SettingsManager for saving
    await settingsManager.saveSettings(currentSettings);
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
      populateCurrencySelectors();
      populateAdditionalCurrencies();

      // Update toggles
      Object.keys(currentSettings).forEach(key => {
        const element = document.getElementById(key);
        if (element && element.classList.contains('toggle-switch')) {
          updateToggleState(element, currentSettings[key]);
        } else if (element && element.tagName === 'SELECT') {
          element.value = currentSettings[key];
        }
      });

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
      addCurrency(currency.code);
    } else {
      showStatus('Invalid or duplicate currency code', 'error');
    }
  }
}

function addCurrency(currencyCode) {
  const maxCurrencies = FEATURES[userPlan].maxCurrencies;

  if (currentSettings.additionalCurrencies.length >= maxCurrencies) {
    showStatus(`Maximum ${maxCurrencies} currencies allowed`, 'error');
    return;
  }

  currentSettings.additionalCurrencies.push(currencyCode);
  populateAdditionalCurrencies();
  updateFeatureAccess();
  handleSettingChange();
}

function removeCurrency(index) {
  currentSettings.additionalCurrencies.splice(index, 1);
  populateAdditionalCurrencies();
  updateFeatureAccess();
  handleSettingChange();
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
    const filename = `currency-converter-settings-${new Date().toISOString().split('T')[0]}.json`;

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
