// Plugin Vite de l'atelier de Soul Seed.
//
// En développement :
//  - surveille public/assets et contenu/personnages ; à chaque ajout, suppression ou modification,
//    régénère le catalogue (et range automatiquement les nouveaux fichiers si l'option est active),
//    puis prévient l'atelier ouvert dans le navigateur ;
//  - expose une petite API (/__atelier/…) pour déplacer, ranger, déposer, mettre de côté
//    et enregistrer les fiches de personnages directement dans les fichiers du projet.
// Au build : génère le catalogue et échoue s'il reste des erreurs (fichier manquant, fiche invalide…).
import fs from 'node:fs';
import path from 'node:path';
import { genererCatalogue } from '../assets/catalogue.mjs';
import { rangerTout, enAttente } from '../assets/ranger.mjs';
import { deplacer, mettreDeCote, deposer, usages, RACINE_PROJET, RACINE_ASSETS, absolu } from '../assets/fichiers.mjs';
import { normaliserNom, DOSSIER_FICHES } from '../assets/regles.mjs';

const FICHIER_REGLAGES = path.join(RACINE_PROJET, 'contenu/atelier.json');
const REGLAGES_PAR_DEFAUT = { rangementAuto: false };

function lireReglages() {
  try { return { ...REGLAGES_PAR_DEFAUT, ...JSON.parse(fs.readFileSync(FICHIER_REGLAGES, 'utf8')) }; } catch { return { ...REGLAGES_PAR_DEFAUT }; }
}

function lireCorps(req, brut = false) {
  return new Promise((ok, ko) => {
    const morceaux = [];
    req.on('data', (c) => morceaux.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(morceaux);
      if (brut) return ok(buf);
      try { ok(buf.length ? JSON.parse(buf.toString('utf8')) : {}); } catch (e) { ko(e); }
    });
    req.on('error', ko);
  });
}

