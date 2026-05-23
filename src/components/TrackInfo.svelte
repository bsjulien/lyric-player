<script>
  import { currentTrack } from '../lib/store.js';

  let track = $derived($currentTrack);
</script>

{#if track}
  <div class="track-info">
    {#if track.albumArt}
      <img class="album-thumb" src={track.albumArt} alt={track.album} />
    {/if}
    <div class="meta">
      <div class="track-name">{track.name}</div>
      <div class="artist-name">{track.artists}</div>
    </div>
  </div>
  <div class="divider"></div>
{/if}

<style>
  .track-info {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 0 14px 11px;
    flex-shrink: 0;
  }

  .album-thumb {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow: hidden;
  }

  .track-name {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.82);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .artist-name {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.32);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .divider {
    height: 1px;
    margin: 0 14px;
    background: rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
  }
</style>
