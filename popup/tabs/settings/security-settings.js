/**
 * Security Settings Module
 * Handles security-related functionality in settings
 */

/* global Blob, URL */

import { securityManager } from '/utils/security-manager.js';
import { secureApiKeyManager } from '/utils/secure-api-key-manager.js';

/**
 * Initialize security features
 * @param {Function} showStatus - Status display function
 */
export async function initializeSecurityFeatures(showStatus) {
  try {
    await updateSecurityStats();
    await updateApiKeyStatus();
    await updateRateLimitStatus();
    console.log('Security features initialized');
  } catch (error) {
    console.error('Failed to initialize security features:', error);
    if (showStatus) {
      showStatus('Failed to load security features', 'error');
    }
  }
}

/**
 * Update security statistics display
 */
export async function updateSecurityStats() {
  try {
    // Get API key count
    const providerStatus = await secureApiKeyManager.getProviderStatus();
    const encryptedKeyCount = Object.values(providerStatus).filter(
      status => status.hasKey
    ).length;

    // Get security events count
    const securityLogs = await chrome.storage.local.get('securityLogs');
    const eventsCount = securityLogs.securityLogs?.length || 0;

    // Update UI
    const encryptedCountEl = document.getElementById('encryptedDataCount');
    if (encryptedCountEl) {
      encryptedCountEl.textContent = encryptedKeyCount;
    }

    const eventsCountEl = document.getElementById('securityEventsCount');
    if (eventsCountEl) {
      eventsCountEl.textContent = eventsCount;
    }

    // Update security status
    const statusEl = document.getElementById('securityStatus');
    if (statusEl) {
      if (encryptedKeyCount > 0 && eventsCount < 10) {
        statusEl.textContent = 'Secure';
        statusEl.className = 'text-xs text-green-600 font-medium';
      } else if (eventsCount >= 10) {
        statusEl.textContent = 'Check Logs';
        statusEl.className = 'text-xs text-yellow-600 font-medium';
      } else {
        statusEl.textContent = 'Basic';
        statusEl.className = 'text-xs text-blue-600 font-medium';
      }
    }
  } catch (error) {
    console.error('Failed to update security stats:', error);
  }
}

/**
 * Update API key status display
 */
export async function updateApiKeyStatus() {
  try {
    const providerStatus = await secureApiKeyManager.getProviderStatus();
    const statusContainer = document.getElementById('apiKeyStatus');

    if (!statusContainer) return;

    statusContainer.innerHTML = '';

    for (const [provider, status] of Object.entries(providerStatus)) {
      const statusEl = document.createElement('div');
      statusEl.className = 'flex items-center justify-between text-xs';
      const providerName = provider.toLowerCase().replace('_', ' ');
      const statusIcon = status.hasKey ? '✅' : '❌';
      const maskedKey = status.hasKey
        ? await secureApiKeyManager.getMaskedApiKey(provider)
        : 'Not configured';

      statusEl.innerHTML = `
        <span>${statusIcon} ${providerName}</span>
        <span class="text-gray-500 font-mono">${maskedKey || 'None'}</span>
      `;

      statusContainer.appendChild(statusEl);
    }
  } catch (error) {
    console.error('Failed to update API key status:', error);
  }
}

/**
 * Update rate limiting status
 */
export async function updateRateLimitStatus() {
  try {
    const apiCallsLimit = securityManager.checkRateLimit('API_CALLS');
    const settingsLimit = securityManager.checkRateLimit('SETTINGS_UPDATES');

    const apiCallsEl = document.getElementById('apiCallsRemaining');
    if (apiCallsEl) {
      apiCallsEl.textContent = `${apiCallsLimit.remaining || 0}/100`;
    }

    const settingsEl = document.getElementById('settingsUpdatesRemaining');
    if (settingsEl) {
      settingsEl.textContent = `${settingsLimit.remaining || 0}/20`;
    }
  } catch (error) {
    console.error('Failed to update rate limit status:', error);
  }
}

/**
 * Show API key manager dialog
 * @param {Function} showDialog - Function to show dialog
 */
