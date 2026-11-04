// Catalogue automatique des assets de Soul Seed.
//
// Parcourt public/assets, analyse chaque fichier (dimensions, transparence, boîte utile pour rogner
// les marges transparentes, empreinte pour repérer les doublons), lui attribue un rôle, rattache les
// fichiers aux PNJ et aux échos, synchronise les fiches de personnages et dresse la liste des problèmes.
//
// Résultat : contenu/generes/assets.json (lu par le jeu et par l'atelier).
// Un cache (contenu/generes/.cache-assets.json) évite de ré-analyser les fichiers inchangés.
//
// Usage : node outils/assets/catalogue.mjs            → génère le catalogue
//         node outils/assets/catalogue.mjs --strict   → échoue s'il reste des erreurs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { CATEGORIES, STADES_ECHO, chargerPNJ, destination, normaliserNom, DOSSIER_FICHES } from './regles.mjs';
import { RACINE_ASSETS, RACINE_PROJET, A_TRIER, CORBEILLE, relatif } from './fichiers.mjs';

const DOSSIER_GENERES = path.join(RACINE_PROJET, 'contenu/generes');
export const FICHIER_CATALOGUE = path.join(DOSSIER_GENERES, 'assets.json');
const FICHIER_CACHE = path.join(DOSSIER_GENERES, '.cache-assets.json');
const VERSION_ANALYSE = 3; // à incrémenter quand l'analyse change, pour invalider le cache

const IMAGES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif']);
const SONS = new Set(['.mp3', '.ogg', '.wav', '.m4a']);

/** Lignées d'échos : lettre utilisée dans les noms de fichiers → identifiant et libellé. */
export const LIGNEES = {
  j: { id: 'joy', nom: 'Joie' },
  w: { id: 'wrath', nom: 'Colère' },
  s: { id: 'sorrow', nom: 'Tristesse' },
  f: { id: 'fear', nom: 'Peur' },
  d: { id: 'disgust', nom: 'Dégoût' },
  n: { id: 'neutre', nom: 'Neutre' }
};
const LETTRE = Object.fromEntries(Object.entries(LIGNEES).map(([l, v]) => [v.id, l]));
const ELEMENTS = { vent: 'Vent', feu: 'Feu', eau: 'Eau', terre: 'Terre', foudre: 'Foudre', ether: 'Éther' };

/** Valeurs d'une nouvelle fiche de PNJ (réglables ensuite dans l'atelier). */
const FICHE_PAR_DEFAUT = {
  encre: '#2B2118',
  taille: 1.65,
  visible: 1,
  miroirADroite: true,
  voix: { note: 330, rythme: 1, timbre: 'doux' }
};

/** Réglages connus des premiers personnages (issus du prototype de scène). */
const AMORCES_FICHES = {
  myhra: { encre: '#3f6a3a', taille: 1.9, visible: 1, voix: { note: 349, rythme: 1.2, timbre: 'doux' } },
  jumpy: { encre: '#9c3b2a', taille: 1.3, visible: 0.86, voix: { note: 494, rythme: 0.78, timbre: 'vif' }, defaut: 'face' },
  garry: { encre: '#2f4a7a', taille: 1.7, visible: 1, voix: { note: 196, rythme: 1.3, timbre: 'grave' }, defaut: 'face' }
};

// ---------------------------------------------------------------------------------------------
// Analyse des fichiers

function lireJSON(f, defaut) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return defaut; }
}

function* parcourir(dossier) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const abs = path.join(dossier, e.name);
    if (e.isDirectory()) {
      if (e.name === CORBEILLE) continue;
      yield* parcourir(abs);
    } else yield abs;
  }
}

async function analyserImage(abs, ext) {
  const meta = await sharp(abs, { animated: ext === '.gif' }).metadata();
  const l = meta.width;
  const h = meta.pageHeight || meta.height;
  const res = { l, h, alpha: !!meta.hasAlpha, images: meta.pages || 1 };
  // Analyse sur une version réduite : largement assez précis pour rogner et mesurer la transparence.
  const { data, info } = await sharp(abs, { pages: 1 })
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  let transparents = 0, x0 = W, y0 = H, x1 = -1, y1 = -1, r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const a = data[i + 3];
      if (a < 16) { transparents++; continue; }
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (a > 200) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
    }
  }
  res.transparence = +(transparents / (W * H)).toFixed(3);
  if (x1 < 0) {
    res.boite = { x: 0, y: 0, l: 0, h: 0 };
  } else {
    const sx = l / W, sy = h / H;
    // marge d'un pixel réduit pour ne jamais rogner le contour
    const bx = Math.max(0, Math.floor((x0 - 1) * sx)), by = Math.max(0, Math.floor((y0 - 1) * sy));
    res.boite = { x: bx, y: by, l: Math.min(l, Math.ceil((x1 + 2) * sx)) - bx, h: Math.min(h, Math.ceil((y1 + 2) * sy)) - by };
  }
  if (n) {
    const hex = (v) => Math.round(v / n).toString(16).padStart(2, '0');
    res.couleur = `#${hex(r)}${hex(g)}${hex(b)}`;
  }
  return res;
}

