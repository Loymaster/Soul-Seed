// Le combat en temps réel (startCombat, combatTick, ordres, fuite du prototype), sans affichage.
// L'écran appelle `avancer(ms)` à chaque image, lit `etat`, et récupère les événements avec `vider()`.
import type { Caracs, Genre, Graine, Lignee, ResultatEvolution, Stade } from '../simulation/types';
import { CLES_CARACS } from '../simulation/constantes';
import type { Aleatoire, Camp, Combattant, Dispositions, EtatCombat, EvenementCombat, Ordre } from './types';
import {
  ARENE, CENTRE_ARENE, ELAN_MS, ORDRES, PAS_MS, PORTEE_DISTANCE, PORTEE_MELEE, RECHARGE_FUITE, RECHARGE_SOIN,
  RECHARGE_SOIN_ARENE, SEPARATION, TRANCHE_MS,
} from './constantes';
import { TECHNIQUES } from './donnees/techniques';
import { aStatut, faireDurerStatuts, purifier, type Contexte } from './statuts';
import { borne, caracsEffectives, distance, executerTechnique, vitesse } from './resolution';
import { choisirTechnique, choisirTechniqueDistance } from './ia';

/** Ce qu'il faut savoir d'un écho pour le faire combattre. */
export interface DescriptionCombattant {
  nom: string;
  genre: Genre;
  graine: Graine;
  lignee: Lignee;
  stade: Stade;
  evolution?: ResultatEvolution | null;
  ageJours?: number | null;
  caracs: Caracs;
  techniques?: string[];
  /** PV restants d'un combat précédent (null ou absent : pleine forme). */
  pv?: number | null;
  /** Malade : toutes ses caractéristiques sont divisées par 3. */
  malade?: boolean;
  /** Pour l'écho du joueur : lien, humeur, émotions, autonomie. */
  dispositions?: Dispositions | null;
  taille?: number;
}

export interface OptionsCombat {
  rng?: Aleatoire;
  /** Intelligence qui débloque les ordres (par défaut celle du premier allié, hors maladie). */
  intelligenceOrdres?: number;
  /** Mode Arène : nombre de soins disponibles. */
  soinsArene?: number;
}

/** Effet d'un objet de soin utilisé en combat. */
export interface EffetSoin {
  /** Part des PV max rendue (immédiatement, ou sur `dureeMs`). */
  part?: number;
  dureeMs?: number;
  /** Retire les effets négatifs. */
  purifie?: boolean;
}

export type CleOrdre = keyof typeof ORDRES | 'fuirCombat' | 'soin' | 'soinArene';

export interface Disponibilite {
  /** L'intelligence de l'écho permet cet ordre. */
  debloque: boolean;
  /** Utilisable maintenant. */
  pret: boolean;
  /** Part de la recharge qui reste (1 → 0), pour un cadran. */
  recharge: number;
}

const pvMaxDe = (c: Caracs) => Math.max(1, Math.round(c.robustesse * 7));

function creerCombattant(d: DescriptionCombattant, id: string, camp: Camp, x: number, y: number, rng: Aleatoire): Combattant {
  const caracs = { ...d.caracs };
  if (d.malade) for (const k of CLES_CARACS) caracs[k] = (caracs[k] || 0) / 3;
  const pvMax = pvMaxDe(caracs);
  return {
    id, camp, nom: d.nom, genre: d.genre, graine: d.graine, lignee: d.lignee, stade: d.stade,
    evolution: d.evolution ?? null, ageJours: d.ageJours ?? null, caracs,
    pv: d.pv == null ? pvMax : borne(d.pv, 0, pvMax), pvMax,
    jauge: Math.min(1, caracs.agilite / 2000 + rng() * 0.05),
    ko: false, x, y, departX: x, departY: y, regard: camp === 'allies' ? 1 : -1,
    deplacement: 'attente', depuis: 0, cible: null, cibleVerrouillee: null,
    prochainPas: 0, debutAttaque: 0, decalageApproche: 0,
    reculX: x, reculY: y, fuiteX: x, fuiteY: y, finFuite: 0,
    prochainCoupDOeil: rng() * 500, reactionA: 0,
    pousseeJusqua: 0, pousseeDx: 0, pousseeDy: 0, auBordDepuis: 0,
    sonneJusqua: 0, insensibleJusqua: 0, touche: 0, esquiveJusqua: 0, esquiveSens: 1, paradeJusqua: 0, frappeJusqua: 0,
    vieVisibleJusqua: 0,
    techniques: (d.techniques ?? []).filter(n => TECHNIQUES[n]),
    techniqueEnCours: null, techniqueForcee: null, doitFrapper: false,
    statuts: {}, bonus: [], ordre: null, soinObjet: null,
    dispositions: d.dispositions ?? null, taille: d.taille ?? 1,
  };
}

