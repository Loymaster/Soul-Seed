// Introduction, première partie : entre deux mondes (registre « magie sainte »), portage de la maquette validée.
// Bruitages sobres : la musique porte la scène ; chaque réponse est validée par une seule note (SFX.mystere),
// aucun son au survol, aucun bruitage pendant que les paroles de l'homme s'écrivent (choix de l'autrice) ; reste le réveil.
// Sa voix feutrée (une note très douce par mot) est gardée pour les rencontres suivantes : timbre « mystere »
// de la bibliothèque des voix (src/moteur/voix), choisi dans sa fiche contenu/personnages/homme-mysterieux.json.
// L'homme mystérieux demande le nom du personnage, son pronom, l'astre en qui il a confiance (→ son image)
// et ce qui compte le plus pour lui (→ la Soul Seed que lui remettra Myhra). Puis le joueur s'éveille.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Graine } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { Repere } from '../commun/Repere';
import { useMusique } from '../commun/musique';
import { Embleme, capitaliser } from '../graines/donnees';
import { avatarDe, type Personnage, type Pronom } from '../profils';
import './intro.css';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;

const PRIORITES: { k: Graine; texte: string; c: string }[] = [
  { k: 'joy', texte: "S'ouvrir au monde", c: '#ffc65a' },
  { k: 'wrath', texte: 'Résoudre les problèmes', c: '#ff7a55' },
  { k: 'disgust', texte: 'Distinguer le vrai du faux', c: '#cfdc62' },
  { k: 'sorrow', texte: 'Observer le monde avec attention', c: '#7fd0ff' },
  { k: 'fear', texte: 'Prévoir ce que le futur réserve', c: '#c79bff' },
];
const PRONOMS: { k: Pronom; label: string; exemple: string }[] = [
  { k: 'il', label: 'Il', exemple: '« il est prêt »' },
  { k: 'elle', label: 'Elle', exemple: '« elle est prête »' },
  { k: 'iel', label: 'Iel', exemple: '« iel est prêt·e »' },
];
const SOLEIL = 'M32 20a12 12 0 1 1 0 24a12 12 0 1 1 0-24z M30.5 2h3l-.6 11h-1.8z M30.5 62h3l-.6-11h-1.8z M2 30.5v3l11-.6v-1.8z M62 30.5v3l-11-.6v-1.8z M9.6 11.7l2.1-2.1 7.3 8.2-1.3 1.3z M54.4 52.3l-2.1 2.1-7.3-8.2 1.3-1.3z M11.7 54.4l-2.1-2.1 8.2-7.3 1.3 1.3z M52.3 9.6l2.1 2.1-8.2 7.3-1.3-1.3z';
const LUNE = 'M38 6a26 26 0 1 0 20 42A22 22 0 0 1 38 6z M50 12l1.6 3.4 3.4 1.6-3.4 1.6L50 22l-1.6-3.4-3.4-1.6 3.4-1.6z M57 27l1 2 2 1-2 1-1 2-1-2-2-1 2-1z';
const ASTRES: { k: 'soleil' | 'lune'; nom: string; c: string; icone: string }[] = [
  { k: 'soleil', nom: 'Le Soleil', c: '#ffd27a', icone: SOLEIL },
  { k: 'lune', nom: 'La Lune', c: '#bcd8ff', icone: LUNE },
];
const acc = (p: Pronom, m: string, f: string, n: string) => (p === 'elle' ? f : p === 'iel' ? n : m);

