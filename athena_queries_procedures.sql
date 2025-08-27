-- Athena Ecommerce - Useful Queries and Stored Procedures
-- Core functionality queries for testing and development

USE athena_simple;

-- =============================================
-- PRODUCT QUERIES
-- =============================================

-- 1. Get featured products with stock availability and pricing
SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.compare_price,
    ROUND((p.compare_price - p.price) / p.compare_price * 100, 0) as discount_percentage,
    p.stock_quantity,
    p.featured_image_url,
    pc.name as category,
    pcol.name as collection,
    p.material_composition,
    p.sustainability_notes,
    COUNT(DISTINCT pr.id) as review_count,
    AVG(pr.rating) as avg_rating
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN product_collections pcol ON p.collection_id = pcol.id
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.status = 'approved'
WHERE p.status = 'active' 
    AND p.is_featured = TRUE
    AND p.stock_quantity > 0
GROUP BY p.id
ORDER BY p.created_at DESC;

-- 2. Get product details with all variants and their stock levels
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.price as base_price,
    pv.id as variant_id,
    pv.sku as variant_sku,
    pv.size,
    pv.color,
    COALESCE(pv.price, p.price) as variant_price,
    pv.stock_quantity,
    CASE 
        WHEN pv.stock_quantity = 0 THEN 'Out of Stock'
        WHEN pv.stock_quantity < 5 THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.slug = 'column-dress-white'
    AND pv.is_active = TRUE
ORDER BY pv.size, pv.color;

-- 3. Search products by material composition (sustainability focus)
SELECT 
    p.name,
    p.price,
    p.material_composition,
    p.sustainability_notes,
    pc.name as category
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.status = 'active'
    AND (
        JSON_EXTRACT(p.material_composition, '$.organic_cotton') > 0
        OR JSON_EXTRACT(p.material_composition, '$.recycled_wool') > 0
        OR JSON_EXTRACT(p.material_composition, '$.tencel') > 0
    )
ORDER BY JSON_EXTRACT(p.material_composition, '$.organic_cotton') DESC;

-- 4. Get products by collection with inventory summary
SELECT 
    pcol.name as collection,
    pcol.theme_name,
    COUNT(DISTINCT p.id) as product_count,
    SUM(p.stock_quantity) as total_stock,
    MIN(p.price) as min_price,
    MAX(p.price) as max_price,
    AVG(p.price) as avg_price
FROM product_collections pcol
LEFT JOIN products p ON pcol.id = p.collection_id AND p.status = 'active'
WHERE pcol.is_active = TRUE
GROUPندرج BY pcol.id, pcol.name, pcol.theme_name
ORDER BY pcol.is_featured DESC, product_count DESC;

-- =============================================
-- CART & CHECKOUT QUERIES
-- =============================================

-- 5. Get active cart with items for a user
SELECT 
    c.id as cart_id,
    ci.id as cart_item_id,
    p.name as product_name,
    pv.size,
    pv.color,
    ci.quantity,
    COALESCE(pv.price, p.price) as unit_price,
    (COALESCE(pv.price, p.price) * ci.quantity) as line_total,
    pv.stock_quantity as available_stock,
    p.featured_image_url
FROM carts c
JOIN cart_items ci ON c.id = ci.cart_id
JOIN products p ON ci.product_id = p.id
JOIN product_variants pv ON ci.variant_id = pv.id
WHERE c.user_id = 'u-003'
    AND c.status = 'active'
ORDER BY ci.created_at DESC;

-- 6. Calculate cart totals with shipping and potential discounts
SELECT 
    c.id as cart_id,
    COUNT(ci.id) as item_count,
    SUM(ci.quantity) as total_items,
    SUM(COALESCE(pv.price, p.price) * ci.quantity) as subtotal,
    CASE 
        WHEN SUM(COALESCE(pv.price, p.price) * ci.quantity) >= 150 THEN 0
        ELSE 10.00
    END as shipping_cost,
    ROUND(SUM(COALESCE(pv.price, p.price) * ci.quantity) * 0.0875, 2) as estimated_tax,
    ROUND(
        SUM(COALESCE(pv.price, p.price) * ci.quantity) * 1.0875 + 
        CASE 
            WHEN SUM(COALESCE(pv.price, p.price) * ci.quantity) >= 150 THEN 0
            ELSE 10.00
        END, 2
    ) as total
