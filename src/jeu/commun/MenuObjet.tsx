// Les boutons du petit menu d'un objet du sac (le même au ranch et dans la sacoche hors du ranch) :
// Infos / Utiliser, et en dessous « jeter… », qui demande confirmation sur place (un seul exemplaire, ou toute la pile
// quand il y en a plusieurs). Les objets de quête ne se jettent pas. Posé dans `.sac-menu` (portée .r7, ranch.css).
import { useState } from 'react';
import { jetable } from '@/moteur/simulation/objets';
import './sac.css';

export interface ProprietesMenuObjet {
  id: string;
  qte: number;
  info: boolean;
  surInfos: () => void;
  surUtiliser: () => void;
  /** Jette `n` exemplaires (Infinity : toute la pile). */
  surJeter: (n: number) => void;
  /** Petit bruit de papier (clic). */
  son?: (nom: string) => void;
}

export function BoutonsObjet({ id, qte, info, surInfos, surUtiliser, surJeter, son }: ProprietesMenuObjet) {
  const [confirmer, setConfirmer] = useState(false);
  if (confirmer) {
    return (
      <div className="sm-jeter-conf">
        <div className="sm-jeter-q">{qte > 1 ? 'En jeter combien ?' : 'Le jeter ?'}</div>
        <div className="sm-boutons">
          {qte > 1 ? (<>
            <button className="sm-btn" role="menuitem" onClick={() => surJeter(1)}>Un</button>
            <button className="sm-btn sm-rouge" role="menuitem" onClick={() => surJeter(Infinity)}>Tous</button>
          </>) : (
            <button className="sm-btn sm-rouge" role="menuitem" onClick={() => surJeter(1)}>Jeter</button>
          )}
          <button className="sm-btn" role="menuitem" onClick={() => { son?.('paperTick'); setConfirmer(false); }}>Garder</button>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="sm-boutons">
        <button className="sm-btn" role="menuitem" onClick={surInfos} aria-pressed={info}>Infos</button>
        <button className="sm-btn sm-ok" role="menuitem" onClick={surUtiliser}>Utiliser</button>
      </div>
      {jetable(id) ? (
        <button className="sm-jeter" role="menuitem" onClick={() => { son?.('paperTick'); setConfirmer(true); }}>jeter…</button>
      ) : (
        <div className="sm-quete">objet de quête, on le garde</div>
      )}
    </>
  );
}
