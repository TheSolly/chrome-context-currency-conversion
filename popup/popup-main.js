/**
 * Main Popup Script - Modularized version
 * Handles initialization and coordination between different tab modules
 */

// Import utilities and modules
import { DEFAULT_SETTINGS } from '/utils/currency-data.js';
import { settingsManager } from '/utils/settings-manager.js';
import { initializeDefaultConfig } from '/utils/default-config.js';
import { accessibilityManager } from '/utils/accessibility-manager.js';
import { getSubscriptionManager } from '/utils/subscription-manager-v2.js';

// Import tab manager
import { TabManager } from './tabs/tab-manager.js';

// Global state
let currentSettings = { ...DEFAULT_SETTINGS };
let subscriptionManager = null;
let userPlan = 'FREE';
let tabManager = null;

// Enhanced error handling and persistence for Chrome extension environment
const pendingSettingsOperations = new Set();

/**
 * Track and wait for all pending operations before popup closes
 */
async function waitForPendingOperations() {
  if (pendingSettingsOperations.size > 0) {
    console.log(
      `⏳ Waiting for ${pendingSettingsOperations.size} pending operations...`
    );
    const operations = Array.from(pendingSettingsOperations);
    try {
      await Promise.allSettled(operations);
      console.log('✅ All pending operations completed');
    } catch (error) {
      console.error('❌ Some operations failed:', error);
    }
  }
}

/**
 * Listen for popup close events to ensure operations complete
 */
window.addEventListener('beforeunload', async event => {
  if (pendingSettingsOperations.size > 0) {
    event.preventDefault();
    event.returnValue = '';
    await waitForPendingOperations();
  }
});

/**
 * Handle visibility change (when popup loses focus)
 */
document.addEventListener('visibilitychange', async () => {
  if (document.hidden && pendingSettingsOperations.size > 0) {
    await waitForPendingOperations();
  }
});

/**
 * Main initialization function
 */
async function initializePopup() {
  console.log('🎨 Enhanced Currency Converter popup loaded');

  try {
    // Show loading state
    showLoadingState();

    // Initialize core services
    await initializeCoreServices();

    // Initialize tab manager
    await initializeTabManager();

    // Setup global event listeners
    setupGlobalEventListeners();

    // Hide loading state
    hideLoadingState();

    console.log('✅ Popup initialization completed successfully');
  } catch (error) {
    console.error('❌ Failed to initialize popup:', error);
    showInitializationError(error);
  }
}

/**
 * Initialize core services
 */
async function initializeCoreServices() {
  console.log('🔧 Initializing core services...');
  const errors = [];

  // Initialize settings manager
  try {
    console.log('⚙️ Initializing settings manager...');
    await settingsManager.initialize();
    currentSettings = await settingsManager.getSettings();
    console.log('✅ Settings manager initialized');
  } catch (error) {
    console.error('❌ Settings manager failed:', error);
    errors.push({ service: 'settings', error });
    // Use default settings as fallback
    currentSettings = { ...DEFAULT_SETTINGS };
  }

  // Initialize default configuration
  try {
    console.log('🔧 Initializing default configuration...');
    await initializeDefaultConfig();
    console.log('✅ Default configuration initialized');
  } catch (error) {
    console.error('❌ Default configuration failed:', error);
    errors.push({ service: 'defaultConfig', error });
  }

  // Initialize accessibility features
  try {
    console.log('♿ Initializing accessibility manager...');
    await accessibilityManager.initializeForPopup();
    console.log('✅ Accessibility manager initialized');
  } catch (error) {
    console.error('❌ Accessibility manager failed:', error);
    errors.push({ service: 'accessibility', error });
  }

  // Initialize subscription manager
  try {
    console.log('💰 Initializing subscription manager...');
    subscriptionManager = await getSubscriptionManager();

    // The subscription manager initializes itself in the constructor
    // Give it a moment to complete if needed
    await new Promise(resolve => setTimeout(resolve, 100));

    const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
    userPlan = subscriptionInfo.plan;
    console.log(`✅ Subscription manager initialized with plan: ${userPlan}`);
  } catch (error) {
    console.error('❌ Subscription manager failed:', error);
    errors.push({ service: 'subscription', error });
    // Use free plan as fallback
    userPlan = 'FREE';
  }

  if (errors.length > 0) {
    console.warn(
      `⚠️ ${errors.length} service(s) failed to initialize:`,
      errors
    );

    // Only throw if critical services failed
    const criticalErrors = errors.filter(e => e.service === 'settings');
    if (criticalErrors.length > 0) {
      throw new Error(
        `Critical services failed: ${criticalErrors.map(e => e.service).join(', ')}`
      );
    }
  }

  console.log('✅ Core services initialization completed');
}

