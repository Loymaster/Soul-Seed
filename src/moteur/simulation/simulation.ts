// Simulation de l'écho au ranch.
// Le temps s'écoule à 1 minute de jeu par seconde réelle ; les règles du prototype s'appliquent à chaque
// heure pleine (_tickHourCore). Les actions qui « prennent du temps » font avancer l'horloge d'autant.
import type {
  Aleatoire, CategorieInteraction, CauseMort, CleTemperament, CleCarac, Emotions, Etat, OptionInteraction,
  ReponseComportement, Sortie, Stade,
} from './types';
import {
  AGE_EVOLUTION, AGE_MORT, CARESSES_PAR_JOUR, CLES_CARACS, CLES_TEMPERAMENT, CONSTANTE_GUERISON_MALADIE,
  DUREE_VISITE_HEURES, EMOTION_DE_TEMPERAMENT, MAX_ECHOS_SAUVAGES, MAX_PAR_STADE, MULT_ENTRAINEMENT,
  MULT_GUERISON_BLESSURE, NOM_STADE, PLAGES_RYTHME, SALETE_MAX, TRAIT_DE_TEMPERAMENT, TRAIT_D_EMOTION,
  TRAIT_D_EMOTION_EDUCATIVE,
} from './constantes';
import { accord, accorderTexte, ageJours, borne, centieme, dixieme, heureDuJour, heureTotale, piocher } from './outils';
import { appliquerEmotions, deltaAjuste } from './emotions';
import { regimeCompatible } from './alimentation';
import { aliment, consommer, objetDivers, ranger } from './objets';
import { creerEchoSauvage } from './creation';
import { determinerAdolescent, determinerAdulte } from './evolution';
import { INTERACTIONS } from './donnees/interactions';
import { CORVEES, ENTRAINEMENTS } from './donnees/activites';
import { ALIMENTS } from './donnees/aliments';
import type { BilanCombat } from '../combat/issue';
import { apprendreTechniques, poolTechniques } from '../combat/pools';

/** Options d'une heure de simulation (paramètres de tickHour dans le prototype). */
export interface OptionsHeure {
  repos?: boolean;
  gainHumeur?: number;
  emotions?: Partial<Emotions>;
  perteSante?: number;
  debutBlessure?: boolean;
  /** « Passer le temps » : l'écho s'ennuie (colère, dégoût, tristesse montent, la joie baisse). */
  ennui?: boolean;
  message?: string;
}

export type Refus = { ok: false; raison: string };
export type Reussi<T = {}> = { ok: true } & T;

const EMOTIONS_FOND = ['joie', 'colere', 'tristesse', 'degout', 'peur'] as const;

export class Simulation {
  private sorties: Sortie[] = [];
  private effondrementEnAttente = false;
  private enSommeil = false;

  constructor(public etat: Etat, private rng: Aleatoire = Math.random) {}

  // ————————————————————————————————————————— utilitaires

  get max() { return MAX_PAR_STADE[this.etat.stade]; }
  /** Nom avec majuscule (pour débuter une phrase). */
  private get Nom() { return this.etat.nom || 'Votre écho'; }
  private a(m: string, f: string) { return accord(this.etat, m, f); }

  /** Récupère (et vide) ce que la simulation a signalé depuis le dernier appel. */
  vider(): Sortie[] { const s = this.sorties; this.sorties = []; return s; }
  private emettre(s: Sortie) { this.sorties.push(s); }

  noter(texte: string) {
    const e = this.etat;
    e.journal.unshift({ jour: e.jour, minute: e.minute, texte });
    if (e.journal.length > 200) e.journal.length = 200;
    this.emettre({ type: 'journal', texte });
  }
  private message(texte: string, ton: 'bien' | 'mal' | 'note' = 'note') { this.emettre({ type: 'message', texte, ton }); }

  private eduquer(processus: 'cognitif' | 'socio' | 'moteur' | null, emotion: keyof Etat['educationJour'] | null) {
    const e = this.etat;
    if (processus) { e.educationStade[processus]++; e.educationTotale[processus]++; }
    if (emotion) { e.educationStade[emotion]++; e.educationTotale[emotion]++; e.educationJour[emotion]++; }
  }

  /** adjustEducationEmo (comportements spontanés) */
  private ajusterEmotionEducative(emotion: keyof Etat['educationJour'], delta: number) {
    const e = this.etat;
    e.educationStade[emotion] += delta;
    e.educationTotale[emotion] += delta;
    e.educationJour[emotion] += Math.abs(delta);
  }

  private nouvelId() { return this.etat.prochainId++; }

  get vivant() { return !this.etat.mort; }
  get expressionPersonnelle() { return heureTotale(this.etat) < this.etat.expressionPersonnelleJusqua; }

  // ————————————————————————————————————————— temps

  /** Fait passer une minute de jeu. À chaque heure pleine, les règles horaires s'appliquent. */
  minute(opts: OptionsHeure = {}) {
    const e = this.etat;
    if (e.mort) return;
    e.minute += 1;
    let nouveauJour = false;
    if (e.minute >= 1440) { e.minute -= 1440; e.jour += 1; nouveauJour = true; }
    if (e.minute % 60 === 0) {
      this.heure(opts, nouveauJour);
      if (this.effondrementEnAttente && !this.enSommeil) { this.effondrementEnAttente = false; this.dormir(true); }
    }
  }

  /** Avance l'horloge de `heures` heures pleines (les actions longues). */
  avancer(heures: number, opts: OptionsHeure = {}) {
    for (let i = 0; i < heures * 60 && !this.etat.mort; i++) this.minute(opts);
  }

  private rythmeRespecte(h: number) {
    const [debut, fin] = PLAGES_RYTHME[this.etat.rythme];
    return debut < fin ? h >= debut && h < fin : h >= debut || h < fin;
  }

  private tuer(cause: CauseMort) {
    const e = this.etat;
    if (e.mort) return;
    e.mort = cause;
    e.sante = 0;
    this.emettre({ type: 'mort', cause });
  }

