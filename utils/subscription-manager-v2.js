/**
 * Subscription Manager
 *
 * Manages user subscriptions, feature gating, and payment integration
 */

import { SUBSCRIPTION_PLANS, FeatureGate } from './subscription-plans.js';
import { PaymentProviderFactory } from './payment-providers-v2.js';

/**
 * Main Subscription Manager Class
 */
export class SubscriptionManager {
  constructor() {
    this.currentSubscription = null;
    this.userCountry = null;
    this.paymentProvider = null;
    this.usageTracking = new Map();

    this.STORAGE_KEYS = {
      SUBSCRIPTION: 'currentSubscription',
      USER_COUNTRY: 'userCountry',
      USAGE_TRACKING: 'usageTracking',
      PAYMENT_PROVIDER: 'paymentProvider'
    };

    this.initialize();
  }

  /**
   * Initialize the subscription manager
   */
  async initialize() {
    await this.loadSubscriptionData();
    await this.detectUserCountry();
    await this.initializePaymentProvider();
    await this.loadUsageTracking();
  }

  /**
   * Load subscription data from storage
   */
  async loadSubscriptionData() {
    try {
      const result = await chrome.storage.local.get([
        this.STORAGE_KEYS.SUBSCRIPTION
      ]);

      this.currentSubscription = result[this.STORAGE_KEYS.SUBSCRIPTION] || {
        plan: 'FREE',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: null,
        subscriptionId: null,
        paymentProvider: null
      };
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      this.currentSubscription = {
        plan: 'FREE',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: null,
        subscriptionId: null,
        paymentProvider: null
      };
    }
  }

