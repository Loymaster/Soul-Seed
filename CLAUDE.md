# Soul Seed : Forgotten Echoes — repères pour travailler dans ce dépôt

Jeu web (Vite + TypeScript + React). Simulation d'élevage d'une seule créature, l'« écho », qui évolue selon la façon dont on s'en occupe.
L'ancien prototype (un seul fichier de 15 700 lignes) est conservé tel quel dans `prototype-v0/`, en lecture seule.

## Commandes
- `npm run dev` — le jeu sur http://localhost:5173 ; l'atelier sur http://localhost:5173/atelier.html (`npm run atelier` l'ouvre directement)
- `npm run catalogue` — régénère le catalogue d'assets à la main (le serveur de dev le fait tout seul)
- `npm run ranger [-- --essai]` — range les fichiers posés en vrac dans `public/assets/` ou `public/assets/_a-trier/`
- `npm run verifier` — catalogue strict + vérification des types
- `npm test` — tests (vitest)
- `npm run build` — échoue si le catalogue contient des erreurs (fichier manquant, fiche invalide…)

## Organisation
- `public/assets/` — images et sons, un dossier par catégorie : `echos/` (l'écho jouable : `graines`, `bebe`, `enfant`, `adolescent`, `adulte`), `pnj/<id>/`, `joueur/`, `decors/`, `interface/`, `objets/`, `emotions/`, `activites/`, `animations/`, `sons/`.
  - `_a-trier/` : boîte de réception ; `_corbeille/` : fichiers mis de côté (ignorée par git, jamais livrée).
- `contenu/` — tout ce qui s'écrit à la main ou dans l'atelier : `personnages/<id>.json` (fiches PNJ), bientôt `scenes/` et `variables.json`.
  - `contenu/generes/` — produit automatiquement (catalogue `assets.json`), ignoré par git.
- `outils/assets/` — `regles.mjs` (règles de classement : seule source de vérité), `catalogue.mjs`, `ranger.mjs`, `fichiers.mjs` (déplacements qui mettent à jour les références).
- `outils/atelier/plugin.mjs` — plugin Vite : surveillance des assets, API `/__atelier/*`, contrôles au build.
- `src/atelier/` — l'atelier (outil de dev). `src/moteur/` — sons synthétisés (`sfx.ts`), placement des personnages en scène (`scene/placement.ts`). `src/jeu/` — le jeu.

## Conventions
- Code, commentaires, noms et textes en français.
- Noms de fichiers d'assets : minuscules, sans accents ni espaces, tirets (`normaliserNom`).
- Nommer un fichier `<pnj>-<expression>.png`, `<stade>-<forme>.png` (`enfant-dark-joy.png`), `village-<lieu>.png`… suffit pour qu'il soit rangé automatiquement.
- Formes d'écho : `joy|wrath|sorrow|fear|disgust|neutre`, préfixe `dark-` pour la forme sombre, suffixe `-f`/`-m` pour le genre, `branch-<a>-d<b>`, `melee-<abc>`, `memoire-<a>-<element>`, `fragment-<type>`.
- Les PNJ ont une taille réelle (m) et une part visible : tous les personnages ont les pieds sur la même ligne de scène (`placer()`), 245 px par mètre dans un repère 1280 × 800.
- Ne jamais déplacer un asset à la main sans mettre à jour les références : passer par l'atelier ou `deplacer()`.
- Identité visuelle et sonore : voir le document « Soul Seed — Référence d'identité » (cuir, carnet, lueurs ; trois registres ranch / magie sainte / corruption).
