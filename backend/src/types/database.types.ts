export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_verified: boolean;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  role: 'customer' | 'admin' | 'staff';
  last_login_at?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  sent_at: Date;
  status: 'sent' | 'failed' | 'pending';
  metadata?: Record<string, any>;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  collection_id?: string;
  base_price: number;
  compare_price?: number;
  cost?: number;
  currency_code: string;
  track_inventory: boolean;
  allow_backorder: boolean;
  low_stock_threshold: number;
  weight_value?: number;
  weight_unit?: 'kg' | 'g' | 'lb' | 'oz';
  material_composition?: Record<string, any>;
  care_instructions?: string;
  sustainability_notes?: string;
  production_method?: string;
  certification_labels?: string[];
  meta_title?: string;
  meta_description?: string;
  featured_image_url?: string;
  status: 'draft' | 'active' | 'archived';
  is_featured: boolean;
  published_at?: Date;
  view_count: number;
  rating?: number;
  review_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size?: string;
  color?: string;
  color_hex?: string;
  attributes?: Record<string, any>;
  price?: number;
  compare_price?: number;
  inventory_quantity: number;
  reserved_quantity: number;
  image_url?: string;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Cart {
  id: string;
  user_id?: string;
  session_id?: string;
  status: 'active' | 'abandoned' | 'converted' | 'merged';
  abandoned_at?: Date;
  reminder_sent_at?: Date;
  converted_at?: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price_at_time: number;
  inventory_reserved_until?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  priority: number;
  notes?: string;
  created_at: Date;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_email: string;
  customer_phone?: string;
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  fulfillment_status: 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'returned';
  currency_code: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_method?: string;
  estimated_delivery_date?: Date;
  ip_address?: string;
  user_agent?: string;
  customer_notes?: string;
  internal_notes?: string;
  metadata?: Record<string, any>;
  confirmed_at?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
  cancelled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  product_sku: string;
  variant_title?: string;
  product_image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
  fulfilled_quantity: number;
  returned_quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserAddress {
  id: string;
  user_id: string;
  type: 'billing' | 'shipping' | 'both';
  is_default: boolean;
  first_name: string;
  last_name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country_code: string;
  phone?: string;
  is_validated: boolean;
  validated_at?: Date;
  coordinates?: { x: number; y: number };
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  theme_name?: string;
  hero_image_url?: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  starts_at?: Date;
  ends_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id?: string;
  url: string;
  alt_text?: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: Date;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  review?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
}