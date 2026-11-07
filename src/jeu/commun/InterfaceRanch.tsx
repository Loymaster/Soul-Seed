// L'interface du ranch, reprise telle quelle hors du ranch (village, boutique, sanctuaire, atelier, exploration) :
// l'encart horaire (planche suspendue : jour, heure, pièces), le sac en bandoulière et sa sacoche (10 emplacements,
// déplaçables, Infos / Utiliser, ressources), le poteau indicateur « partir », et le petit carnet (sous le sac) qui
// ouvre une version simplifiée du carnet d'éleveur (l'écho en quelques signes, les options, le retour au menu).
// Mêmes balises et mêmes classes que la vue générée du ranch (src/jeu/ranch/VueRanch.tsx, ranch.css, portée .r7) :
// on ne touche pas aux fichiers du ranch, on les réutilise.
import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { NOM_STADE, ageJours, aliment, descriptionObjet, lireSignes, objetDivers, type Etat } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { lumiere } from '../ranch/ciel';
import { saison } from '../ranch/lumiere';
import { fixerVolumes } from './volumes';
import { VOLUME_BRUITAGES_DEFAUT, VOLUME_MUSIQUE_DEFAUT, type Reglages } from '../profils';
import '../ranch/ranch.css';
import './interface.css';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
/** Le filtre « papier » du ranch : la nuit bleuit et assombrit l'interface (matrice de couleur de ciel.ts) ; défini par le calque. */
const FILTRE = 'var(--ic-filtre)';
const RESSOURCES = [
  { k: 'bois', nom: 'Bois' }, { k: 'pierre', nom: 'Pierre' }, { k: 'fibres', nom: 'Fibres' },
  { k: 'resine', nom: 'Résine' }, { k: 'ferraille', nom: 'Ferraille' }, { k: 'cristaux', nom: 'Cristaux' },
];

let sonsActifs = true;
function son(nom: string, ...a: unknown[]) {
  if (!sonsActifs) return;
  const f = (SFX as unknown as Record<string, unknown>)[nom];
  if (typeof f === 'function') (f as (...x: unknown[]) => void).apply(SFX, a);
}

/**
 * Le calque qui porte l'interface : couvre le repère 1280 × 800, laisse passer les clics hors de ses éléments,
 * et définit le filtre de nuit (`minute` : l'heure du jeu ; `nuit={false}` : pas de filtre, quand le reste de l'écran
 * n'en a pas). `devant` : un panneau est ouvert (sac, carnet).
 */
export function Calque({ minute, sons = true, devant = false, nuit = true, children, z = 60 }: { minute: number; sons?: boolean; devant?: boolean; nuit?: boolean; children: ReactNode; z?: number }) {
  sonsActifs = sons;
  const m = lumiere((minute % 1440) / 60);
  return (
    <div className="r7 ic-calque" style={{ zIndex: devant ? 400 : z, '--ic-filtre': nuit ? 'url(#icUi)' : 'none', '--ui': nuit ? 'url(#icUi)' : 'none' } as CSSProperties}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="icUi" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={m.matUi} /></filter>
        </defs>
      </svg>
      {children}
    </div>
  );
}

// —————————————————————————————————————— L'encart horaire

/** La planche suspendue du ranch : jour et saison, heure et moment, pièces ; `lieu` s'écrit à la craie dessous. */
export function Encart({ etat, lieu }: { etat: Etat; lieu?: string }) {
  const m = lumiere((etat.minute % 1440) / 60);
  return (
    <>
      <div className="ecriteau ic-ecriteau" style={{ filter: FILTRE }} role="group" aria-label="Jour, heure et bourse">
        <div className="planche bois">
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: '12px', letterSpacing: '2.5px' }} className="pyro">
              {`Jour ${ageJours(etat)} · ${saison(etat.jour)}`}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span className="pyro" style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1.05 }}>{m.heure}</span>
              <span className="craie" style={{ fontSize: '28px', lineHeight: 1 }}>{m.periode}</span>
            </div>
            <div className="pyro" style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '14.5px', fontWeight: 500 }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,#f6dc8a,#c9a050 60%)', boxShadow: 'inset 0 0 0 1.5px #3a2410' }} />
              {etat.or} pièce{etat.or > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <i className="corde" style={{ left: '40px', height: '40px' }} />
        <i className="corde" style={{ left: '252px', height: '40px' }} />
        <i className="clou" style={{ left: '42px', top: '36px' }} />
        <i className="clou" style={{ left: '254px', top: '36px' }} />
      </div>
      {lieu && <div className="ic-lieu" key={lieu}>{lieu}</div>}
    </>
  );
}

