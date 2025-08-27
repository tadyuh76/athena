-- Athena Ecommerce Database Schema (MySQL)
-- Production-ready design with scalability and best practices

-- Enable strict mode for better data integrity
SET SQL_MODE = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- Create database
CREATE DATABASE IF NOT EXISTS athena_commerce
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE athena_commerce;

-- =============================================
-- Core User & Authentication Tables
-- =============================================

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive', 'suspended', 'deleted') DEFAULT 'active',
  role ENUM('customer', 'admin', 'staff') DEFAULT 'customer',
  last_login_at TIMESTAMP NULL,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_user_expires (user_id, expires_at)
) ENGINE=InnoDB;

-- =============================================
-- Product Catalog Tables
-- =============================================

CREATE TABLE product_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id CHAR(36) NULL,
  image_url VARCHAR(500),
  meta_title VARCHAR(255),
  meta_description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_parent (parent_id),
  INDEX idx_active_sort (is_active, sort_order)
) ENGINE=InnoDB;

CREATE TABLE product_collections (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  theme_name VARCHAR(100), -- e.g., "The White Space Edit", "The Architecture Series"
  hero_image_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  starts_at TIMESTAMP NULL,
  ends_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_active_featured (is_active, is_featured),
  INDEX idx_dates (starts_at, ends_at)
) ENGINE=InnoDB;

CREATE TABLE products (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  category_id CHAR(36),
  collection_id CHAR(36),
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2),
  cost DECIMAL(10, 2),
  currency_code CHAR(3) DEFAULT 'USD',
  
  -- Inventory tracking
  track_inventory BOOLEAN DEFAULT TRUE,
  allow_backorder BOOLEAN DEFAULT FALSE,
  low_stock_threshold INT DEFAULT 5,
  
  -- Product attributes
  weight_value DECIMAL(10, 3),
  weight_unit ENUM('kg', 'g', 'lb', 'oz') DEFAULT 'g',
  
  -- Sustainability info (Athena specific)
  material_composition JSON, -- {"organic_cotton": 80, "recycled_polyester": 20}
  care_instructions TEXT,
  sustainability_notes TEXT,
  production_method VARCHAR(255),
  certification_labels JSON, -- ["GOTS", "OEKO-TEX", "B-Corp"]
  
  -- SEO & Marketing
  meta_title VARCHAR(255),
  meta_description TEXT,
  featured_image_url VARCHAR(500),
  
  -- Status & Visibility
  status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (collection_id) REFERENCES product_collections(id) ON DELETE SET NULL,
  INDEX idx_sku (sku),
  INDEX idx_slug (slug),
  INDEX idx_status_published (status, published_at),
  INDEX idx_category_status (category_id, status),
  INDEX idx_collection (collection_id),
  INDEX idx_featured (is_featured, status),
  FULLTEXT idx_search (name, description)
) ENGINE=InnoDB;

CREATE TABLE product_variants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  
  -- Variant attributes
  size VARCHAR(20),
  color VARCHAR(50),
  color_hex VARCHAR(7),
  
  -- Pricing (can override product pricing)
  price DECIMAL(10, 2),
  compare_price DECIMAL(10, 2),
  
  -- Inventory
  inventory_quantity INT DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  
  -- Images
  image_url VARCHAR(500),
  
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id),
  INDEX idx_sku (sku),
  INDEX idx_inventory (inventory_quantity),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  variant_id CHAR(36),
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  caption VARCHAR(500),
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  INDEX idx_product (product_id),
  INDEX idx_variant (variant_id),
  INDEX idx_primary (product_id, is_primary)
) ENGINE=InnoDB;

-- =============================================
-- Customer Address & Profile Tables
-- =============================================

CREATE TABLE user_addresses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  type ENUM('billing', 'shipping', 'both') DEFAULT 'both',
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Address fields
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(100),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country_code CHAR(2) NOT NULL,
  phone VARCHAR(20),
  
  -- Validation & tracking
  is_validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_default (user_id, is_default),
  INDEX idx_type (type)
) ENGINE=InnoDB;

