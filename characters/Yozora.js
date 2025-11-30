/**
 * Yozora - El Titán de Originium
 * Elemento: Originium (Multi-elemental)
 * Rareza: Legendary
 * Clan: Titanes
 */

export class Yozora {
    constructor() {
        this.stats = {
            id: 7,
            name: "Yozora",
            title: "El Titán de Originium",
            description: "Un guerrero titánico que controla el poder del Originium, capaz de generar caos elemental en el campo de batalla.",
            image: "yozora.png",
            rarity: "legendary",
            clan: "Kimura",
            element: "Originium",

            // Estadísticas de combate
            attack: {
                min: 160,
                max: 200
            },
            health: {
                max: 1300,
                current: 1300
            },
            armor: 35,
            defenseReduction: 20,
            elementalResistance: 70, // Alta resistencia elemental

            // Estadísticas calculadas
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,

            // Estados de combate
            alive: true,
            statusEffects: [],
            energy: 100,
            maxEnergy: 100
        };
    }

    /**
     * Obtiene las estadísticas actuales del personaje
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Calcula el daño de ataque - Tifón Originium
     */
    calculateAttackDamage() {
        const baseAttack = Math.floor(
            Math.random() * (this.stats.attack.max - this.stats.attack.min + 1) +
            this.stats.attack.min
        );

        return { damage: baseAttack, critical: false, originium: true };
    }

    /**
     * Recibe daño - Pasiva: Reduce daño elemental en 30 puntos
     */
    takeDamage(damage, isElemental = false) {
        let finalDamage = damage;

        // Pasiva: Reducir daño elemental
        if (isElemental) {
            finalDamage = Math.max(1, damage - 30);
        }

        // Aplicar reducción de daño por armadura
        const armorReduction = this.stats.armor / 100;
        finalDamage = Math.max(1, Math.floor(finalDamage * (1 - armorReduction)));

        this.stats.health.current = Math.max(0, this.stats.health.current - finalDamage);

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
    }

    /**
     * Habilidad especial: Apocalipsis Elemental de Originium
     * Hace 150 de daño + efecto elemental aleatorio (bajo coste)
     */
    apocalipsisElemental() {
        if (this.stats.energy >= 35) {
            this.stats.energy -= 35;

            // Efectos elementales posibles
            const elementalEffects = [
                { type: 'burn', name: 'Quemadura', damagePerTurn: 25, duration: 3 },
                { type: 'freeze', name: 'Congelación', missChance: 40, duration: 2 },
                { type: 'shock', name: 'Descarga', damagePerTurn: 30, duration: 2 },
                { type: 'poison', name: 'Envenenamiento', damagePerTurn: 20, duration: 4 },
                { type: 'weakness', name: 'Debilidad', damageReduction: 30, duration: 3 }
            ];

            const selectedEffect = elementalEffects[Math.floor(Math.random() * elementalEffects.length)];

            return {
                success: true,
                damage: 150,
                message: `Yozora desata el Apocalipsis Elemental: ${selectedEffect.name}!`,
                elementalEffect: selectedEffect
            };
        }
        return { success: false, message: "No hay suficiente energía" };
    }

    /**
     * Defensa especial: Barro Originium
     */
    defend() {
        // Regenerar energía
        const energyGain = 25;
        this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + energyGain);

        // Aplicar efecto de defensa
        this.stats.statusEffects = this.stats.statusEffects || [];
        this.stats.statusEffects = this.stats.statusEffects.filter(effect => effect.type !== 'defend');

        this.stats.statusEffects.push({
            type: 'defend',
            duration: 1,
            effect: 'damage_reduction',
            value: 70 // 70% reducción (titánica defensa)
        });

        return {
            success: true,
            message: "Yozora crea un Barro de Originium: reduce 70% del daño y regenera energía",
            energyGained: energyGain,
            defenseBoost: 70
        };
    }

    /**
     * Obtiene información del elemento para resistencias
     */
    getElementInfo() {
        return {
            element: this.stats.element,
            resistance: this.stats.elementalResistance,
            specialProperties: ["elemental_reduction", "multi_element", "titan_power"]
        };
    }

    /**
     * Información específica de las habilidades de Yozora
     */
    getAbilities() {
        return {
            passive: {
                name: "Resistencia Originium",
                description: "Reduce el daño elemental recibido en 30 puntos",
                effects: ["elemental_reduction_30"]
            },
            basic: {
                name: "Tifón Originium",
                description: "Ataque poderoso de 160-200 daño",
                effects: ["originium_damage"]
            },
            special: {
                name: "Apocalipsis Elemental de Originium",
                description: "150 de daño + efecto elemental aleatorio (quemadura/congelación/descarga/veneno/debilidad)",
                cost: 35,
                effects: ["fixed_damage_150", "random_elemental_effect"]
            },
            defend: {
                name: "Barro Originium",
                description: "Reduce 70% del daño y regenera 25 de energía",
                effects: ["damage_reduction_70", "energy_regen_25"]
            }
        };
    }
}

export default Yozora;
