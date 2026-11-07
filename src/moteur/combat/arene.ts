// Mode Arène (menu principal) : combats libres, configurés de toutes pièces, sans aucune incidence sur les parties.
// Repris du prototype (ARENA_TERRAINS, ARENA_STAGES, ARENA_CARAC_TIERS, arenaEchoOptions, arenaTechniquePool,
// arenaSpriteFor, arenaRollCarac, arenaDefaultCombatant, arenaStartCombat). Sans affichage.
import type { Caracs, CleCarac, Genre, Graine, Lignee, ResultatEvolution, Stade } from '../simulation/types';
import { CLES_CARACS } from '../simulation/constantes';
import { apparence } from '../simulation/evolution';
import type { Aleatoire } from './types';
import type { DescriptionCombattant } from './combat';
import { MAX_TECHNIQUES } from './constantes';
import { poolTechniques, techniquesAdversaire } from './pools';
import { POOL_MEMOIRE } from './donnees/techniques';

/** Stades proposés : les quatre stades de vie, plus les formes fragmentées (un stade à part, qui n'évolue jamais). */
export type StadeArene = Stade | 'fragmentes';
export const STADES_ARENE: { cle: StadeArene; nom: string }[] = [
  { cle: 'bebe', nom: 'Bébé' }, { cle: 'enfant', nom: 'Enfant' }, { cle: 'adolescent', nom: 'Adolescent' },
  { cle: 'adulte', nom: 'Adulte' }, { cle: 'fragmentes', nom: 'Fragmentés' },
];

/** Tranches de puissance des caractéristiques (le prototype affichait aussi les bornes ; ici, seulement le mot). */
export const TRANCHES = [
  { cle: 'faible', nom: 'Faible', min: 30, max: 100 },
  { cle: 'novice', nom: 'Novice', min: 100, max: 200 },
  { cle: 'debutant', nom: 'Débutant', min: 200, max: 300 },
  { cle: 'combattant', nom: 'Combattant', min: 300, max: 450 },
  { cle: 'dur', nom: 'Dur à cuire', min: 450, max: 600 },
  { cle: 'expert', nom: 'Expert', min: 600, max: 750 },
  { cle: 'legende', nom: 'Légende', min: 750, max: 900 },
  { cle: 'divin', nom: 'Divin', min: 900, max: 999 },
] as const;
export type CleTranche = typeof TRANCHES[number]['cle'];
const tranche = (cle: CleTranche) => TRANCHES.find((t) => t.cle === cle) ?? TRANCHES[3];

/** Terrains (décors d'exploration) : les six du prototype. */
export const TERRAINS_ARENE = [
  { id: 1, nom: 'Sortie du village', image: 'decors/exploration/01-sortie-village.png' },
  { id: 7, nom: 'Rivière', image: 'decors/exploration/07-riviere.png' },
  { id: 8, nom: 'Bord du lac', image: 'decors/exploration/08-bord-lac.png' },
  { id: 10, nom: 'Champ de rochers', image: 'decors/exploration/10-champ-rochers.png' },
  { id: 14, nom: 'Falaise embrumée', image: 'decors/exploration/14-falaise-embrumee.png' },
  { id: 17, nom: 'Forêt détruite', image: 'decors/exploration/17-foret-detruite.png' },
] as const;

/** Musiques proposées (public/assets/sons/musiques) ; Free Duel par défaut, comme dans le prototype. */
export const PISTES_ARENE = [
  { cle: 'combat-arena', nom: 'Free Duel' },
  { cle: 'combat', nom: 'Early Game Battle' },
  { cle: 'combat-garry', nom: 'Minor Battle' },
  { cle: 'nyxara-battle', nom: 'Leomon' },
  { cle: 'morthen', nom: 'Dark Reality' },
  { cle: 'glacial-zone', nom: 'Glacial Zone' },
  { cle: 'exploration', nom: 'Misty Trees' },
  { cle: 'legend-alcana', nom: 'Legend of Alcana' },
] as const;

