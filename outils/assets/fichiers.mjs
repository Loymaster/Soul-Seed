// Opérations sur les fichiers d'assets : déplacer (en gardant l'historique git),
// mettre de côté, et répercuter un déplacement dans tout le contenu qui y fait référence.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ICI = path.dirname(new URL(import.meta.url).pathname);
export const RACINE_PROJET = path.resolve(ICI, '../..');
export const RACINE_ASSETS = path.join(RACINE_PROJET, 'public/assets');
export const A_TRIER = '_a-trier';
export const CORBEILLE = '_corbeille';

/** Dossiers où l'on cherche (et met à jour) les références aux assets. */
const DOSSIERS_REFERENCES = ['contenu', 'src'];
const EXTENSIONS_TEXTE = new Set(['.scene', '.json', '.ts', '.tsx', '.css', '.md', '.txt']);

/** Résout un chemin relatif à public/assets en refusant toute sortie du dossier. */
export function absolu(relatif) {
  const abs = path.resolve(RACINE_ASSETS, relatif);
  if (abs !== RACINE_ASSETS && !abs.startsWith(RACINE_ASSETS + path.sep)) {
    throw new Error(`Chemin hors des assets : ${relatif}`);
  }
  return abs;
}

export function relatif(abs) {
  return path.relative(RACINE_ASSETS, abs).split(path.sep).join('/');
}

function suiviParGit(abs) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', abs], { cwd: RACINE_PROJET, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function* fichiersTexte(dossier) {
  if (!fs.existsSync(dossier)) return;
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'generes') continue;
    const abs = path.join(dossier, e.name);
    if (e.isDirectory()) yield* fichiersTexte(abs);
    else if (EXTENSIONS_TEXTE.has(path.extname(e.name))) yield abs;
  }
}

/** Liste les fichiers (contenu, code) qui mentionnent un asset, avec les lignes concernées. */
export function usages(cheminAsset) {
  const res = [];
  for (const d of DOSSIERS_REFERENCES) {
    for (const f of fichiersTexte(path.join(RACINE_PROJET, d))) {
      const lignes = fs.readFileSync(f, 'utf8').split('\n');
      const trouvees = [];
      lignes.forEach((l, i) => { if (l.includes(cheminAsset)) trouvees.push({ ligne: i + 1, texte: l.trim().slice(0, 160) }); });
      if (trouvees.length) res.push({ fichier: path.relative(RACINE_PROJET, f), lignes: trouvees });
    }
  }
  return res;
}

/** Remplace toutes les mentions d'un chemin d'asset par un autre dans le contenu et le code. */
export function repercuter(ancien, nouveau) {
  const modifies = [];
  for (const d of DOSSIERS_REFERENCES) {
    for (const f of fichiersTexte(path.join(RACINE_PROJET, d))) {
      const avant = fs.readFileSync(f, 'utf8');
      if (!avant.includes(ancien)) continue;
      fs.writeFileSync(f, avant.split(ancien).join(nouveau));
      modifies.push(path.relative(RACINE_PROJET, f));
    }
  }
  return modifies;
}

/**
 * Déplace un asset (chemins relatifs à public/assets). Garde l'historique git si le fichier est suivi,
 * crée les dossiers nécessaires, supprime les dossiers vidés et met à jour les références.
 */
export function deplacer(depuis, vers, { essai = false, ecraser = false } = {}) {
  const src = absolu(depuis);
  const dst = absolu(vers);
  if (!fs.existsSync(src)) throw new Error(`Introuvable : ${depuis}`);
  if (src === dst) return { depuis, vers, references: [] };
  if (fs.existsSync(dst) && !ecraser) throw new Error(`Un fichier existe déjà à ${vers}`);
  if (essai) return { depuis, vers, references: usages(depuis).map((u) => u.fichier), essai: true };
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (suiviParGit(src)) execFileSync('git', ['mv', ...(ecraser ? ['-f'] : []), src, dst], { cwd: RACINE_PROJET });
  else fs.renameSync(src, dst);
  nettoyerDossiersVides(path.dirname(src));
  const references = repercuter(depuis, vers);
  return { depuis, vers, references };
}

/** Met un asset de côté dans public/assets/_corbeille (jamais de suppression définitive). */
export function mettreDeCote(chemin) {
  const horodatage = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const cible = `${CORBEILLE}/${horodatage}--${chemin.replace(/\//g, '__')}`;
  const src = absolu(chemin);
  fs.mkdirSync(absolu(CORBEILLE), { recursive: true });
  fs.renameSync(src, absolu(cible));
  nettoyerDossiersVides(path.dirname(src));
  return { chemin, cible, references: usages(chemin).map((u) => u.fichier) };
}

function nettoyerDossiersVides(dossier) {
  let d = dossier;
  while (d.startsWith(RACINE_ASSETS + path.sep) && path.basename(d) !== A_TRIER) {
    if (fs.readdirSync(d).filter((f) => f !== '.DS_Store').length) break;
    fs.rmSync(d, { recursive: true });
    d = path.dirname(d);
  }
}

/** Écrit un fichier reçu (téléversement) dans la boîte à trier, sans jamais écraser. */
export function deposer(nom, contenu, normaliser) {
  const dossier = absolu(A_TRIER);
  fs.mkdirSync(dossier, { recursive: true });
  const propre = normaliser(nom);
  const ext = path.extname(propre);
  let cible = path.join(dossier, propre);
  for (let n = 2; fs.existsSync(cible); n++) cible = path.join(dossier, `${propre.slice(0, -ext.length)}-${n}${ext}`);
  fs.writeFileSync(cible, contenu);
  return relatif(cible);
}
