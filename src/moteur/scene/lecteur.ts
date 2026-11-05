// Exécution d'une scène : transforme l'arbre de la scène en une suite d'instructions,
// puis la déroule pas à pas. Le lecteur ne sait rien de l'affichage : il annonce ce qui change
// (entrées, sorties, décor, variables…) et l'événement qui attend le joueur (réplique, émotion, choix, fin).
import { evaluer, interpoler, vrai } from './expressions';
import type { Place } from './placement';
import { NARRATION, JOUEUR, type Expr, type Noeud, type Resonance, type Scene, type Valeur } from './types';

type Feuille = Exclude<Noeud, { type: 'si' } | { type: 'choix' }>;

export type Instruction =
  | { op: 'feuille'; ligne: number; noeud: Feuille }
  | { op: 'sautSiFaux'; ligne: number; condition: Expr; cible: number }
  | { op: 'saut'; ligne: number; cible: number }
  | { op: 'choix'; ligne: number; question?: string; options: { ligne: number; resonance: Resonance; texte: string; condition?: Expr; cible: number }[]; fin: number };

/** Compile l'arbre en instructions. L'ordre des instructions suit l'ordre des lignes du fichier. */
export function compiler(corps: Noeud[]): Instruction[] {
  const prog: Instruction[] = [];
  const emettre = (noeuds: Noeud[]) => {
    for (const n of noeuds) {
      if (n.type === 'si') {
        const sautsFin: Extract<Instruction, { op: 'saut' }>[] = [];
        n.branches.forEach((b, i) => {
          let test: Extract<Instruction, { op: 'sautSiFaux' }> | null = null;
          if (b.condition) { test = { op: 'sautSiFaux', ligne: b.ligne, condition: b.condition, cible: -1 }; prog.push(test); }
          emettre(b.corps);
          if (i < n.branches.length - 1) { const s = { op: 'saut' as const, ligne: b.ligne, cible: -1 }; prog.push(s); sautsFin.push(s); }
          if (test) test.cible = prog.length;
        });
        for (const s of sautsFin) s.cible = prog.length;
      } else if (n.type === 'choix') {
        const instr: Extract<Instruction, { op: 'choix' }> = { op: 'choix', ligne: n.ligne, question: n.question, options: [], fin: -1 };
        prog.push(instr);
        const sautsFin: Extract<Instruction, { op: 'saut' }>[] = [];
        for (const o of n.options) {
          instr.options.push({ ligne: o.ligne, resonance: o.resonance, texte: o.texte, condition: o.condition, cible: prog.length });
          emettre(o.corps);
          const s = { op: 'saut' as const, ligne: o.ligne, cible: -1 };
          prog.push(s); sautsFin.push(s);
        }
        instr.fin = prog.length;
        for (const s of sautsFin) s.cible = prog.length;
      } else {
        prog.push({ op: 'feuille', ligne: n.ligne, noeud: n });
      }
    }
  };
  emettre(corps);
  return prog;
}

export interface Presence { place: Place; expression?: string }

export type Changement =
  | { type: 'entre'; qui: string; place: Place; expression?: string; auto?: boolean }
  | { type: 'sort'; qui: string }
  | { type: 'deplace'; qui: string; place: Place }
  | { type: 'expression'; qui: string; expression: string }
  | { type: 'decor'; decor: string }
  | { type: 'musique'; musique: string | null }
  | { type: 'variable'; nom: string; avant: Valeur | undefined; apres: Valeur };

export type Evenement =
  | { type: 'replique'; ligne: number; qui: string; texte: string }
  | { type: 'emotion'; ligne: number; emotion: string; note?: string }
  | { type: 'choix'; ligne: number; question?: string; options: { index: number; resonance: Resonance; texte: string; ligne: number }[] }
  | { type: 'pause'; ligne: number; secondes: number }
  | { type: 'action'; ligne: number; nom: string; argument?: string }
  | { type: 'fin'; ligne?: number; suite?: string };

export interface Pas { changements: Changement[]; evenement: Evenement }

export interface EtatScene {
  decor?: string;
  musique?: string | null;
  presents: Record<string, Presence>;
  variables: Record<string, Valeur>;
}

export interface OptionsLecteur {
  /** valeurs de départ des variables (partie et profil) */
  variables?: Record<string, Valeur>;
  /** démarrer directement à cette ligne du fichier, la mise en scène étant reconstituée */
  depuisLigne?: number;
}

const ORDRE_PLACES: Place[] = ['G2', 'D2', 'G1', 'D1'];