export class Combat {
  private evenements: EvenementCombat[] = [];
  private rng: Aleatoire;

  constructor(public etat: EtatCombat, rng: Aleatoire = Math.random) {
    this.rng = rng;
  }

  /** Un combat qui commence : alliés à gauche, adversaires à droite. */
  static creer(allies: DescriptionCombattant[], adversaires: DescriptionCombattant[], o: OptionsCombat = {}): Combat {
    const rng = o.rng ?? Math.random;
    const place = (cote: number) => ({
      x: borne(cote + (rng() * 12 - 6), ARENE.xMin, ARENE.xMax),
      y: borne(72 + (rng() * 20 - 10), ARENE.yMin, ARENE.yMax),
    });
    const a = allies.map((d, i) => { const p = place(16); return creerCombattant(d, 'allie' + (i + 1), 'allies', p.x, p.y, rng); });
    const b = adversaires.map((d, i) => { const p = place(84); return creerCombattant(d, 'adversaire' + (i + 1), 'adversaires', p.x, p.y, rng); });
    return new Combat({
      t: 0, allies: a, adversaires: b, resultat: null, tirs: [], incantations: [], recharges: {},
      intelligenceOrdres: o.intelligenceOrdres ?? allies[0]?.caracs.intelligence ?? 0,
      soinsArene: o.soinsArene ?? 0, prochainId: 1,
    }, rng);
  }

  get termine() { return this.etat.resultat !== null; }
  get tous() { return [...this.etat.allies, ...this.etat.adversaires]; }
  combattant(id: string) { return this.tous.find(c => c.id === id) ?? null; }

  /** Récupère (et vide) les événements survenus depuis le dernier appel. */
  vider(): EvenementCombat[] { const e = this.evenements; this.evenements = []; return e; }
  private emettre = (e: EvenementCombat) => { this.evenements.push(e); };
  private get ctx(): Contexte { return { t: this.etat.t, rng: this.rng, emettre: this.emettre }; }

  /** Fait avancer le combat de `ms` millisecondes (découpées en tranches de 50 ms au plus). */
  avancer(ms: number) {
    let reste = Math.max(0, ms);
    while (reste > 0 && !this.termine) {
      const dt = Math.min(TRANCHE_MS, reste);
      this.tranche(dt);
      reste -= dt;
    }
  }

  private opposants(c: Combattant) { return c.camp === 'allies' ? this.etat.adversaires : this.etat.allies; }

  private tranche(dtMs: number) {
    const e = this.etat;
    e.t += dtMs;
    const t = e.t;
    const ctx = this.ctx;
    const tous = this.tous;
    for (const c of tous) {
      c.bonus = c.bonus.filter(b => b.fin > t);
      if (c.ordre && c.ordre.fin <= t) c.ordre = null;
    }
    // Soins d'objets dans la durée.
    for (const c of e.allies) {
      const s = c.soinObjet;
      if (!s || c.ko) continue;
      const ecoule = Math.max(0, Math.min(t, s.fin) - s.dernier) / 1000;
      c.pv = Math.min(c.pvMax, c.pv + (ecoule / ((s.fin - s.debut) / 1000)) * s.total * c.pvMax);
      c.vieVisibleJusqua = t + 2000;
      if (t >= s.fin) c.soinObjet = null; else s.dernier = t;
    }
    // Tirs : les dégâts tombent à l'arrivée, pas au lancer.
    e.incantations = e.incantations.filter(i => t < i.fin);
    const enVol = [];
    for (const tir of e.tirs) {
      if (t < tir.arrivee) { enVol.push(tir); continue; }
      const a = this.combattant(tir.lanceur);
      const c = this.combattant(tir.cible);
      if (a && c && !a.ko && !c.ko) executerTechnique(ctx, a, c, this.opposants(a), tir.technique);
    }
    e.tirs = enVol;

    for (const c of tous) {
      if (c.ko) continue;
      faireDurerStatuts(ctx, c, dtMs / 1000);
      if (c.ko) continue;
      const avant = c.deplacement;
      this.agir(c, tous, dtMs / 1000);
      if (c.deplacement !== avant) c.depuis = t;
    }

    if (!e.resultat) {
      if (e.adversaires.every(c => c.ko)) e.resultat = 'victoire';
      else if (e.allies.every(c => c.ko)) e.resultat = 'defaite';
      if (e.resultat) this.emettre({ type: 'fin', resultat: e.resultat });
    }
  }

