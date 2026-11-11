if (window.lucide) {
    lucide.createIcons();
}

// Station Navigation Controller
function warpToStation(index) {
    const clamped = Math.max(0, Math.min(SOLAR_STATIONS.length - 1, index));
    if (clamped === STATE.currentStation && Math.abs(STATE.targetCameraX - clamped * STATE.stationSpacing) < 0.1) return;

    STATE.currentStation = clamped;
    STATE.targetCameraX = clamped * STATE.stationSpacing;

    const st = SOLAR_STATIONS[clamped];
    const idxBadge = document.getElementById('station-index-badge');
    const titleEl = document.getElementById('station-title');
    const subEl = document.getElementById('station-subtitle');
    if (idxBadge) idxBadge.textContent = st.code;
    if (titleEl) titleEl.textContent = st.name;
    if (subEl) subEl.textContent = st.subtitle;

    document.querySelectorAll('.station-dot').forEach((btn) => {
        const sId = parseInt(btn.dataset.station, 10);
        btn.classList.toggle('active', sId === clamped);
    });

    // SOLAR ODYSSEY text: displayed only on pages 01, 02, 03, 04; hidden on page 00
    const solarBadge = document.getElementById('solar-odyssey-badge');
    if (solarBadge) {
        if (clamped >= 1 && clamped <= 4) {
            solarBadge.classList.remove('hidden');
            solarBadge.style.display = 'inline-block';
        } else {
            solarBadge.classList.add('hidden');
            solarBadge.style.display = 'none';
        }
    }

    // Audio Lab button: accessible ONLY through Station 00 (Crystal Singularity)
    const settingsBtn = document.getElementById('settings-toggle-btn');
    if (settingsBtn) {
        if (clamped === 0) {
            settingsBtn.style.display = 'flex';
        } else {
            settingsBtn.style.display = 'none';
            if (typeof panelOpen !== 'undefined' && panelOpen) {
                closePanel();
            }
        }
    }

    if (STATE.audioInitialized) {
        audioEngine.triggerHarmonicWave(clamped);
    }

    if (clamped === 2 && planetStations[2]) {
        // Reset Earth to exact starting view with Africa facing forward
        if (planetStations[2].mainMesh) {
            planetStations[2].mainMesh.rotation.y = -2.00;
        }
        if (planetStations[2].cloudMesh) {
            planetStations[2].cloudMesh.rotation.y = -2.00;
        }
    }

    if (clamped === 3 && planetStations[3]) {
        // Reset Moon to exact near-side starting view shown in reference image
        if (planetStations[3].group) {
            planetStations[3].group.rotation.set(0, 0, 0);
        }
        if (planetStations[3].moonBody) {
            planetStations[3].moonBody.position.set(0, 0, 0);
            planetStations[3].moonBody.rotation.set(0, 0, 0);
        }
        if (planetStations[3].mainMesh) {
            planetStations[3].mainMesh.rotation.y = 4.7124;
        }
    }

    if (clamped === 4 && planetStations[4]) {
        // Reset Jupiter so Great Red Spot is visible immediately
        if (planetStations[4].group) {
            planetStations[4].group.rotation.set(0, 0, 0);
        }
        if (planetStations[4].jupBody) {
            planetStations[4].jupBody.position.set(0, 0, 0);
            planetStations[4].jupBody.rotation.set(0, 0, 0);
        }
    }
}

document.querySelectorAll('.station-dot').forEach((btn) => {
    btn.addEventListener('click', () => {
        const targetIdx = parseInt(btn.dataset.station, 10);
        warpToStation(targetIdx);
    });
});

document.getElementById('prev-planet-btn').addEventListener('click', () => {
    warpToStation(STATE.currentStation - 1);
});

document.getElementById('next-planet-btn').addEventListener('click', () => {
    warpToStation(STATE.currentStation + 1);
});

/**************************************************************
 * 4. INTERACTION: RAYCASTING, ORBIT DRAG & PARALLAX
 **************************************************************/
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let isDragging = false;
let isPinching = false;
let pinchStartDist = 0;
let prevPointer = { x: 0, y: 0 };
let pointerDownPos = { x: 0, y: 0 };

function onPointerDown(e) {
    if (typeof panelOpen !== 'undefined' && panelOpen && typeof closePanel === 'function') {
        if (!e.target.closest('#synth-panel, #settings-toggle-btn')) {
            closePanel();
        }
    }
    if (e.target.closest('header, footer, aside, nav, #celestial-hud, #intro-overlay')) return;
    if (e.touches && e.touches.length === 2) {
        isPinching = true;
        isDragging = false;
        pinchStartDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        return;
    }
    isDragging = true;
    isPinching = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    prevPointer = { x: clientX, y: clientY };
    pointerDownPos = { x: clientX, y: clientY };
}

