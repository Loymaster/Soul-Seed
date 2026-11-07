// Teinte de la lueur derrière l'émotion qui s'affiche au-dessus de l'écho (couleurs « r,g,b » pour la CSS).
const FAMILLES: [string, string[]][] = [
  ['255,206,96', ['joyeux', 'serein', 'fier', 'emerveille', 'surpris', 'neutre']],
  ['255,140,170', ['affectueux', 'adorateur', 'jaloux']],
  ['120,180,255', ['triste', 'abattu', 'deception', 'delaisse', 'morose', 'desespere', 'abandon']],
  ['255,120,70', ['furieux', 'en-colere', 'frustre', 'boudeur', 'meprisant', 'defensif']],
  ['175,140,255', ['terrifie', 'angoisse', 'anxieux', 'nerveux', 'sidere']],
  ['150,210,90', ['degout']],
  ['200,215,190', ['malade', 'blesse', 'epuise', 'distant']],
];

export function teinteEmotion(id: string): string {
  return FAMILLES.find(([, ids]) => ids.includes(id))?.[0] ?? '255,226,160';
}
