// Génère la page d'essai des voix (outils/voix/essai-voix.html), un seul fichier HTML autonome :
// le gabarit outils/voix/modele.html + le moteur des voix du jeu (src/moteur/voix/moteur-voix.js, embarqué tel quel,
// sans ses « export ») + la liste des PNJ (contenu/personnages/*.json). `npm run voix` ; le test tests/voix.test.ts
// vérifie que la page est à jour (moteur ou fiches modifiés : relancer la commande).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '../..');
export const CHEMIN_PAGE = join(ici, 'essai-voix.html');

export function construirePage() {
  const modele = readFileSync(join(ici, 'modele.html'), 'utf8');
  const moteur = readFileSync(join(racine, 'src/moteur/voix/moteur-voix.js'), 'utf8').replace(/^export /gm, '');
  const dossier = join(racine, 'contenu/personnages');
  const pnj = readdirSync(dossier).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const d = JSON.parse(readFileSync(join(dossier, f), 'utf8'));
    return { id: d.id, nom: d.nom, encre: d.encre, voix: d.voix };
  }).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  // fonctions de remplacement : le moteur contient des « $ » qu'un remplacement par chaîne interpréterait
  return modele
    .replace('/*@MOTEUR@*/', () => moteur)
    .replace('/*@PNJ@*/[]', () => JSON.stringify(pnj, null, 1).replace(/</g, '\\u003c'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(CHEMIN_PAGE, construirePage());
  console.log(`Page d'essai des voix écrite : ${CHEMIN_PAGE}`);
}
