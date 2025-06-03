/* eslint-disable indent */
// Phase 6, Task 6.3: Rate Alerts & Notifications
// Comprehensive system for exchange rate monitoring, alerts, and trend analysis

/**
 * Rate Alerts Manager
 * Handles rate monitoring, alert management, notifications, and trend analysis
 */
export class RateAlertsManager {
  constructor() {
    this.STORAGE_KEYS = {
      ALERTS: 'rateAlerts',
      ALERT_HISTORY: 'alertHistory',
      RATE_HISTORY: 'rateHistory',
      ALERT_SETTINGS: 'alertSettings',
      TREND_DATA: 'trendData'
    };

    this.ALARM_NAMES = {
      RATE_CHECK: 'rateCheck',
      DAILY_SUMMARY: 'dailySummary',
      WEEKLY_SUMMARY: 'weeklySummary'
    };

    this.MAX_ALERTS = 20;
    this.MAX_RATE_HISTORY = 10000; // Store up to 10k rate data points
    this.MAX_ALERT_HISTORY = 1000;

    // Initialize data structures
    this.alerts = [];
    this.alertHistory = [];
    this.rateHistory = [];
    this.alertSettings = this.getDefaultAlertSettings();
    this.trendData = {};

    // Check if Chrome APIs are available
    this.chromeApisAvailable =
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.alarms &&
      chrome.notifications;

    if (!this.chromeApisAvailable) {
      console.warn(
        '⚠️ Chrome APIs not available, rate alerts will use limited functionality'
      );
    }
  }

  /**
   * Get default alert settings
   */
  getDefaultAlertSettings() {
    return {
      enableNotifications: true,
      enableDailySummary: true,
      enableWeeklySummary: true,
      checkInterval: 60, // minutes
      summaryTime: '09:00', // 9 AM
      soundEnabled: true,
      badgeEnabled: true,
      emailEnabled: false, // Future feature
      maxNotificationsPerDay: 10,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      alertThreshold: 0.5, // Minimum percentage change to trigger alert
      trendAnalysisPeriod: 30 // days
    };
  }

  /**
   * Initialize the rate alerts system
   */
  async initialize() {
    console.log('🔔 Initializing Rate Alerts Manager');

    try {
      await this.loadAlerts();
      await this.loadAlertHistory();
      await this.loadRateHistory();
      await this.loadAlertSettings();
      await this.loadTrendData();

      // Set up alarm listeners if in background context
      if (this.chromeApisAvailable && typeof chrome.alarms !== 'undefined') {
        await this.setupAlarms();
        this.setupAlarmListeners();
      }

      console.log('✅ Rate Alerts Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Rate Alerts Manager:', error);
      return false;
    }
  }

  /**
   * Create a new rate alert
   */
  async createAlert({
    fromCurrency,
    toCurrency,
    targetRate,
    condition, // 'above', 'below', 'change'
    threshold, // percentage change for 'change' condition
    enabled = true,
    name = null,
    description = null
  }) {
    try {
      // Validate input
      if (!fromCurrency || !toCurrency) {
        throw new Error('From and to currencies are required');
      }

      if (!targetRate && condition !== 'change') {
        throw new Error('Target rate is required for this condition');
      }

      if (condition === 'change' && !threshold) {
        throw new Error('Threshold is required for change condition');
      }

      // Check alert limit
      if (this.alerts.length >= this.MAX_ALERTS) {
        throw new Error(`Maximum ${this.MAX_ALERTS} alerts allowed`);
      }

      const alert = {
        id: this.generateAlertId(),
        fromCurrency,
        toCurrency,
        targetRate: parseFloat(targetRate) || null,
        condition,
        threshold: parseFloat(threshold) || null,
        enabled,
        name: name || `${fromCurrency}/${toCurrency} Alert`,
        description:
          description ||
          this.generateAlertDescription(condition, targetRate, threshold),
        createdAt: new Date().toISOString(),
        lastTriggered: null,
        triggerCount: 0,
        currentRate: null,
        lastChecked: null
      };

      this.alerts.push(alert);
      await this.saveAlerts();

      console.log('✅ Rate alert created:', alert);
      return alert;
    } catch (error) {
      console.error('❌ Failed to create rate alert:', error);
      throw error;
    }
  }

