// Menu principal — registre « magie sainte », d'après la maquette validée.
import { useState, type CSSProperties, type ReactNode } from 'react';
import { NOM_STADE, ageJours, apparence, type Etat } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';
import { NB_EMPLACEMENTS, volumeBruitagesDe, volumeMusiqueDe, type Profil } from '../profils';
import { Monogramme } from './Avatar';
import { useMusique } from '../commun/musique';
import './menu.css';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;

type Panneau = null | 'profils' | 'charger' | 'nouvelle' | 'debut' | 'options' | 'memoire' | 'notes';

export interface ProprietesMenu {
  profil: Profil;
  profils: Profil[];
  parties: (Etat | null)[];
  derniere: { emplacement: number; etat: Etat } | null;
  disponibles: Set<string>;
  surContinuer: () => void;
  surCharger: (emplacement: number) => void;
  /** avec ou sans l'introduction (sans : création du personnage, puis choix de la Soul Seed) */
  surNouvellePartie: (emplacement: number, avecIntroduction: boolean) => void;
  surEffacerPartie: (emplacement: number) => void;
  surChoisirProfil: (id: string) => void;
  surNouveauProfil: () => void;
  surSupprimerProfil: (id: string) => void;
  surModifierProfil: (modif: Partial<Profil>) => void;
  /** Outils de développement (scènes de test, atelier) : seulement en mode dev. */
  outilsDev?: ReactNode;
}

const resume = (e: Etat) => (e.mort ? `${e.nom} s’est ${e.genre === 'f' ? 'éteinte' : 'éteint'} · une nouvelle graine attend` : `${e.nom} · ${NOM_STADE[e.stade]} · Jour ${ageJours(e)}`);
const dateCourte = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); } catch { return ''; }
};

