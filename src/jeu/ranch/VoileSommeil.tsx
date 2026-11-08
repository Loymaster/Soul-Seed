// L'écho dort : l'écran s'assombrit le temps d'une berceuse (environ 4 secondes), avec le temps dormi.
import { useEffect, useState } from 'react';
import { ageJours, suspendreTemps, type AnnonceEffondrement } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { Repere } from '../commun/Repere';
import { taireMusiques } from '../commun/volumes';
import './fenetres.css';
import './evolution.css';

export interface Sommeil {
  id: number;
  nom: string;
  heures: number;
  effondrement: boolean;
  /** Heure et jour au réveil (« 06:00 », « jour 3 »). */
  reveil: string;
  jour: string;
  feminin: boolean;
  /** Le voile se lève. */
  part?: boolean;
}

const ETOILES = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 137.5) % 1280, y: (i * 89.3) % 520, t: 1.6 + ((i * 7) % 10) / 6, d: -((i * 3) % 10) / 4, s: 2 + (i % 3),
}));

export function VoileSommeil({ s }: { s: Sommeil }) {
  const e = s.feminin ? 'e' : '';
  return (
    <div className={`rf-sommeil${s.part ? ' part' : ''}`} role="status" aria-live="polite">
      {ETOILES.map((x, i) => <i key={i} className="rf-etoile" style={{ left: x.x, top: x.y, width: x.s, height: x.s, animationDuration: `${x.t}s`, animationDelay: `${x.d}s` }} />)}
      <div className="rf-lune" />
      <div className="rf-zz" aria-hidden="true"><b>z</b><b>z</b><b>Z</b></div>
      <div className="rf-sommeil-texte">
        <div className="rf-s1">{s.effondrement ? `${s.nom} s’est écroulé${e} de fatigue…` : `${s.nom} s’est endormi${e}…`}</div>
        <div className="rf-s2">{s.heures} heure{s.heures > 1 ? 's' : ''} de sommeil</div>
        <div className="rf-s3">réveil à {s.reveil} · {s.jour}</div>
      </div>
    </div>
  );
}

/**
 * Le voile du sommeil par-dessus n'importe quel écran (village, exploration, scène…) quand l'écho s'écroule de fatigue
 * hors du ranch : même voile, même berceuse ; le temps et les musiques s'arrêtent le temps du voile (environ 5 s).
 */
export function VoileSommeilPartout({ annonce, sons, surFin }: { annonce: AnnonceEffondrement; sons: boolean; surFin: () => void }) {
  const e = annonce.etat;
  const [part, setPart] = useState(false);
  useEffect(() => {
    const reprendre = suspendreTemps();
    const rendreMusiques = taireMusiques();
    if (sons) { try { SFX.berceuseLongue(); } catch { /* pas de son */ } }
    const a = window.setTimeout(() => setPart(true), 4400);
    const b = window.setTimeout(() => surFin(), 5300);
    return () => { clearTimeout(a); clearTimeout(b); reprendre(); rendreMusiques(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pad = (n: number) => (n < 10 ? '0' : '') + n;
  const s: Sommeil = {
    id: 0, nom: e.nom, heures: annonce.heures, effondrement: true, feminin: e.genre === 'f', part,
    reveil: `${pad(Math.floor(e.minute / 60) % 24)}:${pad(e.minute % 60)}`, jour: `jour ${ageJours(e)}`,
  };
  return (
    <div className="evo-partout">
      <Repere fond="transparent"><VoileSommeil s={s} /></Repere>
    </div>
  );
}
