import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CHEMINS_ALLURES, allureDe, classesAllure, resumeAllures } from '../src/jeu/commun/allures';
import { profilEcho } from '../src/jeu/ranch/demarche';
import { allureCombat } from '../src/jeu/combat/allures';

const racine = join(__dirname, '../public/assets/echos');
const images = [
  ...readdirSync(racine).filter((f) => f.endsWith('.png')),
  ...['graines', 'bebe', 'enfant', 'adolescent', 'adulte'].flatMap((d) => readdirSync(join(racine, d)).filter((f) => f.endsWith('.png')).map((f) => `${d}/${f}`)),
];

describe('allures des échos', () => {
  it('toute image d’écho a une allure réglée à la main (et la table ne garde pas d’image disparue)', () => {
    expect(images.length).toBeGreaterThan(90);
    expect(images.filter((c) => !CHEMINS_ALLURES.includes(c))).toEqual([]);
    expect(CHEMINS_ALLURES.filter((c) => !images.includes(c))).toEqual([]);
  });

  it('chaque démarche est représentée, les graines ne bougent pas', () => {
    const r = resumeAllures();
    for (const d of ['bipede', 'quadrupede', 'sautillant', 'rampant', 'flottant', 'vole', 'nage'] as const) expect(r[d]?.length).toBeGreaterThan(0);
    expect(r.immobile.every((c) => c.startsWith('graines/'))).toBe(true);
  });

  it('les chemins se lisent sous toutes leurs formes', () => {
    expect(allureDe('echos/adulte/fear.png')?.demarche).toBe('vole');
    expect(allureDe('/assets/echos/bebe/disgust.png?v=2')?.demarche).toBe('rampant');
    expect(allureDe('pnj/jumpy/jumpy-neutre.png')).toBeNull();
  });

  it('les volants s’élèvent, les marcheurs restent au sol ; la carrure ralentit', () => {
    const adulte = { stade: 'adulte' as const, taille: 1, poids: 30 };
    const vole = profilEcho(adulte, allureDe('echos/adulte/fear.png')!);
    const marche = profilEcho(adulte, allureDe('echos/adulte/joy-m.png')!);
    const lourd = profilEcho(adulte, allureDe('echos/adulte/wrath.png')!);
    expect(vole.hauteur).toBeGreaterThan(20);
    expect(vole.classes).toMatch(/al-vole/);
    expect(vole.classes).toMatch(/al-h\d+/);
    expect(marche.hauteur).toBe(0);
    expect(lourd.cycle).toBeGreaterThan(marche.cycle);
    expect(lourd.vitesse).toBeLessThan(marche.vitesse);
    expect(classesAllure(allureDe('echos/enfant/joy.png')!)).toBe('al al-bipede al-moyen al-p2');
    expect(allureCombat('echos/adulte/fear.png', 300).altitude).toBeGreaterThan(0);
    expect(allureCombat('pnj/x.png', 300)).toEqual({ classes: '', altitude: 0, cycle: 0.35 });
  });
});
