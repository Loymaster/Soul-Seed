// « Panser les blessures » : la même page de carnet que « laisser le temps passer » (FenetreTemps.tsx, fenetres.css),
// une réglette en demi-heures, au plus la tranche de PV perdus (moteur/simulation/soins.ts). Jamais de chiffre de PV :
// l'état de ses plaies et ce qu'elles seront, en mots.
import { useState } from 'react';
import { demiHeuresPansement, dureeDemiHeures, type Etat } from '@/moteur/simulation';
import './fenetres.css';
import './panser.css';

const pad = (n: number) => (n < 10 ? '0' : '') + n;

/** Icône au trait (24 × 24) : un pansement en biais. */
export const ICONE_PANSER = 'M4.6 14.8l10.2-10.2a3.2 3.2 0 0 1 4.6 4.6L9.2 19.4a3.2 3.2 0 0 1-4.6-4.6zM9.5 9.5l5 5M11 12h.01M13 12h.01M12 11h.01M12 13h.01';

/** L'action dans les Soins du ranch : grisée s'il n'y a rien à panser, sinon la durée maximale. */
export function detailPanser(e: Pick<Etat, 'pvCombat' | 'caracs'>): { off: boolean; detail: string } {
  const max = demiHeuresPansement(e);
  return max ? { off: false, detail: `jusqu’à ${dureeDemiHeures(max)}` } : { off: true, detail: 'aucune plaie' };
}

export interface ProprietesFenetrePansement {
  /** Minute du jour (0–1439) au moment d'ouvrir la fenêtre. */
  minute: number;
  nomEcho: string;
  /** L'état de ses plaies, en mots (etatPlaies). */
  etat: string;
  /** Nombre maximum de demi-heures (demiHeuresPansement). */
  max: number;
  /** Ce que seront ses plaies après n demi-heures (plaiesApres). */
  apres: (demiHeures: number) => string;
  filtre: string;
  son: (nom: string, ...a: unknown[]) => void;
  surValider: (demiHeures: number) => void;
  surAnnuler: () => void;
}

export function FenetrePansement({ minute, nomEcho, etat, max, apres, filtre, son, surValider, surAnnuler }: ProprietesFenetrePansement) {
  const [n, setN] = useState(max);
  const [part, setPart] = useState(false);
  const arrivee = minute + n * 30;
  const h = Math.floor(arrivee / 60) % 24;
  const lendemain = arrivee >= 1440;
  const fermer = (f: () => void) => { if (part) return; setPart(true); window.setTimeout(f, 380); };
  const changer = (v: number) => { if (v !== n) son('paperTick'); setN(v); };
  const pos = (v: number) => (max > 1 ? ((v - 1) / (max - 1)) * 100 : 100);
  // graduations : chaque heure pleine, et la première demi-heure
  const graduations = Array.from({ length: max }, (_, i) => i + 1).filter((v) => v === 1 || v % 2 === 0 || v === max);
  return (
    <div className={`rf-temps rf-panser${part ? ' part' : ''}`} onClick={() => { son('page', 0.6); fermer(surAnnuler); }}>
      <div className="rf-page" style={{ filter: filtre }} onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label="Panser les blessures">
        <span className="rf-couture" />
        <svg className="rf-sablier rf-bandage" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#6e3f22" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={ICONE_PANSER} />
        </svg>
        <div className="rf-titre">Panser les blessures</div>
        <div className="rf-etat">{etat}</div>
        <div className="rf-duree"><b>{dureeDemiHeures(n)}</b></div>
        <div className="rf-arrivee">jusqu’à {pad(h)}:{pad(arrivee % 60)}{lendemain ? ', demain' : ''} : {apres(n)}</div>
        {max > 1 ? (
          <label className="rf-reglette">
            <span className="rf-sr">Temps passé à panser</span>
            <input type="range" min={1} max={max} step={1} value={n} style={{ ['--p' as string]: `${pos(n)}%` }}
              onChange={(ev) => changer(Number(ev.target.value))} />
            <span className="rf-graduations" aria-hidden="true">{graduations.map((v) => <i key={v} style={{ left: `${pos(v)}%` }}>{dureeDemiHeures(v)}</i>)}</span>
          </label>
        ) : <div className="rf-reglette-vide" />}
        <div className="rf-note">{nomEcho} se laissera faire, bien au calme.</div>
        <div className="rf-boutons">
          <button className="rf-annuler" onClick={() => { son('page', 0.6); fermer(surAnnuler); }}>Annuler</button>
          <button className="rf-attendre" onClick={() => { son('stamp'); fermer(() => surValider(n)); }}>Panser</button>
        </div>
      </div>
    </div>
  );
}
