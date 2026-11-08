// Visites d'échos sauvages au ranch, sans affichage : la relation entre notre écho et chaque visiteur,
// ce qu'ils font ensemble d'eux-mêmes pendant la visite, et les mots qui la disent (jamais de chiffre).
//
// Prototype : les échos rencontrés (echosSauvages) gardent un affect positif et un affect négatif (0–100),
// modifiés par « Passer du temps », « Jouer » et « Se bagarrer » ; la liste repart de zéro avec l'écho suivant.
// Ajouts : les deux échos interagissent aussi d'eux-mêmes pendant la visite (jeu, dispute, partage, repos),
// et chaque palier de relation franchi s'inscrit au journal.
import type { Aleatoire, EchoSauvage, Emotions, Etat, Personnalite } from './types';
import { borne, piocher } from './outils';

/** Palier de relation, du plus froid au plus chaleureux. */
export type NiveauRelation = 'hostilite' | 'mefiance' | 'inconnu' | 'neutre' | 'camaraderie' | 'amitie' | 'complicite';
const RANG: Record<NiveauRelation, number> = { hostilite: -2, mefiance: -1, inconnu: 0, neutre: 0, camaraderie: 1, amitie: 2, complicite: 3 };

/** Ce que l'on lit de la relation (carnet, relations) : un mot, jamais un chiffre. */
export const LIEN_RELATION: Record<NiveauRelation, string> = {
  hostilite: 'une vraie rivalité',
  mefiance: 'de la méfiance',
  inconnu: 'une simple rencontre',
  neutre: 'on s’observe encore',
  camaraderie: 'de la camaraderie',
  amitie: 'une belle amitié',
  complicite: 'inséparables',
};
/** Encre du mot dans le carnet. */
export const ENCRE_RELATION: Record<NiveauRelation, string> = {
  hostilite: '#9c3b2a', mefiance: '#a0602a', inconnu: '#9a8668', neutre: '#7a6650', camaraderie: '#566b3a', amitie: '#3f7a3a', complicite: '#2f6a5a',
};

export function niveauRelation(s: Pick<EchoSauvage, 'affectPositif' | 'affectNegatif'>): NiveauRelation {
  const p = s.affectPositif, n = s.affectNegatif, net = p - n;
  if (p === 0 && n === 0) return 'inconnu';
  if (n >= 35 && net <= -20) return 'hostilite';
  if (net < -5) return 'mefiance';
  if (p >= 55 && net >= 40) return 'complicite';
  if (p >= 25 && net >= 15) return 'amitie';
  if (net > 3) return 'camaraderie';
  return 'neutre';
}
export const rangRelation = (n: NiveauRelation) => RANG[n];

/** echoCompatibilite : écart moyen de personnalité (0 = identiques), diminué du bonus d'inspiration. */
export function compatibilite(a: Personnalite, s: Pick<EchoSauvage, 'personnalite' | 'compatBonus'>): number {
  const cles = Object.keys(a) as (keyof Personnalite)[];
  const brut = Math.round((cles.reduce((t, k) => t + Math.abs((s.personnalite[k] ?? 0) - (a[k] ?? 0)), 0) / cles.length) * 100) / 100;
  return Math.max(0, Math.round((brut - (s.compatBonus ?? 0)) * 100) / 100);
}

const accordPluriel = (e: Pick<Etat, 'genre'>, s: Pick<EchoSauvage, 'genre'>, m: string, f: string) => (e.genre === 'f' && s.genre === 'f' ? f : m);

/**
 * Change l'affect de notre écho envers le visiteur ; renvoie le texte du palier franchi (pour le journal), s'il y en a un.
 */
export function changerAffect(e: Pick<Etat, 'nom' | 'genre'>, s: EchoSauvage, plus: number, moins: number): { texte: string; niveau: NiveauRelation; sens: 1 | -1 } | null {
  const avant = niveauRelation(s);
  s.affectPositif = borne(s.affectPositif + plus);
  s.affectNegatif = borne(s.affectNegatif + moins);
  const apres = niveauRelation(s);
  if (avant === apres || (avant === 'inconnu' && apres === 'neutre')) return null;
  const sens = RANG[apres] > RANG[avant] || (RANG[apres] === RANG[avant] && apres !== 'neutre') ? 1 : -1;
  return { texte: texteNouveauPalier(e, s, apres, sens), niveau: apres, sens };
}

