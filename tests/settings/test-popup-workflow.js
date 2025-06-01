/**
 * Test the exact popup workflow to verify settings persistence fix
 */

// Mock Chrome storage API (same as before)
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

import { settingsManager } from '../../utils/settings-manager.js';

async function simulatePopupWorkflow() {
  console.log('🎨 Simulating exact popup workflow...');

  try {
    // STEP 1: Simulate popup opening (initialization)
    console.log('\n📂 STEP 1: Popup opening - initializing settings...');
    await settingsManager.initialize();
    let currentSettings = await settingsManager.getSettings();

    console.log('✅ Initial settings loaded:', {
      showConfidence: currentSettings.showConfidence,
      baseCurrency: currentSettings.baseCurrency,
      additionalCurrencies: currentSettings.additionalCurrencies.slice(0, 2) // show first 2
    });

    // STEP 2: User changes a toggle switch (showConfidence)
    console.log('\n🔧 STEP 2: User toggles showConfidence...');
    const newConfidenceValue = !currentSettings.showConfidence;
    await settingsManager.updateSetting('showConfidence', newConfidenceValue);
    currentSettings = await settingsManager.getSettings();
    console.log('✅ Toggle updated:', {
      showConfidence: currentSettings.showConfidence
    });

    // STEP 3: User changes base currency
    console.log('\n💱 STEP 3: User changes base currency to GBP...');
    await settingsManager.updateSetting('baseCurrency', 'GBP');
    currentSettings = await settingsManager.getSettings();
    console.log('✅ Currency updated:', {
      baseCurrency: currentSettings.baseCurrency
    });

    // STEP 4: User adds an additional currency
    console.log('\n➕ STEP 4: User adds CHF to additional currencies...');
    const newAdditionalCurrencies = [
      ...currentSettings.additionalCurrencies,
      'CHF'
    ];
    await settingsManager.updateSetting(
      'additionalCurrencies',
      newAdditionalCurrencies
    );
    currentSettings = await settingsManager.getSettings();
    console.log('✅ Additional currency added:', {
      additionalCurrencies: currentSettings.additionalCurrencies
    });

    // STEP 5: User changes precision
    console.log('\n🎯 STEP 5: User changes precision to 3...');
    await settingsManager.updateSetting('precision', 3);
    currentSettings = await settingsManager.getSettings();
    console.log('✅ Precision updated:', {
      precision: currentSettings.precision
    });

    console.log('\n💾 Current state before popup "close":');
    console.log({
      showConfidence: currentSettings.showConfidence,
      baseCurrency: currentSettings.baseCurrency,
      additionalCurrencies: currentSettings.additionalCurrencies,
      precision: currentSettings.precision
    });

    // STEP 6: Simulate popup closing and reopening (using same singleton)
    console.log('\n🔄 STEP 6: Popup closed and reopened (same singleton)...');

    // Instead of creating new instance, just reinitialize the singleton
    await settingsManager.initialize();
    const reloadedSettings = await settingsManager.getSettings();

    console.log('\n📋 Settings after popup reopen:');
    console.log({
      showConfidence: reloadedSettings.showConfidence,
      baseCurrency: reloadedSettings.baseCurrency,
      additionalCurrencies: reloadedSettings.additionalCurrencies,
      precision: reloadedSettings.precision
    });

    // STEP 7: Verify all changes persisted
    console.log('\n✅ VERIFICATION:');
    const allPersisted =
      reloadedSettings.showConfidence === newConfidenceValue &&
      reloadedSettings.baseCurrency === 'GBP' &&
      reloadedSettings.additionalCurrencies.includes('CHF') &&
      reloadedSettings.precision === 3;

    if (allPersisted) {
      console.log('🎉 SUCCESS: All settings changes persisted correctly!');
      console.log('🔧 The settings persistence bug has been FIXED!');
    } else {
      console.log('❌ FAILURE: Some settings did not persist');
      console.log(
        'Expected showConfidence:',
        newConfidenceValue,
        'Got:',
        reloadedSettings.showConfidence
      );
      console.log(
        'Expected baseCurrency: GBP, Got:',
        reloadedSettings.baseCurrency
      );
      console.log(
        'Expected CHF in additionalCurrencies:',
        reloadedSettings.additionalCurrencies.includes('CHF')
      );
      console.log('Expected precision: 3, Got:', reloadedSettings.precision);
    }
  } catch (error) {
    console.error('❌ Popup workflow test failed:', error.message);
  }
}

simulatePopupWorkflow();
