/**************************************************************
 * 0. 1ST PAGE DARK OBSIDIAN ECLIPSE & TWINKLING STARFIELD
 **************************************************************/
const introCanvas = document.getElementById('eclipse-intro-canvas');
const introCtx = introCanvas.getContext('2d');
let introActive = true;
let introMouseX = 0;
let introMouseY = 0;

function resizeIntroCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    introCanvas.width = window.innerWidth * dpr;
    introCanvas.height = window.innerHeight * dpr;
    introCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeIntroCanvas();
window.addEventListener('resize', resizeIntroCanvas);

window.addEventListener('mousemove', (e) => {
    introMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    introMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
        introMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
        introMouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    }
}, { passive: true });

const introStars = Array.from({ length: 580 }, () => {
    const isBright = Math.random() < 0.16;
    return {
        x: Math.random(),
        y: Math.random(),
        r: isBright ? Math.random() * 1.6 + 0.9 : Math.random() * 1.15 + 0.25,
        alpha: isBright ? Math.random() * 0.55 + 0.35 : Math.random() * 0.45 + 0.08,
        twinkleSpeed: Math.random() * 2.8 + 0.6,
        phase: Math.random() * Math.PI * 2,
        glint: isBright
    };
});

const introConstellations = [
    [[0.55, 0.14], [0.60, 0.19], [0.64, 0.12], [0.69, 0.22]],
    [[0.68, 0.36], [0.74, 0.32], [0.79, 0.26], [0.85, 0.28], [0.89, 0.22]],
    [[0.34, 0.65], [0.37, 0.73], [0.42, 0.66], [0.34, 0.65]],
    [[0.16, 0.24], [0.22, 0.19], [0.27, 0.25]]
];

const introPlanets = [
    { rx: 215, ry: 86, tilt: -0.22, angle: 2.85, speed: 0.0014, r: 17, hasRing: false },  // left inner
    { rx: 345, ry: 135, tilt: -0.22, angle: 2.52, speed: 0.0009, r: 27, hasRing: false }, // left outer (large, glowing)
    { rx: 215, ry: 86, tilt: -0.22, angle: 0.65, speed: 0.0015, r: 14, hasRing: false },  // right inner
    { rx: 330, ry: 130, tilt: -0.22, angle: 6.05, speed: 0.0010, r: 21, hasRing: true }   // right outer (with tilted glowing ring)
];


function drawEclipsedSphere(ctx, x, y, radius, lightAngle = 0.2, isMainCore = false) {
    ctx.save();

    // 1. Luminous multi-tier atmosphere / corona bloom
    const glowR = radius * (isMainCore ? 2.6 : 1.75);
    const glowGrad = ctx.createRadialGradient(
        x + Math.cos(lightAngle) * (radius * 0.35),
        y + Math.sin(lightAngle) * (radius * 0.35),
        radius * 0.75,
        x,
        y,
        glowR
    );
    glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
    glowGrad.addColorStop(0.28, 'rgba(230, 242, 255, 0.35)');
    glowGrad.addColorStop(0.65, 'rgba(148, 175, 215, 0.09)');
    glowGrad.addColorStop(1, 'rgba(2, 3, 6, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // 2. Planet body (dark core with subtle 3D limb gradient)
    const bodyGrad = ctx.createRadialGradient(
        x - Math.cos(lightAngle) * (radius * 0.25),
        y - Math.sin(lightAngle) * (radius * 0.25),
        radius * 0.05,
        x,
        y,
        radius
    );
    bodyGrad.addColorStop(0, '#020306');
    bodyGrad.addColorStop(0.80, '#050812');
    bodyGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Glowing White-Hot Rim Stroke with Intense Bloom & Radiant Shine
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 1.0)';
    ctx.shadowBlur = Math.max(8, radius * 0.58);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isMainCore ? 2.8 : 2.0;
    ctx.beginPath();
    ctx.arc(x, y, radius, lightAngle - 1.35, lightAngle + 1.35);
    ctx.stroke();

    // Second pass for intense hot center of the rim
    ctx.shadowBlur = Math.max(3, radius * 0.22);
    ctx.lineWidth = isMainCore ? 1.6 : 1.1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.stroke();
    ctx.restore();

    ctx.restore();
}

