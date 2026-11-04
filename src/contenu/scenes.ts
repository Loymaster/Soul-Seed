// Toutes les scènes du jeu (contenu/scenes/*.scene), embarquées au build et rechargées à chaud en développement.
const fichiers = import.meta.glob('/contenu/scenes/*.scene', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const SCENES: { id: string; source: string }[] = Object.entries(fichiers)
  .map(([chemin, source]) => ({ id: chemin.slice(chemin.lastIndexOf('/') + 1, -'.scene'.length), source }))
  .sort((a, b) => a.id.localeCompare(b.id));
