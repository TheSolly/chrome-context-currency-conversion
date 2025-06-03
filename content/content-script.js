/* eslint-disable quotes */
// Content Script for Currency Converter Extension
// Detects currency amounts in selected text and communicates with background script
// Phase 5, Task 5.2: Enhanced with lazy loading for performance optimization
// Phase 5, Task 5.3: Enhanced with accessibility features

console.log('Currency Converter content script loaded');

// Phase 5, Task 5.3: Accessibility Manager for content script
let accessibilityManager = null;

// Load accessibility manager for content script
(async () => {
  try {
    const accessibilityModule = await import(
      chrome.runtime.getURL('utils/accessibility-manager.js')
    );
    accessibilityManager = new accessibilityModule.AccessibilityManager();

    // Initialize accessibility features for content script
    initializeContentAccessibility();

    console.log('Content script accessibility features initialized');
  } catch (error) {
    console.warn('Failed to load accessibility manager:', error);
  }
})();

// Phase 5, Task 5.1 & 5.2: Initialize Visual Feedback System with lazy loading
let visualFeedback = null;
let lazyLoadFeature = null;
let initializeLazyLoading = null;

// Phase 5, Task 5.2: Load lazy loading system dynamically
(async () => {
  try {
    const lazyLoaderModule = await import(
      chrome.runtime.getURL('utils/lazy-loader.js')
    );
    lazyLoadFeature = lazyLoaderModule.lazyLoadFeature;
    initializeLazyLoading = lazyLoaderModule.initializeLazyLoading;

    // Initialize lazy loading system
    await initializeLazyLoading();
    console.log('Lazy loading system initialized successfully');
  } catch (error) {
    console.warn('Failed to load lazy loading system:', error);
  }
})();

// Load visual feedback system dynamically with enhanced lazy loading
(async () => {
  try {
    // Wait a bit for lazy loader to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    let visualFeedbackModule;
    if (lazyLoadFeature) {
      try {
        // Use lazy loader if available
        visualFeedbackModule = await lazyLoadFeature('VISUAL_FEEDBACK');
        visualFeedback = visualFeedbackModule.visualFeedback;
        console.log(
          'Visual feedback system loaded successfully via lazy loader'
        );
        return; // Exit if successful
      } catch (lazyError) {
        console.warn(
          'Failed to load via lazy loader, trying direct import:',
          lazyError
        );
      }
    }

    // Fallback to direct import if lazy loading failed or isn't available
    visualFeedbackModule = await import(
      chrome.runtime.getURL('utils/visual-feedback.js')
    );
    visualFeedback = visualFeedbackModule.visualFeedback;
    console.log('Visual feedback system loaded successfully via direct import');
  } catch (error) {
    console.warn('All attempts to load visual feedback system failed:', error);
    // Create a fallback object with no-op methods
    visualFeedback = {
      showToast: () => {},
      showLoading: () => null,
      hideLoading: () => {},
      showConversionResult: () => {},
      showTooltipConversionResult: () => {},
      showSuccessAnimation: () => {},
      showErrorAnimation: () => {},
      copyToClipboard: () => Promise.resolve(false),
      initializeStyles: () => {},
      removeExistingTooltip: () => {}
    };
  }
})();

// Phase 6, Task 6.1: Smart Currency Detection - Load smart detector
let smartCurrencyDetector = null;

// Load smart currency detector dynamically
(async () => {
  try {
    const smartDetectorModule = await import(
      chrome.runtime.getURL('utils/smart-currency-detector.js')
    );
    smartCurrencyDetector = smartDetectorModule.smartCurrencyDetector;

    // Make available globally for currency utils
    if (typeof window !== 'undefined') {
      window.smartCurrencyDetector = smartCurrencyDetector;
    }

    console.log('Smart currency detector loaded successfully');
  } catch (error) {
    console.warn('Failed to load smart currency detector:', error);
  }
})();

// Currency patterns for detection - Enhanced for Task 2.1
const CURRENCY_PATTERNS = {
  // Symbol patterns: $100, €50, £75, ¥1000, A$50, C$75, HK$100
  symbols:
    /([A-Z]{0,2}\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿|kr|zł|Kč|Ft|₪|฿|RM|R\$|R|NZ\$|S\$|HK\$)\s*([\d]{1,3}(?:[,.\s]\d{3})*(?:[,.]\d{1,4})?)\b/gi,

  // Suffix symbol patterns: 100$, 50€
  symbolsSuffix:
    /([\d]{1,3}(?:[,.\s]\d{3})*(?:[,.]\d{1,4})?)\s*(\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿|kr|zł|Kč|Ft|₪|฿|RM|R\$|R)\b/gi,

  // Amount with currency code: 100 USD, 50 EUR, 75 GBP, 1,000.50 USD
  codes:
    /([\d]{1,3}(?:[,.\s]\d{3})*(?:[,.]\d{1,4})?)\s*(USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|SEK|NZD|MXN|SGD|HKD|NOK|TRY|ZAR|BRL|INR|KRW|RUB|PLN|CZK|HUF|ILS|THB|PHP|MYR|IDR|VND|DKK|BGN|RON|HRK|UAH|EGP|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP)\b/gi,

  // Currency code with amount: USD 100, EUR 50, GBP 75
  codesFirst:
    /\b(USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|SEK|NZD|MXN|SGD|HKD|NOK|TRY|ZAR|BRL|INR|KRW|RUB|PLN|CZK|HUF|ILS|THB|PHP|MYR|IDR|VND|DKK|BGN|RON|HRK|UAH|EGP|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP)\s*([\d]{1,3}(?:[,.\s]\d{3})*(?:[,.]\d{1,4})?)\b/gi,

  // Formatted amounts with currency words: 100 dollars, 50 euros, 75 pounds
  words:
    /([\d]{1,3}(?:[,.\s]\d{3})*(?:[,.]\d{1,4})?)\s*(dollars?|euros?|pounds?|yen|yuan|pesos?|rupees?|won|rubles?|francs?|krona|krone|zloty|shekel|baht|ringgit|rand)\b/gi,

  // Currency words with amounts: dollars 100, euros 50
  wordsFirst:
    /\b(dollars?|euros?|pounds?|yen|yuan|pesos?|rupees?|won|rubles?|francs?|krona|krone|zloty|shekel|baht|ringgit|rand)\s*([\d]{1,3}(?:[,.\s]\d{3})*(?:[,.]\d{1,4})?)\b/gi
};