/**
 * Initialize tab manager and make it globally available
 */
async function initializeTabManager() {
  console.log('📋 Initializing tab manager...');

  try {
    tabManager = new TabManager();
    await tabManager.initialize();

    // Make tab manager globally available for cross-tab communication
    window.tabManager = tabManager;

    console.log('✅ Tab manager initialized');
  } catch (error) {
    console.error('❌ Failed to initialize tab manager:', error);
    throw error;
  }
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
  // Premium and footer links
  document
    .getElementById('upgradePremium')
    ?.addEventListener('click', handleUpgrade);
  document.getElementById('rateUs')?.addEventListener('click', handleRateUs);
  document.getElementById('support')?.addEventListener('click', handleSupport);
  document.getElementById('help')?.addEventListener('click', handleHelp);
}

/**
 * Show loading state
 */
function showLoadingState() {
  const loadingElement = document.getElementById('loadingState');
  if (loadingElement) {
    loadingElement.classList.remove('hidden');
  }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
  const loadingElement = document.getElementById('loadingState');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
  }
}

/**
 * Show initialization error
 */
function showInitializationError(error) {
  const errorElement = document.getElementById('initializationError');
  if (errorElement) {
    errorElement.textContent = `Failed to initialize: ${error.message}`;
    errorElement.classList.remove('hidden');
  }
  hideLoadingState();
}

/**
 * Global event handlers for footer links
 */
function handleUpgrade() {
  // Switch to subscription tab
  if (tabManager) {
    tabManager.switchTab('subscriptionPanel');
  }
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

/**
 * Show status message to user
 */
function showStatus(message, type = 'info') {
  const statusElement = document.getElementById('statusMessage');
  if (!statusElement) {
    return;
  }

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

/**
 * Get current settings
 */
function getCurrentSettings() {
  return currentSettings;
}

/**
 * Get current user plan
 */
function getCurrentUserPlan() {
  return userPlan;
}

/**
 * Get subscription manager
 */
function getSubscriptionManagerInstance() {
  return subscriptionManager;
}

/**
 * Get tab manager
 */
function getTabManager() {
  return tabManager;
}

/**
 * Update settings from external source
 */
async function updateSettings(newSettings) {
  currentSettings = newSettings;

  // Notify all tabs about settings change
  if (tabManager) {
    await tabManager.updateTabsWithSettings(newSettings);
    tabManager.handleGlobalEvent('settingsChanged', newSettings);
  }
}

/**
 * Handle feature usage tracking
 */
async function trackFeatureUsage(featureName, amount = 1) {
  if (subscriptionManager) {
    try {
      await subscriptionManager.trackUsage(featureName, amount);

      // Notify tabs about usage update
      if (tabManager) {
        tabManager.handleGlobalEvent('featureUsed', { featureName, amount });
      }
    } catch (error) {
      console.error('❌ Failed to track feature usage:', error);
    }
  }
}

/**
 * Check feature access
 */
function checkFeatureAccess(featureName, amount = 1) {
  if (!subscriptionManager) {
    return false;
  }
  return subscriptionManager.checkFeatureAccess(featureName, amount);
}

// Make utility functions globally available
window.popupUtils = {
  getCurrentSettings,
  getCurrentUserPlan,
  getSubscriptionManagerInstance,
  getTabManager,
  updateSettings,
  trackFeatureUsage,
  checkFeatureAccess,
  showStatus
};

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

// Export for testing
export {
  initializePopup,
  getCurrentSettings,
  getCurrentUserPlan,
  getSubscriptionManagerInstance,
  getTabManager,
  updateSettings,
  trackFeatureUsage,
  checkFeatureAccess,
  showStatus
};
