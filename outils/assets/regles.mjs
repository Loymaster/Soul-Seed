// Règles de classement des assets de Soul Seed.
// Une seule source de vérité : le script de rangement, le catalogue et la boîte « à trier »
// de l'atelier utilisent tous ces règles.
//
// Les PNJ connus sont lus dans contenu/personnages/<id>.json (champ « prefixes »).
// La liste ci-dessous ne sert qu'à amorcer ces fiches la première fois.
import fs from 'node:fs';
import path from 'node:path';

const ICI = path.dirname(new URL(import.meta.url).pathname);
export const DOSSIER_FICHES = path.resolve(ICI, '../../contenu/personnages');

/** PNJ d'amorçage : identifiant → nom et préfixes de fichiers (alias historiques compris). */
export const PNJ_AMORCE = {
  myhra: { nom: 'Myhra', prefixes: ['myhra', 'myrha', 'gardienne'] },
  jumpy: { nom: 'Jumpy', prefixes: ['jumpy'] },
  garry: { nom: 'Garry', prefixes: ['garry'] },
  ash: { nom: 'Ash', prefixes: ['ash'] },
  bourbella: { nom: 'Bourbella', prefixes: ['bourbella'] },
  tourby: { nom: 'Tourby', prefixes: ['tourby'] },
  hevann: { nom: 'Hevann', prefixes: ['hevann'] },
  maiko: { nom: 'Maïko', prefixes: ['maiko'] },
  karla: { nom: 'Karla', prefixes: ['karla'] },
  'lady-roger': { nom: 'Lady Roger', prefixes: ['lady-roger'] },
  nyxara: { nom: 'Nyxara', prefixes: ['nyxara'] },
  morthen: { nom: 'Morthen', prefixes: ['morthen'] },
  phil: { nom: 'Phil', prefixes: ['phil'] },
  hibert: { nom: 'Hibert', prefixes: ['hibert'] },
  finn: { nom: 'Finn', prefixes: ['finn'] },
  glamp: { nom: 'Glamp', prefixes: ['glamp'] },
  grimp: { nom: 'Grimp', prefixes: ['grimp'] },
  vinland: { nom: 'Vinland', prefixes: ['vinland'] },
  'homme-mysterieux': { nom: 'Homme mystérieux', prefixes: ['homme-mysterieux'] }
};

/** Catégories (dossiers de premier niveau sous public/assets) et leur libellé. */
export const CATEGORIES = {
  echos: 'Échos jouables',
  pnj: 'PNJ',
  joueur: 'Joueur',
  decors: 'Décors',
  interface: 'Interface',
  objets: 'Objets',
  emotions: 'Émotions',
  activites: 'Activités du ranch',
  animations: 'Animations',
  sons: 'Sons',
  _a_trier: 'À trier'
};

/** PNJ connus : fiches existantes, complétées par la liste d'amorçage. */
export function chargerPNJ() {
  const pnj = {};
  for (const [id, def] of Object.entries(PNJ_AMORCE)) pnj[id] = { nom: def.nom, prefixes: [...def.prefixes] };
  if (fs.existsSync(DOSSIER_FICHES)) {
    for (const f of fs.readdirSync(DOSSIER_FICHES)) {
      if (!f.endsWith('.json')) continue;
      try {
        const fiche = JSON.parse(fs.readFileSync(path.join(DOSSIER_FICHES, f), 'utf8'));
        const id = f.slice(0, -5);
        pnj[id] = { nom: fiche.nom || id, prefixes: fiche.prefixes?.length ? fiche.prefixes : [id] };
      } catch { /* fiche illisible : signalée par le catalogue */ }
    }
  }
  return pnj;
}

/** Stades de vie des échos jouables, dans l'ordre. */
export const STADES_ECHO = ['graines', 'bebe', 'enfant', 'adolescent', 'adulte'];

/** Transforme un nom quelconque en nom de fichier conforme : minuscules, sans accents ni espaces. */
export function normaliserNom(nom) {
  const i = nom.lastIndexOf('.');
  const ext = i > 0 ? nom.slice(i).toLowerCase() : '';
  const base = (i > 0 ? nom.slice(0, i) : nom)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (base || 'sans-nom') + ext;
}

