// Faire connaissance : nom, avatar, pronom.
// — mode « profil » : la personne qui joue (crée un profil) ;
// — mode « personnage » : le personnage d'une partie lancée sans l'introduction (personnage, pronom, nom).
import { useState } from 'react';
import { SFX } from '@/moteur/sfx';
import { AVATARS, PRONOMS, type IdAvatar, type Pronom } from '../profils';
import { Avatar } from './Avatar';

const APERCU: Record<Pronom, (nom: string) => string> = {
  il: (n) => `« Tu connais ${n || 'ce nouveau venu'} ? Il est arrivé au ranch hier. »`,
  elle: (n) => `« Tu connais ${n || 'cette nouvelle venue'} ? Elle est arrivée au ranch hier. »`,
  iel: (n) => `« Tu connais ${n || 'ce nouveau visage'} ? Iel est arrivé·e au ranch hier. »`,
};
type Etape = 'nom' | 'avatar' | 'pronom';

export function Introduction({ disponibles, surFin, surAnnuler, mode = 'profil', initial }: {
  disponibles: Set<string>;
  surFin: (nom: string, avatar: IdAvatar, pronom: Pronom) => void;
  /** Absent au tout premier lancement : on ne peut pas jouer sans profil. */
  surAnnuler?: () => void;
  mode?: 'profil' | 'personnage';
  initial?: { nom?: string; avatar?: IdAvatar; pronom?: Pronom };
}) {
  const ordre: Etape[] = mode === 'personnage' ? ['avatar', 'pronom', 'nom'] : ['nom', 'avatar', 'pronom'];
  const [i, setI] = useState(0);
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [avatar, setAvatar] = useState<IdAvatar | null>(initial?.avatar ?? null);
  const [pronom, setPronom] = useState<Pronom | null>(initial?.pronom ?? null);
  const survol = () => SFX.holyHover();
  const nomPropre = nom.trim();
  const etape = ordre[i];
  const derniere = i === ordre.length - 1;
  const pret = etape === 'nom' ? !!nomPropre : etape === 'avatar' ? !!avatar : !!pronom;
  const suivant = () => {
    if (!pret) return;
    SFX.holyClick();
    if (derniere) surFin(nomPropre, avatar!, pronom!); else setI(i + 1);
  };
  const retour = i > 0
    ? <button type="button" className="bouton-saint discret" onMouseEnter={survol} onClick={() => setI(i - 1)}>Retour</button>
    : surAnnuler && <button type="button" className="bouton-saint discret" onMouseEnter={survol} onClick={surAnnuler}>{mode === 'personnage' ? 'Menu' : 'Annuler'}</button>;
  const valider = <button type={etape === 'nom' ? 'submit' : 'button'} className="bouton-saint" onMouseEnter={survol} disabled={!pret} onClick={etape === 'nom' ? undefined : suivant}>{derniere ? 'C’est moi' : 'Continuer'}</button>;

  return (
    <div className="intro">
      {[12, 26, 41, 57, 70, 84].map((x, k) => (
        <span key={k} className="poussiere" style={{ left: `${x}%`, width: 3 + (k % 2), height: 3 + (k % 2), background: k % 2 ? '#fff3c4' : '#e8f6ff', boxShadow: `0 0 10px ${k % 2 ? '#ffd27a' : '#a8dcff'}`, animationDelay: `${-k * 1.4}s`, ['--dx' as string]: `${(k % 3 - 1) * 14}px` }} />
      ))}
      <div className="intro-carte" key={etape}>
        <div className="intro-etapes" aria-hidden="true">{ordre.map((_, k) => <i key={k} className={k <= i ? 'fait' : ''} />)}</div>
        <div className="intro-voix">{mode === 'personnage' ? 'Votre personnage' : 'Avant que tout commence'}</div>

        {etape === 'nom' && (
          <form onSubmit={(ev) => { ev.preventDefault(); suivant(); }}>
            <div className="intro-question">{mode === 'personnage' ? 'Comment s’appelle votre personnage ?' : 'Comment vous appelez-vous ?'}</div>
            <div className="intro-aide">C’est ainsi que l’on vous appellera, au ranch comme au village.</div>
            <input className="intro-champ" value={nom} onChange={(e) => setNom(e.target.value.slice(0, 18))} placeholder={mode === 'personnage' ? 'Son nom' : 'Votre nom'} autoFocus aria-label="Nom" />
            <div className="intro-actions">{retour}{valider}</div>
          </form>
        )}

        {etape === 'avatar' && (
          <>
            <div className="intro-question">{mode === 'personnage' ? 'Qui incarnez-vous ?' : 'À quoi ressemblez-vous ?'}</div>
            <div className="intro-aide">{mode === 'personnage' ? 'Votre personnage dans le monde des Échos.' : 'Vous pourrez en changer plus tard.'}</div>
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
            <div className="intro-actions">{retour}{valider}</div>
          </>
        )}

        {etape === 'pronom' && (
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
            <div className="intro-actions">{retour}{valider}</div>
          </>
        )}
      </div>
    </div>
  );
}
