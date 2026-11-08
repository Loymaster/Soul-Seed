// Le visiteur au ranch : un écho sauvage qui entre par le bord droit, flâne, s'approche de notre écho pour
// jouer, se disputer, partager ou se reposer, puis repart. Même repère, même sol et même échelle que notre écho
// (src/jeu/ranch/demarche.ts : taille selon le stade, perspective selon la profondeur, pieds sur le sol).
// La logique (relation, ce qu'ils font) vit dans la simulation (src/moteur/simulation/visites.ts) ; ici, la mise en scène.
import { LIEN_RELATION, NOM_STADE, apparence, niveauRelation, type EchoSauvage, type Etat } from '@/moteur/simulation';
import { allureImage, profilEcho, volumePas, type Profil } from './demarche';
import type { Ombre } from '../commun/ombre';

/** Sol du ranch (coin haut-gauche du cadre de l'écho, 150 × 240 ; les pieds sont à +75, +232). */
export const SOL = { xMin: 250, xMax: 980, yMin: 235, yMax: 370 } as const;
/** Perspective : plus petit au fond, plus grand au premier plan (comme notre écho). */
export const perspective = (y: number) => 0.86 + ((y - SOL.yMin) / (SOL.yMax - SOL.yMin)) * 0.28;
/** Bord droit par où l'on entre et sort (entre le buisson et le poteau du premier plan). */
const BORD = { x: 1300, yMin: 290, yMax: 318 };

export type GesteVisite = 'jeu' | 'dispute' | 'partage' | 'repos' | 'temps' | 'bagarre';
/** Quand ils se rejoignent pour un geste, ils accourent : allure de course (multiplie vitesse et cadence des pas). */
export const ALLURE_COURSE = 2.3;
/** Durée de l'annonce (« ! » au-dessus des deux, éclat entre eux) avant que le geste se joue (ms). */
const ANNONCE = 650;

interface Pose {
  s: EchoSauvage;
  x: number; y: number; dur: number; sens: '' | 'gauche';
  marche: boolean; anim: string;
  phase: 'entre' | 'la' | 'part';
  signe: string | null; signeId: number;
  poussiere: boolean;
  /** allure du trajet en cours (1 : il flâne ; ALLURE_COURSE : il accourt) */
  allure: number;
  /** le geste à deux : « ! » au clic au-dessus des deux échos, puis éclat et cadrage sur eux, puis fin */
  duo: Duo | null;
}

interface Duo {
  id: number;
  etape: 'appel' | 'debut' | 'geste' | 'fin';
  /** les « ! » de l'appel, au-dessus de chaque tête (repère 1280 × 800) */
  appels: { x: number; y: number }[];
  /** le point de rencontre (centre du cadrage, éclat au-dessus des têtes) */
  x: number; y: number; haut: number;
}

export interface HoteVisite {
  rafraichir: () => void;
  plusTard: (f: () => void, ms: number) => void;
  /** position (coin du cadre) et destination courante de notre écho */
  echo: () => { x: number; y: number; marche: boolean; taille: number };
  /** notre écho accourt jusqu'à (x, y), puis se tourne (`sens`) et reste là `tenir` ms ; renvoie la durée de sa course (ms) */
  accourir: (x: number, y: number, sens: '' | 'gauche', tenir: number) => number;
  /** notre écho se tourne vers le visiteur (et s'arrête de flâner un moment) */
  tournerEcho: (sens: '' | 'gauche', ms: number) => void;
  /** petite animation de notre écho (« saute », « secoue », « non »…) */
  animerEcho: (anim: string) => void;
  son: (nom: string, ...a: unknown[]) => void;
  asset: (chemin: string) => string;
  /** l'écran est-il pris (carnet, scène, sac…) : on ne met pas en scène */
  occupe: () => boolean;
  /** l'ombre sous ses pieds, d'après la silhouette de son image (src/jeu/commun/ombre.ts) */
  ombre: (chemin: string, profil: Profil, gauche: boolean) => Ombre;
}

