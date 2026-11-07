// Les PNJ d'exploration (spécification du monde §2, tableau de contenu/scenes/LISEZMOI.md) : qui se tient où et quand,
// quelle scène se joue au clic, et les boutons posés dans le décor (« Partir affronter Garry », « Inspecter la cabane »…).
// Sans affichage : Exploration.tsx les place dans le décor et joue leur scène par-dessus avec ScenePnj.
//
// La plupart des PNJ sont peints dans un calque plein cadre aligné sur le décor (hevann/foret.png…) : on n'en garde
// que la boîte utile, posée au même endroit du décor, ce qui donne d'emblée la bonne échelle de profondeur.
// Glamp n'a pas de calque : son sprite est posé à des pieds donnés, à la taille de sa fiche.
import type { Monde } from '@/moteur/monde';
import type { Etat } from '@/moteur/simulation';

export interface ContexteExploration {
  m: Monde;
  e: Etat;
  /** heure du jour (0–23) */
  h: number;
}

const d = (m: Monde, cle: string) => !!m.drapeaux[cle];

export interface PnjExploration {
  id: string;
  nom: string;
  zone: number;
  visible: (c: ContexteExploration) => boolean;
  /** Calque plein cadre (aligné sur le décor) dont on garde la boîte utile… */
  calque?: string;
  /** …ou sprite posé : pieds et centre dans le repère 1280 × 800, taille réelle (m). */
  sprite?: { image: string; x: number; pieds: number; taille: number };
  scene: string;
  sujet?: string;
  /** La scène peut lancer un combat : pas question d'y aller à bout de forces. */
  combat?: boolean;
  /** Place de l'écho quand ce PNJ est là (sa place habituelle le ferait passer devant lui). */
  echo?: [number, number];
  /** Position d'une flèche de chemin quand ce PNJ est là (vers → position). */
  chemins?: Record<number, [number, number]>;
  /** Il garde le passage : pas de fouille ni d'envoi de l'écho tant qu'il est là. */
  bloque?: string;
}

export interface BoutonExploration {
  id: string;
  zone: number;
  libelle: string;
  visible: (c: ContexteExploration) => boolean;
  scene: string;
  sujet?: string;
  combat?: boolean;
  /** Position (repère 1280 × 800) ; `rouge` : le bouton du combat contre Garry. */
  x: number;
  y: number;
  rouge?: boolean;
}

export const PNJ_EXPLORATION: PnjExploration[] = [
  {
    id: 'morthen', nom: 'Morthen', zone: 2, calque: 'pnj/morthen/assis.png', scene: 'morthen',
    visible: (c) => !d(c.m, 'morthen.vu') && c.e.jour >= 4 && c.h >= 8 && c.h < 16,
  },
  {
    id: 'bourbella', nom: 'Bourbella', zone: 5, calque: 'pnj/bourbella/cabane.png', scene: 'bourbella-cabane', combat: true,
    visible: (c) => !d(c.m, 'bourbella.recrutee') && c.h >= 4 && c.h < 14,
    echo: [660, 700],
  },
  {
    id: 'phil-hibert', nom: 'Phil et Hibert', zone: 6, calque: 'pnj/phil/hibert-cabane.png', scene: 'phil-hibert', sujet: 'nuit', combat: true,
    visible: (c) => d(c.m, 'ash.vu') && !d(c.m, 'philhibert.vaincus') && (c.h >= 22 || c.h < 7),
    echo: [975, 700],
  },
  {
    id: 'tourby', nom: 'Tourby', zone: 7, calque: 'pnj/tourby/riviere.png', scene: 'tourby-riviere',
    visible: (c) => !d(c.m, 'tourby.recrute') && c.h >= 16,
  },
  {
    id: 'ash', nom: 'Ash', zone: 11, calque: 'pnj/ash/montagne.png', scene: 'ash-montagne',
    visible: (c) => !d(c.m, 'ash.recrute') && c.h >= 8 && c.h < 20,
    // le chemin de droite remonte au-dessus de lui (top 14 % dans le prototype)
    chemins: { 12: [1010, 175] },
  },
  {
    id: 'hevann', nom: 'Hevann', zone: 16, calque: 'pnj/hevann/foret.png', scene: 'hevann-chemin', combat: true,
    visible: (c) => !d(c.m, 'hevann.vaincu'),
    echo: [330, 745],
    bloque: 'Hevann bloque le passage.',
  },
  {
    id: 'grimp', nom: 'Grimp', zone: 23, calque: 'pnj/grimp/caverne.png', scene: 'grimp-caverne',
    visible: (c) => !d(c.m, 'grimp.recrute') && (c.h >= 12 || d(c.m, 'glamp.recrutee')),
  },
  {
    id: 'glamp', nom: 'Glamp', zone: 28, sprite: { image: 'pnj/glamp/neutre.png', x: 880, pieds: 650, taille: 0.65 }, scene: 'glamp-trefonds',
    visible: (c) => d(c.m, 'trefonds.deblaye') && !d(c.m, 'glamp.recrutee'),
  },
];

export const BOUTONS_EXPLORATION: BoutonExploration[] = [
  {
    id: 'garry', zone: 17, libelle: 'Partir affronter Garry', scene: 'garry-foret', combat: true, rouge: true, x: 640, y: 400,
    visible: (c) => !d(c.m, 'garry.vaincu'),
  },
  {
    id: 'cabane', zone: 6, libelle: 'Inspecter la cabane', scene: 'phil-hibert', sujet: 'inspecter', x: 640, y: 380,
    visible: (c) => d(c.m, 'ash.vu') && !d(c.m, 'philhibert.vaincus') && c.h >= 8 && c.h < 22,
  },
  {
    id: 'marteau', zone: 6, libelle: 'Récupérer le marteau', scene: 'phil-hibert', sujet: 'marteau', x: 430, y: 690,
    visible: (c) => d(c.m, 'ash.marteau_au_sol'),
  },
  {
    id: 'deblayer', zone: 28, libelle: 'Déblayer le passage', scene: 'trefonds-deblayer', x: 640, y: 420,
    visible: (c) => d(c.m, 'grimp.accepte') && !d(c.m, 'trefonds.deblaye'),
  },
];

/** La cinématique du sentier solitaire (lieu 32) : en y arrivant, de 8 h à 20 h, tant qu'elle n'a pas été vue. */
export const ZONE_NYXARA = 32;
export const nyxaraPossible = (c: ContexteExploration) => !d(c.m, 'nyxara.vue') && c.h >= 8 && c.h < 20;

/** Décor d'un lieu selon le monde : le passage des tréfonds une fois déblayé. */
export const fondDuLieu = (zone: number, fond: string, m: Monde) =>
  zone === 28 && d(m, 'trefonds.deblaye') ? 'decors/exploration/28bis-passage-desencombre-trefonds.png' : fond;

export const pnjDuLieu = (zone: number, c: ContexteExploration) => PNJ_EXPLORATION.filter((p) => p.zone === zone && p.visible(c));
export const boutonsDuLieu = (zone: number, c: ContexteExploration) => BOUTONS_EXPLORATION.filter((b) => b.zone === zone && b.visible(c));
