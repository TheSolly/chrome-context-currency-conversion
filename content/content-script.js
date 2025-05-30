// Content Script for Currency Converter Extension
// Detects currency amounts in selected text and communicates with background script

console.log('Currency Converter content script loaded');

// Currency patterns for detection
const CURRENCY_PATTERNS = {
  // Symbol patterns: $100, €50, £75, ¥1000
  symbols:
    /(\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,

  // Amount with currency code: 100 USD, 50 EUR, 75 GBP
  codes:
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|SEK|NZD|MXN|SGD|HKD|NOK|TRY|ZAR|BRL|INR|KRW|RUB|PLN|CZK|HUF|ILS|THB|PHP|MYR|IDR|VND)/gi,

  // Currency code with amount: USD 100, EUR 50, GBP 75
  codesFirst:
    /(USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|SEK|NZD|MXN|SGD|HKD|NOK|TRY|ZAR|BRL|INR|KRW|RUB|PLN|CZK|HUF|ILS|THB|PHP|MYR|IDR|VND)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
};

// Currency symbol to code mapping
const SYMBOL_TO_CODE = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
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
  '₿': 'BTC'
};

// Track current selection - reserved for future use
// let currentSelection = null;
// let lastDetectedCurrency = null;

// Listen for text selection changes
document.addEventListener('selectionchange', handleSelectionChange);
document.addEventListener('mouseup', handleMouseUp);

function handleSelectionChange() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    // currentSelection = selectedText;
    const currencyInfo = detectCurrency(selectedText);

    if (currencyInfo) {
      // lastDetectedCurrency = currencyInfo;
      // Notify background script about currency detection
      chrome.runtime.sendMessage({
        action: 'updateContextMenu',
        hasCurrency: true,
        currencyInfo: currencyInfo
      });
    } else {
      // lastDetectedCurrency = null;
      chrome.runtime.sendMessage({
        action: 'updateContextMenu',
        hasCurrency: false
      });
    }
  } else {
    // currentSelection = null;
    // lastDetectedCurrency = null;
    chrome.runtime.sendMessage({
      action: 'updateContextMenu',
      hasCurrency: false
    });
  }
}

function handleMouseUp() {
  // Small delay to ensure selection is complete
  setTimeout(handleSelectionChange, 10);
}

// Detect currency in selected text
function detectCurrency(text) {
  // Try symbol patterns first
  let match = CURRENCY_PATTERNS.symbols.exec(text);
  if (match) {
    const symbol = match[1];
    const amount = parseFloat(match[2].replace(/,/g, ''));
    const currency = SYMBOL_TO_CODE[symbol] || 'USD';

    return {
      amount: amount,
      currency: currency,
      originalText: match[0],
      format: 'symbol'
    };
  }

  // Reset regex lastIndex
  CURRENCY_PATTERNS.symbols.lastIndex = 0;

  // Try amount with currency code
  match = CURRENCY_PATTERNS.codes.exec(text);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    const currency = match[2].toUpperCase();

    return {
      amount: amount,
      currency: currency,
      originalText: match[0],
      format: 'code'
    };
  }

  // Reset regex lastIndex
  CURRENCY_PATTERNS.codes.lastIndex = 0;

  // Try currency code with amount
  match = CURRENCY_PATTERNS.codesFirst.exec(text);
  if (match) {
    const currency = match[1].toUpperCase();
    const amount = parseFloat(match[2].replace(/,/g, ''));

    return {
      amount: amount,
      currency: currency,
      originalText: match[0],
      format: 'codeFirst'
    };
  }

  // Reset regex lastIndex
  CURRENCY_PATTERNS.codesFirst.lastIndex = 0;

  return null;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'showConversionResult') {
    showConversionResult(request);
  }
});

// Show conversion result to user
function showConversionResult(data) {
  // Create a temporary tooltip-like element to show the conversion
  const tooltip = document.createElement('div');
  tooltip.id = 'currency-converter-tooltip';
  tooltip.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #333;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    text-align: center;
  `;

  tooltip.innerHTML = `
    <div style="margin-bottom: 8px;">
      <strong>Currency Conversion</strong>
    </div>
    <div>
      Converting: ${data.originalText}
    </div>
    <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
      From ${data.baseCurrency} to ${data.secondaryCurrency}
    </div>
    <div style="margin-top: 8px; font-size: 12px; opacity: 0.6;">
      (Conversion logic coming soon...)
    </div>
  `;

  document.body.appendChild(tooltip);

  // Remove tooltip after 3 seconds
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  }, 3000);

  // Remove tooltip when clicking anywhere
  const removeTooltip = () => {
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
    document.removeEventListener('click', removeTooltip);
  };

  setTimeout(() => {
    document.addEventListener('click', removeTooltip);
  }, 100);
}
