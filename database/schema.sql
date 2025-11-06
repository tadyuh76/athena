-- =============================================
-- Athena Ecommerce Database Schema (Supabase/PostgreSQL)
-- Production-ready design with Supabase-specific features
-- Includes RLS policies, real-time subscriptions, and Edge Functions support
-- =============================================

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";          -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";           -- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";            -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";           -- Accent-insensitive search

-- =============================================
-- CUSTOM TYPES AND ENUMS
-- =============================================

-- User management enums
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE user_role AS ENUM ('customer', 'admin');

-- Order management enums
CREATE TYPE order_status AS ENUM (
  'pending',
  'processing', 
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

-- Payment enums
CREATE TYPE payment_provider AS ENUM ('stripe', 'paypal', 'manual', 'other');
CREATE TYPE payment_method_type AS ENUM (
  'card',
  'paypal_account', 
  'bank_transfer',
  'other'
);
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'paid',
  'failed', 
  'refunded',
  'partially_refunded'
);

-- Fulfillment enums
CREATE TYPE fulfillment_status AS ENUM (
  'unfulfilled',
  'partially_fulfilled',
  'fulfilled',
  'returned'
);

-- Product enums
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');

-- Address enums
CREATE TYPE address_type AS ENUM ('billing', 'shipping', 'both');

-- Discount enums
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping');

-- Inventory enums
CREATE TYPE weight_unit AS ENUM ('kg', 'g', 'lb', 'oz');
CREATE TYPE inventory_movement_type AS ENUM (
  'adjustment',
  'sale',
  'return', 
  'restock',
  'damage',
  'loss'
);


-- Custom domains
CREATE DOMAIN currency_code AS CHAR(3) CHECK (VALUE ~ '^[A-Z]{3}$');

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
-- Stores extended user profile information linked to Supabase authentication
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  status user_status DEFAULT 'active',
  role user_role DEFAULT 'customer',
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories table
-- Hierarchical product categorization with SEO support
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Collections table
-- Curated product collections for marketing campaigns and seasonal themes
CREATE TABLE product_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  theme_name VARCHAR(100), -- e.g., "The White Space Edit"
  hero_image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
-- Core product catalog with sustainability focus for Athena eco-luxury fashion
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES product_collections(id) ON DELETE SET NULL,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  compare_price DECIMAL(10, 2) CHECK (compare_price >= 0),
  cost DECIMAL(10, 2) CHECK (cost >= 0),
  currency_code currency_code DEFAULT 'USD',
  
  -- Physical attributes
  weight_value DECIMAL(10, 3),
  weight_unit weight_unit DEFAULT 'g',
  
  -- Sustainability (Athena specific)
  material_composition JSONB DEFAULT '{}', -- JSON object with material percentages
  care_instructions TEXT,
  sustainability_notes TEXT,
  production_method VARCHAR(255),
  certification_labels JSONB DEFAULT '[]', -- Array of certification labels
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  featured_image_url TEXT,
  
  -- Status and visibility
  status product_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  low_stock_threshold INT DEFAULT 5,
  
  -- Analytics
  rating DECIMAL(2, 1) CHECK (rating >= 1 AND rating <= 5),
  review_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants table
-- Product variations (size, color, etc.) with individual pricing and inventory
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL UNIQUE,
  
  -- Variant attributes
  size VARCHAR(20),
  color VARCHAR(50),
  color_hex VARCHAR(7),
  attributes JSONB DEFAULT '{}',
  
  -- Pricing (inherits from product if null)
  price DECIMAL(10, 2) CHECK (price >= 0),
  compare_price DECIMAL(10, 2) CHECK (compare_price >= 0),
  
  -- Inventory management
  inventory_quantity INT DEFAULT 0 CHECK (inventory_quantity >= 0),
  reserved_quantity INT DEFAULT 0 CHECK (reserved_quantity >= 0),
  
  -- Media and display
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images table
-- Media gallery for products and variants with SEO support
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  caption VARCHAR(500),
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Addresses table
-- Customer shipping and billing addresses with validation support
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type address_type DEFAULT 'both',
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
  
  -- Validation and geocoding
  is_validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  coordinates POINT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Cart Items table
-- Shopping cart items with user/session tracking and inventory reservation
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- For guest carts
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_time DECIMAL(10, 2) NOT NULL CHECK (price_at_time >= 0),
  
  -- Inventory reservation
  inventory_reserved_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint to ensure either user_id or session_id is present
  CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL),
  -- Unique constraints to ensure one cart item per variant per user/session
  CONSTRAINT unique_user_variant UNIQUE (user_id, variant_id),
  CONSTRAINT unique_session_variant UNIQUE (session_id, variant_id)
);

