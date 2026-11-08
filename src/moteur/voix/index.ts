// Voix de dialogue : le moteur (moteur-voix.js, source unique partagée avec la page d'essai outils/voix/essai-voix.html)
// typé et branché sur le moteur de bruitages du jeu (même volume général, même réverbe claire).
import { SFX } from '../sfx';
import * as brut from './moteur-voix.js';

export type Cadence = 'lettre' | 'syllabe' | 'mot';
export type NomGamme = 'penta' | 'majeure' | 'mineure' | 'chromatique' | 'libre';

/** Ce qu'une fiche de PNJ dit de sa voix (champ « voix ») : seul `timbre` choisit la voix, le reste l'ajuste. */
export interface ReglagesFicheVoix {
  /** nom d'une voix de la bibliothèque (VOIX), ou ancien timbre personnalisé */
  timbre: string | Record<string, unknown>;
  /** hauteur de base (Hz) */
  note?: number;
  /** multiplicateur des pauses entre les lettres (> 1 : plus lent) */
  rythme?: number;
  /** étendue des hauteurs au-dessus de la note (demi-tons) */
  variation?: number;
  gamme?: NomGamme;
  /** multiplicateur de la durée de chaque note */
  duree?: number;
  cadence?: Cadence;
  /** multiplicateur du volume (0 à 2) */
  volume?: number;
}

export interface VoixBibliotheque {
  nom: string; famille: string; instrument: string; description: string;
  note: number; variation: number; gamme: NomGamme; rythme: number; duree: number; cadence: Cadence; volume: number;
}
export interface ReglagesVoix extends Omit<VoixBibliotheque, 'nom' | 'famille' | 'description'> { id: string }

export const VOIX = brut.VOIX as unknown as Record<string, VoixBibliotheque>;
export const FAMILLES = brut.FAMILLES as Record<string, string>;
export const GAMMES = brut.GAMMES as Record<NomGamme, { nom: string; degres: number[] | null }>;
export const CADENCES = brut.CADENCES as Record<Cadence, string>;
export const VOIX_PAR_DEFAUT: string = brut.VOIX_PAR_DEFAUT;

/** Réglages complets (voix de la bibliothèque + ajustements de la fiche + valeurs par défaut). */
export const reglagesVoix = (voix: ReglagesFicheVoix | string | undefined) => brut.reglagesVoix(voix) as unknown as ReglagesVoix;
/** Pause après une lettre (ms), avant le rythme de la voix. */
export const pauseApres: (ch: string) => number = brut.pauseApres;

interface SfxInterne { get(): AudioContext | null; master?: GainNode; bright?: AudioNode }

/** Fait parler la voix pour la lettre i du texte, dans le moteur de bruitages du jeu. Vrai si une note a été jouée. */
export function direLettre(texte: string, i: number, voix: ReglagesVoix | ReglagesFicheVoix | string | undefined): boolean {
  const s = SFX as unknown as SfxInterne;
  const ctx = s.get();
  if (!ctx || !s.master) return false;
  return brut.direLettre({ ctx, sortie: s.master, clair: s.bright }, texte, i, voix);
}
