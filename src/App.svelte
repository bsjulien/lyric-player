<script>
  import { onMount } from 'svelte';
  import { authState, currentTrack } from './lib/store.js';
  import { loadStoredTokens } from './lib/spotify.js';
  import WindowControls from './components/WindowControls.svelte';
  import AuthScreen from './components/AuthScreen.svelte';
  import TrackInfo from './components/TrackInfo.svelte';
  import LyricsView from './components/LyricsView.svelte';

  let state = $derived($authState);
  let track = $derived($currentTrack);
  let albumArt = $derived(track?.albumArt ?? null);

  onMount(async () => {
    authState.set('loading');
    const hasTokens = await loadStoredTokens();
    if (!hasTokens) authState.set('idle');
  });
</script>

<!-- Ambient background: blurred album art -->
{#if albumArt}
  <div
    class="bg-art"
    style="background-image: url('{albumArt}')"
  ></div>
{/if}

<!-- Noise texture overlay -->
<div class="noise"></div>

<!-- Main window -->
<div class="window">
  <WindowControls />

  {#if state === 'idle' || state === 'loading' || state === 'error'}
    <AuthScreen />
  {:else}
    <TrackInfo />
    <LyricsView />
  {/if}
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(html, body) {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
  }

  :global(#app) {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .bg-art {
    position: fixed;
    inset: -60px;
    background-size: cover;
    background-position: center;
    filter: blur(60px) brightness(0.3) saturate(1.4);
    z-index: 0;
    transition: background-image 1s ease;
  }

  .noise {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 200px 200px;
    opacity: 0.5;
  }

  .window {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: rgba(12, 12, 13, 0.78);
    backdrop-filter: blur(24px) saturate(1.2);
    -webkit-backdrop-filter: blur(24px) saturate(1.2);
    border: 1px solid rgba(255, 255, 255, 0.07);
    overflow: hidden;
    box-shadow:
      0 0 0 0.5px rgba(0,0,0,0.6),
      0 24px 64px rgba(0,0,0,0.55),
      inset 0 1px 0 rgba(255,255,255,0.06);
  }
</style>
