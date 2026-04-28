# Easy Vocab Logo Setup Guide

## 📋 Complete File Structure & Specifications

### 1. **Favicon & App Icons** (`/public/favicon/`)
```
public/favicon/
├── favicon.ico              (32x32 px, .ico format - multiple sizes)
├── favicon-16x16.png        (16x16 px)
├── favicon-32x32.png        (32x32 px)
├── favicon-64x64.png        (64x64 px)
├── apple-touch-icon.png     (180x180 px, for iOS)
├── android-192x192.png      (192x192 px, for Android)
└── android-512x512.png      (512x512 px, for Android splash screen)
```

**Aspect Ratio:** 1:1 (Square)
**Format:** PNG with transparent background (except .ico)
**Color:** Full branding logo with all colors

---

### 2. **Logo - Hero Section** (`/public/logos/`)
```
public/logos/
├── easy-vocab-hero-mobile.png    (140x140 px)
├── easy-vocab-hero-tablet.png    (180x180 px)
├── easy-vocab-hero-desktop.png   (220x220 px)
├── easy-vocab-hero-mobile@2x.png (280x280 px, retina)
├── easy-vocab-hero-tablet@2x.png (360x360 px, retina)
└── easy-vocab-hero-desktop@2x.png (440x440 px, retina)
```

**Aspect Ratio:** 1:1 (Square)
**Usage:** Hero section main logo badge
**Breakpoints:**
  - Mobile: 140px (< 640px)
  - Tablet: 180px (640px - 1024px)
  - Desktop: 220px (> 1024px)

---

### 3. **Logo - Login/Auth Pages** (`/public/logos/`)
```
public/logos/
├── easy-vocab-auth-mobile.png    (110x110 px)
├── easy-vocab-auth-tablet.png    (140x140 px)
├── easy-vocab-auth-desktop.png   (160x160 px)
├── easy-vocab-auth-mobile@2x.png (220x220 px, retina)
├── easy-vocab-auth-tablet@2x.png (280x280 px, retina)
└── easy-vocab-auth-desktop@2x.png(320x320 px, retina)
```

**Aspect Ratio:** 1:1 (Square)
**Usage:** Login, Signup, Password Reset pages
**Breakpoints:**
  - Mobile: 110px (< 640px)
  - Tablet: 140px (640px - 1024px)
  - Desktop: 160px (> 1024px)

---

### 4. **Logo - Dashboard/App Header** (`/public/logos/`)
```
public/logos/
├── easy-vocab-compact-32.png     (32x32 px)
├── easy-vocab-compact-48.png     (48x48 px)
├── easy-vocab-compact-64.png     (64x64 px)
├── easy-vocab-compact-32@2x.png  (64x64 px, retina)
├── easy-vocab-compact-48@2x.png  (96x96 px, retina)
└── easy-vocab-compact-64@2x.png  (128x128 px, retina)
```

**Aspect Ratio:** 1:1 (Square)
**Usage:** Navigation bar, app header, breadcrumbs
**Note:** Can be simplified/tighter version if needed

---

### 5. **Logo - Loading/Splash Screen** (`/public/logos/`)
```
public/logos/
└── easy-vocab-splash.png         (512x512 px)
```

**Aspect Ratio:** 1:1 (Square)
**Usage:** Loading screen, app initialization
**Format:** PNG with transparent background

---

### 6. **Open Graph Image (Social Sharing)** (`/public/og/`)
```
public/og/
└── og-image.png                  (1200x630 px)
```

**Aspect Ratio:** 1.9:1 (1200x630 for Twitter/Facebook meta tags)
**Usage:** Social media sharing preview
**Format:** PNG with branding and text overlay

---

## 🎨 File Naming Convention

**Format:** `easy-vocab-[usage]-[size][@2x].png`

- `[usage]`: hero, auth, compact, splash
- `[size]`: mobile, tablet, desktop, 32, 48, 64 (in px)
- `[@2x]`: Optional suffix for retina (2x) displays

**Example:** 
- `easy-vocab-hero-mobile.png` → 140x140px standard
- `easy-vocab-hero-mobile@2x.png` → 280x280px retina
- `easy-vocab-auth-tablet.png` → 140x140px standard
- `easy-vocab-compact-48.png` → 48x48px standard

---

## 📐 Complete Size Reference Table

| Usage | Mobile | Tablet | Desktop | Retina (2x) |
|-------|--------|--------|---------|------------|
| Hero | 140×140 | 180×180 | 220×220 | 280/360/440 |
| Auth | 110×110 | 140×140 | 160×160 | 220/280/320 |
| Compact Header | 32×32 / 48×48 / 64×64 | Same | Same | 64/96/128 |
| Favicon | 16×16 / 32×32 / 64×64 | iOS: 180×180 | Android: 192/512 | N/A |
| Splash Screen | 512×512 | Same | Same | N/A |
| OG Image | 1200×630 | Same | Same | N/A |

---

## 🚀 Implementation Steps

1. **Export** all logo files from design tool (Figma/Adobe XD)
2. **Place** files in `/public/favicon/` and `/public/logos/`
3. **Update** `layout.tsx` with favicon and meta tags
4. **Update** component files (page.tsx, AuthShell.tsx) with responsive image imports
5. **Build** and verify all logos load correctly

---

## 📝 Metadata Setup in `layout.tsx`

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Easy Vocab - Master English Vocabulary",
  description: "Learn English words fast with Interactive spelling, voice pronunciation, and flashcard practice",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-64x64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  openGraph: {
    title: "Easy Vocab - Master English Vocabulary",
    description: "Learn English words fast with Interactive spelling, voice pronunciation, and flashcard practice",
    url: "https://easyvocab.com",
    siteName: "Easy Vocab",
    images: [
      {
        url: "/og/og-image.png",
        width: 1200,
        height: 630,
        alt: "Easy Vocab",
      },
    ],
    type: "website",
  },
};
```

---

## ✅ Setup Checklist

- [ ] Export logo files at all specified sizes
- [ ] Create folder structure: `/public/favicon/` and `/public/logos/`
- [ ] Place all PNG files in appropriate directories
- [ ] Update `layout.tsx` with favicon metadata
- [ ] Update `page.tsx` hero section with responsive logo
- [ ] Update `components/auth/AuthShell.tsx` with responsive logo
- [ ] Run `npm run build` to verify all assets load
- [ ] Test on mobile, tablet, and desktop browsers
- [ ] Verify favicon appears in browser tabs
- [ ] Test OG image on social media preview tools

