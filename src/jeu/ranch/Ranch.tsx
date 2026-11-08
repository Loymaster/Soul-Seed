// Écran du ranch (maquette « Ranch », page v7 du canevas) branché sur la simulation (src/moteur/simulation).
// 1 seconde réelle = 1 minute de jeu. Le joueur ne voit aucun chiffre : il lit son écho dans son attitude,
// les états qui gravitent autour de lui, ses bulles, les feuilles volantes et le journal.
// La vue est générée depuis la maquette (VueRanch.tsx) ; ce fichier calcule ses valeurs et tient la logique.
import { Component, type ReactNode } from 'react';
import {
  CORVEES, ENTRAINEMENTS, INTERACTIONS, NOM_STADE, Simulation, accord, aliment, apparence, ageJours, descriptionObjet,
  heureDuJour, lireSignes, objetDivers, texteComportement, type CategorieInteraction, type CleCarac, type Etat, type OptionInteraction, type ReponseCorvee, type ReponseRefus,
  type ReponseComportement, type Signes, type Sortie, type Stade, type EchoSauvage,
  demiHeuresPansement, etatPlaies, plaiesApres,
} from '@/moteur/simulation';
import { aBoutDeForces } from '@/moteur/combat';
import type { Catalogue } from '@/contenu/types';
import { ALLURE_COURSE, VisiteRanch, perspective, type GesteVisite } from './visiteur';
import { Evolution, textesEvolution, type ProprietesEvolution } from './Evolution';
import { Tutoriel, type Cible } from './Tutoriel';
import { SFX } from '@/moteur/sfx';
import { VueRanch } from './VueRanch';
import { Repere } from '../commun/Repere';
import { ciel, lanternes, lumiere } from './ciel';
import { IC } from './icones';
import { allureImage, profilEcho, volumePas, type Profil } from './demarche';
import { placerDejection } from './dejections';
import { ombreSous, piedsDe, type Ombre } from '../commun/ombre';
import { enLAir } from '../commun/allures';
import './allures.css';
import { saison } from './lumiere';
import { REP, TAMPON, TEMPERAMENTS, GLYPHE_INCONNU, cleEvenement, consequence, noteSens, parole, phraseReponse } from './evenements';
import { ecouterVolumes, fixerVolumes, volumeMusique } from '../commun/volumes';
import { VOLUME_BRUITAGES_DEFAUT, VOLUME_MUSIQUE_DEFAUT, type Personnage, type Reglages } from '../profils';
import { ONGLETS_FICHE, lignesCombat, lignesTemperament, progression, temperamentDominant, type OngletFiche } from './fiche';
import { PALIER_CORVEE, essaisScene, hauteurScene, sceneCorvee, sceneEntrainement, sceneInteraction, sonsScene } from './scenes';
import { teinteEmotion } from './lueurs';
import { FenetreTemps } from './FenetreTemps';
import { FenetrePansement, ICONE_PANSER, detailPanser } from './FenetrePansement';
import { VoileSommeil, type Sommeil } from './VoileSommeil';
import { NoteRefus, type RefusEnCours } from './NoteRefus';
import { CHIFFRES_ROMAINS, ICONE_ASTUCES, THEMES_ASTUCES, compteTheme, lignesTheme, paginer, type ContexteAstuces } from '../commun/astuces';
import type { Monde } from '@/moteur/monde';
import { EtatCarnet, ICONE_QUETES, pagesCarnet, type SectionCarnet } from '../commun/carnet/PagesCarnet';
import './ranch.css';

export const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
const pad = (n: number) => (n < 10 ? '0' : '') + n;
const hm = (minute: number) => `${pad(Math.floor(minute / 60) % 24)}:${pad(minute % 60)}`;

const NOM_GRAINE = { joy: 'Graine solaire', wrath: 'Graine tellurique', disgust: 'Graine caustique', sorrow: 'Graine boréale', fear: 'Graine spectrale' } as const;
const COULEUR = { bien: '#3f7a3a', mal: '#9c3b2a', note: '#2b2118' } as const;
/** Temps d'affichage d'un texte flottant (ms) : de quoi le lire (environ 15 caractères par seconde), entre 2,4 s et 7 s. */
export const dureeFlottant = (texte: string) => Math.round(Math.max(2400, Math.min(7000, 1300 + texte.length * 65)));
/** Largeur estimée d'un texte flottant (px, Reenie Beanie 25 px sur une ligne). */
const largeurFlottant = (texte: string) => Math.round(texte.length * 9.2 + 26);

type Verbe = 'echo' | 'soins' | 'jouer' | 'activites' | 'ranch';
const VERBES: { k: Verbe; court: string; teinte: string; nom: string }[] = [
  { k: 'echo', court: 'Écho', teinte: '#3f6a3a', nom: 'Mon écho' },
  { k: 'soins', court: 'Soins', teinte: '#2f5a7a', nom: 'Soins' },
  { k: 'jouer', court: 'Jouer', teinte: '#b3671a', nom: 'Jouer' },
  { k: 'activites', court: 'Activités', teinte: '#7a2e2e', nom: 'Activités' },
  { k: 'ranch', court: 'Ranch', teinte: '#566b3a', nom: 'Ranch' },
];
const CAT_JOUER: { k: Exclude<CategorieInteraction, 'cadeau' | 'affection'>; nom: string }[] = [
  { k: 'jeu', nom: 'Jeux' }, { k: 'discussion', nom: 'Discussion' }, { k: 'partage', nom: 'Partage' }, { k: 'education', nom: 'Éducation' },
];
const ICONE_INTERACTION: Record<string, string> = { jeu: IC.balle, discussion: IC.discussion, partage: IC.partage, education: IC.education, affection: IC.caliner };

const SECTIONS = [
  { k: 'sommaire', nom: 'Sommaire', court: 'Sommaire', titre: 'Sommaire', surtitre: 'Carnet d’éleveur', icone: IC.sommaire },
  { k: 'journal', nom: 'Journal du ranch', court: 'Journal', titre: 'Journal du ranch', surtitre: 'Ce qui s’est passé', icone: IC.journal, page: 2 },
  { k: 'quetes', nom: 'Quêtes', court: 'Quêtes', titre: 'Quêtes', surtitre: 'Ce qui vous attend', icone: ICONE_QUETES, page: 4 },
  { k: 'relations', nom: 'Relations', court: 'Relations', titre: 'Relations', surtitre: 'Les gens du coin', icone: IC.relations, page: 6 },
  { k: 'memoire', nom: 'Mémoire des échos', court: 'Mémoire', titre: 'Mémoire des échos', surtitre: 'Ce profil', icone: IC.memoire, page: 8 },
  { k: 'astuces', nom: 'Astuces', court: 'Astuces', titre: 'Astuces', surtitre: 'Conseils d’éleveur', icone: ICONE_ASTUCES, page: 10 },
  { k: 'options', nom: 'Options', court: 'Options', titre: 'Options', surtitre: 'Réglages', icone: IC.options, page: 12 },
] as const;
type Section = (typeof SECTIONS)[number]['k'];