FROM carts c
JOIN cart_items ci ON c.id = ci.cart_id
JOIN products p ON ci.product_id = p.id
JOIN product_variants pv ON ci.variant_id = pv.id
WHERE c.id = 'cart-001'
GROUP BY c.id;

-- 7. Find abandoned carts with high value
SELECT 
    c.id,
    c.user_id,
    u.email,
    u.first_name,
    COUNT(ci.id) as item_count,
    SUM(COALESCE(pv.price, p.price) * ci.quantity) as cart_value,
    c.created_at,
    c.updated_at,
    DATEDIFF(NOW(), c.updated_at) as days_abandoned
FROM carts c
LEFT JOIN users u ON c.user_id = u.id
JOIN cart_items ci ON c.id = ci.cart_id
JOIN products p ON ci.product_id = p.id
JOIN product_variants pv ON ci.variant_id = pv.id
WHERE c.status = 'abandoned'
    OR (c.status = 'active' AND c.updated_at < DATE_SUB(NOW(), INTERVAL 2 DAY))
GROUP BY c.id
HAVING cart_value > 100
ORDER BY cart_value DESC;

-- =============================================
-- ORDER QUERIES
-- =============================================

-- 8. Get order history for a customer with details
SELECT 
    o.order_number,
    o.status,
    o.payment_status,
    o.total_amount,
    o.created_at,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_items,
    GROUP_CONCAT(oi.product_name SEPARATOR ', ') as products_ordered
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'u-003'
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 9. Get orders requiring fulfillment
SELECT 
    o.id,
    o.order_number,
    o.customer_email,
    o.total_amount,
    o.shipping_method,
    oa.first_name,
    oa.last_name,
    CONCAT(oa.address_line1, ', ', oa.city, ', ', oa.state_province, ' ', oa.postal_code) as shipping_address,
    o.created_at,
    TIMESTAMPDIFF(HOUR, o.created_at, NOW()) as hours_since_order
FROM orders o
JOIN order_addresses oa ON o.id = oa.order_id AND oa.type = 'shipping'
WHERE o.status IN ('confirmed', 'processing')
    AND o.payment_status = 'paid'
    AND o.tracking_number IS NULL
ORDER BY o.created_at ASC;

-- 10. Revenue report by date range
SELECT 
    DATE(o.created_at) as order_date,
    COUNT(DISTINCT o.id) as order_count,
    COUNT(DISTINCT o.user_id) as unique_customers,
    SUM(o.subtotal) as gross_revenue,
    SUM(o.discount_amount) as total_discounts,
    SUM(o.shipping_amount) as shipping_revenue,
    SUM(o.tax_amount) as tax_collected,
    SUM(o.total_amount) as net_revenue,
    AVG(o.total_amount) as avg_order_value
FROM orders o
WHERE o.status NOT IN ('cancelled', 'refunded')
    AND o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW()
GROUP BY DATE(o.created_at)
ORDER BY order_date DESC;

-- =============================================
-- CUSTOMER QUERIES
-- =============================================

-- 11. Get customer lifetime value and purchase history
SELECT 
    u.id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total_amount) as lifetime_value,
    AVG(o.total_amount) as avg_order_value,
    MAX(o.created_at) as last_order_date,
    DATEDIFF(NOW(), MAX(o.created_at)) as days_since_last_order,
    GROUP_CONCAT(DISTINCT pc.name) as categories_purchased
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status IN ('delivered', 'shipped')
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE u.role = 'customer'
GROUP BY u.id
HAVING total_orders > 0
ORDER BY lifetime_value DESC
LIMIT 20;

