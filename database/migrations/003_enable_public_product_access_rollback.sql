-- Rollback: Remove public read access policies

-- Drop policies
DROP POLICY IF EXISTS "Public read access to active products" ON products;
DROP POLICY IF EXISTS "Public read access to product variants" ON product_variants;
DROP POLICY IF EXISTS "Public read access to product images" ON product_images;
DROP POLICY IF EXISTS "Public read access to active categories" ON product_categories;
DROP POLICY IF EXISTS "Public read access to active collections" ON product_collections;
DROP POLICY IF EXISTS "Public read access to product reviews" ON product_reviews;

-- Note: This rollback does NOT disable RLS on the tables
-- If you want to completely disable RLS, run:
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_collections DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_reviews DISABLE ROW LEVEL SECURITY;
