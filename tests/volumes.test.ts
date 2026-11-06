import { describe, expect, it, vi } from 'vitest';
import { ecouterVolumes, fixerVolumes, volumeBruitages, volumeMusique } from '../src/jeu/commun/volumes';
import { SFX } from '../src/moteur/sfx';

describe('volumes', () => {
  it('règlent séparément la musique et les bruitages, et préviennent les musiques en cours', () => {
    const ecoute = vi.fn();
    const fin = ecouterVolumes(ecoute);
    fixerVolumes({ musique: 0.3, bruitages: 0.6 });
    expect(volumeMusique()).toBe(0.3);
    expect(volumeBruitages()).toBe(0.6);
    expect(SFX.niveau).toBe(0.6);
    expect(ecoute).toHaveBeenCalledTimes(1);
    fixerVolumes({ musique: 0.3, bruitages: 0.6 }); // inchangé : personne n'est dérangé
    expect(ecoute).toHaveBeenCalledTimes(1);
    fixerVolumes({ musique: 2 });
    expect(volumeMusique()).toBe(1);
    fin();
  });
});
