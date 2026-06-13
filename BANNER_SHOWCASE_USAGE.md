# Brand Banner Showcase - High-Quality Product Banners

**Component**: `components/BrandBannerShowcase.tsx`  
**Status**: 🟢 Ready to use  
**Purpose**: Display high-quality product images as hero banners  

---

## 📋 Overview

A responsive banner component that displays large, high-quality product images from your brand feeds (New Era, MUJI, etc) in beautiful hero-style banners.

**Features**:
- ✅ Auto-rotating carousel (8s interval)
- ✅ Manual pagination via dots
- ✅ 3 layout options (full-width, half-width, sidebar)
- ✅ Smooth animations & hover effects
- ✅ Responsive design
- ✅ Image lazy loading
- ✅ CORS-safe image proxy

---

## 🎯 Layout Options

### 1. Full-Width Banner
**Best for**: Page dividers, between sections  
**Size**: 100% width × 300px height  
**Use**: Hero sections, featured products

```tsx
<BrandBannerShowcase layout="full-width" />
```

**Example placement**:
```tsx
<main>
  <ProductGrid />
  <BrandBannerShowcase layout="full-width" />
  <RelatedProducts />
</main>
```

---

### 2. Half-Width Banner
**Best for**: Sidebar, alongside content  
**Size**: 600px width × 240px height  
**Use**: Featured product, category highlight

```tsx
<BrandBannerShowcase layout="half-width" />
```

**Example placement**:
```tsx
<div style={{ display: "flex", gap: 24 }}>
  <main style={{ flex: 1 }}>Content...</main>
  <aside style={{ width: 600 }}>
    <BrandBannerShowcase layout="half-width" />
  </aside>
</div>
```

---

### 3. Sidebar Banner
**Best for**: Vertical spaces, margins  
**Size**: 220px width × 400px height  
**Use**: Right sidebar, between sections

```tsx
<BrandBannerShowcase layout="sidebar" />
```

**Example placement**:
```tsx
<div style={{ display: "flex", gap: 24 }}>
  <main>Content...</main>
  <aside style={{ width: 220 }}>
    <BrandBannerShowcase layout="sidebar" />
  </aside>
</div>
```

---

## 🎨 Usage & Props

```tsx
import { BrandBannerShowcase } from "@/components/BrandBannerShowcase";

export default function ProductPage() {
  return (
    <BrandBannerShowcase
      layout="full-width"           // "full-width" | "half-width" | "sidebar"
      autoRotate={true}             // Auto-rotate banners
      rotateInterval={8000}         // Rotation speed (ms)
      brands={["new-era", "muji"]}  // Filter specific brands (optional)
      maxBanners={6}                // Max banners to load
    />
  );
}
```

### Props Explained

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `layout` | string | "full-width" | Responsive layout mode |
| `autoRotate` | boolean | true | Enable auto-rotation |
| `rotateInterval` | number | 8000 | Rotation speed in milliseconds |
| `brands` | string[] | undefined | Filter by specific brands |
| `maxBanners` | number | 6 | Maximum banners to load |

---

## 📍 Where to Place Banners

### Full-Width (100%)
- Between product sections
- After featured products
- Before newsletter
- Between categories
- Home page sections

```tsx
<section>Featured products...</section>
<BrandBannerShowcase layout="full-width" />
<section>Related items...</section>
```

### Half-Width (600px)
- Right column on product page
- Alongside product details
- In two-column layouts
- Beside filters on category

```tsx
<div style={{ display: "flex" }}>
  <main style={{ flex: 1 }}>
    Product details...
  </main>
  <aside style={{ width: 600 }}>
    <BrandBannerShowcase layout="half-width" />
  </aside>
</div>
```

### Sidebar (220px)
- Right margin
- Left margin
- Between content blocks
- Above/below products

```tsx
<div style={{ display: "grid", gridTemplateColumns: "1fr 220px" }}>
  <main>Content...</main>
  <aside>
    <BrandBannerShowcase layout="sidebar" />
  </aside>
</div>
```

---

## 🎨 Image Quality

The component uses **large images** from product feeds:
- **Source**: `/api/products` endpoint
- **Image field**: `largeImage` (preferred) or `image`
- **Proxy**: `/api/img?u=<url>` for CORS handling
- **Format**: Typically 48x180 or similar aspect ratio
- **Quality**: High-resolution product photography

---

## ⚙️ Integration Examples

### Example 1: Product Detail Page