  private plusProche(c: Combattant, l: Combattant[]) {
    let mieux: Combattant | null = null;
    for (const o of l) if (!mieux || distance(c, o) < distance(c, mieux)) mieux = o;
    return mieux;
  }

  private portee(c: Combattant) {
    const f = c.techniqueEnCours ? TECHNIQUES[c.techniqueEnCours] : undefined;
    return f?.distance ? PORTEE_DISTANCE : PORTEE_MELEE;
  }

  /** Un pas « saccadé » vers (tx, ty), en évitant un peu les autres et les bords. */
  private pas(c: Combattant, tx: number, ty: number, longueur: number, autres: Combattant[]) {
    const dx = tx - c.x, dy = ty - c.y;
    const d = Math.hypot(dx, dy) || 0.001;
    // Vers le fond, les pas raccourcissent (profondeur).
    const profondeur = dy < 0 ? borne(0.45 + ((c.y - ARENE.yMin) / (ARENE.yMax - ARENE.yMin)) * 0.55, 0.45, 1) : 1;
    const l = Math.min(d, longueur * profondeur);
    let nx = c.x + (dx / d) * l;
    let ny = c.y + (dy / d) * l;
    for (const o of autres) {
      if (o.ko) continue;
      const s = Math.hypot(nx - o.x, ny - o.y);
      if (s < SEPARATION && s > 0.001) {
        nx += ((nx - o.x) / s) * (SEPARATION - s);
        ny += ((ny - o.y) / s) * (SEPARATION - s);
      }
    }
    // Légère répulsion des quatre bords.
    const marge = 16;
    if (nx - ARENE.xMin < marge) nx += (marge - (nx - ARENE.xMin)) * 0.5;
    if (ARENE.xMax - nx < marge) nx -= (marge - (ARENE.xMax - nx)) * 0.5;
    if (ny - ARENE.yMin < marge) ny += (marge - (ny - ARENE.yMin)) * 0.5;
    if (ARENE.yMax - ny < marge) ny -= (marge - (ARENE.yMax - ny)) * 0.5;
    c.x = borne(nx, ARENE.xMin, ARENE.xMax);
    c.y = borne(ny, ARENE.yMin, ARENE.yMax);
  }

  private reculer(c: Combattant, x: number, y: number) {
    c.deplacement = 'recul';
    c.reculX = borne(x, ARENE.xMin, ARENE.xMax);
    c.reculY = borne(y, ARENE.yMin, ARENE.yMax);
  }

  private partirAttaquer(c: Combattant, cible: Combattant, technique: string | null) {
    c.cible = cible.id;
    c.decalageApproche = this.rng() * 12 - 6;
    c.deplacement = 'approche';
    c.techniqueEnCours = technique;
  }

