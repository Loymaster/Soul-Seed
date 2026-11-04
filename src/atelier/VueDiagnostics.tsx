// Vue « Diagnostics » : tout ce qui cloche dans les assets et les fiches, avec la réparation à portée de clic.
import { useMemo, useState } from 'react';
import type { Catalogue, Diagnostic, Niveau } from '@/contenu/types';
import { api } from './api';
import { ImageAsset, trouverAsset } from './commun';

const TITRES: Record<string, string> = {
  A_TRIER: 'Fichiers à ranger',
  DOSSIER_INCONNU: 'Dossiers inconnus',
  NOM: 'Noms non conformes',
  DOUBLON: 'Doublons',
  ILLISIBLE: 'Images illisibles',
  FICHE_ILLISIBLE: 'Fiches illisibles',
  EXPRESSION_INTROUVABLE: 'Expressions dont le fichier a disparu',
  PNJ_SANS_EXPRESSION: 'PNJ sans image de dialogue',
  PNJ_NOUVEAU: 'Nouveaux PNJ détectés',
  PNJ_SANS_VIGNETTE: 'PNJ sans vignette',
  ECHO_LACUNE: "Formes d'écho manquantes",
  MARGES: 'Grandes marges transparentes',
  LOURD: 'Fichiers lourds'
};
const ORDRE: Niveau[] = ['erreur', 'alerte', 'info'];
const LIBELLE_NIVEAU = { erreur: 'Erreurs', alerte: 'À corriger', info: 'Pour information' };

interface Props {
  catalogue: Catalogue;
  notifier: (m: string, d?: string, genre?: 'ok' | 'erreur') => void;
  ouvrirAsset: (c: string) => void;
  ouvrirPNJ: (id: string) => void;
}

export function VueDiagnostics({ catalogue, notifier, ouvrirAsset, ouvrirPNJ }: Props) {
  const [niveaux, setNiveaux] = useState<Set<Niveau>>(new Set(['erreur', 'alerte', 'info']));
  const groupes = useMemo(() => {
    const g: Record<string, Diagnostic[]> = {};
    for (const d of catalogue.diagnostics) if (niveaux.has(d.niveau)) (g[`${d.niveau}|${d.code}`] ||= []).push(d);
    return Object.entries(g).sort(([a], [b]) => ORDRE.indexOf(a.split('|')[0] as Niveau) - ORDRE.indexOf(b.split('|')[0] as Niveau));
  }, [catalogue.diagnostics, niveaux]);
  const compte = (n: Niveau) => catalogue.diagnostics.filter((d) => d.niveau === n).length;

  async function executer(action: () => Promise<unknown>, message: string) {
    try { await action(); notifier(message, undefined, 'ok'); } catch (e) { notifier('Action impossible', (e as Error).message, 'erreur'); }
  }

  function actions(d: Diagnostic) {
    switch (d.code) {
      case 'A_TRIER':
        return d.suggestion
          ? <button className="bouton petit principal-b" onClick={() => executer(() => api.deplacer(d.chemin!, d.suggestion!), `Rangé : ${d.suggestion}`)}>Ranger</button>
          : <button className="bouton petit" onClick={() => ouvrirAsset(d.chemin!)}>Choisir sa place</button>;
      case 'NOM':
        return <button className="bouton petit" onClick={() => executer(() => api.deplacer(d.chemin!, d.suggestion!), `Renommé : ${d.suggestion}`)}>Renommer</button>;
      case 'DOUBLON':
        return (
          <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {d.chemins!.map((c) => <button key={c} className="bouton petit danger" title={`Mettre de côté ${c}`} onClick={() => executer(() => api.mettreDeCote([c]), `Mis de côté : ${c}`)}>retirer {c.split('/').slice(-2).join('/')}</button>)}
          </span>
        );
      case 'EXPRESSION_INTROUVABLE': {
        const fiche = catalogue.pnj[d.fiche!];
        return (
          <button className="bouton petit" onClick={() => {
            const { assets: _a, nouvelle: _n, ...f } = fiche;
            const expressions = { ...f.expressions };
            delete expressions[d.cle!];
            executer(() => api.enregistrerFiche({ ...f, expressions }), `Expression « ${d.cle} » retirée de ${fiche.nom}`);
          }}>Retirer de la fiche</button>
        );
      }
      default:
        if (d.fiche) return <button className="bouton petit" onClick={() => ouvrirPNJ(d.fiche!)}>Ouvrir la fiche</button>;
        if (d.chemin) return <button className="bouton petit discret" onClick={() => ouvrirAsset(d.chemin!)}>Voir</button>;
        return null;
    }
  }

  return (
    <div className="vue-diag">
      <div className="puces">
        {ORDRE.map((n) => (
          <button key={n} className={`puce ${niveaux.has(n) ? 'active' : ''}`} onClick={() => { const s = new Set(niveaux); s.has(n) ? s.delete(n) : s.add(n); setNiveaux(s); }}>
            {LIBELLE_NIVEAU[n]} · {compte(n)}
          </button>
        ))}
      </div>
      {!groupes.length && <div className="bravo"><span className="tamp">Rien à signaler</span></div>}
      {groupes.map(([cle, liste]) => {
        const [niveau, code] = cle.split('|') as [Niveau, string];
        const masse = code === 'A_TRIER' && liste.some((d) => d.suggestion);
        return (
          <div key={cle} className="diag-groupe carte-papier">
            <h3>
              <span className={`pastille ${niveau}`}>{liste.length}</span> {TITRES[code] || code}
              <span style={{ flex: 1 }} />
              {masse && <button className="bouton petit principal-b" onClick={() => executer(() => api.rangerTout(), 'Fichiers reconnus rangés')}>Tout ranger</button>}
            </h3>
            {liste.slice(0, 60).map((d, i) => {
              const a = trouverAsset(catalogue, d.chemin);
              return (
                <div key={i} className="diag-ligne">
                  {a && a.type !== 'son' ? <span className="damier" style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 4, flex: 'none' }}><ImageAsset asset={a} /></span> : null}
                  <span className="texte">{d.message}{d.chemin && <span className="code">{d.chemin}</span>}</span>
                  {actions(d)}
                </div>
              );
            })}
            {liste.length > 60 && <div className="diag-ligne" style={{ color: 'var(--encre-3)' }}>… et {liste.length - 60} autre(s)</div>}
          </div>
        );
      })}
    </div>
  );
}
