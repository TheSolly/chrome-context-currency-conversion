/**
 * Ad Settings Component - Settings tab add-on for managing advertisement settings
 * This file provides UI and logic for ad preference configuration
 */

import { initializeAbTesting, updateAdPreferences } from '../ad-integration.js';
import { getSubscriptionManager } from '/utils/subscription-manager-v2.js';

export class AdSettingsComponent {
  constructor() {
    this.subscriptionManager = null;
    this.userPlan = 'FREE';
    this.adSettings = {
      abTestingEnabled: true,
      preferences: {
        region: 'global'
      }
    };
    this.visible = false;
    this.initialized = false;
  }

  /**
   * Initialize the component
   */
  async initialize() {
    try {
      // Get subscription manager instance
      this.subscriptionManager = getSubscriptionManager();

      // Get current subscription
      const subscription = this.subscriptionManager.getSubscriptionInfo();
      this.userPlan = (subscription?.plan || 'FREE').toUpperCase();

      // Don't show ad settings for premium users
      if (this.userPlan !== 'FREE') {
        this.visible = false;
        return;
      }

      // Get current ad settings
      await this.loadAdSettings();

      // Create settings UI
      this.createAdSettingsUI();

      // Setup event listeners
      this.setupEventListeners();

      this.initialized = true;
      this.visible = true;

      console.log('✅ Ad settings component initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ad settings component:', error);
      this.visible = false;
    }
  }

  /**
   * Load ad settings from storage
   */
  async loadAdSettings() {
    try {
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['adSettings'], resolve);
      });

      if (result.adSettings) {
        this.adSettings = result.adSettings;
      }

      console.log('📋 Ad settings loaded:', this.adSettings);
    } catch (error) {
      console.error('❌ Failed to load ad settings:', error);
    }
  }

  /**
   * Create the UI for ad settings
   */
  createAdSettingsUI() {
    // Find the settings panel to insert ad settings
    const settingsPanel = document.querySelector('#settingsPanel');
    if (!settingsPanel) {
      console.error('❌ Settings panel not found');
      return;
    }

    // Create ad settings section
    const adSettingsSection = document.createElement('section');
    adSettingsSection.className = 'setting-card';
    adSettingsSection.setAttribute('role', 'region');
    adSettingsSection.setAttribute('aria-labelledby', 'ad-settings-heading');
    adSettingsSection.setAttribute('id', 'ad-settings');

    adSettingsSection.innerHTML = `
      <div class="flex items-center gap-2 mb-3">
        <span class="text-lg" aria-hidden="true">🎯</span>
        <h2 id="ad-settings-heading" class="text-base font-semibold text-gray-900">
          Advertising Preferences
          <span class="text-xs ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Free Plan</span>
        </h2>
      </div>
      
      <div class="space-y-3">
        <p class="text-sm text-gray-600 mb-3">
          Configure how advertisements are displayed in the extension. Upgrade to premium to remove all ads.
        </p>
      
        <!-- Ad Region Preference -->
        <div class="setting-group">
          <label for="adRegion" class="block text-sm font-medium text-gray-700 mb-1">
            Ad Region
          </label>
          <select id="adRegion" class="form-select text-sm">
            <option value="global" ${this.adSettings.preferences.region === 'global' ? 'selected' : ''}>Global</option>
            <option value="Egypt" ${this.adSettings.preferences.region === 'Egypt' ? 'selected' : ''}>Egypt</option>
            <option value="UAE" ${this.adSettings.preferences.region === 'UAE' ? 'selected' : ''}>UAE</option>
            <option value="Saudi Arabia" ${this.adSettings.preferences.region === 'Saudi Arabia' ? 'selected' : ''}>Saudi Arabia</option>
            <option value="Qatar" ${this.adSettings.preferences.region === 'Qatar' ? 'selected' : ''}>Qatar</option>
            <option value="other" ${!['global', 'Egypt', 'UAE', 'Saudi Arabia', 'Qatar'].includes(this.adSettings.preferences.region) ? 'selected' : ''}>Other</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">Select your preferred region for more relevant ads</p>
        </div>
        
        <!-- A/B Testing Opt-out -->
        <div class="setting-group">
          <div class="flex items-center justify-between">
            <label for="abTesting" class="text-sm font-medium text-gray-700">
              Participate in A/B Testing
              <span class="block text-xs text-gray-500">Help us improve ad experience</span>
            </label>
            <div class="toggle-switch">
              <input type="checkbox" id="abTesting" ${this.adSettings.abTestingEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </div>
          </div>
        </div>
        
        <!-- Premium upgrade prompt -->
        <div class="mt-4 bg-primary-50 p-3 rounded-lg border border-primary-200">
          <div class="flex items-center">
            <span class="text-xl mr-2">💎</span>
            <div>
              <h4 class="font-medium text-primary-800">Remove all ads</h4>
              <p class="text-xs text-primary-700">Upgrade to Premium for an ad-free experience</p>
            </div>
            <button id="upgradeFromAds" class="ml-auto bg-primary-500 hover:bg-primary-600 text-white text-xs py-1 px-3 rounded transition-colors">
              Upgrade
            </button>
          </div>
        </div>
      </div>
    `;

    // Add the section to the settings panel
    settingsPanel.appendChild(adSettingsSection);
  }

  /**
   * Setup event listeners for ad settings controls
   */
  setupEventListeners() {
    // A/B Testing toggle
    document.getElementById('abTesting')?.addEventListener('change', event => {
      const enabled = event.target.checked;
      this.updateAbTesting(enabled);
    });

    // Region selection
    document.getElementById('adRegion')?.addEventListener('change', event => {
      const region = event.target.value;
      this.updateAdRegion(region);
    });

    // Upgrade button
    document.getElementById('upgradeFromAds')?.addEventListener('click', () => {
      // Switch to subscription tab
      const subscriptionTab = document.getElementById('subscriptionTab');
      if (subscriptionTab) {
        subscriptionTab.click();
      }
    });
  }

  /**
   * Update A/B testing setting
   * @param {boolean} enabled - Whether A/B testing should be enabled
   */
  async updateAbTesting(enabled) {
    try {
      // Update local state
      this.adSettings.abTestingEnabled = enabled;

      // Save to storage
      await new Promise(resolve => {
        chrome.storage.local.set({ adSettings: this.adSettings }, resolve);
      });

      // Initialize A/B testing with new setting
      initializeAbTesting(enabled);

      console.log(`✅ A/B testing ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Failed to update A/B testing setting:', error);
    }
  }

  /**
   * Update ad region setting
   * @param {string} region - The selected region
   */
  async updateAdRegion(region) {
    try {
      // Update local state
      this.adSettings.preferences.region = region;

      // Save to storage
      await new Promise(resolve => {
        chrome.storage.local.set({ adSettings: this.adSettings }, resolve);
      });

      // Update ad preferences
      updateAdPreferences({ region });

      console.log(`✅ Ad region updated to: ${region}`);
    } catch (error) {
      console.error('❌ Failed to update ad region:', error);
    }
  }

  /**
   * Check if the component should be visible
   * @returns {boolean} Whether the component should be visible
   */
  isVisible() {
    return this.visible;
  }
}

export default AdSettingsComponent;
