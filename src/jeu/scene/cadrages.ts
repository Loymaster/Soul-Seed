// Cadrage des portraits dans les médaillons des dialogues : chaque image a sa morphologie,
// on dit donc pour chacune où se trouve le visage et quelle part de l'image montrer.
//   — échos : le médaillon rond en bas à gauche (la « loupe ») ;
//   — joueur : la carte « vous » en bas à droite et les pastilles d'avatar du menu.
// Les cadrages ont été réglés à l'œil sur des planches-contacts du médaillon rendu.
// Une image absente de la table reçoit un cadrage calculé (haut de la silhouette opaque).

/** Un cadrage : centre du visage (x, y, fractions de la largeur et de la hauteur de l'image)
 *  et diamètre montré (d, fraction de la largeur de l'image). */
export interface Cadrage { x: number; y: number; d: number }

/** Boîte des pixels opaques d'une image (catalogue des assets). */
interface Boite { x: number; y: number; l: number; h: number }

/** Échos, par chemin sous `echos/` : [x, y, d]. */
const ECHOS: Record<string, [number, number, number]> = {
  // —— bébés
  'bebe/dark-disgust.png': [0.52, 0.62, 0.6],
  'bebe/dark-fear.png': [0.58, 0.5, 0.7],
  'bebe/dark-joy.png': [0.5, 0.55, 0.6],
  'bebe/dark-neutre.png': [0.54, 0.72, 0.75],
  'bebe/dark-sorrow.png': [0.66, 0.64, 0.6],
  'bebe/dark-wrath.png': [0.64, 0.62, 0.65],
  'bebe/disgust.png': [0.55, 0.62, 0.6],
  'bebe/fear.png': [0.55, 0.52, 0.6],
  'bebe/joy.png': [0.5, 0.58, 0.65],
  'bebe/neutre.png': [0.54, 0.62, 0.75],
  'bebe/sorrow.png': [0.65, 0.6, 0.6],
  'bebe/wrath.png': [0.58, 0.63, 0.65],
  // —— enfants
  'enfant/dark-disgust.png': [0.5, 0.45, 0.6],
  'enfant/dark-fear.png': [0.47, 0.33, 0.55],
  'enfant/dark-joy.png': [0.5, 0.25, 0.5],
  'enfant/dark-neutre.png': [0.55, 0.42, 0.6],
  'enfant/dark-sorrow.png': [0.53, 0.38, 0.65],
  'enfant/dark-wrath.png': [0.52, 0.5, 0.6],
  'enfant/disgust.png': [0.55, 0.46, 0.45],
  'enfant/fear.png': [0.56, 0.36, 0.55],
  'enfant/joy.png': [0.54, 0.23, 0.5],
  'enfant/neutre.png': [0.51, 0.39, 0.6],
  'enfant/sorrow.png': [0.53, 0.39, 0.6],
  'enfant/wrath.png': [0.55, 0.47, 0.6],
  // —— adolescents
  'adolescent/branch-d-df.png': [0.52, 0.2, 0.5],
  'adolescent/branch-d-ds.png': [0.68, 0.12, 0.3],
  'adolescent/branch-f-dj.png': [0.6, 0.32, 0.35],
  'adolescent/branch-f-dw.png': [0.5, 0.19, 0.6],
  'adolescent/branch-j-dd.png': [0.69, 0.19, 0.45],
  'adolescent/branch-j-ds.png': [0.75, 0.31, 0.22],
  'adolescent/branch-n-dn.png': [0.6, 0.31, 0.35],
  'adolescent/branch-s-df.png': [0.52, 0.24, 0.4],
  'adolescent/branch-s-dw.png': [0.6, 0.37, 0.45],
  'adolescent/branch-w-dd.png': [0.5, 0.5, 0.6],
  'adolescent/branch-w-dj.png': [0.72, 0.44, 0.35],
  'adolescent/dark-disgust.png': [0.5, 0.3, 0.45],
  'adolescent/dark-fear.png': [0.52, 0.22, 0.3],
  'adolescent/dark-joy-f.png': [0.57, 0.135, 0.33],
  'adolescent/dark-joy-m.png': [0.56, 0.135, 0.33],
  'adolescent/dark-neutre.png': [0.55, 0.3, 0.38],
  'adolescent/dark-sorrow.png': [0.47, 0.22, 0.35],
  'adolescent/dark-wrath.png': [0.48, 0.43, 0.5],
  'adolescent/disgust.png': [0.56, 0.36, 0.5],
  'adolescent/fear.png': [0.5, 0.27, 0.3],
  'adolescent/fragment-cognitif.png': [0.5, 0.15, 0.33],
  'adolescent/fragment-psychomoteur.png': [0.84, 0.66, 0.3],
  'adolescent/fragment-socio.png': [0.52, 0.2, 0.35],
  'adolescent/joy-f.png': [0.57, 0.12, 0.4],
  'adolescent/joy-m.png': [0.53, 0.12, 0.4],
  'adolescent/neutre.png': [0.55, 0.32, 0.38],
  'adolescent/sorrow.png': [0.48, 0.2, 0.35],
  'adolescent/wrath.png': [0.5, 0.42, 0.6],
  // —— adultes
  'adulte/branch-d-df.png': [0.55, 0.45, 0.6],
  'adulte/branch-d-ds.png': [0.75, 0.22, 0.3],
  'adulte/branch-f-dj.png': [0.6, 0.18, 0.22],
  'adulte/branch-f-dw.png': [0.48, 0.17, 0.35],
  'adulte/branch-j-dd.png': [0.63, 0.25, 0.35],
  'adulte/branch-j-ds.png': [0.75, 0.27, 0.22],
  'adulte/branch-n-dn.png': [0.62, 0.18, 0.25],
  'adulte/branch-s-df.png': [0.48, 0.17, 0.25],
  'adulte/branch-s-dw.png': [0.74, 0.4, 0.25],
  'adulte/branch-w-dd.png': [0.86, 0.54, 0.25],
  'adulte/branch-w-dj.png': [0.78, 0.43, 0.2],
  'adulte/dark-disgust.png': [0.57, 0.4, 0.5],
  'adulte/dark-fear.png': [0.62, 0.23, 0.3],
  'adulte/dark-joy-f.png': [0.55, 0.11, 0.3],
  'adulte/dark-joy-m.png': [0.53, 0.11, 0.3],
  'adulte/dark-neutre.png': [0.62, 0.29, 0.3],
  'adulte/dark-sorrow.png': [0.45, 0.17, 0.3],
  'adulte/dark-wrath.png': [0.57, 0.34, 0.3],
  'adulte/disgust.png': [0.6, 0.33, 0.5],
  'adulte/fear.png': [0.63, 0.22, 0.25],
  'adulte/joy-f.png': [0.6, 0.1, 0.32],
  'adulte/joy-m.png': [0.55, 0.1, 0.32],
  'adulte/melee-djw.png': [0.64, 0.33, 0.25],
  'adulte/melee-fsd.png': [0.68, 0.16, 0.22],
  'adulte/melee-jfd.png': [0.72, 0.34, 0.22],
  'adulte/melee-jfs.png': [0.72, 0.28, 0.35],
  'adulte/melee-jwf.png': [0.79, 0.29, 0.25],
  'adulte/melee-jws.png': [0.7, 0.24, 0.25],
  'adulte/melee-sdj.png': [0.7, 0.4, 0.4],
  'adulte/melee-wfd.png': [0.85, 0.76, 0.25],
  'adulte/melee-wfs.png': [0.77, 0.38, 0.22],
  'adulte/melee-wsd.png': [0.52, 0.14, 0.25],
  'adulte/memoire-d-terre.png': [0.68, 0.45, 0.3],
  'adulte/memoire-f-foudre.png': [0.62, 0.21, 0.3],
  'adulte/memoire-j-vent.png': [0.82, 0.3, 0.25],
  'adulte/memoire-n-ether.png': [0.6, 0.29, 0.3],
  'adulte/memoire-s-eau.png': [0.78, 0.25, 0.3],
  'adulte/memoire-w-feu.png': [0.74, 0.28, 0.22],
  'adulte/neutre.png': [0.58, 0.3, 0.35],
  'adulte/sorrow.png': [0.53, 0.16, 0.35],
  'adulte/wrath.png': [0.45, 0.32, 0.35],
};

