# Stylist Component Improvements & Bug Fixes

## 📊 Audit Summary

**Total Bugs Found**: 18  
**Total Improvements**: 12  
**Files Affected**: 5 (StylistPageContent.tsx, OutfitSlotCard.tsx, OutfitLayout.tsx, OutfitAdjustBar.tsx, OutfitExplainer.tsx)

---

## 🐛 Critical Bugs Found

### 1. **Silent Fetch Error Handling**
**File**: `StylistPageContent.tsx:141`  
**Severity**: HIGH  
**Issue**: `.catch(() => { /* silencieux */ })` masks real errors
```typescript
// BEFORE (line 141)
.catch(() => { /* silencieux — fallback Amazon */ });

// AFTER
.catch((err) => {
  console.warn("[stylist] Product fetch failed:", err);
  // Fallback to Amazon link still works
});
```
**Impact**: Errors silently fail, user sees broken state without knowing why

---

### 2. **Unsafe JSON Parsing without Validation**
**Files**: Lines 94, 569, 1149, 1156, 1585, 1659  
**Severity**: HIGH  
**Issue**: JSON.parse() without structure validation
```typescript
// BEFORE
const profile = JSON.parse(profileRaw);

// AFTER
const profile = safeParseJSON(profileRaw, validateUserPrefs);
```
**Impact**: Invalid data from localStorage crashes logic

---

### 3. **Missing HTTP Status Check on Fetch**
**File**: `StylistPageContent.tsx:113`  
**Severity**: HIGH  
**Issue**: Returns null on error but doesn't log
```typescript
// BEFORE
.then((r) => r.ok ? r.json() : null)

// AFTER
.then((r) => {
  if (!r.ok) {
    console.warn(`[stylist] API error: HTTP ${r.status}`);
    return null;
  }
  return r.json();
})
```
**Impact**: Failures silently swallowed

---

### 4. **No Timeout on API Calls**
**File**: `StylistPageContent.tsx:112`  
**Severity**: MEDIUM  
**Issue**: Slow API hangs forever
```typescript
// BEFORE
fetch(`/api/products?${params}`)

// AFTER
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);
const res = await fetch(url, { signal: controller.signal });
```
**Impact**: Slow networks cause UI freeze

---

### 5. **Missing Null Checks on Data Access**
**File**: `StylistPageContent.tsx:1375-1385`  
**Severity**: MEDIUM  
**Issue**: Direct property access without validation
```typescript
// BEFORE
const accordRef = composed.palette?.entry?.number || null;
const accordName = composed.palette?.entry?.name || null;

// AFTER (with validation)
const accordRef = composed?.palette?.entry?.number || null;
const accordName = composed?.palette?.entry?.name || null;
if (!accordRef) {
  console.warn("[stylist] Missing palette data");
}
```
**Impact**: Undefined crashes on render

---

### 6. **Race Condition in useMujiForSlot**
**File**: `StylistPageContent.tsx:78-143`  
**Severity**: MEDIUM  
**Issue**: Multiple fetches can resolve out of order
```typescript
// BEFORE
let cancelled = false;
// ... fetch ...
if (cancelled || !data?.products?.length) return;

// AFTER (with timestamp-based dedup)
let fetchId = 0;
useEffect(() => {
  const currentFetchId = ++fetchId;
  fetch(...)
    .then(() => {
      if (currentFetchId !== fetchId) return; // Stale
      setProduct(result);
    })
}, [...deps]);
```
**Impact**: Old results override newer ones

---

### 7. **Missing Cleanup on Component Unmount**
**File**: Multiple useEffect hooks  
**Severity**: MEDIUM  
**Issue**: No cleanup of fetch cancellation
```typescript
// BEFORE
useEffect(() => {
  let cancelled = false;
  // ... fetch ...
  return () => { cancelled = true; };
}, []);

// AFTER (with explicit cleanup)
useEffect(() => {
  let cancelled = false;
  const controller = new AbortController();
  // ... fetch with signal ...
  return () => {
    cancelled = true;
    controller.abort();
  };
}, []);
```
**Impact**: Memory leaks, orphaned requests

---

### 8. **No Error Boundary for Chat Messages**
**File**: `StylistPageContent.tsx:1617-1659`  
**Severity**: MEDIUM  
**Issue**: Stream parsing errors crash entire page
```typescript
// BEFORE
const data = JSON.parse(line.slice(6));

// AFTER
try {
  const data = safeParseJSON(line.slice(6), validateStreamMessage);
  if (!data) {
    console.warn("[stylist] Invalid stream message");
    continue;
  }
} catch (err) {
  console.error("[stylist] Stream parsing failed:", err);
}
```
**Impact**: Single bad message crashes conversation

---

### 9. **Missing Product Data Validation**
**File**: `StylistPageContent.tsx:116-128`  
**Severity**: MEDIUM  
**Issue**: No check for required product fields
```typescript
// BEFORE
const p = data.products[0];
const displayImage = p.imageLocal || ...;

// AFTER
const p = data.products[0];
if (!p?.nom || !p?.prix) {
  console.warn("[stylist] Invalid product data");
  return null;
}
```
**Impact**: Broken product cards with missing info

---

