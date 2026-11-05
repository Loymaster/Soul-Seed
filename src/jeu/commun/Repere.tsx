// Repère fixe de 1280 × 800, mis à l'échelle pour tenir entier dans l'écran (bandes noires si besoin).
// Les écrans portés des maquettes (choix de la graine, mort, introduction) y sont dessinés tels quels.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './commun.css';

export function Repere({ children, fond = '#000', className = '', style }: { children: ReactNode; fond?: string; className?: string; style?: CSSProperties }) {
  const cadre = useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = useState(1);
  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setEchelle(Math.min(el.clientWidth / 1280, el.clientHeight / 800)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="repere-cadre" ref={cadre} style={{ background: fond }}>
      <div className={`repere ${className}`} style={{ ...style, transform: `translate(-50%, -50%) scale(${echelle})` }}>{children}</div>
    </div>
  );
}
