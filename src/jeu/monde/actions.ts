// Actions de jeu déclenchées par les scènes du monde (« action: donner canne_peche », « action: combat hevann »…).
// Chaque action agit sur la partie (l'écho et son sac, le monde) puis dit à l'écran quoi faire :
// reprendre la scène tout de suite (avec, au besoin, des variables), jouer un combat, ouvrir un panneau,
// ou partir ailleurs à la fin de la scène. Le vocabulaire est documenté dans contenu/scenes/LISEZMOI.md.
import type { Valeur } from '@/moteur/scene/types';
import {
  Simulation, aliment, heureTotale, type Etat, type Aleatoire,
} from '@/moteur/simulation';
import { consommer, objetDivers, ranger, trouverObjet } from '@/moteur/simulation/objets';
import { bilanCombat } from '@/moteur/combat';
import { RESSOURCES, ajouterRessource, prosperite, recruter, type Monde, type Ressource } from '@/moteur/monde';
import type { IssueCombat } from '../combat/EcranCombat';
import { combatPnj, type CombatPnj } from './adversaires';

export type Panneau = 'boutique' | 'stand' | 'coffre' | 'travaux' | 'travail' | 'deblayer' | 'sac';

export type DemandeAction =
  | { type: 'suite'; variables?: Record<string, Valeur> }
  | { type: 'combat'; combat: CombatPnj }
  | { type: 'panneau'; panneau: Panneau }
  /** à la fin de la scène, aller ailleurs : « ranch », un lieu du village, « zone 27 »… */
  | { type: 'sortie'; vers: string };

export interface ContexteAction {
  etat: Etat;
  monde: Monde;
  sim: Simulation;
  rng?: Aleatoire;
}

/** Noms des PNJ (fiches contenu/personnages) pour le journal et Myhra. */
export const NOMS_PNJ: Record<string, string> = {
  ash: 'Ash', bourbella: 'Bourbella', finn: 'Finn', garry: 'Garry', glamp: 'Glamp', grimp: 'Grimp', hevann: 'Hevann', hibert: 'Hibert',
  jumpy: 'Jumpy', karla: 'Karla', 'lady-roger': 'Lady Roger', maiko: 'Maïko', morthen: 'Morthen', myhra: 'Myhra', nyxara: 'Nyxara',
  phil: 'Phil', tourby: 'Tourby', vinland: 'Vinland',
};

const nombre = (t: string | undefined, defaut = 1) => { const n = parseFloat((t ?? '').replace(',', '.')); return Number.isFinite(n) ? n : defaut; };
function valeur(t: string | undefined): Valeur {
  if (t === undefined || /^vrai$/i.test(t)) return true;
  if (/^faux$/i.test(t)) return false;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : t.replace(/^"|"$/g, '');
}
const nomObjet = (id: string) => aliment(id)?.nom ?? objetDivers(id)?.nom ?? id;

