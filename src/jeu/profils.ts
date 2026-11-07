// Profils de joueur et emplacements de partie, enregistrés dans le navigateur.
// Un profil = une personne qui joue : son nom, son avatar, son pronom, ses réglages et sa mémoire des échos.
// Chaque profil a ses propres emplacements de partie.
import type { Etat } from '@/moteur/simulation';
import { normaliserMonde, type Monde } from '@/moteur/monde';

export type Pronom = 'il' | 'elle' | 'iel';
export type IdAvatar = 'garcon-1' | 'garcon-2' | 'fille-1' | 'fille-2' | 'nb-1' | 'nb-2';

/** Les six avatars. L'image attendue : public/assets/joueur/<id>.png (déposer « avatar-<id>.png » pour qu'il soit rangé). */
export const AVATARS: { id: IdAvatar; nom: string; repli: string }[] = [
  { id: 'garcon-1', nom: 'Garçon', repli: 'joueur/joueur.png' },
  { id: 'garcon-2', nom: 'Garçon', repli: 'joueur/joueur.png' },
  { id: 'fille-1', nom: 'Fille', repli: 'joueur/joueuse.png' },
  { id: 'fille-2', nom: 'Fille', repli: 'joueur/joueuse.png' },
  { id: 'nb-1', nom: 'Non-binaire', repli: '' },
  { id: 'nb-2', nom: 'Non-binaire', repli: '' },
];
export const cheminAvatar = (id: IdAvatar) => `joueur/${id}.png`;

export const PRONOMS: { id: Pronom; nom: string; exemple: string }[] = [
  { id: 'il', nom: 'il', exemple: 'Il est prêt pour l’aventure.' },
  { id: 'elle', nom: 'elle', exemple: 'Elle est prête pour l’aventure.' },
  { id: 'iel', nom: 'iel', exemple: 'Iel est prêt·e pour l’aventure.' },
];

/** Réglages du profil. Les volumes vont de 0 à 100 (80 par défaut). */
export interface Reglages {
  sons: boolean;
  musique: boolean;
  volumeMusique?: number;
  volumeBruitages?: number;
}

export interface Profil {
  id: string;
  nom: string;
  avatar: IdAvatar;
  pronom: Pronom;
  creeLe: string;
  vuLe: string;
  reglages: Reglages;
  /** Formes d'écho découvertes (chemins d'apparence), pour la Mémoire des échos. */
  memoire: string[];
  /** Tempéraments découverts dans les événements du ranch (« coloration_type »). */
  connus?: string[];
}

export const NB_EMPLACEMENTS = 3;

/**
 * Le personnage que l'on incarne dans une partie (distinct du profil : un profil peut jouer
 * plusieurs personnages, un par emplacement). Il survit à la disparition de ses échos.
 */
export interface Personnage { nom: string; pronom: Pronom; avatar: IdAvatar }

/** Image du personnage selon son pronom et l'astre choisi dans l'introduction (Soleil → 1, Lune → 2). */
export const avatarDe = (pronom: Pronom, astre: 'soleil' | 'lune'): IdAvatar =>
  `${pronom === 'elle' ? 'fille' : pronom === 'iel' ? 'nb' : 'garcon'}-${astre === 'lune' ? 2 : 1}` as IdAvatar;

interface Registre { version: 1; actif: string | null; profils: Profil[] }

const CLE_REGISTRE = 'soulseed:profils';
const clePartie = (profil: string, emplacement: number) => `soulseed:partie:${profil}:${emplacement}`;
const clePersonnage = (profil: string, emplacement: number) => `soulseed:personnage:${profil}:${emplacement}`;
const cleMonde = (profil: string, emplacement: number) => `soulseed:monde:${profil}:${emplacement}`;
/** Ancienne sauvegarde unique (avant les profils). */
const CLE_ANCIENNE = 'soulseed:partie';

function lire<T>(cle: string): T | null {
  try { const b = localStorage.getItem(cle); return b ? (JSON.parse(b) as T) : null; } catch { return null; }
}
function ecrire(cle: string, v: unknown) {
  try { localStorage.setItem(cle, JSON.stringify(v)); return true; } catch { return false; }
}
function retirer(cle: string) {
  try { localStorage.removeItem(cle); } catch { /* rien */ }
}

export function registre(): Registre {
  const r = lire<Registre>(CLE_REGISTRE);
  return r && r.version === 1 && Array.isArray(r.profils) ? r : { version: 1, actif: null, profils: [] };
}
const enregistrer = (r: Registre) => ecrire(CLE_REGISTRE, r);

export function profilActif(): Profil | null {
  const r = registre();
  return r.profils.find((p) => p.id === r.actif) ?? null;
}

