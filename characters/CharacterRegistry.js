/**
 * Character Registry - Sistema de registro dinámico de personajes
 * @author Sistema Modular 
 * @version 2.0.0
 */

export class CharacterRegistry {
    constructor() {
        this.characters = new Map();
        this.characterData = new Map();
        console.log('📋 CharacterRegistry inicializado');
    }
    
    /**
     * Registra una clase de personaje
     * @param {Function} CharacterClass - Clase del personaje
     * @param {Object} characterData - Datos base del personaje
     */
    register(CharacterClass, characterData) {
        try {
            // Validar que es una clase válida
            if (typeof CharacterClass !== 'function') {
                throw new Error('CharacterClass debe ser una función constructor');
            }
            
            // Validar datos requeridos
            if (!characterData.id || !characterData.name) {
                throw new Error('characterData debe tener al menos id y name');
            }
            
            // Obtener información de la clase
            const classInfo = CharacterClass.getCharacterInfo ? CharacterClass.getCharacterInfo() : {};
            
            // Registrar la clase
            this.characters.set(characterData.id, CharacterClass);
            
            // Registrar los datos
            this.characterData.set(characterData.id, {
                ...characterData,
                classInfo,
                registeredAt: new Date().toISOString()
            });
            
            console.log(`✅ Personaje registrado: ${characterData.name} (ID: ${characterData.id})`);
            
        } catch (error) {
            console.error(`❌ Error registrando personaje ${characterData.name}:`, error);
            throw error;
        }
    }
    
    /**
     * Obtiene una clase de personaje por ID
     * @param {string|number} id - ID del personaje
     * @returns {Function|null} - Clase del personaje o null
     */
    getCharacterClass(id) {
        return this.characters.get(id) || null;
    }
    
    /**
     * Obtiene los datos base de un personaje por ID
     * @param {string|number} id - ID del personaje
     * @returns {Object|null} - Datos del personaje o null
     */
    getCharacterData(id) {
        return this.characterData.get(id) || null;
    }
    
    /**
     * Verifica si un personaje está registrado
     * @param {string|number} id - ID del personaje
     * @returns {boolean}
     */
    isRegistered(id) {
        return this.characters.has(id);
    }
    
    /**
     * Obtiene lista de todos los personajes registrados
     * @returns {Array} - Array con información de todos los personajes
     */
    getAllCharacters() {
        const result = [];
        for (const [id, data] of this.characterData.entries()) {
            result.push({
                id,
                ...data
            });
        }
        return result;
    }
    
    /**
     * Obtiene personajes por criterios específicos
     * @param {Object} criteria - Criterios de filtrado
     * @returns {Array} - Array de personajes que cumplen los criterios
     */
    getCharactersByCriteria(criteria = {}) {
        const allCharacters = this.getAllCharacters();
        
        return allCharacters.filter(character => {
            for (const [key, value] of Object.entries(criteria)) {
                if (character[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }
    
    /**
     * Obtiene personajes por clan
     * @param {string} clan - Nombre del clan
     * @returns {Array}
     */
    getCharactersByClan(clan) {
        return this.getCharactersByCriteria({ clan });
    }
    
    /**
     * Obtiene personajes por elemento
     * @param {string} element - Elemento del personaje
     * @returns {Array}
     */
    getCharactersByElement(element) {
        return this.getCharactersByCriteria({ element });
    }
    
    /**
     * Obtiene personajes por rareza
     * @param {string} rarity - Rareza del personaje
     * @returns {Array}
     */
    getCharactersByRarity(rarity) {
        return this.getCharactersByCriteria({ rarity });
    }
    
    /**
     * Desregistra un personaje
     * @param {string|number} id - ID del personaje
     * @returns {boolean} - true si se desregistró correctamente
     */
    unregister(id) {
        const characterData = this.getCharacterData(id);
        if (characterData) {
            this.characters.delete(id);
            this.characterData.delete(id);
            console.log(`🗑️ Personaje desregistrado: ${characterData.name} (ID: ${id})`);
            return true;
        }
        return false;
    }
    
    /**
     * Limpia todos los registros
     */
    clear() {
        this.characters.clear();
        this.characterData.clear();
        console.log('🧹 Registry limpiado');
    }
    
    /**
     * Obtiene estadísticas del registry
     * @returns {Object}
     */
    getStats() {
        const allChars = this.getAllCharacters();
        const clans = [...new Set(allChars.map(c => c.clan))];
        const elements = [...new Set(allChars.map(c => c.element))];
        const rarities = [...new Set(allChars.map(c => c.rarity))];
        
        return {
            totalCharacters: allChars.length,
            uniqueClans: clans.length,
            uniqueElements: elements.length,
            uniqueRarities: rarities.length,
            clans,
            elements,
            rarities
        };
    }
    
    /**
     * Valida la integridad del registry
     * @returns {Object} - Resultado de la validación
     */
    validate() {
        const errors = [];
        const warnings = [];
        
        for (const [id, characterClass] of this.characters.entries()) {
            const data = this.characterData.get(id);
            
            // Verificar que existen los datos
            if (!data) {
                errors.push(`Personaje ${id} tiene clase pero no datos`);
                continue;
            }
            
            // Verificar que la clase tiene los métodos requeridos
            const requiredMethods = ['initializeAttacks', 'initializePassives'];
            for (const method of requiredMethods) {
                if (typeof characterClass.prototype[method] !== 'function') {
                    warnings.push(`Personaje ${data.name} no tiene método ${method}`);
                }
            }
            
            // Verificar datos requeridos
            const requiredFields = ['name', 'clan', 'element'];
            for (const field of requiredFields) {
                if (!data[field]) {
                    errors.push(`Personaje ${id} falta campo requerido: ${field}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            charactersValidated: this.characters.size
        };
    }
    
    /**
     * Exporta configuración del registry
     * @returns {Object}
     */
    exportConfig() {
        return {
            characters: this.getAllCharacters(),
            stats: this.getStats(),
            exportedAt: new Date().toISOString()
        };
    }
}

// Crear instancia global
export const characterRegistry = new CharacterRegistry();