export class LecteurScene {
  readonly programme: Instruction[];
  etat: EtatScene;
  private pc = 0;
  private attenteChoix: Extract<Instruction, { op: 'choix' }> | null = null;
  private optionsVisibles: number[] = [];
  private termine = false;
  /** ligne de la dernière instruction exécutée (pour suivre la lecture dans l'éditeur) */
  ligneCourante = 0;

  constructor(readonly scene: Scene, options: OptionsLecteur = {}) {
    this.programme = compiler(scene.corps);
    this.etat = { decor: scene.decor, musique: scene.musique, presents: {}, variables: { ...(options.variables || {}) } };
    for (const p of scene.places) this.etat.presents[p.qui] = { place: p.place, expression: p.expression };
    if (options.depuisLigne && options.depuisLigne > 1) this.avancerJusqua(options.depuisLigne);
  }

  lire = (nom: string): Valeur | undefined => this.etat.variables[nom];

  /** Les personnages présents au départ (avant le premier pas), pour l'animation d'ouverture. */
  get presentsDepart() { return { ...this.etat.presents }; }

  /** Exécute jusqu'au prochain moment qui attend le joueur. */
  suivant(): Pas {
    const changements: Changement[] = [];
    if (this.attenteChoix) throw new Error('Un choix est en attente : appelez choisir()');
    if (this.termine) return { changements, evenement: { type: 'fin' } };
    let garde = 0;
    while (this.pc < this.programme.length) {
      if (++garde > 10000) throw new Error('Boucle infinie dans la scène');
      const i = this.programme[this.pc];
      this.ligneCourante = i.ligne;
      if (i.op === 'saut') { this.pc = i.cible; continue; }
      if (i.op === 'sautSiFaux') { this.pc = vrai(evaluer(i.condition, this.lire)) ? this.pc + 1 : i.cible; continue; }
      if (i.op === 'choix') {
        const visibles = i.options.map((o, k) => (!o.condition || vrai(evaluer(o.condition, this.lire)) ? k : -1)).filter((k) => k >= 0);
        if (!visibles.length) { this.pc = i.fin; continue; } // aucune réponse possible : on passe
        this.attenteChoix = i;
        this.optionsVisibles = visibles;
        return {
          changements,
          evenement: { type: 'choix', ligne: i.ligne, question: i.question && interpoler(i.question, this.lire), options: visibles.map((k) => ({ index: k, resonance: i.options[k].resonance, texte: interpoler(i.options[k].texte, this.lire), ligne: i.options[k].ligne })) }
        };
      }
      this.pc++;
      const ev = this.executer(i.noeud, changements);
      if (ev) {
        if (ev.type === 'fin') this.termine = true;
        return { changements, evenement: ev };
      }
    }
    this.termine = true;
    return { changements, evenement: { type: 'fin' } };
  }

  /** Le joueur choisit une réponse (index dans les options du fichier, tel que fourni par l'événement). */
  choisir(index: number) {
    const c = this.attenteChoix;
    if (!c || !this.optionsVisibles.includes(index)) throw new Error('Choix impossible');
    this.attenteChoix = null;
    this.pc = c.options[index].cible;
  }

  get enAttenteDeChoix() { return !!this.attenteChoix; }

  /** Le jeu donne une valeur à une variable (par exemple le nom choisi pendant une action). */
  definir(nom: string, valeur: Valeur) { this.etat.variables[nom] = valeur; }

  private placeLibre(preferee?: Place): Place {
    const prises = new Set(Object.values(this.etat.presents).map((p) => p.place));
    if (preferee && !prises.has(preferee)) return preferee;
    return ORDRE_PLACES.find((p) => !prises.has(p)) || preferee || 'D1';
  }

