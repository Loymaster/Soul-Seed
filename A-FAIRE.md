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

## Simulation et contenu
- [ ] Héritage entre générations (7–12 % des caractéristiques) : calculé puis remis à zéro dans le prototype — décider s’il devient réel.
- [ ] Mini-jeux des corvées et réparations d’Ash.
- [ ] Village, magasin, exploration.
- [ ] Jardin et cuisine.
- [ ] Échos de mémoire.
- [ ] Démarche propre à chaque forme d’écho.
- [ ] Mode Arène.
- [ ] Musique au ranch et au village (l'introduction, le choix de la graine, la mort et les scènes ont déjà la leur).