/** Facteur de taille propre à chaque visiteur (comme la taille tirée à la naissance), stable d'une visite à l'autre. */
function facteurTaille(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 0.92 + ((h % 1000) / 1000) * 0.16;
}
const hasard = (a: number, b: number) => a + Math.random() * (b - a);
const ICONE_GESTE: Record<GesteVisite, [string, string]> = {
  // [réussi, raté]
  jeu: ['emotions/joyeux.png', 'emotions/boudeur.png'],
  bagarre: ['emotions/fier.png', 'emotions/meprisant.png'],
  dispute: ['emotions/en-colere.png', 'emotions/en-colere.png'],
  partage: ['emotions/affectueux.png', 'emotions/affectueux.png'],
  repos: ['emotions/serein.png', 'emotions/serein.png'],
  temps: ['emotions/serein.png', 'emotions/distant.png'],
};

export class VisiteRanch {
  pose: Pose | null = null;
  private g = 0;
  /** une mise en scène est en cours (le visiteur ne flâne pas) */
  private scene = false;

  constructor(private h: HoteVisite) {}

  /** Il est là, et disponible pour un geste. */
  get libre() { return this.pose?.phase === 'la' && !this.scene; }
  /** L'écran est pris (carnet, scène…) : pas de mise en scène. */
  hoteOccupe() { return this.h.occupe(); }

  profil(s: EchoSauvage, allure = 1): Profil {
    return profilEcho({ stade: s.stade, taille: facteurTaille(s.id), poids: { bebe: 6, enfant: 14, adolescent: 22, adulte: 30 }[s.stade] }, allureImage(apparence({ ...s, evolution: null } as unknown as Etat)), allure);
  }

  /** Le visiteur est déjà là au chargement : il est posé sur le sol, sans entrée. */
  placer(s: EchoSauvage) {
    this.g++;
    this.pose = { s, x: hasard(760, 900), y: hasard(255, 345), dur: 0, sens: 'gauche', marche: false, anim: '', phase: 'la', signe: null, signeId: 0, poussiere: false, allure: 1, duo: null };
    this.h.rafraichir();
    this.h.plusTard(() => this.flaner(), 4000);
  }

  /** Il arrive : il entre par le bord droit et marche jusqu'à un coin du ranch. */
  arriver(s: EchoSauvage) {
    const g = ++this.g;
    this.scene = false;
    const y = hasard(BORD.yMin, BORD.yMax);
    this.pose = { s, x: BORD.x, y, dur: 0, sens: 'gauche', marche: false, anim: '', phase: 'entre', signe: null, signeId: 0, poussiere: false, allure: 1, duo: null };
    this.h.rafraichir();
    // la première destination dépend de la relation : un ami s'approche, un rival reste à distance
    const n = niveauRelation(s);
    const e = this.h.echo();
    const proche = n === 'amitie' || n === 'complicite';
    const loin = n === 'mefiance' || n === 'hostilite';
    const cx = proche ? Math.min(SOL.xMax, e.x + 170) : loin ? hasard(880, 960) : hasard(780, 920);
    const cy = proche ? e.y + hasard(-12, 12) : hasard(260, 340);
    this.h.plusTard(() => { if (this.g === g) this.marcher(cx, cy, () => { if (this.pose) this.pose.phase = 'la'; this.signe(proche ? 'emotions/joyeux.png' : loin ? 'emotions/defensif.png' : 'emotions/surpris.png'); this.h.plusTard(() => this.flaner(), hasard(4000, 7000)); }); }, 60);
  }

  /** Il repart : il marche jusqu'au bord droit et disparaît. */
  partir() {
    const p = this.pose;
    if (!p || p.phase === 'part') return;
    const g = ++this.g;
    this.scene = false;
    p.phase = 'part'; p.anim = ''; p.signe = null; p.duo = null;
    this.marcher(BORD.x + 20, Math.min(BORD.yMax, Math.max(BORD.yMin, p.y)), () => { if (this.g === g) { this.pose = null; this.h.rafraichir(); } });
  }

