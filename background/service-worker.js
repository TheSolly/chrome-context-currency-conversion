// Background Service Worker for Currency Converter Extension
// Handles context menu creation and currency conversion logic

// Initialize context menu when extension is installed or enabled
chrome.runtime.onInstalled.addListener(() => {
  console.log('Currency Converter Extension installed');

  // Create context menu item
  chrome.contextMenus.create({
    id: 'convertCurrency',
    title: 'Convert Currency',
    contexts: ['selection'],
    visible: false // Initially hidden, will be shown when currency is detected
  });
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'convertCurrency') {
    handleCurrencyConversion(info, tab);
  }
});

// Handle currency conversion
async function handleCurrencyConversion(info, tab) {
  const selectedText = info.selectionText;
  console.log('Converting currency for:', selectedText);

  try {
    // Get user's currency preferences
    const settings = await chrome.storage.sync.get([
      'baseCurrency',
      'secondaryCurrency'
    ]);
    const baseCurrency = settings.baseCurrency || 'USD';
    const secondaryCurrency = settings.secondaryCurrency || 'EUR';

    // TODO: Extract currency amount and type from selected text
    // TODO: Call conversion API
    // TODO: Show conversion result

    // For now, just log the action
    console.log('Converting from', baseCurrency, 'to', secondaryCurrency);

    // Send message to content script to show conversion result
    chrome.tabs.sendMessage(tab.id, {
      action: 'showConversionResult',
      originalText: selectedText,
      baseCurrency,
      secondaryCurrency
    });
  } catch (error) {
    console.error('Currency conversion failed:', error);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateContextMenu') {
    updateContextMenu(request.hasCurrency, request.currencyInfo);
  }

  if (request.action === 'convertCurrency') {
    // Handle conversion request from content script
    performCurrencyConversion(request.currencyData)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
});

// Update context menu visibility based on currency detection
function updateContextMenu(hasCurrency, currencyInfo) {
  chrome.contextMenus.update('convertCurrency', {
    visible: hasCurrency,
    title: hasCurrency
      ? `Convert ${currencyInfo?.amount} ${currencyInfo?.currency}`
      : 'Convert Currency'
  });
}

// Placeholder for actual currency conversion logic
async function performCurrencyConversion(currencyData) {
  // TODO: Implement actual API call and conversion logic
  return {
    originalAmount: currencyData.amount,
    originalCurrency: currencyData.currency,
    convertedAmount: (currencyData.amount * 1.1).toFixed(2), // Placeholder calculation
    convertedCurrency: 'EUR',
    exchangeRate: 1.1,
    timestamp: new Date().toISOString()
  };
}
