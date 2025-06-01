// Enhanced background service worker for Task 2.3
// Handles dynamic context menu creation and currency conversion logic with improved UX

// Phase 3, Task 3.3: Import Settings Manager
import { settingsManager } from '/utils/settings-manager.js';

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

// Initialize context menus with enhanced dynamic structure
async function initializeContextMenus() {
  try {
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

    // Use current currency info if available
    const conversionData = {
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

    console.log('Converting with enhanced data:', conversionData);

    // Send enhanced message to content script
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showConversionResult',
        ...conversionData
      });
    }
  } catch (error) {
    console.error('Currency conversion failed:', error);
    logError(error, 'handleCurrencyConversion', {
      selectedText,
      targetCurrency,
      tabId: tab?.id
    });
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
