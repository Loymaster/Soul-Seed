// « Laisser le temps passer » : une page de carnet demande combien de temps attendre (1 à 24 h, réglette de cuir).
import { useState } from 'react';
import './fenetres.css';

const pad = (n: number) => (n < 10 ? '0' : '') + n;

export interface ProprietesFenetreTemps {
  /** Minute du jour (0–1439) et jour de jeu au moment d'ouvrir la fenêtre. */
  minute: number;
  nomEcho: string;
  /** Filtre de nuit de l'interface (url(#rk7Ui)). */
  filtre: string;
  son: (nom: string, ...a: unknown[]) => void;
  surValider: (heures: number) => void;
  surAnnuler: () => void;
}

export function FenetreTemps({ minute, nomEcho, filtre, son, surValider, surAnnuler }: ProprietesFenetreTemps) {
  const [heures, setHeures] = useState(1);
  const [part, setPart] = useState(false);
  const arrivee = minute + heures * 60;
  const jours = Math.floor(arrivee / 1440);
  const h = Math.floor(arrivee / 60) % 24;
  const quand = jours === 0 ? 'aujourd’hui' : jours === 1 ? 'demain' : `dans ${jours} jours`;
  const moment = h < 5 || h >= 22 ? 'en pleine nuit' : h < 11 ? 'dans la matinée' : h < 14 ? 'vers midi' : h < 18 ? 'dans l’après-midi' : 'dans la soirée';
  const fermer = (f: () => void) => { if (part) return; setPart(true); window.setTimeout(f, 380); };
  const changer = (n: number) => { if (n !== heures) son('paperTick'); setHeures(n); };
  return (
    <div className={`rf-temps${part ? ' part' : ''}`} onClick={() => { son('page', 0.6); fermer(surAnnuler); }}>
      <div className="rf-page" style={{ filter: filtre }} onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label="Laisser le temps passer">
        <span className="rf-couture" />
        <svg className="rf-sablier" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#6e3f22" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9" />
          <path className="rf-sable" d="M10 18.5h4l-2-2.2z" fill="#c9a050" stroke="none" />
        </svg>
        <div className="rf-titre">Laisser le temps passer</div>
        <div className="rf-duree"><b>{heures}</b> heure{heures > 1 ? 's' : ''}</div>
        <div className="rf-arrivee">jusqu’à {pad(h)}:{pad(arrivee % 60)}, {quand} {moment}</div>
        <label className="rf-reglette">
          <span className="rf-sr">Durée de l’attente</span>
          <input type="range" min={1} max={24} step={1} value={heures} style={{ ['--p' as string]: `${((heures - 1) / 23) * 100}%` }}
            onChange={(ev) => changer(Number(ev.target.value))} />
          <span className="rf-graduations" aria-hidden="true">{[1, 6, 12, 18, 24].map((n) => <i key={n} style={{ left: `${((n - 1) / 23) * 100}%` }}>{n} h</i>)}</span>
        </label>
        <div className="rf-note">{nomEcho} s’ennuiera un peu pendant ce temps.</div>
        <div className="rf-boutons">
          <button className="rf-annuler" onClick={() => { son('page', 0.6); fermer(surAnnuler); }}>Annuler</button>
          <button className="rf-attendre" onClick={() => { son('stamp'); fermer(() => surValider(heures)); }}>Attendre</button>
        </div>
      </div>
    </div>
  );
}
