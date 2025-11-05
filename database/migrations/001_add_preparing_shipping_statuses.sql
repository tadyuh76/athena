-- ===========================================================
-- Migration: Add 'preparing' and 'shipping' Order Statuses
-- ===========================================================
-- Purpose: Update order_status enum to use clear, user-facing status names
--
-- Order Workflow:
-- 1. User creates order and pays → 'pending' status
-- 2. Admin confirms order → 'preparing' status
-- 3. Admin manually sets to shipping → 'shipping' status
-- 4. Cron job (2 days after shipping) → 'delivered' status
-- 5. Admin can manually mark as delivered at any time
--
-- Migration Steps:
-- 1. Add new 'preparing' and 'shipping' values to order_status enum
-- 2. Update existing orders: 'confirmed' → 'preparing', 'processing' → 'shipping', 'shipped' → 'delivered'
-- 3. Remove old unused statuses: 'confirmed', 'processing', 'shipped'
-- ===========================================================

-- Step 1: Add new status values to the enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'preparing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'shipping';

-- Step 2: Migrate existing data
-- Update orders from old status names to new ones
UPDATE orders SET status = 'preparing' WHERE status = 'confirmed';
UPDATE orders SET status = 'shipping' WHERE status = 'processing';
UPDATE orders SET status = 'delivered' WHERE status = 'shipped';

-- Step 3: Since PostgreSQL doesn't support removing enum values directly,
-- we need to create a new enum type and migrate to it

-- Create new enum with only the statuses we want
CREATE TYPE order_status_new AS ENUM (
  'pending',
  'preparing',
  'shipping',
  'delivered',
  'cancelled',
  'refunded'
);

-- Update the orders table to use the new enum
ALTER TABLE orders
  ALTER COLUMN status TYPE order_status_new
  USING status::text::order_status_new;

-- Drop old enum and rename new one
DROP TYPE order_status;
ALTER TYPE order_status_new RENAME TO order_status;

-- ===========================================================
-- Verification Queries
-- ===========================================================
-- Check the new enum values:
-- SELECT enum_range(NULL::order_status);

-- Check orders by status:
-- SELECT status, COUNT(*) FROM orders GROUP BY status;

-- ===========================================================
-- Rollback (if needed)
-- ===========================================================
-- To rollback, you would need to:
-- 1. Create the old enum type
-- 2. Migrate data back: 'preparing' → 'confirmed', 'shipping' → 'processing'
-- 3. Switch the column back to the old enum
-- 4. Drop the new enum
-- ===========================================================
