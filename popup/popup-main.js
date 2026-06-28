/**
 * Main Popup Script - Modularized version
 * Handles initialization and coordination between different tab modules
 * Phase 9, Task 9.1: Enhanced with security features
 */

// Import utilities and modules
import { DEFAULT_SETTINGS } from '/utils/currency-data.js';
import { settingsManager } from '/utils/settings-manager.js';
import { initializeDefaultConfig } from '/utils/default-config.js';
import { accessibilityManager } from '/utils/accessibility-manager.js';
import { getSubscriptionManager } from '/utils/subscription-manager-v2.js';
import { initializeAds, showInterstitialIfEligible } from './ad-integration.js';
// Phase 9, Task 9.1: Import security managers
import { securityManager } from '/utils/security-manager.js';
import { secureApiKeyManager } from '/utils/secure-api-key-manager.js';
// Phase 9, Task 9.2: Import privacy manager
import { privacyManager } from '/utils/privacy-manager.js';

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
    const operations = Array.from(pendingSettingsOperations);
    await Promise.allSettled(operations);
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
  try {
    // Show loading state
    showLoadingState();

    // Initialize core services
    await initializeCoreServices();

    // Initialize tab manager
    await initializeTabManager();

    // Setup global event listeners
    setupGlobalEventListeners();

    // Show the real extension version in the UI
    displayExtensionVersion();

    // Hide loading state
    hideLoadingState();
  } catch (error) {
    showInitializationError(error);
  }
}

/**
 * Initialize core services
 */
async function initializeCoreServices() {
  const errors = [];

  // Initialize settings manager
  try {
    await settingsManager.initialize();
    currentSettings = await settingsManager.getSettings();
  } catch (error) {
    errors.push({ service: 'settings', error });
    // Use default settings as fallback
    currentSettings = { ...DEFAULT_SETTINGS };
  }

  // Initialize default configuration
  try {
    await initializeDefaultConfig();
  } catch (error) {
    errors.push({ service: 'defaultConfig', error });
  }

  // Initialize accessibility features
  try {
    await accessibilityManager.initializeForPopup();
  } catch (error) {
    errors.push({ service: 'accessibility', error });
  }

  // Initialize subscription manager
  try {
    subscriptionManager = await getSubscriptionManager();

    // The subscription manager initializes itself in the constructor
    // Give it a moment to complete if needed
    await new Promise(resolve => setTimeout(resolve, 100));

    const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
    userPlan = subscriptionInfo?.plan || 'FREE';
  } catch (error) {
    errors.push({ service: 'subscription', error });
    // Use free plan as fallback
    userPlan = 'FREE';
  }

  // Initialize ad system (for free users only)
  try {
    if (userPlan === 'FREE') {
      try {
        // Initialize ad systems separately to prevent cascading failures
        await initializeAds();

        // Try to show interstitial, but catch any errors
        try {
          await showInterstitialIfEligible('popup_open');
        } catch {
          // Non-critical error showing interstitial
        }
      } catch (adError) {
        errors.push({
          service: 'ads',
          error: {
            message: adError.message || 'Unknown ad system error',
            stack: adError.stack || 'No stack trace available'
          }
        });
      }
    }
  } catch (error) {
    errors.push({
      service: 'ads',
      error: {
        message: error.message || 'Unknown ad system error',
        stack: error.stack || 'No stack trace available'
      }
    });
  }

  // Phase 9, Task 9.1: Initialize security features
  try {
    await securityManager.initialize();
  } catch (error) {
    errors.push({ service: 'security', error });
  }

  // Initialize secure API key manager
  try {
    await secureApiKeyManager.initialize();
  } catch (error) {
    errors.push({ service: 'secureApiKeys', error });
  }

  // Phase 9, Task 9.2: Initialize privacy manager
  try {
    await privacyManager.initialize();
  } catch (error) {
    errors.push({ service: 'privacy', error });
  }

  if (errors.length > 0) {
    // Only throw if critical services failed
    const criticalErrors = errors.filter(e => e.service === 'settings');
    if (criticalErrors.length > 0) {
      throw new Error(
        `Critical services failed: ${criticalErrors.map(e => e.service).join(', ')}`
      );
    }
  }
}

/**
 * Initialize tab manager and make it globally available
 */
async function initializeTabManager() {
  tabManager = new TabManager();
  await tabManager.initialize();

  // Make tab manager globally available for cross-tab communication
  window.tabManager = tabManager;
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
 * Display the extension version (read from the manifest so it never goes stale).
 */
function displayExtensionVersion() {
  try {
    const version = chrome.runtime.getManifest().version;

    const footerVersion = document.getElementById('version');
    if (footerVersion) {
      footerVersion.textContent = `v${version}`;
    }

    const settingsVersion = document.getElementById('settingsVersion');
    if (settingsVersion) {
      settingsVersion.textContent = version;
    }
  } catch (error) {
    console.warn('Failed to display extension version:', error);
  }
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
  // Show Coming Soon modal
  showComingSoonModal();
}

/**
 * Show the Coming Soon modal
 */
function showComingSoonModal() {
  const modal = document.getElementById('comingSoonModal');
  const content = modal?.querySelector('.coming-soon-content');

  if (!modal || !content) {
    return;
  }

  // Show modal
  modal.classList.remove('hidden');

  // Force reflow to restart animation
  content.offsetHeight;
  content.style.animation = 'none';
  content.offsetHeight;
  content.style.animation = '';

  // Reset animation class
  content.classList.remove('closing');

  // Setup close handlers
  setupComingSoonModalCloseHandlers();
}

/**
 * Hide the Coming Soon modal with animation
 */
function hideComingSoonModal() {
  const modal = document.getElementById('comingSoonModal');
  const content = modal?.querySelector('.coming-soon-content');

  if (!modal || !content) return;

  // Add closing animation
  content.classList.add('closing');

  // Hide after animation completes
  setTimeout(() => {
    modal.classList.add('hidden');
    content.classList.remove('closing');
  }, 200);
}

/**
 * Setup close handlers for Coming Soon modal
 */
function setupComingSoonModalCloseHandlers() {
  const closeBtn = document.getElementById('closeComingSoonModal');
  const backdrop = document.getElementById('comingSoonBackdrop');

  // Close button click
  closeBtn?.addEventListener('click', hideComingSoonModal, { once: true });

  // Backdrop click
  backdrop?.addEventListener('click', hideComingSoonModal, { once: true });

  // Escape key
  const escHandler = e => {
    if (e.key === 'Escape') {
      hideComingSoonModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// Export for use in other modules
window.showComingSoonModal = showComingSoonModal;
window.hideComingSoonModal = hideComingSoonModal;

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
    } catch {
      // Failed to track feature usage - non-critical
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

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
  // Footer donation button - opens PayPal.me link
  const donateBtn = document.getElementById('donateButton');
  if (donateBtn) {
    donateBtn.addEventListener('click', () => {
      // Open PayPal donation link
      chrome.tabs.create({ url: 'https://paypal.me/SalahKhaled49673' });
    });
  }
});

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
