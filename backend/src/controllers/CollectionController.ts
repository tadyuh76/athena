import { IncomingMessage, ServerResponse } from "http";
import { CollectionService } from "../services/CollectionService";
import { parseBody, sendJSON, sendError } from "../utils/request-handler";

export const CollectionController = {
  async getAll(req: IncomingMessage, res: ServerResponse) {
    try {
      const data = await CollectionService.getAll();
      sendJSON(res, 200, { success: true, data });
    } catch (err: any) {
      console.error("❌ Lỗi getAll Collections:", err);
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

  async remove(req: IncomingMessage, res: ServerResponse, params: any) {
    try {
      const id = params?.id;
      if (!id) return sendError(res, 400, "Thiếu ID collection");

      const data = await CollectionService.delete(id);
      sendJSON(res, 200, { success: true, data });
    } catch (err: any) {
      console.error("❌ Lỗi remove Collection:", err);
      sendError(res, 500, err.message);
    }
  },
};
