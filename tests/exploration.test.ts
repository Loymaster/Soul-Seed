import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ALIMENTS, CURIOSITES, OBJETS_DIVERS, PETITES_BETES, POISSONS, Simulation, aleatoireFixe, aliment, creerEcho, creerEchoSauvage,
  descriptionObjet, objetDivers,
} from '../src/moteur/simulation';
import { ranger } from '../src/moteur/simulation/objets';
import { ZONES, DEPART } from '../src/jeu/exploration/zones';
import {
  DUREES, MAT_POOLS, bilanDepart, groupeMat, lumiere, reprendreTrouvailles, temperamentTerrain,
} from '../src/jeu/exploration/regles';
import { PLAFOND_RESSOURCE, ajouterRessource, creerMonde, decouvrir, facteurRecence, probaRencontre, noterRencontre } from '../src/moteur/monde';

const ASSETS = path.resolve(__dirname, '../public/assets');
const existe = (p: string) => fs.existsSync(path.join(ASSETS, p));
const echo = (graine = 3) => creerEcho({ nom: 'Filo', genre: 'm', graine: 'wrath', lignee: 'primaire', rythme: 'diurne' }, aleatoireFixe(graine));

describe('objets rapportés d’exploration', () => {
  const rapportes = new Set<string>();
  for (const z of Object.values(ZONES)) {
    [...z.fouille, ...z.envoi, ...z.poissons].forEach((id) => rapportes.add(id));
    if (z.rareFouille) rapportes.add(z.rareFouille.id);
    if (z.rareEnvoi) rapportes.add(z.rareEnvoi.id);
  }

  it('chaque objet trouvable a une fiche (nom, icône existante, description)', () => {
    expect(rapportes.size).toBeGreaterThan(50);
    for (const id of [...rapportes, 'canne_peche', 'tente']) {
      const d = descriptionObjet(id);
      expect(d, id).not.toBeNull();
      expect(d!.nom.length, id).toBeGreaterThan(1);
      expect(d!.description.length, id).toBeGreaterThan(3);
      expect(existe(d!.icone), `${id} → ${d!.icone}`).toBe(true);
    }
  });

  it('les poissons crus du prototype sont des aliments hors boutique, catégorie Poisson', () => {
    expect(POISSONS).toHaveLength(20);
    for (const p of POISSONS) {
      expect(aliment(p.id)).toBe(p);
      expect(p.categories).toEqual(['Poisson']);
      expect(p.horsBoutique).toBe(true);
      expect(p.regimes).toEqual(['Carnivore', 'Omnivore']);
      expect(p.satiete).toBeGreaterThan(0);
    }
    expect(aliment('poisson_silure')!.satiete).toBe(48);
    // les aliments de la boutique ne changent pas (les goûts tirés à la naissance en dépendent)
    expect(ALIMENTS.some((a) => a.id.startsWith('poisson_'))).toBe(false);
  });

  it('curiosités et petites bêtes : objets sans usage, avec leur prix de revente du prototype', () => {
    expect(CURIOSITES).toHaveLength(13);
    expect(PETITES_BETES).toHaveLength(8);
    for (const o of [...CURIOSITES, ...PETITES_BETES]) {
      expect(objetDivers(o.id)).toBe(o);
      expect(o.usage).toBeUndefined();
      expect(o.revente).toBeGreaterThan(0);
    }
    expect(objetDivers('curio_noyau_incandescent')).toMatchObject({ prix: 60, revente: 25, nature: 'curiosite' });
    expect(objetDivers('creature_faisan')).toMatchObject({ prix: 6, nature: 'bete' });
  });

  it('tente et canne à pêche sont des outils ; les objets mystiques des zones sont au catalogue', () => {
    expect(objetDivers('tente')).toMatchObject({ prix: 60, icone: 'interface/icones/tente.png', nature: 'outil' });
    expect(objetDivers('canne_peche')).toMatchObject({ icone: 'objets/divers/canne-peche.png', nature: 'outil' });
    for (const id of ['pierre_ardente', 'cristal_vital', 'pierre_incantatoire', 'feuille_vie']) expect(objetDivers(id), id).toBeTruthy();
    expect(new Set(OBJETS_DIVERS.map((o) => o.id)).size).toBe(OBJETS_DIVERS.length);
  });

  it('un poisson se mange (la simulation le reconnaît comme aliment)', () => {
    const e = echo();
    e.inventaire = Array(10).fill(null);
    e.satiete = 10; e.frustrationAlimentaire = 0; e.malade = false;
    expect(ranger(e, 'poisson_truite', 1)).toBe(1);
    const sim = new Simulation(e, aleatoireFixe(1));
    const r = sim.nourrir(0);
    expect(r.ok).toBe(true);
    expect(e.satiete).toBeGreaterThan(10);
    expect(e.inventaire[0]).toBeNull();
  });

  it('une curiosité ne se mange pas et ne sert à rien au ranch', () => {
    const e = echo();
    e.inventaire = Array(10).fill(null);
    ranger(e, 'curio_quartz', 1);
    const sim = new Simulation(e, aleatoireFixe(1));
    expect(sim.nourrir(0).ok).toBe(false);
    expect(sim.utiliser(0).ok).toBe(false);
    expect(e.inventaire[0]).toEqual({ id: 'curio_quartz', qte: 1 });
  });
});

