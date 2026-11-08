// Écran d'exploration (maquette « Exploration », page v12 du canevas) branché sur la simulation, le sac et le monde.
// La scène est l'interface : les passages sont tracés à même le décor, l'écho marche avec vous d'un lieu à l'autre,
// et tout ce qu'on apprend de lui passe par son allure (jamais de chiffre).
// Le temps s'écoule comme au ranch (1 s réelle = 1 min de jeu) ; marcher ne coûte rien de plus, seules les actions
// prennent du temps (fouiller 30 min, récolter 30, envoyer l'écho 20, pêcher 15 par lancer).
// Les PNJ du lieu (pnj.ts) sont posés dans le décor ; leur scène se joue par-dessus (ScenePnj), l'horloge arrêtée.
// La vue est générée depuis la maquette (VueExploration.tsx) ; ce fichier calcule ses valeurs et tient la logique.
import { Component, createRef, type ReactNode } from 'react';
import type { Catalogue } from '@/contenu/types';
import { aBoutDeForces } from '@/moteur/combat';
import {
  NOM_STADE, Simulation, accord, ageJours, aliment, apparence, creerEchoSauvage, nomsPris, descriptionObjet, lireSignes, objetDivers,
  type Etat, type Graine, type Sortie,
} from '@/moteur/simulation';
import { consommer, ranger as rangerObjet } from '@/moteur/simulation/objets';
import {
  DUREES, MAT_POOLS, TEMPERAMENTS, groupeMat, lumiere, temperamentTerrain,
  type BilanSortie, type RencontreExploration, type RetourCombat,
} from './regles';
import {
  RESSOURCES, ajouterRessource, bonusPeche, decouvrir, facteurRecence, faitCeJour, heureAbsolue, marquerFait, minuteAbsolue, noterRencontre,
  poserRepousse, probaRencontre, repousseActive,
  type Monde, type Ressource,
} from '@/moteur/monde';
import { SFX } from '@/moteur/sfx';
import { Repere } from '../commun/Repere';
import { BoutonCarnet, BoutonSac, Calque, PetitCarnet, Sacoche } from '../commun/InterfaceRanch';
import { ecouterVolumes, fixerVolumes, volumeMusique } from '../commun/volumes';
import { profilEcho } from '../ranch/demarche';
import type { Personnage, Reglages } from '../profils';
import { ScenePnj } from '../monde/ScenePnj';
import { VueExploration } from './VueExploration';
import { SonsExplo as Sons } from './sons';
export { bilanDepart, reprendreTrouvailles, type BilanSortie, type RencontreExploration, type RetourCombat } from './regles';
import { DEPART, ZONES, type Chemin, type Region } from './zones';
import { ZONE_NYXARA, boutonsDuLieu, fondDuLieu, imagesZone, nyxaraPossible, pnjDuLieu, type BoutonExploration, type ContexteExploration, type PnjExploration } from './pnj';
import './exploration.css';

import { estPret, precharger } from '../commun/prechargement';
import { confierPiste } from '../commun/musique';
import { FondCombat } from '../combat/EcranCombat';
const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
const IMG = {
  joyeux: asset('emotions/joyeux.png'), fier: asset('emotions/fier.png'), surpris: asset('emotions/surpris.png'), anxieux: asset('emotions/anxieux.png'),
  faim: asset('interface/etats/orbite/faim.webp'), sale: asset('interface/etats/orbite/sale.webp'), fatigue: asset('interface/etats/orbite/fatigue.webp'),
  blesse: asset('interface/etats/orbite/blesse.webp'), malade: asset('interface/etats/orbite/malade.webp'),
  fouiller: asset('interface/actions/fouiller.png'), recolter: asset('interface/actions/recolter.png'), pecher: asset('interface/actions/pecher.png'),
  envoyer: asset('interface/actions/envoyer-echo.png'), camper: asset('interface/actions/campement.png'),
  nourrir: asset('interface/actions/nourrir.png'), laver: asset('interface/actions/laver.png'), soigner: asset('interface/actions/soigner.png'), dormir: asset('interface/actions/dormir.png'),
  carte: asset('decors/exploration/carte.png'), brume: asset('decors/exploration/carte-brume.webp'), repere: asset('interface/icones/repere.png'),
};
const NOMS_RESSOURCES: Record<Ressource, string> = { bois: 'Bois', pierre: 'Pierre', fibres: 'Fibres', resine: 'Résine', ferraille: 'Ferraille', cristaux: 'Cristaux' };
const imageRessource = (r: Ressource) => asset(`objets/materiaux/${r}.png`);

const MUSIQUES = { explo: 'exploration', caverne: 'glacial-zone', combat: 'combat', morthen: 'morthen' } as const;
/** Probabilité de base d'une rencontre en arrivant dans un lieu (« normales » dans la maquette). */
const BASE_RENCONTRE = 0.25;
/** Passage à l'écran de combat : l'exploration zoome vers l'écho sauvage en se fondant dans le décor du combat (ms). */
const DUREE_ZOOM_COMBAT = 800;
/** Le temps de lire la page de la rencontre avant le zoom (ms) : « … se jaugent », ou « … vous coupe la route ! ». */
const LECTURE_ENGAGEMENT = 900, LECTURE_COUPE = 1600;

const REGIONS: Record<Region, string> = { foret: 'La forêt', lac: 'Les rives du lac', montagne: 'Les monts', caverne: 'La caverne' };
const MOTES: Record<Region, string[]> = { foret: ['#9aa84e', '#c9a14a', '#6f7d3a', '#d8c27a'], lac: ['#a9c48a', '#e2d6a0', '#8fb070'], montagne: ['#b8ab92', '#d6ccb8', '#8f8370'], caverne: ['#e8b060', '#f3d48a', '#7a5a3a'] };
// Orientation des flèches selon le côté du chemin (degrés, 0 = droit devant).
const ANGLES: Record<string, number> = { left: -62, right: 62, center: 0, 'center-top-left': -14, 'top-left': -38 };
const POINT_PECHE: Record<number, [number, number]> = { 7: [790, 560], 8: [760, 420], 21: [720, 520] };
const CACHETTES: Record<Region, string[]> = {
  foret: ['Sous la souche', 'Dans les feuilles mortes', 'Au creux d’un arbre', 'Sous une pierre moussue', 'Près d’un terrier'],
  lac: ['Dans les roseaux', 'Sous une pierre plate', 'Au pied d’un saule', 'Dans la vase', 'Près d’un nid'],
  montagne: ['Entre deux rochers', 'Sous un éboulis', 'Dans l’herbe sèche', 'Au pied d’un pin tordu', 'Dans une crevasse'],
  caverne: ['Dans une fissure', 'Sous un éboulis', 'Au bord d’une flaque', 'Derrière une stalagmite', 'Dans un recoin sombre'],
};
const alea = <T,>(t: readonly T[]): T => t[Math.floor(Math.random() * t.length)];
const deux = (n: number) => String(n).padStart(2, '0');
const PERIODE = (h: number) => (h < 5 ? 'la nuit' : h < 12 ? 'le matin' : h < 18 ? 'l’après-midi' : h < 22 ? 'le soir' : 'la nuit');
const borne = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** Profondeur : plus l'écho est loin (haut dans l'image), plus il est petit. */
const echelle = (y: number) => borne(0.42 + ((y - 360) / (760 - 360)) * 0.58, 0.38, 1.08);
/** Le décor couvre le cadre (inset −16 px, cover, centré à 60 % en hauteur) : un calque peint à la taille du décor s'y aligne ainsi. */
const CADRE = { x: -16, y: -16, l: 1312, h: 832, centreY: 0.6 };
/** Pixels du repère par mètre (comme les scènes : tous les personnages à la même échelle). */
const PX_PAR_METRE = 245;
/** Taille de l'écho selon son stade : l'enfant de la maquette sert de référence. */
const tailleStade = (e: Pick<Etat, 'stade' | 'taille' | 'poids'>) => borne(profilEcho(e).echelle / 0.75, 0.7, 1.4);

export interface ProprietesExploration {
  etat: Etat;
  monde: Monde;
  zone: number;
  /** Le personnage du joueur et le catalogue d'assets (scènes des PNJ, taille des calques). */
  personnage: Personnage;
  catalogue: Catalogue;
  /** Lieux traversés pour arriver ici (la flèche du bas ramène au précédent). */
  historique?: number[];
  bilan: BilanSortie;
  reglages?: Reglages;
  /** Retour d'un combat : la rencontre et son issue. */
  retourCombat?: RetourCombat;
  /** Enregistre la partie et le monde (à chaque changement de lieu, après chaque action, en sortant). */
  sauver: (e: Etat, m: Monde) => void;
  /** L'écho a changé de lieu (l'écran garde sa place pour un retour de combat). */
  surLieu?: (zone: number, historique: number[]) => void;
  surCombat: (e: Etat, m: Monde, r: RencontreExploration) => void;
  surRanch: (e: Etat, m: Monde) => void;
  /** « Revenir au village » depuis la Sortie du village : la forêt du village. */
  surVillage: (e: Etat, m: Monde) => void;
  surMort: (e: Etat) => void;
  /** Réglages changés dans le petit carnet. */
  surReglages?: (r: Reglages) => void;
  /** « Retour au menu principal » (petit carnet) : la sortie en cours reste notée. */
  surMenu?: () => void;
}

interface Pos { x: number; y: number; s: number; o: number; dir: number; cls: string; duree: number }
interface Carte { lieu: string; type: 'echo' | 'objet' | 'vide'; revele: boolean; objet: string | null }
interface Fouille { cartes: Carte[]; gains: string[]; fini: boolean; perdu?: boolean; message: string }
interface Peche { phase: 'lancer' | 'attente' | 'touche' | 'prise' | 'echappe'; texte?: string; objet?: { nom: string; icone: string } }
interface Envoi { phase: 'depart' | 'fouine' | 'retour' | 'resultat'; x: number; y: number; res?: { type: 'echo' | 'objet' | 'rien'; id?: string; qte?: number }; objet?: { nom: string; icone: string } | null; texte?: string }
type Fort = 'bien plus fort' | 'plus fort' | 'de taille';
interface Rencontre extends RencontreExploration { phase: 'apparition' | 'choix' | 'combat' | 'issue'; fort: Fort; reaction: string; issue?: 'victoire' | 'defaite' | 'fuite'; texte?: string; coupe?: string }
interface Tente { phase: 'entree' | 'dedans' | 'sortie'; texte: string; choixRepas: boolean; anim?: string; occupe?: boolean }
interface Fin { titre: string; objets: { icone: string; texte: string }[]; materiaux: { icone: string; texte: string }[]; lieux: string; filo: string; vers: 'ranch' | 'village' }
/** Un PNJ placé dans le repère : son cadre (boîte utile) et l'image entière décalée dedans. */
interface PnjPlace { p: PnjExploration; x: number; y: number; l: number; h: number; iw: number; ih: number; ix: number; iy: number; src: string }

