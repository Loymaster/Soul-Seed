import { AVATARS, cheminAvatar, type IdAvatar } from '../profils';

const asset = (chemin: string) => `${import.meta.env.BASE_URL}assets/${chemin}`;

/**
 * Portrait du joueur dans un cadre de cristal. Tant que l'image définitive de l'avatar n'est pas déposée
 * (joueur/<id>.png), on montre l'ancien portrait équivalent ou une silhouette de lumière.
 */
export function Avatar({ id, taille, disponibles, nom }: { id: IdAvatar; taille: number; disponibles: Set<string>; nom?: string }) {
  const def = AVATARS.find((a) => a.id === id) ?? AVATARS[0];
  const chemin = disponibles.has(cheminAvatar(id)) ? cheminAvatar(id) : def.repli && disponibles.has(def.repli) ? def.repli : '';
  return (
    <span className="avatar" style={{ width: taille, height: taille }}>
      <span>
        {chemin ? <img src={asset(chemin)} alt={nom ?? ''} /> : <Silhouette variante={id.endsWith('2') ? 2 : 1} />}
      </span>
    </span>
  );
}

function Silhouette({ variante }: { variante: 1 | 2 }) {
  return (
    <span className="silhouette">
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id={`sil${variante}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e8f6ff" stopOpacity=".9" /><stop offset="1" stopColor="#ffb86b" stopOpacity=".55" />
          </linearGradient>
        </defs>
        <circle cx="50" cy={variante === 1 ? 40 : 38} r={variante === 1 ? 17 : 15} fill={`url(#sil${variante})`} />
        {variante === 2 && <path d="M33 36c2-14 32-14 34 0 2 8-2 14-2 14l-3-12c-6 3-18 3-24 0l-3 12s-4-6-2-14z" fill={`url(#sil${variante})`} opacity=".8" />}
        <path d="M18 100c2-22 15-34 32-34s30 12 32 34z" fill={`url(#sil${variante})`} />
      </svg>
    </span>
  );
}
