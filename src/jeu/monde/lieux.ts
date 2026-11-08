// Les lieux du village : décor, PNJ (quand ils sont là, où ils se tiennent, ce qu'on peut leur demander) et passages.
// Positions en % du décor (le décor couvre le repère 1280 × 800 sans être déformé ; ses bords peuvent être rognés).
// Les conditions d'apparition et les horaires suivent le prototype (voir la spécification du monde).
import { boutiqueOuverte, construit, type Monde } from '@/moteur/monde';
import type { Etat } from '@/moteur/simulation';
import type { Panneau } from './actions';

export type IdLieu = 'village' | 'foret' | 'sanctuaire' | 'atelier' | 'boutique' | 'potager';
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
  /**
   * Sprite posé : centre horizontal, pieds (depuis le haut) et hauteur, en % du décor. La hauteur est celle de la silhouette
   * (la boîte utile de l'image, marges transparentes ôtées) et les pieds sont le bas de cette silhouette.
   */
  pose?: { x: number; pieds: number; hauteur: number; miroir?: boolean };
  /** Promenade : le PNJ va et vient entre ces bornes (pieds), sa taille (silhouette) suit la profondeur. */
  promenade?: { xMin: number; xMax: number; piedsMin: number; piedsMax: number; hauteur: number; pas: [number, number]; periode: [number, number] };
  /** Une scène jouée directement au clic (première rencontre, quête en cours) au lieu du menu. */
  premier?: (c: ContexteLieu) => { scene: string; sujet?: string } | null;
  menu: (c: ContexteLieu) => EntreeMenu[];
}

/**
 * Un passage vers un autre lieu : il figure dans le poteau « partir » (avec, toujours, « Explorer » et « Rentrer au ranch »),
 * et, s'il a une flèche, une flèche à la craie (comme en exploration) est tracée sur le bord du décor.
 */
export interface Passage {
  libelle: string;
  vers: Destination;
  position: 'haut' | 'bas' | 'gauche' | 'droite';
  icone?: string;
  /** Flèche sur le décor : position dans le repère 1280 × 800, angle (0 = vers le haut, 90 = vers la droite), côté du nom. */
  fleche?: { x: number; y: number; angle: number; nom?: 'gauche' | 'droite' };
}

