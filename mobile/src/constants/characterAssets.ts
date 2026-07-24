import { type ImageSourcePropType } from 'react-native';
import { GAME_CHARACTERS, type CharacterSprites } from './battleData';

export type CharacterAnimationName =
  | 'idle'
  | 'attack'
  | 'defend'
  | 'special'
  | 'heal';

export interface CharacterAnimationClip {
  frames: readonly ImageSourcePropType[];
  frameDurationMs: number;
  loop: boolean;
}

export interface CharacterVisual {
  portrait?: ImageSourcePropType;
  facing: 'left' | 'right';
  animations: Partial<
    Record<CharacterAnimationName, CharacterAnimationClip>
  >;
}

function pingPongFrames<T>(frames: readonly T[]): readonly T[] {
  return [...frames, ...frames.slice(1, -1).reverse()];
}

const ARGOS_IDLE_KEYFRAMES = [
  require('../../assets/images/game/argos/frames/idle/argos_idle_1.png'),
  require('../../assets/images/game/argos/frames/idle/argos_idle_2.png'),
  require('../../assets/images/game/argos/frames/idle/argos_idle_3.png'),
  require('../../assets/images/game/argos/frames/idle/argos_idle_4.png'),
  require('../../assets/images/game/argos/frames/idle/argos_idle_5.png'),
  require('../../assets/images/game/argos/frames/idle/argos_idle_6.png'),
] as const;

const ARGOS_FRAMES = {
  idle: pingPongFrames(ARGOS_IDLE_KEYFRAMES),
} as const;

const GALILEO_FRAMES = {
  idle: [
    require('../../assets/images/game/galileo/frames/idle/idle-00.png'),
    require('../../assets/images/game/galileo/frames/idle/idle-01.png'),
    require('../../assets/images/game/galileo/frames/idle/idle-02.png'),
    require('../../assets/images/game/galileo/frames/idle/idle-03.png'),
    require('../../assets/images/game/galileo/frames/idle/idle-04.png'),
    require('../../assets/images/game/galileo/frames/idle/idle-05.png'),
    require('../../assets/images/game/galileo/frames/idle/idle-06.png'),
  ],
  attack: [
    require('../../assets/images/game/galileo/frames/attack/attack-00.png'),
    require('../../assets/images/game/galileo/frames/attack/attack-01.png'),
    require('../../assets/images/game/galileo/frames/attack/attack-02.png'),
    require('../../assets/images/game/galileo/frames/attack/attack-03.png'),
    require('../../assets/images/game/galileo/frames/attack/attack-04.png'),
    require('../../assets/images/game/galileo/frames/attack/attack-05.png'),
    require('../../assets/images/game/galileo/frames/attack/attack-06.png'),
  ],
  defend: [
    require('../../assets/images/game/galileo/frames/defend/defend-00.png'),
    require('../../assets/images/game/galileo/frames/defend/defend-01.png'),
    require('../../assets/images/game/galileo/frames/defend/defend-02.png'),
    require('../../assets/images/game/galileo/frames/defend/defend-03.png'),
    require('../../assets/images/game/galileo/frames/defend/defend-04.png'),
    require('../../assets/images/game/galileo/frames/defend/defend-05.png'),
    require('../../assets/images/game/galileo/frames/defend/defend-06.png'),
  ],
  special: [
    require('../../assets/images/game/galileo/frames/special/special-00.png'),
    require('../../assets/images/game/galileo/frames/special/special-01.png'),
    require('../../assets/images/game/galileo/frames/special/special-02.png'),
    require('../../assets/images/game/galileo/frames/special/special-03.png'),
    require('../../assets/images/game/galileo/frames/special/special-04.png'),
    require('../../assets/images/game/galileo/frames/special/special-05.png'),
    require('../../assets/images/game/galileo/frames/special/special-06.png'),
  ],
  heal: [
    require('../../assets/images/game/galileo/frames/heal/heal-00.png'),
    require('../../assets/images/game/galileo/frames/heal/heal-01.png'),
    require('../../assets/images/game/galileo/frames/heal/heal-02.png'),
    require('../../assets/images/game/galileo/frames/heal/heal-03.png'),
    require('../../assets/images/game/galileo/frames/heal/heal-04.png'),
    require('../../assets/images/game/galileo/frames/heal/heal-05.png'),
    require('../../assets/images/game/galileo/frames/heal/heal-06.png'),
  ],
} as const;

