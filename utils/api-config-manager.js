/**
 * API Configuration Manager for Popup UI
 * Manages API key configuration and service status
 */

import {
  apiKeyManager,
  currencyApiService,
  API_PROVIDERS
} from '../utils/api-service.js';
import { SETUP_INSTRUCTIONS } from '../utils/default-config.js';

export class ApiConfigManager {
  constructor() {
    this.container = null;
    this.isVisible = false;
  }

  /**
   * Initialize API configuration section in popup
   * @param {HTMLElement} parentContainer - Parent container element
   */
  init(parentContainer) {
    this.container = parentContainer;
    this.render();
    this.bindEvents();
  }

  /**
   * Render API configuration UI
   */
  render() {
    const apiSection = document.createElement('div');
    apiSection.className = 'api-config-section';
    apiSection.innerHTML = `
      <div class="settings-section">
        <div class="settings-header">
          <h3 class="text-lg font-semibold text-gray-800 mb-2">
            <span class="inline-block mr-2">🔗</span>
            API Configuration
          </h3>
          <button id="toggleApiConfig" class="text-sm text-blue-600 hover:text-blue-800">
            <span id="toggleApiText">Show Advanced</span>
            <span id="toggleApiIcon" class="ml-1">▼</span>
          </button>
        </div>
        
        <div id="apiConfigContent" class="hidden mt-4 space-y-4">
          <!-- API Status Overview -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 class="font-medium text-blue-800 mb-2">Service Status</h4>
            <div id="apiStatusList" class="space-y-2">
              <!-- Populated dynamically -->
            </div>
          </div>
          
          <!-- API Key Management -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 class="font-medium text-gray-800 mb-3">API Key Management</h4>
            
            <div class="space-y-3">
              <!-- API Provider Selection -->
              <div>
                <label for="apiProviderSelect" class="block text-sm font-medium text-gray-700 mb-1">
                  API Provider
                </label>
                <select id="apiProviderSelect" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select API Provider</option>
                  <!-- Populated dynamically -->
                </select>
              </div>
              
              <!-- API Key Input -->
              <div>
                <label for="apiKeyInput" class="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <div class="relative">
                  <input type="password" 
                         id="apiKeyInput" 
                         placeholder="Enter your API key"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10">
                  <button type="button" 
                          id="toggleApiKeyVisibility"
                          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    <span id="keyVisibilityIcon">👁️</span>
                  </button>
                </div>
                <div id="apiKeyValidation" class="mt-1 text-xs"></div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex space-x-2">
                <button id="saveApiKey" 
                        class="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  Save Key
                </button>
                <button id="testApiKey" 
                        class="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  Test
                </button>
                <button id="removeApiKey" 
                        class="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  Remove
                </button>
              </div>
            </div>
          </div>
          
          <!-- API Information -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 class="font-medium text-yellow-800 mb-2">💡 API Information</h4>
            <div id="apiProviderInfo" class="text-sm text-yellow-700">
              Select an API provider to see detailed information.
            </div>
          </div>
          
          <!-- Quick Test Section -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 class="font-medium text-gray-800 mb-3">🧪 Quick Test</h4>
            <div class="flex space-x-2 mb-2">
              <select id="testFromCurrency" class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              <span class="py-1 text-gray-500">→</span>
              <select id="testToCurrency" class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
              <button id="runQuickTest" 
                      class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                Test
              </button>
            </div>
            <div id="quickTestResult" class="text-sm"></div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(apiSection);
    this.populateProviderSelect();
    this.updateApiStatus();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Toggle API configuration visibility
    document.getElementById('toggleApiConfig').addEventListener('click', () => {
      this.toggleApiConfig();
    });

    // API provider selection
    document
      .getElementById('apiProviderSelect')
      .addEventListener('change', e => {
        this.onProviderSelect(e.target.value);
      });

    // API key input validation
    document.getElementById('apiKeyInput').addEventListener('input', e => {
      this.validateApiKey(e.target.value);
    });

    // Toggle API key visibility
    document
      .getElementById('toggleApiKeyVisibility')
      .addEventListener('click', () => {
        this.toggleApiKeyVisibility();
      });

    // Save API key
    document.getElementById('saveApiKey').addEventListener('click', () => {
      this.saveApiKey();
    });

    // Test API key
    document.getElementById('testApiKey').addEventListener('click', () => {
      this.testApiKey();
    });

    // Remove API key
    document.getElementById('removeApiKey').addEventListener('click', () => {
      this.removeApiKey();
    });

    // Quick test
    document.getElementById('runQuickTest').addEventListener('click', () => {
      this.runQuickTest();
    });
  }

  /**
   * Toggle API configuration section visibility
   */
  toggleApiConfig() {
    const content = document.getElementById('apiConfigContent');
    const text = document.getElementById('toggleApiText');
    const icon = document.getElementById('toggleApiIcon');

    this.isVisible = !this.isVisible;

    if (this.isVisible) {
      content.classList.remove('hidden');
      text.textContent = 'Hide Advanced';
      icon.textContent = '▲';
      this.updateApiStatus(); // Refresh status when showing
    } else {
      content.classList.add('hidden');
      text.textContent = 'Show Advanced';
      icon.textContent = '▼';
    }
  }

  /**
   * Populate API provider select dropdown
   */
  populateProviderSelect() {
    const select = document.getElementById('apiProviderSelect');

    Object.entries(API_PROVIDERS).forEach(([key, provider]) => {
      if (provider.requiresApiKey) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${provider.name} (${provider.rateLimits.free.requests}/${provider.rateLimits.free.period})`;
        select.appendChild(option);
      }
    });
  }

  /**
   * Handle API provider selection
   * @param {string} provider - Selected provider key
   */
  async onProviderSelect(provider) {
    const infoDiv = document.getElementById('apiProviderInfo');
    const keyInput = document.getElementById('apiKeyInput');

    if (!provider) {
      infoDiv.innerHTML = 'Select an API provider to see detailed information.';
      keyInput.value = '';
      return;
    }

    const config = API_PROVIDERS[provider];
    infoDiv.innerHTML = `
      <div class="space-y-2">
        <div><strong>${config.name}</strong></div>
        <div>Rate Limit: ${config.rateLimits.free.requests} requests/${config.rateLimits.free.period}</div>
        <div>Features: ${config.rateLimits.features.join(', ')}</div>
        <div class="text-green-700">✅ ${config.pros.join(', ')}</div>
        <div class="text-red-700">⚠️ ${config.cons.join(', ')}</div>
      </div>
    `;

    // Load existing API key if available
    const existingKey = await apiKeyManager.getApiKey(provider);
    if (existingKey) {
      keyInput.value = existingKey;
      this.validateApiKey(existingKey);
    } else {
      keyInput.value = '';
      this.clearValidation();
    }
  }

  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   */
  validateApiKey(apiKey) {
    const provider = document.getElementById('apiProviderSelect').value;
    const validationDiv = document.getElementById('apiKeyValidation');

    if (!provider || !apiKey) {
      this.clearValidation();
      return;
    }

    const isValid = apiKeyManager.validateApiKeyFormat(provider, apiKey);

    if (isValid) {
      validationDiv.innerHTML =
        '<span class="text-green-600">✅ Valid format</span>';
      validationDiv.className = 'mt-1 text-xs text-green-600';
    } else {
      validationDiv.innerHTML =
        '<span class="text-red-600">❌ Invalid format</span>';
      validationDiv.className = 'mt-1 text-xs text-red-600';
    }
  }

  /**
   * Clear validation message
   */
  clearValidation() {
    const validationDiv = document.getElementById('apiKeyValidation');
    validationDiv.innerHTML = '';
    validationDiv.className = 'mt-1 text-xs';
  }

  /**
   * Toggle API key visibility
   */
  toggleApiKeyVisibility() {
    const keyInput = document.getElementById('apiKeyInput');
    const icon = document.getElementById('keyVisibilityIcon');

    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      icon.textContent = '🙈';
    } else {
      keyInput.type = 'password';
      icon.textContent = '👁️';
    }
  }

  /**
   * Save API key
   */
  async saveApiKey() {
    const provider = document.getElementById('apiProviderSelect').value;
    const apiKey = document.getElementById('apiKeyInput').value;

    if (!provider) {
      this.showMessage('Please select an API provider', 'error');
      return;
    }

    if (!apiKey) {
      this.showMessage('Please enter an API key', 'error');
      return;
    }

    if (!apiKeyManager.validateApiKeyFormat(provider, apiKey)) {
      this.showMessage('Invalid API key format', 'error');
      return;
    }

    try {
      const success = await apiKeyManager.storeApiKey(provider, apiKey);
      if (success) {
        this.showMessage('API key saved successfully', 'success');
        this.updateApiStatus();
      } else {
        this.showMessage('Failed to save API key', 'error');
      }
    } catch (error) {
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Test API key
   */
  async testApiKey() {
    const provider = document.getElementById('apiProviderSelect').value;

    if (!provider) {
      this.showMessage('Please select an API provider', 'error');
      return;
    }

    try {
      this.showMessage('Testing API connection...', 'info');
      const result = await currencyApiService.testApiConnection(provider);

      if (result.success) {
        this.showMessage(
          `✅ ${result.provider} connected! USD→EUR: ${result.rate}`,
          'success'
        );
      } else {
        this.showMessage(`❌ Test failed: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showMessage(`Error testing API: ${error.message}`, 'error');
    }
  }

  /**
   * Remove API key
   */
  async removeApiKey() {
    const provider = document.getElementById('apiProviderSelect').value;

    if (!provider) {
      this.showMessage('Please select an API provider', 'error');
      return;
    }

    if (confirm(`Remove API key for ${API_PROVIDERS[provider].name}?`)) {
      try {
        const success = await apiKeyManager.removeApiKey(provider);
        if (success) {
          document.getElementById('apiKeyInput').value = '';
          this.clearValidation();
          this.showMessage('API key removed successfully', 'success');
          this.updateApiStatus();
        } else {
          this.showMessage('Failed to remove API key', 'error');
        }
      } catch (error) {
        this.showMessage(`Error: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Run quick currency conversion test
   */
  async runQuickTest() {
    const fromCurrency = document.getElementById('testFromCurrency').value;
    const toCurrency = document.getElementById('testToCurrency').value;
    const resultDiv = document.getElementById('quickTestResult');

    if (fromCurrency === toCurrency) {
      resultDiv.innerHTML =
        '<span class="text-yellow-600">⚠️ Please select different currencies</span>';
      return;
    }

    resultDiv.innerHTML =
      '<span class="text-blue-600">🔄 Testing conversion...</span>';

    try {
      const result = await currencyApiService.getExchangeRate(
        fromCurrency,
        toCurrency
      );
      resultDiv.innerHTML = `
        <span class="text-green-600">✅ ${fromCurrency} → ${toCurrency}: <strong>${result.rate}</strong></span>
        <br><span class="text-xs text-gray-500">Source: ${result.source}</span>
      `;
    } catch (error) {
      resultDiv.innerHTML = `<span class="text-red-600">❌ ${error.message}</span>`;
    }
  }

  /**
   * Update API service status
   */
  async updateApiStatus() {
    const statusList = document.getElementById('apiStatusList');
    if (!statusList) {
      return;
    }

    try {
      const stats = await apiKeyManager.getApiKeyStats();
      const serviceStats = currencyApiService.getServiceStats();

      let statusHtml = '';

      // Show primary provider (ExchangeRate-API)
      statusHtml += `
        <div class="flex justify-between items-center py-1">
          <span class="text-sm">ExchangeRate-API (Primary)</span>
          <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Active</span>
        </div>
      `;

      // Show other providers
      Object.entries(API_PROVIDERS).forEach(([key, provider]) => {
        if (provider.requiresApiKey) {
          const hasKey = stats[key]?.hasKey || false;
          statusHtml += `
            <div class="flex justify-between items-center py-1">
              <span class="text-sm">${provider.name}</span>
              <span class="text-xs ${hasKey ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} px-2 py-1 rounded">
                ${hasKey ? '✅ Configured' : '⚪ No Key'}
              </span>
            </div>
          `;
        }
      });

      statusHtml += `
        <div class="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
          Cache: ${serviceStats.cacheSize} entries • Providers: ${serviceStats.availableProviders}
        </div>
      `;

      statusList.innerHTML = statusHtml;
    } catch (error) {
      statusList.innerHTML =
        '<div class="text-red-600 text-sm">❌ Error loading status</div>';
    }
  }

  /**
   * Show message to user
   * @param {string} message - Message to show
   * @param {string} type - Message type (success, error, info)
   */
  showMessage(message, type) {
    // Create or update a message area
    let messageDiv = document.getElementById('apiMessage');
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.id = 'apiMessage';
      messageDiv.className = 'mt-2 p-2 rounded text-sm';
      document
        .getElementById('apiConfigContent')
        .insertBefore(
          messageDiv,
          document.getElementById('apiConfigContent').firstChild
        );
    }

    const colors = {
      success: 'bg-green-100 text-green-800 border border-green-200',
      error: 'bg-red-100 text-red-800 border border-red-200',
      info: 'bg-blue-100 text-blue-800 border border-blue-200'
    };

    messageDiv.className = `mt-2 p-2 rounded text-sm ${colors[type] || colors.info}`;
    messageDiv.textContent = message;

    // Auto-hide after 5 seconds for success/info messages
    if (type !== 'error') {
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 5000);
    }
  }
}

// Export singleton instance
export const apiConfigManager = new ApiConfigManager();