// Currency symbol to code mapping - Enhanced for Task 2.1
const SYMBOL_TO_CODE = {
  // USD variants
  $: 'USD',
  US$: 'USD',
  // Australian Dollar
  A$: 'AUD',
  AU$: 'AUD',
  // Canadian Dollar
  C$: 'CAD',
  CA$: 'CAD',
  // New Zealand Dollar
  NZ$: 'NZD',
  // Singapore Dollar
  S$: 'SGD',
  // Hong Kong Dollar
  HK$: 'HKD',
  // European currencies
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY', // Default to JPY, but could be CNY
  // Swiss Franc
  CHF: 'CHF',
  // Nordic currencies
  kr: 'SEK', // Default to SEK, could also be NOK or DKK
  // Other major currencies
  '₹': 'INR',
  '₽': 'RUB',
  '¢': 'USD', // Cents
  '₩': 'KRW',
  '₦': 'NGN',
  '₪': 'ILS',
  '₨': 'PKR',
  '₫': 'VND',
  '₱': 'PHP',
  '₡': 'CRC',
  '₲': 'PYG',
  '₴': 'UAH',
  '₵': 'GHS',
  '₸': 'KZT',
  '₺': 'TRY',
  '₾': 'GEL',
  '₿': 'BTC',
  // Polish Zloty
  zł: 'PLN',
  // Czech Koruna
  Kč: 'CZK',
  // Hungarian Forint
  Ft: 'HUF',
  // Thai Baht
  '฿': 'THB',
  // Malaysian Ringgit
  RM: 'MYR',
  // Brazilian Real
  R$: 'BRL',
  // South African Rand
  R: 'ZAR'
};

// Currency word to code mapping
const WORD_TO_CODE = {
  dollars: 'USD',
  dollar: 'USD',
  euros: 'EUR',
  euro: 'EUR',
  pounds: 'GBP',
  pound: 'GBP',
  yen: 'JPY',
  yuan: 'CNY',
  pesos: 'MXN', // Default to MXN, could be other peso currencies
  peso: 'MXN',
  rupees: 'INR',
  rupee: 'INR',
  won: 'KRW',
  rubles: 'RUB',
  ruble: 'RUB',
  francs: 'CHF', // Default to CHF
  franc: 'CHF',
  krona: 'SEK',
  krone: 'NOK',
  zloty: 'PLN',
  shekel: 'ILS',
  baht: 'THB',
  ringgit: 'MYR',
  rand: 'ZAR'
};

// Enhanced selection tracking and performance optimization - Task 2.2 & Task 5.2
let currentSelection = null;
let lastDetectedCurrency = null;
let selectionTimeout = null;
let isProcessingSelection = false;

// Phase 5, Task 5.2: Enhanced debouncing for rapid selections
const SELECTION_DEBOUNCE_MS = 100; // Reduced for faster response
const RAPID_SELECTION_THRESHOLD = 50; // ms between selections to be considered rapid
let lastSelectionTime = 0;
let rapidSelectionCount = 0;

// Performance monitoring
const performanceMetrics = {
  selectionsProcessed: 0,
  currenciesDetected: 0,
  averageProcessingTime: 0,
  lastProcessingTime: 0
};

// Debug mode for development (can be enabled via console)
window.currencyConverterDebug = false;

// Enhanced logging function
function debugLog(message, data = null) {
  if (window.currencyConverterDebug) {
    console.log(`[Currency Converter Debug] ${message}`, data || '');
  }
}

// Performance tracking
function trackPerformance(startTime, detected) {
  const processingTime = performance.now() - startTime;
  performanceMetrics.selectionsProcessed++;
  performanceMetrics.lastProcessingTime = processingTime;

  if (detected) {
    performanceMetrics.currenciesDetected++;
  }

  // Calculate running average
  performanceMetrics.averageProcessingTime =
    (performanceMetrics.averageProcessingTime *
      (performanceMetrics.selectionsProcessed - 1) +
      processingTime) /
    performanceMetrics.selectionsProcessed;

  debugLog(`Processing time: ${processingTime.toFixed(2)}ms`, {
    detected,
    metrics: performanceMetrics
  });
}

