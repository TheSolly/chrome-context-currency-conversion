// Popup Script for Currency Converter Extension
// Handles settings UI and user preferences

document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  console.log('Currency Converter popup loaded');

  // Load saved settings
  await loadSettings();

  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Save button
  const saveButton = document.getElementById('saveSettings');
  saveButton.addEventListener('click', saveSettings);

  // Currency selects - auto-save on change
  const baseCurrencySelect = document.getElementById('baseCurrency');
  const secondaryCurrencySelect = document.getElementById('secondaryCurrency');

  baseCurrencySelect.addEventListener('change', handleCurrencyChange);
  secondaryCurrencySelect.addEventListener('change', handleCurrencyChange);

  // Footer links
  document.getElementById('rateUs').addEventListener('click', handleRateUs);
  document.getElementById('support').addEventListener('click', handleSupport);
}

async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'baseCurrency',
      'secondaryCurrency'
    ]);

    // Set default values if not found
    const baseCurrency = settings.baseCurrency || 'USD';
    const secondaryCurrency = settings.secondaryCurrency || 'EUR';

    // Update UI
    document.getElementById('baseCurrency').value = baseCurrency;
    document.getElementById('secondaryCurrency').value = secondaryCurrency;

    console.log('Settings loaded:', { baseCurrency, secondaryCurrency });
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatusMessage('Failed to load settings', 'error');
  }
}

async function saveSettings() {
  try {
    const baseCurrency = document.getElementById('baseCurrency').value;
    const secondaryCurrency =
      document.getElementById('secondaryCurrency').value;

    // Validate that currencies are different
    if (baseCurrency === secondaryCurrency) {
      showStatusMessage(
        'Base and secondary currencies must be different',
        'error'
      );
      return;
    }

    // Save to Chrome storage
    await chrome.storage.sync.set({
      baseCurrency: baseCurrency,
      secondaryCurrency: secondaryCurrency
    });

    console.log('Settings saved:', { baseCurrency, secondaryCurrency });

    // Visual feedback
    const saveButton = document.getElementById('saveSettings');
    saveButton.classList.add('saving');
    saveButton.textContent = 'Saved!';

    showStatusMessage('Settings saved successfully!', 'success');

    // Reset button after animation
    setTimeout(() => {
      saveButton.classList.remove('saving');
      saveButton.textContent = 'Save Settings';
    }, 1500);
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatusMessage('Failed to save settings', 'error');
  }
}

function handleCurrencyChange() {
  // Auto-validate when currencies change
  const baseCurrency = document.getElementById('baseCurrency').value;
  const secondaryCurrency = document.getElementById('secondaryCurrency').value;

  if (baseCurrency === secondaryCurrency) {
    showStatusMessage(
      'Base and secondary currencies must be different',
      'error'
    );
  } else {
    hideStatusMessage();
  }
}

function showStatusMessage(message, type = 'success') {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      hideStatusMessage();
    }, 3000);
  }
}

function hideStatusMessage() {
  const statusElement = document.getElementById('statusMessage');
  statusElement.style.display = 'none';
  statusElement.className = 'status-message';
}

function handleRateUs(event) {
  event.preventDefault();
  // Open Chrome Web Store page for rating (will be available after publishing)
  chrome.tabs.create({
    url: 'https://chrome.google.com/webstore/detail/currency-converter/YOUR_EXTENSION_ID/reviews'
  });
}

function handleSupport(event) {
  event.preventDefault();
  // Open support page or email
  chrome.tabs.create({
    url: 'mailto:support@currencyconverter.com?subject=Currency%20Converter%20Support'
  });
}

// Add keyboard shortcuts
document.addEventListener('keydown', event => {
  // Ctrl/Cmd + S to save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    saveSettings();
  }

  // ESC to close popup
  if (event.key === 'Escape') {
    window.close();
  }
});

// Add analytics/tracking (placeholder)
function trackEvent(action, category = 'popup') {
  console.log('Analytics:', { category, action });
  // TODO: Implement analytics tracking
}

// Track popup open
trackEvent('open');

// Track when settings are changed
document.getElementById('baseCurrency').addEventListener('change', () => {
  trackEvent('base_currency_changed');
});

document.getElementById('secondaryCurrency').addEventListener('change', () => {
  trackEvent('secondary_currency_changed');
});
