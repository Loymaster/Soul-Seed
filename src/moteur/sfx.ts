// Moteur de sons synthétisés de Soul Seed (WebAudio, aucun fichier) — porté depuis les maquettes.
// Trois registres : ranch (cuir, papier, crayon), magie sainte (verre clair), corruption (os, métal grave).
import { SFX as brut } from './sfx-impl.js';

/** Timbre d'une voix de dialogue : une petite note par lettre, colorée par ces réglages. */
export interface Timbre {
  type?: OscillatorType;
  lp?: number;
  dur?: number;
  attack?: number;
  gain?: number;
  detune?: number;
  body?: number;
  air?: number;
  airGain?: number;
}

/** Timbres prêts à l'emploi, choisis dans les fiches de personnages. */
export const TIMBRES: Record<string, { nom: string; reglages: Timbre }> = {
  doux: { nom: 'Doux (flûte feutrée)', reglages: { type: 'sine', lp: 1700, dur: 0.11, attack: 0.012, gain: 0.026, airGain: 0.003 } },
  vif: { nom: 'Vif (petit grelot)', reglages: { type: 'triangle', lp: 3000, dur: 0.05, gain: 0.02, air: 4200 } },
  grave: { nom: 'Grave (corde frottée)', reglages: { type: 'sawtooth', lp: 900, dur: 0.09, attack: 0.006, gain: 0.018, body: 0.02, air: 1800, airGain: 0.004 } },
  narration: { nom: 'Narration', reglages: { type: 'sine', lp: 1500, dur: 0.09, attack: 0.01, gain: 0.02, airGain: 0.002 } },
  boise: { nom: 'Boisé (marimba)', reglages: { type: 'triangle', lp: 1400, dur: 0.13, attack: 0.002, gain: 0.03, body: 0.012, airGain: 0.002 } },
  souffle: { nom: 'Souffle (murmure)', reglages: { type: 'sine', lp: 900, dur: 0.14, attack: 0.03, gain: 0.014, air: 2400, airGain: 0.012 } }
};

export function timbre(nom: string | Timbre | undefined): Timbre {
  if (!nom) return TIMBRES.doux.reglages;
  return typeof nom === 'string' ? (TIMBRES[nom]?.reglages ?? TIMBRES.doux.reglages) : nom;
}

type Son = () => void;
export interface MoteurSons {
  on: boolean;
  /** Volume des bruitages (0–1). */
  niveau: number;
  regler: (n: number) => void;
  holyHover: Son; holyClick: Son; reveal: Son; darkHover: Son; darkClick: Son;
  stamp: Son; leather: Son; page: (volume?: number) => void; woosh: Son; bookArrive: Son;
  pencil: Son; paperTick: Son; slide: Son; pop: Son;
  caresse: Son; refus: Son;
  balai: Son; berceuse: Son; berceuseLongue: Son; brosse: Son; bulles: Son; croque: Son; eau: Son; marteau: Son; rebond: Son; appel: Son; retrouvailles: Son; sacPose: Son;
  pas: (volume?: number) => void; sacoche: (ouvre: boolean) => void;
  foulee: (profil: { demarche: string; taille: number; poids: number }, volume: number, patte: number) => void;
  glisse: (profil: { demarche: string; taille: number; poids: number }, volume: number, duree: number) => void;
  gargouille: (volume?: number) => void; baille: (volume?: number) => void;
  typeTick: (lettre: string, note?: number, timbre?: Timbre) => void;
  // cycle de l'écho (magie sainte)
  chant: (i: number) => void; pose: Son; eveil: Son; ouverture: Son; cri: Son;
  pouls: Son; secousse: Son; vent: (duree: number) => void; repli: Son; formeGraine: Son; survolDoux: Son;
  motVoix: (i: number) => void; sceau: (i: number) => void; aube: Son;
  /** Validation de l'introduction : une note unique, neutre et mystérieuse. */
  mystere: Son;
  // évolution de l'écho
  evoMontee: (duree: number) => void; evoBattement: (i: number) => void; evoEclat: Son; evoRevelation: Son;
}

export const SFX = brut as unknown as MoteurSons;