export function MenuPrincipal(p: ProprietesMenu) {
  const [actif, setActif] = useState(-1);
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [emplacement, setEmplacement] = useState(0);
  const { profil, parties } = p;
  const musique = profil.reglages.musique, sons = profil.reglages.sons;
  SFX.on = sons;
  useMusique('menu', { volume: 0.4, active: musique });
  const nbParties = parties.filter(Boolean).length;
  const libre = parties.findIndex((x) => !x);
  const formesTotales = [...p.disponibles].filter((c) => /^echos\/(bebe|enfant|adolescent|adulte)\//.test(c)).length;
  const survol = (i: number) => { if (actif !== i) { SFX.holyHover(); setActif(i); } };
  const ouvrir = (x: Panneau) => { SFX.holyClick(); setAConfirmer(null); setPanneau(x); };

  const items: { nom: string; sous?: string; off?: boolean; agir: () => void }[] = [
    { nom: 'Continuer', sous: p.derniere ? resume(p.derniere.etat) : 'aucune partie en cours', off: !p.derniere, agir: () => { SFX.holyClick(); p.surContinuer(); } },
    { nom: 'Charger', sous: nbParties ? `${nbParties} partie${nbParties > 1 ? 's' : ''} sur ce profil` : 'aucune partie enregistrée', off: !nbParties, agir: () => ouvrir('charger') },
    { nom: 'Nouvelle partie', sous: 'Une nouvelle Soul Seed', agir: () => { if (libre >= 0) { setEmplacement(libre); ouvrir('debut'); } else ouvrir('nouvelle'); } },
    { nom: 'Mode Arène', sous: 'bientôt', off: true, agir: () => {} },
    { nom: 'Mémoire des échos', sous: `${profil.memoire.length} forme${profil.memoire.length > 1 ? 's' : ''} sur ${formesTotales} découvertes`, agir: () => ouvrir('memoire') },
    { nom: 'Options', agir: () => ouvrir('options') },
  ];

  const monte = [[58.5, 54, -12, 4, 0], [60.5, 57, 16, 3, -1.6], [57.5, 58, -4, 3, -3.2], [61.5, 53, 10, 4, -4.8], [56.5, 56, -18, 3, -5.9]];
  const tombe = [[17, 22, 8, 4, 0], [21, 19, -10, 3, -2.1], [14, 26, 4, 3, -4.3]];

  return (
    <div className="mp">
      <div className="mp-scene">
        <div className="mp-fond" style={{ backgroundImage: `url(${asset('decors/menu/affiche.png')})` }} />
        {/* Lumière sainte sur les mains de la Gardienne, lueur corrompue sur la créature d'ombre */}
        <div className="mp-sainte" style={{ left: '77%', top: '38%', width: '17%', height: '30%' }} />
        {monte.map(([x, y, dx, t, d], i) => <span key={i} className="mp-monte" style={{ left: `${x + 19}%`, top: `${y}%`, width: t, height: t, background: i % 2 ? '#e8f6ff' : '#fff3c4', boxShadow: `0 0 10px ${i % 2 ? '#a8dcff' : '#ffd27a'}`, animationDelay: `${d}s`, '--dx': `${dx}px` } as CSSProperties} />)}
        <div className="mp-sombre" style={{ left: '25%', top: '17%', width: '20%', height: '33%' }} />
        {tombe.map(([x, y, dx, t, d], i) => <span key={i} className="mp-tombe" style={{ left: `${x + 6}%`, top: `${y}%`, width: t, height: t, background: i % 2 ? '#b45cff' : '#c77dff', boxShadow: '0 0 8px #6b2f8f', animationDelay: `${d}s`, '--dx': `${dx}px` } as CSSProperties} />)}
      </div>

      <div className="mp-haut">
        <button className="pill" style={{ padding: '6px 14px 6px 6px' }} onMouseEnter={() => SFX.holyHover()} onClick={() => ouvrir('profils')} aria-label="Changer de profil">
          <Monogramme nom={profil.nom} taille={30} />
          <span style={{ textAlign: 'left', lineHeight: 1.1 }}><span style={{ display: 'block', fontSize: 10, letterSpacing: 2, color: '#9fb3c6' }}>Profil</span>{profil.nom}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginLeft: 4 }}><path d="M7 10l5 5 5-5" /></svg>
        </button>
        <div className="mp-pastilles">
          <button className="pill" aria-pressed={musique} onClick={() => { SFX.holyClick(); p.surModifierProfil({ reglages: { ...profil.reglages, musique: !musique } }); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 18V6l10-2v12" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="16" r="2" /></svg>Musique
            <span className="dot" style={{ background: musique ? '#a8f0b8' : '#6a6f78', boxShadow: `0 0 8px ${musique ? '#a8f0b8' : '#6a6f78'}` }} />
          </button>
          <button className="pill" aria-pressed={sons} onClick={() => { if (sons) { SFX.holyClick(); SFX.on = false; } else { SFX.on = true; SFX.holyClick(); } p.surModifierProfil({ reglages: { ...profil.reglages, sons: !sons } }); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z" /><path d="M16 9a4 4 0 0 1 0 6" /></svg>Bruitages
            <span className="dot" style={{ background: sons ? '#a8f0b8' : '#6a6f78', boxShadow: `0 0 8px ${sons ? '#a8f0b8' : '#6a6f78'}` }} />
          </button>
          <button className="pill" onMouseEnter={() => SFX.holyHover()} onClick={() => ouvrir('notes')}>Notes de version</button>
        </div>
      </div>

      <div className="mp-voile-bas" />
      <nav className="mp-menu" aria-label="Menu principal" onMouseLeave={() => setActif(-1)}>
        {items.map((it, i) => (
          <button key={it.nom} className={`mp-item ${actif === i ? 'on' : ''}`} disabled={it.off} aria-disabled={it.off}
            onMouseEnter={() => survol(i)} onFocus={() => survol(i)} onClick={it.agir}>
            <span className="gem" />{it.nom}{it.sous && <span className="sub">{it.sous}</span>}
          </button>
        ))}
      </nav>
      <div className="mp-version">v0.5 · refonte</div>

      {panneau && (
        <>
          <button className="mp-voile" aria-label="Fermer" onClick={() => setPanneau(null)} />
          <section className="panneau" role="dialog" aria-modal="true">
            <button className="fermer" onClick={() => setPanneau(null)} aria-label="Fermer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>

            {panneau === 'profils' && <>
              <h2>Profils</h2>
              <div className="chapeau">Chaque profil garde ses parties, ses réglages et la mémoire des échos que partagent ses parties.</div>
              {p.profils.map((x) => (
                <div key={x.id} style={{ position: 'relative' }}>
                  <button className={`ligne-verre ${x.id === profil.id ? 'choisi' : ''}`} onMouseEnter={() => SFX.holyHover()} onClick={() => { SFX.holyClick(); p.surChoisirProfil(x.id); setPanneau(null); }}>
                    <Monogramme nom={x.nom} taille={52} />
                    <span><span className="nom">{x.nom}</span><br /><span className="det">{x.id === profil.id ? 'profil actuel' : `dernière visite le ${dateCourte(x.vuLe)}`}</span></span>
                  </button>
                  <div style={{ position: 'absolute', right: 10, top: 20 }}>
                    {aConfirmer === x.id
                      ? <button className="lien-petit" style={{ color: '#ffb0a0' }} onClick={() => { p.surSupprimerProfil(x.id); setAConfirmer(null); }}>Effacer définitivement ?</button>
                      : <button className="lien-petit" onClick={() => setAConfirmer(x.id)} aria-label={`Supprimer le profil ${x.nom}`}>supprimer</button>}
                  </div>
                </div>
              ))}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <button className="bouton-saint" onMouseEnter={() => SFX.holyHover()} onClick={() => { SFX.holyClick(); setPanneau(null); p.surNouveauProfil(); }}>Nouveau profil</button>
              </div>
            </>}

            {(panneau === 'charger' || panneau === 'nouvelle') && <>
              <h2>{panneau === 'charger' ? 'Charger une partie' : 'Nouvelle partie'}</h2>
              <div className="chapeau">{panneau === 'charger' ? `Les parties de ${profil.nom}.` : 'Tous les emplacements sont pris : choisissez la partie à remplacer.'}</div>
              {Array.from({ length: NB_EMPLACEMENTS }, (_, i) => {
                const e = parties[i];
                const cle = `emp-${i}`;
                const enJeu = panneau === 'charger' ? !!e : true;
                return (
                  <div key={i} style={{ position: 'relative' }}>
                    <button className="ligne-verre" disabled={!enJeu} onMouseEnter={() => enJeu && SFX.holyHover()}
                      onClick={() => {
                        if (panneau === 'charger') { SFX.holyClick(); p.surCharger(i); return; }
                        if (aConfirmer !== cle) { setAConfirmer(cle); return; }
                        setEmplacement(i); ouvrir('debut');
                      }}>
                      {e
                        ? <img src={asset(apparence(e))} alt="" style={{ width: 52, height: 52, objectFit: 'contain', filter: e.mort ? 'grayscale(1) brightness(.7)' : 'drop-shadow(0 0 8px rgba(168,220,255,.5))' }} />
                        : <span style={{ width: 52, height: 52, borderRadius: 12, boxShadow: 'inset 0 0 0 1px rgba(200,230,255,.3)', display: 'block' }} />}
                      <span>
                        <span className="nom">{e ? e.nom : 'Emplacement libre'}</span><br />
                        <span className="det">{e ? (e.mort ? `${NOM_STADE[e.stade]} · s’est éteint${e.genre === 'f' ? 'e' : ''} au jour ${ageJours(e)} · une nouvelle graine attend` : resume(e)) : `emplacement ${i + 1}`}</span>
                      </span>
                      {panneau === 'nouvelle' && aConfirmer === cle && <span className="droite det" style={{ color: '#ffd9a0' }}>Remplacer ? cliquez encore</span>}
                    </button>
                    {panneau === 'charger' && e && (
                      <div style={{ position: 'absolute', right: 10, top: 22 }}>
                        {aConfirmer === cle
                          ? <button className="lien-petit" style={{ color: '#ffb0a0' }} onClick={() => { p.surEffacerPartie(i); setAConfirmer(null); }}>Effacer ?</button>
                          : <button className="lien-petit" onClick={() => setAConfirmer(cle)}>effacer</button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </>}

            {panneau === 'debut' && <>
              <h2>Nouvelle partie</h2>
              <div className="chapeau">Comment voulez-vous commencer ?</div>
              <button className="ligne-verre" onMouseEnter={() => SFX.holyHover()} onClick={() => { SFX.holyClick(); p.surNouvellePartie(emplacement, true); }}>
                <span><span className="nom">Avec l’introduction</span><br /><span className="det">Le réveil entre deux mondes, puis l’arrivée au Sanctuaire</span></span>
              </button>
              <button className="ligne-verre" onMouseEnter={() => SFX.holyHover()} onClick={() => { SFX.holyClick(); p.surNouvellePartie(emplacement, false); }}>
                <span><span className="nom">Sans l’introduction</span><br /><span className="det">Créer votre personnage, puis choisir votre Soul Seed</span></span>
              </button>
            </>}

            {panneau === 'options' && <>
              <h2>Options</h2>
              <div className="chapeau">Réglages du profil de {profil.nom}.</div>
              <label className="interrupteur"><span>Musique</span><input type="checkbox" checked={musique} onChange={() => p.surModifierProfil({ reglages: { ...profil.reglages, musique: !musique } })} /></label>
              <label className="interrupteur"><span>Bruitages</span><input type="checkbox" checked={sons} onChange={() => { SFX.on = !sons; p.surModifierProfil({ reglages: { ...profil.reglages, sons: !sons } }); }} /></label>
              <label className="curseur"><span>Volume de la musique</span><input type="range" min={0} max={100} step={5} value={volumeMusiqueDe(profil.reglages)} onChange={(ev) => p.surModifierProfil({ reglages: { ...profil.reglages, volumeMusique: Number(ev.target.value) } })} /></label>
              <label className="curseur"><span>Volume des bruitages</span><input type="range" min={0} max={100} step={5} value={volumeBruitagesDe(profil.reglages)} onChange={(ev) => { p.surModifierProfil({ reglages: { ...profil.reglages, volumeBruitages: Number(ev.target.value) } }); }} onPointerUp={() => SFX.holyHover()} /></label>
              {p.outilsDev && <div style={{ position: 'relative', marginTop: 22 }}>{p.outilsDev}</div>}
            </>}

            {panneau === 'memoire' && <>
              <h2>Mémoire des échos</h2>
              <div className="chapeau">Les formes que vous avez vu naître sur ce profil.</div>
              {profil.memoire.length
                ? <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(92px,1fr))', gap: 12 }}>
                    {profil.memoire.map((f) => (
                      <div key={f} style={{ height: 104, borderRadius: 12, background: 'radial-gradient(circle at 50% 40%,rgba(200,235,255,.22),rgba(232,246,255,.04) 70%)', boxShadow: 'inset 0 0 0 1px rgba(200,230,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={asset(f)} alt="" style={{ maxWidth: 80, maxHeight: 90, filter: 'drop-shadow(0 0 8px rgba(168,220,255,.5))' }} />
                      </div>
                    ))}
                  </div>
                : <div style={{ position: 'relative', fontStyle: 'italic', color: '#bcd3e6' }}>Aucune forme pour l’instant. Elles apparaîtront ici à mesure que vos échos grandiront.</div>}
            </>}

            {panneau === 'notes' && <>
              <h2>Notes de version</h2>
              <div className="chapeau">v0.5 — la refonte</div>
              <ul style={{ position: 'relative', margin: 0, paddingLeft: 20, lineHeight: 1.6, color: '#e9f4fc' }}>
                <li>Profils : un nom, ses parties (chacune avec son personnage) et la mémoire des échos qu’elles partagent.</li>
                <li>Le ranch : une scène vivante, sans jauges ; on lit son écho à son attitude.</li>
                <li>Le carnet d’éleveur devient le menu du jeu.</li>
                <li>Les dialogues : un nouveau moteur de scènes.</li>
              </ul>
            </>}
          </section>
        </>
      )}
    </div>
  );
}