export function choisirProfil(id: string) {
  const r = registre();
  const p = r.profils.find((x) => x.id === id);
  if (!p) return;
  p.vuLe = new Date().toISOString();
  r.actif = id;
  enregistrer(r);
}

export function creerProfil(nom: string, avatar: IdAvatar, pronom: Pronom): Profil {
  const r = registre();
  const maintenant = new Date().toISOString();
  const p: Profil = {
    id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    nom: nom.trim(), avatar, pronom, creeLe: maintenant, vuLe: maintenant,
    reglages: { sons: true, musique: true, volumeMusique: 80, volumeBruitages: 80 }, memoire: [],
  };
  r.profils.push(p);
  r.actif = p.id;
  enregistrer(r);
  // La partie jouée avant l'arrivée des profils rejoint le premier profil créé.
  if (r.profils.length === 1) {
    const ancienne = lire<Etat>(CLE_ANCIENNE);
    if (ancienne && ancienne.version === 1) { ecrire(clePartie(p.id, 0), ancienne); retirer(CLE_ANCIENNE); }
  }
  return p;
}

export function modifierProfil(id: string, modif: Partial<Omit<Profil, 'id' | 'creeLe'>>) {
  const r = registre();
  const p = r.profils.find((x) => x.id === id);
  if (!p) return;
  Object.assign(p, modif);
  enregistrer(r);
}

export function supprimerProfil(id: string) {
  const r = registre();
  r.profils = r.profils.filter((p) => p.id !== id);
  if (r.actif === id) r.actif = r.profils[0]?.id ?? null;
  enregistrer(r);
  for (let i = 0; i < NB_EMPLACEMENTS; i++) { retirer(clePartie(id, i)); retirer(clePersonnage(id, i)); retirer(cleMonde(id, i)); }
}

/** Note les formes rencontrées (une seule fois chacune). */
export function noterForme(id: string, forme: string) {
  const r = registre();
  const p = r.profils.find((x) => x.id === id);
  if (!p || p.memoire.includes(forme)) return;
  p.memoire.push(forme);
  enregistrer(r);
}

// ——— emplacements de partie

export function chargerPartie(profil: string, emplacement: number): Etat | null {
  const e = lire<Etat>(clePartie(profil, emplacement));
  return e && e.version === 1 ? e : null;
}
export function sauverPartie(profil: string, emplacement: number, e: Etat) {
  return ecrire(clePartie(profil, emplacement), e);
}
export function effacerPartie(profil: string, emplacement: number) {
  retirer(clePartie(profil, emplacement));
  retirer(clePersonnage(profil, emplacement));
  retirer(cleMonde(profil, emplacement));
}

/** Le monde d'un emplacement (quêtes, ressources, lieux découverts…) : il survit aux échos, comme le personnage. */
export function chargerMonde(profil: string, emplacement: number): Monde {
  return normaliserMonde(lire<Monde>(cleMonde(profil, emplacement)));
}
export function sauverMonde(profil: string, emplacement: number, m: Monde) {
  return ecrire(cleMonde(profil, emplacement), m);
}

/** Le personnage d'un emplacement ; pour les parties d'avant les personnages, celui du profil. */
export function chargerPersonnage(profil: Profil, emplacement: number): Personnage {
  const p = lire<Personnage>(clePersonnage(profil.id, emplacement));
  return p && p.nom ? p : { nom: profil.nom, pronom: profil.pronom, avatar: profil.avatar };
}
export function sauverPersonnage(profil: string, emplacement: number, p: Personnage) {
  return ecrire(clePersonnage(profil, emplacement), p);
}
export function parties(profil: string): (Etat | null)[] {
  return Array.from({ length: NB_EMPLACEMENTS }, (_, i) => chargerPartie(profil, i));
}
/**
 * L'emplacement joué le plus récemment, s'il y en a un. Une partie dont l'écho s'est éteint
 * reste une partie en cours : une nouvelle graine attend le joueur.
 */
export function dernierePartie(profil: string): { emplacement: number; etat: Etat } | null {
  const marque = lire<{ emplacement: number }>(`soulseed:derniere:${profil}`);
  if (marque) { const e = chargerPartie(profil, marque.emplacement); if (e) return { emplacement: marque.emplacement, etat: e }; }
  const liste = parties(profil);
  const i = liste.findIndex((e) => !!e);
  return i >= 0 ? { emplacement: i, etat: liste[i]! } : null;
}
export function marquerDernierePartie(profil: string, emplacement: number) {
  ecrire(`soulseed:derniere:${profil}`, { emplacement });
}
