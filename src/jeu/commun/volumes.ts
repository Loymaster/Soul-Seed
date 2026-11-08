// Volumes de la musique et des bruitages (réglages du profil), réglables séparément, de 0 à 1.
// Toutes les musiques du jeu (ranch, monde, exploration, combat, arène, menu, intro, graines, mort, scènes)
// lisent leur volume ici, par volumeMusique() : c'est le seul endroit où régler leur niveau d'ensemble.
import { SFX } from '../../moteur/sfx';

const etat = { musique: 0.5, bruitages: 0.8 }; // défauts des profils (src/jeu/profils.ts)
const ecouteurs = new Set<() => void>();

/**
 * Atténuation native de toutes les musiques : elles sont jouées à moitié de leur niveau d'origine,
 * et la jauge « Volume de la musique » des options agit ensuite sur ce niveau déjà réduit.
 */
export const ATTENUATION_MUSIQUE = 0.5;

/** Volume effectif des musiques (0–1) : atténuation native × réglage du joueur (0 pendant une séquence qui les fait taire). */
export const volumeMusique = () => (silences > 0 ? 0 : ATTENUATION_MUSIQUE * etat.musique);

let silences = 0;
/**
 * Fait taire toutes les musiques (fondu court, elles continuent sans bruit) le temps d'une séquence plein écran
 * — l'évolution jouée hors du ranch ; renvoie de quoi les rendre (une seule fois).
 */
export function taireMusiques(): () => void {
  silences++;
  ecouteurs.forEach((f) => f());
  let fait = false;
  return () => { if (fait) return; fait = true; silences = Math.max(0, silences - 1); ecouteurs.forEach((f) => f()); };
}
/** Réglage du joueur seul (la jauge des options), sans l'atténuation native. */
export const reglageMusique = () => etat.musique;
export const volumeBruitages = () => etat.bruitages;

/** Applique les volumes (sans effet s'ils n'ont pas changé) ; les musiques en cours s'ajustent en douceur. */
export function fixerVolumes(v: { musique?: number; bruitages?: number }) {
  const m = Math.max(0, Math.min(1, v.musique ?? etat.musique));
  const b = Math.max(0, Math.min(1, v.bruitages ?? etat.bruitages));
  if (m === etat.musique && b === etat.bruitages) return;
  etat.musique = m; etat.bruitages = b;
  SFX.regler(b);
  ecouteurs.forEach((f) => f());
}

export function ecouterVolumes(f: () => void) {
  ecouteurs.add(f);
  return () => { ecouteurs.delete(f); };
}