  private agir(c: Combattant, tous: Combattant[], dt: number) {
    const { t } = this.etat;
    const rng = this.rng;
    const sonne = c.sonneJusqua > t || aStatut(c, 'etourdissement', t);
    const opposants = this.opposants(c);
    const autres = tous.filter(o => o.id !== c.id);
    const vivants = opposants.filter(o => !o.ko);

    // La jauge se remplit à l'arrêt (ou en fuite), d'autant plus vite que l'écho est agile.
    if (!sonne) {
      const remplissage = Math.max(0.4, 4.2 - caracsEffectives(c, t).agilite / 250);
      if (c.deplacement === 'attente' || c.deplacement === 'fuite') c.jauge = Math.min(1, c.jauge + dt / remplissage);
    }
    if (sonne) return;

    // Garde-fou : jamais coincé contre un bord.
    const m = 5;
    const bordX = c.x <= ARENE.xMin + m || c.x >= ARENE.xMax - m;
    const bordY = c.y <= ARENE.yMin + m || c.y >= ARENE.yMax - m;
    if (bordX || bordY) { if (!c.auBordDepuis) c.auBordDepuis = t || 1; } else c.auBordDepuis = 0;
    if (c.auBordDepuis && t - c.auBordDepuis >= 3000) {
      if (t - c.auBordDepuis >= 5000) {
        // Filet de sécurité : retour au centre.
        c.x = CENTRE_ARENE.x; c.y = CENTRE_ARENE.y;
        c.auBordDepuis = 0; c.deplacement = 'attente'; c.cible = null;
      } else if (t >= c.prochainPas) {
        this.pas(c, CENTRE_ARENE.x, CENTRE_ARENE.y, (6 + (c.caracs.agilite || 0) / 55) * 1.6, autres);
        c.prochainPas = t + PAS_MS;
        if (c.deplacement === 'recul' || c.deplacement === 'fuite') c.deplacement = 'attente';
      }
      return;
    }
    if ((bordX || bordY) && !(c.pousseeJusqua > t)) {
      c.pousseeJusqua = t + PAS_MS * 4;
      if (bordX) { c.pousseeDx = (c.x < 50 ? 1 : -1) * 0.4; c.pousseeDy = c.y < CENTRE_ARENE.y ? 1 : -1; }
      else { c.pousseeDx = c.x < 50 ? 1 : -1; c.pousseeDy = 0; }
      if (c.deplacement === 'recul' || c.deplacement === 'fuite') c.deplacement = 'attente';
    }
    if (c.pousseeJusqua > t && t >= c.prochainPas) {
      this.pas(c, borne(c.x + c.pousseeDx * 16, ARENE.xMin, ARENE.xMax), borne(c.y + c.pousseeDy * 16, ARENE.yMin, ARENE.yMax), vitesse(c, t), autres);
      c.prochainPas = t + PAS_MS;
      return;
    }

    switch (c.deplacement) {
      case 'approche': {
        const cible = c.cible ? this.combattant(c.cible) : null;
        if (!cible || cible.ko || t - c.depuis > 8000) {
          if (cible?.ko && c.cibleVerrouillee === cible.id) c.cibleVerrouillee = null;
          c.cible = null;
          const sens = c.x >= c.departX ? 1 : -1;
          this.reculer(c, c.x + sens * (6 + rng() * 6), c.y + (rng() * 10 - 5));
        } else if (distance(c, cible) <= this.portee(c)) {
          c.regard = cible.x >= c.x ? 1 : -1;
          c.deplacement = 'attaque';
          c.debutAttaque = t;
        } else if (t >= c.prochainPas) {
          c.regard = cible.x >= c.x ? 1 : -1;
          this.pas(c, cible.x, cible.y + c.decalageApproche, vitesse(c, t), autres);
          c.prochainPas = t + PAS_MS;
        }
        break;
      }
      case 'attaque': {
        if (t - c.debutAttaque < ELAN_MS) break;
        const cible = c.cible ? this.combattant(c.cible) : null;
        const nom = c.techniqueEnCours;
        c.techniqueEnCours = null;
        c.jauge = 0;
        c.cible = null;
        if (!cible || cible.ko || distance(c, cible) > (nom && TECHNIQUES[nom]?.distance ? PORTEE_DISTANCE : PORTEE_MELEE) * 1.5) {
          // Frappé dans le vide : la jauge se vide quand même.
          c.deplacement = 'attente';
          break;
        }
        const f = nom ? TECHNIQUES[nom] : undefined;
        if (nom) this.emettre({ type: 'technique', lanceur: c.id, technique: nom });
        if (nom && f?.distance && !f.sansDegats) {
          const d = distance(c, cible);
          const tir = {
            id: this.etat.prochainId++, lanceur: c.id, cible: cible.id, technique: nom,
            depart: t, arrivee: t + Math.min(700, Math.max(220, d * 9)), deX: c.x, deY: c.y, versX: cible.x, versY: cible.y,
          };
          this.etat.tirs.push(tir);
          this.emettre({ type: 'tir', tir });
        } else {
          if (f?.sansDegats) {
            const visent = (f.aLancer ?? []).some(x => x.cible === 'adversaire');
            this.etat.incantations.push({ id: this.etat.prochainId++, lanceur: c.id, cible: visent ? cible.id : null, fin: t + 700 });
          }
          executerTechnique(this.ctx, c, cible, opposants, nom);
        }
        const sens = c.x >= cible.x ? 1 : -1;
        this.reculer(c, c.x + sens * (6 + rng() * 6), c.y + (rng() * 10 - 5));
        break;
      }
      case 'recul': {
        if (t >= c.prochainPas) {
          this.pas(c, c.reculX, c.reculY, vitesse(c, t), autres);
          c.prochainPas = t + PAS_MS;
        }
        if (Math.hypot(c.x - c.reculX, c.y - c.reculY) < 3 || t - c.depuis > 1500) c.deplacement = 'attente';
        break;
      }
      case 'fuite': {
        if (t >= c.prochainPas) {
          this.pas(c, c.fuiteX, c.fuiteY, vitesse(c, t), autres);
          c.prochainPas = t + PAS_MS;
        }
        if (t >= c.finFuite) c.deplacement = 'attente';
        break;
      }
      default:
        this.attendre(c, vivants, autres);
    }
  }

