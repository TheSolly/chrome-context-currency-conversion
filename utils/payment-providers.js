/**
 * Payment Provider Integration
 * Flexible payment system supporting multiple providers
 * Designed for global accessibility and easy provider switching
 */

/**
 * Abstract Payment Provider Interface
 */
class PaymentProvider {
  constructor(config) {
    this.config = config;
    this.isInitialized = false;
  }

  async initialize() {
    throw new Error('initialize method must be implemented');
  }

  async createSubscription(planId, userInfo) {
    throw new Error('createSubscription method must be implemented');
  }

  async cancelSubscription(subscriptionId) {
    throw new Error('cancelSubscription method must be implemented');
  }

  async updatePaymentMethod(subscriptionId, paymentMethodId) {
    throw new Error('updatePaymentMethod method must be implemented');
  }

  async getSubscriptionStatus(subscriptionId) {
    throw new Error('getSubscriptionStatus method must be implemented');
  }

  async processOneTimePayment(amount, currency, description) {
    throw new Error('processOneTimePayment method must be implemented');
  }
}

/**
 * Stripe Payment Provider
 */
class StripeProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    this.stripe = null;
  }

  async initialize() {
    try {
      if (typeof window !== 'undefined' && !this.stripe) {
        // Load Stripe.js dynamically
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        // Initialize Stripe
        this.stripe = window.Stripe(this.config.publishableKey);
        this.isInitialized = true;
        console.log('✅ Stripe provider initialized');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Stripe:', error);
      return false;
    }
  }

  async createSubscription(planId, userInfo) {
    try {
      // This would typically involve creating a Checkout Session
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: this.config.priceIds[planId],
          customerEmail: userInfo.email,
          successUrl: chrome.runtime.getURL('popup/popup.html?success=true'),
          cancelUrl: chrome.runtime.getURL('popup/popup.html?cancelled=true')
        })
      });

      const session = await response.json();

      // Redirect to Stripe Checkout
      await this.stripe.redirectToCheckout({
        sessionId: session.id
      });

      return {
        success: true,
        subscriptionId: session.subscription,
        checkoutUrl: session.url
      };
    } catch (error) {
      console.error('❌ Stripe subscription creation failed:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ Stripe cancellation failed:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await fetch(
        `/api/stripe/subscription/${subscriptionId}`
      );
      const subscription = await response.json();

      return {
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      console.error('❌ Failed to get Stripe subscription status:', error);
      throw error;
    }
  }

  async processOneTimePayment(amount, currency, description) {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, description })
      });

      const { clientSecret } = await response.json();

      const result = await this.stripe.confirmCardPayment(clientSecret);

      return {
        success: !result.error,
        paymentId: result.paymentIntent?.id,
        error: result.error?.message
      };
    } catch (error) {
      console.error('❌ Stripe payment failed:', error);
      throw error;
    }
  }
}

/**
 * PayPal Payment Provider
 */
class PayPalProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    this.paypal = null;
  }

  async initialize() {
    try {
      if (typeof window !== 'undefined' && !this.paypal) {
        // Load PayPal SDK
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${this.config.clientId}&vault=true&intent=subscription`;
        script.async = true;

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        this.paypal = window.paypal;
        this.isInitialized = true;
        console.log('✅ PayPal provider initialized');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize PayPal:', error);
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
            createSubscription: function (data, actions) {
              return actions.subscription.create({
                plan_id: this.config.planIds[planId]
              });
            },
            onApprove: function (data, actions) {
              resolve({
                success: true,
                subscriptionId: data.subscriptionID
              });
            },
            onError: function (err) {
              reject(err);
            }
          })
          .render('#paypal-button-container');
      });
    } catch (error) {
      console.error('❌ PayPal subscription creation failed:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/paypal/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ PayPal cancellation failed:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await fetch(
        `/api/paypal/subscription/${subscriptionId}`
      );
      const subscription = await response.json();

      return {
        status: subscription.status,
        currentPeriodEnd: new Date(
          subscription.billing_info.next_billing_time
        ).getTime(),
        cancelAtPeriodEnd: subscription.status === 'CANCELLED'
      };
    } catch (error) {
      console.error('❌ Failed to get PayPal subscription status:', error);
      throw error;
    }
  }

  async processOneTimePayment(amount, currency, description) {
    try {
      return new Promise((resolve, reject) => {
        this.paypal
          .Buttons({
            createOrder: function (data, actions) {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      currency_code: currency,
                      value: amount.toString()
                    },
                    description: description
                  }
                ]
              });
            },
            onApprove: function (data, actions) {
              return actions.order.capture().then(function (details) {
                resolve({
                  success: true,
                  paymentId: details.id,
                  status: details.status
                });
              });
            },
            onError: function (err) {
              reject(err);
            }
          })
          .render('#paypal-button-container');
      });
    } catch (error) {
      console.error('❌ PayPal payment failed:', error);
      throw error;
    }
  }
}

/**
 * Paddle Payment Provider
 */
class PaddleProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    this.paddle = null;
  }

  async initialize() {
    try {
      if (typeof window !== 'undefined' && !this.paddle) {
        // Load Paddle.js
        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/paddle.js';
        script.async = true;

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        this.paddle = window.Paddle;
        this.paddle.Setup({
          vendor: this.config.vendorId,
          debug: this.config.debug || false
        });

        this.isInitialized = true;
        console.log('✅ Paddle provider initialized');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Paddle:', error);
      return false;
    }
  }

  async createSubscription(planId, userInfo) {
    try {
      return new Promise((resolve, reject) => {
        this.paddle.Checkout.open({
          product: this.config.productIds[planId],
          email: userInfo.email,
          country: userInfo.country,
          successCallback: function (data) {
            resolve({
              success: true,
              subscriptionId: data.checkout.id,
              orderId: data.order.id
            });
          },
          closeCallback: function () {
            reject(new Error('Payment cancelled'));
          }
        });
      });
    } catch (error) {
      console.error('❌ Paddle subscription creation failed:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/paddle/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ Paddle cancellation failed:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await fetch(
        `/api/paddle/subscription/${subscriptionId}`
      );
      const subscription = await response.json();

      return {
        status: subscription.state,
        currentPeriodEnd: new Date(subscription.next_payment.date).getTime(),
        cancelAtPeriodEnd: subscription.state === 'cancelled'
      };
    } catch (error) {
      console.error('❌ Failed to get Paddle subscription status:', error);
      throw error;
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
          successCallback: function (data) {
            resolve({
              success: true,
              paymentId: data.checkout.id,
              orderId: data.order.id
            });
          },
          closeCallback: function () {
            reject(new Error('Payment cancelled'));
          }
        });
      });
    } catch (error) {
      console.error('❌ Paddle payment failed:', error);
      throw error;
    }
  }
}

/**
 * Paymob Payment Provider (for Egypt and MENA region)
 */
class PaymobProvider extends PaymentProvider {
  constructor(config) {
    super(config);
  }

  async initialize() {
    try {
      // Paymob doesn't require a client-side SDK for basic integration
      this.isInitialized = true;
      console.log('✅ Paymob provider initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Paymob:', error);
      return false;
    }
  }

  async createSubscription(planId, userInfo) {
    try {
      // Paymob subscription creation via API
      const response = await fetch('/api/paymob/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          userInfo,
          integrationId: this.config.integrationId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to Paymob payment page
        window.open(result.paymentUrl, '_blank');

        return {
          success: true,
          subscriptionId: result.subscriptionId,
          paymentUrl: result.paymentUrl
        };
      }

      throw new Error(result.error);
    } catch (error) {
      console.error('❌ Paymob subscription creation failed:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/paymob/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ Paymob cancellation failed:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await fetch(
        `/api/paymob/subscription/${subscriptionId}`
      );
      const subscription = await response.json();

      return {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.next_billing_date).getTime(),
        cancelAtPeriodEnd: subscription.cancelled
      };
    } catch (error) {
      console.error('❌ Failed to get Paymob subscription status:', error);
      throw error;
    }
  }

  async processOneTimePayment(amount, currency, description) {
    try {
      const response = await fetch('/api/paymob/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency,
          description,
          integrationId: this.config.integrationId
        })
      });

      const result = await response.json();

      if (result.success) {
        window.open(result.paymentUrl, '_blank');

        return {
          success: true,
          paymentId: result.paymentId,
          paymentUrl: result.paymentUrl
        };
      }

      throw new Error(result.error);
    } catch (error) {
      console.error('❌ Paymob payment failed:', error);
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
    return Object.keys(this.providers);
  }
}

/**
 * Payment Configuration Manager
 */
export class PaymentConfigManager {
  constructor() {
    this.configs = {
      stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
        priceIds: {
          PREMIUM: 'price_premium_monthly',
          PRO: 'price_pro_monthly'
        }
      },
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || 'your-paypal-client-id',
        planIds: {
          PREMIUM: 'P-premium-plan-id',
          PRO: 'P-pro-plan-id'
        }
      },
      paddle: {
        vendorId: process.env.PADDLE_VENDOR_ID || 'your-paddle-vendor-id',
        productIds: {
          PREMIUM: 'premium-product-id',
          PRO: 'pro-product-id'
        },
        oneTimeProductId: 'one-time-payment-product-id',
        debug: true
      },
      paymob: {
        integrationId:
          process.env.PAYMOB_INTEGRATION_ID || 'your-paymob-integration-id',
        apiKey: process.env.PAYMOB_API_KEY || 'your-paymob-api-key'
      }
    };
  }

  getConfig(providerId) {
    return this.configs[providerId];
  }

  updateConfig(providerId, config) {
    this.configs[providerId] = { ...this.configs[providerId], ...config };
  }

  validateConfig(providerId) {
    const config = this.configs[providerId];

    if (!config) {
      return { valid: false, error: 'Provider config not found' };
    }

    // Basic validation based on provider requirements
    switch (providerId) {
      case 'stripe':
        if (!config.publishableKey || !config.priceIds) {
          return {
            valid: false,
            error: 'Stripe requires publishableKey and priceIds'
          };
        }
        break;
      case 'paypal':
        if (!config.clientId || !config.planIds) {
          return {
            valid: false,
            error: 'PayPal requires clientId and planIds'
          };
        }
        break;
      case 'paddle':
        if (!config.vendorId || !config.productIds) {
          return {
            valid: false,
            error: 'Paddle requires vendorId and productIds'
          };
        }
        break;
      case 'paymob':
        if (!config.integrationId) {
          return { valid: false, error: 'Paymob requires integrationId' };
        }
        break;
    }

    return { valid: true };
  }
}

// Export payment provider instances
export const paymentConfigManager = new PaymentConfigManager();
