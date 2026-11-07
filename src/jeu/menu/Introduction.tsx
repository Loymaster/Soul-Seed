// Faire connaissance.
// — NouveauProfil : la personne qui joue ne donne qu'un nom de profil (le profil porte les réglages et la
//   mémoire des échos, partagée par toutes ses parties) ;
// — Introduction : le personnage d'une partie lancée sans l'introduction (image, pronom, nom). Avec l'introduction,
//   c'est l'homme mystérieux qui pose ces questions (src/jeu/intro/EntreDeuxMondes.tsx).
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

const Poussiere = () => (
  <>
    {[12, 26, 41, 57, 70, 84].map((x, k) => (
      <span key={k} className="poussiere" style={{ left: `${x}%`, width: 3 + (k % 2), height: 3 + (k % 2), background: k % 2 ? '#fff3c4' : '#e8f6ff', boxShadow: `0 0 10px ${k % 2 ? '#ffd27a' : '#a8dcff'}`, animationDelay: `${-k * 1.4}s`, ['--dx' as string]: `${(k % 3 - 1) * 14}px` }} />
    ))}
  </>
);

/** Création d'un profil : un nom, rien d'autre. */
export function NouveauProfil({ surFin, surAnnuler }: {
  surFin: (nom: string) => void;
  /** Absent au tout premier lancement : on ne peut pas jouer sans profil. */
  surAnnuler?: () => void;
}) {
  const [nom, setNom] = useState('');
  const nomPropre = nom.trim();
  const survol = () => SFX.holyHover();
  return (
    <div className="intro">
      <Poussiere />
      <div className="intro-carte">
        <div className="intro-voix">Avant que tout commence</div>
        <form onSubmit={(ev) => { ev.preventDefault(); if (!nomPropre) return; SFX.holyClick(); surFin(nomPropre); }}>
          <div className="intro-question">Quel nom donner à ce profil ?</div>
          <div className="intro-aide">Le profil garde vos réglages et la mémoire des échos. Chaque partie aura son propre personnage.</div>
          <input className="intro-champ" value={nom} onChange={(e) => setNom(e.target.value.slice(0, 18))} placeholder="Nom du profil" autoFocus aria-label="Nom du profil" />
          <div className="intro-actions">
            {surAnnuler && <button type="button" className="bouton-saint discret" onMouseEnter={survol} onClick={surAnnuler}>Annuler</button>}
            <button type="submit" className="bouton-saint" onMouseEnter={survol} disabled={!nomPropre}>Créer le profil</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Création du personnage d'une partie lancée sans l'introduction : image, pronom, nom. */
export function Introduction({ disponibles, surFin, surAnnuler, initial }: {
  disponibles: Set<string>;
  surFin: (nom: string, avatar: IdAvatar, pronom: Pronom) => void;
  surAnnuler?: () => void;
  initial?: { nom?: string; avatar?: IdAvatar; pronom?: Pronom };
}) {
  const ordre: Etape[] = ['avatar', 'pronom', 'nom'];
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
    : surAnnuler && <button type="button" className="bouton-saint discret" onMouseEnter={survol} onClick={surAnnuler}>Menu</button>;
  const valider = <button type={etape === 'nom' ? 'submit' : 'button'} className="bouton-saint" onMouseEnter={survol} disabled={!pret} onClick={etape === 'nom' ? undefined : suivant}>{derniere ? 'C’est moi' : 'Continuer'}</button>;

  return (
    <div className="intro">
      <Poussiere />
      <div className="intro-carte" key={etape}>
        <div className="intro-etapes" aria-hidden="true">{ordre.map((_, k) => <i key={k} className={k <= i ? 'fait' : ''} />)}</div>
        <div className="intro-voix">Votre personnage</div>

        {etape === 'nom' && (
          <form onSubmit={(ev) => { ev.preventDefault(); suivant(); }}>
            <div className="intro-question">Comment s’appelle votre personnage ?</div>
            <div className="intro-aide">C’est ainsi que l’on vous appellera, au ranch comme au village.</div>
            <input className="intro-champ" value={nom} onChange={(e) => setNom(e.target.value.slice(0, 18))} placeholder="Son nom" autoFocus aria-label="Nom" />
            <div className="intro-actions">{retour}{valider}</div>
          </form>
        )}

        {etape === 'avatar' && (
          <>
            <div className="intro-question">Qui incarnez-vous ?</div>
            <div className="intro-aide">Votre personnage dans le monde des Échos.</div>
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
