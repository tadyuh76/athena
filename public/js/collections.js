import { ProductService } from "/services/ProductService.js";

const productService = new ProductService();

/**
 * Show toast notification
 */
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  const toastId = `toast-${Date.now()}`;
  const bgClass = {
    success: "bg-success",
    danger: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
  }[type] || "bg-info";

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.id = toastId;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  toast.innerHTML = `
    <div class="toast-header ${bgClass} text-white">
      <strong class="me-auto">Thông Báo</strong>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Đóng"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 3000,
  });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}

/**
 * Load and display all collections
 */
async function loadCollections() {
  const container = document.getElementById("collectionsGrid");

  try {
    // Show loading state
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-secondary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <div class="mt-3 text-muted">Đang tải bộ sưu tập...</div>
      </div>
    `;

    // Fetch collections from API
    const collections = await productService.getCollections();

    // Check if collections exist
    if (!collections || collections.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-collection" style="font-size: 3rem; color: #ccc;"></i>
          <h4 class="mt-3">Chưa có bộ sưu tập nào</h4>
          <p class="text-muted">Các bộ sưu tập mới sẽ sớm được cập nhật</p>
        </div>
      `;
      return;
    }

    // Render collections
    container.innerHTML = collections
      .map((collection) => {
        const productCount = collection.product_count || 0;
        const productCountText = productCount === 1 ? "sản phẩm" : "sản phẩm";

        return `
          <div class="col-lg-4 col-md-6">
            <div class="card collection-card" onclick="viewCollection('${collection.id}', '${collection.slug || collection.id}')">
              <div class="collection-image">
                <img src="${collection.image_url || collection.featured_image_url || '/images/placeholder-collection.jpg'}"
                     alt="${collection.name}"
                     onerror="this.src='/images/placeholder-collection.jpg'">
              </div>
              <div class="collection-info">
                <h3 class="collection-title">${collection.name}</h3>
                ${collection.description ? `<p class="collection-description">${collection.description}</p>` : ''}
                <p class="collection-count">
                  <i class="bi bi-box-seam me-1"></i>
                  ${productCount} ${productCountText}
                </p>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Failed to load collections:", error);

    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-exclamation-circle" style="font-size: 3rem; color: #dc3545;"></i>
        <h4 class="mt-3">Không thể tải bộ sưu tập</h4>
        <p class="text-muted">Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.</p>
        <button class="btn btn-dark mt-3" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise me-2"></i>Thử Lại
        </button>
      </div>
    `;

    showToast("Không thể tải bộ sưu tập. Vui lòng thử lại sau.", "danger");
  }
}

/**
 * Navigate to products page filtered by collection
 */
window.viewCollection = function(collectionId, collectionSlug) {
  // Redirect to products page with collection filter
  window.location.href = `/products.html?collection=${collectionId}`;
};

// Initialize page on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadCollections();
});
