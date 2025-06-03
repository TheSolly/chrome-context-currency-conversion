/**
 * Ad Manager for Chrome Currency Conversion Extension
 * Handles non-intrusive ad placements, network integration, and A/B testing
 */

import { settingsManager } from './settings-manager.js';
import { getSubscriptionManager } from './subscription-manager-v2.js';

class AdManager {
  constructor() {
    this.adNetworks = {
      google: {
        name: 'Google AdSense',
        enabled: true,
        regions: ['global'],
        testId: 'ca-pub-test-id',
        productionId: 'ca-pub-production-id',
        formats: ['banner', 'native']
      },
      adsense: {
        name: 'Google AdSense',
        enabled: true,
        regions: ['global'],
        testId: 'ca-pub-test-id',
        productionId: 'ca-pub-production-id',
        formats: ['banner', 'native']
      },
      mena: {
        name: 'MENA Ad Network',
        enabled: true,
        regions: [
          'Egypt',
          'UAE',
          'Saudi Arabia',
          'Qatar',
          'Kuwait',
          'Bahrain',
          'Oman'
        ],
        testId: 'mena-test-id',
        productionId: 'mena-production-id',
        formats: ['banner', 'native', 'interstitial']
      }
    };

    this.adPositions = {
      popup: {
        bottom: { enabled: true, weight: 0.7, formats: ['banner'] },
        sidebar: { enabled: true, weight: 0.3, formats: ['native'] }
      },
      history: {
        bottom: { enabled: true, weight: 0.5, formats: ['banner'] },
        betweenItems: { enabled: true, weight: 0.5, formats: ['native'] }
      },
      interstitial: {
        fullscreen: { enabled: true, weight: 1.0, formats: ['interstitial'] }
      }
    };

    this.abTests = {
      active: false,
      variants: ['A', 'B'],
      currentVariant: 'A',
      metrics: {
        impressions: { A: 0, B: 0 },
        clicks: { A: 0, B: 0 },
        ctr: { A: 0, B: 0 }
      }
    };

    this.debugMode = false;
    this.showAds = true; // Default to showing ads
    this.adPreferences = { region: 'global' }; // Default preferences

    // Initialize asynchronously but don't block constructor
    this.initialize();
  }

  /**
   * Initialize the ad manager
   */
  async initialize() {
    try {
      // Get subscription manager
      const subscriptionManager = getSubscriptionManager();

      // Default to showing ads unless we can confirm user is premium
      this.showAds = true;

      // Check if subscription manager exists
      if (subscriptionManager) {
        try {
          // Check if user is premium (no ads for premium users)
          const userSubscription = subscriptionManager.getSubscriptionInfo();

          // Only update showAds if we got a valid subscription object with a plan
          if (
            userSubscription &&
            userSubscription.plan &&
            typeof userSubscription.plan === 'string'
          ) {
            this.showAds = userSubscription.plan.toLowerCase() === 'free';
            console.log(`Subscription plan detected: ${userSubscription.plan}`);
          } else {
            console.warn(
              'Invalid subscription info, defaulting to showing ads:',
              userSubscription
            );
          }
        } catch (subscriptionError) {
          console.error(
            'Error getting subscription info:',
            subscriptionError.message || subscriptionError
          );
          // Keep default (show ads) on error
        }
      } else {
        console.warn(
          'Subscription manager not available, defaulting to showing ads'
        );
      }

      // Load stored ad settings and preferences
      const adSettings =
        (await settingsManager.getSettings('adSettings')) || {};
      this.adPreferences = adSettings.preferences || {};
      this.abTests.active = adSettings.abTestingEnabled || false;

      // If A/B testing is active, determine variant based on user ID
      if (this.abTests.active) {
        const userId = await settingsManager.getSettings('userId');
        this.abTests.currentVariant = this.determineVariant(userId);
      }

      console.log(
        'Ad Manager initialized:',
        this.showAds ? 'Ads enabled' : 'User is premium - Ads disabled'
      );
    } catch (error) {
      console.error('Error initializing Ad Manager:', error);
      // Default to showing ads on error
      this.showAds = true;
    }
  }

  /**
   * Determine A/B test variant for the user
   * @param {string} userId - The user's unique ID
   * @returns {string} The A/B test variant (A or B)
   */
  determineVariant(userId) {
    if (!userId) return 'A';
    // Simple deterministic variant assignment based on user ID
    return userId.charCodeAt(0) % 2 === 0 ? 'A' : 'B';
  }

