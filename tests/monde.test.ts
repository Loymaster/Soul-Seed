import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  BATIMENTS_ASH, REPARATIONS, acheter, avancerTravaux, construireVillage, creerMonde, deposerObjet, deposerRessources, etalDuJour,
  genererEtal, lancerChantier, lancerReparation, niveauEntrepot, normaliserMonde, prosperite, recruter, reprendreObjet, vendreCuriosite,
  bonusPeche, poserRepousse, repousseActive,
  casesCoffre, plafondCoffre, type Monde,
} from '../src/moteur/monde';
import { Simulation, aleatoireFixe, creerEcho, heureTotale, objetDivers, type Etat } from '../src/moteur/simulation';
import { analyserScene, ACTIONS } from '../src/moteur/scene/analyseur';
import { LecteurScene } from '../src/moteur/scene/lecteur';
import { anecdotes, apresDon, appliquerIssueCombat, jouerAction, reconfort } from '../src/jeu/monde/actions';
import { COMBATS_PNJ } from '../src/jeu/monde/adversaires';
import { retenirVariables, variablesScene } from '../src/jeu/monde/variables';
import { TECHNIQUES } from '../src/moteur/combat';

const ASSETS = path.resolve(__dirname, '../public/assets');
const SCENES = path.resolve(__dirname, '../contenu/scenes');

function partie(regl: Partial<Etat> = {}) {
  const rng = aleatoireFixe(3);
  const e = creerEcho({ nom: 'Filo', genre: 'm', graine: 'joy', lignee: 'primaire', rythme: 'diurne' }, rng);
  Object.assign(e, regl);
  const m = creerMonde();
  return { e, m, etat: e, monde: m, sim: new Simulation(e, rng) };
}
const minute = (e: Etat) => e.jour * 1440 + e.minute;
const perso = { nom: 'Aëlle', pronom: 'elle' as const, avatar: 'fille-1' as const };

describe('monde', () => {
  it('relit une ancienne sauvegarde sans coffre ni travaux', () => {
    const m = normaliserMonde({ drapeaux: { 'garry.vaincu': true } } as Partial<Monde>);
    expect(m.coffre.objets).toHaveLength(24);
    expect(m.chantier).toBeNull();
    expect(m.corvees).toEqual({});
    expect(m.drapeaux['garry.vaincu']).toBe(true);
  });

  it('recrute un habitant une seule fois et fait monter la prospérité selon son stade', () => {
    const m = creerMonde();
    expect(prosperite(m)).toBe(1);
    expect(recruter(m, 'hevann', 'Hevann', 'adolescent')).toBe(true);
    expect(recruter(m, 'hevann', 'Hevann', 'adolescent')).toBe(false);
    expect(recruter(m, 'lady-roger', 'Lady Roger', 'bebe')).toBe(true);
    expect(prosperite(m)).toBe(5);
    expect(m.drapeaux['village.dernier']).toBe('Lady Roger');
    expect(m.pnjConnus).toContain('hevann');
  });
});

