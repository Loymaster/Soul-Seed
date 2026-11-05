# Soul Seed : Forgotten Echoes — repères pour travailler dans ce dépôt

Jeu web (Vite + TypeScript + React). Simulation d'élevage d'une seule créature, l'« écho », qui évolue selon la façon dont on s'en occupe.
L'ancien prototype (un seul fichier de 15 700 lignes) est conservé tel quel dans `prototype-v0/`, en lecture seule.

## Commandes
- `npm run dev` — le jeu sur http://localhost:5173 ; l'atelier sur http://localhost:5173/atelier.html (`npm run atelier` l'ouvre directement)
- `npm run catalogue` — régénère le catalogue d'assets à la main (le serveur de dev le fait tout seul)
- `npm run ranger [-- --essai]` — range les fichiers posés en vrac dans `public/assets/` ou `public/assets/_a-trier/`
- `npm run verifier` — catalogue strict + vérification des types
- `npm run scenes` — vérifie toutes les scènes (même moteur que le jeu)
- `npm test` — tests (vitest)
- `npm run build` — échoue si le catalogue contient des erreurs (fichier manquant, fiche invalide…)

## Organisation
- `public/assets/` — images et sons, un dossier par catégorie : `echos/` (l'écho jouable : `graines`, `bebe`, `enfant`, `adolescent`, `adulte`), `pnj/<id>/`, `joueur/`, `decors/`, `interface/`, `objets/`, `emotions/`, `activites/`, `animations/`, `sons/`.
  - `_a-trier/` : boîte de réception ; `_corbeille/` : fichiers mis de côté (ignorée par git, jamais livrée).
- `contenu/` — tout ce qui s'écrit à la main ou dans l'atelier : `personnages/<id>.json` (fiches PNJ), `scenes/<id>.scene` (dialogues, format décrit dans `contenu/scenes/LISEZMOI.md`).
  - `contenu/generes/` — produit automatiquement (catalogue `assets.json`), ignoré par git.
- `outils/assets/` — `regles.mjs` (règles de classement : seule source de vérité), `catalogue.mjs`, `ranger.mjs`, `fichiers.mjs` (déplacements qui mettent à jour les références).
- `outils/atelier/plugin.mjs` — plugin Vite : surveillance des assets, API `/__atelier/*`, contrôles au build.
- `src/moteur/scene/` — moteur de scènes, indépendant de l'affichage : `analyseur.ts` (format texte → arbre), `valider.ts` (vérification contre fiches et assets), `lecteur.ts` (exécution pas à pas, « jouer depuis une ligne »), `expressions.ts`, `placement.ts`.
- `src/moteur/simulation/` — simulation de l'écho, sans affichage : `simulation.ts` (règles horaires et actions reprises du prototype), `signes.ts` (ce que le joueur perçoit : expression, attitude, indices, bulles — jamais de chiffre), `creation.ts`, `evolution.ts`, `donnees/` (aliments, interactions, entraînements, corvées extraits du prototype).
- `src/jeu/ranch/` — l'écran du ranch (portage de la maquette validée) : `Ranch.tsx`, `Carnet.tsx` (le menu du jeu), `Sac.tsx`, `lumiere.ts`, `demarche.ts` (pas de l'écho), `sauvegarde.ts`.
- `src/jeu/profils.ts` — profils (nom, avatar, pronom il/elle/iel, réglages, mémoire des échos) et 3 emplacements de partie par profil, dans le navigateur ; chaque emplacement a son **personnage** (nom, pronom, avatar : distinct du profil, il survit à ses échos). `src/jeu/menu/` — création du profil ou du personnage (`Introduction.tsx`) et menu principal (magie sainte).
- Parcours (`src/jeu/main.tsx`) : Nouvelle partie **avec l'introduction** → `intro/EntreDeuxMondes.tsx` (l'homme mystérieux : nom, pronom, astre → avatar, priorité → graine) → `intro/Sanctuaire.tsx` (scène `contenu/scenes/intro-sanctuaire.scene` : graine, éclosion, nom de l'écho) → ranch ; **sans l'introduction** → création du personnage → `graines/ChoixGraine.tsx` → ranch. Quand l'écho s'éteint : `mort/DernierSouffle.tsx` → choix de la graine (« après la disparition », sans bouton Menu). Une partie dont l'écho est éteint se recharge sur le choix de la graine.
- `src/jeu/commun/` — `Repere.tsx` (repère 1280 × 800 mis à l'échelle, pour les écrans portés des maquettes) et `musique.ts` (`useMusique` : boucle et fondus).
- `src/jeu/graines/glyphes/<graine>.svg` — emblèmes des cinq tempéraments, vectorisés (`fill="currentColor"` : couleur et halo réglables en CSS).
- Avatars du joueur : `public/assets/joueur/{garcon-1,garcon-2,fille-1,fille-2,nb-1,nb-2}.png` (déposer `avatar-<id>.png` pour qu'il soit rangé) ; en leur absence, portrait de repli ou silhouette.
- `src/jeu/scene/SceneDialogue.tsx` — la scène de dialogue plein écran (portage de la maquette validée) ; `action: …` dans une scène passe la main au jeu (`surAction`, `calque`). `src/moteur/sfx.ts` — sons synthétisés (dont ceux du cycle de l'écho : chant des graines, éclosion, frottement sourd et vent de la mort, voix de l'homme mystérieux).
- `src/atelier/` — l'atelier (outil de dev) ; `src/atelier/scenes/` — l'éditeur de scènes (CodeMirror + aperçu).
- `outils/scenes/verifier.ts` — vérification des scènes en ligne de commande.

## Conventions
- Code, commentaires, noms et textes en français.
- Noms de fichiers d'assets : minuscules, sans accents ni espaces, tirets (`normaliserNom`).
- Nommer un fichier `<pnj>-<expression>.png`, `<stade>-<forme>.png` (`enfant-dark-joy.png`), `village-<lieu>.png`… suffit pour qu'il soit rangé automatiquement.
- Formes d'écho : `joy|wrath|sorrow|fear|disgust|neutre`, préfixe `dark-` pour la forme sombre, suffixe `-f`/`-m` pour le genre, `branch-<a>-d<b>`, `melee-<abc>`, `memoire-<a>-<element>`, `fragment-<type>`.
- Les PNJ ont une taille réelle (m) et une part visible : tous les personnages ont les pieds sur la même ligne de scène (`placer()`), 245 px par mètre dans un repère 1280 × 800.
- Ne jamais déplacer un asset à la main sans mettre à jour les références : passer par l'atelier ou `deplacer()`.
- Temps : 1 seconde réelle = 1 minute de jeu ; les règles de la simulation s'appliquent à chaque heure pleine.
- Le joueur ne voit jamais l'état chiffré de son écho : tout passe par `lireSignes()`.
- Identité visuelle et sonore : voir le document « Soul Seed — Référence d'identité » (cuir, carnet, lueurs ; trois registres ranch / magie sainte / corruption).
