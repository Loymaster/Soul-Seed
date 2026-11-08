// Modèle de la simulation de l'écho.
// Tout ce qui est ici est « caché » : le joueur ne voit jamais ces nombres. Il ne perçoit que les signes
// qu'on en dérive (expression, bulle, comportement, phrase d'humeur) — voir signes.ts.

export type Stade = 'bebe' | 'enfant' | 'adolescent' | 'adulte';
export type Graine = 'joy' | 'wrath' | 'disgust' | 'sorrow' | 'fear';
/** Lignée tirée à l'éclosion (cachée au joueur). */
export type Lignee = 'primaire' | 'sombre' | 'neutre' | 'neutre-sombre';
export type Genre = 'm' | 'f';

/** Émotions instantanées, 0–100. */
export type Emotion = 'joie' | 'colere' | 'tristesse' | 'degout' | 'peur' | 'surprise';
export type Emotions = Record<Emotion, number>;
/** Les cinq émotions « de fond » (sans la surprise). */
export type EmotionFond = Exclude<Emotion, 'surprise'>;

/** Tempérament de naissance (0–3 points), lié à la graine. */
export type CleTemperament = 'cur' | 'res' | 'dis' | 'obs' | 'ant';
export type Temperament = Record<CleTemperament, number>;
/** Traits évolutifs, 0–100 (50 au départ). */
export type CleTrait = 'optimisme' | 'impulsivite' | 'planification' | 'resilience' | 'prudence';
export type Traits = Record<CleTrait, number>;
/** Personnalité « Big Five », 1–5. */
export type CleTraitPersonnalite = 'ouverture' | 'conscienciosite' | 'extraversion' | 'agreabilite' | 'nevrosisme';
export type Personnalite = Record<CleTraitPersonnalite, number>;
export type CleCarac = 'force' | 'agilite' | 'endurance' | 'robustesse' | 'intelligence' | 'perception';
export type Caracs = Record<CleCarac, number>;

/** Processus éducatifs (ce qui décide des évolutions). */
export type Processus = 'cognitif' | 'socio' | 'moteur';
export type EmotionEducative = 'joy' | 'fear' | 'sorrow' | 'wrath' | 'disgust';
export type Education = Record<Processus | EmotionEducative, number>;

export type Rythme = 'matinal' | 'diurne' | 'soiree' | 'nocturne';
export type Regime = 'Carnivore' | 'Végétarien' | 'Omnivore';
export type Saveur = 'Sucré' | 'Salé' | 'Amer' | 'Acide' | 'Umami' | 'Épicé';
export type CategorieInteraction = 'affection' | 'discussion' | 'jeu' | 'partage' | 'education' | 'cadeau';

export interface Gouts {
  regime: Regime;
  saveur: Saveur;
  categorie: string;
  platPrefere: string;
  platDeteste: string;
  interaction: Exclude<CategorieInteraction, 'education' | 'cadeau'>;
}

export interface Aliment {
  id: string;
  nom: string;
  categories: string[];
  /** Satiété apportée (« hungerGain » du prototype). */
  satiete: number;
  saveurs: string[];
  masse: number;
  prix: number;
  regimes: string[];
  horsBoutique?: boolean;
  icone: string;
}

export interface Entrainement {
  id: string;
  nom: string;
  carac: CleCarac;
  processus: Processus;
  emotion: EmotionEducative | null;
  temperament: CleTemperament | null;
  icone: string;
}

export interface Corvee {
  id: string;
  nom: string;
  carac: CleCarac;
  trait: CleTrait;
  sansSecondaire?: boolean;
  icone: string;
}

export interface OptionInteraction {
  id: string;
  libelle?: string;
  libelleJour?: string;
  libelleNuit?: string;
  libellePetit?: string;
  libelleGrand?: string;
  humeur?: number;
  emotions?: Partial<Emotions>;
  attachement?: number;
  affection?: number;
  anxiete?: number;
  energie?: number;
  discipline?: number;
  autonomie?: number;
  authenticite?: number;
  sentimentJustice?: number;
  altruisme?: number;
  education?: { processus: Processus | null; emotion: EmotionEducative | null };
  resultat: string;
  journal: string;
}

