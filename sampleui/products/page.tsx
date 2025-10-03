import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

// Mock product data - replace with actual database queries
const products = [
  {
    id: "1",
    slug: "column-dress",
    name: "The Column Dress",
    price: 385,
    image: "/minimal-white-column-dress-on-model-architectural.jpg",
    collection: "The White Space Edit",
    material: "Organic Sateen",
  },
  {
    id: "2",
    slug: "structured-blazer",
    name: "Structured Blazer",
    price: 495,
    image: "/minimal-charcoal-blazer-architectural-tailoring.jpg",
    collection: "The Architecture Series",
    material: "Responsible Wool",
  },
  {
    id: "3",
    slug: "pleated-trouser",
    name: "Pleated Trouser",
    price: 325,
    image: "/minimal-black-pleated-trousers-precise-tailoring.jpg",
    collection: "The Architecture Series",
    material: "Organic Cotton Twill",
  },
  {
    id: "4",
    slug: "silk-shell",
    name: "Silk Shell",
    price: 285,
    image: "/minimal-ivory-silk-shell-top-elegant-drape.jpg",
    collection: "The Elemental Capsule",
    material: "Recycled Silk",
  },
  {
    id: "5",
    slug: "wide-leg-pant",
    name: "Wide Leg Pant",
    price: 365,
    image: "/minimal-bone-wide-leg-pants-fluid-movement.jpg",
    collection: "The White Space Edit",
    material: "TENCEL Lyocell",
  },
  {
    id: "6",
    slug: "midnight-coat",
    name: "Midnight Coat",
    price: 685,
    image: "/minimal-navy-midnight-coat-architectural-silhouett.jpg",
    collection: "The Midnight Line",
    material: "Responsible Wool",
  },
]

export default function ProductsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Hero Section */}
          <div className="mb-20 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-serif font-light mb-6 text-balance">Exquisite essentials</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Precision-crafted garments designed for longevity. Each piece is a study in restraint—clean lines,
              architectural silhouettes, and materials chosen for their integrity.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-16 pb-8 border-b border-border">
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border hover:border-foreground transition-colors">
              Collection <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border hover:border-foreground transition-colors">
              Material <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border hover:border-foreground transition-colors">
              Size <ChevronDown className="w-4 h-4" />
            </button>
            <div className="ml-auto text-sm text-muted-foreground">{products.length} pieces</div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="group">
                <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-secondary">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs tracking-widest text-muted-foreground uppercase">{product.collection}</p>
                  <h3 className="text-lg font-light group-hover:text-muted-foreground transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{product.material}</p>
                  <p className="text-base font-medium">${product.price}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Sustainability Message */}
          <div className="mt-32 pt-20 border-t border-border max-w-2xl mx-auto text-center">
            <p className="text-sm tracking-wide text-muted-foreground mb-4">DESIGNED TO ENDURE</p>
            <p className="text-lg leading-relaxed">
              Every Athena garment is traceable—from fiber to finish. We obsess over impact so you can obsess over the
              fit.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
