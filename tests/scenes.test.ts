import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { analyserScene } from '../src/moteur/scene/analyseur';
import { LecteurScene, type Pas } from '../src/moteur/scene/lecteur';
import { validerScene, type ContexteScene } from '../src/moteur/scene/valider';
import { analyserExpression, evaluer } from '../src/moteur/scene/expressions';

const SOURCE = readFileSync(new URL('../contenu/scenes/village-garry-01.scene', import.meta.url), 'utf8');
const CTX: ContexteScene = {
  pnj: { myhra: { nom: 'Myhra', expressions: ['neutre'] }, garry: { nom: 'Garry', expressions: ['face'] }, jumpy: { nom: 'Jumpy', expressions: ['surpris', 'rit', 'face'] } },
  emotions: ['anxieux', 'fier', 'surpris', 'joyeux'],
  decors: ['decors/village/sanctuaire.png'],
  musiques: ['sons/musiques/intro-mystery.mp3'],
  scenes: ['village-garry-01']
};

function jouer(lecteur: LecteurScene, choix: number[] = []) {
  const pas: Pas[] = [];
  for (let i = 0; i < 100; i++) {
    const p = lecteur.suivant();
    pas.push(p);
    if (p.evenement.type === 'fin') break;
    if (p.evenement.type === 'choix') lecteur.choisir(choix.shift() ?? p.evenement.options[0].index);
  }
  return pas;
}

describe('expressions', () => {
  it('évalue conditions et calculs', () => {
    const v: Record<string, number | boolean> = { 'a.b': 2, c: true };
    const lire = (n: string) => v[n];
    expect(evaluer(analyserExpression('a.b >= 2 et non d'), lire)).toBe(true);
    expect(evaluer(analyserExpression('(a.b + 1) * 2 == 6 ou faux'), lire)).toBe(true);
    expect(evaluer(analyserExpression('inconnue'), lire)).toBe(0);
    expect(() => analyserExpression('a >= ')).toThrow();
  });
});

describe('analyse du format de scène', () => {
  it('lit la scène d’exemple sans erreur', () => {
    const { scene, problemes } = analyserScene(SOURCE, 'village-garry-01');
    expect(problemes).toEqual([]);
    expect(scene.titre).toBe('Garry au village');
    expect(scene.places.map((p) => `${p.qui}@${p.place}`)).toEqual(['myhra@G1', 'garry@D2']);
    expect(scene.corps.find((n) => n.type === 'choix')).toMatchObject({ question: 'Que répondre ?', options: [{ resonance: 'resolution' }, { resonance: 'observation' }, { resonance: 'anticipation' }] });
    expect(validerScene(scene, CTX)).toEqual([]);
  });
  it('signale les erreurs ligne par ligne sans s’arrêter', () => {
    const { problemes } = analyserScene('décor: x\nmyhra: Bonjour\nn importe quoi\nchoix:\n  > colère « Non »\nsi a >= :\n  myhra: …', 't');
    expect(problemes.map((p) => p.ligne)).toEqual([3, 5, 6]);
  });
  it('valide personnages, expressions, émotions et décors', () => {
    const { scene } = analyserScene('décor: foret\njumpi: Salut\njumpy [fache]: Grr\nécho: (furax)\naller: ailleurs', 't');
    const msgs = validerScene(scene, CTX).map((p) => `${p.ligne}:${p.niveau}`);
    expect(msgs).toEqual(expect.arrayContaining(['1:erreur', '2:erreur', '3:erreur', '4:erreur', '5:erreur']));
  });
});

describe('lecture', () => {
  it('déroule la scène, applique les choix et les conditions', () => {
    const { scene } = analyserScene(SOURCE, 'village-garry-01');
    const l = new LecteurScene(scene, { variables: { 'echo.nom': 'Filo' } });
    const pas = jouer(l, [0]);
    const repliques = pas.filter((p) => p.evenement.type === 'replique').map((p) => (p.evenement as { texte: string }).texte);
    expect(repliques[2]).toBe("Hé ! Tu ne t'approches pas de Filo, compris ?");
    expect(l.etat.variables['garry.relation']).toBe(-1);
    expect(repliques.at(-1)).toMatch(/Bien envoyé/);
    expect(Object.keys(l.etat.presents).sort()).toEqual(['jumpy', 'myhra']);
  });
  it('prend la branche « sinon si » selon le choix', () => {
    const { scene } = analyserScene(SOURCE, 'x');
    const l = new LecteurScene(scene, { variables: { 'echo.nom': 'Filo' } });
    const pas = jouer(l, [1]);
    expect((pas.at(-2)!.evenement as { texte: string }).texte).toMatch(/embobiner/);
  });
  it('démarre depuis une ligne en reconstituant la mise en scène', () => {
    const { scene } = analyserScene(SOURCE, 'x');
    const ligne = SOURCE.split('\n').findIndex((l) => l.includes('Parce qu')) + 1;
    const l = new LecteurScene(scene, { variables: { 'echo.nom': 'Filo' }, depuisLigne: ligne });
    expect(l.etat.presents.jumpy).toEqual({ place: 'G2', expression: 'surpris' });
    expect(l.etat.variables['indices.garry']).toBe(1);
    expect((l.suivant().evenement as { texte: string }).texte).toMatch(/^Parce qu/);
  });
});
