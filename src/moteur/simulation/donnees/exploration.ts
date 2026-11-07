// Ce que l'exploration rapporte et qui n'était pas encore au catalogue (repris du prototype) :
// les poissons crus (RAW_FISH : des aliments, jamais en boutique), les curiosités (CURIO_CATALOG)
// et les petites bêtes (CREATURE_CATALOG), objets sans usage qu'on revend.
import type { Aliment } from '../types';
import type { ObjetDivers } from '../objets';

const poisson = (id: string, nom: string, satiete: number, saveurs: string[], masse: number): Aliment => ({
  id, nom, categories: ['Poisson'], satiete, saveurs, masse, prix: 0, regimes: ['Carnivore', 'Omnivore'], horsBoutique: true,
  icone: `objets/poissons/${id.replace(/^poisson_/, '').replace(/_/g, '-')}.png`,
});

/** Poissons crus de la pêche : moins nourrissants qu'un plat cuisiné. */
export const POISSONS: Aliment[] = [
  poisson('poisson_vairon', 'Vairon', 16, ['Salé'], 0.3),
  poisson('poisson_chabot', 'Chabot', 16, ['Salé'], 0.3),
  poisson('poisson_ablette', 'Ablette', 18, ['Salé'], 0.3),
  poisson('poisson_chevesne', 'Chevesne', 20, ['Umami'], 0.5),
  poisson('poisson_vandoise', 'Vandoise', 20, ['Umami'], 0.5),
  poisson('poisson_barbeau', 'Barbeau', 22, ['Umami'], 0.6),
  poisson('poisson_lamproie', 'Lamproie', 26, ['Umami', 'Salé'], 0.7),
  poisson('poisson_ecrevisse', 'Écrevisse', 26, ['Umami'], 0.4),
  poisson('poisson_perche', 'Perche', 20, ['Umami'], 0.5),
  poisson('poisson_gardon', 'Gardon', 18, ['Salé'], 0.4),
  poisson('poisson_goujon', 'Goujon', 16, ['Salé'], 0.3),
  poisson('poisson_carpe', 'Carpe', 28, ['Umami'], 0.9),
  poisson('poisson_anguille', 'Anguille', 30, ['Umami', 'Salé'], 0.8),
  poisson('poisson_brochet', 'Brochet', 34, ['Umami'], 1.1),
  poisson('poisson_truite', 'Truite', 32, ['Umami', 'Salé'], 1.0),
  poisson('poisson_esturgeon', 'Esturgeon', 44, ['Umami'], 1.6),
  poisson('poisson_tetra_aveugle', 'Tetra aveugle', 14, ['Salé'], 0.2),
  poisson('poisson_chat_cavernicole', 'Poisson-chat cavernicole', 28, ['Umami'], 0.9),
  poisson('poisson_silure', 'Silure', 48, ['Umami'], 1.8),
  poisson('poisson_cyprinodon', 'Cyprinodon', 18, ['Salé'], 0.3),
];

const curio = (id: string, nom: string, prix: number, revente: number): ObjetDivers => ({
  id, nom, prix, revente, nature: 'curiosite',
  icone: `objets/curiosites/${id.replace(/^curio_/, '').replace(/_/g, '-')}.png`,
  description: 'Une curiosité sans usage. Elle intéressera peut-être quelqu’un au village.',
});

/** Curiosités : sans usage direct, revendables. */
export const CURIOSITES: ObjetDivers[] = [
  curio('curio_quartz', 'Morceau de quartz', 8, 2),
  curio('curio_mue_serpent', 'Mue de serpent', 5, 1),
  curio('curio_pierre_gravee', 'Pierre gravée', 12, 5),
  curio('curio_fossile', 'Fossile', 15, 2),
  curio('curio_morceau_statue', 'Morceau de statue', 14, 2),
  curio('curio_anneau_rouille', 'Anneau rouillé', 10, 2),
  curio('curio_belle_plume', 'Belle plume', 6, 1),
  curio('curio_racine_tordue', 'Racine tordue', 4, 1),
  curio('curio_pomme_pin', 'Pomme de pin', 2, 1),
  curio('curio_galet_poli', 'Galet poli', 3, 1),
  curio('curio_perle_roche', 'Perle-de-roche', 10, 4),
  curio('curio_eclat_stalactite', 'Éclat de stalactite', 6, 2),
  curio('curio_noyau_incandescent', 'Noyau incandescent', 60, 25),
];

const bete = (id: string, nom: string, prix: number): ObjetDivers => ({
  id, nom, prix, revente: prix, nature: 'bete',
  icone: `objets/creatures/${id.replace(/^creature_/, '').replace(/_/g, '-')}.png`,
  description: 'Une petite bête attrapée en chemin. On ne la mange pas telle quelle.',
});

/** Petites bêtes trouvées en fouillant ou rapportées par l'écho. */
export const PETITES_BETES: ObjetDivers[] = [
  bete('creature_faisan', 'Faisan', 6),
  bete('creature_perdrix', 'Perdrix', 5),
  bete('creature_grenouille', 'Grenouille', 2),
  bete('creature_grillon', 'Grillon', 1),
  bete('creature_lezard', 'Lézard', 2),
  bete('creature_lapin', 'Lapin', 5),
  bete('creature_ecureuil', 'Écureuil', 3),
  bete('creature_chauve_souris', 'Chauve-souris', 3),
];