  /** Règles horaires (_tickHourCore), appliquées à l'heure qui vient de commencer. */
  private heure(o: OptionsHeure, nouveauJour: boolean) {
    const e = this.etat;
    const rng = this.rng;
    const max = this.max;
    const h = heureDuJour(e);
    const maintenant = heureTotale(e);
    const avant = {
      affame: e.affame, blesse: e.blesse, fatigue: e.energie <= 20, sale: e.proprete <= 20,
      maussade: e.humeur < 30, angoisse: e.anxiete > 90, besoinAffection: e.besoinAffection, energie: e.energie,
    };
    const autonomie = () => rng() * 100 < e.autonomie / 2;
    const autonomes: string[] = [];

    e.satiete = borne(e.satiete - 1.5, 0, max);
    e.refusNourriture = false;

    e.proprete = borne(e.proprete - 0.5);
    let sale = e.proprete <= 20;
    const degoutant = e.proprete === 0;
    const multSalete = degoutant ? 2 : 1;
    const penaliteSalete = sale ? multSalete : 0;

    const blessureCommence = !e.blesse && !!o.debutBlessure;
    if (o.debutBlessure) e.blesse = true;
    if (e.blesse && rng() < (1 / 20) * MULT_GUERISON_BLESSURE[e.stade]) e.blesse = false;

    e.risqueMaladie = sale ? Math.min(100, e.risqueMaladie + 0.25 * multSalete) : Math.max(0, e.risqueMaladie - 0.5);
    if (e.blesse) e.risqueMaladie = Math.min(100, e.risqueMaladie + 0.5);

    // Cumul quotidien des émotions ; au changement de jour, une émotion dominante (> 1200) renforce son trait.
    for (const k of EMOTIONS_FOND) e.sommeJourEmotions[k] += e.emotions[k];
    const progressionTraits: (keyof Etat['traits'])[] = [];
    if (nouveauJour) {
      e.attachement = Math.min(100, e.attachement + 1);
      for (const k of EMOTIONS_FOND) if (e.sommeJourEmotions[k] > 1200) progressionTraits.push(TRAIT_D_EMOTION[k]);
      for (const k of EMOTIONS_FOND) e.sommeJourEmotions[k] = 0;
      const cles = Object.keys(e.educationJour) as (keyof Etat['educationJour'])[];
      const plus = Math.max(...cles.map(k => e.educationJour[k]));
      if (plus > 0) progressionTraits.push(TRAIT_D_EMOTION_EDUCATIVE[piocher(cles.filter(k => e.educationJour[k] === plus), rng)]);
      for (const k of cles) e.educationJour[k] = 0;
      for (const s of e.echosSauvages) s.ageJours += 1;
      e.caresses = { jour: e.jour, nombre: 0 };
      this.emettre({ type: 'nouveau-jour', jour: e.jour });
    }

    if (e.anxiete > 90) e.risqueMaladie = Math.min(100, e.risqueMaladie + (e.anxiete - 50) * 0.04);

    // Manque d'affection : monte chaque heure (névrotisme), atténué par l'affection acquise.
    const facteurManque = 0.4 + e.personnalite.nevrosisme / 5;
    const amortiManque = Math.max(0.4, 1 - e.affection / 150);
    e.manqueAffection = borne(e.manqueAffection + 5 * facteurManque * amortiManque);
    const anxieteManque = e.manqueAffection > 50 ? 1 + (e.manqueAffection - 50) / 10 : 0;
    if (e.manqueAffection > 70) e.besoinAffection = true;
    else if (e.manqueAffection < 70) e.besoinAffection = false;
    if (e.besoinAffection) e.affection = borne(e.affection - 0.5);
    e.anxiete = anxieteManque > 0 ? borne(e.anxiete + anxieteManque) : Math.max(0, e.anxiete - 0.5);

    e.humeur = borne(e.humeur - 1 - penaliteSalete + (o.gainHumeur ?? 0));

    if (e.satiete === 0) e.affame = true;
    else if (e.affame) e.affame = false;
    const enForme = e.satiete >= max * 0.8 && !e.blesse;

    let perte = 0;
    if (e.affame) { e.sante -= 0.25; perte += 0.25; if (e.sante <= 0) this.tuer('faim'); }
    else if (enForme) e.sante += 0.1;
    if (e.blesse) { e.sante -= 0.5; perte += 0.5; if (e.sante <= 0) this.tuer('blessure'); }
    if (o.perteSante) { e.sante -= o.perteSante; perte += o.perteSante; if (e.sante <= 0) this.tuer('combat'); }
    e.sante = borne(e.sante, 0, 20);
    if (perte > 0) e.attachement = Math.max(0, e.attachement - perte);

    e.energie = o.repos
      ? Math.min(max, e.energie + 10)
      : borne(e.energie - (this.rythmeRespecte(h) ? 2 : 4), 0, max);
    let effondrement = false;
    if (avant.energie > 0 && e.energie <= 0 && !o.repos) { e.humeur = Math.max(0, e.humeur - 40); effondrement = true; }
    const aigri = e.humeur <= 0;
    const grognon = !aigri && e.humeur < 30;

    // Émotions : décroissance de base, puis effets de l'état du corps.
    const d: Emotions = { joie: 0, colere: 0, tristesse: 0, degout: 0, peur: 0, surprise: -5 };
    const declin = (v: number) => (v > 75 ? -2 : v <= 20 ? 0 : -1);
    for (const k of EMOTIONS_FOND) d[k] += declin(e.emotions[k]);
    if (aigri) d.joie -= 10; else if (grognon) d.joie -= 5;
    if (sale) { d.degout += 10; d.peur += 5; d.colere += 3; d.tristesse += 1; }
    if (e.blesse) { d.colere += 2; d.peur += 5; d.tristesse += 2; d.degout += 2; d.joie -= 5; }
    if (blessureCommence) { d.surprise += 80; d.peur += 40; d.joie -= 20; d.colere += 10; d.tristesse += 5; d.degout += 10; this.emettre({ type: 'blessure' }); }
    if (!o.repos && e.energie <= 20) { d.degout += 5; d.peur += 5; d.tristesse += 5; d.joie -= 5; }
    if (effondrement) { d.tristesse += 30; d.colere += 5; d.peur += 10; d.joie -= 10; }
    if (o.emotions) for (const [k, v] of Object.entries(o.emotions)) d[k as keyof Emotions] += v ?? 0;
    appliquerEmotions(e, d);
    if (o.ennui) {
      const em = e.emotions;
      if (em.colere <= 75) em.colere = dixieme(Math.min(75, em.colere + deltaAjuste(e, 'colere', 3)));
      if (em.degout <= 75) em.degout = dixieme(Math.min(75, em.degout + deltaAjuste(e, 'degout', 3)));
      if (em.tristesse <= 75) em.tristesse = dixieme(Math.min(75, em.tristesse + deltaAjuste(e, 'tristesse', 3)));
      if (em.joie >= 20) em.joie = dixieme(Math.max(20, em.joie + deltaAjuste(e, 'joie', -5)));
    }

    if (ageJours(e) >= AGE_MORT && h === 12) this.tuer('vieillesse');

    e.poids = Math.max(0.1, centieme(e.poids - 0.02));

    // Digestion : le « besoin » est la probabilité (en %) de faire ses besoins cette heure-ci.
    if (e.digestion) {
      e.besoin = Math.min(100, e.besoin + 10);
      if (rng() * 100 < e.besoin) {
        e.digestion = false;
        e.besoin = 0;
        if (e.saleteRanch >= SALETE_MAX) {
          const t = `${this.Nom} est ${this.a('allé', 'allée')} chez le voisin pour faire ses besoins.`;
          this.noter(t); this.emettre({ type: 'voisin', texte: t });
        } else if (autonomie()) {
          autonomes.push(`${this.Nom} a décidé d’être ${this.a('propre', 'propre')} et de nettoyer ${this.a('lui-même', 'elle-même')} après avoir fait ses besoins.`);
        } else {
          this.deposer('crotte');
          e.poids = Math.max(0.1, centieme(e.poids - 0.5));
          e.proprete = Math.max(0, e.proprete - 20);
        }
      }
    }

    // Maladie
    if (e.malade) {
      e.anxiete = borne(e.anxiete + 3);
      e.heuresMaladie += 1;
      e.sante = Math.max(0, e.sante - (e.heuresMaladie <= 12 ? 0.25 : e.heuresMaladie <= 24 ? 0.5 : 1));
      if (e.sante <= 0) this.tuer('maladie');
      const guerison = ((CONSTANTE_GUERISON_MALADIE[e.stade] * e.caracs.robustesse) / 2000) * (1 + e.affection / 200);
      if (rng() < guerison) {
        e.malade = false; e.heuresMaladie = 0; e.risqueMaladie = 0;
        this.noter(`${this.Nom} a combattu la maladie ${this.a('tout seul', 'toute seule')} et est ${this.a('guéri', 'guérie')} !`);
        this.emettre({ type: 'guerison' });
      } else if (rng() < 1 / 3) {
        if (e.saleteRanch >= SALETE_MAX) {
          const t = `${this.Nom} est ${this.a('allé', 'allée')} vomir chez le voisin.`;
          this.noter(t); this.emettre({ type: 'voisin', texte: t });
        } else {
          this.deposer('vomi');
          e.proprete = Math.max(0, e.proprete - 20);
        }
      }
    } else if (maintenant >= e.immuniteJusqua && rng() < e.risqueMaladie / 100) {
      e.malade = true; e.heuresMaladie = 0;
      this.noter(`${this.Nom} est ${this.a('tombé', 'tombée')} ${this.a('malade', 'malade')}.`);
      this.emettre({ type: 'maladie' });
    }
    if (o.message) this.noter(o.message);

    // Visiteur qui repart
    if (e.visiteur && maintenant >= e.visiteur.departA) {
      e.visiteur = null;
      const t = 'L’écho invité est reparti.';
      this.noter(t); this.emettre({ type: 'visiteur-parti', texte: t });
    }

    // Évolutions (entre 12 h et 18 h, à l'heure tirée à la naissance, au plus tard à 18 h)
    if (!e.mort) {
      const age = ageJours(e);
      const fenetre = (cible: number) => h === cible || h >= 18;
      if (e.stade === 'bebe' && age >= AGE_EVOLUTION.enfant && fenetre(e.heureEvolution.enfant)) this.evoluer('enfant');
      else if (e.stade === 'enfant' && age >= AGE_EVOLUTION.adolescent && h >= 12 && fenetre(e.heureEvolution.adolescent)) this.evoluer('adolescent');
      else if (e.stade === 'adolescent' && age >= AGE_EVOLUTION.adulte && h >= 12 && fenetre(e.heureEvolution.adulte) && determinerAdulte(e)) this.evoluer('adulte');
    }

    // Événements aléatoires du ranch (pas pendant le sommeil)
    if (!o.repos && !e.mort) {
      e.probaEvenement = Math.min(100, e.probaEvenement + 1);
      if (rng() * 100 < e.probaEvenement) {
        const natures: ('bruit' | 'invite' | 'visite')[] = e.garryVaincu ? [] : ['bruit'];
        if (!e.visiteur && e.echosSauvages.length < MAX_ECHOS_SAUVAGES) natures.push('invite');
        if (!e.visiteur && e.echosSauvages.length > 0) natures.push('visite');
        if (natures.length) {
          e.probaEvenement = 0;
          this.evenement(piocher(natures, rng));
        }
      }
    }

    // Comportements spontanés liés au tempérament
    if (e.comportement) {
      if (maintenant - e.comportement.debut >= 4) e.comportement = null;
    } else if (!e.mort) {
      e.chanceComportement = Math.min(100, e.chanceComportement + 5);
      if (rng() * 100 < e.chanceComportement) {
        e.chanceComportement = 0;
        this.declencherComportement(maintenant);
      }
    }

    // Autonomie : l'écho peut régler seul un problème qui vient d'apparaître (probabilité autonomie / 2 %).
    if (!avant.affame && e.affame && autonomie()) {
      e.satiete = Math.min(max, e.satiete + 20); e.affame = false;
      autonomes.push(`${this.Nom} était ${this.a('affamé', 'affamée')}, alors ${this.a('il', 'elle')} a décidé de résoudre ${this.a('seul', 'seule')} la situation en trouvant de quoi manger.`);
    }
    if (!avant.blesse && e.blesse && autonomie()) {
      e.blesse = false;
      autonomes.push(`${this.Nom} était ${this.a('blessé', 'blessée')}, mais ${this.a('il', 'elle')} est allé${this.a('', 'e')} se soigner sans attendre, en se rappelant comment faire.`);
    }
    if (!avant.fatigue && e.energie <= 20 && autonomie()) {
      e.energie = Math.min(max, e.energie + 10);
      autonomes.push(`${this.Nom} était ${this.a('fatigué', 'fatiguée')} et a profité de quelques minutes pour faire une sieste.`);
    }
    sale = e.proprete <= 20;
    if (!avant.sale && sale && autonomie()) {
      e.proprete = Math.min(100, e.proprete + 50);
      autonomes.push(`${this.Nom} a remarqué qu’${this.a('il', 'elle')} était sale et est ${this.a('parti', 'partie')} se laver ${this.a('tout seul', 'toute seule')}.`);
    }
    if (!avant.maussade && e.humeur < 30 && autonomie()) {
      e.humeur = borne(e.humeur + 30);
      autonomes.push(`${this.Nom} était de mauvaise humeur, mais ${this.a('il', 'elle')} est ${this.a('parti', 'partie')} s’amuser ${this.a('seul', 'seule')} et va mieux.`);
    }
    if (!avant.angoisse && e.anxiete > 90 && autonomie()) {
      e.anxiete = Math.max(0, e.anxiete - 50);
      autonomes.push(`${this.Nom} était vraiment ${this.a('angoissé', 'angoissée')} ; ${this.a('il', 'elle')} s’est ${this.a('assis', 'assise')} et a fait le vide en ${this.a('lui', 'elle')}.`);
    }
    if (!avant.besoinAffection && e.besoinAffection && autonomie()) {
      e.manqueAffection = Math.max(0, e.manqueAffection - 50);
      e.besoinAffection = e.manqueAffection > 70;
      autonomes.push(`${this.Nom} manquait d’affection ; ${this.a('il', 'elle')} est ${this.a('parti', 'partie')} serrer un doudou très fort.`);
    }
    for (const t of autonomes) { this.noter(t); this.emettre({ type: 'autonomie', texte: t }); }

    for (const t of progressionTraits) e.traits[t] = Math.min(100, e.traits[t] + 1);

    if (effondrement && !e.mort) { this.emettre({ type: 'effondrement' }); this.effondrementEnAttente = true; }
  }

