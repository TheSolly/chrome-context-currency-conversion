// Enhanced background service worker for Task 2.3
// Handles dynamic context menu creation and currency conversion logic with improved UX

// Phase 3, Task 3.3: Import Settings Manager
import { settingsManager } from '/utils/settings-manager.js';
// Import API services
import { apiKeyManager, exchangeRateService } from '/utils/api-service.js';
import {
  formatConvertedAmount,
  formatExchangeRate,
  formatConversionTimestamp
} from '/utils/conversion-utils.js';
// Phase 6, Task 6.2: Import Conversion History
import { conversionHistory } from '/utils/conversion-history.js';
// Phase 6, Task 6.3: Import Rate Alerts Manager
import { rateAlertsManager } from '/utils/rate-alerts-manager.js';

// Global state management
let currentCurrencyInfo = null;
let currentSettings = null;
let contextMenusCreated = false;
const errorLog = [];
const createdMenuItems = new Set(); // Track created menu items to avoid duplicates

// Popular currency pairs for quick conversion
const POPULAR_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY'
];

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
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Currency Converter Extension installed');

  // Initialize API keys first
  try {
    await apiKeyManager.initializeLocalApiKeys();
    console.log('🔑 API keys initialized in background');
  } catch (error) {
    logError(error, 'apiKeyInit');
  }

  // Phase 3, Task 3.3: Initialize Settings Manager
  try {
    await settingsManager.initialize();
    currentSettings = await settingsManager.getSettings();
    console.log('⚙️ Settings Manager initialized in background');
  } catch (error) {
    logError(error, 'settingsManagerInit');
  }

  // Phase 6, Task 6.2: Initialize Conversion History
  try {
    await conversionHistory.initialize();
    console.log('📚 Conversion History initialized in background');
  } catch (error) {
    logError(error, 'conversionHistoryInit');
  }

  // Phase 6, Task 6.3: Initialize Rate Alerts Manager
  try {
    await rateAlertsManager.initialize();
    console.log('🔔 Rate Alerts Manager initialized in background');
  } catch (error) {
    logError(error, 'rateAlertsManagerInit');
  }

  await initializeContextMenus();
});

// Startup initialization
async function initializeExtension() {
  console.log('🚀 Currency Converter Extension starting up');

  // Initialize API keys
  try {
    await apiKeyManager.initializeLocalApiKeys();
    console.log('🔑 API keys initialized on startup');
  } catch (error) {
    logError(error, 'startupApiKeyInit');
  }

  // Initialize settings
  try {
    await settingsManager.initialize();
    currentSettings = await settingsManager.getSettings();
    console.log('⚙️ Settings loaded on startup');
  } catch (error) {
    logError(error, 'startupSettingsInit');
  }

  // Note: Context menus are initialized in chrome.runtime.onInstalled
  // to avoid duplicate creation on service worker restarts
}

// Initialize on startup
initializeExtension();

// Initialize context menus with enhanced dynamic structure
async function initializeContextMenus() {
  try {
    // Only initialize if not already created
    if (contextMenusCreated) {
      console.log('Context menus already initialized, skipping...');
      return;
    }

    // Remove any existing menus first
    await chrome.contextMenus.removeAll();

    // Load user settings
    currentSettings = await loadUserSettings();

    // Create parent menu item (initially hidden)
    chrome.contextMenus.create({
      id: 'currencyConverter',
      title: 'Convert Currency',
      contexts: ['selection'],
      visible: false,
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });

    contextMenusCreated = true;
    console.log('Context menus initialized successfully');
  } catch (error) {
    logError(error, 'initializeContextMenus');
  }
}

