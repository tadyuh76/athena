-- Additional Orders for Testing
INSERT INTO orders (
    order_number,
    user_id,
    customer_email,
    customer_phone,
    status,
    payment_status,
    fulfillment_status,
    currency_code,
    subtotal,
    tax_amount,
    shipping_amount,
    discount_amount,
    total_amount,
    shipping_method,
    estimated_delivery_date,
    customer_notes,
    internal_notes,
    created_at,
    updated_at
) VALUES 
    -- VIP Customer Order
    (
        'ATH-20251104-0007',
        (SELECT id FROM users LIMIT 1 OFFSET 6),
        'ngoc.tran@example.com',
        '0903456789',
        'processing',
        'paid',
        'partially_fulfilled',
        'USD',
        1850000,
        0,
        50000,
        100000,
        1800000,
        'Express Shipping',
        NOW() + INTERVAL '4 days',
        'Please call before delivery',
        'Premium customer - VIP handling',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    ),
    -- Birthday Gift Order
    (
        'ATH-20251104-0008',
        (SELECT id FROM users LIMIT 1 OFFSET 7),
        'minh.nguyen@example.com',
        '0908123456',
        'confirmed',
        'paid',
        'unfulfilled',
        'USD',
        2100000,
        0,
        50000,
        150000,
        2000000,
        'Standard Shipping',
        NOW() + INTERVAL '6 days',
        'Gift wrapping needed - Birthday gift',
        'Expedite processing requested',
        NOW() - INTERVAL '12 hours',
        NOW() - INTERVAL '12 hours'
    ),
    -- Front Desk Delivery Order
    (
        'ATH-20251104-0009',
        (SELECT id FROM users LIMIT 1 OFFSET 8),
        'thu.pham@example.com',
        '0904789123',
        'pending',
        'pending',
        'unfulfilled',
        'USD',
        1350000,
        0,
        50000,
        0,
        1400000,
        'Standard Shipping',
        NOW() + INTERVAL '7 days',
        'Leave at front desk if not home',
        NULL,
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours'
    );

-- Add order items for new orders
INSERT INTO order_items (
    order_id,
    product_id,
    variant_id,
    product_name,
    product_sku,
    variant_title,
    product_image_url,
    quantity,
    unit_price,
    total_price,
    discount_amount,
    tax_amount,
    fulfilled_quantity,
    returned_quantity
)
SELECT 
    o.id as order_id,
    p.id as product_id,
    pv.id as variant_id,
    p.name as product_name,
    pv.sku as product_sku,
    pv.size || ' - ' || pv.color as variant_title,
    COALESCE(pi.url, '/images/minimalist-fashion-model.png') as product_image_url,
    qty.quantity,
    pv.price as unit_price,
    pv.price * qty.quantity as total_price,
    0 as discount_amount,
    0 as tax_amount,
    CASE 
        WHEN o.status = 'processing' THEN FLOOR(qty.quantity / 2)
        ELSE 0
    END as fulfilled_quantity,
    0 as returned_quantity
FROM orders o
CROSS JOIN LATERAL (
    SELECT id, name FROM products 
    WHERE id IN (
        '6d185e0d-0108-4d94-9ef0-19508a998b32', -- Architectural Midi Dress
        '60ba91af-f752-4369-9c57-1e6c106a0ff7', -- Essential White Blazer
        '0a78b541-4ae6-4d6c-8b8d-c363df390645', -- Minimalist Trousers
        'f3a18c2d-046c-4738-b982-76bbce5e60a0', -- Architectural Coat
        '15c5bb75-6eca-4266-9a39-0c8e6dc058eb'  -- Essential Silk Blouse
    )
    ORDER BY RANDOM() 
    LIMIT 1
) p
CROSS JOIN LATERAL (
    SELECT id, sku, size, color, price
    FROM product_variants 
    WHERE product_id = p.id
    ORDER BY RANDOM() 
    LIMIT 1
) pv
LEFT JOIN LATERAL (
    SELECT url 
    FROM product_images 
    WHERE product_id = p.id 
    AND is_primary = true 
    LIMIT 1
) pi ON true
CROSS JOIN LATERAL (
    SELECT FLOOR(RANDOM() * 2) + 1 as quantity
) qty
WHERE o.order_number IN ('ATH-20251104-0007', 'ATH-20251104-0008', 'ATH-20251104-0009');