function renderIntroLoop(timestamp) {
    if (!introActive) return;
    requestAnimationFrame(renderIntroLoop);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const t = (timestamp || performance.now()) * 0.001;

    introCtx.fillStyle = '#020306';
    introCtx.fillRect(0, 0, w, h);

    const isMobilePortrait = (w < 640 && h > w);
    const cx = (w >= 860 ? w * 0.72 : w * 0.50) + introMouseX * 12;
    const cy = isMobilePortrait ? (h * 0.36 + introMouseY * 8) : (h * 0.44 + introMouseY * 10);
    const scale = Math.min(w / 1280, h / 760);
    const s = isMobilePortrait ? Math.max(0.42, Math.min(0.68, scale * 1.35)) : Math.max(0.60, Math.min(1.22, scale));

    // 1. Twinkling Background Starfield
    introStars.forEach((st) => {
        const sx = st.x * w - introMouseX * 8;
        const sy = st.y * h - introMouseY * 8;
        const osc = 0.5 + 0.5 * Math.sin(t * st.twinkleSpeed + st.phase);
        const a = st.alpha * (0.35 + 0.85 * osc);

        introCtx.fillStyle = `rgba(235, 242, 255, ${Math.min(1, a)})`;
        introCtx.beginPath();
        introCtx.arc(sx, sy, st.r, 0, Math.PI * 2);
        introCtx.fill();

        if (st.glint && osc > 0.72) {
            const glintLen = st.r * (2.6 + osc * 2.2);
            introCtx.strokeStyle = `rgba(226, 232, 240, ${(osc - 0.65) * 0.75})`;
            introCtx.lineWidth = 0.65;
            introCtx.beginPath();
            introCtx.moveTo(sx - glintLen, sy);
            introCtx.lineTo(sx + glintLen, sy);
            introCtx.moveTo(sx, sy - glintLen);
            introCtx.lineTo(sx, sy + glintLen);
            introCtx.stroke();
        }
    });

    // 2. Constellation Lines & Glowing Nodes
    introConstellations.forEach((poly) => {
        introCtx.save();
        introCtx.strokeStyle = 'rgba(180, 205, 235, 0.32)';
        introCtx.lineWidth = 0.85;
        introCtx.beginPath();
        poly.forEach((pt, idx) => {
            const px = pt[0] * w + introMouseX * 6;
            const py = pt[1] * h + introMouseY * 6;
            if (idx === 0) introCtx.moveTo(px, py);
            else introCtx.lineTo(px, py);
        });
        introCtx.stroke();

        poly.forEach((pt) => {
            const px = pt[0] * w + introMouseX * 6;
            const py = pt[1] * h + introMouseY * 6;
            introCtx.shadowColor = 'rgba(255, 255, 255, 0.95)';
            introCtx.shadowBlur = 8;
            introCtx.fillStyle = '#ffffff';
            introCtx.beginPath();
            introCtx.arc(px, py, 2.2, 0, Math.PI * 2);
            introCtx.fill();
        });
        introCtx.restore();
    });

    // 3. Outer Planetary Elliptical Orbits with Subtle Luminous Glow
    [195, 245, 320, 390, 450].forEach((rx, idx) => {
        const ry = rx * 0.39;
        introCtx.save();
        introCtx.translate(cx, cy);
        introCtx.rotate(-0.22);
        introCtx.shadowColor = 'rgba(200, 220, 255, 0.35)';
        introCtx.shadowBlur = idx === 2 ? 6 * s : 3 * s;
        introCtx.strokeStyle = idx % 2 === 0 ? 'rgba(226, 235, 245, 0.35)' : 'rgba(160, 185, 215, 0.20)';
        introCtx.lineWidth = idx === 2 ? 1.35 : 0.85;
        introCtx.beginPath();
        introCtx.ellipse(0, 0, rx * s, ry * s, 0, 0, Math.PI * 2);
        introCtx.stroke();
        introCtx.restore();
    });

    // 4. Multi-Axis Gyroscope Rings Around the Central Black Singularity (Metallic Shine)
    const gyroRings = [
        { rx: 142, ry: 128, rot: t * 0.14 + 0.3, alpha: 0.38, width: 1.35 },
        { rx: 154, ry: 112, rot: -t * 0.11 + 1.1, alpha: 0.30, width: 1.1 },
        { rx: 166, ry: 136, rot: t * 0.08 + 2.2, alpha: 0.25, width: 0.95 },
        { rx: 130, ry: 148, rot: -t * 0.16 + 0.7, alpha: 0.42, width: 1.45 }
    ];

    gyroRings.forEach((gr) => {
        introCtx.save();
        introCtx.translate(cx, cy);
        introCtx.rotate(gr.rot);
        introCtx.shadowColor = 'rgba(235, 245, 255, 0.60)';
        introCtx.shadowBlur = 8 * s;
        introCtx.strokeStyle = `rgba(240, 246, 255, ${gr.alpha * 1.35})`;
        introCtx.lineWidth = gr.width;
        introCtx.beginPath();
        introCtx.ellipse(0, 0, gr.rx * s, gr.ry * s, 0, 0, Math.PI * 2);
        introCtx.stroke();
        introCtx.restore();
    });

    // 5. Central Eclipsed Black Hole Singularity with Balanced Silver Corona Shine
    const coreRadius = 82 * s;

    // 5A. Soft Ambient Silver Corona
    const outerCorona = introCtx.createRadialGradient(cx, cy, coreRadius * 0.82, cx, cy, coreRadius * 2.15);
    outerCorona.addColorStop(0, 'rgba(240, 246, 255, 0.48)');
    outerCorona.addColorStop(0.25, 'rgba(210, 228, 250, 0.20)');
    outerCorona.addColorStop(0.55, 'rgba(120, 150, 190, 0.05)');
    outerCorona.addColorStop(1, 'rgba(2, 3, 6, 0)');
    introCtx.fillStyle = outerCorona;
    introCtx.beginPath();
    introCtx.arc(cx, cy, coreRadius * 2.15, 0, Math.PI * 2);
    introCtx.fill();

    // 5B. Central Dark Obsidian Sphere Body
    drawEclipsedSphere(introCtx, cx, cy, coreRadius, -0.65, true);

    // 5C. Refined Silver Crescent Rim on the Big Circle
    introCtx.save();
    introCtx.shadowColor = 'rgba(226, 238, 255, 0.75)';
    introCtx.shadowBlur = 10 * s;
    introCtx.strokeStyle = 'rgba(245, 250, 255, 0.88)';
    introCtx.lineWidth = 1.8 * s;
    introCtx.beginPath();
    introCtx.arc(cx, cy, coreRadius, -1.25, 1.25);
    introCtx.stroke();
    introCtx.restore();

    // 6. Orbiting Obsidian Eclipsed Planets (matching reference layout & shine)
    introPlanets.forEach((p) => {
        p.angle += p.speed;
        const cosA = Math.cos(p.angle) * p.rx * s;
        const sinA = Math.sin(p.angle) * p.ry * s;
        const cosT = Math.cos(p.tilt);
        const sinT = Math.sin(p.tilt);
        const px = cx + (cosA * cosT - sinA * sinT);
        const py = cy + (cosA * sinT + sinA * cosT);
        const pr = p.r * s;

        if (p.hasRing) {
            introCtx.save();
            introCtx.translate(px, py);
            introCtx.rotate(-0.35);
            introCtx.shadowColor = 'rgba(255, 255, 255, 0.95)';
            introCtx.shadowBlur = 10 * s;
            introCtx.strokeStyle = 'rgba(240, 248, 255, 0.92)';
            introCtx.lineWidth = 2.2 * s;
            introCtx.beginPath();
            introCtx.ellipse(0, 0, pr * 2.15, pr * 0.52, 0, 0, Math.PI * 2);
            introCtx.stroke();
            introCtx.restore();
        }

        const angleToCenter = Math.atan2(cy - py, cx - px);
        drawEclipsedSphere(introCtx, px, py, pr, angleToCenter);
    });
}
requestAnimationFrame(renderIntroLoop);

