// Le carnet d'éleveur : c'est le menu du jeu. Il arrive fermé depuis la droite, s'ouvre sur le sommaire,
// et l'on tourne les pages pour changer de section.
import { useRef, useState, type CSSProperties } from 'react';
import { NOM_STADE, accord, ageJours, apparence, type Etat, type Signes } from '@/moteur/simulation';
import { IC } from './icones';
import { saison } from './lumiere';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
const pad = (n: number) => (n < 10 ? '0' : '') + n;
const hm = (minute: number) => `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;

type Section = 'sommaire' | 'journal' | 'relations' | 'memoire' | 'options';
const SECTIONS: { k: Section; nom: string; court: string; titre: string; surtitre: string; icone: string; page?: number }[] = [
  { k: 'sommaire', nom: 'Sommaire', court: 'Sommaire', titre: 'Sommaire', surtitre: 'Carnet d’éleveur', icone: IC.sommaire },
  { k: 'journal', nom: 'Journal du ranch', court: 'Journal', titre: 'Journal du ranch', surtitre: 'Ce qui s’est passé', icone: IC.journal, page: 2 },
  { k: 'relations', nom: 'Relations', court: 'Relations', titre: 'Relations', surtitre: 'Les gens et les échos du coin', icone: IC.relations, page: 4 },
  { k: 'memoire', nom: 'Mémoire des échos', court: 'Mémoire', titre: 'Mémoire des échos', surtitre: 'Ce profil', icone: IC.memoire, page: 6 },
  { k: 'options', nom: 'Options', court: 'Options', titre: 'Options', surtitre: 'Réglages', icone: IC.options, page: 8 },
];

type Son = 'page' | 'woosh' | 'stamp';

export function Carnet({ etat: e, signes, papier, heure, son, nouvelles, surLu, surFermer, reglages, surSauver, surQuitter }: {
  etat: Etat; signes: Signes; papier: string; heure: string; nouvelles: number;
  son: (nom: Son, ...a: unknown[]) => void;
  surLu: () => void; surFermer: () => void; surSauver: () => void; surQuitter: () => void;
  reglages: {
    sons: boolean; setSons: (v: boolean) => void; musique: boolean; setMusique: (v: boolean) => void;
    volumeMusique: number; setVolumeMusique: (v: number) => void; volumeBruitages: number; setVolumeBruitages: (v: number) => void;
  };
}) {
  const [section, setSection] = useState<Section>('sommaire');
  const [ferme, setFerme] = useState(false);
  const [tourne, setTourne] = useState<null | 'avant' | 'arriere'>(null);
  const [cache, setCache] = useState(false);
  const [sauve, setSauve] = useState('');
  const minuteurs = useRef<number[]>([]);
  const plusTard = (f: () => void, ms: number) => { minuteurs.current.push(window.setTimeout(f, ms)); };

  const allerA = (k: Section) => {
    if (k === section || tourne) return;
    const ordre = (x: Section) => SECTIONS.findIndex((t) => t.k === x);
    son('page', 1);
    setTourne(ordre(k) > ordre(section) ? 'avant' : 'arriere');
    setCache(true);
    plusTard(() => { setSection(k); setCache(false); if (k === 'journal') surLu(); }, 380);
    plusTard(() => setTourne(null), 760);
  };
  const fermer = (ensuite?: () => void) => {
    if (ferme) return;
    son('page', 0.8); plusTard(() => son('woosh'), 380);
    setFerme(true);
    plusTard(() => { surFermer(); ensuite?.(); }, 1050);
  };

  const sec = SECTIONS.find((t) => t.k === section)!;
  const aujourdhui = e.journal.filter((j) => j.jour === e.jour);
  const rappels = [
    ...signes.besoins.filter((b) => b.urgence >= 2 && b.besoin !== 'comportement').map((b) => b.indice),
    ...(e.dejections.length ? [`ramasser derrière ${e.nom}`] : []),
    ...(e.inventaire.every((c) => !c) ? ['le sac est vide'] : []),
  ].slice(0, 3);
  const parJour = new Map<number, typeof e.journal>();
  e.journal.slice(0, 40).forEach((j) => parJour.set(j.jour, [...(parJour.get(j.jour) ?? []), j]));
  const lien = (pos: number, neg: number) => (pos - neg > 15 ? 'de bons amis' : pos - neg > 5 ? 'ils s’apprécient' : neg - pos > 5 ? 'ils ne s’entendent pas' : 'à peine croisé');
  const ligne: CSSProperties = { display: 'flex', gap: 12, fontSize: 16, lineHeight: '32px' };
  const heureCol: CSSProperties = { flex: 'none', width: 46, fontFamily: "'Alegreya SC',serif", fontSize: 13, color: '#9a7b55' };

  return (
    <>
      <button className={`voile ${ferme ? 'part' : ''}`} onClick={() => fermer()} aria-label="Fermer le carnet" />
      <section className={`livre ${ferme ? 'ferme' : ''}`} aria-label="Carnet d'éleveur" style={{ filter: papier }}>
        <div className="l-wrap">
          <nav className="l-onglets" aria-label="Pages du carnet">
            {SECTIONS.map((t, i) => (
              <button key={t.k} className={`l-onglet leather ${section === t.k ? 'ici' : ''}`} style={{ animationDelay: `${(1.5 + i * 0.07).toFixed(2)}s` }} onClick={() => allerA(t.k)} aria-label={t.nom}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.icone} /></svg>{t.court}
              </button>
            ))}
          </nav>

          {/* Moitié droite : plat arrière et page de droite */}
          <div style={{ position: 'absolute', left: 470, top: 0, width: 470, height: 590, borderRadius: '0 16px 16px 0', background: '#6e3f22', boxShadow: 'inset 0 0 0 2px #3a1f0e,inset 0 0 0 7px #6e3f22,inset 0 0 22px rgba(30,14,4,.45),0 6px 0 #4a2814,0 22px 50px rgba(10,6,2,.6)' }}>
            <div className="stitch" style={{ borderRadius: '0 11px 11px 0', left: 0, borderLeft: 'none' }} />
            <Coin d="M32 32V10a8 8 0 0 0-8-8H2z" style={{ right: 0, top: 0 }} />
            <Coin d="M32 2v22a8 8 0 0 1-8 8H2z" style={{ right: 0, bottom: 0 }} />
            <div className="papier-d" style={{ position: 'absolute', left: 4, right: 20, top: 16, bottom: 16, padding: '30px 30px 24px 52px', overflow: 'hidden', boxShadow: '0 0 0 1.5px #3a1f0e,1.5px 1.5px 0 #efe4cc,3px 3px 0 #d6c4a0,4.5px 4.5px 0 #ece0c6,6px 6px 0 #cbb893,7.5px 7.5px 0 #e6d8bb,8.5px 8.5px 0 #3a1f0e' }}>
              <div className={`contenu-page ${cache ? 'cache' : ''}`} style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                {section === 'sommaire' && <>
                  <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 34, lineHeight: 1, color: '#3a2a1c' }}>Aujourd'hui</div>
                  <div style={{ fontFamily: "'Alegreya SC',serif", fontSize: 13, letterSpacing: 2, color: '#9a7b55', margin: '2px 0 12px' }}>jour {e.jour} · {saison(e.jour).toLowerCase()} · {heure}</div>
                  {aujourdhui.slice(0, 4).map((j, i) => <div key={i} style={{ ...ligne, fontSize: 16, lineHeight: '24px', marginBottom: 6 }}><span style={heureCol}>{hm(j.minute)}</span><span>{j.texte}</span></div>)}
                  {!aujourdhui.length && <div style={{ fontSize: 16, color: '#9a8668' }}>Rien de notable pour l’instant.</div>}
                  <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 28, lineHeight: 1, color: '#9c3b2a', marginTop: 18 }}>à ne pas oublier</div>
                  {rappels.map((r, i) => (
                    <div key={i} style={{ fontSize: 16, lineHeight: '24px', display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 6 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9c3b2a" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{ flex: 'none', marginTop: 4 }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>{r}
                    </div>
                  ))}
                  {!rappels.length && <div style={{ fontSize: 16, color: '#9a8668', marginTop: 6 }}>Tout a l’air d’aller.</div>}
                </>}
                {section === 'journal' && [...parJour.entries()].filter(([j]) => j !== e.jour).slice(0, 2).map(([jour, entrees]) => (
                  <div key={jour}>
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 30, lineHeight: 1, color: '#3a2a1c', margin: '6px 0' }}>jour {jour}</div>
                    {entrees.slice(0, 6).map((j, i) => <div key={i} style={{ ...ligne, lineHeight: '24px', marginBottom: 4 }}><span style={heureCol}>{hm(j.minute)}</span><span>{j.texte}</span></div>)}
                  </div>
                ))}
                {section === 'journal' && ![...parJour.keys()].some((j) => j !== e.jour) && <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 26, color: '#6b4f33' }}>les jours précédents s’écriront ici</div>}
                {section === 'relations' && <>
                  <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, color: '#9a7b55', marginBottom: 6 }}>À rencontrer</div>
                  <div style={{ fontSize: 16.5, lineHeight: '32px', color: '#9a8668' }}>??? — quelqu'un vit près de la rivière</div>
                  <div style={{ fontSize: 16.5, lineHeight: '32px', color: '#9a8668' }}>??? — une lumière dans la forêt, la nuit</div>
                  <div style={{ fontSize: 16.5, lineHeight: '32px', color: '#9a8668' }}>??? — l'atelier du village est fermé</div>
                </>}
                {section === 'memoire' && <>
                  <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 27, lineHeight: 1.15, color: '#6b4f33', marginTop: 20 }}>Quand un écho s'en va, il laisse ici son souvenir : sa forme, ce qu'il a appris, ce qu'il a aimé.</div>
                  <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 27, lineHeight: 1.15, color: '#6b4f33', marginTop: 18 }}>Cette mémoire appartient à ce profil.</div>
                </>}
                {section === 'options' && <>
                  <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, color: '#9a7b55', marginBottom: 12 }}>Partie</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                    <button className="bouton-cuir" onClick={() => { son('stamp'); surSauver(); setSauve('partie sauvegardée'); plusTard(() => setSauve(''), 2500); }}>Sauvegarder</button>
                    <span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 22, color: '#3f7a3a', minHeight: 24 }}>{sauve}</span>
                    <button className="bouton-cuir clair" onClick={() => fermer(surQuitter)}>Retour au menu principal</button>
                  </div>
                </>}
              </div>
            </div>
            <svg width="60" height="660" viewBox="0 0 60 660" aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: 'drop-shadow(1.5px 2.5px 1.5px rgba(30,14,4,.35))' }}>
              <path d="M22 4 C20 180 30 400 34 590 C35 606 30 620 22 632" fill="none" stroke="#5e1a12" strokeWidth="15" />
              <path d="M22 4 C20 180 30 400 34 590 C35 606 30 620 22 632" fill="none" stroke="#9c3b2a" strokeWidth="12.5" />
              <path d="M22 4 C20 180 30 400 34 590 C35 606 30 620 22 632" fill="none" stroke="#c65a44" strokeWidth="3" opacity=".55" transform="translate(-2.5 0)" />
              <path d="M27.8 635.9 L21.7 645 L19.8 635.3 L10.1 637.3 L16.2 628.1 Z" fill="#9c3b2a" stroke="#5e1a12" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Quelques pages qui tournent à l'ouverture */}
          {[[1, 1.14], [2, 1], [3, 0.86]].map(([z, d]) => (
            <div key={z} className="l-feuillet" style={{ '--z': `${z}px`, animationDelay: `${d}s` } as CSSProperties}><div className="face papier-d" /><div className="face dos papier-g" /></div>
          ))}

          {/* Couverture (recto), puis page de gauche (verso) */}
          <div className="l-rabat">
            <div className="face" style={{ borderRadius: '0 16px 16px 0', background: '#6e3f22', boxShadow: 'inset 0 0 0 2px #3a1f0e,inset 0 0 0 7px #6e3f22,inset 0 0 26px rgba(30,14,4,.5),0 5px 0 #4a2814,0 20px 40px rgba(20,10,4,.45)' }}>
              <div className="stitch" style={{ borderRadius: '0 11px 11px 0' }} />
              <Coin d="M32 32V10a8 8 0 0 0-8-8H2z" style={{ right: 0, top: 0 }} />
              <Coin d="M32 2v22a8 8 0 0 1-8 8H2z" style={{ right: 0, bottom: 0 }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 22, background: 'linear-gradient(90deg,#4a2814,rgba(110,63,34,0))' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <svg width="96" height="96" viewBox="0 0 78 78" aria-hidden="true"><circle cx="39" cy="39" r="34" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2.5" /><path d="M39 58c-9 0-14-7-14-15s6-13 14-13 14 5 14 13-5 15-14 15zM39 30c0-6 3-10 9-12M39 30c-1-5-5-8-10-8" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2.5" strokeLinecap="round" /></svg>
                <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: 22, letterSpacing: 5, color: 'rgba(30,14,4,.5)', textShadow: '0 1px 0 rgba(240,200,150,.2)' }}>Carnet d'éleveur</div>
              </div>
            </div>
            <div className="face dos" style={{ borderRadius: '16px 0 0 16px', background: '#6e3f22', boxShadow: 'inset 0 0 0 2px #3a1f0e,inset 0 0 0 7px #6e3f22,inset 0 0 22px rgba(30,14,4,.45),0 6px 0 #4a2814,0 22px 50px rgba(10,6,2,.6)' }}>
              <div className="stitch" style={{ borderRadius: '11px 0 0 11px', right: 0, borderRight: 'none' }} />
              <Coin d="M2 32V10a8 8 0 0 1 8-8h22z" style={{ left: 0, top: 0 }} />
              <Coin d="M2 2v22a8 8 0 0 0 8 8h22z" style={{ left: 0, bottom: 0 }} />
              <div className="papier-g" style={{ position: 'absolute', left: 20, right: 4, top: 16, bottom: 16, padding: '30px 44px 24px 38px', overflow: 'hidden', boxShadow: '0 0 0 1.5px #3a1f0e,-1.5px 1.5px 0 #efe4cc,-3px 3px 0 #d6c4a0,-4.5px 4.5px 0 #ece0c6,-6px 6px 0 #cbb893,-7.5px 7.5px 0 #e6d8bb,-8.5px 8.5px 0 #3a1f0e' }}>
                <div className={`contenu-page ${cache ? 'cache' : ''}`} style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                  <div style={{ fontFamily: "'Alegreya SC',serif", fontSize: 13, letterSpacing: 3, color: '#9a7b55' }}>{sec.surtitre}</div>
                  <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 44, lineHeight: 1, color: '#3a2a1c', margin: '2px 0 14px' }}>{sec.titre}</div>
                  {section === 'sommaire' && SECTIONS.slice(1).map((t, i) => (
                    <button key={t.k} className="sommaire-ligne" onClick={() => allerA(t.k)}>
                      <span className="num">{['I', 'II', 'III', 'IV'][i]}</span><span>{t.nom}</span>
                      {t.k === 'journal' && nouvelles > 0 && <span className="sceau">{nouvelles > 9 ? '9+' : nouvelles}</span>}
                      <span className="points" /><span className="num">{t.page}</span>
                    </button>
                  ))}
                  {section === 'journal' && <>
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 30, lineHeight: 1, color: '#3a2a1c', marginBottom: 6 }}>aujourd'hui</div>
                    {aujourdhui.slice(0, 11).map((j, i) => <div key={i} style={{ ...ligne, lineHeight: '24px', marginBottom: 4 }}><span style={heureCol}>{hm(j.minute)}</span><span>{j.texte}</span></div>)}
                    {!aujourdhui.length && <div style={{ fontSize: 16, color: '#9a8668' }}>Rien pour l’instant.</div>}
                  </>}
                  {section === 'relations' && <>
                    {[{ nom: 'Myhra', encre: '#3f6a3a', lien: 'veille sur vous deux' }, { nom: 'Jumpy', encre: '#9c3b2a', lien: 'un ami bruyant' }, { nom: 'Garry', encre: '#2f4a7a', lien: e.garryVaincu ? 'il a rejoint le village' : 'méfiance…' }].map((r) => (
                      <div key={r.nom} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 17, lineHeight: '32px' }}><b style={{ fontFamily: "'Alegreya SC',serif", letterSpacing: 1.5, color: r.encre, width: 84 }}>{r.nom}</b><span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 23, color: '#6b4f33' }}>{r.lien}</span></div>
                    ))}
                    <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, color: '#9a7b55', margin: '14px 0 4px' }}>Échos croisés</div>
                    {e.echosSauvages.slice(0, 6).map((s) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 16, lineHeight: '28px' }}><b style={{ fontFamily: "'Alegreya SC',serif", letterSpacing: 1.5, width: 84 }}>{s.nom}</b><span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 22, color: '#6b4f33' }}>{lien(s.affectPositif, s.affectNegatif)}</span></div>
                    ))}
                    {!e.echosSauvages.length && <div style={{ fontSize: 15.5, color: '#9a8668' }}>Aucun pour l’instant.</div>}
                  </>}
                  {section === 'memoire' && <>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 10, borderRadius: 6, background: 'rgba(255,255,255,.35)', boxShadow: 'inset 0 0 0 1px rgba(122,90,58,.3)' }}>
                      <div style={{ flex: 'none', width: 70, height: 84, borderRadius: 5, background: 'radial-gradient(circle at 50% 40%,#fff6df,#e8d6b0)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}><img src={asset(apparence(e))} alt="" style={{ maxHeight: 74, maxWidth: 64 }} /></div>
                      <div><div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: 700, fontSize: 16, letterSpacing: 2 }}>{e.nom}</div><div style={{ fontSize: 15, color: '#6b4f33' }}>{NOM_STADE[e.stade]} · jour {ageJours(e)}</div><div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 22, color: '#3f7a3a' }}>à vos côtés</div></div>
                    </div>
                    <div style={{ fontSize: 15.5, color: '#9a8668', marginTop: 16 }}>Aucun autre écho pour l'instant.</div>
                  </>}
                  {section === 'options' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[{ nom: 'Sons', actif: reglages.sons, basculer: () => reglages.setSons(!reglages.sons) }, { nom: 'Musique', actif: reglages.musique, basculer: () => reglages.setMusique(!reglages.musique) }].map((g) => (
                        <label key={g.nom} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 17, cursor: 'pointer' }}><span>{g.nom}</span><input type="checkbox" checked={g.actif} onChange={g.basculer} style={{ width: 22, height: 22, accentColor: '#6e3f22' }} /></label>
                      ))}
                      {[{ nom: 'Volume de la musique', valeur: reglages.volumeMusique, changer: reglages.setVolumeMusique }, { nom: 'Volume des bruitages', valeur: reglages.volumeBruitages, changer: reglages.setVolumeBruitages }].map((c) => (
                        <label key={c.nom} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, fontSize: 17, cursor: 'pointer' }}><span>{c.nom}</span><input type="range" min={0} max={100} step={5} value={c.valeur} onChange={(ev) => c.changer(Number(ev.target.value))} style={{ flex: '0 0 46%', accentColor: '#6e3f22', cursor: 'pointer' }} /></label>
                      ))}
                      <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: 22, color: '#6b4f33' }}>{accord(e, 'Il', 'Elle')} vous attendra ici.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {tourne && <div className={`page-tourne ${tourne === 'arriere' ? 'arriere' : ''}`}><div className="face papier-d" /><div className="face dos papier-g" /></div>}

          <button onClick={() => fermer()} aria-label="Fermer le carnet" style={{ position: 'absolute', right: -2, top: -58, width: 46, height: 46, border: 'none', borderRadius: '50%', background: 'rgba(244,234,214,.92)', color: '#3a1f0e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(0,0,0,.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </section>
    </>
  );
}

function Coin({ d, style }: { d: string; style: CSSProperties }) {
  return <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: 'absolute', ...style }}><path d={d} fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" /></svg>;
}
