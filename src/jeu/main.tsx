// Point d'entrée du jeu et parcours d'une partie :
//   profil (premier lancement) → menu principal →
//   avec l'introduction : entre deux mondes → arrivée au Sanctuaire (graine, éclosion, nom) → ranch ;
//   sans l'introduction : création du personnage → choix de la Soul Seed → ranch.
//   Au ranch, quand l'écho s'éteint : le dernier souffle → choix de la Soul Seed (après la disparition) → ranch.
import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import donnees from '@contenu/generes/assets.json';
import type { Catalogue } from '@/contenu/types';
import { SCENES } from '@/contenu/scenes';
import { analyserScene } from '@/moteur/scene/analyseur';
import { apparence, type Etat } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { SceneDialogue } from './scene/SceneDialogue';
import { Ranch } from './ranch/Ranch';
import { nouvellePartie } from './ranch/sauvegarde';
import { MenuPrincipal } from './menu/MenuPrincipal';
import { Introduction } from './menu/Introduction';
import { ChoixGraine } from './graines/ChoixGraine';
import { DernierSouffle } from './mort/DernierSouffle';
import { EntreDeuxMondes } from './intro/EntreDeuxMondes';
import { ID_SCENE_SANCTUAIRE, Sanctuaire } from './intro/Sanctuaire';
import * as P from './profils';
import '@/styles/polices';
import './base.css';

const catalogue = donnees as unknown as Catalogue;
const DISPONIBLES = new Set(catalogue.assets.map((a) => a.chemin));
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
  | { nom: 'scene'; id: string };

/** Portrait du personnage : son avatar s'il est déjà dessiné, sinon le portrait de repli. */
function portrait(p: P.Personnage): string | undefined {
  const chemin = P.cheminAvatar(p.avatar);
  if (DISPONIBLES.has(chemin)) return chemin;
  const repli = P.AVATARS.find((a) => a.id === p.avatar)?.repli;
  return repli && DISPONIBLES.has(repli) ? repli : undefined;
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
      <Introduction disponibles={DISPONIBLES}
        surAnnuler={premier ? undefined : () => setEcran({ nom: 'menu' })}
        surFin={(nom, avatar, pronom) => { P.creerProfil(nom, avatar, pronom); rafraichir(); setEcran({ nom: 'menu' }); }} />
    );
  }

  const { musique, sons } = profil.reglages;
  SFX.on = sons;
  const menu = () => { rafraichir(); setEcran({ nom: 'menu' }); };
  const lancer = (emplacement: number, etat: Etat) => {
    if (emplacement === ESSAI) { menu(); return; }
    P.marquerDernierePartie(profil.id, emplacement);
    // un écho éteint : une nouvelle graine attend le joueur
    if (etat.mort) setEcran({ nom: 'graines', emplacement, personnage: P.chargerPersonnage(profil, emplacement), contexte: 'apres' });
    else setEcran({ nom: 'ranch', emplacement, etat });
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

  switch (ecran.nom) {
    case 'personnage':
      return (
        <Introduction mode="personnage" disponibles={DISPONIBLES} initial={{ nom: profil.nom, pronom: profil.pronom, avatar: profil.avatar }}
          surAnnuler={() => setEcran({ nom: 'menu' })}
          surFin={(nom, avatar, pronom) => setEcran({ nom: 'graines', emplacement: ecran.emplacement, personnage: { nom, avatar, pronom }, contexte: 'nouvelle' })} />
      );
    case 'introduction':
      return (
        <EntreDeuxMondes musique={musique}
          surFin={({ personnage, graine }) => setEcran({ nom: 'sanctuaire', emplacement: ecran.emplacement, personnage, echo: nouvellePartie(graine) })} />
      );
    case 'sanctuaire':
      return (
        <Sanctuaire personnage={ecran.personnage} echo={ecran.echo} catalogue={catalogue} portrait={portrait(ecran.personnage)} sons={sons} musique={musique}
          surFin={(etat) => accueillir(ecran.emplacement, ecran.personnage, etat)} />
      );
    case 'graines':
      return (
        <ChoixGraine key={`${ecran.emplacement}-${ecran.contexte}`} contexte={ecran.contexte} musique={musique}
          creer={(graine) => nouvellePartie(graine)}
          surRetour={ecran.contexte === 'nouvelle' ? () => setEcran({ nom: 'menu' }) : undefined}
          surFin={(etat) => accueillir(ecran.emplacement, ecran.personnage, etat)} />
      );
    case 'mort':
      return (
        <DernierSouffle echo={ecran.etat} joueur={ecran.emplacement === ESSAI ? profil.nom : P.chargerPersonnage(profil, ecran.emplacement).nom} musique={musique}
          surFin={() => setEcran({ nom: 'graines', emplacement: ecran.emplacement, personnage: ecran.emplacement === ESSAI ? P.chargerPersonnage(profil, 0) : P.chargerPersonnage(profil, ecran.emplacement), contexte: 'apres' })} />
      );
    case 'ranch': {
      const { emplacement } = ecran;
      return (
        <Ranch key={`${profil.id}-${emplacement}-${ecran.etat.naissance}-${ecran.etat.graine}-${ecran.etat.nom}`} etat={ecran.etat}
          reglages={profil.reglages}
          surReglages={(r) => P.modifierProfil(profil.id, { reglages: r })}
          sauver={(e) => { P.sauverPartie(profil.id, emplacement, e); P.noterForme(profil.id, apparence(e)); }}
          surMort={(e) => setEcran({ nom: 'mort', emplacement, etat: e })}
          surQuitter={menu} />
      );
    }
    case 'scene': {
      const s = SCENES.find((x) => x.id === ecran.id);
      const scene = s ? analyserScene(s.source, s.id).scene : null;
      if (!scene) break;
      const derniere = P.dernierePartie(profil.id);
      const echo = derniere?.etat;
      const perso = derniere ? P.chargerPersonnage(profil, derniere.emplacement) : { nom: profil.nom, pronom: profil.pronom, avatar: profil.avatar };
      return (
        <div style={{ position: 'fixed', inset: 0 }}>
          <SceneDialogue scene={scene} catalogue={catalogue} sons={sons} musique={musique}
            echo={{ nom: echo?.nom ?? 'Filo', chemin: echo ? apparence(echo) : 'echos/enfant/wrath.png' }}
            joueur={portrait(perso)}
            variables={{ 'joueur.nom': perso.nom, 'joueur.pronom': perso.pronom, 'echo.genre': echo?.genre ?? 'm', 'graine.nom': 'graine tellurique' }}
            surFin={({ suite }) => setTimeout(() => setEcran(suite && SCENES.some((x) => x.id === suite) ? { nom: 'scene', id: suite } : { nom: 'menu' }), 1800)} />
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
    <Jeu />
  </StrictMode>
);
