// L'arbre des échos (Mémoire du carnet) : toutes les formes de l'écho jouable, lignée par lignée,
// d'après les règles d'évolution (src/moteur/simulation/evolution.ts) et les images de public/assets/echos/.
// Sans affichage : PagesMemoire.tsx le dessine. Une forme est « révélée » quand le profil l'a déjà vue
// (mémoire des échos, chemins d'apparence comme « echos/adolescent/joy-f.png »).
import type { Graine } from '@/moteur/simulation';
import { TRIADES_MELEES } from '@/moteur/simulation/constantes';

export type IdLignee = Graine | 'neutre';
export const LIGNEES: { id: IdLignee; nom: string; graine: string }[] = [
  { id: 'joy', nom: 'Solaire', graine: 'Graine solaire' },
  { id: 'wrath', nom: 'Tellurique', graine: 'Graine tellurique' },
  { id: 'disgust', nom: 'Caustique', graine: 'Graine caustique' },
  { id: 'sorrow', nom: 'Boréale', graine: 'Graine boréale' },
  { id: 'fear', nom: 'Spectrale', graine: 'Graine spectrale' },
  { id: 'neutre', nom: 'Neutre', graine: 'Toutes les graines' },
];
const NOM_LIGNEE = Object.fromEntries(LIGNEES.map((l) => [l.id, l.nom.toLowerCase()])) as Record<IdLignee, string>;
const LETTRE: Record<string, IdLignee> = { J: 'joy', W: 'wrath', F: 'fear', S: 'sorrow', D: 'disgust', N: 'neutre' };

/** Une case de l'arbre : une forme (deux images quand elle a un genre, -f et -m). */
export interface Noeud {
  id: string;
  /** Chemins d'apparence (dans public/assets). */
  chemins: string[];
  /** Nom court sous la case (« claire », « sombre », « → caustique »…). */
  legende: string;
  /** Ce qu'on en dit au survol, une fois révélée. */
  titre: string;
  sombre?: boolean;
  /** Branches et mêlées : les autres lignées en jeu (petits sceaux sous la case), et le sens de la branche. */
  autres?: IdLignee[];
  sens?: 'vers' | 'depuis';
}

export interface Arbre {
  lignee: IdLignee;
  graines: Noeud[];
  /** Bébé et enfant : la voie claire et la voie sombre. */
  racines: { stade: 'bebe' | 'enfant'; claire: Noeud; sombre: Noeud }[];
  adolescent: { claire: Noeud[]; sombre: Noeud[] };
  adulte: { claire: Noeud[]; sombre: Noeud[] };
  /** Mêlées (adulte) : trois tempéraments en équilibre, dont celui de la lignée. */
  melees: Noeud[];
}

const genre = (g: IdLignee) => g === 'joy';
const chemins = (stade: string, base: string, avecGenre: boolean) => (avecGenre ? [`echos/${stade}/${base}-f.png`, `echos/${stade}/${base}-m.png`] : [`echos/${stade}/${base}.png`]);
const STADE: Record<string, string> = { bebe: 'bébé', enfant: 'enfant', adolescent: 'adolescent', adulte: 'adulte' };

function pur(stade: string, g: IdLignee, sombre: boolean): Noeud {
  const base = (sombre ? 'dark-' : '') + g;
  const avecGenre = genre(g) && (stade === 'adolescent' || stade === 'adulte');
  return { id: `${stade}-${base}`, chemins: chemins(stade, base, avecGenre), legende: sombre ? 'sombre' : 'claire', titre: `${STADE[stade]} ${NOM_LIGNEE[g]}${sombre ? ' sombre' : ''}`, sombre };
}

/** Les branches : une lignée qui bascule vers la forme sombre d'une autre (codes « J-DD » : joie → dégoût sombre). */
export const CODES_BRANCHES = ['S-DF', 'J-DD', 'F-DW', 'W-DJ', 'D-DS', 'J-DS', 'W-DD', 'F-DJ', 'S-DW', 'D-DF', 'N-DN'];
function branche(stade: string, code: string, depuis: IdLignee): Noeud {
  const [a, b] = code.split('-');
  const de = LETTRE[a], vers = LETTRE[b.slice(1)];
  // vue de la lignée claire : vers la sombre de l'autre ; vue de la sombre : depuis l'autre
  const autre = depuis === de ? vers : de;
  const legende = code === 'N-DN' ? 'équilibre' : depuis === de ? `→ ${NOM_LIGNEE[autre]}` : `← ${NOM_LIGNEE[autre]}`;
  return {
    id: `${stade}-branch-${code}`, chemins: [`echos/${stade}/branch-${code.toLowerCase()}.png`], legende,
    ...(code === 'N-DN' ? {} : { autres: [autre], sens: depuis === de ? 'vers' as const : 'depuis' as const }),
    titre: code === 'N-DN' ? `${STADE[stade]} : la branche de l’équilibre` : `${STADE[stade]} : branche ${NOM_LIGNEE[de]} → ${NOM_LIGNEE[vers]} sombre`,
  };
}