// Load user settings with fallbacks
async function loadUserSettings() {
  try {
    // Force reload settings from storage first
    await settingsManager.loadSettings();
    const settings = settingsManager.getSettings();

    console.log('📥 Background worker loaded settings:', {
      baseCurrency: settings.baseCurrency,
      secondaryCurrency: settings.secondaryCurrency,
      additionalCurrencies: settings.additionalCurrencies
    });

    return {
      baseCurrency: settings.baseCurrency || 'USD',
      secondaryCurrency: settings.secondaryCurrency || 'EUR',
      additionalCurrencies: settings.additionalCurrencies || ['GBP', 'JPY'],
      showConfidence: settings.showConfidence !== false // Default to true
    };
  } catch (error) {
    logError(error, 'loadUserSettings');
    return {
      baseCurrency: 'USD',
      secondaryCurrency: 'EUR',
      additionalCurrencies: ['GBP', 'JPY'],
      showConfidence: true
    };
  }
}

// Build direct conversion title with estimated amount
async function buildDirectConversionTitle(
  amount,
  sourceCurrency,
  targetCurrency,
  formattedAmount
) {
  try {
    // Try to get a quick conversion estimate for the menu title
    const conversionResult = await exchangeRateService.convertCurrency(
      amount,
      sourceCurrency,
      targetCurrency
    );

    // Format the source amount with currency symbol
    const sourceFormatted = formatConvertedAmount(amount, sourceCurrency);
    // Format the target amount with currency symbol
    const targetFormatted = formatConvertedAmount(
      conversionResult.convertedAmount,
      targetCurrency
    );

    return `${sourceFormatted} → ${targetFormatted}`;
  } catch (error) {
    console.warn('Failed to get conversion estimate for menu title:', error);
    // Fallback to basic format without conversion estimate
    return `Convert ${formattedAmount} ${sourceCurrency} → ${targetCurrency}`;
  }
}

// Enhanced context menu click handler with dynamic conversion options
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId.startsWith('convert_')) {
      const targetCurrency = info.menuItemId.replace('convert_', '');

      // Phase 5, Task 5.1: Show immediate loading feedback
      if (tab?.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showLoadingFeedback',
            targetCurrency,
            originalText: info.selectionText
          });
        } catch (error) {
          console.warn('Failed to show loading feedback:', error);
        }
      }

      await handleCurrencyConversion(info, tab, targetCurrency);
    } else if (info.menuItemId === 'openSettings') {
      // Open extension settings
      await chrome.tabs.create({
        url: chrome.runtime.getURL('popup/popup.html')
      });
    } else if (info.menuItemId === 'currencyConverter') {
      // Handle main menu click
      // Check if this is a direct conversion (base/secondary currency)
      if (currentCurrencyInfo?.directConversionTarget) {
        // Direct conversion case
        const targetCurrency = currentCurrencyInfo.directConversionTarget;

        // Phase 5, Task 5.1: Show immediate loading feedback
        if (tab?.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              action: 'showLoadingFeedback',
              targetCurrency,
              originalText: info.selectionText
            });
          } catch (error) {
            console.warn('Failed to show loading feedback:', error);
          }
        }

        await handleCurrencyConversion(info, tab, targetCurrency);
      } else {
        // Fallback for other currencies
        await handleCurrencyConversion(info, tab);
      }
    }
  } catch (error) {
    logError(error, 'contextMenuClick', {
      menuItemId: info.menuItemId,
      tabId: tab?.id
    });

    // Phase 5, Task 5.1: Show error feedback
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showErrorFeedback',
          error: error.message || 'Conversion failed'
        });
      } catch (msgError) {
        console.warn('Failed to show error feedback:', msgError);
      }
    }
  }
});

