// Morphing de la silhouette blanche pendant l'évolution (Evolution.tsx) : l'ancienne forme se fond dans la nouvelle
// à chaque battement. Trois rendus, choisis par un mot (proposition : outils/evolution/proposition-morphing.html) :
//   — « fusion »    : interpolation des champs de distance des deux silhouettes (un vrai morphing de forme) ;
//   — « brume »     : fondu enchaîné troublé (turbulence et déplacement SVG, flou) ;
//   — « poussiere » : en une seule fois (6 s), fusion lente en fond et nuée de grains colorés qui la suit en s'agitant ;
//   — « battement » : l'alternance d'origine, sans morphing (aucun rendu ici).
// Chaque rendu dessine un avancement m (0 : ancienne forme, 1 : nouvelle) ; `avancement()` donne m au fil des battements.
// Repère : celui des images de la séquence (une forme mesure H × taille px, pieds au bas de son image).

import type { GrainSonore } from '@/moteur/bruitage-evolution';

export type Morphing = 'fusion' | 'brume' | 'poussiere' | 'battement';

export interface RenduMorphing {
  /** l'élément à poser à la place des deux images (même ancrage : pieds au bas, centré) */
  element: HTMLCanvasElement | SVGSVGElement;
  /** taille de l'élément dans le repère des images (px CSS, avant l'échelle de la loupe) */
  largeur: number;
  hauteur: number;
  dessiner: (m: number, t: number) => void;
  /** « poussiere » : les grains (couleurs et retard), pour le bruitage (moteur/bruitage-evolution.ts) */
  nuee?: GrainSonore[];
}

const lisse = (p: number) => p * p * (3 - 2 * p);
const borne = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** Avancement m au temps t (ms depuis le premier battement) : à chaque battement, la silhouette repart vers l'autre
 *  forme ; les battements se rapprochent, le dernier mène à la nouvelle forme. */
export function avancement(t: number, battements: readonly number[], fin: number): number {
  let v = 0;
  for (let k = 0; k < battements.length && battements[k] <= t; k++) {
    const suivant = battements[k + 1] ?? fin;
    const cible = k === battements.length - 1 ? 1 : k % 2 === 0 ? 1 : 0;
    const duree = Math.min(450, 0.85 * (suivant - battements[k]));
    v += (cible - v) * lisse(borne((Math.min(t, suivant) - battements[k]) / duree));
  }
  return v;
}

// —— géométrie commune
interface Geometrie { L: number; H: number; base: number; de: Boite; vers: Boite }
interface Boite { x: number; y: number; l: number; h: number }
/** marge autour des formes dans l'élément du rendu (px du repère) : les pieds sont à MARGE du bas. */
export const MARGE = 36;
function geometrie(de: HTMLImageElement, vers: HTMLImageElement, hDe: number, hVers: number): Geometrie {
  const lDe = hDe * de.naturalWidth / de.naturalHeight, lVers = hVers * vers.naturalWidth / vers.naturalHeight;
  const L = Math.ceil(Math.max(lDe, lVers) + 2 * MARGE), H = Math.ceil(Math.max(hDe, hVers) + 2 * MARGE), base = H - MARGE;
  return { L, H, base, de: { x: (L - lDe) / 2, y: base - hDe, l: lDe, h: hDe }, vers: { x: (L - lVers) / 2, y: base - hVers, l: lVers, h: hVers } };
}

function charger(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
}

/** Alpha d'une image posée dans un canevas l × h à l'échelle r. */
function masque(img: HTMLImageElement, b: Boite, l: number, h: number, r: number) {
  const c = document.createElement('canvas'); c.width = l; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, b.x * r, b.y * r, b.l * r, b.h * r);
  const d = g.getImageData(0, 0, l, h).data; const a = new Uint8Array(l * h);
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
  return a;
}

