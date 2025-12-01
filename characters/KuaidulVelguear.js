/**
 * Kuaidul Velguear - El Duelista de Cartas
 * Elemento: Ninguno (Cartas Mágicas)
 * Rareza: Legendary
 * Clan: Duelistas
 */

export class KuaidulVelguear {
    constructor() {
        this.stats = {
            id: 8,
            name: "Kuaidul Velguear",
            title: "El Duelista de Cartas",
            description: "Un maestro duelista que invoca el poder de las cartas mágicas. Frágil pero letal, su arsenal incluye al legendario Transamu Armor Nova.",
            image: "kuaidul.jpg",
            rarity: "legendary",
            clan: "Duelistas",
            element: "Ninguno",

            // Estadísticas de combate - Vida muy baja por ser duelista
            attack: {
                min: 120,
                max: 240
            },
            health: {
                max: 650,
                current: 650
            },
            armor: 10, // Armadura baja
            defenseReduction: 15,
            elementalResistance: 20,

            // Estadísticas calculadas
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,

            // Estados de combate
            alive: true,
            statusEffects: [],
            energy: 100,
            maxEnergy: 100,

            // Estadísticas especiales de Kuaidul
            shield: 650, // Escudo inicial de 650
            maxShield: 650,
            
            // Estado de Transamu Armor Nova
            transamuActive: false,
            originalStats: null
        };
    }

    /**
     * Obtiene las estadísticas actuales del personaje
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Calcula el daño de ataque - Z02 Seves Road Magician
     */
    calculateAttackDamage() {
        const baseAttack = Math.floor(
            Math.random() * (this.stats.attack.max - this.stats.attack.min + 1) +
            this.stats.attack.min
        );

        // Si tiene Transamu activo, el daño ya está duplicado en las stats
        const transamuEffect = this.stats.statusEffects.find(
            effect => effect.type === 'kuaidul_transamu_armor'
        );

        return { 
            damage: baseAttack, 
            critical: false, 
            cardMagic: true,
            transamuPower: !!transamuEffect
        };
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
        this.stats.shield = this.stats.maxShield;
        this.stats.transamuActive = false;
        
        // Restaurar stats originales si fueron modificados
        if (this.stats.originalStats) {
            this.stats.attack = { ...this.stats.originalStats.attack };
            this.stats.armor = this.stats.originalStats.armor;
            this.stats.defenseReduction = this.stats.originalStats.defenseReduction;
            this.stats.originalStats = null;
        }
    }

    /**
     * Habilidad especial: Astral Fusion - Transamu Armor Nova
     * Corte de 250-300 daño y duplica estadísticas por 3 turnos
     * Efecto dorado especial al activarse
     */
    transamuArmorNova() {
        if (this.stats.energy >= 50) {
            this.stats.energy -= 50;

            // Guardar stats originales si no están guardados
            if (!this.stats.originalStats) {
                this.stats.originalStats = {
                    attack: { ...this.stats.attack },
                    armor: this.stats.armor,
                    defenseReduction: this.stats.defenseReduction
                };
            }

            // Duplicar estadísticas
            this.stats.attack.min *= 2;
            this.stats.attack.max *= 2;
            this.stats.armor = Math.min(80, this.stats.armor * 2);
            this.stats.defenseReduction *= 2;
            this.stats.transamuActive = true;

            // Activar buff de Transamu
            // Remover buff anterior si existe
            this.stats.statusEffects = this.stats.statusEffects.filter(
                effect => effect.type !== 'kuaidul_transamu_armor'
            );

            this.stats.statusEffects.push({
                type: 'kuaidul_transamu_armor',
                duration: 3, // 3 turnos
                goldenAura: true, // Efecto dorado
                statsMultiplier: 2
            });

            // Daño del corte inicial
            const slashDamage = Math.floor(Math.random() * (300 - 250 + 1) + 250);

            return {
                success: true,
                damage: slashDamage,
                message: "¡ASTRAL FUSION! Kuaidul invoca a Transamu Armor Nova - ¡Un aura dorada envuelve el campo de batalla!",
                goldenEffect: true, // Flag para efectos visuales dorados
                statsDoubled: true,
                duration: 3,
                newAttack: { min: this.stats.attack.min, max: this.stats.attack.max }
            };
        }
        return { success: false, message: "No hay suficiente energía para la fusión astral" };
    }