const ID_VALIDE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function atelier() {
  let catalogue = null;
  let enCours = null;
  let relance = false;
  let serveur = null;
  let commande = 'serve';
  const journal = (m) => serveur?.config.logger.info(`\x1b[33m[atelier]\x1b[0m ${m}`, { timestamp: true });

  /** Régénère le catalogue ; les demandes reçues pendant une génération sont regroupées. */
  async function regenerer(raison) {
    if (enCours) { relance = true; return enCours; }
    enCours = (async () => {
      do {
        relance = false;
        const avant = new Set((catalogue?.assets || []).map((a) => a.chemin));
        let ranges = [];
        if (lireReglages().rangementAuto && enAttente().length) {
          const b = rangerTout();
          ranges = b.ranges.map((r) => r.vers);
          if (ranges.length) journal(`rangement automatique : ${b.ranges.map((r) => `${r.depuis} → ${r.vers}`).join(', ')}`);
        }
        catalogue = await genererCatalogue({ journal });
        const apres = new Set(catalogue.assets.map((a) => a.chemin));
        const nouveaux = [...apres].filter((c) => !avant.has(c));
        const disparus = [...avant].filter((c) => !apres.has(c));
        if (avant.size) serveur?.ws.send({ type: 'custom', event: 'atelier:catalogue', data: { raison, nouveaux, disparus, ranges, genereLe: catalogue.genereLe } });
      } while (relance);
    })().finally(() => { enCours = null; });
    return enCours;
  }

  let minuteur = null;
  function planifier(raison) {
    clearTimeout(minuteur);
    minuteur = setTimeout(() => regenerer(raison), 250);
  }

  const routes = {
    'GET /catalogue': async () => { if (!catalogue) await regenerer('demande'); return catalogue; },
    'POST /regenerer': async () => { await regenerer('demande'); return catalogue; },
    'GET /usages': async (_c, url) => usages(url.searchParams.get('chemin') || ''),
    'GET /reglages': async () => lireReglages(),
    'POST /reglages': async (corps) => {
      const r = { ...lireReglages(), ...corps };
      fs.writeFileSync(FICHIER_REGLAGES, JSON.stringify(r, null, 2) + '\n');
      planifier('réglages');
      return r;
    },
    'POST /deplacer': async ({ depuis, vers, ecraser }) => {
      const cible = vers.split('/').map((m, i, t) => (i === t.length - 1 ? normaliserNom(m) : normaliserNom(m).replace(/\.[^.]*$/, ''))).join('/');
      const r = deplacer(depuis, cible, { ecraser });
      await regenerer('déplacement');
      return r;
    },
    'POST /deplacer-plusieurs': async ({ operations }) => {
      const faits = [], erreurs = [];
      for (const { depuis, vers } of operations) {
        try { faits.push(deplacer(depuis, vers)); } catch (e) { erreurs.push({ depuis, vers, raison: e.message }); }
      }
      await regenerer('déplacement');
      return { faits, erreurs };
    },
    'POST /ranger-tout': async () => { const b = rangerTout(); await regenerer('rangement'); return b; },
    'POST /mettre-de-cote': async ({ chemins }) => {
      const r = chemins.map((c) => mettreDeCote(c));
      // Une image mise de côté depuis l'atelier n'a plus rien à faire dans les fiches : on l'en retire.
      for (const f of fs.existsSync(DOSSIER_FICHES) ? fs.readdirSync(DOSSIER_FICHES) : []) {
        if (!f.endsWith('.json')) continue;
        const abs = path.join(DOSSIER_FICHES, f);
        try {
          const fiche = JSON.parse(fs.readFileSync(abs, 'utf8'));
          const avant = Object.keys(fiche.expressions || {}).length;
          for (const [cle, ch] of Object.entries(fiche.expressions || {})) if (chemins.includes(ch)) delete fiche.expressions[cle];
          if (Object.keys(fiche.expressions || {}).length !== avant) fs.writeFileSync(abs, JSON.stringify(fiche, null, 2) + '\n');
        } catch { /* fiche illisible : signalée par le catalogue */ }
      }
      await regenerer('mise de côté');
      return r;
    },
    'POST /fiche': async ({ id, fiche }) => {
      if (!ID_VALIDE.test(id)) throw new Error(`Identifiant invalide : ${id}`);
      fs.mkdirSync(DOSSIER_FICHES, { recursive: true });
      const propre = { ...fiche, id };
      delete propre.assets; delete propre.nouvelle;
      fs.writeFileSync(path.join(DOSSIER_FICHES, `${id}.json`), JSON.stringify(propre, null, 2) + '\n');
      await regenerer('fiche');
      return catalogue.pnj[id];
    },
    'POST /pnj': async ({ id, nom, prefixes }) => {
      if (!ID_VALIDE.test(id)) throw new Error('Identifiant invalide : minuscules, chiffres et tirets uniquement (ex. « vieux-pecheur »).');
      const f = path.join(DOSSIER_FICHES, `${id}.json`);
      if (fs.existsSync(f)) throw new Error(`Le PNJ « ${id} » existe déjà.`);
      fs.mkdirSync(DOSSIER_FICHES, { recursive: true });
      fs.writeFileSync(f, JSON.stringify({ id, nom: nom || id, prefixes: prefixes?.length ? prefixes : [id] }, null, 2) + '\n');
      fs.mkdirSync(absolu(`pnj/${id}`), { recursive: true });
      await regenerer('nouveau PNJ');
      return catalogue.pnj[id];
    },
    'POST /deposer': async (_c, url, req) => {
      const nom = url.searchParams.get('nom');
      if (!nom) throw new Error('Nom de fichier manquant');
      const contenu = await lireCorps(req, true);
      const chemin = deposer(nom, contenu, normaliserNom);
      return { chemin };
    }
  };

  return {
    name: 'soul-seed-atelier',

    configResolved(config) { commande = config.command; },

    configureServer(server) {
      serveur = server;
      const surveilles = [RACINE_ASSETS, DOSSIER_FICHES];
      server.watcher.add(surveilles);
      const pertinent = (f) => surveilles.some((d) => f.startsWith(d + path.sep)) && !path.basename(f).startsWith('.');
      for (const ev of ['add', 'unlink', 'change', 'addDir', 'unlinkDir']) {
        server.watcher.on(ev, (f) => { if (pertinent(f)) planifier(`${ev} ${path.relative(RACINE_PROJET, f)}`); });
      }
      regenerer('démarrage');

      server.middlewares.use('/__atelier', async (req, res) => {
        const url = new URL(req.url, 'http://local');
        const route = routes[`${req.method} ${url.pathname}`];
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (!route) { res.statusCode = 404; return res.end(JSON.stringify({ erreur: 'Route inconnue' })); }
        try {
          const corps = req.method === 'POST' && url.pathname !== '/deposer' ? await lireCorps(req) : {};
          const r = await route(corps, url, req);
          res.end(JSON.stringify(r ?? null));
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ erreur: e.message }));
        }
      });
    },

    async buildStart() {
      if (commande !== 'build') return; // en développement, le catalogue est géré par le serveur ci-dessus
      const cat = await genererCatalogue({ journal: (m) => console.log(`[atelier] ${m}`) });
      const erreurs = cat.diagnostics.filter((d) => d.niveau === 'erreur');
      if (erreurs.length) this.error(`Le catalogue d'assets contient ${erreurs.length} erreur(s) :\n${erreurs.map((d) => ` - ${d.message}${d.chemin ? ` (${d.chemin})` : ''}`).join('\n')}`);
      const enVrac = cat.diagnostics.filter((d) => d.code === 'A_TRIER');
      if (enVrac.length) this.warn(`${enVrac.length} asset(s) encore à trier : ils ne seront pas inclus dans le jeu.`);
    },

    closeBundle() {
      if (commande !== 'build') return;
      // Les dossiers de travail ne partent pas avec le jeu.
      for (const d of ['_a-trier', '_corbeille']) fs.rmSync(path.join(RACINE_PROJET, 'dist/assets', d), { recursive: true, force: true });
    }
  };
}
