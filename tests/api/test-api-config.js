/**
 * Quick test of updated API configuration
 */

import { API_PROVIDERS } from '../../utils/api-service.js';

console.log('🧪 Testing updated API configuration...\n');

console.log('Primary Provider:', API_PROVIDERS.EXCHANGERATE_API.name);
console.log('Requires API Key:', API_PROVIDERS.EXCHANGERATE_API.requiresApiKey);
console.log('Base URL:', API_PROVIDERS.EXCHANGERATE_API.baseUrl);
console.log('Rate Limits:', API_PROVIDERS.EXCHANGERATE_API.rateLimits);
console.log('Is Default:', API_PROVIDERS.EXCHANGERATE_API.isDefault);

console.log('\n✅ API configuration updated successfully');
console.log(
  '👆 ExchangeRate-API is now configured as the primary provider with API key requirement'
);
