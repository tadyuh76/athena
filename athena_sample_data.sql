-- Athena Sample Data for Testing
-- This script populates all tables with realistic sample data

USE athena_simple;

-- Disable foreign key checks temporarily for easier insertion
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data (optional - comment out if you want to append)
TRUNCATE TABLE discount_usage;
TRUNCATE TABLE product_reviews;
TRUNCATE TABLE transactions;
TRUNCATE TABLE payment_methods;
TRUNCATE TABLE order_addresses;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE wishlists;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE carts;
TRUNCATE TABLE user_addresses;
TRUNCATE TABLE product_images;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE products;
TRUNCATE TABLE product_collections;
TRUNCATE TABLE product_categories;
TRUNCATE TABLE shipping_rates;
TRUNCATE TABLE discounts;
TRUNCATE TABLE users;

-- =============================================
-- Users (customers, admin, staff)
-- =============================================
-- Password for all users is 'password123' (this is a bcrypt hash)
SET @password_hash = '$2a$10$YourHashedPasswordHere';

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status) VALUES
('u-001', 'admin@athena.com', @password_hash, 'Admin', 'User', '555-0100', 'admin', 'active'),
('u-002', 'staff@athena.com', @password_hash, 'Staff', 'Member', '555-0101', 'staff', 'active'),
('u-003', 'sophia.martinez@email.com', @password_hash, 'Sophia', 'Martinez', '555-0102', 'customer', 'active'),
('u-004', 'emma.johnson@email.com', @password_hash, 'Emma', 'Johnson', '555-0103', 'customer', 'active'),
('u-005', 'olivia.chen@email.com', @password_hash, 'Olivia', 'Chen', '555-0104', 'customer', 'active'),
('u-006', 'ava.williams@email.com', @password_hash, 'Ava', 'Williams', '555-0105', 'customer', 'active'),
('u-007', 'isabella.kim@email.com', @password_hash, 'Isabella', 'Kim', '555-0106', 'customer', 'active'),
('u-008', 'mia.anderson@email.com', @password_hash, 'Mia', 'Anderson', '555-0107', 'customer', 'active'),
('u-009', 'charlotte.lee@email.com', @password_hash, 'Charlotte', 'Lee', '555-0108', 'customer', 'active'),
('u-010', 'amelia.taylor@email.com', @password_hash, 'Amelia', 'Taylor', '555-0109', 'customer', 'inactive');

-- =============================================
-- Product Categories
-- =============================================
INSERT INTO product_categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
('cat-001', 'Women', 'women', 'Premium eco-conscious fashion for women', NULL, 1, TRUE),
('cat-002', 'Tops', 'tops', 'Sustainable tops and blouses', 'cat-001', 1, TRUE),
('cat-003', 'Bottoms', 'bottoms', 'Eco-friendly pants and skirts', 'cat-001', 2, TRUE),
('cat-004', 'Dresses', 'dresses', 'Minimalist dress designs', 'cat-001', 3, TRUE),
('cat-005', 'Outerwear', 'outerwear', 'Sustainable coats and jackets', 'cat-001', 4, TRUE),
('cat-006', 'Essentials', 'essentials', 'Timeless wardrobe essentials', NULL, 2, TRUE),
('cat-007', 'Accessories', 'accessories', 'Sustainable accessories', NULL, 3, TRUE);

-- =============================================
-- Product Collections
-- =============================================
INSERT INTO product_collections (id, name, slug, theme_name, description, is_featured, is_active) VALUES
('col-001', 'The White Space Edit', 'white-space-edit', 'The White Space Edit', 'Elevated essentials in optical white and bone', TRUE, TRUE),
('col-002', 'The Architecture Series', 'architecture-series', 'The Architecture Series', 'Sharp tailoring, structural shapes, precise pleats', TRUE, TRUE),
('col-003', 'The Elemental Capsule', 'elemental-capsule', 'The Elemental Capsule', 'Textural neutrals with soft volume and clean edges', FALSE, TRUE),
('col-004', 'The Midnight Line', 'midnight-line', 'The Midnight Line', 'Minimal evening pieces in deep onyx and blue-black', FALSE, TRUE);

