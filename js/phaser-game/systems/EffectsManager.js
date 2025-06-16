// EffectsManager.js - Sistema avanzado de efectos visuales
export class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = new Map();
        this.particleSystems = new Map();
        
        this.initializeParticleSystems();
    }

    initializeParticleSystems() {
        // Sistema de partículas para daño físico
        this.particleSystems.set('physical-damage', {
            texture: 'particle-spark',
            config: {
                scale: { start: 0.3, end: 0 },
                speed: { min: 100, max: 200 },
                lifespan: 400,
                quantity: 15,
                gravityY: 100,
                alpha: { start: 1, end: 0 },
                tint: [0xffffff, 0xffaa00]
            }
        });

        // Sistema de partículas para daño elemental
        this.particleSystems.set('elemental-damage', {
            texture: 'particle-fire',
            config: {
                scale: { start: 0.5, end: 0 },
                speed: { min: 80, max: 180 },
                lifespan: 600,
                quantity: 20,
                alpha: { start: 1, end: 0 },
                tint: [0xff4444, 0xff8844, 0xffff44]
            }
        });

        // Sistema de partículas para habilidades definitivas
        this.particleSystems.set('ultimate-damage', {
            texture: 'particle-smoke',
            config: {
                scale: { start: 0.8, end: 0 },
                speed: { min: 120, max: 250 },
                lifespan: 800,
                quantity: 30,
                alpha: { start: 0.9, end: 0 },
                tint: [0x8844ff, 0x4488ff, 0x44ffff]
            }
        });

        // Sistema de curación
        this.particleSystems.set('heal', {
            texture: 'particle-spark',
            config: {
                scale: { start: 0.2, end: 0 },
                speed: { min: 50, max: 100 },
                lifespan: 1000,
                quantity: 12,
                gravityY: -50,
                alpha: { start: 1, end: 0 },
                tint: [0x44ff44, 0x88ff88]
            }
        });

        // Sistema de buffs/debuffs
        this.particleSystems.set('buff', {
            texture: 'particle-spark',
            config: {
                scale: { start: 0.15, end: 0 },
                speed: { min: 30, max: 60 },
                lifespan: 1500,
                quantity: 8,
                alpha: { start: 0.8, end: 0 },
                tint: [0x4444ff, 0x8888ff]
            }
        });
    }

    // Reproducir efecto de daño
    playDamageEffect(x, y, damage, type = 'physical') {
        // Efectos de partículas
        this.emitParticles(`${type}-damage`, x, y);
        
        // Shake de cámara basado en el daño
        const intensity = Math.min(damage / 100, 0.02);
        this.scene.cameras.main.shake(200, intensity);
        
        // Flash de color
        switch (type) {
            case 'physical':
                this.scene.cameras.main.flash(100, 255, 255, 255, false, 0.3);
                break;
            case 'elemental':
                this.scene.cameras.main.flash(200, 255, 100, 50, false, 0.4);
                break;
            case 'ultimate':
                this.scene.cameras.main.flash(300, 150, 50, 255, false, 0.5);
                break;
        }
        
        // Mostrar número de daño flotante
        this.showFloatingNumber(x, y, `-${damage}`, '#ff4444', 32);
        
        // Efecto de onda expansiva para ataques poderosos
        if (damage > 100) {
            this.createShockwave(x, y, damage / 50);
        }
    }

    // Efecto de curación
    playHealEffect(x, y, amount) {
        this.emitParticles('heal', x, y);
        this.showFloatingNumber(x, y, `+${amount}`, '#44ff44', 28);
        
        // Pulso verde suave
        this.scene.cameras.main.flash(150, 50, 255, 50, false, 0.2);
    }

    // Efecto de buff/debuff
    playBuffEffect(x, y, isPositive = true) {
        const color = isPositive ? '#4444ff' : '#ff4444';
        const particleType = isPositive ? 'buff' : 'physical-damage';
        
        this.emitParticles(particleType, x, y);
        
        // Crear aura temporal alrededor del personaje
        this.createAura(x, y, isPositive);
    }

    // Crear efecto de onda expansiva
    createShockwave(x, y, scale = 1) {
        const shockwave = this.scene.add.graphics();
        shockwave.lineStyle(4, 0xffffff, 1);
        shockwave.strokeCircle(0, 0, 10);
        shockwave.x = x;
        shockwave.y = y;
        
        this.scene.tweens.add({
            targets: shockwave,
            scaleX: scale * 3,
            scaleY: scale * 3,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onComplete: () => shockwave.destroy()
        });
    }

    // Crear aura temporal
    createAura(x, y, isPositive) {
        const color = isPositive ? 0x4444ff : 0xff4444;
        const aura = this.scene.add.graphics();
        aura.fillStyle(color, 0.3);
        aura.fillCircle(0, 0, 60);
        aura.x = x;
        aura.y = y;
        
        // Animación de pulso
        this.scene.tweens.add({
            targets: aura,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 1000,
            ease: 'Sine.easeOut',
            onComplete: () => aura.destroy()
        });
    }

    // Emitir partículas
    emitParticles(systemName, x, y) {
        const system = this.particleSystems.get(systemName);
        if (!system) return;
        
        const emitter = this.scene.add.particles(x, y, system.texture, {
            ...system.config,
            frequency: -1 // Solo emitir una vez
        });
        
        emitter.explode();
        
        // Limpiar después de la animación
        this.scene.time.delayedCall(system.config.lifespan + 100, () => {
            emitter.destroy();
        });
    }

    // Mostrar número flotante
    showFloatingNumber(x, y, text, color, fontSize) {
        const numberText = this.scene.add.text(x, y, text, {
            fontSize: `${fontSize}px`,
            color: color,
            fontFamily: 'Roboto',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Animación del número
        this.scene.tweens.add({
            targets: numberText,
            y: y - 80,
            alpha: 0,
            scale: 1.2,
            duration: 1200,
            ease: 'Power2.easeOut',
            onComplete: () => numberText.destroy()
        });
        
        // Movimiento aleatorio lateral
        this.scene.tweens.add({
            targets: numberText,
            x: x + Phaser.Math.Between(-20, 20),
            duration: 600,
            ease: 'Sine.easeOut'
        });
    }

    // Efecto de entrada de personaje
    playCharacterEntrance(sprite, isEnemy = false) {
        const startX = isEnemy ? 
            this.scene.cameras.main.width + 200 : 
            -200;
        
        sprite.x = startX;
        sprite.setAlpha(0);
        
        // Animación de entrada
        this.scene.tweens.add({
            targets: sprite,
            x: isEnemy ? 
                this.scene.cameras.main.width * 0.75 : 
                this.scene.cameras.main.width * 0.25,
            alpha: 1,
            duration: 1000,
            ease: 'Back.easeOut'
        });
        
        // Efectos de partículas de entrada
        this.scene.time.delayedCall(500, () => {
            this.emitParticles('buff', sprite.x, sprite.y);
        });
    }

    // Efecto de victoria
    playVictoryEffect(x, y) {
        // Múltiples sistemas de partículas
        this.emitParticles('heal', x, y);
        this.emitParticles('buff', x, y);
        
        // Flash dorado
        this.scene.cameras.main.flash(1000, 255, 215, 0, false, 0.6);
        
        // Múltiples ondas expansivas
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                this.createShockwave(x, y, 2 + i * 0.5);
            });
        }
    }

    // Efecto de derrota
    playDefeatEffect(x, y) {
        // Partículas oscuras
        this.emitParticles('ultimate-damage', x, y);
        
        // Fade a negro
        this.scene.cameras.main.fade(1500, 50, 0, 0, false);
        
        // Shake intenso
        this.scene.cameras.main.shake(1000, 0.03);
    }

    // Efecto de crítico
    playCriticalEffect(x, y, damage) {
        // Efectos especiales para críticos
        this.scene.cameras.main.flash(200, 255, 255, 0, false, 0.7);
        this.createShockwave(x, y, 2);
        
        // Número de daño más grande y dorado
        this.showFloatingNumber(x, y, `CRÍTICO!\n-${damage}`, '#ffdd00', 40);
        
        // Partículas especiales
        this.emitParticles('ultimate-damage', x, y);
        
        // Shake más intenso
        this.scene.cameras.main.shake(400, 0.025);
    }

    // Efecto de esquivar
    playDodgeEffect(x, y) {
        this.showFloatingNumber(x, y, 'ESQUIVADO', '#88ccff', 24);
        
        // Partículas de viento
        const windParticles = this.scene.add.particles(x, y, 'particle-spark', {
            scale: { start: 0.1, end: 0 },
            speed: { min: 150, max: 200 },
            lifespan: 300,
            quantity: 8,
            alpha: { start: 0.6, end: 0 },
            tint: [0x88ccff, 0xccffff]
        });
        
        windParticles.explode();
        
        this.scene.time.delayedCall(400, () => {
            windParticles.destroy();
        });
    }

    // Limpiar todos los efectos
    cleanup() {
        this.activeEffects.clear();
        this.particleSystems.clear();
    }
}
