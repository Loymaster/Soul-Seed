// Relations avec les PNJ (les échos du village et des environs), sans affichage.
// Au début d'une partie, on ne connaît que Myhra et Jumpy ; les autres s'ajoutent quand on les rencontre
// (un drapeau de leurs scènes, leur arrivée au village ou `monde.pnjConnus`).
// La relation se lit en mots, jamais en chiffres. Elle est faite de deux parts :
//   - `monde.relationsPnj[id]` : ce que le jeu ajoute (services rendus, cadeaux… à développer) ;
//   - le drapeau `<prefixe>.relation` que les scènes peuvent déjà faire varier (« garry.relation -= 1 »).
// Plus tard, un PNJ demandera des services de temps à autre (`DemandePnj`) ; les rendre améliorera la relation.
import type { Monde } from './index';

type MondeRelations = Pick<Monde, 'drapeaux' | 'pnjConnus'> & Partial<Pick<Monde, 'relationsPnj'>>;

export interface PnjRelation {
  id: string;
  nom: string;
  /** Qui il est, en quelques mots (sous son nom dans le carnet). */
  role: string;
  /** Préfixe de ses drapeaux dans les scènes (« ladyroger » pour Lady Roger). */
  prefixes: string[];
  /** Connu dès le début de la partie. */
  connuDesLeDebut?: boolean;
  /** Point de départ de la relation (Myhra et Jumpy vous ont accueilli). */
  depart?: number;
  /** Ce qu'on en sait avant de le rencontrer (« À rencontrer »). */
  indice?: string;
  /** Portrait rond du carnet (public/assets) ; sinon son image neutre, cadrée sur le visage. */
  portrait?: string;
}

/** Ordre d'apparition dans le carnet : à peu près celui des rencontres. */
export const PNJ_RELATIONS: PnjRelation[] = [
  { id: 'myhra', nom: 'Myhra', role: 'gardienne du sanctuaire', prefixes: ['myhra'], connuDesLeDebut: true, depart: 4, portrait: 'pnj/myhra/portrait-relations.png' },
  { id: 'jumpy', nom: 'Jumpy', role: 'tient le magasin', prefixes: ['jumpy'], connuDesLeDebut: true, depart: 4, portrait: 'pnj/jumpy/face.png' },
  { id: 'garry', nom: 'Garry', role: 'tenait le restaurant du village', prefixes: ['garry'], indice: 'des grondements, du côté de la forêt détruite', portrait: 'pnj/garry/portrait-relations.png' },
  { id: 'karla', nom: 'Karla', role: 'une villageoise méfiante', prefixes: ['karla'], indice: 'quelqu’un vous observe dans la forêt du village', portrait: 'pnj/karla/portrait-relations.png' },
  { id: 'maiko', nom: 'Maïko', role: 'garde le coffre', prefixes: ['maiko'], indice: 'un petit ventre gargouille près de la forêt', portrait: 'pnj/maiko/portrait-relations.png' },
  { id: 'lady-roger', nom: 'Lady Roger', role: 'commerçante du village', prefixes: ['ladyroger'], indice: 'une silhouette rose se promène au village', portrait: 'pnj/lady-roger/portrait-relations.png' },
  { id: 'tourby', nom: 'Tourby', role: 'jardinier du potager', prefixes: ['tourby'], indice: 'quelqu’un appelle à l’aide près de la rivière', portrait: 'pnj/tourby/portrait-relations.png' },
  { id: 'bourbella', nom: 'Bourbella', role: 'pêcheuse', prefixes: ['bourbella'], indice: 'une cabane, au bord de l’eau', portrait: 'pnj/bourbella/portrait-relations.png' },
  { id: 'ash', nom: 'Ash', role: 'bâtisseur', prefixes: ['ash'], indice: 'des jurons résonnent près de la caverne', portrait: 'pnj/ash/portrait-relations.png' },
  { id: 'phil', nom: 'Phil', role: 'squatte une cabane avec Hibert', prefixes: ['philhibert'] },
  { id: 'hibert', nom: 'Hibert', role: 'squatte une cabane avec Phil', prefixes: ['philhibert'] },
  { id: 'hevann', nom: 'Hevann', role: 'entraîneur au sanctuaire', prefixes: ['hevann'], indice: 'quelqu’un garde le chemin de la forêt', portrait: 'pnj/hevann/portrait-relations.png' },
  { id: 'glamp', nom: 'Glamp', role: 'artisane de l’atelier', prefixes: ['glamp'] },
  { id: 'grimp', nom: 'Grimp', role: 'cherchait son amie Glamp', prefixes: ['grimp'] },
  { id: 'morthen', nom: 'Morthen', role: 'un voyageur de passage', prefixes: ['morthen'] },
  { id: 'nyxara', nom: 'Nyxara', role: 'une ombre menaçante', prefixes: ['nyxara'] },
  { id: 'finn', nom: 'Finn', role: 'éclaireur', prefixes: ['finn', 'nyxara'] },
  { id: 'vinland', nom: 'Vinland', role: 's’est interposé face à Nyxara', prefixes: ['nyxara'] },
];

