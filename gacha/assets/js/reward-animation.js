/* ====================================
   ANIMACIONES DE RECOMPENSA
   Einherjer Blitz 3.0 - Estilo Genshin Impact
   ==================================== */

class RewardAnimationSystem {
    constructor() {
        this.currentAnimation = null;
        this.soundEnabled = true;
        this.init();
    }

    init() {
        this.createSoundEffects();
        this.setupEventListeners();
    }

    createSoundEffects() {
        // Crear contexto de audio si está disponible
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (AudioContext || webkitAudioContext)();
            this.soundEffects = {
                chestOpen: this.createChestOpenSound(),
                rewardAppear: this.createRewardAppearSound(),
                legendary: this.createLegendarySound(),
                mythical: this.createMythicalSound()
            };
        }
    }

    setupEventListeners() {
        // Manejar cambios de visibilidad para pausar animaciones
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentAnimation) {
                this.pauseCurrentAnimation();
            }
        });
    }

    // Generar efectos de sonido usando Web Audio API
    createChestOpenSound() {
        if (!this.audioContext) return null;
        
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }

    createRewardAppearSound() {
        if (!this.audioContext) return null;
        
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
    }

    createLegendarySound() {
        if (!this.audioContext) return null;
        
        return () => {
            // Crear múltiples tonos para un sonido más épico
            [440, 554, 659].forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.1);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime + index * 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1 + index * 0.1);
                
                oscillator.start(this.audioContext.currentTime + index * 0.1);
                oscillator.stop(this.audioContext.currentTime + 1 + index * 0.1);
            });
        };
    }

    createMythicalSound() {
        if (!this.audioContext) return null;
        
        return () => {
            // Sonido aún más épico para mythical
            [523, 659, 784, 1047].forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.05);
                gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime + index * 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5 + index * 0.05);
                
                oscillator.start(this.audioContext.currentTime + index * 0.05);
                oscillator.stop(this.audioContext.currentTime + 1.5 + index * 0.05);
            });
        };
    }

    playSound(soundName) {
        if (!this.soundEnabled || !this.soundEffects || !this.soundEffects[soundName]) return;
        
        try {
            this.soundEffects[soundName]();
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }

    // Crear partículas de celebración
    createCelebrationParticles(container, rarity) {
        const particleCount = this.getParticleCountByRarity(rarity);
        const colors = this.getParticleColorsByRarity(rarity);
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createSingleParticle(container, colors);
            }, i * 50);
        }
    }

    getParticleCountByRarity(rarity) {
        const counts = {
            'common': 10,
            'rare': 20,
            'epic': 30,
            'legendary': 50,
            'mythical': 80
        };
        return counts[rarity] || 10;
    }

    getParticleColorsByRarity(rarity) {
        const colorSets = {
            'common': ['#9ca3af', '#d1d5db'],
            'rare': ['#3b82f6', '#60a5fa'],
            'epic': ['#8b5cf6', '#c084fc'],
            'legendary': ['#f59e0b', '#fbbf24'],
            'mythical': ['#ef4444', '#f87171', '#ffd700']
        };
        return colorSets[rarity] || colorSets.common;
    }

    createSingleParticle(container, colors) {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        
        // Propiedades aleatorias
        const size = Math.random() * 6 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const startX = Math.random() * container.offsetWidth;
        const startY = Math.random() * container.offsetHeight;
        const endX = startX + (Math.random() - 0.5) * 200;
        const endY = startY - Math.random() * 300 - 100;
        const duration = Math.random() * 2 + 1;
        
        // Estilos
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            left: ${startX}px;
            top: ${startY}px;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 0 ${size * 2}px ${color};
        `;
        
        container.appendChild(particle);
        
        // Animar
        particle.animate([
            {
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => {
            particle.remove();
        };
    }

    // Crear efecto de estrella fugaz
    createShootingStars(container, count = 3) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createSingleShootingStar(container);
            }, i * 300);
        }
    }

    createSingleShootingStar(container) {
        const star = document.createElement('div');
        star.className = 'shooting-star';
        
        const startX = Math.random() * container.offsetWidth;
        const startY = Math.random() * (container.offsetHeight / 2);
        const length = Math.random() * 100 + 50;
        const angle = Math.random() * 60 + 15; // 15-75 grados
        
        star.style.cssText = `
            position: absolute;
            width: ${length}px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #ffd700, transparent);
            left: ${startX}px;
            top: ${startY}px;
            transform: rotate(${angle}deg);
            pointer-events: none;
            z-index: 999;
            box-shadow: 0 0 10px #ffd700;
        `;
        
        container.appendChild(star);
        
        // Animar movimiento
        const distance = 300;
        const radians = (angle * Math.PI) / 180;
        const endX = startX + Math.cos(radians) * distance;
        const endY = startY + Math.sin(radians) * distance;
        
        star.animate([
            {
                transform: `translate(0, 0) rotate(${angle}deg) scaleX(0)`,
                opacity: 0
            },
            {
                transform: `translate(0, 0) rotate(${angle}deg) scaleX(1)`,
                opacity: 1,
                offset: 0.3
            },
            {
                transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${angle}deg) scaleX(0)`,
                opacity: 0
            }
        ], {
            duration: 1500,
            easing: 'ease-out'
        }).onfinish = () => {
            star.remove();
        };
    }

    // Crear pulso de energía
    createEnergyPulse(element, rarity) {
        const colors = this.getParticleColorsByRarity(rarity);
        const pulseCount = rarity === 'mythical' ? 3 : rarity === 'legendary' ? 2 : 1;
        
        for (let i = 0; i < pulseCount; i++) {
            setTimeout(() => {
                const pulse = document.createElement('div');
                pulse.className = 'energy-pulse';
                
                pulse.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    border: 3px solid ${colors[0]};
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 998;
                `;
                
                element.appendChild(pulse);
                
                pulse.animate([
                    {
                        width: '0px',
                        height: '0px',
                        opacity: 1
                    },
                    {
                        width: '200px',
                        height: '200px',
                        opacity: 0
                    }
                ], {
                    duration: 800,
                    easing: 'ease-out'
                }).onfinish = () => {
                    pulse.remove();
                };
            }, i * 200);
        }
    }

    pauseCurrentAnimation() {
        // Pausar animaciones activas si es necesario
        if (this.currentAnimation) {
            // Lógica para pausar animaciones
        }
    }

    // Método principal para ejecutar todas las animaciones de recompensa
    playRewardAnimation(rewardData, container) {
        const { rarity } = rewardData;
        
        // Reproducir sonido apropiado
        if (rarity === 'mythical') {
            this.playSound('mythical');
        } else if (rarity === 'legendary') {
            this.playSound('legendary');
        } else {
            this.playSound('rewardAppear');
        }
        
        // Crear efectos visuales
        setTimeout(() => {
            this.createCelebrationParticles(container, rarity);
        }, 500);
        
        if (rarity === 'legendary' || rarity === 'mythical') {
            setTimeout(() => {
                this.createShootingStars(container, rarity === 'mythical' ? 5 : 3);
            }, 800);
        }
        
        setTimeout(() => {
            this.createEnergyPulse(container, rarity);
        }, 300);
    }
}

// Hacer disponible globalmente
window.RewardAnimationSystem = RewardAnimationSystem;

// Auto-inicializar si ya existe un contenedor de recompensa
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.reward-container')) {
        window.rewardAnimationSystem = new RewardAnimationSystem();
    }
});
