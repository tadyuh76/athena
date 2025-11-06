CREATE OR REPLACE FUNCTION cleanup_expired_cart_reservations()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE product_variants pv
  SET reserved_quantity = GREATEST(0, pv.reserved_quantity - COALESCE(expired.total_reserved, 0)),
      updated_at = NOW()
  FROM (
    SELECT ci.variant_id, SUM(ci.quantity) as total_reserved
    FROM cart_items ci
    WHERE ci.inventory_reserved_until < NOW()
    GROUP BY ci.variant_id
  ) expired
  WHERE pv.id = expired.variant_id;
  
  DELETE FROM cart_items WHERE inventory_reserved_until < NOW();
END;
$$;

-- Run every 5 minutes
SELECT cron.schedule('cleanup-cart-reservations', '*/5 * * * *', 
  $$SELECT cleanup_expired_cart_reservations();$$
);