interface EtatUI {
  t: number;
  zone: number; ancien: number | null; sens: 'avant' | 'arriere'; historique: number[];
  sommeil: boolean;
  fouille: Fouille | null; peche: Peche | null; envoi: Envoi | null; rencontre: Rencontre | null;
  recolte: { phase: 'travail' | 'fin'; gains?: { image: string; texte: string }[]; texte?: string } | null;
  tente: Tente | null; carte: boolean; fin: Fin | null;
  sacOuvert: boolean; carnet: boolean;
  toast: { texte: string; id: number } | null; bulle: { src: string; id: number } | null;
  marche: boolean; survol: number | 'retour' | 'village' | null; nouveauLieu: number | null;
  filo: Pos;
  /** La scène d'un PNJ jouée par-dessus (cle : la rejouer de zéro). */
  scene: { id: string; sujet?: string; cle: number } | null;
  /** Un combat de scène est en cours (la musique du lieu se tait). */
  combatScene: boolean;
  /** La cinématique du sentier solitaire est engagée (musique coupée, chemins masqués) ; `appel` : « Au secours ! ». */
  nyxara: boolean; appel: boolean;
  survolPnj: string | null;
  /** Passage au combat : centre du zoom (l'écho sauvage) et décor du combat posé dessous. */
  versCombat: { x: number; y: number; terrain: string; zoom: boolean } | null;
}

export class Exploration extends Component<ProprietesExploration, EtatUI> {
  sim: Simulation;
  monde: Monde;
  minuteurs: number[] = [];
  vivant = true;
  horloge = 0;
  boucleMusique = 0;
  tPeche = 0;
  tToast = 0;
  tBulle = 0;
  pistes: Record<keyof typeof MUSIQUES, HTMLAudioElement> | null = null;
  musiqueOK = false;
  motes: { y: number; t: number; d: number; dx: number; c: string; delai: number }[] = [];
  motesRegion = '';
  desabonner: (() => void) | null = null;
  enCombat = false;
  assets: Map<string, Catalogue['assets'][number]>;
  compteurScene = 0;
  repousseVue = false;
  /** Le cadre de l'exploration, que le zoom vers le combat anime. */
  cadreZoom = createRef<HTMLDivElement>();

  constructor(p: ProprietesExploration) {
    super(p);
    this.sim = new Simulation(p.etat);
    this.monde = p.monde;
    this.assets = new Map(p.catalogue.assets.map((a) => [a.chemin, a]));
    const z = ZONES[p.zone] ? p.zone : DEPART;
    decouvrir(this.monde, z);
    const [fx, fy] = this.placeEcho(z);
    this.repousseVue = repousseActive(this.monde, heureAbsolue(p.etat));
    this.state = {
      t: 0, zone: z, ancien: null, sens: 'avant', historique: p.historique ?? [], sommeil: false,
      fouille: null, peche: null, envoi: null, rencontre: null, recolte: null, tente: null, carte: false, fin: null,
      sacOuvert: false, carnet: false,
      toast: null, bulle: null, marche: false, survol: null, nouveauLieu: null,
      filo: { x: fx, y: fy, s: echelle(fy), o: 1, dir: this.regard(z, fx), cls: '', duree: 0 },
      scene: null, combatScene: false, nyxara: false, appel: false, survolPnj: null, versCombat: null,
    };
  }

  // —— les PNJ du lieu
  ctx(): ContexteExploration { return { m: this.monde, e: this.e, h: this.heure() }; }
  pnjIci(zone = this.state?.zone ?? this.props.zone) { return pnjDuLieu(zone, this.ctx()); }
  /** Où se tient l'écho dans ce lieu (ailleurs si un PNJ occupe sa place habituelle). */
  placeEcho(zone: number): [number, number] {
    const p = this.pnjIci(zone).find((x) => x.echo);
    return p?.echo ?? ZONES[zone].filo;
  }
  /** L'écho regarde le PNJ du lieu s'il y en a un, sinon vers le centre. */
  regard(zone: number, x: number): number {
    const p = this.pnjIci(zone).map((q) => this.placer(q)).find(Boolean);
    return p ? (p.x + p.l / 2 >= x ? 1 : -1) : x < 640 ? 1 : -1;
  }
  /** Les chemins praticables d'un lieu : ceux qui attendent un drapeau n'apparaissent qu'avec lui ; un PNJ peut déplacer une flèche. */
  chemins(zone: number): Chemin[] {
    const deplaces = Object.assign({}, ...this.pnjIci(zone).map((p) => p.chemins ?? {})) as Record<number, [number, number]>;
    return ZONES[zone].chemins.filter((c) => !c.drapeau || this.monde.drapeaux[c.drapeau])
      .map((c) => (c.vers != null && deplaces[c.vers] ? { ...c, pos: deplaces[c.vers] } : c));
  }
  /** Décor du lieu (le passage des tréfonds une fois déblayé). */
  fond(zone: number) { return fondDuLieu(zone, ZONES[zone].fond, this.monde); }
  /** Un PNJ dans le repère : la boîte utile de son calque, là où elle est peinte ; ou son sprite, pieds au sol. */
  placer(p: PnjExploration): PnjPlace | null {
    const chemin = p.calque ?? p.sprite?.image;
    const a = chemin ? this.assets.get(chemin) : undefined;
    if (!a || !a.l || !a.h) return null;
    const b = a.boite && a.boite.l && a.boite.h ? a.boite : { x: 0, y: 0, l: a.l, h: a.h };
    let k: number, x: number, y: number;
    if (p.calque) {
      k = CADRE.l / a.l;
      const haut = CADRE.y - (a.h * k - CADRE.h) * CADRE.centreY;
      x = CADRE.x + b.x * k; y = haut + b.y * k;
    } else {
      const sp = p.sprite!;
      const hauteur = sp.taille * PX_PAR_METRE * echelle(sp.pieds);
      k = hauteur / b.h;
      x = sp.x - (b.l * k) / 2; y = sp.pieds - hauteur;
    }
    const r = (n: number) => Math.round(n);
    return { p, x: r(x), y: r(y), l: r(b.l * k), h: r(b.h * k), iw: r(a.l * k), ih: r(a.h * k), ix: r(-b.x * k), iy: r(-b.y * k), src: a.url ?? asset(chemin!) };
  }
  /** Place d'un écho sauvage : de l'autre côté si un PNJ se tient déjà là. */
  placeSauvage(zone: number): [number, number] {
    const [x, y] = ZONES[zone].sauvage;
    const gene = this.pnjIci(zone).map((p) => this.placer(p)).some((q) => q && x > q.x - 60 && x < q.x + q.l + 60 && y > q.y && y < q.y + q.h + 80);
    return gene ? [1280 - x, y] : [x, y];
  }
  bloque(): string | null { return this.pnjIci().find((p) => p.bloque)?.bloque ?? null; }
  /** Parler à un PNJ du lieu, ou suivre une étiquette du décor : la scène se joue par-dessus. */
  parler(q: PnjExploration | BoutonExploration) {
    if (this.occupe()) return;
    if (q.combat && aBoutDeForces(this.e)) {
      Sons.clic(); this.bulle(IMG.anxieux);
      this.dire(`${this.nom} est à bout de forces : pas de combat avant ${this.a('qu’il', 'qu’elle')} se soit ${this.a('reposé', 'reposée')}.`, 3600);
      return;
    }
    this.son('paperTick');
    const pl = 'calque' in q || 'sprite' in q ? this.placer(q as PnjExploration) : null;
    if (pl) this.setState((s) => ({ filo: { ...s.filo, dir: pl.x + pl.l / 2 >= s.filo.x ? 1 : -1 } }));
    this.ouvrirScene(q.scene, q.sujet);
  }
  ouvrirScene(id: string, sujet?: string) {
    this.setState({ scene: { id, sujet, cle: ++this.compteurScene }, survolPnj: null, survol: null });
  }
  /** Fin d'une scène de PNJ : les drapeaux sont déjà dans le monde ; `sortie` dit où aller ensuite. */
  finScene(sortie?: string) {
    // la scène s'avance au clavier : le PNJ cliqué garderait le focus (et son cadre) en revenant
    (document.activeElement as HTMLElement | null)?.blur?.();
    this.sauver();
    this.setState({ scene: null, combatScene: false, nyxara: false, appel: false }, () => {
      if (!sortie) return;
      const z = /^zone\s+(\d+)$/.exec(sortie);
      if (sortie === 'ranch') this.rentrer(true);
      else if (sortie === 'village' || sortie === 'foret') this.rentrer(false, 'village');
      else if (z && ZONES[+z[1]]) this.aller(+z[1]);
    });
  }

  get e() { return this.sim.etat; }
  get nom() { return this.e.nom || 'Votre écho'; }
  a(m: string, f: string) { return accord(this.e, m, f); }
  get Il() { return this.a('Il', 'Elle'); }
  plus(ms: number, f: () => void) { this.minuteurs.push(window.setTimeout(() => { if (this.vivant) f(); }, ms)); }
  son(nom: string, ...x: unknown[]) {
    if (this.props.reglages?.sons === false) return;
    const f = (SFX as unknown as Record<string, unknown>)[nom];
    if (typeof f === 'function') { try { (f as (...y: unknown[]) => void).apply(SFX, x); } catch { /* bruitage indisponible */ } }
  }
  temp() { return TEMPERAMENTS[temperamentTerrain(this.e)]; }
  /**
   * Enregistre la partie et le monde, avec la sortie en cours (lieu et chemin parcouru) : un rechargement de la page
   * ramène ici. `fin` : on rentre (ranch, village) ou l'écho s'est éteint, la sortie est close.
   */
  sauver(o: { zone?: number; historique?: number[]; fin?: boolean } = {}) {
    this.monde.sortie = o.fin || this.e.mort ? null : {
      zone: o.zone ?? this.state?.zone ?? this.props.zone, historique: o.historique ?? this.state?.historique ?? [], bilan: this.props.bilan,
    };
    this.props.sauver(this.e, this.monde);
  }
  heureAbs() { return heureAbsolue(this.e); }
  repousse() { return repousseActive(this.monde, this.heureAbs()); }
  maintenant() { return minuteAbsolue(this.e); }