-- =============================================
-- Products
-- =============================================
INSERT INTO products (id, sku, name, slug, description, category_id, collection_id, price, compare_price, stock_quantity, material_composition, care_instructions, sustainability_notes, featured_image_url, status, is_featured) VALUES
-- The White Space Edit
('p-001', 'ATH-WSE-001', 'The Column Dress', 'column-dress-white', 'A precision-cut silhouette that skims the body with effortless structure. Crafted in certified organic sateen with a soft, weightless drape.', 'cat-004', 'col-001', 295.00, 350.00, 25, '{"organic_cotton": 100}', 'Machine wash cold. Hang dry. Low iron if needed.', 'GOTS certified organic cotton. Low-impact dyes. Made in a Fair Trade certified facility.', 'https://images.unsplash.com/photo-minimalist-white-dress', 'active', TRUE),

('p-002', 'ATH-WSE-002', 'The Essential Tee', 'essential-tee-white', 'The perfect white tee reimagined. Premium organic cotton with architectural seaming.', 'cat-002', 'col-001', 85.00, NULL, 50, '{"organic_cotton": 100}', 'Machine wash cold. Tumble dry low.', 'OEKO-TEX certified. Carbon neutral shipping.', 'https://images.unsplash.com/photo-white-tshirt', 'active', FALSE),

('p-003', 'ATH-WSE-003', 'The Wide Leg Trouser', 'wide-leg-trouser-bone', 'Fluid wide-leg trousers with a high-rise waist. Clean lines meet comfortable movement.', 'cat-003', 'col-001', 225.00, 275.00, 30, '{"tencel": 70, "organic_cotton": 30}', 'Dry clean recommended. Steam to refresh.', 'Made from sustainably sourced TENCEL™ Lyocell.', 'https://images.unsplash.com/photo-wide-pants', 'active', FALSE),

-- The Architecture Series
('p-004', 'ATH-ARC-001', 'The Structured Blazer', 'structured-blazer-black', 'Sharp shoulders, clean lines. A blazer that commands attention through restraint.', 'cat-005', 'col-002', 425.00, 495.00, 15, '{"recycled_wool": 60, "recycled_polyester": 40}', 'Professional dry clean only.', 'Made from certified recycled materials. Zero waste pattern cutting.', 'https://images.unsplash.com/photo-black-blazer', 'active', TRUE),

('p-005', 'ATH-ARC-002', 'The Pleat Skirt', 'pleat-skirt-navy', 'Precision pleats create movement and structure. Modern minimalism at its finest.', 'cat-003', 'col-002', 195.00, NULL, 20, '{"organic_cotton": 80, "elastane": 20}', 'Hand wash cold. Hang dry.', 'Biodegradable materials. Plastic-free packaging.', 'https://images.unsplash.com/photo-pleated-skirt', 'active', FALSE),

('p-006', 'ATH-ARC-003', 'The Minimal Shirt', 'minimal-shirt-white', 'Crisp lines, hidden placket, considered details. The perfect white shirt redefined.', 'cat-002', 'col-002', 165.00, 195.00, 35, '{"organic_cotton": 100}', 'Machine wash cold. Hang dry. Iron on medium.', 'GOTS certified. Buttons made from recycled ocean plastic.', 'https://images.unsplash.com/photo-white-shirt', 'active', FALSE),

-- The Elemental Capsule
('p-007', 'ATH-ELE-001', 'The Soft Shell', 'soft-shell-sand', 'Cocoon-like silhouette with soft volume. Comfort without compromise.', 'cat-002', 'col-003', 145.00, NULL, 40, '{"bamboo": 75, "organic_cotton": 25}', 'Machine wash cold. Reshape while damp.', 'Bamboo grown without pesticides. Closed-loop production.', 'https://images.unsplash.com/photo-beige-top', 'active', FALSE),

('p-008', 'ATH-ELE-002', 'The Knit Dress', 'knit-dress-oat', 'Effortless ribbed knit dress. Texture meets minimalist form.', 'cat-004', 'col-003', 245.00, 295.00, 18, '{"merino_wool": 100}', 'Hand wash cold. Lay flat to dry.', 'Mulesing-free merino wool. Biodegradable.', 'https://images.unsplash.com/photo-knit-dress', 'active', FALSE),

