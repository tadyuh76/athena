import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-serif font-light mb-6">ATHENA</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium eco fashion for modern minimalists. Designed to endure.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4 tracking-wide">Shop</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/products"
                  className="hover:text-foreground transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/collections"
                  className="hover:text-foreground transition-colors"
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  href="/new"
                  className="hover:text-foreground transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4 tracking-wide">About</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/about"
                  className="hover:text-foreground transition-colors"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/craft"
                  className="hover:text-foreground transition-colors"
                >
                  Craft Standards
                </Link>
              </li>
              <li>
                <Link
                  href="/sustainability"
                  className="hover:text-foreground transition-colors"
                >
                  Sustainability
                </Link>
              </li>
              <li>
                <Link
                  href="/traceability"
                  className="hover:text-foreground transition-colors"
                >
                  Traceability
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4 tracking-wide">Support</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/care"
                  className="hover:text-foreground transition-colors"
                >
                  Care & Repair
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-foreground transition-colors"
                >
                  Shipping
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="hover:text-foreground transition-colors"
                >
                  Returns
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 Athena. Quietly Powerful.</p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