/** Soins d'arène : de 0 à 5 par combat (chacun rend 30 % de la vie, recharge de 8 s). */
export const SOINS_ARENE_MAX = 5;
/** Combattants de chaque côté : de 1 à 3 (l'allié 1 est celui que l'on dirige). */
export const COMBATTANTS_MAX = 3;

/** Une forme d'écho proposée pour un stade. */
export interface FormeArene {
  code: string;
  nom: string;
  genre: 'lignee' | 'branche' | 'branche-adulte' | 'melee' | 'souvenir' | 'fragment';
  graine: Graine;
  lignee: Lignee;
  /** Pour les souvenirs : clé du pool de mémoire et image. */
  souvenir?: { cle: Graine | 'neutral'; image: string };
}

const LIGNEES: [string, Graine, Lignee, string][] = [
  ['J', 'joy', 'primaire', 'Joy'], ['DJ', 'joy', 'sombre', 'Dark Joy'],
  ['W', 'wrath', 'primaire', 'Wrath'], ['DW', 'wrath', 'sombre', 'Dark Wrath'],
  ['F', 'fear', 'primaire', 'Fear'], ['DF', 'fear', 'sombre', 'Dark Fear'],
  ['S', 'sorrow', 'primaire', 'Sorrow'], ['DS', 'sorrow', 'sombre', 'Dark Sorrow'],
  ['D', 'disgust', 'primaire', 'Disgust'], ['DD', 'disgust', 'sombre', 'Dark Disgust'],
  ['N', 'joy', 'neutre', 'Neutre'], ['DN', 'joy', 'neutre-sombre', 'Dark Neutre'],
];
const BRANCHES: [string, Graine, string][] = [
  ['S-DF', 'sorrow', 'Sorrow / Dark Fear'], ['J-DD', 'joy', 'Joy / Dark Disgust'], ['F-DW', 'fear', 'Fear / Dark Wrath'],
  ['W-DJ', 'wrath', 'Wrath / Dark Joy'], ['D-DS', 'disgust', 'Disgust / Dark Sorrow'], ['J-DS', 'joy', 'Joy / Dark Sorrow'],
  ['W-DD', 'wrath', 'Wrath / Dark Disgust'], ['F-DJ', 'fear', 'Fear / Dark Joy'], ['S-DW', 'sorrow', 'Sorrow / Dark Wrath'],
  ['D-DF', 'disgust', 'Disgust / Dark Fear'], ['N-DN', 'joy', 'Neutre'],
];
const MELEES = ['JWF', 'WFS', 'FSD', 'SDJ', 'DJW', 'JFD', 'JFS', 'JWS', 'WFD', 'WSD'];
const SOUVENIRS: [string, Graine | 'neutral', string, string][] = [
  ['J-VENT', 'joy', 'Souvenir du Vent', 'memoire-j-vent'], ['W-FEU', 'wrath', 'Souvenir du Feu', 'memoire-w-feu'],
  ['F-FOUDRE', 'fear', 'Souvenir de la Foudre', 'memoire-f-foudre'], ['S-EAU', 'sorrow', 'Souvenir de l’Eau', 'memoire-s-eau'],
  ['D-TERRE', 'disgust', 'Souvenir de la Terre', 'memoire-d-terre'], ['N-ETHER', 'neutral', 'Souvenir de l’Éther', 'memoire-n-ether'],
];
const FRAGMENTS: [string, string][] = [['PM+', 'Psychomoteur+'], ['C+', 'Cognitif+'], ['SA+', 'Sensori-affectif+']];