export interface CaseInventaire {
  id: string;
  qte: number;
}

export interface Dejection {
  id: number;
  /** Position sur le sol, normalisée 0–1 (x : gauche → droite ; y : fond → premier plan). */
  x: number;
  y: number;
  nature: 'crotte' | 'vomi';
  /** Stade de l'écho quand il l'a laissée : sa taille en dépend (src/jeu/ranch/dejections.ts). */
  stade?: Stade;
}

export interface EchoSauvage {
  id: string;
  nom: string;
  genre: Genre;
  graine: Graine;
  lignee: Lignee;
  stade: Stade;
  ageJours: number;
  temperament: Temperament;
  personnalite: Personnalite;
  caracs: Caracs;
  affectPositif: number;
  affectNegatif: number;
  /** « Signe d'inspiration » après un moment passé ensemble : rapproche les personnalités (compatibilité). */
  compatBonus?: number;
  /** Stade auquel on l'a vu la dernière fois au ranch (pour remarquer qu'il a grandi). */
  stadeVu?: Stade;
}

/** Après un refus de nourriture. */
export type ReponseRefus = 'insister' | 'respecter';
/** À la fin d'une corvée. */
export type ReponseCorvee = 'feliciter' | 'encourager' | 'rien';
export type TypeComportement = 'reussite' | 'betise' | 'amplification' | 'neutre';
export type ReponseComportement =
  | 'feliciter' | 'gronder' | 'rien'
  | 'encourager' | 'prevenir'
  | 'remercier' | 'critiquer';

export interface Comportement {
  coloration: CleTemperament;
  type: TypeComportement;
  /** Objet trouvé (comportements « neutres »). */
  objet: string | null;
  /** Heure totale de début (le comportement s'efface au bout de 4 h s'il n'est pas remarqué). */
  debut: number;
}

export type ResultatEvolution =
  | { genre: 'normal' }
  | { genre: 'fragment'; code: 'C+' | 'SA+' | 'PM+' }
  | { genre: 'branche'; code: string }
  | { genre: 'branche-adulte'; code: string }
  | { genre: 'melee'; code: string };

export type CauseMort = 'faim' | 'blessure' | 'combat' | 'maladie' | 'vieillesse';

export interface EntreeJournal {
  jour: number;
  minute: number;
  texte: string;
}

/** État complet d'une partie au ranch. Sérialisable tel quel (sauvegarde JSON). */
export interface Etat {
  version: 1;
  nom: string;
  genre: Genre;
  graine: Graine;
  lignee: Lignee;
  stade: Stade;
  /** Résultat de l'évolution Adolescent (puis Adulte). */
  evolution: ResultatEvolution | null;
  /** Jour de naissance (le jour 1 est le premier jour de la partie). */
  naissance: number;

  // Horloge : jour courant et minute du jour (0–1439).
  jour: number;
  minute: number;

  // Corps
  satiete: number;
  affame: boolean;
  sante: number;
  energie: number;
  proprete: number;
  /** Poids en kg (4–8 à la naissance, il grossit en mangeant et maigrit en s'entraînant). */
  poids: number;
  /** Facteur de taille propre à l'individu (0,8–1,2), multiplié par la taille du stade. */
  taille: number;
  digestion: boolean;
  besoin: number;
  blesse: boolean;
  malade: boolean;
  heuresMaladie: number;
  risqueMaladie: number;
  immuniteJusqua: number;
  rythme: Rythme;

  // Psychisme
  humeur: number;
  anxiete: number;
  emotions: Emotions;
  sommeJourEmotions: Record<EmotionFond, number>;
  traits: Traits;
  temperament: Temperament;
  personnalite: Personnalite;
  caracs: Caracs;

  // Lien
  affection: number;
  attachement: number;
  manqueAffection: number;
  besoinAffection: boolean;

