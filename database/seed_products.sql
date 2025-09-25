-- =============================================
-- Athena Fashion Products - Seed Data
-- 10 premium eco-luxury fashion products with variants
-- =============================================

-- First, create product categories
INSERT INTO product_categories (id, name, slug, description, sort_order, is_active) VALUES
('797b34ad-4d4b-4ef5-8085-5e8975666b9f', 'Dresses', 'dresses', 'Architectural dresses with clean lines and sustainable materials', 1, true),
('7027a5d7-cf55-424d-bc23-d0a110de4440', 'Blazers', 'blazers', 'Structured blazers for modern professionals', 2, true),
('6f379a2d-95f0-45dc-a319-00d717bf7c33', 'Trousers', 'trousers', 'Tailored trousers with perfect fit', 3, true),
('66b2f329-c778-486e-9b75-98415018b362', 'Coats', 'coats', 'Timeless outerwear for all seasons', 4, true),
('80e05e0e-22da-45e7-8f82-f18f7bbed06d', 'Tops', 'tops', 'Essential tops and blouses', 5, true)
ON CONFLICT (id) DO NOTHING;

-- Create product collection
INSERT INTO product_collections (id, name, slug, description, theme_name, is_featured, is_active, sort_order) VALUES
('45af2d80-87d8-48cb-8744-4caaa1d13ab9', 'Architecture Series', 'architecture-series', 'Sharp tailoring, structural shapes, precise pleats. Each piece designed with architectural precision.', 'The Architecture Series', true, true, 1)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PRODUCT 1: Architectural Midi Dress
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    '6d185e0d-0108-4d94-9ef0-19508a998b32',
    'ATH-ARCH-DRESS-001',
    'Architectural Midi Dress',
    'architectural-midi-dress',
    'A masterpiece of minimalist design, this midi dress features clean architectural lines and a structured silhouette. Crafted from certified organic cotton with a subtle drape that flatters every figure. The dress embodies our commitment to timeless elegance and sustainable luxury.',
    'Minimalist midi dress with architectural lines and sustainable organic cotton construction.',
    '797b34ad-4d4b-4ef5-8085-5e8975666b9f',
    '45af2d80-87d8-48cb-8744-4caaa1d13ab9',
    285.00, 320.00, 'USD', 450.0, 'g',
    '{"organic_cotton": 95, "elastane": 5}',
    'Machine wash cold, hang dry, iron on medium heat',
    'Made from GOTS-certified organic cotton. Zero-waste pattern cutting reduces fabric waste by 40%.',
    'Ethical manufacturing in certified facilities',
    '["GOTS", "OEKO-TEX", "B-Corp"]',
    'Architectural Midi Dress - Sustainable Luxury Fashion | Athena',
    'Shop our signature architectural midi dress made from certified organic cotton. Timeless design meets sustainable luxury.',
    '/images/minimalist-dress-silhouette.png',
    'active', true, NOW(), 4.8, 24
);

-- Product 1 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('74ae1e70-e550-4d4f-9096-1a74c7b4b03f', '6d185e0d-0108-4d94-9ef0-19508a998b32', 'ATH-ARCH-DRESS-001-XS-BLK', 'XS', 'Black', '#000000', 285.00, 15, '/images/minimalist-dress-silhouette.png', 1, true, true),
('691230e8-873f-46ce-9180-bb04a452aac7', '6d185e0d-0108-4d94-9ef0-19508a998b32', 'ATH-ARCH-DRESS-001-S-BLK', 'S', 'Black', '#000000', 285.00, 25, '/images/minimalist-dress-silhouette.png', 2, false, true),
('b3ecba89-6c6f-4d24-b4d4-94e25d965871', '6d185e0d-0108-4d94-9ef0-19508a998b32', 'ATH-ARCH-DRESS-001-M-BLK', 'M', 'Black', '#000000', 285.00, 30, '/images/minimalist-dress-silhouette.png', 3, false, true),
('028836be-72fd-49cd-9365-8791ac11ac5a', '6d185e0d-0108-4d94-9ef0-19508a998b32', 'ATH-ARCH-DRESS-001-L-BLK', 'L', 'Black', '#000000', 285.00, 20, '/images/minimalist-dress-silhouette.png', 4, false, true),
('3833686e-86db-40ad-a1ba-9328db267c8e', '6d185e0d-0108-4d94-9ef0-19508a998b32', 'ATH-ARCH-DRESS-001-XS-WHT', 'XS', 'White', '#FFFFFF', 285.00, 12, '/images/minimalist-dress-silhouette.png', 5, false, true),
('29cdc289-67f9-447e-b94c-526d756a0f80', '6d185e0d-0108-4d94-9ef0-19508a998b32', 'ATH-ARCH-DRESS-001-S-WHT', 'S', 'White', '#FFFFFF', 285.00, 18, '/images/minimalist-dress-silhouette.png', 6, false, true),
('60e28b30-2147-4b99-84dc-84d3ec4cd6a8', '6d185e0d-0108-4d94-9ef0-19508a998b32', 'ATH-ARCH-DRESS-001-M-WHT', 'M', 'White', '#FFFFFF', 285.00, 22, '/images/minimalist-dress-silhouette.png', 7, false, true),
('04991976-1b00-4d7c-ab88-dd76bed4068a', '6d185e0d-0108-4d94-9ef0-19508a998b32', 'ATH-ARCH-DRESS-001-L-WHT', 'L', 'White', '#FFFFFF', 285.00, 16, '/images/minimalist-dress-silhouette.png', 8, false, true);

