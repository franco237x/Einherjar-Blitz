/**
 * Character Loader - Sistema de carga dinámica de personajes
 * @author Sistema Modular
 * @version 2.0.0
 */

import { characterRegistry } from './CharacterRegistry.js';

export class CharacterLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadPromises = new Map();
        this.baseCharacterPath = './characters/';
        console.log('📡 CharacterLoader inicializado');
    }
    
    /**
     * Configuración de personajes disponibles
     * Este objeto contiene la metadata de todos los personajes disponibles
     */
    static CHARACTER_CONFIGS = {
        'ozen-kimura': {
            id: 'ozen-kimura',
            fileName: 'OzenKimura.js',
            className: 'OzenKimura',
            data: {
                id: 'ozen-kimura',
                name: 'Ozen Kimura',
                title: 'La Muralla Inamovible de los Kimura',
                description: 'Con una actitud fría como el acero, Ozen es una guerrera formidable del clan Kimura.',
                image: 'ozen.jpg',
                rarity: 'epic',
                attack_min: 200,
                attack_max: 280,
                max_health: 1200,
                armor: 150,
                defense_reduction: 120,
                elemental_resistance: 90,
                clan: 'Kimura',
                element: 'Hielo'
            }
        },
        'shuna-shieda': {
            id: 'shuna-shieda',
            fileName: 'ShunaShieda.js',
            className: 'ShunaShieda',
            data: {
                id: 'shuna-shieda',
                name: 'Shuna Shieda',
                title: 'La Furia de los Shiedas',
                description: 'La cúspide de poder de los Shiedas, feroz y letal. Maestra del elemento Devastación.',
                image: 'shuna.jpg',
                rarity: 'legendary',
                attack_min: 120,
                attack_max: 180,
                max_health: 950,
                armor: 85,
                defense_reduction: 75,
                elemental_resistance: 180,
                clan: 'Shieda',
                element: 'Devastación'
            }
        },
        'xair-chikyu': {
            id: 'xair-chikyu',
            fileName: 'XairChikyu.js',
            className: 'XairChikyu',
            data: {
                id: 'xair-chikyu',
                name: 'Xair Chikyu',
                title: 'El viento gélido de los Chikyu',
                description: 'Inventor del Bijon, energía que le otorga un poder devastador. Maestro del clan Chikyu.',
                image: 'xair.png',
                rarity: 'rare',
                attack_min: 160,
                attack_max: 240,
                max_health: 800,
                armor: 60,
                defense_reduction: 45,
                elemental_resistance: 250,
                clan: 'Chikyu',
                element: 'Viento'
            }
        },
        'nathan-doffens': {
            id: 'nathan-doffens',
            fileName: 'NathanDoffens.js',
            className: 'NathanDoffens',
            data: {
                id: 'nathan-doffens',
                name: 'Nathan Doffens',
                title: 'El Estratega Supremo',
                description: 'Maestro táctico que manipula el campo de batalla con estrategias mortales.',
                image: 'nathan.jpg',
                rarity: 'legendary',
                attack_min: 180,
                attack_max: 260,
                max_health: 1100,
                armor: 120,
                defense_reduction: 100,
                elemental_resistance: 150,
                clan: 'Doffens',
                element: 'Estrategia'
            }
        }
    };
    
    /**
     * Carga un personaje específico
     * @param {string} characterId - ID del personaje a cargar
     * @returns {Promise<boolean>} - true si se cargó exitosamente
     */
    async loadCharacter(characterId) {
        try {
            // Verificar si ya está cargado
            if (characterRegistry.isRegistered(characterId)) {
                console.log(`✅ Personaje ${characterId} ya está cargado`);
                return true;
            }
            
            // Verificar si ya se está cargando
            if (this.loadPromises.has(characterId)) {
                console.log(`⏳ Esperando carga en progreso de ${characterId}`);
                return await this.loadPromises.get(characterId);
            }
            
            // Obtener configuración del personaje
            const config = CharacterLoader.CHARACTER_CONFIGS[characterId];
            if (!config) {
                throw new Error(`Configuración para personaje ${characterId} no encontrada`);
            }
            
            // Crear promesa de carga
            const loadPromise = this._loadCharacterModule(config);
            this.loadPromises.set(characterId, loadPromise);
            
            const success = await loadPromise;
            
            // Limpiar promesa
            this.loadPromises.delete(characterId);
            
            return success;
            
        } catch (error) {
            console.error(`❌ Error cargando personaje ${characterId}:`, error);
            this.loadPromises.delete(characterId);
            return false;
        }
    }
    
    /**
     * Carga múltiples personajes
     * @param {Array<string>} characterIds - Array de IDs de personajes
     * @returns {Promise<Object>} - Resultado de la carga
     */
    async loadMultipleCharacters(characterIds) {
        console.log(`📦 Cargando ${characterIds.length} personajes...`);
        
        const loadPromises = characterIds.map(id => 
            this.loadCharacter(id).then(success => ({ id, success }))
        );
        
        const results = await Promise.all(loadPromises);
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log(`✅ Cargados: ${successful.length}, ❌ Fallidos: ${failed.length}`);
        
        return {
            successful: successful.map(r => r.id),
            failed: failed.map(r => r.id),
            totalLoaded: successful.length,
            totalFailed: failed.length
        };
    }
    
    /**
     * Carga todos los personajes disponibles
     * @returns {Promise<Object>} - Resultado de la carga
     */
    async loadAllCharacters() {
        const allIds = Object.keys(CharacterLoader.CHARACTER_CONFIGS);
        console.log(`🌟 Cargando todos los personajes (${allIds.length})`);
        
        return await this.loadMultipleCharacters(allIds);
    }
    
    /**
     * Carga personajes por criterios específicos
     * @param {Object} criteria - Criterios de filtrado
     * @returns {Promise<Object>} - Resultado de la carga
     */
    async loadCharactersByCriteria(criteria) {
        const configs = Object.values(CharacterLoader.CHARACTER_CONFIGS);
        const matchingIds = configs
            .filter(config => {
                for (const [key, value] of Object.entries(criteria)) {
                    if (config.data[key] !== value) {
                        return false;
                    }
                }
                return true;
            })
            .map(config => config.id);
        
        console.log(`🔍 Cargando personajes con criterios:`, criteria);
        console.log(`📋 Encontrados: ${matchingIds.length} personajes`);
        
        return await this.loadMultipleCharacters(matchingIds);
    }
    
    /**
     * Método interno para cargar el módulo de un personaje
     * @param {Object} config - Configuración del personaje
     * @returns {Promise<boolean>}
     */
    async _loadCharacterModule(config) {
        try {
            console.log(`⏳ Cargando módulo: ${config.fileName}`);
            
            // Importar dinámicamente el módulo
            const modulePath = `${this.baseCharacterPath}${config.fileName}`;
            const module = await import(modulePath);
            
            // Obtener la clase del módulo
            const CharacterClass = module[config.className];
            if (!CharacterClass) {
                throw new Error(`Clase ${config.className} no encontrada en ${config.fileName}`);
            }
            
            // Validar que es una clase válida
            if (typeof CharacterClass !== 'function') {
                throw new Error(`${config.className} no es una función constructor válida`);
            }
            
            // Registrar en el registry
            characterRegistry.register(CharacterClass, config.data);
            
            // Guardar referencia del módulo cargado
            this.loadedModules.set(config.id, {
                module,
                CharacterClass,
                config,
                loadedAt: new Date().toISOString()
            });
            
            console.log(`✅ Módulo cargado exitosamente: ${config.data.name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error cargando módulo ${config.fileName}:`, error);
            return false;
        }
    }
    
    /**
     * Obtiene lista de personajes disponibles para cargar
     * @returns {Array} - Lista de personajes disponibles
     */
    getAvailableCharacters() {
        return Object.values(CharacterLoader.CHARACTER_CONFIGS).map(config => ({
            id: config.id,
            name: config.data.name,
            title: config.data.title,
            clan: config.data.clan,
            element: config.data.element,
            rarity: config.data.rarity,
            fileName: config.fileName,
            isLoaded: characterRegistry.isRegistered(config.id)
        }));
    }
    
    /**
     * Obtiene información de personajes cargados
     * @returns {Array}
     */
    getLoadedCharacters() {
        return Array.from(this.loadedModules.entries()).map(([id, info]) => ({
            id,
            name: info.config.data.name,
            loadedAt: info.loadedAt,
            module: info.module,
            class: info.CharacterClass
        }));
    }
    
    /**
     * Verifica si un personaje está cargado
     * @param {string} characterId - ID del personaje
     * @returns {boolean}
     */
    isCharacterLoaded(characterId) {
        return this.loadedModules.has(characterId) && characterRegistry.isRegistered(characterId);
    }
    
    /**
     * Descarga un personaje del sistema
     * @param {string} characterId - ID del personaje
     * @returns {boolean} - true si se descargó exitosamente
     */
    unloadCharacter(characterId) {
        try {
            // Desregistrar del registry
            const unregistered = characterRegistry.unregister(characterId);
            
            // Remover del cache de módulos
            const removed = this.loadedModules.delete(characterId);
            
            if (unregistered || removed) {
                console.log(`🗑️ Personaje ${characterId} descargado`);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error(`❌ Error descargando personaje ${characterId}:`, error);
            return false;
        }
    }
    
    /**
     * Recarga un personaje
     * @param {string} characterId - ID del personaje
     * @returns {Promise<boolean>}
     */
    async reloadCharacter(characterId) {
        console.log(`🔄 Recargando personaje: ${characterId}`);
        
        // Descargar primero
        this.unloadCharacter(characterId);
        
        // Cargar nuevamente
        return await this.loadCharacter(characterId);
    }
    
    /**
     * Obtiene estadísticas del loader
     * @returns {Object}
     */
    getStats() {
        const available = Object.keys(CharacterLoader.CHARACTER_CONFIGS).length;
        const loaded = this.loadedModules.size;
        const registered = characterRegistry.getAllCharacters().length;
        
        return {
            available,
            loaded,
            registered,
            loadingProgress: loaded / available,
            loadPromisesActive: this.loadPromises.size
        };
    }
    
    /**
     * Valida la integridad de la configuración
     * @returns {Object} - Resultado de la validación
     */
    validateConfigurations() {
        const errors = [];
        const warnings = [];
        
        for (const [id, config] of Object.entries(CharacterLoader.CHARACTER_CONFIGS)) {
            // Validar estructura básica
            if (!config.fileName || !config.className || !config.data) {
                errors.push(`Configuración incompleta para ${id}`);
                continue;
            }
            
            // Validar datos del personaje
            const data = config.data;
            const requiredFields = ['id', 'name', 'clan', 'element'];
            
            for (const field of requiredFields) {
                if (!data[field]) {
                    errors.push(`Campo ${field} faltante en ${id}`);
                }
            }
            
            // Validar estadísticas numéricas
            const numericFields = ['attack_min', 'attack_max', 'max_health'];
            for (const field of numericFields) {
                if (typeof data[field] !== 'number' || data[field] <= 0) {
                    warnings.push(`Campo numérico ${field} inválido en ${id}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            configurationsValidated: Object.keys(CharacterLoader.CHARACTER_CONFIGS).length
        };
    }
}

// Crear instancia global
export const characterLoader = new CharacterLoader();
