// Onglet « Techniques » de la fiche de l'écho (hors maquette, posé dans l'emplacement `ficheTechniques` de la vue) :
// ses trois emplacements de combat, les techniques apprises (on touche pour la prendre ou la laisser), celles qui
// restent à découvrir en silhouette, et une piste en mots. Jamais de chiffre sur l'écho.
import type { Etat } from '@/moteur/simulation';
import { lireTechniquesFiche, type TechniqueFiche } from './fiche';
import './techniques.css';

const icone = (t: TechniqueFiche) => `${import.meta.env.BASE_URL}assets/interface/techniques/${t.categorie}.png`;

export interface ProprietesTechniques {
  etat: Etat;
  /** Prendre ou laisser une technique (Simulation.choisirTechnique) ; le parent sauve et rafraîchit. */
  surChoisir: (nom: string) => void;
  /** Survol d'une technique (petit bruit de papier). */
  surSurvol?: () => void;
}

export function TechniquesEcho({ etat, surChoisir, surSurvol }: ProprietesTechniques) {
  const f = lireTechniquesFiche(etat);
  const il = etat.genre === 'f' ? 'elle' : 'il';
  return (
    <div className="ftq">
      <div className="fe-intro">{f.bebe ? 'Les techniques viendront avec l’âge.' : `${il === 'il' ? 'Il' : 'Elle'} en emporte trois au combat : touchez-en une pour la prendre ou la laisser.`}</div>
      {!f.bebe && (
        <div className="ftq-emplacements" aria-label="Emportées au combat">
          {f.emplacements.map((t, i) => t ? (
            <button key={t.nom} className="ftq-place pleine" title={`${t.nom} — la laisser`} onClick={() => surChoisir(t.nom)} onMouseEnter={surSurvol}>
              <span className="ftq-rond"><img src={icone(t)} alt="" /></span><span className="ftq-place-nom">{t.nom}</span>
            </button>
          ) : (
            <span key={`libre-${i}`} className="ftq-place libre"><span className="ftq-rond" /><span className="ftq-place-nom">libre</span></span>
          ))}
        </div>
      )}
      <div className="ftq-liste">
        {f.connues.map((t) => {
          const off = !t.equipee && (t.horsAffinites || f.plein);
          return (
            <button key={t.nom} className={`ftq-tech ${t.equipee ? 'on' : ''} ${t.horsAffinites ? 'hors' : ''} ${off ? 'off' : ''}`}
              aria-pressed={t.equipee} onClick={() => surChoisir(t.nom)} onMouseEnter={surSurvol} title={t.description}>
              <span className="ftq-vign"><img src={icone(t)} alt="" /></span>
              <span className="ftq-corps">
                <span className="ftq-nom">{t.nom}<em>{t.famille}</em></span>
                <span className="ftq-desc">{t.description}</span>
              </span>
              <span className="ftq-marque">{t.equipee ? 'emportée' : t.horsAffinites ? 'hors de ses affinités' : ''}</span>
            </button>
          );
        })}
        {Array.from({ length: f.aDecouvrir }, (_, i) => (
          <div key={`?${i}`} className="ftq-tech silhouette" aria-label="Technique encore à découvrir">
            <span className="ftq-vign">?</span>
            <span className="ftq-corps"><span className="ftq-nom">???</span><span className="ftq-desc">encore à découvrir…</span></span>
          </div>
        ))}
        {!f.bebe && !f.connues.length && !f.aDecouvrir && <div className="ftq-vide">Aucune technique pour l’instant.</div>}
      </div>
      <div className="ftq-mot">{f.mot}</div>
    </div>
  );
}