  /**
   * Update an existing alert
   */
  async updateAlert(alertId, updates) {
    try {
      const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
      if (alertIndex === -1) {
        throw new Error('Alert not found');
      }

      // Merge updates
      this.alerts[alertIndex] = {
        ...this.alerts[alertIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.saveAlerts();
      console.log('✅ Rate alert updated:', this.alerts[alertIndex]);
      return this.alerts[alertIndex];
    } catch (error) {
      console.error('❌ Failed to update rate alert:', error);
      throw error;
    }
  }

  /**
   * Delete a rate alert
   */
  async deleteAlert(alertId) {
    try {
      const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
      if (alertIndex === -1) {
        throw new Error('Alert not found');
      }

      const deletedAlert = this.alerts.splice(alertIndex, 1)[0];
      await this.saveAlerts();

      console.log('✅ Rate alert deleted:', deletedAlert);
      return deletedAlert;
    } catch (error) {
      console.error('❌ Failed to delete rate alert:', error);
      throw error;
    }
  }

  /**
   * Get all alerts
   */
  getAlerts() {
    return this.alerts;
  }

  /**
   * Get enabled alerts only
   */
  getEnabledAlerts() {
    return this.alerts.filter(alert => alert.enabled);
  }

  /**
   * Check rates for all enabled alerts
   */
  async checkRates() {
    try {
      const enabledAlerts = this.getEnabledAlerts();
      if (enabledAlerts.length === 0) {
        console.log('📊 No enabled alerts to check');
        return;
      }

      console.log(`📊 Checking rates for ${enabledAlerts.length} alerts`);

      for (const alert of enabledAlerts) {
        await this.checkAlertRate(alert);
      }

      console.log('✅ Rate check completed');
    } catch (error) {
      console.error('❌ Failed to check rates:', error);
    }
  }

  /**
   * Check rate for a specific alert
   */
  async checkAlertRate(alert) {
    try {
      // Import API service dynamically to avoid circular dependencies
      const { ExchangeRateService } = await import('./api-service.js');
      const apiService = new ExchangeRateService();

      // Get current exchange rate
      const result = await apiService.convertCurrency(
        1,
        alert.fromCurrency,
        alert.toCurrency
      );

      if (!result.success) {
        console.warn(
          `⚠️ Failed to get rate for ${alert.fromCurrency}/${alert.toCurrency}`
        );
        return;
      }

      const currentRate = result.convertedAmount;
      const previousRate = alert.currentRate;

      // Update alert with current rate
      alert.currentRate = currentRate;
      alert.lastChecked = new Date().toISOString();

      // Store rate in history
      await this.addRateToHistory(
        alert.fromCurrency,
        alert.toCurrency,
        currentRate
      );

      // Check if alert condition is met
      const shouldTrigger = this.shouldTriggerAlert(
        alert,
        currentRate,
        previousRate
      );

      if (shouldTrigger) {
        await this.triggerAlert(alert, currentRate, previousRate);
      }

      await this.saveAlerts();
    } catch (error) {
      console.error(`❌ Failed to check rate for alert ${alert.id}:`, error);
    }
  }

  /**
   * Determine if alert should be triggered
   */
  shouldTriggerAlert(alert, currentRate, previousRate) {
    if (!currentRate) {
      return false;
    }

    switch (alert.condition) {
      case 'above':
        return currentRate >= alert.targetRate;

      case 'below':
        return currentRate <= alert.targetRate;

      case 'change': {
        if (!previousRate) {
          return false;
        }
        const percentChange =
          Math.abs((currentRate - previousRate) / previousRate) * 100;
        return percentChange >= alert.threshold;
      }

      default:
        return false;
    }
  }

  /**
   * Trigger an alert notification
   */
  async triggerAlert(alert, currentRate, previousRate) {
    try {
      // Check quiet hours
      if (this.isQuietHours()) {
        console.log('🔇 Quiet hours active, skipping notification');
        return;
      }

      // Check daily notification limit
      if (await this.hasReachedDailyLimit()) {
        console.log('📵 Daily notification limit reached');
        return;
      }

      // Create notification
      const notification = this.createAlertNotification(
        alert,
        currentRate,
        previousRate
      );

      if (this.chromeApisAvailable && chrome.notifications) {
        await chrome.notifications.create(alert.id, notification);
      }

      // Update alert trigger info
      alert.lastTriggered = new Date().toISOString();
      alert.triggerCount++;

      // Add to alert history
      await this.addAlertToHistory(alert, currentRate, previousRate);

      // Update badge if enabled
      if (this.alertSettings.badgeEnabled) {
        await this.updateBadge();
      }

      console.log('🔔 Alert triggered:', alert.name);
    } catch (error) {
      console.error('❌ Failed to trigger alert:', error);
    }
  }

  /**
   * Create notification object for alert
   */
  createAlertNotification(alert, currentRate, previousRate) {
    let message = '';
    const title = `Rate Alert: ${alert.name}`;

    switch (alert.condition) {
      case 'above':
        message = `${alert.fromCurrency}/${alert.toCurrency} is now ${currentRate.toFixed(4)} (above ${alert.targetRate})`;
        break;

      case 'below':
        message = `${alert.fromCurrency}/${alert.toCurrency} is now ${currentRate.toFixed(4)} (below ${alert.targetRate})`;
        break;

      case 'change': {
        const percentChange =
          ((currentRate - previousRate) / previousRate) * 100;
        const direction = percentChange > 0 ? 'increased' : 'decreased';
        message = `${alert.fromCurrency}/${alert.toCurrency} ${direction} by ${Math.abs(percentChange).toFixed(2)}%`;
        break;
      }
    }

    return {
      type: 'basic',
      iconUrl: '../assets/icons/icon-48.png',
      title,
      message,
      contextMessage: new Date().toLocaleString(),
      priority: 1
    };
  }

  /**
   * Generate daily summary
   */
  async generateDailySummary() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const recentHistory = this.alertHistory.filter(entry =>
        entry.triggeredAt.startsWith(today)
      );

      if (recentHistory.length === 0) {
        console.log('📊 No alerts triggered today');
        return;
      }

      const summary = {
        date: today,
        totalAlerts: recentHistory.length,
        currencyPairs: [
          ...new Set(
            recentHistory.map(
              entry => `${entry.fromCurrency}/${entry.toCurrency}`
            )
          )
        ]
      };

      const notification = {
        type: 'basic',
        iconUrl: '../assets/icons/icon-48.png',
        title: 'Daily Rate Summary',
        message: `${summary.totalAlerts} alerts triggered today for ${summary.currencyPairs.length} currency pairs`,
        contextMessage: new Date().toLocaleString(),
        priority: 0
      };

      if (this.chromeApisAvailable && chrome.notifications) {
        await chrome.notifications.create(
          `daily-summary-${today}`,
          notification
        );
      }

      console.log('📊 Daily summary generated:', summary);
    } catch (error) {
      console.error('❌ Failed to generate daily summary:', error);
    }
  }

