/**
 * Sistema de Efectos de Batalla - Einherjar Blitz
 * Maneja animaciones y efectos visuales durante el combate
 */

export class BattleEffects {
    constructor() {
        this.activeEffects = new Map();
        this.effectsContainer = document.getElementById('battleEffects');
        this.particleSystem = null;
        
        this.initializeParticleSystem();
        this.setupEffectStyles();
    }
    
    /**
     * Inicializa el sistema de partículas
     */
    initializeParticleSystem() {
        if (!this.effectsContainer) return;
        
        // Crear canvas para efectos de partículas
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        canvas.style.position = 'absolute';
        canvas.style.top = '50%';
        canvas.style.left = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '10';
        
        this.effectsContainer.appendChild(canvas);
        
        this.particleCanvas = canvas;
        this.particleContext = canvas.getContext('2d');
        this.particles = [];
        
        // Iniciar loop de animación de partículas
        this.startParticleLoop();
    }
    
    /**
     * Configura estilos para efectos
     */
    setupEffectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Animaciones de acciones */
            .action-animation {
                animation: actionPulse 0.8s ease-out;
            }
            
            .action-attack {
                animation: attackShake 0.6s ease-out;
            }
            
            .action-special {
                animation: specialGlow 1s ease-out;
            }
            
            .action-heal {
                animation: healPulse 0.8s ease-out;
            }
            
            .action-defend {
                animation: defendShield 0.6s ease-out;
            }
            
            /* Efectos de daño */
            .damage-flash {
                animation: damageFlash 0.3s ease-out;
            }
            
            .special-glow {
                animation: specialGlow 1s ease-out;
            }
            
            .heal-glow {
                animation: healGlow 0.8s ease-out;
            }
            
            .critical-hit {
                animation: criticalShake 0.5s ease-out;
            }
            
            /* Efectos de estado */
            .frozen {
                filter: hue-rotate(180deg) brightness(0.8);
                animation: frozenShiver 2s ease-in-out infinite;
            }
            
            .burning {
                filter: hue-rotate(20deg) brightness(1.2);
                animation: burningFlicker 1s ease-in-out infinite;
            }
            
            .stunned {
                filter: sepia(1) brightness(0.7);
                animation: stunnedShake 0.2s ease-in-out infinite;
            }
            
            .powered-up {
                filter: brightness(1.3) saturate(1.5);
                animation: poweredGlow 2s ease-in-out infinite;
            }
            
            /* Keyframes */
            @keyframes actionPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            @keyframes attackShake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
            
            @keyframes specialGlow {
                0% { 
                    box-shadow: 0 0 10px rgba(201, 170, 113, 0.5);
                    transform: scale(1);
                }
                50% { 
                    box-shadow: 0 0 30px rgba(201, 170, 113, 1), 0 0 60px rgba(201, 170, 113, 0.5);
                    transform: scale(1.08);
                }
                100% { 
                    box-shadow: 0 0 10px rgba(201, 170, 113, 0.5);
                    transform: scale(1);
                }
            }
            
            @keyframes healPulse {
                0% { 
                    box-shadow: 0 0 10px rgba(39, 174, 96, 0.5);
                    transform: scale(1);
                }
                50% { 
                    box-shadow: 0 0 25px rgba(39, 174, 96, 0.8);
                    transform: scale(1.05);
                }
                100% { 
                    box-shadow: 0 0 10px rgba(39, 174, 96, 0.5);
                    transform: scale(1);
                }
            }
            
            @keyframes defendShield {
                0% { 
                    box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
                }
                50% { 
                    box-shadow: 0 0 20px rgba(52, 152, 219, 0.8), inset 0 0 20px rgba(52, 152, 219, 0.3);
                }
                100% { 
                    box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
                }
            }
            