-- =============================================
-- PRODUCT 2: Essential White Blazer
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    '60ba91af-f752-4369-9c57-1e6c106a0ff7',
    'ATH-BLAZER-WHITE-001',
    'Essential White Blazer',
    'essential-white-blazer',
    'The perfect white blazer that transitions seamlessly from boardroom to brunch. Cut from premium TENCEL Lyocell with a structured shoulder and tailored waist. This versatile piece is designed to be your wardrobe workhorse for years to come.',
    'Classic white blazer in sustainable TENCEL Lyocell with structured tailoring.',
    '7027a5d7-cf55-424d-bc23-d0a110de4440',
    '45af2d80-87d8-48cb-8744-4caaa1d13ab9',
    395.00, 450.00, 'USD', 680.0, 'g',
    '{"tencel_lyocell": 88, "recycled_polyester": 10, "elastane": 2}',
    'Dry clean only for best results, or gentle machine wash cold',
    'TENCEL Lyocell is made from sustainably sourced eucalyptus. Fully biodegradable.',
    'Zero-waste manufacturing process',
    '["FSC", "OEKO-TEX", "Cradle to Cradle"]',
    'Essential White Blazer - Sustainable Professional Wear | Athena',
    'Discover the perfect white blazer made from sustainable TENCEL Lyocell. Professional elegance meets eco-luxury.',
    '/images/white-blazer-model.png',
    'active', true, NOW(), 4.9, 31
);

-- Product 2 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('8185631c-1a3a-4c78-a810-9b8c53dea762', '60ba91af-f752-4369-9c57-1e6c106a0ff7', 'ATH-BLAZER-WHITE-001-XS', 'XS', 'White', '#FFFFFF', 395.00, 8, '/images/white-blazer-model.png', 1, true, true),
('0a408525-e2c5-42c6-86fd-0f302fd44b4d', '60ba91af-f752-4369-9c57-1e6c106a0ff7', 'ATH-BLAZER-WHITE-001-S', 'S', 'White', '#FFFFFF', 395.00, 14, '/images/white-blazer-model.png', 2, false, true),
('b9cb427b-8282-439e-9607-c62593af03a7', '60ba91af-f752-4369-9c57-1e6c106a0ff7', 'ATH-BLAZER-WHITE-001-M', 'M', 'White', '#FFFFFF', 395.00, 18, '/images/white-blazer-model.png', 3, false, true),
('5c9cf7fe-8c33-4c50-98a9-da73178fbe7e', '60ba91af-f752-4369-9c57-1e6c106a0ff7', 'ATH-BLAZER-WHITE-001-L', 'L', 'White', '#FFFFFF', 395.00, 12, '/images/white-blazer-model.png', 4, false, true),
('9eb34c49-4657-47c9-98b2-685b6db7dbc4', '60ba91af-f752-4369-9c57-1e6c106a0ff7', 'ATH-BLAZER-WHITE-001-XL', 'XL', 'White', '#FFFFFF', 395.00, 6, '/images/white-blazer-model.png', 5, false, true);

-- =============================================
-- PRODUCT 3: Minimalist Trousers
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    '0a78b541-4ae6-4d6c-8b8d-c363df390645',
    'ATH-TROUSERS-MIN-001',
    'Minimalist Trousers',
    'minimalist-trousers',
    'Impeccably tailored trousers with a modern straight-leg silhouette. Made from innovative recycled wool blend that maintains structure while offering comfort. Features precise pleating and a flattering high-waist design.',
    'Modern straight-leg trousers in sustainable recycled wool blend.',
    '6f379a2d-95f0-45dc-a319-00d717bf7c33',
    '45af2d80-87d8-48cb-8744-4caaa1d13ab9',
    245.00, 280.00, 'USD', 520.0, 'g',
    '{"recycled_wool": 75, "organic_cotton": 20, "elastane": 5}',
    'Dry clean recommended, gentle machine wash cold',
    'Made from post-consumer recycled wool. Saves 70% water compared to virgin wool.',
    'Circular design for easy recycling',
    '["GRS", "OEKO-TEX", "B-Corp"]',
    'Minimalist Trousers - Sustainable Tailoring | Athena',
    'Shop our minimalist trousers made from recycled wool. Perfect tailoring meets sustainable fashion.',
    '/images/minimalist-trousers-detail.png',
    'active', true, NOW(), 4.7, 19
);

