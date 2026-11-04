// Textes des comportements spontanés (buildComportementText du prototype).
import type { Comportement, Etat } from './types';
import { accord } from './outils';
import { aliment } from './objets';

export function texteComportement(e: Pick<Etat, 'nom' | 'genre'>, c: Comportement): string {
  const n = e.nom || 'Votre écho';
  const a = (m: string, f: string) => accord(e, m, f);
  const il = a('il', 'elle'), Il = a('Il', 'Elle');
  const objet = c.objet ? (aliment(c.objet)?.nom.toLowerCase() ?? 'objet') : 'objet';
  const un = a('un', 'une');
  switch (`${c.coloration}_${c.type}`) {
    case 'cur_reussite': return `${n} a exploré un recoin du ranch qu’${il} ne connaissait pas encore et en est ${a('revenu', 'revenue')} tout${a('', 'e')} ${a('fier', 'fière')}, des brindilles plein le pelage.`;
    case 'cur_betise': return `${n} a fouillé dans un tas de réserves par pure curiosité et a semé un joyeux désordre autour du ranch.`;
    case 'cur_amplification': return `Vous remarquez que ${n} aime particulièrement se balader vers la forêt. ${Il} s’intéresse aux plantes et aux animaux, court un peu partout et scrute chaque recoin, avant de revenir vers vous.`;
    case 'cur_neutre': return `En explorant derrière le ranch, ${n} a trouvé quelque chose qu’on a dû oublier ici (${objet}). ${Il} souhaite vous l’offrir !`;
    case 'res_reussite': return `${n} a affronté un obstacle qui ${a('le', 'la')} dépassait et a fini par en venir à bout à force de ténacité.`;
    case 'res_betise': return `${n} a voulu forcer un passage trop étroit et s’est ${a('retrouvé coincé', 'retrouvée coincée')}, renversant tout sur son passage.`;
    case 'res_amplification': return `Vous voyez ${n} s’acharner sur un vieux tronc récalcitrant, refusant d’abandonner malgré les échecs. ${Il} finit par triompher, ${a('épuisé', 'épuisée')} mais ${a('radieux', 'radieuse')}.`;
    case 'res_neutre': return `En creusant avec insistance près d’un rocher, ${n} a déterré quelque chose (${objet}). ${Il} veut vous l’offrir, ${a('fier', 'fière')} de sa trouvaille !`;
    case 'dis_reussite': return `${n} a tenté de vous rejoindre par un raccourci, et en a profité pour repérer les zones à risque et déblayer le passage.`;
    case 'dis_betise': return `${n} a refusé obstinément de s’approcher d’un simple tas de feuilles, semant une pagaille inutile en tentant de l’éviter.`;
    case 'dis_amplification': return `Vous remarquez que ${n} nettoie soigneusement le matériel qu’${il} emprunte, même quand il n’est pas vraiment sale.`;
    case 'dis_neutre': return `À force de trier des affaires au fond de la grange, ${n} a trouvé quelque chose d’inhabituel (${objet}) et vous le tend avec beaucoup de précaution.`;
    case 'obs_reussite': return `${n} a repéré un détail que personne n’avait remarqué et vous l’a signalé avec insistance.`;
    case 'obs_betise': return `${n} est ${a('resté immobile', 'restée immobile')} à observer un point fixe pendant des heures, en oubliant tout le reste.`;
    case 'obs_amplification': return `Vous remarquez que ${n} passe un temps fou à observer les moindres détails autour de ${a('lui', 'elle')}, immobile et ${a('concentré', 'concentrée')}, avant de reprendre comme si de rien n’était.`;
    case 'obs_neutre': return `En observant longuement un coin oublié du ranch, ${n} a repéré quelque chose de caché dans l’herbe (${objet}). ${Il} vous le présente fièrement.`;
    case 'ant_reussite': return `${n} a senti venir la pluie et s’est ${a('mis', 'mise')} à l’abri bien avant les premières gouttes.`;
    case 'ant_betise': return `${n} a caché des provisions un peu partout « au cas où », provoquant un joyeux chaos dans le ranch.`;
    case 'ant_amplification': return `Vous voyez ${n} ranger et organiser ses affaires avec un soin méthodique, comme s’${il} anticipait déjà les besoins de demain.`;
    case 'ant_neutre': return `En prévoyant une réserve pour les jours difficiles, ${n} a mis de côté quelque chose (${objet}) qu’${il} a finalement décidé de vous offrir.`;
    default: return `${n} a eu un comportement inattendu (${un} moment à part).`;
  }
}
