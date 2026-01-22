# PWA Icons Required

To enable PWA functionality, you need to create two icon files:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

## Generate Icons

Use one of these tools:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://www.favicon-generator.org/

## Quick Generation

1. Create a square logo/image (at least 512x512)
2. Upload to one of the tools above
3. Download the generated icons
4. Place them in this directory (`usher/public/`)

## Icon Requirements

- Format: PNG
- Sizes: 192x192 and 512x512
- Purpose: "any maskable" (works on all devices)
- Background: Transparent or solid color

## After Adding Icons

1. Rebuild the app: `npm run build`
2. Deploy to production (PWA only works on HTTPS)
3. Test on mobile device - should see "Add to Home Screen" option