-- 12. Get customers with items in wishlist but no recent purchases
SELECT 
    u.id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    COUNT(DISTINCT w.id) as wishlist_items,
    SUM(p.price) as wishlist_value,
    MAX(o.created_at) as last_purchase,
    DATEDIFF(NOW(), MAX(o.created_at)) as days_since_purchase
FROM users u
JOIN wishlists w ON u.id = w.user_id
JOIN products p ON w.product_id = p.id
LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
GROUP BY u.id
HAVING last_purchase IS NULL OR days_since_purchase > 30
ORDER BY wishlist_value DESC;

-- =============================================
-- INVENTORY QUERIES
-- =============================================

-- 13. Low stock alert report
SELECT 
    p.id,
    p.name,
    p.sku,
    pv.sku as variant_sku,
    pv.size,
    pv.color,
    pv.stock_quantity,
    COALESCE(
        (SELECT SUM(ci.quantity) 
         FROM cart_items ci 
         WHERE ci.variant_id = pv.id), 0
    ) as quantity_in_carts,
    pc.name as category,
    p.price
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.status = 'active'
    AND pv.is_active = TRUE
    AND pv.stock_quantity < 10
ORDER BY pv.stock_quantity ASC, p.name;

-- 14. Best selling products by quantity and revenue
SELECT 
    p.id,
    p.name,
    p.sku,
    COUNT(DISTINCT oi.order_id) as times_ordered,
    SUM(oi.quantity) as units_sold,
    SUM(oi.total_price) as total_revenue,
    AVG(oi.unit_price) as avg_selling_price,
    p.stock_quantity as current_stock
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('confirmed', 'shipped', 'delivered')
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY p.id
ORDER BY units_sold DESC
LIMIT 10;

-- =============================================
-- DISCOUNT & PROMOTION QUERIES
-- =============================================

-- 15. Active discounts performance
SELECT 
    d.code,
    d.description,
    d.type,
    d.value,
    d.usage_count,
    d.usage_limit,
    CASE 
        WHEN d.usage_limit IS NOT NULL 
        THEN CONCAT(ROUND(d.usage_count / d.usage_limit * 100, 1), '%')
        ELSE 'Unlimited'
    END as usage_percentage,
    COUNT(du.id) as times_used,
    SUM(du.amount_saved) as total_savings_given,
    d.ends_at,
    DATEDIFF(d.ends_at, NOW()) as days_remaining
FROM discounts d
LEFT JOIN discount_usage du ON d.id = du.discount_id
WHERE d.is_active = TRUE
    AND (d.ends_at IS NULL OR d.ends_at > NOW())
GROUP BY d.id
ORDER BY total_savings_given DESC;

-- 16. Customer review insights
SELECT 
    p.name as product_name,
    COUNT(pr.id) as review_count,
    AVG(pr.rating) as avg_rating,
    SUM(CASE WHEN pr.rating = 5 THEN 1 ELSE 0 END) as five_star_reviews,
    SUM(CASE WHEN pr.rating <= 2 THEN 1 ELSE 0 END) as negative_reviews,
    SUM(CASE WHEN pr.is_verified_purchase = TRUE THEN 1 ELSE 0 END) as verified_reviews,
    MIN(pr.created_at) as first_review,
    MAX(pr.created_at) as latest_review
FROM products p
LEFT JOIN product_reviews pr ON p.id = pr.product_id
WHERE pr.status = 'approved'
GROUP BY p.id
HAVING review_count > 0
ORDER BY avg_rating DESC, review_count DESC;

-- =============================================
-- STORED PROCEDURES
-- =============================================

DELIMITER //