/** Joue une action de scène. Inconnue : la scène continue. */
export function jouerAction(nom: string, argument: string | undefined, ctx: ContexteAction): DemandeAction {
  const { etat: e, monde: m, sim } = ctx;
  const rng = ctx.rng ?? Math.random;
  const args = (argument ?? '').trim().split(/\s+/).filter(Boolean);
  switch (nom) {
    case 'donner': {
      const id = args[0];
      if (!id || !nomObjet(id)) return { type: 'suite', variables: { 'action.ok': false } };
      const q = Math.max(1, Math.round(nombre(args[1])));
      const ok = ranger(e, id, q) > 0;
      if (ok) sim.noter(`Vous recevez : ${nomObjet(id)}${q > 1 ? ` × ${q}` : ''}.`);
      return { type: 'suite', variables: { 'action.ok': ok, 'action.objet': nomObjet(id), ['sac.' + id]: compter(e, id), 'sac.plein': !e.inventaire.some((c) => !c) } };
    }
    case 'retirer': {
      const cible = args[0] ?? '';
      const q = Math.max(1, Math.round(nombre(args[1])));
      const index = cible === 'aliment' ? e.inventaire.findIndex((c) => !!c && !!aliment(c.id)) : trouverObjet(e, cible);
      const c = index >= 0 ? e.inventaire[index] : null;
      if (!c || c.qte < q) return { type: 'suite', variables: { 'action.ok': false } };
      for (let i = 0; i < q; i++) consommer(e, index);
      return { type: 'suite', variables: { 'action.ok': true, 'action.objet': nomObjet(c.id).toLowerCase(), ['sac.' + c.id]: compter(e, c.id) } };
    }
    case 'or': {
      e.or = Math.max(0, e.or + Math.round(nombre(args[0], 0)));
      return { type: 'suite', variables: { or: e.or } };
    }
    case 'ressource': {
      const r = args[0] as Ressource;
      if (!RESSOURCES.includes(r)) return { type: 'suite' };
      const q = Math.round(nombre(args[1]));
      if (q >= 0) ajouterRessource(m, r, q); else m.ressources[r] = Math.max(0, (m.ressources[r] ?? 0) + q);
      return { type: 'suite' };
    }
    case 'recruter': {
      const id = args[0] ?? '';
      const nomPnj = NOMS_PNJ[id] ?? id;
      if (recruter(m, id, nomPnj, args[1] ?? 'bebe')) sim.noter(`${nomPnj} a rejoint le village !`);
      return { type: 'suite', variables: { 'village.prosperite': prosperite(m), 'village.dernier': (m.drapeaux['village.dernier'] as string) ?? '' } };
    }
    case 'combat': {
      const c = combatPnj(args[0] ?? '');
      return c ? { type: 'combat', combat: c } : { type: 'suite', variables: { 'combat.issue': 'fuite' } };
    }
    case 'boutique': case 'stand': case 'coffre': case 'travaux': case 'travail': case 'deblayer': case 'sac':
      return { type: 'panneau', panneau: nom };
    case 'drapeau': {
      const cle = args[0];
      if (!cle) return { type: 'suite' };
      const v = valeur(args.slice(1).join(' ') || undefined);
      m.drapeaux[cle] = v;
      return { type: 'suite', variables: { [cle]: v } };
    }
    case 'reconfort':
      reconfort(e);
      return { type: 'suite', variables: { 'action.ok': true } };
    case 'motiver':
      e.motivationJusqua = heureTotale(e) + 6;
      sim.noter(`Hevann a motivé ${e.nom} : ses entraînements porteront davantage pendant quelques heures.`);
      return { type: 'suite' };
    case 'apprendre-echo':
      return { type: 'suite', variables: { 'jumpy.info': anecdote(e, rng) } };
    case 'heures':
      sim.avancer(Math.max(0, Math.round(nombre(args[0]))));
      return { type: 'suite' };
    case 'garde':
      // le travail chez Jumpy : les heures passent, mais les besoins de l'écho restent en l'état (Simulation.garder)
      sim.garder(Math.max(0, Math.round(nombre(args[0]))));
      return { type: 'suite' };
    case 'journal':
      if (argument?.trim()) sim.noter(argument.trim());
      return { type: 'suite' };
    case 'ranch':
      return { type: 'sortie', vers: 'ranch' };
    case 'lieu':
      return { type: 'sortie', vers: args.join(' ') || 'village' };
    default:
      return { type: 'suite' };
  }
}

const compter = (e: Etat, id: string) => e.inventaire.reduce((n, c) => n + (c?.id === id ? c.qte : 0), 0);

/**
 * Applique l'issue d'un combat contre un PNJ (applyCombatOutcome) : objets utilisés, progrès, or, émotions,
 * blessure (selon le PNJ), une heure qui passe. Une fuite ne laisse que la fatigue. Renvoie {combat.issue}.
 */
export function appliquerIssueCombat(ctx: ContexteAction, combat: CombatPnj, issue: IssueCombat): Record<string, Valeur> {
  const { etat: e, sim } = ctx;
  issue.objetsUtilises.forEach((id) => sim.retirerObjet(id));
  if (issue.resultat === 'fuite') { e.pvCombat = issue.pv; return { 'combat.issue': 'fuite' }; }
  const d = combat.adversaires[0].description;
  const b = bilanCombat(issue.resultat, e.caracs, { stade: d.stade, lignee: d.lignee, ageJours: d.ageJours ?? null }, issue.pv, ctx.rng ?? Math.random,
    combat.entrainement ? { ...combat.bilan, risqueBlessure: 0 } : combat.bilan ?? {});
  sim.terminerCombat(b, combat.adversaires.map((a) => a.description.nom).join(' et '));
  return { 'combat.issue': issue.resultat, or: e.or };
}

