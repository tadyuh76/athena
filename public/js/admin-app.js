// Import services
import { AdminProductService } from "/services/AdminProductService.js";
import { CollectionService } from "/services/CollectionService.js";
import { initDiscountsTab, loadDiscounts } from "/js/admin-discounts-tab.js";
import { initUsersTab, loadUsers } from "/js/admin-users-tab.js";

// Initialize services
const adminProductService = new AdminProductService();
const collectionService = new CollectionService();

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
  // 🔹 1.5. MOBILE MENU TOGGLE
  // ===============================
  setupMobileMenu();

  // ===============================
  // 🔹 2. KHỞI TẠO ADMIN DASHBOARD
  // ===============================
  try {
    // Load dữ liệu dashboard
    await loadDashboard();

    // Thiết lập navigation + hiển thị tên admin
    setupNavigation();

    // Cập nhật tên admin
    updateAdminName();

    // preload dữ liệu sản phẩm
    await loadAdminProducts();
  } catch (error) {
    console.error("Admin App Initialization Error:", error);
  }
});

// ===============================
// 🔹 3. CÁC HÀM HỖ TRỢ
// ===============================

// Helper function to format material composition
function formatMaterialComposition(composition) {
  if (
    !composition ||
    typeof composition !== "object" ||
    Object.keys(composition).length === 0
  ) {
    return "-";
  }

  // Convert material names to Vietnamese and format percentages
  const materialNames = {
    cotton: "Cotton",
    organic_cotton: "Cotton hữu cơ",
    polyester: "Polyester",
    elastane: "Elastane",
    spandex: "Spandex",
    nylon: "Nylon",
    wool: "Len",
    silk: "Lụa",
    linen: "Vải lanh",
    rayon: "Rayon",
    viscose: "Viscose",
    modal: "Modal",
    lyocell: "Lyocell",
    bamboo: "Tre",
  };

  return Object.entries(composition)
    .map(([material, percentage]) => {
      const displayName = materialNames[material.toLowerCase()] || material;
      return `${displayName} ${percentage}%`;
    })
    .join(", ");
}

async function loadDashboard() {
  try {
    const data = await adminProductService.getDashboardSummary();

    // 🧠 Gắn dữ liệu vào giao diện (không cần data.success)
    document.getElementById("totalRevenue").textContent =
      "$" +
      (data.totalRevenue || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    document.getElementById("totalOrders").textContent = data.totalOrders || 0;
    document.getElementById("totalCollections").textContent =
      data.totalCollections || 0;
    document.getElementById("totalProducts").textContent =
      data.totalProducts || 0;

    console.log("✅ Dashboard data loaded:", data);
  } catch (err) {
    console.error("Lỗi tải dashboard:", err);
  }
}

// ===============================
// 🔹 MOBILE MENU TOGGLE
// ===============================
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebar = document.getElementById("adminSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");

  if (!mobileMenuToggle || !sidebar || !backdrop) return;

  // Handle window resize - close sidebar when resizing to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) {
      sidebar.classList.remove("show");
      backdrop.classList.remove("show");
    }
  });

  // Toggle sidebar
  mobileMenuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("show");
    backdrop.classList.toggle("show");
  });

  // Close sidebar when clicking backdrop
  backdrop.addEventListener("click", () => {
    sidebar.classList.remove("show");
    backdrop.classList.remove("show");
  });
}

function setupNavigation() {
  const links = document.querySelectorAll(".sidebar-menu a");
  const sections = {
    "#dashboard": document.getElementById("dashboardSection"),
    "#collections": document.getElementById("collectionsSection"),
    "#products": document.getElementById("productsSection"),
    "#orders": document.getElementById("ordersSection"),
    "#discounts": document.getElementById("discountsSection"),
    "#users": document.getElementById("usersSection"),
  };

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("href");

      // Cập nhật active link
      links.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Hiển thị section tương ứng
      Object.keys(sections).forEach((key) => {
        sections[key].style.display = key === target ? "block" : "none";
      });

      // Close mobile sidebar after navigation
      const sidebar = document.getElementById("adminSidebar");
      const backdrop = document.getElementById("sidebarBackdrop");
      if (sidebar && backdrop) {
        sidebar.classList.remove("show");
        backdrop.classList.remove("show");
      }

      // 🔄 Nếu user click vào Dashboard → tải lại dữ liệu mới nhất (không block UI)
      if (target === "#dashboard") {
        loadDashboard(); // không dùng await → không chặn render
      }
      if (target === "#collections") loadCollections();
      if (target === "#products") loadAdminProducts();
      if (target === "#orders") {
        // Trigger orders loading - the admin-orders.js module handles this
        const ordersInitEvent = new CustomEvent("ordersTabOpened");
        window.dispatchEvent(ordersInitEvent);
      }
      if (target === "#discounts") {
        // Initialize and load discounts
        initDiscountsTab();
        loadDiscounts();
      }
      if (target === "#users") {
        // Initialize and load users
        initUsersTab();
        loadUsers();
      }
    });
  });
}

function updateAdminName() {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && (userData.first_name || userData.last_name)) {
      document.getElementById("adminName").textContent = `${
        userData.first_name || ""
      } ${userData.last_name || ""}`.trim();
    } else {
      document.getElementById("adminName").textContent = "Admin";
    }
  } catch (error) {
    console.error("Lỗi đọc thông tin user:", error);
    document.getElementById("adminName").textContent = "Admin";
  }
}

// document.addEventListener("DOMContentLoaded", loadDashboard);

