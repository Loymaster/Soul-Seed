// Panneaux du village, dans l'esprit du ranch (cuir, kraft, étiquettes) : l'étal de Jumpy, le stand de Lady Roger,
// le coffre de Maïko, les travaux d'Ash, le sac, et deux petits jeux (le travail à la boutique, déblayer un passage).
// Les prix et les quantités d'objets s'affichent ; jamais l'état chiffré de l'écho.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BATIMENTS_ASH, BATIMENTS_VILLAGE, REPARATIONS, RESSOURCES, acheter, casesCoffre, construireVillage, deposerObjet, deposerRessources,
  etalDuJour, etatBatimentAsh, etatBatimentVillage, lancerChantier, lancerReparation, manque, niveauCorvee, nomCoffre, plafondCoffre,
  prixRachat, reprendreObjet, ressourcesDisponibles, texteCout, vendreCuriosite, HEURES_REPARATION, NOMS_RESSOURCES, TENTATIVES_CORVEE,
  minuteAbsolue, type Monde, type Ressource,
} from '@/moteur/monde';
import { Simulation, aliment, descriptionObjet, objetDivers, type Etat } from '@/moteur/simulation';
import { SFX } from '@/moteur/sfx';

export const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;
const son = (nom: 'paperTick' | 'pop' | 'stamp' | 'woosh' | 'refus' | 'reveal' | 'leather' | 'pencil') => { const f = (SFX as unknown as Record<string, () => void>)[nom]; if (typeof f === 'function') f.call(SFX); };

export type Ton = 'bien' | 'mal' | 'note';
interface Commun { e: Etat; m: Monde; sim: Simulation; rafraichir: () => void; noter: (texte: string, ton?: Ton) => void; fermer: () => void }