-- Product 3 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('4d2e061c-4986-4bef-bd2c-6ce2e03731fa', '0a78b541-4ae6-4d6c-8b8d-c363df390645', 'ATH-TROUSERS-MIN-001-24-BLK', '24', 'Black', '#000000', 245.00, 10, '/images/minimalist-trousers-detail.png', 1, true, true),
('61dd75a6-656b-4481-9333-ed04907e5ce3', '0a78b541-4ae6-4d6c-8b8d-c363df390645', 'ATH-TROUSERS-MIN-001-26-BLK', '26', 'Black', '#000000', 245.00, 16, '/images/minimalist-trousers-detail.png', 2, false, true),
('217543ae-9091-4f4b-84a9-bc533f54d2c3', '0a78b541-4ae6-4d6c-8b8d-c363df390645', 'ATH-TROUSERS-MIN-001-28-BLK', '28', 'Black', '#000000', 245.00, 20, '/images/minimalist-trousers-detail.png', 3, false, true),
('12d52af3-3d22-4540-abaf-4f1da92be4ae', '0a78b541-4ae6-4d6c-8b8d-c363df390645', 'ATH-TROUSERS-MIN-001-30-BLK', '30', 'Black', '#000000', 245.00, 14, '/images/minimalist-trousers-detail.png', 4, false, true),
('4eb8b0d4-3d5c-4c7e-be80-f21e6b3d71ff', '0a78b541-4ae6-4d6c-8b8d-c363df390645', 'ATH-TROUSERS-MIN-001-24-NAV', '24', 'Navy', '#1a1a2e', 245.00, 8, '/images/minimalist-trousers-detail.png', 5, false, true),
('7732b777-44af-41b4-8b42-1a7b50d8de83', '0a78b541-4ae6-4d6c-8b8d-c363df390645', 'ATH-TROUSERS-MIN-001-26-NAV', '26', 'Navy', '#1a1a2e', 245.00, 12, '/images/minimalist-trousers-detail.png', 6, false, true),
('d6472386-1689-465c-992a-0d0b84ec415a', '0a78b541-4ae6-4d6c-8b8d-c363df390645', 'ATH-TROUSERS-MIN-001-28-NAV', '28', 'Navy', '#1a1a2e', 245.00, 15, '/images/minimalist-trousers-detail.png', 7, false, true),
('a8a117f2-90c6-40b6-9fd9-60a8e80309c4', '0a78b541-4ae6-4d6c-8b8d-c363df390645', 'ATH-TROUSERS-MIN-001-30-NAV', '30', 'Navy', '#1a1a2e', 245.00, 11, '/images/minimalist-trousers-detail.png', 8, false, true);

-- =============================================
-- PRODUCT 4: Architectural Coat
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    'f3a18c2d-046c-4738-b982-76bbce5e60a0',
    'ATH-COAT-ARCH-001',
    'Architectural Coat',
    'architectural-coat',
    'A statement coat that embodies architectural precision. Features clean geometric lines, structured shoulders, and a dramatic silhouette. Crafted from innovative recycled cashmere blend for ultimate luxury and sustainability.',
    'Structured coat with architectural design in sustainable recycled cashmere.',
    '66b2f329-c778-486e-9b75-98415018b362',
    '45af2d80-87d8-48cb-8744-4caaa1d13ab9',
    695.00, 795.00, 'USD', 1200.0, 'g',
    '{"recycled_cashmere": 60, "recycled_wool": 35, "organic_cotton": 5}',
    'Professional dry clean only',
    'Made from post-consumer recycled cashmere. Saves 90% water vs. virgin cashmere production.',
    'Artisan craftsmanship with traditional techniques',
    '["GRS", "RWS", "B-Corp"]',
    'Architectural Coat - Luxury Sustainable Outerwear | Athena',
    'Discover our architectural coat in recycled cashmere. Statement outerwear meets sustainable luxury.',
    '/images/minimalist-coat-architectural.png',
    'active', true, NOW(), 4.9, 15
);

-- Product 4 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('4441ea68-2064-474a-9327-8390b83b0366', 'f3a18c2d-046c-4738-b982-76bbce5e60a0', 'ATH-COAT-ARCH-001-XS-CAM', 'XS', 'Camel', '#c19a6b', 695.00, 4, '/images/minimalist-coat-architectural.png', 1, true, true),
('b9b3442d-1480-4cdc-b439-5d06a900c050', 'f3a18c2d-046c-4738-b982-76bbce5e60a0', 'ATH-COAT-ARCH-001-S-CAM', 'S', 'Camel', '#c19a6b', 695.00, 6, '/images/minimalist-coat-architectural.png', 2, false, true),
('517f043d-5c31-4154-9bf6-af4ccc92fcc0', 'f3a18c2d-046c-4738-b982-76bbce5e60a0', 'ATH-COAT-ARCH-001-M-CAM', 'M', 'Camel', '#c19a6b', 695.00, 8, '/images/minimalist-coat-architectural.png', 3, false, true),
('ebe497c3-a83f-41c9-ab6c-3169905fe422', 'f3a18c2d-046c-4738-b982-76bbce5e60a0', 'ATH-COAT-ARCH-001-L-CAM', 'L', 'Camel', '#c19a6b', 695.00, 5, '/images/minimalist-coat-architectural.png', 4, false, true),
('cbaf8122-56b3-400f-96bc-bd4fc17438a1', 'f3a18c2d-046c-4738-b982-76bbce5e60a0', 'ATH-COAT-ARCH-001-XS-BLK', 'XS', 'Black', '#000000', 695.00, 3, '/images/minimalist-coat-architectural.png', 5, false, true),
('38882900-d8d9-44c1-9ac6-d776a0984942', 'f3a18c2d-046c-4738-b982-76bbce5e60a0', 'ATH-COAT-ARCH-001-S-BLK', 'S', 'Black', '#000000', 695.00, 7, '/images/minimalist-coat-architectural.png', 6, false, true),
('319c3479-a625-481c-85dc-8e1899fe4981', 'f3a18c2d-046c-4738-b982-76bbce5e60a0', 'ATH-COAT-ARCH-001-M-BLK', 'M', 'Black', '#000000', 695.00, 9, '/images/minimalist-coat-architectural.png', 7, false, true),
('2d7a368f-84db-43f7-89d5-4ccda328362b', 'f3a18c2d-046c-4738-b982-76bbce5e60a0', 'ATH-COAT-ARCH-001-L-BLK', 'L', 'Black', '#000000', 695.00, 6, '/images/minimalist-coat-architectural.png', 8, false, true);

