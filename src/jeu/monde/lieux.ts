// Les lieux du village : décor, PNJ (quand ils sont là, où ils se tiennent, ce qu'on peut leur demander) et passages.
// Positions en % du décor (le décor couvre le repère 1280 × 800 sans être déformé ; ses bords peuvent être rognés).
// Les conditions d'apparition et les horaires suivent le prototype (voir la spécification du monde).
import { boutiqueOuverte, construit, type Monde } from '@/moteur/monde';
import type { Etat } from '@/moteur/simulation';
import type { Panneau } from './actions';

export type IdLieu = 'village' | 'foret' | 'sanctuaire' | 'atelier' | 'boutique';
export type Destination = IdLieu | 'ranch' | 'exploration';

export interface ContexteLieu {
  m: Monde;
  e: Etat;
  /** heure du jour (0–23) */
  h: number;
  /** heure absolue (jour × 24 + heure) */
  maintenant: number;
}

/** Une ligne du petit menu d'un PNJ. */
export interface EntreeMenu {
  libelle: string;
  /** icône (public/assets/interface/icones/<nom>.png) ou tracé du ranch (« discussion »…) */
  icone?: string;
  scene?: string;
  sujet?: string;
  panneau?: Panneau;
  aller?: Destination;
}

export interface PnjLieu {
  id: string;
  nom: string;
  visible: (c: ContexteLieu) => boolean;
  image: (c: ContexteLieu) => string;
  /** Calque plein cadre (aligné sur le décor) : la zone cliquable est la boîte utile de l'image. */
  calque?: boolean;
  /** Sprite posé : centre horizontal, pieds (depuis le haut) et hauteur, en % du décor. */
  pose?: { x: number; pieds: number; hauteur: number; miroir?: boolean };
  /** Promenade : le PNJ va et vient entre ces bornes (pieds), sa taille suit la profondeur. */
  promenade?: { xMin: number; xMax: number; piedsMin: number; piedsMax: number; hauteur: number; pas: [number, number]; periode: [number, number] };
  /** Une scène jouée directement au clic (première rencontre, quête en cours) au lieu du menu. */
  premier?: (c: ContexteLieu) => { scene: string; sujet?: string } | null;
  menu: (c: ContexteLieu) => EntreeMenu[];
}

export interface Passage { libelle: string; vers: Destination; position: 'haut' | 'bas' | 'gauche' | 'droite'; icone?: string }

export interface Lieu {
  id: IdLieu;
  nom: string;
  /** Décor (chemin dans public/assets) et proportions de l'image. */
  decor: (c: ContexteLieu) => string;
  ratio: number;
  /** Décor donné aux scènes jouées ici quand elles n'en imposent pas un autre (même chemin, sans « decors/ »). */
  decorScene: (c: ContexteLieu) => string;
  pnj: PnjLieu[];
  passages: (c: ContexteLieu) => Passage[];
  /** Musique du lieu (public/assets/sons/musiques). */
  musique: string;
  /** Où se tient l'écho (pieds, % du décor). */
  echo: { x: number; pieds: number; hauteur: number };
}

const d = (m: Monde, cle: string) => !!m.drapeaux[cle];
const n = (m: Monde, cle: string) => Number(m.drapeaux[cle] ?? 0) || 0;
const discuter = (scene: string, sujet?: string): EntreeMenu => ({ libelle: 'Discuter', icone: 'discussion', scene, sujet });

/** Le stand de Lady Roger ouvre 12 heures après qu'elle a rejoint le village. */
export const standPret = (c: ContexteLieu) => d(c.m, 'ladyroger.recrutee') && c.maintenant >= n(c.m, 'ladyroger.stand_a');
/** Le potager de Tourby est prêt 12 heures après son arrivée. */
export const potagerPret = (c: ContexteLieu) => d(c.m, 'tourby.recrute') && c.maintenant >= n(c.m, 'tourby.potager_a');
/** Maïko est prêt à recruter : nourri il y a au moins 6 heures. */
const maikoRassasie = (c: ContexteLieu) => d(c.m, 'maiko.nourri') && c.maintenant - n(c.m, 'maiko.nourri_a') >= 6;

