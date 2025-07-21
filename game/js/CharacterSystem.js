/**
 * Sistema de Personajes - Einherjar Blitz
 * Maneja las clases y mecánicas específicas de cada personaje
 */

class Character {
    constructor(data) {
        // Datos básicos
        this.id = data.id;
        this.name = data.name;
        this.title = data.title;
        this.image = data.image;
        this.clan = data.clan;
        this.element = data.element;
        this.rarity = data.rarity;
        this.isPlayer = data.isPlayer || false;
        
        // Estadísticas de combate
        this.maxHealth = data.max_health || data.maxHealth;
        this.currentHealth = data.currentHealth || this.maxHealth;
        this.attackMin = data.attack_min || data.attackMin || 50;
        this.attackMax = data.attack_max || data.attackMax || 100;
        this.armor = data.armor || 0;
        this.elementalResistance = data.elemental_resistance || data.elementalResistance || 0;
        
        // Sistema de energía
        this.maxEnergy = 100;
        this.currentEnergy = data.energy || 100;
        
        // Estados especiales
        this.isDefending = false;
        this.statusEffects = [];
        this.cooldowns = {};
        
        // Mecánicas especiales por personaje
        this.initializeSpecialMechanics();
        
        // Ataques y habilidades
        this.attacks = this.initializeAttacks();
        this.passives = this.initializePassives();
    }

    initializeSpecialMechanics() {
        switch(this.name) {
            case 'Xair Chikyu':
                this.bijonEnergy = 0;
                this.maxBijonEnergy = 100;
                this.bijonOvercharge = false;
                break;
            case 'Shuna Shieda':
                this.furyStacks = 0;
                this.maxFuryStacks = 5;
                break;
            case 'Ozen Kimura':
                this.frostArmor = 0;
                this.maxFrostArmor = 100;
                break;
        }
    }

    initializeAttacks() {
        const baseAttacks = {
            basic: {
                name: 'Ataque Básico',
                cost: 0,
                cooldown: 1000,
                damage: [this.attackMin * 0.6, this.attackMax * 0.6],
                critChance: 15
            },
            elemental: {
                name: 'Ataque Elemental',
                cost: 30,
                cooldown: 3000,
                damage: [this.attackMin * 1.2, this.attackMax * 1.2],
                critChance: 20
            },
            ultimate: {
                name: 'Ataque Definitivo',
                cost: 70,
                cooldown: 8000,
                damage: [this.attackMin * 2.0, this.attackMax * 2.0],
                critChance: 25
            }
        };

        // Personalizar ataques por personaje
        switch(this.name) {
            case 'Xair Chikyu':
                return {
                    basic: {
                        ...baseAttacks.basic,
                        name: 'Ráfaga Bijon',
                        description: 'Ataque básico que genera energía Bijon',
                        execute: () => this.executeRafagaBijon()
                    },
                    elemental: {
                        ...baseAttacks.elemental,
                        name: 'Tormenta de Viento Helado',
                        description: 'Canaliza el viento para crear una tormenta devastadora',
                        execute: () => this.executeTormentaViento()
                    },
                    ultimate: {
                        ...baseAttacks.ultimate,
                        name: 'Cataclismo Bijon',
                        description: 'Libera todo el poder del Bijon',
                        execute: () => this.executeCataclismoBijon()
                    }
                };

            case 'Shuna Shieda':
                return {
                    basic: {
                        ...baseAttacks.basic,
                        name: 'Golpe Devastador',
                        description: 'Ataque feroz que acumula furia',
                        execute: () => this.executeGolpeDevastador()
                    },
                    elemental: {
                        ...baseAttacks.elemental,
                        name: 'Ira Shieda',
                        description: 'Canaliza la ira ancestral del clan',
                        execute: () => this.executeIraShieda()
                    },
                    ultimate: {
                        ...baseAttacks.ultimate,
                        name: 'Furia Ancestral',
                        description: 'Libera toda la furia acumulada',
                        execute: () => this.executeFuriaAncestral()
                    }
                };

            case 'Ozen Kimura':
                return {
                    basic: {
                        ...baseAttacks.basic,
                        name: 'Golpe Helado',
                        description: 'Ataque que puede congelar al enemigo',
                        execute: () => this.executeGolpeHelado()
                    },
                    elemental: {
                        ...baseAttacks.elemental,
                        name: 'Ventisca Kimura',
                        description: 'Invoca una ventisca devastadora',
                        execute: () => this.executeVentiscaKimura()
                    },
                    ultimate: {
                        ...baseAttacks.ultimate,
                        name: 'Glaciar Eterno',
                        description: 'Crea un glaciar que protege y ataca',
                        execute: () => this.executeGlaciarEterno()
                    }
                };

            default:
                return baseAttacks;
        }
    }

    initializePassives() {
        switch(this.name) {
            case 'Xair Chikyu':
                return [
                    {
                        name: 'Maestro del Bijon',
                        description: 'Cada ataque genera 15 puntos de Energía Bijon'
                    },
                    {
                        name: 'Viento Gélido',
                        description: 'Los ataques elementales tienen probabilidad de reducir energía enemiga'
                    }
                ];

            case 'Shuna Shieda':
                return [
                    {
                        name: 'Furia Shieda',
                        description: 'Cada golpe recibido aumenta el daño'
                    },
                    {
                        name: 'Resistencia Devastadora',
                        description: 'Alta resistencia a efectos de estado'
                    }
                ];

            case 'Ozen Kimura':
                return [
                    {
                        name: 'Armadura de Escarcha',
                        description: 'Reduce daño recibido gradualmente'
                    },
                    {
                        name: 'Aura Congelante',
                        description: 'Los ataques pueden congelar al enemigo'
                    }
                ];

            default:
                return [];
        }
    }

