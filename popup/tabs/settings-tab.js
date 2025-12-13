/**
 * Settings Tab - Re-exports from modular structure
 *
 * The settings functionality has been decomposed into smaller, focused modules:
 * - settings/currency-config.js - Currency selection and management
 * - settings/preferences.js - Toggle switches and preferences
 * - settings/test-conversion.js - Test conversion functionality
 * - settings/security-settings.js - Security features
 * - settings/privacy-settings.js - GDPR/privacy compliance
 * - settings/index.js - Main coordinator (SettingsTab class)
 */

// Re-export the main SettingsTab class for backwards compatibility
export { SettingsTab } from './settings/index.js';

// Also export individual modules for direct use
export * from './settings/currency-config.js';
export * from './settings/preferences.js';
export * from './settings/test-conversion.js';
export * from './settings/security-settings.js';
export * from './settings/privacy-settings.js';
