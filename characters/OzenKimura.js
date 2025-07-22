import { Character } from './Character.js';

export class OzenKimura extends Character {
    constructor(data) {
        super(data);
        // Mecánicas especiales de Ozen ya definidas en el constructor base
        // Sobrescribir o añadir mecánicas específicas
        this.shieldPoints = 0;
        this.maxShieldPoints = 300;
        this.isDefensiveStance = false;
    }
    
    /**
     * Inicialización de mecánicas especiales de Ozen
     */
    initializeSpecialMechanics() {
        super.initializeSpecialMechanics();
        // Las mecánicas específicas ya se inicializan en el constructor
    }
    
    initializePassives() {
        return [
            {
                name: "Muralla Inamovible",
                description: "Al recibir daño, genera escudo igual al 15% del daño recibido. Máximo 300 puntos de escudo.",
                type: "defensive"
            },
            {
                name: "Contraataque Gélido",
                description: "Cuando el escudo se rompe, el siguiente ataque crítico está garantizado y congela al enemigo.",
                type: "counter"
            }
        ];
    }
    
    initializeAttacks() {
        return {
            basic: {
                name: "Golpe de Acero",
                description: "Un golpe firme que genera escudo",
                energyCost: 0,
                cooldown: 1000,
                multiplier: 1.1, // Ligeramente más fuerte que el básico normal
                critChance: 15,
                execute: (target) => this.executeGolpeAcero(target)
            },
            elemental: {
                name: "Muro de Hielo",
                description: "Crea una barrera defensiva y lanza fragmentos de hielo",
                energyCost: 30,
                cooldown: 3000,
                multiplier: 1.5,
                critChance: 20,
                execute: (target) => this.executeMuroHielo(target)
            },
            ultimate: {
                name: "Tormenta Glacial Kimura",
                description: "Libera el poder total de los Kimura en una tormenta devastadora",
                energyCost: 70,
                cooldown: 8000,
                multiplier: 3.8,
                critChance: 45,
                execute: (target) => this.executeTormentaGlacial(target)
            }
        };
    }
    
    // Implementación de ataques específicos
    executeGolpeAcero(target) {
        const result = this.calculateDamage(target, this.attacks.basic);
        
        // Genera escudo igual al 20% del daño hecho
        const shieldGenerated = Math.floor(result.damage * 0.2);
        this.addShield(shieldGenerated);
        
        result.additionalEffect = `Ozen genera ${shieldGenerated} puntos de escudo`;
        
        return result;
    }
    
    executeMuroHielo(target) {
        const attack = this.attacks.elemental;
        
        // Entra en postura defensiva
        this.isDefensiveStance = true;
        
        // Genera escudo adicional
        this.addShield(100);
        
        // El ataque puede congelar
        const result = this.calculateDamage(target, attack);
        
        if (Math.random() < 0.4) {
            target.addEffect({
                name: "Congelado",
                description: "No puede atacar el próximo turno",
                duration: 1,
                type: "disable"
            });
            result.additionalEffect = "¡El enemigo está congelado! +100 escudo, postura defensiva activada";
        } else {
            result.additionalEffect = "+100 escudo, postura defensiva activada";
        }
        
        return result;
    }
    
    executeTormentaGlacial(target) {
        const attack = this.attacks.ultimate;
        
        // Efecto especial: consume todo el escudo para multiplicar el daño
        const shieldBonus = this.shieldPoints > 0 ? (this.shieldPoints / 100) * 0.5 : 0;
        const modifiedAttack = { 
            ...attack, 
            multiplier: attack.multiplier + shieldBonus 
        };
        
        const consumedShield = this.shieldPoints;
        this.shieldPoints = 0;
        
        const result = this.calculateDamage(target, modifiedAttack);
        
        // Congela al enemigo por 2 turnos
        target.addEffect({
            name: "Congelado Profundo",
            description: "No puede atacar por 2 turnos",
            duration: 2,
            type: "disable"
        });
        
        // Reduce la velocidad del enemigo permanentemente
        if (!target.hasEffect("Hipotermia")) {
            target.addEffect({
                name: "Hipotermia",
                description: "Todos los ataques tienen -20% de velocidad",
                duration: 999,
                type: "debuff"
            });
        }
        
        result.additionalEffect = `Consumió ${consumedShield} escudo para bonus de daño. Enemigo congelado por 2 turnos`;
        
        return result;
    }
    