  componentDidMount() {
    this.vivant = true;
    SFX.on = this.props.reglages?.sons ?? true;
    fixerVolumes({ musique: (this.props.reglages?.volumeMusique ?? 80) / 100, bruitages: (this.props.reglages?.volumeBruitages ?? 80) / 100 });
    this.horloge = window.setInterval(() => this.tic(), 1000);
    this.boucleMusique = window.setInterval(() => this.pasMusique(), 100);
    this.desabonner = ecouterVolumes(() => undefined);
    // on arrive du ranch ou d'un combat par un clic : la musique peut démarrer tout de suite
    this.musiqueOK = true;
    this.sauver();
    if (this.props.retourCombat) this.retourDeCombat(this.props.retourCombat);
    // essais (développement) : __explo.surgir() fait surgir un écho sauvage, __explo.jouer('morthen') joue une scène de PNJ
    if (import.meta.env.DEV) (window as unknown as { __explo?: unknown }).__explo = { surgir: () => this.surgir([]), jouer: (id: string, sujet?: string) => this.ouvrirScene(id, sujet), monde: this.monde, etat: this.e };
  }
  componentWillUnmount() {
    this.vivant = false;
    this.minuteurs.forEach(clearTimeout);
    clearInterval(this.horloge); clearInterval(this.boucleMusique); clearTimeout(this.tPeche); clearTimeout(this.tToast); clearTimeout(this.tBulle);
    this.desabonner?.();
    if (import.meta.env.DEV) delete (window as unknown as { __explo?: unknown }).__explo;
    // vers le combat : la musique de la rencontre est confiée à l'écran de combat, qui la reprend sans la redémarrer
    if (this.pistes) (Object.entries(this.pistes) as [keyof typeof MUSIQUES, HTMLAudioElement][]).forEach(([k, a]) => {
      if (k === 'combat' && this.state.versCombat?.zoom && !a.paused) confierPiste(MUSIQUES.combat, a, { attente: 4000, sortie: 900 });
      else a.pause();
    });
    this.pistes = null;
  }

  // —— le temps s'écoule (1 s = 1 min), sauf pendant le sommeil sous la tente, sur la page de retour, sac ou carnet ouverts
  tic() {
    const s = this.state;
    // l'horloge s'arrête aussi pendant les scènes des PNJ et la cinématique du sentier solitaire
    if (s.fin || s.sommeil || this.enCombat || this.e.mort || s.scene || s.nyxara || s.sacOuvert || s.carnet) return;
    const h = Math.floor(this.e.minute / 60);
    this.sim.minute();
    this.traiter(this.sim.vider());
    if (Math.floor(this.e.minute / 60) !== h) {
      this.sauver();
      const r = this.repousse();
      if (this.repousseVue && !r) this.dire('L’odeur de la repousse s’est dissipée.', 3200);
      this.repousseVue = r;
    }
    this.setState((x) => ({ t: x.t + 1 }));
  }
  /** Fait passer `min` minutes de jeu d'un coup (une action), règles horaires comprises. */
  passer(min: number) {
    for (let i = 0; i < min && !this.e.mort; i++) this.sim.minute();
    this.traiter(this.sim.vider());
    this.sauver();
  }
  /** Ce que la simulation signale pendant la sortie : seulement ce qui compte loin du ranch. */
  traiter(sorties: Sortie[]) {
    for (const x of sorties) {
      switch (x.type) {
        case 'mort': {
          this.sauver({ fin: true });
          const fin = this.e;
          this.plus(1500, () => this.props.surMort(fin));
          break;
        }
        case 'sommeil':
          if (x.effondrement) this.dire(`${this.nom} s’est ${this.a('écroulé', 'écroulée')} de fatigue… ${x.heures} heure${x.heures > 1 ? 's' : ''} plus tard, ${this.a('il', 'elle')} se relève.`, 4200);
          break;
        case 'evolution': this.son('reveal'); this.dire(`${this.nom} a atteint le stade ${NOM_STADE[x.vers]} !`, 4200); break;
        case 'maladie': this.bulle(IMG.malade, 2600); break;
        case 'blessure': this.bulle(IMG.blesse, 2600); break;
        default: break;
      }
    }
  }

  // —— musique : la piste en cours s'éteint, puis la suivante monte (jamais les deux à la fois)
  geste = () => { Sons.eveiller(); this.musiqueOK = true; };
  pisteVoulue(): keyof typeof MUSIQUES | null {
    const s = this.state;
    if (this.props.reglages?.musique === false) return null;
    // un combat de scène a sa propre musique ; la cinématique du sentier solitaire aussi (silence, puis Leomon)
    if (s.combatScene || s.nyxara) return null;
    if (s.rencontre && s.rencontre.phase !== 'issue') return 'combat';
    if (this.pnjIci().some((p) => p.id === 'morthen') || s.scene?.id === 'morthen') return 'morthen';
    return ZONES[s.zone].grotte ? 'caverne' : 'explo';
  }
  pasMusique() {
    if (!this.musiqueOK) return;
    if (!this.pistes) {
      const mk = (n: string) => { const a = new Audio(asset(`sons/musiques/${n}.mp3`)); a.loop = true; a.volume = 0; return a; };
      this.pistes = { explo: mk(MUSIQUES.explo), caverne: mk(MUSIQUES.caverne), combat: mk(MUSIQUES.combat), morthen: mk(MUSIQUES.morthen) };
    }
    const voulue = this.pisteVoulue(), cible = 0.34 * volumeMusique();
    const autres = (Object.entries(this.pistes) as [keyof typeof MUSIQUES, HTMLAudioElement][]).filter(([k, a]) => k !== voulue && !a.paused);
    if (autres.length) {
      const vite = voulue === 'combat' ? 0.05 : 0.025; // ≈ 0,7 s vers le combat, ≈ 1,4 s sinon
      autres.forEach(([, a]) => { a.volume = Math.max(0, a.volume - vite); if (a.volume <= 0) { a.pause(); a.currentTime = 0; } });
      return;
    }
    if (!voulue) return;
    const a = this.pistes[voulue];
    if (a.paused) a.play().catch(() => { this.musiqueOK = false; });
    a.volume = a.volume < cible ? Math.min(cible, a.volume + 0.012) : Math.max(cible, a.volume - 0.012); // ≈ 3 s de montée
  }

  dire(texte: string, ms = 2600) { this.setState({ toast: { texte, id: Math.random() } }); clearTimeout(this.tToast); this.tToast = window.setTimeout(() => { if (this.vivant) this.setState({ toast: null }); }, ms); }
  bulle(src: string, ms = 2200) { this.setState({ bulle: { src, id: Math.random() } }); clearTimeout(this.tBulle); this.tBulle = window.setTimeout(() => { if (this.vivant) this.setState({ bulle: null }); }, ms); }
  occupe() { const s = this.state; return !!(s.marche || s.fouille || s.peche || s.envoi || s.rencontre || s.recolte || s.tente || s.fin || s.carte || s.sacOuvert || s.carnet || s.scene || s.nyxara || this.e.mort); }
  heure() { return Math.floor(this.e.minute / 60) % 24; }
  nuit() { const h = this.heure(); return h >= 21 || h < 5; }
  fait(action: string) { return faitCeJour(this.monde, this.state.zone, action, this.e.jour); }
  marquer(action: string) { marquerFait(this.monde, this.state.zone, action, this.e.jour); }
  /** Range un objet dans le sac du jeu (10 emplacements). Renvoie faux si le sac est plein. */
  ranger(id: string, qte = 1) { return rangerObjet(this.e, id, qte) > 0; }
  aDansLeSac(id: string) { return this.e.inventaire.some((c) => c?.id === id && c.qte > 0); }
  probaRencontre(zone: number) {
    return probaRencontre(this.monde, zone, this.maintenant(), { base: BASE_RENCONTRE, nuitDehors: this.nuit() && !ZONES[zone].grotte, repousse: this.repousse() });
  }