  private deposer(nature: 'crotte' | 'vomi') {
    const e = this.etat;
    const dej = { id: this.nouvelId(), x: 0.08 + this.rng() * 0.84, y: this.rng(), nature };
    e.dejections.push(dej);
    e.saleteRanch = Math.min(SALETE_MAX, e.saleteRanch + 1);
    this.emettre({ type: 'dejection', dejection: dej });
  }

  private evenement(nature: 'bruit' | 'invite' | 'visite') {
    const e = this.etat;
    const maintenant = heureTotale(e);
    let texte: string;
    if (nature === 'bruit') {
      texte = 'Un bruit étrange résonne au loin. C’est sans doute Garry qui continue ses ravages.';
      e.humeur = Math.max(0, e.humeur - 10);
      e.anxiete = borne(e.anxiete + 30);
      e.emotions.peur = borne(e.emotions.peur + 40);
      e.emotions.surprise = borne(e.emotions.surprise + 80);
    } else if (nature === 'invite') {
      const s = creerEchoSauvage(this.rng);
      e.echosSauvages.push(s);
      e.visiteur = { id: s.id, departA: maintenant + DUREE_VISITE_HEURES };
      texte = `Vous recevez de la visite ! ${s.nom}, un écho que vous ne connaissez pas, s’aventure sur le ranch.`;
    } else {
      const s = piocher(e.echosSauvages, this.rng);
      e.visiteur = { id: s.id, departA: maintenant + DUREE_VISITE_HEURES };
      texte = `${s.nom} revient vous rendre visite !`;
    }
    this.noter(texte);
    this.emettre({ type: 'evenement', nature, texte });
  }

