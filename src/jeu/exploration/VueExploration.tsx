// Vue de l'exploration : générée depuis la maquette « Exploration » (page v12 du canevas), sans logique.
// Ne pas modifier à la main : outils/maquettes/exploration/construire.py la produit ; la logique vit dans Exploration.tsx,
// qui calcule les valeurs `v`.
/* eslint-disable */
import { Fragment, type CSSProperties } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VueExploration({ v }: { v: any }) {
  return (
    <div className="ex12">
    {v.pret ? (<>
      <div className={v.regionCls} onPointerDown={v.geste}>
        {/* le décor : la lumière du jour s'applique au cadre entier */}
        <div className="ex-cadre" style={{ filter: v.filtre } as CSSProperties}>
          {v.aAncien ? (<>
            <div className={v.ancienCls} style={{ backgroundImage: `url(${v.ancien})` } as CSSProperties} />
          </>) : null}
          <div className={v.sensCls} style={{ backgroundImage: `url(${v.fond})` } as CSSProperties} />
          <div className="teinte" style={{ background: v.teinte } as CSSProperties} />
          <div className="chaleur" style={{ opacity: v.chaleur } as CSSProperties} />
        </div>
        <div className="ex-vignette" />
        {v.lanterne ? (<>
          <div className="lanterne" style={{ left: `${v.lanterneX}px`, top: `${v.lanterneY}px` } as CSSProperties} />
        </>) : null}
        {(v.motes || []).map((xM1: any, i1: number) => (
          <Fragment key={i1}>
            <div className="mote" style={{ "--y": `${xM1.y}px`, "--t": `${xM1.t}px`, "--d": `${xM1.d}s`, "--dx": `${xM1.dx}px`, "--c": xM1.c, animationDelay: `${xM1.delai}s` } as CSSProperties} />
          </Fragment>
        ))}
        {/* les passages : une flèche à la craie sur le chemin, le nom au survol */}
        {(v.passages || []).map((xP2: any, i2: number) => (
          <Fragment key={i2}>
            <div className={xP2.cls} style={{ left: `${xP2.x}px`, top: `${xP2.y}px`, animationDelay: `${xP2.delai}s` } as CSSProperties}>
              <div className="halo" />
              <svg className="fleche" viewBox="-36 -36 72 72" style={{ transform: `rotate(${xP2.a}deg)` } as CSSProperties} aria-hidden="true">
                <g>
                  <path className="ombre" d="M-17 6 L0 -9 L17 6 M-13 22 L0 10 L13 22" />
                  <path d="M-17 6 C-11 1 -5 -4 0 -9 C5 -4 11 1 17 6" />
                  <path d="M-13 22 C-8 18 -4 14 0 10 C4 14 8 18 13 22" />
                  <path className="croix" d="M-16 -16 L16 24 M16 -16 L-16 24" />
                </g>
              </svg>
              <button onClick={xP2.aller} onMouseEnter={xP2.entrer} onMouseLeave={xP2.sortir} aria-label={xP2.nom} />
              <span className={xP2.etiqCls}>
                {xP2.nom}
              </span>
            </div>
          </Fragment>
        ))}
        <div className={v.retour.cls}>
          <div className="halo" />
          <svg className="fleche" viewBox="-36 -36 72 72" style={{ transform: "rotate(180deg) scale(.8)" } as CSSProperties} aria-hidden="true">
            <g>
              <path className="ombre" d="M-17 6 L0 -9 L17 6 M-13 22 L0 10 L13 22" />
              <path d="M-17 6 C-11 1 -5 -4 0 -9 C5 -4 11 1 17 6" />
              <path d="M-13 22 C-8 18 -4 14 0 10 C4 14 8 18 13 22" />
            </g>
          </svg>
          <button onClick={v.retour.faire} onMouseEnter={v.retour.entrer} onMouseLeave={v.retour.sortir} aria-label={v.retour.nom} />
          <span className="etiq-passage droite">
            {v.retour.nom}
          </span>
        </div>
        {/* les personnages du lieu : posés dans le décor comme l'écho, on leur parle d'un clic */}
        {(v.pnj || []).map((xN3: any, i3: number) => (
          <Fragment key={i3}>
            <div className={xN3.cls} style={{ left: `${xN3.x}px`, top: `${xN3.y}px`, width: `${xN3.l}px`, height: `${xN3.h}px`, zIndex: xN3.z } as CSSProperties}>
              <div className="pnj-corps">
                <img src={xN3.src} alt="" style={{ width: `${xN3.iw}px`, height: `${xN3.ih}px`, left: `${xN3.ix}px`, top: `${xN3.iy}px` } as CSSProperties} />
              </div>
              <button onClick={xN3.parler} onMouseEnter={xN3.entrer} onMouseLeave={xN3.sortir} aria-label={xN3.nom} />
              <span className="etiq-pnj">
                {xN3.nom}
              </span>
            </div>
          </Fragment>
        ))}
        {/* ce qu'on peut faire ici : une étiquette de bois clouée dans le décor */}
        {(v.boutonsScene || []).map((xB4: any, i4: number) => (
          <Fragment key={i4}>
            <button className={xB4.cls} style={{ left: `${xB4.x}px`, top: `${xB4.y}px` } as CSSProperties} onClick={xB4.faire}>
              {xB4.libelle}
            </button>
          </Fragment>
        ))}
        {/* un appel au secours (le sentier solitaire) */}
        {v.appel ? (<>
          <div className="appel">
            <div className="appel-cri main">
              Au secours ! Aidez-moi !
            </div>
            <button className="btn rouge" onClick={v.allerVoir}>
              Aller voir
            </button>
          </div>
        </>) : null}
        {/* Filo */}
        <div className={v.filo.cls} style={{ left: `${v.filo.x}px`, top: `${v.filo.y}px`, transform: `scale(${v.filo.s})`, opacity: v.filo.o, transitionDuration: `${v.filo.duree}ms` } as CSSProperties}>
          <div className="filo-ombre" />
          <div className="filo-corps">
            <img src={v.filo.src} alt={v.echoNom} style={{ transform: `translateX(-50%) scaleX(${v.filo.flip})` } as CSSProperties} />
          </div>
          <div className="orbite">
            {(v.filo.signes || []).map((xG5: any, i5: number) => (
              <Fragment key={i5}>
                <div className="signe" style={{ left: `${xG5.a}px`, top: "0" } as CSSProperties}>
                  <img src={xG5.src} alt={xG5.nom} title={xG5.nom} />
                </div>
              </Fragment>
            ))}
          </div>
          {v.filo.bulle ? (<>
            <div className="bulle" key={v.filo.bulleId}>
              <img src={v.filo.bulle} alt="" />
            </div>
          </>) : null}
        </div>
        {/* la page du jour, glissée hors du carnet d'éleveur */}
        <div className="carnet" aria-label="Lieu et heure">
          <div className="cuir" />
          <div className="feuillet" />
          <div className="ruban" />
          <div className="date">
            {v.jourTexte}, {v.periode}
          </div>
          <div className={v.lieuCls} key={v.lieuCle}>
            {v.lieu}
          </div>
          <div className="heure">
            {v.heure}
          </div>
          <div className="tampon-region">
            {v.region}
          </div>
        </div>
        {/* la carte et le sac */}
        <button className={`cote ${v.coteCls}`} style={{ top: "18px" } as CSSProperties} onClick={v.ouvrirCarte} aria-label="Ouvrir la carte">
          <svg width="96" height="92" viewBox="0 0 96 92" aria-hidden="true">
            <path d="M14 22l22-8 24 8 22-8v54l-22 8-24-8-22 8z" fill="#e6d4a8" stroke="#3a2a16" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M36 14v54M60 22v54" stroke="#3a2a16" strokeWidth="1.6" opacity=".55" />
            <path d="M20 54c8-6 12 4 20-2s10-14 18-10 10 8 18 2" fill="none" stroke="#7b2f20" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="66" cy="44" r="4" fill="#a33a22" stroke="#3a1f0e" strokeWidth="1.2" />
            <path d="M22 32c5 0 6-6 12-4" fill="none" stroke="#5c6238" strokeWidth="2" />
          </svg>
          <span className="etiq">
            carte
          </span>
        </button>
        <button className={`cote ${v.coteCls}`} style={{ top: "128px" } as CSSProperties} onClick={v.ouvrirSac} aria-label="Ouvrir le sac">
          <svg width="96" height="92" viewBox="0 0 86 92" aria-hidden="true">
            <path d="M14 44 C10 10 76 10 72 44" fill="none" stroke="#3a1f0e" strokeWidth="8" strokeLinecap="round" />
            <path d="M14 44 C10 10 76 10 72 44" fill="none" stroke="#8a5530" strokeWidth="5" strokeLinecap="round" />
            <path d="M14 44 C10 10 76 10 72 44" fill="none" stroke="rgba(240,214,170,.55)" strokeWidth="1.2" strokeDasharray="3 3" />
            <path d="M10 42h66l-4 34c-1 6-5 9-11 9H25c-6 0-10-3-11-9z" fill="#6e3f22" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M16 48h54l-3 26c-1 4-3 6-7 6H26c-4 0-6-2-7-6z" fill="none" stroke="rgba(240,214,170,.55)" strokeWidth="1.4" strokeDasharray="4 3" />
            <path d="M9 40h68v12c0 6-5 10-11 10H20c-6 0-11-4-11-10z" fill="#7d4a28" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <rect x="37" y="54" width="12" height="14" rx="2.5" fill="#c9a050" stroke="#3a2410" strokeWidth="1.8" />
            <rect x="41" y="58" width="4" height="6" rx="1" fill="#3a2410" />
          </svg>
          <span className="etiq">
            sac
          </span>
        </button>
        {/* gestes de terrain */}
        <div className={v.gestesCls}>
          {(v.gestes || []).map((xG6: any, i6: number) => (
            <Fragment key={i6}>
              <button className={xG6.cls} style={{ animationDelay: `${xG6.delai}s` } as CSSProperties} onClick={xG6.faire} aria-label={xG6.nom}>
                <img src={xG6.img} alt="" />
                <span className="lib">
                  <b>
                    {xG6.nom}
                  </b>
                  <i>
                    {xG6.note}
                  </i>
                </span>
              </button>
            </Fragment>
          ))}
        </div>
        {/* fouiller */}
        {v.aFouille ? (<>
          <div className="voile-noir" />
          <section className="page fouille" aria-label="Fouille">
            <i className="punaise" style={{ left: "60px" } as CSSProperties} />
            <i className="punaise" style={{ right: "60px" } as CSSProperties} />
            <h2>
              Fouiller les environs
            </h2>
            <div className="cachettes">
              {(v.fouille.cartes || []).map((xC7: any, i7: number) => (
                <Fragment key={i7}>
                  <button className={xC7.cls} style={{ animationDelay: `${xC7.delai}s` } as CSSProperties} onClick={xC7.retourner}>
                    <span className="verso">
                      <svg viewBox="0 0 60 60" aria-hidden="true">
                        <circle cx="26" cy="26" r="14" fill="none" stroke="#f3e8c8" strokeWidth="4" />
                        <path d="M36 36l14 14" stroke="#f3e8c8" strokeWidth="6" strokeLinecap="round" />
                      </svg>
                      <span className="lieu">
                        {xC7.lieu}
                      </span>
                    </span>
                    <span className="recto">
                      {xC7.objet ? (<>
                        <img src={xC7.icone} alt="" />
                        <span className="nom">
                          {xC7.nom}
                        </span>
                      </>) : null}
                      {xC7.echo ? (<>
                        <span className="yeux">
                          <i />
                          <i />
                        </span>
                        <span className="nom">
                          Un écho !
                        </span>
                      </>) : null}
                      {xC7.vide ? (<>
                        <svg viewBox="0 0 70 40" aria-hidden="true">
                          <path d="M6 24c8-14 14 10 22-2s12-10 18 2 12 6 18-4" fill="none" stroke="#6b5a3e" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <span className="nom">
                          Rien
                        </span>
                      </>) : null}
                      <span className="lieu">
                        {xC7.lieu}
                      </span>
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
            <div className="bas">
              <div className="ligne">
                {v.fouille.message}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" } as CSSProperties}>
                <div className="butin">
                  {(v.fouille.gains || []).map((xO8: any, i8: number) => (
                    <Fragment key={i8}>
                      <img src={xO8.icone} alt={xO8.nom} title={xO8.nom} />
                    </Fragment>
                  ))}
                </div>
                <button className="btn" onClick={v.fermerFouille}>
                  {v.fouille.bouton}
                </button>
              </div>
            </div>
          </section>
        </>) : null}
        {/* récolter */}
        {v.aRecolte ? (<>
          {!v.recolteFin ? (<>
            <div className="recolte-travail main">
              Vous ramassez ce qui traîne…
            </div>
          </>) : null}
          {v.recolteFin ? (<>
            <div className="voile-noir" />
            <section className="page resultat">
              <i className="punaise" style={{ left: "60px" } as CSSProperties} />
              <h2>
                Récolte
              </h2>
              <div className="ressources-gagnees">
                {(v.recolte.gains || []).map((xR9: any, i9: number) => (
                  <Fragment key={i9}>
                    <span>
                      <img src={xR9.image} alt="" />
                      {xR9.texte}
                    </span>
                  </Fragment>
                ))}
              </div>
              <div className="ligne">
                {v.recolte.texte}
              </div>
              <div className="boutons">
                <button className="btn" onClick={v.fermerRecolte}>
                  Ranger
                </button>
              </div>
            </section>
          </>) : null}
        </>) : null}
        {/* pêcher */}
        {v.aPeche ? (<>
          <div className={v.peche.cls}>
            <svg className="peche-ligne" viewBox="0 0 1280 800" aria-hidden="true">
              <path className="canne" d="M1290 760 L1150 300" />
              <path className="canne2" d="M1290 760 L1150 300" />
              <path className="fil" d={v.peche.ligne} />
            </svg>
            <div className="bouchon" style={{ left: `${v.peche.x}px`, top: `${v.peche.y}px` } as CSSProperties}>
              <b />
              <i />
            </div>
            {v.peche.enCours ? (<>
              <div className="peche-panneau">
                <div className="consigne main">
                  {v.peche.consigne}
                </div>
              </div>
              <button className="btn bois ferrer" onClick={v.ferrer}>
                Ferrer !
              </button>
            </>) : null}
            {v.peche.fini ? (<>
              <div className="voile-noir" />
              <section className="page resultat">
                <i className="punaise" style={{ left: "60px" } as CSSProperties} />
                <h2>
                  {v.peche.titre}
                </h2>
                {v.peche.objet ? (<>
                  <div className="prise">
                    <img src={v.peche.objet.icone} alt="" />
                    <b>
                      {v.peche.objet.nom}
                    </b>
                  </div>
                </>) : null}
                <div className="ligne">
                  {v.peche.texte}
                </div>
                <div className="boutons">
                  <button className="btn bois" onClick={v.fermerPeche}>
                    Ranger la canne
                  </button>
                  <button className="btn" onClick={v.relancer}>
                    Relancer
                  </button>
                </div>
              </section>
            </>) : null}
          </div>
        </>) : null}
        {/* envoyer Filo */}
        {v.envoiFouine ? (<>
          <div className="fourres" style={{ left: `${v.envoiX}px`, top: `${v.envoiY}px` } as CSSProperties}>
            <i style={{ "--dx": "-40px" } as CSSProperties} />
            <i style={{ "--dx": "30px", animationDelay: ".3s" } as CSSProperties} />
            <i style={{ "--dx": "-10px", animationDelay: ".6s" } as CSSProperties} />
            <i style={{ "--dx": "50px", animationDelay: ".9s" } as CSSProperties} />
            <i style={{ "--dx": "-60px", animationDelay: ".45s" } as CSSProperties} />
            <div className="main">
              {v.envoiFouineTexte}
            </div>
          </div>
        </>) : null}
        {v.envoiResultat ? (<>
          <div className="voile-noir" />
          <section className="page resultat">
            <i className="punaise" style={{ left: "60px" } as CSSProperties} />
            <h2>
              {v.envoiTitre}
            </h2>
            {v.envoi.objet ? (<>
              <div className="prise">
                <img src={v.envoi.objet.icone} alt="" />
                <b>
                  {v.envoi.objet.nom}
                </b>
              </div>
            </>) : null}
            <div className="ligne">
              {v.envoi.texte}
            </div>
            <div className="boutons">
              <button className="btn" onClick={v.fermerEnvoi}>
                {v.merciTexte}
              </button>
            </div>
          </section>
        </>) : null}
        {/* un écho sauvage */}
        {v.aRencontre ? (<>
          <div className={v.rencontre.cls}>
            <div className="sauvage" style={{ left: `${v.rencontre.x}px`, top: `${v.rencontre.y}px`, transform: `scale(${v.rencontre.s})` } as CSSProperties}>
              <div className="ombre" />
              <img src={v.rencontre.src} alt={v.rencontre.nom} style={{ transform: `translateX(-50%) scaleX(${v.rencontre.flip})` } as CSSProperties} />
            </div>
            {v.rencontre.banniere ? (<>
              <div className="alerte" style={{ left: `${v.rencontre.x}px`, top: `${v.rencontre.alerteY}px` } as CSSProperties}>
                !
              </div>
              <div className="banniere" key={v.rencontre.banniere}>
                {v.rencontre.banniere}
              </div>
            </>) : null}
            {v.rencontre.choix ? (<>
              <section className="page choix">
                <i className="punaise" style={{ left: "60px" } as CSSProperties} />
                <div className="nom-sauvage">
                  {v.rencontre.nom}
                </div>
                <div className="ligne">
                  {v.rencontre.reaction}
                </div>
                {v.rencontre.aEnjeu ? (<>
                  <div className="enjeu">
                    Vos trouvailles gisent à ses pieds :
                    {(v.rencontre.enjeu || []).map((xO10: any, i10: number) => (
                      <Fragment key={i10}>
                        <img src={xO10.icone} alt={xO10.nom} title={xO10.nom} />
                      </Fragment>
                    ))}
                  </div>
                </>) : null}
                <div className="boutons">
                  <button className="btn bois" onClick={v.eclipser}>
                    S’éclipser
                  </button>
                  {v.rencontre.peutCombattre ? (<>
                    <button className="btn rouge" onClick={v.affronter}>
                      Affronter
                    </button>
                  </>) : null}
                </div>
              </section>
            </>) : null}
            {v.rencontre.combat ? (<>
              <section className="page choix">
                <i className="punaise" style={{ left: "60px" } as CSSProperties} />
                {v.rencontre.coupe ? (<>
                  <div className="ligne" style={{ color: "#9c3b2a" } as CSSProperties}>
                    {v.rencontre.coupe}
                  </div>
                </>) : null}
                <div className="ligne">
                  {v.rencontre.engage}
                </div>
              </section>
            </>) : null}
            {v.rencontre.issue ? (<>
              <section className="page choix">
                <i className="punaise" style={{ left: "60px" } as CSSProperties} />
                <div className="ligne">
                  {v.rencontre.texte}
                </div>
                <div className="boutons">
                  {v.rencontre.defaite ? (<>
                    <button className="btn bois" onClick={v.fermerRencontre}>
                      Continuer quand même
                    </button>
                    <button className="btn rouge" onClick={v.rentrerBlesse}>
                      Rentrer le soigner
                    </button>
                  </>) : null}
                  {!v.rencontre.defaite ? (<>
                    <button className="btn" onClick={v.fermerRencontre}>
                      Reprendre la route
                    </button>
                  </>) : null}
                </div>
              </section>
            </>) : null}
          </div>
        </>) : null}
        {/* la tente : un abri pour s'occuper de Filo */}
        {v.aTente ? (<>
          <div className={v.tente.cls}>
            <div className="dehors" style={{ backgroundImage: `url(${v.tente.fond})`, filter: `blur(5px) ${v.tente.filtre}` } as CSSProperties} />
            <div className="toile" />
            <div className="couture" />
            <div className="sol" />
            <div className="natte" />
            <div className="lampe" />
            <div className="grand-filo">
              <div className="filo-ombre" />
              <img src={v.tente.echo} alt={v.echoNom} />
            </div>
            <div className="orbite">
              {(v.tente.signes || []).map((xG11: any, i11: number) => (
                <Fragment key={i11}>
                  <div className="signe" style={{ left: `${xG11.a}px`, top: "0" } as CSSProperties}>
                    <img src={xG11.src} alt={xG11.nom} title={xG11.nom} />
                  </div>
                </Fragment>
              ))}
            </div>
            {v.tente.bulle ? (<>
              <div className="bulle" key={v.tente.bulleId}>
                <img src={v.tente.bulle} alt="" />
              </div>
            </>) : null}
            <div className="zzz">
              z z z
            </div>
            <div className="nuit" />
            {v.tente.texte ? (<>
              <div className="mot" key={v.tente.texte}>
                {v.tente.texte}
              </div>
            </>) : null}
            {v.tente.choixRepas ? (<>
              <div className="repas">
                {(v.tente.repas || []).map((xR12: any, i12: number) => (
                  <Fragment key={i12}>
                    <button onClick={xR12.donner} title={xR12.nom} aria-label={`Donner : ${xR12.nom}`}>
                      <img src={xR12.icone} alt="" />
                      <b>
                        {xR12.qte}
                      </b>
                    </button>
                  </Fragment>
                ))}
              </div>
            </>) : null}
            <div className="soins">
              {(v.tente.soins || []).map((xG13: any, i13: number) => (
                <Fragment key={i13}>
                  <button className={xG13.cls} onClick={xG13.faire} aria-label={xG13.nom}>
                    <img src={xG13.img} alt="" />
                    <span className="lib">
                      <b>
                        {xG13.nom}
                      </b>
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
            <button className="btn bois sortir" onClick={v.sortirTente}>
              Sortir de la tente
            </button>
          </div>
        </>) : null}
        {/* la carte : l'illustration, voilée de brume là où l'on n'est pas encore allé */}
        {v.aCarte ? (<>
          <div className="voile-noir" onClick={v.fermerCarte} />
          <section className="page carte" aria-label="Carte">
            <svg className="plan" viewBox="0 0 1586 992" aria-hidden="true">
              <defs>
                <radialGradient id="trou">
                  <stop offset="0" stopColor="#000" stopOpacity="1" />
                  <stop offset=".5" stopColor="#000" stopOpacity=".95" />
                  <stop offset="1" stopColor="#000" stopOpacity="0" />
                </radialGradient>
                <mask id="brume" maskUnits="userSpaceOnUse" x="0" y="0" width="1586" height="992">
                  <rect x="0" y="0" width="1586" height="992" fill="#fff" />
                  {(v.carte.trous || []).map((xT14: any, i14: number) => (
                    <Fragment key={i14}>
                      <circle cx={xT14.x} cy={xT14.y} r={xT14.r} fill="url(#trou)" opacity={xT14.o} />
                    </Fragment>
                  ))}
                </mask>
              </defs>
              <image href={v.carte.image} x="0" y="0" width="1586" height="992" preserveAspectRatio="none" />
              <image className="brume" href={v.carte.brume} x="0" y="0" width="1586" height="992" preserveAspectRatio="none" mask="url(#brume)" />
              {(v.carte.lieux || []).map((xL15: any, i15: number) => (
                <Fragment key={i15}>
                  <g className={xL15.cls} transform={`translate(${xL15.x},${xL15.y})`}>
                    <circle className="zone-survol" r="26" />
                    <circle className="point" r={xL15.r} />
                    {xL15.inconnu ? (<>
                      <text className="q" x="0" y="8" textAnchor="middle">
                        ?
                      </text>
                    </>) : null}
                    {!xL15.inconnu ? (<>
                      <text className="nom" x="0" y="-22" textAnchor="middle">
                        {xL15.nom}
                      </text>
                    </>) : null}
                  </g>
                </Fragment>
              ))}
              <g className="epingle" transform={`translate(${v.carte.piqueX},${v.carte.piqueY})`}>
                <ellipse cx="3" cy="2" rx="9" ry="4" fill="rgba(0,0,0,.35)" />
                <path d="M0 0 L-3 -40 L3 -40z" fill="#5a5a5a" />
                <circle cx="0" cy="-46" r="12" fill="#a33a22" stroke="#5e1c0e" strokeWidth="2" />
                <circle cx="-4" cy="-50" r="3.5" fill="rgba(255,255,255,.5)" />
              </g>
            </svg>
            <div className="cartouche">
              <h2>
                Carte des environs
              </h2>
              <div className="legende">
                se découvre au fil de vos pas
              </div>
            </div>
            <i className="punaise" style={{ left: "18px", top: "-6px" } as CSSProperties} />
            <i className="punaise" style={{ right: "18px", top: "-6px" } as CSSProperties} />
            <i className="punaise" style={{ left: "18px", top: "auto", bottom: "-8px" } as CSSProperties} />
            <i className="punaise" style={{ right: "18px", top: "auto", bottom: "-8px" } as CSSProperties} />
            <button className="fermer" onClick={v.fermerCarte} aria-label="Fermer la carte">
              ×
            </button>
          </section>
        </>) : null}
        {/* Le sac ouvert : 10 emplacements */}
        {v.sacVisible ? (<>
          <button className={`voile ${v.sacVoileCls}`} onClick={v.fermerSac} aria-label="Fermer le sac" style={{ animationDelay: `${v.sacVoileDelai}s` } as CSSProperties} />
          <section className={`sacoche ${v.sacCls}`} aria-label="Sac" style={{ filter: v.paperFilter } as CSSProperties}>
            <svg width="620" height="140" viewBox="0 0 620 140" aria-hidden="true" style={{ position: "absolute", left: "0", top: "-60px" } as CSSProperties}>
              <path d="M60 140 C40 20 580 20 560 140" fill="none" stroke="#3a1f0e" strokeWidth="22" strokeLinecap="round" />
              <path d="M60 140 C40 20 580 20 560 140" fill="none" stroke="#8a5530" strokeWidth="16" strokeLinecap="round" />
              <path d="M60 140 C40 20 580 20 560 140" fill="none" stroke="rgba(240,214,170,.5)" strokeWidth="1.6" strokeDasharray="5 4" />
            </svg>
            <div className="sac-corps">
              <div className="stitch" style={{ borderRadius: "18px 18px 54px 54px" } as CSSProperties} />
              <div className="sac-poche">
                {(v.sacCases || []).map((xC16: any, i16: number) => (
                  <Fragment key={i16}>
                    <button className={`case ${xC16.cls}`} style={{ animationDelay: `${xC16.delai}s` } as CSSProperties} draggable={xC16.plein} onDragStart={xC16.prendreDnd} onDragOver={xC16.survolDnd} onDragLeave={xC16.quitteDnd} onDrop={xC16.deposer} onDragEnd={xC16.finDnd} onMouseEnter={xC16.survol} onClick={xC16.choisir} aria-disabled={!!(xC16.vide)} aria-haspopup="menu" aria-label={xC16.nom}>
                      {xC16.plein ? (<>
                        <img src={xC16.image} alt="" />
                        <span className="sceau qte" style={{ background: "#6e3f22" } as CSSProperties}>
                          {xC16.qte}
                        </span>
                      </>) : null}
                    </button>
                  </Fragment>
                ))}
              </div>
              {/* menu d'un objet : Infos / Utiliser */}
              {v.sacMenuVisible ? (<>
                <div className="sac-menu" role="menu" style={{ left: `${v.sacMenuX}px`, top: `${v.sacMenuY}px` } as CSSProperties} onClick={v.arreter}>
                  <div className="sm-nom">
                    {v.sacMenuNom}
                  </div>
                  {v.sacMenuInfo ? (<>
                    <div className="sm-info">
                      {v.sacMenuTexte}
                    </div>
                  </>) : null}
                  <div className="sm-boutons">
                    <button className="sm-btn" role="menuitem" onClick={v.sacInfos} aria-pressed={v.sacMenuInfo}>
                      Infos
                    </button>
                    <button className="sm-btn sm-ok" role="menuitem" onClick={v.sacUtiliser}>
                      Utiliser
                    </button>
                  </div>
                </div>
              </>) : null}
              {/* ressources rapportées d'exploration */}
              <div className="sac-info sac-ressources" aria-label="Ressources">
                <span className="sr-titre">
                  ressources
                </span>
                {(v.ressourcesSac || []).map((xR17: any, i17: number) => (
                  <Fragment key={i17}>
                    <span className={`sr ${xR17.cls}`} title={xR17.nom}>
                      <img src={xR17.image} alt={xR17.nom} />
                      <b>
                        {xR17.qte}
                      </b>
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="sac-rabat">
              <div className="face" style={{ borderRadius: "22px 22px 34px 34px", background: "#7d4a28", boxShadow: "inset 0 0 0 2px #3a1f0e,inset 0 0 0 8px #7d4a28,inset 0 0 26px rgba(30,14,4,.45),0 10px 22px rgba(10,6,2,.45)" } as CSSProperties}>
                <div className="stitch" style={{ borderRadius: "16px 16px 28px 28px" } as CSSProperties} />
                <div style={{ position: "absolute", left: "50%", bottom: "-14px", width: "46px", height: "56px", marginLeft: "-23px", borderRadius: "6px", background: "#c9a050", boxShadow: "inset 0 0 0 2.5px #3a2410,0 4px 8px rgba(0,0,0,.35)" } as CSSProperties}>
                  <div style={{ position: "absolute", left: "17px", top: "16px", width: "12px", height: "22px", borderRadius: "3px", background: "#3a2410" } as CSSProperties} />
                </div>
              </div>
              <div className="face dos" style={{ borderRadius: "22px 22px 34px 34px", background: "#4a2814", boxShadow: "inset 0 0 0 2px #3a1f0e" } as CSSProperties} />
            </div>
            <button onClick={v.fermerSac} aria-label="Fermer le sac" style={{ position: "absolute", right: "-16px", top: "40px", width: "46px", height: "46px", border: "none", borderRadius: "50%", background: "rgba(244,234,214,.94)", color: "#3a1f0e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(0,0,0,.4)", zIndex: "3" } as CSSProperties}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </section>
        </>) : null}
        {v.toast ? (<>
          <div className="toast" key={v.toast.id}>
            {v.toast.texte}
          </div>
        </>) : null}
        {/* retour au ranch */}
        {v.aFin ? (<>
          <div className="voile-noir" />
          <section className="page fin">
            <i className="punaise" style={{ left: "60px" } as CSSProperties} />
            <div className="tampon">
              Sortie
              <br />
              notée
            </div>
            <h2>
              {v.fin.titre}
            </h2>
            {v.finVide ? (<>
              <div className="ligne" style={{ margin: "12px 0" } as CSSProperties}>
                Les poches vides, mais les jambes pleines de chemin.
              </div>
            </>) : null}
            <div className="objets">
              {(v.fin.objets || []).map((xO18: any, i18: number) => (
                <Fragment key={i18}>
                  <span className="objet">
                    <img src={xO18.icone} alt="" />
                    {xO18.texte}
                  </span>
                </Fragment>
              ))}
              {(v.fin.materiaux || []).map((xO19: any, i19: number) => (
                <Fragment key={i19}>
                  <span className="objet">
                    <img src={xO19.icone} alt="" />
                    {xO19.texte}
                  </span>
                </Fragment>
              ))}
            </div>
            <div className="ligne">
              {v.fin.lieux}
            </div>
            <div className="ligne" style={{ marginTop: "8px" } as CSSProperties}>
              {v.fin.filo}
            </div>
            <div className="boutons">
              <button className="btn" onClick={v.repartir}>
                {v.finBouton}
              </button>
            </div>
          </section>
        </>) : null}
      </div>
    </>) : null}
    </div>
  );
}
