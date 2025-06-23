/**
 * Alerts Tab - Handles rate alerts and notifications functionality
 */

export class AlertsTab {
  constructor() {
    this.initialized = false;
    this.alertsManager = null;
    this.subscriptionManager = null;
  }

  /**
   * Initialize the alerts tab
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Import alerts manager
      const { RateAlertsManager } = await import(
        '/utils/rate-alerts-manager.js'
      );
      this.alertsManager = new RateAlertsManager();

      // Import subscription manager
      const { getSubscriptionManager } = await import(
        '/utils/subscription-manager-v2.js'
      );
      this.subscriptionManager = await getSubscriptionManager();

      // Setup event listeners
      this.setupEventListeners();

      this.initialized = true;
      console.log('✅ Alerts tab initialized');
    } catch (error) {
      console.error('❌ Failed to initialize alerts tab:', error);
      throw error;
    }
  }

  /**
   * Load content for the alerts tab
   */
  async loadContent() {
    try {
      console.log('📋 Loading alerts content...');

      // Ensure managers are initialized
      if (!this.alertsManager) {
        const { RateAlertsManager } = await import(
          '/utils/rate-alerts-manager.js'
        );
        this.alertsManager = new RateAlertsManager();
      }

      if (!this.subscriptionManager) {
        const { getSubscriptionManager } = await import(
          '/utils/subscription-manager-v2.js'
        );
        this.subscriptionManager = await getSubscriptionManager();
      }

      // Initialize alerts manager
      await this.alertsManager.initialize();

      // Check subscription and feature access
      const hasAlertsFeature = this.checkAlertsFeatureAccess();
      const subscription = this.subscriptionManager.getSubscriptionInfo();

      if (!hasAlertsFeature) {
        // Show upgrade prompt but keep the tab accessible
        this.showUpgradePrompt(subscription);
        return;
      }

      // Load alerts data for premium users
      const alerts = this.alertsManager.alerts || [];
      const alertSettings = this.alertsManager.alertSettings;
      const alertHistory = this.alertsManager.alertHistory || [];

      // Display content
      this.displayAlerts(alerts);
      this.loadAlertSettings(alertSettings);
      this.displayAlertHistory(alertHistory);

      // Update UI based on subscription
      this.updateUIForSubscription(subscription);

      console.log('📋 Alerts content loaded');
    } catch (error) {
      console.error('❌ Failed to load alerts content:', error);
      this.showError('Failed to load alerts');
    }
  }

  /**
   * Setup event listeners for alerts functionality
   */
  setupEventListeners() {
    // Main alert buttons
    this.setupMainAlertButtons();

    // New alert form
    this.setupNewAlertForm();

    // Alert settings
    this.setupAlertSettings();

    // Alert action listeners (will be set up when alerts are displayed)
  }

  /**
   * Setup main alert buttons (Check Now, Add Alert)
   */
  setupMainAlertButtons() {
    // Remove existing listeners to prevent duplicates
    const triggerRateCheckBtn = document.getElementById('triggerRateCheck');
    const addAlertBtn = document.getElementById('addAlert');

    if (triggerRateCheckBtn) {
      // Clone to remove existing listeners
      const newTriggerBtn = triggerRateCheckBtn.cloneNode(true);
      triggerRateCheckBtn.parentNode.replaceChild(
        newTriggerBtn,
        triggerRateCheckBtn
      );

      newTriggerBtn.addEventListener('click', async e => {
        e.preventDefault();
        console.log('🔄 Check Now button clicked');
        await this.handleCheckNow();
      });
    }

    if (addAlertBtn) {
      // Clone to remove existing listeners
      const newAddBtn = addAlertBtn.cloneNode(true);
      addAlertBtn.parentNode.replaceChild(newAddBtn, addAlertBtn);

      newAddBtn.addEventListener('click', async e => {
        e.preventDefault();
        console.log('➕ Add Alert button clicked');
        await this.handleAddAlert();
      });
    }

    console.log('✅ Alert buttons setup completed');
  }

  /**
   * Check if user has access to alerts feature
   */
  checkAlertsFeatureAccess() {
    if (!this.subscriptionManager) {
      return false;
    }
    return this.subscriptionManager.hasFeature('rateAlerts');
  }

