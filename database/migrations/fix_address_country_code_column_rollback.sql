-- Rollback Migration: Revert user_addresses.country_code column to CHAR(2)
-- WARNING: This will truncate any province names longer than 2 characters!
-- Only use this if you need to revert to ISO country code format

DROP TRIGGER IF EXISTS validate_user_address ON user_addresses;
DROP FUNCTION IF EXISTS validate_user_address();

ALTER TABLE user_addresses
ALTER COLUMN country_code TYPE CHAR(2);

COMMENT ON COLUMN user_addresses.country_code IS 'ISO 3166-1 alpha-2 country code';
