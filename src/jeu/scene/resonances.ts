// Apparence des résonances (couleur d'encre et pictogramme), reprise de la charte.
import type { Resonance } from '@/moteur/scene/types';

export const APPARENCE_RESONANCES: Record<Resonance, { nom: string; couleur: string; lueur: string; icone: string; pointilles?: boolean }> = {
  curiosite: { nom: 'Curiosité', couleur: '#b3671a', lueur: 'rgba(230,150,50,.75)', icone: 'M11 5a6 6 0 1 0 0 12a6 6 0 1 0 0-12zM16 16l4 4' },
  resolution: { nom: 'Résolution', couleur: '#7a2e2e', lueur: 'rgba(200,70,55,.65)', icone: 'M4 20l7-7M14 4l6 6-4 4-6-6z' },
  discernement: { nom: 'Discernement', couleur: '#566b3a', lueur: 'rgba(120,160,80,.65)', icone: 'M12 4v16M8 20h8M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z' },
  observation: { nom: 'Observation', couleur: '#2f5a7a', lueur: 'rgba(70,130,190,.65)', icone: 'M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zM12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z' },
  anticipation: { nom: 'Anticipation', couleur: '#4a3a6b', lueur: 'rgba(130,100,190,.65)', icone: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
  neutre: { nom: 'Neutre', couleur: '#6f6253', lueur: 'rgba(150,130,110,.5)', icone: 'M7 12h10' },
  indeterminee: { nom: 'Indéterminée', couleur: '#9a8668', lueur: 'rgba(170,150,120,.45)', icone: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01', pointilles: true }
};
