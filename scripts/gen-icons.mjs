/* Renders the Orbit app icon to the PNG sizes PWAs need, using the
 * preinstalled Playwright Chromium. Run once: `node scripts/gen-icons.mjs`. */
import { chromium } from "@playwright/test";
import fs from "node:fs";

// maskable icons need the artwork inside the inner 80% "safe zone".
const svg = (size, { rounded, safeZone }) => {
  const s = size;
  const pad = safeZone ? s * 0.1 : 0;
  const inner = s - pad * 2;
  const radius = rounded ? inner * 0.2266 : 0;
  return `<!doctype html><html><body style="margin:0">
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  ${safeZone ? `<rect width="${s}" height="${s}" fill="#0a1030"/>` : ""}
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a84ff"/>
      <stop offset="100%" stop-color="#5e5ce6"/>
    </linearGradient>
  </defs>
  <g transform="translate(${pad},${pad})">
    <rect width="${inner}" height="${inner}" rx="${radius}" fill="url(#bg)"/>
    <circle cx="${inner / 2}" cy="${inner / 2}" r="${inner * 0.109}" fill="#fff"/>
    <ellipse cx="${inner / 2}" cy="${inner / 2}" rx="${inner * 0.3125}" ry="${inner * 0.3125}"
      fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="${inner * 0.039}"/>
    <circle cx="${inner * 0.7266}" cy="${inner * 0.2891}" r="${inner * 0.0703}" fill="#fff"/>
  </g>
</svg></body></html>`;
};

const targets = [
  { file: "public/icons/icon-192.png", size: 192, rounded: false, safeZone: false },
  { file: "public/icons/icon-512.png", size: 512, rounded: false, safeZone: false },
  { file: "public/icons/icon-maskable-512.png", size: 512, rounded: false, safeZone: true },
  { file: "public/icons/apple-touch-icon.png", size: 180, rounded: false, safeZone: false },
];

fs.mkdirSync("public/icons", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
});
const page = await browser.newPage();
for (const target of targets) {
  await page.setViewportSize({ width: target.size, height: target.size });
  await page.setContent(svg(target.size, target));
  await page.screenshot({
    path: target.file,
    clip: { x: 0, y: 0, width: target.size, height: target.size },
  });
  console.log("wrote", target.file);
}
await browser.close();