  private executer(n: Feuille, ch: Changement[]): Evenement | null {
    const presents = this.etat.presents;
    switch (n.type) {
      case 'replique': {
        if (n.qui !== NARRATION && n.qui !== JOUEUR) {
          if (!presents[n.qui]) {
            const place = this.placeLibre();
            presents[n.qui] = { place, expression: n.expression };
            ch.push({ type: 'entre', qui: n.qui, place, expression: n.expression, auto: true });
          } else if (n.expression && presents[n.qui].expression !== n.expression) {
            presents[n.qui].expression = n.expression;
            ch.push({ type: 'expression', qui: n.qui, expression: n.expression });
          }
        }
        return { type: 'replique', ligne: n.ligne, qui: n.qui, texte: interpoler(n.texte, this.lire) };
      }
      case 'emotion':
        return { type: 'emotion', ligne: n.ligne, emotion: n.emotion, note: n.note && interpoler(n.note, this.lire) };
      case 'entre': {
        const deja = presents[n.qui];
        if (deja) {
          if (n.place && n.place !== deja.place) { deja.place = this.placeLibre(n.place); ch.push({ type: 'deplace', qui: n.qui, place: deja.place }); }
          if (n.expression) { deja.expression = n.expression; ch.push({ type: 'expression', qui: n.qui, expression: n.expression }); }
          return null;
        }
        const place = this.placeLibre(n.place);
        presents[n.qui] = { place, expression: n.expression };
        ch.push({ type: 'entre', qui: n.qui, place, expression: n.expression });
        return null;
      }
      case 'sort': {
        const qui = n.qui[0] === '*' ? Object.keys(presents) : n.qui;
        for (const q of qui) if (presents[q]) { delete presents[q]; ch.push({ type: 'sort', qui: q }); }
        return null;
      }
      case 'deplace': {
        const p = presents[n.qui];
        if (!p) return null;
        // si la place est prise, on échange les deux personnages
        const occupant = Object.entries(presents).find(([q, x]) => q !== n.qui && x.place === n.place);
        if (occupant) { occupant[1].place = p.place; ch.push({ type: 'deplace', qui: occupant[0], place: p.place }); }
        p.place = n.place;
        ch.push({ type: 'deplace', qui: n.qui, place: n.place });
        return null;
      }
      case 'decor':
        this.etat.decor = n.decor;
        ch.push({ type: 'decor', decor: n.decor });
        return null;
      case 'musique':
        this.etat.musique = n.musique;
        ch.push({ type: 'musique', musique: n.musique });
        return null;
      case 'affecte': {
        const avant = this.etat.variables[n.variable];
        const v = evaluer(n.valeur, this.lire);
        const base = typeof avant === 'number' ? avant : typeof avant === 'boolean' ? (avant ? 1 : 0) : 0;
        const apres = n.op === '=' ? v : n.op === '+=' ? base + (typeof v === 'number' ? v : vrai(v) ? 1 : 0) : base - (typeof v === 'number' ? v : vrai(v) ? 1 : 0);
        this.etat.variables[n.variable] = apres;
        ch.push({ type: 'variable', nom: n.variable, avant, apres });
        return null;
      }
      case 'pause':
        return { type: 'pause', ligne: n.ligne, secondes: n.secondes };
      case 'action':
        return { type: 'action', ligne: n.ligne, nom: n.nom, argument: n.argument };
      case 'aller':
        return { type: 'fin', ligne: n.ligne, suite: n.scene };
      case 'fin':
        return { type: 'fin', ligne: n.ligne };
    }
  }

  /**
   * Reconstitue l'état de la scène juste avant une ligne donnée, sans rien montrer :
   * on emprunte le chemin qui mène à cette ligne (la bonne branche d'un « si », la bonne réponse d'un choix),
   * en appliquant au passage les entrées, sorties, décors et variables.
   */
  private avancerJusqua(ligne: number) {
    const cibleIndex = this.programme.findIndex((i) => i.ligne >= ligne && i.op !== 'saut');
    if (cibleIndex < 0) { this.pc = this.programme.length; return; }
    let garde = 0;
    while (this.pc < cibleIndex && this.pc < this.programme.length && ++garde < 10000) {
      const i = this.programme[this.pc];
      if (i.op === 'saut') { this.pc = this.pc < cibleIndex && cibleIndex < i.cible ? this.pc + 1 : i.cible; continue; }
      if (i.op === 'sautSiFaux') { this.pc = cibleIndex < i.cible ? this.pc + 1 : i.cible; continue; }
      if (i.op === 'choix') {
        const k = i.options.findIndex((o, n) => o.cible <= cibleIndex && cibleIndex < (i.options[n + 1]?.cible ?? i.fin));
        this.pc = k >= 0 ? i.options[k].cible : i.fin;
        continue;
      }
      this.pc++;
      const n = i.noeud;
      if (n.type === 'fin' || n.type === 'aller') { this.pc = cibleIndex; break; }
      if (n.type === 'replique' || n.type === 'emotion' || n.type === 'pause' || n.type === 'action') {
        if (n.type === 'replique') this.executer(n, []); // garde les entrées automatiques et les expressions
        continue;
      }
      this.executer(n, []);
    }
    this.pc = cibleIndex;
  }
}
