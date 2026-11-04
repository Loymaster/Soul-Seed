// Vue « Scènes » : écrire une scène et la voir jouer en même temps, avec le vrai moteur du jeu.
// Le fichier est enregistré tout seul dans contenu/scenes/<id>.scene.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Catalogue } from '@/contenu/types';
import { contexteScenes } from '@/contenu/contexte';
import { SceneDialogue } from '@/jeu/scene/SceneDialogue';
import { analyserScene, identifiant } from '@/moteur/scene/analyseur';
import { variablesDeScene, VARIABLES_DU_JEU } from '@/moteur/scene/valider';
import type { Probleme, Scene, Valeur } from '@/moteur/scene/types';
import { api, type FichierScene } from '../api';
import { Icone } from '../commun';
import { EditeurCode, type PoigneeEditeur } from './EditeurCode';
import { extensionsScene, verifierSource } from './langage';
import './scenes.css';

interface Props {
  catalogue: Catalogue;
  choisie: string | null;
  setChoisie: (id: string | null) => void;
  notifier: (m: string, d?: string, genre?: 'ok' | 'erreur') => void;
}

const MODELE = `titre: Nouvelle scène
décor: village/sanctuaire
places: myhra G1

myhra: Bonjour, {echo.nom}. Que fais-tu par ici ?
écho: (surpris) {echo.nom} vous regarde, curieux.
choix: Que répondre ?
  > curiosité « Je découvre le village. »
    myhra: Alors bienvenue !
  > neutre « Je ne fais que passer. »
    myhra: Bonne route, alors.
`;

function lireStockage<T>(cle: string, defaut: T): T {
  try { const v = localStorage.getItem(cle); return v ? (JSON.parse(v) as T) : defaut; } catch { return defaut; }
}
function ecrireStockage(cle: string, v: unknown) {
  try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* stockage indisponible : sans importance */ }
}

/** « 3 » → 3, « vrai » → true, sinon texte. */
function valeurDe(texte: string): Valeur {
  const t = texte.trim();
  if (/^-?\d+([.,]\d+)?$/.test(t)) return parseFloat(t.replace(',', '.'));
  if (/^vrai$/i.test(t)) return true;
  if (/^faux$/i.test(t)) return false;
  return t;
}