/** Myhra réconforte l'écho (myhraComfort) : santé, vigueur ; s'il est angoissé, elle le guérit de tout. */
export function reconfort(e: Etat) {
  e.sante = Math.min(20, e.sante + 2);
  if (e.pvCombat != null) {
    const pvMax = Math.max(1, Math.round(e.caracs.robustesse * 7));
    e.pvCombat = e.pvCombat + pvMax * 0.5 >= pvMax ? null : e.pvCombat + pvMax * 0.5;
  }
  if (e.anxiete > 90) {
    e.malade = false; e.heuresMaladie = 0; e.risqueMaladie = 0; e.blesse = false;
    e.anxiete = 0;
  } else {
    e.anxiete = Math.max(0, e.anxiete - 50);
    e.humeur = Math.min(100, e.humeur + 30);
  }
}

// —— « En apprendre plus sur l'écho » (buildLearnMoreLines) : une phrase tirée au hasard, jamais de chiffre.
const TEMPERAMENTS: Record<string, [string, string]> = {
  cur: ['curieux', 'curieuse'], res: ['déterminé', 'déterminée'], dis: ['prudent', 'prudente'], obs: ['observateur', 'observatrice'], ant: ['prévoyant', 'prévoyante'],
};
export function anecdotes(e: Etat): string[] {
  const N = e.nom || 'ton écho';
  const f = e.genre === 'f';
  const a = (m: string, fe: string) => (f ? fe : m);
  const il = a('il', 'elle'), le = a('le', 'la'), lui = a('lui', 'elle');
  const l: string[] = [];
  const regime = e.gouts.regime.toLowerCase();
  l.push(`Hey ! Tu savais que ${N} avait un régime particulier ? Il se trouve qu’${il} est ${regime} ! C’est fou non ?`);
  const p = e.personnalite;
  const hauts = (Object.keys(p) as (keyof typeof p)[]).filter((k) => p[k] >= 5);
  const bas = (Object.keys(p) as (keyof typeof p)[]).filter((k) => p[k] <= 2);
  const HAUT = {
    ouverture: `${N} a l’air incroyablement ${a('curieux', 'curieuse')} de tout ! Rien ne lui échappe.`,
    conscienciosite: `J’ai remarqué que ${N} est un exemple de sérieux et d’organisation. Un vrai modèle !`,
    extraversion: `${N} est un vrai boute-en-train, non ? Toujours ${a('prêt', 'prête')} à socialiser !`,
    agreabilite: `${N} a un cœur en or, tout le monde l’adore par ici !`,
    nevrosisme: `${N} semble très ${a('instable', 'instable')} et ${a('sujet', 'sujette')} à l’anxiété, il faut ${le} rassurer souvent.`,
  };
  const BAS = {
    ouverture: `${N} est plutôt terre-à-terre, peu ${a('attiré', 'attirée')} par la nouveauté.`,
    conscienciosite: `${N} est un peu tête en l’air, ${il} improvise beaucoup !`,
    extraversion: `${N} est plutôt ${a('réservé', 'réservée')}, ${il} préfère la tranquillité.`,
    agreabilite: `${N} a un sacré caractère, ${il} ne se laisse pas faire !`,
    nevrosisme: `${N} semble d’un calme olympien, rien ne ${le} déstabilise !`,
  };
  if (hauts.length) l.push(HAUT[hauts[0]]);
  if (bas.length) l.push(BAS[bas[0]]);
  const t = e.taille;
  l.push(t < 0.8 ? `${N} est vraiment ${a('minuscule', 'minuscule')}, c’est adorable !`
    : t < 0.95 ? `${N} est plutôt ${a('petit', 'petite')} ${a('comparé', 'comparée')} aux autres échos que je connais.`
      : t < 1.15 ? `${N} a une taille tout à fait normale, ni trop ${a('grand', 'grande')} ni trop ${a('petit', 'petite')}.`
        : t < 1.3 ? `J’ai remarqué que ${N} est plutôt ${a('grand', 'grande')} pour son âge !`
          : `Waouh, ${N} est ${a('immense', 'immense')} ! Ça devait pas être facile à transporter jusqu’ici.`);
  const r = e.risqueMaladie;
  l.push(r < 20 ? `${N} a l’air en pleine forme, aucun risque à l’horizon !`
    : r < 40 ? `Je trouve ${N} plutôt ${a('robuste', 'robuste')}, pas grand risque de tomber ${a('malade', 'malade')}.`
      : r < 60 ? `Fais un peu attention, ${N} pourrait attraper un petit rhume si tu n’y prends pas garde.`
        : r < 80 ? `J’ai l’impression que ${N} pourrait tomber ${a('malade', 'malade')} à tout moment ! Fais attention !`
          : `Par tous les échos sauvages… ${N} est à deux doigts de tomber gravement ${a('malade', 'malade')} ! Occupe-t’en vite !`);
  const SAVEURS: Record<string, string> = { Sucré: 'sucrées', Salé: 'salées', Amer: 'amères', Acide: 'acides', Umami: 'umami', Épicé: 'épicées' };
  l.push(`Un petit secret : ${N} raffole des saveurs ${SAVEURS[e.gouts.saveur] ?? e.gouts.saveur.toLowerCase()} !`);
  l.push(`${N} ne dirait jamais non à un bon plat du genre ${e.gouts.categorie.toLowerCase()} !`);
  const pref = aliment(e.gouts.platPrefere)?.nom, det = aliment(e.gouts.platDeteste)?.nom;
  if (pref) l.push(`Si tu veux vraiment lui faire plaisir, prépare-lui ce plat : ${pref.toLowerCase()} !`);
  if (det) l.push(`Une chose est sûre : ne lui présente jamais ${det.toLowerCase()}, ${N} déteste ça !`);
  const temp = (Object.keys(e.temperament) as (keyof typeof e.temperament)[]).reduce((x, k) => (e.temperament[k] > e.temperament[x] ? k : x));
  l.push(`À ce que je vois, ${N} est plutôt ${TEMPERAMENTS[temp][f ? 1 : 0]} !`);
  l.push({
    matinal: `${N} est du genre à se lever aux aurores, ${a('un vrai matinal', 'une vraie matinale')} !`,
    diurne: `Rien de tel qu’une bonne journée bien remplie, ${N} est clairement du genre diurne.`,
    soiree: `${N} ne s’anime vraiment qu’en soirée, j’ai remarqué !`,
    nocturne: `Entre nous, je crois que ${N} est un petit oiseau de nuit, ${a('un vrai nocturne', 'une vraie nocturne')} !`,
  }[e.rythme]);
  const x = e.anxiete;
  l.push(x < 20 ? `${N} semble d’une sérénité à toute épreuve !`
    : x < 40 ? `Je trouve ${N} plutôt ${a('détendu', 'détendue')} en général.`
      : x < 60 ? `${N} a l’air un peu sur les nerfs parfois, rien d’alarmant.`
        : x < 80 ? `J’ai remarqué que ${N} semble souvent ${a('anxieux', 'anxieuse')}… il faudrait ${le} rassurer.`
          : `${a('Le pauvre', 'La pauvre')} ${N} a l’air complètement ${a('angoissé', 'angoissée')} ! Prends soin de ${lui}.`);
  const s = e.sante;
  l.push(s >= 18 ? `${N} me paraît être dans une santé olympique ! Félicitations !`
    : s >= 14 ? `${N} a l’air en bonne santé, continue comme ça !`
      : s >= 7 ? `La santé de ${N} semble correcte, mais reste sur tes gardes.`
        : s >= 4 ? `Je m’inquiète pour ${N}, sa santé est alarmante.`
          : s >= 2 ? `${a('Le pauvre', 'La pauvre')} ${N}… sa santé est critique, il faut réagir vite !`
            : `Mon dieu… la santé de ${N} est extrêmement préoccupante ! Il faut t’en occuper immédiatement !`);
  l.push(e.manqueAffection > 50
    ? `${N} a l’air d’avoir un grand besoin de tendresse ces temps-ci, tu devrais lui montrer un peu plus d’affection.`
    : `${N} ne semble pas manquer d’affection en ce moment, tu prends visiblement bien soin de ${lui}.`);
  return l;
}
export const anecdote = (e: Etat, rng: Aleatoire = Math.random) => { const l = anecdotes(e); return l[Math.floor(rng() * l.length)]; };
