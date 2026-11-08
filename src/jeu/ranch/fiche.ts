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

/**
 * Paliers d'une caractéristique (toutes sont féminines : la force, l'agilité…), calés sur les plages réelles du
 * système du prototype : à l'éclosion, 10–50 + 100 points répartis + bonus de lignée (≈ 30 à 85, ≈ 47 en moyenne) ;
 * chaque évolution multiplie par 1,2–1,4 ; entraînements (≈ 5 à 16 par séance selon le stade), corvées (jusqu'à
 * ≈ 36 × 1,85) et combats s'ajoutent. Mesuré sur 20 vies simulées : trois entraînements par jour sans corvée mènent
 * vers 220–330 au 20ᵉ jour ; toutes les corvées et un entraînement toutes les deux heures, vers 850–990 (plafond 999).
 * Repères : bébé « frêle » ou « modeste », enfant « honnête », adolescent « solide » à « aguerrie »,
 * adulte « remarquable » et au-delà.
 */
const PALIERS: [number, string][] = [
  [60, 'frêle'], [110, 'modeste'], [180, 'honnête'], [280, 'solide'], [420, 'aguerrie'], [600, 'remarquable'], [800, 'redoutable'], [Infinity, 'légendaire'],
];
export const CRANS = 10;

/**
 * Palier nommé et nombre de crans (sur 10) d'une valeur cachée de caractéristique (≈ 10 à 999).
 * Les crans suivent la barre du prototype (valeur / 999) : un écho qui vient d'éclore n'en a qu'un.
 */
export function palierCarac(v: number) {
  const mot = PALIERS.find(([seuil]) => v < seuil)![1];
  return { mot, crans: Math.max(1, Math.min(CRANS, Math.round((v / 999) * CRANS))) };
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
