"""Convertit un gabarit .dc.html (holes {{ }}, sc-if, sc-for) en JSX React.
Usage : python3 dc2jsx.py gabarit.html > Vue.tsx-fragment
Les valeurs viennent d'un objet `v` ; les variables de boucle sont locales."""
import re, sys, json
from html.parser import HTMLParser

SVG_TAGS = {t.lower(): t for t in ['linearGradient', 'radialGradient', 'clipPath', 'feColorMatrix', 'feGaussianBlur', 'feTurbulence',
    'feDisplacementMap', 'feOffset', 'feMerge', 'feMergeNode', 'feComposite', 'feFlood', 'feBlend', 'textPath', 'foreignObject']}
ATTR = {'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex', 'viewbox': 'viewBox', 'readonly': 'readOnly',
    'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', 'stroke-dasharray': 'strokeDasharray',
    'stroke-dashoffset': 'strokeDashoffset', 'stroke-opacity': 'strokeOpacity', 'stroke-miterlimit': 'strokeMiterlimit', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule',
    'clip-path': 'clipPath', 'fill-opacity': 'fillOpacity', 'stop-color': 'stopColor', 'stop-opacity': 'stopOpacity', 'gradientunits': 'gradientUnits',
    'gradienttransform': 'gradientTransform', 'preserveaspectratio': 'preserveAspectRatio', 'color-interpolation-filters': 'colorInterpolationFilters',
    'stddeviation': 'stdDeviation', 'basefrequency': 'baseFrequency', 'numoctaves': 'numOctaves', 'xlink:href': 'href', 'text-anchor': 'textAnchor',
    'dominant-baseline': 'dominantBaseline', 'font-family': 'fontFamily', 'font-size': 'fontSize', 'font-weight': 'fontWeight', 'letter-spacing': 'letterSpacing',
    'pathlength': 'pathLength', 'markerwidth': 'markerWidth', 'markerheight': 'markerHeight', 'refx': 'refX', 'refy': 'refY', 'patternunits': 'patternUnits',
    'mix-blend-mode': 'mixBlendMode', 'spellcheck': 'spellCheck', 'autocomplete': 'autoComplete', 'maxlength': 'maxLength', 'draggable': 'draggable',
    'filterunits': 'filterUnits', 'maskunits': 'maskUnits', 'maskcontentunits': 'maskContentUnits', 'primitiveunits': 'primitiveUnits', 'in2': 'in2', 'result': 'result', 'mode': 'mode', 'operator': 'operator'}
EVENTS = ['click', 'pointerdown', 'pointerup', 'pointerenter', 'pointerleave', 'pointermove', 'mouseenter', 'mouseleave', 'mousedown', 'mouseup', 'mousemove',
    'focus', 'blur', 'keydown', 'keyup', 'change', 'input', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop', 'animationend', 'transitionend',
    'contextmenu', 'dblclick', 'wheel', 'submit', 'touchstart', 'touchend']
for e in EVENTS:
    ATTR['on' + e] = 'on' + {'pointerdown': 'PointerDown', 'pointerup': 'PointerUp', 'pointerenter': 'PointerEnter', 'pointerleave': 'PointerLeave',
        'pointermove': 'PointerMove', 'mouseenter': 'MouseEnter', 'mouseleave': 'MouseLeave', 'mousedown': 'MouseDown', 'mouseup': 'MouseUp',
        'mousemove': 'MouseMove', 'keydown': 'KeyDown', 'keyup': 'KeyUp', 'dragstart': 'DragStart', 'dragend': 'DragEnd', 'dragover': 'DragOver',
        'dragenter': 'DragEnter', 'dragleave': 'DragLeave', 'animationend': 'AnimationEnd', 'transitionend': 'TransitionEnd', 'contextmenu': 'ContextMenu',
        'dblclick': 'DoubleClick', 'touchstart': 'TouchStart', 'touchend': 'TouchEnd'}.get(e, e.capitalize())
VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'col', 'embed', 'param', 'track', 'wbr'}
HOLE = re.compile(r'\{\{\s*([^}]+?)\s*\}\}')


class Noeud:
    def __init__(self, tag, attrs):
        self.tag, self.attrs, self.enfants = tag, attrs, []


