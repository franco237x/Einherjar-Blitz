/**
 * Shuna Shieda - La Furia de los Shiedas
 * Elemento: Devastación
 * Rareza: Legendary
 * Clan: Shieda
 */

export class ShunaShieda {
    constructor() {
        this.stats = {
            id: 1,
            name: "Shuna Shieda",
            title: "La Furia de los Shiedas",
            description: "La cúspide de poder de los Shiedas, feroz y letal. Maestra del elemento Devastación.",
            image: "shuna.jpg",
            rarity: "legendary",
            clan: "Shieda",
            element: "Devastación",
            
            // Estadísticas de combate
            attack: {
                min: 115,
                max: 140
            },
            health: {
                max: 1000,
                current: 1000
            },
            armor: 15,
            defenseReduction: 45,
            elementalResistance: 60,
            
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
     * Obtiene información del elemento para resistencias
     */
    getElementInfo() {
        return {
            element: this.stats.element,
            resistance: this.stats.elementalResistance
        };
    }
}

export default ShunaShieda;
