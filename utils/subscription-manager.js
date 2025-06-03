/**
 * Subscription Manager
 * Handles user subscriptions, feature gating, and payment provider integration
 * Supports multiple payment providers for global accessibility
 */

/**
 * Subscription plans and features
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: null,
    features: {
      maxCurrencies: 3,
      maxAdditionalCurrencies: 2,
      conversionHistory: false,
      realTimeRates: false,
      notifications: false,
      themes: false,
      exportData: false,
      rateAlerts: false,
      prioritySupport: false,
      adFree: false,
      maxHistoryEntries: 10,
      apiCallsPerDay: 100
    },
    limitations: [
      'Limited to 3 currencies',
      'Basic conversion only',
      'Daily rate updates',
      'Limited conversion history'
    ]
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    features: {
      maxCurrencies: 15,
      maxAdditionalCurrencies: 12,
      conversionHistory: true,
      realTimeRates: true,
      notifications: true,
      themes: true,
      exportData: true,
      rateAlerts: true,
      prioritySupport: false,
      adFree: true,
      maxHistoryEntries: 1000,
      apiCallsPerDay: 1000
    },
    benefits: [
      'Unlimited currencies',
      'Real-time exchange rates',
      'Rate alerts & notifications',
      'Conversion history & export',
      'Custom themes',
      'Ad-free experience'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: {
      maxCurrencies: -1, // Unlimited
      maxAdditionalCurrencies: -1, // Unlimited
      conversionHistory: true,
      realTimeRates: true,
      notifications: true,
      themes: true,
      exportData: true,
      rateAlerts: true,
      prioritySupport: true,
      adFree: true,
      maxHistoryEntries: -1, // Unlimited
      apiCallsPerDay: 5000
    },
    benefits: [
      'Everything in Premium',
      'Unlimited currencies',
      'Priority customer support',
      'Advanced analytics',
      'White-label options',
      'API access'
    ]
  }
};

/**
 * Supported payment providers
 */
export const PAYMENT_PROVIDERS = {
  STRIPE: {
    id: 'stripe',
    name: 'Stripe',
    supportedCountries: [
      'US',
      'CA',
      'GB',
      'AU',
      'FR',
      'DE',
      'IT',
      'ES',
      'NL',
      'SE',
      'NO',
      'DK',
      'FI',
      'AT',
      'BE',
      'CH',
      'IE',
      'PT',
      'LU',
      'GR',
      'CY',
      'MT',
      'SI',
      'SK',
      'LV',
      'LT',
      'EE',
      'HR',
      'BG',
      'RO',
      'CZ',
      'HU',
      'PL',
      'JP',
      'SG',
      'MY',
      'TH',
      'HK',
      'NZ',
      'MX',
      'BR',
      'IN',
      'ID',
      'AE'
    ],
    enabled: true,
    testMode: true
  },
  PAYPAL: {
    id: 'paypal',
    name: 'PayPal',
    supportedCountries: ['*'], // Global support
    enabled: true,
    testMode: true
  },
  PADDLE: {
    id: 'paddle',
    name: 'Paddle',
    supportedCountries: ['*'], // Global support with tax handling
    enabled: true,
    testMode: true
  },
  PAYMOB: {
    id: 'paymob',
    name: 'Paymob',
    supportedCountries: [
      'EG',
      'SA',
      'AE',
      'KW',
      'QA',
      'BH',
      'OM',
      'JO',
      'LB',
      'PK'
    ],
    enabled: true,
    testMode: true
  }
};

/**
 * Subscription Manager Class
 */
export class SubscriptionManager {
  constructor() {
    this.currentSubscription = null;
    this.userCountry = null;
    this.availableProviders = [];
    this.chromeApisAvailable = typeof chrome !== 'undefined' && chrome.storage;

    // Storage keys
    this.STORAGE_KEYS = {
      SUBSCRIPTION: 'userSubscription',
      SUBSCRIPTION_HISTORY: 'subscriptionHistory',
      PAYMENT_METHOD: 'paymentMethod',
      USER_COUNTRY: 'userCountry',
      TRIAL_STATUS: 'trialStatus'
    };

    // Default subscription (Free)
    this.DEFAULT_SUBSCRIPTION = {
      plan: 'FREE',
      status: 'active',
      startDate: Date.now(),
      endDate: null,
      paymentProvider: null,
      subscriptionId: null,
      trialUsed: false,
      features: SUBSCRIPTION_PLANS.FREE.features
    };
  }

