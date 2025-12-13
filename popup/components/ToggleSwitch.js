/**
 * ToggleSwitch Component
 * Creates accessible toggle switch elements
 */

/**
 * Create a toggle switch element
 * @param {Object} options - Toggle switch options
 * @param {string} options.id - Unique identifier
 * @param {string} options.label - Label text
 * @param {string} [options.description] - Optional description for screen readers
 * @param {boolean} [options.checked=false] - Initial checked state
 * @param {boolean} [options.disabled=false] - Whether the toggle is disabled
 * @param {Function} [options.onChange] - Callback when toggle changes
 * @returns {HTMLElement} The toggle switch container element
 */
export function createToggleSwitch({
  id,
  label,
  description = '',
  checked = false,
  disabled = false,
  onChange = null
}) {
  const container = document.createElement('div');
  container.className = 'flex items-center justify-between';

  const labelContainer = document.createElement('label');
  labelContainer.htmlFor = id;
  labelContainer.className = 'text-sm text-gray-700';
  labelContainer.textContent = label;

  const button = document.createElement('button');
  button.id = id;
  button.className = 'toggle-switch';
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-checked', String(checked));

  if (description) {
    const descId = `${id}-desc`;
    button.setAttribute('aria-describedby', descId);

    const descEl = document.createElement('div');
    descEl.id = descId;
    descEl.className = 'sr-only';
    descEl.textContent = description;
    container.appendChild(descEl);
  }

  if (disabled) {
    button.setAttribute('aria-disabled', 'true');
    button.disabled = true;
  }

  const thumb = document.createElement('span');
  thumb.className = 'toggle-thumb';
  button.appendChild(thumb);

  // Update visual state
  const updateState = isChecked => {
    button.setAttribute('aria-checked', String(isChecked));
    if (isChecked) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  };

  // Initialize state
  updateState(checked);

  // Event handler
  button.addEventListener('click', () => {
    if (disabled) return;

    const newState = button.getAttribute('aria-checked') !== 'true';
    updateState(newState);

    if (onChange) {
      onChange(newState);
    }
  });

  container.appendChild(labelContainer);
  container.appendChild(button);

  // Expose methods for external control
  container.toggle = {
    setChecked: updateState,
    isChecked: () => button.getAttribute('aria-checked') === 'true',
    setDisabled: isDisabled => {
      button.disabled = isDisabled;
      button.setAttribute('aria-disabled', String(isDisabled));
    }
  };

  return container;
}

/**
 * Create a toggle switch with additional description text
 * @param {Object} options - Toggle switch options
 * @param {string} options.id - Unique identifier
 * @param {string} options.label - Label text
 * @param {string} options.subtitle - Subtitle/description text shown below label
 * @param {string} [options.srDescription] - Screen reader only description
 * @param {boolean} [options.checked=false] - Initial checked state
 * @param {boolean} [options.disabled=false] - Whether disabled
 * @param {Function} [options.onChange] - Callback when toggle changes
 * @returns {HTMLElement} The toggle switch container element
 */
export function createToggleSwitchWithSubtitle({
  id,
  label,
  subtitle,
  srDescription = '',
  checked = false,
  disabled = false,
  onChange = null
}) {
  const container = document.createElement('div');
  container.className = 'flex items-center justify-between';

  const labelContainer = document.createElement('div');
  labelContainer.className = 'flex-1';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.className = 'text-sm text-gray-700';
  labelEl.textContent = label;

  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'text-xs text-gray-500';
  subtitleEl.textContent = subtitle;

  labelContainer.appendChild(labelEl);
  labelContainer.appendChild(subtitleEl);

  const button = document.createElement('button');
  button.id = id;
  button.className = 'toggle-switch';
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-checked', String(checked));

  if (srDescription) {
    const descId = `${id}-desc`;
    button.setAttribute('aria-describedby', descId);

    const descEl = document.createElement('div');
    descEl.id = descId;
    descEl.className = 'sr-only';
    descEl.textContent = srDescription;
    container.appendChild(descEl);
  }

  if (disabled) {
    button.setAttribute('aria-disabled', 'true');
    button.disabled = true;
  }

  const thumb = document.createElement('span');
  thumb.className = 'toggle-thumb';
  button.appendChild(thumb);

  const updateState = isChecked => {
    button.setAttribute('aria-checked', String(isChecked));
    if (isChecked) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  };

  updateState(checked);

  button.addEventListener('click', () => {
    if (disabled) return;
    const newState = button.getAttribute('aria-checked') !== 'true';
    updateState(newState);
    if (onChange) onChange(newState);
  });

  container.appendChild(labelContainer);
  container.appendChild(button);

  container.toggle = {
    setChecked: updateState,
    isChecked: () => button.getAttribute('aria-checked') === 'true',
    setDisabled: isDisabled => {
      button.disabled = isDisabled;
      button.setAttribute('aria-disabled', String(isDisabled));
    }
  };

  return container;
}
