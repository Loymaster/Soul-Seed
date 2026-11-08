import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as M from '../src/moteur/voix/moteur-voix.js';
import { CHEMIN_PAGE, construirePage } from '../outils/voix/construire.mjs';

const fiches = readdirSync('contenu/personnages').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`contenu/personnages/${f}`, 'utf8')));

describe('voix de dialogue', () => {
  it('propose une bibliothèque variée, chaque voix jouée par un instrument existant', () => {
    const voix = Object.entries(M.VOIX);
    expect(voix.length).toBeGreaterThanOrEqual(30);
    expect(new Set(voix.map(([, v]) => v.instrument)).size).toBeGreaterThanOrEqual(25);
    for (const [, v] of voix) {
      expect(M.INSTRUMENTS).toHaveProperty(v.instrument);
      expect(M.FAMILLES).toHaveProperty(v.famille);
      expect(M.GAMMES).toHaveProperty(v.gamme);
      expect(M.CADENCES).toHaveProperty(v.cadence);
    }
  });
  it('complète les réglages d’une fiche, avec un repli par défaut', () => {
    expect(M.reglagesVoix({ timbre: 'harpe', note: 300 })).toMatchObject({ id: 'harpe', instrument: 'harpe', note: 300, cadence: 'syllabe' });
    expect(M.reglagesVoix({ timbre: 'inconnue' }).id).toBe(M.VOIX_PAR_DEFAUT);
    expect(M.reglagesVoix(undefined).id).toBe(M.VOIX_PAR_DEFAUT);
    expect(M.reglagesVoix({ timbre: 'kalimba', cadence: 'mot', volume: 0.5 })).toMatchObject({ cadence: 'mot', volume: 0.5 });
  });
  it('garde la hauteur des anciens timbres (une note par lettre, gamme pentatonique)', () => {
    const r = M.reglagesVoix({ timbre: 'doux', note: 392 });
    const u = M.unite('a', 0, r.cadence)!;
    const st = [0, 2, 4, 7, 9][('a'.charCodeAt(0) * 7) % 5];
    expect(M.hauteur(r, u)).toBeCloseTo(392 * Math.pow(2, st / 12));
  });
  it('découpe le texte selon la cadence', () => {
    const texte = 'Bonjour, petit écho !';
    const notes = (cadence: string) => [...texte].filter((_, i) => M.unite(texte, i, cadence)).length;
    expect(notes('lettre')).toBe(16);
    expect(notes('mot')).toBe(3);
    expect(notes('syllabe')).toBe(6); // bon·jour·pe·tit·é·cho
    expect(M.unite('Tu viens ?', 4, 'syllabe')?.question).toBe(true);
    expect(M.unite('Tu viens ?', 1, 'syllabe')?.question).toBe(false);
    expect(M.voyelleDe('jour')).toBe('ou');
  });
  it('donne une voix connue à chaque PNJ, et sa voix d’autrefois à l’homme mystérieux', () => {
    for (const f of fiches) expect(M.VOIX, f.id).toHaveProperty(f.voix.timbre);
    expect(fiches.find((f) => f.id === 'homme-mysterieux')?.voix).toMatchObject({ timbre: 'mystere', cadence: 'mot' });
  });
  it('page d’essai à jour (moteur et fiches) : sinon `npm run voix`', () => {
    expect(readFileSync(CHEMIN_PAGE, 'utf8')).toBe(construirePage());
  });
});
