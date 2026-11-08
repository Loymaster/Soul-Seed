// La séquence d'évolution au ranch (magie sainte, dans l'identité du jeu : cuir, carnet, lueurs).
// Le ranch s'assombrit, l'écho s'élève au centre, la lumière converge sur lui, il devient silhouette blanche,
// l'ancienne et la nouvelle forme battent de plus en plus vite — à chaque battement, la silhouette se fond de l'une
// dans l'autre (morphing.ts, réglage MORPHING) —, un éclat, puis la nouvelle forme se révèle et une page du carnet
// nomme le changement. Clic pendant la séquence : on passe directement à la révélation.
// Dessinée dans le repère 1280 × 800 du ranch, par-dessus tout ; aucune logique de jeu ici.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { SFX } from '@/moteur/sfx';
import { MARGE as MARGE_MORPH, UNE_SEULE_FOIS, avancement, avancementContinu, preparerMorphing, type Morphing, type RenduMorphing } from './morphing';
import './evolution.css';

/** Le passage d'une silhouette à l'autre pendant les battements : « poussiere » (choisie : en une seule fois, 6 s,
 *  fusion lente en fond et nuée de grains colorés), « fusion » (champs de distance), « brume », ou « battement » (l'alternance d'origine). Proposition : outils/evolution/proposition-morphing.html.
 *  En développement, `localStorage['soulseed:morphing']` le remplace (pour comparer dans le jeu). */
export const MORPHING: Morphing = 'poussiere';
const modeMorphing = (): Morphing => {
  if (import.meta.env.DEV) { try { const m = localStorage.getItem('soulseed:morphing'); if (m && ['fusion', 'brume', 'poussiere', 'battement'].includes(m)) return m as Morphing; } catch { /* stockage indisponible */ } }
  return MORPHING;
};

export interface ProprietesEvolution {
  /** images de l'ancienne et de la nouvelle forme */
  de: string;
  vers: string;
  /** facteurs de taille de chaque forme (demarche.ts : 1 = 90 cm) */
  tailleDe: number;
  tailleVers: number;
  /** où se tient l'écho au ranch (pieds, repère 1280 × 800) et son échelle de perspective */
  depart: { x: number; y: number; echelle: number };
  /** la page du carnet */
  surtitre: string;
  titre: string;
  texte: string;
  sons: boolean;
  /** fin de la séquence (le ranch reprend : musique, temps) */
  surFin: () => void;
}

type Phase = 'sombre' | 'eleve' | 'lumiere' | 'blanc' | 'bat' | 'eclat' | 'revele' | 'page' | 'sort';
/** Instants des phases (ms). */
const T = { eleve: 700, lumiere: 1900, blanc: 4300, bat: 5300, eclat: 8600, revele: 8800, page: 10600 } as const;
/** « poussiere » se joue en une seule fois sur 6 s (la proposition validée) : la suite de la séquence est décalée d'autant. */
const DUREE_UNE_FOIS = 6000;
const decalage = (mode: Morphing) => (UNE_SEULE_FOIS.includes(mode) ? T.bat + DUREE_UNE_FOIS - T.eclat : 0);
/** Battements de la silhouette, de plus en plus rapprochés (ms après le début des battements). */
const BATTEMENTS = (() => { const r: number[] = []; let t = 0, d = 520; while (t < T.eclat - T.bat - 120) { r.push(t); t += d; d = Math.max(70, d * 0.8); } return r; })();
const CENTRE = { x: 640, y: 520 };
/** hauteur de l'image de référence (90 cm) au ranch, et grossissement au centre */
const H = 190, LOUPE = 1.75;

