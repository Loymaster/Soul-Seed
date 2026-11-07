// Création d'un écho : tirages cachés repris du prototype (confirm(), startLife(), rollX()).
import type {
  Aleatoire, Caracs, EchoSauvage, Education, Etat, Genre, Gouts, Graine, Lignee, Personnalite, Rythme, Temperament,
} from './types';
import { ALIMENTS } from './donnees/aliments';
import {
  BONUS_CARAC_LIGNEE, CATEGORIES_ALIMENTS, CHANCES_LIGNEE, CLES_CARACS, CLES_PERSONNALITE, CLES_TEMPERAMENT,
  INTERACTIONS_PREFEREES, NOMS_SAUVAGES_F, NOMS_SAUVAGES_M, REGIMES, SAVEURS, TAILLE_SAC, TEMPERAMENT_DE_GRAINE,
} from './constantes';
import { centieme, dixieme, piocher } from './outils';
import { regimeCompatible } from './alimentation';

export const educationVide = (): Education => ({ cognitif: 0, socio: 0, moteur: 0, joy: 0, fear: 0, sorrow: 0, wrath: 0, disgust: 0 });

/** Tirage caché de la lignée : 60 % primaire, 25 % sombre, 10 % neutre, 5 % neutre sombre. */
export function tirerLignee(rng: Aleatoire): Lignee {
  const r = rng();
  if (r < CHANCES_LIGNEE.neutre) return 'neutre';
  if (r < CHANCES_LIGNEE.neutre + CHANCES_LIGNEE['neutre-sombre']) return 'neutre-sombre';
  if (r < CHANCES_LIGNEE.neutre + CHANCES_LIGNEE['neutre-sombre'] + CHANCES_LIGNEE.sombre) return 'sombre';
  return 'primaire';
}

/** rollTemperament */
export function tirerTemperament(graine: Graine, lignee: Lignee, rng: Aleatoire): Temperament {
  const t: Temperament = { cur: 0, res: 0, dis: 0, obs: 0, ant: 0 };
  const cle = TEMPERAMENT_DE_GRAINE[graine];
  if (lignee === 'primaire') t[cle] = 3;
  else if (lignee === 'sombre') {
    t[cle] = 2;
    t[piocher(CLES_TEMPERAMENT.filter(k => k !== cle), rng)] += 1;
  } else {
    // Neutre et neutre sombre : 3 points répartis au hasard, 1 au plus par tempérament.
    const reserve = CLES_TEMPERAMENT.slice();
    for (let i = 0; i < 3; i++) t[reserve.splice(Math.floor(rng() * reserve.length), 1)[0]] += 1;
  }
  return t;
}

/** rollPersonality : 12 à 16 points ; chaque trait part de 1 (le névrotisme part de 5 et descend). */
export function tirerPersonnalite(rng: Aleatoire, nevrosismeMin = 1): Personnalite {
  const p = { ouverture: 1, conscienciosite: 1, extraversion: 1, agreabilite: 1, nevrosisme: 5 } as Personnalite;
  let reste = 12 + Math.floor(rng() * 5) - CLES_PERSONNALITE.length;
  while (reste > 0) {
    const eligibles = CLES_PERSONNALITE.filter(k => (k === 'nevrosisme' ? p[k] > nevrosismeMin : p[k] < 5));
    if (!eligibles.length) break;
    const k = piocher(eligibles, rng);
    p[k] += k === 'nevrosisme' ? -1 : 1;
    reste--;
  }
  return p;
}

/** rollCaracteristiques */
export function tirerCaracs(graine: Graine, lignee: Lignee, rng: Aleatoire): Caracs {
  const c = {} as Caracs;
  for (const k of CLES_CARACS) c[k] = 10 + Math.floor(rng() * 41);
  for (let i = 0; i < 100; i++) c[piocher(CLES_CARACS, rng)] += 1;
  if (lignee === 'neutre' || lignee === 'neutre-sombre') for (const k of CLES_CARACS) c[k] += 3;
  else {
    const bonus = BONUS_CARAC_LIGNEE[graine][lignee] ?? {};
    for (const [k, v] of Object.entries(bonus)) c[k as keyof Caracs] += v;
  }
  for (const k of CLES_CARACS) c[k] = Math.min(999, c[k]);
  return c;
}

/** rollPreferences */
export function tirerGouts(rng: Aleatoire): Gouts {
  const regime = piocher(REGIMES, rng);
  const compatibles = ALIMENTS.filter(a => regimeCompatible(regime, a));
  const prefere = piocher(compatibles, rng);
  let deteste = piocher(ALIMENTS, rng);
  while (deteste.id === prefere.id) deteste = piocher(ALIMENTS, rng);
  return {
    saveur: piocher(SAVEURS, rng),
    interaction: piocher(INTERACTIONS_PREFEREES, rng),
    regime,
    categorie: piocher(CATEGORIES_ALIMENTS, rng),
    platPrefere: prefere.id,
    platDeteste: deteste.id,
  };
}

export interface OptionsCreation {
  nom: string;
  genre: Genre;
  graine: Graine;
  /** Tirée au hasard si absente (tirage caché du prototype). */
  lignee?: Lignee;
  rythme?: Rythme;
  /** Jour et heure de départ (jour 1, 10 h par défaut, comme le prototype). */
  jour?: number;
  heure?: number;
}

