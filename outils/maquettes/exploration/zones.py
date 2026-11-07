"""Usage : python3 outils/maquettes/exploration/zones.py
Écrit src/jeu/exploration/zones.ts depuis les données de la maquette « Exploration » (v12),
elles-mêmes extraites du prototype (zones, chemins, pools de fouille, d'envoi et de pêche, échos sauvages)."""
import glob, json, os, re

ICI = os.path.dirname(os.path.abspath(__file__)) + '/'
RACINE = os.path.normpath(ICI + '../../..') + '/'
src = open(ICI + 'donnees-maquette.js').read()
ZONES = json.loads(re.search(r'const ZONES = (.*?);\n', src).group(1))


def fond(numero):
    # le décor du lieu : public/assets/decors/exploration/NN-*.png (pas la variante « bis »)
    f = [p for p in glob.glob(RACINE + f'public/assets/decors/exploration/{int(numero):02d}-*.png') if 'bis-' not in p]
    assert len(f) == 1, (numero, f)
    return 'decors/exploration/' + os.path.basename(f[0])


lignes = []
for k in sorted(ZONES, key=int):
    z = dict(ZONES[k])
    z['fond'] = fond(k)
    ordre = ['nom', 'fond', 'region', 'eau', 'grotte', 'carte', 'filo', 'sauvage', 'echo', 'rareFouille', 'rareEnvoi', 'chemins', 'fouille', 'envoi', 'poissons']
    z = {c: z[c] for c in ordre if c in z}
    corps = json.dumps(z, ensure_ascii=False, separators=(', ', ': '))
    lignes.append(f'  {int(k)}: {corps},')

entete = '''// Les 34 lieux d'exploration (repris du prototype via la maquette « Exploration » v12) :
// décor, région, eau, caverne, position sur la carte illustrée (pixels de carte.png), place de l'écho et de l'écho sauvage
// dans le décor, chemins (et position de leur flèche), pools de fouille / d'envoi / de pêche, écho sauvage du lieu.
// Généré par outils/maquettes/exploration/zones.py ; on peut ensuite retoucher à la main.

export type Region = 'foret' | 'lac' | 'montagne' | 'caverne';
export type Cote = 'left' | 'right' | 'center' | 'center-top-left' | 'top-left';
export interface Chemin { cote: Cote; vers: number | null; texte: string; pos: [number, number] }
export interface Zone {
  nom: string;
  /** Décor (chemin dans public/assets). */
  fond: string;
  region: Region;
  eau: boolean;
  grotte: boolean;
  /** Position sur l'illustration de la carte (pixels de carte.png, 1586 × 992). */
  carte: [number, number];
  /** Place de l'écho dans le décor (repère 1280 × 800) et celle d'un écho sauvage. */
  filo: [number, number];
  sauvage: [number, number];
  /** Écho sauvage du lieu : âge (jours) et graines possibles (vide : toutes). Absent : aucune rencontre. */
  echo?: { ageMin: number; ageMax: number; cles: string[] };
  rareFouille?: { id: string; chance: number };
  rareEnvoi?: { id: string; chance: number };
  chemins: Chemin[];
  fouille: string[];
  envoi: string[];
  poissons: string[];
}

export const ZONES: Record<number, Zone> = {
'''
open(RACINE + 'src/jeu/exploration/zones.ts', 'w').write(entete + '\n'.join(lignes) + '\n};\n\n/** Lieu de départ (Sortie du village). */\nexport const DEPART = 1;\n')
print('ok', len(lignes))
