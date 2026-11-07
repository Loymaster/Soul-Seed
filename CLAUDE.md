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
- `src/moteur/combat/` — moteur de combat en temps réel, sans affichage (repris du prototype) : `combat.ts` (`Combat.creer`, `avancer(ms)`, ordres, fuite, soins ; événements via `vider()`), `resolution.ts` (coups, techniques), `statuts.ts`, `ia.ts` (choix des techniques), `pools.ts` (techniques par stade et lignée, apprentissage aux seuils d'intelligence), `issue.ts` (`bilanCombat`, appliqué par `Simulation.terminerCombat`), `signes.ts` (posture et allure, jamais de chiffre), `depuis.ts` (l'écho du joueur ou un écho sauvage en combattant), `donnees/` (64 techniques, soins).
- `src/jeu/ranch/` — l'écran du ranch (maquette « Ranch » v7 du canevas) : `Ranch.tsx` (logique, branchée sur la simulation : temps, promenade, petit carnet d'actions, sac, carnet, poteau indicateur, scènes d'action, carnet d'événement), `VueRanch.tsx` + `ranch.css` (vue **générée** depuis la maquette par `outils/maquettes/ranch/construire.py` — ne pas modifier à la main), `ciel.ts` (lumière, ciel, lanternes), `evenements.ts` (textes du carnet d'événement, tempéraments), `demarche.ts` (pas de l'écho), `sauvegarde.ts`.
- `src/jeu/combat/` — l'écran de combat (registres exploration, magie sainte, magie corrompue), sur le moteur `src/moteur/combat`.
- `src/moteur/monde/` — le monde d'une partie, ce qui survit aux échos (drapeaux, quêtes, ressources plafonnées à 5, lieux découverts, actions faites dans la journée par lieu, rencontres, constructions, PNJ connus) ; sauvegardé par emplacement (`chargerMonde`/`sauverMonde` dans `src/jeu/profils.ts`).
- `src/jeu/exploration/` — l'écran d'exploration (maquette « Exploration » v12 du canevas) : `Exploration.tsx` (logique, branchée sur la simulation, le sac et le monde : marche d'un lieu à l'autre, fouille, récolte, pêche, envoi de l'écho, tente de soins, carte, rencontres → `surCombat`, retour au ranch), `regles.ts` (règles sans affichage : ressources, tempérament de terrain, lumière, bilan de sortie), `zones.ts` (34 lieux, généré par `outils/maquettes/exploration/zones.py` puis retouchable), `VueExploration.tsx` + `exploration.css` (vue **générée** par `outils/maquettes/exploration/construire.py`, portée sous `.ex12` — ne pas modifier à la main), `sons.ts`. La carte sous la brume : `public/assets/decors/exploration/carte-brume.webp`, produite par `outils/maquettes/exploration/brume.py`.
- `src/jeu/monde/` — l'écran du monde hors exploration : `Monde.tsx` (village, forêt du village, sanctuaire, atelier, boutique de Jumpy : décor plein cadre, PNJ placés selon l'heure et les quêtes, petit menu au clic, passages, écriteau du lieu, sac ; le temps s'écoule et s'arrête pendant dialogues et panneaux ; travaux d'Ash à chaque heure ; musique enchaînée `useMusiqueEnchainee`), `lieux.ts` (lieux, PNJ, conditions d'apparition, menus), `ScenePnj.tsx` (une scène de PNJ dans la partie : drapeaux du monde en variables, actions, combats par-dessus la scène, panneaux — réutilisable en exploration), `actions.ts` (vocabulaire `action: …` des scènes du monde), `adversaires.ts` (combats contre les PNJ), `variables.ts` (variables des scènes, retour des drapeaux), `panneaux.tsx` (étal, stand, coffre, travaux, sac, travail, déblayer). Règles sans affichage dans `src/moteur/monde/` : `boutique.ts` (étal du jour, achat, rachat des curiosités), `coffre.ts`, `constructions.ts` (bâtiments, réparations de corvées).
- `contenu/scenes/` — scènes des PNJ du monde (une par PNJ, `{sujet}` donné par le menu ; celles d'exploration ont leur fichier : `hevann-chemin`, `garry-foret`…). Les drapeaux du monde y sont des variables (`hevann.vaincu = vrai`) ; vocabulaire des actions et branchement des PNJ d'exploration : `contenu/scenes/LISEZMOI.md`.
- `src/jeu/profils.ts` — profils (nom, avatar, pronom il/elle/iel, réglages, mémoire des échos) et 3 emplacements de partie par profil, dans le navigateur ; chaque emplacement a son **personnage** (nom, pronom, avatar : distinct du profil, il survit à ses échos). `src/jeu/menu/` — création du profil ou du personnage (`Introduction.tsx`) et menu principal (magie sainte).
- Du ranch, le poteau « partir » appelle `surPartir(etat, lieu)` ; « Le village » et « Le magasin » ouvrent l'écran `monde` (lieu `village` ou `boutique`) ; « Explorer » ouvre l'écran `exploration` (départ à la Sortie du village) ; une rencontre ouvre l'écran de combat (registre exploration, décor du lieu) qui ramène au même lieu avec l'issue ; la flèche « rentrer au ranch » de la Sortie du village montre la page de retour puis le ranch.
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