describe('boutique de Jumpy', () => {
  it('propose un étal du jour : trois régimes, deux pour un, non comestible, objet utile, équipement', () => {
    const etal = genererEtal(aleatoireFixe(9));
    expect(etal.map((x) => x.categorie)).toEqual(['Végétarien', 'Carnivore', 'Omnivore', 'Deux pour le prix d’un !', 'Non comestible', 'Objets utiles et combat', 'Équipement', 'Équipement']);
    expect(etal.slice(0, 4).map((x) => x.id).length).toBe(new Set(etal.slice(0, 4).map((x) => x.id)).size);
    expect(etal.map((x) => x.id)).toContain('tente');
    expect(etal.map((x) => x.id)).toContain('canne_peche');
    for (const x of etal) expect(x.prix).toBeGreaterThan(0);
  });

  it('garde l’étal toute la journée et le renouvelle le lendemain', () => {
    const m = creerMonde();
    const a = etalDuJour(m, 2, aleatoireFixe(1));
    expect(etalDuJour(m, 2, aleatoireFixe(2))).toBe(a);
    expect(etalDuJour(m, 3, aleatoireFixe(2))).not.toBe(a);
  });

  it('achète avec l’or de l’écho, dans la limite du stock et du sac', () => {
    const { e, m } = partie({ or: 100 });
    m.boutique = { jour: e.jour, etal: [{ categorie: 'Végétarien', id: 'pomme', prix: 2, stock: 3 }, { categorie: '2×1', id: 'pain', prix: 3, stock: 1, deuxPourUn: true }] };
    const r = acheter(e, m, 0, 5);
    expect(r).toMatchObject({ ok: true, recus: 3, cout: 6 });
    expect(e.or).toBe(94);
    expect(m.boutique.etal[0].stock).toBe(0);
    expect(acheter(e, m, 0, 1).ok).toBe(false);
    const d = acheter(e, m, 1, 1);
    expect(d).toMatchObject({ ok: true, recus: 2, cout: 3 });
    e.or = 0;
    m.boutique.etal[0].stock = 1;
    expect(acheter(e, m, 0, 1)).toMatchObject({ ok: false });
  });

  it('Lady Roger ne rachète que les curiosités et les petites bêtes', () => {
    const { e } = partie({ or: 0 });
    e.inventaire = [{ id: 'curio_pierre_gravee', qte: 3 }, { id: 'pomme', qte: 1 }, { id: 'creature_faisan', qte: 1 }, { id: 'canne_peche', qte: 1 }, ...Array(6).fill(null)];
    expect(vendreCuriosite(e, 1, 1).ok).toBe(false);
    expect(vendreCuriosite(e, 3, 1).ok).toBe(false);
    expect(vendreCuriosite(e, 0, 2)).toMatchObject({ ok: true, gain: 10 });
    expect(e.or).toBe(10);
    expect(e.inventaire[0]).toEqual({ id: 'curio_pierre_gravee', qte: 1 });
    expect(vendreCuriosite(e, 2, 1)).toMatchObject({ ok: true, gain: 6 });
    expect(e.inventaire[2]).toBeNull();
  });

  it('repousse et gélatine de Bourbella : actives jusqu’à l’heure dite', () => {
    const m = normaliserMonde(null);
    expect(repousseActive(m, 100)).toBe(false);
    poserRepousse(m, 100);
    expect(repousseActive(m, 111)).toBe(true);
    expect(repousseActive(m, 112)).toBe(false);
    m.drapeaux['peche.bonus_jusqua'] = 50;
    expect(bonusPeche(m, 49)).toBeCloseTo(0.15);
    expect(bonusPeche(m, 50)).toBe(0);
  });

  it('une sortie d’exploration en cours survit à la relecture du monde', () => {
    const m = normaliserMonde(null);
    expect(m.sortie).toBeNull();
    m.sortie = { zone: 16, historique: [1, 2, 3], bilan: { inventaire: {}, ressources: {}, decouvertes: [1] } };
    const relu = normaliserMonde(JSON.parse(JSON.stringify(m)));
    expect(relu.sortie).toEqual(m.sortie);
    expect(normaliserMonde({ sortie: { zone: 'x' } } as never).sortie).toBeNull();
  });
});

describe('coffre de Maïko et entrepôt', () => {
  it('dépose et reprend des piles, et stocke les ressources sous le plafond', () => {
    const { e, m } = partie();
    e.inventaire[0] = { id: 'pomme', qte: 2 };
    expect(deposerObjet(e, m, 0).ok).toBe(true);
    expect(e.inventaire[0]).toBeNull();
    expect(m.coffre.objets[0]).toEqual({ id: 'pomme', qte: 2 });
    expect(reprendreObjet(e, m, 0).ok).toBe(true);
    m.ressources = { bois: 5, pierre: 5 };
    m.coffre.ressources = { bois: 18 };
    const r = deposerRessources(m);
    expect(r.pleines).toEqual(['bois']);
    expect(m.coffre.ressources).toEqual({ bois: 20, pierre: 5 });
    expect(m.ressources).toMatchObject({ bois: 3, pierre: 0 });
  });

  it('grandit avec l’entrepôt', () => {
    const m = creerMonde();
    expect([casesCoffre(m), plafondCoffre(m)]).toEqual([24, 20]);
    m.structures.push('atelier', 'entrepot');
    expect(niveauEntrepot(m)).toBe(1);
    expect([casesCoffre(m), plafondCoffre(m)]).toEqual([48, 50]);
  });
});

