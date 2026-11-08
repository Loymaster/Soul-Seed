// Une scène de PNJ (contenu/scenes/<id>.scene) jouée dans la partie : les drapeaux du monde en variables,
// les actions de jeu (src/jeu/monde/actions.ts), les combats (écran de combat par-dessus la scène, qui reprend ensuite)
// et les panneaux (étal, stand, coffre, travaux, petits jeux). À la fin, les drapeaux changés reviennent dans le monde.
//
// Elle sert au village (src/jeu/monde/Monde.tsx) et en exploration (src/jeu/exploration/Exploration.tsx, PNJ de pnj.ts) :
// afficher <ScenePnj id="hevann-chemin" … /> et suivre `surFin({ sortie })` (voir contenu/scenes/LISEZMOI.md).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Catalogue } from '@/contenu/types';
import { SCENES } from '@/contenu/scenes';
import { analyserScene } from '@/moteur/scene/analyseur';
import type { Valeur } from '@/moteur/scene/types';
import { TECHNIQUES, aBoutDeForces, descriptionDepuisEtat } from '@/moteur/combat';
import { cheminImage } from '@/moteur/scene/valider';
import { PLACES, SCENE_H, placer } from '@/moteur/scene/placement';
import { Simulation, apparence, type Etat, type Sortie } from '@/moteur/simulation';
import type { Monde } from '@/moteur/monde';
import { SceneDialogue } from '../scene/SceneDialogue';
import { EcranCombat, type IssueCombat } from '../combat/EcranCombat';
import { SonsCombat } from '../combat/sons';
import { SFX } from '@/moteur/sfx';
import { Repere } from '../commun/Repere';
import * as P from '../profils';
import { appliquerIssueCombat, jouerAction, type Panneau } from './actions';
import type { CombatPnj } from './adversaires';
import { retenirVariables, synchroniser, variablesScene } from './variables';
import { Coffre, Deblayer, Etal, Sac, Stand, Travail, Travaux, type Ton } from './panneaux';
import './monde.css';

export interface ProprietesScenePnj {
  /** identifiant de la scène (nom du fichier sans « .scene ») */
  id: string;
  /** {sujet} de la scène (« discuter », « peche »…) */
  sujet?: string;
  /** décor du lieu où l'on se trouve : il remplace celui d'une scène du village (pas celui d'une scène d'exploration) */
  decor?: string;
  etat: Etat;
  monde: Monde;
  personnage: P.Personnage;
  catalogue: Catalogue;
  sons?: boolean;
  musique?: boolean;
  /** Simulation de l'écran hôte (sinon une nouvelle, sur le même état) */
  sim?: Simulation;
  /** Enregistre la partie et le monde (après chaque action et à la fin). */
  sauver: () => void;
  /** Ce que la simulation a signalé pendant les actions (journal, messages…). */
  surSorties?: (s: Sortie[]) => void;
  /** Une note pour le joueur (achat, vente, travaux…). */
  surNote?: (texte: string, ton?: Ton) => void;
  /** Un combat commence (vrai) ou se termine (faux) : l'hôte coupe sa musique. */
  surCombat?: (actif: boolean) => void;
  /** L'écho s'est éteint pendant la scène (combat). */
  surMort: () => void;
  /** Fin de la scène ; `sortie` : « ranch », un lieu du village, « zone 27 »… (action: ranch / action: lieu …) */
  surFin: (r: { sortie?: string }) => void;
}

/** Le personnage en pied s'il est dessiné, sinon son ancien portrait, sinon celui de repli. */
export function portraitJoueur(p: P.Personnage, catalogue: Catalogue): string | undefined {
  const dispo = new Set(catalogue.assets.map((a) => a.chemin));
  const corps = P.cheminCorps(p.avatar);
  if (dispo.has(corps)) return corps;
  const chemin = P.cheminAvatar(p.avatar);
  if (dispo.has(chemin)) return chemin;
  const repli = P.AVATARS.find((a) => a.id === p.avatar)?.repli;
  return repli && dispo.has(repli) ? repli : undefined;
}

const DECORS_DU_VILLAGE = /^(village\/|foret\/entree|atelier\/|boutique\/)/;

type Attente = (variables?: Record<string, Valeur>) => void;

/**
 * Cinématiques (scène de Nyxara) : deux actions jouées ici, pendant lesquelles le dialogue attend — pas de texte,
 * aucun clic ni touche ne les abrège — et qui s'effacent avant que le dialogue reprenne.
 *  - `action: cinematique pnj/nyxara/attaque-1` : l'image épinglée au-dessus de la scène, DUREE_CINEMATIQUE ms ;
 *  - `action: technique vinland G2 Lame de l’aube` : l'étiquette de technique de l'écran de combat (registre exploration,
 *    même son que le combat) au-dessus de la tête du PNJ à sa place, DUREE_TECHNIQUE ms.
 */