### 10. **No Type Validation on API Responses**
**File**: Multiple fetch calls  
**Severity**: MEDIUM  
**Issue**: Trust unknown data structures
```typescript
// Use new helper
const data = await fetchWithErrorHandling('/api/products', {
  validator: (data) => data?.products?.length > 0
});
```

---

## ✨ UX & Performance Improvements

### 1. **Add Skeleton Loaders for Piece Cards**
**File**: `OutfitSlotCard.tsx`  
**Improvement**: Show skeleton while fetching product
```tsx
<div className="animate-pulse">
  <div className="h-48 bg-gray-200 rounded"></div>
  <div className="h-4 bg-gray-200 rounded mt-2"></div>
</div>
```

### 2. **Better Loading States**
Show progression through conversation phases:
- "Analyzing your preferences..." (0-15%)
- "Finding palette..." (15-40%)
- "Selecting products..." (40-70%)
- "Composing outfit..." (70-100%)

### 3. **Add Retry Logic with Backoff**
For failed fetches, retry with exponential backoff:
```typescript
async function fetchWithRetry(url, opts, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchWithErrorHandling(url, opts);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }
}
```

### 4. **Improve Error Messages**
Replace silent failures with user-friendly messages:
- "Product temporarily unavailable"
- "Slow network detected - retrying..."
- "Unable to load this piece - trying alternative"

### 5. **Cache Product Results**
Avoid refetching same product:
```typescript
const productCache = new Map<string, ProductData>();
const cacheKey = `${slot}-${colorHex}-${style}`;
```

### 6. **Add Haptic Feedback (Mobile)**
When piece loads, slight vibration:
```typescript
navigator?.vibrate?.(50);
```

---

## 📋 Detailed Bug List

| # | File | Line | Issue | Severity | Fix |
|---|------|------|-------|----------|-----|
| 1 | StylistPageContent | 141 | Silent catch | HIGH | Log errors |
| 2 | StylistPageContent | 94, 569, 1149, 1156 | Unsafe JSON.parse | HIGH | Use safeParseJSON |
| 3 | StylistPageContent | 113 | No HTTP check | HIGH | Validate status |
| 4 | StylistPageContent | 112 | No timeout | MEDIUM | Add AbortController |
| 5 | StylistPageContent | 1375+ | No null checks | MEDIUM | Guard access |
| 6 | StylistPageContent | 78+ | Race condition | MEDIUM | Use fetchId |
| 7 | All hooks | useEffect | Missing cleanup | MEDIUM | Add return() |
| 8 | StylistPageContent | 1659 | No stream validation | MEDIUM | Validate messages |
| 9 | StylistPageContent | 116 | No product validation | MEDIUM | Check fields |
| 10 | Multiple | Multiple | No type validation | MEDIUM | Add validators |
| 11 | OutfitSlotCard | Multiple | No skeleton | LOW | Add placeholder |
| 12 | StylistPageContent | Stream | No progress indication | LOW | Add phase labels |
| 13 | OutfitSlotCard | 72-102 | Cache miss | LOW | Implement cache |
| 14 | Fetch calls | Multiple | No retry logic | LOW | Add exponential backoff |
| 15 | Error display | Multiple | Silent failures | LOW | Show toasts |
| 16 | Images | Multiple | No fallback | LOW | Use default image |
| 17 | Mobile | Multiple | No haptic | LOW | Add vibration |
| 18 | State | Multiple | No dedupe | LOW | Prevent duplicates |

---

## 🛠️ Implementation Priority

### Phase 1 (Critical - Do First)
- [ ] Fix silent catch blocks (1, 2, 3)
- [ ] Add timeouts to fetches (4)
- [ ] Add null checks (5)
- [ ] Fix race conditions (6)

### Phase 2 (High - Do Next)
- [ ] Add cleanup functions (7)
- [ ] Validate stream messages (8)
- [ ] Validate product data (9)
- [ ] Add type validators (10)

### Phase 3 (Medium - Nice to Have)
- [ ] Add skeleton loaders (11)
- [ ] Improve error messages (15)
- [ ] Add fallback images (16)
- [ ] Add cache layer (13)

### Phase 4 (Low - Polish)
- [ ] Add retry logic (14)
- [ ] Add haptic feedback (17)
- [ ] Add progress phases (12)
- [ ] Deduplicate state (18)

---

## 📦 Files Created

- `lib/stylist/helpers.ts` - Robust helpers with validation
  - `safeParseJSON()` - Safe JSON parsing
  - `fetchProductForSlot()` - Product fetching with timeout
  - `fetchWithErrorHandling()` - Generic API fetching
  - `validateUserPrefs()` - Preference validation
  - `loadUserPreferences()` - Safe preference loading

---

## ✅ Testing Checklist

- [ ] Test with slow network (DevTools 3G)
- [ ] Test with offline mode
- [ ] Test product fetch timeout
- [ ] Test invalid JSON in localStorage
- [ ] Test stream parsing with bad data
- [ ] Test component unmount during fetch
- [ ] Test rapid piece selection changes
- [ ] Test with missing product data

---

Status: 🔍 Audit Complete  
Generated: 2026-06-13  
Next: Implement Phase 1 fixes
