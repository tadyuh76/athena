-- Athena Ecommerce Database Schema (Supabase/PostgreSQL)
-- Production-ready design with Supabase-specific features
-- Includes RLS policies, real-time subscriptions, and Edge Functions support

-- =============================================
-- Enable necessary extensions
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For accent-insensitive search

-- =============================================
-- Custom types and domains
-- =============================================

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'staff');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE fulfillment_status AS ENUM ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE address_type AS ENUM ('billing', 'shipping', 'both');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping');
CREATE TYPE weight_unit AS ENUM ('kg', 'g', 'lb', 'oz');

-- Currency code validation
CREATE DOMAIN currency_code AS CHAR(3) CHECK (VALUE ~ '^[A-Z]{3}$');

-- =============================================
-- Core User & Authentication Tables
-- =============================================

-- Users table (extends Supabase auth.users)
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

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer');

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- Product Catalog Tables
-- =============================================

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

CREATE INDEX idx_categories_slug ON product_categories(slug);
CREATE INDEX idx_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_categories_active_sort ON product_categories(is_active, sort_order);

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

CREATE INDEX idx_collections_slug ON product_collections(slug);
CREATE INDEX idx_collections_active_featured ON product_collections(is_active, is_featured);
CREATE INDEX idx_collections_dates ON product_collections(starts_at, ends_at);

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
  
  -- Inventory
  track_inventory BOOLEAN DEFAULT TRUE,
  allow_backorder BOOLEAN DEFAULT FALSE,
  low_stock_threshold INT DEFAULT 5,
  
  -- Physical attributes
  weight_value DECIMAL(10, 3),
  weight_unit weight_unit DEFAULT 'g',
  
  -- Sustainability (Athena specific)
  material_composition JSONB DEFAULT '{}',
  care_instructions TEXT,
  sustainability_notes TEXT,
  production_method VARCHAR(255),
  certification_labels JSONB DEFAULT '[]',
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  featured_image_url TEXT,
  
  -- Status
  status product_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  
  -- Analytics
  view_count INT DEFAULT 0,
  rating DECIMAL(2, 1) CHECK (rating >= 1 AND rating <= 5),
  review_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status_published ON products(status, published_at);
CREATE INDEX idx_products_category_status ON products(category_id, status);
CREATE INDEX idx_products_collection ON products(collection_id);
CREATE INDEX idx_products_featured ON products(is_featured, status);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (status = 'active' AND published_at <= NOW());

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL UNIQUE,
  
  -- Attributes
  size VARCHAR(20),
  color VARCHAR(50),
  color_hex VARCHAR(7),
  attributes JSONB DEFAULT '{}',
  
  -- Pricing
  price DECIMAL(10, 2) CHECK (price >= 0),
  compare_price DECIMAL(10, 2) CHECK (compare_price >= 0),
  
  -- Inventory
  inventory_quantity INT DEFAULT 0 CHECK (inventory_quantity >= 0),
  reserved_quantity INT DEFAULT 0 CHECK (reserved_quantity >= 0),
  
  -- Media
  image_url TEXT,
  
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_inventory ON product_variants(inventory_quantity);
CREATE INDEX idx_variants_active ON product_variants(is_active);

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

CREATE INDEX idx_images_product ON product_images(product_id);
CREATE INDEX idx_images_variant ON product_images(variant_id);
CREATE INDEX idx_images_primary ON product_images(product_id, is_primary);

-- =============================================
-- Customer Tables
-- =============================================

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
  
  -- Validation
  is_validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  coordinates POINT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_addresses_user ON user_addresses(user_id);
CREATE INDEX idx_addresses_default ON user_addresses(user_id, is_default);
CREATE INDEX idx_addresses_type ON user_addresses(type);

-- Enable RLS
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses" ON user_addresses
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Communications
  email_marketing BOOLEAN DEFAULT TRUE,
  sms_marketing BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  
  -- Shopping preferences
  preferred_size JSONB DEFAULT '{}',
  preferred_colors JSONB DEFAULT '[]',
  
  -- Sustainability (Athena specific)
  show_sustainability_info BOOLEAN DEFAULT TRUE,
  preferred_materials JSONB DEFAULT '[]',
  
  -- UI preferences
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(5) DEFAULT 'en',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- Shopping Cart Tables
-- =============================================

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted', 'merged')),
  
  -- Tracking
  abandoned_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_expires ON carts(expires_at);

