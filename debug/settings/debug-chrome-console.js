// Debug script to be run in the actual Chrome extension console
// Copy and paste this into the popup's developer tools console

console.log('🔬 Starting Chrome extension storage debug...');

// Test 1: Check Chrome storage APIs availability
console.log('\n1️⃣ Checking Chrome APIs...');
console.log('chrome available:', typeof chrome !== 'undefined');
console.log(
  'chrome.storage available:',
  typeof chrome?.storage !== 'undefined'
);
console.log(
  'chrome.storage.sync available:',
  typeof chrome?.storage?.sync !== 'undefined'
);
console.log(
  'chrome.storage.local available:',
  typeof chrome?.storage?.local !== 'undefined'
);

// Test 2: Check current storage contents
async function checkCurrentStorage() {
  console.log('\n2️⃣ Checking current storage contents...');

  try {
    const syncData = await chrome.storage.sync.get();
    console.log('Sync storage contents:', syncData);

    const localData = await chrome.storage.local.get();
    console.log('Local storage contents:', localData);
  } catch (error) {
    console.error('Error reading storage:', error);
  }
}

// Test 3: Test basic storage write/read
async function testBasicStorage() {
  console.log('\n3️⃣ Testing basic storage operations...');

  try {
    // Write test data
    const testData = { testKey: 'testValue_' + Date.now() };
    console.log('Writing test data:', testData);

    await chrome.storage.sync.set(testData);
    console.log('✅ Test data written successfully');

    // Read it back
    const readData = await chrome.storage.sync.get(['testKey']);
    console.log('Read back test data:', readData);

    if (readData.testKey === testData.testKey) {
      console.log('✅ Basic storage test PASSED');
    } else {
      console.log('❌ Basic storage test FAILED');
    }
  } catch (error) {
    console.error('❌ Basic storage test ERROR:', error);
  }
}

// Test 4: Simulate SettingsManager workflow
async function simulateSettingsManagerWorkflow() {
  console.log('\n4️⃣ Simulating SettingsManager workflow...');

  try {
    // Simulate what SettingsManager does
    console.log('Step 1: Check install date...');
    const installCheck = await chrome.storage.local.get([
      'installDate',
      'settingsVersion'
    ]);
    console.log('Install check result:', installCheck);

    console.log('Step 2: Load user settings...');
    const userSettings = await chrome.storage.sync.get(['userSettings']);
    console.log('User settings result:', userSettings);

    console.log('Step 3: Simulate settings update...');
    const newSettings = {
      userSettings: {
        baseCurrency: 'USD',
        secondaryCurrency: 'DEBUG_' + Date.now(),
        autoSave: true
      }
    };

    console.log('Writing new settings:', newSettings);
    await chrome.storage.sync.set(newSettings);
    console.log('✅ Settings written');

    console.log('Step 4: Verify settings were written...');
    const verifySettings = await chrome.storage.sync.get(['userSettings']);
    console.log('Verification result:', verifySettings);

    if (
      verifySettings.userSettings?.secondaryCurrency ===
      newSettings.userSettings.secondaryCurrency
    ) {
      console.log('✅ Settings verification PASSED');
    } else {
      console.log('❌ Settings verification FAILED');
    }
  } catch (error) {
    console.error('❌ SettingsManager workflow ERROR:', error);
  }
}

// Test 5: Test popup lifecycle impact
async function testPopupLifecycle() {
  console.log('\n5️⃣ Testing popup lifecycle impact...');

  try {
    console.log('Step 1: Write data and immediately close popup...');
    const lifecycleData = { lifecycleTest: 'beforeClose_' + Date.now() };
    await chrome.storage.sync.set(lifecycleData);
    console.log('Data written:', lifecycleData);

    console.log('⚠️ Now close and reopen the popup to test persistence');
    console.log(
      'Then run: chrome.storage.sync.get(["lifecycleTest"]).then(console.log)'
    );
  } catch (error) {
    console.error('❌ Popup lifecycle test ERROR:', error);
  }
}

// Run all tests
async function runAllTests() {
  await checkCurrentStorage();
  await testBasicStorage();
  await simulateSettingsManagerWorkflow();
  await testPopupLifecycle();

  console.log('\n🏁 All tests completed. Check results above.');
  console.log(
    "💡 If basic storage works but SettingsManager doesn't, the issue is in the SettingsManager logic."
  );
  console.log(
    "💡 If basic storage fails, there's a Chrome extension environment issue."
  );
}

// Auto-run tests
runAllTests();
