// Scènes d'action du ranch : quelle animation joue chaque activité (la fenêtre centrale où l'écho saute),
// et les bruitages qui l'accompagnent. Les accessoires et les gestes sont dans la maquette (ranch.tpl.html, ranch.css).
import type { Entrainement } from '@/moteur/simulation';

/**
 * Hauteur de l'écho dans la fenêtre de scène (px) selon son échelle au ranch (bébé 0,5, enfant 0,75, adolescent 1, adulte 1,15,
 * fois la taille propre à l'individu) : 170 px pour un enfant, plus petit pour un bébé, plus grand ensuite, sans sortir du cadre.
 * Les accessoires portés (brosse, pierre, gerbe, sueur…) se placent d'après cette hauteur (variable CSS --h).
 */
export const hauteurScene = (echelle: number): number => Math.round(170 * Math.min(1.2, Math.max(0.72, Math.sqrt(Math.max(0.1, echelle) / 0.75))));

/** Une interaction (jeu, discussion, partage, éducation) : sa scène. */
export function sceneInteraction(cat: string, id: string, nuit = false): string {
  switch (id) {
    case 'balle': return 'balle';
    case 'cachecache': return 'cache';
    case 'course': return 'course';
    case 'dessiner': return 'dessin';
    case 'cabanes': return 'cabane';
    case 'devinettes': return 'devinette';
    case 'blague': return 'rire';
    case 'ciel': return nuit ? 'lucioles' : 'ciel';
    case 'balade': return 'balade';
    case 'sieste': return 'coucher';
    case 'bruits': return 'bruits';
    case 'insectes': return 'insectes';
    case 'feu': return 'feu';
    case 'histoire': return 'histoire';
    case 'phenomene': return 'probleme';
    default: break;
  }
  return cat === 'jeu' ? 'balle' : cat === 'discussion' ? 'discussion' : cat === 'education' ? 'lecon' : cat === 'partage' ? 'bruits' : 'histoire';
}

/** Chaque entraînement a son geste. */
export const sceneEntrainement = (t: Entrainement): string =>
  ({ pierres: 'pierres', equilibre: 'equilibre', saut: 'sauter', course: 'course', mediter: 'mediter', probleme: 'probleme' } as Record<string, string>)[t.id] ?? 'course';

/** Chaque corvée aussi. */
export const sceneCorvee = (id: string): string =>
  ({ ranger_ranch: 'ranger', reparer_cloture: 'barriere', rattraper_poules: 'poules', deplacer_foin: 'foin', ramener_eau: 'eau', trouver_echo: 'cache' } as Record<string, string>)[id] ?? 'ranger';

/** Bruitages d'une scène : le son et ses instants (ms après le début du geste). */
const SONS: Record<string, [string, number[]]> = {
  laver: ['eau', [0, 700, 1500]], brosser: ['brosse', [0, 1000, 2000]], coucher: ['berceuse', [0]], manger: ['croque', [600, 1150, 1700, 2250, 2800]],
  balle: ['rebond', [550, 1650, 2750]], sauter: ['rebond', [400, 1300, 2200, 3100]], saut: ['rebond', [0, 1100, 2200]],
  insectes: ['rebond', [400, 1500, 2600]], cabane: ['marteau', [300, 700, 1100, 2500]],
  barriere: ['marteau', [0, 650, 1300, 1950, 2600]], ranger: ['sacPose', [900, 1500, 2100, 2700]], foin: ['foulee', [0, 800, 1600, 2400]],
  poules: ['foulee', [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400]], eau: ['eau', [300, 1600]],
  cache: ['foulee', [0, 500, 1000, 1500, 2000, 2500]], course: ['foulee', [0, 280, 560, 840, 1120, 1400, 1680, 1960, 2240, 2520]],
  balade: ['foulee', [0, 500, 1000, 1500, 2000, 2500]], pierres: ['sacPose', [0, 1300, 2600]], equilibre: ['leather', [0, 900, 1800, 2700]],
  corde: ['leather', [0, 700, 1400, 2100]], histoire: ['page', [0, 1600]], discussion: ['typeTick', [0, 120, 240, 1200, 1320, 1440]],
  rire: ['pop', [0, 500, 1000, 1500]], devinette: ['pop', [0, 500, 1400]], dessin: ['pencil', [0, 900, 1800]], lecon: ['pencil', [0, 900, 1800]],
  probleme: ['pencil', [0, 1600]], mediter: ['reveal', [0]], esprit: ['reveal', [0]], lucioles: ['berceuse', [0]], ciel: ['woosh', [0, 2200]],
  bruits: ['bulles', [0, 1800]], feu: ['eau', []],
};
export function sonsScene(kind: string): { son: string; instants: number[] } | null {
  const s = SONS[kind];
  return s ? { son: s[0], instants: s[1] } : null;
}

/** Essais d'une corvée, révélés un à un pendant la scène (réussi ✓, manqué ✗). */
export function essaisScene(essais: boolean[]) {
  const pas = Math.min(0.35, 2.8 / Math.max(1, essais.length));
  return essais.map((ok, i) => ({ cls: ok ? 'ok' : 'rate', signe: ok ? '✓' : '✗', delai: (0.2 + i * pas).toFixed(2) }));
}

/** Ce que dit la feuille volante à l'issue d'une corvée (le palier du mini-jeu du prototype, en mots). */
export const PALIER_CORVEE: Record<string, string> = {
  Parfait: 'Un travail parfait !', Bon: 'Du bon travail.', Mauvais: 'Pas très réussi…', Horrible: 'Rien n’a marché…',
};