-- The Midnight Line
('p-009', 'ATH-MID-001', 'The Slip Dress', 'slip-dress-onyx', 'Bias-cut silk alternative. Fluid lines for evening elegance.', 'cat-004', 'col-004', 325.00, NULL, 12, '{"cupro": 100}', 'Dry clean or hand wash cold.', 'Made from cupro, a regenerated cellulose fiber from cotton waste.', 'https://images.unsplash.com/photo-black-slip-dress', 'active', FALSE),

('p-010', 'ATH-MID-002', 'The Evening Coat', 'evening-coat-midnight', 'Architectural evening coat. Sharp shoulders, clean drape.', 'cat-005', 'col-004', 595.00, 695.00, 8, '{"recycled_cashmere": 80, "recycled_wool": 20}', 'Professional dry clean only.', 'Made from post-consumer recycled luxury fibers.', 'https://images.unsplash.com/photo-black-coat', 'active', TRUE),

-- Essentials
('p-011', 'ATH-ESS-001', 'The Perfect Jean', 'perfect-jean-indigo', 'High-rise straight leg. The only jean you need.', 'cat-003', 'cat-006', 175.00, NULL, 45, '{"organic_cotton": 98, "elastane": 2}', 'Machine wash cold inside out.', 'Organic cotton. Water-saving wash techniques.', 'https://images.unsplash.com/photo-denim', 'active', FALSE),

('p-012', 'ATH-ESS-002', 'The Cashmere Crew', 'cashmere-crew-grey', 'Luxuriously soft recycled cashmere. Timeless crew neck.', 'cat-002', 'cat-006', 275.00, 325.00, 22, '{"recycled_cashmere": 100}', 'Hand wash cold. Lay flat to dry.', 'Made from pre-consumer cashmere waste.', 'https://images.unsplash.com/photo-grey-sweater', 'active', FALSE);

-- =============================================
-- Product Variants (Size and Color variations)
-- =============================================
INSERT INTO product_variants (id, product_id, sku, size, color, price, stock_quantity, image_url, is_active) VALUES
-- The Column Dress variants
('pv-001', 'p-001', 'ATH-WSE-001-XS-WHT', 'XS', 'White', 295.00, 5, NULL, TRUE),
('pv-002', 'p-001', 'ATH-WSE-001-S-WHT', 'S', 'White', 295.00, 8, NULL, TRUE),
('pv-003', 'p-001', 'ATH-WSE-001-M-WHT', 'M', 'White', 295.00, 7, NULL, TRUE),
('pv-004', 'p-001', 'ATH-WSE-001-L-WHT', 'L', 'White', 295.00, 5, NULL, TRUE),

-- The Essential Tee variants
('pv-005', 'p-002', 'ATH-WSE-002-XS-WHT', 'XS', 'White', 85.00, 10, NULL, TRUE),
('pv-006', 'p-002', 'ATH-WSE-002-S-WHT', 'S', 'White', 85.00, 15, NULL, TRUE),
('pv-007', 'p-002', 'ATH-WSE-002-M-WHT', 'M', 'White', 85.00, 15, NULL, TRUE),
('pv-008', 'p-002', 'ATH-WSE-002-L-WHT', 'L', 'White', 85.00, 10, NULL, TRUE),

-- The Structured Blazer variants
('pv-009', 'p-004', 'ATH-ARC-001-S-BLK', 'S', 'Black', 425.00, 5, NULL, TRUE),
('pv-010', 'p-004', 'ATH-ARC-001-M-BLK', 'M', 'Black', 425.00, 6, NULL, TRUE),
('pv-011', 'p-004', 'ATH-ARC-001-L-BLK', 'L', 'Black', 425.00, 4, NULL, TRUE),

-- The Slip Dress variants
('pv-012', 'p-009', 'ATH-MID-001-XS-ONX', 'XS', 'Onyx', 325.00, 3, NULL, TRUE),
('pv-013', 'p-009', 'ATH-MID-001-S-ONX', 'S', 'Onyx', 325.00, 4, NULL, TRUE),
('pv-014', 'p-009', 'ATH-MID-001-M-ONX', 'M', 'Onyx', 325.00, 3, NULL, TRUE),
('pv-015', 'p-009', 'ATH-MID-001-L-ONX', 'L', 'Onyx', 325.00, 2, NULL, TRUE),

