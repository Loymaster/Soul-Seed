// Vue « Échos » : toutes les formes de l'écho jouable, par lignée et par stade de vie.
// Les cases vides montrent tout de suite ce qu'il reste à dessiner.
import { useMemo } from 'react';
import type { Asset, Catalogue } from '@/contenu/types';
import { ImageAsset } from './commun';

const STADES: [string, string][] = [['graines', 'Graine'], ['bebe', 'Bébé'], ['enfant', 'Enfant'], ['adolescent', 'Adolescent'], ['adulte', 'Adulte']];
const TYPES_SPECIAUX: [string, string, string][] = [
  ['branche', 'Branches', 'Une lignée qui bascule vers la forme sombre d’une autre (adolescent et adulte).'],
  ['melee', 'Mêlées', 'Trois lignées mêlées (adulte).'],
  ['memoire', 'Mémoires', 'Formes élémentaires (adulte).'],
  ['fragment', 'Fragments', 'Fragments de développement (adolescent).'],
  ['autre', 'Autres', 'Formes dont le nom ne suit pas encore la convention.']
];

export function VueEchos({ catalogue, ouvrirAsset }: { catalogue: Catalogue; ouvrirAsset: (c: string) => void }) {
  const formes = useMemo(() => catalogue.assets.filter((a) => a.echo), [catalogue.assets]);
  const lignees = Object.values(catalogue.lignees);
  const ame = catalogue.assets.find((a) => a.role === 'ame');

  function cellule(stade: string, lignee: string, sombre: boolean) {
    if (stade === 'graines' && (sombre || lignee === 'neutre')) return <td key={stade}><div className="case non-prevu" /></td>;
    const trouves = formes.filter((a) => a.echo!.stade === stade && a.echo!.lignees[0] === lignee && (a.echo!.type === (sombre ? 'sombre' : 'pure') || (stade === 'graines' && a.echo!.type === 'graine')));
    if (!trouves.length) return <td key={stade}><div className="case manque">à dessiner</div></td>;
    return (
      <td key={stade}>
        <div className="cases">
          {trouves.map((a) => <Case key={a.chemin} asset={a} ouvrir={ouvrirAsset} etroite={trouves.length > 1} />)}
        </div>
      </td>
    );
  }

  const total = formes.length;
  const manquantes = catalogue.diagnostics.filter((d) => d.code === 'ECHO_LACUNE').length;

  return (
    <div className="vue-echos">
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--titre)', fontWeight: 500, margin: 0, fontSize: 24 }}>L'écho du joueur</h2>
          <div style={{ color: 'var(--encre-3)' }}>{total} formes · {manquantes ? `${manquantes} manquante(s)` : 'aucune lacune dans les lignées'} · le seul personnage jouable : tous les autres sont des PNJ.</div>
        </div>
        {ame && <button className="case" onClick={() => ouvrirAsset(ame.chemin)} title="Âme" style={{ width: 70, height: 70 }}><ImageAsset asset={ame} /></button>}
      </div>

      <table className="matrice">
        <thead>
          <tr><th />{STADES.map(([s, l]) => <th key={s}>{l}<small>{formes.filter((a) => a.echo!.stade === s).length} formes</small></th>)}</tr>
        </thead>
        <tbody>
          {lignees.flatMap((l) => [
            <tr key={l.id}>
              <th>{l.nom}</th>
              {STADES.map(([s]) => cellule(s, l.id, false))}
            </tr>,
            <tr key={l.id + '-s'}>
              <th style={{ color: 'var(--corruption)' }}>{l.nom} sombre</th>
              {STADES.map(([s]) => cellule(s, l.id, true))}
            </tr>
          ])}
        </tbody>
      </table>

      {TYPES_SPECIAUX.map(([type, titre, aide]) => {
        const liste = formes.filter((a) => a.echo!.type === type);
        if (!liste.length) return null;
        const parForme: Record<string, Asset[]> = {};
        for (const a of liste) (parForme[a.echo!.forme] ||= []).push(a);
        return (
          <div key={type}>
            <div className="section-titre">{titre} · {Object.keys(parForme).length}</div>
            <div style={{ fontSize: 13, color: 'var(--encre-3)', margin: '8px 0' }}>{aide}</div>
            <div className="galerie-formes">
              {Object.entries(parForme).sort().map(([forme, as]) => (
                <div key={forme} className="forme">
                  <div className="cases">
                    {['adolescent', 'adulte'].filter((s) => as.some((a) => a.echo!.stade === s) || type === 'branche').map((s) => {
                      const a = as.find((x) => x.echo!.stade === s);
                      return a ? <Case key={s} asset={a} ouvrir={ouvrirAsset} etroite /> : <div key={s} className="case manque" style={{ width: '50%' }}>{s === 'adulte' ? 'adulte ?' : 'ado ?'}</div>;
                    })}
                  </div>
                  <span>{as[0].echo!.nom}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Case({ asset, ouvrir, etroite }: { asset: Asset; ouvrir: (c: string) => void; etroite?: boolean }) {
  return (
    <button className="case damier" onClick={() => ouvrir(asset.chemin)} title={`${asset.echo?.nom} — ${asset.chemin}`} style={etroite ? { width: 54 + (etroite ? 0 : 54) } : undefined}>
      <ImageAsset asset={asset} />
      {asset.echo?.genre && <span className="genre">{asset.echo.genre === 'f' ? '♀' : '♂'}</span>}
    </button>
  );
}
