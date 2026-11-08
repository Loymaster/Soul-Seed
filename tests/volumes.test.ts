import { describe, expect, it, vi } from 'vitest';
import { ATTENUATION_MUSIQUE, ecouterVolumes, fixerVolumes, reglageMusique, volumeBruitages, volumeMusique } from '../src/jeu/commun/volumes';
import { SFX } from '../src/moteur/sfx';

describe('volumes', () => {
  it('règlent séparément la musique et les bruitages, et préviennent les musiques en cours', () => {
    const ecoute = vi.fn();
    const fin = ecouterVolumes(ecoute);
    fixerVolumes({ musique: 0.3, bruitages: 0.6 });
    expect(reglageMusique()).toBe(0.3);
    expect(volumeMusique()).toBeCloseTo(0.3 * ATTENUATION_MUSIQUE); // atténuation native, puis le réglage du joueur
    expect(volumeBruitages()).toBe(0.6);
    expect(SFX.niveau).toBe(0.6);
    expect(ecoute).toHaveBeenCalledTimes(1);
    fixerVolumes({ musique: 0.3, bruitages: 0.6 }); // inchangé : personne n'est dérangé
    expect(ecoute).toHaveBeenCalledTimes(1);
    fixerVolumes({ musique: 2 });
    expect(reglageMusique()).toBe(1);
    expect(volumeMusique()).toBe(0.5); // même au maximum, la musique reste à moitié de son niveau d'origine
    fin();
  });
});
