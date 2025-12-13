#!/usr/bin/env node

/**
 * Icon Generator Script for Currency Converter Extension
 *
 * This script converts the SVG icon to required PNG sizes
 * Usage: node generate-icons.js
 *
 * Requirements: npm install sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

      await sharp(INPUT_SVG, { density: 300 })
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);

      console.log(`✅ Generated icon-${size}.png`);
    }

    console.log('\n🎉 All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
