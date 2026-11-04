// L'atelier de Soul Seed : l'outil de développement qui trie et règle tout le contenu du jeu.
// Il se met à jour tout seul : un fichier ajouté, déplacé ou modifié dans le projet y apparaît aussitôt.
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, useCatalogue, type EvenementCatalogue, type Reglages } from './api';
import { Icone, nomFichier } from './commun';
import { VueAssets, type Filtre } from './VueAssets';
import { VuePersonnages } from './VuePersonnages';
import { VueEchos } from './VueEchos';
import { VueDiagnostics } from './VueDiagnostics';
import { SFX } from '@/moteur/sfx';

type Vue = 'assets' | 'personnages' | 'echos' | 'diagnostics';
interface Note { id: number; message: string; details?: string; genre?: 'ok' | 'erreur' }

/** L'adresse garde la vue et l'élément ouverts : on retrouve sa place après un rechargement. */
function lireAdresse(): { vue: Vue; arg: string | null; filtre: Filtre } {
  const [vue, ...reste] = location.hash.replace(/^#\/?/, '').split('/');
  const arg = reste.length ? decodeURIComponent(reste.join('/')) : null;
  const v = (['assets', 'personnages', 'echos', 'diagnostics'] as Vue[]).includes(vue as Vue) ? (vue as Vue) : 'assets';
  const filtre: Filtre = v === 'assets' && arg && !arg.includes('.') ? { categorie: arg.split('/')[0], sous: arg.split('/')[1] || null } : { categorie: null, sous: null };
  return { vue: v, arg, filtre };
}

export function Atelier() {
  const depart = lireAdresse();
  const [vue, setVue] = useState<Vue>(depart.vue);
  const [filtre, setFiltre] = useState<Filtre>(depart.filtre);
  const [assetChoisi, setAssetChoisi] = useState<string | null>(depart.vue === 'assets' && depart.arg?.includes('.') ? depart.arg : null);
  const [pnjChoisi, setPnjChoisi] = useState<string | null>(depart.vue === 'personnages' ? depart.arg : null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [recents, setRecents] = useState<Set<string>>(new Set());
  const [depot, setDepot] = useState(false);
  const [reglages, setReglages] = useState<Reglages | null>(null);
  const compteur = useRef(0);

  const notifier = useCallback((message: string, details?: string, genre?: 'ok' | 'erreur') => {
    const id = ++compteur.current;
    setNotes((n) => [...n.slice(-4), { id, message, details, genre }]);
    setTimeout(() => setNotes((n) => n.filter((x) => x.id !== id)), genre === 'erreur' ? 7000 : 4200);
    if (genre === 'ok') SFX.stamp();
  }, []);

  const surChangement = useCallback((e: EvenementCatalogue) => {
    const arrives = e.nouveaux;
    if (arrives.length) {
      setRecents((r) => new Set([...r, ...arrives]));
      setTimeout(() => setRecents((r) => { const n = new Set(r); arrives.forEach((c) => n.delete(c)); return n; }), 60000);
      // Une notification seulement pour ce qui arrive de l'extérieur (pas pour nos propres déplacements).
      if (e.raison.startsWith('add') || e.raison === 'rangement' || e.ranges.length) {
        notifier(
          arrives.length === 1 ? `Nouvel asset : ${nomFichier(arrives[0])}` : `${arrives.length} nouveaux assets`,
          e.ranges.length ? `Rangés automatiquement : ${e.ranges.slice(0, 3).join(', ')}${e.ranges.length > 3 ? '…' : ''}` : arrives.slice(0, 3).join(', ')
        );
      }
    }
  }, [notifier]);

  const { catalogue, erreur, chargement, recharger } = useCatalogue(surChangement);

  useEffect(() => { api.reglages().then(setReglages).catch(() => {}); }, []);

  useEffect(() => {
    const arg = vue === 'assets' ? assetChoisi || (filtre.categorie ? [filtre.categorie, filtre.sous].filter(Boolean).join('/') : '') : vue === 'personnages' ? pnjChoisi || '' : '';
    history.replaceState(null, '', `#/${vue}${arg ? '/' + arg : ''}`);
  }, [vue, assetChoisi, pnjChoisi, filtre]);

  // Dépôt de fichiers n'importe où dans l'atelier → boîte à trier.
  useEffect(() => {
    let profondeur = 0;
    const aDesFichiers = (e: DragEvent) => e.dataTransfer?.types.includes('Files');
    const entre = (e: DragEvent) => { if (aDesFichiers(e)) { profondeur++; setDepot(true); } };
    const sort = (e: DragEvent) => { if (aDesFichiers(e) && --profondeur <= 0) { profondeur = 0; setDepot(false); } };
    const survole = (e: DragEvent) => { if (aDesFichiers(e)) e.preventDefault(); };
    const lache = async (e: DragEvent) => {
      if (!aDesFichiers(e)) return;
      e.preventDefault();
      profondeur = 0; setDepot(false);
      const fichiers = Array.from(e.dataTransfer!.files);
      for (const f of fichiers) {
        try { await api.deposer(f); } catch (err) { notifier(`Impossible de déposer ${f.name}`, (err as Error).message, 'erreur'); }
      }
      setVue('assets'); setFiltre({ categorie: '_a_trier', sous: null }); setAssetChoisi(null);
    };
    window.addEventListener('dragenter', entre);
    window.addEventListener('dragleave', sort);
    window.addEventListener('dragover', survole);
    window.addEventListener('drop', lache);
    return () => {
      window.removeEventListener('dragenter', entre);
      window.removeEventListener('dragleave', sort);
      window.removeEventListener('dragover', survole);
      window.removeEventListener('drop', lache);
    };
  }, [notifier]);

  const ouvrirAsset = (chemin: string) => { setVue('assets'); setFiltre({ categorie: chemin.split('/')[0] === '_a-trier' || !chemin.includes('/') ? '_a_trier' : chemin.split('/')[0], sous: chemin.split('/').length > 2 ? chemin.split('/')[1] : null }); setAssetChoisi(chemin); };
  const ouvrirPNJ = (id: string) => { setVue('personnages'); setPnjChoisi(id); };

  const aTrier = catalogue?.assets.filter((a) => a.categorie === '_a_trier').length || 0;
  const problemes = catalogue?.diagnostics.filter((d) => d.niveau !== 'info').length || 0;
  const erreurs = catalogue?.diagnostics.filter((d) => d.niveau === 'erreur').length || 0;

  const liens: { id: Vue; libelle: string; icone: string; pastille?: number; genre?: string }[] = [
    { id: 'assets', libelle: 'Assets', icone: 'assets', pastille: aTrier || undefined, genre: 'alerte' },
    { id: 'personnages', libelle: 'Personnages', icone: 'personnages', pastille: catalogue ? Object.keys(catalogue.pnj).length : undefined },
    { id: 'echos', libelle: 'Échos', icone: 'echos' },
    { id: 'diagnostics', libelle: 'Diagnostics', icone: 'diagnostics', pastille: problemes || undefined, genre: erreurs ? 'erreur' : 'alerte' }
  ];
  const titres: Record<Vue, [string, string]> = {
    assets: ['Assets', "Tout ce qui se voit et s'entend dans le jeu, rangé et analysé automatiquement"],
    personnages: ['Personnages', 'Les PNJ que l’on croise en dialogue : expressions, taille, voix'],
    echos: ['Échos', 'Toutes les formes de l’écho jouable, de la graine à l’adulte'],
    diagnostics: ['Diagnostics', 'Ce qui manque ou cloche, et comment le réparer']
  };

  return (
    <div className="atelier">
      <aside className="rail">
        <div className="rail-titre">Soul Seed<small>l'atelier</small></div>
        <nav>
          {liens.map((l) => (
            <button key={l.id} className={`rail-lien ${vue === l.id ? 'actif' : ''}`} onClick={() => { setVue(l.id); SFX.page(0.5); }}>
              <Icone nom={l.icone} /> <span className="libelle">{l.libelle}</span>
              {l.pastille ? <span className={`pastille ${l.genre || ''}`}>{l.pastille}</span> : null}
            </button>
          ))}
          <button className="rail-lien" disabled title="Prochaine étape : l'éditeur de scènes branché sur le vrai moteur">
            <Icone nom="scenes" /> <span className="libelle">Scènes</span> <span className="pastille" style={{ fontWeight: 400 }}>bientôt</span>
          </button>
        </nav>
        <div className="rail-pied">
          <div className={`etat-direct ${erreur ? 'hors' : chargement ? 'travail' : ''}`}>
            <i /> {erreur ? 'serveur injoignable' : chargement ? 'mise à jour…' : 'à jour, en direct'}
          </div>
          {catalogue && <div>{catalogue.assets.length} fichiers suivis</div>}
          {reglages && (
            <label className="interrupteur" title="Les fichiers dont le nom est reconnu (ex. jumpy-boude.png) sont rangés dès leur arrivée">
              <input type="checkbox" checked={reglages.rangementAuto} onChange={async (e) => setReglages(await api.changerReglages({ rangementAuto: e.target.checked }))} />
              Rangement automatique
            </label>
          )}
          <button className="bouton discret petit" style={{ color: 'inherit', alignSelf: 'flex-start', padding: 0 }} onClick={async () => { await api.regenerer(); recharger(); }}>
            <Icone nom="rafraichir" taille={14} /> tout réanalyser
          </button>
        </div>
      </aside>

      <main className="principal">
        <header className="entete">
          <div>
            <h1>{titres[vue][0]}</h1>
            <div className="sous">{titres[vue][1]}</div>
          </div>
        </header>
        <div className="contenu">
          {!catalogue ? (
            <div className="vide manuscrit">{erreur ? `Le serveur de développement ne répond pas : ${erreur}` : 'Inventaire en cours…'}</div>
          ) : vue === 'assets' ? (
            <VueAssets catalogue={catalogue} filtre={filtre} setFiltre={(f) => { setFiltre(f); setAssetChoisi(null); }} choisi={assetChoisi} setChoisi={setAssetChoisi} recents={recents} notifier={notifier} ouvrirPNJ={ouvrirPNJ} />
          ) : vue === 'personnages' ? (
            <VuePersonnages catalogue={catalogue} choisi={pnjChoisi} setChoisi={setPnjChoisi} notifier={notifier} ouvrirAsset={ouvrirAsset} />
          ) : vue === 'echos' ? (
            <VueEchos catalogue={catalogue} ouvrirAsset={ouvrirAsset} />
          ) : (
            <VueDiagnostics catalogue={catalogue} notifier={notifier} ouvrirAsset={ouvrirAsset} ouvrirPNJ={ouvrirPNJ} />
          )}
        </div>
      </main>

      {depot && <div className="voile-depot"><div><div className="manuscrit" style={{ fontSize: 34 }}>Lâchez pour déposer</div><div>Les fichiers iront dans la boîte à trier.</div></div></div>}
      <div className="notes" aria-live="polite">
        {notes.map((n) => <div key={n.id} className={`note ${n.genre || ''}`}>{n.message}{n.details && <small>{n.details}</small>}</div>)}
      </div>
    </div>
  );
}
