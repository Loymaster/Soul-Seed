import { beforeEach, describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CHEMINS_CADRES, cadrage, cadrageCalcule } from '../src/jeu/scene/cadrages';

// localStorage minimal (les profils sont rangés dans le navigateur)
const magasin = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => magasin.get(k) ?? null,
  setItem: (k: string, v: string) => { magasin.set(k, String(v)); },
  removeItem: (k: string) => { magasin.delete(k); },
  clear: () => magasin.clear(),
  key: () => null,
  length: 0,
} as Storage;

const P = await import('../src/jeu/profils');

describe('profils', () => {
  beforeEach(() => magasin.clear());

  it('un profil ne demande qu’un nom ; la musique est à 50 % par défaut', () => {
    const p = P.creerProfil('  Loïs ');
    expect(p.nom).toBe('Loïs');
    expect(p.avatar).toBeUndefined();
    expect(p.pronom).toBeUndefined();
    expect(P.volumeMusiqueDe(p.reglages)).toBe(50);
    expect(P.volumeBruitagesDe(p.reglages)).toBe(80);
  });

  it('chaque partie a son personnage ; les anciens profils gardent le leur en repli', () => {
    const p = P.creerProfil('Loïs');
    P.sauverPersonnage(p.id, 1, { nom: 'Lou', pronom: 'elle', avatar: 'fille-2' });
    expect(P.chargerPersonnage(p, 1).nom).toBe('Lou');
    expect(P.chargerPersonnage(p, 0)).toEqual({ nom: 'Loïs', pronom: 'iel', avatar: 'nb-1' });
    expect(P.chargerPersonnage({ ...p, pronom: 'il', avatar: 'garcon-2' }, 0)).toEqual({ nom: 'Loïs', pronom: 'il', avatar: 'garcon-2' });
  });

  it('les anciens profils passent à 50 % de musique, sauf réglage choisi', () => {
    const ancien = (id: string, volumeMusique?: number) => ({ id, nom: id, avatar: 'fille-1', pronom: 'elle', creeLe: '', vuLe: '', memoire: [], reglages: { sons: true, musique: true, volumeMusique, volumeBruitages: 80 } });
    localStorage.setItem('soulseed:profils', JSON.stringify({ version: 1, actif: 'a', profils: [ancien('a', 80), ancien('b', 35), ancien('c')] }));
    const [a, b, c] = P.registre().profils;
    expect([a.reglages.volumeMusique, b.reglages.volumeMusique, c.reglages.volumeMusique]).toEqual([50, 35, 50]);
    // la migration n'a lieu qu'une fois : un 80 choisi ensuite est respecté
    P.modifierProfil('a', { reglages: { ...a.reglages, volumeMusique: 80 } });
    expect(P.registre().profils[0].reglages.volumeMusique).toBe(80);
  });
});

describe('cadrage des visages dans les médaillons', () => {
  it('toutes les images d’écho (bébé à adulte) ont un cadrage réglé à la main', () => {
    const racine = join(__dirname, '../public/assets/echos');
    const images = ['bebe', 'enfant', 'adolescent', 'adulte'].flatMap((d) => readdirSync(join(racine, d)).filter((f) => f.endsWith('.png')).map((f) => `echos/${d}/${f}`));
    expect(images.length).toBeGreaterThan(80);
    expect(images.filter((c) => !CHEMINS_CADRES.includes(c))).toEqual([]);
    for (const c of CHEMINS_CADRES) {
      const k = cadrage(c, 500, 500);
      expect(k.x).toBeGreaterThan(0); expect(k.x).toBeLessThan(1);
      expect(k.y).toBeGreaterThan(0); expect(k.y).toBeLessThan(1);
      expect(k.d).toBeGreaterThan(0.1); expect(k.d).toBeLessThanOrEqual(1);
    }
  });

  it('une image non listée est cadrée sur le haut de sa silhouette opaque', () => {
    const k = cadrageCalcule(400, 800, { x: 100, y: 200, l: 200, h: 500 });
    expect(k.x).toBeCloseTo(0.5);
    expect(k.d).toBeCloseTo(0.3);
    expect(k.y * 800).toBeLessThan(200 + 500 / 2);
    expect(cadrage('echos/adulte/inconnu.png', 400, 800, { x: 100, y: 200, l: 200, h: 500 })).toEqual(k);
  });
});
