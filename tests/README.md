# Tests Directory

This directory contains all test files for the Chrome Currency Converter Extension.

## Structure

### `/tests/settings/`

Contains tests related to settings management, persistence, and the popup UI:

- `test-chrome-mock.js` - Mock Chrome storage tests
- `test-comprehensive.js` - Comprehensive settings persistence tests
- `test-popup-settings.js` - Popup settings UI tests
- `test-popup-workflow.js` - Popup workflow integration tests
- `test-settings-fix.js` - Settings bug fix verification tests
- `test-settings-persistence.js` - Settings persistence validation tests

### `/tests/api/`

Contains tests for API integration and configuration:

- `test-api-config.js` - API configuration tests
- `test-api-integration.js` - External API integration tests

### `/tests/currency/`

Contains tests for currency detection, data management, and context menu functionality:

- `test-context-menu.js` - Context menu functionality tests
- `test-currency-data-management.js` - Currency data handling tests
- `test-currency-detection.js` - Currency detection algorithm tests

## Running Tests

Most test files can be run with Node.js:

```bash
# Run individual test
node tests/settings/test-comprehensive.js

# Run all settings tests
for file in tests/settings/*.js; do node "$file"; done
```

Some tests require Chrome extension environment or specific setup. Check individual test files for requirements.

## Test Categories

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **Mock Tests**: Test with simulated Chrome APIs
- **Persistence Tests**: Test data storage and retrieval
- **UI Tests**: Test popup interface behavior
