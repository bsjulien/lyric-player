# Lyric Player

A minimal always-on-top desktop app that shows real-time synced lyrics for whatever is playing on Spotify.

Built with **Tauri v2** (Rust) + **Svelte 5**.

---

## Setup

### 1. Create a Spotify App

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in any name/description
4. Under **Redirect URIs**, add exactly: `http://127.0.0.1:9182/callback`
5. Select **Web API** under APIs used
6. Save — copy your **Client ID**

### 2. Configure the app

```bash
cp .env.example .env
# Edit .env and paste your Client ID:
# VITE_SPOTIFY_CLIENT_ID=your_client_id_here
```

### 3. Install dependencies

```bash
npm install
```

### 4. Install Rust (if not already)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## Running

```bash
npm run tauri dev
```

The app window will appear. Click **Connect Spotify** — your browser opens Spotify's authorization page. After approving, the window begins showing lyrics.

---

## Building

```bash
npm run tauri build
```

Produces a native `.dmg` (macOS) or `.msi`/`.exe` (Windows) in `src-tauri/target/release/bundle/`.

---

## How it works

1. **OAuth PKCE** — no client secret needed. A temporary local HTTP server on port 9182 captures the auth code after the browser redirect.
2. **Polling** — every 1 second, fetches `/me/player` from the Spotify Web API to get current track + position.
3. **Lyrics** — fetched once per track from [lrclib.net](https://lrclib.net) (free, no API key). Cached in memory.
4. **Sync** — `requestAnimationFrame` loop estimates playback position as `lastKnownPosition + (performance.now() - lastPollTime)` to stay smooth between 1-second polls.
5. **Scroll** — active lyric line is scrolled to vertical center via `scrollTo`.

---

## Project structure

```
src/
  lib/
    store.js      — Svelte stores: auth, track, lyrics, activeLineIndex
    spotify.js    — OAuth flow, token refresh, playback polling
    lyrics.js     — lrclib fetch, LRC parser, active-line calculator
  components/
    WindowControls.svelte  — drag region, pin/minimize/close buttons
    AuthScreen.svelte      — connect screen + loading state
    TrackInfo.svelte       — album thumb + track/artist names
    LyricsView.svelte      — lyrics scroll area + sync loop
  App.svelte      — root layout, ambient album art background
  app.css         — CSS custom properties, font imports, global resets
src-tauri/
  src/
    lib.rs        — Tauri setup, commands: OAuth server, open_url, window controls
    oauth.rs      — async TCP server that captures the OAuth callback code
  tauri.conf.json — window config (frameless, always-on-top, transparent, 340x520)
  capabilities/   — Tauri v2 permissions
```
