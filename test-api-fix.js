/**
 * Quick test to verify API configuration fix
 */

// Import the fixed API configuration manager
import { API_PROVIDERS } from './utils/api-service.js';

console.log('Testing API configuration fix...');

// Test that all providers have proper rate limit structure access
Object.entries(API_PROVIDERS).forEach(([key, provider]) => {
  console.log(`\nTesting provider: ${key}`);

  try {
    // This is what was causing the error - accessing rateLimits.free.requests
    const rateLimitInfo =
      provider.rateLimits.free || provider.rateLimits.registered;

    if (rateLimitInfo) {
      console.log(
        `  ✅ Rate limit: ${rateLimitInfo.requests}/${rateLimitInfo.period}`
      );
    } else {
      console.log(`  ⚠️ No rate limit info available`);
    }

    console.log(`  ✅ Features: ${provider.rateLimits.features.join(', ')}`);
    console.log(`  ✅ Provider structure is valid`);
  } catch (error) {
    console.error(`  ❌ Error accessing provider data:`, error.message);
  }
});

console.log('\n✅ API configuration fix test completed!');
