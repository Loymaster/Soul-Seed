// Allures des échos : comment chaque forme se déplace, d'après son image (regardée une à une sur planches-contacts).
// Une seule table, partagée par le ranch (notre écho et l'écho de passage, demarche.ts) et l'écran de combat.
// Le test tests/allures.test.ts vérifie que toute image de public/assets/echos/ a son allure :
// **une nouvelle image d'écho s'ajoute ici.**

/** Façon de se déplacer. */
export type Demarche =
  | 'bipede'      // sur deux pattes : pas balancés
  | 'quadrupede'  // sur quatre pattes : trot, petit tangage
  | 'sautillant'  // rebondit (boules sur pattes minuscules, lapins)
  | 'rampant'     // glisse au sol en s'étirant (gelées, tentacules, mille-pattes, masses)
  | 'flottant'    // lévite sans ailes (spectres, flammes, éther) : dérive lente, ombre réduite
  | 'vole'        // vole à coups d'ailes : battements rapides, ombre réduite
  | 'nage'        // ondule comme dans l'eau (axolotls, sirènes, serpents et baleines du ciel)
  | 'immobile';   // ne se déplace pas (graines)

/** Carrure : module l'amplitude (rebond, roulis), la cadence et la vitesse. */
export type Carrure = 'leger' | 'moyen' | 'lourd';

export interface Allure {
  demarche: Demarche;
  carrure: Carrure;
  /** Multiplicateur de la durée d'un cycle (1 : cadence de la démarche ; < 1 : plus vif). */
  cadence: number;
  /** Hauteur au-dessus du sol, en part de la hauteur de l'image (volants, flottants, nageurs). */
  hauteur: number;
  /** Inclinaison vers l'avant pendant le déplacement (degrés). */
  inclinaison: number;
}

type Reglage = Partial<Omit<Allure, 'demarche' | 'carrure'>>;
type Entree = [Demarche, Carrure?, Reglage?];

/** Valeurs par défaut de chaque démarche. */
const DEFAUT: Record<Demarche, Omit<Allure, 'demarche' | 'carrure'>> = {
  bipede: { cadence: 1, hauteur: 0, inclinaison: 2 },
  quadrupede: { cadence: 1, hauteur: 0, inclinaison: 0 },
  sautillant: { cadence: 1, hauteur: 0, inclinaison: 0 },
  rampant: { cadence: 1, hauteur: 0, inclinaison: 0 },
  flottant: { cadence: 1, hauteur: 0.14, inclinaison: 5 },
  vole: { cadence: 1, hauteur: 0.24, inclinaison: 8 },
  nage: { cadence: 1, hauteur: 0.1, inclinaison: 4 },
  immobile: { cadence: 1, hauteur: 0, inclinaison: 0 },
};

