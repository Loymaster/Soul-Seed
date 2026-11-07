// Implémentation brute des sons synthétisés (portée telle quelle depuis les maquettes validées).
// Ne pas importer directement : passer par sfx.ts, qui la type.
export const SFX = {
  ctx: null, on: true, niveau: 0.8,
  /** Volume général des bruitages (0–1), réglé dans les options. */
  regler(n) { this.niveau = n; if (this.master) this.master.gain.value = 0.6 * n; },
  get() {
    if (!this.on) return null;
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      const c = this.ctx = new C();
      this.master = c.createGain(); this.master.gain.value = 0.6 * this.niveau; this.master.connect(c.destination);
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
  // Ranch — caresse : deux passages de main dans le pelage, et un petit « mmh » content
  caresse() { const c = this.get(); if (!c) return; const t = c.currentTime;
    [0, 0.44].forEach((d) => {
      this.noise(t + d, 0.42, { f: 650, fTo: 1250, q: 0.7, gain: 0.075, attack: 0.15, grain: 0.004, soft: 2400 });
      this.noise(t + d + 0.04, 0.34, { f: 2600, fTo: 3300, q: 1.3, gain: 0.012, attack: 0.13, grain: 0.0022 });
    });
    this.tone(233, t + 0.55, 0.5, { type: 'sine', to: 208, gain: 0.022, attack: 0.09, lp: 700 }); },
  // refus : un « hm-hm » nasal qui descend
  refus() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.tone(311, t, 0.17, { type: 'triangle', to: 285, gain: 0.05, attack: 0.02, lp: 1100 });
    this.tone(247, t + 0.21, 0.3, { type: 'triangle', to: 208, gain: 0.05, attack: 0.02, lp: 1000 });
    this.noise(t, 0.12, { f: 900, q: 2, gain: 0.006, attack: 0.01 }); },
  // Foulée : le son d'un appui, calculé d'après la taille, le poids et la façon de se déplacer.
  //   petit et léger → choc bref et aigu ; grand et lourd → choc grave, plus long, avec une basse qui résonne
  foulee(p, v, patte) { const c = this.get(); if (!c) return; const t = c.currentTime; v = v || 1;
    const lourdeur = Math.pow(Math.max(1, p.poids) / 20, 0.35);          // 1 pour un écho de 20 kg
    const grandeur = Math.sqrt(Math.max(0.2, p.taille) / 0.9);           // 1 pour 90 cm
    const f = Math.max(90, Math.min(900, 470 / grandeur / Math.pow(lourdeur, 0.8))) * (patte % 2 ? 1.07 : 1);
    const g = Math.min(0.16, 0.06 * lourdeur) * v * (p.demarche === 'quadrupede' ? 0.72 : 1) * (p.demarche === 'sautillant' ? 1.35 : 1);
    const d = Math.min(0.28, 0.06 + 0.03 * Math.log2(1 + p.poids / 10));
    this.noise(t, d, { type: 'lowpass', f: f * (0.9 + Math.random() * 0.2), q: 0.8, gain: g, attack: 0.004 });
    if (p.poids > 60) this.tone(Math.max(38, 95 / lourdeur), t, d * 1.6, { type: 'sine', gain: Math.min(0.12, 0.025 * lourdeur) * v, attack: 0.006 });
    this.noise(t + 0.006, 0.06, { f: 2400 + Math.random() * 900, q: 1.4, gain: 0.009 * v / Math.sqrt(lourdeur), attack: 0.003, grain: 0.003 }); },
  // déplacement sans appui : souffle (flottant) ou frottement (rampant)
  glisse(p, v, duree) { const c = this.get(); if (!c) return; const t = c.currentTime; v = v || 1;
    if (p.demarche === 'flottant') {
      this.noise(t, duree, { f: 520, fTo: 880, q: 0.9, gain: 0.022 * v, attack: duree * 0.4 });
      this.tone(1180 + Math.random() * 300, t + duree * 0.3, 0.6, { gain: 0.004 * v, attack: 0.05, send: this.bright, sendGain: 0.4 });
    } else {
      const lourdeur = Math.pow(Math.max(1, p.poids) / 20, 0.35);
      this.noise(t, duree, { type: 'lowpass', f: 900 / lourdeur, q: 0.7, gain: 0.035 * v * Math.min(2, lourdeur), attack: duree * 0.35, grain: 0.004 });
    } },
  // gargouillis : un ventre vide qui se plaint (indice de faim, très discret)
  gargouille(v) { const c = this.get(); if (!c) return; const t = c.currentTime; v = v || 1;
    this.tone(110, t, 0.5, { type: 'sine', to: 70, gain: 0.03 * v, attack: 0.08, lp: 300 });
    this.noise(t + 0.1, 0.45, { type: 'lowpass', f: 260, fTo: 160, q: 2, gain: 0.04 * v, attack: 0.1, grain: 0.01 }); },
  // bâillement : un souffle qui monte puis retombe
  baille(v) { const c = this.get(); if (!c) return; const t = c.currentTime; v = v || 1;
    this.noise(t, 1.1, { f: 500, fTo: 900, q: 0.7, gain: 0.03 * v, attack: 0.4, soft: 2000 });
    this.tone(260, t + 0.15, 0.9, { type: 'triangle', to: 180, gain: 0.018 * v, attack: 0.3, lp: 900 }); },
  // écriture d'une réplique : une petite note feutrée par lettre, hauteur légèrement variable, accordée sur une gamme douce
  typeTick(ch, voice, tb) { if (!ch || ch === ' ' || /[,.;:!?…«»'’"-]/.test(ch)) return; const c = this.get(); if (!c) return; const t = c.currentTime;
    const base = voice || 392; const steps = [0, 2, 4, 7, 9]; const st = steps[(ch.charCodeAt(0) * 7) % steps.length];
    const f = base * Math.pow(2, st / 12);
    tb = tb || {};
    this.tone(f, t, tb.dur || 0.07, { type: tb.type || 'triangle', gain: tb.gain || 0.022, attack: tb.attack || 0.003, lp: tb.lp || 2200, detune: tb.detune || 0 });
    if (tb.body) this.tone(f / 2, t, (tb.dur || 0.07) * 1.2, { type: 'sine', gain: tb.body, attack: 0.004 });
    this.noise(t, 0.02, { f: tb.air || 3000, q: 1, gain: tb.airGain ?? 0.006, attack: 0.001 }); },
  // ——— Cycle de l'écho (registre « magie sainte ») : choix de la graine, éclosion, mort, introduction ———
  // chaque graine chante sa propre note quand on la survole (gamme pentatonique)
  chant(i) { const c = this.get(); if (!c) return; const t = c.currentTime;
    const f = [523.25, 587.33, 659.25, 783.99, 880][i] || 659.25;
    this.tone(f, t, 1.4, { gain: 0.05, attack: 0.03, lp: 4000, send: this.bright, sendGain: 0.7 });
    this.tone(f * 1.5, t + 0.06, 1.1, { gain: 0.018, attack: 0.05, send: this.bright, sendGain: 0.6 });
    this.noise(t, 0.5, { type: 'highpass', f: 7000, gain: 0.012, attack: 0.12 }); },
  // la graine se pose : un souffle qui monte et une note tenue
  pose() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.9, { f: 600, fTo: 2600, q: 0.8, gain: 0.05, attack: 0.4, send: this.bright, sendGain: 0.5 });
    this.tone(392, t + 0.3, 2.4, { gain: 0.04, attack: 0.3, send: this.bright, sendGain: 0.6 });
    this.tone(587.33, t + 0.45, 2.2, { gain: 0.03, attack: 0.3, send: this.bright, sendGain: 0.6 }); },
  // l'éveil de la graine : une nappe qui enfle et un arpège qui monte pendant qu'elle tremble
  eveil() { const c = this.get(); if (!c) return; const t = c.currentTime;
    [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, t + i * 0.26, 1.6, { gain: 0.04, attack: 0.02, lp: 5000, send: this.bright, sendGain: 0.6 }));
    this.noise(t, 2.3, { f: 700, fTo: 5500, q: 0.6, gain: 0.05, attack: 2, send: this.bright, sendGain: 0.6 }); },
  // l'ouverture : un éclat de cristal, puis un grand accord clair
  ouverture() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.25, { f: 4200, q: 2, gain: 0.08, attack: 0.002, send: this.bright, sendGain: 0.8 });
    [523.25, 659.25, 783.99, 1046.5, 1567.98].forEach((f, i) => this.tone(f, t + 0.02 + i * 0.03, 3.6, { gain: 0.042, attack: 0.04, detune: i * 3 - 6, send: this.bright, sendGain: 0.7 }));
    this.tone(130.81, t, 3, { gain: 0.05, attack: 0.08, send: this.bright, sendGain: 0.4 }); },
  // premier cri de l'écho : deux petites notes rondes, joyeuses
  cri() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.tone(880, t, 0.18, { type: 'triangle', to: 1175, gain: 0.05, attack: 0.01, lp: 3000 });
    this.tone(1046.5, t + 0.2, 0.3, { type: 'triangle', to: 1396.9, gain: 0.05, attack: 0.01, lp: 3200 }); },

  // bruit brun (grave, sans souffle aigu) et bruit blanc, créés une fois
  brun() {
    const c = this.ctx; if (this._brun) return this._brun;
    const len = c.sampleRate * 4, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0); let y = 0;
    for (let i = 0; i < len; i++) { y = (y + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = y * 3.5; }
    return (this._brun = b);
  },
  blanc() {
    const c = this.ctx; if (this._blanc) return this._blanc;
    const len = c.sampleRate * 4, b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    return (this._blanc = b);
  },
  // frottement sourd : bruit brun filtré très bas, grain irrégulier (comme une masse qui racle), sous-grave
  frottement(t, dur, o) {
    const c = this.ctx; o = o || {};
    const src = c.createBufferSource(); src.buffer = this.brun(); src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.9;
    const f0 = o.f || 170; lp.frequency.setValueAtTime(f0 * 0.6, t); lp.frequency.linearRampToValueAtTime(f0 * 1.5, t + dur * 0.35); lp.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + dur);
    const lp2 = c.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 420;
    const grain = c.createGain(); grain.gain.value = 0.65;
    const lfo = c.createOscillator(); lfo.type = 'triangle'; lfo.frequency.setValueAtTime(o.grain || 7, t); lfo.frequency.linearRampToValueAtTime((o.grain || 7) * 0.6, t + dur);
    const prof = c.createGain(); prof.gain.value = 0.35; lfo.connect(prof); prof.connect(grain.gain);
    const g = c.createGain(); const v = o.gain || 0.5, a = o.attack || 0.12;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + Math.max(a, dur * 0.45)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp); lp.connect(lp2); lp2.connect(grain); grain.connect(g); g.connect(this.master);
    const r = c.createGain(); r.gain.value = 0.25; g.connect(r); r.connect(this.bright);
    src.start(t, Math.random() * 3); src.stop(t + dur + 0.1); lfo.start(t); lfo.stop(t + dur + 0.1);
    this.tone(o.sub || 48, t, Math.min(dur, 1.4), { gain: o.subGain || 0.14, to: (o.sub || 48) * 0.7, attack: 0.06, send: this.bright, sendGain: 0.5 });
  },
  // la mort : chaque secousse est un frottement sourd ; la longue secousse du passage s'épuise lentement
  pouls() { const c = this.get(); if (!c) return; this.frottement(c.currentTime, 1.3, { f: 160, gain: 0.55, attack: 0.05, grain: 9, sub: 46, subGain: 0.16 }); },
  secousse() { const c = this.get(); if (!c) return; this.frottement(c.currentTime, 3.4, { f: 190, gain: 0.45, attack: 0.25, grain: 6, sub: 40, subGain: 0.12 }); },
  // la disparition : un léger vent magique qui monte avec le voile, et quelques scintillements
  vent(dur) {
    const c = this.get(); if (!c) return; const t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.blanc(); src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(420, t); bp.frequency.exponentialRampToValueAtTime(1500, t + dur * 0.6); bp.frequency.exponentialRampToValueAtTime(2600, t + dur);
    const raf = c.createGain(); raf.gain.value = 0.7;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.55; const pr = c.createGain(); pr.gain.value = 0.3; lfo.connect(pr); pr.connect(raf.gain);
    const lfo2 = c.createOscillator(); lfo2.frequency.value = 0.23; const pr2 = c.createGain(); pr2.gain.value = 500; lfo2.connect(pr2); pr2.connect(bp.frequency);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.35); g.gain.setValueAtTime(0.16, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.6);
    src.connect(bp); bp.connect(raf); raf.connect(g);
    if (c.createStereoPanner) {
      const pan = c.createStereoPanner(); const lp = c.createOscillator(); lp.frequency.value = 0.18; const pp = c.createGain(); pp.gain.value = 0.5;
      lp.connect(pp); pp.connect(pan.pan); lp.start(t); lp.stop(t + dur + 2); g.connect(pan); pan.connect(this.master);
    } else g.connect(this.master);
    const r = c.createGain(); r.gain.value = 0.5; g.connect(r); r.connect(this.bright);
    src.start(t); src.stop(t + dur + 2); lfo.start(t); lfo.stop(t + dur + 2); lfo2.start(t); lfo2.stop(t + dur + 2);
    const notes = [1568, 1760, 2093, 2349, 2637, 3136, 3520];
    for (let i = 0; i < 16; i++) { const u = i / 15, k = Math.min(notes.length - 1, Math.floor(u * notes.length * 0.8 + Math.random() * 2)); this.tone(notes[k], t + 0.4 + u * dur * 0.95 + Math.random() * 0.2, 1.2, { gain: 0.012 + 0.008 * Math.sin(Math.PI * u), attack: 0.02, send: this.bright, sendGain: 0.7 }); }
  },
  // l'âme se resserre : quelques notes qui descendent ; puis la graine se forme : un accord clair qui scintille
  repli() { const c = this.get(); if (!c) return; const t = c.currentTime; [1567.98, 1318.5, 1046.5, 783.99, 659.25].forEach((f, i) => this.tone(f, t + i * 0.28, 1.8, { gain: 0.03, attack: 0.12, send: this.bright, sendGain: 0.7 })); },
  formeGraine() { const c = this.get(); if (!c) return; const t = c.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, t + i * 0.05, 3.4, { gain: 0.035, attack: 0.3, send: this.bright, sendGain: 0.7 })); this.tone(2093, t + 0.4, 2.6, { gain: 0.02, send: this.bright, sendGain: 0.7 }); },
  // une parole qui s'écrit mot à mot (mort) : un tintement très doux
  survolDoux() { const c = this.get(); if (!c) return; this.tone(784, c.currentTime, 0.5, { to: 770, gain: 0.05, send: this.bright, sendGain: 0.7 }); },
  // la voix de l'homme mystérieux : une note feutrée, grave et lointaine par mot
  motVoix(i) { const c = this.get(); if (!c) return; const t = c.currentTime;
    const gamme = [196, 220, 246.94, 293.66, 329.63]; const f = gamme[(i * 3) % gamme.length];
    this.tone(f, t, 0.9, { gain: 0.011, attack: 0.05, lp: 1300, send: this.bright, sendGain: 0.8 }); },
  // validation dans l'introduction (homme mystérieux) : une seule note, douce et voilée, qui se perd dans la réverbe
  // — un ré grave, sans attaque ni harmonique marquée, pour ne pas rivaliser avec la musique
  mystere() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.tone(293.66, t, 2.6, { gain: 0.045, attack: 0.09, lp: 1100, send: this.bright, sendGain: 0.9 });
    this.tone(293.66, t, 2.2, { gain: 0.012, attack: 0.12, detune: 7, lp: 900, dry: false, send: this.bright, sendGain: 1 }); },
  // la réponse qui décide de la graine se dissipe : un souffle cristallin, puis l'emblème qui se révèle
  sceau(i) { const c = this.get(); if (!c) return; const t = c.currentTime;
    const f = [523.25, 587.33, 659.25, 783.99, 880][i] || 659.25;
    this.noise(t, 1.2, { f: 500, fTo: 3000, q: 0.7, gain: 0.04, attack: 0.5, send: this.bright, sendGain: 0.6 });
    [f / 2, f, f * 1.5].forEach((x, k) => this.tone(x, t + 0.1 + k * 0.12, 3.2, { gain: 0.03, attack: 0.3, send: this.bright, sendGain: 0.6 })); },
  // le réveil : tout s'ouvre vers la lumière
  aube() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 4, { f: 400, fTo: 6000, q: 0.5, gain: 0.07, attack: 3.2, send: this.bright, sendGain: 0.6 });
    [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) => this.tone(f, t + 0.6 + i * 0.32, 2.6, { gain: 0.035, attack: 0.08, lp: 5000, send: this.bright, sendGain: 0.6 }));
    [130.81, 196, 261.63].forEach((f) => this.tone(f, t + 2.4, 4.5, { gain: 0.04, attack: 1.2, send: this.bright, sendGain: 0.6 })); },
  // ——— sons du ranch (maquette v7) : balai, sacoche, scènes d'action
  pas(v) { const c = this.get(); if (!c) return; const t = c.currentTime; v = v || 1;
    this.noise(t, 0.08, { type: 'lowpass', f: 380 + Math.random() * 160, q: 0.8, gain: 0.07 * v, attack: 0.004 });
    this.noise(t + 0.006, 0.06, { f: 2600 + Math.random() * 800, q: 1.4, gain: 0.009 * v, attack: 0.003, grain: 0.003 }); },
  balai() { const c = this.get(); if (!c) return; const t = c.currentTime;
    const coup = (t0, dur, v, sens) => {
      const n = Math.ceil(c.sampleRate * dur); const buf = c.createBuffer(1, n, c.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) {
        const x = i / n; const env = Math.pow(Math.sin(Math.PI * Math.pow(x, 0.6)), 1.4);
        const brin = Math.random() < 0.07 ? (Math.random() * 2 - 1) : 0;
        d[i] = (brin * 0.95 + (Math.random() * 2 - 1) * 0.3) * env;
      }
      const s = c.createBufferSource(); s.buffer = buf;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1700;
      const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.Q.value = 0.9; pk.gain.value = 7;
      pk.frequency.setValueAtTime(sens > 0 ? 3000 : 5400, t0); pk.frequency.linearRampToValueAtTime(sens > 0 ? 5400 : 3000, t0 + dur);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9500;
      const g = c.createGain(); g.gain.value = v;
      s.connect(hp); hp.connect(pk); pk.connect(lp); lp.connect(g); g.connect(this.master); s.start(t0);
    };
    coup(t, 0.27, 0.2, 1); coup(t + 0.31, 0.22, 0.17, -1); coup(t + 0.58, 0.32, 0.15, 1); },
  // sac en bandoulière : fermoir de laiton (deux petits « tic » métalliques) et rabat de cuir souple qui frotte,
  sacoche(ouvre) { const c = this.get(); if (!c) return; const t = c.currentTime;
    const clic = (t0, v) => { this.tone(2900, t0, 0.05, { type: 'triangle', gain: 0.035 * v, attack: 0.002 }); this.tone(4370, t0 + 0.004, 0.035, { gain: 0.018 * v, attack: 0.002 }); this.noise(t0, 0.018, { type: 'highpass', f: 4200, gain: 0.03 * v }); };
    const rabat = (t0) => { this.noise(t0, 0.26, { f: 1250, fTo: 650, q: 0.6, gain: 0.06, attack: 0.06, grain: 0.004, soft: 3400 }); this.noise(t0 + 0.05, 0.16, { type: 'highpass', f: 3500, gain: 0.012, attack: 0.04 }); };
    if (ouvre) { clic(t, 1); clic(t + 0.07, 0.8); rabat(t + 0.12); } else { rabat(t); clic(t + 0.24, 1); clic(t + 0.3, 0.8); } },
  // un objet qu'on repose dans le sac : feutré, sans résonance
  // eau qui se déverse : souffle grave et clapotis,
  eau() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.9, { type: 'lowpass', f: 1400, fTo: 600, gain: 0.12, attack: 0.08, grain: 0.012 });
    for (let i = 0; i < 6; i++) this.tone(500 + Math.random() * 500, t + 0.1 + i * 0.12, 0.08, { to: 900 + Math.random() * 600, gain: 0.03, type: 'sine' }); },
  brosse() { const c = this.get(); if (!c) return; const t = c.currentTime;
    [0, 0.42].forEach((o) => this.noise(t + o, 0.32, { f: 2800, fTo: 4200, q: 0.8, gain: 0.05, attack: 0.06, grain: 0.0018 })); },
  croque() { const c = this.get(); if (!c) return; const t = c.currentTime;
    for (let i = 0; i < 3; i++) this.noise(t + i * 0.05, 0.05, { f: 1800 + Math.random() * 1500, q: 1.5, gain: 0.09, grain: 0.003 }); },
  rebond() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.tone(260, t, 0.22, { to: 520, gain: 0.07, type: 'triangle' }); },
  bulles() { const c = this.get(); if (!c) return; const t = c.currentTime;
    for (let i = 0; i < 6; i++) this.tone(900 + Math.random() * 900, t + i * 0.35, 0.06, { to: 1800 + Math.random() * 800, gain: 0.03 }); },
  marteau() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.09, { type: 'lowpass', f: 700, gain: 0.18 }); this.tone(180, t, 0.12, { gain: 0.08, type: 'triangle' }); },
  berceuse() { const c = this.get(); if (!c) return; const t = c.currentTime;
    [523, 659, 587, 494].forEach((f, i) => this.tone(f, t + i * 0.55, 0.9, { gain: 0.035, attack: 0.08, type: 'sine' })); },
  // berceuse de boîte à musique (environ 4 s) : quand l'écho s'endort, la musique se tait pour elle
  berceuseLongue() { const c = this.get(); if (!c) return; const t = c.currentTime + 0.05;
    const n = (k) => 261.63 * Math.pow(2, k / 12);
    // mélodie (3/4, noire = 0,3 s) : mi mi sol | mi mi sol | mi sol do' si la | la sol… puis la note tenue
    const melodie = [[4, 0], [4, 0.3], [7, 0.6], [4, 0.9], [4, 1.2], [7, 1.5], [4, 1.8], [7, 2.0], [12, 2.2], [11, 2.5], [9, 2.8], [9, 3.1], [7, 3.35]];
    melodie.forEach(([k, d]) => {
      this.tone(n(k + 12), t + d, 0.9, { gain: 0.05, attack: 0.004, send: this.bright, sendGain: 0.5 });
      this.tone(n(k + 24), t + d, 0.35, { gain: 0.012, attack: 0.002, type: 'triangle' });
    });
    // basse douce : do, fa, do, sol
    [[0, 0], [5, 0.9], [0, 1.8], [7, 2.7]].forEach(([k, d]) => this.tone(n(k - 12), t + d, 1.1, { gain: 0.03, attack: 0.08 }));
    // accord final qui s'éteint
    [0, 4, 7, 12].forEach((k, i) => this.tone(n(k + 12), t + 3.6 + i * 0.04, 1.6, { gain: 0.03, attack: 0.02, send: this.bright, sendGain: 0.6 })); },
  sacPose() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 0.08, { type: 'lowpass', f: 900, gain: 0.07, attack: 0.004 }); this.noise(t, 0.05, { f: 2400, q: 0.8, gain: 0.015 }); },

  // ——— évolution de l'écho (magie sainte) : la lumière monte, la silhouette bat, l'éclat, la nouvelle forme
  // la montée : un bourdon grave qui s'ouvre et monte, un souffle lumineux qui enfle (durée en secondes)
  evoMontee(dur) { const c = this.get(); if (!c) return; const t = c.currentTime; dur = dur || 6;
    [[65.41, 0], [98, 4], [130.81, -5]].forEach(([f, d]) => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2, t + dur); o.detune.value = d;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3; lp.frequency.setValueAtTime(160, t); lp.frequency.exponentialRampToValueAtTime(2400, t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.09, t + dur * 0.97); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
      o.connect(lp); lp.connect(g); g.connect(this.master); const s = c.createGain(); s.gain.value = 0.5; g.connect(s); s.connect(this.bright);
      o.start(t); o.stop(t + dur + 0.4);
    });
    this.noise(t, dur + 0.2, { f: 500, fTo: 7000, q: 0.7, gain: 0.07, attack: dur * 0.9, send: this.bright, sendGain: 0.7 });
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093];
    for (let i = 0; i < 18; i++) { const u = i / 17; this.tone(notes[Math.floor(Math.random() * (2 + u * 5))], t + 0.3 + u * dur * 0.9, 0.9, { gain: 0.012 + 0.016 * u, attack: 0.01, send: this.bright, sendGain: 0.8 }); } },
  // un battement de la silhouette : une petite note de verre, de plus en plus aiguë
  evoBattement(i) { const c = this.get(); if (!c) return; const t = c.currentTime; i = i || 0;
    const f = 440 * Math.pow(2, Math.min(i, 24) / 12);
    this.tone(f, t, 0.18, { type: 'triangle', gain: 0.035, attack: 0.004, lp: 5000, send: this.bright, sendGain: 0.5 });
    this.tone(f * 2, t, 0.1, { gain: 0.012, attack: 0.003 }); },
  // l'éclat : un coup de cristal et de souffle, une basse qui tient
  evoEclat() { const c = this.get(); if (!c) return; const t = c.currentTime;
    this.noise(t, 1.6, { type: 'highpass', f: 2400, gain: 0.16, attack: 0.004, send: this.bright, sendGain: 1 });
    this.noise(t, 0.5, { type: 'lowpass', f: 300, gain: 0.25, attack: 0.002 });
    this.tone(55, t, 2.4, { gain: 0.14, attack: 0.01, to: 41 });
    [1046.5, 1318.5, 1567.98, 2093, 2637].forEach((f, i) => this.tone(f, t + i * 0.012, 2.6, { gain: 0.04, attack: 0.003, send: this.bright, sendGain: 0.9 })); },
  // la révélation : un arpège clair qui retombe en accord, chaud et tenu
  evoRevelation() { const c = this.get(); if (!c) return; const t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) => this.tone(f, t + i * 0.11, 2.2, { gain: 0.04, attack: 0.01, lp: 6000, send: this.bright, sendGain: 0.7 }));
    [130.81, 196, 261.63, 329.63].forEach((f) => this.tone(f, t + 0.5, 4.2, { gain: 0.04, attack: 0.6, send: this.bright, sendGain: 0.6 }));
    this.noise(t + 0.4, 2.5, { f: 3000, fTo: 8000, q: 0.5, gain: 0.03, attack: 0.8, send: this.bright, sendGain: 0.7 }); }
};
