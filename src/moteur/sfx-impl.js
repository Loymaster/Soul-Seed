// Implémentation brute des sons synthétisés (portée telle quelle depuis les maquettes validées).
// Ne pas importer directement : passer par sfx.ts, qui la type.
export const SFX = {
  ctx: null, on: true,
  get() {
    if (!this.on) return null;
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      const c = this.ctx = new C();
      this.master = c.createGain(); this.master.gain.value = 0.6; this.master.connect(c.destination);
      // léger écho cristallin (magie sainte), volontairement discret
      this.delay = c.createDelay(); this.delay.delayTime.value = 0.13;
      const fb = c.createGain(); fb.gain.value = 0.12; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4500;
      const wet = c.createGain(); wet.gain.value = 0.35;
      this.delay.connect(lp); lp.connect(fb); fb.connect(this.delay); lp.connect(wet); wet.connect(this.master);
      // réverbe de salle sombre (corruption) : pas d'écho distinct, une queue sombre et longue
      this.verb = c.createConvolver(); this.verb.buffer = this.impulse(4.6, 3);
      const vg = c.createGain(); vg.gain.value = 0.85; const vlp = c.createBiquadFilter(); vlp.type = 'lowpass'; vlp.frequency.value = 1800;
      this.verb.connect(vlp); vlp.connect(vg); vg.connect(this.master);
      // réverbe claire (magie sainte) : même principe, mais lumineuse et plus courte
      this.bright = c.createConvolver(); this.bright.buffer = this.impulse(2.6, 3.2, 0.15);
      const bg = c.createGain(); bg.gain.value = 0.7; const blp = c.createBiquadFilter(); blp.type = 'lowpass'; blp.frequency.value = 6500;
      this.bright.connect(blp); blp.connect(bg); bg.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  impulse(sec, decay, smooth) {
    smooth = smooth ?? 0.6;
    const c = this.ctx; const len = Math.floor(c.sampleRate * sec); const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let y = 0;
      for (let i = 0; i < len; i++) { const x = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); y = y * smooth + x * (1 - smooth); d[i] = y; } }
    return b;
  },
  tone(f, t, dur, o) {
    const c = this.ctx; o = o || {};
    const osc = c.createOscillator(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = c.createGain(); const a = o.attack || 0.004; const v = o.gain || 0.15;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); node = fl; }
    node.connect(g);
    if (o.dry !== false) g.connect(this.master);
    if (o.send) { const s = c.createGain(); s.gain.value = o.sendGain ?? 1; g.connect(s); s.connect(o.send); }
    osc.start(t); osc.stop(t + dur + 0.05);
  },
  noise(t, dur, o) {
    const c = this.ctx; o = o || {};
    const len = Math.ceil(c.sampleRate * dur); const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
    // texture : grains irréguliers (papier, os) si demandé
    const grain = o.grain ? Math.floor(c.sampleRate * o.grain) : 0; let amp = 1;
    for (let i = 0; i < len; i++) { if (grain && i % grain === 0) amp = 0.25 + Math.random() * 0.75; d[i] = (Math.random() * 2 - 1) * amp; }
    const src = c.createBufferSource(); src.buffer = buf;
    const fl = c.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f || 1000, t); fl.Q.value = o.q || 1;
    if (o.fTo) fl.frequency.exponentialRampToValueAtTime(o.fTo, t + dur);
    let last = fl;
    if (o.soft) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.soft; fl.connect(lp); last = lp; }
    const g = c.createGain(); const a = o.attack || 0.003; const v = o.gain || 0.2; const r = o.release || dur;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a);
    if (o.hold) g.gain.setValueAtTime(v, t + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); last.connect(g);
    if (o.dry !== false) g.connect(this.master);
    if (o.send) { const s = c.createGain(); s.gain.value = o.sendGain ?? 1; g.connect(s); s.connect(o.send); }
    src.start(t); src.stop(t + dur + 0.02);
  },
  // Magie sainte — survol : même geste que la corruption (petit choc résonant + note), mais en verre clair
  holyHover() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.08, { f: 2350, q: 11, gain: 0.16, attack: 0.002, send: this.bright, sendGain: 0.7 });
    this.tone(784, t, 0.5, { to: 770, gain: 0.07, attack: 0.004, send: this.bright, sendGain: 0.6 });
    this.tone(1568, t, 0.25, { gain: 0.012, attack: 0.004 }); },
  // Magie sainte — validation : petite mélodie montante, douce, posée sur un accord chaud
  holyClick() { const c = this.get(); if (!c) return; const t = c.currentTime;
    const notes = [[523.25, 0], [659.25, 0.09], [783.99, 0.18], [987.77, 0.27], [783.99, 0.4]];
    notes.forEach(([f, d], i) => {
      const last = i === notes.length - 1;
      this.tone(f, t + d, last ? 2.2 : 0.7, { gain: last ? 0.07 : 0.06, attack: 0.012, lp: 4200, send: this.bright, sendGain: 0.55 });
      this.tone(f * 2, t + d, 0.35, { gain: 0.008, attack: 0.01 });
    });
    [261.63, 392, 523.25].forEach((f, i) => this.tone(f, t + 0.05, 2.6, { gain: 0.028, attack: 0.25, detune: i * 4 - 4, send: this.bright, sendGain: 0.5 })); },
  // Magie corrompue — survol : un choc d'os sourd
  darkHover() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.09, { f: 520, q: 9, gain: 0.35, attack: 0.002, send: this.verb, sendGain: 0.7 });
    this.tone(62, t, 0.35, { to: 48, gain: 0.18, attack: 0.003, send: this.verb, sendGain: 0.5 }); },
  // Magie corrompue — validation : tintement métallique très grave, plus doux, qui s'éteint lentement jusqu'au silence
  darkClick() { const c = this.get(); if (!c) return; const t = c.currentTime;
    const f0 = 49; const modes = [[1, 4.2, 0.12], [2.32, 3.2, 0.06], [4.25, 2.2, 0.035], [6.63, 1.5, 0.02], [9.38, 1, 0.012]];
    modes.forEach(([r, d, g]) => this.tone(f0 * r, t, d, { gain: g, attack: 0.003, to: f0 * r * 0.97, send: this.verb, sendGain: 0.7 }));
    this.noise(t, 0.05, { f: 1100, q: 4, gain: 0.14, attack: 0.001, grain: 0.004, send: this.verb, sendGain: 0.5 });
    this.tone(32.7, t, 4.6, { gain: 0.12, attack: 0.05, send: this.verb, sendGain: 0.35 }); },
  // Ranch — sons naturels et agréables
