import { afterEach, describe, expect, it, vi } from 'vitest';
import { texteFin, type ContexteFin } from '../src/jeu/combat/textes';
import { confierPiste, pisteEnRelais, reprendrePiste, type AudioRelais } from '../src/jeu/commun/musique';

const base = (o: Partial<ContexteFin> = {}): ContexteFin => ({
  resultat: 'victoire', registre: 'exploration', arene: false, nom: 'Pépin', enFace: 'Kestrela', nbEnFace: 1,
  allies: 'Pépin', nbAllies: 1, part: 0.8, a: (m) => m, ...o,
});

describe('fin de combat : le résumé', () => {
  it('la deuxième ligne nomme l’écho du joueur, quelle que soit l’issue', () => {
    for (const registre of ['exploration', 'sainte', 'corrompue'] as const) {
      for (const resultat of ['victoire', 'defaite', 'fuite'] as const) {
        for (const part of [0.9, 0.4, 0.1]) {
          const f = texteFin(base({ registre, resultat, part }));
          expect(f.lignes).toHaveLength(2);
          expect(f.lignes[1]).toContain('Pépin');
        }
      }
    }
  });
  it('accorde au pluriel quand ils sont plusieurs en face, sans aucun chiffre', () => {
    const f = texteFin(base({ enFace: 'Phil et Hibert', nbEnFace: 2 }));
    expect(f.lignes[0]).toBe('Phil et Hibert détalent dans les fourrés.');
    expect(f.lignes.join(' ')).not.toMatch(/\d/);
  });
  it('accorde au genre de l’écho', () => {
    const f = texteFin(base({ resultat: 'victoire', part: 0.4, a: (_m, fem) => fem, nom: 'Lune' }));
    expect(f.lignes[1]).toBe('Lune souffle fort, mais elle a l’air fière.');
  });
});

/** Une fausse piste audio : volume, lecture, pause. */
const piste = (): AudioRelais & { paused: boolean } => {
  const a = { volume: 0.4, paused: false, pause() { a.paused = true; } };
  return a as unknown as AudioRelais & { paused: boolean };
};

describe('musique : le relais d’un écran à l’autre', () => {
  afterEach(() => { vi.useRealTimers(); });
  it('une piste confiée continue de jouer, puis s’éteint en fondu si personne ne la reprend', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] });
    const a = piste();
    confierPiste('essai-a', a, { attente: 2000, sortie: 500 });
    vi.advanceTimersByTime(1900);
    expect(a.volume).toBe(0.4);
    expect(pisteEnRelais('essai-a')).toBe(true);
    vi.advanceTimersByTime(700);
    expect(a.paused).toBe(true);
    expect(a.volume).toBe(0);
    expect(reprendrePiste('essai-a')).toBeNull();
  });
  it('l’écran suivant reprend la même piste sans la redémarrer, même en plein fondu', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] });
    const a = piste();
    confierPiste('essai-b', a, { sortie: 1000 });
    vi.advanceTimersByTime(300);
    const v = a.volume;
    expect(v).toBeLessThan(0.4);
    expect(reprendrePiste('essai-b')).toBe(a);
    vi.advanceTimersByTime(2000);
    expect(a.paused).toBe(false);
    expect(a.volume).toBe(v); // le fondu de sortie s'est arrêté : le lecteur qui la reprend la fait remonter
    expect(reprendrePiste('essai-b')).toBeNull(); // reprise une seule fois
    expect(reprendrePiste('autre')).toBeNull();
  });
});