function empreinte(abs) {
  return crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 16);
}

// ---------------------------------------------------------------------------------------------
// Classement : catégorie, rôle, rattachement aux échos et aux PNJ

/** Décrit une forme d'écho d'après son nom de fichier (joy, dark-fear, branch-j-dd, melee-jwf…). */
export function decrireForme(stade, base) {
  if (stade === 'graines') return { type: 'graine', lignees: [base], sombre: false, nom: `Graine · ${LIGNEES[LETTRE[base]]?.nom || base}` };
  let m;
  if ((m = base.match(/^(dark-)?(joy|wrath|sorrow|fear|disgust|neutre)(?:-(f|m))?$/))) {
    const lig = LIGNEES[LETTRE[m[2]]];
    return {
      type: m[1] ? 'sombre' : 'pure', lignees: [lig.id], sombre: !!m[1], genre: m[3] || undefined,
      nom: `${lig.nom}${m[1] ? ' sombre' : ''}${m[3] ? (m[3] === 'f' ? ' · féminin' : ' · masculin') : ''}`
    };
  }
  if ((m = base.match(/^branch-([jwsfdn])-d([jwsfdn])$/))) {
    return { type: 'branche', lignees: [LIGNEES[m[1]].id, LIGNEES[m[2]].id], sombre: false, nom: `Branche ${LIGNEES[m[1]].nom} › ${LIGNEES[m[2]].nom} sombre` };
  }
  if ((m = base.match(/^melee-([jwsfdn]{3})$/))) {
    const l = [...m[1]].map((c) => LIGNEES[c]);
    return { type: 'melee', lignees: l.map((x) => x.id), sombre: false, nom: `Mêlée ${l.map((x) => x.nom).join(' · ')}` };
  }
  if ((m = base.match(/^memoire-([jwsfdn])-([a-z]+)$/))) {
    return { type: 'memoire', lignees: [LIGNEES[m[1]].id], element: m[2], sombre: false, nom: `Mémoire ${LIGNEES[m[1]].nom} · ${ELEMENTS[m[2]] || m[2]}` };
  }
  if ((m = base.match(/^fragment-([a-z]+)$/))) {
    return { type: 'fragment', lignees: [], sombre: false, nom: `Fragment ${m[1]}` };
  }
  return { type: 'autre', lignees: [], sombre: false, nom: base };
}

function roleDe(entree) {
  const { categorie, chemin, ext } = entree;
  if (SONS.has(ext)) return 'musique';
  if (ext === '.gif') return 'animation';
  const base = path.basename(chemin, ext);
  switch (categorie) {
    case 'pnj':
      if (base === 'portrait-relations') return 'vignette';
      if (!entree.alpha || entree.transparence < 0.02) return 'illustration';
      if (entree.l >= 1400 && entree.transparence > 0.85) return 'calque';
      return 'expression';
    case 'echos': return chemin.startsWith('echos/graines/') ? 'graine' : chemin === 'echos/ame.png' ? 'ame' : 'forme';
    case 'joueur': return 'portrait';
    case 'decors': return 'decor';
    case 'interface': return 'icone';
    case 'emotions': return 'emotion';
    case 'objets': return 'objet';
    case 'activites': return 'activite';
    case 'animations': return 'animation';
    case 'sons': return 'musique';
    default: return 'inconnu';
  }
}

// ---------------------------------------------------------------------------------------------
// Fiches de personnages