  /** Marche (ou accourt, `allure` > 1) jusqu'à (x, y), puis `fin` ; renvoie la durée du trajet (ms). */
  private marcher(x: number, y: number, fin?: () => void, allure = 1): number {
    const p = this.pose; if (!p) return 0;
    const g = this.g;
    const prof = this.profil(p.s, allure);
    const d = Math.hypot(x - p.x, y - p.y);
    const dur = Math.max(allure > 1 ? 0.25 : 0.3, d / prof.vitesse);
    p.sens = x < p.x ? 'gauche' : '';
    p.x = Math.round(x); p.y = Math.round(y); p.dur = +dur.toFixed(2); p.marche = true; p.allure = allure;
    this.h.rafraichir();
    // ses pas, plus discrets que ceux de notre écho
    const ms = prof.cycle * 1000;
    const pas = () => { if (this.g !== g || !this.pose?.marche) return; (prof.motif ?? [0]).forEach((o, i) => this.h.plusTard(() => { if (this.g === g && this.pose?.marche) this.h.son('foulee', prof, volumePas(this.pose.y) * 0.55, i); }, o * ms)); };
    for (let t = 0; t < dur * 1000 - 80; t += ms) this.h.plusTard(pas, t + 30);
    this.h.plusTard(() => { if (this.g !== g || !this.pose) return; this.pose.marche = false; this.pose.allure = 1; this.h.rafraichir(); fin?.(); }, dur * 1000);
    return dur * 1000;
  }

  /** Il flâne : quelques pas de temps en temps, plus près de notre écho s'ils s'entendent bien. */
  private flaner() {
    const p = this.pose;
    if (!p || p.phase !== 'la') return;
    const g = this.g;
    if (this.scene || this.h.occupe()) { this.h.plusTard(() => { if (this.g === g) this.flaner(); }, 2500); return; }
    const n = niveauRelation(p.s);
    const e = this.h.echo();
    let x: number, y: number;
    if ((n === 'amitie' || n === 'complicite') && Math.random() < 0.6) { x = e.x + (Math.random() < 0.5 ? -1 : 1) * hasard(130, 190); y = e.y + hasard(-20, 20); }
    else { x = p.x + hasard(-220, 220); y = p.y + hasard(-50, 50); }
    // jamais l'un sur l'autre
    if (Math.abs(x - e.x) < 110 && Math.abs(y - e.y) < 50) x = e.x + (x < e.x ? -130 : 130);
    x = Math.max(SOL.xMin + 20, Math.min(SOL.xMax, x)); y = Math.max(SOL.yMin + 10, Math.min(SOL.yMax - 10, y));
    this.marcher(x, y, () => this.h.plusTard(() => { if (this.g === g) this.flaner(); }, hasard(4500, 9000)));
  }

  /** Une bulle d'émotion au-dessus de sa tête. */
  signe(image: string, ms = 2600) {
    const p = this.pose; if (!p) return;
    const id = ++p.signeId;
    p.signe = this.h.asset(image);
    this.h.son('pop');
    this.h.rafraichir();
    this.h.plusTard(() => { if (this.pose && this.pose.signeId === id) { this.pose.signe = null; this.h.rafraichir(); } }, ms);
  }