// Get performance statistics (useful for debugging)
window.getCurrencyConverterStats = () => {
  return {
    ...performanceMetrics,
    detectionRate:
      (
        (performanceMetrics.currenciesDetected /
          performanceMetrics.selectionsProcessed) *
        100
      ).toFixed(1) + '%',
    currentSelection,
    lastDetectedCurrency
  };
};

// Enhanced error handling and reporting
function handleError(error, context) {
  console.error(`Currency Converter Error in ${context}:`, error);

  // Send error to background for potential logging/analytics
  sendMessageSafely({
    action: 'reportError',
    error: {
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

// Cleanup function for when the script is unloaded
function cleanup() {
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
  }

  // Remove event listeners
  document.removeEventListener('selectionchange', handleSelectionChange);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('keyup', handleKeyUp);

  // Remove any existing tooltips
  removeExistingTooltip();

  debugLog('Content script cleaned up');
}

// Initialize cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Enhanced initialization
function initialize() {
  debugLog('Currency Converter content script initialized', {
    url: window.location.href,
    timestamp: new Date().toISOString()
  });

  // Test if chrome.runtime is available
  try {
    if (chrome.runtime && chrome.runtime.id) {
      debugLog('Chrome runtime available');
    } else {
      console.warn(
        'Chrome runtime not fully available, some features may not work'
      );
    }
  } catch (error) {
    console.warn('Error checking Chrome runtime:', error);
  }
}

// Initialize when script loads
initialize();

// Listen for text selection changes with enhanced handling
document.addEventListener('selectionchange', handleSelectionChange);
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('keyup', handleKeyUp);

// Enhanced selection change handler with improved debouncing - Task 5.2
function handleSelectionChange() {
  // Prevent multiple simultaneous processing
  if (isProcessingSelection) {
    return;
  }

  const currentTime = performance.now();
  const timeSinceLastSelection = currentTime - lastSelectionTime;

  // Track rapid selections for adaptive debouncing
  if (timeSinceLastSelection < RAPID_SELECTION_THRESHOLD) {
    rapidSelectionCount++;
  } else {
    rapidSelectionCount = 0;
  }

  lastSelectionTime = currentTime;

  // Clear existing timeout for debouncing
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
  }

  // Adaptive debouncing: longer delay for rapid selections
  const debounceDelay =
    rapidSelectionCount > 3 ? SELECTION_DEBOUNCE_MS * 2 : SELECTION_DEBOUNCE_MS;

  // Debounce rapid selection changes
  selectionTimeout = setTimeout(() => {
    processSelectionChange();
  }, debounceDelay);
}

function processSelectionChange() {
  const startTime = performance.now();
  let detected = false;

  try {
    isProcessingSelection = true;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    debugLog('Processing selection', {
      text: selectedText,
      length: selectedText.length
    });

    // Enhanced text validation
    if (!isValidSelection(selectedText)) {
      handleNoValidSelection();
      return;
    }

    // Check if selection actually changed to avoid redundant processing
    if (selectedText === currentSelection) {
      debugLog('Selection unchanged, skipping processing');
      return;
    }

    currentSelection = selectedText;

    // Enhanced currency detection with better error handling
    const currencyInfo = detectCurrencyWithValidation(selectedText);

    if (currencyInfo) {
      detected = true;
      lastDetectedCurrency = currencyInfo;

      debugLog('Currency detected', currencyInfo);

      // Notify background script about currency detection
      sendMessageSafely({
        action: 'updateContextMenu',
        hasCurrency: true,
        currencyInfo: currencyInfo,
        selectedText: selectedText
      });
    } else {
      debugLog('No currency detected in selection');
      handleNoValidSelection();
    }
  } catch (error) {
    handleError(error, 'processSelectionChange');
    handleNoValidSelection();
  } finally {
    isProcessingSelection = false;
    trackPerformance(startTime, detected);
  }
}

// Enhanced validation for selected text
function isValidSelection(text) {
  if (!text || text.length === 0) {
    return false;
  }

  // Ignore very long selections (likely not currency amounts)
  if (text.length > 200) {
    return false;
  }

  // Ignore selections that are just whitespace or punctuation
  if (!/[a-zA-Z0-9]/.test(text)) {
    return false;
  }

  return true;
}

// Handle cases where no valid currency selection is found
function handleNoValidSelection() {
  currentSelection = null;
  lastDetectedCurrency = null;
  sendMessageSafely({
    action: 'updateContextMenu',
    hasCurrency: false
  });
}

// Safe message sending with error handling
function sendMessageSafely(message) {
  try {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(message).catch(error => {
        // Handle cases where background script might not be ready
        console.warn('Failed to send message to background script:', error);
      });
    }
  } catch (error) {
    console.warn('Chrome runtime not available:', error);
  }
}

// Enhanced mouse up handler
function handleMouseUp(event) {
  // Small delay to ensure selection is complete
  setTimeout(() => {
    // Only process if not already processing and not in an input field
    if (!isProcessingSelection && !isInputElement(event.target)) {
      handleSelectionChange();
    }
  }, 10);
}

// Enhanced keyboard handler for better accessibility
function handleKeyUp(event) {
  // Handle keyboard-based text selection (Shift+Arrow keys, Ctrl+A, etc.)
  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    setTimeout(handleSelectionChange, 10);
  }
}

