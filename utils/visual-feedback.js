/* eslint-disable indent */
// Visual Feedback System for Currency Converter Extension
// Phase 5, Task 5.1: Visual Feedback System Implementation

/**
 * Visual Feedback Manager
 * Handles loading indicators, success animations, error messages, and result displays
 */
export class VisualFeedbackManager {
  constructor() {
    this.activeToasts = new Set();
    this.loadingIndicators = new Map();
    this.animationQueue = [];
    this.initializeStyles();
  }

  /**
   * Initialize CSS styles for visual feedback components
   */
  initializeStyles() {
    if (document.getElementById('visual-feedback-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'visual-feedback-styles';
    styles.textContent = `
      /* Loading Spinner */
      .vf-loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: vf-spin 1s linear infinite;
        display: inline-block;
      }

      .vf-loading-spinner-large {
        width: 32px;
        height: 32px;
        border-width: 3px;
      }

      @keyframes vf-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Loading Overlay */
      .vf-loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
      }

      /* Toast Notifications */
      .vf-toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      }

      .vf-toast {
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        padding: 12px 16px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 320px;
        pointer-events: auto;
        transform: translateX(100%);
        transition: all 0.3s ease;
        border-left: 4px solid #e5e7eb;
        color: #374151; /* Dark text color for better visibility */
      }

      .vf-toast.vf-show {
        transform: translateX(0);
      }

      .vf-toast.vf-success {
        border-left-color: #10b981;
        background: #f0fdf4;
        color: #166534; /* Dark green text */
      }

      .vf-toast.vf-error {
        border-left-color: #ef4444;
        background: #fef2f2;
        color: #dc2626; /* Dark red text */
      }

      .vf-toast.vf-info {
        border-left-color: #3b82f6;
        background: #eff6ff;
        color: #1e40af; /* Dark blue text */
      }

      .vf-toast.vf-warning {
        border-left-color: #f59e0b;
        background: #fffbeb;
        color: #d97706; /* Dark orange text */
      }

      /* Success Animation */
      .vf-success-pulse {
        animation: vf-pulse-success 0.6s ease-in-out;
      }

      @keyframes vf-pulse-success {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); background-color: #dcfce7; }
        100% { transform: scale(1); }
      }

      /* Error Animation */
      .vf-error-shake {
        animation: vf-shake-error 0.5s ease-in-out;
      }

      @keyframes vf-shake-error {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
        20%, 40%, 60%, 80% { transform: translateX(3px); }
      }

      /* Conversion Result Display */
      .vf-conversion-result {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        padding: 16px;
        margin: 8px 0;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }

      .vf-conversion-result::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        animation: vf-shine 2s ease-in-out;
      }

      @keyframes vf-shine {
        0% { left: -100%; }
        100% { left: 100%; }
      }

      .vf-conversion-amount {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 8px;
        line-height: 1.2;
      }

      .vf-conversion-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        opacity: 0.95;
      }

      .vf-conversion-summary {
        font-weight: 600;
        font-size: 14px;
      }

      .vf-exchange-rate {
        font-style: italic;
        opacity: 0.9;
      }

      .vf-conversion-timestamp {
        font-size: 11px;
        opacity: 0.8;
      }

      .vf-copy-button {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 6px;
        color: white;
        padding: 6px 8px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
      }

      .vf-copy-button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* Progress Bar */
      .vf-progress-bar {
        width: 100%;
        height: 3px;
        background: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
        margin: 8px 0;
      }

      .vf-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        border-radius: 2px;
        transform: translateX(-100%);
        animation: vf-progress 2s ease-in-out infinite;
      }

      @keyframes vf-progress {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(0%); }
        100% { transform: translateX(100%); }
      }

      /* Fade transitions */
      .vf-fade-in {
        animation: vf-fadeIn 0.3s ease-in;
      }

      .vf-fade-out {
        animation: vf-fadeOut 0.3s ease-out;
      }

      @keyframes vf-fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes vf-fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }

      /* Bounce animation for successful actions */
      .vf-bounce {
        animation: vf-bounce 0.6s ease-in-out;
      }

      @keyframes vf-bounce {
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
        40%, 43% { transform: translate3d(0,-8px,0); }
        70% { transform: translate3d(0,-4px,0); }
        90% { transform: translate3d(0,-2px,0); }
      }

      /* Loading text animation */
      .vf-loading-text {
        animation: vf-loading-dots 1.5s infinite;
      }

      @keyframes vf-loading-dots {
        0%, 20% { content: ''; }
        40% { content: '.'; }
        60% { content: '..'; }
        80%, 100% { content: '...'; }
      }

      .vf-loading-text::after {
        content: '';
        animation: vf-loading-dots 1.5s infinite;
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Show loading indicator
   */
  showLoading(containerId, options = {}) {
    const {
      message = 'Loading...',
      size = 'normal',
      overlay = false,
      showProgress = false
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container ${containerId} not found for loading indicator`);
      return null;
    }

    // Create loading element
    const loadingEl = document.createElement('div');
    loadingEl.className = 'vf-loading-indicator';

    if (overlay) {
      loadingEl.className += ' vf-loading-overlay';
      container.style.position = container.style.position || 'relative';
    }

    const spinnerClass = size === 'large' ? 'vf-loading-spinner-large' : '';

    loadingEl.innerHTML = `
      <div class="flex flex-col items-center gap-2">
        <div class="vf-loading-spinner ${spinnerClass}"></div>
        <span class="text-sm text-gray-600 vf-loading-text">${message}</span>
        ${showProgress ? '<div class="vf-progress-bar"><div class="vf-progress-fill"></div></div>' : ''}
      </div>
    `;

    if (overlay) {
      container.appendChild(loadingEl);
    } else {
      container.innerHTML = '';
      container.appendChild(loadingEl);
    }

    // Store reference for cleanup
    const loadingId = `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.loadingIndicators.set(loadingId, { container, element: loadingEl });

    return loadingId;
  }

  /**
   * Hide loading indicator
   */ hideLoading(loadingId) {
    if (!loadingId || !this.loadingIndicators.has(loadingId)) {
      return;
    }

    const { element } = this.loadingIndicators.get(loadingId);

    try {
      if (element && element.parentNode) {
        element.remove();
      }
      this.loadingIndicators.delete(loadingId);
    } catch (error) {
      console.warn('Error removing loading indicator:', error);
    }
  }

  /**
   * Show conversion result with animation
   */
  showConversionResult(containerId, result, options = {}) {
    const {
      showCopyButton = true,
      animate = true,
      autoHide = false,
      hideDelay = 5000
    } = options;

    console.log('Showing conversion result:', result);

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container ${containerId} not found for conversion result`);
      return;
    }

    const resultEl = document.createElement('div');
    resultEl.className = 'vf-conversion-result';
    if (animate) {
      resultEl.className += ' vf-fade-in';
    }

    // Format the exchange rate for better readability
    const formatExchangeRate = (rate, fromCurrency, toCurrency) => {
      const rateValue = parseFloat(rate);
      if (isNaN(rateValue)) {
        return `Rate: ${rate}`;
      }

      // Format to appropriate decimal places
      const formattedRate =
        rateValue > 1
          ? rateValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4
            })
          : rateValue.toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 6
            });

      return `1 ${fromCurrency} : ${formattedRate} ${toCurrency}`;
    };

    // Format timestamp for better readability
    const formatTimestamp = timestamp => {
      try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffMinutes < 1) {
          return 'Just now';
        }
        if (diffMinutes < 60) {
          return `${diffMinutes} min ago`;
        }
        if (diffMinutes < 1440) {
          return `${Math.floor(diffMinutes / 60)}h ago`;
        }

        return date.toLocaleDateString();
      } catch {
        return 'Recently updated';
      }
    };

    const copyButtonHtml = showCopyButton
      ? `
      <button class="vf-copy-button" data-copy-text="${String(result.convertedAmount)}">
        📋 Copy
      </button>
    `
      : '';

    resultEl.innerHTML = `
      ${copyButtonHtml}
      <div class="vf-conversion-amount">
        ${result.convertedAmount} ${result.toCurrency || 'TO'}
      </div>
      <div class="vf-conversion-details">
        <div class="vf-conversion-summary">
          ${result.originalAmount} ${result.fromCurrency || 'FROM'} → ${result.convertedAmount} ${result.toCurrency || 'TO'}
        </div>
        <div class="vf-exchange-rate">
          ${formatExchangeRate(result.exchangeRate, result.fromCurrency || 'FROM', result.toCurrency || 'TO')}
        </div>
        <div class="vf-conversion-timestamp">
          Updated: ${formatTimestamp(result.timestamp)}
        </div>
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(resultEl);

    // Add copy button event listener if present
    if (showCopyButton) {
      const copyButton = resultEl.querySelector('.vf-copy-button');
      if (copyButton) {
        copyButton.addEventListener('click', () => {
          const textToCopy =
            copyButton.getAttribute('data-copy-text') || result.convertedAmount;
          this.copyToClipboard(textToCopy);
        });
      }
    }

    // Auto-hide if requested
    if (autoHide) {
      setTimeout(() => {
        if (resultEl.parentNode) {
          resultEl.className = resultEl.className.replace(
            'vf-fade-in',
            'vf-fade-out'
          );
          setTimeout(() => resultEl.remove(), 300);
        }
      }, hideDelay);
    }

    return resultEl;
  }

  /**
   * Show conversion result in a floating tooltip
   */
  showTooltipConversionResult(
    originalText,
    currencyInfo,
    result,
    errorMessage = null
  ) {
    // Remove any existing tooltips
    this.removeExistingTooltip();

    // Format the exchange rate for better readability
    const formatExchangeRate = (rate, fromCurrency, toCurrency) => {
      const rateValue = parseFloat(rate);
      if (isNaN(rateValue)) {
        return `Rate: ${rate}`;
      }

      // Format to appropriate decimal places
      const formattedRate =
        rateValue > 1
          ? rateValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4
            })
          : rateValue.toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 6
            });

      return `1 ${fromCurrency} = ${formattedRate} ${toCurrency}`;
    };

    // Format timestamp for better readability
    const formatTimestamp = timestamp => {
      try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffMinutes < 1) {
          return 'Just now';
        }
        if (diffMinutes < 60) {
          return `${diffMinutes} min ago`;
        }
        if (diffMinutes < 1440) {
          return `${Math.floor(diffMinutes / 60)}h ago`;
        }

        return date.toLocaleDateString();
      } catch {
        return 'Recently updated';
      }
    };

    // Get position for tooltip
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

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'vf-conversion-tooltip';
    tooltip.className = 'vf-tooltip vf-fade-in';
    tooltip.style.cssText = `
      position: fixed;
      z-index: 10000;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      max-width: 350px;
      min-width: 250px;
      opacity: 0;
      transform: scale(0.9) translateY(10px);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      left: ${Math.max(10, Math.min(window.innerWidth - 350, x - 175))}px;
      top: ${Math.max(10, y - 10)}px;
      transform-origin: center bottom;
      backdrop-filter: blur(12px);
      border: 2px solid rgba(59, 130, 246, 0.1);
    `;

    if (errorMessage) {
      // Error state
      tooltip.innerHTML = `
        <div style="color: #ef4444; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">❌</span>
          Conversion Failed
        </div>
        <div style="color: #6b7280; margin-bottom: 12px; font-size: 13px;">
          <strong>Original:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${originalText}</code>
        </div>
        <div style="color: #ef4444; font-size: 13px; background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444; line-height: 1.5;">
          ${errorMessage}
        </div>
        <div style="margin-top: 12px; font-size: 11px; opacity: 0.6; text-align: center;">
          Click anywhere to close
        </div>
      `;
    } else if (result) {
      // Enhanced success state with proper currency formatting
      const fromCurrency =
        currencyInfo?.currency || result.fromCurrency || 'USD';
      const toCurrency = result.toCurrency || result.targetCurrency || 'USD';
      const originalAmount = currencyInfo?.amount || result.originalAmount;

      // Format the amounts with proper currency symbols
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

      const formattedOriginal = formatCurrency(originalAmount, fromCurrency);
      const formattedConverted = formatCurrency(
        String(result.convertedAmount).replace(/[^\d.-]/g, ''),
        toCurrency
      );

      tooltip.innerHTML = `
        <div style="color: #10b981; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">✅</span>
          Currency Conversion
        </div>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 10px; margin-bottom: 12px;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 6px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
            ${formattedConverted}
          </div>
          <div style="font-size: 13px; opacity: 0.9; display: flex; align-items: center; gap: 8px;">
            <span>${formattedOriginal}</span>
            <span style="font-size: 16px;">→</span>
            <span>${formattedConverted}</span>
          </div>
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>${formatExchangeRate(result.exchangeRate, fromCurrency, toCurrency)}</div>
          <div><strong>Updated:</strong> ${formatTimestamp(result.timestamp || Date.now())}</div>
        </div>
        <div style="text-align: center; margin-top: 12px;">
          <button id="vf-copy-conversion-result" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: transform 0.2s ease;">
            📋 Copy Result
          </button>
        </div>
        <div style="margin-top: 12px; font-size: 11px; opacity: 0.6; text-align: center;">
          Click anywhere to close • Press ESC to dismiss
        </div>
      `;

      // Add copy functionality for the success result
      document.body.appendChild(tooltip);

      // Animate in with enhanced easing
      requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'scale(1) translateY(0)';
      });

      // Add copy button event listeners
      const copyButton = tooltip.querySelector('#vf-copy-conversion-result');
      if (copyButton) {
        copyButton.addEventListener('mouseenter', () => {
          copyButton.style.transform = 'scale(1.05)';
        });
        copyButton.addEventListener('mouseleave', () => {
          copyButton.style.transform = 'scale(1)';
        });
        copyButton.addEventListener('click', async e => {
          e.stopPropagation();
          const success = await this.copyToClipboard(formattedConverted);
          if (success) {
            copyButton.innerHTML = '✅ Copied!';
            copyButton.style.background =
              'linear-gradient(135deg, #10b981, #059669)';
            setTimeout(() => {
              removeTooltip();
            }, 1200);
          }
        });
      }
    } else {
      // Loading state (fallback)
      tooltip.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; color: #3b82f6;">
          <div class="vf-loading-spinner"></div>
          <span style="font-weight: 500;">Converting currency...</span>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #6b7280;">
          <strong>Original:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${originalText}</code>
        </div>
      `;
    }

    // Enhanced removal logic
    const removeTooltip = () => {
      if (tooltip.parentNode) {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'scale(0.9) translateY(10px)';
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
        event.preventDefault();
        removeTooltip();
      }
    };

    // Auto-remove after 10 seconds (longer for conversion results)
    setTimeout(removeTooltip, 10000);

    // Remove on click or key press
    setTimeout(() => {
      document.addEventListener('click', removeTooltip);
      document.addEventListener('keydown', handleKeyDown);
    }, 100);

    return tooltip;
  }

  /**
   * Remove existing conversion tooltip
   */
  removeExistingTooltip() {
    const existing = document.getElementById('vf-conversion-tooltip');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 4000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('vf-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'vf-toast-container';
      toastContainer.className = 'vf-toast-container';
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `vf-toast vf-${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span class="text-lg">${icons[type] || icons.info}</span>
      <span class="text-sm font-medium">${message}</span>
    `;

    toastContainer.appendChild(toast);
    this.activeToasts.add(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('vf-show'), 10);

    // Auto-remove
    setTimeout(() => {
      this.hideToast(toast);
    }, duration);

    return toast;
  }

  /**
   * Hide toast notification
   */
  hideToast(toast) {
    if (!toast || !this.activeToasts.has(toast)) {
      return;
    }

    toast.classList.remove('vf-show');
    this.activeToasts.delete(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }

  /**
   * Show success animation on element
   */
  showSuccessAnimation(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      return;
    }

    element.classList.add('vf-success-pulse');
    setTimeout(() => {
      element.classList.remove('vf-success-pulse');
    }, 600);
  }

  /**
   * Show error animation on element
   */
  showErrorAnimation(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      return;
    }

    element.classList.add('vf-error-shake');
    setTimeout(() => {
      element.classList.remove('vf-error-shake');
    }, 500);
  }

  /**
   * Copy text to clipboard with visual feedback
   */ async copyToClipboard(text, showFeedback = true) {
    try {
      if (
        typeof window !== 'undefined' &&
        window.navigator &&
        window.navigator.clipboard
      ) {
        await window.navigator.clipboard.writeText(text);
      } else {
        // Fallback for environments without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      if (showFeedback) {
        this.showToast('Copied to clipboard!', 'success', 2000);
      }

      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);

      if (showFeedback) {
        this.showToast('Failed to copy to clipboard', 'error', 3000);
      }

      return false;
    }
  }

  /**
   * Show loading state for specific operation
   */
  async withLoading(containerId, operation, options = {}) {
    const loadingId = this.showLoading(containerId, options);

    try {
      const result = await operation();
      return result;
    } catch (error) {
      this.showErrorAnimation(containerId);
      throw error;
    } finally {
      this.hideLoading(loadingId);
    }
  }

  /**
   * Cleanup all visual feedback elements
   */
  cleanup() {
    // Clear all loading indicators
    for (const [loadingId] of this.loadingIndicators) {
      this.hideLoading(loadingId);
    }

    // Clear all toasts
    for (const toast of this.activeToasts) {
      this.hideToast(toast);
    }

    // Remove toast container
    const toastContainer = document.getElementById('vf-toast-container');
    if (toastContainer) {
      toastContainer.remove();
    }
  }
}

// Global instance for easy access
export const visualFeedback = new VisualFeedbackManager();

// Make it available globally for inline event handlers
if (typeof window !== 'undefined') {
  window.visualFeedback = visualFeedback;
}
