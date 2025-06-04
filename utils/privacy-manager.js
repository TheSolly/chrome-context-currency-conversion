// Phase 9, Task 9.2: Privacy Compliance Implementation
// Comprehensive privacy management system for GDPR compliance

/**
 * Privacy Manager
 * Handles privacy compliance, GDPR features, data deletion, and privacy controls
 */
export class PrivacyManager {
  constructor() {
    this.STORAGE_KEYS = {
      PRIVACY_SETTINGS: 'privacySettings',
      CONSENT_RECORDS: 'consentRecords',
      DATA_COLLECTION_LOG: 'dataCollectionLog',
      GDPR_COMPLIANCE: 'gdprCompliance'
    };

    this.DATA_TYPES = {
      CONVERSION_HISTORY: 'conversionHistory',
      FAVORITES: 'favorites',
      SETTINGS: 'settings',
      USAGE_STATISTICS: 'usageStatistics',
      API_KEYS: 'apiKeys',
      SECURITY_LOGS: 'securityLogs',
      SUBSCRIPTION_DATA: 'subscriptionData',
      RATE_ALERTS: 'rateAlerts',
      PERFORMANCE_METRICS: 'performanceMetrics'
    };

    this.CONSENT_PURPOSES = {
      ESSENTIAL: 'essential', // Core functionality
      ANALYTICS: 'analytics', // Usage analytics
      PERSONALIZATION: 'personalization', // Customized experience
      MARKETING: 'marketing' // Promotional content
    };

    this.privacySettings = this.getDefaultPrivacySettings();
    this.consentRecords = [];
    this.dataCollectionLog = [];

    // Check if Chrome APIs are available
    this.chromeApisAvailable =
      typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

    if (!this.chromeApisAvailable) {
      console.warn('⚠️ Chrome storage APIs not available for privacy manager');
    }
  }

  /**
   * Initialize privacy manager
   */
  async initialize() {
    console.log('🔒 Initializing Privacy Manager');

    try {
      await this.loadPrivacySettings();
      await this.loadConsentRecords();
      await this.loadDataCollectionLog();
      await this.checkGdprCompliance();

      console.log('✅ Privacy Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Privacy Manager:', error);
      return false;
    }
  }

  /**
   * Get default privacy settings
   */
  getDefaultPrivacySettings() {
    return {
      dataMinimization: true,
      consentRequired: true,
      retentionPeriod: 365, // days
      anonymizeData: true,
      allowAnalytics: false, // Requires explicit consent
      allowPersonalization: true,
      allowMarketing: false, // Requires explicit consent
      autoDelete: true,
      exportFormat: 'json',
      privacyMode: false, // Enhanced privacy mode
      lastUpdated: Date.now()
    };
  }

  /**
   * Request user consent for data processing
   */
  async requestConsent(purpose, description, required = false) {
    const consentRecord = {
      id: this.generateConsentId(),
      purpose,
      description,
      required,
      granted: null,
      timestamp: Date.now(),
      userAgent:
        typeof window !== 'undefined' && window.navigator
          ? window.navigator.userAgent
          : 'unknown',
      version: chrome.runtime.getManifest().version
    };

    // For essential purposes, grant automatically
    if (purpose === this.CONSENT_PURPOSES.ESSENTIAL) {
      consentRecord.granted = true;
      consentRecord.automatic = true;
    }

    this.consentRecords.push(consentRecord);
    await this.saveConsentRecords();

    console.log(`📋 Consent requested for: ${purpose}`, consentRecord);
    return consentRecord;
  }

  /**
   * Grant consent for a specific purpose
   */
  async grantConsent(consentId, granted = true) {
    const consent = this.consentRecords.find(c => c.id === consentId);
    if (!consent) {
      throw new Error('Consent record not found');
    }

    consent.granted = granted;
    consent.grantedAt = Date.now();

    await this.saveConsentRecords();
    await this.updatePrivacySettings(consent.purpose, granted);

    console.log(
      `✅ Consent ${granted ? 'granted' : 'denied'} for: ${consent.purpose}`
    );
    return consent;
  }

  /**
   * Check if consent is granted for a purpose
   */
  hasConsent(purpose) {
    const latestConsent = this.consentRecords
      .filter(c => c.purpose === purpose)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    return latestConsent ? latestConsent.granted === true : false;
  }

