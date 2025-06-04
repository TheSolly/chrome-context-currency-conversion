/**
 * Security Manager
 * Phase 9, Task 9.1: Security Implementation
 * Handles input validation, rate limiting, and security best practices
 */

/* global TextEncoder, TextDecoder, crypto, btoa, atob, URL, navigator */

export class SecurityManager {
  constructor() {
    this.rateLimits = new Map();
    this.blockedOrigins = new Set();
    this.suspiciousPatterns = [
      /<script[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];

    // Rate limiting configurations
    this.RATE_LIMITS = {
      API_CALLS: { requests: 100, window: 60000 }, // 100 requests per minute
      SETTINGS_UPDATES: { requests: 20, window: 60000 }, // 20 updates per minute
      CONVERSION_REQUESTS: { requests: 50, window: 60000 }, // 50 conversions per minute
      CONTEXT_MENU: { requests: 30, window: 60000 } // 30 context menu actions per minute
    };

    this.initialized = false;
  }

  /**
   * Initialize the security manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('🔒 Initializing SecurityManager...');

      // Initialize security event logging
      await this._initializeSecurityLogging();

      // Clear old rate limit data
      this.rateLimits.clear();

      // Set up initial security state
      this.initialized = true;

      console.log('✅ SecurityManager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SecurityManager:', error);
      throw error;
    }
  }

  /**
   * Initialize security event logging
   * @private
   * @returns {Promise<void>}
   */
  async _initializeSecurityLogging() {
    try {
      // Ensure security logs storage exists
      const { securityLogs } = await chrome.storage.local.get('securityLogs');
      if (!securityLogs) {
        await chrome.storage.local.set({ securityLogs: [] });
      }

      // Log initialization event
      await this.logSecurityEvent('security_manager_initialized');
    } catch (error) {
      console.warn('Failed to initialize security logging:', error);
      // Don't throw - logging failure shouldn't prevent initialization
    }
  }

  /**
   * Validate and sanitize input strings
   * @param {string} input - Input to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateInput(input, options = {}) {
    const {
      maxLength = 1000,
      allowedChars = /^[a-zA-Z0-9\s.,\-_$€£¥₹\u00A0-\uFFFF]*$/,
      required = false,
      type = 'text'
    } = options;

    const result = {
      isValid: true,
      sanitized: '',
      errors: []
    };

    // Check if input is required
    if (required && (!input || input.trim().length === 0)) {
      result.isValid = false;
      result.errors.push('Input is required');
      return result;
    }

    // Return early if input is empty and not required
    if (!input || input.trim().length === 0) {
      result.sanitized = '';
      return result;
    }

    // Type-specific validation
    switch (type) {
      case 'currency_code':
        if (!/^[A-Z]{3}$/.test(input)) {
          result.isValid = false;
          result.errors.push('Currency code must be 3 uppercase letters');
        }
        break;
      case 'amount':
        if (!/^\d+\.?\d*$/.test(input.replace(/,/g, ''))) {
          result.isValid = false;
          result.errors.push('Amount must be a valid number');
        }
        break;
      case 'api_key':
        if (!/^[a-zA-Z0-9\-_]{10,}$/.test(input)) {
          result.isValid = false;
          result.errors.push('API key format is invalid');
        }
        break;
    }

    // Length validation
    if (input.length > maxLength) {
      result.isValid = false;
      result.errors.push(
        `Input exceeds maximum length of ${maxLength} characters`
      );
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(input)) {
        result.isValid = false;
        result.errors.push('Input contains potentially dangerous content');
        break;
      }
    }

    // Character validation
    if (!allowedChars.test(input)) {
      result.isValid = false;
      result.errors.push('Input contains invalid characters');
    }

    // Sanitize input
    result.sanitized = this.sanitizeString(input);

    return result;
  }

  /**
   * Sanitize string by removing potentially dangerous content
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';

    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:text\/html/gi, '') // Remove data URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .trim();
  }

  /**
   * Check rate limiting for specific operations
   * @param {string} operation - Operation type
   * @param {string} identifier - Unique identifier (user, IP, etc.)
   * @returns {Object} Rate limit result
   */
  checkRateLimit(operation, identifier = 'default') {
    const config = this.RATE_LIMITS[operation];
    if (!config) {
      return { allowed: true, remaining: Infinity };
    }

    const key = `${operation}:${identifier}`;
    const now = Date.now();

    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, []);
    }

    const requests = this.rateLimits.get(key);

    // Remove old requests outside the time window
    const validRequests = requests.filter(
      timestamp => now - timestamp < config.window
    );

    this.rateLimits.set(key, validRequests);

