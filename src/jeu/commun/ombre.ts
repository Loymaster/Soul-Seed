// L'ombre portée d'un écho, calculée depuis la silhouette réelle de son image (et non plus une ellipse fixe).
// On mesure une fois par image, dans un petit canevas, où l'image touche le sol : le bas de la silhouette opaque
// (le vide transparent sous les pieds compte), le centre et la largeur de ce qui pose au sol (pieds, pattes, queue),
// et, pour les échos en l'air, la largeur du corps. L'ombre est ensuite posée sous les pieds, au sol, même quand
// l'écho vole, flotte ou saute : elle rétrécit et pâlit avec la hauteur.
// Sans mesure encore (image pas chargée, tests), un repli se tire de la boîte utile du catalogue.
// Réutilisable ailleurs (combat, exploration) : `piedsDe` + `ombreSous`, dans le repère de l'image affichée.
import type { Boite } from '@/contenu/types';

/** Où une image touche le sol, en fractions de sa taille (0–1). */
export interface Pieds {
  /** dimensions de l'image (px) */
  W: number;
  H: number;
  /** bas de la silhouette opaque (fraction de H depuis le haut) */
  bas: number;
  /** centre et largeur de ce qui touche le sol (fractions de W) */
  cx: number;
  l: number;
  /** centre et largeur du corps entier (fractions de W) : l'ombre d'un écho en l'air */
  cxCorps: number;
  lCorps: number;
  /** vrai : mesuré sur les pixels ; faux : repli d'après la boîte utile */
  mesure: boolean;
}

/** Bande du bas de la silhouette considérée comme « au sol » (fraction de sa hauteur opaque). */
export const BANDE_SOL = 0.07;
/** Seuil d'opacité d'un pixel (0–255). */
const SEUIL_ALPHA = 110;

/** Repli sans mesure : la boîte utile du catalogue (ou l'image entière). */
export function piedsRepli(W: number, H: number, boite?: Boite | null): Pieds {
  const b = boite ?? { x: 0, y: 0, l: W, h: H };
  const cx = (b.x + b.l / 2) / W;
  return { W, H, bas: (b.y + b.h) / H, cx, l: (b.l / W) * 0.55, cxCorps: cx, lCorps: b.l / W, mesure: false };
}

/** Quantiles d'une liste de colonnes pondérées (bornes de ce qui est vraiment opaque, sans quelques pixels isolés). */
function etendue(poids: number[], basQ: number, hautQ: number): [number, number] {
  const total = poids.reduce((a, b) => a + b, 0);
  if (!total) return [0, poids.length];
  let acc = 0, a = 0, b = poids.length - 1;
  for (let i = 0; i < poids.length; i++) { acc += poids[i]; if (acc >= total * basQ) { a = i; break; } }
  acc = 0;
  for (let i = poids.length - 1; i >= 0; i--) { acc += poids[i]; if (acc >= total * hautQ) { b = i; break; } }
  return [a, b + 1];
}

/**
 * Mesure sur une carte d'opacité (largeur `l`, hauteur `h`, une valeur 0–255 par pixel, ligne par ligne).
 * Sans dépendance au navigateur : c'est ce que teste `tests/ombre.test.ts`.
 */
export function mesurerAlpha(alpha: ArrayLike<number>, l: number, h: number, W = l, H = h): Pieds {
  let haut = -1, bas = -1;
  for (let y = 0; y < h && haut < 0; y++) for (let x = 0; x < l; x++) if (alpha[y * l + x] >= SEUIL_ALPHA) { haut = y; break; }
  for (let y = h - 1; y >= 0 && bas < 0; y--) for (let x = 0; x < l; x++) if (alpha[y * l + x] >= SEUIL_ALPHA) { bas = y; break; }
  if (haut < 0) return piedsRepli(W, H, null);
  const bande = Math.max(1, Math.round((bas - haut + 1) * BANDE_SOL));
  const sol = new Array<number>(l).fill(0), corps = new Array<number>(l).fill(0);
  for (let y = haut; y <= bas; y++) for (let x = 0; x < l; x++) {
    if (alpha[y * l + x] < SEUIL_ALPHA) continue;
    corps[x]++;
    if (y > bas - bande) sol[x]++;
  }
  const [s0, s1] = etendue(sol, 0.02, 0.02);
  const [c0, c1] = etendue(corps, 0.08, 0.08);
  return { W, H, bas: (bas + 1) / h, cx: (s0 + s1) / 2 / l, l: (s1 - s0) / l, cxCorps: (c0 + c1) / 2 / l, lCorps: (c1 - c0) / l, mesure: true };
}

