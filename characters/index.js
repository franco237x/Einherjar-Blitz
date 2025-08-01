/**
 * Índice de todos los personajes de Einherjar Blitz
 * Exporta todas las clases de personajes para fácil importación
 */

import { ShunaShieda } from './ShunaShieda.js';
import { OzenKimura } from './OzenKimura.js';
import { XairChikyu } from './XairChikyu.js';
import { NathanDoffens } from './NathanDoffens.js';

// Mapa de personajes por ID
export const CHARACTERS_BY_ID = {
    1: ShunaShieda,
    2: OzenKimura,
    3: XairChikyu,
    4: NathanDoffens
};

// Mapa de personajes por nombre
export const CHARACTERS_BY_NAME = {
    'Shuna Shieda': ShunaShieda,
    'Ozen Kimura': OzenKimura,
    'Xair Chikyu': XairChikyu,
    'Nathan Doffens': NathanDoffens
};

// Información de elementos y sus relaciones
export const ELEMENT_SYSTEM = {
    'Devastación': {
        weaknesses: ['Chakra'],
        strengths: ['Hielo'],
        color: '#ff6b35'
    },
    'Chakra': {
        weaknesses: ['Rayo'],
        strengths: ['Devastación'],
        color: '#9b59b6'
    },
    'Hielo': {
        weaknesses: ['Devastación'],
        strengths: ['Rayo'],
        color: '#3498db'
    },
    'Rayo': {
        weaknesses: ['Hielo'],
        strengths: ['Chakra'],
        color: '#f1c40f'
    }
};

// Información de rarezas y sus multiplicadores
export const RARITY_SYSTEM = {
    'legendary': {
        color: '#ff6b35',
        multiplier: 1.3,
        dropRate: 5
    },
    'epic': {
        color: '#9b59b6',
        multiplier: 1.2,
        dropRate: 15
    },
    'rare': {
        color: '#3498db',
        multiplier: 1.1,
        dropRate: 30
    },
    'common': {
        color: '#95a5a6',
        multiplier: 1.0,
        dropRate: 50
    }
};

/**
 * Factory function para crear una instancia de personaje por ID
 */
export function createCharacterById(id) {
    const CharacterClass = CHARACTERS_BY_ID[id];
    if (!CharacterClass) {
        throw new Error(`Personaje con ID ${id} no encontrado`);
    }
    return new CharacterClass();
}

/**
 * Factory function para crear una instancia de personaje por nombre
 */
export function createCharacterByName(name) {
    const CharacterClass = CHARACTERS_BY_NAME[name];
    if (!CharacterClass) {
        throw new Error(`Personaje con nombre "${name}" no encontrado`);
    }
    return new CharacterClass();
}

/**
 * Obtiene información de efectividad elemental
 */
export function getElementalEffectiveness(attackerElement, defenderElement) {
    const attacker = ELEMENT_SYSTEM[attackerElement];
    if (!attacker) return 1.0;
    
    if (attacker.strengths.includes(defenderElement)) {
        return 1.5; // Super efectivo
    }
    if (attacker.weaknesses.includes(defenderElement)) {
        return 0.7; // No muy efectivo
    }
    return 1.0; // Efectividad normal
}

/**
 * Calcula el daño final considerando elementos y resistencias
 */
export function calculateElementalDamage(baseDamage, attackerElement, defender) {
    const elementalMultiplier = getElementalEffectiveness(attackerElement, defender.stats.element);
    const resistanceReduction = defender.stats.elementalResistance / 100;
    
    const finalDamage = Math.floor(
        baseDamage * elementalMultiplier * (1 - resistanceReduction)
    );
    
    return {
        damage: Math.max(1, finalDamage),
        effectiveness: elementalMultiplier,
        resistanceReduction
    };
}

// Exportaciones individuales
export {
    ShunaShieda,
    OzenKimura,
    XairChikyu,
    NathanDoffens
};
