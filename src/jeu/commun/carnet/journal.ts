// Le journal du grand carnet : tout l'historique gardé (Etat.journal, du plus récent au plus ancien, JOURNAL_MAX
// entrées), mis en pages. Chaque double page a une page de gauche (sous le titre de la section) et une page de
// droite (avec la pagination en bas) ; un jour coupé entre deux pages reprend son titre avec « (suite) ».
// La hauteur d'une entrée est estimée d'après sa longueur, comme les astuces (pas de mesure du DOM).
import type { EntreeJournal } from '@/moteur/simulation';

export interface GabaritJournal {
  /** Caractères par ligne de texte (colonne de l'heure ôtée). */
  caracteres: number;
  /** Hauteur utile (px) de la page de gauche, puis de la page de droite. */
  gauche: number;
  droite: number;
  /** Ligne de texte, marge sous une entrée, titre d'un jour (px). */
  ligne: number;
  marge: number;
  titre: number;
}

/** Grand carnet du ranch : pages de 364 px de large (texte ≈ 306 px à 16 px, ≈ 50 caractères : 46 par prudence), 504 px de haut moins l'en-tête et la pagination. */
export const GABARIT_JOURNAL: GabaritJournal = { caracteres: 46, gauche: 412, droite: 452, ligne: 24, marge: 6, titre: 42 };

export interface BlocJournal {
  jour: number;
  suite: boolean;
  lignes: { minute: number; texte: string }[];
}
export type PageJournal = BlocJournal[];

const hauteurEntree = (texte: string, g: GabaritJournal) => Math.max(1, Math.ceil(texte.length / g.caracteres)) * g.ligne + g.marge;

/**
 * Met le journal en pages (du plus récent au plus ancien, comme il est gardé). Les pages alternent gauche / droite ;
 * le résultat a toujours un nombre pair de pages (au moins deux), la dernière éventuellement vide.
 */
export function paginerJournal(entrees: EntreeJournal[], g: GabaritJournal = GABARIT_JOURNAL): PageJournal[] {
  const pages: PageJournal[] = [];
  let page: PageJournal = [];
  let reste = g.gauche;
  const tourner = () => { pages.push(page); page = []; reste = pages.length % 2 ? g.droite : g.gauche; };
  for (const x of entrees) {
    const h = hauteurEntree(x.texte, g);
    let bloc = page[page.length - 1];
    const nouveauJour = !bloc || bloc.jour !== x.jour;
    // une entrée (et le titre de son jour s'il faut l'écrire) qui ne tient plus : page suivante
    if ((nouveauJour ? g.titre : 0) + h > reste && page.length) {
      const suite = !nouveauJour;
      tourner();
      bloc = { jour: x.jour, suite, lignes: [] };
      page.push(bloc); reste -= g.titre;
    } else if (nouveauJour) {
      bloc = { jour: x.jour, suite: false, lignes: [] };
      page.push(bloc); reste -= g.titre;
    }
    bloc.lignes.push({ minute: x.minute, texte: x.texte });
    reste -= h;
  }
  pages.push(page);
  if (pages.length % 2) pages.push([]);
  return pages;
}
