// Volumes de la musique et des bruitages (réglages du profil), réglables séparément, de 0 à 1.
import { SFX } from '../../moteur/sfx';

const etat = { musique: 0.5, bruitages: 0.8 }; // défauts des profils (src/jeu/profils.ts)
const ecouteurs = new Set<() => void>();

export const volumeMusique = () => etat.musique;
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