-- SP1: Get product availability by SKU
CREATE PROCEDURE sp_check_product_availability(
    IN p_sku VARCHAR(100)
)
BEGIN
    SELECT 
        p.name as product_name,
        pv.sku,
        pv.size,
        pv.color,
        pv.stock_quantity,
        COALESCE(pv.price, p.price) as price,
        CASE 
            WHEN pv.stock_quantity = 0 THEN 'Out of Stock'
            WHEN pv.stock_quantity < 5 THEN 'Low Stock'
            ELSE 'In Stock'
        END as availability
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE pv.sku = p_sku
        AND p.status = 'active'
        AND pv.is_active = TRUE;
END //

-- SP2: Add item to cart with stock validation
CREATE PROCEDURE sp_add_to_cart(
    IN p_user_id CHAR(36),
    IN p_product_id CHAR(36),
    IN p_variant_id CHAR(36),
    IN p_quantity INT
)
BEGIN
    DECLARE v_cart_id CHAR(36);
    DECLARE v_stock INT;
    DECLARE v_existing_quantity INT;
    
    -- Check stock availability
    SELECT stock_quantity INTO v_stock
    FROM product_variants
    WHERE id = p_variant_id;
    
    IF v_stock < p_quantity THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Insufficient stock available';
    END IF;
    
    -- Get or create active cart
    SELECT id INTO v_cart_id
    FROM carts
    WHERE user_id = p_user_id AND status = 'active'
    LIMIT 1;
    
    IF v_cart_id IS NULL THEN
        SET v_cart_id = UUID();
        INSERT INTO carts (id, user_id, status)
        VALUES (v_cart_id, p_user_id, 'active');
    END IF;
    
    -- Check if item already in cart
    SELECT quantity INTO v_existing_quantity
    FROM cart_items
    WHERE cart_id = v_cart_id AND variant_id = p_variant_id;
    
    IF v_existing_quantity IS NOT NULL THEN
        -- Update quantity
        UPDATE cart_items
        SET quantity = quantity + p_quantity,
            updated_at = NOW()
        WHERE cart_id = v_cart_id AND variant_id = p_variant_id;
    ELSE
        -- Insert new item
        INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
        VALUES (v_cart_id, p_product_id, p_variant_id, p_quantity);
    END IF;
    
    -- Update cart timestamp
    UPDATE carts SET updated_at = NOW() WHERE id = v_cart_id;
    
    SELECT 'Item added to cart successfully' as message, v_cart_id as cart_id;
END //

-- SP3: Calculate order totals with discounts
CREATE PROCEDURE sp_calculate_order_total(
    IN p_cart_id CHAR(36),
    IN p_discount_code VARCHAR(50),
    IN p_shipping_method VARCHAR(100)
)
BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_discount_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_shipping_amount DECIMAL(10,2);
    DECLARE v_tax_rate DECIMAL(5,4) DEFAULT 0.0875;
    DECLARE v_tax_amount DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_discount_type VARCHAR(20);
    DECLARE v_discount_value DECIMAL(10,2);
    DECLARE v_min_purchase DECIMAL(10,2);
    
    -- Calculate subtotal
    SELECT SUM(COALESCE(pv.price, p.price) * ci.quantity) INTO v_subtotal
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = p_cart_id;
    
    -- Apply discount if code provided
    IF p_discount_code IS NOT NULL THEN
        SELECT type, value, min_purchase_amount 
        INTO v_discount_type, v_discount_value, v_min_purchase
        FROM discounts
        WHERE code = p_discount_code
            AND is_active = TRUE
            AND starts_at <= NOW()
            AND (ends_at IS NULL OR ends_at >= NOW())
            AND (usage_limit IS NULL OR usage_count < usage_limit);
        
        IF v_discount_type IS NOT NULL AND v_subtotal >= COALESCE(v_min_purchase, 0) THEN
            IF v_discount_type = 'percentage' THEN
                SET v_discount_amount = v_subtotal * (v_discount_value / 100);
            ELSE
                SET v_discount_amount = v_discount_value;
            END IF;
        END IF;
    END IF;
    
    -- Calculate shipping
    SELECT rate INTO v_shipping_amount
    FROM shipping_rates
    WHERE name = p_shipping_method AND is_active = TRUE
    LIMIT 1;
    
    -- Check for free shipping threshold
    IF v_subtotal >= 150 THEN
        SET v_shipping_amount = 0;
    END IF;
    
    -- Calculate tax on subtotal after discount
    SET v_tax_amount = (v_subtotal - v_discount_amount) * v_tax_rate;
    
    -- Calculate total
    SET v_total = v_subtotal - v_discount_amount + v_shipping_amount + v_tax_amount;
    
    SELECT 
        v_subtotal as subtotal,
        v_discount_amount as discount,
        v_shipping_amount as shipping,
        v_tax_amount as tax,
        v_total as total,
        p_discount_code as discount_code_applied;
