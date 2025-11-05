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

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function loadDashboard() {
  try {
    const response = await fetch("/api/admin/dashboard", {
      headers: getAuthHeaders()
    });
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

      // 🔄 Nếu user click vào Dashboard → tải lại dữ liệu mới nhất (không block UI)
      if (target === "#dashboard") {
        loadDashboard(); // không dùng await → không chặn render
      }
      if (target === "#collections") loadCollections();
      if (target === "#products") loadAdminProducts();
      if (target === "#orders") {
        // Trigger orders loading - the admin-orders.js module handles this
        const ordersInitEvent = new CustomEvent('ordersTabOpened');
        window.dispatchEvent(ordersInitEvent);
      }

    });
  });
}



function updateAdminName() {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && (userData.first_name || userData.last_name)) {
      document.getElementById("adminName").textContent =
        `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
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
    <p>Đang tải dữ liệu...</p>
  `;

  try {
    const res = await fetch("/api/admin/collections", {
      headers: getAuthHeaders()
    });
    const result = await res.json();

    if (!result.success) throw new Error(result.error || "Lỗi tải dữ liệu");

    const html = `
      <div class="admin-header d-flex justify-content-between align-items-center">
        <h1>Quản Lý Collection</h1>
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
          headers: getAuthHeaders(),
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
      const res = await fetch(`/api/admin/collections`, {
        headers: getAuthHeaders()
      });
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
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      alert("✅ Đã xoá collection!");
      await loadCollections();
    } catch (err) {
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
    <tr><td colspan="5" class="text-center text-muted py-3">Đang tải sản phẩm...</td></tr>
  `;

  try {
    const res = await fetch("/api/admin/products", {
      headers: getAuthHeaders()
    });
    const result = await res.json();

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error("Dữ liệu không hợp lệ");
    }

    const products = result.data;

    if (products.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="5" class="text-center text-muted py-3">Chưa có sản phẩm nào</td></tr>
      `;
      return;
    }

    tableBody.innerHTML = products.map(p => `
    <tr>
      <td>
        <a href="#" class="product-detail-link" data-id="${p.id}">
          ${p.name || "-"}
        </a>
      </td>
      <td>${p.collection_name || "-"}</td>
      <td>${p.compare_price ? "$" + p.compare_price.toLocaleString("en-US") : "-"}</td>
      <td>${p.final_price ? "$" + p.final_price.toLocaleString("en-US") : "-"}</td>
      <td>
        <img src="${p.featured_image_url || '/images/no-image.png'}"
            alt="${p.name}"
            style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
      </td>
    </tr>
  `).join("");

  // Gắn sự kiện click cho tất cả link chi tiết sản phẩm
  section.querySelectorAll(".product-detail-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = link.dataset.id;
      if (productId) showProductDetail(productId);
    });
  });

  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
    tableBody.innerHTML = `
      <tr><td colspan="5" class="text-danger text-center py-3">
        ⚠️ Lỗi tải dữ liệu sản phẩm: ${err.message}
      </td></tr>
    `;
  }
}

// 🔹 Hàm lấy variants từ bảng product_variants
async function getProductVariants(productId) {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('id, size, color, color_hex, price, inventory_quantity')
      .eq('product_id', productId);

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error('Lỗi lấy variants:', err);
    return [];
  }
}

// ============================
// Show Product Detail
// ============================
async function showProductDetail(productId) {
  try {
    // 🔹 Fetch sản phẩm
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select(`*`)
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    const p = productData;

    // 🔹 Fetch variants đầy đủ, bao gồm SKU
    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, size, color, color_hex, price, inventory_quantity, sku')
      .eq('product_id', productId);

    if (variantsError) throw variantsError;

    const variants = variantsData || [];

    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
    const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
    const images = (p.images || []).map(img => img.url);

    // 🔹 Hiển thị modal
    const modalBody = document.querySelector("#productDetailModal .modal-body");
    modalBody.innerHTML = `
      <div class="row g-5">
        <div class="col-md-6">
          <div class="product-gallery d-flex flex-wrap gap-2">
            ${images.length ? images.map(url => `<img src="${url}" alt="${p.name}" style="width:500px;height:fit;object-fit:cover;">`).join("") : `<div class="text-muted">Không có hình ảnh</div>`}
          </div>
        </div>
        <div class="col-md-6">
          <div class="product-info">
            <div class="product-header mb-3">
              <div class="collection-name text-muted mb-1">${p.collection?.name || "-"}</div>
              <h2 class="product-title">${p.name || "-"}</h2>
              <div class="product-price mb-2">
                ${p.base_price ? "$" + p.base_price.toLocaleString("en-US") : "-"}
                ${p.compare_price ? `<del class="text-muted ms-2">$${p.compare_price.toLocaleString("en-US")}</del>` : ""}
              </div>
            </div>

            <p class="product-description mb-3">${p.description || "Chưa có mô tả"}</p>

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
                ${variants.map(v => `
                  <tr data-id="${v.id || ""}">
                    <td>${v.size || ""}</td>
                    <td>${v.color || ""}</td>
                    <td>${v.color_hex || ""}</td>
                    <td>${v.price ? "$" + v.price.toLocaleString("en-US") : ""}</td>
                    <td>${v.inventory_quantity || ""}</td>
                    <td>${v.sku || ""}</td>
                    <td><button class="btn btn-sm btn-danger delete-variant-btn">Xoá</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <hr>
            <h5>Chi tiết bổ sung</h5>
            <p><strong>Mã sản phẩm (SKU):</strong> ${p.sku || "-"}</p>
            <p><strong>Đường dẫn (Slug):</strong> ${p.slug || "-"}</p>
            <p><strong>Danh mục:</strong> ${p.category?.name || "-"}</p>
            <p><strong>Thành phần vật liệu:</strong> ${JSON.stringify(p.material_composition) || "-"}</p>
            <p><strong>Hướng dẫn bảo quản:</strong> ${p.care_instructions || "-"}</p>
            <p><strong>Ghi chú bền vững:</strong> ${p.sustainability_notes || "-"}</p>
            <p><strong>Phương pháp sản xuất:</strong> ${p.production_method || "-"}</p>
            <p><strong>Chứng nhận:</strong> ${(p.certification_labels || []).join(", ") || "-"}</p>
            
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
    document.getElementById("editProductBtn").addEventListener("click", () => openProductForm(productId));
    document.getElementById("deleteProductBtn").addEventListener("click", async () => {
      if (!confirm("Bạn có chắc chắn muốn xoá sản phẩm này không?")) return;
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      alert("✅ Đã xoá sản phẩm!");
      bootstrap.Modal.getInstance(document.getElementById("productDetailModal")).hide();
      await loadAdminProducts();
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
      const res = await fetch(`/api/admin/products/${productId}`, {
        headers: getAuthHeaders()
      });
      const result = await res.json();
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
          <input type="text" id="productName" class="form-control" value="${productData?.name || ""}" required>
          <small class="text-muted d-block mb-2">Nhập tên sản phẩm (bắt buộc).</small>

          <label class="form-label mt-2">Đường dẫn (Slug) - Tự động</label>
          <input type="text" id="productSlug" class="form-control" value="${productData?.slug || ""}" readonly>
          <small class="text-muted d-block mb-2">Slug tự tạo theo tên sản phẩm, không sửa trực tiếp.</small>

          <label class="form-label mt-2">Collection</label>
          <select id="productCollection" class="form-select">
            <option value="">-- Chọn Collection --</option>
          </select>
          <small class="text-muted d-block mb-2">Chọn collection sản phẩm. Có thể để trống.</small>

          <label class="form-label mt-2">Giá cơ bản (USD)</label>
          <input type="number" id="productBasePrice" class="form-control" value="${productData?.base_price || 0}" required>
          <small class="text-muted d-block mb-2">Nhập giá cơ bản (bắt buộc).</small>

          <label class="form-label mt-2">Giá so sánh (USD)</label>
          <input type="number" id="productComparePrice" class="form-control" value="${productData?.compare_price || ""}">
          <small class="text-muted d-block mb-2">Giá so sánh, có thể để trống.</small>

          <label class="form-label mt-2">Mã sản phẩm (SKU)</label>
          <input type="text" id="productSKU" class="form-control" value="${productData?.sku || ""}">
          <small class="text-muted d-block mb-2">Mã sản phẩm, có thể để trống.</small>

          <label class="form-label mt-2">Danh mục</label>
          <input type="text" id="productCategory" class="form-control" value="${productData?.category?.name || ""}">
          <small class="text-muted d-block mb-2">Tên danh mục, có thể để trống.</small>

          <label class="form-label mt-2">Mô tả</label>
          <textarea id="productDescription" class="form-control" rows="2">${productData?.description || ""}</textarea>
          <small class="text-muted d-block mb-2">Mô tả chi tiết, có thể để trống.</small>

          <label class="form-label mt-2">Mô tả ngắn</label>
          <textarea id="productShortDescription" class="form-control" rows="2">${productData?.short_description || ""}</textarea>
          <small class="text-muted d-block mb-2">Mô tả ngắn, có thể để trống.</small>
        </div>

        <div class="col-md-6">
          <label class="form-label fw-bold">Ảnh sản phẩm</label>
          <div class="border rounded p-3 bg-light mb-2">
            <button type="button" id="openImagePicker" class="btn btn-outline-secondary btn-sm mb-2">
              Chọn ảnh từ thư mục
            </button>
            <input type="text" id="productImageUrl" class="form-control mb-2" placeholder="/images/ten-anh.jpg" readonly>
            <div id="selectedImagePreview" class="mb-2">
              ${productData?.images?.[0]?.url
                ? `<img src="${productData.images[0].url}" style="width:100px;height:100px;object-fit:cover;border-radius:6px;">`
                : ""
              }
            </div>
          </div>
          <small class="text-muted d-block mb-2">
            Chọn ảnh có sẵn trong thư mục /public/images
          </small>

          <label class="form-label mt-2">Thành phần vật liệu (JSON)</label>
          <textarea id="productMaterial" class="form-control" rows="3">${JSON.stringify(productData?.material_composition || {})}</textarea>
          <small class="text-muted d-block mb-2">Ví dụ: {"cotton":50,"polyester":50}. Có thể để trống.</small>

          <label class="form-label mt-2">Hướng dẫn bảo quản</label>
          <textarea id="productCare" class="form-control" rows="2">${productData?.care_instructions || ""}</textarea>
          <small class="text-muted d-block mb-2">Ví dụ: Giặt tay, phơi nơi thoáng. Có thể để trống.</small>

          <label class="form-label mt-2">Ghi chú về tính bền vững</label>
          <textarea id="productSustainability" class="form-control" rows="2">${productData?.sustainability_notes || ""}</textarea>
          <small class="text-muted d-block mb-2">Ví dụ: Vật liệu thân thiện môi trường. Có thể để trống.</small>

          <label class="form-label mt-2">Phương pháp sản xuất</label>
          <textarea id="productProduction" class="form-control" rows="2">${productData?.production_method || ""}</textarea>
          <small class="text-muted d-block mb-2">Ví dụ: Thủ công. Có thể để trống.</small>

          <label class="form-label mt-2">Chứng nhận (phân tách bằng ,)</label>
          <input type="text" id="productCertifications" class="form-control" value="${(productData?.certification_labels || []).join(", ")}">
          <small class="text-muted d-block mb-2">Ví dụ: OEKO-TEX, GOTS. Có thể để trống.</small>
        </div>
      </div>

      <div class="mt-3 text-end">
        <button type="submit" class="btn btn-dark">${productId ? "Cập nhật" : "Thêm mới"}</button>
      </div>
    </form>
  `;

  // Load collection list vào select
  const collectionRes = await fetch("/api/admin/collections", {
    headers: getAuthHeaders()
  });
  const collectionData = await collectionRes.json();
  if (collectionData.success && Array.isArray(collectionData.data)) {
    const select = modalBody.querySelector("#productCollection");
    select.innerHTML = `<option value="">-- Chọn Collection --</option>`; // reset
    collectionData.data.forEach(c => {
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
  formEl.onsubmit = async e => {
    e.preventDefault();

    const productId = formEl.dataset.productId || null;
    const formData = {
      name: nameInput.value.trim(),
      sku: modalBody.querySelector("#productSKU").value.trim() || "",
      slug: slugInput.value,
      collection_id: modalBody.querySelector("#productCollection").value || null,
      base_price: Number(modalBody.querySelector("#productBasePrice").value),
      compare_price: modalBody.querySelector("#productComparePrice").value
        ? Number(modalBody.querySelector("#productComparePrice").value)
        : null,
      description: modalBody.querySelector("#productDescription").value || null,
      short_description: modalBody.querySelector("#productShortDescription").value || null,
      material_composition: (() => {
        try { return JSON.parse(modalBody.querySelector("#productMaterial").value); } 
        catch { return null; }
      })(),
      care_instructions: modalBody.querySelector("#productCare").value || null,
      sustainability_notes: modalBody.querySelector("#productSustainability").value || null,
      production_method: modalBody.querySelector("#productProduction").value || null,
      certification_labels: modalBody.querySelector("#productCertifications").value
        ? modalBody.querySelector("#productCertifications").value.split(",").map(s => s.trim())
        : null,
      featured_image_url:  document.getElementById("productImageUrl").value || null,
      status: "active",
      is_featured: false,
      low_stock_threshold: null
    };

    try {
      let res, result, newProductId;

      if (!productId) {
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`/api/admin/products/${productId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(formData)
        });
      }
      
      result = await res.json();
      if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        if (result.error) {
          throw new Error(result.error);
        }
      newProductId = productId || result.data.id;

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

// ===== CHỌN ẢNH TỪ THƯ MỤC =====
const openPickerBtn = modalBody.querySelector("#openImagePicker");
const imageUrlInput = modalBody.querySelector("#productImageUrl");
const imagePreview = modalBody.querySelector("#selectedImagePreview");

openPickerBtn.addEventListener("click", async () => {
  // Tạo ID duy nhất cho modal mỗi lần mở
  const modalId = `imagePickerModal_${Date.now()}`;

  const modalHtml = `
    <div class="modal fade" id="${modalId}" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Chọn ảnh từ thư mục</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body d-flex flex-wrap gap-2 justify-content-start">
            <div class="text-center text-muted py-3">Đang tải ảnh...</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Huỷ</button>
            <button type="button" class="btn btn-primary" id="confirmImageBtn" disabled>Chọn ảnh</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Thêm modal vào DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  const modalEl = document.getElementById(modalId);
  const modalBodyEl = modalEl.querySelector(".modal-body");
  const confirmBtn = modalEl.querySelector("#confirmImageBtn");

  let selectedUrl = null;

  // Lấy danh sách ảnh từ server
  try {
    const res = await fetch("/api/admin/product-images", {
      headers: getAuthHeaders()
    });
    const images = await res.json();

    if (!Array.isArray(images) || images.length === 0) {
      modalBodyEl.innerHTML = "<div class='text-center text-danger py-3'>Không có ảnh nào.</div>";
    } else {
      modalBodyEl.innerHTML = images.map(url => `
        <img src="${url}" data-url="${url}" 
             style="width:100px;height:100px;object-fit:cover;border-radius:6px;cursor:pointer;
                    border:2px solid transparent;">
      `).join("");

      modalBodyEl.querySelectorAll("img").forEach(img => {
        img.addEventListener("click", () => {
          // highlight ảnh được chọn
          modalBodyEl.querySelectorAll("img").forEach(i => i.style.border = "2px solid transparent");
          img.style.border = "2px solid #0d6efd";

          selectedUrl = img.dataset.url;
          confirmBtn.disabled = false;
        });
      });
    }
  } catch (err) {
    console.error("❌ Lỗi khi tải danh sách ảnh:", err);
    modalBodyEl.innerHTML = "<div class='text-center text-danger py-3'>Không tải được danh sách ảnh.</div>";
  }

  // Xử lý nút confirm
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (selectedUrl) {
        imageUrlInput.value = selectedUrl;
        imagePreview.innerHTML = `<img src="${selectedUrl}" style="width:120px;height:120px;object-fit:cover;border-radius:6px;">`;
        bootstrap.Modal.getInstance(modalEl).hide();
      }
    });
  }

  // Mở modal
  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();

  // Remove modal khỏi DOM khi đóng
  modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());
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
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Quản lý Biến Thể</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex justify-content-end mb-2">
              <button class="btn btn-sm btn-success" id="addVariantBtn">Thêm Biến Thể</button>
            </div>
            <table class="table table-sm table-bordered" id="variantsEditTable">
              <thead>
                <tr>
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
                ${variants.map(v => `
                  <tr data-id="${v.id || ""}">
                    <td><input type="text" class="form-control form-control-sm size" value="${v.size || ""}"></td>
                    <td><input type="text" class="form-control form-control-sm color" value="${v.color || ""}"></td>
                    <td><input type="text" class="form-control form-control-sm color-hex" value="${v.color_hex || ""}"></td>
                    <td><input type="number" class="form-control form-control-sm price" value="${v.price || ""}"></td>
                    <td><input type="number" class="form-control form-control-sm inventory" value="${v.inventory_quantity || ""}"></td>
                    <td><input type="text" class="form-control form-control-sm sku" value="${v.sku || ""}"></td>
                    <td><button class="btn btn-sm btn-danger delete-variant-btn">Xoá</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
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
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
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
  modalEl.addEventListener("click", e => {
    if (e.target.classList.contains("delete-variant-btn")) {
      e.target.closest("tr").remove();
    }
  });

  // 🔹 Lưu variants lên backend
  modalEl.querySelector("#saveVariantsBtn").addEventListener("click", async () => {
    const rows = Array.from(modalEl.querySelectorAll("#variantsEditTable tbody tr"));
    const newVariants = [];
    const updateVariants = [];

    rows.forEach(row => {
      const variant = {
        size: row.querySelector(".size").value.trim(),
        color: row.querySelector(".color").value.trim(),
        color_hex: row.querySelector(".color-hex").value.trim(),
        price: Number(row.querySelector(".price").value) || 0,
        inventory_quantity: Number(row.querySelector(".inventory").value) || 0,
        sku: row.querySelector(".sku").value.trim(),
        product_id: productId
      };

      if (row.dataset.id) {
        // Row cũ, cần update
        variant.id = row.dataset.id;
        updateVariants.push(variant);
      } else {
        // Row mới, insert
        newVariants.push(variant);
      }
    });

    try {
      // Insert mới
      if (newVariants.length) {
        const { error: insertError } = await supabase
          .from("product_variants")
          .insert(newVariants);

        if (insertError) throw insertError;
      }

      // Update cũ
      for (const v of updateVariants) {
        const { error: updateError } = await supabase
          .from("product_variants")
          .update({
            size: v.size,
            color: v.color,
            color_hex: v.color_hex,
            price: v.price,
            inventory_quantity: v.inventory_quantity,
            sku: v.sku
          })
          .eq("id", v.id);

        if (updateError) throw updateError;
      }

      alert("✅ Lưu biến thể thành công!");
      modalInstance.hide();
      modalEl.remove();

      // Reload chi tiết sản phẩm
      showProductDetail(productId);
    } catch (err) {
      alert("❌ " + err.message);
    }
  });

  // Remove modal khỏi DOM khi đóng
  modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());
}

