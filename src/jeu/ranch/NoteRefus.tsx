// L'écho refuse un plat : une petite feuille près de lui propose deux mots (insister, respecter son refus).
// Plus de bouton « gronder » : la réponse n'est proposée qu'à ce moment-là (Simulation.repondreRefus).
import type { ReponseRefus } from '@/moteur/simulation';
import './fenetres.css';

export interface RefusEnCours { texte: string; reponses: { cle: ReponseRefus; libelle: string }[]; x: number; y: number }

export function NoteRefus({ r, surChoix }: { r: RefusEnCours; surChoix: (cle: ReponseRefus) => void }) {
  // la feuille se pose à côté de l'écho, sans sortir du repère 1280 × 800
  const gauche = Math.min(1280 - 320, Math.max(20, r.x - 30));
  const haut = Math.min(800 - 230, Math.max(20, r.y - 70));
  return (
    <div className="rf-refus" style={{ left: gauche, top: haut }} role="dialog" aria-label="Refus de manger">
      <div className="rf-refus-texte">{r.texte}</div>
      <div className="rf-refus-choix">
        {r.reponses.map((x) => (
          <button key={x.cle} className="rf-refus-bouton" onClick={() => surChoix(x.cle)}>{x.libelle}</button>
        ))}
      </div>
    </div>
  );
}