END //

-- SP4: Get personalized product recommendations
CREATE PROCEDURE sp_get_recommendations(
    IN p_user_id CHAR(36),
    IN p_limit INT
)
BEGIN
    -- Get recommendations based on purchase history and wishlist
    SELECT DISTINCT
        p.id,
        p.name,
        p.slug,
        p.price,
        p.featured_image_url,
        pc.name as category,
        'Based on your purchases' as reason
    FROM products p
    JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.status = 'active'
        AND p.stock_quantity > 0
        AND pc.id IN (
            SELECT DISTINCT pc2.id
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p2 ON oi.product_id = p2.id
            JOIN product_categories pc2 ON p2.category_id = pc2.id
            WHERE o.user_id = p_user_id
        )
        AND p.id NOT IN (
            SELECT DISTINCT product_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = p_user_id
        )
    
    UNION
    
    SELECT DISTINCT
        p.id,
        p.name,
        p.slug,
        p.price,
        p.featured_image_url,
        pc.name as category,
        'Similar to your wishlist' as reason
    FROM products p
    JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.status = 'active'
        AND p.stock_quantity > 0
        AND pc.id IN (
            SELECT DISTINCT pc3.id
            FROM wishlists w
            JOIN products p3 ON w.product_id = p3.id
            JOIN product_categories pc3 ON p3.category_id = pc3.id
            WHERE w.user_id = p_user_id
        )
        AND p.id NOT IN (
            SELECT product_id FROM wishlists WHERE user_id = p_user_id
        )
    
    ORDER BY RAND()
    LIMIT p_limit;
END //

-- SP5: Process order checkout
CREATE PROCEDURE sp_create_order_from_cart(
    IN p_cart_id CHAR(36),
    IN p_payment_method_id CHAR(36),
    IN p_shipping_address_id CHAR(36),
    IN p_billing_address_id CHAR(36),
    IN p_discount_code VARCHAR(50),
    OUT p_order_id CHAR(36)
)
BEGIN
    DECLARE v_user_id CHAR(36);
    DECLARE v_email VARCHAR(255);
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_order_number VARCHAR(50);
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get user info from cart
    SELECT user_id INTO v_user_id FROM carts WHERE id = p_cart_id;
    SELECT email INTO v_email FROM users WHERE id = v_user_id;
    
    -- Generate order ID and number
    SET p_order_id = UUID();
    SET v_order_number = CONCAT('ATH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
    
    -- Calculate totals (simplified - would call sp_calculate_order_total in practice)
    SELECT SUM(COALESCE(pv.price, p.price) * ci.quantity) INTO v_subtotal
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = p_cart_id;
    
    -- Create order
    INSERT INTO orders (
        id, order_number, user_id, customer_email, 
        status, payment_status, subtotal, total_amount
    ) VALUES (
        p_order_id, v_order_number, v_user_id, v_email,
        'pending', 'pending', v_subtotal, v_subtotal
    );
    
    -- Copy cart items to order items
    INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, 
        product_sku, quantity, unit_price, total_price
    )
    SELECT 
        p_order_id, ci.product_id, ci.variant_id, p.name,
        p.sku, ci.quantity, COALESCE(pv.price, p.price),
        COALESCE(pv.price, p.price) * ci.quantity
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = p_cart_id;
    
    -- Copy addresses
    INSERT INTO order_addresses (order_id, type, first_name, last_name, address_line1, 
        address_line2, city, state_province, postal_code, country_code, phone)
    SELECT p_order_id, 'shipping', first_name, last_name, address_line1,
        address_line2, city, state_province, postal_code, country_code, phone
    FROM user_addresses WHERE id = p_shipping_address_id;
    
    INSERT INTO order_addresses (order_id, type, first_name, last_name, address_line1,
        address_line2, city, state_province, postal_code, country_code, phone)
    SELECT p_order_id, 'billing', first_name, last_name, address_line1,
        address_line2, city, state_province, postal_code, country_code, phone
    FROM user_addresses WHERE id = p_billing_address_id;
    
    -- Mark cart as converted
    UPDATE carts SET status = 'converted' WHERE id = p_cart_id;
    
    COMMIT;
    
    SELECT p_order_id as order_id, v_order_number as order_number;
