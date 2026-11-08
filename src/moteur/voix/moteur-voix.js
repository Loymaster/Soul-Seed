// Moteur des voix de dialogue de Soul Seed : de petits sons synthétisés (Web Audio, aucun fichier) joués
// pendant qu'une réplique s'écrit lettre à lettre. Chaque PNJ choisit sa voix dans sa fiche (champ « voix »).
//
// SOURCE UNIQUE : le jeu l'importe (src/moteur/voix/index.ts, qui la type et la branche sur SFX) et la page
// d'essai outils/voix/essai-voix.html l'embarque telle quelle (régénérée par `npm run voix`). Ce fichier ne doit
// donc rien importer et ne rien toucher en dehors de l'AudioContext qu'on lui donne.
//
// Un « environnement » E = { ctx, sortie, clair? } : le contexte audio, le nœud où brancher le son sec
// (le volume général des bruitages) et, s'il existe, une réverbe claire (registre « magie sainte »).

/** Gammes : degrés en demi-tons dans une octave (null = hauteur libre, sans gamme). */
export const GAMMES = {
  penta: { nom: 'Pentatonique (douce)', degres: [0, 2, 4, 7, 9] },
  majeure: { nom: 'Majeure', degres: [0, 2, 4, 5, 7, 9, 11] },
  mineure: { nom: 'Mineure (mélancolique)', degres: [0, 2, 3, 5, 7, 8, 10] },
  chromatique: { nom: 'Chromatique (tous les demi-tons)', degres: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  libre: { nom: 'Libre (sans gamme)', degres: null }
};

/** Quand une note est jouée pendant l'écriture. */
export const CADENCES = {
  lettre: 'à chaque lettre',
  syllabe: 'à chaque syllabe',
  mot: 'à chaque mot'
};

export const FAMILLES = {
  clochettes: 'Clochettes et lames',
  cordes: 'Cordes pincées',
  vents: 'Vents',
  voix: 'Voix et créatures',
  synthe: 'Synthés',
  classiques: 'Timbres d’origine',
  special: 'Voix particulières'
};

/** Réglages communs à toutes les voix (repli quand une fiche ou un préréglage ne précise rien). */
export const REGLAGES_DEFAUT = { note: 392, variation: 9, gamme: 'penta', rythme: 1, duree: 1, cadence: 'lettre', volume: 1 };

/**
 * Bibliothèque des voix. Chaque voix : un instrument (synthèse ci-dessous) et ses réglages par défaut
 *   note      hauteur de base (Hz)
 *   variation étendue des hauteurs au-dessus de la note de base (demi-tons, 0 = recto tono)
 *   gamme     gamme dans laquelle les hauteurs sont prises (GAMMES)
 *   rythme    multiplicateur des pauses entre les lettres (> 1 : parle plus lentement)
 *   duree     multiplicateur de la durée de chaque note
 *   cadence   lettre | syllabe | mot
 *   volume    multiplicateur du volume (0 à 2)
 */
export const VOIX = {
  // — clochettes et lames
  'boite-a-musique': { nom: 'Boîte à musique', famille: 'clochettes', instrument: 'boiteMusique', note: 784, variation: 12, gamme: 'penta', rythme: 1.1, duree: 1, cadence: 'syllabe', volume: 1, description: 'Petites lames d’acier pincées, un tintement fragile qui reste en l’air.' },
  celesta: { nom: 'Célesta', famille: 'clochettes', instrument: 'celesta', note: 659, variation: 9, gamme: 'majeure', rythme: 1, duree: 1, cadence: 'syllabe', volume: 1, description: 'Clavier de lames claires : féerique, rond, un peu magique.' },
  'cloche-verre': { nom: 'Cloche de verre', famille: 'clochettes', instrument: 'clocheVerre', note: 880, variation: 7, gamme: 'penta', rythme: 1.25, duree: 1, cadence: 'mot', volume: 1, description: 'Verre frotté, notes longues qui se superposent : éthéré.' },
  carillon: { nom: 'Carillon', famille: 'clochettes', instrument: 'carillon', note: 523, variation: 7, gamme: 'majeure', rythme: 1.2, duree: 1, cadence: 'mot', volume: 1, description: 'Cloches tubulaires, partiels métalliques : solennel, ancien.' },
  xylophone: { nom: 'Xylophone', famille: 'clochettes', instrument: 'xylophone', note: 880, variation: 9, gamme: 'penta', rythme: 0.9, duree: 1, cadence: 'lettre', volume: 1, description: 'Lames de bois dur frappées : sec, brillant, enjoué.' },
  marimba: { nom: 'Marimba', famille: 'clochettes', instrument: 'marimba', note: 392, variation: 9, gamme: 'penta', rythme: 1, duree: 1, cadence: 'syllabe', volume: 1, description: 'Lames de bois et tubes résonnants : chaud, rond, sympathique.' },
  kalimba: { nom: 'Kalimba', famille: 'clochettes', instrument: 'kalimba', note: 523, variation: 9, gamme: 'penta', rythme: 1, duree: 1, cadence: 'syllabe', volume: 1, description: 'Piano à pouces : lames de métal sur une caisse de bois, doux et rêveur.' },
  bois: { nom: 'Bloc de bois', famille: 'clochettes', instrument: 'bois', note: 660, variation: 5, gamme: 'penta', rythme: 0.95, duree: 1, cadence: 'syllabe', volume: 1, description: 'Petit « toc » de bois creux : pressé, affairé, artisan.' },
  // — cordes pincées
  harpe: { nom: 'Harpe pincée', famille: 'cordes', instrument: 'harpe', note: 392, variation: 12, gamme: 'majeure', rythme: 1.1, duree: 1, cadence: 'syllabe', volume: 1, description: 'Corde pincée du bout des doigts, qui chante longtemps : noble, bienveillant.' },
  pizzicato: { nom: 'Pizzicato', famille: 'cordes', instrument: 'pizzicato', note: 330, variation: 9, gamme: 'mineure', rythme: 0.95, duree: 1, cadence: 'syllabe', volume: 1, description: 'Violon pincé, très court : malicieux, sur la pointe des pieds.' },
  guitare: { nom: 'Guitare', famille: 'cordes', instrument: 'guitare', note: 196, variation: 9, gamme: 'penta', rythme: 1.05, duree: 1, cadence: 'syllabe', volume: 1, description: 'Corde nylon, chaude et posée : un voyageur, un conteur.' },
  banjo: { nom: 'Banjo', famille: 'cordes', instrument: 'banjo', note: 294, variation: 9, gamme: 'majeure', rythme: 0.9, duree: 1, cadence: 'syllabe', volume: 1, description: 'Corde métallique sur peau tendue : nasillard, gouailleur, campagnard.' },
  // — vents
  'flute-douce': { nom: 'Flûte douce', famille: 'vents', instrument: 'flute', note: 587, variation: 9, gamme: 'penta', rythme: 1, duree: 1, cadence: 'syllabe', volume: 1, description: 'Flûte à bec, un peu de souffle : simple, tendre.' },
  ocarina: { nom: 'Ocarina', famille: 'vents', instrument: 'ocarina', note: 523, variation: 9, gamme: 'penta', rythme: 1.05, duree: 1, cadence: 'syllabe', volume: 1, description: 'Terre cuite soufflée : son très pur, légèrement glissé, mystérieux.' },
  sifflet: { nom: 'Sifflement', famille: 'vents', instrument: 'sifflet', note: 1046, variation: 7, gamme: 'majeure', rythme: 1, duree: 1, cadence: 'syllabe', volume: 1, description: 'Quelqu’un qui siffle entre ses dents : insouciant.' },
  clarinette: { nom: 'Clarinette', famille: 'vents', instrument: 'clarinette', note: 294, variation: 9, gamme: 'mineure', rythme: 1.05, duree: 1, cadence: 'syllabe', volume: 1, description: 'Anche boisée, harmoniques impaires : rond et un peu creux, savant.' },
  basson: { nom: 'Basson grave', famille: 'vents', instrument: 'basson', note: 110, variation: 7, gamme: 'mineure', rythme: 1.2, duree: 1, cadence: 'syllabe', volume: 1, description: 'Double anche grave et nasale : bourru, âgé, solennel.' },
  kazoo: { nom: 'Mirliton', famille: 'vents', instrument: 'kazoo', note: 330, variation: 9, gamme: 'chromatique', rythme: 0.9, duree: 1, cadence: 'syllabe', volume: 1, description: 'Bourdonnement de mirliton : comique, râleur, bavard.' },
  // — voix et créatures
  'blabla-grave': { nom: 'Bla-bla grave', famille: 'voix', instrument: 'blabla', note: 110, variation: 7, gamme: 'libre', rythme: 1.1, duree: 1, cadence: 'syllabe', volume: 1, formants: 0.9, description: 'Une voix humaine imaginaire et grave : les voyelles du texte colorent chaque syllabe.' },
  'blabla-aigu': { nom: 'Bla-bla aigu', famille: 'voix', instrument: 'blabla', note: 262, variation: 9, gamme: 'libre', rythme: 0.95, duree: 1, cadence: 'syllabe', volume: 1, formants: 1.2, description: 'La même voix imaginaire, plus haute et plus vive.' },
  chuchotement: { nom: 'Chuchotement', famille: 'voix', instrument: 'chuchote', note: 330, variation: 5, gamme: 'libre', rythme: 1.15, duree: 1, cadence: 'syllabe', volume: 1, description: 'Un souffle articulé, sans voix : secret, timide ou inquiétant.' },
  grognement: { nom: 'Grognements doux', famille: 'voix', instrument: 'grogne', note: 98, variation: 5, gamme: 'libre', rythme: 1.15, duree: 1, cadence: 'syllabe', volume: 1, description: 'Petits grondements de gorge, sans méchanceté : une grosse bête placide.' },
  ronron: { nom: 'Ronronnement', famille: 'voix', instrument: 'ronron', note: 70, variation: 4, gamme: 'libre', rythme: 1.2, duree: 1, cadence: 'mot', volume: 1, description: 'Un ronron qui vibre dans la poitrine : content, endormi.' },
  gazouillis: { nom: 'Gazouillis', famille: 'voix', instrument: 'gazouille', note: 1760, variation: 9, gamme: 'libre', rythme: 0.95, duree: 1, cadence: 'syllabe', volume: 1, description: 'Petits cris d’oiseau qui montent : une créature ailée, vive.' },
  bulles: { nom: 'Bulles', famille: 'voix', instrument: 'bulles', note: 600, variation: 12, gamme: 'libre', rythme: 1, duree: 1, cadence: 'syllabe', volume: 1, description: 'Des bulles qui crèvent à la surface : aquatique, rigolo.' },
  // — synthés
  'retro-8bits': { nom: 'Synthé rétro 8 bits', famille: 'synthe', instrument: 'retro', note: 523, variation: 12, gamme: 'majeure', rythme: 0.9, duree: 1, cadence: 'lettre', volume: 1, description: 'Onde carrée de vieille console : bips enjoués.' },
  theremine: { nom: 'Thérémine', famille: 'synthe', instrument: 'theremine', note: 440, variation: 9, gamme: 'libre', rythme: 1.15, duree: 1, cadence: 'syllabe', volume: 1, description: 'Une note qui glisse d’une hauteur à l’autre, avec vibrato : étrange, d’ailleurs.' },
  orgue: { nom: 'Petit orgue', famille: 'synthe', instrument: 'orgue', note: 262, variation: 7, gamme: 'majeure', rythme: 1.1, duree: 1, cadence: 'syllabe', volume: 1, description: 'Tuyaux d’orgue à quelques jeux : posé, pieux.' },
  // — timbres d’origine (avant la bibliothèque) : gardés tels quels
  doux: { nom: 'Doux (flûte feutrée)', famille: 'classiques', instrument: 'oscillo', note: 330, variation: 9, gamme: 'penta', rythme: 1, duree: 1, cadence: 'lettre', volume: 1, timbre: { type: 'sine', lp: 1700, dur: 0.11, attack: 0.012, gain: 0.026, airGain: 0.003 }, description: 'Le timbre d’origine des PNJ : une petite note feutrée par lettre.' },
  vif: { nom: 'Vif (petit grelot)', famille: 'classiques', instrument: 'oscillo', note: 494, variation: 9, gamme: 'penta', rythme: 0.8, duree: 1, cadence: 'lettre', volume: 1, timbre: { type: 'triangle', lp: 3000, dur: 0.05, gain: 0.02, air: 4200 }, description: 'Timbre d’origine de Jumpy.' },
  grave: { nom: 'Grave (corde frottée)', famille: 'classiques', instrument: 'oscillo', note: 196, variation: 9, gamme: 'penta', rythme: 1.3, duree: 1, cadence: 'lettre', volume: 1, timbre: { type: 'sawtooth', lp: 900, dur: 0.09, attack: 0.006, gain: 0.018, body: 0.02, air: 1800, airGain: 0.004 }, description: 'Timbre d’origine de Garry.' },
  narration: { nom: 'Narration', famille: 'classiques', instrument: 'oscillo', note: 330, variation: 9, gamme: 'penta', rythme: 1.05, duree: 1, cadence: 'lettre', volume: 1, timbre: { type: 'sine', lp: 1500, dur: 0.09, attack: 0.01, gain: 0.02, airGain: 0.002 }, description: 'La voix du narrateur.' },
  boise: { nom: 'Boisé (ancien marimba)', famille: 'classiques', instrument: 'oscillo', note: 330, variation: 9, gamme: 'penta', rythme: 1, duree: 1, cadence: 'lettre', volume: 1, timbre: { type: 'triangle', lp: 1400, dur: 0.13, attack: 0.002, gain: 0.03, body: 0.012, airGain: 0.002 }, description: 'Ancien timbre boisé.' },
  souffle: { nom: 'Souffle (murmure)', famille: 'classiques', instrument: 'oscillo', note: 330, variation: 9, gamme: 'penta', rythme: 1, duree: 1, cadence: 'lettre', volume: 1, timbre: { type: 'sine', lp: 900, dur: 0.14, attack: 0.03, gain: 0.014, air: 2400, airGain: 0.012 }, description: 'Ancien timbre murmuré.' },
  // — voix particulières
  mystere: { nom: 'L’homme mystérieux', famille: 'special', instrument: 'mystere', note: 196, variation: 9, gamme: 'penta', rythme: 1, duree: 1, cadence: 'mot', volume: 1, description: 'Une note feutrée, grave et lointaine par mot, perdue dans la réverbe claire (l’ancienne voix de l’introduction).' }
};

/** Voix utilisée quand une fiche n'en précise pas (ou nomme une voix inconnue). */
export const VOIX_PAR_DEFAUT = 'doux';

/**
 * Réglages complets d'une voix à partir de ce qu'en dit une fiche : { timbre, note?, rythme?, variation?, … }.
 * `timbre` nomme une voix de la bibliothèque ; un objet (ancien timbre « personnalisé ») est joué par l'oscillateur simple.
 * Tout réglage absent vient de la voix choisie, puis de REGLAGES_DEFAUT.
 */
export function reglagesVoix(voix) {
  const v = typeof voix === 'string' ? { timbre: voix } : (voix || {});
  const perso = v.timbre && typeof v.timbre === 'object';
  const base = perso ? { ...VOIX[VOIX_PAR_DEFAUT], timbre: v.timbre } : (VOIX[v.timbre] || VOIX[VOIX_PAR_DEFAUT]);
  const r = { ...REGLAGES_DEFAUT, ...base };
  for (const k of ['note', 'variation', 'gamme', 'rythme', 'duree', 'cadence', 'volume']) if (v[k] !== undefined && v[k] !== null) r[k] = v[k];
  r.id = perso ? 'perso' : (VOIX[v.timbre] ? v.timbre : VOIX_PAR_DEFAUT);
  return r;
}

// ———————————————————————————————————————— découpage du texte

const LETTRE = /[\p{L}\p{N}]/u;
const VOYELLES = 'aeiouyàâäéèêëîïôöùûüœæ';
const estLettre = (c) => !!c && LETTRE.test(c);
const estVoyelle = (c) => !!c && VOYELLES.includes(c.toLowerCase());
const FIN_PHRASE = /[.?!…]/;

/** Pause (ms) après une lettre, avant le rythme de la voix : la ponctuation fait respirer la phrase. */
export function pauseApres(ch) {
  if (ch === '…') return 320;
  if (ch === '.' || ch === '?' || ch === '!') return 240;
  if (ch === ',' || ch === ';' || ch === ':') return 130;
  if (ch === ' ') return 34;
  return 26;
}

/** Couleur de voyelle (pour les voix formantiques) d'un groupe de lettres. */
export function voyelleDe(groupe) {
  const g = (groupe || '').toLowerCase();
  if (/eau|au|[oôö]/.test(g) && !/ou/.test(g)) return 'o';
  if (/ou/.test(g)) return 'ou';
  if (/oi/.test(g)) return 'a';
  if (/eu|œ/.test(g)) return 'eu';
  if (/ai|ei|[èêëæ]/.test(g)) return 'è';
  if (/é/.test(g)) return 'é';
  if (/[aàâä]/.test(g)) return 'a';
  if (/[iîïy]/.test(g)) return 'i';
  if (/[uùûü]/.test(g)) return 'u';
  if (/e/.test(g)) return 'e';
  return 'e';
}

/**
 * La lettre i du texte déclenche-t-elle une note avec cette cadence ? Si oui : { cle, voyelle, question, exclamation },
 * où `cle` (la lettre, la syllabe ou le mot) fixe la hauteur : un même mot sonne toujours pareil.
 */
export function unite(texte, i, cadence) {
  const ch = texte[i];
  if (!estLettre(ch)) return null;
  const prec = texte[i - 1];
  let debut = i, fin = i + 1;
  if (cadence === 'mot') {
    if (estLettre(prec)) return null;
    while (estLettre(texte[fin])) fin++;
  } else if (cadence === 'syllabe') {
    if (estVoyelle(ch)) {
      if (estVoyelle(prec)) return null;
      while (estLettre(texte[debut - 1]) && !estVoyelle(texte[debut - 1])) debut--;
      while (estVoyelle(texte[fin])) fin++;
    } else {
      // un mot sans voyelle (« Hm », « Pff ») sonne sur sa première lettre
      if (estLettre(prec)) return null;
      let j = i; while (estLettre(texte[j])) { if (estVoyelle(texte[j])) return null; j++; }
      fin = j;
    }
  }
  const cle = texte.slice(debut, fin);
  // intonation : la dernière unité d'une question monte, celle d'une exclamation est appuyée
  let j = i, dernier = true;
  while (j < texte.length && !FIN_PHRASE.test(texte[j])) { if (j > i && texte[j] === ' ' && estLettre(texte[j + 1])) dernier = false; j++; }
  return { cle, voyelle: voyelleDe(cle), question: dernier && texte[j] === '?', exclamation: dernier && texte[j] === '!' };
}

/** Empreinte stable d'une unité (la formule des anciens timbres pour une lettre seule, pour qu'ils sonnent pareil). */
function empreinte(cle) {
  if (cle.length === 1) return cle.charCodeAt(0) * 7;
  let h = 0; for (let k = 0; k < cle.length; k++) h = (h * 31 + cle.toLowerCase().charCodeAt(k) * 7) >>> 0;
  return h;
}

/** Hauteur (Hz) d'une unité pour ces réglages. */
export function hauteur(r, u) {
  const h = empreinte(u.cle);
  let demiTons;
  const g = GAMMES[r.gamme] || GAMMES.penta;
  if (!g.degres) demiTons = ((h % 997) / 996) * Math.max(0, r.variation);
  else {
    const possibles = [];
    for (let oct = 0; oct * 12 <= r.variation; oct++) for (const d of g.degres) if (oct * 12 + d <= r.variation) possibles.push(oct * 12 + d);
    demiTons = possibles[h % possibles.length];
  }
  if (u.question) demiTons += 4;
  return r.note * Math.pow(2, demiTons / 12);
}

// ———————————————————————————————————————— briques de synthèse

const caches = new WeakMap();
function cache(ctx) {
  let c = caches.get(ctx);
  if (!c) { c = { cordes: new Map(), bruit: null, pulse: null }; caches.set(ctx, c); }
  return c;
}
function bruitBlanc(ctx) {
  const c = cache(ctx); if (c.bruit) return c.bruit;
  const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return (c.bruit = b);
}
/** Onde carrée « 8 bits » à rapport cyclique de 25 %. */
function ondePulse(ctx) {
  const c = cache(ctx); if (c.pulse) return c.pulse;
  const n = 32, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
  return (c.pulse = ctx.createPeriodicWave(re, im));
}

/** Branche un nœud vers la sortie sèche et, au besoin, vers la réverbe claire. */
function brancher(E, noeud, envoi) {
  noeud.connect(E.sortie);
  if (envoi && E.clair) { const s = E.ctx.createGain(); s.gain.value = envoi; noeud.connect(s); s.connect(E.clair); }
}

/** Une note d'oscillateur avec enveloppe percussive (attaque, puis extinction exponentielle). */
function note(E, f, t, dur, o) {
  const c = E.ctx; o = o || {};
  const osc = c.createOscillator();
  if (o.onde) osc.setPeriodicWave(o.onde); else osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.de || f, t);
  if (o.de) osc.frequency.exponentialRampToValueAtTime(f, t + (o.glisse || 0.03));
  if (o.vers) osc.frequency.exponentialRampToValueAtTime(o.vers, t + dur);
  if (o.detune) osc.detune.value = o.detune;
  let lfo = null;
  if (o.vibrato) {
    lfo = c.createOscillator(); lfo.frequency.value = o.vibrato.f || 6;
    const p = c.createGain(); p.gain.value = f * (o.vibrato.p || 0.006); lfo.connect(p); p.connect(osc.frequency);
  }
  const g = c.createGain(); const a = o.attaque || 0.004; const v = Math.max(0.00011, o.gain || 0.03);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a);
  if (o.tenue) g.gain.setValueAtTime(v, t + a + o.tenue);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + (o.tenue || 0) + 0.01));
  let n = osc;
  for (const fl of o.filtres || []) { const b = c.createBiquadFilter(); b.type = fl.type; b.frequency.value = fl.f; if (fl.q) b.Q.value = fl.q; if (fl.gain) b.gain.value = fl.gain; n.connect(b); n = b; }
  if (o.lp) { const b = c.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = o.lp; n.connect(b); n = b; }
  n.connect(g);
  brancher(E, g, o.envoi);
  const fin = t + dur + 0.06;
  osc.start(t); osc.stop(fin);
  if (lfo) { lfo.start(t); lfo.stop(fin); }
  return g;
}