function texteNouveauPalier(e: Pick<Etat, 'nom' | 'genre'>, s: EchoSauvage, n: NiveauRelation, sens: 1 | -1): string {
  const A = e.nom, B = s.nom;
  switch (n) {
    case 'complicite': return `${A} et ${B} sont désormais inséparables.`;
    case 'amitie': return sens > 0 ? `${A} et ${B} sont devenu${accordPluriel(e, s, 's', 'es')} ${accordPluriel(e, s, 'amis', 'amies')}.` : `${A} et ${B} restent ${accordPluriel(e, s, 'amis', 'amies')}, mais quelque chose s’est un peu refroidi.`;
    case 'camaraderie': return sens > 0 ? `${A} et ${B} commencent à s’apprivoiser.` : `L’amitié entre ${A} et ${B} s’est un peu ternie.`;
    case 'neutre': return `Le lien entre ${A} et ${B} s’est distendu.`;
    case 'mefiance': return sens < 0 ? `${A} se méfie désormais de ${B}.` : `${A} et ${B} se regardent avec un peu moins d’hostilité.`;
    case 'hostilite': return `Entre ${A} et ${B}, le torchon brûle.`;
    default: return '';
  }
}

// —————————————————————————————— ce qu'ils font d'eux-mêmes pendant la visite

export type NatureInteractionVisite = 'jeu' | 'dispute' | 'partage' | 'repos';

export interface InteractionVisite {
  nature: NatureInteractionVisite;
  /** l'autre a répondu (jeu accepté…) ; une dispute « réussie » est une dispute qui éclate */
  reussi: boolean;
  /** effet sur l'humeur de notre écho : +1 agréable, −1 désagréable, 0 neutre */
  sens: 1 | 0 | -1;
  plus: number;
  moins: number;
  emotions: Partial<Emotions>;
  education: { processus: 'socio' | null; emotion: 'joy' | 'wrath' | 'sorrow' | 'fear' | null } | null;
  texte: string;
}

/** Probabilité de base, à chaque heure de visite (éveillé), que les deux échos fassent quelque chose ensemble. */
export const CHANCE_INTERACTION_VISITE = 0.4;
/**
 * Selon la relation : des amis (et plus encore des inséparables) vont d'eux-mêmes l'un vers l'autre bien plus souvent ;
 * des rivaux se cherchent aussi un peu plus (disputes) ; des inconnus s'observent.
 */
export const CHANCE_INTERACTION_RELATION: Record<NiveauRelation, number> = {
  hostilite: 0.45, mefiance: 0.35, inconnu: 0.3, neutre: 0.35, camaraderie: 0.5, amitie: 0.65, complicite: 0.8,
};
export const chanceInteractionVisite = (s: Pick<EchoSauvage, 'affectPositif' | 'affectNegatif'>): number => CHANCE_INTERACTION_RELATION[niveauRelation(s)];

/** Probabilité qu'une proposition de jeu soit acceptée (computeInteractionSuccess). */
export function probaEntente(e: Pick<Etat, 'personnalite'>, s: EchoSauvage, compat: number): number {
  const x = compat + 1 + (5 - s.personnalite.extraversion) + (5 - s.personnalite.agreabilite) - (1 - s.affectPositif / 100 + s.affectNegatif / 100);
  return borne((14 - x) / 14 + (e.personnalite.agreabilite - 1) / 100, 0, 1);
}

/**
 * Tire ce que notre écho et son visiteur font d'eux-mêmes (sans rien appliquer : la simulation s'en charge).
 * Les natures sont pondérées par la personnalité des deux échos, leur compatibilité, la relation et l'heure.
 */
