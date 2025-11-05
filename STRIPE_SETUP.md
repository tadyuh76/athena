# Stripe Payment Integration Guide

This document explains how to set up and use the Stripe payment integration in Athena e-commerce.

## Overview

The Athena payment system uses **Stripe** for secure credit card processing. The implementation follows best practices:

- ✅ **PCI Compliant**: Card details never touch your server (handled by Stripe.js)
- ✅ **3D Secure Ready**: Supports SCA (Strong Customer Authentication)
- ✅ **Webhook Verification**: Secure payment confirmation via webhooks
- ✅ **Real Order Creation**: Creates actual orders in database with proper inventory management
- ✅ **PaymentIntent API**: Uses latest Stripe APIs

## Quick Start

### 1. Get Stripe API Keys

1. Sign up at [https://stripe.com](https://stripe.com)
2. Get your test keys from [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
   - **Secret Key** (starts with `sk_test_`)
   - **Publishable Key** (starts with `pk_test_`)

### 2. Run Setup Script

```bash
# From project root
./scripts/setup-stripe.sh
```

This script will:
- Prompt you for your Stripe keys
- Update your `.env` file
- Create `public/js/stripe-config.js` for frontend
- Add necessary files to `.gitignore`

### 3. Setup Webhooks

#### For Local Development:

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   brew install stripe/stripe-brew/stripe  # macOS
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

#### For Production:

1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to send:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the signing secret to your production `.env`

### 4. Start Servers

```bash
# Terminal 1: Start backend API
npm run dev:api

# Terminal 2: Start frontend server
npm run dev:server

# Terminal 3 (if testing locally): Forward webhooks
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## Manual Setup (Alternative)

If you prefer not to use the setup script:

### Backend Environment Variables

Add to `.env` file in project root:

```bash
# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Frontend Configuration

Create `public/js/stripe-config.js`:

```javascript
// Stripe Configuration for Frontend
window.STRIPE_CONFIG = {
  publishableKey: 'pk_test_your_publishable_key_here',
};
```

**⚠️ Important**: Add this file to `.gitignore`:

```bash
echo "public/js/stripe-config.js" >> .gitignore
```

## How It Works

### Payment Flow

```
1. User adds products to cart
   ↓
2. Cart reserves inventory (15-minute hold)
   ↓
3. User proceeds to checkout
   ↓
4. User fills shipping information
   ↓
5. User selects Stripe payment method
   ↓
6. Stripe Elements renders secure card form
   ↓
7. User clicks "Place Order"
   ↓
8. Backend creates Order + PaymentIntent
   ↓
9. Frontend confirms payment with Stripe
   ↓
10. Payment succeeds/fails
   ↓
11. Stripe sends webhook to backend
   ↓
12. Backend updates order & payment status
   ↓
13. Inventory is committed (decremented)
   ↓
14. Cart is cleared
   ↓
15. User sees confirmation page
```

### Architecture

#### Backend (API)

**Files Created:**
- `backend/src/models/OrderModel.ts` - Database operations for orders
- `backend/src/services/OrderService.ts` - Business logic for order creation
- `backend/src/controllers/OrderController.ts` - HTTP request handlers
- `backend/src/controllers/StripeWebhookController.ts` - Webhook event processor
- `backend/src/utils/stripe.ts` - Stripe SDK wrapper

**Key Features:**
1. **Order Creation**:
   - Validates cart has items
   - Checks inventory availability
   - Creates Stripe PaymentIntent
   - Creates order, order_items, order_addresses in database
   - Creates payment record with transaction ID

2. **Inventory Management**:
   - Reserves inventory when adding to cart (optimistic locking)
   - Commits inventory on successful payment (decrements stock)
   - Releases reservations after 15 minutes or on failure

3. **Webhook Handling**:
   - Verifies signature with webhook secret
   - Handles `payment_intent.succeeded` → marks order as "processing"
   - Handles `payment_intent.failed` → marks order as "cancelled"
   - Updates payment and order status atomically

#### Frontend (UI)

**Files Modified:**
- `public/checkout.html` - Added Stripe.js script and card element container
- `public/js/checkout.js` - Integrated Stripe Elements and payment confirmation

**Key Features:**
1. **Stripe Elements Integration**:
   - Loads Stripe.js from CDN
   - Creates and mounts card input element
   - Real-time validation and error display
   - Secure tokenization (card data never sent to your server)

2. **Payment Confirmation**:
   - Creates order via `/api/orders` endpoint
   - Receives `clientSecret` from backend
   - Confirms payment with `stripe.confirmCardPayment()`
   - Includes billing details for fraud prevention

## API Endpoints

### Customer Endpoints

#### Create Order
```http
POST /api/orders
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "shippingInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "555-0123",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  },
  "paymentMethod": "stripe"
}

Response:
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "ATH-20250105-1234",
    "total_amount": 123.45,
    ...
  },
  "clientSecret": "pi_xxx_secret_xxx",
  "message": "Order created successfully"
}
```

#### Get My Orders
```http
GET /api/orders/me
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "orders": [...]
}
```

#### Get Order by ID
```http
GET /api/orders/:id
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "ATH-20250105-1234",
    "items": [...],
    "shipping_address": {...}
  }
}
```

### Admin Endpoints

#### Get All Orders
```http
GET /api/admin/orders
Authorization: Bearer <admin_jwt_token>

Response:
{
  "success": true,
  "orders": [...],
  "role": "admin"
}
```

### Webhook Endpoint

```http
POST /api/webhooks/stripe
Stripe-Signature: <signature>

(Raw body - handled automatically by Stripe CLI or production webhooks)
```

## Testing

### Test Card Numbers

Stripe provides test cards for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |
| 4000 0000 0000 9995 | Declined - insufficient funds |
| 4000 0000 0000 0002 | Declined - card declined |

Use any:
- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Testing Webhooks

1. Make a test purchase with a test card
2. Check webhook logs in Stripe CLI:
   ```
   Ready! Your webhook signing secret is whsec_xxx (^C to quit)
   2025-01-05 10:30:15   --> payment_intent.succeeded [evt_xxx]
   2025-01-05 10:30:15  <--  [200] POST http://localhost:3001/api/webhooks/stripe [evt_xxx]
   ```

3. Check your backend logs for webhook processing:
   ```
   [Stripe Webhook] Received event: payment_intent.succeeded
   [Stripe Webhook] Payment succeeded: pi_xxx
   [Stripe Webhook] Order uuid marked as paid
   ```

4. Verify in Supabase:
   ```sql
   SELECT * FROM orders WHERE order_number = 'ATH-20250105-1234';
   SELECT * FROM payments WHERE order_id = '<order_uuid>';
   ```

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  user_id UUID REFERENCES users(id),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  fulfillment_status fulfillment_status DEFAULT 'unfulfilled',
  subtotal DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  shipping_amount DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  shipping_method VARCHAR(100),
  customer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  payment_provider payment_provider,
  payment_method_type payment_method_type,
  payment_status payment_status,
  amount DECIMAL(10, 2),
  currency_code currency_code,
  transaction_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Best Practices

1. **Never log sensitive data**:
   - ✅ Log transaction IDs
   - ❌ Never log card numbers or CVC

2. **Verify webhook signatures**:
   - Always use `STRIPE_WEBHOOK_SECRET`
   - Prevents replay attacks

3. **Use HTTPS in production**:
   - Stripe webhooks require HTTPS
   - Stripe.js automatically enforces HTTPS

4. **Keep keys secret**:
   - Never commit `.env` to git
   - Never commit `stripe-config.js` to git
   - Use environment variables in production

5. **Use test mode in development**:
   - Test keys (sk_test_, pk_test_) won't charge real cards
   - Switch to live keys (sk_live_, pk_live_) only in production

## Troubleshooting

### "Stripe is not configured" error

**Problem**: Backend shows warning about missing Stripe keys.

**Solution**: Add `STRIPE_SECRET_KEY` to `.env` file and restart backend.

### "Stripe configuration not found" in browser console

**Problem**: Frontend can't find `stripe-config.js`.

**Solution**: Run `./scripts/setup-stripe.sh` or manually create the config file.

### Webhooks not being received

**Problem**: Payment succeeds but order status doesn't update.

**Solution**:
1. Check Stripe CLI is running: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
2. Verify `STRIPE_WEBHOOK_SECRET` in `.env`
3. Check backend logs for webhook errors

### "Card was declined" for test cards

**Problem**: Test card 4242... is being declined.

**Solution**: Make sure you're using test mode keys (`sk_test_` and `pk_test_`), not live keys.

### Order created but inventory not decremented

**Problem**: Order succeeds but stock doesn't change.

**Solution**: Check that webhook is being received. The inventory commit happens in `OrderService.commitInventory()` after payment confirmation.

## Production Checklist

Before going live:

- [ ] Replace test keys with live keys (sk_live_, pk_live_)
- [ ] Set up production webhook endpoint
- [ ] Test with real (low-amount) transactions
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Set up error alerting for failed payments
- [ ] Review Stripe Dashboard for security settings
- [ ] Enable 3D Secure for European cards
- [ ] Configure receipt emails in Stripe Dashboard
- [ ] Add fraud detection rules in Stripe Radar

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Security](https://stripe.com/docs/security/stripe)
- [PCI Compliance](https://stripe.com/docs/security/guide)

## Support

For issues specific to this integration:
1. Check this documentation
2. Review backend logs
3. Check Stripe Dashboard logs
4. Review webhook event history

For Stripe platform issues:
- [Stripe Support](https://support.stripe.com/)
- [Stripe API Status](https://status.stripe.com/)
