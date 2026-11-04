// Accès à l'API de développement de l'atelier (servie par outils/atelier/plugin.mjs).
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Catalogue, FichePNJ, PNJCatalogue } from '@/contenu/types';

async function appel<T>(methode: 'GET' | 'POST', route: string, corps?: unknown, brut?: Blob): Promise<T> {
  const r = await fetch(`/__atelier${route}`, {
    method: methode,
    headers: brut ? { 'Content-Type': 'application/octet-stream' } : { 'Content-Type': 'application/json' },
    body: brut ?? (corps === undefined ? undefined : JSON.stringify(corps))
  });
  const json = await r.json().catch(() => ({ erreur: `Réponse illisible (${r.status})` }));
  if (!r.ok) throw new Error(json?.erreur || `Erreur ${r.status}`);
  return json as T;
}

export interface Deplacement { depuis: string; vers: string; references: string[] }
export interface Usage { fichier: string; lignes: { ligne: number; texte: string }[] }
export interface Reglages { rangementAuto: boolean }
export interface FichierScene { id: string; source: string; modifie: number }

export const api = {
  catalogue: () => appel<Catalogue>('GET', '/catalogue'),
  regenerer: () => appel<Catalogue>('POST', '/regenerer'),
  usages: (chemin: string) => appel<Usage[]>('GET', `/usages?chemin=${encodeURIComponent(chemin)}`),
  reglages: () => appel<Reglages>('GET', '/reglages'),
  changerReglages: (r: Partial<Reglages>) => appel<Reglages>('POST', '/reglages', r),
  deplacer: (depuis: string, vers: string, ecraser = false) => appel<Deplacement>('POST', '/deplacer', { depuis, vers, ecraser }),
  deplacerPlusieurs: (operations: { depuis: string; vers: string }[]) =>
    appel<{ faits: Deplacement[]; erreurs: { depuis: string; vers: string; raison: string }[] }>('POST', '/deplacer-plusieurs', { operations }),
  rangerTout: () => appel<{ ranges: Deplacement[]; inconnus: string[]; conflits: { chemin: string; raison: string }[] }>('POST', '/ranger-tout'),
  mettreDeCote: (chemins: string[]) => appel<{ chemin: string; cible: string; references: string[] }[]>('POST', '/mettre-de-cote', { chemins }),
  enregistrerFiche: (fiche: FichePNJ) => appel<PNJCatalogue>('POST', '/fiche', { id: fiche.id, fiche }),
  nouveauPNJ: (id: string, nom: string, prefixes: string[]) => appel<PNJCatalogue>('POST', '/pnj', { id, nom, prefixes }),
  scenes: () => appel<FichierScene[]>('GET', '/scenes'),
  enregistrerScene: (id: string, source: string) => appel<{ id: string; modifie: number }>('POST', '/scene', { id, source }),
  nouvelleScene: (id: string, source: string) => appel<{ id: string }>('POST', '/scene/nouvelle', { id, source }),
  renommerScene: (ancien: string, nouveau: string) => appel<{ id: string; modifiees: string[] }>('POST', '/scene/renommer', { ancien, nouveau }),
  supprimerScene: (id: string) => appel<{ id: string }>('POST', '/scene/supprimer', { id }),
  deposer: (f: File) => appel<{ chemin: string }>('POST', `/deposer?nom=${encodeURIComponent(f.name)}`, undefined, f)
};

export interface EvenementCatalogue { raison: string; nouveaux: string[]; disparus: string[]; ranges: string[]; genereLe: string }

/**
 * Catalogue toujours à jour : chargé au démarrage, puis rechargé dès que le serveur signale
 * un changement dans les assets ou les fiches (ajout de fichier, déplacement, enregistrement…).
 */
export function useCatalogue(surChangement?: (e: EvenementCatalogue) => void) {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const rappel = useRef(surChangement);
  rappel.current = surChangement;

  const recharger = useCallback(async () => {
    setChargement(true);
    try { setCatalogue(await api.catalogue()); setErreur(null); } catch (e) { setErreur((e as Error).message); } finally { setChargement(false); }
  }, []);

  useEffect(() => {
    recharger();
    if (!import.meta.hot) return;
    const ecoute = (e: EvenementCatalogue) => { recharger(); rappel.current?.(e); };
    import.meta.hot.on('atelier:catalogue', ecoute);
    return () => import.meta.hot?.off?.('atelier:catalogue', ecoute);
  }, [recharger]);

  return { catalogue, erreur, chargement, recharger, setCatalogue };
}
