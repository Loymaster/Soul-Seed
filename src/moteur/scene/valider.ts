// Vérification d'une scène contre le contenu réel du jeu : personnages, expressions, émotions,
// décors, musiques, scènes et variables. Chaque problème pointe une ligne précise.
import { analyserScene, identifiant } from './analyseur';
import { variablesLues } from './expressions';
import { ECHO, JOUEUR, NARRATION, type Noeud, type Probleme, type Scene } from './types';

export interface ContexteScene {
  pnj: Record<string, { nom: string; expressions: string[] }>;
  emotions: string[];
  /** chemins relatifs à public/assets, ex. « decors/village/sanctuaire.png » */
  decors: string[];
  musiques: string[];
  /** identifiants des scènes existantes */
  scenes: string[];
  /** toutes les images du catalogue (pour « action: image … ») */
  images?: string[];
  /** variables modifiées quelque part (autres scènes, registre, moteur du jeu) */
  variablesEcrites?: Set<string>;
}

/** Résout « village/sanctuaire » ou « decors/village/sanctuaire.png » en chemin d'asset. */
export function cheminDecor(valeur: string, decors?: string[]): string {
  const v = valeur.trim().replace(/^\/?(assets\/)?/, '');
  const avecDossier = v.startsWith('decors/') ? v : `decors/${v}`;
  const candidat = /\.[a-z0-9]+$/i.test(avecDossier) ? avecDossier : `${avecDossier}.png`;
  if (!decors || decors.includes(candidat)) return candidat;
  const sansExt = candidat.replace(/\.[a-z0-9]+$/i, '');
  return decors.find((d) => d.replace(/\.[a-z0-9]+$/i, '') === sansExt) || candidat;
}

/** « pnj/garry/attaque-jumpy » → « pnj/garry/attaque-jumpy.png ». */
export function cheminImage(valeur: string): string {
  const v = valeur.trim().replace(/^\/?(assets\/)?/, '');
  return /\.[a-z0-9]+$/i.test(v) ? v : `${v}.png`;
}

export function cheminMusique(valeur: string, musiques?: string[]): string {
  const v = valeur.trim().replace(/^\/?(assets\/)?/, '');
  const avecDossier = v.startsWith('sons/') ? v : `sons/musiques/${v}`;
  const candidat = /\.[a-z0-9]+$/i.test(avecDossier) ? avecDossier : `${avecDossier}.mp3`;
  if (!musiques || musiques.includes(candidat)) return candidat;
  const sansExt = candidat.replace(/\.[a-z0-9]+$/i, '');
  return musiques.find((d) => d.replace(/\.[a-z0-9]+$/i, '') === sansExt) || candidat;
}

/** Distance d'édition, pour proposer « vouliez-vous dire … ? ». */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
export function proche(mot: string, liste: string[]): string | undefined {
  let meilleur: string | undefined, score = Infinity;
  for (const x of liste) { const s = distance(mot, x); if (s < score) { score = s; meilleur = x; } }
  return score <= Math.max(2, Math.floor(mot.length / 3)) ? meilleur : undefined;
}
const suggestion = (mot: string, liste: string[]) => { const p = proche(mot, liste); return p ? ` Vouliez-vous dire « ${p} » ?` : ''; };

/** Variables lues et écrites par une scène. */
export function variablesDeScene(scene: Scene) {
  const lues = new Map<string, number>(), ecrites = new Map<string, number>();
  const parcourir = (noeuds: Noeud[]) => {
    for (const n of noeuds) {
      if (n.type === 'affecte') { if (!ecrites.has(n.variable)) ecrites.set(n.variable, n.ligne); for (const v of variablesLues(n.valeur)) if (!lues.has(v)) lues.set(v, n.ligne); }
      else if (n.type === 'si') for (const b of n.branches) { if (b.condition) for (const v of variablesLues(b.condition)) if (!lues.has(v)) lues.set(v, b.ligne); parcourir(b.corps); }
      else if (n.type === 'choix') for (const o of n.options) { if (o.condition) for (const v of variablesLues(o.condition)) if (!lues.has(v)) lues.set(v, o.ligne); parcourir(o.corps); }
      if ((n.type === 'replique') || (n.type === 'emotion' && n.note)) {
        const t = n.type === 'replique' ? n.texte : n.note!;
        for (const m of t.matchAll(/\{([\p{L}_][\p{L}\p{N}_.]*)\}/gu)) if (!lues.has(m[1])) lues.set(m[1], n.ligne);
      }
    }
  };
  parcourir(scene.corps);
  return { lues, ecrites };
}

