// État du monde d'une partie : tout ce qui dure au-delà d'un écho (il survit à sa disparition, comme le personnage).
// Drapeaux de quêtes, ressources de construction, lieux découverts, rencontres, constructions, PNJ.
// Sans affichage ; sérialisable tel quel (sauvegarde JSON, une par emplacement de partie).
import type { CaseInventaire, Etat } from '../simulation/types';

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
  /** Coffre de Maïko, puis entrepôt : objets déposés et ressources stockées (plafonds selon le niveau d'entrepôt). */
  coffre: { objets: (CaseInventaire | null)[]; ressources: Partial<Record<Ressource, number>> };
  /** Étal du jour de la boutique de Jumpy (renouvelé à la première visite de chaque jour). */
  boutique: { jour: number; etal: EmplacementEtal[] } | null;
  /** Bâtiment qu'Ash construit (fin en minute absolue). */
  chantier: { cle: string; nom: string; finA: number } | null;
  /** Réparation ou amélioration de corvée en cours chez Ash (fin en minute absolue). */
  reparation: { corvee: string; libelle: string; niveau: number; finA: number } | null;
  /** Niveau des corvées du ranch remises en état par Ash (0 : pas encore réparée, 1 à 3). */
  corvees: Record<string, number>;
}

/** Un emplacement de l'étal de Jumpy. */
export interface EmplacementEtal {
  categorie: string;
  id: string;
  prix: number;
  stock: number;
  /** « Deux pour le prix d'un » : un achat donne deux exemplaires. */
  deuxPourUn?: boolean;
}

export function creerMonde(): Monde {
  return {
    version: 1, drapeaux: {}, quetes: {}, ressources: {}, decouvertes: [], faitAujourdhui: {}, rencontres: {}, derniereRencontre: null, structures: [], pnjConnus: [],
    coffre: { objets: Array(CASES_COFFRE[0]).fill(null), ressources: {} }, boutique: null, chantier: null, reparation: null, corvees: {},
  };
}

/** Relit un monde enregistré en complétant ce qui manque (sauvegardes plus anciennes). */
export function normaliserMonde(m: Partial<Monde> | null | undefined): Monde {
  const n: Monde = { ...creerMonde(), ...(m ?? {}), version: 1 };
  const c = n.coffre ?? { objets: [], ressources: {} };
  const cases = CASES_COFFRE[niveauEntrepot(n)];
  const objets = Array.isArray(c.objets) ? c.objets.slice(0, Math.max(cases, c.objets.length)) : [];
  while (objets.length < cases) objets.push(null);
  n.coffre = { objets, ressources: { ...(c.ressources ?? {}) } };
  n.corvees = { ...(n.corvees ?? {}) };
  return n;
}

/** Cases du coffre et plafond de chaque ressource stockée, selon le niveau d'entrepôt (0 : le coffre de Maïko). */
export const CASES_COFFRE = [24, 48, 60, 72] as const;
export const PLAFOND_COFFRE = [20, 50, 100, 200] as const;
export function niveauEntrepot(m: Pick<Monde, 'structures'>): 0 | 1 | 2 | 3 {
  const s = m.structures ?? [];
  return s.includes('entrepot_l3') ? 3 : s.includes('entrepot_l2') ? 2 : s.includes('entrepot') ? 1 : 0;
}
export const construit = (m: Pick<Monde, 'structures'>, cle: string) => (m.structures ?? []).includes(cle);

/** Heure absolue de la partie (jour × 24 + heure du jour), l'unité des délais du village (« maintenant » dans les scènes). */
export const heureAbsolue = (e: Pick<Etat, 'jour' | 'minute'>) => e.jour * 24 + Math.floor(e.minute / 60);

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

// —— Village : prospérité et habitants
/** Prospérité qu'apporte un habitant selon son stade (recruitCharacter du prototype). */
export const PROSPERITE_STADE: Record<string, number> = { bebe: 1, enfant: 2, adolescent: 3, adulte: 4, mature: 5 };
export const prosperite = (m: Monde) => Number(m.drapeaux['village.prosperite'] ?? 1) || 1;
/**
 * Un PNJ rejoint le village : la prospérité monte selon son stade, il devient le dernier arrivé.
 * Sans effet s'il l'a déjà rejoint. Renvoie vrai s'il vient d'arriver.
 */
export function recruter(m: Monde, id: string, nom: string, stade: string): boolean {
  const cle = `village.habitant.${id}`;
  if (m.drapeaux[cle]) return false;
  m.drapeaux[cle] = true;
  m.drapeaux['village.prosperite'] = prosperite(m) + (PROSPERITE_STADE[stade] ?? 1);
  m.drapeaux['village.dernier'] = nom;
  connaitrePnj(m, id);
  return true;
}
export const habitant = (m: Monde, id: string) => !!m.drapeaux[`village.habitant.${id}`];

export * from './boutique';
export * from './coffre';
export * from './constructions';
