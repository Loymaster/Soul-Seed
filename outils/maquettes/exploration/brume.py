"""Usage : python3 outils/maquettes/exploration/brume.py
Produit public/assets/decors/exploration/carte-brume.webp : la brume qui voile la carte là où l'on n'est pas encore allé.
C'est la carte elle-même, floutée et désaturée, fondue dans un papier #e8d6ae (72 % de papier, 28 % de carte grise) :
on devine encore les reliefs sous la brume, comme dans la maquette « Exploration » (v12)."""
import os
from PIL import Image, ImageFilter, ImageOps

ICI = os.path.dirname(os.path.abspath(__file__)) + '/'
DOSSIER = os.path.normpath(ICI + '../../../public/assets/decors/exploration') + '/'
PAPIER = (0xe8, 0xd6, 0xae)
FLOU = 14         # rayon du flou gaussien (pixels de carte.png)
OPACITE = 0.72    # part du papier : 1 = papier uni, 0 = carte grise


def brume(carte: Image.Image) -> Image.Image:
    gris = ImageOps.grayscale(carte.convert('RGB')).filter(ImageFilter.GaussianBlur(FLOU))
    papier = Image.new('RGB', carte.size, PAPIER)
    return Image.blend(Image.merge('RGB', (gris, gris, gris)), papier, OPACITE)


if __name__ == '__main__':
    carte = Image.open(DOSSIER + 'carte.png')
    brume(carte).save(DOSSIER + 'carte-brume.webp', 'WEBP', quality=82, method=6)
    print('ok', carte.size)
