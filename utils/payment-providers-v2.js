/**
 * Payment Provider Infrastructure
 *
 * Supports multiple payment providers with a unified interface
 * Designed to work globally including regions like Egypt
 */

/**
 * Abstract base class for payment providers
 */
export class PaymentProvider {
  constructor(config) {
    this.config = config;
    this.isInitialized = false;
  }

  async initialize() {
    throw new Error('initialize() must be implemented by payment provider');
  }

  async createSubscription(_planId, _userInfo) {
    throw new Error(
      'createSubscription() must be implemented by payment provider'
    );
  }

  async cancelSubscription(_subscriptionId) {
    throw new Error(
      'cancelSubscription() must be implemented by payment provider'
    );
  }

  async updatePaymentMethod(_subscriptionId, _paymentMethodId) {
    throw new Error(
      'updatePaymentMethod() must be implemented by payment provider'
    );
  }

  async getSubscriptionStatus(_subscriptionId) {
    throw new Error(
      'getSubscriptionStatus() must be implemented by payment provider'
    );
  }

  async processOneTimePayment(_amount, _currency, _description) {
    throw new Error(
      'processOneTimePayment() must be implemented by payment provider'
    );
  }

  getSupportedCountries() {
    throw new Error(
      'getSupportedCountries() must be implemented by payment provider'
    );
  }

  getSupportedCurrencies() {
    throw new Error(
      'getSupportedCurrencies() must be implemented by payment provider'
    );
  }
}

/**
 * Stripe Payment Provider
 * Available in 46+ countries (not Egypt directly)
 */
export class StripeProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    this.stripe = null;
  }

  async initialize() {
    try {
      if (typeof window !== 'undefined' && window.Stripe) {
        this.stripe = window.Stripe(this.config.publishableKey);
        this.isInitialized = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Stripe initialization failed:', error);
      return false;
    }
  }

  async createSubscription(planId, userInfo) {
    try {
      const response = await this.makeApiCall(
        '/api/stripe/create-subscription',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            planId,
            userInfo,
            successUrl: chrome.runtime.getURL('popup/popup.html?success=true'),
            cancelUrl: chrome.runtime.getURL('popup/popup.html?canceled=true')
          })
        }
      );

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const { error } = await this.stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw error;
      }

      return { success: true, sessionId };
    } catch (error) {
      console.error('Stripe subscription creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await this.makeApiCall(
        '/api/stripe/cancel-subscription',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ subscriptionId })
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Stripe subscription cancellation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await this.makeApiCall(
        `/api/stripe/subscription/${subscriptionId}`
      );
      return await response.json();
    } catch (error) {
      console.error('Stripe subscription status check failed:', error);
      return { success: false, error: error.message };
    }
  }

  async processOneTimePayment(amount, currency, description) {
    try {
      const response = await this.makeApiCall(
        '/api/stripe/create-payment-intent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount, currency, description })
        }
      );

      const { clientSecret } = await response.json();

      const { error, paymentIntent } =
        await this.stripe.confirmCardPayment(clientSecret);

      if (error) {
        throw error;
      }

      return { success: true, paymentIntent };
    } catch (error) {
      console.error('Stripe payment failed:', error);
      return { success: false, error: error.message };
    }
  }

  getSupportedCountries() {
    return [
      'US',
      'CA',
      'GB',
      'AU',
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
      'CH',
      'NO',
      'IS',
      'LI',
      'JP',
      'SG',
      'HK',
      'MY',
      'TH',
      'IN',
      'MX',
      'BR',
      'NZ',
      'AE',
      'SA'
    ];
  }

  getSupportedCurrencies() {
    return [
      'USD',
      'EUR',
      'GBP',
      'CAD',
      'AUD',
      'SGD',
      'JPY',
      'INR',
      'MXN',
      'BRL'
    ];
  }

  async makeApiCall(endpoint, options = {}) {
    // In a real implementation, this would make calls to your backend
    // For now, we'll simulate the API calls
    const baseUrl = this.config.apiUrl || 'https://api.yourbackend.com';

    try {
      // Use chrome.runtime for API calls in extension environment
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              action: 'apiCall',
              url: `${baseUrl}${endpoint}`,
              options
            },
            response => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });
      }

      // Fallback to fetch for non-extension environments
      if (typeof globalThis !== 'undefined' && globalThis.fetch) {
        return globalThis.fetch(`${baseUrl}${endpoint}`, options);
      }

      // Mock response for testing
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, mock: true })
      });
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
}

