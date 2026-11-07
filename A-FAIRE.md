# À faire

Liste de travail du projet. Les maquettes validées sont sur le canevas Design « Soul Seed ».

## Cycle de vie
- [x] Cycle complet dans le jeu : introduction (ou création du personnage) → Soul Seed → éclosion → nom → ranch → dernier souffle → nouvelle Soul Seed.
- [ ] Déposer les six avatars (`garcon-1/2`, `fille-1/2`, `nb-1/2`) et confirmer lequel de chaque paire répond au Soleil, lequel à la Lune.

## Épitaphe selon les accomplissements
L’épitaphe de la carte « Mémoire des échos » doit être choisie selon ce que l’écho a vécu, et non fixe.
- [x] Première version (`src/jeu/mort/epitaphes.ts`) : vieillesse > victoire sur Garry > combat ou blessure > maladie > faim > stade bébé > phrase par défaut.
- [ ] Recenser les accomplissements mesurables par la simulation (stade atteint, forme finale, durée de vie, victoires en arène, corvées, lien avec le joueur, maladies, négligence, forme sombre…).
- [ ] Écrire une banque de phrases, chacune liée à une condition.
- [ ] Définir une liste de priorités : quand plusieurs conditions sont remplies, la phrase la plus prioritaire l’emporte (ex. : forme sombre > record de longévité > victoire marquante > lien très fort > phrase par défaut selon le stade).
- [ ] Éviter les répétitions d’un écho à l’autre (mémoire des épitaphes déjà vues par profil).
- [ ] Accorder les phrases au genre de l’écho et au pronom du joueur.

