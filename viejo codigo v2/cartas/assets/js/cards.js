// Definición de todas las cartas del juego
// Tipos: 'character' o 'spell'
// Costes: 1-2 (bajo), 3-4 (moderado), 5-6 (alto), 7+ (extremo)

export const CARDS = {
    // ==================== CARTAS DE PERSONAJES ====================
    'topaz': {
        id: 'topaz',
        name: 'Topaz',
        type: 'character',
        cost: 2,
        attack: 3,
        hp: 4,
        maxHp: 4,
        image: 'assets/images/cards/topaz.jpg',
        description: 'Una bella mujer capaz de hacer subir las estadísticas de sus aliados.',
        ability: {
            type: 'buff_allies',
            trigger: 'on_play',
            effect: 'Aumenta +2 ATK a todos los aliados en campo',
            buffAmount: 2
        }
    },
    
    'miyabi': {
        id: 'miyabi',
        name: 'Miyabi',
        type: 'character',
        cost: 2,
        attack: 6,
        hp: 5,
        maxHp: 5,
        image: 'assets/images/cards/miyabi.jpg',
        description: 'Chica zorro capaz de blandir su espada para causar cortes con mucho daño.',
        ability: null // Sin habilidad especial - puro daño
    },
    
    'onji': {
        id: 'onji',
        name: 'Onji',
        type: 'character',
        cost: 3,
        attack: 4,
        hp: 5,
        maxHp: 5,
        image: 'assets/images/cards/onji.jpg',
        description: 'Un guerrero con facciones mínimas capaz de pelear pero también mejorar enormemente el daño de 1 aliado.',
        ability: {
            type: 'single_buff',
            trigger: 'on_play',
            effect: 'Aumenta +4 ATK a 1 aliado de tu elección',
            buffAmount: 4,
            targetCount: 1
        }
    },
    
    'zack': {
        id: 'zack',
        name: 'Zack',
        type: 'character',
        cost: 4,
        attack: 8,
        hp: 12,
        maxHp: 12,
        image: 'assets/images/cards/zack.jpg',
        description: 'Un científico con inimaginable cantidad de puntos de vida pero tarda 3 turnos en atacar.',
        ability: {
            type: 'slow_attack',
            trigger: 'passive',
            effect: 'No puede atacar hasta después de 3 turnos en campo',
            turnsRequired: 3
        },
        turnsInField: 0
    },
    
    'superboy_prime': {
        id: 'superboy_prime',
        name: 'Superboy Prime',
        type: 'character',
        cost: 8,
        attack: 15,
        hp: 18,
        maxHp: 18,
        image: 'assets/images/cards/superboy_prime.jpg',
        description: 'El arma más poderosa de todas. 1 solo golpe suyo causa el mayor daño del juego y es muy difícil de bajar.',
        ability: null // Puras stats titánicas
    },
    
    'galileo': {
        id: 'galileo',
        name: 'Galileo',
        type: 'character',
        cost: 5,
        attack: 5,
        hp: 6,
        maxHp: 6,
        image: 'assets/images/cards/galileo.jpg',
        description: 'Androide cuya mayor peculiaridad es anular todos los poderes rivales cuando es jugado durante 1 turno entero.',
        ability: {
            type: 'silence_enemies',
            trigger: 'on_play',
            effect: 'Anula todas las habilidades enemigas durante 1 turno',
            duration: 1
        }
    },
    
    'anos': {
        id: 'anos',
        name: 'Anos Voldigoad',
        type: 'character',
        cost: 6,
        attack: 10,
        hp: 10,
        maxHp: 10,
        image: 'assets/images/cards/anos.jpg',
        description: 'Un rey demonio capaz de volver a revivir tras ser derrotado y al hacerlo aumenta su daño y vida aún más.',
        ability: {
            type: 'revive',
            trigger: 'on_death',
            effect: 'Revive con +5 ATK y +5 HP (solo 1 vez)',
            attackBonus: 5,
            hpBonus: 5,
            hasRevived: false
        }
    },
    
    'godspeed': {
        id: 'godspeed',
        name: 'Godspeed',
        type: 'character',
        cost: 4,
        attack: 6,
        hp: 6,
        maxHp: 6,
        image: 'assets/images/cards/godspeed.jpg',
        description: 'Un velocista que atacará todas las cartas del rival al mismo tiempo cuando sea su turno.',
        ability: {
            type: 'aoe_attack',
            trigger: 'on_attack',
            effect: 'Ataca a TODAS las cartas enemigas en campo simultáneamente'
        }
    },
    
    'kumagawa': {
        id: 'kumagawa',
        name: 'Kumagawa',
        type: 'character',
        cost: 5,
        attack: 5,
        hp: 4,
        maxHp: 4,
        image: 'assets/images/cards/kumagawa.jpg',
        description: 'Un chico normal cuya peculiaridad es que puede borrar 1 carta del rival al entrar en batalla.',
        ability: {
            type: 'erase_enemy',
            trigger: 'on_play',
            effect: 'Destruye 1 carta enemiga de tu elección al entrar',
            targetCount: 1
        }
    },
    
    'firefly': {
        id: 'firefly',
        name: 'Firefly',
        type: 'character',
        cost: 6,
        attack: 8,
        hp: 8,
        maxHp: 8,
        image: 'assets/images/cards/firefly.jpg',
        description: 'Una cazadora en armadura capaz de destrozarlo todo. Tiene doble vida (armadura y luego sin armadura).',
        ability: {
            type: 'double_form',
            trigger: 'passive',
            effect: 'Al recibir daño letal, cambia de forma con HP completos (solo 1 vez)',
            secondFormHp: 8,
            hasTransformed: false
        }
    },
    
    'nathan': {
        id: 'nathan',
        name: 'Nathan',
        type: 'character',
        cost: 2,
        attack: 2,
        hp: 3,
        maxHp: 3,
        image: 'assets/images/cards/nathan.jpg',
        description: 'Un chico capaz de usar su Kami para redirigir los ataques y provocar que fallen.',
        ability: {
            type: 'redirect_attack',
            trigger: 'on_attacked',
            effect: '30% de probabilidad de hacer que el ataque falle',
            dodgeChance: 0.3
        }
    },
    
    'x': {
        id: 'x',
        name: 'X',
        type: 'character',
        cost: 6,
        attack: 6,
        hp: 9,
        maxHp: 9,
        image: 'assets/images/cards/x.jpg',
        description: 'Un héroe misterioso con un chasquido puede alterar la realidad y provocar efectos negativos al rival e incluso instakill a cartas.',
        ability: {
            type: 'reality_snap',
            trigger: 'on_attack',
            effect: '20% de instakill, 30% de -3 ATK enemigo, resto daño normal',
            instakillChance: 0.2,
            debuffChance: 0.3,
            debuffAmount: -3
        }
    },
    
    'the_herta': {
        id: 'the_herta',
        name: 'The Herta',
        type: 'character',
        cost: 4,
        attack: 5,
        hp: 6,
        maxHp: 6,
        image: 'assets/images/cards/the_herta.jpg',
        description: 'Una maga legendaria capaz de crear marionetas llamadas Herta con un poco menos que sus estadísticas cada turno.',
        ability: {
            type: 'summon_puppet',
            trigger: 'on_turn_start',
            effect: 'Crea 1 marioneta Herta (3 ATK, 4 HP) cada turno (máximo 3)',
            maxPuppets: 3,
            puppetStats: { attack: 3, hp: 4 }
        }
    },
    
    'regulus': {
        id: 'regulus',
        name: 'Regulus de Leo',
        type: 'character',
        cost: 8,
        attack: 8,
        hp: 12,
        maxHp: 12,
        image: 'assets/images/cards/regulus.jpg',
        description: 'Un caballero capaz de lanzar una "Exclamación de Athena" luego de 4 turnos en batalla que mata a todas las cartas del rival.',
        ability: {
            type: 'delayed_wipe',
            trigger: 'passive',
            effect: 'Después de 4 turnos en campo, destruye TODAS las cartas enemigas',
            turnsRequired: 4
        },
        turnsInField: 0
    },
    
    // ==================== CARTAS DE EFECTOS/TRAMPAS ====================
    'uma_force': {
        id: 'uma_force',
        name: 'Uma Force',
        type: 'spell',
        cost: 1,
        image: 'assets/images/cards/uma_force.jpg',
        description: 'Otorga varios puntos de energía al usuario.',
        effect: {
            type: 'gain_energy',
            amount: 3,
            text: 'Ganas +3 de energía inmediatamente'
        }
    },
    
    'leon_alado': {
        id: 'leon_alado',
        name: 'León Alado',
        type: 'spell',
        cost: 5,
        image: 'assets/images/cards/leon_alado.jpg',
        description: 'Otorga puntos de vida extra a los HP del usuario.',
        effect: {
            type: 'heal_player',
            amount: 8,
            text: 'Restauras +8 HP (máximo 30)'
        }
    },
    
    'idea_del_mal': {
        id: 'idea_del_mal',
        name: 'Idea del Mal',
        type: 'spell',
        cost: 6,
        image: 'assets/images/cards/idea_del_mal.jpg',
        description: 'Destruye todas las cartas del campo, aliadas y enemigas.',
        effect: {
            type: 'board_wipe',
            text: 'Destruye TODAS las cartas en juego (tuyas y enemigas)'
        }
    },
    
    'juicio_celestial': {
        id: 'juicio_celestial',
        name: 'Juicio Celestial',
        type: 'spell',
        cost: 3,
        image: 'assets/images/cards/juicio_celestial.jpg',
        description: 'Destruye la carta con más daño del rival.',
        effect: {
            type: 'destroy_strongest',
            text: 'Destruye la carta enemiga con mayor ATK'
        }
    },
    
    'espadas_luz': {
        id: 'espadas_luz',
        name: 'Espadas de la Luz Reveladora',
        type: 'spell',
        cost: 2,
        image: 'assets/images/cards/espadas_luz.png',
        description: 'Hace que 1 carta rival no pueda usarse por 2 turnos.',
        effect: {
            type: 'freeze_card',
            duration: 2,
            text: 'Congela 1 carta enemiga durante 2 turnos (no puede atacar ni usar habilidades)'
        }
    },
    
    'beyond': {
        id: 'beyond',
        name: 'Beyond',
        type: 'spell',
        cost: 2,
        image: 'assets/images/cards/beyond.jpg',
        description: 'Revive 1 carta luego de ser destruida o la salva de ser destruida.',
        effect: {
            type: 'revive_or_save',
            text: 'Revive 1 carta destruida este turno O previene la destrucción de 1 carta'
        }
    }
};

// Función para obtener todas las cartas como array
export function getAllCards() {
    return Object.values(CARDS);
}

// Función para obtener carta por ID
export function getCardById(id) {
    return CARDS[id] ? { ...CARDS[id] } : null; // Retorna copia
}

// Función para crear una copia profunda de una carta (para instanciar en juego)
export function createCardInstance(cardId, instanceId) {
    const baseCard = getCardById(cardId);
    if (!baseCard) return null;
    
    return {
        ...JSON.parse(JSON.stringify(baseCard)), // Deep copy
        instanceId: instanceId, // ID único de esta instancia
        currentHp: baseCard.hp,
        currentAttack: baseCard.attack,
        buffs: [],
        debuffs: [],
        isFrozen: false,
        frozenTurns: 0,
        turnsInField: 0,
        canAttack: baseCard.type === 'character' && (!baseCard.ability || baseCard.ability.type !== 'slow_attack')
    };
}

// Función para filtrar cartas por tipo
export function getCardsByType(type) {
    return getAllCards().filter(card => card.type === type);
}
