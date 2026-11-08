// Analyseur du format de scène « théâtre » (fichiers contenu/scenes/*.scene).
// Le format est décrit dans contenu/scenes/LISEZMOI.md. Exemple :
//
//   titre: Garry au village
//   décor: village/sanctuaire
//   places: myhra G1, garry D2
//
//   myhra: Garry… Tu n'as rien à faire ici.
//   écho: (anxieux) {echo.nom} se tasse derrière vous.
//   entre: jumpy G2 [surpris]
//   choix: Que répondre ?
//     > résolution « Rien qui te regarde. »
//       garry.relation -= 1
//       garry: Hm. Il a du caractère…
//     > observation « Pourquoi lui ? » si indices.garry >= 1
//       garry: Parce qu'il me rappelle quelqu'un.
//   si garry.relation < 0:
//     myhra: Tu l'as vexé.
//   sinon:
//     myhra: Il reviendra.
//
// L'analyse ne s'arrête jamais à la première erreur : chaque ligne fautive est signalée
// et le reste de la scène reste jouable.
import { analyserExpression, ErreurExpression } from './expressions';
import type { Place } from './placement';
import { ECHO, JOUEUR, NARRATION, type Branche, type Expr, type Noeud, type OptionChoix, type PresenceInitiale, type Probleme, type Resonance, type Scene } from './types';

interface Ligne { n: number; indent: number; texte: string; col: number; brut: string }

export const RESONANCES: Record<Resonance, { nom: string; alias: string[] }> = {
  curiosite: { nom: 'Curiosité', alias: ['cur', 'curiosite'] },
  resolution: { nom: 'Résolution', alias: ['res', 'resolution'] },
  discernement: { nom: 'Discernement', alias: ['dis', 'discernement'] },
  observation: { nom: 'Observation', alias: ['obs', 'observation'] },
  anticipation: { nom: 'Anticipation', alias: ['ant', 'anticipation'] },
  neutre: { nom: 'Neutre', alias: ['neu', 'neutre'] },
  indeterminee: { nom: 'Indéterminée', alias: ['ind', 'indeterminee', 'inconnue', '?'] }
};

const PLACES_ALIAS: Record<string, Place> = {
  g1: 'G1', g2: 'G2', d1: 'D1', d2: 'D2',
  gauche: 'G2', 'gauche-centre': 'G2', 'gauche-bord': 'G1', 'bord-gauche': 'G1',
  droite: 'D2', 'droite-centre': 'D2', 'droite-bord': 'D1', 'bord-droit': 'D1', 'bord-droite': 'D1'
};

export const MOTS_CLES = ['titre', 'scène', 'places', 'décor', 'musique', 'entre', 'sort', 'déplace', 'pause', 'action', 'choix', 'si', 'sinon', 'aller', 'fin', 'écho', 'narration', 'vous'];

