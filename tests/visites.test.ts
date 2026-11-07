import { describe, expect, it } from 'vitest';
import { Simulation, aleatoireFixe, creerEcho, creerEchoSauvage, niveauRelation, type Etat, type Sortie } from '../src/moteur/simulation';
import { changerAffect, compatibilite, tirerInteractionVisite } from '../src/moteur/simulation/visites';

function avecVisiteur(graine = 1, regl: Partial<Etat> = {}) {
  const rng = aleatoireFixe(graine);
  const e = creerEcho({ nom: 'Filo', genre: 'm', graine: 'joy', lignee: 'primaire', rythme: 'diurne' }, rng);
  Object.assign(e, regl);
  const v = creerEchoSauvage(rng);
  e.echosSauvages.push(v);
  e.visiteur = { id: v.id, departA: e.jour * 24 + Math.floor(e.minute / 60) + 6 };
  return { sim: new Simulation(e, rng), v };
}

describe('relations avec les échos sauvages', () => {
  it('lit la relation en paliers, jamais en chiffres', () => {
    expect(niveauRelation({ affectPositif: 0, affectNegatif: 0 })).toBe('inconnu');
    expect(niveauRelation({ affectPositif: 4, affectNegatif: 2 })).toBe('neutre');
    expect(niveauRelation({ affectPositif: 10, affectNegatif: 0 })).toBe('camaraderie');
    expect(niveauRelation({ affectPositif: 30, affectNegatif: 5 })).toBe('amitie');
    expect(niveauRelation({ affectPositif: 70, affectNegatif: 10 })).toBe('complicite');
    expect(niveauRelation({ affectPositif: 2, affectNegatif: 12 })).toBe('mefiance');
    expect(niveauRelation({ affectPositif: 5, affectNegatif: 40 })).toBe('hostilite');
  });

  it('écrit au journal chaque palier franchi, en accordant', () => {
    const { sim, v } = avecVisiteur(2);
    v.genre = 'f'; sim.etat.genre = 'f';
    v.affectPositif = 24; v.affectNegatif = 0;
    const r = changerAffect(sim.etat, v, 3, 0);
    expect(r?.niveau).toBe('amitie');
    expect(r?.texte).toContain('devenues amies');
    expect(changerAffect(sim.etat, v, 1, 0)).toBeNull();
  });

  it('le bonus d’inspiration rapproche les personnalités', () => {
    const { sim, v } = avecVisiteur(3);
    const avant = compatibilite(sim.etat.personnalite, v);
    v.compatBonus = 0.4;
    expect(compatibilite(sim.etat.personnalite, v)).toBeCloseTo(Math.max(0, avant - 0.4));
  });

  it('jouer avec le visiteur fait évoluer la relation et le signale', () => {
    const { sim, v } = avecVisiteur(4);
    const r = sim.duoAvecVisiteur('jeu');
    expect(r.ok).toBe(true);
    const sorties = sim.vider();
    expect(sorties.some((s) => s.type === 'visite' && !s.spontane)).toBe(true);
    expect(v.affectPositif + v.affectNegatif).toBeGreaterThan(0);
  });
});

describe('visites au ranch', () => {
  it('les deux échos font parfois quelque chose ensemble, d’eux-mêmes', () => {
    const { sim, v } = avecVisiteur(5, { minute: 10 * 60 });
    const toutes: Sortie[] = [];
    for (let i = 0; i < 5 * 60; i++) { sim.minute(); toutes.push(...sim.vider()); }
    const spontanees = toutes.filter((s) => s.type === 'visite' && s.spontane);
    expect(spontanees.length).toBeGreaterThan(0);
    expect(v.affectPositif + v.affectNegatif).toBeGreaterThan(0);
    // aucun chiffre dans ce qui est montré au joueur
    for (const s of toutes) if ('texte' in s) expect(s.texte).not.toMatch(/\d/);
  });

  it('le visiteur repart au bout de six heures, et la relation colore son départ', () => {
    const { sim, v } = avecVisiteur(6, { minute: 10 * 60 });
    v.affectPositif = 40;
    const toutes: Sortie[] = [];
    for (let i = 0; i < 7 * 60; i++) { sim.minute(); toutes.push(...sim.vider()); }
    const depart = toutes.find((s) => s.type === 'visiteur-parti');
    expect(depart && depart.type === 'visiteur-parti' && depart.id).toBe(v.id);
    expect(sim.etat.visiteur).toBeNull();
  });

  it('toutes les natures d’interaction peuvent survenir', () => {
    const rng = aleatoireFixe(9);
    const e = creerEcho({ nom: 'Filo', genre: 'm', graine: 'wrath', lignee: 'primaire', rythme: 'diurne' }, rng);
    const v = creerEchoSauvage(rng);
    const vues = new Set<string>();
    for (let i = 0; i < 400; i++) { e.minute = (i * 37) % 1440; vues.add(tirerInteractionVisite(e, v, rng).nature); }
    expect([...vues].sort()).toEqual(['dispute', 'jeu', 'partage', 'repos']);
  });
});
