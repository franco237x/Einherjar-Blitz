/**
 * Clase base Character - Sistema Modular Einherjar Blitz
 * @author Sistema Modular
 * @version 2.0.0
 */

export class Character {
    constructor(data) {
        // Validación de datos requeridos
        this.validateConstructorData(data);
        
        // Datos básicos del personaje
        this.id = data.id;
        this.name = data.name;
        this.title = data.title || "";
        this.description = data.description || "";
        this.image = data.image || "default.jpg";
        this.clan = data.clan || "Unknown";
        this.element = data.element || "Neutral";
        this.rarity = data.rarity || "common";
        this.isPlayer = data.isPlayer || false;
        
        // Estadísticas de combate
        this.maxHealth = data.max_health || data.maxHealth || 1000;
        this.health = data.currentHealth || this.maxHealth;
        this.attackMin = data.attack_min || data.attackMin || 100;
        this.attackMax = data.attack_max || data.attackMax || 150;
        this.armor = data.armor || 0;
        this.elementalResistance = data.elemental_resistance || data.elementalResistance || 0;
        
        // Sistema de energía
        this.maxEnergy = 100;
        this.energy = data.energy || 100;
        
        // Sistemas de combate
        this.activeEffects = [];
        this.cooldowns = {};
        this.statusEffects = [];
        
        // Estados especiales
        this.isDefending = false;
        this.isAlive = true;
        
        // Inicialización de sistemas específicos
        this.initializeSpecialMechanics();
        this.attacks = this.initializeAttacks();
        this.passives = this.initializePassives();
        
        // Logging para debugging
        console.log(`✅ Personaje ${this.name} inicializado correctamente`);
    }
    
    /**
     * Validación de datos del constructor
     */
    validateConstructorData(data) {
        if (!data) {
            throw new Error("❌ Character: Datos del constructor requeridos");
        }
        
        const requiredFields = ['id', 'name'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`❌ Character: Campo requerido '${field}' faltante`);
            }
        }
    }
    
    /**
     * Inicialización de mecánicas especiales por personaje
     * Debe ser sobrescrito por clases hijas si es necesario
     */
    initializeSpecialMechanics() {
        // Implementación base vacía - las subclases pueden sobrescribir
    }
    
    /**
     * Inicialización de ataques por defecto
     * Debe ser sobrescrito por clases hijas
     */
    initializeAttacks() {
        return {
            basic: {
                name: "Ataque Básico",
                description: "Un ataque simple pero efectivo",
                energyCost: 0,
                cooldown: 1000,
                multiplier: 1.0,
                critChance: 15,
                execute: (target) => this.executeBasicAttack(target)
            },
            elemental: {
                name: "Ataque Elemental",
                description: "Un ataque que usa el elemento del personaje",
                energyCost: 30,
                cooldown: 3000,
                multiplier: 1.8,
                critChance: 25,
                execute: (target) => this.executeElementalAttack(target)
            },
            ultimate: {
                name: "Ataque Definitivo",
                description: "El ataque más poderoso del personaje",
                energyCost: 70,
                cooldown: 8000,
                multiplier: 3.5,
                critChance: 40,
                execute: (target) => this.executeUltimateAttack(target)
            }
        };
    }
    
    /**
     * Inicialización de pasivas por defecto
     * Debe ser sobrescrito por clases hijas
     */
    initializePassives() {
        return [];
    }
    
    /**
     * Métodos de ataque por defecto
     */
    executeBasicAttack(target) {
        return this.calculateDamage(target, this.attacks.basic);
    }
    
    executeElementalAttack(target) {
        return this.calculateDamage(target, this.attacks.elemental);
    }
    
    executeUltimateAttack(target) {
        return this.calculateDamage(target, this.attacks.ultimate);
    }
    
    /**
     * Cálculo de daño base
     */
    calculateDamage(target, attack) {
        // Cálculo de daño base
        const baseMin = this.attackMin * attack.multiplier;
        const baseMax = this.attackMax * attack.multiplier;
        let damage = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
        
        // Verificar crítico
        const isCritical = Math.random() * 100 < attack.critChance;
        if (isCritical) {
            damage = Math.floor(damage * 1.5);
        }
        
        // Aplicar pasivas ofensivas
        damage = this.applyOffensivePassives(damage, attack, target);
        
        // Aplicar pasivas defensivas del objetivo
        if (target && target.applyDefensivePassives) {
            damage = target.applyDefensivePassives(damage, attack, this);
        }
        
        return {
            damage: Math.max(1, damage),
            isCritical,
            attack: attack.name,
            additionalEffect: null
        };
    }
    
    /**
     * Aplicación de pasivas ofensivas (para sobrescribir)
     */
    applyOffensivePassives(damage, attack, target) {
        return damage;
    }
    
    /**
     * Aplicación de pasivas defensivas (para sobrescribir)
     */
    applyDefensivePassives(damage, attack, attacker) {
        return damage;
    }
    
    /**
     * Recibir daño
     */
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage);
        this.health = Math.max(0, this.health - actualDamage);
        
        if (this.health <= 0) {
            this.isAlive = false;
        }
        
        return this.health <= 0;
    }
    
    /**
     * Curar vida
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    /**
     * Gestión de energía
     */
    consumeEnergy(amount) {
        this.energy = Math.max(0, this.energy - amount);
    }
    
    restoreEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }
    
    /**
     * Gestión de efectos
     */
    addEffect(effect) {
        this.activeEffects.push({
            ...effect,
            appliedAt: Date.now()
        });
    }
    
    removeEffect(effectName) {
        this.activeEffects = this.activeEffects.filter(e => e.name !== effectName);
    }
    
    hasEffect(effectName) {
        return this.activeEffects.some(e => e.name === effectName);
    }
    
    processEffects() {
        this.activeEffects = this.activeEffects.filter(effect => {
            if (effect.duration && effect.duration > 0) {
                effect.duration--;
                return effect.duration > 0;
            }
            return effect.duration !== 0;
        });
    }
    
    /**
     * Gestión de cooldowns
     */
    setCooldown(actionType, duration) {
        this.cooldowns[actionType] = Date.now() + duration;
    }
    
    isOnCooldown(actionType) {
        return this.cooldowns[actionType] && Date.now() < this.cooldowns[actionType];
    }
    
    getCooldownRemaining(actionType) {
        if (!this.isOnCooldown(actionType)) return 0;
        return Math.max(0, this.cooldowns[actionType] - Date.now());
    }
    
    /**
     * Métodos de información y display
     */
    getAttackDescription(attack, damage, isCritical) {
        let description = `${this.name} usa ${attack.name}`;
        if (isCritical) {
            description += " ¡CRÍTICO!";
        }
        description += ` (${damage} daño)`;
        return description;
    }
    
    getDisplayData() {
        return {
            id: this.id,
            name: this.name,
            title: this.title,
            image: this.image,
            clan: this.clan,
            element: this.element,
            rarity: this.rarity,
            health: this.health,
            maxHealth: this.maxHealth,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            isAlive: this.isAlive,
            activeEffects: this.activeEffects,
            attacks: this.attacks,
            passives: this.passives
        };
    }
    
    /**
     * Serialización para guardado
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            health: this.health,
            energy: this.energy,
            activeEffects: this.activeEffects,
            cooldowns: this.cooldowns,
            statusEffects: this.statusEffects,
            isAlive: this.isAlive
        };
    }
    
    /**
     * Información del tipo de personaje
     */
    static getCharacterInfo() {
        return {
            id: null,
            name: "Base Character",
            type: "base",
            description: "Clase base para todos los personajes"
        };
    }
}
