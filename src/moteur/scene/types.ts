// Types du moteur de scènes de dialogue.
import type { Place } from './placement';

export type Valeur = number | boolean | string;

/** Expression d'une condition ou d'une valeur (« garry.relation >= 2 et non indices.garry »). */
export type Expr =
  | { t: 'val'; v: Valeur }
  | { t: 'var'; nom: string }
  | { t: 'non'; e: Expr }
  | { t: 'neg'; e: Expr }
  | { t: 'bin'; op: '==' | '!=' | '<' | '>' | '<=' | '>=' | 'et' | 'ou' | '+' | '-' | '*'; g: Expr; d: Expr };

export type Resonance = 'curiosite' | 'resolution' | 'discernement' | 'observation' | 'anticipation' | 'neutre' | 'indeterminee';

/** Une option de choix : une réponse du joueur, colorée par sa résonance. */
export interface OptionChoix {
  ligne: number;
  resonance: Resonance;
  texte: string;
  condition?: Expr;
  corps: Noeud[];
}

export interface Branche { ligne: number; condition: Expr | null; corps: Noeud[] }

/** Les instructions d'une scène, telles qu'écrites dans le fichier (arbre). */
export type Noeud =
  | { type: 'replique'; ligne: number; qui: string; expression?: string; texte: string }
  | { type: 'emotion'; ligne: number; emotion: string; note?: string }
  | { type: 'entre'; ligne: number; qui: string; place?: Place; expression?: string }
  | { type: 'sort'; ligne: number; qui: string[] } // ['*'] = tout le monde
  | { type: 'deplace'; ligne: number; qui: string; place: Place }
  | { type: 'decor'; ligne: number; decor: string }
  | { type: 'musique'; ligne: number; musique: string | null }
  | { type: 'pause'; ligne: number; secondes: number }
  /** Un moment mis en scène par le jeu lui-même (une graine qui éclot, un nom à donner, une image…). */
  | { type: 'action'; ligne: number; nom: string; argument?: string }
  | { type: 'affecte'; ligne: number; variable: string; op: '=' | '+=' | '-='; valeur: Expr }
  | { type: 'si'; ligne: number; branches: Branche[] }
  | { type: 'choix'; ligne: number; question?: string; options: OptionChoix[] }
  | { type: 'aller'; ligne: number; scene: string }
  | { type: 'fin'; ligne: number };

export interface PresenceInitiale { qui: string; place: Place; expression?: string; ligne: number }

export interface Scene {
  id: string;
  titre?: string;
  decor?: string;
  musique?: string | null;
  places: PresenceInitiale[];
  corps: Noeud[];
  /** nombre de lignes du fichier source */
  lignes: number;
}

export type NiveauProbleme = 'erreur' | 'alerte' | 'info';

export interface Probleme {
  niveau: NiveauProbleme;
  ligne: number;
  message: string;
  /** colonnes (0 = début de ligne) pour souligner précisément dans l'éditeur */
  de?: number;
  a?: number;
}

/** Personnages spéciaux, qui ne sont pas des PNJ. */
export const NARRATION = 'narration';
export const JOUEUR = 'vous';
export const ECHO = 'echo';
