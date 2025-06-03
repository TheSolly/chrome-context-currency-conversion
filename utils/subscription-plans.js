/**
 * Subscription Plans Configuration
 *
 * Defines the freemium model structure with clear feature gating
 */

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: null,
    features: {
      // Core features
      basicConversion: true,
      currencyCount: 2,
      dailyConversions: 50,

      // Rate updates
      rateUpdates: 'daily', // daily, hourly, realtime

      // History and tracking
      conversionHistory: 10, // Number of saved conversions
      favoriteAmounts: 3,

      // Alerts and notifications
      rateAlerts: 0,

      // Advanced features
      bulkConversion: false,
      customRates: false,
      offlineMode: false,
      csvExport: false,
      apiAccess: false,

      // Premium UI
      adFree: false,
      themes: false,
      customCurrencyDisplay: false
    },
    limitations: {
      dailyApiCalls: 100,
      historyRetentionDays: 7,
      supportLevel: 'community'
    }
  },

  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    features: {
      // Core features
      basicConversion: true,
      currencyCount: 20,
      dailyConversions: 500,

      // Rate updates
      rateUpdates: 'hourly',

      // History and tracking
      conversionHistory: 100,
      favoriteAmounts: 20,

      // Alerts and notifications
      rateAlerts: 5,

      // Advanced features
      bulkConversion: true,
      customRates: false,
      offlineMode: true,
      csvExport: true,
      apiAccess: false,

      // Premium UI
      adFree: true,
      themes: true,
      customCurrencyDisplay: true
    },
    limitations: {
      dailyApiCalls: 1000,
      historyRetentionDays: 90,
      supportLevel: 'email'
    }
  },

  PRO: {
    id: 'pro',
    name: 'Professional',
    price: 14.99,
    currency: 'USD',
    interval: 'month',
    features: {
      // Core features
      basicConversion: true,
      currencyCount: 999, // Unlimited
      dailyConversions: 999999, // Unlimited

      // Rate updates
      rateUpdates: 'realtime',

      // History and tracking
      conversionHistory: 999999, // Unlimited
      favoriteAmounts: 999, // Unlimited

      // Alerts and notifications
      rateAlerts: 50,

      // Advanced features
      bulkConversion: true,
      customRates: true,
      offlineMode: true,
      csvExport: true,
      apiAccess: true,

      // Premium UI
      adFree: true,
      themes: true,
      customCurrencyDisplay: true
    },
    limitations: {
      dailyApiCalls: 10000,
      historyRetentionDays: 365,
      supportLevel: 'priority'
    }
  }
};

export const PLAN_COMPARISON = [
  {
    feature: 'Daily Conversions',
    free: '50',
    premium: '500',
    pro: 'Unlimited'
  },
  {
    feature: 'Currency Pairs',
    free: '2',
    premium: '20',
    pro: 'Unlimited'
  },
  {
    feature: 'Rate Updates',
    free: 'Daily',
    premium: 'Hourly',
    pro: 'Real-time'
  },
  {
    feature: 'Conversion History',
    free: '10 entries',
    premium: '100 entries',
    pro: 'Unlimited'
  },
  {
    feature: 'Rate Alerts',
    free: 'None',
    premium: '5 alerts',
    pro: '50 alerts'
  },
  {
    feature: 'Bulk Conversion',
    free: false,
    premium: true,
    pro: true
  },
  {
    feature: 'CSV Export',
    free: false,
    premium: true,
    pro: true
  },
  {
    feature: 'Offline Mode',
    free: false,
    premium: true,
    pro: true
  },
  {
    feature: 'Custom Rates',
    free: false,
    premium: false,
    pro: true
  },
  {
    feature: 'API Access',
    free: false,
    premium: false,
    pro: true
  },
  {
    feature: 'Ad-Free Experience',
    free: false,
    premium: true,
    pro: true
  },
  {
    feature: 'Custom Themes',
    free: false,
    premium: true,
    pro: true
  },
  {
    feature: 'Priority Support',
    free: false,
    premium: false,
    pro: true
  }
];

/**
 * Feature gating utility functions
 */
export class FeatureGate {
  /**
   * Check if a feature is available for the current plan
   */
  static isFeatureAvailable(currentPlan, featureName) {
    const plan =
      SUBSCRIPTION_PLANS[currentPlan?.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
    return plan.features[featureName] || false;
  }

  /**
   * Get feature limit for the current plan
   */
  static getFeatureLimit(currentPlan, featureName) {
    const plan =
      SUBSCRIPTION_PLANS[currentPlan?.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
    return plan.features[featureName] || 0;
  }

  /**
   * Check if usage is within plan limits
   */
  static isWithinLimit(currentPlan, featureName, currentUsage) {
    const limit = this.getFeatureLimit(currentPlan, featureName);
    if (typeof limit === 'boolean') {
      return limit;
    }
    if (typeof limit === 'number') {
      return currentUsage <= limit;
    }
    return true;
  }

  /**
   * Get upgrade recommendation for a feature
   */
  static getUpgradeRecommendation(currentPlan, featureName) {
    const current = currentPlan?.toUpperCase() || 'FREE';

    if (current === 'FREE') {
      const premiumHasFeature =
        SUBSCRIPTION_PLANS.PREMIUM.features[featureName];
      if (premiumHasFeature) {
        return 'PREMIUM';
      }

      const proHasFeature = SUBSCRIPTION_PLANS.PRO.features[featureName];
      if (proHasFeature) {
        return 'PRO';
      }
    }

    if (current === 'PREMIUM') {
      const proHasFeature = SUBSCRIPTION_PLANS.PRO.features[featureName];
      if (proHasFeature) {
        return 'PRO';
      }
    }

    return null;
  }

  /**
   * Get all unavailable features for current plan
   */
  static getUnavailableFeatures(currentPlan) {
    const plan =
      SUBSCRIPTION_PLANS[currentPlan?.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
    const unavailable = [];

    // Check against PRO plan features
    const proFeatures = SUBSCRIPTION_PLANS.PRO.features;
    for (const [feature, available] of Object.entries(proFeatures)) {
      if (!plan.features[feature] || plan.features[feature] < available) {
        unavailable.push({
          feature,
          current: plan.features[feature],
          available: available,
          upgradeNeeded: this.getUpgradeRecommendation(currentPlan, feature)
        });
      }
    }

    return unavailable;
  }
}

export default {
  SUBSCRIPTION_PLANS,
  PLAN_COMPARISON,
  FeatureGate
};
