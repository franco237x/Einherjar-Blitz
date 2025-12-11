// UMBRA - Sistema de Audio Procedural
// Genera sonidos de terror sin archivos externos usando Web Audio API

export class ProceduralAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.ambientNodes = [];
        this.heartbeatInterval = null;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            this.isInitialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AMBIENTE - Sonido de fondo constante
    // ═══════════════════════════════════════════════════════════════

    startAmbient() {
        if (!this.isInitialized) return;

        // Ruido marrón de fondo (más grave y ominoso)
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.08;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start();

        this.ambientNodes.push({ source: noise, gain: noiseGain });

        // Drone grave ominoso
        this.startDrone();
    }

    startDrone() {
        if (!this.isInitialized) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 40; // Muy grave

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 41.5; // Ligeramente detuned para batimiento

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 0.06;

        // LFO para modulación lenta
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.1;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 10;

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start();
        osc2.start();
        lfo.start();

        this.ambientNodes.push({ source: osc, gain: gainNode });
        this.ambientNodes.push({ source: osc2 });
        this.ambientNodes.push({ source: lfo });
    }

    stopAmbient() {
        this.ambientNodes.forEach(node => {
            try {
                if (node.gain) {
                    node.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
                }
                setTimeout(() => node.source.stop(), 1100);
            } catch (e) { }
        });
        this.ambientNodes = [];
    }

    // ═══════════════════════════════════════════════════════════════
    // LATIDO DE CORAZÓN
    // ═══════════════════════════════════════════════════════════════

    startHeartbeat(bpm = 70) {
        if (!this.isInitialized || this.heartbeatInterval) return;

        const interval = 60000 / bpm;

        const playBeat = () => {
            // Primer latido (lub)
            this.playBeat(80, 0.15, 0.08);
            // Segundo latido (dub) - ligeramente más alto
            setTimeout(() => this.playBeat(60, 0.12, 0.06), 150);
        };

        playBeat();
        this.heartbeatInterval = setInterval(playBeat, interval);
    }

    playBeat(freq, duration, volume) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Acelerar latido (para momentos de tensión)
    accelerateHeartbeat() {
        this.stopHeartbeat();
        this.startHeartbeat(120);
        setTimeout(() => {
            this.stopHeartbeat();
            this.startHeartbeat(70);
        }, 5000);
    }

    // ═══════════════════════════════════════════════════════════════
    // SUSURROS PROCEDURALES
    // ═══════════════════════════════════════════════════════════════

    playWhisper() {
        if (!this.isInitialized) return;

        // Ruido filtrado que simula un susurro
        const duration = 1.5 + Math.random();
        const bufferSize = duration * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generar ruido con envolvente
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const envelope = Math.sin(t * Math.PI); // Fade in/out
            const noise = (Math.random() * 2 - 1) * envelope;
            // Modulación para hacerlo más "vocal"
            const mod = Math.sin(t * Math.PI * (4 + Math.random() * 3));
            data[i] = noise * mod * 0.5;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Filtro para sonar más como voz
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800 + Math.random() * 400;
        filter.Q.value = 2;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.15;

        // Paneo aleatorio (susurro viene de diferentes direcciones)
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = (Math.random() * 2 - 1) * 0.8;

        source.connect(filter);
        filter.connect(panner);
        panner.connect(gain);
        gain.connect(this.masterGain);

        source.start();
    }

    // ═══════════════════════════════════════════════════════════════
    // RESPIRACIÓN
    // ═══════════════════════════════════════════════════════════════

    playBreathing(count = 3) {
        if (!this.isInitialized) return;

        let i = 0;
        const breathe = () => {
            if (i >= count) return;

            // Inhalar
            this.playBreath(true);

            // Exhalar después de un delay
            setTimeout(() => {
                this.playBreath(false);
                i++;
                setTimeout(breathe, 1500);
            }, 1200);
        };

        breathe();
    }

    playBreath(inhale) {
        const duration = inhale ? 1.0 : 1.2;
        const bufferSize = duration * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            let envelope;
            if (inhale) {
                envelope = Math.pow(t, 0.5) * Math.pow(1 - t, 0.3);
            } else {
                envelope = Math.pow(t, 0.3) * Math.pow(1 - t, 0.5);
            }
            const noise = (Math.random() * 2 - 1) * envelope;
            data[i] = noise;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = inhale ? 600 : 400;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.12;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start();
    }

    // ═══════════════════════════════════════════════════════════════
    // EFECTOS DE GLITCH Y TERROR
    // ═══════════════════════════════════════════════════════════════

    playGlitch() {
        if (!this.isInitialized) return;

        const duration = 0.1 + Math.random() * 0.15;
        const bufferSize = duration * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // Ruido digital con clipping
            let sample = Math.random() * 2 - 1;
            if (Math.random() > 0.7) sample = sample > 0 ? 1 : -1;
            data[i] = sample;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.1;

        source.connect(gain);
        gain.connect(this.masterGain);

        source.start();
    }

    playDistortion() {
        if (!this.isInitialized) return;

        // Tono discordante
        const frequencies = [223, 227, 311, 317];
        const duration = 0.5 + Math.random() * 0.5;

        frequencies.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(this.ctx.currentTime + i * 0.05);
            osc.stop(this.ctx.currentTime + duration);
        });
    }

    // Sonido de impacto/susto
    playJumpScare() {
        if (!this.isInitialized) return;

        // Golpe grave
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);

        // Ruido de impacto + grito
        this.playGlitch();
        this.playScream();
    }

    // Grito perturbador procedural
    playScream() {
        if (!this.isInitialized) return;

        const duration = 1.2;
        const bufferSize = duration * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generar un "grito" sintético
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;

            // Envolvente de grito: ataque rápido, decay largo
            let envelope = 0;
            if (t < 0.05) {
                envelope = t / 0.05; // Attack rápido
            } else if (t < 0.3) {
                envelope = 1; // Sustain
            } else {
                envelope = Math.pow(1 - (t - 0.3) / 0.7, 0.5); // Decay
            }

            // Frecuencia base que sube (como un grito)
            const baseFreq = 400 + t * 800;
            const vibrato = Math.sin(t * 30) * 50; // Vibración vocal
            const freq = baseFreq + vibrato;

            // Onda con armónicos (más realista)
            let sample = 0;
            sample += Math.sin(2 * Math.PI * freq * t) * 0.5;
            sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
            sample += Math.sin(2 * Math.PI * freq * 3 * t) * 0.15;
            sample += (Math.random() * 2 - 1) * 0.2; // Ruido vocal

            data[i] = sample * envelope;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Filtro para hacerlo más "humano"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1;

        // Distorsión sutil
        const distortion = this.ctx.createWaveShaper();
        distortion.curve = this.makeDistortionCurve(100);

        const gain = this.ctx.createGain();
        gain.gain.value = 0.25;

        source.connect(filter);
        filter.connect(distortion);
        distortion.connect(gain);
        gain.connect(this.masterGain);

        source.start();
    }

    // Curva de distorsión para el grito
    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < samples; ++i) {
            const x = i * 2 / samples - 1;
            curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    // Tono de tensión creciente
    playTension(duration = 5) {
        if (!this.isInitialized) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + duration * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTROL DE VOLUMEN
    // ═══════════════════════════════════════════════════════════════

    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(
                Math.max(0, Math.min(1, value)),
                this.ctx.currentTime + 0.1
            );
        }
    }

    mute() {
        this.setVolume(0);
    }

    unmute() {
        this.setVolume(0.3);
    }

    // Resume audio context (required after user interaction)
    async resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }
}
