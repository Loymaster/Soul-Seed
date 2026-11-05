// Choix de la Soul Seed (« Une nouvelle vie commence ») — portage de la maquette validée.
// choix → carte (une graine choisie) → éveil → éclosion → nom → bienvenue, puis le ranch.
// Sert au démarrage sans introduction et après la disparition d'un écho.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { apparence, type Etat, type Graine } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { Repere } from '../commun/Repere';
import { useMusique } from '../commun/musique';
import { Embleme, GRAINES, capitaliser, imageGraine, proposerNom } from './donnees';
import './graines.css';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
// En arc au-dessus du cercle de pierres (pieds de chaque graine)
const PLACES: [number, number][] = [[250, 478], [445, 430], [640, 412], [835, 430], [1030, 478]];
const SECRET = 'Ce qu’elle deviendra dépendra de vous… et d’un secret qu’elle garde jusqu’à l’éclosion.';
const MOTES = Array.from({ length: 12 }, (_, i) => ({ x: 380 + ((i * 97) % 520), t: 2 + (i % 3), c: i % 2 ? '#fff3c4' : '#e8f6ff', h: i % 2 ? '#ffd27a' : '#a8dcff', d: -i * 0.7, dx: ((i % 5) - 2) * 12 }));
const AFFLUX = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return { x: Math.round(Math.cos(a) * 260), y: Math.round(Math.sin(a) * 160), d: -(i % 7) * 0.22 }; });

type Phase = 'choix' | 'carte' | 'eveil' | 'eclosion' | 'nom' | 'bienvenue';

export interface ProprietesChoixGraine {
  /** « nouvelle » : démarrage sans introduction (bouton Menu) ; « apres » : après la disparition d'un écho. */
  contexte: 'nouvelle' | 'apres';
  /** Crée l'écho au moment de l'éclosion (tirage caché de la lignée et du genre). */
  creer: (graine: Graine) => Etat;
  surFin: (etat: Etat) => void;
  surRetour?: () => void;
  musique?: boolean;
}

