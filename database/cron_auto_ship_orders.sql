-- ===========================================================
-- Automatic Order Shipping Cron Job
-- ===========================================================
-- This script creates a PostgreSQL function and schedules it
-- to run daily via pg_cron extension.
--
-- Purpose: Automatically update orders from 'confirmed' to 'shipped'
--          after estimated delivery date is reached (3 days after confirmation)
-- ===========================================================

-- Step 1: Enable pg_cron extension (Supabase has this pre-installed)
-- Run this once in your Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create function to auto-ship orders
CREATE OR REPLACE FUNCTION auto_ship_orders()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update orders that are:
  -- 1. Status = 'confirmed'
  -- 2. Estimated delivery date has been reached or passed
  -- 3. Payment status = 'paid'
  UPDATE orders
  SET
    status = 'shipped',
    fulfillment_status = 'fulfilled',
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) ||
               jsonb_build_object('auto_shipped', true, 'auto_shipped_at', NOW())
  WHERE
    status = 'confirmed'
    AND payment_status = 'paid'
    AND estimated_delivery_date IS NOT NULL
    AND estimated_delivery_date <= CURRENT_DATE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log the operation
  RAISE NOTICE 'Auto-shipped % orders', updated_count;

  -- Optional: Insert into audit log table if you have one
  -- INSERT INTO order_audit_logs (action, affected_orders, created_at)
  -- VALUES ('auto_ship', updated_count, NOW());
END;
$$;

-- Step 3: Schedule the cron job to run daily at 1:00 AM
-- This will automatically ship orders that have reached their delivery date
SELECT cron.schedule(
  'auto-ship-orders',          -- Job name
  '0 1 * * *',                 -- Cron expression: Daily at 1:00 AM UTC
  $$SELECT auto_ship_orders();$$ -- SQL to execute
);

-- ===========================================================
-- Verify Installation
-- ===========================================================
-- Run these queries to verify the cron job is set up:

-- 1. Check if the function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'auto_ship_orders';

-- 2. Check scheduled cron jobs
SELECT * FROM cron.job WHERE jobname = 'auto-ship-orders';

-- 3. Check cron job run history (after some time has passed)
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-ship-orders')
ORDER BY start_time DESC
LIMIT 10;

-- ===========================================================
-- Manual Testing
-- ===========================================================
-- To manually test the function without waiting for cron:
-- SELECT auto_ship_orders();

-- To check which orders would be affected:
-- SELECT id, order_number, status, estimated_delivery_date, created_at
-- FROM orders
-- WHERE status = 'confirmed'
--   AND payment_status = 'paid'
--   AND estimated_delivery_date IS NOT NULL
--   AND estimated_delivery_date <= CURRENT_DATE;

-- ===========================================================
-- Uninstall / Remove Cron Job
-- ===========================================================
-- If you need to remove the cron job:
-- SELECT cron.unschedule('auto-ship-orders');

-- If you need to drop the function:
-- DROP FUNCTION IF EXISTS auto_ship_orders();
