export class XairChikyu {
    constructor() {
        this.stats = {
            id: 3,
            name: "Xair Chikyu",
            title: "El viento gélido de los Chikyu",
            description: "Inventor del Bijon, energía que le otorga un poder devastador. Maestro del clan Chikyu.",
            image: "xair.png",
            rarity: "rare",
            clan: "Chikyu",
            element: "Hielo",
            
            // Estadísticas de combate
            attack: {
                min: 90,
                max: 120
            },
            health: {
                max: 900,
                current: 900
            },
            armor: 15,
            defenseReduction: 15,
            elementalResistance: 25,
            
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
        
        // Multiplicadores por rareza (rare)
        this.rarityMultipliers = {
            attackMultiplier: 1.1,
            healthMultiplier: 1.05,
            armorMultiplier: 1.0,
            experienceMultiplier: 1.2
        };
    }
    
    /**
     * Obtiene las estadísticas actuales del personaje
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Calcula el daño de ataque aleatorio
     */
    calculateAttackDamage() {
        const baseAttack = Math.floor(
            Math.random() * (this.stats.attack.max - this.stats.attack.min + 1) + 
            this.stats.attack.min
        );
        return baseAttack;
    }
    
    /**
     * Recibe daño y actualiza la salud
     */
    takeDamage(damage) {
        // Aplicar reducción de daño por armadura
        const armorReduction = this.stats.armor / 100;
        const finalDamage = Math.max(1, Math.floor(damage * (1 - armorReduction)));
        
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
     * Habilidad especial: Viento Gélido (Bijon)
     * Ataque de hielo que puede congelar al enemigo
     */
    glacialWind() {
        if (this.stats.energy >= 25) {
            this.stats.energy -= 25;
            const damage = this.calculateAttackDamage() * 1.5;
            return {
                success: true,
                message: "Xair desata el poder del Bijon",
                damage: Math.floor(damage),
                effect: "freeze",
                freezeChance: 30
            };
        }
        return { success: false, message: "No hay suficiente energía" };
    }
    
    /**
     * Obtiene información del elemento para resistencias
     */
    getElementInfo() {
        return {
            element: this.stats.element,
            resistance: this.stats.elementalResistance
        };
    }
}

export default XairChikyu;
