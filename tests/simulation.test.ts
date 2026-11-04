import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ALIMENTS, CORVEES, ENTRAINEMENTS, ETATS_EMOTIONNELS, INTERACTIONS, Simulation, aleatoireFixe, apparence, creerEcho,
  determinerAdolescent, lireSignes, OBJETS_DIVERS, ICONE_BESOIN, type Etat,
} from '../src/moteur/simulation';

const ASSETS = path.resolve(__dirname, '../public/assets');
const existe = (p: string) => fs.existsSync(path.join(ASSETS, p));

function nouvelle(graine = 1, regl: Partial<Etat> = {}) {
  const rng = aleatoireFixe(graine);
  const e = creerEcho({ nom: 'Filo', genre: 'm', graine: 'joy', lignee: 'primaire', rythme: 'diurne' }, rng);
  Object.assign(e, regl);
  return new Simulation(e, rng);
}

describe('création', () => {
  it('est déterministe avec un générateur fixe et respecte les tirages du prototype', () => {
    const a = nouvelle(7).etat, b = nouvelle(7).etat;
    expect(a).toEqual(b);
    expect(a.temperament.cur).toBe(3); // lignée primaire de la graine solaire
    expect(a.traits.optimisme).toBe(60); // 30 + 3 × 10
    expect(a.inventaire).toHaveLength(10);
    const p = a.personnalite;
    const total = p.ouverture + p.conscienciosite + p.extraversion + p.agreabilite + (6 - p.nevrosisme);
    expect(total).toBeGreaterThanOrEqual(12);
    expect(total).toBeLessThanOrEqual(16);
    expect(a.heureEvolution.enfant).toBeGreaterThanOrEqual(12);
    expect(a.heureEvolution.enfant).toBeLessThanOrEqual(17);
  });
});

describe('temps', () => {
  it('applique les règles horaires à chaque heure pleine', () => {
    const s = nouvelle(3, { minute: 10 * 60 + 59 });
    const { satiete, proprete, energie } = s.etat;
    s.minute(); // 11 h : rythme diurne respecté (−2 d'énergie)
    expect(s.etat.satiete).toBeCloseTo(satiete - 1.5);
    expect(s.etat.proprete).toBeCloseTo(proprete - 0.5);
    expect(s.etat.energie).toBe(energie - 2);
    for (let i = 0; i < 59; i++) s.minute();
    expect(s.etat.energie).toBe(energie - 2); // rien entre deux heures
  });

  it('épuise deux fois plus vite hors du rythme, et l’écho s’écroule puis dort', () => {
    const s = nouvelle(4, { minute: 22 * 60 + 59, energie: 3 });
    s.minute();
    const sorties = s.vider().map(x => x.type);
    expect(sorties).toContain('effondrement');
    expect(sorties).toContain('sommeil');
    expect(s.etat.energie).toBe(50); // 0 + 10 × 5 h de sommeil, plafonné au maximum du bébé
  });

  it('change de jour à minuit et remet les caresses à zéro', () => {
    const s = nouvelle(5, { minute: 23 * 60 + 59 });
    s.etat.caresses = { jour: 1, nombre: 10 };
    s.minute();
    expect(s.etat.jour).toBe(2);
    expect(s.etat.minute).toBe(0);
    expect(s.caresser().ok).toBe(true);
  });

  it('fait grandir le bébé au 2e jour, entre 12 h et 18 h', () => {
    const s = nouvelle(6);
    s.etat.satiete = 50;
    while (s.etat.stade === 'bebe' && !s.etat.mort && s.etat.jour < 3) {
      s.etat.satiete = 50; s.etat.energie = 40; s.etat.proprete = 90; // on s'en occupe
      s.minute();
    }
    expect(s.etat.stade).toBe('enfant');
    expect(s.etat.jour).toBe(2);
    expect(Math.floor(s.etat.minute / 60)).toBeGreaterThanOrEqual(12);
    expect(Math.floor(s.etat.minute / 60)).toBeLessThanOrEqual(18);
  });

  it('meurt de vieillesse le 20e jour à midi', () => {
    const s = nouvelle(8, { naissance: -18, minute: 11 * 60 + 59 }); // jour 1 = 20e jour de vie
    s.minute();
    expect(s.etat.mort).toBe('vieillesse');
  });
});

