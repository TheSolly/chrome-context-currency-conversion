/**
 * Alerts Tab - Handles rate alerts and notifications functionality
 */

export class AlertsTab {
  constructor() {
    this.initialized = false;
    this.alertsManager = null;
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

      // Initialize alerts manager if not done already
      await this.alertsManager.initialize();

      // Load alerts data
      const alerts = this.alertsManager.alerts || [];
      const alertSettings = this.alertsManager.alertSettings;
      const alertHistory = this.alertsManager.alertHistory || [];

      // Display content
      this.displayAlerts(alerts);
      this.loadAlertSettings(alertSettings);
      this.displayAlertHistory(alertHistory);

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
    // New alert form
    this.setupNewAlertForm();

    // Alert settings
    this.setupAlertSettings();

    // Alert action listeners
    this.setupAlertActionListeners();
  }

  /**
   * Setup new alert form
   */
  setupNewAlertForm() {
    const showFormBtn = document.getElementById('showNewAlertForm');
    const newAlertForm = document.getElementById('newAlertForm');
    const createAlertBtn = document.getElementById('createAlert');
    const cancelAlertBtn = document.getElementById('cancelAlert');

    // Populate currency selectors
    this.populateAlertCurrencySelectors();

    showFormBtn?.addEventListener('click', () => {
      if (newAlertForm) {
        newAlertForm.classList.remove('hidden');
      }
    });

    cancelAlertBtn?.addEventListener('click', () => {
      if (newAlertForm) {
        newAlertForm.classList.add('hidden');
      }
      this.clearNewAlertForm();
    });

    createAlertBtn?.addEventListener('click', async () => {
      await this.createNewAlert();
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
    const targetRateInput = document.getElementById('targetRate');
    const targetLabel = document.querySelector('label[for="targetRate"]');

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
    const fromCurrency = document.getElementById('alertFromCurrency')?.value;
    const toCurrency = document.getElementById('alertToCurrency')?.value;
    const alertType = document.getElementById('alertType')?.value;
    const targetRate = document.getElementById('targetRate')?.value;
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
      const alert = {
        id: Date.now().toString(),
        fromCurrency,
        toCurrency,
        type: alertType,
        targetRate: parseFloat(targetRate),
        label: alertLabel || null,
        active: true,
        createdAt: new Date().toISOString()
      };

      await this.alertsManager.createAlert(alert);

      // Hide form and clear
      const form = document.getElementById('newAlertForm');
      if (form) {
        form.classList.add('hidden');
      }
      this.clearNewAlertForm();

      // Reload content
      await this.loadContent();

      this.showSuccess('Alert created successfully');
    } catch (error) {
      console.error('❌ Failed to create alert:', error);
      this.showError('Failed to create alert');
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