describe('travaux d’Ash', () => {
  it('construit l’atelier avec les matériaux du coffre puis du sac, en 24 heures', () => {
    const { e, m } = partie();
    const t0 = minute(e);
    m.coffre.ressources = { bois: 8, pierre: 10, fibres: 5 };
    m.ressources = { bois: 2, resine: 3 };
    expect(lancerChantier(m, 'entrepot', t0)).toMatchObject({ ok: false });
    const r = lancerChantier(m, 'atelier', t0);
    expect(r.ok).toBe(true);
    expect(m.coffre.ressources).toMatchObject({ bois: 0, pierre: 0, fibres: 0 });
    expect(m.ressources).toMatchObject({ bois: 0, resine: 0 });
    expect(lancerChantier(m, 'atelier', t0).ok).toBe(false);
    expect(avancerTravaux(m, t0 + 23 * 60)).toEqual([]);
    expect(avancerTravaux(m, t0 + 24 * 60)).toEqual(['Ash a terminé : Atelier.']);
    expect(m.structures).toContain('atelier');
  });

  it('refuse un chantier sans les ressources, et l’entrepôt sans Maïko', () => {
    const { m } = partie();
    expect(lancerChantier(m, 'atelier', 0)).toMatchObject({ ok: false });
    m.structures.push('atelier');
    expect(lancerChantier(m, 'entrepot', 0)).toMatchObject({ ok: false, raison: expect.stringContaining('écho') });
    expect(BATIMENTS_ASH.find((b) => b.cle === 'entrepot')?.pnj).toBe('maiko.recrute');
  });

  it('les bâtiments du village se paient en or, sur-le-champ', () => {
    const { m } = partie();
    const bourse = { or: 100 };
    expect(construireVillage(m, bourse, 'fontaine').ok).toBe(false);
    m.structures.push('atelier');
    expect(construireVillage(m, bourse, 'fontaine').ok).toBe(true);
    expect(bourse.or).toBe(70);
    expect(construireVillage(m, bourse, 'dojo').ok).toBe(false); // Hevann doit être vaincu
  });

  it('répare puis améliore une corvée du ranch (6 h, puis 12 h)', () => {
    const { m } = partie();
    m.coffre.ressources = { bois: 30, ferraille: 20 };
    expect(lancerReparation(m, 'reparer_cloture', 0).ok).toBe(true);
    expect(lancerReparation(m, 'ramener_eau', 0)).toMatchObject({ ok: false, raison: 'Une réparation est déjà en cours.' });
    expect(avancerTravaux(m, 6 * 60)[0]).toContain('« Réparer la barrière » est désormais disponible');
    expect(m.corvees.reparer_cloture).toBe(1);
    expect(lancerReparation(m, 'reparer_cloture', 6 * 60).ok).toBe(true);
    avancerTravaux(m, 18 * 60);
    expect(m.corvees.reparer_cloture).toBe(2);
    expect(REPARATIONS).toHaveLength(6);
  });
});

