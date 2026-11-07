"""Usage : python3 outils/maquettes/exploration/construire.py
Construit src/jeu/exploration/VueExploration.tsx et src/jeu/exploration/exploration.css depuis la maquette
« Exploration » (page v12 du canevas) : exploration.tpl.html (gabarit DC) et exploration.css (sa feuille de style)."""
import os, re, sys

ICI = os.path.dirname(os.path.abspath(__file__)) + '/'
sys.path.insert(0, os.path.normpath(ICI + '../ranch'))
from dc2jsx import convertir  # noqa: E402

DEST = os.path.normpath(os.path.join(ICI, '../../../src/jeu/exploration')) + '/'
PORTEE = 'ex12'


def rep(s, a, b, n=1):
    assert a in s, a[:90]
    return s.replace(a, b, n)


t = open(ICI + 'exploration.tpl.html').read()
# l'écho : son image et son nom (la maquette montrait Filo)
t = rep(t, '<img src="{{ filo.src }}" alt="Filo"', '<img src="{{ filo.src }}" alt="{{ echoNom }}"')
t = rep(t, '<img src="/_blob/f4e24910f42142c8fea4d63b7da610fd" alt="Filo">', '<img src="{{ tente.echo }}" alt="{{ echoNom }}">')
t = rep(t, '<div class="main">Filo fouine dans les fourrés…</div>', '<div class="main">{{ envoiFouineTexte }}</div>')
t = rep(t, '>Merci, Filo</button>', '>{{ merciTexte }}</button>')
# le combat se joue sur l'écran de combat : la page ne fait que l'annoncer
t = rep(t, '''          <div class="ligne">Le combat s’engage sur l’écran de combat « exploration » (planche voisine), au son d’Early Game Battle.</div>
          <div class="aparte">Pour la maquette, choisissez l’issue :</div>
          <div class="boutons"><button class="btn bois" onClick="{{ perdre }}">Filo est battu</button><button class="btn" onClick="{{ gagner }}">Filo l’emporte</button></div>''',
        '''          <div class="ligne">{{ rencontre.engage }}</div>''')
# la page de retour mène au ranch (la maquette repartait explorer)
t = rep(t, '<button class="btn" onClick="{{ repartir }}">Repartir explorer</button>', '<button class="btn" onClick="{{ repartir }}">{{ finBouton }}</button>')
reste = re.findall(r'/_blob/\w+|Filo', re.sub(r'<!--.*?-->', '', t, flags=re.S))
assert not reste, reste

jsx = convertir(t)
jsx = re.sub(r'disabled=\{([^}]+)\}', r'disabled={!!(\1)}', jsx)

entete = '''// Vue de l'exploration : générée depuis la maquette « Exploration » (page v12 du canevas), sans logique.
// Ne pas modifier à la main : outils/maquettes/exploration/construire.py la produit ; la logique vit dans Exploration.tsx,
// qui calcule les valeurs `v`.
/* eslint-disable */
import { Fragment, type CSSProperties } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VueExploration({ v }: { v: any }) {
  return (
    <div className="''' + PORTEE + '''">
'''
open(DEST + 'VueExploration.tsx', 'w').write(entete + jsx + '    </div>\n  );\n}\n')


# ——— feuille de style : portée sous .ex12, animations renommées
def porter_css(css, portee):
    noms = set(re.findall(r'@keyframes\s+([\w-]+)', css))
    nouveau = lambda n: portee + n[0].upper() + n[1:]
    regles, i = [], 0
    while i < len(css):
        j = css.find('{', i)
        if j < 0:
            break
        brut = css[i:j]
        coms = re.findall(r'/\*.*?\*/', brut, re.S)
        sel = re.sub(r'/\*.*?\*/', '', brut, flags=re.S).strip()
        regles.extend(coms)
        if sel.startswith('@'):
            assert sel.startswith('@keyframes'), sel
            d, k = 0, j
            while True:
                if css[k] == '{':
                    d += 1
                elif css[k] == '}':
                    d -= 1
                    if d == 0:
                        break
                k += 1
            n = sel.split()[1]
            regles.append('@keyframes ' + nouveau(n) + css[j:k + 1])
            i = k + 1
            continue
        k = css.find('}', j)
        corps = css[j:k + 1]
        if sel in ('body', 'html', 'html,body', 'body,html', '*'):
            i = k + 1
            continue
        sels = ['.' + portee + ' ' + s.strip() for s in sel.split(',') if s.strip()]

        def ren(m):
            valeur = m.group(2)
            for n in sorted(noms, key=len, reverse=True):
                valeur = re.sub(r'(?<![\w-])' + re.escape(n) + r'(?![\w-])', nouveau(n), valeur)
            return m.group(1) + valeur
        corps = re.sub(r'(animation(?:-name)?\s*:)([^;}]*)', ren, corps)
        regles.append(','.join(sels) + corps)
        i = k + 1
    return '\n'.join(regles)


css = open(ICI + 'exploration.css').read()
assert '/_blob/' not in css
sortie = porter_css(css, PORTEE)
# retouches propres au jeu : le cadre ne doit pas hériter des styles globaux des boutons
sortie += '\n.' + PORTEE + ' button:focus-visible{outline:2px solid #f3d48a;outline-offset:2px}\n'
open(DEST + 'exploration.css', 'w').write('/* Exploration (maquette v12 du canevas), portée sous .' + PORTEE + ' — généré par outils/maquettes/exploration/construire.py, ne pas modifier à la main. */\n' + sortie)
print('ok', len(jsx), len(sortie))
