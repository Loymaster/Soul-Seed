// Bruitage de l'évolution « Poussière d'étoiles » : l'« Accord des pigments » (choisi par l'autrice ;
// proposition : outils/evolution/proposition-morphing.html, ambiance 5).
// La couleur des grains donne les notes : teinte → note sur le cercle des quintes (rouge do, jaune sol, vert ré,
// bleu la, violet mi en majeur), clarté → octave, saturation → poids. Chaque forme a son accord (ses couleurs
// dominantes) ; les voix glissent une à une de l'accord de l'ancienne forme vers celui de la nouvelle.
//   — l'orchestre grandit avec le stade atteint : vers l'enfant, deux voix et deux cloches ; vers l'adolescent, trois
//     voix, une basse, un carillon ; vers l'adulte, quatre voix, cordes, chœur, harpe, roulement et timbale ;
//   — la lignée donne la couleur harmonique : majeur (lignées principales), mineur (formes sombres, fragments),
//     élargi/lydien (mêlées, branches, souvenirs, une voix de plus), trouble/dorien (branches vers le sombre).
// Sur le contexte, le volume et la réverbe claire de SFX. Aucune logique de jeu ici.
import { SFX } from './sfx';

/** Ce que le morphing donne au son : pour chaque grain, ses deux couleurs et son retard. */
export interface GrainSonore { cA: readonly number[]; cB: readonly number[]; retard: number }

type Mode = 'majeur' | 'mineur' | 'elargi' | 'trouble';
const MODES: Record<Mode, readonly number[]> = {
  majeur: [0, 7, 2, 9, 4],
  mineur: [0, 7, 5, 10, 3],
  elargi: [0, 7, 2, 11, 6],
  trouble: [0, 7, 2, 9, 3],
};
const lisse = (p: number) => p * p * (3 - 2 * p);
const borne = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const hz = (base: number, demi: number) => base * Math.pow(2, demi / 12);
/** l'avancement de la transformation (même courbe que morphing.avancementContinu) */
const avancement = (x: number) => { x = borne(x); return x < 0.5 ? 2 * x * x * (1.5 - x) : 1 - 2 * (1 - x) * (1 - x) * (0.5 + x); };