/** Un bruit filtré (souffle, attaque, consonne). */
function souffle(E, t, dur, o) {
  const c = E.ctx; o = o || {};
  const src = c.createBufferSource(); src.buffer = bruitBlanc(c); src.loop = true;
  const fl = c.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f || 1000, t); fl.Q.value = o.q || 1;
  if (o.vers) fl.frequency.exponentialRampToValueAtTime(o.vers, t + dur);
  const g = c.createGain(); const a = o.attaque || 0.003; const v = Math.max(0.00011, o.gain || 0.01);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.01));
  src.connect(fl); fl.connect(g); brancher(E, g, o.envoi);
  src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.03);
  return g;
}

/**
 * Corde pincée (algorithme de Karplus-Strong) : un bruit bref qui boucle dans une ligne à retard filtrée.
 * La corde est calculée une fois par hauteur (à une période entière), puis accordée exactement par la vitesse de lecture.
 * brillance 0–1 (attaque douce → métallique) ; amorti 0,98–0,999 (court → long).
 */
function corde(E, f, t, dur, o) {
  const c = E.ctx; const sr = c.sampleRate;
  const periode = Math.max(2, Math.round(sr / f)); const f0 = sr / periode;
  const cle = periode + '|' + o.brillance + '|' + o.amorti + '|' + Math.round(dur * 20);
  const cc = cache(c).cordes;
  let buf = cc.get(cle);
  if (!buf) {
    const n = Math.ceil(sr * dur); buf = c.createBuffer(1, n, sr); const d = buf.getChannelData(0);
    // excitation : bruit lissé (moins de brillance = attaque plus douce)
    let y = 0; const lisse = 1 - Math.max(0.05, Math.min(1, o.brillance));
    for (let i = 0; i < periode && i < n; i++) { y = y * lisse + (Math.random() * 2 - 1) * (1 - lisse); d[i] = y; }
    for (let i = periode; i < n; i++) d[i] = o.amorti * 0.5 * (d[i - periode] + d[i - periode - 1 >= 0 ? i - periode - 1 : i - periode]);
    let max = 0; for (let i = 0; i < n; i++) max = Math.max(max, Math.abs(d[i]));
    if (max > 0) for (let i = 0; i < n; i++) d[i] /= max;
    cc.set(cle, buf);
    if (cc.size > 160) cc.delete(cc.keys().next().value);
  }
  const src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = f / f0;
  const g = c.createGain(); const v = o.gain || 0.05;
  g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = src;
  for (const fl of o.filtres || []) { const b = c.createBiquadFilter(); b.type = fl.type; b.frequency.value = fl.f; if (fl.q) b.Q.value = fl.q; if (fl.gain) b.gain.value = fl.gain; n.connect(b); n = b; }
  n.connect(g); brancher(E, g, o.envoi);
  src.start(t); src.stop(t + dur + 0.02);
}

