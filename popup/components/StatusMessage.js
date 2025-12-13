/**
 * StatusMessage Component
 * Creates status/notification message elements
 */

/**
 * Status message types
 */
export const STATUS_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

/**
 * Get styles for a status type
 * @param {string} type - Status type
 * @returns {Object} Style configuration
 */
function getStatusStyles(type) {
  const styles = {
    success: {
      bg: 'bg-green-100',
      border: 'border-green-500',
      text: 'text-green-700',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-700',
      icon: '✕'
    },
    warning: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-700',
      icon: '⚠'
    },
    info: {
      bg: 'bg-blue-100',
      border: 'border-blue-500',
      text: 'text-blue-700',
      icon: 'ℹ'
    },
    loading: {
      bg: 'bg-gray-100',
      border: 'border-gray-400',
      text: 'text-gray-700',
      icon: '⏳'
    }
  };

  return styles[type] || styles.info;
}

/**
 * Create a status message element
 * @param {Object} options - Message options
 * @param {string} options.message - Message text
 * @param {string} [options.type='info'] - Status type
 * @param {boolean} [options.dismissible=false] - Can be dismissed
 * @param {number} [options.autoHide=0] - Auto-hide after ms (0 = never)
 * @param {Function} [options.onDismiss] - Callback when dismissed
 * @returns {HTMLElement} The status message element
 */
export function createStatusMessage({
  message,
  type = STATUS_TYPES.INFO,
  dismissible = false,
  autoHide = 0,
  onDismiss = null
}) {
  const styles = getStatusStyles(type);

  const container = document.createElement('div');
  container.className = `${styles.bg} ${styles.border} ${styles.text} border-l-4 p-3 rounded-r-lg flex items-center gap-2`;
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  const iconEl = document.createElement('span');
  iconEl.className = 'text-sm';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = styles.icon;

  const messageEl = document.createElement('span');
  messageEl.className = 'flex-1 text-sm';
  messageEl.textContent = message;

  container.appendChild(iconEl);
  container.appendChild(messageEl);

  if (dismissible) {
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'text-sm hover:opacity-70 transition-opacity';
    dismissBtn.setAttribute('aria-label', 'Dismiss message');
    dismissBtn.textContent = '×';
    dismissBtn.addEventListener('click', () => {
      container.remove();
      if (onDismiss) onDismiss();
    });
    container.appendChild(dismissBtn);
  }

  if (autoHide > 0) {
    setTimeout(() => {
      container.classList.add('opacity-0', 'transition-opacity');
      setTimeout(() => {
        container.remove();
        if (onDismiss) onDismiss();
      }, 300);
    }, autoHide);
  }

  // Expose methods
  container.status = {
    setMessage: newMessage => {
      messageEl.textContent = newMessage;
    },
    setType: newType => {
      const newStyles = getStatusStyles(newType);
      container.className = `${newStyles.bg} ${newStyles.border} ${newStyles.text} border-l-4 p-3 rounded-r-lg flex items-center gap-2`;
      iconEl.textContent = newStyles.icon;
    },
    dismiss: () => {
      container.remove();
      if (onDismiss) onDismiss();
    }
  };

  return container;
}

/**
 * Create an inline status indicator
 * @param {Object} options - Indicator options
 * @param {string} options.id - Unique identifier
 * @param {string} [options.type='info'] - Status type
 * @param {string} [options.text=''] - Status text
 * @returns {HTMLElement} The status indicator element
 */
export function createStatusIndicator({
  id,
  type = STATUS_TYPES.INFO,
  text = ''
}) {
  const styles = getStatusStyles(type);

  const container = document.createElement('span');
  container.id = id;
  container.className = `text-xs font-medium ${styles.text}`;
  container.setAttribute('aria-label', `Status: ${text}`);
  container.textContent = text;

  container.status = {
    setText: newText => {
      container.textContent = newText;
      container.setAttribute('aria-label', `Status: ${newText}`);
    },
    setType: newType => {
      const newStyles = getStatusStyles(newType);
      container.className = `text-xs font-medium ${newStyles.text}`;
    }
  };

  return container;
}

/**
 * Create a loading spinner element
 * @param {Object} options - Spinner options
 * @param {string} [options.size='md'] - Size (sm, md, lg)
 * @param {string} [options.text=''] - Loading text
 * @returns {HTMLElement} The loading spinner element
 */