// —————————————————————————————————————— Les boutons du côté droit (sac, carnet, poteau)

export function BoutonSac({ top = 20, cache = false, ouvrir }: { top?: number; cache?: boolean; ouvrir: () => void }) {
  return (
    <button className={`cote-btn ${cache ? 'cache' : ''}`} style={{ filter: FILTRE, top: `${top}px` }} onClick={(ev) => { ev.stopPropagation(); ouvrir(); }} aria-label="Ouvrir le sac">
      <svg width="86" height="92" viewBox="0 0 86 92" aria-hidden="true">
        <path d="M14 44 C10 10 76 10 72 44" fill="none" stroke="#3a1f0e" strokeWidth="8" strokeLinecap="round" />
        <path d="M14 44 C10 10 76 10 72 44" fill="none" stroke="#8a5530" strokeWidth="5" strokeLinecap="round" />
        <path d="M14 44 C10 10 76 10 72 44" fill="none" stroke="rgba(240,214,170,.55)" strokeWidth="1.2" strokeDasharray="3 3" />
        <path d="M10 42h66l-4 34c-1 6-5 9-11 9H25c-6 0-10-3-11-9z" fill="#6e3f22" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M16 48h54l-3 26c-1 4-3 6-7 6H26c-4 0-6-2-7-6z" fill="none" stroke="rgba(240,214,170,.55)" strokeWidth="1.4" strokeDasharray="4 3" />
        <path d="M9 40h68v12c0 6-5 10-11 10H20c-6 0-11-4-11-10z" fill="#7d4a28" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="37" y="54" width="12" height="14" rx="2.5" fill="#c9a050" stroke="#3a2410" strokeWidth="1.8" />
        <rect x="41" y="58" width="4" height="6" rx="1" fill="#3a2410" />
      </svg>
      <span className="etiq">sac</span>
    </button>
  );
}

/** Le petit carnet de cuir (sous le sac) : il ouvre la version simplifiée du carnet d'éleveur. */
export function BoutonCarnet({ top = 122, cache = false, ouvrir }: { top?: number; cache?: boolean; ouvrir: () => void }) {
  return (
    <button className={`cote-btn ic-carnet-btn ${cache ? 'cache' : ''}`} style={{ filter: FILTRE, top: `${top}px` }} onClick={(ev) => { ev.stopPropagation(); ouvrir(); }} aria-label="Ouvrir le carnet">
      <svg width="86" height="92" viewBox="0 0 86 92" aria-hidden="true">
        <path d="M24 16h40c4 0 6 2 6 6v54c0 4-2 6-6 6H24z" fill="#efe2c4" stroke="#3a1f0e" strokeWidth="2" />
        <path d="M66 22v52M62 20v56" stroke="rgba(122,90,58,.45)" strokeWidth="1.2" />
        <path d="M17 13h44c4 0 6 2 6 6v58c0 4-2 6-6 6H17c-2 0-3-1-3-3V16c0-2 1-3 3-3z" fill="#6e3f22" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M21 18h38c3 0 4 1 4 4v52c0 3-1 4-4 4H21z" fill="none" stroke="rgba(240,214,170,.6)" strokeWidth="1.4" strokeDasharray="4 3" />
        <path d="M14 18h8v60h-8" fill="#4a2814" opacity=".55" />
        <circle cx="41" cy="44" r="11" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2" />
        <path d="M41 51c-3 0-5-2-5-5s2-4 5-4 5 1 5 4-2 5-5 5zM41 42c0-2 1-3 3-4" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2" strokeLinecap="round" />
        <path d="M52 83v8l3-2.5 3 2.5v-8" fill="#9c3b2a" stroke="#5e1a12" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M60 40h12v10H60" fill="#7d4a28" stroke="#3a1f0e" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="68" cy="45" r="2.2" fill="#c9a050" stroke="#3a2410" strokeWidth="1" />
      </svg>
      <span className="etiq">carnet</span>
    </button>
  );
}

