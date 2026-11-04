import { describe, expect, it } from 'vitest';
// @ts-expect-error — modules JS de l'outillage
import { destination, normaliserNom } from '../outils/assets/regles.mjs';
// @ts-expect-error — modules JS de l'outillage
import { decrireForme } from '../outils/assets/catalogue.mjs';
import { placer, rogner, LIGNE_PIEDS } from '../src/moteur/scene/placement';

const PNJ = { jumpy: { nom: 'Jumpy', prefixes: ['jumpy'] }, myhra: { nom: 'Myhra', prefixes: ['myhra', 'myrha', 'gardienne'] }, 'lady-roger': { nom: 'Lady Roger', prefixes: ['lady-roger'] } };

describe('règles de rangement', () => {
  it('range les PNJ par personnage, alias compris', () => {
    expect(destination('jumpy-boude.png', PNJ)).toBe('pnj/jumpy/boude.png');
    expect(destination('Gardienne-Inquiète.PNG', PNJ)).toBe('pnj/myhra/inquiete.png');
    expect(destination('lady-roger.png', PNJ)).toBe('pnj/lady-roger/neutre.png');
  });
  it('range les échos par stade', () => {
    expect(destination('enfant-dark-joy.png', PNJ)).toBe('echos/enfant/dark-joy.png');
    expect(destination('ado-branch-j-dd.png', PNJ)).toBe('echos/adolescent/branch-j-dd.png');
    expect(destination('seed-fear.png', PNJ)).toBe('echos/graines/fear.png');
  });
  it('range le monde et l’interface', () => {
    expect(destination('village-place.png', PNJ)).toBe('decors/village/place.png');
    expect(destination('icon-coeur.png', PNJ)).toBe('interface/icones/coeur.png');
    expect(destination('music-theme.mp3', PNJ)).toBe('sons/musiques/theme.mp3');
  });
  it('laisse à trier ce qu’aucune règle ne reconnaît', () => {
    expect(destination('mystere.png', PNJ)).toBeNull();
  });
  it('normalise les noms', () => {
    expect(normaliserNom('Mystère Final (2).PNG')).toBe('mystere-final-2.png');
  });
});

describe('formes d’écho', () => {
  it('reconnaît les conventions de nommage', () => {
    expect(decrireForme('enfant', 'dark-wrath')).toMatchObject({ type: 'sombre', lignees: ['wrath'], sombre: true });
    expect(decrireForme('adulte', 'joy-f')).toMatchObject({ type: 'pure', genre: 'f' });
    expect(decrireForme('adulte', 'branch-j-dd')).toMatchObject({ type: 'branche', lignees: ['joy', 'disgust'] });
    expect(decrireForme('adulte', 'melee-jwf')).toMatchObject({ type: 'melee', lignees: ['joy', 'wrath', 'fear'] });
    expect(decrireForme('adulte', 'memoire-s-eau')).toMatchObject({ type: 'memoire', element: 'eau' });
    expect(decrireForme('adolescent', 'fragment-socio').type).toBe('fragment');
  });
});

describe('placement en scène', () => {
  it('pose les pieds sur la ligne et respecte la taille réelle', () => {
    expect(placer(1.9, 1)).toEqual({ hauteur: Math.round(1.9 * 245), bas: LIGNE_PIEDS });
    const jumpy = placer(1.3, 0.86);
    expect(jumpy.hauteur).toBe(Math.round(1.3 * 245 * 0.86));
    expect(jumpy.bas).toBeGreaterThan(LIGNE_PIEDS);
  });
  it('rogne une image à sa boîte utile', () => {
    const r = rogner({ l: 1000, h: 2000, boite: { x: 100, y: 200, l: 500, h: 1000 } }, 500);
    expect(r.cadre).toEqual({ width: 250, height: 500 });
    expect(r.image).toEqual({ width: 500, height: 1000, left: -50, top: -100 });
  });
});