/**
 * PayPal Payment Provider
 * Available in 200+ countries and regions including Egypt
 */
export class PayPalProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    this.paypal = null;
  }

  async initialize() {
    try {
      if (typeof window !== 'undefined' && window.paypal) {
        this.paypal = window.paypal;
        this.isInitialized = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('PayPal initialization failed:', error);
      return false;
    }
  }

  async createSubscription(planId, userInfo) {
    try {
      return new Promise((resolve, reject) => {
        this.paypal
          .Buttons({
            style: {
              shape: 'rect',
              color: 'gold',
              layout: 'vertical',
              label: 'subscribe'
            },
            createSubscription: (data, actions) => {
              return actions.subscription.create({
                plan_id: planId,
                subscriber: {
                  name: {
                    given_name: userInfo.firstName,
                    surname: userInfo.lastName
                  },
                  email_address: userInfo.email
                }
              });
            },
            onApprove: (data, _actions) => {
              resolve({
                success: true,
                subscriptionId: data.subscriptionID
              });
            },
            onError: err => {
              reject(new Error(err.message || 'PayPal subscription failed'));
            }
          })
          .render('#paypal-button-container');
      });
    } catch (error) {
      console.error('PayPal subscription creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await this.makeApiCall(
        '/api/paypal/cancel-subscription',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ subscriptionId })
        }
      );

      return await response.json();
    } catch (error) {
      console.error('PayPal subscription cancellation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await this.makeApiCall(
        `/api/paypal/subscription/${subscriptionId}`
      );
      return await response.json();
    } catch (error) {
      console.error('PayPal subscription status check failed:', error);
      return { success: false, error: error.message };
    }
  }

  async processOneTimePayment(amount, currency, description) {
    try {
      return new Promise((resolve, reject) => {
        this.paypal
          .Buttons({
            createOrder: (data, actions) => {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: amount.toString(),
                      currency_code: currency
                    },
                    description
                  }
                ]
              });
            },
            onApprove: async (data, actions) => {
              const order = await actions.order.capture();
              resolve({ success: true, order });
            },
            onError: err => {
              reject(new Error(err.message || 'PayPal payment failed'));
            }
          })
          .render('#paypal-button-container');
      });
    } catch (error) {
      console.error('PayPal payment failed:', error);
      return { success: false, error: error.message };
    }
  }

  getSupportedCountries() {
    return [
      'US',
      'CA',
      'GB',
      'AU',
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
      'CH',
      'NO',
      'IS',
      'LI',
      'JP',
      'SG',
      'HK',
      'MY',
      'TH',
      'IN',
      'MX',
      'BR',
      'NZ',
      'AE',
      'SA',
      'EG',
      'ZA',
      'AR',
      'CL',
      'CO',
      'PE',
      'UY',
      'VE',
      'CN',
      'KR',
      'TW',
      'PH',
      'ID',
      'VN'
    ];
  }

  getSupportedCurrencies() {
    return [
      'USD',
      'EUR',
      'GBP',
      'CAD',
      'AUD',
      'SGD',
      'JPY',
      'INR',
      'MXN',
      'BRL',
      'EGP'
    ];
  }

  async makeApiCall(endpoint, options = {}) {
    const baseUrl = this.config.apiUrl || 'https://api.yourbackend.com';

    try {
      // Use chrome.runtime for API calls in extension environment
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              action: 'apiCall',
              url: `${baseUrl}${endpoint}`,
              options
            },
            response => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });
      }

      // Fallback to fetch for non-extension environments
      if (typeof globalThis !== 'undefined' && globalThis.fetch) {
        return globalThis.fetch(`${baseUrl}${endpoint}`, options);
      }

      // Mock response for testing
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, message: 'Mock API response' })
      });
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
}

/**
 * Paddle Payment Provider
 * Available globally including Egypt
 */
