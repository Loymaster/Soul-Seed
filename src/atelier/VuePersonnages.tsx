// Vue « Personnages » : les fiches des PNJ, réglées à vue sur une vraie scène de dialogue.
// Chaque modification est enregistrée dans contenu/personnages/<id>.json.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Asset, Catalogue, FichePNJ, PNJCatalogue } from '@/contenu/types';
import { SFX, TIMBRES, timbre } from '@/moteur/sfx';
import { LIGNE_PIEDS, PLACES, PX_PAR_METRE, SCENE_H, SCENE_L, placer, rogner, type Place } from '@/moteur/scene/placement';
import { api } from './api';
import { Icone, ImageAsset, Section, normaliser, trouverAsset } from './commun';

interface Props {
  catalogue: Catalogue;
  choisi: string | null;
  setChoisi: (id: string | null) => void;
  notifier: (m: string, d?: string, genre?: 'ok' | 'erreur') => void;
  ouvrirAsset: (chemin: string) => void;
}

function visage(c: Catalogue, p: PNJCatalogue) {
  return trouverAsset(c, p.vignette) || trouverAsset(c, p.defaut ? p.expressions[p.defaut] : undefined) || trouverAsset(c, p.assets.calques[0]);
}

export function VuePersonnages({ catalogue, choisi, setChoisi, notifier, ouvrirAsset }: Props) {
  const liste = useMemo(() => Object.values(catalogue.pnj).sort((a, b) => a.nom.localeCompare(b.nom)), [catalogue.pnj]);
  const [creation, setCreation] = useState(false);
  const [nom, setNom] = useState('');
  const courant = choisi ? catalogue.pnj[choisi] : liste[0];
  const alertesPar = useMemo(() => {
    const r: Record<string, number> = {};
    for (const d of catalogue.diagnostics) if (d.fiche && d.niveau !== 'info') r[d.fiche] = (r[d.fiche] || 0) + 1;
    return r;
  }, [catalogue.diagnostics]);

  async function creer() {
    const id = normaliser(nom);
    if (!id) return;
    try {
      await api.nouveauPNJ(id, nom, [id]);
      notifier(`Fiche créée : ${nom}`, `Déposez ses images dans la boîte à trier en les nommant « ${id}-<expression>.png ».`, 'ok');
      setCreation(false); setNom(''); setChoisi(id);
    } catch (e) { notifier('Création impossible', (e as Error).message, 'erreur'); }
  }

  return (
    <div className="vue-personnages">
      <aside className="liste-pnj">
        {liste.map((p) => {
          const v = visage(catalogue, p);
          return (
            <button key={p.id} className={`pnj-ligne ${courant?.id === p.id ? 'actif' : ''}`} onClick={() => setChoisi(p.id)}>
              <span className="visage">{v ? <img src={v.url} alt="" loading="lazy" /> : <span className="manuscrit" style={{ fontSize: 20 }}>?</span>}</span>
              <span>
                <span className="nom" style={{ color: p.encre }}>{p.nom}</span>
                <span className="compte" style={{ display: 'block' }}>{Object.keys(p.expressions).length} expression(s){p.assets.calques.length ? ` · ${p.assets.calques.length} lieu(x)` : ''}</span>
              </span>
              {alertesPar[p.id] ? <span className="pastille alerte">{alertesPar[p.id]}</span> : null}
            </button>
          );
        })}
        {creation ? (
          <div className="carte-papier" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="saisie" autoFocus placeholder="Nom du PNJ" value={nom} onChange={(e) => setNom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && creer()} />
            <div className="code">contenu/personnages/{normaliser(nom) || '…'}.json</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="bouton principal-b petit" onClick={creer} disabled={!normaliser(nom)}>Créer</button>
              <button className="bouton discret petit" onClick={() => setCreation(false)}>Annuler</button>
            </div>
          </div>
        ) : (
          <button className="bouton" style={{ marginTop: 6, justifyContent: 'center' }} onClick={() => setCreation(true)}><Icone nom="plus" taille={16} /> Nouveau PNJ</button>
        )}
      </aside>
      {courant ? <Fiche key={courant.id} pnj={courant} catalogue={catalogue} notifier={notifier} ouvrirAsset={ouvrirAsset} /> : <div className="vide manuscrit">Aucun PNJ pour l'instant</div>}
    </div>
  );
}

const PHRASE_TEST = 'Bienvenue au ranch ! Tu as l’air d’avoir fait un long chemin…';

function Fiche({ pnj, catalogue, notifier, ouvrirAsset }: { pnj: PNJCatalogue; catalogue: Catalogue; notifier: Props['notifier']; ouvrirAsset: (c: string) => void }) {
  const [fiche, setFiche] = useState<FichePNJ>(() => sansAssets(pnj));
  const [vue, setVue] = useState<string | null>(pnj.defaut);
  const [etat, setEtat] = useState<'' | 'attente' | 'ok'>('');
  const enregistree = useRef(JSON.stringify(sansAssets(pnj)));
  const minuteur = useRef<ReturnType<typeof setTimeout>>();

  // Le catalogue a changé (nouvelle expression déposée, fichier déplacé…) : on reprend les expressions à jour.
  useEffect(() => {
    setFiche((f) => {
      const suivante = { ...f, expressions: pnj.expressions, vignette: pnj.vignette, defaut: f.defaut && pnj.expressions[f.defaut] ? f.defaut : pnj.defaut };
      return JSON.stringify(suivante) === JSON.stringify(f) ? f : suivante;
    });
  }, [pnj.expressions, pnj.vignette, pnj.defaut]);

  // Enregistrement automatique, un court instant après la dernière modification.
  useEffect(() => {
    const texte = JSON.stringify(fiche);
    if (texte === enregistree.current) return;
    setEtat('attente');
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(async () => {
      try { await api.enregistrerFiche(fiche); enregistree.current = texte; setEtat('ok'); setTimeout(() => setEtat((e) => (e === 'ok' ? '' : e)), 1600); } catch (e) { setEtat(''); notifier('Enregistrement impossible', (e as Error).message, 'erreur'); }
    }, 600);
    return () => clearTimeout(minuteur.current);
  }, [fiche]); // eslint-disable-line react-hooks/exhaustive-deps

  const maj = (p: Partial<FichePNJ>) => setFiche((f) => ({ ...f, ...p }));
  const majVoix = (p: Partial<FichePNJ['voix']>) => setFiche((f) => ({ ...f, voix: { ...f.voix, ...p } }));

  function renommerExpression(ancienne: string, nouvelle: string) {
    const n = normaliser(nouvelle);
    if (!n || n === ancienne || fiche.expressions[n]) return;
    const expr: Record<string, string> = {};
    for (const [k, v] of Object.entries(fiche.expressions)) expr[k === ancienne ? n : k] = v;
    maj({ expressions: expr, defaut: fiche.defaut === ancienne ? n : fiche.defaut });
    if (vue === ancienne) setVue(n);
  }

  const diag = catalogue.diagnostics.filter((d) => d.fiche === pnj.id && d.niveau !== 'info');
  const cheminVu = (vue && fiche.expressions[vue]) || (fiche.defaut ? fiche.expressions[fiche.defaut] : undefined);

  return (
    <div className="fiche">
      <div className="fiche-form">
        <div className="fiche-titre">
          <input value={fiche.nom} onChange={(e) => maj({ nom: e.target.value })} style={{ color: fiche.encre }} aria-label="Nom" />
          <span className="enregistre" style={{ opacity: etat ? 1 : 0 }}>{etat === 'attente' ? '…' : '✓ enregistré'}</span>
        </div>
        <div className="code" style={{ marginTop: -10 }}>contenu/personnages/{pnj.id}.json</div>

        {diag.map((d, i) => <div key={i} className="cible conflit" style={{ fontSize: 13 }}>{d.message}</div>)}

        <Section titre="Expressions">
          {Object.keys(fiche.expressions).length ? (
            <div className="expressions">
              {Object.entries(fiche.expressions).map(([cle, chemin]) => {
                const a = trouverAsset(catalogue, chemin);
                return (
                  <div key={cle} className={`expr ${cheminVu === chemin ? 'vue' : ''}`} onClick={() => setVue(cle)} onDoubleClick={() => ouvrirAsset(chemin)} title={`${chemin} — double-clic pour ouvrir l'asset`}>
                    <div className="apercu damier">{a ? <ImageAsset asset={a} /> : <span className="manuscrit" style={{ fontSize: 18, color: 'var(--tampon)' }}>manquant</span>}</div>
                    <button className={`etoile ${fiche.defaut === cle ? 'oui' : ''}`} title="Expression par défaut" onClick={(e) => { e.stopPropagation(); maj({ defaut: cle }); }}>★</button>
                    <input defaultValue={cle} onClick={(e) => e.stopPropagation()} onBlur={(e) => renommerExpression(cle, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} aria-label="Nom de l'expression" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="manuscrit" style={{ fontSize: 21 }}>Aucune expression. Déposez « {pnj.prefixes[0]}-neutre.png » dans l'atelier.</div>
          )}
          <div style={{ fontSize: 12.5, color: 'var(--encre-3)' }}>
            Le nom sous chaque image est celui que l'on écrit dans les scènes : <span className="code">{pnj.id} [{Object.keys(fiche.expressions)[1] || 'surpris'}]: …</span>. Les nouveaux fichiers sont ajoutés automatiquement.
          </div>
        </Section>

        <Section titre="Silhouette">
          <Curseur libelle="Taille réelle" valeur={fiche.taille} min={0.4} max={3} pas={0.01} unite=" m" aide="Sert à mettre tous les personnages à la même échelle sur la ligne des pieds." onChange={(v) => maj({ taille: v })} />
          <Curseur libelle="Part visible du corps" valeur={fiche.visible} min={0.3} max={1} pas={0.01} format={(v) => `${Math.round(v * 100)} %`} aide="100 % : l'image va des pieds à la tête. Moins : l'image s'arrête avant les pieds." onChange={(v) => maj({ visible: v })} />
          <label className="interrupteur"><input type="checkbox" checked={fiche.miroirADroite} onChange={(e) => maj({ miroirADroite: e.target.checked })} /> Retourner l'image quand le personnage est à droite</label>
        </Section>

        <Section titre="Voix">
          <label className="champ">
            <span>Couleur d'encre (nom dans les dialogues)</span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={fiche.encre} onChange={(e) => maj({ encre: e.target.value })} style={{ width: 40, height: 30, border: 0, background: 'none', padding: 0 }} />
              <span className="code">{fiche.encre}</span>
            </span>
          </label>
          <Curseur libelle="Hauteur de la voix" valeur={fiche.voix.note} min={110} max={880} pas={1} format={(v) => `${Math.round(v)} Hz · ${nomNote(v)}`} onChange={(v) => majVoix({ note: v })} />
          <Curseur libelle="Rythme de parole" valeur={fiche.voix.rythme} min={0.5} max={2} pas={0.01} format={(v) => (v < 0.9 ? `rapide (×${v.toFixed(2)})` : v > 1.1 ? `posé (×${v.toFixed(2)})` : `normal (×${v.toFixed(2)})`)} onChange={(v) => majVoix({ rythme: v })} />
          <label className="champ">
            <span>Timbre</span>
            <select className="saisie" value={typeof fiche.voix.timbre === 'string' ? fiche.voix.timbre : 'perso'} onChange={(e) => majVoix({ timbre: e.target.value })}>
              {Object.entries(TIMBRES).map(([k, t]) => <option key={k} value={k}>{t.nom}</option>)}
              {typeof fiche.voix.timbre !== 'string' && <option value="perso">Personnalisé</option>}
            </select>
          </label>
        </Section>

        <Section titre="Notes">
          <textarea className="saisie" rows={3} value={fiche.notes || ''} placeholder="Caractère, manière de parler, liens avec les autres…" onChange={(e) => maj({ notes: e.target.value || undefined })} />
        </Section>

        {(pnj.assets.calques.length > 0 || pnj.assets.illustrations.length > 0 || pnj.assets.vignette) && (
          <Section titre="Autres images">
            <div className="groupe-autres">
              {[...(pnj.assets.vignette ? [['Vignette', pnj.assets.vignette]] : []), ...pnj.assets.calques.map((c) => ['Lieu', c]), ...pnj.assets.illustrations.map((c) => ['Illustration', c])].map(([type, c]) => {
                const a = trouverAsset(catalogue, c);
                return a ? (
                  <figure key={c} onClick={() => ouvrirAsset(c)} style={{ cursor: 'pointer' }}>
                    <div className={`apercu ${a.alpha ? 'damier' : ''}`}><img src={a.url} alt="" loading="lazy" /></div>
                    {type} · {a.pnj?.variante}
                  </figure>
                ) : null;
              })}
            </div>
          </Section>
        )}
      </div>
      <SceneTest fiche={fiche} cheminVu={cheminVu} catalogue={catalogue} />
    </div>
  );
}

function sansAssets(p: PNJCatalogue): FichePNJ {
  const { assets: _a, nouvelle: _n, ...f } = p;
  return f;
}

function Curseur({ libelle, valeur, min, max, pas, unite = '', format, aide, onChange }: { libelle: string; valeur: number; min: number; max: number; pas: number; unite?: string; format?: (v: number) => string; aide?: string; onChange: (v: number) => void }) {
  return (
    <label className="curseur">
      <span>{libelle}</span>
      <output>{format ? format(valeur) : `${valeur.toFixed(2)}${unite}`}</output>
      <input type="range" min={min} max={max} step={pas} value={valeur} onChange={(e) => onChange(+e.target.value)} />
      {aide && <small>{aide}</small>}
    </label>
  );
}

const NOTES = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
function nomNote(f: number) {
  const n = Math.round(12 * Math.log2(f / 440)) + 69;
  return `${NOTES[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`;
}

// ---------------------------------------------------------------------------------------------
// Scène d'essai : le PNJ sur la ligne des pieds, à l'échelle, à côté d'autres personnages.

function SceneTest({ fiche, cheminVu, catalogue }: { fiche: FichePNJ; cheminVu?: string; catalogue: Catalogue }) {
  const cadre = useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = useState(0.5);
  const [place, setPlace] = useState<Place>('G2');
  const decors = useMemo(() => catalogue.assets.filter((a) => a.role === 'decor' && !a.alpha && a.l && a.l >= 1000), [catalogue.assets]);
  const [decor, setDecor] = useState(() => decors.find((d) => d.chemin === 'decors/village/sanctuaire.png')?.chemin || decors[0]?.chemin || '');
  const autresDispo = Object.values(catalogue.pnj).filter((p) => p.id !== fiche.id && p.defaut);
  const [autres, setAutres] = useState<string[]>(() => ['myhra', 'jumpy'].filter((i) => i !== fiche.id && catalogue.pnj[i]));
  const [texte, setTexte] = useState(PHRASE_TEST);
  const [ecrit, setEcrit] = useState<string | null>(null);
  const [regle, setRegle] = useState(true);

  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setEchelle(el.clientWidth / SCENE_L));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function parler() {
    const t = timbre(fiche.voix.timbre);
    let i = 0;
    setEcrit('');
    const pas = () => {
      i++;
      const ch = texte[i - 1];
      setEcrit(texte.slice(0, i));
      SFX.typeTick(ch, fiche.voix.note, t);
      if (i < texte.length) {
        const pause = /[.!?…]/.test(ch) ? 260 : /[,;:]/.test(ch) ? 140 : 32;
        setTimeout(pas, pause * fiche.voix.rythme);
      } else setTimeout(() => setEcrit(null), 1800);
    };
    pas();
  }

  // Places : le PNJ réglé à la place choisie, les comparaisons aux autres places libres.
  const libres = (Object.keys(PLACES) as Place[]).filter((p) => p !== place);
  const distribution: { place: Place; f: FichePNJ; chemin?: string; parle: boolean }[] = [
    { place, f: fiche, chemin: cheminVu, parle: true },
    ...autres.slice(0, 3).map((id, i) => ({ place: libres[i], f: catalogue.pnj[id], chemin: catalogue.pnj[id]?.defaut ? catalogue.pnj[id].expressions[catalogue.pnj[id].defaut!] : undefined, parle: false }))
  ].filter((x) => x.f);

  const fond = trouverAsset(catalogue, decor);

  return (
    <div className="scene-test">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="section-titre" style={{ margin: 0, flex: 1 }}>Essai en scène</div>
        <label className="interrupteur"><input type="checkbox" checked={regle} onChange={(e) => setRegle(e.target.checked)} /> Repères</label>
      </div>
      <div className="scene-cadre" ref={cadre}>
        <div className="repere" style={{ transform: `scale(${echelle})` }}>
          {fond && <img className="fond" src={fond.url} alt="" />}
          {distribution.map(({ place: pl, f, chemin, parle }) => <Personnage key={f.id + pl} fiche={f} asset={trouverAsset(catalogue, chemin)} place={pl} estompe={!parle && ecrit !== null} />)}
          <div className="flou" />
          {regle && (
            <>
              <div className="pieds" style={{ bottom: LIGNE_PIEDS }}><span>ligne des pieds</span></div>
              {[0.5, 1, 1.5, 2].map((m) => (
                <div key={m} className="graduation" style={{ bottom: LIGNE_PIEDS + m * PX_PAR_METRE }}>{m.toLocaleString('fr-FR')} m</div>
              ))}
              {distribution.map(({ place: pl, f }) => (
                <div key={'n' + pl} className="perso-nom" style={{ left: PLACES[pl], bottom: LIGNE_PIEDS - 40 }}>{f.nom} · {f.taille.toLocaleString('fr-FR')} m</div>
              ))}
            </>
          )}
          {ecrit !== null && (
            <div className="bulle-test">
              <div className="qui" style={{ color: fiche.encre }}>{fiche.nom}</div>
              {ecrit}
            </div>
          )}
        </div>
      </div>
      <div className="comparer">
        <span style={{ fontSize: 13, color: 'var(--encre-3)' }}>Place :</span>
        {(Object.keys(PLACES) as Place[]).map((p) => <button key={p} className={`puce ${place === p ? 'active' : ''}`} onClick={() => setPlace(p)}>{p[0] === 'G' ? 'gauche' : 'droite'} {p[1] === '1' ? 'bord' : 'centre'}</button>)}
      </div>
      <div className="comparer">
        <span style={{ fontSize: 13, color: 'var(--encre-3)' }}>Comparer avec :</span>
        {autresDispo.map((p) => (
          <button key={p.id} className={`puce ${autres.includes(p.id) ? 'active' : ''}`} onClick={() => setAutres(autres.includes(p.id) ? autres.filter((x) => x !== p.id) : [...autres, p.id].slice(-3))}>{p.nom}</button>
        ))}
      </div>
      <div className="comparer">
        <span style={{ fontSize: 13, color: 'var(--encre-3)' }}>Décor :</span>
        <select className="saisie" value={decor} onChange={(e) => setDecor(e.target.value)} style={{ maxWidth: 320 }}>
          {decors.map((d) => <option key={d.chemin} value={d.chemin}>{d.chemin.replace('decors/', '')}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="saisie" style={{ flex: 1 }} value={texte} onChange={(e) => setTexte(e.target.value)} aria-label="Phrase d'essai" />
        <button className="bouton principal-b" onClick={parler} disabled={ecrit !== null}><Icone nom="son" taille={16} /> Écouter la voix</button>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--encre-3)' }}>
        Repère de scène {SCENE_L} × {SCENE_H} · {PX_PAR_METRE} px par mètre · tous les personnages ont les pieds sur la même ligne et sont à leur taille réelle.
      </div>
    </div>
  );
}

function Personnage({ fiche, asset, place, estompe }: { fiche: FichePNJ; asset?: Asset; place: Place; estompe: boolean }) {
  if (!asset || !asset.l || !asset.h) return null;
  const { hauteur, bas } = placer(fiche.taille, fiche.visible);
  const r = rogner({ l: asset.l, h: asset.h, boite: asset.boite }, hauteur);
  const droite = place[0] === 'D';
  return (
    <div className={`perso ${droite && fiche.miroirADroite ? 'miroir' : ''} ${estompe ? 'estompe' : ''}`} style={{ left: PLACES[place] - r.cadre.width / 2, bottom: bas, width: r.cadre.width, height: r.cadre.height, zIndex: estompe ? 2 : place[1] === '2' ? 4 : 3 }}>
      <img src={asset.url} alt={fiche.nom} style={r.image} />
    </div>
  );
}