/** Portraits du joueur, par chemin sous `joueur/` : [x, y, d]. */
const JOUEURS: Record<string, [number, number, number]> = {
  'garcon-1.png': [0.4, 0.4, 0.62],
  'garcon-2.png': [0.41, 0.4, 0.62],
  'fille-1.png': [0.38, 0.42, 0.62],
  'fille-2.png': [0.46, 0.42, 0.62],
  'nb-1.png': [0.37, 0.41, 0.62],
  'nb-2.png': [0.39, 0.41, 0.62],
  // en pied : la carte « vous » montre la tête et le haut du buste
  'garcon-1-corps.png': [0.5, 0.15, 0.95],
  'garcon-2-corps.png': [0.5, 0.15, 0.95],
  'fille-1-corps.png': [0.5, 0.15, 0.95],
  'fille-2-corps.png': [0.5, 0.15, 0.95],
  'nb-1-corps.png': [0.5, 0.15, 0.95],
  'nb-2-corps.png': [0.5, 0.15, 0.95],
  'joueur.png': [0.5, 0.4, 0.75],
  'joueuse.png': [0.5, 0.4, 0.75],
};

/** Cadrage de repli : le haut de la silhouette opaque, centré sur sa largeur. */
export function cadrageCalcule(l: number, h: number, boite?: Boite | null): Cadrage {
  const b = boite && boite.l && boite.h ? boite : { x: 0, y: 0, l, h };
  const diametre = Math.min(b.l, b.h) * 0.6;
  return { x: (b.x + b.l / 2) / l, y: (b.y + diametre * 0.55) / h, d: diametre / l };
}

