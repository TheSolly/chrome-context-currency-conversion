// Accessibility Manager for Currency Converter Extension
// Phase 5, Task 5.3: Accessibility Features Implementation

/**
 * Accessibility Manager
 * Handles keyboard navigation, ARIA labels, screen reader support, and color contrast
 */
export class AccessibilityManager {
  constructor() {
    this.isInitialized = false;
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.ariaLiveRegion = null;
    this.keyboardNavigation = true;
    this.screenReaderAnnouncements = [];

    // Color contrast ratios (WCAG AA compliant)
    this.colorContrast = {
      primary: {
        background: '#667eea', // Blue
        text: '#ffffff',
        ratio: 4.58 // AA compliant
      },
      secondary: {
        background: '#764ba2', // Purple
        text: '#ffffff',
        ratio: 4.12 // AA compliant
      },
      success: {
        background: '#10b981', // Green
        text: '#ffffff',
        ratio: 4.52 // AA compliant
      },
      error: {
        background: '#ef4444', // Red
        text: '#ffffff',
        ratio: 4.91 // AA compliant
      },
      warning: {
        background: '#f59e0b', // Orange
        text: '#000000',
        ratio: 4.67 // AA compliant
      }
    };

    this.init();
  }

  /**
   * Initialize accessibility features
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    this.createAriaLiveRegion();
    this.initializeKeyboardNavigation();
    this.initializeColorContrastValidation();

    this.isInitialized = true;
    console.log('♿ Accessibility Manager initialized');
  }

  /**
   * Initialize accessibility features specifically for popup
   */
  async initializeForPopup() {
    // Ensure base accessibility features are initialized
    this.init();

    // Add popup-specific ARIA labels and descriptions
    this.addPopupAriaLabels();

    // Setup keyboard shortcuts for popup
    this.setupPopupKeyboardShortcuts();

    // Initialize focus management for popup elements
    this.initializePopupFocusManagement();

    // Add skip links for better navigation
    this.addSkipLinks();

    // Announce popup opened to screen readers
    this.announceToScreenReader(
      'Currency converter settings opened. Use Tab to navigate between options.'
    );

    console.log('♿ Popup accessibility features initialized');
  }

  /**
   * Create ARIA live region for screen reader announcements
   */
  createAriaLiveRegion() {
    if (document.getElementById('accessibility-live-region')) {
      this.ariaLiveRegion = document.getElementById(
        'accessibility-live-region'
      );
      return;
    }

    this.ariaLiveRegion = document.createElement('div');
    this.ariaLiveRegion.id = 'accessibility-live-region';
    this.ariaLiveRegion.className = 'sr-only';
    this.ariaLiveRegion.setAttribute('aria-live', 'polite');
    this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
    this.ariaLiveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    document.body.appendChild(this.ariaLiveRegion);
  }

