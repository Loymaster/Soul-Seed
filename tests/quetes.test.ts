import { describe, expect, it } from 'vitest';
import {
  QUETES, changerRelationPnj, creerMonde, lireQuetes, lireRelationsPnj, normaliserMonde, poser, recruter, synchroniserQuetes,
} from '../src/moteur/monde';
import { FRAGMENTS, LIGNEES, MEMOIRES, arbre, compte, ligneeDe, noeuds, revelees } from '../src/jeu/commun/carnet/arbre';
import { apparence } from '../src/moteur/simulation';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ids = (l: { id: string }[]) => l.map((q) => q.id);

describe('quêtes du carnet', () => {
  it('au début : Myhra, Jumpy et Garry (difficile) ; les deux quêtes majeures du village attendent Myhra', () => {
    const m = creerMonde();
    const { enCours, terminees } = lireQuetes(m);
    expect(ids(enCours).sort()).toEqual(['garry', 'jumpy-argent', 'myhra-village']);
    expect(terminees).toEqual([]);
    expect(enCours.find((q) => q.id === 'garry')!.difficile).toBe(true);
    // seule l'étape en cours est montrée, les suivantes restent à écrire
    const myhra = enCours.find((q) => q.id === 'myhra-village')!;
    expect(myhra.etapes.map((e) => e.courante)).toEqual([true]);
    expect(myhra.restantes).toBe(1);
  });

  it('parler du village à Myhra termine sa quête et ouvre « Augmenter la prospérité » et « Rebâtir le village »', () => {
    const m = creerMonde();
    poser(m, 'myhra.vue');
    expect(lireQuetes(m).enCours.find((q) => q.id === 'myhra-village')!.etapes.map((e) => e.faite)).toEqual([true, false]);
    poser(m, 'myhra.village');
    const l = lireQuetes(m);
    expect(ids(l.terminees)).toEqual(['myhra-village']);
    expect(ids(l.enCours)).toEqual(expect.arrayContaining(['prosperite', 'rebatir']));
    // les majeures d'abord
    expect(l.enCours.slice(0, 2).every((q) => q.majeure)).toBe(true);
  });

  it('se lisent dans les drapeaux réels : travail chez Jumpy (même le jour 0), Garry, prospérité, constructions', () => {
    const m = creerMonde();
    poser(m, 'myhra.village');
    poser(m, 'jumpy.vu'); poser(m, 'metier.assistant'); poser(m, 'travail.jour', 0);
    m.decouvertes.push(17); poser(m, 'garry.vaincu');
    for (const [id, stade] of [['garry', 'adulte'], ['hevann', 'adulte'], ['ash', 'adulte'], ['maiko', 'adulte'], ['tourby', 'adulte'], ['finn', 'adulte'], ['bourbella', 'adulte'], ['glamp', 'adulte'], ['grimp', 'adulte'], ['lady-roger', 'adulte'], ['karla', 'adulte'], ['morthen', 'adulte']] as const) recruter(m, id, id, stade);
    m.structures.push('atelier', 'centre_communautaire', 'nettoyage_final');
    poser(m, 'morthen.vu'); poser(m, 'morthen.revu');
    const l = lireQuetes(m);
    expect(l.enCours).toEqual([]);
    expect(ids(l.terminees).sort()).toEqual(QUETES.map((q) => q.id).sort());
  });

  it('une étape plus avancée vaut pour les précédentes (Garry vaincu sans passer par la carte)', () => {
    const m = creerMonde();
    poser(m, 'garry.vaincu');
    expect(lireQuetes(m).terminees.map((q) => q.id)).toContain('garry');
  });

  it('synchroniserQuetes note l’étape courante et signale les nouvelles et les finies', () => {
    const m = creerMonde();
    expect(synchroniserQuetes(m).nouvelles.sort()).toEqual(['garry', 'jumpy-argent', 'myhra-village']);
    expect(m.quetes['myhra-village']).toBe('voir');
    poser(m, 'myhra.vue'); poser(m, 'myhra.village');
    const r = synchroniserQuetes(m);
    expect(r.finies).toEqual(['myhra-village']);
    expect(r.nouvelles.sort()).toEqual(['prosperite', 'rebatir']);
    expect(m.quetes['myhra-village']).toBe('fini');
    expect(synchroniserQuetes(m)).toEqual({ nouvelles: [], finies: [] });
  });

  it('le marteau d’Ash : parler à Ash fait avancer « Rebâtir le village »', () => {
    const m = creerMonde();
    poser(m, 'myhra.village');
    const rebatir = () => lireQuetes(m).enCours.find((q) => q.id === 'rebatir')!;
    expect(rebatir().etapes.map((e) => e.id)).toEqual(['batisseur']);
    poser(m, 'ash.vu');
    expect(rebatir().etapes.map((e) => [e.id, e.faite])).toEqual([['batisseur', true], ['cabane', false]]);
    poser(m, 'philhibert.vus');
    expect(rebatir().etapes.at(-1)!.id).toBe('marteau');
    poser(m, 'philhibert.vaincus');
    expect(rebatir().etapes.at(-1)!.id).toBe('rendre');
    poser(m, 'ash.recrute');
    expect(rebatir().etapes.at(-1)!.id).toBe('atelier');
  });

  it('le marteau d’Ash : voir Phil et Hibert, ou inspecter la cabane, avant d’avoir parlé à Ash fait aussi avancer la quête', () => {
    for (const cle of ['philhibert.vus', 'cabane.inspectee']) {
      const m = creerMonde();
      poser(m, 'myhra.village');
      poser(m, cle);
      const q = lireQuetes(m).enCours.find((x) => x.id === 'rebatir')!;
      expect(q.etapes.map((e) => [e.id, e.faite])).toEqual([['batisseur', true], ['cabane', true], ['marteau', false]]);
    }
  });

  it('« Qui est cet étrange écho ? » s’ouvre à la première rencontre avec Morthen', () => {
    const m = creerMonde();
    expect(ids(lireQuetes(m).enCours)).not.toContain('morthen');
    poser(m, 'morthen.vu');
    expect(synchroniserQuetes(m).nouvelles).toContain('morthen');
    const q = lireQuetes(m).enCours.find((x) => x.id === 'morthen')!;
    expect(q.titre).toBe('Qui est cet étrange écho ?');
    expect(q.etapes.map((e) => [e.id, e.faite])).toEqual([['croise', true], ['revoir', false]]);
  });

  it('les drapeaux attendus sont bien posés par les scènes', () => {
    const scene = (id: string) => readFileSync(`contenu/scenes/${id}.scene`, 'utf8');
    expect(scene('myhra')).toMatch(/myhra\.vue = vrai/);
    expect(scene('myhra')).toMatch(/myhra\.village = vrai/);
    expect(scene('jumpy')).toMatch(/jumpy\.vu = vrai/);
    expect(scene('jumpy')).toMatch(/metier\.assistant = vrai/);
    expect(scene('jumpy')).toMatch(/travail\.jour = jour/);
    expect(scene('garry-foret')).toMatch(/garry\.vaincu = vrai/);
    expect(scene('ash-montagne')).toMatch(/ash\.vu = vrai/);
    expect(scene('ash-montagne')).toMatch(/ash\.recrute = vrai/);
    expect(scene('phil-hibert')).toMatch(/philhibert\.vus = vrai/);
    expect(scene('phil-hibert')).toMatch(/cabane\.inspectee = vrai/);
    expect(scene('phil-hibert')).toMatch(/philhibert\.vaincus = vrai/);
    expect(scene('morthen')).toMatch(/morthen\.vu = vrai/);
  });
});

