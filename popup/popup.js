// Enhanced Popup Script for Currency Converter Extension
// Handles modern settings UI and user preferences

import {
  getPopularCurrencies,
  getAllCurrencies,
  getCurrencyByCode,
  formatCurrencyOption,
  DEFAULT_SETTINGS,
  FEATURES
} from '../utils/currency-data.js';

// State management
let currentSettings = { ...DEFAULT_SETTINGS };
let userPlan = 'FREE'; // TODO: Implement plan detection

document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  console.log('🎨 Enhanced Currency Converter popup loaded');

  try {
    // Load saved settings and user data
    await loadSettings();
    await loadUserStats();

    // Initialize UI components
    populateCurrencySelectors();
    populateAdditionalCurrencies();
    updateFeatureAccess();

    // Set up event listeners
    setupEventListeners();

    console.log('✅ Popup initialization complete');
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

async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(
      Object.keys(DEFAULT_SETTINGS)
    );

    // Merge with defaults
    currentSettings = { ...DEFAULT_SETTINGS, ...settings };

    console.log('📊 Settings loaded:', currentSettings);
  } catch (error) {
    console.error('❌ Failed to load settings:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

async function loadUserStats() {
  try {
    const stats = await chrome.storage.local.get([
      'conversionCount',
      'userPlan'
    ]);

    // Update conversion count
    const countElement = document.getElementById('conversionCount');
    countElement.textContent = stats.conversionCount || 0;

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
  // Auto-save settings with debouncing
  clearTimeout(window.saveTimeout);
  window.saveTimeout = setTimeout(async () => {
    await saveSettingsToStorage();
  }, 500);
}

async function saveSettings() {
  try {
    await saveSettingsToStorage();
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('❌ Failed to save settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

async function saveSettingsToStorage() {
  try {
    await chrome.storage.sync.set(currentSettings);

    // Notify background script of settings change
    chrome.runtime.sendMessage({
      type: 'SETTINGS_CHANGED',
      settings: currentSettings
    });

    console.log('💾 Settings saved:', currentSettings);
  } catch (error) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }
}

async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    currentSettings = { ...DEFAULT_SETTINGS };

    // Update UI
    populateCurrencySelectors();
    populateAdditionalCurrencies();

    // Update toggles
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      const element = document.getElementById(key);
      if (element && element.classList.contains('toggle-switch')) {
        updateToggleState(element, DEFAULT_SETTINGS[key]);
      } else if (element && element.tagName === 'SELECT') {
        element.value = DEFAULT_SETTINGS[key];
      }
    });

    await saveSettings();
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
