// Construit, à partir du catalogue d'assets, ce dont le moteur de scènes a besoin pour vérifier une scène.
import type { Catalogue } from './types';
import type { ContexteScene } from '@/moteur/scene/valider';
import { analyserScene } from '@/moteur/scene/analyseur';
import { variablesDeScene } from '@/moteur/scene/valider';

export function contexteScenes(catalogue: Catalogue, scenes: { id: string; source: string }[], sauf?: string): ContexteScene {
  const variablesEcrites = new Set<string>();
  for (const s of scenes) {
    if (s.id === sauf) continue;
    for (const v of variablesDeScene(analyserScene(s.source, s.id).scene).ecrites.keys()) variablesEcrites.add(v);
  }
  return {
    pnj: Object.fromEntries(Object.values(catalogue.pnj).map((p) => [p.id, { nom: p.nom, expressions: Object.keys(p.expressions) }])),
    emotions: catalogue.assets.filter((a) => a.categorie === 'emotions').map((a) => a.chemin.slice('emotions/'.length).replace(/\.[^.]+$/, '')),
    decors: catalogue.assets.filter((a) => a.categorie === 'decors').map((a) => a.chemin),
    musiques: catalogue.assets.filter((a) => a.type === 'son').map((a) => a.chemin),
    scenes: scenes.map((s) => s.id),
    variablesEcrites
  };
}
