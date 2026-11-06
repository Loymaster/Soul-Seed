// Techniques de combat, reprises telles quelles du prototype (TECHNIQUE_DATA, TECHNIQUE_DESC, pools, rôles).
// Seule correction : « Spores toxiques », écrit ainsi dans certains pools du prototype, y désignait « Spore toxique ».
import type { CategorieTechnique, FicheTechnique } from '../types';

export const CATEGORIES_TECHNIQUE: { cle: CategorieTechnique; libelle: string }[] = [
  {
    "cle": "physique",
    "libelle": "Physique"
  },
  {
    "cle": "spectral",
    "libelle": "Spectral"
  },
  {
    "cle": "poison",
    "libelle": "Poison"
  },
  {
    "cle": "aquatique",
    "libelle": "Aquatique"
  },
  {
    "cle": "incendiaire",
    "libelle": "Incendiaire"
  },
  {
    "cle": "malefique",
    "libelle": "Maléfique"
  },
  {
    "cle": "lumineux",
    "libelle": "Lumineux"
  },
  {
    "cle": "ethere",
    "libelle": "Éthéré"
  }
];

export const TECHNIQUES: Record<string, FicheTechnique> = {
  "Coup brutal": {
    "categorie": "physique",
    "role": "agression",
    "percage": 0.5,
    "auToucher": [
      {
        "statut": "etourdissement",
        "chance": 0.2
      }
    ],
    "description": "Attaque perçant 50% de la résistance adverse, avec 20% de chances d’étourdissement."
  },
  "Second souffle": {
    "categorie": "physique",
    "role": "defense",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "regeneration",
        "chance": 1,
        "duree": 15,
        "soin": 0.1,
        "cible": "soi"
      },
      {
        "statut": "immunite",
        "chance": 1,
        "duree": 15,
        "cible": "soi"
      }
    ],
    "description": "Régénère 10% des PV sur 15s et applique Immunité 15s sur soi."
  },
  "Déchirure": {
    "categorie": "physique",
    "role": "agression",
    "percage": 0.5,
    "auToucher": [
      {
        "statut": "saignement",
        "chance": 0.35
      }
    ],
    "description": "Attaque perçant 50% de la résistance, 35% de chances de Saignement."
  },
  "Onde de choc": {
    "categorie": "physique",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "etourdissement",
        "chance": 0.4
      }
    ],
    "description": "Attaque de zone, 40% de chances d’étourdissement."
  },
  "Sphère spectrale": {
    "categorie": "spectral",
    "role": "agression",
    "distance": true,
    "auToucher": [
      {
        "statut": "terreur",
        "chance": 0.25
      }
    ],
    "description": "Attaque à distance, 25% de chances de Terreur."
  },
  "Cri des âmes": {
    "categorie": "spectral",
    "role": "prevention",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "terreur",
        "chance": 0.8,
        "cible": "adversaire"
      },
      {
        "statut": "ralentissement",
        "chance": 0.8,
        "duree": 8,
        "cible": "adversaire"
      }
    ],
    "description": "Applique Terreur et Ralentissement à l’adversaire sans attaquer (80%)."
  },
  "Voile fantomatique": {
    "categorie": "spectral",
    "role": "prevention",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "rapidite",
        "chance": 1,
        "duree": 10,
        "cible": "soi"
      },
      {
        "statut": "protection",
        "chance": 1,
        "duree": 10,
        "cible": "soi"
      },
      {
        "statut": "immunite",
        "chance": 1,
        "duree": 10,
        "cible": "soi"
      }
    ],
    "description": "Applique Rapidité, Protection et Immunité sur soi (10s)."
  },
  "Étreinte sombre": {
    "categorie": "spectral",
    "role": "agression",
    "auToucher": [
      {
        "statut": "etourdissement",
        "chance": 0.3
      },
      {
        "statut": "empoisonnement",
        "chance": 0.35
      }
    ],
    "description": "Attaque pouvant provoquer Étourdissement (30%) et Empoisonnement (35%)."
  },
  "Morsure venimeuse": {
    "categorie": "poison",
    "role": "agression",
    "auToucher": [
      {
        "statut": "empoisonnement",
        "chance": 0.6
      }
    ],
    "description": "Attaque, 60% de chances d’Empoisonnement."
  },
  "Spore toxique": {
    "categorie": "poison",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "empoisonnement",
        "chance": 0.5
      }
    ],
    "description": "Attaque de zone, 50% de chances d’Empoisonnement sur les adversaires touchés."
  },
  "Peau corrosive": {
    "categorie": "poison",
    "role": "defense",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "renvoiDegats",
        "chance": 1,
        "duree": 15,
        "part": 0.2,
        "poisonRiposte": 0.2,
        "cible": "soi"
      }
    ],
    "description": "Applique Renvoi de dégâts (20%, 15s) ; chaque coup reçu a 20% de chances d’empoisonner l’attaquant."
  },
  "Anticorps": {
    "categorie": "poison",
    "role": "defense",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "etourdissement",
        "chance": 1,
        "cible": "soi"
      },
      {
        "statut": "regeneration",
        "chance": 1,
        "duree": 15,
        "soin": 0.3,
        "cible": "soi"
      }
    ],
    "description": "Étourdit et régénère 30% des PV sur soi (15s)."
  },
  "Vague apaisante": {
    "categorie": "aquatique",
    "role": "defense",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "regeneration",
        "chance": 1,
        "duree": 15,
        "soin": 0.25,
        "cible": "soi"
      },
      {
        "statut": "ralentissement",
        "chance": 1,
        "duree": 10,
        "cible": "soi"
      }
    ],
    "description": "Régénère 25% des PV sur soi (15s) mais applique Ralentissement (10s)."
  },
  "Brume engouffrante": {
    "categorie": "aquatique",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "terreur",
        "chance": 0.2
      },
      {
        "statut": "ralentissement",
        "chance": 0.2,
        "duree": 8
      }
    ],
    "description": "Attaque de zone, 20% de Terreur et 20% de Ralentissement."
  },
  "Tourbillon": {
    "categorie": "aquatique",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "annulation",
        "chance": 0.6
      }
    ],
    "description": "Attaque de zone, 60% de chances d’Annulation."
  },
  "Jet haute pression": {
    "categorie": "aquatique",
    "role": "agression",
    "distance": true,
    "percage": 0.5,
    "description": "Attaque à distance perçant 50% de la résistance."
  },
  "Boule de feu": {
    "categorie": "incendiaire",
    "role": "agression",
    "distance": true,
    "auToucher": [
      {
        "statut": "brulure",
        "chance": 0.7,
        "cumuls": 1
      }
    ],
    "description": "Attaque à distance, 70% de chances d’1 Brûlure."
  },
  "Poing incandescent": {
    "categorie": "incendiaire",
    "role": "agression",
    "auToucher": [
      {
        "statut": "brulure",
        "chance": 1,
        "cumuls": 1
      }
    ],
    "description": "Attaque, applique toujours 1 Brûlure."
  },
  "Vague solaire": {
    "categorie": "incendiaire",
    "role": "agression",
    "zone": true,
    "chaineBrulure": {
      "base": 0,
      "chances": [
        0.7,
        0.3
      ]
    },
    "description": "Attaque de zone, 70% pour 1 Brûlure puis 30% pour une 2e."
  },
  "Souffle enflammé": {
    "categorie": "incendiaire",
    "role": "agression",
    "sansDegats": true,
    "chaineBrulure": {
      "base": 2,
      "chances": [
        0.5,
        0.25
      ]
    },
    "description": "Sans dégâts : applique 2 Brûlures (100%), 50% pour une 3e, 25% pour une 4e."
  },
  "Regard funeste": {
    "categorie": "malefique",
    "role": "prevention",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "terreur",
        "chance": 1,
        "cible": "adversaire"
      },
      {
        "statut": "annulation",
        "chance": 1,
        "cible": "adversaire"
      }
    ],
    "description": "Applique Terreur et Annulation à l’adversaire sans attaquer."
  },
  "Absorption vitale": {
    "categorie": "malefique",
    "role": "agression",
    "volDeVie": 0.5,
    "description": "Attaque qui vole 50% des dégâts infligés en PV."
  },
  "Abîme": {
    "categorie": "malefique",
    "role": "agression",
    "zone": true,
    "percage": 0.5,
    "auToucher": [
      {
        "statut": "annulation",
        "chance": 1
      }
    ],
    "description": "Attaque de zone perçant 50% de la résistance, applique Annulation."
  },
  "Malédiction": {
    "categorie": "malefique",
    "role": "prevention",
    "sansDegats": true,
    "distance": true,
    "coutVie": 0.3,
    "aLancer": [
      {
        "statut": "annulation",
        "chance": 1,
        "cible": "adversaire"
      },
      {
        "statut": "empoisonnement",
        "chance": 1,
        "cible": "adversaire"
      },
      {
        "statut": "brulure",
        "chance": 1,
        "cumuls": 1,
        "cible": "adversaire"
      },
      {
        "statut": "ralentissement",
        "chance": 1,
        "duree": 8,
        "cible": "adversaire"
      }
    ],
    "description": "Applique Annulation, Empoisonnement, Brûlure et Ralentissement à l’adversaire ; le lanceur perd 30% de sa vie restante."
  },
  "Rayon sacré": {
    "categorie": "lumineux",
    "role": "agression",
    "distance": true,
    "auToucher": [
      {
        "statut": "etourdissement",
        "chance": 0.5
      }
    ],
    "description": "Attaque à distance, 50% de chances d’étourdissement."
  },
  "Protection impénétrable": {
    "categorie": "lumineux",
    "role": "defense",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "immunite",
        "chance": 1,
        "duree": 15,
        "cible": "soi"
      },
      {
        "statut": "protection",
        "chance": 1,
        "duree": 15,
        "cible": "soi"
      }
    ],
    "description": "Applique Immunité et Protection sur soi (15s)."
  },
  "Sanctuaire": {
    "categorie": "lumineux",
    "role": "defense",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "regeneration",
        "chance": 1,
        "duree": 20,
        "soin": 0.2,
        "cible": "soi"
      },
      {
        "statut": "protection",
        "chance": 1,
        "duree": 20,
        "cible": "soi"
      },
      {
        "statut": "rapidite",
        "chance": 1,
        "duree": 20,
        "cible": "soi"
      },
      {
        "statut": "etourdissement",
        "chance": 1,
        "cible": "soi"
      }
    ],
    "description": "Régénère 20% des PV, applique Protection et Rapidité (20s), mais étourdit le lanceur."
  },
  "Lame de l'aube": {
    "categorie": "lumineux",
    "role": "agression",
    "percage": 0.5,
    "auToucher": [
      {
        "statut": "brulure",
        "chance": 0.5,
        "cumuls": 1
      }
    ],
    "description": "Attaque perçant 50% de la résistance, 50% de chances d’1 Brûlure."
  },
  "Barrière magique": {
    "categorie": "ethere",
    "role": "prevention",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "protection",
        "chance": 1,
        "duree": 10,
        "cible": "soi"
      }
    ],
    "description": "Applique Protection sur soi."
  },
  "Résonance arcanique": {
    "categorie": "ethere",
    "role": "prevention",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "rapidite",
        "chance": 1,
        "duree": 10,
        "cible": "soi"
      }
    ],
    "description": "Applique Rapidité sur soi."
  },
  "Éclat éthéré": {
    "categorie": "ethere",
    "role": "agression",
    "distance": true,
    "auToucher": [
      {
        "statut": "brulure",
        "chance": 0.15,
        "cumuls": 1
      },
      {
        "statut": "empoisonnement",
        "chance": 0.15
      }
    ],
    "description": "Attaque à distance, 15% pour 1 Brûlure et 15% d’Empoisonnement."
  },
  "Orbe de mana": {
    "categorie": "ethere",
    "role": "agression",
    "distance": true,
    "auToucher": [
      {
        "statut": "etourdissement",
        "chance": 0.4
      },
      {
        "statut": "brulure",
        "chance": 0.1,
        "cumuls": 1
      },
      {
        "statut": "empoisonnement",
        "chance": 0.1
      }
    ],
    "description": "Attaque à distance, 40% d’étourdissement, 10% pour 1 Brûlure et 10% d’Empoisonnement."
  },
  "Fracas Tellurique": {
    "categorie": "physique",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "ralentissement",
        "chance": 1,
        "duree": 10
      }
    ],
    "description": "Attaque de zone, applique Ralentissement (10s)."
  },
  "Projection": {
    "categorie": "physique",
    "role": "agression",
    "sansDegats": true,
    "aLancer": [
      {
        "statut": "etourdissement",
        "chance": 1,
        "cible": "adversaire"
      },
      {
        "statut": "annulation",
        "chance": 1,
        "cible": "adversaire"
      }
    ],
    "description": "Sans dégât : applique Étourdissement et Annulation à l’adversaire."
  },
  "Bourrasque fracassante": {
    "categorie": "physique",
    "role": "agression",
    "auToucher": [
      {
        "statut": "terreur",
        "chance": 0.5
      }
    ],
    "description": "Attaque, 50% de chances de Terreur."
  },
  "Motivation inébranlable": {
    "categorie": "physique",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "protection",
        "chance": 1,
        "duree": 20,
        "cible": "soi"
      },
      {
        "statut": "immunite",
        "chance": 1,
        "duree": 10,
        "cible": "soi"
      }
    ],
    "description": "Applique Protection (20s) et Immunité (10s) sur soi."
  },
  "Foudre ombrageuse": {
    "categorie": "spectral",
    "role": "agression",
    "distance": true,
    "auToucher": [
      {
        "statut": "etourdissement",
        "chance": 0.45
      },
      {
        "statut": "brulure",
        "chance": 0.35,
        "cumuls": 1
      }
    ],
    "description": "Attaque à distance, 45% de chances d’étourdissement, 35% de Brûlure."
  },
  "Tempête des damnés": {
    "categorie": "spectral",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "terreur",
        "chance": 0.3
      },
      {
        "statut": "annulation",
        "chance": 0.3
      }
    ],
    "description": "Attaque de zone, 30% de Terreur, 30% d’Annulation."
  },
  "Possession malsaine": {
    "categorie": "spectral",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "saignement",
        "chance": 1,
        "cible": "adversaire"
      },
      {
        "statut": "etourdissement",
        "chance": 1,
        "cible": "adversaire"
      }
    ],
    "description": "Sans dégât : applique Saignement et Étourdissement à l’adversaire."
  },
  "Ombre rassurante": {
    "categorie": "spectral",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "rapidite",
        "chance": 1,
        "duree": 20,
        "cible": "soi"
      },
      {
        "statut": "regeneration",
        "chance": 1,
        "duree": 20,
        "soin": 0.3,
        "cible": "soi"
      },
      {
        "statut": "etourdissement",
        "chance": 1,
        "cible": "soi"
      }
    ],
    "description": "Applique Rapidité et Régénération de 30% sur soi (20s), mais s’inflige un Étourdissement."
  },
  "Éruption fongique": {
    "categorie": "poison",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "empoisonnement",
        "chance": 0.65
      }
    ],
    "description": "Attaque de zone, 65% de chances d’Empoisonnement."
  },
  "Carapace minérale": {
    "categorie": "poison",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "protection",
        "chance": 1,
        "duree": 15,
        "cible": "soi"
      },
      {
        "statut": "renvoiDegats",
        "chance": 1,
        "duree": 15,
        "part": 0.2,
        "cible": "soi"
      },
      {
        "statut": "ralentissement",
        "chance": 1,
        "duree": 10,
        "cible": "soi"
      }
    ],
    "description": "Applique Protection, Renvoi de dégâts et Ralentissement sur soi."
  },
  "Frappe de ronces": {
    "categorie": "poison",
    "role": "agression",
    "auToucher": [
      {
        "statut": "saignement",
        "chance": 0.4
      },
      {
        "statut": "empoisonnement",
        "chance": 0.5
      }
    ],
    "description": "Attaque, 40% de chances de Saignement, 50% d’Empoisonnement."
  },
  "Odeur pestilentielle": {
    "categorie": "poison",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "terreur",
        "chance": 0.35
      },
      {
        "statut": "empoisonnement",
        "chance": 0.3
      }
    ],
    "description": "Attaque de zone, 35% de Terreur, 30% d’Empoisonnement."
  },
  "Ouragan": {
    "categorie": "aquatique",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "ralentissement",
        "chance": 0.65,
        "duree": 10
      }
    ],
    "description": "Attaque de zone, 65% de chances de Ralentissement."
  },
  "Courant ascendant": {
    "categorie": "aquatique",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "rapidite",
        "chance": 1,
        "duree": 20,
        "cible": "soi"
      },
      {
        "statut": "regeneration",
        "chance": 1,
        "duree": 20,
        "soin": 0.1,
        "cible": "soi"
      }
    ],
    "description": "Applique Rapidité et Régénération de 10% des PV sur soi (20s)."
  },
  "Vase poisseuse": {
    "categorie": "aquatique",
    "role": "agression",
    "distance": true,
    "auToucher": [
      {
        "statut": "annulation",
        "chance": 0.4
      },
      {
        "statut": "ralentissement",
        "chance": 0.4,
        "duree": 10
      }
    ],
    "description": "Attaque à distance, 40% d’Annulation, 40% de Ralentissement."
  },
  "Intense vapeur": {
    "categorie": "aquatique",
    "role": "agression",
    "distance": true,
    "auToucher": [
      {
        "statut": "brulure",
        "chance": 0.75,
        "cumuls": 1
      },
      {
        "statut": "ralentissement",
        "chance": 0.5,
        "duree": 10
      }
    ],
    "description": "Attaque à distance, 75% pour 1 Brûlure, 50% de Ralentissement."
  },
  "Explosion volcanique": {
    "categorie": "incendiaire",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "brulure",
        "chance": 1,
        "cumuls": 2
      },
      {
        "statut": "ralentissement",
        "chance": 0.5,
        "duree": 10
      }
    ],
    "aLancer": [
      {
        "statut": "etourdissement",
        "chance": 1,
        "cible": "soi"
      }
    ],
    "description": "Attaque de zone : applique 2 Brûlures et 50% de Ralentissement, mais étourdit le lanceur."
  },
  "Pluie de cendres": {
    "categorie": "incendiaire",
    "role": "agression",
    "sansDegats": true,
    "zone": true,
    "aLancer": [
      {
        "statut": "annulation",
        "chance": 0.5,
        "cible": "adversaire"
      },
      {
        "statut": "empoisonnement",
        "chance": 0.6,
        "cible": "adversaire"
      },
      {
        "statut": "brulure",
        "chance": 0.6,
        "cumuls": 1,
        "cible": "adversaire"
      },
      {
        "statut": "ralentissement",
        "chance": 1,
        "duree": 10,
        "cible": "adversaire"
      }
    ],
    "description": "Sans dégâts sur une zone : 50% d’Annulation, 60% d’Empoisonnement, 60% pour 1 Brûlure, applique Ralentissement."
  },
  "Fournaise interne": {
    "categorie": "incendiaire",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "protection",
        "chance": 1,
        "duree": 15,
        "cible": "soi"
      },
      {
        "statut": "renvoiDegats",
        "chance": 1,
        "duree": 15,
        "part": 0.2,
        "brulureRiposte": 0.5,
        "cible": "soi"
      }
    ],
    "description": "Applique Protection et Renvoi de dégâts sur soi (15s) ; 50% de chances d’infliger 1 Brûlure à qui attaque le lanceur."
  },
  "Météore": {
    "categorie": "incendiaire",
    "role": "agression",
    "zone": true,
    "chaineBrulure": {
      "base": 1,
      "chances": [
        0.5
      ]
    },
    "description": "Attaque de zone : inflige 1 Brûlure, 50% de chances pour une 2e."
  },
  "Pacte maléfique": {
    "categorie": "malefique",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "coutVie": 0.25,
    "aLancer": [
      {
        "statut": "immunite",
        "chance": 1,
        "duree": 20,
        "cible": "soi"
      },
      {
        "statut": "rapidite",
        "chance": 1,
        "duree": 20,
        "cible": "soi"
      },
      {
        "statut": "protection",
        "chance": 1,
        "duree": 20,
        "cible": "soi"
      },
      {
        "statut": "renvoiDegats",
        "chance": 1,
        "duree": 20,
        "part": 0.2,
        "cible": "soi"
      }
    ],
    "description": "Le lanceur perd 25% de sa vie restante et gagne Immunité, Rapidité, Protection et Renvoi de dégâts (20s)."
  },
  "Flamme noire": {
    "categorie": "malefique",
    "role": "agression",
    "distance": true,
    "volDeVie": 0.2,
    "auToucher": [
      {
        "statut": "brulure",
        "chance": 0.5,
        "cumuls": 1
      }
    ],
    "description": "Attaque à distance, 50% pour 1 Brûlure. Vole 20% des dégâts infligés en PV."
  },
  "Miasmes des ténèbres": {
    "categorie": "malefique",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "empoisonnement",
        "chance": 0.7
      },
      {
        "statut": "terreur",
        "chance": 0.35
      }
    ],
    "description": "Attaque de zone, 70% de chances d’Empoisonnement, 35% de Terreur."
  },
  "Offrande": {
    "categorie": "malefique",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "offrande",
        "chance": 1,
        "cible": "soi"
      }
    ],
    "description": "Le lanceur s’inflige Annulation (y compris sur son Immunité) et gagne 7,5% de Régénération (15s) pour chaque effet positif ainsi dissipé."
  },
  "Foudre divine": {
    "categorie": "lumineux",
    "role": "agression",
    "distance": true,
    "auToucher": [
      {
        "statut": "etourdissement",
        "chance": 0.65
      }
    ],
    "description": "Attaque à distance, 65% de chances d’étourdissement."
  },
  "Châtiment céleste": {
    "categorie": "lumineux",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "etourdissement",
        "chance": 0.25
      },
      {
        "statut": "brulure",
        "chance": 0.5,
        "cumuls": 1
      }
    ],
    "description": "Attaque de zone, 25% d’étourdissement, 50% de Brûlure."
  },
  "Grâce sacrée": {
    "categorie": "lumineux",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "purification",
        "chance": 1,
        "cible": "soi"
      },
      {
        "statut": "immunite",
        "chance": 1,
        "duree": 20,
        "cible": "soi"
      }
    ],
    "description": "Retire tous les effets négatifs actifs et applique Immunité (20s) sur soi."
  },
  "Lumière aveuglante": {
    "categorie": "lumineux",
    "role": "agression",
    "sansDegats": true,
    "zone": true,
    "aLancer": [
      {
        "statut": "etourdissement",
        "chance": 1,
        "cible": "adversaire"
      }
    ],
    "description": "Sans dégât, en zone : inflige Étourdissement."
  },
  "Arc éthéré foudroyant": {
    "categorie": "ethere",
    "role": "agression",
    "distance": true,
    "rebond": true,
    "auToucher": [
      {
        "statut": "etourdissement",
        "chance": 0.1
      }
    ],
    "description": "Attaque à distance, 10% d’étourdissement ; 75% de chances de rebondir sur une autre cible, 25% de rebondir une 2e fois (revient sur la première cible s’il n’y a que 2 ennemis)."
  },
  "Lame magique venteuse": {
    "categorie": "ethere",
    "role": "agression",
    "distance": true,
    "percage": 0.6,
    "description": "Attaque à distance perçant 60% de la résistance adverse."
  },
  "Distorsion spatio-temporelle": {
    "categorie": "ethere",
    "role": "agression",
    "sansDegats": true,
    "distance": true,
    "aLancer": [
      {
        "statut": "ralentissement",
        "chance": 1,
        "duree": 10,
        "cible": "adversaire"
      },
      {
        "statut": "rapidite",
        "chance": 1,
        "duree": 10,
        "cible": "soi"
      }
    ],
    "description": "Applique Ralentissement à l’adversaire et Rapidité sur soi."
  },
  "Nova éthérée": {
    "categorie": "ethere",
    "role": "agression",
    "zone": true,
    "auToucher": [
      {
        "statut": "terreur",
        "chance": 0.2
      },
      {
        "statut": "empoisonnement",
        "chance": 0.2
      },
      {
        "statut": "brulure",
        "chance": 0.2,
        "cumuls": 1
      },
      {
        "statut": "saignement",
        "chance": 0.2
      }
    ],
    "description": "Attaque de zone, 20% de Terreur, 20% d’Empoisonnement, 20% de Brûlure, 20% de Saignement."
  }
};

