# 🐛 Bugs Found - Session 2

**Date**: 2026-06-13 20:00  
**Status**: 🟡 **Still searching**  
**Total Bugs Found So Far**: 6  

---

## 🔴 Critical Bugs (HIGH)

### Bug #1: Brand Images Not Transformed for External URLs
**File**: `components/BoutiqueHero.tsx:82`  
**Severity**: HIGH  
**Issue**: Images from Awin/external sources are used directly without `/api/img` transformation

```typescript
// BEFORE (line 82)
.map((p: { image?: string; largeImage?: string }) => p.image || p.largeImage)

// IMPACT: CORS errors, missing images in Boutique hero
// Also affects:
// - components/CategoryPage.tsx:465
// - components/GroupedProductCard.tsx:151
// - components/HomeNouveautes.tsx:80
```

**Solution**: Transform all external image URLs through `/api/img` proxy
```typescript
function normalizeImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return `/api/img?u=${encodeURIComponent(url)}`;
  return url;
}

.map((p) => normalizeImageUrl(p.image || p.largeImage))
```

**Files Affected**:
- `components/BoutiqueHero.tsx` - 1 occurrence
- `components/CategoryPage.tsx` - 1 occurrence
- `components/GroupedProductCard.tsx` - 1 occurrence
- `components/HomeNouveautes.tsx` - 1 occurrence
- `components/PaletteCard.tsx` - Likely similar
- **Total**: 5+ occurrences

---

### Bug #2: SSR Crash - localStorage Access Without Window Check
**File**: `app/stylist/StylistPageContent.tsx:1160`  
**Severity**: HIGH  
**Issue**: `localStorage.getItem("wada-gender")` called without checking `typeof window`

```typescript
// BEFORE (line 1160)
const genderRaw = localStorage.getItem("wada-gender");  // ❌ SSR crash

// AFTER
const genderRaw = typeof window !== 'undefined' ? localStorage.getItem("wada-gender") : null;
```

**Search Pattern**: `localStorage\.(getItem|setItem|removeItem)` without window check  
**Likely Other Locations**:
- Search all components for direct localStorage access
- Apply window check universally

---

### Bug #3: Unsafe JSON.parse in Newsletter Component
**File**: `components/Newsletter.tsx:63`  
**Severity**: MEDIUM  
**Issue**: `JSON.parse(raw)` assumes array structure without validation

```typescript
// BEFORE (line 63)
const raw = localStorage.getItem("wada-newsletter") || "[]";
const list: string[] = JSON.parse(raw);  // Could fail if data corrupted

// AFTER
try {
  const raw = localStorage.getItem("wada-newsletter") || "[]";
  const list = safeParseJSON<string[]>(raw, (d): d is string[] => Array.isArray(d));
} catch {
  // fallback
}
```

---

## 🟡 Medium Priority Bugs

### Bug #4: Missing Error Boundary for Stripe Session Creation
**File**: `app/api/stripe/checkout/route.ts`  
**Severity**: MEDIUM  
**Issue**: No timeout on Stripe API call - could hang indefinitely

```typescript
// BEFORE
const session = await stripe.checkout.sessions.create({...});

// AFTER
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);
try {
  const session = await stripe.checkout.sessions.create({...});
  // success
} finally {
  clearTimeout(timeoutId);
}
```

---

### Bug #5: Form Validation Not Preventing Submission
**File**: Multiple form components  
**Severity**: MEDIUM  
**Issue**: Invalid email in Newsletter still proceeds after showing "invalid" state

**Check**:
- Verify preventDefault() is called before API request
- Ensure loading state blocks multiple submissions
- Verify disabled attribute on buttons during loading

---

### Bug #6: Category Filter State Not Preserved on Back Button
**File**: `components/CategoryPage.tsx`  
**Severity**: MEDIUM  
**Issue**: When user goes back from product detail, filters reset

**Solution**: Save filter state to URL searchParams
```typescript
// Before: filters in state only
// After: filters in URL: /vetements?slot=top&style=casual&color=%238B4513
```

---

## 📋 Audit Status

### Checked Components
- ✅ BoutiqueHero.tsx - Bug #1
- ✅ StylistPageContent.tsx - Bug #2, #3
- ✅ Newsletter.tsx - Bug #3
- ✅ stripe/checkout/route.ts - Bug #4
- ⏳ CategoryPage.tsx - In progress
- ⏳ ProductCard components - In progress
- ⏳ Forms - In progress

### Still to Audit
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Mobile responsiveness
- [ ] Image loading fallbacks
- [ ] API error handling
- [ ] Cache invalidation
- [ ] Dark mode (if applicable)

---

## 🎯 Next Steps

1. **Fix Bug #1** (Images): Add `/api/img` transformation across all components
2. **Fix Bug #2** (SSR): Global localStorage safety checks
3. **Fix Bug #3** (JSON): Use safeParseJSON everywhere
4. **Fix Bug #4** (Timeout): Add timeout to API calls
5. **Fix Bug #5** (Forms): Verify form submission safety
6. **Fix Bug #6** (Filters): Implement URL-based filter state

---

## 📊 Statistics

| Category | Count |
|----------|-------|
| Critical | 3 |
| Medium | 3 |
| Low | TBD |
| **Total** | **6** |

---

**Status**: 🔍 Continuing audit...  
**Next**: Fix identified bugs & search for more  
