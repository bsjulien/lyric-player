<script>
  import { startOAuthFlow } from '../lib/spotify.js';
  import { authState } from '../lib/store.js';

  let error = $state(null);
  let loading = $derived($authState === 'loading');

  async function connect() {
    error = null;
    try {
      await startOAuthFlow();
    } catch (e) {
      error = typeof e === 'string' ? e : (e?.message || String(e) || 'Authentication failed');
      authState.set('idle');
    }
  }
</script>

{#if loading}
  <div class="progress-bar">
    <div class="progress-track">
      <div class="progress-fill"></div>
    </div>
  </div>
{/if}

<div class="auth-screen">
  <div class="logo">♪</div>
  <h1 class="title">Lyric Player</h1>
  <p class="subtitle">Real-time lyrics synced to Spotify</p>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <button class="connect-btn" onclick={connect} disabled={loading}>
    {loading ? 'Opening Spotify…' : 'Connect Spotify'}
  </button>

  <p class="hint">Opens your browser to authorize — no password stored.</p>
</div>

<style>
  .progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    z-index: 100;
  }

  .progress-track {
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.06);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    width: 40%;
    background: var(--accent);
    animation: progress-slide 1.4s ease-in-out infinite;
  }

  @keyframes progress-slide {
    0%   { transform: translateX(-120%); }
    100% { transform: translateX(360%); }
  }

  .auth-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 32px 24px;
    text-align: center;
    gap: 8px;
  }

  .logo {
    font-size: 2.5rem;
    margin-bottom: 8px;
    opacity: 0.7;
  }

  .title {
    font-family: var(--font-serif);
    font-size: 1.4rem;
    font-weight: 400;
    color: rgba(255,255,255,0.9);
    margin: 0;
  }

  .subtitle {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.06em;
    margin: 0 0 20px;
  }

  .connect-btn {
    margin-top: 12px;
    padding: 10px 24px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.85);
    font-family: var(--font-ui);
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .connect-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.25);
  }

  .connect-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .hint {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    color: rgba(255,255,255,0.2);
    margin: 4px 0 0;
  }

  .error {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    color: rgba(255, 100, 100, 0.8);
    background: rgba(255, 60, 60, 0.08);
    border: 1px solid rgba(255, 60, 60, 0.15);
    border-radius: 6px;
    padding: 8px 14px;
    margin: 4px 0;
  }
</style>