  /**
   * Handle Check Now button click
   */
  async handleCheckNow() {
    try {
      console.log('🔄 Handling Check Now click...');

      if (!this.checkAlertsFeatureAccess()) {
        console.log('❌ No alerts feature access - showing upgrade prompt');
        this.showUpgradePrompt();
        return;
      }

      // Show loading state
      const btn = document.getElementById('triggerRateCheck');
      if (btn) {
        btn.textContent = '⏳ Checking...';
        btn.disabled = true;
      }

      // Check rates for all alerts
      await this.alertsManager.checkRates();

      // Reload content to show updated data
      await this.loadContent();

      this.showSuccess('Rate check completed! 📊');
    } catch (error) {
      console.error('❌ Failed to check rates:', error);
      this.showError('Failed to check rates. Please try again.');
    } finally {
      // Restore button state
      const btn = document.getElementById('triggerRateCheck');
      if (btn) {
        btn.textContent = '📊 Check Now';
        btn.disabled = false;
      }
    }
  }

  /**
   * Handle Add Alert button click
   */
  async handleAddAlert() {
    try {
      console.log('➕ Handling Add Alert click...');

      if (!this.checkAlertsFeatureAccess()) {
        console.log('❌ No alerts feature access - showing upgrade prompt');
        this.showUpgradePrompt();
        return;
      }

      // Check if user has reached alert limit
      const currentAlerts = this.alertsManager.alerts.length;
      const alertLimit = this.subscriptionManager.getFeatureLimit('rateAlerts');

      if (currentAlerts >= alertLimit) {
        this.showAlertLimitReached(currentAlerts, alertLimit);
        return;
      }

      // Show the new alert form
      const newAlertForm = document.getElementById('addAlertForm');
      if (newAlertForm) {
        newAlertForm.classList.remove('hidden');
        this.showSuccess('Alert form opened! Configure your rate alert below.');
      } else {
        console.warn('⚠️ Alert form not found in DOM');
        this.showError('Alert form not available');
      }
    } catch (error) {
      console.error('❌ Failed to handle add alert:', error);
      this.showError('Failed to open alert form. Please try again.');
    }
  }

