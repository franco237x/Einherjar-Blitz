/**
 * Gestor de Efectos Visuales - Einherjar Blitz
 * Maneja todas las animaciones y efectos visuales del combate
 */

class EffectsManager {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.battleEffectsContainer = document.getElementById('battleEffects');
        this.animationSpeed = 1;
    }

    async playActionEffect(actionType, result) {
        const { damage, isCritical, actionName } = result;
        
        // Efecto visual en el centro
        await this.showCenterEffect(actionType, actionName);
        
        // Animación del personaje atacante
        this.animateAttacker('player', actionType);
        
        // Efecto de daño en el enemigo
        if (damage > 0) {
            await this.showDamageEffect('enemy', damage, isCritical);
            this.animateHit('enemy');
        }
        
        // Efectos especiales según el resultado
        if (result.bijonGenerated) {
            this.showBijonEffect(result.bijonGenerated);
        }
        
        if (result.overcharge) {
            this.showOverchargeEffect();
        }
        
        if (result.furyBonus) {
            this.showFuryEffect();
        }
        
        if (result.freezeEffect) {
            this.showFreezeEffect();
        }
    }

    async playEnemyAttackEffect(damage) {
        // Efecto visual del ataque enemigo
        await this.showCenterEffect('enemy_attack', 'Ataque Enemigo');
        
        // Animación del enemigo
        this.animateAttacker('enemy', 'basic');
        
        // Efecto de daño en el jugador
        if (damage > 0) {
            await this.showDamageEffect('player', damage, false);
            this.animateHit('player');
        }
    }

    async showCenterEffect(actionType, actionName) {
        const effect = document.createElement('div');
        effect.className = 'battle-effect';
        effect.innerHTML = this.getEffectHTML(actionType, actionName);
        
        this.battleEffectsContainer.appendChild(effect);
        
        // Animar entrada
        effect.style.opacity = '0';
        effect.style.transform = 'scale(0.5)';
        
        requestAnimationFrame(() => {
            effect.style.transition = `all ${0.5 / this.animationSpeed}s ease-out`;
            effect.style.opacity = '1';
            effect.style.transform = 'scale(1)';
        });
        
        // Remover después de la animación
        setTimeout(() => {
            effect.style.opacity = '0';
            effect.style.transform = 'scale(1.2)';
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 300 / this.animationSpeed);
        }, 1000 / this.animationSpeed);
        
        return new Promise(resolve => {
            setTimeout(resolve, 800 / this.animationSpeed);
        });
    }

    getEffectHTML(actionType, actionName) {
        const effects = {
            basic: { icon: '⚔️', color: '#ffffff', size: '3rem' },
            elemental: { icon: '🌪️', color: '#3b82f6', size: '4rem' },
            ultimate: { icon: '💥', color: '#f59e0b', size: '5rem' },
            defend: { icon: '🛡️', color: '#10b981', size: '3rem' },
            enemy_attack: { icon: '👊', color: '#ef4444', size: '3rem' }
        };

        const effect = effects[actionType] || effects.basic;
        
        return `
            <div style="
                font-size: ${effect.size};
                color: ${effect.color};
                text-shadow: 0 0 20px ${effect.color};
                animation: effectPulse ${1 / this.animationSpeed}s ease-out;
            ">
                ${effect.icon}
            </div>
            <div style="
                font-size: 1rem;
                color: white;
                margin-top: 0.5rem;
                font-weight: 600;
                text-shadow: 0 2px 4px rgba(0,0,0,0.8);
            ">
                ${actionName}
            </div>
        `;
    }

    animateAttacker(target, actionType) {
        const selector = target === 'player' ? '.player-area .fighter-portrait img' : '.enemy-area .fighter-portrait img';
        const element = document.querySelector(selector);
        
        if (!element) return;
        
        // Animación de ataque
        element.style.transition = `transform ${0.2 / this.animationSpeed}s ease-out`;
        
        if (target === 'player') {
            element.style.transform = 'scale(1.1) translateY(-10px)';
        } else {
            element.style.transform = 'scale(1.1) translateY(10px)';
        }
        
        setTimeout(() => {
            element.style.transform = '';
        }, 200 / this.animationSpeed);
        
        // Efecto de brillo
        element.classList.add('glow');
        setTimeout(() => {
            element.classList.remove('glow');
        }, 500 / this.animationSpeed);
    }

    animateHit(target) {
        const selector = target === 'player' ? '.player-area' : '.enemy-area';
        const area = document.querySelector(selector);
        
        if (!area) return;
        
        // Efecto de temblor
        area.classList.add('shake');
        setTimeout(() => {
            area.classList.remove('shake');
        }, 500 / this.animationSpeed);
        
        // Flash rojo
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%);
            pointer-events: none;
            z-index: 10;
            animation: flashHit ${0.3 / this.animationSpeed}s ease-out;
        `;
        
        area.style.position = 'relative';
        area.appendChild(flash);
        
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 300 / this.animationSpeed);
    }

    async showDamageEffect(target, damage, isCritical) {
        const ui = this.game.battleUI;
        ui.showDamageIndicator(target, damage, isCritical);
        
        // Efecto de partículas de daño
        this.createDamageParticles(target, damage, isCritical);
        
        return new Promise(resolve => {
            setTimeout(resolve, 300 / this.animationSpeed);
        });
    }

    createDamageParticles(target, damage, isCritical) {
        const selector = target === 'player' ? '.player-area .fighter-portrait' : '.enemy-area .fighter-portrait';
        const container = document.querySelector(selector);
        
        if (!container) return;
        
        const particleCount = isCritical ? 8 : 5;
        const color = isCritical ? '#fbbf24' : '#ef4444';
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 20;
                top: 50%;
                left: 50%;
                box-shadow: 0 0 6px ${color};
            `;
            
            container.appendChild(particle);
            
            // Animar partícula
            const angle = (360 / particleCount) * i;
            const distance = 40 + Math.random() * 20;
            const duration = 0.8 / this.animationSpeed;
            
            particle.animate([
                {
                    transform: 'translate(-50%, -50%)',
                    opacity: 1
                },
                {
                    transform: `translate(-50%, -50%) 
                              translateX(${Math.cos(angle * Math.PI / 180) * distance}px)
                              translateY(${Math.sin(angle * Math.PI / 180) * distance}px)`,
                    opacity: 0
                }
            ], {
                duration: duration * 1000,
                easing: 'ease-out'
            }).onfinish = () => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            };
        }
    }

    showBijonEffect(amount) {
        const gauge = document.querySelector('.gauge-bar');
        if (!gauge) return;
        
        // Efecto de carga de energía
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(90deg, transparent, #a855f7, transparent);
            border-radius: 22px;
            animation: energyFlow ${1 / this.animationSpeed}s ease-out;
            pointer-events: none;
            z-index: 1;
        `;
        
        gauge.style.position = 'relative';
        gauge.appendChild(glow);
        
        setTimeout(() => {
            if (glow.parentNode) {
                glow.parentNode.removeChild(glow);
            }
        }, 1000 / this.animationSpeed);
        
        // Mostrar texto flotante
        this.showFloatingText('+' + amount + ' Bijon', '#a855f7');
    }

    showOverchargeEffect() {
        const player = document.querySelector('.player-area');
        if (!player) return;
        
        // Efecto de sobrecarga
        const overcharge = document.createElement('div');
        overcharge.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
            animation: overchargePulse ${2 / this.animationSpeed}s ease-out;
            pointer-events: none;
            z-index: 15;
        `;
        
        player.style.position = 'relative';
        player.appendChild(overcharge);
        
        setTimeout(() => {
            if (overcharge.parentNode) {
                overcharge.parentNode.removeChild(overcharge);
            }
        }, 2000 / this.animationSpeed);
        
        this.showFloatingText('¡SOBRECARGA BIJON!', '#a855f7');
    }

    showFuryEffect() {
        const player = document.querySelector('.player-area');
        if (!player) return;
        
        // Efecto de furia
        const fury = document.createElement('div');
        fury.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%);
            animation: furyPulse ${1.5 / this.animationSpeed}s ease-out;
            pointer-events: none;
            z-index: 15;
        `;
        
        player.style.position = 'relative';
        player.appendChild(fury);
        
        setTimeout(() => {
            if (fury.parentNode) {
                fury.parentNode.removeChild(fury);
            }
        }, 1500 / this.animationSpeed);
    }

    showFreezeEffect() {
        const enemy = document.querySelector('.enemy-area');
        if (!enemy) return;
        
        // Efecto de congelación
        const freeze = document.createElement('div');
        freeze.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
            animation: freezeEffect ${2 / this.animationSpeed}s ease-out;
            pointer-events: none;
            z-index: 15;
        `;
        
        enemy.style.position = 'relative';
        enemy.appendChild(freeze);
        
        setTimeout(() => {
            if (freeze.parentNode) {
                freeze.parentNode.removeChild(freeze);
            }
        }, 2000 / this.animationSpeed);
        
        this.showFloatingText('¡CONGELADO!', '#3b82f6');
    }

    showFloatingText(text, color = '#ffffff') {
        const floating = document.createElement('div');
        floating.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${color};
            font-size: 1.2rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 100;
            animation: floatingText ${2 / this.animationSpeed}s ease-out forwards;
        `;
        floating.textContent = text;
        
        document.body.appendChild(floating);
        
        setTimeout(() => {
            if (floating.parentNode) {
                floating.parentNode.removeChild(floating);
            }
        }, 2000 / this.animationSpeed);
    }

    updateAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    // Agregar estilos CSS dinámicamente
    injectStyles() {
        if (document.getElementById('effects-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'effects-styles';
        style.textContent = `
            @keyframes effectPulse {
                0% { transform: scale(0.8); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes flashHit {
                0% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            @keyframes energyFlow {
                0% { opacity: 0; transform: translateX(-100%); }
                50% { opacity: 1; }
                100% { opacity: 0; transform: translateX(100%); }
            }
            
            @keyframes overchargePulse {
                0%, 100% { opacity: 0; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
            }
            
            @keyframes furyPulse {
                0%, 100% { opacity: 0; }
                50% { opacity: 0.8; }
            }
            
            @keyframes freezeEffect {
                0% { opacity: 0; filter: blur(10px); }
                50% { opacity: 1; filter: blur(0px); }
                100% { opacity: 0; filter: blur(5px); }
            }
            
            @keyframes floatingText {
                0% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) translateY(0px) scale(0.8); 
                }
                20% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) translateY(-10px) scale(1.1); 
                }
                100% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) translateY(-40px) scale(1); 
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Inyectar estilos al cargar
document.addEventListener('DOMContentLoaded', () => {
    const effectsManager = new EffectsManager({});
    effectsManager.injectStyles();
});

// Hacer la clase disponible globalmente
window.EffectsManager = EffectsManager;
