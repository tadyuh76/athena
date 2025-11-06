import { AddressModel, UserAddress, AddressType } from '../models/AddressModel';

/**
 * Address creation/update input interface - Vietnamese Format
 * Structure: Số nhà + Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố
 */
export interface AddressInput {
  type?: AddressType;
  is_default?: boolean;
  first_name: string;
  last_name: string;
  phone: string; // Required for Vietnamese addresses
  company?: string;
  address_line1: string; // Số nhà + Tên đường
  address_line2?: string; // Optional (căn hộ, tòa nhà, etc.)
  city: string; // Phường/Xã (Ward)
  state_province: string; // Quận/Huyện (District) - Required for Vietnamese addresses
  country_code: string; // Tỉnh/Thành phố (Province/City)
}

/**
 * Address Service for managing user addresses
 */
export class AddressService {
  private addressModel: AddressModel;

  constructor() {
    this.addressModel = new AddressModel();
  }

  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    try {
      return await this.addressModel.findByUserId(userId);
    } catch (error) {
      throw new Error(`Không thể lấy danh sách địa chỉ: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get a specific address by ID (with user verification)
   */
  async getAddressById(addressId: string, userId: string): Promise<UserAddress | null> {
    try {
      return await this.addressModel.findByIdAndUserId(addressId, userId);
    } catch (error) {
      throw new Error(`Không thể lấy địa chỉ: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get user's default address
   */
  async getDefaultAddress(userId: string): Promise<UserAddress | null> {
    try {
      return await this.addressModel.findDefaultByUserId(userId);
    } catch (error) {
      throw new Error(`Không thể lấy địa chỉ mặc định: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Create a new address for a user
   */
  async createAddress(userId: string, addressInput: AddressInput): Promise<UserAddress> {
    try {
      console.log('[AddressService.createAddress] Starting for user:', userId);
      console.log('[AddressService.createAddress] Input:', JSON.stringify(addressInput, null, 2));

      // Validate required fields
      this.validateAddressInput(addressInput);
      console.log('[AddressService.createAddress] Validation passed');

      // Check if this is the user's first address
      const addressCount = await this.addressModel.countByUserId(userId);
      const isFirstAddress = addressCount === 0;
      console.log('[AddressService.createAddress] Address count:', addressCount, 'Is first:', isFirstAddress);

      // Prepare address data - Vietnamese format
      const addressData: Partial<UserAddress> = {
        user_id: userId,
        type: addressInput.type || 'shipping', // Default to shipping address
        is_default: addressInput.is_default !== undefined ? addressInput.is_default : isFirstAddress,
        first_name: addressInput.first_name.trim(),
        last_name: addressInput.last_name.trim(),
        phone: addressInput.phone.trim(), // Required field
        company: addressInput.company?.trim() || undefined,
        address_line1: addressInput.address_line1.trim(), // Số nhà + Tên đường
        address_line2: addressInput.address_line2?.trim() || undefined, // Optional
        city: addressInput.city.trim(), // Phường/Xã
        state_province: addressInput.state_province.trim(), // Quận/Huyện
        country_code: addressInput.country_code.trim(), // Tỉnh/Thành phố
        is_validated: false,
      };

      console.log('[AddressService.createAddress] Prepared data:', JSON.stringify(addressData, null, 2));
      const result = await this.addressModel.createAddress(addressData);
      console.log('[AddressService.createAddress] Successfully created address:', result.id);
      return result;
    } catch (error) {
      console.error('[AddressService.createAddress] Error:', error);
      throw new Error(`Không thể tạo địa chỉ: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressId: string, userId: string, addressInput: Partial<AddressInput>): Promise<UserAddress> {
    try {
      // Verify address exists and belongs to user
      const existingAddress = await this.addressModel.findByIdAndUserId(addressId, userId);
      if (!existingAddress) {
        throw new Error('Không tìm thấy địa chỉ hoặc không có quyền truy cập');
      }

      // Validate if full address data is provided
      if (this.isFullAddressUpdate(addressInput)) {
        this.validateAddressInput(addressInput as AddressInput);
      }

      // Prepare update data
      const updates: Partial<UserAddress> = {};

      if (addressInput.type !== undefined) updates.type = addressInput.type;
      if (addressInput.is_default !== undefined) updates.is_default = addressInput.is_default;
      if (addressInput.first_name) updates.first_name = addressInput.first_name.trim();
      if (addressInput.last_name) updates.last_name = addressInput.last_name.trim();
      if (addressInput.company !== undefined) updates.company = addressInput.company?.trim();
      if (addressInput.address_line1) updates.address_line1 = addressInput.address_line1.trim();
      if (addressInput.address_line2 !== undefined) updates.address_line2 = addressInput.address_line2?.trim();
      if (addressInput.city) updates.city = addressInput.city.trim(); // Phường/Xã
      if (addressInput.state_province) updates.state_province = addressInput.state_province.trim(); // Quận/Huyện
      if (addressInput.country_code) updates.country_code = addressInput.country_code; // Tỉnh/Thành phố
      if (addressInput.phone) updates.phone = addressInput.phone.trim();

      // If address data changed, mark as unvalidated
      if (Object.keys(updates).some(key =>
        ['address_line1', 'address_line2', 'city', 'state_province', 'postal_code', 'country_code'].includes(key)
      )) {
        updates.is_validated = false;
        updates.validated_at = undefined;
      }

      return await this.addressModel.updateAddress(addressId, userId, updates);
    } catch (error) {
      throw new Error(`Không thể cập nhật địa chỉ: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Delete an address (soft delete)
   */
  async deleteAddress(addressId: string, userId: string): Promise<void> {
    try {
      // Verify address exists and belongs to user
      const existingAddress = await this.addressModel.findByIdAndUserId(addressId, userId);
      if (!existingAddress) {
        throw new Error('Không tìm thấy địa chỉ hoặc không có quyền truy cập');
      }

      // Check if this is the default address
      if (existingAddress.is_default) {
        // Count remaining addresses
        const addressCount = await this.addressModel.countByUserId(userId);

        // If there are other addresses, suggest setting a new default
        if (addressCount > 1) {
          throw new Error('Không thể xóa địa chỉ mặc định. Vui lòng đặt địa chỉ khác làm mặc định trước.');
        }
      }

      await this.addressModel.softDeleteAddress(addressId, userId);
    } catch (error) {
      throw new Error(`Không thể xóa địa chỉ: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Set an address as the default
   */
  async setDefaultAddress(addressId: string, userId: string): Promise<UserAddress> {
    try {
      // Verify address exists and belongs to user
      const existingAddress = await this.addressModel.findByIdAndUserId(addressId, userId);
      if (!existingAddress) {
        throw new Error('Không tìm thấy địa chỉ hoặc không có quyền truy cập');
      }

      // Set as default
      await this.addressModel.setAsDefault(addressId, userId);

      // Return updated address
      const updatedAddress = await this.addressModel.findByIdAndUserId(addressId, userId);
      if (!updatedAddress) {
        throw new Error('Không thể lấy địa chỉ đã cập nhật');
      }

      return updatedAddress;
    } catch (error) {
      throw new Error(`Không thể đặt địa chỉ mặc định: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Validate address input data - Vietnamese format
   */
  private validateAddressInput(input: AddressInput): void {
    const errors: string[] = [];

    if (!input.first_name?.trim()) errors.push('Họ là bắt buộc');
    if (!input.last_name?.trim()) errors.push('Tên là bắt buộc');
    if (!input.phone?.trim()) errors.push('Số điện thoại là bắt buộc');
    if (!input.address_line1?.trim()) errors.push('Số nhà và tên đường là bắt buộc');
    if (!input.city?.trim()) errors.push('Phường/Xã là bắt buộc');
    if (!input.state_province?.trim()) errors.push('Quận/Huyện là bắt buộc');
    if (!input.country_code?.trim()) errors.push('Tỉnh/Thành phố là bắt buộc');

    // Validate phone format (Vietnamese phone numbers)
    if (input.phone && input.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(input.phone)) {
      errors.push('Số điện thoại chứa ký tự không hợp lệ');
    }

    if (errors.length > 0) {
      throw new Error(`Xác thực thất bại: ${errors.join(', ')}`);
    }
  }

  /**
   * Check if the update contains all required fields for full address validation
   */
  private isFullAddressUpdate(input: Partial<AddressInput>): boolean {
    return !!(
      input.first_name &&
      input.last_name &&
      input.address_line1 &&
      input.city &&
      input.country_code
    );
  }
}