-- The Perfect Jean variants (multiple colors)
('pv-016', 'p-011', 'ATH-ESS-001-28-IND', '28', 'Indigo', 175.00, 8, NULL, TRUE),
('pv-017', 'p-011', 'ATH-ESS-001-30-IND', '30', 'Indigo', 175.00, 10, NULL, TRUE),
('pv-018', 'p-011', 'ATH-ESS-001-32-IND', '32', 'Indigo', 175.00, 9, NULL, TRUE),
('pv-019', 'p-011', 'ATH-ESS-001-28-BLK', '28', 'Black', 175.00, 6, NULL, TRUE),
('pv-020', 'p-011', 'ATH-ESS-001-30-BLK', '30', 'Black', 175.00, 7, NULL, TRUE),
('pv-021', 'p-011', 'ATH-ESS-001-32-BLK', '32', 'Black', 175.00, 5, NULL, TRUE);

-- =============================================
-- Product Images
-- =============================================
INSERT INTO product_images (id, product_id, variant_id, url, alt_text, is_primary, sort_order) VALUES
('img-001', 'p-001', NULL, 'https://images.unsplash.com/photo-white-dress-main', 'Column Dress in White - Front View', TRUE, 1),
('img-002', 'p-001', NULL, 'https://images.unsplash.com/photo-white-dress-back', 'Column Dress in White - Back View', FALSE, 2),
('img-003', 'p-001', NULL, 'https://images.unsplash.com/photo-white-dress-detail', 'Column Dress - Fabric Detail', FALSE, 3),

('img-004', 'p-004', NULL, 'https://images.unsplash.com/photo-black-blazer-main', 'Structured Blazer in Black', TRUE, 1),
('img-005', 'p-004', NULL, 'https://images.unsplash.com/photo-black-blazer-detail', 'Structured Blazer - Shoulder Detail', FALSE, 2),

('img-006', 'p-009', NULL, 'https://images.unsplash.com/photo-slip-dress-main', 'Slip Dress in Onyx', TRUE, 1),
('img-007', 'p-009', NULL, 'https://images.unsplash.com/photo-slip-dress-movement', 'Slip Dress - Movement Shot', FALSE, 2),

('img-008', 'p-011', 'pv-016', 'https://images.unsplash.com/photo-jean-indigo', 'Perfect Jean in Indigo', TRUE, 1),
('img-009', 'p-011', 'pv-019', 'https://images.unsplash.com/photo-jean-black', 'Perfect Jean in Black', FALSE, 2);

-- =============================================
-- User Addresses
-- =============================================
INSERT INTO user_addresses (id, user_id, type, is_default, first_name, last_name, address_line1, address_line2, city, state_province, postal_code, country_code, phone) VALUES
('addr-001', 'u-003', 'both', TRUE, 'Sophia', 'Martinez', '123 Madison Avenue', 'Apt 4B', 'New York', 'NY', '10016', 'US', '555-0102'),
('addr-002', 'u-004', 'both', TRUE, 'Emma', 'Johnson', '456 Market Street', NULL, 'San Francisco', 'CA', '94102', 'US', '555-0103'),
('addr-003', 'u-005', 'shipping', TRUE, 'Olivia', 'Chen', '789 Beverly Drive', NULL, 'Los Angeles', 'CA', '90210', 'US', '555-0104'),
('addr-004', 'u-005', 'billing', FALSE, 'Olivia', 'Chen', '321 Sunset Boulevard', 'Suite 200', 'Los Angeles', 'CA', '90028', 'US', '555-0104'),
('addr-005', 'u-006', 'both', TRUE, 'Ava', 'Williams', '555 Pine Street', NULL, 'Seattle', 'WA', '98101', 'US', '555-0105'),
('addr-006', 'u-007', 'both', TRUE, 'Isabella', 'Kim', '888 Michigan Avenue', NULL, 'Chicago', 'IL', '60611', 'US', '555-0106');