  /**
   * Show upgrade prompt for free users
   */
  showUpgradePrompt(subscription = null) {
    const alertsPanel = document.getElementById('alertsPanel');
    if (!alertsPanel) return;

    const currentPlan = subscription?.plan || 'FREE';

    alertsPanel.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-lg" aria-hidden="true">🔔</span>
          <h2 class="text-base font-semibold text-gray-900">Rate Alerts</h2>
        </div>
        <div class="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">Premium Feature</div>
      </div>

      <div class="text-center py-8 px-4">
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-4">
          <div class="text-4xl mb-3">🚀</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Upgrade to Premium</h3>
          <p class="text-gray-600 text-sm mb-4">
            Get notified when exchange rates hit your target levels with real-time rate alerts.
          </p>
          
          <div class="bg-white rounded-lg p-4 mb-4 text-left">
            <h4 class="font-semibold text-gray-900 mb-2">Premium Features:</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• <strong>5 Rate Alerts</strong> - Set up to 5 custom rate alerts</li>
              <li>• <strong>Real-time Notifications</strong> - Get instant notifications</li>
              <li>• <strong>Advanced Conditions</strong> - Above, below, or percentage change alerts</li>
              <li>• <strong>Alert History</strong> - Track all triggered alerts</li>
              <li>• <strong>Daily/Weekly Summaries</strong> - Get rate summary reports</li>
            </ul>
          </div>

          <button 
            id="upgradeFromAlertsBtn"
            class="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 mb-3"
          >
            Upgrade to Premium - $4.99/month
          </button>
          
          <button 
            id="upgradeToProFromAlertsBtn"
            class="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 text-sm"
          >
            Upgrade to Pro - $14.99/month (50 Alerts)
          </button>
          
          <p class="text-xs text-gray-500 mt-3">
            Current plan: <strong>${currentPlan}</strong> (0 alerts included)
          </p>
        </div>
      </div>
    `;

    // Add click handlers for upgrade buttons
    const premiumBtn = document.getElementById('upgradeFromAlertsBtn');
    const proBtn = document.getElementById('upgradeToProFromAlertsBtn');

    if (premiumBtn) {
      premiumBtn.addEventListener('click', () => {
        console.log('🚀 Navigating to Premium upgrade from Alerts tab');
        // Switch to subscription tab
        const subscriptionTabBtn = document.getElementById('subscriptionTab');
        if (subscriptionTabBtn) {
          subscriptionTabBtn.click();
        }
      });
    }

    if (proBtn) {
      proBtn.addEventListener('click', () => {
        console.log('🚀 Navigating to Pro upgrade from Alerts tab');
        // Switch to subscription tab
        const subscriptionTabBtn = document.getElementById('subscriptionTab');
        if (subscriptionTabBtn) {
          subscriptionTabBtn.click();
        }
      });
    }
  }

  /**
   * Show alert limit reached message
   */
  showAlertLimitReached(current, limit) {
    const subscription = this.subscriptionManager.getSubscriptionInfo();
    const currentPlan = subscription.plan;
    const nextPlan = currentPlan === 'PREMIUM' ? 'PRO' : 'PREMIUM';
    const nextPlanLimit = nextPlan === 'PRO' ? 50 : 5;

    const upgradeBtn = document.createElement('button');
    upgradeBtn.className =
      'mt-2 bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700';
    upgradeBtn.textContent = 'Upgrade Now';
    upgradeBtn.addEventListener('click', () => {
      document.querySelector('[data-tab="subscription"]')?.click();
    });

    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      Alert limit reached! You have ${current}/${limit} alerts.
      <br><br>
      <strong>Upgrade to ${nextPlan}</strong> for ${nextPlanLimit} alerts.
    `;
    errorDiv.appendChild(upgradeBtn);

    this.showError(errorDiv.outerHTML);
  }

