document.addEventListener("DOMContentLoaded", async () => {
  // ===============================
  // 🔹 1. GẮN SỰ KIỆN LOGOUT NHANH
  // ===============================
  const logoutBtn = document.getElementById("adminLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      try {
        // Xóa token + thông tin người dùng trong localStorage / sessionStorage
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_role");
        sessionStorage.clear();

        // Quay lại trang login
        window.location.href = "/login.html";
      } catch (err) {
        console.error("Logout Error:", err);
      }
    });
  }

  // ===============================
  // 🔹 2. KHỞI TẠO ADMIN DASHBOARD
  // ===============================
  try {
    // Load dữ liệu dashboard
    await loadDashboard();

    // Thiết lập navigation + hiển thị tên admin
    setupNavigation();
    updateAdminName();

  } catch (error) {
    console.error("Admin App Initialization Error:", error);
  }
});


// ===============================
// 🔹 3. CÁC HÀM HỖ TRỢ
// ===============================
async function loadDashboard() {
  try {
    const response = await fetch("/api/admin/dashboard");
    const data = await response.json();

    // 🧠 Gắn dữ liệu vào giao diện (không cần data.success)
    document.getElementById("totalRevenue").textContent =
      (data.totalRevenue || 0).toLocaleString("vi-VN") + " ₫";
    document.getElementById("totalOrders").textContent = data.totalOrders || 0;
    document.getElementById("totalCollections").textContent = data.totalCollections || 0;
    document.getElementById("totalProducts").textContent = data.totalProducts || 0;

    console.log("✅ Dashboard data loaded:", data);
  } catch (err) {
    console.error("Lỗi tải dashboard:", err);
  }
}


function setupNavigation() {
  const links = document.querySelectorAll(".sidebar-menu a");
  const sections = {
    "#dashboard": document.getElementById("dashboardSection"),
    "#collections": document.getElementById("collectionsSection"),
    "#products": document.getElementById("productsSection"),
    "#orders": document.getElementById("ordersSection"),
  };

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("href");

      // Cập nhật active link
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      // Hiển thị section tương ứng
      Object.keys(sections).forEach(key => {
        sections[key].style.display = (key === target) ? "block" : "none";
      });
    });
  });
}


function updateAdminName() {
  const adminName = localStorage.getItem("user_name") || "Admin";
  document.getElementById("adminName").textContent = adminName;
}

document.addEventListener("DOMContentLoaded", loadDashboard);
