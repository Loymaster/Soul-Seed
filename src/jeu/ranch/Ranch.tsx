// Écran du ranch : la simulation (src/moteur/simulation) tourne en continu, 1 seconde = 1 minute de jeu.
// Le joueur ne voit aucun chiffre : il lit l'état de son écho dans son attitude, ses bulles et ce qu'il fait.
import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import {
  CORVEES, ENTRAINEMENTS, NOM_STADE, Simulation, accord, aliment, apparence, ageJours, heureDuJour,
  lireSignes, texteComportement, type CategorieInteraction, type Etat, type OptionInteraction,
  type ReponseComportement, type Sortie,
} from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { couches, lumiere, saison } from './lumiere';
import { IC } from './icones';
import { TAILLE_STADE, profilEcho, volumePas } from './demarche';
import { Carnet } from './Carnet';
import { Sac } from './Sac';
import { fixerVolumes } from '../commun/volumes';
import type { Reglages } from '../profils';
import './ranch.css';

export const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;

const NOM_GRAINE = { joy: 'Graine solaire', wrath: 'Graine tellurique', disgust: 'Graine caustique', sorrow: 'Graine boréale', fear: 'Graine spectrale' } as const;
const COULEUR = { bien: '#3f7a3a', mal: '#9c3b2a', note: '#2b2118' } as const;

type Verbe = 'echo' | 'soins' | 'jouer' | 'activites' | 'ranch';
const VERBES: { k: Verbe; nom: string; info: string; titre: (n: string) => string }[] = [
  { k: 'echo', nom: 'Mon écho', info: 'observer · éduquer', titre: (n) => n },
  { k: 'soins', nom: 'Soins', info: 'nourrir · laver · coucher', titre: () => 'Prendre soin' },
  { k: 'jouer', nom: 'Jouer', info: 'un moment ensemble', titre: () => 'Passer un moment ensemble' },
  { k: 'activites', nom: 'Activités', info: 'entraînements · corvées', titre: () => 'Entraînements et corvées' },
  { k: 'ranch', nom: 'Ranch', info: 'autour du ranch', titre: () => 'Autour du ranch' },
];
const CATEGORIES: { k: Exclude<CategorieInteraction, 'cadeau'> | 'cadeau'; nom: string; icone: string }[] = [
  { k: 'affection', nom: 'Affection', icone: IC.caliner },
  { k: 'discussion', nom: 'Discussion', icone: IC.discussion },
  { k: 'jeu', nom: 'Jeu', icone: IC.balle },
  { k: 'partage', nom: 'Partage', icone: IC.partage },
  { k: 'education', nom: 'Éducation', icone: IC.education },
  { k: 'cadeau', nom: 'Cadeau', icone: IC.cadeau },
];
const COURT: Record<ReponseComportement, string> = {
  feliciter: 'Féliciter', gronder: 'Gronder', rien: 'Se taire', encourager: 'Encourager', prevenir: 'Prévenir', remercier: 'Remercier', critiquer: 'Critiquer',
};
const DESTINATIONS = [
  { nom: 'Au village', duree: '20 min', icone: IC.village, texte: 'En route pour le village…', combat: false },
  { nom: 'Au magasin', duree: '10 min', icone: IC.magasin, texte: 'Direction le magasin…', combat: false },
  { nom: 'En exploration', duree: 'selon le chemin', icone: IC.exploration, texte: 'Le sentier vous attend…', combat: true },
];

interface Choix {
  cle: string;
  nom: string;
  image?: string;
  icone?: string;
  detail?: string;
  off?: boolean;
  rubrique?: boolean;
  /** Le choix ouvre une sous-liste au lieu de lancer l'action (la fiche reste ouverte). */
  garderOuvert?: boolean;
  prendre?: () => void;
}

interface Flottant { id: number; texte: string; couleur: string; x: number; y: number; long: boolean }
interface Passage { cle: number; titre: string; sous?: string; image?: string; bloquant?: boolean; part?: boolean }

export interface ProprietesRanch {
  etat: Etat;
  /** Enregistre la partie (appelé à chaque heure de jeu et après chaque action). */
  sauver: (e: Etat) => void;
  surQuitter: () => void;
  reglages?: Reglages;
  surReglages?: (r: Reglages) => void;
  /** L'écho s'est éteint : la séquence du « dernier souffle » prend le relais. */
  surMort?: (e: Etat) => void;
  /** Un combat commence (exploration ou entraînement) : l'écran de combat prend le relais. */
  surCombat?: (e: Etat, nature: 'exploration' | 'entrainement') => void;
}

