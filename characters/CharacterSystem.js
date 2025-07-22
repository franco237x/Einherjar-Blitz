/**
 * Character System - Punto de entrada principal del sistema modular
 * @author Sistema Modular
 * @version 2.0.0
 */

// Importar todos los componentes del sistema
import { Character } from './Character.js';
import { CharacterRegistry, characterRegistry } from './CharacterRegistry.js';
import { CharacterFactory, characterFactory } from './CharacterFactory.js';
import { CharacterLoader, characterLoader } from './CharacterLoader.js';

/**
 * Clase principal que maneja todo el sistema de personajes
 */
export class CharacterSystem {
    constructor() {
        this.registry = characterRegistry;
        this.factory = characterFactory;
        this.loader = characterLoader;
        this.isInitialized = false;
        
        console.log('🎯 CharacterSystem inicializado');
    }
    
    /**
     * Inicializa el sistema completo
     * @param {Object} options - Opciones de inicialización
     * @returns {Promise<Object>} - Resultado de la inicialización
     */
    async initialize(options = {}) {
        if (this.isInitialized) {
            console.log('⚠️ CharacterSystem ya está inicializado');
            return { success: true, message: 'Ya inicializado' };
        }
        
        try {
            console.log('🚀 Inicializando CharacterSystem...');
            
            // Opciones por defecto
            const defaultOptions = {
                loadAllCharacters: true,
                validateConfigurations: true,
                enableCache: false
            };
            
            const finalOptions = { ...defaultOptions, ...options };
            
            // Validar configuraciones si está habilitado
            if (finalOptions.validateConfigurations) {
                const validation = this.loader.validateConfigurations();
                if (!validation.isValid) {
                    console.error('❌ Configuraciones inválidas:', validation.errors);
                    return { 
                        success: false, 
                        errors: validation.errors,
                        warnings: validation.warnings 
                    };
                }
                console.log('✅ Configuraciones validadas');
            }
            
            // Cargar personajes
            let loadResult;
            if (finalOptions.loadAllCharacters) {
                loadResult = await this.loader.loadAllCharacters();
            } else if (finalOptions.charactersToLoad) {
                loadResult = await this.loader.loadMultipleCharacters(finalOptions.charactersToLoad);
            }
            
            // Verificar resultado de carga
            if (loadResult && loadResult.totalFailed > 0) {
                console.warn(`⚠️ Algunos personajes no se pudieron cargar:`, loadResult.failed);
            }
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            const stats = this.getSystemStats();
            console.log('✅ CharacterSystem inicializado exitosamente:', stats);
            
            return {
                success: true,
                loadResult,
                stats,
                message: 'Sistema inicializado correctamente'
            };
            
        } catch (error) {
            console.error('❌ Error inicializando CharacterSystem:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Crea un personaje usando el factory
     * @param {string} characterId - ID del personaje
     * @param {Object} options - Opciones adicionales
     * @returns {Character|null}
     */
    createCharacter(characterId, options = {}) {
        if (!this.isInitialized) {
            console.error('❌ CharacterSystem no está inicializado. Llama a initialize() primero.');
            return null;
        }
        
        return this.factory.createCharacter(characterId, options.data, options.useCache);
    }
    
    /**
     * Crea un personaje de jugador
     * @param {string} characterId - ID del personaje
     * @param {Object} playerConfig - Configuración del jugador
     * @returns {Character|null}
     */
    createPlayer(characterId, playerConfig = {}) {
        if (!this.isInitialized) {
            console.error('❌ CharacterSystem no está inicializado');
            return null;
        }
        
        return this.factory.createPlayerCharacter(characterId, playerConfig);
    }
    
    /**
     * Crea un personaje enemigo
     * @param {string} characterId - ID del personaje
     * @param {Object} enemyConfig - Configuración del enemigo
     * @returns {Character|null}
     */
    createEnemy(characterId, enemyConfig = {}) {
        if (!this.isInitialized) {
            console.error('❌ CharacterSystem no está inicializado');
            return null;
        }
        
        return this.factory.createEnemyCharacter(characterId, enemyConfig);
    }
    
    /**
     * Obtiene lista de personajes disponibles
     * @returns {Array}
     */
    getAvailableCharacters() {
        return this.loader.getAvailableCharacters();
    }
    
    /**
     * Obtiene personajes por clan
     * @param {string} clan - Nombre del clan
     * @returns {Array}
     */
    getCharactersByClan(clan) {
        return this.registry.getCharactersByClan(clan);
    }
    
    /**
     * Obtiene personajes por elemento
     * @param {string} element - Elemento
     * @returns {Array}
     */
    getCharactersByElement(element) {
        return this.registry.getCharactersByElement(element);
    }
    
    /**
     * Obtiene personajes por rareza
     * @param {string} rarity - Rareza
     * @returns {Array}
     */
    getCharactersByRarity(rarity) {
        return this.registry.getCharactersByRarity(rarity);
    }
    
    /**
     * Carga un personaje específico dinámicamente
     * @param {string} characterId - ID del personaje
     * @returns {Promise<boolean>}
     */
    async loadCharacter(characterId) {
        return await this.loader.loadCharacter(characterId);
    }
    
    /**
     * Verifica si un personaje está disponible
     * @param {string} characterId - ID del personaje
     * @returns {boolean}
     */
    isCharacterAvailable(characterId) {
        return this.registry.isRegistered(characterId);
    }
    
    /**
     * Obtiene estadísticas del sistema completo
     * @returns {Object}
     */
    getSystemStats() {
        return {
            isInitialized: this.isInitialized,
            registry: this.registry.getStats(),
            loader: this.loader.getStats(),
            factory: this.factory.getStats(),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Valida la integridad de todo el sistema
     * @returns {Object}
     */
    validateSystem() {
        const registryValidation = this.registry.validate();
        const configValidation = this.loader.validateConfigurations();
        
        return {
            registry: registryValidation,
            configurations: configValidation,
            isSystemValid: registryValidation.isValid && configValidation.isValid,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Exporta la configuración completa del sistema
     * @returns {Object}
     */
    exportSystemConfig() {
        return {
            registry: this.registry.exportConfig(),
            availableCharacters: this.loader.getAvailableCharacters(),
            loadedCharacters: this.loader.getLoadedCharacters(),
            stats: this.getSystemStats(),
            exportedAt: new Date().toISOString()
        };
    }
    
    /**
     * Reinicia el sistema completo
     * @returns {Promise<Object>}
     */
    async reset() {
        console.log('🔄 Reiniciando CharacterSystem...');
        
        // Limpiar todos los sistemas
        this.registry.clear();
        this.factory.clearCache();
        
        // Marcar como no inicializado
        this.isInitialized = false;
        
        console.log('✅ CharacterSystem reiniciado');
        
        return {
            success: true,
            message: 'Sistema reiniciado correctamente'
        };
    }
}

// Crear instancia global del sistema
export const characterSystem = new CharacterSystem();

// Exportar también los componentes individuales para uso avanzado
export {
    Character,
    CharacterRegistry,
    CharacterFactory,
    CharacterLoader,
    characterRegistry,
    characterFactory,
    characterLoader
};

// Función de conveniencia para inicialización rápida
export async function initializeCharacterSystem(options = {}) {
    return await characterSystem.initialize(options);
}

// Hacer disponible globalmente en el navegador
if (typeof window !== 'undefined') {
    window.CharacterSystem = CharacterSystem;
    window.characterSystem = characterSystem;
    window.initializeCharacterSystem = initializeCharacterSystem;
}
