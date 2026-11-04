// Point d'entrée du jeu. La refonte avance par étapes : pour l'instant, une page d'accueil
// qui permet de jouer les scènes de dialogue écrites dans contenu/scenes.
import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import donnees from '@contenu/generes/assets.json';
import type { Catalogue } from '@/contenu/types';
import { SCENES } from '@/contenu/scenes';
import { analyserScene } from '@/moteur/scene/analyseur';
import { SceneDialogue } from './scene/SceneDialogue';
import { Ranch } from './ranch/Ranch';
import { charger, effacer, nouvellePartie } from './ranch/sauvegarde';
import type { Etat } from '@/moteur/simulation';
import '@/styles/polices';
import '../atelier/atelier.css';

const catalogue = donnees as unknown as Catalogue;
const ECHO_DEMO = { nom: 'Filo', chemin: 'echos/enfant/wrath.png' };

function Jeu() {
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [partie, setPartie] = useState<Etat | null>(null);
  const [sauvegarde, setSauvegarde] = useState(() => charger());
  const scene = useMemo(() => {
    const s = SCENES.find((x) => x.id === sceneId);
    return s ? analyserScene(s.source, s.id).scene : null;
  }, [sceneId]);
  const variables = useMemo(() => ({}), [sceneId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (partie) {
    return <Ranch key={partie.nom + partie.naissance + partie.graine} etat={partie} surQuitter={() => { setPartie(null); setSauvegarde(charger()); }} />;
  }

  if (scene) {
    return (
      <div style={{ position: 'fixed', inset: 0 }}>
        <SceneDialogue scene={scene} catalogue={catalogue} echo={ECHO_DEMO} variables={variables}
          surFin={({ suite }) => setTimeout(() => setSceneId(suite && SCENES.some((s) => s.id === suite) ? suite : null), 1800)} />
      </div>
    );
  }

  const affiche = catalogue.assets.find((a) => a.chemin === 'decors/menu/affiche.png');
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#1b100a', color: 'var(--papier)' }}>
      {affiche && <img src={affiche.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />}
      <div style={{ position: 'relative', textAlign: 'center', padding: 24 }}>
        <div style={{ fontFamily: 'var(--titre)', fontSize: 'clamp(34px, 7vw, 64px)', letterSpacing: '.04em' }}>Soul Seed</div>
        <div className="manuscrit" style={{ color: 'var(--laiton-clair)', fontSize: 30 }}>refonte en cours</div>
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          {sauvegarde && !sauvegarde.mort && <button className="bouton" onClick={() => setPartie(charger())}>Retourner au ranch ({sauvegarde.nom}, jour {sauvegarde.jour})</button>}
          <button className="bouton" onClick={() => { effacer(); setPartie(nouvellePartie()); }}>Nouvelle partie au ranch</button>
          {SCENES.map((s) => (
            <button key={s.id} className="bouton" onClick={() => setSceneId(s.id)}>
              Jouer « {analyserScene(s.source, s.id).scene.titre || s.id} »
            </button>
          ))}
          {import.meta.env.DEV && <a className="bouton discret" href="/atelier.html" style={{ color: 'var(--papier)', textDecoration: 'none' }}>Ouvrir l'atelier</a>}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <Jeu />
  </StrictMode>
);