const REY_ESCARLATA_FRAMES = {
  idle: [
    require('../../assets/images/game/rey_escarlata/frames/idle/idle-00.png'),
    require('../../assets/images/game/rey_escarlata/frames/idle/idle-01.png'),
    require('../../assets/images/game/rey_escarlata/frames/idle/idle-02.png'),
    require('../../assets/images/game/rey_escarlata/frames/idle/idle-03.png'),
    require('../../assets/images/game/rey_escarlata/frames/idle/idle-04.png'),
    require('../../assets/images/game/rey_escarlata/frames/idle/idle-05.png'),
    require('../../assets/images/game/rey_escarlata/frames/idle/idle-06.png'),
  ],
  attack: [
    require('../../assets/images/game/rey_escarlata/frames/attack/attack-00.png'),
    require('../../assets/images/game/rey_escarlata/frames/attack/attack-01.png'),
    require('../../assets/images/game/rey_escarlata/frames/attack/attack-02.png'),
    require('../../assets/images/game/rey_escarlata/frames/attack/attack-03.png'),
    require('../../assets/images/game/rey_escarlata/frames/attack/attack-04.png'),
    require('../../assets/images/game/rey_escarlata/frames/attack/attack-05.png'),
    require('../../assets/images/game/rey_escarlata/frames/attack/attack-06.png'),
  ],
  defend: [
    require('../../assets/images/game/rey_escarlata/frames/defend/defend-00.png'),
    require('../../assets/images/game/rey_escarlata/frames/defend/defend-01.png'),
    require('../../assets/images/game/rey_escarlata/frames/defend/defend-02.png'),
    require('../../assets/images/game/rey_escarlata/frames/defend/defend-03.png'),
    require('../../assets/images/game/rey_escarlata/frames/defend/defend-04.png'),
    require('../../assets/images/game/rey_escarlata/frames/defend/defend-05.png'),
    require('../../assets/images/game/rey_escarlata/frames/defend/defend-06.png'),
  ],
  special: [
    require('../../assets/images/game/rey_escarlata/frames/special/special-00.png'),
    require('../../assets/images/game/rey_escarlata/frames/special/special-01.png'),
    require('../../assets/images/game/rey_escarlata/frames/special/special-02.png'),
    require('../../assets/images/game/rey_escarlata/frames/special/special-03.png'),
    require('../../assets/images/game/rey_escarlata/frames/special/special-04.png'),
    require('../../assets/images/game/rey_escarlata/frames/special/special-05.png'),
    require('../../assets/images/game/rey_escarlata/frames/special/special-06.png'),
  ],
  heal: [
    require('../../assets/images/game/rey_escarlata/frames/heal/heal-00.png'),
    require('../../assets/images/game/rey_escarlata/frames/heal/heal-01.png'),
    require('../../assets/images/game/rey_escarlata/frames/heal/heal-02.png'),
    require('../../assets/images/game/rey_escarlata/frames/heal/heal-03.png'),
    require('../../assets/images/game/rey_escarlata/frames/heal/heal-04.png'),
    require('../../assets/images/game/rey_escarlata/frames/heal/heal-05.png'),
    require('../../assets/images/game/rey_escarlata/frames/heal/heal-06.png'),
  ],
} as const;

const CHARACTER_VISUALS: Record<string, CharacterVisual> = {
  argos: {
    portrait: ARGOS_IDLE_KEYFRAMES[0],
    facing: 'right',
    animations: {
      idle: { frames: ARGOS_FRAMES.idle, frameDurationMs: 180, loop: true },
    },
  },
  galileo: {
    portrait: GALILEO_FRAMES.idle[0],
    facing: 'right',
    animations: {
      idle: {
        frames: GALILEO_FRAMES.idle,
        frameDurationMs: 180,
        loop: true,
      },
      attack: {
        frames: GALILEO_FRAMES.attack,
        frameDurationMs: 115,
        loop: false,
      },
      defend: {
        frames: GALILEO_FRAMES.defend,
        frameDurationMs: 130,
        loop: false,
      },
      special: {
        frames: GALILEO_FRAMES.special,
        frameDurationMs: 145,
        loop: false,
      },
      heal: {
        frames: GALILEO_FRAMES.heal,
        frameDurationMs: 135,
        loop: false,
      },
    },
  },
  rey_escarlata: {
    portrait: REY_ESCARLATA_FRAMES.idle[0],
    facing: 'left',
    animations: {
      idle: {
        frames: REY_ESCARLATA_FRAMES.idle,
        frameDurationMs: 190,
        loop: true,
      },
      attack: {
        frames: REY_ESCARLATA_FRAMES.attack,
        frameDurationMs: 120,
        loop: false,
      },
      defend: {
        frames: REY_ESCARLATA_FRAMES.defend,
        frameDurationMs: 135,
        loop: false,
      },
      special: {
        frames: REY_ESCARLATA_FRAMES.special,
        frameDurationMs: 150,
        loop: false,
      },
      heal: {
        frames: REY_ESCARLATA_FRAMES.heal,
        frameDurationMs: 140,
        loop: false,
      },
    },
  },
};

// Keep legacy portrait access working in selection screens. Battle animation
// resolution reads the visual registry directly.
const SPRITE_SOURCES: Record<string, CharacterSprites> = {
  argos: {
    portrait: ARGOS_IDLE_KEYFRAMES[0],
    battleSprite: ARGOS_IDLE_KEYFRAMES[0],
  },
};

for (const [charId, sprites] of Object.entries(SPRITE_SOURCES)) {
  if (GAME_CHARACTERS[charId]) {
    GAME_CHARACTERS[charId].sprites = sprites;
  }
}

export function getCharacterSprites(
  charId: string
): CharacterSprites | undefined {
  return GAME_CHARACTERS[charId]?.sprites as CharacterSprites | undefined;
}

export function getCharacterVisual(
  charId: string
): CharacterVisual | undefined {
  return CHARACTER_VISUALS[charId];
}

export function getCharacterAnimation(
  charId: string,
  animation: CharacterAnimationName
): CharacterAnimationClip | undefined {
  const visual = CHARACTER_VISUALS[charId];
  return visual?.animations[animation] ?? visual?.animations.idle;
}