/** Les formes proposées pour un stade (lignées, puis branches à l'adolescence, mêlées et souvenirs à l'âge adulte). */
export function formesArene(stade: StadeArene): FormeArene[] {
  if (stade === 'fragmentes') return FRAGMENTS.map(([code, nom]) => ({ code, nom, genre: 'fragment', graine: 'joy', lignee: 'primaire' }));
  const base: FormeArene[] = LIGNEES.map(([code, graine, lignee, nom]) => ({ code, nom, genre: 'lignee', graine, lignee }));
  if (stade === 'adolescent' || stade === 'adulte') {
    const g = stade === 'adulte' ? 'branche-adulte' : 'branche';
    base.push(...BRANCHES.map(([code, graine, nom]): FormeArene => ({ code, nom: 'Branche ' + nom, genre: g, graine, lignee: 'primaire' })));
  }
  if (stade === 'adulte') {
    base.push(...MELEES.map((code): FormeArene => ({ code, nom: 'Mêlé ' + code, genre: 'melee', graine: 'joy', lignee: 'primaire' })));
    base.push(...SOUVENIRS.map(([code, cle, nom, image]): FormeArene => ({
      code, nom, genre: 'souvenir', graine: cle === 'neutral' ? 'joy' : cle, lignee: cle === 'neutral' ? 'neutre' : 'primaire',
      souvenir: { cle, image: `echos/adulte/${image}.png` },
    })));
  }
  return base;
}

export const formeArene = (stade: StadeArene, code: string) => {
  const l = formesArene(stade);
  return l.find((f) => f.code === code) ?? l[0];
};

/** Stade de vie du combattant (un fragmenté se bat comme un adolescent). */
export const stadeDeVie = (s: StadeArene): Stade => (s === 'fragmentes' ? 'adolescent' : s);

function evolutionDe(f: FormeArene): ResultatEvolution | null {
  if (f.genre === 'fragment') return { genre: 'fragment', code: f.code as 'C+' | 'SA+' | 'PM+' };
  if (f.genre === 'branche' || f.genre === 'branche-adulte' || f.genre === 'melee') return { genre: f.genre, code: f.code };
  return null;
}

/** Techniques que la forme peut équiper (aucune pour un bébé ; pools adultes propres, comme le mode Arène du prototype). */
export function poolArene(stade: StadeArene, f: FormeArene): string[] {
  if (stade === 'bebe') return [];
  if (f.souvenir) return POOL_MEMOIRE[f.souvenir.cle] ?? [];
  return poolTechniques({ stade: stadeDeVie(stade), graine: f.graine, lignee: f.lignee, evolution: evolutionDe(f) }, { poolsAdultes: true });
}

/** Image de la forme (chemin dans public/assets). */
export function imageArene(stade: StadeArene, f: FormeArene, genre: Genre): string {
  if (f.souvenir) return f.souvenir.image;
  return apparence({ stade: stadeDeVie(stade), graine: f.graine, lignee: f.lignee, genre, evolution: evolutionDe(f) });
}

/** Caractéristiques : une tranche pour toutes (chacune tirée à part dans la tranche), ou une tranche par caractéristique. */
export type ReglageCaracs = { mode: 'tranche'; tranche: CleTranche } | { mode: 'detail'; tranches: Record<CleCarac, CleTranche> };

export function tirerCaracs(r: ReglageCaracs, rng: Aleatoire): Caracs {
  const c = {} as Caracs;
  for (const k of CLES_CARACS) {
    const t = tranche(r.mode === 'tranche' ? r.tranche : r.tranches[k]);
    c[k] = Math.round(t.min + rng() * (t.max - t.min));
  }
  return c;
}

/** Un combattant tel qu'on le règle dans l'arène. */
export interface ConfigArene {
  camp: 'allies' | 'adversaires';
  rang: number;
  nom: string;
  genre: Genre;
  stade: StadeArene;
  forme: string;
  /** Techniques équipées (trois au plus, prises dans le pool de la forme). */
  techniques: string[];
  caracs: ReglageCaracs;
  /** Allié 1 seulement : l'écho de la dernière partie, tel qu'il est (une copie : la partie n'en sait rien). */
  votreEcho?: boolean;
}