-- =============================================
-- PRODUCT 5: Essential Silk Blouse
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    '15c5bb75-6eca-4266-9a39-0c8e6dc058eb',
    'ATH-BLOUSE-SILK-001',
    'Essential Silk Blouse',
    'essential-silk-blouse',
    'Timeless silk blouse with clean lines and subtle draping. Made from peace silk (ahimsa silk) that is cruelty-free and biodegradable. Features mother-of-pearl buttons and French seams for durability.',
    'Elegant silk blouse in cruelty-free peace silk with timeless design.',
    '80e05e0e-22da-45e7-8f82-f18f7bbed06d',
    '45af2d80-87d8-48cb-8744-4caaa1d13ab9',
    225.00, 260.00, 'USD', 180.0, 'g',
    '{"peace_silk": 100}',
    'Hand wash or gentle machine wash cold, hang dry, steam iron',
    'Made from cruelty-free peace silk. Biodegradable and renewable resource.',
    'Traditional silk weaving techniques',
    '["GOTS", "Peace Silk Certified"]',
    'Essential Silk Blouse - Cruelty-Free Luxury | Athena',
    'Shop our essential silk blouse made from cruelty-free peace silk. Timeless elegance with ethical luxury.',
    '/images/minimalist-fashion-model.png',
    'active', false, NOW(), 4.6, 12
);

-- Product 5 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('5f92ebd4-1b13-4088-9fff-392f15abc9d4', '15c5bb75-6eca-4266-9a39-0c8e6dc058eb', 'ATH-BLOUSE-SILK-001-XS-WHT', 'XS', 'White', '#FFFFFF', 225.00, 12, '/images/minimalist-fashion-model.png', 1, true, true),
('e8d7c4e1-dc8a-4f7c-84af-411de027db56', '15c5bb75-6eca-4266-9a39-0c8e6dc058eb', 'ATH-BLOUSE-SILK-001-S-WHT', 'S', 'White', '#FFFFFF', 225.00, 18, '/images/minimalist-fashion-model.png', 2, false, true),
('f0a5a95c-2a42-4e3a-8fd4-75021e84fdf6', '15c5bb75-6eca-4266-9a39-0c8e6dc058eb', 'ATH-BLOUSE-SILK-001-M-WHT', 'M', 'White', '#FFFFFF', 225.00, 22, '/images/minimalist-fashion-model.png', 3, false, true),
('a6f6fd49-75e3-4d4f-b260-f08e56d10447', '15c5bb75-6eca-4266-9a39-0c8e6dc058eb', 'ATH-BLOUSE-SILK-001-L-WHT', 'L', 'White', '#FFFFFF', 225.00, 16, '/images/minimalist-fashion-model.png', 4, false, true),
('8b871589-e413-4393-aa73-fc070857bf2e', '15c5bb75-6eca-4266-9a39-0c8e6dc058eb', 'ATH-BLOUSE-SILK-001-XS-BLK', 'XS', 'Black', '#000000', 225.00, 10, '/images/minimalist-fashion-model.png', 5, false, true),
('2049ae61-8224-4f94-94e0-0ae00dc32e2b', '15c5bb75-6eca-4266-9a39-0c8e6dc058eb', 'ATH-BLOUSE-SILK-001-S-BLK', 'S', 'Black', '#000000', 225.00, 14, '/images/minimalist-fashion-model.png', 6, false, true),
('84f52c95-7f7c-4231-995a-2073844d452b', '15c5bb75-6eca-4266-9a39-0c8e6dc058eb', 'ATH-BLOUSE-SILK-001-M-BLK', 'M', 'Black', '#000000', 225.00, 19, '/images/minimalist-fashion-model.png', 7, false, true),
('997b397a-953f-4bb9-9a15-037d06e074f0', '15c5bb75-6eca-4266-9a39-0c8e6dc058eb', 'ATH-BLOUSE-SILK-001-L-BLK', 'L', 'Black', '#000000', 225.00, 13, '/images/minimalist-fashion-model.png', 8, false, true);

-- =============================================
-- PRODUCT 6: Structured Midi Skirt
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    '3d78834c-364e-4e2b-860a-c4a7a0b69150',
    'ATH-SKIRT-MIDI-001',
    'Structured Midi Skirt',
    'structured-midi-skirt',
    'A perfectly structured A-line midi skirt with subtle pleating and a flattering high waist. Made from innovative hemp-cotton blend that gets softer with each wear. Features hidden side zip and internal waist stay.',
    'A-line midi skirt in sustainable hemp-cotton blend with structured design.',
    '797b34ad-4d4b-4ef5-8085-5e8975666b9f',
    '45af2d80-87d8-48cb-8744-4caaa1d13ab9',
    195.00, 225.00, 'USD', 380.0, 'g',
    '{"hemp": 55, "organic_cotton": 40, "elastane": 5}',
    'Machine wash cold, hang dry, iron medium heat',
    'Hemp requires 50% less water than cotton and improves soil health.',
    'Zero-waste pattern cutting',
    '["GOTS", "Hemp Certified", "B-Corp"]',
    'Structured Midi Skirt - Sustainable Hemp Fashion | Athena',
    'Discover our structured midi skirt in sustainable hemp-cotton blend. Classic silhouette meets eco-innovation.',
    '/images/minimalist-fashion-model.png',
    'active', false, NOW(), 4.5, 8
);

