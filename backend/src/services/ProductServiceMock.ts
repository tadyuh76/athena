// Mock ProductService for when Supabase is unavailable
export class ProductServiceMock {
  async getProducts(_filter: any = {}, page: number = 1, _limit: number = 20) {
    const mockProducts = [
      {
        id: '1',
        name: 'Classic White Shirt',
        slug: 'classic-white-shirt',
        description: 'A timeless white shirt crafted from premium organic cotton.',
        short_description: 'Premium organic cotton shirt',
        base_price: 89.99,
        compare_price: 120.00,
        sku: 'CWS-001',
        status: 'active',
        featured_image_url: '/images/placeholder-user.jpg',
        category_id: '1',
        collection_id: '1',
        material: '100% Organic Cotton',
        rating: 4.5,
        review_count: 24,
        variants: [
          {
            id: '1',
            product_id: '1',
            sku: 'CWS-001-S-WHITE',
            size: 'S',
            color: 'White',
            color_hex: '#FFFFFF',
            price: 89.99,
            inventory_quantity: 10,
            reserved_quantity: 0,
            is_default: false
          },
          {
            id: '2',
            product_id: '1',
            sku: 'CWS-001-M-WHITE',
            size: 'M',
            color: 'White',
            color_hex: '#FFFFFF',
            price: 89.99,
            inventory_quantity: 15,
            reserved_quantity: 0,
            is_default: true
          },
          {
            id: '3',
            product_id: '1',
            sku: 'CWS-001-L-WHITE',
            size: 'L',
            color: 'White',
            color_hex: '#FFFFFF',
            price: 89.99,
            inventory_quantity: 12,
            reserved_quantity: 0,
            is_default: false
          }
        ],
        images: [
          {
            id: '1',
            product_id: '1',
            url: '/images/placeholder-user.jpg',
            alt_text: 'Classic White Shirt',
            is_primary: true,
            display_order: 1
          }
        ],
        category: { id: '1', name: 'Shirts', slug: 'shirts' },
        collection: { id: '1', name: 'Essentials', slug: 'essentials' }
      },
      {
        id: '2',
        name: 'Minimalist Black Dress',
        slug: 'minimalist-black-dress',
        description: 'Elegant black dress with clean lines and perfect drape.',
        short_description: 'Elegant minimalist dress',
        base_price: 149.99,
        compare_price: 199.99,
        sku: 'MBD-001',
        status: 'active',
        featured_image_url: '/images/placeholder-user.jpg',
        category_id: '2',
        collection_id: '1',
        material: '100% Organic Cotton',
        rating: 5.0,
        review_count: 45,
        variants: [
          {
            id: '4',
            product_id: '2',
            sku: 'MBD-001-XS-BLACK',
            size: 'XS',
            color: 'Black',
            color_hex: '#000000',
            price: 149.99,
            inventory_quantity: 8,
            reserved_quantity: 0,
            is_default: false
          },
          {
            id: '5',
            product_id: '2',
            sku: 'MBD-001-S-BLACK',
            size: 'S',
            color: 'Black',
            color_hex: '#000000',
            price: 149.99,
            inventory_quantity: 12,
            reserved_quantity: 0,
            is_default: true
          },
          {
            id: '6',
            product_id: '2',
            sku: 'MBD-001-M-BLACK',
            size: 'M',
            color: 'Black',
            color_hex: '#000000',
            price: 149.99,
            inventory_quantity: 10,
            reserved_quantity: 0,
            is_default: false
          }
        ],
        images: [
          {
            id: '2',
            product_id: '2',
            url: '/images/placeholder-user.jpg',
            alt_text: 'Minimalist Black Dress',
            is_primary: true,
            display_order: 1
          }
        ],
        category: { id: '2', name: 'Dresses', slug: 'dresses' },
        collection: { id: '1', name: 'Essentials', slug: 'essentials' }
      },
      {
        id: '3',
        name: 'Organic Cotton Tee',
        slug: 'organic-cotton-tee',
        description: 'Soft and sustainable basic tee.',
        short_description: 'Sustainable basic tee',
        base_price: 45.00,
        compare_price: null,
        sku: 'OCT-001',
        status: 'active',
        featured_image_url: '/images/placeholder-user.jpg',
        category_id: '3',
        collection_id: '2',
        material: '100% Organic Cotton',
        rating: 4.8,
        review_count: 89,
        variants: [
          {
            id: '7',
            product_id: '3',
            sku: 'OCT-001-S-WHITE',
            size: 'S',
            color: 'White',
            color_hex: '#FFFFFF',
            price: 45.00,
            inventory_quantity: 20,
            reserved_quantity: 0,
            is_default: false
          },
          {
            id: '8',
            product_id: '3',
            sku: 'OCT-001-M-WHITE',
            size: 'M',
            color: 'White',
            color_hex: '#FFFFFF',
            price: 45.00,
            inventory_quantity: 25,
            reserved_quantity: 0,
            is_default: true
          },
          {
            id: '9',
            product_id: '3',
            sku: 'OCT-001-M-BLACK',
            size: 'M',
            color: 'Black',
            color_hex: '#000000',
            price: 45.00,
            inventory_quantity: 18,
            reserved_quantity: 0,
            is_default: false
          }
        ],
        images: [
          {
            id: '3',
            product_id: '3',
            url: '/images/placeholder-user.jpg',
            alt_text: 'Organic Cotton Tee',
            is_primary: true,
            display_order: 1
          }
        ],
        category: { id: '3', name: 'T-Shirts', slug: 't-shirts' },
        collection: { id: '2', name: 'Basics', slug: 'basics' }
      }
    ];

    return {
      products: mockProducts,
      total: mockProducts.length,
      page,
      totalPages: 1
    };
  }

  async getProductById(id: string) {
    const products = await this.getProducts();
    return products.products.find(p => p.id === id) || null;
  }

  async getCategories() {
    return [
      { id: '1', name: 'Shirts', slug: 'shirts', description: 'Premium shirts' },
      { id: '2', name: 'Dresses', slug: 'dresses', description: 'Elegant dresses' },
      { id: '3', name: 'T-Shirts', slug: 't-shirts', description: 'Basic tees' }
    ];
  }

  async getCollections() {
    return [
      { id: '1', name: 'Essentials', slug: 'essentials', description: 'Essential pieces' },
      { id: '2', name: 'Basics', slug: 'basics', description: 'Basic wardrobe' }
    ];
  }
}
