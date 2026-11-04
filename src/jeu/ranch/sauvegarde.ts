// Sauvegarde locale de la partie (navigateur). Tout accès est protégé : sans stockage, on joue sans sauvegarde.
import { creerEcho, type Etat, type Genre, type Graine } from '@/moteur/simulation';

const CLE = 'soulseed:partie';

export function charger(): Etat | null {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return null;
    const e = JSON.parse(brut) as Etat;
    return e && e.version === 1 ? e : null;
  } catch { return null; }
}

export function sauver(e: Etat): boolean {
  try { localStorage.setItem(CLE, JSON.stringify(e)); return true; } catch { return false; }
}

export function effacer() {
  try { localStorage.removeItem(CLE); } catch { /* rien */ }
}

/** Nouvelle partie : la graine et le genre sont tirés au hasard en attendant l'écran d'éclosion. */
export function nouvellePartie(): Etat {
  const graines: Graine[] = ['joy', 'wrath', 'disgust', 'sorrow', 'fear'];
  const genre: Genre = Math.random() < 0.5 ? 'm' : 'f';
  return creerEcho({ nom: genre === 'f' ? 'Fila' : 'Filo', genre, graine: graines[Math.floor(Math.random() * graines.length)] });
}