describe('lieux', () => {
  it('34 lieux, chemins cohérents, décors présents, positions sur la carte', () => {
    expect(Object.keys(ZONES)).toHaveLength(34);
    expect(ZONES[DEPART].nom).toBe('Sortie du village');
    for (const [k, z] of Object.entries(ZONES)) {
      expect(existe(z.fond), z.fond).toBe(true);
      expect(z.carte[0]).toBeGreaterThan(0); expect(z.carte[0]).toBeLessThan(1586);
      expect(z.carte[1]).toBeGreaterThan(0); expect(z.carte[1]).toBeLessThan(992);
      for (const c of z.chemins) if (c.vers != null) expect(ZONES[c.vers], `${k} → ${c.vers}`).toBeTruthy();
      if (z.eau && z.poissons.length) z.poissons.forEach((id) => expect(aliment(id), id).toBeTruthy());
    }
    expect(existe('decors/exploration/carte.png')).toBe(true);
    expect(existe('decors/exploration/carte-brume.webp')).toBe(true);
  });

  it('les échos sauvages d’un lieu respectent son âge et ses graines', () => {
    const rng = aleatoireFixe(11);
    for (let i = 0; i < 40; i++) {
      const s = creerEchoSauvage(rng, 2, 4, ['sorrow', 'fear', 'disgust']);
      expect(['sorrow', 'fear', 'disgust']).toContain(s.graine);
      expect(s.ageJours).toBeGreaterThanOrEqual(2);
      expect(s.ageJours).toBeLessThanOrEqual(4);
    }
    // sans graines imposées : toutes sont possibles (et le tirage reste celui d'avant)
    expect(creerEchoSauvage(aleatoireFixe(5), 1, 3)).toEqual(creerEchoSauvage(aleatoireFixe(5), 1, 3, []));
  });
});

