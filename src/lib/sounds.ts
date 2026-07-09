// Lightweight, dependency-free sound effects that play audio files from /public.
//
// File rakhar niyom (public folder):
//   public/sounds/correct.mp3   → practice/exam-e word thik hole
//   public/sounds/swipe.mp3     → flashcard page swipe (Next/Previous)
//   public/sounds/winner.mp3    → wordpack complete hole
//
// Onno format (wav/ogg) use korle nicher SOUND_FILES map-e path ta bodle dao.
//
// Design: SSR-safe, ekbar preload kore cache kore, ar browser audio block korle
// (autoplay policy, missing file, purano browser) silently fail kore — kokhono
// throw/crash korbe na. App audio chara normal-i chalbe.

export type SoundName = "correct" | "swipe" | "winner";

const SOUND_FILES: Record<SoundName, string> = {
  correct: "/sounds/correct.mp3",
  swipe: "/sounds/swipe.mp3",
  winner: "/sounds/winner.mp3",
};

const MUTE_KEY = "sfx_muted";

// Ekbar-i base Audio element cache kori (preload). Play-er shomoy clone kore
// bajai jate druto bar bar chaple (dhoro swipe) sound gulo overlap korte pare.
const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};

function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

function getBase(name: SoundName): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  let base = cache[name];
  if (!base) {
    try {
      base = new Audio(SOUND_FILES[name]);
      base.preload = "auto";
      base.volume = 0.6;
      cache[name] = base;
    } catch {
      return null;
    }
  }
  return base;
}

/**
 * Play a short UI sound effect. Fails silently if audio is unavailable, muted,
 * or the file is missing. Safe to call from any event handler / effect.
 */
export function playSound(name: SoundName): void {
  if (isMuted()) return;
  const base = getBase(name);
  if (!base) return;
  try {
    // Clone kori jate ekটা sound baje thakle porerটা atkে na jay.
    const instance = base.cloneNode(true) as HTMLAudioElement;
    instance.volume = base.volume;
    // play() ekটা Promise dey — autoplay block hole reject kore, tai catch kori.
    const maybePromise = instance.play();
    if (maybePromise && typeof maybePromise.catch === "function") {
      maybePromise.catch(() => {
        /* ignore — audio is best-effort (autoplay policy / missing file) */
      });
    }
  } catch {
    /* ignore — audio is best-effort */
  }
}

/**
 * Sound gulo age theke load kore rakhe (optional). User-er prothom interaction-er
 * por ekbar call korle prothom sound-e latency thakbe na. Na dileo kaj korbe.
 */
export function preloadSounds(): void {
  (Object.keys(SOUND_FILES) as SoundName[]).forEach((name) => {
    const base = getBase(name);
    try {
      base?.load();
    } catch {
      /* ignore */
    }
  });
}

/** Optional mute controls (default: unmuted). */
export function setSfxMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "true" : "false");
  } catch {
    /* ignore */
  }
}
