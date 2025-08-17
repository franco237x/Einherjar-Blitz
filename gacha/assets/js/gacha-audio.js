/* ====================================
   SISTEMA DE AUDIO PARA GACHA
   Sonidos opcionales para mejorar la experiencia
   ==================================== */

class GachaAudioSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.sounds = {};
        this.init();
    }

    init() {
        // Pre-cargar sonidos si están disponibles
        this.loadSounds();
    }

    loadSounds() {
        // Solo cargar sonidos si existen los archivos
        const soundPaths = {
            'chest_open': 'assets/audio/chest_open.mp3',
            'chest_glow': 'assets/audio/chest_glow.mp3',
            'reward_reveal': 'assets/audio/reward_reveal.mp3',
            'rare_reward': 'assets/audio/rare_reward.mp3',
            'legendary_reward': 'assets/audio/legendary_reward.mp3',
            'button_click': 'assets/audio/button_click.mp3'
        };

        for (const [key, path] of Object.entries(soundPaths)) {
            try {
                const audio = new Audio(path);
                audio.volume = this.volume;
                audio.preload = 'auto';
                
                // Solo agregar si el archivo existe
                audio.addEventListener('canplaythrough', () => {
                    this.sounds[key] = audio;
                });
                
                audio.addEventListener('error', () => {
                    console.log(`Audio file not found: ${path}`);
                });
                
            } catch (error) {
                console.log(`Could not load audio: ${path}`);
            }
        }
    }

    play(soundName) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            try {
                sound.currentTime = 0;
                sound.play().catch(error => {
                    console.log(`Could not play sound: ${soundName}`, error);
                });
            } catch (error) {
                console.log(`Error playing sound: ${soundName}`, error);
            }
        }
    }

    playByRarity(rarity) {
        switch (rarity) {
            case 'legendary':
            case 'mythical':
                this.play('legendary_reward');
                break;
            case 'epic':
                this.play('rare_reward');
                break;
            default:
                this.play('reward_reveal');
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }
}

// Instancia global
window.GachaAudio = new GachaAudioSystem();

// Integrar con el sistema de animaciones
if (window.GachaAnimations) {
    // Hookear sonidos en los eventos de animación
    const originalPlayWishAnimation = window.GachaAnimations.playWishAnimation;
    window.GachaAnimations.playWishAnimation = async function(chestType, isMultiple = false) {
        window.GachaAudio.play('chest_open');
        return originalPlayWishAnimation.call(this, chestType, isMultiple);
    };

    const originalShowOpeningAnimation = window.GachaAnimations.showOpeningAnimation;
    window.GachaAnimations.showOpeningAnimation = async function(chestType) {
        setTimeout(() => window.GachaAudio.play('chest_glow'), 1500);
        return originalShowOpeningAnimation.call(this, chestType);
    };

    const originalAnimateRewardCard = window.GachaAnimations.animateRewardCard;
    window.GachaAnimations.animateRewardCard = function() {
        originalAnimateRewardCard.call(this);
        
        // Reproducir sonido basado en rareza
        setTimeout(() => {
            const card = document.querySelector('.reward-card');
            if (card) {
                const rarity = card.dataset.rarity;
                window.GachaAudio.playByRarity(rarity);
            }
        }, 800);
    };
}

// Agregar sonidos a botones
document.addEventListener('DOMContentLoaded', function() {
    // Sonidos en botones de cofre
    document.querySelectorAll('.btn-gacha').forEach(button => {
        button.addEventListener('click', () => {
            window.GachaAudio.play('button_click');
        });
    });

    // Sonidos en botones de resultados (se agregará dinámicamente)
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-results')) {
            window.GachaAudio.play('button_click');
        }
    });
});
