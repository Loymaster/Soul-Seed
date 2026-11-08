// Les cinq Soul Seeds telles que le joueur les découvre : nom, tempérament, couleur, emblème.
import { nomsPris, tirerNom, type Graine } from '@/moteur/simulation';
import { parties, profilActif } from '../profils';
import joy from './glyphes/joy.svg?raw';
import wrath from './glyphes/wrath.svg?raw';
import disgust from './glyphes/disgust.svg?raw';
import sorrow from './glyphes/sorrow.svg?raw';
import fear from './glyphes/fear.svg?raw';

export interface FicheGraine { k: Graine; nom: string; temperament: string; couleur: string; description: string; vers: string }

export const GRAINES: FicheGraine[] = [
  { k: 'joy', nom: 'Graine solaire', temperament: 'Curiosité', couleur: '#ffc65a',
    description: "La graine de la Curiosité. Elle réagit aux découvertes, aux nouvelles expériences et à l'émerveillement.", vers: 'Elle tourne vers la lumière tout ce qu’elle ne connaît pas encore.' },
  { k: 'wrath', nom: 'Graine tellurique', temperament: 'Résolution', couleur: '#ff7a55',
    description: "La graine de la Résolution. Elle réagit à l'injustice, aux conflits, et porte une volonté ardente de se battre.", vers: 'Sous son écorce, un cœur de braise qui ne renonce jamais.' },
  { k: 'disgust', nom: 'Graine caustique', temperament: 'Discernement', couleur: '#cfdc62',
    description: "La graine du Discernement. Elle réagit au dégoût et à l'impureté, cherchant à distinguer le vrai du faux.", vers: 'Elle sait ce qui est sain, et ce qui ne l’est pas.' },
  { k: 'sorrow', nom: 'Graine boréale', temperament: 'Observation', couleur: '#7fd0ff',
    description: "La graine de l'Observation. Elle réagit aux souvenirs oubliés et à la beauté mélancolique du monde.", vers: 'Elle garde en elle le reflet des choses passées.' },
  { k: 'fear', nom: 'Graine spectrale', temperament: 'Anticipation', couleur: '#c79bff',
    description: "La graine de l'Anticipation. Elle réagit aux menaces et à l'inconnu, percevant ce que les autres ignorent.", vers: 'Elle entend venir ce que les autres ne voient pas encore.' },
];
export const ficheGraine = (k: Graine) => GRAINES.find((g) => g.k === k)!;
export const imageGraine = (k: Graine) => `echos/graines/${k}.png`;

const SVG: Record<Graine, string> = { joy, wrath, disgust, sorrow, fear };

/** Emblème vectoriel d'un tempérament ; sa couleur suit `color` (fill="currentColor"). */
export function Embleme({ graine, className = '', style }: { graine: Graine; className?: string; style?: React.CSSProperties }) {
  return <span className={`glyphe ${className}`} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: SVG[graine] }} />;
}

/**
 * Nom proposé par le dé, selon le genre de l'écho : tiré dans les grands pools de prénoms (moteur/simulation/noms.ts),
 * sans redonner le nom affiché ni un nom déjà porté dans les parties du profil (échos et échos sauvages connus).
 */
export function proposerNom(genre: 'm' | 'f', actuel: string) {
  let pris: string[] = [];
  try {
    const p = profilActif();
    if (p) pris = parties(p.id).flatMap((e) => nomsPris(e));
  } catch { /* stockage indisponible : on tire sans rien éviter */ }
  return tirerNom(genre, Math.random, [actuel, ...pris]);
}
export const capitaliser = (n: string) => { const t = n.trim(); return t.charAt(0).toUpperCase() + t.slice(1); };
