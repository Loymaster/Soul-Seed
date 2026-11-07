import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { Arene, Combat, TECHNIQUES } from '../src/moteur/combat';
import { aleatoireFixe } from '../src/moteur/simulation';

const {
  STADES_ARENE, TRANCHES, TERRAINS_ARENE, PISTES_ARENE, formesArene, formeArene, poolArene, imageArene, tirerCaracs,
  combattantParDefaut, changerStade, basculerTechnique, techniquesAuHasard, ajusterCamp, preparerCombattant,
} = Arene;

describe('Mode Arène', () => {
  it('propose les formes du prototype selon le stade', () => {
    expect(formesArene('bebe')).toHaveLength(12);
    expect(formesArene('enfant')).toHaveLength(12);
    expect(formesArene('adolescent')).toHaveLength(23);
    expect(formesArene('adulte')).toHaveLength(12 + 11 + 10 + 6);
    expect(formesArene('fragmentes').map((f) => f.code)).toEqual(['PM+', 'C+', 'SA+']);
  });

  it('chaque forme a une image existante et un pool de techniques connues', () => {
    for (const { cle } of STADES_ARENE) {
      for (const f of formesArene(cle)) {
        for (const g of ['m', 'f'] as const) expect(existsSync(`public/assets/${imageArene(cle, f, g)}`), `${cle} ${f.code}`).toBe(true);
        const pool = poolArene(cle, f);
        if (cle === 'bebe') expect(pool).toEqual([]);
        else expect(pool.length, `${cle} ${f.code}`).toBeGreaterThan(0);
        for (const n of pool) expect(TECHNIQUES[n], n).toBeTruthy();
      }
    }
  });

  it('les adultes prennent les pools adultes (poolsAdultes)', () => {
    const adulte = poolArene('adulte', formeArene('adulte', 'W'));
    const ado = poolArene('adolescent', formeArene('adolescent', 'W'));
    expect(adulte).not.toEqual(ado);
    expect(poolArene('adulte', formeArene('adulte', 'N-ETHER')).length).toBeGreaterThan(0);
  });

  it('les terrains et les musiques existent', () => {
    for (const t of TERRAINS_ARENE) expect(existsSync(`public/assets/${t.image}`)).toBe(true);
    for (const p of PISTES_ARENE) expect(existsSync(`public/assets/sons/musiques/${p.cle}.mp3`), p.cle).toBe(true);
  });

  it('tire les caractéristiques dans la tranche choisie', () => {
    const rng = aleatoireFixe(3);
    for (const t of TRANCHES) {
      const c = tirerCaracs({ mode: 'tranche', tranche: t.cle }, rng);
      for (const v of Object.values(c)) { expect(v).toBeGreaterThanOrEqual(t.min); expect(v).toBeLessThanOrEqual(t.max); }
    }
    const d = tirerCaracs({ mode: 'detail', tranches: { force: 'divin', agilite: 'faible', endurance: 'faible', robustesse: 'faible', intelligence: 'faible', perception: 'faible' } }, rng);
    expect(d.force).toBeGreaterThanOrEqual(900);
    expect(d.agilite).toBeLessThanOrEqual(100);
  });

  it('trois techniques au plus, prises dans le pool ; changer de stade les vide', () => {
    let c = combattantParDefaut('allies', 0);
    const pool = poolArene(c.stade, formeArene(c.stade, c.forme));
    for (const n of pool) c = basculerTechnique(c, n);
    expect(c.techniques).toEqual(pool.slice(0, 3));
    expect(basculerTechnique(c, 'Technique inconnue').techniques).toHaveLength(3);
    c = basculerTechnique(c, pool[0]);
    expect(c.techniques).toHaveLength(2);
    c = changerStade(c, 'bebe');
    expect(c.techniques).toEqual([]);
    expect(techniquesAuHasard(c, aleatoireFixe(1)).techniques).toEqual([]);
    expect(techniquesAuHasard(changerStade(c, 'enfant'), aleatoireFixe(1)).techniques).toHaveLength(2);
  });

  it('ajuste le nombre de combattants en gardant les réglages', () => {
    let l = [combattantParDefaut('allies', 0), combattantParDefaut('adversaires', 0)];
    l[0] = { ...l[0], nom: 'Filo' };
    l = ajusterCamp(l, 'adversaires', 3);
    l = ajusterCamp(l, 'allies', 5);
    expect(l.filter((c) => c.camp === 'allies')).toHaveLength(3);
    expect(l.filter((c) => c.camp === 'adversaires')).toHaveLength(3);
    l = ajusterCamp(l, 'allies', 1);
    expect(l.filter((c) => c.camp === 'allies').map((c) => c.nom)).toEqual(['Filo']);
  });

  it('un combat d’arène à deux contre deux va à son terme, avec les soins d’arène', () => {
    const rng = aleatoireFixe(7);
    let a = techniquesAuHasard({ ...combattantParDefaut('allies', 0), caracs: { mode: 'tranche', tranche: 'expert' } }, rng);
    const b = techniquesAuHasard(combattantParDefaut('allies', 1), rng);
    const x = changerStade(combattantParDefaut('adversaires', 0), 'adulte');
    const y = changerStade(combattantParDefaut('adversaires', 1), 'fragmentes');
    a = { ...a, nom: '  ' };
    const allies = [a, b].map((c) => preparerCombattant(c, rng));
    expect(allies[0].description.nom).toBe('Allié 1');
    const combat = Combat.creer(allies.map((c) => c.description), [x, y].map((c) => preparerCombattant(c, rng).description), { rng, soinsArene: 2 });
    combat.avancer(4000);
    expect(combat.soinArene() || combat.etat.allies[0].ko).toBe(true);
    for (let i = 0; i < 600 * 20 && !combat.termine; i++) combat.avancer(50);
    expect(['victoire', 'defaite']).toContain(combat.etat.resultat);
    expect(combat.etat.soinsArene).toBeLessThanOrEqual(1);
  });
});
