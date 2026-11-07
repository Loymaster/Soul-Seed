// Travaux d'Ash (ASH_BUILDINGS, VILLAGE_BUILDINGS, CHORE_COSTS du prototype).
// Ash mène un chantier de bâtiment à la fois et, en parallèle, une réparation de corvée du ranch.
// Les matériaux sont pris d'abord dans le coffre de Maïko, puis dans les ressources portées.
// Les durées comptent en heures de jeu ; la fin est vérifiée à chaque heure (avancerTravaux).
import { RESSOURCES, construit, type Monde, type Ressource } from './index';
import { ajusterCoffre, ressourcesDisponibles } from './coffre';

export type Cout = Partial<Record<Ressource, number>>;

export interface BatimentAsh {
  cle: string; nom: string; cout: Cout; heures: number;
  prerequis: string[];
  /** Drapeau du monde qui doit être vrai pour que la ligne apparaisse (« un écho doit pouvoir vous renseigner »). */
  pnj?: string;
  effet: string;
}
/** Bâtiments qu'Ash construit avec des matériaux. */
export const BATIMENTS_ASH: BatimentAsh[] = [
  { cle: 'atelier', nom: 'Atelier', cout: { bois: 10, pierre: 10, fibres: 5, resine: 3 }, heures: 24, prerequis: [], effet: 'Ash et Glamp s’y installent.' },
  { cle: 'entrepot', nom: 'Entrepôt', cout: { bois: 20, pierre: 10, fibres: 10, resine: 5 }, heures: 24, prerequis: ['atelier'], pnj: 'maiko.recrute', effet: 'Le coffre devient un entrepôt : 48 places, 50 de chaque ressource.' },
  { cle: 'entrepot_l2', nom: 'Entrepôt niveau 2', cout: { bois: 45, pierre: 35, ferraille: 20, fibres: 25, resine: 15, cristaux: 5 }, heures: 30, prerequis: ['entrepot'], pnj: 'maiko.recrute', effet: '60 places, 100 de chaque ressource.' },
  { cle: 'entrepot_l3', nom: 'Entrepôt niveau 3', cout: { bois: 90, pierre: 80, ferraille: 40, fibres: 60, resine: 40, cristaux: 15 }, heures: 36, prerequis: ['entrepot_l2'], pnj: 'maiko.recrute', effet: '72 places, 200 de chaque ressource.' },
];

export interface BatimentVillage { cle: string; nom: string; or: number; prerequis: string[]; pnj?: string }
/** Bâtiments du village payés en or, construits sur-le-champ — sans effet en jeu pour l'instant (comme le prototype). */
export const BATIMENTS_VILLAGE: BatimentVillage[] = [
  { cle: 'dojo', nom: 'Dojo', or: 80, prerequis: ['atelier'], pnj: 'hevann.vaincu' },
  { cle: 'salle_entrainement', nom: 'Salle d’entraînement', or: 50, prerequis: ['dojo'] },
  { cle: 'infirmerie', nom: 'Infirmerie', or: 60, prerequis: ['dojo'] },
  { cle: 'salle_classe', nom: 'Salle de classe', or: 50, prerequis: ['dojo'] },
  { cle: 'comptoir', nom: 'Comptoir commercial', or: 90, prerequis: ['atelier'] },
  { cle: 'boutique', nom: 'Boutique', or: 50, prerequis: ['comptoir'] },
  { cle: 'salle_duel', nom: 'Salle de duel', or: 60, prerequis: ['comptoir'] },
  { cle: 'fontaine', nom: 'Fontaine', or: 30, prerequis: ['atelier'] },
  { cle: 'ecurie', nom: 'Écurie', or: 70, prerequis: ['atelier'] },
  { cle: 'centre_communautaire', nom: 'Centre communautaire', or: 100, prerequis: ['atelier'] },
  { cle: 'restaurant', nom: 'Restaurant', or: 60, prerequis: ['centre_communautaire'] },
  { cle: 'arene', nom: 'Arène', or: 90, prerequis: ['centre_communautaire'] },
  { cle: 'panneau_quetes', nom: 'Panneau des quêtes', or: 40, prerequis: ['centre_communautaire'] },
  { cle: 'bibliotheque', nom: 'Bibliothèque', or: 60, prerequis: ['centre_communautaire'] },
  { cle: 'nettoyage_final', nom: 'Nettoyage final', or: 50, prerequis: ['entrepot', 'salle_entrainement', 'infirmerie', 'salle_classe', 'boutique', 'salle_duel', 'fontaine', 'ecurie', 'restaurant', 'arene', 'panneau_quetes', 'bibliotheque'] },
];

