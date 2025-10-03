import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ChevronRight, Leaf, Droplet, Recycle } from "lucide-react"

// Mock product data - replace with actual database query
const product = {
  id: "1",
  name: "The Column Dress",
  price: 385,
  description:
    "A precision-cut silhouette that skims the body with effortless structure. Crafted in certified organic sateen with a soft, weightless drape. Minimal seams, maximal impact.",
  collection: "The White Space Edit",
  images: [
    "/minimal-white-column-dress-front-view-architectura.jpg",
    "/minimal-white-column-dress-back-view-detail.jpg",
    "/minimal-white-column-dress-side-drape-movement.jpg",
    "/minimal-white-column-dress-fabric-texture-closeup.jpg",
  ],
  sizes: ["XS", "S", "M", "L", "XL"],
  material: {
    composition: {
      "Organic Cotton": 100,
    },
    certification: ["GOTS Certified", "OEKO-TEX Standard 100"],
  },
  care: "Machine wash cold with like colors. Hang dry. Low iron if needed. Do not bleach.",
  sustainability: {
    water: "Closed-loop water system reduces consumption by 90%",
    dye: "Low-impact natural dyes",
    production: "Small-batch production in ethical factories",
  },
  details: [
    "Architectural lines with fluid movement",
    "Hand-finished seams",
    "Reinforced hems",
    "Precision drape",
    "Seasonless design",
  ],
}

export default function ProductDetailPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-12">
            <a href="/products" className="hover:text-foreground transition-colors">
              Shop
            </a>
            <ChevronRight className="w-4 h-4" />
            <span>{product.collection}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Image Gallery */}
            <div className="space-y-4">
              {product.images.map((image, index) => (
                <div key={index} className="relative aspect-[3/4] bg-secondary overflow-hidden">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Product Info */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <div className="mb-8">
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">{product.collection}</p>
                <h1 className="text-4xl md:text-5xl font-serif font-light mb-6 text-balance">{product.name}</h1>
                <p className="text-2xl font-light mb-8">${product.price}</p>
                <p className="text-base leading-relaxed text-muted-foreground">{product.description}</p>
              </div>

              {/* Size Selection */}
              <div className="mb-8 pb-8 border-b border-border">
                <label className="block text-sm font-medium mb-4 tracking-wide">Select Size</label>
                <div className="grid grid-cols-5 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className="py-3 text-sm border border-border hover:border-foreground transition-colors"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart */}
              <Button className="w-full h-14 text-base mb-4">Add to Cart</Button>
              <p className="text-xs text-center text-muted-foreground mb-12">Free shipping on orders over $200</p>

              {/* Details */}
              <div className="space-y-8 mb-12">
                <div>
                  <h3 className="text-sm font-medium mb-4 tracking-wide">The Craft</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {product.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-foreground mt-1">—</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4 tracking-wide">Material</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {Object.entries(product.material.composition).map(([material, percentage]) => (
                      <p key={material}>
                        {percentage}% {material}
                      </p>
                    ))}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {product.material.certification.map((cert) => (
                        <span key={cert} className="px-3 py-1 text-xs border border-border">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4 tracking-wide">Care Instructions</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.care}</p>
                </div>
              </div>

              {/* Sustainability */}
              <div className="pt-8 border-t border-border">
                <h3 className="text-sm font-medium mb-6 tracking-wide">Sustainability</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Droplet className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Water Conservation</p>
                      <p className="text-sm text-muted-foreground">{product.sustainability.water}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Leaf className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Natural Dyes</p>
                      <p className="text-sm text-muted-foreground">{product.sustainability.dye}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Recycle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Ethical Production</p>
                      <p className="text-sm text-muted-foreground">{product.sustainability.production}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Section */}
          <div className="mt-32 pt-20 border-t border-border max-w-2xl mx-auto text-center">
            <p className="text-2xl md:text-3xl font-serif font-light leading-relaxed text-balance">
              "Precision is our signature. Responsibility is our standard."
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