END //

-- SP6: Get dashboard metrics
CREATE PROCEDURE sp_get_dashboard_metrics()
BEGIN
    -- Today's metrics
    SELECT 
        'today' as period,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(DISTINCT o.user_id) as customers,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
    FROM orders o
    WHERE DATE(o.created_at) = CURDATE()
        AND o.status NOT IN ('cancelled');
    
    -- This week's metrics
    SELECT 
        'week' as period,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(DISTINCT o.user_id) as customers,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
    FROM orders o
    WHERE YEARWEEK(o.created_at) = YEARWEEK(NOW())
        AND o.status NOT IN ('cancelled');
    
    -- This month's metrics
    SELECT 
        'month' as period,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(DISTINCT o.user_id) as customers,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
    FROM orders o
    WHERE YEAR(o.created_at) = YEAR(NOW())
        AND MONTH(o.created_at) = MONTH(NOW())
        AND o.status NOT IN ('cancelled');
    
    -- Pending orders
    SELECT COUNT(*) as pending_orders
    FROM orders
    WHERE status IN ('pending', 'processing', 'confirmed');
    
    -- Low stock products
    SELECT COUNT(*) as low_stock_products
    FROM product_variants
    WHERE stock_quantity < 10 AND is_active = TRUE;
    
    -- Active carts
    SELECT COUNT(*) as active_carts
    FROM carts
    WHERE status = 'active';
END //

DELIMITER ;

-- =============================================
-- VIEWS FOR QUICK ACCESS
-- =============================================

-- View for product catalog with all details
CREATE OR REPLACE VIEW v_product_catalog AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.compare_price,
    p.stock_quantity,
    p.featured_image_url,
    pc.name as category,
    pcol.name as collection,
    p.material_composition,
    p.care_instructions,
    p.sustainability_notes,
    p.status,
    p.is_featured,
    COUNT(DISTINCT pv.id) as variant_count,
    COUNT(DISTINCT pr.id) as review_count,
    COALESCE(AVG(pr.rating), 0) as avg_rating
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN product_collections pcol ON p.collection_id = pcol.id
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = TRUE
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.status = 'approved'
GROUP BY p.id;

-- View for customer orders with status
CREATE OR REPLACE VIEW v_customer_orders AS
SELECT 
    o.*,
    u.email as customer_email,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_items
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- =============================================
-- USEFUL INDEXES FOR PERFORMANCE
-- =============================================

-- Add composite indexes for common query patterns
CREATE INDEX idx_orders_user_status ON orders(user_id, status, created_at);
CREATE INDEX idx_products_featured_active ON products(is_featured, status, stock_quantity);
CREATE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id, variant_id);
CREATE INDEX idx_reviews_product_rating ON product_reviews(product_id, status, rating);

-- =============================================
-- Test the queries and procedures
-- =============================================

-- Test procedure calls
-- CALL sp_check_product_availability('ATH-WSE-001-S-WHT');
-- CALL sp_get_dashboard_metrics();
-- CALL sp_get_recommendations('u-003', 5);