// Point d'entrée du jeu et parcours d'une partie :
//   profil (premier lancement) → menu principal →
//   avec l'introduction : entre deux mondes → arrivée au Sanctuaire (graine, éclosion, nom) → ranch ;
//   sans l'introduction : création du personnage → choix de la Soul Seed → ranch.
//   Au ranch, quand l'écho s'éteint : le dernier souffle → choix de la Soul Seed (après la disparition) → ranch.
//   Du ranch, le poteau « partir » → Explorer : l'exploration (départ à la Sortie du village) ; une rencontre ouvre
//   l'écran de combat, qui ramène au même lieu ; à la Sortie du village, une flèche ramène au ranch, l'autre à la forêt
//   du village. Les PNJ d'exploration jouent leur scène sur place. Une sortie en cours est notée dans le monde :
//   recharger la page (ou « Continuer ») y ramène, au même lieu.
//   Du ranch encore, « Le village » et « Le magasin » ouvrent l'écran du monde (src/jeu/monde : village, forêt,
//   sanctuaire, atelier, boutique) ; ses PNJ jouent leurs scènes et leurs combats sur place, puis on rentre au ranch
//   (ou, depuis la forêt du village, « Partir en exploration »).
import { StrictMode, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import donnees from '@contenu/generes/assets.json';
import type { Catalogue } from '@/contenu/types';
import { SCENES } from '@/contenu/scenes';
import { analyserScene } from '@/moteur/scene/analyseur';
import { Simulation, ageJours, apparence, creerEchoSauvage, heureDuJour, type EchoSauvage, type Etat } from '@/moteur/simulation';
import { bilanCombat, descriptionDepuisEtat, descriptionSauvage } from '@/moteur/combat';
import { EcranCombat, type AdversaireCombat, type IssueCombat, type Registre } from './combat/EcranCombat';
import { SFX } from '@/moteur/sfx';
import { SceneDialogue } from './scene/SceneDialogue';
import { Ranch } from './ranch/Ranch';
import { nouvellePartie } from './ranch/sauvegarde';
import { MenuPrincipal } from './menu/MenuPrincipal';
import { Introduction, NouveauProfil } from './menu/Introduction';
import { ChoixGraine } from './graines/ChoixGraine';
import { DernierSouffle } from './mort/DernierSouffle';
import { EntreDeuxMondes } from './intro/EntreDeuxMondes';
import { ID_SCENE_SANCTUAIRE, Sanctuaire } from './intro/Sanctuaire';
import { Exploration, bilanDepart, reprendreTrouvailles, type BilanSortie, type RencontreExploration, type RetourCombat } from './exploration/Exploration';
import { DEPART, ZONES } from './exploration/zones';
import { creerMonde, heureAbsolue, poser, vrai, type Monde } from '@/moteur/monde';
import { Monde as EcranMonde } from './monde/Monde';
import { imagesLieu, lieuxVoisins, type ContexteLieu, type IdLieu } from './monde/lieux';
import { imagesZone } from './exploration/pnj';
import { Demarrage, Pret } from './commun/Pret';
import { imagesScene, initialiserPrechargement, lancerArrierePlan, parPrefixe, precharger } from './commun/prechargement';
import { synchroniser } from './monde/variables';
import * as P from './profils';
import '@/styles/polices';
import './base.css';
import { fixerVolumes } from './commun/volumes';

const catalogue = donnees as unknown as Catalogue;
// publié dans un sous-dossier (GitHub Pages : /Soul-Seed/) : les adresses du catalogue suivent la base du site
if (import.meta.env.BASE_URL !== '/') for (const a of catalogue.assets) if (a.url?.startsWith('/')) a.url = import.meta.env.BASE_URL + a.url.slice(1);
const DISPONIBLES = new Set(catalogue.assets.map((a) => a.chemin));
initialiserPrechargement(catalogue);
/** Emplacement fictif des essais lancés depuis les outils de développement : rien n'est enregistré. */
const ESSAI = -1;

type Ecran =
  | { nom: 'intro'; premier: boolean }
  | { nom: 'menu' }
  | { nom: 'personnage'; emplacement: number }
  | { nom: 'introduction'; emplacement: number }
  | { nom: 'sanctuaire'; emplacement: number; personnage: P.Personnage; echo: Etat }
  | { nom: 'graines'; emplacement: number; personnage: P.Personnage; contexte: 'nouvelle' | 'apres' }
  | { nom: 'mort'; emplacement: number; etat: Etat }
  | { nom: 'ranch'; emplacement: number; etat: Etat }
  | { nom: 'combat'; emplacement: number; etat: Etat; adversaire: AdversaireCombat; registre: Registre; terrain: string; entrainement: boolean; exploration?: SortieExploration & { rencontre: RencontreExploration } }
  | ({ nom: 'exploration'; emplacement: number; etat: Etat; retourCombat?: RetourCombat } & SortieExploration)
  | { nom: 'monde'; emplacement: number; etat: Etat; monde: Monde; lieu: IdLieu }
  | { nom: 'scene'; id: string };

/** Une sortie en exploration : le monde de la partie, le lieu, le chemin parcouru, le sac au départ. */
interface SortieExploration { monde: Monde; zone: number; historique: number[]; bilan: BilanSortie }

/** L'écho sauvage d'une rencontre d'exploration, prêt à combattre sur le décor du lieu. */
function preparerCombatExploration(r: RencontreExploration) {
  const description = descriptionSauvage(r.sauvage, Math.random);
  const adversaire: AdversaireCombat = { description, image: apparence({ ...r.sauvage, evolution: null } as unknown as Etat) };
  return { adversaire, registre: 'exploration' as Registre, terrain: ZONES[r.zone].fond, entrainement: false };
}

/** Terrains des combats d'exploration (décors du chemin). */
const TERRAINS = ['02-passage-foret', '07-riviere', '16-chemin-foret', '17-foret-detruite', '10-champ-rochers', '31-sentier-bord-lac'];

/**
 * Un écho sauvage de l'âge du sien (un peu plus jeune ou un peu plus vieux), prêt à combattre ;
 * ou l'écho de passage au ranch (`sauvage`), tel qu'il est, sur le décor du ranch.
 */
function preparerCombat(etat: Etat, nature: 'exploration' | 'entrainement', sauvage?: EchoSauvage) {
  if (sauvage) {
    const description = descriptionSauvage(sauvage, Math.random);
    return { adversaire: { description, image: apparence({ ...sauvage, evolution: null }) } as AdversaireCombat, registre: 'exploration' as Registre, terrain: 'decors/ranch/journee.png', entrainement: true };
  }
  const age = ageJours(etat);
  let s = creerEchoSauvage(Math.random, Math.max(1, age - 1), age + 2);
  // jamais deux échos du même nom face à face
  for (let i = 0; i < 8 && s.nom === etat.nom; i++) s = creerEchoSauvage(Math.random, Math.max(1, age - 1), age + 2);
  const description = descriptionSauvage(s, Math.random, nature === 'entrainement' ? { min: 0.8, max: 0.95 } : undefined);
  const adversaire: AdversaireCombat = { description, image: apparence({ ...s, evolution: null }) };
  const terrain = `decors/exploration/${nature === 'entrainement' ? '10-champ-rochers' : TERRAINS[Math.floor(Math.random() * TERRAINS.length)]}.png`;
  return { adversaire, registre: 'exploration' as Registre, terrain, entrainement: nature === 'entrainement' };
}

/** Ce que le combat laisse à l'écho : objets utilisés, puis progrès, or, émotions, blessure (ou seulement la fatigue d'une fuite). */
function appliquerCombat(etat: Etat, issue: IssueCombat, adversaire: AdversaireCombat, entrainement: boolean) {
  const sim = new Simulation(etat);
  issue.objetsUtilises.forEach((id) => sim.retirerObjet(id));
  const d = adversaire.description;
  if (issue.resultat === 'fuite') { etat.pvCombat = issue.pv; return; }
  const b = bilanCombat(issue.resultat, etat.caracs, { stade: d.stade, lignee: d.lignee, ageJours: d.ageJours ?? null }, issue.pv, Math.random,
    entrainement ? { risqueBlessure: 0 } : {});
  sim.terminerCombat(b, d.nom);
}

// —— Préchargement (src/jeu/commun/prechargement.ts) : ce que chaque écran montre d'emblée est chargé et décodé
// avant de l'afficher ; ce dont il aura bientôt besoin suit, puis tout le reste en arrière-plan.

/** Le socle, chargé derrière l'écran de démarrage : interface, émotions, objets, avatars, menu. */
const SOCLE = () => parPrefixe('interface/', 'emotions/', 'objets/', 'joueur/', 'decors/menu/');
/** Ordre de l'arrière-plan : ce qui sert le plus souvent d'abord. */
const ORDRE_FOND = ['decors/ranch/', 'activites/', 'echos/', 'animations/', 'decors/village/', 'decors/foret/', 'decors/boutique/', 'decors/atelier/', 'pnj/', 'decors/exploration/', 'decors/'];

const STADE_SUIVANT: Record<string, string> = { graines: 'bebe', bebe: 'enfant', enfant: 'adolescent', adolescent: 'adulte' };
/** Les formes du stade de l'écho et du suivant (une évolution ne doit pas attendre son image). */
function formesEcho(etat: Etat): string[] {
  const dossier = apparence(etat).replace(/[^/]+$/, '');
  const stade = dossier.split('/')[1] ?? '';
  return parPrefixe(dossier, ...(STADE_SUIVANT[stade] ? [`echos/${STADE_SUIVANT[stade]}/`] : []));
}

/** Pour un écran : les images attendues avant de l'afficher, et celles qui suivent sans attendre. */
function imagesEcran(e: Ecran): { chemins: string[]; ensuite: string[] } {
  switch (e.nom) {
    case 'ranch': return { chemins: [...parPrefixe('decors/ranch/'), apparence(e.etat)], ensuite: [...parPrefixe('activites/', 'animations/'), ...formesEcho(e.etat)] };
    case 'exploration': {
      const c = { m: e.monde, e: e.etat, h: heureDuJour(e.etat) };
      const voisins = ZONES[e.zone].chemins.flatMap((ch) => (ch.vers != null && ZONES[ch.vers] ? imagesZone(ch.vers, ZONES[ch.vers].fond, c) : []));
      return { chemins: [...imagesZone(e.zone, ZONES[e.zone].fond, c), apparence(e.etat)], ensuite: voisins };
    }
    case 'monde': {
      const c: ContexteLieu = { m: e.monde, e: e.etat, h: heureDuJour(e.etat), maintenant: heureAbsolue(e.etat) };
      return { chemins: [...imagesLieu(e.lieu, c), apparence(e.etat)], ensuite: lieuxVoisins(e.lieu, c).flatMap((l) => imagesLieu(l, c)) };
    }
    case 'combat': return { chemins: [e.terrain, e.adversaire.image, apparence(e.etat)], ensuite: [] };
    case 'mort': return { chemins: ['echos/ame.png', apparence(e.etat)], ensuite: parPrefixe('echos/graines/') };
    case 'graines': return { chemins: parPrefixe('echos/graines/'), ensuite: parPrefixe('echos/bebe/') };
    case 'introduction': return { chemins: parPrefixe('pnj/homme-mysterieux/'), ensuite: parPrefixe('echos/graines/') };
    case 'sanctuaire': {
      const s = SCENES.find((x) => x.id === ID_SCENE_SANCTUAIRE);
      return { chemins: s ? imagesScene(analyserScene(s.source, s.id).scene) : [], ensuite: [...parPrefixe('echos/graines/', 'echos/bebe/', 'decors/ranch/')] };
    }
    case 'scene': {
      const s = SCENES.find((x) => x.id === e.id);
      return { chemins: s ? imagesScene(analyserScene(s.source, s.id).scene) : [], ensuite: [] };
    }
    default: return { chemins: [], ensuite: [] };
  }
}

/** Portrait du personnage : son avatar s'il est déjà dessiné, sinon le portrait de repli. */
function portrait(p: P.Personnage): string | undefined {
  const chemin = P.cheminAvatar(p.avatar);
  if (DISPONIBLES.has(chemin)) return chemin;
  const repli = P.AVATARS.find((a) => a.id === p.avatar)?.repli;
  return repli && DISPONIBLES.has(repli) ? repli : undefined;
}

/** Le jeu ne démarre qu'une fois le socle d'images chargé ; tout le reste suit en arrière-plan. */
function Racine() {
  const [avancement, setAvancement] = useState({ fait: 0, total: 0, pret: false });
  useEffect(() => {
    let vivant = true;
    precharger(SOCLE(), { urgent: true, delai: 20000, progression: (fait, total) => vivant && setAvancement((a) => ({ ...a, fait, total })) })
      .then(() => { if (vivant) setAvancement((a) => ({ ...a, pret: true })); lancerArrierePlan(ORDRE_FOND); });
    return () => { vivant = false; };
  }, []);
  if (!avancement.pret) return <Demarrage fait={avancement.fait} total={avancement.total} />;
  return <Jeu />;
}

function Jeu() {
  const [version, setVersion] = useState(0); // relit les profils après chaque modification
  const rafraichir = () => setVersion((v) => v + 1);
  const profil = useMemo(() => P.profilActif(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const profils = useMemo(() => P.registre().profils, [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ecran, setEcran] = useState<Ecran>(() => (P.profilActif() ? { nom: 'menu' } : { nom: 'intro', premier: true }));

  if (ecran.nom === 'intro' || !profil) {
    const premier = !profil || (ecran.nom === 'intro' && ecran.premier);
    return (
      <NouveauProfil
        surAnnuler={premier ? undefined : () => setEcran({ nom: 'menu' })}
        surFin={(nom) => { P.creerProfil(nom); rafraichir(); setEcran({ nom: 'menu' }); }} />
    );
  }

  const { musique, sons } = profil.reglages;
  /** Le monde d'un emplacement (un essai n'a pas de monde enregistré). */
  const chargerMonde = (emplacement: number) => (emplacement === ESSAI ? creerMonde() : P.chargerMonde(profil.id, emplacement));
  SFX.on = sons;
  fixerVolumes({ musique: P.volumeMusiqueDe(profil.reglages) / 100, bruitages: P.volumeBruitagesDe(profil.reglages) / 100 });
  const menu = () => { rafraichir(); setEcran({ nom: 'menu' }); };
  const lancer = (emplacement: number, etat: Etat) => {
    if (emplacement === ESSAI) { menu(); return; }
    P.marquerDernierePartie(profil.id, emplacement);
    // un écho éteint : une nouvelle graine attend le joueur
    if (etat.mort) { setEcran({ nom: 'graines', emplacement, personnage: P.chargerPersonnage(profil, emplacement), contexte: 'apres' }); return; }
    // une sortie d'exploration interrompue (page rechargée, jeu fermé) : on reprend là où l'on était
    const monde = chargerMonde(emplacement);
    if (monde.sortie && ZONES[monde.sortie.zone]) { setEcran({ nom: 'exploration', emplacement, etat, monde, ...monde.sortie }); return; }
    setEcran({ nom: 'ranch', emplacement, etat });
  };
  /** Un nouvel écho entre au ranch : la partie (et son personnage) est enregistrée dans l'emplacement. */
  const accueillir = (emplacement: number, personnage: P.Personnage, etat: Etat) => {
    if (emplacement !== ESSAI) {
      P.sauverPersonnage(profil.id, emplacement, personnage);
      P.sauverPartie(profil.id, emplacement, etat);
      P.noterForme(profil.id, apparence(etat));
    }
    lancer(emplacement, etat);
  };

  // l'écran ne s'affiche qu'une fois ses images prêtes (même clé : il reste affiché, la liste suit ses déplacements)
  const images = imagesEcran(ecran);
  const cleEcran = ecran.nom === 'combat' ? `combat-${ecran.adversaire.description.nom}` : ecran.nom;
  const garde = (vue: ReactNode) => <Pret key={cleEcran} chemins={images.chemins} ensuite={images.ensuite}>{vue}</Pret>;

  switch (ecran.nom) {
    case 'personnage':
      return garde(
        <Introduction disponibles={DISPONIBLES}
          surAnnuler={() => setEcran({ nom: 'menu' })}
          surFin={(nom, avatar, pronom) => setEcran({ nom: 'graines', emplacement: ecran.emplacement, personnage: { nom, avatar, pronom }, contexte: 'nouvelle' })} />
      );
    case 'introduction':
      return garde(
        <EntreDeuxMondes musique={musique}
          surFin={({ personnage, graine }) => setEcran({ nom: 'sanctuaire', emplacement: ecran.emplacement, personnage, echo: nouvellePartie(graine) })} />
      );
    case 'sanctuaire':
      return garde(
        <Sanctuaire personnage={ecran.personnage} echo={ecran.echo} catalogue={catalogue} portrait={portrait(ecran.personnage)} sons={sons} musique={musique}
          surFin={(etat) => accueillir(ecran.emplacement, ecran.personnage, etat)} />
      );
    case 'graines':
      return garde(
        <ChoixGraine key={`${ecran.emplacement}-${ecran.contexte}`} contexte={ecran.contexte} musique={musique}
          creer={(graine) => nouvellePartie(graine)}
          surRetour={ecran.contexte === 'nouvelle' ? () => setEcran({ nom: 'menu' }) : undefined}
          surFin={(etat) => accueillir(ecran.emplacement, ecran.personnage, etat)} />
      );
    case 'mort':
      return garde(
        <DernierSouffle echo={ecran.etat} joueur={ecran.emplacement === ESSAI ? profil.nom : P.chargerPersonnage(profil, ecran.emplacement).nom} musique={musique}
          surFin={() => setEcran({ nom: 'graines', emplacement: ecran.emplacement, personnage: ecran.emplacement === ESSAI ? P.chargerPersonnage(profil, 0) : P.chargerPersonnage(profil, ecran.emplacement), contexte: 'apres' })} />
      );
    case 'ranch': {
      const { emplacement } = ecran;
      synchroniser(ecran.etat, chargerMonde(emplacement)); // Garry vaincu : plus de bruits de ravages
      return garde(
        <Ranch key={`${profil.id}-${emplacement}-${ecran.etat.naissance}-${ecran.etat.graine}-${ecran.etat.nom}`} etat={ecran.etat}
          reglages={profil.reglages}
          surReglages={(r) => P.modifierProfil(profil.id, { reglages: { ...(P.profilActif()?.reglages ?? profil.reglages), ...r } })}
          sauver={(e) => { P.sauverPartie(profil.id, emplacement, e); P.noterForme(profil.id, apparence(e)); }}
          personnage={P.chargerPersonnage(profil, emplacement)}
          connus={profil.connus ?? []}
          surDecouverte={(cle) => { const p = P.profilActif(); if (p && !(p.connus ?? []).includes(cle)) P.modifierProfil(p.id, { connus: [...(p.connus ?? []), cle] }); }}
          surMort={(e) => setEcran({ nom: 'mort', emplacement, etat: e })}
          surCombat={(e, nature, sauvage) => setEcran({ nom: 'combat', emplacement, etat: e, ...preparerCombat(e, nature, sauvage) })}
          catalogue={catalogue}
          tutoriel={emplacement !== ESSAI && !vrai(chargerMonde(emplacement), 'ranch.tutoriel_vu')}
          surTutorielVu={() => { if (emplacement === ESSAI) return; const m = chargerMonde(emplacement); poser(m, 'ranch.tutoriel_vu'); P.sauverMonde(profil.id, emplacement, m); }}
          ressources={chargerMonde(emplacement).ressources}
          corvees={chargerMonde(emplacement).corvees}
          surPartir={(e, lieu) => {
            const monde = chargerMonde(emplacement);
            // le village (centre) ou la boutique de Jumpy
            if (lieu !== 'exploration') { setEcran({ nom: 'monde', emplacement, etat: e, monde, lieu: lieu === 'magasin' ? 'boutique' : 'village' }); return; }
            setEcran({ nom: 'exploration', emplacement, etat: e, monde, zone: DEPART, historique: [], bilan: bilanDepart(e, monde) });
          }}
          surQuitter={menu} />
      );
    }
    case 'exploration': {
      const { emplacement, etat, monde, zone, historique, bilan, retourCombat } = ecran;
      const sauver = (e: Etat, m: Monde) => { if (emplacement !== ESSAI) { P.sauverPartie(profil.id, emplacement, e); P.sauverMonde(profil.id, emplacement, m); P.noterForme(profil.id, apparence(e)); } };
      return garde(
        <Exploration key={`explo-${profil.id}-${emplacement}-${etat.naissance}-${etat.nom}-${retourCombat ? retourCombat.rencontre.sauvage.id : 'depart'}`}
          etat={etat} monde={monde} zone={zone} historique={historique} bilan={bilan} reglages={profil.reglages} retourCombat={retourCombat}
          personnage={P.chargerPersonnage(profil, emplacement)} catalogue={catalogue}
          sauver={sauver}
          surLieu={(z, h) => setEcran((x) => (x.nom === 'exploration' ? { ...x, zone: z, historique: h, retourCombat: x.retourCombat } : x))}
          surCombat={(e, m, rencontre) => setEcran({ nom: 'combat', emplacement, etat: e, ...preparerCombatExploration(rencontre), exploration: { monde: m, zone: rencontre.zone, historique: ecran.historique, bilan, rencontre } })}
          surRanch={(e, m) => { sauver(e, m); setEcran({ nom: 'ranch', emplacement, etat: e }); }}
          surVillage={(e, m) => { sauver(e, m); setEcran({ nom: 'monde', emplacement, etat: e, monde: m, lieu: 'foret' }); }}
          surReglages={(r) => { P.modifierProfil(profil.id, { reglages: r }); rafraichir(); }} surMenu={menu}
          surMort={(e) => setEcran({ nom: 'mort', emplacement, etat: e })} />
      );
    }
    case 'monde': {
      const { emplacement, etat, monde, lieu } = ecran;
      const sauver = (e: Etat, m: Monde) => { if (emplacement !== ESSAI) { P.sauverPartie(profil.id, emplacement, e); P.sauverMonde(profil.id, emplacement, m); P.noterForme(profil.id, apparence(e)); } };
      return garde(
        <EcranMonde key={`monde-${profil.id}-${emplacement}-${etat.naissance}-${etat.nom}`} etat={etat} monde={monde} lieu={lieu}
          personnage={P.chargerPersonnage(profil, emplacement)} catalogue={catalogue} reglages={profil.reglages}
          sauver={sauver}
          surRanch={(e, m) => { sauver(e, m); setEcran({ nom: 'ranch', emplacement, etat: e }); }}
          surExploration={(e, m) => { sauver(e, m); setEcran({ nom: 'exploration', emplacement, etat: e, monde: m, zone: DEPART, historique: [], bilan: bilanDepart(e, m) }); }}
          surReglages={(r) => { P.modifierProfil(profil.id, { reglages: r }); rafraichir(); }} surMenu={menu}
          surMort={(e) => { sauver(e, monde); setEcran({ nom: 'mort', emplacement, etat: e }); }} />
      );
    }
    case 'combat': {
      const { emplacement, etat, adversaire, registre, terrain, entrainement, exploration } = ecran;
      return garde(
        <EcranCombat key={`combat-${etat.naissance}-${adversaire.description.nom}`} echo={etat} allie={descriptionDepuisEtat(etat)} adversaire={adversaire}
          registre={registre} terrain={terrain} musique={musique}
          surFin={(issue) => {
            appliquerCombat(etat, issue, adversaire, entrainement);
            // exploration : une victoire rend les trouvailles dispersées
            const plein = exploration && issue.resultat === 'victoire' && !etat.mort ? reprendreTrouvailles(etat, exploration.rencontre) : false;
            if (emplacement !== ESSAI) { P.sauverPartie(profil.id, emplacement, etat); P.noterForme(profil.id, apparence(etat)); }
            if (exploration && emplacement !== ESSAI) P.sauverMonde(profil.id, emplacement, exploration.monde);
            if (etat.mort) setEcran({ nom: 'mort', emplacement, etat });
            else if (exploration) {
              const { rencontre, ...sortie } = exploration;
              setEcran({ nom: 'exploration', emplacement, etat, ...sortie, retourCombat: { rencontre, resultat: issue.resultat, plein } });
            } else setEcran({ nom: 'ranch', emplacement, etat });
          }} />
      );
    }
    case 'scene': {
      const s = SCENES.find((x) => x.id === ecran.id);
      const scene = s ? analyserScene(s.source, s.id).scene : null;
      if (!scene) break;
      const derniere = P.dernierePartie(profil.id);
      const echo = derniere?.etat;
      const perso = derniere ? P.chargerPersonnage(profil, derniere.emplacement) : P.personnageDeRepli(profil);
      return garde(
        <div style={{ position: 'fixed', inset: 0 }}>
          <SceneDialogue scene={scene} catalogue={catalogue} sons={sons} musique={musique}
            echo={{ nom: echo?.nom ?? 'Filo', chemin: echo ? apparence(echo) : 'echos/enfant/wrath.png' }}
            joueur={portrait(perso)}
            variables={{ 'joueur.nom': perso.nom, 'joueur.pronom': perso.pronom, 'echo.genre': echo?.genre ?? 'm', 'graine.nom': 'graine tellurique' }}
            surFin={({ suite }) => setEcran(suite && SCENES.some((x) => x.id === suite) ? { nom: 'scene', id: suite } : { nom: 'menu' })} />
        </div>
      );
    }
    default: break;
  }

  const parties = P.parties(profil.id);
  return (
    <MenuPrincipal profil={profil} profils={profils} parties={parties} derniere={P.dernierePartie(profil.id)} disponibles={DISPONIBLES}
      surContinuer={() => { const d = P.dernierePartie(profil.id); if (d) lancer(d.emplacement, d.etat); }}
      surCharger={(i) => { const e = P.chargerPartie(profil.id, i); if (e) lancer(i, e); }}
      surNouvellePartie={(i, avecIntro) => setEcran(avecIntro ? { nom: 'introduction', emplacement: i } : { nom: 'personnage', emplacement: i })}
      surEffacerPartie={(i) => { P.effacerPartie(profil.id, i); rafraichir(); }}
      surChoisirProfil={(id) => { P.choisirProfil(id); rafraichir(); }}
      surNouveauProfil={() => setEcran({ nom: 'intro', premier: false })}
      surSupprimerProfil={(id) => { P.supprimerProfil(id); rafraichir(); if (!P.profilActif()) setEcran({ nom: 'intro', premier: true }); }}
      surModifierProfil={(m) => { P.modifierProfil(profil.id, m); rafraichir(); }}
      outilsDev={import.meta.env.DEV ? (
        <>
          <div style={{ fontFamily: "'Alegreya SC',serif", letterSpacing: 2, color: '#bfe6ff', fontSize: 13, marginBottom: 8 }}>Développement</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SCENES.filter((s) => s.id !== ID_SCENE_SANCTUAIRE).map((s) => (
              <button key={s.id} className="bouton-saint discret" style={{ fontSize: 13, padding: '7px 14px' }} onClick={() => setEcran({ nom: 'scene', id: s.id })}>
                Scène « {analyserScene(s.source, s.id).scene.titre || s.id} »
              </button>
            ))}
            <button className="bouton-saint discret" style={{ fontSize: 13, padding: '7px 14px' }}
              onClick={() => { const d = P.dernierePartie(profil.id); const e = d?.etat && !d.etat.mort ? d.etat : nouvellePartie('wrath'); setEcran({ nom: 'mort', emplacement: ESSAI, etat: { ...e, mort: e.mort ?? 'vieillesse' } }); }}>
              Essai : le dernier souffle
            </button>
            <a className="bouton-saint discret" style={{ fontSize: 13, padding: '7px 14px', textDecoration: 'none' }} href="/atelier.html">Ouvrir l’atelier</a>
          </div>
        </>
      ) : undefined} />
  );
}

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <Racine />
  </StrictMode>
);