-- Add shipping addresses for new orders
INSERT INTO order_addresses (
    order_id,
    type,
    first_name,
    last_name,
    address_line1,
    city,
    state_province,
    postal_code,
    country_code,
    phone
)
SELECT 
    o.id,
    'shipping',
    CASE 
        WHEN o.customer_email = 'ngoc.tran@example.com' THEN 'Ngoc'
        WHEN o.customer_email = 'minh.nguyen@example.com' THEN 'Minh'
        WHEN o.customer_email = 'thu.pham@example.com' THEN 'Thu'
    END,
    CASE 
        WHEN o.customer_email = 'ngoc.tran@example.com' THEN 'Tran'
        WHEN o.customer_email = 'minh.nguyen@example.com' THEN 'Nguyen'
        WHEN o.customer_email = 'thu.pham@example.com' THEN 'Pham'
    END,
    CASE 
        WHEN o.customer_email = 'ngoc.tran@example.com' THEN '42 Nguyen Hue Boulevard, Ben Nghe Ward'
        WHEN o.customer_email = 'minh.nguyen@example.com' THEN '156 Le Thanh Ton Street, Ben Thanh Ward'
        WHEN o.customer_email = 'thu.pham@example.com' THEN '287 Nguyen Dinh Chieu Street, Ward 5'
    END,
    'Ho Chi Minh City',
    CASE 
        WHEN o.customer_email = 'ngoc.tran@example.com' THEN 'District 1'
        WHEN o.customer_email = 'minh.nguyen@example.com' THEN 'District 1'
        WHEN o.customer_email = 'thu.pham@example.com' THEN 'District 3'
    END,
    '700000',
    'VN',
    o.customer_phone
FROM orders o
WHERE o.order_number IN ('ATH-20251104-0007', 'ATH-20251104-0008', 'ATH-20251104-0009');

-- Add billing addresses (same as shipping)
INSERT INTO order_addresses (
    order_id,
    type,
    first_name,
    last_name,
    address_line1,
    city,
    state_province,
    postal_code,
    country_code,
    phone
)
SELECT 
    o.id,
    'billing',
    CASE 
        WHEN o.customer_email = 'ngoc.tran@example.com' THEN 'Ngoc'
        WHEN o.customer_email = 'minh.nguyen@example.com' THEN 'Minh'
        WHEN o.customer_email = 'thu.pham@example.com' THEN 'Thu'
    END,
    CASE 
        WHEN o.customer_email = 'ngoc.tran@example.com' THEN 'Tran'
        WHEN o.customer_email = 'minh.nguyen@example.com' THEN 'Nguyen'
        WHEN o.customer_email = 'thu.pham@example.com' THEN 'Pham'
    END,
    CASE 
        WHEN o.customer_email = 'ngoc.tran@example.com' THEN '42 Nguyen Hue Boulevard, Ben Nghe Ward'
        WHEN o.customer_email = 'minh.nguyen@example.com' THEN '156 Le Thanh Ton Street, Ben Thanh Ward'
        WHEN o.customer_email = 'thu.pham@example.com' THEN '287 Nguyen Dinh Chieu Street, Ward 5'
    END,
    'Ho Chi Minh City',
    CASE 
        WHEN o.customer_email = 'ngoc.tran@example.com' THEN 'District 1'
        WHEN o.customer_email = 'minh.nguyen@example.com' THEN 'District 1'
        WHEN o.customer_email = 'thu.pham@example.com' THEN 'District 3'
    END,
    '700000',
    'VN',
    o.customer_phone
FROM orders o
WHERE o.order_number IN ('ATH-20251104-0007', 'ATH-20251104-0008', 'ATH-20251104-0009');