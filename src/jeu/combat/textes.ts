// Textes de la page de fin d'un combat (sans affichage) : un titre et une ou deux lignes.
// La deuxième ligne nomme toujours l'écho du joueur (« Il » ou « Elle » seul ne suffit pas à savoir de qui l'on parle).
import type { Resultat } from '@/moteur/combat';

export interface ContexteFin {
  resultat: Resultat;
  /** Registre de l'écran (exploration, magie sainte, magie corrompue). */
  registre: 'exploration' | 'sainte' | 'corrompue';
  /** Mode Arène : ni ranch ni partie. */
  arene: boolean;
  /** Nom de l'écho du joueur. */
  nom: string;
  /** Noms des adversaires (« Phil et Hibert ») et leur nombre. */
  enFace: string;
  nbEnFace: number;
  /** Noms des alliés de l'arène et leur nombre. */
  allies: string;
  nbAllies: number;
  /** Part de vie qui reste à l'écho (0 à 1), jamais montrée : elle choisit la phrase. */
  part: number;
  /** Accord au genre de l'écho : `a('fier', 'fière')`. */
  a: (m: string, f: string) => string;
}

export interface TexteFin { titre: string; lignes: string[] }

export function texteFin({ resultat, registre, arene, nom, enFace, nbEnFace, allies, nbAllies, part, a }: ContexteFin): TexteFin {
  const pl = (un: string, plusieurs: string) => (nbEnFace > 1 ? plusieurs : un);
  const plA = (un: string, plusieurs: string) => (nbAllies > 1 ? plusieurs : un);
  if (arene) {
    return resultat === 'victoire'
      ? { titre: `${allies} ${plA('l’emporte', 'l’emportent')} !`, lignes: [`${enFace} ${pl('s’incline', 's’inclinent')} au milieu de l’arène.`, 'La lumière retombe doucement sur le terrain.'] }
      : { titre: `${allies} ${plA('tombe', 'tombent')}…`, lignes: [`${enFace} ${pl('reste', 'restent')} ${pl('seul maître', 'seuls maîtres')} de l’arène.`, 'Rien de ce combat ne compte pour vos parties.'] };
  }
  if (registre === 'corrompue') {
    return resultat === 'victoire'
      ? { titre: 'La corruption reflue', lignes: [`${enFace} ${pl('se délite', 'se délitent')} en une fumée violette.`, part > 0.4 ? `${nom} reste debout, les yeux brillants.` : `${nom} vacille, mais la lumière lui revient.`] }
      : resultat === 'defaite'
        ? { titre: 'Les ténèbres l’emportent', lignes: [`${enFace} ${pl('se referme', 'se referment')} sur le silence.`, `${nom} gît, très pâle. Il faut ${a('le', 'la')} ramener au ranch au plus vite.`] }
        : { titre: 'Vous battez en retraite', lignes: ['Vous reculez dans l’ombre, sans courir.', `${nom} vous suit sans se retourner.`] };
  }
  return resultat === 'victoire'
    ? {
      titre: `${nom} l’emporte !`,
      lignes: [`${enFace} ${pl('détale', 'détalent')} dans les fourrés.`,
        part > 0.6 ? `${nom} bombe le torse, à peine ${a('essoufflé', 'essoufflée')}.`
          : part > 0.25 ? `${nom} souffle fort, mais ${a('il', 'elle')} a l’air ${a('fier', 'fière')}.`
            : `${nom} tient à peine debout… mais ${a('il', 'elle')} a gagné.`],
    }
    : resultat === 'defaite'
      ? { titre: `${nom} s’effondre…`, lignes: [`${enFace} ${pl('s’éloigne', 's’éloignent')} sans se retourner.`, `Il faudra ramener ${nom} au ranch et ${a('le', 'la')} laisser se reposer.`] }
      : { titre: 'Vous battez en retraite', lignes: ['Vous décampez sans demander votre reste.', `${nom} vous suit en jetant des regards en arrière : ${a('il', 'elle')} n’a pas l’air d’avoir tout compris.`] };
}
