// Carnet d'événement : ce que l'on dit, ce qui en découle, et le tempérament en jeu (maquette « Ranch » v7).
// La simulation décide de l'effet réel (repondreComportement) ; ces textes ne font que le raconter, sans chiffre.
import { NOM_TEMPERAMENT, accord, type CleTemperament, type Comportement, type Etat, type ReponseComportement } from '@/moteur/simulation';
import joy from '../graines/glyphes/joy.svg?url';
import wrath from '../graines/glyphes/wrath.svg?url';
import disgust from '../graines/glyphes/disgust.svg?url';
import sorrow from '../graines/glyphes/sorrow.svg?url';
import fear from '../graines/glyphes/fear.svg?url';

/** Style de chaque réponse : sens (+1 renforce le tempérament, −1 le diminue, 0 le laisse) et pose du personnage. */
export const REP: Record<ReponseComportement, { label: string; color: string; glow: string; icon: string; sens: 1 | 0 | -1 }> = {
  feliciter: { label: 'Féliciter', color: '#3f7a3a', glow: 'rgba(90,160,80,.6)', icon: 'M5 12.5l4.5 4.5L19 7.5', sens: 1 },
  encourager: { label: 'Encourager', color: '#3f7a3a', glow: 'rgba(90,160,80,.6)', icon: 'M5 12.5l4.5 4.5L19 7.5', sens: 1 },
  remercier: { label: 'Remercier', color: '#3f7a3a', glow: 'rgba(90,160,80,.6)', icon: 'M5 12.5l4.5 4.5L19 7.5', sens: 1 },
  gronder: { label: 'Gronder', color: '#9c3b2a', glow: 'rgba(200,70,55,.6)', icon: 'M6 6l12 12M18 6L6 18', sens: -1 },
  prevenir: { label: 'Prévenir des risques', color: '#9c3b2a', glow: 'rgba(200,70,55,.6)', icon: 'M12 4l9 16H3zM12 10v4M12 17h.01', sens: -1 },
  critiquer: { label: 'Critiquer', color: '#9c3b2a', glow: 'rgba(200,70,55,.6)', icon: 'M6 6l12 12M18 6L6 18', sens: -1 },
  rien: { label: 'Ne rien dire', color: '#6f6253', glow: 'rgba(150,130,110,.5)', icon: 'M7 12h10', sens: 0 },
};

/** Tempéraments : couleur et emblème de la graine correspondante. */
export const TEMPERAMENTS: Record<CleTemperament, { label: string; color: string; glow: string; glyphe: string }> = {
  cur: { label: NOM_TEMPERAMENT.cur, color: '#b3671a', glow: 'rgba(230,150,50,.75)', glyphe: `url("${joy}")` },
  res: { label: NOM_TEMPERAMENT.res, color: '#7a2e2e', glow: 'rgba(200,70,55,.65)', glyphe: `url("${wrath}")` },
  dis: { label: NOM_TEMPERAMENT.dis, color: '#5f6b1e', glow: 'rgba(170,190,60,.65)', glyphe: `url("${disgust}")` },
  obs: { label: NOM_TEMPERAMENT.obs, color: '#2f5a7a', glow: 'rgba(70,130,190,.65)', glyphe: `url("${sorrow}")` },
  ant: { label: NOM_TEMPERAMENT.ant, color: '#5b3f8a', glow: 'rgba(150,110,220,.65)', glyphe: `url("${fear}")` },
};
export const GLYPHE_INCONNU = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01"/></svg>')}")`;

export const TAMPON = { 1: ['renforcée', '#3f7a3a'], '-1': ['diminuée', '#9c3b2a'], 0: ['inchangée', '#8a7a66'] } as const;

type E = Pick<Etat, 'nom' | 'genre'>;

/** Ce que le joueur dit (page 2), selon la réponse. */
export function parole(e: E, r: ReponseComportement): string {
  const n = e.nom;
  switch (r) {
    case 'feliciter': return '« Bravo, c’est bien ! »';
    case 'gronder': return `« ${n} ! Ce n’est pas bien, ça… »`;
    case 'encourager': return '« Qu’est-ce que tu fais ? Montre-moi ! »';
    case 'prevenir': return '« Fais attention, tu pourrais te faire mal. »';
    case 'remercier': return '« Merci, c’est adorable ! »';
    case 'critiquer': return '« Ce n’est pas à toi, ça… »';
    default: return '(Vous ne dites rien.)';
  }
}

/** Titre de la page 3 : la réponse choisie. */
export function phraseReponse(e: E, r: ReponseComportement): string {
  const n = e.nom; const l = accord(e, 'l’', 'l’');
  return {
    feliciter: `Vous félicitez ${n}`, encourager: `Vous encouragez ${n}`, remercier: `Vous remerciez ${n}`,
    gronder: `Vous réprimandez ${n}`, prevenir: `Vous mettez ${n} en garde`, critiquer: `Vous désapprouvez ${n}`, rien: `Vous ${l}ignorez`,
  }[r];
}

/** Ce qui en découle (page 3) : la réaction de l'écho, racontée. */
export function consequence(e: E, c: Comportement, r: ReponseComportement): string {
  const n = e.nom;
  const a = (m: string, f: string) => accord(e, m, f);
  const Il = a('Il', 'Elle');
  const sens = REP[r].sens;
  if (c.type === 'neutre') {
    if (r === 'remercier') return `${n} frétille de joie. ${Il} vous regarde ranger sa trouvaille dans le sac.`;
    if (r === 'critiquer') return `${n} lâche sa trouvaille et recule d’un pas, les oreilles basses.`;
    return `Vous rangez la trouvaille. ${n} attend un peu, puis s’en va.`;
  }
  if (c.type === 'betise') {
    if (sens > 0) return `${n} se redresse, ${a('ravi', 'ravie')}… et repart de plus belle. Le désordre attendra.`;
    if (sens < 0) return `${n} baisse les oreilles et tente de réparer ses dégâts, l’air ${a('penaud', 'penaude')}.`;
    return `Vous réparez sans un mot. ${n} vous observe faire, sans trop savoir quoi en penser.`;
  }
  if (c.type === 'amplification') {
    if (sens > 0) return `${n} s’anime et vous entraîne à sa suite. Vous partagez un long moment ensemble.`;
    if (sens < 0) return `${n} cligne des yeux, s’arrête net et trottine vers vous.`;
    return `${n} continue, ${a('absorbé', 'absorbée')}. Le vent fait bruisser l’herbe autour de ${a('lui', 'elle')}.`;
  }
  if (sens > 0) return `${n} bombe le torse et vient se frotter contre vos jambes, ${a('fier', 'fière')} comme jamais.`;
  if (sens < 0) return `${n} vous regarde, ${a('décontenancé', 'décontenancée')}. Sa réussite a soudain un goût amer.`;
  return `${n} vous jette un regard, attend un mot… puis retourne à ses affaires.`;
}

export const NOTE_SENS = { 1: 'Il sait que cela vous a plu.', '-1': 'Il sait que cela ne vous a pas plu.', 0: 'Il ne sait pas trop ce que vous en pensez.' } as const;
export const noteSens = (e: E, sens: 1 | 0 | -1) => (e.genre === 'f' ? NOTE_SENS[sens].replace(/^Il /, 'Elle ') : NOTE_SENS[sens]);

/** Clé de mémoire : un tempérament découvert l'est pour ce genre d'événement. */
export const cleEvenement = (c: Comportement) => `${c.coloration}_${c.type}`;
