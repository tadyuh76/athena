import { supabaseAdmin } from "../utils/supabase";
import { AdminOrderService } from "../services/AdminOrderService";
import { parseBody } from "../utils/request-handler";

const service = new AdminOrderService();

export class AdminOrderController {
  // ==========================================================
  // GET /api/orders (public)
  // ==========================================================
  async list(req: any, res: any) {
    try {
      const url = req.url || "";
      const queryString = url.split("?")[1] || "";
      const params = Object.fromEntries(new URLSearchParams(queryString));

      const opts = {
        q: params.q,
        status: params.status,
        limit: params.limit ? Number(params.limit) : undefined,
        offset: params.offset ? Number(params.offset) : undefined,
      };

      const data = await service.list(opts);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data }));
    } catch (err: any) {
      console.error("AdminOrderController.list error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // ==========================================================
  // GET /api/orders/:id  (public)
  // ==========================================================
  async getById(req: any, res: any, orderId: string) {
    try {
      const data = await service.getById(orderId);
      if (!data) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: "Order not found" }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data }));
    } catch (err: any) {
      console.error("AdminOrderController.getById error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // ==========================================================
  // PUT /api/orders/:id (public — update status, v.v.)
  // ==========================================================
  async update(req: any, res: any, orderId: string) {
    try {
      const body = await parseBody(req);
      const allowed = [
        "status",
        "payment_status",
        "fulfillment_status",
        "confirmed_at",
        "shipped_at",
        "delivered_at",
        "cancelled_at",
        "estimated_delivery_date",
      ];

      const payload: any = {};
      for (const k of allowed) {
        if (body[k] !== undefined) payload[k] = body[k];
      }

      if (Object.keys(payload).length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: "No valid fields to update" }));
      }

      const updated = await service.update(orderId, payload);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data: updated }));
    } catch (err: any) {
      console.error("AdminOrderController.update error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }
}
