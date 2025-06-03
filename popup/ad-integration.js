/**
 * Ad Integration for the Popup UI
 * Handles displaying ads in the popup interface
 */

import { adDisplay } from '../utils/ad-display.js';
import { adManager } from '../utils/ad-manager.js';
import { getSubscriptionManager } from '../utils/subscription-manager-v2.js';

/**
 * Initialize ad displays in the popup
 */
export function initializeAds() {
  try {
    // Check if user is premium before showing ads
    const subscriptionManager = getSubscriptionManager();

    if (!subscriptionManager) {
      console.error(
        'Failed to get subscription manager, defaulting to showing ads'
      );
      addAdsToPopup();
      return;
    }

    try {
      const subscription = subscriptionManager.getSubscriptionInfo();

      if (subscription && subscription.plan !== 'free') {
        console.log('Premium user - no ads will be shown');
        return;
      }
    } catch (subscriptionError) {
      console.error(
        'Error getting subscription info:',
        subscriptionError.message || subscriptionError
      );
      // Default to showing ads on error
    }

    // Initialize ads in different popup sections
    addAdsToPopup();
  } catch (error) {
    console.error('Error initializing ads:', error.message || error);
    // Default to showing ads on error
    try {
      addAdsToPopup();
    } catch (err) {
      console.error('Critical error adding ads to popup:', err.message || err);
    }
  }
}

/**
 * Add ad elements to various parts of the popup
 */
function addAdsToPopup() {
  // Add bottom ad to main popup
  const mainContainer = document.getElementById('main-container');
  if (mainContainer) {
    const bottomAdContainer = document.createElement('div');
    bottomAdContainer.id = 'popup-bottom-ad-container';
    bottomAdContainer.classList.add('ad-container-wrapper');
    mainContainer.appendChild(bottomAdContainer);

    adDisplay.createAdElement('popup', 'bottom', bottomAdContainer);
  }

  // Add sidebar ad to settings tab if it exists
  const settingsContainer = document.getElementById('settings-tab-content');
  if (settingsContainer) {
    const sidebarAdContainer = document.createElement('div');
    sidebarAdContainer.id = 'settings-sidebar-ad-container';
    sidebarAdContainer.classList.add('ad-container-wrapper');
    settingsContainer.appendChild(sidebarAdContainer);

    adDisplay.createAdElement('popup', 'sidebar', sidebarAdContainer);
  }

  // Add ads to history tab if it exists
  const historyContainer = document.getElementById('history-tab-content');
  if (historyContainer) {
    // Add between items ads
    const historyItems = historyContainer.querySelectorAll('.history-item');
    if (historyItems.length > 2) {
      // Add ad after every 3rd item
      for (let i = 2; i < historyItems.length; i += 3) {
        const adContainer = document.createElement('div');
        adContainer.classList.add('ad-container-wrapper', 'history-ad');
        historyItems[i].insertAdjacentElement('afterend', adContainer);

        adDisplay.createAdElement('history', 'betweenItems', adContainer);
      }
    }

    // Add bottom ad to history
    const bottomAdContainer = document.createElement('div');
    bottomAdContainer.id = 'history-bottom-ad-container';
    bottomAdContainer.classList.add('ad-container-wrapper');
    historyContainer.appendChild(bottomAdContainer);

    adDisplay.createAdElement('history', 'bottom', bottomAdContainer);
  }

  // Add ad-related styles
  addAdStyles();
}

/**
 * Add CSS styles for ads to the document
 */
function addAdStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .ad-container-wrapper {
      width: 100%;
      margin: 12px 0;
      display: flex;
      justify-content: center;
      overflow: hidden;
    }
    
    .ad-position-bottom {
      margin-top: 16px;
      border-top: 1px solid #e0e0e0;
      padding-top: 8px;
    }
    
    .ad-position-sidebar {
      float: right;
      margin-left: 12px;
      margin-bottom: 12px;
    }
    
    .ad-position-betweenItems {
      margin: 8px 0;
    }
    
    .ad-label {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 4px;
    }
    
    /* Premium badge to appear next to ads */
    .premium-badge {
      display: inline-block;
      background-color: #007bff;
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
      cursor: pointer;
    }
    
    /* Add premium upsell text */
    .premium-upsell {
      font-size: 11px;
      color: #666;
      text-align: center;
      margin-top: 4px;
    }
  `;

  document.head.appendChild(styleElement);
}

/**
 * Initialize A/B testing for ads
 * @param {boolean} enabled - Whether A/B testing should be enabled
 */
export function initializeAbTesting(enabled = true) {
  // Get current ad settings from storage
  chrome.storage.local.get(['adSettings'], result => {
    const adSettings = result.adSettings || {};
    adSettings.abTestingEnabled = enabled;

    // Save updated settings
    chrome.storage.local.set({ adSettings }, () => {
      console.log(`A/B testing ${enabled ? 'enabled' : 'disabled'}`);

      // Update ad manager
      adManager.abTests.active = enabled;

      // Force refresh ads if popup is open
      if (document.getElementById('popup-bottom-ad-container')) {
        // Remove existing ads
        document
          .querySelectorAll('.ad-container-wrapper')
          .forEach(container => {
            container.innerHTML = '';
          });

        // Re-add ads
        addAdsToPopup();
      }
    });
  });
}

/**
 * Show an interstitial ad if conditions are met
 * @param {string} trigger - What triggered the interstitial (conversion, settings, etc.)
 * @returns {boolean} Whether an interstitial was shown
 */
export function showInterstitialIfEligible(trigger) {
  try {
    // Check if we can show an interstitial
    if (!adDisplay.canShowInterstitial()) {
      console.log('Interstitial not eligible: cooldown period active');
      return false;
    }

    // Check subscription status
    const subscriptionManager = getSubscriptionManager();
    const subscription = subscriptionManager.getSubscriptionInfo();

    if (subscription && subscription.plan && subscription.plan !== 'free') {
      console.log('Interstitial not eligible: premium user');
      return false;
    }

    // For simplicity, we'll use a random chance approach instead of activity count
    // This avoids the async issues with the chrome.storage API
    const random = Math.floor(Math.random() * 10);
    if (random === 0) {
      console.log('Showing interstitial ad from trigger:', trigger);
      adDisplay.createInterstitialAd(trigger);
      return true;
    }

    console.log('Interstitial not shown: random check not met');
    return false;
  } catch (error) {
    console.error('Error showing interstitial:', error.message || error);
    return false;
  }
}

/**
 * Update ad preferences
 * @param {Object} preferences - New ad preferences
 */
export function updateAdPreferences(preferences) {
  chrome.storage.local.get(['adSettings'], result => {
    const adSettings = result.adSettings || {};
    adSettings.preferences = { ...adSettings.preferences, ...preferences };

    // Save updated settings
    chrome.storage.local.set({ adSettings }, () => {
      console.log('Ad preferences updated:', preferences);
    });
  });
}

// Export all functions
export default {
  initializeAds,
  initializeAbTesting,
  showInterstitialIfEligible,
  updateAdPreferences
};
