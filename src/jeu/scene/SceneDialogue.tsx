// Scène de dialogue plein écran : décor, personnages sur la ligne des pieds, loupe de l'écho,
// feuille de dialogue écrite lettre à lettre avec la voix de chacun, choix colorés par leur résonance.
// L'action en cours est en pause derrière ; la scène rend la main à la fin (surFin).
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { volumeMusique } from '../commun/volumes';
import type { Asset, Catalogue, FichePNJ } from '@/contenu/types';
import { SFX } from '@/moteur/sfx';
import { direLettre, pauseApres, reglagesVoix } from '@/moteur/voix';
import { LecteurScene, type Changement, type Evenement } from '@/moteur/scene/lecteur';
import { PLACES, placer, rogner, type Place } from '@/moteur/scene/placement';
import { cheminDecor, cheminImage, cheminMusique } from '@/moteur/scene/valider';
import { imagesScene, precharger } from '../commun/prechargement';
import { afficherValeur } from '@/moteur/scene/expressions';
import { JOUEUR, NARRATION, type Resonance, type Scene, type Valeur } from '@/moteur/scene/types';
import { cadrage, styleCadre } from './cadrages';
import './scene.css';

export interface PropsSceneDialogue {
  scene: Scene;
  catalogue: Catalogue;
  /** variables de la partie et du profil au moment où la scène commence */
  variables?: Record<string, Valeur>;
  /** démarrer à cette ligne du fichier (aperçu de l'atelier) */
  depuisLigne?: number;
  /** l'écho du joueur : son nom et l'image de sa forme actuelle (absent : pas de loupe, l'écho n'est pas encore né) */
  echo: { nom: string; chemin: string } | null;
  /** portrait du joueur (carte qui apparaît au moment de choisir) */
  joueur?: string;
  /** mode aperçu : panneau des variables, bouton « Rejouer » */
  apercu?: boolean;
  sons?: boolean;
  musique?: boolean;
  /** appelé à chaque instruction jouée (pour suivre la lecture dans l'éditeur) */
  surLigne?: (ligne: number) => void;
  surFin?: (resultat: { suite?: string; variables: Record<string, Valeur> }) => void;
  /**
   * Une action mise en scène par le jeu (« action: eclosion ») : le jeu la joue, puis appelle `reprendre`
   * (en donnant au besoin des valeurs de variables, ex. { 'echo.nom': 'Filo' }). Sans gestionnaire, la scène continue.
   */
  surAction?: (nom: string, argument: string | undefined, reprendre: (variables?: Record<string, Valeur>) => void) => void;
  /** ce que le jeu dessine par-dessus la scène pendant ses actions (repère 1280 × 800) */
  calque?: ReactNode;
  /** scène jouée par-dessus l'écran du jeu (tutoriel du ranch) : pas de fond, le jeu reste visible derrière */
  transparent?: boolean;
}

interface PersoAffiche { qui: string; place: Place; expression?: string; etat: 'dehors' | 'la' | 'sort'; arrive: boolean }
type Affichage =
  | { type: 'replique'; qui: string; texte: string; tape: number; fini: boolean }
  | { type: 'choix'; question?: string; options: { index: number; resonance: Resonance; texte: string }[]; active: number; choisie: number }
  | { type: 'fin'; suite?: string }
  | { type: 'action'; nom: string }
  | null;

/** Durée de l'estompe de fin de scène (ms), accordée à l'animation `sc-sortie` de scene.css. */
const DUREE_SORTIE = 1000;
// voix de dialogue : bibliothèque de src/moteur/voix (champ « voix » des fiches de PNJ)
const VOIX_NARRATION = reglagesVoix({ timbre: 'narration', note: 330, rythme: 1.05 });
const VOIX_JOUEUR = reglagesVoix({ timbre: 'doux', note: 262, rythme: 1 });