// Check if element is an input field where we shouldn't process selections
function isInputElement(element) {
  const inputTypes = ['input', 'textarea', 'select'];
  return element && inputTypes.includes(element.tagName.toLowerCase());
}

// Enhanced currency detection with validation and edge case handling - Task 2.2
// Phase 6, Task 6.1: Enhanced with Smart Currency Detection
function detectCurrencyWithValidation(text) {
  try {
    // Phase 6, Task 6.1: Use smart currency detector if available
    if (smartCurrencyDetector) {
      console.log('Using smart currency detector for:', text);
      const smartResults = smartCurrencyDetector.detectCurrencies(text);

      if (smartResults && smartResults.length > 0) {
        // Return the highest confidence result with additional metadata
        const bestResult = smartResults[0];
        console.log('Smart detector found currency:', bestResult);

        // Convert to expected format for backward compatibility
        const result = {
          amount: bestResult.amount,
          currency: bestResult.currency,
          originalText: bestResult.originalText,
          confidence: bestResult.confidence,
          type: bestResult.type,
          selectionLength: text.length,
          hasMultipleCurrencies: smartResults.length > 1,
          multipleCurrencies: smartResults.length > 1 ? smartResults : null,
          format: bestResult.type || 'smart'
        };

        return result;
      }
    }

    // Fallback to traditional detection
    console.log('Using traditional currency detection for:', text);

    // Preprocess text to handle common edge cases
    const cleanedText = preprocessText(text);

    // Try standard detection first
    let result = detectCurrency(cleanedText);

    // If no result, try with more aggressive cleaning
    if (!result && text !== cleanedText) {
      const aggressiveClean = aggressiveTextClean(text);
      result = detectCurrency(aggressiveClean);
    }

    // Validate the detected currency
    if (result && validateCurrencyDetection(result, text)) {
      // Add additional metadata for better context menu display
      result.selectionLength = text.length;
      result.hasMultipleCurrencies = detectMultipleCurrencies(text);
      result.confidence = calculateConfidence(result, text);
      return result;
    }

    return null;
  } catch (error) {
    console.warn('Error in currency detection:', error);
    return null;
  }
}

// Preprocess text to handle common formatting issues
function preprocessText(text) {
  return (
    text
      // Normalize different types of spaces
      .replace(
        /[\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u200B\u202F\u205F\u3000]/g,
        ' '
      )
      // Normalize different types of dashes
      .replace(/[\u2013\u2014\u2015]/g, '-')
      // Remove zero-width characters
      .replace(/\u200B/g, '')
      .replace(/\u200C/g, '')
      .replace(/\u200D/g, '')
      .replace(/\uFEFF/g, '')
      // Normalize quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, "'")
      .trim()
  );
}

// More aggressive text cleaning for edge cases
function aggressiveTextClean(text) {
  return (
    text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove common punctuation that might interfere
      .replace(/[()[\]{}]/g, '')
      // Keep only currency-relevant characters
      .replace(/[^\w\s$€£¥₹₽¢₩₦₪₨₫₱₡₲₴₵₸₺₾₿.,-]/g, ' ')
      .trim()
  );
}

// Validate that the detected currency makes sense in context
function validateCurrencyDetection(detection, originalText) {
  // Check if amount is reasonable (not too small or too large)
  if (detection.amount < 0.01 || detection.amount > 999999999) {
    return false;
  }

  // Check if the original text length is reasonable
  if (originalText.length > 100) {
    return false;
  }

  // Ensure the detected text is a reasonable portion of the selection
  const ratio = detection.originalText.length / originalText.length;
  if (ratio < 0.2) {
    return false;
  }

  return true;
}

// Detect if text contains multiple currencies (affects confidence)
function detectMultipleCurrencies(text) {
  const currencyMatches = [];

  // Count different types of currency indicators
  Object.values(CURRENCY_PATTERNS).forEach(pattern => {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      currencyMatches.push(match[0]);
      if (currencyMatches.length > 1) {
        return true; // Early exit if multiple found
      }
    }
  });

  return currencyMatches.length > 1;
}

// Calculate confidence score based on various factors
function calculateConfidence(detection, originalText) {
  let confidence = detection.confidence || 0.7;

  // Boost confidence for exact matches
  if (detection.originalText.trim() === originalText.trim()) {
    confidence += 0.1;
  }

  // Reduce confidence for multiple currencies in selection
  if (detection.hasMultipleCurrencies) {
    confidence -= 0.2;
  }

  // Boost confidence for common currencies
  const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
  if (commonCurrencies.includes(detection.currency)) {
    confidence += 0.05;
  }

  // Ensure confidence stays within bounds
  return Math.max(0.1, Math.min(1.0, confidence));
}

