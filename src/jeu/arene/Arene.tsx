// Mode Arène (menu principal) : combats libres, sans aucune incidence sur les parties (repris du prototype).
// On choisit le terrain, la musique, les soins d'arène, de un à trois combattants de chaque côté — stade, forme,
// techniques, tranche de puissance —, puis un compte à rebours lance le combat (registre « magie sainte »).
// L'allié 1 est celui que l'on dirige ; ce peut être l'écho de la dernière partie, tel qu'il est (une copie).
// Règles sans affichage : src/moteur/combat/arene.ts.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Arene as A, descriptionDepuisEtat, TECHNIQUES, type DescriptionCombattant } from '@/moteur/combat';
import { CLES_CARACS, apparence, type CleCarac, type Etat } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { EcranCombat, type AdversaireCombat } from '../combat/EcranCombat';
import { Repere } from '../commun/Repere';
import { useMusique } from '../commun/musique';
import './arene.css';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
const NOM_CARAC: Record<CleCarac, string> = { force: 'Force', agilite: 'Agilité', endurance: 'Endurance', robustesse: 'Robustesse', intelligence: 'Intelligence', perception: 'Perception' };
const ACK = 'soulseed.arene.avertissement';

export interface ProprietesArene {
  musique: boolean;
  /** L'écho de la dernière partie (s'il vit encore) : il peut être l'allié 1. */
  echoPartie?: Etat | null;
  surRetour: () => void;
}

interface CombatPret {
  cle: number;
  allie: DescriptionCombattant;
  imageAllie: string;
  compagnons: AdversaireCombat[];
  adversaires: AdversaireCombat[];
}

