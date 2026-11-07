// Sons du combat, synthétisés (provisoires) : coups, parades, esquives, tirs, statuts, issue.
// Ils suivent le volume des bruitages des options et le réglage « Bruitages ».
import { SFX } from '@/moteur/sfx';
import { ecouterVolumes, volumeBruitages } from '../commun/volumes';

let ctx: AudioContext | null = null;
let maitre: GainNode | null = null;
let hauteur = 1;

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

function bruit(duree: number, freq: number, q: number, vol: number, glisse?: number) {
  const c = a(); if (!c || !maitre) return;
  const n = Math.floor(c.sampleRate * duree), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq * hauteur; f.Q.value = q;
  if (glisse) f.frequency.exponentialRampToValueAtTime(glisse * hauteur, c.currentTime + duree);
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(maitre); s.start();
}

function ton(type: OscillatorType, de: number, vers: number, duree: number, vol: number, retard = 0) {
  const c = a(); if (!c || !maitre) return;
  const t0 = c.currentTime + retard;
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(de * hauteur, t0); o.frequency.exponentialRampToValueAtTime(vers * hauteur, t0 + duree);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
  o.connect(g); g.connect(maitre); o.start(t0); o.stop(t0 + duree + 0.02);
}

export const SonsCombat = {
  /** Registre corrompu : tout est joué plus grave. */
  grave(oui: boolean) { hauteur = oui ? 0.72 : 1; },
  eveiller() { a(); },
  coup(fort: boolean) { ton('sine', fort ? 150 : 120, 45, 0.18, fort ? 0.55 : 0.4); bruit(fort ? 0.16 : 0.1, fort ? 900 : 700, 0.9, fort ? 0.5 : 0.32); if (fort) bruit(0.08, 3200, 2, 0.25); },
  pare() { ton('triangle', 1250, 980, 0.22, 0.18); ton('triangle', 1880, 1500, 0.16, 0.08); bruit(0.05, 2400, 3, 0.15); },
  esquive() { bruit(0.24, 500, 1.2, 0.22, 2600); },
  tir() { ton('sine', 320, 980, 0.22, 0.12); bruit(0.2, 1500, 1.5, 0.08, 3400); },
  technique() { ton('sine', 660, 990, 0.25, 0.08); ton('sine', 990, 1320, 0.3, 0.06, 0.07); },
  statut() { ton('sine', 520, 380, 0.2, 0.05); },
  soin() { [660, 880, 1100].forEach((f, i) => ton('sine', f, f * 1.01, 0.3, 0.07, i * 0.07)); },
  ko() { ton('sawtooth', 220, 55, 0.7, 0.12); bruit(0.5, 260, 0.8, 0.3); },
  ordre() { ton('triangle', 440, 660, 0.12, 0.1); ton('triangle', 660, 880, 0.12, 0.08, 0.06); },
  refus() { ton('square', 180, 140, 0.15, 0.05); },
  victoire() { [523, 659, 784, 1046].forEach((f, i) => ton('triangle', f, f, 0.32, 0.12, i * 0.13)); },
  defaite() { [392, 330, 262].forEach((f, i) => ton('sine', f, f * 0.98, 0.5, 0.11, i * 0.22)); },
};
