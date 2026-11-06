import { describe, expect, it } from 'vitest';
import {
  CATEGORIES_TECHNIQUE, Combat, PORTEE_MELEE, SOINS_COMBAT, TECHNIQUES, ajouterStatut, apprendreTechniques, bilanCombat,
  descriptionDepuisEtat, faireDurerStatuts, lireSignesCombat, poolTechniques, resoudreAttaque, techniquesAdversaire,
  type DescriptionCombattant, type EvenementCombat,
} from '../src/moteur/combat';
import * as donnees from '../src/moteur/combat/donnees/techniques';
import { Simulation, aleatoireFixe, creerEcho, type Caracs } from '../src/moteur/simulation';

const caracs = (v: number, autres: Partial<Caracs> = {}): Caracs =>
  ({ force: v, agilite: v, endurance: v, robustesse: v, intelligence: v, perception: v, ...autres });

const echo = (nom: string, c: Caracs, o: Partial<DescriptionCombattant> = {}): DescriptionCombattant =>
  ({ nom, genre: 'm', graine: 'wrath', lignee: 'primaire', stade: 'enfant', caracs: c, ...o });

/** Mène un combat à son terme (ou s'arrête après `maxS` secondes). */
function jusquAuBout(c: Combat, maxS = 300) {
  const evts: EvenementCombat[] = [];
  for (let i = 0; i < maxS * 60 && !c.termine; i++) { c.avancer(1000 / 60); evts.push(...c.vider()); }
  return evts;
}

/** Un générateur qui rend toujours la même valeur (pour suivre une formule pas à pas). */
const constant = (v: number) => () => v;

describe('données des techniques', () => {
  it('reprend les 64 techniques du prototype, 8 par catégorie, chacune décrite', () => {
    expect(Object.keys(TECHNIQUES)).toHaveLength(64);
    for (const { cle } of CATEGORIES_TECHNIQUE) {
      expect(Object.values(TECHNIQUES).filter(f => f.categorie === cle)).toHaveLength(8);
    }
    for (const f of Object.values(TECHNIQUES)) expect(f.description.length).toBeGreaterThan(10);
  });

  it('ne cite dans les pools que des techniques qui existent', () => {
    const pools = [donnees.POOL_ENFANT, donnees.POOL_ADOLESCENT, donnees.POOL_FRAGMENT, donnees.POOL_BRANCHE,
      donnees.POOL_ADULTE, donnees.POOL_BRANCHE_ADULTE, donnees.POOL_MELEE, donnees.POOL_MEMOIRE];
    for (const p of pools) for (const l of Object.values(p)) for (const n of l) expect(TECHNIQUES[n], n).toBeDefined();
  });

  it('associe les objets de soin à leur effet', () => {
    expect(SOINS_COMBAT.feuille_vie.effet.part).toBe(0.3);
    expect(SOINS_COMBAT.pierre_incantatoire.effet.purifie).toBe(true);
  });
});

