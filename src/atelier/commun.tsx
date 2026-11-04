// Petits éléments partagés par les vues de l'atelier.
import { useEffect, useState, type ReactNode } from 'react';
import type { Asset, Catalogue } from '@/contenu/types';

const TRACES: Record<string, string> = {
  assets: 'M3 6.5h6l1.6 2H21v10.5H3zM3 6.5V5h5',
  personnages: 'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM4 20c.8-3.6 4-5.6 8-5.6s7.2 2 8 5.6',
  echos: 'M12 3c3 3.2 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5.8 5-9zM12 21v-4',
  diagnostics: 'M12 3l9.5 17h-19zM12 10v4.5M12 17.2v.3',
  scenes: 'M4 5h16v11H4zM8 20h8M12 16v4',
  boite: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
  rafraichir: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6',
  copier: 'M8 8h11v12H8zM5 16V4h11',
  fleche: 'M5 12h14M13 6l6 6-6 6',
  corbeille: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  son: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6',
  plus: 'M12 5v14M5 12h14',
  etoile: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'
};

export function Icone({ nom, taille = 18 }: { nom: keyof typeof TRACES | string; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={TRACES[nom] || ''} />
    </svg>
  );
}

/** Image d'un asset, éventuellement rognée à sa boîte utile (les marges transparentes disparaissent). */
export function ImageAsset({ asset, rogne = true, className, style }: { asset: Asset; rogne?: boolean; className?: string; style?: React.CSSProperties }) {
  const b = asset.boite;
  if (!rogne || !b || !b.h || !asset.l || !asset.h || (b.l === asset.l && b.h === asset.h)) {
    return <img src={asset.url} alt={asset.chemin} loading="lazy" decoding="async" className={className} style={style} draggable={false} />;
  }
  // On montre la boîte utile via un viewBox SVG : simple, net, et ça reste « contain » dans n'importe quel cadre.
  return (
    <svg className={className} style={{ width: '92%', height: '92%', ...style }} viewBox={`${b.x} ${b.y} ${b.l} ${b.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={asset.chemin}>
      <image href={asset.url} x={0} y={0} width={asset.l} height={asset.h} />
    </svg>
  );
}

export function tailleLisible(octets: number) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1048576) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / 1048576).toFixed(1)} Mo`;
}

export function nomFichier(chemin: string) {
  return chemin.slice(chemin.lastIndexOf('/') + 1);
}

export function sansExtension(nom: string) {
  const i = nom.lastIndexOf('.');
  return i > 0 ? nom.slice(0, i) : nom;
}

export function extension(nom: string) {
  const i = nom.lastIndexOf('.');
  return i > 0 ? nom.slice(i).toLowerCase() : '';
}

/** Même règle que outils/assets/regles.mjs : minuscules, sans accents ni espaces. */
export function normaliser(nom: string) {
  return nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const LIBELLES_ROLES: Record<string, string> = {
  expression: 'Expression', vignette: 'Vignette', illustration: 'Illustration', calque: 'Calque de lieu',
  forme: "Forme d'écho", graine: 'Graine', ame: 'Âme', portrait: 'Portrait',
  decor: 'Décor', icone: 'Icône', emotion: 'Émotion', objet: 'Objet', activite: 'Activité',
  animation: 'Animation', musique: 'Musique', 'a-trier': 'À trier', inconnu: 'Inconnu'
};

export const AIDE_ROLES: Record<string, string> = {
  expression: 'Image détourée du personnage, utilisée en dialogue.',
  vignette: 'Petit portrait carré (relations, carnet).',
  illustration: "Image opaque : une scène illustrée complète, pas un personnage détouré.",
  calque: 'Grande image transparente : le personnage placé dans un lieu précis.',
  forme: "Une forme de l'écho jouable à un stade de sa vie."
};

export function Etiquettes({ asset }: { asset: Asset }) {
  return (
    <>
      <span className={`etiquette ${asset.categorie === 'pnj' ? 'pnj' : asset.categorie === 'echos' ? (asset.echo?.sombre ? 'sombre' : 'echo') : ''}`}>
        {LIBELLES_ROLES[asset.role] || asset.role}
      </span>
      {asset.doublons?.length ? <span className="etiquette attention">doublon</span> : null}
    </>
  );
}

/** Fait apparaître un contenu après un délai (utile pour les petites confirmations). */
export function useEphemere(duree = 1800): [boolean, () => void] {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), duree);
    return () => clearTimeout(t);
  }, [visible, duree]);
  return [visible, () => setVisible(true)];
}

export function Section({ titre, children, actions }: { titre: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <>
      <div className="section-titre">{titre}{actions}</div>
      {children}
    </>
  );
}

export function trouverAsset(catalogue: Catalogue, chemin: string | null | undefined) {
  if (!chemin) return undefined;
  return catalogue.assets.find((a) => a.chemin === chemin);
}