/** Le poteau « partir » : les passages du lieu, puis toujours l'exploration et le ranch (sans doublon). */
export function destinationsPoteau(passages: Passage[]): Passage[] {
  const l = [...passages];
  if (!l.some((p) => p.vers === 'exploration')) l.push({ libelle: 'Explorer', vers: 'exploration', position: 'haut' });
  if (!l.some((p) => p.vers === 'ranch')) l.push({ libelle: 'Rentrer au ranch', vers: 'ranch', position: 'bas' });
  return l;
}

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
    // le haut des marches mène à l'entrée du village (la forêt du village), les marches du bas au sanctuaire ;
    // le potager de Tourby, une fois prêt, est sur la droite (son chemin part vers la gauche, vers le village)
    passages: (c) => [
      { libelle: 'Vers l’entrée du village', vers: 'foret', position: 'haut', fleche: { x: 640, y: 262, angle: 0 } },
      { libelle: 'Vers le sanctuaire', vers: 'sanctuaire', position: 'bas', fleche: { x: 640, y: 748, angle: 180 } },
      ...(potagerPret(c) ? [{ libelle: 'Vers le potager', vers: 'potager', position: 'droite', fleche: { x: 1206, y: 560, angle: 90, nom: 'gauche' } } satisfies Passage] : []),
      { libelle: 'Vers la boutique', vers: 'boutique', position: 'droite' },
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
        promenade: { xMin: 40, xMax: 60, piedsMin: 72.7, piedsMax: 80.7, hauteur: 6.6, pas: [1, 5], periode: [1600, 2500] },
        premier: () => ({ scene: 'lady-roger', sujet: 'promenade' }),
        menu: () => [],
      },
      {
        id: 'bourbella', nom: 'Bourbella', pose: { x: 14, pieds: 79.5, hauteur: 6.9 },
        visible: (c) => d(c.m, 'bourbella.recrutee'), image: () => 'pnj/bourbella/neutre.png',
        menu: () => [discuter('bourbella', 'discuter'), { libelle: 'Améliorer la pêche', icone: 'gouttes', scene: 'bourbella', sujet: 'peche' }],
      },
      {
        id: 'finn', nom: 'Finn', pose: { x: 82, pieds: 89.4, hauteur: 4.8, miroir: true },
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
        promenade: { xMin: 56, xMax: 64, piedsMin: 43.1, piedsMax: 43.1, hauteur: 3.1, pas: [0.5, 2.5], periode: [1400, 2100] },
        menu: () => [discuter('glamp', 'parler')],
      },
      {
        id: 'grimp', nom: 'Grimp', pose: { x: 52, pieds: 44.3, hauteur: 3.5 },
        visible: (c) => d(c.m, 'grimp.recrute') && !ATELIER(c), image: () => 'pnj/grimp/neutre.png',
        menu: () => [discuter('grimp')],
      },
      {
        id: 'garry', nom: 'Garry', pose: { x: 85, pieds: 75.7, hauteur: 14.9, miroir: true },
        visible: (c) => d(c.m, 'garry.vaincu'), image: () => 'pnj/garry/face.png',
        menu: () => [discuter('garry')],
      },
    ],
  },

  potager: {
    // Le potager de Tourby (l'écran « Jardin » du prototype, décor potager-vide) : il apparaît au village quand Tourby l'a remis
    // en état, 12 heures après son arrivée (`potagerPret`) ; Tourby s'y tient, plus au centre du village.
    id: 'potager', nom: 'Le potager', ratio: 1629 / 965, musique: 'intro-sanctuary',
    decor: () => 'decors/village/potager.png', decorScene: () => 'village/potager',
    echo: { x: 50, pieds: 90, hauteur: 13 },
    // le chemin de gauche ramène au village
    passages: () => [
      { libelle: 'Vers le centre du village', vers: 'village', position: 'gauche', fleche: { x: 74, y: 600, angle: -90 } },
    ],
    pnj: [
      {
        // Tourby (0,75 m) devant la clôture, sur le chemin : les piquets du premier plan (≈ 0,9 m) font ≈ 17 % du décor.
        id: 'tourby', nom: 'Tourby', pose: { x: 30, pieds: 88, hauteur: 15 },
        visible: () => true, image: () => 'pnj/tourby/neutre.png',
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
    // le chemin du fond sort du village (la Sortie du village, en exploration) ; on revient par le bas
    passages: () => [
      { libelle: 'Partir en exploration', vers: 'exploration', position: 'haut', fleche: { x: 640, y: 352, angle: 0 } },
      { libelle: 'Vers le centre du village', vers: 'village', position: 'bas', fleche: { x: 640, y: 748, angle: 180 } },
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
    // on descend du village au sanctuaire (flèche du bas du village) : on y remonte par le bas, le chemin par où l'on est venu
    passages: () => [
      { libelle: 'Vers le centre du village', vers: 'village', position: 'bas', fleche: { x: 640, y: 748, angle: 180 } },
    ],
    pnj: [
      {
        id: 'myhra', nom: 'Myhra', pose: { x: 50, pieds: 76.2, hauteur: 40.3 },
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
        id: 'grimp', nom: 'Grimp', pose: { x: 51, pieds: 76.3, hauteur: 13 },
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
    passages: () => [{ libelle: 'Retour au village', vers: 'village', position: 'bas' }],
    pnj: [
      {
        // Jumpy (1,30 m) se tient devant le bout gauche du comptoir, descendu sur le plancher (plus près de nous, donc plus grand
        // qu'à la hauteur du comptoir : retour de l'autrice, « descends Jumpy et fais-le un peu plus grand »).
        id: 'jumpy', nom: 'Jumpy', pose: { x: 36, pieds: 76, hauteur: 29 },
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

/** Ce qu'un lieu montre d'emblée (décor et PNJ présents), pour le précharger avant de l'afficher. */
export function imagesLieu(id: IdLieu, c: ContexteLieu): string[] {
  const L = LIEUX[id];
  if (!L) return [];
  return [L.decor(c), ...L.pnj.filter((p) => p.visible(c)).map((p) => p.image(c))];
}
/** Les lieux où mènent les passages (le ranch et l'exploration sont d'autres écrans). */
export const lieuxVoisins = (id: IdLieu, c: ContexteLieu): IdLieu[] =>
  (LIEUX[id]?.passages(c) ?? []).map((p) => p.vers).filter((v): v is IdLieu => v in LIEUX);