const memoire = new Map<string, Pieds>();
const enCours = new Map<string, Promise<Pieds | null>>();

/** Mesure (une fois) l'image à l'adresse `url` dans un petit canevas. */
export function mesurerImage(url: string): Promise<Pieds | null> {
  const deja = memoire.get(url);
  if (deja) return Promise.resolve(deja);
  const p = enCours.get(url);
  if (p) return p;
  const promesse = new Promise<Pieds | null>((resoudre) => {
    if (typeof document === 'undefined') { resoudre(null); return; }
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const W = img.naturalWidth, H = img.naturalHeight;
        const k = Math.min(1, 240 / Math.max(W, H));
        const l = Math.max(1, Math.round(W * k)), h = Math.max(1, Math.round(H * k));
        const c = document.createElement('canvas'); c.width = l; c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) { resoudre(null); return; }
        ctx.drawImage(img, 0, 0, l, h);
        const d = ctx.getImageData(0, 0, l, h).data;
        const a = new Uint8ClampedArray(l * h);
        for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
        const r = mesurerAlpha(a, l, h, W, H);
        memoire.set(url, r);
        resoudre(r);
      } catch { resoudre(null); }
    };
    img.onerror = () => resoudre(null);
    img.src = url;
  });
  enCours.set(url, promesse);
  void promesse.finally(() => enCours.delete(url));
  return promesse;
}

/**
 * Les pieds d'une image : la mesure si elle est faite, sinon le repli (boîte utile) — et la mesure est lancée ;
 * `apresMesure` est appelé quand elle arrive (pour redessiner).
 */
export function piedsDe(url: string, repli: { W: number; H: number; boite?: Boite | null }, apresMesure?: () => void): Pieds {
  const m = memoire.get(url);
  if (m) return m;
  void mesurerImage(url).then((r) => { if (r) apresMesure?.(); });
  return piedsRepli(repli.W, repli.H, repli.boite);
}

/** L'ombre à dessiner, dans le cadre de l'écho (px) : bord gauche, hauteur de son centre au-dessus du bas du cadre, taille, opacité. */
export interface Ombre { x: number; b: number; l: number; h: number; o: number }

export interface PoseOmbre {
  /** hauteur de l'image affichée avant mise à l'échelle (px), et facteur de taille appliqué (stade × individu) */
  hImage: number;
  echelle: number;
  /** élévation au-dessus du sol (px, même repère) : vol, flottement */
  hauteur?: number;
  /** l'image est retournée (regarde à gauche) */
  gauche?: boolean;
  /** bord gauche de la boîte de l'image et bas de l'image au-dessus du bas du cadre (px), avant mise à l'échelle */
  gaucheImage?: number;
  basImage?: number;
  /** en l'air : l'ombre suit le corps entier plutôt que ce qui pend sous lui */
  enLAir?: boolean;
}

/** Atténuation de l'ombre selon la hauteur (1 au sol). */
export const attenuation = (hauteur: number, echelle = 1) => 1 / (1 + Math.max(0, hauteur) / (110 * Math.max(0.5, echelle)));

/**
 * L'ombre sous les pieds : centrée sous ce qui touche le sol, aussi large que les appuis (un peu plus, l'ombre déborde),
 * aplatie par la perspective ; en l'air, sous le corps, plus petite et plus pâle à mesure qu'il s'élève.
 */
export function ombreSous(p: Pieds, o: PoseOmbre): Ombre {
  const k = o.hImage / p.H; // px affichés par pixel d'image, avant l'échelle
  const lImg = p.W * k;
  const g = o.gaucheImage ?? 0, b0 = o.basImage ?? 0;
  const cx = o.enLAir ? p.cxCorps : p.cx;
  const larg = o.enLAir ? p.lCorps * 0.62 : p.l;
  // l'image est mise à l'échelle depuis le milieu de son bas (transform-origin 50 % 100 %) ; retournée, elle se lit en miroir
  const dx = (cx - 0.5) * lImg * o.echelle * (o.gauche ? -1 : 1);
  const centre = g + lImg / 2 + dx;
  const sol = b0 + (1 - p.bas) * o.hImage * o.echelle;
  const a = o.enLAir ? attenuation(o.hauteur ?? 0, o.echelle) : 1;
  const l = Math.max(14 * o.echelle, larg * lImg * o.echelle * 1.12 + 8 * o.echelle) * (0.55 + 0.45 * a);
  const h = Math.max(5, Math.min(l * 0.24, 22 * o.echelle + 4));
  return { x: Math.round(centre - l / 2), b: Math.round(sol - h / 2), l: Math.round(l), h: Math.round(h), o: +(0.4 + 0.6 * a).toFixed(2) };
}
