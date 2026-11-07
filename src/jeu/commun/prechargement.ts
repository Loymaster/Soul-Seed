// Préchargement des images : éviter qu'un décor, un PNJ ou une forme d'écho n'apparaisse en retard,
// au milieu d'une animation ou d'un fondu.
//
// Tout charger d'un bloc n'est pas raisonnable (≈ 270 Mo d'images, plus de 1 Go une fois décodées) : on procède par vagues.
//   1. le socle (interface, émotions, objets, avatars, menu) avant le premier écran, derrière une barre de progression ;
//   2. ce qu'un écran montre d'emblée, avant de l'afficher (voir `Pret`) : ses animations démarrent sur des images prêtes ;
//   3. les lieux voisins pendant qu'on est quelque part (exploration, village), pour que le décor suivant soit déjà là ;
//   4. tout le reste en arrière-plan, deux images à la fois, une fois l'écran courant prêt.
//
// Une image préchargée reste référencée (elle demeure dans le cache d'images du document, même quand le serveur
// interdit le cache HTTP, comme le serveur de développement) ; au-delà d'un budget, les moins récemment demandées
// sont relâchées (le navigateur les garde alors seulement s'il le juge bon).
import type { Catalogue } from '@/contenu/types';
import { cheminDecor, cheminImage } from '@/moteur/scene/valider';

const BASE = import.meta.env.BASE_URL;
/** Chemin d'asset (« decors/ranch/jour.png ») → adresse servie (« /assets/decors/ranch/jour.png »). */
export const urlAsset = (chemin: string) => (/^(\/|https?:|data:|blob:)/.test(chemin) ? chemin : `${BASE}assets/${chemin}`);

/** Octets d'images gardées en mémoire au-delà desquels les plus anciennes sont relâchées. */
const BUDGET = 200 * 1024 * 1024;
/** Chargements simultanés : demandes urgentes (écran à afficher) et arrière-plan. */
const SIMULTANES_URGENT = 6;
const SIMULTANES_FOND = 2;

interface Entree {
  url: string;
  octets: number;
  /** dernière demande (pour relâcher les plus anciennes) */
  vu: number;
  img?: HTMLImageElement;
  etat: 'attente' | 'charge' | 'pret' | 'echec';
  promesse: Promise<void>;
  resoudre: () => void;
  urgent: boolean;
  /** décoder avant de déclarer l'image prête (écran à afficher) */
  decoder: boolean;
}

let catalogue: Catalogue | null = null;
const octetsParUrl = new Map<string, number>();
const entrees = new Map<string, Entree>();
const fileUrgente: Entree[] = [];
const fileFond: Entree[] = [];
let enCoursUrgent = 0;
let enCoursFond = 0;
let horloge = 0;
/** Images que l'écran courant ne doit pas voir relâchées. */
let epinglees = new Set<string>();

/** À appeler une fois au démarrage : le catalogue donne la liste des images et leur poids. */
export function initialiserPrechargement(c: Catalogue) {
  catalogue = c;
  for (const a of c.assets) if (a.type !== 'son') octetsParUrl.set(urlAsset(a.chemin), a.octets ?? 0);
}

/** Chemins du catalogue (images et animations) qui commencent par l'un des préfixes donnés. */
export function parPrefixe(...prefixes: string[]): string[] {
  if (!catalogue) return [];
  return catalogue.assets.filter((a) => a.type !== 'son' && prefixes.some((p) => a.chemin.startsWith(p))).map((a) => a.chemin);
}

/** Vrai si toutes ces images sont déjà chargées (ou en échec : inutile de les attendre). */
export function estPret(chemins: readonly (string | null | undefined)[]): boolean {
  return chemins.every((c) => !c || ['pret', 'echec'].includes(entrees.get(urlAsset(c))?.etat ?? ''));
}

/**
 * Demande ces images. `urgent` : elles passent devant tout et sont décodées avant d'être déclarées prêtes ;
 * sinon elles passent en tête de l'arrière-plan.
 * La promesse se résout quand toutes sont prêtes (ou en échec), ou au bout de `delai` ms si on en donne un.
 */
export function precharger(chemins: readonly (string | null | undefined)[], o: { urgent?: boolean; delai?: number; progression?: (fait: number, total: number) => void } = {}): Promise<void> {
  return prechargerEn(chemins, o.urgent ? 'urgent' : 'proche', o);
}

type Mode = 'urgent' | 'proche' | 'fond';
function prechargerEn(chemins: readonly (string | null | undefined)[], mode: Mode, o: { delai?: number; progression?: (fait: number, total: number) => void } = {}): Promise<void> {
  const liste = [...new Set(chemins.filter((c): c is string => !!c).map(urlAsset))];
  // « proche » place en tête : on parcourt à rebours pour garder l'ordre demandé
  const promesses = (mode === 'proche' ? [...liste].reverse() : liste).map((url) => demander(url, mode));
  pomper();
  let fait = 0;
  if (o.progression) {
    o.progression(0, liste.length);
    promesses.forEach((p) => p.then(() => o.progression!(++fait, liste.length)));
  }
  const tout = Promise.all(promesses).then(() => undefined);
  return o.delai ? Promise.race([tout, new Promise<void>((r) => setTimeout(r, o.delai))]) : tout;
}

/** Garde ces images pendant que l'écran les montre (elles ne seront pas relâchées). */
export function epingler(chemins: readonly (string | null | undefined)[]) {
  epinglees = new Set(chemins.filter((c): c is string => !!c).map(urlAsset));
}