  /** À l'arrêt : partir à l'attaque, obéir à un ordre, ou se replacer. */
  private attendre(c: Combattant, vivants: Combattant[], autres: Combattant[]) {
    const { t } = this.etat;
    const rng = this.rng;
    const ordre = c.ordre?.type ?? null;
    const proche = this.plusProche(c, vivants);
    if (ordre === 'fuit' || aStatut(c, 'terreur', t)) {
      // Garder ses distances (3 × la portée), sans attaquer.
      if (proche && t >= c.prochainPas) {
        if (distance(c, proche) < PORTEE_MELEE * 3) {
          this.pas(c, borne(c.x + (c.x >= proche.x ? 1 : -1) * 16, ARENE.xMin, ARENE.xMax), c.y, vitesse(c, t), autres);
        }
        c.prochainPas = t + PAS_MS;
      }
      return;
    }
    if (ordre === 'distance') {
      if (c.jauge < 1) {
        if (proche && t >= c.prochainPas) {
          if (distance(c, proche) < PORTEE_DISTANCE) {
            this.pas(c, borne(c.x + (c.x >= proche.x ? 1 : -1) * 12, ARENE.xMin, ARENE.xMax), c.y, vitesse(c, t), autres);
          }
          c.prochainPas = t + PAS_MS;
        }
      } else if (vivants.length) {
        const cible = vivants[Math.floor(rng() * vivants.length)];
        this.partirAttaquer(c, cible, choisirTechniqueDistance(c, cible, t, rng));
        const f = c.techniqueEnCours ? TECHNIQUES[c.techniqueEnCours] : undefined;
        if (!f?.distance) c.ordre = null;
      }
      return;
    }
    if (c.jauge >= 1 && vivants.length) {
      const verrou = c.cibleVerrouillee ? vivants.find(o => o.id === c.cibleVerrouillee) : undefined;
      const cible = verrou ?? vivants[Math.floor(rng() * vivants.length)];
      this.partirAttaquer(c, cible, choisirTechnique(c, cible, t, rng));
      return;
    }
    if (ordre === 'attaque') {
      // Toujours au contact, jamais en fuite.
      if (proche && t >= c.prochainPas) {
        if (distance(c, proche) > PORTEE_MELEE * 0.9) this.pas(c, proche.x, proche.y, vitesse(c, t), autres);
        c.prochainPas = t + PAS_MS;
      }
      return;
    }
    if (t < c.prochainCoupDOeil || t < c.reactionA) return;
    c.prochainCoupDOeil = t + 700;
    const ouverture = t < 3500;
    const presDuBord = c.x < ARENE.xMin + 18 || c.x > ARENE.xMax - 18;
    if (presDuBord && rng() < 0.7) {
      // Acculé : revenir vers le centre.
      this.reculer(c, c.x + (c.x < 50 ? 1 : -1) * (10 + rng() * 10), c.y + (rng() * 10 - 5));
    } else if (proche && rng() < 0.012) {
      // Fuite ponctuelle, rare.
      c.deplacement = 'fuite';
      c.finFuite = t + 900 + rng() * 500;
      c.fuiteX = borne(c.x + (c.x >= proche.x ? 1 : -1) * (6 + rng() * 6), ARENE.xMin, ARENE.xMax);
      c.fuiteY = borne(c.y + (rng() * 12 - 6), ARENE.yMin, ARENE.yMax);
      proche.reactionA = t + 500;
    } else if (proche && ouverture && rng() < 0.35) {
      // Début de combat : on se jauge.
      const d = distance(c, proche);
      const vers = proche.x >= c.x ? 1 : -1;
      const sens = d > PORTEE_MELEE * 1.6 ? 1 : d < PORTEE_MELEE * 1.1 ? -1 : rng() < 0.5 ? 1 : -1;
      this.reculer(c, c.x + vers * sens * (5 + rng() * 5), c.y + (rng() * 10 - 5));
      proche.reactionA = t + 500;
    } else if (proche && rng() < 0.12) {
      // Se replacer un peu plus près ou plus loin.
      const d = distance(c, proche);
      const sens = d > PORTEE_MELEE * 2.2 ? 1 : d < PORTEE_MELEE * 1.1 ? -1 : rng() < 0.5 ? 1 : -1;
      const vers = proche.x >= c.x ? 1 : -1;
      this.reculer(c, c.x + vers * sens * (6 + rng() * 6), c.y + (rng() * 12 - 6));
      proche.reactionA = t + 500;
    } else if (rng() < 0.1) {
      // Feinte : un pas en avant ou en arrière.
      const sens = rng() < 0.5 ? 1 : -1;
      const vers = proche ? (proche.x >= c.x ? 1 : -1) : 1;
      this.reculer(c, c.x + vers * sens * 4, c.y);
    }
  }

