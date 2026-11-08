// Les déjections au ranch : leur taille est une vraie proportion de la silhouette de l'écho qui les a laissées,
// telle qu'elle s'affiche à l'écran au stade où il les a laissées (un bébé devenu enfant ne fait pas grossir ses
// anciennes crottes).
// Hauteur de la silhouette affichée = image de référence (190 px pour 90 cm) × échelle de l'écho (profilEcho :
// taille du stade × taille propre à l'individu) × part opaque de l'image (boîte utile du catalogue : le vide
// au-dessus et au-dessous ne compte pas) × perspective du sol là où la déjection est tombée.
// Une crotte fait PART_CROTTE de cette hauteur ; une flaque de vomi, PART_VOMI (elle s'étale plus qu'elle ne monte).
// La zone cliquable (64 × 60) reste la même, centrée sur l'image : une toute petite crotte de bébé reste facile à ramasser.
import type { Dejection, Etat, Stade } from '@/moteur/simulation';
import { profilEcho } from './demarche';
import { perspective } from './visiteur';

/** Images des déjections, et part opaque de leur hauteur (boîte utile : le vomi a beaucoup de vide autour). */
export const IMAGE_DEJECTION = {
  crotte: { l: 140, h: 121, opaque: 1 },
  vomi: { l: 384, h: 384, opaque: 141 / 384, haut: 182 / 384 },
} as const;
/** Hauteur visible d'une crotte, en part de la hauteur de la silhouette de l'écho à l'écran. */
export const PART_CROTTE = 0.18;
/** Hauteur visible d'une flaque de vomi, en part de la hauteur de la silhouette. */
export const PART_VOMI = 0.11;
/** Hauteur de l'image de référence (90 cm) au ranch, en px. */
const H_IMAGE = 190;
/** Part opaque moyenne des images d'un stade, quand on ne connaît pas l'image (mesurée sur le catalogue). */
export const PART_OPAQUE_STADE: Record<Stade, number> = { bebe: 0.915, enfant: 0.924, adolescent: 0.933, adulte: 0.981 };
/** Plus petite hauteur visible (px) : une crotte de bébé reste visible. */
const MIN_VISIBLE = 8;

/** Hauteur (px, repère 1280 × 800) de la silhouette d'un écho d'échelle `echelle`, part opaque `opaque`, à la profondeur des pieds `piedY`. */
export function hauteurSilhouette(echelle: number, opaque: number, piedY?: number): number {
  const p = piedY == null ? 1 : perspective(piedY - 232);
  return H_IMAGE * echelle * opaque * p;
}

/**
 * Où et à quelle taille dessiner une déjection (repère 1280 × 800) : le bas-centre de l'image reste au même point du sol,
 * la zone cliquable (64 × 60) reste centrée sur ce qu'on voit.
 * `opaque` : part opaque de l'image de l'écho au stade où il l'a laissée (sinon la moyenne du stade).
 */
export function placerDejection(d: Dejection, e: Pick<Etat, 'stade' | 'taille' | 'poids'>, opaque?: number) {
  const stade = d.stade ?? e.stade;
  const cx = Math.round(250 + d.x * 760 + 28), pied = Math.round(430 + d.y * 160 + 52);
  const echelle = profilEcho({ stade, taille: e.taille, poids: e.poids }).echelle;
  const hs = hauteurSilhouette(echelle, opaque ?? PART_OPAQUE_STADE[stade], pied);
  const im = IMAGE_DEJECTION[d.nature === 'vomi' ? 'vomi' : 'crotte'];
  const visible = Math.max(MIN_VISIBLE, hs * (d.nature === 'vomi' ? PART_VOMI : PART_CROTTE));
  const h = Math.round(visible / im.opaque), l = Math.round((h * im.l) / im.h);
  // le vomi a du vide sous la flaque : son bas visible se pose sur le sol
  const vide = d.nature === 'vomi' ? Math.round(h * (1 - IMAGE_DEJECTION.vomi.haut - IMAGE_DEJECTION.vomi.opaque)) : 0;
  const x = cx - Math.round(l / 2), y = pied - h + vide;
  const yVu = y + Math.round(h * (d.nature === 'vomi' ? IMAGE_DEJECTION.vomi.haut : 0));
  return { x, y, l, h, z: 100 + pied - 252, bx: Math.round(cx - 32 + 4), by: Math.round(yVu + visible / 2 - 30 + 4), visible: Math.round(visible), silhouette: Math.round(hs) };
}