export function arbre(g: IdLignee): Arbre {
  const graines = g === 'neutre'
    ? (['joy', 'wrath', 'disgust', 'sorrow', 'fear'] as Graine[]).map((x) => ({ id: `graine-${x}`, chemins: [`echos/graines/${x}.png`], legende: '', titre: LIGNEES.find((l) => l.id === x)!.graine }))
    : [{ id: `graine-${g}`, chemins: [`echos/graines/${g}.png`], legende: '', titre: LIGNEES.find((l) => l.id === g)!.graine }];
  const racines = (['bebe', 'enfant'] as const).map((stade) => ({ stade, claire: pur(stade, g, false), sombre: pur(stade, g, true) }));
  // branches vues de cette lignée : « g_primaire_x » (claire) et « g_sombre_x » (sombre), comme dans evolution.ts
  const lettre = Object.keys(LETTRE).find((k) => LETTRE[k] === g)!;
  const deClaire = g === 'neutre' ? ['N-DN'] : CODES_BRANCHES.filter((c) => c[0] === lettre && c !== 'N-DN');
  const deSombre = g === 'neutre' ? [] : CODES_BRANCHES.filter((c) => c.endsWith('D' + lettre) && c !== 'N-DN');
  const etage = (stade: 'adolescent' | 'adulte') => ({
    claire: [pur(stade, g, false), ...deClaire.map((c) => branche(stade, c, g))],
    sombre: [pur(stade, g, true), ...deSombre.map((c) => branche(stade, c, g))],
  });
  const melees = g === 'neutre' ? [] : TRIADES_MELEES.filter((t) => t.emotions.includes(g)).map((t) => ({
    id: `melee-${t.code}`, chemins: [`echos/adulte/melee-${t.code.toLowerCase()}.png`],
    legende: t.emotions.filter((x) => x !== g).map((x) => NOM_LIGNEE[x]).join(' et '), autres: t.emotions.filter((x) => x !== g),
    titre: `mêlée : ${t.emotions.map((x) => NOM_LIGNEE[x]).join(', ')}`,
  }));
  return { lignee: g, graines, racines, adolescent: etage('adolescent'), adulte: etage('adulte'), melees };
}

/** Toutes les cases d'un arbre, à plat. */
export const noeuds = (a: Arbre): Noeud[] => [
  ...a.graines, ...a.racines.flatMap((r) => [r.claire, r.sombre]),
  ...a.adolescent.claire, ...a.adolescent.sombre, ...a.adulte.claire, ...a.adulte.sombre, ...a.melees,
];

/** Les échos de souvenir : formes fragmentées (adolescent) et mémoires élémentaires (adulte). */
export const FRAGMENTS: Noeud[] = [
  { id: 'fragment-cognitif', chemins: ['echos/adolescent/fragment-cognitif.png'], legende: 'l’esprit', titre: 'fragment : tout pour l’esprit' },
  { id: 'fragment-socio', chemins: ['echos/adolescent/fragment-socio.png'], legende: 'le cœur', titre: 'fragment : tout pour les autres' },
  { id: 'fragment-psychomoteur', chemins: ['echos/adolescent/fragment-psychomoteur.png'], legende: 'le corps', titre: 'fragment : tout pour le corps' },
];
export const MEMOIRES: Noeud[] = [
  { id: 'memoire-j-vent', chemins: ['echos/adulte/memoire-j-vent.png'], legende: 'le vent', titre: 'Souvenir du Vent' },
  { id: 'memoire-w-feu', chemins: ['echos/adulte/memoire-w-feu.png'], legende: 'le feu', titre: 'Souvenir du Feu' },
  { id: 'memoire-d-terre', chemins: ['echos/adulte/memoire-d-terre.png'], legende: 'la terre', titre: 'Souvenir de la Terre' },
  { id: 'memoire-s-eau', chemins: ['echos/adulte/memoire-s-eau.png'], legende: 'l’eau', titre: 'Souvenir de l’Eau' },
  { id: 'memoire-f-foudre', chemins: ['echos/adulte/memoire-f-foudre.png'], legende: 'la foudre', titre: 'Souvenir de la Foudre' },
  { id: 'memoire-n-ether', chemins: ['echos/adulte/memoire-n-ether.png'], legende: 'l’éther', titre: 'Souvenir de l’Éther' },
];

/** Formes vues par le profil ; une graine se révèle dès qu'une forme de sa lignée a été vue. */
export function revelees(memoire: readonly string[], actuelle?: string): Set<string> {
  const vu = new Set(memoire);
  if (actuelle) vu.add(actuelle);
  for (const c of [...vu]) {
    const m = /^echos\/(?:bebe|enfant|adolescent|adulte)\/(?:dark-)?(joy|wrath|disgust|sorrow|fear)/.exec(c);
    if (m) vu.add(`echos/graines/${m[1]}.png`);
  }
  return vu;
}

/** Combien de formes de l'arbre (ou de la liste) sont révélées. */
export function compte(liste: Noeud[], vu: Set<string>) {
  const tous = liste.flatMap((n) => n.chemins);
  return { vues: tous.filter((c) => vu.has(c)).length, total: tous.length };
}

/** La lignée d'une apparence (pour ouvrir l'arbre sur celle de l'écho actuel). */
export function ligneeDe(chemin: string): IdLignee {
  if (/\/(?:dark-)?neutre\.png$|branch-n-dn/.test(chemin)) return 'neutre';
  const m = /(joy|wrath|disgust|sorrow|fear)/.exec(chemin);
  if (m) return m[1] as IdLignee;
  const b = /branch-([jwfsd])-d/.exec(chemin);
  return b ? LETTRE[b[1].toUpperCase()] : 'joy';
}
