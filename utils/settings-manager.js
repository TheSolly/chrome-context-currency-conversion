// Phase 3, Task 3.3: Enhanced Settings Persistence
// Comprehensive settings management for Chrome extension

export class SettingsManager {
  constructor() {
    this.SETTINGS_VERSION = '1.0.0';
    this.STORAGE_KEYS = {
      USER_SETTINGS: 'userSettings',
      VERSION: 'settingsVersion',
      INSTALL_DATE: 'installDate',
      LAST_SYNC: 'lastSyncTime',
      MIGRATION_LOG: 'migrationLog'
    };

    // Default settings enhanced for Task 3.3
    this.DEFAULT_SETTINGS = {
      // Core currency settings
      baseCurrency: 'USD',
      secondaryCurrency: 'EUR',
      additionalCurrencies: ['GBP', 'JPY', 'CAD'],

      // UI preferences
      showConfidence: true,
      autoConvert: false, // Premium feature
      showNotifications: true, // Premium feature
      theme: 'light',
      precision: 2,

      // Advanced features
      enableKeyboardShortcuts: true,
      contextMenuPosition: 'smart',
      enableTooltips: true,
      animationSpeed: 'normal', // fast, normal, slow

      // Performance settings
      cacheTimeout: 300000, // 5 minutes
      maxHistoryEntries: 100,
      enableAnalytics: true,

      // Task 3.2 integration
      favoriteDisplayCount: 10,
      recentlyUsedCount: 8,
      preferredRegions: ['americas', 'europe'], // Default regions to show

      // New Task 3.3 settings
      autoSave: true,
      syncAcrossDevices: true,
      backupFrequency: 'daily', // daily, weekly, manual
      compressionEnabled: true
    };

    this.currentSettings = { ...this.DEFAULT_SETTINGS };
    this.isFirstInstall = false;
    this.migrationNeeded = false;
  }

  // Initialize settings system
  async initialize() {
    console.log('⚙️ Initializing Settings Manager');

    try {
      // Check if this is a first install
      await this.checkFirstInstall();

      // Load existing settings
      await this.loadSettings();

      // Check for migration needs
      await this.checkMigrationNeeds();

      // Validate and fix any corrupted settings
      await this.validateSettings();

      console.log('✅ Settings Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Settings Manager:', error);
      await this.initializeFirstInstall();
      return false;
    }
  }

