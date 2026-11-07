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
- [ ] Ressources d'exploration (bois, pierre, fibres, résine, ferraille, cristaux) : affichées vides dans le sac tant que la simulation ne les gère pas.
- [ ] Préférences de l'écho entre deux actions qui comblent le même besoin : brosser ou laver pour la propreté (il peut préférer l'une à l'autre), et plus largement aliments, jeux. À découvrir par le joueur au fil des feuilles volantes.
- [ ] Remplacer les accessoires dessinés provisoires (seau, brosse, balle, buissons, livre, bûche, marteau…) par des visuels définitifs.
- [ ] Jeux proposés en plus de la balle, du cache-cache et de l'histoire : bulles de savon, chasse aux lucioles (à la nuit tombée), tir à la corde (dans la maquette) ; à étudier : tas de feuilles (automne), ricochets (près d'un point d'eau), imitation de cris, course-poursuite.

## Combat
Moteur prêt dans `src/moteur/combat/` (règles du prototype, temps réel, déterministe avec une graine). Reste :
- [ ] Écran de combat (maquettes : page « Combat » du canevas, branchées sur le vrai moteur), en trois registres :
  - **exploration** (carnet de terrain : carte punaisée, toile kaki, étiquettes de bois) pour les combats courants en forêt, en exploration et à l'entraînement — musique *exploration* (Misty Trees) ;
  - **magie sainte** (verre et filigrane, lumière qui monte) pour l'arène et les combats importants — musique *combat* ;
  - **magie corrompue** (obsidienne fêlée, cendres qui tombent, pas de fuite possible) pour les boss — musique *morthen* (Dark Reality).
  Le combat ne démarre qu'au bouton « Commencer le combat ».
- [ ] Sons des coups, esquives, parades (synthétisés dans les maquettes, plus graves en registre corrompu).
- [ ] Musique de Vinland : *nyxara-battle* (Leomon), qui lui revient.
- [ ] Carnet : page des techniques (apprises, trois équipées, description en mots).
- [ ] Brancher les combats : échos sauvages (événement « invité »), exploration, PNJ (Garry, Lady Roger, Phil et Hibert, Hevann, Bourbella), mode Arène.
- [ ] Équilibrage : à caractéristiques égales, un combat de bébés dure environ 1 min 30, d'adolescents moyens 1 min 20 (essai sur 40 combats).
- [ ] Décider : les adultes gardent-ils les techniques de leur adolescence (comme le jeu du prototype) ou prennent-ils les pools adultes (mode Arène du prototype) ? Le moteur permet les deux (`poolsAdultes`).

## Simulation et contenu
- [ ] Héritage entre générations (7–12 % des caractéristiques) : calculé puis remis à zéro dans le prototype — décider s’il devient réel.
- [ ] Mini-jeux des corvées et réparations d’Ash.
- [ ] Village, magasin, exploration.
- [ ] Jardin et cuisine.
- [ ] Échos de mémoire.
- [ ] Démarche propre à chaque forme d’écho.
- [ ] Musique au ranch et au village (l'introduction, le choix de la graine, la mort et les scènes ont déjà la leur).