describe('relations avec les PNJ', () => {
  it('au début on ne connaît que Myhra et Jumpy, pas Garry', () => {
    const r = lireRelationsPnj(creerMonde());
    expect(r.connus.map((x) => x.id)).toEqual(['myhra', 'jumpy']);
    expect(r.aRencontrer.length).toBeGreaterThan(0);
  });
  it('les autres apparaissent quand on les rencontre (drapeau de scène ou arrivée au village)', () => {
    const m = creerMonde();
    poser(m, 'garry.vu_au_village');
    poser(m, 'ladyroger.defiee');
    recruter(m, 'tourby', 'Tourby', 'bebe');
    expect(lireRelationsPnj(m).connus.map((x) => x.id)).toEqual(['myhra', 'jumpy', 'garry', 'lady-roger', 'tourby']);
  });
  it('la relation se lit en mots et évolue (monde.relationsPnj, ou « garry.relation » dans les scènes)', () => {
    const m = normaliserMonde({});
    expect(m.relationsPnj).toEqual({});
    poser(m, 'garry.vu_au_village');
    const garry = () => lireRelationsPnj(m).connus.find((x) => x.id === 'garry')!;
    expect(garry().palier).toBe('connaissance');
    poser(m, 'garry.relation', -1);
    expect(garry().palier).toBe('mefiance');
    const r = changerRelationPnj(m, 'garry', 10);
    expect(r).toEqual({ palier: 'confiance', change: true });
    expect(garry().mot).not.toMatch(/\d/);
    expect(lireRelationsPnj(m).connus.find((x) => x.id === 'myhra')!.palier).toBe('sympathie');
  });
});

describe('arbre des échos', () => {
  const tout = LIGNEES.flatMap((l) => noeuds(arbre(l.id))).concat(FRAGMENTS, MEMOIRES);
  it('chaque case de l’arbre a son image', () => {
    for (const n of tout) for (const c of n.chemins) expect(existsSync(`public/assets/${c}`), c).toBe(true);
  });
  it('toutes les formes d’écho dessinées figurent dans l’arbre ou les souvenirs', () => {
    const chemins = new Set(tout.flatMap((n) => n.chemins));
    const dossiers = ['graines', 'bebe', 'enfant', 'adolescent', 'adulte'];
    for (const d of dossiers) for (const f of readdirSync(`public/assets/echos/${d}`)) if (f.endsWith('.png')) expect(chemins.has(`echos/${d}/${f}`), f).toBe(true);
  });
  it('une lignée solaire a deux branches claires, deux sombres et six mêlées', () => {
    const a = arbre('joy');
    expect(a.adolescent.claire.length).toBe(3);
    expect(a.adolescent.sombre.length).toBe(3);
    expect(a.melees.length).toBe(6);
    expect(arbre('neutre').melees.length).toBe(0);
  });
  it('révèle ce que le profil a vu (et la graine de sa lignée), jamais le reste', () => {
    const forme = apparence({ stade: 'enfant', graine: 'wrath', lignee: 'sombre', genre: 'm', evolution: null });
    const vu = revelees([forme]);
    expect(vu.has('echos/enfant/dark-wrath.png')).toBe(true);
    expect(vu.has('echos/graines/wrath.png')).toBe(true);
    expect(compte(noeuds(arbre('wrath')), vu).vues).toBe(2);
    expect(compte(noeuds(arbre('joy')), vu).vues).toBe(0);
    expect(ligneeDe(forme)).toBe('wrath');
    expect(ligneeDe('echos/adulte/branch-n-dn.png')).toBe('neutre');
    expect(ligneeDe('echos/adulte/branch-s-df.png')).toBe('sorrow');
  });
});
