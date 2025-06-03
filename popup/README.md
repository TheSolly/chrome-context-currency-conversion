# Popup Module Structure

The popup functionality has been refactored into a modular architecture for better maintainability and organization.

## File Structure

```
popup/
├── popup.html                 # Main HTML entry point
├── popup-main.js              # Main initialization and coordination
├── popup.js                   # Legacy file (redirects to new structure)
├── popup.js.backup            # Backup of original monolithic file
├── popup.css                  # Styles
├── styles.css                 # Additional styles
└── tabs/                      # Tab modules directory
    ├── tab-manager.js         # Tab navigation and coordination
    ├── settings-tab.js        # Settings functionality
    ├── history-tab.js         # History functionality
    ├── favorites-tab.js       # Favorites functionality
    ├── alerts-tab.js          # Alerts functionality
    └── subscription-tab.js    # Subscription functionality
```

## Module Responsibilities

### popup-main.js

- Entry point for the application
- Initializes services (settings, API, accessibility, subscription)
- Creates and coordinates tab manager
- Sets up global event listeners
- Handles popup lifecycle

### tabs/tab-manager.js

- Manages tab navigation and switching
- Coordinates communication between tabs
- Propagates global events to all tabs
- Handles tab initialization and cleanup

### tabs/settings-tab.js

- Currency selection and configuration
- Settings import/export
- Currency preferences and favorites
- Settings validation and persistence

### tabs/history-tab.js

- Conversion history display and management
- History filtering and search
- History export functionality
- Popular currency pairs analysis

### tabs/favorites-tab.js

- Favorite currency pairs management
- Quick conversion functionality
- Favorites organization and labeling

### tabs/alerts-tab.js

- Rate alerts creation and management
- Alert notifications and settings
- Alert history and trend analysis

### tabs/subscription-tab.js

- Subscription plan management
- Usage tracking and display
- Payment provider integration
- Feature access control

## Benefits of Modularization

1. **Maintainability**: Each tab's functionality is isolated and easier to maintain
2. **Testability**: Individual modules can be tested independently
3. **Reusability**: Tab modules can be reused in different contexts
4. **Performance**: Lazy loading capabilities (can be implemented later)
5. **Collaboration**: Multiple developers can work on different tabs simultaneously
6. **Code Organization**: Related functionality is grouped together

## Global Communication

Tabs communicate through the TabManager using a standardized event system:

```javascript
// Emit global event
this.tabManager.emitGlobalEvent('settingsChanged', { newSettings });

// Handle global event in tab
handleGlobalEvent(eventType, data) {
  switch (eventType) {
    case 'settingsChanged':
      this.updateUI(data.newSettings);
      break;
  }
}
```

## Migration Notes

- The original `popup.js` (3000+ lines) has been split into 7 focused modules
- HTML entry point updated to load `popup-main.js` instead of `popup.js`
- All functionality preserved with improved organization
- Original file backed up as `popup.js.backup`
- Legacy `popup.js` now contains redirect logic for safety