  private declencherComportement(maintenant: number) {
    const e = this.etat;
    // temperamentWeights / weightedPick : la coloration suit la force relative des traits.
    const poids = CLES_TEMPERAMENT.map(k => e.traits[TRAIT_DE_TEMPERAMENT[k]]);
    const total = poids.reduce((a, b) => a + b, 0);
    let r = this.rng(), acc = 0, coloration: CleTemperament = 'ant';
    for (let i = 0; i < CLES_TEMPERAMENT.length; i++) {
      acc += total > 0 ? poids[i] / total : 0.2;
      if (r < acc) { coloration = CLES_TEMPERAMENT[i]; break; }
    }
    const types = [
      { k: 'reussite' as const, w: 1 + ((e.volonteMieux - 50) / 50) * 0.5 },
      { k: 'betise' as const, w: 1 + ((e.tendanceBetises - 50) / 50) * 0.5 },
      { k: 'amplification' as const, w: 1 },
      { k: 'neutre' as const, w: 1 },
    ];
    r = this.rng() * types.reduce((a, t) => a + t.w, 0);
    acc = 0;
    let type: (typeof types)[number]['k'] = 'neutre';
    for (const t of types) { acc += t.w; if (r < acc) { type = t.k; break; } }
    e.comportement = { coloration, type, objet: type === 'neutre' ? piocher(ALIMENTS, this.rng).id : null, debut: maintenant };
    this.emettre({ type: 'comportement' });
  }

  private evoluer(vers: Stade) {
    const e = this.etat;
    const de = e.stade;
    if (vers === 'adolescent') e.evolution = determinerAdolescent(e);
    if (vers === 'adulte') e.evolution = determinerAdulte(e) ?? e.evolution;
    e.stade = vers;
    for (const k of CLES_CARACS) e.caracs[k] = dixieme(e.caracs[k] * (1.2 + this.rng() * 0.2));
    const max = MAX_PAR_STADE[vers];
    Object.assign(e, {
      satiete: max, humeur: 50, energie: max, proprete: 100, affame: false, besoin: 0, anxiete: 20, risqueMaladie: 0,
      malade: false, heuresMaladie: 0, digestion: false, blesse: false, manqueAffection: 0, besoinAffection: false,
      refusNourriture: false, forcerNourriture: false, comportement: null,
    });
    e.educationStade = { cognitif: 0, socio: 0, moteur: 0, joy: 0, fear: 0, sorrow: 0, wrath: 0, disgust: 0 };
    this.noter(`${this.Nom} a grandi ! ${this.a('Il', 'Elle')} a atteint le stade ${NOM_STADE[vers]}.`);
    this.emettre({ type: 'evolution', de, vers });
  }

  // ————————————————————————————————————————— soins

  /** Nourrir avec l'aliment de la case `index` du sac. */
  nourrir(index: number): Reussi<{ texte: string }> | Refus {
    const e = this.etat;
    const c = e.inventaire[index];
    const a = c && aliment(c.id);
    if (!a) return { ok: false, raison: 'Ce n’est pas quelque chose qui se mange.' };
    const max = this.max;
    const compatible = regimeCompatible(e.gouts.regime, a);
    const repu = e.satiete > max * 0.8;
    const force = e.forcerNourriture;
    const refuser = () => {
      e.refusNourriture = true;
      appliquerEmotions(e, { colere: 10, joie: -5, tristesse: 5, surprise: 20, degout: 10 });
      const texte = `${this.Nom} refuse d’y toucher.`;
      this.noter(`${this.Nom} a refusé de manger (${a.nom.toLowerCase()}).`);
      this.emettre({ type: 'refus', texte });
      return { ok: false as const, raison: texte };
    };
    if (!force && e.malade && this.rng() < 0.5) return refuser();
    if (!force && repu && this.rng() * 100 < e.frustrationAlimentaire) return refuser();
    if (!force && !compatible && this.rng() * 100 < e.frustrationAlimentaire) {
      e.expressionPersonnelleJusqua = heureTotale(e) + 1;
      return refuser();
    }
    consommer(e, index);
    e.satiete = borne(e.satiete + a.satiete, 0, max);
    const prefere = e.gouts.platPrefere === a.id;
    const deteste = e.gouts.platDeteste === a.id;
    const saveur = a.saveurs.includes(e.gouts.saveur);
    let humeur = e.humeur;
    if (e.gouts.regime === 'Carnivore' && a.categories.some(k => k === 'Poisson' || k === 'Viande')) humeur += 5;
    if (e.gouts.regime === 'Végétarien' && a.categories.includes('Simili-carne')) humeur += 10;
    if (!compatible) humeur -= 10;
    if (prefere) humeur += 10;
    if (deteste) humeur -= 10;
    if (a.categories.includes(e.gouts.categorie)) humeur += 5;
    if (saveur) humeur += 2;
    if (!compatible || deteste) e.frustrationAlimentaire = Math.max(0, e.frustrationAlimentaire - 5);
    if (repu) { humeur -= 10; e.frustrationAlimentaire = Math.max(0, e.frustrationAlimentaire - 5); }
    e.humeur = borne(humeur);
    e.poids = Math.max(0.1, centieme(e.poids + a.masse));
    const d: Partial<Emotions> = { joie: 0, colere: 0, tristesse: 0, degout: 0, peur: 0 };
    const ajoute = (x: Partial<Emotions>) => { for (const [k, v] of Object.entries(x)) d[k as keyof Emotions] = (d[k as keyof Emotions] ?? 0) + (v ?? 0); };
    if (compatible && e.gouts.regime !== 'Omnivore') ajoute({ joie: 3 });
    if (saveur) ajoute({ joie: 3, degout: -3 });
    if (prefere) ajoute({ joie: 10, degout: -10 });
    if (deteste) ajoute({ joie: -20, tristesse: 10, colere: 10, degout: 20 });
    if (!compatible) ajoute({ degout: 10, colere: 20, tristesse: 5, peur: 5, joie: -20 });
    if (repu) ajoute({ joie: -10, degout: 20, colere: 10, tristesse: 5, peur: 3 });
    appliquerEmotions(e, d);
    e.digestion = true;
    if (e.satiete > 0) e.affame = false;
    e.refusNourriture = false;
    e.forcerNourriture = false;
    this.noter(`${this.Nom} a mangé (${a.nom.toLowerCase()}).`);
    // Ce que le joueur perçoit : une réaction, jamais une valeur.
    const texte = prefere ? `${this.Nom} dévore son repas avec un plaisir évident !`
      : deteste || !compatible ? `${this.Nom} avale en grimaçant.`
      : repu ? `${this.Nom} mange du bout des lèvres…`
      : saveur ? `${this.Nom} se régale.` : `${this.Nom} mange tranquillement.`;
    this.message(texte, prefere || saveur ? 'bien' : deteste || !compatible || repu ? 'mal' : 'note');
    return { ok: true, texte };
  }

  /** Laver : 2 heures ; la propreté ne remonte qu'à la fin. */
  laver(): Reussi | Refus {
    const e = this.etat;
    const etaitSale = e.proprete <= 20;
    this.avancer(2);
    if (e.mort) return { ok: false, raison: '' };
    e.proprete = 100;
    appliquerEmotions(e, etaitSale ? { joie: 15, degout: -20 } : { joie: 5, degout: -10 });
    this.noter(`Vous avez lavé ${e.nom}.`);
    this.message(etaitSale ? `${this.Nom} sent bon le savon et s’ébroue de plaisir.` : `${this.Nom} est tout${this.a('', 'e')} propre.`, 'bien');
    return { ok: true };
  }

  /** Coucher : seulement si l'écho a sommeil (énergie ≤ 20). */
  coucher(): Reussi<{ heures: number }> | Refus {
    if (this.etat.energie > 20) {
      const raison = `${this.Nom} n’a pas sommeil.`;
      this.emettre({ type: 'refus', texte: raison });
      return { ok: false, raison };
    }
    return { ok: true, heures: this.dormir(false) };
  }