  /**
   * Save subscription data to storage
   */
  async saveSubscriptionData() {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.SUBSCRIPTION]: this.currentSubscription
      });
    } catch (error) {
      console.error('Failed to save subscription data:', error);
    }
  }

  /**
   * Detect user's country for payment provider selection
   */
  async detectUserCountry() {
    try {
      // Try to get from storage first
      const result = await chrome.storage.local.get([
        this.STORAGE_KEYS.USER_COUNTRY
      ]);
      if (result[this.STORAGE_KEYS.USER_COUNTRY]) {
        this.userCountry = result[this.STORAGE_KEYS.USER_COUNTRY];
        return;
      }

      // Detect via browser locale
      let locale = 'en-US'; // Default fallback

      // Try to get locale in different environments
      if (typeof window !== 'undefined' && window.navigator) {
        locale =
          window.navigator.language || window.navigator.userLanguage || 'en-US';
      } else if (typeof chrome !== 'undefined' && chrome.i18n) {
        locale = chrome.i18n.getUILanguage() || 'en-US';
      }

      if (locale) {
        const countryCode = locale.split('-')[1] || locale.split('_')[1];
        if (countryCode) {
          this.userCountry = countryCode.toUpperCase();
          await this.saveUserCountry();
          return;
        }
      }

      // Fallback to US
      this.userCountry = 'US';
      await this.saveUserCountry();
    } catch (error) {
      console.error('Failed to detect user country:', error);
      this.userCountry = 'US';
    }
  }

  /**
   * Save user country to storage
   */
  async saveUserCountry() {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.USER_COUNTRY]: this.userCountry
      });
    } catch (error) {
      console.error('Failed to save user country:', error);
    }
  }

  /**
   * Initialize payment provider based on user country
   */
  async initializePaymentProvider() {
    try {
      const availableProviders = PaymentProviderFactory.getProviderForCountry(
        this.userCountry
      );

      if (availableProviders.length > 0) {
        // Use the highest priority provider
        const preferredProvider = availableProviders[0];

        // Load provider config (would be set by admin/setup)
        const result = await chrome.storage.local.get(['paymentConfigs']);
        const configs = result.paymentConfigs || {};
        const providerConfig = configs[preferredProvider.id] || {};

        if (Object.keys(providerConfig).length > 0) {
          this.paymentProvider = await PaymentProviderFactory.createProvider(
            preferredProvider.id,
            providerConfig
          );
        }
      }
    } catch (error) {
      console.error('Failed to initialize payment provider:', error);
    }
  }

  /**
   * Load usage tracking data
   */
  async loadUsageTracking() {
    try {
      const result = await chrome.storage.local.get([
        this.STORAGE_KEYS.USAGE_TRACKING
      ]);
      const trackingData = result[this.STORAGE_KEYS.USAGE_TRACKING] || {};

      // Reset daily counters if it's a new day
      const today = new Date().toDateString();
      if (trackingData.lastReset !== today) {
        trackingData.daily = {};
        trackingData.lastReset = today;
      }

      this.usageTracking = new Map(Object.entries(trackingData.daily || {}));

      // Save the reset data
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.USAGE_TRACKING]: trackingData
      });
    } catch (error) {
      console.error('Failed to load usage tracking:', error);
      this.usageTracking = new Map();
    }
  }

  /**
   * Save usage tracking data
   */
  async saveUsageTracking() {
    try {
      const trackingData = {
        daily: Object.fromEntries(this.usageTracking),
        lastReset: new Date().toDateString()
      };

      await chrome.storage.local.set({
        [this.STORAGE_KEYS.USAGE_TRACKING]: trackingData
      });
    } catch (error) {
      console.error('Failed to save usage tracking:', error);
    }
  }

  /**
   * Check if a feature is available for the current subscription
   */
  hasFeature(featureName) {
    return FeatureGate.isFeatureAvailable(
      this.currentSubscription.plan,
      featureName
    );
  }

  /**
   * Get feature limit for current subscription
   */
  getFeatureLimit(featureName) {
    return FeatureGate.getFeatureLimit(
      this.currentSubscription.plan,
      featureName
    );
  }

  /**
   * Check if usage is within limits
   */
  isWithinLimit(featureName, additionalUsage = 1) {
    const currentUsage = this.usageTracking.get(featureName) || 0;
    const totalUsage = currentUsage + additionalUsage;
    return FeatureGate.isWithinLimit(
      this.currentSubscription.plan,
      featureName,
      totalUsage
    );
  }

  /**
   * Track feature usage
   */
  async trackUsage(featureName, amount = 1) {
    const currentUsage = this.usageTracking.get(featureName) || 0;
    this.usageTracking.set(featureName, currentUsage + amount);
    await this.saveUsageTracking();
  }

  /**
   * Get current usage for a feature
   */
  getCurrentUsage(featureName) {
    return this.usageTracking.get(featureName) || 0;
  }

  /**
   * Get usage percentage for a feature
   */
  getUsagePercentage(featureName) {
    const current = this.getCurrentUsage(featureName);
    const limit = this.getFeatureLimit(featureName);

    if (typeof limit !== 'number' || limit === 0) {
      return 0;
    }

    return Math.min((current / limit) * 100, 100);
  }

  /**
   * Check if user can perform an action
   */
  canPerformAction(featureName, amount = 1) {
    if (!this.hasFeature(featureName)) {
      return {
        allowed: false,
        reason: 'feature_not_available',
        upgradeNeeded: FeatureGate.getUpgradeRecommendation(
          this.currentSubscription.plan,
          featureName
        )
      };
    }

    if (!this.isWithinLimit(featureName, amount)) {
      return {
        allowed: false,
        reason: 'limit_exceeded',
        current: this.getCurrentUsage(featureName),
        limit: this.getFeatureLimit(featureName),
        upgradeNeeded: FeatureGate.getUpgradeRecommendation(
          this.currentSubscription.plan,
          featureName
        )
      };
    }

    return { allowed: true };
  }

  /**
   * Get subscription info
   */
  getSubscriptionInfo() {
    const plan =
      SUBSCRIPTION_PLANS[this.currentSubscription.plan] ||
      SUBSCRIPTION_PLANS.FREE;

    return {
      ...this.currentSubscription,
      planDetails: plan,
      usageStats: this.getUsageStats(),
      availableUpgrades: this.getAvailableUpgrades()
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const stats = {};
    const plan =
      SUBSCRIPTION_PLANS[this.currentSubscription.plan] ||
      SUBSCRIPTION_PLANS.FREE;

    Object.keys(plan.features).forEach(feature => {
      const current = this.getCurrentUsage(feature);
      const limit = this.getFeatureLimit(feature);
      const percentage = this.getUsagePercentage(feature);

      stats[feature] = {
        current,
        limit,
        percentage,
        available: this.hasFeature(feature)
      };
    });

    return stats;
  }

  /**
   * Get available upgrade options
   */
  getAvailableUpgrades() {
    const currentPlan = this.currentSubscription.plan;
    const upgrades = [];

    if (currentPlan === 'FREE') {
      upgrades.push({
        plan: 'PREMIUM',
        details: SUBSCRIPTION_PLANS.PREMIUM
      });
      upgrades.push({
        plan: 'PRO',
        details: SUBSCRIPTION_PLANS.PRO
      });
    } else if (currentPlan === 'PREMIUM') {
      upgrades.push({
        plan: 'PRO',
        details: SUBSCRIPTION_PLANS.PRO
      });
    }

    return upgrades;
  }

  /**
   * Get available payment providers for user's country
   */
  getAvailablePaymentProviders() {
    return PaymentProviderFactory.getProviderForCountry(this.userCountry);
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(planId, paymentProviderId, userInfo) {
    try {
      // Validate plan
      if (!SUBSCRIPTION_PLANS[planId.toUpperCase()]) {
        throw new Error('Invalid subscription plan');
      }

      // Initialize payment provider if different from current
      let provider = this.paymentProvider;
      if (
        !provider ||
        paymentProviderId !== this.currentSubscription.paymentProvider
      ) {
        const result = await chrome.storage.local.get(['paymentConfigs']);
        const configs = result.paymentConfigs || {};
        const providerConfig = configs[paymentProviderId];

        if (!providerConfig) {
          throw new Error('Payment provider not configured');
        }

        provider = await PaymentProviderFactory.createProvider(
          paymentProviderId,
          providerConfig
        );
      }

      // Create subscription
      const result = await provider.createSubscription(
        planId.toLowerCase(),
        userInfo
      );

      if (result.success) {
        // Update subscription data
        this.currentSubscription = {
          plan: planId.toUpperCase(),
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: null, // Will be updated by webhook
          subscriptionId: result.subscriptionId,
          paymentProvider: paymentProviderId
        };

        await this.saveSubscriptionData();
        return { success: true, subscription: this.currentSubscription };
      } else {
        throw new Error(result.error || 'Subscription creation failed');
      }
    } catch (error) {
      console.error('Subscription upgrade failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription() {
    try {
      if (!this.currentSubscription.subscriptionId || !this.paymentProvider) {
        throw new Error('No active subscription to cancel');
      }

      const result = await this.paymentProvider.cancelSubscription(
        this.currentSubscription.subscriptionId
      );

      if (result.success) {
        // Update subscription to free plan
        this.currentSubscription = {
          plan: 'FREE',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: null,
          subscriptionId: null,
          paymentProvider: null
        };

        await this.saveSubscriptionData();
        return { success: true };
      } else {
        throw new Error(result.error || 'Subscription cancellation failed');
      }
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process one-time payment (for donations, etc.)
   */
  async processOneTimePayment(
    amount,
    currency,
    description,
    paymentProviderId
  ) {
    try {
      let provider = this.paymentProvider;

      if (
        !provider ||
        paymentProviderId !== this.currentSubscription.paymentProvider
      ) {
        const result = await chrome.storage.local.get(['paymentConfigs']);
        const configs = result.paymentConfigs || {};
        const providerConfig = configs[paymentProviderId];

        if (!providerConfig) {
          throw new Error('Payment provider not configured');
        }

        provider = await PaymentProviderFactory.createProvider(
          paymentProviderId,
          providerConfig
        );
      }

      return await provider.processOneTimePayment(
        amount,
        currency,
        description
      );
    } catch (error) {
      console.error('One-time payment failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync subscription status with payment provider
   */
  async syncSubscriptionStatus() {
    try {
      if (!this.currentSubscription.subscriptionId || !this.paymentProvider) {
        return { success: true }; // Nothing to sync for free plan
      }

      const result = await this.paymentProvider.getSubscriptionStatus(
        this.currentSubscription.subscriptionId
      );

      if (result.success && result.subscription) {
        // Update local subscription data
        this.currentSubscription.status = result.subscription.status;
        this.currentSubscription.endDate = result.subscription.endDate;

        // Handle subscription expiration
        if (
          result.subscription.status === 'cancelled' ||
          result.subscription.status === 'expired'
        ) {
          this.currentSubscription.plan = 'FREE';
          this.currentSubscription.subscriptionId = null;
          this.currentSubscription.paymentProvider = null;
        }

        await this.saveSubscriptionData();
      }

      return result;
    } catch (error) {
      console.error('Subscription sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get feature usage warnings (near limits)
   */
  getUsageWarnings() {
    const warnings = [];
    const plan =
      SUBSCRIPTION_PLANS[this.currentSubscription.plan] ||
      SUBSCRIPTION_PLANS.FREE;

    Object.keys(plan.features).forEach(feature => {
      const percentage = this.getUsagePercentage(feature);

      if (percentage >= 80) {
        warnings.push({
          feature,
          percentage,
          current: this.getCurrentUsage(feature),
          limit: this.getFeatureLimit(feature),
          upgradeNeeded: FeatureGate.getUpgradeRecommendation(
            this.currentSubscription.plan,
            feature
          )
        });
      }
    });

    return warnings;
  }

  /**
   * Reset usage tracking (for testing/admin purposes)
   */
  async resetUsageTracking() {
    this.usageTracking.clear();
    await this.saveUsageTracking();
  }

  /**
   * Update subscription from webhook data
   */
  async updateSubscriptionFromWebhook(webhookData) {
    try {
      this.currentSubscription.status = webhookData.status;
      this.currentSubscription.endDate = webhookData.endDate;

      if (
        webhookData.status === 'cancelled' ||
        webhookData.status === 'expired'
      ) {
        this.currentSubscription.plan = 'FREE';
        this.currentSubscription.subscriptionId = null;
        this.currentSubscription.paymentProvider = null;
      } else if (webhookData.planId) {
        this.currentSubscription.plan = webhookData.planId.toUpperCase();
      }

      await this.saveSubscriptionData();
      return { success: true };
    } catch (error) {
      console.error('Webhook subscription update failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
let subscriptionManagerInstance = null;

export function getSubscriptionManager() {
  if (!subscriptionManagerInstance) {
    subscriptionManagerInstance = new SubscriptionManager();
  }
  return subscriptionManagerInstance;
}

export default {
  SubscriptionManager,
  getSubscriptionManager
};
