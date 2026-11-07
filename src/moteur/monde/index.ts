// État du monde d'une partie : tout ce qui dure au-delà d'un écho (il survit à sa disparition, comme le personnage).
// Drapeaux de quêtes, ressources de construction, lieux découverts, rencontres, constructions, PNJ.
// Sans affichage ; sérialisable tel quel (sauvegarde JSON, une par emplacement de partie).
import type { Etat } from '../simulation/types';

export type Ressource = 'bois' | 'pierre' | 'fibres' | 'resine' | 'ferraille' | 'cristaux';
export const RESSOURCES: Ressource[] = ['bois', 'pierre', 'fibres', 'resine', 'ferraille', 'cristaux'];
/** Plafond de chaque ressource dans le sac (comme dans le prototype). */
export const PLAFOND_RESSOURCE = 5;

export type ValeurDrapeau = boolean | number | string;

export interface Monde {
  version: 1;
  /** Drapeaux libres (quêtes, rencontres, déblocages) : « hevannVaincu », « ashRejoint »… */
  drapeaux: Record<string, ValeurDrapeau>;
  /** Quêtes : identifiant → étape courante (« fini » quand elle est terminée). */
  quetes: Record<string, string>;
  ressources: Partial<Record<Ressource, number>>;
  /** Lieux d'exploration déjà visités (numéros du prototype). */
  decouvertes: number[];
  /** Actions limitées à une fois par jour et par lieu : « zone:action » → jour. */
  faitAujourdhui: Record<string, number>;
  /** Dernière rencontre d'écho sauvage par lieu (minute absolue) et la plus récente, tous lieux confondus. */
  rencontres: Record<number, number>;
  derniereRencontre: number | null;
  /** Constructions achevées au ranch ou au village. */
  structures: string[];
  /** PNJ déjà rencontrés (identifiants des fiches). */
  pnjConnus: string[];
}

export function creerMonde(): Monde {
  return { version: 1, drapeaux: {}, quetes: {}, ressources: {}, decouvertes: [], faitAujourdhui: {}, rencontres: {}, derniereRencontre: null, structures: [], pnjConnus: [] };
}

/** Relit un monde enregistré en complétant ce qui manque (sauvegardes plus anciennes). */
export function normaliserMonde(m: Partial<Monde> | null | undefined): Monde {
  return { ...creerMonde(), ...(m ?? {}), version: 1 };
}

/** Minute absolue de la partie (jour × 1440 + minute du jour). */
export const minuteAbsolue = (e: Pick<Etat, 'jour' | 'minute'>) => e.jour * 1440 + e.minute;

export const drapeau = (m: Monde, cle: string): ValeurDrapeau | undefined => m.drapeaux[cle];
export const vrai = (m: Monde, cle: string) => !!m.drapeaux[cle];
export function poser(m: Monde, cle: string, valeur: ValeurDrapeau = true) { m.drapeaux[cle] = valeur; }

export const etapeQuete = (m: Monde, id: string): string | undefined => m.quetes[id];
export function avancerQuete(m: Monde, id: string, etape: string) { m.quetes[id] = etape; }

/** Ajoute des ressources (plafonnées) ; renvoie ce qui a réellement été rangé. */
export function ajouterRessource(m: Monde, r: Ressource, qte: number): number {
  const avant = m.ressources[r] ?? 0;
  const apres = Math.min(PLAFOND_RESSOURCE, avant + qte);
  m.ressources[r] = apres;
  return apres - avant;
}
/** Retire des ressources si le sac en contient assez. */
export function payerRessources(m: Monde, cout: Partial<Record<Ressource, number>>): boolean {
  if (Object.entries(cout).some(([r, q]) => (m.ressources[r as Ressource] ?? 0) < (q ?? 0))) return false;
  for (const [r, q] of Object.entries(cout)) m.ressources[r as Ressource] = (m.ressources[r as Ressource] ?? 0) - (q ?? 0);
  return true;
}

export function decouvrir(m: Monde, zone: number): boolean {
  if (m.decouvertes.includes(zone)) return false;
  m.decouvertes.push(zone); return true;
}
export const faitCeJour = (m: Monde, zone: number, action: string, jour: number) => m.faitAujourdhui[`${zone}:${action}`] === jour;
export function marquerFait(m: Monde, zone: number, action: string, jour: number) { m.faitAujourdhui[`${zone}:${action}`] = jour; }

export function connaitrePnj(m: Monde, id: string): boolean {
  if (m.pnjConnus.includes(id)) return false;
  m.pnjConnus.push(id); return true;
}

// —— Rencontres d'échos sauvages en exploration ——
// p = base × nuit (×1,3 dehors) × repousse (×0,5) × récence du lieu × souffle
//   récence : rencontre dans ce lieu il y a Δ minutes → 0,08 + 0,92 × (Δ / 1440)² tant que Δ < 24 h, puis 1
//   souffle : une rencontre (n'importe où) il y a moins de 20 min → ×0,3
export function facteurRecence(derniere: number | undefined | null, maintenant: number): number {
  if (derniere == null) return 1;
  const d = maintenant - derniere;
  return d >= 1440 ? 1 : 0.08 + 0.92 * Math.pow(d / 1440, 2);
}
export function probaRencontre(m: Monde, zone: number, maintenant: number, o: { base: number; nuitDehors: boolean; repousse: boolean }): number {
  let p = o.base;
  if (o.nuitDehors) p *= 1.3;
  if (o.repousse) p *= 0.5;
  p *= facteurRecence(m.rencontres[zone], maintenant);
  if (m.derniereRencontre != null && maintenant - m.derniereRencontre < 20) p *= 0.3;
  return p;
}
export function noterRencontre(m: Monde, zone: number, maintenant: number) { m.rencontres[zone] = maintenant; m.derniereRencontre = maintenant; }
