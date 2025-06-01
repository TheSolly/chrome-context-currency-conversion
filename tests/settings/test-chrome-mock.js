/**
 * Test popup settings with mock Chrome storage
 */

// Mock Chrome storage API
globalThis.chrome = {
  storage: {
    sync: {
      data: {},
      async get(keys) {
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (this.data[key] !== undefined) {
              result[key] = this.data[key];
            }
          });
          return result;
        } else {
          return this.data[keys] !== undefined
            ? { [keys]: this.data[keys] }
            : {};
        }
      },
      async set(data) {
        Object.assign(this.data, data);
      }
    },
    local: {
      data: {},
      async get(keys) {
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (this.data[key] !== undefined) {
              result[key] = this.data[key];
            }
          });
          return result;
        } else {
          return this.data[keys] !== undefined
            ? { [keys]: this.data[keys] }
            : {};
        }
      },
      async set(data) {
        Object.assign(this.data, data);
      }
    }
  }
};

import { SettingsManager } from '../../utils/settings-manager.js';

async function testWithMockChrome() {
  console.log('🧪 Testing with mock Chrome storage...');

  const settingsManager1 = new SettingsManager();

  try {
    // Initialize first instance
    await settingsManager1.initialize();
    console.log('✅ First instance initialized');

    // Change a setting
    console.log('🔄 Changing showConfidence setting...');
    await settingsManager1.updateSetting('showConfidence', false);

    console.log('🔄 Changing baseCurrency setting...');
    await settingsManager1.updateSetting('baseCurrency', 'EUR');

    const settings1 = await settingsManager1.getSettings();
    console.log('✅ First instance settings:', {
      showConfidence: settings1.showConfidence,
      baseCurrency: settings1.baseCurrency
    });

    // Create second instance (simulating popup reopen)
    console.log('🔄 Creating second instance...');
    const settingsManager2 = new SettingsManager();
    await settingsManager2.initialize();

    const settings2 = await settingsManager2.getSettings();
    console.log('📋 Second instance settings:', {
      showConfidence: settings2.showConfidence,
      baseCurrency: settings2.baseCurrency
    });

    // Verify persistence
    if (
      settings2.showConfidence === false &&
      settings2.baseCurrency === 'EUR'
    ) {
      console.log(
        '✅ Settings persistence test PASSED with mock Chrome storage'
      );
    } else {
      console.log('❌ Settings persistence test FAILED');
      console.log(
        'Expected showConfidence: false, Got:',
        settings2.showConfidence
      );
      console.log('Expected baseCurrency: EUR, Got:', settings2.baseCurrency);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithMockChrome();
