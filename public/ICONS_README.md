# PWA Icons Instructions

Your app needs these icon files in the `/public` directory:

## Required Files
- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels

## Quick Solution: Generate with Favicon.io

1. Visit: https://favicon.io/favicon-generator/
2. Settings:
   - Text: **DC**
   - Background: **Rounded** 
   - Font Family: **Roboto Bold**
   - Font Size: **110**
   - Background Color: **#3b82f6** (blue)
   - Font Color: **#ffffff** (white)

3. Download the generated package
4. Extract and copy:
   - `android-chrome-192x192.png` → rename to `icon-192.png`
   - `android-chrome-512x512.png` → rename to `icon-512.png`
5. Place both in `/public/` directory

## Alternative: Use Design Tool

Create 512x512 PNG with:
- Blue background (#3b82f6)
- White "DC" text (DineCircle initials)
- Export as icon-512.png
- Resize to 192x192 and save as icon-192.png

## Temporary Placeholder (Development Only)

For now, you can create simple colored squares:
```bash
# Install ImageMagick if needed: brew install imagemagick
convert -size 192x192 xc:#3b82f6 icon-192.png
convert -size 512x512 xc:#3b82f6 icon-512.png
```

Then add text using any image editor.