/** Actions mises en scène par le jeu (« action: eclosion »), avec ce qu'elles font. */
export const ACTIONS: Record<string, string> = {
  graine: 'la graine de la partie apparaît, flottant au centre',
  eclosion: 'la graine tremble, s’ouvre dans un éclair et l’écho naît',
  'nommer-echo': 'le joueur donne un nom à son écho ({echo.nom} ensuite)',
  image: 'épingle une image au-dessus de la scène (« action: image pnj/garry/attaque-jumpy », « action: image aucune »)',
  montrer: 'tutoriel du ranch : met en lumière un élément de l’écran (« action: montrer sac » : echo, onglets, carnet, heure, sac, poteau ; « action: montrer aucun »)',
  // — Actions du monde (village, exploration) : jouées par src/jeu/monde/actions.ts
  donner: 'range un objet dans le sac (« action: donner canne_peche », « action: donner pomme 2 ») ; {action.ok} vaut faux si le sac est plein',
  retirer: 'retire un objet du sac (« action: retirer poisson_anguille », « action: retirer aliment » = le premier aliment) ; {action.ok}, {action.objet}',
  or: 'donne ou reprend de l’or (« action: or 10 », « action: or -5 »)',
  ressource: 'ajoute ou retire une ressource portée (« action: ressource bois 3 »)',
  recruter: 'un PNJ rejoint le village (« action: recruter lady-roger bebe ») : prospérité, {village.dernier}, journal',
  combat: 'combat contre un PNJ (« action: combat hevann ») ; ensuite {combat.issue} vaut "victoire", "defaite" ou "fuite"',
  boutique: 'ouvre l’étal de Jumpy ; la scène reprend quand on le ferme',
  stand: 'ouvre le stand de curiosités de Lady Roger',
  coffre: 'ouvre le coffre de Maïko (ou l’entrepôt)',
  travaux: 'ouvre le panneau des travaux d’Ash',
  travail: 'le travail à la boutique (mini-jeu) ; ensuite {travail.or} = l’or gagné',
  deblayer: 'déblayer un passage (mini-jeu des pierres) ; {action.ok}',
  drapeau: 'pose aussitôt un drapeau du monde (« action: drapeau garry.vaincu vrai »)',
  reconfort: 'Myhra réconforte l’écho (santé, vigueur, angoisse ; guérit s’il est angoissé)',
  motiver: 'Hevann motive l’écho : entraînements plus efficaces pendant 6 heures',
  'apprendre-echo': 'Jumpy révèle un trait de l’écho, en mots ; {jumpy.info}',
  heures: 'fait passer des heures (« action: heures 6 »)',
  journal: 'écrit une ligne dans le journal (« action: journal Garry a rejoint le village. »)',
  ranch: 'à la fin de la scène, le joueur rentre au ranch',
  lieu: 'à la fin de la scène, le joueur va ailleurs (« action: lieu sanctuaire », « action: lieu zone 27 »)',
  cinematique: 'une image plein cadre quelques secondes ; le dialogue attend, sans clic pour l’abréger, et elle s’efface avant qu’il reprenne (« action: cinematique pnj/nyxara/attaque-1 »)',
  technique: 'l’étiquette et le son d’une technique de combat au-dessus d’un PNJ (« action: technique vinland G2 Lame de l’aube »)',
};

