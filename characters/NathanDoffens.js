import { Character } from './Character.js';

export class NathanDoffens extends Character {
    constructor(data) {
        super(data);
        // Mecánicas especiales de Nathan
        this.strategyPoints = 0;
        this.maxStrategyPoints = 150;
        this.activeStrategies = [];
        this.tacticalAdvantage = false;
    }
    
    /**
     * Inicialización de mecánicas especiales de Nathan
     */
    initializeSpecialMechanics() {
        super.initializeSpecialMechanics();
        // Las mecánicas específicas ya se inicializan en el constructor
    }
    
    initializePassives() {
        return [
            {
                name: "Mente Estratégica",
                description: "Al usar habilidades, genera Puntos de Estrategia que potencian los siguientes ataques.",
                type: "resource"
            },
            {
                name: "Ventaja Táctica",
                description: "Nathan analiza al enemigo y reduce sus defensas con cada turno.",
                type: "analytical"
            }
        ];
    }
    
    initializeAttacks() {
        return {
            basic: {
                name: "Golpe Calculado",
                description: "Un ataque preciso que genera puntos de estrategia",
                energyCost: 0,
                cooldown: 1000,
                multiplier: 1.2,
                critChance: 20,
                execute: (target) => this.executeGolpeCalculado(target)
            },
            elemental: {
                name: "Maniobra Envolvente",
                description: "Una estrategia que debilita al enemigo y fortalece a Nathan",
                energyCost: 35,
                cooldown: 3500,
                multiplier: 2.0,
                critChance: 30,
                execute: (target) => this.executeManiobra(target)
            },
            ultimate: {
                name: "Gambit Doffens",
                description: "La estrategia definitiva que sacrifica vida por un poder devastador",
                energyCost: 75,
                cooldown: 9000,
                multiplier: 4.2,
                critChance: 50,
                execute: (target) => this.executeGambit(target)
            }
        };
    }
    
    // Implementación de ataques específicos
    executeGolpeCalculado(target) {
        const result = this.calculateDamage(target, this.attacks.basic);
        
        // Genera puntos de estrategia
        this.addStrategyPoints(15);
        
        // Aplica análisis táctico
        this.analyzeEnemy(target);
        
        result.additionalEffect = `+15 Puntos de Estrategia (${this.strategyPoints}/150). Enemigo analizado.`;
        
        return result;
    }
    
    executeManiobra(target) {
        const attack = this.attacks.elemental;
        
        // Gasta puntos de estrategia para bonus de daño
        const strategyBonus = Math.min(this.strategyPoints, 50);
        const modifiedAttack = { 
            ...attack, 
            multiplier: attack.multiplier + (strategyBonus / 100) 
        };
        
        const result = this.calculateDamage(target, modifiedAttack);
        
        // Consume puntos de estrategia
        this.strategyPoints = Math.max(0, this.strategyPoints - strategyBonus);
        
        // Aplica debuff al enemigo
        target.addEffect({
            name: "Posición Comprometida",
            description: "Recibe 20% más daño y tiene -25% de precisión",
            duration: 3,
            type: "debuff",
            damageMultiplier: 1.2,
            accuracyReduction: 0.25
        });
        
        // Buff propio
        this.tacticalAdvantage = true;
        this.addEffect({
            name: "Ventaja Táctica",
            description: "Próximos 2 ataques tienen +40% de daño",
            duration: 2,
            type: "buff",
            damageBonus: 1.4
        });
        
        result.additionalEffect = `Consumió ${strategyBonus} PE. Enemigo en posición comprometida. Ventaja táctica activada.`;
        
        return result;
    }
    
