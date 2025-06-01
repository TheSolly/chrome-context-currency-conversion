/**
 * Debug Currency Settings Issue
 * Test specifically the primary currency settings persistence
 */

// Mock Chrome storage API
globalThis.chrome = {
  storage: {
    sync: {
      data: {},
      async get(keys) {
        console.log('🔍 Chrome storage GET:', keys, 'Data:', this.data);
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
        console.log('💾 Chrome storage SET:', data);
        Object.assign(this.data, data);
        console.log('📦 Storage after SET:', this.data);
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

import { settingsManager } from '../../utils/settings-manager.js';

async function debugCurrencySettings() {
  console.log('🔍 DEBUGGING Currency Settings Persistence...\n');

  try {
    // STEP 1: Initialize like popup does
    console.log('1️⃣ INITIALIZING settings manager...');
    await settingsManager.initialize();
    let currentSettings = await settingsManager.getSettings();

    console.log('✅ Initial settings:');
    console.log('   baseCurrency:', currentSettings.baseCurrency);
    console.log('   secondaryCurrency:', currentSettings.secondaryCurrency);
    console.log(
      '   additionalCurrencies:',
      currentSettings.additionalCurrencies
    );

    // STEP 2: Change secondary currency like user does
    console.log('\n2️⃣ CHANGING secondary currency to JPY...');
    await settingsManager.updateSetting('secondaryCurrency', 'JPY');
    currentSettings = await settingsManager.getSettings();

    console.log('✅ After changing secondary currency:');
    console.log('   baseCurrency:', currentSettings.baseCurrency);
    console.log('   secondaryCurrency:', currentSettings.secondaryCurrency);

    // STEP 3: Simulate pressing "Save Settings" button
    console.log('\n3️⃣ PRESSING Save Settings button...');
    await settingsManager.saveSettings(); // No parameters, just save current state

    console.log('✅ After save button:');
    console.log(
      '   Chrome storage contains:',
      globalThis.chrome.storage.sync.data
    );

    // STEP 4: Simulate popup close/reopen (fresh settings manager)
    console.log('\n4️⃣ SIMULATING popup close/reopen...');

    // Create fresh settings manager instance (like popup reopen)
    const { SettingsManager } = await import('./utils/settings-manager.js');
    const freshSettingsManager = new SettingsManager();
    await freshSettingsManager.initialize();
    const reloadedSettings = await freshSettingsManager.getSettings();

    console.log('✅ After popup reopen:');
    console.log('   baseCurrency:', reloadedSettings.baseCurrency);
    console.log('   secondaryCurrency:', reloadedSettings.secondaryCurrency);
    console.log(
      '   additionalCurrencies:',
      reloadedSettings.additionalCurrencies
    );

    // STEP 5: Verification
    console.log('\n5️⃣ VERIFICATION:');
    if (reloadedSettings.secondaryCurrency === 'JPY') {
      console.log('✅ SUCCESS: Secondary currency persisted correctly!');
    } else {
      console.log('❌ FAILURE: Secondary currency did not persist');
      console.log('   Expected: JPY');
      console.log('   Got:', reloadedSettings.secondaryCurrency);

      // Debug what's in storage
      console.log('\n🔍 DEBUGGING Storage Contents:');
      console.log('Raw storage data:', globalThis.chrome.storage.sync.data);

      if (globalThis.chrome.storage.sync.data.userSettings) {
        console.log(
          'Stored userSettings:',
          globalThis.chrome.storage.sync.data.userSettings
        );
        console.log(
          'Stored secondaryCurrency:',
          globalThis.chrome.storage.sync.data.userSettings.secondaryCurrency
        );
      }
    }

    // STEP 6: Test base currency too
    console.log('\n6️⃣ TESTING base currency change...');
    await freshSettingsManager.updateSetting('baseCurrency', 'EUR');
    await freshSettingsManager.saveSettings();

    // Another fresh instance
    const thirdSettingsManager = new SettingsManager();
    await thirdSettingsManager.initialize();
    const thirdSettings = await thirdSettingsManager.getSettings();

    console.log('✅ Base currency test:');
    console.log('   Expected: EUR, Got:', thirdSettings.baseCurrency);
    console.log('   Success:', thirdSettings.baseCurrency === 'EUR');
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

debugCurrencySettings();
