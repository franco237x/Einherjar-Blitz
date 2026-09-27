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
        this.battleResult = null; // Almacenar el resultado de la batalla
        
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
            
            // Verificar qué acciones están disponibles
            const canUseSpecial = this.canUseSpecialAbility(this.enemy);
            const canHeal = this.enemy.stats.energy >= 20 && this.enemy.stats.health.current < this.enemy.stats.health.max;
            
            let action;
            let actionAttempts = 0;
            let result = null;
            
            // Bucle para encontrar una acción válida (máximo 3 intentos)
            while (!result || !result.success) {
                actionAttempts++;
                
                if (actionAttempts > 3) {
                    // Si no puede hacer nada más, simplemente atacar
                    action = 'attack';
                    break;
                }
                
                // Lógica de decisión mejorada
                if (enemyHealthPercent < 0.3 && canHeal && Math.random() < 0.7) {
                    // Vida baja: intentar curar si puede
                    action = 'heal';
                } else if (enemyHealthPercent < 0.3 && Math.random() < 0.5) {
                    // Vida baja sin energía para curar: defender
                    action = 'defend';
                } else if (canUseSpecial.canUse && enemyEnergyPercent >= 0.35 && Math.random() < 0.4) {
                    // Energía suficiente y habilidad especial disponible
                    action = 'special';
                } else if (enemyHealthPercent < 0.6 && Math.random() < 0.25) {
                    // Vida media-baja: defender ocasionalmente
                    action = 'defend';
                } else {
                    // Por defecto: atacar
                    action = 'attack';
                }
                
                // Intentar ejecutar la acción
                switch (action) {
                    case 'attack':
                        result = await this.performAttack(this.enemy, this.player);
                        break;
                    case 'defend':
                        result = await this.performDefend(this.enemy);
                        break;
                    case 'special':
                        if (canUseSpecial.canUse) {
                            result = await this.performSpecialAbility(this.enemy, this.player);
                        } else {
                            // Si no puede usar especial, cambiar a ataque
                            action = 'attack';
                            result = await this.performAttack(this.enemy, this.player);
                        }
                        break;
                    case 'heal':
                        if (canHeal) {
                            result = await this.performHeal(this.enemy);
                        } else {
                            // Si no puede curar, cambiar a defender
                            action = 'defend';
                            result = await this.performDefend(this.enemy);
                        }
                        break;
                }
                
                // Si la acción falló, intentar con ataque básico
                if (!result || !result.success) {
                    action = 'attack';
                    result = await this.performAttack(this.enemy, this.player);
                }
            }
            
            // Verificar fin de batalla después de una acción exitosa
            const battleEnd = this.checkBattleEnd();
            if (battleEnd) {
                this.isProcessingTurn = false;
                return {
                    success: true,
                    currentTurn: this.currentTurn,
                    round: this.round,
                    action: action,
                    result: result,
                    battleEnded: true,
                    battleResult: battleEnd
                };
            }
            
            // Cambiar turno al jugador solo si la acción fue exitosa
            if (result && result.success) {
                this.currentTurn = 'player';
                this.round++;
                
                // Procesar efectos de estado al final del turno
                this.processStatusEffects();
                
                // Verificar de nuevo si la batalla terminó después de procesar efectos
                const battleEndAfterEffects = this.checkBattleEnd();
                if (battleEndAfterEffects) {
                    this.isProcessingTurn = false;
                    return {
                        success: true,
                        currentTurn: this.currentTurn,
                        round: this.round,
                        action: action,
                        result: result,
                        battleEnded: true,
                        battleResult: battleEndAfterEffects
                    };
                }
            }
            
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
            
            // En caso de error, forzar ataque básico
            try {
                const emergencyResult = await this.performAttack(this.enemy, this.player);
                this.currentTurn = 'player';
                this.round++;
                return {
                    success: true,
                    currentTurn: this.currentTurn,
                    round: this.round,
                    action: 'attack',
                    result: emergencyResult
                };
            } catch (emergencyError) {
                console.error('Error crítico en turno enemigo:', emergencyError);
                // Forzar fin de batalla para evitar bucle infinito
                this.battleEnded = true;
                return {
                    success: false,
                    error: 'Error crítico en IA del enemigo'
                };
            }
        }
    }
    
    /**
     * Realiza un ataque básico
     */
    async performAttack(attacker, defender) {
        const attackResult = attacker.calculateAttackDamage();
        let damage = attackResult.damage || attackResult;
        let isCritical = attackResult.critical || false;
        
        // Aplicar modificadores de efectos especiales del atacante
        const attackerEffects = attacker.stats.statusEffects || [];
        
        // Nathan: Doble ataque cuando tiene Modo Kami activo
        const nathanEffect = attackerEffects.find(effect => effect.type === 'nathan_ultimate');
        if (nathanEffect) {
            damage *= nathanEffect.attackMultiplier;
        }
        
        // Shuna: Estadísticas duplicadas
        const shunaEffect = attackerEffects.find(effect => effect.type === 'shuna_ultimate');
        if (shunaEffect) {
            damage *= shunaEffect.statsMultiplier;
        }
        
        // Xair: Triple daño con Corte Molecular
        const xairEffect = attackerEffects.find(effect => effect.type === 'xair_molecular_cut');
        if (xairEffect) {
            damage *= xairEffect.damageMultiplier;
        }
        
        // Aplicar efectividad elemental
        const elementalResult = calculateElementalDamage(
            damage,
            attacker.stats.element,
            defender
        );
        
        damage = elementalResult.damage;
        const effectiveness = elementalResult.effectiveness;
        
        // Aplicar modificadores de defensa del defensor
        const defenderEffects = defender.stats.statusEffects || [];
        
        // Nathan: 50% reducción de daño recibido
        const nathanDefenseEffect = defenderEffects.find(effect => effect.type === 'nathan_ultimate');
        if (nathanDefenseEffect) {
            damage *= (1 - nathanDefenseEffect.damageReduction / 100);
        }
        
        // Xair: Doble reducción de defensa al enemigo
        if (xairEffect) {
            damage *= xairEffect.defenseReduction;
        }
        
        // Aplicar daño al defensor
        const actualDamage = defender.takeDamage(Math.floor(damage));
        const dodged = actualDamage === 0 && damage > 0; // Si se calculó daño pero el resultado es 0, fue esquivado
        
        // Actualizar estadísticas
        if (attacker === this.player) {
            this.stats.totalDamageDealt += actualDamage;
        } else {
            this.stats.totalDamageReceived += actualDamage;
        }
        
        if (isCritical) {
            this.stats.criticalHits++;
        }
        
        // Crear mensaje de log con nombre del ataque
        const attackName = this.getAttackName(attacker, 'basic');
        let logMessage = `${attacker.stats.name} usa "${attackName}" contra ${defender.stats.name}`;
        
        if (dodged) {
            logMessage += ' pero el ataque fue esquivado!';
            this.addLogEntry('system', logMessage);
        } else {
            logMessage += ` causando ${actualDamage} de daño`;
            
            if (isCritical) {
                logMessage += ' (¡Crítico!)';
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
        // Verificar si el personaje tiene un método de defensa personalizado (como Zack)
        if (character.defend && typeof character.defend === 'function') {
            const customDefenseResult = character.defend();
            const defendName = this.getDefendName(character);
            this.addLogEntry('system', `${character.stats.name} usa "${defendName}" - ${customDefenseResult.message}`);
            
            // Actualizar estadísticas visuales para mostrar el efecto de defensa personalizada
            if (this.ui) {
                const isPlayer = character === this.player;
                this.ui.updateCharacterDisplay(isPlayer ? 'player' : 'enemy', character.stats);
            }
            
            return {
                success: true,
                action: 'defend',
                character: character.stats.name,
                energyRegenerated: customDefenseResult.energyGained || 0,
                customEffect: true
            };
        }
        
        // Comportamiento de defensa estándar
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
        
        const defendName = this.getDefendName(character);
        this.addLogEntry('system', `${character.stats.name} usa "${defendName}" y regenera ${energyRegenerated} energía`);
        
        // Actualizar estadísticas visuales para mostrar el efecto de defensa
        if (this.ui) {
            const isPlayer = character === this.player;
            this.ui.updateCharacterDisplay(isPlayer ? 'player' : 'enemy', character.stats);
        }
        
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
        
        // Verificar si ya hay una habilidad especial activa para evitar sobreescritura
        const activeSpecialAbility = this.checkActiveSpecialAbility(character);
        if (activeSpecialAbility) {
            this.addLogEntry('system', `${character.stats.name} ya tiene "${activeSpecialAbility.abilityName}" activa (${activeSpecialAbility.remainingTurns} turnos restantes)`);
            return {
                success: false,
                message: 'Habilidad especial ya activa',
                activeAbility: activeSpecialAbility.abilityName,
                remainingTurns: activeSpecialAbility.remainingTurns
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
            case 'Zack Hisoka':
                result = this.zackSpecialAbility(character, target);
                break;
            default:
                result = this.defaultSpecialAbility(character, target);
        }
        
        this.addLogEntry('player-action', `${character.stats.name} usa "${result.abilityName}"`);
        this.addLogEntry('system', result.description);
        
        // Actualizar estadísticas visuales para reflejar los efectos aplicados
        if (this.ui) {
            // Determinar qué personajes actualizar
            const isPlayer = character === this.player;
            const isTarget = target === (isPlayer ? this.enemy : this.player);
            
            // Actualizar estadísticas del personaje que usó la habilidad
            this.ui.updateCharacterDisplay(isPlayer ? 'player' : 'enemy', character.stats);
            
            // Actualizar estadísticas del objetivo si fue afectado
            if (isTarget) {
                this.ui.updateCharacterDisplay(isPlayer ? 'enemy' : 'player', target.stats);
            }
        }
        
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
        
        // Verificar si el personaje tiene curación personalizada (como Zack)
        if (character.heal && typeof character.heal === 'function' && character.stats.name === 'Zack Hisoka') {
            character.stats.energy -= energyCost;
            const customHealResult = character.heal(0); // Zack no se cura, sino que gana energía
            
            const healName = this.getHealName(character);
            this.addLogEntry('heal', `${character.stats.name} usa "${healName}" - ${customHealResult.message}`);
            
            return {
                success: true,
                action: 'heal',
                character: character.stats.name,
                healAmount: customHealResult.healing,
                energyGained: customHealResult.energyGained,
                currentHealth: character.stats.health.current,
                customEffect: true
            };
        }
        
        // Curación estándar para otros personajes
        const healAmount = Math.floor(character.stats.health.max * 0.10); // 10% de vida máxima
        const actualHeal = Math.min(healAmount, character.stats.health.max - character.stats.health.current);
        
        character.stats.energy -= energyCost;
        character.heal(actualHeal);
        
        const healName = this.getHealName(character);
        this.addLogEntry('heal', `${character.stats.name} usa "${healName}" y se cura ${actualHeal} puntos de vida`);
        
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
        // Duplicar todas las estadísticas por 4 turnos
        character.stats.statusEffects = character.stats.statusEffects || [];
        
        // Eliminar efectos previos para evitar acumulación
        character.stats.statusEffects = character.stats.statusEffects.filter(
            effect => effect.type !== 'shuna_ultimate'
        );
        
        character.stats.statusEffects.push({
            type: 'shuna_ultimate',
            duration: 4,
            effect: 'stats_doubled',
            statsMultiplier: 2,
            attackMultiplier: 2,
            defenseMultiplier: 2
        });
        
        // Aplicar quemadura al enemigo
        target.stats.statusEffects = target.stats.statusEffects || [];
        target.stats.statusEffects.push({
            type: 'burn',
            duration: 4,
            effect: 'damage_over_time',
            damagePerTurn: 40
        });
        
        return {
            abilityName: 'Despertar Primordial',
            description: 'Shuna despierta su poder primordial: duplica todas sus estadísticas por 4 turnos y aplica quemadura al enemigo (40 daño/turno)',
            statsBoost: 100,
            burnDamage: 40,
            duration: 4
        };
    }
    
    ozenSpecialAbility(character, target) {
        // Ataque masivo entre 300-400 puntos de daño
        const baseDamage = Math.floor(Math.random() * (400 - 300 + 1)) + 300;
        const actualDamage = target.takeDamage(baseDamage);
        
        // Restaurar toda la energía
        character.stats.energy = character.stats.maxEnergy;
        
        // Agregar cooldown temporal para Ozen (3 turnos sin poder usar habilidad especial)
        character.stats.statusEffects = character.stats.statusEffects || [];
        character.stats.statusEffects.push({
            type: 'ozen_cooldown',
            duration: 3,
            effect: 'special_ability_cooldown'
        });
        
        return {
            abilityName: 'Bijudama Definitivo',
            description: `Ozen lanza un ataque devastador causando ${actualDamage} de daño y restaura toda su energía`,
            damage: actualDamage,
            energyRestored: character.stats.maxEnergy,
            targetHealth: target.stats.health.current
        };
    }
    
    xairSpecialAbility(character, target) {
        // Aplicar efecto que cambia el ataque básico y potencia el daño
        character.stats.statusEffects = character.stats.statusEffects || [];
        
        // Eliminar efectos previos para evitar acumulación
        character.stats.statusEffects = character.stats.statusEffects.filter(
            effect => effect.type !== 'xair_molecular_cut'
        );
        
        character.stats.statusEffects.push({
            type: 'xair_molecular_cut',
            duration: 999, // Efecto permanente hasta usar habilidad especial de nuevo
            effect: 'attack_transformation',
            attackName: 'Corte Molecular',
            damageMultiplier: 3,
            defenseReduction: 2
        });
        
        return {
            abilityName: 'Activación Molecular',
            description: 'Xair activa su técnica molecular: su ataque básico se convierte en "Corte Molecular" con triple daño y doble reducción de defensa',
            newAttackName: 'Corte Molecular',
            damageMultiplier: 3,
            defenseReduction: 2
        };
    }
    
    nathanSpecialAbility(character, target) {
        // Aplicar efectos de buff: 50% reducción de daño y doble ataque por 3 turnos
        character.stats.statusEffects = character.stats.statusEffects || [];
        
        // Eliminar efectos previos para evitar acumulación
        character.stats.statusEffects = character.stats.statusEffects.filter(
            effect => effect.type !== 'nathan_ultimate'
        );
        
        character.stats.statusEffects.push({
            type: 'nathan_ultimate',
            duration: 3,
            effect: 'damage_reduction_and_attack_boost',
            damageReduction: 50,
            attackMultiplier: 2
        });
        
        return {
            abilityName: 'Modo Kami',
            description: 'Nathan entra en Modo Kami: recibe 50% menos daño y duplica su ataque por 3 turnos',
            damageReduction: 50,
            attackBoost: 100,
            duration: 3
        };
    }
    
    zackSpecialAbility(character, target) {
        // Usar la habilidad Omniscio del personaje Zack
        const omniscioResult = character.omniscio(target);
        
        if (!omniscioResult.success) {
            return {
                abilityName: 'Omniscio',
                description: omniscioResult.message,
                success: false
            };
        }
        
        // Procesar el efecto según el tipo de resultado
        let effectDescription = omniscioResult.message;
        let additionalEffects = {};
        
        // Aplicar efectos al objetivo si es necesario
        if (omniscioResult.target === "enemy" && omniscioResult.statusEffect) {
            target.stats.statusEffects = target.stats.statusEffects || [];
            
            // Limpiar efectos similares para evitar acumulación
            target.stats.statusEffects = target.stats.statusEffects.filter(
                effect => effect.type !== omniscioResult.statusEffect.type
            );
            
            target.stats.statusEffects.push({
                type: omniscioResult.statusEffect.type,
                duration: omniscioResult.statusEffect.duration,
                value: omniscioResult.statusEffect.value,
                source: 'zack_omniscio'
            });
            
            additionalEffects.targetStatusEffect = omniscioResult.statusEffect;
        }
        
        // Aplicar daño directo si es necesario
        if (omniscioResult.damage) {
            const actualDamage = target.takeDamage(Math.floor(omniscioResult.damage));
            effectDescription += ` - Causa ${actualDamage} de daño`;
            additionalEffects.damage = actualDamage;
            additionalEffects.targetHealth = target.stats.health.current;
        }
        
        // Agregar información de curación si aplica
        if (omniscioResult.healing) {
            effectDescription += ` - Restaura ${omniscioResult.healing} puntos de vida`;
            additionalEffects.healing = omniscioResult.healing;
        }
        
        // Agregar información de energía ganada si aplica
        if (omniscioResult.energyGained) {
            effectDescription += ` - Gana ${omniscioResult.energyGained} puntos de energía`;
            additionalEffects.energyGained = omniscioResult.energyGained;
        }
        
        return {
            abilityName: 'Omniscio',
            description: effectDescription,
            effectName: omniscioResult.effectName,
            effectType: omniscioResult.effectType,
            ...additionalEffects
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
     * Obtiene el nombre de la habilidad de defensa según el personaje
     */
    getDefendName(character) {
        const defendNames = {
            'Shuna Shieda': 'Recubrimiento Primordial',  // Será rellenado por el usuario
            'Ozen Kimura': 'Esferas en Busqueda de la Verdad',   // Será rellenado por el usuario
            'Xair Chikyu': 'Frostbite',   // Será rellenado por el usuario
            'Nathan Doffens': 'Kami defensivo', // Será rellenado por el usuario
            'Zack Hisoka': 'Manipulación Atómica Defensiva'
        };
        
        return defendNames[character.stats.name] || 'Defensa';
    }
    
    /**
     * Obtiene el nombre de la habilidad de curación según el personaje
     */
    getHealName(character) {
        const healNames = {
            'Shuna Shieda': 'Regeneración de Vida',
            'Ozen Kimura': 'Regeneración de Vida',
            'Xair Chikyu': 'Regeneración de Vida',
            'Nathan Doffens': 'Regeneración de Vida',
            'Zack Hisoka': 'Conversión Energética'
        };
        
        return healNames[character.stats.name] || 'Regeneración de Vida';
    }
    
    /**
     * Obtiene el nombre del ataque según el personaje y tipo
     */
    getAttackName(character, attackType) {
        // Verificar si Xair tiene el efecto molecular activo
        if (character.stats.name === 'Xair Chikyu' && attackType === 'basic') {
            const molecularEffect = character.stats.statusEffects?.find(
                effect => effect.type === 'xair_molecular_cut'
            );
            if (molecularEffect) {
                return 'Corte Molecular';
            }
        }
        
        const attackNames = {
            'Shuna Shieda': {
                basic: 'Cuna de Judas',  // Será rellenado por el usuario
                special: 'Doctrina Perfecta: Millar de Soles Devastadores'
            },
            'Ozen Kimura': {
                basic: 'Sello de 5 Líneas',  // Será rellenado por el usuario
                special: 'Bijudama: Seis Caminos'
            },
            'Xair Chikyu': {
                basic: 'Impact Style',  // Será rellenado por el usuario
                special: 'Flow'
            },
            'Nathan Doffens': {
                basic: 'Hiraishin v2',  // Será rellenado por el usuario
                special: 'Kami no Shinjitsu'
            }
        };
        
        const characterAttacks = attackNames[character.stats.name];
        if (!characterAttacks) {
            return attackType === 'basic' ? 'Ataque Básico' : 'Habilidad Especial';
        }
        
        return characterAttacks[attackType] || (attackType === 'basic' ? 'Ataque Básico' : 'Habilidad Especial');
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
            case 'Zack Hisoka':
                return 40;
            default:
                return 30;
        }
    }
    
    /**
     * Verifica si la batalla ha terminado
     */
    checkBattleEnd() {
        if (this.battleEnded) return this.battleResult;
        
        // Verificaciones de seguridad adicionales
        if (!this.player || !this.enemy) {
            console.warn('Personajes no inicializados correctamente');
            this.battleEnded = true;
            return {
                ended: true,
                winner: 'draw',
                result: 'Error: Personajes no encontrados',
                battleType: 'error'
            };
        }
        
        const playerDead = !this.player.isAlive();
        const enemyDead = !this.enemy.isAlive();
        const maxRoundsReached = this.round >= this.config.maxRounds;
        
        // Log de depuración detallado
        console.log(`CheckBattleEnd - Ronda ${this.round}:`);
        console.log(`- Jugador vivo: ${this.player.isAlive()}, HP: ${this.player.stats.health.current}/${this.player.stats.health.max}`);
        console.log(`- Enemigo vivo: ${this.enemy.isAlive()}, HP: ${this.enemy.stats.health.current}/${this.enemy.stats.health.max}`);
        console.log(`- Player dead: ${playerDead}, Enemy dead: ${enemyDead}`);
        
        // Verificación de seguridad: si la batalla ha durado más de 100 rondas, forzar fin
        if (this.round > 100) {
            console.warn('Batalla excedió 100 rondas, forzando fin');
            this.battleEnded = true;
            
            const playerHealthPercent = this.player.stats.health.current / this.player.stats.health.max;
            const enemyHealthPercent = this.enemy.stats.health.current / this.enemy.stats.health.max;
            
            let winner, result, battleType;
            if (playerHealthPercent > enemyHealthPercent) {
                winner = 'player';
                result = '¡Victoria por tiempo extendido!';
                battleType = 'time_victory';
            } else if (enemyHealthPercent > playerHealthPercent) {
                winner = 'enemy';
                result = 'Derrota por tiempo extendido';
                battleType = 'time_defeat';
            } else {
                winner = 'draw';
                result = 'Empate por tiempo extendido';
                battleType = 'time_draw';
            }
            
            this.addLogEntry('system', `¡La batalla ha terminado! ${result}`);
            
            this.battleResult = {
                ended: true,
                winner: winner,
                result: result,
                battleType: battleType,
                surrendered: false,
                duration: Date.now() - this.battleStartTime,
                stats: this.stats
            };
            
            return this.battleResult;
        }
        
        if (playerDead || enemyDead || maxRoundsReached) {
            console.log('¡Batalla terminada detectada!');
            this.battleEnded = true;
            
            let winner, result, battleType;
            if (playerDead && enemyDead) {
                winner = 'draw';
                result = 'Empate';
                battleType = 'mutual_death';
            } else if (playerDead) {
                winner = 'enemy';
                result = 'Derrota';
                battleType = 'player_defeated';
            } else if (enemyDead) {
                winner = 'player';
                result = '¡Victoria!';
                battleType = 'enemy_defeated';
            } else {
                // Máximo de rondas alcanzado
                const playerHealthPercent = this.player.stats.health.current / this.player.stats.health.max;
                const enemyHealthPercent = this.enemy.stats.health.current / this.enemy.stats.health.max;
                
                if (playerHealthPercent > enemyHealthPercent) {
                    winner = 'player';
                    result = '¡Victoria por tiempo!';
                    battleType = 'time_victory';
                } else if (enemyHealthPercent > playerHealthPercent) {
                    winner = 'enemy';
                    result = 'Derrota por tiempo';
                    battleType = 'time_defeat';
                } else {
                    winner = 'draw';
                    result = 'Empate por tiempo';
                    battleType = 'time_draw';
                }
            }
            
            this.addLogEntry('system', `¡La batalla ha terminado! ${result}`);
            
            this.battleResult = {
                ended: true,
                winner: winner,
                result: result,
                battleType: battleType,
                surrendered: false,
                duration: Date.now() - this.battleStartTime,
                stats: this.stats
            };
            
            console.log('Battle result created:', this.battleResult);
            return this.battleResult;
        }
        
        return false;
    }
    
    /**
     * Termina la batalla por rendición del jugador
     */
    surrenderBattle() {
        if (this.battleEnded) {
            return null;
        }
        
        this.battleEnded = true;
        
        this.addLogEntry('system', `${this.player.stats.name} se rinde. La batalla termina.`);
        
        this.battleResult = {
            ended: true,
            winner: 'enemy',
            result: 'Te rendiste',
            surrendered: true,
            duration: Date.now() - this.battleStartTime,
            stats: this.stats
        };
        
        return this.battleResult;
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
     * Obtiene el resultado de la batalla
     */
    getBattleResult() {
        return this.battleResult;
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
            battleResult: this.battleResult,
            stats: this.stats,
            duration: this.battleStartTime ? Date.now() - this.battleStartTime : 0,
            // Información de habilidades especiales
            playerSpecialAbility: this.player ? this.canUseSpecialAbility(this.player) : null,
            enemySpecialAbility: this.enemy ? this.canUseSpecialAbility(this.enemy) : null
        };
    }
    
    /**
     * Verifica si un personaje tiene una habilidad especial activa
     */
    checkActiveSpecialAbility(character) {
        if (!character.stats.statusEffects || character.stats.statusEffects.length === 0) {
            return null;
        }
        
        const specialAbilityEffects = {
            'nathan_ultimate': 'Modo Kami',
            'shuna_ultimate': 'Despertar Primordial', 
            'xair_molecular_cut': 'Activación Molecular',
            'ozen_cooldown': 'Bijudama Definitivo (Cooldown)'
        };
        
        for (const effect of character.stats.statusEffects) {
            if (specialAbilityEffects[effect.type]) {
                return {
                    abilityName: specialAbilityEffects[effect.type],
                    remainingTurns: effect.duration,
                    effectType: effect.type,
                    isCooldown: effect.type === 'ozen_cooldown'
                };
            }
        }
        
        return null;
    }
    
    /**
     * Verifica si un personaje puede usar su habilidad especial
     */
    canUseSpecialAbility(character) {
        const energyCost = this.getSpecialAbilityCost(character.stats);
        const hasEnoughEnergy = character.stats.energy >= energyCost;
        const activeAbility = this.checkActiveSpecialAbility(character);
        
        return {
            canUse: hasEnoughEnergy && !activeAbility,
            hasEnoughEnergy: hasEnoughEnergy,
            activeAbility: activeAbility,
            energyCost: energyCost,
            currentEnergy: character.stats.energy
        };
    }
    
    /**
     * Procesa efectos de estado (reducir duración, eliminar expirados)
     */
    processStatusEffects() {
        [this.player, this.enemy].forEach(character => {
            if (character && character.stats.statusEffects) {
                const originalEffectsCount = character.stats.statusEffects.length;
                
                // Procesar efectos antes de reducir duración
                character.stats.statusEffects.forEach(effect => {
                    // Daño por quemadura de Shuna
                    if (effect.type === 'burn' && effect.effect === 'damage_over_time') {
                        const actualDamage = character.takeDamage(effect.damagePerTurn);
                        this.addLogEntry('damage', `${character.stats.name} recibe ${actualDamage} de daño por quemadura`);
                        
                        // Actualizar estadísticas
                        if (character === this.player) {
                            this.stats.totalDamageReceived += actualDamage;
                        } else {
                            this.stats.totalDamageDealt += actualDamage;
                        }
                    }
                });
                
                // Reducir duración y filtrar efectos expirados
                character.stats.statusEffects = character.stats.statusEffects
                    .map(effect => ({
                        ...effect,
                        duration: effect.duration - 1
                    }))
                    .filter(effect => effect.duration > 0);
                
                // Si algunos efectos expiraron, actualizar estadísticas visuales
                if (originalEffectsCount !== character.stats.statusEffects.length && this.ui) {
                    const isPlayer = character === this.player;
                    this.ui.updateCharacterDisplay(isPlayer ? 'player' : 'enemy', character.stats);
                }
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
    
    /**
     * Método público para verificar si el jugador puede usar su habilidad especial
     * Útil para habilitar/deshabilitar el botón en la interfaz
     */
    canPlayerUseSpecialAbility() {
        if (!this.player || this.battleEnded || this.currentTurn !== 'player') {
            return {
                canUse: false,
                reason: 'No es el turno del jugador o la batalla ha terminado'
            };
        }
        
        return this.canUseSpecialAbility(this.player);
    }
    
    /**
     * Obtiene información detallada sobre el estado de la habilidad especial del jugador
     */
    getPlayerSpecialAbilityStatus() {
        if (!this.player) return null;
        
        const canUse = this.canUseSpecialAbility(this.player);
        const energyCost = this.getSpecialAbilityCost(this.player.stats);
        
        return {
            ...canUse,
            characterName: this.player.stats.name,
            energyCost: energyCost,
            isPlayerTurn: this.currentTurn === 'player',
            battleActive: !this.battleEnded
        };
    }
    
    /**
     * Obtiene información detallada sobre el resultado de la batalla para mostrar pantallas apropiadas
     */
    getBattleResult() {
        if (!this.battleEnded) {
            return null;
        }
        
        const battleEnd = this.checkBattleEnd();
        if (battleEnd && battleEnd.ended) {
            return {
                ...battleEnd,
                playerStats: this.player ? this.player.getStats() : null,
                enemyStats: this.enemy ? this.enemy.getStats() : null,
                finalRound: this.round,
                totalBattleTime: Date.now() - this.battleStartTime,
                // Información para recompensas
                experienceGained: this.calculateExperienceGained(),
                coinsGained: this.calculateCoinsGained(),
                // Información específica según el tipo de resultado
                showVictoryScreen: battleEnd.winner === 'player',
                showDefeatScreen: battleEnd.winner === 'enemy' && !battleEnd.surrendered,
                showSurrenderScreen: battleEnd.surrendered === true,
                showDrawScreen: battleEnd.winner === 'draw'
            };
        }
        
        return null;
    }
    
    /**
     * Calcula la experiencia ganada basada en el resultado de la batalla
     */
    calculateExperienceGained() {
        if (!this.battleEnded) return 0;
        
        const battleEnd = this.checkBattleEnd();
        if (!battleEnd || !battleEnd.ended) return 0;
        
        let baseExperience = Math.floor(this.round * 10); // 10 XP base por ronda
        
        // Multiplicadores según el resultado
        if (battleEnd.winner === 'player') {
            if (battleEnd.battleType === 'enemy_defeated') {
                baseExperience *= 2; // Victoria completa
            } else if (battleEnd.battleType === 'time_victory') {
                baseExperience *= 1.5; // Victoria por tiempo
            }
        } else if (battleEnd.winner === 'enemy') {
            if (battleEnd.surrendered) {
                baseExperience *= 0.5; // Penalización por rendirse
            } else {
                baseExperience *= 0.8; // Experiencia reducida por derrota
            }
        } else {
            baseExperience *= 1.2; // Empate
        }
        
        // Bonus por estadísticas de batalla
        const damageBonus = Math.floor(this.stats.totalDamageDealt / 100);
        const specialBonus = this.stats.specialAbilitiesUsed * 15;
        const criticalBonus = this.stats.criticalHits * 10;
        
        return Math.max(10, Math.floor(baseExperience + damageBonus + specialBonus + criticalBonus));
    }
    
    /**
     * Calcula las monedas ganadas basadas en el resultado de la batalla
     */
    calculateCoinsGained() {
        if (!this.battleEnded) return 0;
        
        const battleEnd = this.checkBattleEnd();
        if (!battleEnd || !battleEnd.ended) return 0;
        
        let baseCoins = Math.floor(this.round * 5); // 5 monedas base por ronda
        
        // Multiplicadores según el resultado
        if (battleEnd.winner === 'player') {
            if (battleEnd.battleType === 'enemy_defeated') {
                baseCoins *= 3; // Victoria completa da más monedas
            } else if (battleEnd.battleType === 'time_victory') {
                baseCoins *= 2; // Victoria por tiempo
            }
        } else if (battleEnd.winner === 'enemy') {
            if (battleEnd.surrendered) {
                baseCoins *= 0.2; // Penalización severa por rendirse
            } else {
                baseCoins *= 0.5; // Monedas reducidas por derrota
            }
        } else {
            baseCoins *= 1; // Empate da monedas normales
        }
        
        return Math.max(5, Math.floor(baseCoins));
    }
}