function onPointerMove(e) {
    if (isPinching && e.touches && e.touches.length === 2) {
        const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        const deltaDist = currentDist - pinchStartDist;
        pinchStartDist = currentDist;
        STATE.userHasZoomed = true;
        const base = STATE.baseCameraDistance || 12.0;
        const minZ = base * 0.54;
        const maxZ = base * 1.85;
        STATE.cameraDistance = Math.max(minZ, Math.min(maxZ, STATE.cameraDistance - deltaDist * 0.035));
        return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    STATE.mouseX = (clientX / window.innerWidth) * 2 - 1;
    STATE.mouseY = -(clientY / window.innerHeight) * 2 + 1;

    if (isDragging) {
        const deltaX = clientX - prevPointer.x;
        const deltaY = clientY - prevPointer.y;
        STATE.targetRotationY += deltaX * 0.007;
        STATE.targetRotationX += deltaY * 0.007;

        // Direct cursor drag rotation for active celestial body (Sun, Earth, Moon, Jupiter)
        if (STATE.currentStation === 1 && planetStations[1] && planetStations[1].mainMesh) {
            planetStations[1].mainMesh.rotation.y += deltaX * 0.007;
        } else if (STATE.currentStation === 2 && planetStations[2] && planetStations[2].mainMesh) {
            planetStations[2].mainMesh.rotation.y += deltaX * 0.007;
            if (planetStations[2].cloudMesh) planetStations[2].cloudMesh.rotation.y += deltaX * 0.007;
        } else if (STATE.currentStation === 3 && planetStations[3] && planetStations[3].mainMesh) {
            planetStations[3].mainMesh.rotation.y += deltaX * 0.007;
        } else if (STATE.currentStation === 4 && planetStations[4] && planetStations[4].mainMesh) {
            planetStations[4].mainMesh.rotation.y += deltaX * 0.007;
        }

        prevPointer = { x: clientX, y: clientY };
    } else if (!e.touches && typeof camera !== 'undefined' && typeof document !== 'undefined' && document.body && document.body.style) {
        // Interactive cursor hover indication: only clickable celestial bodies show pointer
        pointer.x = STATE.mouseX;
        pointer.y = STATE.mouseY;
        raycaster.setFromCamera(pointer, camera);
        const allTargets = [coreMesh, ...planetClickTargets].filter(Boolean);
        const intersects = raycaster.intersectObjects(allTargets, false);
        document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    }
}

function onPointerUp(e) {
    if (isPinching) {
        if (!e.touches || e.touches.length < 2) {
            isPinching = false;
        }
        return;
    }
    if (!isDragging) return;
    isDragging = false;

    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const deltaX = clientX - pointerDownPos.x;
    const deltaY = clientY - pointerDownPos.y;
    const moveDist = Math.hypot(deltaX, deltaY);

    if (e.changedTouches && Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        if (deltaX < 0) {
            warpToStation(STATE.currentStation + 1);
        } else {
            warpToStation(STATE.currentStation - 1);
        }
        return;
    }

    if (moveDist < 10) {
        if (!STATE.audioInitialized) audioEngine.init();
        pointer.x = (clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const allTargets = [coreMesh, ...planetClickTargets].filter(Boolean);
        const intersects = raycaster.intersectObjects(allTargets, false);
        if (intersects.length > 0) {
            const hitObj = intersects[0].object;
            const hitStation = hitObj.userData.stationId !== undefined ? hitObj.userData.stationId : 0;
            audioEngine.triggerHarmonicWave(hitStation);
        } else {
            // Background clicks: only Station 0 (Singularity) triggers void chimes;
            // Dedicated planet stations (Station 1 Sun, Station 2 Earth, Station 3 Moon) strictly ignore background clicks.
            if (STATE.currentStation !== 1 && STATE.currentStation !== 2 && STATE.currentStation !== 3) {
                audioEngine.triggerChime();
                STATE.shockwavePower = Math.max(STATE.shockwavePower, 0.65);
            }
        }
    }
}

function onDoubleClick(e) {
    if (e.target.closest('header, footer, aside, nav, #celestial-hud, #intro-overlay')) return;
    if (!STATE.audioInitialized) audioEngine.init();

    const clientX = e.clientX;
    const clientY = e.clientY;
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const allTargets = [coreMesh, ...planetClickTargets].filter(Boolean);
    const intersects = raycaster.intersectObjects(allTargets, false);
    if (intersects.length > 0) {
        const hitObj = intersects[0].object;
        const hitStation = hitObj.userData.stationId !== undefined ? hitObj.userData.stationId : 0;
        // Enhanced double-click resonance burst
        STATE.shockwavePower = 1.85;
        audioEngine.triggerHarmonicWave(hitStation);
    }
}

window.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);
window.addEventListener('dblclick', onDoubleClick);
window.addEventListener('touchstart', onPointerDown, { passive: true });
window.addEventListener('touchmove', onPointerMove, { passive: true });
window.addEventListener('touchend', onPointerUp);

window.addEventListener('wheel', (e) => {
    if (introActive || e.target.closest('aside')) return;
    if (e.ctrlKey || e.shiftKey) {
        STATE.userHasZoomed = true;
        const base = STATE.baseCameraDistance || 12.0;
        const minZ = base * 0.54;
        const maxZ = base * 1.85;
        STATE.cameraDistance = Math.max(minZ, Math.min(maxZ, STATE.cameraDistance + e.deltaY * 0.008));
        return;
    }
    const now = performance.now();
    if (now - STATE.lastWheelWarpTime < 680) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 18) {
        STATE.lastWheelWarpTime = now;
        if (delta > 0 && STATE.currentStation < SOLAR_STATIONS.length - 1) {
            warpToStation(STATE.currentStation + 1);
        } else if (delta < 0 && STATE.currentStation > 0) {
            warpToStation(STATE.currentStation - 1);
        }
    }
}, { passive: true });

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panelOpen) {
        closePanel();
        return;
    }
    if (introActive) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        warpToStation(STATE.currentStation + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        warpToStation(STATE.currentStation - 1);
    }
});

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const newBase = typeof getResponsiveBaseCameraDistance === 'function'
        ? getResponsiveBaseCameraDistance(camera.aspect)
        : (window.getResponsiveBaseCameraDistance ? window.getResponsiveBaseCameraDistance(camera.aspect) : 12.0);

    if (!STATE.userHasZoomed) {
        STATE.cameraDistance = newBase;
    } else {
        const prevBase = STATE.baseCameraDistance || 12.0;
        const zoomRatio = STATE.cameraDistance / prevBase;
        STATE.cameraDistance = newBase * zoomRatio;
    }
    STATE.baseCameraDistance = newBase;
}
window.addEventListener('resize', onWindowResize);
window.addEventListener('orientationchange', () => {
    setTimeout(onWindowResize, 120);
});