export function Ranch({ etat, sauver: sauverProp, surQuitter, reglages, surReglages, surMort, surCombat }: ProprietesRanch) {
  const sauverRef = useRef(sauverProp); sauverRef.current = sauverProp;
  const surMortRef = useRef(surMort); surMortRef.current = surMort;
  const sauver = useCallback((x: Etat) => sauverRef.current(x), []);
  const sim = useRef<Simulation>(null as unknown as Simulation);
  if (!sim.current) sim.current = new Simulation(etat);
  const e = sim.current.etat;
  const [, rafraichir] = useReducer((x: number) => x + 1, 0);

  // ——— mise à l'échelle du repère 1280 × 800
  const cadre = useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = useState(1);
  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setEchelle(Math.min(el.clientWidth / 1280, el.clientHeight / 800)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ——— minuteurs
  const minuteurs = useRef<number[]>([]);
  const plusTard = useCallback((f: () => void, ms: number) => { minuteurs.current.push(window.setTimeout(f, ms)); }, []);
  useEffect(() => () => { minuteurs.current.forEach(clearTimeout); }, []);
  const n = useRef(0);

  // ——— état de l'interface
  const [sons, setSons] = useState(reglages?.sons ?? true);
  const [musique, setMusique] = useState(reglages?.musique ?? true);
  const [volumeMusique, setVolumeMusique] = useState(reglages?.volumeMusique ?? 80);
  const [volumeBruitages, setVolumeBruitages] = useState(reglages?.volumeBruitages ?? 80);
  const reglagesRef = useRef(surReglages); reglagesRef.current = surReglages;
  useEffect(() => {
    fixerVolumes({ musique: volumeMusique / 100, bruitages: volumeBruitages / 100 });
    reglagesRef.current?.({ sons, musique, volumeMusique, volumeBruitages });
  }, [sons, musique, volumeMusique, volumeBruitages]);
  const son = useCallback(<K extends keyof typeof SFX>(nom: K, ...args: unknown[]) => {
    if (!sonsRef.current) return;
    const f = SFX[nom] as unknown as (...a: unknown[]) => void;
    if (typeof f === 'function') f.apply(SFX, args);
  }, []);
  const sonsRef = useRef(sons); sonsRef.current = sons;

  const [pos, setPos] = useState({ x: 520, y: 290, dur: 0, sens: '' as '' | 'gauche', marche: false });
  const posRef = useRef(pos); posRef.current = pos;
  const [anim, setAnim] = useState('');
  const [bulleEmo, setBulleEmo] = useState<string | null>(null);
  const [coeurs, setCoeurs] = useState<{ id: number; x: number; y: number; dx: number; delai: string }[]>([]);
  const [flottants, setFlottants] = useState<Flottant[]>([]);
  const [main, setMain] = useState(0);
  const [survol, setSurvol] = useState(-1);
  const [ouvert, setOuvert] = useState<Verbe | 'visiteur' | null>(null);
  const [sousCategorie, setSousCategorie] = useState<{ cat: Exclude<CategorieInteraction, 'cadeau'>; options: OptionInteraction[] } | null>(null);
  const [actif, setActif] = useState(-1);
  const [tamponne, setTamponne] = useState<string | null>(null);
  const [carnet, setCarnet] = useState(false);
  const [sacOuvert, setSacOuvert] = useState(false);
  const [quitter, setQuitter] = useState(false);
  const [evt, setEvt] = useState(false);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [nouvelles, setNouvelles] = useState(0);
  const [dejSurvol, setDejSurvol] = useState<number | null>(null);
  const [dejPart, setDejPart] = useState<number[]>([]);
  const dernierSon = useRef<Record<number, number>>({});
  const repos = useRef(0);

  const signes = lireSignes(e);
  const profil = profilEcho(e, 'bipede', signes.allure);
  const profilRef = useRef(profil); profilRef.current = profil;
  const signesRef = useRef(signes); signesRef.current = signes;
  const nom = e.nom;
  const a = (m: string, f: string) => accord(e, m, f);

  const enPause = carnet || sacOuvert || !!passage || evt || !!e.mort;
  const pauseRef = useRef(enPause); pauseRef.current = enPause;
  const occupe = () => !!(ouvertRef.current || carnetRef.current || sacRef.current || evtRef.current || passageRef.current || Date.now() < repos.current);
  const ouvertRef = useRef(ouvert); ouvertRef.current = ouvert;
  const carnetRef = useRef(carnet); carnetRef.current = carnet;
  const sacRef = useRef(sacOuvert); sacRef.current = sacOuvert;
  const evtRef = useRef(evt); evtRef.current = evt;
  const passageRef = useRef(passage); passageRef.current = passage;

  // ——— petits effets
  const flotter = useCallback((texte: string, couleur: string = COULEUR.note, dx = -120, dy = -40) => {
    const id = ++n.current;
    const long = texte.length > 34;
    const p = posRef.current;
    const x = Math.max(16, Math.min(1280 - (long ? 410 : 300), Math.round(p.x + dx)));
    const y = Math.max(110, Math.round(p.y + dy - (flottantsRef.current.length % 3) * 34));
    setFlottants((f) => f.concat({ id, texte, couleur, x, y, long }));
    plusTard(() => setFlottants((f) => f.filter((x) => x.id !== id)), long ? 4200 : 2400);
  }, [plusTard]);
  const flottantsRef = useRef(flottants); flottantsRef.current = flottants;

  const reagir = useCallback((emo: string | null, anime: string) => {
    repos.current = Date.now() + 3500;
    if (anime) { setAnim(''); plusTard(() => setAnim(anime), 20); plusTard(() => setAnim(''), 1400); }
    if (emo) {
      son('pop'); setBulleEmo(null);
      plusTard(() => setBulleEmo(emo), 30);
      plusTard(() => setBulleEmo((b) => (b === emo ? null : b)), 2600);
    }
  }, [plusTard, son]);

  const lancerCoeurs = useCallback((k: number) => {
    const ech = profilRef.current.echelle;
    const c = Array.from({ length: k }, (_, i) => ({ id: ++n.current, x: 56 + Math.round(Math.random() * 40), y: Math.round(234 - 190 * ech - 16), dx: Math.round((Math.random() - 0.5) * 60), delai: (i * 0.12).toFixed(2) }));
    setCoeurs((s) => s.concat(c));
    plusTard(() => setCoeurs((s) => s.filter((x) => !c.includes(x))), 2000);
  }, [plusTard]);

  const montrerPassage = useCallback((p: Omit<Passage, 'cle'>, duree = 1900) => {
    const cle = ++n.current;
    setPassage({ ...p, cle });
    if (!p.bloquant) {
      plusTard(() => setPassage((x) => (x && x.cle === cle ? { ...x, part: true } : x)), duree);
      plusTard(() => setPassage((x) => (x && x.cle === cle ? null : x)), duree + 600);
    }
  }, [plusTard]);

  // ——— ce que la simulation signale
  const traiter = useCallback((sorties: Sortie[]) => {
    const s = sim.current;
    for (const x of sorties) {
      switch (x.type) {
        case 'journal': setNouvelles((k) => k + 1); break;
        case 'message': flotter(x.texte, COULEUR[x.ton], -150, -10); break;
        case 'refus': son('refus'); reagir(null, 'non'); flotter(x.texte, COULEUR.mal, -150, -30); break;
        case 'dejection': son('pop'); break;
        case 'voisin': case 'autonomie': case 'visiteur-parti': flotter(x.texte, COULEUR.note, -150, -20); break;
        case 'evenement':
          if (x.nature === 'bruit') { son('darkHover'); reagir(lireSignes(s.etat).expression.icone, 'saute'); } else son('reveal');
          flotter(x.texte, COULEUR.note, -150, -20);
          break;
        case 'comportement': son('pop'); break;
        case 'sommeil':
          montrerPassage({ titre: `${x.heures} heure${x.heures > 1 ? 's' : ''} plus tard…`, sous: x.effondrement ? `${s.etat.nom} s’est ${accord(s.etat, 'écroulé', 'écroulée')} de fatigue` : `${s.etat.nom} a dormi` }, 2200);
          break;
        case 'evolution':
          son('reveal');
          montrerPassage({ titre: 'Il se passe quelque chose !', sous: `${s.etat.nom} a atteint le stade ${NOM_STADE[x.vers]}`, image: asset(apparence(s.etat)) }, 4200);
          break;
        case 'mort':
          sauver(s.etat);
          // « Il se passe quelque chose… » : la séquence de mort prend le relais, sans annonce au ranch
          if (surMortRef.current) { const fin = s.etat; window.setTimeout(() => surMortRef.current?.(fin), 1500); break; }
          son('darkClick');
          montrerPassage({ titre: `${s.etat.nom} s’est ${accord(s.etat, 'éteint', 'éteinte')}…`, sous: CAUSES[x.cause], image: asset(apparence(s.etat)), bloquant: true });
          break;
        default: break;
      }
    }
  }, [flotter, montrerPassage, reagir, son, sauver]);

  // ——— le temps s'écoule
  useEffect(() => {
    const id = window.setInterval(() => {
      if (pauseRef.current) return;
      const s = sim.current;
      const heureAvant = heureDuJour(s.etat);
      s.minute();
      traiter(s.vider());
      if (heureDuJour(s.etat) !== heureAvant) sauver(s.etat);
      // Indices sonores discrets : un ventre qui gargouille, un bâillement
      const g = lireSignes(s.etat);
      const niveau = (b: string) => g.besoins.find((x) => x.besoin === b)?.urgence ?? 0;
      if (niveau('faim') >= 2 && s.etat.minute % 37 === 0) son('gargouille', volumePas(posRef.current.y));
      if (niveau('fatigue') >= 2 && s.etat.minute % 45 === 0) { son('baille', volumePas(posRef.current.y)); if (!posRef.current.marche) { setAnim('baille'); plusTard(() => setAnim(''), 1500); } }
      rafraichir();
    }, 1000);
    return () => clearInterval(id);
  }, [traiter, son, plusTard]);

  // ——— l'écho se promène
  const pasTimer = useRef<number>(0);
  const pasDemarrer = useCallback(() => {
    clearInterval(pasTimer.current);
    const p = profilRef.current;
    const ms = p.cycle * 1000;
    const cycleSon = () => {
      if (!posRef.current.marche) return;
      if (p.motif) p.motif.forEach((o, i) => plusTard(() => { if (posRef.current.marche) son('foulee', p, volumePas(posRef.current.y), i); }, o * ms));
      else son('glisse', p, volumePas(posRef.current.y), p.cycle * 0.95);
    };
    plusTard(cycleSon, 30);
    pasTimer.current = window.setInterval(cycleSon, ms);
  }, [plusTard, son]);
  useEffect(() => () => clearInterval(pasTimer.current), []);

  useEffect(() => {
    let actifErrer = true;
    const errer = () => {
      if (!actifErrer) return;
      const s = sim.current;
      if (occupe() || s.etat.mort) { plusTard(errer, 1200); return; }
      const g = signesRef.current;
      const p = posRef.current;
      let x = 0, y = 0, d = 0, essais = 0;
      do {
        if (g.approche && Math.random() < 0.7) { x = 460 + Math.random() * 360; y = 330 + Math.random() * 40; }
        else { x = 250 + Math.random() * 730; y = 235 + Math.random() * 135; }
        d = Math.hypot(x - p.x, y - p.y);
      } while (d < 140 && ++essais < 8);
      const dur = d / profilRef.current.vitesse;
      setPos({ x: Math.round(x), y: Math.round(y), dur: +dur.toFixed(2), sens: x < p.x ? 'gauche' : '', marche: true });
      posRef.current = { ...posRef.current, marche: true };
      pasDemarrer();
      plusTard(() => {
        clearInterval(pasTimer.current);
        setPos((q) => ({ ...q, marche: false }));
        plusTard(errer, (2600 + Math.random() * 4200) * signesRef.current.flanerie);
      }, dur * 1000);
    };
    plusTard(errer, 1800);
    return () => { actifErrer = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ——— actions
  const apres = useCallback((reaction?: { anim?: string; coeurs?: number; sansBulle?: boolean }) => {
    const s = sim.current;
    traiter(s.vider());
    sauver(s.etat);
    if (reaction) {
      reagir(reaction.sansBulle ? null : lireSignes(s.etat).expression.icone, reaction.anim ?? '');
      if (reaction.coeurs) lancerCoeurs(reaction.coeurs);
    }
    rafraichir();
  }, [lancerCoeurs, reagir, traiter]);

  /** Une action qui prend du temps : un fondu « … plus tard », puis la réaction. */
  const avecTemps = (heures: number, f: () => void, reaction?: { anim?: string; coeurs?: number }) => {
    f();
    const s = sim.current;
    const sorties = s.vider();
    const dort = sorties.some((x) => x.type === 'sommeil');
    if (!dort && !s.etat.mort) montrerPassage({ titre: heures === 1 ? 'Une heure plus tard…' : heures === 2 ? 'Deux heures plus tard…' : `${heures} heures plus tard…` }, 1500);
    traiter(sorties);
    sauver(s.etat);
    plusTard(() => apres(reaction), 1700);
    rafraichir();
  };

  const prendre = (cle: string, action: () => void) => {
    if (tamponne) return;
    setTamponne(cle);
    plusTard(() => son('stamp'), 120);
    plusTard(() => { setOuvert(null); setTamponne(null); setActif(-1); setSousCategorie(null); action(); }, 700);
  };

  const caresser = () => {
    const s = sim.current;
    if (main) return;
    if (s.etat.comportement) { ouvrirEvt(); return; }
    repos.current = Date.now() + 3000;
    const r = s.caresser();
    if (!r.ok) { traiter(s.vider()); rafraichir(); return; }
    const m = ++n.current;
    setMain(m);
    son('caresse');
    plusTard(() => setMain((x) => (x === m ? 0 : x)), 1300);
    plusTard(() => { lancerCoeurs(3); apres({ anim: 'saute' }); }, 1150);
  };

  const ouvrirEvt = () => {
    son('slide');
    setOuvert(null); setQuitter(false);
    setEvt(true);
  };
  const repondre = (r: ReponseComportement) => {
    const s = sim.current;
    son('stamp');
    setEvt(false);
    const res = s.repondreComportement(r);
    const anime = r === 'gronder' || r === 'critiquer' || r === 'prevenir' ? '' : 'saute';
    apres({ anim: anime });
    if (res.ok && res.objetTrouve) plusTard(() => flotter(res.sacPlein ? `Le sac est plein : impossible de garder ${res.objetTrouve!.toLowerCase()}.` : `${res.objetTrouve} rejoint votre sac.`, res.sacPlein ? COULEUR.mal : COULEUR.bien, -150, -10), 400);
  };

  const fermerSac = () => setSacOuvert(false);
  const utiliserObjet = (index: number) => {
    const s = sim.current;
    const c = s.etat.inventaire[index];
    if (!c) return;
    const estAliment = !!aliment(c.id);
    const r = s.utiliser(index);
    if (!r.ok) { traiter(s.vider()); if (r.raison && !estAliment) flotter(r.raison, COULEUR.mal, -150, -20); rafraichir(); return; }
    apres({ anim: estAliment ? 'mange' : 'saute' });
  };

  // ——— fiches
  const nbObjets = (id: string) => e.inventaire.filter((c) => c?.id === id).reduce((t, c) => t + (c?.qte ?? 0), 0);
  const indexObjet = (id: string) => e.inventaire.findIndex((c) => c?.id === id);
  const choixDe = (v: Verbe | 'visiteur'): Choix[] => {
    const s = sim.current;
    if (v === 'soins') {
      const aliments: Choix[] = e.inventaire.flatMap((c, i) => {
        const al = c && aliment(c.id);
        return al && c ? [{ cle: 'al-' + i, nom: al.nom, image: asset(al.icone), detail: `× ${c.qte}`, prendre: () => utiliserObjet(i) }] : [];
      });
      return [
        { cle: 'r-nourrir', nom: 'Nourrir', rubrique: true },
        ...(aliments.length ? aliments : [{ cle: 'rien', nom: 'Plus rien à manger dans le sac', icone: IC.mystere, off: true }]),
        { cle: 'r-soins', nom: 'Soins', rubrique: true },
        { cle: 'laver', nom: 'Laver', icone: IC.laver, detail: '2 h', prendre: () => avecTemps(2, () => s.laver(), { anim: 'secoue' }) },
        { cle: 'pansement', nom: 'Soigner une blessure', icone: IC.trousse, detail: nbObjets('bandage') ? `pansement × ${nbObjets('bandage')}` : 'pas de pansement', off: !nbObjets('bandage'), prendre: () => utiliserObjet(indexObjet('bandage')) },
        { cle: 'medicament', nom: 'Donner un médicament', icone: IC.medicament, detail: nbObjets('medicament') ? `× ${nbObjets('medicament')}` : 'aucun', off: !nbObjets('medicament'), prendre: () => utiliserObjet(indexObjet('medicament')) },
        { cle: 'coucher', nom: 'Le coucher', icone: IC.coucher, prendre: () => { const r = s.coucher(); if (!r.ok) { traiter(s.vider()); rafraichir(); return; } traiter(s.vider()); plusTard(() => apres({ sansBulle: false }), 2400); rafraichir(); } },
      ];
    }
    if (v === 'jouer') {
      if (sousCategorie) {
        return [
          { cle: 'r-' + sousCategorie.cat, nom: CATEGORIES.find((c) => c.k === sousCategorie.cat)!.nom, rubrique: true },
          ...sousCategorie.options.map((o) => ({
            cle: o.id, nom: s.libelle(o), icone: CATEGORIES.find((c) => c.k === sousCategorie.cat)!.icone, detail: '1 h',
            prendre: () => avecTemps(1, () => {
              const r = s.interagir(sousCategorie.cat, o);
              if (r.ok) plusTard(() => flotter(r.texte, COULEUR.note, -150, -10), 1800);
            }, { anim: 'saute', coeurs: sousCategorie.cat === 'affection' ? 5 : 0 }),
          })),
        ];
      }
      return CATEGORIES.map((c) => {
        const fait = c.k !== 'cadeau' && e.interactionsDuJour[c.k] === e.jour;
        return {
          cle: c.k, nom: c.nom, icone: c.icone, garderOuvert: true,
          off: c.k === 'cadeau' || fait,
          detail: c.k === 'cadeau' ? 'pas encore' : fait ? 'déjà fait aujourd’hui' : 'choisir…',
          prendre: () => {
            if (c.k === 'cadeau') return;
            const options = s.proposer(c.k);
            if (!options) return;
            son('page', 0.7);
            setActif(-1);
            setSousCategorie({ cat: c.k, options });
          },
        };
      });
    }
    if (v === 'activites') {
      return [
        { cle: 'r-entr', nom: 'Entraînements', rubrique: true },
        ...ENTRAINEMENTS.map((t) => ({
          cle: t.id, nom: t.nom, image: asset(t.icone), detail: '2 h',
          prendre: () => {
            const r = s.entrainer(t.id);
            if (!r.ok) { flotter(r.raison, COULEUR.mal, -150, -20); return; }
            const sorties = s.vider();
            montrerPassage({ titre: 'Deux heures plus tard…', sous: t.nom }, 1500);
            traiter(sorties);
            sauver(s.etat);
            plusTard(() => { apres({ anim: 'effort' }); flotter(`${nom} a l’air un peu plus ${a('fort', 'forte')}.`, COULEUR.bien, -150, -10); }, 1700);
            rafraichir();
          },
        })),
        { cle: 'r-combat', nom: 'Combat', rubrique: true },
        { cle: 'combat-entr', nom: 'Combat d’entraînement', icone: IC.course, detail: surCombat ? 'contre un écho de passage' : 'à venir', off: !surCombat,
          prendre: () => { if (!surCombat) return; sauver(s.etat); surCombat(s.etat, 'entrainement'); } },
        { cle: 'r-corv', nom: 'Corvées', rubrique: true },
        ...CORVEES.map((c) => ({ cle: c.id, nom: c.nom, image: asset(c.icone), off: true, detail: 'à remettre en état' })),
      ];
    }
    if (v === 'ranch') {
      return [
        { cle: 'balayer', nom: 'Tout balayer', icone: IC.balai, off: !e.dejections.length, detail: e.dejections.length ? '' : 'rien à ramasser', prendre: () => { [...e.dejections].forEach((d) => s.nettoyer(d.id)); son('woosh'); flotter('Vous avez tout balayé.', COULEUR.bien); apres(); } },
        { cle: 'attendre', nom: 'Laisser le temps passer', icone: IC.sablier, detail: '1 h', prendre: () => avecTemps(1, () => s.laisserPasser(1)) },
        { cle: 'r-lieux', nom: 'Lieux', rubrique: true },
        { cle: 'jardin', nom: 'Jardin', icone: IC.jardin, off: true, detail: 'à venir' },
        { cle: 'cuisine', nom: 'Cuisine', icone: IC.cuisine, off: true, detail: 'personne pour cuisiner… pour l’instant' },
        { cle: 'lieu1', nom: '???', icone: IC.mystere, off: true, detail: 'à découvrir' },
      ];
    }
    if (v === 'visiteur') {
      const duo = (nature: 'jeu' | 'bagarre') => () => avecTemps(1, () => {
        const r = s.duoAvecVisiteur(nature);
        if (r.ok) plusTard(() => flotter(r.texte, r.succes ? COULEUR.bien : COULEUR.mal, -150, -10), 1800);
      }, { anim: nature === 'jeu' ? 'saute' : 'effort' });
      return [
        { cle: 'temps', nom: 'Passer du temps ensemble', icone: IC.partage, detail: '1 h', prendre: () => avecTemps(1, () => { const r = s.passerDuTempsAvecVisiteur(); if (r.ok) plusTard(() => flotter(r.texte, COULEUR.note, -150, -10), 1800); }, { anim: 'saute' }) },
        { cle: 'jouer', nom: 'Jouer ensemble', icone: IC.balle, detail: '1 h', prendre: duo('jeu') },
        { cle: 'bagarre', nom: 'Se bagarrer', icone: IC.course, detail: '1 h', prendre: duo('bagarre') },
      ];
    }
    return [];
  };

  // ——— rendu
  const heure = e.minute / 60;
  const m = lumiere(heure);
  const op = couches(heure);
  const visiteur = sim.current.visiteur;
  const iv = VERBES.findIndex((v) => v.k === ouvert);
  const centreVerbe = ouvert === 'visiteur' ? 1010 : 640 + (iv - 2) * 104;
  const ficheX = Math.max(24, Math.min(1280 - 454, centreVerbe - 215));
  const choix = ouvert && ouvert !== 'echo' ? choixDe(ouvert) : [];
  const ech = profil.echelle;
  /** Haut de la tête dans la zone de l'écho (l'image de 190 px pour 90 cm est posée 6 px au-dessus du bas). */
  const tete = 234 - 190 * ech;
  const eScale = (0.86 + (pos.y - 235) / 135 * 0.28).toFixed(3);
  const droite = pos.x > 640;
  const bulleBesoin = signes.bulle && !bulleEmo && e.minute % 14 < 5 ? signes.bulle : null;
  const niveau = (b: string) => signes.besoins.find((x) => x.besoin === b)?.urgence ?? 0;
  const humeurMot = accord(e, signes.expression.m, signes.expression.f);
  const C = 2 * Math.PI * 30;
  const cacheCote = carnet || sacOuvert;
  let idx = -1;

  return (
    <div className="ranch-cadre" ref={cadre}>
      <div className="ranch-repere" style={{ transform: `translate(-50%, -50%) scale(${echelle})` }}>
        {/* Décor : les quatre illustrations du ranch se fondent l'une dans l'autre selon l'heure */}
        <div className="ranch" style={{ backgroundImage: `url(${asset('decors/ranch/nuit.png')})`, opacity: 1 }} />
        <div className="ranch" style={{ backgroundImage: `url(${asset('decors/ranch/soiree.png')})`, opacity: op.soir }} />
        <div className="ranch" style={{ backgroundImage: `url(${asset('decors/ranch/matinee.png')})`, opacity: op.matin }} />
        <div className="ranch" style={{ backgroundImage: `url(${asset('decors/ranch/journee.png')})`, opacity: op.jour }} />
        <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', background: m.c, opacity: m.o * 0.3, transition: 'all 1.2s ease', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 55%,transparent 45%,rgba(10,8,20,.75) 100%)', opacity: m.vig * 0.7, transition: 'opacity 1.2s ease', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: m.fly, transition: 'opacity 1.2s ease', pointerEvents: 'none' }}>
          {[[440, 300, 0, 6], [820, 330, -3, 5], [300, 390, -6, 4], [1000, 400, -2, 5], [660, 250, -4.5, 4]].map(([x, y, d, t], i) => (
            <div key={i} className="fly" style={{ position: 'absolute', left: x, top: y, animationDelay: `${d}s` }}><div style={{ width: t, height: t, borderRadius: '50%', background: '#fff1a8', boxShadow: '0 0 10px 3px rgba(255,226,120,.8)', animationDelay: `${-i * 0.5}s` }} /></div>
          ))}
        </div>

        {/* Fenêtre de ciel cousue dans le cuir : jour, heure, bourse */}
        <div className="leather" style={{ position: 'absolute', left: 24, top: 22, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px 12px 14px', borderRadius: 18, filter: m.papier }}>
          <div className="stitch" style={{ borderRadius: 12 }} />
          <svg width="112" height="66" viewBox="0 0 132 78" role="img" aria-label={`Ciel du ranch : ${m.periode}`}>
            <defs>
              <clipPath id="rSkyClip"><path d="M10 70a56 56 0 0 1 112 0z" /></clipPath>
              <linearGradient id="rSkyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={m.cielHaut} /><stop offset="1" stopColor={m.cielBas} /></linearGradient>
            </defs>
            <g clipPath="url(#rSkyClip)">
              <rect x="0" y="0" width="132" height="78" fill="url(#rSkyGrad)" />
              <g opacity={m.etoiles}>
                <circle className="star" cx="34" cy="34" r="1.3" fill="#fff8e0" />
                <circle className="star" cx="88" cy="26" r="1.1" fill="#fff8e0" style={{ animationDelay: '-.8s' }} />
                <circle className="star" cx="104" cy="44" r="1.4" fill="#fff8e0" style={{ animationDelay: '-1.5s' }} />
                <circle className="star" cx="52" cy="22" r="1" fill="#fff8e0" style={{ animationDelay: '-.4s' }} />
              </g>
              <circle className="sun-glow" cx={m.sx} cy={m.sy} r="15" fill={m.soleil} opacity=".3" />
              <circle cx={m.sx} cy={m.sy} r="8.5" fill={m.soleil} stroke="#3a1f0e" strokeWidth="1.5" />
              <path d="M6 66c14-9 26-11 40-6s24 4 38-3 28-5 44 3v20H6z" fill={m.colline} stroke="#3a1f0e" strokeWidth="1.5" />
            </g>
            <path d="M10 70a56 56 0 0 1 112 0" fill="none" stroke="#3a1f0e" strokeWidth="5" />
            <path d="M4 70a62 62 0 0 1 124 0" fill="none" stroke="rgba(240,214,170,.7)" strokeWidth="1.8" strokeDasharray="5 4" />
            <path d="M6 70h120" stroke="#3a1f0e" strokeWidth="3" strokeLinecap="round" />
            <circle cx="10" cy="70" r="4" fill="#c9a050" stroke="#3a2410" strokeWidth="1.5" />
            <circle cx="122" cy="70" r="4" fill="#c9a050" stroke="#3a2410" strokeWidth="1.5" />
          </svg>
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: '#e9cfa0' }}>Jour {e.jour} · {saison(e.jour)}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, color: '#f6ecd6' }}><span style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.05 }}>{m.heure}</span><span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 27, color: '#f2c27a', lineHeight: 1 }}>{m.periode}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 500, color: '#e9cfa0' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#c9a050', boxShadow: 'inset 0 0 0 1.5px #3a2410' }} />{e.or} pièces</div>
          </div>
        </div>

        {/* Colonne de droite : carnet, sac, partir */}
        <button className={`carnet-btn ${cacheCote ? 'cache' : ''}`} onClick={() => { son('bookArrive'); setCarnet(true); setOuvert(null); setQuitter(false); }} aria-label="Ouvrir le carnet">
          <svg width="86" height="104" viewBox="0 0 86 104" aria-hidden="true">
            <rect x="10" y="8" width="62" height="80" rx="6" fill="#efe2c6" stroke="#3a1f0e" strokeWidth="2" transform="rotate(5 41 48)" />
            <rect x="8" y="6" width="64" height="82" rx="7" fill="#6e3f22" stroke="#3a1f0e" strokeWidth="2.2" transform="rotate(-4 40 47)" />
            <rect x="14" y="12" width="52" height="70" rx="4" fill="none" stroke="rgba(240,214,170,.65)" strokeWidth="1.6" strokeDasharray="4 3" transform="rotate(-4 40 47)" />
            <path d="M52 4v86l5-6 5 6V4" fill="#9c3b2a" stroke="#3a1f0e" strokeWidth="1.6" strokeLinejoin="round" transform="rotate(-4 40 47)" />
            <path d="M26 38h22M26 46h16" stroke="rgba(240,214,170,.8)" strokeWidth="2" strokeLinecap="round" transform="rotate(-4 40 47)" />
          </svg>
          <span style={{ position: 'absolute', left: 6, bottom: -4, fontFamily: "'Reenie Beanie',cursive", fontSize: 24, color: '#fbf3e2', textShadow: '0 1px 3px rgba(0,0,0,.8)' }}>carnet</span>
          {nouvelles > 0 && <span className="sceau" style={{ position: 'absolute', right: 4, top: 0 }}>{nouvelles > 9 ? '9+' : nouvelles}</span>}
        </button>
        <button className={`cote-btn ${cacheCote ? 'cache' : ''}`} style={{ top: 136 }} onClick={() => { son('leather'); plusTard(() => son('page', 0.5), 300); setSacOuvert(true); setOuvert(null); setQuitter(false); }} aria-label="Ouvrir le sac">
          <svg width="86" height="92" viewBox="0 0 86 92" aria-hidden="true">
            <path d="M14 44 C10 10 76 10 72 44" fill="none" stroke="#3a1f0e" strokeWidth="8" strokeLinecap="round" />
            <path d="M14 44 C10 10 76 10 72 44" fill="none" stroke="#8a5530" strokeWidth="5" strokeLinecap="round" />
            <path d="M14 44 C10 10 76 10 72 44" fill="none" stroke="rgba(240,214,170,.55)" strokeWidth="1.2" strokeDasharray="3 3" />
            <path d="M10 42h66l-4 34c-1 6-5 9-11 9H25c-6 0-10-3-11-9z" fill="#6e3f22" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M16 48h54l-3 26c-1 4-3 6-7 6H26c-4 0-6-2-7-6z" fill="none" stroke="rgba(240,214,170,.55)" strokeWidth="1.4" strokeDasharray="4 3" />
            <path d="M9 40h68v12c0 6-5 10-11 10H20c-6 0-11-4-11-10z" fill="#7d4a28" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <rect x="37" y="54" width="12" height="14" rx="2.5" fill="#c9a050" stroke="#3a2410" strokeWidth="1.8" />
            <rect x="41" y="58" width="4" height="6" rx="1" fill="#3a2410" />
          </svg>
          <span className="etiq">sac</span>
        </button>
        <button className={`cote-btn ${cacheCote ? 'cache' : ''}`} style={{ top: 244 }} onClick={() => { son('leather'); setQuitter((q) => !q); setOuvert(null); }} aria-label="Quitter le ranch" aria-expanded={quitter}>
          <svg width="86" height="92" viewBox="0 0 86 92" aria-hidden="true">
            <rect x="39" y="10" width="8" height="78" rx="2" fill="#8a5530" stroke="#3a1f0e" strokeWidth="2" />
            <path d="M14 18h48l10 9-10 9H14z" fill="#f4ead6" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M72 44H24l-10 9 10 9h48z" fill="#efe2c6" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M22 27h30M32 53h30" stroke="#6e3f22" strokeWidth="2" strokeLinecap="round" />
            <path d="M30 88c6-4 20-4 26 0" fill="none" stroke="#3a1f0e" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="etiq">partir</span>
        </button>
        {quitter && (
          <div className="quitter">
            <div style={{ position: 'relative', fontFamily: "'Reenie Beanie',cursive", fontSize: 26, lineHeight: 1, color: '#6b4f33', margin: '0 0 6px 6px' }}>Quitter le ranch</div>
            {DESTINATIONS.map((d) => (
              <button key={d.nom} className="choix" onMouseEnter={() => son('paperTick')} onClick={() => {
                setQuitter(false); son('woosh');
                if (d.combat && surCombat && !e.mort) { sauver(e); montrerPassage({ titre: d.texte, sous: 'quelque chose bouge dans les fourrés…', bloquant: false }, 1600); plusTard(() => surCombat(e, 'exploration'), 1700); return; }
                montrerPassage({ titre: d.texte, sous: 'ce chemin n’est pas encore ouvert dans cette version' }, 2200);
              }}>
                <span className="vign"><Encre d={d.icone} /></span>
                <span>{d.nom}</span><span className="det">{d.duree}</span>
              </button>
            ))}
          </div>
        )}

        {/* Déjections : on nettoie là où elles sont tombées, même si l'écho est devant */}
        {e.dejections.map((d) => {
          const x = Math.round(250 + d.x * 760), y = Math.round(430 + d.y * 160);
          return (
            <div key={d.id}>
              <div className={`crotte-img ${dejPart.includes(d.id) ? 'part' : dejSurvol === d.id ? 'survol' : ''}`} style={{ left: x, top: y, zIndex: 100 + y - 200 }}>
                <Recadre chemin={d.nature === 'vomi' ? 'activites/ranch/vomi.png' : 'activites/ranch/dejection.png'} l={56} h={52} />
              </div>
              <button className="crotte" style={{ left: x, top: y }} aria-label="Ramasser" onMouseEnter={() => setDejSurvol(d.id)} onMouseLeave={() => setDejSurvol(null)}
                onClick={() => {
                  if (dejPart.includes(d.id)) return;
                  son('woosh'); setDejPart((p) => p.concat(d.id));
                  plusTard(() => { sim.current.nettoyer(d.id); setDejPart((p) => p.filter((k) => k !== d.id)); son('pencil'); rafraichir(); }, 650);
                }}>
                <span className="astuce">ramasser</span>
              </button>
            </div>
          );
        })}

        {/* L'écho visiteur */}
        {visiteur && (
          <button className="visiteur" style={{ left: 1030, top: 250, zIndex: 100 + 250 + 120 }} onClick={() => { son('leather'); setOuvert(ouvert === 'visiteur' ? null : 'visiteur'); setQuitter(false); }} aria-label={`${visiteur.nom}, écho de passage`}>
            <img src={asset(apparence({ ...visiteur, evolution: null }))} alt="" style={{ filter: m.echo, height: Math.round(190 * TAILLE_STADE[visiteur.stade] / 0.9) }} />
            <span className="echo-tag"><span style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, color: '#2b2118' }}>{visiteur.nom}</span><span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 19, color: '#6b4f33' }}>de passage</span></span>
          </button>
        )}

        {/* L'écho se promène ; tout ce qui le concerne le suit */}
        <div className="echo-pos" style={{ left: pos.x, top: pos.y, transitionDuration: `${pos.dur}s`, transform: `scale(${eScale})`, zIndex: 100 + pos.y } as CSSProperties}>
          <button className={`echo-zone ${pos.marche ? 'marche' : anim} ${profil.demarche} p-${signes.posture}`} style={{ '--cycle': `${profil.cycle.toFixed(3)}s` } as CSSProperties}
            onClick={caresser} aria-label={e.comportement ? `${nom} a quelque chose à vous montrer` : `Caresser ${nom}`} disabled={!!e.mort}>
            <span className="echo-ombre" style={{ transform: `scaleX(${ech.toFixed(3)})` }} />
            <span className={`echo-sens ${pos.sens}`}><span className="echo-taille" style={{ transform: `scale(${ech.toFixed(3)})` }}>
              <img className={`echo-img ${e.malade ? 'echo-malade' : ''}`} src={asset(apparence(e))} alt={`${nom}, écho ${NOM_STADE[e.stade]}`} style={{ filter: m.echo }} />
            </span></span>
            {niveau('salete') >= 2 && <span className="mouches" style={{ top: Math.round(tete + 10) }}><i /><i /><i /></span>}
            <span className="echo-tag">
              <span style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, color: '#2b2118' }}>{nom}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d={IC.caliner} fill="#9c3b2a" opacity=".85" stroke="#3a1f0e" strokeWidth="1.6" /></svg>
              <span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 21, lineHeight: 1, color: '#6b4f33' }}>{humeurMot}</span>
            </span>
            <span className="caresse" style={{ top: Math.round(234 - 190 * ech + 40), left: Math.round(75 + 60 * ech) }}>{e.comportement ? 'regarder' : 'caresser'}</span>
          </button>
          {main > 0 && (
            <svg className="main" viewBox="0 0 82 66" aria-hidden="true" style={{ top: Math.round(tete - 38) }}>
              <path d="M78 10 C70 6 58 8 52 14 L30 16 C24 16 24 22 30 23 L44 24 L18 26 C12 27 12 34 18 34 L42 33 L16 38 C10 39 11 46 17 45 L42 41 L22 48 C16 50 18 57 24 55 L48 47 C58 50 70 46 76 38 Z" fill="#f6dcc4" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
              <path d="M52 14 C48 20 50 26 56 28" fill="none" stroke="#3a1f0e" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M74 12 C70 22 70 30 76 38" fill="none" stroke="#c9a37f" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {bulleBesoin && (
            <div key={bulleBesoin.besoin} className="bulle besoin" style={{ left: Math.round(70 + 40 * ech), top: Math.round(tete - 104) }}>
              <svg width="74" height="74" viewBox="0 0 86 86" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}><path d="M43 4c21 0 38 15 38 34S64 72 43 72c-4 0-7 0-10-1l-16 9 5-13C11 61 5 50 5 38 5 19 22 4 43 4z" fill="#fbf4e3" stroke="#3a1f0e" strokeWidth="2.5" /></svg>
              <img src={asset(bulleBesoin.icone)} alt="" style={{ position: 'absolute', left: 17, top: 10, width: 40, height: 40, objectFit: 'contain' }} />
            </div>
          )}
          {bulleEmo && (
            <div className="bulle" style={{ left: Math.round(78 + 40 * ech), top: Math.round(tete - 108) }}>
              <svg width="74" height="74" viewBox="0 0 86 86" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}><path d="M43 4c21 0 38 15 38 34S64 72 43 72c-4 0-7 0-10-1l-16 9 5-13C11 61 5 50 5 38 5 19 22 4 43 4z" fill="#fbf4e3" stroke="#3a1f0e" strokeWidth="2.5" /></svg>
              <img src={asset(bulleEmo)} alt="" style={{ position: 'absolute', left: 13, top: 8, width: 48, height: 48, objectFit: 'contain' }} />
            </div>
          )}
          {coeurs.map((c) => (
            <svg key={c.id} className="coeur" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ left: c.x, top: c.y, '--dx': `${c.dx}px`, animationDelay: `${c.delai}s` } as CSSProperties}><path d={IC.caliner} fill="#e8705a" stroke="#3a1f0e" strokeWidth="1.4" /></svg>
          ))}
          {evt && e.comportement && (
            <div className="evt" style={{ left: droite ? -400 : 175, textAlign: droite ? 'right' : 'left', top: -40 }}>
              <div className="evt-note evt-texte">{texteComportement(e, e.comportement)}</div>
              <div className="evt-btns trois" style={{ justifyContent: droite ? 'flex-end' : 'flex-start' }}>
                {sim.current.reponsesComportement().map((r) => {
                  const couleur = r.cle === 'gronder' || r.cle === 'critiquer' || r.cle === 'prevenir' ? '#9c3b2a' : r.cle === 'rien' ? '#6b4f33' : '#3f7a3a';
                  const icone = r.cle === 'rien' ? IC.rien : couleur === '#9c3b2a' ? IC.croix : IC.coche;
                  return (
                    <button key={r.cle} className="tampon-btn" onClick={() => repondre(r.cle)} aria-label={r.libelle} style={{ color: couleur }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icone} /></svg>
                      <span>{COURT[r.cle]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {flottants.map((f) => (
          <div key={f.id} className={`flotte ${f.long ? 'long' : ''}`} style={{ left: f.x, top: f.y, color: f.couleur }}>{f.texte}</div>
        ))}

        {/* La fiche de l'action ouverte */}
        {ouvert && (
          <div className="r-fiche" style={{ left: ficheX, '--pointe': `${Math.round(centreVerbe - ficheX - 8)}px`, ...(ouvert === 'visiteur' ? { bottom: 'auto', top: 430 } : {}) } as CSSProperties}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 27, lineHeight: 1, color: '#6b4f33' }}>
                {ouvert === 'visiteur' ? `Avec ${visiteur?.nom ?? 'le visiteur'}` : VERBES[iv].titre(nom)}
              </span>
              {sousCategorie && ouvert === 'jouer' && <button className="retour" onClick={() => { son('page', 0.6); setSousCategorie(null); setActif(-1); }}>← retour</button>}
            </div>
            {ouvert === 'echo' ? (
              <>
                <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 4 }}>
                  <div style={{ flex: 'none', width: 96, height: 118, borderRadius: 6, background: 'radial-gradient(circle at 50% 40%,#fff6df,#e8d6b0)', boxShadow: 'inset 0 0 0 1.5px rgba(58,31,14,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={asset(apparence(e))} alt="" style={{ maxHeight: 104, maxWidth: 90, width: 'auto' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {[
                      { nom: 'Stade', valeur: NOM_STADE[e.stade] },
                      { nom: 'Âge', valeur: `${ageJours(e)} jour${ageJours(e) > 1 ? 's' : ''}` },
                      { nom: 'Né d’une', valeur: NOM_GRAINE[e.graine] },
                      { nom: 'Talent', valeur: '???', verrou: true },
                      { nom: 'Souvenir', valeur: '???', verrou: true },
                    ].map((t) => <div key={t.nom} className={`trait ${t.verrou ? 'verrou' : ''}`}><span>{t.nom}</span><b>{t.valeur}</b></div>)}
                  </div>
                </div>
                <div className="phrase">{signes.phrase}</div>
                {signes.besoins.filter((b) => b.besoin !== 'comportement').slice(0, 3).map((b) => <div key={b.besoin} className="indice">{b.indice}</div>)}
                <div style={{ position: 'relative', display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10 }}>
                  {([['feliciter', 'Féliciter', '#3f7a3a', IC.coche], ['gronder', 'Gronder', '#9c3b2a', IC.croix]] as const).map(([k, lib, coul, ic]) => (
                    <button key={k} className="tampon-btn" style={{ color: coul }} aria-label={`${lib} ${nom}`} onClick={() => {
                      const s = sim.current;
                      son('stamp');
                      const r = k === 'feliciter' ? s.feliciter() : s.gronder();
                      if (!r.ok) { flotter(r.raison, COULEUR.note, -150, -20); return; }
                      setOuvert(null);
                      apres({ anim: k === 'feliciter' ? 'saute' : '' });
                      flotter(k === 'feliciter' ? `${nom} bombe le torse.` : `${nom} baisse les oreilles.`, coul, -150, -10);
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ic} /></svg>
                      <span>{lib}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 420, overflowY: 'auto' }}>
                {choix.map((c) => {
                  if (c.rubrique) return <div key={c.cle} className="rubrique">{c.nom}</div>;
                  const i = ++idx;
                  return (
                    <button key={c.cle} className={`choix ${actif === i && !c.off ? 'act' : ''}`} disabled={c.off}
                      onMouseEnter={() => { if (!c.off && actif !== i && !tamponne) { son('paperTick'); setActif(i); } }}
                      onClick={() => { if (!c.prendre) return; if (c.garderOuvert) c.prendre(); else prendre(c.cle, c.prendre); }}>
                      <span className="vign">{c.image ? <img src={c.image} alt="" /> : <Encre d={c.icone ?? IC.mystere} />}</span>
                      <span>{c.nom}</span>
                      <span className="det">{c.detail}</span>
                      {tamponne === c.cle && <svg className="tamp" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16.5" fill="rgba(63,122,58,.08)" stroke="#3f7a3a" strokeWidth="3" /><path d="M12.5 20.5l5 5 10-11" fill="none" stroke="#3f7a3a" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Ceinture : cinq actions. Les anneaux sont un ornement : aucune jauge. */}
        <nav className={`ceinture ${carnet || sacOuvert ? 'repli' : ''}`} aria-label="Actions du ranch">
          {VERBES.map((v, i) => (
            <button key={v.k} className={`verbe ${survol === i ? 'actif' : ''} ${ouvert === v.k ? 'ouvert' : ''}`}
              onMouseEnter={() => { if (survol !== i) setSurvol(i); const t = Date.now(); if (t - (dernierSon.current[i] || 0) > 1000) { dernierSon.current[i] = t; son('paperTick'); } }}
              onMouseLeave={() => setSurvol((s) => (s === i ? -1 : s))} onFocus={() => setSurvol(i)} onBlur={() => setSurvol((s) => (s === i ? -1 : s))}
              onClick={() => {
                const o = ouvert === v.k ? null : v.k;
                son('leather'); setOuvert(o); setActif(-1); setTamponne(null); setSousCategorie(null); setQuitter(false);
                if (o === 'echo') reagir(signes.expression.icone, '');
              }}
              aria-label={`${v.nom} — ${v.info}`} aria-expanded={ouvert === v.k}>
              <span className="info" style={{ color: '#f2c27a' }}>{v.info}</span>
              <span className="medaillon">
                <span className="eclat e1" style={{ left: -4, top: 16 }} />
                <span className="eclat e2" style={{ right: -2, top: 4 }} />
                <span className="eclat e3" style={{ right: 6, bottom: 6, width: 6, height: 6 }} />
                <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
                  <circle cx="42" cy="42" r="40" fill="#5a3119" stroke="#3a1f0e" strokeWidth="2" />
                  <circle cx="42" cy="42" r="36.5" fill="none" stroke="rgba(240,214,170,.55)" strokeWidth="1.4" strokeDasharray="3 3" />
                  <circle className="jauge" cx="42" cy="42" r="30" fill="none" strokeWidth="4.5" strokeDasharray={`${C.toFixed(1)} 0`} style={{ filter: `drop-shadow(0 0 ${m.encre}px rgba(242,194,122,.9))` }} />
                  <circle cx="42" cy="42" r="24" fill="#f4ead6" stroke="#2b2118" strokeWidth="1.8" />
                </svg>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2b2118" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', left: 28, top: 28 }}><path d={IC[v.k]} /></svg>
              </span>
              <span className="nom">{v.nom}</span>
            </button>
          ))}
        </nav>

        {sacOuvert && <Sac etat={e} papier={m.papier} surFermer={fermerSac} surUtiliser={utiliserObjet} son={son} />}

        {carnet && (
          <Carnet etat={e} signes={signes} papier={m.papier} heure={m.heure} son={son} nouvelles={nouvelles}
            surLu={() => setNouvelles(0)} surFermer={() => setCarnet(false)}
            reglages={{ sons, setSons, musique, setMusique, volumeMusique, setVolumeMusique, volumeBruitages, setVolumeBruitages }}
            surSauver={() => sauver(e)}
            surQuitter={() => { sauver(e); surQuitter(); }} />
        )}

        {passage && (
          <div className={`passage ${passage.part ? 'part' : ''} ${passage.bloquant ? 'bloquant' : ''}`}>
            {passage.image && <img src={passage.image} alt="" />}
            <div className="titre">{passage.titre}</div>
            {passage.sous && <div className="sous">{passage.sous}</div>}
            {passage.bloquant && <button className="bouton-cuir" style={{ marginTop: 18 }} onClick={surQuitter}>Revenir au menu</button>}
          </div>
        )}
      </div>
    </div>
  );
}

const CAUSES: Record<string, string> = {
  faim: 'la faim a eu raison de ses forces', blessure: 'une blessure ne s’est jamais refermée', combat: 'au terme d’un combat',
  maladie: 'la maladie a été la plus forte', vieillesse: 'au terme d’une longue vie',
};

/** Zone utile des images qui ont de grandes marges transparentes : [largeur, hauteur, x0, y0, x1, y1]. */
const CADRAGE: Record<string, [number, number, number, number, number, number]> = {
  'activites/ranch/dejection.png': [1024, 1536, 207, 491, 846, 1051],
  'activites/ranch/vomi.png': [384, 384, 11, 184, 382, 322],
};
/** Affiche seulement la zone utile de l'image, ajustée dans l × h. */
function Recadre({ chemin, l, h }: { chemin: string; l: number; h: number }) {
  const c = CADRAGE[chemin];
  if (!c) return <img src={asset(chemin)} alt="" />;
  const [w, H, x0, y0, x1, y1] = c;
  const k = Math.min(l / (x1 - x0), h / (y1 - y0));
  const dx = (l - (x1 - x0) * k) / 2, dy = h - (y1 - y0) * k;
  return (
    <span style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <img src={asset(chemin)} alt="" style={{ position: 'absolute', width: w * k, height: H * k, maxWidth: 'none', left: dx - x0 * k, top: dy - y0 * k }} />
    </span>
  );
}

export function Encre({ d, couleur = '#6e3f22', taille = 22 }: { d: string; couleur?: string; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
  );
}
