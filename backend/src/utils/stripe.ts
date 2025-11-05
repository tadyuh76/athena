import Stripe from 'stripe';

// Initialize Stripe with API key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY not found in environment variables. Stripe payments will not work.');
}

// Create Stripe instance (will be null if no key provided)
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    })
  : null;

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}

/**
 * Create a Stripe PaymentIntent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    throw new Error(
      `Failed to create Stripe PaymentIntent: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retrieve a PaymentIntent by ID
 */
export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    throw new Error(
      `Failed to retrieve PaymentIntent: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Confirm a PaymentIntent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const params: Stripe.PaymentIntentConfirmParams = {};
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
    }

    return await stripe.paymentIntents.confirm(paymentIntentId, params);
  } catch (error) {
    throw new Error(
      `Failed to confirm PaymentIntent: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(
  orderId: string,
  amount: number,
  currency: string = 'usd',
  customerEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Order #' + orderId.slice(0, 8),
              description: 'Athena Order',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        order_id: orderId,
      },
    });

    return session;
  } catch (error) {
    throw new Error(
      `Failed to create Stripe Checkout Session: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Construct event from webhook
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    throw new Error(
      `Failed to construct webhook event: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