/** Par chemin sous `echos/`. */
const TABLE: Record<string, Entree> = {
  // —— graines et âme
  'graines/disgust.png': ['immobile'],
  'graines/fear.png': ['immobile'],
  'graines/joy.png': ['immobile'],
  'graines/sorrow.png': ['immobile'],
  'graines/wrath.png': ['immobile'],
  'ame.png': ['flottant', 'leger', { hauteur: 0.1 }],

  // —— bébés
  'bebe/disgust.png': ['rampant', 'leger'],                       // flaque de gelée à un œil
  'bebe/dark-disgust.png': ['rampant', 'leger'],
  'bebe/fear.png': ['flottant', 'leger'],                         // petit fantôme à queue
  'bebe/dark-fear.png': ['flottant', 'leger'],
  'bebe/joy.png': ['quadrupede', 'leger', { cadence: 0.85 }],     // chiot assis
  'bebe/dark-joy.png': ['quadrupede', 'leger', { cadence: 0.85 }],
  'bebe/neutre.png': ['sautillant', 'leger'],                     // boule à pattes minuscules
  'bebe/dark-neutre.png': ['sautillant', 'leger'],
  'bebe/sorrow.png': ['nage', 'leger', { hauteur: 0.06 }],        // têtard-axolotl, queue au sol
  'bebe/dark-sorrow.png': ['nage', 'leger', { hauteur: 0.06 }],
  'bebe/wrath.png': ['bipede', 'leger', { cadence: 0.7, inclinaison: 5 }], // boule à cornes qui trottine
  'bebe/dark-wrath.png': ['bipede', 'leger', { cadence: 0.7, inclinaison: 5 }],

  // —— enfants
  'enfant/disgust.png': ['rampant'],                              // gelée à tentacules
  'enfant/dark-disgust.png': ['rampant'],
  'enfant/fear.png': ['flottant', 'leger'],                       // spectre
  'enfant/dark-fear.png': ['flottant', 'leger'],
  'enfant/joy.png': ['bipede'],                                   // chien debout
  'enfant/dark-joy.png': ['bipede'],
  'enfant/neutre.png': ['bipede', 'leger'],                       // boule de poils debout
  'enfant/dark-neutre.png': ['bipede'],
  'enfant/sorrow.png': ['nage', 'leger'],                         // axolotl dressé sur sa queue
  'enfant/dark-sorrow.png': ['nage', 'leger'],
  'enfant/wrath.png': ['bipede', 'lourd'],                        // boule cornue sur deux pattes griffues
  'enfant/dark-wrath.png': ['bipede', 'lourd'],

  // —— adolescents
  'adolescent/disgust.png': ['rampant'],                          // pieuvre
  'adolescent/dark-disgust.png': ['rampant'],
  'adolescent/fear.png': ['vole', 'leger'],                       // spectre ailé
  'adolescent/dark-fear.png': ['vole', 'leger'],
  'adolescent/joy-f.png': ['bipede'],
  'adolescent/joy-m.png': ['bipede'],
  'adolescent/dark-joy-f.png': ['bipede'],
  'adolescent/dark-joy-m.png': ['bipede'],
  'adolescent/neutre.png': ['bipede', 'leger'],
  'adolescent/dark-neutre.png': ['bipede'],
  'adolescent/sorrow.png': ['nage'],                              // sirène
  'adolescent/dark-sorrow.png': ['nage'],
  'adolescent/wrath.png': ['bipede', 'lourd'],                    // boule à longs bras et pattes
  'adolescent/dark-wrath.png': ['bipede', 'lourd'],
  'adolescent/branch-d-df.png': ['bipede', 'lourd', { cadence: 1.2 }], // masse trapue sur pattes courtes
  'adolescent/branch-d-ds.png': ['nage'],                         // phoque liquide
  'adolescent/branch-f-dj.png': ['flottant'],                     // renard dont le bas se dissout en fumée
  'adolescent/branch-f-dw.png': ['flottant'],                     // silhouette de flammes
  'adolescent/branch-j-dd.png': ['bipede', 'moyen', { inclinaison: 6 }], // voûté, bras ballants
  'adolescent/branch-j-ds.png': ['quadrupede'],                   // chacal
  'adolescent/branch-n-dn.png': ['bipede'],
  'adolescent/branch-s-df.png': ['nage', 'leger'],                // ondine
  'adolescent/branch-s-dw.png': ['quadrupede'],                   // dragonnet aquatique
  'adolescent/branch-w-dd.png': ['quadrupede', 'lourd'],          // boule de lave sur quatre pattes
  'adolescent/branch-w-dj.png': ['quadrupede'],                   // loup
  'adolescent/fragment-cognitif.png': ['bipede', 'moyen', { cadence: 1.25, inclinaison: 0 }], // hibou sous sa cape
  'adolescent/fragment-psychomoteur.png': ['quadrupede', 'leger'],
  'adolescent/fragment-socio.png': ['sautillant'],                // lapin

  // —— adultes
  'adulte/disgust.png': ['rampant', 'lourd'],                     // grande pieuvre
  'adulte/dark-disgust.png': ['rampant', 'lourd'],
  'adulte/fear.png': ['vole'],                                    // spectre ailé
  'adulte/dark-fear.png': ['vole'],
  'adulte/joy-f.png': ['bipede'],
  'adulte/joy-m.png': ['bipede'],
  'adulte/dark-joy-f.png': ['bipede'],
  'adulte/dark-joy-m.png': ['bipede'],
  'adulte/neutre.png': ['bipede', 'leger'],
  'adulte/dark-neutre.png': ['bipede'],
  'adulte/sorrow.png': ['nage'],                                  // sirène
  'adulte/dark-sorrow.png': ['nage'],
  'adulte/wrath.png': ['bipede', 'lourd', { inclinaison: 5 }],    // démon voûté
  'adulte/dark-wrath.png': ['bipede', 'moyen', { inclinaison: 6 }],
  'adulte/branch-d-df.png': ['quadrupede', 'lourd'],              // gueule sur pattes
  'adulte/branch-d-ds.png': ['nage', 'lourd'],                    // bête d'eau à mille bouches
  'adulte/branch-f-dj.png': ['bipede', 'moyen', { inclinaison: 0 }], // renard en robe
  'adulte/branch-f-dw.png': ['flottant'],                         // silhouette de flammes
  'adulte/branch-j-dd.png': ['bipede', 'moyen', { inclinaison: 6 }],
  'adulte/branch-j-ds.png': ['quadrupede'],                       // chacal
  'adulte/branch-n-dn.png': ['bipede'],
  'adulte/branch-s-df.png': ['nage', 'leger'],                    // ondine
  'adulte/branch-s-dw.png': ['quadrupede', 'lourd'],              // dragon
  'adulte/branch-w-dd.png': ['quadrupede', 'lourd'],              // bête de lave ramassée
  'adulte/branch-w-dj.png': ['quadrupede'],                       // loup
  'adulte/melee-djw.png': ['bipede', 'lourd', { inclinaison: 6 }], // bête écailleuse dressée
  'adulte/melee-fsd.png': ['flottant'],                           // spectre en haillons
  'adulte/melee-jfd.png': ['vole', 'leger'],                      // fée-papillon
  'adulte/melee-jfs.png': ['quadrupede', 'leger', { cadence: 1.15 }], // cerf d'aurore
  'adulte/melee-jwf.png': ['quadrupede'],                         // lion ailé, debout sur ses pattes
  'adulte/melee-jws.png': ['nage', 'leger', { hauteur: 0.16 }],   // dragon-serpent des nuées
  'adulte/melee-sdj.png': ['nage', 'lourd', { hauteur: 0.16 }],   // baleine-bosquet du ciel
  'adulte/melee-wfd.png': ['rampant', 'moyen', { cadence: 0.55 }], // mille-pattes
  'adulte/melee-wfs.png': ['quadrupede', 'lourd'],                // dragon d'orage
  'adulte/melee-wsd.png': ['rampant', 'lourd', { cadence: 1.3 }],  // hydre de boue
  'adulte/memoire-d-terre.png': ['quadrupede', 'lourd', { cadence: 1.2 }], // golem sur ses poings
  'adulte/memoire-f-foudre.png': ['flottant'],                    // spectre de foudre
  'adulte/memoire-j-vent.png': ['quadrupede', 'leger'],           // renard du vent
  'adulte/memoire-n-ether.png': ['flottant', 'leger'],            // être d'éther, jambes ballantes
  'adulte/memoire-s-eau.png': ['nage', 'moyen', { hauteur: 0.12 }], // serpent de mer
  'adulte/memoire-w-feu.png': ['bipede', 'lourd'],                // dragon de lave debout
};