type Question = 'nom' | 'pronom' | 'astre' | 'priorite';
interface Replique { t: string; q?: Question; fin?: boolean }
const SCRIPT = (nom: string, pronom: Pronom): Replique[] => [
  { t: 'Bien. Vous êtes en train de reprendre connaissance.' },
  { t: "Non, ce n'est pas un rêve… mais vous n'êtes pas encore réveillé·e pour autant." },
  { t: 'Vous venez de quitter votre monde pour rejoindre celui des Échos. Un univers à part… loin des humains, loin des guerres. Autrefois, un havre de paix.' },
  { t: "Les créatures qui le peuplent sont d'une sensibilité qui dépasse tout entendement. Elles sont véritablement uniques." },
  { t: 'Mais avant toute chose : quel est votre nom ?', q: 'nom' },
  { t: `${nom || '…'}… Très bien. Et dites-moi, comment vous définissez-vous ?`, q: 'pronom' },
  { t: 'Levez les yeux un instant… À quel astre accordez-vous votre confiance ?', q: 'astre' },
  { t: "J'en prends note. Sachez que vous pourrez changer ces informations à tout moment." },
  { t: "Et enfin, dernière chose : pour vous, qu'est-ce qui compte le plus ?", q: 'priorite' },
  { t: "Hmm… C'est un choix intéressant." },
  { t: "Le monde des Échos court un grave danger. La mémoire de ses habitants a commencé à s'effacer, peu à peu. Je n'ai rien pu faire pour l'en empêcher." },
  { t: `C'est pour cela que j'ai fait appel à vous. Je sais, c'est déroutant… Mais vous avez quelque chose de spécial. Vous ${acc(pronom, 'seul', 'seule', 'seul·e')} pouvez sauver ce monde de la menace qui le guette.` },
  { t: 'Nous devrions nous revoir bientôt. Il est temps de vous réveiller… véritablement, cette fois.', fin: true },
];
const GRAINS = Array.from({ length: 34 }, (_, i) => ({ x: (i * 211) % 1270, y: 160 + ((i * 97) % 600), t: 1 + (i % 3), o: 0.35 + (i % 4) * 0.15, dur: 9 + (i % 5) * 2, d: -((i * 1.3) % 12), dx: ((i % 7) - 3) * 14, h: 4 + (i % 3) * 3, c: i % 3 === 0 ? '#ffe2b0' : '#cfe4ff' }));
// poussière de la lame choisie : part de toute sa surface, surtout vers le haut
const ETINCELLES = Array.from({ length: 26 }, (_, i) => ({ x: 6 + ((i * 37) % 88), y: 10 + ((i * 53) % 80), t: 2 + (i % 3), dx: ((i * 29) % 70) - 35, dy: -(30 + ((i * 41) % 70)), du: 1.1 + (i % 5) * 0.18, de: 0.1 + (i % 8) * 0.07 }));

export interface ResultatIntroduction { personnage: Personnage; graine: Graine }

