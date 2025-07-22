import { Character } from './Character.js';

export class XairChikyu extends Character {
    constructor(data) {
        super(data);
        // Mecánicas especiales de Xair
        this.bijonEnergy = 0;
        this.maxBijonEnergy = 100;
        this.bijonOvercharge = false;
    }
    
    /**
     * Inicialización de mecánicas especiales de Xair
     */
    initializeSpecialMechanics() {
        super.initializeSpecialMechanics();
        // Las mecánicas específicas ya se inicializan en el constructor
    }
    
    initializePassives() {
        return [
            {
                name: "Maestro del Bijon",
                description: "Cada ataque genera 15 puntos de Energía Bijon. Al llegar a 100, entra en Sobrecarga Bijon.",
                type: "resource"
            },
            {
                name: "Viento Gélido",
                description: "Los ataques elementales tienen 35% de probabilidad de reducir la energía del enemigo en 20.",
                type: "utility"
            }
        ];
    }
    
    initializeAttacks() {
        return {
            basic: {
                name: "Ráfaga Bijon",
                description: "Un ataque básico que acumula energía Bijon",
                energyCost: 0,
                cooldown: 1000,
                multiplier: 0.9, // Menos daño base pero genera Bijon
                critChance: 18,
                execute: (target) => this.executeRafagaBijon(target)
            },
            elemental: {
                name: "Tormenta de Viento Helado",
                description: "Canaliza el Bijon para crear una tormenta devastadora",
                energyCost: 30,
                cooldown: 3000,
                multiplier: 2.0,
                critChance: 28,
                execute: (target) => this.executeTormentaViento(target)
            },
            ultimate: {
                name: "Cataclismo Bijon",
                description: "Libera todo el poder del Bijon en un ataque que puede resetear cooldowns",
                energyCost: 70,
                cooldown: 8000,
                multiplier: 3.2,
                critChance: 55,
                execute: (target) => this.executeCataclismoBijon(target)
            }
        };
    }
    
    // Implementación de ataques específicos
    executeRafagaBijon(target) {
        const result = this.calculateDamage(target, this.attacks.basic);
        
        // Genera Bijon
        this.addBijonEnergy(15);
        
        result.additionalEffect = `+15 Energía Bijon (${this.bijonEnergy}/100)`;
        
        return result;
    }
    
    executeTormentaViento(target) {
        const attack = this.attacks.elemental;
        
        // Si está en sobrecarga, el ataque es más fuerte
        const multiplier = this.bijonOvercharge ? attack.multiplier + 0.8 : attack.multiplier;
        const modifiedAttack = { ...attack, multiplier };
        
        const result = this.calculateDamage(target, modifiedAttack);
        
        // Probabilidad de drenar energía del enemigo
        if (Math.random() < 0.35) {
            if (target.energy !== undefined) {
                target.energy = Math.max(0, target.energy - 20);
                result.additionalEffect = "¡El viento helado drena 20 de energía del enemigo!";
            }
        }
        
        // Consume Bijon si está en sobrecarga
        if (this.bijonOvercharge) {
            this.bijonEnergy = Math.max(0, this.bijonEnergy - 30);
            if (this.bijonEnergy < 100) {
                this.bijonOvercharge = false;
            }
            result.additionalEffect = (result.additionalEffect || "") + " [Sobrecarga Bijon activa]";
        }
        
        this.addBijonEnergy(20);
        
        return result;
    }
    