export interface ReparationCorvee { corvee: string; nomCorvee: string; libelle: string; couts: [Cout, Cout, Cout] }
/** Réparations du ranch : le niveau 1 débloque la corvée (6 h), les niveaux 2 et 3 l'améliorent (12 h, 18 h). */
export const REPARATIONS: ReparationCorvee[] = [
  { corvee: 'ranger_ranch', nomCorvee: 'Ranger le ranch', libelle: 'Nettoyage de la grange', couts: [{ bois: 5, fibres: 5 }, { bois: 20, fibres: 10, resine: 5 }, { bois: 40, fibres: 20, resine: 10, pierre: 10 }] },
  { corvee: 'reparer_cloture', nomCorvee: 'Réparer la barrière', libelle: 'Remise en état de la barrière', couts: [{ bois: 5, ferraille: 2 }, { bois: 15, ferraille: 10 }, { bois: 40, ferraille: 30 }] },
  { corvee: 'rattraper_poules', nomCorvee: 'Rattraper les poules', libelle: 'Remise en état du poulailler', couts: [{ bois: 5, fibres: 5 }, { bois: 10, fibres: 10 }, { bois: 25, fibres: 25 }] },
  { corvee: 'deplacer_foin', nomCorvee: 'Déplacer le foin', libelle: 'Remise en état de la charrue', couts: [{ fibres: 5, pierre: 3 }, { fibres: 10, pierre: 5, resine: 5, bois: 5 }, { fibres: 15, pierre: 10, resine: 10, bois: 10 }] },
  { corvee: 'ramener_eau', nomCorvee: 'Ramener l’eau', libelle: 'Rafistolage des seaux', couts: [{ ferraille: 5 }, { pierre: 10, ferraille: 10 }, { pierre: 20, ferraille: 20 }] },
  { corvee: 'trouver_echo', nomCorvee: 'Trouver l’écho caché', libelle: 'Remise en état du sentier', couts: [{ resine: 5 }, { resine: 10, fibres: 10 }, { bois: 15, resine: 15, fibres: 15 }] },
];
/** Durée de chaque niveau de réparation (heures) ; tentatives et multiplicateur d'expérience des corvées par niveau. */
export const HEURES_REPARATION = [6, 12, 18] as const;
export const TENTATIVES_CORVEE = [8, 4, 8, 12] as const;
export const MULT_XP_CORVEE = [1, 1.2, 1.5, 1.85] as const;

export const NOMS_RESSOURCES: Record<Ressource, string> = { bois: 'bois', pierre: 'pierre', fibres: 'fibres', resine: 'résine', ferraille: 'ferraille', cristaux: 'cristaux' };
export const texteCout = (c: Cout) => RESSOURCES.filter((r) => c[r]).map((r) => `${c[r]} ${NOMS_RESSOURCES[r]}`).join(', ');

/** Ce qui manque pour payer `cout` (vide : tout y est). */
export function manque(m: Monde, cout: Cout): Cout {
  const r: Cout = {};
  for (const k of RESSOURCES) { const besoin = cout[k] ?? 0; const d = besoin - ressourcesDisponibles(m, k); if (d > 0) r[k] = d; }
  return r;
}
/** Prélève le coût : d'abord dans le coffre, puis dans le sac. Ne fait rien s'il manque quelque chose. */
export function payer(m: Monde, cout: Cout): boolean {
  if (Object.keys(manque(m, cout)).length) return false;
  for (const k of RESSOURCES) {
    let reste = cout[k] ?? 0;
    const c = Math.min(reste, m.coffre.ressources[k] ?? 0);
    m.coffre.ressources[k] = (m.coffre.ressources[k] ?? 0) - c; reste -= c;
    m.ressources[k] = (m.ressources[k] ?? 0) - reste;
  }
  return true;
}

const pnjOk = (m: Monde, pnj?: string) => !pnj || !!m.drapeaux[pnj];
const prerequisOk = (m: Monde, p: string[]) => p.every((k) => construit(m, k));

export type EtatBatiment = 'construit' | 'en-cours' | 'occupe' | 'prerequis' | 'inconnu' | 'disponible';
export function etatBatimentAsh(m: Monde, b: BatimentAsh): EtatBatiment {
  if (construit(m, b.cle)) return 'construit';
  if (m.chantier?.cle === b.cle) return 'en-cours';
  if (!pnjOk(m, b.pnj)) return 'inconnu';
  if (!prerequisOk(m, b.prerequis)) return 'prerequis';
  if (m.chantier) return 'occupe';
  return 'disponible';
}
export function etatBatimentVillage(m: Monde, b: BatimentVillage): EtatBatiment {
  if (construit(m, b.cle)) return 'construit';
  if (!pnjOk(m, b.pnj)) return 'inconnu';
  if (!prerequisOk(m, b.prerequis)) return 'prerequis';
  return 'disponible';
}
export const nomBatiment = (cle: string) => BATIMENTS_ASH.find((b) => b.cle === cle)?.nom ?? BATIMENTS_VILLAGE.find((b) => b.cle === cle)?.nom ?? cle;

export type ResultatTravaux = { ok: true; texte: string } | { ok: false; raison: string };

