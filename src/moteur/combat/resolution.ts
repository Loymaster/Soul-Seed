// Résolution des coups et des techniques (effectiveCarac, resolveAttack, performTechnique du prototype).
import type { Caracs } from '../simulation/types';
import type { Combattant } from './types';
import { ARENE } from './constantes';
import { TECHNIQUES } from './donnees/techniques';
import { aStatut, ajouterStatut, appliquerEffets, chaineBrulure, mettreKO, type Contexte } from './statuts';

export const borne = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const dixieme = (v: number) => Math.round(v * 10) / 10;
const centieme = (v: number) => Math.round(v * 100) / 100;

/**
 * Caractéristiques du moment : bonus temporaires, Rapidité / Ralentissement et, pour l'écho du joueur,
 * le lien (attachement + affection), l'humeur, la colère et la peur.
 */
export function caracsEffectives(c: Combattant, t: number): Caracs {
  const eff = { ...c.caracs };
  for (const b of c.bonus) if (b.fin > t) for (const k of b.caracs) eff[k] *= 1 + b.part;
  const d = c.dispositions;
  if (d) {
    // Lien avec le joueur : ±10 % sur tout.
    const lien = (d.attachement + d.affection - 100) / 1000;
    // Humeur haute : confiance ; basse : hésitation.
    const humeur = (d.humeur - 50) / 500;
    // Colère : plus offensif, moins précis.
    const colere = (d.colere - 50) / 400;
    // Peur : freine l'attaque, pousse à l'esquive.
    const peur = (d.peur - 50) / 400;
    eff.force *= 1 + lien + humeur + colere - peur * 0.6;
    eff.perception *= 1 + lien + humeur - colere * 0.5;
    eff.agilite *= 1 + lien + Math.max(0, peur) * 0.3;
    eff.endurance *= 1 + lien + humeur;
    eff.robustesse *= 1 + lien;
  }
  if (aStatut(c, 'rapidite', t)) eff.agilite *= 1.5;
  if (aStatut(c, 'ralentissement', t)) eff.agilite *= 0.5;
  return eff;
}

export function multiplicateurVitesse(c: Combattant, t: number) {
  if (aStatut(c, 'rapidite', t)) return 1.5;
  if (aStatut(c, 'ralentissement', t)) return 0.5;
  return 1;
}

/** Longueur d'un pas (en % d'arène). */
export const vitesse = (c: Combattant, t: number) => (6 + (c.caracs.agilite || 0) / 55) * multiplicateurVitesse(c, t);

export interface IssueCoup { degats: number; esquive: boolean; pare: boolean; critique: boolean }