function synchroniserFiches(pnjAssets, pnjConnus, diagnostics, { ecrire }) {
  const fiches = {};
  fs.mkdirSync(DOSSIER_FICHES, { recursive: true });
  const ids = new Set([...Object.keys(pnjAssets), ...fs.readdirSync(DOSSIER_FICHES).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))]);
  for (const id of [...ids].sort()) {
    const fichier = path.join(DOSSIER_FICHES, `${id}.json`);
    const existe = fs.existsSync(fichier);
    const brut = existe ? fs.readFileSync(fichier, 'utf8') : null;
    let fiche;
    if (existe) {
      try { fiche = JSON.parse(brut); } catch (e) {
        diagnostics.push({ niveau: 'erreur', code: 'FICHE_ILLISIBLE', message: `La fiche de ${id} n'est pas un JSON valide (${e.message}).`, fiche: id });
        continue;
      }
    } else {
      fiche = { id, nom: pnjConnus[id]?.nom || id, prefixes: pnjConnus[id]?.prefixes || [id], ...structuredClone(FICHE_PAR_DEFAUT), ...structuredClone(AMORCES_FICHES[id] || {}) };
    }
    const a = pnjAssets[id] || { expressions: [], vignette: null, illustrations: [], calques: [] };
    fiche.id = id;
    fiche.nom ??= id;
    fiche.prefixes ??= [id];
    fiche.expressions ??= {};
    // Nouveaux fichiers d'expression : ajoutés automatiquement sous le nom du fichier.
    const dejaUtilises = new Set(Object.values(fiche.expressions));
    for (const chemin of a.expressions) {
      if (dejaUtilises.has(chemin)) continue;
      let cle = path.basename(chemin, path.extname(chemin));
      while (fiche.expressions[cle]) cle += '-bis';
      fiche.expressions[cle] = chemin;
    }
    // Expressions dont le fichier a disparu : signalées, jamais effacées en silence.
    for (const [cle, chemin] of Object.entries(fiche.expressions)) {
      if (!a.expressions.includes(chemin) && !a.illustrations.includes(chemin)) {
        diagnostics.push({ niveau: 'erreur', code: 'EXPRESSION_INTROUVABLE', message: `${fiche.nom} : l'expression « ${cle} » pointe vers ${chemin}, qui n'existe plus.`, fiche: id, cle, chemin });
      }
    }
    if (a.vignette) fiche.vignette = a.vignette;
    else delete fiche.vignette;
    const cles = Object.keys(fiche.expressions);
    if (!fiche.defaut || !fiche.expressions[fiche.defaut]) {
      fiche.defaut = ['neutre', 'face', 'sprite'].find((c) => fiche.expressions[c]) || cles[0] || null;
    }
    if (!cles.length) {
      diagnostics.push({ niveau: 'alerte', code: 'PNJ_SANS_EXPRESSION', message: `${fiche.nom} n'a encore aucune image utilisable en dialogue.`, fiche: id });
    }
    if (!a.vignette && cles.length) {
      diagnostics.push({ niveau: 'info', code: 'PNJ_SANS_VIGNETTE', message: `${fiche.nom} n'a pas de vignette (portrait-relations.png).`, fiche: id });
    }
    const ordonnee = ordonnerFiche(fiche);
    const texte = JSON.stringify(ordonnee, null, 2) + '\n';
    if (ecrire && texte !== brut) fs.writeFileSync(fichier, texte);
    fiches[id] = { ...ordonnee, nouvelle: !existe };
  }
  return fiches;
}

const ORDRE_FICHE = ['id', 'nom', 'prefixes', 'encre', 'taille', 'visible', 'miroirADroite', 'voix', 'visage', 'defaut', 'expressions', 'vignette', 'notes'];
function ordonnerFiche(f) {
  const o = {};
  for (const k of ORDRE_FICHE) if (f[k] !== undefined) o[k] = f[k];
  for (const k of Object.keys(f)) if (!(k in o) && k !== 'nouvelle') o[k] = f[k];
  return o;
}

// ---------------------------------------------------------------------------------------------
// Génération

