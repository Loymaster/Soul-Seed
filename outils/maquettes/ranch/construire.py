"""Usage : python3 outils/maquettes/ranch/construire.py
Construit src/jeu/ranch/VueRanch.tsx et src/jeu/ranch/ranch.css depuis la maquette Ranch (v7) du canevas."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dc2jsx import convertir

ICI = os.path.dirname(os.path.abspath(__file__)) + '/'
DEST = os.path.normpath(os.path.join(ICI, '../../../src/jeu/ranch')) + '/'
BLOBS = {
    '2398cecaed2a55a74683a50d22d03e26': 'decors/ranch/lune.webp',
    '29c60c8a4814c2232415e72d1e3a13ef': 'decors/ranch/nuage-g1.webp',
    '2b17b63a12dfa72e721b441966265fed': 'decors/ranch/nuage-g0.webp',
    '2b3267551d89886cf5af0f040dfe7616': 'decors/ranch/nuage-g4.webp',
    'bc1b52e4f31c2453bfe4013a32695589': 'decors/ranch/nuage-g2.webp',
    '822b4aead1fc85c03a76d1d98e74762b': 'decors/ranch/nuage-g3.webp',
    'b370cf1a8e67bc3196d1612f0b066688': 'decors/ranch/nuage-b1.webp',
    '3bf241580093ba46f48588e542976f6d': 'activites/corvees/seau-eau.png',
    '7cbeae08f85b693b67dbe25d3c1e76c5': 'decors/ranch/lumiere-lanternes-masque.png',
    '7e734709d88f2f42d9865f2d1187538f': 'decors/ranch/detoure.webp',
    '910ee20837acbf6019a36f7178c4a264': 'interface/etats/orbite/comportement.webp',
    'd51ed0b456413f23fdb3dfe427014aed': 'activites/ranch/dejection-detouree.webp',
    'c3f5075502a1a64bf8993b45b212f8af': 'decors/ranch/exterieur.jpg',
    'e2b2e39673f2671a41181eb33d64e818': 'decors/ranch/ciel-etoile.jpg',
}


def rep(s, a, b, n=1):
    assert a in s, a[:80]
    return s.replace(a, b, n)


t = open(ICI + 'ranch.tpl.html').read()
# l'écho : son image, son nom
t = t.replace('src="/_blob/f4e24910f42142c8fea4d63b7da610fd"', 'src="{{echoImg}}"')
t = rep(t, 'alt="Filo, écho Enfant de la lignée Colère"', 'alt="{{echoAlt}}"')
t = rep(t, 'aria-label="Caresser Filo"', 'aria-label="{{caresserAria}}"')
t = rep(t, 'aria-label="Filo a fait quelque chose : ouvrir le carnet"', 'aria-label="{{evtAria}}"')
t = rep(t, 'alt="Filo"', 'alt="{{echoNom}}"')
# mémoire des échos
t = rep(t, '<div style="font-family:\'Alegreya SC\',serif;font-weight:700;font-size:16px;letter-spacing:2px">Filo</div><div style="font-size:15px;color:#6b4f33">Enfant · lignée Colère · jour 4</div>',
        '<div style="font-family:\'Alegreya SC\',serif;font-weight:700;font-size:16px;letter-spacing:2px">{{echoNom}}</div><div style="font-size:15px;color:#6b4f33">{{memoireDetail}}</div>')
# journal : les vraies entrées
m = re.search(r'(<sc-if value="\{\{pJournal\}\}" hint-placeholder-val="\{\{ false \}\}">)(.*?)(</sc-if>)', t, re.S)
t = t[:m.start(2)] + '''
                <sc-for list="{{journalJours}}" as="jj" hint-placeholder-count="1">
                  <div style="font-family:'Reenie Beanie',cursive;font-size:30px;line-height:1;color:#3a2a1c;margin:6px 0 6px">{{jj.titre}}</div>
                  <sc-for list="{{jj.lignes}}" as="j" hint-placeholder-count="3">
                    <div style="display:flex;gap:12px;font-size:16px;line-height:24px;margin-bottom:6px"><span style="flex:none;width:46px;font-family:'Alegreya SC',serif;font-size:13px;color:#9a7b55">{{j.heure}}</span><span>{{j.texte}}</span></div>
                  </sc-for>
                </sc-for>
              ''' + t[m.end(2):]
# options : retour au menu, volumes
t = rep(t, '<button style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border:none;border-radius:6px;background:transparent;color:#6e3f22;',
        '<button onClick="{{retourMenu}}" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border:none;border-radius:6px;background:transparent;color:#6e3f22;')
t = rep(t, '''<label style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:17px;cursor:pointer"><span>{{g.nom}}</span><input type="checkbox" checked="{{g.actif}}" onChange="{{g.basculer}}" style="width:22px;height:22px;accent-color:#6e3f22"></label>
                    </sc-for>''', '''<label style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:17px;cursor:pointer"><span>{{g.nom}}</span><input type="checkbox" checked="{{g.actif}}" onChange="{{g.basculer}}" style="width:22px;height:22px;accent-color:#6e3f22"></label>
                    </sc-for>
                    <sc-for list="{{curseurs}}" as="g" hint-placeholder-count="2">
                      <label style="display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:17px;cursor:pointer"><span>{{g.nom}}</span><input type="range" min="0" max="100" step="5" value="{{g.valeur}}" onChange="{{g.changer}}" style="flex:0 0 46%;accent-color:#6e3f22;cursor:pointer"></label>
                    </sc-for>''')
from patch_tpl import retoucher, CSS
t = retoucher(t, rep)
from patch_carnet import retoucher_carnet
t = retoucher_carnet(t, rep)
for b, chemin in BLOBS.items():
    t = t.replace('/_blob/' + b, '@@A@@' + chemin)
reste = re.findall(r'/_blob/\w+', t)
assert not reste, reste

jsx = convertir(t)
# racine : classe de portée
jsx = jsx.replace('<div style={{ width: "1280px"', '<div className="r7" style={{ width: "1280px"', 1)
assert 'className="r7"' in jsx
# chemins d'assets : "…@@A@@x…" → `…${A}x…`
def chaine(m):
    corps = m.group(1)
    return '`' + corps.replace('`', '\\`').replace('@@A@@', '${A}') + '`'
jsx = re.sub(r'"([^"\n]*@@A@@[^"\n]*)"', chaine, jsx)
jsx = jsx.replace('@@A@@', '${A}')
jsx = re.sub(r'(\b[a-zA-Z]+)=`([^`]*)`', r'\1={`\2`}', jsx)
# attributs booléens et valeurs DOM
jsx = jsx.replace('checked={v', 'checked={!!v').replace('checked={g.actif}', 'checked={!!g.actif}')
jsx = re.sub(r'disabled=\{([^}]+)\}', r'disabled={!!(\1)}', jsx)
jsx = jsx.replace('value={g.valeur}', 'value={g.valeur}')

entete = '''// Vue du ranch : générée depuis la maquette « Ranch » (page v7) du canevas, sans logique.
// Ne pas modifier à la main : la logique vit dans Ranch.tsx, qui calcule les valeurs `v`.
/* eslint-disable */
import { Fragment, type CSSProperties } from 'react';

const A = `${import.meta.env.BASE_URL}assets/`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VueRanch({ v }: { v: any }) {
  return (
    <>
'''
open(DEST + 'VueRanch.tsx', 'w').write(entete + jsx + '    </>\n  );\n}\n')

# ——— feuille de style : portée sous .r7, animations renommées, chemins d'assets
css = open(ICI + 'ranch.css').read()
for b, chemin in BLOBS.items():
    css = css.replace('/_blob/' + b, '/assets/' + chemin)
assert '/_blob/' not in css
noms = set(re.findall(r'@keyframes\s+([\w-]+)', css))
regles = []
i = 0
while i < len(css):
    j = css.find('{', i)
    if j < 0:
        break
    brut = css[i:j]
    coms = re.findall(r'/\*.*?\*/', brut, re.S)
    sel = re.sub(r'/\*.*?\*/', '', brut, flags=re.S).strip()
    if sel.startswith('@keyframes') or sel.startswith('@media') or sel.startswith('@supports'):
        regles.extend(coms)
        i = i + brut.find(sel)
        d, k = 0, j
        while True:
            if css[k] == '{': d += 1
            elif css[k] == '}':
                d -= 1
                if d == 0: break
            k += 1
        bloc = css[i:k + 1].strip()
        if sel.startswith('@keyframes'):
            n = sel.split()[1]
            bloc = bloc.replace(sel, '@keyframes r7' + n[0].upper() + n[1:], 1)
        regles.append(bloc)
        i = k + 1
        continue
    k = css.find('}', j)
    corps = css[j:k + 1]
    commentaires = re.findall(r'/\*.*?\*/', sel, re.S)
    sel = re.sub(r'/\*.*?\*/', '', sel, flags=re.S).strip()
    regles.extend(commentaires)
    if sel in ('body', 'html', 'html,body', 'body,html', '*'):
        i = k + 1
        continue
    sels = []
    for s in sel.split(','):
        s = s.strip()
        if not s:
            continue
        sels.append(s if s.startswith('.r7') else '.r7 ' + s)
    # animations : noms renommés dans les déclarations animation / animation-name
    def ren(m):
        valeur = m.group(2)
        for n in sorted(noms, key=len, reverse=True):
            valeur = re.sub(r'(?<![\w-])' + re.escape(n) + r'(?![\w-])', 'r7' + n[0].upper() + n[1:], valeur)
        return m.group(1) + valeur
    corps = re.sub(r'(animation(?:-name)?\s*:)([^;}]*)', ren, corps)
    regles.append(','.join(sels) + corps)
    i = k + 1
regles.append(CSS)
open(DEST + 'ranch.css', 'w').write('/* Ranch (maquette v7 du canevas), portée sous .r7 — généré, ne pas modifier à la main. */\n' + '\n'.join(regles) + '\n')
print('ok', len(jsx), len(css))