  // ————————————————————————————————————————— ordres du joueur

  disponibilite(cle: CleOrdre, technique?: string): Disponibilite {
    const e = this.etat;
    const cleRecharge = cle === 'technique' ? 'technique:' + (technique ?? '') : cle;
    const total = cle === 'fuirCombat' ? RECHARGE_FUITE : cle === 'soin' ? RECHARGE_SOIN : cle === 'soinArene' ? RECHARGE_SOIN_ARENE : ORDRES[cle].recharge;
    const fin = e.recharges[cleRecharge] ?? 0;
    const restant = Math.max(0, fin - e.t);
    let debloque = true;
    if (cle in ORDRES) debloque = cle === 'cible'
      ? e.allies.some(a => !a.ko && a.caracs.intelligence >= ORDRES.cible.intelligence)
      : e.intelligenceOrdres >= ORDRES[cle as keyof typeof ORDRES].intelligence;
    if (cle === 'soinArene') debloque = e.soinsArene > 0;
    return { debloque, pret: debloque && !this.termine && restant <= 0, recharge: Math.min(1, restant / total) };
  }

  private armer(cle: string, ms: number) { this.etat.recharges[cle] = this.etat.t + ms; }

  /** Un nouvel ordre annule l'effet de l'ordre précédent (mais pas sa recharge). */
  private annulerOrdres() {
    for (const c of this.etat.allies) { c.bonus = []; c.ordre = null; }
  }

  /** « Encourager » : +5 % en force, agilité, endurance et perception pendant 10 s. */
  encourager(): boolean {
    if (!this.disponibilite('encourager').pret) return false;
    this.annulerOrdres();
    const fin = this.etat.t + ORDRES.encourager.duree;
    for (const c of this.etat.allies) c.bonus = [{ caracs: ['force', 'agilite', 'endurance', 'perception'], part: 0.05, fin }];
    this.armer('encourager', ORDRES.encourager.recharge);
    return true;
  }

