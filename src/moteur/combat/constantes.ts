// Constantes du combat, reprises du prototype.

/** Arène : coordonnées en % de la zone de combat (y : du fond vers le premier plan). */
export const ARENE = { xMin: 8, xMax: 92, yMin: 46, yMax: 94 } as const;
export const CENTRE_ARENE = { x: 50, y: (ARENE.yMin + ARENE.yMax) / 2 } as const;
/** Portée d'une attaque au corps à corps. */
export const PORTEE_MELEE = 11;
/** Portée d'une technique à distance (4 × la mêlée). */
export const PORTEE_DISTANCE = PORTEE_MELEE * 4;
/** Écart minimal entre deux combattants. */
export const SEPARATION = 9;
/** Les échos avancent par pas « saccadés », un toutes les 350 ms. */
export const PAS_MS = 350;
/** Le moteur découpe le temps en tranches d'au plus 50 ms (le prototype bornait chaque image à 500 ms). */
export const TRANCHE_MS = 50;
/** Durée de l'élan d'une attaque avant qu'elle ne porte. */
export const ELAN_MS = 500;

/** Seuils d'intelligence auxquels l'écho apprend une technique. */
export const SEUILS_TECHNIQUES = [150, 350, 550, 750] as const;
export const MAX_TECHNIQUES = 3;

/** Ordres du joueur : intelligence requise, durée d'effet et recharge (ms). */
export const ORDRES = {
  encourager: { intelligence: 0, duree: 10000, recharge: 20000 },
  attaque: { intelligence: 100, duree: 10000, recharge: 20000 },
  fuit: { intelligence: 200, duree: 10000, recharge: 20000 },
  protege: { intelligence: 300, duree: 5000, recharge: 15000 },
  distance: { intelligence: 400, duree: 15000, recharge: 20000 },
  technique: { intelligence: 500, duree: 0, recharge: 20000 },
  /** Verrouille la cible des alliés à 700 d'intelligence ou plus (combats à plusieurs). */
  cible: { intelligence: 700, duree: 0, recharge: 5000 },
} as const;
export const RECHARGE_FUITE = 10000;
export const RECHARGE_SOIN = 30000;
export const RECHARGE_SOIN_ARENE = 8000;

export const STATUTS_NEGATIFS = ['saignement', 'empoisonnement', 'terreur', 'brulure', 'ralentissement', 'etourdissement'] as const;
export const STATUTS_POSITIFS = ['protection', 'rapidite', 'regeneration', 'immunite', 'renvoiDegats'] as const;
