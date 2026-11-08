// Quêtes du carnet : ce qui est attendu du joueur, sans affichage.
// Chaque quête est une suite d'étapes dont l'achèvement se lit dans le monde (drapeaux posés par les scènes,
// constructions, lieux découverts) : rien à cocher à la main, le carnet se met à jour tout seul.
// Une étape est faite si elle-même ou une étape suivante l'est (on ne revient pas en arrière).
// Le suivi est noté dans `monde.quetes` (identifiant → étape courante, « fini ») par `synchroniserQuetes`.
import { BATIMENTS_VILLAGE } from './constructions';
import { prosperite, type Monde } from './index';

type MondeQuetes = Pick<Monde, 'drapeaux' | 'structures' | 'decouvertes'> & Partial<Pick<Monde, 'boutique' | 'quetes'>>;

export interface EtapeQuete {
  id: string;
  /** Ce qu'il faut faire, à l'infinitif ou presque (« Rendre visite à Myhra au sanctuaire »). */
  texte: string;
  /** Un indice pour la trouver, montré tant que l'étape est en cours. */
  piste?: string;
  faite: (m: MondeQuetes) => boolean;
}

export interface DefinitionQuete {
  id: string;
  titre: string;
  /** Une ou deux phrases : pourquoi cette quête. */
  resume: string;
  /** Quête majeure (le fil de la partie). */
  majeure?: boolean;
  /** Mention « difficile » dans le carnet. */
  difficile?: boolean;
  /** La quête apparaît dans le carnet (par défaut : dès le début). */
  visible?: (m: MondeQuetes) => boolean;
  etapes: EtapeQuete[];
}

const d = (m: MondeQuetes, cle: string) => !!m.drapeaux[cle];
/** Drapeau posé, même à 0 (« travail.jour = jour » le premier jour). */
const pose = (m: MondeQuetes, cle: string) => m.drapeaux[cle] !== undefined && m.drapeaux[cle] !== false;
const bati = (m: MondeQuetes, cle: string) => (m.structures ?? []).includes(cle);
/** Zone d'exploration de la forêt détruite, où Garry s'est terré. */
export const ZONE_GARRY = 17;

/** Bâtiments à relever pour rebâtir le village (ceux d'Ash et ceux payés en or). */
export const BATIMENTS_A_REBATIR = ['atelier', ...BATIMENTS_VILLAGE.map((b) => b.cle)];
export const batimentsReleves = (m: MondeQuetes) => BATIMENTS_A_REBATIR.filter((k) => bati(m, k)).length;

/** Paliers de prospérité, les mêmes que les mots de Myhra (« au début », « reprend forme », « s'agrandit », « magnifique »). */
export const PALIERS_PROSPERITE = [15, 30, 45] as const;

export const QUETES: DefinitionQuete[] = [
  {
    id: 'myhra-village',
    titre: 'Ce qui est arrivé au village',
    resume: 'Myhra veille sur le sanctuaire. Elle saura vous dire ce que le village est devenu, et ce qu’on peut faire pour lui.',
    majeure: true,
    etapes: [
      { id: 'voir', texte: 'Rendre visite à Myhra au sanctuaire', piste: 'le sanctuaire est à l’ouest du village', faite: (m) => d(m, 'myhra.vue') },
      { id: 'village', texte: 'Lui demander des nouvelles du village', piste: 'la prospérité du village', faite: (m) => d(m, 'myhra.village') },
    ],
  },
  {
    id: 'jumpy-argent',
    titre: 'Gagner sa vie',
    resume: 'Nourrir un écho, le soigner, l’équiper : tout a un prix. Jumpy a peut-être du travail pour vous.',
    etapes: [
      { id: 'boutique', texte: 'Passer voir Jumpy à son magasin', piste: 'le poteau du ranch mène au magasin', faite: (m) => d(m, 'jumpy.vu') || !!m.boutique },
      { id: 'emploi', texte: 'Lui demander comment gagner de l’argent', faite: (m) => d(m, 'metier.assistant') },
      { id: 'travail', texte: 'Travailler une première fois à la boutique', piste: 'de 8 h à 14 h, une fois par jour', faite: (m) => pose(m, 'travail.jour') },
    ],
  },
  {
    id: 'garry',
    titre: 'La colère de Garry',
    resume: 'Avant de partir, Garry a ravagé le village, puis s’est terré dans une forêt non loin. Il faudra un écho solide pour le ramener à la raison.',
    difficile: true,
    etapes: [
      { id: 'trouver', texte: 'Trouver la forêt où Garry s’est terré', piste: 'en explorant au-delà de la sortie du village', faite: (m) => (m.decouvertes ?? []).includes(ZONE_GARRY) },
      { id: 'vaincre', texte: 'Vaincre Garry', piste: 'mieux vaut un écho bien entraîné', faite: (m) => d(m, 'garry.vaincu') },
    ],
  },
  {
    id: 'prosperite',
    titre: 'Augmenter la prospérité du village',
    resume: 'Les habitants ont perdu la mémoire et se sont dispersés dans la nature. Chaque écho qui revient au village lui rend un peu de vie.',
    majeure: true,
    visible: (m) => d(m, 'myhra.village'),
    etapes: [
      { id: 'habitant', texte: 'Ramener un premier habitant au village', piste: 'certains échos égarés n’attendent qu’un coup de main', faite: (m) => !!m.drapeaux['village.dernier'] },
      { id: 'forme', texte: 'Que le village reprenne forme', faite: (m) => prosperite(m as Monde) > PALIERS_PROSPERITE[0] },
      { id: 'agrandir', texte: 'Que le village s’agrandisse', faite: (m) => prosperite(m as Monde) > PALIERS_PROSPERITE[1] },
      { id: 'splendeur', texte: 'Rendre au village sa splendeur d’antan', piste: 'Myhra vous dira où vous en êtes', faite: (m) => prosperite(m as Monde) > PALIERS_PROSPERITE[2] },
    ],
  },
  {
    id: 'rebatir',
    titre: 'Rebâtir le village',
    resume: 'Il ne reste du village que des ruines. Il faudra des bras, des matériaux, et quelqu’un qui sache construire.',
    majeure: true,
    visible: (m) => d(m, 'myhra.village'),
    etapes: [
      { id: 'batisseur', texte: 'Trouver quelqu’un qui sache construire', piste: 'quelqu’un pousse des jurons près de la caverne', faite: (m) => d(m, 'ash.recrute') },
      { id: 'atelier', texte: 'Construire l’atelier', piste: 'Ash a besoin de bois, de pierre, de fibres et de résine', faite: (m) => bati(m, 'atelier') },
      { id: 'centre', texte: 'Relever le centre communautaire', faite: (m) => bati(m, 'centre_communautaire') },
      { id: 'fin', texte: 'Achever le nettoyage final', piste: 'quand tous les bâtiments seront debout', faite: (m) => bati(m, 'nettoyage_final') },
    ],
  },
];

