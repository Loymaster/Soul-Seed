// Vue du ranch : générée depuis la maquette « Ranch » (page v7) du canevas, sans logique.
// Ne pas modifier à la main : la logique vit dans Ranch.tsx, qui calcule les valeurs `v`.
/* eslint-disable */
import { Fragment, type CSSProperties } from 'react';

const A = `${import.meta.env.BASE_URL}assets/`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VueRanch({ v }: { v: any }) {
  return (
    <>
    <div className="r7" style={{ width: "1280px", height: "800px", position: "relative", overflow: "hidden", fontFamily: "'Alegreya',Georgia,serif", color: "#2b2118", background: "#1b1a2c", userSelect: "none", "--ft": v.fondTexte, "--ui": v.paperFilter } as CSSProperties}>
      <svg width="0" height="0" style={{ position: "absolute" } as CSSProperties} aria-hidden="true">
        <defs>
          <filter id="rk7Decor" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={v.matDecor} />
          </filter>
          <filter id="rk7Ui" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={v.matUi} />
          </filter>
          <filter id="rk7Echo" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={v.matEcho} />
          </filter>
        </defs>
      </svg>
      {/* Décor : une seule illustration (le jour) ; l'heure joue sur la lumière, pas sur l'image */}
      <div className="ciel" aria-hidden="true">
        <div className="ciel-fond" style={{ background: `linear-gradient(180deg,${v.cielHaut} 0%,${v.cielMilieu} 48%,${v.cielBas} 100%)` } as CSSProperties} />
        <div className="ciel-etoiles" style={{ opacity: v.cielEtoiles } as CSSProperties} />
        <div className="astre soleil" style={{ transform: `translate(${v.soleilX}px,${v.soleilY}px)`, opacity: v.soleilOp } as CSSProperties} />
        <img className="astre lune" src={`${A}decors/ranch/lune.webp`} alt="" style={{ transform: `translate(${v.luneX}px,${v.luneY}px)`, opacity: v.luneOp } as CSSProperties} />
        {/* quelques nuages épars, de tailles et de transparences différentes, qui traversent lentement le ciel */}
        <div className="nuages" style={{ opacity: v.nuagesPres, filter: v.nuagesFiltre } as CSSProperties}>
          <img className="nuage" src={`${A}decors/ranch/nuage-g2.webp`} alt="" style={{ width: "230px", top: "38px", opacity: "0.95", "--fin": "-630px", animationDuration: "560s", animationDelay: "-215s" } as CSSProperties} />
          <img className="nuage" src={`${A}decors/ranch/nuage-g0.webp`} alt="" style={{ width: "196px", top: "128px", opacity: "0.8", "--fin": "-596px", animationDuration: "430s", animationDelay: "-267s" } as CSSProperties} />
          <img className="nuage" src={`${A}decors/ranch/nuage-g3.webp`} alt="" style={{ width: "164px", top: "16px", opacity: "0.62", "--fin": "-564px", animationDuration: "500s", animationDelay: "-120s" } as CSSProperties} />
          <img className="nuage" src={`${A}decors/ranch/nuage-g4.webp`} alt="" style={{ width: "340px", top: "168px", opacity: "0.42", "--fin": "-740px", animationDuration: "760s", animationDelay: "-380s" } as CSSProperties} />
          <img className="nuage" src={`${A}decors/ranch/nuage-g1.webp`} alt="" style={{ width: "124px", top: "82px", opacity: "0.55", "--fin": "-524px", animationDuration: "360s", animationDelay: "-41s" } as CSSProperties} />
          <img className="nuage" src={`${A}decors/ranch/nuage-b1.webp`} alt="" style={{ width: "104px", top: "206px", opacity: "0.5", "--fin": "-504px", animationDuration: "400s", animationDelay: "-134s" } as CSSProperties} />
        </div>
      </div>
      <div className="ranch" style={{ filter: v.bgFilter } as CSSProperties} />
      {/* la lumière du moment ne teinte que le ranch (calque masqué par son détourage), pas le ciel */}
      <div style={{ position: "absolute", inset: "0", mixBlendMode: "multiply", background: v.gradeColor, opacity: v.gradeOpacity, transition: "all 1.2s ease", pointerEvents: "none", WebkitMask: `url(${A}decors/ranch/detoure.webp) center 62%/cover no-repeat`, mask: `url(${A}decors/ranch/detoure.webp) center 62%/cover no-repeat` } as CSSProperties} />
      <div style={{ position: "absolute", left: "260px", top: "120px", width: "760px", height: "520px", borderRadius: "50%", mixBlendMode: "screen", background: "radial-gradient(ellipse,rgba(255,190,110,.42) 0%,rgba(255,160,80,.12) 40%,transparent 68%)", opacity: v.glow, transition: "opacity 1.2s ease", pointerEvents: "none" } as CSSProperties} />
      {/* Lanternes (arbre, porte de la grange) : allumées du soir à l'aube. Autour d'elles, le ranch réapparaît
       sans le voile de nuit, réchauffé : copie du décor masquée par une carte de lumière qui épargne le lointain
       (montagnes, arbres au loin restent dans l'obscurité) ; puis halo et flamme qui vacillent. */}
      <div style={{ position: "absolute", inset: "0", opacity: v.lanternes, transition: "opacity 1.2s linear", pointerEvents: "none" } as CSSProperties}>
        <div className="lanterne-vacille" style={{ position: "absolute", inset: "0" } as CSSProperties}>
          <div style={{ position: "absolute", inset: "0", background: `url(${A}decors/ranch/detoure.webp) center 62%/cover no-repeat`, filter: "brightness(.92) sepia(.45) saturate(1.5) hue-rotate(-6deg)", WebkitMask: `url(${A}decors/ranch/lumiere-lanternes-masque.png) center 62%/cover no-repeat`, mask: `url(${A}decors/ranch/lumiere-lanternes-masque.png) center 62%/cover no-repeat` } as CSSProperties} />
        </div>
        <div className="lanterne" style={{ left: "202px", top: "283px", animationDelay: "0.0s" } as CSSProperties}>
          <span className="halo-l" />
          <span className="coeur-l" />
        </div>
        <div className="lanterne" style={{ left: "724px", top: "344px", animationDelay: "-0.7s" } as CSSProperties}>
          <span className="halo-l" />
          <span className="coeur-l" />
        </div>
        <div className="lanterne" style={{ left: "848px", top: "339px", animationDelay: "-1.4s" } as CSSProperties}>
          <span className="halo-l" />
          <span className="coeur-l" />
        </div>
      </div>
      <div style={{ position: "absolute", inset: "0", background: "radial-gradient(ellipse at 50% 55%,transparent 45%,rgba(10,8,20,.75) 100%)", opacity: v.vignette, transition: "opacity 1.2s ease", pointerEvents: "none" } as CSSProperties} />
      <div style={{ position: "absolute", inset: "0", opacity: v.fireflies, transition: "opacity 1.2s ease", pointerEvents: "none" } as CSSProperties}>
        <div className="fly" style={{ position: "absolute", left: "440px", top: "300px" } as CSSProperties}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff1a8", boxShadow: "0 0 10px 3px rgba(255,226,120,.8)" } as CSSProperties} />
        </div>
        <div className="fly" style={{ position: "absolute", left: "820px", top: "330px", animationDelay: "-3s" } as CSSProperties}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fff1a8", boxShadow: "0 0 10px 3px rgba(255,226,120,.8)", animationDelay: "-1s" } as CSSProperties} />
        </div>
        <div className="fly" style={{ position: "absolute", left: "300px", top: "390px", animationDelay: "-6s" } as CSSProperties}>
          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#fff1a8", boxShadow: "0 0 8px 3px rgba(255,226,120,.8)", animationDelay: "-.6s" } as CSSProperties} />
        </div>
        <div className="fly" style={{ position: "absolute", left: "1000px", top: "400px", animationDelay: "-2s" } as CSSProperties}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fff1a8", boxShadow: "0 0 10px 3px rgba(255,226,120,.8)", animationDelay: "-1.7s" } as CSSProperties} />
        </div>
        <div className="fly" style={{ position: "absolute", left: "660px", top: "250px", animationDelay: "-4.5s" } as CSSProperties}>
          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#fff1a8", boxShadow: "0 0 8px 3px rgba(255,226,120,.8)", animationDelay: "-.3s" } as CSSProperties} />
        </div>
      </div>
      {/* L'heure, sur une planche suspendue */}
      <div className="ecriteau" style={{ filter: v.paperFilter } as CSSProperties} role="group" aria-label="Jour, heure et bourse">
        <div className="planche bois">
          <div style={{ position: "relative" } as CSSProperties}>
            <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "12px", letterSpacing: "2.5px" } as CSSProperties} className="pyro">
              {v.jourTexte}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" } as CSSProperties}>
              <span className="pyro" style={{ fontSize: "34px", fontWeight: "700", lineHeight: "1.05" } as CSSProperties}>
                {v.time}
              </span>
              <span className="craie" style={{ fontSize: "28px", lineHeight: "1" } as CSSProperties}>
                {v.period}
              </span>
            </div>
            <div className="pyro" style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "14.5px", fontWeight: "500" } as CSSProperties}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#f6dc8a,#c9a050 60%)", boxShadow: "inset 0 0 0 1.5px #3a2410" } as CSSProperties} />
              {v.pieces} pièces
            </div>
          </div>
        </div>
        <i className="corde" style={{ left: "40px", height: "40px" } as CSSProperties} />
        <i className="corde" style={{ left: "252px", height: "40px" } as CSSProperties} />
        <i className="clou" style={{ left: "42px", top: "36px" } as CSSProperties} />
        <i className="clou" style={{ left: "254px", top: "36px" } as CSSProperties} />
      </div>
      {/* Le sac en bandoulière */}
      <button className={`cote-btn ${v.coteCls}`} style={{ filter: v.paperFilter, top: "20px" } as CSSProperties} onClick={v.ouvrirSac} aria-label="Ouvrir le sac">
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
        <span className="etiq">
          sac
        </span>
      </button>
      {/* Quitter le ranch */}
      <button className={`cote-btn poteau-btn ${v.coteCls} ${v.poteauCls}`} style={{ filter: v.paperFilter, top: "122px", height: "112px" } as CSSProperties} onClick={v.basculerQuitter} aria-label="Quitter le ranch" aria-expanded={v.quitterAria}>
        <svg width="86" height="100" viewBox="0 0 86 100" aria-hidden="true">
          <defs>
            <linearGradient id="pqBois1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c58f58" />
              <stop offset="1" stopColor="#97612f" />
            </linearGradient>
            <linearGradient id="pqBois2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ad7642" />
              <stop offset="1" stopColor="#7f4f25" />
            </linearGradient>
            <linearGradient id="pqPoteau" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6a4020" />
              <stop offset=".45" stopColor="#9c683a" />
              <stop offset="1" stopColor="#5e381b" />
            </linearGradient>
          </defs>
          <path d="M20 96c4-8 11-10 23-10s19 2 23 10z" fill="#6f8f3c" stroke="#3a1f0e" strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="39.5" y="10" width="8" height="82" rx="1.5" fill="url(#pqPoteau)" stroke="#3a1f0e" strokeWidth="2" />
          <path d="M38.5 11l5-7 5 7z" fill="#5e381b" stroke="#3a1f0e" strokeWidth="1.8" strokeLinejoin="round" />
          <g className="fl1">
            <path d="M17 17h50v18H17l-11-9z" fill="url(#pqBois1)" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M20 22h20M46 22h17M15 29h14M34 29h29" stroke="rgba(58,31,14,.3)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M18 34.5h48" stroke="rgba(255,222,176,.35)" strokeWidth="1" />
          </g>
          <g className="fl2">
            <path d="M20 44h51l11 9-11 9H20z" fill="url(#pqBois2)" stroke="#3a1f0e" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M24 49h22M52 49h16M23 56h30M58 56h16" stroke="rgba(58,31,14,.32)" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <circle cx="43.5" cy="26" r="2.3" fill="#e6cf98" stroke="#3a2410" strokeWidth="1.1" />
          <circle cx="43.5" cy="53" r="2.3" fill="#e6cf98" stroke="#3a2410" strokeWidth="1.1" />
          <path d="M27 92c0-5-1-8-3-11M32 91c0-4 1-7 3-9M55 91c0-4-1-7-3-10M61 92c1-4 3-6 5-7" fill="none" stroke="#4c6a2a" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="etiq">
          partir
        </span>
      </button>
      {v.quitterVisible ? (<>
        <div className="quitter" role="menu" aria-label="Quitter le ranch" style={{ "--nuit": v.paperFilter } as CSSProperties}>
          <div className="q-titre craie">
            où aller ?
          </div>
          {(v.destinations || []).map((xD1: any, i1: number) => (
            <Fragment key={i1}>
              <button className="fleche" role="menuitem" style={{ "--r": `${xD1.r}deg`, animationDelay: `${xD1.delai}s` } as CSSProperties} onClick={xD1.partir} onMouseEnter={xD1.survol}>
                <span className="fl-bois bois">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2c1507" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={xD1.icone} />
                  </svg>
                  <span className="pyro" style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "16px", letterSpacing: "1px" } as CSSProperties}>
                    {xD1.nom}
                  </span>
                  <span className="craie" style={{ marginLeft: "auto", fontSize: "21px", lineHeight: "1", whiteSpace: "nowrap" } as CSSProperties}>
                    {xD1.duree}
                  </span>
                  <i className="clou" style={{ right: "6px", left: "auto", top: "50%" } as CSSProperties} />
                </span>
              </button>
            </Fragment>
          ))}
        </div>
      </>) : null}
      {/* La déjection : on nettoie là où elle est tombée */}
      {(v.crottes || []).map((xCr2: any, i2: number) => (
        <Fragment key={i2}>
          <div className={`crotte-img ${xCr2.cls}`} style={{ left: `${xCr2.x}px`, top: `${xCr2.y}px`, zIndex: xCr2.z } as CSSProperties}>
            <img src={xCr2.image} alt="" style={{ filter: v.decorFilter, transition: "filter 1.2s ease" } as CSSProperties} />
            <svg className="crotte-lueur" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <path d="M11 1l2.2 7.8L21 11l-7.8 2.2L11 21l-2.2-7.8L1 11l7.8-2.2z" fill="#fff6d6" />
            </svg>
          </div>
          <button className="crotte" onClick={xCr2.nettoyer} onMouseEnter={xCr2.survol} onMouseLeave={xCr2.quitte} aria-label="Ramasser la déjection" style={{ left: `${xCr2.x}px`, top: `${xCr2.y}px` } as CSSProperties}>
            <span className="astuce">
              ramasser
            </span>
          </button>
        </Fragment>
      ))}
      {v.visiteur ? (<>
        <div className={`echo-pos visiteur-pos ${v.visiteur.cls}`} style={{ left: `${v.visiteur.x}px`, top: `${v.visiteur.y}px`, transitionDuration: `${v.visiteur.dur}s`, transform: `scale(${v.visiteur.persp})`, zIndex: v.visiteur.z } as CSSProperties}>
          <button className={`echo-zone visiteur-zone ${v.visiteur.anim} ${v.visiteur.demarche}`} style={{ "--cycle": `${v.visiteur.cycle}s` } as CSSProperties} onClick={v.visiteur.ouvrir} aria-label={v.visiteur.aria}>
            <span className="echo-ombre" style={{ transform: `scaleX(${v.visiteur.taille})` } as CSSProperties} />
            <span className={`echo-sens ${v.visiteur.sens}`}>
              <span className="echo-taille" style={{ transform: `scale(${v.visiteur.taille})` } as CSSProperties}>
                <img className="echo-img" src={v.visiteur.image} alt="" style={{ filter: v.echoFilter } as CSSProperties} />
              </span>
            </span>
            <span className="visiteur-tag" style={{ top: `${v.visiteur.tete}px` } as CSSProperties}>
              <b>
                {v.visiteur.nom}
              </b>
              <i>
                {v.visiteur.lien}
              </i>
            </span>
          </button>
          {v.visiteur.poussiere ? (<>
            <span className="visiteur-poussiere">
              <i />
              <i />
              <i />
              <i />
            </span>
          </>) : null}
          {v.visiteur.signe ? (<>
            <div className="emo-flotte" style={{ top: `${v.visiteur.teteSigne}px` } as CSSProperties}>
              <img src={v.visiteur.signe} alt="" />
            </div>
          </>) : null}
        </div>
        {v.visiteur.appel1 ? (<>
          <div className="duo-appel" style={{ left: `${v.visiteur.appel1.x}px`, top: `${v.visiteur.appel1.y}px` } as CSSProperties}>
            <b>
              !
            </b>
          </div>
        </>) : null}
        {v.visiteur.appel2 ? (<>
          <div className="duo-appel" style={{ left: `${v.visiteur.appel2.x}px`, top: `${v.visiteur.appel2.y}px` } as CSSProperties}>
            <b>
              !
            </b>
          </div>
        </>) : null}
        {v.visiteur.duo ? (<>
          <div className={`duo-cadrage ${v.visiteur.duo.cls}`} style={{ "--x": `${v.visiteur.duo.x}px`, "--y": `${v.visiteur.duo.y}px` } as CSSProperties} />
          <div className={`duo-eclat ${v.visiteur.duo.cls}`} style={{ left: `${v.visiteur.duo.x}px`, top: `${v.visiteur.duo.haut}px` } as CSSProperties}>
            <i className="duo-anneau" />
            <i className="duo-rayons" />
            <b>
              !
            </b>
          </div>
        </>) : null}
      </>) : null}
      {/* L'écho se promène sur le terrain ; tout ce qui le concerne le suit */}
      <div className="echo-pos" style={{ opacity: v.echoOp, left: `${v.ex}px`, top: `${v.ey}px`, transitionDuration: `${v.eDur}s`, transform: `scale(${v.eScale})`, zIndex: v.eZ } as CSSProperties}>
        <button className={`echo-zone ${v.echoAnim} ${v.demarche}`} style={{ "--cycle": `${v.cycle}s` } as CSSProperties} onClick={v.caresser} aria-label={v.caresserAria}>
          <span className="echo-ombre" style={{ transform: `scaleX(${v.eTaille})` } as CSSProperties} />
          <span className={`echo-sens ${v.eSens}`}>
            <span className="echo-taille" style={{ transform: `scale(${v.eTaille})` } as CSSProperties}>
              <img className="echo-img" src={v.echoImg} alt={v.echoAlt} style={{ filter: v.echoFilter } as CSSProperties} />
            </span>
          </span>
          <span className="caresse">
            caresser
          </span>
        </button>
        {v.mainVisible ? (<>
          <svg className="frotte" viewBox="0 0 132 70" aria-hidden="true" style={{ top: `${v.teteMain}px` } as CSSProperties}>
            <path className="trait-l" pathLength="100" d="M22 46 Q66 6 110 44" />
            <path className="trait-l t2" pathLength="100" d="M30 36 Q68 0 104 34" />
          </svg>
        </>) : null}
        {/* Signes d'humeur : besoin (rouge) et émotion passagère, selon le style choisi */}
        {/* États actifs : ils gravitent autour de l'écho (devant puis derrière lui) ; au survol, l'un s'arrête et grossit */}
        {(v.etatsOrbite || []).map((xE3: any, i3: number) => (
          <Fragment key={i3}>
            <div className="orbite-etat" style={{ offsetPath: v.orbite, animationDelay: `${xE3.delai}s` } as CSSProperties} aria-label={xE3.nom}>
              <img src={xE3.image} alt="" />
              <span className="astuce">
                {xE3.nom}
              </span>
            </div>
          </Fragment>
        ))}
        {v.rienDuTout ? (<>
        </>) : null}
        {v.bulleBulle ? (<>
          <div className="bulle" style={{ left: "110px", top: `${v.teteBulle2}px` } as CSSProperties}>
            <svg width="74" height="74" viewBox="0 0 86 86" aria-hidden="true" style={{ position: "absolute", inset: "0" } as CSSProperties}>
              <path d="M43 4c21 0 38 15 38 34S64 72 43 72c-4 0-7 0-10-1l-16 9 5-13C11 61 5 50 5 38 5 19 22 4 43 4z" fill="#fbf4e3" stroke="#3a1f0e" strokeWidth="2.5" />
            </svg>
            <img src={v.bulleImg} alt="" style={{ position: "absolute", left: "13px", top: "8px", width: "48px", height: "48px", objectFit: "contain" } as CSSProperties} />
          </div>
        </>) : null}
        {v.emoFlotte ? (<>
          <div className="emo-flotte" style={{ top: `${v.teteSigne}px`, "--lueur-emo": v.emoTeinte } as CSSProperties}>
            <span className="emo-halo" />
            <span className="emo-rayons" />
            <img src={v.bulleImg} alt="" />
          </div>
        </>) : null}
        {v.signe_joyeux ? (<>
          <svg className="signe" width="104" height="104" viewBox="0 0 80 80" aria-hidden="true" style={{ left: "23px", top: `${v.teteSigne}px` } as CSSProperties}>
            <g className="sg" style={{ animationDelay: "0s" } as CSSProperties}>
              <path d="M18 34l2.8 7.2 7.2 2.8 -7.2 2.8 -2.8 7.2 -2.8 -7.2 -7.2 -2.8 7.2 -2.8z" fill="#fff1b8" stroke="#2a160a" strokeWidth="2.6" strokeLinejoin="round" />
            </g>
            <g className="sg" style={{ animationDelay: "0.12s" } as CSSProperties}>
              <path d="M42 7l3.6 9.4 9.4 3.6 -9.4 3.6 -3.6 9.4 -3.6 -9.4 -9.4 -3.6 9.4 -3.6z" fill="#ffe27a" stroke="#2a160a" strokeWidth="2.6" strokeLinejoin="round" />
            </g>
            <g className="sg" style={{ animationDelay: "0.24s" } as CSSProperties}>
              <path d="M65 35l2.5 6.5 6.5 2.5 -6.5 2.5 -2.5 6.5 -2.5 -6.5 -6.5 -2.5 6.5 -2.5z" fill="#fff1b8" stroke="#2a160a" strokeWidth="2.6" strokeLinejoin="round" />
            </g>
          </svg>
        </>) : null}
        {v.signe_fier ? (<>
          <svg className="signe" width="104" height="104" viewBox="0 0 80 80" aria-hidden="true" style={{ left: "23px", top: `${v.teteSigne}px` } as CSSProperties}>
            <g className="sg" style={{ animationDelay: "0s" } as CSSProperties}>
              <path d="M21.2 55.2L8.1 50.4M28.5 45.6L20.5 34.1M40.0 42.0L40.0 28.0M51.5 45.6L59.5 34.1M58.8 55.2L71.9 50.4" fill="none" stroke="#2a160a" strokeWidth="6.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21.2 55.2L8.1 50.4M28.5 45.6L20.5 34.1M40.0 42.0L40.0 28.0M51.5 45.6L59.5 34.1M58.8 55.2L71.9 50.4" fill="none" stroke="#ffd36e" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <g className="sg" style={{ animationDelay: "0.2s" } as CSSProperties}>
              <path d="M40 6l2.2 5.8 5.8 2.2 -5.8 2.2 -2.2 5.8 -2.2 -5.8 -5.8 -2.2 5.8 -2.2z" fill="#fff1b8" stroke="#2a160a" strokeWidth="2.6" strokeLinejoin="round" />
            </g>
          </svg>
        </>) : null}
        {v.signe_surpris ? (<>
          <svg className="signe" width="104" height="104" viewBox="0 0 80 80" aria-hidden="true" style={{ left: "23px", top: `${v.teteSigne}px` } as CSSProperties}>
            <g className="sg" style={{ animationDelay: "0.1s" } as CSSProperties}>
              <path d="M14 22l-8-7M66 22l8-7M10 42H1M70 42h9" fill="none" stroke="#2a160a" strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 22l-8-7M66 22l8-7M10 42H1M70 42h9" fill="none" stroke="#fff6e0" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <g className="sg" style={{ animationDelay: "0s" } as CSSProperties}>
              <path d="M35.5 8h9l-1.8 34h-5.4z" fill="#fff6e0" stroke="#2a160a" strokeWidth="2.6" strokeLinejoin="round" />
            </g>
            <g className="sg" style={{ animationDelay: "0.06s" } as CSSProperties}>
              <path d="M40 48.5a5 5 0 1 0 .01 0z" fill="#fff6e0" stroke="#2a160a" strokeWidth="2.6" strokeLinejoin="round" />
            </g>
          </svg>
        </>) : null}
        {v.signe_anxieux ? (<>
          <svg className="signe" width="104" height="104" viewBox="0 0 80 80" aria-hidden="true" style={{ left: "23px", top: `${v.teteSigne}px` } as CSSProperties}>
            <g className="sg" style={{ animationDelay: "0s" } as CSSProperties}>
              <path d="M12 40c4-5 8 5 12 0s8 5 12 0" fill="none" stroke="#2a160a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 40c4-5 8 5 12 0s8 5 12 0" fill="none" stroke="#e2d8ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <g className="sg" style={{ animationDelay: "0.1s" } as CSSProperties}>
              <path d="M20 24c3-4 6 4 9 0s6 4 9 0" fill="none" stroke="#2a160a" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 24c3-4 6 4 9 0s6 4 9 0" fill="none" stroke="#e2d8ff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <g className="sg goutte" style={{ animationDelay: "0.15s" } as CSSProperties}>
              <path d="M60 10c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z" fill="#cfe8ff" stroke="#2a160a" strokeWidth="2.6" strokeLinejoin="round" />
            </g>
          </svg>
        </>) : null}
        {v.bulleHalo ? (<>
          <div className="orbe" style={{ left: "40px", top: `${v.teteOrbe}px`, "--teinte": v.orbeTeinte } as CSSProperties}>
            <img src={v.bulleImg} alt="" />
          </div>
        </>) : null}
        {(v.coeurs || []).map((xC4: any, i4: number) => (
          <Fragment key={i4}>
            <svg className="coeur" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ left: `${xC4.x}px`, top: `${xC4.y}px`, "--dx": `${xC4.dx}px`, animationDelay: `${xC4.delai}s` } as CSSProperties}>
              <path d="M12 20c-5-3.2-8-6-8-9.2A4 4 0 0 1 12 8a4 4 0 0 1 8 2.8c0 3.2-3 6-8 9.2z" fill="#e8705a" stroke="#3a1f0e" strokeWidth="1.4" />
            </svg>
          </Fragment>
        ))}
        {v.evtVisible ? (<>
          <button className="alerte-evt" style={{ top: `${v.teteAlerte}px` } as CSSProperties} onClick={v.ouvrirEvt} aria-label={v.evtAria}>
            <img src={`${A}interface/etats/orbite/comportement.webp`} alt="" style={{ position: "absolute", left: "0", top: "8px", width: "84px", height: "84px", objectFit: "contain" } as CSSProperties} />
            <span className="astuce">
              que s'est-il passé ?
            </span>
          </button>
        </>) : null}
      </div>
      {(v.flottants || []).map((xF5: any, i5: number) => (
        <Fragment key={i5}>
          <div className="flotte" style={{ left: `${xF5.x}px`, top: `${xF5.y}px`, color: xF5.couleur } as CSSProperties}>
            {xF5.texte}
          </div>
        </Fragment>
      ))}
      {/* La fiche de l'action ouverte */}
      {v.ficheVisible ? (<>
        <div className="fiche" style={{ "--pointe": `${v.fichePointe}px`, filter: v.paperFilter } as CSSProperties}>
          <div style={{ position: "relative", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "2px" } as CSSProperties}>
            <span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "27px", lineHeight: "1", color: "#6b4f33" } as CSSProperties}>
              {v.ficheTitre}
            </span>
            <span style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "12px", letterSpacing: "1px", color: v.ficheCouleur } as CSSProperties}>
              {v.ficheBesoin}
            </span>
          </div>
          {v.ficheEcho ? (<>
            <div className="fe-onglets" role="tablist">
              {(v.ficheOnglets || []).map((xFo6: any, i6: number) => (
                <Fragment key={i6}>
                  <button className={`fe-onglet ${xFo6.cls}`} role="tab" aria-selected={xFo6.choisi} onClick={xFo6.ouvrir} onMouseEnter={xFo6.survol}>
                    {xFo6.nom}
                  </button>
                </Fragment>
              ))}
            </div>
            {v.fichePortrait ? (<>
              <div style={{ position: "relative", display: "flex", gap: "14px", alignItems: "flex-start", marginTop: "4px" } as CSSProperties}>
                <div style={{ flex: "none", width: "96px", height: "118px", borderRadius: "6px", background: "radial-gradient(circle at 50% 40%,#fff6df,#e8d6b0)", boxShadow: "inset 0 0 0 1.5px rgba(58,31,14,.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" } as CSSProperties}>
                  <img src={v.echoImg} alt="" style={{ height: "104px", width: "auto" } as CSSProperties} />
                </div>
                <div style={{ flex: "1", minWidth: "0" } as CSSProperties}>
                  {(v.traits || []).map((xT7: any, i7: number) => (
                    <Fragment key={i7}>
                      <div className={`trait ${xT7.cls}`}>
                        <span>
                          {xT7.nom}
                        </span>
                        <b>
                          {xT7.valeur}
                        </b>
                      </div>
                    </Fragment>
                  ))}
                  <div className="fe-dominant" style={{ "--c": v.domCouleur, "--l": v.domLueur } as CSSProperties}>
                    <span className="fe-glyphe" style={{ "--g": v.domGlyphe } as CSSProperties} />
                    <span>
                      {v.domTexte}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ position: "relative", marginTop: "8px", fontFamily: "'Reenie Beanie',cursive", fontSize: "21px", lineHeight: "1.05", color: "#6b4f33" } as CSSProperties}>
                {v.ficheMot}
              </div>
            </>) : null}
            {v.ficheTemperament ? (<>
              <div className="fe-intro">
                Ce que sa graine lui a donné, et ce que vos réponses font grandir.
              </div>
              {(v.temperaments || []).map((xTp8: any, i8: number) => (
                <Fragment key={i8}>
                  <div className={`ft-ligne ${xTp8.cls}`} style={{ "--c": xTp8.couleur, "--l": xTp8.lueur } as CSSProperties}>
                    <span className="fe-glyphe" style={{ "--g": xTp8.glyphe } as CSSProperties} />
                    <span className="ft-nom">
                      {xTp8.nom}
                    </span>
                    <span className="ft-points">
                      {(xTp8.points || []).map((xPt9: any, i9: number) => (
                        <Fragment key={i9}>
                          <i className={xPt9.cls} />
                        </Fragment>
                      ))}
                    </span>
                    <span className="ft-trait">
                      {xTp8.trait}
                    </span>
                  </div>
                </Fragment>
              ))}
            </>) : null}
            {v.ficheCombat ? (<>
              <div className="fe-intro">
                Les entraînements et les corvées les font grandir.
              </div>
              {(v.combat || []).map((xCb10: any, i10: number) => (
                <Fragment key={i10}>
                  <div className={`fc-ligne ${xCb10.cls}`}>
                    <span className="fc-nom">
                      {xCb10.nom}
                    </span>
                    <span className="fc-jauge">
                      {(xCb10.crans || []).map((xCr11: any, i11: number) => (
                        <Fragment key={i11}>
                          <i className={xCr11.cls} />
                        </Fragment>
                      ))}
                    </span>
                    <b className="fc-mot">
                      {xCb10.mot}
                    </b>
                    <span className="fc-fleche">
                      {xCb10.fleches}
                    </span>
                  </div>
                </Fragment>
              ))}
            </>) : null}
          </>) : null}
          {v.ficheChoix ? (<>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "1px" } as CSSProperties}>
              {(v.choix || []).map((xO12: any, i12: number) => (
                <Fragment key={i12}>
                  {xO12.estRubrique ? (<>
                    <div className="rubrique">
                      {xO12.nom}
                    </div>
                  </>) : null}
                  {xO12.estChoix ? (<>
                    <button className={`choix ${xO12.cls}`} onMouseEnter={xO12.survol} onClick={xO12.prendre} disabled={!!(xO12.off)}>
                      <span className="vign">
                        {xO12.aImage ? (<>
                          <img src={xO12.image} alt="" />
                        </>) : null}
                        {xO12.aIcone ? (<>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e3f22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d={xO12.icone} />
                          </svg>
                        </>) : null}
                      </span>
                      <span>
                        {xO12.nom}
                      </span>
                      <span className="det">
                        {xO12.detail}
                      </span>
                      {xO12.tamponne ? (<>
                        <svg className="tamp" viewBox="0 0 40 40" aria-hidden="true">
                          <circle cx="20" cy="20" r="16.5" fill="rgba(63,122,58,.08)" stroke="#3f7a3a" strokeWidth="3" />
                          <path d="M12.5 20.5l5 5 10-11" fill="none" stroke="#3f7a3a" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>) : null}
                    </button>
                  </>) : null}
                </Fragment>
              ))}
            </div>
          </>) : null}
        </div>
      </>) : null}
      {/* Le petit carnet d'éleveur : les onglets sont les actions ; la couverture ouvre le carnet */}
      <nav className={`pcarnet ${v.ceintureCls} ${v.carnetLeve}`} aria-label="Actions du ranch" style={{ filter: v.paperFilter } as CSSProperties}>
        <div className="pc-corps">
          <div className="pc-pages" />
          {(v.verbes || []).map((xV13: any, i13: number) => (
            <Fragment key={i13}>
              <button className={`pc-onglet ${xV13.cls}`} style={{ "--c": xV13.teinte, "--l": `${xV13.largeur}px`, top: `${xV13.haut}px` } as CSSProperties} onMouseEnter={xV13.survol} onMouseLeave={xV13.quitte} onFocus={xV13.survol} onBlur={xV13.quitte} onClick={xV13.ouvrir} aria-label={xV13.etiquette} aria-expanded={xV13.ouvertAria}>
                <span className="nom">
                  {xV13.court}
                </span>
                <span className="ico">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={xV13.icone} />
                  </svg>
                </span>
              </button>
            </Fragment>
          ))}
          <div className="pc-couv" aria-hidden="true">
            <span className="stitch" />
            <span style={{ position: "absolute", left: "0", top: "0", bottom: "0", width: "18px", borderRadius: "5px 0 0 5px", background: "linear-gradient(90deg,#4a2814,rgba(110,63,34,0))" } as CSSProperties} />
            <svg width="26" height="26" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", top: "0" } as CSSProperties}>
              <path d="M32 32V10a8 8 0 0 0-8-8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
            </svg>
            <svg width="26" height="26" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", bottom: "0" } as CSSProperties}>
              <path d="M32 2v22a8 8 0 0 1-8 8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
            </svg>
            <span style={{ position: "absolute", inset: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" } as CSSProperties}>
              <svg width="58" height="58" viewBox="0 0 78 78" aria-hidden="true">
                <circle cx="39" cy="39" r="34" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2.5" />
                <path d="M39 58c-9 0-14-7-14-15s6-13 14-13 14 5 14 13-5 15-14 15zM39 30c0-6 3-10 9-12M39 30c-1-5-5-8-10-8" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "14px", letterSpacing: "3px", color: "rgba(30,14,4,.55)", textShadow: "0 1px 0 rgba(240,200,150,.2)", textAlign: "center", lineHeight: "1.25" } as CSSProperties}>
                Carnet
                <br />
                d'éleveur
              </span>
            </span>
            <span className="astuce">
              ouvrir le carnet
            </span>
            {v.aDesNouvelles ? (<>
              <span className="sceau" style={{ position: "absolute", right: "-9px", top: "-9px" } as CSSProperties}>
                {v.nouvelles}
              </span>
            </>) : null}
          </div>
          <span className="pc-signet" />
        </div>
        <button className="pc-zone" onClick={v.ouvrirCarnet} onMouseEnter={v.leverCarnet} onMouseLeave={v.baisserCarnet} onFocus={v.leverCarnet} onBlur={v.baisserCarnet} aria-label="Ouvrir le carnet d'éleveur" />
      </nav>
      {/* Scène d'action : fenêtre centrale où l'écho saute pour laver, brosser, manger, jouer, s'entraîner… */}
      {v.sceneVisible ? (<>
        <div className={`sc-act ${v.scCls}`} style={{ "--dx": `${v.scDx}px`, "--dy": `${v.scDy}px`, "--s0": v.scS0, "--h": `${v.scH}px`, "--tete": `${v.scTete}px`, "--ui": v.paperFilter } as CSSProperties}>
          <button className="sc-voile" onClick={v.fermerScene} aria-label="Continuer" />
          <div className="sc-fen bois">
            <div className="sc-fond" style={{ filter: v.decorFilter } as CSSProperties}>
              <span className="sc-sol" />
              <span className="p p-coucher lune-s" />
              <span className="p p-esprit anneaux">
                <i />
                <i />
                <i />
              </span>
              <span className="p p-course">
                <i className="vitesse" style={{ top: "124px", width: "113px", animationDelay: "0.62s", animationDuration: "0.70s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "285px", width: "87px", animationDelay: "0.89s", animationDuration: "0.64s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "302px", width: "83px", animationDelay: "0.45s", animationDuration: "0.54s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "41px", width: "61px", animationDelay: "0.33s", animationDuration: "0.68s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "75px", width: "78px", animationDelay: "0.71s", animationDuration: "0.54s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "159px", width: "148px", animationDelay: "0.04s", animationDuration: "0.85s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "248px", width: "138px", animationDelay: "0.40s", animationDuration: "0.83s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "316px", width: "123px", animationDelay: "0.62s", animationDuration: "0.71s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "228px", width: "62px", animationDelay: "0.14s", animationDuration: "0.78s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "103px", width: "62px", animationDelay: "0.41s", animationDuration: "0.67s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "215px", width: "111px", animationDelay: "0.44s", animationDuration: "0.52s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "59px", width: "120px", animationDelay: "0.78s", animationDuration: "0.54s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "141px", width: "86px", animationDelay: "0.61s", animationDuration: "0.77s" } as CSSProperties} />
                <i className="vitesse" style={{ top: "76px", width: "75px", animationDelay: "0.50s", animationDuration: "0.67s" } as CSSProperties} />
                <i className="sol-defile" />
              </span>
              <span className="p p-ciel">
                <img className="nuage-s" src={`${A}decors/ranch/nuage-g2.webp`} alt="" style={{ top: "30px", animationDelay: "0s" } as CSSProperties} />
                <img className="nuage-s" src={`${A}decors/ranch/nuage-g1.webp`} alt="" style={{ top: "90px", width: "120px", animationDelay: "-2.2s" } as CSSProperties} />
                <img className="nuage-s" src={`${A}decors/ranch/nuage-g3.webp`} alt="" style={{ top: "10px", width: "150px", animationDelay: "-4s" } as CSSProperties} />
              </span>
              <span className="p p-lucioles">
                <i className="luciole" style={{ left: "172px", top: "188px", animationDelay: "-2.74s", animationDuration: "4.71s" } as CSSProperties} />
                <i className="luciole" style={{ left: "135px", top: "158px", animationDelay: "-2.66s", animationDuration: "5.17s" } as CSSProperties} />
                <i className="luciole" style={{ left: "368px", top: "135px", animationDelay: "-0.52s", animationDuration: "4.33s" } as CSSProperties} />
                <i className="luciole" style={{ left: "149px", top: "190px", animationDelay: "-0.12s", animationDuration: "3.32s" } as CSSProperties} />
                <i className="luciole" style={{ left: "390px", top: "47px", animationDelay: "-3.97s", animationDuration: "5.09s" } as CSSProperties} />
                <i className="luciole" style={{ left: "83px", top: "174px", animationDelay: "-3.31s", animationDuration: "4.86s" } as CSSProperties} />
                <i className="luciole" style={{ left: "111px", top: "171px", animationDelay: "-1.42s", animationDuration: "3.59s" } as CSSProperties} />
                <i className="luciole" style={{ left: "426px", top: "259px", animationDelay: "-2.68s", animationDuration: "5.22s" } as CSSProperties} />
                <i className="luciole" style={{ left: "366px", top: "200px", animationDelay: "-2.62s", animationDuration: "3.86s" } as CSSProperties} />
                <i className="luciole" style={{ left: "344px", top: "174px", animationDelay: "-2.76s", animationDuration: "4.39s" } as CSSProperties} />
                <i className="luciole" style={{ left: "423px", top: "109px", animationDelay: "-1.76s", animationDuration: "4.82s" } as CSSProperties} />
                <i className="luciole" style={{ left: "314px", top: "130px", animationDelay: "-1.17s", animationDuration: "3.45s" } as CSSProperties} />
                <i className="luciole" style={{ left: "222px", top: "169px", animationDelay: "-1.48s", animationDuration: "3.65s" } as CSSProperties} />
                <i className="luciole" style={{ left: "183px", top: "242px", animationDelay: "-3.56s", animationDuration: "4.44s" } as CSSProperties} />
                <i className="luciole" style={{ left: "321px", top: "160px", animationDelay: "-2.26s", animationDuration: "5.22s" } as CSSProperties} />
                <i className="luciole" style={{ left: "399px", top: "227px", animationDelay: "-0.52s", animationDuration: "4.08s" } as CSSProperties} />
              </span>
            </div>
          </div>
          <div className="sc-echo">
            <span className="sc-ombre" />
            <div className="sc-anim">
              <img src={v.echoImg} alt={v.echoNom} style={{ filter: v.echoFilter } as CSSProperties} />
            </div>
          </div>
          <div className="sc-avant">
            <span className="p p-laver">
              <img className="seau-s" src={`${A}interface/icones/seau.png`} alt="" />
              <i className="goutte" style={{ left: "272px", animationDelay: "0.95s", animationDuration: "0.67s" } as CSSProperties} />
              <i className="goutte" style={{ left: "202px", animationDelay: "0.07s", animationDuration: "0.71s" } as CSSProperties} />
              <i className="goutte" style={{ left: "283px", animationDelay: "0.58s", animationDuration: "0.82s" } as CSSProperties} />
              <i className="goutte" style={{ left: "244px", animationDelay: "0.04s", animationDuration: "0.68s" } as CSSProperties} />
              <i className="goutte" style={{ left: "207px", animationDelay: "0.24s", animationDuration: "0.72s" } as CSSProperties} />
              <i className="goutte" style={{ left: "205px", animationDelay: "0.83s", animationDuration: "0.59s" } as CSSProperties} />
              <i className="goutte" style={{ left: "247px", animationDelay: "0.63s", animationDuration: "0.72s" } as CSSProperties} />
              <i className="goutte" style={{ left: "205px", animationDelay: "0.58s", animationDuration: "0.67s" } as CSSProperties} />
              <i className="goutte" style={{ left: "246px", animationDelay: "0.05s", animationDuration: "0.81s" } as CSSProperties} />
              <i className="goutte" style={{ left: "264px", animationDelay: "0.42s", animationDuration: "0.71s" } as CSSProperties} />
              <i className="goutte" style={{ left: "268px", animationDelay: "0.56s", animationDuration: "0.75s" } as CSSProperties} />
              <i className="goutte" style={{ left: "216px", animationDelay: "0.58s", animationDuration: "0.74s" } as CSSProperties} />
              <i className="goutte" style={{ left: "285px", animationDelay: "0.10s", animationDuration: "0.76s" } as CSSProperties} />
              <i className="goutte" style={{ left: "205px", animationDelay: "0.62s", animationDuration: "0.70s" } as CSSProperties} />
              <i className="goutte" style={{ left: "299px", animationDelay: "0.78s", animationDuration: "0.69s" } as CSSProperties} />
              <i className="goutte" style={{ left: "306px", animationDelay: "0.36s", animationDuration: "0.62s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "225px", top: "265px", width: "43px", animationDelay: "1.16s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "319px", top: "250px", width: "46px", animationDelay: "2.06s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "320px", top: "191px", width: "41px", animationDelay: "1.42s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "224px", top: "214px", width: "41px", animationDelay: "1.98s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "305px", top: "250px", width: "38px", animationDelay: "2.18s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "203px", top: "219px", width: "46px", animationDelay: "1.20s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "298px", top: "239px", width: "26px", animationDelay: "2.24s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "181px", top: "210px", width: "44px", animationDelay: "0.99s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "172px", top: "295px", width: "34px", animationDelay: "1.85s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "264px", top: "281px", width: "39px", animationDelay: "1.69s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "312px", top: "246px", width: "30px", animationDelay: "2.66s" } as CSSProperties} />
              <img className="mousse" src={`${A}interface/icones/bulle.png`} alt="" style={{ left: "189px", top: "194px", width: "30px", animationDelay: "1.89s" } as CSSProperties} />
              <i className="eclabousse" />
            </span>
            <span className="p p-brosser">
              <img className="brosse-i" src={`${A}interface/icones/brosse.png`} alt="" />
              <i className="poil" style={{ left: "289px", animationDelay: "0.43s" } as CSSProperties} />
              <i className="poil" style={{ left: "273px", animationDelay: "1.39s" } as CSSProperties} />
              <i className="poil" style={{ left: "257px", animationDelay: "0.40s" } as CSSProperties} />
              <i className="poil" style={{ left: "249px", animationDelay: "1.24s" } as CSSProperties} />
              <i className="poil" style={{ left: "244px", animationDelay: "0.03s" } as CSSProperties} />
              <i className="poil" style={{ left: "259px", animationDelay: "0.50s" } as CSSProperties} />
              <i className="eclat-b" style={{ "--ex": "-.44", "--ey": ".86" } as CSSProperties} />
              <i className="eclat-b" style={{ "--ex": ".39", "--ey": ".68", animationDelay: ".6s" } as CSSProperties} />
              <i className="eclat-b" style={{ "--ex": "-.02", "--ey": ".98", animationDelay: "1.2s" } as CSSProperties} />
            </span>
            <span className="p p-coucher">
              <b className="zz" style={{ left: "300px" } as CSSProperties}>
                z
              </b>
              <b className="zz" style={{ left: "318px", animationDelay: ".8s", fontSize: "30px" } as CSSProperties}>
                z
              </b>
              <b className="zz" style={{ left: "338px", animationDelay: "1.6s", fontSize: "38px" } as CSSProperties}>
                Z
              </b>
            </span>
            <span className="p p-manger">
              <img className="aliment-s" src={v.scImage} alt="" />
              <i className="miette" style={{ "--mx": "-46px" } as CSSProperties} />
              <i className="miette" style={{ "--mx": "38px", animationDelay: ".35s" } as CSSProperties} />
              <i className="miette" style={{ "--mx": "-20px", animationDelay: ".7s" } as CSSProperties} />
              <i className="miette" style={{ "--mx": "56px", animationDelay: "1.05s" } as CSSProperties} />
            </span>
            <span className="p p-balle">
              <img className="balle-i" src={`${A}interface/icones/balle.png`} alt="" />
            </span>
            <span className="p p-cache">
              <img className="buisson b-g" src={`${A}interface/icones/buisson.png`} alt="" />
              <img className="buisson b-d" src={`${A}interface/icones/buisson.png`} alt="" />
            </span>
            <span className="p p-histoire">
              <img className="livre-i" src={`${A}interface/icones/livre.png`} alt="" />
              <i className="page-t" />
              <b className="etoile-h" style={{ left: "90px" } as CSSProperties}>
                ✦
              </b>
              <b className="etoile-h" style={{ left: "150px", animationDelay: ".8s" } as CSSProperties}>
                ✧
              </b>
              <b className="etoile-h" style={{ left: "120px", animationDelay: "1.6s" } as CSSProperties}>
                ✦
              </b>
            </span>
            <span className="p p-discussion">
              <img className="parole p-g" src={`${A}interface/icones/discussion.png`} alt="" />
              <img className="parole p-d" src={`${A}interface/icones/discussion.png`} alt="" />
            </span>
            <span className="p p-rire">
              <b className="ha" style={{ left: "330px", top: "120px" } as CSSProperties}>
                ha !
              </b>
              <b className="ha" style={{ left: "120px", top: "150px", animationDelay: ".5s" } as CSSProperties}>
                hi hi
              </b>
              <b className="ha" style={{ left: "350px", top: "200px", animationDelay: "1s" } as CSSProperties}>
                ha ha !
              </b>
              <b className="ha" style={{ left: "90px", top: "100px", animationDelay: "1.5s" } as CSSProperties}>
                ha !
              </b>
            </span>
            <span className="p p-dessin">
              <img className="tableau-i" src={`${A}interface/icones/tableau.png`} alt="" />
              <svg className="craie-s" width="70" height="60" viewBox="0 0 70 60" aria-hidden="true">
                <path pathLength="100" d="M8 46c8-18 14-30 22-30s6 22 14 22 10-14 18-24M14 54h40" fill="none" stroke="#f4f1e6" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <span className="p p-cabane">
              <img className="bois-c c1" src={`${A}interface/icones/bois.png`} alt="" />
              <img className="bois-c c2" src={`${A}interface/icones/bois.png`} alt="" />
              <img className="bois-c c3" src={`${A}interface/icones/bois.png`} alt="" />
              <img className="abri-c" src={`${A}interface/icones/abri.png`} alt="" />
            </span>
            <span className="p p-devinette">
              <b className="devine d1">
                ?
              </b>
              <b className="devine d2">
                ?
              </b>
              <b className="devine d3">
                !
              </b>
            </span>
            <span className="p p-bruits">
              <b className="note-m" style={{ left: "80px", animationDelay: "0s" } as CSSProperties}>
                ♪
              </b>
              <b className="note-m" style={{ left: "400px", animationDelay: "0.5s" } as CSSProperties}>
                ♫
              </b>
              <b className="note-m" style={{ left: "120px", animationDelay: "1.1s" } as CSSProperties}>
                ♫
              </b>
              <b className="note-m" style={{ left: "380px", animationDelay: "1.6s" } as CSSProperties}>
                ♪
              </b>
              <b className="note-m" style={{ left: "60px", animationDelay: "2.1s" } as CSSProperties}>
                ♪
              </b>
              <b className="note-m" style={{ left: "420px", animationDelay: "2.5s" } as CSSProperties}>
                ♫
              </b>
            </span>
            <span className="p p-insectes">
              <img className="insecte i1" src={`${A}interface/icones/luciole.png`} alt="" />
              <img className="insecte i2" src={`${A}interface/icones/luciole.png`} alt="" />
              <img className="insecte i3" src={`${A}interface/icones/luciole.png`} alt="" />
            </span>
            <span className="p p-feu">
              <img className="feu-i" src={`${A}interface/icones/feu.png`} alt="" />
              <i className="etincelle" style={{ left: "84px", animationDelay: "0.79s", "--ex": "-17px" } as CSSProperties} />
              <i className="etincelle" style={{ left: "106px", animationDelay: "0.21s", "--ex": "-15px" } as CSSProperties} />
              <i className="etincelle" style={{ left: "120px", animationDelay: "0.63s", "--ex": "25px" } as CSSProperties} />
              <i className="etincelle" style={{ left: "133px", animationDelay: "0.13s", "--ex": "-2px" } as CSSProperties} />
              <i className="etincelle" style={{ left: "121px", animationDelay: "0.88s", "--ex": "26px" } as CSSProperties} />
              <i className="etincelle" style={{ left: "87px", animationDelay: "1.31s", "--ex": "25px" } as CSSProperties} />
              <i className="etincelle" style={{ left: "140px", animationDelay: "0.45s", "--ex": "-4px" } as CSSProperties} />
              <i className="etincelle" style={{ left: "115px", animationDelay: "1.09s", "--ex": "-6px" } as CSSProperties} />
            </span>
            <span className="p p-lecon">
              <img className="tableau-i" src={`${A}interface/icones/tableau.png`} alt="" />
              <svg className="craie-s" width="70" height="60" viewBox="0 0 70 60" aria-hidden="true">
                <path pathLength="100" d="M8 14h40M8 28h52M8 42h30" fill="none" stroke="#f4f1e6" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <b className="devine d3" style={{ left: "330px" } as CSSProperties}>
                !
              </b>
            </span>
            <span className="p p-probleme">
              <img className="tableau-i" src={`${A}interface/icones/tableau.png`} alt="" />
              <b className="craie-t q">
                ?
              </b>
              <b className="craie-t r">
                !
              </b>
              <b className="devine d1" style={{ left: "330px" } as CSSProperties}>
                ?
              </b>
            </span>
            <span className="p p-pierres">
              <img className="pierre-i" src={`${A}interface/icones/pierre.png`} alt="" />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "-60px", animationDelay: "0s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "55px", animationDelay: "0.45s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "-35px", animationDelay: "0.9s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "70px", animationDelay: "1.35s" } as CSSProperties} />
            </span>
            <span className="p p-equilibre">
              <img className="buche-e" src={`${A}interface/icones/bois.png`} alt="" />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "-60px", animationDelay: "0s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "55px", animationDelay: "0.45s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "-35px", animationDelay: "0.9s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "70px", animationDelay: "1.35s" } as CSSProperties} />
            </span>
            <span className="p p-sauter">
              <i className="poussiere" style={{ left: "205px", animationDelay: "0s" } as CSSProperties} />
              <i className="poussiere" style={{ left: "280px", animationDelay: "0s" } as CSSProperties} />
              <i className="poussiere" style={{ left: "225px", animationDelay: "0.55s" } as CSSProperties} />
              <i className="poussiere" style={{ left: "300px", animationDelay: "0.55s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "-60px", animationDelay: "0s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "55px", animationDelay: "0.45s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "-35px", animationDelay: "0.9s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "70px", animationDelay: "1.35s" } as CSSProperties} />
            </span>
            <span className="p p-course">
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "-60px", animationDelay: "0s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "55px", animationDelay: "0.45s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "-35px", animationDelay: "0.9s" } as CSSProperties} />
              <img className="sueur" src={`${A}interface/icones/sueur.png`} alt="" style={{ "--sx": "70px", animationDelay: "1.35s" } as CSSProperties} />
            </span>
            <span className="p p-mediter">
              <i className="aura" />
            </span>
            <span className="p p-ranger">
              <span className="caisse" />
              <img className="objet-r o1" src={`${A}interface/icones/balle.png`} alt="" />
              <img className="objet-r o2" src={`${A}interface/icones/pierre.png`} alt="" />
              <img className="objet-r o3" src={`${A}interface/icones/bois.png`} alt="" />
              <img className="objet-r o4" src={`${A}interface/icones/livre.png`} alt="" />
            </span>
            <span className="p p-barriere">
              <img className="barriere-i" src={`${A}interface/icones/barriere.png`} alt="" />
              <img className="planche-i" src={`${A}interface/icones/bois.png`} alt="" />
              <img className="marteau-i" src={`${A}interface/icones/marteau.png`} alt="" />
              <i className="choc" />
            </span>
            <span className="p p-poules">
              <img className="poule-i q1" src={`${A}interface/icones/poule.png`} alt="" />
              <img className="poule-i q2" src={`${A}interface/icones/poule.png`} alt="" />
              <i className="poussiere" style={{ left: "205px", animationDelay: "0s" } as CSSProperties} />
              <i className="poussiere" style={{ left: "280px", animationDelay: "0s" } as CSSProperties} />
              <i className="poussiere" style={{ left: "225px", animationDelay: "0.55s" } as CSSProperties} />
              <i className="poussiere" style={{ left: "300px", animationDelay: "0.55s" } as CSSProperties} />
            </span>
            <span className="p p-foin">
              <img className="gerbe-porte" src={`${A}interface/icones/gerbe.png`} alt="" />
              <img className="gerbe-tas t1" src={`${A}interface/icones/gerbe.png`} alt="" />
              <img className="gerbe-tas t2" src={`${A}interface/icones/gerbe.png`} alt="" />
              <img className="gerbe-tas t3" src={`${A}interface/icones/gerbe.png`} alt="" />
            </span>
            <span className="p p-eau">
              <img className="seau-porte" src={`${A}interface/icones/seau.png`} alt="" />
              <i className="goutte-e" style={{ animationDelay: ".2s" } as CSSProperties} />
              <i className="goutte-e" style={{ animationDelay: ".9s", "--gx": "16px" } as CSSProperties} />
            </span>
            <span className="p p-corde">
              <svg className="corde-s" width="300" height="40" viewBox="0 0 300 40" aria-hidden="true">
                <path d="M0 20c40-6 80 6 120 0s80-6 120 0 40 4 60 0" fill="none" stroke="#3a1f0e" strokeWidth="11" strokeLinecap="round" />
                <path d="M0 20c40-6 80 6 120 0s80-6 120 0 40 4 60 0" fill="none" stroke="#d6b67c" strokeWidth="7" strokeDasharray="7 5" strokeLinecap="round" />
                <circle cx="150" cy="20" r="9" fill="#9c3b2a" stroke="#3a1f0e" strokeWidth="2.5" />
              </svg>
              <i className="poussiere" style={{ left: "205px", animationDelay: "0s" } as CSSProperties} />
              <i className="poussiere" style={{ left: "280px", animationDelay: "0s" } as CSSProperties} />
              <i className="poussiere" style={{ left: "225px", animationDelay: "0.55s" } as CSSProperties} />
              <i className="poussiere" style={{ left: "300px", animationDelay: "0.55s" } as CSSProperties} />
            </span>
            <span className="p p-saut">
              <svg className="buche" width="110" height="46" viewBox="0 0 110 46" aria-hidden="true">
                <rect x="4" y="6" width="98" height="34" rx="17" fill="#8a5530" stroke="#3a1f0e" strokeWidth="3" />
                <ellipse cx="96" cy="23" rx="10" ry="16" fill="#d2a46a" stroke="#3a1f0e" strokeWidth="3" />
                <path d="M20 18h40M28 30h36" stroke="#5e381b" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <span className="gain-lueur">
              <i className="scintille" style={{ left: "229px", top: "208px", animationDelay: "0.10s" } as CSSProperties} />
              <i className="scintille" style={{ left: "208px", top: "229px", animationDelay: "0.79s" } as CSSProperties} />
              <i className="scintille" style={{ left: "173px", top: "294px", animationDelay: "1.00s" } as CSSProperties} />
              <i className="scintille" style={{ left: "216px", top: "237px", animationDelay: "0.34s" } as CSSProperties} />
              <i className="scintille" style={{ left: "207px", top: "277px", animationDelay: "0.64s" } as CSSProperties} />
              <i className="scintille" style={{ left: "326px", top: "314px", animationDelay: "0.38s" } as CSSProperties} />
              <i className="scintille" style={{ left: "202px", top: "301px", animationDelay: "1.14s" } as CSSProperties} />
              <i className="scintille" style={{ left: "183px", top: "286px", animationDelay: "1.08s" } as CSSProperties} />
              <i className="scintille" style={{ left: "313px", top: "270px", animationDelay: "0.48s" } as CSSProperties} />
              <i className="scintille" style={{ left: "270px", top: "196px", animationDelay: "0.58s" } as CSSProperties} />
            </span>
            <div className="essais">
              {(v.scEssais || []).map((xEs14: any, i14: number) => (
                <Fragment key={i14}>
                  <span className={`essai ${xEs14.cls}`} style={{ animationDelay: `${xEs14.delai}s` } as CSSProperties}>
                    {xEs14.signe}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
          {v.scNote ? (<>
            <div className="sc-note" onClick={v.fermerScene} role="status">
              <div className="sn-titre">
                {v.scTitre}
              </div>
              {(v.scLignes || []).map((xL15: any, i15: number) => (
                <Fragment key={i15}>
                  <div className="sn-ligne">
                    {xL15.t}
                  </div>
                </Fragment>
              ))}
              {v.scAGains ? (<>
                <div className="sn-gains">
                  {(v.scGains || []).map((xG16: any, i16: number) => (
                    <Fragment key={i16}>
                      <span className="sn-gain" style={{ animationDelay: `${xG16.delai}s` } as CSSProperties}>
                        {xG16.nom}
                        <b>
                          {xG16.fleches}
                        </b>
                      </span>
                    </Fragment>
                  ))}
                </div>
              </>) : null}
              {v.scAReponses ? (<>
                <div className="sn-reponses">
                  {(v.scReponses || []).map((xR17: any, i17: number) => (
                    <Fragment key={i17}>
                      <button className={`sn-reponse ${xR17.cls}`} onClick={xR17.choisir}>
                        {xR17.texte}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </>) : null}
              {v.scSansReponse ? (<>
                <div className="sn-suite">
                  continuer
                </div>
              </>) : null}
            </div>
          </>) : null}
        </div>
      </>) : null}
      {/* Événement : le carnet s'ouvre avec le personnage du joueur */}
      <div className="evc" style={{ position: "absolute", inset: "0", zIndex: "975", pointerEvents: "none" } as CSSProperties}>
        <div className={`evc-scrim ${v.evcScrim}`} />
        {v.evcVisible ? (<>
          <div className={v.playClass} style={{ position: "absolute", inset: "0", pointerEvents: "none" } as CSSProperties}>
            {/* Carnet : arrive fermé depuis le coin gauche (le petit carnet), puis s'ouvre */}
            <section aria-label="Dialogue" onClick={v.passerTexte} style={{ position: "absolute", left: "250px", bottom: "20px", width: "934px", height: "300px", filter: v.paperFilter, pointerEvents: "auto" } as CSSProperties}>
              <div className="wrap" style={{ position: "absolute", inset: "0", perspective: "1800px" } as CSSProperties}>
                {/* Fiche de réponse longue : glisse depuis l'arrière du carnet */}
                <div className={`peek ${v.peekClass}`} aria-live="polite" style={{ position: "absolute", left: "540px", bottom: "262px", width: "340px", padding: "14px 18px 54px", boxSizing: "border-box", borderRadius: "8px 8px 0 0", background: "repeating-linear-gradient(0deg,transparent 0 27px,rgba(122,90,58,.12) 27px 28px),#fbf4e3", boxShadow: "0 0 0 1.5px #3a1f0e,0 -8px 20px rgba(30,14,4,.28)" } as CSSProperties}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" } as CSSProperties}>
                    <span style={{ flex: "none", width: "26px", height: "26px", boxSizing: "border-box", borderRadius: "50%", border: `2.5px ${v.peekBorder} ${v.peekColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: v.peekColor } as CSSProperties}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={v.peekIcon} />
                      </svg>
                    </span>
                    <span style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "12px", letterSpacing: "1px", color: v.peekColor } as CSSProperties}>
                      {v.peekLabel}
                    </span>
                    <span style={{ marginLeft: "auto", fontFamily: "'Reenie Beanie',cursive", fontSize: "20px", lineHeight: "1", color: "#6b4f33" } as CSSProperties}>
                      réponse complète
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: "16.5px", lineHeight: "1.45", color: "#2b2118" } as CSSProperties}>
                    {v.peekText}
                  </p>
                </div>
                {/* Moitié droite : plat arrière + page des choix */}
                <div style={{ position: "absolute", left: "467px", top: "0", width: "467px", height: "300px", borderRadius: "0 16px 16px 0", boxShadow: `inset 0 0 0 2px #3a1f0e,inset 0 0 0 7px #6e3f22,inset 0 0 22px rgba(30,14,4,.45),0 6px 0 #4a2814,0 18px 40px rgba(20,10,4,.45),0 0 90px rgba(255,170,80,${v.paperGlow})`, background: "#6e3f22" } as CSSProperties}>
                  <div className="stitch" style={{ borderRadius: "0 11px 11px 0", left: "0", borderLeft: "none" } as CSSProperties} />
                  <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", top: "0" } as CSSProperties}>
                    <path d="M32 32V10a8 8 0 0 0-8-8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                  </svg>
                  <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", bottom: "0" } as CSSProperties}>
                    <path d="M32 2v22a8 8 0 0 1-8 8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                  </svg>
                  <div style={{ position: "absolute", left: "10px", right: "20px", top: "16px", bottom: "16px", padding: "24px 24px 18px 58px", borderRadius: "0 4px 4px 0", overflow: "hidden", boxShadow: "0 0 0 1.5px #3a1f0e,1.5px 1.5px 0 #efe4cc,3px 3px 0 #d6c4a0,4.5px 4.5px 0 #ece0c6,6px 6px 0 #cbb893,7.5px 7.5px 0 #e6d8bb,8.5px 8.5px 0 #3a1f0e", background: "linear-gradient(90deg,#c9b68e 0%,#e2d3b2 6%,#f4ead6 18%,#f4ead6 100%)" } as CSSProperties}>
                    <div style={{ position: "absolute", inset: "0", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px)", pointerEvents: "none" } as CSSProperties} />
                    <div className="flip-shade" style={{ position: "absolute", inset: "0", background: "linear-gradient(90deg,rgba(30,14,4,.55),rgba(30,14,4,.1))", pointerEvents: "none" } as CSSProperties} />
                    {v.showRecap ? (<>
                      <div className={`recap ${v.recapOn}`} style={{ position: "relative" } as CSSProperties}>
                        <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "26px", lineHeight: "1", color: "#6b4f33" } as CSSProperties}>
                          {v.echoNom} s'en souviendra…
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "18px" } as CSSProperties}>
                          {v.notReveal ? (<>
                            <span style={{ flex: "none", width: "46px", height: "46px", boxSizing: "border-box", borderRadius: "50%", border: `3px ${v.rcBorder} ${v.rcColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: v.rcColor, boxShadow: `0 0 ${v.inkGlow}px ${v.rcGlow}` } as CSSProperties}>
                              <span className="glyphe" style={{ width: "30px", height: "30px", "--g": v.rcGlyphe } as CSSProperties} aria-hidden="true" />
                            </span>
                            <div>
                              <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "17px", letterSpacing: "1.5px", color: v.rcColor } as CSSProperties}>
                                {v.rcLabel}
                              </div>
                              <div style={{ fontSize: "15px", fontStyle: "italic", color: "#5a4632" } as CSSProperties}>
                                {v.rcNote}
                              </div>
                            </div>
                          </>) : null}
                          {v.isReveal ? (<>
                            <div className={`reveal ${v.revealCls}`} style={{ position: "relative", flex: "none", width: "46px", height: "46px" } as CSSProperties}>
                              <span className="flash" />
                              <span className="spk" style={{ "--a": "0deg" } as CSSProperties} />
                              <span className="spk" style={{ "--a": "45deg" } as CSSProperties} />
                              <span className="spk" style={{ "--a": "90deg" } as CSSProperties} />
                              <span className="spk" style={{ "--a": "135deg" } as CSSProperties} />
                              <span className="spk" style={{ "--a": "180deg" } as CSSProperties} />
                              <span className="spk" style={{ "--a": "225deg" } as CSSProperties} />
                              <span className="spk" style={{ "--a": "270deg" } as CSSProperties} />
                              <span className="spk" style={{ "--a": "315deg" } as CSSProperties} />
                              <span className="ring-old" style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "50%", border: "3px dashed #9a8668", display: "flex", alignItems: "center", justifyContent: "center", color: "#9a8668" } as CSSProperties}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01" />
                                </svg>
                              </span>
                              <span className="ring-new" style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "50%", border: `3px solid ${v.rvColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: v.rvColor, boxShadow: `0 0 14px ${v.rvGlow}` } as CSSProperties}>
                                <span className="glyphe" style={{ width: "30px", height: "30px", "--g": v.rvGlyphe } as CSSProperties} aria-hidden="true" />
                              </span>
                            </div>
                            <div className={`reveal-txt ${v.revealCls}`} style={{ display: "grid" } as CSSProperties}>
                              <div className="lbl-old" style={{ gridArea: "1/1" } as CSSProperties}>
                                <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "17px", letterSpacing: "1.5px", color: "#9a8668" } as CSSProperties}>
                                  Tempérament inconnu
                                </div>
                                <div style={{ fontSize: "15px", fontStyle: "italic", color: "#5a4632" } as CSSProperties}>
                                  Quelque chose a changé… mais quoi ?
                                </div>
                              </div>
                              <div className="lbl-new" style={{ gridArea: "1/1" } as CSSProperties}>
                                <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "17px", letterSpacing: "1.5px", color: v.rvColor } as CSSProperties}>
                                  {v.rvLabel}
                                </div>
                                <div style={{ fontSize: "15px", fontStyle: "italic", color: "#5a4632" } as CSSProperties}>
                                  {v.rvNote}
                                </div>
                              </div>
                            </div>
                          </>) : null}
                          <span className={`ts-tampon ${v.tamponCls}`} style={{ "--tc": v.tamponCouleur, "--dl": `${v.tamponDelai}s` } as CSSProperties}>
                            {v.tamponTexte}
                          </span>
                        </div>
                        {v.isReveal ? (<>
                          <div className={`reveal-txt ${v.revealCls}`}>
                            <div className="lbl-new" style={{ marginTop: "10px", fontFamily: "'Reenie Beanie',cursive", fontSize: "24px", lineHeight: "1", color: "#b3671a" } as CSSProperties}>
                              Tempérament découvert !
                            </div>
                          </div>
                        </>) : null}
                        <button onClick={v.onReset} style={{ marginTop: "26px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", border: "none", borderRadius: "6px", background: "#6e3f22", color: "#f6ecd6", fontFamily: "'Alegreya SC',serif", fontSize: "14px", letterSpacing: "1px", cursor: "pointer", boxShadow: "inset 0 0 0 2px #3a1f0e,inset 0 0 0 4px #6e3f22,inset 0 0 0 5px rgba(240,214,170,.5)" } as CSSProperties}>
                          Refermer le carnet
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <path d="M9 6l6 6-6 6" />
                          </svg>
                        </button>
                      </div>
                    </>) : null}
                    {v.showChoices ? (<>
                      <div style={{ position: "relative", fontFamily: "'Reenie Beanie',cursive", fontSize: "26px", lineHeight: "1", color: "#6b4f33" } as CSSProperties}>
                        Que faire ?
                      </div>
                      <div className={`ts-slot ${v.tsCls}`} aria-label={`Tempérament en jeu : ${v.tsLabel}`}>
                        <span className="ts-nom">
                          {v.tsLabel}
                        </span>
                        <span className="ts-rond" style={{ borderColor: v.tsColor, color: v.tsColor } as CSSProperties}>
                          <span className="glyphe" style={{ width: "22px", height: "22px", "--g": v.tsGlyphe } as CSSProperties} aria-hidden="true" />
                        </span>
                      </div>
                      <div className={v.choicesClass} style={{ position: "relative", display: "flex", flexDirection: "column", gap: `${v.listGap}px`, marginTop: "10px", width: "342px" } as CSSProperties}>
                        {(v.answers || []).map((xA18: any, i18: number) => (
                          <Fragment key={i18}>
                            <button className={xA18.cls} onClick={xA18.pick} onMouseEnter={xA18.enter} onFocus={xA18.enter} style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: xA18.pad, border: "none", borderRadius: "4px", background: "transparent", textAlign: "left", fontFamily: "'Alegreya',serif", fontSize: "16.5px", color: "#2b2118", cursor: "pointer", transitionDelay: xA18.delay } as CSSProperties}>
                              <span style={{ flex: "none", width: "28px", height: "28px", boxSizing: "border-box", borderRadius: "50%", border: `2.5px ${xA18.borderStyle} ${xA18.color}`, display: "flex", alignItems: "center", justifyContent: "center", color: xA18.color, boxShadow: `0 0 ${xA18.glow}px ${xA18.glowColor}` } as CSSProperties}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d={xA18.icon} />
                                </svg>
                              </span>
                              <span style={{ minWidth: "0", flex: "1" } as CSSProperties}>
                                <span style={{ display: "block", fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: `${xA18.labelSize}px`, letterSpacing: "1px", color: xA18.color } as CSSProperties}>
                                  {xA18.label}
                                </span>
                                {xA18.showText ? (<>
                                  <span className="ans">
                                    {xA18.text}
                                  </span>
                                </>) : null}
                              </span>
                              {xA18.sheetIcon ? (<>
                                <span title="Voir la réponse" style={{ flex: "none", marginLeft: "auto", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b4f33" } as CSSProperties}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <path d="M6 3h9l4 4v14H6z" />
                                    <path d="M15 3v4h4M9 12h7M9 16h5" />
                                  </svg>
                                </span>
                              </>) : null}
                              <svg className={xA18.stampCls} viewBox="0 0 40 40" aria-hidden="true">
                                <circle cx="20" cy="20" r="16.5" fill="rgba(63,122,58,.08)" stroke="#3f7a3a" strokeWidth="3" />
                                <circle cx="20" cy="20" r="12.5" fill="none" stroke="#3f7a3a" strokeWidth="1.2" strokeDasharray="2 2.2" />
                                <path d="M12.5 20.5l5 5 10-11" fill="none" stroke="#3f7a3a" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </Fragment>
                        ))}
                      </div>
                    </>) : null}
                  </div>
                  {/* Marque-page : fixé en tête de reliure, il court le long du pli puis pend sous le carnet */}
                  <svg width="80" height="370" viewBox="0 0 80 370" aria-hidden="true" style={{ position: "absolute", left: "0", top: "0", overflow: "visible", filter: "drop-shadow(1.5px 2.5px 1.5px rgba(30,14,4,.35))" } as CSSProperties}>
                    <defs>
                      <linearGradient id="evcRibHead" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#2a1208" stopOpacity=".75" />
                        <stop offset="1" stopColor="#2a1208" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M22 4 C20 100 30 200 34 300 C35 316 30 330 22 342" fill="none" stroke="#5e1a12" strokeWidth="15" />
                    <path d="M22 4 C20 100 30 200 34 300 C35 316 30 330 22 342" fill="none" stroke="#9c3b2a" strokeWidth="12.5" />
                    <path d="M22 4 C20 100 30 200 34 300 C35 316 30 330 22 342" fill="none" stroke="#c65a44" strokeWidth="3" opacity=".55" transform="translate(-2.5 0)" />
                    <path d="M22 4 C20 100 30 200 34 300 C35 316 30 330 22 342" fill="none" stroke="#3e0f0a" strokeWidth="1.2" opacity=".35" transform="translate(3.5 0)" />
                    <path d="M27.8 345.9 L21.7 355 L19.8 345.3 L10.1 347.3 L16.2 338.1 Z" fill="#9c3b2a" stroke="#5e1a12" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M28.5 296 C34 302 34 306 33 312" fill="none" stroke="#2a1208" strokeWidth="13" opacity=".18" />
                    <rect x="8" y="2" width="30" height="22" fill="url(#evcRibHead)" />
                  </svg>
                </div>
                {/* Quelques pages qui tournent après la couverture */}
                <div className="sheet sh3" style={{ position: "absolute", left: "471px", top: "16px", width: "443px", height: "268px", transformOrigin: "0 50%", transformStyle: "preserve-3d" } as CSSProperties}>
                  <div className="face" style={{ position: "absolute", inset: "0", borderRadius: "0 4px 4px 0", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px),linear-gradient(90deg,#c9b68e 0%,#e2d3b2 6%,#f4ead6 18%,#efe4cc 100%)", boxShadow: "0 0 0 1px rgba(58,31,14,.5)" } as CSSProperties} />
                  <div className="face back" style={{ position: "absolute", inset: "0", borderRadius: "4px 0 0 4px", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px),linear-gradient(90deg,#efe4cc 0%,#f4ead6 82%,#e2d3b2 94%,#c9b68e 100%)", boxShadow: "0 0 0 1px rgba(58,31,14,.5)" } as CSSProperties} />
                </div>
                <div className="sheet sh2" style={{ position: "absolute", left: "471px", top: "16px", width: "443px", height: "268px", transformOrigin: "0 50%", transformStyle: "preserve-3d" } as CSSProperties}>
                  <div className="face" style={{ position: "absolute", inset: "0", borderRadius: "0 4px 4px 0", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px),linear-gradient(90deg,#c9b68e 0%,#e2d3b2 6%,#f4ead6 18%,#f2e7d0 100%)", boxShadow: "0 0 0 1px rgba(58,31,14,.5)" } as CSSProperties} />
                  <div className="face back" style={{ position: "absolute", inset: "0", borderRadius: "4px 0 0 4px", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px),linear-gradient(90deg,#f2e7d0 0%,#f4ead6 82%,#e2d3b2 94%,#c9b68e 100%)", boxShadow: "0 0 0 1px rgba(58,31,14,.5)" } as CSSProperties} />
                </div>
                <div className="sheet sh1" style={{ position: "absolute", left: "471px", top: "16px", width: "443px", height: "268px", transformOrigin: "0 50%", transformStyle: "preserve-3d" } as CSSProperties}>
                  <div className="face" style={{ position: "absolute", inset: "0", borderRadius: "0 4px 4px 0", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px),linear-gradient(90deg,#c9b68e 0%,#e2d3b2 6%,#f4ead6 18%,#f4ead6 100%)", boxShadow: "0 0 0 1px rgba(58,31,14,.5)" } as CSSProperties} />
                  <div className="face back" style={{ position: "absolute", inset: "0", borderRadius: "4px 0 0 4px", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px),linear-gradient(90deg,#f4ead6 0%,#f4ead6 82%,#e2d3b2 94%,#c9b68e 100%)", boxShadow: "0 0 0 1px rgba(58,31,14,.5)" } as CSSProperties} />
                </div>
                {/* Rabat : couverture (recto) puis page de gauche (verso) */}
                <div className="flap" style={{ position: "absolute", left: "467px", top: "0", width: "467px", height: "300px", transformOrigin: "0 50%", transformStyle: "preserve-3d" } as CSSProperties}>
                  <div className="face" style={{ position: "absolute", inset: "0", borderRadius: "0 16px 16px 0", background: "#6e3f22", boxShadow: "inset 0 0 0 2px #3a1f0e,inset 0 0 0 7px #6e3f22,inset 0 0 26px rgba(30,14,4,.5),0 5px 0 #4a2814,0 20px 40px rgba(20,10,4,.45)" } as CSSProperties}>
                    <div className="stitch" style={{ borderRadius: "0 11px 11px 0" } as CSSProperties} />
                    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", top: "0" } as CSSProperties}>
                      <path d="M32 32V10a8 8 0 0 0-8-8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                    </svg>
                    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", bottom: "0" } as CSSProperties}>
                      <path d="M32 2v22a8 8 0 0 1-8 8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                    </svg>
                    <div style={{ position: "absolute", left: "0", top: "0", bottom: "0", width: "22px", background: "linear-gradient(90deg,#4a2814,rgba(110,63,34,0))", borderRadius: "0" } as CSSProperties} />
                    <div style={{ position: "absolute", inset: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" } as CSSProperties}>
                      <svg width="78" height="78" viewBox="0 0 78 78" aria-hidden="true">
                        <circle cx="39" cy="39" r="34" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2.5" />
                        <circle cx="39" cy="40" r="34" fill="none" stroke="rgba(240,200,150,.18)" strokeWidth="1.5" />
                        <path d="M39 58c-9 0-14-7-14-15s6-13 14-13 14 5 14 13-5 15-14 15zM39 30c0-6 3-10 9-12M39 30c-1-5-5-8-10-8" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "18px", letterSpacing: "4px", color: "rgba(30,14,4,.5)", textShadow: "0 1px 0 rgba(240,200,150,.2)" } as CSSProperties}>
                        Carnet d'éleveur
                      </div>
                    </div>
                  </div>
                  <div className="face back" style={{ position: "absolute", inset: "0", borderRadius: "16px 0 0 16px", background: "#6e3f22", boxShadow: `inset 0 0 0 2px #3a1f0e,inset 0 0 0 7px #6e3f22,inset 0 0 22px rgba(30,14,4,.45),0 6px 0 #4a2814,0 18px 40px rgba(20,10,4,.45),0 0 90px rgba(255,170,80,${v.paperGlow})` } as CSSProperties}>
                    <div className="stitch" style={{ borderRadius: "11px 0 0 11px", right: "0", borderRight: "none" } as CSSProperties} />
                    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", left: "0", top: "0" } as CSSProperties}>
                      <path d="M2 32V10a8 8 0 0 1 8-8h22z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                    </svg>
                    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", left: "0", bottom: "0" } as CSSProperties}>
                      <path d="M2 2v22a8 8 0 0 0 8 8h22z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                    </svg>
                    <div style={{ position: "absolute", left: "20px", right: "10px", top: "16px", bottom: "16px", padding: "28px 30px 20px 140px", borderRadius: "4px 0 0 4px", overflow: "hidden", boxShadow: "0 0 0 1.5px #3a1f0e,-1.5px 1.5px 0 #efe4cc,-3px 3px 0 #d6c4a0,-4.5px 4.5px 0 #ece0c6,-6px 6px 0 #cbb893,-7.5px 7.5px 0 #e6d8bb,-8.5px 8.5px 0 #3a1f0e", background: "linear-gradient(90deg,#f4ead6 0%,#f4ead6 82%,#e2d3b2 94%,#c9b68e 100%)" } as CSSProperties}>
                      <div style={{ position: "absolute", inset: "0", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px)", pointerEvents: "none" } as CSSProperties} />
                      {v.isNarration ? (<>
                        <div style={{ position: "relative", fontFamily: "'Reenie Beanie',cursive", fontSize: "28px", lineHeight: "1", color: "#6b4f33" } as CSSProperties}>
                          {v.titreGauche}
                        </div>
                      </>) : null}
                      {v.isDialogue ? (<>
                        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" } as CSSProperties}>
                          <div className="stamp2" style={{ display: "inline-block", padding: "3px 12px 1px", border: "2.5px solid #9c3b2a", borderRadius: "5px", color: "#9c3b2a", fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "20px", letterSpacing: "3px" } as CSSProperties}>
                            {v.joueurNom}
                          </div>
                          <div className={v.voiceClass} aria-label="Voix" style={{ display: "flex", alignItems: "center", gap: "2px", height: "18px" } as CSSProperties}>
                            <span className="vb" style={{ width: "3px", height: "6px", borderRadius: "2px", background: "#9c3b2a" } as CSSProperties} />
                            <span className="vb" style={{ width: "3px", height: "12px", borderRadius: "2px", background: "#9c3b2a", animationDelay: "-.2s" } as CSSProperties} />
                            <span className="vb" style={{ width: "3px", height: "9px", borderRadius: "2px", background: "#9c3b2a", animationDelay: "-.4s" } as CSSProperties} />
                            <span className="vb" style={{ width: "3px", height: "14px", borderRadius: "2px", background: "#9c3b2a", animationDelay: "-.1s" } as CSSProperties} />
                          </div>
                        </div>
                      </>) : null}
                      <p style={{ position: "relative", margin: "12px 0 0", fontSize: `${v.textSize}px`, lineHeight: "1.55", minHeight: "118px", fontStyle: v.textStyle } as CSSProperties}>
                        {v.seg1}
                        <em>
                          {v.seg2}
                        </em>
                        {v.seg3}
                        <span className={v.caretClass} style={{ display: "inline-block", width: "9px", height: "18px", marginLeft: "3px", verticalAlign: "-3px", background: "#9c3b2a" } as CSSProperties} />
                      </p>
                    </div>
                  </div>
                </div>
                {/* Page qui tourne après validation : recto = la page des choix tamponnée, verso = la réponse choisie (« Vous réprimandez Filo ») */}
                <div className={`turnsheet ${v.turnCls}`} style={{ position: "absolute", left: "471px", top: "16px", width: "443px", height: "268px", transformOrigin: "0 50%", transformStyle: "preserve-3d" } as CSSProperties}>
                  <div className="face" style={{ position: "absolute", inset: "0", borderRadius: "0 4px 4px 0", padding: "24px 24px 18px 58px", boxSizing: "border-box", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px),linear-gradient(90deg,#c9b68e 0%,#e2d3b2 6%,#f4ead6 18%,#f4ead6 100%)", boxShadow: "0 0 0 1px rgba(58,31,14,.5)" } as CSSProperties}>
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "26px", lineHeight: "1", color: "#6b4f33" } as CSSProperties}>
                      Que faire ?
                    </div>
                    <div className={`ts-slot ${v.tsCls}`} aria-label={`Tempérament en jeu : ${v.tsLabel}`}>
                      <span className="ts-nom">
                        {v.tsLabel}
                      </span>
                      <span className="ts-rond" style={{ borderColor: v.tsColor, color: v.tsColor } as CSSProperties}>
                        <span className="glyphe" style={{ width: "22px", height: "22px", "--g": v.tsGlyphe } as CSSProperties} aria-hidden="true" />
                      </span>
                    </div>
                    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: `${v.listGap}px`, marginTop: "10px", width: "342px" } as CSSProperties}>
                      {(v.answers || []).map((xA19: any, i19: number) => (
                        <Fragment key={i19}>
                          <div className={xA19.ghostCls} aria-hidden="true" style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: xA19.pad, border: "none", borderRadius: "4px", background: "transparent", textAlign: "left", fontFamily: "'Alegreya',serif", fontSize: "16.5px", color: "#2b2118", transitionDelay: xA19.delay } as CSSProperties}>
                            <span style={{ flex: "none", width: "28px", height: "28px", boxSizing: "border-box", borderRadius: "50%", border: `2.5px ${xA19.borderStyle} ${xA19.color}`, display: "flex", alignItems: "center", justifyContent: "center", color: xA19.color, boxShadow: `0 0 ${xA19.glow}px ${xA19.glowColor}` } as CSSProperties}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d={xA19.icon} />
                              </svg>
                            </span>
                            <span style={{ minWidth: "0", flex: "1" } as CSSProperties}>
                              <span style={{ display: "block", fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: `${xA19.labelSize}px`, letterSpacing: "1px", color: xA19.color } as CSSProperties}>
                                {xA19.label}
                              </span>
                              {xA19.showText ? (<>
                                <span className="ans">
                                  {xA19.text}
                                </span>
                              </>) : null}
                            </span>
                            {xA19.never ? (<>
                              <span title="Voir la réponse" style={{ flex: "none", marginLeft: "auto", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b4f33" } as CSSProperties}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                  <path d="M6 3h9l4 4v14H6z" />
                                  <path d="M15 3v4h4M9 12h7M9 16h5" />
                                </svg>
                              </span>
                            </>) : null}
                            <svg className={xA19.ghostStamp} viewBox="0 0 40 40" aria-hidden="true">
                              <circle cx="20" cy="20" r="16.5" fill="rgba(63,122,58,.08)" stroke="#3f7a3a" strokeWidth="3" />
                              <circle cx="20" cy="20" r="12.5" fill="none" stroke="#3f7a3a" strokeWidth="1.2" strokeDasharray="2 2.2" />
                              <path d="M12.5 20.5l5 5 10-11" fill="none" stroke="#3f7a3a" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="face back" style={{ position: "absolute", inset: "0", borderRadius: "4px 0 0 4px", padding: "28px 30px 20px 120px", boxSizing: "border-box", background: "repeating-linear-gradient(0deg,transparent 0 31px,rgba(122,90,58,.12) 31px 32px),linear-gradient(90deg,#f4ead6 0%,#f4ead6 82%,#e2d3b2 94%,#c9b68e 100%)", boxShadow: "0 0 0 1px rgba(58,31,14,.5)" } as CSSProperties}>
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "28px", lineHeight: "1", color: "#6b4f33" } as CSSProperties}>
                      {v.titreReponse}
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Portrait + halo */}
            <div className="halo-in" style={{ position: "absolute", left: "170px", bottom: "300px", width: "300px", height: "300px" } as CSSProperties}>
              <div className="halo" style={{ width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,200,120,.55) 0%,rgba(255,170,80,.16) 45%,transparent 70%)" } as CSSProperties} />
            </div>
            <div className={`portrait portrait-blur ${v.talkClass}`} aria-hidden="true">
              <img src={v.avatarImg} alt="" style={{ filter: `blur(7px) ${v.portraitFilter}` } as CSSProperties} />
            </div>
            <div className={`portrait portrait-fade ${v.talkClass}`} style={{ filter: v.portraitFilter } as CSSProperties}>
              {(v.poses || []).map((xP20: any, i20: number) => (
                <Fragment key={i20}>
                  <img className={`pose ${xP20.cls}`} src={xP20.src} alt={xP20.alt} style={{ opacity: xP20.op, position: xP20.pos, left: "40px", top: "40px" } as CSSProperties} />
                </Fragment>
              ))}
            </div>
          </div>
        </>) : null}
      </div>
      {/* Départ en exploration (transition) */}
      {v.sortieVisible ? (<>
        <div className={`sortie ${v.sortieCls}`}>
          <div style={{ textAlign: "center" } as CSSProperties}>
            {v.sortieImage ? (<>
              <img src={v.sortieImage} alt="" style={{ display: "block", margin: "0 auto 10px", maxHeight: "220px" } as CSSProperties} />
            </>) : null}
            <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "46px", color: "#fbf3e2", textShadow: "0 2px 10px rgba(0,0,0,.8)" } as CSSProperties}>
              {v.sortieTexte}
            </div>
            {v.sortieSous ? (<>
              <div style={{ fontFamily: "'Alegreya',serif", fontStyle: "italic", fontSize: "20px", color: "#efe0c2", textShadow: "0 2px 8px rgba(0,0,0,.8)", marginTop: "6px" } as CSSProperties}>
                {v.sortieSous}
              </div>
            </>) : null}
            {v.sortieBouton ? (<>
              <button className="sortie-bouton" onClick={v.sortieBouton.agir}>
                {v.sortieBouton.texte}
              </button>
            </>) : null}
          </div>
        </div>
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
              {(v.sacCases || []).map((xC21: any, i21: number) => (
                <Fragment key={i21}>
                  <button className={`case ${xC21.cls}`} style={{ animationDelay: `${xC21.delai}s` } as CSSProperties} draggable={xC21.plein} onDragStart={xC21.prendreDnd} onDragOver={xC21.survolDnd} onDragLeave={xC21.quitteDnd} onDrop={xC21.deposer} onDragEnd={xC21.finDnd} onMouseEnter={xC21.survol} onClick={xC21.choisir} aria-disabled={!!(xC21.vide)} aria-haspopup="menu" aria-label={xC21.nom}>
                    {xC21.plein ? (<>
                      <img src={xC21.image} alt="" />
                      <span className="sceau qte" style={{ background: "#6e3f22" } as CSSProperties}>
                        {xC21.qte}
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
              {(v.ressourcesSac || []).map((xR22: any, i22: number) => (
                <Fragment key={i22}>
                  <span className={`sr ${xR22.cls}`} title={xR22.nom}>
                    <img src={xR22.image} alt={xR22.nom} />
                    <b>
                      {xR22.qte}
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
      {/* Le carnet ouvert : c'est le menu du jeu */}
      {v.carnetVisible ? (<>
        <button className={`voile ${v.voileCls}`} onClick={v.fermerCarnet} aria-label="Fermer le carnet" />
        <section className={`livre ${v.livreCls}`} aria-label="Carnet d'éleveur" style={{ filter: v.paperFilter } as CSSProperties}>
          <div className="l-wrap">
            {/* Onglets : glissent hors du carnet une fois ouvert */}
            <nav className="l-onglets" aria-label="Pages du carnet">
              {(v.onglets || []).map((xO23: any, i23: number) => (
                <Fragment key={i23}>
                  <button className={`l-onglet leather ${xO23.cls}`} style={{ animationDelay: `${xO23.delai}s` } as CSSProperties} onClick={xO23.ouvrir} aria-label={xO23.nom}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={xO23.icone} />
                    </svg>
                    {xO23.court} 
                  </button>
                </Fragment>
              ))}
            </nav>
            {/* Moitié droite : plat arrière et page de droite */}
            <div style={{ position: "absolute", left: "470px", top: "0", width: "470px", height: "590px", borderRadius: "0 16px 16px 0", background: "#6e3f22", boxShadow: "inset 0 0 0 2px #3a1f0e,inset 0 0 0 7px #6e3f22,inset 0 0 22px rgba(30,14,4,.45),0 6px 0 #4a2814,0 22px 50px rgba(10,6,2,.6)" } as CSSProperties}>
              <div className="stitch" style={{ borderRadius: "0 11px 11px 0", left: "0", borderLeft: "none" } as CSSProperties} />
              <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", top: "0" } as CSSProperties}>
                <path d="M32 32V10a8 8 0 0 0-8-8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
              </svg>
              <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", bottom: "0" } as CSSProperties}>
                <path d="M32 2v22a8 8 0 0 1-8 8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
              </svg>
              <div className="papier-d" style={{ position: "absolute", left: "4px", right: "20px", top: "16px", bottom: "16px", padding: "30px 30px 24px 52px", overflow: "hidden", boxShadow: "0 0 0 1.5px #3a1f0e,1.5px 1.5px 0 #efe4cc,3px 3px 0 #d6c4a0,4.5px 4.5px 0 #ece0c6,6px 6px 0 #cbb893,7.5px 7.5px 0 #e6d8bb,8.5px 8.5px 0 #3a1f0e" } as CSSProperties}>
                <div className={`contenu-page ${v.contenuCls}`} style={{ position: "relative", height: "100%" } as CSSProperties}>
                  {v.pSommaire ? (<>
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "34px", lineHeight: "1", color: "#3a2a1c" } as CSSProperties}>
                      Aujourd'hui
                    </div>
                    <div style={{ fontFamily: "'Alegreya SC',serif", fontSize: "13px", letterSpacing: "2px", color: "#9a7b55", margin: "2px 0 12px" } as CSSProperties}>
                      {v.jourTexteMin} · {v.time}
                    </div>
                    {(v.journalCourt || []).map((xJ24: any, i24: number) => (
                      <Fragment key={i24}>
                        <div style={{ display: "flex", gap: "12px", fontSize: "16.5px", lineHeight: "32px" } as CSSProperties}>
                          <span style={{ flex: "none", width: "46px", fontFamily: "'Alegreya SC',serif", fontSize: "13px", color: "#9a7b55" } as CSSProperties}>
                            {xJ24.heure}
                          </span>
                          <span>
                            {xJ24.texte}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "28px", lineHeight: "1", color: "#9c3b2a", marginTop: "22px" } as CSSProperties}>
                      à ne pas oublier
                    </div>
                    {(v.rappels || []).map((xR25: any, i25: number) => (
                      <Fragment key={i25}>
                        <div style={{ fontSize: "16.5px", lineHeight: "32px", display: "flex", gap: "10px", alignItems: "center" } as CSSProperties}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9c3b2a" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                          {xR25.texte}
                        </div>
                      </Fragment>
                    ))}
                  </>) : null}
                  {v.pJournal ? (<>
                    {(v.journalJours || []).map((xJj26: any, i26: number) => (
                      <Fragment key={i26}>
                        <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "30px", lineHeight: "1", color: "#3a2a1c", margin: "6px 0 6px" } as CSSProperties}>
                          {xJj26.titre}
                        </div>
                        {(xJj26.lignes || []).map((xJ27: any, i27: number) => (
                          <Fragment key={i27}>
                            <div style={{ display: "flex", gap: "12px", fontSize: "16px", lineHeight: "24px", marginBottom: "6px" } as CSSProperties}>
                              <span style={{ flex: "none", width: "46px", fontFamily: "'Alegreya SC',serif", fontSize: "13px", color: "#9a7b55" } as CSSProperties}>
                                {xJ27.heure}
                              </span>
                              <span>
                                {xJ27.texte}
                              </span>
                            </div>
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}
                  </>) : null}
                  {v.pSac ? (<>
                    <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "14px", letterSpacing: "2px", color: "#9a7b55", marginBottom: "10px" } as CSSProperties}>
                      Objets et curiosités
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "8px" } as CSSProperties}>
                      <div className="case-sac" style={{ opacity: ".55" } as CSSProperties}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9a8668" strokeWidth="1.6" aria-hidden="true">
                          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01" />
                        </svg>
                        ???
                      </div>
                      <div className="case-sac" style={{ opacity: ".55" } as CSSProperties}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9a8668" strokeWidth="1.6" aria-hidden="true">
                          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01" />
                        </svg>
                        ???
                      </div>
                      <div className="case-sac" style={{ opacity: ".55" } as CSSProperties}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9a8668" strokeWidth="1.6" aria-hidden="true">
                          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01" />
                        </svg>
                        ???
                      </div>
                      <div className="case-sac" style={{ opacity: ".55" } as CSSProperties}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9a8668" strokeWidth="1.6" aria-hidden="true">
                          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01" />
                        </svg>
                        ???
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "26px", fontSize: "18px" } as CSSProperties}>
                      <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#c9a050", boxShadow: "inset 0 0 0 2px #3a2410" } as CSSProperties} />
                      {v.pieces} pièces
                    </div>
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "24px", lineHeight: "1.05", color: "#6b4f33", marginTop: "14px" } as CSSProperties}>
                      ce que l'on trouve en explorant atterrit ici
                    </div>
                  </>) : null}
                  {v.pRelations ? (<>
                    {v.aDesEchosConnus ? (<>
                      <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "14px", letterSpacing: "2px", color: "#9a7b55", marginBottom: "8px" } as CSSProperties}>
                        Échos de passage
                      </div>
                      {(v.echosConnus || []).map((xC28: any, i28: number) => (
                        <Fragment key={i28}>
                          <div className={`relation-echo ${xC28.cls}`}>
                            <span className="medaillon">
                              <img src={xC28.image} alt="" />
                            </span>
                            <span className="qui">
                              <b>
                                {xC28.nom}
                              </b>
                              <em>
                                {xC28.note}
                              </em>
                            </span>
                            <span className="lien" style={{ color: xC28.encre } as CSSProperties}>
                              {xC28.lien}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </>) : null}
                    {v.sansEchosConnus ? (<>
                      <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "14px", letterSpacing: "2px", color: "#9a7b55", marginBottom: "6px" } as CSSProperties}>
                        À rencontrer
                      </div>
                      <div style={{ fontSize: "16.5px", lineHeight: "32px", color: "#9a8668" } as CSSProperties}>
                        ??? — quelqu'un vit près de la rivière
                      </div>
                      <div style={{ fontSize: "16.5px", lineHeight: "32px", color: "#9a8668" } as CSSProperties}>
                        ??? — une lumière dans la forêt, la nuit
                      </div>
                      <div style={{ fontSize: "16.5px", lineHeight: "32px", color: "#9a8668" } as CSSProperties}>
                        ??? — l'atelier du village est fermé
                      </div>
                    </>) : null}
                  </>) : null}
                  {v.pCarte ? (<>
                    <svg width="340" height="420" viewBox="0 0 340 420" role="img" aria-label="Carte des environs">
                      <path d="M170 380 C160 320 120 300 110 250 S140 160 120 90" fill="none" stroke="#6e3f22" strokeWidth="2.5" strokeDasharray="7 6" />
                      <path d="M170 380 C200 330 250 310 270 250" fill="none" stroke="#6e3f22" strokeWidth="2.5" strokeDasharray="7 6" />
                      <path d="M20 200 C80 220 120 190 170 210 S280 200 330 220" fill="none" stroke="#2f5a7a" strokeWidth="3" />
                      <path d="M150 368h40l-20-18z" fill="#9c3b2a" stroke="#3a1f0e" strokeWidth="1.6" />
                      <text x="170" y="402" textAnchor="middle" fontFamily="Reenie Beanie, cursive" fontSize="22" fill="#3a2a1c">
                        le ranch
                      </text>
                      <path d="M100 82l10-20 10 20zM112 92l10-22 10 22z" fill="none" stroke="#566b3a" strokeWidth="2" />
                      <text x="122" y="56" textAnchor="middle" fontFamily="Reenie Beanie, cursive" fontSize="22" fill="#3a2a1c">
                        la forêt
                      </text>
                      <path d="M258 250h24v-14l-12-10-12 10z" fill="none" stroke="#3a1f0e" strokeWidth="2" />
                      <text x="272" y="280" textAnchor="middle" fontFamily="Reenie Beanie, cursive" fontSize="22" fill="#3a2a1c">
                        le village
                      </text>
                      <text x="40" y="190" fontFamily="Reenie Beanie, cursive" fontSize="22" fill="#2f5a7a">
                        la rivière
                      </text>
                      <text x="250" y="120" fontFamily="Reenie Beanie, cursive" fontSize="26" fill="#9a8668">
                        ???
                      </text>
                    </svg>
                  </>) : null}
                  {v.pMemoire ? (<>
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "27px", lineHeight: "1.15", color: "#6b4f33", marginTop: "20px" } as CSSProperties}>
                      Quand un écho s'en va, il laisse ici son souvenir : sa forme, ce qu'il a appris, ce qu'il a aimé.
                    </div>
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "27px", lineHeight: "1.15", color: "#6b4f33", marginTop: "18px" } as CSSProperties}>
                      Cette mémoire appartient à ce profil.
                    </div>
                  </>) : null}
                  {v.pOptions ? (<>
                    <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "14px", letterSpacing: "2px", color: "#9a7b55", marginBottom: "12px" } as CSSProperties}>
                      Partie
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" } as CSSProperties}>
                      <button onClick={v.sauver} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px", border: "none", borderRadius: "6px", background: "#6e3f22", color: "#f6ecd6", fontFamily: "'Alegreya SC',serif", fontSize: "15px", letterSpacing: "1px", cursor: "pointer", boxShadow: "inset 0 0 0 2px #3a1f0e,inset 0 0 0 4px #6e3f22,inset 0 0 0 5px rgba(240,214,170,.5)" } as CSSProperties}>
                        Sauvegarder
                      </button>
                      <span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "22px", color: "#3f7a3a" } as CSSProperties}>
                        {v.sauveTexte}
                      </span>
                      <button onClick={v.retourMenu} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px", border: "none", borderRadius: "6px", background: "transparent", color: "#6e3f22", fontFamily: "'Alegreya SC',serif", fontSize: "15px", letterSpacing: "1px", cursor: "pointer", boxShadow: "inset 0 0 0 2px #6e3f22" } as CSSProperties}>
                        Retour au menu principal
                      </button>
                    </div>
                  </>) : null}
                  {v.pAstuces ? (<>
                    <div className="ast-page">
                      <div className="ast-entete">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={v.astIcone} />
                        </svg>
                        <span className="ast-theme">
                          {v.astTheme}
                        </span>
                      </div>
                      <div className="ast-liste">
                        {(v.astuces || []).map((xA29: any, i29: number) => (
                          <Fragment key={i29}>
                            <div className={`ast ${xA29.cls}`}>
                              <svg className="ast-puce" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                              </svg>
                              <span className="ast-texte">
                                {xA29.texte}
                                {xA29.piste ? (<>
                                  <em className="ast-piste">
                                    — {xA29.piste}
                                  </em>
                                </>) : null}
                              </span>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                      <div className="ast-pages">
                        <button className="ast-fleche" onClick={v.astPrec} disabled={!!(v.astSansPrec)} aria-label="Page précédente">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M15 5l-7 7 7 7" />
                          </svg>
                        </button>
                        <span className="ast-folio">
                          {v.astFolio}
                        </span>
                        <button className="ast-fleche" onClick={v.astSuiv} disabled={!!(v.astSansSuiv)} aria-label="Page suivante">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>) : null}
                </div>
              </div>
              {/* Marque-page */}
              <svg width="60" height="660" viewBox="0 0 60 660" aria-hidden="true" style={{ position: "absolute", left: "0", top: "0", overflow: "visible", filter: "drop-shadow(1.5px 2.5px 1.5px rgba(30,14,4,.35))" } as CSSProperties}>
                <path d="M22 4 C20 180 30 400 34 590 C35 606 30 620 22 632" fill="none" stroke="#5e1a12" strokeWidth="15" />
                <path d="M22 4 C20 180 30 400 34 590 C35 606 30 620 22 632" fill="none" stroke="#9c3b2a" strokeWidth="12.5" />
                <path d="M22 4 C20 180 30 400 34 590 C35 606 30 620 22 632" fill="none" stroke="#c65a44" strokeWidth="3" opacity=".55" transform="translate(-2.5 0)" />
                <path d="M27.8 635.9 L21.7 645 L19.8 635.3 L10.1 637.3 L16.2 628.1 Z" fill="#9c3b2a" stroke="#5e1a12" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Quelques pages qui tournent à l'ouverture */}
            <div className="l-feuillet" style={{ "--z": "1px", animationDelay: "1.14s" } as CSSProperties}>
              <div className="face papier-d" />
              <div className="face dos papier-g" />
            </div>
            <div className="l-feuillet" style={{ "--z": "2px", animationDelay: "1s" } as CSSProperties}>
              <div className="face papier-d" />
              <div className="face dos papier-g" />
            </div>
            <div className="l-feuillet" style={{ "--z": "3px", animationDelay: ".86s" } as CSSProperties}>
              <div className="face papier-d" />
              <div className="face dos papier-g" />
            </div>
            {/* Couverture (recto), puis page de gauche (verso) */}
            <div className="l-rabat">
              <div className="face" style={{ borderRadius: "0 16px 16px 0", background: "#6e3f22", boxShadow: "inset 0 0 0 2px #3a1f0e,inset 0 0 0 7px #6e3f22,inset 0 0 26px rgba(30,14,4,.5),0 5px 0 #4a2814,0 20px 40px rgba(20,10,4,.45)" } as CSSProperties}>
                <div className="stitch" style={{ borderRadius: "0 11px 11px 0" } as CSSProperties} />
                <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", top: "0" } as CSSProperties}>
                  <path d="M32 32V10a8 8 0 0 0-8-8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                </svg>
                <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", right: "0", bottom: "0" } as CSSProperties}>
                  <path d="M32 2v22a8 8 0 0 1-8 8H2z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                </svg>
                <div style={{ position: "absolute", left: "0", top: "0", bottom: "0", width: "22px", background: "linear-gradient(90deg,#4a2814,rgba(110,63,34,0))" } as CSSProperties} />
                <div style={{ position: "absolute", inset: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" } as CSSProperties}>
                  <svg width="96" height="96" viewBox="0 0 78 78" aria-hidden="true">
                    <circle cx="39" cy="39" r="34" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2.5" />
                    <path d="M39 58c-9 0-14-7-14-15s6-13 14-13 14 5 14 13-5 15-14 15zM39 30c0-6 3-10 9-12M39 30c-1-5-5-8-10-8" fill="none" stroke="rgba(30,14,4,.55)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "22px", letterSpacing: "5px", color: "rgba(30,14,4,.5)", textShadow: "0 1px 0 rgba(240,200,150,.2)" } as CSSProperties}>
                    Carnet d'éleveur
                  </div>
                </div>
              </div>
              <div className="face dos" style={{ borderRadius: "16px 0 0 16px", background: "#6e3f22", boxShadow: "inset 0 0 0 2px #3a1f0e,inset 0 0 0 7px #6e3f22,inset 0 0 22px rgba(30,14,4,.45),0 6px 0 #4a2814,0 22px 50px rgba(10,6,2,.6)" } as CSSProperties}>
                <div className="stitch" style={{ borderRadius: "11px 0 0 11px", right: "0", borderRight: "none" } as CSSProperties} />
                <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", left: "0", top: "0" } as CSSProperties}>
                  <path d="M2 32V10a8 8 0 0 1 8-8h22z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                </svg>
                <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ position: "absolute", left: "0", bottom: "0" } as CSSProperties}>
                  <path d="M2 2v22a8 8 0 0 0 8 8h22z" fill="#c9a050" stroke="#3a2410" strokeWidth="2.5" />
                </svg>
                <div className="papier-g" style={{ position: "absolute", left: "20px", right: "4px", top: "16px", bottom: "16px", padding: "30px 44px 24px 38px", overflow: "hidden", boxShadow: "0 0 0 1.5px #3a1f0e,-1.5px 1.5px 0 #efe4cc,-3px 3px 0 #d6c4a0,-4.5px 4.5px 0 #ece0c6,-6px 6px 0 #cbb893,-7.5px 7.5px 0 #e6d8bb,-8.5px 8.5px 0 #3a1f0e" } as CSSProperties}>
                  <div className={`contenu-page ${v.contenuCls}`} style={{ position: "relative", height: "100%" } as CSSProperties}>
                    <div style={{ fontFamily: "'Alegreya SC',serif", fontSize: "13px", letterSpacing: "3px", color: "#9a7b55" } as CSSProperties}>
                      {v.pageSurtitre}
                    </div>
                    <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "44px", lineHeight: "1", color: "#3a2a1c", margin: "2px 0 14px" } as CSSProperties}>
                      {v.pageTitre}
                    </div>
                    {v.pSommaire ? (<>
                      {(v.sommaire || []).map((xS30: any, i30: number) => (
                        <Fragment key={i30}>
                          <button className="sommaire-ligne" onClick={xS30.ouvrir}>
                            <span className="num">
                              {xS30.num}
                            </span>
                            <span>
                              {xS30.nom}
                            </span>
                            {xS30.aBadge ? (<>
                              <span className="sceau">
                                {xS30.badge}
                              </span>
                            </>) : null}
                            <span className="points" />
                            <span className="num">
                              {xS30.page}
                            </span>
                          </button>
                        </Fragment>
                      ))}
                    </>) : null}
                    {v.pJournal ? (<>
                      <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "30px", lineHeight: "1", color: "#3a2a1c", marginBottom: "6px" } as CSSProperties}>
                        aujourd'hui
                      </div>
                      {(v.journal || []).map((xJ31: any, i31: number) => (
                        <Fragment key={i31}>
                          <div style={{ display: "flex", gap: "12px", fontSize: "16px", lineHeight: "32px" } as CSSProperties}>
                            <span style={{ flex: "none", width: "46px", fontFamily: "'Alegreya SC',serif", fontSize: "13px", color: "#9a7b55" } as CSSProperties}>
                              {xJ31.heure}
                            </span>
                            <span>
                              {xJ31.texte}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </>) : null}
                    {v.pSac ? (<>
                      <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "14px", letterSpacing: "2px", color: "#9a7b55", marginBottom: "10px" } as CSSProperties}>
                        Nourriture
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "8px" } as CSSProperties}>
                        {(v.sacNourriture || []).map((xN32: any, i32: number) => (
                          <Fragment key={i32}>
                            <div className="case-sac" style={{ opacity: xN32.opacite } as CSSProperties}>
                              <img src={xN32.image} alt="" />
                              <span>
                                {xN32.nom}
                              </span>
                              <b style={{ fontFamily: "'Alegreya SC',serif", fontSize: "12px", color: "#6b4f33" } as CSSProperties}>
                                × {xN32.qte}
                              </b>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </>) : null}
                    {v.pRelations ? (<>
                      {(v.relations || []).map((xR33: any, i33: number) => (
                        <Fragment key={i33}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", fontSize: "17px", lineHeight: "32px" } as CSSProperties}>
                            <b style={{ fontFamily: "'Alegreya SC',serif", letterSpacing: "1.5px", color: xR33.encre, width: "84px" } as CSSProperties}>
                              {xR33.nom}
                            </b>
                            <span style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "23px", color: "#6b4f33" } as CSSProperties}>
                              {xR33.lien}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </>) : null}
                    {v.pCarte ? (<>
                      {(v.lieux || []).map((xL34: any, i34: number) => (
                        <Fragment key={i34}>
                          <button className="sommaire-ligne" onClick={xL34.partir} disabled={!!(xL34.off)} style={{ opacity: xL34.opacite } as CSSProperties}>
                            <span>
                              {xL34.nom}
                            </span>
                            <span className="points" />
                            <span className="num">
                              {xL34.duree}
                            </span>
                          </button>
                        </Fragment>
                      ))}
                      <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "23px", lineHeight: "1.05", color: "#6b4f33", marginTop: "14px" } as CSSProperties}>
                        on part avec {v.echoNom} ; le ranch attend votre retour
                      </div>
                    </>) : null}
                    {v.pMemoire ? (<>
                      <div style={{ display: "flex", gap: "14px", alignItems: "center", padding: "10px", borderRadius: "6px", background: "rgba(255,255,255,.35)", boxShadow: "inset 0 0 0 1px rgba(122,90,58,.3)" } as CSSProperties}>
                        <div style={{ flex: "none", width: "70px", height: "84px", borderRadius: "5px", background: "radial-gradient(circle at 50% 40%,#fff6df,#e8d6b0)", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" } as CSSProperties}>
                          <img src={v.echoImg} alt="" style={{ height: "74px", width: "auto" } as CSSProperties} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Alegreya SC',serif", fontWeight: "700", fontSize: "16px", letterSpacing: "2px" } as CSSProperties}>
                            {v.echoNom}
                          </div>
                          <div style={{ fontSize: "15px", color: "#6b4f33" } as CSSProperties}>
                            {v.memoireDetail}
                          </div>
                          <div style={{ fontFamily: "'Reenie Beanie',cursive", fontSize: "22px", color: "#3f7a3a" } as CSSProperties}>
                            à vos côtés
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: "15.5px", color: "#9a8668", marginTop: "16px" } as CSSProperties}>
                        Aucun autre écho pour l'instant.
                      </div>
                    </>) : null}
                    {v.pAstuces ? (<>
                      <div className="ast-intro">
                        {v.astIntro}
                      </div>
                      {(v.astThemes || []).map((xT35: any, i35: number) => (
                        <Fragment key={i35}>
                          <button className={`sommaire-ligne ast-ligne ${xT35.cls}`} onClick={xT35.ouvrir} aria-current={xT35.ici}>
                            <span className="num">
                              {xT35.num}
                            </span>
                            <span>
                              {xT35.nom}
                            </span>
                            <span className="points" />
                            <span className="num">
                              {xT35.compte}
                            </span>
                          </button>
                        </Fragment>
                      ))}
                      <div className="ast-mot">
                        {v.astMot}
                      </div>
                    </>) : null}
                    {v.pOptions ? (<>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" } as CSSProperties}>
                        {(v.reglages || []).map((xG36: any, i36: number) => (
                          <Fragment key={i36}>
                            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", fontSize: "17px", cursor: "pointer" } as CSSProperties}>
                              <span>
                                {xG36.nom}
                              </span>
                              <input type="checkbox" checked={xG36.actif} onChange={xG36.basculer} style={{ width: "22px", height: "22px", accentColor: "#6e3f22" } as CSSProperties} />
                            </label>
                          </Fragment>
                        ))}
                        {(v.curseurs || []).map((xG37: any, i37: number) => (
                          <Fragment key={i37}>
                            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", fontSize: "17px", cursor: "pointer" } as CSSProperties}>
                              <span>
                                {xG37.nom}
                              </span>
                              <input type="range" min="0" max="100" step="5" value={xG37.valeur} onChange={xG37.changer} style={{ flex: "0 0 46%", accentColor: "#6e3f22", cursor: "pointer" } as CSSProperties} />
                            </label>
                          </Fragment>
                        ))}
                      </div>
                    </>) : null}
                  </div>
                </div>
              </div>
            </div>
            {/* Page qui tourne quand on change de section */}
            {v.tourneVisible ? (<>
              <div className={`page-tourne ${v.tourneCls}`}>
                <div className="face papier-d" />
                <div className="face dos papier-g" />
              </div>
            </>) : null}
            <button onClick={v.fermerCarnet} aria-label="Fermer le carnet" style={{ position: "absolute", right: "-2px", top: "-58px", width: "46px", height: "46px", border: "none", borderRadius: "50%", background: "rgba(244,234,214,.92)", color: "#3a1f0e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(0,0,0,.4)" } as CSSProperties}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </section>
      </>) : null}
    </div>
    </>
  );
}
