// Enhanced Currency data and utility functions for Task 3.2

// Regional currency groupings for better organization
export const CURRENCY_REGIONS = {
  americas: {
    name: 'Americas',
    flag: '🌎',
    currencies: ['USD', 'CAD', 'BRL', 'ARS', 'MXN', 'CLP', 'COP', 'PEN', 'UYU']
  },
  europe: {
    name: 'Europe',
    flag: '🇪🇺',
    currencies: [
      'EUR',
      'GBP',
      'CHF',
      'NOK',
      'SEK',
      'DKK',
      'PLN',
      'CZK',
      'HUF',
      'RUB',
      'TRY',
      'RON',
      'BGN',
      'HRK',
      'UAH'
    ]
  },
  asia: {
    name: 'Asia & Pacific',
    flag: '🌏',
    currencies: [
      'JPY',
      'CNY',
      'INR',
      'KRW',
      'AUD',
      'NZD',
      'SGD',
      'HKD',
      'THB',
      'PHP',
      'MYR',
      'IDR',
      'VND'
    ]
  },
  africa: {
    name: 'Africa & Middle East',
    flag: '🌍',
    currencies: [
      'ZAR',
      'EGP',
      'NGN',
      'KES',
      'GHS',
      'ILS',
      'AED',
      'SAR',
      'QAR',
      'KWD',
      'BHD',
      'OMR',
      'JOD',
      'LBP'
    ]
  }
};

export const CURRENCY_LIST = [
  // Major currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', popular: true },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', popular: true },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    popular: true
  },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', popular: true },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    popular: true
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    popular: true
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    flag: '🇨🇭',
    popular: true
  },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', popular: true },
  // Other major currencies
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    popular: false
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    flag: '🇧🇷',
    popular: false
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    flag: '🇰🇷',
    popular: false
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    flag: '🇲🇽',
    popular: false
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    popular: false
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    flag: '🇭🇰',
    popular: false
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    flag: '🇳🇴',
    popular: false
  },
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    flag: '🇸🇪',
    popular: false
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    flag: '🇩🇰',
    popular: false
  },
  {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    flag: '🇵🇱',
    popular: false
  },
  {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    flag: '🇨🇿',
    popular: false
  },
  {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    flag: '🇭🇺',
    popular: false
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    flag: '🇷🇺',
    popular: false
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    flag: '🇹🇷',
    popular: false
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    flag: '🇿🇦',
    popular: false
  },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', popular: false },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    flag: '🇵🇭',
    popular: false
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    flag: '🇲🇾',
    popular: false
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    flag: '🇮🇩',
    popular: false
  },
  {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    flag: '🇻🇳',
    popular: false
  },
  {
    code: 'ILS',
    name: 'Israeli Shekel',
    symbol: '₪',
    flag: '🇮🇱',
    popular: false
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    flag: '🇦🇪',
    popular: false
  },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', popular: false },
  {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: '£',
    flag: '🇪🇬',
    popular: false
  },
  {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: '﷼',
    flag: '🇶🇦',
    popular: false
  },

  // Additional currencies for comprehensive coverage
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'د.ك',
    flag: '🇰🇼',
    popular: false
  },
  {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: '.د.ب',
    flag: '🇧🇭',
    popular: false
  },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', flag: '🇴🇲', popular: false },
  {
    code: 'JOD',
    name: 'Jordanian Dinar',
    symbol: 'د.ا',
    flag: '🇯🇴',
    popular: false
  },
  {
    code: 'LBP',
    name: 'Lebanese Pound',
    symbol: 'ل.ل',
    flag: '🇱🇧',
    popular: false
  },

  // More major world currencies
  {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    flag: '🇦🇷',
    popular: false
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    flag: '🇲🇽',
    popular: false
  },
  {
    code: 'CLP',
    name: 'Chilean Peso',
    symbol: '$',
    flag: '🇨🇱',
    popular: false
  },
  {
    code: 'COP',
    name: 'Colombian Peso',
    symbol: '$',
    flag: '🇨🇴',
    popular: false
  },
  {
    code: 'PEN',
    name: 'Peruvian Sol',
    symbol: 'S/',
    flag: '🇵🇪',
    popular: false
  },
  {
    code: 'UYU',
    name: 'Uruguayan Peso',
    symbol: '$U',
    flag: '🇺🇾',
    popular: false
  },

  // European currencies
  {
    code: 'RON',
    name: 'Romanian Leu',
    symbol: 'lei',
    flag: '🇷🇴',
    popular: false
  },
  {
    code: 'BGN',
    name: 'Bulgarian Lev',
    symbol: 'лв',
    flag: '🇧🇬',
    popular: false
  },
  {
    code: 'HRK',
    name: 'Croatian Kuna',
    symbol: 'kn',
    flag: '🇭🇷',
    popular: false
  },
  {
    code: 'UAH',
    name: 'Ukrainian Hryvnia',
    symbol: '₴',
    flag: '🇺🇦',
    popular: false
  },

  // African currencies
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    flag: '🇳🇬',
    popular: false
  },
  {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    flag: '🇰🇪',
    popular: false
  },
  {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: '₵',
    flag: '🇬🇭',
    popular: false
  },

  // Asian currencies
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    flag: '🇳🇿',
    popular: false
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    popular: false
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    flag: '🇭🇰',
    popular: false
  }
];

