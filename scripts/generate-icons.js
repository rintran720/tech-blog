/**
 * Simple script to generate placeholder PWA icons
 * This creates simple PNG icons using Node.js and Canvas API
 *
 * Run: npm install canvas (or use online tool)
 * Or: node scripts/generate-icons.js
 */

const fs = require("fs");
const path = require("path");

// Simple approach: Create SVG icons and provide instructions for conversion
// Or use an online service to convert SVG to PNG

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

const publicDir = path.join(__dirname, "..", "public");

// Generate SVG icons
const icon192 = createSVGIcon(192, "B");
const icon512 = createSVGIcon(512, "B");

fs.writeFileSync(path.join(publicDir, "icon-192x192.svg"), icon192);
fs.writeFileSync(path.join(publicDir, "icon-512x512.svg"), icon512);

console.log("✅ Generated SVG icons:");
console.log("  - icon-192x192.svg");
console.log("  - icon-512x512.svg");
console.log("\n📝 Next steps:");
console.log("  1. Convert SVG to PNG using:");
console.log("     - Online: https://cloudconvert.com/svg-to-png");
console.log("     - Or install canvas: npm install canvas");
console.log(
  "  2. Save as icon-192x192.png and icon-512x512.png in public/ folder"
);
console.log("\n💡 Temporary solution:");
console.log("  Update manifest.json to use SVG icons or make icons optional");
