import { fetch } from '@tauri-apps/plugin-http';
import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import { accessToken, refreshToken, tokenExpiresAt, authState, currentTrack } from './store.js';
import { get } from 'svelte/store';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_PORT = 9182;
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`;

let store = null;

async function getStore() {
  if (!store) store = await Store.load('lyric-player.json');
  return store;
}

function generateVerifier() {
  const buf = new Uint8Array(64);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function loadStoredTokens() {
  try {
    const s = await getStore();
    const [at, rt, exp] = await Promise.all([
      s.get('access_token'),
      s.get('refresh_token'),
      s.get('expires_at'),
    ]);
    if (at && rt) {
      accessToken.set(at);
      refreshToken.set(rt);
      tokenExpiresAt.set(exp ?? 0);
      authState.set('authenticated');
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

async function saveTokens(at, rt, expiresIn) {
  const exp = Date.now() + expiresIn * 1000;
  const s = await getStore();
  await s.set('access_token', at);
  await s.set('refresh_token', rt);
  await s.set('expires_at', exp);
  await s.save();
  accessToken.set(at);
  refreshToken.set(rt);
  tokenExpiresAt.set(exp);
  authState.set('authenticated');
}

export async function startOAuthFlow() {
  if (!CLIENT_ID) throw new Error('VITE_SPOTIFY_CLIENT_ID is not set');
  authState.set('loading');

  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'user-read-playback-state',
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state: crypto.randomUUID(),
  });

  const serverPromise = invoke('start_oauth_server', { port: REDIRECT_PORT });
  await invoke('open_url', { url: `https://accounts.spotify.com/authorize?${params}` });

  const code = await serverPromise;
  if (!code) throw new Error('No auth code received');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = JSON.parse(await res.text());
  if (!data.access_token) {
    throw new Error(`Token exchange failed (${res.status}): ${data.error_description || data.error}`);
  }

  await saveTokens(data.access_token, data.refresh_token, data.expires_in);
}

export async function refreshAccessToken() {
  const rt = get(refreshToken);
  if (!rt) return false;

  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: rt,
      client_id: CLIENT_ID,
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = JSON.parse(await res.text());
    if (!data.access_token) return false;

    await saveTokens(data.access_token, data.refresh_token ?? rt, data.expires_in);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function fetchPlaybackState() {
  const exp = get(tokenExpiresAt);
  if (Date.now() > exp - 60_000) await refreshAccessToken();

  const token = get(accessToken);
  if (!token) return null;

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 204) { currentTrack.set(null); return null; }
    if (res.status === 401) { await refreshAccessToken(); return null; }

    const data = JSON.parse(await res.text());
    if (!data?.item) { currentTrack.set(null); return null; }

    const track = {
      id: data.item.id,
      name: data.item.name,
      artists: data.item.artists.map(a => a.name).join(', '),
      albumArt: data.item.album?.images?.[0]?.url ?? null,
      durationMs: data.item.duration_ms,
      progressMs: data.progress_ms ?? 0,
      isPlaying: data.is_playing,
    };

    currentTrack.set(track);
    return track;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function logout() {
  const s = await getStore();
  await s.delete('access_token');
  await s.delete('refresh_token');
  await s.delete('expires_at');
  await s.save();
  accessToken.set(null);
  refreshToken.set(null);
  tokenExpiresAt.set(0);
  authState.set('idle');
  currentTrack.set(null);
}