describe('émotions', () => {
  it('la curiosité amplifie la joie, la résolution atténue la colère', () => {
    const s = nouvelle(9);
    const e = s.etat;
    e.emotions.joie = 10; e.emotions.colere = 10;
    e.temperament = { cur: 3, res: 3, dis: 0, obs: 0, ant: 0 };
    e.traits.optimisme = 50; e.traits.impulsivite = 50;
    s.feliciter(); // joie +15, colère −5
    expect(e.emotions.joie).toBeCloseTo(10 + 15 * 1.6, 1);
    expect(e.emotions.colere).toBeCloseTo(10 - 5 * 0.4, 1);
  });

  it('chaque état émotionnel a son icône', () => {
    for (const x of ETATS_EMOTIONNELS) expect(existe(x.icone), x.icone).toBe(true);
  });
});

describe('soins', () => {
  it('limite les caresses à 10 par jour, puis l’écho refuse', () => {
    const s = nouvelle(10);
    for (let i = 0; i < 10; i++) expect(s.caresser().ok).toBe(true);
    const r = s.caresser();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.raison).toBe('Filo ne veut plus être caressé.');
    const f = nouvelle(10);
    f.etat.genre = 'f';
    for (let i = 0; i < 10; i++) f.caresser();
    const rf = f.caresser();
    if (!rf.ok) expect(rf.raison).toBe('Filo ne veut plus être caressée.');
  });

  it('nourrir : refus quand l’écho est repu et frustré, sinon il mange et digère', () => {
    const s = nouvelle(11);
    const e = s.etat;
    const i = e.inventaire.findIndex(c => c?.id === 'pomme');
    e.gouts.regime = 'Omnivore';
    e.satiete = 45; e.frustrationAlimentaire = 100; // repu (> 80 % de 50)
    expect(s.nourrir(i).ok).toBe(false);
    expect(s.vider().some(x => x.type === 'refus')).toBe(true);
    e.satiete = 10;
    const qte = e.inventaire[i]!.qte;
    expect(s.nourrir(i).ok).toBe(true);
    expect(e.digestion).toBe(true);
    expect(e.inventaire[i]!.qte).toBe(qte - 1);
    expect(e.satiete).toBe(10 + 24);
  });

  it('gronder un refus de nourriture force le repas suivant', () => {
    const s = nouvelle(12);
    const e = s.etat;
    e.satiete = 45; e.frustrationAlimentaire = 100;
    const i = e.inventaire.findIndex(c => c?.id === 'pomme');
    s.nourrir(i);
    expect(s.gronder().ok).toBe(true);
    expect(e.forcerNourriture).toBe(true);
    expect(s.gronder().ok).toBe(false); // une fois par heure
    expect(s.nourrir(i).ok).toBe(true);
    expect(e.forcerNourriture).toBe(false);
  });

  it('laver prend deux heures et rend l’écho propre', () => {
    const s = nouvelle(13, { proprete: 10 });
    const m = s.etat.minute;
    s.laver();
    expect(s.etat.proprete).toBe(100);
    expect(s.etat.minute).toBe(m + 120);
  });

  it('coucher : refusé tant que l’écho n’a pas sommeil', () => {
    const s = nouvelle(14, { energie: 30 });
    expect(s.coucher().ok).toBe(false);
    s.etat.energie = 15;
    const r = s.coucher();
    expect(r.ok && r.heures).toBe(4);
  });

  it('pansement et médicament', () => {
    const s = nouvelle(15);
    const e = s.etat;
    const p = e.inventaire.findIndex(c => c?.id === 'bandage');
    expect(s.utiliser(p).ok).toBe(false);
    e.blesse = true;
    expect(s.utiliser(p).ok).toBe(true);
    expect(e.blesse).toBe(false);
    const m = e.inventaire.findIndex(c => c?.id === 'medicament');
    e.malade = true;
    expect(s.utiliser(m).ok).toBe(true);
    expect(e.malade).toBe(false);
    expect(e.immuniteJusqua).toBeGreaterThan(e.jour * 24);
  });
});

