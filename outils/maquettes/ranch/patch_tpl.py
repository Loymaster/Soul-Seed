# Retouches du gabarit de la maquette pour le jeu (déjections multiples, visiteur, transitions).
def retoucher(t, rep):
    t = rep(t, '<sc-if value="{{crotteVisible}}" hint-placeholder-val="{{ true }}">\n    <div class="crotte-img {{crotteCls}}" style="left:{{crotteX}}px;top:{{crotteY}}px;z-index:{{crotteZ}}"><img src="/_blob/d51ed0b456413f23fdb3dfe427014aed"',
            '<sc-for list="{{crottes}}" as="cr" hint-placeholder-count="1">\n    <div class="crotte-img {{cr.cls}}" style="left:{{cr.x}}px;top:{{cr.y}}px;width:{{cr.l}}px;height:{{cr.h}}px;z-index:{{cr.z}}"><img src="{{cr.image}}"')
    t = rep(t, '<button class="crotte" onClick="{{nettoyer}}" onMouseEnter="{{crotteSurvol}}" onMouseLeave="{{crotteQuitte}}" aria-label="Ramasser la déjection" style="left:{{crotteX}}px;top:{{crotteY}}px">\n      <span class="astuce">ramasser</span>\n    </button>\n  </sc-if>',
            '<button class="crotte" onClick="{{cr.nettoyer}}" onMouseEnter="{{cr.survol}}" onMouseLeave="{{cr.quitte}}" aria-label="Ramasser la déjection" style="left:{{cr.bx}}px;top:{{cr.by}}px">\n      <span class="astuce">ramasser</span>\n    </button>\n  </sc-for>')
    # le visiteur : un écho sauvage posé comme le nôtre (cadre 150 × 240, pieds sur le sol, perspective, démarche)
    t = rep(t, "  <!-- L'écho se promène sur le terrain ; tout ce qui le concerne le suit -->",
            '  <sc-if value="{{visiteur}}" hint-placeholder-val="{{ false }}">\n'
            '    <div class="echo-pos visiteur-pos {{visiteur.cls}}" style="left:{{visiteur.x}}px;top:{{visiteur.y}}px;transition-duration:{{visiteur.dur}}s;transform:scale({{visiteur.persp}});z-index:{{visiteur.z}}">\n'
            '      <button class="echo-zone visiteur-zone {{visiteur.anim}} {{visiteur.demarche}}" style="--cycle:{{visiteur.cycle}}s" onClick="{{visiteur.ouvrir}}" aria-label="{{visiteur.aria}}">\n'
            '        <span class="echo-ombre" style="transform:scaleX({{visiteur.taille}})"></span>\n'
            '        <span class="echo-sens {{visiteur.sens}}"><span class="echo-taille" style="transform:scale({{visiteur.taille}})"><img class="echo-img" src="{{visiteur.image}}" alt="" style="filter:{{echoFilter}}"></span></span>\n'
            '        <span class="visiteur-tag" style="top:{{visiteur.tete}}px"><b>{{visiteur.nom}}</b><i>{{visiteur.lien}}</i></span>\n'
            '      </button>\n'
            '      <sc-if value="{{visiteur.poussiere}}" hint-placeholder-val="{{ false }}"><span class="visiteur-poussiere"><i></i><i></i><i></i><i></i></span></sc-if>\n'
            '      <sc-if value="{{visiteur.signe}}" hint-placeholder-val="{{ false }}"><div class="emo-flotte" style="top:{{visiteur.teteSigne}}px"><img src="{{visiteur.signe}}" alt=""></div></sc-if>\n'
            '    </div>\n'
            # un geste à deux : « ! » au-dessus des deux têtes au clic, puis cadrage et éclat là où ils se retrouvent (visiteur.ts)
            '    <sc-if value="{{visiteur.appel1}}" hint-placeholder-val="{{ false }}"><div class="duo-appel" style="left:{{visiteur.appel1.x}}px;top:{{visiteur.appel1.y}}px"><b>!</b></div></sc-if>\n'
            '    <sc-if value="{{visiteur.appel2}}" hint-placeholder-val="{{ false }}"><div class="duo-appel" style="left:{{visiteur.appel2.x}}px;top:{{visiteur.appel2.y}}px"><b>!</b></div></sc-if>\n'
            '    <sc-if value="{{visiteur.duo}}" hint-placeholder-val="{{ false }}">\n'
            '      <div class="duo-cadrage {{visiteur.duo.cls}}" style="--x:{{visiteur.duo.x}}px;--y:{{visiteur.duo.y}}px"></div>\n'
            '      <div class="duo-eclat {{visiteur.duo.cls}}" style="left:{{visiteur.duo.x}}px;top:{{visiteur.duo.haut}}px"><i class="duo-anneau"></i><i class="duo-rayons"></i><b>!</b></div>\n'
            '    </sc-if>\n'
            '  </sc-if>\n'
            "  <!-- L'écho se promène sur le terrain ; tout ce qui le concerne le suit -->")
    # relations : les échos de passage (page de gauche), sinon les inconnus à rencontrer
    t = rep(t, '''<sc-if value="{{pRelations}}" hint-placeholder-val="{{ false }}">
                <div style="font-family:'Alegreya SC',serif;font-weight:700;font-size:14px;letter-spacing:2px;color:#9a7b55;margin-bottom:6px">À rencontrer</div>''',
            '''<sc-if value="{{pRelations}}" hint-placeholder-val="{{ false }}">
                <sc-if value="{{aDesEchosConnus}}" hint-placeholder-val="{{ false }}">
                  <div style="font-family:'Alegreya SC',serif;font-weight:700;font-size:14px;letter-spacing:2px;color:#9a7b55;margin-bottom:8px">Échos de passage</div>
                  <sc-for list="{{echosConnus}}" as="c" hint-placeholder-count="3">
                    <div class="relation-echo {{c.cls}}"><span class="medaillon"><img src="{{c.image}}" alt=""></span><span class="qui"><b>{{c.nom}}</b><em>{{c.note}}</em></span><span class="lien" style="color:{{c.encre}}">{{c.lien}}</span></div>
                  </sc-for>
                </sc-if>
                <sc-if value="{{sansEchosConnus}}" hint-placeholder-val="{{ true }}">
                <div style="font-family:'Alegreya SC',serif;font-weight:700;font-size:14px;letter-spacing:2px;color:#9a7b55;margin-bottom:6px">À rencontrer</div>''')
    t = rep(t, '''<div style="font-size:16.5px;line-height:32px;color:#9a8668">??? — l'atelier du village est fermé</div>
              </sc-if>''', '''<div style="font-size:16.5px;line-height:32px;color:#9a8668">??? — l'atelier du village est fermé</div>
                </sc-if>
              </sc-if>''')
    t = rep(t, '<div class="sortie"><div style="font-family:\'Reenie Beanie\',cursive;font-size:46px;color:#fbf3e2;text-shadow:0 2px 10px rgba(0,0,0,.8)">{{sortieTexte}}</div></div>',
            '<div class="sortie {{sortieCls}}"><div style="text-align:center">'
            '<sc-if value="{{sortieImage}}" hint-placeholder-val="{{ false }}"><img src="{{sortieImage}}" alt="" style="display:block;margin:0 auto 10px;max-height:220px"></sc-if>'
            '<div style="font-family:\'Reenie Beanie\',cursive;font-size:46px;color:#fbf3e2;text-shadow:0 2px 10px rgba(0,0,0,.8)">{{sortieTexte}}</div>'
            '<sc-if value="{{sortieSous}}" hint-placeholder-val="{{ false }}"><div style="font-family:\'Alegreya\',serif;font-style:italic;font-size:20px;color:#efe0c2;text-shadow:0 2px 8px rgba(0,0,0,.8);margin-top:6px">{{sortieSous}}</div></sc-if>'
            '<sc-if value="{{sortieBouton}}" hint-placeholder-val="{{ false }}"><button class="sortie-bouton" onClick="{{sortieBouton.agir}}">{{sortieBouton.texte}}</button></sc-if>'
            '</div></div>')
    # astuces : page de gauche (les thèmes, le mot de l'éleveur), page de droite (les conseils du thème, page à page)
    t = rep(t, '''                <sc-if value="{{pOptions}}" hint-placeholder-val="{{ false }}">
                  <div style="display:flex;flex-direction:column;gap:14px">''',
            '''                <sc-if value="{{pAstuces}}" hint-placeholder-val="{{ false }}">
                  <div class="ast-intro">{{astIntro}}</div>
                  <sc-for list="{{astThemes}}" as="t" hint-placeholder-count="7">
                    <button class="sommaire-ligne ast-ligne {{t.cls}}" onClick="{{t.ouvrir}}" aria-current="{{t.ici}}">
                      <span class="num">{{t.num}}</span><span>{{t.nom}}</span><span class="points"></span><span class="num">{{t.compte}}</span>
                    </button>
                  </sc-for>
                  <div class="ast-mot">{{astMot}}</div>
                </sc-if>
                <sc-if value="{{pOptions}}" hint-placeholder-val="{{ false }}">
                  <div style="display:flex;flex-direction:column;gap:14px">''')
    t = rep(t, '''              </sc-if>
            </div>
          </div>
          <!-- Marque-page -->''', '''              </sc-if>
              <sc-if value="{{pAstuces}}" hint-placeholder-val="{{ false }}">
                <div class="ast-page">
                  <div class="ast-entete">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{astIcone}}"></path></svg>
                    <span class="ast-theme">{{astTheme}}</span>
                  </div>
                  <div class="ast-liste">
                    <sc-for list="{{astuces}}" as="a" hint-placeholder-count="5">
                      <div class="ast {{a.cls}}">
                        <svg class="ast-puce" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                        <span class="ast-texte">{{a.texte}}<sc-if value="{{a.piste}}" hint-placeholder-val="{{ false }}"><em class="ast-piste">— {{a.piste}}</em></sc-if></span>
                      </div>
                    </sc-for>
                  </div>
                  <div class="ast-pages">
                    <button class="ast-fleche" onClick="{{astPrec}}" disabled="{{astSansPrec}}" aria-label="Page précédente"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg></button>
                    <span class="ast-folio">{{astFolio}}</span>
                    <button class="ast-fleche" onClick="{{astSuiv}}" disabled="{{astSansSuiv}}" aria-label="Page suivante"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg></button>
                  </div>
                </div>
              </sc-if>
            </div>
          </div>
          <!-- Marque-page -->''')
    return t