const ATELIER = (c: ContexteLieu) => construit(c.m, 'atelier');
const ENTREPOT = (c: ContexteLieu) => construit(c.m, 'entrepot');

const ash: PnjLieu = {
  id: 'ash', nom: 'Ash', calque: true,
  visible: (c) => d(c.m, 'ash.recrute') && !ATELIER(c),
  image: () => 'pnj/ash/village.png',
  premier: (c) => (d(c.m, 'ash.village_vu') ? null : { scene: 'ash-village' }),
  menu: () => [discuter('ash-village'), { libelle: 'Réaliser des travaux', icone: 'marteau', panneau: 'travaux' }],
};

export const LIEUX: Record<IdLieu, Lieu> = {
  village: {
    id: 'village', nom: 'Le village', ratio: 1536 / 1024, musique: 'intro-sanctuary',
    decor: () => 'decors/village/ruines.png', decorScene: () => 'village/ruines',
    echo: { x: 37, pieds: 88, hauteur: 12 },
    passages: () => [
      { libelle: 'Vers la forêt', vers: 'foret', position: 'haut' },
      { libelle: 'Vers le sanctuaire', vers: 'sanctuaire', position: 'gauche' },
      { libelle: 'Rentrer au ranch', vers: 'ranch', position: 'bas' },
    ],
    pnj: [
      ash,
      {
        id: 'atelier', nom: 'L’atelier', calque: true,
        visible: ATELIER, image: () => 'decors/village/atelier.png',
        menu: () => [{ libelle: 'Entrer dans l’atelier', icone: 'marteau', aller: 'atelier' }],
      },
      {
        id: 'lady-roger', nom: 'Lady Roger', calque: true,
        visible: standPret, image: () => 'pnj/lady-roger/stand.png',
        premier: (c) => (d(c.m, 'ladyroger.stand_vu') ? null : { scene: 'lady-roger', sujet: 'stand' }),
        menu: () => [{ libelle: 'Commercer', icone: 'cadeau', panneau: 'stand' }, discuter('lady-roger', 'discuter')],
      },
      {
        id: 'lady-roger', nom: 'Lady Roger',
        visible: (c) => !standPret(c), image: () => 'pnj/lady-roger/neutre.png',
        promenade: { xMin: 40, xMax: 60, piedsMin: 74, piedsMax: 82, hauteur: 9, pas: [1, 5], periode: [1600, 2500] },
        premier: () => ({ scene: 'lady-roger', sujet: 'promenade' }),
        menu: () => [],
      },
      {
        id: 'bourbella', nom: 'Bourbella', pose: { x: 14, pieds: 82, hauteur: 11 },
        visible: (c) => d(c.m, 'bourbella.recrutee'), image: () => 'pnj/bourbella/neutre.png',
        menu: () => [discuter('bourbella', 'discuter'), { libelle: 'Améliorer la pêche', icone: 'gouttes', scene: 'bourbella', sujet: 'peche' }],
      },
      {
        id: 'finn', nom: 'Finn', pose: { x: 82, pieds: 91, hauteur: 8, miroir: true },
        visible: (c) => d(c.m, 'finn.recrute'), image: () => 'pnj/finn/neutre.png',
        menu: () => [
          { libelle: 'Obtenir des informations', icone: 'tableau', scene: 'finn', sujet: 'infos' },
          { libelle: 'Partir en exploration', icone: 'repere', scene: 'finn', sujet: 'exploration' },
          discuter('finn', 'discuter'),
        ],
      },
      {
        id: 'glamp', nom: 'Glamp',
        visible: (c) => d(c.m, 'glamp.recrutee') && !ATELIER(c), image: () => 'pnj/glamp/neutre.png',
        promenade: { xMin: 56, xMax: 64, piedsMin: 44, piedsMax: 44, hauteur: 4.5, pas: [0.5, 2.5], periode: [1400, 2100] },
        menu: () => [discuter('glamp', 'parler')],
      },
      {
        id: 'grimp', nom: 'Grimp', pose: { x: 52, pieds: 45, hauteur: 4.6 },
        visible: (c) => d(c.m, 'grimp.recrute') && !ATELIER(c), image: () => 'pnj/grimp/neutre.png',
        menu: () => [discuter('grimp')],
      },
      {
        id: 'garry', nom: 'Garry', pose: { x: 85, pieds: 76, hauteur: 15.4, miroir: true },
        visible: (c) => d(c.m, 'garry.vaincu'), image: () => 'pnj/garry/face.png',
        menu: () => [discuter('garry')],
      },
      {
        // Ajout de la refonte : le potager de Tourby (activité « Jardin » du ranch dans le prototype) se tient au village.
        id: 'tourby', nom: 'Tourby', pose: { x: 24, pieds: 86, hauteur: 8 },
        visible: potagerPret, image: () => 'pnj/tourby/neutre.png',
        premier: (c) => (n(c.m, 'tourby.potager_jour') ? null : { scene: 'tourby', sujet: 'parler' }),
        menu: () => [
          { libelle: 'Récolte journalière', icone: 'gerbe', scene: 'tourby', sujet: 'recolte' },
          { libelle: 'Nodules nutritifs ?', icone: 'buisson', scene: 'tourby', sujet: 'nodules' },
          { libelle: 'Aménager le potager', icone: 'seau', scene: 'tourby', sujet: 'amenager' },
        ],
      },
    ],
  },

  foret: {
    id: 'foret', nom: 'La forêt du village', ratio: 1536 / 1024, musique: 'intro-sanctuary',
    decor: () => 'decors/foret/entree.png', decorScene: () => 'foret/entree',
    echo: { x: 60, pieds: 87, hauteur: 13 },
    passages: () => [
      { libelle: 'Partir en exploration', vers: 'exploration', position: 'haut' },
      { libelle: 'Vers le centre du village', vers: 'village', position: 'bas' },
    ],
    pnj: [
      {
        id: 'maiko', nom: 'Maïko', calque: true,
        visible: (c) => !ENTREPOT(c),
        image: (c) => (d(c.m, 'maiko.recrute') || maikoRassasie(c) ? 'pnj/maiko/coffre.png' : 'pnj/maiko/village.png'),
        premier: (c) => (d(c.m, 'maiko.recrute') ? null : { scene: 'maiko', sujet: 'parler' }),
        menu: () => [discuter('maiko', 'discuter'), { libelle: 'Déposer des choses', icone: 'abri', panneau: 'coffre' }],
      },
      {
        id: 'karla', nom: 'Karla', calque: true,
        visible: (c) => c.e.jour >= 3 && c.h >= 4 && c.h < 20,
        image: () => 'pnj/karla/foret.png',
        premier: () => ({ scene: 'karla' }),
        menu: () => [],
      },
    ],
  },

  sanctuaire: {
    id: 'sanctuaire', nom: 'Le sanctuaire', ratio: 1672 / 941, musique: 'intro-sanctuary',
    decor: () => 'decors/village/sanctuaire.png', decorScene: () => 'village/sanctuaire',
    echo: { x: 33, pieds: 90, hauteur: 13 },
    passages: () => [
      { libelle: 'Vers le centre du village', vers: 'village', position: 'droite' },
      { libelle: 'Rentrer au ranch', vers: 'ranch', position: 'bas' },
    ],
    pnj: [
      {
        id: 'myhra', nom: 'Myhra', pose: { x: 50, pieds: 77, hauteur: 42 },
        visible: () => true, image: () => 'pnj/myhra/sprite.png',
        premier: () => ({ scene: 'myhra' }),
        menu: () => [],
      },
      {
        id: 'hevann', nom: 'Hevann', calque: true,
        visible: (c) => d(c.m, 'hevann.vaincu'), image: () => 'pnj/hevann/sanctuaire.png',
        premier: (c) => (d(c.m, 'hevann.sanctuaire_vu') ? null : { scene: 'hevann', sujet: 'parler' }),
        menu: () => [
          { libelle: 'Améliorer l’entraînement', icone: 'feu', scene: 'hevann', sujet: 'entrainement' },
          { libelle: 'Motiver l’écho', icone: 'gerbe', scene: 'hevann', sujet: 'motiver' },
        ],
      },
    ],
  },

  atelier: {
    id: 'atelier', nom: 'L’atelier', ratio: 1536 / 1024, musique: 'intro-sanctuary',
    decor: (c) => (ENTREPOT(c) ? 'decors/atelier/avec-entrepot.png' : 'decors/atelier/sans-entrepot.png'),
    decorScene: (c) => (ENTREPOT(c) ? 'atelier/avec-entrepot' : 'atelier/sans-entrepot'),
    echo: { x: 74, pieds: 92, hauteur: 17 },
    passages: () => [{ libelle: 'Retour au village', vers: 'village', position: 'bas' }],
    pnj: [
      {
        id: 'ash', nom: 'Ash', calque: true,
        visible: () => true, image: () => 'pnj/ash/atelier.png',
        menu: () => [discuter('ash-atelier'), { libelle: 'Réaliser des travaux', icone: 'marteau', panneau: 'travaux' }],
      },
      {
        id: 'glamp', nom: 'Glamp', calque: true,
        visible: (c) => d(c.m, 'glamp.recrutee'), image: () => 'pnj/glamp/atelier.png',
        menu: () => [{ libelle: 'Demander un service', icone: 'marteau', scene: 'glamp', sujet: 'service' }, discuter('glamp', 'parler')],
      },
      {
        id: 'grimp', nom: 'Grimp', pose: { x: 51, pieds: 79, hauteur: 17 },
        visible: (c) => d(c.m, 'grimp.recrute'), image: () => 'pnj/grimp/neutre.png',
        menu: () => [discuter('grimp')],
      },
      {
        id: 'maiko', nom: 'Maïko', calque: true,
        visible: ENTREPOT, image: () => 'pnj/maiko/entrepot.png',
        menu: () => [discuter('maiko', 'discuter'), { libelle: 'Consulter l’entrepôt', icone: 'abri', panneau: 'coffre' }],
      },
    ],
  },

  boutique: {
    id: 'boutique', nom: 'La boutique de Jumpy', ratio: 1536 / 1024, musique: 'shop',
    decor: () => 'decors/boutique/interieur.png', decorScene: () => 'boutique/interieur',
    echo: { x: 58, pieds: 92, hauteur: 16 },
    passages: () => [{ libelle: 'Rentrer au ranch', vers: 'ranch', position: 'bas' }],
    pnj: [
      {
        id: 'jumpy', nom: 'Jumpy', pose: { x: 27, pieds: 92, hauteur: 80 },
        visible: (c) => boutiqueOuverte(c.h), image: () => 'decors/boutique/vendeur.png',
        menu: (c) => [
          { libelle: 'Voir l’étal', icone: 'cadeau', panneau: 'boutique' },
          discuter('jumpy', 'discuter'),
          { libelle: `En apprendre plus sur ${c.e.nom}`, icone: 'livre', scene: 'jumpy', sujet: 'apprendre' },
          { libelle: 'S’entraîner au combat', icone: 'feu', scene: 'jumpy', sujet: 'entrainement' },
          d(c.m, 'metier.assistant')
            ? { libelle: 'Travailler à la boutique', icone: 'marteau', scene: 'jumpy', sujet: 'travailler' }
            : { libelle: 'Gagner de l’argent', icone: 'marteau', scene: 'jumpy', sujet: 'emploi' },
        ],
      },
    ],
  },
};
