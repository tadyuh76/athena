import { Router } from "../../router/Router";
import { AdminOrderController } from "../../controllers/AdminOrderController";

const controller = new AdminOrderController();

export function registerPublicOrderRoutes(router: Router): void {
  // Danh sách đơn hàng (public)
  router.get("/api/orders", (req, res) => {
    return controller.list(req, res);
  });

  // Chi tiết đơn hàng (public)
  router.get("/api/orders/:id", (req, res, params) => {
    return controller.getById(req, res, params.id);
  });

  // Cập nhật đơn hàng (public)
  router.put("/api/orders/:id", (req, res, params) => {
    return controller.update(req, res, params.id);
  });
}