describe('pools et apprentissage', () => {
  it('choisit le pool selon le stade, la lignée et l’évolution', () => {
    expect(poolTechniques({ stade: 'bebe', graine: 'joy', lignee: 'primaire', evolution: null })).toEqual([]);
    expect(poolTechniques({ stade: 'enfant', graine: 'joy', lignee: 'primaire', evolution: null })).toEqual(['Second souffle', 'Rayon sacré']);
    expect(poolTechniques({ stade: 'enfant', graine: 'fear', lignee: 'sombre', evolution: null })).toEqual(donnees.POOL_ENFANT.DF);
    expect(poolTechniques({ stade: 'enfant', graine: 'fear', lignee: 'neutre-sombre', evolution: null })).toEqual(donnees.POOL_ENFANT.DN);
    expect(poolTechniques({ stade: 'adolescent', graine: 'joy', lignee: 'primaire', evolution: { genre: 'fragment', code: 'C+' } })).toEqual(donnees.POOL_FRAGMENT['C+']);
    expect(poolTechniques({ stade: 'adolescent', graine: 'joy', lignee: 'primaire', evolution: { genre: 'branche', code: 'J-DD' } })).toEqual(donnees.POOL_BRANCHE['J-DD']);
    // Dans le jeu du prototype, un adulte garde les techniques de son adolescence ; les pools adultes sont en option.
    const adulte = { stade: 'adulte' as const, graine: 'wrath' as const, lignee: 'primaire' as const, evolution: { genre: 'melee' as const, code: 'JWF' } };
    expect(poolTechniques(adulte)).toEqual(donnees.POOL_ADOLESCENT.W);
    expect(poolTechniques(adulte, { poolsAdultes: true })).toEqual(donnees.POOL_MELEE.JWF);
  });

  it('apprend une technique par seuil d’intelligence franchi, une seule fois', () => {
    const pool = donnees.POOL_ADOLESCENT.J;
    const r = apprendreTechniques(400, [], [], pool, aleatoireFixe(1));
    expect(r.seuilsPasses).toEqual([150, 350]);
    expect(r.apprises).toHaveLength(2);
    expect(new Set(r.apprises).size).toBe(2);
    const r2 = apprendreTechniques(400, r.seuilsPasses, r.connues, pool, aleatoireFixe(2));
    expect(r2.apprises).toEqual([]);
  });

  it('donne 2 techniques à un adversaire enfant, 3 ensuite, sans doublon', () => {
    const rng = aleatoireFixe(5);
    expect(techniquesAdversaire(donnees.POOL_ENFANT.W, 'enfant', rng)).toHaveLength(2);
    const t = techniquesAdversaire(donnees.POOL_ADOLESCENT.W, 'adolescent', rng);
    expect(t).toHaveLength(3);
    expect(new Set(t).size).toBe(3);
    expect(techniquesAdversaire(donnees.POOL_ADOLESCENT.W, 'bebe', rng)).toEqual([]);
  });
});

describe('résolution d’un coup', () => {
  it('suit la formule du prototype : force, résistance, perçage', () => {
    const c = Combat.creer([echo('A', caracs(60, { force: 100 }))], [echo('B', caracs(60))], { rng: aleatoireFixe(1) });
    const [a] = c.etat.allies;
    const [b] = c.etat.adversaires;
    const ctx = { t: 0, rng: constant(0.5), emettre: () => {} };
    // 0,5 : ni critique, ni esquive, ni parade ; coup = force (100), résistance = min(max(60/2, 15), 50) = 30.
    expect(resoudreAttaque(ctx, a, b).degats).toBe(70);
    // Perçage de 50 % : résistance 15.
    expect(resoudreAttaque({ ...ctx, t: 5000 }, a, b, { percage: 0.5 }).degats).toBe(85);
    expect(b.pvMax).toBe(420);
    expect(b.pv).toBe(420 - 70 - 85);
  });

  it('amplifie le coup de 15 % par brûlure, puis consume la brûlure', () => {
    const c = Combat.creer([echo('A', caracs(60, { force: 100 }))], [echo('B', caracs(60))], { rng: aleatoireFixe(1) });
    const [a] = c.etat.allies;
    const [b] = c.etat.adversaires;
    const ctx = { t: 0, rng: constant(0.5), emettre: () => {} };
    ajouterStatut(ctx, b, 'brulure', undefined, { cumuls: 2 });
    expect(b.statuts.brulure?.cumuls).toBe(2);
    expect(resoudreAttaque(ctx, a, b).degats).toBe(91); // 70 × 1,3
    expect(b.statuts.brulure).toBeUndefined();
  });

  it('bloque les statuts négatifs sous Immunité', () => {
    const c = Combat.creer([echo('A', caracs(60))], [echo('B', caracs(60))], { rng: aleatoireFixe(1) });
    const [b] = c.etat.adversaires;
    const ctx = { t: 0, rng: constant(0.5), emettre: () => {} };
    ajouterStatut(ctx, b, 'immunite', 10);
    expect(ajouterStatut(ctx, b, 'empoisonnement')).toBe(false);
    expect(ajouterStatut(ctx, b, 'rapidite', 10)).toBe(true);
  });

  it('fait saigner (0,5 % des PV max par seconde) pendant 20 s', () => {
    const c = Combat.creer([echo('A', caracs(60))], [echo('B', caracs(60))], { rng: aleatoireFixe(1) });
    const [b] = c.etat.adversaires;
    const ctx = { t: 0, rng: constant(0.99), emettre: () => {} };
    ajouterStatut(ctx, b, 'saignement');
    for (let t = 100; t <= 10000; t += 100) faireDurerStatuts({ ...ctx, t }, b, 0.1);
    expect(b.pv).toBeCloseTo(420 - 420 * 0.005 * 10, 5);
    faireDurerStatuts({ ...ctx, t: 20001 }, b, 0.1);
    expect(b.statuts.saignement).toBeUndefined();
  });
});