-- Product 6 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('7cf5c7a8-905e-496a-98ff-e127135bd26b', '3d78834c-364e-4e2b-860a-c4a7a0b69150', 'ATH-SKIRT-MIDI-001-XS-BLK', 'XS', 'Black', '#000000', 195.00, 14, '/images/minimalist-fashion-model.png', 1, true, true),
('e5a6d7c9-0de5-4ce2-8aa5-5dc8b3730070', '3d78834c-364e-4e2b-860a-c4a7a0b69150', 'ATH-SKIRT-MIDI-001-S-BLK', 'S', 'Black', '#000000', 195.00, 20, '/images/minimalist-fashion-model.png', 2, false, true),
('7c8c3c72-cd97-49cc-bffa-09523da98742', '3d78834c-364e-4e2b-860a-c4a7a0b69150', 'ATH-SKIRT-MIDI-001-M-BLK', 'M', 'Black', '#000000', 195.00, 24, '/images/minimalist-fashion-model.png', 3, false, true),
('4315cb7e-6a7a-46a1-9e7d-af43552a91a3', '3d78834c-364e-4e2b-860a-c4a7a0b69150', 'ATH-SKIRT-MIDI-001-L-BLK', 'L', 'Black', '#000000', 195.00, 18, '/images/minimalist-fashion-model.png', 4, false, true),
('1d02c827-42bd-482d-99bc-11fed328b88b', '3d78834c-364e-4e2b-860a-c4a7a0b69150', 'ATH-SKIRT-MIDI-001-XS-NAV', 'XS', 'Navy', '#1a1a2e', 195.00, 11, '/images/minimalist-fashion-model.png', 5, false, true),
('a384a9af-b349-434d-a8c2-3210c33bb0a6', '3d78834c-364e-4e2b-860a-c4a7a0b69150', 'ATH-SKIRT-MIDI-001-S-NAV', 'S', 'Navy', '#1a1a2e', 195.00, 16, '/images/minimalist-fashion-model.png', 6, false, true),
('e2321cc6-e123-4be7-8463-937cd5134f15', '3d78834c-364e-4e2b-860a-c4a7a0b69150', 'ATH-SKIRT-MIDI-001-M-NAV', 'M', 'Navy', '#1a1a2e', 195.00, 19, '/images/minimalist-fashion-model.png', 7, false, true),
('21e56b77-eb85-4141-8449-adaea764951f', '3d78834c-364e-4e2b-860a-c4a7a0b69150', 'ATH-SKIRT-MIDI-001-L-NAV', 'L', 'Navy', '#1a1a2e', 195.00, 13, '/images/minimalist-fashion-model.png', 8, false, true);

-- =============================================
-- PRODUCT 7: Minimalist Cashmere Sweater
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    'c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c',
    'ATH-SWEATER-CASH-001',
    'Minimalist Cashmere Sweater',
    'minimalist-cashmere-sweater',
    'Ultra-soft cashmere sweater with a relaxed fit and clean lines. Made from responsibly sourced cashmere with full traceability to the source. Features ribbed cuffs and hem with a slightly oversized silhouette.',
    'Relaxed cashmere sweater in responsibly sourced, traceable cashmere.',
    '80e05e0e-22da-45e7-8f82-f18f7bbed06d',
    null,
    485.00, 550.00, 'USD', 320.0, 'g',
    '{"responsible_cashmere": 100}',
    'Hand wash cold or dry clean, lay flat to dry',
    'Sourced from farms practicing regenerative grazing. Full supply chain transparency.',
    'Traditional knitting techniques by skilled artisans',
    '["RWS", "SFA", "B-Corp"]',
    'Minimalist Cashmere Sweater - Responsible Luxury | Athena',
    'Shop our minimalist cashmere sweater made from responsibly sourced cashmere. Luxury comfort meets ethical sourcing.',
    '/images/minimalist-fashion-model.png',
    'active', false, NOW(), 4.8, 21
);

