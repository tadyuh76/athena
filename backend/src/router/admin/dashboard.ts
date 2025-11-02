import { supabase } from "../../utils/supabase";

export async function getAdminDashboard() {
  try {
    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .select("total_price, status");

    if (orderError) throw orderError;

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders
      ?.filter((o) => o.status === "completed" || o.status === "paid")
      .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0) || 0;

    const { count: totalProducts, error: productError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    if (productError) throw productError;

    const { count: totalCollections, error: collectionError } = await supabase
      .from("collections")
      .select("*", { count: "exact", head: true });
    if (collectionError) throw collectionError;

    return {
      status: 200,
      body: {
        success: true,
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCollections,
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
