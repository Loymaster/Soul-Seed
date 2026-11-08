// Musiques d'ambiance des écrans plein cadre : lecture en boucle, montée et descente en fondu.
import { useEffect, useRef } from 'react';
import { ecouterVolumes, volumeMusique } from './volumes';

export const cheminSon = (nom: string) => `${import.meta.env.BASE_URL}assets/sons/musiques/${nom}.mp3`;

// —— Relais : une piste qui quitte l'écran peut être reprise par l'écran suivant, sans redémarrer.
// Celui qui part la confie (`confierPiste`) : elle continue de jouer `attente` ms, puis s'éteint en fondu ;
// un lecteur qui démarre la même piste avant la fin la reprend (`reprendrePiste`) là où elle en est.
// Ex. : la musique de rencontre de l'exploration continue telle quelle sur l'écran de combat.

/** Ce dont le relais a besoin d'une piste (un HTMLAudioElement). */
export type AudioRelais = Pick<HTMLAudioElement, 'volume' | 'paused' | 'pause'>;
interface Relais { audio: AudioRelais; delai: ReturnType<typeof setTimeout> | null; fondu: ReturnType<typeof setInterval> | null }
const relais = new Map<string, Relais>();
const arreterRelais = (r: Relais) => { if (r.delai) clearTimeout(r.delai); if (r.fondu) clearInterval(r.fondu); r.delai = r.fondu = null; };

/** Confie une piste qui joue encore : elle tient `attente` ms, puis s'éteint en `sortie` ms, sauf si on la reprend avant. */
export function confierPiste<A extends AudioRelais>(nom: string, audio: A, { attente = 0, sortie = 900 }: { attente?: number; sortie?: number } = {}) {
  const ancien = relais.get(nom);
  if (ancien && ancien.audio !== audio) { arreterRelais(ancien); ancien.audio.pause(); }
  if (ancien) arreterRelais(ancien);
  if (audio.paused) { relais.delete(nom); return; }
  const r: Relais = { audio, delai: null, fondu: null };
  const eteindre = () => {
    r.delai = null;
    const v0 = audio.volume, t0 = performance.now();
    r.fondu = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / Math.max(1, sortie));
      audio.volume = Math.max(0, v0 * (1 - k));
      if (k >= 1) { arreterRelais(r); audio.pause(); if (relais.get(nom) === r) relais.delete(nom); }
    }, 50);
  };
  if (attente > 0) r.delai = setTimeout(eteindre, attente); else eteindre();
  relais.set(nom, r);
}

/** Reprend la piste `nom` si elle a été confiée et joue encore (son fondu de sortie s'arrête) ; sinon `null`. */
export function reprendrePiste(nom: string): HTMLAudioElement | null {
  const r = relais.get(nom);
  if (!r) return null;
  relais.delete(nom);
  arreterRelais(r);
  return r.audio.paused ? null : (r.audio as HTMLAudioElement);
}

/** Vrai si une piste `nom` attend d'être reprise. */
export const pisteEnRelais = (nom: string) => !!relais.get(nom) && !relais.get(nom)!.audio.paused;

export interface Piste {
  /** amène le volume vers `cible` en `ms` millisecondes */
  vers: (cible: number, ms: number) => void;
}

/**
 * Joue `nom` (public/assets/sons/musiques/<nom>.mp3) tant que le composant est affiché et que `active` est vrai.
 * Le volume monte jusqu'à `volume` (multiplié par le volume de musique des options) ; à la fin, la piste s'éteint en fondu.
 * Si l'écran précédent a confié la même piste (`confierPiste`), elle est reprise sans redémarrer ; à la fin, elle est
 * confiée à son tour (le double montage du mode strict de React la reprend aussitôt).
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
    const reprise = reprendrePiste(nom);
    const a = reprise ?? new Audio(cheminSon(nom));
    if (!reprise) { a.loop = true; a.volume = 0; }
    audio.current = a;
    // lecture refusée par le navigateur (aucun geste encore) : on réessaie au premier clic ou à la première touche
    const cible = () => volume * volumeMusique();
    const reessayer = () => { a.play().then(() => vers(cible(), montee)).catch(() => {}); retirer(); };
    const retirer = () => { window.removeEventListener('pointerdown', reessayer); window.removeEventListener('keydown', reessayer); };
    if (!reprise) a.play().catch(() => { window.addEventListener('pointerdown', reessayer); window.addEventListener('keydown', reessayer); });
    vers(cible(), reprise ? 800 : montee);
    // volume changé dans les options : la piste s'y ajuste en douceur
    const desabonner = ecouterVolumes(() => vers(cible(), 300));
    return () => {
      desabonner();
      retirer();
      if (fondu.current) clearInterval(fondu.current);
      fondu.current = null;
      // la piste s'éteint en fondu… à moins qu'un lecteur ne la reprenne aussitôt
      if (a.paused) a.volume = 0; else confierPiste(nom, a, { sortie: 900 });
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
