// Constantes d'équilibrage reprises du prototype (prototype-v0/index.html).
// Les noms d'origine sont indiqués en commentaire pour pouvoir comparer.
import type {
  CleCarac, CleTemperament, CleTrait, CleTraitPersonnalite, EmotionEducative, EmotionFond, Graine, Lignee, Rythme, Stade,
} from './types';

export const STADES: Stade[] = ['bebe', 'enfant', 'adolescent', 'adulte'];
export const NOM_STADE: Record<Stade, string> = { bebe: 'Bébé', enfant: 'Enfant', adolescent: 'Adolescent', adulte: 'Adulte' };

/** DEV_ENERGY_MAX : énergie maximale, et satiété maximale (même échelle). */
export const MAX_PAR_STADE: Record<Stade, number> = { bebe: 50, enfant: 60, adolescent: 80, adulte: 100 };
/** DEV_PHASE_TRAINING_MULT */
export const MULT_ENTRAINEMENT: Record<Stade, number> = { bebe: 0.5, enfant: 0.7, adolescent: 1.25, adulte: 1 };
/** INJURY_RECOVERY_MULT : la guérison spontanée d'une blessure vaut 1/20 × ce facteur par heure. */
export const MULT_GUERISON_BLESSURE: Record<Stade, number> = { bebe: 1, enfant: 1.5, adolescent: 2, adulte: 3 };
/** devConstMap : constante de guérison spontanée d'une maladie. */
export const CONSTANTE_GUERISON_MALADIE: Record<Stade, number> = { bebe: 0.2, enfant: 0.5, adolescent: 0.8, adulte: 1.2 };
/** Âge (en jours) à partir duquel chaque évolution peut survenir (entre 12 h et 18 h). */
export const AGE_EVOLUTION: Record<Exclude<Stade, 'bebe'>, number> = { enfant: 2, adolescent: 6, adulte: 12 };
/** L'écho meurt de vieillesse le 20e jour à midi. */
export const AGE_MORT = 20;

/** BIO_RHYTHM_WINDOWS : plages [début, fin[ où le rythme est respecté (repli après minuit si fin ≤ début). */
export const PLAGES_RYTHME: Record<Rythme, [number, number]> = {
  matinal: [4, 12], diurne: [10, 18], soiree: [16, 24], nocturne: [22, 6],
};

export const CLES_TEMPERAMENT: CleTemperament[] = ['cur', 'res', 'dis', 'obs', 'ant'];
export const NOM_TEMPERAMENT: Record<CleTemperament, string> = {
  cur: 'Curiosité', res: 'Résolution', dis: 'Discernement', obs: 'Observation', ant: 'Anticipation',
};
/** SEED_TEMPERAMENT_KEY */
export const TEMPERAMENT_DE_GRAINE: Record<Graine, CleTemperament> = { joy: 'cur', wrath: 'res', disgust: 'dis', sorrow: 'obs', fear: 'ant' };
/** TEMPERAMENT_TRAIT_KEY */
export const TRAIT_DE_TEMPERAMENT: Record<CleTemperament, CleTrait> = {
  cur: 'optimisme', res: 'impulsivite', dis: 'prudence', obs: 'resilience', ant: 'planification',
};
/** TEMPERAMENT_EMO_KEY */
export const EMOTION_DE_TEMPERAMENT: Record<CleTemperament, EmotionEducative> = {
  cur: 'joy', res: 'wrath', dis: 'disgust', obs: 'sorrow', ant: 'fear',
};
/** Trait qui progresse quand une émotion de fond domine la journée (somme > 1200). */
export const TRAIT_D_EMOTION: Record<EmotionFond, CleTrait> = {
  joie: 'optimisme', colere: 'impulsivite', degout: 'prudence', tristesse: 'resilience', peur: 'planification',
};
/** Trait qui progresse quand une émotion éducative domine la journée. */
export const TRAIT_D_EMOTION_EDUCATIVE: Record<EmotionEducative, CleTrait> = {
  joy: 'optimisme', wrath: 'impulsivite', disgust: 'prudence', sorrow: 'resilience', fear: 'planification',
};

export const CLES_TRAITS: CleTrait[] = ['optimisme', 'impulsivite', 'planification', 'resilience', 'prudence'];
export const CLES_PERSONNALITE: CleTraitPersonnalite[] = ['ouverture', 'conscienciosite', 'extraversion', 'agreabilite', 'nevrosisme'];
export const CLES_CARACS: CleCarac[] = ['force', 'agilite', 'endurance', 'robustesse', 'intelligence', 'perception'];
export const NOM_CARAC: Record<CleCarac, string> = {
  force: 'Force', agilite: 'Agilité', endurance: 'Endurance', robustesse: 'Robustesse', intelligence: 'Intelligence', perception: 'Perception',
};
/** CARAC_LINE_BONUS */
export const BONUS_CARAC_LIGNEE: Record<Graine, Partial<Record<'primaire' | 'sombre', Partial<Record<CleCarac, number>>>>> = {
  joy: { primaire: { endurance: 10 }, sombre: { endurance: 5, agilite: 5 } },
  sorrow: { primaire: { intelligence: 10 }, sombre: { intelligence: 5, perception: 5 } },
  fear: { primaire: { perception: 10 }, sombre: { perception: 5, robustesse: 5 } },
  wrath: { primaire: { force: 10 }, sombre: { force: 5, robustesse: 5 } },
  disgust: { primaire: { robustesse: 10 }, sombre: { robustesse: 5, agilite: 5 } },
};
/** Probabilités de lignée à l'éclosion (DARK_CHANCE, NEUTRAL_CHANCE, DARK_NEUTRAL_CHANCE). */
export const CHANCES_LIGNEE: Record<Lignee, number> = { sombre: 0.25, neutre: 0.1, 'neutre-sombre': 0.05, primaire: 0.6 };