// ===============================
// 🔹 4. COLLECTION MANAGEMENT
// ===============================
async function loadCollections() {
  const section = document.getElementById("collectionsSection");

  // Hiển thị loading
  section.innerHTML = `
    <div class="admin-header d-flex justify-content-between align-items-center">
      <h1>Quản Lý Collection</h1>
      <button id="addCollectionBtn" class="btn btn-dark">+ Thêm Collection</button>
    </div>
    <div class="text-center py-5">
      <div class="spinner-border text-secondary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-3 text-muted">Đang tải dữ liệu...</p>
    </div>
  `;

  try {
    const result = await collectionService.getAllCollections();

    if (!result.success) throw new Error(result.error || "Lỗi tải dữ liệu");

    const html = `
      <div class="admin-header d-flex justify-content-between align-items-center">
        <h1>Quản Lý Collection</h1>
        <button id="addCollectionBtn" class="btn btn-dark">
          <i class="bi bi-plus-circle me-1"></i> Thêm Collection
        </button>
      </div>

      <div class="table-responsive mt-4">
        <table class="table table-hover table-bordered align-middle">
          <thead class="table-light">
            <tr>
              <th style="width: 80px;">Hình ảnh</th>
              <th>Tên</th>
              <th>Theme</th>
              <th style="width: 100px;">Số SP</th>
              <th style="width: 80px;">Thứ tự</th>
              <th style="width: 80px;">Featured</th>
              <th style="width: 80px;">Hiển thị</th>
              <th style="width: 180px;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${
              result.data && result.data.length > 0
                ? result.data
                    .map(
                      (c) => `
                <tr>
                  <td>
                    <img src="${
                      c.hero_image_url ||
                      "https://via.placeholder.com/80x60/f8f9fa/6c757d?text=No+Image"
                    }"
                         alt="${c.name}"
                         style="width:80px;height:60px;object-fit:cover;border-radius:4px;">
                  </td>
                  <td>
                    <div class="fw-semibold">${c.name}</div>
                    ${
                      c.description
                        ? `<small class="text-muted">${c.description.substring(
                            0,
                            60
                          )}${c.description.length > 60 ? "..." : ""}</small>`
                        : ""
                    }
                  </td>
                  <td>${c.theme_name || "-"}</td>
                  <td class="text-center">
                    <span class="badge bg-secondary">${
                      c.product_count || 0
                    }</span>
                  </td>
                  <td class="text-center">${c.sort_order || 0}</td>
                  <td class="text-center">${
                    c.is_featured
                      ? '<i class="bi bi-star-fill text-warning"></i>'
                      : "-"
                  }</td>
                  <td class="text-center">${
                    c.is_active
                      ? '<i class="bi bi-check-circle-fill text-success"></i>'
                      : '<i class="bi bi-x-circle-fill text-danger"></i>'
                  }</td>
                  <td>
                    <div class="btn-group btn-group-sm" role="group">
                      <button class="btn btn-outline-primary btn-edit-collection" data-id="${
                        c.id
                      }" title="Sửa">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger btn-delete-collection" data-id="${
                        c.id
                      }" title="Xoá">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>`
                    )
                    .join("")
                : '<tr><td colspan="8" class="text-center text-muted py-4">Chưa có collection nào</td></tr>'
            }
          </tbody>
        </table>
      </div>
    `;

    section.innerHTML = html;
  } catch (err) {
    console.error("Error loading collections:", err);
    section.innerHTML = `
      <div class="admin-header">
        <h1>Quản Lý Collection</h1>
      </div>
      <div class="alert alert-danger mt-3" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Lỗi tải dữ liệu: ${err.message}
      </div>
    `;
  }
}

// ===============================
// 🔹 5. SỰ KIỆN TRONG COLLECTION MANAGEMENT
// ===============================
async function openCollectionForm(existing = null) {
  const section = document.getElementById("collectionsSection");

  // Tạo form HTML với tất cả các trường từ schema
  section.innerHTML = `
    <div class="admin-header d-flex justify-content-between align-items-center">
      <h1>${existing ? "Chỉnh sửa" : "Thêm"} Collection</h1>
      <button id="backToCollections" class="btn btn-secondary">
        <i class="bi bi-arrow-left me-1"></i> Quay lại
      </button>
    </div>

    <div class="card mt-4" style="max-width:800px;">
      <div class="card-body">
        <form id="collectionForm">
          <div class="row g-3">
            <!-- Tên Collection -->
            <div class="col-md-6">
              <label class="form-label fw-semibold">Tên Collection <span class="text-danger">*</span></label>
              <input type="text" id="collectionName" class="form-control" required
                value="${
                  existing?.name || ""
                }" placeholder="Ví dụ: Bộ sưu tập Xuân Hè 2024">
            </div>

            <!-- Theme Name -->
            <div class="col-md-6">
              <label class="form-label fw-semibold">Tên Theme</label>
              <input type="text" id="collectionTheme" class="form-control"
                value="${
                  existing?.theme_name || ""
                }" placeholder="Ví dụ: The White Space Edit">
            </div>

            <!-- Mô tả -->
            <div class="col-12">
              <label class="form-label fw-semibold">Mô tả</label>
              <textarea id="collectionDesc" class="form-control" rows="3"
                placeholder="Mô tả chi tiết về collection...">${
                  existing?.description || ""
                }</textarea>
            </div>

            <!-- Hero Image -->
            <div class="col-12">
              <label class="form-label fw-semibold">Hero Image</label>
              <div class="mb-2">
                <button type="button" class="btn btn-outline-secondary w-100" id="uploadImageBtn">
                  <i class="bi bi-upload"></i> Tải lên ảnh từ máy
                </button>
                <input type="file" id="imageFileInput" accept="image/jpeg,image/jpg,image/png,image/webp"
                  style="display:none;">
              </div>
              <input type="url" id="collectionHeroImage" class="form-control"
                value="${
                  existing?.hero_image_url || ""
                }" placeholder="URL ảnh sẽ hiển thị ở đây..." readonly>
              <small class="text-muted">Định dạng: JPEG, PNG, WebP. Tối đa 10MB</small>
              <div id="imagePreviewContainer" class="mt-2">
                ${
                  existing?.hero_image_url
                    ? `
                  <img src="${existing.hero_image_url}" alt="Preview" id="imagePreview"
                    style="max-width:300px;height:auto;border-radius:4px;border:1px solid #dee2e6;">
                `
                    : ""
                }
              </div>
              <div id="uploadProgress" class="mt-2" style="display:none;">
                <div class="progress">
                  <div class="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar" style="width: 100%"></div>
                </div>
                <small class="text-muted">Đang tải lên...</small>
              </div>
            </div>

            <!-- Sort Order -->
            <div class="col-md-4">
              <label class="form-label fw-semibold">Thứ tự hiển thị</label>
              <input type="number" id="collectionSortOrder" class="form-control"
                value="${existing?.sort_order ?? 0}" min="0">
              <small class="text-muted">Số nhỏ hơn sẽ hiển thị trước</small>
            </div>

            <!-- Start Date -->
            <div class="col-md-4">
              <label class="form-label fw-semibold">Ngày bắt đầu</label>
              <input type="datetime-local" id="collectionStartsAt" class="form-control"
                value="${
                  existing?.starts_at
                    ? new Date(existing.starts_at).toISOString().slice(0, 16)
                    : ""
                }">
            </div>

            <!-- End Date -->
            <div class="col-md-4">
              <label class="form-label fw-semibold">Ngày kết thúc</label>
              <input type="datetime-local" id="collectionEndsAt" class="form-control"
                value="${
                  existing?.ends_at
                    ? new Date(existing.ends_at).toISOString().slice(0, 16)
                    : ""
                }">
            </div>

            <!-- Checkboxes -->
            <div class="col-12">
              <div class="form-check form-switch mb-2">
                <input type="checkbox" id="collectionActive" class="form-check-input"
                  ${existing?.is_active !== false ? "checked" : ""}>
                <label class="form-check-label fw-semibold" for="collectionActive">
                  Hiển thị (is_active)
                </label>
              </div>
              <div class="form-check form-switch">
                <input type="checkbox" id="collectionFeatured" class="form-check-input"
                  ${existing?.is_featured ? "checked" : ""}>
                <label class="form-check-label fw-semibold" for="collectionFeatured">
                  Featured (nổi bật)
                </label>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="col-12 mt-4">
              <button type="submit" class="btn btn-dark">
                <i class="bi bi-check-circle me-1"></i>
                ${existing ? "Cập nhật Collection" : "Tạo Collection Mới"}
              </button>
              <button type="button" class="btn btn-secondary ms-2" id="cancelBtn">
                Hủy
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  // Back button
  document
    .getElementById("backToCollections")
    .addEventListener("click", loadCollections);
  document
    .getElementById("cancelBtn")
    .addEventListener("click", loadCollections);

  // Upload image button
  document.getElementById("uploadImageBtn").addEventListener("click", () => {
    document.getElementById("imageFileInput").click();
  });

  // Handle file selection
  document
    .getElementById("imageFileInput")
    .addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("❌ Chỉ chấp nhận file JPEG, PNG, WebP");
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("❌ File không được vượt quá 10MB");
        return;
      }

      // Show progress
      document.getElementById("uploadProgress").style.display = "block";

      try {
        // Upload image
        const result = await collectionService.uploadImage(file);

        // Update URL field and preview
        document.getElementById("collectionHeroImage").value = result.url;

        // Update or create preview
        let previewContainer = document.getElementById("imagePreviewContainer");
        previewContainer.innerHTML = `
        <img src="${result.url}" alt="Preview" id="imagePreview"
          style="max-width:300px;height:auto;border-radius:4px;border:1px solid #dee2e6;">
      `;

        alert("✅ Tải lên thành công!");
      } catch (err) {
        console.error("Error uploading image:", err);
        alert("❌ Lỗi tải lên: " + err.message);
      } finally {
        document.getElementById("uploadProgress").style.display = "none";
        // Reset file input
        e.target.value = "";
      }
    });

  // Submit form
  document
    .getElementById("collectionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        name: document.getElementById("collectionName").value.trim(),
        description:
          document.getElementById("collectionDesc").value.trim() || null,
        theme_name:
          document.getElementById("collectionTheme").value.trim() || null,
        hero_image_url:
          document.getElementById("collectionHeroImage").value.trim() || null,
        sort_order:
          parseInt(document.getElementById("collectionSortOrder").value) || 0,
        starts_at: document.getElementById("collectionStartsAt").value || null,
        ends_at: document.getElementById("collectionEndsAt").value || null,
        is_active: document.getElementById("collectionActive").checked,
        is_featured: document.getElementById("collectionFeatured").checked,
      };

      // Remove null values
      Object.keys(data).forEach((key) => {
        if (data[key] === null || data[key] === "") {
          delete data[key];
        }
      });

      try {
        const result = existing
          ? await collectionService.updateCollection(existing.id, data)
          : await collectionService.createCollection(data);

        if (!result.success) throw new Error(result.error || "Lỗi thao tác");

        alert(
          existing ? "✅ Đã cập nhật collection!" : "✅ Đã tạo collection mới!"
        );
        await loadCollections();
      } catch (err) {
        console.error("Form submission error:", err);
        alert("❌ " + err.message);
      }
    });
}