/** Enfant (code de lignée : lettre de la graine, D = sombre, N / DN = neutre). */
export const POOL_ENFANT: Record<string, string[]> = {
  "J": [
    "Second souffle",
    "Rayon sacré"
  ],
  "W": [
    "Poing incandescent",
    "Coup brutal"
  ],
  "S": [
    "Vague apaisante",
    "Jet haute pression"
  ],
  "F": [
    "Sphère spectrale",
    "Voile fantomatique"
  ],
  "D": [
    "Spore toxique",
    "Peau corrosive"
  ],
  "N": [
    "Résonance arcanique",
    "Barrière magique"
  ],
  "DJ": [
    "Déchirure",
    "Regard funeste"
  ],
  "DW": [
    "Coup brutal",
    "Onde de choc"
  ],
  "DS": [
    "Absorption vitale",
    "Brume engouffrante"
  ],
  "DF": [
    "Étreinte sombre",
    "Abîme"
  ],
  "DD": [
    "Peau corrosive",
    "Absorption vitale"
  ],
  "DN": [
    "Déchirure",
    "Regard funeste"
  ]
};
/** Adolescent (et Adulte « normal » dans le jeu du prototype). */
export const POOL_ADOLESCENT: Record<string, string[]> = {
  "J": [
    "Second souffle",
    "Rayon sacré",
    "Lame de l'aube",
    "Onde de choc"
  ],
  "W": [
    "Poing incandescent",
    "Coup brutal",
    "Vague solaire",
    "Onde de choc"
  ],
  "S": [
    "Vague apaisante",
    "Jet haute pression",
    "Barrière magique",
    "Tourbillon"
  ],
  "F": [
    "Sphère spectrale",
    "Voile fantomatique",
    "Résonance arcanique",
    "Vague apaisante"
  ],
  "D": [
    "Spore toxique",
    "Peau corrosive",
    "Brume engouffrante",
    "Orbe de mana"
  ],
  "N": [
    "Résonance arcanique",
    "Barrière magique",
    "Lame de l'aube",
    "Poing incandescent"
  ],
  "DJ": [
    "Déchirure",
    "Regard funeste",
    "Morsure venimeuse",
    "Cri des âmes"
  ],
  "DW": [
    "Coup brutal",
    "Onde de choc",
    "Poing incandescent",
    "Abîme"
  ],
  "DS": [
    "Absorption vitale",
    "Brume engouffrante",
    "Peau corrosive",
    "Anticorps"
  ],
  "DF": [
    "Étreinte sombre",
    "Abîme",
    "Malédiction",
    "Absorption vitale"
  ],
  "DD": [
    "Peau corrosive",
    "Absorption vitale",
    "Étreinte sombre",
    "Regard funeste"
  ],
  "DN": [
    "Déchirure",
    "Regard funeste",
    "Absorption vitale",
    "Résonance arcanique"
  ]
};
export const POOL_FRAGMENT: Record<string, string[]> = {
  "PM+": [
    "Coup brutal",
    "Déchirure",
    "Onde de choc",
    "Morsure venimeuse",
    "Absorption vitale",
    "Cri des âmes"
  ],
  "C+": [
    "Orbe de mana",
    "Éclat éthéré",
    "Sanctuaire",
    "Rayon sacré",
    "Vague solaire",
    "Malédiction"
  ],
  "SA+": [
    "Second souffle",
    "Barrière magique",
    "Protection impénétrable",
    "Vague apaisante",
    "Anticorps",
    "Rayon sacré"
  ]
};
export const POOL_BRANCHE: Record<string, string[]> = {
  "J-DD": [
    "Lame de l'aube",
    "Peau corrosive",
    "Étreinte sombre",
    "Coup brutal",
    "Résonance arcanique"
  ],
  "W-DJ": [
    "Coup brutal",
    "Déchirure",
    "Morsure venimeuse",
    "Souffle enflammé",
    "Regard funeste"
  ],
  "F-DW": [
    "Sphère spectrale",
    "Protection impénétrable",
    "Éclat éthéré",
    "Tourbillon",
    "Vague solaire"
  ],
  "S-DF": [
    "Voile fantomatique",
    "Orbe de mana",
    "Brume engouffrante",
    "Absorption vitale",
    "Jet haute pression"
  ],
  "D-DS": [
    "Morsure venimeuse",
    "Coup brutal",
    "Abîme",
    "Éclat éthéré",
    "Peau corrosive"
  ],
  "J-DS": [
    "Brume engouffrante",
    "Morsure venimeuse",
    "Résonance arcanique",
    "Déchirure"
  ],
  "W-DD": [
    "Vague solaire",
    "Spore toxique",
    "Protection impénétrable",
    "Vague apaisante"
  ],
  "F-DJ": [
    "Sphère spectrale",
    "Malédiction",
    "Orbe de mana",
    "Morsure venimeuse"
  ],
  "S-DW": [
    "Tourbillon",
    "Jet haute pression",
    "Souffle enflammé",
    "Boule de feu"
  ],
  "D-DF": [
    "Spore toxique",
    "Peau corrosive",
    "Abîme",
    "Étreinte sombre"
  ],
  "N-DN": [
    "Déchirure",
    "Morsure venimeuse",
    "Lame de l'aube",
    "Souffle enflammé",
    "Absorption vitale"
  ]
};
/** Pools adultes : utilisés seulement par le mode Arène du prototype. */
export const POOL_ADULTE: Record<string, string[]> = {
  "J": [
    "Second souffle",
    "Rayon sacré",
    "Lame de l'aube",
    "Châtiment céleste",
    "Coup brutal",
    "Projection",
    "Grâce sacrée",
    "Protection impénétrable"
  ],
  "DJ": [
    "Déchirure",
    "Regard funeste",
    "Morsure venimeuse",
    "Cri des âmes",
    "Tempête des damnés",
    "Ombre rassurante",
    "Lame de l'aube",
    "Projection"
  ],
  "W": [
    "Poing incandescent",
    "Coup brutal",
    "Vague solaire",
    "Onde de choc",
    "Fracas Tellurique",
    "Motivation inébranlable",
    "Météore",
    "Carapace minérale"
  ],
  "DW": [
    "Coup brutal",
    "Onde de choc",
    "Poing incandescent",
    "Abîme",
    "Flamme noire",
    "Malédiction",
    "Pluie de cendres",
    "Météore"
  ],
  "D": [
    "Spore toxique",
    "Peau corrosive",
    "Brume engouffrante",
    "Anticorps",
    "Odeur pestilentielle",
    "Projection",
    "Sanctuaire",
    "Rayon sacré"
  ],
  "DD": [
    "Peau corrosive",
    "Absorption vitale",
    "Étreinte sombre",
    "Brume engouffrante",
    "Miasmes des ténèbres",
    "Odeur pestilentielle",
    "Possession malsaine",
    "Éruption fongique"
  ],
  "S": [
    "Vague apaisante",
    "Jet haute pression",
    "Tourbillon",
    "Barrière magique",
    "Courant ascendant",
    "Lame magique venteuse",
    "Éclat éthéré",
    "Grâce sacrée",
    "Sanctuaire"
  ],
  "DS": [
    "Absorption vitale",
    "Brume engouffrante",
    "Peau corrosive",
    "Odeur pestilentielle",
    "Courant ascendant",
    "Vase poisseuse",
    "Miasmes des ténèbres",
    "Offrande"
  ],
  "F": [
    "Sphère spectrale",
    "Voile fantomatique",
    "Ombre rassurante",
    "Sanctuaire",
    "Grâce sacrée",
    "Protection impénétrable",
    "Tempête des damnés",
    "Lame de l'aube"
  ],
  "DF": [
    "Étreinte sombre",
    "Abîme",
    "Malédiction",
    "Flamme noire",
    "Miasmes des ténèbres",
    "Pacte maléfique",
    "Foudre ombrageuse"
  ],
  "N": [
    "Résonance arcanique",
    "Déchirure",
    "Lame de l'aube",
    "Poing incandescent",
    "Courant ascendant",
    "Foudre divine",
    "Arc éthéré foudroyant",
    "Projection"
  ],
  "DN": [
    "Coup brutal",
    "Regard funeste",
    "Absorption vitale",
    "Pacte maléfique",
    "Lame magique venteuse",
    "Flamme noire",
    "Morsure venimeuse",
    "Sphère spectrale"
  ]
};
export const POOL_BRANCHE_ADULTE: Record<string, string[]> = {
  "S-DF": [
    "Voile fantomatique",
    "Orbe de mana",
    "Vase poisseuse",
    "Absorption vitale",
    "Jet haute pression",
    "Tempête des damnés",
    "Miasmes des ténèbres",
    "Tourbillon"
  ],
  "J-DD": [
    "Lame de l'aube",
    "Déchirure",
    "Peau corrosive",
    "Étreinte sombre",
    "Anticorps",
    "Odeur pestilentielle",
    "Possession malsaine",
    "Protection impénétrable"
  ],
  "F-DW": [
    "Sphère spectrale",
    "Carapace minérale",
    "Éclat éthéré",
    "Flamme noire",
    "Vague solaire",
    "Pluie de cendres",
    "Fournaise interne",
    "Tempête des damnés"
  ],
  "W-DJ": [
    "Coup brutal",
    "Déchirure",
    "Pluie de cendres",
    "Protection impénétrable",
    "Regard funeste",
    "Châtiment céleste",
    "Motivation inébranlable",
    "Onde de choc"
  ],
  "D-DS": [
    "Vase poisseuse",
    "Anticorps",
    "Peau corrosive",
    "Miasmes des ténèbres",
    "Éclat éthéré",
    "Déchirure",
    "Morsure venimeuse",
    "Étreinte sombre"
  ],
  "J-DS": [
    "Déchirure",
    "Morsure venimeuse",
    "Vase poisseuse",
    "Regard funeste",
    "Châtiment céleste",
    "Rayon sacré",
    "Lumière aveuglante",
    "Second souffle"
  ],
  "W-DD": [
    "Coup brutal",
    "Fracas Tellurique",
    "Carapace minérale",
    "Vague solaire",
    "Miasmes des ténèbres",
    "Peau corrosive",
    "Étreinte sombre",
    "Vase poisseuse"
  ],
  "F-DJ": [
    "Déchirure",
    "Possession malsaine",
    "Étreinte sombre",
    "Tempête des damnés",
    "Malédiction",
    "Flamme noire",
    "Arc éthéré foudroyant",
    "Nova éthérée"
  ],
  "S-DW": [
    "Projection",
    "Jet haute pression",
    "Vague apaisante",
    "Intense vapeur",
    "Souffle enflammé",
    "Coup brutal",
    "Météore",
    "Fournaise interne"
  ],
  "D-DF": [
    "Cri des âmes",
    "Peau corrosive",
    "Spore toxique",
    "Odeur pestilentielle",
    "Miasmes des ténèbres",
    "Nova éthérée",
    "Morsure venimeuse",
    "Anticorps"
  ],
  "N-DN": [
    "Déchirure",
    "Motivation inébranlable",
    "Voile fantomatique",
    "Lame de l'aube",
    "Flamme noire",
    "Arc éthéré foudroyant",
    "Ombre rassurante",
    "Ouragan"
  ]
};
export const POOL_MELEE: Record<string, string[]> = {
  "JWF": [
    "Déchirure",
    "Bourrasque fracassante",
    "Foudre ombrageuse",
    "Souffle enflammé",
    "Boule de feu",
    "Flamme noire",
    "Sanctuaire",
    "Résonance arcanique"
  ],
  "WFS": [
    "Déchirure",
    "Projection",
    "Étreinte sombre",
    "Tempête des damnés",
    "Carapace minérale",
    "Jet haute pression",
    "Courant ascendant",
    "Vague solaire"
  ],
  "FSD": [
    "Voile fantomatique",
    "Possession malsaine",
    "Odeur pestilentielle",
    "Brume engouffrante",
    "Vase poisseuse",
    "Miasmes des ténèbres",
    "Absorption vitale",
    "Éruption fongique"
  ],
  "SDJ": [
    "Onde de choc",
    "Carapace minérale",
    "Frappe de ronces",
    "Vague apaisante",
    "Tourbillon",
    "Courant ascendant",
    "Barrière magique",
    "Orbe de mana"
  ],
  "DJW": [
    "Déchirure",
    "Fracas Tellurique",
    "Projection",
    "Motivation inébranlable",
    "Morsure venimeuse",
    "Odeur pestilentielle",
    "Lumière aveuglante",
    "Poing incandescent"
  ],
  "JFD": [
    "Bourrasque fracassante",
    "Tempête des damnés",
    "Ombre rassurante",
    "Cri des âmes",
    "Spore toxique",
    "Peau corrosive",
    "Anticorps",
    "Lame magique venteuse"
  ],
  "JFS": [
    "Motivation inébranlable",
    "Foudre ombrageuse",
    "Brume engouffrante",
    "Ouragan",
    "Vague apaisante",
    "Lumière aveuglante",
    "Sanctuaire",
    "Rayon sacré"
  ],
  "JWS": [
    "Second souffle",
    "Brume engouffrante",
    "Tourbillon",
    "Ouragan",
    "Intense vapeur",
    "Explosion volcanique",
    "Fournaise interne",
    "Nova éthérée"
  ],
  "WFD": [
    "Déchirure",
    "Fracas Tellurique",
    "Foudre ombrageuse",
    "Possession malsaine",
    "Étreinte sombre",
    "Carapace minérale",
    "Flamme noire",
    "Abîme"
  ],
  "WSD": [
    "Morsure venimeuse",
    "Spore toxique",
    "Éruption fongique",
    "Anticorps",
    "Peau corrosive",
    "Jet haute pression",
    "Intense vapeur",
    "Miasmes des ténèbres"
  ]
};
export const POOL_MEMOIRE: Record<string, string[]> = {
  "joy": [
    "Déchirure",
    "Bourrasque fracassante",
    "Ouragan",
    "Courant ascendant",
    "Lame magique venteuse",
    "Résonance arcanique",
    "Second souffle",
    "Tempête des damnés"
  ],
  "wrath": [
    "Poing incandescent",
    "Souffle enflammé",
    "Vague solaire",
    "Fournaise interne",
    "Explosion volcanique",
    "Boule de feu",
    "Pluie de cendres",
    "Météore"
  ],
  "fear": [
    "Foudre ombrageuse",
    "Tempête des damnés",
    "Foudre divine",
    "Arc éthéré foudroyant",
    "Lumière aveuglante",
    "Barrière magique",
    "Cri des âmes",
    "Ombre rassurante"
  ],
  "sorrow": [
    "Vague apaisante",
    "Brume engouffrante",
    "Tourbillon",
    "Jet haute pression",
    "Ouragan",
    "Courant ascendant",
    "Vase poisseuse",
    "Intense vapeur"
  ],
  "disgust": [
    "Fracas Tellurique",
    "Onde de choc",
    "Éruption fongique",
    "Carapace minérale",
    "Spore toxique",
    "Météore",
    "Frappe de ronces"
  ],
  "neutral": [
    "Barrière magique",
    "Résonance arcanique",
    "Éclat éthéré",
    "Orbe de mana",
    "Arc éthéré foudroyant",
    "Lame magique venteuse",
    "Distorsion spatio-temporelle",
    "Nova éthérée"
  ]
};
