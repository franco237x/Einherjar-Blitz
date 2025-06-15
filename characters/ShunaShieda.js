import { Character } from './Character.js';

export class ShunaShieda extends Character {    constructor(data) {
        super(data);
        this.clan = "Shieda";
        this.element = "Devastación";
        this.doctrineActive = false;
        this.originalImage = data.image;
    }
    
    initializePassives() {
        return [
            {
                name: "Aura Abrasadora",
                description: "Todos los ataques de Shuna aplican 'Quemadura' que causa daño cada turno.",
                type: "offensive"
            }
        ];
    }
      initializeAttacks() {
        return {
            basic: {
                name: "Látigo Primordial",
                description: "Un azote devastador que quema al enemigo",
                energyCost: 0,
                cooldown: 1000,
                multiplier: 1.0,
                critChance: 18,
                execute: (target) => this.executeLatigoPrimordial(target)
            },
            elemental: {
                name: "Cuna de Judas",
                description: "Elemento Devastación: Un ataque que reduce la capacidad de curación",
                energyCost: 30,
                cooldown: 3000,
                multiplier: 2.2,
                critChance: 25,
                execute: (target) => this.executeCunaJudas(target)
            },
            ultimate: {
                name: "Doctrina Perfecta: Infierno en la Tierra",
                description: "Transformación que libera una explosión masiva de devastación",
                energyCost: 70,
                cooldown: 8000,
                multiplier: 4.5,
                critChance: 60,
                execute: (target) => this.executeDoctorinaPerfecta(target)
            }
        };
    }
      // Implementación de ataques específicos
    executeLatigoPrimordial(target) {
        const result = this.calculateDamage(target, this.attacks.basic);
        
        // Aplicar Aura Abrasadora - siempre aplica quemadura
        this.applyBurnEffect(target, 15); // 15 de daño por turno
        
        result.additionalEffect = "¡Aura Abrasadora activa! El enemigo se quema";
        
        return result;
    }
    
    executeCunaJudas(target) {
        const attack = this.attacks.elemental;
        const result = this.calculateDamage(target, attack);
        
        // Aplicar Aura Abrasadora - quemadura más intensa
        this.applyBurnEffect(target, 25); // 25 de daño por turno
        
        // Efecto especial: Reduce curación (Elemento Devastación)
        if (target.addEffect) {
            target.addEffect({
                name: "Devastación",
                description: "La curación se reduce en 75%",
                duration: 4,
                type: "debuff",
                onHeal: (healAmount) => {
                    return Math.floor(healAmount * 0.25); // Solo 25% de curación efectiva
                }
            });
        }
        
        result.additionalEffect = "¡Elemento Devastación! Curación reducida y quemadura intensa";
        
        return result;
    }
    
    executeDoctorinaPerfecta(target) {
        const attack = this.attacks.ultimate;
        
        // Transformación: Cambiar apariencia
        this.doctrineActive = true;
        this.triggerTransformation();
        
        // Explosión masiva - daño escalado
        const explosionMultiplier = this.doctrineActive ? attack.multiplier + 1.5 : attack.multiplier;
        const modifiedAttack = { 
            ...attack, 
            multiplier: explosionMultiplier 
        };
        
        const result = this.calculateDamage(target, modifiedAttack);
        
        // Aplicar Aura Abrasadora - quemadura devastadora
        this.applyBurnEffect(target, 40); // 40 de daño por turno
        
        // Efecto adicional: Marca del Infierno
        if (target.addEffect) {
            target.addEffect({
                name: "Marca del Infierno",
                description: "Recibe 50% más daño de fuego y no puede regenerar energía",
                duration: 6,
                type: "curse",
                damageMultiplier: 1.5,
                blockEnergyRegen: true
            });
        }
        
        // Efecto temporal de poder aumentado
        this.addEffect({
            name: "Doctrina Activa",
            description: "Todos los ataques tienen +100% de daño",
            duration: 3,
            type: "transformation",
            damageBonus: 2.0
        });
        
        result.additionalEffect = "¡TRANSFORMACIÓN! Infierno desatado, marca maldita aplicada";
        
        return result;
    }
      // Método para aplicar efecto de quemadura (Aura Abrasadora)
    applyBurnEffect(target, damage) {
        if (!target.addEffect) return;
        
        // Remover quemadura anterior si existe
        if (target.removeEffect) {
            target.removeEffect("Quemadura");
        }
        
        target.addEffect({
            name: "Quemadura",
            description: `Sufre ${damage} de daño de fuego por turno`,
            duration: 5,
            type: "dot",
            onTurnStart: (character) => {
                const burnDamage = damage;
                character.takeDamage(burnDamage);
                return `🔥 ${character.name || "Enemigo"} sufre ${burnDamage} de daño por quemadura`;
            }
        });
    }
      // Método de transformación visual simplificado
    triggerTransformation() {
        // Cambiar apariencia de forma minimalista
        if (typeof window !== 'undefined') {
            const championCard = document.getElementById('champion-card');
            if (championCard) {
                championCard.classList.add('doctrine-transformation');
                
                // Mensaje simple sin animaciones excesivas
                console.log(`🔥 ${this.name}: DOCTRINA PERFECTA ACTIVADA`);
            }
        }
    }
    
    // Sobrescribir método de pasivas ofensivas para nuevos efectos
    applyOffensivePassives(damage, attack, target) {
        let modifiedDamage = damage;
        
        // Bonus de Doctrina Activa
        const doctrineEffect = this.activeEffects.find(e => e.name === "Doctrina Activa");
        if (doctrineEffect && doctrineEffect.damageBonus) {
            modifiedDamage = Math.floor(modifiedDamage * doctrineEffect.damageBonus);
        }
        
        // Bonus contra enemigos quemándose
        if (target.hasEffect && target.hasEffect("Quemadura")) {
            modifiedDamage = Math.floor(modifiedDamage * 1.25); // +25% contra enemigos quemándose
        }
        
        return modifiedDamage;
    }
      getAttackDescription(attack, damage, isCritical) {
        let description = super.getAttackDescription(attack, damage, isCritical);
        
        if (this.doctrineActive) {
            description += ` [DOCTRINA PERFECTA]`;
        }
        
        if (this.element) {
            description += ` [${this.element}]`;
        }
        
        return description;
    }
    
    // Método especial para cuando elimina un enemigo
    onEnemyKilled() {
        // En la nueva versión, Shuna se alimenta del caos
        const energyRestore = 50;
        this.restoreEnergy(energyRestore);
        
        // Intensifica su aura abrasadora temporalmente
        this.addEffect({
            name: "Aura Intensificada",
            description: "Las quemaduras causan el doble de daño",
            duration: 3,
            type: "buff"
        });
        
        return `🔥 Shuna se alimenta del caos! +${energyRestore} energía, aura intensificada`;
    }
    
    // Información adicional para el UI
    getDisplayData() {
        const baseData = super.getDisplayData();
        return {
            ...baseData,
            doctrineActive: this.doctrineActive,
            element: this.element,
            clan: this.clan,
            transformation: this.doctrineActive ? "Doctrina Perfecta" : null
        };
    }
}
