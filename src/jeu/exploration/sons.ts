// Sons synthétisés propres à l'exploration (repris de la maquette v12) : pas, fourrés, coups, trouvailles, pêche, toile.
// Ils suivent le volume des bruitages des options et le réglage « Bruitages ».
import { SFX } from '@/moteur/sfx';
import { ecouterVolumes, volumeBruitages } from '../commun/volumes';
import { DUREE_PAS, programmePas } from './regles';

let ctx: AudioContext | null = null;
let maitre: GainNode | null = null;

function a(): AudioContext | null {
  if (!SFX.on) return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    maitre = ctx.createGain();
    maitre.gain.value = volumeBruitages();
    maitre.connect(ctx.destination);
    ecouterVolumes(() => { if (maitre) maitre.gain.value = volumeBruitages(); });
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function bruit(duree: number, freq: number, q: number, vol: number, retard = 0, glisse?: number) {
  const c = a(); if (!c || !maitre) return;
  const t0 = c.currentTime + retard;
  const n = Math.floor(c.sampleRate * duree), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (glisse) f.frequency.exponentialRampToValueAtTime(glisse, t0 + duree);
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(maitre); s.start(t0);
}

// —— les pas : une seule série à la fois ; une nouvelle série fait taire ce qui reste de la précédente
let serie: { src: AudioBufferSourceNode; g: GainNode; t0: number }[] = [];
let numeroSerie = 0;
/** Journal des pas programmés (instants en secondes de l'horloge audio), lu par les essais (__explo.pas). */
export const journalPas: { serie: number; mode: string; t: number; fin: number; vol: number; coupe?: boolean }[] = [];
function couperSerie(c: AudioContext) {
  const now = c.currentTime;
  for (const n of serie) {
    if (n.t0 > now) { try { n.src.stop(); } catch { /* déjà arrêté */ } }
    else { n.g.gain.cancelScheduledValues(now); n.g.gain.setValueAtTime(n.g.gain.value, now); n.g.gain.linearRampToValueAtTime(0, now + 0.03); }
  }
  journalPas.forEach((x) => { if (x.serie === numeroSerie && x.t > now) x.coupe = true; });
  serie = [];
}
function pas(mode: 'depart' | 'arrivee' | 'simple', grotte: boolean, n?: number) {
  const c = a(); if (!c || !maitre) return;
  couperSerie(c);
  numeroSerie++;
  const t0 = c.currentTime;
  for (const p of programmePas(mode, grotte, n)) {
    const t = t0 + p.t;
    const k = Math.floor(c.sampleRate * DUREE_PAS), buf = c.createBuffer(1, k, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < k; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / k, 2);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = p.freq; f.Q.value = 1.4;
    const g = c.createGain(); g.gain.value = p.vol;
    src.connect(f); f.connect(g); g.connect(maitre); src.start(t);
    serie.push({ src, g, t0: t });
    journalPas.push({ serie: numeroSerie, mode, t: +t.toFixed(3), fin: +(t + DUREE_PAS).toFixed(3), vol: p.vol });
  }
  if (journalPas.length > 80) journalPas.splice(0, journalPas.length - 80);
}

function ton(type: OscillatorType, de: number, vers: number, duree: number, vol: number, retard = 0) {
  const c = a(); if (!c || !maitre) return;
  const t0 = c.currentTime + retard;
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(de, t0); o.frequency.exponentialRampToValueAtTime(vers, t0 + duree);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
  o.connect(g); g.connect(maitre); o.start(t0); o.stop(t0 + duree + 0.03);
}

export const SonsExplo = {
  eveiller() { a(); },
  /** Pas réguliers (fuite, retour au ranch). */
  pas(grotte: boolean, n = 6) { pas('simple', grotte, n); },
  /** On quitte un lieu : les pas s'espacent et s'éteignent. */
  pasDepart(grotte: boolean) { pas('depart', grotte); },
  /** On entre dans un lieu : les pas commencent tard et doucement (jamais en même temps que ceux du départ). */
  pasArrivee(grotte: boolean) { pas('arrivee', grotte); },
  froissement() { for (let i = 0; i < 5; i++) bruit(0.22, 2600 + Math.random() * 1400, 0.8, 0.09, i * 0.18 + Math.random() * 0.1, 1600); },
  coups() { for (let i = 0; i < 4; i++) { bruit(0.06, 700, 1.5, 0.3, i * 0.35); ton('sine', 160, 90, 0.12, 0.08, i * 0.35); } },
  trouvaille() { [784, 988, 1175].forEach((f, i) => ton('triangle', f, f, 0.28, 0.07, i * 0.07)); },
  rien() { ton('sine', 330, 250, 0.25, 0.05); },
  rencontre() { ton('sawtooth', 160, 120, 0.4, 0.08); bruit(0.3, 500, 0.9, 0.25); ton('square', 520, 690, 0.12, 0.04, 0.1); },
  plouf() { bruit(0.35, 700, 0.7, 0.3, 0, 260); ton('sine', 420, 160, 0.25, 0.06); },
  touche() { ton('sine', 900, 380, 0.18, 0.12); bruit(0.15, 1400, 1.2, 0.2); },
  prise() { [523, 659, 784, 1046].forEach((f, i) => ton('triangle', f, f, 0.3, 0.09, i * 0.1)); },
  rate() { [392, 330].forEach((f, i) => ton('sine', f, f * 0.97, 0.4, 0.08, i * 0.18)); },
  toile() { bruit(0.5, 900, 0.6, 0.18, 0, 2400); bruit(0.3, 1600, 0.8, 0.08, 0.35, 700); },
  clic() { ton('triangle', 600, 760, 0.08, 0.05); },
};