// tampon : caoutchouc qui se pose sur le papier — appui feutré, grain de l'encre, petit décollement
  stamp() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.tone(118, t, 0.16, { to: 72, gain: 0.16, attack: 0.008, lp: 600 });
    this.noise(t, 0.16, { type: 'lowpass', f: 850, gain: 0.11, attack: 0.006, grain: 0.004 });
    this.noise(t + 0.012, 0.09, { f: 2300, q: 0.9, gain: 0.03, attack: 0.005, grain: 0.003, soft: 6000 });
    this.noise(t + 0.15, 0.07, { f: 1700, q: 1.2, gain: 0.022, attack: 0.012, grain: 0.0025, soft: 5000 }); },
  leather() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.09, { type: 'lowpass', f: 1400, gain: 0.22 }); this.tone(190, t, 0.09, { to: 120, gain: 0.12 }); },
  // page d'un vieux carnet qu'on évente : fibres du papier qui crépitent + souffle d'air + petit claquement à la retombée
  page(vol) { const c = this.get(); if (!c) return; const t = c.currentTime; const v = vol || 1;
    this.noise(t, 0.34, { f: 2600, fTo: 5200, q: 0.8, gain: 0.11 * v, attack: 0.1, grain: 0.0025, soft: 9000 });
    this.noise(t + 0.02, 0.36, { f: 700, fTo: 1500, q: 0.6, gain: 0.07 * v, attack: 0.14 });
    this.noise(t + 0.28, 0.05, { type: 'highpass', f: 3500, gain: 0.05 * v, attack: 0.002, grain: 0.002 });
    this.noise(t + 0.3, 0.08, { type: 'lowpass', f: 600, gain: 0.05 * v, attack: 0.004 }); },
  // découverte d'une résonance : deux notes claires qui se répondent, posées dans la réverbe lumineuse
  reveal() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.5, { type: 'highpass', f: 6000, gain: 0.02, attack: 0.15 });
    [[659.25, 0, 0.9], [987.77, 0.14, 1.8]].forEach(([f, d, l]) => this.tone(f, t + d, l, { gain: 0.06, attack: 0.01, lp: 4000, send: this.bright, sendGain: 0.6 }));
    this.tone(329.63, t + 0.14, 2, { gain: 0.025, attack: 0.2, send: this.bright, sendGain: 0.5 }); },
  // survol d'une réponse : un effleurement de papier, très léger
  paperTick() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.07, { f: 3200, q: 1.2, gain: 0.035, attack: 0.008, grain: 0.003, soft: 7000 }); },
  // fiche qui glisse de derrière le carnet : frottement de carton contre le cuir
  slide() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.34, { f: 1100, fTo: 2400, q: 0.9, gain: 0.07, attack: 0.08, grain: 0.004, soft: 6000 });
    this.noise(t + 0.3, 0.06, { type: 'lowpass', f: 700, gain: 0.04, attack: 0.004 }); },
  // bulle d'émotion : petit « plop » rond et doux
  pop() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.tone(520, t, 0.16, { to: 780, gain: 0.05, attack: 0.006, lp: 2500 }); this.noise(t, 0.04, { f: 1800, q: 2, gain: 0.02 }); },
  // crayon : deux traits « scrrtch scrrtch », grain de papier, très doux
  pencil() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.22, { f: 3400, fTo: 2600, q: 1.4, gain: 0.07, attack: 0.035, hold: 0.1, grain: 0.0035, soft: 6000 });
    this.noise(t + 0.3, 0.17, { f: 3000, fTo: 2300, q: 1.4, gain: 0.055, attack: 0.03, hold: 0.07, grain: 0.0035, soft: 6000 }); },
  // arrivée du carnet : un « woosh » d'air, puis la couverture et les pages qui s'éventent (aucun son à la pose)
  woosh() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.75, { f: 380, fTo: 1400, q: 0.7, gain: 0.11, attack: 0.32, soft: 3000 });
    this.noise(t + 0.05, 0.7, { f: 1800, fTo: 3200, q: 1.2, gain: 0.03, attack: 0.3 }); },
  bookArrive() { const c = this.get(); if (!c) return;
    this.woosh();
    setTimeout(() => this.page(0.8), 700); setTimeout(() => this.page(1), 900); setTimeout(() => this.page(0.9), 1040); setTimeout(() => this.page(0.8), 1180); },
  // écriture d'une réplique : une petite note feutrée par lettre, hauteur légèrement variable, accordée sur une gamme douce
  typeTick(ch, voice, tb) { if (!ch || ch === ' ' || /[,.;:!?…«»'’"-]/.test(ch)) return; const c = this.get(); if (!c) return; const t = c.currentTime;
    const base = voice || 392; const steps = [0, 2, 4, 7, 9]; const st = steps[(ch.charCodeAt(0) * 7) % steps.length];
    const f = base * Math.pow(2, st / 12);
    tb = tb || {};
    this.tone(f, t, tb.dur || 0.07, { type: tb.type || 'triangle', gain: tb.gain || 0.022, attack: tb.attack || 0.003, lp: tb.lp || 2200, detune: tb.detune || 0 });
    if (tb.body) this.tone(f / 2, t, (tb.dur || 0.07) * 1.2, { type: 'sine', gain: tb.body, attack: 0.004 });
    this.noise(t, 0.02, { f: tb.air || 3000, q: 1, gain: tb.airGain ?? 0.006, attack: 0.001 }); }
};