/** Formants (Hz) des voyelles pour les voix « bla-bla » : premier et deuxième. */
const FORMANTS = { a: [780, 1250], e: [500, 1450], é: [400, 2000], è: [560, 1750], i: [290, 2250], o: [460, 850], ou: [320, 780], u: [300, 1750], eu: [420, 1450] };

let derniereHauteur = 0;

// ———————————————————————————————————————— instruments
// Chaque instrument : (E, f, t, D, V, r, u) — fréquence, instant, multiplicateur de durée, de volume, réglages, unité.

export const INSTRUMENTS = {
  boiteMusique(E, f, t, D, V) {
    note(E, f, t, 0.75 * D, { gain: 0.034 * V, attaque: 0.002, envoi: 0.45 });
    note(E, f * 2.0, t, 0.3 * D, { gain: 0.012 * V, attaque: 0.002 });
    note(E, f * 5.43, t, 0.06 * D, { gain: 0.004 * V, attaque: 0.001 });
    souffle(E, t, 0.012, { type: 'highpass', f: 6000, gain: 0.006 * V });
  },
  celesta(E, f, t, D, V) {
    note(E, f, t, 0.55 * D, { gain: 0.032 * V, attaque: 0.002, envoi: 0.5 });
    note(E, f * 2, t, 0.28 * D, { gain: 0.012 * V, attaque: 0.002, envoi: 0.3 });
    note(E, f * 4, t, 0.1 * D, { gain: 0.004 * V, attaque: 0.002 });
    note(E, f, t, 0.18 * D, { type: 'triangle', gain: 0.006 * V, attaque: 0.002, lp: 3000 });
  },
  clocheVerre(E, f, t, D, V) {
    note(E, f, t, 1.4 * D, { gain: 0.022 * V, attaque: 0.025, envoi: 0.75 });
    note(E, f * 2.32, t, 0.9 * D, { gain: 0.007 * V, attaque: 0.02, envoi: 0.6 });
    note(E, f * 4.25, t, 0.5 * D, { gain: 0.003 * V, attaque: 0.015, envoi: 0.6 });
    note(E, f * 1.003, t, 1.2 * D, { gain: 0.01 * V, attaque: 0.03, envoi: 0.6 });
  },
  carillon(E, f, t, D, V) {
    // partiels d'une cloche tubulaire : bourdon, fondamentale, tierce mineure, quinte, octave…
    [[0.5, 0.008, 1.6], [1, 0.024, 1.4], [1.19, 0.01, 1], [1.5, 0.008, 0.8], [2, 0.01, 0.7], [2.52, 0.005, 0.5], [3.01, 0.004, 0.35]]
      .forEach(([k, g, d]) => note(E, f * k, t, d * D, { gain: g * V, attaque: 0.002, envoi: 0.5, detune: k === 1.19 ? 6 : 0 }));
    souffle(E, t, 0.03, { f: f * 4, q: 3, gain: 0.006 * V });
  },
  xylophone(E, f, t, D, V) {
    note(E, f, t, 0.14 * D, { gain: 0.036 * V, attaque: 0.001, envoi: 0.15 });
    note(E, f * 3, t, 0.05 * D, { gain: 0.012 * V, attaque: 0.001 });
    souffle(E, t, 0.015, { f: f * 4, q: 4, gain: 0.012 * V });
  },
  marimba(E, f, t, D, V) {
    note(E, f, t, 0.34 * D, { gain: 0.042 * V, attaque: 0.003, lp: 2400 });
    note(E, f * 3.93, t, 0.06 * D, { gain: 0.01 * V, attaque: 0.002 });
    note(E, f / 2, t, 0.12 * D, { gain: 0.006 * V, attaque: 0.004 });
    souffle(E, t, 0.02, { type: 'lowpass', f: 900, gain: 0.01 * V });
  },
  kalimba(E, f, t, D, V) {
    note(E, f, t, 0.5 * D, { gain: 0.036 * V, attaque: 0.002, de: f * 1.012, glisse: 0.02, envoi: 0.25 });
    note(E, f * 6.1, t, 0.05 * D, { gain: 0.006 * V, attaque: 0.001 });
    note(E, f * 2, t, 0.18 * D, { gain: 0.006 * V, attaque: 0.002 });
    souffle(E, t, 0.025, { type: 'lowpass', f: 350, gain: 0.018 * V });
  },
  bois(E, f, t, D, V) {
    souffle(E, t, 0.06 * D, { f: f * 1.6, q: 18, gain: 0.09 * V, attaque: 0.001 });
    note(E, f * 1.6, t, 0.05 * D, { gain: 0.02 * V, attaque: 0.001, vers: f * 1.5 });
  },
  harpe(E, f, t, D, V) { corde(E, f, t, 1.3 * D, { brillance: 0.45, amorti: 0.997, gain: 0.05 * V, envoi: 0.4, filtres: [{ type: 'lowpass', f: 4200 }] }); },
  pizzicato(E, f, t, D, V) { corde(E, f, t, 0.28 * D, { brillance: 0.35, amorti: 0.985, gain: 0.07 * V, filtres: [{ type: 'lowpass', f: 2600 }, { type: 'peaking', f: 400, q: 1, gain: 4 }] }); },
  guitare(E, f, t, D, V) { corde(E, f, t, 0.8 * D, { brillance: 0.55, amorti: 0.995, gain: 0.06 * V, filtres: [{ type: 'lowpass', f: 3500 }, { type: 'peaking', f: 220, q: 1.2, gain: 4 }] }); },
  banjo(E, f, t, D, V) { corde(E, f, t, 0.5 * D, { brillance: 0.95, amorti: 0.99, gain: 0.05 * V, filtres: [{ type: 'highpass', f: 180 }, { type: 'peaking', f: 1900, q: 2.5, gain: 9 }] }); },
  flute(E, f, t, D, V) {
    note(E, f, t, 0.15 * D, { gain: 0.03 * V, attaque: 0.025, vibrato: { f: 5.5, p: 0.004 } });
    note(E, f * 2, t, 0.1 * D, { gain: 0.003 * V, attaque: 0.03 });
    souffle(E, t, 0.1 * D, { f: f * 2, q: 2.5, gain: 0.005 * V, attaque: 0.02 });
  },
  ocarina(E, f, t, D, V) {
    note(E, f, t, 0.17 * D, { gain: 0.034 * V, attaque: 0.02, de: f * 0.955, glisse: 0.04, lp: 1900, envoi: 0.25 });
    note(E, f * 3, t, 0.1 * D, { gain: 0.0018 * V, attaque: 0.03 });
    souffle(E, t, 0.06, { f: f * 1.5, q: 3, gain: 0.003 * V, attaque: 0.015 });
  },
  sifflet(E, f, t, D, V) {
    note(E, f, t, 0.13 * D, { gain: 0.022 * V, attaque: 0.015, de: f * 0.9, glisse: 0.035, vibrato: { f: 7, p: 0.008 } });
    souffle(E, t, 0.09, { f: f, q: 6, gain: 0.004 * V, attaque: 0.015 });
  },
  clarinette(E, f, t, D, V) {
    note(E, f, t, 0.16 * D, { type: 'square', gain: 0.014 * V, attaque: 0.02, tenue: 0.04 * D, filtres: [{ type: 'lowpass', f: Math.min(5000, f * 5), q: 0.8 }] });
  },
  basson(E, f, t, D, V) {
    note(E, f, t, 0.2 * D, { type: 'sawtooth', gain: 0.022 * V, attaque: 0.025, tenue: 0.05 * D, filtres: [{ type: 'peaking', f: 480, q: 2, gain: 10 }, { type: 'lowpass', f: 1300 }] });
  },
  kazoo(E, f, t, D, V) {
    note(E, f, t, 0.12 * D, { type: 'sawtooth', gain: 0.012 * V, attaque: 0.01, tenue: 0.03 * D, vibrato: { f: 9, p: 0.01 }, filtres: [{ type: 'highpass', f: 300 }, { type: 'peaking', f: 1300, q: 3, gain: 12 }] });
  },
  blabla(E, f, t, D, V, r, u) {
    const c = E.ctx; const dur = 0.1 * D; const k = r.formants || 1;
    const [f1, f2] = FORMANTS[u.voyelle] || FORMANTS.e;
    const osc = c.createOscillator(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f * 1.04, t); osc.frequency.exponentialRampToValueAtTime(u.question ? f * 1.12 : f * 0.93, t + dur);
    const g = c.createGain(); const v = 0.05 * V * (u.exclamation ? 1.3 : 1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.setValueAtTime(v, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const somme = c.createGain();
    [[f1 * k, 7, 1], [f2 * k, 10, 0.55]].forEach(([ff, q, a]) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; const ga = c.createGain(); ga.gain.value = a; osc.connect(b); b.connect(ga); ga.connect(somme); });
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    somme.connect(lp); lp.connect(g); brancher(E, g, 0.05);
    osc.start(t); osc.stop(t + dur + 0.05);
    souffle(E, t, 0.018, { f: 2600 * k, q: 1.5, gain: 0.004 * V });
  },
  chuchote(E, f, t, D, V, r, u) {
    const [f1, f2] = FORMANTS[u.voyelle] || FORMANTS.e; const k = f / 330;
    souffle(E, t, 0.09 * D, { f: f2 * k, q: 6, gain: 0.05 * V, attaque: 0.015 });
    souffle(E, t, 0.08 * D, { f: f1 * k, q: 5, gain: 0.03 * V, attaque: 0.02 });
    souffle(E, t, 0.03, { type: 'highpass', f: 4500, gain: 0.006 * V });
  },
  grogne(E, f, t, D, V) {
    const c = E.ctx; const dur = 0.18 * D;
    const osc = c.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f * 1.06, t); osc.frequency.exponentialRampToValueAtTime(f * 0.82, t + dur);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 3;
    const trem = c.createGain(); trem.gain.value = 0.6;
    const lfo = c.createOscillator(); lfo.frequency.value = 27; const p = c.createGain(); p.gain.value = 0.4; lfo.connect(p); p.connect(trem.gain);
    const g = c.createGain(); const v = 0.07 * V;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp); lp.connect(trem); trem.connect(g); brancher(E, g, 0);
    osc.start(t); osc.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
  },
  ronron(E, f, t, D, V) {
    const c = E.ctx; const dur = 0.32 * D;
    const src = c.createBufferSource(); src.buffer = bruitBlanc(c); src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const trem = c.createGain(); trem.gain.value = 0.5;
    const lfo = c.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 24; const p = c.createGain(); p.gain.value = 0.5; lfo.connect(p); p.connect(trem.gain);
    const g = c.createGain(); const v = 0.12 * V;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp); lp.connect(trem); trem.connect(g); brancher(E, g, 0);
    src.start(t, Math.random()); src.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    note(E, f, t, dur, { gain: 0.02 * V, attaque: 0.05, vers: f * 0.92 });
  },
  gazouille(E, f, t, D, V, r, u) {
    note(E, f, t, 0.06 * D, { gain: 0.02 * V, attaque: 0.004, vers: f * 1.5 });
    if (D >= 0.7 && (u.cle.length % 2 === 0)) note(E, f * 1.2, t + 0.07 * D, 0.05 * D, { gain: 0.015 * V, attaque: 0.004, vers: f * 1.8 });
  },
  bulles(E, f, t, D, V) {
    note(E, f, t, 0.08 * D, { gain: 0.04 * V, attaque: 0.003, vers: f * 2.6 });
    note(E, f * 0.5, t, 0.03, { gain: 0.01 * V, attaque: 0.002, vers: f * 1.2 });
  },
  retro(E, f, t, D, V, r, u) {
    const c = E.ctx; const dur = 0.07 * D;
    const osc = c.createOscillator(); osc.setPeriodicWave(ondePulse(c));
    osc.frequency.setValueAtTime(f, t); osc.frequency.setValueAtTime(u.question ? f * 1.5 : f * 1.335, t + dur * 0.45);
    const g = c.createGain(); const v = 0.016 * V;
    g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + dur * 0.9); g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g); brancher(E, g, 0); osc.start(t); osc.stop(t + dur + 0.02);
  },
  theremine(E, f, t, D, V) {
    const de = derniereHauteur > 0 && derniereHauteur < f * 3 && derniereHauteur > f / 3 ? derniereHauteur : f;
    derniereHauteur = f;
    note(E, f, t, 0.2 * D, { gain: 0.028 * V, attaque: 0.035, de, glisse: 0.06, vibrato: { f: 6.2, p: 0.009 }, envoi: 0.3 });
  },
  orgue(E, f, t, D, V) {
    [[1, 0.02], [2, 0.012], [3, 0.006], [4, 0.004]].forEach(([k, g]) => note(E, f * k, t, 0.15 * D, { gain: g * V, attaque: 0.012, tenue: 0.05 * D, envoi: 0.25 }));
  },
  // ancien moteur (SFX.typeTick) : une note colorée par un timbre { type, lp, dur, attack, gain, detune, body, air, airGain }
  oscillo(E, f, t, D, V, r) {
    const tb = r.timbre || {};
    note(E, f, t, (tb.dur || 0.07) * D, { type: tb.type || 'triangle', gain: (tb.gain || 0.022) * V, attaque: tb.attack || 0.003, lp: tb.lp || 2200, detune: tb.detune || 0 });
    if (tb.body) note(E, f / 2, t, (tb.dur || 0.07) * 1.2 * D, { gain: tb.body * V, attaque: 0.004 });
    souffle(E, t, 0.02, { f: tb.air || 3000, q: 1, gain: (tb.airGain ?? 0.006) * V, attaque: 0.001 });
  },
  // l'homme mystérieux (ancien SFX.motVoix) : une note feutrée, grave et lointaine
  mystere(E, f, t, D, V) {
    note(E, f, t, 0.9 * D, { gain: 0.011 * V, attaque: 0.05, lp: 1300, envoi: 0.8 });
  }
};

