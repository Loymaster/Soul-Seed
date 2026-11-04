// Lumière vivante du ranch : couleurs, ciel et poids des quatre illustrations selon l'heure (0–24, décimale).

const pad = (n: number) => (n < 10 ? '0' : '') + n;

interface Teinte {
  c: string; o: number; glow: number; vig: number; fly: number; ps: number; pb: number; ink: number; alert: number;
  skyTop: string; skyBot: string; hill: string; stars: number; eb: number; ea: number;
}
const N: Teinte = { c: '#24346e', o: .62, glow: 1, vig: .8, fly: 1, ps: .18, pb: .9, ink: 14, alert: 14, skyTop: '#141a3a', skyBot: '#33407a', hill: '#2e3a3a', stars: 1, eb: .82, ea: .7 };
const M: Teinte = { c: '#ffc996', o: .3, glow: .3, vig: .15, fly: 0, ps: 0, pb: 1, ink: 2, alert: 6, skyTop: '#f7c58e', skyBot: '#ffe9c4', hill: '#7a9a52', stars: 0, eb: 1, ea: .4 };
const J: Teinte = { c: '#ffffff', o: 0, glow: .1, vig: .05, fly: 0, ps: 0, pb: 1, ink: 0, alert: 5, skyTop: '#7fbde6', skyBot: '#cfe9f5', hill: '#86ad58', stars: 0, eb: 1, ea: .3 };
const S: Teinte = { c: '#ff7e45', o: .45, glow: .8, vig: .45, fly: .55, ps: .1, pb: .98, ink: 8, alert: 10, skyTop: '#7a5a8e', skyBot: '#f59a6a', hill: '#5c6a3e', stars: .4, eb: .95, ea: .6 };
const CLES: [number, Teinte][] = [[0, N], [5, N], [7, M], [10.5, J], [16.5, J], [19.3, S], [21.5, N], [24, N]];

export function lumiere(h: number) {
  let i = 0; while (i < CLES.length - 2 && h > CLES[i + 1][0]) i++;
  const [h0, A] = CLES[i], [h1, B] = CLES[i + 1];
  const t = Math.max(0, Math.min(1, (h - h0) / (h1 - h0 || 1)));
  const hx = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
  const mix = (a: string, b: string) => { const x = hx(a), y = hx(b); return '#' + x.map((v, k) => Math.round(v + (y[k] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const v = {} as Teinte;
  (Object.keys(A) as (keyof Teinte)[]).forEach((k) => {
    (v as unknown as Record<string, string | number>)[k] = typeof A[k] === 'string' ? mix(A[k] as string, B[k] as string) : (A[k] as number) + ((B[k] as number) - (A[k] as number)) * t;
  });
  const jour = h >= 6 && h < 20;
  const p = jour ? (h - 6) / 14 : (((h + 24 - 20) % 24) / 10);
  const th = Math.PI * (1 - p);
  const hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60) % 60;
  const f = (n: number) => n.toFixed(3);
  return {
    c: v.c, o: v.o, glow: v.glow, vig: v.vig, fly: v.fly,
    papier: `sepia(${f(v.ps)}) brightness(${f(v.pb)})`, encre: Math.round(v.ink),
    heure: pad(hh) + ':' + pad(mm),
    periode: h < 5 ? 'nuit' : h < 11 ? 'matinée' : h < 14 ? 'midi' : h < 18 ? 'après-midi' : h < 21.5 ? 'soirée' : 'nuit',
    cielHaut: v.skyTop, cielBas: v.skyBot, soleil: jour ? '#ffe08a' : '#eef1ff',
    sx: 66 + 44 * Math.cos(th), sy: 70 - 44 * Math.sin(th), colline: v.hill, etoiles: v.stars,
    echo: `brightness(${f(v.eb)}) drop-shadow(0 0 ${Math.round(6 + 12 * v.glow)}px rgba(255,190,110,${f(v.ea)}))`,
  };
}

/** Opacité de chaque illustration (posées dans l'ordre nuit, soir, matin, jour). */
export function couches(h: number) {
  const K: [number, 'nuit' | 'matin' | 'jour' | 'soir'][] = [[0, 'nuit'], [5, 'nuit'], [7.5, 'matin'], [11, 'jour'], [16.5, 'jour'], [19.3, 'soir'], [21.3, 'nuit'], [24, 'nuit']];
  let i = 0; while (i < K.length - 2 && h > K[i + 1][0]) i++;
  const [h0, a] = K[i], [h1, b] = K[i + 1];
  const t = Math.max(0, Math.min(1, (h - h0) / (h1 - h0 || 1)));
  const w = { matin: 0, jour: 0, soir: 0, nuit: 0 }; w[a] += 1 - t; w[b] += t;
  const jour = w.jour, matin = w.matin / Math.max(1e-6, 1 - jour), soir = w.soir / Math.max(1e-6, 1 - jour - w.matin);
  const c = (n: number) => Math.max(0, Math.min(1, n));
  return { jour: c(jour), matin: c(jour >= 1 ? 0 : matin), soir: c(jour + w.matin >= 1 ? 0 : soir) };
}

/** Calendrier caché du prototype : 4 saisons de 8 jours. */
export function saison(jour: number) {
  const s = ['Printemps', 'Été', 'Automne', 'Hiver'];
  return s[Math.floor(((jour - 1) % 32) / 8)];
}
