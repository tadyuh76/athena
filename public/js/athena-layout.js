// Athena Common Layout - Header and Footer
export function initializeAthenaLayout() {
    // Check if header placeholder exists
    const headerPlaceholder = document.getElementById('athena-header');
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = `
            <nav class="navbar navbar-expand-lg fixed-top">
                <div class="container">
                    <a class="navbar-brand" href="/">ATHENA</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav mx-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="/products.html">Shop</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="/collections.html">Collections</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="/craft.html">Our Craft</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="/sustainability.html">Sustainability</a>
                            </li>
                        </ul>
                        <div class="nav-icons">
                            <a href="/cart.html" id="cart-icon">
                                <i class="bi bi-bag" style="font-size: 1.1rem;"></i>
                                <span class="cart-count" id="cart-count" style="display: none;"></span>
                            </a>
                            <a href="#" class="auth-link" id="auth-link">
                                <i class="bi bi-person" style="font-size: 1.3rem;"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }
    
    // Check if footer placeholder exists
    const footerPlaceholder = document.getElementById('athena-footer');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = `
            <footer class="athena-footer">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-3 col-md-6 mb-4">
                            <h5 class="footer-brand">ATHENA</h5>
                            <p class="footer-tagline">Premium eco fashion for modern minimalists. Designed to endure.</p>
                        </div>
                        <div class="col-lg-3 col-md-6 mb-4 footer-section">
                            <h6>Shop</h6>
                            <ul>
                                <li><a href="/products.html">All Products</a></li>
                                <li><a href="/collections.html">Collections</a></li>
                                <li><a href="/new.html">New Arrivals</a></li>
                            </ul>
                        </div>
                        <div class="col-lg-3 col-md-6 mb-4 footer-section">
                            <h6>About</h6>
                            <ul>
                                <li><a href="/story.html">Our Story</a></li>
                                <li><a href="/craft.html">Craft Standards</a></li>
                                <li><a href="/sustainability.html">Sustainability</a></li>
                                <li><a href="/traceability.html">Traceability</a></li>
                            </ul>
                        </div>
                        <div class="col-lg-3 col-md-6 mb-4 footer-section">
                            <h6>Support</h6>
                            <ul>
                                <li><a href="/care.html">Care & Repair</a></li>
                                <li><a href="/shipping.html">Shipping</a></li>
                                <li><a href="/returns.html">Returns</a></li>
                                <li><a href="/contact.html">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p class="footer-copyright mb-0">© 2025 Athena. Quietly Powerful.</p>
                        <div class="footer-links">
                            <a href="/privacy.html">Privacy</a>
                            <a href="/terms.html">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
}

export function initializeAuthLink(authService) {
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.addEventListener('click', function(e) {
            e.preventDefault();
            const user = authService ? authService.getCurrentUser() : JSON.parse(localStorage.getItem('user') || 'null');
            if (user) {
                window.location.href = '/account.html';
            } else {
                window.location.href = '/login.html';
            }
        });
    }
}

// Initialize on DOM content loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeAthenaLayout);
}