```tsx
// app/vetements/[slug]/page.tsx
import { BrandBannerShowcase } from "@/components/BrandBannerShowcase";

export default function ProductPage() {
  return (
    <main>
      <div style={{ display: "flex", gap: 24 }}>
        {/* Left: Product */}
        <section style={{ flex: 1 }}>
          <ProductImage />
          <ProductDetails />
        </section>
        
        {/* Right: Sidebar with banner */}
        <aside style={{ width: 600 }}>
          <BrandBannerShowcase 
            layout="half-width"
            brands={["new-era"]}
          />
        </aside>
      </div>
      
      {/* Between sections */}
      <BrandBannerShowcase layout="full-width" />
      
      <RelatedProducts />
    </main>
  );
}
```

### Example 2: Category Page

```tsx
// components/CategoryPage.tsx
import { BrandBannerShowcase } from "@/components/BrandBannerShowcase";

export default function CategoryPage() {
  return (
    <>
      <FilterSidebar />
      
      <BrandBannerShowcase 
        layout="full-width"
        brands={["muji", "new-balance"]}
      />
      
      <ProductGrid />
    </>
  );
}
```

### Example 3: Home Page

```tsx
// app/page.tsx
import { BrandBannerShowcase } from "@/components/BrandBannerShowcase";

export default function HomePage() {
  return (
    <>
      <Hero />
      
      {/* Feature New Era */}
      <BrandBannerShowcase 
        layout="full-width"
        brands={["new-era"]}
        rotateInterval={6000}
      />
      
      <FeaturedSection />
      
      {/* Feature MUJI */}
      <BrandBannerShowcase 
        layout="full-width"
        brands={["muji"]}
      />
      
      <Newsletter />
    </>
  );
}
```

---

## 🎬 Animations

### Hover Effects
- ✅ Slight lift (translateY -4px)
- ✅ Shadow deepens
- ✅ Smooth transition (0.3s)

### Rotation
- ✅ Auto-rotate every 8 seconds
- ✅ Manual dots for quick jump
- ✅ Smooth fade between images

### CTA Button
- ✅ Hover darkens color
- ✅ "Découvrir →" arrow
- ✅ Visible on full/half-width only

---

## 📊 Performance

### Bundle Size
- ~7KB (3.2KB gzipped)
- No external dependencies
- Lazy loads images

### Load Time
- Fetches on component mount
- 40 products per slot (high diversity)
- Graceful fallback if no products

### Image Optimization
- Uses existing `/api/img` proxy
- Lazy loading enabled
- No multiple requests

---

## 🎨 Styling & Theming

### Colors
- **Background**: #f5f1eb (light)
- **Border**: #E8DFD0 (subtle)
- **Overlay**: rgba(30,30,30,0.3) (subtle dark)
- **Text**: #fff (white)
- **CTA**: #6B3A32 (bordeaux)

### Responsive
All layouts are mobile-responsive:
- Full-width: 100% on mobile
- Half-width: Stacks on mobile
- Sidebar: Hidden on <1024px

```tsx
<BrandBannerShowcase 
  layout={window.innerWidth > 1024 ? "half-width" : "full-width"}
/>
```

---

## 🧪 Testing Checklist

```
- [ ] Banner renders with image
- [ ] Auto-rotation works (every 8s)
- [ ] Manual pagination via dots
- [ ] Images load lazily
- [ ] Hover animation smooth
- [ ] Links open products
- [ ] Mobile responsive
- [ ] Brand filter works
- [ ] Graceful fallback (no products)
- [ ] CTA button visible (full/half-width)
- [ ] Performance acceptable (<1s)
```

---

## 🔮 Future Ideas

1. **Manual Controls**
   - Previous/Next arrows
   - Play/Pause button
   - Speed control

2. **Analytics**
   - Track banner clicks
   - Measure engagement
   - Optimize rotation

3. **Personalization**
   - Show brands by preference
   - Rotate based on user history
   - Smart selection

4. **Admin Panel**
   - Choose featured brands
   - Set rotation speed
   - Manual curation

---

## 📞 Questions?

See related components:
- `SidebarBrandShowcase` - Product grid sidebar
- `BrandShowcaseStrip` - Product grid strip
- `lib/image-utils.ts` - Image handling
- `/api/products` - Product API

---

## 🚀 Quick Start

### Step 1: Import
```tsx
import { BrandBannerShowcase } from "@/components/BrandBannerShowcase";
```

### Step 2: Add to Page
```tsx
<BrandBannerShowcase layout="full-width" />
```

### Step 3: Customize (optional)
```tsx
<BrandBannerShowcase 
  layout="full-width"
  brands={["new-era", "muji"]}
  rotateInterval={6000}
/>
```

### Step 4: Deploy
```bash
npm run build
npm run dev
# Test the banners
git push
```

---

**Status**: 🟢 Ready for immediate use  
**Last Updated**: 2026-06-13  
**Next**: Add to pages and monitor engagement  
