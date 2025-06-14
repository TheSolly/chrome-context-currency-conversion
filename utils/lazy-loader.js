/**
 * Lazy Loading Module
 * Phase 5, Task 5.2: Bundle size optimization through dynamic imports and lazy loading
 * Implements code splitting for non-essential features to reduce initial bundle size
 */

/**
 * Lazy loader for modules with caching and error handling
 */
export class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.loadTimes = new Map();
    this.errorCount = new Map();
  }

  /**
   * Lazily load a module with caching
   * @param {string} modulePath - Path to the module
   * @param {string} moduleId - Unique identifier for the module
   * @returns {Promise<Object>} Loaded module
   */
  async loadModule(modulePath, moduleId) {
    // Validate parameters
    if (!modulePath || typeof modulePath !== 'string') {
      throw new Error(`Invalid modulePath: ${modulePath}`);
    }
    if (!moduleId || typeof moduleId !== 'string') {
      throw new Error(`Invalid moduleId: ${moduleId}`);
    }

    // Return cached module if already loaded
    if (this.loadedModules.has(moduleId)) {
      console.log(`📦 Using cached module: ${moduleId}`);
      return this.loadedModules.get(moduleId);
    }

    // Return existing loading promise if already in progress
    if (this.loadingPromises.has(moduleId)) {
      console.log(`⏳ Module already loading: ${moduleId}`);
      return this.loadingPromises.get(moduleId);
    }

    // Start loading the module
    const loadingPromise = this.loadModuleInternal(modulePath, moduleId);
    this.loadingPromises.set(moduleId, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(moduleId, module);
      this.loadingPromises.delete(moduleId);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleId);
      this.incrementErrorCount(moduleId);
      throw error;
    }
  }

  /**
   * Internal module loading with performance tracking
   * @param {string} modulePath - Path to the module
   * @param {string} moduleId - Unique identifier for the module
   * @returns {Promise<Object>} Loaded module
   */
  async loadModuleInternal(modulePath, moduleId) {
    const startTime = performance.now();

    try {
      console.log(`🚀 Lazy loading module: ${moduleId} from ${modulePath}`);

      // Dynamic import with Chrome extension compatibility
      const module = await this.dynamicImport(modulePath);

      const loadTime = performance.now() - startTime;
      this.loadTimes.set(moduleId, loadTime);

      console.log(`✅ Module loaded: ${moduleId} (${loadTime.toFixed(2)}ms)`);
      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      console.error(
        `❌ Failed to load module ${moduleId} (${loadTime.toFixed(2)}ms):`,
        error
      );
      throw new Error(`Failed to load module ${moduleId}: ${error.message}`);
    }
  }

  /**
   * Dynamic import with Chrome extension compatibility
   * @param {string} modulePath - Path to the module
   * @returns {Promise<Object>} Imported module
   */
  async dynamicImport(modulePath) {
    // Validate modulePath
    if (!modulePath || typeof modulePath !== 'string') {
      throw new Error(`Invalid modulePath for dynamic import: ${modulePath}`);
    }

    // For Chrome extensions, we need to use chrome.runtime.getURL for proper resolution
    if (
      typeof chrome !== 'undefined' &&
      chrome.runtime &&
      chrome.runtime.getURL
    ) {
      const fullPath = chrome.runtime.getURL(modulePath);
      console.log(`🔗 Loading module: ${modulePath} -> ${fullPath}`);
      return import(fullPath);
    } else {
      // Fallback for other environments
      console.log(`🔗 Loading module (fallback): ${modulePath}`);
      return import(modulePath);
    }
  } /**
   * Preload modules for better performance
   * @param {Array<Object>} modules - Array of feature configurations from LAZY_FEATURES
   * @returns {Promise<void>}
   */
  async preloadModules(modules) {
    console.log(`🔄 Preloading ${modules.length} modules...`);

    const preloadPromises = modules.map(async featureConfig => {
      if (!featureConfig || !featureConfig.primary) {
        console.warn(
          '⚠️ Invalid feature config for preloading:',
          featureConfig
        );
        return;
      }

      const { primary } = featureConfig;
      if (!primary.path || !primary.id) {
        console.warn(
          '⚠️ Invalid primary config for preloading, missing path or id:',
          primary
        );
        return;
      }

      try {
        console.log(`🔄 Preloading module: ${primary.id} from ${primary.path}`);
        await this.loadModule(primary.path, primary.id);
      } catch (error) {
        console.warn(
          `⚠️ Failed to preload module ${primary.id}:`,
          error.message
        );
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('✅ Preloading completed');
  }

  /**
   * Load feature with fallback
   * @param {string} featureName - Name of the feature
   * @param {Object} featureConfig - Configuration for the feature
   * @returns {Promise<Object>} Loaded feature
   */
  async loadFeature(featureName, featureConfig) {
    // Validate featureConfig
    if (!featureConfig || !featureConfig.primary) {
      throw new Error(
        `Invalid feature config for ${featureName}: missing primary configuration`
      );
    }

    const { primary, fallback, timeout = 5000 } = featureConfig;

    // Validate primary configuration
    if (!primary.path || !primary.id) {
      throw new Error(
        `Invalid primary config for ${featureName}: missing path or id`
      );
    }

    try {
      // Load primary module with timeout
      console.log(`🚀 Loading feature ${featureName} from ${primary.path}`);
      const module = await Promise.race([
        this.loadModule(primary.path, primary.id),
        this.createTimeoutPromise(
          timeout,
          `Feature ${featureName} load timeout`
        )
      ]);

      return module;
    } catch (error) {
      console.warn(
        `⚠️ Primary feature ${featureName} failed, trying fallback:`,
        error.message
      );

      if (fallback && fallback.path && fallback.id) {
        try {
          return await this.loadModule(fallback.path, fallback.id);
        } catch (fallbackError) {
          console.error(
            `❌ Fallback for ${featureName} also failed:`,
            fallbackError.message
          );
          throw new Error(`Feature ${featureName} completely failed to load`);
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Create a timeout promise
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} message - Error message
   * @returns {Promise<never>}
   */
  createTimeoutPromise(timeout, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeout);
    });
  }

  /**
   * Increment error count for a module
   * @param {string} moduleId - Module identifier
   */
  incrementErrorCount(moduleId) {
    const currentCount = this.errorCount.get(moduleId) || 0;
    this.errorCount.set(moduleId, currentCount + 1);
  }

  /**
   * Get module loading statistics
   * @returns {Object} Loading statistics
   */
  getStats() {
    const stats = {
      loadedModules: this.loadedModules.size,
      totalLoadTime: 0,
      averageLoadTime: 0,
      errorCounts: Object.fromEntries(this.errorCount),
      loadTimes: Object.fromEntries(this.loadTimes)
    };

    // Calculate total and average load times
    const loadTimes = Array.from(this.loadTimes.values());
    if (loadTimes.length > 0) {
      stats.totalLoadTime = loadTimes.reduce((sum, time) => sum + time, 0);
      stats.averageLoadTime = stats.totalLoadTime / loadTimes.length;
    }

    return stats;
  }

  /**
   * Clear all caches and reset state
   */
  clearCache() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.loadTimes.clear();
    this.errorCount.clear();
    console.log('🗑️ Lazy loader cache cleared');
  }
}

/**
 * Feature-specific lazy loading configurations
 */
export const LAZY_FEATURES = {
  VISUAL_FEEDBACK: {
    primary: {
      path: 'utils/visual-feedback.js',
      id: 'visual-feedback'
    },
    description: 'Visual feedback animations and UI enhancements'
  },

  CURRENCY_DATA: {
    primary: {
      path: 'utils/currency-data.js',
      id: 'currency-data'
    },
    description: 'Extended currency information and formatting'
  },

  CONVERSION_UTILS: {
    primary: {
      path: 'utils/conversion-utils.js',
      id: 'conversion-utils'
    },
    description: 'Advanced conversion utilities and formatting'
  },

  API_CONFIG_MANAGER: {
    primary: {
      path: 'utils/api-config-manager.js',
      id: 'api-config-manager'
    },
    description: 'API configuration and management utilities'
  }
};

/**
 * Preload configuration for different scenarios
 */
export const PRELOAD_CONFIGS = {
  // Essential modules that should be loaded immediately
  CRITICAL: [LAZY_FEATURES.CONVERSION_UTILS],

  // Modules that can be loaded when the user first interacts
  ON_INTERACTION: [LAZY_FEATURES.VISUAL_FEEDBACK, LAZY_FEATURES.CURRENCY_DATA],

  // Modules that can be loaded in the background when idle
  BACKGROUND: [LAZY_FEATURES.API_CONFIG_MANAGER]
};

// Export singleton instance
export const lazyLoader = new LazyLoader();

/**
 * Initialize lazy loading system
 * @returns {Promise<boolean>} Success status
 */
export async function initializeLazyLoading() {
  console.log('🚀 Initializing lazy loading system...');

  try {
    // Preload critical modules immediately
    if (PRELOAD_CONFIGS.CRITICAL && PRELOAD_CONFIGS.CRITICAL.length > 0) {
      try {
        await lazyLoader.preloadModules(PRELOAD_CONFIGS.CRITICAL);
      } catch (criticalError) {
        console.warn('⚠️ Failed to preload critical modules:', criticalError);
        // Continue despite critical module failure
      }
    }

    // Set up interaction-based loading
    if (typeof document !== 'undefined') {
      const loadOnInteraction = () => {
        if (
          PRELOAD_CONFIGS.ON_INTERACTION &&
          PRELOAD_CONFIGS.ON_INTERACTION.length > 0
        ) {
          try {
            lazyLoader.preloadModules(PRELOAD_CONFIGS.ON_INTERACTION);
          } catch (interactionError) {
            console.warn(
              '⚠️ Failed to preload interaction modules:',
              interactionError
            );
          }
        }

        // Remove listeners after first interaction
        document.removeEventListener('click', loadOnInteraction);
        document.removeEventListener('keydown', loadOnInteraction);
        document.removeEventListener('scroll', loadOnInteraction);
      };

      document.addEventListener('click', loadOnInteraction, { once: true });
      document.addEventListener('keydown', loadOnInteraction, { once: true });
      document.addEventListener('scroll', loadOnInteraction, { once: true });
    }

    // Set up background loading with delay
    setTimeout(() => {
      if (PRELOAD_CONFIGS.BACKGROUND && PRELOAD_CONFIGS.BACKGROUND.length > 0) {
        try {
          lazyLoader.preloadModules(PRELOAD_CONFIGS.BACKGROUND);
        } catch (backgroundError) {
          console.warn(
            '⚠️ Failed to preload background modules:',
            backgroundError
          );
        }
      }
    }, 2000); // 2 second delay

    console.log('✅ Lazy loading system initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize lazy loading:', error);
    return false;
  }
}

/**
 * Lazy load a specific feature
 * @param {string} featureName - Name of the feature from LAZY_FEATURES
 * @returns {Promise<Object>} Loaded feature module
 */
export async function lazyLoadFeature(featureName) {
  // Validate feature name
  if (!featureName || typeof featureName !== 'string') {
    throw new Error(`Invalid feature name: ${featureName}`);
  }

  // Get feature configuration
  const featureConfig = LAZY_FEATURES[featureName];

  if (!featureConfig) {
    throw new Error(`Unknown feature: ${featureName}`);
  }

  console.log(`🔄 Loading feature: ${featureName}`);

  try {
    // Attempt to load the feature
    return await lazyLoader.loadFeature(featureName, featureConfig);
  } catch (error) {
    console.error(`❌ Failed to load feature ${featureName}:`, error);

    // For critical features, provide direct import fallback
    if (featureConfig.primary && featureConfig.primary.path) {
      console.log(`🔄 Attempting direct import for ${featureName}`);
      try {
        if (
          typeof chrome !== 'undefined' &&
          chrome.runtime &&
          chrome.runtime.getURL
        ) {
          const directPath = chrome.runtime.getURL(featureConfig.primary.path);
          return import(directPath);
        }
      } catch (directError) {
        console.error(
          `❌ Direct import also failed for ${featureName}:`,
          directError
        );
      }
    }

    // If all attempts fail, rethrow the original error
    throw error;
  }
}
