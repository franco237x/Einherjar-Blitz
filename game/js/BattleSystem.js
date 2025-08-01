/**
 * Sistema de Batalla Principal - Einherjar Blitz
 * Maneja toda la lógica del combate por turnos
 */

import { createCharacterById, getElementalEffectiveness, calculateElementalDamage } from '../../characters/index.js';

export class BattleSystem {
    constructor() {
        this.player = null;
        this.enemy = null;
        this.currentTurn = 'player';
        this.round = 1;
        this.battleStartTime = null;
        this.battleLog = [];
        this.isProcessingTurn = false;
        this.battleEnded = false;
        
        // Configuración de batalla
        this.config = {
            maxRounds: 50,
            turnTimeout: 30000, // 30 segundos por turno
            animationSpeed: 'normal',
            showDamageNumbers: true
        };
        
        // Estadísticas de batalla
        this.stats = {
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            turnsPlayed: 0,
            specialAbilitiesUsed: 0,
            criticalHits: 0
        };
        
        this.turnTimer = null;
    }
    
    /**
     * Inicializa la batalla con los personajes seleccionados
     */
    async initializeBattle(playerCharacterId, enemyCharacterId = null) {
        try {
            // Crear personaje del jugador
            this.player = createCharacterById(playerCharacterId);
            
            // Si no se especifica enemigo, seleccionar uno aleatorio
            if (!enemyCharacterId) {
                const availableEnemies = [1, 2, 3, 4];
                const filteredEnemies = availableEnemies.filter(id => id !== playerCharacterId);
                enemyCharacterId = filteredEnemies[Math.floor(Math.random() * filteredEnemies.length)];
            }
            
            this.enemy = createCharacterById(enemyCharacterId);
            
            // Configurar estado inicial
            this.battleStartTime = Date.now();
            this.currentTurn = 'player'; // Player siempre inicia
            this.battleLog = [];
            this.battleEnded = false;
            
            // Log inicial
            this.addLogEntry('system', `¡La batalla comienza! ${this.player.stats.name} vs ${this.enemy.stats.name}`);
            this.addLogEntry('system', `${this.currentTurn === 'player' ? this.player.stats.name : this.enemy.stats.name} tiene el primer turno`);
            
            return {
                success: true,
                player: this.player.getStats(),
                enemy: this.enemy.getStats(),
                currentTurn: this.currentTurn
            };
            
        } catch (error) {
            console.error('Error inicializando batalla:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Procesa una acción del jugador
     */
    async processPlayerAction(action, target = 'enemy') {
        if (this.isProcessingTurn || this.battleEnded) {
            return { success: false, message: 'Acción no permitida en este momento' };
        }
        
        if (this.currentTurn !== 'player') {
            return { success: false, message: 'No es tu turno' };
        }
        
        this.isProcessingTurn = true;
        
        try {
            let result;
            
            switch (action) {
                case 'attack':
                    result = await this.performAttack(this.player, this.enemy);
                    break;
                case 'defend':
                    result = await this.performDefend(this.player);
                    break;
                case 'special':
                    result = await this.performSpecialAbility(this.player, this.enemy);
                    break;
                case 'heal':
                    result = await this.performHeal(this.player);
                    break;
                default:
                    result = { success: false, message: 'Acción no válida' };
            }
            
            if (result.success) {
                this.stats.turnsPlayed++;
                
                // Verificar si la batalla terminó
                if (this.checkBattleEnd()) {
                    this.isProcessingTurn = false;
                    return result;
                }
                
                // Cambiar turno al enemigo
                this.currentTurn = 'enemy';
            }
            
            this.isProcessingTurn = false;
            return result;
            
        } catch (error) {
            this.isProcessingTurn = false;
            console.error('Error procesando acción:', error);
            return { success: false, message: 'Error procesando acción' };
        }
    }
    
    /**
     * Procesa el turno del enemigo (IA simple)
     */
    async processEnemyTurn() {
        if (this.battleEnded || this.currentTurn !== 'enemy') {
            return;
        }
        
        this.isProcessingTurn = true;
        
        try {
            // IA simple: decidir acción basada en estado
            const enemyHealthPercent = this.enemy.stats.health.current / this.enemy.stats.health.max;
            const enemyEnergyPercent = this.enemy.stats.energy / this.enemy.stats.maxEnergy;
            
            let action;
            
            if (enemyHealthPercent < 0.3 && enemyEnergyPercent >= 0.2) {
                // Vida baja: intentar curar
                action = Math.random() < 0.6 ? 'heal' : 'defend';
            } else if (enemyEnergyPercent >= 0.35 && Math.random() < 0.4) {
                // Energía suficiente: usar habilidad especial
                action = 'special';
            } else if (enemyHealthPercent < 0.5 && Math.random() < 0.3) {
                // Vida media-baja: defender ocasionalmente
                action = 'defend';
            } else {
                // Por defecto: atacar
                action = 'attack';
            }
            
            let result;
            
            switch (action) {
                case 'attack':
                    result = await this.performAttack(this.enemy, this.player);
                    break;
                case 'defend':
                    result = await this.performDefend(this.enemy);
                    break;
                case 'special':
                    result = await this.performSpecialAbility(this.enemy, this.player);
                    break;
                case 'heal':
                    result = await this.performHeal(this.enemy);
                    break;
            }
            
            // Verificar fin de batalla
            if (this.checkBattleEnd()) {
                this.isProcessingTurn = false;
                return;
            }
            
            // Cambiar turno al jugador
            this.currentTurn = 'player';
            this.round++;
            
            // Procesar efectos de estado al final del turno
            this.processStatusEffects();
            
            this.isProcessingTurn = false;
            
            // Notificar cambio de turno
            return {
                success: true,
                currentTurn: this.currentTurn,
                round: this.round,
                action: action,
                result: result
            };
            
        } catch (error) {
            this.isProcessingTurn = false;
            console.error('Error en turno enemigo:', error);
        }
    }
    
    /**
     * Realiza un ataque básico
     */
    async performAttack(attacker, defender) {
        const attackResult = attacker.calculateAttackDamage();
        let damage = attackResult.damage || attackResult;
        let isCritical = attackResult.critical || false;
        
        // Aplicar efectividad elemental
        const elementalResult = calculateElementalDamage(
            damage,
            attacker.stats.element,
            defender
        );
        
        damage = elementalResult.damage;
        const effectiveness = elementalResult.effectiveness;
        
        // Aplicar daño al defensor
        const damageDealt = defender.takeDamage(damage);
        const actualDamage = damageDealt.damage || damageDealt;
        const dodged = damageDealt.dodged || false;
        
        // Actualizar estadísticas
        if (attacker === this.player) {
            this.stats.totalDamageDealt += actualDamage;
        } else {
            this.stats.totalDamageReceived += actualDamage;
        }
        
        if (isCritical) {
            this.stats.criticalHits++;
        }
        
        // Crear mensaje de log
        let logMessage = `${attacker.stats.name} ataca a ${defender.stats.name}`;
        
        if (dodged) {
            logMessage += ' pero el ataque fue esquivado!';
            this.addLogEntry('system', logMessage);
        } else {
            logMessage += ` causando ${actualDamage} de daño`;
            
            if (isCritical) {
                logMessage += ' (¡Crítico!)';
            }
            
            if (effectiveness > 1) {
                logMessage += ' (¡Super efectivo!)';
            } else if (effectiveness < 1) {
                logMessage += ' (No muy efectivo...)';
            }
            
            this.addLogEntry('damage', logMessage);
        }
        
        return {
            success: true,
            action: 'attack',
            attacker: attacker.stats.name,
            defender: defender.stats.name,
            damage: actualDamage,
            critical: isCritical,
            dodged: dodged,
            effectiveness: effectiveness,
            defenderHealth: defender.stats.health.current
        };
    }
    
    /**
     * Realiza una acción de defensa
     */
    async performDefend(character) {
        // Aumentar temporalmente la defensa y regenerar un poco de energía
        const energyRegenerated = Math.min(15, character.stats.maxEnergy - character.stats.energy);
        character.stats.energy += energyRegenerated;
        
        // Aplicar efecto de defensa (eliminar efectos de defensa previos para evitar acumulación)
        character.stats.statusEffects = character.stats.statusEffects || [];
        character.stats.statusEffects = character.stats.statusEffects.filter(effect => effect.type !== 'defend');
        
        character.stats.statusEffects.push({
            type: 'defend',
            duration: 1,
            effect: 'damage_reduction',
            value: 50
        });
        
        this.addLogEntry('system', `${character.stats.name} se defiende y regenera ${energyRegenerated} energía`);
        
        return {
            success: true,
            action: 'defend',
            character: character.stats.name,
            energyRegenerated: energyRegenerated
        };
    }
    
    /**
     * Ejecuta habilidad especial del personaje
     */
    async performSpecialAbility(character, target) {
        // Verificar si tiene suficiente energía
        const energyCost = this.getSpecialAbilityCost(character.stats);
        
        if (character.stats.energy < energyCost) {
            this.addLogEntry('system', `${character.stats.name} no tiene suficiente energía para usar su habilidad especial`);
            return {
                success: false,
                message: 'Energía insuficiente',
                energyNeeded: energyCost,
                currentEnergy: character.stats.energy
            };
        }
        
        // Consumir energía
        character.stats.energy -= energyCost;
        this.stats.specialAbilitiesUsed++;
        
        // Ejecutar habilidad específica por personaje
        let result;
        
        switch (character.stats.name) {
            case 'Shuna Shieda':
                result = this.shunaSpecialAbility(character, target);
                break;
            case 'Ozen Kimura':
                result = this.ozenSpecialAbility(character, target);
                break;
            case 'Xair Chikyu':
                result = this.xairSpecialAbility(character, target);
                break;
            case 'Nathan Doffens':
                result = this.nathanSpecialAbility(character, target);
                break;
            default:
                result = this.defaultSpecialAbility(character, target);
        }
        
        this.addLogEntry('player-action', `${character.stats.name} usa su habilidad especial: ${result.abilityName}`);
        this.addLogEntry('system', result.description);
        
        return {
            success: true,
            action: 'special',
            character: character.stats.name,
            result: result
        };
    }
    
    /**
     * Realiza curación
     */
    async performHeal(character) {
        const energyCost = 20;
        
        if (character.stats.energy < energyCost) {
            return {
                success: false,
                message: 'Energía insuficiente para curar'
            };
        }
        
        const healAmount = Math.floor(character.stats.health.max * 0.25); // 25% de vida máxima
        const actualHeal = Math.min(healAmount, character.stats.health.max - character.stats.health.current);
        
        character.stats.energy -= energyCost;
        character.heal(actualHeal);
        
        this.addLogEntry('heal', `${character.stats.name} se cura ${actualHeal} puntos de vida`);
        
        return {
            success: true,
            action: 'heal',
            character: character.stats.name,
            healAmount: actualHeal,
            currentHealth: character.stats.health.current
        };
    }
    
    /**
     * Habilidades especiales por personaje
     */
    shunaSpecialAbility(character, target) {
        const damage = character.calculateAttackDamage() * 1.8;
        const actualDamage = target.takeDamage(Math.floor(damage));
        
        return {
            abilityName: 'Furia Devastadora',
            description: `Shuna desata su furia causando ${actualDamage} de daño devastador`,
            damage: actualDamage,
            targetHealth: target.stats.health.current
        };
    }
    
    ozenSpecialAbility(character, target) {
        character.stats.statusEffects = character.stats.statusEffects || [];
        // Eliminar buffs de armadura previos para evitar acumulación
        character.stats.statusEffects = character.stats.statusEffects.filter(effect => effect.type !== 'armor_boost');
        
        character.stats.statusEffects.push({
            type: 'armor_boost',
            duration: 3,
            effect: 'armor_increase',
            value: 25
        });
        
        return {
            abilityName: 'Muralla Inamovible',
            description: 'Ozen fortalece su armadura durante 3 turnos',
            armorBoost: 25,
            duration: 3
        };
    }
    
    xairSpecialAbility(character, target) {
        const damage = character.calculateAttackDamage() * 1.5;
        const actualDamage = target.takeDamage(Math.floor(damage));
        
        // Posibilidad de congelar
        if (Math.random() < 0.3) {
            target.stats.statusEffects = target.stats.statusEffects || [];
            target.stats.statusEffects.push({
                type: 'freeze',
                duration: 1,
                effect: 'skip_turn'
            });
        }
        
        return {
            abilityName: 'Viento Gélido',
            description: `Xair ataca con hielo causando ${actualDamage} de daño`,
            damage: actualDamage,
            freezeChance: 30,
            targetHealth: target.stats.health.current
        };
    }
    
    nathanSpecialAbility(character, target) {
        const firstAttack = character.calculateAttackDamage();
        let totalDamage = target.takeDamage(firstAttack);
        
        // 40% chance de segundo ataque
        if (Math.random() < 0.4) {
            const secondAttack = character.calculateAttackDamage();
            totalDamage += target.takeDamage(secondAttack);
        }
        
        return {
            abilityName: 'Teletransporte Paradójico',
            description: `Nathan se teletransporta y ataca causando ${totalDamage} de daño total`,
            damage: totalDamage,
            targetHealth: target.stats.health.current
        };
    }
    
    defaultSpecialAbility(character, target) {
        const damage = character.calculateAttackDamage() * 1.3;
        const actualDamage = target.takeDamage(Math.floor(damage));
        
        return {
            abilityName: 'Ataque Especial',
            description: `${character.stats.name} usa un ataque especial causando ${actualDamage} de daño`,
            damage: actualDamage,
            targetHealth: target.stats.health.current
        };
    }
    
    /**
     * Obtiene el costo de energía de la habilidad especial
     */
    getSpecialAbilityCost(character) {
        switch (character.name) {
            case 'Shuna Shieda':
                return 35;
            case 'Ozen Kimura':
                return 30;
            case 'Xair Chikyu':
                return 25;
            case 'Nathan Doffens':
                return 35;
            default:
                return 30;
        }
    }
    
    /**
     * Verifica si la batalla ha terminado
     */
    checkBattleEnd() {
        if (this.battleEnded) return true;
        
        const playerDead = !this.player.isAlive();
        const enemyDead = !this.enemy.isAlive();
        const maxRoundsReached = this.round >= this.config.maxRounds;
        
        if (playerDead || enemyDead || maxRoundsReached) {
            this.battleEnded = true;
            
            let winner, result;
            if (playerDead && enemyDead) {
                winner = 'draw';
                result = 'Empate';
            } else if (playerDead) {
                winner = 'enemy';
                result = 'Derrota';
            } else if (enemyDead) {
                winner = 'player';
                result = 'Victoria';
            } else {
                // Máximo de rondas alcanzado
                const playerHealthPercent = this.player.stats.health.current / this.player.stats.health.max;
                const enemyHealthPercent = this.enemy.stats.health.current / this.enemy.stats.health.max;
                
                if (playerHealthPercent > enemyHealthPercent) {
                    winner = 'player';
                    result = 'Victoria por tiempo';
                } else if (enemyHealthPercent > playerHealthPercent) {
                    winner = 'enemy';
                    result = 'Derrota por tiempo';
                } else {
                    winner = 'draw';
                    result = 'Empate por tiempo';
                }
            }
            
            this.addLogEntry('system', `¡La batalla ha terminado! ${result}`);
            
            return {
                ended: true,
                winner: winner,
                result: result,
                duration: Date.now() - this.battleStartTime,
                stats: this.stats
            };
        }
        
        return false;
    }
    
    /**
     * Añade entrada al log de batalla
     */
    addLogEntry(type, message) {
        const logEntry = {
            type: type,
            message: message,
            timestamp: Date.now(),
            round: this.round
        };
        
        this.battleLog.push(logEntry);
        
        // Limitar el log a las últimas 50 entradas
        if (this.battleLog.length > 50) {
            this.battleLog.shift();
        }
        
        return logEntry;
    }
    
    /**
     * Obtiene el estado actual de la batalla
     */
    getBattleState() {
        return {
            player: this.player ? this.player.getStats() : null,
            enemy: this.enemy ? this.enemy.getStats() : null,
            currentTurn: this.currentTurn,
            round: this.round,
            battleLog: this.battleLog,
            isProcessingTurn: this.isProcessingTurn,
            battleEnded: this.battleEnded,
            stats: this.stats,
            duration: this.battleStartTime ? Date.now() - this.battleStartTime : 0
        };
    }
    
    /**
     * Procesa efectos de estado (reducir duración, eliminar expirados)
     */
    processStatusEffects() {
        [this.player, this.enemy].forEach(character => {
            if (character && character.stats.statusEffects) {
                // Reducir duración y filtrar efectos expirados
                character.stats.statusEffects = character.stats.statusEffects
                    .map(effect => ({
                        ...effect,
                        duration: effect.duration - 1
                    }))
                    .filter(effect => effect.duration > 0);
            }
        });
    }
    
    /**
     * Reinicia la batalla
     */
    resetBattle() {
        if (this.player) this.player.reset();
        if (this.enemy) this.enemy.reset();
        
        this.currentTurn = 'player'; // Player siempre inicia
        this.round = 1;
        this.battleStartTime = Date.now();
        this.battleLog = [];
        this.isProcessingTurn = false;
        this.battleEnded = false;
        this.stats = {
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            turnsPlayed: 0,
            specialAbilitiesUsed: 0,
            criticalHits: 0
        };
        
        this.addLogEntry('system', `¡La batalla se reinicia! ${this.player.stats.name} vs ${this.enemy.stats.name}`);
    }
}