-- =============================================
-- Shipping Rates
-- =============================================
INSERT INTO shipping_rates (id, name, description, rate, min_order_amount, max_order_amount, delivery_days, is_active) VALUES
('ship-001', 'Standard Shipping', 'Delivery in 5-7 business days', 10.00, 0.00, 149.99, 7, TRUE),
('ship-002', 'Express Shipping', 'Delivery in 2-3 business days', 25.00, 0.00, NULL, 3, TRUE),
('ship-003', 'Next Day Delivery', 'Next business day delivery', 45.00, 0.00, NULL, 1, TRUE),
('ship-004', 'Free Standard Shipping', 'Free delivery on orders over $150', 0.00, 150.00, NULL, 7, TRUE);

-- =============================================
-- Discounts
-- =============================================
INSERT INTO discounts (id, code, description, type, value, min_purchase_amount, usage_limit, usage_count, is_active, starts_at, ends_at) VALUES
('disc-001', 'WELCOME15', 'Welcome discount - 15% off first order', 'percentage', 15.00, 100.00, NULL, 45, TRUE, '2024-01-01', '2024-12-31'),
('disc-002', 'SAVE25', 'Save $25 on orders over $200', 'fixed_amount', 25.00, 200.00, 100, 23, TRUE, '2024-01-01', '2024-06-30'),
('disc-003', 'EARTH10', 'Earth Day Special - 10% off', 'percentage', 10.00, 0.00, 500, 89, TRUE, '2024-04-01', '2024-04-30'),
('disc-004', 'VIP20', 'VIP Customer - 20% off', 'percentage', 20.00, 150.00, 50, 12, TRUE, '2024-01-01', '2024-12-31'),
('disc-005', 'FREESHIP', 'Free shipping on any order', 'fixed_amount', 10.00, 50.00, NULL, 156, TRUE, '2024-01-01', '2024-12-31');