  /**
   * Initialize subscription manager
   */
  async initialize() {
    try {
      console.log('🎫 Initializing Subscription Manager...');

      // Detect user country
      await this.detectUserCountry();

      // Load current subscription
      await this.loadSubscription();

      // Update available payment providers
      this.updateAvailableProviders();

      // Check subscription status
      await this.validateSubscriptionStatus();

      console.log('✅ Subscription Manager initialized:', {
        plan: this.currentSubscription.plan,
        status: this.currentSubscription.status,
        availableProviders: this.availableProviders.length
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize subscription manager:', error);
      // Fall back to free plan
      this.currentSubscription = { ...this.DEFAULT_SUBSCRIPTION };
      return false;
    }
  }

  /**
   * Detect user's country for payment provider selection
   */
  async detectUserCountry() {
    try {
      // Try to get stored country first
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get([
          this.STORAGE_KEYS.USER_COUNTRY
        ]);
        if (result[this.STORAGE_KEYS.USER_COUNTRY]) {
          this.userCountry = result[this.STORAGE_KEYS.USER_COUNTRY];
          return;
        }
      }

      // Detect via browser locale
      const locale = navigator.language || navigator.userLanguage;
      if (locale) {
        const countryCode = locale.split('-')[1] || locale.split('_')[1];
        if (countryCode) {
          this.userCountry = countryCode.toUpperCase();
          await this.saveUserCountry();
          return;
        }
      }

      // Default to US if detection fails
      this.userCountry = 'US';
      await this.saveUserCountry();
    } catch (error) {
      console.error('Failed to detect user country:', error);
      this.userCountry = 'US';
    }
  }

  /**
   * Save user country
   */
  async saveUserCountry() {
    if (this.chromeApisAvailable) {
      try {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.USER_COUNTRY]: this.userCountry
        });
      } catch (error) {
        console.error('Failed to save user country:', error);
      }
    }
  }

  /**
   * Update available payment providers based on user country
   */
  updateAvailableProviders() {
    this.availableProviders = Object.values(PAYMENT_PROVIDERS).filter(
      provider => {
        if (!provider.enabled) {
          return false;
        }

        // Global providers
        if (provider.supportedCountries.includes('*')) {
          return true;
        }

        // Country-specific providers
        return provider.supportedCountries.includes(this.userCountry);
      }
    );

    console.log(
      `💳 Available payment providers for ${this.userCountry}:`,
      this.availableProviders.map(p => p.name)
    );
  }

  /**
   * Load subscription from storage
   */
  async loadSubscription() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.sync.get([
          this.STORAGE_KEYS.SUBSCRIPTION
        ]);
        if (result[this.STORAGE_KEYS.SUBSCRIPTION]) {
          this.currentSubscription = result[this.STORAGE_KEYS.SUBSCRIPTION];
          return;
        }
      }

      // Use default subscription if none found
      this.currentSubscription = { ...this.DEFAULT_SUBSCRIPTION };
      await this.saveSubscription();
    } catch (error) {
      console.error('Failed to load subscription:', error);
      this.currentSubscription = { ...this.DEFAULT_SUBSCRIPTION };
    }
  }

  /**
   * Save subscription to storage
   */
  async saveSubscription() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.sync.set({
          [this.STORAGE_KEYS.SUBSCRIPTION]: this.currentSubscription
        });

        // Also save to history
        const history = await this.getSubscriptionHistory();
        history.push({
          ...this.currentSubscription,
          timestamp: Date.now(),
          action: 'updated'
        });

        // Keep only last 50 history entries
        const recentHistory = history.slice(-50);
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.SUBSCRIPTION_HISTORY]: recentHistory
        });
      }
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get([
          this.STORAGE_KEYS.SUBSCRIPTION_HISTORY
        ]);
        return result[this.STORAGE_KEYS.SUBSCRIPTION_HISTORY] || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get subscription history:', error);
      return [];
    }
  }

  /**
   * Validate subscription status
   */
  async validateSubscriptionStatus() {
    if (!this.currentSubscription) {
      return;
    }

    const now = Date.now();

    // Check if subscription has expired
    if (
      this.currentSubscription.endDate &&
      now > this.currentSubscription.endDate
    ) {
      console.log('⚠️ Subscription expired, downgrading to free plan');
      await this.downgradeToFree('expired');
      return;
    }

    // Update features based on current plan
    const plan = SUBSCRIPTION_PLANS[this.currentSubscription.plan];
    if (plan) {
      this.currentSubscription.features = { ...plan.features };
      await this.saveSubscription();
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  hasFeature(featureName) {
    if (!this.currentSubscription || !this.currentSubscription.features) {
      return SUBSCRIPTION_PLANS.FREE.features[featureName] || false;
    }

    return this.currentSubscription.features[featureName] || false;
  }

  /**
   * Get feature limit for a specific feature
   */
  getFeatureLimit(featureName) {
    if (!this.currentSubscription || !this.currentSubscription.features) {
      return SUBSCRIPTION_PLANS.FREE.features[featureName] || 0;
    }

    const limit = this.currentSubscription.features[featureName];
    return limit === -1 ? Infinity : limit;
  }

  /**
   * Check if user can perform an action based on limits
   */
  canPerformAction(featureName, currentUsage = 0) {
    const limit = this.getFeatureLimit(featureName);

    if (limit === Infinity || limit === -1) {
      return true;
    }
    if (typeof limit === 'boolean') {
      return limit;
    }
    if (typeof limit === 'number') {
      return currentUsage < limit;
    }

    return false;
  }

  /**
   * Get current subscription info
   */
  getSubscriptionInfo() {
    return {
      ...this.currentSubscription,
      planDetails: SUBSCRIPTION_PLANS[this.currentSubscription.plan],
      availableProviders: this.availableProviders,
      userCountry: this.userCountry
    };
  }

  /**
   * Start free trial (if available)
   */
  async startFreeTrial(planId = 'PREMIUM') {
    try {
      if (this.currentSubscription.trialUsed) {
        throw new Error('Free trial already used');
      }

      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        throw new Error('Invalid plan for trial');
      }

      // 7-day free trial
      const trialDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      this.currentSubscription = {
        ...this.currentSubscription,
        plan: planId,
        status: 'trial',
        startDate: Date.now(),
        endDate: Date.now() + trialDuration,
        trialUsed: true,
        features: { ...plan.features }
      };

      await this.saveSubscription();

      console.log(`✅ Free trial started for ${plan.name}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to start free trial:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(planId, paymentProvider, subscriptionId) {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      const provider = this.availableProviders.find(
        p => p.id === paymentProvider
      );
      if (!provider) {
        throw new Error('Payment provider not available in your country');
      }

      this.currentSubscription = {
        ...this.currentSubscription,
        plan: planId,
        status: 'active',
        startDate: Date.now(),
        endDate: plan.interval ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null, // Monthly billing
        paymentProvider,
        subscriptionId,
        features: { ...plan.features }
      };

      await this.saveSubscription();

      console.log(`✅ Subscription upgraded to ${plan.name}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to upgrade subscription:', error);
      throw error;
    }
  }

  /**
   * Downgrade to free plan
   */
  async downgradeToFree(reason = 'user_request') {
    try {
      this.currentSubscription = {
        ...this.DEFAULT_SUBSCRIPTION,
        trialUsed: this.currentSubscription.trialUsed || false,
        downgradeReason: reason,
        downgradeDate: Date.now()
      };

      await this.saveSubscription();

      console.log('✅ Subscription downgraded to free plan');
      return true;
    } catch (error) {
      console.error('❌ Failed to downgrade subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription() {
    try {
      if (this.currentSubscription.plan === 'FREE') {
        throw new Error('Cannot cancel free plan');
      }

      this.currentSubscription.status = 'cancelled';
      this.currentSubscription.cancelDate = Date.now();

      await this.saveSubscription();

      console.log('✅ Subscription cancelled');
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Get upgrade recommendations
   */
  getUpgradeRecommendations(currentUsage = {}) {
    const currentPlan = SUBSCRIPTION_PLANS[this.currentSubscription.plan];
    const recommendations = [];

    // Check which limits are being hit
    Object.keys(currentUsage).forEach(feature => {
      const usage = currentUsage[feature];
      const limit = this.getFeatureLimit(feature);

      if (limit !== Infinity && usage >= limit * 0.8) {
        // 80% of limit
        const nextPlan = this.getNextPlanWithFeature(feature);
        if (nextPlan) {
          recommendations.push({
            reason: `You're using ${usage}/${limit} ${feature}`,
            suggestedPlan: nextPlan.id,
            benefit: `Upgrade to ${nextPlan.name} for ${nextPlan.features[feature] === -1 ? 'unlimited' : nextPlan.features[feature]} ${feature}`
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Get next plan that supports a feature
   */
  getNextPlanWithFeature(featureName) {
    const planOrder = ['FREE', 'PREMIUM', 'PRO'];
    const currentIndex = planOrder.indexOf(this.currentSubscription.plan);

    for (let i = currentIndex + 1; i < planOrder.length; i++) {
      const plan = SUBSCRIPTION_PLANS[planOrder[i]];
      const currentLimit = this.getFeatureLimit(featureName);
      const planLimit = plan.features[featureName];

      if (planLimit === -1 || planLimit > currentLimit) {
        return plan;
      }
    }

    return null;
  }

  /**
   * Get available plans for upgrade
   */
  getAvailablePlans() {
    return Object.values(SUBSCRIPTION_PLANS).filter(
      plan => plan.id !== this.currentSubscription.plan
    );
  }

  /**
   * Export subscription data
   */
  async exportSubscriptionData() {
    try {
      const history = await this.getSubscriptionHistory();

      const exportData = {
        currentSubscription: this.currentSubscription,
        subscriptionHistory: history,
        userCountry: this.userCountry,
        availableProviders: this.availableProviders.map(p => p.id),
        exportDate: Date.now(),
        version: '1.0.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export subscription data:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const subscriptionManager = new SubscriptionManager();
