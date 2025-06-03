/**
 * Subscription Tab - Handles subscription and freemium model functionality
 */

export class SubscriptionTab {
  constructor() {
    this.initialized = false;
    this.subscriptionManager = null;
    this.userPlan = 'FREE';
  }

  /**
   * Initialize the subscription tab
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Import subscription manager
      const { getSubscriptionManager } = await import(
        '/utils/subscription-manager-v2.js'
      );
      this.subscriptionManager = await getSubscriptionManager();

      // Setup event listeners
      this.setupEventListeners();

      this.initialized = true;
      console.log('✅ Subscription tab initialized');
    } catch (error) {
      console.error('❌ Failed to initialize subscription tab:', error);
      throw error;
    }
  }

  /**
   * Load content for the subscription tab
   */
  async loadContent() {
    try {
      console.log('📋 Loading subscription content...');

      // Initialize subscription manager if needed
      if (!this.subscriptionManager) {
        const { getSubscriptionManager } = await import(
          '/utils/subscription-manager-v2.js'
        );
        this.subscriptionManager = await getSubscriptionManager();
      }

      // Get subscription info with fallback
      let subscriptionInfo;
      try {
        subscriptionInfo = this.subscriptionManager.getSubscriptionInfo();
      } catch (error) {
        console.warn(
          '⚠️ Could not get subscription info, using defaults:',
          error
        );
        subscriptionInfo = {
          plan: 'FREE',
          planDetails: {
            name: 'Free Plan',
            price: 0,
            features: ['Basic currency conversion']
          },
          usageStats: {}
        };
      }

      // Set user plan with fallback
      this.userPlan = subscriptionInfo.plan || 'FREE';

      // Update UI components with defensive programming
      this.updateCurrentPlanDisplay(subscriptionInfo.planDetails);
      this.updateUsageDisplay(subscriptionInfo.usageStats);
      this.updateFeatureComparison(subscriptionInfo.planDetails);
      this.updateSubscriptionManagement(subscriptionInfo);
      this.updatePaymentProviders();
      this.checkAndDisplayUsageWarnings();

      console.log('📋 Subscription content loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load subscription content:', error);
      this.showError('Failed to load subscription information');
    }
  }

