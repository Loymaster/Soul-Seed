// Boutique de Jumpy (openShop / generateShopStock / confirmShopPurchase du prototype) et stand de curiosités
// de Lady Roger (confirmLadyRogerSell). Sans affichage : l'étal vit dans le monde, l'or et le sac dans l'état de l'écho.
import type { Aleatoire, Etat } from '../simulation/types';
import { ALIMENTS } from '../simulation/donnees/aliments';
import { aliment, objetDivers, ranger } from '../simulation/objets';
import type { EmplacementEtal, Monde } from './index';

/** La boutique est ouverte de 9 h à 19 h. */
export const OUVERTURE_BOUTIQUE = 9;
export const FERMETURE_BOUTIQUE = 19;
export const boutiqueOuverte = (heure: number) => heure >= OUVERTURE_BOUTIQUE && heure < FERMETURE_BOUTIQUE;

/** Objets non comestibles vendus (NON_FOOD_ITEMS hors « noShop »). */
export const NON_COMESTIBLES = ['bandage', 'medicament'];
/** Objets utiles et de combat (HEAL_ITEMS). */
export const OBJETS_UTILES = ['graine_vie', 'feuille_vie', 'rosee_astrale', 'cristal_vital', 'eclat_ame', 'pierre_incantatoire', 'appat_echo', 'repousse', 'pierre_ardente'];
/** Équipement d'exploration, toujours en rayon (ajout de la refonte : la tente et la canne à pêche). */
export const EQUIPEMENT = ['tente', 'canne_peche'];

export const prixObjet = (id: string) => aliment(id)?.prix ?? objetDivers(id)?.prix ?? 0;
export const nomObjet = (id: string) => aliment(id)?.nom ?? objetDivers(id)?.nom ?? id;

const ALIMENTS_BOUTIQUE = () => ALIMENTS.filter((a) => !a.horsBoutique);
const piocher = <T,>(l: T[], rng: Aleatoire): T | undefined => l[Math.floor(rng() * l.length)];
const qte13 = (rng: Aleatoire) => 1 + Math.floor(rng() * 3);

/**
 * Étal du jour : végétarien, carnivore, omnivore, « deux pour le prix d'un », non comestible, objet utile,
 * puis l'équipement d'exploration. Pas deux fois le même aliment tant que possible.
 */
export function genererEtal(rng: Aleatoire = Math.random): EmplacementEtal[] {
  const pris = new Set<string>();
  const choisir = (filtre: (r: string[]) => boolean) => {
    const tous = ALIMENTS_BOUTIQUE().filter((a) => filtre(a.regimes));
    const libres = tous.filter((a) => !pris.has(a.id));
    const a = piocher(libres.length ? libres : tous, rng) ?? ALIMENTS_BOUTIQUE()[0];
    pris.add(a.id);
    return a;
  };
  const vege = choisir((r) => r.includes('Végétarien') && !r.includes('Carnivore'));
  const carni = choisir((r) => r.includes('Carnivore') && !r.includes('Végétarien'));
  const omni = choisir((r) => r.includes('Omnivore'));
  const deux = choisir(() => true);
  const etal: EmplacementEtal[] = [
    { categorie: 'Végétarien', id: vege.id, prix: vege.prix, stock: qte13(rng) },
    { categorie: 'Carnivore', id: carni.id, prix: carni.prix, stock: qte13(rng) },
    { categorie: 'Omnivore', id: omni.id, prix: omni.prix, stock: qte13(rng) },
    { categorie: 'Deux pour le prix d’un !', id: deux.id, prix: deux.prix, stock: 1, deuxPourUn: true },
  ];
  const nc = piocher(NON_COMESTIBLES, rng)!;
  etal.push({ categorie: 'Non comestible', id: nc, prix: prixObjet(nc), stock: qte13(rng) });
  const ut = piocher(OBJETS_UTILES, rng)!;
  etal.push({ categorie: 'Objets utiles et combat', id: ut, prix: prixObjet(ut), stock: qte13(rng) });
  for (const id of EQUIPEMENT) etal.push({ categorie: 'Équipement', id, prix: prixObjet(id), stock: 1 });
  return etal;
}

/** L'étal du jour : renouvelé à la première visite d'un nouveau jour (ou s'il est vide). */
export function etalDuJour(m: Monde, jour: number, rng: Aleatoire = Math.random): EmplacementEtal[] {
  if (!m.boutique || m.boutique.jour !== jour || !m.boutique.etal.length) m.boutique = { jour, etal: genererEtal(rng) };
  return m.boutique.etal;
}

/** Peut-on ranger cet objet dans le sac (une pile existe déjà, ou une case est libre) ? */
export const placePourObjet = (e: Etat, id: string) => e.inventaire.some((c) => c?.id === id) || e.inventaire.some((c) => !c);

export type ResultatAchat = { ok: true; recus: number; cout: number; texte: string } | { ok: false; raison: string };

/** Achète `qte` exemplaires de l'emplacement `index` de l'étal (un seul pour « deux pour le prix d'un »). */
export function acheter(e: Etat, m: Monde, index: number, qte = 1): ResultatAchat {
  const em = m.boutique?.etal[index];
  if (!em) return { ok: false, raison: 'Cet emplacement est vide.' };
  if (em.stock <= 0) return { ok: false, raison: 'Rupture de stock.' };
  const n = em.deuxPourUn ? 1 : Math.max(1, Math.min(Math.floor(qte), em.stock));
  const cout = em.prix * n;
  if (e.or < cout) return { ok: false, raison: 'Pas assez d’or pour cet achat.' };
  if (!placePourObjet(e, em.id)) return { ok: false, raison: `Le sac est plein ! Vous n’avez pas pu ranger : ${nomObjet(em.id)}.` };
  const recus = em.deuxPourUn ? 2 : n;
  ranger(e, em.id, recus);
  e.or -= cout;
  em.stock -= n;
  const texte = `Vous avez acheté ${recus} × ${nomObjet(em.id)} (${cout} or).`;
  e.journal.unshift({ jour: e.jour, minute: e.minute, texte });
  return { ok: true, recus, cout, texte };
}

// —— Stand de Lady Roger : elle rachète les curiosités et les petites bêtes, et seulement elles
// (le prototype ne rachetait que les curiosités ; les petites bêtes, sans autre usage, s'y vendent aussi).

export const prixRachat = (id: string) => { const o = objetDivers(id); return o?.nature === 'curiosite' || o?.nature === 'bete' ? o.revente ?? 0 : null; };

export type ResultatVente = { ok: true; gain: number; texte: string } | { ok: false; raison: string };

export function vendreCuriosite(e: Etat, index: number, qte = 1): ResultatVente {
  const c = e.inventaire[index];
  if (!c) return { ok: false, raison: 'Cette case est vide.' };
  const prix = prixRachat(c.id);
  if (prix == null) return { ok: false, raison: 'Cela n’intéresse pas Lady Roger.' };
  const n = Math.max(1, Math.min(Math.floor(qte), c.qte));
  e.inventaire[index] = c.qte > n ? { ...c, qte: c.qte - n } : null;
  const gain = prix * n;
  e.or += gain;
  const texte = `Vendu ${n} × ${nomObjet(c.id)} à Lady Roger (${gain} or).`;
  e.journal.unshift({ jour: e.jour, minute: e.minute, texte });
  return { ok: true, gain, texte };
}
