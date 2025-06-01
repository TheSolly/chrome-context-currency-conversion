// Phase 5, Task 5.2: Conversion Cache for Performance Optimization
// Caches frequently used conversions to reduce API calls and improve response time

/**
 * Conversion Cache Manager
 * Handles caching of frequently used currency conversions
 */
export class ConversionCache {
  constructor() {
    this.cache = new Map();
    this.accessCount = new Map();
    this.lastAccess = new Map();

    // Cache configuration
    this.maxCacheSize = 1000; // Maximum number of cached conversions
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes in milliseconds
    this.frequentUsageThreshold = 3; // Consider as frequent after 3 uses

    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };

    // Initialize from localStorage if available
    this.loadFromStorage();

    // Cleanup old entries periodically
    this.setupCleanup();
  }

  /**
   * Generate cache key for a conversion
   */
  generateKey(fromCurrency, toCurrency, amount) {
    // Round amount to avoid cache fragmentation from minor differences
    const roundedAmount = Math.round(amount * 100) / 100;
    return `${fromCurrency}_${toCurrency}_${roundedAmount}`;
  }

  /**
   * Get cached conversion result
   */
  get(fromCurrency, toCurrency, amount) {
    const key = this.generateKey(fromCurrency, toCurrency, amount);
    const now = Date.now();

    this.metrics.totalRequests++;

    if (this.cache.has(key)) {
      const entry = this.cache.get(key);

      // Check if entry is still valid
      if (now - entry.timestamp < this.cacheExpiry) {
        // Update access tracking
        this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
        this.lastAccess.set(key, now);

        this.metrics.hits++;
        console.log(`🎯 Cache hit for ${key}`);
        return entry.result;
      } else {
        // Entry expired, remove it
        this.cache.delete(key);
        this.accessCount.delete(key);
        this.lastAccess.delete(key);
      }
    }

    this.metrics.misses++;
    console.log(`❌ Cache miss for ${key}`);
    return null;
  }

  /**
   * Store conversion result in cache
   */
  set(fromCurrency, toCurrency, amount, result) {
    const key = this.generateKey(fromCurrency, toCurrency, amount);
    const now = Date.now();

    // Check if we need to evict entries
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    // Store the result
    this.cache.set(key, {
      result: result,
      timestamp: now,
      fromCurrency,
      toCurrency,
      amount
    });

    // Initialize access tracking
    this.accessCount.set(key, 1);
    this.lastAccess.set(key, now);

    console.log(`💾 Cached conversion for ${key}`);

    // Save frequently used conversions to localStorage
    this.saveFrequentToStorage();
  }

  /**
   * Evict least recently used entries
   */
  evictLeastRecentlyUsed() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.lastAccess.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessCount.delete(oldestKey);
      this.lastAccess.delete(oldestKey);
      this.metrics.evictions++;
      console.log(`🗑️ Evicted cache entry: ${oldestKey}`);
    }
  }

  /**
   * Check if a conversion is frequently used
   */
  isFrequentlyUsed(fromCurrency, toCurrency, amount) {
    const key = this.generateKey(fromCurrency, toCurrency, amount);
    const count = this.accessCount.get(key) || 0;
    return count >= this.frequentUsageThreshold;
  }

  /**
   * Get frequently used conversions
   */
  getFrequentConversions() {
    const frequent = [];
    for (const [key, count] of this.accessCount.entries()) {
      if (count >= this.frequentUsageThreshold && this.cache.has(key)) {
        const entry = this.cache.get(key);
        frequent.push({
          key,
          count,
          fromCurrency: entry.fromCurrency,
          toCurrency: entry.toCurrency,
          amount: entry.amount,
          lastAccess: this.lastAccess.get(key)
        });
      }
    }

    // Sort by usage count and recency
    return frequent.sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count; // Higher count first
      }
      return b.lastAccess - a.lastAccess; // More recent first
    });
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.cacheExpiry) {
        this.cache.delete(key);
        this.accessCount.delete(key);
        this.lastAccess.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }

    return cleared;
  }

  /**
   * Save frequently used conversions to localStorage
   */
  saveFrequentToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const frequent = this.getFrequentConversions().slice(0, 100); // Keep top 100
        localStorage.setItem(
          'currency_conversion_frequent',
          JSON.stringify(frequent)
        );
      }
    } catch (error) {
      console.warn(
        'Failed to save frequent conversions to localStorage:',
        error
      );
    }
  }

  /**
   * Load cache from localStorage
   */
  loadFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('currency_conversion_cache');
        if (stored) {
          const data = JSON.parse(stored);
          const now = Date.now();

          // Restore valid entries
          for (const [key, entry] of Object.entries(data.cache || {})) {
            if (now - entry.timestamp < this.cacheExpiry) {
              this.cache.set(key, entry);
              this.accessCount.set(key, data.accessCount[key] || 1);
              this.lastAccess.set(key, data.lastAccess[key] || now);
            }
          }

          console.log(
            `📥 Loaded ${this.cache.size} cache entries from storage`
          );
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  saveToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = {
          cache: Object.fromEntries(this.cache),
          accessCount: Object.fromEntries(this.accessCount),
          lastAccess: Object.fromEntries(this.lastAccess),
          timestamp: Date.now()
        };
        localStorage.setItem('currency_conversion_cache', JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Setup periodic cleanup
   */
  setupCleanup() {
    // Clean expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(
        () => {
          this.clearExpired();
          this.saveToStorage();
        },
        5 * 60 * 1000
      );
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.metrics.totalRequests > 0
        ? ((this.metrics.hits / this.metrics.totalRequests) * 100).toFixed(1)
        : '0.0';

    return {
      ...this.metrics,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      frequentConversions: this.getFrequentConversions().length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage of cache
   */
  estimateMemoryUsage() {
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // Approximate string size
      totalSize += JSON.stringify(entry).length * 2;
    }

    return `${(totalSize / 1024).toFixed(1)} KB`;
  } /**
   * Clear all cache data
   */
  clear() {
    this.cache.clear();
    this.accessCount.clear();
    this.lastAccess.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };

    // Clear localStorage if available
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('currency_conversion_cache');
      localStorage.removeItem('currency_conversion_frequent');
    }

    console.log('🧹 Cache cleared completely');
  }
}

// Global cache instance
export const conversionCache = new ConversionCache();

// Expose for debugging
if (typeof window !== 'undefined') {
  window.conversionCache = conversionCache;
}
