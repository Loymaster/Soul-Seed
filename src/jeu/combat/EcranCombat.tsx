// Écran de combat (portage des maquettes « Combat » du canevas), branché sur le moteur src/moteur/combat.
// Trois registres : exploration (combats courants, forêt, entraînement), magie sainte (arène, combats importants),
// magie corrompue (boss). Rien ne bouge avant « Commencer le combat » ; aucun chiffre n'est montré.
import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import {
  Combat, SOINS_COMBAT, TECHNIQUES, lireSignesCombat, type CategorieTechnique, type Combattant, type DescriptionCombattant,
  type EvenementCombat, type Resultat, type Statut,
} from '@/moteur/combat';
import { accord, apparence, descriptionObjet, type Etat } from '@/moteur/simulation';
import { useMusique } from '../commun/musique';
import { Repere } from '../commun/Repere';
import { SonsCombat } from './sons';
import './combat.css';

export type Registre = 'exploration' | 'sainte' | 'corrompue';

export interface AdversaireCombat {
  description: DescriptionCombattant;
  /** Image de l'adversaire (chemin dans public/assets). */
  image: string;
  /** Taille relative à l'écran (un boss est plus grand). */
  taille?: number;
  /** Boss : la phrase qui refuse la fuite. */
  sansFuite?: string;
}

export interface IssueCombat {
  resultat: Resultat;
  /** PV restants de l'écho (à garder jusqu'au prochain sommeil). */
  pv: number | null;
  /** Objets du sac utilisés pendant le combat (un identifiant par objet). */
  objetsUtilises: string[];
}

export interface ProprietesCombat {
  echo: Etat;
  /** Description de l'écho du joueur en combat (descriptionDepuisEtat). */
  allie: DescriptionCombattant;
  adversaire: AdversaireCombat;
  registre: Registre;
  /** Fond (chemin dans public/assets). */
  terrain: string;
  musique?: boolean;
  /** Autres adversaires du même combat (Phil et Hibert se battent à deux). */
  renforts?: AdversaireCombat[];
  /** Piste du combat (public/assets/sons/musiques) au lieu de celle du registre (ex. « combat-garry »). */
  piste?: string;
  surFin: (issue: IssueCombat) => void;
}

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
const W = 1280, H = 800, Y0 = 46, Y1 = 94;
const echelleY = (y: number) => 0.8 + ((y - Y0) / (Y1 - Y0)) * 0.5;
const px = (c: { x: number; y: number }) => ({ x: (c.x / 100) * W, y: (c.y / 100) * H });

const ICONE_STATUT: Record<Statut, [string, string]> = {
  saignement: ['saignement', 'Saignement'], empoisonnement: ['empoisonnement', 'Empoisonnement'], terreur: ['terreur', 'Terreur'],
  brulure: ['brulure', 'Brûlure'], ralentissement: ['ralentissement', 'Ralentissement'], etourdissement: ['etourdissement', 'Étourdissement'],
  protection: ['protection', 'Protection'], rapidite: ['rapidite', 'Rapidité'], regeneration: ['regeneration', 'Régénération'],
  immunite: ['immunite', 'Immunité'], renvoiDegats: ['renvoi', 'Renvoi'],
};
const iconeStatut = (s: string) => asset(`interface/statuts/${(ICONE_STATUT as Record<string, [string, string]>)[s]?.[0] ?? s}.png`);
const COULEUR_CAT: Record<CategorieTechnique, string> = {
  physique: '#ffe2b0', spectral: '#b78cff', poison: '#8fe05a', aquatique: '#6cc8ff',
  incendiaire: '#ff8a3a', malefique: '#c05cff', lumineux: '#fff1a0', ethere: '#9ff0ff',
};
const iconeCat = (c: CategorieTechnique) => asset(`interface/techniques/${c}.png`);
const ORDRES_UI = [
  { cle: 'encourager', lib: 'Encourager', icone: 'vasy', aide: 'Un peu plus fort, un peu plus vif', cri: (n: string) => `Courage, ${n} !` },
  { cle: 'attaque', lib: 'Attaque !', icone: 'attaque', aide: 'Toujours au contact, frappe plus fort', cri: () => 'Vas-y, fonce !' },
  { cle: 'fuit', lib: 'Recule !', icone: 'fuit', aide: 'Garde ses distances, n’attaque plus', cri: (n: string) => `Recule, ${n} !` },
  { cle: 'protege', lib: 'Défends-toi !', icone: 'protege', aide: 'Pare plus souvent', cri: () => 'Protège-toi !' },
  { cle: 'distance', lib: 'Reste à distance !', icone: 'reste-distance', aide: 'Préfère les techniques à distance', cri: () => 'Tiens-le à distance !' },
] as const;
const ALLURE = {
  vaillant: ['vaillant', 'vaillante'], entame: ['entamé', 'entamée'], eprouve: ['éprouvé', 'éprouvée'],
  chancelant: ['chancelant', 'chancelante'], ko: ['à terre', 'à terre'],
} as const;
/** Les combats se jouent toujours deux fois plus vite que le temps du moteur (réglage fixe, sans contrôle). */
const VITESSE = 2;