CREATE TABLE user_preferences (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  
  -- Communication preferences
  email_marketing BOOLEAN DEFAULT TRUE,
  sms_marketing BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  
  -- Shopping preferences
  preferred_size JSON, -- {"tops": "M", "bottoms": "L"}
  preferred_colors JSON, -- ["black", "white", "navy"]
  
  -- Sustainability preferences (Athena specific)
  show_sustainability_info BOOLEAN DEFAULT TRUE,
  preferred_materials JSON, -- ["organic_cotton", "recycled"]
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Shopping Cart & Wishlist Tables
-- =============================================

CREATE TABLE carts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  session_id VARCHAR(255),
  status ENUM('active', 'abandoned', 'converted', 'merged') DEFAULT 'active',
  
  -- Tracking
  abandoned_at TIMESTAMP NULL,
  reminder_sent_at TIMESTAMP NULL,
  converted_at TIMESTAMP NULL,
  
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_session (session_id),
  INDEX idx_status (status),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  cart_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  variant_id CHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price_at_time DECIMAL(10, 2) NOT NULL,
  
  -- Reserved inventory tracking
  inventory_reserved_until TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_variant (cart_id, variant_id),
  INDEX idx_cart (cart_id),
  INDEX idx_reservation (inventory_reserved_until)
) ENGINE=InnoDB;

CREATE TABLE wishlists (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  variant_id CHAR(36),
  priority INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id, variant_id),
  INDEX idx_user (user_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- =============================================
-- Order Management Tables
-- =============================================

CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id CHAR(36),
  
  -- Customer info (denormalized for guest checkout)
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  
  -- Order status
  status ENUM('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_status ENUM('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded') DEFAULT 'pending',
  fulfillment_status ENUM('unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned') DEFAULT 'unfulfilled',
  
  -- Financials
  currency_code CHAR(3) DEFAULT 'USD',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Shipping info
  shipping_method VARCHAR(100),
  estimated_delivery_date DATE,
  
  -- Tracking
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps
  confirmed_at TIMESTAMP NULL,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_number (order_number),
  INDEX idx_user (user_id),
  INDEX idx_email (customer_email),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  variant_id CHAR(36) NOT NULL,
  
  -- Product info (denormalized)
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100) NOT NULL,
  variant_title VARCHAR(100),
  
  -- Quantities & Pricing
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Fulfillment
  fulfilled_quantity INT DEFAULT 0,
  returned_quantity INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id),
  INDEX idx_product (product_id),
  INDEX idx_variant (variant_id)
) ENGINE=InnoDB;

CREATE TABLE order_addresses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  type ENUM('billing', 'shipping') NOT NULL,
  
  -- Address fields
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(100),
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
) ENGINE=InnoDB;

-- =============================================
-- Payment & Transaction Tables
-- =============================================

CREATE TABLE payment_methods (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  type ENUM('card', 'paypal', 'stripe') NOT NULL,
  
  -- Provider info
  provider VARCHAR(50) NOT NULL, -- 'stripe', 'paypal'
  provider_customer_id VARCHAR(255),
  provider_payment_method_id VARCHAR(255),
  
  -- Display info
  display_name VARCHAR(100), -- "Visa ending in 4242"
  last_four VARCHAR(4),
  brand VARCHAR(50),
  exp_month TINYINT,
  exp_year SMALLINT,
  
  is_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_provider (provider, provider_customer_id),
  INDEX idx_default (user_id, is_default)
) ENGINE=InnoDB;

CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  type ENUM('payment', 'refund', 'partial_refund') NOT NULL,
  
  -- Payment provider info
  provider VARCHAR(50) NOT NULL,
  provider_transaction_id VARCHAR(255) UNIQUE,
  provider_status VARCHAR(50),
  
  -- Financial info
  amount DECIMAL(10, 2) NOT NULL,
  currency_code CHAR(3) DEFAULT 'USD',
  
  -- Payment method used
  payment_method_type VARCHAR(50),
  payment_method_last_four VARCHAR(4),
  
  -- Status
  status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled') DEFAULT 'pending',
  failure_reason TEXT,
  
  -- Metadata
  metadata JSON,
  
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_provider_trans (provider, provider_transaction_id),
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB;

-- =============================================
-- Shipping & Fulfillment Tables
-- =============================================