/**************************************************************
 * 3. THREE.JS 3D SCENE (CRYSTAL SINGULARITY + SOLAR SYSTEM)
 **************************************************************/
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03050c, 0.012);

function getResponsiveBaseCameraDistance(aspect) {
    if (aspect >= 1.55) return 12.0;
    if (aspect >= 1.2) return 12.0 + (1.55 - aspect) * 4.5;
    // For mobile portrait & portrait tablets (aspect < 1.2):
    // Target comfortable visible width (13.8) so Jupiter (diameter 7.5) occupies ~54-58% of screen width
    const targetVW = 13.8;
    const tanHalfFov = Math.tan((55 * Math.PI) / 360);
    const neededZ = targetVW / (2 * tanHalfFov * aspect);
    return Math.max(12.0, Math.min(27.0, neededZ));
}
if (typeof window !== 'undefined') {
    window.getResponsiveBaseCameraDistance = getResponsiveBaseCameraDistance;
}

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
STATE.baseCameraDistance = getResponsiveBaseCameraDistance(camera.aspect);
STATE.cameraDistance = STATE.baseCameraDistance;
camera.position.set(0, 0, STATE.cameraDistance);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(THEMES.cyber.primary, 4.5, 45);
pointLight1.position.set(6, 6, 6);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(THEMES.cyber.secondary, 4.5, 45);
pointLight2.position.set(-6, -5, 5);
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(THEMES.cyber.accent, 3.0, 45);
pointLight3.position.set(0, 7, -6);
scene.add(pointLight3);

