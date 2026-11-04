// Vérifie toutes les scènes (contenu/scenes/*.scene) avec le même moteur que le jeu et l'atelier.
// Usage : npx tsx outils/scenes/verifier.ts   (lancé par « npm run verifier » et « npm run build »)
// Sort en erreur s'il reste au moins une erreur (personnage, expression, décor, scène inconnus, ligne illisible…).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Catalogue } from '../../src/contenu/types';
import { contexteScenes } from '../../src/contenu/contexte';
import { verifierSource } from '../../src/moteur/scene/valider';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalogue = JSON.parse(fs.readFileSync(path.join(racine, 'contenu/generes/assets.json'), 'utf8')) as Catalogue;
const dossier = path.join(racine, 'contenu/scenes');
const scenes = fs.existsSync(dossier)
  ? fs.readdirSync(dossier).filter((f) => f.endsWith('.scene')).map((f) => ({ id: f.slice(0, -6), source: fs.readFileSync(path.join(dossier, f), 'utf8') }))
  : [];

let erreurs = 0, alertes = 0;
for (const s of scenes) {
  const { problemes } = verifierSource(s.source, s.id, contexteScenes(catalogue, scenes, s.id));
  for (const p of problemes) {
    if (p.niveau === 'info') continue;
    if (p.niveau === 'erreur') erreurs++; else alertes++;
    console.log(`${p.niveau === 'erreur' ? '✗' : '!'} contenu/scenes/${s.id}.scene:${p.ligne}  ${p.message}`);
  }
}
console.log(`scènes : ${scenes.length} vérifiée(s) — ${erreurs} erreur(s), ${alertes} alerte(s)`);
if (erreurs) process.exit(1);