    executeGambit(target) {
        const attack = this.attacks.ultimate;
        
        // Sacrifica 30% de vida actual para massive damage
        const healthSacrifice = Math.floor(this.health * 0.3);
        this.health = Math.max(1, this.health - healthSacrifice);
        
        // Usa todos los puntos de estrategia
        const allStrategy = this.strategyPoints;
        const modifiedAttack = { 
            ...attack, 
            multiplier: attack.multiplier + (allStrategy / 50) + (healthSacrifice / 200)
        };
        
        const result = this.calculateDamage(target, modifiedAttack);
        
        // Reset strategy points
        this.strategyPoints = 0;
        
        // Efecto devastador al enemigo
        target.addEffect({
            name: "Gambit Absoluto",
            description: "Todas las defensas reducidas a 0, no puede usar habilidades definitivas",
            duration: 4,
            type: "curse",
            armorReduction: 1.0,
            ultimateBlock: true
        });
        
        // Nathan entra en estado crítico pero poderoso
        this.addEffect({
            name: "Resolución Doffens",
            description: "Vida crítica pero todos los ataques son críticos garantizados",
            duration: 3,
            type: "transformation",
            guaranteedCrit: true
        });
        
        result.additionalEffect = `¡GAMBIT SUPREMO! Sacrificó ${healthSacrifice} vida. Consumió ${allStrategy} PE. Enemigo maldito.`;
        
        return result;
    }
    
    // Métodos específicos de Nathan
    addStrategyPoints(amount) {
        this.strategyPoints = Math.min(this.maxStrategyPoints, this.strategyPoints + amount);
    }
    
    analyzeEnemy(target) {
        // Reduce las defensas del enemigo gradualmente
        if (!target.hasEffect("Analizado")) {
            target.addEffect({
                name: "Analizado",
                description: "Nathan conoce tus debilidades (-10% armadura por turno)",
                duration: 999,
                type: "analysis",
                armorReduction: 0.1
            });
        }
    }
    
    // Sobrescribir aplicación de pasivas ofensivas
    applyOffensivePassives(damage, attack, target) {
        let modifiedDamage = damage;
        
        // Bonus por ventaja táctica
        if (this.tacticalAdvantage) {
            modifiedDamage = Math.floor(modifiedDamage * 1.3);
        }
        
        // Bonus por resolución Doffens
        const resolutionEffect = this.activeEffects.find(e => e.name === "Resolución Doffens");
        if (resolutionEffect && resolutionEffect.guaranteedCrit) {
            modifiedDamage = Math.floor(modifiedDamage * 1.5); // Crítico forzado
        }
        
        // Bonus por ventaja táctica buff
        const tacticalBuff = this.activeEffects.find(e => e.name === "Ventaja Táctica");
        if (tacticalBuff && tacticalBuff.damageBonus) {
            modifiedDamage = Math.floor(modifiedDamage * tacticalBuff.damageBonus);
        }
        
        return modifiedDamage;
    }
    
    // Método especial para manejar turnos
    onTurnStart() {
        super.processEffects();
        
        // Regenera strategy points lentamente
        this.addStrategyPoints(5);
        
        // Regenera energía más lento (es estratega, no rushea)
        this.restoreEnergy(10);
        
        // Reset tactical advantage al inicio del turno
        this.tacticalAdvantage = false;
    }
    
    getAttackDescription(attack, damage, isCritical) {
        let description = super.getAttackDescription(attack, damage, isCritical);
        
        if (this.strategyPoints > 0) {
            description += ` [Estrategia: ${this.strategyPoints}/150]`;
        }
        
        if (this.tacticalAdvantage) {
            description += ` [VENTAJA TÁCTICA]`;
        }
        
        return description;
    }
    
    // Información adicional para el UI
    getDisplayData() {
        const baseData = super.getDisplayData();
        return {
            ...baseData,
            strategyPoints: this.strategyPoints,
            maxStrategyPoints: this.maxStrategyPoints,
            tacticalAdvantage: this.tacticalAdvantage,
            activeStrategies: this.activeStrategies,
            clan: this.clan
        };
    }
    
    /**
     * Información estática de la clase para el registro
     */
    static getCharacterInfo() {
        return {
            id: 'nathan-doffens',
            name: 'Nathan Doffens',
            type: 'strategist',
            description: 'Estratega supremo que sacrifica recursos por ventajas tácticas devastadoras',
            specialMechanics: ['Strategy Points', 'Tactical Analysis', 'Resource Sacrifice'],
            clan: 'Doffens',
            element: 'Estrategia'
        };
    }
}
