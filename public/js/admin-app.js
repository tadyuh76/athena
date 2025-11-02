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

// ===============================
// 🔹 4. COLLECTION MANAGEMENT
// ===============================
async function loadCollections() {
  const section = document.getElementById("collectionsSection");

  // Hiển thị loading
  section.innerHTML = `
    <div class="admin-header d-flex justify-content-between align-items-center">
      <h1>Collection Management</h1>
      <button id="addCollectionBtn" class="btn btn-dark">+ Thêm Collection</button>
    </div>
    <p>Đang tải dữ liệu...</p>
  `;

  try {
    const res = await fetch("/api/admin/collections");
    const result = await res.json();

    if (!result.success) throw new Error(result.error || "Lỗi tải dữ liệu");

    const html = `
      <div class="admin-header d-flex justify-content-between align-items-center">
        <h1>Collection Management</h1>
        <button id="addCollectionBtn" class="btn btn-dark">+ Thêm Collection</button>
      </div>

      <table class="table table-striped mt-4">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Mô tả</th>
            <th>Hiển thị</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          ${result.data
            .map(
              (c) => `
            <tr>
              <td>${c.name}</td>
              <td>${c.description || ""}</td>
              <td>${c.is_active ? "✅" : "❌"}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" data-id="${c.id}">Sửa</button>
                <button class="btn btn-sm btn-outline-danger" data-id="${c.id}">Xoá</button>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    section.innerHTML = html;
  } catch (err) {
    section.innerHTML = `<p class="text-danger">Lỗi tải dữ liệu: ${err.message}</p>`;
  }
}

// Gắn lại sự kiện click trong sidebar để load Collections
document.querySelectorAll(".sidebar-menu a").forEach((link) => {
  link.addEventListener("click", async (e) => {
    const href = link.getAttribute("href");
    if (href === "#collections") {
      await loadCollections();
    }
  });
});

// ===============================
// 🔹 5. SỰ KIỆN TRONG COLLECTION MANAGEMENT
// ===============================
async function openCollectionForm(existing = null) {
  const section = document.getElementById("collectionsSection");

  // Tạo form HTML
  section.innerHTML = `
    <div class="admin-header d-flex justify-content-between align-items-center">
      <h1>${existing ? "Chỉnh sửa" : "Thêm"} Collection</h1>
      <button id="backToCollections" class="btn btn-secondary">← Quay lại</button>
    </div>

    <form id="collectionForm" class="mt-4" style="max-width:600px;">
      <div class="mb-3">
        <label class="form-label">Tên Collection</label>
        <input type="text" id="collectionName" class="form-control" required 
          value="${existing ? existing.name : ""}">
      </div>
      <div class="mb-3">
        <label class="form-label">Mô tả</label>
        <textarea id="collectionDesc" class="form-control">${existing ? existing.description || "" : ""}</textarea>
      </div>
      <div class="form-check mb-3">
        <input type="checkbox" id="collectionActive" class="form-check-input" 
          ${existing && existing.is_active ? "checked" : ""}>
        <label class="form-check-label" for="collectionActive">Hiển thị</label>
      </div>
      <button type="submit" class="btn btn-dark">${existing ? "Cập nhật" : "Tạo mới"}</button>
    </form>
  `;

  // Quay lại danh sách
  document.getElementById("backToCollections").addEventListener("click", loadCollections);

  // Submit form
  document.getElementById("collectionForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById("collectionName").value.trim(),
      description: document.getElementById("collectionDesc").value.trim(),
      is_active: document.getElementById("collectionActive").checked,
    };

    try {
      const res = await fetch(
        existing
          ? `/api/admin/collections/${existing.id}`
          : `/api/admin/collections`,
        {
          method: existing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Lỗi thao tác");

      alert(existing ? "Đã cập nhật collection!" : "Đã tạo collection mới!");
      await loadCollections();
    } catch (err) {
      alert("❌ " + err.message);
    }
  });
}

// ===============================
// 🔹 6. GẮN SỰ KIỆN CHO NÚT TRONG BẢNG
// ===============================
document.addEventListener("click", async (e) => {
  // 🟢 Thêm mới
  if (e.target && e.target.id === "addCollectionBtn") {
    openCollectionForm();
  }

  // 🟡 Sửa
  if (e.target && e.target.matches(".btn-outline-primary[data-id]")) {
    const id = e.target.getAttribute("data-id");
    try {
      const res = await fetch(`/api/admin/collections`);
      const result = await res.json();
      const col = result.data.find((c) => c.id === id);
      if (col) openCollectionForm(col);
    } catch (err) {
      alert("Không tải được dữ liệu collection cần sửa");
    }
  }

  // 🔴 Xoá
  if (e.target && e.target.matches(".btn-outline-danger[data-id]")) {
    const id = e.target.getAttribute("data-id");
    if (!confirm("Bạn có chắc chắn muốn xoá collection này không?")) return;

    try {
      const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      alert("✅ Đã xoá collection!");
      await loadCollections();
    } catch (err) {
      alert("❌ Lỗi xoá: " + err.message);
    }
  }
});
