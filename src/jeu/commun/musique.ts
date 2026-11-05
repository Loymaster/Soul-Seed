// Musiques d'ambiance des écrans plein cadre : lecture en boucle, montée et descente en fondu.
import { useEffect, useRef } from 'react';

export const cheminSon = (nom: string) => `${import.meta.env.BASE_URL}assets/sons/musiques/${nom}.mp3`;

export interface Piste {
  /** amène le volume vers `cible` en `ms` millisecondes */
  vers: (cible: number, ms: number) => void;
}

/**
 * Joue `nom` (public/assets/sons/musiques/<nom>.mp3) tant que le composant est affiché et que `active` est vrai.
 * Le volume monte jusqu'à `volume` ; à la fin, la piste s'éteint en fondu.
 */
export function useMusique(nom: string | null, { volume = 0.4, active = true, montee = 3000 }: { volume?: number; active?: boolean; montee?: number } = {}): Piste {
  const audio = useRef<HTMLAudioElement | null>(null);
  const fondu = useRef<ReturnType<typeof setInterval> | null>(null);
  const vers = (cible: number, ms: number) => {
    const a = audio.current;
    if (!a) return;
    if (fondu.current) clearInterval(fondu.current);
    const v0 = a.volume, t0 = performance.now();
    fondu.current = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / Math.max(1, ms));
      a.volume = Math.max(0, Math.min(1, v0 + (cible - v0) * k));
      if (k >= 1 && fondu.current) { clearInterval(fondu.current); fondu.current = null; }
    }, 50);
  };
  useEffect(() => {
    if (!nom || !active) return;
    const a = new Audio(cheminSon(nom));
    a.loop = true; a.volume = 0;
    audio.current = a;
    a.play().catch(() => { /* lecture refusée par le navigateur : on reste silencieux */ });
    vers(volume, montee);
    return () => {
      if (fondu.current) clearInterval(fondu.current);
      const v0 = a.volume, t0 = performance.now();
      const id = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / 900);
        a.volume = Math.max(0, v0 * (1 - k));
        if (k >= 1) { clearInterval(id); a.pause(); }
      }, 50);
      audio.current = null;
    };
  }, [nom, active]); // eslint-disable-line react-hooks/exhaustive-deps
  return { vers };
}