/**************************************************************
 * 5. UI CONTROLS & EVENT BINDINGS
 **************************************************************/
const introOverlay = document.getElementById('intro-overlay');

function enterMain3DExperience() {
    audioEngine.init();
    audioEngine.tryAutoPlayBgAudio();
    audioEngine.triggerHarmonicWave(STATE.currentStation || 0);
    introActive = false;
    introOverlay.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        introOverlay.style.display = 'none';
    }, 700);

    // Audio Lab is accessible only through Station 00
    const settingsBtn = document.getElementById('settings-toggle-btn');
    if (settingsBtn) {
        settingsBtn.style.display = (STATE.currentStation === 0) ? 'flex' : 'none';
    }
}

function returnToLandingPage() {
    introActive = true;
    if (typeof panelOpen !== 'undefined' && panelOpen) {
        closePanel();
    }
    const settingsBtn = document.getElementById('settings-toggle-btn');
    if (settingsBtn) {
        settingsBtn.style.display = 'none';
    }
    introOverlay.style.display = 'block';
    void introOverlay.offsetWidth;
    introOverlay.classList.remove('opacity-0', 'pointer-events-none');
}

const mainNavBrand = document.getElementById('main-nav-brand');
if (mainNavBrand) {
    mainNavBrand.addEventListener('click', returnToLandingPage);
}

document.getElementById('start-experience-btn').addEventListener('click', enterMain3DExperience);
const introMenuBtn = document.getElementById('intro-menu-enter');
if (introMenuBtn) introMenuBtn.addEventListener('click', enterMain3DExperience);

const ambienceBtn = document.getElementById('intro-ambience-btn');
if (ambienceBtn) {
    ambienceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!STATE.audioInitialized) audioEngine.init();
        const icon = document.getElementById('ambience-icon');
        const text = document.getElementById('ambience-text');
        if (audioEngine.bgAudio) {
            if (!audioEngine.bgAudio.paused) {
                audioEngine.bgAudio.pause();
                STATE.senyaTrackPlaying = false;
                if (icon) icon.textContent = '▶';
                if (text) text.textContent = 'PLAY AMBIENCE';
            } else {
                audioEngine.tryAutoPlayBgAudio();
                if (icon) icon.textContent = '❚❚';
                if (text) text.textContent = 'PAUSE AMBIENCE';
            }
        }
    });
}