export function createLoadingSpinner({ size = 'md', text = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const container = document.createElement('div');
  container.className = 'flex items-center justify-center gap-2';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  const spinner = document.createElement('div');
  spinner.className = `${sizeClasses[size]} border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin`;

  container.appendChild(spinner);

  if (text) {
    const textEl = document.createElement('span');
    textEl.className = 'text-sm text-gray-600';
    textEl.textContent = text;
    container.appendChild(textEl);

    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = text;
    container.appendChild(srText);
  } else {
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = 'Loading...';
    container.appendChild(srText);
  }

  return container;
}

/**
 * Show a toast notification
 * @param {Object} options - Toast options
 * @param {string} options.message - Message text
 * @param {string} [options.type='info'] - Status type
 * @param {number} [options.duration=3000] - Duration in ms
 * @param {string} [options.containerId='toast-container'] - Container ID
 */
export function showToast({
  message,
  type = STATUS_TYPES.INFO,
  duration = 3000,
  containerId = 'toast-container'
}) {
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'fixed bottom-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
  }

  const toast = createStatusMessage({
    message,
    type,
    dismissible: true,
    autoHide: duration
  });

  toast.classList.add(
    'transform',
    'translate-x-full',
    'transition-transform',
    'duration-300'
  );

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full');
  });
}

// ============================================
// SKELETON LOADERS (Phase 7: Loading States)
// ============================================

/**
 * Create a skeleton text line for loading states
 * @param {Object} options - Skeleton options
 * @param {string} [options.width='100%'] - Width (e.g., '75%', '100px')
 * @param {string} [options.size='md'] - Size variant (sm, md, lg)
 * @returns {HTMLElement} The skeleton element
 */
export function createSkeletonText({ width = '100%', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5'
  };

  const skeleton = document.createElement('div');
  skeleton.className = `${sizeClasses[size]} bg-gray-200 rounded animate-pulse`;
  skeleton.style.width = width;
  skeleton.setAttribute('aria-hidden', 'true');

  return skeleton;
}

/**
 * Create a skeleton card for loading states
 * @param {Object} options - Skeleton options
 * @param {number} [options.lines=3] - Number of text lines
 * @param {boolean} [options.showAvatar=false] - Show avatar placeholder
 * @param {boolean} [options.showAction=false] - Show action button placeholder
 * @returns {HTMLElement} The skeleton card element
 */
export function createSkeletonCard({
  lines = 3,
  showAvatar = false,
  showAction = false
}) {
  const card = document.createElement('div');
  card.className =
    'bg-white rounded-xl border border-gray-200 p-4 space-y-3 animate-pulse';
  card.setAttribute('aria-label', 'Loading...');
  card.setAttribute('role', 'status');

  // Header with optional avatar
  if (showAvatar) {
    const header = document.createElement('div');
    header.className = 'flex items-center gap-3';

    const avatar = document.createElement('div');
    avatar.className = 'w-10 h-10 bg-gray-200 rounded-full';

    const headerText = document.createElement('div');
    headerText.className = 'flex-1 space-y-2';
    headerText.appendChild(createSkeletonText({ width: '60%', size: 'md' }));
    headerText.appendChild(createSkeletonText({ width: '40%', size: 'sm' }));

    header.appendChild(avatar);
    header.appendChild(headerText);
    card.appendChild(header);
  }

  // Content lines
  const content = document.createElement('div');
  content.className = 'space-y-2';

  const lineWidths = ['100%', '90%', '75%', '85%', '70%'];
  for (let i = 0; i < lines; i++) {
    content.appendChild(
      createSkeletonText({
        width: lineWidths[i % lineWidths.length],
        size: 'md'
      })
    );
  }
  card.appendChild(content);

  // Action button placeholder
  if (showAction) {
    const action = document.createElement('div');
    action.className = 'pt-2';
    action.appendChild(createSkeletonText({ width: '120px', size: 'lg' }));
    card.appendChild(action);
  }

  return card;
}

/**
 * Create a skeleton list for loading multiple items
 * @param {Object} options - Skeleton options
 * @param {number} [options.count=3] - Number of items
 * @param {boolean} [options.compact=false] - Compact mode
 * @returns {HTMLElement} The skeleton list element
 */
export function createSkeletonList({ count = 3, compact = false }) {
  const list = document.createElement('div');
  list.className = compact ? 'space-y-2' : 'space-y-3';
  list.setAttribute('aria-label', 'Loading list...');
  list.setAttribute('role', 'status');

  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.className = compact
      ? 'flex items-center gap-2 p-2 bg-gray-50 rounded-lg animate-pulse'
      : 'flex items-center justify-between p-3 bg-gray-50 rounded-xl animate-pulse';

    const left = document.createElement('div');
    left.className = 'flex-1 space-y-1';
    left.appendChild(
      createSkeletonText({ width: compact ? '80%' : '60%', size: 'md' })
    );
    if (!compact) {
      left.appendChild(createSkeletonText({ width: '40%', size: 'sm' }));
    }

    const right = document.createElement('div');
    right.className = 'w-16';
    right.appendChild(createSkeletonText({ width: '100%', size: 'md' }));

    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  }

  return list;
}

