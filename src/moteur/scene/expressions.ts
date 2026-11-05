// Petites expressions des scènes : conditions (« si … ») et valeurs affectées aux variables.
//   garry.relation >= 2 et non indices.garry
//   (filo.confiance + 1) > 3 ou profil.premiere_partie == vrai
// Une variable jamais définie vaut 0 (et donc « faux »).
import type { Expr, Valeur } from './types';

type Jeton = { t: 'nb'; v: number } | { t: 'txt'; v: string } | { t: 'id'; v: string } | { t: 'op'; v: string };

export class ErreurExpression extends Error {
  constructor(message: string, public colonne = 0) { super(message); }
}

const MOTS: Record<string, Jeton> = {
  vrai: { t: 'op', v: 'vrai' }, faux: { t: 'op', v: 'faux' },
  et: { t: 'op', v: 'et' }, ou: { t: 'op', v: 'ou' }, non: { t: 'op', v: 'non' }
};

function decouper(source: string): Jeton[] {
  const res: Jeton[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    const reste = source.slice(i);
    let m: RegExpMatchArray | null;
    if ((m = reste.match(/^\d+(?:[.,]\d+)?/))) { res.push({ t: 'nb', v: parseFloat(m[0].replace(',', '.')) }); i += m[0].length; continue; }
    if ((m = reste.match(/^"([^"]*)"|^«\s*([^»]*?)\s*»/))) { res.push({ t: 'txt', v: m[1] ?? m[2] }); i += m[0].length; continue; }
    if ((m = reste.match(/^(==|!=|<=|>=|&&|\|\||[<>=!+\-*()])/))) {
      const v = { '&&': 'et', '||': 'ou', '!': 'non', '=': '==' }[m[0]] || m[0];
      res.push({ t: 'op', v }); i += m[0].length; continue;
    }
    if ((m = reste.match(/^[\p{L}_][\p{L}\p{N}_.-]*/u))) {
      const mot = m[0].replace(/[.-]+$/, '');
      res.push(MOTS[mot.toLowerCase()] || { t: 'id', v: mot });
      i += mot.length; continue;
    }
    throw new ErreurExpression(`Caractère inattendu « ${c} »`, i);
  }
  return res;
}

/** Analyse une expression ; lève ErreurExpression si elle est mal formée. */
export function analyserExpression(source: string): Expr {
  const j = decouper(source);
  let p = 0;
  const voir = () => j[p];
  const est = (v: string) => j[p]?.t === 'op' && j[p].v === v;
  const prendre = (v: string) => { if (!est(v)) throw new ErreurExpression(`« ${v} » attendu`); p++; };

  function ou(): Expr { let g = et(); while (est('ou')) { p++; g = { t: 'bin', op: 'ou', g, d: et() }; } return g; }
  function et(): Expr { let g = non(); while (est('et')) { p++; g = { t: 'bin', op: 'et', g, d: non() }; } return g; }
  function non(): Expr { if (est('non')) { p++; return { t: 'non', e: non() }; } return comparaison(); }
  function comparaison(): Expr {
    const g = somme();
    const o = voir();
    if (o?.t === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(o.v)) { p++; return { t: 'bin', op: o.v as '==', g, d: somme() }; }
    return g;
  }
  function somme(): Expr {
    let g = produit();
    while (est('+') || est('-')) { const op = (voir() as { v: string }).v as '+'; p++; g = { t: 'bin', op, g, d: produit() }; }
    return g;
  }
  function produit(): Expr { let g = unaire(); while (est('*')) { p++; g = { t: 'bin', op: '*', g, d: unaire() }; } return g; }
  function unaire(): Expr { if (est('-')) { p++; return { t: 'neg', e: unaire() }; } return atome(); }
  function atome(): Expr {
    const a = voir();
    if (!a) throw new ErreurExpression('Expression incomplète');
    p++;
    if (a.t === 'nb' || a.t === 'txt') return { t: 'val', v: a.v };
    if (a.t === 'id') return { t: 'var', nom: a.v };
    if (a.v === 'vrai') return { t: 'val', v: true };
    if (a.v === 'faux') return { t: 'val', v: false };
    if (a.v === '(') { const e = ou(); prendre(')'); return e; }
    throw new ErreurExpression(`« ${a.v} » inattendu`);
  }

  if (!j.length) throw new ErreurExpression('Expression vide');
  const e = ou();
  if (p < j.length) throw new ErreurExpression(`« ${(j[p] as { v: unknown }).v} » en trop`);
  return e;
}

const nombre = (v: Valeur) => (typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : parseFloat(v) || 0);
export const vrai = (v: Valeur) => (typeof v === 'string' ? v !== '' : nombre(v) !== 0);

export function evaluer(e: Expr, lire: (nom: string) => Valeur | undefined): Valeur {
  switch (e.t) {
    case 'val': return e.v;
    case 'var': return lire(e.nom) ?? 0;
    case 'non': return !vrai(evaluer(e.e, lire));
    case 'neg': return -nombre(evaluer(e.e, lire));
    case 'bin': {
      if (e.op === 'et') return vrai(evaluer(e.g, lire)) && vrai(evaluer(e.d, lire));
      if (e.op === 'ou') return vrai(evaluer(e.g, lire)) || vrai(evaluer(e.d, lire));
      const g = evaluer(e.g, lire), d = evaluer(e.d, lire);
      switch (e.op) {
        case '+': return typeof g === 'string' || typeof d === 'string' ? `${g}${d}` : nombre(g) + nombre(d);
        case '-': return nombre(g) - nombre(d);
        case '*': return nombre(g) * nombre(d);
        case '==': return typeof g === typeof d ? g === d : nombre(g) === nombre(d);
        case '!=': return typeof g === typeof d ? g !== d : nombre(g) !== nombre(d);
        case '<': return nombre(g) < nombre(d);
        case '>': return nombre(g) > nombre(d);
        case '<=': return nombre(g) <= nombre(d);
        case '>=': return nombre(g) >= nombre(d);
      }
    }
  }
}

/** Toutes les variables lues par une expression. */
export function variablesLues(e: Expr, res: Set<string> = new Set()): Set<string> {
  if (e.t === 'var') res.add(e.nom);
  else if (e.t === 'non' || e.t === 'neg') variablesLues(e.e, res);
  else if (e.t === 'bin') { variablesLues(e.g, res); variablesLues(e.d, res); }
  return res;
}

export function afficherValeur(v: Valeur | undefined): string {
  if (v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'vrai' : 'faux';
  if (typeof v === 'string') return `« ${v} »`;
  return String(Math.round(v * 100) / 100);
}

/** Remplace {variable} dans un texte par sa valeur (ex. « {echo.nom} te regarde. »). */
export function interpoler(texte: string, lire: (nom: string) => Valeur | undefined): string {
  // Accords : {joueur:prêt|prête|prêt·e} suit le pronom du joueur (il | elle | iel),
  // {echo:content|contente} suit le genre de l'écho (m | f).
  texte = texte.replace(/\{(joueur|echo):([^{}]*)\}/gu, (_, qui: string, formes: string) => {
    const f = formes.split('|');
    if (qui === 'echo') return lire('echo.genre') === 'f' ? (f[1] ?? f[0]) : f[0];
    const p = lire('joueur.pronom');
    if (p === 'elle') return f[1] ?? f[0];
    if (p === 'iel') return f[2] ?? (f[1] !== undefined ? `${f[0]}·${f[1]}` : f[0]);
    return f[0];
  });
  return texte.replace(/\{([\p{L}_][\p{L}\p{N}_.]*)\}/gu, (_, nom) => {
    const v = lire(nom);
    return v === undefined ? `{${nom}}` : typeof v === 'boolean' ? (v ? 'vrai' : 'faux') : String(v);
  });
}
