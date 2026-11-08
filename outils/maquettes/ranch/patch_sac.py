# Menu d'un objet du sac : les boutons viennent de src/jeu/commun/MenuObjet.tsx (`BoutonsObjet` : Infos / Utiliser,
# puis « jeter… » et sa confirmation), le même composant que la sacoche hors du ranch. Ranch.tsx le pose dans
# l'emplacement `sacMenuBoutons`.
def retoucher_sac(t, rep):
    return rep(t, '''            <div class="sm-boutons">
              <button class="sm-btn" role="menuitem" onClick="{{sacInfos}}" aria-pressed="{{sacMenuInfo}}">Infos</button>
              <button class="sm-btn sm-ok" role="menuitem" onClick="{{sacUtiliser}}">Utiliser</button>
            </div>''', '''            {{sacMenuBoutons}}''')