  // Check if this is a first install
  async checkFirstInstall() {
    try {
      const installData = await chrome.storage.local.get([
        this.STORAGE_KEYS.INSTALL_DATE,
        this.STORAGE_KEYS.VERSION
      ]);

      if (!installData.installDate) {
        this.isFirstInstall = true;
        console.log('🎉 First install detected');

        // Record install date and version
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.INSTALL_DATE]: Date.now(),
          [this.STORAGE_KEYS.VERSION]: this.SETTINGS_VERSION
        });
      }
    } catch (error) {
      console.error('❌ Error checking first install:', error);
      this.isFirstInstall = true;
    }
  }

  // Load settings from storage
  async loadSettings() {
    try {
      // Load from sync storage (cross-device)
      const syncedSettings = await chrome.storage.sync.get([
        this.STORAGE_KEYS.USER_SETTINGS
      ]);

      // Load from local storage (device-specific)
      const localData = await chrome.storage.local.get([
        this.STORAGE_KEYS.LAST_SYNC,
        this.STORAGE_KEYS.MIGRATION_LOG
      ]);

      if (syncedSettings[this.STORAGE_KEYS.USER_SETTINGS]) {
        // Merge with defaults to ensure all properties exist
        this.currentSettings = {
          ...this.DEFAULT_SETTINGS,
          ...syncedSettings[this.STORAGE_KEYS.USER_SETTINGS]
        };

        console.log('📥 Settings loaded from sync storage');
      } else {
        console.log('📋 No existing settings found, using defaults');
      }

      // Update last sync time
      if (localData[this.STORAGE_KEYS.LAST_SYNC]) {
        console.log(
          `🔄 Last sync: ${new Date(localData[this.STORAGE_KEYS.LAST_SYNC]).toLocaleString()}`
        );
      }
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      this.currentSettings = { ...this.DEFAULT_SETTINGS };
      throw error;
    }
  }

  // Save settings to storage
  async saveSettings(settingsToSave = null) {
    try {
      const settings = settingsToSave || this.currentSettings;

      // Validate settings before saving
      const validatedSettings = this.validateSettingsData(settings);

      // Save to sync storage for cross-device sync
      await chrome.storage.sync.set({
        [this.STORAGE_KEYS.USER_SETTINGS]: validatedSettings
      });

      // Update local metadata
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.LAST_SYNC]: Date.now()
      });

      this.currentSettings = validatedSettings;

      console.log('💾 Settings saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      throw error;
    }
  }

  // Get current settings
  getSettings() {
    return { ...this.currentSettings };
  }

  // Update specific setting
  async updateSetting(key, value) {
    try {
      this.currentSettings[key] = value;

      if (this.currentSettings.autoSave) {
        await this.saveSettings();
      }

      console.log(`⚙️ Setting updated: ${key} = ${value}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update setting ${key}:`, error);
      throw error;
    }
  }

  // Bulk update settings
  async updateSettings(newSettings) {
    try {
      this.currentSettings = {
        ...this.currentSettings,
        ...newSettings
      };

      if (this.currentSettings.autoSave) {
        await this.saveSettings();
      }

      console.log('⚙️ Settings updated in bulk');
      return true;
    } catch (error) {
      console.error('❌ Failed to update settings:', error);
      throw error;
    }
  }

  // Reset to default settings
  async resetToDefaults() {
    try {
      this.currentSettings = { ...this.DEFAULT_SETTINGS };
      await this.saveSettings();

      console.log('🔄 Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('❌ Failed to reset settings:', error);
      throw error;
    }
  }

  // Validate settings data
  validateSettingsData(settings) {
    const validated = { ...settings };

    // Validate currency codes
    const validCurrencies = [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'CAD',
      'AUD',
      'CHF',
      'CNY'
    ]; // Basic validation
    if (!validCurrencies.includes(validated.baseCurrency)) {
      validated.baseCurrency = this.DEFAULT_SETTINGS.baseCurrency;
    }
    if (!validCurrencies.includes(validated.secondaryCurrency)) {
      validated.secondaryCurrency = this.DEFAULT_SETTINGS.secondaryCurrency;
    }

    // Validate precision
    if (
      typeof validated.precision !== 'number' ||
      validated.precision < 0 ||
      validated.precision > 8
    ) {
      validated.precision = this.DEFAULT_SETTINGS.precision;
    }

    // Validate theme
    if (!['light', 'dark', 'auto'].includes(validated.theme)) {
      validated.theme = this.DEFAULT_SETTINGS.theme;
    }

    // Validate animation speed
    if (!['fast', 'normal', 'slow'].includes(validated.animationSpeed)) {
      validated.animationSpeed = this.DEFAULT_SETTINGS.animationSpeed;
    }

    return validated;
  }

  // Check for settings migration needs
  async checkMigrationNeeds() {
    try {
      const versionData = await chrome.storage.local.get([
        this.STORAGE_KEYS.VERSION
      ]);
      const currentVersion = versionData[this.STORAGE_KEYS.VERSION];

      if (currentVersion && currentVersion !== this.SETTINGS_VERSION) {
        console.log(
          `🔄 Migration needed: ${currentVersion} -> ${this.SETTINGS_VERSION}`
        );
        this.migrationNeeded = true;
        await this.performMigration(currentVersion);
      }
    } catch (error) {
      console.error('❌ Error checking migration needs:', error);
    }
  }

  // Perform settings migration
  async performMigration(fromVersion) {
    try {
      console.log(`🔄 Performing migration from ${fromVersion}`);

      const migrationLog = {
        fromVersion,
        toVersion: this.SETTINGS_VERSION,
        timestamp: Date.now(),
        success: false
      };

      // Add any migration logic here based on version differences
      // For now, just ensure all new default settings are present
      this.currentSettings = {
        ...this.DEFAULT_SETTINGS,
        ...this.currentSettings
      };

      await this.saveSettings();

      // Update version
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.VERSION]: this.SETTINGS_VERSION
      });

      migrationLog.success = true;

      // Save migration log
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.MIGRATION_LOG]: migrationLog
      });

      console.log('✅ Migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Initialize first install
  async initializeFirstInstall() {
    try {
      console.log('🎉 Setting up first install');

      this.currentSettings = { ...this.DEFAULT_SETTINGS };
      await this.saveSettings();

      await chrome.storage.local.set({
        [this.STORAGE_KEYS.INSTALL_DATE]: Date.now(),
        [this.STORAGE_KEYS.VERSION]: this.SETTINGS_VERSION
      });

      console.log('✅ First install setup complete');
    } catch (error) {
      console.error('❌ Failed to initialize first install:', error);
      throw error;
    }
  }

  // Validate current settings
  async validateSettings() {
    try {
      const validatedSettings = this.validateSettingsData(this.currentSettings);

      // Check if validation changed anything
      const hasChanges =
        JSON.stringify(validatedSettings) !==
        JSON.stringify(this.currentSettings);

      if (hasChanges) {
        console.log('🔧 Settings validation fixed issues');
        this.currentSettings = validatedSettings;
        await this.saveSettings();
      }
    } catch (error) {
      console.error('❌ Settings validation failed:', error);
    }
  }

  // Export settings for backup
  async exportSettings() {
    try {
      const exportData = {
        settings: this.currentSettings,
        version: this.SETTINGS_VERSION,
        exportDate: Date.now(),
        installDate: (
          await chrome.storage.local.get([this.STORAGE_KEYS.INSTALL_DATE])
        )[this.STORAGE_KEYS.INSTALL_DATE]
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ Failed to export settings:', error);
      throw error;
    }
  }

  // Import settings from backup
  async importSettings(jsonString) {
    try {
      const importData = JSON.parse(jsonString);

      // Validate import data
      if (!importData.settings || !importData.version) {
        throw new Error('Invalid settings backup format');
      }

      // Validate and merge settings
      const validatedSettings = this.validateSettingsData(importData.settings);

      await this.saveSettings(validatedSettings);

      console.log('📥 Settings imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import settings:', error);
      throw error;
    }
  }

  // Get settings statistics
  async getStatistics() {
    try {
      const localData = await chrome.storage.local.get([
        this.STORAGE_KEYS.INSTALL_DATE,
        this.STORAGE_KEYS.LAST_SYNC,
        this.STORAGE_KEYS.VERSION
      ]);

      return {
        version: this.SETTINGS_VERSION,
        installDate: localData[this.STORAGE_KEYS.INSTALL_DATE],
        lastSync: localData[this.STORAGE_KEYS.LAST_SYNC],
        isFirstInstall: this.isFirstInstall,
        settingsCount: Object.keys(this.currentSettings).length,
        storageUsed: JSON.stringify(this.currentSettings).length
      };
    } catch (error) {
      console.error('❌ Failed to get statistics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const settingsManager = new SettingsManager();
