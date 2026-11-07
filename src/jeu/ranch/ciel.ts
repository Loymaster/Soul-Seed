// Lumière et ciel du ranch selon l'heure (0–24, décimale), repris de la maquette v7 :
// une seule illustration de jour, que des matrices de couleur assombrissent, bleuissent ou réchauffent ;
// un ciel simulé (dégradé, étoiles, soleil et lune sur leur arc, nuages qui s'effacent la nuit).

const pad = (n: number) => (n < 10 ? '0' : '') + n;

interface Cle { ft: number; b: number; sat: number; sep: number; c: string; o: number; glow: number; vig: number; fly: number; ps: number; pb: number; ink: number; alert: number; eb: number; ea: number }
const N: Cle = { ft: 0, b: .4, sat: .55, sep: 0, c: '#24346e', o: .62, glow: 1, vig: .8, fly: 1, ps: .18, pb: .9, ink: 14, alert: 14, eb: .82, ea: .38 };
const M: Cle = { ft: .85, b: 1.02, sat: .95, sep: .15, c: '#ffc996', o: .3, glow: .3, vig: .15, fly: 0, ps: 0, pb: 1, ink: 2, alert: 6, eb: 1, ea: .4 };
const J: Cle = { ft: 1, b: 1, sat: 1, sep: 0, c: '#ffffff', o: 0, glow: .1, vig: .05, fly: 0, ps: 0, pb: 1, ink: 0, alert: 5, eb: 1, ea: .3 };
const S: Cle = { ft: .45, b: .8, sat: 1.25, sep: .25, c: '#ff7e45', o: .45, glow: .8, vig: .45, fly: .55, ps: .1, pb: .98, ink: 8, alert: 10, eb: .95, ea: .6 };
const CLES: [number, Cle][] = [[0, N], [5, N], [7, M], [10.5, J], [16.5, J], [19.3, S], [21.5, N], [24, N]];

const hx = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
const melange = (a: string, b: string, t: number) => { const x = hx(a), y = hx(b); return '#' + x.map((v, k) => Math.round(v + (y[k] - v) * t).toString(16).padStart(2, '0')).join(''); };

/** Calque « multiplier » traduit en matrice ; l'interface et l'écho en reçoivent une part, plus forte sur le rouge : la nuit les bleuit. */
function matrices(v: Cle) {
  const k = hx(v.c).map((c) => v.b * (1 - v.o + v.o * (c / 255)));
  const part = (parts: number[]) => k.map((x, i) => 1 - parts[i] * (1 - Math.min(1, x)));
  const mat = (d: number[]) => `${d[0].toFixed(3)} 0 0 0 0  0 ${d[1].toFixed(3)} 0 0 0  0 0 ${d[2].toFixed(3)} 0 0  0 0 0 1 0`;
  return { matDecor: mat(k), matUi: mat(part([.42, .36, .2])), matEcho: mat(part([.58, .52, .34])), decor: `saturate(${v.sat.toFixed(3)}) url(#rk7Decor)` };
}

export function lumiere(h: number) {
  let i = 0; while (i < CLES.length - 2 && h > CLES[i + 1][0]) i++;
  const [h0, A] = CLES[i], [h1, B] = CLES[i + 1];
  const t = Math.max(0, Math.min(1, (h - h0) / (h1 - h0 || 1)));
  const v = {} as Cle;
  (Object.keys(A) as (keyof Cle)[]).forEach((k) => {
    const a = A[k], b = B[k];
    (v as unknown as Record<string, unknown>)[k] = typeof a === 'string' ? melange(a, b as string, t) : (a as number) + ((b as number) - (a as number)) * t;
  });
  const hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60) % 60;
  const periode = h < 5 ? 'nuit' : h < 11 ? 'matinée' : h < 14 ? 'midi' : h < 18 ? 'après-midi' : h < 21.5 ? 'soirée' : 'nuit';
  const f = (n: number) => n.toFixed(3);
  return {
    bg: `brightness(${f(v.b)}) saturate(${f(v.sat)}) sepia(${f(v.sep)})`, c: v.c, o: v.o, glow: v.glow, vig: v.vig, fly: v.fly,
    ink: Math.round(v.ink), alert: Math.round(v.alert), heure: pad(hh) + ':' + pad(mm), periode,
    echo: `url(#rk7Echo) drop-shadow(0 0 ${Math.round(6 + 12 * v.glow)}px rgba(255,190,110,${f(v.ea)}))`,
    ft: v.ft, ...matrices(v),
  };
}

/** Couleurs du ciel (haut, milieu, horizon), étoiles, soleil et lune sur leur arc, présence des nuages. */
export function ciel(h: number) {
  const K: [number, string, string, string, number, number][] = [
    [0, '#070b24', '#101a44', '#1c2a5e', 1, 0],
    [4.6, '#0a0f2c', '#18224f', '#2a3466', 1, 0],
    [5.9, '#2a2f66', '#7a5f8e', '#f0a27a', .45, .35],
    [7.2, '#5d93cf', '#a9c6e0', '#ffd9b0', .02, .9],
    [9.5, '#4f97dd', '#8cc3ec', '#d4ebf7', 0, 1],
    [16.5, '#4a93da', '#86bfe9', '#d0e8f5', 0, 1],
    [18.4, '#5a78b8', '#c497a8', '#ffbf86', 0, .95],
    [19.7, '#3a3672', '#9a5a7a', '#f07c52', .22, .7],
    [20.9, '#141a46', '#2c2e66', '#5a3e6a', .8, .18],
    [22.2, '#070b24', '#101a44', '#1c2a5e', 1, 0],
    [24, '#070b24', '#101a44', '#1c2a5e', 1, 0]];
  let i = 0; while (i < K.length - 2 && h > K[i + 1][0]) i++;
  const A = K[i], B = K[i + 1];
  const t = Math.max(0, Math.min(1, (h - A[0]) / (B[0] - A[0])));
  const lin = (a: number, b: number) => a + (b - a) * t;
  // soleil de 6 h à 20 h, lune de 19 h 30 à 6 h 30, sur un arc au-dessus des arbres
  const arc = (p: number) => ({ x: Math.round(90 + 1100 * p), y: Math.round(360 - 290 * Math.sin(Math.PI * p)) });
  const ps = (h - 6) / 14, pl = ((h + 24 - 19.5) % 24) / 11;
  const so = arc(Math.max(0, Math.min(1, ps))), lu = arc(Math.max(0, Math.min(1, pl)));
  const bordure = (p: number) => Math.max(0, Math.min(1, Math.min(p, 1 - p) * 12));
  const nuages = lin(A[5], B[5]);
  return {
    cielHaut: melange(A[1], B[1], t), cielMilieu: melange(A[2], B[2], t), cielBas: melange(A[3], B[3], t), cielEtoiles: lin(A[4], B[4]).toFixed(3),
    soleilX: so.x, soleilY: so.y, soleilOp: (ps > 0 && ps < 1 ? bordure(ps) : 0).toFixed(3),
    luneX: lu.x, luneY: lu.y, luneOp: (pl > 0 && pl < 1 ? bordure(pl) : 0).toFixed(3),
    nuagesPres: nuages.toFixed(3),
  };
}

/** Lanternes : elles s'allument dès le soir (17 h 30 → 21 h) et s'éteignent à l'aube (5 h → 6 h 30). */
export function lanternes(h: number) {
  const l = h >= 17.5 ? Math.min(1, (h - 17.5) / 3.5) : h < 5 ? 1 : h < 6.5 ? 1 - (h - 5) / 1.5 : 0;
  return l.toFixed(3);
}