    executeCataclismoBijon(target) {
        const attack = this.attacks.ultimate;
        
        // El daño depende de la energía Bijon acumulada
        const bijonMultiplier = this.bijonEnergy / 100;
        const modifiedAttack = { 
            ...attack, 
            multiplier: attack.multiplier + (bijonMultiplier * 1.5)
        };
        
        const result = this.calculateDamage(target, modifiedAttack);
        
        let effects = [];
        
        // Efectos especiales basados en energía Bijon
        if (this.bijonEnergy >= 80) {
            // Reduce cooldowns propios en 50%
            effects.push("Cooldowns reducidos en 50%");
            
            // Aplica "Marca del Viento" al enemigo
            target.addEffect({
                name: "Marca del Viento",
                description: "Recibe 25% más de daño de Xair",
                duration: 5,
                type: "debuff",
                damageMultiplier: 1.25
            });
            effects.push("Enemigo marcado por el viento");
        }
        
        if (this.bijonEnergy >= 100) {
            // Ataque adicional automático
            const bonusAttack = this.calculateDamage(target, { 
                ...this.attacks.elemental, 
                multiplier: 1.0 
            });
            result.damage += bonusAttack.damage;
            effects.push(`Ataque bonus: +${bonusAttack.damage} daño`);
            
            // Entra en sobrecarga permanente por 3 turnos
            this.addEffect({
                name: "Sobrecarga Bijon Prolongada",
                description: "Todos los ataques tienen +80% de daño",
                duration: 3,
                type: "buff"
            });
            effects.push("Sobrecarga Bijon prolongada activada");
        }
        
        // Consume toda la energía Bijon
        this.bijonEnergy = 0;
        this.bijonOvercharge = false;
        
        result.additionalEffect = effects.join(", ");
        
        return result;
    }
    
    // Métodos específicos del Bijon
    addBijonEnergy(amount) {
        this.bijonEnergy = Math.min(this.maxBijonEnergy, this.bijonEnergy + amount);
        
        // Activa sobrecarga al llegar a 100
        if (this.bijonEnergy >= 100 && !this.bijonOvercharge) {
            this.bijonOvercharge = true;
            this.addEffect({
                name: "Sobrecarga Bijon",
                description: "Todos los ataques elementales tienen +80% de daño",
                duration: 999, // Se mantiene hasta que se gaste el Bijon
                type: "buff"
            });
        }
    }
    
    // Sobrescribir aplicación de pasivas ofensivas
    applyOffensivePassives(damage, attack, target) {
        let modifiedDamage = damage;
        
        // Bonus de sobrecarga Bijon
        if (this.bijonOvercharge && attack.name !== "Ráfaga Bijon") {
            modifiedDamage = Math.floor(modifiedDamage * 1.8);
        }
        
        // Verificar efectos especiales
        const overchargeEffect = this.activeEffects.find(e => e.name === "Sobrecarga Bijon Prolongada");
        if (overchargeEffect) {
            modifiedDamage = Math.floor(modifiedDamage * 1.8);
        }
        
        return modifiedDamage;
    }
    
    // Sobrescribir aplicación de pasivas defensivas del objetivo
    applyDefensivePassives(damage, attack, attacker) {
        let modifiedDamage = damage;
        
        // Si el atacante es Xair y el defensor tiene Marca del Viento
        if (attacker && attacker.name === "Xair Chikyu") {
            const windMark = this.activeEffects.find(e => e.name === "Marca del Viento");
            if (windMark && windMark.damageMultiplier) {
                modifiedDamage = Math.floor(modifiedDamage * windMark.damageMultiplier);
            }
        }
        
        return modifiedDamage;
    }
    
    // Método especial para manejar turnos
    onTurnStart() {
        super.processEffects();
        
        // Regenera 5 de Bijon por turno si no está en sobrecarga
        if (!this.bijonOvercharge) {
            this.addBijonEnergy(5);
        }
        
        // Regenera energía más rápido
        this.restoreEnergy(15);
    }
    
    getAttackDescription(attack, damage, isCritical) {
        let description = super.getAttackDescription(attack, damage, isCritical);
        
        if (this.bijonEnergy > 0) {
            description += ` [Bijon: ${this.bijonEnergy}/100]`;
        }
        
        if (this.bijonOvercharge) {
            description += ` [SOBRECARGA]`;
        }
        
        return description;
    }
    
    // Información adicional para el UI
    getDisplayData() {
        const baseData = super.getDisplayData();
        return {
            ...baseData,
            bijonEnergy: this.bijonEnergy,
            maxBijonEnergy: this.maxBijonEnergy,
            bijonOvercharge: this.bijonOvercharge,
            clan: this.clan
        };
    }
    
    /**
     * Información estática de la clase para el registro
     */
    static getCharacterInfo() {
        return {
            id: 'xair-chikyu',
            name: 'Xair Chikyu',
            type: 'wind-mage',
            description: 'Maestro del viento del clan Chikyu especializado en energía Bijon',
            specialMechanics: ['Bijon Energy', 'Wind Control', 'Overcharge Mode'],
            clan: 'Chikyu',
            element: 'Viento'
        };
    }
}
