// Modèle du moteur de combat (repris du prototype : buildCombatant, combatTick, resolveAttack…).
// Comme la simulation, rien ici ne s'affiche : l'écran lit l'état et les événements émis.
// Le joueur ne voit jamais ces nombres : ni PV chiffrés, ni pourcentages (voir signes.ts).

import type { Caracs, Genre, Graine, Lignee, ResultatEvolution, Stade } from '../simulation/types';

export type Camp = 'allies' | 'adversaires';

export type CategorieTechnique =
  | 'physique' | 'spectral' | 'poison' | 'aquatique' | 'incendiaire' | 'malefique' | 'lumineux' | 'ethere';
/** Rôle caché, pour l'IA : prévention (tôt, vie haute), défense (vie basse), agression (achever). */
export type RoleTechnique = 'prevention' | 'defense' | 'agression';

export type StatutNegatif = 'saignement' | 'empoisonnement' | 'terreur' | 'brulure' | 'ralentissement' | 'etourdissement';
export type StatutPositif = 'protection' | 'rapidite' | 'regeneration' | 'immunite' | 'renvoiDegats';
export type Statut = StatutNegatif | StatutPositif;
/** Effets ponctuels qui ne sont pas des statuts : dissipation des effets positifs, offrande, purification. */
export type EffetPonctuel = 'annulation' | 'offrande' | 'purification';

export interface EffetTechnique {
  statut: Statut | EffetPonctuel;
  /** Probabilité (1 si absente). */
  chance?: number;
  /** Durée en secondes (statuts à durée réglable). */
  duree?: number;
  /** Brûlure : nombre de cumuls. */
  cumuls?: number;
  /** Régénération : part des PV max rendue sur la durée. */
  soin?: number;
  /** Renvoi de dégâts : part renvoyée. */
  part?: number;
  poisonRiposte?: number;
  brulureRiposte?: number;
  /** Cible de l'effet ; absente : la cible touchée. */
  cible?: 'soi' | 'adversaire';
}

export interface FicheTechnique {
  categorie: CategorieTechnique;
  role: RoleTechnique;
  description: string;
  /** Part de la résistance adverse ignorée. */
  percage?: number;
  auToucher?: EffetTechnique[];
  aLancer?: EffetTechnique[];
  sansDegats?: boolean;
  distance?: boolean;
  zone?: boolean;
  /** Brûlures en chaîne : `base` cumuls, puis un cumul de plus à chaque réussite successive. */
  chaineBrulure?: { base: number; chances: number[] };
  volDeVie?: number;
  /** Part de la vie restante que le lanceur sacrifie. */
  coutVie?: number;
  rebond?: boolean;
}

type Duree = { fin: number };
/** Statuts actifs d'un combattant (heures en ms d'horloge de combat). */
export interface Statuts {
  saignement?: Duree;
  /** Dure jusqu'à ce qu'un jet de robustesse réussisse (un par seconde après 10 s). */
  empoisonnement?: { pose: number; prochainJet: number };
  terreur?: Duree;
  /** Se cumule ; le prochain coup reçu est amplifié et consume la brûlure. */
  brulure?: { cumuls: number; depuis: number; prochainJet: number };
  ralentissement?: Duree;
  etourdissement?: Duree;
  protection?: Duree;
  rapidite?: Duree;
  regeneration?: { debut: number; fin: number; dernier: number; total: number };
  immunite?: Duree;
  renvoiDegats?: { fin: number; part: number; poisonRiposte?: number; brulureRiposte?: number };
}

export type Deplacement = 'attente' | 'approche' | 'attaque' | 'recul' | 'fuite';

export type Ordre = 'attaque' | 'fuit' | 'protege' | 'distance';

/** Ce qui, dans le lien avec le joueur et l'état émotionnel, colore le combat de l'écho (allié). */
export interface Dispositions {
  attachement: number;
  affection: number;
  humeur: number;
  colere: number;
  peur: number;
  autonomie: number;
}

