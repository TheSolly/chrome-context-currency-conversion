#!/usr/bin/env node

/**
 * Icon Generator Script for Currency Converter Extension
 *
 * This script converts the SVG icon to required PNG sizes
 * Usage: node generate-icons.js
 *
 * Requirements: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [16, 32, 48, 128];
const INPUT_SVG = path.join(__dirname, 'icon.svg');

async function generateIcons() {
  console.log('🎨 Generating Chrome extension icons...');

  // Check if input SVG exists
  if (!fs.existsSync(INPUT_SVG)) {
    console.error('❌ Error: icon.svg not found in assets/icons directory');
    process.exit(1);
  }

  try {
    // Generate each icon size
    for (const size of ICON_SIZES) {
      const outputPath = path.join(__dirname, `icon-${size}.png`);

      await sharp(INPUT_SVG)
        .resize(size, size)
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);

      console.log(`✅ Generated icon-${size}.png`);
    }

    console.log('\n🎉 All icons generated successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Update manifest.json to include icon references');
    console.log('   2. Test extension loading in Chrome');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\n💡 Make sure you have installed sharp:');
    console.log('   npm install sharp');
    process.exit(1);
  }
}

// Add package.json check and instructions
function checkDependencies() {
  try {
    require('sharp');
    return true;
  } catch {
    console.log('📦 Installing required dependency...');
    console.log('Run: npm install sharp');
    console.log('Then run this script again: node generate-icons.js');
    return false;
  }
}

if (checkDependencies()) {
  generateIcons();
}
