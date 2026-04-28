# Quick Logo Setup Reference

## 🎯 Just Add These Files to `/public/` Folder

### Folder Structure to Create:
```
/public/
├── favicon/
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon-64x64.png
│   ├── apple-touch-icon.png (180x180)
│   ├── android-192x192.png
│   └── android-512x512.png
├── logos/
│   ├── easy-vocab-hero-mobile.png (140x140)
│   ├── easy-vocab-hero-mobile@2x.png (280x280)
│   ├── easy-vocab-hero-tablet.png (180x180)
│   ├── easy-vocab-hero-tablet@2x.png (360x360)
│   ├── easy-vocab-hero-desktop.png (220x220)
│   ├── easy-vocab-hero-desktop@2x.png (440x440)
│   ├── easy-vocab-auth-mobile.png (110x110)
│   ├── easy-vocab-auth-mobile@2x.png (220x220)
│   ├── easy-vocab-auth-tablet.png (140x140)
│   ├── easy-vocab-auth-tablet@2x.png (280x280)
│   ├── easy-vocab-auth-desktop.png (160x160)
│   ├── easy-vocab-auth-desktop@2x.png (320x320)
│   ├── easy-vocab-compact-32.png (32x32)
│   ├── easy-vocab-compact-48.png (48x48)
│   ├── easy-vocab-compact-64.png (64x64)
│   ├── easy-vocab-splash.png (512x512)
│   └── ...@2x variants as needed
└── og/
    └── og-image.png (1200x630)
```

---

## 📐 Size Cheat Sheet

### Hero Logo (Replaces text badge in homepage)
| Device | Size | Retina |
|--------|------|--------|
| Mobile | 140×140 | 280×280 |
| Tablet | 180×180 | 360×360 |
| Desktop | 220×220 | 440×440 |

### Auth Logo (Login/Signup pages)
| Device | Size | Retina |
|--------|------|--------|
| Mobile | 110×110 | 220×220 |
| Tablet | 140×140 | 280×280 |
| Desktop | 160×160 | 320×320 |

### Favicon (Browser tab icon)
- `favicon.ico` - 32×32 standard
- `favicon-16x16.png` - Modern browsers
- `favicon-32x32.png` - Modern browsers
- `favicon-64x64.png` - Modern browsers
- `apple-touch-icon.png` - iOS home screen (180×180)
- `android-192x192.png` - Android (192×192)
- `android-512x512.png` - Android splash (512×512)

### Other Usage Sizes
- **Compact/Header:** 32×32, 48×48, 64×64 + @2x variants
- **Splash Screen:** 512×512
- **Social OG Image:** 1200×630 (fixed, not responsive)

---

## ✅ What's Already Set Up

✓ `layout.tsx` - Favicon metadata configured
✓ `page.tsx` - Hero section ready for responsive logo
✓ `AuthShell.tsx` - Auth pages ready for responsive logo
✓ Folder structure created: `/public/favicon/`, `/public/logos/`, `/public/og/`
✓ Build verified - compiles successfully

---

## 🚀 Next Steps (Just You!)

1. **Export logos** from your design tool at all specified sizes
2. **Name files** exactly as shown in the cheat sheet above
3. **Place files** in appropriate `/public/` folders
4. **Run:** `npm run dev` 
5. **Check:** 
   - Hero page loads with logo
   - Login page shows logo
   - Browser tab shows favicon
   - Network tab shows all images loading

---

## 📝 File Naming Rules

- Use **lowercase** and **hyphens** (not underscores)
- Always include **size in filename**: `hero-mobile`, `hero-tablet`, `hero-desktop`
- Use **@2x suffix** for retina versions: `hero-mobile@2x.png`
- Format files as **PNG** (transparent background preferred)

---

## 🔍 Testing After Upload

```bash
# Clear build cache and rebuild
rm -rf .next
npm run build

# Start dev server
npm run dev

# Visit:
# http://localhost:3000 - Hero logo should show
# http://localhost:3000/login - Auth logo should show
# Browser tab - Favicon should appear
```

---

## ⚠️ Common Issues & Fixes

**Logo not showing on hero?**
- Check file path: `/public/logos/easy-vocab-hero-*.png`
- Verify file names match exactly (case-sensitive)
- Check browser Network tab for 404 errors

**Favicon not updating?**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Clear browser cache
- Verify favicon files in `/public/favicon/`

**Images blurry on mobile?**
- Ensure @2x variants are double the size (e.g., 280×280 for 140×140)
- Check `srcSet` is using correct file names

