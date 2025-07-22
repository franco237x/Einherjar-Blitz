/**
 * Character Factory - Sistema de creación dinámica de personajes
 * @author Sistema Modular
 * @version 2.0.0
 */

import { characterRegistry } from './CharacterRegistry.js';

export class CharacterFactory {
    constructor() {
        this.instanceCache = new Map();
        console.log('🏭 CharacterFactory inicializado');
    }
    
    /**
     * Crea una instancia de personaje
     * @param {string|number} characterId - ID del personaje
     * @param {Object} additionalData - Datos adicionales para el personaje
     * @param {boolean} useCache - Si usar caché de instancias (default: false)
     * @returns {Character|null} - Instancia del personaje o null
     */
    createCharacter(characterId, additionalData = {}, useCache = false) {
        try {
            // Verificar caché si está habilitado
            if (useCache && this.instanceCache.has(characterId)) {
                console.log(`📦 Personaje ${characterId} obtenido del caché`);
                return this.instanceCache.get(characterId);
            }
            
            // Obtener clase y datos del registry
            const CharacterClass = characterRegistry.getCharacterClass(characterId);
            const baseData = characterRegistry.getCharacterData(characterId);
            
            if (!CharacterClass) {
                throw new Error(`Personaje con ID ${characterId} no está registrado`);
            }
            
            if (!baseData) {
                throw new Error(`Datos para personaje ${characterId} no encontrados`);
            }
            
            // Combinar datos base con datos adicionales
            const combinedData = {
                ...baseData,
                ...additionalData,
                id: characterId // Asegurar que el ID se mantenga
            };
            
            // Crear instancia
            const instance = new CharacterClass(combinedData);
            
            // Validar que la instancia se creó correctamente
            this.validateInstance(instance, characterId);
            
            // Guardar en caché si está habilitado
            if (useCache) {
                this.instanceCache.set(characterId, instance);
            }
            
            console.log(`✅ Personaje ${instance.name} creado exitosamente`);
            return instance;
            
        } catch (error) {
            console.error(`❌ Error creando personaje ${characterId}:`, error);
            return null;
        }
    }
    
    /**
     * Crea múltiples personajes
     * @param {Array} characterConfigs - Array de configuraciones de personajes
     * @returns {Array} - Array de instancias creadas
     */
    createMultipleCharacters(characterConfigs) {
        const instances = [];
        
        for (const config of characterConfigs) {
            const { id, data = {}, useCache = false } = config;
            const instance = this.createCharacter(id, data, useCache);
            
            if (instance) {
                instances.push(instance);
            } else {
                console.warn(`⚠️ No se pudo crear personaje con ID: ${id}`);
            }
        }
        
        console.log(`📦 Creados ${instances.length}/${characterConfigs.length} personajes`);
        return instances;
    }
    
    /**
     * Crea personaje para jugador con configuración específica
     * @param {string|number} characterId - ID del personaje
     * @param {Object} playerConfig - Configuración del jugador
     * @returns {Character|null}
     */
    createPlayerCharacter(characterId, playerConfig = {}) {
        const defaultPlayerConfig = {
            isPlayer: true,
            currentHealth: null, // Se usará maxHealth
            energy: 100
        };
        
        const combinedConfig = {
            ...defaultPlayerConfig,
            ...playerConfig
        };
        
        const character = this.createCharacter(characterId, combinedConfig);
        
        if (character) {
            // Configuraciones específicas para jugador
            if (combinedConfig.currentHealth === null) {
                character.health = character.maxHealth;
            }
            
            console.log(`👤 Personaje de jugador creado: ${character.name}`);
        }
        
        return character;
    }
    