export function VueScenes({ catalogue, choisie, setChoisie, notifier }: Props) {
  const [fichiers, setFichiers] = useState<FichierScene[] | null>(null);
  const [creation, setCreation] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try { setFichiers(await api.scenes()); } catch (e) { notifier('Impossible de lire les scènes', (e as Error).message, 'erreur'); }
  }, [notifier]);
  useEffect(() => { charger(); }, [charger]);

  // Un fichier modifié hors de l'atelier (autre éditeur, git…) : on recharge la liste.
  useEffect(() => {
    if (!import.meta.hot) return;
    const f = () => charger();
    import.meta.hot.on('atelier:scenes', f);
    return () => import.meta.hot?.off?.('atelier:scenes', f);
  }, [charger]);

  const contexteGlobal = useMemo(() => (fichiers ? contexteScenes(catalogue, fichiers) : null), [catalogue, fichiers]);
  const bilans = useMemo(() => {
    if (!fichiers || !contexteGlobal) return {};
    const r: Record<string, { titre?: string; erreurs: number; alertes: number }> = {};
    for (const f of fichiers) {
      const { scene, problemes } = verifierSource(f.source, f.id, { ...contexteGlobal, variablesEcrites: contexteScenes(catalogue, fichiers, f.id).variablesEcrites });
      r[f.id] = { titre: scene.titre, erreurs: problemes.filter((p) => p.niveau === 'erreur').length, alertes: problemes.filter((p) => p.niveau === 'alerte').length };
    }
    return r;
  }, [fichiers, contexteGlobal, catalogue]);

  const courante = fichiers?.find((f) => f.id === (choisie || fichiers[0]?.id));

  async function creer() {
    const id = identifiant(creation || '');
    if (!id) return;
    try {
      await api.nouvelleScene(id, MODELE.replace('Nouvelle scène', creation!.trim()));
      setCreation(null);
      await charger();
      setChoisie(id);
    } catch (e) { notifier('Création impossible', (e as Error).message, 'erreur'); }
  }

  return (
    <div className="vue-scenes">
      <aside className="liste-scenes">
        {fichiers?.map((f) => {
          const b = bilans[f.id];
          return (
            <button key={f.id} className={`scene-ligne ${courante?.id === f.id ? 'actif' : ''}`} onClick={() => setChoisie(f.id)}>
              <span className="titre">{b?.titre || f.id}</span>
              <span className="code">{f.id}</span>
              {b?.erreurs ? <span className="pastille erreur">{b.erreurs}</span> : b?.alertes ? <span className="pastille alerte">{b.alertes}</span> : null}
            </button>
          );
        })}
        {creation !== null ? (
          <div className="carte-papier" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="saisie" autoFocus placeholder="Titre de la scène" value={creation} onChange={(e) => setCreation(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') creer(); if (e.key === 'Escape') setCreation(null); }} />
            <div className="code">contenu/scenes/{identifiant(creation) || '…'}.scene</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="bouton principal-b petit" disabled={!identifiant(creation)} onClick={creer}>Créer</button>
              <button className="bouton discret petit" onClick={() => setCreation(null)}>Annuler</button>
            </div>
          </div>
        ) : (
          <button className="bouton" style={{ justifyContent: 'center', marginTop: 6 }} onClick={() => setCreation('')}><Icone nom="plus" taille={16} /> Nouvelle scène</button>
        )}
      </aside>
      {fichiers === null ? <div className="vide manuscrit">Chargement…</div>
        : courante && contexteGlobal ? (
          <Atelier key={courante.id} fichier={courante} fichiers={fichiers} catalogue={catalogue} notifier={notifier} recharger={charger} setChoisie={setChoisie} />
        ) : <div className="vide manuscrit">Aucune scène pour l'instant : créez la première !</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function Atelier({ fichier, fichiers, catalogue, notifier, recharger, setChoisie }: {
  fichier: FichierScene; fichiers: FichierScene[]; catalogue: Catalogue;
  notifier: Props['notifier']; recharger: () => Promise<void>; setChoisie: (id: string | null) => void;
}) {
  const id = fichier.id;
  const editeur = useRef<PoigneeEditeur>(null);
  const [source, setSource] = useState(fichier.source);
  const enregistre = useRef(fichier.source);
  const [etat, setEtat] = useState<'' | 'modifie' | 'enregistre'>('');
  const [ligne, setLigne] = useState(1);
  const [apercu, setApercu] = useState<{ scene: Scene; depuis?: number; cle: number } | null>(null);
  const [suivre, setSuivre] = useState(() => lireStockage('atelier.scenes.suivre', true));
  const [sons, setSons] = useState(() => lireStockage('atelier.scenes.sons', true));
  const [musique, setMusique] = useState(() => lireStockage('atelier.scenes.musique', false));
  const [echoChemin, setEchoChemin] = useState(() => lireStockage('atelier.scenes.echo', 'echos/enfant/wrath.png'));
  const [echoNom, setEchoNom] = useState(() => lireStockage('atelier.scenes.echoNom', 'Filo'));
  const [valeurs, setValeurs] = useState<Record<string, string>>(() => lireStockage(`atelier.scenes.variables.${id}`, {}));
  const [aide, setAide] = useState(false);
  const [renommage, setRenommage] = useState<string | null>(null);
  const [confirmeSuppr, setConfirmeSuppr] = useState(false);
  const minuteurEnreg = useRef<ReturnType<typeof setTimeout>>();
  const minuteurSuivre = useRef<ReturnType<typeof setTimeout>>();
  const cadreApercu = useRef<HTMLDivElement>(null);

  useEffect(() => ecrireStockage('atelier.scenes.suivre', suivre), [suivre]);
  useEffect(() => ecrireStockage('atelier.scenes.sons', sons), [sons]);
  useEffect(() => ecrireStockage('atelier.scenes.musique', musique), [musique]);
  useEffect(() => ecrireStockage('atelier.scenes.echo', echoChemin), [echoChemin]);
  useEffect(() => ecrireStockage('atelier.scenes.echoNom', echoNom), [echoNom]);
  useEffect(() => ecrireStockage(`atelier.scenes.variables.${id}`, valeurs), [valeurs, id]);

  // Contexte de vérification, lu à la demande par l'éditeur (complétion, erreurs, couleurs).
  const contexte = useMemo(() => {
    const c = contexteScenes(catalogue, fichiers, id);
    const encres = Object.fromEntries(Object.values(catalogue.pnj).map((p) => [p.id, p.encre]));
    return { ...c, encres };
  }, [catalogue, fichiers, id]);
  const { scene, problemes } = useMemo(() => verifierSource(source, id, contexte), [source, id, contexte]);
  const variablesScene = useMemo(() => {
    const { lues, ecrites } = variablesDeScene(scene);
    return { lues: [...lues.keys()], ecrites: [...ecrites.keys()] };
  }, [scene]);
  const toutesVariables = useMemo(() => [...new Set([...variablesScene.lues, ...variablesScene.ecrites, ...contexte.variablesEcrites!, ...VARIABLES_DU_JEU])].sort(), [variablesScene, contexte]);
  const ctxRef = useRef({ ...contexte, variables: toutesVariables });
  ctxRef.current = { ...contexte, variables: toutesVariables };
  const idRef = useRef(id);
  const extensions = useMemo(() => extensionsScene({ id: () => idRef.current, contexte: () => ctxRef.current }), []);

  // Le fichier a changé sur le disque pendant qu'on ne l'éditait pas : on reprend sa version.
  useEffect(() => {
    if (fichier.source !== enregistre.current && source === enregistre.current) {
      enregistre.current = fichier.source;
      setSource(fichier.source);
      editeur.current?.remplacer(fichier.source);
      notifier('Scène mise à jour', 'Le fichier a été modifié en dehors de l’atelier.');
    }
  }, [fichier.source]); // eslint-disable-line react-hooks/exhaustive-deps

  const enregistrer = useCallback(async (texte: string) => {
    clearTimeout(minuteurEnreg.current);
    if (texte === enregistre.current) { setEtat('enregistre'); return; }
    try {
      await api.enregistrerScene(id, texte);
      enregistre.current = texte;
      setEtat('enregistre');
    } catch (e) { notifier('Enregistrement impossible', (e as Error).message, 'erreur'); }
  }, [id, notifier]);

  // Variables de test : celles que la scène lit, avec les valeurs choisies ici.
  const variablesApercu = useMemo(() => {
    const v: Record<string, Valeur> = { 'echo.nom': echoNom };
    for (const [k, t] of Object.entries(valeurs)) if (t.trim() !== '') v[k] = valeurDe(t);
    return v;
  }, [valeurs, echoNom]);

  const jouer = useCallback((depuis?: number) => {
    const { scene: s } = analyserScene(editeur.current?.texte() ?? source, id);
    setApercu((a) => ({ scene: s, depuis, cle: (a?.cle || 0) + 1 }));
  }, [source, id]);
  useEffect(() => { jouer(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function changement(texte: string) {
    setSource(texte);
    setEtat('modifie');
    clearTimeout(minuteurEnreg.current);
    minuteurEnreg.current = setTimeout(() => enregistrer(texte), 700);
    if (suivre) {
      clearTimeout(minuteurSuivre.current);
      minuteurSuivre.current = setTimeout(() => jouer(editeur.current?.ligneCurseur()), 900);
    }
  }
  useEffect(() => () => { clearTimeout(minuteurEnreg.current); clearTimeout(minuteurSuivre.current); }, []);

  async function renommer() {
    const nouveau = identifiant(renommage || '');
    setRenommage(null);
    if (!nouveau || nouveau === id) return;
    try {
      await enregistrer(editeur.current!.texte());
      const r = await api.renommerScene(id, nouveau);
      notifier(`Scène renommée : ${nouveau}`, r.modifiees.length ? `« aller: » mis à jour dans ${r.modifiees.join(', ')}` : undefined, 'ok');
      await recharger();
      setChoisie(nouveau);
    } catch (e) { notifier('Renommage impossible', (e as Error).message, 'erreur'); }
  }

  async function supprimer() {
    try {
      await api.supprimerScene(id);
      notifier('Scène mise de côté', 'Elle est dans contenu/.corbeille.', 'ok');
      await recharger();
      setChoisie(null);
    } catch (e) { notifier('Suppression impossible', (e as Error).message, 'erreur'); }
  }

  const echos = useMemo(() => catalogue.assets.filter((a) => a.echo && a.echo.stade !== 'graines'), [catalogue.assets]);
  const compte = (n: Probleme['niveau']) => problemes.filter((p) => p.niveau === n).length;
  const pnjEnScene = useMemo(() => {
    const ids = new Set<string>(scene.places.map((p) => p.qui));
    const parcourir = (ns: Scene['corps']) => ns.forEach((n) => {
      if (n.type === 'replique' || n.type === 'entre') ids.add(n.qui);
      if (n.type === 'si') n.branches.forEach((b) => parcourir(b.corps));
      if (n.type === 'choix') n.options.forEach((o) => parcourir(o.corps));
    });
    parcourir(scene.corps);
    return [...ids].filter((q) => catalogue.pnj[q]);
  }, [scene, catalogue.pnj]);

  const inserer = (t: string) => editeur.current?.inserer(t);

  return (
    <div className="atelier-scene">
      <section className="colonne-texte">
        <div className="barre-scene">
          {renommage !== null ? (
            <input className="saisie" autoFocus value={renommage} onChange={(e) => setRenommage(e.target.value)} onBlur={renommer} onKeyDown={(e) => { if (e.key === 'Enter') renommer(); if (e.key === 'Escape') setRenommage(null); }} style={{ width: 240 }} />
          ) : (
            <button className="bouton discret titre-scene" title="Renommer le fichier" onClick={() => setRenommage(id)}>{scene.titre || id} <span className="code">{id}.scene</span></button>
          )}
          <span className={`etat-enregistrement ${etat}`}>{etat === 'modifie' ? 'modifié…' : etat === 'enregistre' ? '✓ enregistré' : ''}</span>
          <span style={{ flex: 1 }} />
          <button className={`bouton petit ${aide ? 'principal-b' : ''}`} onClick={() => setAide(!aide)}>Mémo du format</button>
          {confirmeSuppr
            ? <button className="bouton petit danger" onClick={supprimer} onMouseLeave={() => setConfirmeSuppr(false)}>Confirmer ?</button>
            : <button className="bouton petit discret" title="Mettre la scène de côté" onClick={() => setConfirmeSuppr(true)}><Icone nom="corbeille" taille={15} /></button>}
        </div>
        <div className="palette">
          <span className="palette-titre">Insérer</span>
          {pnjEnScene.map((q) => (
            <button key={q} className="puce" style={{ color: catalogue.pnj[q].encre, borderColor: catalogue.pnj[q].encre + '66' }} onClick={() => inserer(`${q}: …`)}>{catalogue.pnj[q].nom}</button>
          ))}
          <button className="puce" onClick={() => inserer('narration: …')}>Narration</button>
          <button className="puce" onClick={() => inserer('écho: (…) ')}>Émotion de l'écho</button>
          <button className="puce" onClick={() => inserer('choix: Que répondre ?\n  > curiosité « … »\n    \n  > résolution « Réponse »\n    ')}>Choix</button>
          <button className="puce" onClick={() => inserer('si …:\n  \nsinon:\n  ')}>Condition</button>
          <button className="puce" onClick={() => inserer('entre: … G2')}>Entrée</button>
          <button className="puce" onClick={() => inserer('sort: …')}>Sortie</button>
          <button className="puce" onClick={() => inserer('… += 1')}>Variable</button>
        </div>
        {aide && <Memo />}
        <div className="zone-editeur">
          <EditeurCode ref={editeur} source={fichier.source} extensions={extensions} surChangement={changement} surCurseur={setLigne}
            raccourcis={{ jouerIci: () => jouer(editeur.current?.ligneCurseur()), enregistrer: () => enregistrer(editeur.current!.texte()) }} />
        </div>
        <div className="problemes">
          <div className="problemes-titre">
            {problemes.length ? (
              <>
                {compte('erreur') > 0 && <span className="pastille erreur">{compte('erreur')}</span>}
                {compte('alerte') > 0 && <span className="pastille alerte">{compte('alerte')}</span>}
                {compte('info') > 0 && <span className="pastille info">{compte('info')}</span>}
                <span>à regarder</span>
              </>
            ) : <span style={{ color: 'var(--valide)' }}>✓ Scène valide</span>}
            <span style={{ flex: 1 }} />
            <span className="code">ligne {ligne}</span>
          </div>
          <div className="problemes-liste">
            {problemes.map((p, i) => (
              <button key={i} className={`probleme ${p.niveau}`} onClick={() => editeur.current?.allerA(p.ligne)}>
                <span className="numero">l.{p.ligne}</span><span>{p.message}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="colonne-apercu">
        <div className="apercu-cadre" ref={cadreApercu}>
          {apercu && (
            <SceneDialogue key={apercu.cle} scene={apercu.scene} depuisLigne={apercu.depuis} catalogue={catalogue} apercu sons={sons} musique={musique}
              echo={{ nom: echoNom, chemin: echoChemin }} variables={variablesApercu} surLigne={(l) => editeur.current?.marquer(l)} />
          )}
        </div>
        <div className="commandes-apercu">
          <button className="bouton principal-b" onClick={() => jouer()}>▶ Depuis le début</button>
          <button className="bouton" onClick={() => jouer(ligne)} title="Ctrl + Entrée dans l'éditeur">▶ Depuis la ligne {ligne}</button>
          <button className="bouton discret" title="Voir l'aperçu en plein écran (Échap pour revenir)" onClick={() => cadreApercu.current?.requestFullscreen?.().catch(() => {})}>⛶ Plein écran</button>
          <span style={{ flex: 1 }} />
          <label className="interrupteur" title="L'aperçu rejoue la ligne que vous écrivez"><input type="checkbox" checked={suivre} onChange={(e) => setSuivre(e.target.checked)} /> Suivre l'écriture</label>
          <label className="interrupteur"><input type="checkbox" checked={sons} onChange={(e) => setSons(e.target.checked)} /> Voix</label>
          <label className="interrupteur"><input type="checkbox" checked={musique} onChange={(e) => setMusique(e.target.checked)} /> Musique</label>
        </div>
        <div className="reglages-apercu">
          <div className="section-titre">L'écho du joueur</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="saisie" value={echoNom} onChange={(e) => setEchoNom(e.target.value)} style={{ width: 120 }} aria-label="Nom de l'écho" />
            <select className="saisie" value={echoChemin} onChange={(e) => setEchoChemin(e.target.value)} style={{ flex: 1 }}>
              {['bebe', 'enfant', 'adolescent', 'adulte'].map((st) => (
                <optgroup key={st} label={{ bebe: 'Bébé', enfant: 'Enfant', adolescent: 'Adolescent', adulte: 'Adulte' }[st]}>
                  {echos.filter((a) => a.echo!.stade === st).map((a) => <option key={a.chemin} value={a.chemin}>{a.echo!.nom}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="section-titre">Variables au départ</div>
          {variablesScene.lues.filter((v) => !VARIABLES_DU_JEU.has(v)).length ? (
            <div className="table-variables">
              {variablesScene.lues.filter((v) => !VARIABLES_DU_JEU.has(v)).map((v) => (
                <label key={v}>
                  <span className="code">{v}</span>
                  <input className="saisie" placeholder="0" value={valeurs[v] ?? ''} onChange={(e) => setValeurs({ ...valeurs, [v]: e.target.value })} />
                </label>
              ))}
              <button className="bouton petit discret" onClick={() => setValeurs({})}>tout remettre à 0</button>
            </div>
          ) : <div style={{ fontSize: 13, color: 'var(--encre-3)' }}>Cette scène ne lit aucune variable. Les conditions « si … » les feront apparaître ici, pour tester chaque branche.</div>}
          {variablesScene.ecrites.length > 0 && (
            <div style={{ fontSize: 13, color: 'var(--encre-3)' }}>Modifiées par la scène : {variablesScene.ecrites.map((v) => <span key={v} className="code" style={{ marginRight: 8 }}>{v}</span>)}</div>
          )}
        </div>
      </section>
    </div>
  );
}

function Memo() {
  const lignes: [string, string][] = [
    ['titre: Garry au village', 'En tête : titre, décor, musique et personnages présents au début.'],
    ['décor: village/sanctuaire', 'Un décor de public/assets/decors (sans « .png »). Changer en cours de scène : même ligne plus bas.'],
    ['places: myhra G1, garry D2', 'Places : G1 (bord gauche), G2, D2, D1 (bord droit).'],
    ['myhra: Bonjour !', 'Une réplique. Le nom est l’identifiant de la fiche du PNJ.'],
    ['jumpy [rit]: Ha ha !', 'Avec une expression (le visage reste jusqu’au prochain changement).'],
    ['narration: Le vent se lève.', 'Texte du narrateur. « vous: … » fait parler le joueur.'],
    ['écho: (fier) Il se redresse.', 'Réaction de l’écho : une émotion, et une petite note facultative.'],
    ['entre: jumpy G2 [surpris]', 'Un personnage arrive. « sort: garry », « déplace: jumpy D1 ».'],
    ['choix: Que répondre ?', 'Puis, décalées dessous, les réponses : « > curiosité « Pourquoi ? » ».'],
    ['  > résolution « Non. » si garry.relation > 0', 'Une réponse peut n’apparaître que sous condition.'],
    ['garry.relation += 1', 'Variables : « = », « += », « -= ». « profil.… » est gardé d’une partie à l’autre.'],
    ['si garry.relation < 0:', 'Condition, puis « sinon si …: » et « sinon: ». Les lignes concernées sont décalées.'],
    ['{echo.nom}', 'Dans un texte, la valeur d’une variable (le nom de l’écho…).'],
    ['aller: foret-rencontre', 'Enchaîne sur une autre scène. « fin » arrête la scène.'],
    ['pause: 1.5', 'Un silence, en secondes.'],
    ['// note', 'Commentaire, ignoré par le jeu.']
  ];
  return (
    <div className="memo">
      {lignes.map(([c, d]) => <div key={c}><code>{c}</code><span>{d}</span></div>)}
      <div><code>Ctrl + Espace</code><span>Suggestions (personnages, expressions, émotions, décors…). Ctrl + Entrée : jouer depuis la ligne du curseur.</span></div>
    </div>
  );
}
