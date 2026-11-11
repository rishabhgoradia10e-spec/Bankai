# BANKAI — 3D Sonic & Solar System Odyssey

An interactive browser-based 3D experience built with Three.js, Web Audio API, Tailwind CSS, and Lucide icons.

## Celestial Stations

- **Station 00**: Crystal Singularity (Core geometry morphing, procedural rings, particle nebula)
- **Station 01**: The Sun (NASA SDO photosphere, smooth solar lighting, full-screen deep space background)
- **Station 02**: Earth (Realistic surface, atmospheric cyan-blue limb glow, dynamic cloud layer)
- **Station 03**: The Moon (Authentic near-side lunar perspective, soft lunar radiance glow)
- **Station 04**: Jupiter (Detailed orange, cream, and brown bands, clearly visible Great Red Spot, atmospheric glow)

## Project Structure

- `index.html` — Responsive semantic interface with safe-area support for mobile, tablet, and desktop
- `css/styles.css` — Consolidated glassmorphism styling, animations, and responsive media queries
- `js/audio.js` — Senya Web Audio engine, synthesized harmonic resonances, and global application state
- `js/animations.js` — Dark Obsidian intro eclipse canvas, Three.js 3D scene, materials, and lighting
- `js/main.js` — Camera framing, unified planet rotation, touch/mouse controls, and 60FPS render loop
- `assets/audio/` — Soundtrack assets (`senya-theme.mp3`)
- `assets/images/` — Textures, space backgrounds, atmospheric glow sprites, and emblem logo
- `libraries/libraries-manifest.json` — External CDN library manifests (Three.js r128, Tailwind CSS, Lucide)
- `package.json` — Local development scripts
- `START_WEBSITE.bat` — One-click launcher for Windows

## Run Locally

Requires Node.js:

```bash
npm install
npm run dev
```

Then open `http://localhost:5500` in any modern web browser.

Alternatively:

```bash
npm start
```