document.querySelectorAll('.intro-station-badge').forEach((btn) => {
    btn.addEventListener('click', () => {
        const sId = parseInt(btn.dataset.station, 10);
        enterMain3DExperience();
        setTimeout(() => {
            warpToStation(sId);
            // Station 00 opens Crystal Singularity and directly opens Audio Lab
            if (sId === 0) {
                openPanel();
            }
        }, 350);
    });
});

document.getElementById('mute-btn').addEventListener('click', () => {
    if (!STATE.audioInitialized) audioEngine.init();
    const muted = audioEngine.toggleMute();
    const iconSvg = document.getElementById('volume-icon-svg');
    if (iconSvg) {
        if (muted) {
            iconSvg.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
        } else {
            iconSvg.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>';
        }
    }
});

const synthPanel = document.getElementById('synth-panel');
let panelOpen = false;
let audioLabTimer = null;
const AUDIOLAB_PREF_KEY = 'bankai_audiolab_2s_done';

function isAudioLabDone() {
    try {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem(AUDIOLAB_PREF_KEY) === 'true';
        }
    } catch (e) { }
    return false;
}

function markAudioLabDone() {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(AUDIOLAB_PREF_KEY, 'true');
        }
    } catch (e) { }
}

function openPanel() {
    // Audio Lab is accessible ONLY through Station 00 (Crystal Singularity)
    if (STATE.currentStation !== 0) return;
    panelOpen = true;
    synthPanel.classList.add('open');
    synthPanel.style.transform = 'translateX(0)';
    synthPanel.style.opacity = '1';
    synthPanel.style.pointerEvents = 'auto';
    const btn = document.getElementById('settings-toggle-btn');
    if (btn) btn.classList.add('active');
}

function closePanel() {
    panelOpen = false;
    synthPanel.classList.remove('open');
    synthPanel.style.transform = 'translateX(120%)';
    synthPanel.style.opacity = '0';
    synthPanel.style.pointerEvents = 'none';
    const btn = document.getElementById('settings-toggle-btn');
    if (btn) btn.classList.remove('active');
    markAudioLabDone();
    if (audioLabTimer) {
        clearTimeout(audioLabTimer);
        audioLabTimer = null;
    }
}

function togglePanel() {
    if (panelOpen) {
        closePanel();
    } else {
        openPanel();
    }
}

document.getElementById('settings-toggle-btn').addEventListener('click', togglePanel);
document.getElementById('close-panel-btn').addEventListener('click', closePanel);

document.getElementById('gain-slider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    document.getElementById('gain-val').textContent = `${val}%`;
    audioEngine.setVolume(val / 100);
});

const arpToggle = document.getElementById('arp-toggle');
arpToggle.addEventListener('click', () => {
    STATE.arpEnabled = !STATE.arpEnabled;
    arpToggle.textContent = STATE.arpEnabled ? 'ACTIVE' : 'PAUSED';
    arpToggle.className = STATE.arpEnabled
        ? 'px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-medium'
        : 'px-2.5 py-0.5 rounded-md bg-slate-700/40 border border-white/10 text-slate-400 font-medium';
});

document.getElementById('morph-slider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    document.getElementById('morph-val').textContent = `${val}%`;
    STATE.morphIntensity = val / 100;
});

document.getElementById('speed-slider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) / 10;
    document.getElementById('speed-val').textContent = `${val.toFixed(1)}x`;
    STATE.orbitalSpeed = val;
});

document.querySelectorAll('.geo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.geo-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const geoType = btn.dataset.geo;
        STATE.currentGeo = geoType;
        buildCoreGeometry(geoType);
        warpToStation(0);
        if (STATE.audioInitialized) audioEngine.triggerHarmonicWave(0);
    });
});

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => {
            b.classList.remove('ring-2', 'ring-white/80');
            b.classList.add('opacity-70');
        });
        btn.classList.add('ring-2', 'ring-white/80');
        btn.classList.remove('opacity-70');

        const themeKey = btn.dataset.theme;
        const palette = THEMES[themeKey];
        STATE.currentTheme = themeKey;

        pointLight1.color.setHex(palette.primary);
        pointLight2.color.setHex(palette.secondary);
        pointLight3.color.setHex(palette.accent);
        coreMaterial.emissive.setHex(palette.emissive);
        wireMaterial.color.setHex(palette.primary);
        innerCoreMat.color.setHex(palette.primary);
        shockwaveMat.color.setHex(palette.primary);

        rings.forEach((r, idx) => {
            r.material.color.setHex(idx % 2 === 0 ? palette.primary : palette.secondary);
        });

        const c1 = new THREE.Color(palette.primary);
        const c2 = new THREE.Color(palette.secondary);
        const colorsArr = particleGeo.attributes.color.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const mixed = c1.clone().lerp(c2, (i % 100) / 100);
            colorsArr[i * 3] = mixed.r;
            colorsArr[i * 3 + 1] = mixed.g;
            colorsArr[i * 3 + 2] = mixed.b;
        }
        particleGeo.attributes.color.needsUpdate = true;

        if (STATE.audioInitialized) audioEngine.triggerChime();
    });
});