export class PaddleProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    this.paddle = null;
  }

  async initialize() {
    try {
      if (typeof window !== 'undefined' && window.Paddle) {
        this.paddle = window.Paddle;
        this.paddle.Setup({ vendor: this.config.vendorId });
        this.isInitialized = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Paddle initialization failed:', error);
      return false;
    }
  }

  async createSubscription(planId, userInfo) {
    try {
      return new Promise((resolve, reject) => {
        this.paddle.Checkout.open({
          product: planId,
          email: userInfo.email,
          success: data => {
            resolve({
              success: true,
              subscriptionId: data.checkout.subscription_id
            });
          },
          close: () => {
            reject(new Error('Payment cancelled by user'));
          }
        });
      });
    } catch (error) {
      console.error('Paddle subscription creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await this.makeApiCall(
        '/api/paddle/cancel-subscription',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ subscriptionId })
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Paddle subscription cancellation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await this.makeApiCall(
        `/api/paddle/subscription/${subscriptionId}`
      );
      return await response.json();
    } catch (error) {
      console.error('Paddle subscription status check failed:', error);
      return { success: false, error: error.message };
    }
  }

  async processOneTimePayment(amount, currency, description) {
    try {
      return new Promise((resolve, reject) => {
        this.paddle.Checkout.open({
          method: 'inline',
          product: this.config.oneTimeProductId,
          prices: [`${currency}:${amount}`],
          title: description,
          success: data => {
            resolve({ success: true, order: data });
          },
          close: () => {
            reject(new Error('Payment cancelled by user'));
          }
        });
      });
    } catch (error) {
      console.error('Paddle payment failed:', error);
      return { success: false, error: error.message };
    }
  }

  getSupportedCountries() {
    // Paddle supports most countries globally
    return ['GLOBAL'];
  }

  getSupportedCurrencies() {
    return [
      'USD',
      'EUR',
      'GBP',
      'CAD',
      'AUD',
      'SGD',
      'JPY',
      'INR',
      'MXN',
      'BRL',
      'EGP'
    ];
  }

  async makeApiCall(endpoint, options = {}) {
    const baseUrl = this.config.apiUrl || 'https://api.yourbackend.com';

    try {
      // Use chrome.runtime for API calls in extension environment
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              action: 'apiCall',
              url: `${baseUrl}${endpoint}`,
              options
            },
            response => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });
      }

      // Fallback to fetch for non-extension environments
      if (typeof globalThis !== 'undefined' && globalThis.fetch) {
        return globalThis.fetch(`${baseUrl}${endpoint}`, options);
      }

      // Mock response for testing
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, message: 'Mock API response' })
      });
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
}

/**
 * Paymob Payment Provider
 * Egyptian payment provider supporting local payment methods
 */
export class PaymobProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    this.paymob = null;
  }

  async initialize() {
    try {
      // Paymob typically uses iframe integration
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Paymob initialization failed:', error);
      return false;
    }
  }

  async createSubscription(planId, userInfo) {
    try {
      const response = await this.makeApiCall(
        '/api/paymob/create-subscription',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            planId,
            userInfo,
            currency: 'EGP'
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        // Open Paymob iframe
        window.open(result.paymentUrl, '_blank');
        return result;
      }

      throw new Error(result.error || 'Subscription creation failed');
    } catch (error) {
      console.error('Paymob subscription creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await this.makeApiCall(
        '/api/paymob/cancel-subscription',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ subscriptionId })
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Paymob subscription cancellation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await this.makeApiCall(
        `/api/paymob/subscription/${subscriptionId}`
      );
      return await response.json();
    } catch (error) {
      console.error('Paymob subscription status check failed:', error);
      return { success: false, error: error.message };
    }
  }

  async processOneTimePayment(amount, currency, description) {
    try {
      const response = await this.makeApiCall('/api/paymob/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          currency: currency === 'USD' ? 'EGP' : currency, // Convert to local currency
          description
        })
      });

      const result = await response.json();

      if (result.success) {
        window.open(result.paymentUrl, '_blank');
        return result;
      }

      throw new Error(result.error || 'Payment failed');
    } catch (error) {
      console.error('Paymob payment failed:', error);
      return { success: false, error: error.message };
    }
  }

  getSupportedCountries() {
    return ['EG', 'SA', 'AE', 'KW', 'JO', 'LB', 'PK'];
  }

  getSupportedCurrencies() {
    return ['EGP', 'SAR', 'AED', 'KWD', 'JOD', 'LBP', 'PKR'];
  }

  async makeApiCall(endpoint, options = {}) {
    const baseUrl = this.config.apiUrl || 'https://api.yourbackend.com';

    try {
      // Use chrome.runtime for API calls in extension environment
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              action: 'apiCall',
              url: `${baseUrl}${endpoint}`,
              options
            },
            response => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });
      }

      // Fallback to fetch for non-extension environments
      if (typeof globalThis !== 'undefined' && globalThis.fetch) {
        return globalThis.fetch(`${baseUrl}${endpoint}`, options);
      }

      // Mock response for testing
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, message: 'Mock API response' })
      });
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
}