// ===============================
// 🔹 6. GẮN SỰ KIỆN CHO NÚT TRONG BẢNG
// ===============================
document.addEventListener("click", async (e) => {
  // 🟢 Thêm mới collection
  if (
    e.target &&
    (e.target.id === "addCollectionBtn" ||
      e.target.closest("#addCollectionBtn"))
  ) {
    openCollectionForm();
  }

  // 🟡 Sửa collection
  if (
    e.target &&
    (e.target.matches(".btn-edit-collection") ||
      e.target.closest(".btn-edit-collection"))
  ) {
    const btn = e.target.matches(".btn-edit-collection")
      ? e.target
      : e.target.closest(".btn-edit-collection");
    const id = btn.getAttribute("data-id");
    try {
      const result = await collectionService.getAllCollections();
      const col = result.data.find((c) => c.id === id);
      if (col) {
        openCollectionForm(col);
      } else {
        alert("Không tìm thấy collection");
      }
    } catch (err) {
      console.error("Error loading collection:", err);
      alert("Không tải được dữ liệu collection cần sửa");
    }
  }

  // 🔴 Xoá collection
  if (
    e.target &&
    (e.target.matches(".btn-delete-collection") ||
      e.target.closest(".btn-delete-collection"))
  ) {
    const btn = e.target.matches(".btn-delete-collection")
      ? e.target
      : e.target.closest(".btn-delete-collection");
    const id = btn.getAttribute("data-id");

    if (
      !confirm(
        "Bạn có chắc chắn muốn xoá collection này không?\n\nLưu ý: Các sản phẩm thuộc collection này sẽ không bị xoá."
      )
    )
      return;

    try {
      const result = await collectionService.deleteCollection(id);
      if (!result.success)
        throw new Error(result.error || "Lỗi xoá collection");
      alert("✅ Đã xoá collection!");
      await loadCollections();
    } catch (err) {
      console.error("Error deleting collection:", err);
      alert("❌ Lỗi xoá: " + err.message);
    }
  }
});

