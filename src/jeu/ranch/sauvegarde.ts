// Nouvelle partie au ranch. (Les sauvegardes sont rangées par profil : voir src/jeu/profils.ts.)
import { creerEcho, type Etat, type Genre, type Graine } from '@/moteur/simulation';

/** Nouvelle partie : la graine choisie (ou tirée au hasard), le genre tiré au hasard à l'éclosion. */
export function nouvellePartie(graine?: Graine, nom?: string): Etat {
  const graines: Graine[] = ['joy', 'wrath', 'disgust', 'sorrow', 'fear'];
  const genre: Genre = Math.random() < 0.5 ? 'm' : 'f';
  return creerEcho({
    nom: nom || (genre === 'f' ? 'Fila' : 'Filo'), genre,
    graine: graine ?? graines[Math.floor(Math.random() * graines.length)],
  });
}
