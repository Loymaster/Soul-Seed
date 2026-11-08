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
