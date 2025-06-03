import { getPaymentProviders } from './utils/payment-providers-v2.js';

async function testPaymentProviders() {
  try {
    console.log('Testing getPaymentProviders function...');
    const providers = await getPaymentProviders('US');
    console.log('✅ Function executed successfully');
    console.log('Number of providers:', providers.length);

    if (providers.length > 0) {
      console.log('Sample provider:', JSON.stringify(providers[0], null, 2));
    }

    // Test with different country
    const egyptProviders = await getPaymentProviders('EG');
    console.log('\nEgypt providers:', egyptProviders.length);

    if (egyptProviders.length > 0) {
      console.log('Egypt sample:', JSON.stringify(egyptProviders[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testPaymentProviders();
