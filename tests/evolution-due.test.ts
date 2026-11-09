import { describe, expect, it } from 'vitest';
import { Simulation, evolutionVue } from '../src/moteur/simulation';
import { nouvellePartie } from '../src/jeu/ranch/sauvegarde';

describe('une évolution due reste due tant que sa séquence n’a pas été vue', () => {
  it('est notée à l’évolution, gardée dans l’état (donc la sauvegarde), effacée une fois vue', () => {
    const e = nouvellePartie('joy');
    const sim = new Simulation(e);
    sim.evoluer('enfant');
    expect(e.evolutionAMontrer).toMatchObject({ de: 'bebe', vers: 'enfant' });
    expect(JSON.parse(JSON.stringify(e)).evolutionAMontrer?.vers).toBe('enfant');
    evolutionVue(e, 'adolescent'); // une autre séquence ne l'efface pas
    expect(e.evolutionAMontrer?.vers).toBe('enfant');
    evolutionVue(e, 'enfant');
    expect(e.evolutionAMontrer).toBeNull();
  });
});
