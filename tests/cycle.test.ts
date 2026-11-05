import { describe, expect, it } from 'vitest';
import { analyserScene } from '../src/moteur/scene/analyseur';
import { LecteurScene } from '../src/moteur/scene/lecteur';
import { creerEcho } from '../src/moteur/simulation';
import { epitaphe } from '../src/jeu/mort/epitaphes';
import { avatarDe } from '../src/jeu/profils';

describe('actions mises en scène par le jeu', () => {
  const source = [
    'décor: village/sanctuaire',
    'myhra: Regardez !',
    'action: eclosion',
    'action: nommer-echo',
    'myhra: {echo.nom}… Si c’est votre choix.',
    'action: image pnj/garry/attaque-jumpy',
  ].join('\n');

  it('sont reconnues par l’analyseur', () => {
    const { scene, problemes } = analyserScene(source, 'essai');
    expect(problemes).toEqual([]);
    expect(scene.corps.filter((n) => n.type === 'action').map((n) => n.type === 'action' && [n.nom, n.argument ?? null])).toEqual([
      ['eclosion', null], ['nommer-echo', null], ['image', 'pnj/garry/attaque-jumpy'],
    ]);
  });

  it('une action inconnue est signalée', () => {
    expect(analyserScene('action: danser', 'essai').problemes[0].message).toMatch(/Action inconnue/);
  });

  it('le lecteur s’arrête sur l’action, et la suite voit les variables données par le jeu', () => {
    const l = new LecteurScene(analyserScene(source, 'essai').scene);
    expect(l.suivant().evenement).toMatchObject({ type: 'replique', texte: 'Regardez !' });
    expect(l.suivant().evenement).toMatchObject({ type: 'action', nom: 'eclosion' });
    expect(l.suivant().evenement).toMatchObject({ type: 'action', nom: 'nommer-echo' });
    l.definir('echo.nom', 'Filo');
    expect(l.suivant().evenement).toMatchObject({ type: 'replique', texte: 'Filo… Si c’est votre choix.' });
  });

  it('« jouer depuis une ligne » passe par-dessus les actions', () => {
    const l = new LecteurScene(analyserScene(source, 'essai').scene, { depuisLigne: 5 });
    expect(l.suivant().evenement).toMatchObject({ type: 'replique', ligne: 5 });
  });
});

describe('personnage et mémoire', () => {
  it('l’astre choisit l’image du personnage dans la famille de son pronom', () => {
    expect(avatarDe('il', 'soleil')).toBe('garcon-1');
    expect(avatarDe('elle', 'lune')).toBe('fille-2');
    expect(avatarDe('iel', 'soleil')).toBe('nb-1');
  });

  it('l’épitaphe suit l’ordre de priorité', () => {
    const e = creerEcho({ nom: 'Fila', genre: 'f', graine: 'joy' }, () => 0.5);
    expect(epitaphe({ ...e, mort: 'vieillesse', garryVaincu: true })).toBe('Elle a vécu chaque saison jusqu’à la dernière.');
    expect(epitaphe({ ...e, mort: 'maladie', garryVaincu: true })).toBe('Elle a affronté plus grand qu’elle, et n’a jamais renoncé.');
    expect(epitaphe({ ...e, mort: 'faim' })).toBe('Le ventre vide, mais le cœur plein de vous.');
    expect(epitaphe({ ...e, mort: 'maladie', stade: 'enfant' })).toBe('Même affaiblie, elle cherchait encore votre regard.');
  });
});
