/**************************************************************
 * 1. APPLICATION STATE & SOLAR SYSTEM STATION CONFIGURATION
 **************************************************************/
const THEMES = {
    cyber:   { primary: 0x06b6d4, secondary: 0x8b5cf6, accent: 0xf43f5e, emissive: 0x083344 },
    solar:   { primary: 0xf59e0b, secondary: 0xe11d48, accent: 0xfef08a, emissive: 0x451a03 },
    emerald: { primary: 0x10b981, secondary: 0x06b6d4, accent: 0xa7f3d0, emissive: 0x022c22 },
    nebula:  { primary: 0xec4899, secondary: 0x6366f1, accent: 0xfbcfe8, emissive: 0x3b0764 }
};

const STATE = {
    audioInitialized: false,
    senyaTrackPlaying: false,
    isMuted: false,
    masterVolume: 0.75,
    arpEnabled: true,
    morphIntensity: 0.65,
    orbitalSpeed: 1.0,
    currentGeo: 'crystal',
    currentTheme: 'cyber',
    mouseX: 0,
    mouseY: 0,
    targetRotationX: 0,
    targetRotationY: 0,
    cameraDistance: 12,
    shockwavePower: 0,
    bassEnergy: 0,
    midEnergy: 0,
    trebleEnergy: 0,
    currentStation: 0,
    stationSpacing: 38,
    cameraX: 0,
    targetCameraX: 0,
    lastWheelWarpTime: 0
};

const SOLAR_STATIONS = [
    {
        id: 0,
        code: 'STATION 00',
        name: 'CRYSTAL SINGULARITY',
        subtitle: 'Scroll or Swipe to Warp Solar System • Click Core for Chimes',
        chord: [0, 4, 9, 11, 15, 18],
        toast: 'CRYSTAL HARMONIC PULSE'
    },
    {
        id: 1,
        code: 'SOLAR STAR // 01',
        name: 'THE SUN (HELIOS)',
        subtitle: 'G-Type Main-Sequence Star • Surface Temperature: 5,778 K',
        chord: [0, 3, 7, 10, 14, 17],
        toast: 'SOLAR CORONA FLARE TRIGGERED'
    },
    {
        id: 2,
        code: 'TERRA // 02',
        name: 'PLANET EARTH',
        subtitle: 'Blue Marble Biosphere & Orbital Cloud Veil • Harmonic Gaia Chord',
        chord: [2, 6, 9, 13, 16, 18],
        toast: 'TERRESTRIAL BIOSPHERE RESONANCE'
    },
    {
        id: 3,
        code: 'LUNA // 03',
        name: 'THE MOON',
        subtitle: 'Tidal Cratered Regolith • Silver Tranquility Harmonic',
        chord: [4, 7, 11, 14, 16, 19],
        toast: 'LUNAR TIDAL CHIME TRIGGERED'
    },
    {
        id: 4,
        code: 'JOVE // 04',
        name: 'JUPITER (GAS GIANT)',
        subtitle: 'Realistic Ammonia Bands & Great Red Spot • Deep Jovian Sub-Harmonic',
        chord: [0, 2, 5, 9, 12, 15],
        toast: 'JOVIAN MAGNETOSPHERE PULSE'
    }
];

/**************************************************************
 * 2. AUTHENTIC THEME ("SENYA") STREAM + WEB AUDIO API ENGINE
 **************************************************************/
class SenyaAndCrystalAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.analyser = null;
        this.freqData = null;
        this.delayNode = null;
        this.bgAudio = document.getElementById('senya-bg-audio');
        this._isAttemptingPlay = false;

        this.scale = [
            130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08,
            261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16,
            523.25, 587.33, 622.25, 698.46, 783.99, 830.61, 1046.50
        ];

        this._setupAudioElementListeners();
    }

    _setupAudioElementListeners() {
        if (!this.bgAudio) {
            this.bgAudio = document.getElementById('senya-bg-audio');
        }
        if (this.bgAudio) {
            this.bgAudio.addEventListener('play', () => {
                STATE.senyaTrackPlaying = true;
                const icon = document.getElementById('ambience-icon');
                const text = document.getElementById('ambience-text');
                if (icon) icon.textContent = '❚❚';
                if (text) text.textContent = 'PAUSE AMBIENCE';
            });
            this.bgAudio.addEventListener('pause', () => {
                STATE.senyaTrackPlaying = false;
                const icon = document.getElementById('ambience-icon');
                const text = document.getElementById('ambience-text');
                if (icon) icon.textContent = '▶';
                if (text) text.textContent = 'PLAY AMBIENCE';
            });
            this.bgAudio.addEventListener('ended', () => {
                // Ensure seamless loop playback of senya-theme.mp3
                this.bgAudio.currentTime = 0;
                this.bgAudio.play().catch(() => {});
            });
        }
    }

    tryAutoPlayBgAudio() {
        if (!this.bgAudio) {
            this.bgAudio = document.getElementById('senya-bg-audio');
            if (this.bgAudio) this._setupAudioElementListeners();
            if (!this.bgAudio) return;
        }
        this.bgAudio.volume = STATE.isMuted ? 0 : STATE.masterVolume;

        if (!this.bgAudio.paused) {
            STATE.senyaTrackPlaying = true;
            return;
        }

        if (this._isAttemptingPlay) return;
        this._isAttemptingPlay = true;

        const playPromise = this.bgAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this._isAttemptingPlay = false;
                STATE.senyaTrackPlaying = true;
            }).catch(() => {
                this._isAttemptingPlay = false;
                STATE.senyaTrackPlaying = false;
            });
        } else {
            this._isAttemptingPlay = false;
        }
    }

    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            this.tryAutoPlayBgAudio();
            return;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(STATE.isMuted ? 0 : STATE.masterVolume, this.ctx.currentTime);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.82;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

        this.delayNode = this.ctx.createDelay(2.0);
        this.delayNode.delayTime.value = 0.375;
        const delayFeedback = this.ctx.createGain();
        delayFeedback.gain.value = 0.44;
        const delayFilter = this.ctx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 2600;

        this.delayNode.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(this.delayNode);
        this.delayNode.connect(this.masterGain);

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        STATE.audioInitialized = true;
        this.tryAutoPlayBgAudio();
    }

    triggerChime(noteIndex = null, isStrong = false) {
        if (!this.ctx || STATE.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

        const now = this.ctx.currentTime;
        const idx = noteIndex !== null
            ? noteIndex % this.scale.length
            : Math.floor(Math.random() * (this.scale.length - 7)) + 7;
        const freq = this.scale[idx];

        const readout = document.getElementById('freq-readout');
        if (readout) readout.textContent = `${Math.round(freq)} Hz`;

        const osc = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        osc.type = isStrong ? 'triangle' : 'sine';
        subOsc.type = 'sine';

        osc.frequency.setValueAtTime(freq, now);
        subOsc.frequency.setValueAtTime(freq * 1.5, now);

        const peakGain = isStrong ? 0.22 : 0.12;
        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(peakGain, now + 0.018);
        env.gain.exponentialRampToValueAtTime(0.0001, now + (isStrong ? 2.4 : 1.6));

        osc.connect(env);
        subOsc.connect(env);
        env.connect(this.masterGain);
        env.connect(this.delayNode);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + 2.5);
        subOsc.stop(now + 2.5);
    }

    triggerHarmonicWave(stationIndex = STATE.currentStation) {
        if (!this.ctx) this.init();
        STATE.shockwavePower = 1.35;

        const station = SOLAR_STATIONS[stationIndex] || SOLAR_STATIONS[0];
        const chordIndices = station.chord || [0, 4, 9, 11, 15, 18];
        chordIndices.forEach((noteIdx, i) => {
            setTimeout(() => {
                this.triggerChime(noteIdx, i === 0 || stationIndex === 1 || stationIndex === 4);
            }, i * 65);
        });

        const toast = document.getElementById('harmonic-toast');
        const toastText = document.getElementById('harmonic-toast-text');
        if (toastText) toastText.textContent = station.toast;
        if (toast) {
            toast.classList.remove('opacity-0', '-translate-y-2');
            toast.classList.add('opacity-100', 'translate-y-0');
            clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => {
                toast.classList.add('opacity-0', '-translate-y-2');
                toast.classList.remove('opacity-100', 'translate-y-0');
            }, 1400);
        }
    }

    updateCursorModulation() {}

    setVolume(val) {
        STATE.masterVolume = val;
        if (this.bgAudio) {
            this.bgAudio.volume = STATE.isMuted ? 0 : val;
        }
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(STATE.isMuted ? 0 : val, this.ctx.currentTime, 0.05);
        }
    }

    toggleMute() {
        STATE.isMuted = !STATE.isMuted;
        this.setVolume(STATE.masterVolume);
        return STATE.isMuted;
    }

    getAudioLevels(elapsedTime = 0) {
        if (this.analyser && this.freqData && STATE.audioInitialized) {
            this.analyser.getByteFrequencyData(this.freqData);
            let bass = 0, mid = 0, treble = 0;
            const len = this.freqData.length;
            for (let i = 0; i < len; i++) {
                if (i < 12) bass += this.freqData[i];
                else if (i < 48) mid += this.freqData[i];
                else treble += this.freqData[i];
            }
            bass = (bass / (12 * 255));
            mid = (mid / (36 * 255));
            treble = (treble / ((len - 48) * 255));

            if (bass + mid + treble > 0.03) {
                STATE.bassEnergy = bass;
                STATE.midEnergy = mid;
                STATE.trebleEnergy = treble;
                return { bass, mid, treble, raw: this.freqData };
            }
        }

        if ((STATE.senyaTrackPlaying || STATE.audioInitialized) && !STATE.isMuted) {
            const beat = (elapsedTime * 2.1) % 1;
            const pulse = Math.pow(Math.max(0, Math.sin(beat * Math.PI)), 3);
            STATE.bassEnergy = 0.25 + pulse * 0.35;
            STATE.midEnergy = 0.22 + 0.18 * Math.sin(elapsedTime * 3.4);
            STATE.trebleEnergy = 0.16 + 0.14 * Math.cos(elapsedTime * 5.2);
            return { bass: STATE.bassEnergy, mid: STATE.midEnergy, treble: STATE.trebleEnergy, raw: this.freqData };
        }

        return { bass: 0.04, mid: 0.03, treble: 0.02, raw: null };
    }
}

const audioEngine = new SenyaAndCrystalAudioEngine();

function unlockAndPlaySenyaImmediately() {
    audioEngine.init();
    audioEngine.tryAutoPlayBgAudio();
}

// Unlock audio upon user interaction (gestures permitted by browser autoplay policies)
const audioUnlockEvents = ['pointerdown', 'touchstart', 'keydown', 'click'];

function autoUnlockHandler() {
    unlockAndPlaySenyaImmediately();
    if (STATE.senyaTrackPlaying || (audioEngine.ctx && audioEngine.ctx.state === 'running')) {
        audioUnlockEvents.forEach(evt => window.removeEventListener(evt, autoUnlockHandler));
    }
}

audioUnlockEvents.forEach((evtName) => {
    window.addEventListener(evtName, autoUnlockHandler, { passive: true });
});
