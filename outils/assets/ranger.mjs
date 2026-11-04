// Range les assets posés « en vrac » (à la racine de public/assets ou dans public/assets/_a-trier)
// selon les règles de regles.mjs, en mettant à jour les références dans le contenu.
//
// Usage : node outils/assets/ranger.mjs            → range tout ce qui est reconnu
//         node outils/assets/ranger.mjs --essai    → affiche ce qui serait fait, sans rien déplacer
import fs from 'node:fs';
import path from 'node:path';
import { chargerPNJ, destination } from './regles.mjs';
import { RACINE_ASSETS, A_TRIER, deplacer, relatif } from './fichiers.mjs';

/** Fichiers en attente de rangement (chemins relatifs à public/assets). */
export function enAttente() {
  const res = [];
  for (const dossier of [RACINE_ASSETS, path.join(RACINE_ASSETS, A_TRIER)]) {
    if (!fs.existsSync(dossier)) continue;
    for (const f of fs.readdirSync(dossier)) {
      const abs = path.join(dossier, f);
      if (f.startsWith('.') || fs.statSync(abs).isDirectory()) continue;
      res.push(relatif(abs));
    }
  }
  return res;
}

/** Range tous les fichiers en attente qu'une règle reconnaît. */
export function rangerTout({ essai = false } = {}) {
  const pnj = chargerPNJ();
  const bilan = { ranges: [], inconnus: [], conflits: [] };
  for (const chemin of enAttente()) {
    const cible = destination(path.basename(chemin), pnj);
    if (!cible) { bilan.inconnus.push(chemin); continue; }
    try {
      bilan.ranges.push(deplacer(chemin, cible, { essai }));
    } catch (e) {
      bilan.conflits.push({ chemin, cible, raison: e.message });
    }
  }
  return bilan;
}

if (process.argv[1] && process.argv[1].endsWith('ranger.mjs')) {
  const essai = process.argv.includes('--essai');
  const b = rangerTout({ essai });
  for (const r of b.ranges) console.log(`${essai ? '[essai] ' : ''}${r.depuis} → ${r.vers}${r.references.length ? `  (références mises à jour : ${r.references.join(', ')})` : ''}`);
  console.log(`${b.ranges.length} fichier(s) ${essai ? 'à ranger' : 'rangé(s)'}`);
  if (b.inconnus.length) console.log('Sans règle (restent à trier) :', b.inconnus.join(', '));
  for (const c of b.conflits) console.log(`Conflit : ${c.chemin} → ${c.cible} : ${c.raison}`);
}
