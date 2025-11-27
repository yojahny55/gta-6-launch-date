# Open Graph Images

## og-image.svg
Source SVG file for the Open Graph social preview image.

**Specifications:**
- Dimensions: 1200x630px (1.91:1 aspect ratio)
- Format: SVG (vector, scalable)
- Fallback: PNG version recommended for maximum compatibility

## Converting to PNG

To generate PNG from SVG for production use:

```bash
# Using ImageMagick (if available)
convert -background none -size 1200x630 og-image.svg og-image.png

# Using Inkscape (if available)
inkscape og-image.svg --export-type=png --export-filename=og-image.png --export-width=1200

# Using online tool
# Upload og-image.svg to https://cloudconvert.com/svg-to-png
# Set width to 1200px, height to 630px
```

## Notes

**Story 5.3 Requirements:**
- Image must be 1200x630px (optimal for all social platforms)
- File size should be < 1MB (< 300KB recommended)
- Supported formats: PNG or JPG (PNG preferred for text/graphics)
- Hosted on same domain for security

**Current Implementation:**
- SVG version is functional and works with most social platforms
- SVG has advantage of small file size (~2KB) and infinite scalability
- If PNG is required, convert using above commands

**Testing:**
- Test with Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Test with Twitter Card Validator: https://cards-dev.twitter.com/validator
- Verify image renders correctly in preview cards
