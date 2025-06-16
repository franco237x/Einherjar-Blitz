// AudioManager.js - Sistema de audio simplificado y seguro
export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = new Map();
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.currentMusic = null;
        this.audioEnabled = true;
        
        this.initializeAudio();
    }

    initializeAudio() {
        try {
            // Verificar si Web Audio API está disponible
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.warn('⚠️ Web Audio API no disponible, audio deshabilitado');
                this.audioEnabled = false;
                return;
            }
            
            // Crear sonidos básicos sin Web Audio API complejo
            this.createBasicSounds();
        } catch (error) {
            console.warn('⚠️ Error inicializando audio:', error);
            this.audioEnabled = false;
        }
    }

    createBasicSounds() {
        // Crear sonidos usando osciladores simples
        this.sounds.set('attack-basic', () => this.playTone(200, 0.1, 'sawtooth'));
        this.sounds.set('attack-elemental', () => this.playMultiTone([300, 450], 0.2));
        this.sounds.set('attack-ultimate', () => this.playTone(100, 0.5, 'square'));
        this.sounds.set('heal', () => this.playTone(440, 0.3, 'sine'));
        this.sounds.set('damage', () => this.playTone(150, 0.2, 'square'));
        this.sounds.set('victory', () => this.playSequence([523, 659, 784]));
        this.sounds.set('defeat', () => this.playTone(400, 1.0, 'sawtooth'));
        this.sounds.set('ui-click', () => this.playTone(800, 0.05, 'sine'));
        this.sounds.set('ui-hover', () => this.playTone(600, 0.03, 'sine'));
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.audioEnabled) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
            
            // Limpiar contexto después del sonido
            setTimeout(() => {
                try {
                    audioContext.close();
                } catch (e) {
                    // Ignorar errores de cierre
                }
            }, (duration + 0.1) * 1000);
            
        } catch (error) {
            console.warn('⚠️ Error reproduciendo tono:', error);
        }
    }

    playMultiTone(frequencies, duration) {
        if (!this.audioEnabled) return;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, duration / frequencies.length);
            }, index * 50);
        });
    }

    playSequence(frequencies) {
        if (!this.audioEnabled) return;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.3);
            }, index * 200);
        });
    }

    // Reproducir sonido por nombre
    playSound(soundName) {
        if (!this.audioEnabled) return;
        
        const sound = this.sounds.get(soundName);
        if (sound && typeof sound === 'function') {
            try {
                sound();
            } catch (error) {
                console.warn(`⚠️ Error playing sound ${soundName}:`, error);
            }
        }
    }

    // Configurar volúmenes
    setSFXVolume(volume) {
        this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    }

    setMusicVolume(volume) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.musicVolume);
        }
    }

    // Música de ambiente (simplificado)
    playAmbientMusic(key) {
        if (!this.audioEnabled) return;
        
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
        
        if (this.scene.cache.audio.exists(key)) {
            try {
                this.currentMusic = this.scene.sound.add(key, {
                    volume: this.musicVolume,
                    loop: true
                });
                this.currentMusic.play();
            } catch (error) {
                console.warn('⚠️ Error reproduciendo música:', error);
            }
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            try {
                this.currentMusic.stop();
                this.currentMusic = null;
            } catch (error) {
                console.warn('⚠️ Error deteniendo música:', error);
            }
        }
    }

    // Limpiar recursos de audio
    cleanup() {
        try {
            this.stopMusic();
            this.sounds.clear();
            this.audioEnabled = false;
        } catch (error) {
            console.warn('⚠️ Error limpiando audio:', error);
        }
    }
}