// ============================
// PRODUCTS MANAGEMENT
// ============================
async function loadAdminProducts() {
  const section = document.getElementById("productsSection");
  const tableBody = section.querySelector("#adminProductTable tbody");

  // Loading
  tableBody.innerHTML = `
    <tr><td colspan="6" class="text-center text-muted py-3">Đang tải sản phẩm...</td></tr>
  `;

  try {
    const result = await adminProductService.getAllProducts();

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error("Dữ liệu không hợp lệ");
    }

    const products = result.data;

    if (products.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center text-muted py-3">Chưa có sản phẩm nào</td></tr>
      `;
      return;
    }

    // Fetch variants for all products to show counts and images
    const productsWithVariants = await Promise.all(
      products.map(async (p) => {
        const variants = await getProductVariants(p.id);
        return { ...p, variants };
      })
    );

    tableBody.innerHTML = productsWithVariants
      .map((p) => {
        const variantCount = p.variants.length;
        const variantImages = p.variants
          .filter((v) => v.image_url)
          .slice(0, 3)
          .map(
            (v) =>
              `<img src="${v.image_url}" alt="${v.size || ""} ${
                v.color || ""
              }" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:4px;" title="${
                v.size || ""
              } ${v.color || ""}">`
          )
          .join("");

        return `
    <tr>
      <td data-label="Hình ảnh">
        <div class="d-flex gap-2 align-items-center">
          <img src="${p.featured_image_url || "/images/no-image.png"}"
              alt="${p.name}"
              style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #dee2e6;">
          ${
            variantImages
              ? `<div class="d-flex flex-wrap">${variantImages}</div>`
              : ""
          }
        </div>
      </td>
      <td data-label="Tên sản phẩm">
        <a href="#" class="product-detail-link" data-id="${p.id}">
          ${p.name || "-"}
        </a>
      </td>
      <td data-label="Collection">${p.collection_name || "-"}</td>
      <td data-label="Biến thể">
        <span class="badge bg-primary">${variantCount} biến thể</span>
      </td>
      <td data-label="Giá gốc">${
        p.compare_price ? "$" + p.compare_price.toLocaleString("en-US") : "-"
      }</td>
      <td data-label="Giá bán">${
        p.final_price ? "$" + p.final_price.toLocaleString("en-US") : "-"
      }</td>
    </tr>
  `;
      })
      .join("");

    // Gắn sự kiện click cho tất cả link chi tiết sản phẩm
    section.querySelectorAll(".product-detail-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const productId = link.dataset.id;
        if (productId) showProductDetail(productId);
      });
    });
  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
    tableBody.innerHTML = `
      <tr><td colspan="6" class="text-danger text-center py-3">
        ⚠️ Lỗi tải dữ liệu sản phẩm: ${err.message}
      </td></tr>
    `;
  }
}

// 🔹 Hàm lấy variants từ service
async function getProductVariants(productId) {
  try {
    const result = await adminProductService.getProductVariants(productId);
    return result.data || [];
  } catch (err) {
    console.error("Lỗi lấy variants:", err);
    return [];
  }
}

