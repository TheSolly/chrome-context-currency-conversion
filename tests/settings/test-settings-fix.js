/**
 * Test settings manager fix
 */

import { SettingsManager } from '../../utils/settings-manager.js';

async function testSettings() {
  console.log('🧪 Testing fixed settings manager...');

  const settingsManager = new SettingsManager();

  try {
    await settingsManager.initialize();
    console.log('✅ Settings manager initialization successful');

    const settings = settingsManager.getSettings();
    console.log(
      '📋 Default settings loaded:',
      Object.keys(settings).length,
      'properties'
    );
    console.log(
      '🔧 Chrome APIs available:',
      settingsManager.chromeApisAvailable
    );

    // Test saving
    await settingsManager.saveSettings({ ...settings, testProperty: 'test' });
    console.log('💾 Settings save test successful');
  } catch (error) {
    console.error('❌ Settings test failed:', error.message);
  }
}

testSettings();
