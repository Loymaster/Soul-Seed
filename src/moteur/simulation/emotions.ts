// Émotions : facteurs de tempérament et de traits, et état émotionnel perçu.
import type { Emotion, Emotions, Etat, Temperament, Traits } from './types';
import { borne, dixieme } from './outils';

/** temperamentFactorFor : la Curiosité amplifie la joie ; les autres tempéraments atténuent leur émotion. */
export function facteurTemperament(t: Temperament, emotion: Emotion) {
  switch (emotion) {
    case 'joie': return 1 + t.cur / 5;
    case 'colere': return 1 - t.res / 5;
    case 'degout': return 1 - t.dis / 5;
    case 'tristesse': return 1 - t.obs / 5;
    case 'peur': return 1 - t.ant / 5;
    default: return 1;
  }
}

/** traitFactorFor : de 0,8 à 1,2 ; joie et colère amplifiées par leur trait, les autres atténuées. */
export function facteurTrait(traits: Traits, emotion: Emotion) {
  const cle = ({ joie: 'optimisme', colere: 'impulsivite', degout: 'prudence', tristesse: 'resilience', peur: 'planification' } as const)[
    emotion as Exclude<Emotion, 'surprise'>
  ];
  if (!cle) return 1;
  const delta = (traits[cle] - 50) / 50 / 5;
  return emotion === 'joie' || emotion === 'colere' ? 1 + delta : 1 - delta;
}

export function deltaAjuste(e: Pick<Etat, 'temperament' | 'traits'>, emotion: Emotion, brut: number) {
  return brut * facteurTemperament(e.temperament, emotion) * facteurTrait(e.traits, emotion);
}

/** applyEmotionBatch : chaque delta brut passe par les facteurs puis est borné 0–100 (arrondi au dixième). */
export function appliquerEmotions(e: Etat, deltas: Partial<Emotions>) {
  for (const k of Object.keys(deltas) as Emotion[]) {
    const d = deltas[k];
    if (!d) continue;
    e.emotions[k] = borne(dixieme(e.emotions[k] + deltaAjuste(e, k, d)));
  }
}

/** applyAnxieteDelta : un névrotisme fort amplifie les hausses d'anxiété ; les baisses passent telles quelles. */
export function ajouterAnxiete(e: Etat, brut: number) {
  const f = brut > 0 ? 1 + (e.personnalite.nevrosisme - 3) / 10 : 1;
  e.anxiete = borne(e.anxiete + brut * f);
}

// ———————————————————————————————————————————————————————————————————————————————
// État émotionnel perçu (EMOTION_STATES du prototype : 32 états, le plus prioritaire l'emporte).

interface Lecture {
  colere: number; joie: number; tristesse: number; surprise: number; degout: number; peur: number;
  humeur: number; affection: number; manque: number; anxiete: number; malade: boolean; blesse: boolean; fatigue: number;
}

export interface EtatEmotionnel {
  id: string;
  /** Adjectif au masculin et au féminin (« joyeux » / « joyeuse »). */
  m: string;
  f: string;
  priorite: number;
  /** Icône dans public/assets/emotions/. */
  icone: string;
}

const E = (id: string, m: string, f: string, priorite: number, test: (s: Lecture) => boolean) => ({ id, m, f, priorite, icone: `emotions/${id}.png`, test });

const ETATS = [
  E('malade', 'malade', 'malade', 100, s => s.malade),
  E('blesse', 'blessé', 'blessée', 99, s => s.blesse),
  E('epuise', 'épuisé', 'épuisée', 92, s => s.fatigue > 85),
  E('terrifie', 'terrifié', 'terrifiée', 91, s => s.peur > 85),
  E('furieux', 'furieux', 'furieuse', 85, s => s.colere > 85),
  E('angoisse', 'angoissé', 'angoissée', 84, s => s.anxiete > 75),
  E('desespere', 'désespéré', 'désespérée', 83, s => s.peur > 60 && s.tristesse > 60),
  E('sidere', 'sidéré', 'sidérée', 76, s => s.peur > 50 && s.surprise > 50),
  E('meprisant', 'méprisant', 'méprisante', 75, s => s.colere > 50 && s.degout > 60),
  E('defensif', 'sur la défensive', 'sur la défensive', 74, s => s.colere > 50 && s.peur > 50),
  E('abandon', 'inquiet d’être abandonné', 'inquiète d’être abandonnée', 70, s => s.affection > 55 && s.manque > 65),
  E('anxieux', 'anxieux', 'anxieuse', 66, s => s.anxiete > 40 && s.anxiete < 75),
  E('abattu', 'abattu', 'abattue', 65, s => s.tristesse > 60 && s.degout > 50),
  E('frustre', 'frustré', 'frustrée', 64, s => s.colere > 60 && s.tristesse > 40),
  E('deception', 'déçu', 'déçue', 63, s => s.tristesse > 40 && s.surprise > 50),
  E('jaloux', 'jaloux', 'jalouse', 58, s => s.affection > 60 && s.manque > 35),
  E('triste', 'triste', 'triste', 55, s => s.tristesse > 60),
  E('en-colere', 'en colère', 'en colère', 54, s => s.colere > 60),
  E('degout', 'dégoûté', 'dégoûtée', 53, s => s.degout > 65),
  E('nerveux', 'nerveux', 'nerveuse', 52, s => s.joie > 50 && s.peur > 40),
  E('emerveille', 'émerveillé', 'émerveillée', 51, s => s.joie > 60 && s.surprise > 60),
  E('delaisse', 'délaissé', 'délaissée', 48, s => s.manque > 70 && s.tristesse > 50),
  E('adorateur', 'plein d’adoration', 'pleine d’adoration', 46, s => s.affection > 85 && s.joie > 60),
  E('affectueux', 'affectueux', 'affectueuse', 44, s => s.affection > 70),
  E('fier', 'fier', 'fière', 43, s => s.joie > 50 && s.humeur > 70),
  E('surpris', 'surpris', 'surprise', 42, s => s.surprise > 70),
  E('joyeux', 'joyeux', 'joyeuse', 33, s => s.joie > 60),
  E('serein', 'serein', 'sereine', 32, s => s.humeur > 70 && s.colere < 30 && s.tristesse < 30 && s.peur < 30 && s.degout < 30 && s.surprise < 30 && s.anxiete < 20),
  E('boudeur', 'boudeur', 'boudeuse', 22, s => s.colere > 30 && s.humeur < 30),
  E('morose', 'morose', 'morose', 21, s => s.humeur < 30),
  E('distant', 'distant', 'distante', 15, s => s.affection < 20),
  E('neutre', 'tranquille', 'tranquille', 1, () => true),
];

export const ETATS_EMOTIONNELS: EtatEmotionnel[] = ETATS.map(({ test: _t, ...reste }) => reste);

export function etatEmotionnel(e: Etat): EtatEmotionnel {
  const s: Lecture = {
    ...e.emotions, humeur: e.humeur, affection: e.affection, manque: e.manqueAffection, anxiete: e.anxiete,
    malade: e.malade, blesse: e.blesse,
    // Comme le prototype : fatigue = 100 − énergie, quel que soit le stade (épuisé sous 15 d'énergie).
    fatigue: 100 - e.energie,
  };
  const trouve = ETATS.find(x => x.test(s)) ?? ETATS[ETATS.length - 1];
  const { test: _t, ...reste } = trouve;
  return reste;
}
