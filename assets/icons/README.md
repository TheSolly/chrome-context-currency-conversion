# Extension Icons

This folder contains the icons for the Currency Converter Chrome extension.

## Current Status

- ✅ SVG source icon created (`icon.svg`)
- ⏳ PNG icons needed for Chrome extension

## Required PNG Icons

Chrome extensions require PNG icons in the following sizes:

- `icon-16.png` - 16x16 pixels (toolbar icon)
- `icon-32.png` - 32x32 pixels (Windows taskbar)
- `icon-48.png` - 48x48 pixels (extension management page)
- `icon-128.png` - 128x128 pixels (Chrome Web Store)

## How to Generate PNG Icons

### Option 1: Using Online Converter

1. Upload `icon.svg` to an online SVG to PNG converter like:
   - https://convertio.co/svg-png/
   - https://cloudconvert.com/svg-to-png
2. Convert to each required size (16x16, 32x32, 48x48, 128x128)
3. Download and save as the appropriate filenames

### Option 2: Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Install ImageMagick first (macOS with Homebrew)
brew install imagemagick

# Convert SVG to PNG in different sizes
magick icon.svg -resize 16x16 icon-16.png
magick icon.svg -resize 32x32 icon-32.png
magick icon.svg -resize 48x48 icon-48.png
magick icon.svg -resize 128x128 icon-128.png
```

### Option 3: Using Inkscape (Command Line)

If you have Inkscape installed:

```bash
# Install Inkscape first
# On macOS: brew install inkscape

# Convert using Inkscape
inkscape icon.svg --export-png=icon-16.png --export-width=16 --export-height=16
inkscape icon.svg --export-png=icon-32.png --export-width=32 --export-height=32
inkscape icon.svg --export-png=icon-48.png --export-width=48 --export-height=48
inkscape icon.svg --export-png=icon-128.png --export-width=128 --export-height=128
```

### Option 4: Using Node.js Script

Run the provided script if you have Node.js:

```bash
npm install sharp
node generate-icons.js
```

## Design Notes

The icon features:

- Gradient blue background (#667eea to #764ba2)
- Multiple currency symbols ($, €, ¥, £)
- Conversion arrow indicating the extension's purpose
- Clean, modern design suitable for both light and dark themes

## After Creating Icons

Once you have the PNG files:

1. Place them in this folder with the correct names
2. Update `manifest.json` to include the icon references
3. Test the extension loading in Chrome

## Temporary Solution

For immediate testing, you can:

1. Keep icons commented out in manifest.json
2. Chrome will use a default extension icon
3. Add proper icons later for production release
