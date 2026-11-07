// Le tutoriel du ranch : Jumpy fait visiter le ranch à la première arrivée d'une partie
// (scène contenu/scenes/ranch-tutoriel.scene, jouée par-dessus le ranch qui reste visible).
// « action: montrer <cible> » met une lueur sur un élément de l'écran ; la scène continue aussitôt.
import { useMemo, useState, type CSSProperties } from 'react';
import type { Catalogue } from '@/contenu/types';
import { SCENES } from '@/contenu/scenes';
import { analyserScene } from '@/moteur/scene/analyseur';
import { creerMonde } from '@/moteur/monde';
import type { Etat } from '@/moteur/simulation';
import { SceneDialogue } from '../scene/SceneDialogue';
import { variablesScene } from '../monde/variables';
import { portraitJoueur } from '../monde/ScenePnj';
import type { Personnage } from '../profils';
import './tutoriel.css';

export const SCENE_TUTORIEL = 'ranch-tutoriel';

/** Une zone de l'écran du ranch (repère 1280 × 800) ; `rond` : cercle plutôt que rectangle arrondi. */
export interface Cible { x: number; y: number; l: number; h: number; rond?: boolean }

export interface ProprietesTutoriel {
  etat: Etat;
  personnage: Personnage;
  catalogue: Catalogue;
  sons?: boolean;
  /** zones à mettre en lumière, par nom (echo, onglets, carnet, heure, sac, poteau) */
  cibles: () => Record<string, Cible>;
  /** fin de la scène (le drapeau du monde est posé par l'hôte) */
  surFin: () => void;
}

export function Tutoriel(p: ProprietesTutoriel) {
  const scene = useMemo(() => {
    const s = SCENES.find((x) => x.id === SCENE_TUTORIEL);
    return s ? analyserScene(s.source, s.id).scene : null;
  }, []);
  const [variables] = useState(() => variablesScene(p.etat, creerMonde(), p.personnage));
  const [cible, setCible] = useState<{ nom: string; c: Cible } | null>(null);
  if (!scene) { queueMicrotask(p.surFin); return null; }

  const surAction = (nom: string, argument: string | undefined, reprendre: () => void) => {
    if (nom === 'montrer') {
      const c = argument ? p.cibles()[argument.trim()] : undefined;
      setCible(c ? { nom: argument!.trim(), c } : null);
    }
    reprendre();
  };
  const calque = cible && (
    <div key={cible.nom} className={`tuto-lueur ${cible.c.rond ? 'rond' : ''}`}
      style={{ left: cible.c.x, top: cible.c.y, width: cible.c.l, height: cible.c.h } as CSSProperties} />
  );
  const portrait = portraitJoueur(p.personnage, p.catalogue);
  return (
    <div className="tuto">
      <SceneDialogue scene={scene} catalogue={p.catalogue} variables={variables} echo={null} joueur={portrait}
        sons={p.sons} musique={false} transparent surAction={surAction} calque={calque}
        surFin={() => { setCible(null); p.surFin(); }} />
    </div>
  );
}
