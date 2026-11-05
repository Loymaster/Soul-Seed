# Écrire une scène de dialogue

Une scène est un simple fichier texte `contenu/scenes/<nom>.scene`. Le plus simple est de l'écrire dans l'atelier (onglet **Scènes**) : l'aperçu joue la scène avec le vrai moteur du jeu, les erreurs sont soulignées et Ctrl + Espace propose personnages, expressions, émotions, décors et variables.

```
// Les lignes qui commencent par // sont des notes, ignorées par le jeu.
titre: Garry au village
décor: village/sanctuaire          ← public/assets/decors/village/sanctuaire.png
musique: intro-mystery             ← public/assets/sons/musiques/… (ou « aucune »)
places: myhra G1, garry D2         ← présents dès le début

myhra: Garry… Tu n'as rien à faire ici.
jumpy [surpris]: Hé !              ← expression (nom défini dans la fiche du PNJ)
narration: Le vent se lève.
vous: Je ne fais que passer.       ← le joueur parle (sa carte apparaît)
écho: (anxieux) {echo.nom} se tasse derrière vous.   ← l'écho ne parle pas : il réagit

entre: jumpy G2 [surpris]          ← arrivée ; sans place, la première libre
sort: garry                        ← « sort: garry, jumpy », « sort: tous »
déplace: jumpy D1
décor: foret/entree                ← changement de décor en cours de scène
pause: 1.5

choix: Que répondre ?
  > résolution « Rien qui te regarde. »
    garry.relation -= 1
    garry: Hm.
  > observation « Pourquoi lui ? » si indices.garry >= 1
    garry: Parce qu'il me rappelle quelqu'un.

si garry.relation < 0:
  jumpy [rit]: Bien envoyé !
sinon si indices.garry >= 1:
  myhra: Méfie-toi.
sinon:
  myhra: Il reviendra.

aller: foret-rencontre             ← enchaîne sur une autre scène (ou « fin »)
```

- **Places** : `G1` (bord gauche), `G2` (gauche, centre), `D2` (droite, centre), `D1` (bord droit). Quatre personnages au plus. Un PNJ qui parle sans être là entre tout seul.
- **Résonances** des réponses : curiosité, résolution, discernement, observation, anticipation, neutre, indéterminée (abréviations : cur, res, dis, obs, ant, neu, ind). Quatre réponses au plus à l'écran.
- **Variables** : `=`, `+=`, `-=` ; valeurs : nombres, `vrai`, `faux`, `"texte"`. Une variable jamais définie vaut 0. Conditions : `== != < > <= >=`, `et`, `ou`, `non`, parenthèses. Mettre des espaces autour du moins (`a - 1`) : un tiret collé fait partie du nom (`lady-roger.relation`).
- `{variable}` dans un texte affiche sa valeur. Fournies par le jeu : `echo.nom`, `echo.stade`, `echo.lignee`, `joueur.nom`, `joueur.pronom` (il, elle, iel), `echo.genre` (m, f), `jour`, `heure`, `saison`.
- Accorder selon le joueur : `{joueur:prêt|prête|prêt·e}` (formes pour il | elle | iel ; sans troisième forme, iel reçoit « prêt·prête »). Selon l'écho : `{echo:content|contente}`.
  Exemple : `myhra: Te voilà enfin, {joueur.nom}. Tu es {joueur:prêt|prête|prêt·e} ?`
- Les blocs (réponses, « si », « sinon ») se reconnaissent à leur **décalage** (deux espaces).
- Une réplique trop longue peut continuer sur les lignes suivantes, décalées.

`npm run scenes` vérifie toutes les scènes ; le build refuse une scène qui contient une erreur.