// Enhanced currency detection function for Task 2.1 (used by detectCurrencyWithValidation)
function detectCurrency(text) {
  // Helper function to parse amount from string
  function parseAmount(amountStr) {
    // Remove spaces and handle different decimal separators
    const cleanAmount = amountStr.replace(/\s/g, '');
    // Handle European format (1.234,56) vs US format (1,234.56)
    if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
      // Determine format by position of comma vs period
      const lastComma = cleanAmount.lastIndexOf(',');
      const lastPeriod = cleanAmount.lastIndexOf('.');
      if (lastComma > lastPeriod) {
        // European format: 1.234,56
        return parseFloat(cleanAmount.replace(/\./g, '').replace(',', '.'));
      } else {
        // US format: 1,234.56
        return parseFloat(cleanAmount.replace(/,/g, ''));
      }
    } else if (cleanAmount.includes(',')) {
      // Could be thousands separator or decimal
      const parts = cleanAmount.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Decimal separator: 123,45
        return parseFloat(cleanAmount.replace(',', '.'));
      } else {
        // Thousands separator: 1,234 or 1,234,567
        return parseFloat(cleanAmount.replace(/,/g, ''));
      }
    } else {
      // Simple number: 1234 or 1234.56
      return parseFloat(cleanAmount);
    }
  }

  // Helper function to normalize currency symbol
  function normalizeCurrencySymbol(symbol) {
    return symbol.trim().replace(/\s+/g, '');
  }

  // Try symbol patterns first (highest priority)
  CURRENCY_PATTERNS.symbols.lastIndex = 0;
  let match = CURRENCY_PATTERNS.symbols.exec(text);
  if (match) {
    const symbol = normalizeCurrencySymbol(match[1]);
    const amount = parseAmount(match[2]);
    const currency = SYMBOL_TO_CODE[symbol] || 'USD';

    if (!isNaN(amount) && amount > 0) {
      return {
        amount: amount,
        currency: currency,
        originalText: match[0],
        format: 'symbol',
        confidence: 0.9
      };
    }
  }

  // Try currency code with amount: USD 100
  CURRENCY_PATTERNS.codesFirst.lastIndex = 0;
  match = CURRENCY_PATTERNS.codesFirst.exec(text);
  if (match) {
    const currency = match[1].toUpperCase();
    const amount = parseAmount(match[2]);

    if (!isNaN(amount) && amount > 0) {
      return {
        amount: amount,
        currency: currency,
        originalText: match[0],
        format: 'codeFirst',
        confidence: 0.85
      };
    }
  }

  // Try amount with currency code: 100 USD
  CURRENCY_PATTERNS.codes.lastIndex = 0;
  match = CURRENCY_PATTERNS.codes.exec(text);
  if (match) {
    const amount = parseAmount(match[1]);
    const currency = match[2].toUpperCase();

    if (!isNaN(amount) && amount > 0) {
      return {
        amount: amount,
        currency: currency,
        originalText: match[0],
        format: 'code',
        confidence: 0.85
      };
    }
  }

  // Try currency words with amount: dollars 100
  CURRENCY_PATTERNS.wordsFirst.lastIndex = 0;
  match = CURRENCY_PATTERNS.wordsFirst.exec(text);
  if (match) {
    const word = match[1].toLowerCase();
    const currency = WORD_TO_CODE[word];
    const amount = parseAmount(match[2]);

    if (currency && !isNaN(amount) && amount > 0) {
      return {
        amount: amount,
        currency: currency,
        originalText: match[0],
        format: 'wordFirst',
        confidence: 0.7
      };
    }
  }

  // Try amount with currency words: 100 dollars
  CURRENCY_PATTERNS.words.lastIndex = 0;
  match = CURRENCY_PATTERNS.words.exec(text);
  if (match) {
    const amount = parseAmount(match[1]);
    const word = match[2].toLowerCase();
    const currency = WORD_TO_CODE[word];

    if (currency && !isNaN(amount) && amount > 0) {
      return {
        amount: amount,
        currency: currency,
        originalText: match[0],
        format: 'word',
        confidence: 0.7
      };
    }
  }

  // Try suffix symbol patterns: 100$, 50€, 75£
  CURRENCY_PATTERNS.symbolsSuffix.lastIndex = 0;
  match = CURRENCY_PATTERNS.symbolsSuffix.exec(text);
  if (match) {
    const amount = parseAmount(match[1]);
    const symbol = normalizeCurrencySymbol(match[2]);
    const currency = SYMBOL_TO_CODE[symbol] || 'USD';

    if (!isNaN(amount) && amount > 0) {
      return {
        amount: amount,
        currency: currency,
        originalText: match[0],
        format: 'symbolSuffix',
        confidence: 0.8
      };
    }
  }

  return null;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'showLoadingFeedback') {
      if (visualFeedback && visualFeedback.showToast) {
        visualFeedback.showToast(
          `Converting to ${request.targetCurrency}...`,
          'info',
          2000
        );
      }
      sendResponse({ success: true });
    }

    if (request.action === 'showErrorFeedback') {
      if (visualFeedback && visualFeedback.showToast) {
        visualFeedback.showToast(
          `Conversion failed: ${request.error}`,
          'error',
          4000
        );
      }
      sendResponse({ success: true });
    }

    if (request.action === 'showConversionResult' && request.result) {
      if (request.result.error) {
        // Show error result
        displayConversionTooltip(
          request.originalText,
          request.currencyInfo,
          null,
          request.result.errorMessage
        );
        if (visualFeedback && visualFeedback.showToast) {
          visualFeedback.showToast(
            `Conversion failed: ${request.result.errorMessage}`,
            'error',
            4000
          );
        }
      } else {
        // Show successful conversion result
        displayConversionTooltip(
          request.originalText,
          request.currencyInfo,
          request.result
        );

        // DEBUG: Log the conversion result to see what fields are available
        console.log('🔍 Conversion result received:', request.result);
        console.log(
          '🔍 formattedAmount field:',
          request.result.formattedAmount
        );
        console.log(
          '🔍 convertedAmount field:',
          request.result.convertedAmount
        );
        console.log('🔍 toCurrency field:', request.result.toCurrency);

        // Use the pre-formatted amount from the conversion result, or format it if not available
        const formattedAmount =
          request.result.formattedAmount ||
          (() => {
            const formatCurrency = (amount, currency) => {
              const value = parseFloat(amount);
              if (isNaN(value)) {
                return amount;
              }

              try {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4
                }).format(value);
              } catch {
                return `${amount} ${currency}`;
              }
            };

            return formatCurrency(
              String(request.result.convertedAmount).replace(/[^\d.-]/g, ''),
              request.result.toCurrency
            );
          })();

        const toastMessage = `${formattedAmount} (Click to copy)`;

        // Extract numeric value for copying (remove currency symbols and letters)
        const numericValue = formattedAmount.replace(/[^\d,.-]/g, '').trim();

        if (visualFeedback && visualFeedback.showToast) {
          const toast = visualFeedback.showToast(toastMessage, 'success', 5000);

          // Make toast clickable to copy result
          if (toast) {
            toast.style.cursor = 'pointer';
            toast.addEventListener('click', () => {
              visualFeedback.copyToClipboard(
                numericValue,
                true,
                'Number copied!'
              );
              visualFeedback.hideToast(toast);
            });
          }
        } else {
          // Fallback if visual feedback is not loaded
          console.warn(
            '⚠️ Visual feedback not loaded, creating fallback toast'
          );
          const fallbackToast = document.createElement('div');
          fallbackToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            cursor: pointer;
          `;

          fallbackToast.textContent = toastMessage;
          fallbackToast.addEventListener('click', () => {
            if (window.navigator && window.navigator.clipboard) {
              window.navigator.clipboard
                .writeText(numericValue)
                .then(() => {
                  fallbackToast.textContent = 'Number copied!';
                  setTimeout(() => fallbackToast.remove(), 1000);
                })
                .catch(() => {
                  console.warn('Failed to copy to clipboard');
                  fallbackToast.remove();
                });
            } else {
              console.warn('Clipboard API not available');
              fallbackToast.remove();
            }
          });

          document.body.appendChild(fallbackToast);
          setTimeout(() => {
            if (fallbackToast.parentNode) {
              fallbackToast.remove();
            }
          }, 5000);
        }
      }
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Error handling visual feedback message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

console.log('✅ Currency converter content script with visual feedback loaded');

// Helper function to remove existing tooltips
function removeExistingTooltip() {
  const existing = document.getElementById('currency-converter-tooltip');
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }
}

// Phase 5, Task 5.1: Display conversion tooltip with visual feedback
function displayConversionTooltip(
  originalText,
  currencyInfo,
  result,
  errorMessage = null
) {
  // Remove any existing tooltips
  removeExistingTooltip();

  // If we have the visual feedback system available, use its enhanced showTooltipConversionResult
  if (visualFeedback && visualFeedback.showTooltipConversionResult) {
    try {
      visualFeedback.showTooltipConversionResult(
        originalText,
        currencyInfo,
        result,
        errorMessage
      );
      return;
    } catch (error) {
      console.warn(
        'Failed to use visual feedback system, falling back to basic tooltip:',
        error
      );
    }
  }

  // Fallback to basic tooltip implementation
  createBasicTooltip(originalText, currencyInfo, result, errorMessage);
}

// Basic tooltip implementation as fallback
function createBasicTooltip(
  originalText,
  currencyInfo,
  result,
  errorMessage = null
) {
  // Get the current mouse position or text selection
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  // Try to get selection position
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      x = rect.left + rect.width / 2;
      y = rect.top - 10;
    }
  }

  // Create tooltip element with accessibility features
  const tooltip = document.createElement('div');
  tooltip.id = 'currency-converter-tooltip';
  tooltip.setAttribute('role', 'dialog');
  tooltip.setAttribute('aria-modal', 'true');
  tooltip.setAttribute('aria-live', 'polite');
  tooltip.setAttribute('tabindex', '-1');

  // Add accessibility label based on content
  if (errorMessage) {
    tooltip.setAttribute(
      'aria-label',
      `Currency conversion error: ${errorMessage}`
    );
  } else if (result) {
    tooltip.setAttribute(
      'aria-label',
      `Currency conversion result: ${currencyInfo?.amount || result.originalAmount} ${currencyInfo?.currency || 'USD'} equals ${result.formattedAmount || result.convertedAmount}`
    );
  } else {
    tooltip.setAttribute('aria-label', 'Currency conversion in progress');
  }

  tooltip.style.cssText = `
    position: fixed;
    z-index: 10000;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    max-width: 320px;
    min-width: 200px;
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.3s ease;
    left: ${Math.max(10, Math.min(x, window.innerWidth - 330))}px;
    top: ${Math.max(10, y)}px;
    transform-origin: center bottom;
    backdrop-filter: blur(8px);
  `;

  if (errorMessage) {
    // Error state
    tooltip.innerHTML = `
      <div style="color: #ef4444; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">❌</span>
        Conversion Failed
      </div>
      <div style="color: #6b7280; margin-bottom: 8px;">
        <strong>Original:</strong> ${originalText}
      </div>
      <div style="color: #ef4444; font-size: 13px; background: #fef2f2; padding: 8px; border-radius: 6px; border-left: 3px solid #ef4444;">
        ${errorMessage}
      </div>
      <div style="margin-top: 8px; font-size: 11px; opacity: 0.6; text-align: center;">
        Click anywhere to close
      </div>
    `;
  } else if (result) {
    // Enhanced success state with proper currency formatting
    const fromCurrency = currencyInfo?.currency || 'USD';

    tooltip.innerHTML = `
      <div style="color: #10b981; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">✅</span>
        Currency Conversion
      </div>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">
          ${result.formattedAmount || result.convertedAmount}
        </div>
        <div style="font-size: 12px; opacity: 0.9;">
          ${currencyInfo?.amount || result.originalAmount} ${fromCurrency} → ${result.formattedAmount || result.convertedAmount}
        </div>
      </div>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
        <div><strong>Rate:</strong> ${result.exchangeRate}</div>
        <div><strong>Updated:</strong> ${result.timestamp || new Date().toLocaleString()}</div>
      </div>
      <div style="text-align: center; margin-top: 12px;">
        <button id="copyConversionResult" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
          📋 Copy Result
        </button>
      </div>
      <div style="margin-top: 8px; font-size: 11px; opacity: 0.6; text-align: center;">
        Click anywhere to close
      </div>
    `;
  } else {
    // Loading state (fallback)
    tooltip.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #3b82f6;">
        <div class="vf-loading-spinner"></div>
        <span>Converting currency...</span>
      </div>
      <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
        <strong>Original:</strong> ${originalText}
      </div>
    `;
  }

  document.body.appendChild(tooltip);

  // Focus the tooltip for screen readers
  setTimeout(() => {
    tooltip.focus();
  }, 100);

  // Animate in
  requestAnimationFrame(() => {
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'scale(1)';
  });

  // Announce tooltip to screen reader
  if (accessibilityManager) {
    const ariaLabel = tooltip.getAttribute('aria-label');
    accessibilityManager.announceToScreenReader(ariaLabel);
  }

  // Add copy functionality if success result
  if (result && !errorMessage) {
    const copyButton = tooltip.querySelector('#copyConversionResult');
    if (copyButton) {
      // Add accessibility attributes to copy button
      copyButton.setAttribute(
        'aria-label',
        'Copy conversion result to clipboard'
      );
      copyButton.setAttribute('type', 'button');

      copyButton.addEventListener('click', e => {
        e.stopPropagation();

        // Use the pre-formatted amount, or format it if not available
        const formattedAmount =
          result.formattedAmount ||
          (() => {
            const formatCurrency = (amount, currency) => {
              const value = parseFloat(amount);
              if (isNaN(value)) {
                return amount;
              }

              try {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4
                }).format(value);
              } catch {
                return `${amount} ${currency}`;
              }
            };

            return formatCurrency(
              String(result.convertedAmount).replace(/[^\d.-]/g, ''),
              result.toCurrency || 'USD'
            );
          })();

        // Extract numeric value for copying (remove currency symbols and letters)
        const numericValue = formattedAmount.replace(/[^\d,.-]/g, '').trim();

        if (visualFeedback && visualFeedback.copyToClipboard) {
          visualFeedback.copyToClipboard(numericValue);
        } else {
          // Fallback copy to clipboard
          if (window.navigator && window.navigator.clipboard) {
            window.navigator.clipboard.writeText(numericValue).catch(() => {});
          }
        }
        copyButton.textContent = '✅ Copied!';
        copyButton.style.background = '#10b981';
        copyButton.setAttribute(
          'aria-label',
          'Conversion result copied to clipboard'
        );

        // Announce to screen reader
        if (accessibilityManager) {
          accessibilityManager.announceToScreenReader(
            `Copied ${numericValue} to clipboard`
          );
        }

        setTimeout(() => {
          removeTooltip();
        }, 1000);
      });
    }
  }

  // Enhanced removal logic with accessibility
  const removeTooltip = () => {
    if (tooltip.parentNode) {
      // Announce closure to screen reader
      if (accessibilityManager) {
        accessibilityManager.announceToScreenReader(
          'Conversion tooltip closed'
        );
      }

      tooltip.style.opacity = '0';
      tooltip.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, 300);
    }
    document.removeEventListener('click', removeTooltip);
    document.removeEventListener('keydown', handleKeyDown);
  };

  // Enhanced keyboard support
  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      removeTooltip();
    } else if (event.key === 'Enter' && event.target === tooltip) {
      event.preventDefault();
      removeTooltip();
    } else if (event.key === 'Tab') {
      // Keep focus within tooltip if it has focusable elements
      const focusableElements = tooltip.querySelectorAll(
        'button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  // Add keyboard event listener to tooltip itself
  tooltip.addEventListener('keydown', handleKeyDown);

  // Auto-remove after 10 seconds for better accessibility (longer for users with disabilities)
  setTimeout(removeTooltip, 10000);

  // Remove on click outside tooltip
  setTimeout(() => {
    document.addEventListener('click', event => {
      if (!tooltip.contains(event.target)) {
        removeTooltip();
      }
    });
    document.addEventListener('keydown', handleKeyDown);
  }, 100);
}

/**
 * Initialize accessibility features for content script
 */
function initializeContentAccessibility() {
  if (!accessibilityManager) {
    return;
  }

  // Initialize base accessibility features
  accessibilityManager.init();

  // Add content-specific keyboard event handlers
  document.addEventListener('keydown', handleContentKeydown);

  // Add focus management for tooltips
  document.addEventListener('focusin', handleTooltipFocus);
  document.addEventListener('focusout', handleTooltipBlur);

  // Announce extension readiness
  setTimeout(() => {
    accessibilityManager.announceToScreenReader(
      'Currency converter extension ready. Select currency amounts for conversion.'
    );
  }, 1000);
}

/**
 * Handle keyboard events in content script
 */
function handleContentKeydown(event) {
  if (!accessibilityManager) {
    return;
  }

  const { key, altKey } = event;

  // Alt+C - Convert selected text
  if (altKey && key === 'c') {
    event.preventDefault();
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const selectedText = selection.toString().trim();
      if (selectedText) {
        convertSelectedCurrency(selectedText);
        accessibilityManager.announceToScreenReader(
          `Converting selected currency: ${selectedText}`
        );
      }
    } else {
      accessibilityManager.announceToScreenReader(
        'Please select currency amount text first'
      );
    }
  }

  // Escape - Close tooltips
  if (key === 'Escape') {
    closeAllTooltips();
  }

  // Alt+H - Help for content script features
  if (altKey && key === 'h') {
    event.preventDefault();
    announceContentHelp();
  }
}

