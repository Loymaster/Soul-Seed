// Le sac : capacité, jeter, recevoir un objet quand le sac est plein (règles sans affichage + file des demandes).
import { afterEach, describe, expect, it } from 'vitest';
import { aleatoireFixe, creerEcho, type Etat } from '../src/moteur/simulation';
import { TAILLE_SAC } from '../src/moteur/simulation/constantes';
import { aDeLaPlace, jetable, jeter, jeterPuisRanger, ranger, sacPlein } from '../src/moteur/simulation/objets';
import { acheter, creerMonde, reprendreObjet } from '../src/moteur/monde';
import { demandeCourante, demanderPlace, recevoir, recevoirTous, repondre, viderReceptions } from '../src/jeu/commun/reception';

function echo(): Etat {
  const e = creerEcho({ nom: 'Filo', genre: 'm', graine: 'joy', lignee: 'primaire', rythme: 'diurne' }, aleatoireFixe(1));
  e.inventaire = Array(TAILLE_SAC).fill(null);
  return e;
}
/** Un sac plein : dix piles différentes. */
function plein(): Etat {
  const e = echo();
  ['pomme', 'bandage', 'medicament', 'graine_vie', 'feuille_vie', 'repousse', 'appat_echo', 'pierre_ardente', 'eclat_ame', 'marteau_ash']
    .forEach((id, i) => { e.inventaire[i] = { id, qte: i === 0 ? 3 : 1 }; });
  return e;
}
afterEach(() => viderReceptions());

describe('capacité du sac', () => {
  it('dix emplacements, une pile par emplacement, les piles sans limite', () => {
    const e = echo();
    expect(e.inventaire).toHaveLength(10);
    expect(sacPlein(e)).toBe(false);
    const f = plein();
    expect(sacPlein(f)).toBe(true);
    expect(aDeLaPlace(f, 'pomme')).toBe(true); // sa pile existe
    expect(aDeLaPlace(f, 'tente')).toBe(false);
    expect(ranger(f, 'pomme', 5)).toBe(5);
    expect(f.inventaire[0]).toEqual({ id: 'pomme', qte: 8 });
    expect(ranger(f, 'tente')).toBe(0);
  });
});

describe('jeter', () => {
  it('un exemplaire, ou toute la pile (par défaut), qui libère l’emplacement', () => {
    const e = plein();
    expect(jeter(e, 0, 1)).toBe(1);
    expect(e.inventaire[0]).toEqual({ id: 'pomme', qte: 2 });
    expect(sacPlein(e)).toBe(true);
    expect(jeter(e, 0)).toBe(2);
    expect(e.inventaire[0]).toBeNull();
    expect(sacPlein(e)).toBe(false);
    expect(jeter(e, 0)).toBe(0); // case vide
  });
  it('les objets de quête ne se jettent pas', () => {
    const e = plein();
    expect(jetable('marteau_ash')).toBe(false);
    expect(jetable('pomme')).toBe(true);
    expect(jeter(e, 9)).toBe(0);
    expect(e.inventaire[9]?.id).toBe('marteau_ash');
    expect(jeterPuisRanger(e, 9, 'tente')).toBe(false);
  });
  it('jeter puis ranger : la pile part, l’objet reçu prend sa place', () => {
    const e = plein();
    expect(jeterPuisRanger(e, 1, 'tente')).toBe(true);
    expect(e.inventaire[1]).toEqual({ id: 'tente', qte: 1 });
    expect(e.inventaire.some((c) => c?.id === 'bandage')).toBe(false);
  });
});

describe('recevoir un objet', () => {
  it('avec de la place : rangé aussitôt, sans rien demander', async () => {
    const e = echo();
    expect(await recevoir(e, 'poisson_vairon')).toBe(true);
    expect(demandeCourante()).toBeNull();
    expect(e.inventaire[0]).toEqual({ id: 'poisson_vairon', qte: 1 });
  });
  it('sac plein : une demande attend ; jeter une pile range l’objet reçu', async () => {
    const e = plein();
    const p = recevoir(e, 'poisson_vairon');
    const d = demandeCourante();
    expect(d).toMatchObject({ id: 'poisson_vairon', qte: 1, mode: 'recevoir' });
    expect(repondre(9)).toBe(false); // le marteau d'Ash : refusé, la demande reste
    expect(demandeCourante()).toBe(d);
    expect(repondre(2)).toBe(true);
    expect(await p).toBe(true);
    expect(e.inventaire[2]).toEqual({ id: 'poisson_vairon', qte: 1 });
    expect(demandeCourante()).toBeNull();
  });
  it('sac plein : laisser l’objet ne change rien au sac', async () => {
    const e = plein();
    const avant = JSON.stringify(e.inventaire);
    const p = recevoir(e, 'poisson_vairon');
    repondre(null);
    expect(await p).toBe(false);
    expect(JSON.stringify(e.inventaire)).toBe(avant);
  });
  it('plusieurs objets : une demande après l’autre, ceux qu’on laisse sont rendus', async () => {
    const e = plein();
    const p = recevoirTous(e, ['mures', 'pomme', 'truffe']);
    await Promise.resolve();
    expect(demandeCourante()?.id).toBe('mures');
    repondre(3);
    await new Promise((r) => setTimeout(r, 0));
    // la pomme a rejoint sa pile sans rien demander ; la truffe attend
    expect(demandeCourante()?.id).toBe('truffe');
    repondre(null);
    expect(await p).toEqual([{ id: 'truffe', qte: 1 }]);
    expect(e.inventaire[0]).toEqual({ id: 'pomme', qte: 4 });
    expect(e.inventaire[3]).toEqual({ id: 'mures', qte: 1 });
  });
  it('faire de la place avant un achat : on jette, puis l’achat passe', async () => {
    const e = plein();
    const m = creerMonde();
    m.boutique = { jour: e.jour, etal: [{ categorie: 'Équipement', id: 'tente', prix: 10, stock: 1 }] };
    e.or = 100;
    const r = acheter(e, m, 0);
    expect(r).toMatchObject({ ok: false, sacPlein: true });
    expect(e.or).toBe(100);
    const p = demanderPlace(e, 'tente');
    expect(demandeCourante()?.mode).toBe('place');
    repondre(5);
    expect(await p).toBe(true);
    expect(e.inventaire[5]).toBeNull();
    expect(acheter(e, m, 0)).toMatchObject({ ok: true });
    expect(e.inventaire[5]).toEqual({ id: 'tente', qte: 1 });
  });
  it('le coffre signale un sac plein (l’objet y reste)', () => {
    const e = plein();
    const m = creerMonde();
    m.coffre.objets[0] = { id: 'tente', qte: 1 };
    expect(reprendreObjet(e, m, 0)).toMatchObject({ ok: false, sacPlein: true });
    expect(m.coffre.objets[0]).toEqual({ id: 'tente', qte: 1 });
  });
});
