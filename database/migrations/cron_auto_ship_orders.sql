-- ===========================================================
-- Automatic Order Delivery Cron Job
-- ===========================================================
-- This script creates a PostgreSQL function and schedules it
-- to run daily via pg_cron extension.
--
-- Purpose: Automatically update orders from 'shipping' to 'delivered'
--          2 days after the order was marked as shipping (shipped_at timestamp)
--
-- NOTE: This is a reference implementation for Supabase pg_cron.
--       The actual cron job is implemented in backend/src/jobs/orderStatusUpdater.ts
--       which runs every hour via Node.js setInterval.
-- ===========================================================

-- Step 1: Enable pg_cron extension (Supabase has this pre-installed)
-- Run this once in your Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create function to auto-deliver orders
CREATE OR REPLACE FUNCTION auto_deliver_orders()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
  two_days_ago TIMESTAMP;
BEGIN
  -- Calculate timestamp for 2 days ago
  two_days_ago := NOW() - INTERVAL '2 days';

  -- Update orders that are:
  -- 1. Status = 'shipping'
  -- 2. shipped_at timestamp is more than 2 days ago
  -- 3. Payment status = 'paid'
  UPDATE orders
  SET
    status = 'delivered',
    fulfillment_status = 'fulfilled',
    delivered_at = NOW(),
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) ||
               jsonb_build_object('auto_delivered', true, 'auto_delivered_at', NOW())
  WHERE
    status = 'shipping'
    AND payment_status = 'paid'
    AND shipped_at IS NOT NULL
    AND shipped_at < two_days_ago;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log the operation
  RAISE NOTICE 'Auto-delivered % orders', updated_count;

  -- Optional: Insert into audit log table if you have one
  -- INSERT INTO order_audit_logs (action, affected_orders, created_at)
  -- VALUES ('auto_deliver', updated_count, NOW());
END;
$$;

-- Step 3: Schedule the cron job to run every hour
-- This will automatically deliver orders that have been shipping for 2+ days
SELECT cron.schedule(
  'auto-deliver-orders',          -- Job name
  '0 * * * *',                    -- Cron expression: Every hour at minute 0
  $$SELECT auto_deliver_orders();$$ -- SQL to execute
);

-- ===========================================================
-- Verify Installation
-- ===========================================================
-- Run these queries to verify the cron job is set up:

-- 1. Check if the function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'auto_deliver_orders';

-- 2. Check scheduled cron jobs
SELECT * FROM cron.job WHERE jobname = 'auto-deliver-orders';

-- 3. Check cron job run history (after some time has passed)
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-deliver-orders')
ORDER BY start_time DESC
LIMIT 10;

-- ===========================================================
-- Manual Testing
-- ===========================================================
-- To manually test the function without waiting for cron:
-- SELECT auto_deliver_orders();

-- To check which orders would be affected:
-- SELECT id, order_number, status, shipped_at, created_at
-- FROM orders
-- WHERE status = 'shipping'
--   AND payment_status = 'paid'
--   AND shipped_at IS NOT NULL
--   AND shipped_at < (NOW() - INTERVAL '2 days');

-- ===========================================================
-- Uninstall / Remove Cron Job
-- ===========================================================
-- If you need to remove the cron job:
-- SELECT cron.unschedule('auto-deliver-orders');

-- If you need to drop the function:
-- DROP FUNCTION IF EXISTS auto_deliver_orders();