const STADES = { bebe: 'bebe', enfant: 'enfant', ado: 'adolescent', adulte: 'adulte' };

/** Règles par préfixe : [préfixe, dossier de destination, renommage du reste du nom]. */
const PREFIXES = [
  ['seed-', 'echos/graines'],
  ['exploration-', 'decors/exploration'],
  ['ranch-', 'decors/ranch'],
  ['village-', 'decors/village'],
  ['fond-', 'decors/fonds'],
  ['boutique-', 'decors/boutique'],
  ['atelier-', 'decors/atelier'],
  ['foret-', 'decors/foret'],
  ['icon-', 'interface/icones'],
  ['etat-', 'interface/etats'],
  ['status-', 'interface/statuts'],
  ['ordre-', 'interface/ordres'],
  ['tech-', 'interface/techniques'],
  ['hud-', 'interface/hud'],
  ['action-', 'interface/actions'],
  ['activite-', 'interface/activites'],
  ['food-', 'objets/nourriture'],
  ['item-', 'objets/divers'],
  ['fish-', 'objets/poissons'],
  ['curio-', 'objets/curiosites'],
  ['material-', 'objets/materiaux'],
  ['creature-', 'objets/creatures'],
  ['emotion-', 'emotions'],
  ['barriere-', 'activites/barriere'],
  ['cachette-', 'activites/cachette'],
  ['corvee-', 'activites/corvees'],
  ['entrainement-', 'activites/entrainement'],
  ['music-', 'sons/musiques'],
  ['anim-', 'animations'],
  ['avatar-', 'joueur']
];

/** Fichiers isolés, nommés explicitement. */
const EXPLICITES = {
  'ame.png': 'echos/ame.png',
  'player-joueur.png': 'joueur/joueur.png',
  'player-joueuse.png': 'joueur/joueuse.png',
  'menu-affiche.png': 'decors/menu/affiche.png',
  'paysage-mort.png': 'decors/fonds/mort.png',
  'anim-fond-ranch.png': 'decors/ranch/hd.png',
  'sanctuaire-village.png': 'decors/village/sanctuaire.png',
  'metier-boutique.png': 'decors/boutique/metier.png',
  'foin-botte.png': 'activites/corvees/foin-botte.png',
  'poule-course.png': 'activites/corvees/poule-course.png',
  'seau-eau.png': 'activites/corvees/seau-eau.png',
  'potager-vide.png': 'activites/ranch/potager-vide.png',
  'poop.png': 'activites/ranch/dejection.png',
  'vomi.png': 'activites/ranch/vomi.png',
  'phil-hibert-cabane.png': 'pnj/phil/hibert-cabane.png'
};

/**
 * Propose une destination (chemin relatif à public/assets) pour un nom de fichier.
 * Renvoie null si aucune règle ne s'applique : le fichier reste « à trier ».
 */
export function destination(nomFichier, pnj = chargerPNJ()) {
  const nom = normaliserNom(nomFichier);
  if (EXPLICITES[nom]) return EXPLICITES[nom];
  const ext = nom.slice(nom.lastIndexOf('.'));
  const base = nom.slice(0, -ext.length);
  // Échos jouables : stade-… (bebe-, enfant-, ado-, adulte-)
  for (const [p, dossier] of Object.entries(STADES)) {
    if (base.startsWith(p + '-')) return `echos/${dossier}/${base.slice(p.length + 1)}${ext}`;
  }
  // PNJ : identifiant (ou alias) en préfixe ; le reste devient le nom de la variante
  const candidats = [];
  for (const [id, def] of Object.entries(pnj)) for (const pre of def.prefixes) candidats.push([pre, id]);
  candidats.sort((a, b) => b[0].length - a[0].length);
  for (const [pre, id] of candidats) {
    if (base === pre) return `pnj/${id}/neutre${ext}`;
    if (base.startsWith(pre + '-')) {
      const reste = base.slice(pre.length + 1);
      return `pnj/${id}/${reste}${ext}`;
    }
  }
  for (const [pre, dossier] of PREFIXES) {
    if (base.startsWith(pre)) return `${dossier}/${base.slice(pre.length)}${ext}`;
  }
  return null;
}