-- Product 7 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('a541ad2b-d37e-4255-a3f2-4636013c9a11', 'c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c', 'ATH-SWEATER-CASH-001-XS-OAT', 'XS', 'Oatmeal', '#f5f5dc', 485.00, 6, '/images/minimalist-fashion-model.png', 1, true, true),
('30bafc06-cfde-4b8f-aded-51e96837bea2', 'c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c', 'ATH-SWEATER-CASH-001-S-OAT', 'S', 'Oatmeal', '#f5f5dc', 485.00, 10, '/images/minimalist-fashion-model.png', 2, false, true),
('b1e20e26-1d1f-4cb9-83c0-7192d898c900', 'c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c', 'ATH-SWEATER-CASH-001-M-OAT', 'M', 'Oatmeal', '#f5f5dc', 485.00, 12, '/images/minimalist-fashion-model.png', 3, false, true),
('cc432dc7-58ee-48d8-aedc-cd7ad8212f40', 'c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c', 'ATH-SWEATER-CASH-001-L-OAT', 'L', 'Oatmeal', '#f5f5dc', 485.00, 8, '/images/minimalist-fashion-model.png', 4, false, true),
('9ecc5cd3-217e-461f-b34f-4e80a0582e4b', 'c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c', 'ATH-SWEATER-CASH-001-XS-GRY', 'XS', 'Grey', '#808080', 485.00, 5, '/images/minimalist-fashion-model.png', 5, false, true),
('723a1235-afc8-4bfd-b3e2-e6ea3a3e1b2a', 'c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c', 'ATH-SWEATER-CASH-001-S-GRY', 'S', 'Grey', '#808080', 485.00, 9, '/images/minimalist-fashion-model.png', 6, false, true),
('532f74bd-d105-4d51-94a9-08c3dcde35d4', 'c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c', 'ATH-SWEATER-CASH-001-M-GRY', 'M', 'Grey', '#808080', 485.00, 11, '/images/minimalist-fashion-model.png', 7, false, true),
('b5fc7d55-d3d2-417e-88ab-1310bdf5f263', 'c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c', 'ATH-SWEATER-CASH-001-L-GRY', 'L', 'Grey', '#808080', 485.00, 7, '/images/minimalist-fashion-model.png', 8, false, true);

-- =============================================
-- PRODUCT 8: Wide-Leg Culottes
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    '8c00f99d-6885-475a-af77-3e6ac08ef532',
    'ATH-CULOTTES-WIDE-001',
    'Wide-Leg Culottes',
    'wide-leg-culottes',
    'Flowing wide-leg culottes with a sophisticated drape and comfortable elastic waistband. Made from innovative TENCEL Modal that feels like silk but washes like cotton. Perfect for both office and weekend wear.',
    'Flowing wide-leg culottes in sustainable TENCEL Modal with elegant drape.',
    '6f379a2d-95f0-45dc-a319-00d717bf7c33',
    null,
    165.00, 195.00, 'USD', 290.0, 'g',
    '{"tencel_modal": 95, "elastane": 5}',
    'Machine wash cold, hang dry, steam iron if needed',
    'TENCEL Modal made from sustainably sourced beech trees. 95% less water than cotton.',
    'Low-impact dyeing process',
    '["FSC", "OEKO-TEX", "EU Ecolabel"]',
    'Wide-Leg Culottes - Sustainable Comfort | Athena',
    'Discover our wide-leg culottes in sustainable TENCEL Modal. Comfortable elegance meets eco-innovation.',
    '/images/minimalist-fashion-model.png',
    'active', false, NOW(), 4.4, 14
);

-- Product 8 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('676b23c9-8f3d-4aeb-967a-fa142a86d039', '8c00f99d-6885-475a-af77-3e6ac08ef532', 'ATH-CULOTTES-WIDE-001-XS-BLK', 'XS', 'Black', '#000000', 165.00, 16, '/images/minimalist-fashion-model.png', 1, true, true),
('4aa6fe60-ecd4-4ef6-b39e-645304bf7ae4', '8c00f99d-6885-475a-af77-3e6ac08ef532', 'ATH-CULOTTES-WIDE-001-S-BLK', 'S', 'Black', '#000000', 165.00, 22, '/images/minimalist-fashion-model.png', 2, false, true),
('510da619-3d1b-4ea7-928d-020b09c583fe', '8c00f99d-6885-475a-af77-3e6ac08ef532', 'ATH-CULOTTES-WIDE-001-M-BLK', 'M', 'Black', '#000000', 165.00, 26, '/images/minimalist-fashion-model.png', 3, false, true),
('2fb121b4-9d11-49bd-a6d0-9281341fe08d', '8c00f99d-6885-475a-af77-3e6ac08ef532', 'ATH-CULOTTES-WIDE-001-L-BLK', 'L', 'Black', '#000000', 165.00, 20, '/images/minimalist-fashion-model.png', 4, false, true),
('6e11fa51-6ac8-4835-a7e6-d44c0f8e8f10', '8c00f99d-6885-475a-af77-3e6ac08ef532', 'ATH-CULOTTES-WIDE-001-XS-TAN', 'XS', 'Tan', '#d2b48c', 165.00, 13, '/images/minimalist-fashion-model.png', 5, false, true),
('fdba6cd2-b9ef-40d4-9b11-05f2ca0c86e3', '8c00f99d-6885-475a-af77-3e6ac08ef532', 'ATH-CULOTTES-WIDE-001-S-TAN', 'S', 'Tan', '#d2b48c', 165.00, 18, '/images/minimalist-fashion-model.png', 6, false, true),
('072e9c04-ac56-435c-a1ec-1729be2c44d8', '8c00f99d-6885-475a-af77-3e6ac08ef532', 'ATH-CULOTTES-WIDE-001-M-TAN', 'M', 'Tan', '#d2b48c', 165.00, 21, '/images/minimalist-fashion-model.png', 7, false, true),
('2e4a1d99-2737-4bc9-a327-e9434e3a04cc', '8c00f99d-6885-475a-af77-3e6ac08ef532', 'ATH-CULOTTES-WIDE-001-L-TAN', 'L', 'Tan', '#d2b48c', 165.00, 15, '/images/minimalist-fashion-model.png', 8, false, true);