class Analyseur(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.racine = Noeud('#racine', [])
        self.pile = [self.racine]

    def handle_starttag(self, tag, attrs):
        n = Noeud(tag, attrs)
        self.pile[-1].enfants.append(n)
        if tag not in VOID:
            self.pile.append(n)

    def handle_startendtag(self, tag, attrs):
        self.pile[-1].enfants.append(Noeud(tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.pile) - 1, 0, -1):
            if self.pile[i].tag == tag:
                del self.pile[i:]
                return

    def handle_data(self, data):
        self.pile[-1].enfants.append(data)

    def handle_comment(self, data):
        self.pile[-1].enfants.append(('#commentaire', data))


class Convertisseur:
    def __init__(self):
        self.boucles = []  # [(nom, index)]
        self.k = 0

    def chemin(self, p):
        p = p.strip()
        if p.startswith('!'):
            return '!' + self.chemin(p[1:])
        if p in ('true', 'false', 'null') or re.fullmatch(r'-?\d+(\.\d+)?', p):
            return p
        if re.fullmatch(r"'[^']*'", p):
            return p
        tete = p.split('.')[0]
        if p == '$index' and self.boucles:
            return self.boucles[-1][2]
        for nom, alias, idx in reversed(self.boucles):
            if tete == nom:
                return alias + p[len(nom):]
        return 'v.' + p

    def gabarit(self, s):
        """Chaîne avec holes → expression JS (template literal)."""
        if not HOLE.search(s):
            return json.dumps(s, ensure_ascii=False)
        m = HOLE.fullmatch(s.strip())
        if m and s.strip() == s:
            return self.chemin(m.group(1))
        out = ''
        i = 0
        for m in HOLE.finditer(s):
            out += s[i:m.start()].replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
            out += '${' + self.chemin(m.group(1)) + '}'
            i = m.end()
        out += s[i:].replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
        return '`' + out + '`'

    def style(self, s):
        decls = []
        cur, prof = '', 0
        for ch in s:
            if ch == '(':
                prof += 1
            elif ch == ')':
                prof -= 1
            if ch == ';' and prof == 0:
                decls.append(cur); cur = ''
            else:
                cur += ch
        decls.append(cur)
        props = []
        for d in decls:
            if ':' not in d or not d.strip():
                continue
            k, val = d.split(':', 1)
            k, val = k.strip(), val.strip()
            if not k:
                continue
            if k.startswith('--'):
                cle = json.dumps(k)
            else:
                if k.startswith('-webkit-'):
                    k = 'Webkit-' + k[8:]
                cle = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
                cle = cle[0].lower() + cle[1:] if not cle.startswith('Webkit') else cle
            props.append(f'{cle}: {self.gabarit(val)}')
        return '{{ ' + ', '.join(props) + ' } as CSSProperties}'

    def attrs(self, n):
        out = []
        for k, val in n.attrs:
            if val is None:
                val = ''
            if k.startswith('hint-'):
                continue
            nom = ATTR.get(k, k)
            if k == 'style':
                out.append(f'style={self.style(val)}')
                continue
            if k.startswith('aria-') or k.startswith('data-'):
                nom = k
            e = self.gabarit(val)
            if e.startswith('"') and not nom.startswith('on'):
                out.append(f'{nom}={e}')
            else:
                out.append(f'{nom}={{{e}}}')
        return (' ' + ' '.join(out)) if out else ''

    def texte(self, s):
        if not s.strip():
            return ' ' if '\n' not in s and s else ''
        out = ''
        i = 0
        for m in HOLE.finditer(s):
            out += self.echapper(s[i:m.start()])
            out += '{' + self.chemin(m.group(1)) + '}'
            i = m.end()
        out += self.echapper(s[i:])
        return re.sub(r'\s*\n\s*', ' ', out)

    @staticmethod
    def echapper(t):
        return t.replace('{', "{'{'}").replace('}', "{'}'}").replace('<', '&lt;').replace('>', '&gt;')

    def enfants(self, liste, ind):
        return ''.join(self.noeud(c, ind) for c in liste)

    def noeud(self, n, ind):
        pad = '  ' * ind
        if isinstance(n, str):
            t = self.texte(n)
            return (pad + t + '\n') if t.strip() else ''
        if isinstance(n, tuple):
            return pad + '{/* ' + n[1].strip().replace('*/', '* /') + ' */}\n'
        a = dict(n.attrs)
        if n.tag == 'sc-if':
            cond = self.chemin(HOLE.search(a.get('value', '')).group(1))
            return f'{pad}{{{cond} ? (<>\n{self.enfants(n.enfants, ind + 1)}{pad}</>) : null}}\n'
        if n.tag == 'sc-for':
            liste = self.chemin(HOLE.search(a['list']).group(1))
            nom = a.get('as', 'item')
            self.k += 1
            idx = f'i{self.k}'
            alias = 'x' + nom[0].upper() + nom[1:] + str(self.k)
            self.boucles.append((nom, alias, idx))
            corps = self.enfants(n.enfants, ind + 2)
            self.boucles.pop()
            return f'{pad}{{({liste} || []).map(({alias}: any, {idx}: number) => (\n{pad}  <Fragment key={{{idx}}}>\n{corps}{pad}  </Fragment>\n{pad}))}}\n'
        if n.tag in ('helmet', 'x-dc'):
            return self.enfants(n.enfants, ind)
        tag = SVG_TAGS.get(n.tag, n.tag)
        at = self.attrs(n)
        if n.tag in VOID or not n.enfants:
            return f'{pad}<{tag}{at} />\n'
        return f'{pad}<{tag}{at}>\n{self.enfants(n.enfants, ind + 1)}{pad}</{tag}>\n'


def convertir(source):
    p = Analyseur()
    p.feed(source)
    c = Convertisseur()
    return c.enfants(p.racine.enfants, 2)


if __name__ == '__main__':
    sys.stdout.write(convertir(open(sys.argv[1]).read()))
