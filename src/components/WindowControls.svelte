<script>
  import { invoke } from '@tauri-apps/api/core';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { isAlwaysOnTop } from '../lib/store.js';
  import { logout } from '../lib/spotify.js';

  let pinned = $isAlwaysOnTop;

  async function togglePin() {
    pinned = !pinned;
    isAlwaysOnTop.set(pinned);
    await invoke('set_always_on_top', { onTop: pinned });
  }

  async function minimize() {
    const win = getCurrentWindow();
    await win.minimize();
  }

  async function close() {
    const win = getCurrentWindow();
    await win.close();
  }
</script>

<div class="controls" data-tauri-drag-region>
  <span class="app-name" data-tauri-drag-region>♪ Lyric Player</span>

  <div class="buttons">
    <button
      class="btn pin"
      class:active={pinned}
      onclick={togglePin}
      title={pinned ? 'Unpin from top' : 'Pin to top'}
      aria-label="Toggle always on top"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
      </svg>
    </button>

    <button class="btn minimize" onclick={minimize} title="Minimize" aria-label="Minimize">
      <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
        <rect width="10" height="2" rx="1"/>
      </svg>
    </button>

    <button class="btn close" onclick={close} title="Close" aria-label="Close">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 10px;
    height: 40px;
    flex-shrink: 0;
    cursor: default;
    -webkit-app-region: drag;
    app-region: drag;
  }

  .app-name {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.22);
    user-select: none;
    -webkit-app-region: drag;
    app-region: drag;
  }

  .buttons {
    display: flex;
    gap: 5px;
    align-items: center;
    -webkit-app-region: no-drag;
    app-region: no-drag;
  }

  .btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.28);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    padding: 0;
  }

  .btn:hover {
    background: rgba(255, 255, 255, 0.09);
    color: rgba(255, 255, 255, 0.8);
  }

  .btn.pin.active {
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.12);
  }

  .btn.close:hover {
    background: rgba(255, 70, 70, 0.2);
    color: rgb(255, 110, 110);
  }
</style>
