// BattleScene.js - Escena principal de combate
import { EffectsManager } from '../systems/EffectsManager.js';
import { AudioManager } from '../systems/AudioManager.js';

export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
        
        this.champion = null;
        this.enemy = null;
        this.isPlayerTurn = true;
        this.combatActive = true;
        
        // Sistemas avanzados
        this.effectsManager = null;
        this.audioManager = null;
        
        // Efectos visuales (mantenidos para compatibilidad)
        this.particles = {};
        this.tweens = {};
    }    create() {
        console.log('⚔️ Iniciando escena de batalla');
        
        // Obtener datos del registro
        const championData = this.registry.get('championData');
        const enemyData = this.registry.get('enemyData');
        
        // Validar datos antes de continuar
        if (!championData || !enemyData) {
            console.error('❌ Datos de personajes no encontrados');
            return;
        }
        
        // Inicializar sistemas avanzados con manejo de errores
        try {
            this.effectsManager = new EffectsManager(this);
            this.audioManager = new AudioManager(this);
        } catch (error) {
            console.warn('⚠️ Error inicializando sistemas avanzados:', error);
            // Continuar sin los sistemas avanzados
        }
        
        // Crear background
        this.createBackground();
        
        // Crear personajes
        this.createChampion(championData);
        this.createEnemy(enemyData);
        
        // Crear sistema de partículas básico
        this.createParticleSystems();
        
        // Configurar cámaras y efectos
        this.setupCameraEffects();
        
        // Eventos del juego
        this.setupGameEvents();
        
        console.log('✅ Escena de batalla creada');
    }

    createBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Gradiente de fondo
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x2a2a2a, 0x2a2a2a);
        bg.fillRect(0, 0, width, height);
        
        // Líneas de energía animadas
        this.createEnergyLines();
        
        // Efectos de ambiente
        this.createAmbientEffects();
    }

    createEnergyLines() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Crear líneas de energía que cruzan la pantalla
        for (let i = 0; i < 5; i++) {
            const line = this.add.graphics();
            line.lineStyle(2, 0x3498db, 0.3);
            line.beginPath();
            line.moveTo(0, height * (i + 1) / 6);
            line.lineTo(width, height * (i + 1) / 6);
            line.strokePath();
            
            // Animación de pulso
            this.tweens.add({
                targets: line,
                alpha: { from: 0.1, to: 0.5 },
                duration: 2000 + (i * 500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createAmbientEffects() {
        // Partículas de ambiente
        const ambientParticles = this.add.particles(0, 0, 'particle-spark', {
            x: { min: 0, max: this.cameras.main.width },
            y: { min: 0, max: this.cameras.main.height },
            scale: { start: 0.1, end: 0 },
            speed: { min: 10, max: 30 },
            lifespan: 3000,
            frequency: 2000,
            alpha: { start: 0.8, end: 0 }
        });
        
        ambientParticles.setDepth(-1);
    }

    createChampion(championData) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Crear sprite del campeón
        this.champion = {
            sprite: this.add.image(width * 0.25, height * 0.5, 'champion'),
            data: {
                ...championData,
                currentHealth: championData.max_health,
                currentEnergy: 100,
                maxEnergy: 100
            }
        };
        
        // Escalar y posicionar
        this.champion.sprite.setDisplaySize(200, 300);
        this.champion.sprite.setOrigin(0.5, 0.5);
        
        // Efectos del personaje
        this.addCharacterEffects(this.champion.sprite);        // Animación de entrada más sutil
        this.champion.sprite.setAlpha(0);
        this.tweens.add({
            targets: this.champion.sprite,
            alpha: 1,
            duration: 1000,
            ease: 'Power2.easeOut'
        });
    }

    createEnemy(enemyData) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Crear sprite del enemigo
        this.enemy = {
            sprite: this.add.image(width * 0.75, height * 0.5, 'enemy'),
            data: {
                ...enemyData,
                currentHealth: enemyData.max_health,
                currentEnergy: 100,
                maxEnergy: 100
            }
        };
        
        // Escalar y posicionar (flip horizontal para que mire al jugador)
        this.enemy.sprite.setDisplaySize(200, 300);
        this.enemy.sprite.setOrigin(0.5, 0.5);
        this.enemy.sprite.setFlipX(true);
        
        // Efectos del enemigo
        this.addCharacterEffects(this.enemy.sprite, true);        // Animación de entrada más sutil
        this.enemy.sprite.setAlpha(0);
        this.tweens.add({
            targets: this.enemy.sprite,
            alpha: 1,
            duration: 1000,
            ease: 'Power2.easeOut',
            delay: 300
        });
    }    addCharacterEffects(sprite, isEnemy = false) {
        // Brillo sutil estático
        const glow = this.add.graphics();
        const color = isEnemy ? 0xff4444 : 0x44ff44;
        glow.fillStyle(color, 0.1);
        glow.fillCircle(sprite.x, sprite.y, 120);
        glow.setDepth(sprite.depth - 1);
        
        // Solo un pulso muy sutil del glow, sin mover el sprite
        const glowTween = this.tweens.add({
            targets: glow,
            alpha: { from: 0.1, to: 0.2 },
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: function() {
                // Callback vacío para evitar errores
            }
        });
        
        // Guardar referencias para limpieza posterior (sin respiración del sprite)
        sprite.characterTweens = [glowTween];
        sprite.characterGlow = glow;
    }

    createParticleSystems() {
        // Sistema de partículas para ataques
        this.particles.attack = this.add.particles(0, 0, 'particle-fire', {
            scale: { start: 0.5, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 500,
            frequency: -1, // Solo emitir manualmente
            alpha: { start: 1, end: 0 }
        });
        
        // Sistema de partículas para efectos elementales
        this.particles.elemental = this.add.particles(0, 0, 'particle-spark', {
            scale: { start: 0.3, end: 0 },
            speed: { min: 50, max: 150 },
            lifespan: 800,
            frequency: -1,
            alpha: { start: 1, end: 0 }
        });
        
        // Sistema de partículas para efectos definitivos
        this.particles.ultimate = this.add.particles(0, 0, 'particle-smoke', {
            scale: { start: 1, end: 0 },
            speed: { min: 150, max: 300 },
            lifespan: 1200,
            frequency: -1,
            alpha: { start: 0.8, end: 0 }
        });
    }

    setupCameraEffects() {
        // Configurar cámara para efectos de shake
        this.cameras.main.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    }

    setupGameEvents() {
        // Escuchar eventos de la UI
        this.events.on('attack-basic', () => this.performAttack('basic'));
        this.events.on('attack-elemental', () => this.performAttack('elemental'));
        this.events.on('attack-ultimate', () => this.performAttack('ultimate'));
    }

    performAttack(attackType) {
        if (!this.combatActive || !this.isPlayerTurn) return;
        
        console.log(`🗡️ Realizando ataque: ${attackType}`);
        
        // Calcular daño
        const damage = this.calculateDamage(attackType);
        
        // Efectos visuales del ataque
        this.playAttackEffects(attackType, damage);
        
        // Aplicar daño
        this.applyDamage(this.enemy, damage);
        
        // Cambiar turno
        this.isPlayerTurn = false;
        
        // Turno del enemigo después de un delay
        this.time.delayedCall(2000, () => {
            this.enemyTurn();
        });
    }

    calculateDamage(attackType) {
        const champion = this.champion.data;
        let baseDamage = Phaser.Math.Between(champion.attack_min, champion.attack_max);
        
        switch (attackType) {
            case 'basic':
                return baseDamage;
            case 'elemental':
                return Math.floor(baseDamage * 1.5);
            case 'ultimate':
                return Math.floor(baseDamage * 2.5);
            default:
                return baseDamage;
        }
    }    playAttackEffects(attackType, damage) {
        // Reproducir sonido del ataque (con manejo de errores)
        try {
            if (this.audioManager) {
                this.audioManager.playSound(`attack-${attackType}`);
            }
        } catch (error) {
            console.warn('⚠️ Error reproduciendo audio:', error);
        }
          // Animación del atacante - movimiento sutil
        const originalX = this.champion.sprite.x;
        this.tweens.add({
            targets: this.champion.sprite,
            x: originalX + 30, // Movimiento más sutil
            duration: 150,
            ease: 'Power2.easeOut',
            yoyo: true,
            onComplete: () => {
                // Asegurar que vuelva a la posición exacta
                this.champion.sprite.x = originalX;
            }
        });
        
        // Usar el sistema avanzado de efectos si está disponible
        const targetX = this.enemy.sprite.x;
        const targetY = this.enemy.sprite.y;
        
        try {
            if (this.effectsManager) {
                // Determinar si es crítico (20% de probabilidad)
                const isCritical = Math.random() < 0.2;
                
                if (isCritical) {
                    this.effectsManager.playCriticalEffect(targetX, targetY, damage * 1.5);
                } else {
                    this.effectsManager.playDamageEffect(targetX, targetY, damage, attackType);
                }
            } else {
                // Fallback a efectos básicos
                this.playBasicAttackEffects(attackType, targetX, targetY, damage);
            }
        } catch (error) {
            console.warn('⚠️ Error en efectos visuales:', error);
            this.playBasicAttackEffects(attackType, targetX, targetY, damage);
        }
    }
    
    playBasicAttackEffects(attackType, targetX, targetY, damage) {
        // Efectos básicos sin sistemas avanzados
        switch (attackType) {
            case 'basic':
                this.cameras.main.flash(100, 255, 255, 255, false, 0.3);
                break;
            case 'elemental':
                this.cameras.main.flash(200, 255, 100, 50, false, 0.4);
                break;
            case 'ultimate':
                this.cameras.main.flash(300, 150, 50, 255, false, 0.5);
                this.cameras.main.shake(200, 0.01);
                break;
        }
        
        // Mostrar número de daño básico
        this.showBasicDamageNumber(targetX, targetY, damage);
    }

    showDamageNumber(x, y, damage) {
        const damageText = this.add.text(x, y - 50, `-${damage}`, {
            fontSize: '32px',
            color: '#ff4444',
            fontFamily: 'Roboto',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Animación del número de daño
        this.tweens.add({
            targets: damageText,
            y: y - 100,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }    showBasicDamageNumber(x, y, damage) {
        const damageText = this.add.text(x, y - 50, `-${damage}`, {
            fontSize: '32px',
            color: '#ff4444',
            fontFamily: 'Roboto',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Animación básica del número de daño
        this.tweens.add({
            targets: damageText,
            y: y - 100,
            alpha: 0,
            scale: 1.2,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                if (damageText && damageText.destroy) {
                    damageText.destroy();
                }
            }
        });
    }

    applyDamage(target, damage) {
        target.data.currentHealth = Math.max(0, target.data.currentHealth - damage);
        
        // Reproducir sonido de daño
        this.audioManager.playSound('damage');
        
        // Animación de daño mejorada
        this.tweens.add({
            targets: target.sprite,
            tint: 0xff4444,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                target.sprite.clearTint();
            }
        });
        
        // Actualizar UI
        this.events.emit('health-updated', {
            champion: this.champion.data,
            enemy: this.enemy.data
        });
        
        // Verificar fin del combate
        if (target.data.currentHealth <= 0) {
            this.endCombat(target === this.enemy);
        }
    }    enemyTurn() {
        if (!this.combatActive) return;
        
        // IA simple del enemigo
        const damage = Phaser.Math.Between(
            this.enemy.data.attack_min,
            this.enemy.data.attack_max
        );
        
        // Efectos del ataque enemigo - movimiento sutil
        const originalX = this.enemy.sprite.x;
        this.tweens.add({
            targets: this.enemy.sprite,
            x: originalX - 30, // Movimiento más sutil
            duration: 150,
            ease: 'Power2.easeOut',
            yoyo: true,
            onComplete: () => {
                // Asegurar que vuelva a la posición exacta
                this.enemy.sprite.x = originalX;
            }
        });
        
        // Efectos de partículas básicos si están disponibles
        if (this.particles.attack) {
            this.particles.attack.emitParticleAt(this.champion.sprite.x, this.champion.sprite.y, 8);
        }
        
        this.showBasicDamageNumber(this.champion.sprite.x, this.champion.sprite.y, damage);
        
        // Aplicar daño al jugador
        this.applyDamage(this.champion, damage);
        
        // Volver al turno del jugador
        this.time.delayedCall(1500, () => {
            this.isPlayerTurn = true;
        });
    }endCombat(playerWon) {
        this.combatActive = false;
        
        // Limpiar todos los tweens activos para evitar errores
        this.tweens.killAll();
        
        if (playerWon) {
            console.log('🎉 ¡Victoria!');
            
            try {
                if (this.audioManager) {
                    this.audioManager.playSound('victory');
                }
                if (this.effectsManager) {
                    this.effectsManager.playVictoryEffect(
                        this.cameras.main.width / 2,
                        this.cameras.main.height / 2
                    );
                }
            } catch (error) {
                console.warn('⚠️ Error en efectos de victoria:', error);
            }
            
            // Efectos básicos como fallback
            this.cameras.main.flash(1000, 100, 255, 100);
        } else {
            console.log('💀 Derrota...');
            
            try {
                if (this.audioManager) {
                    this.audioManager.playSound('defeat');
                }
                if (this.effectsManager) {
                    this.effectsManager.playDefeatEffect(
                        this.champion.sprite.x,
                        this.champion.sprite.y
                    );
                }
            } catch (error) {
                console.warn('⚠️ Error en efectos de derrota:', error);
            }
            
            // Efectos básicos como fallback
            this.cameras.main.fade(1000, 100, 0, 0);
        }
        
        // Emitir evento para la UI
        this.events.emit('combat-ended', { playerWon });
    }

    update() {
        // Actualizaciones por frame si es necesario
        // Mantener vacío para evitar problemas de callbacks
    }

    shutdown() {
        // Limpiar recursos cuando se cierra la escena
        console.log('🧹 Limpiando recursos de BattleScene');
        
        // Limpiar tweens
        if (this.tweens) {
            this.tweens.killAll();
        }
        
        // Limpiar efectos de personajes
        if (this.champion && this.champion.sprite) {
            if (this.champion.sprite.characterTweens) {
                this.champion.sprite.characterTweens.forEach(tween => {
                    if (tween && tween.remove) tween.remove();
                });
            }
            if (this.champion.sprite.characterGlow && this.champion.sprite.characterGlow.destroy) {
                this.champion.sprite.characterGlow.destroy();
            }
        }
        
        if (this.enemy && this.enemy.sprite) {
            if (this.enemy.sprite.characterTweens) {
                this.enemy.sprite.characterTweens.forEach(tween => {
                    if (tween && tween.remove) tween.remove();
                });
            }
            if (this.enemy.sprite.characterGlow && this.enemy.sprite.characterGlow.destroy) {
                this.enemy.sprite.characterGlow.destroy();
            }
        }
        
        // Limpiar sistemas avanzados
        try {
            if (this.effectsManager && this.effectsManager.cleanup) {
                this.effectsManager.cleanup();
            }
            if (this.audioManager && this.audioManager.cleanup) {
                this.audioManager.cleanup();
            }
        } catch (error) {
            console.warn('⚠️ Error limpiando sistemas:', error);
        }
        
        // Limpiar partículas
        Object.values(this.particles).forEach(particle => {
            if (particle && particle.destroy) {
                particle.destroy();
            }
        });
        
        this.particles = {};
    }
}