// ============================
// Show Product Detail
// ============================
async function showProductDetail(productId) {
  try {
    // 🔹 Fetch sản phẩm through service
    const productResult = await adminProductService.getProductById(productId);
    const p = productResult.data;

    // 🔹 Fetch variants through service
    const variantsResult = await adminProductService.getProductVariants(productId);
    const variants = variantsResult.data || [];

    const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
    const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

    // Get product images - prioritize featured_image_url since it's the uploaded image
    console.log("[showProductDetail] Product data:", p);

    let images = [];
    if (p.featured_image_url) {
      // Use featured_image_url as primary source (the uploaded image)
      images = [p.featured_image_url];
      console.log(
        "[showProductDetail] Using featured_image_url:",
        p.featured_image_url
      );
    } else if (p.images && Array.isArray(p.images)) {
      // Fall back to images array if no featured_image_url
      images = p.images
        .map((img) => (typeof img === "string" ? img : img.url))
        .filter(Boolean);
      console.log("[showProductDetail] Using images array:", images);
    } else {
      console.log("[showProductDetail] No images found");
    }

    // 🔹 Hiển thị modal
    const modalBody = document.querySelector("#productDetailModal .modal-body");
    modalBody.innerHTML = `
      <div class="row g-5">
        <div class="col-md-6">
          <div class="product-gallery d-flex flex-wrap gap-2">
            ${
              p.featured_image_url
                ? `<img src="${p.featured_image_url}" alt="${p.name}" style="width:100%;max-width:500px;height:auto;object-fit:cover;border-radius:8px;">`
                : images.length
                ? images
                    .map(
                      (url) =>
                        `<img src="${url}" alt="${p.name}" style="width:100%;max-width:500px;height:auto;object-fit:cover;border-radius:8px;">`
                    )
                    .join("")
                : `<div class="text-muted">Không có hình ảnh</div>`
            }
          </div>
        </div>
        <div class="col-md-6">
          <div class="product-info">
            <div class="product-header mb-3">
              <div class="collection-name text-muted mb-1">${
                p.collection?.name || "-"
              }</div>
              <h2 class="product-title">${p.name || "-"}</h2>
              <div class="product-price mb-2">
                ${
                  p.base_price
                    ? "$" + p.base_price.toLocaleString("en-US")
                    : "-"
                }
                ${
                  p.compare_price
                    ? `<del class="text-muted ms-2">$${p.compare_price.toLocaleString(
                        "en-US"
                      )}</del>`
                    : ""
                }
              </div>
            </div>

            <p class="product-description mb-3">${
              p.description || "Chưa có mô tả"
            }</p>

            <div class="product-section mb-2">
              <h5>Kích cỡ</h5>
              <p>${sizes.length ? sizes.join(", ") : "-"}</p>
            </div>

            <div class="product-section mb-2">
              <h5>Màu sắc</h5>
              <p>${colors.length ? colors.join(", ") : "-"}</p>
            </div>

            <div class="product-section mb-2">
              <h5>Trạng thái</h5>
              <p>${p.status || "Đang cập nhật"}</p>
            </div>

            <hr>
            <h5>Biến Thể</h5>
            <button class="btn btn-sm btn-primary" id="editVariantsBtn">Cập nhật</button>
            <table class="table table-sm table-bordered" id="variantsTable">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Kích cỡ</th>
                  <th>Màu</th>
                  <th>Mã màu</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>SKU</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                ${variants
                  .map(
                    (v) => `
                  <tr data-id="${v.id || ""}">
                    <td>
                      ${
                        v.image_url
                          ? `<img src="${v.image_url}" alt="${v.size || ""} ${
                              v.color || ""
                            }" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">`
                          : '<span class="text-muted small">Không có ảnh</span>'
                      }
                    </td>
                    <td>${v.size || ""}</td>
                    <td>${v.color || ""}</td>
                    <td>${v.color_hex || ""}</td>
                    <td>${
                      v.price ? "$" + v.price.toLocaleString("en-US") : ""
                    }</td>
                    <td>${v.inventory_quantity || ""}</td>
                    <td>${v.sku || ""}</td>
                    <td><button class="btn btn-sm btn-danger delete-variant-btn">Xoá</button></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <hr>
            <h5>Chi tiết bổ sung</h5>
            <p><strong>Mã sản phẩm (SKU):</strong> ${p.sku || "-"}</p>
            <p><strong>Đường dẫn (Slug):</strong> ${p.slug || "-"}</p>
            <p><strong>Danh mục:</strong> ${p.category?.name || "-"}</p>
            <p><strong>Thành phần vật liệu:</strong> ${formatMaterialComposition(
              p.material_composition
            )}</p>
            <p><strong>Hướng dẫn bảo quản:</strong> ${
              p.care_instructions || "-"
            }</p>
            <p><strong>Ghi chú bền vững:</strong> ${
              p.sustainability_notes || "-"
            }</p>
            <p><strong>Phương pháp sản xuất:</strong> ${
              p.production_method || "-"
            }</p>
            <p><strong>Chứng nhận:</strong> ${
              (p.certification_labels || []).join(", ") || "-"
            }</p>

            <hr>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button class="btn btn-primary" id="editProductBtn">Sửa</button>
              <button class="btn btn-danger" id="deleteProductBtn">Xoá</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 🔹 Nút Sửa/Sửa variants/Xoá
    document
      .getElementById("editProductBtn")
      .addEventListener("click", () => openProductForm(productId));
    document
      .getElementById("deleteProductBtn")
      .addEventListener("click", async () => {
        if (!confirm("Bạn có chắc chắn muốn xoá sản phẩm này không?")) return;

        try {
          const result = await adminProductService.deleteProduct(productId);

          if (!result.success) {
            throw new Error(result.error || 'Không thể xoá sản phẩm');
          }

          alert("✅ Đã xoá sản phẩm!");
          bootstrap.Modal.getInstance(
            document.getElementById("productDetailModal")
          ).hide();
          await loadAdminProducts();
        } catch (error) {
          console.error('Error deleting product:', error);
          alert("❌ " + error.message);
        }
      });

    document.getElementById("editVariantsBtn").addEventListener("click", () => {
      openVariantsModal(productId, variants);
    });

    new bootstrap.Modal(document.getElementById("productDetailModal")).show();
  } catch (err) {
    alert("⚠️ Lỗi: " + err.message);
    console.error(err);
  }
}

