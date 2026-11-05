// Le dernier souffle — la disparition de l'écho, portage de la maquette validée.
// signe → paysage (secousses) → passage (l'écho se décompose de bas en haut, l'âme paraît)
// → paroles (mot à mot) → souvenir (Mémoire des échos) → repli (l'âme redevient graine) → relais.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { NOM_STADE, accord, ageJours, apparence, type Etat } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { Repere } from '../commun/Repere';
import { useMusique } from '../commun/musique';
import { ficheGraine } from '../graines/donnees';
import { epitaphe } from './epitaphes';
import './mort.css';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
const ETOILES = Array.from({ length: 26 }, (_, i) => ({ x: (i * 197) % 1270, y: (i * 89) % 560, t: 1 + (i % 3), d: -(i % 9) * 0.4, g: 4 + (i % 3) * 3 }));

type Phase = 'signe' | 'paysage' | 'passage' | 'paroles' | 'souvenir' | 'repli' | 'graine' | 'relais';
interface Grain { x: number; y: number; vx: number; vy: number; ax: number; vie: number; duree: number; taille: number; ph: number; c: number[] }

export interface ProprietesDernierSouffle {
  echo: Etat;
  /** nom du personnage du joueur (« Ne sois pas triste, … ») */
  joueur: string;
  surFin: () => void;
  musique?: boolean;
}

