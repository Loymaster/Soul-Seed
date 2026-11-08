// Retour au système du prototype (caractéristiques, gains, corvées, techniques), croissance des échos sauvages,
// grands pools de prénoms, déjections à la taille de l'écho, « panser les blessures ».
import { describe, expect, it } from 'vitest';
import {
  AGE_MORT, CLES_CARACS, NOMS_ECHOS_F, NOMS_ECHOS_M, Simulation, aleatoireFixe, apparence, creerEcho, creerEchoSauvage,
  demiHeuresPansement, essaisCorvee, etatPlaies, nombreEssais, nomsPris, plaiesApres, probaCorvee, pvMaxEcho, stadeSauvage,
  tirerNom, vieillirSauvage, vieillirSauvages, type EchoSauvage, type Etat,
} from '../src/moteur/simulation';
import { tirerCaracs } from '../src/moteur/simulation/creation';
import { aBoutDeForces } from '../src/moteur/combat';
import { palierCarac } from '../src/jeu/ranch/fiche';
import { echelleDejection, placerDejection } from '../src/jeu/ranch/dejections';

function nouvelle(graine = 1, regl: Partial<Etat> = {}) {
  const rng = aleatoireFixe(graine);
  const e = creerEcho({ nom: 'Filo', genre: 'm', graine: 'joy', lignee: 'primaire', rythme: 'diurne' }, rng);
  Object.assign(e, regl);
  return new Simulation(e, rng);
}
const constant = (v: number) => () => v;