            @keyframes damageFlash {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.5) hue-rotate(10deg); }
            }
            
            @keyframes healGlow {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.3) hue-rotate(90deg); }
            }
            
            @keyframes criticalShake {
                0%, 100% { transform: rotate(0deg) scale(1); }
                10%, 30%, 50%, 70%, 90% { transform: rotate(-1deg) scale(1.02); }
                20%, 40%, 60%, 80% { transform: rotate(1deg) scale(1.02); }
            }
            
            @keyframes frozenShiver {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-1px); }
                75% { transform: translateX(1px); }
            }
            
            @keyframes burningFlicker {
                0%, 100% { filter: hue-rotate(20deg) brightness(1.2); }
                50% { filter: hue-rotate(40deg) brightness(1.4); }
            }
            
            @keyframes stunnedShake {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-0.5deg); }
                75% { transform: rotate(0.5deg); }
            }
            
            @keyframes poweredGlow {
                0%, 100% { 
                    filter: brightness(1.3) saturate(1.5);
                    box-shadow: 0 0 15px rgba(201, 170, 113, 0.4);
                }
                50% { 
                    filter: brightness(1.5) saturate(2);
                    box-shadow: 0 0 30px rgba(201, 170, 113, 0.8);
                }
            }
            
            /* Efectos de elementos */
            .element-devastacion {
                filter: hue-rotate(15deg) brightness(1.1);
            }
            
            .element-chakra {
                filter: hue-rotate(270deg) brightness(1.1);
            }
            
            .element-hielo {
                filter: hue-rotate(180deg) brightness(1.1);
            }
            
            .element-rayo {
                filter: hue-rotate(45deg) brightness(1.2);
            }
            
            /* Números de daño flotantes */
            .floating-damage {
                position: absolute;
                font-size: 2rem;
                font-weight: bold;
                color: #e74c3c;
                pointer-events: none;
                z-index: 1000;
                animation: floatUp 1.5s ease-out forwards;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            }
            
            .floating-damage.critical {
                color: #f1c40f;
                font-size: 2.5rem;
                animation: floatUpCritical 1.5s ease-out forwards;
            }
            
            .floating-damage.heal {
                color: #27ae60;
                animation: floatUpHeal 1.5s ease-out forwards;
            }
            
            @keyframes floatUp {
                0% {
                    opacity: 1;
                    transform: translateY(0) scale(0.5);
                }
                30% {
                    opacity: 1;
                    transform: translateY(-20px) scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-60px) scale(1);
                }
            }
            
            @keyframes floatUpCritical {
                0% {
                    opacity: 1;
                    transform: translateY(0) scale(0.5) rotate(-5deg);
                }
                30% {
                    opacity: 1;
                    transform: translateY(-25px) scale(1.4) rotate(5deg);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-80px) scale(1) rotate(0deg);
                }
            }
            
            @keyframes floatUpHeal {
                0% {
                    opacity: 1;
                    transform: translateY(0) scale(0.8);
                }
                50% {
                    opacity: 1;
                    transform: translateY(-30px) scale(1.1);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-60px) scale(0.9);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Inicia el loop de animación de partículas
     */
    startParticleLoop() {
        const animate = () => {
            if (this.particleContext && this.particleCanvas) {
                this.updateParticles();
                this.renderParticles();
            }
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * Actualiza las partículas
     */
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
    }
    
    /**
     * Renderiza las partículas
     */
    renderParticles() {
        if (!this.particleContext) return;
        
        this.particleContext.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        this.particles.forEach(particle => {
            particle.render(this.particleContext);
        });
    }
    
    /**
     * Crea efecto de ataque
     */
    createAttackEffect(attacker, target, damage, critical = false) {
        // Animación del atacante
        const attackerElement = document.querySelector(`.${attacker}-character`);
        if (attackerElement) {
            attackerElement.classList.add('action-animation', 'action-attack');
            setTimeout(() => {
                attackerElement.classList.remove('action-animation', 'action-attack');
            }, 600);
        }
        
        // Flash de daño en el objetivo
        const targetElement = document.querySelector(`.${target}-character`);
        if (targetElement) {
            targetElement.classList.add('damage-flash');
            if (critical) {
                targetElement.classList.add('critical-hit');
            }
            
            setTimeout(() => {
                targetElement.classList.remove('damage-flash', 'critical-hit');
            }, 500);
        }
        
        // Partículas de impacto
        this.createImpactParticles(target, critical);
        
        // Número de daño flotante
        this.createFloatingDamage(target, damage, critical);
    }
    
    /**
     * Crea efecto de habilidad especial
     */
    createSpecialEffect(character, abilityName, damage = 0) {
        const characterElement = document.querySelector(`.${character}-character`);
        if (!characterElement) return;
        
        // Efecto base de habilidad especial
        characterElement.classList.add('action-animation', 'action-special', 'special-glow');
        
        // Efectos específicos por habilidad
        switch (abilityName) {
            case 'Furia Devastadora':
                this.createDevastationEffect(character);
                break;
            case 'Muralla Inamovible':
                this.createShieldEffect(character);
                break;
            case 'Viento Gélido':
                this.createIceEffect(character);
                break;
            case 'Teletransporte Paradójico':
                this.createTeleportEffect(character);
                break;
        }
        
        // Partículas especiales
        this.createSpecialParticles(character);
        
        // Limpiar efectos
        setTimeout(() => {
            characterElement.classList.remove('action-animation', 'action-special', 'special-glow');
        }, 1000);
        
        // Mostrar daño si aplica
        if (damage > 0) {
            const target = character === 'player' ? 'enemy' : 'player';
            setTimeout(() => {
                this.createFloatingDamage(target, damage, false, 'special');
            }, 300);
        }
    }
    
    /**
     * Crea efecto de curación
     */
    createHealEffect(character, healAmount) {
        const characterElement = document.querySelector(`.${character}-character`);
        if (characterElement) {
            characterElement.classList.add('action-animation', 'action-heal', 'heal-glow');
            
            setTimeout(() => {
                characterElement.classList.remove('action-animation', 'action-heal', 'heal-glow');
            }, 800);
        }
        
        // Partículas de curación
        this.createHealParticles(character);
        
        // Número de curación flotante
        this.createFloatingDamage(character, healAmount, false, 'heal');
    }
    
    /**
     * Crea efecto de defensa
     */
    createDefendEffect(character) {
        const characterElement = document.querySelector(`.${character}-character`);
        if (characterElement) {
            characterElement.classList.add('action-animation', 'action-defend');
            
            setTimeout(() => {
                characterElement.classList.remove('action-animation', 'action-defend');
            }, 600);
        }
        
        // Partículas de escudo
        this.createShieldParticles(character);
    }
    
    /**
     * Crea número de daño flotante
     */
    createFloatingDamage(target, amount, critical = false, type = 'damage') {
        const targetElement = document.querySelector(`.${target}-character .character-image-wrapper`);
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        const damageElement = document.createElement('div');
        
        damageElement.className = `floating-damage ${critical ? 'critical' : ''} ${type}`;
        damageElement.textContent = critical ? `${amount}!` : amount;
        
        // Posicionar cerca del personaje
        damageElement.style.position = 'fixed';
        damageElement.style.left = `${rect.left + rect.width / 2}px`;
        damageElement.style.top = `${rect.top + rect.height / 2}px`;
        damageElement.style.transform = 'translate(-50%, -50%)';
        damageElement.style.zIndex = '1000';
        
        document.body.appendChild(damageElement);
        
        // Remover después de la animación
        setTimeout(() => {
            damageElement.remove();
        }, 1500);
    }
    
    /**
     * Crea partículas de impacto
     */
    createImpactParticles(target, critical = false) {
        const count = critical ? 15 : 8;
        const colors = critical ? ['#f1c40f', '#e67e22', '#e74c3c'] : ['#e74c3c', '#c0392b'];
        
        for (let i = 0; i < count; i++) {
            const particle = new Particle({
                x: this.particleCanvas.width / 2,
                y: this.particleCanvas.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 30 + Math.random() * 20,
                decay: 0.95
            });
            this.particles.push(particle);
        }
    }
    
    /**
     * Crea partículas especiales
     */
    createSpecialParticles(character) {
        const colors = ['#c9aa71', '#d4b776', '#f1c40f'];
        
        for (let i = 0; i < 20; i++) {
            const particle = new Particle({
                x: this.particleCanvas.width / 2 + (Math.random() - 0.5) * 100,
                y: this.particleCanvas.height / 2 + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 6 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 60 + Math.random() * 30,
                decay: 0.98,
                glow: true
            });
            this.particles.push(particle);
        }
    }
    
    /**
     * Crea partículas de curación
     */
    createHealParticles(character) {
        const colors = ['#27ae60', '#2ecc71', '#a3d977'];
        
        for (let i = 0; i < 12; i++) {
            const particle = new Particle({
                x: this.particleCanvas.width / 2 + (Math.random() - 0.5) * 80,
                y: this.particleCanvas.height / 2 + Math.random() * 50,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                size: Math.random() * 5 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 50 + Math.random() * 20,
                decay: 0.97,
                glow: true
            });
            this.particles.push(particle);
        }
    }
    
    /**
     * Crea partículas de escudo
     */
    createShieldParticles(character) {
        const colors = ['#3498db', '#5dade2', '#85c1e9'];
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 60;
            
            const particle = new Particle({
                x: this.particleCanvas.width / 2 + Math.cos(angle) * radius,
                y: this.particleCanvas.height / 2 + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 40 + Math.random() * 20,
                decay: 0.96,
                glow: true
            });
            this.particles.push(particle);
        }
    }
    
    /**
     * Efectos específicos por habilidad
     */
    createDevastationEffect(character) {
        // Efecto de devastación con partículas rojas y naranjas
        const colors = ['#e74c3c', '#e67e22', '#f39c12'];
        for (let i = 0; i < 25; i++) {
            const particle = new Particle({
                x: this.particleCanvas.width / 2,
                y: this.particleCanvas.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 8 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 45,
                decay: 0.94
            });
            this.particles.push(particle);
        }
    }
    
    createShieldEffect(character) {
        // Crear un anillo de partículas azules
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const radius = 80;
            
            const particle = new Particle({
                x: this.particleCanvas.width / 2 + Math.cos(angle) * radius,
                y: this.particleCanvas.height / 2 + Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                size: 6,
                color: '#3498db',
                life: 60,
                decay: 0.98,
                glow: true
            });
            this.particles.push(particle);
        }
    }
    
    createIceEffect(character) {
        // Partículas de hielo con movimiento lento
        const colors = ['#85c1e9', '#aed6f1', '#d6eaf8'];
        for (let i = 0; i < 18; i++) {
            const particle = new Particle({
                x: this.particleCanvas.width / 2 + (Math.random() - 0.5) * 120,
                y: this.particleCanvas.height / 2 + (Math.random() - 0.5) * 120,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: Math.random() * 6 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 70,
                decay: 0.99,
                glow: true
            });
            this.particles.push(particle);
        }
    }
    
    createTeleportEffect(character) {
        // Efecto de teletransporte con partículas doradas que aparecen y desaparecen
        const colors = ['#f1c40f', '#f39c12', '#e67e22'];
        for (let i = 0; i < 30; i++) {
            const particle = new Particle({
                x: this.particleCanvas.width / 2 + (Math.random() - 0.5) * 200,
                y: this.particleCanvas.height / 2 + (Math.random() - 0.5) * 200,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 5 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 20 + Math.random() * 20,
                decay: 0.92,
                glow: true
            });
            this.particles.push(particle);
        }
    }
    
    /**
     * Aplica efecto de estado visual
     */
    applyStatusEffect(character, effect) {
        const characterElement = document.querySelector(`.${character}-character`);
        if (!characterElement) return;
        
        // Remover efectos anteriores
        characterElement.classList.remove('frozen', 'burning', 'stunned', 'powered-up');
        
        // Aplicar nuevo efecto
        switch (effect) {
            case 'freeze':
                characterElement.classList.add('frozen');
                break;
            case 'burn':
                characterElement.classList.add('burning');
                break;
            case 'stun':
                characterElement.classList.add('stunned');
                break;
            case 'power-up':
                characterElement.classList.add('powered-up');
                break;
        }
    }
    
    /**
     * Remueve efecto de estado visual
     */
    removeStatusEffect(character, effect) {
        const characterElement = document.querySelector(`.${character}-character`);
        if (!characterElement) return;
        
        switch (effect) {
            case 'freeze':
                characterElement.classList.remove('frozen');
                break;
            case 'burn':
                characterElement.classList.remove('burning');
                break;
            case 'stun':
                characterElement.classList.remove('stunned');
                break;
            case 'power-up':
                characterElement.classList.remove('powered-up');
                break;
        }
    }
}

/**
 * Clase Particle para el sistema de partículas
 */
class Particle {
    constructor(options) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.size = options.size || 2;
        this.color = options.color || '#ffffff';
        this.life = options.life || 30;
        this.maxLife = this.life;
        this.decay = options.decay || 0.95;
        this.glow = options.glow || false;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life *= this.decay;
        
        // Gravedad sutil
        this.vy += 0.1;
        
        // Resistencia del aire
        this.vx *= 0.99;
        this.vy *= 0.99;
    }
    
    render(context) {
        const alpha = this.life / this.maxLife;
        
        context.save();
        context.globalAlpha = alpha;
        
        if (this.glow) {
            context.shadowBlur = 10;
            context.shadowColor = this.color;
        }
        
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        
        context.restore();
    }
}

export default BattleEffects;