// ============================
// 🔹 OPEN PRODUCT FORM
// ============================
async function openProductForm(productId = null) {
  let productData = null;

  if (productId) {
    try {
      const result = await adminProductService.getProductById(productId);
      if (result.success) productData = result.data;
    } catch {
      alert("Không thể tải dữ liệu sản phẩm để sửa");
      return;
    }
  }

  const modalEl = document.getElementById("productFormModal");
  const modalBody = modalEl.querySelector("#productFormBody");

  modalBody.innerHTML = `
    <form id="productForm" ${productId ? `data-product-id="${productId}"` : ""}>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Tên sản phẩm</label>
          <input type="text" id="productName" class="form-control" value="${
            productData?.name || ""
          }" required>
          <small class="text-muted d-block mb-2">Nhập tên sản phẩm (bắt buộc).</small>

          <label class="form-label mt-2">Đường dẫn (Slug) - Tự động</label>
          <input type="text" id="productSlug" class="form-control" value="${
            productData?.slug || ""
          }" readonly>
          <small class="text-muted d-block mb-2">Slug tự tạo theo tên sản phẩm, không sửa trực tiếp.</small>

          <label class="form-label mt-2">Collection</label>
          <select id="productCollection" class="form-select">
            <option value="">-- Chọn Collection --</option>
          </select>
          <small class="text-muted d-block mb-2">Chọn collection sản phẩm. Có thể để trống.</small>

          <label class="form-label mt-2">Giá cơ bản (USD)</label>
          <input type="number" id="productBasePrice" class="form-control" value="${
            productData?.base_price || 0
          }" required>
          <small class="text-muted d-block mb-2">Nhập giá cơ bản (bắt buộc).</small>

          <label class="form-label mt-2">Giá so sánh (USD)</label>
          <input type="number" id="productComparePrice" class="form-control" value="${
            productData?.compare_price || ""
          }">
          <small class="text-muted d-block mb-2">Giá so sánh, có thể để trống.</small>

          <label class="form-label mt-2">Mã sản phẩm (SKU)</label>
          <input type="text" id="productSKU" class="form-control" value="${
            productData?.sku || ""
          }">
          <small class="text-muted d-block mb-2">Mã sản phẩm, có thể để trống.</small>

          <label class="form-label mt-2">Danh mục</label>
          <input type="text" id="productCategory" class="form-control" value="${
            productData?.category?.name || ""
          }">
          <small class="text-muted d-block mb-2">Tên danh mục, có thể để trống.</small>

          <label class="form-label mt-2">Mô tả</label>
          <textarea id="productDescription" class="form-control" rows="2">${
            productData?.description || ""
          }</textarea>
          <small class="text-muted d-block mb-2">Mô tả chi tiết, có thể để trống.</small>

          <label class="form-label mt-2">Mô tả ngắn</label>
          <textarea id="productShortDescription" class="form-control" rows="2">${
            productData?.short_description || ""
          }</textarea>
          <small class="text-muted d-block mb-2">Mô tả ngắn, có thể để trống.</small>
        </div>

        <div class="col-md-6">
          <label class="form-label fw-bold">Ảnh sản phẩm</label>
          <div class="border rounded p-3 bg-light mb-2">
            <button type="button" id="uploadNewImageBtn" class="btn btn-outline-primary btn-sm mb-2 w-100">
              <i class="bi bi-upload"></i> Tải ảnh lên
            </button>
            <input type="file" id="productImageFile" class="d-none" accept="image/jpeg,image/jpg,image/png,image/webp">
            <input type="text" id="productImageUrl" class="form-control mb-2" placeholder="URL ảnh sẽ hiển thị ở đây" value="${
              productData?.featured_image_url || ""
            }" readonly>
            <div id="selectedImagePreview" class="mb-2">
              ${
                productData?.featured_image_url
                  ? `<img src="${productData.featured_image_url}" style="width:100px;height:100px;object-fit:cover;border-radius:6px;">`
                  : ""
              }
            </div>
          </div>
          <small class="text-muted d-block mb-2">
            Tải ảnh lên từ máy tính (JPEG, PNG, WebP, tối đa 5MB)
          </small>

          <label class="form-label mt-2">Thành phần vật liệu (JSON)</label>
          <textarea id="productMaterial" class="form-control" rows="3">${JSON.stringify(
            productData?.material_composition || {}
          )}</textarea>
          <small class="text-muted d-block mb-2">Ví dụ: {"cotton":50,"polyester":50}. Có thể để trống.</small>

          <label class="form-label mt-2">Hướng dẫn bảo quản</label>
          <textarea id="productCare" class="form-control" rows="2">${
            productData?.care_instructions || ""
          }</textarea>
          <small class="text-muted d-block mb-2">Ví dụ: Giặt tay, phơi nơi thoáng. Có thể để trống.</small>

          <label class="form-label mt-2">Ghi chú về tính bền vững</label>
          <textarea id="productSustainability" class="form-control" rows="2">${
            productData?.sustainability_notes || ""
          }</textarea>
          <small class="text-muted d-block mb-2">Ví dụ: Vật liệu thân thiện môi trường. Có thể để trống.</small>

          <label class="form-label mt-2">Phương pháp sản xuất</label>
          <textarea id="productProduction" class="form-control" rows="2">${
            productData?.production_method || ""
          }</textarea>
          <small class="text-muted d-block mb-2">Ví dụ: Thủ công. Có thể để trống.</small>

          <label class="form-label mt-2">Chứng nhận (phân tách bằng ,)</label>
          <input type="text" id="productCertifications" class="form-control" value="${(
            productData?.certification_labels || []
          ).join(", ")}">
          <small class="text-muted d-block mb-2">Ví dụ: OEKO-TEX, GOTS. Có thể để trống.</small>
        </div>
      </div>

      <div class="mt-3 text-end">
        <button type="submit" class="btn btn-dark">${
          productId ? "Cập nhật" : "Thêm mới"
        }</button>
      </div>
    </form>
  `;

  // Load collection list vào select
  const collectionData = await adminProductService.getAllCollections();
  if (collectionData.success && Array.isArray(collectionData.data)) {
    const select = modalBody.querySelector("#productCollection");
    select.innerHTML = `<option value="">-- Chọn Collection --</option>`; // reset
    collectionData.data.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      if (productData?.collection?.id === c.id) opt.selected = true;
      select.appendChild(opt);
    });
  }

  // Tạo slug tự động
  const nameInput = modalBody.querySelector("#productName");
  const slugInput = modalBody.querySelector("#productSlug");
  nameInput.addEventListener("input", () => {
    const slug = nameInput.value
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    slugInput.value = slug;
  });

  // Submit form
  const formEl = modalBody.querySelector("#productForm");
  formEl.onsubmit = async (e) => {
    e.preventDefault();

    const productId = formEl.dataset.productId || null;

    const imageUrl = document.getElementById("productImageUrl").value || null;
    console.log("[SAVE] Product image URL being saved:", imageUrl);

    const formData = {
      name: nameInput.value.trim(),
      sku: modalBody.querySelector("#productSKU").value.trim() || "",
      slug: slugInput.value,
      collection_id:
        modalBody.querySelector("#productCollection").value || null,
      base_price: Number(modalBody.querySelector("#productBasePrice").value),
      compare_price: modalBody.querySelector("#productComparePrice").value
        ? Number(modalBody.querySelector("#productComparePrice").value)
        : null,
      description: modalBody.querySelector("#productDescription").value || null,
      short_description:
        modalBody.querySelector("#productShortDescription").value || null,
      material_composition: (() => {
        try {
          return JSON.parse(modalBody.querySelector("#productMaterial").value);
        } catch {
          return null;
        }
      })(),
      care_instructions: modalBody.querySelector("#productCare").value || null,
      sustainability_notes:
        modalBody.querySelector("#productSustainability").value || null,
      production_method:
        modalBody.querySelector("#productProduction").value || null,
      certification_labels: modalBody.querySelector("#productCertifications")
        .value
        ? modalBody
            .querySelector("#productCertifications")
            .value.split(",")
            .map((s) => s.trim())
        : null,
      featured_image_url: imageUrl,
      status: "active",
      is_featured: false,
      low_stock_threshold: null,
    };

    console.log("[SAVE] Complete form data being sent:", formData);

    try {
      const result = !productId
        ? await adminProductService.createProduct(formData)
        : await adminProductService.updateProduct(productId, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      alert(`✅ Sản phẩm ${productId ? "cập nhật" : "thêm mới"} thành công!`);
      bootstrap.Modal.getInstance(modalEl).hide();
      loadAdminProducts();
    } catch (err) {
      console.error(err);
      console.error("❌ Lưu sản phẩm lỗi:", err);
      alert("❌ Lỗi khi lưu sản phẩm: " + (err.message || "Không xác định"));
    }
  };

  new bootstrap.Modal(modalEl).show();

  // ===== UPLOAD IMAGE HANDLER =====
  const uploadNewBtn = modalBody.querySelector("#uploadNewImageBtn");
  const imageFileInput = modalBody.querySelector("#productImageFile");
  const imageUrlInput = modalBody.querySelector("#productImageUrl");
  const imagePreview = modalBody.querySelector("#selectedImagePreview");

  // Upload image handler
  uploadNewBtn.addEventListener("click", () => {
    imageFileInput.click();
  });

  imageFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("❌ Chỉ chấp nhận file JPEG, PNG, hoặc WebP");
      imageFileInput.value = "";
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("❌ Kích thước file tối đa 5MB");
      imageFileInput.value = "";
      return;
    }

    try {
      // Show uploading indicator
      uploadNewBtn.disabled = true;
      uploadNewBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1"></span> Đang tải lên...';

      // Upload to server using service
      const result = await adminProductService.uploadProductImage(file);

      if (!result.success) {
        throw new Error(result.error || "Tải ảnh lên thất bại");
      }

      // Update UI with uploaded image URL
      imageUrlInput.value = result.url;
      imagePreview.innerHTML = `<img src="${result.url}" style="width:120px;height:120px;object-fit:cover;border-radius:6px;">`;

      alert("✅ Tải ảnh lên thành công!");
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("❌ Lỗi tải ảnh lên: " + err.message);
    } finally {
      // Reset button
      uploadNewBtn.disabled = false;
      uploadNewBtn.innerHTML = '<i class="bi bi-upload"></i> Tải ảnh lên';
      imageFileInput.value = "";
    }
  });
}

