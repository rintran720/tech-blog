/**
 * Generate PNG icons from SVG using sharp (lightweight alternative to canvas)
 * Install: npm install sharp
 * Run: node scripts/generate-png-icons.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "..", "public");

// Simple SVG template for icons
const createSVGIcon = (size, text = "B") => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000" rx="${size * 0.2}"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.6}" 
    font-weight="bold" 
    fill="#ffffff" 
    text-anchor="middle" 
    dominant-baseline="middle">${text}</text>
</svg>`;
};

// Try to use sharp, if not available, provide instructions
try {
  const sharp = await import("sharp");

  const sizes = [192, 512];

  for (const size of sizes) {
    const svg = createSVGIcon(size, "B");
    const svgBuffer = Buffer.from(svg);

    await sharp
      .default(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}x${size}.png`));

    console.log(`✅ Generated icon-${size}x${size}.png`);
  }

  console.log("\n🎉 All icons generated successfully!");
} catch (error) {
  console.log("⚠️  Sharp not installed. Using fallback method...\n");

  // Generate SVG files as fallback
  const sizes = [192, 512];

  for (const size of sizes) {
    const svg = createSVGIcon(size, "B");
    fs.writeFileSync(path.join(publicDir, `icon-${size}x${size}.svg`), svg);
  }

  console.log("✅ Generated SVG icons:");
  sizes.forEach((size) => {
    console.log(`   - icon-${size}x${size}.svg`);
  });

  console.log("\n📝 To generate PNG icons:");
  console.log("   1. Install sharp: npm install sharp");
  console.log(
    "   2. Run this script again: node scripts/generate-png-icons.mjs"
  );
  console.log("\n💡 Or use online converter:");
  console.log("   https://cloudconvert.com/svg-to-png");
  console.log("   Upload icon-192x192.svg and icon-512x512.svg");
}
