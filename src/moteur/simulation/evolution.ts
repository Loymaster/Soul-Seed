// Évolutions : reprise de determineAdoEvolution / determineAdulteEvolution et des sprites par stade.
import type { EmotionEducative, Etat, Graine, ResultatEvolution } from './types';
import { CLES_TEMPERAMENT, EMOTIONS_EDUCATIVES, TRIADES_MELEES } from './constantes';

/** Paires « graine_lignée_émotion » → branche (fusion Enfant → Adolescent). */
const BRANCHES: Record<string, string> = {
  sorrow_primaire_fear: 'S-DF', fear_sombre_sorrow: 'S-DF',
  joy_primaire_disgust: 'J-DD', disgust_sombre_joy: 'J-DD',
  fear_primaire_wrath: 'F-DW', wrath_sombre_fear: 'F-DW',
  wrath_primaire_joy: 'W-DJ', joy_sombre_wrath: 'W-DJ',
  disgust_primaire_sorrow: 'D-DS', sorrow_sombre_disgust: 'D-DS',
  joy_primaire_sorrow: 'J-DS', sorrow_sombre_joy: 'J-DS',
  wrath_primaire_disgust: 'W-DD', disgust_sombre_wrath: 'W-DD',
  fear_primaire_joy: 'F-DJ', joy_sombre_fear: 'F-DJ',
  sorrow_primaire_wrath: 'S-DW', wrath_sombre_sorrow: 'S-DW',
  disgust_primaire_fear: 'D-DF', fear_sombre_disgust: 'D-DF',
};
const TEMPERAMENT_D_EMOTION = { joy: 'cur', wrath: 'res', disgust: 'dis', sorrow: 'obs', fear: 'ant' } as const;
const LETTRE = { J: 'joy', W: 'wrath', F: 'fear', S: 'sorrow', D: 'disgust' } as const;

const classer = (e: Etat): EmotionEducative[] =>
  EMOTIONS_EDUCATIVES.slice().sort((a, b) => e.educationTotale[b] - e.educationTotale[a]);

const neutre = (e: Etat) => e.lignee === 'neutre' || e.lignee === 'neutre-sombre';

/** Le processus majoritaire fait-il partie des tempéraments tirés à la naissance ? (lignées neutres) */
function coherentNeutre(e: Etat, majoritaire: EmotionEducative) {
  const initiaux = CLES_TEMPERAMENT.filter(k => e.temperament[k] > 0);
  return initiaux.includes(TEMPERAMENT_D_EMOTION[majoritaire]);
}

export function determinerAdolescent(e: Etat): ResultatEvolution {
  const t = e.educationTotale;
  const somme = t.cognitif + t.socio + t.moteur;
  if (somme > 0) {
    // Un processus à 80 % ou plus : lignée « fragmentée ».
    if (t.cognitif / somme >= 0.8) return { genre: 'fragment', code: 'C+' };
    if (t.socio / somme >= 0.8) return { genre: 'fragment', code: 'SA+' };
    if (t.moteur / somme >= 0.8) return { genre: 'fragment', code: 'PM+' };
  }
  const rang = classer(e);
  if (neutre(e)) return coherentNeutre(e, rang[0]) ? { genre: 'normal' } : { genre: 'branche', code: 'N-DN' };
  if (rang[0] === e.graine) return { genre: 'normal' };
  for (const emo of rang) {
    const code = BRANCHES[`${e.graine}_${e.lignee}_${emo}`];
    if (code) return { genre: 'branche', code };
  }
  return { genre: 'normal' };
}

/** null : les conditions du passage Adulte ne sont pas (encore) remplies. */
export function determinerAdulte(e: Etat): ResultatEvolution | null {
  const r = e.evolution;
  if (!r || r.genre === 'fragment') return null; // les fragmentés restent adolescents
  const t = e.educationTotale;
  const rang = classer(e);
  const somme = EMOTIONS_EDUCATIVES.reduce((a, k) => a + t[k], 0);
  const pct = (k: EmotionEducative) => (somme > 0 ? (t[k] / somme) * 100 : 0);
  if (r.genre === 'branche') {
    if (r.code === 'N-DN') return EMOTIONS_EDUCATIVES.every(k => pct(k) >= 16 && pct(k) <= 24) ? { genre: 'branche-adulte', code: 'N-DN' } : null;
    const [a, b] = r.code.split('-');
    const paire = [LETTRE[a as keyof typeof LETTRE], LETTRE[b.slice(1) as keyof typeof LETTRE]];
    return paire.every(x => rang.slice(0, 2).includes(x)) ? { genre: 'branche-adulte', code: r.code } : null;
  }
  // (Les échos « de mémoire » demandent souvenirs et pierres élémentaires : pas encore repris.)
  if (e.lignee === 'primaire' || e.lignee === 'sombre') {
    for (const tr of TRIADES_MELEES) {
      if (tr.emotions.includes(e.graine) && tr.emotions.every(k => pct(k) >= 28 && pct(k) <= 38)) return { genre: 'melee', code: tr.code };
    }
  }
  if (neutre(e)) return coherentNeutre(e, rang[0]) ? r : null;
  return rang[0] === e.graine ? r : null;
}

/** Chemin du sprite (dans public/assets/) selon le stade, la lignée et le résultat d'évolution. */
export function apparence(e: Pick<Etat, 'stade' | 'graine' | 'lignee' | 'genre' | 'evolution'>): string {
  const { stade, graine, lignee, genre, evolution: r } = e;
  const base = (g: Graine, avecGenre: boolean) => {
    if (lignee === 'neutre') return 'neutre';
    if (lignee === 'neutre-sombre') return 'dark-neutre';
    const suffixe = avecGenre && g === 'joy' ? (genre === 'f' ? '-f' : '-m') : '';
    return (lignee === 'sombre' ? 'dark-' : '') + g + suffixe;
  };
  if (stade === 'bebe' || stade === 'enfant') return `echos/${stade}/${base(graine, false)}.png`;
  const ado = () => {
    if (r?.genre === 'fragment') return `echos/adolescent/fragment-${{ 'C+': 'cognitif', 'PM+': 'psychomoteur', 'SA+': 'socio' }[r.code]}.png`;
    if (r?.genre === 'branche') return `echos/adolescent/branch-${r.code.toLowerCase()}.png`;
    return `echos/adolescent/${base(graine, true)}.png`;
  };
  if (stade === 'adolescent') return ado();
  if (r?.genre === 'melee') return `echos/adulte/melee-${r.code.toLowerCase()}.png`;
  if (r?.genre === 'branche-adulte') return `echos/adulte/branch-${r.code.toLowerCase()}.png`;
  if (r?.genre === 'fragment' || r?.genre === 'branche') return ado();
  return `echos/adulte/${base(graine, true)}.png`;
}
