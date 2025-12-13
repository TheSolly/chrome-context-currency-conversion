/**
 * Currency Configuration Module
 * Handles currency selectors and additional currencies management
 */

import {
  getPopularCurrencies,
  getAllCurrencies,
  getCurrencyByCode,
  FEATURES
} from '/utils/currency-data.js';

/**
 * Populate currency selectors with options
 * @param {Object} currentSettings - Current settings object
 */
export function populateCurrencySelectors(currentSettings) {
  const popularCurrencies = getPopularCurrencies();
  const allCurrencies = getAllCurrencies();

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
  const secondaryCurrencySelect = document.getElementById('secondaryCurrency');
  if (secondaryCurrencySelect) {
    secondaryCurrencySelect.innerHTML = baseCurrencySelect.innerHTML;
  }

  // Set current values
  baseCurrencySelect.value = currentSettings.baseCurrency;
  if (secondaryCurrencySelect) {
    secondaryCurrencySelect.value = currentSettings.secondaryCurrency;
  }
}

/**
 * Populate additional currencies display
 * @param {Object} currentSettings - Current settings object
 * @param {Function} onRemove - Callback for currency removal
 */
export function populateAdditionalCurrencies(currentSettings, onRemove) {
  const container = document.getElementById('additionalCurrencies');
  if (!container) return;

  container.innerHTML = '';

  currentSettings.additionalCurrencies.forEach((currencyCode, index) => {
    const currency = getCurrencyByCode(currencyCode);
    if (currency) {
      const item = createCurrencyItem(currency, index, onRemove);
      container.appendChild(item);
    }
  });
}

/**
 * Create currency item element
 * @param {Object} currency - Currency data
 * @param {number} index - Index in the list
 * @param {Function} onRemove - Callback for removal
 * @returns {HTMLElement}
 */
function createCurrencyItem(currency, index, onRemove) {
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

  item.querySelector('.remove-currency').addEventListener('click', () => {
    onRemove(index);
  });

  return item;
}

/**
 * Validate currency change (prevent same currency for base and secondary)
 * @param {string} id - Element ID (baseCurrency or secondaryCurrency)
 * @param {string} value - New currency code
 * @param {Object} currentSettings - Current settings
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCurrencyChange(id, value, currentSettings) {
  if (id === 'baseCurrency' && value === currentSettings.secondaryCurrency) {
    return {
      valid: false,
      error: 'Base and secondary currencies cannot be the same'
    };
  }

  if (id === 'secondaryCurrency' && value === currentSettings.baseCurrency) {
    return {
      valid: false,
      error: 'Base and secondary currencies cannot be the same'
    };
  }

  return { valid: true };
}

/**
 * Check if a currency can be added
 * @param {string} currencyCode - Currency code to add
 * @param {Object} currentSettings - Current settings
 * @param {Object} subscriptionManager - Subscription manager instance
 * @returns {{ allowed: boolean, error?: string }}
 */
export function canAddCurrency(
  currencyCode,
  currentSettings,
  subscriptionManager
) {
  // Check free tier limit
  const maxAdd = FEATURES.FREE.maxCurrencies;
  if (currentSettings.additionalCurrencies.length >= maxAdd) {
    return {
      allowed: false,
      error: `Free plan allows only ${maxAdd} additional currencies`
    };
  }

  // Validate currency code
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) {
    return { allowed: false, error: 'Invalid currency code' };
  }

  // Check if already added
  if (currentSettings.additionalCurrencies.includes(currencyCode)) {
    return { allowed: false, error: 'Currency already added' };
  }

  // Check subscription limits
  if (subscriptionManager) {
    const canAdd = subscriptionManager.canPerformAction('currencyCount', 1);
    if (!canAdd.allowed) {
      return {
        allowed: false,
        error:
          canAdd.reason === 'limit_exceeded'
            ? 'Plan limit reached'
            : 'Feature not available'
      };
    }
  }

  return { allowed: true };
}

/**
 * Show add currency dialog
 * @param {Object} currentSettings - Current settings
 * @param {Function} onAdd - Callback when currency is added
 */
export function showAddCurrencyDialog(currentSettings, onAdd) {
  const maxAdd = FEATURES.FREE.maxCurrencies;
  if (currentSettings.additionalCurrencies.length >= maxAdd) {
    return { error: `Free plan allows only ${maxAdd} additional currencies` };
  }

  const availableCurrencies = getAllCurrencies().filter(
    currency =>
      !currentSettings.additionalCurrencies.includes(currency.code) &&
      currency.code !== currentSettings.baseCurrency &&
      currency.code !== currentSettings.secondaryCurrency
  );

  if (availableCurrencies.length === 0) {
    return { error: 'All currencies are already added' };
  }

  const currencyCode = prompt('Enter currency code (e.g., GBP):');
  if (currencyCode) {
    onAdd(currencyCode.toUpperCase());
  }

  return { success: true };
}