describe('combat', () => {
  it('est déterministe avec un générateur fixe', () => {
    const lancer = () => {
      const c = Combat.creer([echo('A', caracs(120))], [echo('B', caracs(110), { techniques: ['Coup brutal'] })], { rng: aleatoireFixe(42) });
      jusquAuBout(c);
      return [c.etat.resultat, c.etat.t, c.etat.allies[0].pv, c.etat.adversaires[0].pv];
    };
    expect(lancer()).toEqual(lancer());
  });

  it('se termine, et le plus fort l’emporte presque toujours', () => {
    let victoires = 0;
    for (let g = 1; g <= 20; g++) {
      const c = Combat.creer(
        [echo('Fort', caracs(250), { techniques: ['Poing incandescent', 'Coup brutal'] })],
        [echo('Faible', caracs(70), { graine: 'joy', techniques: ['Second souffle', 'Rayon sacré'] })],
        { rng: aleatoireFixe(g) },
      );
      const evts = jusquAuBout(c);
      expect(c.termine).toBe(true);
      expect(evts.at(-1)).toEqual({ type: 'fin', resultat: c.etat.resultat });
      if (c.etat.resultat === 'victoire') victoires++;
      // Personne ne sort de l'arène.
      for (const x of c.tous) {
        expect(x.x).toBeGreaterThanOrEqual(8); expect(x.x).toBeLessThanOrEqual(92);
        expect(x.y).toBeGreaterThanOrEqual(46); expect(x.y).toBeLessThanOrEqual(94);
      }
    }
    expect(victoires).toBeGreaterThanOrEqual(18);
  });

  it('utilise des techniques, à distance par des tirs qui arrivent plus tard', () => {
    let tirs = 0, techniques = 0;
    for (let g = 1; g <= 5; g++) {
      const c = Combat.creer(
        [echo('A', caracs(150, { intelligence: 700 }), { techniques: ['Boule de feu', 'Rayon sacré'] })],
        [echo('B', caracs(150))], { rng: aleatoireFixe(g) },
      );
      const evts = jusquAuBout(c);
      tirs += evts.filter(e => e.type === 'tir').length;
      techniques += evts.filter(e => e.type === 'technique').length;
      for (const e of evts) if (e.type === 'tir') expect(e.tir.arrivee - e.tir.depart).toBeGreaterThanOrEqual(220);
    }
    expect(techniques).toBeGreaterThan(0);
    expect(tirs).toBeGreaterThan(0);
  });

  it('commence avec les PV restants et divise les caractéristiques d’un écho malade', () => {
    const c = Combat.creer([echo('A', caracs(90), { pv: 100, malade: true })], [echo('B', caracs(60))], { rng: aleatoireFixe(1) });
    const [a] = c.etat.allies;
    expect(a.caracs.force).toBe(30);
    expect(a.pvMax).toBe(210);
    expect(a.pv).toBe(100);
  });
});