/**
 * Create a loading overlay for containers
 * @param {Object} options - Overlay options
 * @param {string} [options.text='Loading...'] - Loading text
 * @param {boolean} [options.blur=true] - Apply blur effect
 * @returns {HTMLElement} The overlay element
 */
export function createLoadingOverlay({ text = 'Loading...', blur = true }) {
  const overlay = document.createElement('div');
  overlay.className = `absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 ${
    blur ? 'backdrop-blur-sm' : ''
  }`;
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');

  const spinner = createLoadingSpinner({ size: 'lg', text: '' });
  overlay.appendChild(spinner);

  if (text) {
    const textEl = document.createElement('p');
    textEl.className = 'mt-3 text-sm font-medium text-gray-600';
    textEl.textContent = text;
    overlay.appendChild(textEl);
  }

  return overlay;
}

/**
 * Create a progress bar element
 * @param {Object} options - Progress options
 * @param {number} [options.value=0] - Current value (0-100)
 * @param {boolean} [options.animated=false] - Animate the fill
 * @param {boolean} [options.showLabel=false] - Show percentage label
 * @param {string} [options.size='md'] - Size variant (sm, md, lg)
 * @returns {HTMLElement} The progress bar element
 */
export function createProgressBar({
  value = 0,
  animated = false,
  showLabel = false,
  size = 'md'
}) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const container = document.createElement('div');
  container.className = 'w-full';
  container.setAttribute('role', 'progressbar');
  container.setAttribute('aria-valuenow', value);
  container.setAttribute('aria-valuemin', 0);
  container.setAttribute('aria-valuemax', 100);

  if (showLabel) {
    const labelContainer = document.createElement('div');
    labelContainer.className = 'flex justify-between mb-1';

    const labelText = document.createElement('span');
    labelText.className = 'text-xs font-medium text-gray-700';
    labelText.textContent = 'Progress';

    const labelValue = document.createElement('span');
    labelValue.className = 'text-xs font-medium text-primary-600';
    labelValue.textContent = `${Math.round(value)}%`;

    labelContainer.appendChild(labelText);
    labelContainer.appendChild(labelValue);
    container.appendChild(labelContainer);
  }

  const track = document.createElement('div');
  track.className = `w-full ${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden`;

  const fill = document.createElement('div');
  fill.className = `${sizeClasses[size]} rounded-full transition-all duration-300`;
  fill.style.width = `${Math.min(100, Math.max(0, value))}%`;

  // Apply gradient or animation
  if (animated) {
    fill.style.background =
      'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)';
    fill.style.backgroundSize = '200% 100%';
    fill.style.animation = 'progressShine 2s linear infinite';
  } else {
    fill.style.background = 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)';
  }

  track.appendChild(fill);
  container.appendChild(track);

  // Expose update method
  container.progress = {
    setValue: newValue => {
      const clampedValue = Math.min(100, Math.max(0, newValue));
      fill.style.width = `${clampedValue}%`;
      container.setAttribute('aria-valuenow', clampedValue);
      if (showLabel) {
        container.querySelector('.text-primary-600').textContent =
          `${Math.round(clampedValue)}%`;
      }
    }
  };

  return container;
}

/**
 * Create an empty state placeholder
 * @param {Object} options - Empty state options
 * @param {string} options.icon - Emoji or icon
 * @param {string} options.title - Title text
 * @param {string} [options.description] - Description text
 * @param {Object} [options.action] - Action button config
 * @param {string} [options.action.text] - Button text
 * @param {Function} [options.action.onClick] - Click handler
 * @returns {HTMLElement} The empty state element
 */
export function createEmptyState({ icon, title, description, action }) {
  const container = document.createElement('div');
  container.className =
    'flex flex-col items-center justify-center py-8 px-4 text-center';

  const iconEl = document.createElement('div');
  iconEl.className = 'text-4xl mb-3 opacity-60';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = icon;
  container.appendChild(iconEl);

  const titleEl = document.createElement('h3');
  titleEl.className = 'text-base font-semibold text-gray-700 mb-1';
  titleEl.textContent = title;
  container.appendChild(titleEl);

  if (description) {
    const descEl = document.createElement('p');
    descEl.className = 'text-sm text-gray-500 max-w-xs';
    descEl.textContent = description;
    container.appendChild(descEl);
  }

  if (action) {
    const actionContainer = document.createElement('div');
    actionContainer.className = 'mt-4';

    const button = document.createElement('button');
    button.className =
      'px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors';
    button.textContent = action.text;
    if (action.onClick) {
      button.addEventListener('click', action.onClick);
    }

    actionContainer.appendChild(button);
    container.appendChild(actionContainer);
  }

  return container;
}