  // —— marcher : l'écho part vers le passage choisi, le décor change, il arrive à sa place dans le nouveau lieu
  aller(vers: number | null, retour = false) {
    if (this.occupe()) return;
    if (vers == null) { Sons.clic(); this.dire('Le passage est encore impraticable.'); return; }
    const s = this.state, depuis = s.zone, z = ZONES[vers];
    const ch = this.chemins(depuis).find((c) => c.vers === vers);
    // 1) l'écho s'éloigne : vers le passage (en avant) ou vers vous (en arrière)
    const sortie = retour || !ch ? { x: s.filo.x, y: 900, s: 1.25, o: 0 } : { x: ch.pos[0], y: ch.pos[1] + 40, s: echelle(ch.pos[1] + 40) * 0.85, o: 0 };
    Sons.pas(ZONES[depuis].grotte, 5);
    this.setState({ marche: true, survol: null, filo: { ...sortie, dir: sortie.x >= s.filo.x ? 1 : -1, cls: 'marche', duree: 1000 } });
    // le décor d'arrivée (et ses PNJ) doit être prêt avant de changer : déjà préchargé d'ordinaire (lieux voisins),
    // sinon on le demande en priorité et on l'attend, au plus 3 s, l'écho déjà sorti du cadre
    const images = imagesZone(vers, z.fond, this.ctx());
    if (!estPret(images)) precharger(images, { urgent: true });
    const attendre = (n: number) => (estPret(images) || n >= 60 ? arriver() : this.plus(50, () => attendre(n + 1)));
    const arriver = () => {
      const nouveau = decouvrir(this.monde, vers);
      const [fx, fy] = this.placeEcho(vers);
      // 2) le décor change ; l'écho est replacé hors champ, du côté d'où l'on arrive
      const entree = retour ? { x: 640, y: 380, s: echelle(380) * 0.8, o: 0 } : { x: fx + (fx < 640 ? -80 : 80), y: 900, s: 1.2, o: 0 };
      const historique = retour ? this.state.historique.slice(0, -1) : [...this.state.historique, depuis];
      this.setState({
        ancien: depuis, zone: vers, sens: retour ? 'arriere' : 'avant', historique, nouveauLieu: nouveau ? Math.random() : null,
        filo: { ...entree, dir: fx < 640 ? 1 : -1, cls: 'marche', duree: 0 },
      });
      this.props.surLieu?.(vers, historique);
      this.sauver({ zone: vers, historique });
      Sons.pas(z.grotte, 5);
      // 3) l'écho vient prendre sa place
      this.plus(260, () => this.setState({ filo: { x: fx, y: fy, s: echelle(fy), o: 1, dir: fx < 640 ? 1 : -1, cls: 'marche', duree: 1150 } }));
      this.plus(1450, () => {
        this.setState({ marche: false, ancien: null, filo: { ...this.state.filo, dir: this.regard(vers, fx), cls: '', duree: 0 } });
        // le sentier solitaire : un cri, au premier passage en journée
        if (vers === ZONE_NYXARA && !retour && nyxaraPossible(this.ctx())) {
          this.setState({ nyxara: true });
          this.plus(2000, () => { Sons.rencontre(); this.bulle(IMG.surpris, 2000); this.setState({ appel: true }); });
          return;
        }
        // pas d'écho sauvage qui surgisse au milieu d'une rencontre avec un PNJ
        if (this.pnjIci(vers).length) return;
        if (z.echo && Math.random() < this.probaRencontre(vers)) this.plus(300, () => this.surgir([]));
        else if (nouveau && Math.random() < 0.45) this.plus(200, () => this.bulle(IMG.surpris, 1600));
        else if (z.grotte && Math.random() < 0.2) this.plus(200, () => this.bulle(IMG.anxieux));
      });
      this.prechargerVoisins(vers);
    };
    this.plus(850, () => attendre(0));
  }
  /** Les lieux où mènent les chemins d'ici : leur décor et leurs PNJ, chargés pendant qu'on s'y attarde. */
  prechargerVoisins(zone: number) {
    const c = this.ctx();
    precharger(this.chemins(zone).flatMap((ch) => (ch.vers != null && ZONES[ch.vers] ? imagesZone(ch.vers, ZONES[ch.vers].fond, c) : [])));
  }
  revenir() {
    if (this.occupe()) return;
    const h = this.state.historique;
    if (!h.length) { if (this.state.zone === DEPART) this.versVillage(); else this.rentrer(); return; }
    this.aller(h[h.length - 1], true);
  }
  /** « Revenir au village » (Sortie du village) : la page de retour, puis la forêt du village. */
  versVillage() { if (this.occupe()) return; Sons.pas(false, 3); this.rentrer(false, 'village'); }
  /** La page de retour au ranch (ou au village) : ce que la sortie a rapporté. */
  rentrer(apresDefaite = false, vers: 'ranch' | 'village' = 'ranch') {
    this.son('page', 0.8);
    const b = this.props.bilan, e = this.e;
    const maintenant: Record<string, number> = {};
    e.inventaire.forEach((c) => { if (c) maintenant[c.id] = (maintenant[c.id] ?? 0) + c.qte; });
    const objets = Object.entries(maintenant).filter(([k, q]) => q > (b.inventaire[k] ?? 0)).map(([k, q]) => {
      const d = descriptionObjet(k);
      return { icone: d ? asset(d.icone) : '', texte: `${q - (b.inventaire[k] ?? 0)} ${(d?.nom ?? k)}` };
    });
    const materiaux = RESSOURCES.filter((r) => (this.monde.ressources[r] ?? 0) > (b.ressources[r] ?? 0))
      .map((r) => ({ icone: imageRessource(r), texte: `${(this.monde.ressources[r] ?? 0) - (b.ressources[r] ?? 0)} ${NOMS_RESSOURCES[r].toLowerCase()}` }));
    const lieux = this.monde.decouvertes.filter((z) => !b.decouvertes.includes(z) && z !== DEPART).map((z) => ZONES[z].nom);
    this.sauver();
    this.setState({
      rencontre: null, tente: null, sacOuvert: false, fin: {
        vers,
        titre: apresDefaite ? 'Retour précipité' : vers === 'village' ? 'De retour au village' : 'De retour au ranch',
        objets, materiaux,
        lieux: lieux.length ? 'Notés sur la carte : ' + lieux.slice(0, 6).join(', ') + (lieux.length > 6 ? '…' : '.') : 'Aucun lieu nouveau cette fois.',
        filo: e.blesse || e.malade ? `${this.nom} boite un peu. ${this.Il} aura besoin de repos et de soins.`
          : apresDefaite ? `${this.nom} traîne la patte : une bonne nuit lui fera du bien.`
            : vers === 'village' ? `${this.nom} trottine vers les premières maisons.` : `${this.nom} file droit vers sa paille.`,
      },
    });
  }

  // —— fouiller : cinq cachettes ; un écho peut s'y cacher, et l'on se bat alors pour récupérer ses trouvailles
  fouiller() {
    const s = this.state, z = ZONES[s.zone];
    if (this.occupe()) return;
    if (!z.fouille.length) { this.dire('Il n’y a rien à fouiller ici.'); return; }
    const garde = this.bloque();
    if (garde) { Sons.clic(); this.dire(garde); return; }
    if (this.fait('fouiller')) { this.dire('Vous avez déjà retourné chaque recoin aujourd’hui.'); return; }
    Sons.froissement();
    const types: Carte['type'][] = ['echo', 'objet', 'objet', 'objet', 'vide'];
    // un écho déjà croisé ici depuis peu se cache moins souvent
    if (!z.echo || Math.random() > facteurRecence(this.monde.rencontres[s.zone], this.maintenant())) types[0] = 'vide';
    // la repousse : une chance sur deux que l'écho caché laisse place à une trouvaille
    else if (this.repousse() && Math.random() < 0.5) types[0] = 'objet';
    for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
    const lieux = CACHETTES[z.region];
    const cartes = types.map((type, i) => ({
      lieu: lieux[i], type, revele: false,
      objet: type === 'objet' ? (z.rareFouille && Math.random() < z.rareFouille.chance ? z.rareFouille.id : alea(z.fouille)) : null,
    }));
    this.marquer('fouiller');
    this.setState({ fouille: { cartes, gains: [], fini: false, message: 'Choisissez où chercher. Vous pouvez vous arrêter quand vous voulez.' } });
  }
  retourner(i: number) {
    const f = this.state.fouille; if (!f || f.fini || f.cartes[i].revele) return;
    const cartes = f.cartes.map((c, j) => (j === i ? { ...c, revele: true } : c));
    const c = cartes[i];
    if (c.type === 'echo') {
      Sons.rencontre();
      this.setState({ fouille: { ...f, cartes, fini: true, perdu: true, message: 'Deux yeux s’allument dans l’ombre… Un écho sauvage jaillit et disperse vos trouvailles !' } });
      const enjeu = f.gains.slice();
      this.plus(1900, () => { this.setState({ fouille: null }); this.passer(DUREES.fouiller); if (!this.e.mort) this.surgir(enjeu); });
      return;
    }
    if (c.type === 'objet' && c.objet) { Sons.trouvaille(); this.setState({ fouille: { ...f, cartes, gains: [...f.gains, c.objet], message: `${c.lieu} : ${nomObjet(c.objet).toLowerCase()} !` } }); }
    else { Sons.rien(); this.setState({ fouille: { ...f, cartes, message: `${c.lieu} : rien, sinon de la terre sous les ongles.` } }); }
    if (cartes.every((x) => x.revele)) this.plus(700, () => this.arreterFouille());
  }
  arreterFouille() {
    const f = this.state.fouille; if (!f || f.fini) return;
    let plein = false; f.gains.forEach((id) => { if (!this.ranger(id, 1)) plein = true; });
    const texte = f.gains.length ? `Vous rangez ${f.gains.length > 1 ? 'vos trouvailles' : 'votre trouvaille'} dans le sac.` + (plein ? ' Le sac déborde : il a fallu en laisser.' : '') : 'Vous repartez les mains vides.';
    this.setState({ fouille: { ...f, fini: true, message: texte } });
    if (f.gains.length) this.bulle(IMG.joyeux);
    this.passer(DUREES.fouiller);
  }
  fermerFouille() { if (this.state.fouille && !this.state.fouille.fini) this.arreterFouille(); this.setState({ fouille: null }); }