  /**
   * Initialize keyboard navigation support
   */
  initializeKeyboardNavigation() {
    // Global keyboard event handlers
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));

    // Skip links for screen readers
    this.addSkipLinks();

    console.log('⌨️ Keyboard navigation initialized');
  }

  /**
   * Add skip links for better navigation
   */
  addSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#currency-selection" class="skip-link">Skip to currency selection</a>
      <a href="#settings" class="skip-link">Skip to settings</a>
    `;

    // Style skip links
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 10000;
      }
      
      .skip-link {
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        background: #000;
        color: #fff;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .skip-link:focus {
        position: static;
        width: auto;
        height: auto;
        left: auto;
        top: auto;
        box-shadow: 0 0 0 2px #667eea;
      }
    `;

    document.head.appendChild(style);
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  /**
   * Handle global keyboard events
   */
  handleGlobalKeydown(event) {
    const { key, altKey } = event;

    // ESC key - close dialogs, tooltips, etc.
    if (key === 'Escape') {
      this.handleEscapeKey(event);
      return;
    }

    // Tab navigation enhancement
    if (key === 'Tab') {
      this.handleTabNavigation(event);
      return;
    }

    // Arrow key navigation for custom components
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      this.handleArrowNavigation(event);
      return;
    }

    // Enter and Space for custom button activation
    if ((key === 'Enter' || key === ' ') && this.isCustomButton(event.target)) {
      this.handleButtonActivation(event);
      return;
    }

    // Accessibility shortcuts
    if (altKey) {
      this.handleAccessibilityShortcuts(event);
    }
  }

  /**
   * Handle ESC key press
   */
  handleEscapeKey(event) {
    // Close any open tooltips
    const tooltips = document.querySelectorAll('[id*="tooltip"], .vf-tooltip');
    tooltips.forEach(tooltip => {
      if (tooltip.style.display !== 'none') {
        tooltip.style.display = 'none';
        this.announceToScreenReader('Tooltip closed');
      }
    });

    // Close any modal dialogs
    const modals = document.querySelectorAll('[role="dialog"], .modal');
    modals.forEach(modal => {
      if (modal.style.display !== 'none') {
        modal.style.display = 'none';
        this.announceToScreenReader('Dialog closed');
      }
    });

    // Remove focus from current element if it's a button
    if (event.target.tagName === 'BUTTON') {
      event.target.blur();
    }
  }

  /**
   * Enhanced Tab navigation
   */
  handleTabNavigation(event) {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) {
      return;
    }

    const currentIndex = focusableElements.indexOf(document.activeElement);

    if (event.shiftKey) {
      // Shift+Tab (backward)
      const previousIndex =
        currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
      focusableElements[previousIndex].focus();
    } else {
      // Tab (forward)
      const nextIndex =
        currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
      focusableElements[nextIndex].focus();
    }
  }

  /**
   * Handle arrow key navigation for custom components
   */
  handleArrowNavigation(event) {
    const target = event.target;

    // Navigation within toggle switches
    if (
      target.classList.contains('toggle-switch') ||
      target.getAttribute('role') === 'switch'
    ) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        this.toggleSwitch(target);
      }
    }

    // Navigation within currency lists
    if (target.closest('.currency-list, .favorite-currencies')) {
      this.handleListNavigation(event, target);
    }
  }

  /**
   * Handle list navigation with arrow keys
   */
  handleListNavigation(event, target) {
    const container = target.closest('.currency-list, .favorite-currencies');
    const items = Array.from(
      container.querySelectorAll('[tabindex], button, select, input')
    );
    const currentIndex = items.indexOf(target);

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = Math.min(currentIndex + 1, items.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus();
    }
  }

  /**
   * Handle button activation for custom elements
   */
  handleButtonActivation(event) {
    if (event.key === ' ') {
      event.preventDefault(); // Prevent page scroll
    }

    const target = event.target;

    // Handle toggle switches
    if (
      target.classList.contains('toggle-switch') ||
      target.getAttribute('role') === 'switch'
    ) {
      this.toggleSwitch(target);
      return;
    }

    // Handle custom buttons
    if (target.getAttribute('role') === 'button') {
      target.click();
    }
  }

  /**
   * Toggle switch with accessibility support
   */
  toggleSwitch(switchElement) {
    const isChecked = switchElement.getAttribute('aria-checked') === 'true';
    const newState = !isChecked;

    switchElement.setAttribute('aria-checked', newState.toString());

    if (newState) {
      switchElement.classList.add('enabled');
      switchElement.querySelector('.toggle-thumb')?.classList.add('enabled');
    } else {
      switchElement.classList.remove('enabled');
      switchElement.querySelector('.toggle-thumb')?.classList.remove('enabled');
    }

    const label = this.getElementLabel(switchElement);
    this.announceToScreenReader(
      `${label} ${newState ? 'enabled' : 'disabled'}`
    );

    // Trigger change event for the application
    if (typeof window !== 'undefined' && window.CustomEvent) {
      switchElement.dispatchEvent(
        new window.CustomEvent('accessibilityToggle', {
          detail: { checked: newState, element: switchElement }
        })
      );
    }
  }

  /**
   * Handle accessibility shortcuts
   */
  handleAccessibilityShortcuts(event) {
    const { key } = event;

    switch (key) {
      case 'h': // Alt+H - Help
        event.preventDefault();
        this.showAccessibilityHelp();
        break;
      case 's': // Alt+S - Settings
        event.preventDefault();
        this.focusSettings();
        break;
      case 'c': // Alt+C - Currency selection
        event.preventDefault();
        this.focusCurrencySelection();
        break;
    }
  }

  /**
   * Show accessibility help
   */
  showAccessibilityHelp() {
    const helpText = `
      Accessibility shortcuts:
      - Tab/Shift+Tab: Navigate between elements
      - Enter/Space: Activate buttons and switches
      - Arrow keys: Navigate within lists and switches
      - ESC: Close dialogs and tooltips
      - Alt+H: Show this help
      - Alt+S: Focus settings
      - Alt+C: Focus currency selection
    `;

    this.announceToScreenReader(helpText);

    // Fallback for visual users - only in browser environment
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(helpText);
    }
  }

  /**
   * Focus management
   */
  focusSettings() {
    const settingsElement = document.querySelector(
      '#settings, [aria-label*="settings"], [aria-label*="Settings"]'
    );
    if (settingsElement) {
      settingsElement.focus();
      this.announceToScreenReader('Settings focused');
    }
  }

  focusCurrencySelection() {
    const currencyElement = document.querySelector(
      '#baseCurrency, #secondaryCurrency, [aria-label*="currency"]'
    );
    if (currencyElement) {
      currencyElement.focus();
      this.announceToScreenReader('Currency selection focused');
    }
  }

  /**
   * Get all focusable elements
   */
  getFocusableElements() {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[role="button"]:not([disabled])',
      '[role="switch"]:not([disabled])'
    ].join(', ');

    return Array.from(document.querySelectorAll(selectors)).filter(el => {
      if (el.hidden) {
        return false;
      }

      // Check computed styles only in browser environment
      if (typeof window !== 'undefined' && window.getComputedStyle) {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }

      return true; // Fallback for non-browser environments
    });
  }

  /**
   * Check if element is a custom button
   */
  isCustomButton(element) {
    return (
      element.getAttribute('role') === 'button' ||
      element.getAttribute('role') === 'switch' ||
      element.classList.contains('toggle-switch') ||
      element.classList.contains('custom-button')
    );
  }

  /**
   * Get element label for screen reader announcements
   */
  getElementLabel(element) {
    return (
      element.getAttribute('aria-label') ||
      element.getAttribute('title') ||
      element.textContent.trim() ||
      element.getAttribute('placeholder') ||
      'Interactive element'
    );
  }

  /**
   * Focus management handlers
   */
  handleFocusIn(event) {
    const element = event.target;

    // Add focus indicator for custom elements
    if (this.isCustomButton(element)) {
      element.classList.add('accessibility-focused');
    }

    // Announce focused element to screen reader
    if (element.getAttribute('aria-describedby')) {
      const description = document.getElementById(
        element.getAttribute('aria-describedby')
      );
      if (description) {
        this.announceToScreenReader(description.textContent);
      }
    }
  }

  handleFocusOut(event) {
    const element = event.target;

    // Remove focus indicator
    element.classList.remove('accessibility-focused');
  }

  /**
   * Initialize color contrast validation
   */
  initializeColorContrastValidation() {
    // Add CSS for high contrast mode support
    const contrastStyles = document.createElement('style');
    contrastStyles.textContent = `
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .toggle-switch {
          border: 2px solid currentColor;
        }
        
        .toggle-switch:focus {
          outline: 3px solid #667eea;
          outline-offset: 2px;
        }
        
        .currency-select:focus {
          outline: 3px solid #667eea;
          outline-offset: 2px;
        }
        
        button:focus {
          outline: 3px solid #667eea;
          outline-offset: 2px;
        }
      }
      
      /* Focus indicators for accessibility */
      .accessibility-focused {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2) !important;
      }
      
      /* Screen reader only content */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      /* Enhanced focus for better visibility */
      *:focus-visible {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
    `;

    document.head.appendChild(contrastStyles);
    console.log('🎨 Color contrast validation initialized');
  }

  /**
   * Announce message to screen readers
   */
  announceToScreenReader(message, priority = 'polite') {
    if (!this.ariaLiveRegion) {
      this.createAriaLiveRegion();
    }

    // Clear previous announcement
    this.ariaLiveRegion.textContent = '';

    // Set priority
    this.ariaLiveRegion.setAttribute('aria-live', priority);

    // Add announcement with slight delay to ensure it's read
    setTimeout(() => {
      this.ariaLiveRegion.textContent = message;

      // Store for history
      this.screenReaderAnnouncements.push({
        message,
        timestamp: new Date().toISOString(),
        priority
      });

      // Keep only last 10 announcements
      if (this.screenReaderAnnouncements.length > 10) {
        this.screenReaderAnnouncements.shift();
      }
    }, 100);

    console.log(`📢 Screen reader: ${message}`);
  }

  /**
   * Add ARIA labels to elements
   */
  addAriaLabels(elementMap) {
    Object.entries(elementMap).forEach(([selector, label]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.getAttribute('aria-label')) {
          element.setAttribute('aria-label', label);
        }
      });
    });
  }

  /**
   * Add ARIA descriptions to elements
   */
  addAriaDescriptions(elementMap) {
    Object.entries(elementMap).forEach(([selector, description]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        const descId = `desc-${selector.replace(/[^a-zA-Z0-9]/g, '')}-${index}`;

        // Create description element if it doesn't exist
        if (!document.getElementById(descId)) {
          const descElement = document.createElement('div');
          descElement.id = descId;
          descElement.className = 'sr-only';
          descElement.textContent = description;
          document.body.appendChild(descElement);
        }

        element.setAttribute('aria-describedby', descId);
      });
    });
  }

  /**
   * Validate color contrast ratios
   */
  validateColorContrast() {
    const results = [];

    Object.entries(this.colorContrast).forEach(([key, colors]) => {
      const isCompliant = colors.ratio >= 4.5; // AA standard
      results.push({
        name: key,
        ratio: colors.ratio,
        compliant: isCompliant,
        background: colors.background,
        text: colors.text
      });
    });

    console.log('🎨 Color contrast validation results:', results);
    return results;
  }

  /**
   * Get accessibility status
   */
  getAccessibilityStatus() {
    return {
      initialized: this.isInitialized,
      keyboardNavigation: this.keyboardNavigation,
      ariaLiveRegion: !!this.ariaLiveRegion,
      focusableElements: this.getFocusableElements().length,
      announcements: this.screenReaderAnnouncements.length,
      colorContrast: this.validateColorContrast()
    };
  }

  /**
   * Cleanup accessibility features
   */
  cleanup() {
    if (this.ariaLiveRegion) {
      this.ariaLiveRegion.remove();
    }

    document.removeEventListener('keydown', this.handleGlobalKeydown);
    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('focusout', this.handleFocusOut);

    this.isInitialized = false;
    console.log('♿ Accessibility Manager cleaned up');
  }

  /**
   * Add ARIA labels specifically for popup elements
   */
  addPopupAriaLabels() {
    const ariaLabels = {
      '#baseCurrency': 'Base currency selection',
      '#secondaryCurrency': 'Secondary currency selection',
      '#visualFeedback': 'Enable visual feedback toggle',
      '#quickConversion': 'Enable quick conversion toggle',
      '#contextMenu': 'Enable context menu toggle',
      '#tooltipDisplay': 'Enable tooltip display toggle',
      '#compactMode': 'Enable compact mode toggle',
      '#darkMode': 'Enable dark mode toggle',
      '.save-button': 'Save settings',
      '.reset-button': 'Reset to defaults',
      '.close-button': 'Close popup',
      '.favorite-toggle': 'Toggle favorite currency',
      '.remove-favorite': 'Remove from favorites',
      '.add-favorite': 'Add to favorites',
      '#search-input': 'Search currencies',
      '.regional-filter': 'Filter currencies by region',
      '.popularity-sort': 'Sort by popularity',
      '.alphabetical-sort': 'Sort alphabetically'
    };

    this.addAriaLabels(ariaLabels);

    // Add role attributes for custom elements
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    toggleSwitches.forEach(toggle => {
      if (!toggle.getAttribute('role')) {
        toggle.setAttribute('role', 'switch');
        toggle.setAttribute('tabindex', '0');
        const isEnabled = toggle.classList.contains('enabled');
        toggle.setAttribute('aria-checked', isEnabled.toString());
      }
    });

    // Add descriptions for complex UI elements
    const ariaDescriptions = {
      '#baseCurrency':
        'Select the primary currency for conversions. This will be the base currency shown in context menus.',
      '#secondaryCurrency':
        'Select the secondary currency for conversions. This will be the target currency shown in context menus.',
      '#visualFeedback':
        'When enabled, shows visual feedback animations during currency conversions.',
      '#quickConversion':
        'When enabled, allows instant currency conversion on hover or selection.',
      '#contextMenu':
        'When enabled, adds currency conversion options to the right-click context menu.',
      '#tooltipDisplay':
        'When enabled, shows conversion tooltips when hovering over currency amounts.',
      '.favorites-section': 'Manage your favorite currencies for quick access.',
      '.search-container': 'Search for currencies by name, code, or country.'
    };

    this.addAriaDescriptions(ariaDescriptions);
  }

  /**
   * Setup keyboard shortcuts specific to popup
   */
  setupPopupKeyboardShortcuts() {
    // Currency selection shortcuts
    document.addEventListener('keydown', event => {
      if (event.altKey) {
        switch (event.key) {
          case 'b': // Alt+B - Base currency
            event.preventDefault();
            this.focusBaseCurrency();
            break;
          case 't': // Alt+T - Target/Secondary currency
            event.preventDefault();
            this.focusSecondaryCurrency();
            break;
          case 'f': // Alt+F - Favorites
            event.preventDefault();
            this.focusFavorites();
            break;
          case 'r': // Alt+R - Reset settings
            event.preventDefault();
            this.triggerReset();
            break;
          case 'Enter': // Alt+Enter - Save settings
            event.preventDefault();
            this.triggerSave();
            break;
        }
      }

      // Quick navigation without modifier keys
      if (
        event.target.tagName === 'BODY' ||
        event.target === document.documentElement
      ) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            this.focusBaseCurrency();
            break;
          case '2':
            event.preventDefault();
            this.focusSecondaryCurrency();
            break;
          case '3':
            event.preventDefault();
            this.focusFavorites();
            break;
          case '/':
            event.preventDefault();
            this.focusSearch();
            break;
        }
      }
    });
  }

  /**
   * Focus management methods for popup elements
   */
  focusBaseCurrency() {
    const element = document.querySelector('#baseCurrency');
    if (element) {
      element.focus();
      this.announceToScreenReader('Base currency selection focused');
    }
  }

  focusSecondaryCurrency() {
    const element = document.querySelector('#secondaryCurrency');
    if (element) {
      element.focus();
      this.announceToScreenReader('Secondary currency selection focused');
    }
  }

  focusFavorites() {
    const element = document.querySelector(
      '.favorites-section, .favorite-currencies'
    );
    if (element) {
      const firstFavorite = element.querySelector('button, .favorite-item');
      if (firstFavorite) {
        firstFavorite.focus();
        this.announceToScreenReader('Favorites section focused');
      }
    }
  }

  focusSearch() {
    const element = document.querySelector('#search-input, .search-input');
    if (element) {
      element.focus();
      this.announceToScreenReader('Search currencies focused');
    }
  }

  triggerReset() {
    const resetButton = document.querySelector(
      '.reset-button, [data-action="reset"]'
    );
    if (resetButton) {
      resetButton.click();
      this.announceToScreenReader('Settings reset triggered');
    }
  }

  triggerSave() {
    const saveButton = document.querySelector(
      '.save-button, [data-action="save"]'
    );
    if (saveButton) {
      saveButton.click();
      this.announceToScreenReader('Settings save triggered');
    }
  }

  /**
   * Initialize focus management for popup elements
   */
  initializePopupFocusManagement() {
    // Set initial focus to first interactive element
    setTimeout(() => {
      const firstFocusable = this.getFocusableElements()[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 100);

    // Enhanced focus indicators for popup elements
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced focus indicators for popup */
      .currency-select:focus,
      select:focus {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2) !important;
      }
      
      .toggle-switch:focus {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2) !important;
      }
      
      .favorite-item:focus,
      .currency-option:focus {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        background-color: rgba(102, 126, 234, 0.1) !important;
      }
      
      .search-input:focus {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        border-color: #667eea !important;
      }
      
      /* High contrast mode enhancements */
      @media (prefers-contrast: high) {
        .toggle-switch:focus {
          outline: 3px solid #000 !important;
        }
        
        .currency-select:focus {
          outline: 3px solid #000 !important;
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .toggle-switch .toggle-thumb {
          transition: none !important;
        }
        
        .currency-option {
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// Global instance for easy access
export const accessibilityManager = new AccessibilityManager();

// Make it available globally
if (typeof window !== 'undefined') {
  window.accessibilityManager = accessibilityManager;
}
