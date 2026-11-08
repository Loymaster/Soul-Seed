// Types du catalogue d'assets généré par outils/assets/catalogue.mjs (contenu/generes/assets.json).
import type { Timbre } from '@/moteur/sfx';

export interface Boite { x: number; y: number; l: number; h: number }

export type Role =
  | 'expression' | 'vignette' | 'illustration' | 'calque'
  | 'forme' | 'graine' | 'ame' | 'portrait'
  | 'decor' | 'icone' | 'emotion' | 'objet' | 'activite' | 'animation' | 'musique'
  | 'a-trier' | 'inconnu';

export interface FormeEcho {
  stade: string;
  forme: string;
  type: 'pure' | 'sombre' | 'branche' | 'melee' | 'memoire' | 'fragment' | 'graine' | 'autre';
  lignees: string[];
  sombre: boolean;
  genre?: 'f' | 'm';
  element?: string;
  nom: string;
}

export interface Asset {
  chemin: string;
  url: string;
  ext: string;
  categorie: string;
  sousCategorie?: string;
  octets: number;
  modifie: number;
  empreinte: string;
  type: 'image' | 'animation' | 'son' | 'autre';
  role: Role;
  l?: number;
  h?: number;
  alpha?: boolean;
  images?: number;
  transparence?: number;
  boite?: Boite;
  couleur?: string;
  pnj?: { id: string; variante: string };
  echo?: FormeEcho;
  suggestion?: string | null;
  doublons?: string[];
  erreur?: string;
}

/**
 * Voix de dialogue d'un PNJ : `timbre` nomme une voix de la bibliothèque (src/moteur/voix/moteur-voix.js, page d'essai
 * outils/voix/essai-voix.html) ; les autres champs l'ajustent (absents : réglages de la voix choisie).
 */
export interface Voix {
  timbre: string | Timbre;
  note: number;
  rythme: number;
  variation?: number;
  gamme?: 'penta' | 'majeure' | 'mineure' | 'chromatique' | 'libre';
  duree?: number;
  cadence?: 'lettre' | 'syllabe' | 'mot';
  volume?: number;
}

export interface FichePNJ {
  id: string;
  nom: string;
  prefixes: string[];
  encre: string;
  taille: number;
  visible: number;
  miroirADroite: boolean;
  voix: Voix;
  defaut: string | null;
  expressions: Record<string, string>;
  vignette?: string;
  notes?: string;
}

export interface PNJCatalogue extends FichePNJ {
  nouvelle?: boolean;
  assets: { expressions: string[]; vignette: string | null; illustrations: string[]; calques: string[] };
}

export type Niveau = 'erreur' | 'alerte' | 'info';

export interface Diagnostic {
  niveau: Niveau;
  code: string;
  message: string;
  chemin?: string;
  chemins?: string[];
  suggestion?: string | null;
  fiche?: string;
  cle?: string;
  stade?: string;
  lignee?: string;
  type?: string;
  forme?: string;
}

export interface Catalogue {
  version: number;
  genereLe: string;
  categories: Record<string, string>;
  lignees: Record<string, { id: string; nom: string }>;
  compte: Record<string, number>;
  assets: Asset[];
  pnj: Record<string, PNJCatalogue>;
  echos: { stades: string[]; formes: Record<string, string[]> };
  diagnostics: Diagnostic[];
}