document.getElementById('pulse-chord-btn').addEventListener('click', () => {
    audioEngine.triggerHarmonicWave(STATE.currentStation);
});

/**************************************************************
 * 6. 2D SPECTRUM VISUALIZER & MAIN 3D ANIMATION LOOP
 **************************************************************/
const specCanvas = document.getElementById('spectrum-canvas');
const specCtx = specCanvas.getContext('2d');

function drawMiniSpectrum(rawFreq, elapsed) {
    specCtx.clearRect(0, 0, specCanvas.width, specCanvas.height);
    const barWidth = 3;
    const gap = 2;
    const bars = Math.min(20, Math.max(10, Math.floor(specCanvas.width / (barWidth + gap))));

    for (let i = 0; i < bars; i++) {
        const val = rawFreq
            ? (rawFreq[i * 2] / 255)
            : (Math.sin(elapsed * 4 + i * 0.5) * 0.25 + 0.3);
        const h = Math.max(3, val * specCanvas.height);
        const x = i * (barWidth + gap);
        const y = (specCanvas.height - h) / 2;

        const grad = specCtx.createLinearGradient(0, 0, 0, specCanvas.height);
        grad.addColorStop(0, '#22d3ee');
        grad.addColorStop(1, '#a855f7');
        specCtx.fillStyle = grad;
        specCtx.beginPath();
        if (typeof specCtx.roundRect === 'function') {
            const r = Math.min(2, barWidth / 2, h / 2);
            specCtx.roundRect(x, y, barWidth, h, r);
        } else {
            specCtx.rect(x, y, barWidth, h);
        }
        specCtx.fill();
    }
}

