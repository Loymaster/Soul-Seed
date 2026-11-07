// Les PNJ qu'on peut affronter (caractéristiques et techniques du prototype), prêts pour l'écran de combat.
// Une scène lance un combat avec « action: combat <id> » ; le jeu prépare l'adversaire ici, joue le combat,
// applique son issue (applyCombatOutcome) puis rend la main à la scène avec {combat.issue}.
import type { DescriptionCombattant, OptionsBilan } from '@/moteur/combat';
import type { Caracs, Genre, Stade } from '@/moteur/simulation';
import type { AdversaireCombat, Registre } from '../combat/EcranCombat';

export interface CombatPnj {
  id: string;
  /** Les combattants d'en face (Phil et Hibert se battent à deux). */
  adversaires: AdversaireCombat[];
  registre: Registre;
  terrain: string;
  /** Musique du combat (public/assets/sons/musiques) ; par défaut celle du registre. */
  musique?: string;
  /** Blessure en cas de défaite, or d'une victoire marquante. */
  bilan?: OptionsBilan;
  /** Combat d'entraînement : pas de blessure. */
  entrainement?: boolean;
}

/** force, agilité, endurance, robustesse, intelligence, perception (ordre du prototype). */
const caracs = (f: number, a: number, en: number, r: number, i: number, p: number): Caracs =>
  ({ force: f, agilite: a, endurance: en, robustesse: r, intelligence: i, perception: p });

function pnj(nom: string, genre: Genre, stade: Stade, c: Caracs, techniques: string[]): DescriptionCombattant {
  return { nom, genre, graine: 'wrath', lignee: 'neutre', stade, evolution: null, ageJours: null, caracs: c, techniques };
}

const PLAINE = 'decors/fonds/plaine.png';
const zone = (n: string) => `decors/exploration/${n}.png`;

/** Tous les combats contre des PNJ, par identifiant (celui de « action: combat <id> »). */
export const COMBATS_PNJ: Record<string, CombatPnj> = {
  // Boutique : « S'entraîner au combat » (illimité)
  jumpy: {
    id: 'jumpy', registre: 'exploration', terrain: PLAINE,
    adversaires: [{ description: pnj('Jumpy', 'm', 'enfant', caracs(235, 305, 345, 245, 205, 315), ['Poing incandescent']), image: 'pnj/jumpy/combat.png', taille: 1.15 }],
  },
  // Village : la rencontre de Lady Roger
  'lady-roger': {
    id: 'lady-roger', registre: 'exploration', terrain: PLAINE, bilan: { risqueBlessure: 1 / 4 },
    adversaires: [{ description: pnj('Lady Roger', 'f', 'bebe', caracs(45, 60, 60, 50, 100, 100), []), image: 'pnj/lady-roger/neutre.png', taille: 0.85 }],
  },
  // Exploration, lieu 16 : le gardien du chemin (« Pong incandescent » du prototype corrigé en « Poing incandescent »)
  hevann: {
    id: 'hevann', registre: 'sainte', terrain: zone('16-chemin-foret'),
    adversaires: [{ description: pnj('Hevann', 'm', 'enfant', caracs(315, 250, 280, 290, 240, 200), ['Poing incandescent']), image: 'pnj/hevann/neutre.png', taille: 1.1 }],
  },
  // Exploration, lieu 17 : le monstre de la forêt détruite
  garry: {
    id: 'garry', registre: 'sainte', terrain: zone('17-foret-detruite'), musique: 'combat-garry',
    bilan: { risqueBlessure: 1 / 2, or: { facteur: 4, bonus: 10 } },
    adversaires: [{ description: pnj('Garry', 'm', 'adolescent', caracs(415, 295, 305, 350, 220, 200), ['Coup brutal', 'Onde de choc', 'Boule de feu']), image: 'pnj/garry/combat.png', taille: 1.15 }],
  },
  // Exploration, lieu 5 : la pêcheuse (pool « J » du stade Enfant sans lignée)
  bourbella: {
    id: 'bourbella', registre: 'exploration', terrain: zone('05-devant-cabane'),
    adversaires: [{ description: pnj('Bourbella', 'f', 'enfant', caracs(85, 100, 120, 130, 95, 90), ['Second souffle', 'Rayon sacré']), image: 'pnj/bourbella/neutre.png', taille: 1.05 }],
  },
  // Exploration, lieu 6 : les voleurs du marteau, à deux contre un
  'phil-hibert': {
    id: 'phil-hibert', registre: 'exploration', terrain: zone('06-dans-cabane'), musique: 'combat-garry',
    bilan: { risqueBlessure: 1 / 2, or: { facteur: 4, bonus: 0 } },
    adversaires: [
      { description: pnj('Phil', 'm', 'bebe', caracs(135, 145, 100, 80, 90, 120), []), image: 'pnj/phil/neutre.png', taille: 1.1 },
      { description: pnj('Hibert', 'm', 'bebe', caracs(85, 140, 135, 145, 60, 50), []), image: 'pnj/hibert/neutre.png', taille: 1 },
    ],
  },
};

export const combatPnj = (id: string): CombatPnj | undefined => COMBATS_PNJ[id];