/**
 * Niveau de chaque instrument, mesuré pour que toutes les voix sonnent à peu près aussi fort que l'ancien timbre « doux »
 * sur une même phrase (rendu hors ligne d'une même phrase, OfflineAudioContext) ; les sons aigus, nasillards ou soufflés
 * sont un peu en dessous, l'oreille les entendant davantage. Les timbres d'origine et l'homme mystérieux restent tels quels.
 */
export const NIVEAUX = {
  boiteMusique: 0.51, celesta: 0.57, clocheVerre: 0.6, carillon: 0.52, xylophone: 0.68, marimba: 0.6, kalimba: 0.63, bois: 3.1,
  harpe: 0.53, pizzicato: 0.5, guitare: 0.38, banjo: 0.66,
  flute: 1.3, ocarina: 1.03, sifflet: 1.4, clarinette: 1.2, basson: 0.92, kazoo: 1.5,
  blabla: 2, chuchote: 5, grogne: 1.4, ronron: 1.5, gazouille: 1.9, bulles: 1.3,
  retro: 1.2, theremine: 1.2, orgue: 0.77
};

/**
 * Fait parler une voix pour la lettre i du texte (appelé à chaque lettre écrite).
 * Renvoie vrai si une note a été jouée (selon la cadence, beaucoup de lettres restent muettes).
 */