export function Arene({ musique, echoPartie, surRetour }: ProprietesArene) {
  const [terrain, setTerrain] = useState<number>(A.TERRAINS_ARENE[0].id);
  const [piste, setPiste] = useState<string>(A.PISTES_ARENE[0].cle);
  const [soins, setSoins] = useState(3);
  const [liste, setListe] = useState<A.ConfigArene[]>(() => [A.combattantParDefaut('allies', 0), A.combattantParDefaut('adversaires', 0)]);
  const [choisi, setChoisi] = useState({ camp: 'allies' as A.ConfigArene['camp'], rang: 0 });
  const [aide, setAide] = useState(false);
  const [avertissement, setAvertissement] = useState(() => { try { return sessionStorage.getItem(ACK) !== 'oui'; } catch { return true; } });
  const [decompte, setDecompte] = useState<number | null>(null);
  const [combat, setCombat] = useState<CombatPret | null>(null);
  const [issue, setIssue] = useState<A.IssueArene | null>(null);
  const [listeMusique, setListeMusique] = useState(false);
  const minuteur = useRef<number | null>(null);
  useEffect(() => () => { if (minuteur.current) clearInterval(minuteur.current); }, []);
  useMusique('select', { volume: 0.35, active: musique && !combat });

  const allies = liste.filter((c) => c.camp === 'allies');
  const adversaires = liste.filter((c) => c.camp === 'adversaires');
  const courant = liste.find((c) => c.camp === choisi.camp && c.rang === choisi.rang) ?? liste[0];
  const modifier = (f: (c: A.ConfigArene) => A.ConfigArene) => setListe((l) => l.map((c) => (c === courant ? f(c) : c)));
  const echoVivant = echoPartie && !echoPartie.mort ? echoPartie : null;
  const imageDe = (c: A.ConfigArene) => (c.votreEcho && echoVivant ? apparence(echoVivant) : A.imageArene(c.stade, A.formeArene(c.stade, c.forme), c.genre));
  const nomDe = (c: A.ConfigArene) => (c.votreEcho && echoVivant ? echoVivant.nom : c.nom || (c.camp === 'allies' ? `Allié ${c.rang + 1}` : `Adversaire ${c.rang + 1}`));
  const fond = A.TERRAINS_ARENE.find((t) => t.id === terrain) ?? A.TERRAINS_ARENE[0];
  const clic = () => SFX.holyClick();

  const nombre = (camp: A.ConfigArene['camp'], n: number) => {
    clic();
    setListe((l) => A.ajusterCamp(l, camp, n));
    if (choisi.camp === camp && choisi.rang >= n) setChoisi({ camp, rang: 0 });
  };

  // ——— lancement : 3, 2, 1, puis le combat
  const lancer = () => {
    if (decompte != null) return;
    SFX.holyClick();
    setIssue(null);
    setDecompte(3);
    let n = 3;
    minuteur.current = window.setInterval(() => {
      n -= 1;
      if (n > 0) { setDecompte(n); SFX.holyHover(); return; }
      if (minuteur.current) clearInterval(minuteur.current);
      minuteur.current = null;
      setDecompte(null);
      demarrer();
    }, 1000);
  };
  const demarrer = () => {
    const prets = liste.map((c) => {
      if (c.votreEcho && echoVivant) return { description: { ...descriptionDepuisEtat(echoVivant), pv: null }, image: apparence(echoVivant) };
      return A.preparerCombattant(c, Math.random);
    });
    const deCamp = (camp: A.ConfigArene['camp']) => liste.map((c, i) => ({ c, p: prets[i] })).filter((x) => x.c.camp === camp).sort((a, b) => a.c.rang - b.c.rang).map((x) => x.p);
    const al = deCamp('allies'), ad = deCamp('adversaires');
    setCombat({ cle: Date.now(), allie: al[0].description, imageAllie: al[0].image, compagnons: al.slice(1), adversaires: ad });
  };

  if (combat) {
    const [premier, ...renforts] = combat.adversaires;
    return (
      <EcranCombat key={combat.cle} allie={combat.allie} adversaire={premier} renforts={renforts} registre="sainte" terrain={fond.image}
        piste={piste} musique={musique} demarrageAuto
        arene={{ imageAllie: combat.imageAllie, compagnons: combat.compagnons, soins, surArret: () => { setIssue('arrete'); setCombat(null); } }}
        surFin={(x) => { setIssue(x.resultat === 'victoire' ? 'victoire' : x.resultat === 'defaite' ? 'defaite' : 'arrete'); setCombat(null); }} />
    );
  }

  const forme = A.formeArene(courant.stade, courant.forme);
  const pool = A.poolArene(courant.stade, forme);
  const formes = A.formesArene(courant.stade);
  const nomPiste = A.PISTES_ARENE.find((p) => p.cle === piste)?.nom ?? '';

  return (
    <Repere fond="#060812">
      <div className="ar">
        <div className="ar-fond" style={{ backgroundImage: `url(${asset(fond.image)})` }} />
        <div className="ar-lumiere" />
        {PARTICULES.map((m, i) => <span key={i} className="ar-monte" style={{ left: m.x, width: m.t, height: m.t, animationDelay: `${m.d}s`, animationDuration: `${m.v}s`, '--dx': `${m.dx}px` } as CSSProperties} />)}

        <header className="ar-haut">
          <div className="ar-titre"><i className="ar-gemme" />Mode Arène<span>combats libres · rien n’y compte pour vos parties</span></div>
          <div className="ar-boutons">
            <button className="ar-pill" onMouseEnter={() => SFX.holyHover()} onClick={() => { clic(); setAide(true); }}>Aide</button>
            <button className="ar-pill" onMouseEnter={() => SFX.holyHover()} onClick={() => { clic(); surRetour(); }}>Retour au menu</button>
          </div>
        </header>

        {/* ——— à gauche : le combat lui-même */}
        <aside className="ar-reglages ar-verre">
          <h3>Terrain</h3>
          <div className="ar-terrains">
            {A.TERRAINS_ARENE.map((t) => (
              <button key={t.id} className={`ar-terrain ${t.id === terrain ? 'choisi' : ''}`} style={{ backgroundImage: `url(${asset(t.image)})` }}
                onMouseEnter={() => SFX.holyHover()} onClick={() => { clic(); setTerrain(t.id); }}>
                <span>{t.nom}</span>
              </button>
            ))}
          </div>
          <h3>Musique</h3>
          <div className="ar-musique">
            <button className="ar-champ" onClick={() => { clic(); setListeMusique((v) => !v); }} aria-expanded={listeMusique}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 18V6l10-2v12" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="16" r="2" /></svg>
              {nomPiste}<span className="ar-chevron" />
            </button>
            {listeMusique && (
              <div className="ar-liste">
                {A.PISTES_ARENE.map((p) => (
                  <button key={p.cle} className={p.cle === piste ? 'choisi' : ''} onClick={() => { clic(); setPiste(p.cle); setListeMusique(false); }}>
                    {p.nom}{p.cle === 'combat-arena' && <em>celle de l’arène</em>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <h3>Soins d’arène</h3>
          <div className="ar-ligne">
            <div className="ar-pansements" aria-label={`${soins} soins`}>
              {Array.from({ length: A.SOINS_ARENE_MAX }, (_, i) => (
                <button key={i} className={i < soins ? 'plein' : ''} onClick={() => { clic(); setSoins(i + 1 === soins ? i : i + 1); }} aria-label={`${i + 1} soin${i ? 's' : ''}`}>
                  <img src={asset('objets/divers/pansement.png')} alt="" />
                </button>
              ))}
            </div>
            <span className="ar-note">{soins === 0 ? 'aucun' : `chacun rend un peu de forces à ${nomDe(allies[0])}`}</span>
          </div>
          <div className="ar-nombres">
            <div><h3>Alliés</h3><Nombres n={allies.length} surChoix={(n) => nombre('allies', n)} /></div>
            <div><h3>Adversaires</h3><Nombres n={adversaires.length} surChoix={(n) => nombre('adversaires', n)} /></div>
          </div>
          <p className="ar-regle">Pendant le combat, « Mettre fin au combat » remplace la fuite. Ni victoire, ni blessure, ni fatigue ne quittent l’arène.</p>
        </aside>

        {/* ——— à droite : les combattants */}
        <section className="ar-face">
          {issue && <div key={issue} className={`ar-issue ${issue}`}>{A.TEXTE_ISSUE[issue]}</div>}
          <div className="ar-versus">
            <div className="ar-camp">
              {allies.map((c) => <Vignette key={'a' + c.rang} image={imageDe(c)} nom={nomDe(c)} sous={c.rang === 0 ? 'celui que vous dirigez' : `allié ${c.rang + 1}`} choisi={courant === c} surChoix={() => { clic(); setChoisi({ camp: 'allies', rang: c.rang }); }} />)}
            </div>
            <div className="ar-contre"><i className="ar-gemme" /><span>contre</span></div>
            <div className="ar-camp adverse">
              {adversaires.map((c) => <Vignette key={'d' + c.rang} image={imageDe(c)} nom={nomDe(c)} sous={`adversaire ${c.rang + 1}`} choisi={courant === c} surChoix={() => { clic(); setChoisi({ camp: 'adversaires', rang: c.rang }); }} />)}
            </div>
          </div>

          <div className="ar-fiche ar-verre">
            <div className="ar-portrait">
              <div className="ar-halo" />
              <img key={imageDe(courant)} src={asset(imageDe(courant))} alt={nomDe(courant)} />
              <div className="ar-camp-etiquette">{courant.camp === 'allies' ? (courant.rang === 0 ? 'Allié 1 · vous le dirigez' : `Allié ${courant.rang + 1}`) : `Adversaire ${courant.rang + 1}`}</div>
            </div>
            <div className="ar-edition">
              {courant.camp === 'allies' && courant.rang === 0 && echoVivant && (
                <div className="ar-votre">
                  <button className={`ar-puce ${!courant.votreEcho ? 'on' : ''}`} onClick={() => { clic(); modifier((c) => ({ ...c, votreEcho: false })); }}>Un écho de l’arène</button>
                  <button className={`ar-puce ${courant.votreEcho ? 'on' : ''}`} onClick={() => { clic(); modifier((c) => ({ ...c, votreEcho: true })); }}>Votre écho : {echoVivant.nom}</button>
                </div>
              )}
              {courant.votreEcho && echoVivant ? (
                <p className="ar-texte">
                  {echoVivant.nom} entre dans l’arène tel{echoVivant.genre === 'f' ? 'le' : ''} qu’{echoVivant.genre === 'f' ? 'elle' : 'il'} est, avec les techniques qu’{echoVivant.genre === 'f' ? 'elle' : 'il'} a apprises et toutes ses forces.
                  Ce n’est qu’un reflet : sa partie n’en saura rien, ni victoire, ni blessure, ni fatigue.
                </p>
              ) : (
                <>
                  <div className="ar-ligne">
                    <input className="ar-nom" value={courant.nom} maxLength={18} onChange={(ev) => { const v = ev.target.value; modifier((c) => ({ ...c, nom: v })); }} aria-label="Nom" placeholder="Nom" />
                    <div className="ar-groupe">
                      <button className={`ar-puce ${courant.genre === 'm' ? 'on' : ''}`} onClick={() => { clic(); modifier((c) => ({ ...c, genre: 'm' })); }}>Mâle</button>
                      <button className={`ar-puce ${courant.genre === 'f' ? 'on' : ''}`} onClick={() => { clic(); modifier((c) => ({ ...c, genre: 'f' })); }}>Femelle</button>
                    </div>
                  </div>
                  <h4>Stade</h4>
                  <div className="ar-groupe">
                    {A.STADES_ARENE.map((s) => (
                      <button key={s.cle} className={`ar-puce ${courant.stade === s.cle ? 'on' : ''}`} onClick={() => { clic(); modifier((c) => A.changerStade(c, s.cle)); }}>{s.nom}</button>
                    ))}
                  </div>
                  <h4>Forme <span>{forme.nom}</span></h4>
                  <div className="ar-formes">
                    {formes.map((f) => (
                      <button key={f.code} className={`ar-forme ${f.code === courant.forme ? 'choisi' : ''}`} title={f.nom} onClick={() => { clic(); modifier((c) => A.changerForme(c, f.code)); }}>
                        <img src={asset(A.imageArene(courant.stade, f, courant.genre))} alt={f.nom} loading="lazy" />
                      </button>
                    ))}
                  </div>
                  <h4>Techniques <span>{courant.stade === 'bebe' ? 'les bébés n’en ont aucune' : `${['aucune', 'une', 'deux', 'trois'][courant.techniques.length]} sur trois`}</span>
                    {pool.length > 0 && <button className="ar-lien" onClick={() => { clic(); modifier((c) => A.techniquesAuHasard(c, Math.random)); }}>au hasard</button>}
                  </h4>
                  <div className="ar-techniques">
                    {pool.map((n) => {
                      const on = courant.techniques.includes(n);
                      const plein = !on && courant.techniques.length >= 3;
                      return (
                        <button key={n} className={`ar-tech ${on ? 'on' : ''} ${plein ? 'plein' : ''}`} title={TECHNIQUES[n]?.description} onClick={() => { clic(); modifier((c) => A.basculerTechnique(c, n)); }}>
                          <img src={asset(`interface/techniques/${TECHNIQUES[n]?.categorie ?? 'physique'}.png`)} alt="" />{n}
                        </button>
                      );
                    })}
                  </div>
                  <h4>Puissance
                    <span className="ar-groupe petit">
                      <button className={`ar-puce ${courant.caracs.mode === 'tranche' ? 'on' : ''}`} onClick={() => { clic(); modifier((c) => ({ ...c, caracs: { mode: 'tranche', tranche: c.caracs.mode === 'tranche' ? c.caracs.tranche : 'combattant' } })); }}>une pour toutes</button>
                      <button className={`ar-puce ${courant.caracs.mode === 'detail' ? 'on' : ''}`} onClick={() => {
                        clic();
                        modifier((c) => {
                          const t = c.caracs.mode === 'tranche' ? c.caracs.tranche : 'combattant';
                          return c.caracs.mode === 'detail' ? c : { ...c, caracs: { mode: 'detail', tranches: Object.fromEntries(CLES_CARACS.map((k) => [k, t])) as Record<CleCarac, A.CleTranche> } };
                        });
                      }}>une par caractéristique</button>
                    </span>
                  </h4>
                  {courant.caracs.mode === 'tranche' ? (
                    <Echelle valeur={courant.caracs.tranche} surChoix={(t) => { clic(); modifier((c) => ({ ...c, caracs: { mode: 'tranche', tranche: t } })); }} />
                  ) : (
                    <div className="ar-detail">
                      {CLES_CARACS.map((k) => (
                        <label key={k}><span>{NOM_CARAC[k]}</span>
                          <select value={(courant.caracs as { tranches: Record<CleCarac, A.CleTranche> }).tranches[k]}
                            onChange={(ev) => { const v = ev.target.value as A.CleTranche; modifier((c) => (c.caracs.mode === 'detail' ? { ...c, caracs: { mode: 'detail', tranches: { ...c.caracs.tranches, [k]: v } } } : c)); }}>
                            {A.TRANCHES.map((t) => <option key={t.cle} value={t.cle}>{t.nom}</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="ar-bas">
            <button className="ar-lancer" onMouseEnter={() => SFX.holyHover()} onClick={lancer} disabled={decompte != null}>Lancer le combat</button>
          </div>
        </section>

        {decompte != null && (
          <div className="ar-decompte"><span key={decompte}>{decompte}</span></div>
        )}

        {aide && (
          <div className="ar-voile" onClick={() => setAide(false)}>
            <div className="ar-boite ar-verre" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-modal="true">
              <h2>Comment régler un combat</h2>
              <p>Choisissez un terrain, une musique, le nombre de soins d’arène, puis le nombre de combattants de chaque côté (un à trois). L’allié 1 est toujours celui que vous dirigez pendant le combat{echoVivant ? ` ; ce peut être ${echoVivant.nom}, tel${echoVivant.genre === 'f' ? 'le' : ''} qu’${echoVivant.genre === 'f' ? 'elle' : 'il'} est dans votre dernière partie` : ''}.</p>
              <p>Pour chaque combattant : son stade (les formes fragmentées sont un stade à part, qui n’évolue jamais), sa forme, jusqu’à trois techniques, et sa puissance : une tranche pour toutes ses caractéristiques, chacune tirée au hasard dans la tranche, ou une tranche par caractéristique.</p>
              <p>Tranches, de la plus faible à la plus forte : {A.TRANCHES.map((t) => t.nom).join(', ')}.</p>
              <p>Pendant le combat, « Mettre fin au combat » remplace la fuite : tout s’arrête, sans vainqueur ni vaincu. Rien de ce qui se passe ici ne touche vos parties.</p>
              <div className="ar-actions"><button className="ar-lancer petit" onClick={() => { clic(); setAide(false); }}>Compris</button></div>
            </div>
          </div>
        )}

        {avertissement && (
          <div className="ar-voile">
            <div className="ar-boite ar-verre alerte" role="dialog" aria-modal="true">
              <h2>Attention, révélations</h2>
              <p>L’arène laisse essayer des formes d’écho (branches, formes mêlées, souvenirs, formes fragmentées…) que vous n’avez peut-être pas encore vues naître dans vos parties. N’entrez que si cela ne vous gêne pas de les découvrir en avance.</p>
              <div className="ar-actions">
                <button className="ar-pill" onClick={() => { clic(); surRetour(); }}>Revenir au menu principal</button>
                <button className="ar-lancer petit" onClick={() => { clic(); try { sessionStorage.setItem(ACK, 'oui'); } catch { /* navigation privée */ } setAvertissement(false); }}>Je comprends</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Repere>
  );
}

function Nombres({ n, surChoix }: { n: number; surChoix: (n: number) => void }) {
  return (
    <div className="ar-groupe">
      {[1, 2, 3].map((k) => <button key={k} className={`ar-puce rond ${n === k ? 'on' : ''}`} onClick={() => surChoix(k)} aria-label={`${k}`}>{['un', 'deux', 'trois'][k - 1]}</button>)}
    </div>
  );
}

function Vignette({ image, nom, sous, choisi, surChoix }: { image: string; nom: string; sous: string; choisi: boolean; surChoix: () => void }) {
  return (
    <button className={`ar-vignette ${choisi ? 'choisi' : ''}`} onMouseEnter={() => SFX.holyHover()} onClick={surChoix}>
      <span className="ar-socle" />
      <img src={asset(image)} alt="" />
      <b>{nom}</b><small>{sous}</small>
    </button>
  );
}

/** Les huit tranches, en mots, sur une échelle qui s'illumine jusqu'à la tranche choisie. */
function Echelle({ valeur, surChoix }: { valeur: A.CleTranche; surChoix: (t: A.CleTranche) => void }) {
  const i = A.TRANCHES.findIndex((t) => t.cle === valeur);
  return (
    <div className="ar-echelle">
      {A.TRANCHES.map((t, k) => (
        <button key={t.cle} className={`${k <= i ? 'allume' : ''} ${k === i ? 'on' : ''}`} onClick={() => surChoix(t.cle)}>
          <i /><span>{t.nom}</span>
        </button>
      ))}
    </div>
  );
}

const PARTICULES = Array.from({ length: 22 }, (_, i) => ({
  x: Math.round((i * 397) % 1280), t: 2 + (i % 3), d: -((i * 1.7) % 12), v: 9 + (i % 5) * 2, dx: ((i * 37) % 120) - 60,
}));
