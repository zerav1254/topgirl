// Render PNG logo turunan dari public/logo.png (sumber logo, lihat DESIGN.md).
// Jalankan: npm run logo
// Output: app/apple-icon.png (180), app/opengraph-image.png (1200x630),
// app/twitter-image.png (512), app/icon.png (512). Font OG memakai font
// sistem (DejaVu), bukan Sora/Inter — OG card tidak memuat webfont.
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const src = fileURLToPath(new URL("../public/logo.png", import.meta.url));
const out = (name) => fileURLToPath(new URL(`../app/${name}`, import.meta.url));

const logo = await sharp(src).resize(512, 512).png({ compressionLevel: 9 }).toBuffer();
await sharp(logo).toFile(out("icon.png"));
await sharp(src).resize(180, 180).png().toFile(out("apple-icon.png"));
await sharp(logo).toFile(out("twitter-image.png"));

// Kartu OG: logo 220px + teks, aksen biru/silver satu palet dengan logo.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="b" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 63) scale(900 560)">
      <stop offset="0" stop-color="#25d3f8" stop-opacity=".14"/><stop offset="1" stop-color="#25d3f8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#050a14"/>
  <rect width="1200" height="630" fill="url(#b)"/>
  <text x="370" y="255" font-family="DejaVu Sans, sans-serif" font-size="26" font-weight="bold" letter-spacing="6" fill="#25d3f8">FAN SITE</text>
  <text x="370" y="330" font-family="DejaVu Sans, sans-serif" font-size="64" font-weight="bold" fill="#f4f4f5">TopGirl Team Builder</text>
  <text x="370" y="384" font-family="DejaVu Sans, sans-serif" font-size="30" fill="#a1a1aa">Unofficial fan site — not affiliated with A3Games</text>
</svg>`;
await sharp(Buffer.from(og))
  .composite([{ input: await sharp(logo).resize(220, 220).png().toBuffer(), left: 90, top: 250 }])
  .png()
  .toFile(out("opengraph-image.png"));
console.log("logo png dirender");
