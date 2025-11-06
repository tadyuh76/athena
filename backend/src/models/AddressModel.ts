import { BaseModel } from './BaseModel';

/**
 * Address Type Enum - Simplified for Vietnamese addresses
 * All addresses are shipping addresses by default
 */
export type AddressType = 'shipping' | 'both';

/**
 * User Address Interface - Vietnamese Address Structure
 * Format: Số nhà + Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố
 */
export interface UserAddress {
  id: string;
  user_id: string;
  type: AddressType;
  is_default: boolean;

  // Contact information
  first_name: string;
  last_name: string;
  phone: string; // Required for Vietnamese addresses

  // Vietnamese address structure
  address_line1: string; // Số nhà + Tên đường (e.g., "123 Nguyễn Huệ")
  address_line2?: string; // Optional additional info (e.g., apartment, building)
  city: string; // Phường/Xã (Ward)
  state_province: string; // Quận/Huyện (District)
  country_code: string; // Tỉnh/Thành phố (Province/City) - reusing this field

  // Optional fields
  company?: string;

  // Validation and geocoding
  is_validated: boolean;
  validated_at?: string;
  coordinates?: any;

  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Address Model for managing user addresses
 */
export class AddressModel extends BaseModel<UserAddress> {
  protected tableName = 'user_addresses';

  /**
   * Find all addresses for a specific user (excluding soft-deleted)
   */
  async findByUserId(userId: string): Promise<UserAddress[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as UserAddress[];
    } catch (error) {
      throw new Error(`Failed to find addresses for user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find default address for a user
   */
  async findDefaultByUserId(userId: string): Promise<UserAddress | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No default address found
        }
        throw error;
      }

      return data as UserAddress;
    } catch (error) {
      throw new Error(`Failed to find default address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find an address by ID and verify it belongs to the user
   */
  async findByIdAndUserId(addressId: string, userId: string): Promise<UserAddress | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', addressId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as UserAddress;
    } catch (error) {
      throw new Error(`Failed to find address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set an address as the default for a user
   * Unsets any existing default address first
   */
  async setAsDefault(addressId: string, userId: string): Promise<boolean> {
    try {
      // Start a transaction-like operation
      // First, unset all existing defaults for this user
      const { error: unsetError } = await this.client
        .from(this.tableName)
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);

      if (unsetError) {
        throw unsetError;
      }

      // Then set the new default
      const { error: setError } = await this.client
        .from(this.tableName)
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (setError) {
        throw setError;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to set default address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new address and optionally set it as default
   */
  async createAddress(addressData: Partial<UserAddress>): Promise<UserAddress> {
    try {
      console.log('[AddressModel.createAddress] Starting with data:', JSON.stringify(addressData, null, 2));

      // If this should be the default, unset existing defaults first
      if (addressData.is_default && addressData.user_id) {
        console.log('[AddressModel.createAddress] Unsetting existing defaults for user:', addressData.user_id);
        const { error: unsetError } = await this.client
          .from(this.tableName)
          .update({ is_default: false })
          .eq('user_id', addressData.user_id)
          .eq('is_default', true);

        if (unsetError) {
          console.error('[AddressModel.createAddress] Error unsetting defaults:', unsetError);
        }
      }

      console.log('[AddressModel.createAddress] Calling create with data');
      const result = await this.create(addressData);
      console.log('[AddressModel.createAddress] Successfully created address:', result.id);
      return result;
    } catch (error) {
      console.error('[AddressModel.createAddress] Error:', error);
      throw new Error(`Failed to create address: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  /**
   * Update an address
   * If setting as default, unset other defaults first
   */
  async updateAddress(addressId: string, userId: string, updates: Partial<UserAddress>): Promise<UserAddress> {
    try {
      // If setting as default, unset existing defaults first
      if (updates.is_default === true) {
        await this.client
          .from(this.tableName)
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true)
          .neq('id', addressId);
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .update(updates as any)
        .eq('id', addressId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as UserAddress;
    } catch (error) {
      throw new Error(`Failed to update address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Soft delete an address
   */
  async softDeleteAddress(addressId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count addresses for a user (excluding soft-deleted)
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw new Error(`Failed to count addresses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
