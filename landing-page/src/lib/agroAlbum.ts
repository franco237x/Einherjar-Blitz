export type AlbumFamilyId = 'alba' | 'escarcha' | 'brasas';

export interface AlbumFamily {
  id: AlbumFamilyId;
  name: string;
  epithet: string;
  description: string;
  trait: string;
  invocationLabel: string;
  accent: string;
}

export interface AlbumPlant {
  id: string;
  family: AlbumFamilyId;
  tier: 0 | 1 | 2 | 3 | 4;
  name: string;
  rarity: string;
  lore: string;
  artBrief: string;
  image: string;
}

export const ALBUM_FAMILIES: AlbumFamily[] = [
  {
    id: 'alba',
    name: 'Ciclo del Alba',
    epithet: 'Luz que vuelve',
    description: 'De la bruma al amanecer, estas plantas siguen el pulso regular del huerto.',
    trait: 'Cosecha constante',
    invocationLabel: 'del Ciclo del Alba',
    accent: '#C6A665',
  },
  {
    id: 'escarcha',
    name: 'Valle de Escarcha',
    epithet: 'Paciencia del invierno',
    description: 'Sus raíces guardan la cosecha durante más tiempo para quien regresa después.',
    trait: 'Mayor reserva',
    invocationLabel: 'del Valle de Escarcha',
    accent: '#9ECED4',
  },
  {
    id: 'brasas',
    name: 'Huerta de Brasas',
    epithet: 'Calor en las raíces',
    description: 'Responden al cuidado frecuente con un bono moderado al regar.',
    trait: 'Bono de riego',
    invocationLabel: 'de la Huerta de Brasas',
    accent: '#D9986E',
  },
];

export const ALBUM_PLANTS: AlbumPlant[] = [
  {
    id: 'brote-bruma', family: 'alba', tier: 0, name: 'Brote de Bruma', rarity: 'Común',
    lore: 'Cada madrugada deja una gota de niebla entre sus primeras hojas.',
    artBrief: 'Tallo tierno, rocío y niebla verde.', image: '/evento-agro/brote-bruma.png',
  },
  {
    id: 'espiga-ambar', family: 'alba', tier: 1, name: 'Espiga Ámbar', rarity: 'Rara',
    lore: 'Sus granos conservan la luz del sol incluso después de la cosecha.',
    artBrief: 'Cereal dorado con granos de luz.', image: '/evento-agro/espiga-ambar.png',
  },
  {
    id: 'lirio-astral', family: 'alba', tier: 2, name: 'Lirio Astral', rarity: 'Épica',
    lore: 'Solo abre sus pétalos cuando las estrellas se reflejan en el agua.',
    artBrief: 'Pétalos azules y polen estelar.', image: '/evento-agro/lirio-astral.png',
  },
  {
    id: 'orquidea-eclipse', family: 'alba', tier: 3, name: 'Orquídea del Eclipse', rarity: 'Legendaria',
    lore: 'Una flor nacida del breve encuentro entre la sombra y el oro.',
    artBrief: 'Pétalos oscuros y halo crepuscular.', image: '/evento-agro/orquidea-eclipse.png',
  },
  {
    id: 'arbol-alba', family: 'alba', tier: 4, name: 'Árbol del Alba', rarity: 'Mítica',
    lore: 'Dicen que cada amanecer comienza cuando sus raíces despiertan.',
    artBrief: 'Copa luminosa, raíces y sol naciente.', image: '/evento-agro/arbol-alba.png',
  },
  {
    id: 'musgo-rocio', family: 'escarcha', tier: 0, name: 'Musgo de Rocío', rarity: 'Común',
    lore: 'Bajo el hielo conserva pequeñas reservas de agua para la primavera.',
    artBrief: 'Cojín de musgo esmeralda con cristales pequeños y gotas frías.', image: '/evento-agro/musgo-rocio.png',
  },
  {
    id: 'centeno-boreal', family: 'escarcha', tier: 1, name: 'Centeno Boreal', rarity: 'Rara',
    lore: 'Sus espigas inclinan la cabeza antes de que llegue una nevada.',
    artBrief: 'Espigas plateadas cubiertas de escarcha, hojas verde azulado.', image: '/evento-agro/centeno-boreal.png',
  },
  {
    id: 'campanula-hielo', family: 'escarcha', tier: 2, name: 'Campánula de Hielo', rarity: 'Épica',
    lore: 'Cuando florece, su tintineo anuncia agua bajo la nieve.',
    artBrief: 'Campanas de vidrio azulado y estambres blancos, silueta delicada.', image: '/evento-agro/campanula-hielo.png',
  },
  {
    id: 'loto-niflheim', family: 'escarcha', tier: 3, name: 'Loto de Niflheim', rarity: 'Legendaria',
    lore: 'Flota sobre estanques quietos sin dejar que el frío toque su centro.',
    artBrief: 'Loto translúcido sobre agua helada, núcleo de luz azul.', image: '/evento-agro/loto-niflheim.png',
  },
  {
    id: 'sauce-aurora', family: 'escarcha', tier: 4, name: 'Sauce de Aurora', rarity: 'Mítica',
    lore: 'Sus ramas dibujan el cielo nocturno sobre la nieve intacta.',
    artBrief: 'Sauce con hojas de aurora, raíces de hielo y copa fluida.', image: '/evento-agro/sauce-aurora.png',
  },
  {
    id: 'semilla-ceniza', family: 'brasas', tier: 0, name: 'Semilla de Ceniza', rarity: 'Común',
    lore: 'Parece dormida hasta que una gota revela su corazón encendido.',
    artBrief: 'Brote negro con corazón naranja y tierra volcánica.', image: '/evento-agro/semilla-ceniza.png',
  },
  {
    id: 'pimiento-brasa', family: 'brasas', tier: 1, name: 'Pimiento de Brasa', rarity: 'Rara',
    lore: 'Sus vainas maduran con el calor que queda después de la lluvia.',
    artBrief: 'Vainas rojas encendidas y hojas cobrizas reconocibles.', image: '/evento-agro/pimiento-brasa.png',
  },
  {
    id: 'dalia-volcanica', family: 'brasas', tier: 2, name: 'Dalia Volcánica', rarity: 'Épica',
    lore: 'Cada pétalo se forma como una roca nueva alrededor de su fuego.',
    artBrief: 'Pétalos de obsidiana con vetas cálidas y centro ámbar.', image: '/evento-agro/dalia-volcanica.png',
  },
  {
    id: 'vid-fenix', family: 'brasas', tier: 3, name: 'Vid de Fénix', rarity: 'Legendaria',
    lore: 'Sus racimos vuelven a brotar de la ceniza de la cosecha anterior.',
    artBrief: 'Racimos luminosos, zarcillos y formas sutiles de plumas de fuego.', image: '/evento-agro/vid-fenix.png',
  },
  {
    id: 'roble-muspel', family: 'brasas', tier: 4, name: 'Roble de Muspel', rarity: 'Mítica',
    lore: 'A su sombra la tierra permanece tibia durante todo el invierno.',
    artBrief: 'Tronco de cobre, brasas entre hojas y raíces volcánicas.', image: '/evento-agro/roble-muspel.png',
  },
];

export const ALBUM_MILESTONES = [
  { count: 3, reward: 'Marco de bronce' },
  { count: 6, reward: '3 polen para invocar' },
  { count: 9, reward: 'Fondo botánico a elección' },
  { count: 12, reward: 'Semilla épica a elección' },
  { count: 15, reward: 'Portada y título exclusivos' },
] as const;