const nomImage = (src: string) => (src.split('/').pop() ?? '').replace(/\.[a-z0-9]+$/i, '');
/** La couleur harmonique d'une forme, lue dans le nom de son image (conventions des assets). */
export function modeForme(src: string): Mode {
  const f = nomImage(src);
  if (/^branch-.*-d[a-z]$/.test(f)) return 'trouble';
  if (/^(melee|branch|memoire)-/.test(f)) return 'elargi';
  if (/^(dark-|fragment-)/.test(f)) return 'mineur';
  return 'majeur';
}
/** Le foisonnement selon le stade atteint : 1 vers l'enfant (ou avant), 2 vers l'adolescent, 3 vers l'adulte. */
export const niveauForme = (src: string) => (/\/adulte\//.test(src) ? 3 : /\/adolescent\//.test(src) ? 2 : 1);

interface Pigment { secteur: number; demi: number; S: number; terne: boolean }
export function pigment([R8, G8, B8]: readonly number[], mode: Mode = 'majeur'): Pigment {
  const r = R8 / 255, g = G8 / 255, b = B8 / 255, max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, L = (max + min) / 2;
  const S = d === 0 ? 0 : d / (1 - Math.abs(2 * L - 1));
  let H = 0; if (d) { H = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; H = (H * 60 + 360) % 360; }
  const secteur = S < 0.12 ? 0 : Math.round(H / 72) % 5;
  const octave = L < 0.62 ? 0 : L < 0.8 ? 1 : 2;                // les grains sont éclaircis : clarté d'environ 0,55 à 1
  return { secteur, demi: MODES[mode][secteur] + 12 * octave, S, terne: S < 0.12 };
}
/** L'accord d'une forme : ses notes les plus présentes (pondérées par la saturation), une par teinte, graves d'abord. */
export function accord(grains: readonly GrainSonore[], cote: 'a' | 'b', n: number, mode: Mode): Pigment[] {
  const poids = new Map<number, { p: Pigment; w: number }>();
  for (const q of grains) { const p = pigment(cote === 'a' ? q.cA : q.cB, mode); const e = poids.get(p.demi) ?? { p, w: 0 }; e.w += 0.25 + p.S; poids.set(p.demi, e); }
  const tri = [...poids.values()].sort((u, v) => v.w - u.w).map((e) => e.p), r: Pigment[] = [];
  const prendre = (ok: (p: Pigment) => boolean) => { for (const p of tri) { if (r.length === n) return; if (!r.includes(p) && ok(p)) r.push(p); } };
  prendre((p) => !p.terne && !r.some((x) => x.secteur === p.secteur));
  prendre((p) => !r.some((x) => x.secteur === p.secteur));
  prendre((p) => !r.some((x) => x.demi === p.demi));
  for (let i = 0; r.length && r.length < n && i < 12; i++) { const p = r[i % r.length]; let d = p.demi; while (r.some((x) => x.demi === d)) d += 12; r.push({ ...p, demi: d }); }
  if (!r.length) r.push({ secteur: 0, demi: 12, S: 0, terne: true });
  return r.sort((u, v) => u.demi - v.demi);
}

interface Moteur { get(): AudioContext | null; master?: GainNode; bright?: AudioNode }
let bruit: AudioBuffer | null = null;

export interface Bruitage { arreter: () => void }

/**
 * Programme tout le bruitage d'un coup.
 * @param blanc    dans combien de secondes la silhouette blanchit (l'accord de l'ancienne forme se lève)
 * @param debut    dans combien de secondes commence la transformation
 * @param duree    durée de la transformation (s) ; l'éclat sonne à debut + duree
 */
export function jouerBruitageEvolution(grains: readonly GrainSonore[], srcDe: string, srcVers: string, blanc: number, debut: number, duree: number): Bruitage | null {
  const M = SFX as unknown as Moteur;
  const ctx = M.get(); if (!ctx || !M.master || !grains.length) return null;
  // les bruitages du jeu passent par un maître à 0,6 × réglage (0,8 par défaut) : on retrouve le niveau de la proposition
  const sortie = ctx.createGain(); sortie.gain.value = 1.6; sortie.connect(M.master);
  const sec = ctx.createGain(); sec.connect(sortie);
  const mouille = ctx.createGain(); mouille.gain.value = 1.2; mouille.connect(M.bright ?? sortie);
  // la réverbe claire est commune : on n'y envoie que par une porte qu'on referme si l'on passe la séquence
  const t = ctx.currentTime + 0.03, t0 = t + blanc, t1 = t + debut, fin = t1 + duree;
  if (!bruit) { const n = ctx.sampleRate * 2; bruit = ctx.createBuffer(1, n, ctx.sampleRate); const d = bruit.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; }

  const voie = (envoi = 0.5) => { const g = ctx.createGain(); g.connect(sec); const e = ctx.createGain(); e.gain.value = envoi; g.connect(e); e.connect(mouille); return g; };
  const env = (g: GainNode, x: number, a: number, v: number, tenue: number, rel: number) => { g.gain.setValueAtTime(0.0001, x); g.gain.exponentialRampToValueAtTime(v, x + a); if (tenue) g.gain.setValueAtTime(v, x + a + tenue); g.gain.exponentialRampToValueAtTime(0.0001, x + a + tenue + rel); };
  const osc = (type: OscillatorType, f: number, x: number, fin_: number, vers: AudioNode) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, x); o.connect(vers); o.start(x); o.stop(fin_); return o; };
  const ping = (f: number, x: number, v: number, dur: number, envoi = 0.7, pan = 0) => {     // clochette de verre
    const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(voie(envoi));
    for (const [k, a] of [[1, 1], [2.76, 0.35], [5.4, 0.12]]) { const g = ctx.createGain(); g.connect(p); env(g, x, 0.003, v * a, 0, dur / k); osc('sine', f * k, x, x + dur + 0.05, g); }
  };
  const lame = (f: number, x: number, v: number, dur = 0.9, pan = 0) => {                   // corde pincée claire
    const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(voie(0.45));
    for (const [k, a] of [[1, 1], [2, 0.3], [5.43, 0.08]]) { const g = ctx.createGain(); g.connect(p); env(g, x, 0.002, v * a, 0, dur / Math.sqrt(k)); osc('sine', f * k, x, x + dur + 0.05, g); }
  };
  const souffle = (x: number, dur: number, f0: number, f1: number, v: number, q = 1.2, envoi = 0.4) => {
    const src = ctx.createBufferSource(); src.buffer = bruit; src.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = q; fl.frequency.setValueAtTime(f0, x); fl.frequency.exponentialRampToValueAtTime(f1, x + dur);
    const g = ctx.createGain(); env(g, x, dur * 0.45, v, 0, dur * 0.55);
    src.connect(fl); fl.connect(g); g.connect(voie(envoi)); src.start(x, Math.random()); src.stop(x + dur + 0.1);
  };
  const choeur = (x: number, dur: number, notes: number[], v: number) => {                    // voyelles « o » → « a »
    const somme = ctx.createGain(), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, x); g.gain.exponentialRampToValueAtTime(v, x + dur * 0.5); g.gain.setValueAtTime(v, x + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, x + dur);
    for (const [fa, fa2, q, a] of [[460, 760, 9, 1], [820, 1220, 12, 0.6]]) { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = q; b.frequency.setValueAtTime(fa, x); b.frequency.linearRampToValueAtTime(fa2, x + dur); const ga = ctx.createGain(); ga.gain.value = a; somme.connect(b); b.connect(ga); ga.connect(g); }
    g.connect(voie(0.8));
    for (const f of notes) for (const d of [-9, 0, 8]) {
      const o = osc('sawtooth', f, x, x + dur + 0.1, somme); o.detune.value = d;
      const vib = ctx.createOscillator(); vib.frequency.value = 5 + Math.random(); const vg = ctx.createGain(); vg.gain.value = f * 0.004; vib.connect(vg); vg.connect(o.frequency); vib.start(x); vib.stop(x + dur + 0.1);
    }
  };
  const agitation = (u: number) => Math.sin(Math.PI * borne((avancement(u) - 0.06) / 0.88));
  const grele = (x0: number, dur: number, max: number, f: (x: number, u: number, a: number) => void) => {
    let x = 0; while (x < dur) { const a = agitation(x / duree); x += (1 / Math.max(2, max * a + 2)) * (0.5 + Math.random()); if (x < dur) f(x0 + x, x / duree, a); }
  };
  const modeDe = modeForme(srcDe), modeVers = modeForme(srcVers), niv = niveauForme(srcVers);
  const riche = [modeDe, modeVers].some((m) => m === 'elargi' || m === 'trouble');
  const n = [2, 3, 4][niv - 1] + (riche ? 1 : 0);
  const A = accord(grains, 'a', n, modeDe), B = accord(grains, 'b', n, modeVers);
  const quand = (i: number) => t1 + duree * (0.22 + 0.5 * i / Math.max(1, n - 1));
  /** la note d'un grain au moment u (0–1) de la transformation, dans la couleur de la forme qu'il rejoint */
  const noteGrain = (q: GrainSonore, u: number) => {
    const m = avancement(u), av = lisse(borne((m - q.retard * (1 - m)) / (1 - q.retard * 0.6)));
    return pigment(q.cA.map((v, j) => v + (q.cB[j] - v) * av), av < 0.5 ? modeDe : modeVers);
  };

  // une nappe dont les voix glissent de A vers B, chacune à son tour
  const nappe = (decale: number, types: [OscillatorType, number, number][], vol: number, lp0: number, lpMax: number, envoi = 0.7) => {
    const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 1.5;
    fl.frequency.setValueAtTime(lp0, t0); fl.frequency.linearRampToValueAtTime(lp0 * 1.8, t1); fl.frequency.linearRampToValueAtTime(lpMax, t1 + duree * 0.5); fl.frequency.linearRampToValueAtTime(lpMax * 0.55, fin);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t1); g.gain.setValueAtTime(vol, fin - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, fin + 1.6);
    fl.connect(g); g.connect(voie(envoi));
    A.forEach((ea, i) => {
      const eb = B[i] ?? B[B.length - 1], fa = hz(261.63, ea.demi - 12 + decale), fb = hz(261.63, eb.demi - 12 + decale), q = quand(i);
      for (const [type, d, v] of types) {
        const o = ctx.createOscillator(); o.type = type; o.detune.value = d; const gv = ctx.createGain(); gv.gain.value = v / Math.sqrt(n / 2);
        o.frequency.setValueAtTime(fa, t0); o.frequency.setValueAtTime(fa, q); o.frequency.exponentialRampToValueAtTime(fb, q + 1.1);
        const vib = ctx.createOscillator(); vib.frequency.value = 4.5 + i * 0.4; const vg = ctx.createGain(); vg.gain.value = 3; vib.connect(vg); vg.connect(o.detune);
        o.connect(gv); gv.connect(fl); o.start(t0); o.stop(fin + 1.8); vib.start(t0); vib.stop(fin + 1.8);
      }
    });
  };

  // 1 · toujours : la nappe et les clochettes des grains
  nappe(0, niv === 1 ? [['sine', -4, 1], ['sine', 5, 0.7]] : [['triangle', -5, 1], ['sine', 6, 0.8]], 0.022, 500, niv === 1 ? 2000 : 3200);
  A.forEach((_, i) => ping(hz(1046.5, (B[i] ?? B[B.length - 1]).demi - 12), quand(i) + 0.9, 0.03, 1.6, 0.9, -0.6 + 1.2 * i / Math.max(1, n - 1)));
  grele(t1, duree * 0.85, [4, 7, 10][niv - 1], (x, u, a) => {
    const p = noteGrain(grains[(Math.random() * grains.length) | 0], u);
    ping(hz(1046.5, p.demi - 12), x, (0.01 + 0.015 * a) * (0.5 + 0.5 * p.S), 0.7, 0.9, Math.random() * 1.4 - 0.7);
  });
  // 2 · dès l'adolescent : une basse sur la fondamentale, qui glisse au milieu
  if (niv >= 2) {
    const fa = hz(65.41, A[0].demi % 12), fb = hz(65.41, B[0].demi % 12), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t1 - 0.4); g.gain.exponentialRampToValueAtTime(0.05, t1 + 1); g.gain.setValueAtTime(0.05, fin - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, fin + 1.2); g.connect(voie(0.25));
    for (const k of [1, 2]) { const o = osc('sine', fa * k, t1 - 0.4, fin + 1.3, g); o.frequency.setValueAtTime(fa * k, t1 + duree * 0.45); o.frequency.exponentialRampToValueAtTime(fb * k, t1 + duree * 0.6); }
  }
  // 3 · vers l'adulte : cordes, chœur, harpe, roulement et timbale
  if (niv >= 3) {
    nappe(-12, [['sawtooth', -8, 0.6], ['sawtooth', 7, 0.6]], 0.016, 300, 1400, 0.8);
    choeur(t1 - 0.2, duree * 0.62, A.map((e) => hz(261.63, e.demi - 12)), 0.035);
    choeur(t1 + duree * 0.42, duree * 0.58 + 2.2, B.map((e) => hz(261.63, e.demi - 12)), 0.045);
    let x = 0.3, i = 0;
    while (x < duree * 0.9) {                                    // la harpe égrène l'accord du moment, de plus en plus vite
      const C = x / duree < 0.5 ? A : B, e = C[i % C.length], oct = Math.floor(i / C.length) % 2;
      lame(hz(523.25, e.demi - 12 + 12 * oct), t1 + x, 0.03, 1.2, -0.7 + 1.4 * ((i % (2 * C.length)) / (2 * C.length)));
      x += 0.26 - 0.17 * agitation(x / duree); i++;
    }
    souffle(fin - 2.6, 2.65, 3000, 9000, 0.05, 0.5, 0.5);
    const tb = ctx.createGain(); env(tb, fin, 0.005, 0.22, 0, 1.4); tb.connect(voie(0.5));
    osc('sine', 98, fin, fin + 1.6, tb).frequency.exponentialRampToValueAtTime(52, fin + 0.6);
    choeur(fin - 0.1, 3.6, B.map((e) => hz(261.63, e.demi)), 0.04);
    for (let j = 0; j < 14; j++) ping(hz(2093, (B[j % B.length].demi % 12) + 12 * (j % 2)), fin + 0.2 + j * 0.07, 0.018, 1.2, 1, Math.random() * 1.6 - 0.8);
  }
  // l'éclat : le nouvel accord, plus ou moins plein selon le stade
  if (niv >= 2) ping(hz(65.41, B[0].demi % 12), fin, 0.12, 4, 0.9);
  const cloches = niv === 1 ? B.slice(-2) : B;
  cloches.forEach((e, i) => ping(hz(523.25, e.demi - 12), fin + i * 0.02, niv === 1 ? 0.09 : 0.08, 3.2, 1, -0.4 + 0.8 * i / Math.max(1, cloches.length - 1)));
  if (niv >= 2) B.forEach((e, i) => ping(hz(1046.5, e.demi - 12), fin + 0.25 + i * 0.09, 0.04, 2, 1, -0.6 + 1.2 * i / Math.max(1, n - 1)));

  return {
    arreter: () => {
      const x = ctx.currentTime;
      for (const g of [sortie, mouille]) { g.gain.cancelScheduledValues(x); g.gain.setValueAtTime(g.gain.value, x); g.gain.setTargetAtTime(0.0001, x, 0.08); }
      window.setTimeout(() => { sortie.disconnect(); mouille.disconnect(); }, 800);
    },
  };
}
