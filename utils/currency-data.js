// Currency data and utility functions for settings UI

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
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦', popular: false }
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
  showNotifications: true,
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
