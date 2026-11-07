// Placement des personnages dans une scène de dialogue (repère de 1280 × 800).
// Tous les personnages ont les pieds sur une même ligne imaginaire et sont mis à l'échelle
// selon leur taille réelle : un PNJ de 1,90 m est plus grand qu'un de 1,30 m, quelle que soit son image.
import type { Boite } from '@/contenu/types';

export const SCENE_L = 1280;
export const SCENE_H = 800;
/** Ligne des pieds, en pixels depuis le bas de la scène (aux trois quarts de la zone de texte). */
export const LIGNE_PIEDS = SCENE_H - 638;
/** Pixels par mètre : un personnage de 1 m mesure 245 px dans le repère de la scène. */
export const PX_PAR_METRE = 245;

/** Centres horizontaux des quatre places : deux à gauche, deux à droite (1 = bord, 2 = centre). */
export const PLACES = { G1: 250, G2: 420, D2: 860, D1: 1030 } as const;
export type Place = keyof typeof PLACES;

export interface Placement {
  /** hauteur affichée du contenu de l'image (la partie visible du personnage) */
  hauteur: number;
  /** distance entre le bas de la scène et le bas de l'image */
  bas: number;
}

/**
 * taille : taille réelle en mètres ; visible : part du corps montrée par l'image (1 = des pieds à la tête,
 * 0,86 = l'image s'arrête un peu au-dessus des pieds). La partie manquante passe sous la ligne des pieds,
 * dans le flou de la zone de texte.
 */
export function placer(taille: number, visible: number): Placement {
  const complet = taille * PX_PAR_METRE;
  return { hauteur: Math.round(complet * visible), bas: Math.round(LIGNE_PIEDS + complet * (1 - visible) + rehausse(taille)) };
}

/**
 * Hauteur minimale atteinte par le haut de la tête, en mètres au-dessus de la ligne des pieds.
 * Un personnage plus petit (Lady Roger, Finn, Phil…) garde sa taille mais est rehaussé d'autant :
 * sinon il disparaîtrait presque entièrement derrière la feuille de dialogue.
 */
export const HAUTEUR_MIN = 1.2;
/** Rehausse d'un personnage trop petit, en pixels (0 au-delà du seuil). */
export const rehausse = (taille: number) => Math.max(0, (HAUTEUR_MIN - taille) * PX_PAR_METRE);

/** Style d'une image rognée à sa boîte utile et affichée à une hauteur donnée. */
export function rogner(image: { l: number; h: number; boite?: Boite }, hauteur: number) {
  const b = image.boite && image.boite.h ? image.boite : { x: 0, y: 0, l: image.l, h: image.h };
  const k = hauteur / b.h;
  return {
    cadre: { width: Math.round(b.l * k), height: Math.round(hauteur) },
    image: { width: Math.round(image.l * k), height: Math.round(image.h * k), left: Math.round(-b.x * k), top: Math.round(-b.y * k) }
  };
}