    /**
     * Defensa especial: Kuriboh
     * 50% chance de negar totalmente el ataque
     */
    defend() {
        // Regenerar energía
        const energyGain = 15;
        this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + energyGain);

        // Aplicar efecto de defensa con Kuriboh
        this.stats.statusEffects = this.stats.statusEffects || [];
        this.stats.statusEffects = this.stats.statusEffects.filter(effect => effect.type !== 'defend');

        // Kuriboh tiene 50% de negar el ataque completamente
        const kuribohNegate = Math.random() < 0.5;

        this.stats.statusEffects.push({
            type: 'defend',
            duration: 1,
            effect: kuribohNegate ? 'complete_negate' : 'damage_reduction',
            value: kuribohNegate ? 100 : 30, // 100% si niega, 30% si no
            kuribohActivated: kuribohNegate
        });

        if (kuribohNegate) {
            return {
                success: true,
                message: "¡Kuriboh aparece! El pequeño espíritu está listo para sacrificarse y negar el próximo ataque completamente.",
                kuribohReady: true,
                defenseBoost: 100,
                energyGained: energyGain
            };
        } else {
            return {
                success: true,
                message: "Kuaidul se prepara para defenderse. Kuriboh no respondió al llamado esta vez.",
                kuribohReady: false,
                defenseBoost: 30,
                energyGained: energyGain
            };
        }
    }

    /**
     * Procesa el fin de turno - reduce duración de efectos
     */
    endTurn() {
        // Reducir duración de efectos
        this.stats.statusEffects = this.stats.statusEffects.map(effect => ({
            ...effect,
            duration: effect.duration - 1
        })).filter(effect => effect.duration > 0);

        // Verificar si Transamu terminó
        const transamuEffect = this.stats.statusEffects.find(
            effect => effect.type === 'kuaidul_transamu_armor'
        );

        if (!transamuEffect && this.stats.transamuActive && this.stats.originalStats) {
            // Restaurar stats originales
            this.stats.attack = { ...this.stats.originalStats.attack };
            this.stats.armor = this.stats.originalStats.armor;
            this.stats.defenseReduction = this.stats.originalStats.defenseReduction;
            this.stats.transamuActive = false;
        }
    }

    /**
     * Obtiene información del elemento para resistencias
     */
    getElementInfo() {
        return {
            element: this.stats.element,
            resistance: this.stats.elementalResistance,
            specialProperties: ["card_magic", "kuriboh_shield", "transamu_fusion"]
        };
    }

    /**
     * Información específica de las habilidades de Kuaidul
     */
    getAbilities() {
        return {
            passive: {
                name: "Escudo de Duelista",
                description: "Comienza con un escudo de 600 puntos que absorbe daño antes de afectar su vida",
                effects: ["shield_600_initial"]
            },
            basic: {
                name: "Z02 Seves Road Magician",
                description: "Invoca al mago de cartas para atacar con 120-240 de daño",
                effects: ["card_magic_damage", "variable_damage"]
            },
            special: {
                name: "Astral Fusion: Transamu Armor Nova",
                description: "Realiza un corte devastador de 250-300 daño y duplica todas las estadísticas por 3 turnos. ¡Efecto dorado legendario!",
                cost: 50,
                effects: ["slash_250_300", "stats_x2", "duration_3", "golden_aura"]
            },
            defend: {
                name: "Kuriboh",
                description: "Invoca a Kuriboh: 50% de probabilidad de negar completamente el próximo ataque, si falla reduce 30% del daño",
                effects: ["50%_complete_negate", "30%_fallback_reduction", "energy_regen_15"]
            }
        };
    }

    /**
     * Verifica si el efecto dorado de Transamu está activo
     */
    hasGoldenAura() {
        return this.stats.statusEffects.some(
            effect => effect.type === 'kuaidul_transamu_armor' && effect.goldenAura
        );
    }
}

export default KuaidulVelguear;