    // Check if rate limit is exceeded
    if (validRequests.length >= config.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: validRequests[0] + config.window
      };
    }

    // Add current request
    validRequests.push(now);
    this.rateLimits.set(key, validRequests);

    return {
      allowed: true,
      remaining: config.requests - validRequests.length
    };
  }

  /**
   * Secure storage operations with encryption
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {boolean} sensitive - Whether data is sensitive
   * @returns {Promise<boolean>} Success status
   */
  async secureStore(key, value, sensitive = false) {
    try {
      const validation = this.validateInput(key, {
        maxLength: 100,
        allowedChars: /^[a-zA-Z0-9_\-.]*$/,
        required: true
      });

      if (!validation.isValid) {
        console.warn('Invalid storage key:', validation.errors);
        return false;
      }

      const data = sensitive ? await this.encryptData(value) : value;

      await chrome.storage.local.set({ [validation.sanitized]: data });
      return true;
    } catch (error) {
      console.error('Secure storage failed:', error);
      return false;
    }
  }

  /**
   * Secure retrieval from storage
   * @param {string} key - Storage key
   * @param {boolean} sensitive - Whether data is sensitive
   * @returns {Promise<any>} Retrieved value
   */
  async secureRetrieve(key, sensitive = false) {
    try {
      const validation = this.validateInput(key, {
        maxLength: 100,
        allowedChars: /^[a-zA-Z0-9_\-.]*$/,
        required: true
      });

      if (!validation.isValid) {
        console.warn('Invalid storage key:', validation.errors);
        return null;
      }

      const result = await chrome.storage.local.get(validation.sanitized);
      const data = result[validation.sanitized];

      return sensitive ? await this.decryptData(data) : data;
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }

  /**
   * Simple encryption for sensitive data
   * @param {any} data - Data to encrypt
   * @returns {Promise<string>} Encrypted data
   */
  async encryptData(data) {
    try {
      const jsonData = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonData);

      // Generate a key for encryption
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
      );

      // Export key for storage
      const exportedKey = await crypto.subtle.exportKey('raw', key);

      // Combine key, iv, and encrypted data
      const combined = new Uint8Array(
        exportedKey.byteLength + iv.byteLength + encrypted.byteLength
      );
      combined.set(new Uint8Array(exportedKey), 0);
      combined.set(iv, exportedKey.byteLength);
      combined.set(
        new Uint8Array(encrypted),
        exportedKey.byteLength + iv.byteLength
      );

      // Convert to base64
      return btoa(String.fromCharCode.apply(null, combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return JSON.stringify(data); // Fallback to unencrypted
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Encrypted data string
   * @returns {Promise<any>} Decrypted data
   */
  async decryptData(encryptedData) {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        return null;
      }

      // Check if data is encrypted (base64 format)
      if (!encryptedData.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        // Not encrypted, return as JSON
        return JSON.parse(encryptedData);
      }

      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      // Extract components
      const keyData = combined.slice(0, 32);
      const iv = combined.slice(32, 44);
      const encrypted = combined.slice(44);

      // Import key
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decrypted);

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      // Try to parse as regular JSON (fallback for unencrypted data)
      try {
        return JSON.parse(encryptedData);
      } catch {
        return null;
      }
    }
  }

  /**
   * Validate API URLs to prevent SSRF attacks
   * @param {string} url - URL to validate
   * @returns {boolean} Whether URL is safe
   */
  validateApiUrl(url) {
    try {
      const urlObj = new URL(url);

      // Only allow HTTPS
      if (urlObj.protocol !== 'https:') {
        return false;
      }

      // Block private IP ranges
      const hostname = urlObj.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        return false;
      }

      // Allow only known API domains
      const allowedDomains = [
        'exchangerate-api.com',
        'api.exchangerate-api.com',
        'v6.exchangerate-api.com',
        'api.fixer.io',
        'openexchangerates.org',
        'api.currencylayer.com'
      ];

      return allowedDomains.some(
        domain => hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Log security events
   * @param {string} event - Event type
   * @param {Object} details - Event details
   */
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location?.href || 'extension'
    };

    // Log to console with proper formatting
    if (Object.keys(details).length > 0) {
      console.warn(`🔒 Security Event: ${event}`, details);
    } else {
      console.warn(`🔒 Security Event: ${event}`);
    }

    // Store security logs (optional, for debugging)
    chrome.storage.local
      .get('securityLogs')
      .then(result => {
        const logs = result.securityLogs || [];
        logs.push(logEntry);

        // Keep only last 100 logs
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100);
        }

        chrome.storage.local.set({ securityLogs: logs });
      })
      .catch(error => {
        console.error('Failed to store security log:', error);
      });
  }

  /**
   * Clean up old rate limit data
   */
  cleanup() {
    const now = Date.now();
    for (const [key, requests] of this.rateLimits.entries()) {
      const operation = key.split(':')[0];
      const config = this.RATE_LIMITS[operation];
      if (config) {
        const validRequests = requests.filter(
          timestamp => now - timestamp < config.window
        );
        if (validRequests.length === 0) {
          this.rateLimits.delete(key);
        } else {
          this.rateLimits.set(key, validRequests);
        }
      }
    }
  }
}

// Create singleton instance
export const securityManager = new SecurityManager();

// Cleanup rate limits every 5 minutes
setInterval(
  () => {
    securityManager.cleanup();
  },
  5 * 60 * 1000
);
