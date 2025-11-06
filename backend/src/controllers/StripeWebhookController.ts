import { IncomingMessage, ServerResponse } from 'http';
import { constructWebhookEvent } from '../utils/stripe';
import { OrderService } from '../services/OrderService';
import { sendJSON, sendError } from '../utils/request-handler';
import { supabaseAdmin } from '../utils/supabase';

export class StripeWebhookController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(req: IncomingMessage, res: ServerResponse) {
    try {
      // Get webhook secret from environment
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return sendError(res, 500, 'Webhook not configured');
      }

      // Get raw body and signature
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        return sendError(res, 400, 'Missing stripe-signature header');
      }

      // Read raw body
      const rawBody = await this.getRawBody(req);

      // Construct and verify webhook event
      const event = constructWebhookEvent(rawBody, signature, webhookSecret);

      console.log(`[Stripe Webhook] Received event: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'checkout.session.expired':
          await this.handleCheckoutSessionExpired(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object);
          break;

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      // Return success
      sendJSON(res, 200, { received: true });
    } catch (error) {
      console.error('[Stripe Webhook] Error:', error);
      sendError(
        res,
        400,
        error instanceof Error ? error.message : 'Webhook handling failed'
      );
    }
  }

  /**
   * Handle Stripe Checkout Session completed
   * This is triggered when a customer completes the Checkout Session payment
   */
  private async handleCheckoutSessionCompleted(session: any) {
    try {
      console.log(
        `[Stripe Webhook] Checkout session completed: ${session.id}`
      );

      // Find order by transaction provider_transaction_id (session.id)
      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .select('order_id')
        .eq('provider_transaction_id', session.id)
        .single();

      if (error || !transaction) {
        console.error(
          `[Stripe Webhook] Order not found for checkout session: ${session.id}`
        );
        return;
      }

      const orderId = transaction.order_id;

      // Update transaction status to completed
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('provider_transaction_id', session.id);

      // Update order payment status to paid
      await this.orderService.updatePaymentStatus(orderId, 'paid');

      // Commit inventory (move from reserved to committed)
      await this.orderService.commitOrderInventory(orderId);

      // Clean up temporary cart items created for Buy Now reservations
      await this.cleanupBuyNowCartItems(orderId);

      console.log(
        `[Stripe Webhook] Order ${orderId} marked as paid and inventory committed`
      );
    } catch (error) {
      console.error('[Stripe Webhook] Error handling checkout session completed:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe Checkout Session expired
   * This is triggered when a checkout session expires without payment
   */
  private async handleCheckoutSessionExpired(session: any) {
    try {
      console.log(
        `[Stripe Webhook] Checkout session expired: ${session.id}`
      );

      // Find order by transaction provider_transaction_id (session.id)
      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .select('order_id')
        .eq('provider_transaction_id', session.id)
        .single();

      if (error || !transaction) {
        console.error(
          `[Stripe Webhook] Order not found for expired session: ${session.id}`
        );
        return;
      }

      const orderId = transaction.order_id;

      // Update transaction status to cancelled
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('provider_transaction_id', session.id);

      // Update order payment status to failed (which will cancel the order)
      await this.orderService.updatePaymentStatus(orderId, 'failed');

      // Release reserved inventory back to available stock
      await this.orderService.releaseOrderInventory(orderId);

      console.log(
        `[Stripe Webhook] Order ${orderId} marked as cancelled and inventory released`
      );
    } catch (error) {
      console.error('[Stripe Webhook] Error handling checkout session expired:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentIntentSucceeded(paymentIntent: any) {
    try {
      console.log(
        `[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`
      );

      // Find order by payment transaction ID
      const { data: payment, error } = await supabaseAdmin
        .from('payments')
        .select('order_id')
        .eq('transaction_id', paymentIntent.id)
        .single();

      if (error || !payment) {
        console.error(
          `[Stripe Webhook] Order not found for payment: ${paymentIntent.id}`
        );
        return;
      }

      // Update payment status to paid
      await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_id', paymentIntent.id);

      // Update order status
      await this.orderService.updatePaymentStatus(payment.order_id, 'paid');

      console.log(
        `[Stripe Webhook] Order ${payment.order_id} marked as paid`
      );
    } catch (error) {
      console.error('[Stripe Webhook] Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentIntentFailed(paymentIntent: any) {
    try {
      console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);

      // Find order by payment transaction ID
      const { data: payment, error } = await supabaseAdmin
        .from('payments')
        .select('order_id')
        .eq('transaction_id', paymentIntent.id)
        .single();

      if (error || !payment) {
        console.error(
          `[Stripe Webhook] Order not found for payment: ${paymentIntent.id}`
        );
        return;
      }

      // Update payment status to failed
      await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_id', paymentIntent.id);

      // Update order status to cancelled
      await this.orderService.updatePaymentStatus(payment.order_id, 'failed');

      // Release reserved inventory back to available stock
      await this.orderService.releaseOrderInventory(payment.order_id);

      console.log(
        `[Stripe Webhook] Order ${payment.order_id} marked as failed and inventory released`
      );
    } catch (error) {
      console.error('[Stripe Webhook] Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentIntentCanceled(paymentIntent: any) {
    try {
      console.log(`[Stripe Webhook] Payment canceled: ${paymentIntent.id}`);

      // Same as failed payment
      await this.handlePaymentIntentFailed(paymentIntent);
    } catch (error) {
      console.error('[Stripe Webhook] Error handling payment cancel:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary cart items created for Buy Now reservations
   */
  private async cleanupBuyNowCartItems(orderId: string): Promise<void> {
    try {
      // Get order items to find variant IDs
      const { data: orderItems, error } = await supabaseAdmin
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', orderId);

      if (error || !orderItems || orderItems.length === 0) {
        console.log(`[Stripe Webhook] No order items found for cleanup: ${orderId}`);
        return;
      }

      // Delete temporary cart items for each variant in the order
      for (const item of orderItems) {
        await supabaseAdmin
          .from('cart_items')
          .delete()
          .eq('variant_id', item.variant_id)
          .or(`session_id.eq.buynow_${orderId},user_id.is.null`);
      }

      console.log(`[Stripe Webhook] Cleaned up temporary cart items for order ${orderId}`);
    } catch (error) {
      console.error('[Stripe Webhook] Error cleaning up cart items:', error);
      // Don't throw - this is cleanup and shouldn't fail the webhook
    }
  }

  /**
   * Read raw body from request (needed for Stripe signature verification)
   */
  private async getRawBody(req: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      req.on('error', (error) => {
        reject(error);
      });
    });
  }
}