/** Ash commence un bâtiment (minute absolue `maintenant`). */
export function lancerChantier(m: Monde, cle: string, maintenant: number): ResultatTravaux {
  const b = BATIMENTS_ASH.find((x) => x.cle === cle);
  if (!b) return { ok: false, raison: 'Construction inconnue.' };
  const etat = etatBatimentAsh(m, b);
  if (etat === 'construit') return { ok: false, raison: `${b.nom} est déjà construit.` };
  if (etat === 'en-cours' || etat === 'occupe') return { ok: false, raison: 'Ash travaille déjà sur une construction.' };
  if (etat === 'inconnu') return { ok: false, raison: 'Un écho doit pouvoir vous renseigner sur cette construction.' };
  if (etat === 'prerequis') return { ok: false, raison: `Prérequis non rempli pour construire : ${b.nom}.` };
  const m2 = manque(m, b.cout);
  if (Object.keys(m2).length) return { ok: false, raison: `Ressources insuffisantes pour : ${b.nom} (il manque ${texteCout(m2)}).` };
  payer(m, b.cout);
  m.chantier = { cle: b.cle, nom: b.nom, finA: maintenant + b.heures * 60 };
  return { ok: true, texte: `Ash commence : ${b.nom} (${b.heures} h).` };
}

/** Bâtiment du village payé en or : construit sur-le-champ. */
export function construireVillage(m: Monde, e: { or: number }, cle: string): ResultatTravaux {
  const b = BATIMENTS_VILLAGE.find((x) => x.cle === cle);
  if (!b) return { ok: false, raison: 'Construction inconnue.' };
  const etat = etatBatimentVillage(m, b);
  if (etat === 'construit') return { ok: false, raison: `${b.nom} est déjà construit.` };
  if (etat === 'inconnu') return { ok: false, raison: 'Un écho doit pouvoir vous renseigner sur cette construction.' };
  if (etat === 'prerequis') return { ok: false, raison: `Prérequis non rempli pour construire : ${b.nom}.` };
  if (e.or < b.or) return { ok: false, raison: 'Pas assez d’or.' };
  e.or -= b.or;
  m.structures.push(b.cle);
  return { ok: true, texte: `Ash a construit : ${b.nom} (${b.or} or).` };
}

export const niveauCorvee = (m: Monde, corvee: string) => m.corvees[corvee] ?? 0;
export const corveeDebloquee = (m: Monde, corvee: string) => niveauCorvee(m, corvee) >= 1;

/** Réparation (niveau 1) ou amélioration (niveaux 2 et 3) d'une corvée du ranch. */
export function lancerReparation(m: Monde, corvee: string, maintenant: number): ResultatTravaux {
  const r = REPARATIONS.find((x) => x.corvee === corvee);
  if (!r) return { ok: false, raison: 'Corvée inconnue.' };
  if (m.reparation) return { ok: false, raison: 'Une réparation est déjà en cours.' };
  const niveau = niveauCorvee(m, corvee);
  if (niveau >= 3) return { ok: false, raison: `${r.nomCorvee} est déjà au niveau maximum.` };
  const cout = r.couts[niveau];
  const m2 = manque(m, cout);
  const libelle = niveau === 0 ? r.libelle : `Amélioration de ${r.nomCorvee.toLowerCase()}`;
  if (Object.keys(m2).length) return { ok: false, raison: `Ressources insuffisantes pour : ${libelle} (il manque ${texteCout(m2)}).` };
  payer(m, cout);
  const heures = HEURES_REPARATION[niveau];
  m.reparation = { corvee, libelle, niveau: niveau + 1, finA: maintenant + heures * 60 };
  return { ok: true, texte: niveau === 0 ? `Ash commence : ${libelle} (${heures} h).` : `Ash commence : ${libelle} (niveau ${niveau + 1}, ${heures} h).` };
}

/** Termine les travaux arrivés à échéance ; renvoie les phrases du journal. */
export function avancerTravaux(m: Monde, maintenant: number): string[] {
  const textes: string[] = [];
  if (m.chantier && maintenant >= m.chantier.finA) {
    if (!m.structures.includes(m.chantier.cle)) m.structures.push(m.chantier.cle);
    textes.push(`Ash a terminé : ${m.chantier.nom}.`);
    m.chantier = null;
    ajusterCoffre(m);
  }
  if (m.reparation && maintenant >= m.reparation.finA) {
    const r = REPARATIONS.find((x) => x.corvee === m.reparation!.corvee);
    m.corvees[m.reparation.corvee] = Math.max(niveauCorvee(m, m.reparation.corvee), m.reparation.niveau);
    textes.push(m.reparation.niveau === 1
      ? `Ash a terminé : ${m.reparation.libelle}. La corvée « ${r?.nomCorvee ?? m.reparation.corvee} » est désormais disponible.`
      : `Ash a terminé : ${m.reparation.libelle} (niveau ${m.reparation.niveau}).`);
    m.reparation = null;
  }
  return textes;
}