  /** sleepFlow : dort jusqu'à récupérer (10 d'énergie par heure). */
  private dormir(effondrement: boolean) {
    const e = this.etat;
    const heures = Math.max(1, Math.ceil((this.max - e.energie) / 10));
    this.enSommeil = true;
    this.avancer(heures, { repos: true });
    this.enSommeil = false;
    this.effondrementEnAttente = false;
    if (e.mort) return heures;
    e.pvCombat = null;
    const mot = `heure${heures > 1 ? 's' : ''}`;
    this.noter(effondrement
      ? `${this.Nom} était si ${this.a('fatigué', 'fatiguée')} qu’${this.a('il', 'elle')} s’est ${this.a('écroulé', 'écroulée')} et a dormi ${heures} ${mot}.`
      : `${this.Nom} a dormi ${heures} ${mot}.`);
    if (!effondrement) appliquerEmotions(e, { joie: 10, colere: -10, tristesse: -10, degout: -10, peur: -10 });
    this.emettre({ type: 'sommeil', heures, effondrement });
    return heures;
  }

  /** Utiliser l'objet de la case `index` (aliment, pansement, médicament, appât). */
  utiliser(index: number): Reussi<{ texte?: string }> | Refus {
    const e = this.etat;
    const c = e.inventaire[index];
    if (!c) return { ok: false, raison: '' };
    if (aliment(c.id)) return this.nourrir(index);
    const o = objetDivers(c.id);
    if (o?.usage === 'pansement') {
      if (!e.blesse) return { ok: false, raison: `${this.Nom} n’a pas de blessure.` };
      consommer(e, index);
      e.blesse = false;
      e.refusNourriture = false;
      appliquerEmotions(e, { joie: 5, colere: -10, degout: -5, peur: -35, tristesse: -5 });
      this.noter(`${this.Nom} a été ${this.a('soigné', 'soignée')}, la blessure est refermée.`);
      this.message(`${this.Nom} se laisse faire, ${this.a('rassuré', 'rassurée')}.`, 'bien');
      return { ok: true };
    }
    if (o?.usage === 'medicament') {
      if (!e.malade) return { ok: false, raison: `${this.Nom} n’est pas ${this.a('malade', 'malade')}, ce médicament ne servirait à rien.` };
      consommer(e, index);
      Object.assign(e, { malade: false, heuresMaladie: 0, risqueMaladie: 0, sante: 20, immuniteJusqua: heureTotale(e) + 36 });
      this.noter(`Un médicament a été donné : ${e.nom} est en pleine forme.`);
      this.message(`${this.Nom} retrouve des couleurs.`, 'bien');
      this.emettre({ type: 'guerison' });
      return { ok: true };
    }
    if (o?.usage === 'appat') {
      if (e.visiteur) return { ok: false, raison: 'Un écho est déjà là.' };
      consommer(e, index);
      // triggerEchoVisitFromAppat : les échos connus reviennent selon leur affect, contre une chance d'un nouveau.
      const options = [{ nouveau: true, poids: 15, id: '' }].concat(
        e.echosSauvages.map(s => ({ nouveau: false, poids: Math.max(1, 10 + s.affectPositif - s.affectNegatif), id: s.id })),
      );
      let r = this.rng() * options.reduce((a, x) => a + x.poids, 0);
      let choix = options[options.length - 1];
      for (const x of options) { r -= x.poids; if (r <= 0) { choix = x; break; } }
      if (choix.nouveau || !choix.id) this.evenement('invite');
      else {
        const s = e.echosSauvages.find(x => x.id === choix.id)!;
        e.visiteur = { id: s.id, departA: heureTotale(e) + DUREE_VISITE_HEURES };
        const texte = `L’appât attire ${s.nom}, qui revient vous rendre visite !`;
        this.noter(texte); this.emettre({ type: 'evenement', nature: 'visite', texte });
      }
      return { ok: true };
    }
    return { ok: false, raison: 'Cet objet ne sert à rien ici.' };
  }

  /** Ramasser une déjection (ou un vomi). */
  nettoyer(id: number) {
    const e = this.etat;
    const i = e.dejections.findIndex(d => d.id === id);
    if (i === -1) return false;
    e.dejections.splice(i, 1);
    e.saleteRanch = Math.max(0, e.saleteRanch - 1);
    return true;
  }

  // ————————————————————————————————————————— lien

  /** Caresser d'un clic : 10 fois par jour, ensuite l'écho refuse. (Règle du nouveau ranch.) */
  caresser(): Reussi | Refus {
    const e = this.etat;
    if (e.caresses.jour !== e.jour) e.caresses = { jour: e.jour, nombre: 0 };
    if (e.caresses.nombre >= CARESSES_PAR_JOUR) {
      const raison = `${this.Nom} ne veut plus être ${this.a('caressé', 'caressée')}.`;
      this.emettre({ type: 'refus', texte: raison });
      return { ok: false, raison };
    }
    e.caresses.nombre += 1;
    // Une caresse est un petit geste : une fraction de « Caresser la tête » (mood 12, joie 12) sans faire passer le temps.
    e.humeur = borne(e.humeur + 3);
    appliquerEmotions(e, { joie: 3, tristesse: -1 });
    e.manqueAffection = e.besoinAffection ? Math.max(0, e.manqueAffection - 25) : Math.max(0, e.manqueAffection - 8);
    e.besoinAffection = e.manqueAffection > 70;
    if (e.caresses.nombre === 1) { e.affection = borne(e.affection + 0.5); this.eduquer('socio', 'joy'); }
    return { ok: true };
  }

  /** Trois propositions tirées au hasard dans la catégorie (une seule interaction par catégorie et par jour). */
  proposer(categorie: Exclude<CategorieInteraction, 'cadeau'>): OptionInteraction[] | null {
    if (this.etat.interactionsDuJour[categorie] === this.etat.jour) return null;
    const reserve = INTERACTIONS[categorie].slice();
    const choix: OptionInteraction[] = [];
    while (choix.length < 3 && reserve.length) choix.push(reserve.splice(Math.floor(this.rng() * reserve.length), 1)[0]);
    return choix;
  }

  libelle(o: OptionInteraction) {
    const e = this.etat;
    const h = heureDuJour(e);
    const nuit = h >= 21 || h < 6;
    const petit = e.stade === 'bebe' || e.stade === 'enfant';
    const t = o.libelleJour ? (nuit ? o.libelleNuit! : o.libelleJour) : o.libellePetit ? (petit ? o.libellePetit : o.libelleGrand!) : o.libelle!;
    return accorderTexte(t, e);
  }

  /** chooseInteraction : applique l'option puis fait passer une heure. */
  interagir(categorie: Exclude<CategorieInteraction, 'cadeau'>, o: OptionInteraction): Reussi<{ texte: string }> | Refus {
    const e = this.etat;
    if (e.interactionsDuJour[categorie] === e.jour) return { ok: false, raison: `Vous avez déjà partagé ce genre de moment aujourd’hui.` };
    const prefere = e.gouts.interaction === categorie;
    e.interactionsDuJour[categorie] = e.jour;
    e.humeur = borne(e.humeur + (o.humeur ?? 0) + (prefere ? 2 : 0));
    e.attachement = borne(e.attachement + (o.attachement ?? 0));
    e.affection = borne(e.affection + (o.affection ?? 0) + (prefere ? 1 : 0));
    e.anxiete = borne(e.anxiete + (o.anxiete ?? 0));
    e.energie = borne(e.energie + (o.energie ?? 0), 0, this.max);
    e.discipline = borne(e.discipline + (o.discipline ?? 0));
    e.autonomie = borne(e.autonomie + (o.autonomie ?? 0));
    e.authenticite = borne(e.authenticite + (o.authenticite ?? 0));
    e.sentimentJustice = borne(e.sentimentJustice + (o.sentimentJustice ?? 0));
    e.altruisme = borne(e.altruisme + (o.altruisme ?? 0));
    if (o.affection) {
      e.manqueAffection = e.besoinAffection && o.affection > 0 ? 0 : Math.max(0, e.manqueAffection - 25);
      e.besoinAffection = e.manqueAffection > 70;
    }
    if (o.emotions) appliquerEmotions(e, o.emotions);
    // (Le prototype n'ajoutait ici qu'au cumul du stade et au total, pas au cumul du jour.)
    if (o.education?.processus) { e.educationStade[o.education.processus]++; e.educationTotale[o.education.processus]++; }
    if (o.education?.emotion) { e.educationStade[o.education.emotion]++; e.educationTotale[o.education.emotion]++; }
    this.avancer(1);
    this.noter(accorderTexte(o.journal, e));
    return { ok: true, texte: accorderTexte(o.resultat, e) };
  }

