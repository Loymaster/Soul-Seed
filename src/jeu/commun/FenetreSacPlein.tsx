// La fenêtre « Le sac est plein » : montée une fois pour toutes dans main.tsx, elle s'ouvre par-dessus n'importe quel
// écran quand un objet reçu (reception.ts) ne trouve pas sa place. L'objet reçu en haut, le sac en dessous :
// on choisit une pile à jeter (elle part en entier : c'est ce qui libère un emplacement), ou on laisse l'objet.
import { useEffect, useState } from 'react';
import { descriptionObjet, jetable } from '@/moteur/simulation/objets';
import { SFX } from '@/moteur/sfx';
import { Repere } from './Repere';
import { repondre, useDemandePlace } from './reception';
import './sac.css';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
function son(nom: string, ...a: unknown[]) {
  const f = (SFX as unknown as Record<string, unknown>)[nom];
  if (typeof f === 'function') try { (f as (...x: unknown[]) => void).apply(SFX, a); } catch { /* sons indisponibles */ }
}

export function FenetreSacPlein() {
  const d = useDemandePlace();
  const [choisi, setChoisi] = useState<number | null>(null);
  useEffect(() => { setChoisi(null); if (d) son('sacoche', true); }, [d]);
  if (!d) return null;
  const recu = descriptionObjet(d.id);
  const nomRecu = recu?.nom ?? d.id;
  const cChoisi = choisi !== null ? d.etat.inventaire[choisi] : null;
  const dChoisi = cChoisi ? descriptionObjet(cChoisi.id) : null;
  const confirmer = () => {
    if (choisi === null) return;
    if (repondre(choisi)) son('pop'); else son('refus');
  };
  const laisser = () => { son('leather'); repondre(null); };
  const texte = d.texte ?? (d.mode === 'recevoir'
    ? 'Jetez une pile du sac pour lui faire de la place, ou laissez-le ici.'
    : 'Jetez une pile du sac pour lui faire de la place, ou renoncez.');
  return (
    <div className="fsp-hote">
      <Repere fond="transparent">
        <div className="fsp-voile" />
        <section className="fsp-livre" role="dialog" aria-modal="true" aria-label="Le sac est plein">
          <div className="fsp-couv" />
          <div className="fsp-page">
            <div className="fsp-surtitre">VOTRE SAC</div>
            <div className="fsp-titre">Le sac est plein</div>
            <div className="fsp-recu">
              <div className="fsp-case" aria-hidden="true">
                {recu ? <img src={asset(recu.icone)} alt="" /> : null}
                {d.qte > 1 ? <span className="fsp-qte">{d.qte}</span> : null}
              </div>
              <div>
                <div className="fsp-craie">{d.mode === 'recevoir' ? 'à ranger :' : 'pour avoir :'}</div>
                <div className="fsp-nom">{nomRecu}</div>
                <div className="fsp-texte">{texte}</div>
              </div>
            </div>
            <div className="fsp-poche" role="listbox" aria-label="Contenu du sac">
              {d.etat.inventaire.map((c, i) => {
                const o = c && descriptionObjet(c.id);
                if (!c || !o) return <div key={i} className="fsp-case" style={{ background: 'transparent', boxShadow: 'inset 0 0 0 2px rgba(240,214,170,.28)', cursor: 'default' }} />;
                const garde = !jetable(c.id);
                return (
                  <button key={i} className={`fsp-case${choisi === i ? ' choisi' : ''}`} disabled={garde} role="option" aria-selected={choisi === i}
                    title={garde ? `${o.nom} : objet de quête, on le garde` : o.nom} aria-label={o.nom}
                    onMouseEnter={() => son('paperTick')}
                    onClick={() => { son('paperTick'); setChoisi((x) => (x === i ? null : i)); }}>
                    <img src={asset(o.icone)} alt="" />
                    <span className="fsp-qte">{c.qte}</span>
                  </button>
                );
              })}
            </div>
            <div className={`fsp-choix${dChoisi ? '' : ' vide'}`}>
              {dChoisi && cChoisi
                ? `Jeter ${cChoisi.qte > 1 ? `les ${cChoisi.qte} « ${dChoisi.nom} »` : `« ${dChoisi.nom} »`} pour ranger ${nomRecu.toLowerCase()}.`
                : 'Choisissez ce que vous jetteriez…'}
            </div>
            <div className="fsp-boutons">
              <button className="fsp-btn" onClick={laisser}>{d.laisser ?? `Laisser ${nomRecu.toLowerCase()}`}</button>
              <button className="fsp-btn rouge" disabled={choisi === null} onClick={confirmer}>{d.mode === 'recevoir' ? 'Jeter et ranger' : 'Jeter'}</button>
            </div>
          </div>
        </section>
      </Repere>
    </div>
  );
}
