// Content Script for Currency Converter Extension
// Detects currency amounts in selected text and communicates with background script

console.log('Currency Converter content script loaded');

// Currency patterns for detection - Enhanced for Task 2.1
const CURRENCY_PATTERNS = {
  // Symbol patterns: $100, €50, £75, ¥1000, A$50, C$75, HK$100
  symbols:
    /([A-Z]{0,2}\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿|kr|zł|Kč|Ft|₪|฿|RM|R\$|R|NZ\$|S\$|HK\$)\s*([\d]{1,3}(?:[,.\s]\d{3})*(?:[,.]\d{1,4})?)\b/gi,

  // Suffix symbol patterns: 100$, 50€, 75£
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

// Enhanced selection tracking and performance optimization - Task 2.2
let currentSelection = null;
let lastDetectedCurrency = null;
let selectionTimeout = null;
let isProcessingSelection = false;

// Performance optimization: debounce rapid selection changes
const SELECTION_DEBOUNCE_MS = 150;

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

// Enhanced selection change handler with debouncing and validation
function handleSelectionChange() {
  // Prevent multiple simultaneous processing
  if (isProcessingSelection) {
    return;
  }

  // Clear existing timeout for debouncing
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
  }

  // Debounce rapid selection changes
  selectionTimeout = setTimeout(() => {
    processSelectionChange();
  }, SELECTION_DEBOUNCE_MS);
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
function detectCurrencyWithValidation(text) {
  try {
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
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'showConversionResult') {
    showConversionResult(request);
  }
});

// Enhanced conversion result display with better UX - Task 2.2
function showConversionResult(data) {
  // Remove any existing tooltip first
  removeExistingTooltip();

  // Create enhanced tooltip-like element
  const tooltip = document.createElement('div');
  tooltip.id = 'currency-converter-tooltip';
  tooltip.setAttribute('role', 'dialog');
  tooltip.setAttribute('aria-live', 'polite');
  tooltip.setAttribute('aria-label', 'Currency conversion result');

  // Enhanced styling with better positioning and animations
  tooltip.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 2147483647;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3), 0 5px 10px rgba(0,0,0,0.2);
    max-width: 350px;
    text-align: center;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
  `;

  // Enhanced content with better formatting
  const confidence = data.currencyInfo?.confidence
    ? Math.round(data.currencyInfo.confidence * 100)
    : 85;

  tooltip.innerHTML = `
    <div style="margin-bottom: 12px; font-weight: 600; font-size: 16px;">
      💱 Currency Conversion
    </div>
    <div style="margin-bottom: 8px; font-size: 15px; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px;">
      <strong>${data.originalText}</strong>
    </div>
    <div style="margin: 12px 0; font-size: 13px; opacity: 0.9;">
      Converting from <strong>${data.currencyInfo?.currency || data.baseCurrency}</strong> to <strong>${data.secondaryCurrency}</strong>
    </div>
    <div style="margin-top: 12px; font-size: 12px; opacity: 0.7; padding: 8px; background: rgba(0,0,0,0.1); border-radius: 6px;">
      Detection confidence: ${confidence}%<br>
      <em>Full conversion coming soon...</em>
    </div>
    <div style="margin-top: 8px; font-size: 11px; opacity: 0.6;">
      Click anywhere to close
    </div>
  `;

  document.body.appendChild(tooltip);

  // Animate in
  requestAnimationFrame(() => {
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translate(-50%, -50%) scale(1)';
  });

  // Enhanced removal logic with better timing
  const removeTooltip = () => {
    if (tooltip.parentNode) {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translate(-50%, -50%) scale(0.9)';
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
    if (event.key === 'Escape' || event.key === 'Enter') {
      removeTooltip();
    }
  };

  // Auto-remove after 4 seconds
  setTimeout(removeTooltip, 4000);

  // Remove on click or key press
  setTimeout(() => {
    document.addEventListener('click', removeTooltip);
    document.addEventListener('keydown', handleKeyDown);
  }, 100);
}

// Helper function to remove existing tooltips
function removeExistingTooltip() {
  const existing = document.getElementById('currency-converter-tooltip');
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }
}