/**
 * Payment Provider Factory
 */
export class PaymentProviderFactory {
  static getProviders() {
    return {
      stripe: StripeProvider,
      paypal: PayPalProvider,
      paddle: PaddleProvider,
      paymob: PaymobProvider
    };
  }

  static async createProvider(providerId, config) {
    const providers = this.getProviders();
    const ProviderClass = providers[providerId];

    if (!ProviderClass) {
      throw new Error(`Payment provider '${providerId}' not supported`);
    }

    const provider = new ProviderClass(config);
    const initialized = await provider.initialize();

    if (!initialized) {
      throw new Error(`Failed to initialize payment provider '${providerId}'`);
    }

    return provider;
  }

  static getSupportedProviders() {
    return Object.keys(this.getProviders());
  }

  static getProviderForCountry(countryCode) {
    const providers = this.getProviders();
    const supportedProviders = [];

    // Check each provider for country support
    for (const [providerId, ProviderClass] of Object.entries(providers)) {
      const tempProvider = new ProviderClass({});
      const supportedCountries = tempProvider.getSupportedCountries();

      if (
        supportedCountries.includes('GLOBAL') ||
        supportedCountries.includes(countryCode)
      ) {
        supportedProviders.push({
          id: providerId,
          name: providerId.charAt(0).toUpperCase() + providerId.slice(1),
          priority: this.getProviderPriority(providerId, countryCode)
        });
      }
    }

    // Sort by priority (lower number = higher priority)
    return supportedProviders.sort((a, b) => a.priority - b.priority);
  }

  static getProviderPriority(providerId, countryCode) {
    // Define provider priorities based on country
    const priorities = {
      EG: { paymob: 1, paypal: 2, paddle: 3, stripe: 4 },
      US: { stripe: 1, paypal: 2, paddle: 3, paymob: 4 },
      GB: { stripe: 1, paddle: 2, paypal: 3, paymob: 4 },
      default: { paypal: 1, paddle: 2, stripe: 3, paymob: 4 }
    };

    const countryPriorities = priorities[countryCode] || priorities.default;
    return countryPriorities[providerId] || 999;
  }
}

/**
 * Payment Configuration Manager
 */
export class PaymentConfigManager {
  constructor() {
    this.configs = new Map();
  }

  setProviderConfig(providerId, config) {
    this.configs.set(providerId, config);
  }

  getProviderConfig(providerId) {
    return this.configs.get(providerId) || {};
  }

  async loadConfigFromStorage() {
    try {
      const result = await chrome.storage.local.get(['paymentConfigs']);
      if (result.paymentConfigs) {
        this.configs = new Map(Object.entries(result.paymentConfigs));
      }
    } catch (error) {
      console.error('Failed to load payment configs:', error);
    }
  }

  async saveConfigToStorage() {
    try {
      const configObject = Object.fromEntries(this.configs);
      await chrome.storage.local.set({ paymentConfigs: configObject });
    } catch (error) {
      console.error('Failed to save payment configs:', error);
    }
  }

  validateConfig(providerId, config) {
    const requiredFields = {
      stripe: ['publishableKey', 'apiUrl'],
      paypal: ['clientId'],
      paddle: ['vendorId'],
      paymob: ['apiKey', 'integrationId']
    };

    const required = requiredFields[providerId] || [];
    const missing = required.filter(field => !config[field]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required config fields for ${providerId}: ${missing.join(', ')}`
      );
    }

    return true;
  }
}

export default {
  PaymentProvider,
  StripeProvider,
  PayPalProvider,
  PaddleProvider,
  PaymobProvider,
  PaymentProviderFactory,
  PaymentConfigManager
};
