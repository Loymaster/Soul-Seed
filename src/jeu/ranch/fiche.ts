// La fiche de l'écho (onglet « Écho » du petit carnet) : portrait, tempérament, caractéristiques de combat.
// Jamais de chiffre : des jauges à crans, des paliers nommés, des flèches pour ce qui vient de progresser.
import {
  CLES_CARACS, CLES_TEMPERAMENT, NOM_CARAC, TRAIT_DE_TEMPERAMENT,
  type Caracs, type CleCarac, type CleTrait, type Etat,
} from '@/moteur/simulation';
import { TEMPERAMENTS } from './evenements';

export type OngletFiche = 'portrait' | 'temperament' | 'combat';
export const ONGLETS_FICHE: { k: OngletFiche; nom: string }[] = [
  { k: 'portrait', nom: 'Portrait' }, { k: 'temperament', nom: 'Tempérament' }, { k: 'combat', nom: 'Combat' },
];

const NOM_TRAIT: Record<CleTrait, string> = {
  optimisme: 'optimisme', impulsivite: 'impulsivité', planification: 'planification', resilience: 'résilience', prudence: 'prudence',
};

/** Paliers d'une caractéristique (toutes sont féminines : la force, l'agilité…). */
const PALIERS: [number, string][] = [
  [45, 'frêle'], [75, 'modeste'], [120, 'honnête'], [190, 'solide'], [300, 'aguerrie'], [450, 'remarquable'], [650, 'redoutable'], [Infinity, 'légendaire'],
];
export const CRANS = 10;

/** Palier nommé et nombre de crans (sur 10) d'une valeur cachée de caractéristique (≈ 10 à 999). */
export function palierCarac(v: number) {
  const mot = PALIERS.find(([seuil]) => v < seuil)![1];
  const f = Math.max(0, Math.min(1, Math.log(Math.max(10, v) / 10) / Math.log(100)));
  return { mot, crans: Math.max(1, Math.round(f * CRANS)) };
}

/** Ce qui a progressé entre deux relevés : une, deux ou trois flèches selon l'ampleur, sans chiffre. */
export function progression(avant: Caracs, apres: Caracs): { cle: CleCarac; nom: string; fleches: string }[] {
  return CLES_CARACS
    .map((cle) => ({ cle, d: apres[cle] - avant[cle] }))
    .filter((x) => x.d > 0.05)
    .sort((a, b) => b.d - a.d)
    .map(({ cle, d }) => ({ cle, nom: NOM_CARAC[cle], fleches: d >= 20 ? '↑↑↑' : d >= 8 ? '↑↑' : '↑' }));
}

/** Les six caractéristiques de combat ; `recents` : ce qui vient de progresser (lueur et flèches). */
export function lignesCombat(e: Etat, recents: Partial<Record<CleCarac, string>>) {
  return CLES_CARACS.map((cle) => {
    const p = palierCarac(e.caracs[cle]);
    const fleches = recents[cle] ?? '';
    return {
      nom: NOM_CARAC[cle], mot: p.mot, fleches, monte: !!fleches, cls: fleches ? 'monte' : '',
      crans: Array.from({ length: CRANS }, (_, i) => ({ cls: i < p.crans ? 'plein' : '' })),
    };
  });
}

const intensite = (v: number) => (v < 35 ? 'à peine' : v < 50 ? 'un peu' : v < 65 ? 'nettement' : v < 80 ? 'fortement' : 'profondément');

/** Les cinq tempéraments : la part innée (0 à 3 crans, tirée à l'éclosion) et le trait qu'il nourrit, qui évolue. */
export function lignesTemperament(e: Etat) {
  const max = Math.max(...CLES_TEMPERAMENT.map((k) => e.temperament[k]));
  return CLES_TEMPERAMENT.map((k) => {
    const t = TEMPERAMENTS[k]; const n = e.temperament[k]; const trait = TRAIT_DE_TEMPERAMENT[k];
    return {
      nom: t.label, couleur: n ? t.color : '#9a8668', lueur: n ? t.glow : 'transparent', glyphe: t.glyphe,
      cls: n === 0 ? 'absent' : n === max ? 'dominant' : '',
      points: [0, 1, 2].map((i) => ({ cls: i < n ? 'plein' : '' })),
      trait: `${NOM_TRAIT[trait]} · ${intensite(e.traits[trait])}`,
    };
  });
}

/** Le tempérament dominant, pour la phrase d'en-tête. */
export function temperamentDominant(e: Etat) {
  const k = CLES_TEMPERAMENT.reduce((a, b) => (e.temperament[b] > e.temperament[a] ? b : a));
  return TEMPERAMENTS[k];
}