  /**
   * Update UI based on subscription plan
   */
  updateUIForSubscription(subscription) {
    const alertLimit = this.subscriptionManager.getFeatureLimit('rateAlerts');
    const currentAlerts = this.alertsManager.alerts.length;

    // Update active alerts count
    const activeAlertsCount = document.getElementById('activeAlertsCount');
    if (activeAlertsCount) {
      activeAlertsCount.textContent = `${currentAlerts}/${alertLimit}`;
    }

    // Show usage info
    const alertsPanel = document.querySelector('#alertsPanel');
    if (alertsPanel && alertLimit > 0) {
      // Add usage info after header
      const header = alertsPanel.querySelector(
        '.flex.items-center.justify-between'
      );
      if (
        header &&
        !header.nextElementSibling?.classList.contains('usage-info')
      ) {
        const usageInfo = document.createElement('div');
        usageInfo.className =
          'usage-info bg-blue-50 rounded-lg p-3 mb-4 text-sm';

        const limitWarning =
          currentAlerts >= alertLimit
            ? '<div class="text-orange-600 mt-1">⚠️ Alert limit reached. Upgrade for more alerts.</div>'
            : '';

        usageInfo.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="text-gray-600">Alerts Used: <strong>${currentAlerts}/${alertLimit}</strong></span>
            <span class="text-blue-600">${subscription.plan} Plan</span>
          </div>
          ${limitWarning}
        `;
        header.insertAdjacentElement('afterend', usageInfo);
      }
    }
  }

  /**
   * Setup new alert form
   */
  setupNewAlertForm() {
    const newAlertForm = document.getElementById('newAlertForm');
    const cancelAlertBtn = document.getElementById('cancelAlert');

    // Populate currency selectors
    this.populateAlertCurrencySelectors();

    // Handle form submission
    newAlertForm?.addEventListener('submit', async e => {
      e.preventDefault();
      await this.createNewAlert();
    });

    cancelAlertBtn?.addEventListener('click', () => {
      if (newAlertForm) {
        newAlertForm.classList.add('hidden');
      }
      this.clearNewAlertForm();
    });

    // Update target input based on alert type
    const alertTypeSelect = document.getElementById('alertType');
    alertTypeSelect?.addEventListener('change', () => {
      this.updateAlertTargetInput();
    });
  }

  /**
   * Populate currency selectors for alerts
   */
  async populateAlertCurrencySelectors() {
    try {
      const { getPopularCurrencies, getAllCurrencies } = await import(
        '/utils/currency-data.js'
      );

      const popularCurrencies = getPopularCurrencies();
      const allCurrencies = getAllCurrencies();

      const fromSelect = document.getElementById('alertFromCurrency');
      const toSelect = document.getElementById('alertToCurrency');

      [fromSelect, toSelect].forEach(select => {
        if (!select) {
          return;
        }

        select.innerHTML = '<option value="">Select currency...</option>';

        // Add popular currencies first
        const popularGroup = document.createElement('optgroup');
        popularGroup.label = 'Popular Currencies';
        popularCurrencies.forEach(currency => {
          const option = document.createElement('option');
          option.value = currency.code;
          option.textContent = `${currency.flag} ${currency.code} - ${currency.name}`;
          popularGroup.appendChild(option);
        });
        select.appendChild(popularGroup);

        // Add all other currencies
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = 'All Currencies';
        allCurrencies
          .filter(c => !c.popular)
          .forEach(currency => {
            const option = document.createElement('option');
            option.value = currency.code;
            option.textContent = `${currency.flag} ${currency.code} - ${currency.name}`;
            otherGroup.appendChild(option);
          });
        select.appendChild(otherGroup);
      });
    } catch (error) {
      console.error('❌ Failed to populate alert currency selectors:', error);
    }
  }

  /**
   * Update alert target input based on alert type
   */
  updateAlertTargetInput() {
    const alertType = document.getElementById('alertType')?.value;
    const targetRateInput = document.getElementById('alertTargetRate');
    const targetLabel = document.getElementById('alertTargetLabel');

    if (!targetRateInput || !targetLabel) {
      return;
    }

    switch (alertType) {
      case 'above':
        targetLabel.textContent = 'Alert when rate goes above:';
        targetRateInput.placeholder = 'e.g., 1.25';
        break;
      case 'below':
        targetLabel.textContent = 'Alert when rate goes below:';
        targetRateInput.placeholder = 'e.g., 1.15';
        break;
      case 'change':
        targetLabel.textContent = 'Alert when rate changes by (%):';
        targetRateInput.placeholder = 'e.g., 5';
        break;
      default:
        targetLabel.textContent = 'Target rate:';
        targetRateInput.placeholder = 'Enter target rate';
    }
  }

  /**
   * Create a new alert
   */
  async createNewAlert() {
    // Check feature access first
    if (!this.checkAlertsFeatureAccess()) {
      this.showUpgradePrompt();
      return;
    }

    // Check alert limit
    const currentAlerts = this.alertsManager.alerts.length;
    const alertLimit = this.subscriptionManager.getFeatureLimit('rateAlerts');

    if (currentAlerts >= alertLimit) {
      this.showAlertLimitReached(currentAlerts, alertLimit);
      return;
    }

    const fromCurrency = document.getElementById('alertFromCurrency')?.value;
    const toCurrency = document.getElementById('alertToCurrency')?.value;
    const alertType = document.getElementById('alertType')?.value;
    const targetRate = document.getElementById('alertTargetRate')?.value;
    const alertLabel = document.getElementById('alertLabel')?.value;

    if (!fromCurrency || !toCurrency || !alertType || !targetRate) {
      this.showError('Please fill in all required fields');
      return;
    }

    if (fromCurrency === toCurrency) {
      this.showError('Source and target currencies cannot be the same');
      return;
    }

    try {
      // Create alert using the correct parameters for RateAlertsManager
      const alertParams = {
        fromCurrency,
        toCurrency,
        targetRate: parseFloat(targetRate),
        condition: alertType, // 'above', 'below', 'change'
        threshold: alertType === 'change' ? parseFloat(targetRate) : null,
        enabled: true,
        name: alertLabel || `${fromCurrency}/${toCurrency} Alert`,
        description: null
      };

      await this.alertsManager.createAlert(alertParams);

      // Track usage
      await this.subscriptionManager.trackUsage('rateAlerts', 1);

      // Hide form and clear
      const form = document.getElementById('newAlertForm');
      if (form) {
        form.classList.add('hidden');
      }
      this.clearNewAlertForm();

      // Reload content
      await this.loadContent();

      this.showSuccess('Alert created successfully! 🔔');
    } catch (error) {
      console.error('❌ Failed to create alert:', error);
      this.showError('Failed to create alert. Please try again.');
    }
  }

  /**
   * Clear the new alert form
   */
  clearNewAlertForm() {
    const fields = [
      'alertFromCurrency',
      'alertToCurrency',
      'alertType',
      'targetRate',
      'alertLabel'
    ];

    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.value = '';
      }
    });
  }

  /**
   * Display alerts in the UI
   */
  displayAlerts(alerts) {
    const alertsList = document.getElementById('alertsList');
    const alertsEmpty = document.getElementById('noAlertsMessage');

    if (!alertsList) {
      return;
    }

    if (!alerts || alerts.length === 0) {
      alertsList.innerHTML = '';
      if (alertsEmpty) {
        alertsEmpty.classList.remove('hidden');
      }
      return;
    }

    if (alertsEmpty) {
      alertsEmpty.classList.add('hidden');
    }

    alertsList.innerHTML = alerts
      .map(alert => this.createAlertItemHTML(alert))
      .join('');

    // Setup event listeners for alert actions
    this.setupAlertActionListeners();
  }

  /**
   * Create HTML for an alert item
   */
  createAlertItemHTML(alert) {
    const statusClass = alert.active ? 'text-green-600' : 'text-gray-400';
    const statusText = alert.active ? 'Active' : 'Inactive';

    return `
      <div class="alert-item border rounded-lg p-4" data-id="${alert.id}">
        <div class="flex items-center justify-between mb-2">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">
              ${alert.fromCurrency} → ${alert.toCurrency}
            </div>
            <div class="text-xs text-gray-500">
              ${this.formatTargetRate(alert)}
            </div>
            ${alert.label ? `<div class="text-xs text-gray-600 mt-1">${alert.label}</div>` : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs ${statusClass} font-medium">${statusText}</span>
            <button 
              class="toggle-alert-btn p-1 hover:bg-gray-100 rounded"
              data-id="${alert.id}"
              title="${alert.active ? 'Disable' : 'Enable'} alert"
            >
              ${alert.active ? '⏸️' : '▶️'}
            </button>
            <button 
              class="edit-alert-btn p-1 hover:bg-gray-100 rounded"
              data-id="${alert.id}"
              title="Edit alert"
            >
              ✏️
            </button>
            <button 
              class="delete-alert-btn p-1 hover:bg-gray-100 rounded text-red-500"
              data-id="${alert.id}"
              title="Delete alert"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format target rate display
   */
  formatTargetRate(alert) {
    switch (alert.type) {
      case 'above':
        return `Alert when rate goes above ${alert.targetRate}`;
      case 'below':
        return `Alert when rate goes below ${alert.targetRate}`;
      case 'change':
        return `Alert when rate changes by ${alert.targetRate}%`;
      default:
        return `Target rate: ${alert.targetRate}`;
    }
  }

  /**
   * Setup event listeners for alert actions
   */
  setupAlertActionListeners() {
    // Toggle alert
    document.querySelectorAll('.toggle-alert-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const alertId = btn.dataset.id;
        this.toggleAlert(alertId);
      });
    });

    // Edit alert
    document.querySelectorAll('.edit-alert-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const alertId = btn.dataset.id;
        this.editAlert(alertId);
      });
    });

    // Delete alert
    document.querySelectorAll('.delete-alert-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const alertId = btn.dataset.id;
        this.deleteAlert(alertId);
      });
    });
  }

  /**
   * Toggle alert active state
   */
  async toggleAlert(alertId) {
    try {
      await this.alertsManager.toggleAlert(alertId);
      await this.loadContent();
      this.showSuccess('Alert status updated');
    } catch (error) {
      console.error('❌ Failed to toggle alert:', error);
      this.showError('Failed to update alert');
    }
  }

  /**
   * Edit an existing alert
   */
  async editAlert(_alertId) {
    try {
      // This would open an edit form with the alert data
      // For now, just show a message
      this.showSuccess('Edit functionality coming soon');
    } catch (error) {
      console.error('❌ Failed to edit alert:', error);
      this.showError('Failed to edit alert');
    }
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId) {
    const confirmed = confirm('Are you sure you want to delete this alert?');
    if (!confirmed) {
      return;
    }

    try {
      await this.alertsManager.deleteAlert(alertId);
      await this.loadContent();
      this.showSuccess('Alert deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete alert:', error);
      this.showError('Failed to delete alert');
    }
  }

  /**
   * Load and display alert settings
   */
  async loadAlertSettings(settings) {
    // Update alert settings UI
    const notificationsEnabled = document.getElementById('alertNotifications');
    const emailEnabled = document.getElementById('alertEmail');
    const soundEnabled = document.getElementById('alertSound');

    if (notificationsEnabled && settings) {
      notificationsEnabled.checked = settings.notificationsEnabled || false;
    }
    if (emailEnabled && settings) {
      emailEnabled.checked = settings.emailEnabled || false;
    }
    if (soundEnabled && settings) {
      soundEnabled.checked = settings.soundEnabled || false;
    }
  }

  /**
   * Setup alert settings event listeners
   */
  setupAlertSettings() {
    const saveSettingsBtn = document.getElementById('saveAlertSettings');

    saveSettingsBtn?.addEventListener('click', async () => {
      await this.saveAlertSettings();
    });
  }

  /**
   * Save alert settings
   */
  async saveAlertSettings() {
    try {
      const settings = {
        notificationsEnabled:
          document.getElementById('alertNotifications')?.checked || false,
        emailEnabled: document.getElementById('alertEmail')?.checked || false,
        soundEnabled: document.getElementById('alertSound')?.checked || false
      };

      await this.alertsManager.updateSettings(settings);
      this.showSuccess('Alert settings saved successfully');
    } catch (error) {
      console.error('❌ Failed to save alert settings:', error);
      this.showError('Failed to save alert settings');
    }
  }

  /**
   * Display alert history
   */
  displayAlertHistory(history) {
    const historyContainer = document.getElementById('alertHistory');
    if (!historyContainer) {
      return;
    }

    if (!history || history.length === 0) {
      historyContainer.innerHTML =
        '<p class="text-xs text-gray-500">No alert history</p>';
      return;
    }

    historyContainer.innerHTML = history
      .slice(0, 10) // Show last 10 alerts
      .map(
        item => `
        <div class="text-xs p-2 bg-gray-50 rounded mb-1">
          <div class="font-medium">${item.fromCurrency} → ${item.toCurrency}</div>
          <div class="text-gray-500">${item.message}</div>
          <div class="text-gray-400">${this.formatTimestamp(item.timestamp)}</div>
        </div>
      `
      )
      .join('');
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
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
      // Create status message if it doesn't exist
      const newStatusDiv = document.createElement('div');
      newStatusDiv.id = 'statusMessage';
      newStatusDiv.className = 'hidden';
      document.body.appendChild(newStatusDiv);
    }

    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
    }`;

    statusElement.classList.remove('hidden');

    setTimeout(() => {
      statusElement.classList.add('hidden');
    }, duration);
  }

  /**
   * Handle global events from other tabs
   */
  handleGlobalEvent(eventType, data) {
    switch (eventType) {
      case 'rateUpdate':
        // Check alerts when rates are updated
        this.checkAlerts(data);
        break;
      case 'settingsChanged':
        // React to settings changes if needed
        break;
    }
  }

  /**
   * Check alerts against current rates
   */
  async checkAlerts(rateData) {
    try {
      if (this.alertsManager && this.alertsManager.checkAlerts) {
        await this.alertsManager.checkAlerts(rateData);
      }
    } catch (error) {
      console.error('❌ Failed to check alerts:', error);
    }
  }

  /**
   * Refresh the tab content
   */
  async refresh() {
    await this.loadContent();
  }
}