  /**
   * Update privacy settings based on consent
   */
  async updatePrivacySettings(purpose, granted) {
    switch (purpose) {
      case this.CONSENT_PURPOSES.ANALYTICS:
        this.privacySettings.allowAnalytics = granted;
        break;
      case this.CONSENT_PURPOSES.PERSONALIZATION:
        this.privacySettings.allowPersonalization = granted;
        break;
      case this.CONSENT_PURPOSES.MARKETING:
        this.privacySettings.allowMarketing = granted;
        break;
    }

    this.privacySettings.lastUpdated = Date.now();
    await this.savePrivacySettings();
  }

  /**
   * Log data collection activity
   */
  async logDataCollection(dataType, action, details = {}) {
    // Check if logging is allowed
    if (this.privacySettings.privacyMode && !details.essential) {
      return; // Skip logging in privacy mode for non-essential data
    }

    const logEntry = {
      id: this.generateLogId(),
      dataType,
      action, // 'collect', 'store', 'process', 'delete', 'export'
      details,
      timestamp: Date.now(),
      consentStatus: this.getConsentStatus()
    };

    this.dataCollectionLog.push(logEntry);

    // Keep only last 1000 log entries
    if (this.dataCollectionLog.length > 1000) {
      this.dataCollectionLog = this.dataCollectionLog.slice(-1000);
    }

    await this.saveDataCollectionLog();
    console.log(`📊 Data collection logged: ${dataType} - ${action}`, details);
  }

  /**
   * Get current consent status
   */
  getConsentStatus() {
    return {
      analytics: this.hasConsent(this.CONSENT_PURPOSES.ANALYTICS),
      personalization: this.hasConsent(this.CONSENT_PURPOSES.PERSONALIZATION),
      marketing: this.hasConsent(this.CONSENT_PURPOSES.MARKETING),
      essential: true // Always true
    };
  }

  /**
   * Delete user data by type
   */
  async deleteUserData(dataTypes = [], confirmDeletion = false) {
    if (!confirmDeletion) {
      throw new Error('Data deletion requires explicit confirmation');
    }

    const deletionResults = {};

    for (const dataType of dataTypes) {
      try {
        deletionResults[dataType] = await this.deleteDataByType(dataType);
        await this.logDataCollection(dataType, 'delete', {
          essential: true,
          userRequested: true
        });
      } catch (error) {
        console.error(`Failed to delete ${dataType}:`, error);
        deletionResults[dataType] = { success: false, error: error.message };
      }
    }

    console.log('🗑️ Data deletion completed:', deletionResults);
    return deletionResults;
  }

  /**
   * Delete data by specific type
   */
  async deleteDataByType(dataType) {
    const storageKeys = this.getStorageKeysForDataType(dataType);

    if (this.chromeApisAvailable) {
      await chrome.storage.local.remove(storageKeys.local || []);
      await chrome.storage.sync.remove(storageKeys.sync || []);
    } else {
      // Fallback to localStorage
      storageKeys.local?.forEach(key => localStorage.removeItem(key));
    }

    return {
      success: true,
      keysDeleted: [...(storageKeys.local || []), ...(storageKeys.sync || [])]
    };
  }

