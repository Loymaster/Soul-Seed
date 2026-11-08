# Pages du carnet hors maquette (Quêtes, Relations, Mémoire) : deux emplacements où Ranch.tsx pose
# les pages de src/jeu/commun/carnet/PagesCarnet.tsx (`carnetGauche`, `carnetDroite`, null sinon).
def retoucher_carnet(t, rep):
    t = rep(t, '''              </div>
            </div>
          </div>
        </div>

        <!-- Page qui tourne quand on change de section -->''', '''                {{carnetGauche}}
              </div>
            </div>
          </div>
        </div>

        <!-- Page qui tourne quand on change de section -->''')
    t = rep(t, '''              </sc-if>
            </div>
          </div>
          <!-- Marque-page -->''', '''              </sc-if>
              {{carnetDroite}}
            </div>
          </div>
          <!-- Marque-page -->''')
    return t


# Fiche de l'écho : l'onglet « Techniques » est une page hors maquette (src/jeu/ranch/TechniquesEcho.tsx) que
# Ranch.tsx pose dans l'emplacement `ficheTechniques` (null pour les autres onglets).
def retoucher_fiche(t, rep):
    t = rep(t, '''        </sc-for>
        </sc-if>
      </sc-if>
      <sc-if value="{{ficheChoix}}"''', '''        </sc-for>
        </sc-if>
        {{ficheTechniques}}
      </sc-if>
      <sc-if value="{{ficheChoix}}"''')
    return t
