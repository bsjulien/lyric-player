<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { lyrics, activeLineIndex, currentTrack, playerState } from '../lib/store.js';
  import { fetchLyrics, getActiveLine } from '../lib/lyrics.js';
  import { fetchPlaybackState } from '../lib/spotify.js';

  let scrollContainer = $state(null);
  let lineRefs = [];
  let rafId = null;
  let pollIntervalId = null;
  let lastKnownPosition = 0;
  let lastPollTime = 0;
  let lastTrackId = null;

  let lyricsData = $derived($lyrics);
  let activeIdx = $derived($activeLineIndex);
  let state = $derived($playerState);

  const LYRIC_OFFSET_MS = 0;

  async function poll() {
    const playback = await fetchPlaybackState();
    if (playback) {
      lastKnownPosition = playback.progressMs;
      lastPollTime = performance.now();

      if (playback.id !== lastTrackId) {
        lastTrackId = playback.id;
        lineRefs = [];
        lyrics.set(null);
        activeLineIndex.set(-1);

        const lines = await fetchLyrics(playback.name, playback.artists, playback.durationMs);
        lyrics.set(lines === null ? 'not-found' : { lines, trackId: playback.id });
      }
    } else {
      lastKnownPosition = 0;
      lastPollTime = performance.now();
      if (lastTrackId !== null) {
        lastTrackId = null;
        lyrics.set(null);
        activeLineIndex.set(-1);
      }
    }
  }

  function syncLoop() {
    const ly = get(lyrics);
    if (ly && ly !== 'not-found' && ly.lines) {
      const position = lastKnownPosition + (performance.now() - lastPollTime) - LYRIC_OFFSET_MS;
      const idx = getActiveLine(ly.lines, position);
      if (idx !== get(activeLineIndex)) activeLineIndex.set(idx);
    }
    rafId = requestAnimationFrame(syncLoop);
  }

  $effect(() => {
    const idx = activeIdx;
    if (idx < 0 || !scrollContainer || !lineRefs[idx]) return;
    const el = lineRefs[idx];
    const top = el.offsetTop - scrollContainer.clientHeight / 2 + el.offsetHeight / 2;
    scrollContainer.scrollTo({ top, behavior: 'smooth' });
  });

  onMount(() => {
    lastPollTime = performance.now();
    poll();
    pollIntervalId = setInterval(poll, 1000);
    rafId = requestAnimationFrame(syncLoop);
  });

  onDestroy(() => {
    cancelAnimationFrame(rafId);
    clearInterval(pollIntervalId);
  });

  function collectRef(node, i) {
    lineRefs[i] = node;
    return { destroy() { lineRefs[i] = null; } };
  }
</script>

<div class="lyrics-wrapper">
  {#if state === 'idle'}
    <div class="empty-state">
      <span class="pulse-dot"></span>
      <p>Nothing playing</p>
    </div>

  {:else if state === 'no-lyrics'}
    <div class="empty-state">
      {#if $currentTrack}
        <p class="no-lyrics-track">{$currentTrack.name}</p>
        <p class="no-lyrics-artist">{$currentTrack.artists}</p>
      {/if}
      <p class="muted">No lyrics available</p>
    </div>

  {:else if state === 'loading-lyrics'}
    <div class="empty-state">
      <div class="thin-loader"></div>
    </div>

  {:else if state === 'playing' && lyricsData?.lines}
    <div class="scroll-container" bind:this={scrollContainer}>
      <div class="lines-spacer"></div>
      {#each lyricsData.lines as line, i (i)}
        <div
          class="lyric-line"
          class:active={i === activeIdx}
          class:near={Math.abs(i - activeIdx) <= 2}
          use:collectRef={i}
        >
          {line.text || '♪'}
        </div>
      {/each}
      <div class="lines-spacer"></div>
    </div>
  {/if}
</div>

<style>
  .lyrics-wrapper {
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
  }

  .lyrics-wrapper::before,
  .lyrics-wrapper::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 80px;
    z-index: 2;
    pointer-events: none;
  }

  .lyrics-wrapper::before {
    top: 0;
    background: linear-gradient(to bottom, rgba(14,14,15,0.9) 0%, transparent 100%);
  }

  .lyrics-wrapper::after {
    bottom: 0;
    background: linear-gradient(to top, rgba(14,14,15,0.9) 0%, transparent 100%);
  }

  .scroll-container {
    height: 100%;
    overflow-y: scroll;
    scroll-behavior: smooth;
    scrollbar-width: none;
    padding: 0 20px;
  }

  .scroll-container::-webkit-scrollbar {
    display: none;
  }

  .lines-spacer {
    height: 45%;
  }

  .lyric-line {
    font-family: var(--font-ui);
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.25);
    text-align: center;
    padding: 7px 4px;
    line-height: 1.55;
    cursor: default;
    user-select: none;
    transition: color 0.3s ease, font-size 0.3s ease, transform 0.3s ease;
    transform: scale(0.97);
  }

  .lyric-line.near {
    color: rgba(255, 255, 255, 0.42);
  }

  .lyric-line.active {
    font-family: var(--font-serif);
    font-size: clamp(1.1rem, 4vw, 1.5rem);
    font-weight: 500;
    color: #fff;
    transform: scale(1);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 8px;
    padding: 24px;
    text-align: center;
  }

  .empty-state p {
    font-family: var(--font-ui);
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.35);
    margin: 0;
  }

  .no-lyrics-track {
    font-size: 0.85rem !important;
    color: rgba(255, 255, 255, 0.6) !important;
    letter-spacing: 0.06em;
    margin-bottom: 2px !important;
  }

  .no-lyrics-artist {
    font-size: 0.7rem !important;
    color: rgba(255, 255, 255, 0.3) !important;
  }

  .muted {
    margin-top: 12px !important;
    color: rgba(255, 255, 255, 0.2) !important;
    font-size: 0.72rem !important;
  }

  .pulse-dot {
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    margin-bottom: 8px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(1.3); }
  }

  .thin-loader {
    width: 60px;
    height: 2px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 1px;
    overflow: hidden;
    position: relative;
  }

  .thin-loader::after {
    content: '';
    position: absolute;
    inset: 0;
    width: 40%;
    background: rgba(255, 255, 255, 0.35);
    animation: slide 1.2s ease-in-out infinite;
  }

  @keyframes slide {
    0%   { transform: translateX(-150%); }
    100% { transform: translateX(350%); }
  }
</style>
