#!/usr/bin/env node

// Debug script to check initialization timing issues

// Persistent storage for mocking Chrome APIs
const mockSyncStorage = {};
const mockLocalStorage = {};

// Mock Chrome APIs with actual persistence
globalThis.chrome = {
  storage: {
    sync: {
      get: keys => {
        console.log('📖 Chrome sync get called with keys:', keys);
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (mockSyncStorage[key] !== undefined) {
              result[key] = mockSyncStorage[key];
            }
          });
        } else if (typeof keys === 'string') {
          if (mockSyncStorage[keys] !== undefined) {
            result[keys] = mockSyncStorage[keys];
          }
        }
        console.log('📖 Returning sync data:', result);
        return Promise.resolve(result);
      },
      set: data => {
        console.log(
          '💾 Chrome sync set called with data:',
          JSON.stringify(data, null, 2)
        );
        Object.assign(mockSyncStorage, data);
        return Promise.resolve();
      }
    },
    local: {
      get: keys => {
        console.log('📖 Chrome local get called with keys:', keys);
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (mockLocalStorage[key] !== undefined) {
              result[key] = mockLocalStorage[key];
            }
          });
        } else if (typeof keys === 'string') {
          if (mockLocalStorage[keys] !== undefined) {
            result[keys] = mockLocalStorage[keys];
          }
        }
        console.log('📖 Returning local data:', result);
        return Promise.resolve(result);
      },
      set: data => {
        console.log('💾 Chrome local set called with data:', data);
        Object.assign(mockLocalStorage, data);
        return Promise.resolve();
      }
    }
  }
};

// Import SettingsManager
import { SettingsManager } from '../../utils/settings-manager.js';

async function debugInitializationTiming() {
  console.log('🔍 Testing initialization timing issues...\n');

  try {
    console.log(
      '1️⃣ Creating SettingsManager instance (no initialization yet)...'
    );
    const settingsManager = new SettingsManager();

    console.log('2️⃣ Checking currentSettings before initialization:');
    console.log(
      'settingsManager.currentSettings.secondaryCurrency:',
      settingsManager.currentSettings.secondaryCurrency
    );

    console.log('\n3️⃣ Now calling initialize()...');
    await settingsManager.initialize();

    console.log('4️⃣ Checking currentSettings after initialization:');
    console.log(
      'settingsManager.currentSettings.secondaryCurrency:',
      settingsManager.currentSettings.secondaryCurrency
    );

    console.log('\n5️⃣ Calling getSettings() to see what user would get:');
    const userSettings = await settingsManager.getSettings();
    console.log(
      'userSettings.secondaryCurrency:',
      userSettings.secondaryCurrency
    );

    console.log('\n6️⃣ Now calling updateSetting...');
    await settingsManager.updateSetting('secondaryCurrency', 'GBP');

    console.log('7️⃣ Checking currentSettings after updateSetting:');
    console.log(
      'settingsManager.currentSettings.secondaryCurrency:',
      settingsManager.currentSettings.secondaryCurrency
    );

    console.log('\n8️⃣ Creating NEW instance to simulate popup reopen...');
    const newManager = new SettingsManager();

    console.log('9️⃣ Before NEW initialization:');
    console.log(
      'newManager.currentSettings.secondaryCurrency:',
      newManager.currentSettings.secondaryCurrency
    );

    console.log('\n🔟 Initializing NEW instance...');
    await newManager.initialize();

    console.log('1️⃣1️⃣ After NEW initialization:');
    console.log(
      'newManager.currentSettings.secondaryCurrency:',
      newManager.currentSettings.secondaryCurrency
    );

    console.log('\n1️⃣2️⃣ Final getSettings() call on new instance:');
    const finalSettings = await newManager.getSettings();
    console.log(
      'finalSettings.secondaryCurrency:',
      finalSettings.secondaryCurrency
    );

    console.log('\n📊 TIMING SUMMARY:');
    console.log('- Before init:', 'EUR (default)');
    console.log('- After first init:', userSettings.secondaryCurrency);
    console.log('- After updateSetting:', 'GBP (expected)');
    console.log('- After second init:', finalSettings.secondaryCurrency);

    if (finalSettings.secondaryCurrency === 'GBP') {
      console.log('✅ Timing test PASSED - settings persisted correctly');
    } else {
      console.log('❌ Timing test FAILED - settings did not persist');
    }
  } catch (error) {
    console.error('❌ Timing test ERROR:', error);
  }
}

// Run the test
debugInitializationTiming();
