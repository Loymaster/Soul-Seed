// Profil de déplacement de l'écho et bruit de ses pas.
// La démarche vient de la table des allures (src/jeu/commun/allures.ts), d'après l'image de la forme.
import type { Etat, Stade } from '@/moteur/simulation';
import { ALLURE_PAR_DEFAUT, allureDe, classesAllure, enLAir, type Allure, type Demarche } from '../commun/allures';

export type { Demarche } from '../commun/allures';

/** Taille de référence de chaque stade (m), multipliée par le facteur propre à l'individu (DEV_PHASE_SIZE_FACTOR × 0,9 m). */
export const TAILLE_STADE: Record<Stade, number> = { bebe: 0.45, enfant: 0.675, adolescent: 0.9, adulte: 1.035 };

/** Hauteur de l'image de référence (90 cm) au ranch, en px. */
const H_IMAGE = 190;

export interface Profil {
  demarche: Demarche;
  allure: Allure;
  taille: number;
  poids: number;
  /** Durée d'un cycle de pas complet (s). */
  cycle: number;
  /** Vitesse au sol (px/s dans le repère 1280 × 800). */
  vitesse: number;
  /** Instants des appuis (ou des coups d'ailes) dans un cycle (0–1) ; null : déplacement continu (flottant, rampant, nage). */
  motif: number[] | null;
  /** Facteur d'affichage : l'image de référence correspond à 90 cm. */
  echelle: number;
  /** Élévation au-dessus du sol (px, repère du ranch, avant perspective). */
  hauteur: number;
  /** Classes CSS de l'allure (allures.css). */
  classes: string;
}

const CYCLE: Record<Demarche, number> = { bipede: 0.64, quadrupede: 0.6, sautillant: 0.62, flottant: 1.4, rampant: 0.9, vole: 0.42, nage: 1.5, immobile: 1 };
const VITESSE: Record<Demarche, number> = { bipede: 62, quadrupede: 80, sautillant: 70, flottant: 48, rampant: 34, vole: 74, nage: 52, immobile: 0 };
const MOTIF: Record<Demarche, number[] | null> = { bipede: [0, 0.5], quadrupede: [0, 0.12, 0.5, 0.62], sautillant: [0.02], flottant: null, rampant: null, vole: [0.05], nage: null, immobile: null };
const CARRURE = { leger: { cycle: 0.88, vitesse: 1.08 }, moyen: { cycle: 1, vitesse: 1 }, lourd: { cycle: 1.18, vitesse: 0.86 } } as const;

/** L'allure de l'image d'un écho, ou celle par défaut (bipède). */
export function allureImage(chemin: string | null | undefined): Allure {
  return allureDe(chemin) ?? ALLURE_PAR_DEFAUT;
}

/**
 * Profil de déplacement.
 * @param allure  l'allure de la forme (table des allures) ou une simple démarche
 * @param entrain facteur de vivacité tiré des signes (1 : normal ; < 1 : traîne)
 */
export function profilEcho(e: Pick<Etat, 'stade' | 'taille' | 'poids'>, allure: Allure | Demarche = 'bipede', entrain = 1): Profil {
  const a: Allure = typeof allure === 'string' ? { ...ALLURE_PAR_DEFAUT, demarche: allure } : allure;
  const d = a.demarche;
  const taille = TAILLE_STADE[e.stade] * e.taille;
  const poids = e.poids;
  const grandeur = Math.sqrt(Math.max(0.2, taille) / 0.9);
  const rythme = 1 / entrain;
  const k = CARRURE[a.carrure];
  const cycle = CYCLE[d] * a.cadence * k.cycle * grandeur * Math.pow(Math.max(1, poids) / 20, 0.08) * rythme;
  const vitesse = VITESSE[d] * k.vitesse * grandeur / rythme;
  const echelle = Math.max(0.45, Math.min(2.4, taille / 0.9));
  const hauteur = enLAir(d) ? Math.round(a.hauteur * H_IMAGE * echelle) : 0;
  return { demarche: d, allure: a, taille, poids, cycle, vitesse: Math.max(1, vitesse), motif: MOTIF[d], echelle, hauteur, classes: classesAllure(a, hauteur) };
}

/** Volume des pas : maximal au premier plan, plus faible quand l'écho s'éloigne vers le fond. */
export function volumePas(y: number) {
  const proche = Math.max(0, Math.min(1, (y - 235) / 135));
  return 1.15 * (0.18 + 0.82 * Math.pow(proche, 1.4));
}
