// Le village et ses abords : centre du village, forêt du village, sanctuaire, atelier d'Ash, boutique de Jumpy.
// Un décor plein cadre, les PNJ à leur place (selon l'heure et l'avancée des quêtes), un petit menu au clic,
// et l'interface du ranch (src/jeu/commun/InterfaceRanch.tsx) : planche de l'heure, sac, petit carnet, poteau « partir »
// vers les autres lieux. L'écho n'y est pas montré. Le temps s'écoule comme au ranch (1 s réelle = 1 min de jeu) ;
// il s'arrête pendant les dialogues, les panneaux, le sac et le carnet. Les dialogues sont des scènes (ScenePnj), les travaux d'Ash
// avancent à chaque heure. La partie et le monde sont enregistrés à chaque heure et à chaque changement de lieu.
import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from 'react';
import type { Catalogue } from '@/contenu/types';
import { Simulation, NOM_STADE, aliment, apparence, heureDuJour, type Etat, type Sortie } from '@/moteur/simulation';
import { FERMETURE_BOUTIQUE, OUVERTURE_BOUTIQUE, avancerTravaux, boutiqueOuverte, heureAbsolue, minuteAbsolue, type Monde as MondePartie } from '@/moteur/monde';
import { SFX } from '@/moteur/sfx';
import { Repere } from '../commun/Repere';
import { useMusiqueEnchainee } from '../commun/musique';
import { IC } from '../ranch/icones';
import { BoutonCarnet, BoutonSac, Calque, Encart, ICONES_LIEU, PetitCarnet, Poteau, Sacoche } from '../commun/InterfaceRanch';
import type { Personnage, Reglages } from '../profils';
import { LIEUX, destinationsPoteau, imagesLieu, lieuxVoisins, type ContexteLieu, type Destination, type EntreeMenu, type IdLieu, type PnjLieu } from './lieux';
import type { Panneau } from './actions';
import { ScenePnj } from './ScenePnj';
import { Coffre, Etal, Stand, Travail, Travaux, asset, type Ton } from './panneaux';
import { synchroniser } from './variables';
import { estPret, precharger } from '../commun/prechargement';
import './monde.css';

export interface ProprietesMonde {
  etat: Etat;
  monde: MondePartie;
  personnage: Personnage;
  lieu: IdLieu;
  catalogue: Catalogue;
  reglages: Reglages;
  /** Enregistre la partie et le monde. */
  sauver: (e: Etat, m: MondePartie) => void;
  surRanch: (e: Etat, m: MondePartie) => void;
  /** « Partir en exploration » (forêt du village) : l'exploration, départ à la Sortie du village. */
  surExploration: (e: Etat, m: MondePartie) => void;
  surMort: (e: Etat) => void;
  /** Réglages changés dans le petit carnet. */
  surReglages?: (r: Reglages) => void;
  /** « Retour au menu principal » (petit carnet). */
  surMenu?: () => void;
}

const ACCUEILS = [
  (j: string) => `Bonjour ${j}, bienvenue dans ma boutique ! Tu veux acheter quelque chose ?`,
  (j: string) => `Ah, ${j} ! Quel plaisir de te voir par ici, entre donc !`,
  (j: string) => `Salut ${j} ! J’espère que tu as de l’or, j’ai de belles trouvailles aujourd’hui !`,
];

interface Note { id: number; texte: string; ton: Ton }
interface Menu { pnj: PnjLieu; x: number; y: number; entrees: EntreeMenu[] }
interface Promenade { x: number; pieds: number; sens: 1 | -1 }

