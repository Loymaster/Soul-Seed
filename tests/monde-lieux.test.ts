import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { creerMonde, poser } from '../src/moteur/monde';
import { nouvellePartie } from '../src/jeu/ranch/sauvegarde';
import { LIEUX, type ContexteLieu } from '../src/jeu/monde/lieux';

const contexte = (maintenant = 100): ContexteLieu => {
  const e = nouvellePartie('joy', 'Pipo');
  return { m: creerMonde(), e, h: 10, maintenant };
};

describe('lieux du village', () => {
  it('au village, la flèche du sanctuaire est en bas ; on en revient par le bas', () => {
    const c = contexte();
    const versSanctuaire = LIEUX.village.passages(c).find((p) => p.vers === 'sanctuaire')!;
    expect(versSanctuaire.position).toBe('bas');
    expect(versSanctuaire.fleche!.angle).toBe(180);
    expect(LIEUX.sanctuaire.passages(c).find((p) => p.vers === 'village')!.position).toBe('bas');
  });

  it('le potager apparaît au village quand Tourby l’a remis en état (12 h après son arrivée), et Tourby s’y tient', () => {
    const c = contexte(100);
    expect(LIEUX.village.passages(c).some((p) => p.vers === 'potager')).toBe(false);
    poser(c.m, 'tourby.recrute'); poser(c.m, 'tourby.potager_a', 110);
    expect(LIEUX.village.passages(c).some((p) => p.vers === 'potager')).toBe(false);
    c.maintenant = 110;
    const passage = LIEUX.village.passages(c).find((p) => p.vers === 'potager')!;
    expect(passage.fleche).toBeDefined();
    // Tourby n'est plus au centre du village, il est au potager
    expect(LIEUX.village.pnj.some((p) => p.id === 'tourby')).toBe(false);
    const tourby = LIEUX.potager.pnj.find((p) => p.id === 'tourby')!;
    expect(tourby.visible(c)).toBe(true);
    expect(tourby.premier!(c)).toEqual({ scene: 'tourby', sujet: 'parler' });
    expect(existsSync(`public/assets/${LIEUX.potager.decor(c)}`)).toBe(true);
    expect(LIEUX.potager.passages(c).map((p) => p.vers)).toEqual(['village']);
  });
});
