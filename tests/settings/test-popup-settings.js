/**
 * Test popup settings persistence
 */

import { SettingsManager } from '../../utils/settings-manager.js';

async function testPopupSettingsPersistence() {
  console.log('🧪 Testing popup settings persistence...');

  const settingsManager = new SettingsManager();

  try {
    // Initialize settings manager (like popup does)
    await settingsManager.initialize();
    console.log('✅ Settings manager initialized');

    // Get initial settings (like popup does)
    let currentSettings = await settingsManager.getSettings();
    console.log(
      '📋 Initial settings loaded:',
      Object.keys(currentSettings).length,
      'properties'
    );

    // Simulate changing a setting (like toggle switch)
    console.log('🔄 Changing showConfidence setting...');
    const newValue = !currentSettings.showConfidence;
    await settingsManager.updateSetting('showConfidence', newValue);

    // Update local copy (like popup does)
    currentSettings = await settingsManager.getSettings();
    console.log(
      '✅ Setting updated:',
      'showConfidence =',
      currentSettings.showConfidence
    );

    // Simulate another change (like currency change)
    console.log('🔄 Changing baseCurrency setting...');
    await settingsManager.updateSetting('baseCurrency', 'EUR');
    currentSettings = await settingsManager.getSettings();
    console.log(
      '✅ Setting updated:',
      'baseCurrency =',
      currentSettings.baseCurrency
    );

    // Simulate "closing" popup and reopening (create new instance)
    console.log('🔄 Simulating popup close/reopen...');
    const newSettingsManager = new SettingsManager();
    await newSettingsManager.initialize();
    const reloadedSettings = await newSettingsManager.getSettings();

    console.log('📋 Reloaded settings:');
    console.log('  showConfidence:', reloadedSettings.showConfidence);
    console.log('  baseCurrency:', reloadedSettings.baseCurrency);

    // Verify persistence
    if (
      reloadedSettings.showConfidence === newValue &&
      reloadedSettings.baseCurrency === 'EUR'
    ) {
      console.log('✅ Settings persistence test PASSED');
    } else {
      console.log('❌ Settings persistence test FAILED');
      console.log(
        'Expected showConfidence:',
        newValue,
        'Got:',
        reloadedSettings.showConfidence
      );
      console.log(
        'Expected baseCurrency: EUR, Got:',
        reloadedSettings.baseCurrency
      );
    }
  } catch (error) {
    console.error('❌ Settings persistence test failed:', error.message);
  }
}

testPopupSettingsPersistence();