CREATE TABLE shipping_zones (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  countries JSON, -- ["US", "CA"]
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE shipping_rates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  zone_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Rate calculation
  calculation_type ENUM('flat', 'weight_based', 'price_based') DEFAULT 'flat',
  rate DECIMAL(10, 2) NOT NULL,
  min_weight DECIMAL(10, 3),
  max_weight DECIMAL(10, 3),
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  
  -- Delivery time
  min_delivery_days INT,
  max_delivery_days INT,
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE CASCADE,
  INDEX idx_zone (zone_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE shipments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  
  -- Carrier info
  carrier VARCHAR(100),
  service VARCHAR(100),
  tracking_number VARCHAR(255),
  tracking_url VARCHAR(500),
  
  -- Status
  status ENUM('pending', 'ready', 'in_transit', 'delivered', 'returned', 'lost') DEFAULT 'pending',
  
  -- Weight & dimensions
  weight_value DECIMAL(10, 3),
  weight_unit VARCHAR(10),
  
  -- Timestamps
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_tracking (tracking_number),
  INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE shipment_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  shipment_id CHAR(36) NOT NULL,
  order_item_id CHAR(36) NOT NULL,
  quantity INT NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  INDEX idx_shipment (shipment_id),
  INDEX idx_order_item (order_item_id)
) ENGINE=InnoDB;

-- =============================================
-- Inventory Management Tables
-- =============================================

CREATE TABLE inventory_movements (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  variant_id CHAR(36) NOT NULL,
  type ENUM('adjustment', 'sale', 'return', 'restock', 'damage', 'loss') NOT NULL,
  quantity INT NOT NULL, -- Positive for increase, negative for decrease
  
  -- Reference to related records
  reference_type VARCHAR(50), -- 'order', 'return', 'adjustment'
  reference_id CHAR(36),
  
  -- Stock levels after movement
  stock_before INT NOT NULL,
  stock_after INT NOT NULL,
  
  notes TEXT,
  performed_by CHAR(36),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_variant (variant_id),
  INDEX idx_type (type),
  INDEX idx_reference (reference_type, reference_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =============================================
-- Discount & Promotion Tables
-- =============================================

CREATE TABLE discounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) UNIQUE,
  description TEXT,
  
  -- Discount type & value
  type ENUM('percentage', 'fixed_amount', 'free_shipping') NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  
  -- Conditions
  min_purchase_amount DECIMAL(10, 2),
  min_quantity INT,
  
  -- Usage limits
  usage_limit INT,
  usage_limit_per_user INT,
  usage_count INT DEFAULT 0,
  
  -- Applicable to
  applies_to ENUM('all', 'products', 'categories', 'collections') DEFAULT 'all',
  applicable_product_ids JSON,
  applicable_category_ids JSON,
  applicable_collection_ids JSON,
  
  -- Validity
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_active (is_active),
  INDEX idx_dates (starts_at, ends_at)
) ENGINE=InnoDB;

CREATE TABLE discount_usage (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  discount_id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  amount_saved DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_discount_order (discount_id, order_id),
  INDEX idx_discount (discount_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- =============================================
-- Reviews & Ratings Tables
-- =============================================

CREATE TABLE product_reviews (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  order_id CHAR(36),
  
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  review TEXT,
  
  -- Review metadata
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  
  -- Moderation
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  moderated_at TIMESTAMP NULL,
  moderated_by CHAR(36),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_product_order (user_id, product_id, order_id),
  INDEX idx_product_status (product_id, status),
  INDEX idx_user (user_id),
  INDEX idx_rating (rating),
  INDEX idx_featured (is_featured, status)
) ENGINE=InnoDB;

-- =============================================
-- Analytics & Tracking Tables
-- =============================================

CREATE TABLE product_views (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  referrer_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product (product_id),
  INDEX idx_user (user_id),
  INDEX idx_session (session_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE search_queries (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  user_id CHAR(36),
  session_id VARCHAR(255),
  clicked_position INT,
  clicked_product_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (clicked_product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_session (session_id),
  INDEX idx_created (created_at),
  FULLTEXT idx_query (query)
) ENGINE=InnoDB;

-- =============================================
-- Email & Communication Tables
-- =============================================

CREATE TABLE email_subscriptions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  user_id CHAR(36),
  
  -- Subscription types
  newsletter BOOLEAN DEFAULT TRUE,
  product_updates BOOLEAN DEFAULT TRUE,
  sustainability_updates BOOLEAN DEFAULT TRUE,
  exclusive_offers BOOLEAN DEFAULT TRUE,
  
  -- Status
  status ENUM('active', 'unsubscribed', 'bounced', 'complained') DEFAULT 'active',
  
  -- Tracking
  subscribe_source VARCHAR(100),
  unsubscribe_reason TEXT,
  
  confirmed_at TIMESTAMP NULL,
  unsubscribed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE email_campaigns (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  
  -- Campaign type
  type ENUM('newsletter', 'promotional', 'transactional', 'abandoned_cart') NOT NULL,
  
  -- Stats
  sent_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  unsubscribe_count INT DEFAULT 0,
  
  -- Status
  status ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled') DEFAULT 'draft',
  
  scheduled_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_scheduled (scheduled_at)
) ENGINE=InnoDB;

-- =============================================
-- Audit & System Tables
-- =============================================

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id CHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE system_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSON,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- Create Views for Reporting
-- =============================================

CREATE VIEW v_product_inventory AS
SELECT 
  p.id,
  p.name,
  p.sku,
  pv.id as variant_id,
  pv.sku as variant_sku,
  pv.size,
  pv.color,
  pv.inventory_quantity,
  pv.reserved_quantity,
  (pv.inventory_quantity - pv.reserved_quantity) as available_quantity,
  p.low_stock_threshold,
  CASE 
    WHEN (pv.inventory_quantity - pv.reserved_quantity) <= p.low_stock_threshold THEN TRUE
    ELSE FALSE
  END as is_low_stock
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.status = 'active' AND pv.is_active = TRUE;

CREATE VIEW v_order_summary AS
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as order_count,
  COUNT(DISTINCT user_id) as unique_customers,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
FROM orders
GROUP BY DATE(created_at);

-- =============================================
-- Create initial indexes for performance
-- =============================================

CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_products_search ON products(name, status, published_at);
CREATE INDEX idx_cart_items_reserved ON cart_items(inventory_reserved_until) WHERE inventory_reserved_until IS NOT NULL;

-- =============================================
-- Insert initial data
-- =============================================

-- Default shipping zone for US
INSERT INTO shipping_zones (id, name, countries, is_active) 
VALUES (UUID(), 'United States', '["US"]', TRUE);

-- System settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_name', '"Athena"', 'The name of the ecommerce site'),
('currency', '"USD"', 'Default currency'),
('tax_rate', '0.0875', 'Default tax rate'),
('free_shipping_threshold', '150', 'Order amount for free shipping'),
('low_stock_notification', 'true', 'Enable low stock notifications'),
('abandoned_cart_hours', '24', 'Hours before cart is considered abandoned'),
('session_timeout_minutes', '30', 'Session timeout in minutes'),
('max_login_attempts', '5', 'Maximum failed login attempts before lock');

-- Create stored procedures for common operations

DELIMITER //

CREATE PROCEDURE sp_update_product_rating(IN p_product_id CHAR(36))
BEGIN
  UPDATE products p
  SET p.rating = (
    SELECT AVG(rating)
    FROM product_reviews
    WHERE product_id = p_product_id AND status = 'approved'
  ),
  p.review_count = (
    SELECT COUNT(*)
    FROM product_reviews
    WHERE product_id = p_product_id AND status = 'approved'
  )
  WHERE p.id = p_product_id;
END //

CREATE PROCEDURE sp_reserve_inventory(
  IN p_variant_id CHAR(36),
  IN p_quantity INT,
  IN p_duration_minutes INT
)
BEGIN
  UPDATE product_variants
  SET reserved_quantity = reserved_quantity + p_quantity
  WHERE id = p_variant_id
    AND (inventory_quantity - reserved_quantity) >= p_quantity;
    
  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient inventory';
  END IF;
END //

DELIMITER ;

-- Create triggers for automatic updates

DELIMITER //

CREATE TRIGGER tr_order_number_generate
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.order_number IS NULL THEN
    SET NEW.order_number = CONCAT('ATH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
  END IF;
END //

CREATE TRIGGER tr_update_inventory_on_order
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    UPDATE product_variants pv
    JOIN order_items oi ON pv.id = oi.variant_id
    SET pv.inventory_quantity = pv.inventory_quantity - oi.quantity
    WHERE oi.order_id = NEW.id;
  END IF;
END //

DELIMITER ;

-- Create function for generating slugs
DELIMITER //

CREATE FUNCTION generate_slug(input_string VARCHAR(255)) 
RETURNS VARCHAR(255)
DETERMINISTIC
BEGIN
  DECLARE slug VARCHAR(255);
  SET slug = LOWER(input_string);
  SET slug = REPLACE(slug, ' ', '-');
  SET slug = REPLACE(slug, '_', '-');
  SET slug = REGEXP_REPLACE(slug, '[^a-z0-9-]', '');
  SET slug = REGEXP_REPLACE(slug, '-+', '-');
  SET slug = TRIM(BOTH '-' FROM slug);
  RETURN slug;
END //

DELIMITER ;

-- Add performance monitoring table
CREATE TABLE performance_metrics (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10, 2) NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_metric_date (metric_name, metric_date),
  INDEX idx_metric_date (metric_date)
) ENGINE=InnoDB;

-- Grant appropriate permissions (adjust as needed)
-- CREATE USER IF NOT EXISTS 'athena_app'@'%' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON athena_commerce.* TO 'athena_app'@'%';
-- GRANT EXECUTE ON athena_commerce.* TO 'athena_app'@'%';
-- FLUSH PRIVILEGES;