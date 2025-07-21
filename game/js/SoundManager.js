/**
 * Gestor de Sonidos - Einherjar Blitz
 * Maneja todos los efectos de sonido del juego
 */

class SoundManager {
    constructor(volume = 70) {
        this.volume = volume / 100;
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        
        this.initializeAudioContext();
        this.createSounds();
    }

    initializeAudioContext() {
        try {
            // Crear contexto de audio si está disponible
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (error) {
            console.warn('Audio Context no disponible:', error);
            this.enabled = false;
        }
    }

    createSounds() {
        // Crear sonidos sintéticos usando Web Audio API
        this.sounds = {
            // Sonidos de ataque
            basicAttack: () => this.createAttackSound(440, 0.1),
            elementalAttack: () => this.createElementalSound(),
            ultimateAttack: () => this.createUltimateSound(),
            
            // Sonidos de impacto
            hit: () => this.createHitSound(),
            criticalHit: () => this.createCriticalHitSound(),
            
            // Sonidos de interfaz
            buttonClick: () => this.createClickSound(),
            buttonHover: () => this.createHoverSound(),
            
            // Sonidos especiales
            bijonCharge: () => this.createBijonSound(),
            overcharge: () => this.createOverchargeSound(),
            freeze: () => this.createFreezeSound(),
            fury: () => this.createFurySound(),
            
            // Sonidos de resultado
            victory: () => this.createVictorySound(),
            defeat: () => this.createDefeatSound(),
            
            // Sonidos ambientales
            turnStart: () => this.createTurnSound(),
            energyRestore: () => this.createEnergySound()
        };
    }

    // === Métodos de reproducción ===
    playSound(soundName, volumeMultiplier = 1) {
        if (!this.enabled || !this.audioContext || this.volume === 0) return;
        
        try {
            const soundFunction = this.sounds[soundName];
            if (soundFunction) {
                soundFunction();
            }
        } catch (error) {
            console.warn(`Error reproduciendo sonido ${soundName}:`, error);
        }
    }

    playAttack(attackType) {
        switch(attackType) {
            case 'basic':
                this.playSound('basicAttack');
                break;
            case 'elemental':
                this.playSound('elementalAttack');
                break;
            case 'ultimate':
                this.playSound('ultimateAttack');
                break;
        }
    }

    playHit(isCritical = false) {
        if (isCritical) {
            this.playSound('criticalHit');
        } else {
            this.playSound('hit');
        }
    }

    playVictory() {
        this.playSound('victory');
    }

    playDefeat() {
        this.playSound('defeat');
    }

    playSpecial(effectType) {
        switch(effectType) {
            case 'bijon':
                this.playSound('bijonCharge');
                break;
            case 'overcharge':
                this.playSound('overcharge');
                break;
            case 'freeze':
                this.playSound('freeze');
                break;
            case 'fury':
                this.playSound('fury');
                break;
        }
    }

    // === Generadores de sonido sintético ===
    createAttackSound(frequency = 440, duration = 0.1) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.type = 'sawtooth';
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    createElementalSound() {
        if (!this.audioContext) return;

        // Sonido más complejo para ataques elementales
        const frequencies = [330, 440, 550];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createAttackSound(freq, 0.15);
            }, index * 50);
        });
    }

    createUltimateSound() {
        if (!this.audioContext) return;

        // Sonido dramático para ataques definitivos
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createAttackSound(220 + (i * 110), 0.2);
            }, i * 80);
        }
    }

    createHitSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.type = 'square';
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    createCriticalHitSound() {
        if (!this.audioContext) return;

        // Sonido especial para golpes críticos
        this.createHitSound();
        setTimeout(() => {
            this.createAttackSound(880, 0.2);
        }, 50);
    }

    createClickSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        oscillator.type = 'sine';
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    createHoverSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03);
        
        oscillator.type = 'sine';
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.03);
    }

    createBijonSound() {
        if (!this.audioContext) return;

        // Sonido creciente para carga de Bijon
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.type = 'triangle';
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    createOverchargeSound() {
        if (!this.audioContext) return;

        // Sonido dramático para sobrecarga
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(440 * (i + 1), this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                
                oscillator.type = 'sawtooth';
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.4);
            }, i * 100);
        }
    }

    createFreezeSound() {
        if (!this.audioContext) return;

        // Sonido cristalino para congelación
        const frequencies = [880, 1100, 1320];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                
                oscillator.type = 'sine';
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
            }, index * 50);
        });
    }

    createFurySound() {
        if (!this.audioContext) return;

        // Sonido intenso para furia
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.type = 'square';
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    createVictorySound() {
        if (!this.audioContext) return;

        // Melodía de victoria
        const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                
                oscillator.type = 'triangle';
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.4);
            }, index * 200);
        });
    }

    createDefeatSound() {
        if (!this.audioContext) return;

        // Sonido descendente para derrota
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1);
        
        gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        oscillator.type = 'sawtooth';
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1);
    }

    createTurnSound() {
        this.createClickSound();
    }

    createEnergySound() {
        this.createBijonSound();
    }

    // === Métodos de control ===
    setVolume(volume) {
        this.volume = volume / 100;
    }

    mute() {
        this.enabled = false;
    }

    unmute() {
        this.enabled = true;
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}

// Agregar efectos de sonido a los botones de la interfaz
document.addEventListener('DOMContentLoaded', () => {
    const soundManager = new SoundManager();
    
    // Sonidos de botones
    document.addEventListener('click', (e) => {
        if (e.target.matches('button, .btn, .action-btn')) {
            soundManager.playSound('buttonClick');
        }
    });
    
    document.addEventListener('mouseover', (e) => {
        if (e.target.matches('button:not(:disabled), .btn:not(:disabled), .action-btn:not(:disabled)')) {
            soundManager.playSound('buttonHover');
        }
    });
});

// Hacer la clase disponible globalmente
window.SoundManager = SoundManager;