// Enhanced currency conversion handler with target currency support
async function handleCurrencyConversion(info, tab, targetCurrency = null) {
  const selectedText = info.selectionText;
  console.log('Converting currency for:', selectedText, 'to:', targetCurrency);

  try {
    // Reload settings to get latest preferences
    currentSettings = await loadUserSettings();

    const finalTargetCurrency =
      targetCurrency || currentSettings.secondaryCurrency;

    // First show loading message to content script
    const loadingData = {
      originalText: selectedText,
      baseCurrency: currentCurrencyInfo?.currency,
      secondaryCurrency: finalTargetCurrency,
      sourceCurrency: currentCurrencyInfo?.currency,
      targetCurrency: finalTargetCurrency,
      amount: currentCurrencyInfo?.amount,
      confidence: currentCurrencyInfo?.confidence,
      currencyInfo: currentCurrencyInfo,
      timestamp: new Date().toISOString()
    };

    console.log('Showing loading state with data:', loadingData);

    // Send loading message to content script
    if (tab?.id) {
      console.log('📤 Sending loading message to content script...');
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showConversionResult',
        ...loadingData
      });
      console.log('✅ Loading message sent successfully');
    }

    // Now perform the actual currency conversion
    if (currentCurrencyInfo?.currency && currentCurrencyInfo?.amount) {
      const currencyData = {
        currency: currentCurrencyInfo.currency,
        amount: currentCurrencyInfo.amount,
        confidence: currentCurrencyInfo.confidence || 0.8
      };

      console.log(
        'Performing conversion with:',
        currencyData,
        'to:',
        finalTargetCurrency
      );

      const conversionResult = await performCurrencyConversion(
        currencyData,
        finalTargetCurrency
      );

      console.log('✅ Conversion completed successfully:', conversionResult);
      console.log(
        '🔍 DEBUG formattedAmount in result:',
        conversionResult.formattedAmount
      );
      console.log('🔍 DEBUG _debugInfo:', conversionResult._debugInfo);

      // Send the actual result to content script
      if (tab?.id) {
        console.log('📤 Sending conversion result to content script...');
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showConversionResult',
          ...loadingData,
          result: conversionResult
        });
        console.log('✅ Conversion result sent successfully');
      }
    } else {
      console.error(
        'Missing currency info for conversion:',
        currentCurrencyInfo
      );
    }
  } catch (error) {
    console.error('Currency conversion failed:', error);
    logError(error, 'handleCurrencyConversion', {
      selectedText,
      targetCurrency,
      tabId: tab?.id
    });

    // Send error message to content script
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showConversionResult',
          originalText: selectedText,
          currencyInfo: currentCurrencyInfo,
          result: {
            error: true,
            errorMessage: error.message || 'Conversion failed'
          }
        });
      } catch (msgError) {
        console.error(
          'Failed to send error message to content script:',
          msgError
        );
      }
    }
  }
}