-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own carts" ON carts
  FOR ALL USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', TRUE));

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_time DECIMAL(10, 2) NOT NULL CHECK (price_at_time >= 0),
  
  -- Inventory reservation
  inventory_reserved_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_cart_variant UNIQUE (cart_id, variant_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_reservation ON cart_items(inventory_reserved_until);

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  priority INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_product_variant UNIQUE (user_id, product_id, variant_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlists" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- Order Management Tables
-- =============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE DEFAULT 'ATH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Customer info
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  
  -- Status
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  fulfillment_status fulfillment_status DEFAULT 'unfulfilled',
  
  -- Financial
  currency_code currency_code DEFAULT 'USD',
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  
  -- Shipping
  shipping_method VARCHAR(100),
  estimated_delivery_date DATE,
  
  -- Tracking
  ip_address INET,
  user_agent TEXT,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  
  -- Product snapshot
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100) NOT NULL,
  variant_title VARCHAR(100),
  product_image_url TEXT,
  
  -- Quantities & pricing
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  
  -- Fulfillment
  fulfilled_quantity INT DEFAULT 0 CHECK (fulfilled_quantity >= 0),
  returned_quantity INT DEFAULT 0 CHECK (returned_quantity >= 0),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);

CREATE TABLE order_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type address_type NOT NULL,
  
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
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_order_address_type UNIQUE (order_id, type)
);

CREATE INDEX idx_order_addresses_order ON order_addresses(order_id);

-- =============================================
-- Payment Tables
-- =============================================

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'paypal', 'stripe')),
  
  -- Provider info
  provider VARCHAR(50) NOT NULL,
  provider_customer_id VARCHAR(255),
  provider_payment_method_id VARCHAR(255),
  
  -- Display info
  display_name VARCHAR(100),
  last_four VARCHAR(4),
  brand VARCHAR(50),
  exp_month INT CHECK (exp_month BETWEEN 1 AND 12),
  exp_year INT CHECK (exp_year >= EXTRACT(YEAR FROM NOW())),
  
  is_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider, provider_customer_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'refund', 'partial_refund')),
  
  -- Provider info
  provider VARCHAR(50) NOT NULL,
  provider_transaction_id VARCHAR(255) UNIQUE,
  provider_status VARCHAR(50),
  
  -- Financial
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency_code currency_code DEFAULT 'USD',
  
  -- Payment method
  payment_method_type VARCHAR(50),
  payment_method_last_four VARCHAR(4),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  failure_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_provider ON transactions(provider, provider_transaction_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);

-- =============================================
-- Shipping Tables
-- =============================================

CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  countries JSONB DEFAULT '[]',
  regions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Calculation
  calculation_type VARCHAR(20) DEFAULT 'flat' CHECK (calculation_type IN ('flat', 'weight_based', 'price_based')),
  rate DECIMAL(10, 2) NOT NULL CHECK (rate >= 0),
  min_weight DECIMAL(10, 3),
  max_weight DECIMAL(10, 3),
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  
  -- Delivery
  min_delivery_days INT,
  max_delivery_days INT,
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipping_rates_zone ON shipping_rates(zone_id);
CREATE INDEX idx_shipping_rates_active ON shipping_rates(is_active);

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Carrier info
  carrier VARCHAR(100),
  service VARCHAR(100),
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'in_transit', 'delivered', 'returned', 'lost')),
  
  -- Package info
  weight_value DECIMAL(10, 3),
  weight_unit weight_unit,
  dimensions JSONB,
  
  -- Timestamps
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);

-- =============================================
-- Inventory Management
-- =============================================

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('adjustment', 'sale', 'return', 'restock', 'damage', 'loss')),
  quantity INT NOT NULL,
  
  -- Reference
  reference_type VARCHAR(50),
  reference_id UUID,
  
  -- Stock levels
  stock_before INT NOT NULL,
  stock_after INT NOT NULL,
  
  notes TEXT,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_variant ON inventory_movements(variant_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);
CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at DESC);

-- =============================================
-- Discounts & Promotions
-- =============================================

CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE,
  description TEXT,
  
  -- Type & value
  type discount_type NOT NULL,
  value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
  
  -- Conditions
  min_purchase_amount DECIMAL(10, 2),
  min_quantity INT,
  
  -- Usage limits
  usage_limit INT,
  usage_limit_per_user INT,
  usage_count INT DEFAULT 0,
  
  -- Applicability
  applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'products', 'categories', 'collections')),
  applicable_product_ids JSONB DEFAULT '[]',
  applicable_category_ids JSONB DEFAULT '[]',
  applicable_collection_ids JSONB DEFAULT '[]',
  
  -- Validity
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_active ON discounts(is_active);
CREATE INDEX idx_discounts_dates ON discounts(starts_at, ends_at);

CREATE TABLE discount_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount_saved DECIMAL(10, 2) NOT NULL CHECK (amount_saved >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_discount_order UNIQUE (discount_id, order_id)
);

CREATE INDEX idx_discount_usage_discount ON discount_usage(discount_id);
CREATE INDEX idx_discount_usage_user ON discount_usage(user_id);

-- =============================================
-- Reviews & Ratings
-- =============================================

CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  review TEXT,
  
  -- Review metadata
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  
  -- Moderation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_product_order UNIQUE (user_id, product_id, order_id)
);

CREATE INDEX idx_reviews_product_status ON product_reviews(product_id, status);
CREATE INDEX idx_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_reviews_featured ON product_reviews(is_featured, status);

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews" ON product_reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create own reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- =============================================
-- Analytics Tables
-- =============================================

CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  ip_address INET,
  referrer_url TEXT,
  user_agent TEXT,
  device_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_user ON product_views(user_id);
CREATE INDEX idx_product_views_session ON product_views(session_id);
CREATE INDEX idx_product_views_created ON product_views(created_at DESC);

CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  clicked_position INT,
  clicked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_queries_user ON search_queries(user_id);
CREATE INDEX idx_search_queries_session ON search_queries(session_id);
CREATE INDEX idx_search_queries_created ON search_queries(created_at DESC);
CREATE INDEX idx_search_queries_query ON search_queries USING gin(to_tsvector('english', query));

-- =============================================
-- Email & Communication Tables
-- =============================================

CREATE TABLE email_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Subscription types
  newsletter BOOLEAN DEFAULT TRUE,
  product_updates BOOLEAN DEFAULT TRUE,
  sustainability_updates BOOLEAN DEFAULT TRUE,
  exclusive_offers BOOLEAN DEFAULT TRUE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  
  -- Tracking
  subscribe_source VARCHAR(100),
  unsubscribe_reason TEXT,
  unsubscribe_token UUID DEFAULT uuid_generate_v4(),
  
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX idx_email_subscriptions_user ON email_subscriptions(user_id);
CREATE INDEX idx_email_subscriptions_status ON email_subscriptions(status);
CREATE INDEX idx_email_subscriptions_token ON email_subscriptions(unsubscribe_token);

-- =============================================
-- Audit & System Tables
-- =============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =============================================
-- Functions & Triggers
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate slug
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(input_text),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update product rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(2,1)
      FROM product_reviews
      WHERE product_id = NEW.product_id AND status = 'approved'
    ),
    review_count = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE product_id = NEW.product_id AND status = 'approved'
    )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_on_review
AFTER INSERT OR UPDATE OF status, rating OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Function to reserve inventory
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_variant_id UUID,
  p_quantity INT,
  p_duration_minutes INT DEFAULT 15
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_available INT;
  v_reservation_until TIMESTAMPTZ;
BEGIN
  -- Check available inventory
  SELECT (inventory_quantity - reserved_quantity) INTO v_available
  FROM product_variants
  WHERE id = p_variant_id;
  
  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory';
  END IF;
  
  -- Calculate reservation expiry
  v_reservation_until := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Update reserved quantity
  UPDATE product_variants
  SET reserved_quantity = reserved_quantity + p_quantity
  WHERE id = p_variant_id;
  
  RETURN v_reservation_until;