export function getPopularCurrencies() {
  return CURRENCY_LIST.filter(currency => currency.popular);
}

export function getAllCurrencies() {
  return CURRENCY_LIST;
}

export function getCurrencyByCode(code) {
  return CURRENCY_LIST.find(currency => currency.code === code);
}

export function searchCurrencies(query) {
  const searchTerm = query.toLowerCase();
  return CURRENCY_LIST.filter(
    currency =>
      currency.code.toLowerCase().includes(searchTerm) ||
      currency.name.toLowerCase().includes(searchTerm)
  );
}

// Enhanced search functionality for Task 3.2
export function advancedSearchCurrencies(query, options = {}) {
  const {
    includePopular = true,
    includeAll = true,
    searchInSymbol = false,
    exactMatch = false,
    region = null
  } = options;

  let currencies = CURRENCY_LIST;

  // Filter by popularity
  if (includePopular && !includeAll) {
    currencies = currencies.filter(currency => currency.popular);
  } else if (includeAll && !includePopular) {
    currencies = currencies.filter(currency => !currency.popular);
  }

  // Filter by region
  if (region && CURRENCY_REGIONS[region]) {
    const regionCurrencies = CURRENCY_REGIONS[region].currencies;
    currencies = currencies.filter(currency =>
      regionCurrencies.includes(currency.code)
    );
  }

  // Search functionality
  if (!query) {
    return currencies;
  }

  const searchTerm = query.toLowerCase();

  return currencies.filter(currency => {
    const searchFields = [
      currency.code.toLowerCase(),
      currency.name.toLowerCase()
    ];

    if (searchInSymbol) {
      searchFields.push(currency.symbol.toLowerCase());
    }

    if (exactMatch) {
      return searchFields.some(field => field === searchTerm);
    } else {
      return searchFields.some(field => field.includes(searchTerm));
    }
  });
}

// Get currencies by region
export function getCurrenciesByRegion(region) {
  if (!CURRENCY_REGIONS[region]) {
    return [];
  }

  const regionCurrencies = CURRENCY_REGIONS[region].currencies;
  return CURRENCY_LIST.filter(currency =>
    regionCurrencies.includes(currency.code)
  );
}

// Get currency statistics
export function getCurrencyStats() {
  const total = CURRENCY_LIST.length;
  const popular = CURRENCY_LIST.filter(c => c.popular).length;
  const regions = Object.keys(CURRENCY_REGIONS).length;

  const regionStats = {};
  Object.entries(CURRENCY_REGIONS).forEach(([key, region]) => {
    regionStats[key] = {
      name: region.name,
      count: region.currencies.length
    };
  });

  return {
    total,
    popular,
    regions,
    regionStats
  };
}

// User preferences management
export class CurrencyPreferences {
  constructor() {
    this.favorites = [];
    this.recentlyUsed = [];
    this.customSettings = {};
  }

  // Add currency to favorites
  addToFavorites(currencyCode) {
    if (!this.favorites.includes(currencyCode)) {
      this.favorites.unshift(currencyCode);
      // Limit to 10 favorites
      if (this.favorites.length > 10) {
        this.favorites = this.favorites.slice(0, 10);
      }
    }
  }

  // Remove from favorites
  removeFromFavorites(currencyCode) {
    this.favorites = this.favorites.filter(code => code !== currencyCode);
  }