export async function genererCatalogue({ ecrire = true, journal = () => {} } = {}) {
  const debut = Date.now();
  fs.mkdirSync(DOSSIER_GENERES, { recursive: true });
  const cache = lireJSON(FICHIER_CACHE, {});
  const cacheValide = cache.version === VERSION_ANALYSE ? cache.fichiers || {} : {};
  const nouveauCache = {};
  const pnjConnus = chargerPNJ();
  const diagnostics = [];
  const assets = [];
  let analyses = 0;

  for (const abs of parcourir(RACINE_ASSETS)) {
    const chemin = relatif(abs);
    const ext = path.extname(chemin).toLowerCase();
    const st = fs.statSync(abs);
    const cle = `${st.size}:${Math.round(st.mtimeMs)}`;
    let analyse = cacheValide[chemin]?.cle === cle ? cacheValide[chemin].analyse : null;
    if (!analyse) {
      analyse = { empreinte: empreinte(abs) };
      if (IMAGES.has(ext)) {
        try { Object.assign(analyse, await analyserImage(abs, ext)); } catch (e) { analyse.erreur = e.message; }
      }
      analyses++;
    }
    nouveauCache[chemin] = { cle, analyse };
    const morceaux = chemin.split('/');
    const enVrac = morceaux.length === 1 || morceaux[0] === A_TRIER;
    const categorie = enVrac ? '_a_trier' : CATEGORIES[morceaux[0]] ? morceaux[0] : 'inconnue';
    const entree = {
      chemin, url: `/assets/${chemin}`, ext, categorie,
      sousCategorie: !enVrac && morceaux.length > 2 ? morceaux.slice(1, -1).join('/') : undefined,
      octets: st.size, modifie: Math.round(st.mtimeMs),
      ...analyse
    };
    entree.type = IMAGES.has(ext) ? (ext === '.gif' ? 'animation' : 'image') : SONS.has(ext) ? 'son' : 'autre';
    entree.role = enVrac ? 'a-trier' : roleDe(entree);
    if (categorie === 'pnj') entree.pnj = { id: morceaux[1], variante: path.basename(chemin, ext) };
    if (categorie === 'echos' && morceaux.length === 3) {
      entree.echo = { stade: morceaux[1], forme: path.basename(chemin, ext), ...decrireForme(morceaux[1], path.basename(chemin, ext)) };
    }
    if (enVrac) entree.suggestion = destination(path.basename(chemin), pnjConnus);
    assets.push(entree);

    // Diagnostics propres au fichier
    if (analyse.erreur) diagnostics.push({ niveau: 'erreur', code: 'ILLISIBLE', message: `Impossible de lire l'image (${analyse.erreur}).`, chemin });
    if (enVrac) {
      diagnostics.push({ niveau: 'alerte', code: 'A_TRIER', message: entree.suggestion ? `À ranger — destination proposée : ${entree.suggestion}` : 'À ranger — aucune règle ne reconnaît ce nom, choisissez sa place.', chemin, suggestion: entree.suggestion });
    } else if (categorie === 'inconnue') {
      diagnostics.push({ niveau: 'alerte', code: 'DOSSIER_INCONNU', message: `Le dossier « ${morceaux[0]} » ne fait partie d'aucune catégorie.`, chemin });
    }
    const nomPropre = normaliserNom(path.basename(chemin));
    if (!enVrac && nomPropre !== path.basename(chemin)) {
      diagnostics.push({ niveau: 'alerte', code: 'NOM', message: `Nom non conforme (majuscules, espaces ou accents). Proposé : ${nomPropre}`, chemin, suggestion: [...morceaux.slice(0, -1), nomPropre].join('/') });
    }
    if (entree.type === 'image' && st.size > 3 * 1024 * 1024) {
      diagnostics.push({ niveau: 'info', code: 'LOURD', message: `Fichier lourd (${(st.size / 1048576).toFixed(1)} Mo) : penser à le compresser avant la sortie.`, chemin });
    }
    if (entree.role === 'expression' && entree.boite && entree.boite.h && entree.boite.h / entree.h < 0.8) {
      diagnostics.push({ niveau: 'info', code: 'MARGES', message: `Le personnage n'occupe que ${Math.round((100 * entree.boite.h) / entree.h)} % de la hauteur de l'image : le moteur rogne automatiquement, mais un fichier recadré serait plus léger.`, chemin });
    }
  }

  // Doublons (même contenu à plusieurs endroits)
  const parEmpreinte = {};
  for (const a of assets) (parEmpreinte[a.empreinte] ||= []).push(a.chemin);
  for (const chemins of Object.values(parEmpreinte)) {
    if (chemins.length > 1) {
      for (const a of assets) if (chemins.includes(a.chemin)) a.doublons = chemins.filter((c) => c !== a.chemin);
      diagnostics.push({ niveau: 'alerte', code: 'DOUBLON', message: `Fichiers identiques : ${chemins.join(', ')}`, chemin: chemins[0], chemins });
    }
  }

  // PNJ
  const pnjAssets = {};
  for (const a of assets) {
    if (!a.pnj) continue;
    const p = (pnjAssets[a.pnj.id] ||= { expressions: [], vignette: null, illustrations: [], calques: [] });
    if (a.role === 'expression') p.expressions.push(a.chemin);
    else if (a.role === 'vignette') p.vignette = a.chemin;
    else if (a.role === 'illustration') p.illustrations.push(a.chemin);
    else if (a.role === 'calque') p.calques.push(a.chemin);
  }
  for (const id of Object.keys(pnjAssets)) {
    if (!pnjConnus[id]) diagnostics.push({ niveau: 'info', code: 'PNJ_NOUVEAU', message: `Nouveau PNJ détecté : « ${id} ». Une fiche a été créée, pensez à lui donner un nom et une voix.`, fiche: id });
  }
  const fiches = synchroniserFiches(pnjAssets, pnjConnus, diagnostics, { ecrire });
  const pnj = {};
  for (const [id, fiche] of Object.entries(fiches)) pnj[id] = { ...fiche, assets: pnjAssets[id] || { expressions: [], vignette: null, illustrations: [], calques: [] } };

  // Échos jouables
  const formes = {};
  for (const a of assets) if (a.echo) (formes[a.echo.stade] ||= []).push(a.chemin);
  const echos = { stades: STADES_ECHO, formes };
  // Lacunes : chaque lignée devrait exister, pure et sombre, à chaque stade (bébé → adulte).
  for (const stade of ['bebe', 'enfant', 'adolescent', 'adulte']) {
    const presentes = new Set(assets.filter((a) => a.echo?.stade === stade).map((a) => `${a.echo.type}:${a.echo.lignees[0]}`));
    for (const { id, nom } of Object.values(LIGNEES)) {
      for (const type of ['pure', 'sombre']) {
        if (!presentes.has(`${type}:${id}`)) diagnostics.push({ niveau: 'info', code: 'ECHO_LACUNE', message: `Écho ${stade} : forme ${nom}${type === 'sombre' ? ' sombre' : ''} absente.`, stade, lignee: id, type });
      }
    }
  }
  for (const type of ['branche']) {
    const ado = new Set(assets.filter((a) => a.echo?.stade === 'adolescent' && a.echo.type === type).map((a) => a.echo.forme));
    const adu = new Set(assets.filter((a) => a.echo?.stade === 'adulte' && a.echo.type === type).map((a) => a.echo.forme));
    for (const f of ado) if (!adu.has(f)) diagnostics.push({ niveau: 'info', code: 'ECHO_LACUNE', message: `La branche ${f} existe adolescente mais pas adulte.`, stade: 'adulte', forme: f });
    for (const f of adu) if (!ado.has(f)) diagnostics.push({ niveau: 'info', code: 'ECHO_LACUNE', message: `La branche ${f} existe adulte mais pas adolescente.`, stade: 'adolescent', forme: f });
  }

  const compte = {};
  for (const a of assets) compte[a.categorie] = (compte[a.categorie] || 0) + 1;
  const catalogue = {
    version: 1,
    genereLe: new Date().toISOString(),
    categories: CATEGORIES,
    lignees: LIGNEES,
    compte,
    assets: assets.sort((x, y) => x.chemin.localeCompare(y.chemin)),
    pnj,
    echos,
    diagnostics
  };
  if (ecrire) {
    const texte = JSON.stringify(catalogue);
    const avant = fs.existsSync(FICHIER_CATALOGUE) ? fs.readFileSync(FICHIER_CATALOGUE, 'utf8') : '';
    // On n'écrit que si quelque chose a changé (hors date), pour ne pas relancer inutilement le rechargement.
    if (avant.replace(/"genereLe":"[^"]*"/, '') !== texte.replace(/"genereLe":"[^"]*"/, '')) fs.writeFileSync(FICHIER_CATALOGUE, texte);
    fs.writeFileSync(FICHIER_CACHE, JSON.stringify({ version: VERSION_ANALYSE, fichiers: nouveauCache }));
  }
  journal(`catalogue : ${assets.length} assets (${analyses} analysés) en ${Date.now() - debut} ms — ${diagnostics.filter((d) => d.niveau === 'erreur').length} erreur(s), ${diagnostics.filter((d) => d.niveau === 'alerte').length} alerte(s)`);
  return catalogue;
}

if (process.argv[1] && process.argv[1].endsWith('catalogue.mjs')) {
  const cat = await genererCatalogue({ journal: console.log });
  const parCode = {};
  for (const d of cat.diagnostics) parCode[`${d.niveau} ${d.code}`] = (parCode[`${d.niveau} ${d.code}`] || 0) + 1;
  for (const [k, n] of Object.entries(parCode).sort()) console.log(`  ${k} × ${n}`);
  if (process.argv.includes('--strict') && cat.diagnostics.some((d) => d.niveau === 'erreur')) {
    for (const d of cat.diagnostics.filter((x) => x.niveau === 'erreur')) console.error(`✗ ${d.message}${d.chemin ? ` (${d.chemin})` : ''}`);
    process.exit(1);
  }
}
