// Fichier généré à partir du prototype (prototype-v0/index.html) — données reprises telles quelles.
// Ne pas modifier à la main sans raison : ces valeurs font l'équilibrage hérité de la version de base.
import type { OptionInteraction, CategorieInteraction } from '../types';

export const INTERACTIONS: Record<Exclude<CategorieInteraction, 'cadeau'>, OptionInteraction[]> = {
  "affection": [
    {
      "id": "caliner",
      "libelle": "Câliner",
      "humeur": 20,
      "emotions": {
        "joie": 20,
        "peur": -5,
        "colere": -5,
        "tristesse": -5
      },
      "attachement": 2,
      "affection": 2,
      "education": {
        "processus": "socio",
        "emotion": "joy"
      },
      "resultat": "{nom} se blottit contre vous, visiblement apaisé(e).",
      "journal": "Vous avez câliné {nom}."
    },
    {
      "id": "caresser",
      "libelle": "Caresser la tête",
      "humeur": 12,
      "emotions": {
        "joie": 12,
        "tristesse": -5,
        "peur": -3
      },
      "attachement": 2,
      "affection": 1,
      "education": {
        "processus": "socio",
        "emotion": "joy"
      },
      "resultat": "{nom} ferme les yeux sous vos caresses, l’air comblé(e).",
      "journal": "Vous avez caressé la tête de {nom}."
    },
    {
      "id": "consoler",
      "libelle": "Consoler",
      "humeur": 15,
      "emotions": {
        "tristesse": -20,
        "peur": -10,
        "joie": 8
      },
      "attachement": 3,
      "affection": 2,
      "education": {
        "processus": "socio",
        "emotion": "sorrow"
      },
      "resultat": "{nom} se détend peu à peu, rassuré(e) par votre présence.",
      "journal": "Vous avez consolé {nom}."
    },
    {
      "id": "histoire",
      "libelle": "Raconter une histoire",
      "humeur": 10,
      "emotions": {
        "joie": 10,
        "peur": -8,
        "surprise": 10
      },
      "attachement": 1,
      "affection": 1,
      "education": {
        "processus": "cognitif",
        "emotion": "joy"
      },
      "resultat": "{nom} a écouté votre histoire avec de grands yeux émerveillés.",
      "journal": "Vous avez raconté une histoire à {nom}."
    },
    {
      "id": "porter",
      "libellePetit": "Prendre sur ses épaules",
      "libelleGrand": "Tenir par le bras",
      "humeur": 14,
      "emotions": {
        "joie": 14,
        "peur": -5
      },
      "attachement": 2,
      "affection": 2,
      "education": {
        "processus": "moteur",
        "emotion": "joy"
      },
      "resultat": "{nom} savoure ce moment de proximité avec vous.",
      "journal": "Vous avez passé un moment tout contre {nom}."
    },
    {
      "id": "tapoter",
      "libelle": "Tapoter le dos",
      "humeur": 8,
      "emotions": {
        "joie": 8,
        "tristesse": -3
      },
      "attachement": 1,
      "affection": 1,
      "education": {
        "processus": "socio",
        "emotion": null
      },
      "resultat": "{nom} pousse un petit soupir satisfait.",
      "journal": "Vous avez tapoté le dos de {nom}."
    }
  ],
  "discussion": [
    {
      "id": "encourager",
      "libelle": "Encourager",
      "humeur": 12,
      "emotions": {
        "joie": 10,
        "peur": -8
      },
      "attachement": 1,
      "affection": 1,
      "anxiete": -3,
      "education": {
        "processus": "socio",
        "emotion": null
      },
      "resultat": "{nom} redresse la tête, visiblement galvanisé(e) par vos mots.",
      "journal": "Vous avez encouragé {nom}."
    },
    {
      "id": "ecouter",
      "libelle": "Écouter {nom}",
      "humeur": 10,
      "emotions": {
        "tristesse": -10,
        "peur": -10
      },
      "attachement": 2,
      "affection": 1,
      "anxiete": -10,
      "education": {
        "processus": "socio",
        "emotion": "sorrow"
      },
      "resultat": "{nom} semble soulagé(e) d’avoir pu se confier.",
      "journal": "Vous avez écouté {nom}."
    },
    {
      "id": "blague",
      "libelle": "Faire une blague",
      "humeur": 16,
      "emotions": {
        "joie": 18,
        "surprise": 15,
        "tristesse": -5
      },
      "attachement": 1,
      "affection": 1,
      "anxiete": -3,
      "education": {
        "processus": "socio",
        "emotion": "joy"
      },
      "resultat": "{nom} éclate de rire, surpris(e) par votre humour.",
      "journal": "Vous avez fait une blague à {nom}."
    },
    {
      "id": "bavarder",
      "libelle": "Bavarder",
      "humeur": 8,
      "emotions": {
        "joie": 8
      },
      "attachement": 1,
      "affection": 1,
      "anxiete": -3,
      "education": {
        "processus": "socio",
        "emotion": null
      },
      "resultat": "Vous avez papoté un moment, {nom} semble content(e) de cet échange.",
      "journal": "Vous avez bavardé avec {nom}."
    },
    {
      "id": "apprendre",
      "libelle": "Essayer d’en apprendre davantage",
      "humeur": 4,
      "emotions": {
        "surprise": 10
      },
      "attachement": 1,
      "affection": 0,
      "education": {
        "processus": "cognitif",
        "emotion": null
      },
      "resultat": "{nom} vous observe, un peu intrigué(e) par toutes ces questions.",
      "journal": "Vous avez essayé d’en apprendre davantage sur {nom}."
    },
    {
      "id": "observer",
      "libelle": "Observer son état",
      "humeur": 0,
      "emotions": {},
      "attachement": 0,
      "affection": 0,
      "resultat": "Vous avez pris le temps d’observer attentivement {nom}.",
      "journal": "Vous avez observé l’état de {nom}."
    }
  ],
  "jeu": [
    {
      "id": "course",
      "libelle": "Course",
      "humeur": 14,
      "emotions": {
        "joie": 16,
        "colere": -5
      },
      "attachement": 2,
      "affection": 1,
      "energie": -8,
      "education": {
        "processus": "moteur",
        "emotion": "wrath"
      },
      "resultat": "{nom} est essoufflé(e) mais ravi(e) après cette course.",
      "journal": "Vous avez fait la course avec {nom}."
    },
    {
      "id": "cachecache",
      "libelle": "Cache-cache",
      "humeur": 14,
      "emotions": {
        "joie": 14,
        "peur": 5,
        "surprise": 15
      },
      "attachement": 2,
      "affection": 1,
      "energie": -5,
      "education": {
        "processus": "moteur",
        "emotion": "fear"
      },
      "resultat": "{nom} sort de sa cachette en riant, ravi(e) de la partie.",
      "journal": "Vous avez joué à cache-cache avec {nom}."
    },
    {
      "id": "dessiner",
      "libelle": "Dessiner",
      "humeur": 10,
      "emotions": {
        "joie": 10,
        "degout": -5
      },
      "attachement": 1,
      "affection": 1,
      "energie": -2,
      "education": {
        "processus": "cognitif",
        "emotion": "disgust"
      },
      "resultat": "{nom} contemple fièrement le dessin que vous avez fait ensemble.",
      "journal": "Vous avez dessiné avec {nom}."
    },
    {
      "id": "balle",
      "libelle": "Jouer à la balle",
      "humeur": 14,
      "emotions": {
        "joie": 16
      },
      "attachement": 2,
      "affection": 1,
      "energie": -8,
      "education": {
        "processus": "moteur",
        "emotion": "joy"
      },
      "resultat": "{nom} bondit encore un peu, tout excité(e) par le jeu.",
      "journal": "Vous avez joué à la balle avec {nom}."
    },
    {
      "id": "cabanes",
      "libelle": "Construire des cabanes",
      "humeur": 12,
      "emotions": {
        "joie": 12
      },
      "attachement": 2,
      "affection": 1,
      "energie": -6,
      "education": {
        "processus": "cognitif",
        "emotion": null
      },
      "resultat": "{nom} admire fièrement la cabane que vous venez de construire ensemble.",
      "journal": "Vous avez construit une cabane avec {nom}."
    },
    {
      "id": "devinettes",
      "libelle": "Faire des devinettes",
      "humeur": 8,
      "emotions": {
        "joie": 8,
        "surprise": 10
      },
      "attachement": 1,
      "affection": 1,
      "energie": -2,
      "education": {
        "processus": "cognitif",
        "emotion": "sorrow"
      },
      "resultat": "{nom} rigole encore de vos devinettes.",
      "journal": "Vous avez fait des devinettes avec {nom}."
    }
  ],
  "partage": [
    {
      "id": "ciel",
      "libelleJour": "Regarder les nuages",
      "libelleNuit": "Regarder les étoiles",
      "humeur": 12,
      "emotions": {
        "joie": 10,
        "peur": -10,
        "tristesse": -5
      },
      "attachement": 3,
      "affection": 2,
      "anxiete": -10,
      "education": {
        "processus": "cognitif",
        "emotion": "fear"
      },
      "resultat": "Vous avez contemplé le ciel ensemble en silence, {nom} semble apaisé(e).",
      "journal": "Vous avez regardé le ciel avec {nom}."
    },
    {
      "id": "balade",
      "libelle": "Se balader ensemble",
      "humeur": 10,
      "emotions": {
        "joie": 10,
        "colere": -5
      },
      "attachement": 3,
      "affection": 2,
      "anxiete": -3,
      "energie": -4,
      "education": {
        "processus": "moteur",
        "emotion": null
      },
      "resultat": "{nom} trottine encore joyeusement après cette balade.",
      "journal": "Vous vous êtes baladé(e) avec {nom}."
    },
    {
      "id": "sieste",
      "libelle": "Faire une sieste côte à côte",
      "humeur": 10,
      "emotions": {
        "tristesse": -8,
        "peur": -8
      },
      "attachement": 3,
      "affection": 2,
      "energie": 8,
      "education": {
        "processus": "socio",
        "emotion": null
      },
      "resultat": "{nom} s’étire doucement après cette sieste partagée.",
      "journal": "Vous avez fait une sieste aux côtés de {nom}."
    },
    {
      "id": "bruits",
      "libelle": "Écouter les bruits de la nature",
      "humeur": 8,
      "emotions": {
        "peur": -10,
        "tristesse": -5
      },
      "attachement": 2,
      "affection": 1,
      "anxiete": -8,
      "education": {
        "processus": "cognitif",
        "emotion": "sorrow"
      },
      "resultat": "{nom} a l’oreille aux aguets, apaisé(e) par les sons de la nature.",
      "journal": "Vous avez écouté les bruits de la nature avec {nom}."
    },
    {
      "id": "insectes",
      "libelle": "Chasser des insectes",
      "humeur": 12,
      "emotions": {
        "joie": 14,
        "degout": 5
      },
      "attachement": 2,
      "affection": 1,
      "anxiete": -3,
      "energie": -5,
      "education": {
        "processus": "moteur",
        "emotion": "disgust"
      },
      "resultat": "{nom} montre fièrement l’insecte qu’il/elle vient d’attraper.",
      "journal": "Vous avez chassé des insectes avec {nom}."
    },
    {
      "id": "feu",
      "libelle": "Faire un feu",
      "humeur": 10,
      "emotions": {
        "joie": 10,
        "peur": -5
      },
      "attachement": 3,
      "affection": 2,
      "anxiete": -3,
      "energie": -3,
      "education": {
        "processus": "cognitif",
        "emotion": "wrath"
      },
      "resultat": "{nom} regarde les flammes danser, hypnotisé(e).",
      "journal": "Vous avez fait un feu avec {nom}."
    }
  ],
  "education": [
    {
      "id": "recul",
      "libelle": "Montrer comment prendre du recul",
      "humeur": 4,
      "emotions": {
        "colere": -10,
        "tristesse": -5
      },
      "discipline": 3,
      "autonomie": 2,
      "education": {
        "processus": "cognitif",
        "emotion": "sorrow"
      },
      "resultat": "{nom} semble réfléchir à ce que vous venez de lui montrer.",
      "journal": "Vous avez montré à {nom} comment prendre du recul."
    },
    {
      "id": "phenomene",
      "libelle": "Démontrer un phénomène physique",
      "humeur": 4,
      "emotions": {
        "surprise": 15
      },
      "education": {
        "processus": "cognitif",
        "emotion": null
      },
      "resultat": "{nom} observe le phénomène avec de grands yeux curieux.",
      "journal": "Vous avez démontré un phénomène physique à {nom}."
    },
    {
      "id": "corriger",
      "libelle": "Corriger sa manière de voir le monde",
      "humeur": -2,
      "emotions": {
        "colere": 5,
        "tristesse": 5
      },
      "discipline": 3,
      "authenticite": -2,
      "education": {
        "processus": "cognitif",
        "emotion": null
      },
      "resultat": "{nom} fronce les sourcils, pas totalement convaincu(e) par votre correction.",
      "journal": "Vous avez corrigé la manière de voir le monde de {nom}."
    },
    {
      "id": "conseil",
      "libelle": "Donner un conseil précieux",
      "humeur": 6,
      "emotions": {
        "joie": 5,
        "peur": -5
      },
      "autonomie": 3,
      "education": {
        "processus": "cognitif",
        "emotion": null
      },
      "resultat": "{nom} hoche la tête, votre conseil semble avoir fait mouche.",
      "journal": "Vous avez donné un conseil précieux à {nom}."
    },
    {
      "id": "erreur",
      "libelle": "Apprendre à accepter l’erreur",
      "humeur": 4,
      "emotions": {
        "tristesse": -8,
        "colere": -5
      },
      "autonomie": 2,
      "sentimentJustice": 2,
      "education": {
        "processus": "socio",
        "emotion": null
      },
      "resultat": "{nom} semble accepter un peu mieux ses erreurs, plus serein(e).",
      "journal": "Vous avez appris à {nom} à accepter l’erreur."
    },
    {
      "id": "part",
      "libelle": "Faire la part des choses",
      "humeur": 4,
      "emotions": {
        "colere": -8
      },
      "sentimentJustice": 3,
      "altruisme": 2,
      "education": {
        "processus": "cognitif",
        "emotion": null
      },
      "resultat": "{nom} médite sur ce que vous venez de lui expliquer.",
      "journal": "Vous avez aidé {nom} à faire la part des choses."
    }
  ]
};
