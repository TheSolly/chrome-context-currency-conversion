/**
 * KeyboardShortcuts Component
 * Phase 7: UI/UX Improvements - Keyboard shortcut hints and handlers
 */

/**
 * Keyboard shortcut configurations
 */
export const SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, label: 'Save', display: 'Ctrl+S' },
  RESET: { key: 'r', ctrl: true, label: 'Reset', display: 'Ctrl+R' },
  SEARCH: { key: 'k', ctrl: true, label: 'Search', display: 'Ctrl+K' },
  CONVERT: { key: 'Enter', ctrl: false, label: 'Convert', display: 'Enter' },
  ESCAPE: { key: 'Escape', ctrl: false, label: 'Close', display: 'Esc' },
  TAB_NEXT: { key: 'Tab', ctrl: false, label: 'Next Tab', display: 'Tab' },
  TAB_PREV: {
    key: 'Tab',
    ctrl: false,
    shift: true,
    label: 'Prev Tab',
    display: 'Shift+Tab'
  }
};

/**
 * Platform detection for keyboard hint display
 */
/* global navigator */
const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Get platform-specific key display
 * @param {string} key - Key name
 * @returns {string} Platform-specific display
 */
function getPlatformKey(key) {
  if (isMac) {
    return key
      .replace('Ctrl', '⌘')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧')
      .replace('Enter', '↵')
      .replace('Escape', '⎋')
      .replace('Tab', '⇥');
  }
  return key;
}

/**
 * Create a keyboard key badge element
 * @param {string} key - Key to display
 * @returns {HTMLElement} The kbd element
 */
export function createKbd(key) {
  const kbd = document.createElement('kbd');
  kbd.className =
    'inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-600';
  kbd.style.boxShadow = '0 1px 0 1px #d1d5db';
  kbd.textContent = getPlatformKey(key);
  return kbd;
}

/**
 * Create a shortcut hint element
 * @param {Object} options - Hint options
 * @param {string} options.shortcut - Shortcut display string (e.g., 'Ctrl+S')
 * @param {string} [options.label] - Optional label
 * @returns {HTMLElement} The shortcut hint element
 */
export function createShortcutHint({ shortcut, label }) {
  const container = document.createElement('span');
  container.className = 'inline-flex items-center gap-1 text-xs text-gray-500';

  if (label) {
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  // Split shortcut by + and create kbd elements
  const keys = shortcut.split('+');
  keys.forEach((key, index) => {
    container.appendChild(createKbd(key.trim()));
    if (index < keys.length - 1) {
      const plus = document.createElement('span');
      plus.className = 'text-gray-400 mx-0.5';
      plus.textContent = '+';
      container.appendChild(plus);
    }
  });

  return container;
}

/**
 * Create a button with keyboard shortcut hint
 * @param {Object} options - Button options
 * @param {string} options.text - Button text
 * @param {string} options.shortcut - Keyboard shortcut (e.g., 'Ctrl+S')
 * @param {Function} options.onClick - Click handler
 * @param {string} [options.variant='primary'] - Button variant
 * @param {string} [options.id] - Button ID
 * @returns {HTMLElement} The button element
 */
export function createButtonWithShortcut({
  text,
  shortcut,
  onClick,
  variant = 'primary',
  id
}) {
  const button = document.createElement('button');
  if (id) button.id = id;

  const variants = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary:
      'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  button.className = `
    inline-flex items-center justify-center gap-2 px-4 py-2
    rounded-lg font-medium text-sm transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${variants[variant] || variants.primary}
  `
    .trim()
    .replace(/\s+/g, ' ');

  // Button text
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  button.appendChild(textSpan);

  // Shortcut hint (visible on hover or always)
  if (shortcut) {
    const hint = createKbd(getPlatformKey(shortcut));
    hint.className += ' ml-2 opacity-60';
    button.appendChild(hint);

    // Add title for accessibility
    button.title = `${text} (${getPlatformKey(shortcut)})`;
  }

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}

/**
 * Create a keyboard shortcuts panel/legend
 * @param {Array} shortcuts - Array of shortcut configs
 * @returns {HTMLElement} The shortcuts panel element
 */
export function createShortcutsLegend(shortcuts) {
  const container = document.createElement('div');
  container.className =
    'bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm';

  const title = document.createElement('h4');
  title.className = 'font-semibold text-gray-700 mb-2 flex items-center gap-2';
  title.innerHTML = '<span>⌨️</span> Keyboard Shortcuts';
  container.appendChild(title);

  const list = document.createElement('div');
  list.className = 'space-y-1';

  shortcuts.forEach(({ label, shortcut }) => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between';

    const labelEl = document.createElement('span');
    labelEl.className = 'text-gray-600';
    labelEl.textContent = label;

    const shortcutEl = createShortcutHint({ shortcut });

    item.appendChild(labelEl);
    item.appendChild(shortcutEl);
    list.appendChild(item);
  });

  container.appendChild(list);
  return container;
}

/**
 * Register keyboard shortcuts globally
 * @param {Object} handlers - Map of shortcut names to handlers
 * @returns {Function} Cleanup function to remove listeners
 */
export function registerKeyboardShortcuts(handlers) {
  const handleKeydown = event => {
    // Check for Ctrl+S (Save)
    if (event.ctrlKey && event.key === 's' && handlers.save) {
      event.preventDefault();
      handlers.save();
      return;
    }

    // Check for Ctrl+K (Search/Focus)
    if (event.ctrlKey && event.key === 'k' && handlers.search) {
      event.preventDefault();
      handlers.search();
      return;
    }

    // Check for Escape
    if (event.key === 'Escape' && handlers.escape) {
      handlers.escape();
      return;
    }

    // Check for Enter (when not in textarea/input)
    if (
      event.key === 'Enter' &&
      !event.target.matches('input, textarea, select') &&
      handlers.enter
    ) {
      handlers.enter();
      return;
    }

    // Tab navigation between tabs
    if (event.key >= '1' && event.key <= '5' && event.altKey && handlers.tab) {
      event.preventDefault();
      handlers.tab(parseInt(event.key) - 1);
      return;
    }
  };

  document.addEventListener('keydown', handleKeydown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeydown);
  };
}

/**
 * Add inline shortcut hint to an existing element
 * @param {HTMLElement} element - Element to add hint to
 * @param {string} shortcut - Shortcut display string
 */
export function addShortcutHint(element, shortcut) {
  const hint = createShortcutHint({ shortcut });
  hint.className += ' ml-2';

  // Find the best place to insert
  if (element.tagName === 'BUTTON') {
    element.appendChild(hint);
  } else {
    element.style.position = 'relative';
    hint.style.position = 'absolute';
    hint.style.right = '8px';
    hint.style.top = '50%';
    hint.style.transform = 'translateY(-50%)';
    element.appendChild(hint);
  }
}