export const DUREE_CINEMATIQUE = 2600;
export const DUREE_TECHNIQUE = 1700;
/** Fondu de sortie de l'image (ms), compris dans sa durée. */
const SORTIE_CINEMATIQUE = 450;
type Cinematique =
  | { type: 'image'; chemin: string; sortie: boolean; cle: number }
  | { type: 'technique'; nom: string; icone: string; x: number; y: number; cle: number };

/** Lit « vinland G2 Lame de l’aube » : PNJ et place facultatifs, puis le nom de la technique (apostrophe droite, comme au combat). */
export function lireTechnique(argument: string, pnj: Record<string, { taille: number; visible: number }>) {
  const mots = argument.trim().split(/\s+/);
  const qui = mots[0] && pnj[mots[0]] ? mots.shift()! : undefined;
  const place = mots[0] && /^[GD][12]$/.test(mots[0]) ? (mots.shift() as keyof typeof PLACES) : undefined;
  const nom = mots.join(' ').replace(/[’‘]/g, "'");
  const x = place ? PLACES[place] : 640;
  // au-dessus de la tête, comme au combat (18 px)
  const f = qui ? pnj[qui] : undefined;
  const y = f ? (() => { const p = placer(f.taille, f.visible); return SCENE_H - p.bas - p.hauteur - 18; })() : 300;
  return { nom, x, y: Math.max(70, y), categorie: TECHNIQUES[nom]?.categorie };
}