    /**
     * Crea personaje para enemigo/AI con configuración específica
     * @param {string|number} characterId - ID del personaje
     * @param {Object} enemyConfig - Configuración del enemigo
     * @returns {Character|null}
     */
    createEnemyCharacter(characterId, enemyConfig = {}) {
        const defaultEnemyConfig = {
            isPlayer: false,
            aiType: 'balanced', // 'aggressive', 'defensive', 'balanced'
            difficultyMultiplier: 1.0
        };
        
        const combinedConfig = {
            ...defaultEnemyConfig,
            ...enemyConfig
        };
        
        // Aplicar multiplicador de dificultad
        if (combinedConfig.difficultyMultiplier !== 1.0) {
            const baseData = characterRegistry.getCharacterData(characterId);
            if (baseData) {
                combinedConfig.max_health = Math.floor((baseData.max_health || 1000) * combinedConfig.difficultyMultiplier);
                combinedConfig.attack_min = Math.floor((baseData.attack_min || 100) * combinedConfig.difficultyMultiplier);
                combinedConfig.attack_max = Math.floor((baseData.attack_max || 150) * combinedConfig.difficultyMultiplier);
            }
        }
        
        const character = this.createCharacter(characterId, combinedConfig);
        
        if (character) {
            console.log(`🤖 Personaje enemigo creado: ${character.name} (dificultad: ${combinedConfig.difficultyMultiplier}x)`);
        }
        
        return character;
    }
    
    /**
     * Valida que una instancia se creó correctamente
     * @param {Character} instance - Instancia a validar
     * @param {string|number} characterId - ID original del personaje
     */
    validateInstance(instance, characterId) {
        // Verificar que es una instancia válida
        if (!instance) {
            throw new Error('La instancia es null o undefined');
        }
        
        // Verificar propiedades básicas
        const requiredProperties = ['id', 'name', 'health', 'maxHealth', 'attacks'];
        for (const prop of requiredProperties) {
            if (instance[prop] === undefined || instance[prop] === null) {
                throw new Error(`Propiedad requerida '${prop}' faltante en la instancia`);
            }
        }
        
        // Verificar que los ataques están inicializados
        if (!instance.attacks.basic || !instance.attacks.elemental || !instance.attacks.ultimate) {
            throw new Error('Los ataques no están correctamente inicializados');
        }
        
        // Verificar métodos críticos
        const requiredMethods = ['takeDamage', 'heal', 'calculateDamage'];
        for (const method of requiredMethods) {
            if (typeof instance[method] !== 'function') {
                throw new Error(`Método requerido '${method}' no encontrado en la instancia`);
            }
        }
    }
    
    /**
     * Crea personaje a partir de datos guardados (deserialización)
     * @param {Object} savedData - Datos guardados del personaje
     * @returns {Character|null}
     */
    createFromSavedData(savedData) {
        if (!savedData.id) {
            console.error('❌ Datos guardados no contienen ID del personaje');
            return null;
        }
        
        // Crear instancia base
        const character = this.createCharacter(savedData.id);
        
        if (!character) {
            return null;
        }
        
        // Restaurar estado guardado
        character.health = savedData.health || character.maxHealth;
        character.energy = savedData.energy || character.maxEnergy;
        character.activeEffects = savedData.activeEffects || [];
        character.cooldowns = savedData.cooldowns || {};
        character.isAlive = savedData.isAlive !== undefined ? savedData.isAlive : true;
        
        console.log(`💾 Personaje restaurado desde datos guardados: ${character.name}`);
        return character;
    }
    
    /**
     * Obtiene información sobre personajes disponibles
     * @returns {Array} - Lista de personajes disponibles para crear
     */
    getAvailableCharacters() {
        return characterRegistry.getAllCharacters().map(char => ({
            id: char.id,
            name: char.name,
            title: char.title,
            clan: char.clan,
            element: char.element,
            rarity: char.rarity,
            description: char.description
        }));
    }
    
    /**
     * Limpia el caché de instancias
     */
    clearCache() {
        this.instanceCache.clear();
        console.log('🧹 Caché de CharacterFactory limpiado');
    }
    
    /**
     * Obtiene estadísticas del factory
     * @returns {Object}
     */
    getStats() {
        return {
            cachedInstances: this.instanceCache.size,
            availableCharacters: characterRegistry.getAllCharacters().length,
            registryStats: characterRegistry.getStats()
        };
    }
}

// Crear instancia global
export const characterFactory = new CharacterFactory();
