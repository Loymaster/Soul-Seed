// Les essais d'une corvée (les mini-jeux du prototype, qui se déroulaient seuls : startRangerRanch,
// startReparerCloture, startSimpleChore, startTrouverEcho, startDeplacerFoin, startRamenerEau).
// Chaque essai réussit avec une probabilité qui dépend du trait de la corvée et de l'expérience acquise dessus.
import type { Aleatoire } from './types';
import { ESSAIS_CORVEE } from './constantes';

/** Ranger le ranch : toujours les huit objets du prototype (3 aliments, 2 soins, 3 déchets), quel que soit le niveau. */
export const OBJETS_RANGEMENT = 8;

/** Probabilité de réussite d'un essai (prob du prototype). */
export function probaCorvee(id: string, trait: number, experience: number): number {
  // Réparer la barrière : erreur plus rare par essai, car une erreur en entraîne d'autres en cascade.
  if (id === 'reparer_cloture') return Math.max(0.25, Math.min(0.97, 0.65 + trait / 300 + Math.min(0.3, experience * 0.015)));
  return Math.max(0.15, Math.min(0.95, 0.35 + trait / 250 + Math.min(0.5, experience * 0.02)));
}

/** Nombre d'essais : selon le niveau de remise en état (CORVEE_LEVEL_ACTIONS), sauf le rangement (8 objets). */
export function nombreEssais(id: string, niveau: number): number {
  if (id === 'ranger_ranch') return OBJETS_RANGEMENT;
  return ESSAIS_CORVEE[Math.max(0, Math.min(3, niveau))];
}

/**
 * Les essais d'une corvée, réussis ou manqués.
 * La barrière : chaque morceau vise sa propre case ; si elle est déjà prise par une erreur précédente,
 * il se rabat sur une case libre au hasard — l'erreur se propage en cascade (startReparerCloture).
 */
export function essaisCorvee(id: string, trait: number, experience: number, niveau: number, rng: Aleatoire): boolean[] {
  const n = nombreEssais(id, niveau);
  const p = probaCorvee(id, trait, experience);
  if (id !== 'reparer_cloture') return Array.from({ length: n }, () => rng() < p);
  // ordre de tentative mélangé (Fisher-Yates), indépendant des emplacements d'origine
  const ordre = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
  const prises: number[] = [];
  return ordre.map((maison) => {
    const veutJuste = rng() < p;
    let cible: number;
    if (veutJuste && !prises.includes(maison)) cible = maison;
    else {
      const libres = ordre.map((_, i) => i).filter((i) => !prises.includes(i));
      cible = libres.length ? libres[Math.floor(rng() * libres.length)] : maison;
    }
    prises.push(cible);
    return cible === maison;
  });
}