export async function showApiKeyManager(showDialog) {
  try {
    const providers = await secureApiKeyManager.getProviderStatus();

    let dialogContent = `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">API Key Management</h3>
        <div class="space-y-3">
    `;

    for (const [provider, status] of Object.entries(providers)) {
      const providerName = provider.toLowerCase().replace('_', ' ');
      const maskedKey = status.hasKey
        ? await secureApiKeyManager.getMaskedApiKey(provider)
        : 'Not configured';

      dialogContent += `
        <div class="border p-3 rounded">
          <div class="flex justify-between items-center mb-2">
            <strong>${providerName}</strong>
            <span class="text-xs ${status.hasKey ? 'text-green-600' : 'text-red-600'}">
              ${status.hasKey ? 'Configured' : 'Missing'}
            </span>
          </div>
          <div class="text-xs text-gray-600 mb-2">${status.description}</div>
          <div class="text-xs font-mono bg-gray-100 p-1 rounded">${maskedKey}</div>
          <div class="mt-2 space-x-2">
            <button class="edit-api-key text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded" data-provider="${provider}">
              ${status.hasKey ? 'Update' : 'Add'} Key
            </button>
            ${
              status.hasKey
                ? `
              <button class="remove-api-key text-xs px-2 py-1 bg-red-100 text-red-700 rounded" data-provider="${provider}">
                Remove
              </button>
              <button class="test-api-key text-xs px-2 py-1 bg-green-100 text-green-700 rounded" data-provider="${provider}">
                Test
              </button>
            `
                : ''
            }
          </div>
        </div>
      `;
    }

    dialogContent += `
        </div>
        <div class="flex justify-end space-x-2">
          <button class="close-dialog px-4 py-2 bg-gray-200 text-gray-800 rounded">
            Close
          </button>
        </div>
      </div>
    `;

    showDialog(dialogContent);
  } catch (error) {
    console.error('Failed to show API key manager:', error);
    throw error;
  }
}

/**
 * Clear security logs
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function clearSecurityLogs() {
  try {
    await chrome.storage.local.remove('securityLogs');
    securityManager.logSecurityEvent('security_logs_cleared');
    await updateSecurityStats();
    return { success: true };
  } catch (error) {
    console.error('Failed to clear security logs:', error);
    return { success: false, error: 'Failed to clear security logs' };
  }
}

/**
 * Export security data
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function exportSecurityData() {
  try {
    const securityLogs = await chrome.storage.local.get('securityLogs');
    const providerStatus = await secureApiKeyManager.getProviderStatus();

    const securityData = {
      exportDate: new Date().toISOString(),
      providerStatus: Object.fromEntries(
        Object.entries(providerStatus).map(([provider, status]) => [
          provider,
          { hasKey: status.hasKey, description: status.description }
        ])
      ),
      securityEvents: securityLogs.securityLogs || [],
      rateLimitStatus: {
        apiCalls: securityManager.checkRateLimit('API_CALLS'),
        settingsUpdates: securityManager.checkRateLimit('SETTINGS_UPDATES')
      }
    };

    const blob = new Blob([JSON.stringify(securityData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `currency-converter-security-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Failed to export security data:', error);
    return { success: false, error: 'Failed to export security data' };
  }
}

/**
 * Setup security event listeners
 * @param {Object} options - Setup options
 * @param {Function} options.showStatus - Status display function
 * @param {Function} options.showDialog - Dialog display function
 */
export function setupSecurityEventListeners({ showStatus, showDialog }) {
  // Manage API Keys button
  const manageApiKeysBtn = document.getElementById('manageApiKeys');
  if (manageApiKeysBtn) {
    manageApiKeysBtn.addEventListener('click', async () => {
      try {
        await showApiKeyManager(showDialog);
      } catch (_error) {
        showStatus('Failed to load API key manager', 'error');
      }
    });
  }

  // Clear security logs button
  const clearLogsBtn = document.getElementById('clearSecurityLogs');
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', async () => {
      const result = await clearSecurityLogs();
      if (result.success) {
        showStatus('Security logs cleared', 'success');
      } else {
        showStatus(result.error, 'error');
      }
    });
  }

  // Export security data button
  const exportSecurityBtn = document.getElementById('exportSecurityData');
  if (exportSecurityBtn) {
    exportSecurityBtn.addEventListener('click', async () => {
      const result = await exportSecurityData();
      if (result.success) {
        showStatus('Security data exported', 'success');
      } else {
        showStatus(result.error, 'error');
      }
    });
  }
}