  /**
   * Check if an ad should be shown at a specific position
   * @param {string} location - The location in the UI
   * @param {string} position - The position within the location
   * @returns {boolean} Whether an ad should be shown
   */
  shouldShowAd(location, position) {
    try {
      // If showAds is not explicitly true, don't show ads
      if (this.showAds !== true) {
        return false;
      }

      // Check if location is valid
      if (!location || !position || !this.adPositions) {
        console.warn('Invalid ad request parameters:', { location, position });
        return false;
      }

      // Check if the position is defined and enabled
      const locationConfig = this.adPositions[location];
      if (!locationConfig) {
        console.warn(`Ad location "${location}" not configured`);
        return false;
      }

      const positionConfig = locationConfig[position];
      if (!positionConfig || !positionConfig.enabled) {
        console.warn(
          `Ad position "${position}" not enabled for location "${location}"`
        );
        return false;
      }

      // Apply A/B testing rules if active
      if (this.abTests && this.abTests.active) {
        if (this.abTests.currentVariant === 'A' && position === 'betweenItems')
          return false;
        if (this.abTests.currentVariant === 'B' && position === 'sidebar')
          return false;
      }

      return true;
    } catch (error) {
      console.error('Error in shouldShowAd:', error.message || error);
      return false; // Default to not showing ads on error
    }
  }

  /**
   * Get the appropriate ad for a location and position
   * @param {string} location - The location in the UI
   * @param {string} position - The position within the location
   * @returns {Object|null} Ad configuration or null if no ad should be shown
   */
  getAd(location, position) {
    try {
      // Validate inputs
      if (!location || !position) {
        console.warn('Missing parameters for getAd:', { location, position });
        return null;
      }

      // Verify ad position exists
      if (
        !this.adPositions[location] ||
        !this.adPositions[location][position]
      ) {
        console.warn('Invalid ad position requested:', { location, position });
        return null;
      }

      if (!this.shouldShowAd(location, position)) {
        console.log('Ad display conditions not met for:', {
          location,
          position
        });
        return null;
      }

      // Get user region from settings (default to global)
      const userRegion = this.adPreferences.region || 'global';

      // Select appropriate ad network based on region
      let network = this.adNetworks.google; // Default

      if (this.isInMenaRegion(userRegion) && this.adNetworks.mena.enabled) {
        network = this.adNetworks.mena;
      }

      // Select format based on position
      const formats = this.adPositions[location][position].formats;
      if (!formats || formats.length === 0) {
        console.warn('No ad formats available for position:', {
          location,
          position
        });
        return null;
      }

      const format = formats[0]; // Default to first format

      // Track impression for A/B testing
      if (this.abTests.active) {
        this.abTests.metrics.impressions[this.abTests.currentVariant]++;
      }

      return {
        network: network.name,
        networkId: this.debugMode ? network.testId : network.productionId,
        format,
        container: `ad-${location}-${position}`,
        variant: this.abTests.active ? this.abTests.currentVariant : null
      };
    } catch (error) {
      console.error('Error getting ad configuration:', error.message || error);
      return null; // Return null on any error
    }
  }

  /**
   * Check if a region is in the MENA group
   * @param {string} region - User's region
   * @returns {boolean} Whether the region is in MENA
   */
  isInMenaRegion(region) {
    return this.adNetworks.mena.regions.includes(region);
  }

  /**
   * Track ad click for analytics and A/B testing
   * @param {string} location - The location in the UI
   * @param {string} position - The position within the location
   */
  trackAdClick(location, position) {
    console.log(`Ad click: ${location} - ${position}`);

    if (this.abTests.active) {
      this.abTests.metrics.clicks[this.abTests.currentVariant]++;
      // Update CTR
      const impressions =
        this.abTests.metrics.impressions[this.abTests.currentVariant];
      const clicks = this.abTests.metrics.clicks[this.abTests.currentVariant];
      this.abTests.metrics.ctr[this.abTests.currentVariant] =
        impressions > 0 ? (clicks / impressions) * 100 : 0;
    }

    // Save metrics to storage
    this.saveMetrics();
  }

  /**
   * Save metrics to Chrome storage
   */
  async saveMetrics() {
    try {
      const adSettings =
        (await settingsManager.getSettings('adSettings')) || {};
      adSettings.metrics = this.abTests.metrics;
      await settingsManager.updateSetting('adSettings', adSettings);
    } catch (error) {
      console.error('Error saving ad metrics:', error);
    }
  }

  /**
   * Get A/B testing results
   * @returns {Object} A/B testing metrics
   */
  getAbTestResults() {
    return this.abTests.metrics;
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether debug mode should be enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    console.log(`Ad Manager debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create and export singleton instance
export const adManager = new AdManager();
export default adManager;