export interface Bonus {
  caracs: (keyof Caracs)[];
  part: number;
  fin: number;
}

export interface Combattant {
  id: string;
  camp: Camp;
  nom: string;
  genre: Genre;
  graine: Graine;
  lignee: Lignee;
  stade: Stade;
  evolution: ResultatEvolution | null;
  ageJours: number | null;
  caracs: Caracs;
  pv: number;
  pvMax: number;
  /** Jauge d'action (0–1) : pleine, l'écho part à l'attaque. */
  jauge: number;
  ko: boolean;
  /** Position dans l'arène, en % (x : gauche → droite ; y : fond → premier plan). */
  x: number;
  y: number;
  departX: number;
  departY: number;
  /** 1 : regarde à droite, -1 : à gauche. */
  regard: 1 | -1;
  deplacement: Deplacement;
  depuis: number;
  cible: string | null;
  cibleVerrouillee: string | null;
  prochainPas: number;
  debutAttaque: number;
  decalageApproche: number;
  reculX: number;
  reculY: number;
  fuiteX: number;
  fuiteY: number;
  finFuite: number;
  prochainCoupDOeil: number;
  reactionA: number;
  // Bords de l'arène : poussée vers le centre, et urgence si l'écho reste coincé.
  pousseeJusqua: number;
  pousseeDx: number;
  pousseeDy: number;
  auBordDepuis: number;
  // Réactions aux coups (l'affichage s'en sert aussi).
  sonneJusqua: number;
  insensibleJusqua: number;
  touche: number;
  esquiveJusqua: number;
  esquiveSens: 1 | -1;
  paradeJusqua: number;
  frappeJusqua: number;
  /** Jusqu'à quand la jauge de vie reste visible après un coup ou un soin. */
  vieVisibleJusqua: number;
  techniques: string[];
  techniqueEnCours: string | null;
  techniqueForcee: string | null;
  /** Vient d'utiliser une technique sans dégât : la suivante doit frapper. */
  doitFrapper: boolean;
  statuts: Statuts;
  bonus: Bonus[];
  ordre: { type: Ordre; fin: number } | null;
  /** Régénération donnée par un objet (indépendante des statuts). */
  soinObjet: { debut: number; fin: number; dernier: number; total: number } | null;
  dispositions: Dispositions | null;
  /** Taille relative (individu), pour l'affichage. */
  taille: number;
}

export type Resultat = 'victoire' | 'defaite' | 'fuite';

export interface TirEnVol {
  id: number;
  lanceur: string;
  cible: string;
  technique: string;
  depart: number;
  arrivee: number;
  deX: number;
  deY: number;
  versX: number;
  versY: number;
}

export interface Incantation {
  id: number;
  lanceur: string;
  cible: string | null;
  fin: number;
}

export interface EtatCombat {
  /** Horloge du combat, en ms depuis le début. */
  t: number;
  allies: Combattant[];
  adversaires: Combattant[];
  resultat: Resultat | null;
  tirs: TirEnVol[];
  incantations: Incantation[];
  /** Fin de recharge par ordre (`encourager`, `attaque`, `technique:<nom>`, `soin`, `fuirCombat`…). */
  recharges: Record<string, number>;
  /** Intelligence qui débloque les ordres (celle de l'écho, hors maladie). */
  intelligenceOrdres: number;
  /** Soins d'arène restants (mode Arène). */
  soinsArene: number;
  prochainId: number;
}

export type EvenementCombat =
  | { type: 'coup'; lanceur: string; cible: string; degats: number; critique: boolean; pare: boolean; technique: string | null }
  | { type: 'esquive'; lanceur: string; cible: string; technique: string | null }
  | { type: 'technique'; lanceur: string; technique: string }
  | { type: 'tir'; tir: TirEnVol }
  | { type: 'statut'; cible: string; statut: Statut | EffetPonctuel }
  | { type: 'soin'; cible: string }
  | { type: 'ko'; cible: string }
  | { type: 'fin'; resultat: Resultat };

export type Aleatoire = () => number;