  /** Gronder : une fois par heure de jeu. */
  gronder(): Reussi | Refus {
    const e = this.etat;
    const t = heureTotale(e);
    if (e.dernierGronder === t) return { ok: false, raison: `${this.Nom} a déjà été ${this.a('grondé', 'grondée')} il y a un instant.` };
    const refus = e.refusNourriture;
    e.humeur = borne(e.humeur - 15);
    e.dernierGronder = t;
    if (refus) { e.forcerNourriture = true; e.discipline = Math.min(100, e.discipline + 1); e.refusNourriture = false; }
    if (this.expressionPersonnelle) e.authenticite = Math.max(0, e.authenticite - 1);
    e.sentimentJustice = borne(e.sentimentJustice + (e.betise ? 1 : -1));
    if (e.betise) e.tendanceBetises = borne(e.tendanceBetises - 0.5);
    if (e.reussite) e.volonteMieux = borne(e.volonteMieux - 0.5);
    if (e.besoinAffection) {
      e.manqueAffection = 0; e.besoinAffection = false;
      e.affection = Math.max(0, e.affection - 10);
      e.autonomie = Math.min(100, e.autonomie + 3);
      e.discipline = Math.min(100, e.discipline + 3);
      e.authenticite = Math.max(0, e.authenticite - 3);
    }
    this.noter(`${this.Nom} a été ${this.a('grondé', 'grondée')}.`);
    appliquerEmotions(e, { joie: -10, colere: 15, tristesse: 10, degout: 5, peur: 5 });
    if (e.reussite) this.eduquer('socio', 'wrath');
    if (e.betise) this.eduquer('socio', 'sorrow');
    else { this.eduquer('socio', 'fear'); this.eduquer('socio', 'wrath'); }
    const r = e.reactionCorvee;
    if (r && !r.succes) { e.experienceCorvees[r.corvee] = (e.experienceCorvees[r.corvee] ?? 0) + 1; e.reactionCorvee = null; }
    return { ok: true };
  }

  /** Féliciter : une fois par heure de jeu. */
  feliciter(): Reussi | Refus {
    const e = this.etat;
    const t = heureTotale(e);
    if (e.dernierFeliciter === t) return { ok: false, raison: `${this.Nom} a déjà été ${this.a('félicité', 'félicitée')} il y a un instant.` };
    const refus = e.refusNourriture;
    e.humeur = borne(e.humeur + 15);
    e.dernierFeliciter = t;
    if (refus) { e.autonomie = Math.min(100, e.autonomie + 1); e.refusNourriture = false; }
    if (this.expressionPersonnelle) e.authenticite = Math.min(100, e.authenticite + 1);
    e.sentimentJustice = borne(e.sentimentJustice + (e.reussite ? 1 : -1));
    if (e.betise) e.tendanceBetises = borne(e.tendanceBetises + 0.5);
    if (e.reussite) e.volonteMieux = borne(e.volonteMieux + 0.5);
    this.noter(`${this.Nom} a été ${this.a('félicité', 'félicitée')}.`);
    appliquerEmotions(e, { joie: 15, tristesse: -5, colere: -5, peur: -3 });
    if (e.reussite) this.eduquer('socio', 'joy'); else this.eduquer('socio', 'disgust');
    if (e.betise) { this.eduquer('socio', 'sorrow'); this.eduquer('socio', 'fear'); }
    const r = e.reactionCorvee;
    if (r && r.succes) { e.experienceCorvees[r.corvee] = (e.experienceCorvees[r.corvee] ?? 0) + 1; e.reactionCorvee = null; }
    return { ok: true };
  }

  /** Réponses possibles au comportement en cours. */
  reponsesComportement(): { cle: ReponseComportement; libelle: string }[] {
    const c = this.etat.comportement;
    if (!c) return [];
    if (c.type === 'amplification') return [{ cle: 'encourager', libelle: 'Encourager' }, { cle: 'prevenir', libelle: 'Prévenir des risques' }, { cle: 'rien', libelle: 'Ne rien dire' }];
    if (c.type === 'neutre') return [{ cle: 'remercier', libelle: 'Remercier' }, { cle: 'critiquer', libelle: 'Critiquer' }, { cle: 'rien', libelle: 'Ne rien dire' }];
    return [{ cle: 'feliciter', libelle: 'Féliciter' }, { cle: 'gronder', libelle: 'Gronder' }, { cle: 'rien', libelle: 'Ne rien dire' }];
  }