export function ChoixGraine({ contexte, creer, surFin, surRetour, musique = true }: ProprietesChoixGraine) {
  const [phase, setPhase] = useState<Phase>('choix');
  const [survol, setSurvol] = useState(-1);
  const [choisie, setChoisie] = useState(-1);
  const [echo, setEcho] = useState<Etat | null>(null);
  const [nom, setNom] = useState('');
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const plusTard = (f: () => void, ms: number) => { minuteurs.current.push(setTimeout(f, ms)); };
  useEffect(() => () => minuteurs.current.forEach(clearTimeout), []);
  const piste = useMusique('select', { volume: 0.22, active: musique });

  const c = choisie >= 0 ? GRAINES[choisie] : null;
  const naissance = phase === 'eclosion' || phase === 'nom' || phase === 'bienvenue';

  const choisir = (i: number) => {
    if (phase !== 'choix') return; // une seule graine à la fois : il faut d'abord « revoir les autres »
    SFX.holyClick(); plusTard(() => SFX.pose(), 350);
    setChoisie(i); setSurvol(-1); setPhase('carte');
  };
  const revoir = () => { if (phase !== 'carte') return; SFX.holyHover(); setChoisie(-1); setPhase('choix'); };
  const planter = () => {
    if (phase !== 'carte' || !c) return;
    SFX.eveil();
    setEcho(creer(c.k)); setNom(''); setPhase('eveil');
    plusTard(() => { SFX.ouverture(); setPhase('eclosion'); }, 2300);
    plusTard(() => { SFX.cri(); setPhase('nom'); }, 3300);
  };
  const commencer = () => {
    const n = capitaliser(nom);
    if (!n || phase !== 'nom' || !echo) return;
    SFX.holyClick(); setPhase('bienvenue');
    piste.vers(0, 3000);
    plusTard(() => surFin({ ...echo, nom: n }), 3400);
  };

  // clavier : ← → pour parcourir, Entrée pour choisir, Échap pour revenir
  const etat = useRef({ phase, survol, planter, revoir, choisir }); etat.current = { phase, survol, planter, revoir, choisir };
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const s = etat.current;
      if ((e.target as HTMLElement).closest('input')) return;
      if (s.phase === 'carte') { if (e.key === 'Escape') s.revoir(); if (e.key === 'Enter') s.planter(); return; }
      if (s.phase !== 'choix') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const i = s.survol < 0 ? 2 : (s.survol + (e.key === 'ArrowRight' ? 1 : 4)) % 5;
        SFX.chant(i); setSurvol(i); e.preventDefault();
      }
      if (e.key === 'Enter' && s.survol >= 0) s.choisir(s.survol);
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, []);

  const apres = contexte === 'apres';
  const fondCls = phase === 'eveil' ? 'eveil' : naissance ? 'naissance' : c ? 'attend' : '';
  const cercleCls = phase === 'eveil' || naissance ? 'eveil' : c ? 'on' : '';
  const sceauCls = phase === 'eveil' ? 'on' : naissance ? 'naissance' : '';
  const v = (o: Record<string, string | number>) => o as CSSProperties;

  return (
    <Repere fond="#0a1020">
      <div className="ecran-graines">
        <div className={`fond ${fondCls}`} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(8,14,30,.78) 0%,rgba(8,14,30,.25) 34%,rgba(8,14,30,0) 55%,rgba(8,14,30,.55) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 62%,transparent 40%,rgba(6,10,22,.75) 100%)', pointerEvents: 'none' }} />
        <div className={`cercle ${cercleCls}`} style={v({ '--teinte': c ? c.couleur : 'transparent' })} />
        {c && <div className={`gr-sceau ${sceauCls}`} style={v({ '--c': c.couleur })}><Embleme graine={c.k} /></div>}
        <div className="motes">
          {MOTES.map((m, i) => <span key={i} className="mote" style={v({ left: m.x, width: m.t, height: m.t, background: m.c, boxShadow: `0 0 10px ${m.h}`, animationDelay: `${m.d}s`, '--dx': `${m.dx}px` })} />)}
        </div>
        {phase === 'eveil' && c && AFFLUX.map((a, i) => <span key={i} className="afflux" style={v({ '--ax': `${a.x}px`, '--ay': `${a.y}px`, '--d': `${a.d}s`, '--c': c.couleur })} />)}

        {!apres && surRetour && (phase === 'choix' || phase === 'carte') && (
          <button className="coin" style={{ left: 24 }} onMouseEnter={() => SFX.holyHover()} onClick={() => { SFX.holyClick(); surRetour(); }} aria-label="Retour au menu principal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Menu
          </button>
        )}

        <div className={`titre ${c ? 'cache' : ''}`}>
          {apres && <div className="sur">Le souvenir de votre écho veille sur vous.</div>}
          <h1>Une nouvelle vie commence</h1>
          <p>Choisissez votre Soul Seed</p>
          <div className="filet"><span /><i /><span /></div>
        </div>

        {GRAINES.map((g, i) => {
          const estChoisie = choisie === i;
          let [x, y] = PLACES[i];
          // les autres graines s'écartent et pâlissent ; la graine choisie se pose au centre du cercle de pierres
          if (c && !estChoisie) { x = i === 2 ? 640 : x + (x < 640 ? -60 : 60); y = i === 2 ? 330 : y + 20; }
          if (estChoisie) { x = 640; y = 610; }
          const cls = [
            survol === i && phase === 'choix' ? 'survol' : '',
            c && !estChoisie ? (phase === 'carte' ? 'retrait' : 'efface') : '',
            estChoisie ? 'choisie' : '', estChoisie && phase === 'eveil' ? 'eveil' : '', estChoisie && naissance ? 'ouverte' : '',
          ].join(' ');
          return (
            <button key={g.k} className={`graine ${cls}`} style={v({ left: x, top: y, '--c': g.couleur, '--d': `${-i * 0.9}s`, zIndex: estChoisie ? 30 : 10 + (i === 2 ? 1 : 0) })}
              onMouseEnter={() => { if (phase !== 'choix' || survol === i) return; SFX.chant(i); setSurvol(i); }}
              onMouseLeave={() => { if (survol === i) setSurvol(-1); }}
              onFocus={() => { if (phase === 'choix' && survol !== i) { SFX.chant(i); setSurvol(i); } }}
              onClick={() => choisir(i)} aria-label={`${g.nom} — ${g.temperament}`} aria-pressed={estChoisie} disabled={phase !== 'choix' && !estChoisie}>
              <span className="aura" />
              <span className="socle" />
              <span className="eclat" style={v({ left: 52, top: 140, '--ex': '-14px' })} />
              <span className="eclat" style={v({ left: 92, top: 110, '--ex': '12px', animationDelay: '-.8s' })} />
              <span className="eclat" style={v({ left: 70, top: 160, '--ex': '4px', animationDelay: '-1.6s' })} />
              <span className="corps"><img src={asset(imageGraine(g.k))} alt="" draggable={false} /></span>
              <span className="nom"><b>{g.nom}</b><i>{g.temperament}</i></span>
            </button>
          );
        })}

        {phase === 'choix' && <div className="aide">Survolez une graine pour l'écouter · <kbd>←</kbd><kbd>→</kbd> puis <kbd>Entrée</kbd></div>}

        {phase === 'carte' && c && (
          <section className="carte" style={v({ '--c': c.couleur })} aria-live="polite">
            <Embleme graine={c.k} className="embleme" />
            <div>
              <div className="temp">{c.temperament}</div>
              <h2>{c.nom}</h2>
              <p>{c.description}</p>
              <div className="secret">{c.vers} {SECRET}</div>
            </div>
            <div className="actions">
              <button className="bouton-saint" onMouseEnter={() => SFX.holyHover()} onClick={planter}>Planter cette graine</button>
              <button className="bouton-saint discret" onMouseEnter={() => SFX.holyHover()} onClick={revoir}>Revoir les autres</button>
            </div>
          </section>
        )}

        {phase === 'eclosion' && <div className="flash" />}

        {naissance && c && echo && (
          <div className="bebe" style={v({ '--c': c.couleur })}><span className="halo" /><img src={asset(apparence(echo))} alt="Votre écho, qui vient de naître" /></div>
        )}

        {phase === 'nom' && c && echo && (
          <section className="carte nommer" style={v({ '--c': c.couleur })} aria-live="polite">
            <div>
              <div className="temp">{c.nom} · {c.temperament}</div>
              <h2>Votre Soul Seed s'est ouverte !</h2>
              <p>Il s'agit {echo.genre === 'f' ? 'd’une femelle' : 'd’un mâle'}. Comment souhaitez-vous l'appeler ?</p>
              <form className="champ-ligne" onSubmit={(e) => { e.preventDefault(); commencer(); }}>
                <input className="champ" value={nom} onChange={(e) => setNom(e.target.value.slice(0, 14))} placeholder="son nom" maxLength={14} aria-label="Nom de votre écho" autoFocus />
                <button type="button" className="de" onClick={() => { SFX.holyHover(); setNom(proposerNom(echo.genre, nom)); }} aria-label="Proposer un nom" title="Proposer un nom">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z" /><path d="M12 12l8.5-4.7M12 12v9.5M12 12L3.5 7.3" /><circle cx="12" cy="7" r=".9" fill="currentColor" /><circle cx="7.5" cy="13" r=".9" fill="currentColor" /><circle cx="16.5" cy="13" r=".9" fill="currentColor" /></svg>
                </button>
              </form>
              <div className="actions"><button className="bouton-saint" onMouseEnter={() => SFX.holyHover()} onClick={commencer} disabled={!nom.trim()}>Commencer</button></div>
            </div>
          </section>
        )}

        {phase === 'bienvenue' && c && (
          <div className="bienvenue" style={v({ '--c': c.couleur })}><b>Bienvenue, {capitaliser(nom)}</b><i>Le ranch vous attend…</i></div>
        )}
      </div>
    </Repere>
  );
}