export function EntreDeuxMondes({ surFin, musique = true }: { surFin: (r: ResultatIntroduction) => void; musique?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState(-1);
  const [tout, setTout] = useState(false);
  const [fini, setFini] = useState(false);
  const [parle, setParle] = useState(false);
  const [nom, setNom] = useState('');
  const [pronom, setPronom] = useState<Pronom>('il');
  const [astre, setAstre] = useState<'soleil' | 'lune' | ''>('');
  const [survolA, setSurvolA] = useState(-1);
  const [priorite, setPriorite] = useState(-1);
  const [survolP, setSurvolP] = useState(-1);
  const [loin, setLoin] = useState(false);
  const [aube, setAube] = useState(false);
  const piste = useMusique('intro-mystery', { volume: 0.4, active: musique, montee: 5000 });

  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const plusTard = (f: () => void, ms: number) => { minuteurs.current.push(setTimeout(f, ms)); };
  const toutArreter = () => { minuteurs.current.forEach(clearTimeout); minuteurs.current = []; };
  const script = SCRIPT(nom, pronom);
  const st = script[etape];
  const q = st && st.q && fini ? st.q : null;
  const etatRef = useRef({ etape, fini, st, aube }); etatRef.current = { etape, fini, st, aube };

  const dire = (i: number) => {
    const r = SCRIPT(nomRef.current, pronomRef.current)[i]; if (!r) return;
    toutArreter();
    const n = r.t.split(' ').length;
    setEtape(i); setTout(false); setFini(false); setParle(true);
    // le texte apparaît mot à mot (≈ 160 ms par mot), en silence : pas de voix dans l'introduction
    plusTard(() => { setFini(true); setParle(false); }, 250 + n * 160 + 700);
  };
  // le texte de la réplique suivante dépend des réponses qui viennent d'être données
  const nomRef = useRef(nom); nomRef.current = nom;
  const pronomRef = useRef(pronom); pronomRef.current = pronom;

  useEffect(() => {
    plusTard(() => setOuvert(true), 300);
    plusTard(() => dire(0), 3200);
    return toutArreter;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const eveil = () => {
    const p = PRIORITES[priorite] ?? PRIORITES[0];
    SFX.aube(); piste.vers(0, 4000);
    setAube(true); setParle(false);
    plusTard(() => surFin({ personnage: { nom: nomRef.current, pronom: pronomRef.current, avatar: avatarDe(pronomRef.current, astre || 'soleil') }, graine: p.k }), 4600);
  };
  const avancer = () => {
    const s = etatRef.current; if (s.etape < 0 || s.aube || !s.st) return;
    if (!s.fini) { toutArreter(); setTout(true); setFini(true); setParle(false); return; }
    if (s.st.q) return; // une réponse est attendue
    if (s.st.fin) { eveil(); return; }
    dire(s.etape + 1);
  };
  const validerNom = () => {
    const n = capitaliser(nom); if (!n) return;
    SFX.mystere(); setNom(n); nomRef.current = n; dire(etape + 1);
  };
  const choisirPronom = (k: Pronom) => { SFX.mystere(); setPronom(k); pronomRef.current = k; dire(etape + 1); };
  const choisirAstre = (i: number) => {
    if (astre) return;
    SFX.mystere(); setAstre(ASTRES[i].k);
    plusTard(() => dire(etape + 1), 1900);
  };
  const choisirPriorite = (i: number) => {
    if (priorite >= 0) return;
    SFX.mystere(); setPriorite(i); setLoin(false);
    plusTard(() => setLoin(true), 900);
    plusTard(() => dire(etape + 1), 2600);
  };

  // Espace / Entrée pour avancer (hors champ de saisie)
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); avancerRef.current(); }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, []);
  const avancerRef = useRef(avancer); avancerRef.current = avancer;

  const iPriorite = script.findIndex((r) => r.q === 'priorite');
  const apresPriorite = priorite >= 0 && !aube && etape === iPriorite + 1;
  const departPriorite = priorite >= 0 && !aube && etape === iPriorite + 2;
  const surAstre = st?.q === 'astre';
  const teinteOn = priorite >= 0 || survolP >= 0 || (surAstre && (!!astre || survolA >= 0));
  const teinteC = surAstre ? (ASTRES.find((a) => a.k === astre) ?? ASTRES[Math.max(0, survolA)]).c : (PRIORITES[priorite >= 0 ? priorite : survolP] ?? PRIORITES[0]).c;
  const v = (o: Record<string, string | number>) => o as CSSProperties;
  const prioriteVisible = q === 'priorite' || (st?.q === 'priorite' && priorite >= 0) || apresPriorite || departPriorite;

  return (
    <Repere fond="#04060d">
      <div className="ecran-intro">
        <div className={`ecran ${ouvert ? 'ouvert' : ''}`}>
          <div className="nappe givre" /><div className="nappe aube" /><div className="nappe voute" />
          <div className={`teinte ${teinteOn ? 'on' : ''}`} style={v({ '--c': teinteC })} />
          <div className="poussiere">
            {GRAINS.map((g, i) => <span key={i} className="grain" style={v({ left: g.x, top: g.y, width: g.t, height: g.t, '--o': g.o, '--t': `${g.dur}s`, '--d': `${g.d}s`, '--dx': `${g.dx}px`, boxShadow: `0 0 ${g.h}px ${g.c}` })} />)}
          </div>
          <div className="aureole" />
          <div className={`homme ${aube ? 'efface' : parle ? 'parle' : ouvert ? 'on' : ''}`}><img src={asset('pnj/homme-mysterieux/neutre.png')} alt="Un homme encapuchonné" draggable={false} /></div>

          {st && !aube && (
            <>
              <div className={`parole ${q || apresPriorite ? 'haut' : ''}`}>
                {/* une clé par réplique : chaque phrase remonte et ses mots réapparaissent depuis le début */}
                <div key={etape} className={`ligne ${tout ? 'tout' : ''}`}>
                  {st.t.split(' ').map((t, i) => <span key={i} className="mot" style={v({ '--d': `${(0.25 + i * 0.16).toFixed(2)}s` })}>{t}&nbsp;</span>)}
                </div>
                {fini && !st.q && <div className="suite"><i />continuer</div>}
              </div>
              {!q && <button className="cliquable" onClick={avancer} aria-label="Continuer" />}
            </>
          )}

          {q === 'nom' && !aube && (
            <form className="reponse" style={v({ '--d': '.1s' })} onSubmit={(e) => { e.preventDefault(); validerNom(); }}>
              <div className="champ-ligne">
                <input className="champ" value={nom} onChange={(e) => setNom(e.target.value.slice(0, 16))} placeholder="votre nom" maxLength={16} aria-label="Votre nom" autoFocus />
                <button className="bouton-saint" type="submit" disabled={!nom.trim()}>Valider</button>
              </div>
            </form>
          )}

          {q === 'pronom' && (
            <div className="reponse" style={v({ '--d': '.1s' })}>
              {PRONOMS.map((p) => <button key={p.k} className="eclat" onClick={() => choisirPronom(p.k)}><b>{p.label}</b><i>{p.exemple}</i></button>)}
            </div>
          )}

          {(q === 'astre' || (surAstre && !!astre)) && (
            <div className="reponse" style={v({ '--d': '.1s', gap: 40 })}>
              {ASTRES.map((a, i) => (
                <button key={a.k} className={`astre ${astre ? (astre === a.k ? 'pris' : 'ecarte') : survolA === i ? 'sur' : ''}`} style={v({ '--c': a.c })}
                  onMouseEnter={() => { if (!astre && survolA !== i) setSurvolA(i); }} onClick={() => choisirAstre(i)}>
                  <svg viewBox="0 0 64 64" aria-hidden="true"><path d={a.icone} fill="currentColor" fillRule="evenodd" /></svg>
                  <b>{a.nom}</b>
                </button>
              ))}
            </div>
          )}

          {prioriteVisible && (
            <div className={`reponse ${priorite >= 0 ? (departPriorite ? 'verrou part' : 'verrou') : ''}`} style={v({ '--d': '.1s' })}>
              {PRIORITES.map((p, i) => (
                <button key={p.k} className={`lame ${priorite >= 0 ? (priorite === i ? 'pris' : 'ecarte' + (loin ? ' loin' : '')) : survolP === i ? 'sur' : ''}`} style={v({ '--c': p.c })}
                  onMouseEnter={() => { if (priorite < 0 && survolP !== i) setSurvolP(i); }} onClick={() => choisirPriorite(i)}>
                  <span className="texte">{p.texte}</span>
                  <i className="etincelles">{ETINCELLES.map((e, k) => <b key={k} className="etincelle" style={v({ '--x': `${e.x}%`, '--y': `${e.y}%`, '--t': `${e.t}px`, '--dx': `${e.dx}px`, '--dy': `${e.dy}px`, '--du': `${e.du.toFixed(2)}s`, '--de': `${e.de.toFixed(2)}s` })} />)}</i>
                  <Embleme graine={p.k} className="embleme" />
                </button>
              ))}
            </div>
          )}

          {aube && <div className="aube" />}
        </div>
      </div>
    </Repere>
  );
}