    // Métodos especiales del escudo
    addShield(amount) {
        this.shieldPoints = Math.min(this.maxShieldPoints, this.shieldPoints + amount);
    }
    
    hasEffect(effectName) {
        return this.activeEffects.some(effect => effect.name === effectName);
    }
    
    // Sobrescribir método de daño para incluir escudo
    takeDamage(damage) {
        let actualDamage = damage;
        
        // El escudo absorbe el daño primero
        if (this.shieldPoints > 0) {
            const shieldDamage = Math.min(this.shieldPoints, damage);
            this.shieldPoints -= shieldDamage;
            actualDamage -= shieldDamage;
            
            // Si el escudo se rompe, activa contraataque
            if (this.shieldPoints <= 0 && shieldDamage > 0) {
                this.activateCounterattack();
            }
        }
        
        // Postura defensiva reduce el daño en 30%
        if (this.isDefensiveStance) {
            actualDamage = Math.floor(actualDamage * 0.7);
            this.isDefensiveStance = false; // Se desactiva después de recibir daño
        }
        
        this.health = Math.max(0, this.health - actualDamage);
        
        // Pasiva: genera escudo del daño recibido
        if (actualDamage > 0) {
            const shieldGenerated = Math.floor(actualDamage * 0.15);
            this.addShield(shieldGenerated);
        }
        
        return this.health <= 0;
    }
    
    activateCounterattack() {
        this.addEffect({
            name: "Contraataque Preparado",
            description: "El próximo ataque será crítico garantizado",
            duration: 1,
            type: "buff",
            onAttack: () => {
                return { guaranteedCrit: true };
            }
        });
    }
    
    // Sobrescribir aplicación de pasivas ofensivas
    applyOffensivePassives(damage, attack, target) {
        let modifiedDamage = damage;
        
        // Verificar si tiene contraataque preparado
        const counterEffect = this.activeEffects.find(e => e.name === "Contraataque Preparado");
        if (counterEffect && counterEffect.onAttack) {
            const bonus = counterEffect.onAttack();
            if (bonus.guaranteedCrit) {
                modifiedDamage = Math.floor(modifiedDamage * 1.5); // Aplicar crítico manualmente
                this.removeEffect("Contraataque Preparado");
            }
        }
        
        return modifiedDamage;
    }
    
    getAttackDescription(attack, damage, isCritical) {
        let description = super.getAttackDescription(attack, damage, isCritical);
        
        if (this.shieldPoints > 0) {
            description += ` [Escudo: ${this.shieldPoints}]`;
        }
        
        if (this.isDefensiveStance) {
            description += ` [Postura Defensiva]`;
        }
        
        return description;
    }
    
    // Información adicional para el UI
    getDisplayData() {
        const baseData = super.getDisplayData();
        return {
            ...baseData,
            shieldPoints: this.shieldPoints,
            maxShieldPoints: this.maxShieldPoints,
            isDefensiveStance: this.isDefensiveStance,
            clan: this.clan
        };
    }
    
    /**
     * Información estática de la clase para el registro
     */
    static getCharacterInfo() {
        return {
            id: 'ozen-kimura',
            name: 'Ozen Kimura',
            type: 'tank',
            description: 'Guerrera defensiva del clan Kimura especializada en escudos y contraataques',
            specialMechanics: ['Shield Generation', 'Defensive Stance', 'Counter Attack'],
            clan: 'Kimura',
            element: 'Hielo'
        };
    }
}