function depuis(table: Record<string, [number, number, number]>, prefixe: string, chemin: string): Cadrage | null {
  const v = chemin.startsWith(prefixe) ? table[chemin.slice(prefixe.length)] : undefined;
  return v ? { x: v[0], y: v[1], d: v[2] } : null;
}

/** Cadrage du visage d'une image (écho ou portrait du joueur). */
export function cadrage(chemin: string, l: number, h: number, boite?: Boite | null): Cadrage {
  return depuis(ECHOS, 'echos/', chemin) ?? depuis(JOUEURS, 'joueur/', chemin) ?? cadrageCalcule(l, h, boite);
}

/** Les chemins cadrés à la main (tests, planches-contacts). */
export const CHEMINS_CADRES = [...Object.keys(ECHOS).map((c) => `echos/${c}`), ...Object.keys(JOUEURS).map((c) => `joueur/${c}`)];

/**
 * Style de l'image pour qu'un cadre de `largeur` × `hauteur` px montre le visage centré :
 * le diamètre du cadrage couvre la plus petite dimension du cadre.
 */
export function styleCadre(c: Cadrage, l: number, h: number, largeur: number, hauteur: number) {
  const k = Math.min(largeur, hauteur) / (c.d * l);
  return { position: 'absolute' as const, maxWidth: 'none', width: l * k, height: h * k, left: largeur / 2 - c.x * l * k, top: hauteur / 2 - c.y * h * k };
}

/** Proportions (hauteur / largeur) des portraits du joueur : carrés, sauf les anciens portraits de repli. */
const PROPORTIONS_JOUEUR: Record<string, number> = { 'joueur/joueur.png': 760 / 611, 'joueur/joueuse.png': 760 / 611 };

/**
 * Même cadrage, en pourcentages d'un cadre carré de taille quelconque (pastilles d'avatar) :
 * utile quand on ne connaît pas les dimensions de l'image, seulement ses proportions.
 */
export function styleCadreAvatar(chemin: string) {
  const ratio = PROPORTIONS_JOUEUR[chemin] ?? 1;
  const c = cadrage(chemin, 1000, 1000 * ratio);
  const largeur = 100 / c.d; // en % du cadre
  return { position: 'absolute' as const, maxWidth: 'none', width: `${largeur}%`, height: 'auto', left: `${50 - c.x * largeur}%`, top: `${50 - c.y * ratio * largeur}%` };
}
