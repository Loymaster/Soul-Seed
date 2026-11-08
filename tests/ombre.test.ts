import { describe, expect, it } from 'vitest';
import { mesurerAlpha, ombreSous, piedsRepli } from '../src/jeu/commun/ombre';

/** Une image de 100 × 100 : un corps (rectangle) et deux pieds écartés, avec du vide sous les pieds. */
function image(pieds: [number, number][], videDessous = 10) {
  const l = 100, h = 100, a = new Uint8ClampedArray(l * h);
  for (let y = 10; y < 60; y++) for (let x = 30; x < 70; x++) a[y * l + x] = 255;
  for (const [x0, x1] of pieds) for (let y = 60; y < h - videDessous; y++) for (let x = x0; x < x1; x++) a[y * l + x] = 255;
  return { a, l, h };
}

describe('ombre depuis la silhouette', () => {
  it('trouve le bas de la silhouette et ce qui touche le sol', () => {
    const { a, l, h } = image([[20, 30], [60, 70]]);
    const p = mesurerAlpha(a, l, h);
    expect(p.bas).toBeCloseTo(0.9, 2);
    expect(p.cx).toBeCloseTo(0.45, 1);
    expect(p.l).toBeGreaterThan(0.4);
    expect(p.l).toBeLessThan(0.6);
  });
  it('se pose sous les pieds, à leur hauteur, et suit le retournement', () => {
    const { a, l, h } = image([[60, 80]], 20); // un seul appui, à droite, avec 20 % de vide dessous
    const p = mesurerAlpha(a, l, h);
    const o = ombreSous(p, { hImage: 100, echelle: 1 });
    expect(Math.abs(o.b + o.h / 2 - 20)).toBeLessThanOrEqual(1); // au niveau du bas de la silhouette, pas du bas de l'image
    expect(o.x + o.l / 2).toBeGreaterThan(60);
    const g = ombreSous(p, { hImage: 100, echelle: 1, gauche: true });
    expect(g.x + g.l / 2).toBeLessThan(40);
  });
  it('rétrécit et pâlit avec la hauteur (vol), reste au sol', () => {
    const p = piedsRepli(100, 100, { x: 20, y: 0, l: 60, h: 90 });
    const sol = ombreSous(p, { hImage: 100, echelle: 1, enLAir: true, hauteur: 0 });
    const haut = ombreSous(p, { hImage: 100, echelle: 1, enLAir: true, hauteur: 80 });
    expect(haut.l).toBeLessThan(sol.l);
    expect(haut.o).toBeLessThan(sol.o);
    expect(Math.abs(haut.b + haut.h / 2 - (sol.b + sol.h / 2))).toBeLessThanOrEqual(1);
  });
  it('suit la taille de l’écho', () => {
    const p = piedsRepli(100, 100, { x: 20, y: 0, l: 60, h: 100 });
    expect(ombreSous(p, { hImage: 190, echelle: 0.5 }).l).toBeLessThan(ombreSous(p, { hImage: 190, echelle: 1.1 }).l);
  });
});
