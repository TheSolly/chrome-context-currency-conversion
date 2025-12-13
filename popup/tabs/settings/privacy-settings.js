/**
 * Privacy Settings Module
 * Handles GDPR compliance and privacy-related functionality
 */

/* global Blob, URL, alert */

import { privacyManager } from '/utils/privacy-manager.js';

/**
 * Toggle privacy mode
 * @param {Event} event - Change event
 * @param {Function} showStatus - Status display function
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function togglePrivacyMode(event, showStatus) {
  try {
    const enabled = event.target.checked;

    if (enabled) {
      await privacyManager.minimizeDataCollection();
      showStatus('Privacy mode enabled - data collection minimized', 'success');
    } else {
      await privacyManager.loadPrivacySettings();
      showStatus('Privacy mode disabled', 'success');
    }

    await updatePrivacyDashboard();
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle privacy mode:', error);
    return { success: false, error: 'Failed to update privacy mode' };
  }
}

/**
 * Update privacy dashboard with current status
 */
export async function updatePrivacyDashboard() {
  try {
    const dashboard = await privacyManager.getPrivacyDashboard();

    // Update consent status
    const consentStatus = document.getElementById('consentStatus');
    if (consentStatus) {
      consentStatus.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full ${dashboard.consentStatus.given ? 'bg-green-500' : 'bg-red-500'}"></span>
          <span class="text-sm">
            ${dashboard.consentStatus.given ? 'Consent Given' : 'Consent Required'}
            ${dashboard.consentStatus.date ? `(${new Date(dashboard.consentStatus.date).toLocaleDateString()})` : ''}
          </span>
        </div>
      `;
    }

    // Update data categories count
    const dataCategoriesCount = document.getElementById('dataCategoriesCount');
    if (dataCategoriesCount) {
      const totalData = Object.values(dashboard.dataCategories).reduce(
        (sum, count) => sum + count,
        0
      );
      dataCategoriesCount.textContent = totalData;
    }

    // Update retention status
    const retentionInfo = document.getElementById('retentionInfo');
    if (retentionInfo) {
      retentionInfo.innerHTML = `
        <div class="text-xs text-gray-600">
          <div>History: ${dashboard.retentionStatus.conversionHistory} days</div>
          <div>Analytics: ${dashboard.retentionStatus.usageAnalytics} days</div>
          <div>Logs: ${dashboard.retentionStatus.errorLogs} days</div>
        </div>
      `;
    }

    // Update recent privacy activity
    const recentActivity = document.getElementById('recentPrivacyActivity');
    if (recentActivity && dashboard.recentActivity) {
      recentActivity.innerHTML = dashboard.recentActivity
        .slice(0, 3)
        .map(
          activity => `
          <div class="text-xs text-gray-500 mb-1">
            ${activity.action} - ${new Date(activity.timestamp).toLocaleString()}
          </div>
        `
        )
        .join('');
    }
  } catch (error) {
    console.error('Failed to update privacy dashboard:', error);
  }
}

/**
 * Export all user data (JSON format)
 * @param {Function} showStatus - Status display function
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function exportAllData(showStatus) {
  try {
    showStatus('Exporting data...', 'info');

    const exportData = await privacyManager.exportUserData(null, 'json');

    const blob = new Blob([exportData], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `currency-converter-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    await updatePrivacyDashboard();
    return { success: true };
  } catch (error) {
    console.error('Failed to export data:', error);
    return { success: false, error: 'Failed to export data' };
  }
}

/**
 * Export data as CSV
 * @param {Function} showStatus - Status display function
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function exportDataAsCSV(showStatus) {
  try {
    showStatus('Exporting data as CSV...', 'info');

    const exportData = await privacyManager.exportUserData(null, 'csv');

    const blob = new Blob([exportData], {
      type: 'text/csv'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `currency-converter-data-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Failed to export CSV data:', error);
    return { success: false, error: 'Failed to export CSV data' };
  }
}

/**
 * Delete selected data types
 * @param {Function} showStatus - Status display function
 * @param {Function} onSuccess - Success callback
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deleteSelectedData(showStatus, onSuccess) {
  try {
    const dataTypes = [];

    // Check which data types user wants to delete
    if (document.getElementById('deleteHistory')?.checked) {
      dataTypes.push('conversionHistory');
    }
    if (document.getElementById('deleteFavorites')?.checked) {
      dataTypes.push('favorites');
    }
    if (document.getElementById('deleteSettings')?.checked) {
      dataTypes.push('settings');
    }
    if (document.getElementById('deleteAnalytics')?.checked) {
      dataTypes.push('usageStatistics');
    }

    if (dataTypes.length === 0) {
      return { success: false, error: 'Please select data types to delete' };
    }

    // Confirm deletion
    if (
      !confirm(
        `Are you sure you want to delete the selected data types? This action cannot be undone.\n\nData types to delete:\n${dataTypes.join(', ')}`
      )
    ) {
      return { success: false, error: 'Deletion cancelled' };
    }

    showStatus('Deleting selected data...', 'info');

    const deletionResult = await privacyManager.deleteUserData(dataTypes, true);

    const successCount = Object.values(deletionResult).filter(
      result => result.success
    ).length;
    const totalCount = Object.keys(deletionResult).length;

    await updatePrivacyDashboard();

    if (onSuccess) {
      await onSuccess();
    }

    if (successCount === totalCount) {
      return {
        success: true,
        message: `Successfully deleted ${successCount} data types`
      };
    } else {
      return {
        success: true,
        message: `Deleted ${successCount}/${totalCount} data types (some failed)`
      };
    }
  } catch (error) {
    console.error('Failed to delete selected data:', error);
    return { success: false, error: 'Failed to delete selected data' };
  }
}

/**
 * Delete all data (Right to be Forgotten)
 * @param {Function} showStatus - Status display function
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deleteAllData(showStatus) {
  try {
    // First confirmation
    const confirmed = confirm(
      '⚠️ DELETE ALL DATA WARNING ⚠️\n\n' +
        'This will permanently delete ALL your data including:\n' +
        '• All settings and preferences\n' +
        '• Conversion history and favorites\n' +
        '• Usage analytics and logs\n' +
        '• API keys and security data\n\n' +
        'This action CANNOT be undone!\n\n' +
        'Are you absolutely sure you want to proceed?'
    );

    if (!confirmed) {
      return { success: false, error: 'Deletion cancelled' };
    }

    // Second confirmation
    const finalConfirm = confirm(
      'FINAL CONFIRMATION\n\n' +
        'Type "DELETE ALL" in the next dialog to confirm complete data deletion.'
    );

    if (!finalConfirm) {
      return { success: false, error: 'Deletion cancelled' };
    }

    const userInput = prompt('Type "DELETE ALL" to confirm:');
    if (userInput !== 'DELETE ALL') {
      return { success: false, error: 'Incorrect confirmation' };
    }

    showStatus('Deleting all data...', 'info');

    // Delete all data using privacy manager
    await privacyManager.deleteUserData(
      Object.values(privacyManager.DATA_TYPES),
      true
    );

    // Also clear extension storage
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();

    // Show completion message
    setTimeout(() => {
      alert(
        '✅ All data has been permanently deleted.\n\nThe extension will reload with default settings.'
      );
      window.location.reload();
    }, 2000);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete all data:', error);
    return { success: false, error: 'Failed to delete all data' };
  }
}

/**
 * Update consent preferences
 * @param {Function} _showStatus - Status display function (unused, kept for API consistency)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function updateConsentPreferences(_showStatus) {
  try {
    const preferences = {
      analytics: document.getElementById('consentAnalytics')?.checked || false,
      personalization:
        document.getElementById('consentPersonalization')?.checked || false,
      marketing: document.getElementById('consentMarketing')?.checked || false
    };

    await privacyManager.updateConsentPreferences(preferences);

    await updatePrivacyDashboard();
    return { success: true };
  } catch (error) {
    console.error('Failed to update consent preferences:', error);
    return { success: false, error: 'Failed to update consent preferences' };
  }
}

/**
 * Get privacy policy content for dialog
 * @returns {string} HTML content
 */
export function getPrivacyPolicyContent() {
  return `
    <h4 class="font-semibold mb-2">Data We Collect</h4>
    <ul class="list-disc pl-4 mb-4">
      <li>Currency preferences and settings</li>
      <li>Conversion history (optional, user controlled)</li>
      <li>Usage analytics (optional, with consent)</li>
      <li>Error logs (essential, automatically deleted after 7 days)</li>
    </ul>

    <h4 class="font-semibold mb-2">Your Rights (GDPR Compliance)</h4>
    <ul class="list-disc pl-4 mb-4">
      <li><strong>Right to Access:</strong> Export all your data</li>
      <li><strong>Right to Erasure:</strong> Delete your data</li>
      <li><strong>Right to Rectification:</strong> Modify your data</li>
      <li><strong>Right to Portability:</strong> Export in multiple formats</li>
      <li><strong>Right to Object:</strong> Opt out of data collection</li>
    </ul>

    <h4 class="font-semibold mb-2">Data Security</h4>
    <ul class="list-disc pl-4 mb-4">
      <li>All data stored locally on your device</li>
      <li>API keys encrypted with industry-standard encryption</li>
      <li>No personal data shared with third parties</li>
      <li>Automatic data cleanup based on retention periods</li>
    </ul>

    <p class="text-xs text-gray-500 mt-4">
      For the complete privacy policy, visit the extension settings → Privacy & Data section.
    </p>
  `;
}

/**
 * Show GDPR rights information dialog
 * @param {Function} showDialog - Function to show dialog
 */
export function showGdprRights(showDialog) {
  showDialog(`
    <div class="gdpr-rights-dialog">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">Your Privacy Rights (GDPR)</h3>

      <div class="space-y-4 max-h-96 overflow-y-auto">
        <div class="border-l-4 border-blue-500 pl-4">
          <h4 class="font-semibold text-blue-800">Right to Access</h4>
          <p class="text-sm text-gray-600 mt-1">
            You can view and export all data we have about you.
          </p>
        </div>

        <div class="border-l-4 border-green-500 pl-4">
          <h4 class="font-semibold text-green-800">Right to Rectification</h4>
          <p class="text-sm text-gray-600 mt-1">
            You can modify or correct your personal data at any time.
          </p>
        </div>

        <div class="border-l-4 border-red-500 pl-4">
          <h4 class="font-semibold text-red-800">Right to Erasure ("Right to be Forgotten")</h4>
          <p class="text-sm text-gray-600 mt-1">
            You can request deletion of your personal data.
          </p>
        </div>

        <div class="border-l-4 border-purple-500 pl-4">
          <h4 class="font-semibold text-purple-800">Right to Data Portability</h4>
          <p class="text-sm text-gray-600 mt-1">
            You can export your data in standard formats (JSON, CSV, XML).
          </p>
        </div>

        <div class="border-l-4 border-yellow-500 pl-4">
          <h4 class="font-semibold text-yellow-800">Right to Restrict Processing</h4>
          <p class="text-sm text-gray-600 mt-1">
            You can limit how we process your data using privacy mode.
          </p>
        </div>

        <div class="border-l-4 border-gray-500 pl-4">
          <h4 class="font-semibold text-gray-800">Right to Object</h4>
          <p class="text-sm text-gray-600 mt-1">
            You can opt out of data collection for analytics and marketing.
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button id="gdprUnderstandBtn"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          I Understand
        </button>
      </div>
    </div>
  `);

  // Add event listener after dialog is shown
  setTimeout(() => {
    const btn = document.getElementById('gdprUnderstandBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const dialog = btn.closest('.fixed');
        if (dialog) dialog.remove();
      });
    }
  }, 0);
}