/** Cadre commun : cuir cousu, titre sur une étiquette, page de kraft. */
export function Feuille({ titre, sousTitre, icone, fermer, children, large, className = '' }: { titre: string; sousTitre?: string; icone?: string; fermer: () => void; children: ReactNode; large?: boolean; className?: string }) {
  return (
    <div className="mo-voile" onClick={fermer}>
      <div className={`mo-feuille ${large ? 'large' : ''} ${className}`} onClick={(ev) => ev.stopPropagation()}>
        <div className="mo-couture" />
        <div className="mo-etiquette">
          {icone && <img src={asset(`interface/icones/${icone}.png`)} alt="" />}
          <div><b>{titre}</b>{sousTitre && <i>{sousTitre}</i>}</div>
        </div>
        <button className="mo-fermer" aria-label="Fermer" onClick={() => { son('leather'); fermer(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M7 7l10 10M17 7L7 17" /></svg>
        </button>
        <div className="mo-page">{children}</div>
      </div>
    </div>
  );
}

const Bourse = ({ or }: { or: number }) => <span className="mo-bourse"><span className="piece" />{or} pièce{or > 1 ? 's' : ''}</span>;

function CaseObjet({ id, qte, prix, actif, terne, onClick, titre }: { id?: string; qte?: number; prix?: string; actif?: boolean; terne?: boolean; onClick?: () => void; titre?: string }) {
  const d = id ? descriptionObjet(id) : null;
  return (
    <button className={`mo-case ${!id ? 'vide' : ''} ${actif ? 'actif' : ''} ${terne ? 'terne' : ''}`} onClick={onClick} disabled={!id} title={titre ?? d?.nom}>
      {d && <img src={asset(d.icone)} alt={d.nom} draggable={false} />}
      {id && qte != null && qte > 1 && <span className="qte">{qte}</span>}
      {prix && <span className="prix">{prix}</span>}
    </button>
  );
}

function Quantite({ max, valeur, changer }: { max: number; valeur: number; changer: (n: number) => void }) {
  return (
    <span className="mo-qte">
      <button onClick={() => changer(Math.max(1, valeur - 1))} disabled={valeur <= 1}>−</button>
      <b>{valeur}</b>
      <button onClick={() => changer(Math.min(max, valeur + 1))} disabled={valeur >= max}>+</button>
    </span>
  );
}

function Ressources({ m, titre, coffre }: { m: Monde; titre: string; coffre?: boolean }) {
  const plafond = plafondCoffre(m);
  return (
    <div className="mo-ressources">
      <span className="titre">{titre}</span>
      {RESSOURCES.map((r) => {
        const q = coffre ? m.coffre.ressources[r] ?? 0 : m.ressources[r] ?? 0;
        return (
          <span key={r} className={`r ${q ? '' : 'vide'}`} title={NOMS_RESSOURCES[r]}>
            <img src={asset(`objets/materiaux/${r}.png`)} alt={NOMS_RESSOURCES[r]} />
            <b>{q}{coffre ? <small>/{plafond}</small> : null}</b>
          </span>
        );
      })}
    </div>
  );
}

// —————————————————————————————————————— L'étal de Jumpy

export function Etal({ e, m, rafraichir, noter, fermer }: Commun) {
  const etal = etalDuJour(m, e.jour);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [qte, setQte] = useState(1);
  const [mot, setMot] = useState<{ texte: string; ton: Ton } | null>(null);
  const em = choisi != null ? etal[choisi] : null;
  const maxQte = em ? (em.deuxPourUn ? 1 : Math.max(1, Math.min(em.stock, Math.floor(e.or / Math.max(1, em.prix)) || 1))) : 1;
  const acheterIci = () => {
    if (choisi == null) return;
    const r = acheter(e, m, choisi, qte);
    if (r.ok) { son('stamp'); setMot({ texte: r.texte, ton: 'bien' }); noter(r.texte, 'bien'); setQte(1); if (etal[choisi].stock <= 0) setChoisi(null); }
    else { son('refus'); setMot({ texte: r.raison, ton: 'mal' }); }
    rafraichir();
  };
  return (
    <Feuille titre="L’étal du jour" sousTitre="chez Jumpy" icone="cadeau" fermer={fermer} large>
      <div className="mo-entete-page"><span className="craie-encre">Les stocks changent tous les jours</span><Bourse or={e.or} /></div>
      <div className="mo-etal">
        {etal.map((x, i) => {
          const d = descriptionObjet(x.id);
          return (
            <button key={i} className={`mo-article ${choisi === i ? 'actif' : ''} ${x.stock <= 0 ? 'rupture' : ''}`} disabled={x.stock <= 0}
              onMouseEnter={() => son('paperTick')} onClick={() => { son('pop'); setChoisi(i); setQte(1); setMot(null); }}>
              <span className="cat">{x.categorie}</span>
              {d && <img src={asset(d.icone)} alt="" />}
              <span className="nom">{d?.nom ?? x.id}</span>
              <span className="prix">{x.prix} or</span>
              <span className="stock">{x.stock > 0 ? (x.deuxPourUn ? '2 pour 1' : `Stock : ${x.stock}`) : 'Rupture de stock'}</span>
            </button>
          );
        })}
      </div>
      <div className="mo-pied">
        {em ? (
          <>
            <span className="quoi"><b>{descriptionObjet(em.id)?.nom}</b> <i>{descriptionObjet(em.id)?.description}</i></span>
            {!em.deuxPourUn && <Quantite max={maxQte} valeur={qte} changer={setQte} />}
            <span className="total">{em.deuxPourUn ? `2 pour ${em.prix} or` : `Total : ${em.prix * qte} or`}</span>
            <button className="mo-bouton ok" onClick={acheterIci}>Acheter</button>
          </>
        ) : <span className="aide">Choisissez un article sur l’étal.</span>}
      </div>
      {mot && <div className={`mo-mot ${mot.ton}`}>{mot.texte}</div>}
    </Feuille>
  );
}

// —————————————————————————————————————— Le stand de Lady Roger

export function Stand({ e, rafraichir, noter, fermer }: Commun) {
  const [choisi, setChoisi] = useState<number | null>(null);
  const [qte, setQte] = useState(1);
  const [mot, setMot] = useState<{ texte: string; ton: Ton } | null>(null);
  const c = choisi != null ? e.inventaire[choisi] : null;
  const prix = c ? prixRachat(c.id) : null;
  const vendre = () => {
    if (choisi == null) return;
    const r = vendreCuriosite(e, choisi, qte);
    if (r.ok) { son('stamp'); setMot({ texte: r.texte, ton: 'bien' }); noter(r.texte, 'bien'); setChoisi(null); setQte(1); }
    else { son('refus'); setMot({ texte: r.raison, ton: 'mal' }); }
    rafraichir();
  };
  return (
    <Feuille titre="Stand de Lady Roger" sousTitre="curiosités rachetées" icone="cadeau" fermer={fermer}>
      <div className="mo-stand-tete">
        <img src={asset('pnj/lady-roger/neutre.png')} alt="Lady Roger" />
        <p className="bulle">Montre-moi tes curiosités, je te les rachète avec plaisir !</p>
      </div>
      <div className="mo-entete-page"><span className="craie-encre">Votre sac</span><Bourse or={e.or} /></div>
      <div className="mo-grille">
        {e.inventaire.map((x, i) => {
          const p = x ? prixRachat(x.id) : null;
          return <CaseObjet key={i} id={x?.id} qte={x?.qte} prix={p != null ? `${p} or` : undefined} actif={choisi === i} terne={!!x && p == null}
            onClick={() => {
              if (!x) return;
              if (p == null) { son('refus'); setMot({ texte: 'Cela n’intéresse pas Lady Roger.', ton: 'mal' }); setChoisi(null); return; }
              son('pop'); setChoisi(i); setQte(1); setMot(null);
            }} />;
        })}
      </div>
      <div className="mo-pied">
        {c && prix != null ? (
          <>
            <span className="quoi"><b>{descriptionObjet(c.id)?.nom}</b> <i>{prix} or l’unité</i></span>
            <Quantite max={c.qte} valeur={qte} changer={setQte} />
            <span className="total">Total : {prix * qte} or</span>
            <button className="mo-bouton ok" onClick={vendre}>Vendre</button>
          </>
        ) : <span className="aide">Lady Roger ne s’intéresse qu’aux curiosités.</span>}
      </div>
      {mot && <div className={`mo-mot ${mot.ton}`}>{mot.texte}</div>}
    </Feuille>
  );
}

// —————————————————————————————————————— Le coffre de Maïko (puis l'entrepôt)

export function Coffre({ e, m, rafraichir, fermer }: Commun) {
  const [mot, setMot] = useState<{ texte: string; ton: Ton } | null>(null);
  const occupees = m.coffre.objets.filter(Boolean).length;
  const deposer = () => {
    const r = deposerRessources(m);
    const n = Object.values(r.deposees).reduce((a, b) => a + (b ?? 0), 0);
    const pleins = r.pleines.map((x) => `L’espace de stockage du ${NOMS_RESSOURCES[x]} est plein.`).join(' ');
    if (n) son('stamp'); else son('refus');
    setMot({ texte: n ? `Ressources déposées.${pleins ? ' ' + pleins : ''}` : pleins || 'Vous n’avez aucune ressource sur vous.', ton: n ? 'bien' : 'mal' });
    rafraichir();
  };
  return (
    <Feuille titre={nomCoffre(m)} sousTitre="Maïko garde tout" icone="abri" fermer={fermer} large>
      <div className="mo-coffre">
        <div className="col">
          <div className="mo-entete-page"><span className="craie-encre">Votre sac</span><span className="aide">cliquez pour déposer</span></div>
          <div className="mo-grille">
            {e.inventaire.map((x, i) => <CaseObjet key={i} id={x?.id} qte={x?.qte} onClick={() => { const r = deposerObjet(e, m, i); if (r.ok) son('pop'); else if (r.raison) { son('refus'); setMot({ texte: r.raison, ton: 'mal' }); } rafraichir(); }} />)}
          </div>
          <Ressources m={m} titre="ressources" />
          <button className="mo-bouton" onClick={deposer}>Déposer ses ressources</button>
        </div>
        <div className="col">
          <div className="mo-entete-page"><span className="craie-encre">{nomCoffre(m).replace(/^L’|^Le /, '').replace(/^./, (c) => c.toUpperCase())} ({occupees}/{casesCoffre(m)})</span><span className="aide">cliquez pour reprendre</span></div>
          <div className="mo-grille coffre">
            {m.coffre.objets.map((x, i) => <CaseObjet key={i} id={x?.id} qte={x?.qte} onClick={() => { const r = reprendreObjet(e, m, i); if (r.ok) son('pop'); else if (r.raison) { son('refus'); setMot({ texte: r.raison, ton: 'mal' }); } rafraichir(); }} />)}
          </div>
          <Ressources m={m} titre="stock" coffre />
        </div>
      </div>
      {mot && <div className={`mo-mot ${mot.ton}`}>{mot.texte}</div>}
    </Feuille>
  );
}

// —————————————————————————————————————— Les travaux d'Ash

const heuresRestantes = (finA: number, e: Etat) => Math.max(1, Math.ceil((finA - minuteAbsolue(e)) / 60));
const LIBELLE_ETAT: Record<string, string> = { construit: 'Construit', 'en-cours': 'En cours…', occupe: 'Occupé', prerequis: 'Prérequis', inconnu: '???', disponible: 'Construire' };

export function Travaux({ e, m, rafraichir, noter, fermer }: Commun) {
  const [onglet, setOnglet] = useState<'village' | 'ranch'>('ranch');
  const [mot, setMot] = useState<{ texte: string; ton: Ton } | null>(null);
  const resultat = (r: { ok: true; texte: string } | { ok: false; raison: string }) => {
    if (r.ok) { son('stamp'); setMot({ texte: r.texte, ton: 'bien' }); noter(r.texte, 'bien'); }
    else { son('refus'); setMot({ texte: r.raison, ton: 'mal' }); }
    rafraichir();
  };
  const maintenant = minuteAbsolue(e);
  return (
    <Feuille titre="Travaux de reconstruction" sousTitre="avec Ash" icone="marteau" fermer={fermer} large>
      <div className="mo-onglets">
        <button className={onglet === 'village' ? 'ici' : ''} onClick={() => { son('paperTick'); setOnglet('village'); }}>Village</button>
        <button className={onglet === 'ranch' ? 'ici' : ''} onClick={() => { son('paperTick'); setOnglet('ranch'); }}>Ranch</button>
        <span className="chantiers">
          {m.chantier ? <span><img src={asset('interface/icones/marteau.png')} alt="" />{m.chantier.nom} — encore {heuresRestantes(m.chantier.finA, e)} h</span> : <span className="aide">Aucun chantier en cours</span>}
          {m.reparation && <span><img src={asset('interface/icones/barriere.png')} alt="" />{m.reparation.libelle} — encore {heuresRestantes(m.reparation.finA, e)} h</span>}
        </span>
      </div>
      <div className="mo-dispo">
        <span className="titre">matériaux disponibles</span>
        {RESSOURCES.map((r) => <span key={r} className={`r ${ressourcesDisponibles(m, r) ? '' : 'vide'}`} title={NOMS_RESSOURCES[r]}><img src={asset(`objets/materiaux/${r}.png`)} alt="" /><b>{ressourcesDisponibles(m, r)}</b></span>)}
        <Bourse or={e.or} />
      </div>
      <div className="mo-liste">
        {onglet === 'village' ? (
          <>
            <div className="mo-rubrique">Bâtiments d’Ash</div>
            {BATIMENTS_ASH.map((b) => {
              const et = etatBatimentAsh(m, b);
              const inconnu = et === 'inconnu';
              const manquant = Object.keys(manque(m, b.cout)).length > 0;
              return (
                <div key={b.cle} className={`mo-ligne ${et}`}>
                  <div className="txt">
                    <b>{inconnu ? '???' : b.nom}</b>
                    <i>{inconnu ? 'Un écho doit pouvoir vous renseigner sur cette construction.' : et === 'construit' ? 'Construit.' : et === 'prerequis' ? `Prérequis : ${b.prerequis.join(', ')}` : `${texteCout(b.cout)} · ${b.heures} h`}</i>
                    {!inconnu && et !== 'construit' && <small>{b.effet}</small>}
                  </div>
                  <button className={`mo-bouton ${et === 'disponible' && !manquant ? 'ok' : ''}`} disabled={et !== 'disponible'} onClick={() => resultat(lancerChantier(m, b.cle, maintenant))}>{LIBELLE_ETAT[et]}</button>
                </div>
              );
            })}
            <div className="mo-rubrique">Bâtiments du village <small>(payés en or — sans effet pour l’instant)</small></div>
            {BATIMENTS_VILLAGE.map((b) => {
              const et = etatBatimentVillage(m, b);
              const inconnu = et === 'inconnu';
              return (
                <div key={b.cle} className={`mo-ligne ${et}`}>
                  <div className="txt">
                    <b>{inconnu ? '???' : b.nom}</b>
                    <i>{inconnu ? 'Un écho doit pouvoir vous renseigner sur cette construction.' : et === 'construit' ? 'Construit.' : et === 'prerequis' ? `Prérequis : ${b.prerequis.length > 3 ? 'tout le reste du village' : b.prerequis.join(', ')}` : `${b.or} or`}</i>
                  </div>
                  <button className={`mo-bouton ${et === 'disponible' && e.or >= b.or ? 'ok' : ''}`} disabled={et !== 'disponible'} onClick={() => resultat(construireVillage(m, e, b.cle))}>{LIBELLE_ETAT[et]}</button>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div className="mo-rubrique">Corvées du ranch</div>
            {REPARATIONS.map((r) => {
              const niv = niveauCorvee(m, r.corvee);
              const enCours = m.reparation?.corvee === r.corvee;
              const cout = niv < 3 ? r.couts[niv] : null;
              return (
                <div key={r.corvee} className={`mo-ligne ${niv ? 'construit' : ''}`}>
                  <div className="txt">
                    <b>{niv ? r.nomCorvee : r.libelle}</b>
                    <i>{niv === 0 ? `Débloque : ${r.nomCorvee}` : `Niveau ${niv}/3 — ${TENTATIVES_CORVEE[niv]} tentatives`}</i>
                    {cout && <small>{texteCout(cout)} · {HEURES_REPARATION[niv]} h</small>}
                  </div>
                  <button className={`mo-bouton ${cout && !m.reparation && !Object.keys(manque(m, cout)).length ? 'ok' : ''}`} disabled={!cout || !!m.reparation}
                    onClick={() => resultat(lancerReparation(m, r.corvee, maintenant))}>
                    {enCours ? 'En cours…' : !cout ? 'Niveau max' : niv === 0 ? 'Réparer' : 'Améliorer'}
                  </button>
                </div>
              );
            })}
            <div className="mo-rubrique">Entraînement, jardin, cuisine, écho <small>— en développement</small></div>
          </>
        )}
      </div>
      {mot && <div className={`mo-mot ${mot.ton}`}>{mot.texte}</div>}
    </Feuille>
  );
}

// —————————————————————————————————————— Le sac (le même que celui du ranch)

export function Sac({ e, m, sim, rafraichir, noter, fermer }: Commun) {
  const [choisi, setChoisi] = useState<number | null>(null);
  const c = choisi != null ? e.inventaire[choisi] : null;
  const d = c ? descriptionObjet(c.id) : null;
  const mangeable = !!(c && aliment(c.id));
  const utilisable = !!(c && objetDivers(c.id)?.usage && objetDivers(c.id)?.usage !== 'appat');
  const agir = () => {
    if (choisi == null) return;
    const r = mangeable ? sim.nourrir(choisi) : sim.utiliser(choisi);
    for (const s of sim.vider()) if (s.type === 'journal') noter(s.texte, 'note');
    if (r.ok) { son('pop'); if ('texte' in r && r.texte) noter(r.texte, 'bien'); }
    else { son('refus'); if (r.raison) noter(r.raison, 'mal'); }
    setChoisi(null);
    rafraichir();
  };
  return (
    <Feuille titre="Le sac" sousTitre={`${e.nom} vous suit`} fermer={fermer}>
      <div className="mo-entete-page"><span className="craie-encre">Ce que vous portez</span><Bourse or={e.or} /></div>
      <div className="mo-grille">
        {e.inventaire.map((x, i) => <CaseObjet key={i} id={x?.id} qte={x?.qte} actif={choisi === i} onClick={() => { son('pop'); setChoisi(i === choisi ? null : i); }} />)}
      </div>
      <Ressources m={m} titre="ressources" />
      <div className="mo-pied">
        {c && d ? (
          <>
            <span className="quoi"><b>{d.nom}</b> <i>{d.description}</i></span>
            {(mangeable || utilisable) && <button className="mo-bouton ok" onClick={agir}>{mangeable ? `Donner à ${e.nom}` : 'Utiliser'}</button>}
          </>
        ) : <span className="aide">Choisissez un objet.</span>}
      </div>
    </Feuille>
  );
}

// —————————————————————————————————————— Le travail à la boutique : attraper dix échos sauvages en dix secondes

const ECHOS_SAUVAGES = ['echos/bebe/joy.png', 'echos/bebe/wrath.png', 'echos/bebe/sorrow.png', 'echos/bebe/fear.png', 'echos/bebe/disgust.png'];

export function Travail({ e, m, noter, fermer, gain }: Commun & { gain: (or: number) => void }) {
  const [phase, setPhase] = useState<'pret' | 'decompte' | 'jeu' | 'fin'>('pret');
  const [decompte, setDecompte] = useState(3);
  const [reste, setReste] = useState(10);
  const [touches, setTouches] = useState(0);
  const [cible, setCible] = useState({ x: 40, y: 40, img: ECHOS_SAUVAGES[0], cle: 0 });
  const [paie, setPaie] = useState(0);
  const fini = useRef(false);
  const xp = Number(m.drapeaux['jumpy.travail_xp'] ?? 0) || 0;
  const nouvelleCible = () => setCible((c) => ({ x: 10 + Math.random() * 70, y: 15 + Math.random() * 55, img: ECHOS_SAUVAGES[Math.floor(Math.random() * ECHOS_SAUVAGES.length)], cle: c.cle + 1 }));
  useEffect(() => {
    if (phase === 'decompte') {
      if (decompte <= 0) { setPhase('jeu'); nouvelleCible(); return; }
      const id = setTimeout(() => { son('paperTick'); setDecompte((x) => x - 1); }, 1000);
      return () => clearTimeout(id);
    }
    if (phase === 'jeu') {
      if (reste <= 0) { terminer(touches); return; }
      const id = setTimeout(() => setReste((x) => x - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [phase, decompte, reste]); // eslint-disable-line react-hooks/exhaustive-deps
  const terminer = (n: number) => {
    if (fini.current) return;
    fini.current = true;
    const or = n >= 10 ? Math.round(12 * (1 + Math.min(1, xp * 0.04))) : 0;
    if (or) { e.or += or; m.drapeaux['jumpy.travail_xp'] = xp + 1; son('reveal'); } else son('refus');
    noter(or ? `Vous avez travaillé à la boutique de Jumpy et rapporté ${or} or.` : 'Vous avez travaillé à la boutique de Jumpy, mais n’avez rien gagné cette fois.', or ? 'bien' : 'note');
    setPaie(or);
    setPhase('fin');
  };
  const toucher = () => {
    if (phase !== 'jeu') return;
    son('pop');
    const n = touches + 1;
    setTouches(n);
    if (n >= 10) terminer(n); else nouvelleCible();
  };
  return (
    <Feuille titre="Travail à la boutique" sousTitre="attrapez les échos qui dérangent les rayons" icone="marteau" fermer={() => { if (phase === 'jeu') return; if (!fini.current) { fini.current = true; } gain(paie); fermer(); }} large>
      <div className="mo-jeu" style={{ backgroundImage: `url(${asset('decors/boutique/interieur.png')})` }}>
        {phase === 'pret' && <div className="mo-jeu-msg"><p>Dix échos sauvages se sont glissés dans la boutique. Attrapez-les tous en dix secondes !</p><button className="mo-bouton ok" onClick={() => { son('woosh'); setPhase('decompte'); }}>Commencer</button></div>}
        {phase === 'decompte' && <div className="mo-jeu-msg grand">{decompte || 'Go !'}</div>}
        {phase === 'jeu' && (
          <>
            <div className="mo-jeu-hud"><span>{touches}/10</span><span>{reste} s</span></div>
            <button key={cible.cle} className="mo-cible" style={{ left: `${cible.x}%`, top: `${cible.y}%` }} onPointerDown={toucher}><img src={asset(cible.img)} alt="écho sauvage" draggable={false} /></button>
          </>
        )}
        {phase === 'fin' && (
          <div className="mo-jeu-msg">
            <p>{paie ? `Bravo ! Jumpy vous paie ${paie} or.` : `${touches} écho${touches > 1 ? 's' : ''} sur 10… Jumpy ne peut rien vous donner cette fois.`}</p>
            <button className="mo-bouton ok" onClick={() => { gain(paie); fermer(); }}>Rendre le tablier</button>
          </div>
        )}
      </div>
    </Feuille>
  );
}

// —————————————————————————————————————— Déblayer un passage : glisser douze pierres jusqu'au tas

export function Deblayer({ fermer, fin }: { fermer: () => void; fin: (ok: boolean) => void }) {
  const [pierres, setPierres] = useState(() => Array.from({ length: 12 }, (_, i) => ({ id: i, x: 8 + Math.random() * 62, y: 12 + Math.random() * 62 })));
  const [prise, setPrise] = useState<{ id: number; x: number; y: number } | null>(null);
  const zone = useRef<HTMLDivElement>(null);
  const pos = (ev: { clientX: number; clientY: number }) => {
    const r = zone.current!.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * 100, y: ((ev.clientY - r.top) / r.height) * 100 };
  };
  const surTas = (p: { x: number; y: number }) => p.x > 76 && p.y > 52;
  const lacher = (ev: React.PointerEvent) => {
    if (!prise) return;
    const p = pos(ev);
    if (surTas(p)) {
      son('stamp');
      const reste = pierres.filter((x) => x.id !== prise.id);
      setPierres(reste);
      if (!reste.length) setTimeout(() => fin(true), 500);
    } else setPierres((l) => l.map((x) => (x.id === prise.id ? { ...x, x: Math.min(90, Math.max(0, p.x - 4)), y: Math.min(88, Math.max(0, p.y - 5)) } : x)));
    setPrise(null);
  };
  return (
    <Feuille titre="Déblayer le passage" sousTitre={`${pierres.length} pierre${pierres.length > 1 ? 's' : ''} restante${pierres.length > 1 ? 's' : ''}`} icone="pierre" fermer={() => { fin(false); fermer(); }} large>
      <div ref={zone} className="mo-jeu deblayer" style={{ backgroundImage: `url(${asset('decors/exploration/28-passage-encombre-trefonds.png')})` }}
        onPointerMove={(ev) => { if (prise) { const p = pos(ev); setPrise({ ...prise, x: p.x, y: p.y }); } }} onPointerUp={lacher} onPointerLeave={() => setPrise(null)}>
        <div className="mo-tas">Déposer ici</div>
        {pierres.map((p) => (
          <img key={p.id} className={`mo-pierre ${prise?.id === p.id ? 'prise' : ''}`} src={asset('objets/materiaux/pierre.png')} alt="pierre" draggable={false}
            style={prise?.id === p.id ? { left: `${prise.x - 4}%`, top: `${prise.y - 5}%` } : { left: `${p.x}%`, top: `${p.y}%` }}
            onPointerDown={(ev) => { ev.preventDefault(); son('paperTick'); const q = pos(ev); setPrise({ id: p.id, x: q.x, y: q.y }); }} />
        ))}
        <div className="mo-jeu-aide">Glissez chaque pierre jusqu’au tas pour la faire disparaître.</div>
      </div>
    </Feuille>
  );
}

export const RESSOURCE_NOMS = NOMS_RESSOURCES as Record<Ressource, string>;