describe('ordres du joueur', () => {
  it('dépendent de l’intelligence et se rechargent', () => {
    const c = Combat.creer([echo('A', caracs(60, { intelligence: 250 }))], [echo('B', caracs(60))], { rng: aleatoireFixe(1) });
    expect(c.encourager()).toBe(true);
    expect(c.encourager()).toBe(false); // en recharge
    expect(c.disponibilite('encourager').recharge).toBe(1);
    expect(c.ordonner('attaque')).toBe(true);
    expect(c.ordonner('fuit')).toBe(true);
    expect(c.ordonner('protege')).toBe(false); // 300 d'intelligence
    expect(c.disponibilite('protege').debloque).toBe(false);
    // Le nouvel ordre a annulé l'encouragement et l'ordre d'attaque.
    expect(c.etat.allies[0].bonus).toEqual([]);
    expect(c.etat.allies[0].ordre?.type).toBe('fuit');
    c.avancer(20000);
    if (!c.termine) expect(c.encourager()).toBe(true);
  });

  it('sous l’ordre « Fuis », l’écho garde ses distances', () => {
    const c = Combat.creer([echo('A', caracs(60, { intelligence: 250 }))], [echo('B', caracs(1, { robustesse: 200 }))], { rng: aleatoireFixe(3) });
    c.ordonner('fuit');
    const coupsDonnes = () => 0;
    let coups = coupsDonnes();
    for (let i = 0; i < 9 * 20; i++) { c.avancer(50); coups += c.vider().filter(e => e.type === 'coup' && e.lanceur === 'allie1').length; }
    expect(coups).toBe(0);
    expect(Math.abs(c.etat.allies[0].x - c.etat.adversaires[0].x)).toBeGreaterThan(PORTEE_MELEE);
  });

  it('fuir réussit à 70 % si l’écho est plus agile, 30 % sinon', () => {
    const rapide = Combat.creer([echo('A', caracs(60, { agilite: 200 }))], [echo('B', caracs(60))], { rng: constant(0.5) });
    expect(rapide.fuir()).toBe('reussie');
    expect(rapide.etat.resultat).toBe('fuite');
    const lent = Combat.creer([echo('A', caracs(60))], [echo('B', caracs(60, { agilite: 200 }))], { rng: constant(0.5) });
    expect(lent.fuir()).toBe('ratee');
    expect(lent.fuir()).toBe('impossible'); // recharge de 10 s
  });

  it('soigne avec un objet, puis attend 30 s', () => {
    const c = Combat.creer([echo('A', caracs(60), { pv: 100 })], [echo('B', caracs(60))], { rng: aleatoireFixe(1) });
    expect(c.soigner(SOINS_COMBAT.feuille_vie.effet)).toBe(true);
    expect(c.etat.allies[0].pv).toBeCloseTo(100 + 420 * 0.3);
    expect(c.soigner(SOINS_COMBAT.feuille_vie.effet)).toBe(false);
  });
});

describe('après le combat', () => {
  it('fait progresser l’écho : +1 partout, davantage après une victoire', () => {
    const avant = caracs(100, { force: 150, agilite: 50 });
    const d = bilanCombat('defaite', avant, { stade: 'enfant', lignee: 'primaire', ageJours: 4 }, 20, constant(0.9));
    expect(Object.values(d.progres)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(d.or).toBe(0);
    expect(d.blessure).toBe(false); // 0,9 > 1/3
    const v = bilanCombat('victoire', avant, { stade: 'adolescent', lignee: 'sombre', ageJours: 7, branche: true }, 200, constant(0));
    // Deux tirages sur la force (+5 chacun), la plus faible (agilité) +2, la plus forte (force) +1.
    expect(v.progres.force).toBe(1 + 5 + 5 + 1);
    expect(v.progres.agilite).toBe(3);
    expect(v.or).toBe(7 + 2 + 4 + 4);
    expect(v.humeur).toBe(15);
  });

  it('s’applique à la partie, qui garde les PV du combat jusqu’au sommeil', () => {
    const rng = aleatoireFixe(4);
    const e = creerEcho({ nom: 'Filo', genre: 'm', graine: 'joy', lignee: 'primaire', rythme: 'diurne' }, rng);
    e.caracs.intelligence = 160;
    e.stade = 'enfant';
    const s = new Simulation(e, rng);
    const force = e.caracs.force;
    const heure = e.minute;
    s.terminerCombat(bilanCombat('victoire', e.caracs, { stade: 'bebe', lignee: 'primaire', ageJours: 2 }, 12, rng), 'Kesh');
    expect(e.caracs.force).toBeGreaterThan(force);
    expect(e.pvCombat).toBe(12);
    expect(e.minute).toBe(heure + 60);
    // Le seuil de 150 en intelligence est franchi : une technique de l'enfant solaire est apprise et équipée.
    expect(e.techniques?.connues).toHaveLength(1);
    expect(['Second souffle', 'Rayon sacré']).toContain(e.techniques?.equipees[0]);
    const d = descriptionDepuisEtat(e);
    expect(d.pv).toBe(12);
    expect(d.techniques).toEqual(e.techniques?.equipees);
  });
});

describe('signes', () => {
  it('ne montre qu’une allure, jamais un chiffre', () => {
    const c = Combat.creer([echo('A', caracs(60))], [echo('B', caracs(60))], { rng: aleatoireFixe(1) });
    const [a] = c.etat.allies;
    expect(lireSignesCombat(a, 0).allure).toBe('vaillant');
    a.pv = a.pvMax * 0.3;
    expect(lireSignesCombat(a, 0).allure).toBe('eprouve');
    a.pv = a.pvMax * 0.1;
    expect(lireSignesCombat(a, 0).allure).toBe('chancelant');
  });
});