/** Identifiant canonique : minuscules, sans accents, tirets (comme les fichiers). */
export function identifiant(texte: string) {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function resonanceDe(mot: string): Resonance | null {
  const m = identifiant(mot) || mot.trim();
  for (const [r, def] of Object.entries(RESONANCES)) if (def.alias.includes(m)) return r as Resonance;
  return null;
}

export function placeDe(mot: string): Place | null {
  return PLACES_ALIAS[identifiant(mot)] || null;
}

function decouperLignes(source: string): Ligne[] {
  const res: Ligne[] = [];
  source.split(/\r?\n/).forEach((brut, i) => {
    const sansFin = brut.replace(/\s+$/, '');
    const t = sansFin.trim();
    if (!t || t.startsWith('//')) return;
    let indent = 0, col = 0;
    for (const c of sansFin) {
      if (c === ' ') indent++;
      else if (c === '\t') indent += 2;
      else break;
      col++;
    }
    res.push({ n: i + 1, indent, texte: t, col, brut: sansFin });
  });
  return res;
}

export interface ResultatAnalyse { scene: Scene; problemes: Probleme[] }

export function analyserScene(source: string, id: string): ResultatAnalyse {
  const lignes = decouperLignes(source);
  const problemes: Probleme[] = [];
  const scene: Scene = { id, places: [], corps: [], lignes: source.split(/\r?\n/).length };
  let p = 0;

  const signaler = (l: Ligne, message: string, niveau: Probleme['niveau'] = 'erreur', de?: number, a?: number) =>
    problemes.push({ niveau, ligne: l.n, message, de: de ?? l.col, a: a ?? l.brut.length });

  function expression(l: Ligne, source: string, decalage: number): Expr | null {
    try { return analyserExpression(source); } catch (e) {
      const err = e as ErreurExpression;
      signaler(l, `Condition illisible : ${err.message}`, 'erreur', decalage, l.brut.length);
      return null;
    }
  }

  function presence(l: Ligne, texte: string): { qui: string; place?: Place; expression?: string } | null {
    // « jumpy G2 [surpris] », « jumpy [surpris] gauche », « jumpy »
    let expr: string | undefined;
    const sansExpr = texte.replace(/\[([^\]]*)\]/, (_, e) => { expr = identifiant(e); return ' '; }).trim();
    const mots = sansExpr.split(/\s+/).filter(Boolean);
    if (!mots.length) { signaler(l, 'Personnage manquant'); return null; }
    let place: Place | undefined;
    if (mots.length > 1) {
      const pl = placeDe(mots[mots.length - 1]);
      if (pl) { place = pl; mots.pop(); } else { signaler(l, `Place inconnue « ${mots[mots.length - 1]} » : utilisez G1, G2, D2, D1 (ou gauche, droite, gauche-bord, droite-bord).`); }
    }
    return { qui: identifiant(mots.join(' ')), place, expression: expr };
  }

  /** Lit les lignes plus indentées que `parent` qui suivent (texte d'une réplique sur plusieurs lignes). */
  function suite(parent: number): string {
    const morceaux: string[] = [];
    while (p < lignes.length && lignes[p].indent > parent && !estInstruction(lignes[p].texte)) { morceaux.push(lignes[p].texte); p++; }
    return morceaux.join(' ');
  }

  function bloc(indentParent: number, dansChoix = false): Noeud[] {
    const noeuds: Noeud[] = [];
    if (p >= lignes.length || lignes[p].indent <= indentParent) return noeuds;
    const indent = lignes[p].indent;
    while (p < lignes.length && lignes[p].indent > indentParent) {
      const l = lignes[p];
      if (l.indent > indent) { signaler(l, 'Indentation inattendue : cette ligne est plus décalée que les précédentes.'); p++; continue; }
      if (l.indent < indent) { signaler(l, 'Indentation incohérente avec les lignes précédentes.'); }
      const n = instruction(l, dansChoix);
      if (n) noeuds.push(n);
    }
    return noeuds;
  }

  function instruction(l: Ligne, dansChoix: boolean): Noeud | null {
    const t = l.texte;
    let m: RegExpMatchArray | null;
    p++;

    // En-tête
    if ((m = t.match(/^(titre|sc[eè]ne|places)\s*:\s*(.*)$/i))) {
      const cle = identifiant(m[1]);
      if (l.indent > 0 || dansChoix) { signaler(l, `« ${m[1]} » ne s'utilise qu'en tête de scène.`); return null; }
      if (cle === 'titre') scene.titre = m[2].trim();
      else if (cle === 'scene') scene.id = identifiant(m[2]) || id;
      else {
        if (scene.corps.length) signaler(l, '« places » doit être écrit avant la première réplique.', 'alerte');
        for (const morceau of m[2].split(',').map((x) => x.trim()).filter(Boolean)) {
          const pr = presence(l, morceau);
          if (!pr) continue;
          if (!pr.place) { signaler(l, `Indiquez la place de ${pr.qui} (ex. « ${pr.qui} G1 »).`); continue; }
          scene.places.push({ ...pr, place: pr.place, ligne: l.n } as PresenceInitiale);
        }
      }
      return null;
    }
    if ((m = t.match(/^(d[ée]cor|musique)\s*:\s*(.*)$/i))) {
      const valeur = m[2].trim();
      const estDecor = identifiant(m[1]) === 'decor';
      const enTete = l.indent === 0 && !scene.corps.length && !noeudsEnCours;
      if (!valeur) { signaler(l, estDecor ? 'Décor manquant' : 'Musique manquante (ou « aucune »)'); return null; }
      if (estDecor) {
        if (enTete && scene.decor === undefined) { scene.decor = valeur; return null; }
        return { type: 'decor', ligne: l.n, decor: valeur };
      }
      const musique = /^(aucune|silence|non)$/i.test(valeur) ? null : valeur;
      if (enTete && scene.musique === undefined) { scene.musique = musique; return null; }
      return { type: 'musique', ligne: l.n, musique };
    }

    // Structure
    if ((m = t.match(/^sinon(\s+si\b.*)?\s*:?$/i))) {
      signaler(l, '« sinon » sans « si » juste avant (vérifiez l’indentation).');
      bloc(l.indent);
      return null;
    }
    if ((m = t.match(/^si\s+(.+?)\s*:?$/i))) {
      const branches: Branche[] = [];
      const premiere = expression(l, m[1], l.col + 3);
      branches.push({ ligne: l.n, condition: premiere ?? { t: 'val', v: false }, corps: bloc(l.indent) });
      while (p < lignes.length && lignes[p].indent === l.indent) {
        const s = lignes[p];
        const ms = s.texte.match(/^sinon\s+si\s+(.+?)\s*:?$/i);
        const mn = s.texte.match(/^sinon\s*:?$/i);
        if (!ms && !mn) break;
        p++;
        const cond = ms ? expression(s, ms[1], s.col + 9) ?? { t: 'val' as const, v: false } : null;
        branches.push({ ligne: s.n, condition: cond, corps: bloc(s.indent) });
        if (mn) break;
      }
      for (const b of branches) if (!b.corps.length) problemes.push({ niveau: 'alerte', ligne: b.ligne, message: 'Bloc vide : décalez les lignes qui en font partie.' });
      return { type: 'si', ligne: l.n, branches };
    }
    if ((m = t.match(/^choix\s*(?::\s*(.*))?$/i))) {
      const options: OptionChoix[] = [];
      while (p < lignes.length && lignes[p].indent > l.indent) {
        const o = lignes[p];
        const mo = o.texte.match(/^>\s*(.*)$/);
        if (!mo) { signaler(o, 'Dans un choix, chaque réponse commence par « > » (ex. « > curiosité « Pourquoi ? » »).'); p++; bloc(o.indent); continue; }
        p++;
        const opt = option(o, mo[1]);
        const corps = bloc(o.indent, true);
        if (opt) options.push({ ...opt, corps });
      }
      if (!options.length) signaler(l, 'Choix sans réponse : ajoutez des lignes « > résonance « texte » » décalées en dessous.');
      if (options.length > 6) signaler(l, `${options.length} réponses : la feuille de dialogue en affiche 6 au plus.`, 'alerte');
      return { type: 'choix', ligne: l.n, question: m[1]?.trim() || undefined, options };
    }
    if (t.startsWith('>')) { signaler(l, 'Réponse « > » en dehors d’un choix.'); bloc(l.indent); return null; }

    // Mise en scène
    if ((m = t.match(/^entre\s*:\s*(.+)$/i))) {
      const pr = presence(l, m[1]);
      return pr ? { type: 'entre', ligne: l.n, ...pr } : null;
    }
    if ((m = t.match(/^(sort|sortent)\s*:\s*(.+)$/i))) {
      const qui = m[2].split(/[,\s]+|\bet\b/).map(identifiant).filter(Boolean);
      return { type: 'sort', ligne: l.n, qui: qui.includes('tous') || qui.includes('tout-le-monde') ? ['*'] : qui };
    }
    if ((m = t.match(/^d[ée]place\s*:\s*(.+)$/i))) {
      const pr = presence(l, m[1]);
      if (pr && !pr.place) { signaler(l, 'Indiquez la nouvelle place (G1, G2, D2, D1).'); return null; }
      return pr ? { type: 'deplace', ligne: l.n, qui: pr.qui, place: pr.place! } : null;
    }
    if ((m = t.match(/^action\s*:\s*([\p{L}\p{N}-]+)\s*(.*)$/iu))) {
      const nom = identifiant(m[1]);
      if (!ACTIONS[nom]) signaler(l, `Action inconnue « ${m[1]} ». Possibles : ${Object.keys(ACTIONS).join(', ')}.`);
      return { type: 'action', ligne: l.n, nom, argument: m[2].trim() || undefined };
    }
    if ((m = t.match(/^pause\s*:\s*([\d.,]+)\s*s?$/i))) return { type: 'pause', ligne: l.n, secondes: parseFloat(m[1].replace(',', '.')) };
    if ((m = t.match(/^aller\s*(?:à|a)?\s*:\s*(.+)$/i))) return { type: 'aller', ligne: l.n, scene: identifiant(m[1]) };
    if (/^fin\.?$/i.test(t)) return { type: 'fin', ligne: l.n };

    // L'écho : il ne parle pas, il réagit.
    if ((m = t.match(/^[ée]cho\s*:\s*(.*)$/i))) {
      const me = m[1].match(/^\(\s*([^)]+?)\s*\)\s*(.*)$/);
      if (!me) { signaler(l, 'L’écho ne parle pas : indiquez son émotion entre parenthèses, ex. « écho: (fier) Il se redresse. »'); return null; }
      return { type: 'emotion', ligne: l.n, emotion: identifiant(me[1]), note: (me[2] + ' ' + suite(l.indent)).trim() || undefined };
    }

    // Variables : « garry.relation += 1 »
    if ((m = t.match(/^([\p{L}_][\p{L}\p{N}_.-]*)\s*(\+=|-=|=)\s*(.+)$/u)) && !t.match(/^[^=]*:/)) {
      const valeur = expression(l, m[3], l.brut.indexOf(m[3]));
      return valeur ? { type: 'affecte', ligne: l.n, variable: m[1], op: m[2] as '=', valeur } : null;
    }

    // Répliques : « garry: … », « jumpy [surpris]: … », « narration: … », « vous: … »
    if ((m = t.match(/^([\p{L}][\p{L}\p{N} '’-]*?)\s*(?:\[([^\]]*)\])?\s*:\s*(.*)$/u))) {
      const qui = identifiant(m[1]);
      const texte = (m[3] + ' ' + suite(l.indent)).trim();
      if (!texte) signaler(l, 'Réplique vide.', 'alerte');
      const special = qui === 'narration' || qui === 'narrateur' ? NARRATION : qui === 'vous' || qui === 'joueur' || qui === 'joueuse' ? JOUEUR : qui;
      if (special === ECHO) { signaler(l, 'L’écho ne parle pas.'); return null; }
      if (m[2] && (special === NARRATION || special === JOUEUR)) signaler(l, 'Les expressions [ … ] ne concernent que les PNJ.', 'alerte');
      return { type: 'replique', ligne: l.n, qui: special, expression: m[2] ? identifiant(m[2]) : undefined, texte };
    }

    signaler(l, 'Ligne incomprise. Une réplique s’écrit « personnage: texte ».');
    bloc(l.indent);
    return null;
  }

  function option(l: Ligne, texte: string): Omit<OptionChoix, 'corps'> | null {
    // « résolution « Texte » si condition » — ou « résolution: Texte »
    const m = texte.match(/^([^\s«":]+)\s*:?\s*(?:«\s*([^»]*?)\s*»|"([^"]*)")\s*(?:si\s+(.+))?$/i) || texte.match(/^([^\s«":]+)\s*:\s*(.+)$/);
    if (!m) { signaler(l, 'Réponse illisible. Forme attendue : « > curiosité « Votre texte » » (condition facultative : « si … »).'); return null; }
    const resonance = resonanceDe(m[1]);
    if (!resonance) signaler(l, `Résonance inconnue « ${m[1]} ». Possibles : ${Object.values(RESONANCES).map((r) => r.nom.toLowerCase()).join(', ')}.`, 'erreur', l.col, l.col + 2 + m[1].length);
    const txt = (m[2] ?? m[3] ?? '').trim();
    const cond = m[4] ? expression(l, m[4], l.brut.lastIndexOf(m[4])) ?? undefined : undefined;
    return { ligne: l.n, resonance: resonance || 'neutre', texte: txt, condition: cond };
  }

  // L'en-tête (décor, musique) n'est plus pris comme tel dès qu'une instruction a été lue.
  let noeudsEnCours = false;
  while (p < lignes.length) {
    const l = lignes[p];
    if (l.indent > 0) { signaler(l, 'Indentation inattendue en début de bloc.'); }
    const n = instruction({ ...l, indent: 0 }, false);
    if (n) { scene.corps.push(n); noeudsEnCours = true; }
  }
  return { scene, problemes };
}

function estInstruction(t: string) {
  return /^(si\s|sinon|choix|>|entre\s*:|sort\s*:|sortent\s*:|d[ée]place\s*:|d[ée]cor\s*:|musique\s*:|pause\s*:|action\s*:|aller|fin\.?$|[ée]cho\s*:)/i.test(t) ||
    /^[\p{L}][\p{L}\p{N} '’-]*?\s*(\[[^\]]*\])?\s*:/u.test(t) || /^[\p{L}_][\p{L}\p{N}_.-]*\s*(\+=|-=|=)/u.test(t);
}
