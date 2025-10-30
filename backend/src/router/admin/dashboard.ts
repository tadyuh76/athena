import { supabase } from "../../utils/supabase";
import { sendJSON } from "../../utils/request-handler";

// ✅ Lấy dữ liệu tổng hợp cho Dashboard
export async function getAdminDashboard() {
  try {
    // Lấy tổng doanh thu
    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .select("total, status");

    if (orderErr) throw orderErr;

    const totalOrders = orderData.length;
    const totalRevenue = orderData
      .filter((o) => o.status === "completed" || o.status === "paid")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    // Đếm số collection
    const { count: totalCollections, error: colErr } = await supabase
      .from("collections")
      .select("*", { count: "exact", head: true });
    if (colErr) throw colErr;

    // Đếm số sản phẩm
    const { count: totalProducts, error: prodErr } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    if (prodErr) throw prodErr;

    // ✅ Trả kết quả JSON
    return {
      status: 200,
      body: {
        success: true,
        data: {
          totalRevenue,
          totalOrders,
          totalCollections,
          totalProducts,
        },
      },
    };
  } catch (err: any) {
    console.error("Dashboard Error:", err.message);
    return {
      status: 500,
      body: { success: false, message: err.message },
    };
  }
}