/** Un coup porté par `a` sur `c` (corps à corps, ou tir arrivé à destination). */
export function resoudreAttaque(
  ctx: Contexte, a: Combattant, c: Combattant,
  o: { percage?: number; volDeVie?: number; technique?: string | null } = {},
): IssueCoup {
  const { t, rng } = ctx;
  const atk = caracsEffectives(a, t);
  const def = caracsEffectives(c, t);
  let valeur = centieme(atk.force * (0.9 + rng() * 0.2));
  if (a.ordre?.type === 'attaque' && a.ordre.fin > t) valeur = centieme(valeur * 1.2);
  const critique = rng() < Math.min(0.4, atk.perception / 2500);
  if (critique) valeur = centieme(valeur * 1.5);
  const esquive = rng() < def.perception / 9990;
  let degats = 0;
  let pare = false;
  if (!esquive) {
    // Résistance : la moitié de l'endurance, au moins 15 % du coup, au plus la moitié de la force adverse.
    let resistance = Math.min(Math.max(def.endurance / 2, valeur * 0.15), atk.force * 0.5);
    if (o.percage) resistance *= 1 - o.percage;
    degats = Math.max(0, valeur - resistance);
    const bonusParade = c.ordre?.type === 'protege' && c.ordre.fin > t ? 0.25 : 0;
    pare = rng() < def.perception / 5000 + bonusParade;
    if (pare) degats = Math.max(0, degats * (1 - (0.5 + def.endurance / 4000)));
    if (aStatut(c, 'protection', t)) degats *= 0.7;
    const brulure = c.statuts.brulure;
    if (brulure && brulure.cumuls > 0) {
      degats *= 1 + brulure.cumuls * 0.15;
      delete c.statuts.brulure;
    }
  }
  degats = dixieme(degats);
  a.frappeJusqua = t + 300;
  if (esquive) {
    c.esquiveJusqua = t + 220;
    c.esquiveSens = c.x < a.x ? -1 : 1;
    ctx.emettre({ type: 'esquive', lanceur: a.id, cible: c.id, technique: o.technique ?? null });
    return { degats, esquive, pare, critique };
  }
  c.pv = Math.max(0, dixieme(c.pv - degats));
  c.vieVisibleJusqua = t + 2000;
  ctx.emettre({ type: 'coup', lanceur: a.id, cible: c.id, degats, critique, pare, technique: o.technique ?? null });
  if (c.pv <= 0) mettreKO(ctx, c);
  // À plusieurs : frappé par un autre que sa cible, on riposte une fois sur deux (sauf cible verrouillée).
  if (!c.ko && !c.cibleVerrouillee && c.cible !== a.id && rng() < 0.5) c.cible = a.id;
  if (o.volDeVie && degats > 0) a.pv = Math.min(a.pvMax, a.pv + degats * o.volDeVie);
  const renvoi = c.statuts.renvoiDegats;
  if (renvoi && renvoi.fin > t && degats > 0) {
    a.pv = Math.max(0, dixieme(a.pv - degats * (renvoi.part || 0.2)));
    if (a.pv <= 0) mettreKO(ctx, a);
    if (renvoi.poisonRiposte && rng() < renvoi.poisonRiposte) ajouterStatut(ctx, a, 'empoisonnement');
    if (renvoi.brulureRiposte && rng() < renvoi.brulureRiposte) ajouterStatut(ctx, a, 'brulure', undefined, { cumuls: 1 });
  }
  if (pare) {
    c.paradeJusqua = t + 300;
  } else if (!(c.insensibleJusqua > t)) {
    // Sonné une demi-seconde, puis brièvement insensible (pas d'enchaînement sans fin).
    c.sonneJusqua = t + 500;
    c.touche = t + 500;
    c.insensibleJusqua = t + 1100;
    // Une attaque en plein élan est interrompue net.
    if (c.deplacement === 'attaque') {
      c.deplacement = 'attente';
      c.depuis = t;
      c.cible = null;
      c.jauge = 0.5;
    }
    // Recul : ±45° autour de l'axe opposé à l'attaquant.
    const angle = Math.atan2(c.y - a.y, c.x - a.x) + (rng() * (Math.PI / 2) - Math.PI / 4);
    const recul = 5 + rng() * 4;
    c.x = borne(c.x + Math.cos(angle) * recul, ARENE.xMin, ARENE.xMax);
    c.y = borne(c.y + Math.sin(angle) * recul, ARENE.yMin, ARENE.yMax);
  }
  return { degats, esquive, pare, critique };
}

/** Exécute la technique `nom` (ou un coup simple si elle est absente). */
export function executerTechnique(ctx: Contexte, a: Combattant, cible: Combattant, adversaires: Combattant[], nom: string | null) {
  const f = nom ? TECHNIQUES[nom] : undefined;
  if (!f || !nom) { resoudreAttaque(ctx, a, cible); return; }
  const vivants = adversaires.filter(o => !o.ko);
  if (f.coutVie) {
    a.pv = Math.max(0, dixieme(a.pv - a.pv * f.coutVie));
    if (a.pv <= 0) mettreKO(ctx, a);
  }
  if (f.sansDegats) {
    for (const c of f.zone ? vivants : [cible]) appliquerEffets(ctx, a, c, f.aLancer);
    if (f.chaineBrulure) {
      const n = chaineBrulure(f.chaineBrulure, ctx.rng);
      if (n > 0) ajouterStatut(ctx, cible, 'brulure', undefined, { cumuls: n });
    }
    return;
  }
  const opts = { percage: f.percage, volDeVie: f.volDeVie, technique: nom };
  for (const c of f.zone ? vivants : [cible]) {
    const r = resoudreAttaque(ctx, a, c, opts);
    if (r.esquive) continue;
    appliquerEffets(ctx, a, c, f.auToucher);
    if (f.chaineBrulure) {
      const n = chaineBrulure(f.chaineBrulure, ctx.rng);
      if (n > 0) ajouterStatut(ctx, c, 'brulure', undefined, { cumuls: n });
    }
  }
  if (f.aLancer) appliquerEffets(ctx, a, cible, f.aLancer);
  if (f.rebond && !f.zone) {
    // 75 % de rebondir sur une autre cible, puis 25 % de rebondir encore (sur la première s'il n'y en a que deux).
    const autres = vivants.filter(o => o.id !== cible.id && o.pv > 0);
    const chaine: Combattant[] = [];
    if (autres.length && ctx.rng() < 0.75) {
      const second = autres[Math.floor(ctx.rng() * autres.length)];
      chaine.push(second);
      if (ctx.rng() < 0.25) {
        const reste = vivants.filter(o => o.id !== second.id && o.pv > 0);
        const choix = reste.length ? reste : [cible];
        chaine.push(choix[Math.floor(ctx.rng() * choix.length)]);
      }
    }
    for (const c of chaine) {
      const r = resoudreAttaque(ctx, a, c, opts);
      if (!r.esquive) appliquerEffets(ctx, a, c, f.auToucher);
    }
  }
}