export function DernierSouffle({ echo, joueur, surFin, musique = true }: ProprietesDernierSouffle) {
  const paroles = [
    `${echo.nom} vient de nous quitter.`,
    'Mais les échos ne partent jamais vraiment…',
    `Ne sois pas triste, ${joueur}. Son départ n'est que de courte durée.`,
    "Il est déjà temps de l'accueillir sous sa nouvelle forme.",
  ];
  const [phase, setPhase] = useState<Phase>('signe');
  const [parole, setParole] = useState(0);
  const [eclair, setEclair] = useState(0);
  const [tremble, setTremble] = useState(false);
  const [ame, setAme] = useState(false);
  const piste = useMusique('death', { volume: 0.75, active: musique, montee: 4000 });

  const racine = useRef<HTMLDivElement>(null);
  const sprite = useRef<HTMLImageElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const raf = useRef(0);
  const verrou = useRef(0);
  const plusTard = (f: () => void, ms: number) => { minuteurs.current.push(setTimeout(f, ms)); };
  const toutArreter = () => { minuteurs.current.forEach(clearTimeout); minuteurs.current = []; };

  // ——— la décomposition : désaturation lente, voile qui monte des pieds vers la tête, poussière qui s'en détache
  const appliquer = (img: HTMLImageElement, sat: number, lum: number, f: number) => {
    img.style.filter = `saturate(${sat.toFixed(3)}) brightness(${lum.toFixed(3)})`;
    if (f <= 0) { img.style.webkitMaskImage = img.style.maskImage = 'none'; return; }
    const haut = f * 116, bas = haut - 16; // voile au bord doux : transparent sous le front, opaque au-dessus
    const m = `linear-gradient(to top, transparent ${bas.toFixed(2)}%, #000 ${haut.toFixed(2)}%)`;
    img.style.webkitMaskImage = m; img.style.maskImage = m;
  };
  const figer = () => {
    cancelAnimationFrame(raf.current);
    const c = toile.current; if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    if (sprite.current) appliquer(sprite.current, 0.12, 1.3, 1);
  };

  useEffect(() => {
    let carte: { w: number; h: number; data: Uint8ClampedArray | null } | null = null;
    const relever = (img: HTMLImageElement) => {
      // relevé des pixels opaques du sprite, pour que la poussière naisse de la matière de l'écho
      if (carte && carte.w === img.clientWidth) return carte;
      const w = img.clientWidth, h = img.clientHeight; if (!w || !h || !img.complete) return null;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'); if (!cx) return null;
      cx.drawImage(img, 0, 0, w, h);
      let data: Uint8ClampedArray | null = null;
      try { data = cx.getImageData(0, 0, w, h).data; } catch { /* forme approchée */ }
      return (carte = { w, h, data });
    };
    const lisse = (a: number, b: number, t: number) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
    let grains: Grain[] = [];
    const t0 = performance.now(); let avant = t0;
    const boucle = (now: number) => {
      const img = sprite.current, can = toile.current, el = racine.current;
      if (!img || !can || !el) { raf.current = requestAnimationFrame(boucle); return; }
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - avant) / 1000); avant = now;
      const d = lisse(6.5, 15, t), sat = 1 - 0.88 * d, lum = 1 + 0.3 * d; // la couleur s'en va lentement
      const f = lisse(10, 16, t); // le voile monte des pieds à la tête
      appliquer(img, sat, lum, f);
      const ctx = can.getContext('2d'); if (!ctx) return;
      ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, 1280, 800);
      const er = el.getBoundingClientRect(), k = er.width / 1280 || 1, r = img.getBoundingClientRect();
      const L = (r.left - er.left) / k, T = (r.top - er.top) / k, W = r.width / k, H = r.height / k;
      const cte = relever(img);
      if (f > 0 && f < 1 && cte) {
        const n = Math.round(190 * dt * (0.6 + 0.8 * Math.sin(Math.PI * f)));
        for (let i = 0; i < n; i++) {
          const rel = 1 - f + (Math.random() - 0.5) * 0.05; // 0 = tête, 1 = pieds
          const py = Math.min(cte.h - 1, Math.max(0, Math.round(rel * cte.h)));
          let px = -1, col = [235, 240, 255];
          for (let essai = 0; essai < 10; essai++) {
            const x = Math.floor(Math.random() * cte.w);
            if (!cte.data) { if (Math.abs(x / cte.w - 0.5) < 0.32) { px = x; break; } continue; }
            const o = (py * cte.w + x) * 4;
            if (cte.data[o + 3] > 90) { px = x; col = [cte.data[o], cte.data[o + 1], cte.data[o + 2]]; break; }
          }
          if (px < 0) continue;
          const g = 0.3 * col[0] + 0.59 * col[1] + 0.11 * col[2]; // la matière, éteinte comme l'écho, éclaircie
          const c = col.map((v) => Math.round(Math.min(255, (g + (v - g) * sat) * 0.7 + 255 * 0.3)));
          grains.push({ x: L + (px / cte.w) * W, y: T + (py / cte.h) * H, vx: (Math.random() - 0.5) * 16, vy: -(14 + Math.random() * 30), ax: (Math.random() - 0.5) * 10,
            vie: 0, duree: 1.4 + Math.random() * 2.2, taille: 0.7 + Math.random() * 2.1, ph: Math.random() * 6.28, c });
        }
      }
      ctx.globalCompositeOperation = 'lighter';
      grains = grains.filter((p) => {
        p.vie += dt; if (p.vie >= p.duree) return false;
        p.vy -= 9 * dt; p.vx += p.ax * dt; p.x += (p.vx + Math.sin(p.ph + p.vie * 2.4) * 7) * dt; p.y += p.vy * dt;
        const u = p.vie / p.duree, a = (u < 0.12 ? u / 0.12 : 1 - (u - 0.12) / 0.88) * 0.75, rr = p.taille * (1 - u * 0.4);
        ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${(a * 0.14).toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, rr * 3.2, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 6.283); ctx.fill();
        return true;
      });
      ctx.globalCompositeOperation = 'source-over';
      if (f < 1 || grains.length) raf.current = requestAnimationFrame(boucle);
    };
    raf.current = requestAnimationFrame(boucle);

    // ——— la chronologie
    plusTard(() => setPhase('paysage'), 2800);
    const pulsation = (ms: number) => plusTard(() => { SFX.pouls(); setEclair((x) => x + 1); setTremble(true); plusTard(() => setTremble(false), 520); }, ms);
    pulsation(7000); pulsation(8100);
    plusTard(() => { SFX.secousse(); setPhase('passage'); setTremble(true); }, 9300);
    plusTard(() => setTremble(false), 12500);
    plusTard(() => SFX.vent(6), 10000);
    plusTard(() => setAme(true), 13400); // l'âme ne se montre qu'une fois l'écho presque entièrement décomposé
    plusTard(() => { setPhase('paroles'); setParole(0); }, 17400);
    return () => { toutArreter(); cancelAnimationFrame(raf.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const laisserPartir = () => {
    if (phase !== 'souvenir') return;
    SFX.repli(); setPhase('repli');
    plusTard(() => { SFX.formeGraine(); setPhase('graine'); }, 1900);
    plusTard(() => { piste.vers(0, 5000); setPhase('relais'); }, 9200);
    plusTard(surFin, 13400);
  };
  const suivant = () => {
    if (phase !== 'paroles' || Date.now() < verrou.current) return;
    SFX.survolDoux();
    if (parole < paroles.length - 1) { verrou.current = Date.now() + 900; setParole(parole + 1); } else setPhase('souvenir');
  };
  // « Passer » reste disponible jusqu'au bout : chaque appui saute à l'étape suivante
  const passer = () => {
    if (phase === 'signe' || phase === 'paysage' || phase === 'passage') { toutArreter(); figer(); setTremble(false); setAme(true); setPhase('paroles'); setParole(0); }
    else if (phase === 'paroles') setPhase('souvenir');
    else if (phase === 'souvenir') laisserPartir();
    else if (phase === 'repli' || phase === 'graine') { toutArreter(); piste.vers(0, 3000); setPhase('relais'); plusTard(surFin, 4200); }
  };

  const apres = (...l: Phase[]) => l.includes(phase);
  const paysage = phase !== 'signe';
  const echoCls = [paysage ? 'on' : '', tremble ? 'tremble' : '', !apres('signe', 'paysage') ? 'dissout' : ''].join(' ');
  const ameCls = [(ame || apres('paroles', 'souvenir', 'repli', 'graine', 'relais')) ? 'on' : '', apres('repli', 'graine', 'relais') ? 'repli' : ''].join(' ');
  const v = (o: Record<string, string | number>) => o as CSSProperties;
  const jours = ageJours(echo);
  const image = asset(apparence(echo));

  return (
    <Repere>
      <div className="ecran-mort">
        <div className="ecran" ref={racine}>
          <div className={`cosmos ${paysage ? 'on' : ''} ${apres('passage', 'paroles', 'souvenir', 'repli', 'graine', 'relais') ? 'lumiere' : ''}`} />
          <div className="mo-voile" />
          <div className="etoiles" style={{ opacity: paysage ? 1 : 0, transition: 'opacity 4s ease' }}>
            {ETOILES.map((e, i) => <span key={i} className="etoile" style={{ left: e.x, top: e.y, width: e.t, height: e.t, animationDelay: `${e.d}s`, boxShadow: `0 0 ${e.g}px #cfe0ff` }} />)}
          </div>
          <div className={`signe ${phase === 'signe' ? 'on' : ''}`}>Il se passe quelque chose…</div>

          <div className={`echo ${echoCls}`}><span className="halo" /><span className="corps"><img ref={sprite} src={image} alt={echo.nom} draggable={false} /></span></div>
          <canvas ref={toile} className="poussiere" width={2560} height={1600} />
          <div className={`ame ${ameCls}`}><span className="lueur" /><img src={asset('echos/ame.png')} alt={`L'âme de ${echo.nom}`} draggable={false} /></div>
          <div className={`oeuf ${apres('graine', 'relais') ? 'on' : ''}`}><span className="halo" /><span className="coque" /></div>
          {eclair === 1 && <div className="eclair" />}
          {eclair === 2 && <div className="eclair" />}

          {phase === 'paroles' && (
            <>
              <div className="parole">
                {/* une clé par réplique : chaque phrase remonte et ses mots réapparaissent depuis le début */}
                <div key={parole}>
                  <div className="ligne">{paroles[parole].split(' ').map((t, i) => <span key={i} className="mot" style={v({ '--d': `${(0.3 + i * 0.17).toFixed(2)}s` })}>{t}&nbsp;</span>)}</div>
                  <div className="suite" style={v({ '--d': `${(0.3 + paroles[parole].split(' ').length * 0.17 + 1).toFixed(2)}s` })}><i />continuer</div>
                </div>
              </div>
              <button className="cliquable" onClick={suivant} aria-label="Continuer" />
            </>
          )}

          {phase === 'souvenir' && (
            <section className="souvenir" aria-label={`Souvenir de ${echo.nom}`}>
              <div className="portrait"><img src={image} alt="" /></div>
              <div>
                <div className="sur">Mémoire des échos</div>
                <h2>{echo.nom}</h2>
                <div className="vie">{NOM_STADE[echo.stade]} · {accord(echo, 'né', 'née')} d’une {ficheGraine(echo.graine).nom} · {jours} jour{jours > 1 ? 's' : ''} à vos côtés</div>
              </div>
              <div className="epitaphe">« {epitaphe(echo)} »</div>
              <div className="actions"><button className="bouton-saint" onMouseEnter={() => SFX.survolDoux()} onClick={laisserPartir}>Laisser partir</button></div>
            </section>
          )}

          {phase === 'graine' && <div className="final"><i>L’âme d’un écho n’est jamais vouée à disparaître.</i></div>}

          {phase === 'relais' && (
            <>
              <div className="blanc" />
              <div className="relais"><b>Une nouvelle vie commence</b></div>
            </>
          )}

          {phase !== 'relais' && <button className="coin" onClick={passer}>Passer</button>}
        </div>
      </div>
    </Repere>
  );
}
