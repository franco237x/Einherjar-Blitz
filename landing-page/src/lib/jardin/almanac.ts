// Almanac entries for the Jardín de Yggdrasil. Numbers come from the engine
// so the almanac never disagrees with the game.
import { BALANCE, PLANTS, TICKS_PER_SECOND, ZOMBIES, type PlantKind, type ZombieKind } from './engine';

export interface AlmanacStat {
  label: string;
  value: string;
}

export interface AlmanacEntry {
  title: string;
  tagline: string;
  description: string;
  stats: AlmanacStat[];
}

const seconds = (ticks: number) => `${(ticks / TICKS_PER_SECOND).toLocaleString('es-AR', { maximumFractionDigits: 1 })} s`;
const plantBase = (kind: PlantKind): AlmanacStat[] => [
  { label: 'Coste', value: `${PLANTS[kind].cost} de sol` },
  { label: 'Recarga', value: seconds(PLANTS[kind].cooldown) },
  { label: 'Resistencia', value: kind === 'granadin' ? '—' : `${PLANTS[kind].hp}` },
];

export const PLANT_ALMANAC: Record<PlantKind, AlmanacEntry> = {
  solmiel: {
    title: 'Solmiel',
    tagline: 'Productora de sol',
    description:
      'Un farol de physalis que guarda la luz del amanecer. Cada tanto comprime su fruto dorado y suelta un sol. Planta varias al principio: sin sol no hay defensa.',
    stats: [...plantBase('solmiel'), { label: 'Producción', value: `${BALANCE.sunValue} de sol cada 24 s` }],
  },
  nabu: {
    title: 'Nabú',
    tagline: 'Tirador básico',
    description:
      'Un nabo testarudo que escupe semillas a todo lo que avance por su carril. Barato, constante y la base de cualquier jardín.',
    stats: [...plantBase('nabu'), { label: 'Daño', value: `${BALANCE.shotDamage} cada 1,5 s` }],
  },
  mordiseta: {
    title: 'Mordiseta',
    tagline: 'Esporas de corto alcance',
    description:
      'Un hongo dormilón que infla el sombrero y lanza esporas. Cuesta casi nada, pero solo alcanza a los zombis que ya están cerca.',
    stats: [
      ...plantBase('mordiseta'),
      { label: 'Daño', value: `${BALANCE.shotDamage} cada 1,5 s` },
      { label: 'Alcance', value: `${BALANCE.mordisetaRange} casillas` },
    ],
  },
  cortezon: {
    title: 'Cortezón',
    tagline: 'Muro',
    description:
      'Un tronco de corcho que no ataca: se planta delante y aguanta mordiscos mientras los demás disparan. Se agrieta a medida que lo muerden.',
    stats: plantBase('cortezon'),
  },
  frigora: {
    title: 'Frígora',
    tagline: 'Control de hielo',
    description:
      'Un helecho de escarcha. Sus copos no hacen daño, pero frenan a la mitad durante 3 s; tres impactos seguidos congelan al zombi por completo.',
    stats: [
      ...plantBase('frigora'),
      { label: 'Efecto', value: 'Ralentiza 50 % · congela al 3.er impacto' },
    ],
  },
  granadin: {
    title: 'Granadín',
    tagline: 'Explosiva',
    description:
      'Una granada nerviosa que estalla nada más plantarla y arrasa con todo lo que haya en un cuadrado de 3×3. Se usa una vez y tarda en recargar.',
    stats: [...plantBase('granadin'), { label: 'Daño', value: `${BALANCE.explosionDamage} en 3×3` }],
  },
  zarzina: {
    title: 'Zarzina',
    tagline: 'Devoradora',
    description:
      'Una flor carnívora que se traga de un bocado al zombi que tenga delante, con casco y todo. Después necesita 15 s para digerir y queda indefensa.',
    stats: [...plantBase('zarzina'), { label: 'Efecto', value: 'Elimina al zombi de enfrente · 15 s de digestión' }],
  },
  cardon: {
    title: 'Cardón',
    tagline: 'Tirador perforante',
    description:
      'Un cactus serio y alto. Sus espinas atraviesan el carril entero y hieren a todos los zombis que encuentran en el camino.',
    stats: [...plantBase('cardon'), { label: 'Daño', value: `${BALANCE.shotDamage} a cada zombi del carril` }],
  },
};

export const ZOMBIE_ALMANAC: Record<ZombieKind, AlmanacEntry> = {
  despistado: {
    title: 'Despistado',
    tagline: 'Zombi común',
    description: 'Delgado, distraído y con hambre. Arrastra los pies hasta la primera planta que encuentre y empieza a morder.',
    stats: [
      { label: 'Vida', value: `${ZOMBIES.despistado.hp}` },
      { label: 'Velocidad', value: 'Normal' },
    ],
  },
  conero: {
    title: 'Conero',
    tagline: 'Zombi con cono',
    description: 'Bajo y compacto, con un cono torcido que absorbe los primeros golpes. Cuando lo pierde, es un despistado más.',
    stats: [
      { label: 'Vida', value: `${ZOMBIES.conero.hp}` },
      { label: 'Protección', value: `${ZOMBIES.conero.armor}` },
      { label: 'Velocidad', value: 'Algo rápido' },
    ],
  },
  balderon: {
    title: 'Balderón',
    tagline: 'Zombi con balde',
    description: 'Ancho, lento y con un balde de metal en la cabeza. Hace falta mucho daño, una explosión o una Zarzina para frenarlo.',
    stats: [
      { label: 'Vida', value: `${ZOMBIES.balderon.hp}` },
      { label: 'Protección', value: `${ZOMBIES.balderon.armor}` },
      { label: 'Velocidad', value: 'Lento' },
    ],
  },
};
