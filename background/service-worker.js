// Enhanced background service worker for Task 2.3
// Handles dynamic context menu creation and currency conversion logic with improved UX

// Phase 3, Task 3.3: Import Settings Manager
import { settingsManager } from '/utils/settings-manager.js';
// Import API services
import { ApiKeyManager, ExchangeRateService } from '/utils/api-service.js';
import {
  formatConvertedAmount,
  formatExchangeRate,
  formatConversionTimestamp
} from '/utils/conversion-utils.js';

// Global state management
let currentCurrencyInfo = null;
let currentSettings = null;
let contextMenusCreated = false;
const errorLog = [];

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
    const apiKeyManager = new ApiKeyManager();
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

  await initializeContextMenus();
});

// Startup initialization
async function initializeExtension() {
  console.log('🚀 Currency Converter Extension starting up');

  // Initialize API keys
  try {
    const apiKeyManager = new ApiKeyManager();
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

// Enhanced context menu click handler with dynamic conversion options
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId.startsWith('convert_')) {
      const targetCurrency = info.menuItemId.replace('convert_', '');
      await handleCurrencyConversion(info, tab, targetCurrency);
    } else if (info.menuItemId === 'openSettings') {
      // Open extension settings
      await chrome.tabs.create({
        url: chrome.runtime.getURL('popup/popup.html')
      });
    } else if (info.menuItemId === 'currencyConverter') {
      // Handle main menu click (fallback)
      await handleCurrencyConversion(info, tab);
    }
  } catch (error) {
    logError(error, 'contextMenuClick', {
      menuItemId: info.menuItemId,
      tabId: tab?.id
    });
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

    // Build base title with confidence indicator
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

    // Create menu items for each target currency
    let index = 0;
    for (const targetCurrency of targetCurrencies) {
      if (index >= 5) {
        break; // Limit to 5 options to avoid menu clutter
      }

      await chrome.contextMenus.create({
        id: `convert_${targetCurrency}`,
        parentId: 'currencyConverter',
        title: `→ ${targetCurrency}`,
        contexts: ['selection']
      });

      index++;
    }

    // Add separator and additional options
    if (targetCurrencies.size > 0) {
      await chrome.contextMenus.create({
        id: 'separator1',
        parentId: 'currencyConverter',
        type: 'separator',
        contexts: ['selection']
      });

      await chrome.contextMenus.create({
        id: 'openSettings',
        parentId: 'currencyConverter',
        title: '⚙️ Settings',
        contexts: ['selection']
      });
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
    // Get all existing menu items and remove conversion-related ones
    const menuIds = [
      ...POPULAR_CURRENCIES.map(currency => `convert_${currency}`),
      'separator1',
      'openSettings'
    ];

    for (const menuId of menuIds) {
      try {
        await chrome.contextMenus.remove(menuId);
      } catch {
        // Menu item might not exist, which is fine
      }
    }
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

    // Initialize the ExchangeRateService (using static import)
    const exchangeService = new ExchangeRateService();

    // Perform the actual conversion
    const conversionResult = await exchangeService.convertCurrency(
      currencyData.amount,
      currencyData.currency,
      finalTargetCurrency
    );

    // Format the conversion result with enhanced structure
    const result = {
      originalAmount: conversionResult.originalAmount,
      originalCurrency: conversionResult.fromCurrency,
      convertedAmount: conversionResult.convertedAmount,
      convertedCurrency: conversionResult.toCurrency,
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
      formattedRate: formatExchangeRate(
        conversionResult.rate,
        conversionResult.fromCurrency,
        conversionResult.toCurrency
      ),
      conversionTime: formatConversionTimestamp(conversionResult.timestamp)
    };

    console.log('✅ Currency conversion completed:', result);
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