  /** « Attaque » (+20 % aux coups, toujours au contact), « Fuis », « Protège-toi » (+25 % de parade), « Reste à distance ». */
  ordonner(ordre: Ordre): boolean {
    if (!this.disponibilite(ordre).pret) return false;
    this.annulerOrdres();
    const r = ORDRES[ordre];
    for (const c of this.etat.allies) {
      c.ordre = { type: ordre, fin: this.etat.t + r.duree };
      if (ordre === 'attaque' && c.deplacement === 'fuite') c.deplacement = 'attente';
      if ((ordre === 'fuit' || ordre === 'distance') && (c.deplacement === 'approche' || c.deplacement === 'attaque')) {
        c.deplacement = 'attente';
        c.cible = null;
      }
    }
    this.armer(ordre, r.recharge);
    return true;
  }

  /** Impose la prochaine technique (500 d'intelligence). */
  forcerTechnique(nom: string): boolean {
    if (!this.disponibilite('technique', nom).pret) return false;
    const allies = this.etat.allies.filter(c => c.techniques.includes(nom));
    if (!allies.length) return false;
    for (const c of allies) c.techniqueForcee = nom;
    this.armer('technique:' + nom, ORDRES.technique.recharge);
    return true;
  }

  /** Combats à plusieurs : verrouille la cible des alliés assez intelligents, puis passe à l'adversaire suivant. */
  changerCible(): boolean {
    if (!this.disponibilite('cible').pret) return false;
    const vivants = this.etat.adversaires.filter(o => !o.ko);
    const eligibles = this.etat.allies.filter(a => !a.ko && a.caracs.intelligence >= ORDRES.cible.intelligence);
    if (!vivants.length || !eligibles.length) return false;
    const actuel = eligibles[0].cibleVerrouillee;
    const i = ((actuel ? vivants.findIndex(o => o.id === actuel) : -1) + 1) % vivants.length;
    for (const a of eligibles) {
      a.cible = vivants[i].id;
      a.cibleVerrouillee = vivants[i].id;
      if (a.deplacement === 'fuite') a.deplacement = 'attente';
    }
    this.armer('cible', ORDRES.cible.recharge);
    return true;
  }

  /** Tenter de quitter le combat : 70 % si l'écho est plus agile que son adversaire, 30 % sinon. */
  fuir(): 'reussie' | 'ratee' | 'impossible' {
    if (!this.disponibilite('fuirCombat').pret) return 'impossible';
    const a = this.etat.allies[0];
    const b = this.etat.adversaires[0];
    if (!a || !b) return 'impossible';
    this.armer('fuirCombat', RECHARGE_FUITE);
    if (this.rng() < ((a.caracs.agilite || 0) > (b.caracs.agilite || 0) ? 0.7 : 0.3)) {
      this.etat.resultat = 'fuite';
      this.emettre({ type: 'fin', resultat: 'fuite' });
      return 'reussie';
    }
    return 'ratee';
  }

  /** Objet de soin sur l'écho du joueur (l'inventaire est géré par le jeu). Recharge : 30 s. */
  soigner(effet: EffetSoin): boolean {
    const a = this.etat.allies[0];
    if (!a || a.ko || !this.disponibilite('soin').pret) return false;
    const t = this.etat.t;
    if (effet.purifie) purifier(a);
    else if (effet.dureeMs) a.soinObjet = { debut: t, fin: t + effet.dureeMs, dernier: t, total: effet.part ?? 0 };
    else a.pv = Math.min(a.pvMax, a.pv + a.pvMax * (effet.part ?? 0));
    a.vieVisibleJusqua = t + 2000;
    this.emettre({ type: 'soin', cible: a.id });
    this.armer('soin', RECHARGE_SOIN);
    return true;
  }

  /** Mode Arène : +30 % de vie, en nombre limité. */
  soinArene(): boolean {
    const a = this.etat.allies[0];
    if (!a || a.ko || !this.disponibilite('soinArene').pret) return false;
    a.pv = Math.min(a.pvMax, a.pv + a.pvMax * 0.3);
    a.vieVisibleJusqua = this.etat.t + 2000;
    this.etat.soinsArene--;
    this.emettre({ type: 'soin', cible: a.id });
    this.armer('soinArene', RECHARGE_SOIN_ARENE);
    return true;
  }

  /** PV de l'écho du joueur à reporter dans sa partie après le combat. */
  pvRestants() {
    const a = this.etat.allies[0];
    return a ? Math.max(0, Math.round(a.pv * 10) / 10) : null;
  }
}
