// Point d'entrée du jeu. La refonte avance par étapes : pour l'instant, une page d'attente
// qui mène à l'atelier (en développement) et au prototype d'origine.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import catalogue from '@contenu/generes/assets.json';
import '@/styles/polices';
import '../atelier/atelier.css';

function Accueil() {
  const affiche = (catalogue as { assets: { chemin: string; url: string }[] }).assets.find((a) => a.chemin === 'decors/menu/affiche.png');
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#1b100a', color: 'var(--papier)' }}>
      {affiche && <img src={affiche.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />}
      <div style={{ position: 'relative', textAlign: 'center', padding: 24 }}>
        <div style={{ fontFamily: 'var(--titre)', fontSize: 'clamp(34px, 7vw, 64px)', letterSpacing: '.04em' }}>Soul Seed</div>
        <div className="manuscrit" style={{ color: 'var(--laiton-clair)', fontSize: 30 }}>refonte en cours</div>
        {import.meta.env.DEV && (
          <p style={{ marginTop: 26 }}>
            <a className="bouton" href="/atelier.html" style={{ textDecoration: 'none', color: 'var(--encre)' }}>Ouvrir l'atelier</a>
          </p>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <Accueil />
  </StrictMode>
);