  /**
   * Notre écho et le visiteur font quelque chose ensemble (au clic du joueur ou d'eux-mêmes), en quatre temps nets :
   * 1. l'appel : un son tout de suite et un « ! » au-dessus des deux têtes ;
   * 2. ils accourent l'un vers l'autre (allure de course) jusqu'à un point de rencontre entre eux ;
   * 3. l'annonce : ils se font face, un éclat jaillit au-dessus d'eux, le ranch s'assombrit autour (cadrage) ;
   * 4. le geste se joue (bonds, bousculade, partage, repos), puis le cadrage se lève et `fin` (au bout de `duree` ms).
   */
  geste(nature: GesteVisite, reussi: boolean, fin?: () => void, duree = 4200) {
    const p = this.pose;
    if (!p || p.phase !== 'la') { fin?.(); return; }
    const g = ++this.g;
    this.scene = true;
    const e = this.h.echo();
    const tE = e.taille, tV = this.profil(p.s).echelle;
    // l'appel : « ! » au-dessus des deux têtes, là où ils sont
    const tete = (x: number, y: number, t: number) => ({ x: Math.round(x + 75), y: Math.round(y + 232 - 190 * t * perspective(y) - 18) });
    const id = (p.duo?.id ?? 0) + 1;
    p.duo = { id, etape: 'appel', appels: [tete(e.x, e.y, tE), tete(p.x, p.y, tV)], x: 0, y: 0, haut: 0 };
    p.anim = ''; p.signe = null;
    this.h.son('appel');
    // le point de rencontre : à mi-chemin, chacun garde son côté ; l'écart tient compte de leurs tailles
    const aGauche = p.x < e.x; // le visiteur est à gauche de notre écho
    const my = Math.max(SOL.yMin + 10, Math.min(SOL.yMax - 10, (e.y + p.y) / 2));
    const base = 36 + 70 * (tV + tE) * perspective(my);
    const ecart = nature === 'repos' || nature === 'temps' ? base * 0.9 : nature === 'jeu' && !reussi ? base * 1.5 : base;
    const mx = Math.max(SOL.xMin + ecart / 2, Math.min(SOL.xMax - ecart / 2, (e.x + p.x) / 2));
    const xE = mx + (aGauche ? ecart / 2 : -ecart / 2), xV = mx + (aGauche ? -ecart / 2 : ecart / 2);
    const temps = (f: () => void, ms: number) => this.h.plusTard(() => { if (this.g === g && this.pose) f(); }, ms);
    // ils accourent (un court élan après le son, pour que le clic et le départ se lisent l'un après l'autre)
    let arrivee = 0;
    const elan = 260;
    // les « ! » s'effacent d'eux-mêmes (leur animation), puis on les retire
    temps(() => { const q = this.pose!; if (q.duo?.id === id) { q.duo.appels = []; this.h.rafraichir(); } }, 800);
    temps(() => {
      const q = this.pose!;
      const dV = this.marcher(xV, my, undefined, ALLURE_COURSE);
      const dE = this.h.accourir(xE, my, aGauche ? 'gauche' : '', ANNONCE + duree + 600);
      arrivee = Math.max(dV, dE);
      if (q.duo?.id === id) q.duo.etape = 'debut';
      this.h.rafraichir();
      temps(() => this.jouer(nature, reussi, g, id, mx, my, Math.max(tE, tV), duree, fin), arrivee + 80);
    }, elan);
  }

