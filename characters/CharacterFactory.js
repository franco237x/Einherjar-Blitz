// Factory para crear personajes dinámicamente
import { ShunaShieda } from './ShunaShieda.js';
import { OzenKimura } from './OzenKimura.js';
import { XairChikyu } from './XairChikyu.js';

export class CharacterFactory {
    static characterMap = {
        1: ShunaShieda,
        2: OzenKimura,
        3: XairChikyu,
        'Shuna Shieda': ShunaShieda,
        'Ozen Kimura': OzenKimura,
        'Xair Chikyu': XairChikyu
    };
    
    static async createCharacter(characterData) {
        const CharacterClass = this.characterMap[characterData.id] || this.characterMap[characterData.name];
        
        if (!CharacterClass) {
            throw new Error(`Personaje no encontrado: ${characterData.name || characterData.id}`);
        }
        
        return new CharacterClass(characterData);
    }
    
    static getAvailableCharacters() {
        return Object.keys(this.characterMap).filter(key => !isNaN(key));
    }
    
    static getCharacterInfo(characterId) {
        const CharacterClass = this.characterMap[characterId];
        if (!CharacterClass) return null;
        
        // Crear una instancia temporal para obtener la información
        const tempData = {
            id: characterId,
            name: "Temp",
            title: "Temp",
            description: "Temp",
            image: "default.jpg",
            rarity: "common",
            attack_min: 100,
            attack_max: 150,
            max_health: 1000,
            armor: 50,
            defense_reduction: 30,
            elemental_resistance: 100
        };
        
        const tempChar = new CharacterClass(tempData);
        return {
            attacks: tempChar.attacks,
            passives: tempChar.passives,
            specialMechanics: tempChar.getSpecialMechanics ? tempChar.getSpecialMechanics() : []
        };
    }
}

// Sistema de carga dinámica de personajes
export class CharacterLoader {
    static loadedCharacters = new Map();
    
    static async loadCharacter(characterData) {
        const key = `${characterData.id}_${characterData.name}`;
        
        if (this.loadedCharacters.has(key)) {
            return this.loadedCharacters.get(key);
        }
        
        try {
            const character = await CharacterFactory.createCharacter(characterData);
            this.loadedCharacters.set(key, character);
            
            console.log(`✅ Personaje cargado: ${character.name} (${character.clan})`);
            console.log(`🎯 Ataques disponibles:`, Object.keys(character.attacks));
            console.log(`⚡ Pasivas:`, character.passives.map(p => p.name));
            
            return character;
        } catch (error) {
            console.error(`❌ Error cargando personaje:`, error);
            throw error;
        }
    }
    
    static clearCache() {
        this.loadedCharacters.clear();
    }
    
    static getCachedCharacter(characterData) {
        const key = `${characterData.id}_${characterData.name}`;
        return this.loadedCharacters.get(key);
    }
}
