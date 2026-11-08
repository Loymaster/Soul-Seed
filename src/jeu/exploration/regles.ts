// Règles de l'exploration, sans affichage (reprises de la maquette « Exploration » v12) : ressources récoltées,
// tempérament de terrain de l'écho, lumière du jour, rencontres emportées vers le combat, bilan d'une sortie.
import type { EchoSauvage, Etat } from '@/moteur/simulation';
import { ranger } from '@/moteur/simulation/objets';
import type { BilanSortie, Monde, Ressource } from '@/moteur/monde';

// Ressources de « Récolter » (pools du prototype, par groupe de zones ; plafond de 5 par ressource, géré par le monde).
export const MAT_POOLS: Record<string, { w: Partial<Record<Ressource, number>>; q: Partial<Record<Ressource, [number, number]>> }> = {
  village: { w: { bois: 50, pierre: 30, fibres: 15, resine: 5 }, q: { bois: [1, 3], pierre: [1, 2], fibres: [1, 2], resine: [1, 1] } },
  foret: { w: { bois: 55, fibres: 25, resine: 15, pierre: 5 }, q: { bois: [2, 4], fibres: [1, 3], resine: [1, 2], pierre: [1, 1] } },
  eau: { w: { fibres: 40, bois: 35, pierre: 20, resine: 5 }, q: { fibres: [1, 2], bois: [1, 2], pierre: [1, 1], resine: [1, 1] } },
  montagne: { w: { pierre: 55, bois: 20, fibres: 15, resine: 8, ferraille: 2 }, q: { pierre: [2, 4], bois: [1, 1], fibres: [1, 1], resine: [1, 1], ferraille: [1, 1] } },
  falaise: { w: { pierre: 50, ferraille: 12, resine: 15, fibres: 15, bois: 8 }, q: { pierre: [2, 4], ferraille: [1, 1], resine: [1, 1], fibres: [1, 1], bois: [1, 1] } },
  caverne: { w: { pierre: 82, ferraille: 18 }, q: { pierre: [2, 4], ferraille: [1, 1] } },
  cristal: { w: { pierre: 55, ferraille: 27, cristaux: 8 }, q: { pierre: [1, 3], ferraille: [1, 2], cristaux: [1, 1] } },
};
const GROUPE_MAT: Record<number, string> = { 1: 'village', 2: 'village', 4: 'village', 5: 'village', 3: 'foret', 16: 'foret', 17: 'foret', 7: 'eau', 8: 'eau', 9: 'montagne', 10: 'montagne', 11: 'montagne', 12: 'falaise', 13: 'falaise', 14: 'falaise', 15: 'falaise', 30: 'cristal' };
export const groupeMat = (z: number) => GROUPE_MAT[z] || (z >= 18 && z <= 29 ? 'caverne' : z >= 31 ? 'eau' : null);
/** Durées des actions (minutes de jeu). */
export const DUREES = { fouiller: 30, envoyer: 20, recolter: 30, pecher: 15, nourrir: 10, soigner: 10 };
/** Tempérament de terrain de l'écho : il change ce qu'il fait (fuite, ce qu'il rapporte), pas ce qu'on affiche. */
export const TEMPERAMENTS = {
  fonceur: { fuite: 0.45, echoEnvoi: 0.42, trouve: 0.72, rare: 1 },
  prudent: { fuite: 0.78, echoEnvoi: 0.16, trouve: 0.66, rare: 1 },
  curieux: { fuite: 0.6, echoEnvoi: 0.3, trouve: 0.85, rare: 2.2 },
};
export type CleTemperamentTerrain = keyof typeof TEMPERAMENTS;
/** Le tempérament de terrain se lit dans celui de l'écho : impulsif et résolu → fonceur, prudent et prévoyant → prudent, curieux → curieux. */
export function temperamentTerrain(e: Pick<Etat, 'temperament' | 'traits'>): CleTemperamentTerrain {
  const t = e.temperament, tr = e.traits;
  const scores: Record<CleTemperamentTerrain, number> = { fonceur: tr.impulsivite + t.res * 10, prudent: tr.prudence + t.ant * 10, curieux: 50 + t.cur * 10 };
  return (Object.keys(scores) as CleTemperamentTerrain[]).reduce((a, b) => (scores[b] > scores[a] ? b : a), 'fonceur');
}