/** Variables fournies par le jeu lui-même (jamais écrites dans une scène, mais toujours définies). */
export const VARIABLES_DU_JEU = new Set(['echo.nom', 'echo.stade', 'echo.lignee', 'joueur.nom', 'joueur.pronom', 'echo.genre', 'graine.nom', 'jour', 'heure', 'saison']);

export function validerScene(scene: Scene, ctx: ContexteScene): Probleme[] {
  const pb: Probleme[] = [];
  const ids = Object.keys(ctx.pnj);
  const verifierPNJ = (qui: string, ligne: number) => {
    if (qui === NARRATION || qui === JOUEUR || qui === ECHO) return true;
    if (!ctx.pnj[qui]) { pb.push({ niveau: 'erreur', ligne, message: `Personnage inconnu « ${qui} ».${suggestion(qui, ids)} (Les fiches sont dans l'onglet Personnages.)` }); return false; }
    return true;
  };
  const verifierExpression = (qui: string, expr: string | undefined, ligne: number) => {
    if (!expr || !ctx.pnj[qui]) return;
    const dispo = ctx.pnj[qui].expressions;
    if (!dispo.includes(expr)) pb.push({ niveau: 'erreur', ligne, message: `${ctx.pnj[qui].nom} n'a pas d'expression « ${expr} ».${suggestion(expr, dispo)} Disponibles : ${dispo.join(', ') || 'aucune'}.` });
  };
  const verifierDecor = (d: string, ligne: number) => {
    const c = cheminDecor(d, ctx.decors);
    if (!ctx.decors.includes(c)) pb.push({ niveau: 'erreur', ligne, message: `Décor introuvable « ${d} ».${suggestion(c.replace(/^decors\/|\.png$/g, ''), ctx.decors.map((x) => x.replace(/^decors\/|\.png$/g, '')))}` });
  };
  const verifierMusique = (m: string | null | undefined, ligne: number) => {
    if (!m) return;
    const c = cheminMusique(m, ctx.musiques);
    if (!ctx.musiques.includes(c)) pb.push({ niveau: 'erreur', ligne, message: `Musique introuvable « ${m} ».${suggestion(identifiant(m), ctx.musiques.map((x) => x.replace(/^sons\/musiques\/|\.mp3$/g, '')))}` });
  };

  if (scene.decor) verifierDecor(scene.decor, 1);
  else pb.push({ niveau: 'alerte', ligne: 1, message: 'Pas de décor : ajoutez « décor: … » en tête de scène.' });
  verifierMusique(scene.musique, 1);
  const presents = new Set<string>();
  const placesPrises = new Map<string, string>();
  for (const p of scene.places) {
    if (verifierPNJ(p.qui, p.ligne)) verifierExpression(p.qui, p.expression, p.ligne);
    if (placesPrises.has(p.place)) pb.push({ niveau: 'erreur', ligne: p.ligne, message: `Deux personnages à la même place (${p.place}) : ${placesPrises.get(p.place)} et ${p.qui}.` });
    placesPrises.set(p.place, p.qui);
    presents.add(p.qui);
  }

  // Parcours qui suit la présence des personnages (approximation : les branches partent de l'état courant).
  const parcourir = (noeuds: Noeud[], dedans: Set<string>) => {
    let arrete = false;
    for (const n of noeuds) {
      if (arrete) { pb.push({ niveau: 'alerte', ligne: n.ligne, message: 'Cette ligne ne sera jamais jouée (elle suit « fin » ou « aller »).' }); break; }
      switch (n.type) {
        case 'replique':
          if (verifierPNJ(n.qui, n.ligne)) {
            verifierExpression(n.qui, n.expression, n.ligne);
            if (n.qui !== NARRATION && n.qui !== JOUEUR && !dedans.has(n.qui)) {
              pb.push({ niveau: 'info', ligne: n.ligne, message: `${ctx.pnj[n.qui]?.nom || n.qui} n'est pas encore en scène : il entrera automatiquement (ou ajoutez « entre: ${n.qui} G2 »).` });
              dedans.add(n.qui);
            }
          }
          if (dedans.size > 4) pb.push({ niveau: 'alerte', ligne: n.ligne, message: 'Plus de 4 personnages en scène : faites-en sortir un.' });
          break;
        case 'emotion':
          if (!ctx.emotions.includes(n.emotion)) pb.push({ niveau: 'erreur', ligne: n.ligne, message: `Émotion inconnue « ${n.emotion} ».${suggestion(n.emotion, ctx.emotions)}` });
          break;
        case 'entre':
          if (verifierPNJ(n.qui, n.ligne)) verifierExpression(n.qui, n.expression, n.ligne);
          dedans.add(n.qui);
          if (dedans.size > 4) pb.push({ niveau: 'alerte', ligne: n.ligne, message: 'Plus de 4 personnages en scène : faites-en sortir un avant.' });
          break;
        case 'sort':
          for (const q of n.qui) {
            if (q === '*') { dedans.clear(); continue; }
            if (verifierPNJ(q, n.ligne) && !dedans.has(q)) pb.push({ niveau: 'alerte', ligne: n.ligne, message: `${ctx.pnj[q]?.nom || q} n'est pas en scène.` });
            dedans.delete(q);
          }
          break;
        case 'deplace':
          if (verifierPNJ(n.qui, n.ligne) && !dedans.has(n.qui)) pb.push({ niveau: 'alerte', ligne: n.ligne, message: `${ctx.pnj[n.qui]?.nom || n.qui} n'est pas en scène.` });
          break;
        case 'decor': verifierDecor(n.decor, n.ligne); break;
        case 'action':
          if (n.nom === 'image') {
            if (!n.argument) pb.push({ niveau: 'erreur', ligne: n.ligne, message: 'Image manquante : « action: image pnj/garry/attaque-jumpy » (ou « aucune » pour la retirer).' });
            else if (ctx.images && !/^(aucune|rien)$/i.test(n.argument) && !ctx.images.includes(cheminImage(n.argument)))
              pb.push({ niveau: 'erreur', ligne: n.ligne, message: `Image introuvable « ${n.argument} ».` });
          }
          break;
        case 'musique': verifierMusique(n.musique, n.ligne); break;
        case 'aller':
          if (!ctx.scenes.includes(n.scene)) pb.push({ niveau: 'erreur', ligne: n.ligne, message: `Scène inconnue « ${n.scene} ».${suggestion(n.scene, ctx.scenes)}` });
          arrete = true;
          break;
        case 'fin': arrete = true; break;
        case 'si': {
          const apres = new Set<string>();
          for (const b of n.branches) { const copie = new Set(dedans); parcourir(b.corps, copie); copie.forEach((q) => apres.add(q)); }
          dedans.clear(); apres.forEach((q) => dedans.add(q));
          break;
        }
        case 'choix': {
          const apres = new Set<string>();
          for (const o of n.options) {
            if (!o.texte) pb.push({ niveau: 'erreur', ligne: o.ligne, message: 'Réponse sans texte.' });
            const copie = new Set(dedans); parcourir(o.corps, copie); copie.forEach((q) => apres.add(q));
          }
          dedans.clear(); apres.forEach((q) => dedans.add(q));
          break;
        }
      }
    }
  };
  parcourir(scene.corps, presents);

  // Variables lues mais écrites nulle part : elles vaudront toujours 0.
  const { lues, ecrites } = variablesDeScene(scene);
  for (const [v, ligne] of lues) {
    if (ecrites.has(v) || ctx.variablesEcrites?.has(v) || VARIABLES_DU_JEU.has(v)) continue;
    pb.push({ niveau: 'alerte', ligne, message: `La variable « ${v} » n'est modifiée dans aucune scène : elle vaudra toujours 0.${suggestion(v, [...(ctx.variablesEcrites || []), ...ecrites.keys()])}` });
  }
  return pb;
}

/** Analyse et vérifie une scène en une fois : l'arbre de la scène et tous ses problèmes, ligne par ligne. */
export function verifierSource(source: string, id: string, ctx: ContexteScene) {
  const { scene, problemes } = analyserScene(source, id);
  return { scene, problemes: [...problemes, ...validerScene(scene, ctx)].sort((a, b) => a.ligne - b.ligne) };
}