export const pnjRelation = (id: string) => PNJ_RELATIONS.find((p) => p.id === id);

/** A-t-on déjà rencontré ce PNJ ? (dès le début pour Myhra et Jumpy) */
export function pnjConnu(m: MondeRelations, p: PnjRelation): boolean {
  if (p.connuDesLeDebut) return true;
  if ((m.pnjConnus ?? []).includes(p.id) || m.drapeaux[`village.habitant.${p.id}`]) return true;
  return Object.keys(m.drapeaux).some((k) => p.prefixes.some((x) => k.startsWith(x + '.')) && m.drapeaux[k] !== false);
}

/** Paliers de relation avec un PNJ, du plus froid au plus chaleureux (seuils sur la somme cachée). */
export type PalierPnj = 'rancune' | 'mefiance' | 'connaissance' | 'sympathie' | 'confiance' | 'amitie' | 'lien';
const SEUILS: [PalierPnj, number][] = [['lien', 25], ['amitie', 15], ['confiance', 8], ['sympathie', 3], ['connaissance', 0], ['mefiance', -3]];
export const MOT_PALIER_PNJ: Record<PalierPnj, string> = {
  rancune: 'de la rancune', mefiance: 'de la méfiance', connaissance: 'on se connaît à peine', sympathie: 'de la sympathie',
  confiance: 'une vraie confiance', amitie: 'une belle amitié', lien: 'un lien profond',
};
export const ENCRE_PALIER_PNJ: Record<PalierPnj, string> = {
  rancune: '#9c3b2a', mefiance: '#a0602a', connaissance: '#7a6650', sympathie: '#566b3a', confiance: '#3f7a3a', amitie: '#2f6a5a', lien: '#2f5a7a',
};
export const RANG_PALIER_PNJ: PalierPnj[] = ['rancune', 'mefiance', 'connaissance', 'sympathie', 'confiance', 'amitie', 'lien'];

/** La somme cachée de la relation (jamais montrée au joueur). */
export function pointsRelation(m: MondeRelations, p: PnjRelation): number {
  const scene = p.prefixes.reduce((a, x) => a + (Number(m.drapeaux[`${x}.relation`] ?? 0) || 0), 0);
  return (p.depart ?? 0) + (m.relationsPnj?.[p.id] ?? 0) + scene;
}
export function palierPnj(m: MondeRelations, p: PnjRelation): PalierPnj {
  const n = pointsRelation(m, p);
  for (const [k, s] of SEUILS) if (n >= s) return k;
  return 'rancune';
}

/** Améliore (ou abîme) la relation : un service rendu, un cadeau… Renvoie le palier atteint et s'il a changé. */
export function changerRelationPnj(m: Monde, id: string, delta: number): { palier: PalierPnj; change: boolean } | null {
  const p = pnjRelation(id);
  if (!p) return null;
  const avant = palierPnj(m, p);
  m.relationsPnj = { ...(m.relationsPnj ?? {}), [id]: (m.relationsPnj?.[id] ?? 0) + delta };
  const apres = palierPnj(m, p);
  return { palier: apres, change: apres !== avant };
}

/** Un service qu'un PNJ demandera au joueur (à développer : objet à rapporter, écho à aider…). */
export interface DemandePnj { pnj: string; cle: string; texte: string; recompense?: number }

export interface RelationLue { id: string; nom: string; role: string; portrait?: string; palier: PalierPnj; mot: string; encre: string; habitant: boolean }

/** Les PNJ connus, dans l'ordre du carnet, et quelques indices sur ceux qu'on n'a pas encore rencontrés. */
export function lireRelationsPnj(m: MondeRelations | null | undefined): { connus: RelationLue[]; aRencontrer: string[] } {
  const monde: MondeRelations = m ?? { drapeaux: {}, pnjConnus: [] };
  const connus = PNJ_RELATIONS.filter((p) => pnjConnu(monde, p)).map((p) => {
    const palier = palierPnj(monde, p);
    return { id: p.id, nom: p.nom, role: p.role, portrait: p.portrait, palier, mot: MOT_PALIER_PNJ[palier], encre: ENCRE_PALIER_PNJ[palier], habitant: !!monde.drapeaux[`village.habitant.${p.id}`] };
  });
  const aRencontrer = PNJ_RELATIONS.filter((p) => p.indice && !pnjConnu(monde, p)).map((p) => p.indice!);
  return { connus, aRencontrer };
}
