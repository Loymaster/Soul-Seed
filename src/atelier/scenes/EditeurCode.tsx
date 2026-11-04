// Éditeur de texte des scènes (CodeMirror 6), dans les couleurs de l'atelier.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { completionKeymap } from '@codemirror/autocomplete';
import { lintGutter, lintKeymap } from '@codemirror/lint';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { marquerLecture } from './langage';

export interface PoigneeEditeur {
  remplacer(source: string): void;
  texte(): string;
  ligneCurseur(): number;
  allerA(ligne: number): void;
  marquer(ligne: number | null): void;
  inserer(texte: string): void;
  focus(): void;
}

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '15px', backgroundColor: '#fffaf0' },
  '.cm-scroller': { fontFamily: "'Alegreya Sans', 'Alegreya', Georgia, serif", lineHeight: '1.65' },
  '.cm-content': { padding: '12px 0 120px', caretColor: '#9c3b2a' },
  '.cm-line': { padding: '0 16px 0 10px' },
  '.cm-gutters': { backgroundColor: '#f1e6cf', color: '#a8957a', border: 'none', borderRight: '1px solid #e2d3b3' },
  '.cm-activeLine': { backgroundColor: 'rgba(201,160,80,.10)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(201,160,80,.22)', color: '#6e3f22' },
  '.cm-ligne-lue': { backgroundColor: 'rgba(63,122,58,.13)', boxShadow: 'inset 3px 0 0 #3f7a3a' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: 'rgba(201,160,80,.35) !important' },
  '.cm-tooltip': { border: '1px solid #cdb994', backgroundColor: '#fbf6ea', borderRadius: '6px', boxShadow: '0 10px 30px -12px rgba(43,33,24,.5)' },
  '.cm-tooltip-autocomplete > ul > li': { padding: '3px 10px !important' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#2b2118', color: '#f4ead6' },
  '.cm-completionDetail': { color: '#8a755c', fontStyle: 'normal', marginLeft: '10px' },
  '.cm-diagnostic': { fontFamily: "'Alegreya Sans', sans-serif", fontSize: '14px', padding: '6px 10px' },
  '.cm-diagnostic-error': { borderLeft: '4px solid #9c3b2a' },
  '.cm-diagnostic-warning': { borderLeft: '4px solid #c9a050' },
  '.cm-diagnostic-info': { borderLeft: '4px solid #2f5a7a' },
  '.cm-placeholder': { color: '#b9a47c', fontStyle: 'italic' },
  '.cm-panels': { backgroundColor: '#f1e6cf', color: '#2b2118' },
  '.cm-searchMatch': { backgroundColor: 'rgba(201,160,80,.35)' }
});

export const EditeurCode = forwardRef<PoigneeEditeur, {
  source: string;
  extensions: Extension[];
  surChangement: (source: string) => void;
  surCurseur?: (ligne: number) => void;
  raccourcis?: { jouerIci?: () => void; enregistrer?: () => void };
}>(function EditeurCode({ source, extensions, surChangement, surCurseur, raccourcis }, ref) {
  const hote = useRef<HTMLDivElement>(null);
  const vue = useRef<EditorView | null>(null);
  const rappels = useRef({ surChangement, surCurseur, raccourcis });
  rappels.current = { surChangement, surCurseur, raccourcis };

  useEffect(() => {
    const v = new EditorView({
      parent: hote.current!,
      state: EditorState.create({
        doc: source,
        extensions: [
          lineNumbers(), highlightActiveLineGutter(), highlightActiveLine(), drawSelection(), history(), search({ top: true }), highlightSelectionMatches(),
          indentUnit.of('  '), EditorState.tabSize.of(2), EditorView.lineWrapping, lintGutter(),
          placeholder('Écrivez votre scène… (Ctrl + Espace pour les suggestions)'),
          keymap.of([
            { key: 'Mod-Enter', run: () => { rappels.current.raccourcis?.jouerIci?.(); return true; } },
            { key: 'Mod-s', run: () => { rappels.current.raccourcis?.enregistrer?.(); return true; }, preventDefault: true },
            ...completionKeymap, ...searchKeymap, ...lintKeymap, ...historyKeymap, indentWithTab, ...defaultKeymap
          ]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) rappels.current.surChangement(u.state.doc.toString());
            if (u.selectionSet || u.docChanged) rappels.current.surCurseur?.(u.state.doc.lineAt(u.state.selection.main.head).number);
          }),
          theme,
          ...extensions
        ]
      })
    });
    vue.current = v;
    return () => v.destroy();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    remplacer(s) {
      const v = vue.current!;
      if (v.state.doc.toString() === s) return;
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: s } });
    },
    texte: () => vue.current!.state.doc.toString(),
    ligneCurseur: () => { const v = vue.current!; return v.state.doc.lineAt(v.state.selection.main.head).number; },
    allerA(ligne) {
      const v = vue.current!;
      const l = v.state.doc.line(Math.max(1, Math.min(ligne, v.state.doc.lines)));
      v.dispatch({ selection: { anchor: l.from + (l.text.length - l.text.trimStart().length) }, scrollIntoView: true });
      v.focus();
    },
    marquer(ligne) {
      const v = vue.current;
      if (!v) return;
      v.dispatch({ effects: marquerLecture.of(ligne) });
      if (ligne && ligne <= v.state.doc.lines) {
        const pos = v.state.doc.line(ligne).from;
        const bloc = v.lineBlockAt(pos);
        const rect = v.scrollDOM;
        if (bloc.top < rect.scrollTop || bloc.bottom > rect.scrollTop + rect.clientHeight) v.dispatch({ effects: EditorView.scrollIntoView(pos, { y: 'center' }) });
      }
    },
    inserer(texte) {
      // Insère un bloc sous la ligne du curseur, au même niveau d'indentation.
      const v = vue.current!;
      const l = v.state.doc.lineAt(v.state.selection.main.head);
      const indent = l.text.match(/^\s*/)![0];
      const vide = l.text.trim() === '';
      const bloc = texte.split('\n').map((x) => (x ? indent + x : x)).join('\n');
      const pos = vide ? l.from : l.to;
      const insert = vide ? bloc : '\n' + bloc;
      const curseur = insert.indexOf('…');
      v.dispatch({
        changes: { from: pos, to: vide ? l.to : pos, insert: insert.replace('…', '') },
        selection: { anchor: pos + (curseur >= 0 ? curseur : insert.length) },
        scrollIntoView: true
      });
      v.focus();
    },
    focus: () => vue.current?.focus()
  }), []);

  return <div ref={hote} style={{ height: '100%', minHeight: 0, overflow: 'hidden' }} />;
});