describe('règles de terrain', () => {
  it('récolter : chaque lieu récoltable a un pool ; ressources plafonnées par le monde', () => {
    expect(groupeMat(1)).toBe('village');
    expect(groupeMat(21)).toBe('caverne');
    expect(groupeMat(30)).toBe('cristal');
    expect(groupeMat(6)).toBeNull();
    for (const g of Object.values(MAT_POOLS)) for (const k of Object.keys(g.w)) expect(g.q[k as keyof typeof g.q], k).toBeTruthy();
    const m = creerMonde();
    expect(ajouterRessource(m, 'bois', 4)).toBe(4);
    expect(ajouterRessource(m, 'bois', 4)).toBe(PLAFOND_RESSOURCE - 4);
    expect(m.ressources.bois).toBe(PLAFOND_RESSOURCE);
  });

  it('durées des actions (seules les actions font passer le temps)', () => {
    expect(DUREES).toMatchObject({ fouiller: 30, recolter: 30, envoyer: 20, pecher: 15 });
  });

  it('rencontres : moins probables dans un lieu visité depuis moins de 24 h', () => {
    const m = creerMonde();
    const p0 = probaRencontre(m, 3, 10000, { base: 0.25, nuitDehors: false, repousse: false });
    expect(p0).toBeCloseTo(0.25);
    noterRencontre(m, 3, 10000);
    expect(probaRencontre(m, 3, 10010, { base: 0.25, nuitDehors: false, repousse: false })).toBeLessThan(0.25 * 0.1);
    expect(probaRencontre(m, 4, 10100, { base: 0.25, nuitDehors: true, repousse: false })).toBeCloseTo(0.25 * 1.3);
    expect(facteurRecence(10000, 10000 + 1440)).toBe(1);
  });

  it('tempérament de terrain lu dans celui de l’écho', () => {
    const e = echo();
    e.temperament = { cur: 3, res: 0, dis: 0, obs: 0, ant: 0 }; e.traits = { ...e.traits, impulsivite: 50, prudence: 50 };
    expect(temperamentTerrain(e)).toBe('curieux');
    e.temperament = { cur: 0, res: 3, dis: 0, obs: 0, ant: 0 }; e.traits = { ...e.traits, impulsivite: 70, prudence: 40 };
    expect(temperamentTerrain(e)).toBe('fonceur');
    e.temperament = { cur: 0, res: 0, dis: 0, obs: 0, ant: 2 }; e.traits = { ...e.traits, impulsivite: 30, prudence: 70 };
    expect(temperamentTerrain(e)).toBe('prudent');
  });

  it('lumière : la nuit assombrit dehors, la caverne garde la sienne', () => {
    expect(lumiere(14 * 60, false).sombre).toBe(false);
    expect(lumiere(23 * 60, false).sombre).toBe(true);
    expect(lumiere(14 * 60, true).sombre).toBe(true);
    expect(lumiere(12 * 60, false).filtre).toBe('brightness(1.000) saturate(1.000)');
  });

  it('bilan de sortie et trouvailles reprises après une victoire', () => {
    const e = echo();
    e.inventaire = Array(10).fill(null);
    ranger(e, 'pomme', 2);
    const m = creerMonde(); decouvrir(m, 1);
    const b = bilanDepart(e, m);
    expect(b.inventaire).toEqual({ pomme: 2 });
    expect(b.decouvertes).toEqual([1]);
    const r = { zone: 1, sauvage: creerEchoSauvage(aleatoireFixe(2)), enjeu: ['mures', 'curio_galet_poli'], x: 0, y: 0 };
    expect(reprendreTrouvailles(e, r)).toEqual([]);
    expect(e.inventaire.filter(Boolean).map((c) => c!.id)).toEqual(['pomme', 'mures', 'curio_galet_poli']);
    // sac plein : celles qui n'ont pas de place sont rendues (l'écran propose de faire de la place)
    for (let i = 0; i < 10; i++) if (!e.inventaire[i]) e.inventaire[i] = { id: `x${i}`, qte: 1 };
    expect(reprendreTrouvailles(e, { ...r, enjeu: ['truffe'] })).toEqual(['truffe']);
  });
});

// —— les pas d'un lieu à l'autre et l'arrivée (retours de l'autrice)
import { DUREE_PAS, GUET_ARRIVEE, finPas, programmePas, tirerArrivee } from '../src/jeu/exploration/regles';
import { SCENES } from '../src/contenu/scenes';
import { analyserScene } from '../src/moteur/scene/analyseur';

