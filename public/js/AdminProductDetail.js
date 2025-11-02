const sizes = (p.variants || []).map(v => v.size).filter(Boolean);
const colors = (p.variants || []).map(v => v.color).filter(Boolean);
const images = (p.images || []).map(img => img.url);

container.innerHTML = `
  <div class="row g-5">
    <div class="col-md-6">
      <div class="product-gallery">
        ${images.length ? images.map(url => `<div class="gallery-item"><img src="${url}" alt="${p.name}"></div>`).join("") : `<div class="text-muted">Không có hình ảnh</div>`}
      </div>
    </div>

    <div class="col-md-6">
      <div class="product-info">
        <div class="product-header">
          <div class="collection-name">${p.collection?.name || "-"}</div>
          <h1 class="product-title">${p.name || "-"}</h1>
          <div class="product-price">
            ${p.base_price ? p.base_price.toLocaleString("en-US") + " USD" : "-"}
            ${p.compare_price ? `<del class="text-muted ms-2">${p.compare_price.toLocaleString("en-US")} USD</del>` : ""}
          </div>
        </div>

        <p class="product-description">${p.description || "Chưa có mô tả"}</p>

        <div class="product-section">
          <h3>Size</h3>
          <p>${sizes.length ? sizes.join(", ") : "-"}</p>
        </div>

        <div class="product-section">
          <h3>Màu sắc</h3>
          <p>${colors.length ? colors.join(", ") : "-"}</p>
        </div>

        <div class="product-section">
          <h3>Trạng thái</h3>
          <p>${p.status || "Đang cập nhật"}</p>
        </div>
      </div>
    </div>
  </div>
`;