/**
 * Announce help for content script features
 */
function announceContentHelp() {
  if (!accessibilityManager) {
    return;
  }

  const helpText = `
    Currency converter keyboard shortcuts:
    - Select currency text and press Alt+C to convert
    - Press Escape to close conversion tooltips
    - Right-click on currency amounts for context menu options
    - Alt+H for this help message
  `;

  accessibilityManager.announceToScreenReader(helpText);
}

/**
 * Handle tooltip focus for accessibility
 */
function handleTooltipFocus(event) {
  const tooltip = event.target.closest('[id*="tooltip"], .vf-tooltip');
  if (tooltip && accessibilityManager) {
    // Announce tooltip content when focused
    const content = tooltip.textContent || tooltip.getAttribute('aria-label');
    if (content) {
      accessibilityManager.announceToScreenReader(`Tooltip: ${content}`);
    }
  }
}

/**
 * Handle tooltip blur for accessibility
 */
function handleTooltipBlur(event) {
  // Remove any temporary accessibility states
  const tooltip = event.target.closest('[id*="tooltip"], .vf-tooltip');
  if (tooltip) {
    tooltip.classList.remove('accessibility-focused');
  }
}

/**
 * Close all tooltips and announce to screen reader
 */
function closeAllTooltips() {
  const tooltips = document.querySelectorAll('[id*="tooltip"], .vf-tooltip');
  let closedCount = 0;

  tooltips.forEach(tooltip => {
    if (tooltip && tooltip.style.display !== 'none') {
      tooltip.style.display = 'none';
      tooltip.remove();
      closedCount++;
    }
  });

  if (closedCount > 0 && accessibilityManager) {
    accessibilityManager.announceToScreenReader(
      `${closedCount} tooltip${closedCount === 1 ? '' : 's'} closed`
    );
  }
}

/**
 * Convert selected currency with accessibility support
 */
function convertSelectedCurrency(selectedText) {
  try {
    // Use existing currency detection logic
    const currencyInfo = detectCurrencyWithValidation(selectedText);

    if (currencyInfo) {
      // Send message to background script for conversion
      sendMessageSafely({
        action: 'convertCurrency',
        currencyInfo: currencyInfo,
        selectedText: selectedText
      });

      if (accessibilityManager) {
        accessibilityManager.announceToScreenReader(
          `Converting ${currencyInfo.amount} ${currencyInfo.code} to target currencies`
        );
      }
    } else {
      if (accessibilityManager) {
        accessibilityManager.announceToScreenReader(
          'No valid currency detected in selected text'
        );
      }
    }
  } catch (error) {
    console.error('Error converting selected currency:', error);
    if (accessibilityManager) {
      accessibilityManager.announceToScreenReader(
        'Error occurred during currency conversion'
      );
    }
  }
}
