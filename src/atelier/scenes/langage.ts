// Prise en charge du format .scene dans CodeMirror : coloration, complétion, erreurs, nom des PNJ à leur couleur d'encre.
import { StreamLanguage, HighlightStyle, syntaxHighlighting, type StringStream } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { autocompletion, type CompletionContext, type CompletionResult, type Completion } from '@codemirror/autocomplete';
import { linter, type Diagnostic } from '@codemirror/lint';
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder, StateEffect, StateField, type Extension } from '@codemirror/state';
import { RESONANCES, identifiant } from '@/moteur/scene/analyseur';
import { verifierSource, type ContexteScene } from '@/moteur/scene/valider';
import { VARIABLES_DU_JEU } from '@/moteur/scene/valider';

// ---------------------------------------------------------------------------------------------
// Coloration

interface EtatLigne { mode: 'debut' | 'texte' | 'expr' | 'option' | 'valeur' | 'emotion' }

const MOT_CLE = /^(titre|sc[eè]ne|places|d[ée]cor|musique|entre|sortent|sort|d[ée]place|pause|aller(?:\s+[àa])?|choix)\s*:/i;

function jetonTexte(s: StringStream) {
  if (s.match(/^\{[\p{L}_][\p{L}\p{N}_.]*\}/u)) return 'variableName';
  s.next();
  while (!s.eol() && s.peek() !== '{') s.next();
  return 'content';
}

