// Ce que les scènes du monde savent de la partie (leurs « variables ») et ce qu'elles y laissent.
// Les drapeaux du monde sont des variables comme les autres : la scène les lit et les écrit librement
// (« hevann.vaincu = vrai ») ; à la fin, ceux qui ont changé reviennent dans le monde.
// Le jeu y ajoute ce qu'il est seul à connaître : l'heure, l'or, le contenu du sac, l'humeur de l'écho (en mots).
import type { Valeur } from '@/moteur/scene/types';
import { aliment, heureDuJour, type Etat } from '@/moteur/simulation';
import { heureAbsolue, minuteAbsolue, prosperite, type Monde } from '@/moteur/monde';
import type { Personnage } from '../profils';

const SAISONS = ['printemps', 'été', 'automne', 'hiver'];
const NOM_GRAINE = { joy: 'graine solaire', wrath: 'graine tellurique', disgust: 'graine caustique', sorrow: 'graine boréale', fear: 'graine spectrale' } as const;

/** Variables que seul le jeu fournit : elles ne reviennent jamais dans le monde. */
const DU_JEU = /^(joueur\.|echo\.|sac\.|construit\.|combat\.|action\.|travail\.|graine\.)|^(jour|heure|saison|maintenant|or|hasard|sujet|jumpy\.info|chantier\.en_cours)$/;
export const variableDuJeu = (nom: string) => DU_JEU.test(nom);

/** Les variables d'une scène qui commence : drapeaux du monde, puis ce que le jeu sait de la partie. */
export function variablesScene(e: Etat, m: Monde, p: Personnage, sujet?: string, rng: () => number = Math.random): Record<string, Valeur> {
  const v: Record<string, Valeur> = { ...m.drapeaux };
  v['village.prosperite'] = prosperite(m);
  v['village.dernier'] = (m.drapeaux['village.dernier'] as string) ?? '';
  for (const s of m.structures) v[`construit.${s}`] = true;
  v['chantier.en_cours'] = !!m.chantier;
  v['joueur.nom'] = p.nom; v['joueur.pronom'] = p.pronom;
  v['echo.nom'] = e.nom; v['echo.genre'] = e.genre; v['echo.stade'] = e.stade; v['echo.lignee'] = e.lignee;
  v['echo.angoisse'] = e.anxiete > 90;
  v['echo.malade'] = e.malade;
  v['echo.petit'] = e.stade === 'bebe' || e.stade === 'enfant';
  v['graine.nom'] = NOM_GRAINE[e.graine];
  v.jour = e.jour; v.heure = heureDuJour(e); v.maintenant = heureAbsolue(e);
  v.saison = SAISONS[Math.floor((e.jour - 1) / 8) % 4];
  v.or = e.or;
  v.hasard = 1 + Math.floor(rng() * 100);
  v.sujet = sujet ?? '';
  for (const c of e.inventaire) if (c) v[`sac.${c.id}`] = ((v[`sac.${c.id}`] as number) ?? 0) + c.qte;
  v['sac.plein'] = !e.inventaire.some((c) => !c);
  const premier = e.inventaire.find((c) => c && aliment(c.id));
  v['sac.aliment'] = premier ? aliment(premier.id)!.nom.toLowerCase() : '';
  return v;
}

/** Recopie dans le monde les drapeaux que la scène a changés (et seulement eux). */
export function retenirVariables(m: Monde, avant: Record<string, Valeur>, apres: Record<string, Valeur>): string[] {
  const changes: string[] = [];
  for (const [k, v] of Object.entries(apres)) {
    if (variableDuJeu(k) || avant[k] === v) continue;
    m.drapeaux[k] = v;
    changes.push(k);
  }
  return changes;
}

/** Ce que le monde impose à l'écho : la fin des ravages de Garry. */
export function synchroniser(e: Etat, m: Monde) {
  if (m.drapeaux['garry.vaincu']) e.garryVaincu = true;
}

export const minuteDuMonde = minuteAbsolue;