  /** resolveComportement */
  repondreComportement(reponse: ReponseComportement): Reussi<{ objetTrouve?: string; sacPlein?: boolean }> | Refus {
    const e = this.etat;
    const c = e.comportement;
    if (!c) return { ok: false, raison: '' };
    const trait = TRAIT_DE_TEMPERAMENT[c.coloration];
    const ajuste = (k: 'authenticite' | 'sentimentJustice' | 'egoisme' | 'volonteMieux' | 'autonomie' | 'altruisme' | 'discipline' | 'tendanceBetises' | 'affection', v: number) => { e[k] = borne(e[k] + v); };
    const traitPlus = (v: number) => { e.traits[trait] = borne(e.traits[trait] + v); };
    const lien = (v: number) => {
      e.affection = borne(e.affection + v);
      e.manqueAffection = v > 0 && e.besoinAffection ? 0 : Math.max(0, e.manqueAffection - 25);
      e.besoinAffection = e.manqueAffection > 70;
    };
    let humeur = 0;
    let d: Partial<Emotions> = {};
    const { type } = c;
    if (type === 'reussite') {
      if (reponse === 'feliciter') { ajuste('authenticite', 2); ajuste('sentimentJustice', 2); ajuste('egoisme', 2); ajuste('volonteMieux', 0.5); humeur = 15; d = { joie: 15, tristesse: -5 }; }
      else if (reponse === 'gronder') { ajuste('sentimentJustice', -1); ajuste('authenticite', -1); ajuste('egoisme', -4); ajuste('volonteMieux', -0.5); humeur = -12; d = { colere: 12, tristesse: 8, joie: -8 }; }
      else { ajuste('autonomie', 4); ajuste('authenticite', 2); ajuste('egoisme', 1); traitPlus(1); humeur = 4; d = { joie: 4 }; }
    } else if (type === 'betise') {
      if (reponse === 'feliciter') { ajuste('altruisme', -4); ajuste('authenticite', 2); ajuste('discipline', -3); ajuste('autonomie', 1); ajuste('sentimentJustice', -1); ajuste('tendanceBetises', 0.5); traitPlus(2); humeur = 8; d = { joie: 10, colere: -3 }; }
      else if (reponse === 'gronder') { ajuste('sentimentJustice', 3); ajuste('discipline', 4); ajuste('autonomie', -1); ajuste('authenticite', -1); ajuste('altruisme', 4); ajuste('tendanceBetises', -0.5); traitPlus(-0.5); humeur = -12; d = { colere: 10, tristesse: 8, peur: 5, joie: -8 }; }
      else { ajuste('autonomie', 4); ajuste('discipline', -1); ajuste('altruisme', -1); ajuste('egoisme', 1); ajuste('authenticite', 2); traitPlus(1); humeur = 3; d = { joie: 3, surprise: 5 }; }
    } else if (type === 'amplification') {
      if (reponse === 'encourager') { ajuste('autonomie', 2); ajuste('authenticite', 2); humeur = 10; d = { joie: 8, peur: -3 }; }
      else if (reponse === 'prevenir') { ajuste('autonomie', -2); ajuste('authenticite', -1); humeur = -5; d = { peur: 8, tristesse: 3, joie: -5 }; }
      else { ajuste('autonomie', 4); ajuste('authenticite', 3); humeur = 2; d = { surprise: 5 }; }
    } else {
      if (reponse === 'remercier') { ajuste('autonomie', -2); ajuste('authenticite', 2); ajuste('sentimentJustice', 1); ajuste('altruisme', 2); ajuste('egoisme', -1); traitPlus(1); lien(1); humeur = 10; d = { joie: 10 }; }
      else if (reponse === 'critiquer') { ajuste('authenticite', -2); ajuste('sentimentJustice', -1); ajuste('altruisme', -1); lien(-2); humeur = -8; d = { colere: 5, tristesse: 5, joie: -5 }; }
      else { ajuste('autonomie', 4); ajuste('authenticite', 1); lien(-1); humeur = 2; d = { surprise: 3 }; }
    }
    e.humeur = borne(e.humeur + humeur);
    appliquerEmotions(e, d);
    const deltaEdu = type === 'reussite' ? (reponse === 'feliciter' ? 2 : reponse === 'gronder' ? -1 : 0)
      : type === 'amplification' ? (reponse === 'encourager' ? 4 : reponse === 'prevenir' ? -2 : 1) : 0;
    this.ajusterEmotionEducative(EMOTION_DE_TEMPERAMENT[c.coloration], deltaEdu);
    e.comportement = null;
    this.noter(journalComportement(this.Nom, c.coloration, type, reponse));
    if (type === 'neutre' && c.objet) {
      const nom = aliment(c.objet)?.nom ?? 'objet';
      if (ranger(e, c.objet, 1) === 0) return { ok: true, objetTrouve: nom, sacPlein: true };
      return { ok: true, objetTrouve: nom };
    }
    return { ok: true };
  }

  // ————————————————————————————————————————— activités

  /** Entraînement : 2 heures, gains de caractéristiques (cachés). */
  entrainer(id: string): Reussi<{ principal: CleCarac; secondaire: CleCarac }> | Refus {
    const e = this.etat;
    if (e.malade) return { ok: false, raison: `${this.Nom} est ${this.a('malade', 'malade')} et ne peut pas s’entraîner.` };
    const t = ENTRAINEMENTS.find(x => x.id === id);
    if (!t) return { ok: false, raison: '' };
    const secondaire = piocher(CLES_CARACS.filter(k => k !== t.carac), this.rng);
    const mult = MULT_ENTRAINEMENT[e.stade] * (1 + (e.personnalite.conscienciosite - 3) / 10) * (0.85 + e.humeur / 333);
    const gainP = dixieme((10 + (t.temperament ? e.temperament[t.temperament] : 0)) * mult * (0.8 + this.rng() * 0.4));
    const gainS = dixieme(3 * mult * (0.8 + this.rng() * 0.4));
    this.avancer(2);
    if (e.mort) return { ok: false, raison: '' };
    e.energie = Math.max(0, e.energie - 5);
    e.caracs[t.carac] = Math.min(999, dixieme(e.caracs[t.carac] + gainP));
    e.caracs[secondaire] = Math.min(999, dixieme(e.caracs[secondaire] + gainS));
    e.poids = Math.max(0.1, centieme(e.poids - 0.25));
    this.eduquer(t.processus, t.emotion);
    this.noter(`${this.Nom} a terminé l’entraînement : ${t.nom.toLowerCase()}.`);
    return { ok: true, principal: t.carac, secondaire };
  }

  /**
   * Corvée : `reussis` / `total` est le score du mini-jeu (finishChoreGame).
   * Fait passer une heure, avec l'humeur et les émotions selon le palier.
   */
  corvee(id: string, reussis: number, total: number): Reussi<{ palier: 'Parfait' | 'Bon' | 'Mauvais' | 'Horrible' }> | Refus {
    const e = this.etat;
    const c = CORVEES.find(x => x.id === id);
    if (!c) return { ok: false, raison: '' };
    let palier: 'Parfait' | 'Bon' | 'Mauvais' | 'Horrible', secondaire: number, gain: number, humeur: number, d: Partial<Emotions>, emo: 'joy' | 'sorrow' | 'wrath';
    if (reussis === total) { palier = 'Parfait'; secondaire = 6 + this.rng() * 2; gain = 28 + this.rng() * 8; humeur = 20; d = { joie: 20, surprise: 10 }; emo = 'joy'; }
    else if (reussis >= total / 2) { palier = 'Bon'; secondaire = 3 + this.rng() * 2; gain = 14 + this.rng() * 6; humeur = 10; d = { joie: 10 }; emo = 'joy'; }
    else if (reussis >= 1) { palier = 'Mauvais'; secondaire = 1 + this.rng(); gain = 4 + this.rng() * 4; humeur = -8; d = { tristesse: 10, colere: 5, joie: -5 }; emo = 'sorrow'; }
    else { palier = 'Horrible'; secondaire = 0; gain = 0; humeur = -20; d = { tristesse: 20, colere: 10, peur: 5, joie: -15 }; emo = 'wrath'; }
    // (Les niveaux d'amélioration des corvées, construits par Ash, ne sont pas encore repris : multiplicateur 1.)
    this.eduquer('cognitif', emo);
    this.avancer(1, { gainHumeur: humeur, emotions: d, message: `${this.Nom} : ${c.nom.toLowerCase()} (${palier.toLowerCase()}).` });
    e.caracs[c.carac] = dixieme(e.caracs[c.carac] + dixieme(gain));
    if (!c.sansSecondaire) e.caracs.intelligence = dixieme(e.caracs.intelligence + dixieme(secondaire));
    e.experienceCorvees[id] = (e.experienceCorvees[id] ?? 0) + 1;
    e.derniereCorvee[id] = e.jour;
    const succes = palier === 'Parfait' || palier === 'Bon';
    e.reactionCorvee = { corvee: id, succes };
    e.reussite = succes;
    e.betise = !succes;
    return { ok: true, palier };
  }

  /** « Laisser le temps passer » (timePass) : l'écho s'ennuie. */
  laisserPasser(heures = 1) {
    this.avancer(heures, { ennui: true });
  }

  // ————————————————————————————————————————— visiteurs

  get visiteur() {
    const v = this.etat.visiteur;
    return v ? this.etat.echosSauvages.find(s => s.id === v.id) ?? null : null;
  }

  /** echoCompatibilite : écart moyen de personnalité (0 = identiques). */
  compatibilite(id: string) {
    const s = this.etat.echosSauvages.find(x => x.id === id);
    if (!s) return 5;
    const p = this.etat.personnalite;
    const cles = Object.keys(p) as (keyof typeof p)[];
    return centieme(cles.reduce((a, k) => a + Math.abs(s.personnalite[k] - p[k]), 0) / cles.length);
  }

