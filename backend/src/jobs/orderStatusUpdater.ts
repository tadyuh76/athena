import { supabaseAdmin } from '../utils/supabase';

/**
 * Automatic Order Status Updater
 *
 * Workflow:
 * 1. pending → (manual confirm by admin) → preparing
 * 2. preparing → (manual ship by admin) → shipping
 * 3. shipping → (auto after 2 days) → delivered
 */

/**
 * Move shipping orders to delivered if shipped_at was more than 2 days ago
 */
async function moveShippingToDelivered(): Promise<void> {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Find orders that are shipping and shipped_at is more than 2 days ago
    const { data: orders, error: selectError } = await supabaseAdmin
      .from('orders')
      .select('id, shipped_at')
      .eq('status', 'shipping')
      .not('shipped_at', 'is', null)
      .lt('shipped_at', twoDaysAgo.toISOString());

    if (selectError) {
      console.error('[OrderStatusUpdater] Error selecting shipping orders:', selectError);
      return;
    }

    if (!orders || orders.length === 0) {
      return; // No orders to process, don't log
    }

    console.log(`[OrderStatusUpdater] Moving ${orders.length} shipping order(s) to delivered`);

    const now = new Date().toISOString();
    const orderIds = orders.map(o => o.id);

    // Update all matching orders to delivered status using IN clause for safety
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'delivered',
        fulfillment_status: 'fulfilled',
        delivered_at: now,
        updated_at: now,
      })
      .in('id', orderIds);

    if (updateError) {
      console.error('[OrderStatusUpdater] Error updating orders to delivered:', updateError);
      return;
    }

    console.log(`[OrderStatusUpdater] Successfully moved ${orders.length} order(s) to delivered`);
  } catch (error) {
    console.error('[OrderStatusUpdater] Error in moveShippingToDelivered:', error);
  }
}

/**
 * Run all order status update jobs
 */
export async function updateOrderStatuses(): Promise<void> {
  console.log('[OrderStatusUpdater] Running order status update jobs...');

  await moveShippingToDelivered();

  console.log('[OrderStatusUpdater] Order status update jobs completed');
}

/**
 * Start the order status updater cron job
 * Runs every hour to check for orders that need status updates
 */
export function startOrderStatusUpdater(): NodeJS.Timeout {
  console.log('[OrderStatusUpdater] Starting order status updater cron job (runs every hour)');

  // Run immediately on start
  updateOrderStatuses();

  // Then run every hour (3600000 ms)
  return setInterval(updateOrderStatuses, 3600000);
}
