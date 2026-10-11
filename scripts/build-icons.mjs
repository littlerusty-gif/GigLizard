import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";

// Ensure transparent mascot exists
const mascotPath = "/tmp/hd_mascot_trans.png";
if (!fs.existsSync(mascotPath)) {
  console.error("Mascot source not found at /tmp/hd_mascot_trans.png");
  process.exit(1);
}

const mascotBase64 = fs.readFileSync(mascotPath).toString("base64");

function generateSvg(size) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <!-- Background of badge -->
    <radialGradient id="badgeBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0e2a1e"/>
      <stop offset="60%" stop-color="#061811"/>
      <stop offset="92%" stop-color="#020805"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    
    <!-- Emerald spotlight behind mascot -->
    <radialGradient id="mascotSpotlight" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.32"/>
      <stop offset="55%" stop-color="#059669" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Neon green stroke gradient -->
    <linearGradient id="neonStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6ee7b7"/>
      <stop offset="35%" stop-color="#10b981"/>
      <stop offset="70%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>

    <!-- Outer neon aura glow around perimeter -->
    <radialGradient id="outerAura" cx="50%" cy="50%" r="50%">
      <stop offset="78%" stop-color="#10b981" stop-opacity="0.55"/>
      <stop offset="87%" stop-color="#059669" stop-opacity="0.25"/>
      <stop offset="95%" stop-color="#047857" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#121212" stop-opacity="0"/>
    </radialGradient>

    <!-- Top arc for GIGLIZARD: radius 146 -->
    <path id="topArc" d="M 110,256 A 146,146 0 0,1 402,256" fill="none" />
    
    <!-- Bottom arc for THE ULTIMATE LIVE MUSIC STAGE DIRECTOR: radius 152 -->
    <path id="bottomArc" d="M 104,256 A 152,152 0 0,0 408,256" fill="none" />
  </defs>

  <!-- Canvas Solid Backdrop (#121212) -->
  <rect width="512" height="512" fill="#121212"/>

  <!-- Outer Neon Glow Perimeter Halo (Diameter 400px, comfortably inside Android safe zone 410px) -->
  <circle cx="256" cy="256" r="200" fill="url(#outerAura)"/>

  <!-- Outer Main Metallic Emerald Ring (Radius 175 = 350px diameter, exactly inside maskable safe zone) -->
  <circle cx="256" cy="256" r="175" fill="url(#badgeBg)" stroke="url(#neonStroke)" stroke-width="4.5"/>
  
  <!-- Outer Decorative Beaded / Dashed Ring -->
  <circle cx="256" cy="256" r="169" fill="none" stroke="#34d399" stroke-width="1.2" stroke-opacity="0.5" stroke-dasharray="3,3"/>

  <!-- Inner Concentric Boundary Ring separating text track from center -->
  <circle cx="256" cy="256" r="126" fill="none" stroke="#10b981" stroke-width="1.5" stroke-opacity="0.45"/>

  <!-- Inner Spotlight Glow -->
  <circle cx="256" cy="256" r="120" fill="url(#mascotSpotlight)"/>

  <!-- Top Arc Text: GIGLIZARD -->
  <text fill="#ffffff" font-family="Liberation Sans" font-weight="900" font-size="25" letter-spacing="4.5" text-anchor="middle">
    <textPath xlink:href="#topArc" startOffset="50%">GIGLIZARD</textPath>
  </text>

  <!-- Side Star Embellishments -->
  <path d="M 94,256 L 97.5,252.5 L 101,256 L 97.5,259.5 Z" fill="#34d399"/>
  <circle cx="97.5" cy="256" r="1.5" fill="#ffffff"/>
  
  <path d="M 411,256 L 414.5,252.5 L 418,256 L 414.5,259.5 Z" fill="#34d399"/>
  <circle cx="414.5" cy="256" r="1.5" fill="#ffffff"/>

  <!-- Bottom Arc Text: THE ULTIMATE LIVE MUSIC STAGE DIRECTOR -->
  <text fill="#a7f3d0" font-family="Liberation Sans" font-weight="bold" font-size="9.6" letter-spacing="1.2" text-anchor="middle">
    <textPath xlink:href="#bottomArc" startOffset="50%">THE ULTIMATE LIVE MUSIC STAGE DIRECTOR</textPath>
  </text>

  <!-- Center Lizard Mascot -->
  <image href="data:image/png;base64,${mascotBase64}" x="158" y="158" width="196" height="196" preserveAspectRatio="xMidYMid meet"/>

  <!-- Inner Accent Ring around Mascot -->
  <circle cx="256" cy="256" r="94" fill="none" stroke="#10b981" stroke-width="1" stroke-opacity="0.25"/>
</svg>
`;
}

const targets = [
  { file: "public/icon-512.png", size: 512 },
  { file: "public/icon-192.png", size: 192 },
  { file: "public/maskable-icon-512.png", size: 512 },
  { file: "public/maskable-icon-192.png", size: 192 },
  { file: "public/favicon.png", size: 128 },
];

targets.forEach(({ file, size }) => {
  const svg = generateSvg(size);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    font: { loadSystemFonts: true, defaultFontFamily: "Liberation Sans" }
  });
  const pngData = resvg.render().asPng();
  fs.writeFileSync(path.resolve(process.cwd(), file), pngData);
  console.log(`Generated ${file} (${size}x${size}) - ${pngData.length} bytes`);
});

// Also save an standalone high-res SVG for splash screen component
fs.writeFileSync(path.resolve(process.cwd(), "public/giglizard_emblem.svg"), generateSvg(512));
console.log("Generated public/giglizard_emblem.svg");