describe('lien et éducation', () => {
  it('une interaction par catégorie et par jour, et une heure passe', () => {
    const s = nouvelle(16);
    const props = s.proposer('jeu')!;
    expect(props).toHaveLength(3);
    const m = s.etat.minute;
    expect(s.interagir('jeu', props[0]).ok).toBe(true);
    expect(s.etat.minute).toBe(m + 60);
    expect(s.proposer('jeu')).toBeNull();
    expect(s.proposer('partage')).not.toBeNull();
  });

  it('les textes d’interaction sont accordés (plus de « (e) »)', () => {
    const s = nouvelle(17);
    s.etat.genre = 'f';
    for (const cat of Object.keys(INTERACTIONS) as (keyof typeof INTERACTIONS)[]) {
      for (const o of INTERACTIONS[cat]) {
        expect(s.libelle(o)).not.toMatch(/\(e\)|\{nom\}|il\/elle/);
      }
    }
  });

  it('un écho éduqué presque uniquement au cognitif devient fragmenté', () => {
    const s = nouvelle(18);
    s.etat.educationTotale = { ...s.etat.educationTotale, cognitif: 9, socio: 1, moteur: 0 };
    expect(determinerAdolescent(s.etat)).toEqual({ genre: 'fragment', code: 'C+' });
    s.etat.educationTotale = { ...s.etat.educationTotale, cognitif: 3, socio: 3, moteur: 3, joy: 5, fear: 1 };
    expect(determinerAdolescent(s.etat)).toEqual({ genre: 'normal' });
    s.etat.educationTotale.disgust = 9;
    expect(determinerAdolescent(s.etat)).toEqual({ genre: 'branche', code: 'J-DD' });
  });

  it('répondre à un comportement « neutre » range l’objet trouvé', () => {
    const s = nouvelle(19);
    s.etat.comportement = { coloration: 'cur', type: 'neutre', objet: 'truffe', debut: 0 };
    const r = s.repondreComportement('remercier');
    expect(r.ok && r.objetTrouve).toBe('Truffe');
    expect(s.etat.inventaire.some(c => c?.id === 'truffe')).toBe(true);
    expect(s.etat.comportement).toBeNull();
  });
});

describe('signes perçus', () => {
  it('ne montrent jamais de nombre', () => {
    const s = nouvelle(20);
    for (let i = 0; i < 60 * 30; i++) {
      s.minute();
      const g = lireSignes(s.etat);
      expect(g.phrase).not.toMatch(/\d/);
      for (const b of g.besoins) expect(b.indice).not.toMatch(/\d/);
    }
  });

  it('la faim se voit de plus en plus', () => {
    const s = nouvelle(21);
    s.etat.satiete = 15;
    expect(lireSignes(s.etat).besoins.find(b => b.besoin === 'faim')?.urgence).toBe(1);
    s.etat.satiete = 5;
    expect(lireSignes(s.etat).besoins.find(b => b.besoin === 'faim')?.urgence).toBe(2);
    s.etat.satiete = 0;
    const g = lireSignes(s.etat);
    expect(g.bulle?.besoin).toBe('faim');
  });

  it('toutes les icônes de bulle existent', () => {
    for (const p of Object.values(ICONE_BESOIN)) expect(existe(p), p).toBe(true);
  });
});

describe('données reprises', () => {
  it('toutes les icônes existent', () => {
    for (const x of [...ALIMENTS, ...ENTRAINEMENTS, ...CORVEES, ...OBJETS_DIVERS]) expect(existe(x.icone), x.icone).toBe(true);
    expect(ALIMENTS).toHaveLength(56);
  });

  it('chaque apparence d’écho correspond à un fichier', () => {
    const graines = ['joy', 'wrath', 'disgust', 'sorrow', 'fear'] as const;
    const lignees = ['primaire', 'sombre', 'neutre', 'neutre-sombre'] as const;
    const evolutions = [
      { genre: 'normal' as const },
      { genre: 'fragment' as const, code: 'C+' as const }, { genre: 'fragment' as const, code: 'SA+' as const }, { genre: 'fragment' as const, code: 'PM+' as const },
      { genre: 'branche' as const, code: 'S-DF' }, { genre: 'branche-adulte' as const, code: 'W-DJ' }, { genre: 'melee' as const, code: 'JWF' },
    ];
    for (const graine of graines) for (const lignee of lignees) for (const genre of ['m', 'f'] as const) {
      for (const stade of ['bebe', 'enfant', 'adolescent', 'adulte'] as const) {
        for (const evolution of stade === 'bebe' || stade === 'enfant' ? [null] : evolutions) {
          const p = apparence({ stade, graine, lignee, genre, evolution });
          expect(existe(p), p).toBe(true);
        }
      }
    }
  });
});
