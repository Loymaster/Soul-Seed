// Statuts de combat : pose, dissipation, effets dans le temps (addStatus, tickStatusEffects… du prototype).
import type { Aleatoire, Combattant, EffetTechnique, EvenementCombat, Statut } from './types';
import { STATUTS_NEGATIFS, STATUTS_POSITIFS } from './constantes';

/** Ce dont les règles ont besoin à un instant donné. */
export interface Contexte {
  t: number;
  rng: Aleatoire;
  emettre: (e: EvenementCombat) => void;
}

const actif = (s: { fin: number } | undefined, t: number) => !!s && s.fin > t;
export const immunise = (c: Combattant, t: number) => actif(c.statuts.immunite, t);
export const aStatut = (c: Combattant, statut: 'terreur' | 'etourdissement' | 'ralentissement' | 'rapidite' | 'protection' | 'immunite', t: number) =>
  actif(c.statuts[statut], t);

/** Pose un statut. Renvoie faux si l'Immunité l'a bloqué. */
export function ajouterStatut(
  ctx: Contexte, c: Combattant, statut: Statut, dureeS?: number,
  extra: { cumuls?: number; soin?: number; part?: number; poisonRiposte?: number; brulureRiposte?: number } = {},
): boolean {
  const { t } = ctx;
  const st = c.statuts;
  if ((STATUTS_NEGATIFS as readonly string[]).includes(statut) && immunise(c, t)) return false;
  switch (statut) {
    case 'brulure': {
      const b = st.brulure;
      st.brulure = { cumuls: (b ? b.cumuls : 0) + (extra.cumuls ?? 1), depuis: b ? b.depuis : t, prochainJet: b ? b.prochainJet : t + 5000 };
      break;
    }
    case 'regeneration':
      st.regeneration = { debut: t, fin: t + (dureeS ?? 10) * 1000, dernier: t, total: extra.soin ?? 0.1 };
      break;
    // Durées fixes dans le prototype, quelle que soit la technique.
    case 'terreur': st.terreur = { fin: t + 5000 }; break;
    case 'etourdissement': st.etourdissement = { fin: t + 5000 }; break;
    case 'saignement': st.saignement = { fin: t + 20000 }; break;
    case 'empoisonnement': st.empoisonnement = { pose: t, prochainJet: t + 10000 }; break;
    case 'renvoiDegats':
      st.renvoiDegats = { fin: t + (dureeS ?? 10) * 1000, part: extra.part ?? 0.2, poisonRiposte: extra.poisonRiposte, brulureRiposte: extra.brulureRiposte };
      break;
    default:
      st[statut] = { fin: t + (dureeS ?? 10) * 1000 };
  }
  ctx.emettre({ type: 'statut', cible: c.id, statut });
  return true;
}

/** Annulation : retire les effets positifs (sauf si l'adversaire est immunisé). */
export function dissiper(ctx: Contexte, c: Combattant) {
  if (immunise(c, ctx.t)) return false;
  for (const k of ['regeneration', 'rapidite', 'protection', 'renvoiDegats'] as const) delete c.statuts[k];
  ctx.emettre({ type: 'statut', cible: c.id, statut: 'annulation' });
  return true;
}

/** Offrande : le lanceur dissipe ses propres effets positifs (Immunité comprise) et gagne 7,5 % de régénération par effet. */
export function offrande(ctx: Contexte, c: Combattant) {
  const st = c.statuts;
  let n = 0;
  for (const k of STATUTS_POSITIFS) {
    const s = st[k] as { fin?: number } | undefined;
    if (s && (s.fin == null || s.fin > ctx.t)) { n++; delete st[k]; }
  }
  if (n > 0) ajouterStatut(ctx, c, 'regeneration', 15, { soin: n * 0.075 });
}

/** Retire tous les effets négatifs. */
export function purifier(c: Combattant) {
  for (const k of STATUTS_NEGATIFS) delete c.statuts[k];
}

/** Brûlures en chaîne : `base` cumuls, puis un de plus tant que les jets successifs réussissent. */
export function chaineBrulure(chaine: { base: number; chances: number[] }, rng: Aleatoire) {
  let cumuls = chaine.base;
  for (const p of chaine.chances) {
    if (rng() < p) cumuls++; else break;
  }
  return cumuls;
}

export function appliquerEffets(ctx: Contexte, lanceur: Combattant, cible: Combattant | null, effets: EffetTechnique[] | undefined) {
  for (const e of effets ?? []) {
    if (ctx.rng() > (e.chance ?? 1)) continue;
    const dest = e.cible === 'soi' ? lanceur : cible;
    if (!dest) continue;
    switch (e.statut) {
      case 'annulation': dissiper(ctx, dest); break;
      case 'offrande': offrande(ctx, dest); break;
      case 'purification': purifier(dest); break;
      default: ajouterStatut(ctx, dest, e.statut, e.duree, e);
    }
  }
}

/** Une chance de se débarrasser d'un poison ou d'une brûlure : 5 % + robustesse / 3000, plafonné à 35 %. */
const chanceDeGuerir = (c: Combattant) => Math.min(0.35, Math.max(0.05, 0.05 + (c.caracs.robustesse || 0) / 3000));

/** Effets dans le temps, sur `dt` secondes. */
export function faireDurerStatuts(ctx: Contexte, c: Combattant, dt: number) {
  const { t, rng } = ctx;
  const st = c.statuts;
  if (st.saignement) {
    if (t < st.saignement.fin) c.pv = Math.max(0, c.pv - c.pvMax * 0.005 * dt);
    else delete st.saignement;
  }
  if (st.empoisonnement) {
    c.pv = Math.max(0, c.pv - c.pvMax * 0.0025 * dt);
    if (t - st.empoisonnement.pose >= 10000 && t >= st.empoisonnement.prochainJet) {
      if (rng() < chanceDeGuerir(c)) delete st.empoisonnement;
      else st.empoisonnement.prochainJet = t + 1000;
    }
  }
  if (st.brulure && t - st.brulure.depuis >= 5000 && t >= st.brulure.prochainJet) {
    if (rng() < chanceDeGuerir(c)) delete st.brulure;
    else st.brulure.prochainJet = t + 1000;
  }
  if (st.regeneration) {
    const r = st.regeneration;
    if (t >= r.fin) delete st.regeneration;
    else {
      const ecoule = Math.max(0, Math.min(t, r.fin) - r.dernier) / 1000;
      c.pv = Math.min(c.pvMax, c.pv + (ecoule / ((r.fin - r.debut) / 1000)) * r.total * c.pvMax);
      r.dernier = t;
      c.vieVisibleJusqua = t + 2000;
    }
  }
  for (const k of ['terreur', 'etourdissement', 'ralentissement', 'rapidite', 'protection', 'immunite', 'renvoiDegats'] as const) {
    const s = st[k];
    if (s && t >= s.fin) delete st[k];
  }
  if (c.pv <= 0) mettreKO(ctx, c);
}

export function mettreKO(ctx: Contexte, c: Combattant) {
  c.pv = 0;
  if (c.ko) return;
  c.ko = true;
  ctx.emettre({ type: 'ko', cible: c.id });
}