// Enhanced message listener with async context menu updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'updateContextMenu') {
      // Handle async context menu update
      updateContextMenu(request.hasCurrency, request.currencyInfo)
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          logError(error, 'updateContextMenu', request);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Will respond asynchronously
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

    if (request.action === 'getErrorLog') {
      sendResponse({ errorLog });
    }

    // Phase 3, Task 3.3: Handle settings changes
    if (request.type === 'SETTINGS_CHANGED') {
      handleSettingsChange(request.settings)
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          logError(error, 'handleSettingsChange', request.settings);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Will respond asynchronously
    }

    if (request.action === 'getStats') {
      sendResponse(getExtensionStats());
    }

    // Phase 6, Task 6.2: Handle conversion history requests
    if (request.action === 'getHistory') {
      try {
        const history = conversionHistory.getHistory(request.filters || {});
        sendResponse({ success: true, history });
      } catch (error) {
        logError(error, 'getHistory', request.filters);
        sendResponse({ success: false, error: error.message });
      }
    }

    if (request.action === 'getFavorites') {
      try {
        const favorites = conversionHistory.getFavorites(
          request.sortBy || 'createdAt'
        );
        sendResponse({ success: true, favorites });
      } catch (error) {
        logError(error, 'getFavorites', request.sortBy);
        sendResponse({ success: false, error: error.message });
      }
    }

    if (request.action === 'addToFavorites') {
      conversionHistory
        .addToFavorites(
          request.fromCurrency,
          request.toCurrency,
          request.amount,
          request.label
        )
        .then(favorite => sendResponse({ success: true, favorite }))
        .catch(error => {
          logError(error, 'addToFavorites', request);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Will respond asynchronously
    }

    if (request.action === 'removeFromFavorites') {
      conversionHistory
        .removeFromFavorites(request.favoriteId)
        .then(removed => sendResponse({ success: true, removed }))
        .catch(error => {
          logError(error, 'removeFromFavorites', request.favoriteId);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Will respond asynchronously
    }

    if (request.action === 'getConversionStats') {
      try {
        const stats = conversionHistory.getStats();
        const popularPairs = conversionHistory.getPopularPairs(10);
        sendResponse({ success: true, stats, popularPairs });
      } catch (error) {
        logError(error, 'getConversionStats');
        sendResponse({ success: false, error: error.message });
      }
    }

    if (request.action === 'exportHistory') {
      try {
        const exportData = conversionHistory.exportHistory(
          request.format || 'json'
        );
        sendResponse({ success: true, exportData });
      } catch (error) {
        logError(error, 'exportHistory', request.format);
        sendResponse({ success: false, error: error.message });
      }
    }

    if (request.action === 'clearHistory') {
      conversionHistory
        .clearHistory(request.type || 'all')
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          logError(error, 'clearHistory', request.type);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Will respond asynchronously
    }

    if (request.action === 'reloadSettings') {
      // Reload settings when user updates preferences
      console.log('🔄 Received reloadSettings request');
      loadUserSettings()
        .then(async settings => {
          console.log('✅ Settings loaded in background:', settings);
          currentSettings = settings;

          // If we have current currency info, update the context menu to reflect new settings
          if (currentCurrencyInfo) {
            console.log('🔄 Updating context menu with new settings');
            await updateContextMenu(true, currentCurrencyInfo);
          } else {
            console.log('ℹ️ No current currency info to update context menu');
          }

          sendResponse({ success: true, settings });
        })
        .catch(error => {
          logError(error, 'reloadSettings');
          sendResponse({ success: false, error: error.message });
        });
      return true; // Will respond asynchronously
    }
  } catch (error) {
    console.error('Error in message listener:', error);
    sendResponse({ success: false, error: error.message });
  }
});

// Enhanced context menu update with dynamic conversion options
async function updateContextMenu(hasCurrency, currencyInfo) {
  try {
    if (!contextMenusCreated) {
      await initializeContextMenus();
    }

    if (!hasCurrency || !currencyInfo) {
      // Hide all menus when no currency detected
      await chrome.contextMenus.update('currencyConverter', {
        visible: false
      });
      return;
    }

    // Store current currency info
    currentCurrencyInfo = currencyInfo;

    // Reload settings to get latest preferences
    currentSettings = await loadUserSettings();

    // Remove existing conversion submenu items
    await removeConversionMenuItems();

    // Format the detected amount and currency for display
    const amount = currencyInfo.amount;
    const formattedAmount =
      amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
    const sourceCurrency = currencyInfo.currency;

    // Check if detected currency is base or secondary currency
    const isBaseCurrency = sourceCurrency === currentSettings.baseCurrency;
    const isSecondaryCurrency =
      sourceCurrency === currentSettings.secondaryCurrency;

    if (isBaseCurrency || isSecondaryCurrency) {
      // Show direct conversion with formatted display
      const targetCurrency = isBaseCurrency
        ? currentSettings.secondaryCurrency
        : currentSettings.baseCurrency;

      // Get estimated conversion for display (we'll use a cached/estimated rate)
      const displayTitle = await buildDirectConversionTitle(
        amount,
        sourceCurrency,
        targetCurrency,
        formattedAmount
      );

      // Update main menu item with direct conversion
      await chrome.contextMenus.update('currencyConverter', {
        visible: true,
        title: displayTitle
      });

      // Store the target currency for the direct conversion
      currentCurrencyInfo.directConversionTarget = targetCurrency;

      // Still create conversion options submenu for Quick Convert currencies and settings
      await createConversionOptions(sourceCurrency, formattedAmount);
    } else {
      // Build base title with confidence indicator for non-base/secondary currencies
      let baseTitle = `Convert ${formattedAmount} ${sourceCurrency}`;
      if (currentSettings.showConfidence && currencyInfo.confidence < 0.8) {
        const confidencePercent = Math.round(currencyInfo.confidence * 100);
        baseTitle += ` (${confidencePercent}%)`;
      }

      // Update main menu item
      await chrome.contextMenus.update('currencyConverter', {
        visible: true,
        title: baseTitle
      });

      // Create conversion options for different target currencies
      await createConversionOptions(sourceCurrency, formattedAmount);
    }
  } catch (error) {
    console.error('Error updating context menu:', error);
    logError(error, 'updateContextMenu', { hasCurrency, currencyInfo });
  }
}

// Create dynamic conversion menu items based on user preferences
async function createConversionOptions(sourceCurrency, formattedAmount) {
  try {
    console.log(
      `🎯 Creating conversion options for ${sourceCurrency}, current settings:`,
      currentSettings
    );
    const targetCurrencies = new Set();

    // Check if this is a base or secondary currency
    const isBaseCurrency = sourceCurrency === currentSettings.baseCurrency;
    const isSecondaryCurrency =
      sourceCurrency === currentSettings.secondaryCurrency;

    if (isBaseCurrency || isSecondaryCurrency) {
      // For base/secondary currencies, show additional quick convert options
      // Add the complementary primary currency first (already handled by direct conversion)
      const primaryTarget = isBaseCurrency
        ? currentSettings.secondaryCurrency
        : currentSettings.baseCurrency;

      // Add all additional configured currencies
      currentSettings.additionalCurrencies.forEach(currency => {
        if (currency !== sourceCurrency) {
          targetCurrencies.add(currency);
        }
      });

      // Add popular currencies to fill out Quick Convert options
      POPULAR_CURRENCIES.forEach(currency => {
        if (
          currency !== sourceCurrency &&
          currency !== primaryTarget &&
          targetCurrencies.size < 6
        ) {
          targetCurrencies.add(currency);
        }
      });

      console.log(
        `🎯 Base/Secondary currency detected. Added ${targetCurrencies.size} quick convert options`
      );
    } else {
      // For other currencies, use the original logic
      // Add user's preferred currencies
      if (currentSettings.secondaryCurrency !== sourceCurrency) {
        targetCurrencies.add(currentSettings.secondaryCurrency);
        console.log(
          `➕ Added secondary currency: ${currentSettings.secondaryCurrency}`
        );
      }
      if (currentSettings.baseCurrency !== sourceCurrency) {
        targetCurrencies.add(currentSettings.baseCurrency);
        console.log(`➕ Added base currency: ${currentSettings.baseCurrency}`);
      }

      // Add additional configured currencies
      currentSettings.additionalCurrencies.forEach(currency => {
        if (currency !== sourceCurrency) {
          targetCurrencies.add(currency);
        }
      });

      // Add popular currencies if we have less than 4 options
      if (targetCurrencies.size < 4) {
        POPULAR_CURRENCIES.forEach(currency => {
          if (currency !== sourceCurrency && targetCurrencies.size < 4) {
            targetCurrencies.add(currency);
          }
        });
      }
    }

    // Create menu items for each target currency
    let index = 0;
    for (const targetCurrency of targetCurrencies) {
      if (index >= 5) {
        break; // Limit to 5 options to avoid menu clutter
      }

      const menuId = `convert_${targetCurrency}`;
      try {
        await chrome.contextMenus.create({
          id: menuId,
          parentId: 'currencyConverter',
          title: `→ ${targetCurrency}`,
          contexts: ['selection']
        });
        createdMenuItems.add(menuId); // Track the created menu item
      } catch (error) {
        if (error.message.includes('duplicate id')) {
          console.warn(`Menu item ${menuId} already exists, skipping...`);
        } else {
          console.error(
            `Failed to create menu item for ${targetCurrency}:`,
            error
          );
        }
      }

      index++;
    }

    // Add separator and additional options
    if (targetCurrencies.size > 0) {
      try {
        await chrome.contextMenus.create({
          id: 'separator1',
          parentId: 'currencyConverter',
          type: 'separator',
          contexts: ['selection']
        });
        createdMenuItems.add('separator1'); // Track the separator
      } catch (error) {
        if (!error.message.includes('duplicate id')) {
          console.error('Failed to create separator:', error);
        }
      }

      try {
        await chrome.contextMenus.create({
          id: 'openSettings',
          parentId: 'currencyConverter',
          title: '⚙️ Settings',
          contexts: ['selection']
        });
        createdMenuItems.add('openSettings'); // Track the settings menu
      } catch (error) {
        if (!error.message.includes('duplicate id')) {
          console.error('Failed to create settings menu:', error);
        }
      }
    }
  } catch (error) {
    logError(error, 'createConversionOptions', {
      sourceCurrency,
      formattedAmount
    });
  }
}

// Remove existing conversion menu items
async function removeConversionMenuItems() {
  try {
    // Remove all tracked menu items
    for (const menuId of createdMenuItems) {
      try {
        await chrome.contextMenus.remove(menuId);
      } catch {
        // Menu item might not exist, which is fine
      }
    }

    // Clear the tracking set
    createdMenuItems.clear();
  } catch {
    // Ignore errors when removing non-existent menu items
  }
}

// Enhanced conversion logic and utility functions for Task 4.3: Conversion Logic
async function performCurrencyConversion(currencyData, targetCurrency = null) {
  try {
    console.log(
      '🔄 Starting currency conversion:',
      currencyData,
      'to:',
      targetCurrency
    );

    // Get user settings to determine target currency if not provided
    const settings = await loadUserSettings();
    const finalTargetCurrency =
      targetCurrency || settings.secondaryCurrency || 'EUR';

    console.log('Using target currency:', finalTargetCurrency);

    // Use the singleton ExchangeRateService instance
    const conversionResult = await exchangeRateService.convertCurrency(
      currencyData.amount,
      currencyData.currency,
      finalTargetCurrency
    );

    // Format the conversion result with enhanced structure
    const result = {
      originalAmount: conversionResult.originalAmount,
      fromCurrency: conversionResult.fromCurrency,
      convertedAmount: conversionResult.convertedAmount,
      toCurrency: conversionResult.toCurrency,
      exchangeRate: conversionResult.rate,
      timestamp: conversionResult.timestamp,
      confidence: currencyData.confidence || 0.8,
      source: conversionResult.source,
      cached: conversionResult.cached || false,
      offline: conversionResult.offline || false,
      precision: conversionResult.precision || 2,
      formattedAmount: formatConvertedAmount(
        conversionResult.convertedAmount,
        conversionResult.toCurrency
      ),

      // DEBUG: Log the formatted amount being created
      _debugInfo: {
        rawAmount: conversionResult.convertedAmount,
        currency: conversionResult.toCurrency,
        formatted: formatConvertedAmount(
          conversionResult.convertedAmount,
          conversionResult.toCurrency
        )
      },

      formattedRate: formatExchangeRate(
        conversionResult.rate,
        conversionResult.fromCurrency,
        conversionResult.toCurrency
      ),
      conversionTime: formatConversionTimestamp(conversionResult.timestamp)
    };

    console.log('✅ Currency conversion completed:', result);
    console.log('🔍 DEBUG formattedAmount in result:', result.formattedAmount);
    console.log('🔍 DEBUG _debugInfo:', result._debugInfo);

    // Phase 6, Task 6.2: Save successful conversion to history
    try {
      await conversionHistory.addConversion({
        fromCurrency: result.fromCurrency,
        toCurrency: result.toCurrency,
        originalAmount: result.originalAmount,
        convertedAmount: result.convertedAmount,
        exchangeRate: result.exchangeRate,
        timestamp: Date.now(),
        source: 'context-menu',
        confidence: result.confidence,
        webpage: null // Could be enhanced to capture current webpage URL
      });
      console.log('📚 Conversion saved to history');
    } catch (historyError) {
      console.warn('⚠️ Failed to save conversion to history:', historyError);
      // Don't fail the conversion if history saving fails
    }

    // Track usage for subscription management
    try {
      // Get subscription manager and track daily conversion usage
      const { getSubscriptionManager } = await import(
        '/utils/subscription-manager-v2.js'
      );
      const subscriptionManager = await getSubscriptionManager();
      await subscriptionManager.trackUsage('dailyConversions', 1);
      console.log('📊 Conversion usage tracked for subscription');
    } catch (usageError) {
      console.warn('⚠️ Failed to track conversion usage:', usageError);
      // Don't fail the conversion if usage tracking fails
    }

    return result;
  } catch (conversionError) {
    console.error('❌ Currency conversion failed:', conversionError);
    logError(conversionError, 'performCurrencyConversion', currencyData);

    // Return a user-friendly error result
    return {
      originalAmount: currencyData.amount,
      originalCurrency: currencyData.currency,
      error: true,
      errorMessage: conversionError.message,
      timestamp: new Date().toISOString(),
      confidence: currencyData.confidence || 0.8
    };
  }
}

// Enhanced utility function to get extension statistics
function getExtensionStats() {
  return {
    errorsLogged: errorLog.length,
    lastError: errorLog[errorLog.length - 1] || null,
    currentCurrencyInfo,
    currentSettings,
    contextMenusCreated,
    popularCurrencies: POPULAR_CURRENCIES,
    timestamp: new Date().toISOString()
  };
}

// Phase 3, Task 3.3: Handle settings changes from popup
async function handleSettingsChange(newSettings) {
  try {
    // Update current settings cache
    currentSettings = newSettings;

    // Update context menus based on new settings if needed
    if (newSettings.baseCurrency || newSettings.secondaryCurrency) {
      await updateContextMenuCurrencies();
    }

    // Log settings change
    console.log('⚙️ Settings updated in background:', {
      baseCurrency: newSettings.baseCurrency,
      secondaryCurrency: newSettings.secondaryCurrency,
      additionalCurrencies: newSettings.additionalCurrencies?.length || 0
    });

    return true;
  } catch (error) {
    logError(error, 'handleSettingsChange', newSettings);
    throw error;
  }
}

// Update context menu currencies based on current settings
async function updateContextMenuCurrencies() {
  if (!currentSettings) {
    return;
  }

  try {
    // Remove all existing dynamic currency menus
    await chrome.contextMenus.removeAll();

    // Recreate context menus with updated settings
    await initializeContextMenus();

    console.log('🔄 Context menus updated with new settings');
  } catch (error) {
    logError(error, 'updateContextMenuCurrencies');
  }
}

// Phase 6, Task 6.3: Rate Alerts notification handling
chrome.notifications.onClicked.addListener(async notificationId => {
  try {
    console.log('📱 Notification clicked:', notificationId);

    // Clear the notification
    await chrome.notifications.clear(notificationId);

    // Handle different notification types
    if (notificationId.startsWith('alert_')) {
      // Rate alert notification - open popup to manage alerts
      await chrome.action.openPopup();
    } else if (
      notificationId.startsWith('daily-summary') ||
      notificationId.startsWith('weekly-summary')
    ) {
      // Summary notification - could open a detailed view
      await chrome.action.openPopup();
    }
  } catch (error) {
    logError(error, 'notificationClick', { notificationId });
  }
});

chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {
  console.log('📱 Notification closed:', notificationId, 'by user:', byUser);
});

