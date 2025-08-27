-- Athena Ecommerce Database Schema (Simplified Version for Testing)
-- Core tables only - no analytics, audit, or email features
CREATE DATABASE IF NOT EXISTS athena_simple CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE athena_simple;
-- =============================================
-- Users Table
-- =============================================
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('customer', 'admin', 'staff') DEFAULT 'customer',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE = InnoDB;
-- =============================================
-- Product Tables
-- =============================================
CREATE TABLE product_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id CHAR(36) NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE
  SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE = InnoDB;
CREATE TABLE product_collections (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  theme_name VARCHAR(100),
  -- "The White Space Edit", "The Architecture Series"
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_active (is_active)
) ENGINE = InnoDB;
CREATE TABLE products (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category_id CHAR(36),
  collection_id CHAR(36),
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2),
  -- Inventory
  stock_quantity INT DEFAULT 0,
  -- Athena specific
  material_composition JSON,
  care_instructions TEXT,
  sustainability_notes TEXT,
  -- Images
  featured_image_url VARCHAR(500),
  -- Status
  status ENUM('draft', 'active', 'archived') DEFAULT 'active',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE
  SET NULL,
    FOREIGN KEY (collection_id) REFERENCES product_collections(id) ON DELETE
  SET NULL,
    INDEX idx_sku (sku),
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_featured (is_featured)
) ENGINE = InnoDB;
CREATE TABLE product_variants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  -- Attributes
  size VARCHAR(20),
  color VARCHAR(50),
  -- Pricing (optional override)
  price DECIMAL(10, 2),
  -- Inventory
  stock_quantity INT DEFAULT 0,
  -- Images
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id),
  INDEX idx_sku (sku),
  INDEX idx_active (is_active)
) ENGINE = InnoDB;
CREATE TABLE product_images (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  variant_id CHAR(36),
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
) ENGINE = InnoDB;
-- =============================================
-- Customer Address Table
-- =============================================
CREATE TABLE user_addresses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  type ENUM('billing', 'shipping', 'both') DEFAULT 'both',
  is_default BOOLEAN DEFAULT FALSE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country_code CHAR(2) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_default (user_id, is_default)
) ENGINE = InnoDB;
-- =============================================
-- Cart Tables
-- =============================================
CREATE TABLE carts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  session_id VARCHAR(255),
  status ENUM('active', 'abandoned', 'converted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_session (session_id),
  INDEX idx_status (status)
) ENGINE = InnoDB;
CREATE TABLE cart_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  cart_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  variant_id CHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_variant (cart_id, variant_id),
  INDEX idx_cart (cart_id)
) ENGINE = InnoDB;
CREATE TABLE wishlists (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  variant_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id, variant_id),
  INDEX idx_user (user_id)
) ENGINE = InnoDB;
-- =============================================
-- Order Tables
-- =============================================
CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id CHAR(36),
  -- Customer info
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  -- Status
  status ENUM(
    'pending',
    'processing',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
  ) DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  -- Shipping
  shipping_method VARCHAR(100),
  tracking_number VARCHAR(255),
  -- Notes
  customer_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
  SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_user (user_id),
    INDEX idx_email (customer_email),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE = InnoDB;
