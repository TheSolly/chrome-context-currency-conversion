/**
 * Preferences Module
 * Handles toggle switches and preference settings
 */

/**
 * Toggle switch IDs that can be configured
 */
export const TOGGLE_IDS = [
  'showConfidence',
  'autoConvert',
  'showNotifications'
];

/**
 * Initialize all toggle switches with current settings
 * @param {Object} currentSettings - Current settings object
 * @param {Function} updateToggleState - Function to update toggle visual state
 */
export function initializeToggleSwitches(currentSettings, updateToggleState) {
  console.log('Initializing toggle switches...');
  console.log('Current settings:', currentSettings);

  TOGGLE_IDS.forEach(toggleId => {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      const currentValue = currentSettings[toggleId];
      console.log(`Initializing ${toggleId}: ${currentValue}`);
      updateToggleState(toggle, currentValue);
    } else {
      console.warn(
        `Toggle element not found during initialization: ${toggleId}`
      );
    }
  });
}

/**
 * Update toggle visual state
 * @param {HTMLElement} toggle - Toggle element
 * @param {boolean} enabled - Whether toggle is enabled
 */
export function updateToggleState(toggle, enabled) {
  if (!toggle) return;

  console.log(`Updating toggle state for ${toggle.id}: ${enabled}`);

  // Skip visual update for disabled toggles (premium features)
  if (toggle.disabled || toggle.getAttribute('aria-disabled') === 'true') {
    console.log(`Skipping visual update for disabled toggle: ${toggle.id}`);
    return;
  }

  toggle.setAttribute('aria-checked', enabled.toString());

  const thumb = toggle.querySelector('.toggle-thumb');

  if (enabled) {
    toggle.classList.add('enabled');
    if (thumb) {
      thumb.classList.add('enabled');
      thumb.style.setProperty('--tw-translate-x', '1.25rem');
    }
  } else {
    toggle.classList.remove('enabled');
    if (thumb) {
      thumb.classList.remove('enabled');
      thumb.style.setProperty('--tw-translate-x', '0rem');
    }
  }

  console.log(
    `Toggle ${toggle.id} updated: enabled=${enabled}, classes=${toggle.className}`
  );
}

/**
 * Setup toggle switch event listener
 * @param {string} elementId - Toggle element ID
 * @param {Object} currentSettings - Current settings object
 * @param {Function} onToggle - Callback when toggle changes
 */
export function setupToggleSwitch(elementId, currentSettings, onToggle) {
  const toggle = document.getElementById(elementId);
  if (!toggle) {
    console.warn(`Toggle element not found: ${elementId}`);
    return;
  }

  console.log(`Setting up toggle switch: ${elementId}`);

  // Don't add event listeners to disabled/premium toggles
  if (
    toggle.hasAttribute('data-disabled') ||
    toggle.classList.contains('disabled')
  ) {
    console.log(`Toggle ${elementId} is disabled, skipping event listener`);
    return;
  }

  toggle.addEventListener('click', async () => {
    console.log(`Toggle clicked: ${elementId}`);

    // Read current state from aria-checked attribute (updated by updateToggleState)
    const currentValue = toggle.getAttribute('aria-checked') === 'true';
    const newValue = !currentValue;

    console.log(`Current value: ${currentValue}, New value: ${newValue}`);

    await onToggle(elementId, newValue);
    updateToggleState(toggle, newValue);

    console.log(`Toggle ${elementId} processed successfully`);
  });
}

/**
 * Setup all toggle switches
 * @param {Object} currentSettings - Current settings object
 * @param {Function} onToggle - Callback when any toggle changes
 */
export function setupAllToggleSwitches(currentSettings, onToggle) {
  TOGGLE_IDS.forEach(toggleId => {
    setupToggleSwitch(toggleId, currentSettings, onToggle);
  });
}