describe('actions des scènes', () => {
  it('chaque action du monde est connue de l’analyseur', () => {
    for (const a of ['donner', 'retirer', 'or', 'ressource', 'recruter', 'combat', 'boutique', 'stand', 'coffre', 'travaux', 'travail', 'deblayer', 'drapeau', 'reconfort', 'motiver', 'apprendre-echo', 'heures', 'journal', 'ranch', 'lieu'])
      expect(ACTIONS[a]).toBeTruthy();
  });

  it('donne, retire, paie, recrute', () => {
    const ctx = partie({ or: 10 });
    const { e, m } = ctx;
    e.inventaire = Array(10).fill(null);
    expect(jouerAction('donner', 'canne_peche', ctx)).toMatchObject({ type: 'suite', variables: { 'action.ok': true } });
    e.inventaire[3] = { id: 'pomme', qte: 2 };
    expect(jouerAction('retirer', 'aliment', ctx)).toMatchObject({ variables: { 'action.ok': true, 'action.objet': 'pomme' } });
    expect(e.inventaire[3]).toEqual({ id: 'pomme', qte: 1 });
    expect(jouerAction('retirer', 'poisson_anguille', ctx)).toMatchObject({ variables: { 'action.ok': false } });
    jouerAction('or', '-4', ctx);
    expect(e.or).toBe(6);
    jouerAction('ressource', 'bois 9', ctx);
    expect(m.ressources.bois).toBe(5); // plafond porté
    expect(jouerAction('recruter', 'maiko bebe', ctx)).toMatchObject({ variables: { 'village.prosperite': 2, 'village.dernier': 'Maïko' } });
    expect(jouerAction('drapeau', 'garry.vaincu vrai', ctx)).toMatchObject({ variables: { 'garry.vaincu': true } });
    expect(m.drapeaux['garry.vaincu']).toBe(true);
    expect(jouerAction('combat', 'hevann', ctx)).toMatchObject({ type: 'combat' });
    expect(jouerAction('stand', undefined, ctx)).toEqual({ type: 'panneau', panneau: 'stand' });
    expect(jouerAction('lieu', 'zone 27', ctx)).toEqual({ type: 'sortie', vers: 'zone 27' });
  });

  it('un sac plein : le cadeau attend que le joueur fasse de la place (ou le laisse)', () => {
    const ctx = partie();
    ctx.e.inventaire = ctx.e.inventaire.map(() => ({ id: 'pomme', qte: 1 }));
    expect(jouerAction('donner', 'canne_peche 2', ctx)).toEqual({ type: 'recevoir', id: 'canne_peche', qte: 2 });
    expect(apresDon(ctx, 'canne_peche', 2, false)).toMatchObject({ 'action.ok': false, 'sac.plein': true });
  });

  it('Hevann motive l’écho : l’entraînement porte davantage pendant 6 heures', () => {
    const a = partie(), b = partie();
    jouerAction('motiver', undefined, b);
    expect(b.e.motivationJusqua).toBe(heureTotale(b.e) + 6);
    a.sim.entrainer('pierres'); b.sim.entrainer('pierres');
    expect(b.e.caracs.force).toBeGreaterThan(a.e.caracs.force);
  });

  it('Myhra soigne tout un écho angoissé', () => {
    const { e } = partie({ anxiete: 95, malade: true, blesse: true, sante: 10 });
    reconfort(e);
    expect(e).toMatchObject({ malade: false, blesse: false, anxiete: 0, sante: 12 });
  });

  it('Jumpy parle de l’écho en mots, jamais en chiffres', () => {
    const { e } = partie();
    const l = anecdotes(e);
    expect(l.length).toBeGreaterThan(8);
    for (const x of l) expect(x).not.toMatch(/\d/);
    expect(l[0]).toContain('Filo');
  });

  it('un combat de PNJ laisse ses traces, une fuite seulement la fatigue', () => {
    const ctx = partie({ or: 0 });
    const avant = ctx.e.caracs.force;
    expect(appliquerIssueCombat(ctx, COMBATS_PNJ.garry, { resultat: 'fuite', pv: 10, objetsUtilises: [] })).toEqual({ 'combat.issue': 'fuite' });
    expect(ctx.e.caracs.force).toBe(avant);
    const v = appliquerIssueCombat(ctx, COMBATS_PNJ.garry, { resultat: 'victoire', pv: 10, objetsUtilises: [] });
    expect(v['combat.issue']).toBe('victoire');
    expect(ctx.e.or).toBe((8 + 4) * 4 + 10); // or de Garry : × 4 + 10
    expect(ctx.e.caracs.force).toBeGreaterThan(avant);
  });

  it('les adversaires existent : images, techniques connues (« Poing incandescent » pour Hevann)', () => {
    expect(COMBATS_PNJ.hevann.adversaires[0].description.techniques).toEqual(['Poing incandescent']);
    expect(COMBATS_PNJ['phil-hibert'].adversaires).toHaveLength(2);
    for (const c of Object.values(COMBATS_PNJ)) {
      expect(fs.existsSync(path.join(ASSETS, c.terrain))).toBe(true);
      for (const a of c.adversaires) {
        expect(fs.existsSync(path.join(ASSETS, a.image))).toBe(true);
        for (const t of a.description.techniques ?? []) expect(TECHNIQUES[t]).toBeTruthy();
      }
    }
    expect(objetDivers('marteau_ash')?.nature).toBe('quete');
  });
});

