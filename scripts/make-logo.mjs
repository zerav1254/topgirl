// Render PNG logo dari app/icon.svg (sumber mark). Jalankan: npm run logo
// Output: app/apple-icon.png (180), app/opengraph-image.png (1200x630),
// app/twitter-image.png (512). Font OG memakai font sistem (DejaVu), bukan
// Sora/Inter — OG card tidak memuat webfont.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const svg = await readFile(new URL("../app/icon.svg", import.meta.url), "utf8");
const markup = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const out = (name) => fileURLToPath(new URL(`../app/${name}`, import.meta.url));

// Kartu OG: tile 220px (skala 220/64) + teks.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="r" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 63) scale(900 560)">
      <stop offset="0" stop-color="#dc2626" stop-opacity=".18"/><stop offset="1" stop-color="#dc2626" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1080 0) scale(700 440)">
      <stop offset="0" stop-color="#fbbf24" stop-opacity=".1"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0b0b0f"/>
  <rect width="1200" height="630" fill="url(#r)"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(90 250) scale(${220 / 64})">${markup}</g>
  <text x="370" y="255" font-family="DejaVu Sans, sans-serif" font-size="26" font-weight="bold" letter-spacing="6" fill="#fbbf24">FAN SITE</text>
  <text x="370" y="330" font-family="DejaVu Sans, sans-serif" font-size="64" font-weight="bold" fill="#f4f4f5">TopGirl Team Builder</text>
  <text x="370" y="384" font-family="DejaVu Sans, sans-serif" font-size="30" fill="#a1a1aa">Unofficial fan site — not affiliated with A3Games</text>
</svg>`;

// Kartu twitter summary = persegi; tile penuh 512 (skala 8).
const square = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="#0b0b0f"/>
  <g transform="translate(64 64) scale(6)">${markup}</g>
</svg>`;

await sharp(Buffer.from(og)).png().toFile(out("opengraph-image.png"));
await sharp(Buffer.from(square)).png().toFile(out("twitter-image.png"));
// density tinggi supaya rasterisasi svg 180px dari viewBox 64 tajam.
await sharp(Buffer.from(svg), { density: 96 * (180 / 64) })
  .resize(180, 180)
  .png()
  .toFile(out("apple-icon.png"));
console.log("logo png dirender");
