// Vue « Assets » : arbre des catégories, galerie filtrable, détail d'un asset et boîte à trier.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Asset, Catalogue } from '@/contenu/types';
import { api, type Usage } from './api';
import { FormulaireRangement } from './Rangement';
import { Etiquettes, Icone, ImageAsset, LIBELLES_ROLES, AIDE_ROLES, nomFichier, tailleLisible, Section } from './commun';

export interface Filtre { categorie: string | null; sous: string | null }

interface Props {
  catalogue: Catalogue;
  filtre: Filtre;
  setFiltre: (f: Filtre) => void;
  choisi: string | null;
  setChoisi: (c: string | null) => void;
  recents: Set<string>;
  notifier: (m: string, d?: string, genre?: 'ok' | 'erreur') => void;
  ouvrirPNJ: (id: string) => void;
}

const ORDRE_CATEGORIES = ['echos', 'pnj', 'joueur', 'decors', 'emotions', 'interface', 'objets', 'activites', 'animations', 'sons'];

export function VueAssets(p: Props) {
  const { catalogue, filtre, setFiltre } = p;
  const [recherche, setRecherche] = useState('');
  const [roles, setRoles] = useState<Set<string>>(new Set());
  const [rogne, setRogne] = useState(true);
  const [taille, setTaille] = useState(150);
  const [coches, setCoches] = useState<Set<string>>(new Set());
  const dernierClic = useRef<string | null>(null);

  const aTrier = catalogue.assets.filter((a) => a.categorie === '_a_trier');
  const boite = filtre.categorie === '_a_trier';

  const arbre = useMemo(() => {
    const res: { cat: string; n: number; sous: [string, number][] }[] = [];
    for (const cat of ORDRE_CATEGORIES) {
      const liste = catalogue.assets.filter((a) => a.categorie === cat);
      const sous: Record<string, number> = {};
      for (const a of liste) {
        // Pour les PNJ et les échos, on regroupe par personnage / stade (premier niveau).
        const s = a.chemin.split('/').length > 2 ? a.chemin.split('/')[1] : null;
        if (s) sous[s] = (sous[s] || 0) + 1;
      }
      res.push({ cat, n: liste.length, sous: Object.entries(sous).sort((x, y) => x[0].localeCompare(y[0])) });
    }
    return res;
  }, [catalogue.assets]);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return catalogue.assets.filter((a) => {
      if (a.categorie === '_a_trier' && !boite && !q) return false;
      if (filtre.categorie && a.categorie !== filtre.categorie) return false;
      if (filtre.sous && a.chemin.split('/')[1] !== filtre.sous) return false;
      if (roles.size && !roles.has(a.role)) return false;
      if (q) {
        const texte = `${a.chemin} ${LIBELLES_ROLES[a.role] || ''} ${a.echo?.nom || ''} ${a.pnj ? catalogue.pnj[a.pnj.id]?.nom || '' : ''}`.toLowerCase();
        if (!q.split(/\s+/).every((m) => texte.includes(m))) return false;
      }
      return true;
    });
  }, [catalogue, filtre, roles, recherche, boite]);

  const rolesPresents = useMemo(() => {
    const r: Record<string, number> = {};
    for (const a of catalogue.assets) if ((!filtre.categorie || a.categorie === filtre.categorie) && (!filtre.sous || a.chemin.split('/')[1] === filtre.sous)) r[a.role] = (r[a.role] || 0) + 1;
    return Object.entries(r).sort((a, b) => b[1] - a[1]);
  }, [catalogue.assets, filtre]);

  useEffect(() => { setCoches(new Set()); }, [filtre.categorie, filtre.sous]);

  function cliquer(a: Asset, e: React.MouseEvent) {
    if (e.shiftKey && dernierClic.current) {
      const i0 = visibles.findIndex((x) => x.chemin === dernierClic.current);
      const i1 = visibles.findIndex((x) => x.chemin === a.chemin);
      const [d, f] = i0 < i1 ? [i0, i1] : [i1, i0];
      setCoches(new Set([...coches, ...visibles.slice(d, f + 1).map((x) => x.chemin)]));
    } else if (e.metaKey || e.ctrlKey) {
      const n = new Set(coches);
      n.has(a.chemin) ? n.delete(a.chemin) : n.add(a.chemin);
      setCoches(n);
    } else {
      setCoches(new Set());
      p.setChoisi(a.chemin === p.choisi ? null : a.chemin);
    }
    dernierClic.current = a.chemin;
  }

  const asset = p.choisi ? catalogue.assets.find((a) => a.chemin === p.choisi) : undefined;

  return (
    <div className="vue-assets" style={asset ? undefined : { gridTemplateColumns: '230px 1fr' }}>
      <aside className="arbre">
        <button className={`arbre-ligne boite ${aTrier.length ? 'pleine' : ''} ${boite ? 'actif' : ''}`} onClick={() => setFiltre({ categorie: '_a_trier', sous: null })}>
          <Icone nom="boite" taille={16} /> Boîte à trier <span className="pastille">{aTrier.length}</span>
        </button>
        <button className={`arbre-ligne ${!filtre.categorie ? 'actif' : ''}`} onClick={() => setFiltre({ categorie: null, sous: null })}>
          Tous les assets <span className="pastille">{catalogue.assets.length - aTrier.length}</span>
        </button>
        <div className="arbre-sep">Personnages</div>
        {arbre.filter((x) => ['echos', 'pnj', 'joueur'].includes(x.cat)).map((x) => <GroupeArbre key={x.cat} {...x} catalogue={catalogue} filtre={filtre} setFiltre={setFiltre} />)}
        <div className="arbre-sep">Monde et interface</div>
        {arbre.filter((x) => !['echos', 'pnj', 'joueur'].includes(x.cat)).map((x) => <GroupeArbre key={x.cat} {...x} catalogue={catalogue} filtre={filtre} setFiltre={setFiltre} />)}
      </aside>

      <section className="galerie-zone">
        {boite ? (
          <BoiteATrier {...p} aTrier={aTrier} />
        ) : (
          <>
            <div className="barre">
              <input className="saisie recherche" placeholder="Rechercher (nom, rôle, PNJ, lignée…)" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              <div className="puces">
                {rolesPresents.map(([r, n]) => (
                  <button key={r} className={`puce ${roles.has(r) ? 'active' : ''}`} title={AIDE_ROLES[r]} onClick={() => { const s = new Set(roles); s.has(r) ? s.delete(r) : s.add(r); setRoles(s); }}>
                    {LIBELLES_ROLES[r] || r} · {n}
                  </button>
                ))}
              </div>
              <span className="espace" />
              <label className="interrupteur" title="Masque les marges transparentes autour des personnages">
                <input type="checkbox" checked={rogne} onChange={(e) => setRogne(e.target.checked)} /> Rogner
              </label>
              <input type="range" min={90} max={280} value={taille} onChange={(e) => setTaille(+e.target.value)} aria-label="Taille des vignettes" />
            </div>
            {coches.size > 0 && (
              <ActionsGroupees catalogue={catalogue} chemins={[...coches]} vider={() => setCoches(new Set())} notifier={p.notifier} />
            )}
            <div className="galerie" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${taille}px, 1fr))` }}>
              {visibles.map((a) => (
                <div key={a.chemin} className={`vignette-asset ${p.choisi === a.chemin ? 'choisi' : ''} ${coches.has(a.chemin) ? 'coche' : ''}`} onClick={(e) => cliquer(a, e)} title={a.chemin}>
                  <div className={`apercu ${a.type === 'image' && !a.alpha ? '' : 'damier'} ${a.role === 'decor' ? 'decor' : ''}`}>
                    {a.type === 'son' ? <div className="son-apercu"><Icone nom="son" taille={34} /><span className="code">{a.ext}</span></div> : <ImageAsset asset={a} rogne={rogne && a.role !== 'decor'} />}
                  </div>
                  <div className="legende">
                    <span className="nom">{a.echo?.nom || (a.pnj ? `${catalogue.pnj[a.pnj.id]?.nom || a.pnj.id} · ${a.pnj.variante}` : nomFichier(a.chemin))}</span>
                    <span className="marques"><Etiquettes asset={a} /></span>
                  </div>
                  {p.recents.has(a.chemin) && <span className="nouveau">nouveau</span>}
                </div>
              ))}
              {!visibles.length && <div className="vide manuscrit" style={{ gridColumn: '1 / -1' }}>Rien ici pour l'instant…</div>}
            </div>
          </>
        )}
      </section>

      {asset && <DetailAsset key={asset.chemin} asset={asset} {...p} />}
    </div>
  );
}

function GroupeArbre({ cat, n, sous, catalogue, filtre, setFiltre }: { cat: string; n: number; sous: [string, number][]; catalogue: Catalogue; filtre: Filtre; setFiltre: (f: Filtre) => void }) {
  const ouvert = filtre.categorie === cat;
  const nomSous = (s: string) => (cat === 'pnj' ? catalogue.pnj[s]?.nom || s : cat === 'echos' ? ({ bebe: 'Bébé', enfant: 'Enfant', adolescent: 'Adolescent', adulte: 'Adulte', graines: 'Graines' } as Record<string, string>)[s] || s : s);
  return (
    <div className="arbre-groupe">
      <button className={`arbre-ligne ${ouvert && !filtre.sous ? 'actif' : ''}`} onClick={() => setFiltre({ categorie: cat, sous: null })}>
        {catalogue.categories[cat] || cat} <span className="pastille">{n}</span>
      </button>
      {ouvert && sous.map(([s, k]) => (
        <button key={s} className={`arbre-ligne sous ${filtre.sous === s ? 'actif' : ''}`} onClick={() => setFiltre({ categorie: cat, sous: s })}>
          {nomSous(s)} <span className="pastille">{k}</span>
        </button>
      ))}
    </div>
  );
}

function BoiteATrier({ catalogue, aTrier, notifier, recents }: Props & { aTrier: Asset[] }) {
  const [survol, setSurvol] = useState(false);
  const reconnus = aTrier.filter((a) => a.suggestion);
  const champ = useRef<HTMLInputElement>(null);

  async function televerser(fichiers: FileList | File[]) {
    for (const f of Array.from(fichiers)) {
      try { await api.deposer(f); } catch (e) { notifier(`Impossible de déposer ${f.name}`, (e as Error).message, 'erreur'); }
    }
  }

  async function toutRanger() {
    try {
      const b = await api.rangerTout();
      notifier(`${b.ranges.length} fichier(s) rangé(s)`, b.inconnus.length ? `${b.inconnus.length} restent à trier à la main` : undefined, 'ok');
    } catch (e) { notifier('Rangement impossible', (e as Error).message, 'erreur'); }
  }

  return (
    <div className="boite-trier">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--titre)', fontWeight: 500, margin: 0, fontSize: 22 }}>Boîte à trier</h2>
          <div style={{ color: 'var(--encre-3)', fontSize: 14 }}>
            Déposez de nouveaux fichiers ici (ou n'importe où dans l'atelier), ou copiez-les dans <span className="code">public/assets/_a-trier</span> : ils apparaissent tout seuls.
          </div>
        </div>
        <span style={{ flex: 1 }} />
        <button className="bouton principal-b" disabled={!reconnus.length} onClick={toutRanger}>
          Tout ranger selon les propositions ({reconnus.length})
        </button>
      </div>
      <div
        className={`depot ${survol ? 'survol' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setSurvol(true); }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setSurvol(false); televerser(e.dataTransfer.files); }}
        onClick={() => champ.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <div className="manuscrit">Glissez vos images et sons ici</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          Astuce : un nom comme <span className="code">jumpy-boude.png</span>, <span className="code">enfant-joy.png</span> ou <span className="code">village-place.png</span> est reconnu et rangé tout seul.
        </div>
        <input ref={champ} type="file" multiple hidden onChange={(e) => e.target.files && televerser(e.target.files)} />
      </div>
      {aTrier.map((a) => (
        <div key={a.chemin} className="colis carte-papier">
          <div className={`apercu ${a.alpha ? 'damier' : ''}`}>
            {a.type === 'son' ? <Icone nom="son" taille={40} /> : <ImageAsset asset={a} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <div className="colis-titre">
              <strong>{nomFichier(a.chemin)}</strong>
              {a.l ? <span className="etiquette">{a.l} × {a.h}</span> : null}
              <span className="etiquette">{tailleLisible(a.octets)}</span>
              {a.alpha === false && a.type === 'image' && <span className="etiquette">opaque</span>}
              {a.doublons?.length ? <span className="etiquette attention" title={a.doublons.join(', ')}>déjà présent : {a.doublons[0]}</span> : null}
              {recents.has(a.chemin) && <span className="etiquette echo">vient d'arriver</span>}
              {!a.suggestion && <span className="etiquette attention">nom non reconnu</span>}
            </div>
            <FormulaireRangement asset={a} catalogue={catalogue} onFait={(m, d) => notifier(m, d, 'ok')} onErreur={(m) => notifier('Rangement impossible', m, 'erreur')} />
          </div>
        </div>
      ))}
      {!aTrier.length && (
        <div className="bravo"><span className="tamp">Tout est rangé</span></div>
      )}
    </div>
  );
}

function ActionsGroupees({ catalogue, chemins, vider, notifier }: { catalogue: Catalogue; chemins: string[]; vider: () => void; notifier: Props['notifier'] }) {
  const [dossier, setDossier] = useState('');
  const dossiers = useMemo(() => [...new Set(catalogue.assets.map((a) => a.chemin.slice(0, a.chemin.lastIndexOf('/'))).filter(Boolean))].sort(), [catalogue.assets]);
  async function deplacer() {
    const d = dossier.replace(/^\/+|\/+$/g, '');
    if (!d) return;
    const r = await api.deplacerPlusieurs(chemins.map((c) => ({ depuis: c, vers: `${d}/${nomFichier(c)}` })));
    notifier(`${r.faits.length} fichier(s) déplacé(s) vers ${d}`, r.erreurs.length ? r.erreurs.map((e) => `${e.depuis} : ${e.raison}`).join(' · ') : undefined, r.erreurs.length ? 'erreur' : 'ok');
    vider();
  }
  async function deCote() {
    await api.mettreDeCote(chemins);
    notifier(`${chemins.length} fichier(s) mis de côté`, 'Ils sont dans public/assets/_corbeille : rien n’est supprimé définitivement.', 'ok');
    vider();
  }
  return (
    <div className="barre" style={{ background: 'rgba(201,160,80,.14)' }}>
      <strong>{chemins.length} sélectionné(s)</strong>
      <input className="saisie" list="tous-dossiers" placeholder="Déplacer vers… (ex. pnj/jumpy)" value={dossier} onChange={(e) => setDossier(e.target.value)} style={{ width: 280 }} />
      <datalist id="tous-dossiers">{dossiers.map((d) => <option key={d} value={d} />)}</datalist>
      <button className="bouton" disabled={!dossier} onClick={deplacer}><Icone nom="fleche" taille={16} /> Déplacer</button>
      <button className="bouton danger" onClick={deCote}><Icone nom="corbeille" taille={16} /> Mettre de côté</button>
      <span className="espace" />
      <button className="bouton discret" onClick={vider}>Désélectionner</button>
    </div>
  );
}

function DetailAsset({ asset, catalogue, notifier, setChoisi, ouvrirPNJ }: Props & { asset: Asset }) {
  const [usages, setUsages] = useState<Usage[] | null>(null);
  const [voirBoite, setVoirBoite] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const [cadre, setCadre] = useState<{ l: number; h: number; x: number; y: number } | null>(null);
  useEffect(() => { api.usages(asset.chemin).then(setUsages).catch(() => setUsages([])); }, [asset.chemin, catalogue.genereLe]);

  function mesurer() {
    const el = img.current;
    if (!el) return;
    setCadre({ l: el.clientWidth, h: el.clientHeight, x: el.offsetLeft, y: el.offsetTop });
  }

  const fiche = asset.pnj ? catalogue.pnj[asset.pnj.id] : undefined;
  const cleExpression = fiche ? Object.entries(fiche.expressions).find(([, c]) => c === asset.chemin)?.[0] : undefined;
  const b = asset.boite;

  return (
    <aside className="detail">
      <div className={`detail-apercu ${asset.alpha ? 'damier' : ''}`}>
        {asset.type === 'son' ? (
          <audio controls src={asset.url} style={{ width: '90%' }} />
        ) : (
          <img ref={img} src={asset.url} alt="" onLoad={mesurer} />
        )}
        {voirBoite && cadre && b && asset.l && asset.h && (
          <div className="boite-utile" style={{ left: cadre.x + (b.x / asset.l) * cadre.l, top: cadre.y + (b.y / asset.h) * cadre.h, width: (b.l / asset.l) * cadre.l, height: (b.h / asset.h) * cadre.h }} />
        )}
        <button className="bouton discret petit" style={{ position: 'absolute', top: 6, right: 6 }} onClick={() => setChoisi(null)}>fermer ✕</button>
      </div>
      <div className="detail-corps">
        <div>
          <h2>{asset.echo?.nom || (fiche ? `${fiche.nom} · ${asset.pnj!.variante}` : nomFichier(asset.chemin))}</h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            <Etiquettes asset={asset} />
            <button className="bouton discret petit" onClick={() => { navigator.clipboard?.writeText(asset.chemin); notifier('Chemin copié', asset.chemin, 'ok'); }}>
              <Icone nom="copier" taille={14} /> {asset.chemin}
            </button>
          </div>
          {AIDE_ROLES[asset.role] && <div style={{ fontSize: 13, color: 'var(--encre-3)', marginTop: 6 }}>{AIDE_ROLES[asset.role]}</div>}
        </div>

        <dl className="meta">
          {asset.l ? <><dt>Dimensions</dt><dd>{asset.l} × {asset.h} px{asset.images && asset.images > 1 ? ` · ${asset.images} images` : ''}</dd></> : null}
          <dt>Poids</dt><dd>{tailleLisible(asset.octets)}</dd>
          {asset.alpha !== undefined && <><dt>Transparence</dt><dd>{asset.alpha ? `${Math.round((asset.transparence || 0) * 100)} % de pixels transparents` : 'aucune (image opaque)'}</dd></>}
          {b && asset.h && asset.alpha ? (
            <><dt>Contenu utile</dt><dd>{b.l} × {b.h} px <button className="bouton discret petit" onClick={() => setVoirBoite(!voirBoite)}>{voirBoite ? 'masquer' : 'voir'}</button></dd></>
          ) : null}
          {asset.couleur && <><dt>Teinte</dt><dd><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: asset.couleur, verticalAlign: -1, marginRight: 6 }} />{asset.couleur}</dd></>}
          <dt>Modifié</dt><dd>{new Date(asset.modifie).toLocaleString('fr-FR')}</dd>
          {asset.echo && <><dt>Lignée</dt><dd>{asset.echo.lignees.map((l) => catalogue.lignees[Object.keys(catalogue.lignees).find((k) => catalogue.lignees[k].id === l) || '']?.nom || l).join(' · ') || '—'}{asset.echo.sombre ? ' (sombre)' : ''}</dd></>}
        </dl>

        {fiche && (
          <Section titre="Personnage">
            <div style={{ fontSize: 14 }}>
              {cleExpression ? <>Expression <strong>« {cleExpression} »</strong> de </> : asset.role === 'expression' ? 'Expression de ' : `${asset.role === 'calque' ? 'Calque' : asset.role === 'vignette' ? 'Vignette' : 'Illustration'} de `}
              <strong style={{ color: fiche.encre }}>{fiche.nom}</strong>{fiche.defaut === cleExpression ? ' (par défaut)' : ''}.
              <div style={{ marginTop: 6 }}><button className="bouton petit" onClick={() => ouvrirPNJ(fiche.id)}>Ouvrir la fiche de {fiche.nom}</button></div>
            </div>
          </Section>
        )}

        {asset.doublons?.length ? (
          <Section titre="Doublons">
            <div style={{ fontSize: 14 }}>Ce fichier est identique à : {asset.doublons.map((d) => <div key={d}><button className="bouton discret petit" onClick={() => setChoisi(d)}>{d}</button></div>)}</div>
          </Section>
        ) : null}

        <Section titre={asset.role === 'a-trier' ? 'Ranger' : 'Déplacer ou renommer'}>
          <FormulaireRangement asset={asset} catalogue={catalogue} compact onFait={(m, d) => { notifier(m, d, 'ok'); setChoisi(null); }} onErreur={(m) => notifier('Déplacement impossible', m, 'erreur')} />
        </Section>

        <Section titre="Utilisé dans">
          {usages === null ? <div style={{ color: 'var(--encre-3)' }}>…</div> : usages.length ? usages.map((u) => (
            <div key={u.fichier} className="usage"><strong className="code">{u.fichier}</strong>{u.lignes.slice(0, 3).map((l) => <span key={l.ligne} className="code">l.{l.ligne} · {l.texte}</span>)}</div>
          )) : <div style={{ fontSize: 13, color: 'var(--encre-3)' }}>Aucune scène ni fiche ne l'utilise encore. Les déplacements mettent ces références à jour automatiquement.</div>}
        </Section>

        <div>
          <button className="bouton danger" onClick={async () => { await api.mettreDeCote([asset.chemin]); notifier('Mis de côté', 'Le fichier est dans public/assets/_corbeille.', 'ok'); setChoisi(null); }}>
            <Icone nom="corbeille" taille={16} /> Mettre de côté
          </button>
        </div>
      </div>
    </aside>
  );
}
