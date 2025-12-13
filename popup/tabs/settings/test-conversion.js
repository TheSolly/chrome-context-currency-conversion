/**
 * Test Conversion Module
 * Handles test conversion functionality in settings
 */

import {
  getPopularCurrencies,
  getAllCurrencies
} from '/utils/currency-data.js';

/**
 * Setup conversion testing currency selectors
 * @param {Object} currentSettings - Current settings object
 */
export function setupConversionTestingCurrencies(currentSettings) {
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
  fromSelect.value = currentSettings.baseCurrency || 'USD';
  toSelect.value = currentSettings.secondaryCurrency || 'EUR';
}

/**
 * Perform test conversion
 * @param {Object} options - Conversion options
 * @param {Object} options.subscriptionManager - Subscription manager instance
 * @param {Function} options.showStatus - Function to show status messages
 * @returns {Promise<Object>} Conversion result
 */
export async function performTestConversion({
  subscriptionManager,
  showStatus
}) {
  const fromSelect = document.getElementById('testFromCurrency');
  const toSelect = document.getElementById('testToCurrency');
  const amountInput = document.getElementById('testAmount');

  if (!fromSelect || !toSelect || !amountInput) {
    return { error: 'Test conversion form not found' };
  }

  const fromCurrency = fromSelect.value;
  const toCurrency = toSelect.value;
  const amount = parseFloat(amountInput.value) || 100;

  if (fromCurrency === toCurrency) {
    return { error: 'Please select different currencies for testing' };
  }

  // Check subscription limits before performing test conversion
  if (subscriptionManager) {
    const canConvert = subscriptionManager.canPerformAction(
      'dailyConversions',
      1
    );
    if (!canConvert.allowed) {
      return {
        error:
          canConvert.reason === 'limit_exceeded'
            ? 'Daily limit reached'
            : 'Feature not available'
      };
    }
  }

  try {
    showStatus('Performing test conversion...', 'info');

    // Import API service dynamically
    const { exchangeRateService } = await import('/utils/api-service.js');

    // Get exchange rate
    const rateData = await exchangeRateService.getExchangeRate(
      fromCurrency,
      toCurrency
    );

    if (!rateData || !rateData.rate) {
      throw new Error('Failed to get exchange rate');
    }

    const convertedAmount = amount * rateData.rate;

    // Display result
    displayTestResult({
      amount,
      fromCurrency,
      toCurrency,
      convertedAmount,
      rate: rateData.rate
    });

    // Track the test conversion
    await trackTestConversion({
      subscriptionManager,
      fromCurrency,
      toCurrency,
      amount,
      convertedAmount,
      rate: rateData.rate
    });

    return {
      success: true,
      fromCurrency,
      toCurrency,
      amount,
      convertedAmount,
      rate: rateData.rate
    };
  } catch (error) {
    console.error('Test conversion failed:', error);
    return { error: `Test conversion failed: ${error.message}` };
  }
}

/**
 * Display test conversion result
 * @param {Object} result - Conversion result
 */
function displayTestResult({
  amount,
  fromCurrency,
  toCurrency,
  convertedAmount,
  rate
}) {
  const resultDiv = document.getElementById('testConversionResult');
  if (!resultDiv) return;

  resultDiv.innerHTML = `
    <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
      <div class="text-sm font-medium text-green-800">
        ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}
      </div>
      <div class="text-xs text-green-600 mt-1">
        Rate: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}
      </div>
    </div>
  `;
}

/**
 * Track test conversion for subscription and history
 * @param {Object} data - Conversion data
 */
async function trackTestConversion({
  subscriptionManager,
  fromCurrency,
  toCurrency,
  amount,
  convertedAmount,
  rate
}) {
  // Track for subscription
  if (subscriptionManager) {
    try {
      await subscriptionManager.trackUsage('dailyConversions', 1);
      console.log('Test conversion tracked for subscription');
    } catch (error) {
      console.warn('Failed to track test conversion:', error);
    }
  }

  // Add to conversion history
  try {
    const { ConversionHistory } = await import('/utils/conversion-history.js');
    const conversionHistory = new ConversionHistory();
    await conversionHistory.initialize();

    await conversionHistory.addConversion({
      fromCurrency,
      toCurrency,
      originalAmount: amount,
      convertedAmount,
      exchangeRate: rate,
      timestamp: Date.now(),
      source: 'settings-test',
      confidence: 1.0,
      webpage: null
    });

    console.log('Test conversion added to history');
  } catch (error) {
    console.warn('Failed to add test conversion to history:', error);
  }
}

/**
 * Setup test conversion button event listener
 * @param {Object} options - Setup options
 * @param {Object} options.subscriptionManager - Subscription manager
 * @param {Function} options.showStatus - Status display function
 */
export function setupTestConversionButton({ subscriptionManager, showStatus }) {
  const testConversionBtn = document.getElementById('testConversion');
  if (!testConversionBtn) return;

  testConversionBtn.addEventListener('click', async () => {
    const result = await performTestConversion({
      subscriptionManager,
      showStatus
    });

    if (result.error) {
      showStatus(result.error, 'error');
    } else {
      showStatus('Test conversion completed successfully', 'success');
    }
  });
}