/**
 * Images d'une scène de dialogue : ses décors, les expressions des PNJ qui y entrent ou y parlent,
 * les images montrées par ses actions (« action: montrer pnj/garry/attaque-jumpy »).
 */
export function imagesScene(scene: unknown): string[] {
  if (!catalogue) return [];
  const existe = new Set(catalogue.assets.map((a) => a.chemin));
  const decors = catalogue.assets.filter((a) => a.chemin.startsWith('decors/')).map((a) => a.chemin);
  const qui = new Set<string>();
  const images = new Set<string>();
  const parcourir = (n: unknown) => {
    if (Array.isArray(n)) { n.forEach(parcourir); return; }
    if (!n || typeof n !== 'object') return;
    const o = n as Record<string, unknown>;
    if (typeof o.decor === 'string') images.add(cheminDecor(o.decor, decors));
    if (typeof o.qui === 'string') qui.add(o.qui);
    if (Array.isArray(o.qui)) o.qui.forEach((q) => typeof q === 'string' && qui.add(q));
    if (o.type === 'action' && typeof o.argument === 'string' && o.argument.includes('/')) images.add(cheminImage(o.argument));
    Object.values(o).forEach((v) => { if (v && typeof v === 'object') parcourir(v); });
  };
  parcourir(scene);
  const fiches = catalogue.pnj ?? {};
  qui.forEach((q) => (fiches[q]?.assets?.expressions ?? []).forEach((c) => images.add(c)));
  return [...images].filter((c) => existe.has(c));
}

let fondLance = false;
/** Charge en arrière-plan toutes les images du catalogue (dans l'ordre des préfixes donnés, puis le reste). */
export function lancerArrierePlan(ordre: string[] = []) {
  if (fondLance || !catalogue) return;
  fondLance = true;
  const tous = catalogue.assets.filter((a) => a.type !== 'son').map((a) => a.chemin);
  const rang = (c: string) => { const i = ordre.findIndex((p) => c.startsWith(p)); return i < 0 ? ordre.length : i; };
  tous.sort((a, b) => rang(a) - rang(b));
  // laisser l'écran courant s'installer d'abord
  setTimeout(() => { prechargerEn(tous, 'fond'); }, 1500);
}

// —— mécanique interne

/**
 * Met une image en file : `urgent` (écran à afficher : file prioritaire, décodée), `proche` (bientôt utile :
 * en tête de l'arrière-plan) ou `fond` (en queue de l'arrière-plan).
 */
function demander(url: string, mode: Mode): Promise<void> {
  horloge++;
  let e = entrees.get(url);
  if (!e) {
    let resoudre!: () => void;
    const promesse = new Promise<void>((r) => { resoudre = r; });
    e = { url, octets: octetsParUrl.get(url) ?? 0, vu: horloge, etat: 'attente', promesse, resoudre, urgent: false, decoder: false };
    entrees.set(url, e);
  } else {
    e.vu = horloge;
    if (e.etat === 'charge' || e.etat === 'echec' || (e.etat === 'pret' && e.img)) return e.promesse;
    if (e.etat === 'pret') {
      // relâchée entre-temps : on la recharge (le navigateur la sert d'ordinaire depuis son cache)
      e.etat = 'attente';
      e.promesse = new Promise<void>((r) => { e!.resoudre = r; });
    }
    // déjà en file : on la retire pour la replacer selon la nouvelle demande
    for (const f of [fileUrgente, fileFond]) { const i = f.indexOf(e); if (i >= 0) f.splice(i, 1); }
  }
  if (mode === 'urgent' || e.urgent) { e.urgent = true; e.decoder = true; fileUrgente.push(e); }
  else if (mode === 'proche') fileFond.unshift(e);
  else fileFond.push(e);
  return e.promesse;
}

function pomper() {
  while (enCoursUrgent < SIMULTANES_URGENT && fileUrgente.length) { enCoursUrgent++; charger(fileUrgente.shift()!, () => { enCoursUrgent--; pomper(); }); }
  // l'arrière-plan attend que les demandes urgentes soient servies
  while (!fileUrgente.length && enCoursUrgent === 0 && enCoursFond < SIMULTANES_FOND && fileFond.length) {
    enCoursFond++;
    charger(fileFond.shift()!, () => { enCoursFond--; pomper(); });
  }
}

function charger(e: Entree, fin: () => void) {
  e.etat = 'charge';
  const img = new Image();
  img.decoding = 'async';
  const termine = (ok: boolean) => {
    e.etat = ok ? 'pret' : 'echec';
    e.img = ok ? img : undefined;
    e.resoudre();
    relacher();
    fin();
  };
  img.onload = () => {
    if (!e.decoder || typeof img.decode !== 'function') { termine(true); return; }
    img.decode().then(() => termine(true), () => termine(true));
  };
  img.onerror = () => termine(false);
  img.src = e.url;
}

/** Au-delà du budget, relâche les images les moins récemment demandées (sauf celles de l'écran courant). */
function relacher() {
  let total = 0;
  const gardees: Entree[] = [];
  entrees.forEach((e) => { if (e.img) { total += e.octets; gardees.push(e); } });
  if (total <= BUDGET) return;
  gardees.sort((a, b) => a.vu - b.vu);
  for (const e of gardees) {
    if (total <= BUDGET) break;
    if (epinglees.has(e.url)) continue;
    e.img = undefined;
    total -= e.octets;
  }
}
