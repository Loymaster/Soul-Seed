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
action: image pnj/garry/attaque-jumpy   ← image épinglée au-dessus de la scène (« action: image aucune » la retire)
action: cinematique pnj/nyxara/attaque-1   ← image plein cadre ~2,6 s : le dialogue attend (aucun clic ne l'abrège), elle s'efface avant qu'il reprenne (scènes du monde)
action: technique vinland G2 Lame de l’aube   ← étiquette et son d'une technique de combat au-dessus de Vinland à sa place (scènes du monde)

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

- **Actions** mises en scène par le jeu : `action: graine` (la graine de la partie apparaît), `action: eclosion` (elle éclot, l'écho naît), `action: nommer-echo` (le joueur nomme son écho : `{echo.nom}` ensuite), `action: image …`, `action: montrer sac` (tutoriel du ranch : une lueur sur `echo`, `onglets`, `carnet`, `heure`, `sac`, `poteau` ; `aucun` l'éteint).
- `décor: aucun` : la scène se joue par-dessus l'écran du jeu, sans fond (tutoriel du ranch, `ranch-tutoriel.scene`). Dans l'aperçu de l'atelier, les actions sont passées.
- **Places** : `G1` (bord gauche), `G2` (gauche, centre), `D2` (droite, centre), `D1` (bord droit). Quatre personnages au plus. Un PNJ qui parle sans être là entre tout seul.
- **Résonances** des réponses : curiosité, résolution, discernement, observation, anticipation, neutre, indéterminée (abréviations : cur, res, dis, obs, ant, neu, ind). Elles restent obligatoires dans le texte mais **ne s'affichent plus** dans les dialogues (une simple puce devant chaque réponse) : les choix de dialogue ont un intérêt scénaristique, pas éducatif ; seuls les événements du ranch montrent un tempérament. Six réponses au plus à l'écran (la feuille grandit vers le haut avec les réponses longues ou nombreuses).
- **Variables** : `=`, `+=`, `-=` ; valeurs : nombres, `vrai`, `faux`, `"texte"`. Une variable jamais définie vaut 0. Conditions : `== != < > <= >=`, `et`, `ou`, `non`, parenthèses. Mettre des espaces autour du moins (`a - 1`) : un tiret collé fait partie du nom (`lady-roger.relation`).
- `{variable}` dans un texte affiche sa valeur. Fournies par le jeu : `echo.nom`, `echo.stade`, `echo.lignee`, `joueur.nom`, `joueur.pronom` (il, elle, iel), `echo.genre` (m, f), `graine.nom` (« graine boréale »…), `jour`, `heure`, `saison`.
- Accorder selon le joueur : `{joueur:prêt|prête|prêt·e}` (formes pour il | elle | iel ; sans troisième forme, iel reçoit « prêt·prête »). Selon l'écho : `{echo:content|contente}`.
  Exemple : `myhra: Te voilà enfin, {joueur.nom}. Tu es {joueur:prêt|prête|prêt·e} ?`
- Les blocs (réponses, « si », « sinon ») se reconnaissent à leur **décalage** (deux espaces).
- Une réplique trop longue peut continuer sur les lignes suivantes, décalées.

`npm run scenes` vérifie toutes les scènes ; le build refuse une scène qui contient une erreur.

## Les scènes des PNJ du monde (village, exploration)

Chaque PNJ a sa scène (`jumpy.scene`, `myhra.scene`, `lady-roger.scene`…) ; quand un PNJ a plusieurs choses à dire, le menu du jeu donne un **sujet** (`{sujet}` : « discuter », « peche »…) et la scène choisit avec `si sujet == "peche":`. Les scènes jouées en exploration ont leur propre fichier (`hevann-chemin`, `garry-foret`, `ash-montagne`, `phil-hibert`, `bourbella-cabane`, `tourby-riviere`, `grimp-caverne`, `trefonds-deblayer`, `glamp-trefonds`, `morthen`, `nyxara`). Au village, le jeu remplace le décor d'une scène par celui du lieu où l'on se trouve (Maïko qui parle dans l'atelier…) ; en exploration, la scène garde le sien.

**Les drapeaux du monde sont des variables.** La scène les lit et les écrit comme les autres (`hevann.vaincu = vrai`, `maiko.nourri_a = maintenant`) ; à la fin, ceux qui ont changé sont enregistrés dans le monde de la partie (ils survivent à l'écho). Nommer un drapeau `<pnj>.<quoi>`, sans tiret dans le nom du PNJ (`ladyroger.recrutee`, `philhibert.vaincus`) pour pouvoir l'afficher avec `{…}`.

Variables fournies par le jeu (en lecture) : `maintenant` (heure absolue : jour × 24 + heure, l'unité des délais — « 12 heures plus tard » = `maintenant + 12`), `jour`, `heure`, `saison`, `or`, `hasard` (1 à 100, tiré au début de la scène), `sujet`, `echo.nom`, `echo.genre`, `echo.stade`, `echo.petit` (bébé ou enfant), `echo.angoisse`, `echo.malade`, `joueur.nom`, `joueur.pronom`, `sac.<objet>` (combien le sac en contient : `sac.poisson_anguille >= 1`), `sac.aliment` (le premier aliment du sac, ou ""), `sac.plein`, `construit.<bâtiment>` (`construit.entrepot`), `chantier.en_cours`, `village.prosperite`, `village.dernier`.

### Actions de jeu

| Action | Effet | Ensuite |
|---|---|---|
| `action: donner canne_peche` · `action: donner nodule_nutritif 2` | range l'objet dans le sac ; s'il est plein, le joueur choisit quoi jeter pour lui faire de la place, ou le laisse (la scène attend sa réponse) | `{action.ok}` (faux : objet laissé, sac plein) |
| `action: retirer poisson_anguille` · `action: retirer aliment` | retire l'objet (« aliment » : le premier aliment du sac) | `{action.ok}`, `{action.objet}` (son nom) |
| `action: or 10` · `action: or -5` | donne ou reprend de l'or | `{or}` |
| `action: ressource bois 3` | ressource portée (plafond 5) | |
| `action: recruter lady-roger bebe` | le PNJ rejoint le village : prospérité (+1 bébé, +2 enfant, +3 adolescent, +4 adulte), dernier arrivé, journal | `{village.prosperite}`, `{village.dernier}` |
| `action: combat hevann` | combat contre le PNJ (`src/jeu/monde/adversaires.ts` : jumpy, lady-roger, hevann, garry, bourbella, phil-hibert) ; l'issue est appliquée à l'écho (progrès, or, blessure, une heure) | `{combat.issue}` : "victoire", "defaite" ou "fuite" |
| `action: boutique` · `stand` · `coffre` · `travaux` | ouvre l'étal de Jumpy, le stand de Lady Roger, le coffre de Maïko, les travaux d'Ash | la scène reprend à la fermeture |
| `action: travail` | le travail à la boutique (dix échos à attraper en dix secondes) | `{travail.or}` |
| `action: deblayer` | déblayer un passage (douze pierres à glisser) | `{action.ok}` |
| `action: reconfort` | Myhra réconforte l'écho (santé, vigueur ; s'il est angoissé : guéri de tout) | |
| `action: motiver` | Hevann motive l'écho : entraînements × 1,75 pendant 6 heures | |
| `action: apprendre-echo` | Jumpy révèle un trait de l'écho, en mots | `{jumpy.info}` |
| `action: heures 6` | fait passer des heures | |
| `action: garde 4` | fait passer des heures sans que rien ne bouge chez l'écho (travail chez Jumpy : faim, fatigue, besoins, émotions, événements en l'état) | |
| `action: drapeau garry.vaincu vrai` | pose aussitôt un drapeau (sans attendre la fin de la scène) | |
| `action: journal …` | une ligne au journal | |
| `action: ranch` · `action: lieu sanctuaire` · `action: lieu zone 27` | à la fin de la scène, le joueur rentre au ranch ou part ailleurs | |

### Les PNJ d'exploration

Ils sont branchés dans `src/jeu/exploration/pnj.ts` (lieu, heures, conditions, scène, sujet) : `PNJ_EXPLORATION` pour ceux qu'on voit dans le décor (on clique dessus), `BOUTONS_EXPLORATION` pour les étiquettes de bois clouées dans le décor (« Partir affronter Garry »…). Pour en ajouter un, une ligne suffit ; sa scène se joue par-dessus l'exploration avec `<ScenePnj …/>` (`src/jeu/monde/ScenePnj.tsx`), qui joue aussi ses combats et ses panneaux, enregistre les drapeaux et rend la main avec `sortie` : `action: ranch` ramène au ranch par la page de retour, `action: lieu zone 27` mène à un autre lieu d'exploration. L'horloge s'arrête pendant la scène ; la musique du lieu se tait pendant un combat de scène et pendant la cinématique de Nyxara (qui a la sienne) ; Morthen a la sienne tant qu'il est là. Un PNJ marqué `combat` ne se laisse pas aborder par un écho à bout de forces (tombé au dernier combat et pas encore reposé) ; dans une scène, `action: combat …` sur un écho à bout de forces ne lance pas le combat et rend `combat.issue = "fuite"`.

Chemins soumis à un drapeau (`zones.ts`) : 16 → 17 attend `hevann.vaincu`, 28 → 29 attend `trefonds.deblaye` (et le décor du 28 devient le 28 bis).

| PNJ | Où, quand (spécification du monde) | Scène | Condition |
|---|---|---|---|
| Morthen | lieu 2, jour ≥ 4, 8 h – 16 h | `morthen` | `non morthen.vu` |
| Bourbella | lieu 5, 4 h – 14 h | `bourbella-cabane` | `non bourbella.recrutee` |
| Phil et Hibert | lieu 6, 22 h – 7 h | `phil-hibert` (sujet « nuit ») | `non philhibert.vaincus` (même avant d’avoir parlé à Ash) |
| — | lieu 6, 8 h – 22 h : bouton « Inspecter la cabane » | `phil-hibert` (sujet « inspecter ») | idem |
| — | lieu 6 : bouton « Récupérer le marteau » | `phil-hibert` (sujet « marteau ») | `ash.marteau_au_sol` |
| Tourby | lieu 7, à partir de 16 h | `tourby-riviere` | `non tourby.recrute` |
| Ash | lieu 11, 8 h – 20 h | `ash-montagne` | `non ash.recrute` |
| Hevann | lieu 16, toujours (il bloque le passage vers le 17, la fouille et l'envoi de l'écho) | `hevann-chemin` | `non hevann.vaincu` |
| Garry | lieu 17 : bouton rouge « Partir affronter Garry » | `garry-foret` | `non garry.vaincu` |
| Grimp | lieu 23, à partir de 12 h (ou dès que Glamp est rentrée) | `grimp-caverne` | `non grimp.recrute` ; sortie « zone 27 » : le trou (bébé ou enfant) |
| — | lieu 28 : bouton « Déblayer le passage » | `trefonds-deblayer` | `grimp.accepte et non trefonds.deblaye` (décor 28bis ensuite) |
| Glamp | lieu 28, passage déblayé | `glamp-trefonds` | `trefonds.deblaye et non glamp.recrutee` |
| Glamp → Grimp | lieu 23, une fois Glamp rentrée | `grimp-caverne` | `glamp.recrutee et non grimp.recrute` : Grimp rejoint le village |
| Nyxara, Vinland, Finn | lieu 32, 8 h – 20 h, en y arrivant depuis le 31 (« Au secours ! » → « Aller voir ») | `nyxara` | `non nyxara.vue` |

Pêche : tant que `maintenant < peche.bonus_jusqua` (Bourbella), la prise d'un poisson bien ferré gagne 15 points (80 → 95 %) et le poisson garde l'appât un peu plus longtemps. Un écho bébé ou enfant passe par le trou de Grimp. Repousse (objet du sac, « Utiliser » en exploration) : drapeau `repousse.jusqua` (heure absolue, 12 heures).

## La voix des personnages (champ `voix` des fiches)

Pendant qu'une réplique s'écrit, chaque PNJ « parle » avec un petit instrument synthétisé. La voix se choisit dans sa fiche `contenu/personnages/<id>.json` (ou dans l'atelier, onglet **Personnages**) :

```json
"voix": { "timbre": "kalimba", "note": 523, "rythme": 1, "cadence": "syllabe", "variation": 9, "duree": 1, "volume": 1, "gamme": "penta" }
```

- `timbre` : la voix, parmi la bibliothèque (`src/moteur/voix/moteur-voix.js`, `VOIX`) — clochettes et lames (`boite-a-musique`, `celesta`, `cloche-verre`, `carillon`, `xylophone`, `marimba`, `kalimba`, `bois`), cordes pincées (`harpe`, `pizzicato`, `guitare`, `banjo`), vents (`flute-douce`, `ocarina`, `sifflet`, `clarinette`, `basson`, `kazoo`), voix et créatures (`blabla-grave`, `blabla-aigu`, `chuchotement`, `grognement`, `ronron`, `gazouillis`, `bulles`), synthés (`retro-8bits`, `theremine`, `orgue`), timbres d'origine (`doux`, `vif`, `grave`, `narration`, `boise`, `souffle`) et `mystere` (l'homme mystérieux). Inconnu ou absent : `doux`.
- `note` : hauteur de base en Hz ; `rythme` : pauses entre les lettres (> 1 : plus lent). Toujours présents.
- Facultatifs (sinon, les réglages de la voix choisie) : `variation` (étendue des hauteurs en demi-tons, 0 = une seule note), `gamme` (`penta`, `majeure`, `mineure`, `chromatique`, `libre`), `duree` (durée des notes, ×), `cadence` (`lettre`, `syllabe` ou `mot` : quand une note sonne), `volume` (×, 0 à 2).
- Un même mot sonne toujours pareil ; la fin d'une question monte. Les voix « bla-bla » et le chuchotement prennent la couleur des voyelles du texte.
- **Page d'essai** : `outils/voix/essai-voix.html` (un seul fichier, ouvrable sans le jeu ; dans l'atelier, lien « essayer toutes les voix ») — toutes les voix, leurs réglages, une phrase modifiable écrite lettre à lettre, les PNJ et leur voix actuelle, et le réglage prêt à copier dans la fiche. Elle embarque le moteur du jeu : après une modification du moteur ou des fiches, `npm run voix` la régénère (le test `tests/voix.test.ts` le rappelle).