// —— Lumière du jour, interpolée minute par minute (on assombrit et on teinte par-dessus, sans dénaturer l'image) ——
// [heure, luminosité, saturation, teinte multipliée (r,g,b), intensité de la teinte, chaleur (lumière rasante)]
type Cle = [number, number, number, [number, number, number], number, number];
const LUMIERE: Cle[] = [
  [0, 0.6, 0.62, [62, 82, 150], 0.58, 0], [5, 0.6, 0.62, [62, 82, 150], 0.58, 0],
  [6.5, 0.84, 0.86, [235, 185, 175], 0.3, 0.18], [8, 1, 1, [255, 255, 255], 0, 0.05],
  [16.5, 1, 1, [255, 255, 255], 0, 0], [18.5, 0.95, 1.04, [255, 196, 150], 0.22, 0.22],
  [20, 0.78, 0.84, [150, 125, 175], 0.36, 0.06], [21.5, 0.6, 0.62, [62, 82, 150], 0.58, 0], [24, 0.6, 0.62, [62, 82, 150], 0.58, 0],
];
export function lumiere(minutes: number, grotte: boolean) {
  if (grotte) return { filtre: 'brightness(.95)', teinte: 'rgba(40,24,14,.25)', chaleur: 0, sombre: true };
  const h = (minutes % 1440) / 60;
  let i = 0; while (i < LUMIERE.length - 2 && LUMIERE[i + 1][0] <= h) i++;
  const a = LUMIERE[i], b = LUMIERE[i + 1], k = (h - a[0]) / Math.max(0.0001, b[0] - a[0]);
  const m = (x: number, y: number) => x + (y - x) * k;
  const c = a[3].map((v, j) => Math.round(m(v, b[3][j])));
  return { filtre: `brightness(${m(a[1], b[1]).toFixed(3)}) saturate(${m(a[2], b[2]).toFixed(3)})`, teinte: `rgba(${c.join(',')},${m(a[4], b[4]).toFixed(3)})`, chaleur: +m(a[5], b[5]).toFixed(3), sombre: h >= 20.5 || h < 5.5 };
}

/** Ce qu'une rencontre emporte vers l'écran de combat, et ce qu'elle rapporte au retour. */
export interface RencontreExploration {
  zone: number;
  sauvage: EchoSauvage;
  /** Trouvailles dispersées (fouille interrompue) : elles reviennent au sac si l'on gagne. */
  enjeu: string[];
  /** Position de l'écho sauvage dans le décor. */
  x: number; y: number;
}
/**
 * Retour d'un combat ; les trouvailles reprises (victoire) sont déjà rangées dans le sac, `plein` : il a fallu en laisser,
 * `restes` : celles qui n'ont pas trouvé de place (l'exploration propose alors de faire de la place, reception.ts).
 */
export interface RetourCombat { rencontre: RencontreExploration; resultat: 'victoire' | 'defaite' | 'fuite'; plein?: boolean; restes?: string[] }

/** Après une victoire, les trouvailles dispersées reviennent au sac. Renvoie celles que le sac n'a pas pu contenir. */
export function reprendreTrouvailles(e: Etat, r: RencontreExploration): string[] {
  return r.enjeu.filter((id) => ranger(e, id, 1) === 0);
}
/** Le sac et le monde au départ de la sortie (pour la page de retour au ranch). */
export type { BilanSortie } from '@/moteur/monde';

export function bilanDepart(e: Etat, m: Monde): BilanSortie {
  const inventaire: Record<string, number> = {};
  e.inventaire.forEach((c) => { if (c) inventaire[c.id] = (inventaire[c.id] ?? 0) + c.qte; });
  return { inventaire, ressources: { ...m.ressources }, decouvertes: [...m.decouvertes] };
}

