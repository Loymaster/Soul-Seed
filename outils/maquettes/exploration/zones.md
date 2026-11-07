# Schéma des zones d’exploration — pour générer la carte

Source : prototype (EXPLORATION_ZONES), 34 lieux. Le numéro est celui du décor `public/assets/decors/exploration/NN-*.png`.

| N° | Lieu | Région | Particularités | Chemins (vu depuis le lieu) |
|---|---|---|---|---|
| 1 | Sortie du village | Forêt |  | ranch / village ← ; gauche → 2 Passage vers la forêt; droite → 9 Montée vers la montagne |
| 2 | Passage vers la forêt | Forêt |  | tout droit → 3 1er embranchement forêt |
| 3 | 1er embranchement forêt | Forêt |  | gauche → 7 Rivière; tout droit → 16 Chemin de forêt; droite → 4 Cabane dans la forêt |
| 4 | Cabane dans la forêt | Forêt |  | tout droit → 5 Devant la cabane |
| 5 | Devant la cabane | Forêt |  | tout droit → 6 Dans la cabane |
| 6 | Dans la cabane | Forêt |  | — (cul-de-sac) |
| 7 | Rivière | Forêt | eau, pêche | tout droit → 8 Bord du lac |
| 8 | Bord du lac | Forêt | eau, pêche | en haut à gauche → 31 Sentier au bord du lac |
| 9 | Montée vers la montagne | Monts |  | tout droit → 10 Champ de rochers |
| 10 | Champ de rochers | Monts |  | tout droit → 11 Passage proche de la caverne |
| 11 | Passage proche de la caverne | Monts |  | gauche → 18 Entrée de la caverne; droite → 12 Vers la falaise |
| 12 | Vers la falaise | Monts |  | tout droit → 13 Plateau désertique |
| 13 | Plateau désertique | Monts |  | tout droit → 14 Falaise embrumée |
| 14 | Falaise embrumée | Monts |  | tout droit → 15 Falaise sans issue |
| 15 | Falaise sans issue | Monts |  | — (cul-de-sac) |
| 16 | Chemin de forêt | Forêt |  | tout droit → 17 Forêt détruite |
| 17 | Forêt détruite | Forêt |  | — (cul-de-sac) |
| 18 | Entrée de la caverne | Caverne | souterrain | tout droit → 19 Embranchement de la caverne |
| 19 | Embranchement de la caverne | Caverne | souterrain | gauche → 20 Vers le fond de la caverne; droite → 22 Large passage de la caverne |
| 20 | Vers le fond de la caverne | Caverne | souterrain | tout droit → 21 Lac souterrain |
| 21 | Lac souterrain | Caverne | eau, pêche, souterrain | droite → 24 Passage dérobé vers le gouffre |
| 22 | Large passage de la caverne | Caverne | souterrain | tout droit → 23 Vers la jungle depuis la caverne |
| 23 | Vers la jungle depuis la caverne | Caverne | souterrain | — (cul-de-sac) |
| 24 | Passage dérobé vers le gouffre | Caverne | souterrain | tout droit → 25 Vers le cœur de la montagne |
| 25 | Vers le cœur de la montagne | Caverne | souterrain | tout droit → 26 Embranchement dans les tréfonds |
| 26 | Embranchement dans les tréfonds | Caverne | souterrain | gauche → 28 Passage encombré dans les tréfonds; droite → 27 Passage dérobé sans issue |
| 27 | Passage dérobé sans issue | Caverne | souterrain | — (cul-de-sac) |
| 28 | Passage encombré dans les tréfonds | Caverne | souterrain | tout droit → 29 Vers le crystal magmatique |
| 29 | Vers le crystal magmatique | Caverne | souterrain | tout droit → 30 Arène du crystal en fusion |
| 30 | Arène du crystal en fusion | Caverne | souterrain | — (cul-de-sac) |
| 31 | Sentier au bord du lac | Rives du lac |  | gauche → 32 Sentier solitaire; droite → *les marais* (fermé) |
| 32 | Sentier solitaire | Rives du lac |  | tout droit → 33 Embranchement après le sentier |
| 33 | Embranchement après le sentier | Rives du lac |  | gauche → 34 Premier embranchement de la savane; droite → *Continuer plus loin* (fermé) |
| 34 | Premier embranchement de la savane | Rives du lac |  | gauche → *le fort* (fermé); droite → *l'oasis* (fermé) |

## Consigne proposée pour l'IA qui dessine la carte

Dessine une carte de région vue de dessus, dans le style d'une carte de carnet d'explorateur : papier jauni, encre brune, aquarelle légère, petites illustrations des lieux (pictogrammes dessinés à la main), aucune typographie moderne.
- À l'ouest, un ranch et un village. De là partent deux routes : l'une monte au nord-est dans **une forêt** (embranchements, une rivière, une cabane isolée au bout d'un sentier, une zone de forêt dévastée), l'autre file au sud-est vers **des monts** rocheux (champ de rochers, plateau désertique, falaise embrumée qui finit dans le vide).
- Au nord de la forêt, la rivière se jette dans **un lac** ; un sentier longe la rive vers l'est et s'ouvre sur **une savane** (un fort au loin, une oasis), et des marais.
- Sous les monts, **une caverne** : entrée au flanc de la montagne, galeries, un lac souterrain, un gouffre, des tréfonds qui descendent jusqu'à **une arène de cristal en fusion** (lueur orange), et une galerie qui débouche sur une jungle (hors carte).
- Respecte les liaisons du schéma joint (qui mène où) ; les distances sont libres.
- Pas de noms écrits sur la carte (le jeu les ajoute), pas de quadrillage, pas de rose des vents moderne. Format paysage, 16:10, haute définition.
- Prévoir chaque lieu comme un repère visuel distinct : le jeu masquera les zones non découvertes (brume / papier vierge) et les révélera une à une.
