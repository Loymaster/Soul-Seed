import { describe, expect, it } from 'vitest';
import { interpoler } from '../src/moteur/scene/expressions';

const avec = (v: Record<string, string>) => (nom: string) => v[nom];

describe('accords dans les répliques', () => {
  const t = 'Tu es {joueur:prêt|prête|prêt·e}, {joueur.nom} ?';
  it('suit le pronom du joueur', () => {
    expect(interpoler(t, avec({ 'joueur.nom': 'Loïs', 'joueur.pronom': 'il' }))).toBe('Tu es prêt, Loïs ?');
    expect(interpoler(t, avec({ 'joueur.nom': 'Loïs', 'joueur.pronom': 'elle' }))).toBe('Tu es prête, Loïs ?');
    expect(interpoler(t, avec({ 'joueur.nom': 'Loïs', 'joueur.pronom': 'iel' }))).toBe('Tu es prêt·e, Loïs ?');
  });
  it('suit le genre de l’écho', () => {
    expect(interpoler('{echo.nom} est {echo:content|contente}.', avec({ 'echo.nom': 'Fila', 'echo.genre': 'f' }))).toBe('Fila est contente.');
    expect(interpoler('{echo:content|contente}', avec({ 'echo.genre': 'm' }))).toBe('content');
  });
});