export function direLettre(E, texte, i, voix) {
  if (!E || !E.ctx) return false;
  const r = voix && voix.instrument ? voix : reglagesVoix(voix);
  const u = unite(texte, i, r.cadence);
  if (!u) return false;
  const instrument = INSTRUMENTS[r.instrument] || INSTRUMENTS.oscillo;
  const V = Math.max(0, Math.min(2, r.volume ?? 1)) * (u.exclamation ? 1.15 : 1) * (NIVEAUX[r.instrument] ?? 1);
  instrument(E, hauteur(r, u), E.ctx.currentTime + 0.005, Math.max(0.2, r.duree ?? 1), V, r, u);
  return true;
}

/**
 * Sortie autonome (page d'essai) : volume général et réverbe claire, comme le moteur de bruitages du jeu (sfx-impl.js).
 * niveau : volume des bruitages (0–1).
 */
export function creerSortie(ctx, niveau) {
  const sortie = ctx.createGain(); sortie.gain.value = 0.6 * (niveau ?? 0.8); sortie.connect(ctx.destination);
  const sec = 2.6, len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let y = 0; for (let i = 0; i < len; i++) { const x = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); y = y * 0.15 + x * 0.85; d[i] = y; } }
  const clair = ctx.createConvolver(); clair.buffer = b;
  const g = ctx.createGain(); g.gain.value = 0.7; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
  clair.connect(lp); lp.connect(g); g.connect(sortie);
  return { ctx, sortie, clair };
}