function jetonExpr(s: StringStream) {
  if (s.eatSpace()) return null;
  if (s.match(/^\d+(?:[.,]\d+)?/)) return 'number';
  if (s.match(/^(vrai|faux)\b/i)) return 'bool';
  if (s.match(/^(et|ou|non)\b/i)) return 'operatorKeyword';
  if (s.match(/^(si)\b/i)) return 'keyword';
  if (s.match(/^«[^»]*»?/) || s.match(/^"[^"]*"?/)) return 'string';
  if (s.match(/^(==|!=|<=|>=|\+=|-=|[<>=+\-*()!])/)) return 'operator';
  if (s.match(/^[\p{L}_][\p{L}\p{N}_.-]*/u)) return 'variableName';
  if (s.match(/^:/)) return 'punctuation';
  s.next();
  return null;
}

const langageScene = StreamLanguage.define<EtatLigne>({
  name: 'scene',
  startState: () => ({ mode: 'debut' }),
  token(s, e) {
    if (s.sol()) e.mode = 'debut';
    if (e.mode === 'debut') {
      if (s.eatSpace()) return null;
      if (s.match('//')) { s.skipToEnd(); return 'comment'; }
      let m: RegExpMatchArray | null;
      if ((m = s.match(MOT_CLE) as RegExpMatchArray | null)) {
        const cle = identifiant(m[1]);
        e.mode = cle === 'choix' ? 'texte' : cle === 'titre' ? 'texte' : 'valeur';
        return 'keyword';
      }
      if (s.match(/^(sinon\s+si|si)\b/i)) { e.mode = 'expr'; return 'keyword'; }
      if (s.match(/^sinon\b\s*:?/i)) return 'keyword';
      if (s.match(/^fin\.?\s*$/i)) return 'keyword';
      if (s.match('>')) { e.mode = 'option'; return 'punctuation'; }
      if (s.match(/^[ée]cho\s*:/i)) { e.mode = 'emotion'; return 'keyword'; }
      if (s.match(/^[\p{L}_][\p{L}\p{N}_.-]*(?=\s*(\+=|-=|=))/u)) { e.mode = 'expr'; return 'variableName'; }
      if (s.match(/^(narration|narrateur)(?=\s*:)/i)) return 'special';
      if (s.match(/^(vous|joueur|joueuse)(?=\s*:)/i)) return 'special';
      if (s.match(/^[\p{L}][\p{L}\p{N} '’-]*?(?=\s*(\[[^\]]*\])?\s*:)/u)) return 'personnage';
      if (s.match(/^\s*\[[^\]]*\]/)) return 'tagName';
      if (s.match(/^\s*:/)) { e.mode = 'texte'; return 'punctuation'; }
      s.skipToEnd();
      return 'invalid';
    }
    if (e.mode === 'texte') return jetonTexte(s);
    if (e.mode === 'expr') return jetonExpr(s);
    if (e.mode === 'valeur') { s.skipToEnd(); return 'string'; }
    if (e.mode === 'emotion') {
      if (s.eatSpace()) return null;
      if (s.match(/^\([^)]*\)?/)) { e.mode = 'texte'; return 'labelName'; }
      return jetonTexte(s);
    }
    if (e.mode === 'option') {
      if (s.eatSpace()) return null;
      if (s.match(/^[^\s«":]+/)) { e.mode = 'expr'; return 'atom'; }
      s.next();
      return null;
    }
    s.next();
    return null;
  },
  tokenTable: { personnage: t.className, special: t.special(t.className), bool: t.bool, invalid: t.invalid },
  languageData: { commentTokens: { line: '//' } }
});

const style = HighlightStyle.define([
  { tag: t.comment, color: '#9a8668', fontStyle: 'italic' },
  { tag: t.keyword, color: '#6e3f22', fontWeight: '700' },
  { tag: t.className, color: '#2b2118', fontWeight: '700' },
  { tag: t.special(t.className), color: '#6b4f33', fontStyle: 'italic', fontWeight: '700' },
  { tag: t.tagName, color: '#9c3b2a' },
  { tag: t.labelName, color: '#3f7a3a', fontWeight: '700' },
  { tag: t.atom, color: '#2f5a7a', fontWeight: '700' },
  { tag: t.string, color: '#566b3a' },
  { tag: t.variableName, color: '#4a3a6b' },
  { tag: t.number, color: '#b3671a' },
  { tag: t.bool, color: '#b3671a', fontWeight: '700' },
  { tag: [t.operator, t.operatorKeyword], color: '#7a2e2e' },
  { tag: t.punctuation, color: '#8a755c' },
  { tag: t.invalid, color: '#9c3b2a', textDecoration: 'underline wavy' }
]);

// ---------------------------------------------------------------------------------------------
// Le nom de chaque PNJ prend sa couleur d'encre (comme dans le jeu).

function decorerNoms(ctx: () => ContexteScene & { encres: Record<string, string> }) {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(v: EditorView) { this.decorations = this.construire(v); }
    update(u: ViewUpdate) { if (u.docChanged || u.viewportChanged) this.decorations = this.construire(u.view); }
    construire(v: EditorView) {
      const b = new RangeSetBuilder<Decoration>();
      const { encres } = ctx();
      for (const { from, to } of v.visibleRanges) {
        for (let pos = from; pos <= to;) {
          const ligne = v.state.doc.lineAt(pos);
          const m = ligne.text.match(/^(\s*)([\p{L}][\p{L}\p{N} '’-]*?)(?=\s*(\[[^\]]*\])?\s*:)/u);
          if (m) {
            const id = identifiant(m[2]);
            if (encres[id]) b.add(ligne.from + m[1].length, ligne.from + m[1].length + m[2].length, Decoration.mark({ attributes: { style: `color:${encres[id]}` } }));
          }
          pos = ligne.to + 1;
        }
      }
      return b.finish();
    }
  }, { decorations: (p) => p.decorations });
}

// ---------------------------------------------------------------------------------------------
// Ligne en cours de lecture dans l'aperçu

export const marquerLecture = StateEffect.define<number | null>();
const ligneLue = Decoration.line({ class: 'cm-ligne-lue' });
export const champLecture = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(marquerLecture)) continue;
      if (e.value === null || e.value < 1 || e.value > tr.state.doc.lines) return Decoration.none;
      const l = tr.state.doc.line(e.value);
      return Decoration.set([ligneLue.range(l.from)]);
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f)
});

// ---------------------------------------------------------------------------------------------
// Complétion

function completer(ctx: () => ContexteScene & { encres: Record<string, string>; variables: string[] }) {
  return (c: CompletionContext): CompletionResult | null => {
    const ligne = c.state.doc.lineAt(c.pos);
    const avant = ligne.text.slice(0, c.pos - ligne.from);
    const x = ctx();
    const options = (liste: Completion[], debut: number): CompletionResult => ({ from: ligne.from + debut, options: liste, validFor: /^[\p{L}\p{N}_.\-/]*$/u });
    let m: RegExpMatchArray | null;

    if ((m = avant.match(/^(\s*)([\p{L}][\p{L}\p{N} '’-]*?)\s*\[([\p{L}\p{N}-]*)$/u))) {
      const id = identifiant(m[2]);
      const ex = x.pnj[id]?.expressions || [];
      return options(ex.map((e) => ({ label: e, type: 'enum', detail: x.pnj[id].nom })), avant.length - m[3].length);
    }
    if ((m = avant.match(/^\s*[ée]cho\s*:\s*\(([\p{L}-]*)$/u))) {
      return options(x.emotions.map((e) => ({ label: e, type: 'enum', apply: `${e}) ` })), avant.length - m[1].length);
    }
    if ((m = avant.match(/^\s*(entre|d[ée]place)\s*:\s*\S+\s+(\S*)$/i))) {
      return options([['G1', 'gauche, au bord'], ['G2', 'gauche, au centre'], ['D2', 'droite, au centre'], ['D1', 'droite, au bord']].map(([p, d]) => ({ label: p, detail: d, type: 'constant' })), avant.length - m[2].length);
    }
    if ((m = avant.match(/^\s*(entre|sort|sortent|d[ée]place)\s*:\s*(?:.*,\s*)?([\p{L}\p{N}-]*)$/iu))) {
      return options(Object.entries(x.pnj).map(([id, p]) => ({ label: id, detail: p.nom, type: 'class', apply: m![1].startsWith('sort') ? id : `${id} ` })), avant.length - m[2].length);
    }
    if ((m = avant.match(/^\s*places\s*:\s*(?:.*,\s*)?([\p{L}\p{N}-]*)$/iu))) {
      return options(Object.entries(x.pnj).map(([id, p]) => ({ label: id, detail: p.nom, type: 'class', apply: `${id} ` })), avant.length - m[1].length);
    }
    if ((m = avant.match(/^\s*d[ée]cor\s*:\s*(\S*)$/i))) {
      return options(x.decors.map((d) => ({ label: d.replace(/^decors\//, '').replace(/\.png$/, ''), type: 'text' })), avant.length - m[1].length);
    }
    if ((m = avant.match(/^\s*musique\s*:\s*(\S*)$/i))) {
      return options([{ label: 'aucune', type: 'keyword' }, ...x.musiques.map((d) => ({ label: d.replace(/^sons\/musiques\//, '').replace(/\.mp3$/, ''), type: 'text' }))], avant.length - m[1].length);
    }
    if ((m = avant.match(/^\s*aller\s*(?:[àa])?\s*:\s*(\S*)$/i))) {
      return options(x.scenes.map((s) => ({ label: s, type: 'text' })), avant.length - m[1].length);
    }
    if ((m = avant.match(/^\s*>\s*([\p{L}?]*)$/u))) {
      return options(Object.entries(RESONANCES).map(([, r]) => ({ label: r.nom.toLowerCase(), type: 'enum', apply: `${r.nom.toLowerCase()} « ` })), avant.length - m[1].length);
    }
    if ((m = avant.match(/\{([\p{L}\p{N}_.]*)$/u))) {
      return options(x.variables.map((v) => ({ label: v, type: 'variable', apply: `${v}}` })), avant.length - m[1].length);
    }
    if ((m = avant.match(/^\s*(?:sinon\s+)?si\s+(?:.*[\s(])?([\p{L}\p{N}_.-]*)$/iu)) || (m = avant.match(/^\s*>.*\bsi\s+(?:.*[\s(])?([\p{L}\p{N}_.-]*)$/iu))) {
      return options([...x.variables.map((v) => ({ label: v, type: 'variable' })), ...['et', 'ou', 'non', 'vrai', 'faux'].map((k) => ({ label: k, type: 'keyword' }))], avant.length - m[1].length);
    }
    if ((m = avant.match(/^(\s*)([\p{L}][\p{L}\p{N}_.-]*)?$/u))) {
      if (!c.explicit && !m[2]) return null;
      const debut = m[1].length;
      const liste: Completion[] = [
        ...Object.entries(x.pnj).map(([id, p]) => ({ label: id, detail: `${p.nom} parle`, type: 'class', apply: `${id}: `, boost: 2 })),
        { label: 'narration', detail: 'texte du narrateur', type: 'keyword', apply: 'narration: ' },
        { label: 'vous', detail: 'le joueur parle', type: 'keyword', apply: 'vous: ' },
        { label: 'écho', detail: 'réaction de l’écho', type: 'keyword', apply: 'écho: (' },
        { label: 'entre', detail: 'un personnage arrive', type: 'keyword', apply: 'entre: ' },
        { label: 'sort', detail: 'un personnage s’en va', type: 'keyword', apply: 'sort: ' },
        { label: 'déplace', detail: 'change de place', type: 'keyword', apply: 'déplace: ' },
        { label: 'choix', detail: 'le joueur répond', type: 'keyword', apply: 'choix: Que répondre ?' },
        { label: 'si', detail: 'condition', type: 'keyword', apply: 'si ' },
        { label: 'sinon', type: 'keyword', apply: 'sinon:' },
        { label: 'décor', type: 'keyword', apply: 'décor: ' },
        { label: 'musique', type: 'keyword', apply: 'musique: ' },
        { label: 'pause', type: 'keyword', apply: 'pause: 1' },
        { label: 'aller', detail: 'enchaîner sur une autre scène', type: 'keyword', apply: 'aller: ' },
        { label: 'fin', type: 'keyword' },
        ...x.variables.map((v) => ({ label: v, type: 'variable', detail: 'variable', apply: `${v} += 1` }))
      ];
      return { from: ligne.from + debut, options: liste, validFor: /^[\p{L}\p{N}_.-]*$/u };
    }
    return null;
  };
}

// ---------------------------------------------------------------------------------------------
// Erreurs

export { verifierSource };

function verifier(id: () => string, ctx: () => ContexteScene) {
  return linter((v) => {
    const doc = v.state.doc;
    const { problemes } = verifierSource(doc.toString(), id(), ctx());
    return problemes.filter((p) => p.ligne >= 1 && p.ligne <= doc.lines).map((p): Diagnostic => {
      const l = doc.line(p.ligne);
      const de = Math.min(l.from + (p.de ?? 0), l.to);
      const a = Math.max(de, Math.min(l.from + (p.a ?? l.length), l.to));
      return { from: de, to: a === de ? Math.min(de + 1, l.to) : a, severity: p.niveau === 'erreur' ? 'error' : p.niveau === 'alerte' ? 'warning' : 'info', message: p.message };
    });
  }, { delay: 300 });
}

export function extensionsScene(options: { id: () => string; contexte: () => ContexteScene & { encres: Record<string, string>; variables: string[] } }): Extension[] {
  return [
    langageScene,
    syntaxHighlighting(style),
    decorerNoms(options.contexte),
    champLecture,
    autocompletion({ override: [completer(options.contexte)], icons: false, activateOnTyping: true }),
    verifier(options.id, options.contexte)
  ];
}

export { VARIABLES_DU_JEU };
