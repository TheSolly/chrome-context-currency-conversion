/**
 * UI Components Barrel File
 * Re-exports all reusable popup components
 */

// Toggle Switch Components
export {
  createToggleSwitch,
  createToggleSwitchWithSubtitle
} from './ToggleSwitch.js';

// Currency Selector Components
export {
  createCurrencySelector,
  createCompactCurrencySelector
} from './CurrencySelector.js';

// Settings Card Components
export {
  createSettingsCard,
  createStatCard,
  createStatItem,
  createPromoCard
} from './SettingsCard.js';

// Status Message & Loading State Components
export {
  STATUS_TYPES,
  createStatusMessage,
  createStatusIndicator,
  createLoadingSpinner,
  showToast,
  // Loading States (Phase 7)
  createSkeletonText,
  createSkeletonCard,
  createSkeletonList,
  createLoadingOverlay,
  createProgressBar,
  createEmptyState
} from './StatusMessage.js';

// Keyboard Shortcuts Components (Phase 7)
export {
  SHORTCUTS,
  createKbd,
  createShortcutHint,
  createButtonWithShortcut,
  createShortcutsLegend,
  registerKeyboardShortcuts,
  addShortcutHint
} from './KeyboardShortcuts.js';