// Handle notification button clicks (if we add action buttons in future)
chrome.notifications.onButtonClicked.addListener(
  async (notificationId, buttonIndex) => {
    try {
      console.log(
        '📱 Notification button clicked:',
        notificationId,
        'button:',
        buttonIndex
      );

      // Handle specific button actions based on notification type
      if (notificationId.startsWith('alert_')) {
        switch (buttonIndex) {
          case 0: {
            // Could be "View Details" button
            await chrome.action.openPopup();
            break;
          }
          case 1: {
            // Could be "Disable Alert" button
            const alertId = notificationId.replace('alert_', '');
            await rateAlertsManager.updateAlert(alertId, { enabled: false });
            break;
          }
        }
      }

      await chrome.notifications.clear(notificationId);
    } catch (error) {
      logError(error, 'notificationButtonClick', {
        notificationId,
        buttonIndex
      });
    }
  }
);

// Phase 6, Task 6.3: Additional message handlers for rate alerts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle rate alerts related messages from popup
  if (message.type === 'RATE_ALERTS_ACTION') {
    handleRateAlertsMessage(message, sendResponse);
    return true; // Keep the message channel open for async response
  }

  // Existing message handlers remain unchanged
  return false;
});

// Handle rate alerts messages from popup
async function handleRateAlertsMessage(message, sendResponse) {
  try {
    switch (message.action) {
      case 'CREATE_ALERT': {
        const newAlert = await rateAlertsManager.createAlert(message.data);
        sendResponse({ success: true, data: newAlert });
        break;
      }

      case 'UPDATE_ALERT': {
        const updatedAlert = await rateAlertsManager.updateAlert(
          message.data.id,
          message.data.updates
        );
        sendResponse({ success: true, data: updatedAlert });
        break;
      }

      case 'DELETE_ALERT': {
        const deletedAlert = await rateAlertsManager.deleteAlert(
          message.data.id
        );
        sendResponse({ success: true, data: deletedAlert });
        break;
      }

      case 'GET_ALERTS': {
        const alerts = rateAlertsManager.getAlerts();
        sendResponse({ success: true, data: alerts });
        break;
      }

      case 'GET_ALERT_SETTINGS': {
        const alertSettings = rateAlertsManager.getAlertSettings();
        sendResponse({ success: true, data: alertSettings });
        break;
      }

      case 'UPDATE_ALERT_SETTINGS': {
        const newAlertSettings = await rateAlertsManager.updateAlertSettings(
          message.data
        );
        sendResponse({ success: true, data: newAlertSettings });
        break;
      }

      case 'GET_ALERT_HISTORY': {
        const alertHistory = rateAlertsManager.getAlertHistory(
          message.data?.limit
        );
        sendResponse({ success: true, data: alertHistory });
        break;
      }

      case 'GET_RATE_HISTORY': {
        const rateHistory = rateAlertsManager.getRateHistory(
          message.data?.fromCurrency,
          message.data?.toCurrency,
          message.data?.limit
        );
        sendResponse({ success: true, data: rateHistory });
        break;
      }

      case 'GET_TREND_DATA': {
        const trendData = rateAlertsManager.getTrendData(message.data?.period);
        sendResponse({ success: true, data: trendData });
        break;
      }

      case 'ANALYZE_TRENDS': {
        const trends = await rateAlertsManager.analyzeTrends(
          message.data?.days
        );
        sendResponse({ success: true, data: trends });
        break;
      }

      case 'TRIGGER_RATE_CHECK': {
        await rateAlertsManager.checkRates();
        sendResponse({ success: true, message: 'Rate check triggered' });
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown rate alerts action' });
    }
  } catch (error) {
    logError(error, 'handleRateAlertsMessage', message);
    sendResponse({ success: false, error: error.message });
  }
}