  // Add to recently used
  addToRecentlyUsed(currencyCode) {
    // Remove if already exists
    this.recentlyUsed = this.recentlyUsed.filter(code => code !== currencyCode);
    // Add to beginning
    this.recentlyUsed.unshift(currencyCode);
    // Limit to 8 recent currencies
    if (this.recentlyUsed.length > 8) {
      this.recentlyUsed = this.recentlyUsed.slice(0, 8);
    }
  }

  // Get favorite currencies with full data
  getFavorites() {
    return this.favorites.map(code => getCurrencyByCode(code)).filter(Boolean);
  }

  // Get recently used currencies with full data
  getRecentlyUsed() {
    return this.recentlyUsed
      .map(code => getCurrencyByCode(code))
      .filter(Boolean);
  }

  // Save to Chrome storage
  async save() {
    try {
      await chrome.storage.sync.set({
        currencyPreferences: {
          favorites: this.favorites,
          recentlyUsed: this.recentlyUsed,
          customSettings: this.customSettings
        }
      });
    } catch (error) {
      console.error('Failed to save currency preferences:', error);
    }
  }

  // Load from Chrome storage
  async load() {
    try {
      const result = await chrome.storage.sync.get(['currencyPreferences']);
      if (result.currencyPreferences) {
        this.favorites = result.currencyPreferences.favorites || [];
        this.recentlyUsed = result.currencyPreferences.recentlyUsed || [];
        this.customSettings = result.currencyPreferences.customSettings || {};
      }
    } catch (error) {
      console.error('Failed to load currency preferences:', error);
    }
  }
}

// Currency validation functions
export function validateCurrencyCode(code) {
  const currency = getCurrencyByCode(code);
  return {
    valid: !!currency,
    currency: currency || null,
    error: currency ? null : `Currency code '${code}' not found`
  };
}

export function validateCurrencySelection(
  baseCurrency,
  secondaryCurrency,
  additionalCurrencies = []
) {
  const errors = [];
  const warnings = [];

  // Validate base currency
  const baseValidation = validateCurrencyCode(baseCurrency);
  if (!baseValidation.valid) {
    errors.push(`Invalid base currency: ${baseValidation.error}`);
  }

  // Validate secondary currency
  const secondaryValidation = validateCurrencyCode(secondaryCurrency);
  if (!secondaryValidation.valid) {
    errors.push(`Invalid secondary currency: ${secondaryValidation.error}`);
  }

  // Check for duplicates
  if (baseCurrency === secondaryCurrency) {
    errors.push('Base and secondary currencies cannot be the same');
  }

  // Validate additional currencies
  const allCurrencies = [
    baseCurrency,
    secondaryCurrency,
    ...additionalCurrencies
  ];
  const duplicates = allCurrencies.filter(
    (item, index) => allCurrencies.indexOf(item) !== index
  );
  if (duplicates.length > 0) {
    errors.push(`Duplicate currencies found: ${duplicates.join(', ')}`);
  }

  // Check additional currencies
  additionalCurrencies.forEach(code => {
    const validation = validateCurrencyCode(code);
    if (!validation.valid) {
      errors.push(`Invalid additional currency: ${validation.error}`);
    }
  });

  // Warnings for popular currencies
  const popularCodes = getPopularCurrencies().map(c => c.code);
  if (!popularCodes.includes(baseCurrency)) {
    warnings.push(
      `Base currency '${baseCurrency}' is not in popular currencies list`
    );
  }
  if (!popularCodes.includes(secondaryCurrency)) {
    warnings.push(
      `Secondary currency '${secondaryCurrency}' is not in popular currencies list`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Currency formatting function
export function formatCurrencyOption(currency) {
  return `${currency.flag} ${currency.code} - ${currency.name}`;
}

// Default settings for the extension
export const DEFAULT_SETTINGS = {
  baseCurrency: 'USD',
  secondaryCurrency: 'EUR',
  additionalCurrencies: ['GBP', 'JPY', 'CAD'],
  showConfidence: true,
  autoConvert: false,
  showNotifications: false, // Premium feature - disabled by default
  theme: 'light',
  precision: 2,
  enableKeyboardShortcuts: true,
  contextMenuPosition: 'smart'
};

// Feature flags for different versions
export const FEATURES = {
  FREE: {
    maxCurrencies: 3,
    conversionHistory: false,
    realTimeRates: false,
    notifications: false,
    themes: false,
    exportData: false
  },
  PREMIUM: {
    maxCurrencies: 10,
    conversionHistory: true,
    realTimeRates: true,
    notifications: true,
    themes: true,
    exportData: true
  }
};
