// Introduction : on fait connaissance avec la personne qui joue (nom, avatar, pronom). Crée un profil.
import { useState } from 'react';
import { SFX } from '@/moteur/sfx';
import { AVATARS, PRONOMS, type IdAvatar, type Pronom } from '../profils';
import { Avatar } from './Avatar';

const APERCU: Record<Pronom, (nom: string) => string> = {
  il: (n) => `« Tu connais ${n} ? Il est arrivé au ranch hier. »`,
  elle: (n) => `« Tu connais ${n} ? Elle est arrivée au ranch hier. »`,
  iel: (n) => `« Tu connais ${n} ? Iel est arrivé·e au ranch hier. »`,
};

export function Introduction({ disponibles, surFin, surAnnuler }: {
  disponibles: Set<string>;
  surFin: (nom: string, avatar: IdAvatar, pronom: Pronom) => void;
  /** Absent au tout premier lancement : on ne peut pas jouer sans profil. */
  surAnnuler?: () => void;
}) {
  const [etape, setEtape] = useState(0);
  const [nom, setNom] = useState('');
  const [avatar, setAvatar] = useState<IdAvatar | null>(null);
  const [pronom, setPronom] = useState<Pronom | null>(null);
  const survol = () => SFX.holyHover();
  const suivant = () => { SFX.holyClick(); setEtape((e) => e + 1); };
  const nomPropre = nom.trim();

  return (
    <div className="intro">
      {[12, 26, 41, 57, 70, 84].map((x, i) => (
        <span key={i} className="poussiere" style={{ left: `${x}%`, width: 3 + (i % 2), height: 3 + (i % 2), background: i % 2 ? '#fff3c4' : '#e8f6ff', boxShadow: `0 0 10px ${i % 2 ? '#ffd27a' : '#a8dcff'}`, animationDelay: `${-i * 1.4}s`, ['--dx' as string]: `${(i % 3 - 1) * 14}px` }} />
      ))}
      <div className="intro-carte" key={etape}>
        <div className="intro-etapes" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i <= etape ? 'fait' : ''} />)}</div>
        <div className="intro-voix">Avant que tout commence</div>

        {etape === 0 && (
          <form onSubmit={(ev) => { ev.preventDefault(); if (nomPropre) suivant(); }}>
            <div className="intro-question">Comment vous appelez-vous ?</div>
            <div className="intro-aide">C’est ainsi que l’on vous appellera, au ranch comme au village.</div>
            <input className="intro-champ" value={nom} onChange={(e) => setNom(e.target.value.slice(0, 18))} placeholder="Votre nom" autoFocus aria-label="Votre nom" />
            <div className="intro-actions">
              {surAnnuler && <button type="button" className="bouton-saint discret" onMouseEnter={survol} onClick={surAnnuler}>Annuler</button>}
              <button type="submit" className="bouton-saint" onMouseEnter={survol} disabled={!nomPropre}>Continuer</button>
            </div>
          </form>
        )}

        {etape === 1 && (
          <>
            <div className="intro-question">À quoi ressemblez-vous ?</div>
            <div className="intro-aide">Vous pourrez en changer plus tard.</div>
            <div className="avatars" role="radiogroup" aria-label="Avatar">
              {AVATARS.map((a) => (
                <button key={a.id} role="radio" aria-checked={avatar === a.id} className={`avatar-choix ${avatar === a.id ? 'choisi' : ''}`}
                  onMouseEnter={survol} onClick={() => { SFX.holyHover(); setAvatar(a.id); }}>
                  <span className="halo" />
                  <Avatar id={a.id} taille={112} disponibles={disponibles} />
                  <span>{a.nom}</span>
                </button>
              ))}
            </div>
            <div className="intro-actions">
              <button className="bouton-saint discret" onMouseEnter={survol} onClick={() => setEtape(0)}>Retour</button>
              <button className="bouton-saint" onMouseEnter={survol} disabled={!avatar} onClick={suivant}>Continuer</button>
            </div>
          </>
        )}

        {etape === 2 && (
          <>
            <div className="intro-question">Comment parler de vous ?</div>
            <div className="intro-aide">Le pronom qu’utiliseront les habitants lorsqu’ils parleront de vous.</div>
            <div className="pronoms" role="radiogroup" aria-label="Pronom">
              {PRONOMS.map((p) => (
                <button key={p.id} role="radio" aria-checked={pronom === p.id} className={`pronom ${pronom === p.id ? 'choisi' : ''}`}
                  onMouseEnter={survol} onClick={() => { SFX.holyHover(); setPronom(p.id); }}>
                  <b>{p.nom}</b>
                </button>
              ))}
            </div>
            <div className="apercu-pronom">{pronom ? APERCU[pronom](nomPropre) : ''}</div>
            <div className="intro-actions">
              <button className="bouton-saint discret" onMouseEnter={survol} onClick={() => setEtape(1)}>Retour</button>
              <button className="bouton-saint" onMouseEnter={survol} disabled={!pronom} onClick={() => { SFX.holyClick(); surFin(nomPropre, avatar!, pronom!); }}>C’est moi</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
