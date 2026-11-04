// Le sac en bandoulière : il s'ouvre au milieu de l'écran, 10 emplacements.
import { useState } from 'react';
import { descriptionObjet, type Etat } from '@/moteur/simulation';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;

export function Sac({ etat, papier, surFermer, surUtiliser, son }: {
  etat: Etat;
  papier: string;
  surFermer: () => void;
  surUtiliser: (index: number) => void;
  son: (nom: 'paperTick' | 'leather') => void;
}) {
  const [survol, setSurvol] = useState(-1);
  const [ferme, setFerme] = useState(false);
  const fermer = (ensuite?: () => void) => {
    if (ferme) return;
    son('leather');
    setFerme(true);
    window.setTimeout(() => { surFermer(); ensuite?.(); }, 780);
  };
  const info = (() => {
    const c = etat.inventaire[survol];
    const d = c && descriptionObjet(c.id);
    return d ? `${d.nom} — ${d.description}` : '10 emplacements · cliquer un objet pour l’utiliser';
  })();
  return (
    <>
      <button className={`voile ${ferme ? 'part' : ''}`} onClick={() => fermer()} aria-label="Fermer le sac" />
      <section className={`sacoche ${ferme ? 'ferme' : ''}`} aria-label="Sac" style={{ filter: papier }}>
        <svg width="620" height="140" viewBox="0 0 620 140" aria-hidden="true" style={{ position: 'absolute', left: 0, top: -60 }}>
          <path d="M60 140 C40 20 580 20 560 140" fill="none" stroke="#3a1f0e" strokeWidth="22" strokeLinecap="round" />
          <path d="M60 140 C40 20 580 20 560 140" fill="none" stroke="#8a5530" strokeWidth="16" strokeLinecap="round" />
          <path d="M60 140 C40 20 580 20 560 140" fill="none" stroke="rgba(240,214,170,.5)" strokeWidth="1.6" strokeDasharray="5 4" />
        </svg>
        <div className="sac-corps">
          <div className="stitch" style={{ borderRadius: '18px 18px 54px 54px' }} />
          <div className="sac-poche">
            {etat.inventaire.map((c, i) => {
              const d = c && descriptionObjet(c.id);
              return (
                <button key={i} className={`r-case ${c ? '' : 'libre'}`} style={{ animationDelay: `${(0.55 + i * 0.03).toFixed(2)}s` }} disabled={!c}
                  aria-label={d ? d.nom : 'emplacement vide'}
                  onMouseEnter={() => { if (c && survol !== i) { son('paperTick'); setSurvol(i); } else if (!c) setSurvol(-1); }}
                  onClick={() => { if (c) fermer(() => surUtiliser(i)); }}>
                  {c && d && <><img src={asset(d.icone)} alt="" /><span className="sceau qte" style={{ background: '#6e3f22' }}>{c.qte}</span></>}
                </button>
              );
            })}
          </div>
          <div style={{ position: 'absolute', left: 40, right: 40, bottom: 26, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: "'Reenie Beanie',cursive", fontSize: 27, lineHeight: 1, color: '#f6ecd6' }}>{info}</div>
        </div>
        <div className="sac-rabat">
          <div className="face" style={{ borderRadius: '22px 22px 34px 34px', background: '#7d4a28', boxShadow: 'inset 0 0 0 2px #3a1f0e,inset 0 0 0 8px #7d4a28,inset 0 0 26px rgba(30,14,4,.45),0 10px 22px rgba(10,6,2,.45)' }}>
            <div className="stitch" style={{ borderRadius: '16px 16px 28px 28px' }} />
            <div style={{ position: 'absolute', left: '50%', bottom: -14, width: 46, height: 56, marginLeft: -23, borderRadius: 6, background: '#c9a050', boxShadow: 'inset 0 0 0 2.5px #3a2410,0 4px 8px rgba(0,0,0,.35)' }}><div style={{ position: 'absolute', left: 17, top: 16, width: 12, height: 22, borderRadius: 3, background: '#3a2410' }} /></div>
          </div>
          <div className="face dos" style={{ borderRadius: '22px 22px 34px 34px', background: '#4a2814', boxShadow: 'inset 0 0 0 2px #3a1f0e' }} />
        </div>
        <button onClick={() => fermer()} aria-label="Fermer le sac" style={{ position: 'absolute', right: -16, top: 40, width: 46, height: 46, border: 'none', borderRadius: '50%', background: 'rgba(244,234,214,.94)', color: '#3a1f0e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(0,0,0,.4)', zIndex: 3 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </section>
    </>
  );
}
