// Clase base para todos los personajes
export class Character {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.title = data.title;
        this.description = data.description;
        this.image = data.image;
        this.rarity = data.rarity;
        
        // Stats base
        this.attackMin = data.attack_min;
        this.attackMax = data.attack_max;
        this.maxHealth = data.max_health;
        this.health = data.max_health;
        this.armor = data.armor;
        this.defenseReduction = data.defense_reduction;
        this.elementalResistance = data.elemental_resistance;
        
        // Sistema de energía
        this.energy = 100;
        this.maxEnergy = 100;
        
        // Efectos y buffs activos
        this.activeEffects = [];
        this.passives = this.initializePassives();
        this.attacks = this.initializeAttacks();
    }
    
    // Método abstracto que debe ser implementado por cada personaje
    initializePassives() {
        return [];
    }
    
    // Método abstracto que debe ser implementado por cada personaje
    initializeAttacks() {
        return {
            basic: {
                name: "Ataque Básico",
                description: "Un ataque básico simple",
                energyCost: 0,
                cooldown: 1000,
                multiplier: 1.0,
                critChance: 15,
                execute: (target) => this.executeBasicAttack(target)
            },
            elemental: {
                name: "Ataque Elemental",
                description: "Un ataque elemental poderoso",
                energyCost: 30,
                cooldown: 3000,
                multiplier: 1.8,
                critChance: 25,
                execute: (target) => this.executeElementalAttack(target)
            },
            ultimate: {
                name: "Habilidad Definitiva",
                description: "El ataque más poderoso del personaje",
                energyCost: 70,
                cooldown: 8000,
                multiplier: 3.5,
                critChance: 50,
                execute: (target) => this.executeUltimateAttack(target)
            }
        };
    }
    
    // Métodos de combate base
    executeBasicAttack(target) {
        return this.calculateDamage(target, this.attacks.basic);
    }
    
    executeElementalAttack(target) {
        return this.calculateDamage(target, this.attacks.elemental);
    }
    
    executeUltimateAttack(target) {
        return this.calculateDamage(target, this.attacks.ultimate);
    }
    
    // Sistema de cálculo de daño
    calculateDamage(target, attack) {
        let baseDamage = Math.floor(Math.random() * (this.attackMax - this.attackMin + 1)) + this.attackMin;
        let damage = Math.floor(baseDamage * attack.multiplier);
        
        // Aplicar pasivas del atacante
        damage = this.applyOffensivePassives(damage, attack, target);
        
        // Crítico
        const isCritical = Math.random() * 100 < attack.critChance;
        if (isCritical) {
            damage = Math.floor(damage * 1.5);
        }
          // Aplicar armadura del objetivo
        const armorReduction = Math.max(0, target.armor - this.defenseReduction);
        const damageAfterArmor = Math.max(1, damage - armorReduction);
        
        // Aplicar pasivas defensivas del objetivo (si las tiene)
        const finalDamage = target.applyDefensivePassives 
            ? target.applyDefensivePassives(damageAfterArmor, attack, this)
            : damageAfterArmor;
        
        return {
            damage: finalDamage,
            isCritical,
            attackName: attack.name,
            description: this.getAttackDescription(attack, finalDamage, isCritical)
        };
    }
    
    // Métodos para aplicar pasivas (serán sobrescritos por cada personaje)
    applyOffensivePassives(damage, attack, target) {
        return damage;
    }
    
    applyDefensivePassives(damage, attack, attacker) {
        return damage;
    }
    
    // Descripción del ataque para el log
    getAttackDescription(attack, damage, isCritical) {
        let description = `${this.name} usa ${attack.name}`;
        if (isCritical) {
            description += " ¡CRÍTICO!";
        }
        return description;
    }
    
    // Métodos de utilidad
    canUseAttack(attackType) {
        const attack = this.attacks[attackType];
        return this.energy >= attack.energyCost;
    }
    
    useEnergy(amount) {
        this.energy = Math.max(0, this.energy - amount);
    }
    
    restoreEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        return this.health <= 0;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    isAlive() {
        return this.health > 0;
    }
    
    // Sistema de efectos
    addEffect(effect) {
        this.activeEffects.push(effect);
    }
    
    removeEffect(effectName) {
        this.activeEffects = this.activeEffects.filter(effect => effect.name !== effectName);
    }
    
    processEffects() {
        this.activeEffects.forEach(effect => {
            if (effect.onTurnStart) {
                effect.onTurnStart(this);
            }
            effect.duration--;
        });
        
        this.activeEffects = this.activeEffects.filter(effect => effect.duration > 0);
    }
    
    // Obtener información del personaje para el UI
    getDisplayData() {
        return {
            name: this.name,
            title: this.title,
            health: this.health,
            maxHealth: this.maxHealth,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            armor: this.armor,
            attackMin: this.attackMin,
            attackMax: this.attackMax,
            image: this.image,
            rarity: this.rarity,
            attacks: this.attacks
        };
    }
}