const clock = new THREE.Clock();
let lastFrameTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    const elapsed = clock.getElapsedTime();
    const { bass, mid, treble, raw } = audioEngine.getAudioLevels(elapsed);

    drawMiniSpectrum(raw, elapsed);

    // 1. Deform Crystal Core Vertices (Only when near Station 00 for peak FPS)
    if (coreMesh && basePositions && STATE.cameraX < STATE.stationSpacing * 0.85) {
        const posAttr = coreMesh.geometry.attributes.position;
        const wireAttr = wireMesh.geometry.attributes.position;
        const arr = posAttr.array;
        const wArr = wireAttr.array;

        const morphFactor = STATE.morphIntensity * (0.28 + bass * 1.15 + STATE.shockwavePower * 0.45);

        for (let i = 0; i < arr.length; i += 3) {
            const bx = basePositions[i];
            const by = basePositions[i + 1];
            const bz = basePositions[i + 2];

            const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
            const nx = bx / len;
            const ny = by / len;
            const nz = bz / len;

            const wave = Math.sin(nx * 3.5 + elapsed * 2.2)
                * Math.cos(ny * 3.5 + elapsed * 1.8)
                * Math.sin(nz * 3.5 + elapsed * 2.5);

            const displacement = 1 + wave * morphFactor;

            arr[i] = bx * displacement;
            arr[i + 1] = by * displacement;
            arr[i + 2] = bz * displacement;

            wArr[i] = arr[i];
            wArr[i + 1] = arr[i + 1];
            wArr[i + 2] = arr[i + 2];
        }

        posAttr.needsUpdate = true;
        wireAttr.needsUpdate = true;
    }

    // 2. Pulse Inner Core & Gyroscope Rings
    const scalePulse = 1 + bass * 0.35 + STATE.shockwavePower * 0.25;
    innerCore.scale.setScalar(scalePulse);
    innerCoreMat.opacity = 0.25 + mid * 0.5;

    const spd = STATE.orbitalSpeed;
    rings[0].rotation.x += 0.008 * spd;
    rings[0].rotation.y += 0.005 * spd;
    rings[1].rotation.y -= 0.009 * spd;
    rings[1].rotation.z += 0.006 * spd;
    rings[2].rotation.x -= 0.005 * spd;
    rings[2].rotation.z -= 0.008 * spd;

    // 3. Expanding Shockwave Ring Effect (Centered on Active Station)
    if (STATE.shockwavePower > 0.02) {
        const ringScale = 1 + (1.4 - STATE.shockwavePower) * 4.5;
        shockwaveRing.position.x = STATE.currentStation * STATE.stationSpacing;
        shockwaveRing.scale.setScalar(Math.max(0.1, ringScale));
        shockwaveRing.material.opacity = STATE.shockwavePower * 0.65;
        shockwaveRing.lookAt(camera.position);
        STATE.shockwavePower *= 0.92;
    } else {
        STATE.shockwavePower = 0;
        shockwaveRing.material.opacity = 0;
    }

    // 4. Dynamic Thematic Point Lights Orbit Station 00 (Crystal Singularity) Only
    const coreProximity = Math.max(0, 1 - Math.abs(STATE.cameraX) / (STATE.stationSpacing * 0.75));
    pointLight1.intensity = 4.5 * coreProximity;
    pointLight2.intensity = 4.5 * coreProximity;
    pointLight3.intensity = 3.0 * coreProximity;
    pointLight1.position.set(Math.cos(elapsed * 0.7) * 8, 6, Math.sin(elapsed * 0.7) * 8);
    pointLight2.position.set(Math.sin(elapsed * 0.5) * -8, Math.sin(elapsed * 0.9) * 7, 5);
    pointLight3.position.set(0, 7, -6);

    // 5. Starfield & Nebula Particle Motion (stars kept still)
    particleMat.size = 0.15 + treble * 0.18 + STATE.shockwavePower * 0.08;

    // 5B. Animate Solar System Celestial Bodies with Audio Reactivity
    if (planetStations[1]) {
        const sun = planetStations[1];
        if (sun.sunBody) {
            // Only the Sun rotates and moves with the cursor
            sun.sunBody.position.x += (STATE.mouseX * 0.7 - sun.sunBody.position.x) * 0.08;
            sun.sunBody.position.y += (-STATE.mouseY * 0.5 - sun.sunBody.position.y) * 0.08;
            sun.sunBody.rotation.y += (STATE.mouseX * 0.4 - sun.sunBody.rotation.y) * 0.08;
            sun.sunBody.rotation.x += (-STATE.mouseY * 0.3 - sun.sunBody.rotation.x) * 0.08;
        }
        if (sun.mainMesh) {
            sun.mainMesh.rotation.y += delta * 0.095 * spd;
        }
        // Sun Orange-and-Black Background: only visible on Page 1 (x = 38), dynamically covers 100% of the screen
        if (sun.sunBgSprite && sun.sunBgSprite.material) {
            const distSun = Math.abs(STATE.cameraX - 1 * STATE.stationSpacing);
            const targetSunOpacity = Math.max(0, Math.min(1.0, 1 - distSun / (STATE.stationSpacing * 0.45)));
            sun.sunBgSprite.material.opacity = targetSunOpacity;
            sun.sunBgSprite.visible = (targetSunOpacity > 0.001);

            if (sun.sunBgSprite.visible) {
                sun.sunBgSprite.position.y = camera.position.y;
                const distToCam = Math.max(1, camera.position.z - sun.sunBgSprite.position.z);
                const vH = 2 * distToCam * Math.tan((camera.fov * Math.PI) / 360);
                const vW = vH * camera.aspect;
                const imgAspect = 1024 / 539;
                let w, h;
                if (camera.aspect > imgAspect) {
                    w = vW * 1.08;
                    h = w / imgAspect;
                } else {
                    h = vH * 1.08;
                    w = h * imgAspect;
                }
                sun.sunBgSprite.scale.set(w, h, 1);
            }
        }
        if (sun.sunLight) {
            sun.sunLight.intensity = 4.6 + bass * 2.0;
        }
    }

    if (planetStations[2]) {
        const earth = planetStations[2];
        if (earth.earthBody) {
            // Earth rotates and moves with the cursor exactly like the Sun
            earth.earthBody.position.x += (STATE.mouseX * 0.7 - earth.earthBody.position.x) * 0.08;
            earth.earthBody.position.y += (-STATE.mouseY * 0.5 - earth.earthBody.position.y) * 0.08;
            earth.earthBody.rotation.y += (STATE.mouseX * 0.4 - earth.earthBody.rotation.y) * 0.08;
            earth.earthBody.rotation.x += (-STATE.mouseY * 0.3 - earth.earthBody.rotation.x) * 0.08;
        }
        if (earth.mainMesh) {
            earth.mainMesh.rotation.y += delta * 0.095 * spd;
        }
        if (earth.cloudMesh) {
            earth.cloudMesh.rotation.y += delta * 0.095 * spd;
        }
        // Earth Blue Background: only visible on Page 2 (x = 76), covers entire screen with zero black gaps/borders
        if (earth.earthBgSprite && earth.earthBgSprite.material) {
            const distEarth = Math.abs(STATE.cameraX - 2 * STATE.stationSpacing);
            const targetEarthOpacity = Math.max(0, Math.min(1.0, 1 - distEarth / (STATE.stationSpacing * 0.45)));
            earth.earthBgSprite.material.opacity = targetEarthOpacity;
            earth.earthBgSprite.visible = (targetEarthOpacity > 0.001);

            if (earth.earthBgSprite.visible) {
                earth.earthBgSprite.position.y = camera.position.y;
                const distToCam = Math.max(1, camera.position.z - earth.earthBgSprite.position.z);
                const vH = 2 * distToCam * Math.tan((camera.fov * Math.PI) / 360);
                const vW = vH * camera.aspect;
                const imgAspect = 1920 / 1002;
                let w, h;
                if (camera.aspect > imgAspect) {
                    w = vW * 1.08;
                    h = w / imgAspect;
                } else {
                    h = vH * 1.08;
                    w = h * imgAspect;
                }
                earth.earthBgSprite.scale.set(w, h, 1);
            }
        }
        const earthScale = 1 + bass * 0.05 + (STATE.currentStation === 2 ? STATE.shockwavePower * 0.08 : 0);
        if (earth.earthBody) {
            earth.earthBody.scale.setScalar(earthScale);
        }
        if (earth.earthGlowSprite && earth.earthGlowSprite.material) {
            const atmoPulse = 8.6 * (1 + bass * 0.05 + (STATE.currentStation === 2 ? STATE.shockwavePower * 0.10 : 0));
            earth.earthGlowSprite.scale.set(atmoPulse, atmoPulse, 1);
        }
    }

    if (planetStations[3]) {
        const moon = planetStations[3];
        // Moon Starry Night Background: only visible on Page 3 (x = 114), covers entire screen with zero black gaps/borders
        if (moon.moonBgSprite && moon.moonBgSprite.material) {
            const distMoon = Math.abs(STATE.cameraX - 3 * STATE.stationSpacing);
            const targetMoonOpacity = Math.max(0, Math.min(1.0, 1 - distMoon / (STATE.stationSpacing * 0.45)));
            moon.moonBgSprite.material.opacity = targetMoonOpacity;
            moon.moonBgSprite.visible = (targetMoonOpacity > 0.001);

            if (moon.moonBgSprite.visible) {
                // Keep completely still - pin vertically to camera position Y with zero parallax or shaking
                moon.moonBgSprite.position.y = camera.position.y;
                const distToCam = Math.max(1, camera.position.z - moon.moonBgSprite.position.z);
                const vH = 2 * distToCam * Math.tan((camera.fov * Math.PI) / 360);
                const vW = vH * camera.aspect;
                const imgAspect = 1852 / 1132;
                let w, h;
                if (camera.aspect > imgAspect) {
                    w = vW * 1.08;
                    h = w / imgAspect;
                } else {
                    h = vH * 1.08;
                    w = h * imgAspect;
                }
                moon.moonBgSprite.scale.set(w, h, 1);
            }
        }
        if (moon.moonBody) {
            // Moon rotates and moves with cursor exactly like Sun and Earth
            moon.moonBody.position.x += (STATE.mouseX * 0.7 - moon.moonBody.position.x) * 0.08;
            moon.moonBody.position.y += (-STATE.mouseY * 0.5 - moon.moonBody.position.y) * 0.08;
            moon.moonBody.rotation.y += (STATE.mouseX * 0.4 - moon.moonBody.rotation.y) * 0.08;
            moon.moonBody.rotation.x += (-STATE.mouseY * 0.3 - moon.moonBody.rotation.x) * 0.08;
        }
        if (moon.mainMesh) {
            moon.mainMesh.rotation.y += delta * 0.095 * spd;
        }
        const moonScale = 1 + bass * 0.05 + (STATE.currentStation === 3 ? STATE.shockwavePower * 0.08 : 0);
        if (moon.moonBody) {
            moon.moonBody.scale.setScalar(moonScale);
        }
        if (moon.moonGlowSprite && moon.moonGlowSprite.material) {
            // Subtle rhythmic breathing of the moonlight halo
            const glowPulse = 7.5 * (1 + bass * 0.06 + (STATE.currentStation === 3 ? STATE.shockwavePower * 0.12 : 0));
            moon.moonGlowSprite.scale.set(glowPulse, glowPulse, 1);
        }
    }

    if (planetStations[4]) {
        const jup = planetStations[4];
        // Jupiter Purple Nebula Background: only visible on Page 4 (x = 152), covers entire screen with zero black gaps/borders
        if (jup.jupBgSprite && jup.jupBgSprite.material) {
            const distJup = Math.abs(STATE.cameraX - 4 * STATE.stationSpacing);
            const targetJupOpacity = Math.max(0, Math.min(1.0, 1 - distJup / (STATE.stationSpacing * 0.45)));
            jup.jupBgSprite.material.opacity = targetJupOpacity;
            jup.jupBgSprite.visible = (targetJupOpacity > 0.001);

            if (jup.jupBgSprite.visible) {
                // Keep completely still - pin vertically to camera position Y with zero parallax or shaking
                jup.jupBgSprite.position.y = camera.position.y;
                const distToCam = Math.max(1, camera.position.z - jup.jupBgSprite.position.z);
                const vH = 2 * distToCam * Math.tan((camera.fov * Math.PI) / 360);
                const vW = vH * camera.aspect;
                const imgAspect = 899 / 536;
                let w, h;
                if (camera.aspect > imgAspect) {
                    w = vW * 1.08;
                    h = w / imgAspect;
                } else {
                    h = vH * 1.08;
                    w = h * imgAspect;
                }
                jup.jupBgSprite.scale.set(w, h, 1);
            }
        }
        if (jup.jupBody) {
            // Smooth cursor tilt parallax matching Sun, Earth, Moon
            jup.jupBody.position.x += (STATE.mouseX * 0.7 - jup.jupBody.position.x) * 0.08;
            jup.jupBody.position.y += (-STATE.mouseY * 0.5 - jup.jupBody.position.y) * 0.08;
            jup.jupBody.rotation.y += (STATE.mouseX * 0.4 - jup.jupBody.rotation.y) * 0.08;
            jup.jupBody.rotation.x += (-STATE.mouseY * 0.3 - jup.jupBody.rotation.x) * 0.08;
        }
        if (jup.mainMesh) {
            // Slow continuous rotation
            jup.mainMesh.rotation.y += delta * 0.095 * spd;
        }
        if (jup.jupGlowSprite && jup.jupGlowSprite.material) {
            // Subtle rhythmic breathing of the atmospheric glow
            const glowPulse = 9.2 * (1 + Math.sin(elapsed * 2.2) * 0.02 + bass * 0.035);
            jup.jupGlowSprite.scale.set(glowPulse, glowPulse, 1);
        }
        const jupScale = 1 + bass * 0.06 + (STATE.currentStation === 4 ? STATE.shockwavePower * 0.09 : 0);
        if (jup.jupBody) {
            jup.jupBody.scale.setScalar(jupScale);
        }
    }

    Object.entries(planetStations).forEach(([id, st]) => {
        if (id === '1' || id === '2' || id === '3') return; // Page 1 (Sun), Page 2 (Earth) & Page 3 (Moon): backgrounds stay still
        if (id === '4') return; // Page 4 (Jupiter): uses jupBody
        st.group.rotation.y += (STATE.targetRotationY + STATE.mouseX * 0.28 - st.group.rotation.y) * 0.06;
        st.group.rotation.x += (STATE.targetRotationX - STATE.mouseY * 0.22 - st.group.rotation.x) * 0.06;
    });

    // 6. Smooth Camera Warp Interpolation Across Stations + Parallax
    STATE.targetRotationY += delta * 0.095 * spd;
    worldGroup.rotation.y += (STATE.targetRotationY + STATE.mouseX * 0.35 - worldGroup.rotation.y) * 0.06;
    worldGroup.rotation.x += (STATE.targetRotationX - STATE.mouseY * 0.28 - worldGroup.rotation.x) * 0.06;

    STATE.cameraX += (STATE.targetCameraX - STATE.cameraX) * 0.065;
    const isPlanetWithBg = (STATE.currentStation === 1 || STATE.currentStation === 2 || STATE.currentStation === 3);
    const isStationWithStillBg = isPlanetWithBg || (STATE.currentStation === 4);
    const camMouseX = isStationWithStillBg ? 0 : STATE.mouseX * 0.45;
    const camMouseY = isStationWithStillBg ? 0 : -STATE.mouseY * 0.35;
    camera.position.x = STATE.cameraX + camMouseX;
    camera.position.y += (camMouseY - camera.position.y) * 0.06;
    camera.position.z += (STATE.cameraDistance - camera.position.z) * 0.08;
    camera.lookAt(STATE.cameraX, 0, 0);

    renderer.render(scene, camera);
}

animate();