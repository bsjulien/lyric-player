import { writable, derived } from 'svelte/store';

export const authState = writable('idle');
export const accessToken = writable(null);
export const refreshToken = writable(null);
export const tokenExpiresAt = writable(0);

export const currentTrack = writable(null);
export const lyrics = writable(null);
export const activeLineIndex = writable(-1);
export const isAlwaysOnTop = writable(true);

export const playerState = derived(
  [currentTrack, lyrics],
  ([$currentTrack, $lyrics]) => {
    if (!$currentTrack || !$currentTrack.isPlaying) return 'idle';
    if ($lyrics === 'not-found') return 'no-lyrics';
    if ($lyrics === null) return 'loading-lyrics';
    return 'playing';
  }
);
