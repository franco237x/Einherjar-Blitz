/**
 * Zack Hisoka - El manipulador atómico
 * Elemento: Varionica (Cuántico)
 * Rareza: Legendary
 * Clan: Hisoka
 */

export class ZackHisoka {
    constructor() {
        this.stats = {
            id: 5,
            name: "Zack Hisoka",
            title: "El más grande genio",
            description: "El hombre con el intelecto más brillante del clan Hisoka.",
            image: "zack.png",
            rarity: "legendary",
            clan: "Hisoka",
            element: "Ninguno",
            
            // Estadísticas de combate (basadas en seleccion.php)
            attack: {
                min: 30,
                max: 250
            },
            health: {
                max: 750,
                current: 750
            },
            armor: 25,
            defenseReduction: 85, // 50% pasivo + 35% base = 85% total
            elementalResistance: 35,
            
            // Estadísticas calculadas
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            
            // Estados de combate
            alive: true,
            statusEffects: [],
            energy: 100,
            maxEnergy: 100,
            
            // Estadísticas especiales de Zack
            atomicMastery: 80, // Maestría atómica para efectos especiales
            phaseInduction: true, // Habilidad de inducción de fase activa
            canRegenerate: false // Zack no puede regenerarse normalmente
        };
        
        // Multiplicadores por rareza (legendary)
        this.rarityMultipliers = {
            attackMultiplier: 1.3,
            healthMultiplier: 1.2,
            armorMultiplier: 1.15,
            experienceMultiplier: 1.5
        };
    }
    
    /**
     * Obtiene las estadísticas actuales del personaje
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Calcula el daño de ataque aleatorio con Inducción de Fase Variónica
     */
    calculateAttackDamage() {
        // Ataque básico: Inducción de Fase Variónica (50/50 entre daño min/max)
        const useMinDamage = Math.random() < 0.5;
        const damage = useMinDamage ? this.stats.attack.min : this.stats.attack.max;
        
        return { 
            damage: damage, 
            critical: false,
            phaseType: useMinDamage ? "minimum" : "maximum",
            message: `Inducción de Fase Variónica activa - ${useMinDamage ? 'Fase Mínima' : 'Fase Máxima'}`
        };
    }
    
    /**
     * Recibe daño con reducción del 50% (habilidad pasiva)
     */
    takeDamage(damage) {
        // Aplicar reducción de daño por habilidad pasiva (50%)
        const passiveReduction = 0.5;
        const armorReduction = this.stats.armor / 100;
        
        // Aplicar ambas reducciones
        let finalDamage = damage * (1 - passiveReduction); // Reducción pasiva del 50%
        finalDamage = Math.max(1, Math.floor(finalDamage * (1 - armorReduction))); // Reducción por armadura
        
        this.stats.health.current = Math.max(0, this.stats.health.current - finalDamage);
        
        if (this.stats.health.current <= 0) {
            this.stats.alive = false;
        }
        
        return finalDamage;
    }
    
    /**
     * Cura al personaje (limitada por habilidad pasiva)
     */
    heal(amount) {
        // Zack no puede regenerarse de forma tradicional
        // En su lugar, gana energía
        const energyGain = 50;
        this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + energyGain);
        