  /** spendTimeTogether */
  passerDuTempsAvecVisiteur(): Reussi<{ texte: string }> | Refus {
    const s = this.visiteur;
    if (!s) return { ok: false, raison: `${this.Nom} n’a personne avec qui passer du temps.` };
    const compat = this.compatibilite(s.id);
    let plus: number, humeur: number, d: Partial<Emotions>, texte: string;
    if (compat < 1) { plus = 5; humeur = 25; d = { joie: 25, tristesse: -8, peur: -5, colere: -5 }; texte = `${this.Nom} et ${s.nom} se comportent vraiment de la même manière !`; }
    else if (compat < 2) { plus = 3; humeur = 15; d = { joie: 15, tristesse: -5, peur: -3 }; texte = `${this.Nom} et ${s.nom} ont l’air de bien s’entendre.`; }
    else if (compat < 3) { plus = 2; humeur = 8; d = { joie: 8 }; texte = `${this.Nom} et ${s.nom} ne font pas vraiment la paire, mais cela pourrait être pire.`; }
    else { plus = 1; humeur = 0; d = {}; texte = `On a rarement vu deux échos aussi différents que ${this.etat.nom} et ${s.nom}.`; }
    s.affectPositif = borne(s.affectPositif + plus);
    if (humeur > 0) { this.avancer(1, { gainHumeur: humeur, emotions: d, message: `${this.Nom} a passé du temps avec ${s.nom}.` }); this.eduquer('socio', 'joy'); }
    else this.noter(`${this.Nom} a passé du temps avec ${s.nom}.`);
    return { ok: true, texte };
  }

  /** play / fight + finishDuoAnim */
  duoAvecVisiteur(nature: 'jeu' | 'bagarre'): Reussi<{ texte: string; succes: boolean }> | Refus {
    const e = this.etat;
    const s = this.visiteur;
    if (!s) return { ok: false, raison: `${this.Nom} n’a personne avec qui ${nature === 'jeu' ? 'jouer' : 'se bagarrer'}.` };
    const compat = this.compatibilite(s.id);
    const x = compat + 1 + (5 - s.personnalite.extraversion) + (5 - s.personnalite.agreabilite) - (1 - s.affectPositif / 100 + s.affectNegatif / 100);
    const proba = borne((14 - x) / 14 + (e.personnalite.agreabilite - 1) / 100, 0, 1);
    const succes = this.rng() < proba;
    const perteSante = nature === 'bagarre' && this.rng() < 1 / 3 ? 1 : 0;
    const debutBlessure = nature === 'bagarre' && !e.blesse && this.rng() < 1 / 5;
    s.affectPositif = borne(s.affectPositif + (succes ? 5 - compat : 0));
    s.affectNegatif = borne(s.affectNegatif + (succes ? -(5 - compat) : 2 + compat));
    let texte: string;
    if (nature === 'bagarre') {
      if (succes) {
        texte = `${this.Nom} s’est ${this.a('bagarré', 'bagarrée')} avec ${s.nom}.`;
        this.avancer(1, { perteSante, debutBlessure, message: texte, emotions: { joie: 5, colere: 10, peur: 10, tristesse: -5 } });
        this.eduquer('socio', 'wrath');
        e.expressionPersonnelleJusqua = heureTotale(e) + 1;
      } else {
        texte = `${s.nom} n’a pas voulu se bagarrer avec ${e.nom}.`;
        this.avancer(1, { perteSante, debutBlessure, message: texte, emotions: { colere: 25, tristesse: 15, degout: 5, peur: 5, joie: -10 } });
      }
    } else if (succes) {
      texte = `${this.Nom} a joué avec ${s.nom}.`;
      this.avancer(1, { message: texte, emotions: { joie: 20, colere: -5, tristesse: -10 } });
      this.eduquer('socio', 'joy');
      e.expressionPersonnelleJusqua = heureTotale(e) + 1;
    } else {
      texte = `${s.nom} n’a pas voulu jouer avec ${e.nom}.`;
      this.avancer(1, { message: texte, emotions: { tristesse: 20, peur: 10, colere: 10 } });
    }
    return { ok: true, texte, succes };
  }

  // ————————————————————————————————————————— combat

  /**
   * Seuils d'intelligence (150, 350, 550, 750) : chaque seuil franchi pour la première fois apprend une technique
   * du pool de l'écho (checkTechniqueUnlocks). Les trois premières apprises sont équipées d'office.
   */
  apprendreTechniques(): string[] {
    const e = this.etat;
    const t = e.techniques ?? { connues: [], equipees: [], seuils: [] };
    const r = apprendreTechniques(e.caracs.intelligence, t.seuils, t.connues, poolTechniques(e), this.rng);
    const equipees = t.equipees.slice();
    for (const n of r.apprises) if (equipees.length < 3) equipees.push(n);
    e.techniques = { connues: r.connues, equipees, seuils: r.seuilsPasses };
    for (const n of r.apprises) {
      this.noter(`${this.Nom} a appris une technique : ${n}.`);
      this.emettre({ type: 'technique', nom: n });
    }
    return r.apprises;
  }

  /** Retire un exemplaire de l'objet `id` du sac (objet utilisé en combat). */
  retirerObjet(id: string): boolean {
    const i = this.etat.inventaire.findIndex((c) => c?.id === id);
    return i >= 0 && consommer(this.etat, i);
  }

  /** Après un combat gagné ou perdu (applyCombatOutcome) : progrès, or, éducation, émotions, une heure qui passe. */
  terminerCombat(b: BilanCombat, adversaire?: string) {
    const e = this.etat;
    if (e.mort) return;
    for (const k of CLES_CARACS) e.caracs[k] = Math.min(999, dixieme((e.caracs[k] || 0) + b.progres[k]));
    e.or += b.or;
    e.pvCombat = b.pv;
    this.eduquer('moteur', 'wrath');
    this.eduquer(null, 'fear');
    this.apprendreTechniques();
    const contre = adversaire ? ` contre ${adversaire}` : '';
    const texte = b.resultat === 'victoire' ? `${this.Nom} a remporté un combat${contre}.` : `${this.Nom} a perdu un combat${contre}.`;
    this.avancer(1, { gainHumeur: b.humeur, emotions: b.emotions, debutBlessure: b.blessure, message: texte });
  }
}

const NOM_TEMP_JOURNAL: Record<CleTemperament, [string, string]> = {
  cur: ['sa', 'curiosité'], res: ['sa', 'résolution'], dis: ['son', 'discernement'], obs: ['son', 'sens de l’observation'], ant: ['son', 'sens de l’anticipation'],
};

/** buildComportementEventLog */
function journalComportement(nom: string, col: CleTemperament, type: string, rep: ReponseComportement) {
  const [poss, mot] = NOM_TEMP_JOURNAL[col];
  const reactions: Record<string, string> = {
    feliciter: type === 'betise' ? 'vous l’avez félicité malgré tout' : 'vous l’avez félicité',
    gronder: type === 'reussite' ? 'vous l’avez grondé malgré tout' : 'vous l’avez grondé',
    encourager: 'vous avez encouragé ce comportement', prevenir: 'vous l’avez mis en garde', remercier: 'vous l’avez remercié',
    critiquer: 'vous l’avez critiqué', rien: 'vous n’avez rien dit',
  };
  const quoi = type === 'reussite' ? `a réussi quelque chose grâce à ${poss} ${mot}`
    : type === 'betise' ? `a fait une bêtise par excès de ${mot}`
    : type === 'amplification' ? `a fait une forte démonstration de ${poss} ${mot}`
    : `a trouvé et offert un objet grâce à ${poss} ${mot}`;
  return `${nom} ${quoi}, et ${reactions[rep]}.`;
}
