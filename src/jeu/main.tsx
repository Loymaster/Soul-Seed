// Point d'entrée du jeu : introduction (création du profil) → menu principal → ranch.
import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import donnees from '@contenu/generes/assets.json';
import type { Catalogue } from '@/contenu/types';
import { SCENES } from '@/contenu/scenes';
import { analyserScene } from '@/moteur/scene/analyseur';
import { apparence, type Etat } from '@/moteur/simulation';
import { SceneDialogue } from './scene/SceneDialogue';
import { Ranch } from './ranch/Ranch';
import { nouvellePartie } from './ranch/sauvegarde';
import { MenuPrincipal } from './menu/MenuPrincipal';
import { Introduction } from './menu/Introduction';
import * as P from './profils';
import '@/styles/polices';
import './base.css';

const catalogue = donnees as unknown as Catalogue;
const DISPONIBLES = new Set(catalogue.assets.map((a) => a.chemin));

type Ecran =
  | { nom: 'intro'; premier: boolean }
  | { nom: 'menu' }
  | { nom: 'ranch'; emplacement: number; etat: Etat }
  | { nom: 'scene'; id: string };

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

  if (ecran.nom === 'ranch') {
    const { emplacement } = ecran;
    return (
      <Ranch key={`${profil.id}-${emplacement}-${ecran.etat.naissance}-${ecran.etat.graine}`} etat={ecran.etat}
        reglages={profil.reglages}
        surReglages={(r) => P.modifierProfil(profil.id, { reglages: r })}
        sauver={(e) => { P.sauverPartie(profil.id, emplacement, e); P.noterForme(profil.id, apparence(e)); }}
        surQuitter={() => { rafraichir(); setEcran({ nom: 'menu' }); }} />
    );
  }

  if (ecran.nom === 'scene') {
    const s = SCENES.find((x) => x.id === ecran.id);
    const scene = s ? analyserScene(s.source, s.id).scene : null;
    if (scene) {
      const echo = P.dernierePartie(profil.id)?.etat;
      return (
        <div style={{ position: 'fixed', inset: 0 }}>
          <SceneDialogue scene={scene} catalogue={catalogue}
            echo={{ nom: echo?.nom ?? 'Filo', chemin: echo ? apparence(echo) : 'echos/enfant/wrath.png' }}
            joueur={DISPONIBLES.has(P.cheminAvatar(profil.avatar)) ? P.cheminAvatar(profil.avatar) : undefined}
            variables={{ 'joueur.nom': profil.nom, 'joueur.pronom': profil.pronom, 'echo.genre': echo?.genre ?? 'm' }}
            surFin={({ suite }) => setTimeout(() => setEcran(suite && SCENES.some((x) => x.id === suite) ? { nom: 'scene', id: suite } : { nom: 'menu' }), 1800)} />
        </div>
      );
    }
  }

  const lancer = (emplacement: number, etat: Etat) => {
    P.marquerDernierePartie(profil.id, emplacement);
    setEcran({ nom: 'ranch', emplacement, etat });
  };
  const parties = P.parties(profil.id);
  return (
    <MenuPrincipal profil={profil} profils={profils} parties={parties} derniere={P.dernierePartie(profil.id)} disponibles={DISPONIBLES}
      surContinuer={() => { const d = P.dernierePartie(profil.id); if (d) lancer(d.emplacement, d.etat); }}
      surCharger={(i) => { const e = P.chargerPartie(profil.id, i); if (e) lancer(i, e); }}
      surNouvellePartie={(i) => {
        // En attendant le nouvel écran de sélection de la Soul Seed : graine tirée au hasard.
        const e = nouvellePartie();
        P.sauverPartie(profil.id, i, e);
        lancer(i, e);
      }}
      surEffacerPartie={(i) => { P.effacerPartie(profil.id, i); rafraichir(); }}
      surChoisirProfil={(id) => { P.choisirProfil(id); rafraichir(); }}
      surNouveauProfil={() => setEcran({ nom: 'intro', premier: false })}
      surSupprimerProfil={(id) => { P.supprimerProfil(id); rafraichir(); if (!P.profilActif()) setEcran({ nom: 'intro', premier: true }); }}
      surModifierProfil={(m) => { P.modifierProfil(profil.id, m); rafraichir(); }}
      outilsDev={import.meta.env.DEV ? (
        <>
          <div style={{ fontFamily: "'Alegreya SC',serif", letterSpacing: 2, color: '#bfe6ff', fontSize: 13, marginBottom: 8 }}>Développement</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SCENES.map((s) => (
              <button key={s.id} className="bouton-saint discret" style={{ fontSize: 13, padding: '7px 14px' }} onClick={() => setEcran({ nom: 'scene', id: s.id })}>
                Scène « {analyserScene(s.source, s.id).scene.titre || s.id} »
              </button>
            ))}
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
