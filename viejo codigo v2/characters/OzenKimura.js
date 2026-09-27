/**
 * Ozen Kimura - La Muralla Inamovible de los Kimura
 * Elemento: Chakra
 * Rareza: Epic
 * Clan: Kimura
 */

export class OzenKimura {
    constructor() {
        this.stats = {
            id: 2,
            name: "Ozen Kimura",
            title: "La Muralla Inamovible de los Kimura",
            description: "Con una actitud fría como el acero, Ozen es una guerrera formidable del clan Kimura.",
            image: "ozen.jpg",
            rarity: "epic",
            clan: "Kimura",
            element: "Chakra",
            
            // Estadísticas de combate
            attack: {
                min: 100,
                max: 170
            },
            health: {
                max: 1200,
                current: 1200
            },
            armor: 30,
            defenseReduction: 5,
            elementalResistance: 65,
            
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
        // Aplicar reducción de daño por armadura (Ozen tiene alta armadura)
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
     * Habilidad especial: Muralla Defensiva
     * Aumenta temporalmente la armadura
     */
    defensiveWall() {
        if (this.stats.energy >= 30) {
            this.stats.energy -= 30;
            // Implementar lógica de habilidad defensiva
            return {
                success: true,
                message: "Ozen activa su Muralla Defensiva",
                armorBonus: 20,
                duration: 3
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

export default OzenKimura;
