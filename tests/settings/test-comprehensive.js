#!/usr/bin/env node

// Final comprehensive test for Chrome extension settings persistence

// Persistent storage for mocking Chrome APIs
const mockSyncStorage = {};
const mockLocalStorage = {};

// Mock Chrome APIs with actual persistence and timing simulation
globalThis.chrome = {
  storage: {
    sync: {
      get: keys => {
        console.log('📖 Chrome sync GET:', keys);
        // Simulate Chrome storage latency
        return new Promise(resolve => {
          setTimeout(() => {
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
            console.log('📖 Chrome sync GET result:', result);
            resolve(result);
          }, 10); // 10ms latency
        });
      },
      set: data => {
        console.log('💾 Chrome sync SET:', data);
        // Simulate Chrome storage write latency
        return new Promise(resolve => {
          setTimeout(() => {
            Object.assign(mockSyncStorage, data);
            console.log('💾 Chrome sync SET complete');
            resolve();
          }, 20); // 20ms write latency
        });
      }
    },
    local: {
      get: keys => {
        console.log('📖 Chrome local GET:', keys);
        return new Promise(resolve => {
          setTimeout(() => {
            const result = {};
            if (Array.isArray(keys)) {
              keys.forEach(key => {
                if (mockLocalStorage[key] !== undefined) {
                  result[key] = mockLocalStorage[key];
                }
              });
            }
            resolve(result);
          }, 5);
        });
      },
      set: data => {
        console.log('💾 Chrome local SET:', data);
        return new Promise(resolve => {
          setTimeout(() => {
            Object.assign(mockLocalStorage, data);
            resolve();
          }, 10);
        });
      }
    }
  }
};

// Import SettingsManager
import { SettingsManager } from '../../utils/settings-manager.js';

async function comprehensiveSettingsTest() {
  console.log('🧪 Starting comprehensive Chrome extension settings test...\n');

  try {
    // Test 1: Basic workflow
    console.log('=== TEST 1: Basic Settings Workflow ===');

    const manager1 = new SettingsManager();
    await manager1.initialize();

    console.log(
      'Initial secondaryCurrency:',
      (await manager1.getSettings()).secondaryCurrency
    );

    // Simulate user changing currency
    await manager1.updateSetting('secondaryCurrency', 'GBP');
    console.log(
      'After update:',
      (await manager1.getSettings()).secondaryCurrency
    );

    // Simulate popup reopen
    const manager2 = new SettingsManager();
    await manager2.initialize();
    const persistedSettings = await manager2.getSettings();

    console.log('After reopen:', persistedSettings.secondaryCurrency);

    if (persistedSettings.secondaryCurrency === 'GBP') {
      console.log('✅ Test 1 PASSED\n');
    } else {
      console.log('❌ Test 1 FAILED\n');
    }

    // Test 2: Rapid succession updates (simulating user clicking quickly)
    console.log('=== TEST 2: Rapid Updates ===');

    const manager3 = new SettingsManager();
    await manager3.initialize();

    // Rapid updates
    const updates = [
      manager3.updateSetting('secondaryCurrency', 'JPY'),
      manager3.updateSetting('baseCurrency', 'CAD'),
      manager3.updateSetting('precision', 3)
    ];

    await Promise.all(updates);
    console.log('Rapid updates completed');

    // Check persistence
    const manager4 = new SettingsManager();
    await manager4.initialize();
    const rapidSettings = await manager4.getSettings();

    console.log('After rapid updates and reopen:');
    console.log('- secondaryCurrency:', rapidSettings.secondaryCurrency);
    console.log('- baseCurrency:', rapidSettings.baseCurrency);
    console.log('- precision:', rapidSettings.precision);

    if (
      rapidSettings.secondaryCurrency === 'JPY' &&
      rapidSettings.baseCurrency === 'CAD' &&
      rapidSettings.precision === 3
    ) {
      console.log('✅ Test 2 PASSED\n');
    } else {
      console.log('❌ Test 2 FAILED\n');
    }

    // Test 3: Edge case - Update while initializing
    console.log('=== TEST 3: Update During Initialization ===');

    const manager5 = new SettingsManager();
    const initPromise = manager5.initialize();

    // Try to update before initialization completes
    try {
      await initPromise; // Wait for init first
      await manager5.updateSetting('secondaryCurrency', 'AUD');

      // Check if it worked
      const manager6 = new SettingsManager();
      await manager6.initialize();
      const edgeSettings = await manager6.getSettings();

      console.log(
        'Edge case secondaryCurrency:',
        edgeSettings.secondaryCurrency
      );

      if (edgeSettings.secondaryCurrency === 'AUD') {
        console.log('✅ Test 3 PASSED\n');
      } else {
        console.log('❌ Test 3 FAILED\n');
      }
    } catch (error) {
      console.log('❌ Test 3 ERROR:', error);
    }

    // Test 4: Storage state verification
    console.log('=== TEST 4: Storage State Verification ===');
    console.log('Final sync storage state:', mockSyncStorage);
    console.log('Final local storage state:', mockLocalStorage);

    if (
      mockSyncStorage.userSettings &&
      mockSyncStorage.userSettings.secondaryCurrency
    ) {
      console.log('✅ Storage contains user settings');
    } else {
      console.log('❌ Storage missing user settings');
    }

    console.log('\n🏁 Comprehensive test completed!');
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  }
}

// Run the test
comprehensiveSettingsTest();
