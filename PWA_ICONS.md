# PWA Icons Setup

The app requires PWA icons for installation. Currently, the app uses the default Vite logo as a placeholder.

## To Add Proper Icons:

1. Create two PNG images:
   - `public/pwa-192x192.png` (192x192 pixels)
   - `public/pwa-512x512.png` (512x512 pixels)

2. Update `vite.config.ts` to reference these icons:

```typescript
icons: [
  {
    src: 'pwa-192x192.png',
    sizes: '192x192',
    type: 'image/png'
  },
  {
    src: 'pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png'
  },
  {
    src: 'pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any maskable'
  }
]
```

## Icon Design Recommendations:

- Use the Achievement Wallet logo or award badge design
- Ensure icons are recognizable at small sizes
- Use the theme color (#1E40AF) as the primary color
- Icons should have transparent backgrounds or solid color backgrounds

## Quick Icon Generation:

You can use online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://favicon.io/

Or design tools like Figma, Canva, or Photoshop.

