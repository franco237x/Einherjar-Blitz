/**
 * Raiden - El Guerrero de las Sombras
 * Elemento: Oscuridad
 * Rareza: Epic
 * Clan: Desconocido
 */

export class Raiden {
    constructor() {
        this.stats = {
            id: 6,
            name: "Raiden",
            title: "El Guerrero de las Sombras",
            description: "Un peleador balanceado que domina el elemento oscuridad. Puede resurgir con poder de las sombras.",
            image: "raiden.jpeg",
            rarity: "epic",
            clan: "Sombra",
            element: "Oscuridad",

            // Estadísticas de combate
            attack: {
                min: 130,
                max: 160
            },
            health: {
                max: 1050,
                current: 1050
            },
            armor: 20,
            defenseReduction: 25,
            elementalResistance: 40,

            // Estadísticas calculadas
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,

            // Estados de combate
            alive: true,
            statusEffects: [],
            energy: 100,
            maxEnergy: 100,

            // Estadísticas especiales de Raiden
            shield: 0, // Escudo de Resurrección de Sombra
            maxShield: 300
        };
    }

    /**
     * Obtiene las estadísticas actuales del personaje
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Calcula el daño de ataque - Corte Umbrío
     */
    calculateAttackDamage() {
        const baseAttack = Math.floor(
            Math.random() * (this.stats.attack.max - this.stats.attack.min + 1) +
            this.stats.attack.min
        );

        // Si tiene Resurrección de Sombra activa, x2 daño
        const shadowResurrection = this.stats.statusEffects.find(
            effect => effect.type === 'raiden_shadow_resurrection'
        );

        if (shadowResurrection) {
            return {
                damage: baseAttack * 2,
                critical: false,
                shadowPower: true
            };
        }

        return { damage: baseAttack, critical: false };
    }

    /**
     * Recibe daño - primero absorbe el escudo, luego la vida
     */
    takeDamage(damage) {
        // Aplicar reducción de daño por armadura
        const armorReduction = this.stats.armor / 100;
        let finalDamage = Math.max(1, Math.floor(damage * (1 - armorReduction)));

        // Si tiene escudo, absorber daño primero
        if (this.stats.shield > 0) {
            if (finalDamage >= this.stats.shield) {
                // El daño rompe el escudo y afecta la vida
                finalDamage -= this.stats.shield;
                this.stats.shield = 0;
                this.stats.health.current = Math.max(0, this.stats.health.current - finalDamage);
            } else {
                // El escudo absorbe todo el daño
                this.stats.shield -= finalDamage;
                finalDamage = 0; // No se pierde vida
            }
        } else {
            // Sin escudo, daño directo a la vida
            this.stats.health.current = Math.max(0, this.stats.health.current - finalDamage);
        }

        if (this.stats.health.current <= 0) {
            this.stats.alive = false;
        }

        return finalDamage;
    }

    /**
     * Cura al personaje
     */
    heal(amount) {
        this.stats.health.current = Math.min(
            this.stats.health.max,
            this.stats.health.current + amount
        );
    }

    /**
     * Verifica si el personaje está vivo
     */
    isAlive() {
        return this.stats.alive && this.stats.health.current > 0;
    }

    /**
     * Resetea el personaje a estado inicial
     */
    reset() {
        this.stats.health.current = this.stats.health.max;
        this.stats.alive = true;
        this.stats.statusEffects = [];
        this.stats.energy = this.stats.maxEnergy;
        this.stats.shield = 0;
    }

    /**
     * Habilidad especial: Resurrección de Sombra
     * Gana x2 daño y escudo de 300 puntos
     */
    shadowResurrection() {
        if (this.stats.energy >= 40) {
            this.stats.energy -= 40;

            // Activar buff de x2 daño
            this.stats.statusEffects.push({
                type: 'raiden_shadow_resurrection',
                duration: 5, // 5 turnos
                damageMultiplier: 2
            });

            // Otorgar escudo de 300
            this.stats.shield = this.stats.maxShield;

            return {
                success: true,
                message: "Raiden invoca el poder de las sombras: duplica su daño y gana un escudo de 300 puntos por 5 turnos",
                shieldGained: this.stats.maxShield,
                damageMultiplier: 2,
                duration: 5
            };
        }
        return { success: false, message: "No hay suficiente energía" };
    }

    /**
     * Defensa especial: Domo de Oscuridad
     */
    defend() {
        // Regenerar energía extra
        const energyGain = 20;
        this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + energyGain);

        // Aplicar efecto de defensa mejorado
        this.stats.statusEffects = this.stats.statusEffects || [];
        this.stats.statusEffects = this.stats.statusEffects.filter(effect => effect.type !== 'defend');

        this.stats.statusEffects.push({
            type: 'defend',
            duration: 1,
            effect: 'damage_reduction',
            value: 60 // 60% reducción (mejor que defensa normal)
        });

        return {
            success: true,
            message: "Raiden crea un Domo de Oscuridad: reduce 60% del daño y regenera energía",
            energyGained: energyGain,
            defenseBoost: 60
        };
    }

    /**
     * Obtiene información del elemento para resistencias
     */
    getElementInfo() {
        return {
            element: this.stats.element,
            resistance: this.stats.elementalResistance,
            specialProperties: ["shadow_shield", "darkness_power"]
        };
    }

    /**
     * Información específica de las habilidades de Raiden
     */
    getAbilities() {
        return {
            passive: {
                name: "Escudo de Sombras",
                description: "Puede ganar un escudo que absorbe daño antes de afectar su vida",
                effects: ["shield_absorption"]
            },
            basic: {
                name: "Corte Umbrío",
                description: "Ataque de oscuridad de 130-160 daño (x2 con Resurrección activa)",
                effects: ["darkness_damage"]
            },
            special: {
                name: "Resurrección de Sombra",
                description: "Duplica daño y gana escudo de 300 HP por 5 turnos",
                cost: 40,
                effects: ["damage_x2", "shield_300", "duration_5"]
            },
            defend: {
                name: "Domo de Oscuridad",
                description: "Reduce 60% del daño y regenera 20 de energía",
                effects: ["damage_reduction_60", "energy_regen_20"]
            }
        };
    }
}

export default Raiden;
