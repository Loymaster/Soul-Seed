// Formulaire « où va ce fichier ? » — utilisé dans la boîte à trier et dans le détail d'un asset.
// On choisit d'abord la nature de l'asset (écho, PNJ, décor…), puis les champs propres à cette nature ;
// le chemin final est calculé et vérifié en direct.
import { useEffect, useMemo, useState } from 'react';
import type { Asset, Catalogue } from '@/contenu/types';
import { api } from './api';
import { extension, nomFichier, normaliser, sansExtension, Icone } from './commun';

type Nature = 'echo' | 'pnj' | 'joueur' | 'decor' | 'interface' | 'objet' | 'emotion' | 'activite' | 'animation' | 'son';

const NATURES: { id: Nature; libelle: string; dossier: string; sous: boolean }[] = [
  { id: 'pnj', libelle: 'PNJ', dossier: 'pnj', sous: false },
  { id: 'echo', libelle: 'Écho jouable', dossier: 'echos', sous: false },
  { id: 'joueur', libelle: 'Joueur', dossier: 'joueur', sous: false },
  { id: 'decor', libelle: 'Décor', dossier: 'decors', sous: true },
  { id: 'interface', libelle: 'Interface', dossier: 'interface', sous: true },
  { id: 'objet', libelle: 'Objet', dossier: 'objets', sous: true },
  { id: 'emotion', libelle: 'Émotion', dossier: 'emotions', sous: false },
  { id: 'activite', libelle: 'Activité', dossier: 'activites', sous: true },
  { id: 'animation', libelle: 'Animation', dossier: 'animations', sous: false },
  { id: 'son', libelle: 'Son', dossier: 'sons', sous: true }
];

const STADES: [string, string][] = [['graines', 'Graine'], ['bebe', 'Bébé'], ['enfant', 'Enfant'], ['adolescent', 'Adolescent'], ['adulte', 'Adulte']];

interface Champs { nature: Nature; pnj: string; stade: string; sous: string; nom: string }

/** Déduit les champs du formulaire d'un chemin (actuel ou proposé). */
function champsDepuis(chemin: string, defautNom: string): Champs {
  const m = chemin.split('/');
  const nom = sansExtension(m[m.length - 1] || defautNom);
  const base: Champs = { nature: 'pnj', pnj: '', stade: 'enfant', sous: '', nom };
  const nature = NATURES.find((n) => n.dossier === m[0]);
  if (!nature || m.length < 2) return { ...base, nom: normaliser(sansExtension(defautNom)) };
  if (nature.id === 'pnj') return { ...base, nature: 'pnj', pnj: m[1] || '' };
  if (nature.id === 'echo') return { ...base, nature: 'echo', stade: m.length > 2 ? m[1] : 'enfant' };
  return { ...base, nature: nature.id, sous: m.slice(1, -1).join('/') };
}

function cheminDepuis(c: Champs, ext: string): string | null {
  const nom = normaliser(c.nom);
  if (!nom) return null;
  const n = NATURES.find((x) => x.id === c.nature)!;
  if (c.nature === 'pnj') return c.pnj ? `pnj/${c.pnj}/${nom}${ext}` : null;
  if (c.nature === 'echo') return `echos/${c.stade}/${nom}${ext}`;
  const sous = c.sous.split('/').map(normaliser).filter(Boolean).join('/');
  return `${n.dossier}/${sous ? sous + '/' : ''}${nom}${ext}`;
}