/**
 * Setup privacy event listeners
 * @param {Object} options - Setup options
 * @param {Function} options.showStatus - Status display function
 * @param {Function} options.showDialog - Dialog display function
 * @param {Function} options.onDataChange - Callback when data changes
 */
export function setupPrivacyEventListeners({
  showStatus,
  showDialog: _showDialog,
  onDataChange
}) {
  // Privacy mode toggle
  const privacyModeToggle = document.getElementById('privacyMode');
  if (privacyModeToggle) {
    privacyModeToggle.addEventListener('change', async event => {
      const result = await togglePrivacyMode(event, showStatus);
      if (!result.success) {
        showStatus(result.error, 'error');
      }
    });
  }

  // Update consent button
  const updateConsentBtn = document.getElementById('updateConsent');
  if (updateConsentBtn) {
    updateConsentBtn.addEventListener('click', async () => {
      const result = await updateConsentPreferences(showStatus);
      if (result.success) {
        showStatus('Consent preferences updated', 'success');
      } else {
        showStatus(result.error, 'error');
      }
    });
  }

  // Export all data button
  const exportAllDataBtn = document.getElementById('exportAllData');
  if (exportAllDataBtn) {
    exportAllDataBtn.addEventListener('click', async () => {
      const result = await exportAllData(showStatus);
      if (result.success) {
        showStatus('Data exported successfully', 'success');
      } else {
        showStatus(result.error, 'error');
      }
    });
  }

  // Export CSV button
  const exportCSVBtn = document.getElementById('exportDataCSV');
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', async () => {
      const result = await exportDataAsCSV(showStatus);
      if (result.success) {
        showStatus('CSV data exported successfully', 'success');
      } else {
        showStatus(result.error, 'error');
      }
    });
  }

  // Delete selected data button
  const deleteSelectedBtn = document.getElementById('deleteSelectedData');
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', async () => {
      const result = await deleteSelectedData(showStatus, onDataChange);
      if (result.success) {
        showStatus(result.message, 'success');
      } else if (result.error !== 'Deletion cancelled') {
        showStatus(result.error, 'error');
      }
    });
  }

  // Delete all data button
  const deleteAllBtn = document.getElementById('deleteAllData');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', async () => {
      const result = await deleteAllData(showStatus);
      if (result.success) {
        showStatus('All data deleted successfully', 'success');
      } else if (result.error && result.error !== 'Deletion cancelled') {
        showStatus(result.error, 'error');
      }
    });
  }
}