-- =============================================
-- PRODUCT 9: Essential Tank Top
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    '4efd832d-5130-4a94-8d8b-8b36a19b9a4f',
    'ATH-TANK-ESS-001',
    'Essential Tank Top',
    'essential-tank-top',
    'The perfect layering piece made from ultra-soft organic cotton jersey. Features a classic scoop neckline and relaxed fit that works under blazers or on its own. Pre-shrunk and designed to maintain shape wash after wash.',
    'Classic tank top in soft organic cotton jersey, perfect for layering.',
    '80e05e0e-22da-45e7-8f82-f18f7bbed06d',
    null,
    65.00, 78.00, 'USD', 120.0, 'g',
    '{"organic_cotton": 100}',
    'Machine wash cold, tumble dry low or hang dry',
    'Made from GOTS-certified organic cotton. Supports regenerative farming practices.',
    'Fair trade manufacturing',
    '["GOTS", "Fair Trade", "B-Corp"]',
    'Essential Tank Top - Organic Cotton Basics | Athena',
    'Shop our essential tank top in organic cotton. Perfect layering piece meets sustainable basics.',
    '/images/minimalist-fashion-model.png',
    'active', false, NOW(), 4.3, 28
);

-- Product 9 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('ee70ea3a-ff6a-4d14-a23c-3247517a2389', '4efd832d-5130-4a94-8d8b-8b36a19b9a4f', 'ATH-TANK-ESS-001-XS-WHT', 'XS', 'White', '#FFFFFF', 65.00, 25, '/images/minimalist-fashion-model.png', 1, true, true),
('12942cf0-dc6e-460f-b267-412e9b101144', '4efd832d-5130-4a94-8d8b-8b36a19b9a4f', 'ATH-TANK-ESS-001-S-WHT', 'S', 'White', '#FFFFFF', 65.00, 35, '/images/minimalist-fashion-model.png', 2, false, true),
('bedcb8cc-e684-4041-9e3b-60e2ca24ee7f', '4efd832d-5130-4a94-8d8b-8b36a19b9a4f', 'ATH-TANK-ESS-001-M-WHT', 'M', 'White', '#FFFFFF', 65.00, 40, '/images/minimalist-fashion-model.png', 3, false, true),
('1fb3e8e8-0bcb-431b-9632-d60112ec0654', '4efd832d-5130-4a94-8d8b-8b36a19b9a4f', 'ATH-TANK-ESS-001-L-WHT', 'L', 'White', '#FFFFFF', 65.00, 30, '/images/minimalist-fashion-model.png', 4, false, true),
('96e81a47-8a72-437e-bb5a-eeb9f6759221', '4efd832d-5130-4a94-8d8b-8b36a19b9a4f', 'ATH-TANK-ESS-001-XS-BLK', 'XS', 'Black', '#000000', 65.00, 22, '/images/minimalist-fashion-model.png', 5, false, true),
('54764731-912b-406d-8199-3002cdc1c52f', '4efd832d-5130-4a94-8d8b-8b36a19b9a4f', 'ATH-TANK-ESS-001-S-BLK', 'S', 'Black', '#000000', 65.00, 32, '/images/minimalist-fashion-model.png', 6, false, true),
('5619b19e-b25f-4b52-92f4-d70c1c581e1e', '4efd832d-5130-4a94-8d8b-8b36a19b9a4f', 'ATH-TANK-ESS-001-M-BLK', 'M', 'Black', '#000000', 65.00, 38, '/images/minimalist-fashion-model.png', 7, false, true),
('1e91654b-7097-4b63-b13d-38816a1a699f', '4efd832d-5130-4a94-8d8b-8b36a19b9a4f', 'ATH-TANK-ESS-001-L-BLK', 'L', 'Black', '#000000', 65.00, 28, '/images/minimalist-fashion-model.png', 8, false, true);

-- =============================================
-- PRODUCT 10: Signature Wrap Dress
-- =============================================
INSERT INTO products (
    id, sku, name, slug, description, short_description, category_id, collection_id,
    base_price, compare_price, currency_code, weight_value, weight_unit,
    material_composition, care_instructions, sustainability_notes, production_method,
    certification_labels, meta_title, meta_description, featured_image_url,
    status, is_featured, published_at, rating, review_count
) VALUES (
    '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473',
    'ATH-WRAP-DRESS-001',
    'Signature Wrap Dress',
    'signature-wrap-dress',
    'Our most versatile piece - a wrap dress that transitions effortlessly from day to night. Made from innovative Lyocell-silk blend with a fluid drape and flattering silhouette. Features three-quarter sleeves and midi length.',
    'Versatile wrap dress in Lyocell-silk blend with fluid drape and midi length.',
    '797b34ad-4d4b-4ef5-8085-5e8975666b9f',
    null,
    315.00, 365.00, 'USD', 410.0, 'g',
    '{"lyocell": 70, "peace_silk": 30}',
    'Hand wash cold or gentle machine wash, hang dry, steam iron',
    'Lyocell from sustainably managed forests. Peace silk is cruelty-free.',
    'Zero-waste design with pattern optimization',
    '["FSC", "Peace Silk Certified", "OEKO-TEX"]',
    'Signature Wrap Dress - Versatile Sustainable Fashion | Athena',
    'Discover our signature wrap dress in Lyocell-silk blend. Versatile elegance meets sustainable luxury.',
    '/images/featured-dress.png',
    'active', true, NOW(), 4.9, 42
);

