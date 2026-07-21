import { ImageSourcePropType } from 'react-native';
import { GAME_CHARACTERS, type CharacterSprites } from './battleData';

// ─── Character sprite assets ──────────────────────────────────────────────
// Loaded via require() so Metro bundles them. Each character can provide:
//  - portrait: static image for the character select screen
//  - battleSprite: static base/idle sprite for the battle stage
//  - attackGif: animated GIF played while spriteState === 'attack'
//  - defenseGif: animated GIF played while spriteState === 'defend'
//
// This module is the ONLY place that imports asset files via require().
// battleData.ts stays pure data (no react-native, no assets) so the battle
// engine remains testable in a node environment (vitest).
const SPRITE_SOURCES: Record<string, CharacterSprites> = {
  argos: {
    portrait: require('../../assets/images/game/argos/argos_selector.png'),
    battleSprite: require('../../assets/images/game/argos/argos_base.png'),
    attackGif: require('../../assets/images/game/argos/argos_attack.gif'),
    defenseGif: require('../../assets/images/game/argos/argos_defense.gif'),
  },
};

// Inject the sprite sources into the character definitions at module load.
for (const [charId, sprites] of Object.entries(SPRITE_SOURCES)) {
  if (GAME_CHARACTERS[charId]) {
    GAME_CHARACTERS[charId].sprites = sprites;
  }
}

// Re-export the typed sprite accessor so UI components get proper typing.
export function getCharacterSprites(charId: string): CharacterSprites | undefined {
  return GAME_CHARACTERS[charId]?.sprites as CharacterSprites | undefined;
}

export type { ImageSourcePropType };
