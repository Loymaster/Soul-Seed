import { describe, expect, it } from 'vitest';
import { aleatoireFixe, creerEcho, AGE_EVOLUTION, AGE_MORT, CARESSES_PAR_JOUR, DUREE_BROSSAGE_HEURES } from '../src/moteur/simulation';
import { objetDivers } from '../src/moteur/simulation/objets';
import { DUREE_REPOUSSE, OUVERTURE_BOUTIQUE, FERMETURE_BOUTIQUE, PLAFOND_RESSOURCE, DEBUT_TRAVAIL, FIN_TRAVAIL, DUREE_TRAVAIL } from '../src/moteur/monde';
import { readFileSync } from 'node:fs';
import { GABARIT_CARNET, GABARIT_PETIT, THEMES_ASTUCES, compteTheme, insecables, lignesTheme, paginer } from '../src/jeu/commun/astuces';

const echo = () => creerEcho({ nom: 'Filo', genre: 'm', graine: 'joy', lignee: 'primaire', rythme: 'diurne' }, aleatoireFixe(3));
const tout = THEMES_ASTUCES.flatMap((t) => t.astuces.map((a) => a.texte)).join('\n');

describe('astuces du carnet', () => {
  it('se dévoilent avec les drapeaux du monde et le stade de l’écho', () => {
    const e = echo();
    const village = THEMES_ASTUCES.find((t) => t.k === 'village')!;
    const avant = compteTheme(village, { e, m: { drapeaux: {}, corvees: {} } });
    const apres = compteTheme(village, { e, m: { drapeaux: { 'myhra.vue': true, 'tourby.recrute': true }, corvees: {} } });
    expect(apres.vues).toBe(avant.vues + 3);
    const lignes = lignesTheme(village, { e, m: null });
    // les astuces à découvrir viennent après les autres, avec leur piste
    const i = lignes.findIndex((l) => l.cachee);
    expect(lignes.slice(i).every((l) => l.cachee && l.piste)).toBe(true);
    const grandir = THEMES_ASTUCES.find((t) => t.k === 'grandir')!;
    e.stade = 'adolescent';
    expect(compteTheme(grandir, { e, m: { drapeaux: { 'ash.recrute': true }, corvees: { ranger_ranch: 1 } } }).vues).toBe(grandir.astuces.length);
  });

  it('se découpent en pages sans en perdre une, et sans page vide', () => {
    const e = echo();
    for (const g of [GABARIT_CARNET, GABARIT_PETIT]) {
      for (const t of THEMES_ASTUCES) {
        const lignes = lignesTheme(t, { e, m: null });
        const pages = paginer(lignes, g);
        expect(pages.flat()).toEqual(lignes);
        expect(pages.every((p) => p.length > 0)).toBe(true);
      }
    }
  });

  it('collent aux règles du jeu (durées, heures, prix)', () => {
    expect(tout).toContain(`son ${AGE_EVOLUTION.enfant}ᵉ jour, adolescent à partir du ${AGE_EVOLUTION.adolescent}ᵉ, adulte à partir du ${AGE_EVOLUTION.adulte}ᵉ`);
    expect(AGE_MORT).toBe(20);
    expect(tout).toContain('vit vingt jours');
    expect(DUREE_BROSSAGE_HEURES).toBe(1);
    expect(CARESSES_PAR_JOUR).toBe(10);
    expect(DUREE_REPOUSSE).toBe(12);
    expect(PLAFOND_RESSOURCE).toBe(5);
    expect(tout).toContain(`ouvre de ${OUVERTURE_BOUTIQUE} h à ${FERMETURE_BOUTIQUE} h`);
    // le travail chez Jumpy : mêmes heures et même durée dans l'astuce et dans la scène
    const nombres: Record<number, string> = { 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six' };
    expect(tout).toContain(`entre ${DEBUT_TRAVAIL} h et ${FIN_TRAVAIL} h, une fois par jour : ${nombres[DUREE_TRAVAIL]} heures`);
    const jumpy = readFileSync(new URL('../contenu/scenes/jumpy.scene', import.meta.url), 'utf8');
    expect(jumpy).toContain(`si heure < ${DEBUT_TRAVAIL} ou heure >= ${FIN_TRAVAIL}:`);
    expect(jumpy).toContain(`de ${DEBUT_TRAVAIL} h à ${FIN_TRAVAIL} h`);
    expect(jumpy).toContain(`action: heures ${DUREE_TRAVAIL}`);
    for (const [id, nom] of [['medicament', 'Un médicament'], ['bandage', 'Un pansement'], ['repousse', 'Une repousse'], ['tente', 'La tente'], ['canne_peche', 'canne à pêche'], ['appat_echo', 'appât à écho']] as const) {
      expect(tout).toContain(`${nom} (${objetDivers(id)!.prix} or`);
    }
  });

  it('respectent la typographie française', () => {
    expect(insecables('joie ; le « deux » : oui !')).toBe('joie ; le « deux » : oui !');
  });
});
