# Debug Directory

This directory contains debug scripts and tools for troubleshooting the Chrome Currency Converter Extension.

## Structure

### `/debug/settings/`

Contains debug scripts for settings-related issues:

- `debug-chrome-console.js` - Script to run in Chrome extension console for storage debugging
- `debug-currency-settings.js` - Debug script for currency setting persistence issues
- `debug-first-write.js` - Debug script for investigating first write persistence bug
- `debug-persistent-mock.js` - Debug script with persistent mock Chrome storage
- `debug-timing.js` - Debug script for initialization timing issues

### `/debug/currency/`

Contains debug scripts for currency detection and processing:

- `debug-full.js` - Full currency detection debugging
- `debug-regex.js` - Regular expression pattern debugging
- `debug-suffix.js` - Currency suffix detection debugging
- `debug-symbol.js` - Currency symbol detection debugging

## Usage

### For Settings Issues

1. **Chrome Extension Console Debug**:

   ```javascript
   // Copy and paste debug-chrome-console.js into Chrome extension popup console
   ```

2. **Node.js Debug Scripts**:

   ```bash
   # Debug settings persistence
   node debug/settings/debug-comprehensive.js

   # Debug timing issues
   node debug/settings/debug-timing.js
   ```

### For Currency Detection Issues

```bash
# Debug currency regex patterns
node debug/currency/debug-regex.js

# Debug currency symbols
node debug/currency/debug-symbol.js
```

## Debug Categories

- **Storage Debugging**: Chrome storage API issues and persistence problems
- **Timing Debugging**: Initialization and async operation timing
- **Pattern Debugging**: Currency detection regex and parsing
- **Mock Debugging**: Testing with simulated Chrome environment
- **Console Debugging**: Scripts designed to run in browser developer console

## Tips

- Use Chrome DevTools console for real-time debugging
- Check browser console for error messages when testing
- Most debug scripts include verbose logging for troubleshooting
- Mock scripts simulate Chrome environment for testing outside browser