  /**
   * Get storage keys for each data type
   */
  getStorageKeysForDataType(dataType) {
    const keyMap = {
      [this.DATA_TYPES.CONVERSION_HISTORY]: {
        local: ['conversionHistory', 'conversionFavorites', 'conversionStats']
      },
      [this.DATA_TYPES.SETTINGS]: {
        sync: ['userSettings'],
        local: ['settingsVersion', 'migrationLog']
      },
      [this.DATA_TYPES.USAGE_STATISTICS]: {
        local: ['usageTracking', 'performanceMetrics']
      },
      [this.DATA_TYPES.API_KEYS]: {
        local: ['apiKeys', 'encryptedApiKeys']
      },
      [this.DATA_TYPES.SECURITY_LOGS]: {
        local: ['securityLogs']
      },
      [this.DATA_TYPES.SUBSCRIPTION_DATA]: {
        sync: ['subscription'],
        local: ['subscriptionHistory', 'userCountry']
      },
      [this.DATA_TYPES.RATE_ALERTS]: {
        local: [
          'rateAlerts',
          'alertHistory',
          'rateHistory',
          'alertSettings',
          'trendData'
        ]
      },
      [this.DATA_TYPES.PERFORMANCE_METRICS]: {
        local: ['performanceMetrics', 'adSettings']
      }
    };

    return keyMap[dataType] || { local: [], sync: [] };
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(dataTypes = null, format = 'json') {
    const allDataTypes = dataTypes || Object.values(this.DATA_TYPES);
    const exportData = {
      exportDate: new Date().toISOString(),
      privacySettings: this.privacySettings,
      consentRecords: this.consentRecords,
      userData: {}
    };

    for (const dataType of allDataTypes) {
      try {
        exportData.userData[dataType] = await this.getDataByType(dataType);
        await this.logDataCollection(dataType, 'export', {
          essential: true,
          userRequested: true,
          format
        });
      } catch (error) {
        console.error(`Failed to export ${dataType}:`, error);
        exportData.userData[dataType] = { error: error.message };
      }
    }

    switch (format.toLowerCase()) {
      case 'csv':
        return this.convertToCSV(exportData);
      case 'xml':
        return this.convertToXML(exportData);
      case 'json':
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }

  /**
   * Get data by type for export
   */
  async getDataByType(dataType) {
    const storageKeys = this.getStorageKeysForDataType(dataType);
    const data = {};

    if (this.chromeApisAvailable) {
      if (storageKeys.local?.length > 0) {
        const localData = await chrome.storage.local.get(storageKeys.local);
        Object.assign(data, localData);
      }
      if (storageKeys.sync?.length > 0) {
        const syncData = await chrome.storage.sync.get(storageKeys.sync);
        Object.assign(data, syncData);
      }
    } else {
      // Fallback to localStorage
      storageKeys.local?.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            data[key] = JSON.parse(item);
          } catch {
            data[key] = item;
          }
        }
      });
    }

    return data;
  }

  /**
   * Check GDPR compliance status
   */
  async checkGdprCompliance() {
    const compliance = {
      dataMinimization: this.privacySettings.dataMinimization,
      consentManagement: this.consentRecords.length > 0,
      rightToAccess: true, // We support data export
      rightToRectification: true, // Users can modify their data
      rightToErasure: true, // We support data deletion
      rightToPortability: true, // We support data export
      privacyByDesign: true, // Built with privacy in mind
      retentionCompliance: await this.checkRetentionCompliance(),
      lastCheck: Date.now()
    };

    if (this.chromeApisAvailable) {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.GDPR_COMPLIANCE]: compliance
      });
    }

    console.log('📋 GDPR compliance check completed:', compliance);
    return compliance;
  }

  /**
   * Check data retention compliance
   */
  async checkRetentionCompliance() {
    const retentionPeriod =
      this.privacySettings.retentionPeriod * 24 * 60 * 60 * 1000; // Convert days to ms
    const cutoffDate = Date.now() - retentionPeriod;

    // Check if we need to auto-delete old data
    if (this.privacySettings.autoDelete) {
      await this.deleteOldData(cutoffDate);
    }

    return {
      retentionPeriodDays: this.privacySettings.retentionPeriod,
      autoDeleteEnabled: this.privacySettings.autoDelete,
      cutoffDate: new Date(cutoffDate).toISOString(),
      lastCheck: Date.now()
    };
  }

  /**
   * Delete old data based on retention period
   */
  async deleteOldData(cutoffDate) {
    console.log(
      `🗑️ Deleting data older than ${new Date(cutoffDate).toISOString()}`
    );

    // This would be implemented to clean up old conversion history, logs, etc.
    // For now, we'll just log the operation
    await this.logDataCollection('system', 'retention_cleanup', {
      essential: true,
      cutoffDate: new Date(cutoffDate).toISOString()
    });
  }

  /**
   * Enable/disable privacy mode
   */
  async setPrivacyMode(enabled) {
    this.privacySettings.privacyMode = enabled;
    this.privacySettings.lastUpdated = Date.now();

    if (enabled) {
      // In privacy mode, disable non-essential data collection
      this.privacySettings.allowAnalytics = false;
      this.privacySettings.allowMarketing = false;
    }

    await this.savePrivacySettings();
    console.log(`🔒 Privacy mode ${enabled ? 'enabled' : 'disabled'}`);
    return this.privacySettings;
  }

  /**
   * Convert export data to CSV format
   */
  convertToCSV(exportData) {
    // Simplified CSV conversion - would need enhancement for complex nested data
    let csv = 'Data Type,Key,Value,Export Date\n';
    csv += `Export Info,exportDate,${exportData.exportDate},${exportData.exportDate}\n`;

    for (const [dataType, data] of Object.entries(exportData.userData)) {
      if (typeof data === 'object' && !data.error) {
        for (const [key, value] of Object.entries(data)) {
          csv += `${dataType},${key},"${JSON.stringify(value).replace(/"/g, '""')}",${exportData.exportDate}\n`;
        }
      }
    }

    return csv;
  }

  /**
   * Convert export data to XML format
   */
  convertToXML(exportData) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<userData>\n';
    xml += `  <exportDate>${exportData.exportDate}</exportDate>\n`;

    for (const [dataType, data] of Object.entries(exportData.userData)) {
      xml += `  <${dataType}>\n`;
      if (typeof data === 'object' && !data.error) {
        for (const [key, value] of Object.entries(data)) {
          xml += `    <${key}><![CDATA[${JSON.stringify(value)}]]></${key}>\n`;
        }
      }
      xml += `  </${dataType}>\n`;
    }

    xml += '</userData>';
    return xml;
  }

  /**
   * Generate unique consent ID
   */
  generateConsentId() {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Storage methods
   */
  async loadPrivacySettings() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get(
          this.STORAGE_KEYS.PRIVACY_SETTINGS
        );
        this.privacySettings = {
          ...this.getDefaultPrivacySettings(),
          ...result[this.STORAGE_KEYS.PRIVACY_SETTINGS]
        };
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.PRIVACY_SETTINGS);
        this.privacySettings = stored
          ? { ...this.getDefaultPrivacySettings(), ...JSON.parse(stored) }
          : this.getDefaultPrivacySettings();
      }
      console.log('🔒 Privacy settings loaded');
    } catch (error) {
      console.error('❌ Failed to load privacy settings:', error);
      this.privacySettings = this.getDefaultPrivacySettings();
    }
  }

  async savePrivacySettings() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.PRIVACY_SETTINGS]: this.privacySettings
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.PRIVACY_SETTINGS,
          JSON.stringify(this.privacySettings)
        );
      }
      console.log('💾 Privacy settings saved');
    } catch (error) {
      console.error('❌ Failed to save privacy settings:', error);
    }
  }

  async loadConsentRecords() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get(
          this.STORAGE_KEYS.CONSENT_RECORDS
        );
        this.consentRecords = result[this.STORAGE_KEYS.CONSENT_RECORDS] || [];
      } else {
        const stored = localStorage.getItem(this.STORAGE_KEYS.CONSENT_RECORDS);
        this.consentRecords = stored ? JSON.parse(stored) : [];
      }
      console.log(`📋 Loaded ${this.consentRecords.length} consent records`);
    } catch (error) {
      console.error('❌ Failed to load consent records:', error);
      this.consentRecords = [];
    }
  }

  async saveConsentRecords() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.CONSENT_RECORDS]: this.consentRecords
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.CONSENT_RECORDS,
          JSON.stringify(this.consentRecords)
        );
      }
      console.log(`💾 Saved ${this.consentRecords.length} consent records`);
    } catch (error) {
      console.error('❌ Failed to save consent records:', error);
    }
  }

  async loadDataCollectionLog() {
    try {
      if (this.chromeApisAvailable) {
        const result = await chrome.storage.local.get(
          this.STORAGE_KEYS.DATA_COLLECTION_LOG
        );
        this.dataCollectionLog =
          result[this.STORAGE_KEYS.DATA_COLLECTION_LOG] || [];
      } else {
        const stored = localStorage.getItem(
          this.STORAGE_KEYS.DATA_COLLECTION_LOG
        );
        this.dataCollectionLog = stored ? JSON.parse(stored) : [];
      }
      console.log(
        `📊 Loaded ${this.dataCollectionLog.length} data collection log entries`
      );
    } catch (error) {
      console.error('❌ Failed to load data collection log:', error);
      this.dataCollectionLog = [];
    }
  }

  async saveDataCollectionLog() {
    try {
      if (this.chromeApisAvailable) {
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.DATA_COLLECTION_LOG]: this.dataCollectionLog
        });
      } else {
        localStorage.setItem(
          this.STORAGE_KEYS.DATA_COLLECTION_LOG,
          JSON.stringify(this.dataCollectionLog)
        );
      }
    } catch (error) {
      console.error('❌ Failed to save data collection log:', error);
    }
  }

  /**
   * Get privacy dashboard data
   */
  getPrivacyDashboard() {
    return {
      privacySettings: this.privacySettings,
      consentStatus: this.getConsentStatus(),
      dataTypes: Object.values(this.DATA_TYPES),
      recentActivity: this.dataCollectionLog.slice(-10),
      retentionInfo: {
        retentionPeriodDays: this.privacySettings.retentionPeriod,
        autoDeleteEnabled: this.privacySettings.autoDelete
      }
    };
  }
}

// Create and export singleton instance
export const privacyManager = new PrivacyManager();
