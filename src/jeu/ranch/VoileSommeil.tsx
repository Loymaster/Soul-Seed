// L'écho dort : l'écran s'assombrit le temps d'une berceuse (environ 4 secondes), avec le temps dormi.
import './fenetres.css';

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
