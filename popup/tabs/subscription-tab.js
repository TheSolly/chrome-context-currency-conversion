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
   * Load affiliate offers for financial services
   */
  async loadAffiliateOffers() {
    // Dynamically import affiliate links
    const { getAffiliateLinks } = await import('../affiliate-links.js');
    const offers = getAffiliateLinks();
    const container = document.getElementById('affiliateOffers');
    if (!container) return;
    container.innerHTML = '';
    offers.forEach(offer => {
      const offerDiv = document.createElement('div');
      offerDiv.className =
        'flex items-center gap-3 p-2 border rounded-lg mb-2 bg-gray-50 hover:bg-gray-100 transition-colors';
      offerDiv.innerHTML = `
        <img src="${offer.logo}" alt="${offer.name} logo" class="w-8 h-8 rounded"/>
        <div class="flex-1">
          <div class="font-semibold text-sm">${offer.name}</div>
          <div class="text-xs text-gray-500">${offer.description}</div>
        </div>
        <a href="${offer.url}" target="_blank" rel="noopener" class="text-primary-600 font-medium underline text-xs">Learn More</a>
      `;
      container.appendChild(offerDiv);
    });
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

      // Load affiliate offers after DOM is ready
      setTimeout(() => {
        this.loadAffiliateOffers();
      }, 500);

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

      // Get subscription info with real usage stats
      let subscriptionInfo;
      try {
        subscriptionInfo = this.subscriptionManager.getSubscriptionInfo();
        // Get real usage stats instead of cached ones
        const realUsageStats =
          await this.subscriptionManager.getRealUsageStats();
        subscriptionInfo.usageStats = realUsageStats;
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
    // Remove existing listeners to avoid duplicates
    this.removeEventListeners();

    // Plan upgrade buttons
    const premiumBtn = document.getElementById('upgradeToPremium');
    const proBtn = document.getElementById('upgradeToPro');

    if (premiumBtn) {
      premiumBtn.addEventListener('click', () => {
        this.handlePlanUpgrade('PREMIUM');
      });
    }

    if (proBtn) {
      proBtn.addEventListener('click', () => {
        this.handlePlanUpgrade('PRO');
      });
    }

    // General upgrade buttons with data attributes
    document.querySelectorAll('.upgrade-plan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.dataset.plan;
        this.handlePlanUpgrade(planId);
      });
    });

    // Donation buttons
    const donate5Btn = document.getElementById('donate5');
    const donate10Btn = document.getElementById('donate10');
    const donate25Btn = document.getElementById('donate25');

    if (donate5Btn) {
      donate5Btn.addEventListener('click', () => this.handleDonation('5'));
    }
    if (donate10Btn) {
      donate10Btn.addEventListener('click', () => this.handleDonation('10'));
    }
    if (donate25Btn) {
      donate25Btn.addEventListener('click', () => this.handleDonation('25'));
    }

    // Legacy donation buttons with data attributes
    document.querySelectorAll('.donate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = btn.dataset.amount;
        this.handleDonation(amount);
      });
    });

    // Cancel subscription
    const cancelBtn = document.getElementById('cancelSubscription');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.handleCancelSubscription();
      });
    }

    // Manage subscription
    const manageBtn = document.getElementById('manageSubscription');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        this.openSubscriptionManagement();
      });
    }
  }

  /**
   * Remove existing event listeners to prevent duplicates
   */
  removeEventListeners() {
    // Clone elements to remove all event listeners
    const elementsToClone = [
      'upgradeToPremium',
      'upgradeToPro',
      'donate5',
      'donate10',
      'donate25',
      'cancelSubscription',
      'manageSubscription'
    ];

    elementsToClone.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
      }
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
    // Map the actual feature names from subscription plans to display stats
    const conversionsData = usageStats.dailyConversions || {
      current: 0,
      limit: 50
    };
    const currenciesData = usageStats.currencyCount || {
      current: 2,
      limit: 2
    };
    const historyData = usageStats.conversionHistory || {
      current: 0,
      limit: 10
    };

    const stats = {
      conversions: {
        used: conversionsData.current,
        limit: conversionsData.limit
      },
      currencies: {
        used: currenciesData.current,
        limit: currenciesData.limit
      },
      history: {
        used: historyData.current,
        limit: historyData.limit
      }
    };

    // Update conversion usage
    const conversionsUsed = document.getElementById('conversionsUsed');
    const conversionsLimit = document.getElementById('conversionsLimit');
    const conversionsProgress = document.getElementById('conversionsProgress');
    const conversionsUsage = document.getElementById('conversionsUsage');

    if (conversionsUsed) {
      conversionsUsed.textContent = stats.conversions.used;
    }
    if (conversionsLimit) {
      conversionsLimit.textContent = stats.conversions.limit;
    }
    if (conversionsUsage) {
      conversionsUsage.textContent = `${stats.conversions.used} / ${stats.conversions.limit}`;
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
    const currenciesUsage = document.getElementById('currenciesUsage');
    const currenciesProgress = document.getElementById('currenciesProgress');

    if (currenciesUsed) {
      currenciesUsed.textContent = stats.currencies.used;
    }
    if (currenciesLimit) {
      currenciesLimit.textContent = stats.currencies.limit;
    }
    if (currenciesUsage) {
      currenciesUsage.textContent = `${stats.currencies.used} / ${stats.currencies.limit}`;
    }
    if (currenciesProgress) {
      const percentage = (stats.currencies.used / stats.currencies.limit) * 100;
      currenciesProgress.style.width = `${Math.min(percentage, 100)}%`;
    }

    // Update history usage
    const historyUsed = document.getElementById('historyUsed');
    const historyLimit = document.getElementById('historyLimit');
    const historyUsage = document.getElementById('historyUsage');
    const historyProgress = document.getElementById('historyProgress');

    if (historyUsed) {
      historyUsed.textContent = stats.history.used;
    }
    if (historyLimit) {
      historyLimit.textContent = stats.history.limit;
    }
    if (historyUsage) {
      historyUsage.textContent = `${stats.history.used} / ${stats.history.limit}`;
    }
    if (historyProgress) {
      const percentage = (stats.history.used / stats.history.limit) * 100;
      historyProgress.style.width = `${Math.min(percentage, 100)}%`;
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

    // Check conversion usage from the displayed values
    const conversionsUsageText =
      document.getElementById('conversionsUsage')?.textContent || '0 / 50';
    const conversionsMatch = conversionsUsageText.match(/(\d+)\s*\/\s*(\d+)/);

    if (conversionsMatch) {
      const conversionsUsed = parseInt(conversionsMatch[1], 10);
      const conversionsLimit = parseInt(conversionsMatch[2], 10);
      const conversionUsage = conversionsUsed / conversionsLimit;

      if (conversionUsage > 0.9) {
        warnings.push({
          type: 'critical',
          message: `You've used ${Math.round(conversionUsage * 100)}% of your daily conversions (${conversionsUsed}/${conversionsLimit}).`
        });
      } else if (conversionUsage > 0.75) {
        warnings.push({
          type: 'warning',
          message: `You've used ${Math.round(conversionUsage * 100)}% of your daily conversions (${conversionsUsed}/${conversionsLimit}).`
        });
      }
    }

    // Check currency pair usage
    const currenciesUsageText =
      document.getElementById('currenciesUsage')?.textContent || '2 / 2';
    const currenciesMatch = currenciesUsageText.match(/(\d+)\s*\/\s*(\d+)/);

    if (currenciesMatch) {
      const currenciesUsed = parseInt(currenciesMatch[1], 10);
      const currenciesLimit = parseInt(currenciesMatch[2], 10);
      const currencyUsage = currenciesUsed / currenciesLimit;

      if (currencyUsage >= 1.0 && this.userPlan === 'FREE') {
        warnings.push({
          type: 'warning',
          message: `You've reached your currency pair limit (${currenciesUsed}/${currenciesLimit}). Upgrade for more pairs!`
        });
      }
    }

    // Display warnings
    if (warnings.length === 0) {
      warningsContainer.innerHTML = '';
      warningsContainer.classList.add('hidden');
    } else {
      warningsContainer.innerHTML = warnings
        .map(
          warning => `
          <div class="warning ${warning.type === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'} p-3 rounded-lg">
            <p class="text-sm font-medium">${warning.message}</p>
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
      this.showSuccess(`Preparing upgrade to ${planId}...`);

      // For demo purposes, simulate upgrade flow
      // In a real implementation, this would integrate with payment providers
      const planDetails = {
        PREMIUM: { name: 'Premium', price: '$4.99/month' },
        PRO: { name: 'Professional', price: '$14.99/month' }
      };

      const plan = planDetails[planId];
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Show confirmation dialog
      const confirmed = confirm(
        `Upgrade to ${plan.name} plan for ${plan.price}?\n\n` +
          'This is a demo extension. In a real implementation, ' +
          'this would redirect to a secure payment page.'
      );

      if (confirmed) {
        // Simulate successful upgrade for demo
        this.showSuccess(`Demo: Upgraded to ${plan.name} plan! 🎉`);

        // In a real implementation, this would:
        // 1. Redirect to payment provider
        // 2. Process payment
        // 3. Update subscription status
        console.log(`Demo upgrade to ${planId} completed`);
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
      this.showSuccess(`Preparing donation of $${amount}...`);

      // Show confirmation dialog
      const confirmed = confirm(
        `Support development with a $${amount} donation?\n\n` +
          'This is a demo extension. In a real implementation, ' +
          'this would redirect to a secure donation page.'
      );

      if (confirmed) {
        // Simulate successful donation for demo
        this.showSuccess(`Demo: Thank you for your $${amount} donation! ❤️`);

        // In a real implementation, this would:
        // 1. Redirect to payment provider (PayPal, Stripe, etc.)
        // 2. Process payment
        // 3. Send thank you email
        console.log(`Demo donation of $${amount} completed`);
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