export function SceneDialogue(props: PropsSceneDialogue) {
  const { scene, catalogue, echo, apercu } = props;
  const assets = useMemo(() => new Map(catalogue.assets.map((a) => [a.chemin, a])), [catalogue.assets]);
  const decors = useMemo(() => catalogue.assets.filter((a) => a.categorie === 'decors').map((a) => a.chemin), [catalogue.assets]);
  const musiques = useMemo(() => catalogue.assets.filter((a) => a.type === 'son').map((a) => a.chemin), [catalogue.assets]);

  const cadre = useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = useState(1);
  const [decor, setDecor] = useState<{ chemin?: string; cle: number }>({ cle: 0 });
  const [ancienDecor, setAncienDecor] = useState<{ chemin?: string; cle: number } | null>(null);
  const [musique, setMusique] = useState<string | null>(null);
  const [persos, setPersos] = useState<Record<string, PersoAffiche>>({});
  const [aff, setAff] = useState<Affichage>(null);
  const [emotion, setEmotion] = useState<{ emotion: string; note?: string; cle: number } | null>(null);
  const [bulle, setBulle] = useState(false);
  const [vars, setVars] = useState<{ nom: string; valeur: string; cle: number }[]>([]);
  const [carte, setCarte] = useState(false);
  const [image, setImage] = useState<{ chemin: string; cle: number } | null>(null);
  /** fin de scène : tout s'estompe en douceur, puis la scène rend la main */
  const [sortie, setSortie] = useState(false);

  const lecteur = useRef<LecteurScene | null>(null);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const affRef = useRef<Affichage>(null);
  const attente = useRef<{ id: ReturnType<typeof setTimeout>; f: () => void } | null>(null);
  const enMouvement = useRef(false);
  const compteur = useRef(0);
  const propsRef = useRef(props);
  propsRef.current = props;
  affRef.current = aff;

  const sfx = useCallback((nom: 'paperTick' | 'woosh' | 'pop' | 'stamp') => {
    if (propsRef.current.sons === false) return;
    SFX[nom]();
  }, []);

  const plusTard = useCallback((f: () => void, ms: number) => { minuteurs.current.push(setTimeout(f, ms)); }, []);
  const toutArreter = () => { minuteurs.current.forEach(clearTimeout); minuteurs.current = []; attente.current = null; enMouvement.current = false; };

  // --- Mise à l'échelle : le repère 1280 × 800 tient toujours entier dans l'écran
  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setEchelle(Math.min(el.clientWidth / 1280, el.clientHeight / 800)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- Déroulement
  const montrerVariable = (nom: string, valeur: Valeur) => {
    setVars((v) => [{ nom, valeur: afficherValeur(valeur), cle: ++compteur.current }, ...v.filter((x) => x.nom !== nom)].slice(0, 12));
  };

  const appliquer = (changements: Changement[]): number => {
    let t = 0;
    for (const c of changements) {
      const ici = t;
      switch (c.type) {
        case 'entre':
          plusTard(() => {
            setPersos((p) => ({ ...p, [c.qui]: { qui: c.qui, place: c.place, expression: c.expression, etat: 'dehors', arrive: false } }));
            requestAnimationFrame(() => requestAnimationFrame(() => {
              setPersos((p) => (p[c.qui] ? { ...p, [c.qui]: { ...p[c.qui], etat: 'la', arrive: true } } : p));
              sfx('paperTick');
            }));
            plusTard(() => setPersos((p) => (p[c.qui] ? { ...p, [c.qui]: { ...p[c.qui], arrive: false } } : p)), 700);
          }, ici);
          t += 450;
          break;
        case 'sort':
          plusTard(() => setPersos((p) => (p[c.qui] ? { ...p, [c.qui]: { ...p[c.qui], etat: 'sort' } } : p)), ici);
          plusTard(() => setPersos((p) => { const n = { ...p }; if (n[c.qui]?.etat === 'sort') delete n[c.qui]; return n; }), ici + 650);
          t += 500;
          break;
        case 'deplace':
          plusTard(() => setPersos((p) => (p[c.qui] ? { ...p, [c.qui]: { ...p[c.qui], place: c.place } } : p)), ici);
          t += 350;
          break;
        case 'expression':
          setPersos((p) => (p[c.qui] ? { ...p, [c.qui]: { ...p[c.qui], expression: c.expression } } : p));
          break;
        case 'decor':
          plusTard(() => {
            setDecor((d) => { setAncienDecor(d); return { chemin: cheminDecor(c.decor, decors), cle: d.cle + 1 }; });
            sfx('woosh');
          }, ici);
          plusTard(() => setAncienDecor(null), ici + 1000);
          t += 800;
          break;
        case 'musique':
          setMusique(c.musique ? cheminMusique(c.musique, musiques) : null);
          break;
        case 'variable':
          montrerVariable(c.nom, c.apres);
          break;
      }
    }
    return t;
  };

  const voixDe = (qui: string) => {
    if (qui === NARRATION) return VOIX_NARRATION;
    if (qui === JOUEUR) return VOIX_JOUEUR;
    const f = catalogue.pnj[qui];
    return f ? reglagesVoix(f.voix as Parameters<typeof reglagesVoix>[0]) : VOIX_NARRATION;
  };

  const taper = () => {
    const a = affRef.current;
    if (!a || a.type !== 'replique' || a.fini) return;
    if (a.tape >= a.texte.length) { setAff({ ...a, fini: true }); return; }
    const ch = a.texte[a.tape];
    const v = voixDe(a.qui);
    if (propsRef.current.sons !== false) direLettre(a.texte, a.tape, v);
    const d = pauseApres(ch);
    const suivant = { ...a, tape: a.tape + 1 };
    affRef.current = suivant;
    setAff(suivant);
    plusTard(taper, Math.round(d * v.rythme));
  };

  const attendrePuis = (f: () => void, ms: number) => {
    const id = setTimeout(() => { attente.current = null; f(); }, ms);
    attente.current = { id, f };
    minuteurs.current.push(id);
  };

  const montrer = (ev: Evenement) => {
    if (ev.type !== 'fin' && 'ligne' in ev) propsRef.current.surLigne?.(ev.ligne);
    switch (ev.type) {
      case 'replique': {
        setCarte(ev.qui === JOUEUR);
        const a: Affichage = { type: 'replique', qui: ev.qui, texte: ev.texte, tape: 0, fini: false };
        affRef.current = a;
        setAff(a);
        plusTard(taper, 180);
        break;
      }
      case 'emotion':
        sfx('pop');
        {
          const cle = ++compteur.current;
          setEmotion({ emotion: ev.emotion, note: ev.note, cle });
          plusTard(() => setEmotion((e) => (e?.cle === cle ? { ...e, note: undefined } : e)), 5200);
        }
        setBulle(true);
        plusTard(() => setBulle(false), 2600);
        attendrePuis(avancer, ev.note ? 1700 : 1100);
        break;
      case 'pause':
        attendrePuis(avancer, ev.secondes * 1000);
        break;
      case 'choix':
        setCarte(true);
        setAff({ type: 'choix', question: ev.question, options: ev.options, active: -1, choisie: -1 });
        break;
      case 'action': {
        setCarte(false);
        if (ev.nom === 'image') {
          // une image épinglée au-dessus de la scène, jusqu'à « action: image aucune »
          const a = ev.argument && !/^(aucune|rien)$/i.test(ev.argument) ? cheminImage(ev.argument) : null;
          if (a) sfx('woosh');
          setImage(a ? { chemin: a, cle: ++compteur.current } : null);
          avancer();
          break;
        }
        const a: Affichage = { type: 'action', nom: ev.nom };
        affRef.current = a; setAff(a);
        const gestion = propsRef.current.surAction;
        if (!gestion) { attendrePuis(avancer, 600); break; }
        let repris = false;
        gestion(ev.nom, ev.argument, (variables) => {
          if (repris) return; repris = true;
          for (const [k, v] of Object.entries(variables || {})) { lecteur.current?.definir(k, v); montrerVariable(k, v); }
          avancer();
        });
        break;
      }
      case 'fin': {
        // pas de « fin de scène » écrite : le cadre et les personnages s'estompent, puis le jeu reprend la main
        setCarte(false);
        setAff({ type: 'fin', suite: ev.suite });
        setSortie(true);
        const variables = { ...lecteur.current!.etat.variables };
        if (!propsRef.current.apercu) plusTard(() => propsRef.current.surFin?.({ suite: ev.suite, variables }), DUREE_SORTIE);
        break;
      }
    }
  };

  function avancer() {
    const l = lecteur.current;
    if (!l || l.enAttenteDeChoix) return; // un choix arrive (après une entrée en scène) : on l'attend
    let pas;
    try { pas = l.suivant(); } catch (e) { console.error(e); return; }
    const delai = appliquer(pas.changements);
    // pendant une entrée en scène, un clic de plus ne doit pas sauter l'événement qui la suit
    if (delai) { enMouvement.current = true; plusTard(() => { enMouvement.current = false; montrer(pas.evenement); }, delai + 120); }
    else montrer(pas.evenement);
  }

  const demarrer = useCallback(() => {
    toutArreter();
    const p = propsRef.current;
    const l = new LecteurScene(p.scene, { variables: { ...(p.echo ? { 'echo.nom': p.echo.nom } : {}), ...(p.variables || {}) }, depuisLigne: p.depuisLigne });
    lecteur.current = l;
    setAff(null); affRef.current = null; setEmotion(null); setBulle(false); setCarte(false); setImage(null); setSortie(false);
    setVars(Object.entries(p.variables || {}).filter(([k]) => k !== 'echo.nom').map(([nom, v]) => ({ nom, valeur: afficherValeur(v), cle: ++compteur.current })));
    setDecor((d) => ({ chemin: l.etat.decor ? cheminDecor(l.etat.decor, decors) : undefined, cle: d.cle + 1 }));
    setAncienDecor(null);
    setMusique(l.etat.musique ? cheminMusique(l.etat.musique, musiques) : null);
    const depart = Object.entries(l.presentsDepart);
    setPersos(Object.fromEntries(depart.map(([qui, pr]) => [qui, { qui, place: pr.place, expression: pr.expression, etat: 'dehors' as const, arrive: false }])));
    plusTard(() => sfx('woosh'), 150);
    depart.forEach(([qui], n) => plusTard(() => {
      setPersos((p) => (p[qui] ? { ...p, [qui]: { ...p[qui], etat: 'la', arrive: true } } : p));
      plusTard(() => setPersos((p) => (p[qui] ? { ...p, [qui]: { ...p[qui], arrive: false } } : p)), 700);
    }, 450 + n * 220));
    plusTard(avancer, 1100 + depart.length * 150);
  }, [decors, musiques]); // eslint-disable-line react-hooks/exhaustive-deps

  // (re)démarre quand la scène ou le point de départ change — `variables` doit donc être un objet stable (useMemo)
  // décors et expressions de la scène : demandés en priorité dès son ouverture (src/jeu/commun/prechargement.ts)
  useEffect(() => { precharger(imagesScene(scene), { urgent: true }); }, [scene]);
  useEffect(() => { demarrer(); return toutArreter; }, [scene, props.depuisLigne, props.variables, demarrer]);

  const choisir = (index: number) => {
    const a = affRef.current;
    if (!a || a.type !== 'choix' || a.choisie >= 0) return;
    setAff({ ...a, choisie: index, active: index });
    plusTard(() => sfx('stamp'), 150);
    plusTard(() => {
      setCarte(false);
      lecteur.current?.choisir(index);
      avancer();
    }, 800);
  };

  const cliquer = () => {
    if (enMouvement.current) return;
    const a = affRef.current;
    if (attente.current) { const { id, f } = attente.current; clearTimeout(id); attente.current = null; f(); return; }
    if (!a || a.type === 'action') return; // le jeu joue son action : il reprendra la main
    if (a.type === 'replique') {
      if (!a.fini) {
        toutArreter();
        const fini = { ...a, tape: a.texte.length, fini: true };
        affRef.current = fini; setAff(fini);
      } else avancer();
    } else if (a.type === 'fin' && apercu) demarrer();
  };

  // --- Clavier : Espace / Entrée pour avancer, 1 à 4 pour répondre
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (cible.closest('input, textarea, select, .cm-editor, [contenteditable]')) return;
      const a = affRef.current;
      if (a?.type === 'choix' && /^[1-9]$/.test(e.key)) { const o = a.options[+e.key - 1]; if (o) { e.preventDefault(); choisir(o.index); } return; }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); cliquer(); }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Musique d'ambiance (fondu à chaque changement)
  useEffect(() => {
    if (!musique || props.musique === false) return;
    const a = assets.get(musique);
    if (!a) return;
    const audio = new Audio(a.url);
    audio.loop = true; audio.volume = 0;
    audio.play().catch(() => {});
    let v = 0;
    const haut = 0.45 * volumeMusique();
    const monte = setInterval(() => { v = Math.min(haut, v + 0.03); audio.volume = v; if (v >= haut) clearInterval(monte); }, 80);
    return () => {
      clearInterval(monte);
      const descend = setInterval(() => { v = Math.max(0, v - 0.04); audio.volume = v; if (v <= 0) { clearInterval(descend); audio.pause(); } }, 60);
    };
  }, [musique, props.musique, assets]);

  // --- Rendu
  const parleur = aff?.type === 'replique' ? aff.qui : null;
  const unPNJParle = !!parleur && parleur !== NARRATION && parleur !== JOUEUR;
  const assetDecor = decor.chemin ? assets.get(decor.chemin) : undefined;
  const assetAncien = ancienDecor?.chemin ? assets.get(ancienDecor.chemin) : undefined;
  const assetEcho = echo ? assets.get(echo.chemin) : undefined;
  const assetImage = image ? assets.get(image.chemin) : undefined;
  const assetJoueur = assets.get(props.joueur || 'joueur/joueur.png');
  const nomParleur = parleur === JOUEUR ? 'Vous' : parleur && parleur !== NARRATION ? catalogue.pnj[parleur]?.nom || parleur : '';
  const encreParleur = parleur && catalogue.pnj[parleur] ? catalogue.pnj[parleur].encre : '#6b4f33';

  return (
    <div className={`sc-cadre${props.transparent ? ' transparent' : ''}`} ref={cadre}>
      <div className={`sc-repere ${sortie ? 'sortie' : ''}`} style={{ transform: `translate(-50%, -50%) scale(${echelle})` }} onClick={cliquer}>
        {assetAncien && <div key={'a' + ancienDecor!.cle} className="sc-decor sort" style={{ backgroundImage: `url(${assetAncien.url})` }} />}
        {assetDecor && <div key={'d' + decor.cle} className="sc-decor" style={{ backgroundImage: `url(${assetDecor.url})` }} />}
        <div className="sc-vignettage" />
        {/* calque du jeu (lueur du tutoriel…) : sous les personnages et la feuille, qui restent lisibles */}
        {props.calque}

        {Object.values(persos).map((p) => (
          <Personnage key={p.qui} perso={p} fiche={catalogue.pnj[p.qui]} assets={assets} parle={parleur === p.qui} tape={aff?.type === 'replique' && !aff.fini && parleur === p.qui} estompe={unPNJParle && parleur !== p.qui} />
        ))}

        {assetImage && <div key={image!.cle} className="sc-photo"><img src={assetImage.url} alt="" /></div>}

        {apercu && vars.length > 0 && (
          <div className="sc-variables">
            <div className="titre">Variables</div>
            {vars.map((v) => <div key={v.cle} className="ligne"><span>{v.nom}</span><b>{v.valeur}</b></div>)}
          </div>
        )}

        <div className="sc-flou" />
        <div className="sc-ombre" />

        {echo && <Loupe echo={assetEcho} nom={echo.nom} decor={assetDecor} emotion={bulle && emotion ? assets.get(`emotions/${emotion.emotion}.png`) : undefined} cleEmotion={emotion?.cle} />}
        {emotion?.note && <div key={emotion.cle} className="sc-note">{emotion.note}</div>}

        <div className="sc-feuille">
          {aff?.type === 'replique' && (
            <>
              <div className="sc-replique">
                <div style={{ height: 30, display: 'flex', alignItems: 'center' }}>
                  {aff.qui === NARRATION
                    ? <span className="sc-etiquette narration">narration</span>
                    : <span key={aff.qui + aff.texte} className="sc-etiquette" style={{ color: encreParleur }}>{nomParleur}</span>}
                </div>
                <p className={`sc-texte ${aff.qui === NARRATION ? 'narration' : ''}`}>
                  {aff.texte.slice(0, aff.tape)}
                  {!aff.fini && <span className="sc-curseur" />}
                </p>
              </div>
              {aff.fini && <div className="sc-suite"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M6 9l6 6 6-6" /></svg></div>}
            </>
          )}
          {aff?.type === 'choix' && (
            <div className="sc-choix">
              <div className="sc-question">{aff.question || 'Que répondre ?'}</div>
              <div className={`sc-options ${aff.options.length > 4 ? 'serre' : ''}`}>
                {aff.options.map((o, i) => {
                  const etat = aff.choisie >= 0 ? (aff.choisie === o.index ? 'choisie' : 'estompee') : aff.active === o.index ? 'active' : '';
                  return (
                    <button key={o.index} className={`sc-option ${etat}`} style={{ animationDelay: `${i * 70}ms` }}
                      onMouseEnter={() => { if (affRef.current?.type === 'choix' && affRef.current.choisie < 0 && affRef.current.active !== o.index) { sfx('paperTick'); setAff({ ...affRef.current, active: o.index }); } }}
                      onClick={(e) => { e.stopPropagation(); choisir(o.index); }}>
                      {/* les réponses d'un dialogue n'affichent plus de tempérament (intérêt scénaristique) ; les événements du ranch gardent les leurs */}
                      <span className="puce" aria-hidden />
                      <span className="texte">{o.texte}</span>
                      {aff.choisie < 0 && <span className="touche">{i + 1}</span>}
                      {aff.choisie === o.index && (
                        <svg className="sc-tampon-ok" viewBox="0 0 40 40" aria-hidden><circle cx="20" cy="20" r="16.5" fill="rgba(63,122,58,.08)" stroke="#3f7a3a" strokeWidth="3" /><path d="M12.5 20.5l5 5 10-11" fill="none" stroke="#3f7a3a" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {aff?.type === 'fin' && apercu && (
          <div className="sc-rejouer">
            {aff.suite && <div className="mot">Suite : {aff.suite}</div>}
            <button className="sc-bouton-cuir" onClick={(e) => { e.stopPropagation(); demarrer(); }}>Rejouer la scène</button>
          </div>
        )}

        {carte && assetJoueur && (
          <div className="sc-carte">
            <div className="portrait">
              <img src={assetJoueur.url} alt="Vous" draggable={false}
                style={assetJoueur.l && assetJoueur.h ? styleCadre(cadrageCarte(assetJoueur), assetJoueur.l, assetJoueur.h, 134, 150) : { width: '100%' }} />
            </div>
            <div className="legende">vous</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Personnage({ perso, fiche, assets, parle, tape, estompe }: { perso: PersoAffiche; fiche?: FichePNJ; assets: Map<string, Asset>; parle: boolean; tape: boolean; estompe: boolean }) {
  if (!fiche) return null;
  const chemin = (perso.expression && fiche.expressions[perso.expression]) || (fiche.defaut ? fiche.expressions[fiche.defaut] : undefined);
  const a = chemin ? assets.get(chemin) : undefined;
  if (!a || !a.l || !a.h) return null;
  const { hauteur, bas } = placer(fiche.taille, fiche.visible);
  const r = rogner({ l: a.l, h: a.h, boite: a.boite }, hauteur);
  const gauche = perso.place[0] === 'G';
  const dx = perso.etat === 'la' ? 0 : gauche ? -160 : 160;
  const dy = parle ? -6 : estompe ? 10 : 0;
  const s = parle ? 1.04 : 1;
  return (
    <div
      className={`sc-perso ${tape ? 'parle' : ''} ${perso.arrive ? 'arrive' : ''} ${!gauche && fiche.miroirADroite ? 'miroir' : ''}`}
      style={{
        left: PLACES[perso.place], bottom: bas, width: r.cadre.width, height: r.cadre.height,
        opacity: perso.etat === 'la' ? 1 : 0,
        filter: estompe ? 'brightness(.5) saturate(.6)' : 'none',
        transform: `translateX(calc(-50% + ${dx}px)) translateY(${dy}px) scale(${s})`,
        zIndex: parle ? 5 : perso.place[1] === '2' ? 4 : 3
      }}
    >
      <div className="sc-corps">
        <div className="sc-rogne" style={r.cadre}>
          <img src={a.url} alt={fiche.nom} style={r.image} draggable={false} />
        </div>
      </div>
    </div>
  );
}

/** Cadrage du portrait sur la carte « vous » : le visage centré, un peu plus de buste que dans les pastilles. */
function cadrageCarte(a: Asset) {
  const c = cadrage(a.chemin, a.l!, a.h!, a.boite);
  return { ...c, y: c.y + 0.04, d: c.d * 1.12 };
}

function Loupe({ echo, nom, decor, emotion, cleEmotion }: { echo?: Asset; nom: string; decor?: Asset; emotion?: Asset; cleEmotion?: number }) {
  // Le visage de l'écho au centre de la loupe : cadrage propre à chaque image (src/jeu/scene/cadrages.ts).
  const image = echo?.l && echo.h ? styleCadre(cadrage(echo.chemin, echo.l, echo.h, echo.boite), echo.l, echo.h, 150, 150) : undefined;
  return (
    <div className="sc-echo">
      <div className="perle" style={{ left: 96, top: 146, width: 10, height: 10 }} />
      <div className="perle" style={{ left: 112, top: 160, width: 6, height: 6, opacity: 0.8 }} />
      <div className="perle" style={{ left: 124, top: 170, width: 4, height: 4, opacity: 0.6 }} />
      <div className="sc-loupe">
        {decor && <div className="fond" style={{ backgroundImage: `url(${decor.url})` }} />}
        {echo && image && <div className="visage"><img src={echo.url} alt={nom} style={image} draggable={false} /></div>}
        <div className="bord" />
        <div className="reflet" />
      </div>
      <div className="nom">{nom}</div>
      {emotion && (
        <div key={cleEmotion} className="sc-bulle">
          <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden style={{ position: 'absolute', inset: 0 }}>
            <path d="M43 4c21 0 38 15 38 34S64 72 43 72c-4 0-7 0-10-1l-16 9 5-13C11 61 5 50 5 38 5 19 22 4 43 4z" fill="#fbf4e3" stroke="#3a1f0e" strokeWidth="2.5" />
          </svg>
          <img src={emotion.url} alt="" />
        </div>
      )}
    </div>
  );
}