// Station 00: Main World Group (Crystal Core at x = 0)
const worldGroup = new THREE.Group();
scene.add(worldGroup);

let coreMesh = null;
let wireMesh = null;
let basePositions = null;

const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    emissive: THEMES.cyber.emissive,
    emissiveIntensity: 0.7,
    roughness: 0.15,
    metalness: 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    flatShading: true
});

const wireMaterial = new THREE.MeshBasicMaterial({
    color: THEMES.cyber.primary,
    wireframe: true,
    transparent: true,
    opacity: 0.45
});

function createGeometryByType(type) {
    switch (type) {
        case 'torus':
            return new THREE.TorusKnotGeometry(1.9, 0.55, 128, 24, 2, 3);
        case 'sphere':
            return new THREE.SphereGeometry(2.6, 48, 48);
        case 'octa':
            return new THREE.OctahedronGeometry(2.7, 3);
        case 'crystal':
        default:
            return new THREE.IcosahedronGeometry(2.6, 4);
    }
}

function buildCoreGeometry(type) {
    if (coreMesh) {
        worldGroup.remove(coreMesh);
        worldGroup.remove(wireMesh);
        coreMesh.geometry.dispose();
        wireMesh.geometry.dispose();
    }

    const geometry = createGeometryByType(type);
    const posAttr = geometry.attributes.position;
    basePositions = new Float32Array(posAttr.array.length);
    basePositions.set(posAttr.array);

    coreMesh = new THREE.Mesh(geometry, coreMaterial);
    coreMesh.userData.stationId = 0;
    wireMesh = new THREE.Mesh(geometry.clone(), wireMaterial);
    wireMesh.scale.setScalar(1.018);

    worldGroup.add(coreMesh);
    worldGroup.add(wireMesh);
}

buildCoreGeometry('crystal');

// Inner Glowing Energy Sphere inside Crystal Core
const innerCoreGeo = new THREE.SphereGeometry(1.25, 32, 32);
const innerCoreMat = new THREE.MeshBasicMaterial({
    color: THEMES.cyber.primary,
    transparent: true,
    opacity: 0.35
});
const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
worldGroup.add(innerCore);

// 3 Gyroscopic Energy Rings around Crystal Core
const ringsGroup = new THREE.Group();
worldGroup.add(ringsGroup);

