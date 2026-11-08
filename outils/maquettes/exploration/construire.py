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
# le sac et le carnet sont ceux du ranch (src/jeu/commun/InterfaceRanch.tsx), posés par Exploration.tsx par-dessus la vue
t = re.sub(r'\n  <button class="cote \{\{ coteCls \}\}" style="top:128px" onClick="\{\{ ouvrirSac \}\}".*?</button>\n', '\n', t, count=1, flags=re.S)
t = re.sub(r'\n  <!-- Le sac ouvert : 10 emplacements -->\n  <sc-if value="\{\{sacVisible\}\}".*?\n  </sc-if>\n', '\n', t, count=1, flags=re.S)
assert 'ouvrirSac' not in t and 'sacVisible' not in t
t = rep(t, '<!-- la carte et le sac -->', '<!-- la carte (le sac et le carnet : InterfaceRanch) -->')
# la carte : plus de cadre ni de punaises ; l'illustration aux bords déchirés et brunis, posée de travers,
# et le repère (public/assets/interface/icones/repere.png) pour la position actuelle
t = rep(t, """      <i class="punaise" style="left:18px;top:-6px"></i><i class="punaise" style="right:18px;top:-6px"></i><i class="punaise" style="left:18px;top:auto;bottom:-8px"></i><i class="punaise" style="right:18px;top:auto;bottom:-8px"></i>
""", '')
t = rep(t, """          </mask>
        </defs>
        <image href="{{ carte.image }}\"""", """          </mask>
          <filter id="dechire" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="3" seed="11" result="bruit"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="bruit" scale="30" xChannelSelector="R" yChannelSelector="G" result="bord"></feDisplacementMap><feGaussianBlur in="bord" stdDeviation="2.2"></feGaussianBlur></filter>
          <mask id="papier" maskUnits="userSpaceOnUse" x="0" y="0" width="1586" height="992"><rect x="40" y="36" width="1506" height="920" rx="10" fill="#fff" filter="url(#dechire)"></rect></mask>
          <radialGradient id="bruni" cx="50%" cy="50%" r="72%"><stop offset=".62" stop-color="#8a5a2a" stop-opacity="0"></stop><stop offset=".9" stop-color="#7a4a1e" stop-opacity=".38"></stop><stop offset="1" stop-color="#4a2a10" stop-opacity=".7"></stop></radialGradient>
          <filter id="ombrePin" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="3" dy="5" stdDeviation="3" flood-color="#1a0d05" flood-opacity=".55"></feDropShadow></filter>
        </defs>
        <g mask="url(#papier)">
        <rect class="dessous" x="0" y="0" width="1586" height="992" fill="#e9d9b2"></rect>
        <image href="{{ carte.image }}\"""")
t = rep(t, """mask="url(#brume)"></image>
""", """mask="url(#brume)"></image>
        <rect class="bruni" x="0" y="0" width="1586" height="992" fill="url(#bruni)"></rect>
        </g>
""")
t = re.sub(r'<g class="epingle" transform="translate\(\{\{ carte\.piqueX \}\},\{\{ carte\.piqueY \}\}\)">.*?</g></g>|<g class="epingle" transform="translate\(\{\{ carte\.piqueX \}\},\{\{ carte\.piqueY \}\}\)">.*?</g>',
           '<g transform="translate({{ carte.piqueX }},{{ carte.piqueY }})"><circle class="onde" r="18"></circle><g class="epingle"><ellipse cx="2" cy="1" rx="14" ry="5" fill="rgba(30,14,4,.45)"></ellipse><image href="{{ carte.repere }}" x="-30" y="-86" width="60" height="88" filter="url(#ombrePin)"></image></g></g>',
           t, count=1, flags=re.S)
assert 'carte.repere' in t
reste = re.findall(r'/_blob/\w+|Filo', re.sub(r'<!--.*?-->', '', t, flags=re.S))
assert not reste, reste

jsx = convertir(t)
jsx = re.sub(r'disabled=\{([^}]+)\}', r'disabled={!!(\1)}', jsx)
# attributs SVG que le convertisseur ne connaît pas (filtres de la carte)
for x, y in [('xchannelselector', 'xChannelSelector'), ('ychannelselector', 'yChannelSelector'), ('<fedropshadow', '<feDropShadow'),
             ('flood-color', 'floodColor'), ('flood-opacity', 'floodOpacity')]:
    jsx = jsx.replace(x, y)

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
# l'interface (page du carnet en haut à gauche, bouton de la carte, gestes de terrain) passe devant tout ce qui est
# dans le décor : PNJ (29–31), l'écho (30), l'écho sauvage (31–32), les fourrés (40) — un grand PNJ (Morthen…) passe dessous ;
# elle reste sous les pages, voiles et bannières (50 et plus) et sous le sac et le carnet du ranch (calque à 70)
sortie += '.' + PORTEE + ' .carnet,.' + PORTEE + ' .cote,.' + PORTEE + ' .gestes{z-index:45}\n'
# la carte : sans cadre, l'illustration aux bords déchirés flotte au-dessus du décor, un peu de travers
sortie += '\n'.join('.' + PORTEE + ' ' + r for r in [
    '.carte{padding:0;background:none;box-shadow:none;transform:rotate(-.7deg);animation-name:' + PORTEE + 'CarteIn}',
    '.carte svg.plan{width:1080px;height:676px;border-radius:0;box-shadow:none;overflow:visible;filter:drop-shadow(0 4px 2px rgba(20,10,4,.45)) drop-shadow(0 22px 26px rgba(0,0,0,.5))}',
    '.plan .bruni{mix-blend-mode:multiply;pointer-events:none}',
    '.plan .onde{fill:none;stroke:#fdf0c8;stroke-width:4;transform-box:fill-box;transform-origin:center;animation:' + PORTEE + 'Onde 2.2s ease-out infinite}',
    '.plan .lieu.ici .point{opacity:0}',
    '.plan .lieu.ici .nom{transform:translateY(-74px)}',
    '.carte .cartouche{left:46px;top:30px;transform:rotate(-2.5deg)}',
    '.carte .fermer{right:6px;top:4px}',
]) + '\n'
sortie += '@keyframes ' + PORTEE + 'CarteIn{from{opacity:0;transform:translateY(40px) rotate(2deg) scale(.96)}to{opacity:1;transform:rotate(-.7deg)}}\n'
sortie += '@keyframes ' + PORTEE + 'Onde{from{transform:scale(.4);opacity:.95}to{transform:scale(2.6);opacity:0}}\n'
open(DEST + 'exploration.css', 'w').write('/* Exploration (maquette v12 du canevas), portée sous .' + PORTEE + ' — généré par outils/maquettes/exploration/construire.py, ne pas modifier à la main. */\n' + sortie)
print('ok', len(jsx), len(sortie))