    // === Métodos de combate ===
    takeDamage(amount) {
        // Aplicar reducción por armadura
        const armorReduction = Math.min(this.armor * 0.01, 0.75);
        const finalDamage = Math.floor(amount * (1 - armorReduction));
        
        this.currentHealth = Math.max(0, this.currentHealth - Math.max(1, finalDamage));
        
        // Efectos especiales al recibir daño
        this.onTakeDamage(finalDamage);
        
        return finalDamage;
    }

    onTakeDamage(damage) {
        switch(this.name) {
            case 'Shuna Shieda':
                // Acumular furia al recibir daño
                this.furyStacks = Math.min(this.furyStacks + 1, this.maxFuryStacks);
                break;
            case 'Ozen Kimura':
                // Generar armadura de escarcha
                this.frostArmor = Math.min(this.frostArmor + 10, this.maxFrostArmor);
                break;
        }
    }

    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    consumeEnergy(amount) {
        this.currentEnergy = Math.max(0, this.currentEnergy - amount);
    }

    regenerateEnergy(amount) {
        this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + amount);
    }

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

    updateCooldowns() {
        const now = Date.now();
        Object.keys(this.cooldowns).forEach(key => {
            if (this.cooldowns[key] <= now) {
                delete this.cooldowns[key];
            }
        });
    }

    // === Métodos específicos de Xair ===
    executeRafagaBijon() {
        this.bijonEnergy = Math.min(this.bijonEnergy + 15, this.maxBijonEnergy);
        return { bijonGenerated: 15 };
    }

    executeTormentaViento() {
        const extraDamage = Math.floor(this.bijonEnergy * 0.1);
        return { extraDamage, windEffect: true };
    }

    executeCataclismoBijon() {
        if (this.bijonEnergy >= 100) {
            this.bijonOvercharge = true;
            this.bijonEnergy = 0;
            return { 
                overcharge: true, 
                damageMultiplier: 1.5,
                resetCooldowns: true 
            };
        }
        return { overcharge: false };
    }

    // === Métodos específicos de Shuna ===
    executeGolpeDevastador() {
        const furyBonus = this.furyStacks * 0.1;
        return { furyBonus, furyStacks: this.furyStacks };
    }

    executeIraShieda() {
        const damageBonus = this.furyStacks * 0.15;
        return { damageBonus, devastationEffect: true };
    }

    executeFuriaAncestral() {
        const totalBonus = this.furyStacks * 0.25;
        this.furyStacks = 0; // Consume toda la furia
        return { 
            damageBonus: totalBonus,
            furyConsumed: true,
            lifeSteal: 0.2 
        };
    }

    // === Métodos específicos de Ozen ===
    executeGolpeHelado() {
        const frostChance = 0.3 + (this.frostArmor * 0.002);
        return { 
            frostChance,
            freezeEffect: Math.random() < frostChance 
        };
    }

    executeVentiscaKimura() {
        const armorBonus = Math.floor(this.frostArmor * 0.1);
        this.frostArmor = Math.min(this.frostArmor + 20, this.maxFrostArmor);
        return { 
            armorBonus,
            blizzardEffect: true,
            frostGenerated: 20 
        };
    }

    executeGlaciarEterno() {
        const shield = Math.floor(this.maxHealth * 0.2);
        this.frostArmor = this.maxFrostArmor; // Maximiza la armadura de escarcha
        return { 
            shield,
            glacierEffect: true,
            maxFrostArmor: true 
        };
    }

    // === Getters de estado ===
    get healthPercentage() {
        return (this.currentHealth / this.maxHealth) * 100;
    }

    get energyPercentage() {
        return (this.currentEnergy / this.maxEnergy) * 100;
    }

    get isAlive() {
        return this.currentHealth > 0;
    }

    get canUseAction() {
        return this.isAlive && !this.isDefending;
    }

    // === Serialización para guardar estado ===
    serialize() {
        return {
            id: this.id,
            name: this.name,
            currentHealth: this.currentHealth,
            currentEnergy: this.currentEnergy,
            statusEffects: this.statusEffects,
            cooldowns: this.cooldowns,
            // Mecánicas especiales
            bijonEnergy: this.bijonEnergy,
            furyStacks: this.furyStacks,
            frostArmor: this.frostArmor
        };
    }

    static deserialize(data, originalCharacterData) {
        const character = new Character(originalCharacterData);
        character.currentHealth = data.currentHealth;
        character.currentEnergy = data.currentEnergy;
        character.statusEffects = data.statusEffects || [];
        character.cooldowns = data.cooldowns || {};
        
        // Restaurar mecánicas especiales
        if (data.bijonEnergy !== undefined) character.bijonEnergy = data.bijonEnergy;
        if (data.furyStacks !== undefined) character.furyStacks = data.furyStacks;
        if (data.frostArmor !== undefined) character.frostArmor = data.frostArmor;
        
        return character;
    }
}

// Hacer la clase disponible globalmente
window.Character = Character;
