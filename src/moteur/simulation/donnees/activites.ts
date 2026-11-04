// Fichier généré à partir du prototype (prototype-v0/index.html) — données reprises telles quelles.
// Ne pas modifier à la main sans raison : ces valeurs font l'équilibrage hérité de la version de base.
import type { Entrainement, Corvee } from '../types';

export const ENTRAINEMENTS: Entrainement[] = [
  {
    "id": "pierres",
    "nom": "Soulever des pierres",
    "carac": "force",
    "processus": "moteur",
    "emotion": "wrath",
    "temperament": "res",
    "icone": "activites/entrainement/pierres.png"
  },
  {
    "id": "equilibre",
    "nom": "Tenir en équilibre",
    "carac": "endurance",
    "processus": "moteur",
    "emotion": "joy",
    "temperament": "cur",
    "icone": "activites/entrainement/equilibre.png"
  },
  {
    "id": "saut",
    "nom": "Sauter sur place",
    "carac": "robustesse",
    "processus": "moteur",
    "emotion": "disgust",
    "temperament": "dis",
    "icone": "activites/entrainement/saut.png"
  },
  {
    "id": "course",
    "nom": "Courir dans le ranch",
    "carac": "agilite",
    "processus": "moteur",
    "emotion": null,
    "temperament": null,
    "icone": "activites/entrainement/course.png"
  },
  {
    "id": "mediter",
    "nom": "Méditer",
    "carac": "perception",
    "processus": "cognitif",
    "emotion": "fear",
    "temperament": "ant",
    "icone": "activites/entrainement/meditation.png"
  },
  {
    "id": "probleme",
    "nom": "Résoudre des problèmes",
    "carac": "intelligence",
    "processus": "cognitif",
    "emotion": "sorrow",
    "temperament": "obs",
    "icone": "activites/entrainement/probleme.png"
  }
];

export const CORVEES: Corvee[] = [
  {
    "id": "ranger_ranch",
    "nom": "Ranger le ranch",
    "carac": "perception",
    "trait": "prudence",
    "icone": "activites/corvees/ranch.png"
  },
  {
    "id": "reparer_cloture",
    "nom": "Réparer la barrière",
    "carac": "force",
    "trait": "impulsivite",
    "icone": "activites/corvees/barriere.png"
  },
  {
    "id": "rattraper_poules",
    "nom": "Rattraper les poules",
    "carac": "agilite",
    "trait": "optimisme",
    "icone": "activites/corvees/poules.png"
  },
  {
    "id": "deplacer_foin",
    "nom": "Déplacer le foin",
    "carac": "robustesse",
    "trait": "prudence",
    "icone": "activites/corvees/foin.png"
  },
  {
    "id": "ramener_eau",
    "nom": "Ramener l’eau",
    "carac": "endurance",
    "trait": "planification",
    "icone": "activites/corvees/eau.png"
  },
  {
    "id": "trouver_echo",
    "nom": "Trouver l’écho caché",
    "carac": "intelligence",
    "trait": "resilience",
    "sansSecondaire": true,
    "icone": "activites/corvees/cache.png"
  }
];