describe('exploration : les pas ne se chevauchent pas', () => {
  // Exploration.aller() : pas de départ à 0, pas d'arrivée au plus tôt 0,85 s après (le décor d'arrivée attendu ensuite)
  const DEBUT_ARRIVEE = 0.85;
  it('le départ se tait avant que l’arrivée commence, au pire des tirages', () => {
    for (const r of [() => 0, () => 0.999, Math.random]) {
      for (const grotte of [false, true]) {
        const depart = programmePas('depart', grotte, undefined, r), arrivee = programmePas('arrivee', grotte, undefined, () => 0);
        expect(finPas(depart)).toBeLessThan(DEBUT_ARRIVEE + Math.min(...arrivee.map((p) => p.t)));
      }
    }
  });
  it('moins de pas, qui s’espacent et s’éteignent au départ, commencent tard et doucement à l’arrivée', () => {
    const d = programmePas('depart', false, undefined, () => 0), a = programmePas('arrivee', false, undefined, () => 0);
    expect(d.length).toBeLessThan(6); expect(a.length).toBeLessThan(6);
    for (let i = 1; i < d.length; i++) { expect(d[i].vol).toBeLessThan(d[i - 1].vol); expect(d[i].t - d[i - 1].t).toBeGreaterThanOrEqual(d[1].t - d[0].t); }
    for (let i = 1; i < a.length; i++) expect(a[i].vol).toBeGreaterThan(a[i - 1].vol);
    expect(a[0].t).toBeGreaterThanOrEqual(0.4);
    // l'arrivée finit avant que l'écho soit en place (0,26 s + 1,15 s de marche)
    expect(finPas(programmePas('arrivee', false, undefined, () => 0.999))).toBeLessThan(1.41);
    // pas superposés à l'intérieur d'une série : jamais
    for (const s of [d, a]) for (let i = 1; i < s.length; i++) expect(s[i].t - s[i - 1].t).toBeGreaterThan(DUREE_PAS);
  });
});

describe('exploration : l’arrivée se tranche avant les gestes', () => {
  const base = { nyxara: false, pnj: false, echo: true, proba: 1, nouveau: true, grotte: true };
  it('cinématique et PNJ d’abord, puis l’écho sauvage, puis une simple réaction', () => {
    expect(tirerArrivee({ ...base, nyxara: true })).toBe('nyxara');
    expect(tirerArrivee({ ...base, pnj: true })).toBe('pnj');
    expect(tirerArrivee(base, () => 0.5)).toBe('rencontre');
    expect(tirerArrivee({ ...base, proba: 0 }, () => 0.1)).toBe('surpris');
    expect(tirerArrivee({ ...base, proba: 0, nouveau: false }, () => 0.1)).toBe('anxieux');
    expect(tirerArrivee({ ...base, echo: false, nouveau: false, grotte: false })).toBe('rien');
    expect(GUET_ARRIVEE).toBeGreaterThan(0);
  });
});

describe('scène de Nyxara : cinématiques', () => {
  const s = SCENES.find((x) => x.id === 'nyxara')!;
  const actions: { nom: string; argument?: string }[] = [];
  const parcourir = (n: unknown) => {
    if (Array.isArray(n)) { n.forEach(parcourir); return; }
    if (!n || typeof n !== 'object') return;
    const o = n as Record<string, unknown>;
    if (o.type === 'action') actions.push({ nom: String(o.nom), argument: o.argument as string | undefined });
    Object.values(o).forEach((v) => v && typeof v === 'object' && parcourir(v));
  };
  parcourir(analyserScene(s.source, s.id).scene);
  it('ses cinq images sont des cinématiques (le dialogue attend), plus aucune image épinglée', () => {
    expect(actions.filter((a) => a.nom === 'image')).toEqual([]);
    const imgs = actions.filter((a) => a.nom === 'cinematique').map((a) => a.argument);
    expect(imgs).toEqual([1, 2, 3, 4, 5].map((i) => `pnj/nyxara/attaque-${i}`));
    for (const i of imgs) expect(fs.existsSync(path.join(ASSETS, `${i}.png`))).toBe(true);
  });
  it('« Lame de l’aube » est annoncée comme une technique de combat', async () => {
    const { lireTechnique } = await import('../src/jeu/monde/ScenePnj');
    const t = actions.find((a) => a.nom === 'technique');
    expect(t).toBeTruthy();
    const l = lireTechnique(t!.argument!, { vinland: { taille: 1.9, visible: 1 } });
    expect(l.nom).toBe("Lame de l'aube");
    expect(l.categorie).toBe('lumineux');
    expect(l.x).toBe(420);
  });
});