describe('scènes et drapeaux', () => {
  const lire = (id: string) => analyserScene(fs.readFileSync(path.join(SCENES, `${id}.scene`), 'utf8'), id).scene;
  /** Joue une scène jusqu'au bout en choisissant toujours la réponse `k` et en simulant les actions. */
  function derouler(id: string, variables: Record<string, number | boolean | string>, reponses: number[] = [], actions: Record<string, Record<string, number | boolean | string>> = {}) {
    const l = new LecteurScene(lire(id), { variables });
    const vues: string[] = [];
    let r = 0;
    for (let i = 0; i < 300; i++) {
      if (l.enAttenteDeChoix) { /* déjà géré */ }
      const p = l.suivant();
      const ev = p.evenement;
      if (ev.type === 'fin') break;
      if (ev.type === 'choix') { l.choisir(ev.options[Math.min(ev.options.length - 1, reponses[r++] ?? 0)].index); continue; }
      if (ev.type === 'action') { vues.push(`${ev.nom} ${ev.argument ?? ''}`.trim()); for (const [k, v] of Object.entries(actions[ev.nom] ?? {})) l.definir(k, v); }
      if (ev.type === 'replique') vues.push(ev.texte);
    }
    return { variables: l.etat.variables, vues };
  }

  it('Hevann : victoire → il rejoint le village', () => {
    const { e, m } = partie();
    const initiales = variablesScene(e, m, perso);
    const { variables, vues } = derouler('hevann-chemin', initiales, [1, 0], { combat: { 'combat.issue': 'victoire' } });
    expect(vues).toContain('combat hevann');
    expect(vues).toContain('recruter hevann adolescent');
    retenirVariables(m, initiales, variables);
    expect(m.drapeaux['hevann.vaincu']).toBe(true);
    expect(m.drapeaux['maintenant']).toBeUndefined();
  });

  it('Lady Roger : accords selon le joueur, stand 12 heures après la victoire', () => {
    const { e, m } = partie();
    const initiales = variablesScene(e, m, perso);
    const { variables, vues } = derouler('lady-roger', { ...initiales, sujet: 'promenade' }, [0, 0, 0], { combat: { 'combat.issue': 'victoire' } });
    expect(vues.join(' ')).toContain('tu es malpolie');
    expect(variables['ladyroger.stand_a']).toBe((initiales.maintenant as number) + 12);
  });

  it('Bourbella : une fuite ne compte pas comme un combat', () => {
    const { e, m } = partie();
    const { variables } = derouler('bourbella-cabane', variablesScene(e, m, perso), [0, 1], { combat: { 'combat.issue': 'fuite' } });
    expect(variables['bourbella.combattue']).toBeUndefined();
  });

  it('Maïko mange le premier aliment du sac, puis rejoint le village six heures plus tard', () => {
    const { e, m } = partie();
    e.inventaire = [{ id: 'carotte', qte: 1 }, ...Array(9).fill(null)];
    const v0 = variablesScene(e, m, perso, 'parler');
    const a = derouler('maiko', v0, [0], { retirer: { 'action.ok': true, 'action.objet': 'carotte' } });
    retenirVariables(m, v0, a.variables);
    expect(m.drapeaux).toMatchObject({ 'maiko.nourri': true, 'maiko.aliment': 'carotte' });
    e.minute += 6 * 60;
    const v1 = variablesScene(e, m, perso, 'parler');
    const b = derouler('maiko', v1);
    expect(b.vues.join(' ')).toContain('un morceau de carotte');
    expect(b.vues).toContain('recruter maiko bebe');
  });

  it('Grimp rejoint le village quand Glamp est rentrée', () => {
    const { e, m } = partie();
    m.drapeaux['glamp.recrutee'] = true;
    const { vues } = derouler('grimp-caverne', variablesScene(e, m, perso));
    expect(vues).toContain('recruter grimp bebe');
  });
});