export function ScenePnj(props: ProprietesScenePnj) {
  const { id, sujet, decor, etat, monde, personnage, catalogue } = props;
  const sim = useMemo(() => props.sim ?? new Simulation(etat), [props.sim, etat]);
  const scene = useMemo(() => {
    const s = SCENES.find((x) => x.id === id);
    if (!s) return null;
    const sc = analyserScene(s.source, s.id).scene;
    // le lieu impose son décor aux scènes du village (Maïko ou Ash dans l'atelier…), pas aux scènes d'exploration
    return decor && sc.decor && DECORS_DU_VILLAGE.test(sc.decor) ? { ...sc, decor } : sc;
  }, [id, decor]);
  // Les variables de départ : un objet stable (la scène redémarre si elles changent).
  const [initiales] = useState(() => variablesScene(etat, monde, personnage, sujet));
  const [combat, setCombat] = useState<{ c: CombatPnj; reprendre: Attente } | null>(null);
  const [panneau, setPanneau] = useState<{ p: Panneau; reprendre: Attente } | null>(null);
  const [cine, setCine] = useState<Cinematique | null>(null);
  const minuteursCine = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => minuteursCine.current.forEach(clearTimeout), []);
  const [, setVersion] = useState(0);
  const sortie = useRef<string | undefined>(undefined);
  const termine = useRef(false);
  const travailOr = useRef(0);
  const rafraichir = () => setVersion((v) => v + 1);
  const vider = () => { const s = sim.vider(); if (s.length) props.surSorties?.(s); };
  const ctx = { etat, monde, sim };

  if (!scene) {
    // scène introuvable : on rend la main aussitôt
    queueMicrotask(() => { if (!termine.current) { termine.current = true; props.surFin({}); } });
    return null;
  }

  const surAction = (nom: string, argument: string | undefined, reprendre: Attente) => {
    if (nom === 'cinematique' || nom === 'technique') { jouerCinematique(nom, argument ?? '', reprendre); return; }
    const r = jouerAction(nom, argument, ctx);
    vider();
    switch (r.type) {
      case 'suite': props.sauver(); reprendre(r.variables); break;
      case 'combat':
        // à bout de forces (tombé au dernier combat, pas encore reposé) : pas de combat, la scène suit comme après une fuite
        if (aBoutDeForces(etat)) {
          props.surNote?.(`${etat.nom} est à bout de forces : pas de combat avant de s’être reposé.`, 'mal');
          reprendre({ 'combat.issue': 'fuite' });
          break;
        }
        props.surCombat?.(true); setCombat({ c: r.combat, reprendre });
        break;
      case 'panneau': setPanneau({ p: r.panneau, reprendre }); break;
      case 'sortie': sortie.current = r.vers; reprendre(); break;
    }
  };

  const jouerCinematique = (nom: 'cinematique' | 'technique', argument: string, reprendre: Attente) => {
    const plus = (f: () => void, ms: number) => minuteursCine.current.push(setTimeout(f, ms));
    const cle = Date.now();
    if (nom === 'cinematique') {
      if (props.sons !== false) SFX.woosh();
      setCine({ type: 'image', chemin: cheminImage(argument), sortie: false, cle });
      plus(() => setCine((c) => (c?.cle === cle ? { ...c, sortie: true } as Cinematique : c)), DUREE_CINEMATIQUE - SORTIE_CINEMATIQUE);
      plus(() => { setCine((c) => (c?.cle === cle ? null : c)); reprendre(); }, DUREE_CINEMATIQUE);
    } else {
      const t = lireTechnique(argument, catalogue.pnj);
      if (props.sons !== false) SonsCombat.technique();
      setCine({ type: 'technique', nom: t.nom, icone: `${import.meta.env.BASE_URL}assets/interface/techniques/${t.categorie ?? 'physique'}.png`, x: t.x, y: t.y, cle });
      plus(() => { setCine((c) => (c?.cle === cle ? null : c)); reprendre(); }, DUREE_TECHNIQUE);
    }
  };

  const finCombat = (issue: IssueCombat) => {
    if (!combat) return;
    const vars = appliquerIssueCombat(ctx, combat.c, issue);
    vider();
    props.sauver();
    const reprendre = combat.reprendre;
    setCombat(null);
    props.surCombat?.(false);
    if (etat.mort) { termine.current = true; props.surMort(); return; }
    reprendre(vars);
  };

  const fermerPanneau = (variables?: Record<string, Valeur>) => {
    if (!panneau) return;
    props.sauver();
    const reprendre = panneau.reprendre;
    setPanneau(null);
    reprendre({ ...variables, or: etat.or });
  };

  const commun = { e: etat, m: monde, sim, rafraichir, noter: (t: string, ton?: Ton) => props.surNote?.(t, ton), fermer: () => fermerPanneau() };

  return (
    <>
      <div className="mo-scene" style={{ display: combat ? 'none' : undefined }}>
        <SceneDialogue scene={scene} catalogue={catalogue} sons={props.sons} musique={props.musique}
          echo={{ nom: etat.nom, chemin: apparence(etat) }} joueur={portraitJoueur(personnage, catalogue)}
          variables={initiales} surAction={surAction}
          surFin={({ variables }) => {
            if (termine.current) return;
            termine.current = true;
            retenirVariables(monde, initiales, variables);
            synchroniser(etat, monde);
            props.sauver();
            setTimeout(() => props.surFin({ sortie: sortie.current }), 100);
          }} />
      </div>
      {cine && (
        // par-dessus la scène ; il retient aussi les clics : le dialogue attend la fin de la cinématique
        <div className="mo-cinematique" onClick={(e) => e.stopPropagation()}><Repere fond="transparent">
          {cine.type === 'image' && catalogue.assets.some((a) => a.chemin === cine.chemin) && (
            <div key={cine.cle} className={`sc-photo${cine.sortie ? ' mo-cine-sort' : ''}`}>
              <img src={catalogue.assets.find((a) => a.chemin === cine.chemin)!.url} alt="" />
            </div>
          )}
          {cine.type === 'technique' && (
            // l'étiquette de l'écran de combat, telle quelle (src/jeu/combat/combat.css, registre exploration)
            <div className="cb exploration mo-cine-cb">
              <div key={cine.cle} className="etiq" style={{ left: cine.x, top: cine.y }}><img src={cine.icone} alt="" /><span>{cine.nom}</span></div>
            </div>
          )}
        </Repere></div>
      )}
      {panneau && (
        <div className="mo-panneau-scene"><Repere fond="transparent" className="mo">
          {panneau.p === 'boutique' && <Etal {...commun} />}
          {panneau.p === 'stand' && <Stand {...commun} />}
          {panneau.p === 'coffre' && <Coffre {...commun} />}
          {panneau.p === 'travaux' && <Travaux {...commun} />}
          {panneau.p === 'sac' && <Sac {...commun} />}
          {panneau.p === 'travail' && <Travail {...commun} gain={(or) => { travailOr.current = or; }} fermer={() => fermerPanneau({ 'travail.or': travailOr.current })} />}
          {panneau.p === 'deblayer' && <Deblayer fermer={() => undefined} fin={(ok) => fermerPanneau({ 'action.ok': ok })} />}
        </Repere></div>
      )}
      {combat && (
        <div className="mo-combat">
          <EcranCombat echo={etat} allie={descriptionDepuisEtat(etat)} adversaire={combat.c.adversaires[0]} renforts={combat.c.adversaires.slice(1)}
            registre={combat.c.registre} terrain={combat.c.terrain} piste={combat.c.musique} musique={props.musique} surFin={finCombat} />
        </div>
      )}
    </>
  );
}
