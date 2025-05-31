// Enhanced background service worker for Task 2.2
// Handles context menu creation and currency conversion logic with improved error handling

// Global state management
let currentCurrencyInfo = null;
const errorLog = [];

// Error logging function
function logError(error, context, additionalData = null) {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    context,
    message: error.message || error,
    stack: error.stack,
    additionalData
  };

  errorLog.push(errorEntry);

  // Keep only last 50 errors to prevent memory bloat
  if (errorLog.length > 50) {
    errorLog.shift();
  }

  console.error(`[${context}]`, error, additionalData);
}

// Initialize context menu when extension is installed or enabled
chrome.runtime.onInstalled.addListener(() => {
  console.log('Currency Converter Extension installed');

  // Create context menu item with enhanced configuration
  chrome.contextMenus.create({
    id: 'convertCurrency',
    title: 'Convert Currency',
    contexts: ['selection'],
    visible: false, // Initially hidden, will be shown when currency is detected
    documentUrlPatterns: ['http://*/*', 'https://*/*'] // Only show on web pages
  });
});

// Listen for context menu clicks with enhanced error handling
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'convertCurrency') {
    handleCurrencyConversion(info, tab).catch(error => {
      console.error('Error handling currency conversion:', error);
      logError(error, 'contextMenuClick', { info, tabId: tab?.id });
    });
  }
});

// Enhanced currency conversion handler
async function handleCurrencyConversion(info, tab) {
  const selectedText = info.selectionText;
  console.log('Converting currency for:', selectedText);

  try {
    // Get user's currency preferences with fallbacks
    const settings = await chrome.storage.sync
      .get(['baseCurrency', 'secondaryCurrency'])
      .catch(() => ({})); // Fallback to empty object if storage fails

    const baseCurrency = settings.baseCurrency || 'USD';
    const secondaryCurrency = settings.secondaryCurrency || 'EUR';

    // Use current currency info if available
    const conversionData = {
      originalText: selectedText,
      baseCurrency,
      secondaryCurrency,
      currencyInfo: currentCurrencyInfo,
      timestamp: new Date().toISOString()
    };

    console.log(
      'Converting from',
      baseCurrency,
      'to',
      secondaryCurrency,
      'with data:',
      conversionData
    );

    // Send enhanced message to content script
    if (tab?.id) {
      chrome.tabs
        .sendMessage(tab.id, {
          action: 'showConversionResult',
          ...conversionData
        })
        .catch(error => {
          console.warn('Failed to send message to tab:', error);
        });
    }
  } catch (error) {
    console.error('Currency conversion failed:', error);
    logError(error, 'handleCurrencyConversion', {
      selectedText,
      tabId: tab?.id
    });
  }
}

// Enhanced message listener with better error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'updateContextMenu') {
      updateContextMenu(request.hasCurrency, request.currencyInfo);

      // Store current currency info for context menu actions
      currentCurrencyInfo = request.currencyInfo || null;

      sendResponse({ success: true });
    }

    if (request.action === 'convertCurrency') {
      // Handle conversion request from content script
      performCurrencyConversion(request.currencyData)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => {
          logError(error, 'performCurrencyConversion', request.currencyData);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Will respond asynchronously
    }

    if (request.action === 'reportError') {
      logError(request.error, request.error.context, request.error);
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Error in message listener:', error);
    sendResponse({ success: false, error: error.message });
  }
});

// Enhanced context menu update with better title formatting
function updateContextMenu(hasCurrency, currencyInfo) {
  try {
    let title = 'Convert Currency';

    if (hasCurrency && currencyInfo) {
      // Format amount nicely for display
      const amount = currencyInfo.amount;
      const formattedAmount =
        amount % 1 === 0 ? amount.toString() : amount.toFixed(2);

      title = `Convert ${formattedAmount} ${currencyInfo.currency}`;

      // Add confidence indicator for low confidence detections
      if (currencyInfo.confidence < 0.7) {
        title += ' (?)';
      }
    }

    chrome.contextMenus
      .update('convertCurrency', {
        visible: hasCurrency,
        title: title
      })
      .catch(error => {
        console.warn('Failed to update context menu:', error);
      });
  } catch (error) {
    console.error('Error updating context menu:', error);
  }
}

// Enhanced conversion logic and utility functions for Task 2.2
async function performCurrencyConversion(currencyData) {
  try {
    // TODO: Implement actual API call and conversion logic
    // For now, return mock data with enhanced structure

    const result = {
      originalAmount: currencyData.amount,
      originalCurrency: currencyData.currency,
      convertedAmount: (currencyData.amount * 1.1).toFixed(2), // Placeholder calculation
      convertedCurrency: 'EUR',
      exchangeRate: 1.1,
      timestamp: new Date().toISOString(),
      confidence: currencyData.confidence || 0.8,
      source: 'placeholder' // Will be 'api' when real API is implemented
    };

    console.log('Mock conversion performed:', result);
    return result;
  } catch (error) {
    logError(error, 'performCurrencyConversion', currencyData);
    throw error;
  }
}

// Get error log for debugging (accessible via console)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getErrorLog') {
    sendResponse({ errorLog });
  }
});

// Utility function to get extension statistics
function getExtensionStats() {
  return {
    errorsLogged: errorLog.length,
    lastError: errorLog[errorLog.length - 1] || null,
    currentCurrencyInfo,
    timestamp: new Date().toISOString()
  };
}

// Make stats available globally for debugging
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    sendResponse(getExtensionStats());
  }
});