  /** Ils se sont rejoints : l'annonce (éclat, cadrage), le geste, la fin. */
  private jouer(nature: GesteVisite, reussi: boolean, g: number, id: number, mx: number, my: number, t: number, duree: number, fin?: () => void) {
    const q = this.pose; if (!q) return;
    const e = this.h.echo();
    q.sens = q.x < e.x ? '' : 'gauche'; // il regarde notre écho
    q.marche = false; q.allure = 1;
    q.duo = { id, etape: 'geste', appels: q.duo?.id === id ? q.duo.appels : [], x: Math.round(mx + 75), y: Math.round(my + 232), haut: Math.round(my + 232 - 190 * t * perspective(my) - 34) };
    this.h.son('retrouvailles');
    this.h.rafraichir();
    // le geste commence une fois l'annonce passée
    const apres = (f: () => void, ms: number) => this.h.plusTard(() => { if (this.g === g && this.pose) f(); }, ms);
    const temps = (f: () => void, ms: number) => apres(f, ANNONCE + ms);
    const anim = (a: string, ms: number) => temps(() => { q.anim = ''; this.h.rafraichir(); apres(() => { q.anim = a; this.h.rafraichir(); }, 20); }, ms);
    const [ok, rate] = ICONE_GESTE[nature];
    const icone = reussi ? ok : rate;
    // à l'annonce, un petit sursaut des deux : « c'est parti »
    q.anim = ''; apres(() => { q.anim = 'saute'; this.h.rafraichir(); }, 20); this.h.animerEcho('saute');
    if (nature === 'jeu' && reussi) {
      // ils bondissent l'un après l'autre
      [0, 700, 1400, 2100, 2800].forEach((x, i) => (i % 2 ? temps(() => this.h.animerEcho('saute'), x) : anim('saute', x)));
      [0, 1400, 2800].forEach((x) => temps(() => this.h.son('rebond'), x));
      temps(() => this.signe(icone), 900);
    } else if (nature === 'bagarre' && reussi || nature === 'dispute') {
      // bousculade : un petit nuage de poussière entre eux
      temps(() => { q.poussiere = true; this.h.rafraichir(); this.h.son('leather'); }, 100);
      anim('secoue', 150); temps(() => this.h.animerEcho('secoue'), 200);
      anim('secoue', 1600); temps(() => this.h.animerEcho('secoue'), 1650);
      [300, 800, 1800].forEach((x) => temps(() => this.h.son('foulee', this.profil(q.s), 0.9, x % 2), x));
      temps(() => { q.poussiere = false; this.h.rafraichir(); }, 2800);
      temps(() => this.signe(icone), 2900);
    } else if (nature === 'partage' || nature === 'temps' || nature === 'repos') {
      anim(nature === 'repos' ? '' : 'saute', 100);
      temps(() => this.signe(icone, 3000), 400);
      if (nature !== 'repos') temps(() => this.h.animerEcho('flatte'), 1300);
    } else {
      // refus : il détourne la tête
      anim('non', 300);
      temps(() => { q.sens = q.sens === 'gauche' ? '' : 'gauche'; this.h.rafraichir(); }, 700);
      temps(() => this.signe(icone), 900);
    }
    // la fin : le cadrage se lève, chacun reprend sa vie
    temps(() => { if (q.duo?.id === id) q.duo.etape = 'fin'; q.anim = ''; this.h.rafraichir(); }, duree - 500);
    temps(() => {
      if (q.duo?.id === id) q.duo = null;
      this.scene = false; this.h.rafraichir(); fin?.();
      this.h.plusTard(() => { if (this.g === g) this.flaner(); }, hasard(3000, 6000));
    }, duree);
  }

  /** Les valeurs de la vue (le visiteur posé comme notre écho : cadre 150 × 240, échelles, profondeur). */
  valeurs(ouvrir: () => void, ouvert: boolean) {
    const p = this.pose;
    if (!p) return null;
    const prof = this.profil(p.s, p.marche ? p.allure : 1);
    const t = prof.echelle;
    const n = niveauRelation(p.s);
    const d = p.duo;
    const chemin = apparence({ ...p.s, evolution: null } as unknown as Etat);
    return {
      nom: p.s.nom, aria: `${p.s.nom}, écho ${NOM_STADE[p.s.stade]} de passage`,
      image: this.h.asset(chemin), ombre: this.h.ombre(chemin, prof, p.sens === 'gauche'),
      x: p.x, y: p.y, dur: p.dur, sens: p.sens, persp: perspective(p.y).toFixed(3), z: 100 + p.y,
      taille: t.toFixed(3), anim: p.marche ? 'marche' : p.anim, demarche: prof.classes, cycle: prof.cycle.toFixed(3),
      lien: LIEN_RELATION[n], cls: [ouvert ? 'choisi' : '', p.phase === 'part' ? 'part' : ''].join(' '),
      tete: Math.round(232 - 190 * t - 34), teteSigne: Math.round(-30 - (t - 1) * 180),
      signe: p.signe, poussiere: p.poussiere,
      // le geste à deux : « ! » de l'appel, puis éclat et cadrage sur le point de rencontre
      appel1: d?.appels[0] ?? null, appel2: d?.appels[1] ?? null,
      duo: d && d.etape !== 'appel' && d.etape !== 'debut' ? { x: d.x, y: d.y, haut: d.haut, cls: d.etape === 'fin' ? 'fin' : '', cle: d.id } : null,
      ouvrir,
    };
  }
}
