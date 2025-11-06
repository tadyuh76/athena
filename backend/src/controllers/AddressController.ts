import { ServerResponse } from 'http';
import { AddressService } from '../services/AddressService';
import { AuthRequest } from '../middleware/auth';
import { parseBody, sendJSON, sendError } from '../utils/request-handler';

/**
 * Address Controller
 * Handles HTTP requests for user address management
 */
export class AddressController {
  private addressService: AddressService;

  constructor() {
    this.addressService = new AddressService();
  }

  /**
   * GET /api/addresses
   * Get all addresses for the authenticated user
   */
  async getAddresses(req: AuthRequest, res: ServerResponse) {
    try {
      if (!req.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const addresses = await this.addressService.getUserAddresses(req.userId);
      sendJSON(res, 200, { addresses });
    } catch (error) {
      console.error('[AddressController.getAddresses] Error:', error);
      sendError(res, 500, 'Failed to fetch addresses');
    }
  }

  /**
   * GET /api/addresses/:id
   * Get a specific address by ID
   */
  async getAddressById(req: AuthRequest, res: ServerResponse, addressId: string) {
    try {
      if (!req.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const address = await this.addressService.getAddressById(addressId, req.userId);

      if (!address) {
        sendError(res, 404, 'Address not found');
        return;
      }

      sendJSON(res, 200, { address });
    } catch (error) {
      console.error('[AddressController.getAddressById] Error:', error);
      sendError(res, 500, 'Failed to fetch address');
    }
  }

  /**
   * GET /api/addresses/default
   * Get the default address for the authenticated user
   */
  async getDefaultAddress(req: AuthRequest, res: ServerResponse) {
    try {
      if (!req.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const address = await this.addressService.getDefaultAddress(req.userId);

      if (!address) {
        sendJSON(res, 200, { address: null });
        return;
      }

      sendJSON(res, 200, { address });
    } catch (error) {
      console.error('[AddressController.getDefaultAddress] Error:', error);
      sendError(res, 500, 'Failed to fetch default address');
    }
  }

  /**
   * POST /api/addresses
   * Create a new address
   */
  async createAddress(req: AuthRequest, res: ServerResponse) {
    try {
      if (!req.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const body = await parseBody(req);

      // Validate required fields
      if (!body.first_name || !body.last_name || !body.address_line1 || !body.city || !body.country_code) {
        sendError(res, 400, 'Missing required fields');
        return;
      }

      const address = await this.addressService.createAddress(req.userId, body);
      sendJSON(res, 201, { address });
    } catch (error) {
      console.error('[AddressController.createAddress] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create address';
      sendError(res, 400, errorMessage);
    }
  }

  /**
   * PUT /api/addresses/:id
   * Update an existing address
   */
  async updateAddress(req: AuthRequest, res: ServerResponse, addressId: string) {
    try {
      if (!req.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const body = await parseBody(req);
      const address = await this.addressService.updateAddress(addressId, req.userId, body);
      sendJSON(res, 200, { address });
    } catch (error) {
      console.error('[AddressController.updateAddress] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update address';

      if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
        sendError(res, 404, errorMessage);
      } else {
        sendError(res, 400, errorMessage);
      }
    }
  }

  /**
   * DELETE /api/addresses/:id
   * Delete (soft delete) an address
   */
  async deleteAddress(req: AuthRequest, res: ServerResponse, addressId: string) {
    try {
      if (!req.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      await this.addressService.deleteAddress(addressId, req.userId);
      sendJSON(res, 200, { success: true, message: 'Address deleted successfully' });
    } catch (error) {
      console.error('[AddressController.deleteAddress] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete address';

      if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
        sendError(res, 404, errorMessage);
      } else if (errorMessage.includes('Cannot delete default')) {
        sendError(res, 400, errorMessage);
      } else {
        sendError(res, 500, errorMessage);
      }
    }
  }

  /**
   * PUT /api/addresses/:id/default
   * Set an address as the default
   */
  async setDefaultAddress(req: AuthRequest, res: ServerResponse, addressId: string) {
    try {
      if (!req.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const address = await this.addressService.setDefaultAddress(addressId, req.userId);
      sendJSON(res, 200, { address, message: 'Default address updated successfully' });
    } catch (error) {
      console.error('[AddressController.setDefaultAddress] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set default address';

      if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
        sendError(res, 404, errorMessage);
      } else {
        sendError(res, 500, errorMessage);
      }
    }
  }
}