  // Valeurs (éducation morale)
  autonomie: number;
  discipline: number;
  authenticite: number;
  altruisme: number;
  egoisme: number;
  sentimentJustice: number;
  tendanceBetises: number;
  volonteMieux: number;

  // Alimentation
  gouts: Gouts;
  frustrationAlimentaire: number;
  refusNourriture: boolean;
  forcerNourriture: boolean;
  /** Heure totale jusqu'à laquelle l'écho vient d'exprimer un choix personnel. */
  expressionPersonnelleJusqua: number;

  // Éducation
  educationStade: Education;
  educationTotale: Education;
  educationJour: Record<EmotionEducative, number>;
  /** Issue de la dernière corvée (sert aux félicitations / reproches qui suivent). */
  reussite: boolean;
  betise: boolean;
  reactionCorvee: { corvee: string; succes: boolean } | null;
  experienceCorvees: Record<string, number>;
  derniereCorvee: Record<string, number>;

  // Limites quotidiennes / horaires
  interactionsDuJour: Partial<Record<CategorieInteraction, number>>;
  caresses: { jour: number; nombre: number };

  // Ranch
  saleteRanch: number;
  dejections: Dejection[];
  probaEvenement: number;
  visiteur: { id: string; departA: number } | null;
  echosSauvages: EchoSauvage[];
  garryVaincu: boolean;

  // Comportements spontanés
  chanceComportement: number;
  comportement: Comportement | null;

  // Évolutions
  heureEvolution: { enfant: number; adolescent: number; adulte: number };

  inventaire: (CaseInventaire | null)[];
  or: number;
  /** Combat : PV restants depuis le dernier combat (null ou absent : pleine forme, rendue par le sommeil). */
  pvCombat?: number | null;
  /** Hevann a motivé l'écho : ses entraînements rendent davantage jusqu'à cette heure totale. */
  motivationJusqua?: number;
  /** Techniques de combat : apprises, équipées (trois au plus), seuils d'intelligence déjà franchis. */
  techniques?: { connues: string[]; equipees: string[]; seuils: number[] };
  journal: EntreeJournal[];
  mort: CauseMort | null;
  /** Compteur pour les identifiants (déjections…). */
  prochainId: number;
}

/** Ce que la simulation signale à l'affichage. Jamais de valeur chiffrée. */
export type Sortie =
  | { type: 'journal'; texte: string }
  | { type: 'message'; texte: string; ton: 'bien' | 'mal' | 'note' }
  | { type: 'refus'; texte: string }
  | { type: 'dejection'; dejection: Dejection }
  | { type: 'voisin'; texte: string }
  | { type: 'evenement'; nature: 'bruit' | 'invite' | 'visite'; texte: string }
  | { type: 'visiteur-parti'; texte: string; id: string }
  /** Notre écho et son visiteur font quelque chose ensemble (d'eux-mêmes, ou à la demande du joueur). */
  | { type: 'visite'; nature: 'jeu' | 'dispute' | 'partage' | 'repos' | 'temps' | 'bagarre'; reussi: boolean; sens: 1 | 0 | -1; texte: string; spontane: boolean }
  /** La relation avec un écho sauvage a franchi un palier (amitié, méfiance…). */
  | { type: 'relation'; id: string; niveau: string; sens: 1 | -1; texte: string }
  | { type: 'comportement' }
  | { type: 'autonomie'; texte: string }
  | { type: 'effondrement' }
  | { type: 'sommeil'; heures: number; effondrement: boolean }
  | { type: 'evolution'; de: Stade; vers: Stade }
  | { type: 'maladie' }
  | { type: 'guerison' }
  | { type: 'blessure' }
  | { type: 'technique'; nom: string }
  | { type: 'nouveau-jour'; jour: number }
  | { type: 'mort'; cause: CauseMort };

/** Générateur aléatoire injectable (Math.random par défaut, graine fixe dans les tests). */
export type Aleatoire = () => number;