/** Chemins (sous `echos/`) qui ont une allure réglée. */
export const CHEMINS_ALLURES = Object.keys(TABLE);

/** La clé de table d'un chemin d'image (`echos/adulte/x.png`, `/assets/echos/…`, URL complète…). */
function cle(chemin: string): string {
  const i = chemin.lastIndexOf('echos/');
  return (i >= 0 ? chemin.slice(i + 6) : chemin).split(/[?#]/)[0];
}

/** L'allure d'une image d'écho ; null pour une image inconnue (PNJ, image non listée). */
export function allureDe(chemin: string | null | undefined): Allure | null {
  if (!chemin) return null;
  const e = TABLE[cle(chemin)];
  if (!e) return null;
  const [demarche, carrure = 'moyen', reglage = {}] = e;
  return { demarche, carrure, ...DEFAUT[demarche], ...reglage };
}

/** Repli : un écho dont l'image n'est pas listée marche sur deux pattes. */
export const ALLURE_PAR_DEFAUT: Allure = { demarche: 'bipede', carrure: 'moyen', ...DEFAUT.bipede };

/** Les démarches qui ne touchent pas le sol. */
export const enLAir = (d: Demarche) => d === 'flottant' || d === 'vole' || d === 'nage';

/** Classes CSS d'une allure (ranch : `.echo-zone` ; combat : `.ec`), voir allures.css.
 *  `hauteurPx` : élévation au-dessus du sol déjà calculée (px), arrondie à des crans de 6 px. */
export function classesAllure(a: Allure, hauteurPx = 0): string {
  const cran = Math.max(0, Math.min(16, Math.round(hauteurPx / 6)));
  const penche = Math.max(0, Math.min(10, Math.round(a.inclinaison)));
  return ['al', `al-${a.demarche}`, `al-${a.carrure}`, cran ? `al-h${cran}` : '', penche ? `al-p${penche}` : ''].filter(Boolean).join(' ');
}

/** Résumé par démarche (rapport, atelier). */
export function resumeAllures(): Record<Demarche, string[]> {
  const r = {} as Record<Demarche, string[]>;
  for (const [c, [d]] of Object.entries(TABLE)) (r[d] ??= []).push(c);
  return r;
}
