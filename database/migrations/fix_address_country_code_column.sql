-- Migration: Fix user_addresses.country_code column for Vietnamese province names
-- Purpose: Change country_code from CHAR(2) to VARCHAR(100) to store full province/city names
-- Author: System
-- Date: 2025-11-06

-- ============================================================================
-- STEP 1: ALTER COLUMN TYPE
-- ============================================================================

-- Change country_code from CHAR(2) to VARCHAR(100)
-- This allows storing Vietnamese province names like "Thành phố Hồ Chí Minh"
ALTER TABLE user_addresses
ALTER COLUMN country_code TYPE VARCHAR(100);

-- ============================================================================
-- STEP 2: UPDATE COLUMN COMMENT
-- ============================================================================

-- Update comment to reflect Vietnamese usage
COMMENT ON COLUMN user_addresses.country_code IS 'Province/City (Tỉnh/Thành phố) - Vietnamese address format';

-- ============================================================================
-- STEP 3: UPDATE VALIDATION TRIGGER (if exists)
-- ============================================================================

-- Drop existing trigger if it validates country_code format
-- (The trigger might check for 2-character country codes)
DROP TRIGGER IF EXISTS validate_user_address ON user_addresses;

-- Recreate validation trigger for Vietnamese addresses
CREATE OR REPLACE FUNCTION validate_user_address()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate first_name
  IF NEW.first_name IS NULL OR trim(NEW.first_name) = '' THEN
    RAISE EXCEPTION 'Họ là bắt buộc';
  END IF;

  -- Validate last_name
  IF NEW.last_name IS NULL OR trim(NEW.last_name) = '' THEN
    RAISE EXCEPTION 'Tên là bắt buộc';
  END IF;

  -- Validate phone (required for Vietnamese addresses)
  IF NEW.phone IS NULL OR trim(NEW.phone) = '' THEN
    RAISE EXCEPTION 'Số điện thoại là bắt buộc';
  END IF;

  -- Validate phone format
  IF NEW.phone !~ '^[\d\s\-\+\(\)]+$' THEN
    RAISE EXCEPTION 'Số điện thoại chứa ký tự không hợp lệ';
  END IF;

  -- Validate address_line1 (Số nhà + Tên đường)
  IF NEW.address_line1 IS NULL OR trim(NEW.address_line1) = '' THEN
    RAISE EXCEPTION 'Số nhà và tên đường là bắt buộc';
  END IF;

  -- Validate city (Phường/Xã)
  IF NEW.city IS NULL OR trim(NEW.city) = '' THEN
    RAISE EXCEPTION 'Phường/Xã là bắt buộc';
  END IF;

  -- Validate state_province (Quận/Huyện)
  IF NEW.state_province IS NULL OR trim(NEW.state_province) = '' THEN
    RAISE EXCEPTION 'Quận/Huyện là bắt buộc';
  END IF;

  -- Validate country_code (Tỉnh/Thành phố)
  IF NEW.country_code IS NULL OR trim(NEW.country_code) = '' THEN
    RAISE EXCEPTION 'Tỉnh/Thành phố là bắt buộc';
  END IF;

  -- Validate country_code length (max 100 characters)
  IF length(NEW.country_code) > 100 THEN
    RAISE EXCEPTION 'Tỉnh/Thành phố không được vượt quá 100 ký tự';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to user_addresses table
CREATE TRIGGER validate_user_address
  BEFORE INSERT OR UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_address();

-- ============================================================================
-- STEP 4: VERIFICATION QUERY
-- ============================================================================

-- Run this to verify the column type change
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'user_addresses' AND column_name = 'country_code';

-- Expected result:
-- column_name  | data_type        | character_maximum_length
-- country_code | character varying| 100