END;
$$ LANGUAGE plpgsql;

-- Function to release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS void AS $$
BEGIN
  -- Release cart item reservations
  UPDATE product_variants pv
  SET reserved_quantity = reserved_quantity - ci.quantity
  FROM cart_items ci
  WHERE ci.variant_id = pv.id
    AND ci.inventory_reserved_until < NOW()
    AND ci.inventory_reserved_until IS NOT NULL;
    
  -- Clear reservation timestamps
  UPDATE cart_items
  SET inventory_reserved_until = NULL
  WHERE inventory_reserved_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to handle inventory on order confirmation
CREATE OR REPLACE FUNCTION process_order_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    -- Reduce inventory
    UPDATE product_variants pv
    SET inventory_quantity = inventory_quantity - oi.quantity
    FROM order_items oi
    WHERE pv.id = oi.variant_id AND oi.order_id = NEW.id;
    
    -- Log inventory movements
    INSERT INTO inventory_movements (variant_id, type, quantity, reference_type, reference_id, stock_before, stock_after)
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
-- Views for Analytics & Reporting
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
    WHEN (pv.inventory_quantity - pv.reserved_quantity) <= p.low_stock_threshold THEN true
    ELSE false
  END as is_low_stock
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.status = 'active' AND pv.is_active = true;

CREATE VIEW v_order_summary AS
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as order_count,
  COUNT(DISTINCT user_id) as unique_customers,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
FROM orders
GROUP BY DATE(created_at);

CREATE VIEW v_bestselling_products AS
SELECT 
  p.id,
  p.name,
  p.sku,
  SUM(oi.quantity) as total_sold,
  SUM(oi.total_price) as total_revenue,
  COUNT(DISTINCT oi.order_id) as order_count
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('confirmed', 'shipped', 'delivered')
  AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.sku
ORDER BY total_sold DESC;

-- =============================================
-- Supabase Realtime Subscriptions
-- =============================================

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE carts;
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;

-- =============================================
-- Initial Data & Settings
-- =============================================

-- Insert default shipping zone
INSERT INTO shipping_zones (name, countries, is_active) 
VALUES ('United States', '["US"]', true);

-- System settings (using Supabase storage for config)
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
('site_name', '"Athena"', 'The name of the ecommerce site'),
('currency', '"USD"', 'Default currency'),
('tax_rate', '0.0875', 'Default tax rate'),
('free_shipping_threshold', '150', 'Order amount for free shipping'),
('low_stock_notification', 'true', 'Enable low stock notifications'),
('abandoned_cart_hours', '24', 'Hours before cart is considered abandoned'),
('session_timeout_minutes', '30', 'Session timeout in minutes'),
('max_login_attempts', '5', 'Maximum failed login attempts before lock')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- Scheduled Jobs (using pg_cron or Supabase Edge Functions)
-- =============================================

-- Example: Release expired inventory reservations every 5 minutes
-- This would be set up in Supabase Dashboard or via pg_cron
-- SELECT cron.schedule('release-inventory-reservations', '*/5 * * * *', 
--   'SELECT release_expired_reservations();');

-- Example: Process abandoned carts daily
-- SELECT cron.schedule('process-abandoned-carts', '0 2 * * *',
--   'UPDATE carts SET status = ''abandoned'' 
--    WHERE status = ''active'' 
--    AND updated_at < NOW() - INTERVAL ''24 hours'';');

-- =============================================
-- Grant permissions for Supabase service role
-- =============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =============================================
-- Comments for documentation
-- =============================================

COMMENT ON TABLE products IS 'Core product catalog for Athena eco-luxury fashion';
COMMENT ON TABLE orders IS 'Customer orders with full tracking from placement to delivery';
COMMENT ON TABLE users IS 'Extended user profiles linked to Supabase auth.users';
COMMENT ON COLUMN products.material_composition IS 'JSON object with material percentages, e.g., {"organic_cotton": 80, "recycled_polyester": 20}';
COMMENT ON COLUMN products.certification_labels IS 'Array of certification labels like ["GOTS", "OEKO-TEX", "B-Corp"]';