  /**
   * Setup event listeners for subscription functionality
   */
  setupEventListeners() {
    // Plan upgrade buttons
    document.querySelectorAll('.upgrade-plan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.dataset.plan;
        this.handlePlanUpgrade(planId);
      });
    });

    // Donation buttons
    document.querySelectorAll('.donate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = btn.dataset.amount;
        this.handleDonation(amount);
      });
    });

    // Cancel subscription
    const cancelBtn = document.getElementById('cancelSubscription');
    cancelBtn?.addEventListener('click', () => {
      this.handleCancelSubscription();
    });

    // Manage subscription
    const manageBtn = document.getElementById('manageSubscription');
    manageBtn?.addEventListener('click', () => {
      this.openSubscriptionManagement();
    });
  }

  /**
   * Update current plan display
   */
  updateCurrentPlanDisplay(planDetails = {}) {
    // Default values
    const defaultPlan = {
      name: 'Free Plan',
      price: 0,
      features: ['Basic currency conversion']
    };

    // Merge with defaults
    const plan = { ...defaultPlan, ...planDetails };

    const planNameElement = document.getElementById('currentPlanName');
    const planPriceElement = document.getElementById('currentPlanPrice');
    const planFeaturesElement = document.getElementById('currentPlanFeatures');

    if (planNameElement) {
      planNameElement.textContent = plan.name;
    }

    if (planPriceElement) {
      planPriceElement.textContent =
        plan.price === 0 ? 'Free' : `$${plan.price}/month`;
    }

    if (planFeaturesElement) {
      planFeaturesElement.innerHTML = plan.features
        .map(feature => `<li class="text-sm text-gray-600">✓ ${feature}</li>`)
        .join('');
    }
  }

  /**
   * Update usage statistics display
   */
  updateUsageDisplay(usageStats = {}) {
    // Ensure we have default values if usageStats is undefined or incomplete
    const defaultStats = {
      conversions: { used: 0, limit: 100 },
      currencies: { used: 0, limit: 10 },
      alerts: { used: 0, limit: 5 }
    };

    // Merge with defaults to handle missing properties
    const stats = {
      conversions: {
        ...defaultStats.conversions,
        ...(usageStats.conversions || {})
      },
      currencies: {
        ...defaultStats.currencies,
        ...(usageStats.currencies || {})
      },
      alerts: {
        ...defaultStats.alerts,
        ...(usageStats.alerts || {})
      }
    };

    // Update conversion usage
    const conversionsUsed = document.getElementById('conversionsUsed');
    const conversionsLimit = document.getElementById('conversionsLimit');
    const conversionsProgress = document.getElementById('conversionsProgress');

    if (conversionsUsed) {
      conversionsUsed.textContent = stats.conversions.used;
    }
    if (conversionsLimit) {
      conversionsLimit.textContent = stats.conversions.limit;
    }
    if (conversionsProgress) {
      const percentage =
        (stats.conversions.used / stats.conversions.limit) * 100;
      conversionsProgress.style.width = `${Math.min(percentage, 100)}%`;

      // Change color based on usage
      if (percentage > 90) {
        conversionsProgress.className = 'h-2 bg-red-500 rounded transition-all';
      } else if (percentage > 75) {
        conversionsProgress.className =
          'h-2 bg-yellow-500 rounded transition-all';
      } else {
        conversionsProgress.className =
          'h-2 bg-green-500 rounded transition-all';
      }
    }

    // Update currencies usage
    const currenciesUsed = document.getElementById('currenciesUsed');
    const currenciesLimit = document.getElementById('currenciesLimit');

    if (currenciesUsed) {
      currenciesUsed.textContent = stats.currencies.used;
    }
    if (currenciesLimit) {
      currenciesLimit.textContent = stats.currencies.limit;
    }

    // Update alerts usage
    const alertsUsed = document.getElementById('alertsUsed');
    const alertsLimit = document.getElementById('alertsLimit');

    if (alertsUsed) {
      alertsUsed.textContent = stats.alerts.used;
    }
    if (alertsLimit) {
      alertsLimit.textContent = stats.alerts.limit;
    }
  }

  /**
   * Update feature comparison based on current plan
   */
  updateFeatureComparison(planDetails = {}) {
    // Default features if none provided
    const features = planDetails.features || [];

    const featureRows = document.querySelectorAll('.feature-row');

    featureRows.forEach(row => {
      const feature = row.dataset.feature;
      const currentPlanCell = row.querySelector('.current-plan-feature');

      if (currentPlanCell && features.includes(feature)) {
        currentPlanCell.innerHTML = '<span class="text-green-600">✓</span>';
      } else if (currentPlanCell) {
        currentPlanCell.innerHTML = '<span class="text-gray-400">✗</span>';
      }
    });
  }

  /**
   * Update payment providers list
   */
  async updatePaymentProviders() {
    try {
      const { getPaymentProviders } = await import(
        '/utils/payment-providers-v2.js'
      );
      const providers = await getPaymentProviders();

      const providersList = document.getElementById('paymentProviders');
      if (!providersList) {
        return;
      }

      providersList.innerHTML = providers
        .map(
          provider => `
          <div class="payment-provider flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
            <img src="${provider.icon}" alt="${provider.name}" class="w-6 h-6">
            <span class="text-sm">${provider.name}</span>
            ${provider.recommended ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Recommended</span>' : ''}
          </div>
        `
        )
        .join('');
    } catch (error) {
      console.error('❌ Failed to load payment providers:', error);
    }
  }

  /**
   * Update subscription management section
   */
  updateSubscriptionManagement(subscriptionInfo) {
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    const nextBillingDate = document.getElementById('nextBillingDate');
    const subscriptionActions = document.getElementById('subscriptionActions');

    if (subscriptionStatus) {
      subscriptionStatus.textContent = subscriptionInfo.status || 'Free Plan';
    }

    if (nextBillingDate && subscriptionInfo.nextBillingDate) {
      nextBillingDate.textContent = new Date(
        subscriptionInfo.nextBillingDate
      ).toLocaleDateString();
    }

    if (subscriptionActions) {
      if (this.userPlan === 'FREE') {
        subscriptionActions.innerHTML = `
          <button class="upgrade-plan-btn bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700" data-plan="PREMIUM">
            Upgrade to Premium
          </button>
        `;
      } else {
        subscriptionActions.innerHTML = `
          <button id="manageSubscription" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            Manage Subscription
          </button>
          <button id="cancelSubscription" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Cancel Subscription
          </button>
        `;
      }

      // Re-setup event listeners for new buttons
      this.setupEventListeners();
    }
  }

  /**
   * Check and display usage warnings
   */
  checkAndDisplayUsageWarnings() {
    const warningsContainer = document.getElementById('usageWarnings');
    if (!warningsContainer) {
      return;
    }

    const warnings = [];

    // Check conversion usage
    const conversionsUsed = parseInt(
      document.getElementById('conversionsUsed')?.textContent || '0',
      10
    );
    const conversionsLimit = parseInt(
      document.getElementById('conversionsLimit')?.textContent || '0',
      10
    );
    const conversionUsage = conversionsUsed / conversionsLimit;

    if (conversionUsage > 0.9) {
      warnings.push({
        type: 'critical',
        message: `You've used ${Math.round(conversionUsage * 100)}% of your monthly conversions.`
      });
    } else if (conversionUsage > 0.75) {
      warnings.push({
        type: 'warning',
        message: `You've used ${Math.round(conversionUsage * 100)}% of your monthly conversions.`
      });
    }

    // Display warnings
    if (warnings.length === 0) {
      warningsContainer.innerHTML = '';
      warningsContainer.classList.add('hidden');
    } else {
      warningsContainer.innerHTML = warnings
        .map(
          warning => `
          <div class="warning ${warning.type === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'} p-3 rounded-lg">
            <p class="text-sm">${warning.message}</p>
            ${warning.type === 'critical' ? '<p class="text-xs mt-1">Consider upgrading to continue using the service.</p>' : ''}
          </div>
        `
        )
        .join('');
      warningsContainer.classList.remove('hidden');
    }
  }

  /**
   * Handle plan upgrade
   */
  async handlePlanUpgrade(planId) {
    try {
      this.showSuccess('Redirecting to upgrade page...');

      // Open upgrade page
      const upgradeUrl = `https://example.com/upgrade?plan=${planId}`;
      if (chrome && chrome.tabs) {
        chrome.tabs.create({ url: upgradeUrl });
      } else {
        window.open(upgradeUrl, '_blank');
      }
    } catch (error) {
      console.error('❌ Failed to handle plan upgrade:', error);
      this.showError('Failed to initiate upgrade process');
    }
  }

  /**
   * Handle donation
   */
  async handleDonation(amount) {
    try {
      this.showSuccess(`Redirecting to donation page ($${amount})...`);

      // Open donation page
      const donationUrl = `https://example.com/donate?amount=${amount}`;
      if (chrome && chrome.tabs) {
        chrome.tabs.create({ url: donationUrl });
      } else {
        window.open(donationUrl, '_blank');
      }
    } catch (error) {
      console.error('❌ Failed to handle donation:', error);
      this.showError('Failed to initiate donation process');
    }
  }

  /**
   * Handle subscription cancellation
   */
  async handleCancelSubscription() {
    const confirmed = confirm(
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.'
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.subscriptionManager.cancelSubscription();
      await this.loadContent();
      this.showSuccess('Subscription cancelled successfully');
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      this.showError('Failed to cancel subscription');
    }
  }

  /**
   * Open subscription management portal
   */
  openSubscriptionManagement() {
    const managementUrl = 'https://example.com/manage-subscription';
    if (chrome && chrome.tabs) {
      chrome.tabs.create({ url: managementUrl });
    } else {
      window.open(managementUrl, '_blank');
    }
  }

  /**
   * Check feature access before performing actions
   */
  checkFeatureAccess(featureName, amount = 1) {
    if (!this.subscriptionManager) {
      return false;
    }
    return this.subscriptionManager.checkFeatureAccess(featureName, amount);
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(featureName, amount = 1) {
    try {
      if (this.subscriptionManager) {
        await this.subscriptionManager.trackUsage(featureName, amount);
      }
    } catch (error) {
      console.error('❌ Failed to track feature usage:', error);
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showStatusMessage(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showStatusMessage(message, 'error');
  }

  /**
   * Show status message
   */
  showStatusMessage(message, type = 'success', duration = 3000) {
    const statusDiv = document.getElementById('statusMessage');
    if (!statusDiv) {
      return;
    }

    statusDiv.textContent = message;
    statusDiv.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
    }`;

    statusDiv.classList.remove('hidden');

    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, duration);
  }

  /**
   * Handle global events from other tabs
   */
  handleGlobalEvent(eventType, data) {
    switch (eventType) {
      case 'featureUsed':
        // Update usage display when features are used
        this.loadContent();
        break;
      case 'planChanged':
        // Refresh when plan changes
        this.loadContent();
        break;
      case 'usageLimitReached':
        // Show upgrade prompt when limits are reached
        this.showUpgradePrompt(data);
        break;
    }
  }

  /**
   * Show upgrade prompt when limits are reached
   */
  showUpgradePrompt(data) {
    const message = `You've reached your ${data.feature} limit. Upgrade to continue using this feature.`;
    this.showError(message);

    // Optionally highlight upgrade button
    const upgradeBtn = document.querySelector('.upgrade-plan-btn');
    if (upgradeBtn) {
      upgradeBtn.classList.add('animate-pulse');
      setTimeout(() => {
        upgradeBtn.classList.remove('animate-pulse');
      }, 3000);
    }
  }

  /**
   * Refresh the tab content
   */
  async refresh() {
    await this.loadContent();
  }
}
