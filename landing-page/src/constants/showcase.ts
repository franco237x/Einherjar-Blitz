import { GAME_CHARACTERS, type CharacterDef } from './battleData';

/** Loading-screen artwork used as backdrop on the auth pages. */
export interface ShowcaseHero {
  character: CharacterDef;
  portrait: string;
  /** CSS object-position that keeps the face in frame. */
  focus: string;
}

export const SHOWCASE_HEROES: ShowcaseHero[] = [
  { character: GAME_CHARACTERS.argos, portrait: '/juego/loading_screen/argos.jpg', focus: '50% 20%' },
  { character: GAME_CHARACTERS.nathan, portrait: '/juego/loading_screen/nathan.jpg', focus: '50% 30%' },
  { character: GAME_CHARACTERS.orfevre, portrait: '/juego/loading_screen/orfevre.jpg', focus: '50% 15%' },
];
