# Retouches du gabarit de la maquette pour le jeu (déjections multiples, visiteur, transitions).
def retoucher(t, rep):
    t = rep(t, '<sc-if value="{{crotteVisible}}" hint-placeholder-val="{{ true }}">\n    <div class="crotte-img {{crotteCls}}" style="left:{{crotteX}}px;top:{{crotteY}}px;z-index:{{crotteZ}}"><img src="/_blob/d51ed0b456413f23fdb3dfe427014aed"',
            '<sc-for list="{{crottes}}" as="cr" hint-placeholder-count="1">\n    <div class="crotte-img {{cr.cls}}" style="left:{{cr.x}}px;top:{{cr.y}}px;z-index:{{cr.z}}"><img src="{{cr.image}}"')
    t = rep(t, '<button class="crotte" onClick="{{nettoyer}}" onMouseEnter="{{crotteSurvol}}" onMouseLeave="{{crotteQuitte}}" aria-label="Ramasser la déjection" style="left:{{crotteX}}px;top:{{crotteY}}px">\n      <span class="astuce">ramasser</span>\n    </button>\n  </sc-if>',
            '<button class="crotte" onClick="{{cr.nettoyer}}" onMouseEnter="{{cr.survol}}" onMouseLeave="{{cr.quitte}}" aria-label="Ramasser la déjection" style="left:{{cr.x}}px;top:{{cr.y}}px">\n      <span class="astuce">ramasser</span>\n    </button>\n  </sc-for>')
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
    return t

CSS = (# le visiteur : mêmes classes que notre écho (démarche, bonds), son étiquette au survol, la poussière d'une bousculade
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