interface Effet { cls: string; x: number; y: number; t?: number; dx?: number; src?: string; fin: number; halo?: { id: string; c: string } }
interface Etiquette { nom: string; icone: string; x: number; y: number; fin: number }
interface Particule { x: number; y: number; t: number; d: number; dx: number; c: string; delai: number }

export function EcranCombat({ echo, allie, adversaire, registre, terrain, musique = true, renforts = [], piste, surFin }: ProprietesCombat) {
  const CORROMPU = registre === 'corrompue', EXPLO = registre === 'exploration';
  const nom = echo.nom;
  const a = (m: string, f: string) => accord(echo, m, f);
  const combat = useRef<Combat | null>(null);
  const enFace = [adversaire, ...renforts];
  if (!combat.current) combat.current = Combat.creer([allie], enFace.map((x) => x.description));
  const C = combat.current;
  /** L'adversaire (image, taille) d'un combattant d'en face, d'après son rang (« adversaire1 », « adversaire2 »…). */
  const nomsEnFace = C.etat.adversaires.map((c) => c.nom).join(' et ');
  const adversaireDe = (c: Combattant) => enFace[Math.max(0, (parseInt(c.id.replace(/\D/g, ''), 10) || 1) - 1)] ?? adversaire;
  const [, rafraichir] = useReducer((x: number) => (x + 1) % 1e6, 0);
  const [phase, setPhase] = useState<'attente' | 'intro' | 'combat' | 'fin'>('attente');
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const [menu, setMenu] = useState<null | 'tech' | 'sac'>(null);
  const [banniere, setBanniere] = useState<string | null>(null);
  const [toast, setToast] = useState<{ texte: string; cle: number } | null>(null);
  const [fin, setFin] = useState<{ titre: string; lignes: string[] } | null>(null);
  const secoue = useRef(0);
  const effets = useRef<Effet[]>([]);
  const etiquettes = useRef<Etiquette[]>([]);
  const utilises = useRef<string[]>([]);
  const minuteurs = useRef<number[]>([]);
  const plus = (ms: number, f: () => void) => { minuteurs.current.push(window.setTimeout(f, ms)); };
  useEffect(() => () => { minuteurs.current.forEach(clearTimeout); }, []);
  useEffect(() => { SonsCombat.grave(CORROMPU); }, [CORROMPU]);
  useMusique(piste ?? (CORROMPU ? 'morthen' : 'combat'), { volume: 0.38, active: musique && phase !== 'attente', montee: 1500 });

  // Particules : elles montent (magie sainte), tombent (corruption) ou dérivent au vent (exploration).
  const [particules] = useState<Particule[]>(() => {
    const couleurs = CORROMPU ? ['#b45cff', '#6b2f8f', '#c77dff', '#3a0f1f'] : EXPLO ? ['#9aa84e', '#c9a14a', '#6f7d3a', '#e2cf8a'] : ['#a8dcff', '#ffd27a', '#ffffff', '#ffb86b'];
    return Array.from({ length: CORROMPU ? 34 : EXPLO ? 18 : 26 }, (_, i) => ({
      y: Math.round(120 + Math.random() * 560), x: Math.round(Math.random() * 1280),
      t: (CORROMPU ? 3 : 2) + Math.round(Math.random() * 3), d: Math.round((CORROMPU ? 7 : 9) + Math.random() * 8),
      dx: Math.round(Math.random() * 120 - 60), c: couleurs[i % couleurs.length], delai: -Math.round(Math.random() * 16),
    }));
  });

  const hautDe = (c: Combattant) => {
    const base = c.camp === 'allies' ? 226 * (TAILLES[c.stade] / TAILLES.enfant) : 216 * (TAILLES[c.stade] / TAILLES.enfant) * (adversaireDe(c).taille ?? 1);
    return base * echelleY(c.y);
  };

  const dire = (texte: string) => {
    setToast({ texte, cle: Date.now() });
    plus(2200, () => setToast((t) => (t && t.texte === texte ? null : t)));
  };

  const terminer = (resultat: Resultat) => {
    const x = C.etat.allies[0], b = { nom: nomsEnFace };
    const pl = (un: string, plusieurs: string) => (enFace.length > 1 ? plusieurs : un);
    const part = x.pv / x.pvMax;
    const f = CORROMPU ? (resultat === 'victoire'
      ? { titre: 'La corruption reflue', lignes: [`${b.nom} ${pl('se délite', 'se délitent')} en une fumée violette.`, part > 0.4 ? `${nom} reste debout, les yeux brillants.` : `${nom} vacille, mais la lumière lui revient.`] }
      : resultat === 'defaite'
        ? { titre: 'Les ténèbres l’emportent', lignes: [`${b.nom} ${pl('se referme', 'se referment')} sur le silence.`, `${nom} gît, très ${a('pâle', 'pâle')}. Il faut ${a('le', 'la')} ramener au ranch au plus vite.`] }
        : { titre: 'Vous battez en retraite', lignes: [`${nom} vous suit sans se retourner.`] })
      : resultat === 'victoire'
        ? { titre: `${nom} l’emporte !`, lignes: [`${b.nom} ${pl('détale', 'détalent')} dans les fourrés.`, part > 0.6 ? `${a('Il', 'Elle')} bombe le torse, à peine ${a('essoufflé', 'essoufflée')}.` : part > 0.25 ? `${a('Il', 'Elle')} souffle fort, mais ${a('il', 'elle')} a l’air ${a('fier', 'fière')}.` : `${a('Il', 'Elle')} tient à peine debout… mais ${a('il', 'elle')} a gagné.`] }
        : resultat === 'defaite'
          ? { titre: `${nom} s’effondre…`, lignes: [`${b.nom} ${pl('s’éloigne', 's’éloignent')} sans se retourner.`, `Il faudra ${a('le', 'la')} ramener au ranch et ${a('le', 'la')} laisser se reposer.`] }
          : { titre: 'Vous battez en retraite', lignes: [`${nom} vous suit en jetant des regards en arrière.`, `${a('Il', 'Elle')} n’a pas l’air d’avoir tout compris.`] };
    plus(resultat === 'fuite' ? 300 : 1400, () => {
      if (resultat === 'victoire') SonsCombat.victoire(); else SonsCombat.defaite();
      setMenu(null); setFin(f); setPhase('fin');
    });
  };

  const traiter = (evts: EvenementCombat[], now: number) => {
    for (const ev of evts) {
      if (ev.type === 'coup') {
        const c = C.combattant(ev.cible); if (!c) continue;
        const p = px(c), h = hautDe(c);
        effets.current.push({ cls: ev.pare ? 'cbEclat pare' : 'cbEclat', x: p.x, y: p.y - h * 0.5, t: ev.critique ? 190 : ev.pare ? 110 : 130, fin: now + 450 });
        if (ev.pare) SonsCombat.pare(); else SonsCombat.coup(ev.critique);
        if (ev.critique) secoue.current = now;
      } else if (ev.type === 'esquive') {
        const c = C.combattant(ev.cible); if (!c) continue;
        const p = px(c);
        effets.current.push({ cls: 'cbSouffle', x: p.x, y: p.y - hautDe(c) * 0.45, dx: (c.esquiveSens || 1) * 40, fin: now + 460 });
        SonsCombat.esquive();
      } else if (ev.type === 'technique') {
        const c = C.combattant(ev.lanceur), f = TECHNIQUES[ev.technique]; if (!c || !f) continue;
        const p = px(c);
        etiquettes.current.push({ nom: ev.technique, icone: iconeCat(f.categorie), x: p.x, y: p.y - hautDe(c) - 18, fin: now + 1600 });
        SonsCombat.technique();
        if (f.sansDegats) effets.current.push({ cls: 'halo', x: 0, y: 0, fin: now + 700, halo: { id: c.id, c: COULEUR_CAT[f.categorie] } });
      } else if (ev.type === 'tir') {
        SonsCombat.tir();
      } else if (ev.type === 'statut') {
        const c = C.combattant(ev.cible); if (!c || !(ev.statut in ICONE_STATUT)) continue;
        const p = px(c);
        effets.current.push({ cls: 'cbPop', src: iconeStatut(ev.statut), x: p.x + 30, y: p.y - hautDe(c) * 0.9, fin: now + 900 });
        SonsCombat.statut();
      } else if (ev.type === 'soin') {
        const c = C.combattant(ev.cible); if (!c) continue;
        const p = px(c);
        effets.current.push({ cls: 'soin', x: p.x, y: p.y, fin: now + 1000 });
        SonsCombat.soin();
      } else if (ev.type === 'ko') {
        const c = C.combattant(ev.cible); if (!c) continue;
        const p = px(c);
        effets.current.push({ cls: 'cbPoussiere', x: p.x, y: p.y, fin: now + 1100 });
        SonsCombat.ko();
      } else if (ev.type === 'fin') {
        terminer(ev.resultat);
      }
    }
  };
  const traiterRef = useRef(traiter); traiterRef.current = traiter;

  // ——— la boucle : le moteur avance au rythme de l'affichage
  useEffect(() => {
    let raf = 0, dernier = 0;
    const boucle = (now: number) => {
      const dt = Math.min(100, now - (dernier || now));
      dernier = now;
      if (phaseRef.current === 'combat' && !C.termine) {
        C.avancer(dt * VITESSE);
        traiterRef.current(C.vider(), now);
      }
      effets.current = effets.current.filter((x) => x.fin > now);
      etiquettes.current = etiquettes.current.filter((x) => x.fin > now);
      rafraichir();
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [C]);

  const lancer = () => {
    if (phase !== 'attente') return;
    SonsCombat.eveiller(); SonsCombat.ordre();
    const adv = { nom: nomsEnFace };
    setPhase('intro');
    setBanniere(CORROMPU ? `${adv.nom} se dresse` : `${adv.nom} surgit !`);
    plus(1500, () => setBanniere(CORROMPU ? `Tiens bon, ${nom}` : 'En garde !'));
    plus(2700, () => { setBanniere(null); setPhase('combat'); });
  };

  const sortir = () => {
    const r = C.etat.resultat;
    if (!r) return;
    surFin({ resultat: r, pv: C.pvRestants(), objetsUtilises: utilises.current });
  };

  // ——— rendu
  const now = performance.now();
  const t = C.etat.t;
  const x0 = C.etat.allies[0];
  const enCombat = phase === 'combat' && !C.termine;
  const coulElan = CORROMPU ? '199,125,255' : EXPLO ? '236,178,84' : '190,228,255';

  const plaque = (c: Combattant) => {
    const s = lireSignesCombat(c, t);
    const v = s.vie;
    const couleur = CORROMPU
      ? (c.camp === 'allies' ? (v > 0.5 ? '#e6d2ff' : v > 0.2 ? '#c77dff' : '#ff5a8a') : (v > 0.3 ? '#b45cff' : '#ff3d6e'))
      : EXPLO ? (v > 0.5 ? '#8fae4a' : v > 0.2 ? '#d9a441' : '#c4502e')
        : (v > 0.5 ? '#dff2ff' : v > 0.2 ? '#ffd27a' : '#ffb86b');
    return { nom: c.nom, allure: ALLURE[s.allure][c.genre === 'f' ? 1 : 0], fil: Math.round(v * 1000) / 10, couleur };
  };
  // à plusieurs, la plaque suit celui d'en face qui tient encore debout
  const pa = plaque(x0), pb = plaque(C.etat.adversaires.find((c) => !c.ko) ?? C.etat.adversaires[0]);

  // Objets de soin présents dans le sac de l'écho (moins ceux déjà utilisés pendant ce combat).
  const sac = Object.keys(SOINS_COMBAT).map((id) => {
    const total = echo.inventaire.filter((c) => c?.id === id).reduce((s, c) => s + (c?.qte ?? 0), 0);
    const reste = total - utilises.current.filter((u) => u === id).length;
    const d = descriptionObjet(id);
    return { id, reste, nom: d?.nom ?? SOINS_COMBAT[id].nom, icone: d ? asset(d.icone) : '', desc: d?.description ?? '' };
  }).filter((o) => o.reste > 0);

  const dSoin = C.disponibilite('soin');
  const dFuite = C.disponibilite('fuirCombat');
  const dTech = C.disponibilite('technique', x0.techniques[0]);
  const nePasComprendre = `${nom} ne comprend pas encore cet ordre`;

  return (
    <Repere fond="#000">
      <div className={`cb ${registre}`} onPointerDown={() => SonsCombat.eveiller()}>
        <div className="cb-fond" style={{ backgroundImage: `url(${asset(terrain)})`, filter: CORROMPU ? 'saturate(.35) brightness(.5) contrast(1.15) hue-rotate(-18deg)' : EXPLO ? 'saturate(.9) brightness(.92) sepia(.12)' : 'saturate(.85) brightness(.9) hue-rotate(-6deg)' }} />
        <div className="cb-sol" />
        <div className="cb-voile" />
        <div className="cb-ambiance" />
        {particules.map((m, i) => (
          <div key={i} className="mote" style={{ left: m.x, '--y': `${m.y}px`, '--t': `${m.t}px`, '--d': `${m.d}s`, '--dx': `${m.dx}px`, '--c': m.c, animationDelay: `${m.delai}s` } as CSSProperties} />
        ))}

        <div className={`cb-scene ${now - secoue.current < 330 ? 'secoue' : ''}`}>
          {C.tous.map((c, i) => {
            const s = lireSignesCombat(c, t);
            const p = px(c), k = echelleY(c.y), h = hautDe(c);
            const classes = ['p-' + s.posture];
            if (c.touche - t > 350) classes.push('touche');
            const elan = Math.round(c.jauge * 360);
            const garde = c.paradeJusqua > t || c.ordre?.type === 'protege';
            const image = c.camp === 'allies' ? asset(cheminEcho(echo)) : asset(adversaireDe(c).image);
            return (
              <div key={c.id} className={`ec ${c.camp !== 'allies' && CORROMPU ? 'boss' : ''}`} style={{ left: Math.round(p.x), top: Math.round(p.y), zIndex: Math.round(c.y * 10) }}>
                <div className="ec-ombre" style={{ width: Math.round(160 * k), height: Math.round(38 * k) }} />
                {!c.ko && c.camp === 'allies' && (
                  <div className="ec-elan" style={{ width: Math.round(176 * k), height: Math.round(48 * k), background: `conic-gradient(rgba(${coulElan},.95) ${elan}deg, rgba(${coulElan},.12) 0)` }} />
                )}
                <div className={`ec-corps ${classes.join(' ')}`} style={{ height: Math.round(h), '--dir': c.regard, '--sens': c.esquiveSens || 1 } as CSSProperties}>
                  <div className="ec-respire" style={{ animationDelay: `${-i * 0.9}s` }}>
                    <div className="ec-pose"><img src={image} alt={c.nom} style={{ transform: `translateX(-50%) scaleX(${c.regard})` }} /></div>
                  </div>
                </div>
                {garde && <div className="ec-garde" style={{ width: Math.round(h * 0.62), height: Math.round(h * 0.95) }} />}
                <div className="orbite" style={{ top: -Math.round(h * 0.55) }}>
                  {s.statuts.map((x, j) => (
                    <div key={x.statut} className={`st ${x.positif ? 'pos' : 'neg'}`} style={{ '--r': `${52 * k + 10}px`, animationDelay: `${-(j * 6) / Math.max(1, s.statuts.length)}s` } as CSSProperties}>
                      <img src={iconeStatut(x.statut)} alt={ICONE_STATUT[x.statut][1]} title={ICONE_STATUT[x.statut][1]} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {effets.current.filter((x) => x.halo).map((x, i) => {
            const c = C.combattant(x.halo!.id); if (!c) return null;
            const p = px(c), h = hautDe(c);
            return <div key={'h' + i} className="cbHalo" style={{ left: p.x, top: p.y - h * 0.5, width: Math.round(h * 1.1), height: Math.round(h * 1.1), '--c': x.halo!.c } as CSSProperties} />;
          })}
          {C.etat.tirs.map((tir) => {
            const f = TECHNIQUES[tir.technique];
            const la = C.combattant(tir.lanceur), lb = C.combattant(tir.cible);
            const u = Math.max(0, Math.min(1, (t - tir.depart) / (tir.arrivee - tir.depart)));
            const ha = la ? hautDe(la) * 0.55 : 100, hb = lb ? hautDe(lb) * 0.5 : 100;
            const xa = (tir.deX / 100) * W, ya = (tir.deY / 100) * H - ha;
            const xb = ((lb ? lb.x : tir.versX) / 100) * W, yb = ((lb ? lb.y : tir.versY) / 100) * H - hb;
            const x = xa + (xb - xa) * u, y = ya + (yb - ya) * u - Math.sin(u * Math.PI) * 60;
            const ang = (Math.atan2((yb - ya) - Math.cos(u * Math.PI) * 60 * Math.PI, xb - xa) * 180) / Math.PI;
            return <div key={tir.id} className="tir" style={{ left: Math.round(x), top: Math.round(y), '--c': COULEUR_CAT[f ? f.categorie : 'physique'], '--a': `${Math.round(ang)}deg` } as CSSProperties} />;
          })}
          {effets.current.filter((x) => !x.halo).map((x, i) => (
            <div key={'e' + i + x.fin} className={x.cls} style={{ left: Math.round(x.x), top: Math.round(x.y), '--t': `${x.t ?? 0}px`, '--dx': `${x.dx ?? 0}px`, zIndex: 900 } as CSSProperties}>
              {x.src && <img src={x.src} alt="" />}
            </div>
          ))}
          {etiquettes.current.map((x) => (
            <div key={x.nom + x.fin} className="etiq" style={{ left: Math.round(x.x), top: Math.round(x.y), zIndex: 950 }}><img src={x.icone} alt="" /><span>{x.nom}</span></div>
          ))}
        </div>

        <div className="plaque g">
          <div className="pl-nom">{pa.nom}</div>
          <div className="pl-allure">{pa.allure}</div>
          <div className="pl-fil"><i style={{ width: `${pa.fil}%`, background: pa.couleur, '--lueur': pa.couleur } as CSSProperties} /></div>
        </div>
        <div className={`plaque d ${CORROMPU ? 'boss' : ''}`}>
          <div className="pl-nom">{pb.nom}</div>
          <div className="pl-allure">{pb.allure}</div>
          <div className="pl-fil"><i style={{ width: `${pb.fil}%`, background: pb.couleur, '--lueur': pb.couleur } as CSSProperties} /></div>
        </div>

        {enCombat && (
          <>
            <div className="sangle">
              {ORDRES_UI.map((o) => {
                const d = C.disponibilite(o.cle);
                const actif = o.cle === 'encourager' ? x0.bonus.length > 0 : x0.ordre?.type === o.cle;
                const cls = !d.debloque ? 'verrou' : actif ? 'actif attend' : !d.pret ? 'attend' : '';
                return (
                  <button key={o.cle} className={`ordre ${cls}`} aria-label={o.lib} onClick={() => {
                    if (!d.debloque || !d.pret) { SonsCombat.refus(); return; }
                    const ok = o.cle === 'encourager' ? C.encourager() : C.ordonner(o.cle);
                    if (ok) { SonsCombat.ordre(); dire(o.cri(nom)); }
                  }}>
                    <img src={asset(`interface/ordres/${o.icone}.png`)} alt="" />
                    <span className="rech" style={{ '--deg': `${Math.round(d.recharge * 360)}deg` } as CSSProperties} />
                    <span className="lib">{o.lib}<em>{!d.debloque ? nePasComprendre : d.pret ? o.aide : `${nom} reprend son souffle…`}</em></span>
                  </button>
                );
              })}
              <span className="sep" />
              {x0.techniques.length > 0 && (
                <button className={`ordre ${!dTech.debloque ? 'verrou' : menu === 'tech' ? 'actif' : ''}`} aria-label="Techniques" onClick={() => {
                  if (!dTech.debloque) { SonsCombat.refus(); return; }
                  setMenu(menu === 'tech' ? null : 'tech');
                }}>
                  <span className="rond"><img src={iconeCat(TECHNIQUES[x0.techniques[0]]?.categorie ?? 'physique')} alt="" /></span>
                  <span className="lib">Techniques<em>{dTech.debloque ? 'Lui souffler une technique' : nePasComprendre}</em></span>
                </button>
              )}
              <button className={`ordre ${menu === 'sac' ? 'actif' : dSoin.pret && sac.length ? '' : 'attend'}`} aria-label="Soins" onClick={() => {
                if (!dSoin.pret || !sac.length) { SonsCombat.refus(); if (!sac.length) dire('Rien pour soigner dans le sac.'); return; }
                setMenu(menu === 'sac' ? null : 'sac');
              }}>
                <span className="rond"><img src={asset('objets/divers/feuille-vie.png')} alt="" /></span>
                <span className="rech" style={{ '--deg': `${Math.round(dSoin.recharge * 360)}deg`, borderRadius: '50%' } as CSSProperties} />
                <span className="lib">Soins<em>{!sac.length ? 'Le sac n’a rien pour soigner' : dSoin.pret ? 'Un objet du sac' : 'Pas tout de suite…'}</em></span>
              </button>
              <span className="sep" />
              {adversaire.sansFuite ? (
                <button className="ordre verrou" aria-label="Fuir le combat" onClick={() => { SonsCombat.refus(); dire(adversaire.sansFuite!); }}>
                  <img src={asset('interface/ordres/fuir-combat.png')} alt="" />
                  <span className="lib">Fuir le combat<em>{adversaire.sansFuite}</em></span>
                </button>
              ) : (
                <button className={`ordre ${dFuite.pret ? '' : 'attend'}`} aria-label="Fuir le combat" onClick={() => {
                  const r = C.fuir();
                  if (r === 'ratee') { SonsCombat.refus(); dire('Impossible de s’échapper !'); }
                  else if (r === 'reussie') { SonsCombat.esquive(); traiter(C.vider(), performance.now()); }
                }}>
                  <img src={asset('interface/ordres/fuir-combat.png')} alt="" />
                  <span className="rech" style={{ '--deg': `${Math.round(dFuite.recharge * 360)}deg` } as CSSProperties} />
                  <span className="lib">Fuir le combat<em>{dFuite.pret ? 'Tenter de s’échapper' : 'Pas encore…'}</em></span>
                </button>
              )}
            </div>
            {menu === 'tech' && (
              <div className="cbEventail" style={{ left: 430 }}>
                {x0.techniques.map((n) => {
                  const f = TECHNIQUES[n]; const d = C.disponibilite('technique', n);
                  return (
                    <button key={n} className={`carte ${d.pret ? '' : 'attend'}`} onClick={() => {
                      if (!d.pret) { SonsCombat.refus(); return; }
                      if (C.forcerTechnique(n)) { SonsCombat.ordre(); dire(`${n}, ${nom} !`); setMenu(null); }
                    }}>
                      <img src={iconeCat(f.categorie)} alt="" /><b>{n}</b><small>{f.description}</small>
                    </button>
                  );
                })}
              </div>
            )}
            {menu === 'sac' && (
              <div className="cbEventail" style={{ left: 560 }}>
                {sac.map((o) => (
                  <button key={o.id} className="carte" style={{ width: 128 }} onClick={() => {
                    if (C.soigner(SOINS_COMBAT[o.id].effet)) {
                      utilises.current.push(o.id); setMenu(null);
                      dire(o.id === 'pierre_incantatoire' ? `${nom} se sent plus ${a('léger', 'légère')}.` : `${nom} reprend des forces.`);
                    }
                  }}>
                    <img src={o.icone} alt="" /><span className="qte">× {o.reste}</span><b>{o.nom}</b><small>{o.desc}</small>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {phase === 'attente' && (
          <div className="depart">
            <div className="depart-titre">{CORROMPU ? `${nomsEnFace} vous attend` : EXPLO ? `${nomsEnFace} vous ${enFace.length > 1 ? 'barrent' : 'barre'} le chemin` : `${nomsEnFace} ${enFace.length > 1 ? 'relèvent' : 'relève'} le défi`}</div>
            <button className="btn-depart" onClick={lancer}>Commencer le combat</button>
          </div>
        )}
        {banniere && <div key={banniere} className="banniere">{banniere}</div>}
        {toast && <div key={toast.cle} className="toast">{toast.texte}</div>}
        {fin && (
          <>
            <div className="fin-voile" />
            <div className="fin-note" onClick={sortir} role="button" tabIndex={0} onKeyDown={(ev) => { if (ev.key === 'Enter') sortir(); }}>
              <div className="fn-titre">{fin.titre}</div>
              {fin.lignes.map((l) => <div key={l} className="fn-ligne">{l}</div>)}
              <div className="fn-suite">cliquer pour continuer</div>
            </div>
          </>
        )}
      </div>
    </Repere>
  );
}

const TAILLES = { bebe: 0.45, enfant: 0.675, adolescent: 0.9, adulte: 1.035 } as const;
const cheminEcho = (e: Etat) => apparence(e);
