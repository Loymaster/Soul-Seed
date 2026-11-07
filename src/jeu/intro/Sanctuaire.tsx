// Introduction, seconde partie : l'arrivée au Sanctuaire. La scène est écrite dans
// contenu/scenes/intro-sanctuaire.scene ; le jeu y met en scène la graine, l'éclosion et le nom de l'écho.
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Catalogue } from '@/contenu/types';
import { SCENES } from '@/contenu/scenes';
import { analyserScene } from '@/moteur/scene/analyseur';
import type { Valeur } from '@/moteur/scene/types';
import { apparence, type Etat } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { SceneDialogue } from '../scene/SceneDialogue';
import { Embleme, capitaliser, ficheGraine, imageGraine, proposerNom } from '../graines/donnees';
import type { Personnage } from '../profils';
import './sanctuaire.css';

export const ID_SCENE_SANCTUAIRE = 'intro-sanctuaire';
const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;

export interface ProprietesSanctuaire {
  personnage: Personnage;
  /** l'écho à naître (graine, genre et lignée déjà tirés) ; son nom est donné pendant la scène */
  echo: Etat;
  catalogue: Catalogue;
  /** portrait du personnage (carte qui apparaît au moment de répondre) */
  portrait?: string;
  sons?: boolean;
  musique?: boolean;
  surFin: (echo: Etat) => void;
}

export function Sanctuaire({ personnage, echo, catalogue, portrait, sons, musique, surFin }: ProprietesSanctuaire) {
  const scene = useMemo(() => {
    const s = SCENES.find((x) => x.id === ID_SCENE_SANCTUAIRE);
    return s ? analyserScene(s.source, s.id).scene : null;
  }, []);
  const g = ficheGraine(echo.graine);
  const variables = useMemo<Record<string, Valeur>>(() => ({
    'joueur.nom': personnage.nom, 'joueur.pronom': personnage.pronom, 'echo.genre': echo.genre, 'graine.nom': g.nom.toLowerCase(),
  }), [personnage, echo.genre, g.nom]);

  const [relique, setRelique] = useState('');
  const [bebe, setBebe] = useState(false);
  const [flash, setFlash] = useState(false);
  const [nommer, setNommer] = useState(false);
  const [saisie, setSaisie] = useState('');
  const [nomEcho, setNomEcho] = useState('');
  const reprendre = useRef<((v?: Record<string, Valeur>) => void) | null>(null);

  const surAction = (nom: string, _argument: string | undefined, suite: (v?: Record<string, Valeur>) => void) => {
    if (nom === 'graine') { SFX.pose(); setRelique('on'); suite(); return; }
    if (nom === 'eclosion') {
      SFX.eveil(); setRelique('on tremble');
      setTimeout(() => { SFX.ouverture(); setFlash(true); }, 2200);
      setTimeout(() => { setBebe(true); setRelique('on'); }, 2650);
      setTimeout(() => SFX.cri(), 3300);
      setTimeout(() => setFlash(false), 4100);
      setTimeout(() => suite(), 4300);
      return;
    }
    if (nom === 'nommer-echo') { reprendre.current = suite; setSaisie(''); setNommer(true); return; }
    suite();
  };
  const valider = () => {
    const n = capitaliser(saisie); if (!n || !reprendre.current) return;
    SFX.reveal(); setNomEcho(n); setNommer(false);
    const r = reprendre.current; reprendre.current = null;
    setTimeout(() => r({ 'echo.nom': n }), 500);
  };

  if (!scene) return null;
  const v = (o: Record<string, string | number>) => o as CSSProperties;
  const calque = (
    <>
      <div className={`sa-relique ${relique}`} style={v({ '--c': g.couleur })}>
        <span className="aura" />
        <Embleme graine={echo.graine} className="sa-sceau" />
        {!bebe && <img className="graine" src={asset(imageGraine(echo.graine))} alt={g.nom} draggable={false} />}
        {bebe && <img className="bebe" src={asset(apparence(echo))} alt="Votre écho" draggable={false} />}
      </div>
      {flash && <div className="sa-flash" />}
      {nommer && (
        <form className="sa-nommer" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); valider(); }}>
          <div className="question">Comment l'appeler ? <span>({echo.genre === 'f' ? 'une femelle' : 'un mâle'})</span></div>
          <div className="ligne">
            <input className="champ" value={saisie} onChange={(e) => setSaisie(e.target.value.slice(0, 14))} placeholder="son nom" maxLength={14} aria-label="Nom de votre écho" autoFocus />
            <button type="button" className="de" onClick={() => { SFX.pop(); setSaisie(proposerNom(echo.genre, saisie)); }} aria-label="Proposer un nom" title="Proposer un nom">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z" /><path d="M12 12l8.5-4.7M12 12v9.5M12 12L3.5 7.3" /><circle cx="12" cy="7" r=".9" fill="currentColor" /><circle cx="7.5" cy="13" r=".9" fill="currentColor" /><circle cx="16.5" cy="13" r=".9" fill="currentColor" /></svg>
            </button>
            <button type="submit" className="cuir" disabled={!saisie.trim()}>C'est décidé</button>
          </div>
        </form>
      )}
      <div className="sa-reveil" />
    </>
  );

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <SceneDialogue scene={scene} catalogue={catalogue} variables={variables} sons={sons} musique={musique}
        echo={nomEcho ? { nom: nomEcho, chemin: apparence(echo) } : null} joueur={portrait}
        surAction={surAction} calque={calque}
        surFin={() => setTimeout(() => surFin({ ...echo, nom: nomEcho || echo.nom }), 200)} />
    </div>
  );
}
