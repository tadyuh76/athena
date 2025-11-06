import { IncomingMessage, ServerResponse } from "http";
import { CollectionService } from "../services/CollectionService";
import { parseBody, sendJSON, sendError } from "../utils/request-handler";
import { MultipartParser } from "../utils/multipart-parser";
import { StorageService } from "../utils/storage";

export const CollectionController = {
  async getAll(_req: IncomingMessage, res: ServerResponse) {
    try {
      const data = await CollectionService.getAll();
      sendJSON(res, 200, { success: true, data });
    } catch (err: any) {
      console.error("Error getting all collections:", err);
      sendError(res, 500, err.message);
    }
  },

  async create(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const data = await CollectionService.create(body);
      sendJSON(res, 201, { success: true, data });
    } catch (err: any) {
      console.error("❌ Lỗi create Collection:", err);
      sendError(res, 500, err.message);
    }
  },

  async update(req: IncomingMessage, res: ServerResponse, params: any) {
    try {
      const id = params?.id;
      if (!id) return sendError(res, 400, "Thiếu ID collection");

      const body = await parseBody(req);
      const data = await CollectionService.update(id, body);
      sendJSON(res, 200, { success: true, data });
    } catch (err: any) {
      console.error("❌ Lỗi update Collection:", err);
      sendError(res, 500, err.message);
    }
  },

  async remove(_req: IncomingMessage, res: ServerResponse, params: any) {
    try {
      const id = params?.id;
      if (!id) return sendError(res, 400, "Missing collection ID");

      const data = await CollectionService.delete(id);
      sendJSON(res, 200, { success: true, data });
    } catch (err: any) {
      console.error("Error removing collection:", err);
      sendError(res, 500, err.message);
    }
  },

  async uploadImage(req: IncomingMessage, res: ServerResponse) {
    try {
      // Check content type
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('multipart/form-data')) {
        sendError(res, 400, 'Content-Type must be multipart/form-data');
        return;
      }

      // Check content length (max 10MB for collection images)
      const contentLength = MultipartParser.getContentLength(req);
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (contentLength > maxSize) {
        sendError(res, 413, 'File size exceeds 10MB limit');
        return;
      }

      // Parse multipart form data
      const { files } = await MultipartParser.parse(req);

      if (!files || files.length === 0) {
        sendError(res, 400, 'No file uploaded');
        return;
      }

      const file = files[0];

      // Validate file
      StorageService.validateCollectionImage(file.mimeType, file.data.length);

      // Upload to Supabase Storage
      const publicUrl = await StorageService.uploadCollectionImage(
        file.data,
        file.filename,
        file.mimeType
      );

      sendJSON(res, 200, { success: true, url: publicUrl });
    } catch (error) {
      console.error('Error uploading collection image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      sendError(res, 500, errorMessage);
    }
  },
};
