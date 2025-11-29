# Icon Assets - Story 5.4

## Required Icons

This directory should contain the following icon files for SEO and PWA support:

- **favicon.ico** (16x16, 32x32, 48x48 multi-resolution ICO file)
- **apple-touch-icon.png** (180x180 PNG for iOS home screen)
- **icon-192.png** (192x192 PNG for PWA manifest)
- **icon-512.png** (512x512 PNG for PWA manifest)

## Current Status

**Placeholder SVG**: `icon.svg` - Base design for icon generation

The SVG icon features:
- Blue background (#1DA1F2 - Twitter/X blue for brand consistency)
- Calendar icon with number "6" (representing GTA 6)
- Gold question mark (representing prediction uncertainty)

## How to Generate Icons

You can generate the required icon formats using tools like:

1. **ImageMagick** (command-line):
   ```bash
   # Generate PNGs from SVG
   convert icon.svg -resize 192x192 icon-192.png
   convert icon.svg -resize 512x512 icon-512.png
   convert icon.svg -resize 180x180 apple-touch-icon.png

   # Generate multi-resolution favicon.ico
   convert icon.svg -resize 16x16 favicon-16.png
   convert icon.svg -resize 32x32 favicon-32.png
   convert icon.svg -resize 48x48 favicon-48.png
   convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
   ```

2. **Online Tools**:
   - [RealFaviconGenerator.net](https://realfavicongenerator.net/)
   - [Favicon.io](https://favicon.io/)
   - [Cloudconvert.com](https://cloudconvert.com/svg-to-ico)

3. **Design Tools** (Figma, Sketch, Adobe Illustrator):
   - Export SVG to PNG at required sizes
   - Use ICO converter for favicon.ico

## Notes

- Icons should use the GTA 6 brand colors where possible
- Ensure readability at small sizes (16x16 for favicon)
- Test favicon in both light and dark browser themes
- Apple Touch Icon should have no transparency (solid background)

## Testing

After generating icons, test:
- Favicon displays correctly in browser tabs
- Apple Touch Icon shows on iOS home screen
- PWA icons render correctly in manifest
- Icons are < 10KB each for optimal performance