-- Orders table
-- Customer orders with comprehensive tracking from placement to delivery
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE DEFAULT 'ATH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Customer information
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  
  -- Order status tracking
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  fulfillment_status fulfillment_status DEFAULT 'unfulfilled',
  
  -- Financial details
  currency_code currency_code DEFAULT 'USD',
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  
  -- Shipping details
  shipping_method VARCHAR(100),
  estimated_delivery_date DATE DEFAULT NOW() + INTERVAL '1 week',
  
  -- Notes and metadata
  customer_notes TEXT,
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Status timestamps
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items table
-- Line items within orders with product snapshots and fulfillment tracking
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  
  -- Product snapshot (preserves data at time of order)
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100) NOT NULL,
  variant_title VARCHAR(100),
  product_image_url TEXT,
  
  -- Quantities and pricing
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  
  -- Fulfillment tracking
  fulfilled_quantity INT DEFAULT 0 CHECK (fulfilled_quantity >= 0),
  returned_quantity INT DEFAULT 0 CHECK (returned_quantity >= 0),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Addresses table
-- Billing and shipping addresses for orders (snapshot from user addresses)
CREATE TABLE order_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type address_type NOT NULL,
  
  -- Address snapshot
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
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique address types per order
  CONSTRAINT unique_order_address_type UNIQUE (order_id, type)
);

-- Transactions table
-- Payment transaction records with provider tracking
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  provider payment_provider NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'refund')),
  provider_transaction_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency_code currency_code DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')
  ),
  failure_reason TEXT,
  details JSONB, -- Provider response and metadata
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Movements table
-- Audit trail for all inventory changes with reference tracking
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  type inventory_movement_type NOT NULL,
  quantity INT NOT NULL, -- Positive for additions, negative for reductions
  reference_id UUID, -- Reference to related entity (order, shipment, etc.)
  reference_type VARCHAR(50), -- Type of reference ('order', 'shipment', 'manual', etc.)
  stock_before INT NOT NULL,
  stock_after INT NOT NULL,
  notes TEXT,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discounts table
-- Promotional codes and automatic discounts with flexible rules
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE,
  description TEXT,
  
  -- Discount calculation
  type discount_type NOT NULL,
  value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
  
  -- Eligibility conditions
  min_purchase_amount DECIMAL(10, 2),
  min_quantity INT,
  
  -- Usage limitations
  usage_limit INT,
  usage_limit_per_user INT,
  usage_count INT DEFAULT 0,
  
  -- Applicability rules
  applies_to VARCHAR(20) DEFAULT 'all' CHECK (
    applies_to IN ('all', 'products', 'categories', 'collections')
  ),
  applicable_product_ids JSONB DEFAULT '[]',
  applicable_category_ids JSONB DEFAULT '[]',
  applicable_collection_ids JSONB DEFAULT '[]',
  
  -- Validity period
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Usage table
-- Tracks discount redemptions for analytics and usage limits
CREATE TABLE discount_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount_saved DECIMAL(10, 2) NOT NULL CHECK (amount_saved >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent multiple uses of same discount per order
  CONSTRAINT unique_discount_order UNIQUE (discount_id, order_id)
);

-- Product Reviews table
-- Customer reviews and ratings with moderation support
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Review content
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  review TEXT,
  
  -- Review metadata
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reviews per user/product/order combination
  CONSTRAINT unique_user_product_order UNIQUE (user_id, product_id, order_id)
);

create table review_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_review_user_like UNIQUE (review_id, user_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Product Categories indexes
CREATE INDEX idx_categories_slug ON product_categories(slug);
CREATE INDEX idx_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_categories_active_sort ON product_categories(is_active, sort_order);

-- Product Collections indexes
CREATE INDEX idx_collections_slug ON product_collections(slug);
CREATE INDEX idx_collections_active_featured ON product_collections(is_active, is_featured);
CREATE INDEX idx_collections_dates ON product_collections(starts_at, ends_at);

-- Products indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status_published ON products(status, published_at);
CREATE INDEX idx_products_category_status ON products(category_id, status);
CREATE INDEX idx_products_collection ON products(collection_id);
CREATE INDEX idx_products_featured ON products(is_featured, status);
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', name || ' ' || coalesce(description, ''))
);

-- Product Variants indexes
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_inventory ON product_variants(inventory_quantity);
CREATE INDEX idx_variants_active ON product_variants(is_active);

-- Product Images indexes
CREATE INDEX idx_images_product ON product_images(product_id);
CREATE INDEX idx_images_variant ON product_images(variant_id);
CREATE INDEX idx_images_primary ON product_images(product_id, is_primary);

-- User Addresses indexes
CREATE INDEX idx_addresses_user ON user_addresses(user_id);
CREATE INDEX idx_addresses_default ON user_addresses(user_id, is_default);
CREATE INDEX idx_addresses_type ON user_addresses(type);

