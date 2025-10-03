import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link
            href="/"
            className="text-2xl font-serif font-light tracking-tight"
          >
            ATHENA
          </Link>

          <nav className="hidden md:flex items-center gap-12 text-sm tracking-wide">
            <Link
              href="/products"
              className="hover:text-muted-foreground transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/collections"
              className="hover:text-muted-foreground transition-colors"
            >
              Collections
            </Link>
            <Link
              href="/about"
              className="hover:text-muted-foreground transition-colors"
            >
              Our Craft
            </Link>
            <Link
              href="/sustainability"
              className="hover:text-muted-foreground transition-colors"
            >
              Sustainability
            </Link>
          </nav>

          <div className="flex items-center gap-6">
            <button className="hover:text-muted-foreground transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
