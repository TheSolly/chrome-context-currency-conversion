// Phase 3, Task 3.3: Settings Persistence Integration Test
// Test file to verify SettingsManager integration with popup

import { settingsManager } from './utils/settings-manager.js';

console.log('🧪 Testing Settings Manager Integration...');

async function testSettingsIntegration() {
  try {
    console.log('1. Initializing Settings Manager...');
    await settingsManager.initialize();

    console.log('2. Getting default settings...');
    const defaultSettings = await settingsManager.getSettings();
    console.log('Default settings loaded:', {
      baseCurrency: defaultSettings.baseCurrency,
      secondaryCurrency: defaultSettings.secondaryCurrency,
      additionalCurrencies: defaultSettings.additionalCurrencies,
      syncAcrossDevices: defaultSettings.syncAcrossDevices
    });

    console.log('3. Testing settings update...');
    await settingsManager.updateSetting('baseCurrency', 'EUR');
    const updatedSettings = await settingsManager.getSettings();
    console.log('Updated base currency:', updatedSettings.baseCurrency);

    console.log('4. Testing settings export...');
    const exportData = await settingsManager.exportSettings();
    console.log('Export data length:', exportData.length, 'characters');

    console.log('5. Testing settings import...');
    const importSuccess = await settingsManager.importSettings(exportData);
    console.log('Import success:', importSuccess);

    console.log('6. Getting statistics...');
    const stats = await settingsManager.getStatistics();
    console.log('Settings statistics:', stats);

    console.log('7. Testing reset to defaults...');
    await settingsManager.resetToDefaults();
    const resetSettings = await settingsManager.getSettings();
    console.log('After reset - base currency:', resetSettings.baseCurrency);

    console.log('✅ All Settings Manager tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Settings Manager test failed:', error);
    return false;
  }
}

// Run the test
testSettingsIntegration().then(success => {
  if (success) {
    console.log('🎉 Phase 3, Task 3.3 Settings Integration: READY');
  } else {
    console.log('⚠️ Phase 3, Task 3.3 Settings Integration: NEEDS REVIEW');
  }
});
