// Fiche de l'écho (techniques, tempérament sur cinq ronds) et journal du carnet (tout l'historique, page à page).
import { describe, expect, it } from 'vitest';
import { JOURNAL_MAX, Simulation, TEMPERAMENT_MAX, aleatoireFixe, creerEcho, type Etat, type EntreeJournal } from '../src/moteur/simulation';
import { MAX_TECHNIQUES, basculerTechnique, descriptionDepuisEtat, poolTechniques, techniquesADecouvrir } from '../src/moteur/combat';
import { lignesTemperament, lireTechniquesFiche, pisteTechnique } from '../src/jeu/ranch/fiche';
import { GABARIT_JOURNAL, paginerJournal } from '../src/jeu/commun/carnet/journal';

function nouvelle(regl: Partial<Etat> = {}) {
  const rng = aleatoireFixe(4);
  const e = creerEcho({ nom: 'Filo', genre: 'm', graine: 'joy', lignee: 'primaire', rythme: 'diurne' }, rng);
  Object.assign(e, regl);
  return new Simulation(e, rng);
}
const sansChiffre = (t: string) => expect(t).not.toMatch(/\d/);

describe('techniques de l’écho', () => {
  it('on prend ou laisse une technique apprise, trois au plus, dans ses affinités', () => {
    const s = nouvelle({ stade: 'adolescent', evolution: { genre: 'normal' } });
    const pool = poolTechniques(s.etat);
    expect(pool.length).toBeGreaterThanOrEqual(4);
    s.etat.techniques = { connues: pool.slice(0, 4), equipees: pool.slice(0, 3), seuils: [150, 350, 550, 750] };
    const plein = s.choisirTechnique(pool[3]);
    expect(plein.ok).toBe(false);
    if (!plein.ok) sansChiffre(plein.raison);
    expect(s.choisirTechnique(pool[0])).toEqual({ ok: true, equipee: false });
    expect(s.choisirTechnique(pool[3])).toEqual({ ok: true, equipee: true });
    expect(s.etat.techniques!.equipees).toEqual([pool[1], pool[2], pool[3]]);
    // le combat emporte ce choix
    expect(descriptionDepuisEtat(s.etat).techniques).toEqual([pool[1], pool[2], pool[3]]);
    // une technique inconnue ne se prend pas
    expect(s.choisirTechnique('Technique inconnue').ok).toBe(false);
  });

  it('hors de ses affinités (apprise sous une autre forme) : on la laisse, on ne la reprend pas', () => {
    const t = { connues: ['Ailleurs'], equipees: ['Ailleurs'], seuils: [] };
    const r = basculerTechnique(t, 'Ailleurs', 'adolescent', ['Ici']);
    expect(r.ok && r.equipee).toBe(false);
    if (r.ok) expect(basculerTechnique(r.techniques, 'Ailleurs', 'adolescent', ['Ici'])).toEqual({ ok: false, cause: 'affinites' });
    expect(basculerTechnique({ connues: ['Ici'], equipees: [], seuils: [] }, 'Ici', 'bebe', ['Ici'])).toEqual({ ok: false, cause: 'bebe' });
  });

  it('ce qui reste à découvrir : un par seuil d’intelligence à venir, tant que son pool a de l’inconnu', () => {
    expect(techniquesADecouvrir(100, { connues: [], equipees: [], seuils: [] }, ['a', 'b', 'c', 'd', 'e'])).toEqual({ nombre: 4, ecart: 50 });
    expect(techniquesADecouvrir(400, { connues: ['a', 'b'], equipees: [], seuils: [150, 350] }, ['a', 'b', 'c'])).toEqual({ nombre: 1, ecart: 150 });
    expect(techniquesADecouvrir(900, { connues: [], equipees: [], seuils: [150, 350, 550, 750] }, ['a'])).toEqual({ nombre: 0, ecart: null });
  });

  it('la fiche : emplacements, silhouettes et piste en mots, jamais de chiffre', () => {
    const s = nouvelle({ stade: 'enfant' });
    const pool = poolTechniques(s.etat);
    s.etat.caracs.intelligence = 200;
    s.etat.techniques = { connues: [pool[0]], equipees: [pool[0]], seuils: [150] };
    const f = lireTechniquesFiche(s.etat);
    expect(f.emplacements).toHaveLength(MAX_TECHNIQUES);
    expect(f.emplacements[0]?.nom).toBe(pool[0]);
    expect(f.emplacements[1]).toBeNull();
    expect(f.connues[0]).toMatchObject({ nom: pool[0], equipee: true, horsAffinites: false });
    expect(f.aDecouvrir).toBe(Math.min(3, pool.length - 1));
    sansChiffre(f.mot);
    for (const e of [10, 100, 400]) sansChiffre(pisteTechnique(e));
    const bebe = lireTechniquesFiche(nouvelle().etat);
    expect(bebe.bebe).toBe(true);
    expect(bebe.aDecouvrir).toBe(0);
    sansChiffre(bebe.mot);
  });
});

describe('tempérament', () => {
  it('se lit sur cinq ronds au plus, la part innée pleine', () => {
    const e = nouvelle().etat;
    const l = lignesTemperament(e);
    expect(TEMPERAMENT_MAX).toBe(5);
    for (const x of l) expect(x.points).toHaveLength(5);
    expect(l[0].points.filter((p) => p.cls === 'plein')).toHaveLength(e.temperament.cur);
  });
});

describe('journal', () => {
  it('garde tout une vie (JOURNAL_MAX entrées), les plus récentes en tête', () => {
    const s = nouvelle();
    for (let i = 0; i < JOURNAL_MAX + 20; i++) s.noter(`entrée ${i}`);
    expect(s.etat.journal).toHaveLength(JOURNAL_MAX);
    expect(s.etat.journal[0].texte).toBe(`entrée ${JOURNAL_MAX + 19}`);
    expect(JOURNAL_MAX).toBeGreaterThanOrEqual(1000);
  });

  it('se met en pages : tout y est, dans l’ordre, chaque page tient dans sa hauteur', () => {
    const entrees: EntreeJournal[] = [];
    for (let jour = 6; jour >= 1; jour--) for (let k = 20; k >= 1; k--) entrees.push({ jour, minute: k * 50, texte: 'x'.repeat((k * 13) % 120 + 10) });
    const pages = paginerJournal(entrees);
    expect(pages.length % 2).toBe(0);
    expect(pages.length).toBeGreaterThan(4);
    const lues = pages.flatMap((p) => p.flatMap((b) => b.lignes.map((l) => l.texte)));
    expect(lues).toEqual(entrees.map((x) => x.texte));
    const g = GABARIT_JOURNAL;
    pages.forEach((p, i) => {
      const h = p.reduce((t, b) => t + g.titre + b.lignes.reduce((u, l) => u + Math.ceil(l.texte.length / g.caracteres) * g.ligne + g.marge, 0), 0);
      expect(h).toBeLessThanOrEqual(i % 2 ? g.droite : g.gauche);
    });
    // un jour coupé reprend son titre « (suite) » en haut de la page suivante
    expect(pages.some((p) => p[0]?.suite)).toBe(true);
    expect(paginerJournal([])).toEqual([[], []]);
  });
});
