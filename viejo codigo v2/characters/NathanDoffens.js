/**
 * Nathan Doffens - El relámpago paradójico
 * Elemento: Rayo
 * Rareza: Epic
 * Clan: Doffens
 */

export class NathanDoffens {
    constructor() {
        this.stats = {
            id: 4,
            name: "Nathan Doffens",
            title: "El relámpago paradójico",
            description: "Un guerrero del clan Doffens, conocido por su velocidad y su habilidad para teletransportarse hacia la victoria.",
            image: "nathan.png",
            rarity: "epic",
            clan: "Doffens",
            element: "Rayo",
            
            // Estadísticas de combate
            attack: {
                min: 70,
                max: 115
            },
            health: {
                max: 1000,
                current: 1000
            },
            armor: 17,
            defenseReduction: 30,
            elementalResistance: 50,
            
            // Estadísticas calculadas
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            
            // Estados de combate
            alive: true,
            statusEffects: [],
            energy: 100,
            maxEnergy: 100,
            
            // Estadísticas especiales de Nathan
            speed: 95, // Alta velocidad para teletransporte
            criticalChance: 25 // Alta probabilidad de crítico
        };
    }
    
    /**
     * Obtiene las estadísticas actuales del personaje
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Calcula el daño de ataque aleatorio con posibilidad de crítico
     */
    calculateAttackDamage() {
        const baseAttack = Math.floor(
            Math.random() * (this.stats.attack.max - this.stats.attack.min + 1) + 
            this.stats.attack.min
        );
        
        // Verificar crítico
        if (Math.random() * 100 < this.stats.criticalChance) {
            const criticalDamage = Math.floor(baseAttack * 1.8); // Daño crítico x1.8
            return { damage: criticalDamage, critical: true };
        }
        
        return { damage: baseAttack, critical: false };
    }
    
    /**
     * Recibe daño y actualiza la salud
     */
    takeDamage(damage) {
        // Nathan tiene chance de esquivar por su velocidad
        const dodgeChance = Math.min(30, this.stats.speed / 100 * 30);
        if (Math.random() * 100 < dodgeChance) {
            // Si esquiva, no recibe daño
            return 0;
        }
        
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
     * Habilidad especial: Teletransporte Paradójico
     * Ataque rápido con posibilidad de doble golpe
     */
    paradoxTeleport() {
        if (this.stats.energy >= 35) {
            this.stats.energy -= 35;
            const firstAttack = this.calculateAttackDamage();
            let totalDamage = firstAttack.damage;
            let effects = [firstAttack];
            
            // 40% de chance de segundo ataque
            if (Math.random() < 0.4) {
                const secondAttack = this.calculateAttackDamage();
                totalDamage += secondAttack.damage;
                effects.push(secondAttack);
            }
            
            return {
                success: true,
                message: "Nathan se teletransporta y ataca con velocidad paradójica",
                totalDamage,
                attacks: effects,
                effect: "stun",
                stunChance: 20
            };
        }
        return { success: false, message: "No hay suficiente energía" };
    }
    
    /**
     * Habilidad pasiva: Velocidad del Rayo
     * Aumenta la velocidad de ataque y esquiva
     */
    lightningSpeed() {
        return {
            speedBonus: Math.floor(this.stats.speed * this.rarityMultipliers.speedMultiplier),
            dodgeBonus: 15,
            criticalBonus: 10
        };
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

export default NathanDoffens;
