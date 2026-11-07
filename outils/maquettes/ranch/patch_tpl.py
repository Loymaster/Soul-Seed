# Retouches du gabarit de la maquette pour le jeu (déjections multiples, visiteur, transitions).
def retoucher(t, rep):
    t = rep(t, '<sc-if value="{{crotteVisible}}" hint-placeholder-val="{{ true }}">\n    <div class="crotte-img {{crotteCls}}" style="left:{{crotteX}}px;top:{{crotteY}}px;z-index:{{crotteZ}}"><img src="/_blob/d51ed0b456413f23fdb3dfe427014aed"',
            '<sc-for list="{{crottes}}" as="cr" hint-placeholder-count="1">\n    <div class="crotte-img {{cr.cls}}" style="left:{{cr.x}}px;top:{{cr.y}}px;z-index:{{cr.z}}"><img src="{{cr.image}}"')
    t = rep(t, '<button class="crotte" onClick="{{nettoyer}}" onMouseEnter="{{crotteSurvol}}" onMouseLeave="{{crotteQuitte}}" aria-label="Ramasser la déjection" style="left:{{crotteX}}px;top:{{crotteY}}px">\n      <span class="astuce">ramasser</span>\n    </button>\n  </sc-if>',
            '<button class="crotte" onClick="{{cr.nettoyer}}" onMouseEnter="{{cr.survol}}" onMouseLeave="{{cr.quitte}}" aria-label="Ramasser la déjection" style="left:{{cr.x}}px;top:{{cr.y}}px">\n      <span class="astuce">ramasser</span>\n    </button>\n  </sc-for>')
    t = rep(t, "  <!-- L'écho se promène sur le terrain ; tout ce qui le concerne le suit -->",
            '  <sc-if value="{{visiteur}}" hint-placeholder-val="{{ false }}">\n'
            '    <button class="visiteur" onClick="{{visiteur.ouvrir}}" aria-label="{{visiteur.aria}}" style="left:1010px;top:{{visiteur.y}}px;z-index:{{visiteur.z}}">\n'
            '      <img src="{{visiteur.image}}" alt="" style="height:{{visiteur.hauteur}}px;filter:{{echoFilter}}">\n'
            '      <span class="visiteur-tag"><b>{{visiteur.nom}}</b><i>de passage</i></span>\n'
            '    </button>\n'
            '  </sc-if>\n'
            "  <!-- L'écho se promène sur le terrain ; tout ce qui le concerne le suit -->")
    t = rep(t, '<div class="sortie"><div style="font-family:\'Reenie Beanie\',cursive;font-size:46px;color:#fbf3e2;text-shadow:0 2px 10px rgba(0,0,0,.8)">{{sortieTexte}}</div></div>',
            '<div class="sortie {{sortieCls}}"><div style="text-align:center">'
            '<sc-if value="{{sortieImage}}" hint-placeholder-val="{{ false }}"><img src="{{sortieImage}}" alt="" style="display:block;margin:0 auto 10px;max-height:220px"></sc-if>'
            '<div style="font-family:\'Reenie Beanie\',cursive;font-size:46px;color:#fbf3e2;text-shadow:0 2px 10px rgba(0,0,0,.8)">{{sortieTexte}}</div>'
            '<sc-if value="{{sortieSous}}" hint-placeholder-val="{{ false }}"><div style="font-family:\'Alegreya\',serif;font-style:italic;font-size:20px;color:#efe0c2;text-shadow:0 2px 8px rgba(0,0,0,.8);margin-top:6px">{{sortieSous}}</div></sc-if>'
            '<sc-if value="{{sortieBouton}}" hint-placeholder-val="{{ false }}"><button class="sortie-bouton" onClick="{{sortieBouton.agir}}">{{sortieBouton.texte}}</button></sc-if>'
            '</div></div>')
    return t

CSS = ('.r7 .visiteur{position:absolute;border:none;background:transparent;padding:0;cursor:pointer;transform:translate(-50%,-100%)}'
       '.r7 .visiteur img{display:block;filter:drop-shadow(0 8px 6px rgba(0,0,0,.35))}'
       '.r7 .visiteur-tag{position:absolute;left:50%;bottom:-30px;transform:translateX(-50%);display:flex;gap:8px;align-items:baseline;white-space:nowrap;padding:4px 12px;border-radius:12px;background:rgba(251,244,227,.92);box-shadow:0 0 0 1.5px #3a1f0e}'
       ".r7 .visiteur-tag b{font-family:'Alegreya SC',serif;font-size:13px;letter-spacing:2px;color:#2b2118}"
       ".r7 .visiteur-tag i{font-family:'Reenie Beanie',cursive;font-style:normal;font-size:19px;color:#6b4f33}"
       '.r7 .sortie.bloquant{pointer-events:auto}'
       ".r7 .sortie-bouton{margin-top:20px;padding:10px 22px;border:none;border-radius:8px;cursor:pointer;font-family:'Alegreya SC',serif;font-size:16px;letter-spacing:2px;color:#fbf3e2;background:#6e3f22;box-shadow:0 0 0 1.5px #3a1f0e,0 6px 12px rgba(0,0,0,.4)}")