-- Product 10 Variants
INSERT INTO product_variants (
    id, product_id, sku, size, color, color_hex, price, inventory_quantity, 
    image_url, sort_order, is_default, is_active
) VALUES
('0a5753a7-30af-4436-845b-b8fedec283bf', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-XS-BLK', 'XS', 'Black', '#000000', 315.00, 12, '/images/featured-dress.png', 1, true, true),
('aaa1a112-d66d-4ac3-aa6f-ee07ba7293f1', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-S-BLK', 'S', 'Black', '#000000', 315.00, 18, '/images/featured-dress.png', 2, false, true),
('7ae89a8e-922f-4d8a-bc6f-9da61b6255b2', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-M-BLK', 'M', 'Black', '#000000', 315.00, 22, '/images/featured-dress.png', 3, false, true),
('d5ab95b8-90a4-42ae-a20b-396e1e790249', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-L-BLK', 'L', 'Black', '#000000', 315.00, 16, '/images/featured-dress.png', 4, false, true),
('a102b9c5-ad54-4672-9e5f-00c66e9a04cb', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-XS-NAV', 'XS', 'Navy', '#1a1a2e', 315.00, 10, '/images/featured-dress.png', 5, false, true),
('d87df009-416b-4766-b492-dda15b30f0f2', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-S-NAV', 'S', 'Navy', '#1a1a2e', 315.00, 15, '/images/featured-dress.png', 6, false, true),
('fd6bf6cb-2771-4902-a2c1-c5f8697ba6d4', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-M-NAV', 'M', 'Navy', '#1a1a2e', 315.00, 19, '/images/featured-dress.png', 7, false, true),
('163196b0-e6e0-41fb-b221-0be2ee4a2c18', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-L-NAV', 'L', 'Navy', '#1a1a2e', 315.00, 13, '/images/featured-dress.png', 8, false, true),
('b5b4037e-d22f-4a10-b8d3-bad580e15e2f', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-XS-BRN', 'XS', 'Brown', '#8b4513', 315.00, 8, '/images/featured-dress.png', 9, false, true),
('7ba3fe8a-8128-4a56-9ecc-0d003ee99d19', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-S-BRN', 'S', 'Brown', '#8b4513', 315.00, 12, '/images/featured-dress.png', 10, false, true),
('605d7c84-a284-4824-99d3-6da1136d0f0d', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-M-BRN', 'M', 'Brown', '#8b4513', 315.00, 14, '/images/featured-dress.png', 11, false, true),
('d87a2504-3a35-44ae-b8fe-10e924d824db', '4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', 'ATH-WRAP-DRESS-001-L-BRN', 'L', 'Brown', '#8b4513', 315.00, 10, '/images/featured-dress.png', 12, false, true);

-- =============================================
-- PRODUCT IMAGES
-- =============================================

-- Add primary images for each product
INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order) VALUES
('6d185e0d-0108-4d94-9ef0-19508a998b32', '/images/minimalist-dress-silhouette.png', 'Architectural Midi Dress - Black', true, 1),
('60ba91af-f752-4369-9c57-1e6c106a0ff7', '/images/white-blazer-model.png', 'Essential White Blazer - Professional Look', true, 1),
('0a78b541-4ae6-4d6c-8b8d-c363df390645', '/images/minimalist-trousers-detail.png', 'Minimalist Trousers - Tailored Fit', true, 1),
('f3a18c2d-046c-4738-b982-76bbce5e60a0', '/images/minimalist-coat-architectural.png', 'Architectural Coat - Camel Color', true, 1),
('15c5bb75-6eca-4266-9a39-0c8e6dc058eb', '/images/minimalist-fashion-model.png', 'Essential Silk Blouse - White', true, 1),
('3d78834c-364e-4e2b-860a-c4a7a0b69150', '/images/minimalist-fashion-model.png', 'Structured Midi Skirt - Black', true, 1),
('c6e7a4eb-7fc7-44ca-81e7-07cda5bab84c', '/images/minimalist-fashion-model.png', 'Minimalist Cashmere Sweater - Oatmeal', true, 1),
('8c00f99d-6885-475a-af77-3e6ac08ef532', '/images/minimalist-fashion-model.png', 'Wide-Leg Culottes - Black', true, 1),
('4efd832d-5130-4a94-8d8b-8b36a19b9a4f', '/images/minimalist-fashion-model.png', 'Essential Tank Top - White', true, 1),
('4bb3b0b1-dbf6-42e8-9e41-1e535b0b2473', '/images/featured-dress.png', 'Signature Wrap Dress - Black', true, 1);

-- =============================================
-- SUMMARY
-- =============================================
-- This script creates:
-- - 5 Product Categories (Dresses, Blazers, Trousers, Coats, Tops)
-- - 1 Product Collection (Architecture Series)
-- - 10 Premium Fashion Products with detailed sustainability information
-- - 80+ Product Variants across different sizes and colors
-- - Primary product images
-- 
-- All products are designed for the Athena eco-luxury fashion brand
-- with focus on sustainable materials, ethical production, and timeless design.
-- 
-- Price range: $65 - $695 (covering basics to luxury pieces)
-- Materials: Organic cotton, TENCEL, recycled wool, peace silk, hemp, cashmere
-- Certifications: GOTS, OEKO-TEX, B-Corp, FSC, RWS, Fair Trade