// ============================
// 🔹 EVENT LISTENER FORM SUBMIT
// ============================
document.addEventListener("submit", (e) => {
  if (e.target && e.target.id === "productForm") {
    submitProductForm(e);
  }
});

const addProductBtn = document.getElementById("addProductBtn");
if (addProductBtn) {
  addProductBtn.addEventListener("click", () => openProductForm());
}

// ============================
// MODAL QUẢN LÝ VARIANTS
// ============================
function openVariantsModal(productId, variants) {
  const modalHtml = `
    <div class="modal fade" id="variantsModal" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Quản lý Biến Thể</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex justify-content-end mb-2">
              <button class="btn btn-sm btn-success" id="addVariantBtn">Thêm Biến Thể</button>
            </div>
            <div class="table-responsive">
              <table class="table table-sm table-bordered" id="variantsEditTable">
                <thead>
                  <tr>
                    <th>Hình ảnh</th>
                    <th>Kích cỡ</th>
                    <th>Màu sắc</th>
                    <th>Mã màu</th>
                    <th>Giá (USD)</th>
                    <th>Tồn kho</th>
                    <th>SKU</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  ${variants
                    .map(
                      (v, idx) => `
                    <tr data-id="${v.id || ""}">
                      <td style="min-width:140px;">
                        ${
                          v.image_url
                            ? `<img src="${v.image_url}" alt="${v.size || ""} ${
                                v.color || ""
                              }" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-bottom:4px;" class="d-block">`
                            : ""
                        }
                        <input type="text" class="form-control form-control-sm image-url mb-1" value="${
                          v.image_url || ""
                        }" placeholder="URL hình ảnh">
                        <input type="file" class="d-none variant-image-file" accept="image/jpeg,image/jpg,image/png,image/webp" data-row="${idx}">
                        <button type="button" class="btn btn-sm btn-outline-primary w-100 upload-variant-image" data-row="${idx}">
                          <i class="bi bi-upload"></i> Tải ảnh
                        </button>
                      </td>
                      <td><input type="text" class="form-control form-control-sm size" value="${
                        v.size || ""
                      }"></td>
                      <td><input type="text" class="form-control form-control-sm color" value="${
                        v.color || ""
                      }"></td>
                      <td><input type="text" class="form-control form-control-sm color-hex" value="${
                        v.color_hex || ""
                      }"></td>
                      <td><input type="number" class="form-control form-control-sm price" value="${
                        v.price || ""
                      }"></td>
                      <td><input type="number" class="form-control form-control-sm inventory" value="${
                        v.inventory_quantity || ""
                      }"></td>
                      <td><input type="text" class="form-control form-control-sm sku" value="${
                        v.sku || ""
                      }"></td>
                      <td><button class="btn btn-sm btn-danger delete-variant-btn">Xoá</button></td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Huỷ</button>
            <button class="btn btn-primary" id="saveVariantsBtn">Lưu</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  const modalEl = document.getElementById("variantsModal");
  const modalInstance = new bootstrap.Modal(modalEl);
  modalInstance.show();

  // 🔹 Thêm row mới
  modalEl.querySelector("#addVariantBtn").addEventListener("click", () => {
    const tbody = modalEl.querySelector("#variantsEditTable tbody");
    const rowIndex = tbody.querySelectorAll("tr").length;
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td style="min-width:140px;">
        <input type="text" class="form-control form-control-sm image-url mb-1" placeholder="URL hình ảnh">
        <input type="file" class="d-none variant-image-file" accept="image/jpeg,image/jpg,image/png,image/webp" data-row="${rowIndex}">
        <button type="button" class="btn btn-sm btn-outline-primary w-100 upload-variant-image" data-row="${rowIndex}">
          <i class="bi bi-upload"></i> Tải ảnh
        </button>
      </td>
      <td><input type="text" class="form-control form-control-sm size"></td>
      <td><input type="text" class="form-control form-control-sm color"></td>
      <td><input type="text" class="form-control form-control-sm color-hex"></td>
      <td><input type="number" class="form-control form-control-sm price"></td>
      <td><input type="number" class="form-control form-control-sm inventory"></td>
      <td><input type="text" class="form-control form-control-sm sku"></td>
      <td><button class="btn btn-sm btn-danger delete-variant-btn">Xoá</button></td>
    `;
    tbody.appendChild(newRow);
  });

  // 🔹 Xoá row
  modalEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-variant-btn")) {
      e.target.closest("tr").remove();
    }
  });

  // 🔹 Upload variant image handler
  modalEl.addEventListener("click", async (e) => {
    if (
      e.target.classList.contains("upload-variant-image") ||
      e.target.closest(".upload-variant-image")
    ) {
      const btn = e.target.classList.contains("upload-variant-image")
        ? e.target
        : e.target.closest(".upload-variant-image");
      const row = btn.closest("tr");
      const fileInput = row.querySelector(".variant-image-file");

      fileInput.click();

      fileInput.onchange = async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
          alert("❌ Chỉ chấp nhận file JPEG, PNG, hoặc WebP");
          fileInput.value = "";
          return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert("❌ Kích thước file tối đa 5MB");
          fileInput.value = "";
          return;
        }

        try {
          // Show uploading indicator
          btn.disabled = true;
          btn.innerHTML =
            '<span class="spinner-border spinner-border-sm"></span>';

          // Upload to server using service
          const result = await adminProductService.uploadVariantImage(file);

          if (!result.success) {
            throw new Error(result.error || "Tải ảnh lên thất bại");
          }

          // Update UI with uploaded image URL
          const imageUrlInput = row.querySelector(".image-url");
          imageUrlInput.value = result.url;

          // Update preview image
          const existingImg = row.querySelector("img");
          if (existingImg) {
            existingImg.src = result.url;
          } else {
            const td = row.querySelector("td");
            const img = document.createElement("img");
            img.src = result.url;
            img.style.cssText =
              "width:50px;height:50px;object-fit:cover;border-radius:4px;margin-bottom:4px;display:block;";
            td.insertBefore(img, imageUrlInput);
          }

          alert("✅ Tải ảnh lên thành công!");
        } catch (err) {
          console.error("Error uploading variant image:", err);
          alert("❌ Lỗi tải ảnh lên: " + err.message);
        } finally {
          // Reset button
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-upload"></i> Tải ảnh';
          fileInput.value = "";
        }
      };
    }
  });

  // 🔹 Lưu variants lên backend through service
  modalEl
    .querySelector("#saveVariantsBtn")
    .addEventListener("click", async () => {
      const rows = Array.from(
        modalEl.querySelectorAll("#variantsEditTable tbody tr")
      );
      const allVariants = [];

      rows.forEach((row) => {
        const variant = {
          size: row.querySelector(".size").value.trim(),
          color: row.querySelector(".color").value.trim(),
          color_hex: row.querySelector(".color-hex").value.trim(),
          price: Number(row.querySelector(".price").value) || 0,
          inventory_quantity:
            Number(row.querySelector(".inventory").value) || 0,
          sku: row.querySelector(".sku").value.trim(),
          image_url: row.querySelector(".image-url").value.trim() || null,
          product_id: productId,
        };

        // If row has an ID, include it for update; otherwise it's a new variant
        if (row.dataset.id) {
          variant.id = row.dataset.id;
        }

        allVariants.push(variant);
      });

      try {
        console.log('Saving variants for productId:', productId);
        console.log('Variants to save:', allVariants);

        // Use upsert service method - handles both insert and update
        const result = await adminProductService.upsertVariants(productId, allVariants);

        console.log('Upsert result:', result);

        if (!result.success) {
          throw new Error(result.error || 'Không thể lưu biến thể');
        }

        alert("✅ Lưu biến thể thành công!");

        // Hide modal and wait for it to be fully hidden before proceeding
        modalInstance.hide();

        // Wait for modal to be fully hidden, then clean up and reload
        modalEl.addEventListener('hidden.bs.modal', async () => {
          modalEl.remove();

          // Remove any lingering backdrops
          document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
          document.body.classList.remove('modal-open');
          document.body.style.removeProperty('overflow');
          document.body.style.removeProperty('padding-right');

          // Reload chi tiết sản phẩm và product list
          await showProductDetail(productId);
          await loadAdminProducts();
        }, { once: true });
      } catch (err) {
        console.error('Error saving variants:', err);
        alert("❌ " + err.message);
      }
    });

  // Remove modal khỏi DOM khi đóng (without saving)
  modalEl.addEventListener("hidden.bs.modal", () => {
    modalEl.remove();

    // Clean up any lingering backdrops
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  });
}