        return {
            healing: 0,
            energyGained: energyGain,
            message: "Zack no puede regenerarse, pero gana 50 puntos de energía"
        };
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
     * Habilidad especial: Omniscio
     * Crea materia manipulando átomos para generar efectos aleatorios
     */
    omniscio(target) {
        // Nota: La energía ya fue consumida por BattleSystem, no consumir aquí
        
        // Efectos posibles de Omniscio
        const possibleEffects = [
                {
                    name: "Reducción de Defensa",
                    type: "debuff",
                    target: "enemy",
                    effect: "defense_reduction",
                    value: 30,
                    duration: 3,
                    message: "La materia creada debilita las defensas del enemigo"
                },
                {
                    name: "Regeneración de Energía",
                    type: "buff",
                    target: "self",
                    effect: "energy_regeneration",
                    value: 35,
                    duration: 1,
                    message: "La materia energética restaura la energía de Zack"
                },
                {
                    name: "Aumento de Defensa",
                    type: "buff",
                    target: "self",
                    effect: "defense_boost",
                    value: 40,
                    duration: 3,
                    message: "La materia protectora aumenta las defensas de Zack"
                },
                {
                    name: "Quemadura Atómica",
                    type: "debuff",
                    target: "enemy",
                    effect: "burn",
                    value: 25,
                    duration: 3,
                    message: "La materia inestable quema al enemigo a nivel atómico"
                },
                {
                    name: "Interferencia Cuántica",
                    type: "debuff",
                    target: "enemy",
                    effect: "confusion",
                    value: 20,
                    duration: 2,
                    message: "La materia cuántica confunde los sentidos del enemigo"
                },
                {
                    name: "Reparación Molecular",
                    type: "heal",
                    target: "self",
                    effect: "healing",
                    value: 150,
                    duration: 1,
                    message: "La materia reparadora restaura la estructura molecular de Zack"
                },
                {
                    name: "Desintegración Parcial",
                    type: "damage",
                    target: "enemy",
                    effect: "pure_damage",
                    value: this.calculateAttackDamage().damage * 1.2,
                    duration: 1,
                    message: "La materia desintegradora causa daño directo al enemigo"
                }
            ];
            
            // Seleccionar efecto aleatorio
            const selectedEffect = possibleEffects[Math.floor(Math.random() * possibleEffects.length)];
            
            // Aplicar el efecto
            let result = {
                success: true,
                message: `Zack activa Omniscio: ${selectedEffect.message}`,
                effectName: selectedEffect.name,
                effectType: selectedEffect.type,
                target: selectedEffect.target
            };
            
            // Procesar el efecto según su tipo
            switch (selectedEffect.type) {
                case "buff":
                case "debuff":
                    if (selectedEffect.target === "self") {
                        this.stats.statusEffects = this.stats.statusEffects || [];
                        this.stats.statusEffects.push({
                            type: selectedEffect.effect,
                            duration: selectedEffect.duration,
                            value: selectedEffect.value,
                            source: "omniscio"
                        });
                    }
                    result.statusEffect = {
                        type: selectedEffect.effect,
                        value: selectedEffect.value,
                        duration: selectedEffect.duration
                    };
                    break;
                    
                case "heal":
                    const healAmount = selectedEffect.value;
                    this.stats.health.current = Math.min(
                        this.stats.health.max, 
                        this.stats.health.current + healAmount
                    );
                    result.healing = healAmount;
                    break;
                    
                case "damage":
                    result.damage = selectedEffect.value;
                    break;
            }
            
            if (selectedEffect.effect === "energy_regeneration") {
                this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + selectedEffect.value);
                result.energyGained = selectedEffect.value;
            }
            
            return result;
    }
    
    /**
     * Habilidad pasiva: Estructura Atómica Alterada
     * - No puede regenerarse normalmente (gana energía en su lugar)
     * - Reducción de daño del 50%
     */
    atomicStructure() {
        return {
            damageReduction: 50,
            energyOnHeal: 50,
            regenerationBlocked: true,
            description: "Estructura atómica alterada: +50% reducción de daño, no puede regenerarse pero gana energía"
        };
    }
    
    /**
     * Sobrescribe el método de defensa para aplicar la pasiva
     */
    defend() {
        // En lugar de regenerar salud, Zack gana energía extra
        const energyGain = 50; // Ganancia base + bonificación pasiva
        this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + energyGain);
        
        // Aplicar efecto de defensa
        this.stats.statusEffects = this.stats.statusEffects || [];
        this.stats.statusEffects = this.stats.statusEffects.filter(effect => effect.type !== 'defend');
        
        this.stats.statusEffects.push({
            type: 'defend',
            duration: 1,
            effect: 'damage_reduction',
            value: 25 // Adicional a su 50% pasivo
        });
        
        return {
            success: true,
            message: "Zack se defiende y manipula átomos para ganar energía",
            energyGained: energyGain,
            defenseBoost: 25
        };
    }
    
    /**
     * Obtiene información del elemento para resistencias
     */
    getElementInfo() {
        return {
            element: this.stats.element,
            resistance: this.stats.elementalResistance,
            specialProperties: ["phase_induction", "atomic_manipulation", "quantum_effects"]
        };
    }
    
    /**
     * Información específica de las habilidades de Zack
     */
    getAbilities() {
        return {
            passive: {
                name: "Estructura Atómica Alterada",
                description: "No puede regenerarse (gana 50 energía), 50% reducción de daño",
                effects: ["no_regeneration", "energy_on_heal", "damage_reduction_50"]
            },
            basic: {
                name: "Inducción de Fase Variónica",
                description: "50/50 entre daño mínimo o máximo",
                effects: ["variable_damage", "phase_manipulation"]
            },
            special: {
                name: "Omniscio",
                description: "Crea materia con efectos aleatorios",
                cost: 40,
                effects: ["random_effect", "atomic_creation", "quantum_manipulation"]
            }
        };
    }
}

export default ZackHisoka;
