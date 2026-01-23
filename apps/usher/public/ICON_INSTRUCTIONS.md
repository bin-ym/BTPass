# PWA Icon Generation Instructions

The PWA requires `icon-192.png` and `icon-512.png` files in the `public` folder.

## Quick Solution: Use the Icon Generator

1. Open `public/icon-generator.html` in your browser
2. Click "Generate 192x192 Icon" - it will download `icon-192.png`
3. Click "Generate 512x512 Icon" - it will download `icon-512.png`
4. Move both files to the `public` folder (they should already be there after download)

## Alternative: Online Tools

You can also use these online tools to generate the icons:

1. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Upload a logo/image
   - Download the generated icons
   - Place `icon-192.png` and `icon-512.png` in the `public` folder

2. **PWA Asset Generator**: https://github.com/onderceylan/pwa-asset-generator
   - Install: `npm install -g pwa-asset-generator`
   - Run: `pwa-asset-generator your-logo.png public/`

## Manual Creation

If you prefer to create them manually:
- Create two PNG files: 192x192 pixels and 512x512 pixels
- Use black background (#000000) with white "BT" text
- Save as `icon-192.png` and `icon-512.png` in the `public` folder

## After Creating Icons

Once the icons are in place, the PWA will work correctly and pass PWA Builder validation.