export function Monde(props: ProprietesMonde) {
  const { etat, monde, personnage, catalogue, reglages } = props;
  const sim = useMemo(() => new Simulation(etat), [etat]);
  const [, rafraichir] = useReducer((x: number) => (x + 1) % 1e6, 0);
  const [lieu, setLieu] = useState<IdLieu>(props.lieu);
  const [transition, setTransition] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [scene, setScene] = useState<{ id: string; sujet?: string; cle: number } | null>(null);
  const [panneau, setPanneau] = useState<Panneau | null>(null);
  const [combat, setCombat] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [survol, setSurvol] = useState<string | null>(null);
  const [survolPassage, setSurvolPassage] = useState<string | null>(null);
  const [promenades, setPromenades] = useState<Record<string, Promenade>>({});
  const [accueil, setAccueil] = useState<string | null>(null);
  const [sacOuvert, setSacOuvert] = useState(false);
  const [carnetOuvert, setCarnetOuvert] = useState(false);
  const compteur = useRef(0);
  const vivant = useRef(true);
  const etatRef = useRef({ scene, panneau, combat, transition, sacOuvert, carnetOuvert });
  etatRef.current = { scene, panneau, combat, transition, sacOuvert, carnetOuvert };
  const L = LIEUX[lieu];
  const sons = reglages.sons !== false;
  const son = (nom: keyof typeof SFX) => { if (!sons) return; const f = SFX[nom]; if (typeof f === 'function') (f as () => void).call(SFX); };

  const sauver = () => { synchroniser(etat, monde); props.sauver(etat, monde); };
  const noter = (texte: string, ton: Ton = 'note') => {
    const id = ++compteur.current;
    setNotes((n) => [...n.slice(-3), { id, texte, ton }]);
    setTimeout(() => setNotes((n) => n.filter((x) => x.id !== id)), 4800);
  };

  const ctx: ContexteLieu = { m: monde, e: etat, h: heureDuJour(etat), maintenant: heureAbsolue(etat) };

  // ——— musique : celle du lieu (fondu enchaîné : l'une s'éteint, puis l'autre monte), coupée pendant un combat
  useMusiqueEnchainee(combat ? null : L.musique, { volume: 0.38, active: reglages.musique !== false });

  // ——— ce que la simulation signale
  const traiter = (sorties: Sortie[]) => {
    for (const x of sorties) {
      switch (x.type) {
        case 'message': noter(x.texte, x.ton); break;
        case 'refus': noter(x.texte, 'mal'); break;
        case 'evenement': case 'voisin': case 'autonomie': case 'visiteur-parti': noter(x.texte); break;
        case 'sommeil': noter(x.effondrement ? `${etat.nom} s’est ${etat.genre === 'f' ? 'écroulée' : 'écroulé'} de fatigue… ${x.heures} heures plus tard, ${etat.genre === 'f' ? 'elle' : 'il'} se réveille.` : `${etat.nom} a dormi ${x.heures} heures.`); break;
        case 'evolution': noter(`Il se passe quelque chose ! ${etat.nom} a atteint le stade ${NOM_STADE[x.vers]}.`, 'bien'); break;
        case 'maladie': noter(`${etat.nom} ne semble pas dans son assiette…`, 'mal'); break;
        case 'blessure': noter(`${etat.nom} s’est ${etat.genre === 'f' ? 'blessée' : 'blessé'}.`, 'mal'); break;
        case 'technique': noter(`${etat.nom} a appris une technique : ${x.nom}.`, 'bien'); break;
        case 'mort':
          sauver();
          setTimeout(() => { if (vivant.current) props.surMort(etat); }, 1500);
          break;
        default: break;
      }
    }
  };

  /** À chaque heure : les travaux d'Ash. */
  const heurePleine = () => {
    for (const t of avancerTravaux(monde, minuteAbsolue(etat))) { sim.noter(t); noter(t, 'bien'); son('marteau'); }
    sim.vider();
    sauver();
  };

  // ——— le temps s'écoule (arrêté pendant les dialogues, les panneaux et les combats)
  useEffect(() => {
    vivant.current = true;
    const id = setInterval(() => {
      const r = etatRef.current;
      if (r.scene || r.panneau || r.combat || r.sacOuvert || r.carnetOuvert || etat.mort) return;
      const h0 = heureDuJour(etat);
      sim.minute();
      traiter(sim.vider());
      if (heureDuJour(etat) !== h0) heurePleine();
      rafraichir();
    }, 1000);
    // travaux terminés pendant l'absence (temps passé au ranch ou en exploration)
    const fini = avancerTravaux(monde, minuteAbsolue(etat));
    if (fini.length) { fini.forEach((t) => { sim.noter(t); noter(t, 'bien'); }); sim.vider(); sauver(); }
    return () => { vivant.current = false; clearInterval(id); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ——— promenades (Lady Roger, Glamp) : un pas de temps en temps, demi-tour aux bornes
  useEffect(() => {
    const timers: number[] = [];
    const visibles = L.pnj.filter((p) => p.promenade);
    const init: Record<string, Promenade> = {};
    for (const p of visibles) {
      const pr = p.promenade!;
      init[p.id] = { x: (pr.xMin + pr.xMax) / 2, pieds: (pr.piedsMin + pr.piedsMax) / 2, sens: 1 };
      const periodeMs = pr.periode[0] + Math.random() * (pr.periode[1] - pr.periode[0]);
      timers.push(window.setInterval(() => {
        if (etatRef.current.scene) return;
        setPromenades((all) => {
          const c = all[p.id] ?? init[p.id];
          let sens = c.sens;
          let x = c.x + sens * (pr.pas[0] + Math.random() * (pr.pas[1] - pr.pas[0]));
          if (x > pr.xMax) { x = pr.xMax; sens = -1; } else if (x < pr.xMin) { x = pr.xMin; sens = 1; }
          const pieds = Math.max(pr.piedsMin, Math.min(pr.piedsMax, c.pieds + (Math.random() * 3 - 1.5)));
          return { ...all, [p.id]: { x, pieds, sens } };
        });
      }, periodeMs));
    }
    setPromenades(init);
    return () => timers.forEach(clearInterval);
  }, [lieu]); // eslint-disable-line react-hooks/exhaustive-deps

  // ——— accueil de Jumpy en entrant dans la boutique
  useEffect(() => {
    if (lieu === 'boutique' && boutiqueOuverte(heureDuJour(etat))) {
      setAccueil(ACCUEILS[Math.floor(Math.random() * ACCUEILS.length)](personnage.nom));
      const id = setTimeout(() => setAccueil(null), 9000);
      return () => clearTimeout(id);
    }
    setAccueil(null);
  }, [lieu]); // eslint-disable-line react-hooks/exhaustive-deps

  // ——— essais (développement) : jouer n'importe quelle scène de PNJ depuis la console, ex. __monde.jouer('hevann-chemin')
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __monde?: unknown };
    w.__monde = { jouer: (id: string, sujet?: string) => setScene({ id, sujet, cle: ++compteur.current }), etat, monde, aller: (l: Destination) => aller(l) };
    return () => { delete w.__monde; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ——— les lieux voisins se chargent pendant qu'on est ici
  useEffect(() => { precharger(lieuxVoisins(lieu, ctx).flatMap((l) => imagesLieu(l, ctx))); }, [lieu]); // eslint-disable-line react-hooks/exhaustive-deps

  // ——— déplacements
  const aller = (vers: Destination) => {
    setMenu(null);
    son('woosh');
    if (vers === 'ranch') { sauver(); props.surRanch(etat, monde); return; }
    if (vers === 'exploration') { sauver(); props.surExploration(etat, monde); return; }
    setTransition(true);
    // le lieu d'arrivée (décor et PNJ présents) doit être prêt avant de se dévoiler : on l'attend au plus 3 s
    const images = imagesLieu(vers, ctx);
    if (!estPret(images)) precharger(images, { urgent: true });
    const t0 = performance.now();
    const arriver = () => {
      if (!estPret(images) && performance.now() - t0 < 3380) { setTimeout(arriver, 50); return; }
      setLieu(vers); sauver(); setTimeout(() => setTransition(false), 60);
    };
    setTimeout(arriver, 380);
  };

  const ouvrirEntree = (en: EntreeMenu) => {
    setMenu(null);
    son('paperTick');
    if (en.scene) setScene({ id: en.scene, sujet: en.sujet, cle: ++compteur.current });
    else if (en.panneau === 'sac') setSacOuvert(true);
    else if (en.panneau) setPanneau(en.panneau);
    else if (en.aller) aller(en.aller);
  };

  const cliquerPnj = (p: PnjLieu, x: number, y: number) => {
    if (scene || panneau || sacOuvert || carnetOuvert) return;
    const premier = p.premier?.(ctx);
    if (premier) { setMenu(null); son('paperTick'); setScene({ id: premier.scene, sujet: premier.sujet, cle: ++compteur.current }); return; }
    const entrees = p.menu(ctx);
    if (!entrees.length) return;
    if (entrees.length === 1 && entrees[0].aller) { ouvrirEntree(entrees[0]); return; }
    son('leather');
    setMenu(menu?.pnj === p ? null : { pnj: p, x, y, entrees });
  };

  // ——— le décor couvre le repère sans déformation
  const boite = useMemo(() => {
    const r = L.ratio;
    if (1280 / 800 > r) { const h = 1280 / r; return { left: 0, top: (800 - h) / 2, width: 1280, height: h }; }
    const w = 800 * r; return { left: (1280 - w) / 2, top: 0, width: w, height: 800 };
  }, [L.ratio]);
  const enRepere = (xPct: number, yPct: number) => ({ x: boite.left + (xPct / 100) * boite.width, y: boite.top + (yPct / 100) * boite.height });
  const assets = useMemo(() => new Map(catalogue.assets.map((a) => [a.chemin, a])), [catalogue.assets]);

  const h = heureDuJour(etat);
  const fermee = lieu === 'boutique' && !boutiqueOuverte(h);
  const nuit = h >= 21 || h < 5;
  const crepuscule = !nuit && (h >= 18 || h < 7);
  const filtreDecor = lieu === 'atelier' || lieu === 'boutique' ? (fermee ? 'brightness(.55) saturate(.8)' : 'none')
    : nuit ? 'brightness(.52) saturate(.7) hue-rotate(12deg)' : crepuscule ? 'brightness(.82) saturate(.95) sepia(.18)' : 'none';
  const pnjVisibles = L.pnj.filter((p) => p.visible(ctx));

  const commun = { e: etat, m: monde, sim, rafraichir, noter, fermer: () => { setPanneau(null); sauver(); rafraichir(); } };
  const libre = !scene && !panneau && !transition;
  /** « Utiliser » depuis le sac : l'écho mange ou reçoit l'objet (il n'est pas montré ici : une note le raconte). */
  const utiliser = (index: number, fermer: (puis?: () => void) => void) => fermer(() => {
    const c = etat.inventaire[index];
    if (!c) return;
    const r = aliment(c.id) ? sim.nourrir(index) : sim.utiliser(index);
    for (const x of sim.vider()) if (x.type === 'journal') noter(x.texte, 'note');
    if (r.ok) { son('pop'); if ('texte' in r && r.texte) noter(r.texte, 'bien'); }
    else { son('refus'); if (r.raison) noter(r.raison, 'mal'); }
    sauver();
    rafraichir();
  });

  return (
    <>
      <Repere fond="#0d0906" className="mo">
        <div className={`mo-lieu ${transition ? 'transition' : ''}`} onClick={() => setMenu(null)}>
          <div className="mo-decor" style={{ ...boite, filter: filtreDecor }}>
            <img className="fond" src={asset(L.decor(ctx))} alt={L.nom} draggable={false} />
            {pnjVisibles.map((p, i) => {
              const img = p.image(ctx);
              const cle = `${p.id}-${i}`;
              const a = assets.get(img);
              const actif = survol === cle || menu?.pnj === p;
              if (p.calque) {
                const b = a?.boite && a.l && a.h ? { left: (a.boite.x / a.l) * 100, top: (a.boite.y / a.h) * 100, width: (a.boite.l / a.l) * 100, height: (a.boite.h / a.h) * 100 } : { left: 0, top: 0, width: 100, height: 100 };
                return (
                  <div key={cle} className={`mo-calque ${actif ? 'actif' : ''}`}>
                    <img src={asset(img)} alt="" draggable={false} />
                    <button className="mo-zone" aria-label={p.nom} style={{ left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` }}
                      onMouseEnter={() => { setSurvol(cle); son('paperTick'); }} onMouseLeave={() => setSurvol(null)}
                      onClick={(ev) => { ev.stopPropagation(); cliquerPnj(p, b.left + b.width / 2, b.top); }}>
                      <span className="nom">{p.nom}</span>
                    </button>
                  </div>
                );
              }
              const pr = p.promenade ? promenades[p.id] : null;
              const pose = p.pose ?? { x: pr?.x ?? 50, pieds: pr?.pieds ?? 80, hauteur: p.promenade!.hauteur, miroir: false };
              const x = pr ? pr.x : pose.x, pieds = pr ? pr.pieds : pose.pieds;
              // la taille suit la profondeur pour ceux qui se promènent
              const echelle = p.promenade && p.promenade.piedsMax > p.promenade.piedsMin ? 0.94 + ((pieds - p.promenade.piedsMin) / (p.promenade.piedsMax - p.promenade.piedsMin)) * 0.12 : 1;
              const miroir = pr ? pr.sens < 0 : !!pose.miroir;
              // la silhouette (boîte utile de l'image) a la hauteur voulue et les pieds sur la ligne ; les marges débordent
              const bt = a?.boite && a.l && a.h ? a.boite : null;
              const cadre: CSSProperties = bt && a?.l && a.h
                ? { height: `${(a.h / bt.h) * 100}%`, left: `${(-bt.x / bt.l) * 100}%`, top: `${(-bt.y / bt.h) * 100}%` }
                : { height: '100%', left: 0, top: 0 };
              return (
                <button key={cle} className={`mo-sprite ${actif ? 'actif' : ''} ${p.promenade ? 'marche' : ''}`} aria-label={p.nom}
                  style={{ left: `${x}%`, top: `${pieds}%`, height: `${pose.hauteur * echelle}%`, aspectRatio: bt ? `${bt.l} / ${bt.h}` : a?.l && a.h ? `${a.l} / ${a.h}` : '2 / 3', zIndex: Math.round(pieds) } as CSSProperties}
                  onMouseEnter={() => { setSurvol(cle); son('paperTick'); }} onMouseLeave={() => setSurvol(null)}
                  onClick={(ev) => { ev.stopPropagation(); cliquerPnj(p, x, pieds - pose.hauteur * echelle); }}>
                  <span className="corps" style={{ transform: miroir ? 'scaleX(-1)' : undefined }}>
                    <img src={asset(img)} alt={p.nom} draggable={false} style={cadre} />
                  </span>
                  <span className="ombre" />
                  <span className="nom">{p.nom}</span>
                </button>
              );
            })}
          </div>
          {nuit && lieu !== 'atelier' && lieu !== 'boutique' && <div className="mo-nuit" />}

          {/* les passages : une flèche à la craie sur le bord du décor (comme en exploration), le nom au survol */}
          {L.passages(ctx).filter((pa) => pa.fleche).map((pa) => {
            const f = pa.fleche!;
            return (
              <div key={`${lieu}-${pa.vers}`} className={`mo-passage ${survolPassage === pa.vers ? 'survol' : ''} ${libre && !sacOuvert && !carnetOuvert ? '' : 'cache'}`}
                style={{ left: `${f.x}px`, top: `${f.y}px` }}>
                <div className="halo" />
                <svg className="fleche" viewBox="-36 -36 72 72" style={{ transform: `rotate(${f.angle}deg)` }} aria-hidden="true">
                  <g>
                    <path className="ombre" d="M-17 6 L0 -9 L17 6 M-13 22 L0 10 L13 22" />
                    <path d="M-17 6 C-11 1 -5 -4 0 -9 C5 -4 11 1 17 6" />
                    <path d="M-13 22 C-8 18 -4 14 0 10 C4 14 8 18 13 22" />
                  </g>
                </svg>
                <button aria-label={pa.libelle} onClick={(ev) => { ev.stopPropagation(); setSurvolPassage(null); aller(pa.vers); }}
                  onMouseEnter={() => { setSurvolPassage(pa.vers); son('paperTick'); }} onMouseLeave={() => setSurvolPassage(null)} />
                <span className={`etiq ${f.nom ?? (f.x > 900 ? 'gauche' : 'droite')}`}>{pa.libelle}</span>
              </div>
            );
          })}

          {fermee && (
            <div className="mo-ferme">
              <div className="corde g" /><div className="corde d" />
              <div className="etiquette leather"><span className="stitch" /><b>Fermé</b><span className="mot">revenez entre {OUVERTURE_BOUTIQUE} h et {FERMETURE_BOUTIQUE} h</span></div>
            </div>
          )}
          {/* l'accueil de Jumpy : un feuillet de la feuille de dialogue, son nom tamponné à son encre */}
          {accueil && !fermee && !scene && !panneau && (
            <div className="mo-accueil" onClick={(ev) => { ev.stopPropagation(); setAccueil(null); }}>
              <span className="qui" style={{ color: catalogue.pnj.jumpy?.encre ?? '#9c3b2a' }}>Jumpy</span>
              <p>{accueil}</p>
            </div>
          )}

          {menu && (() => {
            const p = enRepere(menu.x, menu.y);
            return (
              <div className="mo-menu" style={{ left: Math.max(130, Math.min(1150, p.x)), top: Math.max(64 + menu.entrees.length * 38, p.y - 6) }} onClick={(ev) => ev.stopPropagation()}>
                <div className="titre">{menu.pnj.nom}</div>
                {menu.entrees.map((en, i) => (
                  <button key={i} className="entree" onMouseEnter={() => son('paperTick')} onClick={() => ouvrirEntree(en)}>
                    {en.icone && (IC as Record<string, string>)[en.icone]
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={(IC as Record<string, string>)[en.icone]} /></svg>
                      : en.icone ? <img src={asset(`interface/icones/${en.icone}.png`)} alt="" /> : null}
                    <span>{en.libelle}</span>
                  </button>
                ))}
              </div>
            );
          })()}

          <Calque minute={etat.minute} sons={sons} devant={sacOuvert || carnetOuvert}>
            <Encart etat={etat} lieu={L.nom} />
            <BoutonSac top={20} cache={!libre} ouvrir={() => { setMenu(null); setSacOuvert(true); }} />
            <BoutonCarnet top={122} cache={!libre} ouvrir={() => { setMenu(null); setCarnetOuvert(true); }} />
            <Poteau top={224} cache={!libre || sacOuvert || carnetOuvert}
              destinations={destinationsPoteau(L.passages(ctx)).map((pa) => ({ nom: pa.libelle, icone: ICONES_LIEU[pa.vers === 'boutique' ? 'magasin' : pa.vers === 'potager' ? 'foret' : pa.vers], partir: () => aller(pa.vers) }))} />
            {sacOuvert && <Sacoche etat={etat} ressources={monde.ressources} surFerme={() => { setSacOuvert(false); rafraichir(); }} surUtiliser={utiliser} sauver={sauver} />}
            {carnetOuvert && <PetitCarnet etat={etat} portrait={assets.get(apparence(etat))?.url} reglages={reglages} surReglages={props.surReglages}
              sauver={sauver} surMenu={props.surMenu} surFerme={() => setCarnetOuvert(false)} monde={monde} />}
          </Calque>

          <div className="mo-notes">
            {notes.map((n) => <div key={n.id} className={`mo-note ${n.ton}`}>{n.texte}</div>)}
          </div>

          {panneau === 'boutique' && <Etal {...commun} />}
          {panneau === 'stand' && <Stand {...commun} />}
          {panneau === 'coffre' && <Coffre {...commun} />}
          {panneau === 'travaux' && <Travaux {...commun} />}
          {panneau === 'travail' && <Travail {...commun} gain={() => undefined} />}
        </div>
      </Repere>

      {scene && (
        <ScenePnj key={scene.cle} id={scene.id} sujet={scene.sujet} decor={L.decorScene(ctx)} etat={etat} monde={monde} personnage={personnage}
          catalogue={catalogue} sons={sons} musique={reglages.musique !== false} sim={sim}
          sauver={sauver} surSorties={traiter} surNote={noter} surCombat={setCombat}
          surMort={() => { setScene(null); props.surMort(etat); }}
          surFin={({ sortie }) => {
            setScene(null);
            rafraichir();
            if (!sortie) return;
            if (sortie === 'ranch' || sortie === 'exploration' || sortie in LIEUX) aller(sortie as Destination);
          }} />
      )}
    </>
  );
}
