/**
 * CurrencySelector Component
 * Creates currency selection dropdown elements
 */

import {
  CURRENCY_LIST,
  getPopularCurrencies,
  getCurrencyByCode
} from '../../utils/currency-data.js';

/**
 * Create a currency selector dropdown
 * @param {Object} options - Selector options
 * @param {string} options.id - Unique identifier
 * @param {string} options.label - Label text
 * @param {string} [options.description] - Screen reader description
 * @param {string} [options.value] - Initially selected currency code
 * @param {boolean} [options.showPopularFirst=true] - Show popular currencies first
 * @param {boolean} [options.showFlags=true] - Show flag emojis
 * @param {Function} [options.onChange] - Callback when selection changes
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} The selector container element
 */
export function createCurrencySelector({
  id,
  label,
  description = '',
  value = '',
  showPopularFirst = true,
  showFlags = true,
  onChange = null,
  className = ''
}) {
  const container = document.createElement('div');
  container.className = 'setting-group';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.className = 'block text-sm font-medium text-gray-700 mb-1';
  labelEl.textContent = label;

  const select = document.createElement('select');
  select.id = id;
  select.className = `currency-select ${className}`.trim();
  select.setAttribute('aria-required', 'true');

  if (description) {
    const descId = `${id}-desc`;
    select.setAttribute('aria-describedby', descId);

    const descEl = document.createElement('div');
    descEl.id = descId;
    descEl.className = 'sr-only';
    descEl.textContent = description;
    container.appendChild(descEl);
  }

  // Populate options
  populateCurrencyOptions(select, { showPopularFirst, showFlags, value });

  // Event handler
  select.addEventListener('change', () => {
    if (onChange) {
      const selectedCurrency = getCurrencyByCode(select.value);
      onChange(select.value, selectedCurrency);
    }
  });

  container.appendChild(labelEl);
  container.appendChild(select);

  // Expose methods for external control
  container.selector = {
    getValue: () => select.value,
    setValue: newValue => {
      select.value = newValue;
    },
    getSelectedCurrency: () => getCurrencyByCode(select.value),
    refresh: () =>
      populateCurrencyOptions(select, {
        showPopularFirst,
        showFlags,
        value: select.value
      })
  };

  return container;
}

/**
 * Populate a select element with currency options
 * @param {HTMLSelectElement} select - The select element
 * @param {Object} options - Population options
 */
function populateCurrencyOptions(
  select,
  { showPopularFirst, showFlags, value }
) {
  select.innerHTML = '';

  if (showPopularFirst) {
    // Add popular currencies group
    const popularGroup = document.createElement('optgroup');
    popularGroup.label = 'Popular Currencies';

    const popularCurrencies = getPopularCurrencies();
    popularCurrencies.forEach(currency => {
      const option = createCurrencyOption(currency, showFlags);
      popularGroup.appendChild(option);
    });

    select.appendChild(popularGroup);

    // Add all currencies group
    const allGroup = document.createElement('optgroup');
    allGroup.label = 'All Currencies';

    const popularCodes = new Set(popularCurrencies.map(c => c.code));
    CURRENCY_LIST.filter(c => !popularCodes.has(c.code)).forEach(currency => {
      const option = createCurrencyOption(currency, showFlags);
      allGroup.appendChild(option);
    });

    select.appendChild(allGroup);
  } else {
    // Just add all currencies
    CURRENCY_LIST.forEach(currency => {
      const option = createCurrencyOption(currency, showFlags);
      select.appendChild(option);
    });
  }

  // Set initial value
  if (value) {
    select.value = value;
  }
}

/**
 * Create a single currency option element
 * @param {Object} currency - Currency data
 * @param {boolean} showFlags - Whether to show flag emoji
 * @returns {HTMLOptionElement}
 */
function createCurrencyOption(currency, showFlags) {
  const option = document.createElement('option');
  option.value = currency.code;

  const flag = showFlags && currency.flag ? `${currency.flag} ` : '';
  option.textContent = `${flag}${currency.code} - ${currency.name}`;

  return option;
}

/**
 * Create a compact currency selector for forms
 * @param {Object} options - Selector options
 * @param {string} options.id - Unique identifier
 * @param {string} options.label - Label text
 * @param {string} [options.value] - Initially selected value
 * @param {Function} [options.onChange] - Change callback
 * @returns {HTMLElement} The selector container
 */
export function createCompactCurrencySelector({
  id,
  label,
  value = '',
  onChange = null
}) {
  const container = document.createElement('div');

  const labelEl = document.createElement('label');
  labelEl.className = 'block text-xs font-medium text-gray-700 mb-1';
  labelEl.textContent = label;

  const select = document.createElement('select');
  select.id = id;
  select.className =
    'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  populateCurrencyOptions(select, {
    showPopularFirst: true,
    showFlags: true,
    value
  });

  select.addEventListener('change', () => {
    if (onChange) {
      const selectedCurrency = getCurrencyByCode(select.value);
      onChange(select.value, selectedCurrency);
    }
  });

  container.appendChild(labelEl);
  container.appendChild(select);

  container.selector = {
    getValue: () => select.value,
    setValue: newValue => {
      select.value = newValue;
    }
  };

  return container;
}