-- Cart Items indexes
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_cart_items_session ON cart_items(session_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
CREATE INDEX idx_cart_items_variant ON cart_items(variant_id);
CREATE INDEX idx_cart_items_reservation ON cart_items(inventory_reserved_until);

-- Orders indexes
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order Items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);

-- Order Addresses indexes
CREATE INDEX idx_order_addresses_order ON order_addresses(order_id);

-- Payment Methods indexes
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default);

-- Transactions indexes
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method_id);
CREATE INDEX idx_transactions_provider_id ON transactions(provider, provider_transaction_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Shipping Rates indexes
CREATE INDEX idx_shipping_rates_zone ON shipping_rates(zone_id);
CREATE INDEX idx_shipping_rates_active ON shipping_rates(is_active);

-- Shipments indexes
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);

-- Inventory Movements indexes
CREATE INDEX idx_inventory_movements_variant ON inventory_movements(variant_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at DESC);

-- Discounts indexes
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_active ON discounts(is_active);
CREATE INDEX idx_discounts_dates ON discounts(starts_at, ends_at);

-- Discount Usage indexes
CREATE INDEX idx_discount_usage_discount ON discount_usage(discount_id);
CREATE INDEX idx_discount_usage_user ON discount_usage(user_id);

-- Product Reviews indexes
CREATE INDEX idx_reviews_product_status ON product_reviews(product_id, status);
CREATE INDEX idx_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_reviews_featured ON product_reviews(is_featured, status);

-- Review Likes indexes
CREATE INDEX idx_review_likes_review ON review_likes(review_id);
CREATE INDEX idx_review_likes_user ON review_likes(user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables with updated_at columns
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_product_variants_updated_at 
  BEFORE UPDATE ON product_variants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cart_items_updated_at 
  BEFORE UPDATE ON cart_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Function to process inventory changes on order confirmation
CREATE OR REPLACE FUNCTION process_order_inventory() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    -- Reduce inventory
    UPDATE product_variants pv
    SET inventory_quantity = inventory_quantity - oi.quantity
    FROM order_items oi
    WHERE pv.id = oi.variant_id AND oi.order_id = NEW.id;

    -- Log inventory movements
    INSERT INTO inventory_movements (
      variant_id, type, quantity, reference_type, reference_id, 
      stock_before, stock_after
    )
    SELECT 
      oi.variant_id,
      'sale',
      -oi.quantity,
      'order',
      NEW.id,
      pv.inventory_quantity + oi.quantity,
      pv.inventory_quantity
    FROM order_items oi
    JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER process_order_inventory_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION process_order_inventory();


-- =============================================
-- SUPABASE REALTIME SUBSCRIPTIONS
-- =============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;

-- =============================================
-- INITIAL DATA
-- =============================================

-- =============================================
-- PERMISSIONS AND GRANTS
-- =============================================

-- Grant necessary permissions for Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =============================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE users IS 'Extended user profiles linked to Supabase auth.users with role-based access control';
COMMENT ON TABLE products IS 'Core product catalog for Athena eco-luxury fashion with sustainability focus';
COMMENT ON TABLE product_variants IS 'Product variations (size, color, etc.) with individual pricing and inventory tracking';
COMMENT ON TABLE product_categories IS 'Hierarchical product categorization with SEO optimization';
COMMENT ON TABLE product_collections IS 'Curated product collections for marketing campaigns and seasonal themes';
COMMENT ON TABLE orders IS 'Customer orders with comprehensive tracking from placement to delivery';
COMMENT ON TABLE order_items IS 'Individual line items within orders with product snapshots';
COMMENT ON TABLE cart_items IS 'Shopping cart items with user/session tracking and inventory reservation';
COMMENT ON TABLE inventory_movements IS 'Complete audit trail for all inventory changes with reference tracking';
COMMENT ON TABLE transactions IS 'Payment transaction records with multi-provider support';
COMMENT ON TABLE product_reviews IS 'Customer reviews and ratings with moderation workflow';
COMMENT ON TABLE discounts IS 'Promotional codes and automatic discounts with flexible targeting rules';

-- Column-specific comments for complex fields
COMMENT ON COLUMN products.material_composition IS 'JSON object with material percentages, e.g., {"organic_cotton": 80, "recycled_polyester": 20}';
COMMENT ON COLUMN products.certification_labels IS 'Array of sustainability certification labels like ["GOTS", "OEKO-TEX", "B-Corp"]';
COMMENT ON COLUMN orders.metadata IS 'Flexible JSON storage for order-specific data, integrations, and custom fields';
COMMENT ON COLUMN discounts.applicable_product_ids IS 'Array of product UUIDs this discount applies to when applies_to = "products"';
COMMENT ON COLUMN shipments.dimensions IS 'Package dimensions as JSON object: {"length": 10, "width": 8, "height": 6, "unit": "cm"}';