const rings = [];
for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(3.6 + i * 0.75, 0.022, 16, 120);
    const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? THEMES.cyber.primary : THEMES.cyber.secondary,
        transparent: true,
        opacity: 0.45 - i * 0.1
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    ringsGroup.add(ring);
    rings.push(ring);
}

// Particle Nebula Field around Station 00
const PARTICLE_COUNT = 1200;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleColors = new Float32Array(PARTICLE_COUNT * 3);

const colorA = new THREE.Color(THEMES.cyber.primary);
const colorB = new THREE.Color(THEMES.cyber.secondary);

for (let i = 0; i < PARTICLE_COUNT; i++) {
    const radius = 5 + Math.random() * 24;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);

    const mixed = colorA.clone().lerp(colorB, Math.random());
    particleColors[i * 3] = mixed.r;
    particleColors[i * 3 + 1] = mixed.g;
    particleColors[i * 3 + 2] = mixed.b;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

function createParticleTexture() {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
}

const particleMat = new THREE.PointsMaterial({
    size: 0.16,
    map: createParticleTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const particleSystem = new THREE.Points(particleGeo, particleMat);
scene.add(particleSystem);

// Expanding Shockwave Ring on Click
const shockwaveGeo = new THREE.RingGeometry(0.1, 0.25, 64);
const shockwaveMat = new THREE.MeshBasicMaterial({
    color: THEMES.cyber.primary,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending
});
const shockwaveRing = new THREE.Mesh(shockwaveGeo, shockwaveMat);
scene.add(shockwaveRing);

/**************************************************************
 * 3B. FAST GPU-FRIENDLY 3D SOLAR SYSTEM (SUN, EARTH, MOON, JUPITER)
 **************************************************************/
const solarSystemGroup = new THREE.Group();
scene.add(solarSystemGroup);
const planetClickTargets = [];
const planetStations = {};

// Build Station 1: THE SUN (x = 38)
(function buildSunStation() {
    const xPos = 1 * STATE.stationSpacing;
    const group = new THREE.Group();
    group.position.set(xPos, 0, 0);
    solarSystemGroup.add(group);

    const textureLoader = new THREE.TextureLoader();

    // 1. Original Deep Cosmic Space & Fiery Orange-and-Black Nebula Background (Page 1 Sun)
    const sunBgTexture = textureLoader.load('assets/images/sun-space-bg.jpg');
    sunBgTexture.generateMipmaps = false;
    sunBgTexture.minFilter = THREE.LinearFilter;
    const sunBgMat = new THREE.SpriteMaterial({
        map: sunBgTexture,
        transparent: true,
        opacity: 0.0,
        blending: THREE.NormalBlending,
        depthWrite: false
    });
    const sunBgSprite = new THREE.Sprite(sunBgMat);
    sunBgSprite.position.set(0, 0, -6.0);
    sunBgSprite.renderOrder = -100;
    sunBgSprite.scale.set(45.0, 23.7, 1);
    group.add(sunBgSprite);

    // Sun Interactive Body Group (rotates and moves with cursor)
    const sunBody = new THREE.Group();
    group.add(sunBody);

    // 2. High-Definition Photographic NASA SDO Solar Surface
    const sunTexture = textureLoader.load('assets/images/sun-photosphere.jpg');
    sunTexture.wrapS = THREE.RepeatWrapping;
    sunTexture.wrapT = THREE.ClampToEdgeWrapping;
    sunTexture.anisotropy = 16;

    const sunGeo = new THREE.SphereGeometry(3.6, 72, 72);
    const sunMat = new THREE.MeshBasicMaterial({
        map: sunTexture
    });

    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.userData.stationId = 1;
    sunBody.add(sunMesh);
    planetClickTargets.push(sunMesh);

    // 3. Natural Warm Solar Point Light Illuminating Solar System
    const sunLight = new THREE.PointLight(0xff9416, 4.6, 90);
    sunBody.add(sunLight);

    planetStations[1] = {
        group,
        sunBody,
        mainMesh: sunMesh,
        sunBgSprite,
        sunLight
    };
})();

// Build Station 2: PLANET EARTH (x = 76)
(function buildEarthStation() {
    const xPos = 2 * STATE.stationSpacing;
    const group = new THREE.Group();
    group.position.set(xPos, 0, 0);
    solarSystemGroup.add(group);

    const textureLoader = new THREE.TextureLoader();

    // Blue Cosmic Space Background (Page 2 Earth Only)
    const earthBgTexture = textureLoader.load('assets/images/earth-space-bg.jpg');
    earthBgTexture.generateMipmaps = false;
    earthBgTexture.minFilter = THREE.LinearFilter;
    const earthBgMat = new THREE.SpriteMaterial({
        map: earthBgTexture,
        transparent: true,
        opacity: 0.0,
        blending: THREE.NormalBlending,
        depthWrite: false
    });
    const earthBgSprite = new THREE.Sprite(earthBgMat);
    earthBgSprite.position.set(0, 0, -6.0);
    earthBgSprite.renderOrder = -100;
    earthBgSprite.scale.set(45.0, 23.5, 1);
    group.add(earthBgSprite);

    // Earth Celestial Body Group with realistic axial tilt (23.4° = 0.41 rad)
    const earthBody = new THREE.Group();
    earthBody.rotation.z = 0.41;
    group.add(earthBody);

    // 1. High-Definition Photorealistic Global NASA Blue Marble Surface (2048x1024)
    const earthSurfaceTex = textureLoader.load('assets/images/earth-surface.jpg');
    earthSurfaceTex.wrapS = THREE.RepeatWrapping;
    earthSurfaceTex.wrapT = THREE.ClampToEdgeWrapping;
    earthSurfaceTex.anisotropy = 16;

    const earthGeo = new THREE.SphereGeometry(3.25, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
        map: earthSurfaceTex,
        roughness: 0.65,
        metalness: 0.08
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.userData.stationId = 2;
    earthMesh.rotation.y = -2.00;
    earthBody.add(earthMesh);
    planetClickTargets.push(earthMesh);

    // 2. Realistic Swirling White Meteorological Cloud Layer (2048x1024 RGBA)
    const earthCloudsTex = textureLoader.load('assets/images/earth-clouds.png');
    earthCloudsTex.wrapS = THREE.RepeatWrapping;
    earthCloudsTex.wrapT = THREE.ClampToEdgeWrapping;
    earthCloudsTex.anisotropy = 16;

    const cloudGeo = new THREE.SphereGeometry(3.28, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
        map: earthCloudsTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        roughness: 0.95,
        blending: THREE.NormalBlending
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.userData.stationId = 2;
    cloudMesh.rotation.y = -2.00;
    earthBody.add(cloudMesh);
    planetClickTargets.push(cloudMesh);

    // 3. Subtle Rayleigh Atmospheric Blue Rim Glow Sprite (Photographic atmospheric halo hugging curvature)
    const earthGlowTex = textureLoader.load('assets/images/earth-atmosphere.png');
    const earthGlowMat = new THREE.SpriteMaterial({
        map: earthGlowTex,
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.52,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const earthGlowSprite = new THREE.Sprite(earthGlowMat);
    earthGlowSprite.position.set(0, 0, -0.05);
    earthGlowSprite.scale.set(8.6, 8.6, 1);
    earthBody.add(earthGlowSprite);

    // 4. Ultra-thin Physical Orbital Horizon Haze Shell
    const atmoGeo = new THREE.SphereGeometry(3.32, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    atmoMesh.userData.stationId = 2;
    earthBody.add(atmoMesh);
    planetClickTargets.push(atmoMesh);

    // 5. Natural Sunlight Illuminating Earth from The Sun (x = 38 is to the west/left)
    const earthSunLight = new THREE.PointLight(0xfff5ea, 3.4, 60);
    earthSunLight.position.set(-16, 2, 8);
    group.add(earthSunLight);

    planetStations[2] = {
        group,
        earthBody,
        earthBgSprite,
        earthGlowSprite,
        mainMesh: earthMesh,
        cloudMesh,
        atmoMesh,
        earthSunLight
    };
})();

// Build Station 3: THE MOON (x = 114)
(function buildMoonStation() {
    const xPos = 3 * STATE.stationSpacing;
    const group = new THREE.Group();
    group.position.set(xPos, 0, 0);
    solarSystemGroup.add(group);

    const textureLoader = new THREE.TextureLoader();

    // 0. Immersive Night Sky Space Wallpaper Sprite (Station 3 Moon Page Only)
    const moonBgTex = textureLoader.load('assets/images/moon-space-bg.jpg');
    const moonBgMat = new THREE.SpriteMaterial({
        map: moonBgTex,
        transparent: true,
        opacity: 0.0,
        blending: THREE.NormalBlending,
        depthWrite: false
    });
    const moonBgSprite = new THREE.Sprite(moonBgMat);
    moonBgSprite.position.set(0, 0, -6.0);
    moonBgSprite.renderOrder = -100;
    moonBgSprite.scale.set(45.0, 27.5, 1);
    group.add(moonBgSprite);

    // Interactive Moon Body Group (rotates and moves with cursor)
    const moonBody = new THREE.Group();
    group.add(moonBody);

    // 1. High-Definition Photorealistic Global NASA Lunar Surface (2048x1024)
    const moonSurfaceTex = textureLoader.load('assets/images/moon-surface.jpg');
    moonSurfaceTex.wrapS = THREE.RepeatWrapping;
    moonSurfaceTex.wrapT = THREE.ClampToEdgeWrapping;
    moonSurfaceTex.anisotropy = 16;

    const moonGeo = new THREE.SphereGeometry(2.85, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
        map: moonSurfaceTex,
        roughness: 0.92,
        metalness: 0.0
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.userData.stationId = 3;
    // Default orientation: authentic near-side facing forward as in reference image (Tycho south, Crisium east)
    moonMesh.rotation.y = 4.7124;
    moonBody.add(moonMesh);
    planetClickTargets.push(moonMesh);

    // 2. Subtle Silvery Lunar Atmosphere & Moonlight Halo Sprite
    const moonGlowTex = textureLoader.load('assets/images/moon-glow.png');
    const moonGlowMat = new THREE.SpriteMaterial({
        map: moonGlowTex,
        color: 0xdde6f5,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const moonGlowSprite = new THREE.Sprite(moonGlowMat);
    moonGlowSprite.position.set(0, 0, -0.05);
    moonGlowSprite.scale.set(7.5, 7.5, 1);
    moonBody.add(moonGlowSprite);

    // 3. Natural Pure White Solar Illumination (matching full Moon reference image)
    const moonSunLight = new THREE.PointLight(0xffffff, 1.45, 90);
    moonSunLight.position.set(-6, 2, 16);
    group.add(moonSunLight);

    // Subtle neutral fill light illuminating eastern limb & craters naturally
    const moonFillLight = new THREE.PointLight(0xffffff, 0.35, 60);
    moonFillLight.position.set(8, -1, 14);
    group.add(moonFillLight);

    planetStations[3] = {
        group,
        moonBody,
        moonBgSprite,
        moonGlowSprite,
        mainMesh: moonMesh,
        moonSunLight,
        moonFillLight
    };
})();

// Build Station 4: JUPITER (x = 152)
(function buildJupiterStation() {
    const xPos = 4 * STATE.stationSpacing;
    const group = new THREE.Group();
    group.position.set(xPos, 0, 0);
    solarSystemGroup.add(group);

    const textureLoader = new THREE.TextureLoader();

    // Purple Cosmic Nebula Starfield Background (Page 4 Jupiter Only)
    const jupBgTexture = textureLoader.load('assets/images/jupiter-space-bg.jpg');
    jupBgTexture.generateMipmaps = false;
    jupBgTexture.minFilter = THREE.LinearFilter;
    const jupBgMat = new THREE.SpriteMaterial({
        map: jupBgTexture,
        transparent: true,
        opacity: 0.0,
        blending: THREE.NormalBlending,
        depthWrite: false
    });
    const jupBgSprite = new THREE.Sprite(jupBgMat);
    jupBgSprite.position.set(0, 0, -6.0);
    jupBgSprite.renderOrder = -100;
    jupBgSprite.scale.set(45.0, 26.8, 1);
    group.add(jupBgSprite);

    // Interactive Jupiter Body Group (rotates and moves with cursor)
    const jupBody = new THREE.Group();
    group.add(jupBody);

    // 1. High-Definition Photorealistic Jovian Cloud Bands with Prominent Great Red Spot (2048x1024)
    const jupTexture = textureLoader.load('assets/images/jupiter-surface.jpg');
    jupTexture.wrapS = THREE.RepeatWrapping;
    jupTexture.wrapT = THREE.ClampToEdgeWrapping;
    jupTexture.anisotropy = 16;

    const jupGeo = new THREE.SphereGeometry(3.75, 72, 72);
    const jupMat = new THREE.MeshStandardMaterial({
        map: jupTexture,
        roughness: 0.88,
        metalness: 0.02
    });
    const jupMesh = new THREE.Mesh(jupGeo, jupMat);
    // Subtle authentic Jovian axial tilt (3.13 deg = 0.054 rad)
    jupMesh.rotation.z = 0.054;
    jupMesh.userData.stationId = 4;
    jupBody.add(jupMesh);
    planetClickTargets.push(jupMesh);

    // 2. Subtle Luminous Atmospheric Rim Haze (Backside)
    const atmoGeo = new THREE.SphereGeometry(3.78, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
        color: 0xfbd38d,
        transparent: true,
        opacity: 0.16,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    jupBody.add(atmoMesh);

    // 3. Subtle Warm Golden-Amber Atmospheric Glow Halo Sprite
    const glowTex = textureLoader.load('assets/images/jupiter-atmosphere.png');
    const glowMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffe2b8,
        transparent: true,
        opacity: 0.48,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const jupGlowSprite = new THREE.Sprite(glowMat);
    jupGlowSprite.position.set(0, 0, -0.05);
    jupGlowSprite.scale.set(9.2, 9.2, 1);
    jupBody.add(jupGlowSprite);

    // 4. Natural Directional Sunlight from Inner Solar System (Sun at x = 38)
    const jupSunLight = new THREE.PointLight(0xfff5ea, 2.2, 120);
    jupSunLight.position.set(-18, 5, 14);
    group.add(jupSunLight);

    // Natural subtle cosmic fill light illuminating the night side
    const jupFillLight = new THREE.PointLight(0x403050, 0.75, 90);
    jupFillLight.position.set(15, -4, -10);
    group.add(jupFillLight);

    // Soft ambient illumination for cloud band depth
    const jupAmbientLight = new THREE.AmbientLight(0x281c20, 0.55);
    group.add(jupAmbientLight);

    planetStations[4] = {
        group,
        jupBody,
        jupBgSprite,
        mainMesh: jupMesh,
        atmoMesh,
        jupGlowSprite,
        jupSunLight,
        jupFillLight,
        jupAmbientLight
    };
})();

// Extended Cosmic Star Corridor Spanning All Stations
const CORRIDOR_STARS = 1100;
const corridorGeo = new THREE.BufferGeometry();
const corridorPos = new Float32Array(CORRIDOR_STARS * 3);
for (let i = 0; i < CORRIDOR_STARS; i++) {
    corridorPos[i * 3] = (Math.random() - 0.12) * (STATE.stationSpacing * 5.2);
    corridorPos[i * 3 + 1] = (Math.random() - 0.5) * 65;
    corridorPos[i * 3 + 2] = -8 - Math.random() * 55;
}
corridorGeo.setAttribute('position', new THREE.BufferAttribute(corridorPos, 3));
const corridorMat = new THREE.PointsMaterial({
    color: 0xe2e8f0,
    size: 0.15,
    map: createParticleTexture(),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const corridorStarSystem = new THREE.Points(corridorGeo, corridorMat);
scene.add(corridorStarSystem);