// —— champ de distance (Felzenszwalb et Huttenlocher)
const INF = 1e20;
function edt1d(f: Float64Array, n: number, v: Int32Array, z: Float64Array, d: Float64Array) {
  let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
/** Distance au carré au pixel marqué le plus proche. */
export function distances(marque: Uint8Array, l: number, h: number): Float64Array {
  const g = new Float64Array(l * h); for (let i = 0; i < g.length; i++) g[i] = marque[i] ? 0 : INF;
  const n = Math.max(l, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < l; x++) { for (let y = 0; y < h; y++) f[y] = g[y * l + x]; edt1d(f, h, v, z, d); for (let y = 0; y < h; y++) g[y * l + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < l; x++) f[x] = g[y * l + x]; edt1d(f, l, v, z, d); for (let x = 0; x < l; x++) g[y * l + x] = d[x]; }
  return g;
}
/** Champ signé d'un masque : négatif dedans, positif dehors (px). */
export function champSigne(alpha: Uint8Array, l: number, h: number): Float32Array {
  const dedans = new Uint8Array(alpha.length), dehors = new Uint8Array(alpha.length);
  for (let i = 0; i < alpha.length; i++) { dedans[i] = alpha[i] >= 128 ? 1 : 0; dehors[i] = 1 - dedans[i]; }
  const dOut = distances(dedans, l, h), dIn = distances(dehors, l, h);
  const s = new Float32Array(alpha.length);
  for (let i = 0; i < s.length; i++) s[i] = dedans[i] ? 0.5 - Math.sqrt(dIn[i]) : Math.sqrt(dOut[i]) - 0.5;
  return s;
}

// —— les rendus
function fusion(de: HTMLImageElement, vers: HTMLImageElement, G: Geometrie, echelle: number): RenduMorphing {
  // calcul à une résolution proche de l'affichage (la loupe agrandit), bornée pour rester rapide
  const r = borne(echelle * 0.75, 0.6, 1.4);
  const l = Math.round(G.L * r), h = Math.round(G.H * r);
  const A = champSigne(masque(de, G.de, l, h, r), l, h), B = champSigne(masque(vers, G.vers, l, h, r), l, h);
  const c = document.createElement('canvas'); c.width = l; c.height = h;
  const g = c.getContext('2d')!, img = g.createImageData(l, h), px = img.data;
  for (let i = 0; i < l * h; i++) { px[i * 4] = 255; px[i * 4 + 1] = 252; px[i * 4 + 2] = 240; }
  return {
    element: c, largeur: G.L, hauteur: G.H,
    dessiner: (m) => {
      // la lumière gonfle un peu et ses bords s'adoucissent à mi-chemin : elle « coule » d'une forme à l'autre
      const s = Math.sin(Math.PI * m), gonfle = 1.5 * r * s, doux = 0.8 + 0.9 * s, u = 1 - m;
      for (let i = 0; i < A.length; i++) {
        const d = u * A[i] + m * B[i] - gonfle;
        px[i * 4 + 3] = d <= -doux ? 255 : d >= doux ? 0 : 255 * (0.5 - d / (2 * doux));
      }
      g.putImageData(img, 0, 0);
    },
  };
}

let nFiltres = 0;
function brume(de: HTMLImageElement, vers: HTMLImageElement, G: Geometrie): RenduMorphing {
  const ns = 'http://www.w3.org/2000/svg', id = `evo-brume-${++nFiltres}`;
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${G.L} ${G.H}`);
  svg.innerHTML = `<defs><filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="7" result="bruit"/>
    <feDisplacementMap in="SourceGraphic" in2="bruit" scale="0" xChannelSelector="R" yChannelSelector="G" result="deplace"/>
    <feGaussianBlur in="deplace" stdDeviation="0" result="flou"/>
    <feComponentTransfer in="flou" result="plein"><feFuncA type="linear" slope="2.4"/></feComponentTransfer>
    <feColorMatrix in="plein" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/>
  </filter></defs><g filter="url(#${id})"><image/><image/></g>`;
  const [a, b] = Array.from(svg.querySelectorAll('image'));
  const poser = (el: SVGImageElement, img: HTMLImageElement, q: Boite) => { el.setAttribute('href', img.src); el.setAttribute('x', String(q.x)); el.setAttribute('y', String(q.y)); el.setAttribute('width', String(q.l)); el.setAttribute('height', String(q.h)); };
  poser(a, de, G.de); poser(b, vers, G.vers);
  const turb = svg.querySelector('feTurbulence')!, dep = svg.querySelector('feDisplacementMap')!, flou = svg.querySelector('feGaussianBlur')!;
  return {
    element: svg, largeur: G.L, hauteur: G.H,
    dessiner: (m, t) => {
      const s = Math.sin(Math.PI * m);
      a.setAttribute('opacity', (1 - lisse(m)).toFixed(3)); b.setAttribute('opacity', lisse(m).toFixed(3));
      dep.setAttribute('scale', (52 * Math.pow(s, 0.8)).toFixed(1));
      flou.setAttribute('stdDeviation', (3.2 * s).toFixed(2));
      turb.setAttribute('baseFrequency', `${(0.014 + 0.004 * Math.sin(t / 380)).toFixed(4)} ${(0.02 + 0.004 * Math.cos(t / 450)).toFixed(4)}`);
    },
  };
}

/**
 * « Poussière d'étoiles », en une seule fois (choisie par l'autrice, proposition : outils/evolution/proposition-morphing.html).
 * En fond, la fusion lente : la silhouette blanche se déforme d'une forme à l'autre (champs de distance), un peu voilée
 * quand la nuée est la plus dense. Devant, une nuée de grains de lumière : chacun est accroché à un point de l'ancienne
 * forme et à un point de la nouvelle (même hauteur relative), glisse de l'un à l'autre au rythme de la fusion et s'agite
 * vivement autour de sa place, dans tous les sens ; l'agitation culmine au milieu. Les grains ont d'abord la couleur de
 * l'ancienne forme (pixel sous eux, éclairci) et prennent peu à peu celle de la nouvelle.
 */
function poussiere(de: HTMLImageElement, vers: HTMLImageElement, G: Geometrie, echelle: number): RenduMorphing {
  const fond = fusion(de, vers, G, echelle);
  const r = 0.75, l = Math.round(G.L * r), h = Math.round(G.H * r);
  const mA = masque(de, G.de, l, h, r), mB = masque(vers, G.vers, l, h, r);
  const N = 1000, hMax = Math.max(G.de.h, G.vers.h);
  // la proposition est réglée pour une forme de 330 px : grains et agitation suivent la taille des formes
  const f = hMax / 330;
  const tirer = (a: Uint8Array) => {
    const pts: { x: number; y: number }[] = []; let essais = 0;
    while (pts.length < N && essais++ < N * 80) { const i = (Math.random() * a.length) | 0; if (a[i] > 140) pts.push({ x: (i % l) / r, y: ((i / l) | 0) / r }); }
    return pts.sort((u, v) => u.y - v.y);                     // de haut en bas : chaque grain garde à peu près sa hauteur
  };
  const pa = tirer(mA), pb = tirer(mB);
  // couleurs des deux formes, lues sous chaque point (éclaircies : ce sont des grains de lumière ; les traits sombres
  // — yeux, contours — sont relevés davantage pour ne pas donner de grains noirs)
  const pixels = (img: HTMLImageElement, q: Boite) => {
    const k = document.createElement('canvas'); k.width = G.L; k.height = G.H;
    const x = k.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, q.x, q.y, q.l, q.h);
    return x.getImageData(0, 0, G.L, G.H).data;
  };
  const pxA = pixels(de, G.de), pxB = pixels(vers, G.vers);
  const couleur = (px: Uint8ClampedArray, pt: { x: number; y: number }): [number, number, number] => {
    const xi = Math.round(borne(pt.x, 0, G.L - 1)), yi = Math.round(borne(pt.y, 0, G.H - 1)), i = (yi * G.L + xi) * 4;
    const lum = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2], e = lum < 90 ? 0.55 : 0.2;
    return [px[i] + (255 - px[i]) * e, px[i + 1] + (255 - px[i + 1]) * e, px[i + 2] + (255 - px[i + 2]) * e];
  };
  const freq = () => 3.5 + Math.random() * 5.5, phase = () => Math.random() * 6.28;
  const grains = pa.map((q, i) => {
    const b = pb[Math.floor((pa.length > 1 ? i / (pa.length - 1) : 0.5) * (pb.length - 1))] ?? q;
    return {
      a: q, b,
      ampl: (18 + Math.random() * 26 + (Math.random() < 0.15 ? 34 : 0)) * f,   // quelques grains s'écartent davantage
      fx1: freq(), fx2: freq() * 1.7, fy1: freq(), fy2: freq() * 1.6, px1: phase(), px2: phase(), py1: phase(), py2: phase(),
      souffle: phase(), r: (0.7 + Math.random() * 1.5) * f, retard: Math.random() * 0.18,
      cA: couleur(pxA, q), cB: couleur(pxB, b),
    };
  });
  const c = document.createElement('canvas'); const k = borne(echelle, 1, 2);
  c.width = Math.round(G.L * k); c.height = Math.round(G.H * k);
  const g = c.getContext('2d')!; g.scale(k, k);
  const TOUR = 6.2832;
  return {
    element: c, largeur: G.L, hauteur: G.H, nuee: grains,
    dessiner: (m, t) => {
      g.clearRect(0, 0, G.L, G.H);
      g.globalCompositeOperation = 'source-over';
      // la silhouette de fond s'efface à moitié quand la nuée est la plus dense, puis revient pleine pour la fin
      fond.dessiner(m, t);
      g.globalAlpha = 1 - 0.5 * Math.sin(Math.PI * borne((m - 0.1) / 0.8));
      g.drawImage(fond.element as HTMLCanvasElement, 0, 0, G.L, G.H);
      const vis = m <= 0 || m >= 1 ? 0 : Math.min(1, 7 * Math.min(m, 1 - m));
      if (vis > 0.01) {
        const s = (t || 0) / 1000;
        const agite = Math.sin(Math.PI * borne((m - 0.06) / 0.88));
        for (const q of grains) {
          const av = lisse(borne((m - q.retard * (1 - m)) / (1 - q.retard * 0.6)));
          const bx = q.a.x + (q.b.x - q.a.x) * av, by = q.a.y + (q.b.y - q.a.y) * av, A = q.ampl * agite;
          const pos = (sec: number): [number, number] => [
            bx + A * (Math.sin(sec * q.fx1 + q.px1) + 0.5 * Math.sin(sec * q.fx2 + q.px2)) / 1.5,
            by + A * (Math.cos(sec * q.fy1 + q.py1) + 0.5 * Math.sin(sec * q.fy2 + q.py2)) / 1.5,
          ];
          const [x, y] = pos(s);
          const rr = q.r * 1.9, alpha = vis * 0.95 * (0.7 + 0.3 * Math.sin(s * 6 + q.souffle * 2));
          g.fillStyle = `rgb(${Math.round(q.cA[0] + (q.cB[0] - q.cA[0]) * av)},${Math.round(q.cA[1] + (q.cB[1] - q.cA[1]) * av)},${Math.round(q.cA[2] + (q.cB[2] - q.cA[2]) * av)})`;
          g.globalAlpha = alpha; g.beginPath(); g.arc(x, y, rr, 0, TOUR); g.fill();
          g.globalAlpha = alpha * 0.25; g.beginPath(); g.arc(x, y, rr * 1.9, 0, TOUR); g.fill();
          if (agite > 0.1) {                                     // traînée : la position une fraction de seconde plus tôt
            const [x2, y2] = pos(s - 0.045);
            g.globalAlpha = alpha * agite * 0.35; g.beginPath(); g.arc(x2, y2, rr * 0.8, 0, TOUR); g.fill();
          }
        }
      }
      g.globalAlpha = 1;
    },
  };
}

/**
 * Prépare le rendu (chargement des deux images, calculs) ; null pour « battement » ou en cas d'échec
 * (la séquence garde alors l'alternance d'origine).
 * @param hDe, hVers hauteur affichée de chaque image (px du repère, avant la loupe)
 * @param echelle    grossissement de la loupe (résolution du calcul)
 */
export async function preparerMorphing(mode: Morphing, srcDe: string, srcVers: string, hDe: number, hVers: number, echelle: number): Promise<RenduMorphing | null> {
  if (mode === 'battement') return null;
  try {
    const [de, vers] = await Promise.all([charger(srcDe), charger(srcVers)]);
    const G = geometrie(de, vers, hDe, hVers);
    if (mode === 'brume') return brume(de, vers, G);
    if (mode === 'poussiere') return poussiere(de, vers, G, echelle);
    return fusion(de, vers, G, echelle);
  } catch {
    return null;
  }
}

/** « poussiere » se joue en une seule fois (sans battements) : avancement continu, doux au début et à la fin. */
export const UNE_SEULE_FOIS: readonly Morphing[] = ['poussiere'];
export const avancementContinu = (t: number, fin: number) => { const x = borne(t / fin); return x < 0.5 ? 2 * x * x * (1.5 - x) : 1 - 2 * (1 - x) * (1 - x) * (0.5 + x); };
