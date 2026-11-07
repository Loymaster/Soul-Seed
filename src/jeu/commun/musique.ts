// Musiques d'ambiance des écrans plein cadre : lecture en boucle, montée et descente en fondu.
import { useEffect, useRef } from 'react';
import { ecouterVolumes, volumeMusique } from './volumes';

export const cheminSon = (nom: string) => `${import.meta.env.BASE_URL}assets/sons/musiques/${nom}.mp3`;

export interface Piste {
  /** amène le volume vers `cible` en `ms` millisecondes */
  vers: (cible: number, ms: number) => void;
}

/**
 * Joue `nom` (public/assets/sons/musiques/<nom>.mp3) tant que le composant est affiché et que `active` est vrai.
 * Le volume monte jusqu'à `volume` (multiplié par le volume de musique des options) ; à la fin, la piste s'éteint en fondu.
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
    // lecture refusée par le navigateur (aucun geste encore) : on réessaie au premier clic ou à la première touche
    const cible = () => volume * volumeMusique();
    const reessayer = () => { a.play().then(() => vers(cible(), montee)).catch(() => {}); retirer(); };
    const retirer = () => { window.removeEventListener('pointerdown', reessayer); window.removeEventListener('keydown', reessayer); };
    a.play().catch(() => { window.addEventListener('pointerdown', reessayer); window.addEventListener('keydown', reessayer); });
    vers(cible(), montee);
    // volume changé dans les options : la piste s'y ajuste en douceur
    const desabonner = ecouterVolumes(() => vers(cible(), 300));
    return () => {
      desabonner();
      retirer();
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

/**
 * Une musique de lieu qui change au fil des déplacements : quand la piste demandée change, celle en cours
 * s'éteint en fondu, PUIS la suivante monte (jamais les deux à la fois). `null` : silence (ex. pendant un combat).
 * Garder le même `nom` d'un lieu à l'autre ne relance pas la piste.
 */
export function useMusiqueEnchainee(nom: string | null, { volume = 0.4, active = true, sortie = 1200, montee = 2600 } = {}) {
  const courante = useRef<{ nom: string; audio: HTMLAudioElement } | null>(null);
  const voulue = useRef<string | null>(null);
  const minuteur = useRef<ReturnType<typeof setInterval> | null>(null);
  const cible = () => volume * volumeMusique();

  const fondu = (a: HTMLAudioElement, vers: number, ms: number, fin?: () => void) => {
    if (minuteur.current) clearInterval(minuteur.current);
    const v0 = a.volume, t0 = performance.now();
    minuteur.current = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / Math.max(1, ms));
      a.volume = Math.max(0, Math.min(1, v0 + (vers - v0) * k));
      if (k >= 1) { if (minuteur.current) clearInterval(minuteur.current); minuteur.current = null; fin?.(); }
    }, 50);
  };
  const demarrer = (n: string) => {
    const a = new Audio(cheminSon(n));
    a.loop = true; a.volume = 0;
    courante.current = { nom: n, audio: a };
    const jouer = () => a.play().then(() => fondu(a, cible(), montee)).catch(() => {
      // lecture refusée (aucun geste encore) : au premier clic ou à la première touche
      const reessayer = () => { window.removeEventListener('pointerdown', reessayer); window.removeEventListener('keydown', reessayer); if (courante.current?.audio === a) jouer(); };
      window.addEventListener('pointerdown', reessayer); window.addEventListener('keydown', reessayer);
    });
    jouer();
  };
  const appliquer = () => {
    const n = active ? voulue.current : null;
    const c = courante.current;
    if (c && c.nom === n) { fondu(c.audio, cible(), 600); return; }
    if (c) {
      // 1) la piste en cours s'éteint…
      fondu(c.audio, 0, sortie, () => {
        c.audio.pause();
        if (courante.current === c) courante.current = null;
        // 2) … puis la suivante monte
        if (voulue.current && active && !courante.current) demarrer(voulue.current);
      });
      return;
    }
    if (n) demarrer(n);
  };
  useEffect(() => { voulue.current = nom; appliquer(); }, [nom, active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => ecouterVolumes(() => { const c = courante.current; if (c) fondu(c.audio, cible(), 300); }), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => {
    if (minuteur.current) clearInterval(minuteur.current);
    const c = courante.current;
    courante.current = null;
    if (!c) return;
    const a = c.audio, v0 = a.volume, t0 = performance.now();
    const id = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / 700); a.volume = v0 * (1 - k); if (k >= 1) { clearInterval(id); a.pause(); } }, 50);
  }, []);
}