export function tirerInteractionVisite(e: Pick<Etat, 'nom' | 'genre' | 'personnalite' | 'emotions' | 'minute'>, s: EchoSauvage, rng: Aleatoire): InteractionVisite {
  const compat = compatibilite(e.personnalite, s);
  const p = e.personnalite, q = s.personnalite;
  const net = s.affectPositif - s.affectNegatif;
  const h = Math.floor(e.minute / 60) % 24;
  const nuit = h >= 20 || h < 6;
  const poids: [NatureInteractionVisite, number][] = [
    ['jeu', Math.max(0.1, (nuit ? 0.4 : 1) * (0.6 + (p.extraversion + q.extraversion) / 6 + Math.max(0, net) / 60 - compat / 4))],
    ['dispute', Math.max(0.1, 0.35 + compat / 3 + (5 - q.agreabilite) / 6 + (5 - p.agreabilite) / 8 + Math.max(0, -net) / 30 + e.emotions.colere / 120)],
    ['partage', net < -10 ? 0 : Math.max(0.1, 0.4 + (p.agreabilite + q.agreabilite) / 10 + Math.max(0, net) / 70)],
    ['repos', Math.max(0.1, (nuit ? 1.6 : 0.6) + (10 - p.extraversion - q.extraversion) / 10)],
  ];
  let r = rng() * poids.reduce((t, [, w]) => t + w, 0);
  let nature: NatureInteractionVisite = 'repos';
  for (const [n, w] of poids) { r -= w; if (r <= 0) { nature = n; break; } }

  const A = e.nom, B = s.nom;
  const il = (g: 'm' | 'f') => (g === 'f' ? 'elle' : 'il');
  const lui = (g: 'm' | 'f') => (g === 'f' ? 'elle' : 'lui');
  const ensemble = accordPluriel(e, s, 'tous les deux', 'toutes les deux');
  if (nature === 'jeu') {
    const reussi = rng() < probaEntente(e, s, compat);
    if (reussi) {
      return {
        nature, reussi, sens: 1, plus: Math.max(1, Math.round(3 - compat / 2)), moins: -1, emotions: { joie: 12, tristesse: -5 },
        education: { processus: 'socio', emotion: 'joy' },
        texte: piocher([`${A} et ${B} se courent après autour du ranch.`, `${A} et ${B} jouent à cache-cache derrière les tonneaux.`, `${B} lance une pomme de pin, ${A} la rapporte en trottinant.`, `${A} et ${B} se roulent dans l’herbe, ${ensemble} ravis.`.replace('ravis', accordPluriel(e, s, 'ravis', 'ravies'))], rng),
      };
    }
    return {
      nature, reussi, sens: -1, plus: 0, moins: 1, emotions: { tristesse: 8, joie: -3 }, education: null,
      texte: piocher([`${A} invite ${B} à jouer, mais ${il(s.genre)} détourne la tête.`, `${A} tourne autour de ${B} pour jouer ; ${B} ne bouge pas d’un pouce.`], rng),
    };
  }
  if (nature === 'dispute') {
    return {
      nature, reussi: true, sens: -1, plus: -1, moins: Math.round(2 + compat / 2), emotions: { colere: 12, peur: 4, joie: -4 },
      education: { processus: null, emotion: 'wrath' },
      texte: piocher([`${A} et ${B} se disputent une touffe d’herbe tendre.`, `${B} a bousculé ${A} ; le ton monte entre ${ensemble}.`, `${A} et ${B} se toisent, gonflés d’importance.`.replace('gonflés', accordPluriel(e, s, 'gonflés', 'gonflées')), `${A} grogne : ${B} s’est approché${s.genre === 'f' ? 'e' : ''} de trop près de sa gamelle.`], rng),
    };
  }
  if (nature === 'partage') {
    return {
      nature, reussi: true, sens: 1, plus: 2 + (compat < 2 ? 1 : 0), moins: 0, emotions: { joie: 6, tristesse: -3 },
      education: { processus: 'socio', emotion: 'joy' },
      texte: piocher([`${B} partage avec ${A} une baie trouvée près de la clôture.`, `${A} montre à ${B} un caillou brillant ; ${il(s.genre)} le regarde avec intérêt.`, `${A} laisse ${B} boire avant ${lui(e.genre)} à l’abreuvoir.`], rng),
    };
  }
  return {
    nature: 'repos', reussi: true, sens: 0, plus: 1, moins: 0, emotions: { peur: -3 }, education: null,
    texte: nuit
      ? piocher([`${A} et ${B} se blottissent l’un contre l’autre pour la nuit.`.replace('l’un contre l’autre', accordPluriel(e, s, 'l’un contre l’autre', 'l’une contre l’autre')), `${A} et ${B} regardent les lucioles, côte à côte.`], rng)
      : piocher([`${A} et ${B} se reposent côte à côte, à l’ombre.`, `${A} et ${B} observent les nuages sans rien dire.`], rng),
  };
}

// —————————————————————————————— arrivées et départs

/** Arrivée d'un écho déjà connu : la relation se lit dans la façon dont notre écho l'accueille. */
export function texteRetour(e: Pick<Etat, 'nom' | 'genre'>, s: EchoSauvage, parAppat = false): string {
  const debut = parAppat ? `L’appât attire ${s.nom}, qui revient vous rendre visite !` : `${s.nom} revient vous rendre visite !`;
  const n = niveauRelation(s);
  const suite: Partial<Record<NiveauRelation, string>> = {
    complicite: `${e.nom} se précipite à sa rencontre.`,
    amitie: `${e.nom} trottine joyeusement vers ${s.genre === 'f' ? 'elle' : 'lui'}.`,
    camaraderie: `${e.nom} ${s.genre === 'f' ? 'la' : 'le'} salue d’un petit cri.`,
    mefiance: `${e.nom} se tient à distance.`,
    hostilite: `${e.nom} se raidit en ${s.genre === 'f' ? 'la' : 'le'} voyant.`,
  };
  return suite[n] ? `${debut} ${suite[n]}` : debut;
}

/** Départ du visiteur au bout de sa visite. */
export function texteDepart(e: Pick<Etat, 'nom' | 'genre'>, s: EchoSauvage): string {
  const parti = `${s.nom} est reparti${s.genre === 'f' ? 'e' : ''}`;
  switch (niveauRelation(s)) {
    case 'complicite': return `${parti} ; ${e.nom} l’a accompagné${s.genre === 'f' ? 'e' : ''} jusqu’à la clôture.`;
    case 'amitie': return `${parti} en se retournant plusieurs fois.`;
    case 'mefiance': case 'hostilite': return `${parti}. ${e.nom} semble soulagé${e.genre === 'f' ? 'e' : ''}.`;
    default: return `${parti}.`;
  }
}