export function FormulaireRangement({ asset, catalogue, compact, onFait, onErreur }: {
  asset: Asset;
  catalogue: Catalogue;
  compact?: boolean;
  onFait: (message: string, details?: string) => void;
  onErreur: (message: string) => void;
}) {
  const ext = extension(asset.chemin);
  const depart = asset.suggestion || (asset.role === 'a-trier' ? '' : asset.chemin);
  const [champs, setChamps] = useState<Champs>(() => champsDepuis(depart, nomFichier(asset.chemin)));
  const [nouveauPNJ, setNouveauPNJ] = useState<{ id: string; nom: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  useEffect(() => { setChamps(champsDepuis(depart, nomFichier(asset.chemin))); setNouveauPNJ(null); }, [asset.chemin, depart]);

  const maj = (p: Partial<Champs>) => setChamps((c) => ({ ...c, ...p }));
  const cible = cheminDepuis(champs, ext);
  const existe = cible && cible !== asset.chemin && catalogue.assets.some((a) => a.chemin === cible);
  const inchange = cible === asset.chemin;

  const pnjListe = useMemo(() => Object.values(catalogue.pnj).sort((a, b) => a.nom.localeCompare(b.nom)), [catalogue.pnj]);
  const sousDossiers = useMemo(() => {
    const n = NATURES.find((x) => x.id === champs.nature)!;
    return [...new Set(catalogue.assets.filter((a) => a.categorie === n.dossier && a.sousCategorie).map((a) => a.sousCategorie!))].sort();
  }, [catalogue.assets, champs.nature]);
  const nomsConnus = useMemo(() => {
    // Propositions de noms : expressions déjà utilisées par les PNJ, ou formes d'échos existantes.
    if (champs.nature === 'pnj') return [...new Set(Object.values(catalogue.pnj).flatMap((p) => Object.keys(p.expressions)))].sort();
    if (champs.nature === 'echo') return [...new Set(catalogue.assets.filter((a) => a.echo).map((a) => a.echo!.forme))].sort();
    return [];
  }, [catalogue, champs.nature]);

  async function ranger() {
    if (!cible || inchange) return;
    setOccupe(true);
    try {
      let pnj = champs.pnj;
      if (champs.nature === 'pnj' && nouveauPNJ) {
        const id = normaliser(nouveauPNJ.id || nouveauPNJ.nom);
        await api.nouveauPNJ(id, nouveauPNJ.nom || id, [id]);
        pnj = id;
      }
      const vers = cheminDepuis({ ...champs, pnj }, ext)!;
      const r = await api.deplacer(asset.chemin, vers, !!existe);
      onFait(`Rangé : ${vers}`, r.references.length ? `Références mises à jour dans ${r.references.join(', ')}` : undefined);
    } catch (e) {
      onErreur((e as Error).message);
    } finally {
      setOccupe(false);
    }
  }

  const listeId = `noms-${asset.empreinte}`;
  const sousId = `sous-${asset.empreinte}`;

  return (
    <div className="colis-corps" style={compact ? { gap: 8 } : undefined}>
      <div className="type-asset puces" role="radiogroup" aria-label="Nature de l'asset">
        {NATURES.map((n) => (
          <button key={n.id} type="button" className={`puce ${champs.nature === n.id ? 'active' : ''}`} onClick={() => maj({ nature: n.id, sous: '' })}>
            {n.libelle}
          </button>
        ))}
      </div>
      <div className="champs-colis">
        {champs.nature === 'pnj' && !nouveauPNJ && (
          <label className="champ">
            <span>Personnage</span>
            <select className="saisie" value={champs.pnj} onChange={(e) => (e.target.value === '__nouveau' ? setNouveauPNJ({ id: '', nom: '' }) : maj({ pnj: e.target.value }))}>
              <option value="">— choisir —</option>
              {pnjListe.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              <option value="__nouveau">+ Nouveau PNJ…</option>
            </select>
          </label>
        )}
        {champs.nature === 'pnj' && nouveauPNJ && (
          <>
            <label className="champ">
              <span>Nom du nouveau PNJ</span>
              <input className="saisie" autoFocus value={nouveauPNJ.nom} placeholder="ex. Vieux pêcheur" onChange={(e) => setNouveauPNJ({ nom: e.target.value, id: normaliser(e.target.value) })} />
            </label>
            <label className="champ">
              <span>Identifiant</span>
              <input className="saisie" value={nouveauPNJ.id} onChange={(e) => setNouveauPNJ({ ...nouveauPNJ, id: normaliser(e.target.value) })} />
            </label>
            <button type="button" className="bouton discret petit" onClick={() => setNouveauPNJ(null)}>annuler</button>
          </>
        )}
        {champs.nature === 'echo' && (
          <label className="champ">
            <span>Stade</span>
            <select className="saisie" value={champs.stade} onChange={(e) => maj({ stade: e.target.value })}>
              {STADES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        )}
        {NATURES.find((n) => n.id === champs.nature)!.sous && (
          <label className="champ">
            <span>Sous-dossier</span>
            <input className="saisie" list={sousId} value={champs.sous} placeholder="ex. village" onChange={(e) => maj({ sous: e.target.value })} />
            <datalist id={sousId}>{sousDossiers.map((s) => <option key={s} value={s} />)}</datalist>
          </label>
        )}
        <label className="champ" style={{ flex: 1 }}>
          <span>{champs.nature === 'pnj' ? 'Expression / variante' : champs.nature === 'echo' ? 'Forme' : 'Nom'}</span>
          <input className="saisie" list={listeId} value={champs.nom} onChange={(e) => maj({ nom: e.target.value })} />
          <datalist id={listeId}>{nomsConnus.map((s) => <option key={s} value={s} />)}</datalist>
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className={`cible code ${existe ? 'conflit' : ''}`} style={{ flex: 1, minWidth: 200 }}>
          {cible ? <>public/assets/<strong>{cible}</strong></> : 'Complétez les champs pour voir la destination'}
          {existe && <div style={{ color: 'var(--tampon)', marginTop: 3 }}>Un fichier existe déjà ici : il sera remplacé.</div>}
        </div>
        <button type="button" className="bouton principal-b" disabled={!cible || inchange || occupe || (champs.nature === 'pnj' && nouveauPNJ !== null && !nouveauPNJ.id)} onClick={ranger}>
          <Icone nom="fleche" taille={16} /> {asset.role === 'a-trier' ? 'Ranger' : 'Déplacer'}
        </button>
      </div>
    </div>
  );
}