export const EMOTIONS_EDUCATIVES: EmotionEducative[] = ['joy', 'fear', 'sorrow', 'wrath', 'disgust'];

export const SAVEURS = ['Sucré', 'Salé', 'Amer', 'Acide', 'Umami', 'Épicé'] as const;
export const REGIMES = ['Carnivore', 'Végétarien', 'Omnivore'] as const;
export const CATEGORIES_ALIMENTS = [
  'Fruits classiques', 'Fruits exotiques', 'Légumes', 'Légumineuses', 'Céréales', 'Plats raffinés', 'Fast-Food', 'Sucreries',
  'Nodule', 'Poisson', 'Viande', 'Simili-carne', 'Produits animaliers', 'Champignon', 'Déchets', 'Épices',
];
export const INTERACTIONS_PREFEREES = ['affection', 'discussion', 'jeu', 'partage'] as const;

/** Nombre de caresses acceptées par jour (règle du nouveau ranch). */
export const CARESSES_PAR_JOUR = 10;
/** Taille du sac. */
export const TAILLE_SAC = 10;
export const MAX_ECHOS_SAUVAGES = 10;
export const DUREE_VISITE_HEURES = 6;
/** Saleté du ranch au-delà de laquelle l'écho va « chez le voisin ». */
export const SALETE_MAX = 20;

/** MELEE_TRIADS : formes adultes mêlées. */
export const TRIADES_MELEES: { code: string; emotions: EmotionEducative[] }[] = [
  { code: 'JWF', emotions: ['joy', 'wrath', 'fear'] },
  { code: 'WFS', emotions: ['wrath', 'fear', 'sorrow'] },
  { code: 'FSD', emotions: ['fear', 'sorrow', 'disgust'] },
  { code: 'SDJ', emotions: ['sorrow', 'disgust', 'joy'] },
  { code: 'DJW', emotions: ['disgust', 'joy', 'wrath'] },
  { code: 'JFD', emotions: ['joy', 'fear', 'disgust'] },
  { code: 'JFS', emotions: ['joy', 'fear', 'sorrow'] },
  { code: 'JWS', emotions: ['joy', 'wrath', 'sorrow'] },
  { code: 'WFD', emotions: ['wrath', 'fear', 'disgust'] },
  { code: 'WSD', emotions: ['wrath', 'sorrow', 'disgust'] },
];

export const NOMS_SAUVAGES_M = ['Filo', 'Brindo', 'Kesh', 'Namoro', 'Talvi', 'Orin', 'Sculo', 'Ranvik', 'Isendo', 'Volren', 'Maldo', 'Threnn', 'Zaphir', 'Corvin', 'Wenlo', 'Dravo', 'Bram', 'Halvor', 'Jorik', 'Sennik', 'Tavro', 'Ombric', 'Wyrn', 'Kaldur', 'Fenro', 'Silvo', 'Dorrin', 'Askel', 'Grynn', 'Ulvar', 'Perrin', 'Mordan', 'Ravik', 'Skerin', 'Tolven', 'Yorric', 'Aldren', 'Bosvin', 'Cendric', 'Draygo', 'Elorin', 'Fenwick', 'Garrow', 'Holwin', 'Ivarn', 'Jothen', 'Kestrel', 'Lorvan', 'Marrow', 'Norvik', 'Oskar', 'Pyrren', 'Quenlo', 'Renwick', 'Stravo', 'Torrin', 'Uskan', 'Vendrin', 'Wrenlo', 'Xarion', 'Yulric', 'Zenwar'];
export const NOMS_SAUVAGES_F = ['Fila', 'Brinda', 'Kesha', 'Namora', 'Talvia', 'Orina', 'Sculla', 'Ranvika', 'Isenda', 'Volrena', 'Malda', 'Threnna', 'Zaphira', 'Corvina', 'Wenla', 'Dravina', 'Brama', 'Halvora', 'Jorika', 'Sennika', 'Tavra', 'Ombrica', 'Wyrna', 'Kaldura', 'Fenra', 'Silva', 'Dorrina', 'Askela', 'Grynna', 'Ulvara', 'Perrina', 'Mordana', 'Ravika', 'Skerina', 'Tolvena', 'Yorrica', 'Aldrena', 'Bosvina', 'Cendrica', 'Draygona', 'Elorina', 'Fenwicka', 'Garrowa', 'Holwina', 'Ivarna', 'Jothena', 'Kestrela', 'Lorvana', 'Marrowa', 'Norvika', 'Oskara', 'Pyrrena', 'Quenla', 'Renwicka', 'Stravona', 'Torrina', 'Uskana', 'Vendrina', 'Wrenla', 'Xariona', 'Yulrica', 'Zenwara'];
