#!/usr/bin/env node

// Debug script specifically for the "first write doesn't persist" issue

// Mock Chrome APIs
globalThis.chrome = {
  storage: {
    sync: {
      get: keys => {
        console.log('📖 Chrome sync get called with keys:', keys);
        return Promise.resolve({});
      },
      set: data => {
        console.log('💾 Chrome sync set called with data:', data);
        return Promise.resolve();
      }
    },
    local: {
      get: keys => {
        console.log('📖 Chrome local get called with keys:', keys);
        return Promise.resolve({});
      },
      set: data => {
        console.log('💾 Chrome local set called with data:', data);
        return Promise.resolve();
      }
    }
  }
};

// Import SettingsManager
import { SettingsManager } from '../../utils/settings-manager.js';

async function debugFirstWrite() {
  console.log('🔍 Starting debug test for first write issue...\n');

  try {
    // Create fresh instance
    console.log('1️⃣ Creating new SettingsManager instance...');
    const settingsManager = new SettingsManager();

    // Initialize - this should create default settings
    console.log('\n2️⃣ Initializing SettingsManager...');
    await settingsManager.initialize();

    // Get initial settings
    console.log('\n3️⃣ Getting initial settings...');
    const initialSettings = await settingsManager.getSettings();
    console.log(
      'Initial secondaryCurrency:',
      initialSettings.secondaryCurrency
    );

    // Perform first update - this is the one that supposedly fails
    console.log('\n4️⃣ Performing FIRST updateSetting call...');
    console.log('Updating secondaryCurrency from EUR to GBP...');
    await settingsManager.updateSetting('secondaryCurrency', 'GBP');

    // Check settings after first update
    console.log('\n5️⃣ Checking settings after first update...');
    const afterFirstUpdate = await settingsManager.getSettings();
    console.log(
      'secondaryCurrency after first update:',
      afterFirstUpdate.secondaryCurrency
    );

    // Simulate popup reopen by creating new instance
    console.log(
      '\n6️⃣ Simulating popup reopen (new SettingsManager instance)...'
    );
    const newSettingsManager = new SettingsManager();
    await newSettingsManager.initialize();

    // Check if first update persisted
    console.log('\n7️⃣ Checking if first update persisted...');
    const afterReopen = await newSettingsManager.getSettings();
    console.log(
      'secondaryCurrency after reopen:',
      afterReopen.secondaryCurrency
    );

    if (afterReopen.secondaryCurrency === 'GBP') {
      console.log('✅ First update DID persist correctly!');
    } else {
      console.log('❌ First update DID NOT persist - this is the bug!');
    }

    // Now test second update
    console.log('\n8️⃣ Performing SECOND updateSetting call...');
    console.log(
      'Updating secondaryCurrency from',
      afterReopen.secondaryCurrency,
      'to JPY...'
    );
    await newSettingsManager.updateSetting('secondaryCurrency', 'JPY');

    // Check settings after second update
    console.log('\n9️⃣ Checking settings after second update...');
    const afterSecondUpdate = await newSettingsManager.getSettings();
    console.log(
      'secondaryCurrency after second update:',
      afterSecondUpdate.secondaryCurrency
    );

    // Simulate another popup reopen
    console.log('\n🔟 Simulating another popup reopen...');
    const thirdSettingsManager = new SettingsManager();
    await thirdSettingsManager.initialize();

    // Check if second update persisted
    console.log('\n1️⃣1️⃣ Checking if second update persisted...');
    const afterSecondReopen = await thirdSettingsManager.getSettings();
    console.log(
      'secondaryCurrency after second reopen:',
      afterSecondReopen.secondaryCurrency
    );

    if (afterSecondReopen.secondaryCurrency === 'JPY') {
      console.log('✅ Second update DID persist correctly!');
    } else {
      console.log('❌ Second update DID NOT persist!');
    }

    console.log('\n📊 SUMMARY:');
    console.log('- Initial value:', initialSettings.secondaryCurrency);
    console.log(
      '- After first update + reopen:',
      afterReopen.secondaryCurrency
    );
    console.log(
      '- After second update + reopen:',
      afterSecondReopen.secondaryCurrency
    );
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Run the test
debugFirstWrite();