export interface EtapeLue { id: string; texte: string; piste?: string; faite: boolean; courante: boolean }
export interface QueteLue {
  id: string; titre: string; resume: string; majeure: boolean; difficile: boolean; terminee: boolean;
  /** Les étapes faites et l'étape en cours ; les suivantes restent à découvrir. */
  etapes: EtapeLue[];
  /** Étapes encore cachées après l'étape courante. */
  restantes: number;
}

/** L'état de chaque étape (faite si elle ou une suivante l'est). */
function faites(q: DefinitionQuete, m: MondeQuetes): boolean[] {
  const brut = q.etapes.map((e) => e.faite(m));
  return brut.map((_, i) => brut.slice(i).some(Boolean));
}

export function lireQuete(q: DefinitionQuete, m: MondeQuetes): QueteLue {
  const f = faites(q, m);
  const courante = f.indexOf(false);
  const terminee = courante < 0;
  const jusqua = terminee ? q.etapes.length : courante + 1;
  return {
    id: q.id, titre: q.titre, resume: q.resume, majeure: !!q.majeure, difficile: !!q.difficile, terminee,
    etapes: q.etapes.slice(0, jusqua).map((e, i) => ({ id: e.id, texte: e.texte, piste: e.piste, faite: f[i], courante: i === courante })),
    restantes: q.etapes.length - jusqua,
  };
}

/** Les quêtes visibles : en cours (les majeures d'abord), puis terminées. */
export function lireQuetes(m: MondeQuetes | null | undefined): { enCours: QueteLue[]; terminees: QueteLue[] } {
  const monde: MondeQuetes = m ?? { drapeaux: {}, structures: [], decouvertes: [] };
  const lues = QUETES.filter((q) => !q.visible || q.visible(monde)).map((q) => lireQuete(q, monde));
  return {
    enCours: lues.filter((q) => !q.terminee).sort((a, b) => Number(b.majeure) - Number(a.majeure)),
    terminees: lues.filter((q) => q.terminee),
  };
}

/**
 * Note l'étape courante de chaque quête visible dans `monde.quetes` (« fini » quand elle est achevée).
 * Renvoie les quêtes qui viennent d'apparaître et celles qui viennent de s'achever.
 */
export function synchroniserQuetes(m: Monde): { nouvelles: string[]; finies: string[] } {
  const nouvelles: string[] = [], finies: string[] = [];
  for (const q of QUETES) {
    if (q.visible && !q.visible(m)) continue;
    const l = lireQuete(q, m);
    const etape = l.terminee ? 'fini' : l.etapes[l.etapes.length - 1].id;
    const avant = m.quetes[q.id];
    if (avant === etape) continue;
    if (avant === undefined) nouvelles.push(q.id);
    if (etape === 'fini' && avant !== 'fini') finies.push(q.id);
    m.quetes[q.id] = etape;
  }
  return { nouvelles, finies };
}
