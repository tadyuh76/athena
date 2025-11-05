# Stripe Setup Guide

Quick guide to set up Stripe Checkout payments for Athena.

## 1. Get Stripe Keys

1. Sign up at [stripe.com](https://stripe.com)
2. Go to [Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)
3. Copy your test keys:
   - **Secret Key** (starts with `sk_test_`)
   - **Publishable Key** (starts with `pk_test_`)

## 2. Add Keys to Environment

Add to `.env` file in project root:

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

## 3. Start Development Servers

```bash
npm run dev
```

That's it! The checkout now redirects to Stripe's hosted checkout page.

## Test Cards

Use these cards for testing:

- **Success**: `4242 4242 4242 4242`
- **3D Secure**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

Use any future expiry (e.g., 12/34), any CVC (e.g., 123), any ZIP (e.g., 12345).

## How It Works

1. User fills checkout form → clicks "Đặt Hàng"
2. Backend creates order in database + Stripe Checkout Session
3. User redirects to Stripe's hosted payment page
4. After payment, Stripe redirects back to success/cancel page
5. Inventory updates automatically

## Production Setup

Before going live:

1. Replace test keys with live keys in `.env`:

   ```bash
   STRIPE_SECRET_KEY=sk_live_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
   ```

2. Set up webhook endpoint in [Stripe Dashboard](https://dashboard.stripe.com/webhooks):
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.expired`
   - Copy webhook signing secret to `.env`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
     ```

## Troubleshooting

**"Stripe is not configured"**: Add `STRIPE_SECRET_KEY` to `.env` and restart backend.

**Payment works but order not updating**: Set up webhooks (see Production Setup step 2).

stripe listen --forward-to localhost:3001/api/webhooks/stripe
