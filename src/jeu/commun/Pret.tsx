// N'affiche un écran qu'une fois ses images prêtes (chargées et décodées) : ses animations et ses fondus
// démarrent sur un décor complet, sans apparition tardive. Si tout est déjà là, l'écran s'affiche sans délai ;
// sinon un fond sombre (et, passé un court instant, une lueur discrète) le remplace, au plus `delai` ms.
import { useEffect, useState, type ReactNode } from 'react';
import { epingler, estPret, precharger } from './prechargement';

type Chemins = readonly (string | null | undefined)[];

/** `chemins` : ce que l'écran montre d'emblée (attendu) ; `ensuite` : ce dont il aura bientôt besoin (chargé juste après, sans attendre). */
export function Pret({ chemins, ensuite = [], delai = 6000, children }: { chemins: Chemins; ensuite?: Chemins; delai?: number; children: ReactNode }) {
  const [pret, setPret] = useState(() => estPret(chemins));
  const [lent, setLent] = useState(false);
  const cle = chemins.filter(Boolean).join('|');
  useEffect(() => {
    epingler(chemins);
    const suite = () => { if (ensuite.length) precharger(ensuite, { urgent: true }); };
    // une fois l'écran affiché, un changement de liste ne le masque plus : on précharge simplement
    if (pret) { precharger(chemins, { urgent: true }).then(suite); return; }
    let vivant = true;
    const t = setTimeout(() => vivant && setLent(true), 250);
    precharger(chemins, { urgent: true, delai }).then(() => { if (vivant) setPret(true); suite(); });
    return () => { vivant = false; clearTimeout(t); };
  }, [cle]); // eslint-disable-line react-hooks/exhaustive-deps
  if (pret) return <>{children}</>;
  return (
    <div className="pret-attente" aria-busy="true" aria-label="Chargement">
      {lent && <span className="pret-lueur" />}
    </div>
  );
}

/** Écran de démarrage : le socle d'images se charge derrière une barre de progression. */
export function Demarrage({ fait, total }: { fait: number; total: number }) {
  const k = total ? fait / total : 0;
  return (
    <div className="pret-attente demarrage" aria-busy="true">
      <div className="demarrage-titre">Soul Seed</div>
      <div className="demarrage-barre"><span style={{ width: `${Math.round(k * 100)}%` }} /></div>
      <div className="demarrage-texte">Les souvenirs se rassemblent…</div>
    </div>
  );
}