## Événements du ranch (carnet d'événement)
Quand le « ! » apparaît au-dessus de l'écho et qu'on le clique, le carnet s'ouvre avec le personnage du joueur.
- Page 1 : « Que se passe-t-il ? » et la situation.
- Page 2 : les réponses, et en haut à droite le tempérament en jeu. Il est inconnu tant que l'événement n'a jamais été joué.
- Page 3 : la réponse choisie en titre (« Vous réprimandez Filo », « Vous l'ignorez »…), puis sa conséquence.
- Page 4 : le tempérament, révélé la première fois puis inscrit pour de bon, avec un tampon « renforcée », « diminuée » ou « inchangée ».

Maquette : plateau « Ranch » (page v7) du canevas.

- [x] Porter le carnet d'événement dans le jeu (poses du personnage : interrogation, récompense, réprimande, ignorer).
- [x] Garder en mémoire, par profil, les tempéraments déjà découverts pour chaque événement (`connus` du profil).
- [ ] Écrire les événements simples : bêtises, réussites, habitudes, trouvailles. Un seul tempérament est en jeu, et la réponse le renforce, le diminue ou le laisse inchangé.
- [ ] Écrire les événements de renforcement « au choix entre tempéraments » (les plus complexes, et les plus intéressants) :
  - Il se passe quelque chose, et l'écho regarde le joueur, en attente du comportement à adopter.
  - L'événement lui-même est neutre.
  - Le joueur peut l'encourager à faire ceci ou cela : jusqu'à 5 choix, dont toujours un choix neutre (« ne rien faire »).
  - Chaque choix est lié à un tempérament, que le joueur découvre en le choisissant, et a un effet positif ou négatif sur le comportement choisi.
  - Pages 2 et 4 : prévoir l'affichage de plusieurs tempéraments possibles, chacun inconnu jusqu'à ce qu'il ait été choisi une fois.

## Scènes d'action (fenêtre centrale)
Laver, brosser, coucher, manger, jeux, entraînements et corvées se jouent dans une fenêtre au centre de l'écran : l'écho y saute depuis sa place au ranch, l'action se joue (accessoires et légères déformations du sprite), puis une feuille volante résume ce qu'on devine, sans chiffre (« Il semble apprécier. Il lui reste un petit creux. »). Maquette : plateau « Ranch » (page v7) du canevas.
- [x] Porter la scène d'action dans le jeu (repas, bain, interactions, entraînements ; textes tirés de `lireSignes()` et de la simulation).
- [ ] Brosser (pas encore dans la simulation : grisé « bientôt » dans Soins).
- [x] Ressources d'exploration (bois, pierre, fibres, résine, ferraille, cristaux) : gardées par le monde de la partie (`src/moteur/monde`, plafond de 5), rapportées par « Récolter », montrées dans le sac du ranch et de l'exploration.
- [ ] Préférences de l'écho entre deux actions qui comblent le même besoin : brosser ou laver pour la propreté (il peut préférer l'une à l'autre), et plus largement aliments, jeux. À découvrir par le joueur au fil des feuilles volantes.
- [ ] Remplacer les accessoires dessinés provisoires (seau, brosse, balle, buissons, livre, bûche, marteau…) par des visuels définitifs.
- [ ] Jeux proposés en plus de la balle, du cache-cache et de l'histoire : bulles de savon, chasse aux lucioles (à la nuit tombée), tir à la corde (dans la maquette) ; à étudier : tas de feuilles (automne), ricochets (près d'un point d'eau), imitation de cris, course-poursuite.

## Combat
Moteur prêt dans `src/moteur/combat/` (règles du prototype, temps réel, déterministe avec une graine). Reste :
- [ ] Écran de combat (maquettes : page « Combat » du canevas, branchées sur le vrai moteur), en trois registres :
  - **exploration** (carnet de terrain : carte punaisée, toile kaki, étiquettes de bois) pour les combats courants en forêt, en exploration et à l'entraînement — musique *combat* (Early Game Battle) ;
  - **magie sainte** (verre et filigrane, lumière qui monte) pour l'arène et les combats importants — musique *combat* (Early Game Battle) pour l’instant ; *combat-arena* (Free Duel) ou *combat-garry* (Minor Battle) possibles pour la distinguer ;
  - **magie corrompue** (obsidienne fêlée, cendres qui tombent, pas de fuite possible) pour les boss — musique *morthen* (Dark Reality).
  Le combat ne démarre qu'au bouton « Commencer le combat ».
- [ ] Sons des coups, esquives, parades (synthétisés dans les maquettes, plus graves en registre corrompu).
- [ ] Musique de Vinland : *nyxara-battle* (Leomon), qui lui revient.
- [ ] Carnet : page des techniques (apprises, trois équipées, description en mots).
- [x] Combats d'exploration : l'écho sauvage du lieu (âge et graines de la zone) ; on revient au même lieu avec l'issue.
- [x] Combats contre les PNJ (`src/jeu/monde/adversaires.ts`, lancés par `action: combat <pnj>` dans les scènes) : Jumpy (entraînement), Lady Roger, Hevann et Garry (magie sainte, musique de Garry pour lui), Bourbella, Phil et Hibert (à deux). L'écran de combat accepte plusieurs adversaires (`renforts`) et une piste (`piste`).
- [ ] Brancher les combats : échos sauvages (événement « invité »), mode Arène.
- [ ] Équilibrage : à caractéristiques égales, un combat de bébés dure environ 1 min 30, d'adolescents moyens 1 min 20 (essai sur 40 combats).
- [ ] Décider : les adultes gardent-ils les techniques de leur adolescence (comme le jeu du prototype) ou prennent-ils les pools adultes (mode Arène du prototype) ? Le moteur permet les deux (`poolsAdultes`).

## Simulation et contenu
- [ ] Héritage entre générations (7–12 % des caractéristiques) : calculé puis remis à zéro dans le prototype — décider s’il devient réel.
- [ ] Mini-jeux des corvées et réparations d’Ash.
- [x] Village et magasin : écran du monde (`src/jeu/monde`) ouvert par le poteau du ranch — village, forêt du village, sanctuaire, atelier, boutique de Jumpy ; PNJ selon l'heure et les quêtes, scènes, combats, étal, stand, coffre, travaux d'Ash, sac.

## Village (à reprendre ou à décider)
- [x] PNJ d'exploration branchés (`src/jeu/exploration/pnj.ts`, tableau dans `contenu/scenes/LISEZMOI.md`) : Hevann (16, bloque le chemin, la fouille et l'envoi), Garry (17, étiquette rouge), Morthen (2, sa musique), Bourbella (5), Phil et Hibert (6, la nuit ; « Inspecter la cabane » le jour ; « Récupérer le marteau »), Tourby (7), Ash (11, le chemin de droite remonte), Grimp (23, le trou vers le 27 ; il rejoint le village quand Glamp est rentrée), « Déblayer le passage » et Glamp (28, décor 28 bis), Nyxara (32, « Au secours ! » à l'arrivée). Vérifiés de bout en bout dans le navigateur.
- [x] Gélatine de Bourbella : + 15 points sur la prise d'un poisson ferré à temps, et l'appât tenu un peu plus longtemps, tant que `maintenant < peche.bonus_jusqua`.
- [x] « Revenir au village » depuis la Sortie du village (flèche de gauche) → page de retour → forêt du village ; « Partir en exploration » depuis la forêt → Sortie du village.
- [ ] Corvées réparées par Ash (`monde.corvees`, niveaux 1 à 3) : le ranch ne les lit pas encore (toutes les corvées y sont jouables ; le niveau devrait fixer le nombre de tentatives et le gain d'expérience).
- [ ] Bâtiments du village payés en or (dojo, fontaine, arène…) : construits mais sans effet, comme dans le prototype. « Améliorer l'entraînement » (Hevann), « Demander un service » (Glamp), Finn « Partir en exploration » / « Discuter », Bourbella « Discuter », Myhra « le monde » : « En développement ».
- [ ] Décider : l'or et le sac appartiennent à l'écho (`Etat`) et repartent de zéro avec la graine suivante, alors que le prototype gardait l'or d'un écho à l'autre.
- [ ] Décider : le plafond de 5 par ressource portée (prototype) oblige à passer par le coffre de Maïko avant l'atelier ; le garder ?
- [ ] Décider : le stade de Lady Roger (bébé : +1 prospérité ; le prototype hésitait avec adulte).
- [ ] Prospérité : avec tous les habitants (Grimp compris) elle plafonne à 16 ; Myhra n'a que des phrases au-delà de 15. Paliers à revoir.
- [ ] Potager de Tourby : installé au village (le prototype passait par l'activité « Jardin » du ranch) ; « Nodules nutritifs ? » et « Aménager le potager » à écrire.
- [ ] Événement « bruit de Garry » : il cesse dès que `garry.vaincu` (synchronisé dans l'état de l'écho au retour au ranch).
- [ ] Visuels : Grimp au village et dans l'atelier n'a pas de calque dessiné (sprite posé) ; Jumpy n'a pas d'expression « en pied » neutre (la fiche utilise un portrait en buste par défaut).

## Exploration
Maquette « Exploration » v12 du canevas, portée dans `src/jeu/exploration/` (vue générée par `outils/maquettes/exploration/construire.py`).
- [x] Écran porté et branché : passages à la craie, l'écho qui marche d'un lieu à l'autre, lumière du jour, fouille à cinq cachettes (un écho peut y surgir et disperser les trouvailles, reprises si l'on gagne), Récolter, pêche au bouchon, envoi de l'écho, tente de soins (nourrir, laver, soigner, dormir : règles de la simulation), sac du ranch, carte illustrée sous la brume (`carte-brume.webp`, script `brume.py`), page de retour au ranch. Seules les actions font passer le temps en plus de l'horloge (fouiller 30 min, récolter 30, envoyer 20, pêcher 15).
- [x] Monde de la partie : lieux découverts, actions faites dans la journée, rencontres (récence par lieu), ressources ; sauvegardé avec la partie à chaque changement de lieu et en sortant.
- [x] Objets rapportés au catalogue : poissons crus (aliments), curiosités et petites bêtes (revente), tente et canne à pêche (outils, à vendre au magasin : 60 pièces chacun).
- [x] Repousse : « Utiliser » dans le sac en exploration → 12 heures (`repousse.jusqua`) : rencontres × 0,5, une chance sur deux que l'écho caché d'une fouille soit une trouvaille, écho sauvage de l'envoi × 0,5. Un mot quand l'odeur se dissipe. (Au ranch, le sac ne sait pas encore s'en servir.)
- [x] Curiosités et petites bêtes revendues au stand de Lady Roger (`revente` ; le prototype ne rachetait que les curiosités).
- [x] Cabane (zone 6) et passage encombré (28 → 28 bis → 29) : quêtes du prototype reprises ; chemins soumis aux drapeaux (`drapeau` dans `zones.ts`).
- [ ] Passages impraticables des rives du lac et de la savane (zones 31, 33, 34 : marais, fort, oasis…) : « En développement » dans le prototype, à inventer.
- [x] Une sortie en cours est notée dans le monde (`sortie`) : recharger la page (ou « Continuer ») ramène au même lieu, avec le chemin parcouru et le sac du départ (pour la page de retour). Un combat ou une scène en cours au moment du rechargement sont perdus (ce qu'ils avaient déjà enregistré reste).
- [x] Après une défaite, l'écho est à bout de forces (PV de combat à 0, comme le prototype qui les gardait) : il ne peut plus combattre (une rencontre ne propose que « S'éclipser », qui réussit toujours ; pas d'envoi ; Hevann, Garry, Phil et Hibert attendent ; dans une scène, le combat compte comme une fuite) jusqu'à un somme sous la tente ou au ranch, ou le réconfort de Myhra.
- [ ] Équilibrage à jouer : faut-il plutôt qu'il retrouve un peu de forces avec le temps (quelques PV par heure) ? Et un écho qui n'a pas sommeil ne peut pas dormir sous la tente : il reste à bout de forces jusqu'au ranch.
- [ ] Musique : la piste de Morthen et le silence puis Leomon de la cinématique de Nyxara sont branchés, à écouter en jeu.
- [ ] Un PNJ d'exploration est un calque rogné (sa pose est celle du dessin) : il ne se retourne pas vers l'écho ; c'est l'écho qui le regarde.
- [ ] Formes rares d'échos sauvages par zone (le prototype en avait) et taille de l'écho sauvage selon sa forme.
- [ ] Rencontres : réglage de fréquence (aujourd'hui la base « normales » de la maquette, 25 %).
- [ ] Jardin et cuisine.
- [ ] Échos de mémoire.
- [ ] Démarche propre à chaque forme d’écho.
- [ ] Musique au ranch et au village (l'introduction, le choix de la graine, la mort et les scènes ont déjà la leur).