export function Evolution(p: ProprietesEvolution) {
  const [phase, setPhase] = useState<Phase>('sombre');
  const [montre, setMontre] = useState<'de' | 'vers'>('de');
  const minuteurs = useRef<number[]>([]);
  const fini = useRef(false);
  const bouton = useRef<HTMLButtonElement>(null);
  // le morphing : préparé dès le début (pendant la montée de lumière), dessiné pendant les battements
  const hote = useRef<HTMLDivElement>(null);
  const rendu = useRef<RenduMorphing | null>(null);
  const [morph, setMorph] = useState<{ largeur: number; hauteur: number } | null>(null);
  const boucle = useRef(0);
  const son = (f: () => void) => { if (p.sons) { try { f(); } catch { /* pas de son */ } } };

  // les grains de lumière qui convergent, et les étincelles qui retombent ensuite (tirés une fois)
  const grains = useMemo(() => Array.from({ length: 46 }, (_, i) => {
    const a = Math.random() * Math.PI * 2, r = 260 + Math.random() * 380;
    return { i, x: Math.cos(a) * r, y: Math.sin(a) * r * 0.75, delai: (Math.random() * 2.6).toFixed(2), duree: (1.3 + Math.random() * 1.1).toFixed(2), taille: (3 + Math.random() * 6).toFixed(1), teinte: Math.random() < 0.7 ? '255,236,170' : '190,225,255' };
  }), []);
  const etincelles = useMemo(() => Array.from({ length: 34 }, (_, i) => ({
    i, x: Math.round((Math.random() - 0.5) * 900), delai: (Math.random() * 3.5).toFixed(2), duree: (3 + Math.random() * 3).toFixed(2), taille: (2 + Math.random() * 5).toFixed(1), derive: Math.round((Math.random() - 0.5) * 120),
  })), []);

  const plusTard = (f: () => void, ms: number) => { minuteurs.current.push(window.setTimeout(f, ms)); };
  const toutArreter = () => { minuteurs.current.forEach(clearTimeout); minuteurs.current = []; cancelAnimationFrame(boucle.current); };
  /** les battements : la silhouette passe d'une forme à l'autre à chaque battement (morphing.ts) */
  const animerMorphing = () => {
    const r = rendu.current; if (!r) return;
    const mode = modeMorphing(), continu = UNE_SEULE_FOIS.includes(mode);
    const debut = performance.now(), fin = T.eclat - T.bat + decalage(mode);
    const pas = (now: number) => { const t = now - debut; r.dessiner(continu ? avancementContinu(t, fin) : avancement(t, BATTEMENTS, fin), t); if (t < fin) boucle.current = requestAnimationFrame(pas); };
    r.dessiner(0, 0);
    boucle.current = requestAnimationFrame(pas);
  };

  const reveler = (sansEclat = false) => {
    toutArreter();
    setMontre('vers');
    if (!sansEclat) son(() => SFX.evoEclat());
    setPhase('eclat');
    plusTard(() => { setPhase('revele'); son(() => SFX.evoRevelation()); }, T.revele - T.eclat);
    plusTard(() => { setPhase('page'); son(() => SFX.page(0.9)); plusTard(() => son(() => SFX.pencil()), 500); }, T.page - T.eclat);
  };

  useEffect(() => {
    let vivant = true;
    const mode = modeMorphing(), dec = decalage(mode);
    // en une seule fois, les battements sonores s'étirent sur toute la transformation
    const etire = (T.eclat - T.bat + dec) / (T.eclat - T.bat);
    plusTard(() => {
      void preparerMorphing(mode, p.de, p.vers, H * p.tailleDe, H * p.tailleVers, LOUPE).then((r) => {
        if (!vivant || !r || !hote.current) return;
        rendu.current = r;
        r.element.style.width = '100%'; r.element.style.height = '100%'; r.element.style.display = 'block';
        hote.current.appendChild(r.element);
        r.dessiner(0, 0);
        setMorph({ largeur: r.largeur, hauteur: r.hauteur });
      });
    }, 250);
    son(() => SFX.woosh());
    plusTard(() => setPhase('eleve'), T.eleve);
    plusTard(() => { setPhase('lumiere'); son(() => SFX.evoMontee((T.eclat + dec - T.lumiere) / 1000)); }, T.lumiere);
    plusTard(() => setPhase('blanc'), T.blanc);
    plusTard(() => {
      setPhase('bat');
      animerMorphing();
      BATTEMENTS.forEach((t, i) => plusTard(() => { setMontre(i % 2 ? 'de' : 'vers'); son(() => SFX.evoBattement(i)); }, t * etire));
    }, T.bat);
    plusTard(() => reveler(), T.eclat + dec);
    return () => { vivant = false; toutArreter(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // la page apparaît : le bouton prend le focus (Entrée pour continuer), sans faire défiler le repère
  useEffect(() => { if (phase === 'page') bouton.current?.focus({ preventScroll: true }); }, [phase]);

  const passer = () => {
    if (['sombre', 'eleve', 'lumiere', 'blanc', 'bat'].includes(phase)) reveler();
  };
  const continuer = () => {
    if (fini.current) return;
    fini.current = true;
    son(() => SFX.woosh());
    setPhase('sort');
    plusTard(() => p.surFin(), 1700);
  };

  const ordre: Phase[] = ['sombre', 'eleve', 'lumiere', 'blanc', 'bat', 'eclat', 'revele', 'page', 'sort'];
  const apres = (x: Phase) => ordre.indexOf(phase) >= ordre.indexOf(x);
  const auCentre = apres('eleve') && phase !== 'sort';
  // quand la page du carnet arrive, l'écho remonte et se tient au-dessus d'elle
  const cy = apres('page') && phase !== 'sort' ? 452 : CENTRE.y;
  const loupe = apres('page') ? LOUPE * 0.86 : LOUPE;
  const blanc = apres('blanc') && !apres('revele');
  // pendant les battements, le morphing (s'il est prêt) remplace les deux images
  const morphVisible = !!morph && phase === 'bat';
  // l'écho : de sa place au ranch (pieds en `depart`) jusqu'au centre, agrandi
  const forme = (qui: 'de' | 'vers'): CSSProperties => {
    const t = qui === 'de' ? p.tailleDe : p.tailleVers;
    const ech = auCentre ? loupe : p.depart.echelle;
    const visible = morphVisible ? false : phase === 'sombre' || phase === 'sort' ? qui === (phase === 'sort' ? 'vers' : 'de') : montre === qui;
    return {
      height: Math.round(H * t), opacity: visible ? 1 : 0,
      filter: blanc ? 'brightness(0) invert(1) drop-shadow(0 0 18px rgba(255,248,220,.95)) drop-shadow(0 0 42px rgba(255,226,150,.8))' : apres('revele') ? 'drop-shadow(0 0 22px rgba(255,236,170,.75))' : 'none',
      transform: `translate(-50%, -100%) scale(${ech})`,
    };
  };
  const pos: CSSProperties = auCentre ? { left: CENTRE.x, top: cy } : { left: p.depart.x, top: p.depart.y };

  return (
    <div className={`evo ph-${phase}`} onClick={passer} role="dialog" aria-label={p.titre}>
      <div className="evo-voile" />
      <div className="evo-halo" style={{ left: CENTRE.x, top: cy - H * p.tailleVers * loupe * 0.5 }} />
      <div className="evo-rayons" style={{ left: CENTRE.x, top: cy - H * p.tailleVers * loupe * 0.5 }} />
      <div className="evo-anneaux" style={{ left: CENTRE.x, top: CENTRE.y - H * p.tailleDe * LOUPE * 0.5 }}><i /><i /><i /></div>
      <div className="evo-grains" style={{ left: CENTRE.x, top: CENTRE.y - H * p.tailleDe * LOUPE * 0.5 }}>
        {grains.map((g) => (
          <i key={g.i} style={{ '--gx': `${g.x}px`, '--gy': `${g.y}px`, '--t': g.taille + 'px', '--c': g.teinte, animationDelay: g.delai + 's', animationDuration: g.duree + 's' } as CSSProperties} />
        ))}
      </div>
      <div className="evo-echo" style={pos}>
        <img className="evo-forme" src={p.de} alt="" style={forme('de')} />
        <img className="evo-forme" src={p.vers} alt="" style={forme('vers')} />
        <div ref={hote} className={`evo-morph ${morphVisible ? 'visible' : ''}`} aria-hidden style={morph ? {
          width: morph.largeur, height: morph.hauteur, transformOrigin: `${morph.largeur / 2}px ${morph.hauteur - MARGE_MORPH}px`,
          transform: `translate(${-morph.largeur / 2}px, ${MARGE_MORPH - morph.hauteur}px) scale(${loupe})`,
        } : undefined} />
      </div>
      <div className="evo-etincelles" style={{ left: CENTRE.x }}>
        {etincelles.map((e) => (
          <i key={e.i} style={{ left: e.x, '--t': e.taille + 'px', '--d': `${e.derive}px`, animationDelay: e.delai + 's', animationDuration: e.duree + 's' } as CSSProperties} />
        ))}
      </div>
      <div className="evo-eclat" />
      {(phase === 'sombre' || phase === 'eleve' || phase === 'lumiere') && <div className="evo-murmure">Il se passe quelque chose…</div>}
      {apres('page') && (
        <div className="evo-page" onClick={(ev) => ev.stopPropagation()}>
          <div className="evo-page-surtitre">{p.surtitre}</div>
          <div className="evo-page-titre">{p.titre}</div>
          <div className="evo-page-formes">
            <img src={p.de} alt="" style={{ height: Math.round(64 * Math.min(1.3, p.tailleDe / p.tailleVers + 0.15)) }} />
            <svg width="44" height="20" viewBox="0 0 44 20" aria-hidden><path d="M2 10h36M30 3l8 7-8 7" fill="none" stroke="#6e3f22" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <img src={p.vers} alt="" style={{ height: 78 }} />
          </div>
          <div className="evo-page-texte">{p.texte}</div>
          <div className="evo-tampon">évolution</div>
          <button ref={bouton} className="evo-continuer" onClick={continuer}>Continuer</button>
        </div>
      )}
      {!apres('eclat') && <div className="evo-passer">cliquer pour passer</div>}
    </div>
  );
}
