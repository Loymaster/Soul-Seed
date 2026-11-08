// Pages du carnet d'éleveur hors maquette : Quêtes, Relations (PNJ et échos sauvages) et Mémoire
// (arbre des échos, échos de souvenir). Chaque section a une page de gauche et une page de droite ;
// le grand carnet du ranch les pose dans sa maquette (VueRanch : `carnetGauche`, `carnetDroite`),
// le petit carnet hors du ranch (InterfaceRanch) montre les quêtes et les relations.
// Ce qui est partagé par les deux pages (sous-onglet, lignée, quête choisie, page) vit dans un petit magasin.
import { useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { NOM_STADE, apparence, niveauRelation, rangRelation, LIEN_RELATION, ENCRE_RELATION, type Etat } from '@/moteur/simulation';
import { lireQuetes, lireRelationsPnj, type Monde, type QueteLue } from '@/moteur/monde';
import { profilActif } from '../../profils';
import { TEMPERAMENTS } from '../../ranch/evenements';
import { FRAGMENTS, LIGNEES, MEMOIRES, arbre, compte, ligneeDe, noeuds, revelees, type IdLignee, type Noeud } from './arbre';
import './carnet.css';

const A = `${import.meta.env.BASE_URL}assets/`;
const NOM_GRAINE = { joy: 'solaire', wrath: 'tellurique', disgust: 'caustique', sorrow: 'boréale', fear: 'spectrale' } as const;
const TEMPERAMENT_DE: Record<string, keyof typeof TEMPERAMENTS> = { joy: 'cur', wrath: 'res', disgust: 'dis', sorrow: 'obs', fear: 'ant' };

// ——— l'état partagé des deux pages

export interface VueCarnet {
  memoire: 'arbre' | 'souvenirs';
  lignee: IdLignee | null;
  quete: string | null;
  pagePnj: number;
}
export class EtatCarnet {
  private v: VueCarnet = { memoire: 'arbre', lignee: null, quete: null, pagePnj: 0 };
  private abonnes = new Set<() => void>();
  constructor(private son?: (nom: string, vol?: number) => void) {}
  lire = () => this.v;
  abonner = (f: () => void) => { this.abonnes.add(f); return () => { this.abonnes.delete(f); }; };
  changer(modif: Partial<VueCarnet>, bruit: 'page' | 'tick' = 'tick') {
    this.v = { ...this.v, ...modif };
    this.son?.(bruit === 'page' ? 'page' : 'paperTick', bruit === 'page' ? 0.7 : undefined);
    this.abonnes.forEach((f) => f());
  }
  /** Revenir au début (carnet refermé). */
  oublier() { this.v = { ...this.v, quete: null, pagePnj: 0 }; }
}
const useVue = (s: EtatCarnet) => useSyncExternalStore(s.abonner, s.lire);

export type SectionCarnet = 'quetes' | 'relations' | 'memoire';
export interface ProprietesPages {
  section: SectionCarnet;
  cote: 'gauche' | 'droite';
  etat: Etat;
  monde?: Partial<Monde> | null;
  vue: EtatCarnet;
  /** Petit carnet : PNJ moins nombreux par page. */
  petit?: boolean;
}

export function PageCarnet(p: ProprietesPages) {
  const v = useVue(p.vue);
  switch (p.section) {
    case 'quetes': return p.cote === 'gauche' ? <div className="cn-g"><QuetesGauche {...p} v={v} /></div> : <QuetesDroite {...p} v={v} />;
    case 'relations': return p.cote === 'gauche' ? <div className="cn-g"><RelationsGauche {...p} v={v} /></div> : <RelationsDroite {...p} />;
    case 'memoire': return p.cote === 'gauche' ? <div className="cn-g"><Memoire {...p} v={v} /></div> : <Memoire {...p} v={v} />;
  }
}

const Fleche = ({ d }: { d: string }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;

// ——— Quêtes

const mondeQuetes = (m?: Partial<Monde> | null) => (m ? { drapeaux: m.drapeaux ?? {}, structures: m.structures ?? [], decouvertes: m.decouvertes ?? [], boutique: m.boutique ?? null } : null);
function queteChoisie(m: Partial<Monde> | null | undefined, id: string | null): { lues: ReturnType<typeof lireQuetes>; q: QueteLue | null } {
  const lues = lireQuetes(mondeQuetes(m));
  const toutes = [...lues.enCours, ...lues.terminees];
  return { lues, q: toutes.find((x) => x.id === id) ?? toutes[0] ?? null };
}

function QuetesGauche({ monde, vue, v }: ProprietesPages & { v: VueCarnet }) {
  const { lues, q } = queteChoisie(monde, v.quete);
  const ligne = (x: QueteLue) => (
    <button key={x.id} className={`cn-quete ${x.terminee ? 'faite' : ''} ${q?.id === x.id ? 'ici' : ''}`} aria-current={q?.id === x.id ? 'true' : undefined}
      onClick={() => q?.id !== x.id && vue.changer({ quete: x.id }, 'page')}>
      <span className="cn-quete-nom"><span className="cn-barre">{x.titre}</span></span>
      {x.majeure && !x.terminee && <span className="cn-marque majeure" title="quête majeure">majeure</span>}
      {x.difficile && !x.terminee && <span className="cn-marque difficile">difficile</span>}
    </button>
  );
  return (
    <div className="cn cn-quetes">
      <div className="cn-rubrique">En cours</div>
      {lues.enCours.length ? lues.enCours.map(ligne) : <div className="cn-vide">Plus rien ne presse… pour l’instant.</div>}
      {lues.terminees.length > 0 && <>
        <div className="cn-rubrique" style={{ marginTop: 14 }}>Accomplies</div>
        {lues.terminees.map(ligne)}
      </>}
      <div className="cn-note">Le carnet se tient à jour tout seul : une étape accomplie se barre d’un trait d’encre.</div>
    </div>
  );
}

function QuetesDroite({ monde, v }: ProprietesPages & { v: VueCarnet }) {
  const { q } = queteChoisie(monde, v.quete);
  if (!q) return <div className="cn cn-quete-page"><div className="cn-vide">Aucune quête pour l’instant.</div></div>;
  return (
    <div className="cn cn-quete-page" key={q.id}>
      <div className="cn-quete-titre">{q.titre}</div>
      <div className="cn-quete-marques">
        {q.majeure && <span className="cn-marque majeure">quête majeure</span>}
        {q.difficile && <span className="cn-marque difficile">difficile</span>}
      </div>
      <div className="cn-resume">{q.resume}</div>
      <ol className="cn-etapes">
        {q.etapes.map((e) => (
          <li key={e.id} className={e.faite ? 'faite' : e.courante ? 'courante' : ''}>
            <span className="cn-case" aria-hidden="true">{e.faite ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13l5 5L20 6" /></svg> : null}</span>
            <span className="cn-etape">
              <span className="cn-etape-texte">{e.texte}</span>
              {e.courante && e.piste && <em className="cn-piste">{e.piste}</em>}
            </span>
          </li>
        ))}
        {q.restantes > 0 && <li className="suite"><span className="cn-case" aria-hidden="true" /><span className="cn-etape"><span className="cn-etape-texte">… la suite reste à écrire</span></span></li>}
      </ol>
      {q.terminee && <div className="cn-tampon">accomplie</div>}
    </div>
  );
}

// ——— Relations

const PAR_PAGE = { grand: 6, petit: 6 };
function RelationsGauche({ monde, vue, v, petit }: ProprietesPages & { v: VueCarnet }) {
  const { connus, aRencontrer } = lireRelationsPnj(monde ? { drapeaux: monde.drapeaux ?? {}, pnjConnus: monde.pnjConnus ?? [], relationsPnj: monde.relationsPnj } : null);
  const n = petit ? PAR_PAGE.petit : PAR_PAGE.grand;
  const pages = Math.max(1, Math.ceil(connus.length / n));
  const page = Math.min(v.pagePnj, pages - 1);
  const ici = connus.slice(page * n, page * n + n);
  const place = page === pages - 1 ? Math.min(2, n - ici.length, aRencontrer.length) : 0;
  return (
    <div className="cn cn-relations">
      <div className="cn-rubrique">Les habitants</div>
      {ici.map((r) => (
        <div key={r.id} className="cn-pnj">
          <span className="cn-medaillon">{r.portrait ? <img src={A + r.portrait} alt="" /> : <img className="pied" src={`${A}pnj/${r.id}/neutre.png`} alt="" />}</span>
          <span className="cn-qui"><b>{r.nom}</b><em>{r.role}{r.habitant ? ' · au village' : ''}</em></span>
          <span className="cn-lien" style={{ color: r.encre }}>{r.mot}</span>
        </div>
      ))}
      {place > 0 && <>
        <div className="cn-rubrique" style={{ marginTop: 10 }}>À rencontrer</div>
        {aRencontrer.slice(0, place).map((t) => <div key={t} className="cn-indice">??? — {t}</div>)}
      </>}
      {pages > 1 && (
        <div className="cn-pages">
          <button className="ast-fleche" disabled={page === 0} onClick={() => vue.changer({ pagePnj: page - 1 }, 'page')} aria-label="Page précédente"><Fleche d="M15 5l-7 7 7 7" /></button>
          <span className="ast-folio">{page + 1} / {pages}</span>
          <button className="ast-fleche" disabled={page >= pages - 1} onClick={() => vue.changer({ pagePnj: page + 1 }, 'page')} aria-label="Page suivante"><Fleche d="M9 5l7 7-7 7" /></button>
        </div>
      )}
    </div>
  );
}

function RelationsDroite({ etat }: ProprietesPages) {
  const ici = etat.visiteur?.id;
  const liste = [...(etat.echosSauvages ?? [])]
    .sort((a, b) => Number(b.id === ici) - Number(a.id === ici) || rangRelation(niveauRelation(b)) - rangRelation(niveauRelation(a)))
    .slice(0, 7);
  return (
    <div className="cn cn-relations droite">
      <div className="cn-page-titre">Échos sauvages</div>
      <div className="cn-sous-titre">ceux qui se sont arrêtés au ranch</div>
      {liste.length ? liste.map((x) => {
        const n = niveauRelation(x);
        return (
          <div key={x.id} className={`relation-echo ${x.id === ici ? 'ici' : ''}`}>
            <span className="medaillon"><img src={A + apparence({ ...x, evolution: null })} alt="" /></span>
            <span className="qui"><b>{x.nom}</b><em>{x.id === ici ? 'au ranch en ce moment' : `${NOM_STADE[x.stade].toLowerCase()}, lignée ${NOM_GRAINE[x.graine]}`}</em></span>
            <span className="lien" style={{ color: ENCRE_RELATION[n] }}>{LIEN_RELATION[n]}</span>
          </div>
        );
      }) : <div className="cn-mot">Aucun écho sauvage ne s’est encore arrêté au ranch. Il en passe parfois, quand tout est calme.</div>}
      <div className="cn-note">Les habitants auront parfois un service à vous demander : les aider vous rapprochera.</div>
    </div>
  );
}

// ——— Mémoire : l'arbre des échos et les échos de souvenir

function Case({ n, vu, actuelle, taille = 54, style }: { n: Noeud; vu: Set<string>; actuelle?: string; taille?: number; style?: CSSProperties }) {
  const connue = n.chemins.some((c) => vu.has(c));
  const ici = !!actuelle && n.chemins.includes(actuelle);
  return (
    <div className={`cn-case-echo ${connue ? 'vue' : 'inconnue'} ${ici ? 'ici' : ''} ${n.sombre ? 'sombre' : ''}`} style={{ width: taille, ...style }} title={connue ? n.titre : 'forme encore inconnue'}>
      <span className="cn-rond" style={{ width: taille, height: taille }}>
        {n.chemins.map((c) => <img key={c} className={vu.has(c) ? '' : 'ombre'} src={A + c} alt="" style={n.chemins.length > 1 ? { width: '62%' } : undefined} />)}
        {!connue && <span className="cn-point">?</span>}
      </span>
      {n.autres ? (
        <span className="cn-legende glyphes" aria-label={n.legende}>
          {n.sens && <span className="cn-sens">{n.sens === 'vers' ? '→' : '←'}</span>}
          {n.autres.map((x) => <MiniSceau key={x} lignee={x} />)}
        </span>
      ) : n.legende && <span className="cn-legende">{n.legende}</span>}
    </div>
  );
}

/** Le sceau d'une lignée en petit (légende des branches et des mêlées). */
function MiniSceau({ lignee }: { lignee: IdLignee }) {
  const t = lignee === 'neutre' ? null : TEMPERAMENTS[TEMPERAMENT_DE[lignee]];
  return t ? <span className="cn-mini" style={{ background: t.color, maskImage: t.glyphe, WebkitMaskImage: t.glyphe }} /> : <span className="cn-mini neutre" />;
}

function SousOnglets({ v, vue }: { v: VueCarnet; vue: EtatCarnet }) {
  return (
    <div className="cn-sous" role="tablist">
      {([['arbre', 'Arbre des échos'], ['souvenirs', 'Échos de souvenir']] as const).map(([k, nom]) => (
        <button key={k} role="tab" aria-selected={v.memoire === k} className={v.memoire === k ? 'ici' : ''} onClick={() => v.memoire !== k && vue.changer({ memoire: k }, 'page')}>{nom}</button>
      ))}
    </div>
  );
}

function Memoire({ etat, vue, v, cote }: ProprietesPages & { v: VueCarnet }) {
  const actuelle = etat.mort ? undefined : apparence(etat);
  const vu = revelees(profilActif()?.memoire ?? [], actuelle);
  if (v.memoire === 'souvenirs') return cote === 'gauche' ? <SouvenirsGauche v={v} vue={vue} vu={vu} /> : <SouvenirsDroite vu={vu} />;
  const lignee = v.lignee ?? (actuelle ? ligneeDe(actuelle) : 'joy');
  const a = arbre(lignee);
  return cote === 'gauche' ? <ArbreGauche v={v} vue={vue} vu={vu} lignee={lignee} a={a} actuelle={actuelle} /> : <ArbreDroite a={a} vu={vu} actuelle={actuelle} />;
}

/** Une liane d'encre entre deux cases (coordonnées du repère de la page). */
const liane = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1} C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}`;

function ArbreGauche({ v, vue, vu, lignee, a, actuelle }: { v: VueCarnet; vue: EtatCarnet; vu: Set<string>; lignee: IdLignee; a: ReturnType<typeof arbre>; actuelle?: string }) {
  const L = LIGNEES.find((l) => l.id === lignee)!;
  const c = compte(noeuds(a), vu);
  // repère du tronc : 364 de large ; graine en haut, puis bébé et enfant (claire à gauche, sombre à droite)
  const W = 364, xc = 132, xs = 262, yG = 0, yB = 92, yE = 182, T = 58, TG = a.graines.length > 1 ? 36 : 56;
  const gx = (i: number) => (a.graines.length > 1 ? W / 2 + 22 + (i - 2) * 42 : W / 2 + 22);
  return (
    <div className="cn cn-arbre">
      <SousOnglets v={v} vue={vue} />
      <div className="cn-lignees" role="radiogroup" aria-label="Lignées">
        {LIGNEES.map((l) => {
          const t = l.id === 'neutre' ? null : TEMPERAMENTS[TEMPERAMENT_DE[l.id]];
          const ici = l.id === lignee;
          return (
            <button key={l.id} role="radio" aria-checked={ici} aria-label={`Lignée ${l.nom}`} title={l.nom} className={`cn-sceau ${ici ? 'ici' : ''}`}
              style={{ '--c': t?.color ?? '#7a6650', '--l': t?.glow ?? 'rgba(200,190,170,.7)' } as CSSProperties}
              onClick={() => !ici && vue.changer({ lignee: l.id }, 'page')}>
              {t ? <span className="cn-glyphe" style={{ maskImage: t.glyphe, WebkitMaskImage: t.glyphe }} /> : <span className="cn-glyphe neutre" />}
            </button>
          );
        })}
      </div>
      <div className="cn-lignee-nom"><b>Lignée {L.nom.toLowerCase()}</b><span>{c.vues} forme{c.vues > 1 ? 's' : ''} sur {c.total} {c.vues > 1 ? 'révélées' : 'révélée'}</span></div>
      <div className="cn-tronc" style={{ height: yE + T + 34 }}>
        <svg className="cn-lianes" width={W} height={yE + T + 34} aria-hidden="true">
          {a.graines.map((_, i) => <g key={i}>
            <path d={liane(gx(i), yG + TG, xc, yB)} />
            <path className="sombre" d={liane(gx(i), yG + TG, xs, yB)} />
          </g>)}
          <path d={liane(xc, yB + T, xc, yE)} /><path className="sombre" d={liane(xs, yB + T, xs, yE)} />
        </svg>
        <span className="cn-stade" style={{ top: yG + TG / 2 - 8 }}>graine</span>
        <span className="cn-stade" style={{ top: yB + T / 2 - 8 }}>bébé</span>
        <span className="cn-stade" style={{ top: yE + T / 2 - 8 }}>enfant</span>
        {a.graines.map((g, i) => <Case key={g.id} n={g} vu={vu} taille={TG} style={{ position: 'absolute', left: gx(i) - TG / 2, top: yG }} />)}
        {a.racines.map((r) => {
          const y = r.stade === 'bebe' ? yB : yE;
          return [
            <Case key={r.claire.id} n={r.claire} vu={vu} actuelle={actuelle} taille={T} style={{ position: 'absolute', left: xc - T / 2, top: y }} />,
            <Case key={r.sombre.id} n={r.sombre} vu={vu} actuelle={actuelle} taille={T} style={{ position: 'absolute', left: xs - T / 2, top: y }} />,
          ];
        })}
      </div>
      <div className="cn-suite">l’arbre continue sur la page d’en face →</div>
    </div>
  );
}

function ArbreDroite({ a, vu, actuelle }: { a: ReturnType<typeof arbre>; vu: Set<string>; actuelle?: string }) {
  const T = a.adolescent.claire.length + a.adolescent.sombre.length > 5 ? 46 : 54;
  // une colonne par forme : l'adolescent, un trait d'encre, l'adulte qu'il peut devenir
  const colonnes = (ado: Noeud[], adulte: Noeud[], sombre: boolean) => (
    <div className={`cn-groupe ${sombre ? 'sombre' : ''}`}>
      {ado.map((n, i) => (
        <div key={n.id} className="cn-colonne">
          <Case n={n} vu={vu} actuelle={actuelle} taille={T} />
          <span className={`cn-tige ${sombre ? 'sombre' : ''}`} aria-hidden="true" />
          <Case n={adulte[i]} vu={vu} actuelle={actuelle} taille={T} />
        </div>
      ))}
    </div>
  );
  return (
    <div className="cn cn-ramures">
      <div className="cn-page-titre">Les ramures</div>
      <div className="cn-entetes"><span>voie claire</span><span>voie sombre</span></div>
      <div className="cn-etages">
        <div className="cn-stades" aria-hidden="true"><span>adolescent</span><span>adulte</span></div>
        {colonnes(a.adolescent.claire, a.adulte.claire, false)}
        <span className="cn-trait" aria-hidden="true" />
        {colonnes(a.adolescent.sombre, a.adulte.sombre, true)}
      </div>
      {a.melees.length > 0 ? (
        <div className="cn-melees">
          <span className="cn-stade-h">mêlées <i>trois tempéraments en équilibre</i></span>
          <div className="cn-groupe">{a.melees.map((n) => <Case key={n.id} n={n} vu={vu} actuelle={actuelle} taille={44} />)}</div>
        </div>
      ) : <div className="cn-mot" style={{ marginTop: 18 }}>Les échos neutres ne se mêlent pas : ils cherchent l’équilibre de toutes les émotions.</div>}
      <div className="cn-note">Une branche naît quand une autre émotion prend le dessus ; certains adolescents, élevés d’une seule façon, restent des fragments : voir les échos de souvenir.</div>
    </div>
  );
}

function SouvenirsGauche({ v, vue, vu }: { v: VueCarnet; vue: EtatCarnet; vu: Set<string> }) {
  const c = compte(FRAGMENTS, vu);
  return (
    <div className="cn cn-souvenirs">
      <SousOnglets v={v} vue={vue} />
      <div className="cn-mot">Quand un écho s’éteint, il emporte un fragment de sa mémoire dans sa nouvelle graine. Ce qui reste, on le garde ici.</div>
      <div className="cn-rubrique" style={{ marginTop: 14 }}>Échos fragmentés <span className="cn-compte">{c.vues} / {c.total}</span></div>
      <div className="cn-fragments">{FRAGMENTS.map((n) => <Case key={n.id} n={n} vu={vu} taille={74} />)}</div>
      <div className="cn-note bas">Un adolescent élevé presque d’une seule façon (tout pour l’esprit, tout pour les autres, ou tout pour le corps) n’achève pas sa croissance : il reste un fragment.</div>
    </div>
  );
}

function SouvenirsDroite({ vu }: { vu: Set<string> }) {
  const R = 118, cx = 182, cy = 168, T = 66;
  return (
    <div className="cn cn-memoires">
      <div className="cn-page-titre">Mémoires élémentaires</div>
      <div className="cn-sous-titre">six souvenirs, six éléments</div>
      <div className="cn-cercle" style={{ height: cy * 2 }}>
        <svg width="364" height={cy * 2} aria-hidden="true" className="cn-lianes">
          <circle cx={cx} cy={cy} r={R} />
          {MEMOIRES.map((_, i) => { const t = (i / MEMOIRES.length) * Math.PI * 2 - Math.PI / 2; return <path key={i} className="rayon" d={`M${cx} ${cy}L${cx + Math.cos(t) * (R - T / 2)} ${cy + Math.sin(t) * (R - T / 2)}`} />; })}
        </svg>
        {MEMOIRES.map((n, i) => {
          const t = (i / MEMOIRES.length) * Math.PI * 2 - Math.PI / 2;
          return <Case key={n.id} n={n} vu={vu} taille={T} style={{ position: 'absolute', left: cx + Math.cos(t) * R - T / 2, top: cy + Math.sin(t) * R - T / 2 }} />;
        })}
        <div className="cn-tampon avenir">à venir</div>
      </div>
      <div className="cn-note">Les souvenirs et les pierres élémentaires ne se recueillent pas encore. Un jour, un écho pourra renaître dans l’un de ces éléments.</div>
    </div>
  );
}

/** Titre et surtitre de chaque section (le grand carnet les écrit en haut de la page de gauche). */
export const TITRES_CARNET: Record<SectionCarnet, { titre: string; surtitre: string }> = {
  quetes: { titre: 'Quêtes', surtitre: 'Ce qui vous attend' },
  relations: { titre: 'Relations', surtitre: 'Les gens du coin' },
  memoire: { titre: 'Mémoire des échos', surtitre: 'Ce profil' },
};

/** Les deux pages d'une section (pour la maquette du ranch). */
export function pagesCarnet(section: SectionCarnet | null, o: Omit<ProprietesPages, 'section' | 'cote'>): { gauche: ReactNode; droite: ReactNode } {
  if (!section) return { gauche: null, droite: null };
  return { gauche: <PageCarnet section={section} cote="gauche" {...o} />, droite: <PageCarnet section={section} cote="droite" {...o} /> };
}

/** Icône de l'onglet « Quêtes » : un parchemin roulé et sa coche. */
export const ICONE_QUETES = 'M7 4h11a2 2 0 0 1 0 4h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h1zM7 4a2 2 0 0 0-2 2v2h2M10 12l2 2 3-4';
