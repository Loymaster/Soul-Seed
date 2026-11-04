// Ce que le joueur perçoit de l'état caché : une expression, une attitude, des indices écrits,
// et — seulement quand c'est pressant — une bulle. Aucune valeur chiffrée ne sort d'ici.
import type { Etat } from './types';
import { MAX_PAR_STADE } from './constantes';
import { etatEmotionnel, type EtatEmotionnel } from './emotions';
import { accord } from './outils';

export type Besoin =
  | 'faim' | 'fatigue' | 'salete' | 'affection' | 'maladie' | 'blessure' | 'angoisse' | 'humeur' | 'repus' | 'comportement';

/** 1 : discret (seulement l'attitude) · 2 : visible (indice écrit) · 3 : pressant (bulle). */
export type Urgence = 1 | 2 | 3;

export interface SigneBesoin {
  besoin: Besoin;
  urgence: Urgence;
  /** Ce qu'on remarque en observant l'écho. */
  indice: string;
}

export type Posture = 'normale' | 'sautillante' | 'affaissee' | 'tremblante';

export interface Signes {
  expression: EtatEmotionnel;
  /** « Filo a l'air joyeux. » */
  phrase: string;
  /** Du plus pressant au plus discret. */
  besoins: SigneBesoin[];
  /** Bulle à afficher au-dessus de l'écho (besoin pressant), sinon null. */
  bulle: { besoin: Besoin; icone: string } | null;
  posture: Posture;
  /** Multiplicateur de vitesse de déplacement (≈ 0,4 à 1,2). */
  allure: number;
  /** Multiplicateur du temps passé immobile entre deux déplacements. */
  flanerie: number;
  /** L'écho vient vers le joueur (premier plan) : il réclame de l'attention. */
  approche: boolean;
}

export const ICONE_BESOIN: Record<Besoin, string> = {
  faim: 'interface/etats/faim.png',
  fatigue: 'interface/etats/sommeil.png',
  salete: 'interface/etats/sale.png',
  affection: 'interface/icones/besoin-affection.png',
  maladie: 'interface/statuts/malade.png',
  blessure: 'interface/etats/blesse.png',
  angoisse: 'interface/icones/angoisse.png',
  humeur: 'interface/etats/mecontent.png',
  repus: 'interface/etats/faim.png',
  comportement: 'interface/icones/comportement.png',
};

export function lireSignes(e: Etat): Signes {
  const a = (m: string, f: string) => accord(e, m, f);
  const Il = a('Il', 'Elle');
  const max = MAX_PAR_STADE[e.stade];
  const besoins: SigneBesoin[] = [];
  const ajoute = (besoin: Besoin, urgence: Urgence, indice: string) => besoins.push({ besoin, urgence, indice });

  if (e.malade) ajoute('maladie', 3, `${Il} frissonne, le regard vitreux.`);
  if (e.blesse) ajoute('blessure', 3, `${Il} boite et se lèche une patte.`);

  const r = e.satiete / max;
  if (e.satiete <= 0) ajoute('faim', 3, `${Il} titube, le ventre vide.`);
  else if (r < 0.2) ajoute('faim', 2, 'Son ventre gargouille.');
  else if (r < 0.35) ajoute('faim', 1, `${Il} jette des coups d’œil vers votre sacoche.`);
  else if (r > 0.8) ajoute('repus', 1, `${Il} a le ventre bien rond.`);

  if (e.energie <= 10) ajoute('fatigue', 3, 'Ses paupières se ferment toutes seules.');
  else if (e.energie <= 20) ajoute('fatigue', 2, `${Il} bâille à s’en décrocher la mâchoire.`);
  else if (e.energie <= 30) ajoute('fatigue', 1, `${Il} traîne un peu la patte.`);

  if (e.proprete <= 0) ajoute('salete', 3, `Une odeur tenace ${a('le', 'la')} suit, et les mouches aussi.`);
  else if (e.proprete <= 20) ajoute('salete', 2, `${Il} se gratte sans arrêt.`);
  else if (e.proprete <= 40) ajoute('salete', 1, 'Son pelage est un peu terne.');

  if (e.besoinAffection) ajoute('affection', 3, `${Il} gémit doucement en vous fixant.`);
  else if (e.manqueAffection > 50) ajoute('affection', 2, `${Il} vient se coller à vous dès que vous approchez.`);
  else if (e.manqueAffection > 35) ajoute('affection', 1, `${Il} vous suit du regard.`);

  if (e.anxiete > 90) ajoute('angoisse', 3, `${Il} tourne en rond, au bord de la panique.`);
  else if (e.anxiete > 75) ajoute('angoisse', 2, `${Il} tremble un peu.`);
  else if (e.anxiete > 40) ajoute('angoisse', 1, `${Il} sursaute au moindre bruit.`);

  if (e.humeur <= 0) ajoute('humeur', 3, `Plus rien ne semble ${a('l’intéresser', 'l’intéresser')}.`);
  else if (e.humeur < 30) ajoute('humeur', 2, `${Il} boude dans son coin.`);

  if (e.comportement) ajoute('comportement', 3, `${Il} a l’air d’avoir quelque chose à vous montrer.`);

  besoins.sort((x, y) => y.urgence - x.urgence);
  // La bulle : le besoin pressant le plus grave (le comportement passe après les besoins du corps).
  const ordre: Besoin[] = ['maladie', 'blessure', 'faim', 'fatigue', 'angoisse', 'salete', 'affection', 'humeur', 'comportement'];
  const pressant = ordre.find(b => besoins.some(s => s.besoin === b && s.urgence === 3));

  const expression = etatEmotionnel(e);
  const niveau = (b: Besoin) => besoins.find(s => s.besoin === b)?.urgence ?? 0;
  const em = e.emotions;

  let allure = 1;
  allure *= 1 - 0.2 * niveau('fatigue');
  if (e.malade) allure *= 0.5;
  if (e.blesse) allure *= 0.6;
  if (em.tristesse > 60) allure *= 0.75;
  if (em.joie > 60 && e.humeur > 60) allure *= 1.15;
  if (e.anxiete > 75) allure *= 1.1;
  allure = Math.max(0.35, Math.min(1.25, allure));

  const posture: Posture =
    e.malade || e.anxiete > 75 || em.peur > 85 ? 'tremblante'
      : em.tristesse > 60 || e.humeur < 30 || niveau('fatigue') >= 2 ? 'affaissee'
        : em.joie > 60 && e.humeur > 60 ? 'sautillante' : 'normale';

  return {
    expression,
    phrase: `${e.nom} a l’air ${accord(e, expression.m, expression.f)}.`,
    besoins,
    bulle: pressant ? { besoin: pressant, icone: ICONE_BESOIN[pressant] } : null,
    posture,
    allure,
    flanerie: 1 / allure,
    approche: niveau('affection') >= 2,
  };
}