  // —— récolter : bois, pierre, fibres… selon le lieu ; les ressources vont au monde (plafond de 5)
  recolter() {
    if (this.occupe()) return;
    const g = groupeMat(this.state.zone);
    if (!g) { this.dire('Rien à récolter ici.'); return; }
    if (this.fait('recolter')) { this.dire('Vous avez déjà ramassé tout ce qui pouvait l’être aujourd’hui.'); return; }
    this.marquer('recolter'); Sons.coups();
    this.setState({ recolte: { phase: 'travail' } });
    this.plus(1600, () => {
      const pool = MAT_POOLS[g], gains: { k: Ressource; q: number }[] = [];
      const n = Math.random() < 0.55 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const entrees = Object.entries(pool.w) as [Ressource, number][];
        const tot = entrees.reduce((a, [, w]) => a + w, 0); let x = Math.random() * tot; let k: Ressource | null = null;
        for (const [cle, w] of entrees) { if (x < w) { k = cle; break; } x -= w; }
        if (!k || gains.some((gg) => gg.k === k)) continue;
        const [lo, hi] = pool.q[k]!; const q = lo + Math.floor(Math.random() * (hi - lo + 1));
        const range = ajouterRessource(this.monde, k, q);
        if (range > 0) gains.push({ k, q: range });
      }
      Sons.trouvaille(); this.passer(DUREES.recolter);
      this.setState({ recolte: { phase: 'fin', gains: gains.map((gg) => ({ image: imageRessource(gg.k), texte: `+${gg.q} ${NOMS_RESSOURCES[gg.k].toLowerCase()}` })),
        texte: gains.length ? `${this.nom} traîne les branches avec application.` : 'Vos besaces de ressources sont déjà pleines.' } });
    });
  }

  // —— pêcher : le bouchon dérive, plonge… il faut ferrer au bon moment
  pecher() {
    if (this.occupe()) return;
    if (!this.aDansLeSac('canne_peche')) { this.dire('Il vous faudrait une canne à pêche.'); return; }
    this.lancer();
  }
  lancer() {
    clearTimeout(this.tPeche); Sons.plouf();
    this.setState({ peche: { phase: 'lancer' } });
    this.tPeche = window.setTimeout(() => {
      this.setState({ peche: { phase: 'attente' } });
      this.tPeche = window.setTimeout(() => {
        Sons.touche(); this.setState({ peche: { phase: 'touche' } });
        // la gélatine de Bourbella : le poisson garde l'appât un peu plus longtemps
        const fenetre = 950 + (bonusPeche(this.monde, this.heureAbs()) ? 350 : 0);
        this.tPeche = window.setTimeout(() => { Sons.rate(); this.passer(DUREES.pecher); this.setState({ peche: { phase: 'echappe', texte: 'Le bouchon remonte. Le poisson a filé avec l’appât.' } }); }, fenetre);
      }, 2200 + Math.random() * 3800);
    }, 900);
  }
  ferrer() {
    const p = this.state.peche; if (!p) return;
    if (p.phase === 'attente' || p.phase === 'lancer') { clearTimeout(this.tPeche); Sons.rate(); this.passer(DUREES.pecher); this.setState({ peche: { phase: 'echappe', texte: 'Trop tôt ! L’eau se trouble, les poissons se méfient.' } }); return; }
    if (p.phase !== 'touche') return;
    clearTimeout(this.tPeche); this.passer(DUREES.pecher);
    const z = ZONES[this.state.zone];
    // ferré à temps : 80 % de prises, + 15 points avec la gélatine de Bourbella (« Améliorer la pêche »)
    if (Math.random() < Math.min(0.98, 0.8 + bonusPeche(this.monde, this.heureAbs()))) {
      const id = alea(z.poissons.length ? z.poissons : ['poisson_vairon']);
      const ok = this.ranger(id, 1); Sons.prise(); this.bulle(IMG.joyeux);
      this.setState({ peche: { phase: 'prise', objet: { nom: nomObjet(id), icone: iconeObjet(id) }, texte: ok ? `${this.nom} trépigne au bord de l’eau.` : 'Le sac est plein : vous le relâchez à regret.' } });
    } else { Sons.rate(); this.setState({ peche: { phase: 'echappe', texte: 'Ferré… et décroché au ras de l’eau.' } }); }
  }
  fermerPeche() { clearTimeout(this.tPeche); this.setState({ peche: null }); }

  // —— envoyer l'écho : il part fouiner seul, et revient… plus ou moins seul
  envoyer() {
    const s = this.state, z = ZONES[s.zone];
    if (this.occupe()) return;
    if (!z.envoi.length) { this.dire(`${this.nom} renifle, puis revient s’asseoir : rien à flairer ici.`); return; }
    const garde = this.bloque();
    if (garde) { Sons.clic(); this.dire(garde); return; }
    if (this.fait('envoyer')) { Sons.clic(); this.dire(`${this.nom} a déjà ratissé les environs aujourd’hui.`); return; }
    if (aBoutDeForces(this.e)) { this.bulle(IMG.anxieux); this.dire(`${this.nom} est à bout de forces : ${this.a('il', 'elle')} ne s’éloignera pas de vous.`, 3200); return; }
    if (this.e.blesse || this.e.malade) { this.bulle(this.e.blesse ? IMG.blesse : IMG.malade); this.dire(`${this.nom} vous regarde, puis se couche. Pas dans cet état.`); return; }
    const [px, py] = this.placeSauvage(s.zone);
    Sons.froissement(); this.marquer('envoyer');
    this.setState({ envoi: { phase: 'depart', x: px, y: py }, filo: { x: px, y: py, s: echelle(py) * 0.8, o: 0, dir: px >= s.filo.x ? 1 : -1, cls: 'marche', duree: 1250 } });
    this.plus(1300, () => { this.setState({ envoi: { ...this.state.envoi!, phase: 'fouine' } }); Sons.froissement(); });
    this.plus(2600, () => Sons.froissement());
    this.plus(4200, () => {
      const T = this.temp();
      const pEcho = T.echoEnvoi * facteurRecence(this.monde.rencontres[this.state.zone], this.maintenant()) * (this.repousse() ? 0.5 : 1);
      const trouve = Math.random() < T.trouve;
      let res: NonNullable<Envoi['res']>;
      if (trouve && z.echo && Math.random() < pEcho) res = { type: 'echo' };
      else if (trouve) res = { type: 'objet', id: z.rareEnvoi && Math.random() < z.rareEnvoi.chance * T.rare ? z.rareEnvoi.id : alea(z.envoi), qte: Math.random() < 0.12 ? 2 : 1 };
      else res = { type: 'rien' };
      const [fx, fy] = this.placeEcho(this.state.zone);
      this.setState({ envoi: { ...this.state.envoi!, phase: 'retour', res }, filo: { x: fx, y: fy, s: echelle(fy), o: 1, dir: fx >= px ? 1 : -1, cls: res.type === 'echo' ? 'marche fuite' : 'marche', duree: res.type === 'echo' ? 650 : 1150 } });
      this.passer(DUREES.envoyer);
      this.plus(res.type === 'echo' ? 700 : 1250, () => {
        this.setState({ filo: { ...this.state.filo, dir: this.regard(this.state.zone, fx), cls: '', duree: 0 } });
        if (this.e.mort) { this.setState({ envoi: null }); return; }
        if (res.type === 'echo') { this.setState({ envoi: null }); this.surgir([]); return; }
        let texte = `${this.nom} revient bredouille, des brindilles plein le pelage.`;
        if (res.type === 'objet' && res.id) {
          Sons.trouvaille(); this.bulle(IMG.fier);
          texte = this.ranger(res.id, res.qte) ? `${this.nom} dépose sa trouvaille à vos pieds, ${this.a('tout fier', 'toute fière')}.` : `${this.nom} la dépose à vos pieds… mais le sac est plein.`;
        } else Sons.rien();
        this.sauver();
        this.setState({ envoi: { phase: 'resultat', x: px, y: py, res, objet: res.type === 'objet' && res.id ? { nom: ((res.qte ?? 1) > 1 ? '2 × ' : '') + nomObjet(res.id), icone: iconeObjet(res.id) } : null, texte } });
      });
    });
  }
  fermerEnvoi() { this.setState({ envoi: null }); }

  // —— un écho sauvage : tiré selon le lieu (âge, graines possibles)
  surgir(enjeu: string[]) {
    const zone = this.state.zone, z = ZONES[zone], cfg = z.echo ?? { ageMin: 1, ageMax: 3, cles: [] };
    const sv = creerEchoSauvage(Math.random, cfg.ageMin, cfg.ageMax, cfg.cles as Graine[], nomsPris(this.e));
    const ecart = sv.ageJours - ageJours(this.e);
    const fort: Fort = ecart >= 4 ? 'bien plus fort' : ecart >= 2 ? 'plus fort' : 'de taille';
    const T = temperamentTerrain(this.e), N = this.nom;
    const reaction = aBoutDeForces(this.e)
      ? `${N}, à bout de forces, se tasse contre vos jambes. Pas question de se battre dans cet état.`
      : fort === 'bien plus fort'
      ? (T === 'fonceur' ? `${N} gronde… mais ses pattes tremblent. ${sv.genre === 'f' ? 'Celle-là' : 'Celui-là'} est d’une autre trempe.` : `${N} se plaque contre vos jambes. ${sv.genre === 'f' ? 'Celle-là' : 'Celui-là'} est d’une autre trempe.`)
      : fort === 'plus fort'
        ? (T === 'prudent' ? `${N} recule d’un pas, les oreilles en arrière.` : `${N} se campe, ${this.a('hésitant', 'hésitante')}, le poil hérissé.`)
        : (T === 'prudent' ? `${N} jauge l’intrus, ${this.a('prêt', 'prête')} à se défendre s’il le faut.` : `${N} se campe, le poil hérissé, ${this.a('tout content', 'toute contente')} d’en découdre.`);
    noterRencontre(this.monde, zone, this.maintenant());
    this.sauver();
    Sons.rencontre(); this.bulle(fort === 'bien plus fort' ? IMG.anxieux : IMG.surpris);
    precharger(this.imagesCombat(zone, sv), { urgent: true }); // l'écran de combat, s'il le faut, n'attendra pas ses images
    const f = this.state.filo, [sx, sy] = this.placeSauvage(zone);
    this.setState({ rencontre: { phase: 'apparition', zone, sauvage: sv, enjeu, x: sx, y: sy, fort, reaction }, filo: { ...f, dir: sx >= f.x ? 1 : -1, duree: 0 } });
    this.plus(1500, () => this.setState((s) => (s.rencontre ? { rencontre: { ...s.rencontre, phase: 'choix' } } : null)));
  }
  affronter() { const r = this.state.rencontre; if (!r || r.phase !== 'choix' || aBoutDeForces(this.e)) return; Sons.clic(); this.engager(r); }
  eclipser() {
    const r = this.state.rencontre; if (!r || r.phase !== 'choix') return;
    // à bout de forces, l'écho n'intéresse plus l'écho sauvage : on s'éclipse toujours
    if (aBoutDeForces(this.e)) {
      Sons.pas(ZONES[this.state.zone].grotte);
      this.setState({ rencontre: { ...r, phase: 'issue', issue: 'fuite', texte: `${r.sauvage.nom} renifle ${this.nom}, puis passe son chemin.` + (r.enjeu.length ? ' Vos trouvailles, elles, sont restées par terre.' : '') } });
      return;
    }
    if (Math.random() < this.temp().fuite * (r.fort === 'bien plus fort' ? 0.8 : 1)) {
      Sons.pas(ZONES[this.state.zone].grotte);
      this.setState({ rencontre: { ...r, phase: 'issue', issue: 'fuite', texte: `Vous filez sans bruit. ${r.sauvage.nom} ne vous suit pas.` + (r.enjeu.length ? ' Vos trouvailles, elles, sont restées par terre.' : '') } });
    } else {
      Sons.rencontre();
      this.engager({ ...r, coupe: `${r.sauvage.nom} vous coupe la route !` });
    }
  }
  /** Les images de l'écran de combat (comme `imagesEcran` dans main.tsx) : décor du lieu, écho sauvage, notre écho. */
  imagesCombat(zone: number, sv: Rencontre['sauvage']) {
    return [ZONES[zone].fond, apparence({ ...sv, evolution: null } as unknown as Etat), apparence(this.e)];
  }
  /**
   * « En garde ! » : la page annonce le combat ; le temps de la lire (et que les images du combat soient prêtes),
   * l'exploration zoome vers l'écho sauvage en se fondant dans le décor du combat, puis l'écran de combat prend le relais.
   */
  engager(r: Rencontre) {
    // le décor du combat se pose tout de suite sous l'exploration (caché par elle) : le zoom n'aura qu'à s'animer
    const terrain = ZONES[r.zone].fond, cx = r.x, cy = Math.round(r.y - 90 * echelle(r.y));
    this.setState({ rencontre: { ...r, phase: 'combat' }, versCombat: { x: cx, y: cy, terrain, zoom: false } });
    const images = precharger(this.imagesCombat(r.zone, r.sauvage), { urgent: true, delai: 2500 });
    const lecture = new Promise<void>((ok) => this.plus(r.coupe ? LECTURE_COUPE : LECTURE_ENGAGEMENT, ok));
    Promise.all([images, lecture]).then(() => {
      if (!this.vivant || this.e.mort) return;
      this.enCombat = true;
      this.sauver();
      this.setState((s) => ({ versCombat: s.versCombat && { ...s.versCombat, zoom: true } }));
      const { zone, sauvage, enjeu, x, y } = r;
      let fait = false;
      const suite = () => { if (fait || !this.vivant) return; fait = true; this.props.surCombat(this.e, this.monde, { zone, sauvage, enjeu, x, y }); };
      // l'écran de combat attend la fin réelle du zoom (une image lente à peindre ne le coupe pas en route)
      const el = this.cadreZoom.current;
      const anim = el?.animate?.([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.25)', opacity: 0.75, offset: 0.55 },
        { transform: 'scale(1.6)', opacity: 0 },
      ], { duration: DUREE_ZOOM_COMBAT, easing: 'cubic-bezier(.45,0,.75,.6)', fill: 'forwards' });
      if (anim) anim.finished.then(suite, suite);
      this.plus(DUREE_ZOOM_COMBAT + 700, suite);
    });
  }
  /** Retour de l'écran de combat : l'issue s'écrit sur la page de la rencontre. */
  retourDeCombat({ rencontre, resultat, plein }: RetourCombat) {
    const sv = rencontre.sauvage, N = this.nom;
    const base: Rencontre = { ...rencontre, phase: 'issue', fort: 'de taille', reaction: '', issue: resultat };
    if (resultat === 'victoire') {
      Sons.prise(); this.bulle(IMG.fier, 2600);
      this.setState({ rencontre: { ...base, texte: `${sv.nom} détale dans les fourrés. ${N} se rengorge.` + (rencontre.enjeu.length ? (plein ? ' Vous ramassez ce que le sac peut contenir.' : ' Vous ramassez vos trouvailles éparpillées.') : '') } });
    } else if (resultat === 'defaite') {
      Sons.rate(); this.bulle(this.e.blesse ? IMG.blesse : IMG.anxieux, 3000);
      this.setState({ rencontre: { ...base, texte: `${N} est à terre. ${sv.nom} renifle, puis s’en va comme ${sv.genre === 'f' ? 'elle est venue' : 'il est venu'}. ${N} n’est plus en état de se battre aujourd’hui : un somme sous la tente ou au ranch lui rendra ses forces.` } });
    } else {
      Sons.pas(ZONES[this.state.zone].grotte);
      this.setState({ rencontre: { ...base, texte: `Vous battez en retraite. ${sv.nom} ne vous suit pas.` + (rencontre.enjeu.length ? ' Vos trouvailles, elles, sont restées par terre.' : '') } });
    }
  }
  fermerRencontre() { this.setState({ rencontre: null }); }

  // —— camper : planter la tente, s'y glisser avec l'écho, et s'en occuper
  camper(repas = false) {
    if (this.occupe()) return;
    if (!this.aDansLeSac('tente')) { Sons.clic(); this.dire('Il vous faudrait une tente.'); return; }
    Sons.toile();
    this.setState({ tente: { phase: 'entree', texte: `Vous plantez la tente. ${this.nom} s’y faufile ${this.a('le premier', 'la première')}.`, choixRepas: false } });
    this.plus(900, () => this.setState((s) => (s.tente ? { tente: { ...s.tente, phase: 'dedans', choixRepas: repas && this.repas().length > 0 } } : null)));
  }
  /** Les aliments du sac (index de case, aliment). */
  repas() { return this.e.inventaire.flatMap((c, i) => { const al = c && aliment(c.id); return al && c ? [{ i, al, qte: c.qte }] : []; }); }
  soin(cle: 'nourrir' | 'laver' | 'soigner' | 'dormir', index?: number) {
    const t = this.state.tente; if (!t || t.phase !== 'dedans' || t.occupe) return;
    const N = this.nom, sim = this.sim;
    const anim = (nom: string, texte: string) => {
      this.setState({ tente: { ...t, choixRepas: false, anim: nom, texte } });
      this.plus(1600, () => { if (this.state.tente && !this.state.tente.occupe) this.setState({ tente: { ...this.state.tente, anim: '' } }); });
    };
    const dire = (texte: string) => this.setState({ tente: { ...t, choixRepas: false, texte } });
    if (cle === 'nourrir') {
      if (index == null) {
        if (!this.repas().length) { dire('Le sac ne contient rien à manger.'); Sons.rien(); return; }
        Sons.clic(); this.setState({ tente: { ...t, choixRepas: !t.choixRepas } }); return;
      }
      const r = sim.nourrir(index);
      const sorties = sim.vider();
      this.traiter(sorties);
      if (!r.ok) { this.son('refus'); dire(r.raison); this.sauver(); return; }
      this.son('croque'); this.bulle(asset(lireSignes(this.e).expression.icone));
      anim('mange', r.texte);
      this.passer(DUREES.nourrir);
    } else if (cle === 'laver') {
      const r = sim.laver(); // deux heures : la propreté ne revient qu'à la fin
      const sorties = sim.vider();
      if (!r.ok) { this.traiter(sorties); return; }
      const texte = sorties.find((x): x is Extract<Sortie, { type: 'message' }> => x.type === 'message')?.texte ?? `${N} s’ébroue.`;
      this.traiter(sorties.filter((x) => x.type !== 'message'));
      this.son('eau'); this.bulle(IMG.joyeux);
      anim('lave', `Un peu d’eau de la gourde, un coup de chiffon… ${texte}`);
      this.sauver();
    } else if (cle === 'soigner') {
      const e = this.e;
      if (!e.blesse && !e.malade) { dire(`${N} n’a pas une égratignure.`); return; }
      const id = e.blesse ? 'bandage' : 'medicament';
      const i = e.inventaire.findIndex((c) => c?.id === id);
      if (i < 0) { Sons.rien(); dire(e.blesse ? 'Il vous faudrait un pansement : le sac n’en contient pas.' : 'Il vous faudrait un médicament : le sac n’en contient pas.'); return; }
      const r = sim.utiliser(i);
      const sorties = sim.vider();
      if (!r.ok) { dire(r.raison); return; }
      this.traiter(sorties);
      this.son('caresse'); this.bulle(IMG.joyeux);
      anim('soin', id === 'bandage' ? `Vous pansez ses égratignures. ${this.Il} se laisse faire, les yeux mi-clos.` : `${N} avale le médicament en grimaçant, puis retrouve des couleurs.`);
      this.passer(DUREES.soigner);
    } else if (cle === 'dormir') {
      const nuit = this.nuit() || this.heure() >= 20;
      const r = sim.coucher();
      const sorties = sim.vider();
      if (!r.ok) { this.son('refus'); dire(`${N} n’a pas sommeil : ${this.a('il', 'elle')} préfère garder un œil sur l’entrée de la tente.`); return; }
      this.son('berceuse');
      this.setState({ sommeil: true, tente: { ...t, choixRepas: false, occupe: true, anim: 'dort', texte: nuit ? `${N} se roule en boule contre vous. La nuit passe…` : 'Une petite sieste à l’abri de la toile…' } });
      this.plus(3200, () => {
        this.traiter(sorties.filter((x) => x.type !== 'sommeil'));
        this.sauver();
        const h = r.heures;
        this.setState((s) => ({ sommeil: false, tente: s.tente ? { ...s.tente, occupe: false, anim: '', texte: `${h} heure${h > 1 ? 's' : ''} plus tard, ${N} s’étire, ${this.a('ragaillardi', 'ragaillardie')}.` } : null }));
        this.bulle(IMG.joyeux);
      });
    }
  }
  sortirTente() { if (!this.state.tente || this.state.tente.occupe) return; Sons.toile(); this.setState({ tente: { ...this.state.tente, phase: 'sortie' } }); this.plus(600, () => this.setState({ tente: null })); }

  // —— le sac : celui du ranch (src/jeu/commun/InterfaceRanch.tsx), le carnet simplifié
  ouvrirLeSac() {
    if (this.state.sacOuvert || this.occupe()) return;
    this.setState({ sacOuvert: true });
  }
  /** « Utiliser » depuis le sac : un aliment ou un soin se donne sous la tente, la canne sert à pêcher. */
  utiliserDepuisSac(index: number, fermerSac: (puis?: () => void) => void) {
    const id = this.e.inventaire[index]?.id;
    if (!id) return;
    const z = ZONES[this.state.zone];
    const soin = id === 'bandage' || id === 'medicament';
    if (aliment(id) || soin) { fermerSac(() => (this.aDansLeSac('tente') ? this.camper(!soin) : this.dire(soin ? 'Pour le soigner, il faut d’abord planter la tente.' : 'Pour lui donner à manger, il faut d’abord planter la tente.'))); }
    else if (id === 'canne_peche') { fermerSac(() => (z.eau ? this.pecher() : this.dire('Pas d’eau ici pour pêcher.'))); }
    else if (id === 'tente') { fermerSac(() => this.camper()); }
    else if (id === 'repousse') {
      const i = this.e.inventaire.findIndex((c) => c?.id === 'repousse');
      if (i < 0 || !consommer(this.e, i)) return;
      poserRepousse(this.monde, this.heureAbs());
      this.repousseVue = true;
      this.sauver();
      fermerSac(() => { Sons.froissement(); this.dire('Vous vaporisez la repousse : les échos sauvages se tiendront à distance une demi-journée.', 3800); });
    }
    else { this.son('refus'); this.dire('Rien à en faire ici.'); }
  }

  render(): ReactNode {
    const s = this.state, p = this.props;
    return (
      <>
        <Repere fond="#120c08">
          {/* vers le combat : le décor du combat attend dessous, l'exploration zoome vers l'écho sauvage et s'efface */}
          {s.versCombat && <FondCombat registre="exploration" terrain={s.versCombat.terrain} />}
          <div ref={this.cadreZoom} style={{ position: 'absolute', inset: 0, ...(s.versCombat ? { transformOrigin: `${s.versCombat.x}px ${s.versCombat.y}px`, willChange: 'transform, opacity' } : null) }}>
          <VueExploration v={this.valeurs()} />
          <Calque minute={this.e.minute} sons={p.reglages?.sons !== false} devant={s.sacOuvert || s.carnet} nuit={false} z={70}>
            <BoutonSac top={128} cache={this.occupe()} ouvrir={() => this.ouvrirLeSac()} />
            <BoutonCarnet top={238} cache={this.occupe()} ouvrir={() => { if (!this.occupe()) this.setState({ carnet: true }); }} />
            {s.sacOuvert && <Sacoche etat={this.e} ressources={this.monde.ressources} surFerme={() => this.setState({ sacOuvert: false })}
              surUtiliser={(i, fermer) => this.utiliserDepuisSac(i, fermer)} sauver={() => this.sauver()} />}
            {s.carnet && <PetitCarnet etat={this.e} portrait={this.assets.get(apparence(this.e))?.url} reglages={p.reglages ?? { sons: true, musique: true }}
              surReglages={p.surReglages} surMenu={p.surMenu} sauver={() => this.sauver()} surFerme={() => this.setState({ carnet: false })} monde={this.monde} />}
          </Calque>
          </div>
        </Repere>
        {s.scene && (
          <ScenePnj key={s.scene.cle} id={s.scene.id} sujet={s.scene.sujet} etat={this.e} monde={this.monde} personnage={p.personnage}
            catalogue={p.catalogue} sons={p.reglages?.sons !== false} musique={p.reglages?.musique !== false} sim={this.sim}
            sauver={() => this.sauver()} surSorties={(x) => this.traiter(x)} surNote={(t) => this.dire(t, 3200)}
            surCombat={(actif) => { this.enCombat = actif; this.setState({ combatScene: actif }); }}
            surMort={() => { this.sauver({ fin: true }); this.props.surMort(this.e); }}
            surFin={({ sortie }) => this.finScene(sortie)} />
        )}
      </>
    );
  }

  valeurs() {
    const s = this.state, e = this.e;
    const z = ZONES[s.zone], h = this.heure();
    const L = lumiere(e.minute, z.grotte);
    const libre = !this.occupe();
    const connu = (id: number) => this.monde.decouvertes.includes(id);
    const N = this.nom;
    const signes = lireSignes(e);
    const niveau = (b: string) => signes.besoins.find((x) => x.besoin === b)?.urgence ?? 0;
    // passages : une flèche tracée à l'encre claire ; le nom n'apparaît qu'au survol
    const passages = this.chemins(s.zone).map((c, i) => {
      const bloque = c.vers == null;
      const nom = bloque ? c.texte.replace(/^Aller vers /, '').replace(/^l'/, 'l’') + ' · impraticable' : connu(c.vers!) ? ZONES[c.vers!].nom : 'un sentier inconnu';
      return {
        x: c.pos[0], y: c.pos[1], a: ANGLES[c.cote] ?? 0, nom,
        cls: `passage${bloque ? ' bloque' : ''}${c.vers != null && connu(c.vers) ? '' : ' inconnu'}${libre ? '' : ' cache'}${s.survol === i ? ' survol' : ''}`,
        etiqCls: 'etiq-passage ' + (c.pos[0] > 900 ? 'gauche' : 'droite'), delai: (0.3 + i * 0.15).toFixed(2),
        aller: () => this.aller(c.vers), entrer: () => this.setState({ survol: i }), sortir: () => this.setState({ survol: null }),
      };
    });
    // la Sortie du village : la flèche de gauche rentre au ranch ; celle du bas (sans chemin parcouru) revient au village
    if (s.zone === DEPART) {
      passages.push({
        x: 150, y: 668, a: -118, nom: 'rentrer au ranch', cls: `passage${libre ? '' : ' cache'}${s.survol === 'village' ? ' survol' : ''}`,
        etiqCls: 'etiq-passage droite', delai: '0.6',
        aller: () => { if (!this.occupe()) { Sons.pas(false, 3); this.rentrer(); } }, entrer: () => this.setState({ survol: 'village' }), sortir: () => this.setState({ survol: null }),
      });
    }
    // les PNJ du lieu, posés dans le décor
    const filoPieds = s.filo.y;
    const pnj = this.pnjIci().map((q) => this.placer(q)).filter((x): x is PnjPlace => !!x).map((q) => ({
      ...q, nom: q.p.nom, z: q.y + q.h > filoPieds ? 31 : 29,
      cls: `pnj${q.y + q.h > filoPieds ? ' devant' : ''}${s.survolPnj === q.p.id ? ' survol' : ''}${libre ? '' : ' cache'}`,
      parler: () => this.parler(q.p),
      entrer: () => { if (!this.occupe()) { this.son('paperTick'); this.setState({ survolPnj: q.p.id }); } },
      sortir: () => this.setState({ survolPnj: null }),
    }));
    const boutonsScene = boutonsDuLieu(s.zone, this.ctx()).map((b) => ({
      x: b.x, y: b.y, libelle: b.libelle, cls: `ecriteau${b.rouge ? ' rouge' : ''}${libre ? '' : ' cache'}`, faire: () => this.parler(b),
    }));
    const garde = this.bloque();
    const prec = s.historique.length ? ZONES[s.historique[s.historique.length - 1]].nom : null;
    // gestes de terrain (le nom n'apparaît qu'au survol)
    const canne = this.aDansLeSac('canne_peche'), tente = this.aDansLeSac('tente');
    const g = (cle: string, nom: string, img: string, faire: () => void, etat: string, note: string) => ({ cle, nom, img, faire, cls: `geste ${etat}`, note });
    const gestes = [
      g('fouiller', 'Fouiller', IMG.fouiller, () => this.fouiller(), !z.fouille.length || garde ? 'off' : this.fait('fouiller') ? 'fait' : '', garde ? 'le passage est gardé' : this.fait('fouiller') ? 'déjà fait aujourd’hui' : 'une demi-heure'),
      g('recolter', 'Récolter', IMG.recolter, () => this.recolter(), !groupeMat(s.zone) ? 'off' : this.fait('recolter') ? 'fait' : '', this.fait('recolter') ? 'déjà fait aujourd’hui' : 'une demi-heure'),
      ...(z.eau ? [g('pecher', 'Pêcher', IMG.pecher, () => this.pecher(), canne ? '' : 'off', canne ? 'un quart d’heure' : 'pas de canne')] : []),
      g('envoyer', `Envoyer ${N}`, IMG.envoyer, () => this.envoyer(), !z.envoi.length || garde || aBoutDeForces(e) ? 'off' : this.fait('envoyer') ? 'fait' : '',
        garde ? 'le passage est gardé' : aBoutDeForces(e) ? 'à bout de forces' : this.fait('envoyer') ? 'déjà fait aujourd’hui' : 'vingt minutes'),
      g('camper', 'Camper', IMG.camper, () => this.camper(), tente ? '' : 'off', tente ? `s’occuper ${this.a('de lui', 'd’elle')}` : 'il faut une tente'),
    ].map((x, i) => ({ ...x, delai: (0.1 + i * 0.06).toFixed(2) }));
    // l'écho : son allure (blessure, maladie), jamais de chiffre
    const k = tailleStade(e);
    const surLui = [e.blesse && { src: IMG.blesse, nom: this.a('blessé', 'blessée') }, e.malade && { src: IMG.malade, nom: 'malade' }]
      .filter((x): x is { src: string; nom: string } => !!x).map((x, i, t) => ({ ...x, a: Math.round((i - (t.length - 1) / 2) * 60) }));
    const filo = {
      ...s.filo, s: +(s.filo.s * k).toFixed(3), cls: `filo ${s.filo.cls}${e.blesse ? ' boitille' : ''}`, src: asset(apparence(e)), flip: s.filo.dir,
      signes: surLui, bulle: s.bulle ? s.bulle.src : '', bulleId: s.bulle ? s.bulle.id : 0,
    };
    // particules du décor
    if (!this.motes.length || this.motesRegion !== z.region) {
      this.motesRegion = z.region;
      this.motes = Array.from({ length: z.region === 'caverne' ? 22 : 16 }, (_, i) => ({
        y: Math.round(80 + Math.random() * 620), t: 3 + Math.round(Math.random() * 4), d: Math.round(10 + Math.random() * 10),
        dx: Math.round(Math.random() * 140 - 70), c: MOTES[z.region][i % MOTES[z.region].length], delai: -Math.round(Math.random() * 20),
      }));
    }
    const f = s.fouille;
    const fouille = f ? {
      message: f.message, fini: f.fini, bouton: f.fini ? 'Refermer le carnet' : 'Garder mes trouvailles',
      cartes: f.cartes.map((c, i) => ({
        cls: `cachette${c.revele ? ' revele ' + c.type : ''}${f.fini && !c.revele ? ' eteinte' : ''}`, lieu: c.lieu, delai: (i * 0.08).toFixed(2),
        objet: c.revele && c.type === 'objet', echo: c.revele && c.type === 'echo', vide: c.revele && c.type === 'vide',
        nom: c.objet ? nomObjet(c.objet) : '', icone: c.objet ? iconeObjet(c.objet) : '', retourner: () => this.retourner(i),
      })),
      gains: f.gains.map((id) => ({ icone: iconeObjet(id), nom: nomObjet(id) })),
    } : null;
    const pp = POINT_PECHE[s.zone] || [800, 600];
    const peche = s.peche ? {
      ...s.peche, titre: s.peche.phase === 'prise' ? 'Une prise !' : 'Raté…', cls: 'peche ' + s.peche.phase, x: pp[0], y: pp[1], ligne: `M1150 300 Q${(1150 + pp[0]) / 2} ${pp[1] - 60} ${pp[0]} ${pp[1] - 6}`,
      enCours: ['lancer', 'attente', 'touche'].includes(s.peche.phase), fini: ['prise', 'echappe'].includes(s.peche.phase),
      consigne: s.peche.phase === 'touche' ? 'Ça mord !' : s.peche.phase === 'lancer' ? 'Vous lancez la ligne…' : 'Le bouchon dérive… guettez-le.',
    } : null;
    const r = s.rencontre;
    const ks = r ? tailleStade({ stade: r.sauvage.stade, taille: 1, poids: 18 }) : 1;
    const rencontre = r ? {
      cls: 'rencontre ' + r.phase + (r.issue ? ' ' + r.issue : ''), nom: r.sauvage.nom, src: asset(apparence({ ...r.sauvage, evolution: null } as unknown as Etat)), reaction: r.reaction,
      x: r.x, y: r.y, s: +(echelle(r.y) * ks).toFixed(3), flip: r.x > s.filo.x ? -1 : 1, alerteY: r.y - Math.round(205 * echelle(r.y) * ks) - 40,
      choix: r.phase === 'choix', combat: r.phase === 'combat', issue: r.phase === 'issue', texte: r.texte || '', coupe: r.coupe || '',
      engage: `${N} et ${r.sauvage.nom} se jaugent… Le combat s’engage.`,
      enjeu: r.enjeu.map((id) => ({ icone: iconeObjet(id), nom: nomObjet(id) })), aEnjeu: r.enjeu.length > 0 && r.phase !== 'issue',
      defaite: r.issue === 'defaite', peutCombattre: !aBoutDeForces(e), banniere: r.phase === 'apparition' ? 'Un écho sauvage surgit !' : r.phase === 'combat' ? 'En garde !' : '',
    } : null;
    // la tente
    const t = s.tente;
    const besoins = [
      niveau('faim') >= 2 && { src: IMG.faim, nom: 'a faim' }, niveau('salete') >= 2 && { src: IMG.sale, nom: 'sale' },
      niveau('fatigue') >= 2 && { src: IMG.fatigue, nom: this.a('fatigué', 'fatiguée') }, e.blesse && { src: IMG.blesse, nom: this.a('blessé', 'blessée') },
      e.malade && { src: IMG.malade, nom: 'malade' },
    ].filter((x): x is { src: string; nom: string } => !!x).map((x, i, a) => ({ ...x, a: Math.round((i - (a.length - 1) / 2) * 110) }));
    const tenteV = t ? {
      cls: 'tente ' + t.phase + (t.anim ? ' ' + t.anim : '') + (s.sommeil ? ' sommeil' : ''), texte: t.texte, choixRepas: !!t.choixRepas, fond: asset(this.fond(s.zone)), filtre: L.filtre,
      echo: asset(apparence(e)), signes: besoins,
      soins: ([['nourrir', 'Nourrir', IMG.nourrir], ['laver', 'Laver', IMG.laver], ['soigner', 'Soigner', IMG.soigner], ['dormir', 'Dormir', IMG.dormir]] as const)
        .map(([cle, nom, img]) => ({ nom, img, cls: 'geste' + (t.occupe ? ' off' : ''), faire: () => this.soin(cle) })),
      repas: this.repas().map(({ i, al, qte }) => ({ nom: al.nom, icone: asset(al.icone), qte, donner: () => this.soin('nourrir', i) })),
      bulle: s.bulle ? s.bulle.src : '', bulleId: s.bulle ? s.bulle.id : 0,
    } : null;
    return {
      pret: true, geste: this.geste, echoNom: N,
      fond: asset(this.fond(s.zone)), ancien: s.ancien != null ? asset(this.fond(s.ancien)) : '', aAncien: s.ancien != null, sensCls: 'ex-fond' + (s.ancien != null ? ' entre-' + s.sens : ''), ancienCls: 'ex-ancien sort-' + s.sens,
      filtre: L.filtre, teinte: L.teinte, chaleur: L.chaleur, lanterne: L.sombre, lanterneX: s.filo.x, lanterneY: s.filo.y,
      motes: this.motes, regionCls: 'ex ' + z.region + (L.sombre ? ' sombre' : ''),
      lieu: z.nom, lieuCls: 'lieu' + (z.nom.length > 20 ? ' long' : ''), lieuCle: 'lieu-' + (s.nouveauLieu || s.zone), region: REGIONS[z.region],
      jourTexte: `Jour ${ageJours(e)}`, heure: `${deux(h)} h ${deux(e.minute % 60)}`, periode: PERIODE(h),
      passages, pnj, boutonsScene,
      appel: s.appel, allerVoir: () => { Sons.clic(); this.setState({ appel: false }); this.ouvrirScene('nyxara'); },
      retour: {
        nom: prec ? 'revenir · ' + prec : s.zone === DEPART ? 'revenir au village' : 'rentrer au ranch', cls: 'retour' + (libre ? '' : ' cache') + (s.survol === 'retour' ? ' survol' : ''),
        faire: () => this.revenir(), entrer: () => this.setState({ survol: 'retour' }), sortir: () => this.setState({ survol: null }),
      },
      gestes, gestesCls: 'gestes' + (libre ? '' : ' cache'),
      filo, toast: s.toast,
      fouille, aFouille: !!fouille, fermerFouille: () => this.fermerFouille(),
      recolte: s.recolte, aRecolte: !!s.recolte, recolteFin: !!(s.recolte && s.recolte.phase === 'fin'), fermerRecolte: () => { this.setState({ recolte: null }); },
      peche, aPeche: !!peche, ferrer: () => this.ferrer(), relancer: () => this.lancer(), fermerPeche: () => this.fermerPeche(),
      envoi: s.envoi, envoiFouine: !!(s.envoi && s.envoi.phase === 'fouine'), envoiResultat: !!(s.envoi && s.envoi.phase === 'resultat'), fermerEnvoi: () => this.fermerEnvoi(),
      envoiTitre: s.envoi && s.envoi.objet ? `${N} rapporte…` : 'Bredouille', envoiX: s.envoi ? s.envoi.x : 0, envoiY: s.envoi ? s.envoi.y : 0,
      envoiFouineTexte: `${N} fouine dans les fourrés…`, merciTexte: `Merci, ${N}`,
      rencontre, aRencontre: !!rencontre, affronter: () => this.affronter(), eclipser: () => this.eclipser(),
      fermerRencontre: () => this.fermerRencontre(), rentrerBlesse: () => this.rentrer(true),
      tente: tenteV, aTente: !!tenteV, sortirTente: () => this.sortirTente(),
      carte: s.carte ? this.valsCarte() : null, aCarte: s.carte,
      ouvrirCarte: () => { if (this.occupe()) return; this.son('page', 0.8); this.setState({ carte: true }); },
      fermerCarte: () => { this.son('page', 0.6); this.setState({ carte: false }); },
      arreter: (ev: { stopPropagation?: () => void }) => { ev?.stopPropagation?.(); },
      paperFilter: 'none', coteCls: libre ? '' : 'cache',
      fin: s.fin, aFin: !!s.fin, finVide: !!(s.fin && !s.fin.objets.length && !s.fin.materiaux.length),
      finBouton: s.fin?.vers === 'village' ? 'Retrouver le village' : 'Retrouver le ranch',
      repartir: () => {
        this.sauver({ fin: true });
        if (s.fin?.vers === 'village') this.props.surVillage(this.e, this.monde); else this.props.surRanch(this.e, this.monde);
      },
    };
  }

  valsCarte() {
    const s = this.state, vu = new Set(this.monde.decouvertes);
    const entrevus = new Set<number>();
    this.monde.decouvertes.forEach((id) => ZONES[id]?.chemins.forEach((c) => { if (c.vers != null && !vu.has(c.vers)) entrevus.add(c.vers); }));
    const decouverts = this.monde.decouvertes.filter((id) => ZONES[id]);
    // la brume se lève autour des lieux visités (et un peu autour de ceux qu'on a entrevus) ; le ranch est toujours visible
    const trous = [{ x: 150, y: 540, r: 230, o: 1 },
      ...decouverts.map((id) => ({ x: ZONES[id].carte[0], y: ZONES[id].carte[1], r: 150, o: 1 })),
      ...[...entrevus].map((id) => ({ x: ZONES[id].carte[0], y: ZONES[id].carte[1], r: 95, o: 0.55 }))];
    const lieux = [
      ...decouverts.map((id) => ({ x: ZONES[id].carte[0], y: ZONES[id].carte[1], nom: ZONES[id].nom, r: id === s.zone ? 12 : 9, cls: 'lieu' + (id === s.zone ? ' ici' : '') + (ZONES[id].eau ? ' eau' : ''), inconnu: false })),
      ...[...entrevus].map((id) => ({ x: ZONES[id].carte[0], y: ZONES[id].carte[1], nom: '', r: 13, cls: 'lieu entrevu', inconnu: true })),
    ];
    const [ix, iy] = ZONES[s.zone].carte;
    return { trous, lieux, piqueX: ix, piqueY: iy, image: IMG.carte, brume: IMG.brume, repere: IMG.repere };
  }
}

/** Nom et icône d'un objet du catalogue de la simulation. */
export const nomObjet = (id: string) => descriptionObjet(id)?.nom ?? objetDivers(id)?.nom ?? id;
export const iconeObjet = (id: string) => { const d = descriptionObjet(id); return d ? asset(d.icone) : ''; };