CSS = (# astuces : mêmes encres que le carnet ; aussi utilisées par le petit carnet (InterfaceRanch.tsx, portée .r7)
       ".r7 .ast-intro{font-family:'Reenie Beanie',cursive;font-size:23px;line-height:1.05;color:#6b4f33;margin:-6px 0 10px}"
       '.r7 .ast-ligne{font-size:17px;padding:4px 6px}'
       '.r7 .ast-ligne.ici{background:rgba(201,160,80,.22);box-shadow:inset 3px 0 0 #9c3b2a}'
       '.r7 .ast-ligne.ici>span:nth-child(2){font-weight:700}'
       ".r7 .ast-mot{position:absolute;left:0;right:0;bottom:4px;font-family:'Reenie Beanie',cursive;font-size:25px;line-height:1.05;color:#3f6a3a;transform:rotate(-1.2deg)}"
       ".r7 .ast-mot::before{content:'« '}.r7 .ast-mot::after{content:' »'}"
       '.r7 .ast-page{display:flex;flex-direction:column;height:100%}'
       '.r7 .ast-entete{display:flex;align-items:center;gap:10px;color:#9c3b2a;margin:-4px 0 10px}'
       ".r7 .ast-theme{font-family:'Reenie Beanie',cursive;font-size:36px;line-height:1;color:#3a2a1c}"
       '.r7 .ast-liste{flex:1;min-height:0}'
       '.r7 .ast{display:flex;gap:9px;align-items:flex-start;margin-bottom:10px;font-size:15.5px;line-height:22px;color:#2b2118;animation:r7AstVient .4s ease both}'
       '.r7 .ast:nth-child(2){animation-delay:.05s}.r7 .ast:nth-child(3){animation-delay:.1s}.r7 .ast:nth-child(4){animation-delay:.15s}.r7 .ast:nth-child(5){animation-delay:.2s}.r7 .ast:nth-child(n+6){animation-delay:.25s}'
       '.r7 .ast-puce{flex:none;margin-top:5px;color:#9c3b2a}'
       ".r7 .ast.cachee{font-family:'Reenie Beanie',cursive;font-size:23px;line-height:24px;color:#a8937a;margin-bottom:6px}"
       '.r7 .ast.cachee .ast-puce{color:#b9a78c}'
       ".r7 .ast-piste{margin-left:7px;font-family:'Alegreya',serif;font-size:13.5px;font-style:italic;color:#9a8668}"
       '.r7 .ast-pages{flex:none;display:flex;align-items:center;justify-content:center;gap:14px;padding-top:4px}'
       ".r7 .ast-folio{min-width:120px;text-align:center;font-family:'Alegreya SC',serif;font-size:13px;letter-spacing:2px;color:#9a7b55}"
       '.r7 .ast-fleche{width:34px;height:34px;border:none;border-radius:50%;background:transparent;color:#6e3f22;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1.5px rgba(110,63,34,.55);transition:background .2s,transform .2s}'
       '.r7 .ast-fleche:hover:not(:disabled){background:rgba(201,160,80,.22);transform:scale(1.06)}'
       '.r7 .ast-fleche:disabled{opacity:.3;cursor:default}'
       '@keyframes r7AstVient{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}'
       # le petit carnet : le lien vers les astuces, le retour
       ".r7 .ic-lien{display:inline-flex;align-items:center;gap:8px;padding:6px 2px;border:none;background:transparent;cursor:pointer;font-family:'Alegreya SC',serif;font-size:15px;letter-spacing:1px;color:#6e3f22;transition:transform .2s}"
       '.r7 .ic-lien:hover{transform:translateX(3px)}'
       '.r7 .ic-lien svg{color:#9c3b2a}'# le visiteur : mêmes classes que notre écho (démarche, bonds), son étiquette au survol, la poussière d'une bousculade
       '.r7 .visiteur-zone{cursor:pointer}'
       '.r7 .visiteur-pos.part{pointer-events:none}'
       '.r7 .visiteur-tag{position:absolute;left:50%;transform:translate(-50%,6px);display:flex;gap:8px;align-items:baseline;white-space:nowrap;padding:3px 12px;border-radius:12px;background:rgba(251,244,227,.94);box-shadow:0 0 0 1.5px #3a1f0e,0 4px 8px rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease}'
       '.r7 .visiteur-zone:hover .visiteur-tag,.r7 .visiteur-pos.choisi .visiteur-tag{opacity:1;transform:translate(-50%,0)}'
       ".r7 .visiteur-tag b{font-family:'Alegreya SC',serif;font-size:13px;letter-spacing:2px;color:#2b2118}"
       ".r7 .visiteur-tag i{font-family:'Reenie Beanie',cursive;font-style:normal;font-size:19px;color:#6b4f33}"
       '.r7 .visiteur-pos.choisi .echo-img{filter:drop-shadow(0 0 6px rgba(255,236,170,.9)) !important}'
       '.r7 .visiteur-poussiere{position:absolute;left:-60px;bottom:4px;width:110px;height:60px;pointer-events:none}'
       '.r7 .visiteur-poussiere i{position:absolute;bottom:0;width:46px;height:34px;border-radius:50%;background:radial-gradient(circle at 40% 40%,rgba(236,214,170,.95),rgba(190,160,110,.55) 60%,rgba(190,160,110,0) 72%);animation:r7Poussiere .9s ease-out infinite}'
       '.r7 .visiteur-poussiere i:nth-child(1){left:6px}.r7 .visiteur-poussiere i:nth-child(2){left:34px;animation-delay:.22s}.r7 .visiteur-poussiere i:nth-child(3){left:58px;animation-delay:.45s}.r7 .visiteur-poussiere i:nth-child(4){left:22px;animation-delay:.66s}'
       # le geste à deux : l'appel (« ! » qui jaillit au-dessus de chaque tête), le cadrage (le ranch s'assombrit autour d'eux,
       # sous les échos : z-index 334 < 100 + y), l'éclat (anneau, rayons, « ! ») au-dessus d'eux à leur rencontre ; « fin » : tout s'efface
       ".r7 .duo-appel{position:absolute;z-index:905;width:0;height:0;pointer-events:none}"
       ".r7 .duo-appel b{position:absolute;left:-17px;top:-46px;width:34px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:'Alegreya SC',serif;font-weight:700;font-size:30px;line-height:1;color:#9c3b2a;background:#fbf4e3;box-shadow:0 0 0 2px #3a1f0e,0 0 14px rgba(255,214,120,.95);transform-origin:50% 100%;animation:r7DuoAppel .75s cubic-bezier(.3,1.7,.5,1) both}"
       '@keyframes r7DuoAppel{0%{transform:scale(.2) translateY(14px);opacity:0}35%{transform:scale(1.18);opacity:1}55%{transform:scale(.94)}75%{transform:none;opacity:1}100%{transform:translateY(-8px);opacity:0}}'
       '.r7 .duo-cadrage{position:absolute;inset:0;z-index:334;pointer-events:none;background:radial-gradient(ellipse 300px 210px at var(--x) calc(var(--y) - 70px),transparent 45%,rgba(18,10,4,.5) 100%);animation:r7DuoCadre .45s ease-out both}'
       '.r7 .duo-cadrage.fin{animation:r7DuoCadreFin .5s ease-in both}'
       '@keyframes r7DuoCadre{from{opacity:0}to{opacity:1}}@keyframes r7DuoCadreFin{from{opacity:1}to{opacity:0}}'
       '.r7 .duo-eclat{position:absolute;z-index:905;width:0;height:0;pointer-events:none}'
       '.r7 .duo-eclat.fin{opacity:0;transition:opacity .4s ease}'
       '.r7 .duo-anneau{position:absolute;left:-60px;top:-60px;width:120px;height:120px;border-radius:50%;border:5px solid rgba(255,226,140,.95);box-shadow:0 0 22px rgba(255,214,120,.95),inset 0 0 14px rgba(255,214,120,.7);animation:r7DuoAnneau .9s ease-out both}'
       '.r7 .duo-rayons{position:absolute;left:-85px;top:-85px;width:170px;height:170px;border-radius:50%;background:repeating-conic-gradient(rgba(255,236,170,.95) 0 7deg,transparent 7deg 30deg);-webkit-mask:radial-gradient(circle,transparent 26%,#000 32%,transparent 70%);mask:radial-gradient(circle,transparent 26%,#000 32%,transparent 70%);animation:r7DuoRayons 1.1s ease-out both}'
       ".r7 .duo-eclat b{position:absolute;left:-27px;top:-30px;width:54px;height:60px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:'Alegreya SC',serif;font-weight:700;font-size:42px;line-height:1;color:#9c3b2a;background:#fbf4e3;box-shadow:0 0 0 2.5px #3a1f0e,0 0 22px rgba(255,214,120,1),0 6px 10px rgba(20,10,4,.35);animation:r7DuoPoint 1.5s cubic-bezier(.3,1.6,.5,1) both}"
       '@keyframes r7DuoAnneau{from{transform:scale(.2);opacity:1}to{transform:scale(2.1);opacity:0}}'
       '@keyframes r7DuoRayons{0%{transform:scale(.3) rotate(0);opacity:0}30%{opacity:1}100%{transform:scale(1.5) rotate(40deg);opacity:0}}'
       '@keyframes r7DuoPoint{0%{transform:scale(.2);opacity:0}20%{transform:scale(1.25);opacity:1}35%{transform:none;opacity:1}75%{transform:translateY(-6px);opacity:1}100%{transform:translateY(-16px);opacity:0}}'
       '@keyframes r7Poussiere{0%{transform:translateY(6px) scale(.4);opacity:0}30%{opacity:1}100%{transform:translateY(-22px) scale(1.25);opacity:0}}'
       # relations : les échos de passage
       '.r7 .relation-echo{display:flex;align-items:center;gap:10px;margin-bottom:8px}'
       '.r7 .relation-echo .medaillon{flex:none;width:46px;height:46px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 40%,#f3e6c8,#d9c39a);box-shadow:inset 0 0 0 1.5px rgba(58,31,14,.55)}'
       '.r7 .relation-echo .medaillon img{width:100%;height:100%;object-fit:contain;object-position:50% 80%;transform:scale(1.35) translateY(4px)}'
       '.r7 .relation-echo .qui{flex:1;display:flex;flex-direction:column;line-height:1.1}'
       ".r7 .relation-echo .qui b{font-family:'Alegreya SC',serif;font-size:15px;letter-spacing:1.5px;color:#2b2118}"
       '.r7 .relation-echo .qui em{font-size:13.5px;color:#8a7258}'
       ".r7 .relation-echo .lien{font-family:'Reenie Beanie',cursive;font-size:23px;line-height:1;text-align:right;max-width:130px}"
       '.r7 .relation-echo.ici .medaillon{box-shadow:inset 0 0 0 1.5px rgba(58,31,14,.55),0 0 0 3px rgba(201,160,80,.55)}'
       '.r7 .sortie.bloquant{pointer-events:auto}'
       ".r7 .sortie-bouton{margin-top:20px;padding:10px 22px;border:none;border-radius:8px;cursor:pointer;font-family:'Alegreya SC',serif;font-size:16px;letter-spacing:2px;color:#fbf3e2;background:#6e3f22;box-shadow:0 0 0 1.5px #3a1f0e,0 6px 12px rgba(0,0,0,.4)}")
