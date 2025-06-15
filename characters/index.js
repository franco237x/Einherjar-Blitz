// Archivo índice para exportar todos los módulos de personajes
export { Character } from './Character.js';
export { ShunaShieda } from './ShunaShieda.js';
export { OzenKimura } from './OzenKimura.js';
export { XairChikyu } from './XairChikyu.js';
export { CharacterFactory, CharacterLoader } from './CharacterFactory.js';

// Configuración global de personajes
export const CHARACTER_CONFIG = {
    // IDs de personajes disponibles
    AVAILABLE_IDS: [1, 2, 3],
    
    // Mapeo de nombres a IDs
    NAME_TO_ID: {
        'Shuna Shieda': 1,
        'Ozen Kimura': 2,
        'Xair Chikyu': 3
    },
    
    // Configuración de balance global
    BALANCE: {
        CRITICAL_BASE_MULTIPLIER: 1.5,
        ARMOR_EFFECTIVENESS: 1.0,
        ENERGY_REGEN_PER_TURN: 10,
        STATUS_EFFECT_MAX_STACKS: 5
    },
    
    // Configuración de rareza
    RARITY_MULTIPLIERS: {
        'common': 1.0,
        'rare': 1.15,
        'epic': 1.25,
        'legendary': 1.4
    }
};

// Utilidades para el sistema de personajes
export class CharacterUtils {
    static applyRarityBonus(stats, rarity) {
        const multiplier = CHARACTER_CONFIG.RARITY_MULTIPLIERS[rarity] || 1.0;
        
        return {
            ...stats,
            attack_min: Math.floor(stats.attack_min * multiplier),
            attack_max: Math.floor(stats.attack_max * multiplier),
            max_health: Math.floor(stats.max_health * multiplier),
            armor: Math.floor(stats.armor * multiplier)
        };
    }
    
    static validateCharacterData(data) {
        const required = ['id', 'name', 'title', 'image', 'rarity', 'attack_min', 'attack_max', 'max_health', 'armor'];
        
        for (const field of required) {
            if (data[field] === undefined || data[field] === null) {
                throw new Error(`Campo requerido faltante: ${field}`);
            }
        }
        
        if (!CHARACTER_CONFIG.AVAILABLE_IDS.includes(data.id)) {
            throw new Error(`ID de personaje no válido: ${data.id}`);
        }
        
        return true;
    }
    
    static formatAttackDescription(attack, character) {
        return `
            **${attack.name}**
            ${attack.description}
            
            💰 Costo de Energía: ${attack.energyCost}
            ⚔️ Multiplicador de Daño: ${attack.multiplier}x
            🎯 Probabilidad Crítica: ${attack.critChance}%
            ⏱️ Cooldown: ${attack.cooldown / 1000}s
        `.trim();
    }
    
    static formatPassiveDescription(passive, character) {
        return `
            **${passive.name}** (${passive.type})
            ${passive.description}
        `.trim();
    }
}

// Utilidades de debug para el sistema modular
export class DebugUtils {
    static validateTarget(target, methodName) {
        if (!target) {
            console.warn(`⚠️ Target es null/undefined para ${methodName}`);
            return false;
        }
        
        const requiredMethods = ['takeDamage', 'addEffect', 'removeEffect', 'hasEffect', 'isAlive'];
        const missingMethods = requiredMethods.filter(method => typeof target[method] !== 'function');
        
        if (missingMethods.length > 0) {
            console.warn(`⚠️ Target carece de métodos: ${missingMethods.join(', ')}`);
            return false;
        }
        
        return true;
    }
    
    static safeMethodCall(target, methodName, ...args) {
        if (target && typeof target[methodName] === 'function') {
            return target[methodName](...args);
        } else {
            console.warn(`⚠️ Método ${methodName} no disponible en target`);
            return null;
        }
    }
    
    static logCharacterInfo(character) {
        console.log(`🧙‍♂️ Personaje: ${character.name}`);
        console.log(`⚔️ Ataques:`, Object.keys(character.attacks));
        console.log(`🔮 Pasivas:`, character.passives.map(p => p.name));
        console.log(`💪 Stats:`, {
            health: character.health,
            energy: character.energy,
            attack: `${character.attackMin}-${character.attackMax}`,
            armor: character.armor
        });
    }
}

// Test rápido para verificar compatibilidad después de los arreglos
export async function quickCompatibilityTest() {
    console.log('🔧 Ejecutando test rápido de compatibilidad...');
    
    try {
        // Importar lo necesario
        const { CharacterLoader } = await import('./CharacterFactory.js');
        
        // Datos de prueba
        const testData = {
            id: 1,
            name: 'Shuna Shieda',
            title: 'Test',
            description: 'Test',
            image: 'test.jpg',
            rarity: 'legendary',
            attack_min: 120,
            attack_max: 180,
            max_health: 950,
            armor: 85,
            defense_reduction: 75,
            elemental_resistance: 180
        };
        
        // Crear personaje
        const character = await CharacterLoader.loadCharacter(testData);
        
        // Crear enemigo mock (como en juego_new.js)
        const mockEnemy = {
            health: 1000,
            maxHealth: 1000,
            armor: 50,
            energy: 100,
            maxEnergy: 100,
            activeEffects: [],
            
            takeDamage(damage) {
                this.health = Math.max(0, this.health - damage);
                return this.health <= 0;
            },
            
            addEffect(effect) {
                this.activeEffects.push(effect);
            },
            
            removeEffect(effectName) {
                this.activeEffects = this.activeEffects.filter(e => e.name !== effectName);
            },
            
            hasEffect(effectName) {
                return this.activeEffects.some(e => e.name === effectName);
            },
            
            isAlive() {
                return this.health > 0;
            },
            
            applyDefensivePassives(damage) {
                return damage;
            }
        };
        
        // Test de ataque básico
        const basicResult = character.attacks.basic.execute(mockEnemy);
        console.log('✅ Ataque básico ejecutado:', basicResult.damage, 'daño');
        
        // Test de ataque elemental
        const elementalResult = character.attacks.elemental.execute(mockEnemy);
        console.log('✅ Ataque elemental ejecutado:', elementalResult.damage, 'daño');
        
        console.log('🎉 Test de compatibilidad completado exitosamente!');
        return true;
        
    } catch (error) {
        console.error('❌ Error en test de compatibilidad:', error);
        return false;
    }
}

// Hacer disponible globalmente para debug
if (typeof window !== 'undefined') {
    window.quickCompatibilityTest = quickCompatibilityTest;
}