describe('caractéristiques : le système du prototype', () => {
  it('à l’éclosion : 10–50 chacune, 100 points répartis, bonus de lignée (rollCaracteristiques)', () => {
    for (let g = 1; g <= 40; g++) {
      const c = tirerCaracs('wrath', 'primaire', aleatoireFixe(g));
      const total = CLES_CARACS.reduce((t, k) => t + c[k], 0);
      // 6 × (10 à 50) + 100 + 10 (force, lignée primaire de la graine tellurique)
      expect(total).toBeGreaterThanOrEqual(60 + 110);
      expect(total).toBeLessThanOrEqual(300 + 110);
      for (const k of CLES_CARACS) expect(c[k]).toBeGreaterThanOrEqual(10);
    }
    const n = tirerCaracs('joy', 'neutre', constant(0)); // les 100 points tombent tous sur la force ; neutre : +3 partout
    expect(n.force).toBe(113);
    expect(n.agilite).toBe(13);
  });

  it('entraînement : (10 + tempérament) × stade × aléa × conscienciosité × humeur, 2 h (startTraining)', () => {
    const s = nouvelle(3, { humeur: 50 });
    s.etat.personnalite.conscienciosite = 3;
    const avant = s.etat.caracs.endurance;
    (s as unknown as { rng: () => number }).rng = constant(0.5);
    s.entrainer('equilibre'); // curiosité 3 (graine solaire, lignée primaire), bébé × 0,5
    const attendu = Math.round((10 + 3) * 0.5 * 1 * 1 * (0.85 + 50 / 333) * 10) / 10;
    expect(s.etat.caracs.endurance).toBeCloseTo(avant + attendu, 5);
  });

  it('entraînement : une humeur à 0 compte pour 50, comme dans le prototype (mood || 50)', () => {
    const a = nouvelle(3, { humeur: 0 }), b = nouvelle(3, { humeur: 50 });
    for (const s of [a, b]) { s.etat.personnalite.conscienciosite = 3; (s as unknown as { rng: () => number }).rng = constant(0.5); }
    const ea = a.etat.caracs.endurance, eb = b.etat.caracs.endurance;
    a.entrainer('equilibre'); b.entrainer('equilibre');
    expect(a.etat.caracs.endurance - ea).toBeCloseTo(b.etat.caracs.endurance - eb, 5);
  });

  it('un entraînement qui franchit un seuil d’intelligence apprend une technique, comme une heure qui passe', () => {
    const s = nouvelle(5);
    s.etat.stade = 'enfant'; // (bébé, le seuil serait perdu sans rien apprendre, comme dans le prototype)
    s.etat.caracs.intelligence = 149;
    s.entrainer('probleme');
    expect(s.etat.caracs.intelligence).toBeGreaterThanOrEqual(150);
    expect(s.etat.techniques?.connues.length).toBe(1);
  });

  it('corvées : huit objets à ranger quel que soit le niveau, la barrière selon le niveau (4, 8, 12)', () => {
    expect(nombreEssais('ranger_ranch', 1)).toBe(8);
    expect(nombreEssais('ranger_ranch', 3)).toBe(8);
    expect([1, 2, 3].map((n) => nombreEssais('reparer_cloture', n))).toEqual([4, 8, 12]);
    expect([1, 2, 3].map((n) => nombreEssais('ramener_eau', n))).toEqual([4, 8, 12]);
  });

  it('corvées : probabilités du prototype (la barrière a la sienne, plus indulgente)', () => {
    expect(probaCorvee('ranger_ranch', 50, 0)).toBeCloseTo(0.35 + 50 / 250);
    expect(probaCorvee('ranger_ranch', 100, 100)).toBe(0.95);
    expect(probaCorvee('reparer_cloture', 60, 0)).toBeCloseTo(0.65 + 60 / 300);
    expect(probaCorvee('reparer_cloture', 0, 100)).toBeCloseTo(0.95);
    expect(probaCorvee('reparer_cloture', 100, 100)).toBe(0.97);
  });

  it('barrière : une erreur se propage en cascade (un morceau mal placé prend la case d’un autre)', () => {
    // le premier morceau rate (0,99 > p) et prend une case libre ; tous les suivants voudraient la leur
    const suite = [0.1, 0.1, 0.1, 0.99, 0.99, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
    let i = 0;
    const essais = essaisCorvee('reparer_cloture', 60, 0, 1, () => suite[i++ % suite.length]);
    expect(essais).toHaveLength(4);
    expect(essais.filter((x) => !x).length).toBeGreaterThanOrEqual(1);
    expect(essais.filter((x) => !x).length).not.toBe(1); // jamais une seule erreur : elle en entraîne une autre
  });

  it('la fiche traduit les valeurs du prototype : un écho qui vient d’éclore est frêle ou modeste, à un cran', () => {
    for (let g = 1; g <= 30; g++) {
      const e = nouvelle(g).etat;
      for (const k of CLES_CARACS) {
        const p = palierCarac(e.caracs[k]);
        expect(['frêle', 'modeste']).toContain(p.mot);
        expect(p.crans).toBe(1);
      }
    }
    expect(palierCarac(250).mot).toBe('solide');
    expect(palierCarac(650).mot).toBe('redoutable');
    expect(palierCarac(999)).toEqual({ mot: 'légendaire', crans: 10 });
    expect(palierCarac(500).crans).toBe(5);
  });
});

describe('les échos sauvages grandissent', () => {
  const sauvage = (age: number, rng = aleatoireFixe(4)) => creerEchoSauvage(rng, age, age);

  it('stade selon l’âge : 1–2 bébé, 3–6 enfant, 7–12 adolescent, 13 et plus adulte', () => {
    expect([1, 2, 3, 6, 7, 12, 13, 19].map(stadeSauvage)).toEqual(['bebe', 'bebe', 'enfant', 'enfant', 'adolescent', 'adolescent', 'adulte', 'adulte']);
    expect(sauvage(14).stade).toBe('adulte');
  });

  it('chaque jour : âge, stade, image et caractéristiques suivent la règle de création (× (1 + âge / 8))', () => {
    const s = sauvage(2);
    const avant = { ...s.caracs }, image = apparence({ ...s, evolution: null });
    expect(vieillirSauvage(s)).toBe(true);
    expect(s.ageJours).toBe(3);
    expect(s.stade).toBe('enfant');
    expect(apparence({ ...s, evolution: null })).not.toBe(image);
    expect(apparence({ ...s, evolution: null })).toMatch(/^echos\/enfant\//);
    for (const k of CLES_CARACS) expect(s.caracs[k]).toBeCloseTo(avant[k] * (1 + 3 / 8) / (1 + 2 / 8), 0);
  });

  it('au passage d’un jour dans la partie, ils vieillissent ; au bout de leur âge, ils ne reviennent plus', () => {
    const s = nouvelle(2, { minute: 23 * 60 + 59 });
    const vieux = sauvage(AGE_MORT - 1), jeune = sauvage(2);
    s.etat.echosSauvages.push(vieux, jeune);
    s.minute();
    expect(s.etat.echosSauvages.map((x) => x.id)).toEqual([jeune.id]);
    expect(jeune.ageJours).toBe(3);
    expect(s.etat.journal.some((j) => j.texte.includes(`On ne reverra plus ${vieux.nom}`))).toBe(true);
  });

  it('le visiteur du moment n’est pas effacé en pleine visite', () => {
    const v = sauvage(AGE_MORT - 1);
    const e = { echosSauvages: [v], visiteur: { id: v.id, departA: 0 } };
    expect(vieillirSauvages(e)).toEqual([]);
    expect(e.echosSauvages).toHaveLength(1);
  });

  it('à son retour, on remarque qu’il a grandi', () => {
    const s = nouvelle(6, { probaEvenement: 0 });
    const v: EchoSauvage = sauvage(2);
    v.stadeVu = 'bebe';
    vieillirSauvage(v);
    s.etat.echosSauvages.push(v);
    (s as unknown as { evenement: (n: string) => void }).evenement('visite');
    expect(s.etat.journal[0].texte).toContain('a bien grandi depuis la dernière fois');
    expect(v.stadeVu).toBe('enfant');
  });
});

describe('prénoms des échos', () => {
  it('plus de 300 prénoms, sans doublon ni personnage du jeu', () => {
    const tous = [...NOMS_ECHOS_M, ...NOMS_ECHOS_F];
    expect(tous.length).toBeGreaterThanOrEqual(300);
    expect(new Set(tous.map((n) => n.toLowerCase())).size).toBe(tous.length);
    for (const pnj of ['Jumpy', 'Myhra', 'Ash', 'Garry', 'Hevann', 'Nyxara']) expect(tous).not.toContain(pnj);
  });

  it('évite les noms déjà portés (écho du joueur, échos sauvages connus), sans casse ni accent', () => {
    const pris = NOMS_ECHOS_F.slice(0, NOMS_ECHOS_F.length - 1).map((n) => n.toUpperCase());
    expect(tirerNom('f', Math.random, pris)).toBe(NOMS_ECHOS_F[NOMS_ECHOS_F.length - 1]);
    const s = nouvelle(9);
    for (let i = 0; i < 40; i++) s.etat.echosSauvages.push(creerEchoSauvage(Math.random, 1, 3, undefined, nomsPris(s.etat)));
    const noms = nomsPris(s.etat);
    expect(new Set(noms).size).toBe(noms.length);
  });
});

describe('déjections à la taille de l’écho', () => {
  it('proportionnelles à l’échelle de l’écho (référence : un enfant), au stade où il l’a laissée', () => {
    expect(echelleDejection(0.75)).toBeCloseTo(1);
    expect(echelleDejection(0.5)).toBeLessThan(echelleDejection(1.15));
    const e = nouvelle(1, { taille: 1 }).etat;
    const d = { id: 1, x: 0.5, y: 0.5, nature: 'crotte' as const };
    const bebe = placerDejection({ ...d, stade: 'bebe' }, e), adulte = placerDejection({ ...d, stade: 'adulte' }, e);
    expect(adulte.l).toBeGreaterThan(bebe.l);
    expect(adulte.y + adulte.h).toBe(bebe.y + bebe.h); // posées sur le même sol
    expect(Math.round(adulte.x + adulte.l / 2)).toBe(Math.round(bebe.x + bebe.l / 2));
  });

  it('la simulation note le stade de l’écho sur chaque déjection', () => {
    const s = nouvelle(1, { digestion: true, besoin: 100, autonomie: 0 });
    s.etat.stade = 'adolescent';
    s.avancer(1);
    expect(s.etat.dejections.at(-1)?.stade).toBe('adolescent');
  });
});

describe('panser les blessures', () => {
  const blesse = (part: number) => {
    const s = nouvelle(11, { probaEvenement: 0, chanceComportement: -1000 });
    s.etat.caracs.robustesse = 50; // 350 PV
    s.etat.pvCombat = pvMaxEcho(s.etat.caracs) * (1 - part);
    return s;
  };

  it('au plus la tranche perdue arrondie à la dizaine supérieure : 71–80 % perdus → 4 h', () => {
    expect(demiHeuresPansement(blesse(0.75).etat)).toBe(8);
    expect(demiHeuresPansement(blesse(0.71).etat)).toBe(8);
    expect(demiHeuresPansement(blesse(0.8).etat)).toBe(8);
    expect(demiHeuresPansement(blesse(0.05).etat)).toBe(1);
    expect(demiHeuresPansement(blesse(1).etat)).toBe(10);
    expect(demiHeuresPansement({ pvCombat: null, caracs: blesse(0).etat.caracs })).toBe(0);
  });

  it('chaque demi-heure rend 10 % des PV et fait passer 30 minutes', () => {
    const s = blesse(0.75);
    const m0 = s.etat.jour * 1440 + s.etat.minute;
    const r = s.panser(3);
    expect(r.ok).toBe(true);
    expect(s.etat.jour * 1440 + s.etat.minute - m0).toBe(90);
    expect(s.etat.pvCombat).toBeCloseTo(350 * 0.55, 0);
  });

  it('le maximum referme tout (pleine forme) ; on ne peut pas dépasser la tranche', () => {
    const s = blesse(0.75);
    const m0 = s.etat.jour * 1440 + s.etat.minute;
    const r = s.panser(20);
    expect(r.ok && r.demiHeures).toBe(8);
    expect(s.etat.jour * 1440 + s.etat.minute - m0).toBe(240);
    expect(s.etat.pvCombat).toBeNull();
    expect(s.panser(1).ok).toBe(false);
  });

  it('un écho à bout de forces redevient apte dès que ses PV remontent', () => {
    const s = blesse(1);
    expect(aBoutDeForces(s.etat)).toBe(true);
    s.panser(1);
    expect(aBoutDeForces(s.etat)).toBe(false);
  });

  it('jamais de chiffre : des mots pour l’état des plaies et ce qu’elles deviendront', () => {
    const s = blesse(0.8);
    expect(etatPlaies(s.etat)).toBe('Il est bien amoché.');
    expect(plaiesApres(s.etat, 4)).toBe('ses plaies seront refermées à moitié');
    expect(plaiesApres(s.etat, 8)).toBe('ses plaies seront tout à fait refermées');
    const r = s.panser(4);
    expect(r.ok && r.texte).toBe('Ses plaies sont refermées à moitié…');
    for (const t of [etatPlaies(s.etat), plaiesApres(s.etat, 2)]) expect(t).not.toMatch(/\d/);
  });
});