  /**
   * Generate weekly summary with trend analysis
   */
  async generateWeeklySummary() {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklyHistory = this.alertHistory.filter(
        entry => new Date(entry.triggeredAt) >= weekAgo
      );

      const trends = await this.analyzeTrends(7); // 7-day trends

      const summary = {
        period: '7 days',
        totalAlerts: weeklyHistory.length,
        uniquePairs: [
          ...new Set(
            weeklyHistory.map(
              entry => `${entry.fromCurrency}/${entry.toCurrency}`
            )
          )
        ],
        trends: Object.keys(trends).length
      };

      const notification = {
        type: 'basic',
        iconUrl: '../assets/icons/icon-48.png',
        title: 'Weekly Rate Summary',
        message: `${summary.totalAlerts} alerts triggered this week. ${summary.trends} currency pairs analyzed.`,
        contextMessage: new Date().toLocaleString(),
        priority: 0
      };

      if (this.chromeApisAvailable && chrome.notifications) {
        await chrome.notifications.create(
          `weekly-summary-${Date.now()}`,
          notification
        );
      }

      console.log('📊 Weekly summary generated:', summary);
    } catch (error) {
      console.error('❌ Failed to generate weekly summary:', error);
    }
  }

  /**
   * Analyze currency trends
   */
  async analyzeTrends(days = 30) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const recentRates = this.rateHistory.filter(
        entry => new Date(entry.timestamp) >= cutoffDate
      );

      const trends = {};

      // Group by currency pair
      const pairData = {};
      recentRates.forEach(entry => {
        const pair = `${entry.fromCurrency}/${entry.toCurrency}`;
        if (!pairData[pair]) {
          pairData[pair] = [];
        }
        pairData[pair].push({
          rate: entry.rate,
          timestamp: entry.timestamp
        });
      });

      // Analyze each pair
      for (const [pair, data] of Object.entries(pairData)) {
        if (data.length < 2) {
          continue;
        }

        // Sort by timestamp
        data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const firstRate = data[0].rate;
        const lastRate = data[data.length - 1].rate;
        const percentChange = ((lastRate - firstRate) / firstRate) * 100;

        // Calculate volatility (standard deviation)
        const rates = data.map(d => d.rate);
        const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
        const variance =
          rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) /
          rates.length;
        const volatility = Math.sqrt(variance);

        trends[pair] = {
          startRate: firstRate,
          endRate: lastRate,
          percentChange: percentChange,
          volatility: volatility,
          dataPoints: data.length,
          trend:
            percentChange > 1
              ? 'rising'
              : percentChange < -1
                ? 'falling'
                : 'stable'
        };
      }

      // Store trend data
      this.trendData = {
        ...this.trendData,
        [`${days}d`]: {
          generatedAt: new Date().toISOString(),
          period: days,
          trends
        }
      };

      await this.saveTrendData();
      console.log(`📈 Trend analysis completed for ${days} days:`, trends);
      return trends;
    } catch (error) {
      console.error('❌ Failed to analyze trends:', error);
      return {};
    }
  }

  /**
   * Get trend data for UI display
   */
  getTrendData(period = 30) {
    return this.trendData[`${period}d`] || null;
  }

  /**
   * Add rate to history
   */
  async addRateToHistory(fromCurrency, toCurrency, rate) {
    try {
      const entry = {
        id: this.generateId(),
        fromCurrency,
        toCurrency,
        rate: parseFloat(rate),
        timestamp: new Date().toISOString()
      };

      this.rateHistory.push(entry);

      // Limit history size
      if (this.rateHistory.length > this.MAX_RATE_HISTORY) {
        this.rateHistory = this.rateHistory.slice(-this.MAX_RATE_HISTORY);
      }

      await this.saveRateHistory();
    } catch (error) {
      console.error('❌ Failed to add rate to history:', error);
    }
  }

  /**
   * Add alert to history
   */
  async addAlertToHistory(alert, currentRate, previousRate) {
    try {
      const entry = {
        id: this.generateId(),
        alertId: alert.id,
        alertName: alert.name,
        fromCurrency: alert.fromCurrency,
        toCurrency: alert.toCurrency,
        condition: alert.condition,
        targetRate: alert.targetRate,
        threshold: alert.threshold,
        currentRate,
        previousRate,
        triggeredAt: new Date().toISOString()
      };

      this.alertHistory.push(entry);

      // Limit history size
      if (this.alertHistory.length > this.MAX_ALERT_HISTORY) {
        this.alertHistory = this.alertHistory.slice(-this.MAX_ALERT_HISTORY);
      }

      await this.saveAlertHistory();
    } catch (error) {
      console.error('❌ Failed to add alert to history:', error);
    }
  }

  /**
   * Setup Chrome alarms for periodic rate checking
   */
  async setupAlarms() {
    try {
      // Clear existing alarms
      await chrome.alarms.clearAll();

      // Rate checking alarm
      await chrome.alarms.create(this.ALARM_NAMES.RATE_CHECK, {
        delayInMinutes: this.alertSettings.checkInterval,
        periodInMinutes: this.alertSettings.checkInterval
      });

      // Daily summary alarm
      if (this.alertSettings.enableDailySummary) {
        const summaryTime = this.parseSummaryTime(
          this.alertSettings.summaryTime
        );
        await chrome.alarms.create(this.ALARM_NAMES.DAILY_SUMMARY, {
          when: summaryTime.getTime(),
          periodInMinutes: 24 * 60 // Daily
        });
      }

      // Weekly summary alarm
      if (this.alertSettings.enableWeeklySummary) {
        const summaryTime = this.parseSummaryTime(
          this.alertSettings.summaryTime
        );
        // Set for next Sunday at summary time
        const nextSunday = new Date(summaryTime);
        nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));

        await chrome.alarms.create(this.ALARM_NAMES.WEEKLY_SUMMARY, {
          when: nextSunday.getTime(),
          periodInMinutes: 7 * 24 * 60 // Weekly
        });
      }

      console.log('⏰ Alarms set up successfully');
    } catch (error) {
      console.error('❌ Failed to setup alarms:', error);
    }
  }

  /**
   * Setup alarm listeners
   */
  setupAlarmListeners() {
    if (!this.chromeApisAvailable || !chrome.alarms) {
      return;
    }

    chrome.alarms.onAlarm.addListener(async alarm => {
      console.log(`⏰ Alarm triggered: ${alarm.name}`);

      switch (alarm.name) {
        case this.ALARM_NAMES.RATE_CHECK:
          await this.checkRates();
          break;

        case this.ALARM_NAMES.DAILY_SUMMARY:
          if (this.alertSettings.enableDailySummary) {
            await this.generateDailySummary();
          }
          break;

        case this.ALARM_NAMES.WEEKLY_SUMMARY:
          if (this.alertSettings.enableWeeklySummary) {
            await this.generateWeeklySummary();
          }
          break;
      }
    });
  }

  /**
   * Utility methods
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAlertDescription(condition, targetRate, threshold) {
    switch (condition) {
      case 'above':
        return `Alert when rate goes above ${targetRate}`;
      case 'below':
        return `Alert when rate goes below ${targetRate}`;
      case 'change':
        return `Alert when rate changes by ${threshold}%`;
      default:
        return 'Rate alert';
    }
  }

  parseSummaryTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const summaryTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );

    // If time has passed today, set for tomorrow
    if (summaryTime <= now) {
      summaryTime.setDate(summaryTime.getDate() + 1);
    }

    return summaryTime;
  }

  isQuietHours() {
    if (!this.alertSettings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const startTime = this.alertSettings.quietHours.start;
    const endTime = this.alertSettings.quietHours.end;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  async hasReachedDailyLimit() {
    const today = new Date().toISOString().split('T')[0];
    const todayAlerts = this.alertHistory.filter(entry =>
      entry.triggeredAt.startsWith(today)
    );
    return todayAlerts.length >= this.alertSettings.maxNotificationsPerDay;
  }

  async updateBadge() {
    if (!this.chromeApisAvailable || !chrome.action) {
      return;
    }

    const enabledAlertsCount = this.getEnabledAlerts().length;
    const badgeText =
      enabledAlertsCount > 0 ? enabledAlertsCount.toString() : '';

    await chrome.action.setBadgeText({ text: badgeText });
    await chrome.action.setBadgeBackgroundColor({ color: '#ff6b6b' });
  }

  /**
   * Storage methods
   */
  async loadAlerts() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get(this.STORAGE_KEYS.ALERTS);
        this.alerts = result[this.STORAGE_KEYS.ALERTS] || [];
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.ALERTS);
        this.alerts = stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      console.error('❌ Failed to load alerts:', error);
      this.alerts = [];
    }
  }

  async saveAlerts() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.ALERTS]: this.alerts
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.ALERTS,
          JSON.stringify(this.alerts)
        );
      }
    } catch (error) {
      console.error('❌ Failed to save alerts:', error);
    }
  }

  async loadAlertHistory() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get(
          this.STORAGE_KEYS.ALERT_HISTORY
        );
        this.alertHistory = result[this.STORAGE_KEYS.ALERT_HISTORY] || [];
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.ALERT_HISTORY);
        this.alertHistory = stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      console.error('❌ Failed to load alert history:', error);
      this.alertHistory = [];
    }
  }

  async saveAlertHistory() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.ALERT_HISTORY]: this.alertHistory
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.ALERT_HISTORY,
          JSON.stringify(this.alertHistory)
        );
      }
    } catch (error) {
      console.error('❌ Failed to save alert history:', error);
    }
  }

  async loadRateHistory() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get(
          this.STORAGE_KEYS.RATE_HISTORY
        );
        this.rateHistory = result[this.STORAGE_KEYS.RATE_HISTORY] || [];
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.RATE_HISTORY);
        this.rateHistory = stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      console.error('❌ Failed to load rate history:', error);
      this.rateHistory = [];
    }
  }

  async saveRateHistory() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.RATE_HISTORY]: this.rateHistory
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.RATE_HISTORY,
          JSON.stringify(this.rateHistory)
        );
      }
    } catch (error) {
      console.error('❌ Failed to save rate history:', error);
    }
  }

  async loadAlertSettings() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get(
          this.STORAGE_KEYS.ALERT_SETTINGS
        );
        this.alertSettings = {
          ...this.getDefaultAlertSettings(),
          ...(result[this.STORAGE_KEYS.ALERT_SETTINGS] || {})
        };
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.ALERT_SETTINGS);
        this.alertSettings = stored
          ? {
              ...this.getDefaultAlertSettings(),
              ...JSON.parse(stored)
            }
          : this.getDefaultAlertSettings();
      }
    } catch (error) {
      console.error('❌ Failed to load alert settings:', error);
      this.alertSettings = this.getDefaultAlertSettings();
    }
  }

  async saveAlertSettings() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.ALERT_SETTINGS]: this.alertSettings
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.ALERT_SETTINGS,
          JSON.stringify(this.alertSettings)
        );
      }
    } catch (error) {
      console.error('❌ Failed to save alert settings:', error);
    }
  }

  async loadTrendData() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get(
          this.STORAGE_KEYS.TREND_DATA
        );
        this.trendData = result[this.STORAGE_KEYS.TREND_DATA] || {};
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.TREND_DATA);
        this.trendData = stored ? JSON.parse(stored) : {};
      }
    } catch (error) {
      console.error('❌ Failed to load trend data:', error);
      this.trendData = {};
    }
  }

  async saveTrendData() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.TREND_DATA]: this.trendData
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.TREND_DATA,
          JSON.stringify(this.trendData)
        );
      }
    } catch (error) {
      console.error('❌ Failed to save trend data:', error);
    }
  }

  /**
   * Public API methods for settings management
   */
  async updateAlertSettings(newSettings) {
    try {
      this.alertSettings = {
        ...this.alertSettings,
        ...newSettings
      };

      await this.saveAlertSettings();

      // Update alarms if interval changed
      if (
        newSettings.checkInterval ||
        newSettings.enableDailySummary !== undefined ||
        newSettings.enableWeeklySummary !== undefined
      ) {
        await this.setupAlarms();
      }

      console.log('✅ Alert settings updated:', this.alertSettings);
      return this.alertSettings;
    } catch (error) {
      console.error('❌ Failed to update alert settings:', error);
      throw error;
    }
  }

  getAlertSettings() {
    return this.alertSettings;
  }

  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(-limit).reverse();
  }

  getRateHistory(fromCurrency = null, toCurrency = null, limit = 1000) {
    let history = this.rateHistory;

    if (fromCurrency && toCurrency) {
      history = history.filter(
        entry =>
          entry.fromCurrency === fromCurrency && entry.toCurrency === toCurrency
      );
    }

    return history.slice(-limit).reverse();
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData(days = 90) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Clean alert history
      const originalAlertHistoryLength = this.alertHistory.length;
      this.alertHistory = this.alertHistory.filter(
        entry => new Date(entry.triggeredAt) >= cutoffDate
      );

      // Clean rate history (keep more rate data for trends)
      const originalRateHistoryLength = this.rateHistory.length;
      this.rateHistory = this.rateHistory.filter(
        entry => new Date(entry.timestamp) >= cutoffDate
      );

      await this.saveAlertHistory();
      await this.saveRateHistory();

      console.log(`🧹 Cleanup completed:
        - Alert history: ${originalAlertHistoryLength} → ${this.alertHistory.length}
        - Rate history: ${originalRateHistoryLength} → ${this.rateHistory.length}`);
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
    }
  }
}

// Export singleton instance
export const rateAlertsManager = new RateAlertsManager();