CREATE TABLE order_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  variant_id CHAR(36) NOT NULL,
  -- Product snapshot
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100) NOT NULL,
  variant_title VARCHAR(100),
  -- Pricing
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id)
) ENGINE = InnoDB;
CREATE TABLE order_addresses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  type ENUM('billing', 'shipping') NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country_code CHAR(2) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_order_type (order_id, type),
  INDEX idx_order (order_id)
) ENGINE = InnoDB;
-- =============================================
-- Payment Tables
-- =============================================
CREATE TABLE payment_methods (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  type ENUM('card', 'paypal', 'stripe') NOT NULL,
  -- Provider info
  provider VARCHAR(50) NOT NULL,
  provider_customer_id VARCHAR(255),
  provider_payment_method_id VARCHAR(255),
  -- Display info
  display_name VARCHAR(100),
  last_four VARCHAR(4),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_default (user_id, is_default)
) ENGINE = InnoDB;
CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  type ENUM('payment', 'refund') NOT NULL,
  -- Provider info
  provider VARCHAR(50) NOT NULL,
  provider_transaction_id VARCHAR(255) UNIQUE,
  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency_code CHAR(3) DEFAULT 'USD',
  -- Status
  status ENUM('pending', 'succeeded', 'failed') DEFAULT 'pending',
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_status (status)
) ENGINE = InnoDB;
-- =============================================
-- Shipping Tables
-- =============================================
CREATE TABLE shipping_rates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  -- Rate
  rate DECIMAL(10, 2) NOT NULL,
  -- Conditions
  min_order_amount DECIMAL(10, 2),
  max_order_amount DECIMAL(10, 2),
  -- Delivery time
  delivery_days INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active)
) ENGINE = InnoDB;
-- =============================================
-- Discount Tables
-- =============================================
CREATE TABLE discounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) UNIQUE,
  description TEXT,
  -- Type & value
  type ENUM('percentage', 'fixed_amount') NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  -- Conditions
  min_purchase_amount DECIMAL(10, 2),
  -- Usage
  usage_limit INT,
  usage_count INT DEFAULT 0,
  -- Validity
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active (is_active)
) ENGINE = InnoDB;
CREATE TABLE discount_usage (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  discount_id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  amount_saved DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
  SET NULL,
    UNIQUE KEY unique_discount_order (discount_id, order_id)
) ENGINE = InnoDB;
-- =============================================
-- Reviews Table
-- =============================================
CREATE TABLE product_reviews (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  order_id CHAR(36),
  rating TINYINT NOT NULL CHECK (
    rating BETWEEN 1 AND 5
  ),
  title VARCHAR(255),
  review TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE
  SET NULL,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_product_status (product_id, status),
    INDEX idx_rating (rating)
) ENGINE = InnoDB;
-- =============================================
-- Triggers
-- =============================================
DELIMITER // -- Auto-generate order number
CREATE TRIGGER tr_order_number_generate BEFORE
INSERT ON orders FOR EACH ROW BEGIN IF NEW.order_number IS NULL THEN
SET NEW.order_number = CONCAT(
    'ATH-',
    DATE_FORMAT(NOW(), '%Y%m%d'),
    '-',
    LPAD(FLOOR(RAND() * 10000), 4, '0')
  );
END IF;
END // -- Update inventory when order is confirmed
CREATE TRIGGER tr_update_inventory_on_order
AFTER
UPDATE ON orders FOR EACH ROW BEGIN IF OLD.status != 'confirmed'
  AND NEW.status = 'confirmed' THEN -- For simple version, we update product stock directly
UPDATE products p
  JOIN order_items oi ON p.id = oi.product_id
SET p.stock_quantity = p.stock_quantity - oi.quantity
WHERE oi.order_id = NEW.id;
-- Update variant stock if using variants
UPDATE product_variants pv
  JOIN order_items oi ON pv.id = oi.variant_id
SET pv.stock_quantity = pv.stock_quantity - oi.quantity
WHERE oi.order_id = NEW.id;
END IF;
END // DELIMITER;
-- =============================================
-- Helper Functions
-- =============================================
DELIMITER // -- Generate slug from text
CREATE FUNCTION generate_slug(input_string VARCHAR(255)) RETURNS VARCHAR(255) DETERMINISTIC BEGIN
DECLARE slug VARCHAR(255);
SET slug = LOWER(input_string);
SET slug = REPLACE(slug, ' ', '-');
SET slug = REPLACE(slug, '_', '-');
-- Remove special characters (simplified regex replacement)
SET slug = REPLACE(slug, '&', 'and');
SET slug = REPLACE(slug, '@', 'at');
SET slug = TRIM(
    BOTH '-'
    FROM slug
  );
RETURN slug;
END // -- Calculate order total
CREATE FUNCTION calculate_order_total(
  p_subtotal DECIMAL(10, 2),
  p_tax DECIMAL(10, 2),
  p_shipping DECIMAL(10, 2),
  p_discount DECIMAL(10, 2)
) RETURNS DECIMAL(10, 2) DETERMINISTIC BEGIN RETURN p_subtotal + p_tax + p_shipping - p_discount;
END // DELIMITER;
-- =============================================
-- Views for Quick Access
-- =============================================
-- View for available products with stock
CREATE VIEW v_available_products AS
SELECT p.id,
  p.name,
  p.slug,
  p.price,
  p.stock_quantity,
  pc.name as category_name,
  pcol.name as collection_name,
  p.featured_image_url
FROM products p
  LEFT JOIN product_categories pc ON p.category_id = pc.id
  LEFT JOIN product_collections pcol ON p.collection_id = pcol.id
WHERE p.status = 'active'
  AND p.stock_quantity > 0;
-- View for order summary
CREATE VIEW v_order_summary AS
SELECT o.id,
  o.order_number,
  o.customer_email,
  o.status,
  o.payment_status,
  o.total_amount,
  o.created_at,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_items
FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;
-- =============================================
-- Grant basic permissions
-- =============================================
-- CREATE USER IF NOT EXISTS 'athena_app'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON athena_simple.* TO 'athena_app'@'localhost';
-- FLUSH PRIVILEGES;