export function combattantParDefaut(camp: ConfigArene['camp'], rang: number): ConfigArene {
  return {
    camp, rang, nom: camp === 'allies' ? `Allié ${rang + 1}` : `Adversaire ${rang + 1}`, genre: 'm',
    stade: 'adolescent', forme: camp === 'allies' ? 'J' : 'W', techniques: [], caracs: { mode: 'tranche', tranche: 'combattant' },
  };
}

/** Changer de stade ramène à la première forme et vide les techniques (comme le prototype). */
export function changerStade(c: ConfigArene, stade: StadeArene): ConfigArene {
  return { ...c, stade, forme: formesArene(stade)[0].code, techniques: [] };
}
export function changerForme(c: ConfigArene, forme: string): ConfigArene {
  return { ...c, forme, techniques: [] };
}
/** Coche ou décoche une technique (trois au plus). */
export function basculerTechnique(c: ConfigArene, nom: string): ConfigArene {
  if (c.techniques.includes(nom)) return { ...c, techniques: c.techniques.filter((n) => n !== nom) };
  if (c.techniques.length >= MAX_TECHNIQUES || !poolArene(c.stade, formeArene(c.stade, c.forme)).includes(nom)) return c;
  return { ...c, techniques: [...c.techniques, nom] };
}
/** Trois techniques au hasard dans le pool (deux pour un enfant). */
export function techniquesAuHasard(c: ConfigArene, rng: Aleatoire): ConfigArene {
  return { ...c, techniques: techniquesAdversaire(poolArene(c.stade, formeArene(c.stade, c.forme)), stadeDeVie(c.stade), rng) };
}

/** Nombre de combattants d'un camp : la liste est complétée ou raccourcie, les réglages déjà faits sont gardés. */
export function ajusterCamp(liste: ConfigArene[], camp: ConfigArene['camp'], n: number): ConfigArene[] {
  const nb = Math.max(1, Math.min(COMBATTANTS_MAX, n));
  const autres = liste.filter((c) => c.camp !== camp);
  const ceux = liste.filter((c) => c.camp === camp).sort((a, b) => a.rang - b.rang);
  const suite = Array.from({ length: nb }, (_, i) => ceux[i] ?? combattantParDefaut(camp, i));
  return camp === 'allies' ? [...suite, ...autres] : [...autres, ...suite];
}

/** Ce qu'il faut à l'écran de combat : la description du combattant, et son image. */
export interface CombattantArene { description: DescriptionCombattant; image: string }

/** Prépare un combattant (caractéristiques tirées au moment du lancement, techniques filtrées par son pool). */
export function preparerCombattant(c: ConfigArene, rng: Aleatoire): CombattantArene {
  const f = formeArene(c.stade, c.forme);
  const stade = stadeDeVie(c.stade);
  const pool = poolArene(c.stade, f);
  return {
    description: {
      nom: c.nom.trim() || (c.camp === 'allies' ? `Allié ${c.rang + 1}` : `Adversaire ${c.rang + 1}`),
      genre: c.genre, graine: f.graine, lignee: f.lignee, stade, evolution: evolutionDe(f),
      caracs: tirerCaracs(c.caracs, rng),
      techniques: stade === 'bebe' ? [] : c.techniques.filter((n) => pool.includes(n)).slice(0, MAX_TECHNIQUES),
    },
    image: imageArene(c.stade, f, c.genre),
  };
}

/** Issue d'un combat d'arène, pour le bandeau au retour : victoire, défaite, ou combat arrêté. */
export type IssueArene = 'victoire' | 'defaite' | 'arrete';
export const TEXTE_ISSUE: Record<IssueArene, string> = {
  victoire: 'Victoire : vos alliés restent maîtres de l’arène.',
  defaite: 'Défaite : vos alliés sont tous à terre.',
  arrete: 'Combat arrêté : ni vainqueur ni vaincu.',
};
