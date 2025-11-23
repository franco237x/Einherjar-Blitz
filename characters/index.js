/**
 * Índice de todos los personajes de Einherjar Blitz
 * Exporta todas las clases de personajes para fácil importación
 */

import { ShunaShieda } from './ShunaShieda.js';
import { OzenKimura } from './OzenKimura.js';
import { XairChikyu } from './XairChikyu.js';
import { NathanDoffens } from './NathanDoffens.js';
import { ZackHisoka } from './ZackHisoka.js';
import { Raiden } from './Raiden.js';

// Mapa de personajes por ID
export const CHARACTERS_BY_ID = {
    1: ShunaShieda,
    2: OzenKimura,
    3: XairChikyu,
    4: NathanDoffens,
    5: ZackHisoka,
    6: Raiden
};

// Mapa de personajes por nombre
export const CHARACTERS_BY_NAME = {
    'Shuna Shieda': ShunaShieda,
    'Ozen Kimura': OzenKimura,
    'Xair Chikyu': XairChikyu,
    'Nathan Doffens': NathanDoffens,
    'Zack Hisoka': ZackHisoka,
    'Raiden': Raiden
};

// Información de elementos (solo colores)
export const ELEMENT_SYSTEM = {
    'Devastación': {
        color: '#ff6b35'
    },
    'Chakra': {
        color: '#9b59b6'
    },
    'Hielo': {
        color: '#3498db'
    },
    'Rayo': {
        color: '#f1c40f'
    },
    'Oscuridad': {
        color: '#2c3e50'
    },
    'Ninguno': {
        color: '#95a5a6'
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
 * Obtiene información de efectividad elemental (simplificado - sin ventajas/desventajas)
 */
export function getElementalEffectiveness(attackerElement, defenderElement) {
    return 1.0; // Todos los elementos son igualmente efectivos
}

/**
 * Calcula el daño final considerando solo resistencias básicas
 */
export function calculateElementalDamage(baseDamage, attackerElement, defender) {
    // Solo aplicar resistencia elemental básica si existe
    const resistanceReduction = defender.stats.elementalResistance ? defender.stats.elementalResistance / 100 : 0;

    const finalDamage = Math.floor(baseDamage * (1 - resistanceReduction));

    return {
        damage: Math.max(1, finalDamage),
        effectiveness: 1.0,
        resistanceReduction
    };
}

// Exportaciones individuales
export {
    ShunaShieda,
    OzenKimura,
    XairChikyu,
    NathanDoffens,
    ZackHisoka,
    Raiden
};
