-- Migration: Enable public read access to products and related tables
-- This allows anonymous users to browse products without authentication

-- Enable RLS on products table (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to active products
CREATE POLICY "Public read access to active products"
ON products
FOR SELECT
TO anon
USING (status = 'active');

-- Enable RLS and create policies for related tables
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to product variants"
ON product_variants
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_variants.product_id
    AND products.status = 'active'
  )
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to product images"
ON product_images
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_images.product_id
    AND products.status = 'active'
  )
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to active categories"
ON product_categories
FOR SELECT
TO anon
USING (is_active = true);

ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to active collections"
ON product_collections
FOR SELECT
TO anon
USING (is_active = true);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to product reviews"
ON product_reviews
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_reviews.product_id
    AND products.status = 'active'
  )
);

-- Note: Authenticated users and service role can still access all data
-- These policies only affect anonymous (anon) access