-- =============================================
-- Carts (Active and Abandoned)
-- =============================================
INSERT INTO carts (id, user_id, session_id, status, created_at, updated_at) VALUES
('cart-001', 'u-003', NULL, 'active', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('cart-002', 'u-004', NULL, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('cart-003', 'u-005', NULL, 'abandoned', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('cart-004', NULL, 'session-abc123', 'active', DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('cart-005', 'u-007', NULL, 'converted', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY));

-- =============================================
-- Cart Items
-- =============================================
INSERT INTO cart_items (id, cart_id, product_id, variant_id, quantity) VALUES
('ci-001', 'cart-001', 'p-001', 'pv-002', 1),
('ci-002', 'cart-001', 'p-002', 'pv-006', 2),
('ci-003', 'cart-002', 'p-004', 'pv-010', 1),
('ci-004', 'cart-003', 'p-009', 'pv-013', 1),
('ci-005', 'cart-003', 'p-011', 'pv-017', 1),
('ci-006', 'cart-004', 'p-002', 'pv-007', 3);

-- =============================================
-- Wishlists
-- =============================================
INSERT INTO wishlists (id, user_id, product_id, variant_id) VALUES
('wish-001', 'u-003', 'p-004', 'pv-009'),
('wish-002', 'u-003', 'p-009', 'pv-013'),
('wish-003', 'u-004', 'p-001', 'pv-003'),
('wish-004', 'u-005', 'p-010', NULL),
('wish-005', 'u-006', 'p-012', NULL),
('wish-006', 'u-007', 'p-001', 'pv-002'),
('wish-007', 'u-007', 'p-004', 'pv-010');

-- =============================================
-- Orders (Various statuses)
-- =============================================
INSERT INTO orders (id, order_number, user_id, customer_email, customer_phone, status, payment_status, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, shipping_method, tracking_number, customer_notes, created_at) VALUES
-- Delivered orders
('ord-001', 'ATH-20240115-0001', 'u-003', 'sophia.martinez@email.com', '555-0102', 'delivered', 'paid', 380.00, 33.25, 0.00, 57.00, 356.25, 'Free Standard Shipping', 'TRK123456789', 'Please leave at front door', DATE_SUB(NOW(), INTERVAL 30 DAY)),
('ord-002', 'ATH-20240120-0002', 'u-004', 'emma.johnson@email.com', '555-0103', 'delivered', 'paid', 425.00, 37.19, 0.00, 0.00, 462.19, 'Free Standard Shipping', 'TRK123456790', NULL, DATE_SUB(NOW(), INTERVAL 25 DAY)),

-- Shipped orders
('ord-003', 'ATH-20240201-0003', 'u-005', 'olivia.chen@email.com', '555-0104', 'shipped', 'paid', 520.00, 45.50, 25.00, 25.00, 565.50, 'Express Shipping', 'TRK123456791', 'Gift wrap please', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ord-004', 'ATH-20240205-0004', 'u-006', 'ava.williams@email.com', '555-0105', 'shipped', 'paid', 175.00, 15.31, 0.00, 17.50, 172.81, 'Free Standard Shipping', 'TRK123456792', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Processing orders
('ord-005', 'ATH-20240210-0005', 'u-007', 'isabella.kim@email.com', '555-0106', 'processing', 'paid', 670.00, 58.63, 0.00, 100.50, 628.13, 'Free Standard Shipping', NULL, 'Urgent delivery needed', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Pending orders
('ord-006', 'ATH-20240212-0006', 'u-003', 'sophia.martinez@email.com', '555-0102', 'pending', 'pending', 165.00, 14.44, 10.00, 0.00, 189.44, 'Standard Shipping', NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),

-- Cancelled order
('ord-007', 'ATH-20240130-0007', 'u-008', 'charlotte.lee@email.com', '555-0108', 'cancelled', 'refunded', 325.00, 28.44, 0.00, 0.00, 353.44, 'Free Standard Shipping', NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY));

-- =============================================
-- Order Items
-- =============================================
INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, product_sku, variant_title, quantity, unit_price, total_price) VALUES
-- Order 1 items
('oi-001', 'ord-001', 'p-001', 'pv-002', 'The Column Dress', 'ATH-WSE-001', 'S / White', 1, 295.00, 295.00),
('oi-002', 'ord-001', 'p-002', 'pv-006', 'The Essential Tee', 'ATH-WSE-002', 'S / White', 1, 85.00, 85.00),

-- Order 2 items
('oi-003', 'ord-002', 'p-004', 'pv-010', 'The Structured Blazer', 'ATH-ARC-001', 'M / Black', 1, 425.00, 425.00),

-- Order 3 items
('oi-004', 'ord-003', 'p-009', 'pv-013', 'The Slip Dress', 'ATH-MID-001', 'S / Onyx', 1, 325.00, 325.00),
('oi-005', 'ord-003', 'p-006', 'pv-010', 'The Minimal Shirt', 'ATH-ARC-003', 'M / White', 1, 195.00, 195.00),

-- Order 4 items
('oi-006', 'ord-004', 'p-011', 'pv-017', 'The Perfect Jean', 'ATH-ESS-001', '30 / Indigo', 1, 175.00, 175.00),

-- Order 5 items
('oi-007', 'ord-005', 'p-001', 'pv-003', 'The Column Dress', 'ATH-WSE-001', 'M / White', 1, 295.00, 295.00),
('oi-008', 'ord-005', 'p-010', 'pv-010', 'The Evening Coat', 'ATH-MID-002', 'M / Midnight', 1, 595.00, 595.00),
('oi-009', 'ord-005', 'p-002', 'pv-007', 'The Essential Tee', 'ATH-WSE-002', 'M / White', 2, 85.00, 170.00),

-- Order 6 items
('oi-010', 'ord-006', 'p-006', 'pv-010', 'The Minimal Shirt', 'ATH-ARC-003', 'M / White', 1, 165.00, 165.00),

-- Order 7 items (cancelled)
('oi-011', 'ord-007', 'p-009', 'pv-014', 'The Slip Dress', 'ATH-MID-001', 'M / Onyx', 1, 325.00, 325.00);

-- =============================================
-- Order Addresses
-- =============================================
INSERT INTO order_addresses (id, order_id, type, first_name, last_name, address_line1, address_line2, city, state_province, postal_code, country_code, phone) VALUES
-- Order 1 addresses
('oa-001', 'ord-001', 'billing', 'Sophia', 'Martinez', '123 Madison Avenue', 'Apt 4B', 'New York', 'NY', '10016', 'US', '555-0102'),
('oa-002', 'ord-001', 'shipping', 'Sophia', 'Martinez', '123 Madison Avenue', 'Apt 4B', 'New York', 'NY', '10016', 'US', '555-0102'),

-- Order 2 addresses
('oa-003', 'ord-002', 'billing', 'Emma', 'Johnson', '456 Market Street', NULL, 'San Francisco', 'CA', '94102', 'US', '555-0103'),
('oa-004', 'ord-002', 'shipping', 'Emma', 'Johnson', '456 Market Street', NULL, 'San Francisco', 'CA', '94102', 'US', '555-0103'),

-- Order 3 addresses
('oa-005', 'ord-003', 'billing', 'Olivia', 'Chen', '321 Sunset Boulevard', 'Suite 200', 'Los Angeles', 'CA', '90028', 'US', '555-0104'),
('oa-006', 'ord-003', 'shipping', 'Olivia', 'Chen', '789 Beverly Drive', NULL, 'Los Angeles', 'CA', '90210', 'US', '555-0104'),

-- Order 4 addresses
('oa-007', 'ord-004', 'billing', 'Ava', 'Williams', '555 Pine Street', NULL, 'Seattle', 'WA', '98101', 'US', '555-0105'),
('oa-008', 'ord-004', 'shipping', 'Ava', 'Williams', '555 Pine Street', NULL, 'Seattle', 'WA', '98101', 'US', '555-0105'),

-- Order 5 addresses
('oa-009', 'ord-005', 'billing', 'Isabella', 'Kim', '888 Michigan Avenue', NULL, 'Chicago', 'IL', '60611', 'US', '555-0106'),
('oa-010', 'ord-005', 'shipping', 'Isabella', 'Kim', '888 Michigan Avenue', NULL, 'Chicago', 'IL', '60611', 'US', '555-0106');

-- =============================================
-- Payment Methods
-- =============================================
INSERT INTO payment_methods (id, user_id, type, provider, provider_customer_id, provider_payment_method_id, display_name, last_four, is_default) VALUES
('pm-001', 'u-003', 'card', 'stripe', 'cus_abc123', 'pm_xyz789', 'Visa ending in 4242', '4242', TRUE),
('pm-002', 'u-004', 'card', 'stripe', 'cus_def456', 'pm_abc123', 'Mastercard ending in 5555', '5555', TRUE),
('pm-003', 'u-005', 'paypal', 'paypal', 'paypal_cus_789', NULL, 'PayPal - olivia.chen@email.com', NULL, TRUE),
('pm-004', 'u-006', 'card', 'stripe', 'cus_ghi789', 'pm_def456', 'Amex ending in 1234', '1234', TRUE),
('pm-005', 'u-007', 'card', 'stripe', 'cus_jkl012', 'pm_ghi789', 'Visa ending in 9876', '9876', FALSE),
('pm-006', 'u-007', 'card', 'stripe', 'cus_jkl012', 'pm_jkl012', 'Mastercard ending in 3333', '3333', TRUE);

-- =============================================
-- Transactions
-- =============================================
INSERT INTO transactions (id, order_id, type, provider, provider_transaction_id, amount, currency_code, status, processed_at) VALUES
('trans-001', 'ord-001', 'payment', 'stripe', 'ch_1abc2def3ghi', 356.25, 'USD', 'succeeded', DATE_SUB(NOW(), INTERVAL 30 DAY)),
('trans-002', 'ord-002', 'payment', 'stripe', 'ch_2bcd3efg4hij', 462.19, 'USD', 'succeeded', DATE_SUB(NOW(), INTERVAL 25 DAY)),
('trans-003', 'ord-003', 'payment', 'paypal', 'PAYPAL-TXN-12345', 565.50, 'USD', 'succeeded', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('trans-004', 'ord-004', 'payment', 'stripe', 'ch_3cde4fgh5ijk', 172.81, 'USD', 'succeeded', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('trans-005', 'ord-005', 'payment', 'stripe', 'ch_4def5ghi6jkl', 628.13, 'USD', 'succeeded', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('trans-006', 'ord-006', 'payment', 'stripe', 'ch_5efg6hij7klm', 189.44, 'USD', 'pending', NULL),
('trans-007', 'ord-007', 'payment', 'stripe', 'ch_6fgh7ijk8lmn', 353.44, 'USD', 'succeeded', DATE_SUB(NOW(), INTERVAL 10 DAY)),
('trans-008', 'ord-007', 'refund', 'stripe', 're_7ghi8jkl9mno', 353.44, 'USD', 'succeeded', DATE_SUB(NOW(), INTERVAL 9 DAY));

-- =============================================
-- Discount Usage
-- =============================================
INSERT INTO discount_usage (id, discount_id, order_id, user_id, amount_saved) VALUES
('du-001', 'disc-001', 'ord-001', 'u-003', 57.00),
('du-002', 'disc-002', 'ord-003', 'u-005', 25.00),
('du-003', 'disc-003', 'ord-004', 'u-006', 17.50),
('du-004', 'disc-004', 'ord-005', 'u-007', 100.50);

-- =============================================
-- Product Reviews
-- =============================================
INSERT INTO product_reviews (id, product_id, user_id, order_id, rating, title, review, is_verified_purchase, status) VALUES
('rev-001', 'p-001', 'u-003', 'ord-001', 5, 'Perfect Minimalist Dress', 'The Column Dress is everything I was looking for. The organic cotton feels amazing and the cut is so flattering. True to size and the quality is exceptional.', TRUE, 'approved'),

('rev-002', 'p-002', 'u-003', 'ord-001', 5, 'The Ultimate White Tee', 'Finally, a white tee that is not see-through! The architectural seaming adds such a nice detail. Will be buying more colors.', TRUE, 'approved'),

('rev-003', 'p-004', 'u-004', 'ord-002', 4, 'Beautiful Blazer', 'Love the structure and the recycled materials. Fits perfectly through the shoulders. Only wish it came in more colors.', TRUE, 'approved'),

('rev-004', 'p-009', 'u-005', 'ord-003', 5, 'Elegant and Sustainable', 'This slip dress is stunning. The cupro fabric feels like silk but knowing its made from cotton waste makes it even better. Perfect for special occasions.', TRUE, 'approved'),

('rev-005', 'p-011', 'u-006', 'ord-004', 5, 'Actually Perfect', 'They call it the Perfect Jean and they are not lying. Great fit, comfortable stretch, and the organic cotton is so soft.', TRUE, 'approved'),

('rev-006', 'p-001', 'u-007', 'ord-005', 4, 'Love it but runs slightly large', 'Beautiful dress with amazing quality. I usually wear M but could have sized down to S. The fabric and construction are top-notch though.', TRUE, 'approved'),

('rev-007', 'p-002', 'u-008', NULL, 3, 'Good but pricey', 'Nice tee but $85 seems steep even for organic cotton. Quality is good though.', FALSE, 'pending'),

('rev-008', 'p-004', 'u-009', NULL, 5, 'Investment piece', 'This blazer is an investment but worth every penny. The tailoring is impeccable.', FALSE, 'approved');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- Data Summary
-- =============================================
SELECT 'Data Load Complete!' as Status;

SELECT 'Users:' as Table_Name, COUNT(*) as Count FROM users
UNION ALL
SELECT 'Categories:', COUNT(*) FROM product_categories
UNION ALL
SELECT 'Collections:', COUNT(*) FROM product_collections
UNION ALL
SELECT 'Products:', COUNT(*) FROM products
UNION ALL
SELECT 'Product Variants:', COUNT(*) FROM product_variants
UNION ALL
SELECT 'Product Images:', COUNT(*) FROM product_images
UNION ALL
SELECT 'User Addresses:', COUNT(*) FROM user_addresses
UNION ALL
SELECT 'Carts:', COUNT(*) FROM carts
UNION ALL
SELECT 'Cart Items:', COUNT(*) FROM cart_items
UNION ALL
SELECT 'Wishlists:', COUNT(*) FROM wishlists
UNION ALL
SELECT 'Orders:', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items:', COUNT(*) FROM order_items
UNION ALL
SELECT 'Payment Methods:', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'Transactions:', COUNT(*) FROM transactions
UNION ALL
SELECT 'Shipping Rates:', COUNT(*) FROM shipping_rates
UNION ALL
SELECT 'Discounts:', COUNT(*) FROM discounts
UNION ALL
SELECT 'Reviews:', COUNT(*) FROM product_reviews;