export function creerEcho(o: OptionsCreation, rng: Aleatoire = Math.random): Etat {
  const lignee = o.lignee ?? tirerLignee(rng);
  const temperament = tirerTemperament(o.graine, lignee, rng);
  const jour = o.jour ?? 1;
  const inventaire: Etat['inventaire'] = Array(TAILLE_SAC).fill(null);
  // Sac de départ : celui du prototype (médicament, pansement, graine de vie, 2 nodules) et quelques aliments
  // en attendant la boutique du nouveau jeu.
  [
    { id: 'nodule_nutritif', qte: 2 }, { id: 'pomme', qte: 3 }, { id: 'carotte', qte: 2 }, { id: 'pain', qte: 2 },
    { id: 'baies_rouges', qte: 2 }, { id: 'medicament', qte: 1 }, { id: 'bandage', qte: 1 }, { id: 'graine_vie', qte: 1 },
  ].forEach((c, i) => { inventaire[i] = c; });
  const e: Etat = {
    version: 1,
    nom: o.nom, genre: o.genre, graine: o.graine, lignee, stade: 'bebe', evolution: null, naissance: jour,
    jour, minute: (o.heure ?? 10) * 60,
    satiete: 40, affame: false, sante: 10, energie: 30, proprete: 60,
    poids: centieme(4 + rng() * 4), taille: centieme(0.8 + rng() * 0.4),
    digestion: false, besoin: 0, blesse: false, malade: false, heuresMaladie: 0, risqueMaladie: 0, immuniteJusqua: 0,
    rythme: o.rythme ?? piocher(['matinal', 'diurne', 'soiree', 'nocturne'] as const, rng),
    humeur: 50, anxiete: 20,
    emotions: { joie: 50, colere: 20, tristesse: 20, degout: 20, peur: 20, surprise: 0 },
    sommeJourEmotions: { joie: 0, colere: 0, tristesse: 0, degout: 0, peur: 0 },
    // traitsFromTemperament
    traits: {
      optimisme: 30 + temperament.cur * 10, resilience: 30 + temperament.obs * 10, planification: 30 + temperament.ant * 10,
      prudence: 30 + temperament.dis * 10, impulsivite: 30 + temperament.res * 10,
    },
    temperament,
    personnalite: tirerPersonnalite(rng, lignee === 'neutre-sombre' ? 4 : 1),
    caracs: tirerCaracs(o.graine, lignee, rng),
    affection: 10, attachement: 10, manqueAffection: 0, besoinAffection: false,
    autonomie: 0, discipline: 0, authenticite: 25, altruisme: 10, egoisme: 35, sentimentJustice: 50, tendanceBetises: 50, volonteMieux: 50,
    gouts: tirerGouts(rng),
    frustrationAlimentaire: 90, refusNourriture: false, forcerNourriture: false, expressionPersonnelleJusqua: 0,
    educationStade: educationVide(), educationTotale: educationVide(), educationJour: { joy: 0, fear: 0, sorrow: 0, wrath: 0, disgust: 0 },
    reussite: false, betise: false, reactionCorvee: null, experienceCorvees: {}, derniereCorvee: {},
    interactionsDuJour: {}, caresses: { jour, nombre: 0 }, dernierGronder: null, dernierFeliciter: null,
    saleteRanch: 0, dejections: [], probaEvenement: 0, visiteur: null, echosSauvages: [], garryVaincu: false,
    chanceComportement: 0, comportement: null,
    // Heures d'évolution fixées une fois pour toutes entre 12 h et 17 h (startLife).
    heureEvolution: { enfant: 12 + Math.floor(rng() * 6), adolescent: 12 + Math.floor(rng() * 6), adulte: 12 + Math.floor(rng() * 6) },
    inventaire, or: 20, journal: [], mort: null, prochainId: 1,
  };
  return e;
}

/** generateWildEcho (sans les formes rares d'exploration). */
export function creerEchoSauvage(rng: Aleatoire, ageMin = 1, ageMax = 3, graines?: readonly Graine[]): EchoSauvage {
  // graines possibles (les échos d'un lieu d'exploration) ; par défaut, toutes
  const graine = piocher(graines?.length ? graines : (['joy', 'wrath', 'disgust', 'sorrow', 'fear'] as const), rng);
  const lignee = tirerLignee(rng);
  const ageJours = ageMin + Math.floor(rng() * (ageMax - ageMin + 1));
  const mult = centieme(0.8 + rng() * 0.4) * (1 + ageJours / 8);
  const base = tirerCaracs(graine, lignee, rng);
  const caracs = {} as Caracs;
  for (const k of CLES_CARACS) caracs[k] = dixieme(base[k] * mult);
  const genre: Genre = rng() < 0.5 ? 'm' : 'f';
  return {
    id: 'echo-' + Math.floor(rng() * 1e9).toString(36),
    nom: piocher(genre === 'f' ? NOMS_SAUVAGES_F : NOMS_SAUVAGES_M, rng),
    genre, graine, lignee,
    stade: ageJours <= 2 ? 'bebe' : ageJours <= 6 ? 'enfant' : 'adolescent',
    ageJours, temperament: tirerTemperament(graine, lignee, rng), personnalite: tirerPersonnalite(rng), caracs,
    affectPositif: 0, affectNegatif: 0,
  };
}