const RESSOURCES = [
  { k: 'bois', nom: 'Bois' }, { k: 'pierre', nom: 'Pierre' }, { k: 'fibres', nom: 'Fibres' },
  { k: 'resine', nom: 'Résine' }, { k: 'ferraille', nom: 'Ferraille' }, { k: 'cristaux', nom: 'Cristaux' },
];
/** Lieux où mène le poteau « partir ». */
export type Destination = 'village' | 'magasin' | 'exploration';
const DESTINATIONS: { nom: string; duree: string; icone: string; texte: string; lieu: Destination }[] = [
  { nom: 'Le village', duree: '20 min', icone: 'M3 20h18M5 20v-8l7-6 7 6v8M10 20v-5h4v5', texte: 'En route pour le village…', lieu: 'village' },
  { nom: 'Le magasin', duree: '10 min', icone: 'M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 2-3M10 20v-5h4v5', texte: 'Direction le magasin…', lieu: 'magasin' },
  { nom: 'Explorer', duree: 'selon le chemin', icone: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM15.5 8.5l-2 5-5 2 2-5z', texte: 'Le sentier vous attend…', lieu: 'exploration' },
];
/** États qui gravitent autour de l'écho, par ordre de priorité ; chacun vient d'un besoin lu par lireSignes(). */
const ETAT_DE_BESOIN: Record<string, string> = { maladie: 'malade', blessure: 'blesse', faim: 'faim', fatigue: 'fatigue', angoisse: 'angoisse', salete: 'sale', affection: 'affection', humeur: 'mecontent' };
const ORDRE_ETATS = ['malade', 'blesse', 'faim', 'fatigue', 'angoisse', 'sale', 'affection', 'mecontent'];
const NOM_ETAT: Record<string, [string, string]> = {
  malade: ['malade', 'malade'], blesse: ['blessé', 'blessée'], faim: ['a faim', 'a faim'], fatigue: ['fatigué', 'fatiguée'], angoisse: ['angoissé', 'angoissée'],
  sale: ['sale', 'sale'], affection: ['réclame de l’affection', 'réclame de l’affection'], mecontent: ['mécontent', 'mécontente'],
};
const TEINTES_EMO = ['255,206,96', '255,156,64', '120,200,255', '170,140,255'];
const CAUSES: Record<string, string> = {
  faim: 'la faim a eu raison de ses forces', blessure: 'une blessure ne s’est jamais refermée', combat: 'au terme d’un combat',
  maladie: 'la maladie a été la plus forte', vieillesse: 'au terme d’une longue vie',
};

export interface ProprietesRanch {
  etat: Etat;
  /** Enregistre la partie (appelé à chaque heure de jeu et après chaque action). */
  sauver: (e: Etat) => void;
  surQuitter: () => void;
  reglages?: Reglages;
  surReglages?: (r: Reglages) => void;
  /** Le personnage du joueur (carnet d'événement : son nom et ses poses). */
  personnage?: Personnage;
  /** Tempéraments déjà découverts, par genre d'événement (mémoire du profil). */
  connus?: string[];
  surDecouverte?: (cle: string) => void;
  /** L'écho s'est éteint : la séquence du « dernier souffle » prend le relais. */
  surMort?: (e: Etat) => void;
  /** Un combat commence (contre l'écho de passage) : l'écran de combat prend le relais. */
  surCombat?: (e: Etat, nature: 'exploration' | 'entrainement', adversaire?: EchoSauvage) => void;
  /** Le poteau « partir » : le jeu ouvre le lieu ; renvoyer `false` s'il n'est pas encore ouvert. */
  surPartir?: (e: Etat, lieu: Destination) => boolean | void;
  /** Ressources de construction rapportées d'exploration (monde de la partie), montrées dans le sac. */
  ressources?: Partial<Record<string, number>>;
  /** Première arrivée au ranch de la partie : Jumpy fait visiter (scène ranch-tutoriel), puis `surTutorielVu`. */
  tutoriel?: boolean;
  surTutorielVu?: () => void;
  catalogue?: Catalogue;
  /** Corvées remises en état par Ash (monde de la partie) : niveau 1 à 3 ; absentes ou 0 : pas encore praticables. */
  corvees?: Partial<Record<string, number>>;
  /** Le monde de la partie, en lecture : ses drapeaux dévoilent des astuces du carnet, nourrissent les quêtes et les relations. */
  monde?: (Pick<Monde, 'drapeaux' | 'corvees'> & Partial<Monde>) | null;
}

interface Choix {
  k: string; nom: string; image?: string; icone?: string; detail?: string; off?: boolean; rubrique?: boolean;
  /** L'action ; « ouvreSac » : la fiche se ferme et le sac s'ouvre. */
  agir?: () => void; sansTampon?: boolean;
}
interface Scene {
  kind: string; groupe: string; image: string; titre: string; lignes: string[]; dx: number; dy: number; s0: string; emo: number; journal?: string;
  /** Hauteur de l'écho dans la fenêtre (px), selon son stade ; haut de sa silhouette (px, repère de la fenêtre). */
  h: number; tete: number;
  /** Ce qui a progressé (flèches, sans chiffre) ; essais d'une corvée. */
  gains: { nom: string; fleches: string }[]; essais: boolean[];
  /** Un mot à dire en fin de corvée (féliciter, encourager, ne rien dire) : la feuille attend la réponse. */
  reponses?: { cle: ReponseCorvee; libelle: string }[];
}
/** Ce que renvoie l'action d'une scène : ses phrases, ou davantage (essais d'une corvée, titre). */
type ResultatScene = string[] | { lignes: string[]; essais?: boolean[]; titre?: string; reponses?: { cle: ReponseCorvee; libelle: string }[] } | null;
interface Sortie_ { texte: string; sous?: string; image?: string; bloquant?: boolean }

interface EtatUI {
  t: number;
  sons: boolean; musique: boolean; volumeMusique: number; volumeBruitages: number;
  ex: number; ey: number; eDur: number; eSens: '' | 'gauche'; marche: boolean;
  survol: number; ouvert: Verbe | 'visiteur' | null; actif: number; tamponne: string | null;
  anim: string; bulle: number | null; bulleImg: string; coeurs: { id: number; x: number; y: number; dx: number; delai: string }[];
  flottants: { id: number; texte: string; couleur: string; x: number; y: number; duree: string }[];
  carnet: boolean; ferme: boolean; section: Section; astTheme: number; astPage: number; contenuCache: boolean; tourne: null | 'avant' | 'arriere'; sauve: string; carnetLeve: boolean;
  sortie: Sortie_ | null; nouvelles: number; mainVisible: boolean; main: number;
  sacOuvert: boolean; sacFerme: boolean; sacSurvol: number; sacMenu: number; sacMenuInfo: boolean; dndDe: number; dndCible: number;
  quitter: boolean; dejSurvol: number | null; dejPart: number[];
  scene: Scene | null; scPhase: '' | 'ouvre' | 'saut' | 'agit' | 'note' | 'ferme';
  evc: boolean; evcFerme: boolean; playing: boolean; typed: number; done: boolean;
  phase: 'choose' | 'stamped' | 'turning' | 'result'; chosen: number; active: number;
  decouverte: boolean; revealed: boolean; tamponGo: boolean;
  propositions: Partial<Record<CategorieInteraction, { jour: number; options: OptionInteraction[] }>>;
  /** Fiche de l'écho : onglet ouvert. */
  ongletFiche: OngletFiche;
  /** Fenêtre « laisser le temps passer » ouverte. */
  temps: boolean;
  /** La réglette « panser les blessures » est ouverte. */
  pansement?: boolean;
  /** L'écho dort : l'écran s'assombrit le temps d'une berceuse. */
  sommeil: Sommeil | null;
  /** Il vient de refuser un plat : deux mots proposés (insister, respecter son refus). */
  refus: RefusEnCours | null;
}

export class Ranch extends Component<ProprietesRanch, EtatUI> {
  sim: Simulation;
  timers: number[] = [];
  n = 0;
  repos = 0;
  dernierSon: Record<number, number> = {};
  horloge = 0;
  pasTimer = 0;
  fondu = 0;
  musiques: { jour: HTMLAudioElement; nuit: HTMLAudioElement } | null = null;
  desabonner: (() => void) | null = null;
  surGeste: (() => void) | null = null;
  segs = '';
  evg = 0;
  scg = 0;
  /** Événement en cours dans le carnet : le comportement (gardé jusqu'à la fin, la simulation l'efface à la réponse). */
  evtCourant: { c: NonNullable<Etat['comportement']>; reponses: { cle: ReponseComportement; libelle: string }[]; reponse: ReponseComportement | null; consequence: string } | null = null;
  vivant = true;
  /** La musique se tait jusqu'à cet instant (berceuse du sommeil). */
  musiqueCoupeeJusqua = 0;
  /** Ce qui a progressé lors de la dernière activité du jour (fiche « Combat » : lueur et flèches). */
  recents: { jour: number; gains: Partial<Record<CleCarac, string>> } = { jour: -1, gains: {} };

  constructor(p: ProprietesRanch) {
    super(p);
    this.sim = new Simulation(p.etat);
    const r = p.reglages;
    this.state = {
      t: 0, sons: r?.sons ?? true, musique: r?.musique ?? true, volumeMusique: r?.volumeMusique ?? VOLUME_MUSIQUE_DEFAUT, volumeBruitages: r?.volumeBruitages ?? VOLUME_BRUITAGES_DEFAUT,
      ex: 520, ey: 290, eDur: 0, eSens: '', marche: false,
      survol: -1, ouvert: null, actif: -1, tamponne: null, anim: '', bulle: null, bulleImg: '', coeurs: [], flottants: [],
      carnet: false, ferme: false, section: 'sommaire', astTheme: 0, astPage: 0, contenuCache: false, tourne: null, sauve: '', carnetLeve: false,
      sortie: null, nouvelles: 0, mainVisible: false, main: 0,
      sacOuvert: false, sacFerme: false, sacSurvol: -1, sacMenu: -1, sacMenuInfo: false, dndDe: -1, dndCible: -1,
      quitter: false, dejSurvol: null, dejPart: [],
      scene: null, scPhase: '',
      evc: false, evcFerme: false, playing: false, typed: 0, done: false, phase: 'choose', chosen: -1, active: -1, decouverte: false, revealed: false, tamponGo: false,
      propositions: {}, ongletFiche: 'portrait', temps: false, sommeil: null, refus: null,
    };
  }

  get e() { return this.sim.etat; }
  get signes(): Signes { return lireSignes(this.e); }
  profil(): Profil { return profilEcho(this.e, allureImage(apparence(this.e)), this.signes.allure); }
  taille() { return this.profil().echelle; }
  rafraichir = () => this.setState((s) => ({ t: s.t + 1 }));
  later(f: () => void, ms: number) { this.timers.push(window.setTimeout(() => { if (this.vivant) f(); }, ms)); }
  son(nom: string, ...a: unknown[]) {
    if (!this.state.sons) return;
    const f = (SFX as unknown as Record<string, unknown>)[nom];
    if (typeof f === 'function') (f as (...x: unknown[]) => void).apply(SFX, a);
  }
  sauver() { this.props.sauver(this.e); }
  a(m: string, f: string) { return accord(this.e, m, f); }

  componentDidMount() {
    this.vivant = true;
    fixerVolumes({ musique: this.state.volumeMusique / 100, bruitages: this.state.volumeBruitages / 100 });
    this.horloge = window.setInterval(() => this.tic(), 1000);
    this.later(() => this.errer(), 1800);
    // la musique démarre au premier geste (les navigateurs refusent la lecture automatique)
    this.surGeste = () => { this.lancerMusique(); if (this.surGeste) window.removeEventListener('pointerdown', this.surGeste); };
    window.addEventListener('pointerdown', this.surGeste);
    this.lancerMusique();
    this.desabonner = ecouterVolumes(() => undefined);
    this.monterExtras();
  }
  componentWillUnmount() {
    this.vivant = false;
    this.timers.forEach(clearTimeout);
    clearInterval(this.horloge); clearInterval(this.pasTimer); clearInterval(this.fondu);
    if (this.surGeste) window.removeEventListener('pointerdown', this.surGeste);
    this.desabonner?.();
    if (this.musiques) Object.values(this.musiques).forEach((a) => a.pause());
    this.musiques = null;
  }
  componentDidUpdate(_: ProprietesRanch, avant: EtatUI) {
    const s = this.state;
    if (avant.sons !== s.sons || avant.musique !== s.musique || avant.volumeMusique !== s.volumeMusique || avant.volumeBruitages !== s.volumeBruitages) {
      fixerVolumes({ musique: s.volumeMusique / 100, bruitages: s.volumeBruitages / 100 });
      SFX.on = s.sons;
      this.props.surReglages?.({ sons: s.sons, musique: s.musique, volumeMusique: s.volumeMusique, volumeBruitages: s.volumeBruitages });
    }
  }

  // ——— Musique : deux boucles (jour, nuit). Quand l'heure bascule (20 h → nuit, 6 h → jour), la piste en cours
  // s'éteint en fondu, PUIS l'autre monte en fondu depuis son début (jamais les deux à la fois).
  lancerMusique() {
    if (this.musiques) return;
    const mk = (src: string) => { const a = new Audio(asset(src)); a.loop = true; a.volume = 0; return a; };
    this.musiques = { jour: mk('sons/musiques/day.mp3'), nuit: mk('sons/musiques/night.mp3') };
    this.fondu = window.setInterval(() => {
      if (!this.musiques) return;
      if (this.evo) {
        // l'évolution coupe la musique (fondu rapide) ; elle reprend ensuite là où elle s'était arrêtée
        for (const a of Object.values(this.musiques)) if (!a.paused) { a.volume = Math.max(0, a.volume - 0.05); if (a.volume <= 0) a.pause(); }
        return;
      }
      // berceuse : la musique se tait d'un coup, puis revient en fondu
      if (Date.now() < this.musiqueCoupeeJusqua) { Object.values(this.musiques).forEach((a) => { a.volume = 0; if (!a.paused) a.pause(); }); return; }
      const h = this.e.minute / 60; const nuit = h >= 20 || h < 6;
      const V = this.state.musique ? 0.32 * volumeMusique() : 0;
      const voulue = this.musiques[nuit ? 'nuit' : 'jour'], autre = this.musiques[nuit ? 'jour' : 'nuit'];
      if (!autre.paused) {
        // 1) sortie : environ 3 s
        autre.volume = Math.max(0, autre.volume - Math.max(0.004, 0.32 / 15));
        if (autre.volume <= 0) { autre.pause(); autre.currentTime = 0; }
        return;
      }
      // 2) entrée : environ 4 s, ou ajustement doux au volume réglé
      if (V > 0 && voulue.paused) voulue.play().catch(() => {});
      const pas = Math.max(0.004, 0.32 / 20), v = voulue.volume;
      voulue.volume = Math.max(0, Math.min(1, v < V ? Math.min(V, v + pas) : Math.max(V, v - pas)));
      if (V === 0 && voulue.volume <= 0 && !voulue.paused) voulue.pause();
    }, 200);
  }

  occupe() { const s = this.state; return !!(s.ouvert || s.carnet || s.sacOuvert || s.quitter || s.evc || s.sortie || s.scene || s.temps || s.pansement || s.sommeil || s.refus || Date.now() < this.repos || this.e.mort || this.evo || this.tutoActif); }
  enPause() { const s = this.state; return !!(s.carnet || s.sacOuvert || s.sortie || s.evc || s.scene || s.temps || s.pansement || s.sommeil || s.refus || this.e.mort || this.evo || this.tutoActif); }

  // ——— Le temps s'écoule
  tic() {
    if (this.enPause()) return;
    const s = this.sim;
    const heureAvant = heureDuJour(s.etat);
    s.minute();
    this.traiter(s.vider());
    if (heureDuJour(s.etat) !== heureAvant) this.sauver();
    const g = this.signes;
    const niveau = (b: string) => g.besoins.find((x) => x.besoin === b)?.urgence ?? 0;
    if (niveau('faim') >= 2 && s.etat.minute % 37 === 0) this.son('gargouille', volumePas(this.state.ey));
    if (niveau('fatigue') >= 2 && s.etat.minute % 45 === 0) { this.son('baille', volumePas(this.state.ey)); if (!this.state.marche) { this.setState({ anim: 'baille' }); this.later(() => this.setState({ anim: '' }), 1500); } }
    this.rafraichir();
  }

  /** Ce que la simulation signale. */
  traiter(sorties: Sortie[]) {
    // l'évolution passe avant tout autre événement : elle se joue d'abord, le reste attend la fin de la séquence
    // (sauf la mort et le journal, qui ne s'affichent pas par-dessus)
    const evo = sorties.find((x) => x.type === 'evolution');
    if (evo || this.evo) {
      const tout = (x: Sortie) => x.type === 'mort' || x.type === 'journal';
      const maintenant = sorties.filter((x) => tout(x));
      this.apresEvolution.push(...sorties.filter((x) => x !== evo && !tout(x)));
      if (evo) this.traiterExtras(evo);
      sorties = maintenant;
    }
    for (const x of sorties) {
      if (this.traiterExtras(x)) continue;
      switch (x.type) {
        case 'journal': this.setState((s) => ({ nouvelles: s.nouvelles + 1 })); break;
        case 'message': this.flotter(x.texte, COULEUR[x.ton]); break;
        case 'refus': {
          this.son('refus'); this.reagir(false, 'non');
          const reponses = this.sim.reponsesRefus();
          if (reponses.length) this.later(() => { this.son('page', 0.7); this.setState({ refus: { texte: x.texte, reponses, x: this.state.ex, y: this.state.ey } }); }, 500);
          else this.flotter(x.texte, COULEUR.mal);
          break;
        }
        case 'dejection': this.son('pop'); break;
        case 'voisin': case 'autonomie': this.flotter(x.texte, COULEUR.note); break;
        case 'evenement':
          if (x.nature === 'bruit') { this.son('darkHover'); this.reagir(true, 'saute'); } else this.son('reveal');
          this.flotter(x.texte, COULEUR.note);
          break;
        case 'comportement': this.son('reveal'); break;
        case 'sommeil': this.endormir(x.heures, x.effondrement);
          break;
        case 'mort': {
          this.sauver();
          const fin = this.e;
          if (this.props.surMort) { window.setTimeout(() => this.props.surMort?.(fin), 1500); break; }
          this.son('darkClick');
          this.setState({ sortie: { texte: `${fin.nom} s’est ${this.a('éteint', 'éteinte')}…`, sous: CAUSES[x.cause], image: asset(apparence(fin)), bloquant: true } });
          break;
        }
        default: break;
      }
    }
  }

  /** L'écho dort : l'écran s'assombrit, la musique se tait pour une berceuse de quatre secondes, puis tout reprend. */
  endormir(heures: number, effondrement: boolean) {
    const e = this.e; const id = ++this.n;
    this.musiqueCoupeeJusqua = Date.now() + 4600;
    if (this.musiques) Object.values(this.musiques).forEach((a) => { a.volume = 0; a.pause(); });
    this.son('berceuseLongue');
    this.setState({ sommeil: { id, nom: e.nom, heures, effondrement, reveil: hm(e.minute), jour: `jour ${ageJours(e)}`, feminin: e.genre === 'f' }, ouvert: null, quitter: false });
    this.later(() => this.setState((s) => (s.sommeil?.id === id ? { sommeil: { ...s.sommeil, part: true } } : null)), 4400);
    this.later(() => this.setState((s) => (s.sommeil?.id === id ? { sommeil: null } : null)), 5300);
  }
  /** « Laisser le temps passer » : la durée choisie dans la fenêtre (1 à 24 h). */
  attendre(heures: number) {
    const s = this.sim;
    this.setState({ temps: false });
    s.laisserPasser(heures);
    const sorties = s.vider();
    if (!sorties.some((x) => x.type === 'sommeil' || x.type === 'mort')) this.montrerSortie({ texte: heures === 1 ? 'Une heure plus tard…' : `${heures} heures plus tard…` }, 1700);
    this.traiter(sorties); this.sauver(); this.rafraichir();
  }

  /** « Panser les blessures » : le temps choisi sur la réglette (demi-heures), puis la scène des bandages. */
  panser(demiHeures: number) {
    this.setState({ pansement: false });
    const s = this.sim;
    this.ouvrirScene({ kind: 'panser', groupe: 'soin', image: '', titre: 'Panser les blessures' }, () => {
      const r = s.panser(demiHeures);
      if (!r.ok) { if (r.raison) this.flotter(r.raison, COULEUR.mal); return null; }
      return [r.texte];
    });
    [1300, 2300, 2900].forEach((d, i) => this.later(() => { if (this.state.scene?.kind === 'panser') this.son(i === 2 ? 'pop' : 'leather'); }, d));
  }

  montrerSortie(o: Sortie_, ms = 2200) {
    this.setState({ sortie: o });
    if (!o.bloquant) this.later(() => this.setState((s) => (s.sortie === o ? { sortie: null } : null)), ms);
  }

  // ——— L'écho se promène : une destination au hasard, il y marche, s'arrête, recommence
  errer() {
    if (this.occupe()) { this.later(() => this.errer(), 1200); return; }
    const s = this.state; const g = this.signes;
    let x = 0, y = 0, d = 0, essais = 0;
    do {
      if (g.approche && Math.random() < 0.7) { x = 460 + Math.random() * 360; y = 330 + Math.random() * 40; }
      else { x = 250 + Math.random() * 730; y = 235 + Math.random() * 135; }
      d = Math.hypot(x - s.ex, y - s.ey);
    } while (d < 140 && ++essais < 8);
    const dur = d / this.profil().vitesse;
    const id = ++this.trajet;
    this.enRoute = { x0: s.ex, y0: s.ey, t0: Date.now(), ms: dur * 1000 };
    this.setState({ ex: Math.round(x), ey: Math.round(y), eDur: +dur.toFixed(2), eSens: x < s.ex ? 'gauche' : '', marche: true });
    this.pasDemarrer();
    this.later(() => { if (this.trajet !== id) return; clearInterval(this.pasTimer); this.setState({ marche: false }); this.later(() => this.errer(), (2600 + Math.random() * 4200) * this.signes.flanerie); }, dur * 1000);
  }
  /** Le trajet en cours (un trajet plus récent, une course vers le visiteur, rend caduque la fin du précédent). */
  trajet = 0;
  /** Départ du trajet en cours, pour savoir où l'écho se trouve en chemin (la vue glisse de là vers ex, ey). */
  enRoute = { x0: 0, y0: 0, t0: 0, ms: 0 };
  /** Où il est maintenant (en chemin, entre son départ et sa destination). */
  ouEstEcho() {
    const s = this.state, r = this.enRoute;
    const f = s.marche && r.ms > 0 ? Math.min(1, (Date.now() - r.t0) / r.ms) : 1;
    return { x: r.x0 + (s.ex - r.x0) * f, y: r.y0 + (s.ey - r.y0) * f };
  }
  /** Allure de course (visite) : les pas et la démarche s'accélèrent d'autant. */
  course = 1;
  /** L'écho accourt vers (x, y) — vers le visiteur — puis se tourne de son côté ; renvoie la durée de la course (ms). */
  accourir(x: number, y: number, sens: '' | 'gauche', tenir: number): number {
    const ici = this.ouEstEcho();
    const d = Math.hypot(x - ici.x, y - ici.y);
    const dur = d < 8 ? 0 : Math.max(0.35, d / (this.profil().vitesse * ALLURE_COURSE));
    const id = ++this.trajet;
    this.enRoute = { x0: ici.x, y0: ici.y, t0: Date.now(), ms: dur * 1000 };
    this.repos = Math.max(this.repos, Date.now() + dur * 1000 + tenir);
    if (!dur) { this.setState({ eSens: sens, marche: false }); return 0; }
    this.course = ALLURE_COURSE;
    this.setState({ ex: Math.round(x), ey: Math.round(y), eDur: +dur.toFixed(2), eSens: x < ici.x ? 'gauche' : '', marche: true, anim: '' });
    this.pasDemarrer();
    this.later(() => { if (this.trajet !== id) return; clearInterval(this.pasTimer); this.course = 1; this.setState({ marche: false, eSens: sens }); }, dur * 1000);
    return dur * 1000;
  }
  pasDemarrer() {
    clearInterval(this.pasTimer);
    const p = this.profil(); const ms = p.cycle * 1000 / this.course;
    const cycleSon = () => {
      if (!this.state.marche) return;
      if (p.motif) p.motif.forEach((o, i) => this.later(() => { if (this.state.marche) this.son('foulee', p, volumePas(this.state.ey), i); }, o * ms));
      else this.son('glisse', p, volumePas(this.state.ey), p.cycle * 0.95);
    };
    this.later(cycleSon, 30);
    this.pasTimer = window.setInterval(cycleSon, ms);
  }

  // ——— Petits effets
  /**
   * Un texte flottant au-dessus de l'écho. Ils passent **un par un** (file d'attente) : quand deux événements tombent
   * ensemble (un coup de brosse et le bruit de Garry…), le second attend que le premier soit lu — rien ne se chevauche,
   * rien ne se perd. La file attend aussi la fin d'une évolution ou du voile du sommeil.
   */
  flotter(texte: string, couleur: string = COULEUR.note, dx = -150, dy = -30) {
    if (!texte) return;
    // le même texte déjà en attente (deux sorties identiques) ne passe qu'une fois
    if (this.fileFlottants.some((f) => f.texte === texte)) return;
    this.fileFlottants.push({ texte, couleur, dx, dy });
    if (!this.flottantEnCours) this.flotterSuivant();
  }
  fileFlottants: { texte: string; couleur: string; dx: number; dy: number }[] = [];
  flottantEnCours = false;
  flotterSuivant() {
    if (!this.vivant) return;
    const f = this.fileFlottants[0];
    if (!f) { this.flottantEnCours = false; return; }
    this.flottantEnCours = true;
    // l'évolution passe avant tout ; pendant le sommeil, l'écran est voilé : on attend
    if (this.evo || this.state.sommeil) { this.later(() => this.flotterSuivant(), 400); return; }
    this.fileFlottants.shift();
    const id = ++this.n; const ici = this.ouEstEcho();
    const duree = dureeFlottant(f.texte);
    const largeur = largeurFlottant(f.texte);
    const x = Math.max(16, Math.min(1280 - 16 - largeur, Math.round(ici.x + 75 + f.dx + 150 - largeur / 2)));
    const y = Math.max(110, Math.round(ici.y + f.dy));
    this.setState((st) => ({ flottants: st.flottants.concat({ id, texte: f.texte, couleur: f.couleur, x, y, duree: (duree / 1000).toFixed(2) }) }));
    this.later(() => this.setState((st) => ({ flottants: st.flottants.filter((g) => g.id !== id) })), duree);
    // le suivant part quand celui-ci s'est effacé
    this.later(() => this.flotterSuivant(), duree + 120);
  }
  /** Réaction de l'écho : son émotion du moment (une icône, jamais un mot) et une petite animation. */
  reagir(emotion: boolean, anim: string) {
    this.repos = Date.now() + 3500;
    if (anim) { this.setState({ anim: '' }); this.later(() => this.setState({ anim }), 20); this.later(() => this.setState({ anim: '' }), 1400); }
    if (emotion) {
      const id = ++this.n;
      this.son('pop'); this.setState({ bulle: null });
      this.later(() => this.setState({ bulle: id, bulleImg: asset(this.signes.expression.icone) }), 30);
      this.later(() => this.setState((s) => (s.bulle === id ? { bulle: null } : null)), 3200);
    }
  }
  coeurs(k: number) {
    const t = this.taille();
    const c = Array.from({ length: k }, (_, i) => ({ id: ++this.n, x: 56 + Math.round(Math.random() * 40), y: Math.round(28 - (t - 1) * 180), dx: Math.round((Math.random() - 0.5) * 60), delai: (i * 0.12).toFixed(2) }));
    this.setState((s) => ({ coeurs: s.coeurs.concat(c) }));
    this.later(() => this.setState((s) => ({ coeurs: s.coeurs.filter((x) => !c.includes(x)) })), 2000);
  }
  /** Après une action : ce que la simulation a signalé, sauvegarde, réaction. */
  apres(reaction?: { anim?: string; coeurs?: number; sansBulle?: boolean }) {
    this.traiter(this.sim.vider());
    this.sauver();
    if (reaction) {
      this.reagir(!reaction.sansBulle, reaction.anim ?? '');
      if (reaction.coeurs) this.coeurs(reaction.coeurs);
    }
    this.rafraichir();
  }

  // ——— Caresse (5 par jour, comptées par la simulation)
  caresser = () => {
    if (this.e.mort) return;
    if (this.e.comportement && !this.state.evc) { this.ouvrirEvt(); return; }
    if (this.state.mainVisible) return;
    this.repos = Date.now() + 3000;
    const r = this.sim.caresser();
    if (!r.ok) { this.traiter(this.sim.vider()); this.rafraichir(); return; }
    const m = ++this.n;
    this.setState({ mainVisible: true, main: m, anim: 'flatte' });
    this.son('caresse');
    this.later(() => this.setState((s) => (s.main === m ? { mainVisible: false, anim: s.anim === 'flatte' ? '' : s.anim } : null)), 1000);
    this.later(() => { this.coeurs(3); this.apres({ anim: 'saute' }); }, 1020);
  };

  // ——— Fiches d'action
  prendre(c: Choix) {
    if (c.off || this.state.tamponne || this.state.scene || !c.agir) return;
    if (c.sansTampon) { this.son('paperTick'); this.setState({ ouvert: null, actif: -1 }); this.later(() => c.agir!(), 160); return; }
    this.setState({ tamponne: c.k });
    this.later(() => this.son('stamp'), 120);
    this.later(() => { this.setState({ ouvert: null, tamponne: null, actif: -1 }); c.agir!(); }, 700);
  }
  /** Les trois propositions du jour d'une catégorie (tirées une fois, gardées jusqu'au lendemain). */
  propositions(cat: Exclude<CategorieInteraction, 'cadeau'>): OptionInteraction[] | null {
    const e = this.e;
    if (e.interactionsDuJour[cat] === e.jour) return null;
    const p = this.state.propositions[cat];
    if (p && p.jour === e.jour) return p.options;
    const o = this.sim.proposer(cat);
    if (!o) return null;
    window.setTimeout(() => this.setState((s) => ({ propositions: { ...s.propositions, [cat]: { jour: e.jour, options: o } } })), 0);
    return o;
  }
  /** Une interaction (jouer, parler, partager, apprendre, câliner) : une heure passe. */
  interaction(cat: Exclude<CategorieInteraction, 'cadeau'>, o: OptionInteraction) {
    const s = this.sim;
    if (cat === 'affection') {
      const r = s.interagir(cat, o);
      if (!r.ok) { this.flotter(r.raison, COULEUR.mal); return; }
      this.son('caresse'); this.coeurs(5);
      this.apres({ anim: 'flatte' });
      this.later(() => this.flotter(r.texte), 600);
      return;
    }
    const h = heureDuJour(this.e);
    this.ouvrirScene({ kind: sceneInteraction(cat, o.id, h >= 21 || h < 6), groupe: 'jeu', image: '', titre: s.libelle(o) }, () => {
      const r = s.interagir(cat, o);
      return r.ok ? [r.texte] : null;
    });
  }

  choixDe(v: Verbe | 'visiteur'): Choix[] {
    const s = this.sim; const e = this.e;
    const nb = (id: string) => e.inventaire.filter((c) => c?.id === id).reduce((t, c) => t + (c?.qte ?? 0), 0);
    const index = (id: string) => e.inventaire.findIndex((c) => c?.id === id);
    if (v === 'soins') {
      const caliner = INTERACTIONS.affection.find((o) => o.id === 'caliner') ?? INTERACTIONS.affection[0];
      const affectionFaite = e.interactionsDuJour.affection === e.jour;
      return [
        { k: 'nourrir', nom: 'Nourrir', icone: IC.repas, detail: 'dans le sac · 30 min', sansTampon: true, agir: () => this.ouvrirLeSac() },
        { k: 'caliner', nom: 'Câliner', icone: IC.caliner, off: affectionFaite, detail: affectionFaite ? 'déjà fait aujourd’hui' : '1 h', agir: () => this.interaction('affection', caliner) },
        { k: 'r-soins', nom: 'Soins', rubrique: true },
        { k: 'laver', nom: 'Laver', icone: IC.laver, detail: '2 h', agir: () => this.ouvrirScene({ kind: 'laver', groupe: 'soin', image: '', titre: 'Le bain' }, () => { const r = s.laver(); return r.ok ? [] : null; }) },
        { k: 'brosser', nom: 'Brosser', icone: IC.brosser, detail: '1 h', agir: () => this.ouvrirScene({ kind: 'brosser', groupe: 'soin', image: '', titre: 'Un coup de brosse' }, () => { const r = s.brosser(); return r.ok ? [r.texte] : null; }) },
        { k: 'panser', nom: 'Panser les blessures', icone: ICONE_PANSER, sansTampon: true, ...detailPanser(e), agir: () => { this.son('bookArrive'); this.setState({ pansement: true }); } },
        { k: 'pansement', nom: 'Soigner une blessure', icone: IC.trousse, off: !nb('bandage') || !e.blesse, detail: !e.blesse ? 'aucune blessure' : nb('bandage') ? 'un pansement' : 'pas de pansement', agir: () => this.utiliserObjet(index('bandage')) },
        { k: 'medicament', nom: 'Donner un médicament', icone: IC.medicament, off: !nb('medicament'), detail: nb('medicament') ? 'dans le sac' : 'aucun', agir: () => this.utiliserObjet(index('medicament')) },
        { k: 'coucher', nom: 'Le coucher', icone: IC.coucher, agir: () => this.coucher() },
      ];
    }
    if (v === 'jouer') {
      return CAT_JOUER.flatMap((c) => {
        const o = this.propositions(c.k);
        const tete: Choix = { k: 'r-' + c.k, nom: c.nom, rubrique: true };
        if (!o) return [tete, { k: c.k + '-fait', nom: 'Déjà partagé aujourd’hui', icone: ICONE_INTERACTION[c.k], off: true, detail: 'demain' }];
        return [tete, ...o.map((x) => ({ k: c.k + '-' + x.id, nom: s.libelle(x), icone: ICONE_INTERACTION[c.k], detail: '1 h', agir: () => this.interaction(c.k, x) }))];
      });
    }
    if (v === 'activites') {
      return [
        { k: 'r-entr', nom: 'Entraînements', rubrique: true },
        ...ENTRAINEMENTS.map((t) => ({
          k: t.id, nom: t.nom, image: asset(t.icone), detail: '2 h',
          agir: () => this.ouvrirScene({ kind: sceneEntrainement(t), groupe: 'entrainement', image: asset(t.icone), titre: t.nom }, () => { const r = s.entrainer(t.id); if (!r.ok && r.raison) this.flotter(r.raison, COULEUR.mal); return r.ok ? [] : null; }),
        })),
        { k: 'r-corv', nom: 'Corvées', rubrique: true },
        ...CORVEES.map((c) => {
          const niveau = this.props.corvees?.[c.id] ?? 0;
          const faite = e.derniereCorvee[c.id] === e.jour;
          return {
            k: c.id, nom: c.nom, image: asset(c.icone), off: !niveau || faite, detail: !niveau ? 'à remettre en état' : faite ? 'faite aujourd’hui' : '1 h',
            agir: () => this.ouvrirScene({ kind: sceneCorvee(c.id), groupe: 'corvee', image: asset(c.icone), titre: c.nom }, () => {
              const r = s.jouerCorvee(c.id, niveau);
              if (!r.ok) { if (r.raison) this.flotter(r.raison, COULEUR.mal); return null; }
              return { lignes: [PALIER_CORVEE[r.palier]], essais: r.essais, reponses: s.reponsesCorvee() };
            }),
          };
        }),
      ];
    }
    if (v === 'ranch') {
      return [
        { k: 'balayer', nom: 'Tout balayer', icone: IC.balai, off: !e.dejections.length, detail: e.dejections.length ? '' : 'rien à ramasser',
          agir: () => { [...e.dejections].forEach((d) => s.nettoyer(d.id)); this.son('balai'); this.flotter('Vous avez tout balayé.', COULEUR.bien); this.apres(); } },
        { k: 'attendre', nom: 'Laisser le temps passer', icone: IC.sablier, detail: 'jusqu’à 24 h', sansTampon: true,
          agir: () => { this.son('bookArrive'); this.setState({ temps: true }); } },
        { k: 'r-lieux', nom: 'Lieux', rubrique: true },
        { k: 'jardin', nom: 'Jardin', icone: IC.jardin, off: true, detail: 'à venir' },
        { k: 'cuisine', nom: 'Cuisine', icone: IC.cuisine, off: true, detail: 'personne pour cuisiner… pour l’instant' },
        { k: 'lieu1', nom: '???', icone: IC.mystere, off: true, detail: 'à découvrir' },
      ];
    }
    if (v === 'visiteur') return this.choixVisiteur();
    return [];
  }

  coucher() {
    const s = this.sim;
    const r = s.coucher();
    if (!r.ok) { this.traiter(s.vider()); this.rafraichir(); return; }
    this.traiter(s.vider());
    this.later(() => this.apres({}), 5400);
    this.rafraichir();
  }

  // ——— Scène d'action : une fenêtre s'ouvre au centre, l'écho y saute, l'action se joue, une feuille volante la résume
  /** `action` applique la règle de la simulation et renvoie les phrases à écrire (null : refus, rien ne se joue). */
  ouvrirScene(sc: { kind: string; groupe: string; image: string; titre: string }, action: () => ResultatScene) {
    const s = this.state;
    const humeurAvant = this.e.humeur;
    const caracsAvant = { ...this.e.caracs };
    const brut = action();
    if (!brut) { this.traiter(this.sim.vider()); this.rafraichir(); return; }
    const res = Array.isArray(brut) ? { lignes: brut } : brut;
    const sorties = this.sim.vider();
    const dort = sorties.some((x) => x.type === 'sommeil');
    const emo = Math.sign(this.e.humeur - humeurAvant);
    // ce qui a progressé : montré sur la feuille volante et, le reste de la journée, dans la fiche « Combat »
    const gains = progression(caracsAvant, this.e.caracs);
    if (gains.length) this.recents = { jour: this.e.jour, gains: Object.fromEntries(gains.map((x) => [x.cle, x.fleches])) };
    const note = this.noteScene(sc.kind, sc.groupe, res.lignes, emo);
    const g = ++this.scg;
    const ech = 0.86 + (s.ey - 235) / 135 * 0.28;
    // dans la fenêtre, l'écho garde la taille de son stade (un bébé reste petit) ; il y saute depuis sa taille au ranch (image de 190 px)
    const h = hauteurScene(this.taille());
    // le haut de sa silhouette (les images ont parfois du vide au-dessus) : là où se posent pierre, gerbe, gouttes de sueur…
    const img = this.props.catalogue?.assets.find((a) => a.chemin === apparence(this.e));
    const b = img?.boite && img.h ? img.boite : null;
    const tete = Math.round(336 - h + (b ? (h * b.y) / img!.h! : 0));
    this.setState({
      scene: { ...sc, titre: res.titre || note.titre || sc.titre, lignes: note.lignes, dx: Math.round(s.ex + 75 - 640), dy: Math.round(s.ey + 232 - 470), s0: (190 * this.taille() * ech / h).toFixed(3), h, tete, emo, gains, essais: res.essais ?? [], reponses: res.reponses },
      scPhase: 'ouvre', ouvert: null, quitter: false, carnetLeve: false,
    });
    this.sortiesScene = sorties; this.dortScene = dort;
    this.son('woosh');
    this.later(() => { if (this.scg !== g) return; this.setState({ scPhase: 'saut' }); this.son('foulee', this.profil(), 0.8, 0); }, 420);
    this.later(() => { if (this.scg !== g) return; this.son('foulee', this.profil(), 1.3, 1); }, 1080);
    this.later(() => { if (this.scg !== g) return; this.setState({ scPhase: 'agit' }); this.sonScene(sc.kind); }, 1250);
    this.later(() => this.noterScene(g), 4650);
  }
  sortiesScene: Sortie[] = [];
  dortScene = false;
  noterScene(g: number) {
    const s = this.state; if (this.scg !== g || !s.scene || s.scPhase === 'note' || s.scPhase === 'ferme') return;
    this.setState({ scPhase: 'note' }); this.son('page', 0.7); this.later(() => this.son('pencil'), 300);
    if (s.scene.gains.length) this.later(() => this.son('reveal'), 650);
  }
  sonScene(kind: string) {
    const x = sonsScene(kind); if (!x) return;
    const g = this.scg; const n = x.son;
    x.instants.forEach((d, i) => this.later(() => {
      if (this.scg !== g || !this.state.scene) return;
      if (n === 'foulee') this.son(n, this.profil(), 0.7, i % 2); else if (n === 'typeTick') this.son(n, 'a', 330); else this.son(n);
    }, d));
    // corvée : un petit bruit par essai, réussi ou manqué
    const essais = this.state.scene?.essais ?? [];
    essais.forEach((ok, i) => this.later(() => { if (this.scg === g && this.state.scene) this.son(ok ? 'paperTick' : 'refus'); }, 200 + i * Math.min(350, 2800 / essais.length)));
  }
  /** La feuille volante : jamais de chiffre, seulement ce qu'on devine (lireSignes) et ce que la simulation raconte. */
  noteScene(kind: string, groupe: string, textes: string[], emo: number) {
    const g = this.signes; const Il = this.a('Il', 'Elle');
    const niveau = (b: string) => g.besoins.find((x) => x.besoin === b)?.urgence ?? 0;
    const app = emo > 0 ? `${Il} semble apprécier.` : emo < 0 ? `${Il} ne semble pas aimer ça.` : `${Il} ne laisse rien paraître.`;
    const premier = textes.find((t) => t && t.length < 140);
    let lignes: string[];
    const faim = niveau('repus') ? `${Il} paraît ${this.a('repu', 'repue')}.` : niveau('faim') >= 2 ? `${Il} a encore faim.` : niveau('faim') ? 'Il lui reste un petit creux.' : `${Il} paraît ${this.a('rassasié', 'rassasiée')}.`;
    const fatigue = niveau('fatigue') >= 2 ? `${Il} paraît ${this.a('fatigué', 'fatiguée')}.` : 'Il lui reste de l’énergie.';
    if (kind === 'manger') lignes = [premier || app, faim];
    else if (kind === 'laver' || kind === 'brosser') lignes = [app, niveau('salete') >= 2 ? `${Il} est encore sale.` : `${Il} est tout${this.a('', 'e')} propre.`];
    else if (kind === 'panser') lignes = [premier || app, `${Il} se sent déjà mieux.`];
    else if (groupe === 'entrainement') lignes = [`${Il} s’est ${this.a('donné', 'donnée')} du mal.`, fatigue];
    else if (groupe === 'corvee') lignes = [premier || app, fatigue];
    else lignes = [premier || app, niveau('fatigue') >= 2 ? `${Il} paraît ${this.a('épuisé', 'épuisée')}.` : emo > 0 ? `${Il} a le cœur léger.` : `${Il} en redemanderait bien.`];
    return { titre: '', lignes: lignes.filter(Boolean).slice(0, 3) };
  }
  fermerScene = () => {
    const s = this.state; if (!s.scene) return;
    if (s.scPhase === 'agit') { this.noterScene(this.scg); return; }
    if (s.scPhase !== 'note') return;
    if (s.scene.reponses?.length) return; // un mot est attendu (les réponses de la feuille)
    const g = ++this.scg; const emo = s.scene.emo;
    this.son('woosh'); this.later(() => this.son('foulee', this.profil(), 0.8, 0), 380);
    this.setState({ scPhase: 'ferme' });
    this.later(() => {
      if (this.scg !== g) return;
      this.setState({ scene: null, scPhase: '' });
      this.traiter(this.sortiesScene); this.sortiesScene = [];
      this.sauver();
      this.reagir(emo !== 0, emo > 0 ? 'saute' : '');
      this.rafraichir();
    }, 1000);
  };

  /** Après un refus : insister (il mangera le prochain plat, la mine triste) ou respecter son refus. */
  repondreRefus(cle: ReponseRefus) {
    this.sim.repondreRefus(cle);
    this.son(cle === 'insister' ? 'refus' : 'paperTick');
    this.reagir(cle !== 'insister', cle === 'insister' ? '' : 'saute');
    this.setState({ refus: null });
    this.traiter(this.sim.vider()); this.sauver(); this.rafraichir();
  }

  /** Le mot dit en fin de corvée : la feuille s'efface ensuite. */
  repondreScene(cle: ReponseCorvee) {
    const sc = this.state.scene; if (!sc?.reponses) return;
    this.sim.repondreCorvee(cle);
    this.son(cle === 'rien' ? 'paperTick' : 'reveal');
    if (cle !== 'rien') this.reagir(true, 'saute');
    this.setState({ scene: { ...sc, reponses: undefined } }, () => this.fermerScene());
  }

  // ——— Le sac : 10 emplacements, déplaçables ; un objet s'utilise ou se décrit
  ouvrirLeSac() {
    if (this.state.sacOuvert) return;
    this.son('woosh'); this.later(() => this.son('sacoche', true), 380);
    this.setState({ sacOuvert: true, sacFerme: false, sacSurvol: -1, sacMenu: -1, ouvert: null, quitter: false });
  }
  fermerSac = () => {
    if (this.state.sacMenu >= 0) this.setState({ sacMenu: -1 });
    if (!this.state.sacOuvert || this.state.sacFerme) return;
    this.son('sacoche', false); this.later(() => this.son('woosh'), 620);
    this.setState({ sacFerme: true });
    this.later(() => this.setState({ sacOuvert: false, sacFerme: false }), 1080);
  };
  deplacerSac(de: number, vers: number) {
    if (de < 0 || de === vers) { this.setState({ dndDe: -1, dndCible: -1 }); return; }
    const inv = this.e.inventaire; const x = inv[de]; inv[de] = inv[vers]; inv[vers] = x;
    this.sauver();
    this.son('sacPose'); this.setState({ dndDe: -1, dndCible: -1, sacSurvol: vers });
  }
  /** Utiliser l'objet d'une case : un aliment se mange dans la fenêtre d'action. */
  utiliserObjet(index: number) {
    const c = this.e.inventaire[index];
    if (!c) return;
    const al = aliment(c.id);
    if (al) {
      this.ouvrirScene({ kind: 'manger', groupe: 'soin', image: asset(al.icone), titre: `Repas · ${al.nom.toLowerCase()}` }, () => {
        const r = this.sim.nourrir(index);
        return r.ok ? [r.texte] : null;
      });
      return;
    }
    const r = this.sim.utiliser(index);
    if (!r.ok) { this.traiter(this.sim.vider()); if (r.raison) this.flotter(r.raison, COULEUR.mal); this.rafraichir(); return; }
    this.apres({ anim: 'saute' });
  }

  // ——— L'événement : le « ! » ; le carnet s'ouvre avec le personnage du joueur ; on lit, on choisit, on referme
  ouvrirEvt = () => {
    const c = this.e.comportement;
    if (!c || this.state.evc) return;
    const g = ++this.evg;
    this.evtCourant = { c, reponses: this.sim.reponsesComportement(), reponse: null, consequence: '' };
    this.segs = texteComportement(this.e, c);
    this.setState({ evc: true, evcFerme: false, playing: false, typed: 0, done: false, phase: 'choose', chosen: -1, active: -1, decouverte: false, revealed: false, tamponGo: false, ouvert: null, quitter: false, carnetLeve: false });
    this.son('bookArrive');
    this.later(() => { if (this.evg === g) this.setState({ playing: true }); }, 40);
    this.later(() => this.taper(g), 1890);
  };
  taper(g: number) {
    if (this.evg !== g || !this.state.evc) return;
    const n = this.state.typed;
    if (n >= this.segs.length) {
      this.later(() => { if (this.evg === g) this.setState({ done: true }); }, 160);
      if (this.state.phase === 'result' && !this.state.tamponGo) {
        if (this.state.decouverte && !this.state.revealed) this.later(() => this.reveler(g), 500);
        else if (!this.state.decouverte) this.later(() => { if (this.evg !== g) return; this.setState({ tamponGo: true }); this.later(() => { if (this.evg === g) this.son('stamp'); }, 250); }, 400);
      }
      return;
    }
    const ch = this.segs[n];
    let d = 24; if (ch === '…') d = 300; else if (ch === '.' || ch === '?' || ch === '!') d = 220; else if (ch === ',') d = 120; else if (ch === ' ') d = 30;
    this.son('typeTick', ch, 330);
    this.setState({ typed: n + 1 });
    this.later(() => this.taper(g), d);
  }
  choisir(i: number) {
    const s = this.state; const ev = this.evtCourant;
    if (s.phase !== 'choose' || !s.done || !ev) return;
    const g = this.evg; const k = ev.reponses[i].cle;
    ev.reponse = k;
    ev.consequence = consequence(this.e, ev.c, k);
    // la simulation applique la réponse tout de suite (objet rangé, émotions, éducation, journal)
    const r = this.sim.repondreComportement(k);
    this.traiter(this.sim.vider()); this.sauver();
    if (r.ok && r.objetTrouve && r.sacPlein) ev.consequence += ` Le sac est plein : impossible de garder ${r.objetTrouve.toLowerCase()}.`;
    this.setState({ phase: 'stamped', chosen: i, active: i });
    this.later(() => this.son('stamp'), 210);
    this.later(() => { if (this.evg !== g) return; this.setState({ phase: 'turning' }); this.son('page', 1); this.son('woosh'); }, 1000);
    this.later(() => {
      if (this.evg !== g) return;
      this.segs = ev.consequence;
      // la première fois, le tempérament en jeu se révèle sur la page 4 ; ensuite il y reste inscrit
      const decouverte = !(this.props.connus ?? []).includes(cleEvenement(ev.c));
      this.setState({ phase: 'result', typed: 0, done: false, decouverte, revealed: false, tamponGo: false });
      this.later(() => this.taper(g), 250);
    }, 1740);
  }
  reveler(g: number) {
    if (this.evg !== g || !this.evtCourant) return;
    this.son('reveal'); this.setState({ revealed: true, tamponGo: true });
    this.props.surDecouverte?.(cleEvenement(this.evtCourant.c));
    this.later(() => { if (this.evg === g) this.son('stamp'); }, 1500);
  }
  fermerEvt = () => {
    if (!this.state.evc || this.state.evcFerme) return;
    this.evg++; this.son('page', 0.9); this.later(() => this.son('bookArrive'), 640); this.later(() => this.son('woosh'), 820);
    this.setState({ evcFerme: true });
    const ev = this.evtCourant;
    this.later(() => {
      this.setState({ evc: false, evcFerme: false, playing: false });
      const k = ev?.reponse;
      if (k) {
        const sens = REP[k].sens;
        if (sens > 0) { this.reagir(true, 'saute'); this.coeurs(2); } else if (sens < 0) this.reagir(true, 'non'); else this.reagir(true, '');
      }
      this.evtCourant = null;
      this.rafraichir();
    }, 1320);
  };

  valsEvc(m: ReturnType<typeof lumiere>) {
    const s = this.state; const e = this.e; const ev = this.evtCourant;
    const per = this.props.personnage;
    const av = per?.avatar ?? 'fille-1';
    const reponses = ev?.reponses ?? [];
    const kChoisi: ReponseComportement = ev?.reponse ?? (s.chosen >= 0 ? reponses[s.chosen]?.cle : 'rien') ?? 'rien';
    const ch = REP[kChoisi];
    const temp = TEMPERAMENTS[ev?.c.coloration ?? 'cur'];
    const connu = !!ev && ((this.props.connus ?? []).includes(cleEvenement(ev.c)) || s.revealed);
    const [tTexte, tCouleur] = TAMPON[ch.sens];
    const answers = reponses.map((r, i) => {
      const p = REP[r.cle];
      return {
        label: p.label, color: p.color, icon: p.icon, glow: m.ink, glowColor: p.glow, borderStyle: 'solid',
        text: parole(e, r.cle), showText: true, labelSize: 12, pad: '6px 8px', delay: (i * 0.08).toFixed(2) + 's', sheetIcon: false, never: false,
        enter: () => { if (this.state.phase !== 'choose' || !this.state.done) return; if (this.state.active !== i) this.son('paperTick'); this.setState({ active: i }); },
        pick: () => this.choisir(i),
        cls: 'check choice' + (s.phase === 'choose' && s.active === i ? ' act' : '') + (s.phase !== 'choose' ? (s.chosen === i ? ' picked' : ' dim') : ''),
        stampCls: 'vstamp' + (s.chosen === i && s.phase !== 'choose' ? ' on' : ''),
        ghostCls: 'ghost' + (s.chosen === i ? ' picked' : ' dim'), ghostStamp: s.chosen === i ? 'vstamp static' : 'vstamp',
      };
    });
    const apres = s.phase === 'turning' || s.phase === 'result';
    const voulue = !apres ? 'interro' : ch.sens > 0 ? 'recompense' : ch.sens < 0 ? 'reprimande' : 'ignorer';
    const nomEcho = e.nom;
    return {
      evcVisible: s.evc, evcScrim: s.evc && !s.evcFerme ? 'on' : '', playClass: (s.playing ? 'play' : '') + (s.evcFerme ? ' ferme' : ''),
      avatarImg: asset(`joueur/poses/${av}-${voulue}.webp`),
      poses: ['interro', 'recompense', 'reprimande', 'ignorer'].map((k, i) => ({ src: asset(`joueur/poses/${av}-${k}.webp`), alt: k === voulue ? 'Votre personnage' : '', op: k === voulue ? 1 : 0, pos: i === 0 ? 'relative' : 'absolute', cls: k === voulue ? 'on' : '' })),
      joueurNom: per?.nom ?? 'Vous', echoNom: nomEcho,
      paperGlow: (m.glow * 0.5).toFixed(3), inkGlow: m.ink, portraitFilter: 'url(#rk7Echo) drop-shadow(6px 8px 0 rgba(43,33,24,.18))',
      seg1: (this.segs || '').slice(0, s.typed), seg2: '', seg3: '',
      caretClass: s.done ? 'caret-off' : 'caret-on', voiceClass: 'quiet', talkClass: '',
      choicesClass: s.done ? 'choices-on' : '', answers, listGap: 6,
      peekLabel: '', peekColor: '#6b4f33', peekIcon: '', peekBorder: 'solid', peekText: '', peekClass: '',
      titreGauche: s.phase === 'result' ? phraseReponse(e, kChoisi) : 'Que se passe-t-il ?', titreReponse: phraseReponse(e, kChoisi),
      tsCls: connu ? 'connu' : 'inconnu', tsLabel: connu ? temp.label : 'tempérament inconnu', tsColor: connu ? temp.color : '#9a8668',
      tsGlyphe: connu ? temp.glyphe : GLYPHE_INCONNU, rcGlyphe: temp.glyphe, rvGlyphe: temp.glyphe,
      isReveal: !!s.decouverte, notReveal: !s.decouverte, revealCls: s.revealed ? 'on' : '', rvColor: temp.color, rvGlow: temp.glow, rvLabel: temp.label, rvNote: noteSens(e, ch.sens),
      tamponTexte: tTexte, tamponCouleur: tCouleur, tamponDelai: s.decouverte ? '1.4' : '.1', tamponCls: s.tamponGo ? 'go' : '',
      rcColor: temp.color, rcGlow: temp.glow, rcLabel: temp.label, rcBorder: 'solid', rcNote: noteSens(e, ch.sens),
      showChoices: s.phase === 'choose' || s.phase === 'stamped',
      showRecap: apres, recapOn: s.phase === 'result' ? 'on' : '', turnCls: s.phase === 'turning' ? 'go' : '',
      isNarration: true, isDialogue: false, textSize: 18, textStyle: 'italic',
      onReset: this.fermerEvt,
      passerTexte: () => { const st = this.state; if (st.evc && !st.done && this.segs && st.typed > 0 && st.typed < this.segs.length) this.setState({ typed: this.segs.length }); },
      ouvrirEvt: this.ouvrirEvt,
    };
  }

  /** La fiche de l'écho : portrait, tempérament, caractéristiques de combat (jamais de chiffre). */
  valsFiche() {
    const s = this.state; const e = this.e;
    const dom = temperamentDominant(e);
    return {
      ficheOnglets: ONGLETS_FICHE.map((o) => ({
        nom: o.nom, cls: s.ongletFiche === o.k ? 'ici' : '', choisi: s.ongletFiche === o.k ? 'true' : 'false',
        survol: () => undefined,
        ouvrir: () => { if (this.state.ongletFiche !== o.k) { this.son('page', 0.6); this.setState({ ongletFiche: o.k }); } },
      })),
      fichePortrait: s.ongletFiche === 'portrait', ficheTemperament: s.ongletFiche === 'temperament', ficheCombat: s.ongletFiche === 'combat',
      traits: [
        { nom: 'Stade', valeur: NOM_STADE[e.stade] }, { nom: this.a('Né d’une', 'Née d’une'), valeur: NOM_GRAINE[e.graine] },
        { nom: 'Âge', valeur: `${ageJours(e)} jour${ageJours(e) > 1 ? 's' : ''}` },
      ].map((x) => ({ cls: '', ...x })),
      domCouleur: dom.color, domLueur: dom.glow, domGlyphe: dom.glyphe, domTexte: `Tempérament : ${dom.label.toLowerCase()}`,
      ficheMot: 'Ses entraînements et ses corvées se lisent dans l’onglet « Combat ».',
      temperaments: lignesTemperament(e),
      combat: lignesCombat(e, this.recents.jour === e.jour ? this.recents.gains : {}),
    };
  }

  // ——— Le carnet
  allerA(k: Section) {
    const s = this.state;
    if (k === s.section || s.tourne) return;
    const ordre = (x: Section) => SECTIONS.findIndex((t) => t.k === x);
    const avant = ordre(k) > ordre(s.section);
    this.son('page', 1);
    this.setState({ tourne: avant ? 'avant' : 'arriere', contenuCache: true });
    this.later(() => this.setState({ section: k, contenuCache: false, nouvelles: k === 'journal' ? 0 : this.state.nouvelles }), 380);
    this.later(() => this.setState({ tourne: null }), 760);
  }
  /** Les astuces : ce que le monde et l'écho dévoilent. */
  contexteAstuces(): ContexteAstuces {
    const m = this.props.monde;
    return { e: this.e, m: { drapeaux: m?.drapeaux ?? {}, corvees: { ...(m?.corvees ?? {}), ...(this.props.corvees ?? {}) } as Record<string, number> } };
  }
  /** Tourner les pages des astuces : un autre thème, ou la page d'avant ou d'après (on passe d'un thème à l'autre). */
  feuilleter(theme: number, page: number) {
    const s = this.state;
    if (s.tourne || (theme === s.astTheme && page === s.astPage)) return;
    const avant = theme > s.astTheme || (theme === s.astTheme && page > s.astPage);
    this.son('page', 1);
    this.setState({ tourne: avant ? 'avant' : 'arriere', contenuCache: true });
    this.later(() => this.setState({ astTheme: theme, astPage: page, contenuCache: false }), 380);
    this.later(() => this.setState({ tourne: null }), 760);
  }
  valsAstuces() {
    const s = this.state; const c = this.contexteAstuces();
    const pages = THEMES_ASTUCES.map((t) => paginer(lignesTheme(t, c)));
    const ti = Math.min(s.astTheme, THEMES_ASTUCES.length - 1); const t = THEMES_ASTUCES[ti];
    const pi = Math.min(s.astPage, pages[ti].length - 1);
    const prec = pi > 0 ? [ti, pi - 1] : ti > 0 ? [ti - 1, pages[ti - 1].length - 1] : null;
    const suiv = pi < pages[ti].length - 1 ? [ti, pi + 1] : ti < THEMES_ASTUCES.length - 1 ? [ti + 1, 0] : null;
    return {
      astIntro: 'Ce que les éleveurs se transmettent, et ce que vous découvrirez en chemin.',
      astThemes: THEMES_ASTUCES.map((x, i) => {
        const n = compteTheme(x, c);
        return { num: CHIFFRES_ROMAINS[i], nom: x.nom, compte: n.vues < n.total ? `${n.vues}/${n.total}` : `${n.total}`, cls: i === ti ? 'ici' : '', ici: i === ti ? 'page' : 'false', ouvrir: () => this.feuilleter(i, 0) };
      }),
      astMot: t.mot, astIcone: t.icone, astTheme: t.nom,
      astuces: pages[ti][pi].map((l) => ({ texte: l.texte, piste: l.piste, cls: l.cachee ? 'cachee' : '' })),
      astFolio: pages[ti].length > 1 ? `${CHIFFRES_ROMAINS[ti]} · page ${pi + 1} / ${pages[ti].length}` : CHIFFRES_ROMAINS[ti],
      astSansPrec: !prec, astSansSuiv: !suiv,
      astPrec: () => { if (prec) this.feuilleter(prec[0], prec[1]); },
      astSuiv: () => { if (suiv) this.feuilleter(suiv[0], suiv[1]); },
    };
  }
  fermerCarnet = () => {
    if (!this.state.carnet || this.state.ferme) return;
    this.son('page', 0.8); this.later(() => this.son('woosh'), 380);
    this.setState({ ferme: true });
    this.later(() => this.setState({ carnet: false, ferme: false, section: 'sommaire' }), 1050);
  };
  partir(texte: string, lieu: Destination) {
    this.son('woosh');
    const surPartir = this.props.surPartir;
    if (surPartir && !this.e.mort) {
      this.sauver();
      if (lieu === 'exploration') {
        this.setState({ sortie: { texte, sous: `${this.e.nom} trottine devant vous, le nez au vent…` } });
        this.later(() => surPartir(this.e, 'exploration'), 1700);
        return;
      }
      if (surPartir(this.e, lieu) !== false) return;
    }
    this.montrerSortie({ texte, sous: 'ce chemin n’est pas encore ouvert dans cette version' }, 2200);
  }

  // ——— Visites d'échos sauvages (visiteur.ts), évolution (Evolution.tsx), tutoriel (Tutoriel.tsx)
  visite = new VisiteRanch({
    rafraichir: () => this.rafraichir(),
    plusTard: (f, ms) => this.later(f, ms),
    echo: () => ({ ...this.ouEstEcho(), marche: this.state.marche, taille: this.taille() }),
    accourir: (x, y, sens, tenir) => this.accourir(x, y, sens, tenir),
    tournerEcho: (sens, ms) => {
      this.repos = Math.max(this.repos, Date.now() + ms);
      this.later(() => this.setState({ eSens: sens }), this.state.marche ? this.state.eDur * 1000 : 0);
    },
    animerEcho: (anim) => { this.setState({ anim: '' }); this.later(() => this.setState({ anim }), 20); this.later(() => this.setState((s) => (s.anim === anim ? { anim: '' } : null)), 1400); },
    son: (nom, ...a) => this.son(nom, ...a),
    asset,
    occupe: () => { const s = this.state; return !!(s.carnet || s.sacOuvert || s.evc || s.scene || s.sortie || this.evo || this.tutoActif || this.e.mort); },
    ombre: (chemin, profil, gauche) => this.ombreDe(chemin, profil, gauche),
  });

  /** Une image d'écho du catalogue (dimensions, boîte utile). */
  imageCatalogue(chemin: string) { return this.props.catalogue?.assets.find((a) => a.chemin === chemin); }
  /** L'ombre sous les pieds d'un écho (cadre 150 × 240 : image de 190 px, bord gauche à −2, bas à 6 px du bas du cadre). */
  ombreDe(chemin: string, profil: Profil, gauche: boolean): Ombre {
    const a = this.imageCatalogue(chemin);
    const pieds = piedsDe(asset(chemin), { W: a?.l ?? 190, H: a?.h ?? 190, boite: a?.boite }, this.rafraichir);
    return ombreSous(pieds, { hImage: 190, echelle: profil.echelle, hauteur: profil.hauteur, gauche, gaucheImage: -2, basImage: 6, enLAir: enLAir(profil.demarche) });
  }
  evo: Omit<ProprietesEvolution, 'sons'> | null = null;
  tutoActif = false;
  /** L'apparence de l'écho au dernier affichage (l'ancienne forme, quand il évolue). */
  apparenceVue = '';

  monterExtras() {
    const v = this.sim.visiteur;
    if (v) this.visite.placer(v);
    if (this.props.tutoriel && this.props.catalogue && this.props.personnage && !this.e.mort) this.later(() => { this.tutoActif = true; this.setState({ ouvert: null }); this.rafraichir(); }, 1400);
    if (import.meta.env.DEV) {
      // aides de développement, dans la console : __ranch.visite(), __ranch.geste(), __ranch.evolution(), __ranch.tutoriel(), __ranch.refus(), __ranch.corvee()
      const sim = this.sim as unknown as { evenement: (n: string) => void; evoluer: (s: Stade) => void };
      (window as unknown as { __ranch: unknown }).__ranch = {
        sim: this.sim, visiteur: this.visite,
        visite: (nouveau = false) => { if (this.sim.visiteur) return 'déjà un visiteur'; sim.evenement(nouveau || !this.e.echosSauvages.length ? 'invite' : 'visite'); this.traiter(this.sim.vider()); return this.e.visiteur?.id; },
        depart: () => { const v = this.e.visiteur; if (!v) return; v.departA = 0; this.sim.minute(); while (this.e.minute % 60) this.sim.minute(); this.traiter(this.sim.vider()); },
        geste: () => { this.sim.interactionSpontanee(); this.traiter(this.sim.vider()); },
        evolution: () => { const suite: Partial<Record<Stade, Stade>> = { bebe: 'enfant', enfant: 'adolescent', adolescent: 'adulte' }; const v = suite[this.e.stade]; if (v) { sim.evoluer(v); this.traiter(this.sim.vider()); } return v; },
        tutoriel: () => { this.tutoActif = true; this.rafraichir(); },
        refus: () => { const e = this.e; const i = e.inventaire.findIndex((c) => c && aliment(c.id)); if (i < 0) return 'rien à manger'; e.satiete = this.sim.max; e.frustrationAlimentaire = 100; this.utiliserObjet(i); return i; },
        /** Laisse l'écho avec `part` (0–1) de ses PV de combat perdus, pour essayer « Panser les blessures ». */
        blesser: (part = 0.75) => { this.e.pvCombat = Math.max(0, Math.round(Math.max(1, Math.round(this.e.caracs.robustesse * 7)) * (1 - part) * 10) / 10); this.sauver(); this.rafraichir(); return this.e.pvCombat; },
        // une scène d'action seule, sans effet sur l'écho : __ranch.scene('brosser', 'soin')
        scene: (kind = 'brosser', groupe = 'soin', image = '') => { this.ouvrirScene({ kind, groupe, image: image && asset(image), titre: kind }, () => []); },
        // le voile du sommeil seul (sans faire dormir l'écho)
        sommeil: () => this.endormir(8, false),
        corvee: (id = CORVEES[0].id) => { const c = CORVEES.find((x) => x.id === id)!; delete this.e.derniereCorvee[c.id]; this.ouvrirScene({ kind: sceneCorvee(c.id), groupe: 'corvee', image: asset(c.icone), titre: c.nom }, () => { const r = this.sim.jouerCorvee(c.id, 1); return r.ok ? { lignes: [PALIER_CORVEE[r.palier]], essais: r.essais, reponses: this.sim.reponsesCorvee() } : null; }); },
      };
    }
  }

  /** Ce que ces modules prennent en charge parmi les sorties de la simulation (vrai : traité). */
  traiterExtras(x: Sortie): boolean {
    switch (x.type) {
      case 'evenement': {
        if (x.nature === 'bruit') return false;
        const v = this.sim.visiteur;
        if (v) this.visite.arriver(v);
        this.son('reveal');
        this.flotter(x.texte, COULEUR.note);
        return true;
      }
      case 'visiteur-parti': this.visite.partir(); this.flotter(x.texte, COULEUR.note); return true;
      case 'visite': {
        if (!x.spontane) return true;
        const couleur = x.sens > 0 ? COULEUR.bien : x.sens < 0 ? COULEUR.mal : COULEUR.note;
        if (this.visite.libre && !this.visite.hoteOccupe()) this.visite.geste(x.nature as GesteVisite, x.reussi, () => this.flotter(x.texte, couleur));
        else this.flotter(x.texte, couleur);
        return true;
      }
      case 'relation':
        // un palier de relation franchi : après le geste qui l'a provoqué
        this.later(() => { this.flotter(x.texte, x.sens > 0 ? COULEUR.bien : COULEUR.mal); this.son(x.sens > 0 ? 'reveal' : 'darkHover'); }, 4800);
        return true;
      case 'evolution': this.lancerEvolution(x.de, x.vers, x.avant); return true;
      default: return false;
    }
  }

  /** Les gestes avec le visiteur, proposés quand on clique sur lui. */
  // (sans tampon : la fiche se ferme aussitôt, l'appel et la course suivent le clic sans attendre)
  choixVisiteur(): Choix[] {
    const v = this.sim.visiteur;
    const libre = this.visite.libre;
    const occupe = libre ? '1 h' : 'pas maintenant';
    const fatigue = aBoutDeForces(this.e);
    return [
      { k: 'temps', nom: 'Passer du temps ensemble', icone: IC.partage, detail: occupe, off: !libre, agir: () => this.duoVisiteur('temps'), sansTampon: true },
      { k: 'jouer', nom: 'Jouer ensemble', icone: IC.balle, detail: occupe, off: !libre, agir: () => this.duoVisiteur('jeu'), sansTampon: true },
      { k: 'bagarre', nom: 'Se bagarrer', icone: IC.course, detail: occupe, off: !libre, agir: () => this.duoVisiteur('bagarre'), sansTampon: true },
      { k: 'r-combat', nom: 'Combat', rubrique: true },
      { k: 'combat', nom: v ? `Affronter ${v.nom}` : 'Affronter', icone: IC.course, off: !this.props.surCombat || !v || fatigue || !libre,
        detail: !this.props.surCombat ? 'à venir' : fatigue ? `${this.e.nom} est à bout de forces` : 'un vrai combat',
        agir: () => { if (!v || !this.props.surCombat) return; this.sauver(); this.props.surCombat(this.e, 'entrainement', v); } },
    ];
  }

  /** Passer du temps, jouer, se bagarrer : le visiteur rejoint notre écho, le geste se joue, une heure passe. */
  duoVisiteur(nature: 'temps' | 'jeu' | 'bagarre') {
    const s = this.sim;
    const r = nature === 'temps' ? s.passerDuTempsAvecVisiteur() : s.duoAvecVisiteur(nature);
    if (!r.ok) { this.traiter(s.vider()); this.flotter(r.raison, COULEUR.mal); this.rafraichir(); return; }
    // ce qui s'est passé pendant l'heure est montré après le geste (sans second geste spontané par-dessus)
    const sorties = s.vider().filter((x) => !(x.type === 'visite' && x.spontane));
    const reussi = 'succes' in r ? !!r.succes : true;
    this.visite.geste(nature, reussi, () => {
      this.montrerSortie({ texte: 'Une heure plus tard…', sous: r.texte }, 3600);
      this.traiter(sorties); this.sauver(); this.rafraichir();
    });
  }

  /** Pages du carnet hors maquette (quêtes, relations, mémoire : src/jeu/commun/carnet), état partagé par les deux pages. */
  etatCarnet = new EtatCarnet((nom, vol) => this.son(nom, vol));
  pagesCarnet() {
    const k = this.state.section;
    const section: SectionCarnet | null = this.state.carnet && (k === 'quetes' || k === 'relations' || k === 'memoire') ? k : null;
    const p = pagesCarnet(section, { etat: this.e, monde: this.props.monde, vue: this.etatCarnet });
    return { carnetGauche: p.gauche, carnetDroite: p.droite };
  }

  /** Il évolue : la séquence prend tout l'écran, la musique se tait, le temps s'arrête. */
  lancerEvolution(de: Stade, vers: Stade, avantImg?: string) {
    const e = this.e; const s = this.state;
    const avant = avantImg || this.apparenceVue || apparence(e);
    this.evo = {
      de: asset(avant), vers: asset(apparence(e)),
      tailleDe: profilEcho({ stade: de, taille: e.taille, poids: e.poids }).echelle, tailleVers: this.taille(),
      depart: { x: s.ex + 75, y: s.ey + 226, echelle: perspective(s.ey) },
      ...textesEvolution(e, vers),
      surFin: this.finEvolution,
    };
    // l'évolution passe avant tout : ce qui était ouvert se ferme (fiche, poteau, voile du sommeil, carnet d'événement)
    if (this.state.evc) this.setState({ evc: false, evcFerme: false, playing: false });
    if (this.state.sommeil) this.setState({ sommeil: null });
    clearInterval(this.pasTimer);
    this.setState({ ouvert: null, quitter: false, carnetLeve: false, marche: false, eDur: 0 });
    this.rafraichir();
  }
  finEvolution = () => {
    this.evo = null;
    this.apparenceVue = apparence(this.e);
    this.sauver();
    this.rafraichir();
    this.later(() => { this.reagir(true, 'saute'); this.coeurs(4); }, 200);
    // ce qui est arrivé en même temps attendait la fin de la séquence
    const enAttente = this.apresEvolution; this.apresEvolution = [];
    if (enAttente.length) this.later(() => { this.traiter(enAttente); this.rafraichir(); }, 900);
  };
  /** Sorties arrivées pendant (ou avec) une évolution : traitées quand la séquence est finie. */
  apresEvolution: Sortie[] = [];

  /** Les zones que Jumpy montre pendant le tutoriel (repère 1280 × 800). */
  ciblesTutoriel = (): Record<string, Cible> => {
    const s = this.state; const k = perspective(s.ey); const t = this.taille();
    const h = 190 * t * k, l = Math.max(120, 150 * t * k);
    return {
      echo: { x: Math.round(s.ex + 75 - l / 2), y: Math.round(s.ey + 232 - h - 24), l: Math.round(l), h: Math.round(h + 40), rond: true },
      onglets: { x: 200, y: 540, l: 68, h: 228 },
      carnet: { x: 8, y: 530, l: 212, h: 258 },
      heure: { x: 24, y: 6, l: 308, h: 124 },
      sac: { x: 1156, y: 22, l: 102, h: 102 },
      poteau: { x: 1156, y: 126, l: 102, h: 112 },
    };
  };
  finTutoriel = () => {
    this.props.surTutorielVu?.();
    this.later(() => { this.tutoActif = false; this.rafraichir(); }, 600);
  };

  render(): ReactNode {
    const s = this.state;
    return (
      <Repere fond="#0d0a14">
        <VueRanch v={this.valeurs()} />
        {this.evo && <Evolution {...this.evo} sons={this.state.sons} />}
        {this.tutoActif && this.props.catalogue && this.props.personnage && (
          <Tutoriel etat={this.e} personnage={this.props.personnage} catalogue={this.props.catalogue} sons={this.state.sons} cibles={this.ciblesTutoriel} surFin={this.finTutoriel} />
        )}
        {s.temps && <FenetreTemps minute={this.e.minute} nomEcho={this.e.nom} filtre="url(#rk7Ui)" son={(n, ...a) => this.son(n, ...a)}
          surValider={(h) => this.attendre(h)} surAnnuler={() => this.setState({ temps: false })} />}
        {s.pansement && <FenetrePansement minute={this.e.minute} nomEcho={this.e.nom} etat={etatPlaies(this.e)} max={demiHeuresPansement(this.e)}
          apres={(n) => plaiesApres(this.e, n)} filtre="url(#rk7Ui)" son={(n, ...a) => this.son(n, ...a)}
          surValider={(n) => this.panser(n)} surAnnuler={() => this.setState({ pansement: false })} />}
        {s.sommeil && <VoileSommeil s={s.sommeil} />}
        {s.refus && <NoteRefus r={s.refus} surChoix={(cle) => this.repondreRefus(cle)} />}
      </Repere>
    );
  }

  valeurs() {
    const s = this.state; const e = this.e; const g = this.signes;
    const h = e.minute / 60;
    const m = lumiere(h);
    const nom = e.nom;
    const t = this.taille();
    const prof = this.profil();
    const verbes = VERBES.map((v, i) => ({
      nom: v.nom, court: v.court, icone: IC[v.k], teinte: v.teinte, haut: 12 + i * 42, largeur: Math.round(v.court.length * 9.4 + 6), etiquette: v.nom,
      cls: [s.survol === i ? 'actif' : '', s.ouvert === v.k ? 'ouvert' : ''].join(' '),
      ouvertAria: s.ouvert === v.k ? 'true' : 'false',
      survol: () => {
        if (this.state.survol !== i) this.setState({ survol: i });
        const n = Date.now(); if (n - (this.dernierSon[i] || 0) > 1000) { this.dernierSon[i] = n; this.son('paperTick'); }
      },
      quitte: () => { if (this.state.survol === i) this.setState({ survol: -1 }); },
      ouvrir: () => { const o = this.state.ouvert === v.k ? null : v.k; this.son('leather'); this.setState({ ouvert: o, actif: -1, tamponne: null, quitter: false, ongletFiche: 'portrait' }); if (o === 'echo') this.reagir(true, ''); },
    }));
    const iv = VERBES.findIndex((v) => v.k === s.ouvert);
    let n = -1;
    const liste = s.ouvert && s.ouvert !== 'echo' ? this.choixDe(s.ouvert) : [];
    const choix = liste.map((c) => {
      if (c.rubrique) return { estRubrique: true, estChoix: false, nom: c.nom };
      const i = ++n; const off = !!c.off;
      return {
        estRubrique: false, estChoix: true, nom: c.nom, aImage: !!c.image, image: c.image || '', aIcone: !c.image, icone: c.icone || IC.mystere,
        detail: c.detail || '', off, tamponne: s.tamponne === c.k, cls: s.actif === i && !off ? 'act' : '',
        survol: () => { if (!off && this.state.actif !== i && !this.state.tamponne) { this.son('paperTick'); this.setState({ actif: i }); } },
        prendre: () => this.prendre(c),
      };
    });
    const sec = SECTIONS.find((x) => x.k === s.section)!;
    const p = (k: Section) => s.section === k;
    const besoinsVus = g.besoins.filter((b) => b.besoin !== 'comportement' && b.besoin !== 'repus');
    const rappels = besoinsVus.slice(0, 2).map((b) => ({ texte: b.indice }));
    if (e.dejections.length) rappels.push({ texte: `ramasser derrière ${nom}` });
    if (!e.inventaire.some((c) => c && aliment(c.id))) rappels.push({ texte: 'plus rien à manger dans le sac' });
    const journal = e.journal.map((j) => ({ heure: hm(j.minute), texte: j.texte, jour: j.jour }));
    const parJour = new Map<number, { heure: string; texte: string }[]>();
    journal.slice(-24).forEach((j) => { if (!parJour.has(j.jour)) parJour.set(j.jour, []); parJour.get(j.jour)!.push({ heure: j.heure, texte: j.texte }); });
    const journalJours = [...parJour.entries()].reverse().map(([jour, lignes]) => ({ titre: jour === e.jour ? 'Aujourd’hui' : `Jour ${ageJours({ jour, naissance: e.naissance })}`, lignes: lignes.reverse() }));
    const visiteur = this.sim.visiteur;
    const ouvertVisiteur = s.ouvert === 'visiteur';
    this.apparenceVue = apparence(e);
    // états qui gravitent : les besoins pressants (urgence 2 et plus)
    const etats = ORDRE_ETATS.filter((k) => g.besoins.some((b) => ETAT_DE_BESOIN[b.besoin] === k && (b.urgence >= 2 || b.besoin === 'maladie' || b.besoin === 'blessure')));
    const visibles = e.comportement || s.evc || e.mort ? [] : etats;
    const cy = Math.round(234 - 92 * t), rx = Math.round(70 + 34 * t), ry = Math.round(22 + 10 * t);
    const ordreSac = e.inventaire;
    const sc = s.scene; const ph = s.scPhase;
    // part opaque de l'image de l'écho (boîte utile) : la taille réelle de sa silhouette, pour ses déjections
    const imgEcho = this.imageCatalogue(apparence(e));
    const opaqueEcho = imgEcho?.boite && imgEcho.h ? imgEcho.boite.h / imgEcho.h : undefined;
    const sacMenu = (() => {
      const c = s.sacMenu >= 0 ? ordreSac[s.sacMenu] : null; const d = c && descriptionObjet(c.id);
      if (!c || !d || s.sacFerme) return { sacMenuVisible: false, sacMenuInfo: false };
      const col = s.sacMenu % 5, lig = Math.floor(s.sacMenu / 5);
      const index = s.sacMenu;
      const utilisable = !!aliment(c.id) || !!objetDivers(c.id)?.usage;
      return {
        sacMenuVisible: true, sacMenuInfo: !!s.sacMenuInfo, sacMenuNom: d.nom, sacMenuTexte: d.description,
        sacMenuX: Math.round(34 + 22 + col * 104 + 46), sacMenuY: Math.round(30 + 26 + lig * 106 - 6),
        sacInfos: () => { this.son('page', 0.5); this.setState((st) => ({ sacMenuInfo: !st.sacMenuInfo })); },
        sacUtiliser: () => { if (!utilisable) { this.son('refus'); return; } this.setState({ sacMenu: -1 }); this.fermerSac(); this.later(() => this.utiliserObjet(index), 1100); },
      };
    })();
    return {
      ...ciel(h), nuagesFiltre: 'url(#rk7Decor)', lanternes: lanternes(h),
      ...(sc ? {
        sceneVisible: true,
        scCls: ['k-' + sc.kind, 'g-' + sc.groupe, sc.gains.length ? 'gagne' : '', ph === 'ouvre' ? 'ouvre' : '', ['saut', 'agit', 'note'].includes(ph) ? 'dedans' : '', ['agit', 'note'].includes(ph) ? 'agit' : '', ph === 'note' ? 'note' : '', ph === 'ferme' ? 'ferme agit' : ''].join(' '),
        scDx: sc.dx, scDy: sc.dy, scS0: sc.s0, scH: sc.h, scTete: sc.tete, echoOp: ph === 'ouvre' ? 1 : 0, scImage: sc.image,
        scNote: ph === 'note' || ph === 'ferme', scTitre: sc.titre, scLignes: sc.lignes.map((x) => ({ t: x })), fermerScene: this.fermerScene,
        scAReponses: !!sc.reponses?.length, scSansReponse: !sc.reponses?.length,
        scReponses: (sc.reponses ?? []).map((x) => ({ texte: x.libelle, cls: x.cle === 'rien' ? 'discret' : '', choisir: (ev?: { stopPropagation?: () => void }) => { ev?.stopPropagation?.(); this.repondreScene(x.cle); } })),
        scAGains: sc.gains.length > 0, scGains: sc.gains.map((x, i) => ({ ...x, delai: (0.5 + i * 0.25).toFixed(2) })), scEssais: essaisScene(sc.essais),
      } : { sceneVisible: false, echoOp: 1, scNote: false, scAGains: false, scGains: [], scEssais: [], scAReponses: false, scSansReponse: true, scReponses: [] }),
      bgFilter: m.bg, gradeColor: m.c, gradeOpacity: m.o.toFixed(3), glow: m.glow.toFixed(3), vignette: m.vig.toFixed(3), fireflies: m.fly,
      paperFilter: 'url(#rk7Ui)', matDecor: m.matDecor, matUi: m.matUi, matEcho: m.matEcho, decorFilter: m.decor, fondTexte: m.ft.toFixed(3),
      time: m.heure, period: m.periode, echoFilter: m.echo, pieces: e.or,
      // l'écho
      echoImg: asset(apparence(e)), echoAlt: `${nom}, écho ${NOM_STADE[e.stade]}`,
      caresserAria: e.comportement ? `${nom} a quelque chose à vous montrer` : `Caresser ${nom}`, evtAria: `${nom} a fait quelque chose : ouvrir le carnet`,
      ex: s.ex, ey: s.ey, eDur: s.eDur, eSens: s.eSens, eScale: (0.86 + (s.ey - 235) / 135 * 0.28).toFixed(3),
      eTaille: t.toFixed(3), eOmbre: this.ombreDe(apparence(e), prof, s.eSens === 'gauche'), teteBulle2: Math.round(-74 - (t - 1) * 180), teteMain: Math.round(32 - (t - 1) * 175), eZ: 100 + s.ey,
      echoAnim: s.marche ? 'marche' : s.anim, demarche: prof.classes, cycle: (prof.cycle / (s.marche ? this.course : 1)).toFixed(3),
      caresser: this.caresser, mainVisible: s.mainVisible,
      rienDuTout: false,
      orbite: `path('M${75 - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0')`,
      etatsOrbite: visibles.map((k, i) => ({ nom: NOM_ETAT[k][e.genre === 'f' ? 1 : 0], image: asset(`interface/etats/orbite/${k}.webp`), delai: (-13 * i / visibles.length).toFixed(2) })),
      bulleImg: s.bulleImg, orbeTeinte: TEINTES_EMO[0], emoTeinte: teinteEmotion(g.expression.id),
      bulleBulle: false, bulleHalo: false, signe_joyeux: false, signe_fier: false, signe_surpris: false, signe_anxieux: false,
      emoFlotte: s.bulle !== null && !e.comportement && !s.evc,
      teteSigne: Math.round(-30 - (t - 1) * 180), teteOrbe: Math.round(-2 - (t - 1) * 180), teteAlerte: Math.round(-34 - (t - 1) * 180),
      ...this.valsEvc(m),
      coeurs: s.coeurs, flottants: s.flottants,
      evtVisible: !!e.comportement && !s.evc && !s.scene && !e.mort,
      // déjections : on nettoie là où elles sont tombées
      crottes: e.dejections.map((d) => {
        // taille proportionnelle à celle de l'écho qui l'a laissée (dejections.ts)
        const { x, y, z, l, h, bx, by } = placerDejection(d, e, (d.stade ?? e.stade) === e.stade ? opaqueEcho : undefined);
        return {
          x, y, z, l, h, bx, by, image: asset(d.nature === 'vomi' ? 'activites/ranch/vomi.png' : 'activites/ranch/dejection-detouree.webp'),
          cls: s.dejPart.includes(d.id) ? 'part' : s.dejSurvol === d.id ? 'survol' : '',
          survol: () => this.setState({ dejSurvol: d.id }), quitte: () => this.setState((st) => (st.dejSurvol === d.id ? { dejSurvol: null } : null)),
          nettoyer: () => {
            if (this.state.dejPart.includes(d.id)) return;
            this.son('balai'); this.setState((st) => ({ dejPart: st.dejPart.concat(d.id) }));
            this.later(() => { this.sim.nettoyer(d.id); this.setState((st) => ({ dejPart: st.dejPart.filter((k) => k !== d.id) })); this.son('pencil'); this.traiter(this.sim.vider()); this.rafraichir(); }, 650);
          },
        };
      }),
      visiteur: this.visite.valeurs(() => { this.son('leather'); this.setState({ ouvert: this.state.ouvert === 'visiteur' ? null : 'visiteur', quitter: false, actif: -1 }); }, ouvertVisiteur),
      ...this.pagesCarnet(),
      // le petit carnet (onglets) et la fiche
      verbes, choix, ceintureCls: s.carnet || s.sacOuvert || s.sortie || s.evc || s.scene ? 'repli' : '',
      carnetLeve: s.carnetLeve && !s.carnet ? 'leve' : '',
      leverCarnet: () => { if (!this.state.carnetLeve) { this.son('paperTick'); this.setState({ carnetLeve: true, survol: -1 }); } },
      baisserCarnet: () => { if (this.state.carnetLeve) this.setState({ carnetLeve: false }); },
      ficheVisible: !!s.ouvert, fichePointe: iv >= 0 ? Math.round(201 - 42 * iv) : 0,
      ficheTitre: ouvertVisiteur ? `Avec ${visiteur?.nom ?? 'le visiteur'}` : s.ouvert === 'echo' ? nom : s.ouvert === 'soins' ? `Prendre soin ${this.a('de lui', 'd’elle')}` : s.ouvert === 'jouer' ? 'Passer un moment ensemble' : s.ouvert === 'activites' ? 'Entraînements et corvées' : s.ouvert === 'ranch' ? 'Autour du ranch' : '',
      ficheBesoin: '', ficheCouleur: '#6b4f33', ficheEcho: s.ouvert === 'echo', ficheChoix: s.ouvert !== 'echo',
      ...this.valsFiche(),
      // le carnet
      carnetVisible: s.carnet, livreCls: s.ferme ? 'ferme' : '', voileCls: s.ferme ? 'part' : '', coteCls: s.carnet || s.sacOuvert || s.evc || s.scene ? 'cache' : '',
      jourTexte: `Jour ${ageJours(e)} · ${saison(e.jour)}`, jourTexteMin: `jour ${ageJours(e)} · ${saison(e.jour).toLowerCase()}`,
      // le sac
      sacVisible: s.sacOuvert, sacCls: s.sacFerme ? 'ferme' : '', sacVoileCls: s.sacFerme ? 'part' : '', sacVoileDelai: s.sacFerme ? '0.5' : '0',
      ouvrirSac: () => this.ouvrirLeSac(), fermerSac: this.fermerSac,
      ...sacMenu,
      arreter: (ev: { stopPropagation?: () => void }) => { ev?.stopPropagation?.(); },
      ressourcesSac: RESSOURCES.map((r) => { const q = this.props.ressources?.[r.k] ?? 0; return { ...r, image: asset(`objets/materiaux/${r.k}.png`), qte: q, cls: q > 0 ? '' : 'vide' }; }),
      sacCases: ordreSac.map((c, i) => {
        const d = c && descriptionObjet(c.id);
        const marque = (s.dndDe === i ? ' souleve' : '') + (s.dndCible === i && s.dndDe >= 0 && s.dndDe !== i ? ' cible' : '');
        const base = {
          delai: (0.86 + i * 0.03).toFixed(2),
          survolDnd: (ev: DragEvent) => { if (this.state.dndDe < 0) return; ev?.preventDefault?.(); if (ev?.dataTransfer) ev.dataTransfer.dropEffect = 'move'; if (this.state.dndCible !== i) this.setState({ dndCible: i }); },
          quitteDnd: () => { if (this.state.dndCible === i) this.setState({ dndCible: -1 }); },
          deposer: (ev: DragEvent) => { ev?.preventDefault?.(); this.deplacerSac(this.state.dndDe, i); },
          finDnd: () => { if (this.state.dndDe >= 0 || this.state.dndCible >= 0) this.setState({ dndDe: -1, dndCible: -1 }); },
        };
        if (!c || !d) return { ...base, vide: true, plein: false, cls: 'vide' + marque, nom: 'emplacement vide', image: '', qte: 0, survol: () => this.setState({ sacSurvol: -1 }), choisir: () => { if (this.state.sacMenu >= 0) this.setState({ sacMenu: -1 }); }, prendreDnd: (ev: DragEvent) => ev?.preventDefault?.() };
        return {
          ...base, vide: false, plein: true, cls: marque + (s.sacMenu === i ? ' choisi' : ''), nom: d.nom, image: asset(d.icone), qte: c.qte,
          choisir: () => { this.son('paperTick'); this.setState((st) => (st.sacMenu === i ? { sacMenu: -1, sacMenuInfo: false } : { sacMenu: i, sacMenuInfo: false })); },
          survol: () => { if (this.state.sacSurvol !== i && this.state.dndDe < 0) { this.son('paperTick'); this.setState({ sacSurvol: i }); } },
          prendreDnd: (ev: DragEvent & { currentTarget: HTMLElement }) => {
            if (ev?.dataTransfer) { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(i)); const im = ev.currentTarget?.querySelector('img'); if (im) ev.dataTransfer.setDragImage(im, 29, 29); }
            this.setState({ dndDe: i, sacSurvol: -1, sacMenu: -1 });
          },
        };
      }),
      // quitter le ranch : le poteau indicateur
      quitterVisible: s.quitter, quitterAria: s.quitter ? 'true' : 'false',
      basculerQuitter: () => { this.son('leather'); this.setState({ quitter: !this.state.quitter, ouvert: null }); },
      poteauCls: s.quitter ? 'ouvert' : '',
      destinations: DESTINATIONS.map((d, i) => ({ ...d, r: [-1.6, 1.2, -0.8][i] || 0, delai: (0.06 + i * 0.07).toFixed(2), survol: () => this.son('paperTick'), partir: () => { this.setState({ quitter: false }); this.partir(d.texte, d.lieu); } })),
      contenuCls: s.contenuCache ? 'cache' : '', tourneVisible: !!s.tourne, tourneCls: s.tourne === 'arriere' ? 'arriere' : '',
      aDesNouvelles: s.nouvelles > 0, nouvelles: s.nouvelles > 9 ? '9+' : s.nouvelles,
      ouvrirCarnet: () => { this.son('bookArrive'); this.setState({ carnet: true, carnetLeve: false, ferme: false, section: 'sommaire', ouvert: null, quitter: false }); },
      fermerCarnet: this.fermerCarnet,
      pageTitre: sec.titre, pageSurtitre: sec.surtitre,
      pSommaire: p('sommaire'), pJournal: p('journal'), pSac: false, pRelations: false, pCarte: false, pMemoire: false, pAstuces: p('astuces'), pOptions: p('options'),
      ...(p('astuces') ? this.valsAstuces() : { astThemes: [], astuces: [] }),
      onglets: SECTIONS.map((x, i) => ({ nom: x.nom, court: x.court, icone: x.icone, delai: (1.5 + i * 0.07).toFixed(2), cls: s.section === x.k ? 'ici' : '', ouvrir: () => this.allerA(x.k) })),
      sommaire: SECTIONS.slice(1).map((x, i) => ({ num: ['I', 'II', 'III', 'IV', 'V', 'VI'][i], nom: x.nom, page: 'page' in x ? x.page : '', aBadge: x.k === 'journal' && s.nouvelles > 0, badge: s.nouvelles, ouvrir: () => this.allerA(x.k) })),
      journal: journal.slice(-8), journalCourt: journal.slice(-3), journalJours, rappels: rappels.slice(0, 3),
      sacNourriture: e.inventaire.flatMap((c) => { const al = c && aliment(c.id); return al && c ? [{ nom: al.nom, image: asset(al.icone), qte: c.qte, opacite: 1 }] : []; }),
      lieux: [],
      memoireDetail: `${NOM_STADE[e.stade]} · ${NOM_GRAINE[e.graine].toLowerCase()} · jour ${ageJours(e)}`,
      reglages: [
        { nom: 'Bruitages', actif: s.sons, basculer: () => this.setState({ sons: !this.state.sons }) },
        { nom: 'Musique', actif: s.musique, basculer: () => this.setState({ musique: !this.state.musique }) },
      ],
      curseurs: [
        { nom: 'Volume de la musique', valeur: s.volumeMusique, changer: (ev: { target: HTMLInputElement }) => this.setState({ volumeMusique: Number(ev.target.value) }) },
        { nom: 'Volume des bruitages', valeur: s.volumeBruitages, changer: (ev: { target: HTMLInputElement }) => this.setState({ volumeBruitages: Number(ev.target.value) }) },
      ],
      retourMenu: () => { this.sauver(); this.props.surQuitter(); },
      sauver: () => { this.sauver(); this.son('stamp'); this.setState({ sauve: 'partie sauvegardée' }); this.later(() => this.setState({ sauve: '' }), 2500); }, sauveTexte: s.sauve,
      sortieVisible: !!s.sortie, sortieTexte: s.sortie?.texte ?? '', sortieSous: s.sortie?.sous ?? '', sortieImage: s.sortie?.image ?? '',
      sortieCls: s.sortie?.bloquant ? 'bloquant' : '', sortieBouton: s.sortie?.bloquant ? { texte: 'Revenir au menu', agir: () => this.props.surQuitter() } : null,
      // pendant l'évolution, c'est la séquence qui montre l'écho
      ...(this.evo ? { echoOp: 0, ceintureCls: 'repli', coteCls: 'cache' } : {}),
    };
  }
}