export interface Destination { nom: string; icone: string; detail?: string; partir: () => void }

/** Le poteau indicateur « partir » et ses flèches de bois (une par destination). */
export function Poteau({ top = 224, cache = false, destinations, titre = 'où aller ?' }: { top?: number; cache?: boolean; destinations: Destination[]; titre?: string }) {
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => { if (cache) setOuvert(false); }, [cache]);
  return (
    <>
      <button className={`cote-btn poteau-btn ${cache ? 'cache' : ''} ${ouvert ? 'ouvert' : ''}`} style={{ filter: FILTRE, top: `${top}px`, height: '112px' }}
        onClick={(ev) => { ev.stopPropagation(); son('leather'); setOuvert((o) => !o); }} aria-label="Partir" aria-expanded={ouvert ? 'true' : 'false'}>
        <svg width="86" height="100" viewBox="0 0 86 100" aria-hidden="true">
          <defs>
            <linearGradient id="icBois1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c58f58" /><stop offset="1" stopColor="#97612f" /></linearGradient>
            <linearGradient id="icBois2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ad7642" /><stop offset="1" stopColor="#7f4f25" /></linearGradient>
            <linearGradient id="icPoteau" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6a4020" /><stop offset=".45" stopColor="#9c683a" /><stop offset="1" stopColor="#5e381b" /></linearGradient>
          </defs>
          <path d="M20 96c4-8 11-10 23-10s19 2 23 10z" fill="#6f8f3c" stroke="#3a1f0e" strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="39.5" y="10" width="8" height="82" rx="1.5" fill="url(#icPoteau)" stroke="#3a1f0e" strokeWidth="2" />
          <path d="M38.5 11l5-7 5 7z" fill="#5e381b" stroke="#3a1f0e" strokeWidth="1.8" strokeLinejoin="round" />
          <g className="fl1">
            <path d="M17 17h50v18H17l-11-9z" fill="url(#icBois1)" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M20 22h20M46 22h17M15 29h14M34 29h29" stroke="rgba(58,31,14,.3)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M18 34.5h48" stroke="rgba(255,222,176,.35)" strokeWidth="1" />
          </g>
          <g className="fl2">
            <path d="M20 44h51l11 9-11 9H20z" fill="url(#icBois2)" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M24 49h22M52 49h16M23 56h30M58 56h16" stroke="rgba(58,31,14,.32)" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <circle cx="43.5" cy="26" r="2.3" fill="#e6cf98" stroke="#3a2410" strokeWidth="1.1" />
          <circle cx="43.5" cy="53" r="2.3" fill="#e6cf98" stroke="#3a2410" strokeWidth="1.1" />
          <path d="M27 92c0-5-1-8-3-11M32 91c0-4 1-7 3-9M55 91c0-4-1-7-3-10M61 92c1-4 3-6 5-7" fill="none" stroke="#4c6a2a" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="etiq">partir</span>
      </button>
      {ouvert && !cache && (
        <div className="quitter" role="menu" aria-label="Partir" style={{ '--nuit': FILTRE, top: `${top - 4}px` } as CSSProperties} onClick={(ev) => ev.stopPropagation()}>
          <div className="q-titre craie">{titre}</div>
          {destinations.map((d, i) => (
            <button key={d.nom} className="fleche" role="menuitem" style={{ '--r': `${[-1.6, 1.2, -0.8, 1][i % 4]}deg`, animationDelay: `${(0.06 + i * 0.07).toFixed(2)}s` } as CSSProperties}
              onClick={() => { setOuvert(false); d.partir(); }} onMouseEnter={() => son('paperTick')}>
              <span className="fl-bois bois">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2c1507" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d.icone} /></svg>
                <span className="pyro" style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: '16px', letterSpacing: '1px' }}>{d.nom}</span>
                {d.detail && <span className="craie" style={{ marginLeft: 'auto', fontSize: '21px', lineHeight: 1, whiteSpace: 'nowrap' }}>{d.detail}</span>}
                <i className="clou" style={{ right: '6px', left: 'auto', top: '50%' }} />
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/** Icônes des destinations (mêmes tracés que le poteau du ranch). */
export const ICONES_LIEU = {
  village: 'M3 20h18M5 20v-8l7-6 7 6v8M10 20v-5h4v5',
  magasin: 'M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 2-3M10 20v-5h4v5',
  exploration: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM15.5 8.5l-2 5-5 2 2-5z',
  ranch: 'M3 11l9-7 9 7M5 10v10h14V10M9 20v-6h6v6',
  foret: 'M12 3l5 7h-3l4 6h-5v5h-2v-5H6l4-6H7z',
  sanctuaire: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8 9.5 8z',
  atelier: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
} as const;

// —————————————————————————————————————— La sacoche ouverte

export interface ProprietesSacoche {
  etat: Etat;
  /** Ressources rapportées d'exploration (monde de la partie). */
  ressources?: Partial<Record<string, number>>;
  /** La sacoche a fini de se refermer. */
  surFerme: () => void;
  /** « Utiliser » un objet utilisable : `fermer(puis)` referme la sacoche puis joue `puis` (comme au ranch). */
  surUtiliser: (index: number, fermer: (puis?: () => void) => void) => void;
  /** Après un déplacement d'objet. */
  sauver?: () => void;
  /** Fermeture demandée de l'extérieur (ex. le temps reprend la main). */
  fermerMaintenant?: boolean;
}

/** Le sac ouvert du ranch : 10 emplacements déplaçables, menu Infos / Utiliser, ressources. Monté = ouvert. */
export function Sacoche({ etat, ressources, surFerme, surUtiliser, sauver, fermerMaintenant }: ProprietesSacoche) {
  const [ferme, setFerme] = useState(false);
  const [menu, setMenu] = useState(-1);
  const [info, setInfo] = useState(false);
  const [survol, setSurvol] = useState(-1);
  const [dnd, setDnd] = useState({ de: -1, cible: -1 });
  const minuteurs = useRef<number[]>([]);
  const plus = (ms: number, f: () => void) => { minuteurs.current.push(window.setTimeout(f, ms)); };
  useEffect(() => {
    son('woosh'); plus(380, () => son('sacoche', true));
    return () => minuteurs.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const fermer = (puis?: () => void) => {
    setMenu(-1);
    if (ferme) return;
    son('sacoche', false); plus(620, () => son('woosh'));
    setFerme(true);
    plus(1080, () => surFerme());
    // la suite se joue une fois la sacoche refermée (et démontée) : ce minuteur-là ne s'annule pas avec elle
    if (puis) window.setTimeout(puis, 1120);
  };
  useEffect(() => { if (fermerMaintenant) fermer(); }, [fermerMaintenant]); // eslint-disable-line react-hooks/exhaustive-deps
  const deplacer = (de: number, vers: number) => {
    if (de < 0 || de === vers) { setDnd({ de: -1, cible: -1 }); return; }
    const inv = etat.inventaire; const x = inv[de]; inv[de] = inv[vers]; inv[vers] = x;
    sauver?.();
    son('sacPose'); setDnd({ de: -1, cible: -1 }); setSurvol(vers);
  };
  const cMenu = menu >= 0 ? etat.inventaire[menu] : null;
  const dMenu = cMenu ? descriptionObjet(cMenu.id) : null;
  const utilisable = !!cMenu && (!!aliment(cMenu.id) || !!objetDivers(cMenu.id)?.usage);
  return (
    <>
      <button className={`voile ${ferme ? 'part' : ''}`} onClick={() => fermer()} aria-label="Fermer le sac" style={{ animationDelay: `${ferme ? 0.5 : 0}s` }} />
      <section className={`sacoche ${ferme ? 'ferme' : ''}`} aria-label="Sac" style={{ filter: FILTRE }}>
        <svg width="620" height="140" viewBox="0 0 620 140" aria-hidden="true" style={{ position: 'absolute', left: 0, top: '-60px' }}>
          <path d="M60 140 C40 20 580 20 560 140" fill="none" stroke="#3a1f0e" strokeWidth="22" strokeLinecap="round" />
          <path d="M60 140 C40 20 580 20 560 140" fill="none" stroke="#8a5530" strokeWidth="16" strokeLinecap="round" />
          <path d="M60 140 C40 20 580 20 560 140" fill="none" stroke="rgba(240,214,170,.5)" strokeWidth="1.6" strokeDasharray="5 4" />
        </svg>
        <div className="sac-corps">
          <div className="stitch" style={{ borderRadius: '18px 18px 54px 54px' }} />
          <div className="sac-poche">
            {etat.inventaire.map((c, i) => {
              const d = c && descriptionObjet(c.id);
              const marque = (dnd.de === i ? ' souleve' : '') + (dnd.cible === i && dnd.de >= 0 && dnd.de !== i ? ' cible' : '');
              const plein = !!(c && d);
              return (
                <button key={i} className={`case ${plein ? '' : 'vide'}${marque}${menu === i && plein ? ' choisi' : ''}`} style={{ animationDelay: `${(0.86 + i * 0.03).toFixed(2)}s` }}
                  draggable={plein}
                  onDragStart={(ev: DragEvent<HTMLButtonElement>) => {
                    if (!plein) { ev.preventDefault(); return; }
                    ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(i));
                    const im = ev.currentTarget.querySelector('img'); if (im) ev.dataTransfer.setDragImage(im, 29, 29);
                    setDnd({ de: i, cible: -1 }); setSurvol(-1); setMenu(-1);
                  }}
                  onDragOver={(ev) => { if (dnd.de < 0) return; ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; if (dnd.cible !== i) setDnd((x) => ({ ...x, cible: i })); }}
                  onDragLeave={() => { if (dnd.cible === i) setDnd((x) => ({ ...x, cible: -1 })); }}
                  onDrop={(ev) => { ev.preventDefault(); deplacer(dnd.de, i); }}
                  onDragEnd={() => { if (dnd.de >= 0 || dnd.cible >= 0) setDnd({ de: -1, cible: -1 }); }}
                  onMouseEnter={() => { if (!plein) { setSurvol(-1); return; } if (survol !== i && dnd.de < 0) { son('paperTick'); setSurvol(i); } }}
                  onClick={() => {
                    if (!plein) { if (menu >= 0) setMenu(-1); return; }
                    son('paperTick'); setInfo(false); setMenu((m) => (m === i ? -1 : i));
                  }}
                  aria-disabled={!plein} aria-haspopup="menu" aria-label={d ? d.nom : 'emplacement vide'}>
                  {plein && d && c ? (<><img src={asset(d.icone)} alt="" /><span className="sceau qte" style={{ background: '#6e3f22' }}>{c.qte}</span></>) : null}
                </button>
              );
            })}
          </div>
          {cMenu && dMenu && !ferme ? (
            <div className="sac-menu" role="menu" style={{ left: `${Math.round(34 + 22 + (menu % 5) * 104 + 46)}px`, top: `${Math.round(30 + 26 + Math.floor(menu / 5) * 106 - 6)}px` }} onClick={(ev) => ev.stopPropagation()}>
              <div className="sm-nom">{dMenu.nom}</div>
              {info ? <div className="sm-info">{dMenu.description}</div> : null}
              <div className="sm-boutons">
                <button className="sm-btn" role="menuitem" onClick={() => { son('page', 0.5); setInfo((x) => !x); }} aria-pressed={info}>Infos</button>
                <button className="sm-btn sm-ok" role="menuitem" onClick={() => {
                  if (!utilisable) { son('refus'); return; }
                  const index = menu;
                  setMenu(-1);
                  surUtiliser(index, fermer);
                }}>Utiliser</button>
              </div>
            </div>
          ) : null}
          <div className="sac-info sac-ressources" aria-label="Ressources">
            <span className="sr-titre">ressources</span>
            {RESSOURCES.map((r) => {
              const q = ressources?.[r.k] ?? 0;
              return (
                <span key={r.k} className={`sr ${q > 0 ? '' : 'vide'}`} title={r.nom}>
                  <img src={asset(`objets/materiaux/${r.k}.png`)} alt={r.nom} />
                  <b>{q}</b>
                </span>
              );
            })}
          </div>
        </div>
        <div className="sac-rabat">
          <div className="face" style={{ borderRadius: '22px 22px 34px 34px', background: '#7d4a28', boxShadow: 'inset 0 0 0 2px #3a1f0e,inset 0 0 0 8px #7d4a28,inset 0 0 26px rgba(30,14,4,.45),0 10px 22px rgba(10,6,2,.45)' }}>
            <div className="stitch" style={{ borderRadius: '16px 16px 28px 28px' }} />
            <div style={{ position: 'absolute', left: '50%', bottom: '-14px', width: '46px', height: '56px', marginLeft: '-23px', borderRadius: '6px', background: '#c9a050', boxShadow: 'inset 0 0 0 2.5px #3a2410,0 4px 8px rgba(0,0,0,.35)' }}>
              <div style={{ position: 'absolute', left: '17px', top: '16px', width: '12px', height: '22px', borderRadius: '3px', background: '#3a2410' }} />
            </div>
          </div>
          <div className="face dos" style={{ borderRadius: '22px 22px 34px 34px', background: '#4a2814', boxShadow: 'inset 0 0 0 2px #3a1f0e' }} />
        </div>
        <button onClick={() => fermer()} aria-label="Fermer le sac" style={{ position: 'absolute', right: '-16px', top: '40px', width: '46px', height: '46px', border: 'none', borderRadius: '50%', background: 'rgba(244,234,214,.94)', color: '#3a1f0e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(0,0,0,.4)', zIndex: 3 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </section>
    </>
  );
}

// —————————————————————————————————————— Le petit carnet (version simplifiée du carnet d'éleveur)

export interface ProprietesPetitCarnet {
  etat: Etat;
  /** Image de l'écho (son apparence), si elle existe. */
  portrait?: string;
  reglages: Reglages;
  surReglages?: (r: Reglages) => void;
  /** Enregistre la partie (bouton « Sauvegarder », et avant le retour au menu). */
  sauver: () => void;
  surMenu?: () => void;
  /** Le carnet a fini de se refermer. */
  surFerme: () => void;
}

/** Deux pages : à gauche l'écho tel qu'on le perçoit (jamais de chiffre), à droite les options et la partie. */
export function PetitCarnet({ etat, portrait, reglages, surReglages, sauver, surMenu, surFerme }: ProprietesPetitCarnet) {
  const [r, setR] = useState<Required<Reglages>>({ sons: reglages.sons !== false, musique: reglages.musique !== false, volumeMusique: reglages.volumeMusique ?? VOLUME_MUSIQUE_DEFAUT, volumeBruitages: reglages.volumeBruitages ?? VOLUME_BRUITAGES_DEFAUT, defauts: reglages.defauts ?? 2 });
  const [ferme, setFerme] = useState(false);
  const [sauve, setSauve] = useState('');
  const minuteurs = useRef<number[]>([]);
  const plus = (ms: number, f: () => void) => { minuteurs.current.push(window.setTimeout(f, ms)); };
  useEffect(() => { son('bookArrive'); return () => minuteurs.current.forEach(clearTimeout); }, []);
  const changer = (modif: Partial<Reglages>) => {
    const n = { ...r, ...modif };
    setR(n);
    fixerVolumes({ musique: n.volumeMusique / 100, bruitages: n.volumeBruitages / 100 });
    SFX.on = n.sons; sonsActifs = n.sons;
    surReglages?.(n);
  };
  const fermer = () => {
    if (ferme) return;
    son('page', 0.7); plus(260, () => son('woosh'));
    setFerme(true);
    plus(520, surFerme);
  };
  const g = lireSignes(etat);
  const indices = g.besoins.filter((b) => b.urgence >= 2 || b.besoin === 'maladie' || b.besoin === 'blessure');
  const bouton: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', borderRadius: '6px', fontFamily: "'Alegreya SC',serif", fontSize: '15px', letterSpacing: '1px', cursor: 'pointer' };
  return (
    <>
      <button className={`voile ${ferme ? 'part' : ''}`} onClick={fermer} aria-label="Fermer le carnet" style={{ animationDelay: ferme ? '0.1s' : '0s' }} />
      <section className={`ic-livre ${ferme ? 'ferme' : ''}`} aria-label="Carnet d'éleveur" style={{ filter: FILTRE }}>
        <div className="ic-couv"><div className="stitch" style={{ borderRadius: '14px' }} /></div>
        <div className="ic-page papier-g gauche">
          <div className="ic-surtitre">Carnet d’éleveur</div>
          <h2 className="ic-titre">{etat.nom}</h2>
          <div className="ic-echo">
            {portrait && <img src={portrait} alt="" />}
            <div>
              <div className="ic-craie">{NOM_STADE[etat.stade].toLowerCase()} · jour {ageJours(etat)}</div>
              <div className="ic-phrase">{g.phrase}</div>
            </div>
          </div>
          <div className="ic-rubrique">Ce que vous remarquez</div>
          {indices.length ? indices.slice(0, 4).map((b) => <div key={b.besoin} className="ic-indice">{b.indice}</div>)
            : <div className="ic-indice calme">Rien d’inquiétant pour l’instant.</div>}
          <div className="ic-note">Le journal, les relations et la mémoire des échos se consultent au ranch.</div>
        </div>
        <div className="ic-page papier-d droite">
          <div className="ic-surtitre">Réglages</div>
          <h2 className="ic-titre">Options</h2>
          <div className="ic-reglages">
            {([['Bruitages', 'sons'], ['Musique', 'musique']] as const).map(([nom, k]) => (
              <label key={k}>
                <span>{nom}</span>
                <input type="checkbox" checked={r[k]} onChange={() => changer({ [k]: !r[k] })} />
              </label>
            ))}
            {([['Volume de la musique', 'volumeMusique'], ['Volume des bruitages', 'volumeBruitages']] as const).map(([nom, k]) => (
              <label key={k}>
                <span>{nom}</span>
                <input type="range" min="0" max="100" step="5" value={r[k]} onChange={(ev) => changer({ [k]: Number(ev.target.value) })} />
              </label>
            ))}
          </div>
          <div className="ic-rubrique">Partie</div>
          <div className="ic-boutons">
            <button style={{ ...bouton, background: '#6e3f22', color: '#f6ecd6', boxShadow: 'inset 0 0 0 2px #3a1f0e,inset 0 0 0 4px #6e3f22,inset 0 0 0 5px rgba(240,214,170,.5)' }}
              onClick={() => { sauver(); son('stamp'); setSauve('partie sauvegardée'); plus(2500, () => setSauve('')); }}>Sauvegarder</button>
            <span className="ic-sauve">{sauve}</span>
            {surMenu && <button style={{ ...bouton, background: 'transparent', color: '#6e3f22', boxShadow: 'inset 0 0 0 2px #6e3f22' }} onClick={() => { sauver(); surMenu(); }}>Retour au menu principal</button>}
          </div>
        </div>
        <svg className="ic-signet" width="40" height="420" viewBox="0 0 40 420" aria-hidden="true">
          <path d="M20 0 C18 120 24 260 22 380" fill="none" stroke="#5e1a12" strokeWidth="13" />
          <path d="M20 0 C18 120 24 260 22 380" fill="none" stroke="#9c3b2a" strokeWidth="10.5" />
          <path d="M27 382 L22 392 L18 382 L10 386 L15 376 Z" fill="#9c3b2a" stroke="#5e1a12" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        <button className="ic-fermer" onClick={fermer} aria-label="Fermer le carnet">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </section>
    </>
  );
}
